/**
 * One-shot maintenance script: add worktree-directory prefix strings.
 * @module dsh-worktree/scripts/add-prefix-locale
 */
import { readFile, writeFile } from 'node:fs/promises';

const en = {
  'create.prefixHint': 'Checkout directory created for this worktree',
  'create.previewHint': 'Branch name as stored: slashes become dashes in the label',
};

const zh = {
  'create.prefixHint': '此工作树的检出目录',
  'create.previewHint': '分支名中的斜杠在显示时转为短横线',
};

const path = new URL('../client/locales.js', import.meta.url);
let text = await readFile(path, 'utf8');

const render = (dict) => Object.entries(dict).map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`).join('\n');

text = text.replace('export const en = {\n', `export const en = {\n${render(en)}\n`);
text = text.replace('export const zh = {\n', `export const zh = {\n${render(zh)}\n`);

await writeFile(path, text, 'utf8');
console.log('prefix locale added');
