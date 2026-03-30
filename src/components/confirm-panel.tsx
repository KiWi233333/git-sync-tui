import React from 'react'
import { Box, Text, useInput } from 'ink'
import type { CommitInfo } from '../utils/git.js'

interface Props {
  commits: CommitInfo[]
  selectedHashes: string[]
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmPanel({ commits, selectedHashes, onConfirm, onCancel }: Props) {
  useInput((input) => {
    if (input === 'y' || input === 'Y') {
      onConfirm()
    } else if (input === 'n' || input === 'N' || input === 'q') {
      onCancel()
    }
  })

  const selectedCommits = selectedHashes
    .map((hash) => commits.find((c) => c.hash === hash))
    .filter(Boolean) as CommitInfo[]

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        [4/5] 确认执行
      </Text>

      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text bold>将 cherry-pick --no-commit 以下 {selectedCommits.length} 个 commit:</Text>
        {selectedCommits.map((c) => (
          <Text key={c.hash}>
            <Text color="green">  {c.shortHash}</Text>
            <Text> {c.message}</Text>
            <Text color="gray" dimColor> ({c.author})</Text>
          </Text>
        ))}
      </Box>

      <Box>
        <Text color="yellow">⚠ </Text>
        <Text>使用 --no-commit 模式，改动将暂存到工作区，需手动 commit</Text>
      </Box>

      <Box>
        <Text bold>确认执行? </Text>
        <Text color="green">[y]</Text>
        <Text> 确认 / </Text>
        <Text color="red">[n]</Text>
        <Text> 取消</Text>
      </Box>
    </Box>
  )
}
