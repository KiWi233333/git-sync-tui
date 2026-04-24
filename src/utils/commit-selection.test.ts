import test from 'node:test'
import assert from 'node:assert/strict'
import type { CommitInfo } from './git.js'
import { orderSelectedHashesByCommits } from './commit-selection.js'

const makeCommit = (hash: string): CommitInfo => ({
  hash,
  shortHash: hash.slice(0, 7),
  message: `msg-${hash}`,
  author: 'tester',
  date: 'now',
})

test('orderSelectedHashesByCommits keeps original commit list order for sparse selections', () => {
  const commits = [
    makeCommit('c5'),
    makeCommit('c4'),
    makeCommit('c3'),
    makeCommit('c2'),
    makeCommit('c1'),
  ]

  const selected = new Set(['c2', 'c5', 'c3'])

  const ordered = orderSelectedHashesByCommits(commits, selected)

  assert.deepEqual(ordered, ['c5', 'c3', 'c2'])
})
