/**
 * dsh-worktree — browser half (generated; sources in client/ + contract.js).
 *
 * Built by build-client.mjs into the module-loader factory format: the loader
 * evaluates this file in the plugin batch and calls the factory for the cordis
 * client plugin definition.
 *
 * @module dsh-worktree/client
 * @generated
 */
window.__ModuleLoader__.load({
  id: 'dsh-worktree',
  factory(require) {
    /** Baseline runtime imports resolved by the module table. */
    const { useState, useEffect, useCallback, useMemo, useRef } = require('react');
    const { jsx, jsxs, Fragment } = require('react/jsx-runtime');
    const { createPortal } = require('react-dom');

//#region contract.js
/**
 * dsh-worktree — shared Remote contract for the Host and Client halves.
 *
 * One descriptor list is registered twice:
 *  - Host: `ctx.typert.register({ ... invocations: DESCRIPTORS })` makes the
 *    Gateway resolve `worktree/<method>` and dispatch it to the provided
 *    `worktree` Service.
 *  - Client: `ctx.remote.$mount(WORKTREE_REMOTE)` installs
 *    `ctx.remote.worktree.<method>(...)` over the same descriptors.
 *
 * Codecs are hand-written "strict" factories (`create()` returns `{ parse }`),
 * so neither half imports `zod` or any `@deepseek-ai/*` value. Every parameter
 * is one JSON request object (or a string list) plus an optional trailing
 * `signal`, matching the positional method signatures on the Host Service.
 *
 * Wire shapes (all values are lossless JSON):
 *
 *   GitFileState      { path, isRepo, repositoryRoot?, branch?, detached?, head?,
 *                       isWorktree?, worktreePath?, worktreeName?, worktreeBranch? }
 *   GitInfoValue      { items: GitFileState[] }
 *   GitBranch         { name, kind: 'local'|'remote', current?, upstream?,
 *                       occupiedPath?, hasLocal? }
 *   GitWorktree       { path, name, branch?, head?, detached?, isMain?, inPool?,
 *                       dirtyCount? }
 *   GitStatusValue    { sessionId, cwd, isRepo, repositoryRoot?, branch?, detached?,
 *                       head?, upstream?, ahead?, behind?, dirtyCount?, isWorktree?,
 *                       worktreePath?, worktreeName?, worktreeBranch?,
 *                       branches: GitBranch[], worktrees: GitWorktree[], poolPath }
 *   SwitchBranchValue { ok, code?, message?, hint?, branch?, mode?, dirtyCount?,
 *                       occupiedPath?, carried? }
 *   CreateWorktreeValue { ok, code?, message?, hint?, path?, branch?, baseCommit?,
 *                       repositoryRoot?, upstream? }
 *   EnterWorktreeValue  { ok, code?, message?, hint?, cwd? }
 *   RemoveWorktreeValue { ok, code?, message?, hint?, removed?, path? }
 *   LogValue           { ok, sessionId, repositoryRoot, limit, skip, hasMore, total?,
 *                        commits: [{ hash, short, parents, subject, author, at,
 *                                    head, refs: [{ name, kind }] }] }
 *   DeleteBranchValue  { ok, code?, message?, hint?, branch?, trunk?, unmerged?,
 *                        occupiedPath?, mode?, forced? }
 *
 * Failure codes the UI branches on:
 *   not-a-repo, session-unavailable, invalid-name, branch-not-found,
 *   branch-exists, branch-occupied, dirty-tree, switch-conflict, switch-failed,
 *   path-exists, create-failed, remove-failed, dirty-worktree, not-a-directory,
 *   current-branch, unmerged, delete-failed.
 * @module dsh-worktree/contract
 */

/** Package name used by both halves and the bundle patch. */
const PACKAGE = 'dsh-worktree';

/** Cordis service key of the Host half. */
const SERVICE_KEY = 'worktree';

/** Remote namespace both halves exchange. */
const NAMESPACE = 'worktree';

/** Pool directory, relative to the user's home directory. */
const POOL_DIRECTORY_NAME = '.dsh-worktree';

/** Upper bound for one batch path lookup. */
const MAX_PATHS = 64;

/** Build one strict codec factory the Gateway and the Client mount both accept. */
function codec(typeSymbol, parse) {
  return Object.freeze({
    mode: 'strict',
    typeSymbol,
    create: () => ({ parse }),
  });
}

/** Result codec: the Host owns result shape; the Client passes it through. */
function resultCodec(name, description) {
  return Object.freeze({
    mode: 'strict',
    typeSymbol: `${PACKAGE}#${name}`,
    description,
    create: () => ({ parse: (value) => value }),
  });
}

const nonEmptyString = (value, field) => {
  if (typeof value !== 'string' || value.length === 0) throw new Error(`${field} must be a non-empty string`);
  return value;
};

const optionalBoolean = (value, field) => {
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new Error(`${field} must be a boolean`);
  return value;
};

const optionalString = (value, field) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new Error(`${field} must be a string`);
  return value;
};

/** `paths: string[]` for the sidebar batch lookup. */
function parsePaths(value) {
  if (!Array.isArray(value)) throw new Error('paths must be an array');
  if (value.length > MAX_PATHS) throw new Error(`paths accepts at most ${String(MAX_PATHS)} entries`);
  return value.map((entry) => nonEmptyString(entry, 'paths[]'));
}

/** `sessionId: string` for every current-session operation. */
function parseSessionId(value) {
  return nonEmptyString(value, 'sessionId');
}

/** `request: { sessionId, branch, allowDirty? }` — switch the session checkout. */
function parseSwitchRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const allowDirty = optionalBoolean(value.allowDirty, 'request.allowDirty');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    branch: nonEmptyString(value.branch, 'request.branch'),
    ...(allowDirty === undefined ? {} : { allowDirty }),
  };
}

/** `request: { sessionId, name, startPoint?, worktreeId? }` — branch + worktree. */
function parseCreateRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const startPoint = optionalString(value.startPoint, 'request.startPoint');
  const worktreeId = optionalString(value.worktreeId, 'request.worktreeId');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    name: nonEmptyString(value.name, 'request.name'),
    ...(startPoint === undefined || startPoint === null ? {} : { startPoint }),
    ...(worktreeId === undefined || worktreeId === null ? {} : { worktreeId }),
  };
}

/** `request: { sessionId, path }` — move the session into a checkout. */
function parseEnterRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    path: nonEmptyString(value.path, 'request.path'),
  };
}

/** `request: { sessionId, name, startPoint?, allowDirty? }` — branch in place, no worktree. */
function parseBranchRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const startPoint = optionalString(value.startPoint, 'request.startPoint');
  const allowDirty = optionalBoolean(value.allowDirty, 'request.allowDirty');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    name: nonEmptyString(value.name, 'request.name'),
    ...(startPoint === undefined || startPoint === null ? {} : { startPoint }),
    ...(allowDirty === undefined ? {} : { allowDirty }),
  };
}

/** `request: { sessionId, path, force? }` — remove one pool worktree. */
function parseRemoveRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const force = optionalBoolean(value.force, 'request.force');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    path: nonEmptyString(value.path, 'request.path'),
    ...(force === undefined ? {} : { force }),
  };
}

/** `request: { sessionId, limit?, skip? }` — one page of commits for the graph. */
function parseLogRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const readCount = (raw, field) => {
    if (raw === undefined || raw === null) return undefined;
    if (!Number.isSafeInteger(raw)) throw new Error(field + ' must be an integer');
    return raw;
  };
  const limit = readCount(value.limit, 'request.limit');
  const skip = readCount(value.skip, 'request.skip');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    ...(limit === undefined ? {} : { limit }),
    ...(skip === undefined ? {} : { skip }),
  };
}

/** `request: { sessionId, branch, force? }` — delete one local branch. */
function parseDeleteBranchRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const force = optionalBoolean(value.force, 'request.force');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    branch: nonEmptyString(value.branch, 'request.branch'),
    ...(force === undefined ? {} : { force }),
  };
}

/** One direct Remote invocation descriptor. */
function method(name, parameter, result, optionalSignal = true) {
  return Object.freeze({
    id: `${PACKAGE}#${NAMESPACE}/${name}`,
    service: SERVICE_KEY,
    namespace: NAMESPACE,
    method: name,
    invocation: Object.freeze({ kind: 'direct' }),
    parameters: Object.freeze(parameter === undefined ? [] : [parameter]),
    result,
    ...(optionalSignal ? { cancellation: Object.freeze({ parameter: 'signal' }) } : {}),
  });
}

function param(name, parse, description) {
  return Object.freeze({
    name,
    wire: name,
    source: 'json',
    description,
    codec: codec(`${PACKAGE}#${NAMESPACE}/${name}:${name}`, parse),
  });
}

/** Every Remote method the Host Service exports. */
const DESCRIPTORS = Object.freeze([
  method('gitInfo', param('paths', parsePaths, 'checkout paths whose branch and worktree identity are required'),
    resultCodec('GitInfoValue', 'one state per requested path, in request order')),
  method('status', param('sessionId', parseSessionId, 'session whose checkout is inspected'),
    resultCodec('GitStatusValue', 'current checkout, branches, and worktrees of the session repository')),
  method('switchBranch', param('request', parseSwitchRequest, 'session, target branch, and dirty-tree consent'),
    resultCodec('SwitchBranchValue', 'switch outcome or a structured state that needs a user decision')),
  method('createBranch', param('request', parseBranchRequest, 'session, new branch name, start point, and dirty consent'),
    resultCodec('CreateBranchValue', 'branch created and checked out in the current checkout')),
  method('createWorktree', param('request', parseCreateRequest, 'session, new branch name, and optional start point'),
    resultCodec('CreateWorktreeValue', 'created worktree checkout under the pool, or a structured failure')),
  method('enterWorktree', param('request', parseEnterRequest, 'session that should move into an existing checkout'),
    resultCodec('EnterWorktreeValue', 'committed working directory after the move, or a structured failure')),
  method('removeWorktree', param('request', parseRemoveRequest, 'session, pool worktree path, and force consent'),
    resultCodec('RemoveWorktreeValue', 'removal outcome or a structured state that needs a user decision')),
  method('log', param('request', parseLogRequest, 'session, page size, and offset into the date-ordered stream'),
    resultCodec('LogValue', 'one page of commits with parents and refs, plus whether an older page exists')),
  method('deleteBranch', param('request', parseDeleteBranchRequest, 'session, branch, and force consent'),
    resultCodec('DeleteBranchValue', 'deletion outcome or a structured state that needs a user decision')),
]);

/** The Client contribution mounted through `ctx.remote.$mount`. */
const WORKTREE_REMOTE = Object.freeze({
  package: PACKAGE,
  descriptors: DESCRIPTORS,
});

/** Remote endpoint of one method, for diagnostics. */
function endpointOf(name) {
  return `${NAMESPACE}/${name}`;
}
//#endregion

//#region client/locales.js
/**
 * Client dictionaries. Registered under the `worktree` locale namespace; every
 * visible string in the plugin UI routes through `t(key, params)`.
 * @module dsh-worktree/client/locales
 */

const en = {
  'error.notBlank': "This session has already started, so its working directory cannot change. Switch branches in place instead.",
  'create.previewHint': "Branch name as stored: slashes become dashes in the label",
  'create.branchPlaceholder': "New branch name, e.g. feature/login",
  'create.worktreePlaceholder': "Worktree branch name",
  'create.branchAction': "Branch",
  'create.worktreeAction': "Permanent worktree",
  'create.branchTitle': "Create and switch to a new branch",
  'create.worktreeTitle': "Create a permanent worktree",
  'create.branchSubmit': "Create branch",
  'create.worktreeSubmit': "Create worktree",
  'create.submitting': "Creating…",
  'create.branchOk': "Created and switched to {branch}",
  'create.worktreeOk': "Created worktree for {branch} at {path}",
  'confirm.dirtyCreate.title': "Uncommitted changes",
  'confirm.dirtyCreate.body': "This working tree has {n} uncommitted change(s). Branch {branch} keeps them as uncommitted work.",
  'confirm.dirtyCreate.proceed': "Create anyway",
  'trigger.branch': 'Branch',
  'trigger.missing': 'Missing worktree',
  'panel.checkoutMissing': "This session's recorded worktree {path} no longer exists (removed outside the plugin).",
  'trigger.detached': 'Detached',
  'trigger.loading': 'Reading repository…',
  'panel.searchPlaceholder': 'Search branches…',
  'panel.currentSection': 'Working tree',
  'panel.worktreesSection': 'Worktrees',
  'panel.remoteSection': 'Remote branches',
  'panel.noMatches': 'No matching branch',
  'panel.poolHint': 'Pool: {path}',
  'panel.repoRoot': 'Repository: {path}',
  'panel.sessionPending': 'Session is still starting; branch state loads in a moment.',
  'panel.notRepo': 'This session directory is not a Git repository. Open a session inside a repository to switch branches.',
  'panel.noWorktrees': 'No worktrees yet. Create a branch below to start a parallel task.',
  'status.clean': 'Working tree clean',
  'status.dirty': '{n} uncommitted change(s)',
  'status.detached': 'Detached HEAD',
  'status.aheadBehind': 'ahead {ahead}, behind {behind}',
  'status.upstream': 'Tracks {upstream}',
  'status.noUpstream': 'No upstream branch',
  'status.worktreeOf': 'Worktree of {branch}',
  'row.current': 'Current',
  'row.here': 'here',
  'row.hasLocal': 'Local branch exists',
  'row.openSession': 'Open session in this worktree',
  'row.remove': 'Remove this worktree',
  'create.namePlaceholder': 'Branch name, e.g. feature/login',
  'create.from': 'Start from',
  'create.fromHead': 'Current HEAD',
  'create.submit': 'Create',
  'create.creating': 'Creating…',
  'create.ok': 'Created {branch} at {path}',
  'action.switching': 'Switching…',
  'action.opening': 'Opening…',
  'action.removing': 'Removing…',
  'confirm.dirty.title': 'Uncommitted changes',
  'confirm.dirty.body': 'This working tree has {n} uncommitted change(s). Switching carries them to the new branch; Git refuses when they conflict.',
  'confirm.dirty.proceed': 'Switch anyway',
  'confirm.dirty.worktree': 'Create worktree instead',
  'confirm.occupied.title': 'Cannot switch to this branch',
  'confirm.occupied.body': 'Branch {branch} already belongs to worktree {name}; one branch cannot live in two worktrees at once.',
  'confirm.occupied.open': 'Go to that worktree',
  'confirm.remove.title': 'Remove worktree',
  'confirm.remove.body': 'Remove {name}? Uncommitted changes in it are lost.',
  'confirm.remove.proceed': 'Remove',
  'error.switchFailed': 'Switch failed',
  'error.createFailed': 'Creation failed',
  'error.removeFailed': 'Removal failed',
  'error.retry': 'Retry',
  'error.cancel': 'Cancel',
  'error.notFound': 'Branch does not exist.',
  'error.nameInvalid': 'Not a usable branch name.',
  'error.branchExists': 'Branch already exists.',
  'error.pathExists': 'The worktree directory already exists.',
  'error.conflict': 'Uncommitted changes conflict with the target branch. Commit or stash them first, or create a worktree.',
  'error.sessionUnavailable': 'Open this session first, then switch branches.',
  'error.unexpected': 'Something went wrong.',
  'hint.switchDone': 'Now on {branch}',
  'hint.trackingCreated': 'Created local branch {branch} tracking {upstream}',
  'hint.sessionOpened': 'Opened a session in {name}',
  'hint.removed': 'Removed {name}',
  'header.worktree': '{branch} · worktree {name}',
  'header.branch': 'Branch {branch}',
  'sidebar.worktreeTitle': 'worktree {name} · branch {branch}',
  'sidebar.branchTitle': 'branch {branch}',
  'sidebar.dirty': '{n} uncommitted',
  'sidebar.worktreeLine': 'Worktree {name} · {branch}',
  'view.worktree': 'Worktrees',
  'tab.repo': 'Repository',
  'tab.upstream': 'Upstream',
  'tab.dirty': 'Uncommitted',
  'tab.worktrees': 'Worktrees',
  'tab.pool': 'Pool',
  'tab.graph': 'Commits',
  'tab.commits': '{n} commits',
  'tab.lanes': '{n} lanes',
  'tab.refresh': 'Refresh',
  'tab.graphEmpty': 'No commits yet.',
  'tab.detached': 'detached',
  'tab.statusCount': '{wt} worktrees / {br} local branches',
  'tab.hint': 'Up/Down select · Esc closes layers',
  'tab.removeWt.body': 'The checkout directory is deleted; branch {branch} is kept.',
  'tab.delete.title': 'Delete branch {branch}?',
  'tab.delete.current': 'This branch is checked out in the current working tree. Switch to another branch first.',
  'tab.delete.occupied': 'This branch is checked out in worktree {path}. Remove that worktree first.',
  'tab.delete.gotoWt': 'Remove that worktree',
  'tab.delete.unmerged': '{n} commit(s) not merged into {trunk}. Deleting discards them; the reflog is the only way back.',
  'tab.delete.upstream': 'its upstream',
  'tab.delete.forceCheck': 'I understand — force delete (-D)',
  'tab.delete.force': 'Force delete',
  'tab.delete.done': 'Deleted {branch}',
  'detail.author': 'Author',
  'detail.parents': '{n} parent(s)',
  'rack.title': 'Worktrees',
  'rack.poolCount': '{n} in pool',
  'rack.main': 'main checkout',
  'rack.clean': 'clean',
  'rack.dirtyN': '{n} changed',
  'rack.enter': 'Open session',
  'rack.remove': 'Remove',
  'rack.create': '+ New worktree',
  'branches.local': 'Local branches',
  'branch.current': 'current',
  'branch.checkout': 'Check out in this session',
  'branch.makeWorktree': 'Open in a new worktree',
  'branch.copy': 'Copy branch name',
  'branch.delete': 'Delete branch…',
  'branch.copied': 'Copied {name}',
  'branch.more': 'Branch actions',
};

