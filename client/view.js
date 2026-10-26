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
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { layoutCommits, countLanes } from './graph-layout.js';
import { BranchIcon, CheckIcon, PlusIcon, RemoteBranchIcon, SpinnerIcon, TrashIcon, WarningIcon, WorktreeIcon } from './icons.js';

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
export function WorktreeView({ sessionId, worktree, t }) {
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
