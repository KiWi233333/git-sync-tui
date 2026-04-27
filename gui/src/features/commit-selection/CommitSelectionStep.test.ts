import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CommitItem } from "../../types/workbench";
import { CommitSelectionStep } from "./CommitSelectionStep";

const commits: CommitItem[] = [
  { hash: "aaa111", shortHash: "aaa111", message: "feat: add api", author: "Ada", date: "2026-01-01", order: 1 },
  { hash: "bbb222", shortHash: "bbb222", message: "fix: button", author: "Lin", date: "2026-01-02", order: 2 },
];

test("renders vscode style commit list and selected queue", () => {
  const html = renderToStaticMarkup(
    createElement(CommitSelectionStep, {
      targetRepoName: "upstream",
      targetBranch: "feature/new-api",
      commits,
      commitLoading: false,
      commitError: null,
      commitSourceLabel: "/tmp/upstream:feature/new-api",
      selectedHashes: new Set(["bbb222"]),
      orderedQueue: [commits[1]],
      queueText: "bbb222",
      sessionError: null,
      startDisabled: false,
      onToggleCommit: () => undefined,
      onBack: () => undefined,
      onStart: () => undefined,
      onRefresh: () => undefined,
    }),
  );

  assert.match(html, /commit-history-panel/);
  assert.match(html, /vscode-commit-row/);
  assert.match(html, /commit-selection-panel/);
  assert.match(html, /Cherry-Pick 队列/);
  assert.match(html, /bbb222/);
});
