/**
 * The composer branch/worktree picker: a compact toolbar trigger that opens an
 * anchored panel listing the current checkout, pool worktrees, local and
 * remote branches, with state-aware confirm flows and branch creation.
 * @module dsh-worktree/client/panel
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Fragment, jsx, jsxs } from 'react/jsx-runtime';
import { BranchIcon, CheckIcon, ChevronIcon, FolderIcon, PlusIcon, RemoteBranchIcon, SearchIcon, SpinnerIcon, TrashIcon, WarningIcon, WorktreeIcon } from './icons.js';

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
  const [pending, setPending] = useState(false);
  const refresh = useCallback(async () => {
    if (sessionId === undefined) return;
    setLoading(true);
    try {
      const value = await worktree.api.status(sessionId);
      if (value.ok === false && value.code === 'session-unavailable') {
        // The session's agent is still starting: mark it pending (not "no repo")
        // and retry a few times before giving up.
        setPending(true);
        setStatus(undefined);
        for (const delay of [400, 800, 1600]) {
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
          const retry = await worktree.api.status(sessionId);
          if (retry.ok === true) {
            setPending(false);
            setStatus(retry);
            return;
          }
        }
        setPending(false);
        setStatus(undefined);
      } else {
        setPending(false);
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
  const [creating, setCreating] = useState(false);
  const [themeVars, setThemeVars] = useState(undefined);
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
    if (creating !== true) return;
    const body = bodyRef.current;
    if (body === null) return;
    const frame = requestAnimationFrame(() => {
      body.scrollTop = body.scrollHeight;
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [creating]);

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
          status?.isRepo === true && jsxs('div', {
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
  const nameRef = useRef(null);
  useEffect(() => {
    if (creating !== null && typeof creating === 'object' && creating.name !== undefined) {
      setName(creating.name);
      setCreating(false);
    }
  }, [creating, setCreating]);
  useEffect(() => {
    if (creating === true) nameRef.current?.focus({ preventScroll: true });
  }, [creating]);
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
                ref: nameRef,
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
