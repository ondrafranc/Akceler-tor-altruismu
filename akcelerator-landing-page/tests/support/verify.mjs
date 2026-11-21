#!/usr/bin/env node
/**
 * One command that says whether a change is sound: type check, unit tests and the E2E specifications
 * the change needs. Stops at the first failure. A passing stage prints one line; a failing one prints
 * the end of its output.
 *
 * Usage:
 *   node tests/support/verify.mjs           check + unit + affected E2E
 *   node tests/support/verify.mjs --full    check + unit + the whole E2E suite
 *   node tests/support/verify.mjs --no-e2e  check + unit
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const flags = new Set(process.argv.slice(2));

const env = { ...process.env };
delete env.NO_COLOR;

/** @param {number} startedAt */
const seconds = (startedAt) => `${((Date.now() - startedAt) / 1000).toFixed(1)} s`;

/**
 * @param {string} label
 * @param {string} script
 */
function quietStage(label, script) {
  const startedAt = Date.now();
  const run = spawnSync('npm', ['run', '--silent', script], { cwd: app, env, encoding: 'utf8', shell: true });
  if (run.status === 0) {
    console.log(`ok    ${label} (${seconds(startedAt)})`);
    return;
  }
  const tail = `${run.stdout || ''}\n${run.stderr || ''}`.trim().split('\n').slice(-60).join('\n');
  console.log(`FAIL  ${label} (${seconds(startedAt)})\n\n${tail}`);
  process.exit(1);
}

quietStage('type check', 'check');
quietStage('unit tests', 'test:unit');

if (!flags.has('--no-e2e')) {
  const startedAt = Date.now();
  const run = spawnSync(
    process.execPath,
    [path.join(app, 'tests/support/affected.mjs'), ...(flags.has('--full') ? ['--all'] : [])],
    { cwd: app, env, stdio: 'inherit' }
  );
  if (run.status !== 0) {
    console.log(`FAIL  E2E (${seconds(startedAt)})`);
    process.exit(1);
  }
  console.log(`ok    E2E (${seconds(startedAt)})`);
}
