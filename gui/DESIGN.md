# GUI 页面设计规划

## 1. 目标

`gui/` 的设计目标是把现有 CLI/TUI 能力完整搬到桌面端，但界面保持简约、集中、低干扰。GUI 不是通用 Git IDE，也不应把“双仓库工作台”作为主流程必填概念；它只服务一个主流程：

```text
打开当前 Git 仓库 -> 选择 remote -> 选择 remote branch -> 选择 commits -> 确认策略 -> 执行 cherry-pick -> 处理冲突或完成
```

和 CLI/TUI 保持一致的原则：

- 当前 Git 仓库是接收方仓库，GUI 只多一个“选择本地仓库目录”的入口。
- 来源是当前仓库里的 remote 与 remote branch。
- commit 可以跨跃多选，但执行顺序必须按 CLI/TUI 的历史顺序处理。
- stash 保护、stash 恢复、分支检查、备份分支、`--no-commit`、逐个提交、`-m 1`、冲突 continue/abort/quit、空提交 skip、完成摘要都要有 GUI 等价入口。
- 所有高风险操作都以明确状态和确认呈现，不隐藏 Git 后果。

## 2. 页面总览

第一版采用单窗口状态机，不做侧边导航：

```text
AppShell
  TopBar
  StepContent
    0. StartupGuardView
    1. SourcePickerView
    2. BranchCheckView
    3. CommitPickerView
    4. ConfirmPlanView
    5. ExecutionView
    6. ConflictView
    7. FinishView
  BottomActionBar
```

`TopBar` 固定显示当前仓库、当前分支、remote/branch、执行模式、stash 状态。页面主体每次只突出一个决策，底部固定放主操作和返回操作。

## 3. 视觉方向

风格：极简工具界面，偏 shadcn / VS Code SCM 的密度，但不复制 IDE。

色彩：

```text
Background:   #09090b
Panel:        #111114 / #18181b
Border:       #27272a
Text:         #fafafa
Text muted:   #a1a1aa
Info:         #3b82f6
Success:      #22c55e
Warning:      #eab308
Danger:       #ef4444
```

规则：

- 黑白灰负责结构，不做彩色大面积背景。
- 蓝色只用于当前选中、信息状态、执行中。
- 黄色只用于冲突、dirty workspace、merge commit 等风险。
- 红色只用于失败、abort、不可逆风险。
- 卡片半径控制在 8px 左右，列表和表格优先高密度。
- 不做 landing page，不放营销说明，打开即进入工作流。

## 4. 页面 0：启动与安全检查

对应 CLI/TUI：

- `checking`
- `stash-recovery`
- `stash-prompt`
- `--no-stash`

布局：

```text
Main
  当前仓库路径
  当前分支
  工作区状态
  stash guard 状态
BottomActionBar
  选择仓库
  自动 stash
  不 stash 继续
  恢复 stash
```

交互：

- 启动后自动检查当前路径是否为 Git 仓库；桌面端允许用户选择目录。
- 检测到 stash guard 时优先显示恢复提示，操作为“恢复 stash”或“跳过并清除标记”。
- 工作区 dirty 时显示三项：`自动 stash`、`不 stash 继续`、`取消`。其中“不 stash 继续”等价于 CLI `--no-stash`。
- stash 成功后在 TopBar 持续显示 `stashed` badge，完成或 abort 后恢复。

## 5. 页面 1：来源选择

对应 CLI/TUI：

- `--remote`
- `--branch`
- `--count`
- `--list`
- `RemoteSelect`
- `BranchSelect`

布局：

```text
Main
  Remote select
  Branch search/select
  Count input: 默认 100
  Remote URL 只读摘要
  Fetch / branch validation 状态
BottomActionBar
  返回
  列出 commits
```

设计要点：

- remote 只从当前仓库 `git remote -v` 读取，避免引入“目标仓库”新概念。
- branch 支持搜索，显示 `remote/branch`。
- `--list` 在 GUI 中就是只进入 commit 列表，不执行；可以提供“复制列表”作为增强，但不是主流程。
- 如果启动参数已传入 remote/branch，页面自动预填并跳过已满足步骤。

## 6. 页面 2：分支检查

对应 CLI/TUI：

- `BranchCheck`
- 当前分支与目标 branch 同名检查
- 从当前分支创建目标分支
- 切换到已有目标分支
- 留在当前分支同步

