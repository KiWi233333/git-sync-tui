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
  <b>Interactive TUI for cross-repository git commit synchronization</b>
</p>

<p align="center">
  Cherry-pick commits from remote branches with an intuitive terminal UI.<br>
  Select specific commits, preview changes, and sync with <code>--no-commit</code> mode for safe review.
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-workflow">Workflow</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="./assets/demo.gif" alt="git-sync-tui demo" width="680">
</p>

## ✨ Features

- 🎯 **Multi-select commits** — Cherry-pick non-consecutive commits with Space / Enter
- 🔍 **Branch search** — Fuzzy filter branches by keyword
- 👀 **Diff preview** — See `--stat` summary of selected commits before executing
- ⚡ **Safe mode** — `--no-commit` stages changes for review, never auto-commits
- ⚠️ **Conflict handling** — Clear display of conflicted files when cherry-pick fails
- 🌐 **Universal** — Works in any git repository, any language

## 🚀 Quick Start

```bash
# Install globally
npm install -g git-sync-tui

# Navigate to your git repo and run
cd your-project
git-sync-tui
```

## 📦 Installation

```bash
npm install -g git-sync-tui
```

> **Requirements:** Node.js >= 20

## 🔄 Workflow

```
Select Remote  →  Select Branch  →  Multi-select Commits  →  Preview Changes
                                                                     ↓
Review & Commit manually  ←  Cherry-pick --no-commit (staged, not committed)
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate items |
| `Space` | Toggle commit selection |
| `Enter` | Confirm selection |
| `y` / `n` | Confirm / cancel execution |
| `/` | Search (in branch list) |

## 📋 After Sync

Changes are staged in your working tree (not committed). You can:

```bash
# Review staged changes
git diff --cached

# Commit when ready
git commit -m "sync: cherry-picked commits from feature-branch"

# Or discard all changes
git reset HEAD
```

## 💡 Use Cases

| Scenario | Description |
|----------|-------------|
| **Backport fixes** | Cherry-pick critical fixes from main to release branches |
| **Sync features** | Copy specific commits between feature branches |
| **Selective merge** | Pick individual commits instead of merging entire branches |

## 🛠️ Development

```bash
git clone https://github.com/KiWi233333/git-sync-tui.git
cd git-sync-tui
npm install
npm start
```

## 🏗️ Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) — React for interactive CLI apps
- [@inkjs/ui](https://github.com/inkjs/ui) — UI components for Ink
- [simple-git](https://github.com/steveukx/git-js) — Git commands interface

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
