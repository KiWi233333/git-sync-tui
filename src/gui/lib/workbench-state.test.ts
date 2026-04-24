import test from 'node:test'
import assert from 'node:assert/strict'
import { getConflictProgress, orderSelectedCommits, resolveChunk } from './workbench-state.js'
import type { CommitItem, ConflictChunk, ResolutionStrategy } from '../types.js'

const makeCommit = (hash: string): CommitItem => ({
  hash,
  shortHash: hash.slice(0, 7),
  title: `commit-${hash}`,
  author: 'tester',
  relativeTime: 'now',
  filesChanged: 1,
  insertions: 1,
  deletions: 0,
  tags: [],
  risk: 'safe',
})

const sampleChunk: ConflictChunk = {
  id: 'chunk-1',
  incomingStart: 10,
  currentStart: 20,
  baseHint: 'base',
  incomingLines: ['incoming-1', 'incoming-2'],
  currentLines: ['current-1'],
}

test('orderSelectedCommits keeps original commit list order for sparse selections', () => {
  const commits = [
    makeCommit('c5'),
    makeCommit('c4'),
    makeCommit('c3'),
    makeCommit('c2'),
    makeCommit('c1'),
  ]

  const selected = new Set(['c2', 'c5', 'c3'])

  assert.deepEqual(
    orderSelectedCommits(commits, selected).map((commit) => commit.hash),
    ['c5', 'c3', 'c2'],
  )
})

test('resolveChunk returns expected lines for each merge strategy', () => {
  const strategies: Array<[ResolutionStrategy, string[]]> = [
    ['incoming', ['incoming-1', 'incoming-2']],
    ['current', ['current-1']],
    ['both-incoming-first', ['incoming-1', 'incoming-2', '', 'current-1']],
    ['both-current-first', ['current-1', '', 'incoming-1', 'incoming-2']],
    ['unresolved', []],
  ]

  for (const [strategy, expected] of strategies) {
    assert.deepEqual(resolveChunk(sampleChunk, strategy), expected)
  }
})

test('getConflictProgress counts resolved chunks correctly', () => {
  assert.deepEqual(
    getConflictProgress({
      a: 'incoming',
      b: 'unresolved',
      c: 'both-current-first',
    }),
    { resolved: 2, total: 3 },
  )
})
