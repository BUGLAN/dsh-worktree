# 「工作树」Tab 视觉原型

> 在会话头部的 Tab 条上，于 **对话 / 轨迹** 之后加入第三项 **工作树**，
> 把分支管理与 git 工作树管理收进同一页，并用提交图画出节点之间的连接。

- 原型（可交互）：[`prototype-worktree-tab.html`](prototype-worktree-tab.html)
- 截图：[默认](wt-tab-dark.png) · [分支菜单](wt-tab-menu.png) · [删除确认](wt-tab-delete.png) · [删除被占用](wt-tab-delete-blocked.png) · [移除工作树](wt-tab-remove.png) · [新建表单](wt-tab-dark-create.png) · [亮色](wt-tab-light.png) · [亮色菜单](wt-tab-menu-light.png)

打开即用，数据是手写样例。深链：`?state=commit|menu|delete|delete-blocked|remove-wt|create|wt`，`?theme=light`。
键盘：`↑↓` 选提交、`Esc` 逐层退出、双击空白切主题。

---

## 1. 嵌入点（已从宿主源码确认）

宿主 `packages/client/ui-conversation` 的 Tab 条由 **`conversation.view` 插槽**驱动：

```
'conversation.view': { kind: 'list'; scope: 'session'; owner: ConvViewOwnerProps }
```

「轨迹」就是这样成为第二个 Tab 的：

```ts
ctx.slots.register({
  name: 'conversation.view', id: 'trajectory', order: 10,
  label: () => t('view.trajectory'),
}, TrajectoryView)
```

**结论：不用伪造 Tab 外壳。** 本插件再注册一条 `id: 'worktree'`、`order: 20` 即可，
切换、`aria-selected`、`data-conversation-tabs` 的窗口拖拽几何、`showTabs = tabs.length > 1` 全部继承宿主。
Tab 视觉逐值对齐 `ConversationRoot.module.css`：13/16px、字重 500、`gap:36px`、`padding-left:8px`、
2px 下划线圆角 2px 且下沉 1px 压住分隔线，选中色 `--dsw-alias-state-business-primary`。

## 2. 版式

| 区 | 作用 | 关键点 |
| --- | --- | --- |
| **读数带** | 一眼看清仓库身份 | 仓库 / HEAD / 上游 ↑↓ / 未提交 / 工作树 / 近 14 天提交脉搏 / 池目录 |
| **提交图**（左主区） | 节点与连接 | 泳道 20px、行高 42px、贝塞尔分叉与汇入、环形标记 HEAD；右侧固定列：铭牌 → hash → 相对时间 |
| **工作树机架**（右栏 308px） | 实际操作 | 机架卡（槽位号 + LED + 分支铭牌 + 悬停动作）→ 新建表单 → 本地分支 → 远程 |

提交图的行内图形只占 98px 的 `lane` 列，三种段：`v` 直线穿过、`out` 下行贝塞尔（控制点纵向各 13px）、
`in` 上行汇入。节点是 `<circle>` + 3px 页面底色描边（压在轨道上的孔位感），HEAD 外套 15px 半透明环。
泳道配色蓝 / 青 / 紫 / 琥珀循环，取宿主状态色令牌。图区叠 20×42 浅栅格，只从左缘露出、向右渐隐。

## 3. 操作都在哪（这一版重点补的）

你提的两件事，原型里现在都是**可点的**，不再是画的：

### 3.1 删除分支 → 分支行常驻 `⋯` 菜单

每一行本地分支右侧都有 `⋯`（不是只在 hover 时冒出来，触控板/触屏也能点）。菜单四项：

| 项 | 行为 |
| --- | --- |
| 检出到当前会话 | 当前分支时置灰 |
| 在新工作树打开 | 已被某工作树占用时置灰并写明「已在 wt-xxxx 检出」 |
| 复制分支名 | 写剪贴板 |
| **删除分支…** | 进确认块 |

点删除后，确认块**就地插在那一行下面**（不是弹窗），按三种状态分别给下一步：

| 状态 | 呈现 | 主按钮 |
| --- | --- | --- |
| 当前检出的分支 | 红色块，说明不能删，先检出别的 | 「不可删除」置灰 |
| 仍被工作树占用 | 红色块 + 直达按钮「去移除 wt-xxxx」 | 「强制删除 -D」 |
| 有未合并提交 | 琥珀块显示「有 N 个提交还没合并」，需勾选「我确认丢弃这些提交」 | 勾选前置灰 |
| 已全部合并 | 琥珀块说明安全 | 「删除分支」直接可点 |

这一步和宿主 `switchBranch` / `removeWorktree` 现有的措辞保持一致：**先讲清状态，再给下一步**，
而不是丢一个「操作失败」。被占用时的「去移除 wt-xxxx」会滚动到那张工作树卡并把它的移除确认打开——
两个危险操作串成一条顺畅路径，不用用户自己去找。

### 3.2 新建工作树 → 三个退出点

之前确实是死胡同，现在：

- 表单标题栏右侧 `✕`
- 底栏「取消」（点了会轻提示「已取消新建」）
- `Esc` 也退，且 `Esc` 是**分层次**的：菜单 → 确认块 → 新建表单 → 提交详情，一次退一层，不会一口气全关掉
- 底栏两个按钮并列：`取消` / `创建并打开`，主次分明