const zh = {
  'error.notBlank': "该会话已有工作记录，工作目录不能更改。请就地切换分支。",
  'create.previewHint': "分支名中的斜杠在显示时转为短横线",
  'create.branchPlaceholder': "新分支名，例如 feature/login",
  'create.worktreePlaceholder': "工作树分支名",
  'create.branchAction': "分支",
  'create.worktreeAction': "永久工作树",
  'create.branchTitle': "创建并切换到新分支",
  'create.worktreeTitle': "创建永久工作树",
  'create.branchSubmit': "创建分支",
  'create.worktreeSubmit': "创建工作树",
  'create.submitting': "创建中…",
  'create.branchOk': "已创建并切换到分支 {branch}",
  'create.worktreeOk': "已为 {branch} 创建永久工作树：{path}",
  'confirm.dirtyCreate.title': "存在未提交更改",
  'confirm.dirtyCreate.body': "当前工作区有 {n} 个未提交更改。分支 {branch} 会把这些更改作为未提交内容保留。",
  'confirm.dirtyCreate.proceed': "仍然创建",
  'trigger.branch': '分支',
  'trigger.missing': '工作树缺失',
  'panel.checkoutMissing': '该会话记录的工作树 {path} 已不存在（在插件之外被移除）。',
  'trigger.detached': '分离头指针',
  'trigger.loading': '正在读取仓库…',
  'panel.searchPlaceholder': '搜索分支…',
  'panel.currentSection': '本地文件状态',
  'panel.worktreesSection': 'Worktree',
  'panel.remoteSection': '远程分支',
  'panel.noMatches': '没有匹配的分支',
  'panel.poolHint': '统一目录：{path}',
  'panel.repoRoot': '仓库：{path}',
  'panel.sessionPending': '会话正在启动，稍候将自动读取分支状态。',
  'panel.notRepo': '当前会话目录不是 Git 仓库。请在仓库内打开会话后再切换分支。',
  'panel.noWorktrees': '还没有 worktree。在下方创建分支即可开始一个并行任务。',
  'status.clean': '工作区干净',
  'status.dirty': '{n} 个未提交更改',
  'status.detached': '分离头指针（detached）',
  'status.aheadBehind': '领先 {ahead}，落后 {behind}',
  'status.upstream': '跟踪 {upstream}',
  'status.noUpstream': '未设置上游分支',
  'status.worktreeOf': '分支 {branch} 的 worktree',
  'row.current': '当前',
  'row.here': '当前',
  'row.hasLocal': '已有对应本地分支',
  'row.openSession': '在此 worktree 中打开会话',
  'row.remove': '移除此 worktree',
  'create.namePlaceholder': '分支名，例如 feature/login',
  'create.from': '起点',
  'create.fromHead': '当前 HEAD',
  'create.submit': '创建',
  'create.creating': '创建中…',
  'create.ok': '已创建 {branch}，位于 {path}',
  'action.switching': '切换中…',
  'action.opening': '打开中…',
  'action.removing': '移除中…',
  'confirm.dirty.title': '存在未提交更改',
  'confirm.dirty.body': '当前工作区有 {n} 个未提交更改。切换分支会把这些更改带到目标分支；如有冲突 Git 会拒绝切换。',
  'confirm.dirty.proceed': '仍要切换',
  'confirm.dirty.worktree': '改为创建 worktree',
  'confirm.occupied.title': '无法切换到该分支',
  'confirm.occupied.body': '分支 {branch} 已属于工作树 {name}，一个分支不能同时出现在两个工作树里。',
  'confirm.occupied.open': '去那个工作树',
  'confirm.remove.title': '移除 worktree',
  'confirm.remove.body': '移除 {name}？其中未提交的更改会一并丢失。',
  'confirm.remove.proceed': '移除',
  'error.switchFailed': '切换失败',
  'error.createFailed': '创建失败',
  'error.removeFailed': '移除失败',
  'error.retry': '重试',
  'error.cancel': '取消',
  'error.notFound': '分支不存在。',
  'error.nameInvalid': '不是可用的分支名。',
  'error.branchExists': '分支已存在。',
  'error.pathExists': 'worktree 目录已存在。',
  'error.conflict': '未提交更改与目标分支冲突。请先提交或暂存，或改为创建 worktree。',
  'error.sessionUnavailable': '请先打开该会话，再切换分支。',
  'error.unexpected': '发生未知错误。',
  'hint.switchDone': '已切换到 {branch}',
  'hint.trackingCreated': '已创建本地分支 {branch}，跟踪 {upstream}',
  'hint.sessionOpened': '已在 {name} 中打开会话',
  'hint.removed': '已移除 {name}',
  'header.worktree': '{branch} · worktree {name}',
  'header.branch': '分支 {branch}',
  'sidebar.worktreeTitle': 'worktree {name} · 分支 {branch}',
  'sidebar.branchTitle': '分支 {branch}',
  'sidebar.dirty': '{n} 个未提交',
  'sidebar.worktreeLine': 'Worktree {name} · {branch}',
  'view.worktree': '工作树',
  'tab.repo': '仓库',
  'tab.upstream': '上游',
  'tab.dirty': '未提交',
  'tab.worktrees': '工作树',
  'tab.pool': '池目录',
  'tab.graph': '提交图',
  'tab.commits': '{n} 个提交',
  'tab.lanes': '{n} 条泳道',
  'tab.refresh': '刷新',
  'tab.graphEmpty': '还没有提交。',
  'tab.detached': '分离头指针',
  'tab.statusCount': '{wt} 个工作树 / {br} 个本地分支',
  'tab.hint': '↑↓ 选择 · Esc 逐层退出',
  'tab.removeWt.body': '工作树目录会被删除，分支 {branch} 保留。',
  'tab.delete.title': '删除分支 {branch}？',
  'tab.delete.current': '该分支正被当前工作区检出。请先切换到其它分支。',
  'tab.delete.occupied': '该分支在 {path} 中检出。请先移除那个工作树。',
  'tab.delete.gotoWt': '去移除工作树',
  'tab.delete.unmerged': '有 {n} 个提交尚未合并进 {trunk}。删除会丢弃它们，只能靠 reflog 找回。',
  'tab.delete.upstream': '其上游',
  'tab.delete.forceCheck': '我确认丢弃这些提交（-D）',
  'tab.delete.force': '强制删除',
  'tab.delete.done': '已删除 {branch}',
  'detail.author': '作者',
  'detail.parents': '{n} 个父提交',
  'rack.title': '工作树机架',
  'rack.poolCount': '{n} 池内',
  'rack.main': '主检出',
  'rack.clean': '干净',
  'rack.dirtyN': '{n} 处改动',
  'rack.enter': '进入会话',
  'rack.remove': '移除',
  'rack.create': '＋ 新建工作树',
  'branches.local': '本地分支',
  'branch.current': '当前',
  'branch.checkout': '在当前会话检出',
  'branch.makeWorktree': '在新工作树中打开',
  'branch.copy': '复制分支名',
  'branch.delete': '删除分支…',
  'branch.copied': '已复制 {name}',
  'branch.more': '分支操作',
};
//#endregion

//#region client/styles.js
/**
 * Plugin-owned stylesheet. Inserted once per client run as a scoped
 * `<style data-plugin="dsh-worktree">` tag and removed with it.
 *
 * Aesthetic direction — "instrument panel": a compact developer tool that reads
 * like a piece of measuring equipment. Monospaced section labels and branch
 * names give the surface a mechanical, scannable rhythm; the current branch is
 * the single loud element (brand-tinted row + check), everything else is
 * quiet. Depth comes from a hairline border plus a two-layer shadow rather
 * than heavy translucency, so the panel stays legible over the conversation.
 *
 * Opacity policy: opaque surface first (`--dsw-alias-bg-layer-2`), never a bare
 * translucent overlay. Hover fills are stronger than the host's faint wash
 * because a 5% black wash is invisible on the dark composer area.
 *
 * Density policy: 4/6/8px rhythm, 32px rows, no decorative gaps.
 * Motion policy: one strong ease-out token and two durations (120ms for colour
 * hovers and exits, 160ms for entrances and presses) cover every transition.
 * All motion animates transform/opacity only; every anchored surface emerges
 * from its trigger (below-trigger surfaces drop in from -Y, the composer
 * picker above the composer rises from +Y), exits retrace its entrance, and
 * prefers-reduced-motion keeps the fades while dropping the movement.
 * @module dsh-worktree/client/styles
 */

