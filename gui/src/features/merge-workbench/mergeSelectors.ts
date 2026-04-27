import type { ConflictFile, Resolution } from "../../types/workbench";

export function countUnresolvedChunks(file: ConflictFile | null, resolutions: Record<string, Resolution>) {
  if (!file) return 0;
  return file.chunks.filter((chunk) => resolutions[chunk.id] === undefined || resolutions[chunk.id] === "unresolved").length;
}

export function isFileResolved(file: ConflictFile | null, resolutions: Record<string, Resolution>) {
  return file !== null && countUnresolvedChunks(file, resolutions) === 0;
}

export function canContinueConflictCommit(conflictFiles: ConflictFile[], resolutions: Record<string, Resolution>) {
  return conflictFiles.every((file) => isFileResolved(file, resolutions));
}
