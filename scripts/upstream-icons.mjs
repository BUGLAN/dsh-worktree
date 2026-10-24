/**
 * Render the upstream "worktree" and "main branch" glyphs side by side.
 *
 * The point is to compare what real tools ship, not what I would invent:
 *  - VS Code has dedicated `worktree` codicons (0xEC7E) plus `worktree-small`,
 *    which is the closest thing to an official worktree mark in the ecosystem.
 *  - Lucide ships `git-branch`, `git-fork`, `folder-git`, `folder-git-2`.
 *  - Octicons (GitHub) ships `git-branch`, `repo`, `file-submodule`.
 * @module scripts/upstream-icons
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const root = join(tmpdir(), 'icons2');
const lucideDir = root;
const octoDir = join(tmpdir(), 'octicons');

const LUCIDE_LABELS = {
  'git-branch': '分支',
  'git-fork': '分叉',
  'git-merge': '合并',
  'folder-git': 'Git 文件夹',
  'folder-git-2': 'Git 文件夹 2',
  'git-branch-plus': '新建分支',
  'git-commit-horizontal': '提交',
  network: '网络',
  split: '分叉路径',
  layers: '层',
};

const OCTO_LABELS = {
  'git-branch': '分支',
  ripgrep: 'x',
  repo: '仓库',
  'file-submodule': '子模块',
  'file-directory': '目录',
};

async function readIcon(dir, name, prefix) {
  try {
    const svg = await readFile(join(dir, `${prefix}${name}.svg`), 'utf8');
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim();
    return inner.startsWith('<path') ? inner : null;
  } catch {
    return null;
  }
}

const lucide = [];
for (const name of Object.keys(LUCIDE_LABELS)) {
  const inner = await readIcon(lucideDir, name, 'lucide-');
  if (inner !== null) lucide.push({ name, inner, label: LUCIDE_LABELS[name] });
}

const octo = [];
for (const [name, label] of Object.entries(OCTO_LABELS)) {
  if (name === 'ripgrep') continue;
  const inner = await readIcon(octoDir, name, '');
  if (inner !== null) octo.push({ name, inner, label });
}

const wrapSvg = (inner, size) => `<svg viewBox="0 0 16 16" width="${size}" height="${size}">${inner}</svg>`;
const wrapLucide = (inner, size) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;

/** Codicon glyphs are a font: render the codepoint with the vendored font. */
const codicon = (size, cls) => `<span class="codicon ${cls}" style="font-size:${size}px"></span>`;

