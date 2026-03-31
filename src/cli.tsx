import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import { App } from './app.js'
import { runCli } from './cli-runner.js'

const cli = meow(
  `
  用法
    $ git-sync-tui [options]

  选项
    -r, --remote <name>       指定远程仓库名称
    -b, --branch <name>       指定远程分支名称
    -c, --commits <hashes>    指定 commit hash（逗号分隔）
    -n, --count <number>      显示 commit 数量（默认 100）
    -m, --mainline            对 merge commit 使用 -m 1
    -y, --yes                 跳过确认直接执行
    --no-stash                跳过 stash 提示
    --list                    列出远程分支的 commit 后退出

  模式
    无参数                     交互式 TUI 模式
    -r -b --list              列出 commit（纯文本）
    -r -b -c                  CLI 模式，确认后执行
    -r -b -c --yes            CLI 模式，直接执行
    仅 -r 或 -r -b            TUI 模式，跳过已指定步骤

  TUI 快捷键
    Space       选择/取消 commit
    Shift+↑/↓   连续选择
    a           全选/取消全选
    i           反选
    r           选至开头
    Enter       确认选择
    Esc         返回上一步
    y/n         确认/取消执行

  示例
    $ git-sync-tui                                           # TUI 模式
    $ git-sync-tui -r upstream -b main --list                # 列出 commits
    $ git-sync-tui -r upstream -b main -c abc1234 --yes      # 直接执行
    $ git-sync-tui -r upstream -b main -c abc1234,def5678    # 确认后执行
    $ git-sync-tui -r upstream                               # TUI 模式，跳过选择仓库
`,
  {
    importMeta: import.meta,
    flags: {
      remote: { type: 'string', shortFlag: 'r' },
      branch: { type: 'string', shortFlag: 'b' },
      commits: { type: 'string', shortFlag: 'c' },
      count: { type: 'number', shortFlag: 'n', default: 100 },
      mainline: { type: 'boolean', shortFlag: 'm', default: false },
      yes: { type: 'boolean', shortFlag: 'y', default: false },
      noStash: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
    },
  },
)

const { remote, branch, commits, count, mainline, yes, noStash, list } = cli.flags

// 解析 commits：支持逗号分隔
const commitList = commits
  ? commits.split(',').map((s) => s.trim()).filter(Boolean)
  : undefined

// 判断运行模式
const hasAllParams = !!(remote && branch && commitList && commitList.length > 0)
const isListMode = !!(list && remote && branch)
const isCliMode = hasAllParams || isListMode

if (isCliMode) {
  // 纯 CLI 模式
  runCli({
    remote: remote!,
    branch: branch!,
    commits: commitList,
    count,
    mainline,
    yes,
    noStash,
    list,
  }).catch((err) => {
    console.error('✖ ' + (err.message || err))
    process.exit(1)
  })
} else {
  // TUI 模式（可能带部分参数跳过步骤）
  render(<App initialRemote={remote} initialBranch={branch} />)
}
