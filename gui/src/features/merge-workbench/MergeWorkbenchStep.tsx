import React from "react";
import type {
  CommitItem,
  ConflictFile,
  MergeViewMode,
  Resolution,
  SessionDetail,
} from "../../types/workbench";
import { Button, Layout, Typography, Alert, Space } from "antd";
import { MergeEditorShell } from "./MergeEditorShell";
import { canContinueConflictCommit } from "./mergeSelectors";
import { ScmPanel } from "./ScmPanel";

const { Content, Sider, Footer } = Layout;
const { Text } = Typography;

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

export function MergeWorkbenchStep({
  currentRepoName,
  currentBranch,
  targetRepoName,
  targetBranch,
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
  onActiveFileChange,
  onResolveChunk,
  onContinue,
  onAbort,
}: MergeWorkbenchStepProps) {
  const queueText = orderedQueue.map((commit) => commit.shortHash).join(" -> ");
  const isCompleted = sessionDetail?.status === "completed";
  const canContinue = canContinueConflictCommit(conflictFiles, resolutions);
  const activePath = activeFile?.path ?? "";

  return (
    <Layout style={{ height: "100%", overflow: "hidden", background: "#09090b" }}>
      <Layout hasSider>
        <Sider width={320} style={{ background: "#18181b", borderRight: "1px solid #27272a" }}>
          <ScmPanel
            sessionDetail={sessionDetail}
            conflictFiles={conflictFiles}
            stagedFiles={stagedFiles}
            activePath={activePath}
            commitMessage={commitMessage}
            sessionBusy={sessionBusy}
            canContinue={canContinue}
            queueText={queueText}
            onSelectFile={onActiveFileChange}
            onCommitMessageChange={onCommitMessageChange}
            onContinue={onContinue}
            onAbort={onAbort}
          />
        </Sider>

        <Layout style={{ background: "#09090b", position: "relative" }}>
          <Content style={{ overflow: "auto", display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, padding: 16 }}>
              <MergeEditorShell
                activeFile={activeFile}
                currentLabel={`${currentRepoName}/${currentBranch}`}
                incomingLabel={`${targetRepoName}/${targetBranch}`}
                resolutions={resolutions}
                onResolve={onResolveChunk}
              />
            </div>
          </Content>

          <Footer style={{ padding: "12px 24px", background: "#18181b", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Space direction="vertical" size={2}>
              {activeFile && <Text style={{ color: "#a1a1aa", fontSize: 13 }}>当前文件 <Text strong style={{ color: "#fafafa" }}>{activeFile.path}</Text> 可逐块解决后继续。</Text>}
              {!activeFile && isCompleted && <Text style={{ color: "#10b981", fontSize: 13 }}>当前会话已经完成。</Text>}
              {!activeFile && !isCompleted && <Text style={{ color: "#a1a1aa", fontSize: 13 }}>当前轮次没有检测到冲突文件。</Text>}
              {sessionError && <Text style={{ color: "#ef4444", fontSize: 13 }}>会话错误：{sessionError}</Text>}
            </Space>
            
            <Button disabled style={{ background: "#27272a", borderColor: "#3f3f46", color: "#a1a1aa" }}>
              {!activeFile ? "当前无冲突文件" : unresolvedCount > 0 ? `当前文件剩余 ${unresolvedCount} 个冲突块` : "当前文件已解决"}
            </Button>
          </Footer>
        </Layout>
      </Layout>
    </Layout>
  );
}
