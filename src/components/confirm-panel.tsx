import React from 'react'
import { Box, Text, useInput } from 'ink'
import { SectionHeader, StatusPanel, InlineKeys } from './ui.js'
import type { CommitInfo } from '../utils/git.js'

interface Props {
  commits: CommitInfo[]
  selectedHashes: string[]
  hasMerge: boolean
  useMainline: boolean
  onToggleMainline: () => void
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmPanel({ commits, selectedHashes, hasMerge, useMainline, onToggleMainline, onConfirm, onCancel }: Props) {
  useInput((input, key) => {
    if (key.escape) {
      onCancel()
    } else if (input === 'y' || input === 'Y') {
      onConfirm()
    } else if (input === 'n' || input === 'N' || input === 'q') {
      onCancel()
    } else if (hasMerge && (input === 'm' || input === 'M')) {
      onToggleMainline()
    }
  })

  const selectedCommits = selectedHashes
    .map((hash) => commits.find((c) => c.hash === hash))
    .filter(Boolean) as CommitInfo[]

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="确认执行" />

      <StatusPanel type="info" title={`cherry-pick --no-commit · ${selectedCommits.length} 个 commit`}>
        {selectedCommits.map((c) => (
          <Box key={c.hash}>
            <Text color="yellow">  {c.shortHash}</Text>
            <Text> {c.message}</Text>
            <Text color="gray" dimColor> {c.author}</Text>
          </Box>
        ))}
      </StatusPanel>

      {hasMerge && (
        <StatusPanel type="warn" title="检测到 Merge Commit">
          <Text color="gray">  Cherry-pick 合并提交需要指定父节点 (-m 1)</Text>
          <Box>
            <Text>  </Text>
            <Text color="cyan">[m]</Text>
            <Text> 切换 -m 1: </Text>
            {useMainline ? (
              <Text color="green" bold>已启用</Text>
            ) : (
              <Text color="gray">未启用</Text>
            )}
          </Box>
        </StatusPanel>
      )}

      <Box>
        <Text color="yellow">▲ </Text>
        <Text color="gray">--no-commit 模式，改动将暂存到工作区，需手动 commit</Text>
      </Box>

      <Box>
        <Text bold>确认执行? </Text>
        <InlineKeys hints={[
          { key: 'y', label: '确认' },
          { key: 'n', label: '取消' },
          ...(hasMerge ? [{ key: 'm', label: '切换 -m 1' }] : []),
          { key: 'Esc', label: '返回' },
        ]} />
      </Box>
    </Box>
  )
}
