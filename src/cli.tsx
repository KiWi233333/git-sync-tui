import React from 'react'
import { render } from 'ink'
import meow from 'meow'
import { App } from './app.js'

const cli = meow(
  `
  用法
    $ git-sync-tui

  选项
    --help    显示帮助
    --version 显示版本

  说明
    交互式 TUI 工具，从远程分支挑选 commit 同步到当前分支。
    使用 cherry-pick --no-commit 模式，同步后可审查再提交。

  快捷键
    Space     选择/取消 commit
    Enter     确认选择
    ↑/↓       导航
    y/n       确认/取消执行
`,
  {
    importMeta: import.meta,
  },
)

render(<App />)
