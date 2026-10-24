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

/** `request: { sessionId, name, startPoint? }` — create a branch and its worktree. */
function parseCreateRequest(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('request must be an object');
  const startPoint = optionalString(value.startPoint, 'request.startPoint');
  return {
    sessionId: nonEmptyString(value.sessionId, 'request.sessionId'),
    name: nonEmptyString(value.name, 'request.name'),
    ...(startPoint === undefined || startPoint === null ? {} : { startPoint }),
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
  'trigger.branch': 'Branch',
  'trigger.noRepo': 'No repository',
  'trigger.detached': 'Detached',
  'trigger.loading': 'Reading repository…',
  'panel.searchPlaceholder': 'Search branches…',
  'panel.currentSection': 'Working tree',
  'panel.worktreesSection': 'Worktrees',
  'panel.localSection': 'Local branches',
  'panel.remoteSection': 'Remote branches',
  'panel.noMatches': 'No matching branch',
  'panel.poolHint': 'Pool: {path}',
  'panel.repoRoot': 'Repository: {path}',
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
  'row.occupied': 'Checked out in {name}',
  'row.hasLocal': 'Local branch exists',
  'row.openSession': 'Open session in this worktree',
  'row.remove': 'Remove this worktree',
  'row.enter': 'Move current session here',
  'create.title': 'Create and check out new branch',
  'create.namePlaceholder': 'Branch name, e.g. feature/login',
  'create.from': 'Start from',
  'create.fromHead': 'Current HEAD',
  'create.openSession': 'Open in a new session (parallel task)',
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
  'trigger.branch': '分支',
  'trigger.noRepo': '非 Git 仓库',
  'trigger.detached': '分离头指针',
  'trigger.loading': '正在读取仓库…',
  'panel.searchPlaceholder': '搜索分支…',
  'panel.currentSection': '本地文件状态',
  'panel.worktreesSection': 'Worktree',
  'panel.localSection': '本地分支',
  'panel.remoteSection': '远程分支',
  'panel.noMatches': '没有匹配的分支',
  'panel.poolHint': '统一目录：{path}',
  'panel.repoRoot': '仓库：{path}',
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
  'row.occupied': '检出位于 {name}',
  'row.hasLocal': '已有对应本地分支',
  'row.openSession': '在此 worktree 中打开会话',
  'row.remove': '移除此 worktree',
  'row.enter': '当前会话进入该目录',
  'create.title': '创建并检出新分支',
  'create.namePlaceholder': '分支名，例如 feature/login',
  'create.from': '起点',
  'create.fromHead': '当前 HEAD',
  'create.openSession': '在新会话中打开（并行任务）',
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
 * `<style data-plugin="dsh-worktree">` tag and removed with it. Only theme
 * tokens (`--dsw-alias-*`, radii, elevations) reference the host theme; every
 * class is prefixed `dsh-wt-` so nothing leaks into host components.
 * @module dsh-worktree/client/styles
 */

const CSS = `
.dsh-wt-spinner{display:inline-block;border:1.5px solid var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));border-top-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-radius:50%;animation:dsh-wt-spin .7s linear infinite;flex:none}
@keyframes dsh-wt-spin{to{transform:rotate(360deg)}}

/* ---- composer toolbar trigger ---- */
.dsh-wt-trigger{display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 4px 0 8px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-secondary);font-size:13px;font-weight:500;line-height:20px;cursor:pointer;max-width:180px}
.dsh-wt-trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary)}
.dsh-wt-trigger:focus-visible{outline:none;box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-trigger:disabled{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:default}
.dsh-wt-trigger .dsh-wt-trigger-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}
.dsh-wt-trigger .dsh-wt-trigger-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-trigger .dsh-wt-trigger-chevron{display:inline-flex;flex:none;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-trigger[data-variant="worktree"] .dsh-wt-trigger-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
@container (width<=460px){.dsh-wt-trigger .dsh-wt-trigger-label{display:none}}

/* ---- anchored panel ---- */
.dsh-wt-panel{position:fixed;z-index:1100;width:380px;max-width:calc(100vw - 24px);background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay));border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-lg,12px);box-shadow:var(--dsw-elevation-prominent,0 12px 32px rgba(0,0,0,.18));display:flex;flex-direction:column;max-height:min(520px,calc(100vh - 32px));overflow:hidden;color:var(--dsw-alias-label-primary);font-size:13px}
.dsh-wt-panel-search{display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-panel-search input::placeholder{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-panel-body{overflow-y:auto;overscroll-behavior:contain;padding:4px 0 6px}
.dsh-wt-section{margin-top:6px}
.dsh-wt-section-title{display:flex;align-items:center;gap:6px;padding:4px 12px 2px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;font-weight:600;letter-spacing:.02em;text-transform:uppercase;user-select:none}
.dsh-wt-section-title .dsh-wt-section-extra{margin-left:auto;font-weight:400;text-transform:none;letter-spacing:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:180px}
.dsh-wt-row{display:flex;align-items:center;gap:8px;width:100%;padding:5px 12px;border:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:13px;line-height:20px;text-align:left;cursor:pointer}
.dsh-wt-row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dsh-wt-row:focus-visible{outline:none;box-shadow:inset 0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary))}
.dsh-wt-row:disabled{cursor:default;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-row .dsh-wt-row-icon{display:inline-flex;flex:none;color:var(--dsw-alias-label-secondary)}
.dsh-wt-row[data-kind="worktree"] .dsh-wt-row-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-row-main{flex:1;min-width:0;display:flex;flex-direction:column}
.dsh-wt-row-title{display:flex;align-items:center;gap:6px;min-width:0}
.dsh-wt-row-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.dsh-wt-row-sub{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px;line-height:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-row-sub[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-row-check{display:inline-flex;flex:none;color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-row-actions{display:inline-flex;flex:none;gap:2px;opacity:0;transition:opacity .1s}
.dsh-wt-row:hover .dsh-wt-row-actions,.dsh-wt-row:focus-within .dsh-wt-row-actions{opacity:1}
.dsh-wt-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,6px);color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));cursor:pointer}
.dsh-wt-iconbtn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-primary)}
.dsh-wt-iconbtn[data-tone="danger"]:hover{color:var(--dsw-alias-state-error-primary)}
.dsh-wt-badge{flex:none;display:inline-flex;align-items:center;height:16px;padding:0 6px;border-radius:8px;font-size:10.5px;font-weight:600;background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.06));color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-badge[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-badge[data-tone="brand"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}

/* current-checkout status block */
.dsh-wt-current{display:flex;align-items:flex-start;gap:8px;padding:8px 12px;margin:6px 10px 2px;border:1px solid var(--dsw-alias-border-l1);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03))}
.dsh-wt-current-icon{display:inline-flex;flex:none;margin-top:1px;color:var(--dsw-alias-label-secondary)}
.dsh-wt-current-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}
.dsh-wt-current-title{font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-current-sub{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px;line-height:16px}
.dsh-wt-current-sub[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.dsh-wt-note{padding:8px 12px;margin:6px 10px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-meta{padding:2px 12px 4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

/* footer: create form */
.dsh-wt-footer{border-top:1px solid var(--dsw-alias-border-l1);padding:6px 8px}
.dsh-wt-create-toggle{display:flex;align-items:center;gap:8px;width:100%;padding:6px 6px;border:none;background:transparent;border-radius:var(--dsw-radius-sm,8px);color:var(--dsw-alias-label-primary);font-size:13px;font-weight:500;cursor:pointer}
.dsh-wt-create-toggle:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}
.dsh-wt-create-form{display:flex;flex-direction:column;gap:8px;padding:8px 6px 4px}
.dsh-wt-create-form .dsh-wt-field{display:flex;flex-direction:column;gap:4px}
.dsh-wt-create-form label{color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11.5px}
.dsh-wt-create-form input[type=text]{height:30px;padding:0 8px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-create-form input[type=text]:focus{border-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-create-form select{height:30px;padding:0 6px;border:1px solid var(--dsw-alias-border-l2);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;outline:none}
.dsh-wt-checkbox{display:flex;align-items:center;gap:8px;color:var(--dsw-alias-label-primary);font-size:12.5px;cursor:pointer;user-select:none}
.dsh-wt-checkbox input{accent-color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-create-actions{display:flex;justify-content:flex-end;gap:8px}
.dsh-wt-button{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 12px;border:none;border-radius:var(--dsw-radius-sm,8px);font-size:13px;font-weight:500;cursor:pointer}
.dsh-wt-button:disabled{cursor:default;opacity:.6}
.dsh-wt-button[data-variant="primary"]{background:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));color:#fff}
.dsh-wt-button[data-variant="plain"]{background:transparent;color:var(--dsw-alias-label-secondary)}
.dsh-wt-button[data-variant="plain"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05));color:var(--dsw-alias-label-primary)}
.dsh-wt-button[data-variant="danger"]{background:transparent;color:var(--dsw-alias-state-error-primary)}
.dsh-wt-button[data-variant="danger"]:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.05))}

/* inline confirm / error area */
.dsh-wt-confirm{margin:6px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-state-warn-primary);border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.03));display:flex;flex-direction:column;gap:6px}
.dsh-wt-confirm-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-warn-primary);font-weight:600;font-size:12.5px}
.dsh-wt-confirm-body{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-confirm-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:72px;overflow-y:auto}
.dsh-wt-confirm-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.dsh-wt-error{margin:6px 10px;padding:8px 10px;border:1px solid var(--dsw-alias-state-error-primary);border-radius:var(--dsw-radius-sm,8px);display:flex;flex-direction:column;gap:6px}
.dsh-wt-error-title{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-state-error-primary);font-weight:600;font-size:12.5px}
.dsh-wt-error-body{color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-error-body .dsh-wt-confirm-detail{display:block;margin-top:4px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary));font-size:11px;white-space:pre-wrap;word-break:break-all;max-height:72px;overflow-y:auto}
.dsh-wt-toast{margin:6px 10px;padding:6px 10px;border-radius:var(--dsw-radius-sm,8px);background:var(--dsw-alias-interactive-bg-hover,rgba(0,0,0,.04));color:var(--dsw-alias-label-secondary);font-size:12px;display:flex;align-items:center;gap:6px}
.dsh-wt-toast .dsh-wt-row-check{color:var(--dsw-alias-state-success-primary)}

/* ---- session header chip ---- */
.dsh-wt-chip{display:inline-flex;align-items:center;gap:6px;height:24px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;max-width:260px;white-space:nowrap;overflow:hidden}
.dsh-wt-chip .dsh-wt-chip-icon{display:inline-flex;flex:none}
.dsh-wt-chip[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary));border-color:var(--dsw-alias-border-l2)}
.dsh-wt-chip .dsh-wt-chip-label{overflow:hidden;text-overflow:ellipsis}

/* ---- sidebar decorations ---- */
.dsh-wt-leading{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;color:var(--dsw-alias-label-dimmed,var(--dsw-alias-label-secondary))}
.dsh-wt-leading[data-variant="worktree"]{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover{display:flex;align-items:center;gap:6px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px}
.dsh-wt-hover .dsh-wt-hover-icon{display:inline-flex;flex:none}
.dsh-wt-hover[data-variant="worktree"] .dsh-wt-hover-icon{color:var(--dsw-alias-state-business-primary,var(--dsw-alias-brand-primary))}
.dsh-wt-hover .dsh-wt-hover-text{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dsh-wt-hover .dsh-wt-hover-dirty{flex:none;color:var(--dsw-alias-state-warn-primary);font-size:11px}
`;
//#endregion

//#region client/icons.js
/**
 * Inline SVG icons for the worktree UI. All icons inherit `currentColor` and
 * default to 16px so they sit inside the composer toolbar and sidebar cells.
 * @module dsh-worktree/client/icons
 */


function Svg({ size = 16, children, ...rest }) {
  return jsx('svg', {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...rest,
    children,
  });
}

/** One branch leaving the trunk: the plain-branch mark. */
function BranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M4.5 4.2v7.6M4.5 6.2c0-1.2 1-2.2 2.2-2.2h1.1c1.5 0 2.7 1.2 2.7 2.7v0c0 1.5-1.2 2.7-2.7 2.7H7.6',
    }),
  });
}

