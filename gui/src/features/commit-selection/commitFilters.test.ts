import assert from "node:assert/strict";
import test from "node:test";
import type { CommitItem } from "../../types/workbench";
import { filterCommits, summarizeQueue } from "./commitFilters";

const commits: CommitItem[] = [
  { hash: "aaa111", shortHash: "aaa111", message: "feat: add api", author: "Ada", date: "2026-01-01", order: 1 },
  { hash: "bbb222", shortHash: "bbb222", message: "merge branch main", author: "Lin", date: "2026-01-02", order: 2 },
  { hash: "ccc333", shortHash: "ccc333", message: "fix: button", author: "Ada", date: "2026-01-03", order: 3 },
];

test("filters by message and author", () => {
  assert.deepEqual(filterCommits(commits, "ada", "all", new Set()).map((commit) => commit.hash), ["aaa111", "ccc333"]);
  assert.deepEqual(filterCommits(commits, "button", "all", new Set()).map((commit) => commit.hash), ["ccc333"]);
});

test("filters selected commits", () => {
  assert.deepEqual(filterCommits(commits, "", "selected", new Set(["bbb222"])).map((commit) => commit.hash), ["bbb222"]);
});

test("summarizes queue endpoints", () => {
  assert.deepEqual(summarizeQueue(commits), { totalCommits: 3, firstHash: "aaa111", lastHash: "ccc333" });
});
