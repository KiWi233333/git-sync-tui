import assert from "node:assert/strict";
import test from "node:test";
import { getExecutionProgressPercent } from "./ExecutionProgressStep";

test("calculates execution progress percent", () => {
  assert.equal(getExecutionProgressPercent(2, 5), 40);
  assert.equal(getExecutionProgressPercent(0, 0), 0);
});
