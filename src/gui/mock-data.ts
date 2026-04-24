import type { WorkspaceSnapshot } from './types.js'

export const workspaceSnapshot: WorkspaceSnapshot = {
  repositories: [
    {
      id: 'current-local',
      name: 'my-project-local',
      provider: 'Local Workspace',
      path: '/Users/yunge/workspaces/my-project-local',
      branch: 'release/2026.04',
      mode: 'local',
      health: 'ready',
      role: 'current',
      lastSync: '2 分钟前',
    },
    {
      id: 'current-clone',
      name: 'my-project-local-clone',
      provider: 'Managed Clone',
      path: '~/Library/Application Support/git-sync-tui/worktrees/my-project-local',
      branch: 'release/2026.04',
      mode: 'clone',
      health: 'syncing',
      role: 'current',
      lastSync: '正在更新 fetch',
    },
    {
      id: 'target-upstream',
      name: 'upstream-repo',
      provider: 'GitHub Enterprise',
      path: 'git@github.com:team/upstream-repo.git',
      branch: 'feature/new-api',
      mode: 'clone',
      health: 'ready',
      role: 'target',
      lastSync: '17 秒前',
    },
    {
      id: 'target-local-cache',
      name: 'upstream-repo-local',
      provider: 'Existing Clone',
      path: '/Users/yunge/workspaces/upstream-repo',
      branch: 'feature/new-api',
      mode: 'local',
      health: 'stale',
      role: 'target',
      lastSync: '12 小时前',
    },
  ],
  branchesByRepository: {
    'current-local': [
      { name: 'release/2026.04', ahead: 2, behind: 0, protected: true },
      { name: 'hotfix/payment-retry', ahead: 0, behind: 3 },
      { name: 'feat/merge-workbench', ahead: 5, behind: 1 },
    ],
    'current-clone': [
      { name: 'release/2026.04', ahead: 0, behind: 0, protected: true },
      { name: 'feat/merge-workbench', ahead: 0, behind: 0 },
    ],
    'target-upstream': [
      { name: 'feature/new-api', ahead: 13, behind: 1 },
      { name: 'main', ahead: 0, behind: 0, protected: true },
      { name: 'release/2026.04', ahead: 4, behind: 2, protected: true },
    ],
    'target-local-cache': [
      { name: 'feature/new-api', ahead: 13, behind: 1 },
      { name: 'main', ahead: 0, behind: 0, protected: true },
    ],
  },
  commits: [
    {
      hash: '9c3fa183b0f1',
      shortHash: '9c3fa18',
      title: 'feat(sdk): 新增 Anthropic Messages API 兼容接口',
      author: '张燕彬',
      relativeTime: '11 分钟前',
      filesChanged: 12,
      insertions: 286,
      deletions: 18,
      tags: ['sdk', 'api'],
      risk: 'watch',
    },
    {
      hash: 'f1aa092c7e31',
      shortHash: 'f1aa092',
      title: 'refactor(router): 将 failover 路由拆分为 provider adapter',
      author: '宇华',
      relativeTime: '18 分钟前',
      filesChanged: 7,
      insertions: 164,
      deletions: 49,
      tags: ['router', 'adapter'],
      risk: 'conflict',
    },
    {
      hash: '2a912d43e875',
      shortHash: '2a912d4',
      title: 'fix(auth): 兼容 SDK 模式下的 bearer token 注入',
      author: '康杰',
      relativeTime: '31 分钟前',
      filesChanged: 3,
      insertions: 41,
      deletions: 7,
      tags: ['auth'],
      risk: 'safe',
    },
    {
      hash: '684c71d9b2af',
      shortHash: '684c71d',
      title: 'feat(balance): 支持按模型能力优先级的 failover 负载均衡',
      author: '锐城',
      relativeTime: '45 分钟前',
      filesChanged: 9,
      insertions: 132,
      deletions: 16,
      tags: ['balance', 'runtime'],
      risk: 'conflict',
    },
    {
      hash: 'ea7734a7d830',
      shortHash: 'ea7734a',
      title: 'docs(changelog): 补充 SDK 兼容接口接入说明',
      author: '张燕彬',
      relativeTime: '58 分钟前',
      filesChanged: 2,
      insertions: 19,
      deletions: 0,
      tags: ['docs'],
      risk: 'safe',
      alreadySynced: true,
    },
  ],
  conflicts: [
    {
      path: '.gitignore',
      folder: '/',
      status: 'U',
      chunks: [
        {
          id: 'gitignore-1',
          incomingStart: 41,
          currentStart: 40,
          baseHint: 'base: 仅保留 .kiro/ 和 claude.local.md',
          incomingLines: [
            '.opencow',
            '.opencow-dev',
          ],
          currentLines: [
            '# Kubernetes secrets (never commit actual secrets)',
            'k8s/secret.yaml',
            'k8s/tls-secret.yaml',
            'k8s/.version',
            '*.crt',
            '*.key',
          ],
        },
      ],
    },
    {
      path: 'app/http/routers/router.py',
      folder: 'app/http/routers',
      status: 'U',
      chunks: [
        {
          id: 'router-1',
          incomingStart: 128,
          currentStart: 126,
          baseHint: 'base: sdk 路由入口原先只挂载 /v1/messages',
          incomingLines: [
            "router.add_api_route('/sdk/v1/messages', sdk_messages_handler, methods=['POST'])",
            "router.add_api_route('/sdk/v1/models', sdk_models_handler, methods=['GET'])",
          ],
          currentLines: [
            "router.add_api_route('/v1/messages', messages_handler, methods=['POST'])",
            "router.add_api_route('/v1/health', health_handler, methods=['GET'])",
          ],
        },
        {
          id: 'router-2',
          incomingStart: 172,
          currentStart: 174,
          baseHint: 'base: provider adapter 注入点',
          incomingLines: [
            'adapter = resolve_sdk_provider(provider_name, failover=True)',
            'request.scope["provider_adapter"] = adapter',
          ],
          currentLines: [
            'adapter = resolve_provider(provider_name)',
            'request.state.provider_adapter = adapter',
          ],
        },
      ],
    },
    {
      path: 'core/load_balance/failover.py',
      folder: 'core/load_balance',
      status: 'U',
      chunks: [
        {
          id: 'failover-1',
          incomingStart: 63,
          currentStart: 61,
          baseHint: 'base: 原实现无模型能力排序',
          incomingLines: [
            'ordered_nodes = rank_nodes_by_model_capability(nodes, requested_model)',
            'return ordered_nodes[:limit]',
          ],
          currentLines: [
            'random.shuffle(nodes)',
            'return nodes[:limit]',
          ],
        },
      ],
    },
  ],
  stagedFiles: [
    { path: 'app/services/sdk_auth.py', folder: 'app/services', status: 'A', tone: 'staged' },
    { path: 'app/controllers/base_controller.py', folder: 'app/controllers', status: 'A', tone: 'staged' },
    { path: 'core/providers/anthropic_adapter.py', folder: 'core/providers', status: 'M', tone: 'staged' },
    { path: 'docs/sdk-compat.md', folder: 'docs', status: 'A', tone: 'staged' },
  ],
  activity: [
    { title: '仓库就绪', detail: '当前仓库使用本地工作区，目标仓库使用托管 clone。', state: 'done' },
    { title: '选择提交', detail: '支持跨跃多选，但执行时始终按原始时间线顺序 cherry-pick。', state: 'active' },
    { title: '逐个冲突提交', detail: '每次解决一组冲突后可以像 VS Code SCM 一样提交并继续。', state: 'pending' },
  ],
  suggestedMessage: `feat(sdk): 同步 Anthropic Messages API 兼容接口

- 新增 SDK 认证中间件
- 新增 /sdk/v1/messages 端点
- 支持 failover 负载均衡
- 保留 Anthropic 所有特性`,
  cloneDestination: '~/Library/Application Support/git-sync-tui/worktrees',
}
