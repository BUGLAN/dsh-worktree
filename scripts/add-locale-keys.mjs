/**
 * One-shot maintenance script: append the footer/confirm locale keys for the
 * split "branch" and "permanent worktree" actions to both dictionaries.
 * @module dsh-worktree/scripts/add-locale-keys
 */
import { readFile, writeFile } from 'node:fs/promises';

const en = {
  'create.branchAction': 'Branch',
  'create.worktreeAction': 'Permanent worktree',
  'create.branchTitle': 'Create and check out a branch here',
  'create.worktreeTitle': 'Create a permanent worktree',
  'create.branchSubmit': 'Create branch',
  'create.worktreeSubmit': 'Create worktree',
  'create.submitting': 'Creating…',
  'create.branchOk': 'Created and checked out {branch}',
  'create.worktreeOk': 'Created worktree for {branch} at {path}',
  'confirm.dirtyCreate.title': 'Uncommitted changes',
  'confirm.dirtyCreate.body': 'This checkout has {n} uncommitted change(s). Branch {branch} keeps them as uncommitted work.',
  'confirm.dirtyCreate.proceed': 'Create anyway',
};

const zh = {
  'create.branchAction': '分支',
  'create.worktreeAction': '永久工作树',
  'create.branchTitle': '在当前检出创建并迁出分支',
  'create.worktreeTitle': '创建永久工作树',
  'create.branchSubmit': '创建分支',
  'create.worktreeSubmit': '创建工作树',
  'create.submitting': '创建中…',
  'create.branchOk': '已创建并迁出分支 {branch}',
  'create.worktreeOk': '已为 {branch} 创建永久工作树：{path}',
  'confirm.dirtyCreate.title': '存在未提交更改',
  'confirm.dirtyCreate.body': '当前检出有 {n} 个未提交更改。分支 {branch} 会把这些更改作为未提交内容保留。',
  'confirm.dirtyCreate.proceed': '仍然创建',
};

const path = new URL('../client/locales.js', import.meta.url);
let text = await readFile(path, 'utf8');

const render = (dict) => Object.entries(dict).map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`).join('\n');

text = text.replace('export const en = {\n', `export const en = {\n${render(en)}\n`);
text = text.replace('export const zh = {\n', `export const zh = {\n${render(zh)}\n`);

await writeFile(path, text, 'utf8');
console.log('locale keys added');
