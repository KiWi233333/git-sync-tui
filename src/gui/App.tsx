import React, { useMemo, useState } from 'react'
import { workspaceSnapshot } from './mock-data.js'
import { getConflictProgress, orderSelectedCommits, resolveChunk } from './lib/workbench-state.js'
import type {
  BranchOption,
  ConflictChunk,
  ConflictFile,
  RepositoryHealth,
  RepositoryMode,
  RepositoryOption,
  ResolutionStrategy,
} from './types.js'

function healthLabel(health: RepositoryHealth) {
  switch (health) {
    case 'ready':
      return '已就绪'
    case 'syncing':
      return '拉取中'
    case 'stale':
      return '需要刷新'
  }
}

function modeLabel(mode: RepositoryMode) {
  return mode === 'clone' ? '托管 clone' : '本地仓库'
}

function branchDeltaLabel(branch: BranchOption) {
  const parts = []
  if (branch.ahead > 0) parts.push(`ahead ${branch.ahead}`)
  if (branch.behind > 0) parts.push(`behind ${branch.behind}`)
  return parts.length > 0 ? parts.join(' / ') : '已对齐'
}

function fileStatusLabel(status: ConflictFile['status']) {
  switch (status) {
    case 'U':
      return '冲突'
    case 'A':
      return '新增'
    case 'M':
      return '修改'
    case 'D':
      return '删除'
  }
}

function repositoryTone(health: RepositoryHealth) {
  switch (health) {
    case 'ready':
      return 'success'
    case 'syncing':
      return 'info'
    case 'stale':
      return 'warn'
  }
}

function conflictKey(filePath: string, chunkId: string) {
  return `${filePath}::${chunkId}`
}

function codeLineClass(kind: 'incoming' | 'current' | 'result', unresolved = false) {
  if (unresolved) return 'code-line code-line--unresolved'
  return `code-line code-line--${kind}`
}

function codeLensLabel(strategy: ResolutionStrategy) {
  switch (strategy) {
    case 'incoming':
      return '接受传入'
    case 'current':
      return '接受当前'
    case 'both-incoming-first':
      return '接受组合(传入优先)'
    case 'both-current-first':
      return '接受组合(当前优先)'
    default:
      return '未处理'
  }
}

function RepositorySelect({
  label,
  value,
  options,
  branches,
  branchValue,
  onChange,
  onBranchChange,
}: {
  label: string
  value: string
  options: RepositoryOption[]
  branches: BranchOption[]
  branchValue: string
  onChange: (value: string) => void
  onBranchChange: (value: string) => void
}) {
  const activeOption = options.find((option) => option.id === value) ?? options[0]

  return (
    <div className="repo-select">
      <div className="repo-select__label">{label}</div>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name} · {modeLabel(option.mode)}
          </option>
        ))}
      </select>
      <div className="repo-select__meta">
        <span className={`status-pill status-pill--${repositoryTone(activeOption.health)}`}>
          <span className="status-pill__dot" />
          {healthLabel(activeOption.health)}
        </span>
        <span>{activeOption.provider}</span>
        <span>{activeOption.path}</span>
      </div>
      <select value={branchValue} onChange={(event) => onBranchChange(event.target.value)}>
        {branches.map((branch) => (
          <option key={branch.name} value={branch.name}>
            {branch.name} · {branchDeltaLabel(branch)}
          </option>
        ))}
      </select>
    </div>
  )
}

function CodeColumn({
  title,
  kind,
  chunk,
  lines,
  resolution,
  onResolve,
}: {
  title: string
  kind: 'incoming' | 'current'
  chunk: ConflictChunk
  lines: string[]
  resolution: ResolutionStrategy
  onResolve: (strategy: ResolutionStrategy) => void
}) {
  const lineStart = kind === 'incoming' ? chunk.incomingStart : chunk.currentStart

  return (
    <div className="merge-column">
      <div className="merge-column__header">
        <span>{title}</span>
        <span className="merge-column__hint">{chunk.baseHint}</span>
      </div>
      <div className="code-lens">
        <button onClick={() => onResolve(kind)}>接受{kind === 'incoming' ? '传入' : '当前'}</button>
        <button onClick={() => onResolve(kind === 'incoming' ? 'both-incoming-first' : 'both-current-first')}>
          接受组合({kind === 'incoming' ? '传入优先' : '当前优先'})
        </button>
        <button onClick={() => onResolve('unresolved')}>忽略</button>
      </div>
      <div className="code-panel">
        {lines.map((line, index) => (
          <div className={codeLineClass(kind)} key={`${kind}-${index}`}>
            <span className="code-line__number">{lineStart + index}</span>
            <span className="code-line__content">{line || ' '}</span>
          </div>
        ))}
        <div className="code-panel__footer">
          {resolution !== 'unresolved' ? `当前策略: ${codeLensLabel(resolution)}` : '等待合并决策'}
        </div>
      </div>
    </div>
  )
}

