/**
 * One-shot maintenance script: add relocation strings for the branch picker.
 * @module scripts/add-relocate-locale
 */
import { readFile, writeFile } from 'node:fs/promises';

const en = {
  'row.moveTo': 'Move to {name}',
  'hint.relocated': 'Moved to {name} · {branch}',
};

const zh = {
  'row.moveTo': '迁移到 {name}',
  'hint.relocated': '已迁移到 {name} · {branch}',
};

const path = new URL('../client/locales.js', import.meta.url);
let text = await readFile(path, 'utf8');

const render = (dict) => Object.entries(dict).map(([key, value]) => `  '${key}': ${JSON.stringify(value)},`).join('\n');

text = text.replace('export const en = {\n', `export const en = {\n${render(en)}\n`);
text = text.replace('export const zh = {\n', `export const zh = {\n${render(zh)}\n`);

await writeFile(path, text, 'utf8');
console.log('relocate locale added');
