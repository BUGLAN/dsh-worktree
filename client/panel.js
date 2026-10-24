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
 */
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
      const margin = 8;
      const roomAbove = a.top - gap - margin;
      const roomBelow = window.innerHeight - a.bottom - gap - margin;
      // Prefer above the composer; flip below when the panel no longer fits.
      let top = roomAbove >= height ? a.top - height - gap : (roomBelow >= height ? a.bottom + gap : Math.max(margin, window.innerHeight - height - margin));
      top = Math.min(Math.max(margin, top), Math.max(margin, window.innerHeight - height - margin));
      let left = a.right - width;
      left = Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - width - margin));
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
  }, [refresh, cwd]);

  const variant = status?.isRepo && status.isWorktree ? 'worktree' : 'branch';
  const label = status?.isRepo === true
    ? (status.isWorktree ? (status.worktreeName ?? status.branch ?? '') : (status.branch ?? t('trigger.detached')))
    : status?.isRepo === false && loading !== true
      ? t('trigger.noRepo')
      : t('trigger.loading');

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
          themeRef: anchorRef,
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
function BranchPanel({ panelRef, themeRef, sessionId, status, loading, cwd, api, store, t, refresh, onClose }) {
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
      await api.openSessionInDirectory(value.path, api.workspaceOf(cwd ?? status?.cwd ?? ''));
      afterMutation(t('create.worktreeOk', { branch: value.branch, path: value.path }));
      onClose();
      return true;
    } catch (cause) {
      fail(t('error.createFailed'), { message: cause instanceof Error ? cause.message : String(cause) });
      return false;
    } finally {
      setBusy(null);
    }
  }, [api, sessionId, afterMutation, fail, onClose, t, cwd, status]);

  const normalized = query.trim().toLowerCase();
  const branches = useMemo(() => {
    // Which branches are checked out in a pool worktree, keyed by branch name.
    // A worktree row and a plain branch row share the same list, so the icon and
    // the id badge come from this map rather than from the row itself.
    const byWorktree = new Map();
    for (const entry of status?.worktrees ?? []) {
      if (typeof entry.branch === 'string' && entry.inPool === true) byWorktree.set(entry.branch, entry);
    }
    // The picker lists the branches this checkout can switch to. A branch that
    // another worktree already holds carries an `occupiedPath` from the Host and
    // is not switchable here, so it is left out — showing it would only offer an
    // action that gets refused. This is presentation logic and lives here alone.
    const locals = (status?.branches ?? [])
      .filter((branch) => branch.kind === 'local' && branch.occupiedPath == null)
      .map((branch) => ({ ...branch, worktree: byWorktree.get(branch.name) ?? null }));
    const match = (entry) => normalized === '' || entry.name.toLowerCase().includes(normalized);
    return {
      locals: locals.filter(match),
      localsHidden: locals.length - locals.filter(match).length,
    };
  }, [status, normalized]);

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
                const busyRow = busy !== null && busy.kind === 'switch' && busy.branch === branch.name;
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
                          children: jsxs(Fragment, {
                            children: [
                              // A pool branch reads as `wt-1a2b/feat-abc`: the id is
                              // the directory the checkout lives in, so it leads.
                              branch.worktree !== null && jsx('span', { className: 'dsh-wt-row-dir', children: `${baseName(branch.worktree.path)}/` }),
                              jsx('span', { className: 'dsh-wt-row-name', children: branch.name }),
                            ],
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
          // One row: the checkout directory, the branch name, its start point,
          // and the confirm action. In worktree mode the fixed `wt-xxxx/` prefix
          // is rendered as a non-editable label so the user sees the directory
          // the checkout will get, while only the branch name is typed and sent.
          mode === 'worktree' && jsxs('span', {
            className: 'dsh-wt-create-prefix',
            title: t('create.prefixHint'),
            children: [
              jsx('span', { className: 'dsh-wt-create-prefix-dir', children: worktreeId }),
              jsx('span', { className: 'dsh-wt-create-prefix-sep', children: '/' }),
            ],
          }),
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

