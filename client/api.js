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
export function createWorktreeApi(ctx) {
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
export class GitInfoStore {
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
