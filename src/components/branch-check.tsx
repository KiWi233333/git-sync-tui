import React, { useState, useEffect, useRef } from 'react'
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
  const [targetBranchExists, setTargetBranchExists] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [initError, setInitError] = useState<string | null>(null)
  const [matched, setMatched] = useState(false)
  const onContinueRef = useRef(onContinue)
  onContinueRef.current = onContinue

  useEffect(() => {
    git.getCurrentBranch().then(async (branch) => {
      setCurrentBranch(branch)
      if (branch === targetBranch) {
        setMatched(true)
        setTargetBranchExists(true)
        return
      }
      const exists = await git.branchExists(targetBranch)
      setTargetBranchExists(exists)
    }).catch((err: any) => {
      setInitError(err?.message || '检查分支失败')
    })
  }, [targetBranch])

  // 分支匹配 → 自动跳过
  useEffect(() => {
    if (matched) onContinueRef.current()
  }, [matched])

  const doProceed = () => {
    if (!currentBranch || targetBranchExists === null) return
    setCreating(true)
    setError(null)

    const action = targetBranchExists
      ? git.switchBranch(targetBranch)
      : git.createBranchFrom(targetBranch, currentBranch)

    action.then(() => {
      onContinue()
    }).catch((err: any) => {
      setCreating(false)
      setError(err.message)
    })
  }

  useInput((input, key) => {
    if (creating || matched) return

    if (key.escape) {
      onBack?.()
      return
    }

    if (initError || currentBranch === null || targetBranchExists === null) return

    if (input === 'y' || input === 'Y') {
      doProceed()
    } else if (input === 'n' || input === 'N') {
      onContinue()
    }
  })

  if (initError) {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="分支检查" />
        <Text color="red">{'✖ '}{initError}</Text>
        <InlineKeys hints={[{ key: 'Esc', label: '返回' }]} />
      </Box>
    )
  }

  if (currentBranch === null || targetBranchExists === null || matched) {
    return <Spinner label="检查当前分支..." />
  }

  if (creating) {
    return <Spinner label={targetBranchExists ? `正在切换到分支 ${targetBranch}...` : `正在从 ${currentBranch} 创建分支 ${targetBranch}...`} />
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
          {targetBranchExists ? (
            <>
              <Text bold>是否切换到分支 </Text>
              <Text color="cyan" bold>{targetBranch}</Text>
              <Text bold>？</Text>
            </>
          ) : (
            <>
              <Text bold>是否新建分支 </Text>
              <Text color="cyan" bold>{targetBranch}</Text>
              <Text bold> 并切换？</Text>
            </>
          )}
        </Box>
        <Text color="gray" dimColor>
          {targetBranchExists
            ? `  • 选 [y] 将切换到分支 ${targetBranch}`
            : `  • 选 [y] 将从 ${currentBranch} 创建 ${targetBranch} 分支并切换`}
        </Text>
        <Text color="gray" dimColor>
          {'  '}• 选 [n] 将在当前分支 {currentBranch} 上直接同步（不创建新分支）
        </Text>
        <InlineKeys hints={[
          { key: 'y', label: targetBranchExists ? '切换分支' : '新建并切换分支' },
          { key: 'n', label: '在当前分支同步' },
          { key: 'Esc', label: '返回' },
        ]} />
      </Box>
    </Box>
  )
}
