interface WorkspaceReadinessInput {
  desktopStatus: string;
  currentPath: string | null;
  targetPath: string | null;
  currentIsClean: boolean | null;
  targetIsClean: boolean | null;
  cloneLoading: "current" | "target" | null;
}

export interface WorkspaceReadiness {
  canContinue: boolean;
  reason: string | null;
  tone: "neutral" | "warning" | "danger";
}

export function getWorkspaceReadiness(input: WorkspaceReadinessInput): WorkspaceReadiness {
  if (input.desktopStatus !== "desktop-bridge-ready") {
    return { canContinue: false, reason: "桌面桥接未就绪，暂不能继续。", tone: "danger" };
  }

  if (input.cloneLoading) {
    return { canContinue: false, reason: "仓库 clone 正在进行，请等待完成。", tone: "neutral" };
  }

  if (!input.currentPath) {
    return { canContinue: false, reason: "请选择或克隆接收方仓库。", tone: "warning" };
  }

  if (!input.targetPath) {
    return { canContinue: false, reason: "请选择或克隆提供方仓库。", tone: "warning" };
  }

  if (input.currentIsClean === false) {
    return { canContinue: false, reason: "接收方工作区存在未提交更改，请先处理后继续。", tone: "danger" };
  }

  if (input.targetIsClean === false) {
    return { canContinue: true, reason: "提供方仓库存在本地更改，仅用于读取 commits，请确认来源正确。", tone: "warning" };
  }

  return { canContinue: true, reason: null, tone: "neutral" };
}