const CSS = `
/* Motion tokens (plugin-scoped; the host exposes no motion aliases): one
   strong ease-out for every entrance, exit and state change; 120ms for colour
   hovers and exits, 160ms for entrances and presses. Every rule below animates
   transform/opacity only — nothing animates layout. */
:root{--dswt-ease-out:cubic-bezier(.23,1,.32,1);--dswt-dur-fast:120ms;--dswt-dur-open:160ms}
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}
@keyframes dsh-wt-pulse{50%{opacity:.4}}

@keyframes dsh-wt-enter{from{opacity:0;transform:translateY(4px) scale(.985)}to{opacity:1;transform:none}}
@keyframes dsh-wt-fade-in{from{opacity:0}}
@keyframes dsh-wt-row-in{from{opacity:0;transform:translateX(-3px)}to{opacity:1;transform:none}}
@keyframes dsh-wt-menu-in{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
@keyframes dsh-wt-menu-in-up{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}

/* ---- composer toolbar trigger ---- */
/* Keeps the toolbar's width stable while the first repository lookup runs, so the
   row does not jump once the trigger is either drawn or dropped. */
.dsh-wt-trigger-placeholder{display:inline-block;width:0;height:28px;flex:none}
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 5px 0 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:190px;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:active:not(:disabled){transform:scale(.97)}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;opacity:.9}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;opacity:.65}
.dsh-wt-trigger[data-variant="worktree"]{color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:352px;max-width:calc(100vw - 16px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-overlay,Canvas));border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.28),0 14px 34px -8px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.045);display:flex;flex-direction:column;height:min(260px,calc(100vh - 88px));overflow:hidden;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;opacity:0;transform:translateY(4px) scale(.985);transform-origin:center bottom;transition:opacity var(--dswt-dur-open) var(--dswt-ease-out),transform var(--dswt-dur-open) var(--dswt-ease-out)}
/* Open/close is a transition driven by data-open (panel.js keeps the portal
   mounted through the exit), so an interrupted close resumes from the panel's
   current on-screen values instead of restarting from the entrance pose. The
   exit is faster than the entrance, the closed state never takes pointers, and
   data-side flips the offset: below the composer the panel drops in from -Y. */
.dsh-wt-panel[data-side="below"]{transform:translateY(-4px) scale(.985);transform-origin:center top}
.dsh-wt-panel[data-open="true"]{opacity:1;transform:none}
.dsh-wt-panel[data-open="false"]{pointer-events:none;transition-duration:var(--dswt-dur-fast)}
.dsh-wt-panel-search{display:flex;align-items:center;gap:7px;padding:8px 11px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));flex:none}
.dsh-wt-panel-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;letter-spacing:-.01em;outline:none}
.dsh-wt-panel-search input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel-body{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:4px 0;min-height:0;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,color-mix(in srgb,CanvasText 22%,Canvas)) transparent}
.dsh-wt-panel-body::-webkit-scrollbar{width:9px}
.dsh-wt-panel-body::-webkit-scrollbar-track{background:transparent}
.dsh-wt-panel-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,color-mix(in srgb,CanvasText 22%,Canvas));border-radius:5px;border:2px solid transparent;background-clip:padding-box}
.dsh-wt-panel-body::-webkit-scrollbar-thumb:hover{background:var(--dsw-alias-label-dimmed,color-mix(in srgb,CanvasText 34%,Canvas));background-clip:padding-box}

/* section label: instrument-panel caption */
.dsh-wt-panel .dsh-wt-section{margin:2px 0 0}
.dsh-wt-panel .dsh-wt-section:first-child{margin-top:0}
.dsh-wt-panel .dsh-wt-section-title{display:flex;align-items:center;gap:6px;padding:7px 11px 4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;font-weight:600;letter-spacing:.09em;text-transform:uppercase;user-select:none;line-height:14px}
.dsh-wt-panel .dsh-wt-section-title::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--dsw-alias-border-l1),transparent)}
.dsh-wt-panel .dsh-wt-section-title .dsh-wt-section-extra{margin-left:0;font-family:inherit;font-weight:400;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;font-size:10px;opacity:.75}

/* branch rows: icon colour only; the label keeps full contrast; a worktree-held branch keeps its worktree mark, every row means switch */
.dsh-wt-panel .dsh-wt-row-icon[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}

/* rows */
.dsh-wt-panel .dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 11px;margin:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:left;cursor:pointer;border-radius:0;animation:dsh-wt-row-in var(--dswt-dur-open) var(--dswt-ease-out) both}
.dsh-wt-panel .dsh-wt-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}
.dsh-wt-panel .dsh-wt-row:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-row:disabled{cursor:default;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel .dsh-wt-row[aria-disabled="true"]{cursor:default;color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-row[data-current="true"]{color:var(--dsw-alias-label-primary);background:transparent;box-shadow:none;cursor:default}
.dsh-wt-panel .dsh-wt-row[data-current="true"]:hover{background:transparent}
.dsh-wt-panel .dsh-wt-row .dsh-wt-row-icon{display:inline-flex;flex:none;opacity:.78}
.dsh-wt-panel .dsh-wt-row[data-current="true"] .dsh-wt-row-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-panel .dsh-wt-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dsh-wt-panel .dsh-wt-row-title{display:flex;align-items:center;gap:6px;min-width:0;line-height:17px}
.dsh-wt-panel .dsh-wt-row-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500;letter-spacing:-.005em}
.dsh-wt-panel .dsh-wt-row-sub{color:var(--dsw-alias-label-secondary);font-size:11px;line-height:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-variant-numeric:tabular-nums}
.dsh-wt-panel .dsh-wt-row-sub[data-tone="warn"]{color:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 72%,var(--dsw-alias-label-primary,#0f1115))}
.dsh-wt-panel .dsh-wt-row-check{display:inline-flex;flex:none;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-row-here{flex:none;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase}
.dsh-wt-panel .dsh-wt-badge{flex:none;display:inline-flex;align-items:center;height:15px;padding:0 5px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;font-weight:600;line-height:15px;letter-spacing:.04em;background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.09));color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-panel .dsh-wt-badge[data-tone="brand"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}

/* empty / notice */
.dsh-wt-panel .dsh-wt-note{padding:9px 11px;margin:4px 8px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 4%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;border:1px solid var(--dsw-alias-border-l1)}

/* footer: two atomic actions */
.dsh-wt-footer{border-top:1px solid var(--dsw-alias-border-l1);padding:3px;flex:none;background:color-mix(in srgb,var(--dsw-alias-label-primary,#fff) 2.5%,transparent)}
.dsh-wt-panel .dsh-wt-create-rows{display:flex;gap:4px}
.dsh-wt-panel .dsh-wt-create-toggle{display:flex;align-items:center;justify-content:center;gap:5px;flex:1;min-width:0;padding:5px 8px;border:1px solid transparent;background:transparent;border-radius:7px;color:var(--dsw-alias-label-secondary);font-size:12.5px;font-weight:500;line-height:17px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,border-color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-create-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled){transform:scale(.97)}
.dsh-wt-panel .dsh-wt-create-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-create-toggle:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
/* create form: one compact row — name, start point, submit */
.dsh-wt-panel .dsh-wt-create-form{display:flex;align-items:center;gap:5px;padding:5px 6px 4px;animation:dsh-wt-enter var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-create-form input[type=text]{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;outline:none;transition:border-color var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-panel .dsh-wt-create-form input[type=text]::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel .dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d8dff) 18%,transparent)}
.dsh-wt-panel .dsh-wt-create-form select{flex:none;width:96px;height:28px;padding:0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-create-form select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-form .dsh-wt-button{flex:none;height:28px;padding:0 10px}
.dsh-wt-panel .dsh-wt-button{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border:none;border-radius:6px;font-size:12.5px;font-weight:500;line-height:18px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,filter var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:scale(.97)}
.dsh-wt-panel .dsh-wt-button:disabled{cursor:default;opacity:.5}
.dsh-wt-panel .dsh-wt-button:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.3)}
.dsh-wt-panel .dsh-wt-button[data-variant="primary"]:hover:not(:disabled){filter:brightness(1.1)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]{background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-wt-panel .dsh-wt-button[data-variant="plain"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]{background:transparent;color:var(--dsw-alias-state-error-primary)}
.dsh-wt-panel .dsh-wt-button[data-variant="danger"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07))}

/* inline confirm / error / toast */
.dsh-wt-panel .dsh-wt-confirm{margin:6px 8px 2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 55%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-warn-primary,#b45309) 9%,transparent);display:flex;flex-direction:column;gap:6px}
.dsh-wt-panel .dsh-wt-confirm-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-warn-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-confirm-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-confirm-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}
.dsh-wt-panel .dsh-wt-error{margin:6px 8px 2px;padding:8px 10px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 55%,transparent);border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary,#e5484d) 9%,transparent);display:flex;flex-direction:column;gap:6px}
.dsh-wt-panel .dsh-wt-error-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-error-primary);font-weight:600;font-size:12px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body{color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-panel .dsh-wt-error-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;white-space:pre-wrap;word-break:break-all;max-height:60px;overflow-y:auto}
.dsh-wt-panel .dsh-wt-toast{margin:6px 8px 2px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 40%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;display:flex;align-items:center;gap:6px;animation:dsh-wt-fade-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-panel .dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:10.5px}


/* ---- 工作树 Tab（conversation.view）-------------------------------------
   版式：读数带 / 提交图 | 机架 / 状态行。所有颜色走宿主令牌；泳道用四条
   语义色循环（business/success/warn/混合紫），随主题自动翻转。 */
.dsh-wt-tab{display:flex;flex-direction:column;height:100%;min-height:0;overflow:hidden;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px}
.dsh-wt-tab-center{align-items:center;justify-content:center;gap:10px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-empty{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:12.5px;padding:28px 20px;text-align:center;max-width:460px;line-height:1.7}

/* 读数带 */
.dsh-wt-readout{flex:none;display:flex;align-items:stretch;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-ro{padding:8px 16px 9px;border-right:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;gap:2px;justify-content:center;min-width:0}
.dsh-wt-ro-cap{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9px;letter-spacing:.13em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));text-transform:uppercase;white-space:nowrap}
.dsh-wt-ro-val{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.01em}
.dsh-wt-ro-val[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-ro-grow{flex:1;border-right:none;align-items:flex-end}
.dsh-wt-ro-grow .dsh-wt-ro-val{color:var(--dsw-alias-label-tertiary);font-size:11px}

/* 主舞台 */
.dsh-wt-stage{flex:1;min-height:0;display:flex}
.dsh-wt-pane{flex:1;min-width:0;display:flex;flex-direction:column;overflow:hidden}
.dsh-wt-pane-head{flex:none;height:38px;display:flex;align-items:center;gap:8px;padding:0 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-pane-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-pane-meta{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));display:flex}
.dsh-wt-pane-meta span+span::before{content:"·";margin:0 8px;color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1))}
.dsh-wt-grow{flex:1}

/* 提交图 */
.dsh-wt-graph{position:relative;flex:1;min-height:0;overflow-y:auto;padding:6px 16px 10px 6px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1)) transparent;background-image:repeating-linear-gradient(90deg,color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent) 0 1px,transparent 1px 20px)}
.dsh-wt-graph::-webkit-scrollbar{width:9px}
.dsh-wt-graph::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:5px;border:2px solid transparent;background-clip:padding-box}
.dsh-wt-graph-empty{display:flex;align-items:flex-start}
.dsh-wt-crow{position:relative;display:flex;align-items:center;height:42px;border-radius:6px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-crow:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 4%,transparent)}
.dsh-wt-crow-sel{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 10%,transparent);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}
.dsh-wt-crow-lane{flex:none;position:relative;height:42px}
.dsh-wt-crow-lane svg{position:absolute;inset:0;overflow:visible}
.dsh-wt-ln{stroke-width:1.5;stroke-opacity:.85}
.dsh-wt-lane-0{stroke:var(--dsw-alias-state-business-primary);color:var(--dsw-alias-state-business-primary)}
.dsh-wt-lane-1{stroke:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.dsh-wt-lane-2{stroke:var(--dsw-alias-state-warn-primary);color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-lane-3{stroke:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary));color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary))}
.dsh-wt-node{fill:currentColor;stroke:var(--dsw-alias-bg-base);stroke-width:3px}
.dsh-wt-node-ring{position:absolute;top:21px;width:15px;height:15px;border:1px solid currentColor;border-radius:50%;opacity:.3;transform:translate(-50%,-50%)}
.dsh-wt-node-ring[data-lane="0"]{color:var(--dsw-alias-state-business-primary)}
.dsh-wt-node-ring[data-lane="1"]{color:var(--dsw-alias-state-success-primary)}
.dsh-wt-node-ring[data-lane="2"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-node-ring[data-lane="3"]{color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 50%,var(--dsw-alias-state-error-primary))}
.dsh-wt-topic{display:flex;align-items:center;gap:8px;min-width:0;flex:1;padding-right:12px}
.dsh-wt-subj{font-size:12.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;letter-spacing:-.005em;transition:color var(--dswt-dur-fast) ease}
.dsh-wt-crow-sel .dsh-wt-subj{color:var(--dsw-alias-label-primary)}
.dsh-wt-ref{flex:none;display:inline-flex;align-items:center;height:17px;padding:0 6px;border-radius:4px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;white-space:nowrap;color:var(--dsw-alias-label-tertiary);border:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-ref[data-kind=head]{color:var(--dsw-alias-state-business-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 12%,transparent)}
.dsh-wt-ref[data-kind=tag]{color:var(--dsw-alias-state-warn-primary);border-color:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 32%,transparent)}
.dsh-wt-ref[data-kind=remote]{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-hash{flex:none;width:66px;text-align:right;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-variant-numeric:tabular-nums}
.dsh-wt-when{flex:none;width:92px;text-align:right;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-variant-numeric:tabular-nums}

/* 提交详情抽屉 */
.dsh-wt-detail{flex:none;border-top:1px solid var(--dsw-alias-border-l1);padding:9px 16px 11px;background:color-mix(in srgb,var(--dsw-alias-label-primary) 2%,transparent);animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-detail-head{display:flex;align-items:center;gap:8px}
.dsh-wt-detail-hash{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-state-business-primary);padding:1px 6px;border-radius:4px;background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 12%,transparent)}
.dsh-wt-detail-subj{font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-wt-detail-meta{display:flex;gap:16px;margin-top:6px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}

/* 机架（右栏） */
.dsh-wt-rail{width:308px;flex:none;border-left:1px solid var(--dsw-alias-border-l1);display:flex;flex-direction:column;min-height:0;background:var(--dsw-alias-bg-layer-1,var(--dsw-alias-bg-base))}
.dsh-wt-rail-head{flex:none;height:38px;display:flex;align-items:center;gap:8px;padding:0 12px 0 14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-rail-body{flex:1;overflow-y:auto;padding:2px 0 10px;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1)) transparent}
.dsh-wt-rail-body::-webkit-scrollbar{width:9px}
.dsh-wt-rail-body::-webkit-scrollbar-thumb{background:var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:5px;border:2px solid transparent;background-clip:padding-box}

.dsh-wt-card{position:relative;margin:4px 8px;padding:9px 10px;border-radius:8px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1)}
.dsh-wt-card-here{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 40%,transparent);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}
.dsh-wt-card-top{display:flex;align-items:center;gap:7px;min-width:0}
.dsh-wt-led{width:6px;height:6px;border-radius:50%;flex:none}
.dsh-wt-led[data-tone=ok]{background:var(--dsw-alias-state-success-primary);box-shadow:0 0 0 2.5px color-mix(in srgb,var(--dsw-alias-state-success-primary) 15%,transparent)}
.dsh-wt-led[data-tone=dirty]{background:var(--dsw-alias-state-warn-primary);box-shadow:0 0 0 2.5px color-mix(in srgb,var(--dsw-alias-state-warn-primary) 15%,transparent)}
.dsh-wt-card-name{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12px;letter-spacing:-.01em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-wt-card-tag{margin-left:auto;flex:none;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.04em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));text-transform:uppercase}
.dsh-wt-card-branch{margin-left:auto;flex:none;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10.5px;color:var(--dsw-alias-state-business-primary)}
.dsh-wt-card-sub{display:flex;align-items:center;gap:8px;margin-top:3px;padding-left:13px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-pin{color:var(--dsw-alias-state-business-primary)}
.dsh-wt-card-path{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-card-dirty[data-tone=warn]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-card-acts{display:flex;gap:4px;margin-top:7px;padding-left:13px}

.dsh-wt-mini{height:21px;padding:0 8px;border-radius:5px;border:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,border-color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-mini:active:not(:disabled){transform:scale(.97)}
.dsh-wt-mini:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-mini:disabled{opacity:.5;cursor:default}
.dsh-wt-mini-pri{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 15%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 32%,transparent);color:var(--dsw-alias-state-business-primary)}
.dsh-wt-mini-pri:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 24%,transparent)}
.dsh-wt-mini-danger{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-mini-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 38%,transparent)}

/* 分支区 */
.dsh-wt-sec{display:flex;align-items:center;gap:7px;padding:12px 14px 4px}
.dsh-wt-sec-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-sec-n{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-branch-wrap{position:relative}
.dsh-wt-br{position:relative;display:flex;align-items:center;gap:7px;margin:1px 8px;padding:5px 8px;border-radius:6px;font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;color:var(--dsw-alias-label-secondary);transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-br:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 5%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-br-icon{display:inline-flex;flex:none;opacity:.65;color:var(--dsw-alias-state-business-primary)}
.dsh-wt-br-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-br-cur .dsh-wt-br-name{color:var(--dsw-alias-label-primary);font-weight:600}
.dsh-wt-br-cur .dsh-wt-br-icon{opacity:1}
.dsh-wt-br-side{margin-left:auto;display:flex;gap:6px;align-items:center;font-size:9.5px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-badge{font-size:9px;padding:1px 4px;border-radius:3px;color:var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 14%,transparent)}
.dsh-wt-badge[data-tone=wt]{color:var(--dsw-alias-label-tertiary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent)}
.dsh-wt-more{flex:none;display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:13px;line-height:1;cursor:pointer;opacity:.55;transition:opacity var(--dswt-dur-fast) ease,background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-more:active{transform:scale(.97)}
.dsh-wt-br:hover .dsh-wt-more,.dsh-wt-more[aria-expanded=true]{opacity:1;color:var(--dsw-alias-label-secondary);background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent)}
.dsh-wt-br-open{background:color-mix(in srgb,var(--dsw-alias-label-primary) 6%,transparent);color:var(--dsw-alias-label-primary)}

/* 弹出菜单 */
.dsh-wt-menu{position:absolute;right:6px;top:calc(100% + 2px);z-index:30;min-width:196px;padding:4px;border-radius:9px;background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));border:1px solid var(--dsw-alias-border-l1);box-shadow:0 2px 4px rgba(0,0,0,.3),0 14px 30px -10px rgba(0,0,0,.6);animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
/* An upward-flipped menu rises from below its trigger, mirroring the default. */
.dsh-wt-menu-up{top:auto;bottom:calc(100% + 2px);animation-name:dsh-wt-menu-in-up}
.dsh-wt-menu-item{display:flex;align-items:center;gap:8px;width:100%;height:26px;padding:0 8px;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-family:inherit;text-align:left;cursor:pointer;white-space:nowrap;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-menu-item:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-menu-item:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-border-l2));cursor:default}
.dsh-wt-menu-danger{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-menu-danger:hover:not(:disabled){background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 14%,transparent);color:var(--dsw-alias-state-error-primary)}
.dsh-wt-menu-sep{height:1px;border:none;margin:4px 6px;background:var(--dsw-alias-border-l1)}

/* 状态化确认块（删除分支 / 移除工作树 / 脏切换） */
.dsh-wt-cf{position:relative;z-index:2;margin:3px 8px 5px;padding:8px 9px;border-radius:8px;border:1px solid color-mix(in srgb,var(--dsw-alias-state-warn-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-warn-primary) 8%,transparent);display:flex;flex-direction:column;gap:6px;animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-cf[data-tone=error]{border-color:color-mix(in srgb,var(--dsw-alias-state-error-primary) 45%,transparent);background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 8%,transparent)}
.dsh-wt-cf-title{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;line-height:16px;color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-cf[data-tone=error] .dsh-wt-cf-title{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-cf-body{font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-cf-acts{display:flex;align-items:center;gap:5px;flex-wrap:wrap;justify-content:flex-end;margin-top:1px}
.dsh-wt-cf-check{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--dsw-alias-label-secondary);cursor:pointer;margin-right:auto}
.dsh-wt-cf-check input{accent-color:var(--dsw-alias-state-error-primary);margin:0;width:12px;height:12px}

/* 新建表单（三个退出点：✕ / 取消 / Esc） */
.dsh-wt-create{margin:6px 8px 2px;padding:9px;border-radius:8px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-layer-1));display:flex;flex-direction:column;gap:6px;animation:dsh-wt-menu-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-create-head{display:flex;align-items:center;gap:6px}
.dsh-wt-create-title{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.11em;text-transform:uppercase;color:var(--dsw-alias-label-tertiary)}
.dsh-wt-create-x{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-left:auto;border:none;border-radius:4px;background:transparent;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:12px;line-height:1;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease,transform var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-create-x:active{transform:scale(.97)}
.dsh-wt-create-x:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-primary)}
.dsh-wt-create-row{display:flex;gap:5px;align-items:center}
.dsh-wt-create input,.dsh-wt-create select{flex:1;min-width:0;height:26px;padding:0 7px;border-radius:5px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;outline:none;transition:border-color var(--dswt-dur-fast) ease,box-shadow var(--dswt-dur-fast) ease}
.dsh-wt-create input:focus,.dsh-wt-create select:focus{border-color:color-mix(in srgb,var(--dsw-alias-state-business-primary) 60%,transparent);box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary) 16%,transparent)}
.dsh-wt-create-foot{display:flex;align-items:center;gap:5px;margin-top:1px}
.dsh-wt-create-hint{font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:10px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}
.dsh-wt-create-toggle{margin:4px 8px;height:32px;border:1px dashed var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;cursor:pointer;transition:background var(--dswt-dur-fast) ease,color var(--dswt-dur-fast) ease}
.dsh-wt-create-toggle:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 3%,transparent);color:var(--dsw-alias-label-primary)}

/* 状态行 */
.dsh-wt-tabbar{flex:none;height:27px;display:flex;align-items:center;gap:12px;padding:0 16px;border-top:1px solid var(--dsw-alias-border-l1);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:9.5px;letter-spacing:.05em;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-tabbar-note{max-width:50%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;animation:dsh-wt-fade-in var(--dswt-dur-open) var(--dswt-ease-out)}
.dsh-wt-tabbar-note[data-tone=error]{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-tabbar-note[data-tone=ok]{color:var(--dsw-alias-state-success-primary)}
.dsh-wt-tabbar-hint{margin-left:auto;flex:none}

@media (prefers-reduced-motion:reduce){
  /* Gentler, not zero: keep opacity fades and colour changes, drop movement.
     The panel keeps a short opacity crossfade so open/close stays legible. */
  .dsh-wt-panel,.dsh-wt-panel[data-side]{transform:none;transition:opacity var(--dswt-dur-fast) ease}
  .dsh-wt-panel .dsh-wt-row,.dsh-wt-panel .dsh-wt-create-form,.dsh-wt-menu,.dsh-wt-menu-up,.dsh-wt-cf,.dsh-wt-create,.dsh-wt-detail{animation:dsh-wt-fade-in var(--dswt-dur-fast) ease both}
  .dsh-wt-trigger .dsh-wt-trigger-chevron svg{transition:none!important}
  .dsh-wt-spinner{animation:dsh-wt-pulse 1.1s ease-in-out infinite}
  .dsh-wt-trigger:active:not(:disabled),.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled),.dsh-wt-panel .dsh-wt-button:active:not(:disabled),.dsh-wt-mini:active:not(:disabled),.dsh-wt-more:active,.dsh-wt-create-x:active{transform:none}
}
`;
//#endregion

//#region client/icons.js
/**
 * Inline SVG icons for the worktree UI.
 *
 * Branch geometry is the official GitHub Octicons `git-branch` glyph (the same
 * shape Codex and VS Code render for a Git branch): filled 16x16 path, no
 * invented strokes. Worktree and remote-tracking variants reuse that geometry
 * with one distinguishing mark so all three read as members of one family.
 * @module dsh-worktree/client/icons
 */


function Svg({ size = 16, children, ...rest }) {
  return jsx('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'currentColor',
    'aria-hidden': true,
    ...rest,
    children,
  });
}

/** Octicons `git-branch` (16px): trunk with a fork into the branch head. */
const GIT_BRANCH_PATH = 'M9.5 3.25a2.25 2.25 0 1 1 3 2.122V6A2.5 2.5 0 0 1 10 8.5H6a1 1 0 0 0-1 1v1.128a2.251 2.251 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.5 0v1.836A2.493 2.493 0 0 1 6 7h4a1 1 0 0 0 1-1v-.628A2.25 2.25 0 0 1 9.5 3.25Zm-6 0a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Zm8.25-.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5ZM4.25 12a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z';

/**
 * VS Code codicon `worktree` (16px), copied verbatim from
 * `@vscode/codicons` `src/icons/worktree.svg` (MIT).
 *
 * This is the only widely shipped "worktree" glyph: a trunk that leaves the
 * main line and turns through an arrow, i.e. a checkout that branches off the
 * repository. Using it means the mark reads as "worktree" to anyone coming from
 * VS Code, instead of being an invented shape.
 */
const VSCODE_WORKTREE_PATH = 'M12.854 14.8542L14.854 12.8542C15.049 12.6592 15.049 12.3422 14.854 12.1472L12.854 10.1472C12.659 9.95223 12.342 9.95223 12.147 10.1472C11.952 10.3422 11.952 10.6592 12.147 10.8542L13.293 12.0002H8.5C8.225 12.0002 8 11.7752 8 11.5002V5.50023C8 5.22523 8.225 5.00023 8.5 5.00023H13.293L12.147 6.14623C12.049 6.24423 12.001 6.37223 12.001 6.50023C12.001 6.62823 12.05 6.75623 12.147 6.85423C12.342 7.04923 12.659 7.04923 12.854 6.85423L14.854 4.85423C15.049 4.65923 15.049 4.34223 14.854 4.14723L12.854 2.14723C12.659 1.95223 12.342 1.95223 12.147 2.14723C11.952 2.34223 11.952 2.65923 12.147 2.85423L13.293 4.00023H8.5C7.673 4.00023 7 4.67323 7 5.50023V8.00023H1.5C1.224 8.00023 1 8.22423 1 8.50023C1 8.77623 1.224 9.00023 1.5 9.00023H7V11.5002C7 12.3272 7.673 13.0002 8.5 13.0002H13.293L12.147 14.1462C12.049 14.2442 12.001 14.3722 12.001 14.5002C12.001 14.6282 12.05 14.7562 12.147 14.8542C12.342 15.0492 12.659 15.0492 12.854 14.8542Z';

/** The Git branch mark every branch-shaped row uses: the main checkout. */
function BranchIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: GIT_BRANCH_PATH }) });
}

/** A linked worktree: VS Code's own worktree glyph, visually distinct at 14px. */
function WorktreeIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: VSCODE_WORKTREE_PATH }) });
}

/** A remote-tracking branch: the branch mark with a dotted trunk. */
function RemoteBranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: [
      jsx('path', { d: GIT_BRANCH_PATH, opacity: 0.55 }, 'branch'),
      jsx('rect', { x: 3.1, y: 5.6, width: 1.5, height: 1.2, rx: 0.3 }, 'dash-a'),
      jsx('rect', { x: 3.1, y: 7.9, width: 1.5, height: 1.2, rx: 0.3 }, 'dash-b'),
    ],
  });
}

function CheckIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z' }) });
}

/**
 * Chevron whose point names a direction.
 *
 * The base path is Octicons `chevron-down-16`, so no rotation points down. The
 * trigger uses `direction="up"` while its panel sits above it and `"down"` when
 * the panel is closed or flipped below, which is the opposite of "rotate when
 * open": the arrow shows where the panel is, not whether it exists.
 * @param props.direction - `up` or `down`; the way the chevron points.
 */
function ChevronIcon({ direction = 'down', ...props }) {
  return jsx(Svg, {
    ...props,
    style: {
      transform: direction === 'up' ? 'rotate(180deg)' : 'rotate(0deg)',
      transition: 'transform var(--dswt-dur-fast) var(--dswt-ease-out)',
      ...(props.style ?? {}),
    },
    children: jsx('path', { d: 'M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L8 9.94l3.72-3.72a.75.75 0 0 1 1.06 0Z' }),
  });
}

function PlusIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M7.75 2.5a.75.75 0 0 1 .75.75v4h4a.75.75 0 0 1 0 1.5h-4v4a.75.75 0 0 1-1.5 0v-4h-4a.75.75 0 0 1 0-1.5h4v-4a.75.75 0 0 1 .75-.75Z' }) });
}

function WarningIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575Zm1.763.707a.25.25 0 0 0-.44 0L1.698 13.132a.25.25 0 0 0 .22.368h12.164a.25.25 0 0 0 .22-.368Zm.53 3.996v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM8 11a1 1 0 1 1 0 2 1 1 0 0 1 0-2Z' }) });
}

function TrashIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.75 1.75 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z' }) });
}

function SearchIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z' }) });
}

function SpinnerIcon({ size = 14 }) {
  return jsx('span', {
    className: 'dsh-wt-spinner',
    role: 'status',
    style: { width: size, height: size },
    'aria-hidden': true,
  });
}

/** Directory mark for the pool section header (Octicons `file-directory`). */
function FolderIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1Z' }) });
}
//#endregion

//#region client/graph-layout.js
/**
 * Commit-graph lane layout.
 *
 * Turns a topologically ordered commit list into per-row drawing instructions,
 * the same way `git log --graph` does it: a column is a *pending commit* that a
 * line is still travelling towards. Nothing here knows about pixels — the SVG
 * painter decides how a bend looks; this module only says which column a line
 * occupies at the top and the bottom of each row.
 *
 * Why compute it here instead of drawing straight from parents: a row needs to
 * know about lines that merely *pass through* it (other branches continuing
 * below), which no single commit's parent list can tell you. Only the running
 * column state can.
 *
 * @module dsh-worktree/client/graph-layout
 */

