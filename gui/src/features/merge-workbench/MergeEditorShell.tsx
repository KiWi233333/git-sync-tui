import type { ConflictFile, Resolution } from "../../types/workbench";
import { countUnresolvedChunks } from "./mergeSelectors";

interface MergeEditorShellProps {
  activeFile: ConflictFile | null;
  currentLabel: string;
  incomingLabel: string;
  resolutions: Record<string, Resolution>;
  onResolve: (chunkId: string, resolution: Resolution) => void;
}

function resolutionLabel(resolution: Resolution | undefined) {
  if (resolution === "incoming") return "接受传入";
  if (resolution === "current") return "接受当前";
  if (resolution === "both") return "组合";
  if (resolution === "manual") return "手动";
  return "未解决";
}

function resultLines(incoming: string[], current: string[], resolution: Resolution | undefined) {
  if (resolution === "incoming") return incoming;
  if (resolution === "current") return current;
  if (resolution === "both") return [...incoming, "", ...current];
  if (resolution === "manual") return ["// 手动处理：请在真实编辑器中调整该冲突块结果"];
  return ["// 尚未选择解决方案"];
}

function CodeLines({ lines, start }: { lines: string[]; start: number }) {
  return (
    <pre className="vscode-code-lines">
      {lines.map((line, index) => (
        <span className="vscode-code-line" key={`${start}-${index}`}>
          <span className="vscode-code-line__number">{start + index}</span>
          <span>{line || " "}</span>
        </span>
      ))}
    </pre>
  );
}

function LensButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="vscode-code-lens__button" type="button" onClick={onClick}>
      {children}
    </button>
  );
}

function SourcePane({
  title,
  label,
  side,
  activeFile,
  resolutions,
  onResolve,
}: {
  title: string;
  label: string;
  side: "incoming" | "current";
  activeFile: ConflictFile;
  resolutions: Record<string, Resolution>;
  onResolve: (chunkId: string, resolution: Resolution) => void;
}) {
  return (
    <section className={`vscode-merge-pane vscode-merge-pane--${side}`}>
      <div className="vscode-merge-pane__header">
        <span>{title}</span>
        <small>{label}</small>
      </div>
      <div className="vscode-merge-pane__body">
        {activeFile.chunks.map((chunk, index) => (
          <div className="vscode-conflict-source" key={`${side}-${chunk.id}`}>
            <div className="vscode-code-lens">
              {side === "incoming" ? (
                <LensButton onClick={() => onResolve(chunk.id, "incoming")}>接受传入</LensButton>
              ) : (
                <LensButton onClick={() => onResolve(chunk.id, "current")}>接受当前</LensButton>
              )}
              <span>|</span>
              <LensButton onClick={() => onResolve(chunk.id, "both")}>接受组合</LensButton>
              <span>|</span>
              <LensButton onClick={() => onResolve(chunk.id, "manual")}>忽略</LensButton>
              <span className="vscode-code-lens__state">{resolutionLabel(resolutions[chunk.id])}</span>
            </div>
            <CodeLines
              lines={side === "incoming" ? chunk.incoming : chunk.current}
              start={side === "incoming" ? chunk.incomingStart : chunk.currentStart}
            />
            {index < activeFile.chunks.length - 1 ? <div className="vscode-conflict-gap" /> : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ResultPane({
  activeFile,
  resolutions,
}: {
  activeFile: ConflictFile;
  resolutions: Record<string, Resolution>;
}) {
  return (
    <section className="vscode-merge-pane vscode-merge-pane--result">
      <div className="vscode-merge-pane__header">
        <span>结果</span>
        <small>{activeFile.path}</small>
      </div>
      <div className="vscode-merge-pane__body">
        {activeFile.chunks.map((chunk) => {
          const resolution = resolutions[chunk.id];
          const unresolved = !resolution || resolution === "unresolved";
          return (
            <div
              className={unresolved ? "vscode-result-conflict is-unresolved" : "vscode-result-conflict"}
              key={`result-${chunk.id}`}
            >
              <div className="vscode-code-lens vscode-code-lens--result">
                {unresolved ? "未接受任何更改" : resolutionLabel(resolution)}
              </div>
              <CodeLines
                lines={resultLines(chunk.incoming, chunk.current, resolution)}
                start={chunk.currentStart}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function MergeEditorShell({
  activeFile,
  currentLabel,
  incomingLabel,
  resolutions,
  onResolve,
}: MergeEditorShellProps) {
  const unresolvedCount = countUnresolvedChunks(activeFile, resolutions);

  if (!activeFile) {
    return <div className="merge-editor-shell merge-editor-shell--empty">请选择一个冲突文件。</div>;
  }

  return (
    <section className="merge-editor-shell" aria-labelledby="merge-editor-title">
      <div className="vscode-editor-tabs">
        <div className="vscode-editor-tab vscode-editor-tab--active">
          <span className="vscode-editor-tab__dot" />
          <strong id="merge-editor-title">正在合并: {activeFile.path}</strong>
        </div>
        <div className="vscode-editor-actions">✓ ↕ ⋯</div>
      </div>

      <div className="vscode-breadcrumbs">
        {activeFile.path.split("/").map((part, index) => (
          <span key={`${part}-${index}`}>{part}</span>
        ))}
      </div>

      <div className="vscode-merge-status">
        <span>{unresolvedCount === 0 ? "所有冲突块已处理" : `剩余 ${unresolvedCount} 个冲突块`}</span>
      </div>

      <div className="vscode-three-way-merge">
        <div className="vscode-merge-top">
          <SourcePane
            title="传入"
            label={incomingLabel}
            side="incoming"
            activeFile={activeFile}
            resolutions={resolutions}
            onResolve={onResolve}
          />
          <SourcePane
            title="当前"
            label={currentLabel}
            side="current"
            activeFile={activeFile}
            resolutions={resolutions}
            onResolve={onResolve}
          />
        </div>
        <ResultPane activeFile={activeFile} resolutions={resolutions} />
      </div>
    </section>
  );
}
