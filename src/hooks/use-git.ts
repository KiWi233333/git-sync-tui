import { useState, useEffect, useCallback, useRef } from 'react'
import type { CommitInfo, RemoteInfo } from '../utils/git.js'
import * as git from '../utils/git.js'

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useAsync<T>(fn: () => Promise<T>, deps: any[] = []): AsyncState<T> & { reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const fnRef = useRef(fn)
  fnRef.current = fn

  const load = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await fnRef.current()
      setState({ data, loading: false, error: null })
    } catch (err: any) {
      setState({ data: null, loading: false, error: err.message })
    }
  }, deps)

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: load }
}

/** 获取远程仓库列表 */
export function useRemotes() {
  return useAsync(() => git.getRemotes(), [])
}

/** 获取远程分支列表 */
export function useBranches(remote: string | null) {
  return useAsync(
    () => (remote ? git.getRemoteBranches(remote) : Promise.resolve([])),
    [remote],
  )
}

/** 获取 commit 列表（支持分页加载更多） */
export function useCommits(remote: string | null, branch: string | null, pageSize = 100) {
  const [data, setData] = useState<CommitInfo[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const loadedRef = useRef(0)

  // 初始加载
  useEffect(() => {
    if (!remote || !branch) {
      setData([])
      setLoading(false)
      setHasMore(false)
      return
    }

    setData(null)
    setLoading(true)
    setError(null)
    setHasMore(true)
    loadedRef.current = 0

    git.getUnsyncedCommits(remote, branch, pageSize).then((commits) => {
      setData(commits)
      setLoading(false)
      loadedRef.current = commits.length
      setHasMore(commits.length >= pageSize)
    }).catch((err: any) => {
      setError(err.message)
      setLoading(false)
    })
  }, [remote, branch, pageSize])

  // 加载更多
  const loadMore = useCallback(async () => {
    if (!remote || !branch || loadingMore || !hasMore) return

    setLoadingMore(true)
    try {
      const nextCount = loadedRef.current + pageSize
      const allCommits = await git.getUnsyncedCommits(remote, branch, nextCount)
      setData(allCommits)
      setHasMore(allCommits.length >= nextCount)
      loadedRef.current = allCommits.length
    } catch {
      // 加载更多失败不阻塞
    }
    setLoadingMore(false)
  }, [remote, branch, pageSize, loadingMore, hasMore])

  return { data, loading, loadingMore, error, hasMore, loadMore }
}

/** 获取 commit stat 预览 */
export function useCommitStat(hashes: string[]) {
  const [stat, setStat] = useState('')
  const [loading, setLoading] = useState(false)
  const hashKey = hashes.join(',')
  const stableHashes = useRef(hashes)
  stableHashes.current = hashes

  useEffect(() => {
    if (stableHashes.current.length === 0) {
      setStat('')
      return
    }

    setLoading(true)
    git.getMultiCommitStat(stableHashes.current).then((s) => {
      setStat(s)
      setLoading(false)
    }).catch(() => {
      setStat('(获取失败)')
      setLoading(false)
    })
  }, [hashKey])

  return { stat, loading }
}
