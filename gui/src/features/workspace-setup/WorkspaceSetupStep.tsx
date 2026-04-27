import { Button, Checkbox, Space, Typography, Tag } from "antd";
import { ArrowRight, AlertTriangle, CheckCircle } from "lucide-react";
import type { BranchOption, ManagedRepositoryRecord, RepoMode, RepositoryOption } from "../../types/workbench";
import { RepositoryCascadeSelector } from "./RepositoryCascadeSelector";
import type { WorkspaceReadiness } from "./workspaceReadiness";

const { Title, Text } = Typography;

interface WorkspaceSetupStepProps {
  currentRepoMode: RepoMode;
  currentRepoId: string;
  currentBranch: string;
  targetRepoId: string;
  targetBranch: string;
  currentRepoOptions: RepositoryOption[];
  targetRepoOptions: RepositoryOption[];
  currentRepo: RepositoryOption;
  targetRepo: RepositoryOption;
  currentBranches: BranchOption[];
  targetBranches: BranchOption[];
  currentLocalPath: string | null;
  currentManagedPath: string | null;
  targetLocalPath: string | null;
  targetManagedPath: string | null;
  currentRepoCleanState: boolean | null;
  currentManagedCleanState: boolean | null;
  targetRepoCleanState: boolean | null;
  targetManagedCleanState: boolean | null;
  currentCloneUrl: string;
  currentCloneRoot: string | null;
  targetRemoteUrl: string;
  targetCloneRoot: string | null;
  managedRepositories: ManagedRepositoryRecord[];
  desktopStatus: string;
  cloneLoading: "current" | "target" | null;
  cloneError: string | null;
  readiness: WorkspaceReadiness;
  managedRepoLoading: boolean;
  createSameBranchName: boolean;
  onCurrentRepoModeChange: (mode: RepoMode) => void;
  onCurrentRepoChange: (repoId: string) => void;
  onCurrentBranchChange: (branch: string) => void;
  onTargetRepoChange: (repoId: string) => void;
  onTargetBranchChange: (branch: string) => void;
  onCurrentCloneUrlChange: (value: string) => void;
  onTargetRemoteUrlChange: (value: string) => void;
  onPickCurrentCloneRoot: () => void;
  onPickTargetCloneRoot: () => void;
  onCloneCurrentManaged: () => void;
  onCloneTargetManaged: () => void;
  onUseManagedForCurrent: (repositoryId: string) => void;
  onUseManagedForTarget: (repositoryId: string) => void;
  onPickCurrentDirectory: () => void;
  onPickTargetDirectory: () => void;
  onCreateSameBranchNameChange: (enabled: boolean) => void;
  onNext: () => void;
}

