use serde::{Deserialize, Serialize};
use std::{
    env,
    fs,
    path::{Path, PathBuf},
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceBranch {
    pub name: String,
    pub summary: String,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RepositoryInspection {
    pub path: String,
    pub root_path: String,
    pub current_branch: String,
    pub is_clean: bool,
    pub branches: Vec<WorkspaceBranch>,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitItem {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub date: String,
    pub order: usize,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CommitListResponse {
    pub path: String,
    pub branch: String,
    pub commits: Vec<CommitItem>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedClonePayload {
    pub repository_url: String,
    pub destination_root: Option<String>,
    pub directory_name: Option<String>,
    pub branch: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedCloneResult {
    pub repository_url: String,
    pub destination_root: String,
    pub inspection: RepositoryInspection,
}

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ManagedRepositoryIndexEntry {
    pub id: String,
    pub name: String,
    pub repository_url: String,
    pub local_path: String,
    pub destination_root: String,
    pub last_used_at: u64,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManagedRepositoryRecord {
    pub id: String,
    pub name: String,
    pub repository_url: String,
    pub local_path: String,
    pub destination_root: String,
    pub last_used_at: u64,
    pub inspection: RepositoryInspection,
}

fn run_git(args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .args(args)
        .output()
        .map_err(|error| format!("git command failed: {error}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn inspect_repository(path: String) -> Result<RepositoryInspection, String> {
    let root_path = run_git(&["-C", &path, "rev-parse", "--show-toplevel"])?;
    let current_branch = run_git(&["-C", &root_path, "rev-parse", "--abbrev-ref", "HEAD"])?;
    let status = run_git(&["-C", &root_path, "status", "--porcelain"])?;
    let branch_output = run_git(&[
        "-C",
        &root_path,
        "branch",
        "--format=%(refname:short)",
    ])?;

    let branches = branch_output
        .lines()
        .filter(|line| !line.trim().is_empty())
        .map(|line| WorkspaceBranch {
            name: line.trim().to_string(),
            summary: if line.trim() == current_branch {
                "当前分支".to_string()
            } else {
                "本地分支".to_string()
            },
        })
        .collect::<Vec<_>>();

    Ok(RepositoryInspection {
        path,
        root_path,
        current_branch,
        is_clean: status.is_empty(),
        branches,
    })
}

fn default_clone_root() -> Result<String, String> {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "无法确定默认 clone 目录，请手动选择目录".to_string())?;
    Ok(PathBuf::from(home)
        .join(".git-sync-gui")
        .join("worktrees")
        .to_string_lossy()
        .to_string())
}

fn default_app_root() -> Result<PathBuf, String> {
    let home = env::var("HOME")
        .or_else(|_| env::var("USERPROFILE"))
        .map_err(|_| "无法确定应用目录".to_string())?;
    Ok(PathBuf::from(home).join(".git-sync-gui"))
}

fn managed_index_path() -> Result<PathBuf, String> {
    Ok(default_app_root()?.join("repositories.json"))
}

fn derive_directory_name(repository_url: &str) -> String {
    let trimmed = repository_url.trim_end_matches('/').trim_end_matches(".git");
    let last = trimmed
        .rsplit(['/', ':'])
        .next()
        .filter(|value| !value.is_empty())
        .unwrap_or("managed-repo");
    last.to_string()
}

fn ensure_clone_destination(destination: &Path) -> Result<(), String> {
    if destination.exists() {
        if destination.join(".git").exists() {
            return Ok(());
        }

        let is_empty = fs::read_dir(destination)
            .map_err(|error| format!("读取 clone 目录失败: {error}"))?
            .next()
            .is_none();
        if is_empty {
            return Ok(());
        }

        return Err(format!(
            "clone 目录已存在且不是 Git 仓库：{}",
            destination.display()
        ));
    }

    if let Some(parent) = destination.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("创建 clone 父目录失败: {error}"))?;
    }

    Ok(())
}

fn read_managed_index() -> Result<Vec<ManagedRepositoryIndexEntry>, String> {
    let path = managed_index_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }

    let text = fs::read_to_string(&path).map_err(|error| format!("读取仓库索引失败: {error}"))?;
    if text.trim().is_empty() {
        return Ok(Vec::new());
    }

    serde_json::from_str(&text).map_err(|error| format!("解析仓库索引失败: {error}"))
}

fn write_managed_index(entries: &[ManagedRepositoryIndexEntry]) -> Result<(), String> {
    let path = managed_index_path()?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| format!("创建仓库索引目录失败: {error}"))?;
    }

    let content =
        serde_json::to_string_pretty(entries).map_err(|error| format!("序列化仓库索引失败: {error}"))?;
    fs::write(path, content).map_err(|error| format!("写入仓库索引失败: {error}"))
}

fn upsert_managed_repository(
    repository_url: &str,
    destination_root: &str,
    inspection: &RepositoryInspection,
) -> Result<(), String> {
    let mut entries = read_managed_index()?;
    let repo_name = Path::new(&inspection.root_path)
        .file_name()
        .and_then(|value| value.to_str())
        .unwrap_or("managed-repo")
        .to_string();

    let existing = entries
        .iter_mut()
        .find(|entry| entry.local_path == inspection.root_path || entry.repository_url == repository_url);

    if let Some(entry) = existing {
        entry.name = repo_name;
        entry.repository_url = repository_url.to_string();
        entry.local_path = inspection.root_path.clone();
        entry.destination_root = destination_root.to_string();
        entry.last_used_at = now_ms();
    } else {
        entries.push(ManagedRepositoryIndexEntry {
            id: format!("managed-{}", now_ms()),
            name: repo_name,
            repository_url: repository_url.to_string(),
            local_path: inspection.root_path.clone(),
            destination_root: destination_root.to_string(),
            last_used_at: now_ms(),
        });
    }

    entries.sort_by(|a, b| b.last_used_at.cmp(&a.last_used_at));
    write_managed_index(&entries)
}

#[tauri::command]
pub fn workspace_inspect_repository(path: String) -> Result<RepositoryInspection, String> {
    inspect_repository(path)
}

#[tauri::command]
pub fn commit_list_repository(
    path: String,
    branch: String,
    limit: Option<usize>,
) -> Result<CommitListResponse, String> {
    let root_path = run_git(&["-C", &path, "rev-parse", "--show-toplevel"])?;
    let max_count = limit.unwrap_or(100).to_string();
    let output = run_git(&[
        "-C",
        &root_path,
        "log",
        &branch,
        "--first-parent",
        &format!("--max-count={max_count}"),
        "--format=%H%n%h%n%s%n%an%n%ar%n---",
    ])?;

    let commits = output
        .split("\n---\n")
        .filter(|block| !block.trim().is_empty())
        .enumerate()
        .map(|(index, block)| {
            let parts = block.lines().collect::<Vec<_>>();
            CommitItem {
                hash: parts.first().unwrap_or(&"").to_string(),
                short_hash: parts.get(1).unwrap_or(&"").to_string(),
                message: parts.get(2).unwrap_or(&"").to_string(),
                author: parts.get(3).unwrap_or(&"").to_string(),
                date: parts.get(4).unwrap_or(&"").to_string(),
                order: index,
            }
        })
        .collect::<Vec<_>>();

    Ok(CommitListResponse {
        path: root_path,
        branch,
        commits,
    })
}

#[tauri::command]
pub fn workspace_clone_managed_repository(
    payload: ManagedClonePayload,
) -> Result<ManagedCloneResult, String> {
    let repository_url = payload.repository_url.trim().to_string();
    if repository_url.is_empty() {
        return Err("仓库地址不能为空".to_string());
    }

    let destination_root = payload.destination_root.unwrap_or(default_clone_root()?);
    fs::create_dir_all(&destination_root)
        .map_err(|error| format!("创建 clone 根目录失败: {error}"))?;

    let directory_name = payload
        .directory_name
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(|| derive_directory_name(&repository_url));
    let destination = PathBuf::from(&destination_root).join(directory_name);

    ensure_clone_destination(&destination)?;

    if !destination.join(".git").exists() {
        let mut args = vec!["clone"];
        if let Some(branch) = payload.branch.as_deref().filter(|value| !value.trim().is_empty()) {
            args.push("--branch");
            args.push(branch);
        }
        args.push(&repository_url);
        let destination_text = destination.to_string_lossy().to_string();
        args.push(&destination_text);
        run_git(&args)?;
    }

    let inspection = inspect_repository(destination.to_string_lossy().to_string())?;
    upsert_managed_repository(&repository_url, &destination_root, &inspection)?;
    Ok(ManagedCloneResult {
        repository_url,
        destination_root,
        inspection,
    })
}

#[tauri::command]
pub fn workspace_list_managed_repositories() -> Result<Vec<ManagedRepositoryRecord>, String> {
    let entries = read_managed_index()?;
    let mut valid_entries = Vec::new();
    let mut records = Vec::new();

    for entry in entries {
        if !Path::new(&entry.local_path).exists() {
            continue;
        }

        let inspection = match inspect_repository(entry.local_path.clone()) {
            Ok(value) => value,
            Err(_) => continue,
        };

        valid_entries.push(ManagedRepositoryIndexEntry {
            id: entry.id.clone(),
            name: entry.name.clone(),
            repository_url: entry.repository_url.clone(),
            local_path: inspection.root_path.clone(),
            destination_root: entry.destination_root.clone(),
            last_used_at: entry.last_used_at,
        });
        records.push(ManagedRepositoryRecord {
            id: entry.id,
            name: entry.name,
            repository_url: entry.repository_url,
            local_path: inspection.root_path.clone(),
            destination_root: entry.destination_root,
            last_used_at: entry.last_used_at,
            inspection,
        });
    }

    write_managed_index(&valid_entries)?;
    Ok(records)
}
