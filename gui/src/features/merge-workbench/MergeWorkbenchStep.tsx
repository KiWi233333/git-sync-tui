import type {
  CommitItem,
  ConflictFile,
  MergeViewMode,
  Resolution,
  SessionDetail,
} from "../../types/workbench";

interface MergeWorkbenchStepProps {
  currentRepoName: string;
  currentBranch: string;
  targetRepoName: string;
  targetBranch: string;
  mergeMode: MergeViewMode;
  activeFile: ConflictFile | null;
  conflictFiles: ConflictFile[];
  stagedFiles: ConflictFile[];
  unresolvedCount: number;
  commitMessage: string;
  resolutions: Record<string, Resolution>;
  orderedQueue: CommitItem[];
  sessionDetail: SessionDetail | null;
  sessionError: string | null;
  sessionBusy: boolean;
  onCommitMessageChange: (message: string) => void;
  onMergeModeChange: (mode: MergeViewMode) => void;
  onActiveFileChange: (path: string) => void;
  onResolveChunk: (chunkId: string, resolution: Resolution) => void;
  onContinue: () => void;
  onAbort: () => void;
}

function resolveLabel(value: Resolution) {
  switch (value) {
    case "incoming":
      return "接受传入";
    case "current":
      return "接受当前";
    case "both":
      return "接受组合";
    default:
      return "未解决";
  }
}

function resolvedResult(
  incoming: string[],
  current: string[],
  resolution: Resolution,
) {
  if (resolution === "incoming") return incoming;
  if (resolution === "current") return current;
  if (resolution === "both") return [...incoming, "", ...current];
  return [""];
}

