import React, { useState, useEffect, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { StatusPanel, InlineKeys, SectionHeader } from './ui.js'
import * as git from '../utils/git.js'

const BASE_BRANCHES = ['main', 'master']

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
  const autoCreated = useRef(false)

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
    if (matched) onContinue()
  }, [matched])

  // 当前分支是 main/master → 自动创建目标分支
  useEffect(() => {
    if (currentBranch === null || matched || autoCreated.current) return
    if (!BASE_BRANCHES.includes(currentBranch)) return

    autoCreated.current = true
    setCreating(true)
    git.createBranchFrom(targetBranch, currentBranch).then(() => {
      onContinue()
    }).catch((err: any) => {
      setCreating(false)
      setError(err.message)
    })
  }, [currentBranch, matched, targetBranch])

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
    // 当前是 main/master 时已自动创建，不需要手动输入
    if (BASE_BRANCHES.includes(currentBranch)) return

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

  // 非 main/master 分支 → 让用户选择
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

      <Box>
        <Text bold>从 {currentBranch} 创建 {targetBranch} 分支? </Text>
        <InlineKeys hints={[
          { key: 'y', label: '创建并切换' },
          { key: 'n', label: '跳过' },
          { key: 'Esc', label: '返回' },
        ]} />
      </Box>
    </Box>
  )
}
