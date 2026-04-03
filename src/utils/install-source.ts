import { realpathSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'

export type InstallSource = 'npm' | 'yarn' | 'pnpm' | 'homebrew' | 'git' | 'binary'

export interface InstallInfo {
  source: InstallSource
  updateCommand: string
}

/**
 * Detect installation source and return appropriate update command.
 *
 * Detection strategy:
 * 1. npm/yarn/pnpm: Check npm_execpath env or executable path patterns
 * 2. homebrew: Check if path contains /homebrew/ or /Cellar/
 * 3. git dev: Check if running from a git repo with package.json
 * 4. binary: Fallback for standalone binaries
 */
export function detectInstallSource(): InstallInfo {
  const execPath = getRealExecPath()

  // 1. Check npm_execpath environment variable
  const npmExecPath = process.env.npm_execpath || ''
  if (npmExecPath.includes('yarn')) {
    return { source: 'yarn', updateCommand: 'yarn global add git-sync-tui' }
  }
  if (npmExecPath.includes('pnpm')) {
    return { source: 'pnpm', updateCommand: 'pnpm add -g git-sync-tui' }
  }
  if (npmExecPath.includes('npm')) {
    return { source: 'npm', updateCommand: 'npm i -g git-sync-tui' }
  }

  // 2. Check executable path patterns
  if (execPath) {
    // Homebrew detection
    if (execPath.includes('/homebrew/') || execPath.includes('/Cellar/')) {
      return { source: 'homebrew', updateCommand: 'brew upgrade git-sync-tui' }
    }

    // npm/yarn/pnpm global path detection
    if (execPath.includes('/node_modules/')) {
      // Try to detect package manager from lock files in global dir
      const nodeModulesDir = findNodeModulesRoot(execPath)
      if (nodeModulesDir) {
        if (existsSync(join(nodeModulesDir, 'pnpm-lock.yaml'))) {
          return { source: 'pnpm', updateCommand: 'pnpm add -g git-sync-tui' }
        }
        if (existsSync(join(nodeModulesDir, 'yarn.lock'))) {
          return { source: 'yarn', updateCommand: 'yarn global add git-sync-tui' }
        }
        // Default to npm for node_modules installations
        return { source: 'npm', updateCommand: 'npm i -g git-sync-tui' }
      }
    }

    // Git development mode: running from source
    if (isGitDevMode(execPath)) {
      return { source: 'git', updateCommand: 'git pull && npm run build' }
    }
  }

  // 3. Fallback to binary or default npm
  return { source: 'binary', updateCommand: 'npm i -g git-sync-tui' }
}

/**
 * Get real executable path, resolving symlinks.
 */
function getRealExecPath(): string | null {
  try {
    // process.execPath is the Node.js binary, not our CLI
    // We need to check where our package is installed
    const argv1 = process.argv[1]
    if (argv1) {
      return realpathSync(argv1)
    }
    return null
  } catch {
    return null
  }
}

/**
 * Find the node_modules root directory (where package.json might be).
 */
function findNodeModulesRoot(execPath: string): string | null {
  // Look for node_modules in path and get its parent
  const match = execPath.match(/^(.+?)\/node_modules\//)
  return match ? match[1] : null
}

/**
 * Check if running from a git repository (development mode).
 */
function isGitDevMode(execPath: string): boolean {
  // Check if we're in the project's dist or src directory
  const lower = execPath.toLowerCase()

  // Common development patterns
  if (lower.includes('/dist/') || lower.includes('/src/')) {
    // Check if there's a .git directory nearby
    let dir = dirname(execPath)
    for (let i = 0; i < 5; i++) {
      if (existsSync(join(dir, '.git'))) {
        return true
      }
      dir = dirname(dir)
    }
  }

  return false
}

/**
 * Cache the detected source to avoid repeated detection.
 */
let cachedInfo: InstallInfo | null = null

export function getInstallInfo(): InstallInfo {
  if (!cachedInfo) {
    cachedInfo = detectInstallSource()
  }
  return cachedInfo
}
