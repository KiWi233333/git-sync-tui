#!/usr/bin/env tsx

/**
 * 强制将上一个 tag 移动到当前 HEAD（重新打 tag）
 *
 * 用法: pnpm run release:retag
 *
 * 场景: CI 发布失败后修复了代码，需要重新触发同版本的发布
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'))
const tag = `v${pkg.version}`

// 检查 tag 是否存在
try {
  execSync(`git rev-parse ${tag}`, { stdio: 'pipe' })
} catch {
  console.error(`Tag ${tag} 不存在，请先通过 pnpm run release 创建`)
  process.exit(1)
}

const oldCommit = execSync(`git rev-parse --short ${tag}`, { encoding: 'utf-8' }).trim()
const newCommit = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()

if (oldCommit === newCommit) {
  console.log(`Tag ${tag} 已在 HEAD (${newCommit})，无需移动`)
  process.exit(0)
}

console.log(`\n将 tag ${tag} 从 ${oldCommit} 移动到 ${newCommit} (HEAD)\n`)

// 删除本地旧 tag，重新打
execSync(`git tag -d ${tag}`, { stdio: 'inherit' })
execSync(`git tag ${tag}`, { stdio: 'inherit' })

console.log(`\nTag ${tag} 已更新到 HEAD`)
console.log(`\n运行以下命令推送（会覆盖远程 tag）:\n`)
console.log(`  git push origin ${tag} --force\n`)
