/**
 * Offline smoke test for the dsh-worktree Host half.
 *
 * Drives WorktreeService against a real scratch Git repository and a real pool
 * directory using a minimal adapter over node:child_process, covering status,
 * gitInfo, createWorktree, enterWorktree, switchBranch (occupied / dirty /
 * carried / tracking), and removeWorktree (dirty confirm + force).
 *
 * Usage: node test/smoke.mjs
 * @module dsh-worktree/test/smoke
 */
import { spawn } from 'node:child_process';
import { mkdtemp, mkdir, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { WorktreeService, resolveOptions } from '../index.js';

const cleanEnv = (env) => Object.fromEntries(Object.entries(env ?? {}).filter(([, value]) => value !== undefined));

/** Minimal adapter over child_process matching the DSH subprocess child face. */
function realSpawn(spec) {
  const child = spawn(spec.argv[0], spec.argv.slice(1), {
    cwd: spec.cwd,
    env: { ...process.env, ...cleanEnv(spec.env) },
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
  let settle;
  const done = new Promise((resolvePromise) => {
    settle = resolvePromise;
  });
  const capture = (stream, maxBytes) => {
    const chunks = [];
    let bytes = 0;
    let lossy = false;
    stream.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > (maxBytes ?? 65536)) {
        lossy = true;
        return;
      }
      chunks.push(chunk);
    });
    return {
      readFrom: () => ({ text: Buffer.concat(chunks).toString(), lossy }),
    };
  };
  const collected = { stdout: capture(child.stdout, spec.stdio?.stdout?.maxBytes), stderr: capture(child.stderr, spec.stdio?.stderr?.maxBytes) };
  child.on('error', (error) => {
    settle({ exitCode: null, signal: String(error) });
  });
  child.on('close', (code, signal) => {
    settle({ exitCode: code, signal: signal ?? null });
  });
  spec.signal?.addEventListener('abort', () => {
    try {
      child.kill();
    } catch {
      /* already gone */
    }
  });
  return {
    done,
    collected,
    terminate: () => {
      try {
        child.kill();
      } catch {
        /* already gone */
      }
    },
    waitForExit: () => done.then(() => undefined),
  };
}

let failures = 0;
const check = (label, condition, extra = '') => {
  const mark = condition === true ? 'PASS' : 'FAIL';
  if (condition !== true) failures += 1;
  console.log(`${mark}  ${label}${extra === '' ? '' : ` — ${extra}`}`);
};

const root = await mkdtemp(join(tmpdir(), 'dsh-worktree-smoke-'));
const repo = join(root, 'repo');
const pool = join(root, 'pool');
await mkdir(repo, { recursive: true });

