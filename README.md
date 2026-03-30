# git-sync-tui

[![npm version](https://img.shields.io/npm/v/git-sync-tui.svg)](https://www.npmjs.com/package/git-sync-tui)
[![Node.js Version](https://img.shields.io/node/v/git-sync-tui.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Interactive TUI tool for cross-repository git commit synchronization

Cherry-pick commits from remote branches with an intuitive terminal UI. Select specific commits, preview changes, and sync with `--no-commit` mode for safe review before committing.

[中文文档](./README.zh-CN.md)

## Features

- 🎯 **Multi-select commits** — Pick non-consecutive commits with Space/Enter
- 🔍 **Branch search** — Filter branches by keyword
- 👀 **Diff preview** — See `--stat` summary of selected commits before executing
- ⚡ **`--no-commit` mode** — Changes are staged, not committed, for safe review
- ⚠️ **Conflict handling** — Shows conflicted files when cherry-pick fails
- 🌐 **Language agnostic** — Works in any git repository

## Installation

```bash
npm install -g git-sync-tui
```

**Requirements:** Node.js >= 20

## Quick Start

```bash
# Navigate to your git repository
cd your-project

# Run the tool
git-sync-tui
```

## Workflow

```
┌─────────────┐    ┌──────────────┐    ┌─────────────────┐    ┌───────────┐
│ Select      │ -> │ Select       │ -> │ Multi-select    │ -> │ Preview   │
│ Remote      │    │ Branch       │    │ Commits         │    │ Changes   │
└─────────────┘    └──────────────┘    └─────────────────┘    └───────────┘
                                                                   │
                                                                   v
┌─────────────────┐    ┌───────────────────────────────────────────────┐
│ Review &        │ <- │ Cherry-pick --no-commit (staged, not committed) │
│ Commit manually │    └───────────────────────────────────────────────┘
└─────────────────┘
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate items |
| `Space` | Toggle commit selection |
| `Enter` | Confirm selection |
| `y` / `n` | Confirm / cancel execution |
| `/` | Search (in branch list) |

### After Sync

Changes are staged in your working tree (not committed). You can:

```bash
# Review staged changes
git diff --cached

# Commit when ready
git commit -m "sync: cherry-picked commits from feature-branch"

# Or discard all changes
git reset HEAD
```

## Use Cases

- **Backport bug fixes** — Cherry-pick critical fixes from main to release branches
- **Sync feature commits** — Copy commits between feature branches
- **Selective merge** — Pick specific commits instead of merging entire branches

## Development

```bash
# Clone the repository
git clone https://github.com/KiWi233333/git-sync-tui.git
cd git-sync-tui

# Install dependencies
npm install

# Run in development mode
npm start

# Build for production
npm run build
```

## Tech Stack

- [Ink](https://github.com/vadimdemedes/ink) — React for interactive CLI apps
- [@inkjs/ui](https://github.com/inkjs/ui) — UI components for Ink
- [simple-git](https://github.com/steveukx/git-js) — Git commands interface

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](./LICENSE) © [KiWi233333](https://github.com/KiWi233333)
