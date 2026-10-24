/**
 * Build the icon candidate contact sheet.
 *
 * Renders every candidate with the real 16px geometry at several display sizes
 * so the choice is made from actual pixels rather than a description.
 * @module scripts/icon-candidates
 */
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const dir = join(tmpdir(), 'octicons');
const files = (await readdir(dir)).filter((name) => name.endsWith('.svg'));

/** Display metadata: what each glyph would mean as a "main checkout" mark. */
const META = {
  'repo': ['仓库 / 主检出', 'Octicon repo — 书本形仓库'],
  'file-directory': ['目录', 'Octicon file-directory — 文件夹'],
  'file-directory-fill': ['目录（实心）', 'Octicon file-directory-fill — 实心文件夹'],
  'home': ['主目录 / 家', 'Octicon home — 房子'],
  'database': ['库', 'Octicon database — 圆柱数据库'],
  'git-branch': ['分支（当前用）', 'Octicon git-branch — 分支'],
  'git-merge': ['合并', 'Octicon git-merge — 合并箭头'],
  'file-submodule': ['子模块 / 嵌套检出', 'Octicon file-submodule — 带角标的文件夹'],
  'tasklist': ['任务清单', 'Octicon tasklist — 复选清单'],
  'stack': ['堆叠', 'Octicon stack — 层叠方块'],
  'versions': ['多版本', 'Octicon versions — 叠放卡片'],
  'terminal': ['终端', 'Octicon terminal — 命令行窗口'],
  'command-palette': ['命令面板', 'Octicon command-palette — 调色板'],
  'list-unordered': ['列表', 'Octicon list-unordered — 无序列表'],
  'rows': ['行', 'Octicon rows — 分行'],
  'apps': ['应用格', 'Octicon apps — 宫格'],
  'container': ['容器', 'Octicon container — 箱体'],
  'cpu': ['处理器', 'Octicon cpu — 芯片'],
};

const entries = [];
for (const file of files.sort()) {
  const name = file.replace(/\.svg$/, '');
  const svg = await readFile(`${dir}/${file}`, 'utf8');
  if (svg.includes('404: Not Found')) continue;
  const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
  if (!inner.startsWith('<path')) continue;
  const meta = META[name] ?? [name, name];
  entries.push({ name, inner, label: meta[0], note: meta[1] });
}

const wrap = (inner) => `<svg viewBox="0 0 16 16" aria-hidden="true">${inner}</svg>`;

const card = (entry, index) => `
  <div class="cell">
    <div class="num">${String(index + 1).padStart(2, '0')}</div>
    <div class="glyphs">
      <span class="g16">${wrap(entry.inner)}</span>
      <span class="g14">${wrap(entry.inner)}</span>
      <span class="g11">${wrap(entry.inner)}</span>
    </div>
    <div class="label">${entry.label}</div>
    <div class="name">${entry.name}</div>
  </div>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<style>
  :root{color-scheme:dark}
  body{margin:0;padding:26px;background:#14161a;color:#e6e9ef;
    font:13px/1.5 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
  h1{margin:0 0 4px;font-size:17px;font-weight:650;letter-spacing:-.01em}
  .sub{color:#8b93a1;font-size:12px;margin-bottom:20px}
  .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px}
  .cell{background:#1c1f24;border:1px solid #2a2f37;border-radius:10px;padding:12px 10px 10px;
    display:flex;flex-direction:column;align-items:center;gap:8px;position:relative}
  .num{position:absolute;top:6px;left:8px;font:600 10px ui-monospace,monospace;color:#5d6572}
  .glyphs{display:flex;align-items:center;gap:12px;color:#dfe4ec;height:34px}
  .glyphs svg{display:block;fill:currentColor}
  .g16 svg{width:16px;height:16px}
  .g14 svg{width:14px;height:14px;opacity:.92}
  .g11 svg{width:11px;height:11px;opacity:.8}
  .label{font-size:11.5px;font-weight:550;text-align:center;line-height:1.35}
  .name{font:10px ui-monospace,monospace;color:#6f7embed;color:#6f7785;text-align:center}
  .hint{margin-top:20px;padding:10px 12px;border-radius:8px;background:#1c1f24;border:1px solid #2a2f37;
    color:#8b93a1;font-size:11.5px;line-height:1.7}
</style></head>
<body>
  <h1>侧边栏「主检出」图标候选</h1>
  <div class="sub">每个候选按 16 / 14 / 11 px 三档渲染（侧边栏实际约 14px）。红框那 4 个会话都在主检出里，现在统一用 05。</div>
  <div class="grid">${entries.map(card).join('')}</div>
  <div class="hint">
    <b>怎么选：</b>告诉我编号即可（可多选：主检出一个、工作树一个）。<br>
    当前：主检出 = 05（分支），工作树 = 分支 + 方块。<br>
    说明：会话图标只反映「所在目录的 Git 身份」，不区分具体会话，所以同一目录下的多个会话必然同图标。
  </div>
</body></html>`;

await writeFile(join(dir, 'sheet.html'), html, 'utf8');
console.log(JSON.stringify(entries.map((entry, index) => `${String(index + 1).padStart(2, '0')} ${entry.name} — ${entry.label}`), null, 1));
