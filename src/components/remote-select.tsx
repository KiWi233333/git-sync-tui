import React, { useState } from 'react'
import { Box, Text } from 'ink'
import { Select, Spinner, TextInput } from '@inkjs/ui'
import { useRemotes } from '../hooks/use-git.js'
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
    return (
      <Box>
        <Spinner label="正在获取远程仓库列表..." />
      </Box>
    )
  }

  if (error) {
    return <Text color="red">获取远程仓库失败: {error}</Text>
  }

  // 添加中
  if (phase === 'adding') {
    return (
      <Box>
        <Spinner label="正在添加远程仓库..." />
      </Box>
    )
  }

  // 输入仓库地址
  if (phase === 'input-url') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">[1/5] 添加远程仓库</Text>
        {addError && <Text color="red">{addError}</Text>}
        <Box>
          <Text>仓库地址: </Text>
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
        <Text color="gray" dimColor>支持 HTTPS / SSH 地址</Text>
      </Box>
    )
  }

  // 输入远程名
  if (phase === 'input-name') {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="cyan">[1/5] 添加远程仓库</Text>
        <Text color="gray">地址: {customUrl}</Text>
        {addError && <Text color="red">{addError}</Text>}
        <Box>
          <Text>远程名称: </Text>
          <TextInput
            placeholder="upstream"
            onSubmit={async (name) => {
              const remoteName = name.trim()
              if (!remoteName) {
                setAddError('名称不能为空')
                return
              }
              // 检查重名
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

  // 列表选择
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
      <Text bold color="cyan">
        [1/5] 选择远程仓库
      </Text>
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
