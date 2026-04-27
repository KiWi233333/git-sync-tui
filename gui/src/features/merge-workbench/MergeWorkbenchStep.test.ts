import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { CommitItem, ConflictFile, Resolution, SessionDetail } from "../../types/workbench";
import { MergeWorkbenchStep } from "./MergeWorkbenchStep";

const queue: CommitItem[] = [
  { hash: "abcdef123", shortHash: "abcdef1", message: "first", author: "A", date: "2026-01-01", order: 1 },
];

const conflictFile: ConflictFile = {
  path: "src/app.ts",
  kind: "conflict",
  status: "C",
  chunks: [
    { id: "chunk-1", incomingStart: 1, currentStart: 1, incoming: ["incoming"], current: ["current"] },
  ],
};

const stagedFile: ConflictFile = {
  path: "src/done.ts",
  kind: "staged",
  status: "M",
  chunks: [],
};

const sessionDetail: SessionDetail = {
  id: "session-1",
  status: "conflicted",
  currentRepoName: "current",
  currentRepoPath: "/tmp/current",
  currentBranch: "main",
  createSameBranchName: false,
  targetRepoName: "target",
  targetRepoPath: "/tmp/target",
  targetBranch: "feature",
  queue,
  totalCommits: 1,
  completedCount: 0,
  currentCommitIndex: 0,
  currentCommit: queue[0],
  conflictFiles: [conflictFile],
  stagedFiles: [stagedFile],
  createdAt: 1,
  updatedAt: 2,
  lastError: null,
};

function renderWorkbench(resolutions: Record<string, Resolution>) {
  return renderToStaticMarkup(
    createElement(MergeWorkbenchStep, {
      currentRepoName: "current",
      currentBranch: "main",
      targetRepoName: "target",
      targetBranch: "feature",
      mergeMode: "diff",
      activeFile: conflictFile,
      conflictFiles: [conflictFile],
      stagedFiles: [stagedFile],
      unresolvedCount: 0,
      commitMessage: "merge commit",
      resolutions,
      orderedQueue: queue,
      sessionDetail,
      sessionError: null,
      sessionBusy: false,
      onCommitMessageChange: () => undefined,
      onMergeModeChange: () => undefined,
      onActiveFileChange: () => undefined,
      onResolveChunk: () => undefined,
      onContinue: () => undefined,
      onAbort: () => undefined,
    }),
  );
}

test("renders split SCM panel and compact merge editor", () => {
  const html = renderWorkbench({ "chunk-1": "unresolved" });

  assert.match(html, /class="scm-panel"/);
  assert.match(html, /源代码管理/);
  assert.match(html, /合并更改/);
  assert.match(html, /暂存的更改/);
  assert.match(html, /class="merge-editor-shell"/);
  assert.match(html, /正在合并: src\/app.ts/);
  assert.match(html, /接受当前/);
  assert.match(html, /传入/);
  assert.match(html, /结果/);
});

test("disables continue until all conflict chunks are resolved", () => {
  const unresolvedHtml = renderWorkbench({ "chunk-1": "unresolved" });
  const resolvedHtml = renderWorkbench({ "chunk-1": "manual" });

  assert.match(unresolvedHtml, /disabled=""[^>]*>继续 Cherry-pick/);
  assert.doesNotMatch(resolvedHtml, /disabled=""[^>]*>继续 Cherry-pick/);
});
