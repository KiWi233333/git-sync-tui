/**
 * 核心 git 工具函数测试脚本
 * 运行: npx tsx scripts/test-core.mts
 */
import { execSync } from 'child_process'
import path from 'path'
import fs from 'fs'
import os from 'os'

// 在临时目录创建测试用 git repo
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'git-sync-test-'))
const repoA = path.join(tmpDir, 'repo-a') // 源仓库
const repoB = path.join(tmpDir, 'repo-b') // 目标仓库（模拟用户工作目录）

function run(cmd: string, cwd: string) {
  return execSync(cmd, { cwd, encoding: 'utf-8', env: { ...process.env, GIT_AUTHOR_NAME: 'Test', GIT_AUTHOR_EMAIL: 'test@test.com', GIT_COMMITTER_NAME: 'Test', GIT_COMMITTER_EMAIL: 'test@test.com' } }).trim()
}

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ ${msg}`)
    passed++
  } else {
    console.log(`  ✗ ${msg}`)
    failed++
  }
}

try {
  // === Setup ===
  console.log('Setting up test repositories...')
  fs.mkdirSync(repoA, { recursive: true })
  fs.mkdirSync(repoB, { recursive: true })

  // Init repo A with some commits
  run('git init', repoA)
  run('git checkout -b main', repoA)
  fs.writeFileSync(path.join(repoA, 'file1.txt'), 'hello')
  run('git add -A && git commit -m "commit-1: add file1"', repoA)

  fs.writeFileSync(path.join(repoA, 'file2.txt'), 'world')
  run('git add -A && git commit -m "commit-2: add file2"', repoA)

  fs.writeFileSync(path.join(repoA, 'file3.txt'), 'foo')
  run('git add -A && git commit -m "commit-3: add file3"', repoA)

  // Init repo B (target)
  run('git init', repoB)
  run('git checkout -b main', repoB)
  fs.writeFileSync(path.join(repoB, 'base.txt'), 'base')
  run('git add -A && git commit -m "base commit"', repoB)

  // === 动态导入 git utils (设置 CWD 到 repoB) ===
  process.chdir(repoB)

  // 直接用 simple-git 测试核心功能
  const simpleGit = (await import('simple-git')).default
  const git = simpleGit(repoB)

  // --- Test: addRemote ---
  console.log('\n--- addRemote ---')
  await git.addRemote('source', repoA)
  const remotes = await git.getRemotes(true)
  assert(remotes.some(r => r.name === 'source'), 'addRemote: remote "source" added')

  // --- Test: fetch ---
  console.log('\n--- fetch ---')
  await git.fetch('source')
  const branches = await git.branch(['-r'])
  assert(branches.all.some(b => b.includes('source/main')), 'fetch: source/main branch visible')

  // --- Test: getRemoteBranches ---
  console.log('\n--- getRemoteBranches ---')
  const remoteBranches = branches.all.filter(b => b.startsWith('source/'))
  assert(remoteBranches.length > 0, `getRemoteBranches: found ${remoteBranches.length} branches`)

  // --- Test: getCommits ---
  console.log('\n--- getCommits ---')
  const log = await git.log({ from: 'source/main', maxCount: 30 })
  assert(log.all.length === 3, `getCommits: found ${log.all.length} commits (expected 3)`)

  const hashes = log.all.map(c => c.hash)
  const lastHash = hashes[0]  // most recent
  const firstHash = hashes[hashes.length - 1]  // oldest

  // --- Test: isWorkingDirClean ---
  console.log('\n--- isWorkingDirClean ---')
  const status1 = await git.status()
  assert(status1.isClean(), 'isWorkingDirClean: clean after setup')

  // --- Test: stash / stashPop ---
  console.log('\n--- stash / stashPop ---')
  fs.writeFileSync(path.join(repoB, 'dirty.txt'), 'uncommitted')
  run('git add dirty.txt', repoB)
  const status2 = await git.status()
  assert(!status2.isClean(), 'stash: working dir is dirty')

  await git.stash()
  const status3 = await git.status()
  assert(status3.isClean(), 'stash: working dir clean after stash')

  await git.stash(['pop'])
  const status4 = await git.status()
  assert(!status4.isClean(), 'stashPop: dirty file restored')

  // Clean up the dirty file
  run('git checkout -- . && git clean -fd', repoB)

  // --- Test: cherry-pick --no-commit ---
  console.log('\n--- cherryPick (--no-commit) ---')
  // Cherry-pick the last commit (commit-3: add file3)
  await git.raw(['cherry-pick', '--no-commit', lastHash])
  const status5 = await git.status()
  assert(status5.staged.includes('file3.txt') || fs.existsSync(path.join(repoB, 'file3.txt')),
    'cherryPick: file3.txt applied from commit-3')

  // Reset to clean state
  run('git reset --hard HEAD', repoB)

  // --- Test: cherry-pick multiple (reversed order for chronological apply) ---
  console.log('\n--- cherryPick multiple ---')
  const twoHashes = [hashes[1], hashes[0]] // commit-2, commit-3
  for (const h of [...twoHashes].reverse()) {
    await git.raw(['cherry-pick', '--no-commit', h])
  }
  assert(fs.existsSync(path.join(repoB, 'file2.txt')), 'cherryPick multiple: file2.txt exists')
  assert(fs.existsSync(path.join(repoB, 'file3.txt')), 'cherryPick multiple: file3.txt exists')

  // Reset
  run('git reset --hard HEAD', repoB)

  // --- Test: diff --stat ---
  console.log('\n--- diff --stat ---')
  await git.raw(['cherry-pick', '--no-commit', lastHash])
  const stat = await git.diff(['--stat', '--cached'])
  assert(stat.includes('file3.txt'), 'diff --stat: shows file3.txt change')

  // Reset
  run('git reset --hard HEAD', repoB)

  // --- Summary ---
  console.log(`\n${'='.repeat(40)}`)
  console.log(`Results: ${passed} passed, ${failed} failed`)
  if (failed > 0) process.exit(1)

} finally {
  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true })
}
