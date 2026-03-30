import React, { useState, useEffect } from 'react'
import { Box, Text } from 'ink'
import { RemoteSelect } from './components/remote-select.js'
import { BranchSelect } from './components/branch-select.js'
import { CommitList } from './components/commit-list.js'
import { ConfirmPanel } from './components/confirm-panel.js'
import { ResultPanel } from './components/result-panel.js'
import * as git from './utils/git.js'
import type { CommitInfo } from './utils/git.js'

type Step = 'remote' | 'branch' | 'commits' | 'confirm' | 'result'

export function App() {
  const [step, setStep] = useState<Step>('remote')
  const [remote, setRemote] = useState('')
  const [branch, setBranch] = useState('')
  const [selectedHashes, setSelectedHashes] = useState<string[]>([])
  const [commits, setCommits] = useState<CommitInfo[]>([])
  const [hasMerge, setHasMerge] = useState(false)
  const [useMainline, setUseMainline] = useState(false)
  const [stashed, setStashed] = useState(false)

  // 启动时自动 stash
  useEffect(() => {
    git.isWorkingDirClean().then((clean) => {
      if (!clean) {
        git.stash().then((ok) => ok && setStashed(true))
      }
    })
  }, [])

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold inverse color="white"> git-sync-tui </Text>
        <Text> </Text>
        <Text color="gray">交互式 commit 同步工具 (cherry-pick --no-commit)</Text>
        {stashed && <Text color="yellow"> (已自动 stash)</Text>}
      </Box>

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
          onDone={() => process.exit(0)}
        />
      )}
    </Box>
  )
}
