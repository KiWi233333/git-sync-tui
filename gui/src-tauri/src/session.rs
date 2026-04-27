use crate::workspace::CommitItem;
use serde::{Deserialize, Serialize};
use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
    process::Command,
    sync::{
        atomic::{AtomicU64, Ordering},
        Mutex,
    },
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::State;

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SessionStatus {
    Created,
    Running,
    Conflicted,
    Completed,
    Failed,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionCreatePayload {
    pub current_repo_name: String,
    pub current_repo_path: Option<String>,
    pub current_branch: String,
    pub create_same_branch_name: bool,
    pub target_repo_name: String,
    pub target_repo_path: Option<String>,
    pub target_branch: String,
    pub queue: Vec<CommitItem>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionContinuePayload {
    pub session_id: String,
    pub commit_message: String,
    pub resolutions: HashMap<String, String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConflictChunk {
    pub id: String,
    pub incoming_start: usize,
    pub current_start: usize,
    pub incoming: Vec<String>,
    pub current: Vec<String>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionFile {
    pub path: String,
    pub kind: String,
    pub status: String,
    pub chunks: Vec<ConflictChunk>,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionDetail {
    pub id: String,
    pub status: SessionStatus,
    pub current_repo_name: String,
    pub current_repo_path: Option<String>,
    pub current_branch: String,
    pub create_same_branch_name: bool,
    pub target_repo_name: String,
    pub target_repo_path: Option<String>,
    pub target_branch: String,
    pub queue: Vec<CommitItem>,
    pub total_commits: usize,
    pub completed_count: usize,
    pub current_commit_index: Option<usize>,
    pub current_commit: Option<CommitItem>,
    pub conflict_files: Vec<SessionFile>,
    pub staged_files: Vec<SessionFile>,
    pub created_at: u64,
    pub updated_at: u64,
    pub last_error: Option<String>,
}

#[derive(Default)]
pub struct SessionRegistry {
    next_id: AtomicU64,
    sessions: Mutex<HashMap<String, SessionDetail>>,
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis() as u64)
        .unwrap_or(0)
}

fn next_session_id(registry: &SessionRegistry) -> String {
    let id = registry.next_id.fetch_add(1, Ordering::Relaxed) + 1;
    format!("session-{id:04}")
}

fn run_git(repo_path: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .map_err(|error| format!("git command failed: {error}"))?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

fn run_git_with_status(repo_path: &str, args: &[&str]) -> Result<(bool, String, String), String> {
    let output = Command::new("git")
        .arg("-C")
        .arg(repo_path)
        .args(args)
        .output()
        .map_err(|error| format!("git command failed: {error}"))?;

    Ok((
        output.status.success(),
        String::from_utf8_lossy(&output.stdout).trim().to_string(),
        String::from_utf8_lossy(&output.stderr).trim().to_string(),
    ))
}

fn resolve_repo_root(path: &str) -> Result<String, String> {
    if !Path::new(path).exists() {
        return Err(format!(
            "当前仓库路径不存在：{path}。托管 clone 工作流还未接入，请先选择本地仓库。"
        ));
    }

    run_git(path, &["rev-parse", "--show-toplevel"])
}

fn normalize_repo_source(path: Option<String>) -> Result<Option<String>, String> {
    let Some(path) = path else {
        return Ok(None);
    };

    if Path::new(&path).exists() {
        Ok(Some(resolve_repo_root(&path)?))
    } else {
        Ok(Some(path))
    }
}

fn ensure_repo_clean(repo_path: &str) -> Result<(), String> {
    let status = run_git(repo_path, &["status", "--porcelain"])?;
    if status.is_empty() {
        Ok(())
    } else {
        Err("当前仓库存在未提交改动，请先清理后再开始 Cherry-Pick。".to_string())
    }
}

fn fetch_target_branch(session: &SessionDetail) -> Result<(), String> {
    let Some(repo_path) = session.current_repo_path.as_deref() else {
        return Err("当前会话缺少 current repository path".to_string());
    };
    let Some(target_repo_path) = session.target_repo_path.as_deref() else {
        return Ok(());
    };

    run_git(
        repo_path,
        &[
            "fetch",
            "--no-tags",
            target_repo_path,
            &session.target_branch,
        ],
    )
    .map(|_| ())
}

fn branch_exists(repo_path: &str, branch: &str) -> Result<bool, String> {
    let branch_ref = format!("refs/heads/{branch}");
    let (success, _, _) = run_git_with_status(repo_path, &["rev-parse", "--verify", &branch_ref])?;
    Ok(success)
}

fn prepare_current_branch(session: &mut SessionDetail) -> Result<(), String> {
    let Some(repo_path) = session.current_repo_path.as_deref() else {
        return Err("当前会话缺少 current repository path".to_string());
    };
    let repo_path = repo_path.to_string();

    run_git(&repo_path, &["checkout", &session.current_branch])?;
    if !session.create_same_branch_name || session.current_branch == session.target_branch {
        return Ok(());
    }

    if branch_exists(&repo_path, &session.target_branch)? {
        run_git(&repo_path, &["checkout", &session.target_branch])?;
    } else {
        run_git(
            &repo_path,
            &[
                "checkout",
                "-b",
                &session.target_branch,
                &session.current_branch,
            ],
        )?;
    }
    session.current_branch = session.target_branch.clone();
    Ok(())
}

fn is_cherry_pick_in_progress(repo_path: &str) -> Result<bool, String> {
    let (success, _, _) = run_git_with_status(
        repo_path,
        &["rev-parse", "-q", "--verify", "CHERRY_PICK_HEAD"],
    )?;
    Ok(success)
}

fn git_path(repo_path: &str, name: &str) -> Result<String, String> {
    run_git(repo_path, &["rev-parse", "--git-path", name])
}

fn is_conflicted_xy(x: char, y: char) -> bool {
    matches!(
        (x, y),
        ('U', 'U') | ('A', 'A') | ('D', 'D') | ('A', 'U') | ('U', 'A') | ('D', 'U') | ('U', 'D')
    )
}

fn normalize_file_status(x: char, y: char) -> String {
    if is_conflicted_xy(x, y) {
        "C".to_string()
    } else if x != ' ' {
        x.to_string()
    } else if y != ' ' {
        y.to_string()
    } else {
        "M".to_string()
    }
}

fn parse_conflict_chunks(
    file_path: &Path,
    relative_path: &str,
) -> Result<Vec<ConflictChunk>, String> {
    let content = fs::read_to_string(file_path)
        .map_err(|error| format!("读取冲突文件失败 {}: {error}", relative_path))?;
    let lines = content.lines().collect::<Vec<_>>();
    let mut index = 0usize;
    let mut chunk_index = 0usize;
    let mut chunks = Vec::new();

    while index < lines.len() {
        if !lines[index].starts_with("<<<<<<<") {
            index += 1;
            continue;
        }

        let current_start = index + 1;
        index += 1;

        let mut current = Vec::new();
        while index < lines.len() && !lines[index].starts_with("=======") {
            current.push(lines[index].to_string());
            index += 1;
        }

        if index >= lines.len() {
            break;
        }

        index += 1;
        let incoming_start = index + 1;
        let mut incoming = Vec::new();
        while index < lines.len() && !lines[index].starts_with(">>>>>>>") {
            incoming.push(lines[index].to_string());
            index += 1;
        }

        if index < lines.len() {
            index += 1;
        }

        chunk_index += 1;
        chunks.push(ConflictChunk {
            id: format!("{relative_path}::chunk-{chunk_index}"),
            incoming_start,
            current_start,
            incoming,
            current,
        });
    }

    Ok(chunks)
}

fn scan_session_files(repo_path: &str) -> Result<(Vec<SessionFile>, Vec<SessionFile>), String> {
    let status = run_git(repo_path, &["status", "--porcelain"])?;
    let mut conflict_files = Vec::new();
    let mut staged_files = Vec::new();

    for line in status.lines().filter(|line| !line.trim().is_empty()) {
        if line.len() < 4 {
            continue;
        }

        let chars = line.chars().collect::<Vec<_>>();
        let x = chars[0];
        let y = chars[1];
        let path_text = line[3..].trim();
        let relative_path = if let Some((_, after)) = path_text.split_once(" -> ") {
            after.to_string()
        } else {
            path_text.to_string()
        };
        let absolute_path = PathBuf::from(repo_path).join(&relative_path);

        if is_conflicted_xy(x, y) {
            conflict_files.push(SessionFile {
                path: relative_path.clone(),
                kind: "conflict".to_string(),
                status: normalize_file_status(x, y),
                chunks: parse_conflict_chunks(&absolute_path, &relative_path)?,
            });
            continue;
        }

        if x != ' ' && x != '?' {
            staged_files.push(SessionFile {
                path: relative_path,
                kind: "staged".to_string(),
                status: normalize_file_status(x, y),
                chunks: Vec::new(),
            });
        }
    }

    Ok((conflict_files, staged_files))
}

fn refresh_session_files(session: &mut SessionDetail) -> Result<(), String> {
    let Some(repo_path) = session.current_repo_path.as_deref() else {
        session.conflict_files = Vec::new();
        session.staged_files = Vec::new();
        return Ok(());
    };

    let (conflict_files, staged_files) = scan_session_files(repo_path)?;
    session.conflict_files = conflict_files;
    session.staged_files = staged_files;
    session.updated_at = now_ms();
    Ok(())
}

fn write_merge_message(repo_path: &str, message: &str) -> Result<(), String> {
    let merge_msg_path = git_path(repo_path, "MERGE_MSG")?;
    fs::write(&merge_msg_path, format!("{}\n", message.trim()))
        .map_err(|error| format!("写入 MERGE_MSG 失败: {error}"))
}

fn render_resolved_content(
    content: &str,
    relative_path: &str,
    resolutions: &HashMap<String, String>,
) -> Result<String, String> {
    let mut output = Vec::new();
    let lines = content.lines().collect::<Vec<_>>();
    let mut index = 0usize;
    let mut chunk_index = 0usize;

    while index < lines.len() {
        if !lines[index].starts_with("<<<<<<<") {
            output.push(lines[index].to_string());
            index += 1;
            continue;
        }

        index += 1;
        let mut current = Vec::new();
        while index < lines.len() && !lines[index].starts_with("=======") {
            current.push(lines[index].to_string());
            index += 1;
        }

        if index >= lines.len() {
            return Err(format!("冲突块格式异常：{relative_path}"));
        }

        index += 1;
        let mut incoming = Vec::new();
        while index < lines.len() && !lines[index].starts_with(">>>>>>>") {
            incoming.push(lines[index].to_string());
            index += 1;
        }

        if index >= lines.len() {
            return Err(format!("冲突块结束标记缺失：{relative_path}"));
        }

        index += 1;
        chunk_index += 1;
        let chunk_id = format!("{relative_path}::chunk-{chunk_index}");
        let resolution = resolutions
            .get(&chunk_id)
            .map(|value| value.as_str())
            .unwrap_or("unresolved");

        match resolution {
            "incoming" => output.extend(incoming),
            "current" => output.extend(current),
            "both" => {
                output.extend(incoming);
                output.push(String::new());
                output.extend(current);
            }
            _ => {
                return Err(format!("冲突块尚未解决：{chunk_id}"));
            }
        }
    }

    Ok(output.join("\n") + "\n")
}

fn apply_conflict_resolutions(
    repo_path: &str,
    conflict_files: &[SessionFile],
    resolutions: &HashMap<String, String>,
) -> Result<(), String> {
    for file in conflict_files {
        let absolute_path = PathBuf::from(repo_path).join(&file.path);
        let content = fs::read_to_string(&absolute_path)
            .map_err(|error| format!("读取冲突文件失败 {}: {error}", file.path))?;
        let resolved = render_resolved_content(&content, &file.path, resolutions)?;
        fs::write(&absolute_path, resolved)
            .map_err(|error| format!("写入解决后的文件失败 {}: {error}", file.path))?;
        run_git(repo_path, &["add", &file.path])?;
    }
    Ok(())
}

fn run_until_conflict_or_complete(session: &mut SessionDetail) -> Result<(), String> {
    let repo_path = session
        .current_repo_path
        .as_deref()
        .ok_or_else(|| "当前会话缺少 current repository path".to_string())?;

    session.status = SessionStatus::Running;
    session.last_error = None;

    while session.completed_count < session.total_commits {
        let current_index = session.completed_count;
        let commit = session
            .queue
            .get(current_index)
            .cloned()
            .ok_or_else(|| "session queue 越界".to_string())?;

        let (success, _stdout, stderr) =
            run_git_with_status(repo_path, &["cherry-pick", &commit.hash])?;
        if success {
            session.completed_count += 1;
            session.current_commit_index = None;
            session.current_commit = None;
            session.conflict_files.clear();
            session.staged_files.clear();
            continue;
        }

        if is_cherry_pick_in_progress(repo_path)? {
            session.status = SessionStatus::Conflicted;
            session.current_commit_index = Some(current_index);
            session.current_commit = Some(commit);
            session.last_error = None;
            refresh_session_files(session)?;
            return Ok(());
        }

        session.status = SessionStatus::Failed;
        session.current_commit_index = Some(current_index);
        session.current_commit = Some(commit);
        session.last_error = Some(stderr.clone());
        refresh_session_files(session)?;
        return Err(if stderr.is_empty() {
            "cherry-pick 执行失败".to_string()
        } else {
            stderr
        });
    }

    session.status = SessionStatus::Completed;
    session.current_commit_index = None;
    session.current_commit = None;
    session.conflict_files.clear();
    session.staged_files.clear();
    session.updated_at = now_ms();
    Ok(())
}

#[tauri::command]
pub fn session_create(
    payload: SessionCreatePayload,
    registry: State<'_, SessionRegistry>,
) -> Result<SessionDetail, String> {
    if payload.queue.is_empty() {
        return Err("至少需要选择 1 个 commit 才能创建会话".to_string());
    }

    let current_repo_path = payload
        .current_repo_path
        .as_deref()
        .ok_or_else(|| "请先选择当前仓库目录".to_string())?;
    let root_path = resolve_repo_root(current_repo_path)?;
    ensure_repo_clean(&root_path)?;

    let timestamp = now_ms();
    let detail = SessionDetail {
        id: next_session_id(&registry),
        status: SessionStatus::Created,
        current_repo_name: payload.current_repo_name,
        current_repo_path: Some(root_path),
        current_branch: payload.current_branch,
        create_same_branch_name: payload.create_same_branch_name,
        target_repo_name: payload.target_repo_name,
        target_repo_path: normalize_repo_source(payload.target_repo_path)?,
        target_branch: payload.target_branch,
        total_commits: payload.queue.len(),
        queue: payload.queue,
        completed_count: 0,
        current_commit_index: None,
        current_commit: None,
        conflict_files: Vec::new(),
        staged_files: Vec::new(),
        created_at: timestamp,
        updated_at: timestamp,
        last_error: None,
    };

    let mut sessions = registry
        .sessions
        .lock()
        .map_err(|_| "session registry lock poisoned".to_string())?;
    sessions.insert(detail.id.clone(), detail.clone());

    Ok(detail)
}

#[tauri::command]
pub fn session_start(
    session_id: String,
    registry: State<'_, SessionRegistry>,
) -> Result<SessionDetail, String> {
    let mut sessions = registry
        .sessions
        .lock()
        .map_err(|_| "session registry lock poisoned".to_string())?;

    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("session not found: {session_id}"))?;
    let repo_path = session
        .current_repo_path
        .as_deref()
        .ok_or_else(|| "当前会话缺少 current repository path".to_string())?
        .to_string();

    ensure_repo_clean(&repo_path)?;
    prepare_current_branch(session)?;
    fetch_target_branch(session)?;
    run_until_conflict_or_complete(session)?;
    refresh_session_files(session)?;
    Ok(session.clone())
}

#[tauri::command]
pub fn session_get_detail(
    session_id: String,
    registry: State<'_, SessionRegistry>,
) -> Result<SessionDetail, String> {
    let mut sessions = registry
        .sessions
        .lock()
        .map_err(|_| "session registry lock poisoned".to_string())?;

    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("session not found: {session_id}"))?;
    refresh_session_files(session)?;
    Ok(session.clone())
}

#[tauri::command]
pub fn session_continue(
    payload: SessionContinuePayload,
    registry: State<'_, SessionRegistry>,
) -> Result<SessionDetail, String> {
    if payload.commit_message.trim().is_empty() {
        return Err("提交信息不能为空".to_string());
    }

    let mut sessions = registry
        .sessions
        .lock()
        .map_err(|_| "session registry lock poisoned".to_string())?;

    let session = sessions
        .get_mut(&payload.session_id)
        .ok_or_else(|| format!("session not found: {}", payload.session_id))?;
    let repo_path = session
        .current_repo_path
        .as_deref()
        .ok_or_else(|| "当前会话缺少 current repository path".to_string())?
        .to_string();

    refresh_session_files(session)?;
    if session.conflict_files.is_empty() {
        return Err("当前没有处于冲突中的文件，无法继续 Cherry-Pick。".to_string());
    }

    apply_conflict_resolutions(&repo_path, &session.conflict_files, &payload.resolutions)?;
    write_merge_message(&repo_path, &payload.commit_message)?;

    let (success, _stdout, stderr) =
        run_git_with_status(&repo_path, &["cherry-pick", "--continue"])?;
    if !success && !is_cherry_pick_in_progress(&repo_path)? {
        session.status = SessionStatus::Failed;
        session.last_error = Some(stderr.clone());
        refresh_session_files(session)?;
        return Err(if stderr.is_empty() {
            "cherry-pick --continue 执行失败".to_string()
        } else {
            stderr
        });
    }

    if success {
        session.completed_count += 1;
    }

    run_until_conflict_or_complete(session)?;
    refresh_session_files(session)?;
    Ok(session.clone())
}

#[tauri::command]
pub fn session_abort(
    session_id: String,
    registry: State<'_, SessionRegistry>,
) -> Result<SessionDetail, String> {
    let mut sessions = registry
        .sessions
        .lock()
        .map_err(|_| "session registry lock poisoned".to_string())?;

    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| format!("session not found: {session_id}"))?;

    if let Some(repo_path) = session.current_repo_path.as_deref() {
        if is_cherry_pick_in_progress(repo_path)? {
            run_git(repo_path, &["cherry-pick", "--abort"])?;
        }
    }

    session.status = SessionStatus::Failed;
    session.current_commit_index = None;
    session.current_commit = None;
    session.conflict_files.clear();
    session.staged_files.clear();
    session.updated_at = now_ms();
    session.last_error = Some("session aborted by user".to_string());

    Ok(session.clone())
}

#[cfg(test)]
mod tests {
    use super::{is_conflicted_xy, render_resolved_content};
    use std::collections::HashMap;

    #[test]
    fn detects_conflict_status_pairs() {
        assert!(is_conflicted_xy('U', 'U'));
        assert!(is_conflicted_xy('A', 'U'));
        assert!(!is_conflicted_xy('M', ' '));
    }

    #[test]
    fn renders_conflict_resolution() {
        let content = "<<<<<<< HEAD\ncurrent\n=======\nincoming\n>>>>>>> feature\n";
        let mut resolutions = HashMap::new();
        resolutions.insert("file.txt::chunk-1".to_string(), "incoming".to_string());

        let resolved = render_resolved_content(content, "file.txt", &resolutions).unwrap();
        assert_eq!(resolved, "incoming\n");
    }
}
