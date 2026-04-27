import { Select, Input, Button, Space, Radio, Spin, Tooltip } from "antd";
import { Folder, Cloud, HardDrive, AlertCircle, CheckCircle } from "lucide-react";
import type { BranchOption, ManagedRepositoryRecord, RepoMode, RepositoryOption } from "../../types/workbench";

interface ManagedRepositoryListProps {
  role: "current" | "target";
  loading: boolean;
  repositories: ManagedRepositoryRecord[];
  onUseRepository: (repositoryId: string) => void;
}

function ManagedRepositorySelect({ role, loading, repositories, onUseRepository }: ManagedRepositoryListProps) {
  if (loading) return <Spin size="small" />;
  if (!loading && repositories.length === 0) return <span style={{ color: "#71717a", fontSize: 12 }}>暂无历史托管仓库</span>;
  
  return (
    <Select
      size="small"
      style={{ width: 240 }}
      placeholder={`历史托管记录`}
      onChange={onUseRepository}
      options={repositories.map((repo) => ({
        value: repo.id,
        label: `${repo.name} (${repo.localPath})`,
      }))}
    />
  );
}

export interface RepositoryCascadeSelectorProps {
  kind: "current" | "target";
  title: string;
  description: string;
  mode: RepoMode;
  repoId: string;
  branch: string;
  repoOptions: RepositoryOption[];
  branches: BranchOption[];
  localPath: string | null;
  managedPath: string | null;
  fallbackPath: string;
  cleanState: boolean | null;
  managedCleanState: boolean | null;
  remoteUrl: string;
  cloneRoot: string | null;
  managedRepositories: ManagedRepositoryRecord[];
  managedRepoLoading: boolean;
  cloneLoading: boolean;
  onModeChange: (mode: RepoMode) => void;
  onRepoChange: (repoId: string) => void;
  onBranchChange: (branch: string) => void;
  onRemoteUrlChange: (value: string) => void;
  onPickCloneRoot: () => void;
  onCloneManaged: () => void;
  onUseManagedRepository: (repositoryId: string) => void;
  onPickLocalDirectory: () => void;
}

export function RepositoryCascadeSelector({
  kind,
  title,
  mode,
  repoId,
  branch,
  repoOptions,
  branches,
  localPath,
  managedPath,
  fallbackPath,
  cleanState,
  managedCleanState,
  remoteUrl,
  cloneRoot,
  managedRepositories,
  managedRepoLoading,
  cloneLoading,
  onModeChange,
  onRepoChange,
  onBranchChange,
  onRemoteUrlChange,
  onPickCloneRoot,
  onCloneManaged,
  onUseManagedRepository,
  onPickLocalDirectory,
}: RepositoryCascadeSelectorProps) {
  const selectedPath = mode === "local" ? localPath ?? fallbackPath : managedPath ?? fallbackPath;
  const selectedCleanState = mode === "local" ? cleanState : managedCleanState;
  const filteredRepoOptions = repoOptions.filter((repo) => repo.mode === mode);
  
  const cleanIcon = selectedCleanState === null ? null : selectedCleanState ? <CheckCircle size={14} color="#52c41a" /> : <AlertCircle size={14} color="#faad14" />;
  const cleanTooltip = selectedCleanState === null ? "工作区状态未知" : selectedCleanState ? "工作区干净" : "存在未提交变更";

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#e4e4e7", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ 
          display: "inline-block", 
          width: 6, 
          height: 16, 
          borderRadius: 3, 
          background: kind === "current" ? "#3b82f6" : "#a855f7" 
        }} />
        {title}
        {cleanIcon && <Tooltip title={cleanTooltip}>{cleanIcon}</Tooltip>}
      </div>

      <div style={{ background: "rgba(24, 24, 27, 0.6)", border: "1px solid #27272a", borderRadius: 8, padding: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            options={[
              { value: "local", label: <Space><HardDrive size={14} />本地仓库</Space> },
              { value: "clone", label: <Space><Cloud size={14} />远程托管</Space> },
            ]}
          />

          <Space.Compact style={{ width: "100%" }}>
            <Select
              style={{ width: "60%" }}
              value={repoId}
              onChange={onRepoChange}
              placeholder="选择仓库"
              options={filteredRepoOptions.map((repo) => ({
                value: repo.id,
                label: `${repo.name} · ${repo.source}`,
              }))}
            />
            <Select
              style={{ width: "40%" }}
              value={branch}
              onChange={onBranchChange}
              placeholder="选择分支"
              options={branches.map((b) => ({
                value: b.name,
                label: `${b.name}`,
              }))}
            />
          </Space.Compact>

          {mode === "clone" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
              <Input
                value={remoteUrl}
                onChange={(e) => onRemoteUrlChange(e.target.value)}
                placeholder="输入远程仓库地址 (git@github.com:...)"
                addonAfter={
                  <Button type="primary" onClick={onCloneManaged} loading={cloneLoading} style={{ border: "none", height: "100%" }}>
                    克隆
                  </Button>
                }
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Space size="small">
                  <Button size="small" type="text" onClick={onPickCloneRoot} icon={<Folder size={14} />}>
                    更改存放目录
                  </Button>
                  <ManagedRepositorySelect
                    role={kind}
                    loading={managedRepoLoading}
                    repositories={managedRepositories}
                    onUseRepository={onUseManagedRepository}
                  />
                </Space>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 4 }}>
              <Button type="dashed" block onClick={onPickLocalDirectory} icon={<Folder size={14} />}>
                打开本地文件夹...
              </Button>
            </div>
          )}

          {selectedPath && (
            <div style={{ fontSize: 12, color: "#71717a", background: "#09090b", padding: "4px 8px", borderRadius: 4, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {selectedPath}
            </div>
          )}
        </Space>
      </div>
    </div>
  );
}
