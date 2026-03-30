import React from 'react'
import { Box, Text, useInput } from 'ink'
import { StatusPanel, InlineKeys } from './ui.js'

interface Props {
  onConfirm: () => void
  onSkip: () => void
}

export function StashPrompt({ onConfirm, onSkip }: Props) {
  useInput((input) => {
    if (input === 'y' || input === 'Y') {
      onConfirm()
    } else if (input === 'n' || input === 'N') {
      onSkip()
    }
  })

  return (
    <Box flexDirection="column" gap={1}>
      <StatusPanel type="warn" title="工作区有未提交的变更">
        <Text color="gray">  Cherry-pick 操作可能会与未提交的内容冲突</Text>
      </StatusPanel>
      <Box>
        <Text bold>自动 stash 保存当前变更? </Text>
        <InlineKeys hints={[
          { key: 'y', label: '是' },
          { key: 'n', label: '否，继续' },
        ]} />
      </Box>
    </Box>
  )
}
