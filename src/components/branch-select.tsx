import React, { useState, useMemo } from 'react'
import { Box, Text } from 'ink'
import { Select, Spinner, TextInput } from '@inkjs/ui'
import { useBranches } from '../hooks/use-git.js'
import { SectionHeader } from './ui.js'

interface Props {
  remote: string
  onSelect: (branch: string) => void
}

export function BranchSelect({ remote, onSelect }: Props) {
  const { data: branches, loading, error } = useBranches(remote)
  const [filter, setFilter] = useState('')

  const filteredOptions = useMemo(() => {
    if (!branches) return []
    const filtered = filter
      ? branches.filter((b) => b.toLowerCase().includes(filter.toLowerCase()))
      : branches
    return filtered.map((b) => ({ label: b, value: b }))
  }, [branches, filter])

  if (loading) {
    return <Spinner label={`获取 ${remote} 的分支列表...`} />
  }

  if (error) {
    return <Text color="red">✖ 获取分支列表失败: {error}</Text>
  }

  if (!branches || branches.length === 0) {
    return <Text color="red">✖ 未找到远程分支</Text>
  }

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title={`选择分支`} subtitle={`${remote} · ${branches.length} 个分支`} />
      <Box>
        <Text color="gray">/ </Text>
        <TextInput
          placeholder="输入关键字过滤..."
          onChange={setFilter}
        />
        {filter && (
          <Text color="gray" dimColor> · 匹配 {filteredOptions.length}</Text>
        )}
      </Box>
      {filteredOptions.length > 0 ? (
        <Select options={filteredOptions} onChange={onSelect} />
      ) : (
        <Text color="yellow">▲ 无匹配分支</Text>
      )}
    </Box>
  )
}
