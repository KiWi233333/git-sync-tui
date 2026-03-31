import React, { useState } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner, TextInput } from '@inkjs/ui'
import { useRemotes } from '../hooks/use-git.js'
import { SectionHeader } from './ui.js'
import * as git from '../utils/git.js'

interface Props {
  onSelect: (remote: string) => void
  onBack?: () => void
}

type Phase = 'list' | 'input-url' | 'input-name' | 'adding'

/** 从 URL 或路径中提取默认远程名称 */
function extractRemoteName(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, '').replace(/\.git$/, '')
  const lastSegment = trimmed.split(/[/\\:]+/).filter(Boolean).pop() || ''
  return lastSegment
}

export function RemoteSelect({ onSelect, onBack }: Props) {
  const { data: remotes, loading, error, reload } = useRemotes()
  const [phase, setPhase] = useState<Phase>('list')
  const [cursorIndex, setCursorIndex] = useState(0)
  const [customUrl, setCustomUrl] = useState('')
  const [addError, setAddError] = useState<string | null>(null)

  // 总选项数 = remotes + "添加远程仓库"
  const totalItems = (remotes?.length || 0) + 1

  useInput((input, key) => {
    if (phase !== 'list') {
      if (key.escape) {
        if (phase === 'input-name') {
          setPhase('input-url')
        } else if (phase === 'input-url') {
          setPhase('list')
        }
      }
      return
    }

    if (key.escape) {
      onBack?.()
    } else if (key.upArrow) {
      setCursorIndex((prev) => Math.max(0, prev - 1))
    } else if (key.downArrow) {
      setCursorIndex((prev) => Math.min(totalItems - 1, prev + 1))
    } else if (key.return) {
      if (remotes && cursorIndex < remotes.length) {
        onSelect(remotes[cursorIndex].name)
      } else {
        setPhase('input-url')
      }
    }
  })

  if (loading) {
    return <Spinner label="获取远程仓库..." />
  }

  if (error) {
    return <Text color="red">{'✖ '}获取远程仓库失败: {error}</Text>
  }

  if (phase === 'adding') {
    return <Spinner label="添加远程仓库..." />
  }

  if (phase === 'input-url') {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="添加远程仓库" />
        {addError && <Text color="red">{'✖ '}{addError}</Text>}
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
        <Text color="gray" dimColor>{'  '}支持 HTTPS / SSH 地址</Text>
      </Box>
    )
  }

  if (phase === 'input-name') {
    const defaultName = extractRemoteName(customUrl)
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="添加远程仓库" subtitle={customUrl} />
        {addError && <Text color="red">{'✖ '}{addError}</Text>}
        <Box>
          <Text color="gray">名称 ▸ </Text>
          <TextInput
            placeholder={defaultName || 'upstream'}
            defaultValue={defaultName}
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

  // 计算 name 列最大宽度用于对齐
  const maxNameLen = Math.max(...(remotes || []).map((r) => r.name.length), 0)

  return (
    <Box flexDirection="column">
      <SectionHeader title="选择远程仓库" />

      <Box flexDirection="column" marginTop={1}>
        {(remotes || []).map((r, i) => {
          const isCursor = i === cursorIndex
          return (
            <Box key={r.name}>
              <Text color={isCursor ? 'cyan' : 'gray'}>
                {isCursor ? '›' : ' '}
              </Text>
              <Text> </Text>
              <Text color={isCursor ? 'cyan' : 'white'} bold={isCursor}>
                {r.name.padEnd(maxNameLen + 2)}
              </Text>
              <Text color="gray" dimColor>
                {r.fetchUrl}
              </Text>
            </Box>
          )
        })}

        {/* 添加远程仓库选项 */}
        <Box>
          <Text color={cursorIndex === (remotes?.length || 0) ? 'cyan' : 'gray'}>
            {cursorIndex === (remotes?.length || 0) ? '›' : ' '}
          </Text>
          <Text> </Text>
          <Text color="green" dimColor={cursorIndex !== (remotes?.length || 0)}>
            + 添加远程仓库...
          </Text>
        </Box>
      </Box>
    </Box>
  )
}
