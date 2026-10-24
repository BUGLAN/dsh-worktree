/**
 * The composer branch/worktree picker: a compact toolbar trigger that opens an
 * anchored panel listing the current checkout, pool worktrees, local and
 * remote branches, with state-aware confirm flows and branch creation.
 * @module dsh-worktree/client/panel
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { BranchIcon, CheckIcon, ChevronIcon, FolderIcon, PlusIcon, SearchIcon, SpinnerIcon, TrashIcon, WarningIcon, WorktreeIcon } from './icons.js';

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
export function BranchPicker({ sessionId, worktree, useSessions, t }) {
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

