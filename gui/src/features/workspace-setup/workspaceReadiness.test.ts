import assert from "node:assert/strict";
import test from "node:test";
import { getWorkspaceReadiness } from "./workspaceReadiness";

test("blocks when desktop bridge is not ready", () => {
  const result = getWorkspaceReadiness({
    desktopStatus: "checking...",
    currentPath: "/repo/current",
    targetPath: "/repo/target",
    currentIsClean: true,
    targetIsClean: true,
    cloneLoading: null,
  });

  assert.equal(result.canContinue, false);
  assert.equal(result.tone, "danger");
});

test("blocks dirty current workspace", () => {
  const result = getWorkspaceReadiness({
    desktopStatus: "desktop-bridge-ready",
    currentPath: "/repo/current",
    targetPath: "/repo/target",
    currentIsClean: false,
    targetIsClean: true,
    cloneLoading: null,
  });

  assert.equal(result.canContinue, false);
  assert.match(result.reason ?? "", /未提交更改/);
});

test("allows dirty target repository with warning", () => {
  const result = getWorkspaceReadiness({
    desktopStatus: "desktop-bridge-ready",
    currentPath: "/repo/current",
    targetPath: "/repo/target",
    currentIsClean: true,
    targetIsClean: false,
    cloneLoading: null,
  });

  assert.equal(result.canContinue, true);
  assert.equal(result.tone, "warning");
});
