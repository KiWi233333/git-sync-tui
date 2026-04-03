import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner, TextInput } from '@inkjs/ui'
import { useBranches } from '../hooks/use-git.js'
import { SectionHeader } from './ui.js'

interface Props {
  remote: string
  lastBranch?: string  // 上次选择的 branch，用于定位光标
  onSelect: (branch: string) => void
  onBack?: () => void
}

export function BranchSelect({ remote, lastBranch, onSelect, onBack }: Props) {
  const { data: branches, loading, error } = useBranches(remote)
  const [filter, setFilter] = useState('')
  const prevFilterRef = useRef('')
  // 根据上次选择设置初始光标位置
  const [cursorIndex, setCursorIndex] = useState(() => {
    if (lastBranch && branches) {
      const idx = branches.indexOf(lastBranch)
      if (idx >= 0) return idx
    }
    return 0
  })

  // 当 branches 加载完成后，定位到上次选择
  useEffect(() => {
    if (lastBranch && branches && branches.length > 0) {
      const idx = branches.indexOf(lastBranch)
      if (idx >= 0) setCursorIndex(idx)
    }
  }, [branches, lastBranch])

  // 只有当 filter 实际改变时才重置光标
  useEffect(() => {
    if (filter !== prevFilterRef.current) {
      prevFilterRef.current = filter
      setCursorIndex(0)
    }
  }, [filter])

  const filteredBranches = useMemo(() => {
    if (!branches) return []
    return filter
      ? branches.filter((b) => b.toLowerCase().includes(filter.toLowerCase()))
      : branches
  }, [branches, filter])

  // 可见窗口
  const visibleCount = 10
  const startIdx = Math.max(0, Math.min(cursorIndex - Math.floor(visibleCount / 2), filteredBranches.length - visibleCount))
  const visibleBranches = filteredBranches.slice(startIdx, startIdx + visibleCount)

  useInput((input, key) => {
    if (key.escape) {
      onBack?.()
    } else if (key.upArrow) {
      setCursorIndex((prev) => Math.max(0, prev - 1))
    } else if (key.downArrow) {
      setCursorIndex((prev) => Math.min(filteredBranches.length - 1, prev + 1))
    } else if (key.return) {
      if (filteredBranches.length > 0) {
        onSelect(filteredBranches[cursorIndex])
      }
    }
  })

  if (loading) {
    return <Spinner label={`获取 ${remote} 的分支列表...`} />
  }

  if (error) {
    return <Text color="red">{'✖ '}获取分支列表失败: {error}</Text>
  }

  if (!branches || branches.length === 0) {
    return <Text color="red">{'✖ '}未找到远程分支</Text>
  }

  return (
    <Box flexDirection="column">
      <SectionHeader title="选择分支" subtitle={`${remote} · ${branches.length} 个分支`} />

      <Box marginTop={1}>
        <Text color="cyan">/ </Text>
        <TextInput
          placeholder="输入关键字过滤..."
          onChange={setFilter}
        />
        {filter && (
          <Text color="gray" dimColor> · 匹配 {filteredBranches.length}</Text>
        )}
      </Box>

      {filteredBranches.length > 0 ? (
        <Box flexDirection="column" marginTop={1}>
          {startIdx > 0 && (
            <Text color="gray" dimColor>{'  '}↑ {startIdx} more</Text>
          )}
          {visibleBranches.map((b, i) => {
            const actualIdx = startIdx + i
            const isCursor = actualIdx === cursorIndex
            const isLastUsed = b === lastBranch
            return (
              <Box key={b}>
                <Text color={isCursor ? 'cyan' : 'gray'}>
                  {isCursor ? '›' : ' '}
                </Text>
                <Text> </Text>
                <Text color={isCursor ? 'cyan' : 'white'} bold={isCursor}>
                  {b}
                </Text>
                {isLastUsed && !isCursor && (
                  <Text color="yellow" dimColor> ★</Text>
                )}
              </Box>
            )
          })}
          {startIdx + visibleCount < filteredBranches.length && (
            <Text color="gray" dimColor>{'  '}↓ {filteredBranches.length - startIdx - visibleCount} more</Text>
          )}
        </Box>
      ) : (
        <Text color="yellow">{'▲ '}无匹配分支</Text>
      )}
    </Box>
  )
}
