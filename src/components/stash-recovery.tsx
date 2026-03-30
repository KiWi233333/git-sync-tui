import React, { useState, useEffect } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { StatusPanel, InlineKeys } from './ui.js'
import * as git from '../utils/git.js'

interface Props {
  timestamp?: string
  onRecover: () => void
  onSkip: () => void
}

export function StashRecovery({ timestamp, onRecover, onSkip }: Props) {
  const [stashEntry, setStashEntry] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    git.findStashEntry().then(setStashEntry)
  }, [])

  useInput((input) => {
    if (input === 'y' || input === 'Y') {
      onRecover()
    } else if (input === 'n' || input === 'N') {
      onSkip()
    }
  })

  if (stashEntry === undefined) {
    return <Spinner label="检查 stash 记录..." />
  }

  return (
    <Box flexDirection="column" gap={1}>
      <StatusPanel type="warn" title="检测到上次运行中断">
        {timestamp && <Text color="gray">  中断时间: {timestamp}</Text>}
        {stashEntry && <Text color="gray">  Stash: {stashEntry}</Text>}
        {!stashEntry && <Text color="red">  未找到对应的 stash 条目（可能已手动恢复）</Text>}
      </StatusPanel>
      <Box>
        <Text bold>{stashEntry ? '恢复 stash? ' : '清除中断标记? '}</Text>
        <InlineKeys hints={[
          { key: 'y', label: '是' },
          { key: 'n', label: '跳过' },
        ]} />
      </Box>
    </Box>
  )
}
