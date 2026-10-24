/**
 * dsh-worktree — Host half.
 *
 * Owns every Git operation behind the UI picker and keeps all user worktrees
 * in one pool outside the repository: `~/.dsh-worktree` by default. Worktree
 * readiness mirrors the built-in `worktrees` service shipped with DSH (hook and
 * filter free checkout, a self-ignoring pool root, bounded and cancellable
 * commands), but this service adds what the built-in one does not expose:
 * branch listing, in-place switching with state classification, remote-branch
 * tracking, occupancy checks, and pool removal.
 *
 * The service is provided as plain data (`ctx.provide`) and publishes its
 * invocation descriptors with `ctx.typert.register`, so this file imports no
 * `@deepseek-ai/*` value: the profile loader supplies those names and every
 * avoided import is one less way for a linked checkout to fail activation.
 *
 * @module dsh-worktree
 */

import { mkdir, stat, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';

import { DESCRIPTORS, PACKAGE, POOL_DIRECTORY_NAME, SERVICE_KEY } from './contract.js';

/** Git selectors that must not leak in from the Host process environment. */
const GIT_ENV = Object.fromEntries([
  'GIT_DIR',
  'GIT_WORK_TREE',
  'GIT_COMMON_DIR',
  'GIT_INDEX_FILE',
  'GIT_OBJECT_DIRECTORY',
  'GIT_ALTERNATE_OBJECT_DIRECTORIES',
  'GIT_CONFIG',
  'GIT_CONFIG_PARAMETERS',
  'GIT_CONFIG_COUNT',
  'GIT_CEILING_DIRECTORIES',
  'GIT_PREFIX',
  'GIT_SHALLOW_FILE',
  'GIT_GRAFT_FILE',
  'GIT_REPLACE_REF_BASE',
  'GIT_ATTR_SOURCE',
].map((key) => [key, undefined]));

/** Largest timer delay the runtime accepts. */
const MAX_TIMER_DELAY_MS = 2_147_483_647;

/** Defaults applied when the row config omits a key. */
const DEFAULTS = Object.freeze({
  gitCommand: 'git',
  timeoutMs: 60_000,
  graceMs: 3_000,
  maxOutputBytes: 65_536,
  cacheTtlMs: 8_000,
});

/** One failed Git invocation, carrying its exit code and captured stderr. */
class GitCommandError extends Error {
  constructor(message, { exitCode = null, stderr = '' } = {}) {
    super(message);
    this.name = 'GitCommandError';
    this.exitCode = exitCode;
    this.stderr = stderr;
  }
}

/**
 * Validate the row config and resolve the pool directory.
 * @param {Record<string, unknown> | undefined} config - raw row config.
 * @returns complete options every operation reads.
 */
export function resolveOptions(config) {
  const raw = config ?? {};
  if (typeof raw !== 'object' || Array.isArray(raw)) throw new Error('dsh-worktree: config must be an object');
  const known = new Set(['poolDirectory', 'gitCommand', 'timeoutMs', 'graceMs', 'maxOutputBytes', 'cacheTtlMs']);
  for (const key of Object.keys(raw)) if (!known.has(key)) throw new Error(`dsh-worktree: unknown config key ${JSON.stringify(key)}`);
  const poolDirectory = raw.poolDirectory === undefined ? join(homedir(), POOL_DIRECTORY_NAME) : raw.poolDirectory;
  if (typeof poolDirectory !== 'string' || !isAbsolute(poolDirectory)) throw new Error('dsh-worktree: poolDirectory must be an absolute path');
  const readPositiveInteger = (key) => {
    const value = raw[key] ?? DEFAULTS[key];
    if (!Number.isSafeInteger(value) || value <= 0 || value > MAX_TIMER_DELAY_MS) {
      throw new Error(`dsh-worktree: ${key} must be a positive integer no greater than ${String(MAX_TIMER_DELAY_MS)}`);
    }
    return value;
  };
  const readCacheTtl = () => {
    const value = raw.cacheTtlMs ?? DEFAULTS.cacheTtlMs;
    if (!Number.isSafeInteger(value) || value < 0 || value > MAX_TIMER_DELAY_MS) {
      throw new Error(`dsh-worktree: cacheTtlMs must be a non-negative integer no greater than ${String(MAX_TIMER_DELAY_MS)}`);
    }
    return value;
  };
  const gitCommand = raw.gitCommand ?? DEFAULTS.gitCommand;
  if (typeof gitCommand !== 'string' || gitCommand.trim().length === 0) throw new Error('dsh-worktree: gitCommand must not be empty');
  return Object.freeze({
    poolDirectory: resolve(poolDirectory),
    gitCommand,
    timeoutMs: readPositiveInteger('timeoutMs'),
    graceMs: readPositiveInteger('graceMs'),
    maxOutputBytes: readPositiveInteger('maxOutputBytes'),
    cacheTtlMs: readCacheTtl(),
  });
}

/** Compare two filesystem paths under the host platform's own rules. */
function samePath(left, right) {
  if (left === undefined || right === undefined) return false;
  const normalize = (value) => (process.platform === 'win32' ? value.replace(/\\/g, '/').toLowerCase() : value);
  return normalize(left) === normalize(right);
}

/** Whether `child` is `parent` itself or lives underneath it. */
function underPath(parent, child) {
  if (parent === undefined || child === undefined) return false;
  const normalize = (value) => (process.platform === 'win32' ? value.replace(/\\/g, '/').toLowerCase() : value);
  const root = normalize(parent).replace(/\/+$/, '');
  const target = normalize(child);
  return target === root || target.startsWith(`${root}/`);
}

/**
 * Parse `git status --porcelain=v1 -b` output.
 * @param {string} stdout - complete command output.
 * @returns branch header facts and the number of changed entries.
 */
function parseStatus(stdout) {
  const state = { branch: null, upstream: null, ahead: 0, behind: 0, dirtyCount: 0, detached: false };
  for (const line of stdout.split('\n')) {
    if (line.length === 0) continue;
    if (!line.startsWith('## ')) {
      state.dirtyCount += 1;
      continue;
    }
    const header = line.slice(3).trim();
    const bracket = header.indexOf(' [');
    const body = bracket < 0 ? header : header.slice(0, bracket);
    const tracking = bracket < 0 ? '' : header.slice(bracket + 2).replace(/\]$/, '');
    const ahead = /ahead (\d+)/.exec(tracking);
    if (ahead !== null) state.ahead = Number(ahead[1]);
    const behind = /behind (\d+)/.exec(tracking);
    if (behind !== null) state.behind = Number(behind[1]);
    if (body === 'HEAD' || body.startsWith('HEAD (no branch)')) {
      state.detached = true;
      continue;
    }
    const separator = body.indexOf('...');
    if (separator < 0) state.branch = body;
    else {
      state.branch = body.slice(0, separator);
      state.upstream = body.slice(separator + 3);
    }
    for (const prefix of ['No commits yet on ', 'Initial commit on ']) {
      if (state.branch !== null && state.branch.startsWith(prefix)) state.branch = state.branch.slice(prefix.length);
    }
  }
  return state;
}