const git = (cwd, ...args) => new Promise((resolvePromise, reject) => {
  const child = spawn('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd, stdio: 'ignore', windowsHide: true });
  child.on('close', (code) => (code === 0 ? resolvePromise() : reject(new Error(`git ${args.join(' ')} -> ${String(code)}`))));
});

try {
  await git(repo, 'init', '-b', 'main');
  await git(repo, 'config', 'user.email', 'smoke@dsh-worktree');
  await git(repo, 'config', 'user.name', 'smoke');
  await writeFile(join(repo, 'a.txt'), 'one\n');
  await git(repo, 'add', '.');
  await git(repo, 'commit', '-m', 'init');
  await git(repo, 'remote', 'add', 'origin', 'https://example.invalid/repo.git');

  const sessions = new Map();
  const workingDirectory = {
    get: (session) => session.cwd,
    set: async (agent, path) => {
      agent.session.cwd = path;
      agent.moves.push(path);
      return path;
    },
  };
  const makeSession = (id, cwd) => {
    const agent = { session: { cwd }, moves: [] };
    sessions.set(id, agent);
    return agent;
  };
  makeSession('s1', repo);
  makeSession('s2', repo);

  const ctx = {
    subprocess: {
      resolveExecutable: async (command) => command,
      spawn: realSpawn,
    },
    fs: {
      resolve: async (path, opts) => ({ path: resolve(opts?.cwd ?? process.cwd(), path) }),
      processPath: (target) => target.path,
      lstat: async () => undefined,
      stat: async (target) => {
        try {
          const info = await stat(target.path);
          return info.isDirectory() ? { type: 'directory', path: target.path } : { type: 'file', path: target.path };
        } catch {
          return undefined;
        }
      },
    },
    workingDirectory,
    agents: { get: (id) => sessions.get(id) },
  };
  const service = new WorktreeService(ctx, resolveOptions({ poolDirectory: pool }));

  // --- status -------------------------------------------------------------
  let value = await service.status('s1');
  check('status: isRepo', value.ok === true && value.isRepo === true, `branch=${String(value.branch)}`);
  check('status: current branch main', value.branch === 'main');
  check('status: one local branch', value.branches.filter((b) => b.kind === 'local').length === 1);
  check('status: main worktree listed', value.worktrees.length === 1 && value.worktrees[0].isMain === true);
  check('status: clean tree', value.dirtyCount === 0, `dirty=${String(value.dirtyCount)}`);
  check('status: not a worktree', value.isWorktree === false);

  value = await service.status('missing');
  check('status: cold session fails structured', value.ok === false && value.code === 'session-unavailable');

  // --- gitInfo ------------------------------------------------------------
  value = await service.gitInfo([repo, join(pool, 'nope')]);
  check('gitInfo: repo identified', value.items[0].isRepo === true && value.items[0].branch === 'main');
  check('gitInfo: absent path not a repo', value.items[1].isRepo === false);

  // --- createWorktree -----------------------------------------------------
  value = await service.createWorktree({ sessionId: 's1', name: 'task-1' });
  check('createWorktree: ok', value.ok === true, JSON.stringify(value));
  check('createWorktree: pool path', value.ok === true && value.path === join(pool, 'task-1'));
  const worktreePath = value.path;
  value = await service.createWorktree({ sessionId: 's1', name: 'task-1' });
  check('createWorktree: duplicate branch fails', value.ok === false && value.code === 'branch-exists');
  value = await service.createWorktree({ sessionId: 's1', name: '../escape' });
  check('createWorktree: traversal name rejected', value.ok === false && value.code === 'invalid-name');
  value = await service.createWorktree({ sessionId: 's1', name: 'bad name..x' });
  check('createWorktree: git-rejected name mapped', value.ok === false && value.code === 'invalid-name', `code=${String(value.code)}`);
  value = await service.createWorktree({ sessionId: 's1', name: 'task-bad', startPoint: 'no-such-ref' });
  check('createWorktree: bad start point mapped', value.ok === false && value.code === 'start-point-invalid', `code=${String(value.code)}`);

  // --- gitInfo after creation ---------------------------------------------
  value = await service.gitInfo([repo, worktreePath]);
  check('gitInfo: worktree recognized', value.items[1].isRepo === true && value.items[1].isWorktree === true && value.items[1].worktreeName === 'task-1', JSON.stringify(value.items[1]));
  check('gitInfo: worktree branch', value.items[1].branch === 'task-1');

  // --- enterWorktree ------------------------------------------------------
  value = await service.enterWorktree({ sessionId: 's2', path: worktreePath });
  check('enterWorktree: ok', value.ok === true && value.cwd === worktreePath);
  check('enterWorktree: session moved', sessions.get('s2').session.cwd === worktreePath);
  value = await service.enterWorktree({ sessionId: 's2', path: join(root, 'missing') });
  check('enterWorktree: absent path mapped', value.ok === false && value.code === 'not-a-directory');

  // --- switchBranch: occupied ----------------------------------------------
  value = await service.switchBranch({ sessionId: 's1', branch: 'task-1' });
  check('switch: occupied detected', value.ok === false && value.code === 'branch-occupied' && value.occupiedPath === worktreePath, JSON.stringify(value));

  // --- switchBranch: dirty flow --------------------------------------------
  await writeFile(join(repo, 'b.txt'), 'two\n');
  value = await service.switchBranch({ sessionId: 's1', branch: 'main' });
  check('switch: already current with dirty note', value.ok === true && value.mode === 'already-current');
  await git(repo, 'branch', 'feature-x');
  value = await service.switchBranch({ sessionId: 's1', branch: 'feature-x' });
  check('switch: dirty needs consent', value.ok === false && value.code === 'dirty-tree' && value.dirtyCount === 1, JSON.stringify(value));
  value = await service.switchBranch({ sessionId: 's1', branch: 'feature-x', allowDirty: true });
  check('switch: carried with consent', value.ok === true && value.mode === 'switched' && value.carried === true, JSON.stringify(value));
  value = await service.status('s1');
  check('switch: repo now on feature-x', value.branch === 'feature-x' && value.dirtyCount === 1);
  value = await service.switchBranch({ sessionId: 's1', branch: 'main', allowDirty: true });
  check('switch: back to main carrying', value.ok === true && value.branch === 'main');

  // --- createBranch (atomic: branch in place, no worktree) -----------------
  value = await service.createBranch({ sessionId: 's1', name: 'inplace-1' });
  check('createBranch: dirty needs consent', value.ok === false && value.code === 'dirty-tree', JSON.stringify(value));
  value = await service.createBranch({ sessionId: 's1', name: 'inplace-1', allowDirty: true });
  check('createBranch: ok', value.ok === true && value.mode === 'created', JSON.stringify(value));
  check('createBranch: branch exists', (await service.status('s1')).branches.some((b) => b.name === 'inplace-1'));
  check('createBranch: no worktree added', (await service.status('s1')).worktrees.length === 2);
  value = await service.createBranch({ sessionId: 's1', name: 'inplace-1' });
  check('createBranch: duplicate rejected', value.ok === false && value.code === 'branch-exists');
  value = await service.createBranch({ sessionId: 's1', name: '../bad' });
  check('createBranch: invalid name rejected', value.ok === false && value.code === 'invalid-name');
  value = await service.createBranch({ sessionId: 's1', name: 'inplace-1' });
  check('createBranch: existing branch rejected', value.ok === false && value.code === 'branch-exists');
  value = await service.createBranch({ sessionId: 'ghost', name: 'x-1' });
  check('createBranch: cold session mapped', value.ok === false && value.code === 'session-unavailable');

  // --- switchBranch: remote-only -------------------------------------------
  await git(repo, 'update-ref', 'refs/remotes/origin/remote-only', 'HEAD');
  value = await service.switchBranch({ sessionId: 's1', branch: 'origin/remote-only', allowDirty: true });
  check('switch: tracking branch created', value.ok === true && value.mode === 'created-tracking' && value.branch === 'remote-only' && value.upstream === 'origin/remote-only', JSON.stringify(value));
  value = await service.switchBranch({ sessionId: 's1', branch: 'no-such-branch' });
  check('switch: unknown branch mapped', value.ok === false && value.code === 'branch-not-found');
  value = await service.switchBranch({ sessionId: 'ghost', branch: 'main' });
  check('switch: cold session mapped', value.ok === false && value.code === 'session-unavailable');

  // --- status shows worktrees + occupancy ----------------------------------
  value = await service.status('s1');
  const listedTask = value.worktrees.find((entry) => entry.name === 'task-1');
  check('status: pool worktree listed', listedTask !== undefined && listedTask.inPool === true && listedTask.branch === 'task-1');
  const occupiedMain = value.branches.find((entry) => entry.name === 'main');
  check('status: main not occupied for own checkout', occupiedMain?.occupiedPath == null);
  const taskBranch = value.branches.find((entry) => entry.name === 'task-1');
  check('status: occupied branch annotated', taskBranch?.occupiedPath === worktreePath);

  // --- removeWorktree ------------------------------------------------------
  value = await service.removeWorktree({ sessionId: 's1', path: repo });
  check('remove: outside pool refused', value.ok === false && (value.code === 'outside-pool' || value.code === 'main-worktree'), `code=${String(value.code)}`);
  value = await service.removeWorktree({ sessionId: 's1', path: worktreePath });
  check('remove: clean pool worktree removed', value.ok === true, JSON.stringify(value));
  value = await service.gitInfo([worktreePath]);
  check('remove: directory gone from git', value.items[0].isRepo === false || value.items[0].worktreeName !== 'task-1');

  // --- removeWorktree dirty flow -------------------------------------------
  await writeFile(join(repo, 'c.txt'), 'three\n');
  await git(repo, 'add', '.');
  await git(repo, 'commit', '-m', 'c');
  value = await service.createWorktree({ sessionId: 's1', name: 'task-2' });
  check('createWorktree: second ok', value.ok === true, JSON.stringify(value));
  const secondPath = value.ok === true ? value.path : repo;
  await writeFile(join(secondPath, 'd.txt'), 'four\n');
  value = await service.removeWorktree({ sessionId: 's1', path: secondPath });
  check('remove: dirty requires consent', value.ok === false && value.code === 'dirty-worktree' && value.dirtyCount === 1, JSON.stringify(value));
  value = await service.removeWorktree({ sessionId: 's1', path: secondPath, force: true });
  check('remove: forced removal ok', value.ok === true, JSON.stringify(value));

  // --- non-repo session ----------------------------------------------------
  const plain = join(root, 'plain');
  await mkdir(plain);
  makeSession('s3', plain);
  value = await service.status('s3');
  check('status: non-repo reported', value.ok === true && value.isRepo === false);
  value = await service.switchBranch({ sessionId: 's3', branch: 'main' });
  check('switch: non-repo mapped', value.ok === false && value.code === 'not-a-repo');

  service.dispose();
  console.log(failures === 0 ? '\nSMOKE OK' : `\nSMOKE FAILED (${String(failures)} checks)`);
} finally {
  await rm(root, { recursive: true, force: true }).catch(() => undefined);
}
process.exitCode = failures === 0 ? 0 : 1;
