# git-sync-tui GUI

`gui/` 是 `git-sync-tui` 的桌面端实现目录，目标是用简约 GUI 覆盖现有 CLI/TUI 的完整 cherry-pick 同步流程。

页面设计基线见：

- [GUI 页面设计规划](./DESIGN.md)

当前设计原则：

- 以当前 Git 仓库为接收方，只选择该仓库中的 `remote` 和 `remote branch`。
- 不把主流程扩展成通用 IDE 或强制双仓库工作台。
- GUI 功能必须和 CLI/TUI 对齐：stash 保护、分支检查、commit 多选、diff stat、`--no-commit`/逐个提交、`-m 1`、backup、冲突 continue/abort/quit、空提交 skip、完成摘要。
- 第一阶段冲突处理先保持 CLI 等价：外部编辑器解决冲突，GUI 负责检测状态、继续、放弃和退出。

## Development

```bash
pnpm install
cd gui
pnpm dev
```

Desktop build:

```bash
cd gui
pnpm tauri dev
```