布局：

```text
Main
  当前本地分支
  目标 remote branch 名称
  本地同名分支是否存在
BottomActionBar
  切换/创建并切换
  留在当前分支同步
  返回
```

交互：

- 当前分支等于目标分支时自动进入下一步。
- 本地同名分支存在时主操作为“切换到该分支”。
- 本地同名分支不存在时主操作为“从当前分支创建并切换”。
- 次操作始终保留“留在当前分支同步”，与 TUI 的 `n` 一致。

## 7. 页面 3：Commit 选择

对应 CLI/TUI：

- commit 多选
- 已同步标记
- diff stat 预览
- `a` 全选、`i` 反选、范围选择、选至开头
- 按历史顺序输出执行队列

布局：

```text
Main: 两栏
  左侧 CommitList
    search / filter / refresh
    checkbox
    synced badge
    short hash / message / author / date
  右侧 PreviewPanel
    已选队列
    diff --stat
    merge commit 风险
BottomActionBar
  返回
  确认选择
```

设计要点：

- GUI 可以用 checkbox、Shift 范围选择、批量菜单替代快捷键，但功能必须覆盖。
- 已同步 commit 置灰且默认不可选，和 TUI 一致。
- 右侧队列必须展示真实执行顺序，不展示用户点击顺序。
- diff stat 面板固定高度，可滚动，不因内容导致页面跳动。
- merge commit 显示黄色风险提示，进入确认页时允许开启 `-m 1`。

## 8. 页面 4：确认执行

对应 CLI/TUI：

- `ConfirmPanel`
- `--no-commit`
- 逐个提交
- `--mainline`
- `--yes`

布局：

```text
Main
  执行摘要
  选中 commit 列表
  执行模式 segmented control
    --no-commit
    逐个提交
  merge commit mainline toggle
  stash / backup 提示
BottomActionBar
  返回修改
  开始执行
```

交互：

- `--no-commit` 是默认推荐模式，说明“改动暂存到工作区，需手动 commit”。
- “逐个提交”说明“保留原始 commit 信息”。
- 只有检测到 merge commit 时显示 `-m 1` 开关。
- GUI 默认不需要单独的 `--yes`，因为点击“开始执行”就是显式确认。

## 9. 页面 5：执行进度

对应 CLI/TUI：

- 创建备份分支
- 逐个 `cherry-pick`
- running / conflict / empty / done / aborted
- stash restore

布局：

```text
Main
  当前阶段
  当前 commit
  进度条
  备份分支名称
  最近日志
BottomActionBar
  终止并回滚
```

状态：

- `preparing`：创建 backup、准备执行。
- `running`：正在 cherry-pick，第 N/M 个 commit。
- `conflicted`：自动进入冲突页。
- `empty`：展示空提交处理页，允许 skip/abort/quit。
- `completed`：自动恢复 stash 后进入完成页。
- `failed`：显示错误和恢复建议。

## 10. 页面 6：冲突处理

对应 CLI/TUI：

- 冲突文件列表
- `continue`
- `abort`
- `quit`
- `--no-commit` 模式下清除 cherry-pick state
- 逐个提交模式下 `cherry-pick --continue --no-edit`

MVP 布局：

```text
Main: 两栏
  左侧 ConflictPanel
    当前冲突 commit
    进度
    冲突文件
    staged files
  右侧 ResolveGuide
    手动解决步骤
    git status 摘要
    refresh
BottomActionBar
  继续
  放弃并回滚
  退出保留当前状态
```

设计取舍：

- MVP 与 CLI 保持一致：用户可在外部编辑器解决冲突，GUI 负责检测、继续、放弃、退出。
- 后续增强可以加入内置 diff/merge editor，但不能阻塞 CLI 等价闭环。
- “继续”前必须重新检查 `git status`，仍有冲突则停留并展示文件列表。
- `abort` 必须二次确认，并说明会回滚到备份分支。
- `quit` 不做回滚，保留当前仓库状态，文案必须明确。

## 11. 页面 7：完成摘要

对应 CLI/TUI：

- success / aborted
- staged stat
- stash restore result
- 后续命令提示

布局：

```text
Main
  结果状态
  commits 完成数 / skipped 数
  模式
  staged diff --stat
  stash 恢复结果
  输出分支
BottomActionBar
  复制摘要
  新建同步
  退出
```