/**
 * Lay out one page of commits.
 *
 * @param {Array<{ hash: string, parents: string[] }>} commits
 *   commits in display order (newest first). Every parent that appears in the
 *   list must come *after* its child. A parent that is *not* in the list keeps
 *   its column open to the bottom edge — that is what a paged history looks
 *   like, and the next page picks the line up again.
 * @returns {Array<{
 *   lane: number,
 *   laneTop: boolean,
 *   pass: number[],
 *   incoming: number[],
 *   outgoing: Array<{ lane: number, kind: 'continue' | 'branch' | 'merge' }>,
 *   root: boolean,
 * }>} one drawing instruction set per commit, in the same order.
 */
function layoutCommits(commits) {
  /** Column state: the commit each column is still waiting for (`null` = free). */
  const columns = [];
  const rows = [];

  for (const commit of commits) {
    const before = columns.slice();

    // Where does this commit sit? Either a column already waits for it, or it
    // is a branch tip and takes the first free column.
    let lane = columns.indexOf(commit.hash);
    const incoming = [];
    if (lane === -1) {
      lane = columns.indexOf(null);
      if (lane === -1) {
        lane = columns.length;
        columns.push(commit.hash);
      } else {
        columns[lane] = commit.hash;
      }
    } else {
      // Two branches converge on the same commit: the extra columns bend into
      // this node instead of continuing past it.
      for (let index = 0; index < columns.length; index += 1) {
        if (index !== lane && columns[index] === commit.hash) {
          incoming.push(index);
          columns[index] = null;
        }
      }
    }

    // Columns that merely cross this row.
    const pass = [];
    for (let index = 0; index < columns.length; index += 1) {
      if (index === lane || incoming.includes(index)) continue;
      if (columns[index] !== null) pass.push(index);
    }

    // Where does the line leave the node?
    const outgoing = [];
    if (commit.parents.length > 0) {
      for (let index = 0; index < commit.parents.length; index += 1) {
        const parent = commit.parents[index];
        // A parent may already be awaited by another column (a merge whose
        // second parent is an older branch still open below): bend towards it
        // instead of opening a duplicate column for the same commit.
        let waitingAt = -1;
        for (let column = 0; column < columns.length; column += 1) {
          if (column !== lane && columns[column] === parent) waitingAt = column;
        }
        if (waitingAt !== -1) {
          if (index === 0) columns[lane] = null;
          outgoing.push({ lane: waitingAt, kind: 'merge' });
          continue;
        }
        if (index === 0) {
          columns[lane] = parent;
          outgoing.push({ lane, kind: 'continue' });
        } else {
          let free = columns.indexOf(null);
          if (free === -1) {
            free = columns.length;
            columns.push(parent);
          } else {
            columns[free] = parent;
          }
          outgoing.push({ lane: free, kind: 'branch' });
        }
      }
    } else {
      columns[lane] = null;
    }

    const laneTop = before[lane] !== null && before[lane] !== undefined;
    // An incoming column only bends in if it actually carried a line on the
    // previous row; a freshly created column has nothing above it.
    const incomingTop = incoming.filter((index) => before[index] !== null && before[index] !== undefined);

    while (columns.length > 0 && columns[columns.length - 1] === null) columns.pop();

    rows.push({
      lane,
      laneTop,
      pass,
      incoming: incomingTop,
      outgoing,
      root: commit.parents.length === 0,
    });
  }

  return rows;
}

/**
 * Columns a page needs, so the painter can size its gutter.
 * @param {ReturnType<typeof layoutCommits>} rows - laid-out page.
 * @returns {number} column count, at least 1.
 */
function countLanes(rows) {
  let max = 1;
  for (const row of rows) {
    max = Math.max(max, row.lane + 1);
    for (const lane of row.pass) max = Math.max(max, lane + 1);
    for (const lane of row.incoming) max = Math.max(max, lane + 1);
    for (const edge of row.outgoing) max = Math.max(max, edge.lane + 1);
  }
  return max;
}
//#endregion

//#region client/api.js
/**
 * Client-side API over the mounted `worktree` Remote namespace, plus the
 * workspace/session composition that opens a session inside a worktree.
 * @module dsh-worktree/client/api
 */

/**
 * Build the API bundle shared by every plugin component.
 * @param {object} ctx - client root context with the mounted namespace and
 * the `workspaces`, `sessions`, and `uiWorkspace` services.
 * @returns the API surface used by panels and decorations.
 */
function createWorktreeApi(ctx) {
  /** The namespace service exists after `$mount` settles; resolve it lazily. */
  let namespace = null;
  const remoteOf = () => {
    if (namespace === null) {
      namespace = ctx.get('remote.worktree');
      if (namespace === undefined) throw new Error('dsh-worktree: the worktree Remote namespace is not mounted');
    }
    return namespace;
  };
  const workspaces = ctx.workspaces;
  const sessions = ctx.sessions;
  const uiWorkspace = ctx.uiWorkspace;
  const call = async (method, ...args) => {
    const namespace = remoteOf();
    if (typeof namespace[method] !== 'function') {
      // The mounted namespace mirrors the Host the page booted against. A method
      // the Host does not export means the Host half is older than this client
      // half (plugin updated without restarting Harness): say so instead of
      // surfacing a bare transport 404.
      throw new Error(
        `The Harness Host does not expose worktree/${method} yet. Restart DeepSeek Harness so the plugin's Host half reloads, then retry.`,
      );
    }
    const result = await namespace[method](...args);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
  };

  /** Workspace covering one directory, derived from member session directories. */
  const workspaceOfDirectory = (path) => {
    const normalize = (value) => (typeof value === 'string' ? value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() : '');
    const list = sessions.list.getSnapshot();
    const registry = workspaces.list.getSnapshot();
    const owners = new Map();
    for (const workspace of registry.items ?? []) {
      for (const sessionId of workspace.sessionIds ?? []) owners.set(sessionId, workspace.workspaceId);
    }
    const target = normalize(path);
    if (target === '') return null;
    let bestId = null;
    let bestLength = -1;
    for (const id of list.ids ?? []) {
      const summary = list.byId?.[id];
      if (summary === undefined) continue;
      const cwd = normalize(summary.cwd);
      if (cwd === '' || !(target === cwd || target.startsWith(`${cwd}/`))) continue;
      const owner = owners.get(id);
      if (owner === undefined) continue;
      if (cwd.length > bestLength) {
        bestLength = cwd.length;
        bestId = owner;
      }
    }
    return bestId;
  };

  return {
    /** Whether the namespace is mounted. */
    available: true,

    /** Batched branch/worktree identity of checkout paths. */
    gitInfo: (paths) => call('gitInfo', paths),

    /** Full panel snapshot of one session's repository. */
    status: (sessionId) => call('status', sessionId),

    /** In-place branch switch with structured state outcomes. */
    switchBranch: (request) => call('switchBranch', request),

    /** Create a branch and check it out in the current checkout (no worktree). */
    createBranch: (request) => call('createBranch', request),

    /** Create one branch and its checkout under the pool. */
    createWorktree: (request) => call('createWorktree', request),

    /** Move one session into an existing checkout. */
    enterWorktree: (request) => call('enterWorktree', request),

    /** Remove one pool worktree. */
    removeWorktree: (request) => call('removeWorktree', request),

    /** One page of commits with parents and refs, for the graph view. */
    log: (request) => call('log', request),

    /** Delete one local branch with structured refusal states. */
    deleteBranch: (request) => call('deleteBranch', request),

    /**
     * Open a session whose working directory is one worktree checkout.
     *
     * A worktree is a checkout of the *current* workspace, not a workspace of
     * its own. Two cases:
     *  - a session already points at the directory: just reveal it;
     *  - otherwise create the session **inside the current workspace** (so it
     *    keeps an owner, stays visible in the sidebar, and leaves the composer
     *    usable) and then move its working directory onto the checkout.
     *
     * Creating with `{ cwd }` alone is deliberately avoided: such a session has
     * no workspace, which drops the UI back to the "choose a workspace" hero
     * state with a disabled composer.
     * @param {string} path - checkout directory.
     * @param {string | null} workspaceId - workspace the new session joins.
     * @returns the session id that was opened or revealed.
     */
    /**
     * Open a session whose working directory is one worktree checkout.
     *
     * A worktree is a checkout of the *current* workspace, not a workspace of
     * its own. Two cases:
     *  - a session already points at the directory: just reveal it;
     *  - otherwise create the session inside `ownerWorkspaceId` (so it keeps an
     *    owner, stays visible in the sidebar, and leaves the composer usable),
     *    then move its working directory onto the checkout.
     *
     * `ownerWorkspaceId` must be the workspace the *caller* belongs to. Deriving
     * it from the new checkout's path cannot work: nothing lives there yet, so no
     * workspace covers it and the session would never be created.
     * @param {string} path - checkout directory.
     * @param {string | null} ownerWorkspaceId - workspace the new session joins.
     * @returns the session id that was opened or revealed.
     */
    async openSessionInDirectory(path, ownerWorkspaceId = null) {
      const list = sessions.list.getSnapshot();
      const registry = workspaces.list.getSnapshot();
      const archived = new Set(registry.archivedSessionIds ?? []);
      const normalize = (value) => (typeof value === 'string' ? value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() : '');
      const target = normalize(path);
      let latest = null;
      let latestAt = -1;
      for (const id of list.ids ?? []) {
        const summary = list.byId?.[id];
        if (summary === undefined || archived.has(id)) continue;
        if (normalize(summary.cwd) !== target) continue;
        const updatedAt = summary.updatedAt;
        if (typeof updatedAt === 'number' && updatedAt > latestAt) {
          latestAt = updatedAt;
          latest = id;
        }
      }
      if (latest !== null) {
        uiWorkspace.openSession(latest);
        return latest;
      }
      if (ownerWorkspaceId === null) return null;
      const created = await sessions.create({ workspaceId: ownerWorkspaceId });
      const sessionId = typeof created === 'string' ? created : (created?.sessionId ?? null);
      if (sessionId === null) return null;
      // Open first, then move: `workingDirectory.set` needs a live agent, and a
      // freshly created session has none until the Host opens it.
      uiWorkspace.openSession(sessionId);
      const moved = await this.moveWithRetry(sessionId, path);
      if (moved.ok !== true) {
        throw new Error(moved.message ?? `could not move the new session into ${path}`);
      }
      return sessionId;
    },

    /**
     * Move a session's working directory, waiting for its agent to come up.
     *
     * A session created moments ago is not open in the Host yet, and the move
     * answers `session-unavailable` until it is. Retrying keeps the caller's flow
     * linear instead of making every call site handle that race.
     * @param {string} sessionId - session to move.
     * @param {string} path - target checkout directory.
     * @returns the Host result of the last attempt.
     */
    async moveWithRetry(sessionId, path) {
      let last = { ok: false, message: 'session never became available' };
      for (const delay of [150, 300, 600, 1200, 2000]) {
        await new Promise((resolve) => {
          setTimeout(resolve, delay);
        });
        // Raw remote call: `call()` throws on failure, but this loop needs the
        // result object to tell a transient "not open yet" from a real error.
        const result = await remoteOf().enterWorktree({ sessionId, path });
        last = result.ok === true ? result.value : result.error;
        if (last.ok === true) return last;
        if (last.code !== 'session-unavailable') return last;
      }
      return last;
    },

    /**
     * Workspace that owns a directory, resolved through its session directories.
     * @param {string} path - directory to attribute.
     * @returns the workspace id, or null when no workspace covers it.
     */
    workspaceOf(path) {
      return workspaceOfDirectory(path);
    },
  };
}

/**
 * A small batched cache of per-path git facts for sidebar decorations.
 *
 * Rows request their session's directory; lookups are batched on a short
 * timer, answered from cache while fresh, and republished to subscribers.
 *
 * Session-scoped facts are cached separately. `workingDirectory.set` moves the
 * directory the agent runs in, but the framework's session summary keeps
 * reporting the original `cwd`, so a sidebar row cannot learn from it that a
 * session moved into a worktree. Asking the plugin's own `status` does know, and
 * this second cache keeps that answer close to the row that needs it.
 * @module dsh-worktree/client/store
 */
class GitInfoStore {
  constructor(api, { ttlMs = 15000, flushDelayMs = 40, sessionTtlMs = 15000 } = {}) {
    this.api = api;
    this.ttlMs = ttlMs;
    this.flushDelayMs = flushDelayMs;
    this.sessionTtlMs = sessionTtlMs;
    this.entries = new Map();
    /** Session-scoped facts; the Host's session summary cannot report these. */
    this.sessions = new Map();
    /** Retry wake-ups for session facts whose last fetch failed. */
    this.sessionRetryTimers = new Map();
    this.pending = new Set();
    this.listeners = new Set();
    this.version = 0;
    this.timer = null;
    this.inflight = null;
  }

  /** Latest cached fact of one path, `undefined` when absent or stale. */
  currentOf(path) {
    if (path === undefined || path === null || path === '') return undefined;
    return this.entries.get(path)?.value;
  }

  /** Latest cached worktree facts of one session, `undefined` when unknown. */
  currentSessionOf(sessionId) {
    if (sessionId === undefined || sessionId === null || sessionId === '') return undefined;
    const entry = this.sessions.get(sessionId);
    if (entry === undefined) {
      this.requestSession(sessionId);
      return undefined;
    }
    // A stale entry is served while it refetches. One failed or aged-out
    // answer must never pin a row to the summary-cwd fallback: that fallback
    // reports a moved session's *origin* directory and draws the wrong mark,
    // so expiry has to re-ask rather than keep serving what it has.
    if (entry.expires <= Date.now()) this.requestSession(sessionId);
    return entry.value;
  }

  /**
   * Forget one session's facts and fetch them again.
   *
   * Needed after the plugin itself moves a session: the framework's session
   * summary keeps reporting the old directory, so nothing would otherwise tell
   * the trigger and the sidebar row that the checkout changed.
   * @param sessionId - session whose facts are stale.
   */
  invalidateSession(sessionId) {
    if (sessionId === undefined || sessionId === null || sessionId === '') return;
    this.sessions.delete(sessionId);
    this.requestSession(sessionId);
  }

  /** Ask the plugin for one session's checkout facts, deduplicated and cached. */
  requestSession(sessionId) {
    const entry = this.sessions.get(sessionId);
    if (entry !== undefined && entry.expires > Date.now()) return;
    if (entry !== undefined && entry.inflight === true) return;
    this.sessions.set(sessionId, { value: entry?.value, expires: Date.now() + 1000, inflight: true });
    this.api.status(sessionId)
      .then((value) => {
        this.sessions.set(sessionId, { value, expires: Date.now() + this.sessionTtlMs, inflight: false });
        this.version += 1;
        this.publish();
      })
      .catch(() => {
        this.sessions.set(sessionId, { value: entry?.value, expires: Date.now() + 3000, inflight: false });
        this.wakeSession(sessionId);
      });
  }

  /**
   * Wake subscribers once a failed session fetch's backoff lapses.
   *
   * A failed status call leaves the entry expired in 3s with no value; without
   * a nudge the row waits for an unrelated render before it asks again, which
   * for a quiet sidebar may be never — the wrong fallback mark would look
   * permanent. The timer republishes just past the backoff so
   * currentSessionOf re-requests on its own.
   */
  wakeSession(sessionId) {
    if (this.sessionRetryTimers.has(sessionId)) return;
    const timer = setTimeout(() => {
      this.sessionRetryTimers.delete(sessionId);
      this.version += 1;
      this.publish();
    }, 3200);
    this.sessionRetryTimers.set(sessionId, timer);
  }

  /** Subscribe to any store change; returns the disposer. */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Request one path and re-render the caller whenever the store changes. */
  watch(path, listener) {
    if (path !== undefined && path !== null && path !== '') this.request(path);
    const emit = () => {
      listener(this.currentOf(path));
    };
    this.listeners.add(emit);
    return () => {
      this.listeners.delete(emit);
    };
  }

  /** Mark paths for the next batched lookup. */
  request(path) {
    const entry = this.entries.get(path);
    if (entry !== undefined && entry.expires > Date.now()) return;
    this.pending.add(path);
    if (this.timer === null) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.flush();
      }, this.flushDelayMs);
    }
  }

  /** Drop cached answers so the next request refetches them. */
  invalidate() {
    this.entries.clear();
    this.version += 1;
    this.publish();
  }

  async flush() {
    if (this.pending.size === 0 || this.inflight !== null) return;
    const paths = [...this.pending];
    this.pending.clear();
    try {
      this.inflight = this.api.gitInfo(paths.slice(0, 64));
      const value = await this.inflight;
      const now = Date.now();
      const byPath = new Map((value.items ?? []).map((item) => [item.path, item]));
      for (const path of paths) {
        const info = byPath.get(path) ?? { path, isRepo: false };
        this.entries.set(path, { value: info, expires: now + this.ttlMs });
      }
      this.version += 1;
      this.publish();
    } catch {
      // Keep the previous answers; the next request retries.
      for (const path of paths) {
        if (!this.entries.has(path)) this.entries.set(path, { value: { path, isRepo: false, error: true }, expires: Date.now() + 2000 });
      }
    } finally {
      this.inflight = null;
      if (this.pending.size > 0) {
        this.timer = setTimeout(() => {
          this.timer = null;
          this.flush();
        }, this.flushDelayMs);
      }
    }
  }

  publish() {
    for (const listener of this.listeners) listener();
  }

  dispose() {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
    for (const timer of this.sessionRetryTimers.values()) clearTimeout(timer);
    this.sessionRetryTimers.clear();
    this.pending.clear();
    this.listeners.clear();
  }
}
//#endregion

//#region client/panel.js
/**
 * The composer branch/worktree picker: a compact toolbar trigger that opens an
 * anchored panel listing the current checkout, pool worktrees, local and
 * remote branches, with state-aware confirm flows and branch creation.
 * @module dsh-worktree/client/panel
 */





/**
 * Place the panel against its anchor and keep it inside the viewport.
 *
 * The panel changes height while it is open (status load, create-form expand,
 * confirm blocks), so a one-shot placement leaves it overflowing the window top
 * or bottom and painting over the conversation. A ResizeObserver re-runs the
 * same placement whenever the panel's own box changes, and the final clamp keeps
 * both edges on screen.
 * @param onPlacement - notified with `above`/`below` so the trigger chevron can
 * point the way the panel actually opened.
 */
function useAnchoredPanel(open, mounted, anchorRef, panelRef, gap = 6, onPlacement = undefined) {
  useEffect(() => {
    // mounted matters as much as open: the panel renders through a portal that
    // appears one render AFTER open flips, so keying on open alone runs this
    // effect while panelRef.current is still null — the panel would keep its
    // static-flow position (off-screen in a tall page) because neither the
    // sync placement nor the ResizeObserver ever saw it.
    if (!open || !mounted) return;
    let raf = 0;
    let settled = false;
    const update = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (anchor === null || panel === undefined || panel === null) return;
      const a = anchor.getBoundingClientRect();
      const width = panel.offsetWidth;
      const height = panel.offsetHeight;
      const margin = 8;
      const roomAbove = a.top - gap - margin;
      const roomBelow = window.innerHeight - a.bottom - gap - margin;
      // Prefer above the composer; flip below when the panel no longer fits.
      const above = roomAbove >= height;
      let top = above ? a.top - height - gap : (roomBelow >= height ? a.bottom + gap : Math.max(margin, window.innerHeight - height - margin));
      top = Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - height - margin));
      let left = a.right - width;
      left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - width - margin));
      panel.style.top = `${Math.round(top)}px`;
      panel.style.left = `${Math.round(left)}px`;
      // The trigger chevron points the way the panel actually opened.
      onPlacement?.(top < a.top ? 'above' : 'below');
      if (settled === false && height > 0) {
        settled = true;
        panel.style.visibility = '';
      }
    };
    const panel = panelRef.current;
    if (panel !== null) panel.style.visibility = 'hidden';
    update();
    raf = requestAnimationFrame(update);
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(() => {
      update();
    });
    if (panel !== null) observer?.observe(panel);
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open, mounted, gap, anchorRef, panelRef, onPlacement]);
}

