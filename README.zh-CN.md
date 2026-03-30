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
  选择特定提交、预览变更，并使用 <code>--no-commit</code> 模式在提交前安全审查。
</p>

<p align="center">
  <a href="#-功能特性">功能</a> ·
  <a href="#-快速开始">快速开始</a> ·
  <a href="#-安装">安装</a> ·
  <a href="#-工作流程">工作流程</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<!-- <p align="center">
  <img src="./assets/demo.gif" alt="git-sync-tui 演示" width="680">
</p> -->

## ✨ 功能特性

- 🎯 **多选提交** — 使用 Space / Enter 选择不连续的提交进行 cherry-pick
- 🔍 **分支搜索** — 按关键词模糊过滤分支
- 👀 **差异预览** — 执行前查看所选提交的 `--stat` 摘要
- ⚡ **安全模式** — `--no-commit` 仅暂存变更供审查，不会自动提交
- ⚠️ **冲突处理** — cherry-pick 失败时清晰显示冲突文件
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
选择远程仓库  →  选择分支  →  多选提交  →  预览变更
                                              ↓
手动审查并提交  ←  Cherry-pick --no-commit（已暂存，未提交）
```

## ⌨️ 快捷键

| 按键 | 操作 |
|-----|------|
| `↑` `↓` | 上下导航 |
| `Space` | 切换提交选择 |
| `Enter` | 确认选择 |
| `y` / `n` | 确认 / 取消执行 |
| `/` | 搜索（在分支列表中） |

## 📋 同步后操作

变更已暂存在工作区（未提交）。你可以：

```bash
# 查看暂存的变更
git diff --cached

# 准备好后提交
git commit -m "sync: 从 feature-branch cherry-pick 提交"

# 或放弃所有变更
git reset HEAD
```

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
npm install
npm start
```

## 🏗️ 技术栈

- [Ink](https://github.com/vadimdemedes/ink) — 用于构建交互式 CLI 应用的 React 框架
- [@inkjs/ui](https://github.com/inkjs/ui) — Ink 的 UI 组件库
- [simple-git](https://github.com/steveukx/git-js) — Git 命令接口

## 🤝 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 📄 许可证

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
