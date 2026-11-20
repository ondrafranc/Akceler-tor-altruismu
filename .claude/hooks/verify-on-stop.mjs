#!/usr/bin/env node
/**
 * Stop hook: when app source or tests differ from the last verified state,
 * run the same fast gates as CI (svelte-check + vitest) before Claude may stop.
 * Exit 2 feeds the failure back to Claude. Never blocks twice in a row.
 */
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const app = path.join(root, 'akcelerator-landing-page');

let input = {};
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  // No stdin payload: behave as a first attempt.
}
if (input.stop_hook_active) process.exit(0);
if (!fs.existsSync(path.join(app, 'node_modules'))) process.exit(0);

const watched = ['src', 'tests', 'static', 'jsconfig.json', 'package.json', 'svelte.config.js', 'vite.config.js'];
const status = spawnSync(
  'git',
  ['-c', 'core.quotepath=off', 'status', '--porcelain', '--', ...watched.map((p) => `akcelerator-landing-page/${p}`)],
  { cwd: root, encoding: 'utf8' }
);
const changed = (status.stdout || '')
  .split('\n')
  .filter(Boolean)
  .map((line) => line.slice(3).split(' -> ').pop().replace(/^"|"$/g, ''));
if (status.status !== 0 || changed.length === 0) process.exit(0);

const hash = crypto.createHash('sha256');
for (const rel of changed.sort()) {
  hash.update(rel);
  try {
    const stat = fs.statSync(path.join(root, rel));
    hash.update(`${stat.mtimeMs}:${stat.size}`);
  } catch {
    hash.update('deleted');
  }
}
const signature = hash.digest('hex');
const rootId = crypto.createHash('sha256').update(root).digest('hex').slice(0, 12);
const stateFile = path.join(os.tmpdir(), `aa-verified-${rootId}.txt`);
try {
  if (fs.readFileSync(stateFile, 'utf8') === signature) process.exit(0);
} catch {
  // Not verified yet.
}

for (const script of ['check', 'test:unit']) {
  const run = spawnSync('npm', ['run', script], { cwd: app, encoding: 'utf8', shell: true });
  if (run.status !== 0) {
    const tail = `${run.stdout || ''}\n${run.stderr || ''}`.trim().split('\n').slice(-40).join('\n');
    process.stderr.write(
      `npm run ${script} selhal v akcelerator-landing-page/. Oprav příčinu, kontrolu neobcházej.\n\n${tail}\n`
    );
    process.exit(2);
  }
}

fs.writeFileSync(stateFile, signature);
process.exit(0);
