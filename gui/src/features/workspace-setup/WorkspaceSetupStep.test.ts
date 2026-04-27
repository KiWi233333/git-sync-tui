import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { branchesByRepo, repositories } from "../../mocks/workbench";
import { WorkspaceSetupStep } from "./WorkspaceSetupStep";

const currentRepoOptions = repositories.filter((repo) => repo.role === "current");
const targetRepoOptions = repositories.filter((repo) => repo.role === "target");
const currentRepo = currentRepoOptions[0];
const targetRepo = targetRepoOptions[0];
const noop = () => undefined;

function renderSetup() {
  return renderToStaticMarkup(
    createElement(WorkspaceSetupStep, {
      currentRepoMode: "clone",
      currentRepoId: currentRepo.id,
      currentBranch: "main",
      targetRepoId: targetRepo.id,
      targetBranch: "feature/new-api",
      currentRepoOptions,
      targetRepoOptions,
      currentRepo,
      targetRepo,
      currentBranches: branchesByRepo[currentRepo.id],
      targetBranches: branchesByRepo[targetRepo.id],
      currentLocalPath: null,
      currentManagedPath: "/tmp/current",
      targetLocalPath: null,
      targetManagedPath: "/tmp/target",
      currentRepoCleanState: null,
      currentManagedCleanState: true,
      targetRepoCleanState: null,
      targetManagedCleanState: true,
      currentCloneUrl: "git@example.com:current.git",
      currentCloneRoot: null,
      targetRemoteUrl: "git@example.com:target.git",
      targetCloneRoot: null,
      managedRepositories: [],
      desktopStatus: "desktop-bridge-ready",
      cloneLoading: null,
      cloneError: null,
      readiness: { canContinue: true, reason: null, tone: "neutral" },
      managedRepoLoading: false,
      createSameBranchName: true,
      onCurrentRepoModeChange: noop,
      onCurrentRepoChange: noop,
      onCurrentBranchChange: noop,
      onTargetRepoChange: noop,
      onTargetBranchChange: noop,
      onCurrentCloneUrlChange: noop,
      onTargetRemoteUrlChange: noop,
      onPickCurrentCloneRoot: noop,
      onPickTargetCloneRoot: noop,
      onCloneCurrentManaged: noop,
      onCloneTargetManaged: noop,
      onUseManagedForCurrent: noop,
      onUseManagedForTarget: noop,
      onPickCurrentDirectory: noop,
      onPickTargetDirectory: noop,
      onCreateSameBranchNameChange: noop,
      onNext: noop,
    }),
  );
}

test("workspace setup renders exactly two cascade selectors", () => {
  const html = renderSetup();

  assert.equal((html.match(/repo-cascader--(?:current|target)/g) ?? []).length, 2);
  assert.match(html, /接收方（当前仓库）/);
  assert.match(html, /提供方（目标仓库）/);
});

test("workspace cascade selectors keep remote local and branch choices", () => {
  const html = renderSetup();

  assert.match(html, /远程/);
  assert.match(html, /本地/);
  assert.match(html, /远程地址/);
  assert.match(html, /托管仓库/);
  assert.match(html, /分支/);
  assert.match(html, /新建相同分支名/);
  assert.match(html, /下一步：选择 Commits/);
});
