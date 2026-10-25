/**
 * Client entry: mounts the shared Remote contract, registers dictionaries,
 * styles, and the five UI seats — the worktree tab first: it is the plugin's
 * only full-page surface, riding the host's native conversation-view slot
 * beside Chat and Trajectory. Inlined into the built factory file.
 * @module dsh-worktree/client/entry
 */

/** Cordis plugin name of this client half. */
const CLIENT_NAME = 'dsh-worktree';

/** Hard client dependencies: the Remote mount, slots, locale, and the workspace/session faces. */
const CLIENT_INJECT = ['remote', 'slots', 'locale', 'workspaces', 'sessions', 'uiWorkspace'];

/**
 * Mount the namespace and register every UI seat.
 * @param {object} ctx - client root context.
 */
async function apply(ctx) {
  try {
    await applyInner(ctx);
  } catch (error) {
    console.error('dsh-worktree: apply failed:', error);
    throw error;
  }
}

async function applyInner(ctx) {
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

  // Registration-time tab text reads through the bound translate as a thunk,
  // so the label follows the active locale without re-registration.
  const t = ctx.locale.bind('worktree');

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'worktree',
    order: 20,
    locale: 'worktree',
    label: () => t('view.worktree'),
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, WorktreeView));

  ctx.slots.inject('conversation.input.right', () => ctx.slots.register({
    name: 'conversation.input.right',
    id: 'dsh-worktree-picker',
    order: -5,
    locale: 'worktree',
    inject: (sessionId) => ({ sessionId, worktree: bundle }),
  }, BranchPicker));

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