function ResultColumn({
  file,
  resolutions,
}: {
  file: ConflictFile
  resolutions: Record<string, ResolutionStrategy>
}) {
  return (
    <div className="result-column">
      <div className="merge-column__header">
        <span>结果</span>
        <span className="merge-column__hint">{file.path}</span>
      </div>
      <div className="code-panel code-panel--result">
        {file.chunks.map((chunk) => {
          const resolution = resolutions[conflictKey(file.path, chunk.id)] ?? 'unresolved'
          const lines = resolveChunk(chunk, resolution)
          return (
            <div className="result-block" key={chunk.id}>
              <div className="result-block__label">
                块 {chunk.id} · {codeLensLabel(resolution)}
              </div>
              {lines.length > 0 ? (
                lines.map((line, index) => (
                  <div className={codeLineClass('result')} key={`${chunk.id}-${index}`}>
                    <span className="code-line__number">{index + 1}</span>
                    <span className="code-line__content">{line || ' '}</span>
                  </div>
                ))
              ) : (
                <div className={codeLineClass('result', true)}>
                  <span className="code-line__number">!</span>
                  <span className="code-line__content">未接受任何更改，无法继续当前 cherry-pick。</span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function WorkbenchApp() {
  const [currentRepositoryId, setCurrentRepositoryId] = useState('current-local')
  const [targetRepositoryId, setTargetRepositoryId] = useState('target-upstream')
  const [currentBranch, setCurrentBranch] = useState('release/2026.04')
  const [targetBranch, setTargetBranch] = useState('feature/new-api')
  const [targetMode, setTargetMode] = useState<RepositoryMode>('clone')
  const [selectedCommitHashes, setSelectedCommitHashes] = useState<Set<string>>(
    () => new Set(['9c3fa183b0f1', '2a912d43e875', '684c71d9b2af']),
  )
  const [selectedConflictPath, setSelectedConflictPath] = useState(workspaceSnapshot.conflicts[0].path)
  const [commitMessage, setCommitMessage] = useState(workspaceSnapshot.suggestedMessage)
  const [resolutions, setResolutions] = useState<Record<string, ResolutionStrategy>>(() => {
    const next: Record<string, ResolutionStrategy> = {}
    for (const file of workspaceSnapshot.conflicts) {
      for (const chunk of file.chunks) {
        next[conflictKey(file.path, chunk.id)] = 'unresolved'
      }
    }
    return next
  })

  const currentRepositories = workspaceSnapshot.repositories.filter((repo) => repo.role === 'current')
  const targetRepositories = workspaceSnapshot.repositories.filter((repo) => repo.role === 'target')
  const currentBranches = workspaceSnapshot.branchesByRepository[currentRepositoryId] ?? []
  const targetBranches = workspaceSnapshot.branchesByRepository[targetRepositoryId] ?? []
  const activeTargetRepository = targetRepositories.find((repo) => repo.id === targetRepositoryId) ?? targetRepositories[0]
  const selectedCommits = useMemo(
    () => orderSelectedCommits(workspaceSnapshot.commits, selectedCommitHashes),
    [selectedCommitHashes],
  )
  const activeConflict = workspaceSnapshot.conflicts.find((file) => file.path === selectedConflictPath) ?? workspaceSnapshot.conflicts[0]
  const conflictProgress = getConflictProgress(resolutions)
  const totalFiles = selectedCommits.reduce((sum, commit) => sum + commit.filesChanged, 0)
  const totalInsertions = selectedCommits.reduce((sum, commit) => sum + commit.insertions, 0)
  const totalDeletions = selectedCommits.reduce((sum, commit) => sum + commit.deletions, 0)

  const toggleCommit = (hash: string, alreadySynced?: boolean) => {
    if (alreadySynced) return
    setSelectedCommitHashes((prev) => {
      const next = new Set(prev)
      if (next.has(hash)) next.delete(hash)
      else next.add(hash)
      return next
    })
  }

  const applyResolution = (filePath: string, chunkId: string, strategy: ResolutionStrategy) => {
    setResolutions((prev) => ({
      ...prev,
      [conflictKey(filePath, chunkId)]: strategy,
    }))
  }

  return (
    <div className="app-shell">
      <div className="ambient ambient--left" />
      <div className="ambient ambient--right" />

      <header className="topbar">
        <div className="topbar__cascade">
          <RepositorySelect
            label="当前仓库 (cherry-pick 方)"
            value={currentRepositoryId}
            options={currentRepositories}
            branches={currentBranches}
            branchValue={currentBranch}
            onChange={(value) => {
              setCurrentRepositoryId(value)
              const nextBranch = workspaceSnapshot.branchesByRepository[value]?.[0]?.name
              if (nextBranch) setCurrentBranch(nextBranch)
            }}
            onBranchChange={setCurrentBranch}
          />
          <div className="topbar__direction">
            <span className="topbar__arrow">←</span>
            <span className="topbar__badge">Pull</span>
          </div>
          <RepositorySelect
            label="目标仓库 (被 cherry-pick 方)"
            value={targetRepositoryId}
            options={targetRepositories}
            branches={targetBranches}
            branchValue={targetBranch}
            onChange={(value) => {
              setTargetRepositoryId(value)
              const nextBranch = workspaceSnapshot.branchesByRepository[value]?.[0]?.name
              if (nextBranch) setTargetBranch(nextBranch)
              const repo = workspaceSnapshot.repositories.find((item) => item.id === value)
              if (repo) setTargetMode(repo.mode)
            }}
            onBranchChange={setTargetBranch}
          />
        </div>

        <div className="summary-strip">
          <div className="summary-card">
            <div className="summary-card__label">仓库策略</div>
            <div className="segmented">
              <button
                className={targetMode === 'clone' ? 'is-active' : ''}
                onClick={() => setTargetMode('clone')}
              >
                默认 clone
              </button>
              <button
                className={targetMode === 'local' ? 'is-active' : ''}
                onClick={() => setTargetMode('local')}
              >
                使用已 clone 仓库
              </button>
            </div>
            <div className="summary-card__detail">
              {targetMode === 'clone'
                ? `自动克隆到 ${workspaceSnapshot.cloneDestination}`
                : `复用现有路径 ${activeTargetRepository.path}`}
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">执行策略</div>
            <div className="summary-card__detail">支持跨跃多选，执行顺序仍按原始 commit 时间线，不按点击顺序。</div>
          </div>
          <div className="summary-card">
            <div className="summary-card__label">冲突推进</div>
            <div className="progress-meta">
              <div className="progress-bar">
                <span style={{ width: `${(conflictProgress.resolved / conflictProgress.total) * 100}%` }} />
              </div>
              <span>{conflictProgress.resolved}/{conflictProgress.total} 块已处理</span>
            </div>
          </div>
        </div>
      </header>

      <main className="workspace-grid">
        <aside className="panel panel--scm">
          <div className="panel__header">
            <div>
              <div className="eyebrow">源代码管理</div>
              <h2>逐个冲突提交</h2>
            </div>
            <button className="ghost-button">更多</button>
          </div>

          <section className="composer">
            <textarea
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
              placeholder="Message (Ctrl+Enter 提交)"
            />
            <div className="composer__actions">
              <button className="primary-button">提交本次冲突 commit</button>
              <button className="secondary-button">继续处理下一组</button>
            </div>
          </section>

          <section className="file-group">
            <div className="file-group__header">
              <span>合并更改</span>
              <span className="count-badge">{workspaceSnapshot.conflicts.length}</span>
            </div>
            <div className="file-list">
              {workspaceSnapshot.conflicts.map((file) => {
                const unresolvedCount = file.chunks.filter(
                  (chunk) => resolutions[conflictKey(file.path, chunk.id)] === 'unresolved',
                ).length
                return (
                  <button
                    className={`file-row ${file.path === activeConflict.path ? 'is-active' : ''}`}
                    key={file.path}
                    onClick={() => setSelectedConflictPath(file.path)}
                  >
                    <div>
                      <div className="file-row__path">{file.path}</div>
                      <div className="file-row__folder">{file.folder}</div>
                    </div>
                    <div className="file-row__meta">
                      <span className="status-tag status-tag--danger">{fileStatusLabel(file.status)}</span>
                      <span className="status-tag">{unresolvedCount} 未解决</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="file-group">
            <div className="file-group__header">
              <span>暂存的更改</span>
              <span className="count-badge">{workspaceSnapshot.stagedFiles.length}</span>
            </div>
            <div className="file-list">
              {workspaceSnapshot.stagedFiles.map((file) => (
                <div className="file-row" key={file.path}>
                  <div>
                    <div className="file-row__path">{file.path}</div>
                    <div className="file-row__folder">{file.folder}</div>
                  </div>
                  <span className={`status-tag status-tag--${file.status === 'A' ? 'success' : 'muted'}`}>
                    {file.status}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </aside>

        <section className="panel panel--commits">
          <div className="panel__header">
            <div>
              <div className="eyebrow">提交工作台</div>
              <h2>跨跃选择 + 原顺序执行</h2>
            </div>
            <div className="inline-stats">
              <span>{selectedCommits.length} 个待同步 commit</span>
              <span>{totalFiles} files</span>
            </div>
          </div>

          <section className="stats-ribbon">
            <div className="metric-card">
              <span>新增</span>
              <strong>+{totalInsertions}</strong>
            </div>
            <div className="metric-card">
              <span>删除</span>
              <strong>-{totalDeletions}</strong>
            </div>
            <div className="metric-card">
              <span>目标分支</span>
              <strong>{targetBranch}</strong>
            </div>
          </section>

          <div className="commit-columns">
            <section className="commit-feed">
              <div className="section-title">目标仓库任意 commit</div>
              {workspaceSnapshot.commits.map((commit) => {
                const selected = selectedCommitHashes.has(commit.hash)
                return (
                  <button
                    className={`commit-card ${selected ? 'is-selected' : ''} ${commit.alreadySynced ? 'is-disabled' : ''}`}
                    key={commit.hash}
                    onClick={() => toggleCommit(commit.hash, commit.alreadySynced)}
                  >
                    <div className="commit-card__topline">
                      <span className="commit-card__hash">{commit.shortHash}</span>
                      <span className={`risk-pill risk-pill--${commit.risk}`}>{commit.risk}</span>
                    </div>
                    <div className="commit-card__title">{commit.title}</div>
                    <div className="commit-card__meta">
                      <span>{commit.author}</span>
                      <span>{commit.relativeTime}</span>
                      <span>{commit.filesChanged} files</span>
                    </div>
                    <div className="commit-card__tags">
                      {commit.tags.map((tag) => (
                        <span className="chip" key={tag}>{tag}</span>
                      ))}
                      {commit.alreadySynced && <span className="chip chip--muted">已同步</span>}
                    </div>
                  </button>
                )
              })}
            </section>

            <section className="selection-queue">
              <div className="section-title">执行队列 (按原顺序)</div>
              {selectedCommits.length > 0 ? (
                selectedCommits.map((commit, index) => (
                  <div className="queue-item" key={commit.hash}>
                    <div className="queue-item__index">{index + 1}</div>
                    <div>
                      <div className="queue-item__title">{commit.title}</div>
                      <div className="queue-item__meta">
                        <span>{commit.shortHash}</span>
                        <span>{commit.relativeTime}</span>
                        <span>{commit.insertions} / {commit.deletions}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">先从左侧提交列表选择要同步的 commit。</div>
              )}
            </section>
          </div>

          <section className="timeline">
            <div className="section-title">处理节奏</div>
            {workspaceSnapshot.activity.map((item) => (
              <div className="timeline-item" key={item.title}>
                <span className={`timeline-item__state timeline-item__state--${item.state}`} />
                <div>
                  <div className="timeline-item__title">{item.title}</div>
                  <div className="timeline-item__detail">{item.detail}</div>
                </div>
              </div>
            ))}
          </section>
        </section>

        <section className="panel panel--merge">
          <div className="panel__header">
            <div>
              <div className="eyebrow">3-Way Merge</div>
              <h2>{activeConflict.path}</h2>
            </div>
            <div className="inline-stats">
              <span>{activeConflict.chunks.length} 个冲突块</span>
              <span>类似 VS Code diff / merge 体验</span>
            </div>
          </div>

          <div className="merge-layout">
            <div className="merge-top">
              {activeConflict.chunks.map((chunk) => {
                const resolution = resolutions[conflictKey(activeConflict.path, chunk.id)] ?? 'unresolved'
                return (
                  <div className="merge-pair" key={chunk.id}>
                    <div className="merge-pair__title">
                      <span>冲突块 {chunk.id}</span>
                      <span className="status-tag">{codeLensLabel(resolution)}</span>
                    </div>
                    <div className="merge-grid">
                      <CodeColumn
                        title="传入"
                        kind="incoming"
                        chunk={chunk}
                        lines={chunk.incomingLines}
                        resolution={resolution}
                        onResolve={(strategy) => applyResolution(activeConflict.path, chunk.id, strategy)}
                      />
                      <CodeColumn
                        title="当前"
                        kind="current"
                        chunk={chunk}
                        lines={chunk.currentLines}
                        resolution={resolution}
                        onResolve={(strategy) => applyResolution(activeConflict.path, chunk.id, strategy)}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <ResultColumn file={activeConflict} resolutions={resolutions} />
          </div>
        </section>
      </main>
    </div>
  )
}