/** A branch that owns its own checkout: the worktree mark. */
function WorktreeIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M3.5 3.8v8.4M3.5 5.4c0-.9.7-1.6 1.6-1.6h1.4c1.4 0 2.5 1.1 2.5 2.5v3.9c0 .9.7 1.6 1.6 1.6h.4',
    }),
  });
}

/** Remote-tracking mark. */
function RemoteBranchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', {
      d: 'M4.5 4.2v7.6M4.5 6.2c0-1.2 1-2.2 2.2-2.2h1.1c1.5 0 2.7 1.2 2.7 2.7v0c0 1.5-1.2 2.7-2.7 2.7H7.6M2.2 11.8h1.2M12.2 11.8h1.2',
    }),
  });
}

function CheckIcon(props) {
  return jsx(Svg, { ...props, strokeWidth: 1.8, children: jsx('path', { d: 'M3 8.5l3 3 7-7' }) });
}

function ChevronIcon({ open, ...props }) {
  return jsx(Svg, {
    ...props,
    style: { transform: open === true ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform .12s ease', ...(props.style ?? {}) },
    children: jsx('path', { d: 'M3 6.2l5 4.5 5-4.5' }),
  });
}

function PlusIcon(props) {
  return jsx(Svg, { ...props, children: jsx('path', { d: 'M8 3.5v9M3.5 8h9' }) });
}

function WarningIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M8 2.8l5.4 9.4H2.6L8 2.8zM8 6.6v3M8 11.4v.2' }),
  });
}

function TrashIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M3 4.6h10M6.4 4.6V3.4h3.2v1.2M4.2 4.6l.6 8h6.4l.6-8M6.6 7v3.4M9.4 7v3.4' }),
  });
}

function SearchIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M7 11.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM10.4 10.4L13.5 13.5' }),
  });
}

function SpinnerIcon({ size = 14 }) {
  return jsx('span', {
    className: 'dsh-wt-spinner',
    role: 'status',
    style: { width: size, height: size },
    'aria-hidden': true,
  });
}

/** Directory/folder mark for the pool section headers. */
function FolderIcon(props) {
  return jsx(Svg, {
    ...props,
    children: jsx('path', { d: 'M2.2 12.6V4.4h4l1.4 1.6h6.2v6.6H2.2z' }),
  });
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
    const result = await remoteOf()[method](...args);
    if (!result.ok) throw new Error(result.error.message);
    return result.value;
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

    /** Create one branch and its checkout under the pool. */
    createWorktree: (request) => call('createWorktree', request),

    /** Move one session into an existing checkout. */
    enterWorktree: (request) => call('enterWorktree', request),

    /** Remove one pool worktree. */
    removeWorktree: (request) => call('removeWorktree', request),

    /**
     * Open (or reveal) a session working inside one directory.
     *
     * The workspace for the directory is created idempotently; when it already
     * holds live sessions the most recent one is revealed, otherwise a fresh
     * session is created in it and becomes the main view.
     * @param {string} path - checkout directory.
     * @returns the session id that was opened or revealed.
     */
    async openSessionInDirectory(path) {
      const view = await workspaces.create({ path });
      const registry = workspaces.list.getSnapshot();
      const archived = new Set(registry.archivedSessionIds ?? []);
      const list = sessions.list.getSnapshot();
      const members = (view.sessionIds ?? []).filter((id) => !archived.has(id));
      let latest = null;
      let latestAt = -1;
      for (const id of members) {
        const updatedAt = list.byId?.[id]?.updatedAt;
        if (typeof updatedAt === 'number' && updatedAt > latestAt) {
          latestAt = updatedAt;
          latest = id;
        }
      }
      if (latest !== null) {
        uiWorkspace.openSession(latest);
        return latest;
      }
      await uiWorkspace.openWorkspace(view.workspaceId);
      return null;
    },
  };
}