const cell = (inner, label, note, sizeWrap, size) => `
  <div class="cell">
    <div class="glyph">${sizeWrap(inner, size)}</div>
    <div class="label">${label}</div>
    <div class="note">${note}</div>
  </div>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  @font-face{font-family:"codicon";src:url("file:///${join(root, 'package/dist/codicon.ttf').replace(/\\/g, '/')}") format("truetype")}
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;padding:26px 30px 34px;background:#0f1115;color:#e3e7ee;
    font:13px/1.5 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
  h1{margin:0 0 3px;font-size:17px;font-weight:650;letter-spacing:-.015em}
  .sub{color:#7d858f;font-size:11.5px;margin:0 0 20px}
  h2{margin:22px 0 10px;font-size:13px;font-weight:600;color:#c8cfd9}
  .src{font-size:10.5px;color:#61697a;margin:-6px 0 10px;font-family:ui-monospace,monospace}
  .grid{display:grid;grid-template-columns:repeat(6,1fr);gap:9px;max-width:1140px}
  .cell{background:#171a1f;border:1px solid #262b33;border-radius:9px;padding:13px 8px 10px;
    display:flex;flex-direction:column;align-items:center;gap:7px}
  .glyph{height:30px;display:flex;align-items:center;color:#dfe4ec}
  .glyph svg{display:block;fill:currentColor}
  .label{font-size:11.5px;font-weight:550;text-align:center}
  .note{font:9.5px ui-monospace,monospace;color:#5d6572;text-align:center;word-break:break-all;line-height:1.4}
  .codicon{font-family:"codicon";font-style:normal;color:#dfe4ec;line-height:1}
  .codicon.codicon-worktree:before{content:"\\ec7e"}
  .codicon.codicon-worktree-small:before{content:"\\ec7d"}
  .codicon.codicon-worktree-compact:before{content:"\\ecbd"}
  .codicon.codicon-git-branch:before{content:"\\ec16"}
  .codicon.codicon-repo:before{content:"\\ea62"}
  .row{display:flex;gap:22px;align-items:center;background:#171a1f;border:1px solid #262b33;
    border-radius:10px;padding:14px 18px;margin-top:10px;max-width:1140px}
  .row .item{display:flex;align-items:center;gap:8px;color:#c3cad4;font-size:12px}
  .row .item .codicon{font-size:16px}
  .tip{margin-top:20px;padding:11px 14px;border-radius:9px;background:#171a1f;border:1px solid #262b33;
    color:#8b93a1;font-size:11.5px;line-height:1.75;max-width:1140px}
  .tip b{color:#c8cfd9}
</style></head><body>
  <h1>上游真实图标：worktree 与 main 分支</h1>
  <p class="sub">全部来自官方仓库原始文件，未做改造。点击下方文件可在浏览器查看本页。</p>

  <h2>一、VS Code Codicons —— 唯一有「worktree」专用字形的主流图标库</h2>
  <div class="src">@vscode/codicons v0.0.46 · worktree = U+EC7E</div>
  <div class="grid">
    <div class="cell"><div class="glyph">${codicon(22, 'codicon-worktree')}</div><div class="label">worktree</div><div class="note">ec7e · 官方 worktree</div></div>
    <div class="cell"><div class="glyph">${codicon(22, 'codicon-worktree-small')}</div><div class="label">worktree-small</div><div class="note">ec7d · 小尺寸变体</div></div>
    <div class="cell"><div class="glyph">${codicon(22, 'codicon-worktree-compact')}</div><div class="label">worktree-compact</div><div class="note">ecbd · 紧凑变体</div></div>
    <div class="cell"><div class="glyph">${codicon(22, 'codicon-git-branch')}</div><div class="label">git-branch</div><div class="note">ec16 · 分支</div></div>
    <div class="cell"><div class="glyph">${codicon(22, 'codicon-repo')}</div><div class="label">repo</div><div class="note">ea62 · 仓库</div></div>
  </div>

  <div class="row">
    <span class="item">${codicon(16, 'codicon-worktree')} worktree 16px</span>
    <span class="item">${codicon(14, 'codicon-worktree')} worktree 14px</span>
    <span class="item">${codicon(11, 'codicon-worktree-small')} small 11px</span>
    <span class="item">${codicon(16, 'codicon-git-branch')} git-branch 16px</span>
    <span class="item">${codicon(14, 'codicon-repo')} repo 14px</span>
  </div>

  <h2>二、Lucide（24px 网格，描边风格）</h2>
  <div class="src">lucide-icons/lucide · icons/*.svg</div>
  <div class="grid">
    ${lucide.map((entry) => cell(entry.inner, entry.label, entry.name, wrapLucide, 20)).join('')}
  </div>

  <h2>三、Octicons / GitHub（16px 网格，填充风格）</h2>
  <div class="src">primer/octicons · icons/*-16.svg</div>
  <div class="grid">
    ${octo.map((entry) => cell(entry.inner, entry.label, entry.name, wrapSvg, 16)).join('')}
  </div>

  <div class="tip">
    <b>结论：</b>「worktree」在图标语言里并没有像分支那样统一的符号。VS Code 是唯一内置专用字形的编辑器（<code>worktree</code> / <code>worktree-small</code> / <code>worktree-compact</code>），其余工具都借用 <code>git-branch</code> 或 <code>folder-git</code>。<br>
    <b>main 分支：</b>没有专属图标，全行业都用 <code>git-branch</code>；GitHub 额外用 <code>repo</code>（书本）表示仓库本体。<br>
    <b>可落地做法：</b>主检出用 <code>repo</code>（书本）或 <code>worktree-small</code> 的反义，工作树用 VS Code 的 <code>worktree</code> 字形 —— 两者形状完全不同，14px 下可辨。
  </div>
</body></html>`;

await writeFile(join(root, 'upstream.html'), html, 'utf8');
console.log('upstream sheet written');
