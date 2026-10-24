# dsh-worktree

DeepSeek Harness (DSH) 插件：把 DSH 内置的 Git worktree 能力完整呈现到界面上，支持多任务并行开发。

## 功能

- **输入框分支入口**（`conversation.input.right`，模型选择器左侧）：显示当前分支 / worktree 名，点击打开分支选择面板。
- **分支选择面板**：
  - 当前检出状态（分支、未提交更改数、上游跟踪、worktree 归属）
  - Worktree 列表（`~/.dsh-worktree` 池，含未提交计数；打开会话 / 当前会话进入 / 移除）
  - 本地分支 / 远程分支切换（远程分支自动创建本地跟踪分支）
  - **创建并检出新分支**：在池内创建 worktree，可選擇在新会话中打开（并行任务）或当前会话进入
  - 状态化确认流：未提交更改、分支被其他 worktree 占用、移除脏 worktree 等，均给出下一步操作
- **侧边栏会话行**（`sidebar.session.row.leading` / `.hover`）：worktree 会话显示专用图标与名称（悬停卡片含分支与路径）
- **会话头部**（`conversation.session.header.utilities`）：分支 / worktree 标记 chip（极简模式下随宿主隐藏该区域，输入框入口始终可见）

## 结构

```
index.js            Host 半：git 运行器 + WorktreeService（6 个远程方法）
contract.js         双半共享的远程描述符与 wire 类型
client.js           构建产物（模块加载器工厂格式，勿手改）
client/             客户端源码（panel/decor/api/icons/locales/styles/entry）
build-client.mjs    客户端单文件打包脚本
cordis.patch.yml    bundle 补丁行
locale/{en,zh}.json 插件元信息
test/smoke.mjs      Host 侧离线冒烟测试（真实 git 仓库驱动）
```

## 配置（cordis.patch.yml 的 config）

| 键 | 默认 | 说明 |
| --- | --- | --- |
| `poolDirectory` | `~/.dsh-worktree` | worktree 统一目录（绝对路径） |
| `gitCommand` | `git` | Git 可执行文件 |
| `timeoutMs` / `graceMs` / `maxOutputBytes` | 60000 / 3000 / 65536 | 受控命令边界 |
| `cacheTtlMs` | 8000 | 状态查询缓存 TTL |

## 开发

```bash
node build-client.mjs   # 重新打包客户端（改动 client/ 或 contract.js 后）
node test/smoke.mjs     # Host 侧 40 项冒烟测试
```

## 安装

已在 desktop profile 安装（本地链接 `E:\repo\dsh-worktree`）。Host 半改动由 HMR/重启生效；客户端改动重新构建后刷新页面即可。
