/**
 * Render the shipped sidebar marks at real size.
 *
 * Answers one question only: at 14px, can the main checkout and a linked
 * worktree be told apart? Both paths are read from the plugin's own
 * `client/icons.js`, so this cannot drift from what ships.
 * @module scripts/verify-marks
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const iconsSource = await readFile(new URL('../client/icons.js', import.meta.url), 'utf8');

const pick = (name) => {
  const match = new RegExp(`const ${name} = '([^']+)'`).exec(iconsSource);
  if (match === null) throw new Error(`${name} not found in client/icons.js`);
  return match[1];
};

const BRANCH = pick('GIT_BRANCH_PATH');
const WORKTREE = pick('VSCODE_WORKTREE_PATH');

const svg = (path, size, color) => `<svg viewBox="0 0 16 16" width="${size}" height="${size}" style="fill:${color};display:block"><path d="${path}"/></svg>`;

/** Sample rows shaped like the real sidebar: mark, title, time. */
const row = (label, markSvg, current) => `
  <div class="row${current ? ' cur' : ''}">
    <span class="mark">${markSvg}</span>
    <span class="name">${label}</span>
    <span class="time">12分钟</span>
  </div>`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  :root{color-scheme:dark}
  *{box-sizing:border-box}
  body{margin:0;padding:26px 30px 30px;background:#0f1115;color:#e3e7ee;
    font:13px/1.5 -apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
  h1{margin:0 0 3px;font-size:16px;font-weight:650;letter-spacing:-.015em}
  .sub{color:#7d858f;font-size:11.5px;margin:0 0 18px}
  .panels{display:grid;grid-template-columns:340px 340px;gap:20px;align-items:start}
  .panel{background:#14171c;border:1px solid #23282f;border-radius:11px;padding:7px 6px 6px}
  .thead{display:flex;align-items:center;gap:7px;padding:6px 9px 8px;color:#c3cad4;font-size:13px;font-weight:550}
  .thead svg{color:#6f7embed}
  .row{display:flex;align-items:center;gap:9px;height:32px;padding:0 9px;border-radius:7px;margin:0 2px}
  .row.cur{background:#1d2129}
  .mark{display:inline-flex;align-items:center;justify-content:center;width:16px;flex:none}
  .name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .time{flex:none;color:#5d6572;font-size:11px}
  .cap{margin:10px 2px 0;font:10.5px ui-monospace,monospace;color:#61697a}
  .zoom{margin-top:22px;background:#14171c;border:1px solid #23282f;border-radius:11px;padding:14px 16px}
  .zoom h2{margin:0 0 12px;font-size:12px;font-weight:600;color:#c8cfd9}
  .zrow{display:flex;align-items:center;gap:26px}
  .zi{display:flex;flex-direction:column;align-items:center;gap:7px}
  .zi .lbl{font:10px ui-monospace,monospace;color:#61697a}
</style></head><body>
  <h1>实际图标（14px）· 主检出 vs 工作树</h1>
  <p class="sub">两个路径都从 <code>client/icons.js</code> 直接读出，与实际发布一致。</p>

  <div class="panels">
    <div class="panel">
      <div class="thead">dsh-worktree</div>
      ${row('DSH插件Worktree分支能力展示', svg(BRANCH, 14, '#767e8b'), true)}
      ${row('Greeting', svg(BRANCH, 14, '#767e8b'), false)}
      ${row('查询当前工作目录', svg(BRANCH, 14, '#767e8b'), false)}
      ${row('Greeting', svg(BRANCH, 14, '#767e8b'), false)}
      <div class="cap">主检出：分支图标（你现有的样子，不变）</div>
    </div>
    <div class="panel">
      <div class="thead">dsh-worktree</div>
      ${row('wt-4512 · feat/abc', svg(WORKTREE, 14, '#4d8dff'), true)}
      ${row('wt-7c3e · fix/login', svg(WORKTREE, 14, '#4d8dff'), false)}
      ${row('wt-9a01 · chore/deps', svg(WORKTREE, 14, '#4d8dff'), false)}
      ${row('wt-2b44 · docs', svg(WORKTREE, 14, '#4d8dff'), false)}
      <div class="cap">工作树：VS Code worktree 图标（拐角箭头）</div>
    </div>
  </div>

  <div class="zoom">
    <h2>放大对照（左：分支 / 右：worktree），以及 11px 小尺寸是否还可辨</h2>
    <div class="zrow">
      <div class="zi">${svg(BRANCH, 48, '#e3e7ee')}<span class="lbl">branch 48</span></div>
      <div class="zi">${svg(WORKTREE, 48, '#e3e7ee')}<span class="lbl">worktree 48</span></div>
      <div class="zi">${svg(BRANCH, 16, '#e3e7ee')}<span class="lbl">16</span></div>
      <div class="zi">${svg(WORKTREE, 16, '#e3e7ee')}<span class="lbl">16</span></div>
      <div class="zi">${svg(BRANCH, 14, '#e3e7ee')}<span class="lbl">14</span></div>
      <div class="zi">${svg(WORKTREE, 14, '#e3e7ee')}<span class="lbl">14</span></div>
      <div class="zi">${svg(BRANCH, 11, '#e3e7ee')}<span class="lbl">11</span></div>
      <div class="zi">${svg(WORKTREE, 11, '#e3e7ee')}<span class="lbl">11</span></div>
    </div>
  </div>
</body></html>`;

const out = join(tmpdir(), 'icons2', 'marks.html');
await writeFile(out, html, 'utf8');
console.log(out);
