import React from 'react'
import { Box, Text, useInput } from 'ink'

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
      <Box borderStyle="single" borderColor="yellow" paddingX={1} flexDirection="column">
        <Text bold color="yellow">检测到工作区有未提交的变更</Text>
        <Text color="gray">Cherry-pick 操作可能会与未提交的内容冲突</Text>
      </Box>
      <Box>
        <Text bold>是否自动 stash 保存当前变更? </Text>
        <Text color="green">[y]</Text>
        <Text> 是 / </Text>
        <Text color="red">[n]</Text>
        <Text> 否，继续操作</Text>
      </Box>
    </Box>
  )
}
