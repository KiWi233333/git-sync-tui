import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type {
  CommitListResponse,
  ManagedClonePayload,
  ManagedCloneResult,
  ManagedRepositoryRecord,
  RepositoryInspection,
  SessionCreatePayload,
  SessionDetail,
} from "../types/workbench";

export async function desktopHealthcheck(): Promise<string> {
  return invoke("desktop_healthcheck");
}

export async function pickDirectory(): Promise<string | null> {
  const selected = await open({
    directory: true,
    multiple: false,
  });

  if (!selected) return null;
  return Array.isArray(selected) ? selected[0] ?? null : selected;
}

export async function inspectRepository(path: string): Promise<RepositoryInspection> {
  return invoke("workspace_inspect_repository", { path });
}

export async function listRepositoryCommits(
  path: string,
  branch: string,
  limit = 100,
): Promise<CommitListResponse> {
  return invoke("commit_list_repository", { path, branch, limit });
}

export async function cloneManagedRepository(
  payload: ManagedClonePayload,
): Promise<ManagedCloneResult> {
  return invoke("workspace_clone_managed_repository", { payload });
}

export async function listManagedRepositories(): Promise<ManagedRepositoryRecord[]> {
  return invoke("workspace_list_managed_repositories");
}

export async function createSession(payload: SessionCreatePayload): Promise<SessionDetail> {
  return invoke("session_create", { payload });
}

export async function startSession(sessionId: string): Promise<SessionDetail> {
  return invoke("session_start", { sessionId });
}

export async function getSessionDetail(sessionId: string): Promise<SessionDetail> {
  return invoke("session_get_detail", { sessionId });
}

export async function continueSession(
  sessionId: string,
  commitMessage: string,
  resolutions: Record<string, string>,
): Promise<SessionDetail> {
  return invoke("session_continue", {
    payload: { sessionId, commitMessage, resolutions },
  });
}

export async function abortSession(sessionId: string): Promise<SessionDetail> {
  return invoke("session_abort", { sessionId });
}
