import type { CommitInfo } from './git.js'

/** Order selected hashes by the commit list order and drop stale selections. */
export function orderSelectedHashesByCommits(
  commits: CommitInfo[],
  selectedHashes: ReadonlySet<string>,
): string[] {
  return commits
    .filter((commit) => selectedHashes.has(commit.hash))
    .map((commit) => commit.hash)
}
