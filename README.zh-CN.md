<h1 align="center">🔄 git-sync-tui</h1>

<p align="center">
  <a href="https://www.npmjs.com/package/git-sync-tui"><img src="https://img.shields.io/npm/v/git-sync-tui.svg?color=0ea5e9" alt="npm version"></a>
  <a href="https://www.npmjs.com/package/git-sync-tui"><img src="https://img.shields.io/npm/dm/git-sync-tui.svg?color=10b981" alt="downloads"></a>
  <a href="https://github.com/KiWi233333/git-sync-tui/actions/workflows/publish.yml"><img src="https://github.com/KiWi233333/git-sync-tui/actions/workflows/publish.yml/badge.svg" alt="publish"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/git-sync-tui.svg?color=8b5cf6" alt="node version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-f59e0b.svg" alt="license"></a>
  <a href="https://github.com/KiWi233333/git-sync-tui"><img src="https://img.shields.io/github/stars/KiWi233333/git-sync-tui?style=social" alt="GitHub Stars"></a>
</p>

<p align="center">
  <b>跨仓库 Git 提交同步的交互式 TUI 工具</b>
</p>

<p align="center">
  通过直观的终端界面从远程分支 cherry-pick 提交。<br>
  多选提交、预览 diff 统计、交互式处理冲突，支持备份分支和 stash 保护机制。
</p>

<p align="center">
  <a href="#-功能特性">功能</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-安装">安装</a> ·
  <a href="#-工作流程">工作流程</a> ·
  <a href="#%EF%B8%8F-命令行选项">命令行选项</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<!-- <p align="center">
  <img src="./assets/demo.gif" alt="git-sync-tui 演示" width="680">
</p> -->

## ✨ 功能特性

- 🎯 **多选提交** — 使用 Space 选择不连续的提交，Shift+↑↓ 连选，`a` 全选，`i` 反选
- 🔍 **分支搜索** — 按关键词模糊过滤分支
- 👀 **差异预览** — 可滚动的 `--stat` 摘要面板，支持 `j`/`k` 上下滚动
- ⚡ **双模式** — `--no-commit` 仅暂存变更供审查，或逐个提交保留原始 commit 信息
- 🔀 **逐个 cherry-pick** — 按顺序执行提交，遇到冲突时暂停等待交互处理
- ⚠️ **冲突处理** — 显示冲突文件列表，在另一终端解决后继续/放弃/退出
- 🛡️ **安全备份** — 执行前自动创建备份分支，放弃时完整回滚
- 📦 **自动 stash** — 检测未提交变更，提示 stash 保存，同步后自动恢复
- 🔄 **Stash 恢复** — 检测上次中断的会话，提供恢复 stash 的选项
- 🌿 **分支检查** — 若当前不在目标分支，自动从 main/master 创建并切换
- ✅ **已同步标记** — 在 commit 列表中标记已同步的提交为 `[已同步]`
- 🖥️ **CLI 模式** — 支持 `-r -b -c` 参数的非交互模式，适用于脚本
- 🌐 **通用性** — 适用于任何 Git 仓库，不限语言

## 🚀 快速开始

```bash
# 全局安装
npm install -g git-sync-tui

# 进入你的 Git 仓库并运行
cd your-project
git-sync-tui
```

## 📦 安装

```bash
npm install -g git-sync-tui
```

> **环境要求：** Node.js >= 20

## 🔄 工作流程

```
检查工作区  →  选择远程仓库  →  选择分支  →  分支检查  →  多选提交
    ↓                                                      ↓
自动 stash                                            预览 diff 统计
(如需要)                                                   ↓
                                                    确认并选择模式
                                                          ↓
                                               逐个 cherry-pick（带备份）
                                                          ↓
                                                  处理冲突 / 完成
                                                          ↓
                                                  恢复 stash 并退出
```

## ⌨️ 快捷键

### 提交选择

| 按键 | 操作 |
|-----|------|
| `↑` `↓` | 上下导航 |
| `Space` | 切换提交选择 |
| `Shift`+`↑`/`↓` | 连续选择 |
| `a` | 全选 / 取消全选 |
| `i` | 反选 |
| `r` | 从开头选至光标 |
| `j` / `k` | 滚动 diff stat 预览 |
| `Enter` | 确认选择 |
| `Esc` | 返回上一步 |

### 确认面板

| 按键 | 操作 |
|-----|------|
| `y` | 确认执行 |
| `n` | 取消 |
| `c` | 切换提交模式（--no-commit / 逐个提交） |
| `m` | 切换 `-m 1`（merge commit 时） |
| `Esc` | 返回 |

### 冲突处理

| 按键 | 操作 |
|-----|------|
| `c` | 继续（冲突已解决） |
| `a` | 放弃（回滚全部变更） |
| `q` | 退出（保留当前状态） |

## ⚙️ 命令行选项

```
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

示例
  $ git-sync-tui                                           # TUI 模式
  $ git-sync-tui -r upstream -b main --list                # 列出 commits
  $ git-sync-tui -r upstream -b main -c abc1234 --yes      # 直接执行
  $ git-sync-tui -r upstream -b main -c abc1234,def5678    # 确认后执行
  $ git-sync-tui -r upstream                               # TUI 模式，跳过选择仓库
```

## 📋 同步后操作

**--no-commit 模式** — 变更已暂存在工作区（未提交）：

```bash
git diff --cached                        # 查看暂存的变更
git commit -m "sync: 从 feature-branch cherry-pick 提交"  # 提交
git reset HEAD                           # 或放弃所有变更
```

**逐个提交模式** — 保留原始 commit 信息，可通过 `git log` 查看。

## 💡 使用场景

| 场景 | 描述 |
|------|------|
| **回溯修复** | 从主分支 cherry-pick 关键修复到发布分支 |
| **同步特性** | 在特性分支间复制特定提交 |
| **选择性合并** | 选择单个提交而非合并整个分支 |

## 🛠️ 开发

```bash
git clone https://github.com/KiWi233333/git-sync-tui.git
cd git-sync-tui
pnpm install
pnpm start
```

## 🏗️ 技术栈

- [Ink](https://github.com/vadimdemedes/ink) — 用于构建交互式 CLI 应用的 React 框架
- [@inkjs/ui](https://github.com/inkjs/ui) — Ink 的 UI 组件库
- [simple-git](https://github.com/steveukx/git-js) — Git 命令接口
- [meow](https://github.com/sindresorhus/meow) — CLI 参数解析

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📄 许可证

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
