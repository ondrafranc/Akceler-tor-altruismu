#!/usr/bin/env node
/**
 * Web server for Playwright: serves the production build on the given port.
 * The build is reused while nothing it is made from has changed, so a rerun starts in a moment.
 * Build output stays quiet unless the build fails.
 *
 * Usage: node tests/support/serve-build.mjs <port>
 */
import { spawn, spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const port = process.argv[2] || '4173';
const vite = path.join(app, 'node_modules/vite/bin/vite.js');
const stampFile = path.join(app, '.svelte-kit/e2e-build.stamp');
const builtMarker = path.join(app, '.svelte-kit/output/server/index.js');

/** Everything the build reads. Files are only stat-ed, never opened. */
const INPUTS = [
  'src',
  'static',
  'package.json',
  'package-lock.json',
  'svelte.config.js',
  'vite.config.js',
  'jsconfig.json',
  '.env',
  '.env.local'
];

/** @param {string} target @param {import('node:crypto').Hash} hash */
function addToHash(target, hash) {
  let stat;
  try {
    stat = fs.statSync(target);
  } catch {
    hash.update(`${target}:missing`);
    return;
  }
  if (stat.isDirectory()) {
    for (const name of fs.readdirSync(target).sort()) addToHash(path.join(target, name), hash);
  } else {
    hash.update(`${path.relative(app, target)}:${stat.mtimeMs}:${stat.size}`);
  }
}

function inputSignature() {
  const hash = crypto.createHash('sha256');
  hash.update(process.version);
  for (const input of INPUTS) addToHash(path.join(app, input), hash);
  return hash.digest('hex');
}

// Colour switches inherited from the test runner contradict each other and make Node warn on every start.
const env = { ...process.env };
delete env.FORCE_COLOR;
delete env.NO_COLOR;

const signature = inputSignature();
let fresh = false;
try {
  fresh = fs.existsSync(builtMarker) && fs.readFileSync(stampFile, 'utf8') === signature;
} catch {
  // No stamp yet.
}

if (!fresh) {
  const build = spawnSync(process.execPath, [vite, 'build'], { cwd: app, env, encoding: 'utf8' });
  if (build.status !== 0) {
    process.stderr.write(`Production build failed.\n${build.stdout || ''}\n${build.stderr || ''}\n`);
    process.exit(build.status || 1);
  }
  fs.writeFileSync(stampFile, signature);
}

// The server logs every 404 (the Vercel-only analytics scripts on each page). That is noise while it runs;
// what it wrote last matters only when it dies.
const server = spawn(process.execPath, [vite, 'preview', '--port', port, '--strictPort'], {
  cwd: app,
  env,
  stdio: ['ignore', 'ignore', 'pipe']
});
let lastWords = '';
server.stderr.on('data', (chunk) => {
  lastWords = (lastWords + chunk).slice(-4000);
});
server.on('exit', (code) => {
  if (code) process.stderr.write(`Preview server exited with code ${code}.\n${lastWords}\n`);
  process.exit(code ?? 0);
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill());
}
