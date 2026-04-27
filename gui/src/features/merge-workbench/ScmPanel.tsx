import React from "react";
import type { ConflictFile, SessionDetail } from "../../types/workbench";
import { Button, Input, Badge, List, Typography, Space, Divider } from "antd";
import { CheckCircleOutlined, ExclamationCircleOutlined, FileTextOutlined } from "@ant-design/icons";

const { Text } = Typography;
const { TextArea } = Input;

interface ScmPanelProps {
  sessionDetail: SessionDetail | null;
  conflictFiles: ConflictFile[];
  stagedFiles: ConflictFile[];
  activePath: string;
  commitMessage: string;
  sessionBusy: boolean;
  canContinue: boolean;
  queueText: string;
  onSelectFile: (path: string) => void;
  onCommitMessageChange: (message: string) => void;
  onContinue: () => void;
  onAbort: () => void;
}

export function ScmPanel({
  sessionDetail,
  conflictFiles,
  stagedFiles,
  activePath,
  commitMessage,
  sessionBusy,
  canContinue,
  queueText,
  onSelectFile,
  onCommitMessageChange,
  onContinue,
  onAbort,
}: ScmPanelProps) {
  return (
    <div style={{ width: 320, background: "#18181b", borderRight: "1px solid #27272a", display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #27272a" }}>
        <Text strong style={{ color: "#fafafa" }}>源代码管理</Text>
      </div>

      <div style={{ padding: 16, borderBottom: "1px solid #27272a" }}>
        <TextArea
          value={commitMessage}
          onChange={(e) => onCommitMessageChange(e.target.value)}
          placeholder="Commit message"
          autoSize={{ minRows: 2, maxRows: 6 }}
          style={{ marginBottom: 12, background: "#09090b", borderColor: "#3f3f46", color: "#fafafa" }}
        />
        <div style={{ display: "flex", gap: 8 }}>
          <Button 
            type="primary" 
            onClick={onContinue} 
            disabled={sessionBusy || !canContinue}
            style={{ flex: 1 }}
          >
            继续 Cherry-pick
          </Button>
          <Button 
            danger 
            onClick={onAbort} 
            disabled={sessionBusy}
          >
            放弃
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 0" }}>
        <div style={{ padding: "0 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>合并更改</Text>
          <Badge count={conflictFiles.length} color="#3b82f6" style={{ backgroundColor: "#1d4ed8", color: "#fff", boxShadow: "none" }} />
        </div>
        
        <List
          size="small"
          dataSource={conflictFiles}
          locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>当前无冲突文件</Text> }}
          renderItem={(file) => (
            <List.Item 
              onClick={() => onSelectFile(file.path)}
              style={{ 
                padding: "6px 16px", 
                cursor: "pointer",
                background: file.path === activePath ? "rgba(59, 130, 246, 0.15)" : "transparent",
                borderLeft: file.path === activePath ? "2px solid #3b82f6" : "2px solid transparent",
                borderBottom: "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <Space size={8}>
                  <FileTextOutlined style={{ color: "#a1a1aa" }} />
                  <Text style={{ color: file.path === activePath ? "#fafafa" : "#a1a1aa", fontSize: 13 }} ellipsis>{file.path}</Text>
                </Space>
                <ExclamationCircleOutlined style={{ color: "#ef4444", fontSize: 12 }} />
              </div>
            </List.Item>
          )}
        />

        <Divider style={{ margin: "16px 0", borderColor: "#27272a" }} />

        <div style={{ padding: "0 16px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>暂存的更改</Text>
          <Badge count={stagedFiles.length} color="#52525b" style={{ backgroundColor: "#3f3f46", color: "#fff", boxShadow: "none" }} />
        </div>

        <List
          size="small"
          dataSource={stagedFiles}
          locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>暂无暂存文件</Text> }}
          renderItem={(file) => (
            <List.Item style={{ padding: "6px 16px", borderBottom: "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <Space size={8}>
                  <FileTextOutlined style={{ color: "#a1a1aa" }} />
                  <Text style={{ color: "#a1a1aa", fontSize: 13 }} ellipsis>{file.path}</Text>
                </Space>
                <Text style={{ color: "#10b981", fontSize: 12 }}>{file.status}</Text>
              </div>
            </List.Item>
          )}
        />
      </div>

      <div style={{ padding: 16, borderTop: "1px solid #27272a", background: "#09090b" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>执行进度</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{sessionDetail?.completedCount ?? 0}/{sessionDetail?.totalCommits ?? 0}</Text>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Text strong style={{ color: "#fafafa", fontSize: 13 }} ellipsis>
            {sessionDetail?.currentCommit?.message ?? "等待冲突 commit 信息"}
          </Text>
          <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>
            {sessionDetail?.currentCommit?.shortHash ?? (queueText || "暂无队列")}
          </Text>
        </div>
      </div>
    </div>
  );
}
