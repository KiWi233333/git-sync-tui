import test from 'node:test'
import assert from 'node:assert/strict'
import { orderSelectedHashesByCommits } from './commit-selection.js'
import type { CommitInfo } from './git.js'

function commit(hash: string): CommitInfo {
  return {
    hash,
    shortHash: hash.slice(0, 7),
    message: `commit ${hash}`,
    author: 'tester',
    date: 'now',
  }
}

test('orderSelectedHashesByCommits follows commit list order', () => {
  const commits = [commit('newest'), commit('middle'), commit('oldest')]
  const selectedHashes = new Set(['oldest', 'newest'])

  assert.deepEqual(orderSelectedHashesByCommits(commits, selectedHashes), ['newest', 'oldest'])
})

test('orderSelectedHashesByCommits ignores hashes missing from the commit list', () => {
  const commits = [commit('newest'), commit('oldest')]
  const selectedHashes = new Set(['missing', 'oldest'])

  assert.deepEqual(orderSelectedHashesByCommits(commits, selectedHashes), ['oldest'])
})