/**
 * A small batched cache of per-path git facts for sidebar decorations.
 *
 * Rows request their session's directory; lookups are batched on a short
 * timer, answered from cache while fresh, and republished to subscribers.
 * @module dsh-worktree/client/store
 */
class GitInfoStore {
  constructor(api, { ttlMs = 15000, flushDelayMs = 40 } = {}) {
    this.api = api;
    this.ttlMs = ttlMs;
    this.flushDelayMs = flushDelayMs;
    this.entries = new Map();
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





/** Place the panel against its anchor, flipping when the viewport lacks room. */
function useAnchoredPanel(open, anchorRef, panelRef, gap = 6) {
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
      let top = a.top - height - gap;
      if (top < 8) top = a.bottom + gap;
      let left = a.right - width;
      left = Math.min(Math.max(8, left), Math.max(8, window.innerWidth - width - 8));
      panel.style.top = `${Math.round(top)}px`;
      panel.style.left = `${Math.round(left)}px`;
      if (settled === false && height > 0) {
        settled = true;
        panel.style.visibility = '';
      }
    };
    const panel = panelRef.current;
    if (panel !== null) panel.style.visibility = 'hidden';
    update();
    raf = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    document.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', update);
      document.removeEventListener('scroll', update, true);
    };
  }, [open, gap, anchorRef, panelRef]);
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
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  useAnchoredPanel(open, anchorRef, panelRef);
  useDismiss(open, anchorRef, panelRef, close);

  const cwd = typeof useSessions === 'function'
    ? useSessions((snapshot) => snapshot?.byId?.[sessionId]?.cwd)
    : undefined;
  const [status, setStatus] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => {
    if (sessionId === undefined) return;
    setLoading(true);
    try {
      const value = await worktree.api.status(sessionId);
      setStatus(value);
    } catch {
      setStatus(undefined);
    } finally {
      setLoading(false);
    }
  }, [worktree.api, sessionId]);
  useEffect(() => {
    void refresh();
  }, [refresh, cwd]);

  const variant = status?.isRepo && status.isWorktree ? 'worktree' : 'branch';
  const label = !loading && status === undefined
    ? t('trigger.noRepo')
    : status?.isRepo === true
      ? (status.isWorktree ? (status.worktreeName ?? status.branch ?? '') : (status.branch ?? t('trigger.detached')))
      : (loading ? t('trigger.loading') : t('trigger.noRepo'));

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
        title: status?.isRepo === true
          ? (status.isWorktree ? t('sidebar.worktreeTitle', { name: status.worktreeName ?? '', branch: status.branch ?? '' }) : t('sidebar.branchTitle', { branch: status.branch ?? t('trigger.detached') }))
          : label,
        children: [
          jsx('span', { className: 'dsh-wt-trigger-icon', children: variant === 'worktree' ? jsx(WorktreeIcon, {}) : jsx(BranchIcon, {}) }),
          jsx('span', { className: 'dsh-wt-trigger-label', children: label || t('trigger.loading') }),
          jsx('span', { className: 'dsh-wt-trigger-chevron', children: jsx(ChevronIcon, { open: true, size: 14 }) }),
        ],
      }),
      open === true && createPortal(
        jsx(BranchPanel, {
          panelRef,
          sessionId,
          status,
          loading,
          cwd,
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
function BranchPanel({ panelRef, sessionId, status, loading, cwd, api, store, t, refresh, onClose }) {
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);
  const searchRef = useRef(null);
  useEffect(() => {
    searchRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    setConfirm(null);
    setError(null);
  }, [sessionId, cwd]);

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

  const openDirectory = useCallback(async (path) => {
    setBusy({ kind: 'open', path });
    setError(null);
    setConfirm(null);
    try {
      await api.openSessionInDirectory(path);
      setToast(t('hint.sessionOpened', { name: baseName(path) }));
      onClose();
    } catch (cause) {
      fail(t('error.unexpected'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, fail, onClose, t]);

  const enterDirectory = useCallback(async (path) => {
    setBusy({ kind: 'enter', path });
    setError(null);
    try {
      const value = await api.enterWorktree({ sessionId, path });
      if (value.ok === true) {
        afterMutation(t('hint.enterDone', { path: value.cwd ?? path }));
        onClose();
      } else {
        fail(t('error.unexpected'), value);
      }
    } catch (cause) {
      fail(t('error.unexpected'), { message: cause instanceof Error ? cause.message : String(cause) });
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, onClose, t]);

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

  const createBranch = useCallback(async ({ name, startPoint, openSession }) => {
    setBusy({ kind: 'create', name });
    setError(null);
    try {
      const value = await api.createWorktree({ sessionId, name, ...(startPoint === undefined ? {} : { startPoint }) });
      if (value.ok !== true) {
        fail(t('error.createFailed'), value);
        return false;
      }
      afterMutation(t('create.ok', { branch: value.branch, path: value.path }));
      if (openSession) {
        await api.openSessionInDirectory(value.path);
        onClose();
      } else {
        await enterDirectory(value.path);
      }
      return true;
    } catch (cause) {
      fail(t('error.createFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, enterDirectory, fail, onClose, t]);

  const normalized = query.trim().toLowerCase();
  const branches = useMemo(() => {
    const locals = (status?.branches ?? []).filter((branch) => branch.kind === 'local');
    const remotes = (status?.branches ?? []).filter((branch) => branch.kind === 'remote' && branch.hasLocal !== true);
    const match = (entry) => normalized === '' || entry.name.toLowerCase().includes(normalized);
    return {
      worktrees: (status?.worktrees ?? []).filter((entry) => normalized === '' || (entry.branch ?? entry.name).toLowerCase().includes(normalized)),
      locals: locals.filter(match),
      remotes: remotes.filter(match),
      localsHidden: locals.length - locals.filter(match).length,
      remotesHidden: remotes.length - remotes.filter(match).length,
    };
  }, [status, normalized]);

  const currentDirty = status?.dirtyCount ?? null;

  return jsxs('div', {
    ref: panelRef,
    className: 'dsh-wt-panel',
    role: 'dialog',
    'aria-label': t('panel.currentSection'),
    'data-testid': 'dsh-worktree-panel',
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
        className: 'dsh-wt-panel-body',
        children: [
          status !== undefined && status.isRepo !== true
            ? jsx('div', { className: 'dsh-wt-note', children: t('panel.notRepo') })
            : status?.isRepo === true && jsxs('div', {
                className: 'dsh-wt-current',
                'data-testid': 'dsh-worktree-current',
                children: [
                  jsx('span', { className: 'dsh-wt-current-icon', children: status.isWorktree === true ? jsx(WorktreeIcon, {}) : jsx(BranchIcon, {}) }),
                  jsxs('div', {
                    className: 'dsh-wt-current-main',
                    children: [
                      jsxs('span', { className: 'dsh-wt-current-title', children: [
                        status.branch ?? t('trigger.detached'),
                        status.isWorktree === true && jsx('span', { className: 'dsh-wt-badge', 'data-tone': 'brand', style: { marginLeft: 6 }, children: 'worktree' }),
                        status.isWorktree === true && status.worktreeName !== null && status.worktreeName !== undefined && jsx('span', { className: 'dsh-wt-badge', style: { marginLeft: 4 }, children: status.worktreeName }),
                      ] }),
                      jsxs('span', {
                        className: 'dsh-wt-current-sub',
                        'data-tone': (currentDirty ?? 0) > 0 ? 'warn' : undefined,
                        children: [
                          (currentDirty ?? 0) > 0 ? dirtyLabel(t, currentDirty) : t('status.clean'),
                          status.ahead !== undefined && status.ahead > 0 && status.behind !== undefined && status.behind > 0 ? ` · ${t('status.aheadBehind', { ahead: String(status.ahead), behind: String(status.behind) })}` : null,
                          status.upstream != null ? ` · ${t('status.upstream', { upstream: status.upstream })}` : null,
                        ],
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
                  jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setConfirm(null); setCreating({ name: confirm.branch }); }, children: t('confirm.dirty.worktree') }),
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
          status?.isRepo === true && jsxs('div', {
            className: 'dsh-wt-section',
            children: [
              jsxs('div', {
                className: 'dsh-wt-section-title',
                children: [jsx(FolderIcon, { size: 12 }), t('panel.worktreesSection'), jsx('span', { className: 'dsh-wt-section-extra', title: status.poolPath, children: status.poolPath })],
              }),
              branches.worktrees.length === 0
                ? jsx('div', { className: 'dsh-wt-note', children: t('panel.noWorktrees') })
                : branches.worktrees.map((entry) => {
                    const isCurrent = cwd !== undefined && (entry.path === cwd || cwd.startsWith(entry.path));
                    return jsxs('button', {
                      type: 'button',
                      className: 'dsh-wt-row',
                      'data-kind': entry.isMain === true ? 'main' : 'worktree',
                      'data-testid': `dsh-worktree-row-${entry.name}`,
                      onClick: () => {
                        void openDirectory(entry.path);
                      },
                      children: [
                        jsx('span', { className: 'dsh-wt-row-icon', children: entry.isMain === true ? jsx(BranchIcon, {}) : jsx(WorktreeIcon, {}) }),
                        jsxs('span', {
                          className: 'dsh-wt-row-main',
                          children: [
                            jsxs('span', { className: 'dsh-wt-row-title', children: [
                              jsx('span', { className: 'dsh-wt-row-name', children: entry.name }),
                              entry.isMain === true && jsx('span', { className: 'dsh-wt-badge', children: t('status.mainCheckout') }),
                              entry.inPool === false && entry.isMain === false && jsx('span', { className: 'dsh-wt-badge', children: '.agents' }),
                            ] }),
                            jsxs('span', {
                              className: 'dsh-wt-row-sub',
                              'data-tone': (entry.dirtyCount ?? 0) > 0 ? 'warn' : undefined,
                              children: [
                                entry.branch ?? (entry.detached === true ? t('trigger.detached') : '—'),
                                dirtyLabel(t, entry.dirtyCount) !== null ? ` · ${dirtyLabel(t, entry.dirtyCount)}` : '',
                              ],
                            }),
                          ],
                        }),
                        isCurrent === true && jsx('span', { className: 'dsh-wt-row-check', children: jsx(CheckIcon, { size: 14 }) }),
                        jsxs('span', {
                          className: 'dsh-wt-row-actions',
                          children: [
                            entry.isMain !== true && jsx('button', {
                              type: 'button',
                              className: 'dsh-wt-iconbtn',
                              title: t('row.enter'),
                              'aria-label': t('row.enter'),
                              onClick: (event) => {
                                event.stopPropagation();
                                void enterDirectory(entry.path);
                              },
                              children: jsx(BranchIcon, { size: 13 }),
                            }),
                            entry.isMain !== true && jsx('button', {
                              type: 'button',
                              className: 'dsh-wt-iconbtn',
                              'data-tone': 'danger',
                              title: t('row.remove'),
                              'aria-label': t('row.remove'),
                              onClick: (event) => {
                                event.stopPropagation();
                                void removeWorktree(entry.path);
                              },
                              children: jsx(TrashIcon, { size: 13 }),
                            }),
                          ],
                        }),
                      ],
                    }, entry.path);
                  }),
            ],
          }),
          status?.isRepo === true && jsxs('div', {
            className: 'dsh-wt-section',
            children: [
              jsx('div', { className: 'dsh-wt-section-title', children: t('panel.localSection') }),
              branches.locals.map((branch) => {
                const isCurrent = branch.current === true;
                const busyRow = busy !== null && busy.kind === 'switch' && busy.branch === branch.name;
                return jsxs('button', {
                  type: 'button',
                  className: 'dsh-wt-row',
                  disabled: isCurrent === true,
                  'data-testid': `dsh-worktree-branch-${branch.name}`,
                  onClick: () => {
                    void switchTo(branch.name);
                  },
                  children: [
                    jsx('span', { className: 'dsh-wt-row-icon', children: busyRow === true ? jsx(SpinnerIcon, {}) : jsx(BranchIcon, {}) }),
                    jsxs('span', {
                      className: 'dsh-wt-row-main',
                      children: [
                        jsx('span', { className: 'dsh-wt-row-title', children: jsx('span', { className: 'dsh-wt-row-name', children: branch.name }) }),
                        branch.occupiedPath != null
                          ? jsx('span', { className: 'dsh-wt-row-sub', children: t('row.occupied', { name: baseName(branch.occupiedPath) }) })
                          : isCurrent === true && dirtyLabel(t, currentDirty) !== null && (currentDirty ?? 0) > 0
                            ? jsx('span', { className: 'dsh-wt-row-sub', 'data-tone': 'warn', children: dirtyLabel(t, currentDirty) })
                            : null,
                      ],
                    }),
                    isCurrent === true && jsx('span', { className: 'dsh-wt-row-check', children: jsx(CheckIcon, { size: 14 }) }),
                  ],
                }, branch.name);
              }),
              branches.locals.length === 0 && jsx('div', { className: 'dsh-wt-note', children: t('panel.noMatches') }),
            ],
          }),
          status?.isRepo === true && jsxs('div', {
            className: 'dsh-wt-section',
            children: [
              jsx('div', { className: 'dsh-wt-section-title', children: t('panel.remoteSection') }),
              branches.remotes.map((branch) => jsx('button', {
                type: 'button',
                className: 'dsh-wt-row',
                onClick: () => {
                  void switchTo(branch.name);
                },
                children: [
                  jsx('span', { className: 'dsh-wt-row-icon', children: jsx(RemoteBranchIcon, {}) }),
                  jsxs('span', {
                    className: 'dsh-wt-row-main',
                    children: [
                      jsx('span', { className: 'dsh-wt-row-title', children: jsx('span', { className: 'dsh-wt-row-name', children: branch.name }) }),
                      jsx('span', { className: 'dsh-wt-row-sub', children: branch.hasLocal === true ? t('row.hasLocal') : t('status.upstream', { upstream: branch.name }) }),
                    ],
                  }),
                ],
              }, branch.name)),
              branches.remotes.length === 0 && jsx('div', { className: 'dsh-wt-note', children: t('panel.noMatches') }),
            ],
          }),
        ],
      }),
      jsx(CreateForm, {
        status,
        busy,
        creating,
        setCreating,
        createBranch,
        t,
      }),
    ],
  });
}

/**
 * The collapsible footer form for "create and check out new branch".
 */
function CreateForm({ status, busy, creating, setCreating, createBranch, t }) {
  const [name, setName] = useState('');
  const [startPoint, setStartPoint] = useState('');
  const [openSession, setOpenSession] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (creating !== null && typeof creating === 'object' && creating.name !== undefined) {
      setName(creating.name);
      setCreating(false);
    }
  }, [creating, setCreating]);
  const options = useMemo(() => {
    const locals = (status?.branches ?? []).filter((branch) => branch.kind === 'local').map((branch) => branch.name);
    const remotes = (status?.branches ?? []).filter((branch) => branch.kind === 'remote' && branch.hasLocal !== true).map((branch) => branch.name);
    return { locals, remotes };
  }, [status]);
  const disabled = status?.isRepo !== true || (busy?.kind === 'create');
  const expanded = creating === true;
  return jsxs('div', {
    className: 'dsh-wt-footer',
    children: [
      expanded !== true && jsxs('button', {
        type: 'button',
        className: 'dsh-wt-create-toggle',
        disabled,
        onClick: () => {
          setCreating(true);
        },
        'data-testid': 'dsh-worktree-create-toggle',
        children: [jsx(PlusIcon, { size: 14 }), t('create.title')],
      }),
      expanded === true && jsxs('form', {
        className: 'dsh-wt-create-form',
        onSubmit: async (event) => {
          event.preventDefault();
          if (name.trim().length === 0 || submitting === true) return;
          setSubmitting(true);
          try {
            const done = await createBranch({ name: name.trim(), startPoint: startPoint.length === 0 ? undefined : startPoint, openSession });
            if (done === true) {
              setName('');
              setStartPoint('');
            }
          } finally {
            setSubmitting(false);
          }
        },
        children: [
          jsxs('div', {
            className: 'dsh-wt-field',
            children: [
              jsx('label', { htmlFor: 'dsh-wt-create-name', children: t('create.title') }),
              jsx('input', {
                id: 'dsh-wt-create-name',
                type: 'text',
                value: name,
                placeholder: t('create.namePlaceholder'),
                autoComplete: 'off',
                spellCheck: false,
                onChange: (event) => {
                  setName(event.target.value);
                },
              }),
            ],
          }),
          jsxs('div', {
            className: 'dsh-wt-field',
            children: [
              jsx('label', { htmlFor: 'dsh-wt-create-from', children: t('create.from') }),
              jsxs('select', {
                id: 'dsh-wt-create-from',
                value: startPoint,
                onChange: (event) => {
                  setStartPoint(event.target.value);
                },
                children: [
                  jsx('option', { value: '', children: t('create.fromHead') }),
                  ...options.locals.map((value) => jsx('option', { value, children: value }, `local:${value}`)),
                  ...options.remotes.map((value) => jsx('option', { value, children: value }, `remote:${value}`)),
                ],
              }),
            ],
          }),
          jsx('label', {
            className: 'dsh-wt-checkbox',
            children: [
              jsx('input', {
                type: 'checkbox',
                checked: openSession,
                onChange: (event) => {
                  setOpenSession(event.target.checked);
                },
              }),
              t('create.openSession'),
            ],
          }),
          jsxs('div', {
            className: 'dsh-wt-create-actions',
            children: [
              jsx('button', { type: 'button', className: 'dsh-wt-button', 'data-variant': 'plain', onClick: () => { setCreating(false); }, children: t('error.cancel') }),
              jsxs('button', {
                type: 'submit',
                className: 'dsh-wt-button',
                'data-variant': 'primary',
                disabled: name.trim().length === 0 || submitting === true || busy?.kind === 'create',
                'data-testid': 'dsh-worktree-create-submit',
                children: submitting === true || busy?.kind === 'create' ? t('create.creating') : t('create.submit'),
              }),
            ],
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
    setSnap(store.currentOf(path));
    return store.watch(path, setSnap);
  }, [store, path]);
  return snap;
}

/**
 * Leading 16px cell mark: a worktree glyph for linked checkouts, a plain
 * branch glyph for the main checkout, nothing outside a repository.
 * @param props.sessionId - row session identity (owner props).
 * @param props.worktree - the API bundle ({ api, store }).
 * @param props.useSessions - framework hook over the sessions snapshot.
 * @param props.t - locale seat.
 */
function SessionLeadingMark({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  const info = useGitInfo(worktree.store, cwd);
  if (info === undefined || info.isRepo !== true) return null;
  const isWorktree = info.isWorktree === true;
  const branch = (isWorktree === true ? info.worktreeBranch : info.branch) ?? info.branch ?? '';
  const title = isWorktree === true
    ? t('sidebar.worktreeTitle', { name: info.worktreeName ?? '', branch })
    : t('sidebar.branchTitle', { branch: branch === '' ? info.branch ?? '' : branch });
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
 */
function SessionHoverInfo({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  const info = useGitInfo(worktree.store, cwd);
  if (info === undefined || info.isRepo !== true) return null;
  const isWorktree = info.isWorktree === true;
  const branch = (isWorktree === true ? info.worktreeBranch : info.branch) ?? info.branch ?? '';
  const text = isWorktree === true
    ? t('sidebar.worktreeLine', { name: info.worktreeName ?? '', branch: branch === '' ? '—' : branch })
    : t('sidebar.branchLine', { branch: branch === '' ? '—' : branch });
  return jsxs('div', {
    className: 'dsh-wt-hover',
    'data-variant': isWorktree === true ? 'worktree' : 'branch',
    'data-testid': 'dsh-worktree-hover-info',
    children: [
      jsx('span', { className: 'dsh-wt-hover-icon', children: isWorktree === true ? jsx(WorktreeIcon, { size: 13 }) : jsx(BranchIcon, { size: 13 }) }),
      jsx('span', { className: 'dsh-wt-hover-text', title: cwd, children: text }),
    ],
  });
}

/**
 * Far-right session header chip: branch (and worktree name when linked).
 */
function SessionHeaderChip({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  const info = useGitInfo(worktree.store, cwd);
  if (info === undefined || info.isRepo !== true) return null;
  const isWorktree = info.isWorktree === true;
  const branch = (isWorktree === true ? info.worktreeBranch : info.branch) ?? info.branch ?? '';
  const label = isWorktree === true
    ? t('header.worktree', { branch: branch === '' ? '—' : branch, name: info.worktreeName ?? '' })
    : t('header.branch', { branch: branch === '' ? t('trigger.detached') : branch });
  return jsxs('span', {
    className: 'dsh-wt-chip',
    'data-variant': isWorktree === true ? 'worktree' : 'branch',
    'data-testid': 'dsh-worktree-header-chip',
    title: cwd,
    children: [
      jsx('span', { className: 'dsh-wt-chip-icon', children: isWorktree === true ? jsx(WorktreeIcon, { size: 13 }) : jsx(BranchIcon, { size: 13 }) }),
      jsx('span', { className: 'dsh-wt-chip-label', children: label }),
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

  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({
    name: 'conversation.session.header.utilities',
    id: 'dsh-worktree-chip',
    order: 5,
    locale: 'worktree',
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, SessionHeaderChip));

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
