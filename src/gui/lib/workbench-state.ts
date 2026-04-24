import type { CommitItem, ConflictChunk, ResolutionStrategy } from '../types.js'

export function orderSelectedCommits(commits: CommitItem[], selectedHashes: Set<string>): CommitItem[] {
  return commits.filter((commit) => selectedHashes.has(commit.hash))
}

export function resolveChunk(chunk: ConflictChunk, strategy: ResolutionStrategy): string[] {
  switch (strategy) {
    case 'incoming':
      return [...chunk.incomingLines]
    case 'current':
      return [...chunk.currentLines]
    case 'both-incoming-first':
      return [...chunk.incomingLines, '', ...chunk.currentLines]
    case 'both-current-first':
      return [...chunk.currentLines, '', ...chunk.incomingLines]
    default:
      return []
  }
}

export function getConflictProgress(resolutions: Record<string, ResolutionStrategy>): {
  resolved: number
  total: number
} {
  const entries = Object.values(resolutions)
  return {
    resolved: entries.filter((value) => value !== 'unresolved').length,
    total: entries.length,
  }
}
