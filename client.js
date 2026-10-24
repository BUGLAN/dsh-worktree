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
 *
 * Failure codes the UI branches on:
 *   not-a-repo, session-unavailable, invalid-name, branch-not-found,
 *   branch-exists, branch-occupied, dirty-tree, switch-conflict, switch-failed,
 *   path-exists, create-failed, remove-failed, dirty-worktree, not-a-directory.
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
  'row.moveTo': "Move to {name}",
  'hint.relocated': "Moved to {name} · {branch}",
  'create.prefixHint': "Checkout directory created for this worktree",
  'create.previewHint': "Branch name as stored: slashes become dashes in the label",
  'create.branchPlaceholder': "New branch name, e.g. feature/login",
  'create.worktreePlaceholder': "Worktree branch name",
  'create.branchAction': "Branch",
  'create.worktreeAction': "Permanent worktree",
  'create.branchTitle': "Create and check out a branch here",
  'create.worktreeTitle': "Create a permanent worktree",
  'create.branchSubmit': "Create branch",
  'create.worktreeSubmit': "Create worktree",
  'create.submitting': "Creating…",
  'create.branchOk': "Created and checked out {branch}",
  'create.worktreeOk': "Created worktree for {branch} at {path}",
  'confirm.dirtyCreate.title': "Uncommitted changes",
  'confirm.dirtyCreate.body': "This checkout has {n} uncommitted change(s). Branch {branch} keeps them as uncommitted work.",
  'confirm.dirtyCreate.proceed': "Create anyway",
  'trigger.branch': 'Branch',
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
  'status.mainCheckout': 'Main checkout',
  'row.current': 'Current',
  'row.here': 'here',
  'row.occupied': 'Checked out in {name}',
  'row.hasLocal': 'Local branch exists',
  'row.openSession': 'Open session in this worktree',
  'row.remove': 'Remove this worktree',
  'row.enter': 'Move current session here',
  'create.title': 'Create and check out new branch',
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
  'confirm.dirty.body': 'This checkout has {n} uncommitted change(s). Switching carries them to the new branch; Git refuses when they conflict.',
  'confirm.dirty.proceed': 'Switch anyway',
  'confirm.dirty.worktree': 'Create worktree instead',
  'confirm.occupied.title': 'Branch already checked out',
  'confirm.occupied.body': 'Branch {branch} is checked out in worktree {name}. Git cannot check it out in two places.',
  'confirm.occupied.open': 'Open that worktree',
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
  'hint.enterDone': 'Session moved into {path}',
  'hint.sessionOpened': 'Opened a session in {name}',
  'hint.removed': 'Removed {name}',
  'header.worktree': '{branch} · worktree {name}',
  'header.branch': 'Branch {branch}',
  'sidebar.worktreeTitle': 'worktree {name} · branch {branch}',
  'sidebar.branchTitle': 'branch {branch}',
  'sidebar.dirty': '{n} uncommitted',
  'sidebar.worktreeLine': 'Worktree {name} · {branch}',
  'sidebar.branchLine': 'Branch {branch}',
};

