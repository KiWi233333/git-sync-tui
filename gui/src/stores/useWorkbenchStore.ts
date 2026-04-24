import { create } from "zustand";
import { commits, conflictFilesSeed, repositories } from "../mocks/workbench";
import type {
  CommitItem,
  ConflictFile,
  MergeViewMode,
  RepoMode,
  Resolution,
  SessionDetail,
  ViewStep,
} from "../types/workbench";

interface WorkbenchState {
  view: ViewStep;
  mergeMode: MergeViewMode;
  currentRepoId: string;
  targetRepoId: string;
  currentBranch: string;
  targetBranch: string;
  currentRepoMode: RepoMode;
  selectedHashes: Set<string>;
  activeConflictFile: string;
  commitMessage: string;
  resolutions: Record<string, Resolution>;
  desktopStatus: string;
  currentLocalPath: string | null;
  targetLocalPath: string | null;
  currentDynamicBranches: Array<{ name: string; summary: string }>;
  targetDynamicBranches: Array<{ name: string; summary: string }>;
  currentRepoCleanState: boolean | null;
  targetRepoCleanState: boolean | null;
  availableCommits: CommitItem[];
  commitLoading: boolean;
  commitError: string | null;
  commitSourceLabel: string;
  sessionDetail: SessionDetail | null;
  sessionLoading: boolean;
  sessionError: string | null;
  setView: (view: ViewStep) => void;
  setMergeMode: (mode: MergeViewMode) => void;
  setCurrentRepoMode: (mode: RepoMode) => void;
  setCurrentRepoId: (repoId: string) => void;
  setTargetRepoId: (repoId: string) => void;
  setCurrentBranch: (branch: string) => void;
  setTargetBranch: (branch: string) => void;
  toggleCommit: (hash: string) => void;
  setActiveConflictFile: (path: string) => void;
  setCommitMessage: (message: string) => void;
  setResolution: (chunkId: string, resolution: Resolution) => void;
  setDesktopStatus: (status: string) => void;
  setCurrentLocalRepository: (path: string, currentBranch: string, branches: Array<{ name: string; summary: string }>, isClean: boolean) => void;
  setTargetLocalRepository: (path: string, currentBranch: string, branches: Array<{ name: string; summary: string }>, isClean: boolean) => void;
  setAvailableCommits: (commits: CommitItem[], sourceLabel?: string) => void;
  setCommitLoading: (loading: boolean) => void;
  setCommitError: (error: string | null) => void;
  setSessionDetail: (sessionDetail: SessionDetail | null) => void;
  setSessionLoading: (loading: boolean) => void;
  setSessionError: (error: string | null) => void;
  resetResolutions: (conflictFiles?: ConflictFile[]) => void;
}

function buildInitialResolutions(conflictFiles: ConflictFile[] = conflictFilesSeed.filter((file) => file.kind === "conflict")): Record<string, Resolution> {
  return Object.fromEntries(
    conflictFiles.flatMap((file) =>
      file.chunks.map((chunk) => [chunk.id, "unresolved" as Resolution]),
    ),
  );
}

export const useWorkbenchStore = create<WorkbenchState>((set) => ({
  view: "setup",
  mergeMode: "merge",
  currentRepoId: "current-sandbox",
  targetRepoId: "target-remote",
  currentBranch: "main",
  targetBranch: "feature/new-api",
  currentRepoMode: "clone",
  selectedHashes: new Set(["f9e8d7c0002", "1x2y3z40004", "9m8n7b60005"]),
  activeConflictFile: ".gitignore",
  commitMessage: `feat(sdk): 新增 Anthropic Messages API 兼容接口

# Conflicts:
#   .gitignore`,
  resolutions: buildInitialResolutions(),
  desktopStatus: "checking...",
  currentLocalPath: null,
  targetLocalPath: null,
  currentDynamicBranches: [],
  targetDynamicBranches: [],
  currentRepoCleanState: null,
  targetRepoCleanState: null,
  availableCommits: commits,
  commitLoading: false,
  commitError: null,
  commitSourceLabel: "mock-target-branch",
  sessionDetail: null,
  sessionLoading: false,
  sessionError: null,
  setView: (view) => set({ view }),
  setMergeMode: (mergeMode) => set({ mergeMode }),
  setCurrentRepoMode: (currentRepoMode) =>
    set((state) => ({
      currentRepoMode,
      currentRepoId: currentRepoMode === "clone" ? "current-sandbox" : "current-local",
      currentBranch: currentRepoMode === "clone" ? "main" : state.currentBranch,
    })),
  setCurrentRepoId: (currentRepoId) => set({ currentRepoId }),
  setTargetRepoId: (targetRepoId) => set({ targetRepoId }),
  setCurrentBranch: (currentBranch) => set({ currentBranch }),
  setTargetBranch: (targetBranch) => set({ targetBranch }),
  toggleCommit: (hash) =>
    set((state) => {
      const next = new Set(state.selectedHashes);
      if (next.has(hash)) next.delete(hash);
      else next.add(hash);
      return { selectedHashes: next };
    }),
  setActiveConflictFile: (activeConflictFile) => set({ activeConflictFile }),
  setCommitMessage: (commitMessage) => set({ commitMessage }),
  setResolution: (chunkId, resolution) =>
    set((state) => ({
      resolutions: {
        ...state.resolutions,
        [chunkId]: resolution,
      },
    })),
  setDesktopStatus: (desktopStatus) => set({ desktopStatus }),
  setCurrentLocalRepository: (path, currentBranch, branches, isClean) =>
    set({
      currentLocalPath: path,
      currentRepoMode: "local",
      currentRepoId: "current-local",
      currentBranch,
      currentDynamicBranches: branches,
      currentRepoCleanState: isClean,
    }),
  setTargetLocalRepository: (path, currentBranch, branches, isClean) =>
    set({
      targetLocalPath: path,
      targetRepoId: "target-local",
      targetBranch: currentBranch,
      targetDynamicBranches: branches,
      targetRepoCleanState: isClean,
    }),
  setAvailableCommits: (availableCommits, sourceLabel = "mock-target-branch") =>
    set({ availableCommits, commitSourceLabel: sourceLabel }),
  setCommitLoading: (commitLoading) => set({ commitLoading }),
  setCommitError: (commitError) => set({ commitError }),
  setSessionDetail: (sessionDetail) => set({ sessionDetail }),
  setSessionLoading: (sessionLoading) => set({ sessionLoading }),
  setSessionError: (sessionError) => set({ sessionError }),
  resetResolutions: (conflictFiles) => set({ resolutions: buildInitialResolutions(conflictFiles) }),
}));

export function getOrderedQueue(availableCommits: CommitItem[], selectedHashes: Set<string>): CommitItem[] {
  return availableCommits
    .filter((commit) => selectedHashes.has(commit.hash))
    .sort((a, b) => a.order - b.order);
}

export function getConflictFiles() {
  return conflictFilesSeed.filter((file) => file.kind === "conflict");
}

export function getStagedFiles() {
  return conflictFilesSeed.filter((file) => file.kind === "staged");
}

export function getCurrentRepoName(repoId: string) {
  return repositories.find((repo) => repo.id === repoId)?.name ?? "unknown";
}
