import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
import { SectionHeader, StatusPanel } from './ui.js'
import * as git from '../utils/git.js'
import type { CherryPickResult } from '../utils/git.js'

interface Props {
  selectedHashes: string[]
  useMainline: boolean
  stashed: boolean
  onStashRestored: () => void
  onDone: () => void
}

export function ResultPanel({ selectedHashes, useMainline, stashed, onStashRestored, onDone }: Props) {
  const [phase, setPhase] = useState<'executing' | 'restoring' | 'done' | 'error'>('executing')
  const [result, setResult] = useState<CherryPickResult | null>(null)
  const [stagedStat, setStagedStat] = useState('')
  const [stashRestored, setStashRestored] = useState<boolean | null>(null)

  const tryRestoreStash = async () => {
    if (!stashed) return true
    setPhase('restoring')
    const ok = await git.stashPop()
    setStashRestored(ok)
    if (ok) onStashRestored()
    return ok
  }

  useEffect(() => {
    async function run() {
      const res = await git.cherryPick(selectedHashes, useMainline)
      setResult(res)

      if (res.success) {
        const stat = await git.getStagedStat()
        setStagedStat(stat)
        await tryRestoreStash()
        setPhase('done')
      } else {
        await tryRestoreStash()
        setPhase('error')
      }
    }
    run()
  }, [])

  if (phase === 'executing') {
    return <Spinner label={`cherry-pick --no-commit (${selectedHashes.length} 个 commit)...`} />
  }

  if (phase === 'restoring') {
    return <Spinner label="恢复工作区 (git stash pop)..." />
  }

  if (phase === 'error' && result) {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="Cherry-pick 遇到冲突" />

        {result.conflictFiles && result.conflictFiles.length > 0 && (
          <StatusPanel type="error" title="冲突文件">
            {result.conflictFiles.map((f) => (
              <Text key={f} color="red">  {f}</Text>
            ))}
          </StatusPanel>
        )}

        <Box flexDirection="column">
          <Text color="yellow">▸ 手动解决冲突后执行 git add 和 git commit</Text>
          <Text color="gray" dimColor>▸ 或执行 git cherry-pick --abort 放弃操作</Text>
        </Box>

        {stashed && stashRestored === false && (
          <Text color="yellow">▲ stash 恢复失败，请手动 git stash pop</Text>
        )}
        {stashed && stashRestored === true && (
          <Text color="green">✔ 已恢复工作区变更 (stash pop)</Text>
        )}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="同步完成" />

      <StatusPanel type="success" title="暂存区变更 (git diff --cached --stat)">
        <Text color="gray">{stagedStat || '(无变更)'}</Text>
      </StatusPanel>

      {stashed && (
        stashRestored ? (
          <Text color="green">✔ 已恢复工作区变更 (stash pop)</Text>
        ) : (
          <Text color="yellow">▲ stash pop 失败，请手动 git stash pop</Text>
        )
      )}

      <Box flexDirection="column">
        <Text color="yellow">▲ 改动已暂存到工作区 (--no-commit 模式)</Text>
        <Text color="gray" dimColor>  审查后手动执行:</Text>
        <Text color="cyan">  git diff --cached          <Text color="gray" dimColor># 查看详细 diff</Text></Text>
        <Text color="cyan">  git commit -m "sync: ..."  <Text color="gray" dimColor># 提交</Text></Text>
        <Text color="cyan">  git reset HEAD             <Text color="gray" dimColor># 或放弃</Text></Text>
      </Box>
    </Box>
  )
}
