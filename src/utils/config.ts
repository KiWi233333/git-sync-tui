import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

/** 配置结构 */
export interface AppConfig {
  lastRemote?: string
  lastBranch?: string
  noCommit?: boolean
}

const CONFIG_FILE = 'git-sync-tui.json'
let cachedConfig: AppConfig | null = null
let configPath: string | null = null

/** 获取 .git 目录路径（同步，缓存结果） */
function getGitDir(): string {
  if (configPath) return configPath
  try {
    configPath = String(execSync('git rev-parse --git-dir', { encoding: 'utf-8' })).trim()
    return configPath
  } catch {
    return ''
  }
}

/** 读取配置（带缓存） */
export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig

  try {
    const gitDir = getGitDir()
    if (!gitDir) return {}

    const path = join(gitDir, CONFIG_FILE)
    if (!existsSync(path)) return {}

    const content = readFileSync(path, 'utf-8')
    cachedConfig = JSON.parse(content) as AppConfig
    return cachedConfig
  } catch {
    // 文件损坏或不存在，返回空配置
    return {}
  }
}

/** 保存配置（异步写入，静默失败） */
export function saveConfig(config: Partial<AppConfig>): void {
  try {
    const gitDir = getGitDir()
    if (!gitDir) return

    // 合并现有配置
    const current = cachedConfig || {}
    const merged = { ...current, ...config }
    cachedConfig = merged

    const path = join(gitDir, CONFIG_FILE)
    writeFileSync(path, JSON.stringify(merged, null, 2), 'utf-8')
  } catch {
    // 写入失败不阻塞主流程
  }
}

/** 清除缓存（用于测试） */
export function clearConfigCache(): void {
  cachedConfig = null
  configPath = null
}
