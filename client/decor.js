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
    setSnap(store.currentOf(path));
    return store.watch(path, setSnap);
  }, [store, path]);
  return snap;
}

/**
 * Leading 16px cell mark: a worktree glyph only for a *linked* checkout, a
 * plain branch glyph for the main checkout, nothing outside a repository.
 *
 * The main checkout must never get the worktree glyph: it owns `.git`, so
 * showing a "permanent worktree" mark there would claim a directory that is
 * the repository itself. `isWorktree` comes from the Host, which decides it by
 * comparing `git-dir` with `git-common-dir` rather than by list position.
 * @param props.sessionId - row session identity (owner props).
 * @param props.worktree - the API bundle ({ api, store }).
 * @param props.useSessions - framework hook over the sessions snapshot.
 * @param props.t - locale seat.
 */
export function SessionLeadingMark({ sessionId, worktree, useSessions, t }) {
  const cwd = useSessionCwd(useSessions, sessionId);
  const info = useGitInfo(worktree.store, cwd);
  if (info === undefined || info.isRepo !== true) return null;
  const isWorktree = info.isWorktree === true && info.worktreeName !== null && info.worktreeName !== undefined;
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
export function SessionHoverInfo({ sessionId, worktree, useSessions, t }) {
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

