import React from "react";
import ReactDOM from "react-dom/client";
import { ConfigProvider, theme } from "antd";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#3b82f6", // blue-500
          colorBgBase: "#09090b", // zinc-950
          colorBgContainer: "#18181b", // zinc-900
          colorBgElevated: "#27272a", // zinc-800
          borderRadius: 8,
          fontFamily: "'IBM Plex Sans', 'PingFang SC', 'Noto Sans SC', 'Segoe UI', sans-serif",
        },
      }}
    >
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
