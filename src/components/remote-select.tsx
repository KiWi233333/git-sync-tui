import React from 'react'
import { Box, Text } from 'ink'
import { Select, Spinner } from '@inkjs/ui'
import { useRemotes } from '../hooks/use-git.js'

interface Props {
  onSelect: (remote: string) => void
}

export function RemoteSelect({ onSelect }: Props) {
  const { data: remotes, loading, error } = useRemotes()

  if (loading) {
    return (
      <Box>
        <Spinner label="正在获取远程仓库列表..." />
      </Box>
    )
  }

  if (error) {
    return <Text color="red">获取远程仓库失败: {error}</Text>
  }

  if (!remotes || remotes.length === 0) {
    return <Text color="red">未找到任何远程仓库，请先 git remote add</Text>
  }

  const options = remotes.map((r) => ({
    label: `${r.name}  ${r.fetchUrl}`,
    value: r.name,
  }))

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="cyan">
        [1/5] 选择远程仓库
      </Text>
      <Select options={options} onChange={onSelect} />
    </Box>
  )
}
