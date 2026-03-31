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
  Multi-select commits, preview diff stats, handle conflicts interactively, and sync safely with backup &amp; stash protection.
</p>

<p align="center">
  <a href="#-features">Features</a> ·
  <a href="#-quick-start">Quick Start</a> ·
  <a href="#-installation">Installation</a> ·
  <a href="#-workflow">Workflow</a> ·
  <a href="#%EF%B8%8F-cli-options">CLI Options</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | <a href="./README.zh-CN.md">中文</a>
</p>

<p align="center">
  <img src="./assets/demo.gif" alt="git-sync-tui demo" width="680">
</p>

## ✨ Features

- 🎯 **Multi-select commits** — Select non-consecutive commits with Space, range-select with Shift+↑↓, toggle all with `a`, invert with `i`
- 🔍 **Branch search** — Fuzzy filter branches by keyword
- 👀 **Diff preview** — Scrollable `--stat` summary panel with `j`/`k` navigation
- ⚡ **Dual mode** — `--no-commit` stages changes for review, or commit individually preserving original messages
- 🔀 **One-by-one cherry-pick** — Executes commits sequentially, pausing on conflicts for interactive resolution
- ⚠️ **Conflict handling** — Shows conflicted files, resolve in another terminal, then continue/abort/quit
- 🛡️ **Safe backup** — Creates a backup branch before execution; full rollback on abort
- 📦 **Auto stash** — Detects uncommitted changes, offers to stash, auto-restores after sync
- 🔄 **Stash recovery** — Detects interrupted sessions and offers to recover stashed changes
- 🌿 **Branch check** — Auto-creates target branch from main/master if not on it
- ✅ **Synced markers** — Marks already-synced commits as `[synced]` in the commit list
- 🖥️ **CLI mode** — Non-interactive mode with `-r -b -c` flags for scripting
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
Check workspace  →  Select Remote  →  Select Branch  →  Branch Check  →  Multi-select Commits
     ↓                                                                          ↓
Auto stash                                                               Preview diff stats
(if needed)                                                                     ↓
                                                                       Confirm & choose mode
                                                                               ↓
                                                              Cherry-pick one-by-one (with backup)
                                                                               ↓
                                                                    Handle conflicts / Done
                                                                               ↓
                                                                    Restore stash & exit
```

## ⌨️ Keyboard Shortcuts

### Commit Selection

| Key | Action |
|-----|--------|
| `↑` `↓` | Navigate commits |
| `Space` | Toggle commit selection |
| `Shift`+`↑`/`↓` | Range select |
| `a` | Select all / Deselect all |
| `i` | Invert selection |
| `r` | Select from top to cursor |
| `j` / `k` | Scroll diff stat preview |
| `Enter` | Confirm selection |
| `Esc` | Go back |

### Confirm Panel

| Key | Action |
|-----|--------|
| `y` | Confirm execution |
| `n` | Cancel |
| `c` | Toggle commit mode (--no-commit / individual) |
| `m` | Toggle `-m 1` for merge commits |
| `Esc` | Go back |

### Conflict Handling

| Key | Action |
|-----|--------|
| `c` | Continue (after resolving conflicts) |
| `a` | Abort (rollback all changes) |
| `q` | Quit (keep current state) |

## ⚙️ CLI Options

```
Usage
  $ git-sync-tui [options]

Options
  -r, --remote <name>       Remote name
  -b, --branch <name>       Remote branch name
  -c, --commits <hashes>    Commit hashes (comma-separated)
  -n, --count <number>      Number of commits to show (default: 100)
  -m, --mainline            Use -m 1 for merge commits
  -y, --yes                 Skip confirmation
  --no-stash                Skip stash prompt
  --list                    List remote branch commits and exit

Modes
  No arguments               Interactive TUI mode
  -r -b --list               List commits (plain text)
  -r -b -c                   CLI mode, confirm before execution
  -r -b -c --yes             CLI mode, execute directly
  -r or -r -b only           TUI mode, skip completed steps

Examples
  $ git-sync-tui                                           # TUI mode
  $ git-sync-tui -r upstream -b main --list                # List commits
  $ git-sync-tui -r upstream -b main -c abc1234 --yes      # Execute directly
  $ git-sync-tui -r upstream -b main -c abc1234,def5678    # Confirm then execute
  $ git-sync-tui -r upstream                               # TUI mode, skip remote select
```

## 📋 After Sync

**--no-commit mode** — Changes are staged in your working tree (not committed):

```bash
git diff --cached                        # Review staged changes
git commit -m "sync: cherry-picked commits from feature-branch"  # Commit
git reset HEAD                           # Or discard all changes
```

**Individual commit mode** — Original commit messages are preserved. Check with `git log`.

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
pnpm install
pnpm start
```

## 🏗️ Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) — React for interactive CLI apps
- [@inkjs/ui](https://github.com/inkjs/ui) — UI components for Ink
- [simple-git](https://github.com/steveukx/git-js) — Git commands interface
- [meow](https://github.com/sindresorhus/meow) — CLI argument parsing

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
