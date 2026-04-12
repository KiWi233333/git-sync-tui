import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Box, Text, useInput, useStdout } from 'ink'
import { Spinner } from '@inkjs/ui'
import { useCommits, useCommitStat } from '../hooks/use-git.js'
import { orderSelectedHashesByCommits } from '../utils/commit-selection.js'
import { SectionHeader, KeyHints, Divider } from './ui.js'
import type { CommitInfo } from '../utils/git.js'

/** 截断字符串到指定宽度（考虑中文字符宽度） */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str
  // 简单截断，保留maxLen-1个字符 + '…'
  return str.slice(0, maxLen - 1) + '…'
}

interface Props {
  remote: string
  branch: string
  onSelect: (hashes: string[], commits: CommitInfo[]) => void
  onBack?: () => void
}

/** 固定高度的 stat 面板，支持滚动 */
function StatPanel({ stat, loading, count }: { stat: string; loading: boolean; count: number }) {
  const STAT_HEIGHT = 8
  const [scrollOffset, setScrollOffset] = useState(0)

  const lines = useMemo(() => stat ? stat.split('\n') : [], [stat])
  const canScroll = lines.length > STAT_HEIGHT

  // 重置滚动位置当内容变化
  useEffect(() => { setScrollOffset(0) }, [stat])

  useInput((input) => {
    if (!canScroll) return
    if (input === 'j') {
      setScrollOffset((prev) => Math.min(prev + 1, lines.length - STAT_HEIGHT))
    } else if (input === 'k') {
      setScrollOffset((prev) => Math.max(0, prev - 1))
    }
  })

  const visibleLines = canScroll
    ? lines.slice(scrollOffset, scrollOffset + STAT_HEIGHT)
    : lines

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Box justifyContent="space-between">
        <Text bold color="cyan">
          {'◆ '}已选 {count} 个 commit · diff --stat
        </Text>
        {canScroll && (
          <Text color="gray" dimColor>
            {scrollOffset + 1}-{Math.min(scrollOffset + STAT_HEIGHT, lines.length)}/{lines.length} [j/k]
          </Text>
        )}
      </Box>
      <Box flexDirection="column" height={STAT_HEIGHT}>
        {loading ? (
          <Spinner label="加载中..." />
        ) : visibleLines.length > 0 ? (
          visibleLines.map((line, i) => (
            <Text key={scrollOffset + i} color="gray">{line}</Text>
          ))
        ) : (
          <Text color="gray" dimColor>(无变更)</Text>
        )}
      </Box>
    </Box>
  )
}

