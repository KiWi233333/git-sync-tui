import { useEffect, useMemo, useState } from "react";
import {
  abortSession,
  cloneManagedRepository,
  continueSession,
  createSession,
  desktopHealthcheck,
  getSessionDetail,
  inspectRepository,
  listManagedRepositories,
  listRepositoryCommits,
  pickDirectory,
  startSession,
} from "../bridge/desktop";
import { LoadingOverlay } from "../components/layout/LoadingOverlay";
import { TopBar } from "../components/layout/TopBar";
import { CommitSelectionStep } from "../features/commit-selection/CommitSelectionStep";
import { MergeWorkbenchStep } from "../features/merge-workbench/MergeWorkbenchStep";
import { WorkspaceSetupStep } from "../features/workspace-setup/WorkspaceSetupStep";
import { branchesByRepo, commits as mockCommits, repositories } from "../mocks/workbench";
import {
  getConflictFiles,
  getOrderedQueue,
  getStagedFiles,
  useWorkbenchStore,
} from "../stores/useWorkbenchStore";

export function AppShell() {
  const [currentManagedPath, setCurrentManagedPath] = useState<string | null>(null);
  const [currentManagedBranches, setCurrentManagedBranches] = useState<Array<{ name: string; summary: string }>>([]);
  const [currentManagedCleanState, setCurrentManagedCleanState] = useState<boolean | null>(null);
  const [currentCloneUrl, setCurrentCloneUrl] = useState("");
  const [currentCloneRoot, setCurrentCloneRoot] = useState<string | null>(null);
  const [targetManagedPath, setTargetManagedPath] = useState<string | null>(null);
  const [targetManagedBranches, setTargetManagedBranches] = useState<Array<{ name: string; summary: string }>>([]);
  const [targetManagedCleanState, setTargetManagedCleanState] = useState<boolean | null>(null);
  const [targetRemoteUrl, setTargetRemoteUrl] = useState(
    repositories.find((repo) => repo.id === "target-remote")?.path ?? "",
  );
  const [targetCloneRoot, setTargetCloneRoot] = useState<string | null>(null);
  const [cloneLoading, setCloneLoading] = useState<"current" | "target" | null>(null);
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [managedRepositories, setManagedRepositories] = useState<import("../types/workbench").ManagedRepositoryRecord[]>([]);
  const [managedRepoLoading, setManagedRepoLoading] = useState(false);

  const {
    view,
    mergeMode,
    currentRepoId,
    targetRepoId,
    currentBranch,
    targetBranch,
    currentRepoMode,
    selectedHashes,
    activeConflictFile,
    commitMessage,
    resolutions,
    desktopStatus,
    currentLocalPath,
    targetLocalPath,
    currentDynamicBranches,
    targetDynamicBranches,
    currentRepoCleanState,
    targetRepoCleanState,
    availableCommits,
    commitLoading,
    commitError,
    commitSourceLabel,
    sessionDetail,
    sessionLoading,
    sessionError,
    setView,
    setMergeMode,
    setCurrentRepoMode,
    setCurrentRepoId,
    setTargetRepoId,
    setCurrentBranch,
    setTargetBranch,
    toggleCommit,
    setActiveConflictFile,
    setCommitMessage,
    setResolution,
    setDesktopStatus,
    setCurrentLocalRepository,
    setTargetLocalRepository,
    setAvailableCommits,
    setCommitLoading,
    setCommitError,
    setSessionDetail,
    setSessionLoading,
    setSessionError,
    resetResolutions,
  } = useWorkbenchStore();

  useEffect(() => {
    desktopHealthcheck()
      .then((status) => setDesktopStatus(status))
      .catch(() => setDesktopStatus("desktop-bridge-error"));
  }, [setDesktopStatus]);

  useEffect(() => {
    setManagedRepoLoading(true);
    listManagedRepositories()
      .then((items) => setManagedRepositories(items))
      .catch(() => setManagedRepositories([]))
      .finally(() => setManagedRepoLoading(false));
  }, []);

  const currentRepoOptions = repositories.filter((repo) => repo.role === "current");
  const targetRepoOptions = repositories.filter((repo) => repo.role === "target");
  const currentRepo = currentRepoOptions.find((repo) => repo.id === currentRepoId) ?? currentRepoOptions[0];
  const targetRepo = targetRepoOptions.find((repo) => repo.id === targetRepoId) ?? targetRepoOptions[0];

  const currentBranches =
    currentRepoMode === "clone" && currentManagedBranches.length > 0
      ? currentManagedBranches
      : currentRepoMode === "local" && currentDynamicBranches.length > 0
      ? currentDynamicBranches
      : branchesByRepo[currentRepoId] ?? [];

  const targetBranches =
    targetRepoId === "target-remote" && targetManagedBranches.length > 0
      ? targetManagedBranches
      : targetRepoId === "target-local" && targetDynamicBranches.length > 0
      ? targetDynamicBranches
      : branchesByRepo[targetRepoId] ?? [];

  const targetCommitPath = targetRepoId === "target-local" ? targetLocalPath : targetManagedPath;

  useEffect(() => {
    if (!targetCommitPath) {
      setAvailableCommits([]);
      setCommitError(null);
      setCommitLoading(false);
      return;
    }

    let cancelled = false;
    setCommitLoading(true);
    setCommitError(null);

    listRepositoryCommits(targetCommitPath, targetBranch, 100)
      .then((response) => {
        if (cancelled) return;
        setAvailableCommits(response.commits, `${response.path}:${response.branch}`);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCommitError(error instanceof Error ? error.message : "unknown-error");
      })
      .finally(() => {
        if (!cancelled) setCommitLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetCommitPath, targetBranch, setAvailableCommits, setCommitError, setCommitLoading]);

  const resolvedCommits = targetCommitPath ? availableCommits : mockCommits;
  const orderedQueue = useMemo(
    () => getOrderedQueue(resolvedCommits, selectedHashes),
    [resolvedCommits, selectedHashes],
  );
  const queueText = orderedQueue.map((commit) => commit.shortHash).join(" -> ");
  const conflictFiles = sessionDetail ? sessionDetail.conflictFiles : getConflictFiles();
  const stagedFiles = sessionDetail ? sessionDetail.stagedFiles : getStagedFiles();
  const activeFile = conflictFiles.find((file) => file.path === activeConflictFile) ?? conflictFiles[0] ?? null;
  const unresolvedCount = activeFile
    ? activeFile.chunks.filter((chunk) => resolutions[chunk.id] === "unresolved").length
    : 0;

  function buildCommitMessage(summary: string, filePath?: string) {
    return `${summary}

# Conflicts:
#   ${filePath ?? activeFile?.path ?? "manual-resolution"}`;
  }

  function handleCurrentRepoModeChange(mode: "clone" | "local") {
    setCurrentRepoMode(mode);
    if (mode === "clone") {
      setCurrentRepoId("current-sandbox");
      setCurrentBranch("main");
    } else if (currentDynamicBranches.length > 0) {
      setCurrentBranch(currentDynamicBranches[0].name);
    } else {
      setCurrentRepoId("current-local");
      setCurrentBranch(branchesByRepo["current-local"]?.[0]?.name ?? "develop");
    }
  }

  function handleCurrentRepoChange(repoId: string) {
    setCurrentRepoId(repoId);
    setCurrentBranch(branchesByRepo[repoId]?.[0]?.name ?? "main");
  }

  function handleTargetRepoChange(repoId: string) {
    setTargetRepoId(repoId);
    setTargetBranch(branchesByRepo[repoId]?.[0]?.name ?? "feature/new-api");
  }

  async function handlePickCurrentCloneRoot() {
    const path = await pickDirectory();
    if (path) setCurrentCloneRoot(path);
  }

  async function handlePickTargetCloneRoot() {
    const path = await pickDirectory();
    if (path) setTargetCloneRoot(path);
  }

  async function handlePickCurrentDirectory() {
    const path = await pickDirectory();
    if (!path) return;

    try {
      const inspection = await inspectRepository(path);
      setCurrentLocalRepository(
        inspection.rootPath,
        inspection.currentBranch,
        inspection.branches,
        inspection.isClean,
      );
      setDesktopStatus("desktop-bridge-ready");
    } catch {
      setDesktopStatus("current-repo-invalid");
    }
  }

  async function handlePickTargetDirectory() {
    const path = await pickDirectory();
    if (!path) return;

    try {
      const inspection = await inspectRepository(path);
      setTargetLocalRepository(
        inspection.rootPath,
        inspection.currentBranch,
        inspection.branches,
        inspection.isClean,
      );
      setDesktopStatus("desktop-bridge-ready");
    } catch {
      setDesktopStatus("target-repo-invalid");
    }
  }

  async function handleCloneCurrentManaged() {
    if (!currentCloneUrl.trim()) {
      setCloneError("请先填写当前仓库远端地址");
      return;
    }

    setCloneLoading("current");
    setCloneError(null);

    try {
      const result = await cloneManagedRepository({
        repositoryUrl: currentCloneUrl.trim(),
        destinationRoot: currentCloneRoot,
        branch: currentBranch,
      });
      setCurrentManagedPath(result.inspection.rootPath);
      setCurrentManagedBranches(result.inspection.branches);
      setCurrentManagedCleanState(result.inspection.isClean);
      setCurrentBranch(result.inspection.currentBranch);
      setDesktopStatus("desktop-bridge-ready");
      setManagedRepositories(await listManagedRepositories());
    } catch (error: unknown) {
      setCloneError(error instanceof Error ? error.message : "current-clone-failed");
    } finally {
      setCloneLoading(null);
    }
  }

  async function handleCloneTargetManaged() {
    if (!targetRemoteUrl.trim()) {
      setCloneError("请先填写目标仓库远端地址");
      return;
    }

    setCloneLoading("target");
    setCloneError(null);

    try {
      const result = await cloneManagedRepository({
        repositoryUrl: targetRemoteUrl.trim(),
        destinationRoot: targetCloneRoot,
        branch: targetBranch,
      });
      setTargetManagedPath(result.inspection.rootPath);
      setTargetManagedBranches(result.inspection.branches);
      setTargetManagedCleanState(result.inspection.isClean);
      setTargetBranch(result.inspection.currentBranch);
      setDesktopStatus("desktop-bridge-ready");
      setManagedRepositories(await listManagedRepositories());
    } catch (error: unknown) {
      setCloneError(error instanceof Error ? error.message : "target-clone-failed");
    } finally {
      setCloneLoading(null);
    }
  }

  function handleUseManagedForCurrent(repositoryId: string) {
    const repo = managedRepositories.find((item) => item.id === repositoryId);
    if (!repo) return;

    setCurrentRepoMode("clone");
    setCurrentRepoId("current-sandbox");
    setCurrentManagedPath(repo.localPath);
    setCurrentManagedBranches(repo.inspection.branches);
    setCurrentManagedCleanState(repo.inspection.isClean);
    setCurrentCloneUrl(repo.repositoryUrl);
    setCurrentBranch(repo.inspection.currentBranch);
    setDesktopStatus("desktop-bridge-ready");
  }

  function handleUseManagedForTarget(repositoryId: string) {
    const repo = managedRepositories.find((item) => item.id === repositoryId);
    if (!repo) return;

    setTargetRepoId("target-remote");
    setTargetManagedPath(repo.localPath);
    setTargetManagedBranches(repo.inspection.branches);
    setTargetManagedCleanState(repo.inspection.isClean);
    setTargetRemoteUrl(repo.repositoryUrl);
    setTargetBranch(repo.inspection.currentBranch);
    setDesktopStatus("desktop-bridge-ready");
  }

  async function handleStartCherryPick() {
    const currentSessionPath =
      currentRepoMode === "clone"
        ? currentManagedPath
        : currentLocalPath ?? currentRepo.path;
    const targetSessionPath =
      targetRepoId === "target-local"
        ? targetLocalPath ?? targetRepo.path
        : targetManagedPath;

    if (orderedQueue.length === 0) {
      setSessionError("请至少选择一个 commit");
      return;
    }
    if (currentRepoMode === "clone" && !currentManagedPath) {
      setSessionError("请先完成当前仓库托管克隆");
      return;
    }
    if (targetRepoId === "target-remote" && !targetManagedPath) {
      setSessionError("请先克隆目标仓库并读取真实 commits");
      return;
    }

    setSessionLoading(true);
    setSessionError(null);
    setView("loading");

    try {
      const created = await createSession({
        currentRepoName: currentRepo.name,
        currentRepoPath: currentSessionPath,
        currentBranch,
        targetRepoName: targetRepo.name,
        targetRepoPath: targetSessionPath,
        targetBranch,
        queue: orderedQueue,
      });
      const started = await startSession(created.id);
      const detail = await getSessionDetail(started.id);
      setSessionDetail(detail);
      setActiveConflictFile(detail.conflictFiles[0]?.path ?? activeConflictFile);
      resetResolutions(detail.conflictFiles);
      setCommitMessage(buildCommitMessage(detail.currentCommit?.message ?? "cherry-pick", detail.conflictFiles[0]?.path));
      setView("merge");
    } catch (error: unknown) {
      setSessionError(error instanceof Error ? error.message : "session-start-failed");
      setView("commits");
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleContinueSession() {
    if (!sessionDetail) {
      setSessionError("当前没有可继续的会话");
      return;
    }

    if (unresolvedCount > 0) {
      setSessionError("请先解决当前文件中的所有冲突块");
      return;
    }

    setSessionLoading(true);
    setSessionError(null);

    try {
      const detail = await continueSession(
        sessionDetail.id,
        commitMessage,
        Object.fromEntries(Object.entries(resolutions)),
      );
      setSessionDetail(detail);

      if (detail.currentCommit) {
        setActiveConflictFile(detail.conflictFiles[0]?.path ?? activeConflictFile);
        resetResolutions(detail.conflictFiles);
        setCommitMessage(buildCommitMessage(detail.currentCommit.message, detail.conflictFiles[0]?.path));
      } else {
        setCommitMessage("Cherry-pick session completed");
      }
    } catch (error: unknown) {
      setSessionError(error instanceof Error ? error.message : "session-continue-failed");
    } finally {
      setSessionLoading(false);
    }
  }

  async function handleAbortSession() {
    if (!sessionDetail) {
      setSessionError("当前没有可终止的会话");
      return;
    }

    setSessionLoading(true);
    setSessionError(null);

    try {
      const detail = await abortSession(sessionDetail.id);
      setSessionDetail(detail);
      setView("commits");
    } catch (error: unknown) {
      setSessionError(error instanceof Error ? error.message : "session-abort-failed");
    } finally {
      setSessionLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <TopBar
        showPath={view !== "setup"}
        currentRepoName={currentRepo.name}
        targetRepoName={targetRepo.name}
        targetBranch={targetBranch}
      />

      <main className="workspace">
        {view === "setup" && (
          <WorkspaceSetupStep
            currentRepoMode={currentRepoMode}
            currentRepoId={currentRepoId}
            currentBranch={currentBranch}
            targetRepoId={targetRepoId}
            targetBranch={targetBranch}
            currentRepoOptions={currentRepoOptions}
            targetRepoOptions={targetRepoOptions}
            currentRepo={currentRepo}
            targetRepo={targetRepo}
            currentBranches={currentBranches}
            targetBranches={targetBranches}
            currentLocalPath={currentLocalPath}
            currentManagedPath={currentManagedPath}
            targetLocalPath={targetLocalPath}
            targetManagedPath={targetManagedPath}
            currentRepoCleanState={currentRepoCleanState}
            currentManagedCleanState={currentManagedCleanState}
            targetRepoCleanState={targetRepoCleanState}
            targetManagedCleanState={targetManagedCleanState}
            currentCloneUrl={currentCloneUrl}
            currentCloneRoot={currentCloneRoot}
            targetRemoteUrl={targetRemoteUrl}
            targetCloneRoot={targetCloneRoot}
            managedRepositories={managedRepositories}
            desktopStatus={desktopStatus}
            cloneLoading={cloneLoading}
            cloneError={cloneError}
            managedRepoLoading={managedRepoLoading}
            onCurrentRepoModeChange={handleCurrentRepoModeChange}
            onCurrentRepoChange={handleCurrentRepoChange}
            onCurrentBranchChange={setCurrentBranch}
            onTargetRepoChange={handleTargetRepoChange}
            onTargetBranchChange={setTargetBranch}
            onCurrentCloneUrlChange={setCurrentCloneUrl}
            onTargetRemoteUrlChange={setTargetRemoteUrl}
            onPickCurrentCloneRoot={handlePickCurrentCloneRoot}
            onPickTargetCloneRoot={handlePickTargetCloneRoot}
            onCloneCurrentManaged={handleCloneCurrentManaged}
            onCloneTargetManaged={handleCloneTargetManaged}
            onUseManagedForCurrent={handleUseManagedForCurrent}
            onUseManagedForTarget={handleUseManagedForTarget}
            onPickCurrentDirectory={handlePickCurrentDirectory}
            onPickTargetDirectory={handlePickTargetDirectory}
            onNext={() => setView("commits")}
          />
        )}

        {view === "commits" && (
          <CommitSelectionStep
            targetRepoName={targetRepo.name}
            targetBranch={targetBranch}
            commits={resolvedCommits}
            commitLoading={commitLoading}
            commitError={commitError}
            commitSourceLabel={targetCommitPath ? commitSourceLabel : "mock-target-branch"}
            selectedHashes={selectedHashes}
            orderedQueue={orderedQueue}
            queueText={queueText}
            sessionError={sessionError}
            startDisabled={commitLoading || sessionLoading || orderedQueue.length === 0}
            onToggleCommit={toggleCommit}
            onBack={() => setView("setup")}
            onStart={handleStartCherryPick}
            onRefresh={() => {
              if (targetCommitPath) {
                setCommitLoading(true);
                setCommitError(null);
                listRepositoryCommits(targetCommitPath, targetBranch, 100)
                  .then((response) => {
                    setAvailableCommits(response.commits, `${response.path}:${response.branch}`);
                  })
                  .catch((error: unknown) => {
                    setCommitError(error instanceof Error ? error.message : "unknown-error");
                  })
                  .finally(() => setCommitLoading(false));
              }
            }}
          />
        )}

        {view === "merge" && (
          <MergeWorkbenchStep
            currentRepoName={currentRepo.name}
            currentBranch={currentBranch}
            targetRepoName={targetRepo.name}
            targetBranch={targetBranch}
            mergeMode={mergeMode}
            activeFile={activeFile}
            conflictFiles={conflictFiles}
            stagedFiles={stagedFiles}
            unresolvedCount={unresolvedCount}
            commitMessage={commitMessage}
            resolutions={resolutions}
            orderedQueue={orderedQueue}
            sessionDetail={sessionDetail}
            sessionError={sessionError}
            sessionBusy={sessionLoading}
            onCommitMessageChange={setCommitMessage}
            onMergeModeChange={setMergeMode}
            onActiveFileChange={setActiveConflictFile}
            onResolveChunk={setResolution}
            onContinue={handleContinueSession}
            onAbort={handleAbortSession}
          />
        )}
      </main>

      {view === "loading" && <LoadingOverlay queueText={queueText} />}
    </div>
  );
}
