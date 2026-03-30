import simpleGit, { type SimpleGit } from 'simple-git'

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

  // 先 fetch
  try {
    await git.fetch(remote)
  } catch {
    // fetch 失败不阻塞，用本地缓存
  }

  const result = await git.branch(['-r'])
  const prefix = `${remote}/`

  return result.all
    .filter((b) => b.startsWith(prefix) && !b.includes('HEAD'))
    .map((b) => b.replace(prefix, ''))
    .sort()
}

/** 获取远程分支的 commit 列表 */
export async function getCommits(
  remote: string,
  branch: string,
  count: number = 30,
): Promise<CommitInfo[]> {
  const git = getGit()
  const ref = `${remote}/${branch}`

  const log = await git.log({
    from: undefined,
    to: ref,
    maxCount: count,
    format: {
      hash: '%H',
      shortHash: '%h',
      message: '%s',
      author: '%an',
      date: '%ar',
    },
  })

  return log.all.map((entry) => ({
    hash: entry.hash,
    shortHash: entry.hash.substring(0, 7),
    message: (entry as any).message || '',
    author: (entry as any).author || '',
    date: (entry as any).date || '',
  }))
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
