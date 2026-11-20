/**
 * Deterministic repository invariants.
 *
 * Every rule here used to live as prose in AGENTS.md / agent rules. A rule that
 * can be checked by a machine belongs in this file, not in a prompt.
 * When an invariant legitimately changes, change it here and in AGENTS.md §4.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = path.resolve(APP, '..');

/** @param {string} dir @param {RegExp} extRe @returns {string[]} */
function walk(dir, extRe) {
  /** @type {string[]} */
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.svelte-kit') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, extRe));
    else if (extRe.test(entry.name)) out.push(full);
  }
  return out;
}

/** @param {string} file */
const rel = (file) => path.relative(REPO, file).replace(/\\/g, '/');
/** @param {string} file */
const read = (file) => fs.readFileSync(file, 'utf8');

const SRC_FILES = walk(path.join(APP, 'src'), /\.(js|ts|svelte|css|html)$/);
const SVELTE_FILES = SRC_FILES.filter((f) => f.endsWith('.svelte'));
const SHIPPED_FILES = [...SRC_FILES, ...walk(path.join(APP, 'static'), /\.(html|json|webmanifest|svg)$/)];
const DOC_FILES = [
  ...fs.readdirSync(REPO).filter((n) => n.endsWith('.md')).map((n) => path.join(REPO, n)),
  ...walk(path.join(REPO, '.claude'), /\.md$/),
  ...walk(path.join(REPO, '.github'), /\.(md|yml)$/)
];

/**
 * Collects `file:line` hits of a pattern.
 * @param {string[]} files @param {RegExp} re @param {(relPath: string) => boolean} [skip]
 */
function hits(files, re, skip) {
  /** @type {string[]} */
  const found = [];
  for (const file of files) {
    const r = rel(file);
    if (skip?.(r)) continue;
    read(file)
      .split('\n')
      .forEach((line, i) => {
        if (re.test(line)) found.push(`${r}:${i + 1}`);
      });
  }
  return found;
}

const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}]/u;

describe('UI and copy invariants', () => {
  it('ships no native Unicode emoji (icons go through AppIcon / iconRegistry)', () => {
    // Intentional exceptions: the legacy emoji -> icon-name translation table and
    // two comments documenting the emoji stripper with real examples.
    const allowed = new Set([
      'akcelerator-landing-page/src/components/MollyDock.svelte',
      'akcelerator-landing-page/src/lib/progress.js',
      'akcelerator-landing-page/src/lib/utils.js'
    ]);
    expect(hits(SHIPPED_FILES, EMOJI, (r) => allowed.has(r))).toEqual([]);
  });

  it('keeps emoji in MollyDock confined to LEGACY_MOLLY_ICON_MAP keys', () => {
    const src = read(path.join(APP, 'src/components/MollyDock.svelte'));
    const outsideMap = src
      .split('\n')
      .filter((line) => EMOJI.test(line) && !/^\s*'[^']+':\s*'[a-z0-9-]+',?\s*$/.test(line));
    expect(outsideMap).toEqual([]);
  });

  it('keeps project docs and agent rules free of emoji', () => {
    expect(hits(DOC_FILES, EMOJI)).toEqual([]);
  });

  it('never reintroduces banned UI patterns or retired copy', () => {
    const banned = [
      'mobile-bottom-nav',
      'ambient-pulse-pill',
      'crisis-mobile-fab',
      'subpage-hero',
      'background-attachment:\\s*fixed',
      'malovan[áýéí]',
      'Skutečné skutky v Česku',
      'dnešní seanci',
      'Ověřený dopad \\(A/B/C\\)',
      'Udělal/a'
    ];
    expect(hits(SHIPPED_FILES, new RegExp(banned.join('|')))).toEqual([]);
  });

  it('imports @lucide/svelte only through the icon registry', () => {
    const offenders = hits(SRC_FILES, /@lucide\/svelte/, (r) => r.endsWith('src/lib/icons/lucideIcons.js'));
    expect(offenders).toEqual([]);
  });
});

