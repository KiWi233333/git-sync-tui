import simpleGit, { type SimpleGit } from 'simple-git'
import { existsSync, writeFileSync, unlinkSync, readFileSync } from 'fs'
import { join } from 'path'

export interface CommitInfo {
  hash: string
  shortHash: string
  message: string
  author: string
  date: string
}

export interface RemoteInfo {
  name: string
  fetchUrl: string
}

export interface CherryPickResult {
  success: boolean
  error?: string
  conflictFiles?: string[]
}

let gitInstance: SimpleGit | null = null

export function getGit(cwd?: string): SimpleGit {
  if (!gitInstance || cwd) {
    gitInstance = simpleGit(cwd)
  }
  return gitInstance
}

/** 获取远程仓库列表 */
export async function getRemotes(): Promise<RemoteInfo[]> {
  const git = getGit()
  const remotes = await git.getRemotes(true)
  return remotes.map((r) => ({
    name: r.name,
    fetchUrl: r.refs.fetch,
  }))
}

/** 添加远程仓库 */
export async function addRemote(name: string, url: string): Promise<void> {
  const git = getGit()
  await git.addRemote(name, url)
}

/** 获取远程分支列表 */
export async function getRemoteBranches(remote: string): Promise<string[]> {
  const git = getGit()

  // 先尝试 fetch 更新远程引用
  let fetchOk = false
  try {
    await git.fetch(remote)
    fetchOk = true
  } catch {
    // fetch 失败，后面尝试 fallback
  }

  // 从本地缓存读取远程分支
  const result = await git.branch(['-r'])
  const prefix = `${remote}/`
  const branches = result.all
    .filter((b) => b.startsWith(prefix) && !b.includes('HEAD'))
    .map((b) => b.replace(prefix, ''))
    .sort()

  if (branches.length > 0) return branches

  // 本地缓存为空时，用 ls-remote 作为 fallback（适用于新添加的 remote）
  try {
    const lsResult = await git.raw(['ls-remote', '--heads', remote])
    if (!lsResult.trim()) return []
    return lsResult.trim().split('\n')
      .map((line) => line.replace(/^.*refs\/heads\//, ''))
      .filter(Boolean)
      .sort()
  } catch {
    if (!fetchOk) {
      throw new Error(`无法连接远程仓库 '${remote}'，请检查网络或仓库地址`)
    }
    return []
  }
}

/** 获取远程分支的 commit 列表 */
export async function getCommits(
  remote: string,
  branch: string,
  count: number = 30,
): Promise<CommitInfo[]> {
  const git = getGit()
  const ref = `${remote}/${branch}`

  // 确保本地有远程引用（处理未 fetch 过的 remote）
  try {
    await git.raw(['rev-parse', '--verify', ref])
  } catch {
    // 本地无引用，尝试 fetch 该分支
    try {
      await git.fetch(remote, branch)
    } catch {
      throw new Error(`无法获取 ${ref}，请检查远程仓库连接`)
    }
  }

  const result = await git.raw([
    'log', ref,
    `--max-count=${count}`,
    '--format=%H%n%h%n%s%n%an%n%ar%n---',
  ])

  if (!result.trim()) return []

  const entries = result.trim().split('\n---\n').filter(Boolean)
  return entries.map((block) => {
    const [hash, shortHash, message, author, date] = block.split('\n')
    return { hash, shortHash, message: message || '', author: author || '', date: date || '' }
  })
}

/** 获取尚未同步到本地的 commit（cherry-pick 过滤） */
export async function getUnsyncedCommits(
  remote: string,
  branch: string,
  count: number = 30,
): Promise<CommitInfo[]> {
  const git = getGit()
  const ref = `${remote}/${branch}`

  // 先获取全部 commit
  const allCommits = await getCommits(remote, branch, count)

  // 用 cherry 命令检查哪些还没同步
  try {
    const result = await git.raw([
      'cherry',
      'HEAD',
      ref,
    ])

    // git cherry 输出格式: "+ <hash>" (未同步) 或 "- <hash>" (已同步)
    const unsyncedHashes = new Set(
      result
        .trim()
        .split('\n')
        .filter((line) => line.startsWith('+ '))
        .map((line) => line.substring(2).trim()),
    )

    return allCommits.map((c) => ({
      ...c,
      // 标记是否已同步（通过 full hash 前缀匹配）
      _synced: !unsyncedHashes.has(c.hash),
    })) as any
  } catch {
    // cherry 命令失败时返回全部
    return allCommits
  }
}

/** 获取 commit 的 --stat 摘要 */
export async function getCommitStat(hash: string): Promise<string> {
  const git = getGit()
  try {
    const result = await git.raw(['diff', '--stat', `${hash}~1`, hash])
    return result.trim()
  } catch {
    return '(无法获取 stat 信息)'
  }
}

/** 获取多个 commit 的合并 --stat */
export async function getMultiCommitStat(hashes: string[]): Promise<string> {
  if (hashes.length === 0) return ''
  const git = getGit()
  try {
    // 用 diff-tree 逐个获取再合并
    const stats: string[] = []
    for (const hash of hashes) {
      const result = await git.raw(['diff-tree', '--stat', '--no-commit-id', '-r', hash])
      if (result.trim()) stats.push(`${hash.substring(0, 7)}:\n${result.trim()}`)
    }
    return stats.join('\n\n')
  } catch {
    return '(无法获取 stat 信息)'
  }
}

/** 检查选中的 commits 中是否有 merge commits */
export async function hasMergeCommits(hashes: string[]): Promise<boolean> {
  const git = getGit()
  try {
    for (const hash of hashes) {
      const result = await git.raw(['rev-list', '--merges', '-n', '1', hash])
      if (result.trim()) return true
    }
    return false
  } catch {
    return false
  }
}

/** 执行 cherry-pick --no-commit */
export async function cherryPick(hashes: string[], useMainline = false): Promise<CherryPickResult> {
  const git = getGit()
  try {
    // 逐个 cherry-pick --no-commit，保持顺序（从旧到新）
    const orderedHashes = [...hashes].reverse()
    for (const hash of orderedHashes) {
      const args = ['cherry-pick', '--no-commit']
      if (useMainline) {
        args.push('-m', '1')
      }
      args.push(hash)
      await git.raw(args)
    }
    return { success: true }
  } catch (err: any) {
    // 检查是否有冲突
    try {
      const status = await git.status()
      const conflictFiles = status.conflicted
      return {
        success: false,
        error: err.message,
        conflictFiles: conflictFiles.length > 0 ? conflictFiles : undefined,
      }
    } catch {
      return { success: false, error: err.message }
    }
  }
}

/** 获取当前暂存区的 diff --stat */
export async function getStagedStat(): Promise<string> {
  const git = getGit()
  try {
    const result = await git.raw(['diff', '--cached', '--stat'])
    return result.trim()
  } catch {
    return ''
  }
}

/** 检查工作区是否干净 */
export async function isWorkingDirClean(): Promise<boolean> {
  const git = getGit()
  const status = await git.status()
  return status.isClean()
}

/** Stash 工作区 */
export async function stash(): Promise<boolean> {
  const git = getGit()
  try {
    await git.stash(['push', '--include-untracked', '-m', 'Auto-stash by git-sync-tui'])
    return true
  } catch {
    return false
  }
}

/** Pop stash */
export async function stashPop(): Promise<boolean> {
  const git = getGit()
  try {
    await git.stash(['pop'])
    return true
  } catch {
    return false
  }
}

/** 放弃 cherry-pick */
export async function abortCherryPick(): Promise<void> {
  const git = getGit()
  try {
    await git.raw(['cherry-pick', '--abort'])
  } catch {
    // 可能没有进行中的 cherry-pick
  }
}

/** 重置暂存区（取消 --no-commit 的改动） */
export async function resetStaged(): Promise<void> {
  const git = getGit()
  await git.raw(['reset', 'HEAD'])
}

// ===== Stash Guard =====

const STASH_GUARD_FILE = 'git-sync-tui-stash-guard'

/** 获取 .git 目录路径 */
async function getGitDir(): Promise<string> {
  const git = getGit()
  const dir = await git.revparse(['--git-dir'])
  return dir.trim()
}

/** 写入 stash guard 标记文件 */
export async function writeStashGuard(): Promise<void> {
  try {
    const gitDir = await getGitDir()
    writeFileSync(join(gitDir, STASH_GUARD_FILE), new Date().toISOString(), 'utf-8')
  } catch {
    // 写入失败不阻塞主流程
  }
}

/** 同步写入 stash guard（用于信号处理） */
export function writeStashGuardSync(): void {
  try {
    const { execSync } = require('child_process')
    const gitDir = String(execSync('git rev-parse --git-dir', { encoding: 'utf-8' })).trim()
    writeFileSync(join(gitDir, STASH_GUARD_FILE), new Date().toISOString(), 'utf-8')
  } catch {
    // ignore
  }
}

/** 删除 stash guard 标记文件 */
export async function removeStashGuard(): Promise<void> {
  try {
    const gitDir = await getGitDir()
    const guardPath = join(gitDir, STASH_GUARD_FILE)
    if (existsSync(guardPath)) {
      unlinkSync(guardPath)
    }
  } catch {
    // ignore
  }
}

/** 同步删除 stash guard（用于信号处理） */
export function removeStashGuardSync(): void {
  try {
    const { execSync } = require('child_process')
    const gitDir = String(execSync('git rev-parse --git-dir', { encoding: 'utf-8' })).trim()
    const guardPath = join(gitDir, STASH_GUARD_FILE)
    if (existsSync(guardPath)) {
      unlinkSync(guardPath)
    }
  } catch {
    // ignore
  }
}

/** 检查 stash guard 是否存在 */
export async function checkStashGuard(): Promise<{ exists: boolean; timestamp?: string }> {
  try {
    const gitDir = await getGitDir()
    const guardPath = join(gitDir, STASH_GUARD_FILE)
    if (existsSync(guardPath)) {
      const timestamp = readFileSync(guardPath, 'utf-8').trim()
      return { exists: true, timestamp }
    }
  } catch {
    // ignore
  }
  return { exists: false }
}

/** 在 stash list 中查找 git-sync-tui 的自动 stash 条目 */
export async function findStashEntry(): Promise<string | null> {
  const git = getGit()
  try {
    const result = await git.stash(['list'])
    const lines = result.trim().split('\n')
    for (const line of lines) {
      if (line.includes('Auto-stash by git-sync-tui')) {
        return line
      }
    }
  } catch {
    // ignore
  }
  return null
}

/** 获取工作区状态 */
export async function getWorkingDirStatus(): Promise<{ isClean: boolean; hasStaged: boolean; hasUnstaged: boolean }> {
  const git = getGit()
  const status = await git.status()
  return {
    isClean: status.isClean(),
    hasStaged: status.staged.length > 0,
    hasUnstaged: status.modified.length > 0 || status.not_added.length > 0,
  }
}
