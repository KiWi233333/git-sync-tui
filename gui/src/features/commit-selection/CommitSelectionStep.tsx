import { Badge, Button, Table, Typography, Space, Alert, Layout } from "antd";
import { RefreshCw, ArrowLeft, Play, CheckCircle2 } from "lucide-react";
import type { CommitItem } from "../../types/workbench";
import { summarizeQueue } from "./commitFilters";

const { Text, Title } = Typography;

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
  const queueSummary = summarizeQueue(orderedQueue);

  const columns = [
    {
      title: "Commit Message",
      dataIndex: "message",
      key: "message",
      render: (text: string) => <Text strong style={{ color: "#fafafa" }}>{text}</Text>,
    },
    {
      title: "Author",
      dataIndex: "author",
      key: "author",
      width: 150,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 150,
      render: (text: string) => <Text type="secondary">{text}</Text>,
    },
    {
      title: "Hash",
      dataIndex: "shortHash",
      key: "shortHash",
      width: 100,
      render: (text: string) => <Text code>{text}</Text>,
    },
  ];

  return (
    <Layout style={{ height: "100%", background: "#09090b" }}>
      <div style={{ padding: "20px 32px", borderBottom: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Text type="secondary">选择 Commits</Text>
          <Title level={4} style={{ margin: 0, color: "#fafafa" }}>{targetRepoName} / {targetBranch}</Title>
        </div>
        <Space size="middle">
          <Badge count={commits.length} showZero color="#27272a" style={{ color: "#fafafa" }} />
          <Badge count={queueSummary.totalCommits} showZero color={queueSummary.totalCommits > 0 ? "#52c41a" : "#27272a"} />
          <Button icon={<RefreshCw size={16} />} onClick={onRefresh}>
            刷新
          </Button>
        </Space>
      </div>

      <Layout.Content style={{ padding: 32, overflow: "auto" }}>
        {commitError ? (
          <Alert message="读取 commits 失败" description={commitError} type="error" showIcon style={{ marginBottom: 24 }} />
        ) : null}

        <Table
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: Array.from(selectedHashes),
            onChange: (selectedRowKeys) => {
              const currentKeys = Array.from(selectedHashes);
              const added = selectedRowKeys.filter((key) => !currentKeys.includes(key as string));
              const removed = currentKeys.filter((key) => !selectedRowKeys.includes(key as string));
              added.forEach((key) => onToggleCommit(key as string));
              removed.forEach((key) => onToggleCommit(key as string));
            },
          }}
          columns={columns}
          dataSource={commits.map((c) => ({ ...c, key: c.hash }))}
          loading={commitLoading}
          pagination={false}
          size="middle"
          rowClassName={(record) => selectedHashes.has(record.hash) ? "selected-row" : ""}
          style={{ background: "#18181b", borderRadius: 8, border: "1px solid #27272a" }}
        />
      </Layout.Content>

      <div style={{ padding: "16px 32px", background: "#18181b", borderTop: "1px solid #27272a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {orderedQueue.length > 0 ? (
            <Space>
              <CheckCircle2 size={16} color="#52c41a" />
              <Text>已选择 <strong style={{ color: "#fafafa" }}>{orderedQueue.length}</strong> 个 Commit</Text>
              <Text type="secondary" code>{queueText}</Text>
            </Space>
          ) : (
            <Text type="secondary">请选择需要 Cherry-Pick 的 Commit</Text>
          )}
          {sessionError && (
            <Text type="danger" style={{ marginLeft: 16 }}>会话创建失败：{sessionError}</Text>
          )}
        </div>
        <Space size="middle">
          <Button icon={<ArrowLeft size={16} />} onClick={onBack}>
            返回上一步
          </Button>
          <Button type="primary" icon={<Play size={16} />} onClick={onStart} disabled={startDisabled} size="large">
            开始执行
          </Button>
        </Space>
      </div>
    </Layout>
  );
}