/** Git prints forward-slash paths even on Windows; expose native spelling. */
function toNativePath(value) {
  return process.platform === 'win32' ? value.replace(/\//g, '\\') : value;
}

/**
 * Parse `git worktree list --porcelain` output.
 * @param {string} stdout - complete command output.
 * @returns one entry per worktree, main checkout first.
 */
function parseWorktreeList(stdout) {
  const entries = [];
  let current = null;
  const flush = () => {
    if (current !== null) entries.push(current);
    current = null;
  };
  for (const line of stdout.split('\n')) {
    if (line.length === 0) {
      flush();
      continue;
    }
    const space = line.indexOf(' ');
    const key = space < 0 ? line : line.slice(0, space);
    const value = space < 0 ? '' : line.slice(space + 1);
    if (key === 'worktree') {
      flush();
      current = { path: toNativePath(value), head: null, branch: null, detached: false, bare: false, locked: false };
      continue;
    }
    if (current === null) continue;
    if (key === 'HEAD') current.head = value;
    else if (key === 'branch') current.branch = value.startsWith('refs/heads/') ? value.slice('refs/heads/'.length) : value;
    else if (key === 'detached') current.detached = true;
    else if (key === 'bare') current.bare = true;
    else if (key === 'locked') current.locked = true;
  }
  flush();
  return entries;
}

/** A relative branch name that cannot escape the pool or break Git's grammar. */
function isRelativeBranchName(value) {
  if (typeof value !== 'string' || value.length === 0) return false;
  if (value.startsWith('-') || value.includes('\\') || value.includes(':') || value.startsWith('/')) return false;
  return value.split('/').every((part) => part.length > 0 && part !== '.' && part !== '..');
}

/** Short user-facing excerpt of a Git diagnostic. */
function excerpt(value, limit = 400) {
  const text = String(value ?? '').trim();
  return text.length <= limit ? text : `${text.slice(0, limit)}…`;
}

/** Failure results share one shape so the UI can branch on `code`. */
function failure(code, message, extra = {}) {
  return { ok: false, code, message, ...extra };
}

/**
 * Git and session access behind the Remote API.
 */
export class WorktreeService {
  /** Gateway-visible binding of this service. */
  typertRemote = Object.freeze({ service: this, serviceKey: SERVICE_KEY, namespace: SERVICE_KEY });

  constructor(ctx, options) {
    this.ctx = ctx;
    this.options = options;
    this.cache = new Map();
    this.pending = new Map();
    this.lifetime = new AbortController();
    this.disposed = false;
  }

  /** Abort outstanding work when the owning fiber unloads. */
  dispose() {
    if (this.disposed) return;
    this.disposed = true;
    this.lifetime.abort(new Error('dsh-worktree service disposed'));
    this.cache.clear();
    this.pending.clear();
  }

  bind(signal) {
    const lifetime = this.lifetime.signal;
    return signal === undefined ? lifetime : AbortSignal.any([lifetime, signal]);
  }

  /** Bound one Git invocation by the configured timeout. */
  control(signal) {
    const bound = this.bind(signal);
    const timeout = AbortSignal.timeout(this.options.timeoutMs);
    return AbortSignal.any([bound, timeout]);
  }

  /**
   * Run one Git command without a shell and await its managed process range.
   * @param {string} cwd - canonical working directory.
   * @param {string[]} argv - Git arguments after the subcommand-neutral flags.
   * @param {object} control - signal, allowed exit codes, extra environment.
   * @returns captured stdout and the exit code.
   */
  async git(cwd, argv, { signal, allowedExitCodes = [0], env = {} } = {}) {
    const bound = this.control(signal);
    bound.throwIfAborted();
    let executable;
    try {
      executable = await this.ctx.subprocess.resolveExecutable(this.options.gitCommand, undefined, bound);
    } catch (error) {
      throw new GitCommandError(`git is not available: ${error instanceof Error ? error.message : String(error)}`);
    }
    bound.throwIfAborted();
    const child = this.ctx.subprocess.spawn({
      argv: [executable, '-c', 'core.hooksPath=/dev/null', '-c', 'core.fsmonitor=false', ...argv],
      cwd,
      env: { ...GIT_ENV, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1', GIT_NO_LAZY_FETCH: '1', ...env },
      signal: bound,
      graceMs: this.options.graceMs,
      stdio: {
        stdin: 'ignore',
        stdout: { maxBytes: this.options.maxOutputBytes },
        stderr: { maxBytes: this.options.maxOutputBytes },
      },
    });
    try {
      const outcome = await child.done;
      const captured = child.collected;
      const stdout = captured.stdout.readFrom(0);
      const stderr = captured.stderr.readFrom(0);
      if (outcome.exitCode === null || !allowedExitCodes.includes(outcome.exitCode)) {
        throw new GitCommandError(excerpt(stderr.text) || `git exited with ${String(outcome.exitCode ?? outcome.signal)}`, {
          exitCode: outcome.exitCode,
          stderr: stderr.text,
        });
      }
      if (stdout.lossy) throw new GitCommandError('git output exceeds maxOutputBytes');
      return { stdout: stdout.text, stderr: stderr.text, exitCode: outcome.exitCode };
    } finally {
      child.terminate();
      await child.waitForExit();
    }
  }

  /** Resolve one Host path to its canonical execution-world spelling. */
  async canonical(path, cwd, signal) {
    const target = await this.ctx.fs.resolve(path, cwd === undefined ? { signal } : { cwd, signal });
    return this.ctx.fs.processPath(target);
  }

  /** Cache one computed value briefly; mutations clear the whole cache. */
  async cached(key, compute) {
    const ttl = this.options.cacheTtlMs;
    const now = Date.now();
    if (ttl > 0) {
      const hit = this.cache.get(key);
      if (hit !== undefined && hit.expires > now) return hit.value;
    }
    const running = this.pending.get(key);
    if (running !== undefined) return running;
    const operation = (async () => compute())().finally(() => this.pending.delete(key));
    this.pending.set(key, operation);
    const value = await operation;
    if (ttl > 0) this.cache.set(key, { value, expires: Date.now() + ttl });
    return value;
  }

  /** Live Agent of one session, or undefined when the session is cold. */
  agentOf(sessionId) {
    const agents = this.ctx.agents;
    if (agents === undefined || typeof agents.get !== 'function') return undefined;
    return agents.get(sessionId);
  }

  /** Current working directory of one session, when its Agent is live. */
  cwdOf(agent) {
    return this.ctx.workingDirectory.get(agent.session);
  }

  /**
   * Resolve the checkout a session operates on.
   * @param {string} sessionId - session identity from the Client.
   * @returns `{ agent, cwd }` or a structured failure.
   */
  checkoutOf(sessionId) {
    const agent = this.agentOf(sessionId);
    if (agent === undefined) {
      return failure('session-unavailable', 'Session is not open in this Host; open it before changing branches.', { sessionId });
    }
    return { agent, cwd: this.cwdOf(agent) };
  }

  /**
   * Identify the repository and worktree that own one directory.
   * @param {string} path - canonical checkout path.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns repository facts, or `isRepo: false`.
   */
  /**
   * Identify the repository and worktree that own one directory.
   *
   * One `rev-parse` answers the root, the branch, and the shared git dir: a
   * linked worktree reports a `gitdir` that differs from its `commondir` under
   * `.git/worktrees/<name>`, which lets the panel tell a worktree from a plain
   * checkout without a second process.
   * @param {string} path - canonical checkout path.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns repository facts, or `isRepo: false`.
   */
  async inspect(path, signal) {
    return this.cached(`inspect:${path}`, async () => {
      try {
        const { stdout } = await this.git(path, ['rev-parse', '--show-toplevel', '--abbrev-ref', 'HEAD', '--git-common-dir', '--git-dir'], { signal, allowedExitCodes: [0, 128] });
        const [topLevelRaw = '', head = '', commonDir = '', gitDir = ''] = stdout.split('\n');
        if (topLevelRaw.trim().length === 0) return { path, isRepo: false };
        const repositoryRoot = await this.canonical(topLevelRaw.trim(), undefined, signal);
        const linked = commonDir.trim().length > 0 && gitDir.trim().length > 0 && commonDir.trim() !== gitDir.trim();
        return {
          path,
          isRepo: true,
          repositoryRoot,
          branch: head.trim() === 'HEAD' || head.trim().length === 0 ? null : head.trim(),
          detached: head.trim() === 'HEAD',
          linked,
        };
      } catch (error) {
        if (error instanceof GitCommandError && error.exitCode === 128) return { path, isRepo: false };
        return { path, isRepo: false, error: error instanceof Error ? error.message : String(error) };
      }
    });
  }

  /** Every worktree of one repository, main checkout first. */
  async worktreeList(repositoryRoot, signal) {
    return this.cached(`worktrees:${repositoryRoot}`, async () => {
      try {
        const { stdout } = await this.git(repositoryRoot, ['worktree', 'list', '--porcelain'], { signal });
        return parseWorktreeList(stdout);
      } catch (error) {
        if (error instanceof GitCommandError) return [];
        throw error;
      }
    });
  }

  /**
   * Changed-entry count of one checkout, `null` when it cannot be read.
   *
   * `git status` is the most expensive call the panel makes (it walks the whole
   * working tree), so the answer is cached per checkout with a short TTL and
   * shared between panel opens. Any mutation clears the cache.
   */
  async dirtyCountOf(path, signal) {
    return this.cached(`dirty:${path}`, async () => {
      try {
        const { stdout } = await this.git(path, ['status', '--porcelain=v1', '--untracked-files=normal'], { signal });
        return stdout.split('\n').filter((line) => line.length > 0).length;
      } catch {
        return null;
      }
    });
  }

  /**
   * Describe the checkout that contains `path`.
   * @param {object} state - inspection result of that path.
   * @param {Array<object>} worktrees - repository worktrees.
   * @returns worktree identity fields.
   */
  worktreeFacts(state, worktrees) {
    const owner = worktrees.find((entry) => samePath(entry.path, state.path)) ?? worktrees.find((entry) => underPath(entry.path, state.path));
    if (owner === undefined) {
      // No worktree record: trust the git-dir/commondir split from `inspect`.
      return state.linked === true ? { isWorktree: true, worktreePath: state.path, worktreeName: basename(state.path) } : { isWorktree: false };
    }
    const isMain = samePath(owner.path, worktrees[0]?.path);
    return {
      isWorktree: !isMain,
      worktreePath: owner.path,
      worktreeName: isMain ? null : basename(owner.path),
      worktreeBranch: owner.branch,
      worktreeDetached: owner.detached,
    };
  }

  // --- Remote methods -----------------------------------------------------

  /**
   * Branch and worktree identity of many checkouts (sidebar rows).
   * @param {string[]} paths - checkout directories reported by the Client.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns one state per requested path, in request order.
   */
  async gitInfo(paths, signal) {
    const bound = this.bind(signal);
    const items = [];
    const worktreesByRepo = new Map();
    for (const raw of paths) {
      bound.throwIfAborted();
      let canonical;
      try {
        canonical = await this.canonical(raw, undefined, bound);
      } catch {
        items.push({ path: raw, isRepo: false, missing: true });
        continue;
      }
      const state = await this.inspect(canonical, bound);
      if (!state.isRepo) {
        items.push({ path: canonical, isRepo: false, ...(state.error === undefined ? {} : { error: state.error }) });
        continue;
      }
      let worktrees = worktreesByRepo.get(state.repositoryRoot);
      if (worktrees === undefined) {
        worktrees = await this.worktreeList(state.repositoryRoot, bound);
        worktreesByRepo.set(state.repositoryRoot, worktrees);
      }
      items.push({
        path: canonical,
        isRepo: true,
        repositoryRoot: state.repositoryRoot,
        branch: state.branch,
        detached: state.detached,
        ...this.worktreeFacts(state, worktrees),
      });
    }
    return { ok: true, items };
  }

  /**
   * Full branch/worktree panel snapshot for one session.
   * @param {string} sessionId - session whose checkout is inspected.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns current checkout, branch directory, worktrees, and the pool path.
   */
  async status(sessionId, signal) {
    const bound = this.bind(signal);
    const checkout = this.checkoutOf(sessionId);
    if (checkout.ok === false) return checkout;
    const poolPath = this.options.poolDirectory;
    let cwd = checkout.cwd;
    try {
      cwd = await this.canonical(cwd, undefined, bound);
    } catch {
      /* A missing directory still yields a panel; Git lookups report it. */
    }
    const state = await this.inspect(cwd, bound);
    if (!state.isRepo) {
      return {
        ok: true,
        sessionId,
        cwd,
        isRepo: false,
        poolPath,
        branches: [],
        worktrees: [],
        ...(state.error === undefined ? {} : { error: state.error }),
      };
    }
    const [statusResult, worktrees, headsResult] = await Promise.all([
      this.cached(`status:${cwd}`, async () => this.git(cwd, ['status', '--porcelain=v1', '--branch', '--untracked-files=normal'], { signal: bound }).catch((error) => {
        if (error instanceof GitCommandError) return null;
        throw error;
      })),
      this.worktreeList(state.repositoryRoot, bound),
      this.cached(`heads:${state.repositoryRoot}`, async () => this.git(state.repositoryRoot, ['for-each-ref', '--format=%(refname:short)%09%(upstream:short)', 'refs/heads'], { signal: bound })),
    ]);
    const status = statusResult === null ? { branch: state.branch, upstream: null, ahead: 0, behind: 0, dirtyCount: null, detached: state.detached } : parseStatus(statusResult.stdout);
    const facts = this.worktreeFacts(state, worktrees);
    const currentWorktreePath = facts.worktreePath ?? state.repositoryRoot;
    const heads = headsResult.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [name = '', upstream = ''] = line.split('\t');
        return { name, upstream: upstream.length === 0 ? null : upstream };
      });
    const branches = heads.map((entry) => ({
      name: entry.name,
      kind: 'local',
      current: entry.name === status.branch,
      upstream: entry.upstream,
      occupiedPath: worktrees.find((worktree) => worktree.branch === entry.name && !samePath(worktree.path, currentWorktreePath))?.path ?? null,
    }));
    const poolEntries = worktrees.map((entry, index) => ({
      path: entry.path,
      name: basename(entry.path),
      branch: entry.branch,
      head: entry.head,
      detached: entry.detached,
      isMain: index === 0,
      inPool: underPath(poolPath, entry.path),
      locked: entry.locked,
      isCurrent: samePath(entry.path, currentWorktreePath),
    }));
    // Dirty counts run in parallel and only for checkouts the panel shows.
    const dirtyTargets = poolEntries.filter((entry) => entry.inPool || entry.isCurrent === true);
    const dirtyResults = await Promise.all(dirtyTargets.map((entry) => this.dirtyCountOf(entry.path, bound)));
    dirtyTargets.forEach((entry, index) => {
      entry.dirtyCount = dirtyResults[index];
    });
    return {
      ok: true,
      sessionId,
      cwd,
      isRepo: true,
      repositoryRoot: state.repositoryRoot,
      branch: status.branch,
      detached: status.detached,
      head: worktrees.find((entry) => samePath(entry.path, currentWorktreePath))?.head ?? null,
      upstream: status.upstream,
      ahead: status.ahead,
      behind: status.behind,
      dirtyCount: status.dirtyCount,
      ...facts,
      branches,
      worktrees: poolEntries,
      poolPath,
    };
  }

  /**
   * Create one branch and check it out **in this checkout** — no worktree.
   *
   * The atomic sibling of {@link createWorktree}: this is the "just a branch"
   * operation, so it never touches the pool and never changes the session's
   * working directory. It still honours the same guards: an existing branch, a
   * branch checked out elsewhere, and a dirty tree all return a structured
   * state instead of a half-applied checkout.
   * @param {object} request - session, new branch name, start point, dirty consent.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns the checked-out branch, or a structured state for the user.
   */
  async createBranch(request, signal) {
    const bound = this.bind(signal);
    const name = String(request.name ?? '').trim();
    if (!isRelativeBranchName(name)) {
      return failure('invalid-name', `"${name}" is not a usable branch name.`, { hint: 'Use a name like feature/login: no leading dash, backslash, or dot segments.' });
    }
    const checkout = this.checkoutOf(request.sessionId);
    if (checkout.ok === false) return checkout;
    const { cwd } = checkout;
    const state = await this.inspect(cwd, bound);
    if (!state.isRepo) return failure('not-a-repo', 'This session directory is not a Git repository.', { cwd });
    const exists = await this.git(state.repositoryRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], { signal: bound, allowedExitCodes: [0, 1] });
    if (exists.exitCode === 0) return failure('branch-exists', `Branch ${name} already exists.`, { branch: name, hint: 'Pick another name, or switch to the existing branch from the list.' });
    const worktrees = await this.worktreeList(state.repositoryRoot, bound);
    const occupied = worktrees.find((worktree) => worktree.branch === name);
    if (occupied !== undefined) {
      return failure('branch-occupied', `Branch ${name} is already checked out in another worktree.`, { branch: name, occupiedPath: occupied.path, hint: 'Open that worktree, or pick another name.' });
    }
    const statusResult = await this.git(cwd, ['status', '--porcelain=v1', '--branch', '--untracked-files=normal'], { signal: bound });
    const status = parseStatus(statusResult.stdout);
    if (status.dirtyCount > 0 && request.allowDirty !== true) {
      return failure('dirty-tree', `The working tree has ${String(status.dirtyCount)} uncommitted change(s).`, {
        branch: name,
        dirtyCount: status.dirtyCount,
        hint: 'Creating the branch carries these changes onto it; commit or stash first to start clean.',
      });
    }
    const startPoint = request.startPoint === undefined || request.startPoint.length === 0 ? 'HEAD' : request.startPoint;
    try {
      await this.git(cwd, ['switch', '-c', name, '--', startPoint], { signal: bound });
    } catch (error) {
      if (!(error instanceof GitCommandError)) throw error;
      const stderr = error.stderr;
      if (/already exists/i.test(stderr)) return failure('branch-exists', `Branch ${name} already exists.`, { branch: name });
      if (/would be overwritten|local changes/i.test(stderr)) {
        return failure('switch-conflict', 'Git refused to create the branch because uncommitted changes conflict with it.', { branch: name, detail: excerpt(stderr), hint: 'Commit or stash the changes, then retry.' });
      }
      return failure('switch-failed', `Git could not create branch ${name}.`, { branch: name, detail: excerpt(stderr) });
    }
    this.cache.clear();
    return { ok: true, branch: name, mode: 'created', dirtyCount: status.dirtyCount, carried: status.dirtyCount > 0 };
  }

  /**
   * Switch the session checkout to a local or remote branch, in place.
   * @param {object} request - session, target branch, and dirty-tree consent.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns structured outcome; failures carry the next step for the user.
   */
  async switchBranch(request, signal) {
    const bound = this.bind(signal);
    const checkout = this.checkoutOf(request.sessionId);
    if (checkout.ok === false) return checkout;
    const { cwd } = checkout;
    const state = await this.inspect(cwd, bound);
    if (!state.isRepo) return failure('not-a-repo', 'This session directory is not a Git repository.', { cwd });
    const worktrees = await this.worktreeList(state.repositoryRoot, bound);
    const facts = this.worktreeFacts(state, worktrees);
    const currentWorktreePath = facts.worktreePath ?? state.repositoryRoot;
    const target = request.branch;
    const hasRef = async (ref) => {
      const result = await this.git(state.repositoryRoot, ['show-ref', '--verify', '--quiet', ref], { signal: bound, allowedExitCodes: [0, 1] });
      return result.exitCode === 0;
    };
    const slash = target.indexOf('/');
    let branch = target;
    let remoteTracking = null;
    if ((await hasRef(`refs/heads/${target}`)) === false && slash > 0) {
      const short = target.slice(slash + 1);
      if (await hasRef(`refs/remotes/${target}`)) {
        if (await hasRef(`refs/heads/${short}`)) branch = short;
        else {
          branch = short;
          remoteTracking = target;
        }
      }
    } else if ((await hasRef(`refs/heads/${target}`)) === false) {
      const candidates = (await this.remoteNames(state.repositoryRoot, bound)).map((remote) => `${remote}/${target}`);
      const match = [];
      for (const candidate of candidates) if (await hasRef(`refs/remotes/${candidate}`)) match.push(candidate);
      if (match.length === 0) return failure('branch-not-found', `Branch ${target} does not exist locally or on any remote.`, { branch: target });
      if (match.length > 1) return failure('branch-ambiguous', `Branch ${target} exists on several remotes: ${match.join(', ')}.`, { branch: target, candidates: match });
      branch = target;
      remoteTracking = match[0];
    }
    const statusResult = await this.git(cwd, ['status', '--porcelain=v1', '--branch', '--untracked-files=normal'], { signal: bound });
    const status = parseStatus(statusResult.stdout);
    const dirtyCount = status.dirtyCount;
    if (status.branch === branch && !state.detached) {
      return { ok: true, branch, mode: 'already-current', dirtyCount };
    }
    const occupied = worktrees.find((worktree) => worktree.branch === branch && !samePath(worktree.path, currentWorktreePath));
    if (occupied !== undefined) {
      return failure('branch-occupied', `Branch ${branch} is already checked out in another worktree.`, {
        branch,
        occupiedPath: occupied.path,
        hint: 'Open that worktree as its own session, or create a new branch for this task.',
      });
    }
    if (dirtyCount > 0 && request.allowDirty !== true) {
      return failure('dirty-tree', `The working tree has ${String(dirtyCount)} uncommitted change(s).`, {
        branch,
        dirtyCount,
        hint: 'Switching carries these changes over; a conflicting change makes Git refuse. Create a worktree instead to keep this checkout untouched.',
      });
    }
    const switchArgs = remoteTracking === null
      ? ['switch', '--', branch]
      : ['switch', '-c', branch, '--track', '--', remoteTracking];
    try {
      await this.git(cwd, switchArgs, { signal: bound });
    } catch (error) {
      if (!(error instanceof GitCommandError)) throw error;
      const stderr = error.stderr;
      if (/would be overwritten|local changes|Please commit your changes or stash/i.test(stderr)) {
        return failure('switch-conflict', 'Git refused to switch because uncommitted changes conflict with the target branch.', {
          branch,
          hint: 'Commit or stash the changes, or create a worktree so both branches stay checked out.',
          detail: excerpt(stderr),
        });
      }
      if (/already checked out/i.test(stderr)) {
        return failure('branch-occupied', `Branch ${branch} is already checked out in another worktree.`, {
          branch,
          hint: 'Open that worktree as its own session, or create a new branch for this task.',
          detail: excerpt(stderr),
        });
      }
      return failure('switch-failed', `Git could not switch to ${branch}.`, { branch, detail: excerpt(stderr) });
    }
    this.cache.clear();
    return {
      ok: true,
      branch,
      mode: remoteTracking === null ? 'switched' : 'created-tracking',
      dirtyCount,
      carried: dirtyCount > 0,
      ...(remoteTracking === null ? {} : { upstream: remoteTracking }),
    };
  }

  /** Remote names known to the repository. */
  async remoteNames(repositoryRoot, signal) {
    try {
      const { stdout } = await this.git(repositoryRoot, ['remote'], { signal });
      return stdout.split('\n').map((line) => line.trim()).filter((line) => line.length > 0);
    } catch {
      return [];
    }
  }

  /**
   * Create one branch and its checkout inside the pool.
   * @param {object} request - session, new branch name, optional start point.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns the created checkout, or a structured failure that retains nothing.
   */
  async createWorktree(request, signal) {
    const bound = this.bind(signal);
    const checkout = this.checkoutOf(request.sessionId);
    if (checkout.ok === false) return checkout;
    const name = request.name.trim();
    if (!isRelativeBranchName(name)) {
      return failure('invalid-name', `"${name}" is not a usable branch name.`, { hint: 'Use a name like feature/login: no leading dash, backslash, or dot segments.' });
    }
    const state = await this.inspect(checkout.cwd, bound);
    if (!state.isRepo) return failure('not-a-repo', 'This session directory is not a Git repository.', { cwd: checkout.cwd });
    try {
      await this.git(state.repositoryRoot, ['check-ref-format', `refs/heads/${name}`], { signal: bound });
    } catch (error) {
      if (error instanceof GitCommandError) return failure('invalid-name', `Git rejects "${name}" as a branch name.`, { detail: excerpt(error.stderr) });
      throw error;
    }
    const exists = await this.git(state.repositoryRoot, ['show-ref', '--verify', '--quiet', `refs/heads/${name}`], { signal: bound, allowedExitCodes: [0, 1] });
    if (exists.exitCode === 0) return failure('branch-exists', `Branch ${name} already exists.`, { branch: name, hint: 'Pick another name or switch to the existing branch.' });
    const startPoint = request.startPoint === undefined || request.startPoint.length === 0 ? 'HEAD' : request.startPoint;
    let baseCommit;
    try {
      baseCommit = (await this.git(state.repositoryRoot, ['rev-parse', '--verify', '--end-of-options', `${startPoint}^{commit}`], { signal: bound })).stdout.trim();
    } catch (error) {
      if (error instanceof GitCommandError) return failure('start-point-invalid', `Cannot start from ${startPoint}.`, { detail: excerpt(error.stderr), startPoint });
      throw error;
    }
    const destination = await this.canonical(join(this.options.poolDirectory, name), undefined, bound);
    try {
      await stat(destination);
      return failure('path-exists', `The checkout directory ${destination} already exists.`, { path: destination });
    } catch {
      /* Absent destination is the expected state. */
    }
    try {
      await mkdir(this.options.poolDirectory, { recursive: true });
    } catch (error) {
      return failure('pool-unavailable', `Cannot create the worktree pool at ${this.options.poolDirectory}.`, { detail: error instanceof Error ? error.message : String(error) });
    }
    try {
      await writeFile(join(this.options.poolDirectory, '.gitignore'), '*\n', { flag: 'wx' });
    } catch {
      /* An existing pool keeps its own self-ignoring file. */
    }
    try {
      await mkdir(destination);
    } catch (error) {
      return failure('path-exists', `Cannot allocate ${destination}.`, { path: destination, detail: error instanceof Error ? error.message : String(error) });
    }
    try {
      await this.git(state.repositoryRoot, ['--work-tree', state.repositoryRoot, 'worktree', 'add', '--no-checkout', '-b', name, '--', destination, baseCommit], { signal: bound });
      const filters = await this.configuredFilters(destination, bound);
      const overrides = filterOverrides(filters);
      await this.git(destination, ['--work-tree', destination, 'reset', '--hard', '--no-recurse-submodules', baseCommit], { signal: bound, env: overrides });
      let upstream = null;
      const remoteMatch = /^([^/]+)\/(.+)$/.exec(startPoint);
      if (remoteMatch !== null && remoteMatch[2] === name && (await this.remoteNames(state.repositoryRoot, bound)).includes(remoteMatch[1])) {
        try {
          await this.git(destination, ['branch', '--set-upstream-to', `${remoteMatch[1]}/${name}`, name], { signal: bound });
          upstream = `${remoteMatch[1]}/${name}`;
        } catch {
          /* Tracking is a convenience; the checkout exists either way. */
        }
      }
      this.cache.clear();
      return {
        ok: true,
        path: destination,
        branch: name,
        baseCommit,
        repositoryRoot: state.repositoryRoot,
        ...(upstream === null ? {} : { upstream }),
      };
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return failure('create-failed', `Could not finish worktree ${name} at ${destination}.`, {
        path: destination,
        branch: name,
        detail: excerpt(detail),
        hint: 'Any created checkout or branch is retained: inspect the directory, then remove it with "git worktree remove" if you want to retry.',
      });
    }
  }

  /**
   * Create one worktree for this workspace and join a session to it.
   *
   * Unlike {@link createWorktree} this does not mint a Workspace per checkout:
   * the checkout is an execution detail of the current working directory, so
   * the caller keeps its workspace and only gains a directory it can move into.
   * @param {object} request - session, branch name, start point, open mode.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns the created checkout, ready for the caller to enter.
   */
  async createWorktreeSession(request, signal) {
    const bound = this.bind(signal);
    return this.createWorktree({ sessionId: request.sessionId, name: request.name, ...(request.startPoint === undefined ? {} : { startPoint: request.startPoint }) }, bound);
  }

  /** Filter drivers configured in one checkout, for the checkout-free reset. */
  async configuredFilters(path, signal) {
    try {
      const { stdout } = await this.git(path, ['config', '--null', '--name-only', '--get-regexp', '^filter\\.'], { signal, allowedExitCodes: [0, 1] });
      const drivers = new Set();
      for (const key of stdout.split('\0')) {
        const separator = key.lastIndexOf('.');
        if (separator <= 7) continue;
        if (['clean', 'smudge', 'process', 'required'].includes(key.slice(separator + 1))) drivers.add(key.slice(7, separator));
      }
      return drivers;
    } catch {
      return new Set();
    }
  }

  /**
   * Move one session into an existing checkout.
   * @param {object} request - session and target directory.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns the committed directory, or a structured failure.
   */
  async enterWorktree(request, signal) {
    const bound = this.bind(signal);
    const checkout = this.checkoutOf(request.sessionId);
    if (checkout.ok === false) return checkout;
    let directory;
    try {
      directory = await this.canonical(request.path, undefined, bound);
    } catch {
      return failure('not-a-directory', `${request.path} does not exist.`, { path: request.path });
    }
    try {
      const info = await this.ctx.fs.stat(await this.ctx.fs.resolve(directory, { signal: bound }), bound);
      if (info?.type !== 'directory') return failure('not-a-directory', `${directory} is not a directory.`, { path: directory });
    } catch {
      return failure('not-a-directory', `${directory} does not exist.`, { path: directory });
    }
    try {
      const cwd = await this.ctx.workingDirectory.set(checkout.agent, directory, bound);
      return { ok: true, cwd };
    } catch (error) {
      return failure('enter-failed', `Could not move the session into ${directory}.`, { path: directory, detail: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Remove one worktree from the pool and prune the repository records.
   * @param {object} request - session, worktree path, and force consent.
   * @param {AbortSignal} signal - operation cancellation.
   * @returns removal outcome or a structured failure.
   */
  async removeWorktree(request, signal) {
    const bound = this.bind(signal);
    const checkout = this.checkoutOf(request.sessionId);
    if (checkout.ok === false) return checkout;
    const state = await this.inspect(checkout.cwd, bound);
    if (!state.isRepo) return failure('not-a-repo', 'This session directory is not a Git repository.', { cwd: checkout.cwd });
    const target = await this.canonical(request.path, undefined, bound);
    if (!underPath(this.options.poolDirectory, target)) {
      return failure('outside-pool', 'Only worktrees inside the managed pool can be removed here.', { path: target, poolPath: this.options.poolDirectory });
    }
    const worktrees = await this.worktreeList(state.repositoryRoot, bound);
    const entry = worktrees.find((worktree) => samePath(worktree.path, target));
    if (entry === undefined) return failure('not-found', `${target} is not a worktree of this repository.`, { path: target });
    if (samePath(worktrees[0]?.path, target)) return failure('main-worktree', 'The main checkout cannot be removed.', { path: target });
    if (request.force !== true) {
      const dirty = await this.dirtyCountOf(target, bound);
      if (dirty !== null && dirty > 0) {
        return failure('dirty-worktree', `The worktree has ${String(dirty)} uncommitted change(s).`, {
          path: target,
          dirtyCount: dirty,
          hint: 'Commit or move those changes first, or confirm removal and lose them.',
        });
      }
    }
    try {
      await this.git(state.repositoryRoot, ['worktree', 'remove', ...(request.force === true ? ['--force'] : []), '--', target], { signal: bound });
      await this.git(state.repositoryRoot, ['worktree', 'prune'], { signal: bound }).catch(() => undefined);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      return failure('remove-failed', `Could not remove ${target}.`, { path: target, detail: excerpt(detail) });
    }
    this.cache.clear();
    return { ok: true, removed: true, path: target };
  }
}

/** Environment overrides that disable configured clean, smudge, and process filters. */
function filterOverrides(drivers) {
  const overrides = { GIT_CONFIG_COUNT: String(drivers.size * 4) };
  let index = 0;
  for (const driver of drivers) {
    for (const attribute of ['clean', 'smudge', 'process', 'required']) {
      overrides[`GIT_CONFIG_KEY_${String(index)}`] = `filter.${driver}.${attribute}`;
      overrides[`GIT_CONFIG_VALUE_${String(index)}`] = attribute === 'required' ? 'false' : '';
      index += 1;
    }
  }
  return overrides;
}

/**
 * Register the Host half.
 * @param {object} ctx - Cordis context of this plugin row.
 * @param {object} config - raw row config.
 */
export function apply(ctx, config) {
  const options = resolveOptions(config);
  ctx.inject(['typert', 'subprocess', 'fs', 'workingDirectory', 'agents'], (scoped) => {
    const service = new WorktreeService(scoped, options);
    scoped.provide(SERVICE_KEY, service);
    scoped.typert.register({
      package: PACKAGE,
      face: 'host',
      schemas: [],
      model: { services: [], events: [], objects: [] },
      invocations: DESCRIPTORS,
    });
    scoped.effect(() => () => service.dispose(), 'dsh-worktree: worktree service');
  });
}

/** Recommended row config, exported for documentation and tests. */
export { DEFAULTS };
