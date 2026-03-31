import * as git from './utils/git.js'
import { checkForUpdate } from './utils/update-check.js'
import { createInterface } from 'readline'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const { version: APP_VERSION } = require('../package.json')

export interface CliOptions {
  remote: string
  branch: string
  commits?: string[]
  count: number
  mainline: boolean
  yes: boolean
  noStash: boolean
  list: boolean
}

function log(msg: string) {
  process.stdout.write(msg + '\n')
}

function error(msg: string) {
  process.stderr.write(msg + '\n')
}

function padEnd(str: string, len: number): string {
  return str.length >= len ? str : str + ' '.repeat(len - str.length)
}

async function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(`${message} [y/N] `, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

async function handleStash(noStash: boolean): Promise<boolean> {
  const clean = await git.isWorkingDirClean()
  if (clean) {
    log('✔ 工作区干净')
    return false
  }

  if (noStash) {
    log('▲ 工作区有未提交变更（--no-stash 跳过 stash）')
    return false
  }

  log('▲ 工作区有未提交变更，自动 stash...')
  const ok = await git.stash()
  if (ok) {
    await git.writeStashGuard()
    log('✔ 已 stash 工作区变更')
    return true
  }
  error('✖ stash 失败')
  process.exit(1)
  return false // unreachable
}

async function restoreStash(stashed: boolean): Promise<void> {
  if (!stashed) return
  const ok = await git.stashPop()
  await git.removeStashGuard()
  if (ok) {
    log('✔ 已恢复工作区变更 (stash pop)')
  } else {
    error('▲ stash pop 失败，请手动执行: git stash pop')
  }
}

async function validateRemote(name: string): Promise<void> {
  const remotes = await git.getRemotes()
  if (!remotes.some((r) => r.name === name)) {
    const available = remotes.map((r) => r.name).join(', ')
    error(`✖ 远程仓库 '${name}' 不存在`)
    if (available) error(`  可用: ${available}`)
    process.exit(1)
  }
  log(`✔ 远程仓库 '${name}'`)
}

async function validateBranch(remote: string, branch: string): Promise<void> {
  const branches = await git.getRemoteBranches(remote)
  if (!branches.includes(branch)) {
    error(`✖ 分支 '${branch}' 不存在于 ${remote}`)
    const similar = branches.filter((b) => b.toLowerCase().includes(branch.toLowerCase())).slice(0, 5)
    if (similar.length > 0) error(`  类似: ${similar.join(', ')}`)
    process.exit(1)
  }
  log(`✔ 分支 '${remote}/${branch}'`)
}

function formatCommitLine(c: git.CommitInfo): string {
  return `  ${c.shortHash}  ${padEnd(c.message.slice(0, 60), 62)} ${padEnd(c.author, 16)} ${c.date}`
}

export async function runList(opts: CliOptions): Promise<void> {
  await validateRemote(opts.remote)
  log(`获取 ${opts.remote}/${opts.branch} 的 commit 列表...`)
  await validateBranch(opts.remote, opts.branch)

  const commits = await git.getCommits(opts.remote, opts.branch, opts.count)
  if (commits.length === 0) {
    log('(无 commit)')
    return
  }

  log(`\nCommits on ${opts.remote}/${opts.branch} (${commits.length}):`)
  for (const c of commits) {
    log(formatCommitLine(c))
  }
}

export async function runExec(opts: CliOptions): Promise<void> {
  // 1. Stash
  const stashed = await handleStash(opts.noStash)

  // 2. Validate
  await validateRemote(opts.remote)
  await validateBranch(opts.remote, opts.branch)

  // 3. Resolve commit hashes
  const allCommits = await git.getCommits(opts.remote, opts.branch, opts.count)
  const hashes = opts.commits!
  const resolved: git.CommitInfo[] = []

  for (const input of hashes) {
    const match = allCommits.find(
      (c) => c.hash === input || c.shortHash === input || c.hash.startsWith(input),
    )
    if (!match) {
      error(`✖ commit '${input}' 未找到在 ${opts.remote}/${opts.branch}`)
      await restoreStash(stashed)
      process.exit(1)
    }
    resolved.push(match)
  }

  // 4. Check merge commits
  const resolvedHashes = resolved.map((c) => c.hash)
  const hasMerge = await git.hasMergeCommits(resolvedHashes)
  if (hasMerge && !opts.mainline) {
    log('▲ 检测到 merge commit，建议添加 --mainline (-m) 参数')
  }

  // 5. Show plan
  log(`\nCherry-pick ${resolved.length} 个 commit (--no-commit${opts.mainline ? ' -m 1' : ''}):`)
  for (const c of resolved) {
    log(formatCommitLine(c))
  }
  log('')

  // 6. Confirm
  if (!opts.yes) {
    const ok = await confirm('确认执行?')
    if (!ok) {
      log('已取消')
      await restoreStash(stashed)
      process.exit(0)
    }
  }

  // 7. Execute
  const result = await git.cherryPick(resolvedHashes, opts.mainline)

  if (result.success) {
    log('✔ Cherry-pick 完成')
    const stat = await git.getStagedStat()
    if (stat) {
      log(`\n暂存区变更 (git diff --cached --stat):\n${stat}`)
    }
    log('\n▲ 改动已暂存到工作区 (--no-commit 模式)')
    log('  审查后手动执行:')
    log('  git diff --cached          # 查看详细 diff')
    log('  git commit -m "sync: ..."  # 提交')
    log('  git reset HEAD             # 或放弃')
  } else {
    error('✖ Cherry-pick 遇到冲突')
    if (result.conflictFiles && result.conflictFiles.length > 0) {
      error('冲突文件:')
      for (const f of result.conflictFiles) {
        error(`  ${f}`)
      }
    }
    error('\n▸ 手动解决冲突后执行 git add 和 git commit')
    error('▸ 或执行 git cherry-pick --abort 放弃操作')
  }

  // 8. Restore stash
  await restoreStash(stashed)

  if (!result.success) {
    process.exit(1)
  }
}

async function printUpdateNotice(): Promise<void> {
  const info = await checkForUpdate(APP_VERSION)
  if (info.hasUpdate) {
    log(`\n💡 新版本可用 ${info.latest} (当前 ${info.current}) → npm i -g git-sync-tui`)
  }
}

export async function runCli(opts: CliOptions): Promise<void> {
  if (opts.list) {
    await runList(opts)
  } else {
    await runExec(opts)
  }
  await printUpdateNotice()
}
