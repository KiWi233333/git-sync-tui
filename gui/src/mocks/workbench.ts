import type {
  BranchOption,
  CommitItem,
  ConflictFile,
  RepositoryOption,
} from "../types/workbench";

export const repositories: RepositoryOption[] = [
  {
    id: "current-sandbox",
    name: "my-project-local",
    source: "Managed sandbox clone",
    path: "~/Library/Application Support/git-sync-gui/worktrees/my-project-local",
    branch: "main",
    mode: "clone",
    role: "current",
  },
  {
    id: "current-local",
    name: "my-project-local",
    source: "Local repository",
    path: "/Users/yunge/workspaces/my-project-local",
    branch: "develop",
    mode: "local",
    role: "current",
  },
  {
    id: "target-remote",
    name: "upstream/project",
    source: "Remote provider",
    path: "git@github.com:upstream/project.git",
    branch: "feature/new-api",
    mode: "clone",
    role: "target",
  },
  {
    id: "target-local",
    name: "upstream/project",
    source: "Existing local clone",
    path: "/Users/yunge/workspaces/upstream-project",
    branch: "feature/new-api",
    mode: "local",
    role: "target",
  },
];

export const branchesByRepo: Record<string, BranchOption[]> = {
  "current-sandbox": [
    { name: "main", summary: "受保护分支" },
    { name: "develop", summary: "ahead 2 / behind 0" },
    { name: "feat/merge-workbench", summary: "ahead 5 / behind 1" },
  ],
  "current-local": [
    { name: "develop", summary: "ahead 1 / behind 0" },
    { name: "release/2026.04", summary: "受保护分支" },
    { name: "main", summary: "受保护分支" },
  ],
  "target-remote": [
    { name: "feature/new-api", summary: "最新功能分支" },
    { name: "hotfix/bug-123", summary: "紧急修复" },
    { name: "main", summary: "基线分支" },
  ],
  "target-local": [
    { name: "feature/new-api", summary: "本地缓存最新" },
    { name: "release/2026.04", summary: "同步目标" },
    { name: "main", summary: "基线分支" },
  ],
};

export const commits: CommitItem[] = [
  {
    hash: "a1b2c3d0001",
    shortHash: "a1b2c3d",
    message: "docs: update readme for new api",
    author: "Alex Chen",
    date: "10 mins ago",
    order: 5,
  },
  {
    hash: "f9e8d7c0002",
    shortHash: "f9e8d7c",
    message: "feat(sdk): 新增 Anthropic Messages API 兼容接口",
    author: "Alex Chen",
    date: "2 hours ago",
    order: 4,
  },
  {
    hash: "5a4b3c20003",
    shortHash: "5a4b3c2",
    message: "fix: typo in variable name",
    author: "Sarah Doe",
    date: "5 hours ago",
    order: 3,
  },
  {
    hash: "1x2y3z40004",
    shortHash: "1x2y3z4",
    message: "refactor: extract authorize middleware",
    author: "Alex Chen",
    date: "1 day ago",
    order: 2,
  },
  {
    hash: "9m8n7b60005",
    shortHash: "9m8n7b6",
    message: "chore: setup initial sdk structure",
    author: "Alex Chen",
    date: "2 days ago",
    order: 1,
  },
];

export const conflictFilesSeed: ConflictFile[] = [
  {
    path: ".gitignore",
    kind: "conflict",
    status: "C",
    chunks: [
      {
        id: "gitignore-1",
        incomingStart: 40,
        currentStart: 40,
        incoming: [".opencow", ".opencow-dev"],
        current: ["k8s/secret.yaml", "k8s/tls-secret.yaml"],
      },
    ],
  },
  {
    path: "sdk_auth.py",
    kind: "staged",
    status: "A",
    chunks: [],
  },
  {
    path: "router.py",
    kind: "staged",
    status: "M",
    chunks: [],
  },
];
