import type { SessionDetail } from "../../types/workbench";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";

interface FinishSummaryStepProps {
  sessionDetail: SessionDetail | null;
  onNewSession: () => void;
  onBackToCommits: () => void;
}

export function FinishSummaryStep({ sessionDetail, onNewSession, onBackToCommits }: FinishSummaryStepProps) {
  return (
    <section className="finish-view" aria-labelledby="finish-title">
      <div className="finish-card">
        <Badge tone="success">completed</Badge>
        <h1 id="finish-title">同步完成</h1>
        <p>所有选中的 commits 已按时间线处理完成。</p>

        <div className="finish-grid" aria-label="同步摘要">
          <div>
            <span>Commits</span>
            <strong>{sessionDetail?.totalCommits ?? 0}</strong>
          </div>
          <div>
            <span>已处理</span>
            <strong>{sessionDetail?.completedCount ?? 0}</strong>
          </div>
          <div>
            <span>当前分支</span>
            <strong>{sessionDetail?.currentBranch ?? "-"}</strong>
          </div>
          <div>
            <span>目标分支</span>
            <strong>{sessionDetail?.targetBranch ?? "-"}</strong>
          </div>
        </div>

        <div className="finish-path" title={sessionDetail?.currentRepoPath ?? undefined}>
          {sessionDetail?.currentRepoPath ?? "未记录仓库路径"}
        </div>

        <div className="finish-actions">
          <Button type="button" variant="primary" onClick={onNewSession}>
            开始新的同步
          </Button>
          <Button type="button" variant="secondary" onClick={onBackToCommits}>
            返回 commit 选择
          </Button>
        </div>
      </div>
    </section>
  );
}