export function MergeWorkbenchStep({
  currentRepoName,
  currentBranch,
  targetRepoName,
  targetBranch,
  mergeMode,
  activeFile,
  conflictFiles,
  stagedFiles,
  unresolvedCount,
  commitMessage,
  resolutions,
  orderedQueue,
  sessionDetail,
  sessionError,
  sessionBusy,
  onCommitMessageChange,
  onMergeModeChange,
  onActiveFileChange,
  onResolveChunk,
  onContinue,
  onAbort,
}: MergeWorkbenchStepProps) {
  const queueText = orderedQueue.map((commit) => commit.shortHash).join(" -> ");
  const isCompleted = sessionDetail?.status === "completed";
  const activeChunkCount = activeFile?.chunks.length ?? 0;

  return (
    <section className="merge-view">
      <aside className="scm-panel">
        <div className="scm-panel__header">
          <div className="panel-title">源代码管理</div>
          <div className="panel-meta">Session</div>
        </div>

        <div className="composer-card">
          <div className="composer-card__title">提交说明</div>
          <textarea value={commitMessage} onChange={(event) => onCommitMessageChange(event.target.value)} />
          <button className="primary-action primary-action--full" onClick={onContinue} disabled={sessionBusy}>
            继续 Cherry-pick
          </button>
          <button className="ghost-action ghost-action--full" onClick={onAbort} disabled={sessionBusy}>
            放弃本次会话
          </button>
        </div>

        <div className="queue-summary">
          <div className="summary-box__label">执行队列</div>
          <div className="queue-summary__text">{queueText}</div>
        </div>

        {sessionDetail ? (
          <div className="queue-summary">
            <div className="summary-box__label">当前会话</div>
            <div className="queue-summary__text">
              <div>ID: {sessionDetail.id}</div>
              <div>状态: {sessionDetail.status}</div>
              <div>
                进度: {sessionDetail.completedCount}/{sessionDetail.totalCommits}
              </div>
              <div>
                当前 Commit: {sessionDetail.currentCommit?.shortHash ?? "--"}{" "}
                {sessionDetail.currentCommit?.message ?? "等待执行"}
              </div>
            </div>
          </div>
        ) : null}

        <div className="file-group">
          <div className="file-group__heading">
            <div className="file-group__title">合并更改</div>
            <span className="file-group__count">{conflictFiles.length}</span>
          </div>
          {conflictFiles.map((file) => (
            <button
              key={file.path}
              className={`file-item ${activeFile?.path === file.path ? "is-active" : ""}`}
              onClick={() => onActiveFileChange(file.path)}
            >
              <span className="file-item__path">{file.path}</span>
              <span className="status-badge status-badge--danger">{file.status}</span>
            </button>
          ))}
          {conflictFiles.length === 0 ? <div className="file-item file-item--static">当前无冲突文件</div> : null}
        </div>

        <div className="file-group">
          <div className="file-group__heading">
            <div className="file-group__title">暂存的更改</div>
            <span className="file-group__count file-group__count--muted">{stagedFiles.length}</span>
          </div>
          {stagedFiles.map((file) => (
            <div key={file.path} className="file-item file-item--static">
              <span className="file-item__path">{file.path}</span>
              <span className="status-badge">{file.status}</span>
            </div>
          ))}
          {stagedFiles.length === 0 ? <div className="file-item file-item--static">当前无暂存文件</div> : null}
        </div>
      </aside>

      <section className="editor-shell">
        <div className="editor-tabs">
          <div className="editor-tab editor-tab--active">
            <span className="editor-tab__dot" />
            <span>{activeFile?.path ?? "merge-result"}</span>
          </div>
        </div>
        <div className="editor-toolbar">
          <div>
            <div className="editor-toolbar__title">
              {activeFile ? `正在合并：${activeFile.path}` : isCompleted ? "本轮 Cherry-Pick 已完成" : "当前无冲突文件"}
            </div>
            <div className="editor-toolbar__meta">
              {activeFile ? `共 ${activeChunkCount} 个冲突块，剩余 ${unresolvedCount} 个未解决` : isCompleted ? "所有选中 commits 已完成" : "可以继续检查 staged 状态"}
            </div>
          </div>
          <div className="segmented">
            <button className={mergeMode === "diff" ? "is-active" : ""} onClick={() => onMergeModeChange("diff")}>
              Diff
            </button>
            <button className={mergeMode === "merge" ? "is-active" : ""} onClick={() => onMergeModeChange("merge")}>
              Diff + Merge
            </button>
          </div>
        </div>

        {activeFile ? mergeMode === "diff" ? (
          <div className="diff-layout">
            {activeFile.chunks.map((chunk) => (
              <div key={chunk.id} className="diff-chunk-card">
                <div className="chunk-toolbar">
                  <span>{chunk.id}</span>
                  <span className="status-badge">{resolveLabel(resolutions[chunk.id])}</span>
                </div>
                <div className="diff-grid">
                  <div className="code-pane code-pane--incoming">
                    <div className="code-pane__header">传入 ({targetRepoName}/{targetBranch})</div>
                    {chunk.incoming.map((line, index) => (
                      <div className="code-line" key={`incoming-${index}`}>
                        <span className="code-line__number">{chunk.incomingStart + index}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                  <div className="code-pane code-pane--current">
                    <div className="code-pane__header">当前 ({currentRepoName}/{currentBranch})</div>
                    {chunk.current.map((line, index) => (
                      <div className="code-line" key={`current-${index}`}>
                        <span className="code-line__number">{chunk.currentStart + index}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="chunk-actions">
                  <button className="chunk-action chunk-action--incoming" onClick={() => onResolveChunk(chunk.id, "incoming")}>接受传入</button>
                  <button className="chunk-action chunk-action--current" onClick={() => onResolveChunk(chunk.id, "current")}>接受当前</button>
                  <button className="chunk-action" onClick={() => onResolveChunk(chunk.id, "both")}>接受组合</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="merge-layout">
            {activeFile.chunks.map((chunk) => (
              <div key={chunk.id} className="merge-chunk">
                <div className="merge-grid">
                  <div className="code-pane code-pane--incoming">
                    <div className="code-pane__header">传入 ({targetRepoName}/{targetBranch})</div>
                    {chunk.incoming.map((line, index) => (
                      <div className="code-line" key={`merge-incoming-${index}`}>
                        <span className="code-line__number">{chunk.incomingStart + index}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>

                  <div className="code-pane code-pane--current">
                    <div className="code-pane__header">当前 ({currentRepoName}/{currentBranch})</div>
                    {chunk.current.map((line, index) => (
                      <div className="code-line" key={`merge-current-${index}`}>
                        <span className="code-line__number">{chunk.currentStart + index}</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="chunk-actions">
                  <button className="chunk-action chunk-action--incoming" onClick={() => onResolveChunk(chunk.id, "incoming")}>接受传入</button>
                  <button className="chunk-action chunk-action--current" onClick={() => onResolveChunk(chunk.id, "current")}>接受当前</button>
                  <button className="chunk-action" onClick={() => onResolveChunk(chunk.id, "both")}>接受组合</button>
                </div>

                <div className="code-pane code-pane--result">
                  <div className="code-pane__header">最终结果</div>
                  {resolvedResult(chunk.incoming, chunk.current, resolutions[chunk.id]).map((line, index) => (
                    <div
                      className={`code-line ${resolutions[chunk.id] === "unresolved" ? "code-line--warning" : ""}`}
                      key={`result-${index}`}
                    >
                      <span className="code-line__number">{index + 40}</span>
                      <span>{line || " "}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="table-state">
            {isCompleted
              ? "当前会话已经完成。下一步可以补充真实的提交历史、结果校验和会话归档。"
              : "当前轮次没有检测到冲突文件，你可以查看左侧暂存区或继续后续流程。"}
          </div>
        )}

        <div className="footer-bar footer-bar--merge">
          <div className="helper-text">
            支持接近 VS Code 的 diff 与 merge 工作流。
            {activeFile ? <> 当前文件 <strong>{activeFile.path}</strong> 可逐块解决后进入 staged。</> : null}
            {sessionError ? <span className="helper-text helper-text--error"> 会话错误：{sessionError}</span> : null}
          </div>
          <button className="secondary-action" disabled={!activeFile || unresolvedCount > 0}>
            {!activeFile ? "当前无冲突文件" : unresolvedCount > 0 ? `剩余 ${unresolvedCount} 个冲突块` : "当前文件已解决"}
          </button>
        </div>
      </section>
    </section>
  );
}
