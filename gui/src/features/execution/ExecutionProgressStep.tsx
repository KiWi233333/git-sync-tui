import React from "react";
import type { SessionDetail } from "../../types/workbench";
import { Button, Progress, Card, Typography, Space, Alert, Tag } from "antd";
import { LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ExecutionProgressStepProps {
  sessionDetail: SessionDetail | null;
  sessionLoading: boolean;
  sessionError: string | null;
  onRetry: () => void;
  onAbort: () => void;
}

export function getExecutionProgressPercent(completed: number, total: number) {
  return total > 0 ? Math.round((completed / total) * 100) : 0;
}

export function ExecutionProgressStep({
  sessionDetail,
  sessionLoading,
  sessionError,
  onRetry,
  onAbort,
}: ExecutionProgressStepProps) {
  const completed = sessionDetail?.completedCount ?? 0;
  const total = sessionDetail?.totalCommits ?? 0;
  const percent = getExecutionProgressPercent(completed, total);
  const status = sessionError ? "failed" : sessionDetail?.status ?? "starting";

  const getStatusTag = () => {
    if (sessionError) return <Tag color="error" icon={<CloseCircleOutlined />}>执行失败</Tag>;
    if (sessionLoading) return <Tag color="processing" icon={<LoadingOutlined />}>正在读取状态</Tag>;
    if (status === "running") return <Tag color="processing" icon={<SyncOutlined spin />}>执行中</Tag>;
    if (status === "conflicted") return <Tag color="warning" icon={<CloseCircleOutlined />}>遇到冲突</Tag>;
    if (status === "completed") return <Tag color="success" icon={<CheckCircleOutlined />}>执行完成</Tag>;
    return <Tag color="default">{status}</Tag>;
  };

  return (
    <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#09090b", padding: "40px 20px" }}>
      <Card style={{ maxWidth: 640, width: "100%", background: "#18181b", borderColor: "#27272a" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", width: 56, height: 56, borderRadius: 16, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
            <SyncOutlined spin={status === "running" || sessionLoading} />
          </div>
          <Title level={3} style={{ marginTop: 0, marginBottom: 8, color: "#fafafa" }}>正在执行 Cherry-Pick</Title>
          <Text type="secondary">正在按时间线处理 commits。遇到冲突后会自动进入合并工作台。</Text>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, alignItems: "center" }}>
            {getStatusTag()}
            <Text type="secondary">{completed} / {total} commits</Text>
          </div>
          <Progress 
            percent={percent} 
            status={sessionError ? "exception" : status === "completed" ? "success" : "active"}
            strokeColor={{ "0%": "#3b82f6", "100%": "#8b5cf6" }}
          />
        </div>

        <Card size="small" style={{ background: "#09090b", borderColor: "#27272a", marginBottom: 24 }}>
          <Text type="secondary" style={{ display: "block", marginBottom: 4 }}>当前处理</Text>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Tag color="default" style={{ fontFamily: "monospace", margin: 0 }}>
              {sessionDetail?.currentCommit?.shortHash ?? "等待开始"}
            </Tag>
            <Text style={{ color: "#fafafa", flex: 1 }} ellipsis>
              {sessionDetail?.currentCommit?.message ?? "创建会话与备份中。"}
            </Text>
          </div>
        </Card>

        {sessionError && (
          <Alert
            type="error"
            message="读取执行状态失败"
            description={sessionError}
            showIcon
            style={{ marginBottom: 24, background: "rgba(239, 68, 68, 0.1)", borderColor: "rgba(239, 68, 68, 0.2)" }}
          />
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>
          {sessionError && (
            <Button disabled={sessionLoading} onClick={onRetry}>
              重试读取状态
            </Button>
          )}
          <Button danger disabled={sessionLoading} onClick={onAbort}>
            中断会话
          </Button>
        </div>
      </Card>
    </div>
  );
}