/**
 * Exit duration of the anchored panel; must match --dswt-dur-fast in
 * styles.js, which the closed state uses as its transition-duration.
 */
const PANEL_EXIT_MS = 120;

/**
 * Keep the panel mounted through its exit transition and drive open/close as a
 * CSS transition instead of a mount-time keyframe, so a close interrupted by a
 * reopen resumes from the panel's current on-screen values instead of
 * restarting from the entrance pose.
 *
 * data-open flips on only after two frames on first mount — a transition
 * needs one committed closed style to animate away from — and immediately when
 * the panel is already on screen (the interrupted-close path).
 */
function usePanelPresence(open, exitMs) {
  const [mounted, setMounted] = useState(open);
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    if (open !== true) {
      setOpened(false);
      const timer = window.setTimeout(() => { setMounted(false); }, exitMs);
      return () => { window.clearTimeout(timer); };
    }
    setMounted(true);
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => { setOpened(true); });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [open, exitMs]);
  return { mounted, opened };
}

/** Close on Escape and on pointer-down outside the anchor and panel. */
function useDismiss(open, anchorRef, panelRef, close) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event) => {
      const target = event.target;
      if (target instanceof Node && (panelRef.current?.contains(target) === true || anchorRef.current?.contains(target) === true)) return;
      close();
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close();
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, close, anchorRef, panelRef]);
}

const baseName = (path) => {
  const text = String(path ?? '').replace(/[\\/]+$/, '');
  const slash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  return slash < 0 ? text : text.slice(slash + 1);
};

const dirtyLabel = (t, count) => (count === null || count === undefined ? null : t('status.dirty', { n: String(count) }));

/** Compare two directory spellings loosely, ignoring separators and case. */
const sameDirectory = (left, right) => {
  const normalize = (value) => (typeof value === 'string' ? value.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase() : '');
  return left !== undefined && left !== null && right !== undefined && right !== null && normalize(left) === normalize(right) && normalize(left) !== '';
};

