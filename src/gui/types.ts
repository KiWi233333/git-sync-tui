export type RepositoryMode = 'clone' | 'local'
export type RepositoryHealth = 'ready' | 'syncing' | 'stale'
export type CommitRisk = 'safe' | 'watch' | 'conflict'
export type ConflictStatus = 'U' | 'A' | 'M' | 'D'
export type StageStatus = 'A' | 'M' | 'D'
export type ResolutionStrategy =
  | 'unresolved'
  | 'incoming'
  | 'current'
  | 'both-incoming-first'
  | 'both-current-first'

export interface RepositoryOption {
  id: string
  name: string
  provider: string
  path: string
  branch: string
  mode: RepositoryMode
  health: RepositoryHealth
  role: 'current' | 'target'
  lastSync: string
}

export interface BranchOption {
  name: string
  ahead: number
  behind: number
  protected?: boolean
}

export interface CommitItem {
  hash: string
  shortHash: string
  title: string
  author: string
  relativeTime: string
  filesChanged: number
  insertions: number
  deletions: number
  tags: string[]
  risk: CommitRisk
  alreadySynced?: boolean
}

export interface ConflictChunk {
  id: string
  incomingStart: number
  currentStart: number
  incomingLines: string[]
  currentLines: string[]
  baseHint: string
}

export interface ConflictFile {
  path: string
  folder: string
  status: ConflictStatus
  chunks: ConflictChunk[]
}

export interface StageFile {
  path: string
  folder: string
  status: StageStatus
  tone: 'conflict' | 'staged'
}

export interface ActivityItem {
  title: string
  detail: string
  state: 'done' | 'active' | 'pending'
}

export interface WorkspaceSnapshot {
  repositories: RepositoryOption[]
  branchesByRepository: Record<string, BranchOption[]>
  commits: CommitItem[]
  conflicts: ConflictFile[]
  stagedFiles: StageFile[]
  activity: ActivityItem[]
  suggestedMessage: string
  cloneDestination: string
}
