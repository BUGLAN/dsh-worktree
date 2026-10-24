/**
 * dsh-worktree — Web client half.
 *
 * Mounts the shared Remote contract, registers the locale dictionaries and
 * stylesheet, and contributes four UI seats:
 *
 *  - `conversation.input.right` — the branch/worktree picker immediately left
 *    of the model selector in the composer toolbar.
 *  - `conversation.session.header.corner` — a branch/worktree chip at the far
 *    right of the conversation header.
 *  - `sidebar.session.row.leading` — a per-row worktree/branch mark in the
 *    16px leading cell.
 *  - `sidebar.session.row.hover` — the row's worktree/branch identity in its
 *    hover card.
 *
 * @module dsh-worktree/client
 */
import { WORKTREE_REMOTE } from './contract.js';
import { createWorktreeApi, GitInfoStore } from './client/api.js';
import { BranchPicker } from './client/panel.js';
import { SessionHeaderChip, SessionHoverInfo, SessionLeadingMark } from './client/decor.js';
import { en, zh } from './client/locales.js';
import { CSS } from './client/styles.js';

/** Cordis plugin name of this client half. */
export const name = 'dsh-worktree';

/** Hard client dependencies: the Remote mount, slots, locale, and the workspace/session faces. */
export const inject = ['remote', 'slots', 'locale', 'workspaces', 'sessions', 'uiWorkspace'];

/**
 * Mount the namespace and register every UI seat.
 * @param {object} ctx - client root context.
 */
export async function apply(ctx) {
  await ctx.remote.$mount(WORKTREE_REMOTE);
  const api = createWorktreeApi(ctx);
  const store = new GitInfoStore(api);
  const bundle = { api, store };

  ctx.effect(() => ctx.locale.register('worktree', { zh, en }), 'dsh-worktree: dictionaries');
  ctx.effect(() => {
    const tag = document.createElement('style');
    tag.dataset.plugin = 'dsh-worktree';
    tag.textContent = CSS;
    document.head.append(tag);
    return () => {
      tag.remove();
    };
  }, 'dsh-worktree: styles');
  ctx.effect(() => () => {
    store.dispose();
  }, 'dsh-worktree: git info store');

  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'dsh-worktree-picker',
    order: -5,
    locale: 'worktree',
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, BranchPicker));

  ctx.slots.inject('conversation.session.header.corner', () => ctx.slots.register({
    name: 'conversation.session.header.corner',
    id: 'dsh-worktree-chip',
    locale: 'worktree',
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, SessionHeaderChip));

  ctx.slots.inject('sidebar.session.row.leading', () => ctx.slots.register({
    name: 'sidebar.session.row.leading',
    id: 'dsh-worktree-mark',
    locale: 'worktree',
    inject: () => ({ worktree: bundle }),
  }, SessionLeadingMark));

  ctx.slots.inject('sidebar.session.row.hover', () => ctx.slots.register({
    name: 'sidebar.session.row.hover',
    id: 'dsh-worktree-hover',
    locale: 'worktree',
    inject: () => ({ worktree: bundle }),
  }, SessionHoverInfo));
}
