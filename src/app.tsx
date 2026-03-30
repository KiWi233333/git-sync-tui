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

// 步骤切换防抖间隔（ms）
const STEP_DEBOUNCE = 100

interface AppProps {
  initialRemote?: string
  initialBranch?: string
}

export function App({ initialRemote, initialBranch }: AppProps) {
  const { exit } = useApp()

  // 根据初始参数确定起始步骤
  const entryStep: Step = initialRemote && initialBranch
    ? 'commits'
    : initialRemote
      ? 'branch'
      : 'remote'

  const [step, setStepRaw] = useState<Step>('checking')
  const [inputReady, setInputReady] = useState(true)
  const [remote, setRemote] = useState(initialRemote || '')
  const [branch, setBranch] = useState(initialBranch || '')
  const [selectedHashes, setSelectedHashes] = useState<string[]>([])
  const [commits, setCommits] = useState<CommitInfo[]>([])
  const [hasMerge, setHasMerge] = useState(false)
  const [useMainline, setUseMainline] = useState(false)
  const [stashed, setStashed] = useState(false)
  const [guardTimestamp, setGuardTimestamp] = useState<string | undefined>()
  const stashedRef = useRef(false)
  const stashRestoredRef = useRef(false)
  const mountedRef = useRef(true)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 步骤切换保护：防止快速按键导致事件泄漏到新组件
  const setStep = useCallback((newStep: Step) => {
    setInputReady(false)
    setStepRaw(newStep)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (mountedRef.current) setInputReady(true)
    }, STEP_DEBOUNCE)
  }, [])

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
    mountedRef.current = true

    async function check() {
      // 优先检查是否有上次中断的 stash guard
      const guard = await git.checkStashGuard()
      if (!mountedRef.current) return
      if (guard.exists) {
        setGuardTimestamp(guard.timestamp)
        setStep('stash-recovery')
        return
      }

      // 正常流程：检查工作区
      const clean = await git.isWorkingDirClean()
      if (!mountedRef.current) return
      setStep(clean ? entryStep : 'stash-prompt')
    }
    check()

    // 注册信号处理：仅处理明确的终止信号
    const onSignal = () => {
      restoreStashSync()
      process.exit(0)
    }

    process.on('SIGINT', onSignal)
    process.on('SIGTERM', onSignal)
    process.on('SIGHUP', onSignal)

    return () => {
      mountedRef.current = false
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
      process.off('SIGINT', onSignal)
      process.off('SIGTERM', onSignal)
      process.off('SIGHUP', onSignal)
    }
  }, [restoreStashSync, setStep])

  // 执行 stash + 写入 guard
  const doStash = async () => {
    const ok = await git.stash()
    if (ok) {
      setStashed(true)
      stashedRef.current = true
      await git.writeStashGuard()
    }
    if (mountedRef.current) setStep(entryStep)
  }

  // stash recovery: 恢复上次中断的 stash
  const doStashRecover = async () => {
    const entry = await git.findStashEntry()
    if (entry) {
      await git.stashPop()
    }
    await git.removeStashGuard()
    if (!mountedRef.current) return
    const clean = await git.isWorkingDirClean()
    if (mountedRef.current) setStep(clean ? entryStep : 'stash-prompt')
  }

  // stash recovery: 跳过恢复，清除 guard
  const skipStashRecover = async () => {
    await git.removeStashGuard()
    if (!mountedRef.current) return
    const clean = await git.isWorkingDirClean()
    if (mountedRef.current) setStep(clean ? entryStep : 'stash-prompt')
  }

  // ESC 返回上一步
  const goBack = useCallback((fromStep: Step) => {
    const backMap: Partial<Record<Step, Step>> = {
      branch: 'remote',
      commits: 'branch',
      confirm: 'commits',
    }
    const prev = backMap[fromStep]
    if (prev) {
      setStep(prev)
    } else {
      // 第一步按 ESC 退出应用
      restoreStashSync()
      exit()
    }
  }, [setStep, restoreStashSync, exit])

  return (
    <Box flexDirection="column">
      <AppHeader step={STEP_NUMBER[step]} stashed={stashed} />

      {step === 'checking' && (
        <Spinner label="检查工作区状态..." />
      )}

      {step === 'stash-recovery' && inputReady && (
        <StashRecovery
          timestamp={guardTimestamp}
          onRecover={doStashRecover}
          onSkip={skipStashRecover}
        />
      )}

      {step === 'stash-prompt' && inputReady && (
        <StashPrompt
          onConfirm={doStash}
          onSkip={() => setStep(entryStep)}
        />
      )}

      {step === 'remote' && inputReady && (
        <RemoteSelect
          onSelect={(r) => {
            setRemote(r)
            setStep('branch')
          }}
          onBack={() => goBack('remote')}
        />
      )}

      {step === 'branch' && inputReady && (
        <BranchSelect
          remote={remote}
          onSelect={(b) => {
            setBranch(b)
            setStep('commits')
          }}
          onBack={() => goBack('branch')}
        />
      )}

      {step === 'commits' && inputReady && (
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
          onBack={() => goBack('commits')}
        />
      )}

      {step === 'confirm' && inputReady && (
        <ConfirmPanel
          commits={commits}
          selectedHashes={selectedHashes}
          hasMerge={hasMerge}
          useMainline={useMainline}
          onToggleMainline={() => setUseMainline((v) => !v)}
          onConfirm={() => setStep('result')}
          onCancel={() => goBack('confirm')}
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
