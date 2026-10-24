/**
 * Build a realistic sidebar preview for the icon candidates.
 *
 * The contact sheet answers "what does this glyph look like"; this answers
 * "which one do I want in my sidebar" by rendering the real row anatomy
 * (14px mark, 13px label, hover band) with the same dark surface the app uses.
 * @module scripts/icon-sidebar-preview
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = join(tmpdir(), 'octicons');
const files = (await readdir(dir)).filter((name) => name.endsWith('.svg'));

const META = {
  'repo': '仓库',
  'file-directory': '目录',
  'file-directory-fill': '目录实心',
  'home': '主目录',
  'database': '库',
  'git-branch': '分支（当前）',
  'git-merge': '合并',
  'file-submodule': '子模块',
  'tasklist': '清单',
  'stack': '堆叠',
  'versions': '多版本',
  'terminal': '终端',
  'command-palette': '命令',
  'list-unordered': '列表',
  'rows': '行',
  'apps': '应用',
  'container': '容器',
  'cpu': '芯片',
};

const entries = [];
for (const file of files.sort()) {
  const name = file.replace(/\.svg$/, '');
  const svg = await readFile(`${dir}/${file}`, 'utf8');
  if (svg.includes('404: Not Found')) continue;
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.startsWith('<path')) continue;
  entries.push({ name, inner, label: META[name] ?? name });
}

const wrap = (inner, size = 14) => `<svg viewBox="0 0 16 16" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;

/** One sidebar row as the app renders it: mark, label, quiet metadata. */
const row = (entry, index, current) => `
  <div class="row${current ? ' is-current' : ''}">
    <span class="mark ${current ? 'mark-branch' : ''}">${wrap(entry.inner)}</span>
    <span class="name">${entry.label}</span>
    <span class="num">${String(index + 1).padStart(2, '0')}</span>
  </div>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  :root{color-scheme:dark}
  body{margin:0;padding:22px 24px 26px;background:#0f1115;color:#e3e7ee;
    font:13px/1.45 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
  h2{margin:0 0 3px;font-size:14px;font-weight:600;letter-spacing:-.01em}
  .sub{margin:0 0 14px;color:#7d858f;font-size:11.5px}
  .cols{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
  .group{background:#15181d;border:1px solid #23282f;border-radius:10px;padding:6px 0 4px}
  .thead{padding:5px 12px 7px;color:#6f7784;font:600 10px ui-monospace,monospace;letter-spacing:.08em;text-transform:uppercase}
  .row{display:flex;align-items:center;gap:9px;height:31px;padding:0 12px;border-radius:6px;margin:0 4px}
  .row.is-current{background:#1e2husband;background:#1e2229}
  .mark{display:inline-flex;align-items:center;justify-content:center;width:16px;flex:none;color:#767e8b}
  .mark svg{display:block;fill:currentColor}
  .mark-branch{color:#4d8dff}
  .name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}
  .num{flex:none;color:#4e5561;font:10px ui-monospace,monospace}
  .foot{margin-top:18px;color:#7d858f;font-size:11.5px;line-height:1.7}
</style></head><body>
  <h2>侧边栏实际观感（14px · 深色主题 · 真实行高）</h2>
  <p class="sub">左边是图标单独出现的样子，右侧是图标 + 会话标题的组合。<b>蓝色</b>那行是当前选中的工作树会话作对照。</p>
  <div class="cols">
    ${[0, 1, 2].map((col) => {
      const slice = entries.slice(col * 6, col * 6 + 6);
      return `<div class="group"><div class="thead">候选 ${String(col * 6 + 1).padStart(2, '0')}–${String(col * 6 + 6).padStart(2, '0')}</div>${slice.map((entry, i) => row(entry, col * 6 + i, false)).join('')}</div>`;
    }).join('')}
  </div>
  <div class="foot">告诉我编号即可（主检出一个、工作树一个，可不同）。<br>现在主检出用 09（分支），工作树用「分支 + 方块」的变体。</div>
</body></html>`;

await writeFile(join(dir, 'sidebar.html'), html, 'utf8');
console.log('sidebar preview written');
