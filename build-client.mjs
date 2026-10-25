/**
 * Build the browser half into the single-file factory format the module
 * loader serves: `window.__ModuleLoader__.load({ id, factory(require) })`.
 *
 * The served batch URL cannot resolve ES-module specifiers, so every client
 * source module is inlined into one factory scope. Only baseline runtime
 * imports ('react', 'react/jsx-runtime', 'react-dom') map onto `require`;
 * everything else (contract + client/*) concatenates in dependency order.
 *
 * Usage: node build-client.mjs   (writes client.js next to this script)
 * @module dsh-worktree/build-client
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

/** Concatenation order: dependencies first; the entry mounts everything. */
const SOURCES = [
  'contract.js',
  'client/locales.js',
  'client/styles.js',
  'client/icons.js',
  'client/graph-layout.js',
  'client/api.js',
  'client/panel.js',
  'client/view.js',
  'client/decor.js',
  'client/entry.js',
];

/** Strip import/export syntax while keeping declarations in place. */
function inline(source) {
  return source
    .replace(/^import\s+[^;]+;?$/gm, '')
    .replace(/^export\s+\{[^}]*\};?$/gm, '')
    .replace(/^export\s+default\s+/gm, '')
    .replace(/^export\s+(async\s+)?function\b/gm, '$1function')
    .replace(/^export\s+(const|let|var|class)\b/gm, '$1');
}

const parts = [];
for (const source of SOURCES) {
  const text = await readFile(join(root, source), 'utf8');
  parts.push(`//#region ${source}\n${inline(text).trim()}\n//#endregion`);
}

const entry = `window.__ModuleLoader__.load({
  id: 'dsh-worktree',
  factory(require) {
    /** Baseline runtime imports resolved by the module table. */
    const { useState, useEffect, useCallback, useMemo, useRef } = require('react');
    const { jsx, jsxs, Fragment } = require('react/jsx-runtime');
    const { createPortal } = require('react-dom');

${parts.join('\n\n')}

    /** The client plugin definition the cordis client runner mounts. */
    return { name: CLIENT_NAME, inject: CLIENT_INJECT, apply };
  },
});
`;

const banner = `/**
 * dsh-worktree — browser half (generated; sources in client/ + contract.js).
 *
 * Built by build-client.mjs into the module-loader factory format: the loader
 * evaluates this file in the plugin batch and calls the factory for the cordis
 * client plugin definition.
 *
 * @module dsh-worktree/client
 * @generated
 */
`;

await writeFile(join(root, 'client.js'), `${banner}${entry}`, 'utf8');
console.log('client.js written');
