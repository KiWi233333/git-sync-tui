import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Box, Text, useApp } from 'ink'
import { Spinner } from '@inkjs/ui'
import { StashPrompt } from './components/stash-prompt.js'
import { RemoteSelect } from './components/remote-select.js'
import { BranchSelect } from './components/branch-select.js'
import { CommitList } from './components/commit-list.js'
import { ConfirmPanel } from './components/confirm-panel.js'
import { ResultPanel } from './components/result-panel.js'
import * as git from './utils/git.js'
import type { CommitInfo } from './utils/git.js'
import { execSync } from 'child_process'

type Step = 'checking' | 'stash-prompt' | 'remote' | 'branch' | 'commits' | 'confirm' | 'result'

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
  const stashedRef = useRef(false)
  const stashRestoredRef = useRef(false)

  // 同步恢复 stash（用于信号处理，必须同步执行）
  const restoreStashSync = useCallback(() => {
    if (stashedRef.current && !stashRestoredRef.current) {
      try {
        execSync('git stash pop', { stdio: 'ignore' })
        stashRestoredRef.current = true
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
  }, [])

  // 启动时检查工作区状态
  useEffect(() => {
    git.isWorkingDirClean().then((clean) => {
      if (clean) {
        setStep('remote')
      } else {
        setStep('stash-prompt')
      }
    })

    // 注册信号处理：Ctrl+C、终端关闭等
    const onSignal = () => {
      restoreStashSync()
      process.exit(0)
    }

    process.on('SIGINT', onSignal)
    process.on('SIGTERM', onSignal)
    process.on('beforeExit', restoreStashSync)

    return () => {
      process.off('SIGINT', onSignal)
      process.off('SIGTERM', onSignal)
      process.off('beforeExit', restoreStashSync)
    }
  }, [restoreStashSync])

  // 执行 stash
  const doStash = async () => {
    const ok = await git.stash()
    if (ok) {
      setStashed(true)
      stashedRef.current = true
    }
    setStep('remote')
  }

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold inverse color="white"> git-sync-tui </Text>
        <Text> </Text>
        <Text color="gray">交互式 commit 同步工具 (cherry-pick --no-commit)</Text>
        {stashed && <Text color="yellow"> (已自动 stash)</Text>}
      </Box>

      {step === 'checking' && (
        <Spinner label="检查工作区状态..." />
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
