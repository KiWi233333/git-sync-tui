# git-sync-tui

Interactive TUI tool for cross-repo git commit synchronization.

Cherry-pick commits from remote branches with an interactive terminal UI — select specific commits, preview changes, and sync with `--no-commit` mode for review before committing.

## Features

- **Multi-select commits** — pick non-consecutive commits with Space/Enter
- **`--no-commit` mode** — changes are staged, not committed, so you can review and edit before committing
- **Diff preview** — see `--stat` summary of selected commits before executing
- **Branch search** — filter branches by keyword
- **Conflict handling** — shows conflicted files when cherry-pick fails
- **Language agnostic** — works in any git repo (Node.js, Go, Python, Java, etc.)

## Install

```bash
npm install -g git-sync-tui
```

Requires Node.js >= 20.

## Usage

```bash
# Run in any git repository
git-sync-tui
```

### Workflow

```
[Select remote] → [Select branch] → [Multi-select commits] → [Preview stat] → [Confirm] → [Cherry-pick --no-commit] → [Review & commit manually]
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate |
| `Space` | Toggle commit selection |
| `Enter` | Confirm selection |
| `y` / `n` | Confirm / cancel execution |

### After sync

Changes are staged in your working tree (not committed). You can:

```bash
git diff --cached          # Review changes
git commit -m "sync: ..."  # Commit when ready
git reset HEAD             # Or discard all changes
```

## Development

```bash
git clone https://github.com/KiWi233333/git-sync-tui.git
cd git-sync-tui
npm install
npm start        # Run with tsx
npm run build    # Build with tsup
```

## License

MIT
