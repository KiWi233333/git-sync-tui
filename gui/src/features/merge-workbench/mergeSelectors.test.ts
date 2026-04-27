import assert from "node:assert/strict";
import test from "node:test";
import type { ConflictFile } from "../../types/workbench";
import { canContinueConflictCommit, countUnresolvedChunks, isFileResolved } from "./mergeSelectors";

const file: ConflictFile = {
  path: "src/app.ts",
  kind: "conflict",
  status: "C",
  chunks: [
    { id: "one", incomingStart: 1, currentStart: 1, incoming: ["a"], current: ["b"] },
    { id: "two", incomingStart: 2, currentStart: 2, incoming: ["c"], current: ["d"] },
  ],
};

test("counts unresolved chunks", () => {
  assert.equal(countUnresolvedChunks(file, { one: "incoming", two: "unresolved" }), 1);
});

test("treats missing resolutions as unresolved", () => {
  assert.equal(countUnresolvedChunks(file, { one: "incoming" }), 1);
  assert.equal(isFileResolved(file, { one: "incoming" }), false);
  assert.equal(canContinueConflictCommit([file], { one: "incoming" }), false);
});

test("detects resolved file", () => {
  assert.equal(isFileResolved(file, { one: "incoming", two: "manual" }), true);
});

test("requires all files resolved before continuing", () => {
  assert.equal(canContinueConflictCommit([file], { one: "incoming", two: "unresolved" }), false);
  assert.equal(canContinueConflictCommit([file], { one: "incoming", two: "current" }), true);
});
