/**
 * One-shot maintenance script: add the single-row create form strings.
 * @module dsh-worktree/scripts/add-compact-locale
 */
import { readFile, writeFile } from 'node:fs/promises';

const en = {
  'create.branchPlaceholder': 'New branch name, e.g. feature/login',
  'create.worktreePlaceholder': 'Worktree branch name',
  'create.openSessionShort': 'open',
};

const zh = {
  'create.branchPlaceholder': '新分支名，例如 feature/login',
  'create.worktreePlaceholder': '工作树分支名',
  'create.openSessionShort': '打开',
};

const path = new URL('../client/locales.js', import.meta.url);
let text = await readFile(path, 'utf8');

const render = (dict) => Object.entries(dict).map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`).join('\n');

text = text.replace('export const en = {\n', `export const en = {\n${render(en)}\n`);
text = text.replace('export const zh = {\n', `export const zh = {\n${render(zh)}\n`);

await writeFile(path, text, 'utf8');
console.log('compact locale keys added');
