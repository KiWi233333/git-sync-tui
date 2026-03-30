import { useState, useEffect, useCallback } from 'react'
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

  const load = useCallback(async () => {
    setState({ data: null, loading: true, error: null })
    try {
      const data = await fn()
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

/** 获取 commit 列表 */
export function useCommits(remote: string | null, branch: string | null, count = 30) {
  return useAsync(
    () =>
      remote && branch
        ? git.getCommits(remote, branch, count)
        : Promise.resolve([]),
    [remote, branch, count],
  )
}

/** 获取 commit stat 预览 */
export function useCommitStat(hashes: string[]) {
  const [stat, setStat] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (hashes.length === 0) {
      setStat('')
      return
    }

    setLoading(true)
    git.getMultiCommitStat(hashes).then((s) => {
      setStat(s)
      setLoading(false)
    }).catch(() => {
      setStat('(获取失败)')
      setLoading(false)
    })
  }, [hashes.join(',')])

  return { stat, loading }
}
