import React, { useState } from 'react'
import { Box, Text } from 'ink'
import { RemoteSelect } from './components/remote-select.js'
import { BranchSelect } from './components/branch-select.js'
import { CommitList } from './components/commit-list.js'
import { ConfirmPanel } from './components/confirm-panel.js'
import { ResultPanel } from './components/result-panel.js'
import type { CommitInfo } from './utils/git.js'

type Step = 'remote' | 'branch' | 'commits' | 'confirm' | 'result'

export function App() {
  const [step, setStep] = useState<Step>('remote')
  const [remote, setRemote] = useState('')
  const [branch, setBranch] = useState('')
  const [selectedHashes, setSelectedHashes] = useState<string[]>([])
  const [commits, setCommits] = useState<CommitInfo[]>([])

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold inverse color="white"> git-sync-tui </Text>
        <Text> </Text>
        <Text color="gray">交互式 commit 同步工具 (cherry-pick --no-commit)</Text>
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
          onSelect={(hashes, loadedCommits) => {
            setSelectedHashes(hashes)
            setCommits(loadedCommits)
            setStep('confirm')
          }}
        />
      )}

      {step === 'confirm' && (
        <ConfirmPanel
          commits={commits}
          selectedHashes={selectedHashes}
          onConfirm={() => setStep('result')}
          onCancel={() => setStep('commits')}
        />
      )}

      {step === 'result' && (
        <ResultPanel
          selectedHashes={selectedHashes}
          onDone={() => process.exit(0)}
        />
      )}
    </Box>
  )
}
