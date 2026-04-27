import type { CommitItem } from "../../types/workbench";

export type CommitFilterMode = "all" | "selected" | "risky";

export function filterCommits(
  commits: CommitItem[],
  query: string,
  mode: CommitFilterMode,
  selectedHashes: Set<string>,
) {
  const normalizedQuery = query.trim().toLowerCase();

  return commits.filter((commit) => {
    const matchesQuery =
      normalizedQuery.length === 0 ||
      commit.hash.toLowerCase().includes(normalizedQuery) ||
      commit.shortHash.toLowerCase().includes(normalizedQuery) ||
      commit.message.toLowerCase().includes(normalizedQuery) ||
      commit.author.toLowerCase().includes(normalizedQuery);

    if (!matchesQuery) return false;
    if (mode === "selected") return selectedHashes.has(commit.hash);
    if (mode === "risky") return /merge|breaking|conflict/i.test(commit.message);
    return true;
  });
}

export function summarizeQueue(commits: CommitItem[]) {
  return {
    totalCommits: commits.length,
    firstHash: commits[0]?.shortHash ?? null,
    lastHash: commits[commits.length - 1]?.shortHash ?? null,
  };
}
