import type { BranchOption, ManagedRepositoryRecord, RepoMode, RepositoryOption } from "../../types/workbench";

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
  managedRepoLoading: boolean;
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
  managedRepoLoading,
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
  onNext,
}: WorkspaceSetupStepProps) {
  return (
    <section className="setup-view">
      <div className="section-heading section-heading--workspace">
        <div>
          <div className="section-kicker">Workspace</div>
          <h1>配置工作区</h1>
          <p>先确定接收方与提供方。默认走托管 clone，也可切换到本地已有仓库，后续所有 cherry-pick 会在这套工作区里执行。</p>
        </div>
        <div className="setup-overview">
          <div className="overview-pill">
            <span className="overview-pill__label">当前模式</span>
            <span className="overview-pill__value">{currentRepoMode === "clone" ? "托管克隆" : "本地目录"}</span>
          </div>
          <div className="overview-pill">
            <span className="overview-pill__label">目标来源</span>
            <span className="overview-pill__value">{targetRepoId === "target-local" ? "本地仓库" : "远端仓库"}</span>
          </div>
        </div>
      </div>

      <div className="desktop-status">
        <span className="desktop-status__label">桌面桥接</span>
        <span className={`desktop-status__value ${desktopStatus === "desktop-bridge-ready" ? "is-ready" : ""}`}>
          {desktopStatus}
        </span>
      </div>

      <div className="setup-grid">
        <article className="setup-card">
          <div className="setup-card__eyebrow">Current Workspace</div>
          <div className="setup-card__title">接收方（当前仓库）</div>
          <div className="setup-card__subtitle">执行 cherry-pick 的真实工作目录，冲突解决和提交都发生在这里。</div>
          <div className="mode-switch">
            <button
              className={currentRepoMode === "clone" ? "is-active" : ""}
              onClick={() => onCurrentRepoModeChange("clone")}
            >
              独立沙箱克隆
            </button>
            <button
              className={currentRepoMode === "local" ? "is-active" : ""}
              onClick={() => onCurrentRepoModeChange("local")}
            >
              选择本地目录
            </button>
          </div>

          <label>
            <span>接收仓库</span>
            <select value={currentRepoId} onChange={(event) => onCurrentRepoChange(event.target.value)}>
              {currentRepoOptions
                .filter((repo) => repo.mode === currentRepoMode)
                .map((repo) => (
                  <option value={repo.id} key={repo.id}>
                    {repo.name} · {repo.source}
                  </option>
                ))}
            </select>
          </label>

          <label>
            <span>检出分支</span>
            <select value={currentBranch} onChange={(event) => onCurrentBranchChange(event.target.value)}>
              {currentBranches.map((branch) => (
                <option value={branch.name} key={branch.name}>
                  {branch.name} · {branch.summary}
                </option>
              ))}
            </select>
          </label>

          <div className="summary-box">
            <div className="summary-box__label">工作目录</div>
            <div>{currentRepoMode === "local" ? currentLocalPath ?? currentRepo.path : currentManagedPath ?? currentRepo.path}</div>
            {currentRepoMode === "local" && currentRepoCleanState !== null && (
              <div className="summary-box__meta">
                工作区状态：{currentRepoCleanState ? "干净" : "存在未提交变更"}
              </div>
            )}
            {currentRepoMode === "clone" && currentManagedCleanState !== null && (
              <div className="summary-box__meta">
                托管克隆状态：{currentManagedCleanState ? "干净" : "存在未提交变更"}
              </div>
            )}
          </div>

          {currentRepoMode === "clone" ? (
            <>
              <label>
                <span>远端仓库地址</span>
                <input
                  value={currentCloneUrl}
                  onChange={(event) => onCurrentCloneUrlChange(event.target.value)}
                  placeholder="git@github.com:org/project.git"
                />
              </label>
              <div className="stack-actions">
                <button className="secondary-action" onClick={onPickCurrentCloneRoot}>
                  选择 clone 根目录
                </button>
                <div className="summary-box">
                  <div className="summary-box__label">Clone 根目录</div>
                  <div>{currentCloneRoot ?? "默认：~/.git-sync-gui/worktrees"}</div>
                </div>
                <button className="primary-action" onClick={onCloneCurrentManaged} disabled={cloneLoading === "current"}>
                  {cloneLoading === "current" ? "克隆中..." : "执行托管克隆"}
                </button>
              </div>
              <div className="managed-list">
                <div className="managed-list__title">已托管仓库</div>
                {managedRepoLoading ? <div className="managed-card">正在读取托管仓库...</div> : null}
                {!managedRepoLoading && managedRepositories.length === 0 ? (
                  <div className="managed-card">暂无已托管仓库，先执行一次克隆。</div>
                ) : null}
                {managedRepositories.map((repo) => (
                  <div className="managed-card" key={`current-${repo.id}`}>
                    <div className="managed-card__title">{repo.name}</div>
                    <div className="managed-card__meta">{repo.repositoryUrl}</div>
                    <div className="managed-card__meta">{repo.localPath}</div>
                    <button className="secondary-action secondary-action--small" onClick={() => onUseManagedForCurrent(repo.id)}>
                      作为当前仓库
                    </button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <button className="secondary-action" onClick={onPickCurrentDirectory}>
              选择当前仓库目录
            </button>
          )}
        </article>

        <article className="setup-card setup-card--accent">
          <div className="setup-card__eyebrow">Source Repository</div>
          <div className="setup-card__title">提供方（目标仓库）</div>
          <div className="setup-card__subtitle">用于读取 commit 历史并按原顺序同步到当前仓库。</div>

          <label>
            <span>目标仓库</span>
            <select value={targetRepoId} onChange={(event) => onTargetRepoChange(event.target.value)}>
              {targetRepoOptions.map((repo) => (
                <option value={repo.id} key={repo.id}>
                  {repo.name} · {repo.source}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>选择分支获取 commits</span>
            <select value={targetBranch} onChange={(event) => onTargetBranchChange(event.target.value)}>
              {targetBranches.map((branch) => (
                <option value={branch.name} key={branch.name}>
                  {branch.name} · {branch.summary}
                </option>
              ))}
            </select>
          </label>

          <div className="summary-box">
            <div className="summary-box__label">仓库地址 / 路径</div>
            <div>{targetRepo.mode === "local" ? targetLocalPath ?? targetRepo.path : targetManagedPath ?? targetRemoteUrl}</div>
            {targetRepo.id === "target-local" && targetRepoCleanState !== null && (
              <div className="summary-box__meta">
                目标仓库状态：{targetRepoCleanState ? "干净" : "存在未提交变更"}
              </div>
            )}
            {targetRepo.id === "target-remote" && targetManagedCleanState !== null && (
              <div className="summary-box__meta">
                远端托管克隆状态：{targetManagedCleanState ? "干净" : "存在未提交变更"}
              </div>
            )}
          </div>

          <div className="stack-actions">
            {targetRepoId === "target-local" ? (
              <button className="secondary-action" onClick={onPickTargetDirectory}>
                选择目标仓库目录
              </button>
            ) : (
              <>
                <label>
                  <span>远端仓库地址</span>
                  <input
                    value={targetRemoteUrl}
                    onChange={(event) => onTargetRemoteUrlChange(event.target.value)}
                    placeholder="git@github.com:org/upstream.git"
                  />
                </label>
                <button className="secondary-action" onClick={onPickTargetCloneRoot}>
                  选择 clone 根目录
                </button>
                <div className="summary-box">
                  <div className="summary-box__label">Clone 根目录</div>
                  <div>{targetCloneRoot ?? "默认：~/.git-sync-gui/worktrees"}</div>
                </div>
                <button className="primary-action" onClick={onCloneTargetManaged} disabled={cloneLoading === "target"}>
                  {cloneLoading === "target" ? "克隆中..." : "克隆目标仓库并读取 commits"}
                </button>
                <div className="managed-list">
                  <div className="managed-list__title">已托管仓库</div>
                  {managedRepoLoading ? <div className="managed-card">正在读取托管仓库...</div> : null}
                  {!managedRepoLoading && managedRepositories.length === 0 ? (
                    <div className="managed-card">暂无已托管仓库，先执行一次克隆。</div>
                  ) : null}
                  {managedRepositories.map((repo) => (
                    <div className="managed-card" key={`target-${repo.id}`}>
                      <div className="managed-card__title">{repo.name}</div>
                      <div className="managed-card__meta">{repo.repositoryUrl}</div>
                      <div className="managed-card__meta">{repo.localPath}</div>
                      <button className="secondary-action secondary-action--small" onClick={() => onUseManagedForTarget(repo.id)}>
                        作为目标仓库
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>
      </div>

      <div className="page-actions">
        <div className="helper-text">
          下一步进入 commit 选择，支持跨跃勾选但按原顺序执行。
          {cloneError ? <span className="helper-text helper-text--error"> 克隆失败：{cloneError}</span> : null}
        </div>
        <button className="primary-action" onClick={onNext}>
          下一步：选择 Commits
        </button>
      </div>
    </section>
  );
}