export function CommitList({ remote, branch, onSelect, onBack }: Props) {
  const { stdout } = useStdout()
  const terminalWidth = stdout?.columns ?? 80
  const { data: commits, loading, loadingMore, error, hasMore, loadMore } = useCommits(remote, branch, 100)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set())
  const [shiftMode, setShiftMode] = useState(false)
  const anchorIndexRef = useRef<number | null>(null)

  const selectedKey = useMemo(() => Array.from(selectedHashes).sort().join(','), [selectedHashes])
  const selectedArray = useMemo(() => Array.from(selectedHashes), [selectedKey])
  const { stat, loading: statLoading } = useCommitStat(selectedArray)

  // 统计已同步数量
  const syncedCount = useMemo(() => {
    if (!commits) return 0
    return commits.filter((c) => c.synced).length
  }, [commits])

  // 光标接近底部时自动加载更多
  useEffect(() => {
    if (!commits || !hasMore || loadingMore) return
    if (selectedIndex >= commits.length - 5) {
      loadMore()
    }
  }, [selectedIndex, commits?.length, hasMore, loadingMore, loadMore])

  const toggleCurrent = () => {
    if (!commits || commits.length === 0) return
    const commit = commits[selectedIndex]
    if (commit.synced) return // 已同步的不可选
    const hash = commit.hash
    setSelectedHashes((prev) => {
      const next = new Set(prev)
      if (next.has(hash)) {
        next.delete(hash)
        anchorIndexRef.current = null
      } else {
        next.add(hash)
        anchorIndexRef.current = selectedIndex
      }
      return next
    })
  }

  const selectRange = (anchor: number, current: number) => {
    if (!commits) return
    const start = Math.min(anchor, current)
    const end = Math.max(anchor, current)
    setSelectedHashes((prev) => {
      const next = new Set(prev)
      for (let i = start; i <= end; i++) {
        if (!commits[i].synced) { // 跳过已同步
          next.add(commits[i].hash)
        }
      }
      return next
    })
  }

  const toggleAll = () => {
    if (!commits || commits.length === 0) return
    const unsyncedCommits = commits.filter((c) => !c.synced)
    setSelectedHashes((prev) => {
      if (prev.size === unsyncedCommits.length) {
        anchorIndexRef.current = null
        return new Set()
      }
      return new Set(unsyncedCommits.map((c) => c.hash))
    })
  }

  const invertSelection = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      const next = new Set<string>()
      for (const c of commits) {
        if (!c.synced && !prev.has(c.hash)) next.add(c.hash)
      }
      return next
    })
  }

  const selectToCurrent = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      const next = new Set(prev)
      for (let i = 0; i <= selectedIndex; i++) {
        if (!commits[i].synced) {
          next.add(commits[i].hash)
        }
      }
      return next
    })
  }

  useInput((input, key) => {
    if (!commits || commits.length === 0) return

    if (key.shift) {
      if (!shiftMode) {
        setShiftMode(true)
        if (anchorIndexRef.current === null) {
          anchorIndexRef.current = selectedIndex
        }
      }
      if (key.upArrow) {
        const newIndex = Math.max(0, selectedIndex - 1)
        setSelectedIndex(newIndex)
        selectRange(anchorIndexRef.current!, newIndex)
      } else if (key.downArrow) {
        const newIndex = Math.min(commits.length - 1, selectedIndex + 1)
        setSelectedIndex(newIndex)
        selectRange(anchorIndexRef.current!, newIndex)
      } else if (input === ' ') {
        if (anchorIndexRef.current !== null) {
          selectRange(anchorIndexRef.current, selectedIndex)
        } else {
          toggleCurrent()
        }
      }
      return
    }

    if (shiftMode) setShiftMode(false)

    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1))
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(commits.length - 1, prev + 1))
    } else if (input === ' ') {
      toggleCurrent()
    } else if (input === 'a' || input === 'A') {
      toggleAll()
    } else if (input === 'i' || input === 'I') {
      invertSelection()
    } else if (input === 'r' || input === 'R') {
      selectToCurrent()
    } else if (key.escape) {
      onBack?.()
    } else if (key.return) {
      if (selectedHashes.size > 0) {
        onSelect(orderSelectedHashesByCommits(commits, selectedHashes), commits)
      }
    }
  })

  if (loading) {
    return <Spinner label={`获取 ${remote}/${branch} 的 commit 列表...`} />
  }

  if (error) {
    return <Text color="red">{'✖ '}获取 commit 列表失败: {error}</Text>
  }

  if (!commits || commits.length === 0) {
    return <Text color="yellow">{'▲ '}该分支没有 commit</Text>
  }

  const visibleCount = 10
  const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), commits.length - visibleCount))
  const visibleCommits = commits.slice(startIdx, startIdx + visibleCount)

  const unsyncedTotal = commits.length - syncedCount

  // 计算 message 可用宽度：总宽度 - 前缀(12) - 后缀预留(25) - 余量(2)
  const maxMsgWidth = Math.max(10, terminalWidth - 39)

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="选择要同步的 commit" />

      {/* Status bar */}
      <Box gap={2}>
        <Text color="gray" dimColor>
          {remote}/{branch}
        </Text>
        <Text color="gray" dimColor>
          {commits.length} commits{hasMore ? '+' : ''}
        </Text>
        {syncedCount > 0 && (
          <Text color="gray" dimColor>
            {syncedCount} 已同步
          </Text>
        )}
        <Text color="green">
          {unsyncedTotal} 待同步
        </Text>
        <Text color={selectedHashes.size > 0 ? 'cyan' : 'gray'} bold={selectedHashes.size > 0}>
          已选 {selectedHashes.size}
        </Text>
        {shiftMode && <Text color="yellow" bold>SHIFT</Text>}
        {loadingMore && <Text color="gray" dimColor>加载中...</Text>}
      </Box>

      {/* Commit list */}
      <Box flexDirection="column">
        {startIdx > 0 && (
          <Text color="gray" dimColor>{'  '}↑ {startIdx} more</Text>
        )}
        {visibleCommits.map((c, i) => {
          const actualIdx = startIdx + i
          const isSelected = selectedHashes.has(c.hash)
          const isCursor = actualIdx === selectedIndex
          const isAnchor = actualIdx === anchorIndexRef.current
          const isSynced = !!c.synced

          return (
            <Box key={c.hash}>
              <Text
                backgroundColor={isCursor ? (isSynced ? 'gray' : 'blue') : undefined}
                color={isSynced ? 'gray' : isSelected ? 'green' : 'white'}
                dimColor={isSynced}
              >
                {isCursor ? '▸ ' : '  '}
                {isSynced ? '✓' : isAnchor ? '⚓' : isSelected ? '●' : '○'}
                {' '}
              </Text>
              <Text
                backgroundColor={isCursor ? (isSynced ? 'gray' : 'blue') : undefined}
                color={isSynced ? 'gray' : 'yellow'}
                dimColor={isSynced}
              >
                {c.shortHash}
              </Text>
              <Text
                backgroundColor={isCursor ? (isSynced ? 'gray' : 'blue') : undefined}
                color={isSynced ? 'gray' : isSelected ? 'green' : 'white'}
                dimColor={isSynced}
              >
                {' '}{truncate(c.message, maxMsgWidth)}
              </Text>
              <Text color="gray" dimColor> {c.author} · {c.date}</Text>
              {isSynced && <Text color="gray" dimColor> [已同步]</Text>}
            </Box>
          )
        })}
        {startIdx + visibleCount < commits.length ? (
          <Text color="gray" dimColor>{'  '}↓ {commits.length - startIdx - visibleCount} more</Text>
        ) : hasMore ? (
          <Text color="gray" dimColor>{'  '}↓ 滚动加载更多...</Text>
        ) : null}
      </Box>

      {/* Key hints */}
      <KeyHints hints={[
        { key: '↑↓', label: '导航' },
        { key: 'Space', label: '选择' },
        { key: 'a', label: '全选' },
        { key: 'i', label: '反选' },
        { key: 'r', label: '选至开头' },
        { key: 'Shift+↑↓', label: '连选' },
        { key: 'Enter', label: '确认' },
        { key: 'Esc', label: '返回' },
      ]} />

      {/* Stat preview - fixed height */}
      {selectedHashes.size > 0 && (
        <StatPanel stat={stat} loading={statLoading} count={selectedHashes.size} />
      )}
    </Box>
  )
}
