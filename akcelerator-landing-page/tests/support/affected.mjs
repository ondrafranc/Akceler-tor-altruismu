#!/usr/bin/env node
/**
 * Runs the E2E specifications that the current change needs, and only those.
 *
 * The change is everything not yet on `origin/main`: commits of the current branch plus the working tree
 * (staged, unstaged and untracked files).
 *
 * Usage:
 *   node tests/support/affected.mjs            run the affected specifications
 *   node tests/support/affected.mjs --list     only print what would run
 *   node tests/support/affected.mjs --all      run the whole suite
 *   node tests/support/affected.mjs -- -g ET4  pass the rest to Playwright
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { selectSpecs } from './affected-rules.mjs';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.resolve(app, '..');

const args = process.argv.slice(2);
const passThroughAt = args.indexOf('--');
const own = passThroughAt >= 0 ? args.slice(0, passThroughAt) : args;
const passThrough = passThroughAt >= 0 ? args.slice(passThroughAt + 1) : [];
const listOnly = own.includes('--list');
const forceAll = own.includes('--all');

/** @param {string[]} gitArgs */
function git(gitArgs) {
  const run = spawnSync('git', ['-c', 'core.quotepath=off', ...gitArgs], { cwd: root, encoding: 'utf8' });
  return run.status === 0 ? run.stdout : '';
}

function changedFiles() {
  /** @type {Set<string>} */
  const files = new Set();
  for (const line of git(['status', '--porcelain', '--untracked-files=all']).split('\n')) {
    if (!line) continue;
    const name = line.slice(3).split(' -> ').pop();
    if (name) files.add(name.replace(/^"|"$/g, ''));
  }
  const base = git(['merge-base', 'HEAD', 'origin/main']).trim();
  if (base) {
    for (const name of git(['diff', '--name-only', `${base}..HEAD`]).split('\n')) {
      if (name) files.add(name);
    }
  }
  return [...files];
}

const selection = forceAll
  ? { all: true, specs: [], reasons: ['whole suite: asked for with --all'] }
  : selectSpecs(changedFiles());

if (!selection.all && selection.specs.length === 0) {
  console.log('E2E: nothing to run, the change touches no page.');
  process.exit(0);
}

console.log(selection.all ? 'E2E: whole suite' : `E2E: ${selection.specs.join(', ')}`);
for (const reason of selection.reasons.slice(0, 8)) console.log(`  ${reason}`);
if (selection.reasons.length > 8) console.log(`  ... and ${selection.reasons.length - 8} more`);
if (listOnly) process.exit(0);

const env = { ...process.env };
// Contradicting colour switches make Node print a warning for every worker.
delete env.NO_COLOR;

const playwright = path.join(app, 'node_modules/@playwright/test/cli.js');
const run = spawnSync(
  process.execPath,
  [playwright, 'test', ...selection.specs.map((spec) => `tests/${spec}`), ...passThrough],
  { cwd: app, env, stdio: 'inherit' }
);
process.exit(run.status ?? 1);
