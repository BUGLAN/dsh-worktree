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
export const PACKAGE = 'dsh-worktree';

/** Cordis service key of the Host half. */
export const SERVICE_KEY = 'worktree';

/** Remote namespace both halves exchange. */
export const NAMESPACE = 'worktree';

/** Pool directory, relative to the user's home directory. */
export const POOL_DIRECTORY_NAME = '.dsh-worktree';

/** Upper bound for one batch path lookup. */
export const MAX_PATHS = 64;

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
export const DESCRIPTORS = Object.freeze([
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
export const WORKTREE_REMOTE = Object.freeze({
  package: PACKAGE,
  descriptors: DESCRIPTORS,
});

/** Remote endpoint of one method, for diagnostics. */
export function endpointOf(name) {
  return `${NAMESPACE}/${name}`;
}
