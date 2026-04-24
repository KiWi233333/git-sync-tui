import type { CommitItem } from "../../types/workbench";

interface CommitSelectionStepProps {
  targetRepoName: string;
  targetBranch: string;
  commits: CommitItem[];
  commitLoading: boolean;
  commitError: string | null;
  commitSourceLabel: string;
  selectedHashes: Set<string>;
  orderedQueue: CommitItem[];
  queueText: string;
  sessionError: string | null;
  startDisabled: boolean;
  onToggleCommit: (hash: string) => void;
  onBack: () => void;
  onStart: () => void;
  onRefresh: () => void;
}

export function CommitSelectionStep({
  targetRepoName,
  targetBranch,
  commits,
  commitLoading,
  commitError,
  commitSourceLabel,
  selectedHashes,
  orderedQueue,
  queueText,
  sessionError,
  startDisabled,
  onToggleCommit,
  onBack,
  onStart,
  onRefresh,
}: CommitSelectionStepProps) {
  return (
    <section className="commits-view">
      <div className="section-heading section-heading--compact">
        <div>
          <div className="section-kicker">Commit Queue</div>
          <h1>选择要同步的 Commits</h1>
          <p>
            来源分支：<code>{targetRepoName}/{targetBranch}</code>。你可以任意跨跃勾选，系统会自动按时间线正序执行。
          </p>
        </div>
        <button className="secondary-action secondary-action--small" onClick={onRefresh}>
          刷新列表
        </button>
      </div>

      <div className="commit-toolbar">
        <div className="overview-pill">
          <span className="overview-pill__label">数据源</span>
          <span className="overview-pill__value commit-toolbar__mono">{commitSourceLabel}</span>
        </div>
        <div className="overview-pill">
          <span className="overview-pill__label">已选 Commit</span>
          <span className="overview-pill__value">{orderedQueue.length}</span>
        </div>
        <div className="overview-pill">
          <span className="overview-pill__label">执行顺序</span>
          <span className="overview-pill__value commit-toolbar__mono">{queueText || "--"}</span>
        </div>
      </div>

      <div className="table-shell">
        {commitLoading ? (
          <div className="table-state">正在加载目标仓库 commits...</div>
        ) : commitError ? (
          <div className="table-state table-state--error">读取 commits 失败：{commitError}</div>
        ) : commits.length === 0 ? (
          <div className="table-state">当前分支暂无可显示 commits。</div>
        ) : (
          <table className="commit-table">
            <thead>
              <tr>
                <th className="w-check">选中</th>
                <th>Hash</th>
                <th>Message</th>
                <th>Author</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {commits.map((commit) => {
                const checked = selectedHashes.has(commit.hash);
                return (
                  <tr key={commit.hash} className={checked ? "is-selected" : ""}>
                    <td>
                      <input type="checkbox" checked={checked} onChange={() => onToggleCommit(commit.hash)} />
                    </td>
                    <td className="mono">{commit.shortHash}</td>
                    <td className="message-cell">{commit.message}</td>
                    <td>{commit.author}</td>
                    <td>{commit.date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="footer-bar">
        <div className="helper-text">
          已选择 <strong>{orderedQueue.length}</strong> 个 Commit。系统将按时间线正序 <code>{queueText}</code> 执行。
          {sessionError ? <span className="helper-text helper-text--error"> 会话创建失败：{sessionError}</span> : null}
        </div>
        <div className="footer-actions">
          <button className="ghost-action" onClick={onBack}>
            返回
          </button>
          <button className="primary-action" onClick={onStart} disabled={startDisabled}>
            开始 Cherry-Pick
          </button>
        </div>
      </div>
    </section>
  );
}
