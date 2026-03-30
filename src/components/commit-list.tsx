import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { MultiSelect, Spinner } from '@inkjs/ui'
import { useCommits, useCommitStat } from '../hooks/use-git.js'
import type { CommitInfo } from '../utils/git.js'

interface Props {
  remote: string
  branch: string
  onSelect: (hashes: string[], commits: CommitInfo[]) => void
}

export function CommitList({ remote, branch, onSelect }: Props) {
  const { data: commits, loading, error } = useCommits(remote, branch, 30)
  const [selectedHashes, setSelectedHashes] = useState<string[]>([])
  const { stat, loading: statLoading } = useCommitStat(selectedHashes)

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

  const options = commits.map((c) => ({
    label: `${c.shortHash} ${c.message}  (${c.author}, ${c.date})`,
    value: c.hash,
  }))

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        [3/5] 选择要同步的 commit (Space 选择, Enter 确认)
      </Text>
      <Text color="gray" dimColor>
        {remote}/{branch} 最近 {commits.length} 个 commit
      </Text>

      <MultiSelect
        options={options}
        onChange={setSelectedHashes}
        onSubmit={(hashes) => {
          if (hashes.length > 0) {
            onSelect(hashes, commits!)
          }
        }}
      />

      {selectedHashes.length > 0 && (
        <Box flexDirection="column" marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
          <Text bold color="yellow">
            已选 {selectedHashes.length} 个 commit — diff --stat 预览:
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
