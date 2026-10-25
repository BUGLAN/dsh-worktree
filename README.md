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
- **「工作树」Tab**（`conversation.view`，第三个原生 Tab）：完整管理页
  - 读数带：仓库 / HEAD / 上游 ↑↓ / 未提交 / 工作树数 / 池目录
  - 提交图：`git log --all --date-order` 的 DAG 由泳道算法（`client/graph-layout.js`）实时布线，节点/分叉/汇入全部推导而非手绘；HEAD 行有环标记，点行展开详情
  - 工作树机架：主检出 + 池内工作树卡（LED 脏/净、进入会话、移除含脏树 --force 确认）
  - 分支列表：每行常驻 `⋯` 菜单（检出 / 建工作树 / 复制名 / 删除分支），删除走状态化确认（当前分支 / 被工作树占用 / 未合并需勾选 -D）
  - 新建工作树表单：三个退出点（✕ / 取消 / Esc 逐层退出），取消保留已输入
- **侧边栏会话行**（`sidebar.session.row.leading` / `.hover`）：worktree 会话显示专用图标与名称（悬停卡片含分支与路径）
- **会话头部**（`conversation.session.header.utilities`）：分支 / worktree 标记 chip（极简模式下随宿主隐藏该区域，输入框入口始终可见）

## 结构

```
index.js            Host 半：git 运行器 + WorktreeService（8 个远程方法）
client/graph-layout.js 提交图泳道布局（纯函数，git log --graph 同款算法）
client/view.js      工作树 Tab 视图（读数带 + 提交图 + 机架）
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
