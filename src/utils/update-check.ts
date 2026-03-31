import https from 'node:https'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const PKG_NAME = 'git-sync-tui'
const CHECK_INTERVAL = 24 * 60 * 60 * 1000 // 24h
const REQUEST_TIMEOUT = 3000 // 3s

interface CacheData {
  latest: string
  checkedAt: number
}

function getCachePath(): string {
  const dir = join(homedir(), '.config', 'git-sync-tui')
  return join(dir, 'update-check.json')
}

function readCache(): CacheData | null {
  try {
    const raw = readFileSync(getCachePath(), 'utf-8')
    return JSON.parse(raw) as CacheData
  } catch {
    return null
  }
}

function writeCache(data: CacheData): void {
  try {
    const dir = join(homedir(), '.config', 'git-sync-tui')
    mkdirSync(dir, { recursive: true })
    writeFileSync(getCachePath(), JSON.stringify(data))
  } catch {
    // ignore write errors
  }
}

function fetchLatestVersion(): Promise<string | null> {
  return new Promise((resolve) => {
    const req = https.get(
      `https://registry.npmjs.org/${PKG_NAME}/latest`,
      { timeout: REQUEST_TIMEOUT, headers: { Accept: 'application/json' } },
      (res) => {
        if (res.statusCode !== 200) {
          resolve(null)
          return
        }
        let data = ''
        res.on('data', (chunk: Buffer) => { data += chunk.toString() })
        res.on('end', () => {
          try {
            const json = JSON.parse(data)
            resolve(json.version || null)
          } catch {
            resolve(null)
          }
        })
      },
    )
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

function compareVersions(current: string, latest: string): boolean {
  const parse = (v: string) => v.replace(/^v/, '').split('.').map(Number)
  const c = parse(current)
  const l = parse(latest)
  for (let i = 0; i < 3; i++) {
    if ((l[i] || 0) > (c[i] || 0)) return true
    if ((l[i] || 0) < (c[i] || 0)) return false
  }
  return false
}

export interface UpdateInfo {
  hasUpdate: boolean
  current: string
  latest: string
}

/**
 * Check for updates. Non-blocking, returns quickly from cache,
 * triggers background fetch if cache is stale.
 */
export async function checkForUpdate(currentVersion: string): Promise<UpdateInfo> {
  const noUpdate: UpdateInfo = { hasUpdate: false, current: currentVersion, latest: currentVersion }

  // Check cache first
  const cache = readCache()
  if (cache && Date.now() - cache.checkedAt < CHECK_INTERVAL) {
    return {
      hasUpdate: compareVersions(currentVersion, cache.latest),
      current: currentVersion,
      latest: cache.latest,
    }
  }

  // Fetch from registry (with timeout, won't block long)
  const latest = await fetchLatestVersion()
  if (!latest) return noUpdate

  writeCache({ latest, checkedAt: Date.now() })

  return {
    hasUpdate: compareVersions(currentVersion, latest),
    current: currentVersion,
    latest,
  }
}
