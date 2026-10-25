
import { execFileSync } from 'node:child_process';
import { layoutCommits, countLanes } from '../client/graph-layout.js';

const repo = process.argv[2] || 'E:/repo/deepseek-harness';
const limit = String(process.argv[3] || 300);

const git = (...args) => execFileSync('git', args, {
  cwd: repo, encoding: 'utf8', maxBuffer: 128 * 1024 * 1024,
});

const raw = git('log', '--all', '--date-order', '-n', limit, '--pretty=format:%H%x09%P')
  .trim().split('\n');

const commits = raw.map((line) => {
  const [hash, parents] = line.split('\t');
  return { hash, parents: parents ? parents.trim().split(' ').filter(Boolean) : [] };
});

const rows = layoutCommits(commits);
const lanes = countLanes(rows);
const laneOf = new Map(commits.map((c, i) => [c.hash, rows[i].lane]));
const inPage = new Set(commits.map((c) => c.hash));

// 1. 每条父边都要有一根下行线指向父提交所在列
const badEdges = [];
rows.forEach((r, i) => {
  for (const p of commits[i].parents) {
    if (!inPage.has(p)) continue;            // 父提交在分页外：线到边界为止
    const target = laneOf.get(p);
    if (!r.outgoing.some((o) => o.lane === target)) {
      badEdges.push(commits[i].hash.slice(0, 7) + '->' + p.slice(0, 7));
    }
  }
});
console.log('edges      :', badEdges.length === 0 ? 'ok' : 'BAD ' + badEdges.length + ' ' + badEdges.slice(0, 6).join(' '));

// 2. 被当作 parent 引用的提交，节点上方必须有线接进来；反之不能凭空多线
const referenced = new Set();
rows.forEach((r, i) => commits[i].parents.forEach((p) => referenced.add(p)));
const badTops = [];
rows.forEach((r, i) => {
  const intoNode = r.laneTop || r.incoming.length > 0;
  const mustHave = referenced.has(commits[i].hash);
  if (mustHave !== intoNode) badTops.push(commits[i].hash.slice(0, 7) + (mustHave ? ':missing' : ':phantom'));
});
console.log('top lines  :', badTops.length === 0 ? 'ok' : 'BAD ' + badTops.length + ' ' + badTops.slice(0, 6).join(' '));

// 3. 上一行底部的线，下一行顶部必须接得住（不能断头）
const leaks = [];
for (let i = 1; i < rows.length; i += 1) {
  const prev = rows[i - 1], cur = rows[i];
  const bottom = new Set([...prev.pass, ...prev.outgoing.map((o) => o.lane)]);
  const top = new Set([...cur.pass, ...cur.incoming, ...(cur.laneTop ? [cur.lane] : [])]);
  for (const lane of bottom) if (!top.has(lane)) leaks.push(commits[i].hash.slice(0, 7) + '@C' + lane);
}
console.log('continuity :', leaks.length === 0 ? 'ok' : 'BAD ' + leaks.length + ' ' + leaks.slice(0, 6).join(' '));

// 4. 列号非负
const badLane = rows.filter((r) => r.lane < 0 || r.pass.some((l) => l < 0) || r.outgoing.some((o) => o.lane < 0));
console.log('lane range :', badLane.length === 0 ? 'ok' : 'BAD');

// 5. 列数不超过 git 自己画的宽度 + 余量
const ascii = git('log', '--all', '--date-order', '--graph', '-n', limit, '--pretty=format:%H')
  .trim().split('\n');
const width = Math.max(...ascii.map((line) => {
  const m = line.match(/^[|\\/ *]*/);
  return m ? m[0].replace(/\s+$/, '').length : 0;
}));
const approx = Math.max(1, Math.round((width + 1) / 2));
console.log('lanes      :', lanes, '| git ascii width', width, '(≈' + approx + ' lanes) | rows', rows.length,
  lanes <= approx + 2 ? 'ok' : 'WIDE');
