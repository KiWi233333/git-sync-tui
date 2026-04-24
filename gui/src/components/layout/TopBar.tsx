interface TopBarProps {
  showPath: boolean;
  currentRepoName: string;
  targetRepoName: string;
  targetBranch: string;
}

export function TopBar({
  showPath,
  currentRepoName,
  targetRepoName,
  targetBranch,
}: TopBarProps) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand__icon">CP</div>
        <div>
          <div className="brand__title">Cherry-Pick 工作站</div>
          <div className="brand__subtitle">Desktop Merge Console</div>
        </div>
      </div>

      {showPath ? (
        <div className="header-path">
          <div className="header-chip">
            <span className="header-chip__label">当前</span>
            <span className="header-chip__value">{currentRepoName}</span>
          </div>
          <span className="header-path__flow">PULL</span>
          <div className="header-chip">
            <span className="header-chip__label">目标</span>
            <span className="header-chip__value">{targetRepoName}</span>
          </div>
          <div className="header-chip header-chip--branch">
            <span className="header-chip__label">分支</span>
            <span className="header-chip__value">{targetBranch}</span>
          </div>
        </div>
      ) : (
        <div className="header-path header-path--muted">配置当前仓库与目标仓库，准备建立同步会话</div>
      )}

      <button className="icon-button">设置</button>
    </header>
  );
}
