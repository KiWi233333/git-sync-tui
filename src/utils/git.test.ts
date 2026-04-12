import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, writeFileSync, chmodSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { cherryPick, branchExists, switchBranch, getCurrentBranch, createBranchFrom } from './git.js'

async function runSwitchBranchWithFakeGit(branch: string) {
  const tempDir = mkdtempSync(join(tmpdir(), 'git-sync-tui-test-'))
  const logFile = join(tempDir, 'git-calls.log')
  const fakeGit = join(tempDir, 'git')

  writeFileSync(
    fakeGit,
    `#!/bin/sh\nprintf '%s\\n' "$*" >> "${logFile}"\nexit 0\n`,
  )
  chmodSync(fakeGit, 0o755)

  const oldPath = process.env.PATH || ''
  process.env.PATH = `${tempDir}:${oldPath}`

  try {
    await switchBranch(branch)
    const commands = existsSync(logFile)
      ? readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean)
      : []
    return { commands }
  } finally {
    process.env.PATH = oldPath
  }
}


async function runCreateBranchFromWithFakeGit(newBranch: string, baseBranch: string) {
  const tempDir = mkdtempSync(join(tmpdir(), 'git-sync-tui-test-'))
  const logFile = join(tempDir, 'git-calls.log')
  const fakeGit = join(tempDir, 'git')

  writeFileSync(
    fakeGit,
    `#!/bin/sh\nprintf '%s\\n' "$*" >> "${logFile}"\nexit 0\n`,
  )
  chmodSync(fakeGit, 0o755)

  const oldPath = process.env.PATH || ''
  process.env.PATH = `${tempDir}:${oldPath}`

  try {
    await createBranchFrom(newBranch, baseBranch)
    const commands = existsSync(logFile)
      ? readFileSync(logFile, 'utf8').trim().split('\n').filter(Boolean)
      : []
    return { commands }
  } finally {
    process.env.PATH = oldPath
  }
}


async function runCherryPickWithFakeGit(hashes: string[], useMainline = false) {
  const tempDir = mkdtempSync(join(tmpdir(), 'git-sync-tui-test-'))
  const logFile = join(tempDir, 'git-calls.log')
  const fakeGit = join(tempDir, 'git')

  writeFileSync(
    fakeGit,
    `#!/bin/sh\nprintf '%s\\n' "$*" >> "${logFile}"\nexit 0\n`,
  )
  chmodSync(fakeGit, 0o755)

  const oldPath = process.env.PATH || ''
  process.env.PATH = `${tempDir}:${oldPath}`

  try {
    const result = await cherryPick(hashes, useMainline)

    const commands = existsSync(logFile)
      ? readFileSync(logFile, 'utf8')
        .trim()
        .split('\n')
        .filter((line) => line.startsWith('cherry-pick --no-commit '))
      : []

    return { result, commands }
  } finally {
    process.env.PATH = oldPath
  }
}

test('branchExists returns true only for existing local branch', { concurrency: false }, async () => {
  const beforeBranch = await getCurrentBranch()

  const existsCurrent = await branchExists(beforeBranch)
  assert.equal(existsCurrent, true)

  const existsMissing = await branchExists('__missing_branch_for_git_sync_tui_test__')
  assert.equal(existsMissing, false)
})

test('switchBranch checks out target branch directly', { concurrency: false }, async () => {
  const { commands } = await runSwitchBranchWithFakeGit('zyb/feat/sdk-api-compat')
  assert.deepEqual(commands, ['checkout zyb/feat/sdk-api-compat'])
})
test('createBranchFrom creates and switches using checkout -b', { concurrency: false }, async () => {
  const { commands } = await runCreateBranchFromWithFakeGit('zyb/feat/sdk-api-compat', 'master')
  assert.deepEqual(commands, ['checkout -b zyb/feat/sdk-api-compat master'])
})

test('cherryPick preserves input order in different scenarios', async (t) => {
  await t.test('executes commits in provided order', async () => {
    const { result, commands } = await runCherryPickWithFakeGit(['newer-hash', 'older-hash'])

    assert.equal(result.success, true)
    assert.deepEqual(commands, [
      'cherry-pick --no-commit newer-hash',
      'cherry-pick --no-commit older-hash',
    ])
  })

  await t.test('keeps three-commit list order unchanged', async () => {
    const hashes = ['c3', 'c2', 'c1']
    const { result, commands } = await runCherryPickWithFakeGit(hashes)

    assert.equal(result.success, true)
    assert.deepEqual(commands, [
      'cherry-pick --no-commit c3',
      'cherry-pick --no-commit c2',
      'cherry-pick --no-commit c1',
    ])
  })

  await t.test('preserves order when useMainline is enabled', async () => {
    const hashes = ['merge-newer', 'merge-older']
    const { result, commands } = await runCherryPickWithFakeGit(hashes, true)

    assert.equal(result.success, true)
    assert.deepEqual(commands, [
      'cherry-pick --no-commit -m 1 merge-newer',
      'cherry-pick --no-commit -m 1 merge-older',
    ])
  })

  await t.test('does nothing for empty hash list', async () => {
    const { result, commands } = await runCherryPickWithFakeGit([])

    assert.equal(result.success, true)
    assert.deepEqual(commands, [])
  })
})
