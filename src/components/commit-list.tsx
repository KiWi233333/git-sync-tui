import React, { useState, useMemo, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { useCommits, useCommitStat } from '../hooks/use-git.js'
import { SectionHeader, KeyHints, Divider, StatusPanel } from './ui.js'
import type { CommitInfo } from '../utils/git.js'

interface Props {
  remote: string
  branch: string
  onSelect: (hashes: string[], commits: CommitInfo[]) => void
  onBack?: () => void
}

export function CommitList({ remote, branch, onSelect, onBack }: Props) {
  const { data: commits, loading, error } = useCommits(remote, branch, 30)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set())
  const [shiftMode, setShiftMode] = useState(false)
  const anchorIndexRef = useRef<number | null>(null)

  const selectedKey = useMemo(() => Array.from(selectedHashes).sort().join(','), [selectedHashes])
  const selectedArray = useMemo(() => Array.from(selectedHashes), [selectedKey])
  const { stat, loading: statLoading } = useCommitStat(selectedArray)

  const toggleCurrent = () => {
    if (!commits || commits.length === 0) return
    const hash = commits[selectedIndex].hash
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
        next.add(commits[i].hash)
      }
      return next
    })
  }

  const toggleAll = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      if (prev.size === commits.length) {
        anchorIndexRef.current = null
        return new Set()
      }
      return new Set(commits.map((c) => c.hash))
    })
  }

  const invertSelection = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      const next = new Set<string>()
      for (const c of commits) {
        if (!prev.has(c.hash)) next.add(c.hash)
      }
      return next
    })
  }

  const selectToCurrent = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      const next = new Set(prev)
      for (let i = 0; i <= selectedIndex; i++) {
        next.add(commits[i].hash)
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
        onSelect(Array.from(selectedHashes), commits)
      }
    }
  })

  if (loading) {
    return <Spinner label={`获取 ${remote}/${branch} 的 commit 列表...`} />
  }

  if (error) {
    return <Text color="red">✖ 获取 commit 列表失败: {error}</Text>
  }

  if (!commits || commits.length === 0) {
    return <Text color="yellow">▲ 该分支没有 commit</Text>
  }

  const visibleCount = 10
  const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), commits.length - visibleCount))
  const visibleCommits = commits.slice(startIdx, startIdx + visibleCount)

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="选择要同步的 commit" />

      <Box gap={2}>
        <Text color="gray" dimColor>
          {remote}/{branch}
        </Text>
        <Text color="gray" dimColor>
          {commits.length} commits
        </Text>
        <Text color={selectedHashes.size > 0 ? 'cyan' : 'gray'} bold={selectedHashes.size > 0}>
          已选 {selectedHashes.size}
        </Text>
        {shiftMode && <Text color="yellow" bold>SHIFT</Text>}
      </Box>

      {/* Commit list */}
      <Box flexDirection="column">
        {startIdx > 0 && (
          <Text color="gray" dimColor>  ↑ {startIdx} more</Text>
        )}
        {visibleCommits.map((c, i) => {
          const actualIdx = startIdx + i
          const isSelected = selectedHashes.has(c.hash)
          const isCursor = actualIdx === selectedIndex
          const isAnchor = actualIdx === anchorIndexRef.current

          return (
            <Box key={c.hash}>
              <Text backgroundColor={isCursor ? 'blue' : undefined} color={isSelected ? 'green' : 'white'}>
                {isCursor ? '▸ ' : '  '}
                {isAnchor ? '⚓' : isSelected ? '●' : '○'}
                {' '}
              </Text>
              <Text backgroundColor={isCursor ? 'blue' : undefined} color="yellow">{c.shortHash}</Text>
              <Text backgroundColor={isCursor ? 'blue' : undefined} color={isSelected ? 'green' : 'white'}> {c.message}</Text>
              <Text color="gray" dimColor> {c.author} · {c.date}</Text>
            </Box>
          )
        })}
        {startIdx + visibleCount < commits.length && (
          <Text color="gray" dimColor>  ↓ {commits.length - startIdx - visibleCount} more</Text>
        )}
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

      {/* Stat preview */}
      {selectedHashes.size > 0 && (
        <StatusPanel type="info" title={`已选 ${selectedHashes.size} 个 commit · diff --stat`}>
          {statLoading ? (
            <Spinner label="加载中..." />
          ) : (
            <Text color="gray">{stat || '(无变更)'}</Text>
          )}
        </StatusPanel>
      )}
    </Box>
  )
}