/** A fresh checkout directory name: `wt-` plus four lowercase hex digits. */
const makeWorktreeId = () => {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  return `wt-${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
};

/**
 * The toolbar trigger plus its anchored panel.
 * @param props.sessionId - current session identity.
 * @param props.worktree - the API bundle ({ api, store }).
 * @param props.useSessions - framework hook over the sessions snapshot.
 * @param props.t - locale seat.
 */
function BranchPicker({ sessionId, worktree, useSessions, t }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);
  // Set by the anchoring effect: which side the panel took.
  const [placement, setPlacement] = useState('above');
  const presence = usePanelPresence(open, PANEL_EXIT_MS);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  useAnchoredPanel(open, presence.mounted, anchorRef, panelRef, 6, setPlacement);
  useDismiss(open, anchorRef, panelRef, close);

  const cwd = typeof useSessions === 'function'
    ? useSessions((snapshot) => snapshot?.byId?.[sessionId]?.cwd)
    : undefined;
  // Whether this session has started any turn — the framework's own list
  // metadata, updated as soon as the first `turn/start` event commits. Only a
  // blank session may be relocated into another checkout; once work exists the
  // directory is part of the session's identity.
  const sessionBlank = typeof useSessions === 'function'
    ? useSessions((snapshot) => snapshot?.byId?.[sessionId]?.blank)
    : undefined;
  const [status, setStatus] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (sessionId === undefined) return;
    setLoading(true);
    try {
      const value = await worktree.api.status(sessionId);
      if (value.ok === false && value.code === 'session-unavailable') {
        // The session's agent is still starting; retry briefly before giving up.
        setStatus(undefined);
        for (const delay of [400, 800, 1600]) {
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
          const retry = await worktree.api.status(sessionId);
          if (retry.ok === true) {
            setStatus(retry);
            return;
          }
        }
        setStatus(undefined);
      } else {
        setStatus(value);
      }
    } catch {
      setStatus(undefined);
    } finally {
      setLoading(false);
    }
  }, [worktree.api, sessionId]);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  // The framework's session summary keeps reporting the directory the session
  // started in, even after the plugin moves it into a worktree, so it cannot
  // drive a refresh. The store's session cache is the shared source of truth and
  // is invalidated explicitly when this plugin changes a checkout.
  useEffect(() => {
    if (sessionId === undefined) return undefined;
    return worktree.store.subscribe(() => {
      const fresh = worktree.store.currentSessionOf(sessionId);
      if (fresh !== undefined) setStatus(fresh);
    });
  }, [worktree.store, sessionId]);

  // Nothing to offer outside a repository, and no useful state to report: the
  // trigger is the branch entry point, so it is hidden entirely rather than shown
  // disabled with a "not a Git repository" label that only names its own uselessness.
  // While the first lookup is still in flight the space is kept, so the composer
  // toolbar does not shift when the answer arrives.
  if (loading === true && status === undefined) {
    return jsx('span', { className: 'dsh-wt-trigger-placeholder', 'aria-hidden': 'true' });
  }
  // A session whose recorded worktree was deleted outside the plugin keeps its
  // entry point: the trigger says the checkout is missing and the panel names
  // the path, instead of silently hiding or falling back somewhere else.
  const missingCheckout = status?.code === 'recorded-checkout-missing';
  if (status?.isRepo !== true && missingCheckout !== true) return null;

  const variant = status.isWorktree === true ? 'worktree' : 'branch';
  // A worktree reads as `<directory>/<branch>` so the trigger names both the
  // checkout and what is checked out in it.
  const worktreeLabel = status.isWorktree === true
    ? [status.worktreeName, status.branch].filter((part) => typeof part === 'string' && part.length > 0).join('/')
    : '';
  const label = missingCheckout === true
    ? t('trigger.missing')
    : (status.isWorktree === true
      ? (worktreeLabel.length > 0 ? worktreeLabel : (status.branch ?? ''))
      : (status.branch ?? t('trigger.detached')));

  return jsxs(Fragment, {
    children: [
      jsxs('button', {
        ref: anchorRef,
        type: 'button',
        className: 'dsh-wt-trigger',
        'data-variant': variant,
        'data-testid': 'dsh-worktree-trigger',
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        disabled: sessionId === undefined,
        onClick: () => {
          setOpen((value) => !value);
        },
        title: missingCheckout === true
          ? t('panel.checkoutMissing', { path: status?.path ?? '' })
          : (status.isWorktree === true
            ? t('sidebar.worktreeTitle', { name: status.worktreeName ?? '', branch: status.branch ?? '' })
            : t('sidebar.branchTitle', { branch: status.branch ?? t('trigger.detached') })),
        children: [
          jsx('span', { className: 'dsh-wt-trigger-icon', children: variant === 'worktree' ? jsx(WorktreeIcon, {}) : jsx(BranchIcon, {}) }),
          jsx('span', { className: 'dsh-wt-trigger-label', children: label || t('trigger.loading') }),
          jsx('span', {
            className: 'dsh-wt-trigger-chevron',
            // The chevron points at the panel: up while it sits above the
            // trigger, down while collapsed or flipped below.
            'data-open': open === true ? 'true' : undefined,
            children: jsx(ChevronIcon, { direction: open === true && placement === 'above' ? 'up' : 'down', size: 14 }),
          }),
        ],
      }),
      presence.mounted === true && createPortal(
        jsx(BranchPanel, {
          panelRef,
          themeRef: anchorRef,
          open,
          // entered lags open by two frames on first mount (see
          // usePanelPresence): the panel commits one closed style so the
          // stylesheet's data-open transition has something to animate from.
          entered: presence.opened,
          placement,
          sessionId,
          status,
          loading,
          cwd,
          // Read here, not inside the panel: the panel renders through a portal and
          // has no framework hook injection, so a `useSessions` call there silently
          // returns nothing.
          sessionBlank,
          api: worktree.api,
          store: worktree.store,
          t,
          refresh,
          onClose: close,
        }),
        document.body,
      ),
    ],
  });
}

/**
 * The panel body: search, current status, worktrees, branches, create form.
 */
function BranchPanel({ panelRef, themeRef, open, entered, placement, sessionId, status, loading, cwd, sessionBlank, api, store, t, refresh, onClose }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [mode, setMode] = useState(null);
  const [themeVars, setThemeVars] = useState(undefined);
  const pending = status === undefined && loading !== true;
  const searchRef = useRef(null);
  const bodyRef = useRef(null);
  // The portal lives on document.body, outside the shell's theme scope, so the
  // host `--dsw-alias-*` variables would be unresolved here and every surface
  // would fall back to a hard-coded colour. Mirror the resolved values from the
  // composer anchor (which does sit inside the themed subtree) onto the panel.
  useEffect(() => {
    const anchor = themeRef?.current;
    if (anchor === null || anchor === undefined) return;
    const source = getComputedStyle(anchor);
    const names = [
      '--dsw-alias-bg-base',
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-alias-bg-overlay',
      '--dsw-alias-border-l1',
      '--dsw-alias-border-l2',
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-label-dimmed',
      '--dsw-alias-interactive-bg-hover',
      '--dsw-alias-state-business-primary',
      '--dsw-alias-brand-primary',
      '--dsw-alias-state-warn-primary',
      '--dsw-alias-state-error-primary',
      '--dsw-alias-state-success-primary',
      '--dsw-radius-sm',
      '--dsw-radius-lg',
      '--dsw-specific-menu',
    ];
    const resolved = {};
    for (const name of names) {
      const value = source.getPropertyValue(name).trim();
      if (value.length > 0) resolved[name] = value;
    }
    const update = () => {
      const next = {};
      const live = getComputedStyle(anchor);
      for (const name of names) {
        const value = live.getPropertyValue(name).trim();
        if (value.length > 0) next[name] = value;
      }
      setThemeVars(next);
    };
    setThemeVars(resolved);
    const observer = typeof MutationObserver === 'undefined' ? undefined : new MutationObserver(update);
    observer?.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme', 'style'] });
    return () => {
      observer?.disconnect();
    };
  }, [themeRef]);
  // Focus rides the open state, not the mount: the portal stays mounted
  // through the exit transition, so reopening inside that window must refocus
  // the search field exactly like a fresh open does.
  useEffect(() => {
    if (open === true) searchRef.current?.focus({ preventScroll: true });
  }, [open]);
  useEffect(() => {
    setConfirm(null);
    setError(null);
  }, [sessionId, cwd]);
  // Expanding the create form (or a confirm block) grows content below the fold;
  // scroll it into view so the form is never clipped under the branch list.
  useEffect(() => {
    if (mode === null) return;
    const body = bodyRef.current;
    if (body === null) return;
    const frame = requestAnimationFrame(() => {
      // Smooth scroll follows the create form expanding into view; reduced
      // motion keeps the previous instant jump.
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      body.scrollTo({ top: body.scrollHeight, behavior: reduced ? 'auto' : 'smooth' });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mode]);

  const afterMutation = useCallback((message) => {
    store.invalidate();
    setToast(message);
    void refresh();
  }, [store, refresh]);

  const fail = useCallback((title, value) => {
    setError({
      title,
      message: value?.message ?? t('error.unexpected'),
      detail: value?.detail,
    });
  }, [t]);

  /** Switch flow: direct, or confirm for dirty/occupied states. */
  const switchTo = useCallback(async (branch, allowDirty = false) => {
    setBusy({ kind: 'switch', branch });
    setError(null);
    setConfirm(null);
    try {
      const value = await api.switchBranch({ sessionId, branch, ...(allowDirty ? { allowDirty: true } : {}) });
      if (value.ok === true) {
        afterMutation(value.mode === 'created-tracking'
          ? t('hint.trackingCreated', { branch: value.branch, upstream: value.upstream ?? branch })
          : t('hint.switchDone', { branch: value.branch }));
      } else if (value.code === 'dirty-tree') {
        setConfirm({ kind: 'dirty', branch: value.branch ?? branch, count: value.dirtyCount ?? 0 });
      } else if (value.code === 'branch-occupied') {
        setConfirm({ kind: 'occupied', branch: value.branch ?? branch, path: value.occupiedPath });
      } else if (value.code === 'switch-conflict') {
        fail(t('error.switchFailed'), { message: t('error.conflict'), detail: value.detail });
      } else if (value.code === 'session-unavailable') {
        fail(t('error.switchFailed'), { message: t('error.sessionUnavailable') });
      } else {
        fail(t('error.switchFailed'), value);
      }
    } catch (cause) {
      fail(t('error.switchFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, t]);

  /**
   * Switch a pristine session onto `branch`, wherever it lives.
   *
   * Picking `wt-1a2b/feat-x` from the picker means "switch to feat-x", and that
   * branch only exists inside `wt-1a2b`. For a session that has not started
   * any turn the switch therefore carries the directory with it — the session
   * lands in `wt-1a2b` with feat-x already waiting. No dirty consent is asked:
   * the old checkout and its uncommitted state are left untouched.
   * @param branch - branch entry from the picker, with its owning worktree.
   */
  const relocateTo = useCallback(async (branch) => {
    const target = branch.worktree?.path ?? branch.occupiedPath;
    if (typeof target !== 'string' || target.length === 0) {
      // No owning checkout means the branch lives here after all: switch in place.
      await switchTo(branch.name);
      return;
    }
    setBusy({ kind: 'relocate', branch: branch.name, path: target });
    setError(null);
    setConfirm(null);
    try {
      const value = await api.enterWorktree({ sessionId, path: target });
      if (value.ok !== true) {
        if (value.code === 'session-unavailable') {
          fail(t('error.switchFailed'), { message: t('error.sessionUnavailable') });
        } else if (value.code === 'session-not-blank') {
          fail(t('error.switchFailed'), { message: t('error.notBlank') });
        } else {
          fail(t('error.switchFailed'), value);
        }
        return;
      }
      // The directory changed: refresh this session's facts immediately so the
      // trigger and the row mark show the new worktree without waiting.
      store.invalidateSession(sessionId);
      afterMutation(t('hint.switchDone', { branch: branch.name }));
    } catch (cause) {
      fail(t('error.switchFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, store, t, switchTo]);

  const openDirectory = useCallback(async (path) => {
    setBusy({ kind: 'open', path });
    setError(null);
    setConfirm(null);
    try {
      // Open the checkout inside the workspace this session already belongs to.
      const opened = await api.openSessionInDirectory(path, api.workspaceOf(cwd ?? status?.cwd ?? ''));
      if (typeof opened === 'string') store.invalidateSession(opened);
      setToast(t('hint.sessionOpened', { name: baseName(path) }));
      onClose();
    } catch (cause) {
      fail(t('error.unexpected'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, fail, onClose, t, cwd, status, store]);


  const removeWorktree = useCallback(async (path, force = false) => {
    setBusy({ kind: 'remove', path });
    setError(null);
    setConfirm(null);
    try {
      const value = await api.removeWorktree({ sessionId, path, ...(force ? { force: true } : {}) });
      if (value.ok === true) {
        afterMutation(t('hint.removed', { name: baseName(path) }));
      } else if (value.code === 'dirty-worktree') {
        setConfirm({ kind: 'remove', path, name: baseName(path), count: value.dirtyCount ?? 0 });
      } else {
        fail(t('error.removeFailed'), value);
      }
    } catch (cause) {
      fail(t('error.removeFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, t]);

  /** Atomic action 1: create a branch and check it out in this checkout. */
  const createBranch = useCallback(async ({ name, startPoint, allowDirty = false }) => {
    setBusy({ kind: 'create', name });
    setError(null);
    try {
      const value = await api.createBranch({ sessionId, name, ...(startPoint === undefined ? {} : { startPoint }), ...(allowDirty ? { allowDirty: true } : {}) });
      if (value.ok !== true) {
        if (value.code === 'dirty-tree') {
          setConfirm({ kind: 'dirty-create', branch: value.branch ?? name, count: value.dirtyCount ?? 0 });
        } else {
          fail(t('error.createFailed'), value);
        }
        return false;
      }
      afterMutation(t('create.branchOk', { branch: value.branch }));
      return true;
    } catch (cause) {
      fail(t('error.createFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, t]);

  /**
   * Atomic action 2: create a linked checkout under the pool, leaving this one
   * untouched, then continue in a new session pointed at it.
   *
   * Always opening a session is the whole point of a permanent worktree: it is
   * how two tasks run side by side. It is also the only non-destructive path —
   * moving the *current* session into the checkout would take the working
   * context away from under the user.
   */
  const createWorktreeBranch = useCallback(async ({ name, startPoint, worktreeId }) => {
    setBusy({ kind: 'worktree', name });
    setError(null);
    try {
      const value = await api.createWorktree({ sessionId, name, ...(startPoint === undefined ? {} : { startPoint }), ...(worktreeId === undefined ? {} : { worktreeId }) });
      if (value.ok !== true) {
        fail(t('error.createFailed'), value);
        return false;
      }
      const opened = await api.openSessionInDirectory(value.path, api.workspaceOf(cwd ?? status?.cwd ?? ''));
      // The new session now runs in the checkout; refresh its facts at once so the
      // trigger shows `wt-xxxx/branch` without waiting for any other event.
      if (typeof opened === 'string') store.invalidateSession(opened);
      afterMutation(t('create.worktreeOk', { branch: value.branch, path: value.path }));
      onClose();
      return true;
    } catch (cause) {
      fail(t('error.createFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, onClose, t, cwd, status, store]);

  const normalized = query.trim().toLowerCase();
  // Only a session that has not started any turn may be relocated: once there is
  // work in it, its directory is part of its identity.
  //
  // `blank` comes from the framework snapshot, which reaches this component as a
  // prop because the panel itself renders through a portal and cannot call the
  // framework hook. The Host's own `blank` is the fallback for a stale snapshot.
  const relocatable = status?.isRepo === true
    && (sessionBlank === true || (sessionBlank === undefined && status.blank === true));
  const branches = useMemo(() => {
    // Which branches are checked out in a pool worktree, keyed by branch name.
    // A worktree row and a plain branch row share the same list, so the icon and
    // the id badge come from this map rather than from the row itself.
    const byWorktree = new Map();
    for (const entry of status?.worktrees ?? []) {
      if (typeof entry.branch === 'string' && entry.inPool === true) byWorktree.set(entry.branch, entry);
    }
    // Every local branch is offered to a pristine session, because picking any
    // of them — free or held by a worktree — is how the new session chooses
    // where it will work. A session that has already started sees branches by
    // their birth family: its own branch, plus the branches this plugin
    // created in this very checkout (the main repo's `a`, `b`, `c`; a
    // worktree's `e`, `f`, `g`). Another checkout's family is never shown, and
    // a branch held by another worktree cannot be switched to at all. A branch
    // with no birth record was created outside the plugin: its family is
    // unknowable, so it is not shown at all — only the session's own current
    // branch row and the trunk survive without a record.
    const home = status?.worktreePath ?? status?.repositoryRoot;
    // The trunk branch is the main family's root: a main-checkout session
    // always offers it, so switching back from a child stays possible. A
    // worktree's root is covered by its own birth record instead.
    const isMainCheckout = status?.isWorktree !== true;
    const trunkBranch = isMainCheckout === true ? status?.trunkBranch : null;
    const locals = (status?.branches ?? [])
      .filter((branch) => branch.kind === 'local')
      .filter((branch) => {
        if (relocatable) return true;
        if (branch.current === true) return true;
        if (branch.occupiedPath != null) return false;
        if (trunkBranch != null && branch.name === trunkBranch) return true;
        return sameDirectory(branch.origin, home);
      })
      .map((branch) => ({ ...branch, worktree: byWorktree.get(branch.name) ?? null }));
    const match = (entry) => normalized === '' || entry.name.toLowerCase().includes(normalized);
    return {
      locals: locals.filter(match),
      localsHidden: locals.length - locals.filter(match).length,
    };
  }, [status, normalized, relocatable]);

  const currentDirty = status?.dirtyCount ?? null;

  return jsxs('div', {
    ref: panelRef,
    className: 'dsh-wt-panel',
    role: 'dialog',
    'aria-label': t('panel.currentSection'),
    'data-testid': 'dsh-worktree-panel',
    // data-open (the transition target, flipped in by usePanelPresence) and
    // data-side (the direction-aware entrance offset) drive the stylesheet's
    // open/close transition; see styles.js.
    'data-open': entered === true ? 'true' : 'false',
    'data-side': placement,
    style: themeVars,
    children: [
      jsxs('div', {
        className: 'dsh-wt-panel-search',
        children: [
          jsx(SearchIcon, { size: 14 }),
          jsx('input', {
            ref: searchRef,
            type: 'text',
            value: query,
            placeholder: t('panel.searchPlaceholder'),
            'aria-label': t('panel.searchPlaceholder'),
            onChange: (event) => {
              setQuery(event.target.value);
            },
          }),
          loading === true && jsx(SpinnerIcon, {}),
        ],
      }),
      jsxs('div', {
        ref: bodyRef,
        className: 'dsh-wt-panel-body',
        children: [
          status?.isRepo !== true && loading !== true && jsx('div', {
            className: 'dsh-wt-note',
            'data-testid': 'dsh-worktree-not-repo',
            children: pending === true
              ? t('panel.sessionPending')
              : (status?.code === 'recorded-checkout-missing'
                ? t('panel.checkoutMissing', { path: status?.path ?? '' })
                : t('panel.notRepo')),
          }),
          confirm !== null && confirm.kind === 'dirty-create' && jsxs('div', {
            className: 'dsh-wt-confirm',
            'data-testid': 'dsh-worktree-confirm-dirty-create',
            children: [
              jsxs('span', { className: 'dsh-wt-confirm-title', children: [jsx(WarningIcon, { size: 14 }), t('confirm.dirtyCreate.title')] }),
              jsx('span', { className: 'dsh-wt-confirm-body', children: t('confirm.dirtyCreate.body', { n: String(confirm.count), branch: confirm.branch }) }),
              jsxs('div', {
                className: 'dsh-wt-confirm-actions',
                children: [
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setConfirm(null); }, children: t('error.cancel') }),
                  jsx('button', {
                    type: 'button',
                    className: 'dsh-wt-button',
                    'data-variant': 'primary',
                    onClick: () => {
                      const branch = confirm.branch;
                      setConfirm(null);
                      void createBranch({ name: branch, allowDirty: true });
                    },
                    children: t('confirm.dirtyCreate.proceed'),
                  }),
                ],
              }),
            ],
          }),
          confirm !== null && confirm.kind === 'dirty' && jsxs('div', {
            className: 'dsh-wt-confirm',
            'data-testid': 'dsh-worktree-confirm-dirty',
            children: [
              jsxs('span', { className: 'dsh-wt-confirm-title', children: [jsx(WarningIcon, { size: 14 }), t('confirm.dirty.title')] }),
              jsx('span', { className: 'dsh-wt-confirm-body', children: t('confirm.dirty.body', { n: String(confirm.count) }) }),
              jsxs('div', {
                className: 'dsh-wt-confirm-actions',
                children: [
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setConfirm(null); setMode('worktree'); }, children: t('confirm.dirty.worktree') }),
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'primary', onClick: () => { void switchTo(confirm.branch, true); }, children: t('confirm.dirty.proceed') }),
                ],
              }),
            ],
          }),
          confirm !== null && confirm.kind === 'occupied' && jsxs('div', {
            className: 'dsh-wt-confirm',
            'data-testid': 'dsh-worktree-confirm-occupied',
            children: [
              jsxs('span', { className: 'dsh-wt-confirm-title', children: [jsx(WarningIcon, { size: 14 }), t('confirm.occupied.title')] }),
              jsx('span', { className: 'dsh-wt-confirm-body', children: t('confirm.occupied.body', { branch: confirm.branch, name: baseName(confirm.path ?? '') }) }),
              jsxs('div', {
                className: 'dsh-wt-confirm-actions',
                children: [
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setConfirm(null); }, children: t('error.cancel') }),
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'primary', onClick: () => { void openDirectory(confirm.path); }, children: t('confirm.occupied.open') }),
                ],
              }),
            ],
          }),
          confirm !== null && confirm.kind === 'remove' && jsxs('div', {
            className: 'dsh-wt-confirm',
            'data-testid': 'dsh-worktree-confirm-remove',
            children: [
              jsxs('span', { className: 'dsh-wt-confirm-title', children: [jsx(WarningIcon, { size: 14 }), t('confirm.remove.title')] }),
              jsx('span', { className: 'dsh-wt-confirm-body', children: t('confirm.remove.body', { name: confirm.name }) }),
              jsxs('div', {
                className: 'dsh-wt-confirm-actions',
                children: [
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setConfirm(null); }, children: t('error.cancel') }),
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'danger', onClick: () => { void removeWorktree(confirm.path, true); }, children: t('confirm.remove.proceed') }),
                ],
              }),
            ],
          }),
          error !== null && jsxs('div', {
            className: 'dsh-wt-error',
            'data-testid': 'dsh-worktree-error',
            children: [
              jsxs('span', { className: 'dsh-wt-error-title', children: [jsx(WarningIcon, { size: 14 }), error.title] }),
              jsx('span', {
                className: 'dsh-wt-error-body',
                children: jsxs(Fragment, { children: [error.message, error.detail !== undefined && jsx('span', { className: 'dsh-wt-confirm-detail', children: error.detail })] }),
              }),
            ],
          }),
          toast !== null && jsx('div', {
            className: 'dsh-wt-toast',
            role: 'status',
            children: jsxs(Fragment, { children: [jsx(CheckIcon, { size: 14 }), jsx('span', { children: toast })] }),
          }),
          status?.isRepo === true && jsxs(Fragment, {
            children: [
              branches.locals.length === 0 && jsx('div', { className: 'dsh-wt-note', children: t('panel.noMatches') }),
              jsx('div', {
                className: 'dsh-wt-section',
                children: branches.locals.map((branch, index) => {
                const isCurrent = branch.current === true;
                // Match the busy row by branch name only: a switch action sets
                // no `busy.path`, and comparing that against a worktree-free
                // row's `undefined` worktree path lit a spinner on every plain
                // branch row at once.
                const busyRow = busy !== null && (busy.kind === 'switch' || busy.kind === 'relocate') && busy.branch === branch.name;
                // An occupied row reaches the list only for a pristine session,
                // where picking it moves the session into the checkout that
                // holds the branch; a started session never sees these rows.
                const isOccupied = branch.occupiedPath != null;
                return jsxs('button', {
                  type: 'button',
                  className: 'dsh-wt-row',
                  // The current branch stays focusable and readable: a real
                  // `disabled` button drops to a dimmed label that disappears on
                  // a light surface, and a check mark is a better "you are here"
                  // than a greyed-out row.
                  'aria-disabled': isCurrent === true ? 'true' : undefined,
                  'data-current': isCurrent === true ? 'true' : undefined,
                  style: { animationDelay: `${String(Math.min(index, 8) * 14)}ms` },
                  'data-testid': `dsh-worktree-branch-${branch.name}`,
                  onClick: () => {
                    if (isCurrent === true) return;
                    if (isOccupied === true) {
                      // The session is still pristine, so its directory may
                      // follow the branch into the checkout that holds it.
                      void relocateTo(branch);
                      return;
                    }
                    // One action behind every other row: ask the Host to put this
                    // checkout on that branch. Dirty trees and conflicts come
                    // back as structured codes the panel already turns into a
                    // confirm step, so the click never silently changes the
                    // session's directory.
                    void switchTo(branch.name);
                  },
                  children: [
                    jsx('span', {
                      className: 'dsh-wt-row-icon',
                      'data-variant': branch.worktree === null ? 'branch' : 'worktree',
                      children: busyRow === true
                        ? jsx(SpinnerIcon, {})
                        : (branch.worktree === null ? jsx(BranchIcon, {}) : jsx(WorktreeIcon, {})),
                    }),
                    jsxs('span', {
                      className: 'dsh-wt-row-main',
                      children: [
                        jsx('span', {
                          className: 'dsh-wt-row-title',
                          children: jsx('span', {
                            className: 'dsh-wt-row-name',
                            // One string, one colour: `wt-1a2b/feat-abc`. The id is
                            // the directory the checkout lives in, so it leads, but
                            // dimming it made the row unreadable.
                            children: branch.worktree === null
                              ? branch.name
                              : `${baseName(branch.worktree.path)}/${branch.name}`,
                          }),
                        }),
                        isCurrent === true && dirtyLabel(t, currentDirty) !== null && (currentDirty ?? 0) > 0
                          ? jsx('span', { className: 'dsh-wt-row-sub', 'data-tone': 'warn', children: dirtyLabel(t, currentDirty) })
                          : null,
                      ],
                    }),
                    isCurrent === true && jsx('span', { className: 'dsh-wt-row-check', children: jsx(CheckIcon, { size: 14 }) }),
                  ],
                }, branch.name);
                }),
              }),
            ],
          }),
        ],
      }),
      jsx(CreateFooter, {
        status,
        busy,
        mode,
        setMode,
        createBranch,
        createWorktreeBranch,
        t,
      }),
    ],
  });
}

/**
 * Footer with the two atomic create actions.
 *
 * "Branch" creates a branch and checks it out in the current checkout; "Permanent
 * worktree" creates a linked checkout under the pool and leaves the current
 * checkout untouched. Each action expands its own small form, so neither one
 * silently performs the other's side effect.
 */
function CreateFooter({ status, busy, mode, setMode, createBranch, createWorktreeBranch, t }) {
  const [name, setName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // A worktree checkout directory is `wt-<4 hex>`. The id is drawn when the form
  // opens so the prefix the user reads is the directory that will really be
  // created; the Host still validates it and re-draws when it is taken.
  const [worktreeId, setWorktreeId] = useState(() => makeWorktreeId());
  const nameRef = useRef(null);
  useEffect(() => {
    if (mode === null) return;
    setName('');
    setStartPoint('');
    setWorktreeId(makeWorktreeId());
    const frame = requestAnimationFrame(() => {
      nameRef.current?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [mode]);
  const options = useMemo(() => {
    const locals = (status?.branches ?? []).filter((branch) => branch.kind === 'local').map((branch) => branch.name);
    return { locals };
  }, [status]);
  const disabled = status?.isRepo !== true || busy?.kind === 'create' || busy?.kind === 'worktree';
  const expanded = mode !== null;
  const title = mode === 'worktree' ? t('create.worktreeTitle') : t('create.branchTitle');
  const submitLabel = mode === 'worktree' ? t('create.worktreeSubmit') : t('create.branchSubmit');
  const run = mode === 'worktree' ? createWorktreeBranch : createBranch;
  return jsxs('div', {
    className: 'dsh-wt-footer',
    children: [
      expanded !== true && jsxs('div', {
        className: 'dsh-wt-create-rows',
        children: [
          jsxs('button', {
            type: 'button',
            className: 'dsh-wt-create-toggle',
            disabled,
            onClick: () => {
              setMode('branch');
            },
            'data-testid': 'dsh-worktree-create-branch',
            children: [jsx(PlusIcon, { size: 14 }), t('create.branchAction')],
          }),
          jsxs('button', {
            type: 'button',
            className: 'dsh-wt-create-toggle',
            disabled,
            onClick: () => {
              setMode('worktree');
            },
            'data-testid': 'dsh-worktree-create-worktree',
            children: [jsx(WorktreeIcon, { size: 14 }), t('create.worktreeAction')],
          }),
        ],
      }),
      expanded === true && jsxs('form', {
        className: 'dsh-wt-create-form',
        'data-mode': mode,
        onSubmit: async (event) => {
          event.preventDefault();
          if (name.trim().length === 0 || submitting === true) return;
          setSubmitting(true);
          try {
            const done = await run({ name: name.trim(), startPoint: startPoint.length === 0 ? undefined : startPoint, worktreeId });
            if (done === true) {
              setName('');
              setStartPoint('');
            }
          } finally {
            setSubmitting(false);
          }
        },
        onKeyDown: (event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            setMode(null);
          }
        },
        children: [
          // A plain field. The checkout directory id is generated when the form
          // opens and is shown on the trigger afterwards, so repeating it here
          // only crowded the input the user actually types into.
          jsx('input', {
            ref: nameRef,
            id: 'dsh-wt-create-name',
            className: 'dsh-wt-create-name',
            type: 'text',
            value: name,
            placeholder: mode === 'worktree' ? t('create.worktreePlaceholder') : t('create.branchPlaceholder'),
            'aria-label': title,
            autoComplete: 'off',
            spellCheck: false,
            onChange: (event) => {
              setName(event.target.value);
            },
          }),
          jsxs('select', {
            id: 'dsh-wt-create-from',
            className: 'dsh-wt-create-from',
            value: startPoint,
            'aria-label': t('create.from'),
            title: t('create.from'),
            onChange: (event) => {
              setStartPoint(event.target.value);
            },
            children: [
              jsx('option', { value: '', children: t('create.fromHead') }),
              ...options.locals.map((value) => jsx('option', { value, children: value }, `local:${value}`)),
            ],
          }),
          jsxs('button', {
            type: 'submit',
            className: 'dsh-wt-button',
            'data-variant': 'primary',
            disabled: name.trim().length === 0 || submitting === true,
            'data-testid': 'dsh-worktree-create-submit',
            title: `${submitLabel}  ·  Esc ${t('error.cancel')}`,
            children: submitting === true ? t('create.submitting') : submitLabel,
          }),
        ],
      }),
    ],
  });
}
//#endregion

//#region client/view.js
/**
 * The worktree tab: one full `conversation.view` page that turns the picker's
 * facts into a managing surface — a readout band, the commit graph drawn from
 * the DAG the Host reports, and a rack of checkouts with branch actions.
 *
 * Every lane, bend, and badge is derived: `layoutCommits` turns parent lists
 * into drawing instructions, so nothing here is hand-placed. Destructive
 * actions follow the picker's state discipline — the Host's refusal names the
 * next step, and the confirm block is that answer rendered in place.
 * @module dsh-worktree/client/view
 */





/** Graph geometry: lane pitch, gutter inset, row height, node centre. */
const LANE_W = 20;
const LANE_X0 = 16;
const ROW_H = 42;
const NODE_Y = 21;
const PAGE_LIMIT = 200;

const tabLaneX = (lane) => LANE_X0 + lane * LANE_W;
const tabLaneClass = (lane) => 'dsh-wt-ln dsh-wt-lane-' + (lane % 4);
const tabBaseName = (path) => {
  const text = String(path ?? '').replace(/[\\/]+$/, '');
  const slash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
  return slash < 0 ? text : text.slice(slash + 1);
};

/** Shared relative-time formatter; the active locale decides the wording. */
const tabRelative = (at) => {
  if (typeof at !== 'number' || at <= 0) return '';
  const deltaSeconds = Math.round(at - Date.now() / 1000);
  const divide = [[60, 'second'], [60, 'minute'], [24, 'hour'], [7, 'day'], [4.348, 'week'], [12, 'month'], [Number.POSITIVE_INFINITY, 'year']];
  let value = deltaSeconds;
  let unit = 'second';
  for (const [step, nextUnit] of divide) {
    if (Math.abs(value) < step) break;
    value = Math.round(value / step * 10) / 10;
    unit = nextUnit;
  }
  try {
    return new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' }).format(value, unit);
  } catch {
    return new Date(at * 1000).toLocaleDateString();
  }
};

/**
 * The worktree tab view.
 * @param {object} props - session identity, the API bundle, and the locale seat.
 * @returns the tab page, or a pending / not-a-repository notice.
 */
function WorktreeView({ sessionId, worktree, t }) {
  const api = worktree?.api;
  const store = worktree?.store;
  const [status, setStatus] = useState(undefined);
  const [page, setPage] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(null);
  const [selected, setSelected] = useState(-1);
  const [menuBranch, setMenuBranch] = useState(null);
  const [confirmState, setConfirmState] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createBase, setCreateBase] = useState('HEAD');
  const railRef = useRef(null);
  const graphRef = useRef(null);

  const say = useCallback((message) => {
    setToast(message);
    window.clearTimeout(say.timer);
    say.timer = window.setTimeout(() => { setToast(null); }, 2600);
  }, []);

  const refresh = useCallback(async () => {
    if (sessionId === undefined || api === undefined) return;
    setLoading(true);
    try {
      const value = await api.status(sessionId);
      if (value.ok === false && value.code === 'session-unavailable') {
        setStatus(undefined);
        for (const delay of [400, 800, 1600]) {
          await new Promise((resolve) => { setTimeout(resolve, delay); });
          const retry = await api.status(sessionId);
          if (retry.ok === true) { setStatus(retry); break; }
        }
      } else {
        setStatus(value);
      }
    } catch {
      setStatus(undefined);
    } finally {
      setLoading(false);
    }
  }, [api, sessionId]);

  const refreshLog = useCallback(async () => {
    if (sessionId === undefined || api === undefined) return;
    setLogLoading(true);
    try {
      const value = await api.log({ sessionId, limit: PAGE_LIMIT });
      if (value.ok === true) setPage(value);
    } catch {
      /* The graph stays on its last page; the readout still answers. */
    } finally {
      setLogLoading(false);
    }
  }, [api, sessionId]);

  useEffect(() => {
    void refresh();
    void refreshLog();
  }, [refresh, refreshLog]);

  // The store is the shared source of truth: the picker moving this session (or
  // any mutation elsewhere) republishes, and the tab follows without polling.
  useEffect(() => {
    if (sessionId === undefined || store === undefined) return undefined;
    return store.subscribe(() => {
      const fresh = store.currentSessionOf(sessionId);
      if (fresh !== undefined) setStatus(fresh);
    });
  }, [store, sessionId]);

  const afterMutation = useCallback((message) => {
    if (store !== undefined) store.invalidate();
    if (typeof message === 'string') say(message);
    void refresh();
    void refreshLog();
  }, [store, refresh, refreshLog, say]);

  // --- derived model -------------------------------------------------------

  const rows = useMemo(() => {
    if (page?.commits?.length > 0 !== true) return [];
    return layoutCommits(page.commits).map((row, index) => ({ ...row, commit: page.commits[index] }));
  }, [page]);
  const lanes = useMemo(() => countLanes(rows), [rows]);
  const laneWidth = LANE_X0 * 2 + Math.max(1, lanes - 1) * LANE_W + 18;

  const localBranches = useMemo(() => (status?.branches ?? []).filter((branch) => branch.kind === 'local'), [status]);
  const worktreeByBranch = useMemo(() => {
    const map = new Map();
    for (const entry of status?.worktrees ?? []) {
      if (entry.branch != null) map.set(entry.branch, entry);
    }
    return map;
  }, [status]);
  const poolWorktrees = useMemo(() => (status?.worktrees ?? []).filter((entry) => entry.inPool), [status]);
  const currentWorktree = useMemo(() => (status?.worktrees ?? []).find((entry) => entry.isCurrent === true) ?? null, [status]);

  // --- actions -------------------------------------------------------------

  const switchTo = useCallback(async (branch, allowDirty = false) => {
    setBusy({ kind: 'switch', branch });
    setMenuBranch(null);
    setConfirmState(null);
    try {
      const value = await api.switchBranch({ sessionId, branch, ...(allowDirty ? { allowDirty: true } : {}) });
      if (value.ok === true) {
        afterMutation(value.mode === 'created-tracking'
          ? t('hint.trackingCreated', { branch: value.branch, upstream: value.upstream ?? branch })
          : t('hint.switchDone', { branch: value.branch }));
      } else if (value.code === 'dirty-tree') {
        setConfirmState({ kind: 'dirty-switch', branch: value.branch ?? branch, count: value.dirtyCount ?? 0 });
      } else if (value.code === 'branch-occupied') {
        setConfirmState({ kind: 'occupied-switch', branch: value.branch ?? branch, path: value.occupiedPath });
      } else {
        setNotice({ message: value.message ?? t('error.switchFailed') });
      }
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, t]);

  const runDelete = useCallback(async (branch, force = false) => {
    // 菜单必须先收：确认块会插到行下方，留着菜单正好压在它上面。
    setMenuBranch(null);
    setBusy({ kind: 'delete', branch });
    try {
      const value = await api.deleteBranch({ sessionId, branch, ...(force ? { force: true } : {}) });
      if (value.ok === true) {
        setConfirmState(null);
        setMenuBranch(null);
        afterMutation(t('tab.delete.done', { branch }));
      } else if (value.code === 'unmerged') {
        setConfirmState({ kind: 'delete-unmerged', branch, trunk: value.trunk ?? null, unmerged: value.unmerged ?? null, force: false });
      } else if (value.code === 'current-branch' || value.code === 'branch-occupied') {
        setConfirmState({ kind: 'delete-occupied', branch, ...(value.occupiedPath === undefined ? {} : { path: value.occupiedPath }), current: value.code === 'current-branch' });
      } else {
        setConfirmState({ kind: 'delete-failed', branch, message: value.message, detail: value.detail });
      }
      // 确认块插在行下方，可能落在可视区外：滚到最近位置让用户看见。
      requestAnimationFrame(() => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        railRef.current?.querySelector('.dsh-wt-cf')?.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      });
    } catch (cause) {
      setConfirmState({ kind: 'delete-failed', branch, message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, t]);

  const removeWorktree = useCallback(async (path, force = false) => {
    setBusy({ kind: 'remove', path });
    try {
      const value = await api.removeWorktree({ sessionId, path, ...(force ? { force: true } : {}) });
      if (value.ok === true) {
        setConfirmState(null);
        afterMutation(t('hint.removed', { name: tabBaseName(path) }));
      } else if (value.code === 'dirty-worktree') {
        setConfirmState({ kind: 'remove-wt', path, dirtyCount: value.dirtyCount ?? 0, force: false });
      } else {
        setNotice({ message: value.message ?? t('error.removeFailed') });
      }
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, t]);

  const openSessionIn = useCallback(async (path) => {
    setBusy({ kind: 'open', path });
    try {
      const opened = await api.openSessionInDirectory(path, api.workspaceOf(status?.cwd ?? ''));
      if (typeof opened === 'string' && store !== undefined) store.invalidateSession(opened);
      say(t('hint.sessionOpened', { name: tabBaseName(path) }));
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, status, store, say, t]);

  const submitCreate = useCallback(async () => {
    const name = createName.trim();
    if (name.length === 0) return;
    setBusy({ kind: 'worktree', name });
    try {
      const value = await api.createWorktree({ sessionId, name, ...(createBase === 'HEAD' ? {} : { startPoint: createBase }) });
      if (value.ok !== true) {
        setNotice({ message: value.message ?? t('error.createFailed') });
        return;
      }
      const opened = await api.openSessionInDirectory(value.path, api.workspaceOf(status?.cwd ?? ''));
      if (typeof opened === 'string' && store !== undefined) store.invalidateSession(opened);
      setCreateOpen(false);
      setCreateName('');
      afterMutation(t('create.worktreeOk', { branch: value.branch, path: value.path }));
    } catch (cause) {
      setNotice({ message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, createName, createBase, status, store, afterMutation, t]);

  const copyName = useCallback(async (name) => {
    setMenuBranch(null);
    try {
      await navigator.clipboard.writeText(name);
      say(t('tab.branch.copied', { name }));
    } catch {
      /* Clipboard may be denied; the toast is a courtesy, not a contract. */
    }
  }, [say, t]);

  const closeCreate = useCallback(() => {
    setCreateOpen(false);
  }, []);

  // Esc peels one layer at a time: menu, confirm, create form, detail.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') {
        if (menuBranch !== null) { setMenuBranch(null); return; }
        if (confirmState !== null) { setConfirmState(null); return; }
        if (createOpen) { closeCreate(); return; }
        if (selected >= 0) setSelected(-1);
        return;
      }
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      if (event.target instanceof HTMLElement && ['INPUT', 'SELECT', 'TEXTAREA'].includes(event.target.tagName)) return;
      if (rows.length === 0) return;
      event.preventDefault();
      setSelected((current) => {
        const next = current + (event.key === 'ArrowDown' ? 1 : -1);
        return next < 0 ? rows.length - 1 : next >= rows.length ? 0 : next;
      });
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); };
  }, [menuBranch, confirmState, createOpen, selected, rows.length, closeCreate]);

  // Clicking anything outside the open menu closes it.
  useEffect(() => {
    if (menuBranch === null) return undefined;
    const onPointerDown = (event) => {
      if (event.target instanceof HTMLElement && railRef.current?.contains(event.target) === true) return;
      setMenuBranch(null);
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => { document.removeEventListener('pointerdown', onPointerDown, true); };
  }, [menuBranch]);

  // --- guards --------------------------------------------------------------

  if (api === undefined) return null;
  if (loading === true && status === undefined) {
    return jsx('div', { className: 'dsh-wt-tab dsh-wt-tab-center', children: jsx(SpinnerIcon, { size: 16 }) });
  }
  if (status?.isRepo !== true) {
    return jsx('div', {
      className: 'dsh-wt-tab dsh-wt-tab-center',
      'data-testid': 'dsh-worktree-tab-empty',
      children: jsx('span', { className: 'dsh-wt-empty', children: status?.code === 'recorded-checkout-missing'
        ? t('panel.checkoutMissing', { path: status?.path ?? '' })
        : (loading === true ? t('panel.sessionPending') : t('panel.notRepo')) }),
    });
  }

  // --- readout band --------------------------------------------------------

  const dirtyCount = status.dirtyCount;
  const readout = jsxs('div', { className: 'dsh-wt-readout', children: [
    jsx('div', { className: 'dsh-wt-ro', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: t('tab.repo') }),
      jsx('span', { className: 'dsh-wt-ro-val', children: tabBaseName(status.repositoryRoot) }),
    ] }),
    jsx('div', { className: 'dsh-wt-ro', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: 'HEAD' }),
      jsx('span', { className: 'dsh-wt-ro-val', children: (status.head ?? '').slice(0, 7) + (status.branch != null ? ' · ' + status.branch : '') }),
    ] }),
    jsx('div', { className: 'dsh-wt-ro', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: t('tab.upstream') }),
      jsx('span', { className: 'dsh-wt-ro-val', children: status.upstream != null
        ? status.upstream + (status.ahead > 0 ? ' ↑' + status.ahead : '') + (status.behind > 0 ? ' ↓' + status.behind : '')
        : t('status.noUpstream') }),
    ] }),
    jsx('div', { className: 'dsh-wt-ro', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: t('tab.dirty') }),
      jsx('span', { className: 'dsh-wt-ro-val', 'data-tone': dirtyCount > 0 ? 'warn' : undefined, children: dirtyCount == null ? '—' : t('status.dirty', { n: String(dirtyCount) }) }),
    ] }),
    jsx('div', { className: 'dsh-wt-ro', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: t('tab.worktrees') }),
      jsx('span', { className: 'dsh-wt-ro-val', children: String(poolWorktrees.length) + ' + 1' }),
    ] }),
    jsx('div', { className: 'dsh-wt-ro dsh-wt-ro-grow', children: [
      jsx('span', { className: 'dsh-wt-ro-cap', children: t('tab.pool') }),
      jsx('span', { className: 'dsh-wt-ro-val', children: status.poolPath }),
    ] }),
  ] });

  // --- commit graph --------------------------------------------------------

  const rowSvg = (row) => {
    const parts = [];
    for (const lane of row.pass) {
      parts.push(jsx('line', { x1: tabLaneX(lane), y1: 0, x2: tabLaneX(lane), y2: ROW_H, className: tabLaneClass(lane) }, 'p' + lane));
    }
    for (const lane of row.incoming) {
      parts.push(jsx('path', { d: tabElbow(lane, row.lane, 0, NODE_Y - 5), className: tabLaneClass(lane), fill: 'none' }, 'i' + lane));
    }
    if (row.laneTop === true) {
      parts.push(jsx('line', { x1: tabLaneX(row.lane), y1: 0, x2: tabLaneX(row.lane), y2: NODE_Y - 5, className: tabLaneClass(row.lane) }, 't'));
    }
    row.outgoing.forEach((edge, index) => {
      if (edge.kind === 'continue') {
        parts.push(jsx('line', { x1: tabLaneX(edge.lane), y1: NODE_Y + 4, x2: tabLaneX(edge.lane), y2: ROW_H, className: tabLaneClass(edge.lane) }, 'o' + index));
      } else {
        parts.push(jsx('path', { d: tabElbow(row.lane, edge.lane, NODE_Y + 4, ROW_H), className: tabLaneClass(edge.lane), fill: 'none' }, 'o' + index));
      }
    });
    // The commit node itself: a lane-coloured dot with a page-background halo,
    // so passing lines appear to pass *behind* it instead of through it.
    parts.push(jsx('circle', {
      cx: tabLaneX(row.lane),
      cy: NODE_Y,
      r: row.commit.head === true ? 4.4 : 3.4,
      className: tabLaneClass(row.lane) + ' dsh-wt-node',
    }, 'node'));
    return parts;
  };

  const graphChildren = [];
  rows.forEach((row, index) => {
    const commit = row.commit;
    const isSelected = index === selected;
    graphChildren.push(jsxs('div', {
      className: 'dsh-wt-crow' + (isSelected ? ' dsh-wt-crow-sel' : ''),
      role: 'button',
      tabIndex: -1,
      onClick: () => { setSelected(index === selected ? -1 : index); },
      children: [
        jsxs('div', { className: 'dsh-wt-crow-lane', style: { width: laneWidth + 'px' }, children: [
          jsx('svg', { width: laneWidth, height: ROW_H, 'aria-hidden': true, children: rowSvg(row) }),
          commit.head === true && jsx('span', { className: 'dsh-wt-node-ring', style: { left: tabLaneX(row.lane) + 'px' }, 'data-lane': row.lane % 4 }),
        ] }),
        jsxs('div', { className: 'dsh-wt-topic', children: [
          jsx('span', { className: 'dsh-wt-subj', children: commit.subject }),
          commit.refs.map((ref, refIndex) => jsx('span', {
            className: 'dsh-wt-ref',
            'data-kind': ref.kind,
            children: ref.kind === 'head' ? (ref.name == null ? 'HEAD' : 'HEAD → ' + ref.name) : ref.name,
          }, refIndex)),
          jsx('span', { className: 'dsh-wt-hash', children: commit.short }),
        ] }),
        jsx('span', { className: 'dsh-wt-when', children: tabRelative(commit.at) }),
      ],
    }, commit.hash));
  });

  const graph = jsxs('div', { className: 'dsh-wt-pane', children: [
    jsxs('div', { className: 'dsh-wt-pane-head', children: [
      jsx('span', { className: 'dsh-wt-pane-title', children: t('tab.graph') }),
      jsxs('span', { className: 'dsh-wt-pane-meta', children: [
        jsx('span', { children: t('tab.commits', { n: String(page?.total ?? rows.length) }) }),
        jsx('span', { children: t('tab.lanes', { n: String(lanes) }) }),
      ] }),
      jsx('span', { className: 'dsh-wt-grow' }),
      logLoading === true && jsx(SpinnerIcon, { size: 13 }),
      jsx('button', {
        type: 'button',
        className: 'dsh-wt-mini',
        onClick: () => { void refreshLog(); },
        children: t('tab.refresh'),
      }),
    ] }),
    rows.length === 0
      ? jsx('div', { className: 'dsh-wt-graph dsh-wt-graph-empty', children: jsx('span', { className: 'dsh-wt-empty', children: t('tab.graphEmpty') }) })
      : jsx('div', { className: 'dsh-wt-graph', ref: graphRef, children: graphChildren }),
    selected >= 0 && rows[selected] !== undefined && jsxs('div', { className: 'dsh-wt-detail', 'data-testid': 'dsh-worktree-commit-detail', children: [
      jsxs('div', { className: 'dsh-wt-detail-head', children: [
        jsx('span', { className: 'dsh-wt-detail-hash', children: rows[selected].commit.short }),
        jsx('span', { className: 'dsh-wt-detail-subj', children: rows[selected].commit.subject }),
      ] }),
      jsxs('div', { className: 'dsh-wt-detail-meta', children: [
        jsx('span', { children: t('detail.author') + ' ' + rows[selected].commit.author }),
        jsx('span', { children: tabRelative(rows[selected].commit.at) }),
        jsx('span', { children: t('detail.parents', { n: String(rows[selected].commit.parents.length) }) }),
      ] }),
    ] }),
  ] });

  // --- rack ----------------------------------------------------------------

  const rackCards = [];
  if (currentWorktree !== null) {
    rackCards.push(jsxs('div', {
      className: 'dsh-wt-card' + (currentWorktree.isCurrent === true ? ' dsh-wt-card-here' : ''),
      'data-testid': 'dsh-worktree-rack-main',
      children: [
        jsxs('div', { className: 'dsh-wt-card-top', children: [
          jsx('span', { className: 'dsh-wt-led', 'data-tone': (currentWorktree.dirtyCount ?? 0) > 0 ? 'dirty' : 'ok' }),
          jsx('span', { className: 'dsh-wt-card-name', children: currentWorktree.branch ?? t('tab.detached') }),
          jsx('span', { className: 'dsh-wt-card-tag', children: t('rack.main') }),
        ] }),
        jsxs('div', { className: 'dsh-wt-card-sub', children: [
          jsx('span', { className: 'dsh-wt-pin', children: '◆' }),
          jsx('span', { className: 'dsh-wt-card-path', children: currentWorktree.path }),
          jsx('span', { className: 'dsh-wt-card-dirty', 'data-tone': (currentWorktree.dirtyCount ?? 0) > 0 ? 'warn' : undefined, children: currentWorktree.dirtyCount == null ? '' : ((currentWorktree.dirtyCount > 0 ? t('rack.dirtyN', { n: String(currentWorktree.dirtyCount) }) : t('rack.clean'))) }),
        ] }),
      ],
    }, 'main'));
  }
  for (const entry of poolWorktrees) {
    rackCards.push(jsxs('div', {
      className: 'dsh-wt-card',
      'data-testid': 'dsh-worktree-rack-entry',
      children: [
        jsxs('div', { className: 'dsh-wt-card-top', children: [
          jsx('span', { className: 'dsh-wt-led', 'data-tone': (entry.dirtyCount ?? 0) > 0 ? 'dirty' : 'ok' }),
          jsx('span', { className: 'dsh-wt-card-name', children: entry.name }),
          jsx('span', { className: 'dsh-wt-card-branch', children: entry.branch ?? t('tab.detached') }),
        ] }),
        jsx('div', { className: 'dsh-wt-card-sub', children: jsx('span', { className: 'dsh-wt-card-path', children: entry.path }) }),
        jsxs('div', { className: 'dsh-wt-card-acts', children: [
          jsx('button', {
            type: 'button',
            className: 'dsh-wt-mini dsh-wt-mini-pri',
            disabled: busy !== null,
            onClick: () => { void openSessionIn(entry.path); },
            children: busy?.kind === 'open' && busy.path === entry.path ? t('action.opening') : t('rack.enter'),
          }),
          jsx('button', {
            type: 'button',
            className: 'dsh-wt-mini',
            disabled: busy !== null,
            'aria-haspopup': 'dialog',
            onClick: () => { setConfirmState({ kind: 'remove-wt', path: entry.path, dirtyCount: entry.dirtyCount ?? 0, force: false }); },
            children: busy?.kind === 'remove' && busy.path === entry.path ? t('action.removing') : t('rack.remove'),
          }),
        ] }),
        confirmState?.kind === 'remove-wt' && confirmState.path === entry.path && jsxs('div', {
          className: 'dsh-wt-cf',
          'data-tone': confirmState.dirtyCount > 0 ? 'error' : 'warn',
          'data-testid': 'dsh-worktree-confirm-remove',
          children: [
            jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('confirm.remove.title')] }),
            jsx('span', { className: 'dsh-wt-cf-body', children: confirmState.dirtyCount > 0
              ? t('confirm.remove.body', { name: entry.name })
              : t('tab.removeWt.body', { branch: entry.branch ?? '' }) }),
            jsxs('div', { className: 'dsh-wt-cf-acts', children: [
              jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-mini dsh-wt-mini-danger',
                disabled: busy !== null,
                onClick: () => { void removeWorktree(entry.path, confirmState.dirtyCount > 0); },
                children: t('confirm.remove.proceed'),
              }),
            ] }),
          ],
        }),
      ],
    }, entry.path));
  }

  const branchRows = localBranches.map((branch, index) => {
    const holder = worktreeByBranch.get(branch.name) ?? null;
    const menuOpen = menuBranch === branch.name;
    const openUp = index >= localBranches.length - 2;
    return jsxs('div', { className: 'dsh-wt-branch-wrap', key: branch.name, children: [
      jsxs('div', {
        className: 'dsh-wt-br' + (branch.current === true ? ' dsh-wt-br-cur' : '') + (menuOpen ? ' dsh-wt-br-open' : ''),
        children: [
          jsx('span', { className: 'dsh-wt-br-icon', children: branch.current === true ? jsx(BranchIcon, { size: 12 }) : jsx(BranchIcon, { size: 12, style: { opacity: 0.7 } }) }),
          jsx('span', { className: 'dsh-wt-br-name', children: branch.name }),
          jsxs('span', { className: 'dsh-wt-br-side', children: [
            branch.current === true && jsx('span', { className: 'dsh-wt-badge', children: t('branch.current') }),
            holder !== null && jsx('span', { className: 'dsh-wt-badge', 'data-tone': 'wt', children: holder.name }),
          ] }),
          jsx('button', {
            type: 'button',
            className: 'dsh-wt-more',
            'aria-haspopup': 'menu',
            'aria-expanded': menuOpen,
            'aria-label': t('branch.more'),
            onClick: () => { setMenuBranch(menuOpen ? null : branch.name); setConfirmState(null); },
            children: '⋯',
          }),
          menuOpen === true && jsxs('div', {
            className: 'dsh-wt-menu' + (openUp ? ' dsh-wt-menu-up' : ''),
            role: 'menu',
            children: [
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-menu-item',
                role: 'menuitem',
                disabled: branch.current === true || holder !== null,
                onClick: () => { void switchTo(branch.name); },
                children: t('branch.checkout'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-menu-item',
                role: 'menuitem',
                disabled: holder !== null,
                onClick: () => { setMenuBranch(null); setCreateOpen(true); setCreateName(branch.name); setCreateBase('HEAD'); },
                children: t('branch.makeWorktree'),
              }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-menu-item',
                role: 'menuitem',
                onClick: () => { void copyName(branch.name); },
                children: t('branch.copy'),
              }),
              jsx('hr', { className: 'dsh-wt-menu-sep' }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-menu-item dsh-wt-menu-danger',
                role: 'menuitem',
                onClick: () => { void runDelete(branch.name); },
                children: t('branch.delete'),
              }),
            ],
          }),
        ],
      }),
      confirmState !== null && confirmState.branch === branch.name && confirmDeleteBlock(),
    ] });
  });

  function confirmDeleteBlock() {
    const state = confirmState;
    if (state.kind === 'delete-occupied') {
      return jsxs('div', { className: 'dsh-wt-cf', 'data-tone': 'error', 'data-testid': 'dsh-worktree-confirm-delete-occupied', children: [
        jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('tab.delete.title', { branch: state.branch })] }),
        jsx('span', { className: 'dsh-wt-cf-body', children: state.current === true
          ? t('tab.delete.current')
          : t('tab.delete.occupied', { path: state.path ?? '' }) }),
        jsxs('div', { className: 'dsh-wt-cf-acts', children: [
          state.current !== true && jsx('button', {
            type: 'button',
            className: 'dsh-wt-mini',
            onClick: () => {
              setConfirmState(null);
              const target = poolWorktrees.find((entry) => entry.branch === state.branch);
              if (target !== undefined) void removeWorktree(target.path);
            },
            children: t('tab.delete.gotoWt'),
          }),
          jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
        ] }),
      ] });
    }
    if (state.kind === 'delete-unmerged') {
      return jsxs('div', { className: 'dsh-wt-cf', 'data-tone': 'warn', 'data-testid': 'dsh-worktree-confirm-delete-unmerged', children: [
        jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('tab.delete.title', { branch: state.branch })] }),
        jsx('span', { className: 'dsh-wt-cf-body', children: t('tab.delete.unmerged', { n: String(state.unmerged ?? '?'), trunk: state.trunk ?? t('tab.delete.upstream') }) }),
        jsxs('label', { className: 'dsh-wt-cf-check', children: [
          jsx('input', {
            type: 'checkbox',
            checked: state.force === true,
            onChange: (event) => { setConfirmState({ ...state, force: event.target.checked }); },
          }),
          t('tab.delete.forceCheck'),
        ] }),
        jsxs('div', { className: 'dsh-wt-cf-acts', children: [
          jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
          jsx('button', {
            type: 'button',
            className: 'dsh-wt-mini dsh-wt-mini-danger',
            disabled: state.force !== true || busy !== null,
            onClick: () => { void runDelete(state.branch, true); },
            children: busy?.kind === 'delete' ? t('action.removing') : t('tab.delete.force'),
          }),
        ] }),
      ] });
    }
    if (state.kind === 'delete-failed') {
      return jsxs('div', { className: 'dsh-wt-cf', 'data-tone': 'error', children: [
        jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('error.removeFailed')] }),
        jsx('span', { className: 'dsh-wt-cf-body', children: state.message ?? t('error.unexpected') }),
        jsx('div', { className: 'dsh-wt-cf-acts', children: [
          jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
        ] }),
      ] });
    }
    return null;
  }

  const rail = jsxs('aside', { className: 'dsh-wt-rail', ref: railRef, children: [
    jsxs('div', { className: 'dsh-wt-rail-head', children: [
      jsx('span', { className: 'dsh-wt-pane-title', children: t('rack.title') }),
      jsx('span', { className: 'dsh-wt-pane-meta', children: jsx('span', { children: t('rack.poolCount', { n: String(poolWorktrees.length) }) }) }),
      jsx('span', { className: 'dsh-wt-grow' }),
      jsx('button', {
        type: 'button',
        className: 'dsh-wt-mini',
        onClick: () => { setCreateOpen(!createOpen); setConfirmState(null); },
        children: t('create.worktreeAction'),
      }),
    ] }),
    jsxs('div', { className: 'dsh-wt-rail-body', children: [
      rackCards,
      createOpen === false
        ? jsx('button', {
            type: 'button',
            className: 'dsh-wt-create-toggle',
            onClick: () => { setCreateOpen(true); },
            children: t('rack.create'),
          })
        : jsxs('div', { className: 'dsh-wt-create', 'data-testid': 'dsh-worktree-create-form', children: [
            jsxs('div', { className: 'dsh-wt-create-head', children: [
              jsx('span', { className: 'dsh-wt-create-title', children: t('create.worktreeTitle') }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-create-x',
                'aria-label': t('error.cancel'),
                onClick: closeCreate,
                children: '✕',
              }),
            ] }),
            jsx('div', { className: 'dsh-wt-create-row', children: jsx('input', {
              type: 'text',
              value: createName,
              placeholder: t('create.namePlaceholder'),
              'aria-label': t('create.namePlaceholder'),
              spellCheck: false,
              onChange: (event) => { setCreateName(event.target.value); },
              onKeyDown: (event) => { if (event.key === 'Enter') void submitCreate(); },
            }) }),
            jsx('div', { className: 'dsh-wt-create-row', children: jsxs('select', {
              value: createBase,
              'aria-label': t('create.from'),
              onChange: (event) => { setCreateBase(event.target.value); },
              children: [
                jsx('option', { value: 'HEAD', children: t('create.fromHead') }),
                status.trunkBranch != null && jsx('option', { value: status.trunkBranch, children: status.trunkBranch }),
                ...localBranches.filter((branch) => branch.name !== status.trunkBranch && branch.current !== true)
                  .map((branch) => jsx('option', { value: branch.name, children: branch.name }, branch.name)),
              ],
            }) }),
            jsxs('div', { className: 'dsh-wt-create-foot', children: [
              jsx('span', { className: 'dsh-wt-create-hint', children: status.poolPath }),
              jsx('span', { className: 'dsh-wt-grow' }),
              jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: closeCreate, children: t('error.cancel') }),
              jsx('button', {
                type: 'button',
                className: 'dsh-wt-mini dsh-wt-mini-pri',
                disabled: createName.trim().length === 0 || busy !== null,
                onClick: () => { void submitCreate(); },
                children: busy?.kind === 'worktree' ? t('create.creating') : t('create.worktreeSubmit'),
              }),
            ] }),
          ] }),
      jsxs('div', { className: 'dsh-wt-sec', children: [
        jsx('span', { className: 'dsh-wt-sec-title', children: t('branches.local') }),
        jsx('span', { className: 'dsh-wt-sec-n', children: String(localBranches.length) }),
      ] }),
      branchRows,
      confirmState?.kind === 'dirty-switch' && jsxs('div', { className: 'dsh-wt-cf', 'data-tone': 'warn', 'data-testid': 'dsh-worktree-confirm-dirty', children: [
        jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('confirm.dirty.title')] }),
        jsx('span', { className: 'dsh-wt-cf-body', children: t('confirm.dirty.body', { n: String(confirmState.count) }) }),
        jsxs('div', { className: 'dsh-wt-cf-acts', children: [
          jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
          jsx('button', { type: 'button', className: 'dsh-wt-mini dsh-wt-mini-danger', onClick: () => { void switchTo(confirmState.branch, true); }, children: t('confirm.dirty.proceed') }),
        ] }),
      ] }),
      confirmState?.kind === 'occupied-switch' && jsxs('div', { className: 'dsh-wt-cf', 'data-tone': 'error', children: [
        jsxs('span', { className: 'dsh-wt-cf-title', children: [jsx(WarningIcon, { size: 13 }), t('confirm.occupied.title')] }),
        jsx('span', { className: 'dsh-wt-cf-body', children: t('confirm.occupied.body', { branch: confirmState.branch, name: tabBaseName(confirmState.path ?? '') }) }),
        jsxs('div', { className: 'dsh-wt-cf-acts', children: [
          jsx('button', { type: 'button', className: 'dsh-wt-mini', onClick: () => { setConfirmState(null); }, children: t('error.cancel') }),
          jsx('button', { type: 'button', className: 'dsh-wt-mini dsh-wt-mini-pri', onClick: () => { void openSessionIn(confirmState.path); }, children: t('confirm.occupied.open') }),
        ] }),
      ] }),
    ] }),
  ] });

  // --- page ----------------------------------------------------------------

  return jsxs('div', {
    className: 'dsh-wt-tab',
    'data-testid': 'dsh-worktree-tab',
    children: [
      readout,
      jsxs('div', { className: 'dsh-wt-stage', children: [graph, rail] }),
      jsxs('div', { className: 'dsh-wt-tabbar', children: [
        jsx('span', { children: t('tab.statusCount', { wt: String(status.worktrees.length), br: String(localBranches.length) }) }),
        jsx('span', { className: 'dsh-wt-grow' }),
        notice !== null && jsx('span', { className: 'dsh-wt-tabbar-note', 'data-tone': 'error', children: notice.message }),
        toast !== null && jsx('span', { className: 'dsh-wt-tabbar-note', 'data-tone': 'ok', children: toast }),
        jsx('span', { className: 'dsh-wt-tabbar-hint', children: t('tab.hint') }),
      ] }),
    ],
  });
}

/**
 * One lane bend between two rows: a cubic whose control points keep the turn
 * within one lane width, so a crossing reads as a deliberate elbow.
 */
function tabElbow(fromLane, toLane, fromY, toY) {
  const x0 = tabLaneX(fromLane);
  const x1 = tabLaneX(toLane);
  const dy = toY - fromY;
  const k = Math.min(dy * 0.5, Math.abs(x1 - x0) * 1.15);
  return 'M' + x0 + ' ' + fromY + ' C ' + x0 + ' ' + (fromY + k) + ', ' + x1 + ' ' + (toY - k) + ', ' + x1 + ' ' + toY;
}
//#endregion

//#region client/decor.js
/**
 * Sidebar and session-header decorations: a leading worktree/branch mark on
 * each session row, a branch line in the row's hover card, and a chip at the
 * far right of the conversation header.
 * @module dsh-worktree/client/decor
 */




/** Current working directory of one session from the framework sessions hook. */
function useSessionCwd(useSessions, sessionId) {
  const selector = (snapshot) => snapshot?.byId?.[sessionId]?.cwd;
  return typeof useSessions === 'function' ? useSessions(selector) : undefined;
}

/** Subscribe one path to the shared git-info cache. */
function useGitInfo(store, path) {
  const [snap, setSnap] = useState(() => store.currentOf(path));
  useEffect(() => {
    if (path === undefined) {
      setSnap(undefined);
      return undefined;
    }
    setSnap(store.currentOf(path));
    return store.watch(path, setSnap);
  }, [store, path]);
  return snap;
}

/** Subscribe one session to the store's session-scoped facts. */
function useSessionInfo(store, sessionId) {
  const [snap, setSnap] = useState(() => store.currentSessionOf(sessionId));
  useEffect(() => {
    setSnap(store.currentSessionOf(sessionId));
    return store.subscribe(() => {
      setSnap(store.currentSessionOf(sessionId));
    });
  }, [store, sessionId]);
  return snap;
}

/**
 * Leading 16px cell mark: a worktree glyph only for a *linked* checkout, a
 * plain branch glyph for the main checkout, nothing outside a repository.
 *
 * The mark reads the session's checkout facts from the plugin's own `status`,
 * not from the framework's session summary. Moving a session into a worktree
 * changes the directory the agent runs in while the summary keeps reporting the
 * original `cwd`, so the summary cannot tell a worktree session from a plain one.
 * @param props.sessionId - row session identity (owner props).
 * @param props.worktree - the API bundle ({ api, store }).
 * @param props.useSessions - framework hook over the sessions snapshot.
 * @param props.t - locale seat.
 */
function SessionLeadingMark({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  // Prefer the session's own facts; fall back to the directory lookup while the
  // first status call is still in flight so a row never flashes empty.
  const sessionInfo = useSessionInfo(worktree.store, sessionId);
  const info = useGitInfo(worktree.store, sessionInfo === undefined && cwd !== undefined ? cwd : undefined);
  const facts = sessionInfo ?? info;
  if (facts === undefined || facts.isRepo !== true) return null;
  const isWorktree = facts.isWorktree === true && facts.worktreeName !== null && facts.worktreeName !== undefined;
  const branch = (isWorktree === true ? facts.worktreeBranch ?? facts.branch : facts.branch) ?? facts.branch ?? '';
  const title = isWorktree === true
    ? t('sidebar.worktreeTitle', { name: facts.worktreeName ?? '', branch })
    : t('sidebar.branchTitle', { branch: branch === '' ? facts.branch ?? '' : branch });
  return jsx('span', {
    className: 'dsh-wt-leading',
    'data-variant': isWorktree === true ? 'worktree' : 'branch',
    'data-testid': 'dsh-worktree-row-mark',
    title,
    role: 'img',
    'aria-label': title,
    children: isWorktree === true ? jsx(WorktreeIcon, { size: 14 }) : jsx(BranchIcon, { size: 14 }),
  });
}

/**
 * Hover-card section: the worktree/branch identity of the hovered session.
 *
 * Uses the same session facts as the row mark, so a hovered worktree row always
 * reports the worktree the mark is showing.
 */
function SessionHoverInfo({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  const sessionInfo = useSessionInfo(worktree.store, sessionId);
  const info = useGitInfo(worktree.store, sessionInfo === undefined && cwd !== undefined ? cwd : undefined);
  const facts = sessionInfo ?? info;
  if (facts === undefined || facts.isRepo !== true) return null;
  const isWorktree = facts.isWorktree === true;
  const branch = (isWorktree === true ? facts.worktreeBranch ?? facts.branch : facts.branch) ?? facts.branch ?? '';
  const text = isWorktree === true
    ? t('sidebar.worktreeLine', { name: facts.worktreeName ?? '', branch: branch === '' ? '—' : branch })
    : t('sidebar.branchLine', { branch: branch === '' ? '—' : branch });
  return jsxs('div', {
    className: 'dsh-wt-hover',
    'data-variant': isWorktree === true ? 'worktree' : 'branch',
    'data-testid': 'dsh-worktree-hover-info',
    children: [
      jsx('span', { className: 'dsh-wt-hover-icon', children: isWorktree === true ? jsx(WorktreeIcon, { size: 13 }) : jsx(BranchIcon, { size: 13 }) }),
      jsx('span', { className: 'dsh-wt-hover-text', title: facts.cwd ?? cwd, children: text }),
    ],
  });
}
//#endregion

//#region client/entry.js
/**
 * Client entry: mounts the shared Remote contract, registers dictionaries,
 * styles, and the five UI seats — the worktree tab first: it is the plugin's
 * only full-page surface, riding the host's native conversation-view slot
 * beside Chat and Trajectory. Inlined into the built factory file.
 * @module dsh-worktree/client/entry
 */

/** Cordis plugin name of this client half. */
const CLIENT_NAME = 'dsh-worktree';

/** Hard client dependencies: the Remote mount, slots, locale, and the workspace/session faces. */
const CLIENT_INJECT = ['remote', 'slots', 'locale', 'workspaces', 'sessions', 'uiWorkspace'];

/**
 * Mount the namespace and register every UI seat.
 * @param {object} ctx - client root context.
 */
async function apply(ctx) {
  try {
    await applyInner(ctx);
  } catch (error) {
    console.error('dsh-worktree: apply failed:', error);
    throw error;
  }
}

async function applyInner(ctx) {
  await ctx.remote.$mount(WORKTREE_REMOTE);
  const api = createWorktreeApi(ctx);
  const store = new GitInfoStore(api);
  const bundle = { api, store };

  ctx.effect(() => ctx.locale.register('worktree', { zh, en }), 'dsh-worktree: dictionaries');
  ctx.effect(() => {
    const tag = document.createElement('style');
    tag.dataset.plugin = 'dsh-worktree';
    tag.textContent = CSS;
    document.head.append(tag);
    return () => {
      tag.remove();
    };
  }, 'dsh-worktree: styles');
  ctx.effect(() => () => {
    store.dispose();
  }, 'dsh-worktree: git info store');

  // Registration-time tab text reads through the bound translate as a thunk,
  // so the label follows the active locale without re-registration.
  const t = ctx.locale.bind('worktree');

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'worktree',
    order: 20,
    locale: 'worktree',
    label: () => t('view.worktree'),
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, WorktreeView));

  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'dsh-worktree-picker',
    order: -5,
    locale: 'worktree',
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, BranchPicker));

  ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
    name: 'sidebar.session.row.leading',
    id: 'dsh-worktree-mark',
    locale: 'worktree',
    inject: () => ({ worktree: bundle }),
  }, SessionLeadingMark));

  ctx.slots.inject('sidebar.session.row.hover', () => ctx.slots.register({
    name: 'sidebar.session.row.hover',
    id: 'dsh-worktree-hover',
    locale: 'worktree',
    inject: () => ({ worktree: bundle }),
  }, SessionHoverInfo));
}
//#endregion

    /** The client plugin definition the cordis client runner mounts. */
    return { name: CLIENT_NAME, inject: CLIENT_INJECT, apply };
  },
});
