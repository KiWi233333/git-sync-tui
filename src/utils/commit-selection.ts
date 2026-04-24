import type { CommitInfo } from './git.js'

export function orderSelectedHashesByCommits(commits: CommitInfo[], selectedHashes: Set<string>): string[] {
  return commits
    .filter((c) => selectedHashes.has(c.hash))
    .map((c) => c.hash)
}
