export type ViewStep = "setup" | "commits" | "loading" | "merge";
export type RepoMode = "clone" | "local";
export type MergeViewMode = "diff" | "merge";
export type Resolution = "unresolved" | "incoming" | "current" | "both";

export interface RepositoryOption {
  id: string;
  name: string;
  source: string;
  path: string;
  branch: string;
  mode: RepoMode;
  role: "current" | "target";
}

export interface BranchOption {
  name: string;
  summary: string;
}

export interface RepositoryInspection {
  path: string;
  rootPath: string;
  currentBranch: string;
  isClean: boolean;
  branches: BranchOption[];
}

export interface CommitItem {
  hash: string;
  shortHash: string;
  message: string;
  author: string;
  date: string;
  order: number;
}

export interface CommitListResponse {
  path: string;
  branch: string;
  commits: CommitItem[];
}

export interface ManagedClonePayload {
  repositoryUrl: string;
  destinationRoot?: string | null;
  directoryName?: string | null;
  branch?: string | null;
}

export interface ManagedCloneResult {
  repositoryUrl: string;
  destinationRoot: string;
  inspection: RepositoryInspection;
}

export interface ManagedRepositoryRecord {
  id: string;
  name: string;
  repositoryUrl: string;
  localPath: string;
  destinationRoot: string;
  lastUsedAt: number;
  inspection: RepositoryInspection;
}

export type SessionStatus = "created" | "running" | "conflicted" | "completed" | "failed";

export interface SessionCreatePayload {
  currentRepoName: string;
  currentRepoPath: string | null;
  currentBranch: string;
  targetRepoName: string;
  targetRepoPath: string | null;
  targetBranch: string;
  queue: CommitItem[];
}

export interface SessionDetail {
  id: string;
  status: SessionStatus;
  currentRepoName: string;
  currentRepoPath: string | null;
  currentBranch: string;
  targetRepoName: string;
  targetRepoPath: string | null;
  targetBranch: string;
  queue: CommitItem[];
  totalCommits: number;
  completedCount: number;
  currentCommitIndex: number | null;
  currentCommit: CommitItem | null;
  conflictFiles: ConflictFile[];
  stagedFiles: ConflictFile[];
  createdAt: number;
  updatedAt: number;
  lastError: string | null;
}

export interface ConflictChunk {
  id: string;
  incomingStart: number;
  currentStart: number;
  incoming: string[];
  current: string[];
}

export interface ConflictFile {
  path: string;
  kind: "conflict" | "staged";
  status: "C" | "A" | "M";
  chunks: ConflictChunk[];
}
