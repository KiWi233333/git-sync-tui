import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { Spinner } from '@inkjs/ui'
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

  // 恢复 stash 的统一逻辑
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
    return (
      <Box>
        <Spinner label={`正在执行 cherry-pick --no-commit (${selectedHashes.length} 个 commit)...`} />
      </Box>
    )
  }

  if (phase === 'restoring') {
    return (
      <Box>
        <Spinner label="正在恢复工作区 (git stash pop)..." />
      </Box>
    )
  }

  if (phase === 'error' && result) {
    return (
      <Box flexDirection="column" gap={1}>
        <Text bold color="red">
          [5/5] Cherry-pick 遇到冲突
        </Text>
        {result.conflictFiles && result.conflictFiles.length > 0 && (
          <Box flexDirection="column" borderStyle="single" borderColor="red" paddingX={1}>
            <Text bold>冲突文件:</Text>
            {result.conflictFiles.map((f) => (
              <Text key={f} color="red">  {f}</Text>
            ))}
          </Box>
        )}
        <Text color="yellow">
          请手动解决冲突后执行 git add 和 git commit
        </Text>
        <Text color="gray" dimColor>
          或执行 git cherry-pick --abort 放弃操作
        </Text>
        {stashed && stashRestored === false && (
          <Text color="yellow">注意: stash 恢复失败，请手动 git stash pop</Text>
        )}
        {stashed && stashRestored === true && (
          <Text color="green">已恢复工作区变更 (stash pop)</Text>
        )}
      </Box>
    )
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Text bold color="green">
        [5/5] 同步完成!
      </Text>

      <Box flexDirection="column" borderStyle="round" borderColor="green" paddingX={1}>
        <Text bold>暂存区变更概览 (git diff --cached --stat):</Text>
        <Text color="gray">{stagedStat || '(无变更)'}</Text>
      </Box>

      {stashed && (
        stashRestored ? (
          <Text color="green">已恢复工作区变更 (stash pop)</Text>
        ) : (
          <Text color="yellow">stash pop 失败，请手动 git stash pop</Text>
        )
      )}

      <Text color="yellow">
        改动已暂存到工作区 (--no-commit 模式)
      </Text>
      <Text>请审查后手动执行:</Text>
      <Text color="cyan">  git diff --cached          # 查看详细 diff</Text>
      <Text color="cyan">  git commit -m "同步 commit" # 提交</Text>
      <Text color="cyan">  git reset HEAD             # 或放弃所有改动</Text>
    </Box>
  )
}
