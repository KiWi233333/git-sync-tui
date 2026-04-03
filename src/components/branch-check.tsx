import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { StatusPanel, InlineKeys, SectionHeader } from './ui.js'
import * as git from '../utils/git.js'

interface Props {
  targetBranch: string
  onContinue: () => void
  onBack?: () => void
}

export function BranchCheck({ targetBranch, onContinue, onBack }: Props) {
  const [currentBranch, setCurrentBranch] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [matched, setMatched] = useState(false)
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  useEffect(() => {
    git.getCurrentBranch().then((branch) => {
      setCurrentBranch(branch)
      if (branch === targetBranch) {
        setMatched(true)
      }
    })
  }, [targetBranch])

  // 分支匹配 → 自动跳过
  useEffect(() => {
    if (matched) onContinueRef.current()
  }, [matched])

  const doCreate = () => {
    if (!currentBranch) return
    setCreating(true)
    setError(null)
    git.createBranchFrom(targetBranch, currentBranch).then(() => {
      onContinue()
    }).catch((err: any) => {
      setCreating(false)
      setError(err.message)
    })
  }

  useInput((input, key) => {
    if (creating || currentBranch === null || matched) return

    if (input === 'y' || input === 'Y') {
      doCreate()
    } else if (input === 'n' || input === 'N') {
      onContinue()
    } else if (key.escape) {
      onBack?.()
    }
  })

  if (currentBranch === null || matched) {
    return <Spinner label="检查当前分支..." />
  }

  if (creating) {
    return <Spinner label={`正在从 ${currentBranch} 创建分支 ${targetBranch}...`} />
  }

  // 分支不一致 → 让用户确认
  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="分支检查" />

      <StatusPanel type="warn" title="当前分支与目标分支不一致">
        <Box>
          <Text color="gray">  当前分支: </Text>
          <Text color="yellow" bold>{currentBranch}</Text>
        </Box>
        <Box>
          <Text color="gray">  目标分支: </Text>
          <Text color="cyan" bold>{targetBranch}</Text>
        </Box>
      </StatusPanel>

      {error && (
        <Text color="red">{'✖ '}{error}</Text>
      )}

      <Box flexDirection="column" gap={1}>
        <Box>
          <Text bold>是否新建分支 </Text>
          <Text color="cyan" bold>{targetBranch}</Text>
          <Text bold> 并切换？</Text>
        </Box>
        <Text color="gray" dimColor>
          {'  '}• 选 [y] 将从 {currentBranch} 创建 {targetBranch} 分支
        </Text>
        <Text color="gray" dimColor>
          {'  '}• 选 [n] 将在当前分支 {currentBranch} 上直接同步（不创建新分支）
        </Text>
        <InlineKeys hints={[
          { key: 'y', label: '新建分支' },
          { key: 'n', label: '在当前分支同步' },
          { key: 'Esc', label: '返回' },
        ]} />
      </Box>
    </Box>
  )
}
