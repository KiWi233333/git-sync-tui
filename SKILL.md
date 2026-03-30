---
name: git-sync-tui-patterns
description: Coding patterns and conventions for git-sync-tui - an interactive TUI/CLI tool for cross-repo git commit synchronization
version: 1.0.0
source: local-git-analysis
analyzed_commits: 23
---

# git-sync-tui Patterns

## Project Overview

Interactive TUI/CLI tool built with Ink (React for terminal) that cherry-picks commits from remote branches with `--no-commit` mode. Supports both interactive TUI and pure CLI execution.

**Tech Stack**: TypeScript, React 18, Ink 5, meow (CLI parsing), simple-git, tsup (bundling)

## Commit Conventions

**Conventional Commits** with Chinese descriptions and scope:

```
feat(scope): 中文描述
fix(scope): 中文描述
chore(scope): 中文描述
refactor(scope): 中文描述
docs(scope): 中文描述
ci(scope): 中文描述
```

Common scopes: `sync`, `ui`, `stash`, `config`, `ci`, `deps`, `readme`, `cli`, `release`, `init`

Version bumps use plain version number: `0.1.3`

## Code Architecture

```
src/
├── cli.tsx                    # CLI entry - meow flag parsing, mode routing
├── cli-runner.ts              # Pure CLI executor (no Ink/React dependency)
├── app.tsx                    # Main TUI App component (step state machine)
├── components/
│   ├── ui.tsx                 # Shared UI primitives (AppHeader, SectionHeader, KeyHints, etc.)
│   ├── remote-select.tsx      # Step 1: Remote repository selection
│   ├── branch-select.tsx      # Step 2: Branch selection with filter
│   ├── commit-list.tsx        # Step 3: Multi-select commit list
│   ├── confirm-panel.tsx      # Step 4: Execution confirmation
│   ├── result-panel.tsx       # Step 5: Cherry-pick result display
│   ├── stash-prompt.tsx       # Stash confirmation prompt
│   └── stash-recovery.tsx     # Stash guard recovery
├── hooks/
│   └── use-git.ts             # React hooks wrapping git operations (useRemotes, useBranches, useCommits)
└── utils/
    └── git.ts                 # Pure git operations via simple-git (no React dependency)
```

## Key Design Patterns

### Dual-Mode Architecture (TUI + CLI)

- `cli.tsx`: Parses flags, routes to TUI (`<App />`) or CLI (`runCli()`)
- TUI mode: Full Ink/React interactive UI, default when no params
- CLI mode: Pure text output via `cli-runner.ts`, activated when all required params provided
- Partial params: TUI mode with steps skipped (e.g., `-r origin` skips remote selection)

### Step State Machine (app.tsx)

```typescript
type Step = 'checking' | 'stash-recovery' | 'stash-prompt' | 'remote' | 'branch' | 'commits' | 'confirm' | 'result'
```

- Linear progression with ESC back-navigation
- Debounced step transitions (100ms) to prevent key event leaking
- `inputReady` guard prevents input during transitions

### Separation of Concerns

- **`utils/git.ts`**: Pure async functions, zero React dependency. Used by both TUI and CLI.
- **`hooks/use-git.ts`**: React hooks wrapping git utils with loading/error state.
- **`cli-runner.ts`**: Pure Node.js, uses `utils/git.ts` directly, no Ink dependency.
- **Components**: Each step is an isolated component with `onSelect`/`onBack` callbacks.

### Stash Guard Safety

- Write guard file to `.git/` before stash
- Register SIGINT/SIGTERM/SIGHUP handlers for sync stash restore
- On next launch, detect guard → offer recovery
- Both async and sync variants for different contexts

## Workflows

### Adding a New TUI Step

1. Add step name to `Step` type union in `app.tsx`
2. Add step number in `STEP_NUMBER` mapping
3. Create component in `src/components/` with `onSelect`/`onBack` props
4. Add step rendering block in `App` return JSX
5. Wire `goBack` mapping and forward transition

### Adding a New CLI Flag

1. Add flag definition in `cli.tsx` meow config
2. Add to `CliOptions` interface in `cli-runner.ts`
3. Pass through in `cli.tsx` routing logic
4. Implement in `runCli()` / `runList()` / `runExec()`

### Adding a Git Operation

1. Add pure async function in `src/utils/git.ts`
2. If needed in TUI: add React hook in `src/hooks/use-git.ts`
3. If needed in CLI: call directly from `cli-runner.ts`

## Testing Patterns

- No test framework configured (manual testing)
- Build verification: `pnpm build` (tsup, must succeed)
- Manual CLI tests: `node dist/cli.js --help`, `node dist/cli.js -r origin -b main --list`
- TUI requires TTY: `pnpm dev` in terminal

## Build & Release

- **Build**: `pnpm build` → tsup bundles `src/cli.tsx` → `dist/cli.js` (ESM, node20 target)
- **Shebang**: Auto-added via tsup banner `#!/usr/bin/env node`
- **Release**: `pnpm release:patch` → version bump + git push --follow-tags
- **CI**: GitHub Actions with npm Trusted Publishing (OIDC), triggered by tag push
- **Package manager**: pnpm 10.x, Node 24+

## Coding Conventions

- **Language**: TypeScript strict mode, ESM (`"type": "module"`)
- **Imports**: `.js` extension for local imports (ESM requirement)
- **Components**: Named exports, PascalCase filenames
- **Hooks**: `use` prefix, one hook per file
- **Utils**: Pure functions, single `git.ts` module
- **JSX**: `react-jsx` transform (no React import needed in components)
- **UI text**: Chinese for user-facing messages
- **Symbols**: `✔` success, `✖` error, `▲` warning, `▸` action hint