describe('Code hygiene invariants', () => {
  it('has no explicit any, @ts-ignore or @ts-nocheck in src', () => {
    const re = /@ts-ignore|@ts-nocheck|:\s*any\b|\bas any\b|<any>|\{\s*any\s*\}|\bany\[\]|,\s*any\s*>/;
    expect(hits(SRC_FILES.filter((f) => !f.endsWith('.css') && !f.endsWith('.html')), re)).toEqual([]);
  });

  it('touches localStorage / sessionStorage only inside src/lib/storage', () => {
    const offenders = hits(SRC_FILES, /\b(localStorage|sessionStorage)\s*[.[]/, (r) =>
      r.includes('/src/lib/storage/')
    );
    expect(offenders).toEqual([]);
  });

  it('does not resurrect removed modules or dead identifiers', () => {
    const removedFiles = [
      'src/lib/sensoryEngine.js',
      'src/lib/sensory/index.js',
      'src/lib/offlineSync.js',
      'src/lib/features/pulse/services/pulseService.js',
      'src/lib/data/czech-places.geojson'
    ];
    expect(removedFiles.filter((f) => fs.existsSync(path.join(APP, f)))).toEqual([]);

    const deadIdentifiers =
      /showEffectPreview|globalSparkCharge|WORLD_MILESTONES|worldHealPercent|recordSanctuaryWish|SYNC_OFFLINE_OUTBOX|LAST_UPSTREAM_TS|includeAssociations|include_associations/;
    expect(hits(SRC_FILES, deadIdentifiers)).toEqual([]);
  });

  it('only shrinks the list of legacy (pre-Runes) Svelte components', () => {
    // Ratchet: migrate a file to Runes and delete it from this list. Never add to it.
    const allowedLegacy = new Set([
      'akcelerator-landing-page/src/components/SmallWinCelebration.svelte',
      'akcelerator-landing-page/src/lib/features/home/PortalsDrawer.svelte',
      'akcelerator-landing-page/src/lib/features/home/QuickStartSection.svelte',
      'akcelerator-landing-page/src/lib/features/sanctuary/components/DeedInspectorModal.svelte',
      'akcelerator-landing-page/src/lib/features/sanctuary/components/ProgressDashboard.svelte',
      'akcelerator-landing-page/src/routes/app/+page.svelte'
    ]);
    const legacySyntax = /^\s*export let |\son:[a-z]+(\||=)|^\s*\$: /m;
    const legacy = SVELTE_FILES.filter((f) => legacySyntax.test(read(f))).map(rel);

    expect(legacy.filter((f) => !allowedLegacy.has(f))).toEqual([]);
    // Fails once a listed file is migrated, so the list cannot go stale.
    expect([...allowedLegacy].filter((f) => !legacy.includes(f))).toEqual([]);
  });
});

describe('Toolchain and deployment invariants', () => {
  const pkg = JSON.parse(read(path.join(APP, 'package.json')));

  it('targets Node 24 consistently across .nvmrc, adapter, CI and types', () => {
    expect(read(path.join(APP, '.nvmrc')).trim()).toBe('24');
    expect(read(path.join(APP, 'svelte.config.js'))).toMatch(/runtime:\s*'nodejs24\.x'/);
    expect(read(path.join(REPO, '.github/workflows/ci.yml'))).toMatch(/node-version:\s*24\b/);
    expect(pkg.devDependencies['@types/node']).toBe('^24');
  });

  it('keeps package.json free of "engines" and allowScripts pinned to exact versions', () => {
    expect(pkg.engines).toBeUndefined();
    for (const key of Object.keys(pkg.allowScripts ?? {})) {
      expect(key).toMatch(/^(@[^/]+\/)?[^@]+@\d+\.\d+\.\d+$/);
    }
  });

  it('pins TypeScript strictness explicitly so editor and CI agree', () => {
    // TypeScript >= 6 defaults to strict. Until the strict migration lands, the
    // flag must be spelled out; flip it to true as part of that migration.
    const jsconfig = JSON.parse(read(path.join(APP, 'jsconfig.json')));
    expect(typeof jsconfig.compilerOptions.strict).toBe('boolean');
    expect(jsconfig.compilerOptions.checkJs).toBe(true);
  });

  it('uses per-request CSP nonces (csp.mode auto)', () => {
    expect(read(path.join(APP, 'svelte.config.js'))).toMatch(/mode:\s*'auto'/);
  });

  it('keeps both vercel.json files serving identical headers', () => {
    const rootCfg = JSON.parse(read(path.join(REPO, 'vercel.json')));
    const appCfg = JSON.parse(read(path.join(APP, 'vercel.json')));
    expect(rootCfg.headers).toEqual(appCfg.headers);
  });

  it('never caches SSR HTML publicly (shared CSP nonce risk)', () => {
    const hooks = read(path.join(APP, 'src/hooks.server.js'));
    expect(hooks).toContain('private, no-cache, no-store, must-revalidate');
    expect(hooks).not.toMatch(/s-maxage/);
  });

  it('has no hardcoded fallback for TEST_BYPASS_SECRET', () => {
    expect(hits(SRC_FILES, /TEST_BYPASS_SECRET\s*(\|\||\?\?)\s*['"`]/)).toEqual([]);
  });
});
