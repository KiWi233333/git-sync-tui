interface LoadingOverlayProps {
  queueText: string;
}

export function LoadingOverlay({ queueText }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="spinner" />
      <div className="loading-overlay__title">正在按正序同步选中的 Commits...</div>
      <div className="loading-overlay__meta">执行序列：{queueText}</div>
    </div>
  );
}
