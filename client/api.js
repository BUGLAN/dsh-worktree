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
    async openSessionInDirectory(path, workspaceId = null) {
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
      const owner = workspaceId ?? this.workspaceOf(path);
      const created = owner === null ? null : await sessions.create({ workspaceId: owner });
      const sessionId = typeof created === 'string' ? created : (created?.sessionId ?? null);
      if (sessionId === null) return null;
      const moved = await call('enterWorktree', { sessionId, path });
      if (moved.ok !== true) return sessionId;
      uiWorkspace.openSession(sessionId);
      return sessionId;
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
 * @module dsh-worktree/client/store
 */
export class GitInfoStore {
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
