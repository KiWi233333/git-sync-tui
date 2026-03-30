import React, { useState } from 'react'
import { Box, Text } from 'ink'
import { Select, Spinner, TextInput } from '@inkjs/ui'
import { useRemotes } from '../hooks/use-git.js'
import { SectionHeader, KeyHints } from './ui.js'
import * as git from '../utils/git.js'

interface Props {
  onSelect: (remote: string) => void
}

type Phase = 'list' | 'input-url' | 'input-name' | 'adding'

export function RemoteSelect({ onSelect }: Props) {
  const { data: remotes, loading, error, reload } = useRemotes()
  const [phase, setPhase] = useState<Phase>('list')
  const [customUrl, setCustomUrl] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  if (loading) {
    return <Spinner label="获取远程仓库..." />
  }

  if (error) {
    return <Text color="red">✖ 获取远程仓库失败: {error}</Text>
  }

  if (phase === 'adding') {
    return <Spinner label="添加远程仓库..." />
  }

  if (phase === 'input-url') {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="添加远程仓库" />
        {addError && <Text color="red">✖ {addError}</Text>}
        <Box>
          <Text color="gray">URL ▸ </Text>
          <TextInput
            placeholder="https://github.com/user/repo.git"
            onSubmit={(url) => {
              if (!url.trim()) {
                setAddError('地址不能为空')
                return
              }
              setCustomUrl(url.trim())
              setPhase('input-name')
            }}
          />
        </Box>
        <Text color="gray" dimColor>  支持 HTTPS / SSH 地址</Text>
      </Box>
    )
  }

  if (phase === 'input-name') {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="添加远程仓库" subtitle={customUrl} />
        {addError && <Text color="red">✖ {addError}</Text>}
        <Box>
          <Text color="gray">名称 ▸ </Text>
          <TextInput
            placeholder="upstream"
            onSubmit={async (name) => {
              const remoteName = name.trim()
              if (!remoteName) {
                setAddError('名称不能为空')
                return
              }
              if (remotes?.some((r) => r.name === remoteName)) {
                setAddError(`远程 "${remoteName}" 已存在`)
                return
              }
              setAddError(null)
              setPhase('adding')
              try {
                await git.addRemote(remoteName, customUrl)
                reload()
                onSelect(remoteName)
              } catch (err: any) {
                setAddError(err.message)
                setPhase('input-name')
              }
            }}
          />
        </Box>
      </Box>
    )
  }

  const options = [
    ...(remotes || []).map((r) => ({
      label: `${r.name}  ${r.fetchUrl}`,
      value: r.name,
    })),
    {
      label: '+ 添加远程仓库...',
      value: '__add_custom__',
    },
  ]

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="选择远程仓库" />
      <Select
        options={options}
        onChange={(value) => {
          if (value === '__add_custom__') {
            setPhase('input-url')
          } else {
            onSelect(value)
          }
        }}
      />
    </Box>
  )
}
