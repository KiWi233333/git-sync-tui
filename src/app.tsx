import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useApp } from 'ink'
import { Spinner } from '@inkjs/ui'
import { AppHeader } from './components/ui.js'
import { StashPrompt } from './components/stash-prompt.js'
import { StashRecovery } from './components/stash-recovery.js'
import { RemoteSelect } from './components/remote-select.js'
import { BranchSelect } from './components/branch-select.js'
import { CommitList } from './components/commit-list.js'
import { ConfirmPanel } from './components/confirm-panel.js'
import { ResultPanel } from './components/result-panel.js'
import * as git from './utils/git.js'
import type { CommitInfo } from './utils/git.js'
import { execSync } from 'child_process'

type Step = 'checking' | 'stash-recovery' | 'stash-prompt' | 'remote' | 'branch' | 'commits' | 'confirm' | 'result'

// Map step to progress number (1-5)
const STEP_NUMBER: Record<Step, number> = {
  checking: 0,
  'stash-recovery': 0,
  'stash-prompt': 0,
  remote: 1,
  branch: 2,
  commits: 3,
  confirm: 4,
  result: 5,
}

export function App() {
  const { exit } = useApp()
  const [step, setStep] = useState<Step>('checking')
  const [remote, setRemote] = useState('')
  const [branch, setBranch] = useState('')
  const [selectedHashes, setSelectedHashes] = useState<string[]>([])
  const [commits, setCommits] = useState<CommitInfo[]>([])
  const [hasMerge, setHasMerge] = useState(false)
  const [useMainline, setUseMainline] = useState(false)
  const [stashed, setStashed] = useState(false)
  const [guardTimestamp, setGuardTimestamp] = useState<string | undefined>()
  const stashedRef = useRef(false)
  const stashRestoredRef = useRef(false)

  // 同步恢复 stash + 清除 guard（用于信号处理，必须同步执行）
  const restoreStashSync = useCallback(() => {
    if (stashedRef.current && !stashRestoredRef.current) {
      try {
        execSync('git stash pop', { stdio: 'ignore' })
        stashRestoredRef.current = true
        git.removeStashGuardSync()
      } catch {
        try {
          process.stderr.write('\n⚠ stash 自动恢复失败，请手动执行: git stash pop\n')
        } catch {
          // ignore
        }
      }
    }
  }, [])

  // 标记 stash 已被正常恢复（由 ResultPanel 调用）
  const markStashRestored = useCallback(() => {
    stashRestoredRef.current = true
    git.removeStashGuard()
  }, [])

  // 启动时检查 guard 文件 → 工作区状态
  useEffect(() => {
    async function check() {
      // 优先检查是否有上次中断的 stash guard
      const guard = await git.checkStashGuard()
      if (guard.exists) {
        setGuardTimestamp(guard.timestamp)
        setStep('stash-recovery')
        return
      }

      // 正常流程：检查工作区
      const clean = await git.isWorkingDirClean()
      setStep(clean ? 'remote' : 'stash-prompt')
    }
    check()

    // 注册信号处理：Ctrl+C、终端关闭、异常等
    const onSignal = () => {
      restoreStashSync()
      process.exit(0)
    }

    const onExit = () => {
      restoreStashSync()
    }

    const onUncaught = (err: Error) => {
      restoreStashSync()
      process.stderr.write(`\n❌ 未捕获异常: ${err.message}\n`)
      process.exit(1)
    }

    const onUnhandledRejection = (reason: unknown) => {
      restoreStashSync()
      process.stderr.write(`\n❌ 未处理的 Promise rejection: ${reason}\n`)
      process.exit(1)
    }

    process.on('SIGINT', onSignal)
    process.on('SIGTERM', onSignal)
    process.on('SIGHUP', onSignal)
    process.on('exit', onExit)
    process.on('uncaughtException', onUncaught)
    process.on('unhandledRejection', onUnhandledRejection)

    return () => {
      process.off('SIGINT', onSignal)
      process.off('SIGTERM', onSignal)
      process.off('SIGHUP', onSignal)
      process.off('exit', onExit)
      process.off('uncaughtException', onUncaught)
      process.off('unhandledRejection', onUnhandledRejection)
    }
  }, [restoreStashSync])

  // 执行 stash + 写入 guard
  const doStash = async () => {
    const ok = await git.stash()
    if (ok) {
      setStashed(true)
      stashedRef.current = true
      await git.writeStashGuard()
    }
    setStep('remote')
  }

  // stash recovery: 恢复上次中断的 stash
  const doStashRecover = async () => {
    const entry = await git.findStashEntry()
    if (entry) {
      await git.stashPop()
    }
    await git.removeStashGuard()
    // 恢复后重新检查工作区
    const clean = await git.isWorkingDirClean()
    setStep(clean ? 'remote' : 'stash-prompt')
  }

  // stash recovery: 跳过恢复，清除 guard
  const skipStashRecover = async () => {
    await git.removeStashGuard()
    const clean = await git.isWorkingDirClean()
    setStep(clean ? 'remote' : 'stash-prompt')
  }

  return (
    <Box flexDirection="column">
      <AppHeader step={STEP_NUMBER[step]} stashed={stashed} />

      {step === 'checking' && (
        <Spinner label="检查工作区状态..." />
      )}

      {step === 'stash-recovery' && (
        <StashRecovery
          timestamp={guardTimestamp}
          onRecover={doStashRecover}
          onSkip={skipStashRecover}
        />
      )}

      {step === 'stash-prompt' && (
        <StashPrompt
          onConfirm={doStash}
          onSkip={() => setStep('remote')}
        />
      )}

      {step === 'remote' && (
        <RemoteSelect
          onSelect={(r) => {
            setRemote(r)
            setStep('branch')
          }}
        />
      )}

      {step === 'branch' && (
        <BranchSelect
          remote={remote}
          onSelect={(b) => {
            setBranch(b)
            setStep('commits')
          }}
        />
      )}

      {step === 'commits' && (
        <CommitList
          remote={remote}
          branch={branch}
          onSelect={async (hashes, loadedCommits) => {
            setSelectedHashes(hashes)
            setCommits(loadedCommits)
            const merge = await git.hasMergeCommits(hashes)
            setHasMerge(merge)
            setStep('confirm')
          }}
        />
      )}

      {step === 'confirm' && (
        <ConfirmPanel
          commits={commits}
          selectedHashes={selectedHashes}
          hasMerge={hasMerge}
          useMainline={useMainline}
          onToggleMainline={() => setUseMainline((v) => !v)}
          onConfirm={() => setStep('result')}
          onCancel={() => setStep('commits')}
        />
      )}

      {step === 'result' && (
        <ResultPanel
          selectedHashes={selectedHashes}
          useMainline={useMainline}
          stashed={stashed}
          onStashRestored={markStashRestored}
          onDone={() => {
            restoreStashSync()
            exit()
          }}
        />
      )}
    </Box>
  )
}
