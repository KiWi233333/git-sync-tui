import { Layout, Tag, Button, Typography, Space, Divider } from "antd";
import { GitPullRequest, Settings, ArrowRight } from "lucide-react";

const { Header } = Layout;
const { Text } = Typography;

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
    <Header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        padding: "0 24px",
        background: "rgba(9, 9, 11, 0.84)",
        borderBottom: "1px solid #27272a",
        backdropFilter: "blur(18px)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <Space size="middle" align="center">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "#fafafa",
            color: "#09090b",
            fontWeight: 700,
          }}
        >
          <GitPullRequest size={18} />
        </div>
        <div style={{ lineHeight: 1.2 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "#fafafa" }}>
            Cherry-Pick 工作站
          </div>
          <div style={{ fontSize: 12, color: "#a1a1aa" }}>
            Desktop Merge Console
          </div>
        </div>
      </Space>

      {showPath && (
        <Space
          align="center"
          style={{
            background: "rgba(17, 17, 20, 0.92)",
            border: "1px solid #202024",
            borderRadius: 12,
            padding: "4px 8px",
            boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
          }}
          split={<ArrowRight size={14} color="#71717a" />}
        >
          <Tag color="default" bordered={false} style={{ margin: 0 }}>
            当前: <Text strong style={{ color: "#fafafa" }}>{currentRepoName}</Text>
          </Tag>
          <Tag color="processing" bordered={false} style={{ margin: 0 }}>
            目标: <Text strong style={{ color: "#fafafa" }}>{targetRepoName}</Text>
          </Tag>
          <Tag color="warning" bordered={false} style={{ margin: 0 }}>
            分支: <Text strong style={{ color: "#fafafa" }}>{targetBranch}</Text>
          </Tag>
        </Space>
      )}

      <Button type="text" icon={<Settings size={18} />} style={{ color: "#fafafa" }} />
    </Header>
  );
}
