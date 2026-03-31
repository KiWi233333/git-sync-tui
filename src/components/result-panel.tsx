import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Text, useInput } from 'ink'
import { Spinner } from '@inkjs/ui'
import { SectionHeader, StatusPanel, InlineKeys } from './ui.js'
import * as git from '../utils/git.js'

interface Props {
  selectedHashes: string[]
  useMainline: boolean
  noCommit: boolean
  stashed: boolean
  onStashRestored: () => void
  onDone: () => void
}

type Phase =
  | 'executing'      // 正在逐个 cherry-pick
  | 'conflict'       // 遇到冲突，等待用户处理
  | 'empty'          // cherry-pick --continue 后为空提交
  | 'continuing'     // 用户选择继续，正在执行
  | 'aborting'       // 用户选择放弃
  | 'restoring'      // 恢复 stash
  | 'done'           // 全部完成
  | 'aborted'        // 已放弃

export function ResultPanel({ selectedHashes, useMainline, noCommit, stashed, onStashRestored, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('executing')
  const [conflictFiles, setConflictFiles] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [stagedStat, setStagedStat] = useState('')
  const [stashRestored, setStashRestored] = useState<boolean | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [completedCount, setCompletedCount] = useState(0)
  const [skippedCount, setSkippedCount] = useState(0)
  const remainingRef = useRef<string[]>([])
  const backupBranchRef = useRef<string>('')

  // 从旧到新排列
  const orderedHashes = useRef([...selectedHashes].reverse())

  const tryRestoreStash = useCallback(async () => {
    if (!stashed) return true
    setPhase('restoring')
    const ok = await git.stashPop()
    setStashRestored(ok)
    if (ok) onStashRestored()
    return ok
  }, [stashed, onStashRestored])

  // 完成所有 cherry-pick 后的收尾
  const finishAll = useCallback(async () => {
    if (noCommit) {
      const stat = await git.getStagedStat()
      setStagedStat(stat)
    }
    // 成功完成，删除备份分支
    if (backupBranchRef.current) {
      await git.deleteBackupBranch(backupBranchRef.current)
    }
    await tryRestoreStash()
    setPhase('done')
  }, [noCommit, tryRestoreStash])

  // 逐个执行 cherry-pick
  const executeFrom = useCallback(async (startIndex: number) => {
    const hashes = orderedHashes.current

    for (let i = startIndex; i < hashes.length; i++) {
      setCurrentIndex(i)
      const res = await git.cherryPickOne(hashes[i], useMainline, noCommit)

      if (!res.success) {
        // 冲突 - 暂停等待用户
        setConflictFiles(res.conflictFiles || [])
        remainingRef.current = hashes.slice(i + 1)
        setPhase('conflict')
        return
      }
      setCompletedCount((c) => c + 1)
    }

    await finishAll()
  }, [useMainline, noCommit, finishAll])

  // 创建备份分支后开始执行
  useEffect(() => {
    git.createBackupBranch().then((branch) => {
      backupBranchRef.current = branch
      executeFrom(0)
    })
  }, [])

  // 继续剩余 commits（冲突/空提交解决后）
  const continueRemaining = useCallback(async () => {
    const remaining = remainingRef.current
    if (remaining.length === 0) {
      await finishAll()
      return
    }

    setPhase('executing')
    for (let i = 0; i < remaining.length; i++) {
      setCurrentIndex(orderedHashes.current.length - remaining.length + i)
      const res = await git.cherryPickOne(remaining[i], useMainline, noCommit)

      if (!res.success) {
        setConflictFiles(res.conflictFiles || [])
        remainingRef.current = remaining.slice(i + 1)
        setPhase('conflict')
        return
      }
      setCompletedCount((c) => c + 1)
    }

    await finishAll()
  }, [useMainline, noCommit, finishAll])

  // 用户选择继续（解决冲突后）
  const handleContinue = useCallback(async () => {
    // 检查是否还有未解决的冲突
    const conflicts = await git.getConflictFiles()
    if (conflicts.length > 0) {
      setConflictFiles(conflicts)
      setErrorMsg('仍有未解决的冲突文件，请先解决并 git add')
      return
    }

    setPhase('continuing')
    setErrorMsg('')

    // 检查是否还有进行中的 cherry-pick
    const inProgress = await git.isCherryPickInProgress()

    if (noCommit) {
      // --no-commit 模式：冲突解决后 git add 即可
      // 直接清除 CHERRY_PICK_HEAD 状态，不用 --continue（它会强制创建 commit）
      if (inProgress) await git.clearCherryPickState()
      setCompletedCount((c) => c + 1)
      await continueRemaining()
    } else if (!inProgress) {
      // 用户已在另一终端完成了 commit，cherry-pick 状态已清除，直接继续
      setCompletedCount((c) => c + 1)
      await continueRemaining()
    } else {
      // 逐个提交模式：用 --continue --no-edit 完成当前 commit
      const contResult = await git.continueCherryPick()
      if (contResult.empty) {
        // 空提交 - 提示用户选择 skip
        setPhase('empty')
        return
      }
      if (!contResult.success) {
        setConflictFiles(contResult.conflictFiles || [])
        setErrorMsg('cherry-pick --continue 失败: ' + (contResult.error || '').substring(0, 100))
        setPhase('conflict')
        return
      }
      setCompletedCount((c) => c + 1)
      await continueRemaining()
    }
  }, [noCommit, continueRemaining])

  // 跳过空提交
  const handleSkip = useCallback(async () => {
    setPhase('continuing')
    setErrorMsg('')
    await git.skipCherryPick()
    setSkippedCount((c) => c + 1)
    await continueRemaining()
  }, [continueRemaining])

  // 用户选择放弃：回退所有 cherry-pick 到备份点
  const handleAbort = useCallback(async () => {
    setPhase('aborting')
    // 先 abort 当前进行中的 cherry-pick（清除冲突状态）
    await git.abortCherryPick()
    // 用备份分支回退（reset --hard + 删除备份）
    if (backupBranchRef.current) {
      const result = await git.restoreFromBackup(backupBranchRef.current)
      if (!result.success) {
        setErrorMsg(result.error || '')
      }
      backupBranchRef.current = ''
    }
    await tryRestoreStash()
    setPhase('aborted')
  }, [tryRestoreStash])

  useInput((input, key) => {
    if (phase === 'conflict') {
      if (input === 'c' || input === 'C') {
        handleContinue()
      } else if (input === 'a' || input === 'A') {
        handleAbort()
      } else if (input === 'q' || input === 'Q') {
        onDone()
      }
    } else if (phase === 'empty') {
      if (input === 's' || input === 'S') {
        handleSkip()
      } else if (input === 'a' || input === 'A') {
        handleAbort()
      } else if (input === 'q' || input === 'Q') {
        onDone()
      }
    }
  })

  // Spinner 阶段
  if (phase === 'executing') {
    const mode = noCommit ? '--no-commit' : ''
    return (
      <Spinner label={`cherry-pick ${mode} (${currentIndex + 1}/${orderedHashes.current.length})...`} />
    )
  }

  if (phase === 'continuing') {
    return <Spinner label="继续 cherry-pick..." />
  }

  if (phase === 'aborting') {
    return <Spinner label="正在放弃 cherry-pick..." />
  }

  if (phase === 'restoring') {
    return <Spinner label="恢复工作区 (git stash pop)..." />
  }

  // 空提交提示
  if (phase === 'empty') {
    const total = orderedHashes.current.length
    const currentHash = orderedHashes.current[total - remainingRef.current.length - 1]

    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="空提交" />

        <StatusPanel type="warn" title={`commit ${currentHash?.substring(0, 7)} 解决冲突后无实际变更`}>
          <Text color="gray">  该 commit 的所有更改在冲突解决过程中已被丢弃</Text>
        </StatusPanel>

        <Box>
          <InlineKeys hints={[
            { key: 's', label: '跳过此 commit (skip)' },
            { key: 'a', label: '放弃全部 (abort)' },
            { key: 'q', label: '退出 (保留当前状态)' },
          ]} />
        </Box>
      </Box>
    )
  }

  // 冲突等待处理
  if (phase === 'conflict') {
    const total = orderedHashes.current.length
    const doneCount = total - remainingRef.current.length - 1
    const currentHash = orderedHashes.current[total - remainingRef.current.length - 1]

    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="Cherry-pick 遇到冲突" />

        <Box gap={2}>
          <Text color="gray" dimColor>
            进度: {doneCount}/{total}
          </Text>
          <Text color="yellow">
            冲突 commit: {currentHash?.substring(0, 7)}
          </Text>
          {remainingRef.current.length > 0 && (
            <Text color="gray" dimColor>
              剩余: {remainingRef.current.length}
            </Text>
          )}
        </Box>

        {conflictFiles.length > 0 && (
          <StatusPanel type="error" title="冲突文件">
            {conflictFiles.map((f) => (
              <Text key={f} color="red">  {f}</Text>
            ))}
          </StatusPanel>
        )}

        <Box flexDirection="column">
          <Text color="yellow">▸ 请在另一个终端中手动解决冲突</Text>
          <Text color="gray" dimColor>  1. 编辑冲突文件，解决冲突标记 {'<<<<<<< / ======= / >>>>>>>'}</Text>
          <Text color="gray" dimColor>  2. 执行 git add {'<file>'} 标记已解决</Text>
          <Text color="gray" dimColor>  3. 回到此处按 [c] 继续</Text>
        </Box>

        {errorMsg && (
          <Text color="red">{'✖ '}{errorMsg}</Text>
        )}

        <Box>
          <InlineKeys hints={[
            { key: 'c', label: '继续 (冲突已解决)' },
            { key: 'a', label: '放弃 (abort)' },
            { key: 'q', label: '退出 (保留当前状态)' },
          ]} />
        </Box>
      </Box>
    )
  }

  // 已放弃
  if (phase === 'aborted') {
    return (
      <Box flexDirection="column" gap={1}>
        <SectionHeader title="已放弃操作" />
        {errorMsg ? (
          <Box flexDirection="column">
            <Text color="red">{'✖ '}{errorMsg}</Text>
          </Box>
        ) : (
          <Text color="green">{'✔ '}已回退到 cherry-pick 前的状态</Text>
        )}
        {stashed && stashRestored === false && (
          <Text color="yellow">▲ stash 恢复失败，请手动 git stash pop</Text>
        )}
        {stashed && stashRestored === true && (
          <Text color="green">{'✔ '}已恢复工作区变更 (stash pop)</Text>
        )}
      </Box>
    )
  }

  // 完成
  const total = orderedHashes.current.length

  return (
    <Box flexDirection="column" gap={1}>
      <SectionHeader title="同步完成" />

      <Box gap={2}>
        <Text color="green" bold>{'✔ '}{completedCount} 个 commit 已同步</Text>
        {skippedCount > 0 && (
          <Text color="yellow">{skippedCount} 个已跳过</Text>
        )}
      </Box>

      {noCommit && (
        <StatusPanel type="success" title="暂存区变更 (git diff --cached --stat)">
          <Text color="gray">{stagedStat || '(无变更)'}</Text>
        </StatusPanel>
      )}

      {stashed && (
        stashRestored ? (
          <Text color="green">{'✔ '}已恢复工作区变更 (stash pop)</Text>
        ) : (
          <Text color="yellow">▲ stash pop 失败，请手动 git stash pop</Text>
        )
      )}

      {noCommit ? (
        <Box flexDirection="column">
          <Text color="yellow">▲ 改动已暂存到工作区 (--no-commit 模式)</Text>
          <Text color="gray" dimColor>  审查后手动执行:</Text>
          <Text color="cyan">  git diff --cached          <Text color="gray" dimColor># 查看详细 diff</Text></Text>
          <Text color="cyan">  git commit -m "sync: ..."  <Text color="gray" dimColor># 提交</Text></Text>
          <Text color="cyan">  git reset HEAD             <Text color="gray" dimColor># 或放弃</Text></Text>
        </Box>
      ) : (
        <Box flexDirection="column">
          <Text color="gray" dimColor>  已保留原始 commit 信息，可通过 git log 查看</Text>
        </Box>
      )}
    </Box>
  )
}