const zh = {
  'row.moveTo': "迁移到 {name}",
  'hint.relocated': "已迁移到 {name} · {branch}",
  'create.prefixHint': "此工作树的检出目录",
  'create.previewHint': "分支名中的斜杠在显示时转为短横线",
  'create.branchPlaceholder': "新分支名，例如 feature/login",
  'create.worktreePlaceholder': "工作树分支名",
  'create.branchAction': "分支",
  'create.worktreeAction': "永久工作树",
  'create.branchTitle': "在当前检出创建并迁出分支",
  'create.worktreeTitle': "创建永久工作树",
  'create.branchSubmit': "创建分支",
  'create.worktreeSubmit': "创建工作树",
  'create.submitting': "创建中…",
  'create.branchOk': "已创建并迁出分支 {branch}",
  'create.worktreeOk': "已为 {branch} 创建永久工作树：{path}",
  'confirm.dirtyCreate.title': "存在未提交更改",
  'confirm.dirtyCreate.body': "当前检出有 {n} 个未提交更改。分支 {branch} 会把这些更改作为未提交内容保留。",
  'confirm.dirtyCreate.proceed': "仍然创建",
  'trigger.branch': '分支',
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
  'status.mainCheckout': '主检出',
  'row.current': '当前',
  'row.here': '当前',
  'row.occupied': '检出位于 {name}',
  'row.hasLocal': '已有对应本地分支',
  'row.openSession': '在此 worktree 中打开会话',
  'row.remove': '移除此 worktree',
  'row.enter': '当前会话进入该目录',
  'create.title': '创建并检出新分支',
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
  'confirm.dirty.body': '当前检出有 {n} 个未提交更改。切换分支会把这些更改带到目标分支；如有冲突 Git 会拒绝切换。',
  'confirm.dirty.proceed': '仍要切换',
  'confirm.dirty.worktree': '改为创建 worktree',
  'confirm.occupied.title': '分支已被检出',
  'confirm.occupied.body': '分支 {branch} 已在 worktree {name} 中检出，Git 不允许同一分支在两处检出。',
  'confirm.occupied.open': '打开该 worktree',
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
  'hint.enterDone': '会话已进入 {path}',
  'hint.sessionOpened': '已在 {name} 中打开会话',
  'hint.removed': '已移除 {name}',
  'header.worktree': '{branch} · worktree {name}',
  'header.branch': '分支 {branch}',
  'sidebar.worktreeTitle': 'worktree {name} · 分支 {branch}',
  'sidebar.branchTitle': '分支 {branch}',
  'sidebar.dirty': '{n} 个未提交',
  'sidebar.worktreeLine': 'Worktree {name} · {branch}',
  'sidebar.branchLine': '分支 {branch}',
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
 * @module dsh-worktree/client/styles
 */

const CSS = `
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}

@keyframes dsh-wt-enter{from{opacity:0;transform:translateY(4px) scale(.985)}to{opacity:1;transform:none}}
@keyframes dsh-wt-row-in{from{opacity:0;transform:translateX(-3px)}to{opacity:1;transform:none}}

/* ---- composer toolbar trigger ---- */
/* Keeps the toolbar's width stable while the first repository lookup runs, so the
   row does not jump once the trigger is either drawn or dropped. */
.dsh-wt-trigger-placeholder{display:inline-block;width:0;height:28px;flex:none}
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 5px 0 7px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:190px;transition:background .12s ease,color .12s ease}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.08));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:active:not(:disabled){transform:translateY(.5px)}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;opacity:.9}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;opacity:.65}
.dsh-wt-trigger[data-variant="worktree"]{color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:352px;max-width:calc(100vw - 16px);background:var(--dsw-alias-bg-layer-2,var(--dsw-alias-bg-overlay,Canvas));border:1px solid var(--dsw-alias-border-l2,var(--dsw-alias-border-l1));border-radius:12px;box-shadow:0 1px 2px rgba(0,0,0,.28),0 14px 34px -8px rgba(0,0,0,.55),inset 0 1px 0 rgba(255,255,255,.045);display:flex;flex-direction:column;height:min(260px,calc(100vh - 88px));overflow:hidden;color:var(--dsw-alias-label-primary,CanvasText);font-size:13px;animation:dsh-wt-enter .14s cubic-bezier(.22,1,.36,1)}
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

/* branch rows: icon colour only; the label keeps full contrast */
.dsh-wt-panel .dsh-wt-row[data-kind="worktree"] .dsh-wt-row-icon,.dsh-wt-panel .dsh-wt-row-icon[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}

/* rows */
.dsh-wt-panel .dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 11px;margin:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:18px;text-align:left;cursor:pointer;border-radius:0;animation:dsh-wt-row-in .16s ease both}
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
.dsh-wt-panel .dsh-wt-create-toggle{display:flex;align-items:center;justify-content:center;gap:5px;flex:1;min-width:0;padding:5px 8px;border:1px solid transparent;background:transparent;border-radius:7px;color:var(--dsw-alias-label-secondary);font-size:12.5px;font-weight:500;line-height:17px;cursor:pointer;transition:background .12s ease,color .12s ease,border-color .12s ease}
.dsh-wt-panel .dsh-wt-create-toggle:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.07));color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l1)}
.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled){transform:translateY(.5px)}
.dsh-wt-panel .dsh-wt-create-toggle:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-panel .dsh-wt-create-toggle:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
/* create form: one compact row — name, start point, submit */
.dsh-wt-panel .dsh-wt-create-form{display:flex;align-items:center;gap:5px;padding:5px 6px 4px;animation:dsh-wt-enter .14s cubic-bezier(.22,1,.36,1)}
.dsh-wt-panel .dsh-wt-create-form input[type=text]{flex:1;min-width:0;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:12.5px;line-height:18px;outline:none;transition:border-color .12s ease,box-shadow .12s ease}
.dsh-wt-panel .dsh-wt-create-form input[type=text]::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-family:inherit}
.dsh-wt-panel .dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));box-shadow:0 0 0 3px color-mix(in srgb,var(--dsw-alias-state-business-primary,#4d8dff) 18%,transparent)}
.dsh-wt-panel .dsh-wt-create-form select{flex:none;width:96px;height:28px;padding:0 4px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:var(--dsw-alias-bg-base,Canvas);color:var(--dsw-alias-label-primary);font-family:ui-monospace,SFMono-Regular,"SF Mono",Menlo,Consolas,monospace;font-size:11.5px;line-height:18px;outline:none}
.dsh-wt-panel .dsh-wt-create-form select:focus-visible{outline:none;border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-panel .dsh-wt-create-form .dsh-wt-button{flex:none;height:28px;padding:0 10px}
.dsh-wt-panel .dsh-wt-button{display:inline-flex;align-items:center;gap:5px;height:27px;padding:0 11px;border:none;border-radius:6px;font-size:12.5px;font-weight:500;line-height:18px;cursor:pointer;transition:background .12s ease,filter .12s ease,transform .08s ease}
.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:translateY(.5px)}
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
.dsh-wt-panel .dsh-wt-toast{margin:6px 8px 2px;padding:6px 10px;border-radius:8px;background:color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 10%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-state-success-primary,#30a46c) 40%,transparent);color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px;display:flex;align-items:center;gap:6px}
.dsh-wt-panel .dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:5px;color:var(--dsw-alias-label-secondary);font-size:11.5px;line-height:16px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none;opacity:.85}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));opacity:1}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:10.5px}

@media (prefers-reduced-motion:reduce){
  .dsh-wt-panel,.dsh-wt-panel .dsh-wt-row,.dsh-wt-panel .dsh-wt-create-form{animation:none}
  .dsh-wt-trigger:active:not(:disabled),.dsh-wt-panel .dsh-wt-create-toggle:active:not(:disabled),.dsh-wt-panel .dsh-wt-button:active:not(:disabled){transform:none}
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
      transition: 'transform .12s ease',
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
      });
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
function useAnchoredPanel(open, anchorRef, panelRef, gap = 6, onPlacement = undefined) {
  useEffect(() => {
    if (!open) return;
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
  }, [open, gap, anchorRef, panelRef, onPlacement]);
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
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  useAnchoredPanel(open, anchorRef, panelRef, 6, setPlacement);
  useDismiss(open, anchorRef, panelRef, close);

  const cwd = typeof useSessions === 'function'
    ? useSessions((snapshot) => snapshot?.byId?.[sessionId]?.cwd)
    : undefined;
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
  if (status?.isRepo !== true) return null;

  const variant = status.isWorktree === true ? 'worktree' : 'branch';
  // A worktree reads as `<directory>/<branch>` so the trigger names both the
  // checkout and what is checked out in it.
  const worktreeLabel = status.isWorktree === true
    ? [status.worktreeName, status.branch].filter((part) => typeof part === 'string' && part.length > 0).join('/')
    : '';
  const label = status.isWorktree === true
    ? (worktreeLabel.length > 0 ? worktreeLabel : (status.branch ?? ''))
    : (status.branch ?? t('trigger.detached'));

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
        title: status.isWorktree === true
          ? t('sidebar.worktreeTitle', { name: status.worktreeName ?? '', branch: status.branch ?? '' })
          : t('sidebar.branchTitle', { branch: status.branch ?? t('trigger.detached') }),
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
      open === true && createPortal(
        jsx(BranchPanel, {
          panelRef,
          themeRef: anchorRef,
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
function BranchPanel({ panelRef, themeRef, sessionId, status, loading, cwd, sessionBlank, api, store, t, refresh, onClose }) {
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
  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);
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
      body.scrollTop = body.scrollHeight;
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
   * Move a pristine session into the checkout that holds `branch`, then switch
   * to that branch there.
   *
   * Picking `wt-1a2b/feat-x` from the picker means "work on feat-x", and that
   * branch is only checked out inside `wt-1a2b`. The directory therefore follows
   * the branch: moving the session is the operation, and the switch is a no-op
   * confirmation because the target checkout already has it checked out.
   * @param branch - branch entry from the picker, with its owning worktree.
   */
  const relocateTo = useCallback(async (branch) => {
    const target = branch?.worktree?.path;
    if (typeof target !== 'string' || target.length === 0) {
      // No owning worktree means the branch lives in this checkout after all.
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
        } else {
          fail(t('error.switchFailed'), value);
        }
        return;
      }
      // The directory changed: refresh this session's facts immediately so the
      // trigger and the row mark show the new worktree without waiting.
      store.invalidateSession(sessionId);
      afterMutation(t('hint.relocated', { name: baseName(target), branch: branch.name }));
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
    // Two audiences, one list:
    //  - a pristine session may move anywhere, so every local branch is offered
    //    and picking one from a pool checkout relocates the session with it;
    //  - a session with work in it stays where it is, so only branches this
    //    checkout can actually switch to are shown.
    const locals = (status?.branches ?? [])
      .filter((branch) => branch.kind === 'local')
      .filter((branch) => relocatable || branch.occupiedPath == null)
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
            children: pending === true ? t('panel.sessionPending') : t('panel.notRepo'),
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
                const busyRow = busy !== null && (busy.kind === 'switch' || busy.kind === 'relocate') && (busy.branch === branch.name || busy.path === branch.worktree?.path);
                // A branch held by another checkout is reached by moving there,
                // not by switching in place; the row's own worktree tells which.
                const isElsewhere = branch.occupiedPath != null || (branch.worktree !== null && branch.worktree.isCurrent !== true);
                return jsxs('button', {
                  type: 'button',
                  className: 'dsh-wt-row',
                  // The current branch stays focusable and readable: a real
                  // `disabled` button drops to a dimmed label that disappears on
                  // a light surface, and a check mark is a better "you are here"
                  // than a greyed-out row.
                  'aria-disabled': isCurrent === true ? 'true' : undefined,
                  'data-current': isCurrent === true ? 'true' : undefined,
                  'data-kind': isElsewhere === true ? 'elsewhere' : undefined,
                  style: { animationDelay: `${String(Math.min(index, 8) * 14)}ms` },
                  'data-testid': `dsh-worktree-branch-${branch.name}`,
                  onClick: () => {
                    if (isCurrent === true) return;
                    if (isElsewhere === true) {
                      void relocateTo(branch);
                      return;
                    }
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
                          : isElsewhere === true
                            ? jsx('span', { className: 'dsh-wt-row-sub', children: t('row.moveTo', { name: baseName(branch.worktree?.path ?? branch.occupiedPath ?? '') }) })
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
 * styles, and the four UI seats. Inlined into the built factory file.
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