取消只收起表单，**不动输入内容**——再点「新建」时分支名还在，避免误触后重打一遍。

### 3.3 移除工作树 → 卡内确认

- 干净的工作树：一行说明「目录会被删除，分支 `xxx` 保留」，直接可点
- 有未提交改动：琥珀转红色，必须勾「强制移除（--force）」

### 3.4 键盘与关闭

- 点空白关闭菜单；`Esc` 按上面顺序逐层退
- 菜单在靠下的行会**向上开**，不会被右栏滚动边界裁掉

## 4. 提交图是算出来的，不是画出来的

第一版原型这里**是错的**：那些竖线和弧线是照着行号手写的坐标（`segs: [['v',0,0,21],['out',1,2]]`），
并没有从每个提交的 parent 关系推导。症状就是你看到的——弧线接不到节点、泳道凭空断掉、合并提交只有一条边。

现在改成和 `git log --graph` 同一套算法，实现在 [`client/graph-layout.js`](../client/graph-layout.js)：

> 每一**列** = 一个「还没到达的提交」的等待队列。处理一个提交时：它要么已经在某列里等着
> （那它就从那一列收进节点），要么它是分支尖端（占一列新的空列）。父提交决定线从节点往哪走——
> 已经在别的列等着的父提交，线是**弯过去**；没出现过的，**开一列新的**。

每行只输出四件事，不含任何像素：

| 字段 | 含义 |
| --- | --- |
| `lane` | 节点所在列 |
| `laneTop` | 本节点上方有没有线接进来 |
| `pass` | 只是从这一行穿过去的列 |
| `incoming` | 弯进本节点的列 |
| `outgoing` | `{ lane, kind: 'continue' \| 'branch' \| 'merge' }` |

像素由绘制层决定，与算法解耦——这也是插件既有的分工：Host 报事实，Client 只呈现。

### 校验（`test/graph-layout.mjs`）

拿**真实仓库**跑，不是拿手写的玩具数据：

```
$ node test/graph-layout.mjs E:/repo/deepseek-harness 500
edges      : ok      # 每条父边都有一根线指向父提交所在列
top lines  : ok      # 被当作 parent 的提交，上方必有线；反之不能凭空多线
continuity : ok      # 上一行底部的线，下一行顶部必须接得住
lane range : ok
lanes      : 20 | git ascii width 40 (≈21 lanes) | rows 500 ok
```

最后一行是关键证据：算法算出的泳道数（20）和 **git 自己画的图宽度**（ASCII 前缀 40 列 ≈ 21 泳道）对得上。
另外分页边界也测了：父提交不在本页时，线要一路放到页底交给下一页，而不是凭空消失。

### 顺带修掉的显示问题

- 弯线原来控制点占满整行高度，接得生硬；现在按 1 列宽收紧（`k = min(dy/2, |dx|*1.15)`），弯是「拐」不是「折」
- 所有线在节点边缘留 4–5px 空隙，节点靠 3px 底色描边吃住线头，不再出现线穿过节点
- 面板元信息改成 `16 个提交 · 3 条泳道 · 3 工作树`，直接暴露图的真实规模

## 4. 落地时要补的 Host 能力

现在 `worktree` 命名空间只有 `gitInfo / status / switchBranch / createBranch / createWorktree /
enterWorktree / removeWorktree`。删除分支这一版原型需要有：

1. **`deleteBranch({ sessionId, branch, force })`** —— 现在完全没有。
   建议 Host 侧在删除前先自查三种前置状态并返回结构化结果，而不是把 `git branch -D` 的 stderr 直接抛给 UI：
   `current-branch` / `branch-occupied`（附占用它的 worktree 路径）/ `unmerged`（附未合并提交数）。
   这样原型里的红色/琥珀块就是 Host 事实的直译，不是客户端猜的。
2. **`log({ sessionId, limit, all })`** —— 提交图的数据源。建议 Host 跑
   `git rev-list --parents --date-order`（或 `git log --graph`），**在 Host 里算好泳道分配**再下发
   `{ hash, parents, subject, author, at, refs[] }`，Client 只负责画。保持本插件「Host 报事实 / Client 只呈现」的分工。
3. **`diffStat`（可选）** —— 选中提交时按需取 `--stat`。
4. `removeWorktree` **已支持 `force`**（`index.js` 里校验过 `dirty-worktree` 后带 `--force`），这版原型直接复用，
   不用改 Host。

## 5. 待你拍板

1. **提交图范围**：只画 HEAD 祖先（快、稳），还是全分支 DAG（信息全，大仓库要虚拟滚动 + 分页）？原型画的是后者。
2. **「全部暂存」要不要真做**：现在改动区只读。真能 stage，插件就从「入口」变成半个 Git 客户端。
3. **删除分支的落点**：放分支行 `⋯` 里（本版），还是另做「分支管理」二级页？前者轻，后者能塞批量清理。
4. 非 git 仓库时：显示空态，还是整个 Tab 不出现（与输入框分支入口现有策略一致）？