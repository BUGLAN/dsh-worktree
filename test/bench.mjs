/**
 * Latency benchmark for the Host `status` path.
 *
 * Runs the real service against the real plugin repository and reports how many
 * Git processes one panel open costs and how long it takes, so the performance
 * change is measured rather than asserted.
 *
 * Usage: node test/bench.mjs [iterations]
 * @module dsh-worktree/test/bench
 */
import { spawn } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { resolve } from 'node:path';

import { WorktreeService, resolveOptions } from '../index.js';

const iterations = Number(process.argv[2] ?? 5);
const repo = resolve(process.cwd());

const cleanEnv = (env) => Object.fromEntries(Object.entries(env ?? {}).filter(([, value]) => value !== undefined));

let gitCalls = 0;
let spawnMs = 0;

function realSpawn(spec) {
  const startedAt = performance.now();
  gitCalls += 1;
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
    stream.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes <= (maxBytes ?? 65536)) chunks.push(chunk);
    });
    return { readFrom: () => ({ text: Buffer.concat(chunks).toString(), lossy: false }) };
  };
  const collected = { stdout: capture(child.stdout, spec.stdio?.stdout?.maxBytes), stderr: capture(child.stderr, spec.stdio?.stderr?.maxBytes) };
  child.on('error', () => settle({ exitCode: null, signal: 'error' }));
  child.on('close', (code, signal) => {
    spawnMs += performance.now() - startedAt;
    settle({ exitCode: code, signal: signal ?? null });
  });
  spec.signal?.addEventListener('abort', () => {
    try {
      child.kill();
    } catch {
      /* gone */
    }
  });
  return {
    done,
    collected,
    terminate: () => {
      try {
        child.kill();
      } catch {
        /* gone */
      }
    },
    waitForExit: () => done.then(() => undefined),
  };
}

const session = { cwd: repo };
const agent = { session, moves: [] };
const sessions = new Map([['bench', agent]]);
const ctx = {
  subprocess: { resolveExecutable: async (command) => command, spawn: realSpawn },
  fs: {
    resolve: async (path, opts) => ({ path: resolve(opts?.cwd ?? process.cwd(), path) }),
    processPath: (target) => target.path,
    lstat: async () => undefined,
    stat: async (target) => {
      try {
        const info = await stat(target.path);
        return info.isDirectory() ? { type: 'directory' } : { type: 'file' };
      } catch {
        return undefined;
      }
    },
  },
  workingDirectory: { get: (value) => value.cwd, set: async (_, path) => path },
  agents: { get: (id) => sessions.get(id) },
};

const service = new WorktreeService(ctx, resolveOptions({ poolDirectory: resolve(process.cwd(), '.bench-pool'), cacheTtlMs: 8000 }));

// Cold pass (cache empty), then warm passes.
const cold = [];
for (let index = 0; index < iterations; index += 1) {
  gitCalls = 0;
  spawnMs = 0;
  const startedAt = performance.now();
  const value = await service.status('bench');
  const elapsed = performance.now() - startedAt;
  cold.push({ elapsed, gitCalls, spawnMs, ok: value.ok, worktrees: value.worktrees?.length ?? 0, branches: value.branches?.length ?? 0 });
  // Drop the cache between iterations to measure the true cold path each time.
  service.cache.clear();
}

gitCalls = 0;
spawnMs = 0;
const warmStart = performance.now();
await service.status('bench');
const warmFirst = performance.now() - warmStart;
gitCalls = 0;
spawnMs = 0;
const warmStart2 = performance.now();
await service.status('bench');
const warmSecond = performance.now() - warmStart2;
const warmSecondCalls = gitCalls;

const average = (values) => values.reduce((sum, value) => sum + value, 0) / values.length;
console.log(JSON.stringify({
  iterations,
  cold: {
    avgMs: Number(average(cold.map((entry) => entry.elapsed)).toFixed(1)),
    minMs: Number(Math.min(...cold.map((entry) => entry.elapsed)).toFixed(1)),
    avgGitCalls: Number(average(cold.map((entry) => entry.gitCalls)).toFixed(1)),
    avgSpawnMs: Number(average(cold.map((entry) => entry.spawnMs)).toFixed(1)),
    sample: cold[0],
  },
  warm: {
    firstMs: Number(warmFirst.toFixed(1)),
    secondMs: Number(warmSecond.toFixed(1)),
    secondGitCalls: warmSecondCalls,
  },
}, null, 1));

service.dispose();