`--no-commit` 完成时必须显示：

```text
git diff --cached
git commit -m "sync: ..."
git reset HEAD
```

逐个提交完成时显示最近提交摘要。

## 12. CLI 功能映射表

| CLI/TUI 能力 | GUI 入口 |
| --- | --- |
| 无参数交互模式 | 启动后完整状态机 |
| `-r, --remote` | 来源选择页 remote select |
| `-b, --branch` | 来源选择页 branch select |
| `-c, --commits` | Commit 选择页勾选队列；后续可支持 hash 输入 |
| `-n, --count` | 来源选择页 count input |
| `-m, --mainline` | 确认页 `-m 1` toggle |
| `-y, --yes` | GUI 的“开始执行”显式确认 |
| `--no-stash` | 启动安全检查页“不 stash 继续” |
| `--list` | 只进入 commit 列表并提供复制/刷新，不开始执行 |
| 多选、全选、反选、连选 | checkbox、批量菜单、Shift range |
| diff stat 预览 | Commit 选择页右侧固定预览 |
| 已同步标记 | Commit row synced badge / disabled |
| 分支检查 | 分支检查页 |
| 备份分支 | 执行页展示 backup badge |
| 自动 stash / 恢复 | 启动页与完成页 |
| 冲突 continue | 冲突页“继续” |
| 冲突 abort | 冲突页“放弃并回滚” |
| 冲突 quit | 冲突页“退出保留当前状态” |
| 空提交 skip | 空提交状态页“跳过此 commit” |
| 更新提示 | TopBar 或完成页的低优先级提示 |

## 13. 组件拆分建议

```text
gui/src/
  app/
    AppShell.tsx
  components/
    layout/
      TopBar.tsx
      BottomActionBar.tsx
      LoadingOverlay.tsx
      StateBlock.tsx
    ui/
      Button.tsx
      Badge.tsx
      Card.tsx
      SegmentedControl.tsx
      ConfirmDialog.tsx
  features/
    startup-guard/
      StartupGuardView.tsx
      StashRecoveryPanel.tsx
      DirtyWorkspacePanel.tsx
    source-picker/
      SourcePickerView.tsx
      RemoteSelect.tsx
      RemoteBranchSelect.tsx
    branch-check/
      BranchCheckView.tsx
    commit-selection/
      CommitPickerView.tsx
      CommitList.tsx
      CommitPreviewPanel.tsx
      ExecutionQueue.tsx
    confirm-plan/
      ConfirmPlanView.tsx
    execution/
      ExecutionView.tsx
      EmptyCommitView.tsx
    conflict/
      ConflictView.tsx
      ConflictFileList.tsx
      ResolveGuide.tsx
    finish/
      FinishView.tsx
  stores/
    useWorkbenchStore.ts
  bridge/
    desktop.ts
  types/
    workbench.ts
```

第一阶段可以继续用一个 `useWorkbenchStore`，但字段按 `startup/source/queue/execution/conflict/finish` 分组，避免 `AppShell` 持续膨胀。

## 14. 实施顺序

1. 收敛现有 `gui/` 信息架构，移除“接收方/提供方双仓库”作为主路径，改成当前仓库 remote 模型。
2. 补齐 startup guard：Git 仓库检查、dirty workspace、stash recovery。
3. 做 remote/branch/count 选择页，并接真实 bridge。
4. 重做 commit 选择页：列表 + 右侧队列和 stat 预览。
5. 增加确认页，覆盖 `--no-commit`、逐个提交、`-m 1`。
6. 改执行状态机，对齐 TUI 的 backup、empty、conflict、abort、stash restore。
7. 冲突页先做 CLI 等价的外部编辑器流程，再考虑内置 merge editor。
8. 完成页输出后续命令、stat、stash 结果。

## 15. 验收标准

- GUI 主路径能覆盖 README 中列出的 CLI/TUI 功能。
- 任意一步只有一个主按钮，次级操作弱化但可达。
- 不引入 CLI 没有的核心概念作为必填项。
- 工作区 dirty、stash guard、merge commit、冲突、空提交、abort 都有明确状态。
- commit 执行顺序与 TUI `orderSelectedHashesByCommits` 保持一致。
- `--no-commit` 完成后明确告诉用户后续 Git 命令。
- 所有 destructive action 都有二次确认或明确后果说明。
