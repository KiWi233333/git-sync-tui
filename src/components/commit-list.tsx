import React, { useState, useMemo, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { useCommits, useCommitStat } from '../hooks/use-git.js'
import type { CommitInfo } from '../utils/git.js'

interface Props {
  remote: string
  branch: string
  onSelect: (hashes: string[], commits: CommitInfo[]) => void
}

export function CommitList({ remote, branch, onSelect }: Props) {
  const { data: commits, loading, error } = useCommits(remote, branch, 30)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedHashes, setSelectedHashes] = useState<Set<string>>(new Set())
  const [shiftMode, setShiftMode] = useState(false)
  const anchorIndexRef = useRef<number | null>(null) // shift 选择的锚点

  // 用稳定的 key 避免 Set 引用变化导致频繁重渲染
  const selectedKey = useMemo(() => Array.from(selectedHashes).sort().join(','), [selectedHashes])
  const selectedArray = useMemo(() => Array.from(selectedHashes), [selectedKey])
  const { stat, loading: statLoading } = useCommitStat(selectedArray)

  // 切换当前项选择状态
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

  // 选择范围（从锚点到当前索引）
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

  // 全选/取消全选
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

  // 反选
  const invertSelection = () => {
    if (!commits || commits.length === 0) return
    setSelectedHashes((prev) => {
      const next = new Set<string>()
      for (const c of commits) {
        if (!prev.has(c.hash)) {
          next.add(c.hash)
        }
      }
      return next
    })
  }

  // 选择从第一项到当前项
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

    // shift 组合键处理
    if (key.shift) {
      if (!shiftMode) {
        setShiftMode(true)
        // 设置锚点
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
        // Shift+Space: 选择从锚点到当前
        if (anchorIndexRef.current !== null) {
          selectRange(anchorIndexRef.current, selectedIndex)
        } else {
          toggleCurrent()
        }
      }
      return
    }

    // 退出 shift 模式
    if (shiftMode) {
      setShiftMode(false)
    }

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
    } else if (key.return) {
      if (selectedHashes.size > 0) {
        onSelect(Array.from(selectedHashes), commits)
      }
    }
  })

  if (loading) {
    return (
      <Box>
        <Spinner label={`正在获取 ${remote}/${branch} 的 commit 列表...`} />
      </Box>
    )
  }

  if (error) {
    return <Text color="red">获取 commit 列表失败: {error}</Text>
  }

  if (!commits || commits.length === 0) {
    return <Text color="yellow">该分支没有 commit</Text>
  }

  // 计算显示范围
  const visibleCount = 10
  const startIdx = Math.max(0, Math.min(selectedIndex - Math.floor(visibleCount / 2), commits.length - visibleCount))
  const visibleCommits = commits.slice(startIdx, startIdx + visibleCount)

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        [3/5] 选择要同步的 commit
      </Text>
      <Text color="gray" dimColor>
        {remote}/{branch} 最近 {commits.length} 个 commit | 已选 {selectedHashes.size} 个
        {shiftMode && <Text color="yellow"> | Shift 模式</Text>}
      </Text>

      {/* commit 列表 */}
      <Box flexDirection="column">
        {startIdx > 0 && (
          <Text color="gray" dimColor>  ↑ {startIdx} more...</Text>
        )}
        {visibleCommits.map((c, i) => {
          const actualIdx = startIdx + i
          const isSelected = selectedHashes.has(c.hash)
          const isCursor = actualIdx === selectedIndex
          const isAnchor = actualIdx === anchorIndexRef.current

          return (
            <Text key={c.hash}>
              <Text backgroundColor={isCursor ? 'blue' : undefined} color={isSelected ? 'green' : 'white'}>
                {isCursor ? '▶ ' : '  '}
                {isAnchor ? '⚓ ' : isSelected ? '● ' : '○ '}
                {c.shortHash} {c.message}
              </Text>
              <Text color="gray" dimColor> ({c.author})</Text>
            </Text>
          )
        })}
        {startIdx + visibleCount < commits.length && (
          <Text color="gray" dimColor>  ↓ {commits.length - startIdx - visibleCount} more...</Text>
        )}
      </Box>

      {/* 快捷键提示 */}
      <Box flexDirection="column" gap={0}>
        <Box gap={2}>
          <Text><Text color="cyan">↑/↓</Text> 导航</Text>
          <Text><Text color="cyan">Space</Text> 选择</Text>
          <Text><Text color="cyan">a</Text> 全选</Text>
          <Text><Text color="cyan">i</Text> 反选</Text>
          <Text><Text color="cyan">Enter</Text> 确认</Text>
        </Box>
        <Box gap={2}>
          <Text><Text color="yellow">Shift+↑/↓</Text> 连续选择</Text>
          <Text><Text color="yellow">Shift+Space</Text> 范围选择</Text>
          <Text><Text color="cyan">r</Text> 选至开头</Text>
        </Box>
      </Box>

      {/* 预览 */}
      {selectedHashes.size > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor="gray" paddingX={1}>
          <Text bold color="yellow">
            已选 {selectedHashes.size} 个 commit — diff --stat 预览:
          </Text>
          {statLoading ? (
            <Spinner label="加载中..." />
          ) : (
            <Text color="gray">{stat || '(无变更)'}</Text>
          )}
        </Box>
      )}
    </Box>
  )
}
