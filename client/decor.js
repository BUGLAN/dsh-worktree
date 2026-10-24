/**
 * Sidebar and session-header decorations: a leading worktree/branch mark on
 * each session row, a branch line in the row's hover card, and a chip at the
 * far right of the conversation header.
 * @module dsh-worktree/client/decor
 */
import { useEffect, useState } from 'react';
import { jsx, jsxs } from 'react/jsx-runtime';
import { BranchIcon, WorktreeIcon } from './icons.js';

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
export function SessionLeadingMark({ sessionId, worktree, useSessions, t }) {
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
export function SessionHoverInfo({ sessionId, worktree, useSessions, t }) {
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

