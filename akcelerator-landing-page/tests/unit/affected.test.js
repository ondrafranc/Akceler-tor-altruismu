import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { FULL_RUN_ONLY, RULES, selectSpecs } from '../support/affected-rules.mjs';

const testsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const specsOnDisk = fs.readdirSync(testsDir).filter((name) => name.endsWith('.spec.ts'));
const APP = 'akcelerator-landing-page/';

describe('affected E2E selection: the mapping matches the files on disk', () => {
  it('names only specifications that exist', () => {
    const named = [...RULES.flatMap((rule) => rule.specs), ...FULL_RUN_ONLY];
    expect(named.filter((spec) => !specsOnDisk.includes(spec))).toEqual([]);
  });

  it('accounts for every specification: each one is in a rule or deliberately left to the whole suite', () => {
    const inRules = new Set(RULES.flatMap((rule) => rule.specs));
    const unaccounted = specsOnDisk.filter((spec) => !inRules.has(spec) && !FULL_RUN_ONLY.includes(spec));
    expect(unaccounted).toEqual([]);
    expect(FULL_RUN_ONLY.filter((spec) => inRules.has(spec))).toEqual([]);
  });
});

describe('E2E output stays quiet', () => {
  it('no specification prints progress: a passing run is one character per test', () => {
    const noisy = specsOnDisk.filter((spec) =>
      /^\s*console\.(log|info|warn)\(/m.test(fs.readFileSync(path.join(testsDir, spec), 'utf8'))
    );
    expect(noisy).toEqual([]);
  });
});

describe('affected E2E selection: what a change runs', () => {
  it('runs nothing for documentation, agent rules, CI and unit tests', () => {
    const result = selectSpecs([
      'AGENTS.md',
      'CHANGELOG.md',
      '.claude/rules/molly.md',
      '.github/workflows/ci.yml',
      `${APP}tests/unit/entryTour.test.js`
    ]);
    expect(result).toMatchObject({ all: false, specs: [] });
  });

  it('runs a specification that was itself edited', () => {
    expect(selectSpecs([`${APP}tests/m2-regressions.spec.ts`]).specs).toEqual(['m2-regressions.spec.ts']);
  });

  it('maps each area to its specifications', () => {
    expect(selectSpecs([`${APP}src/lib/security.js`]).specs).toEqual(['api.spec.ts', 'security.spec.ts']);
    expect(selectSpecs(['supabase/migrations/0003_new.sql']).specs).toEqual(['api.spec.ts', 'security.spec.ts']);
    expect(selectSpecs([`${APP}src/lib/mollyStore.js`]).specs).toContain('molly-stress.spec.ts');
    expect(selectSpecs([`${APP}src/lib/features/home/entryTour.js`]).specs).toContain('desktop-polish.spec.ts');
    expect(selectSpecs([`${APP}src/routes/near/+page.svelte`]).specs).toContain('e2e-requirements.spec.ts');
  });

  it('counts Molly components as both Molly and layout', () => {
    const { specs } = selectSpecs([`${APP}src/components/MollyCompanion.svelte`]);
    expect(specs).toContain('molly-stress.spec.ts');
    expect(specs).toContain('e2e-requirements.spec.ts');
  });

  it('unions the areas of a change that spans several', () => {
    const { all, specs } = selectSpecs([`${APP}src/routes/+page.svelte`, `${APP}src/routes/api/pulse/+server.js`]);
    expect(all).toBe(false);
    expect(specs).toEqual(expect.arrayContaining(['api.spec.ts', 'security.spec.ts', 'ui-rebuild-acceptance.spec.ts']));
  });

  it('asks for the whole suite when a change can reach any page', () => {
    for (const file of [
      `${APP}src/lib/utils.js`,
      `${APP}src/lib/data/micro-actions.js`,
      `${APP}static/manifest.webmanifest`,
      `${APP}package-lock.json`,
      `${APP}playwright.config.ts`,
      `${APP}tests/support/serve-build.mjs`
    ]) {
      expect(selectSpecs([file]).all, file).toBe(true);
    }
  });

  it('accepts Windows path separators', () => {
    expect(selectSpecs(['akcelerator-landing-page\\src\\lib\\mollyStore.js']).specs).toContain('molly-stress.spec.ts');
  });
});