export function WorkspaceSetupStep({
  currentRepoMode,
  currentRepoId,
  currentBranch,
  targetRepoId,
  targetBranch,
  currentRepoOptions,
  targetRepoOptions,
  currentRepo,
  targetRepo,
  currentBranches,
  targetBranches,
  currentLocalPath,
  currentManagedPath,
  targetLocalPath,
  targetManagedPath,
  currentRepoCleanState,
  currentManagedCleanState,
  targetRepoCleanState,
  targetManagedCleanState,
  currentCloneUrl,
  currentCloneRoot,
  targetRemoteUrl,
  targetCloneRoot,
  managedRepositories,
  desktopStatus,
  cloneLoading,
  cloneError,
  readiness,
  managedRepoLoading,
  createSameBranchName,
  onCurrentRepoModeChange,
  onCurrentRepoChange,
  onCurrentBranchChange,
  onTargetRepoChange,
  onTargetBranchChange,
  onCurrentCloneUrlChange,
  onTargetRemoteUrlChange,
  onPickCurrentCloneRoot,
  onPickTargetCloneRoot,
  onCloneCurrentManaged,
  onCloneTargetManaged,
  onUseManagedForCurrent,
  onUseManagedForTarget,
  onPickCurrentDirectory,
  onPickTargetDirectory,
  onCreateSameBranchNameChange,
  onNext,
}: WorkspaceSetupStepProps) {
  const targetRepoMode: RepoMode = targetRepoId === "target-local" ? "local" : "clone";

  function handleTargetModeChange(mode: RepoMode) {
    onTargetRepoChange(mode === "local" ? "target-local" : "target-remote");
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "#09090b" }}>
      <div style={{ flex: 1, overflow: "auto", padding: "40px 0" }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 16, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>CP</div>
            <Title level={3} style={{ marginTop: 0, marginBottom: 8, color: "#fafafa" }}>准备 Cherry-Pick 会话</Title>
            <Text type="secondary">配置接收方和提供方仓库后，将分析目标分支的 Commit 差异。</Text>
          </div>

          <RepositoryCascadeSelector
            kind="current"
            title="接收方（当前仓库）"
            description="真实执行 cherry-pick、解决冲突和提交的工作目录。"
            mode={currentRepoMode}
            repoId={currentRepoId}
            branch={currentBranch}
            repoOptions={currentRepoOptions}
            branches={currentBranches}
            localPath={currentLocalPath}
            managedPath={currentManagedPath}
            fallbackPath={currentRepo.path}
            cleanState={currentRepoCleanState}
            managedCleanState={currentManagedCleanState}
            remoteUrl={currentCloneUrl}
            cloneRoot={currentCloneRoot}
            managedRepositories={managedRepositories}
            managedRepoLoading={managedRepoLoading}
            cloneLoading={cloneLoading === "current"}
            onModeChange={onCurrentRepoModeChange}
            onRepoChange={onCurrentRepoChange}
            onBranchChange={onCurrentBranchChange}
            onRemoteUrlChange={onCurrentCloneUrlChange}
            onPickCloneRoot={onPickCurrentCloneRoot}
            onCloneManaged={onCloneCurrentManaged}
            onUseManagedRepository={onUseManagedForCurrent}
            onPickLocalDirectory={onPickCurrentDirectory}
          />

          <div style={{ display: "flex", justifyContent: "center", margin: "-12px 0 12px 0", position: "relative", zIndex: 10 }}>
            <div style={{ background: "#09090b", padding: "4px" }}>
              <ArrowRight size={20} color="#71717a" style={{ transform: "rotate(90deg)" }} />
            </div>
          </div>

          <RepositoryCascadeSelector
            kind="target"
            title="提供方（目标仓库）"
            description="用于读取目标分支 commits，并按原时间线同步到接收方。"
            mode={targetRepoMode}
            repoId={targetRepoId}
            branch={targetBranch}
            repoOptions={targetRepoOptions}
            branches={targetBranches}
            localPath={targetLocalPath}
            managedPath={targetManagedPath}
            fallbackPath={targetRepo.mode === "local" ? targetRepo.path : targetRemoteUrl}
            cleanState={targetRepoCleanState}
            managedCleanState={targetManagedCleanState}
            remoteUrl={targetRemoteUrl}
            cloneRoot={targetCloneRoot}
            managedRepositories={managedRepositories}
            managedRepoLoading={managedRepoLoading}
            cloneLoading={cloneLoading === "target"}
            onModeChange={handleTargetModeChange}
            onRepoChange={onTargetRepoChange}
            onBranchChange={onTargetBranchChange}
            onRemoteUrlChange={onTargetRemoteUrlChange}
            onPickCloneRoot={onPickTargetCloneRoot}
            onCloneManaged={onCloneTargetManaged}
            onUseManagedRepository={onUseManagedForTarget}
            onPickLocalDirectory={onPickTargetDirectory}
          />
        </div>
      </div>

      <div style={{ padding: "16px 32px", background: "#18181b", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Checkbox
          checked={createSameBranchName}
          onChange={(e) => onCreateSameBranchNameChange(e.target.checked)}
        >
          <span style={{ fontWeight: 600, color: "#fafafa" }}>新建相同分支名</span>
          <Text type="secondary" style={{ display: "block", fontSize: 12, marginLeft: 24 }}>
            开始时在接收方切换到提供方同名分支；不存在则按 CLI 流程从所选接收方分支创建。
          </Text>
        </Checkbox>
        
        <Space size="middle">
          <Space>
            <Tag icon={desktopStatus === "desktop-bridge-ready" ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} color={desktopStatus === "desktop-bridge-ready" ? "success" : "warning"} bordered={false}>
              {desktopStatus}
            </Tag>
            {readiness.reason && (
              <Tag color={readiness.tone === "danger" ? "error" : "warning"} bordered={false}>{readiness.reason}</Tag>
            )}
            {cloneError && (
              <Tag color="error" bordered={false}>克隆失败：{cloneError}</Tag>
            )}
          </Space>
          <Button type="primary" onClick={onNext} disabled={!readiness.canContinue} size="large" style={{ minWidth: 160 }}>
            下一步
          </Button>
        </Space>
      </div>
    </div>
  );
}
