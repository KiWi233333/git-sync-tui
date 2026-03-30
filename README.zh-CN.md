# git-sync-tui

[![npm version](https://img.shields.io/npm/v/git-sync-tui.svg)](https://www.npmjs.com/package/git-sync-tui)
[![Node.js Version](https://img.shields.io/node/v/git-sync-tui.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> 跨仓库 Git 提交同步的交互式 TUI 工具

通过直观的终端界面从远程分支 cherry-pick 提交。选择特定提交、预览变更，并使用 `--no-commit` 模式在提交前安全审查。

## 功能特性

- 🎯 **多选提交** — 使用 Space/Enter 选择不连续的提交
- 🔍 **分支搜索** — 按关键词过滤分支
- 👀 **差异预览** — 执行前查看所选提交的 `--stat` 摘要
- ⚡ **`--no-commit` 模式** — 变更暂存但不提交，便于安全审查
- ⚠️ **冲突处理** — cherry-pick 失败时显示冲突文件
- 🌐 **语言无关** — 适用于任何 Git 仓库

## 安装

```bash
npm install -g git-sync-tui
```

**环境要求：** Node.js >= 20

## 快速开始

```bash
# 进入你的 Git 仓库目录
cd your-project

# 运行工具
git-sync-tui
```

## 工作流程

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌───────────┐
│ 选择        │ -> │ 选择         │ -> │ 多选            │ -> │ 预览      │
│ 远程仓库    │    │ 分支         │    │ 提交            │    │ 变更      │
└─────────────┘    └──────────────┘    └─────────────────┘    └───────────┘
                                                                   │
                                                                   v
┌─────────────────┐    ┌───────────────────────────────────────────────┐
│ 手动审查        │ <- │ Cherry-pick --no-commit (已暂存，未提交)        │
│ 并提交          │    └───────────────────────────────────────────────┘
└─────────────────┘
```

### 键盘快捷键

| 按键 | 操作 |
|-----|------|
| `↑` / `↓` | 上下导航 |
| `Space` | 切换提交选择 |
| `Enter` | 确认选择 |
| `y` / `n` | 确认 / 取消执行 |
| `/` | 搜索（在分支列表中） |

### 同步后操作

变更已暂存在工作区（未提交）。你可以：

```bash
# 查看暂存的变更
git diff --cached

# 准备好后提交
git commit -m "sync: 从 feature-branch cherry-pick 提交"

# 或放弃所有变更
git reset HEAD
```

## 使用场景

- **回溯 Bug 修复** — 从主分支 cherry-pick 关键修复到发布分支
- **同步特性提交** — 在特性分支间复制提交
- **选择性合并** — 选择特定提交而非合并整个分支

## 开发

```bash
# 克隆仓库
git clone https://github.com/KiWi233333/git-sync-tui.git
cd git-sync-tui

# 安装依赖
npm install

# 开发模式运行
npm start

# 生产环境构建
npm run build
```

## 技术栈

- [Ink](https://github.com/vadimdemedes/ink) — 用于构建交互式 CLI 应用的 React 框架
- [@inkjs/ui](https://github.com/inkjs/ui) — Ink 的 UI 组件库
- [simple-git](https://github.com/steveukx/git-js) — Git 命令接口

## 贡献

欢迎贡献代码！请随时提交 Pull Request。

## 许可证

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
