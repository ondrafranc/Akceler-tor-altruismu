/**
 * Which E2E specifications a change needs. This is the single source of that mapping:
 * `npm run test:affected`, `npm run verify` and the /ship gate all read it.
 * `tests/unit/affected.test.js` keeps it in step with the files on disk.
 *
 * Paths are relative to the repository root and use forward slashes.
 */

const APP = 'akcelerator-landing-page/';

/** @typedef {{ name: string, match: RegExp[], specs: string[] }} AffectedRule */

/** @type {AffectedRule[]} */
export const RULES = [
  {
    name: 'api and security',
    match: [
      /^akcelerator-landing-page\/src\/routes\/api\//,
      /^akcelerator-landing-page\/src\/lib\/server\//,
      /^akcelerator-landing-page\/src\/lib\/(security|validation)\.js$/,
      /^akcelerator-landing-page\/src\/hooks\.server\.js$/,
      /^akcelerator-landing-page\/(svelte\.config\.js|vercel\.json)$/,
      /^supabase\//
    ],
    specs: ['security.spec.ts', 'api.spec.ts']
  },
  {
    name: 'molly',
    match: [
      /^akcelerator-landing-page\/src\/components\/Molly(Companion|Dock)\b/,
      /^akcelerator-landing-page\/src\/lib\/(mollyStore|mollyTypes)\.js$/,
      /^akcelerator-landing-page\/src\/lib\/molly\//,
      /^akcelerator-landing-page\/src\/lib\/types\/molly\.ts$/
    ],
    specs: ['molly-stress.spec.ts', 'mobile-tablet-polish.spec.ts', 'desktop-polish.spec.ts']
  },
  {
    name: 'home and deed stage',
    match: [
      /^akcelerator-landing-page\/src\/routes\/\+page\.svelte$/,
      /^akcelerator-landing-page\/src\/lib\/features\/(home|actions)\//,
      /^akcelerator-landing-page\/src\/lib\/(sensory|audio)\//
    ],
    specs: [
      'ui-rebuild-acceptance.spec.ts',
      'desktop-polish.spec.ts',
      'mobile-tablet-polish.spec.ts',
      'delayed-gratification-and-declutter.spec.ts'
    ]
  },
  {
    name: 'subpages',
    match: [
      /^akcelerator-landing-page\/src\/routes\/(near|svet|app|submit)\//,
      /^akcelerator-landing-page\/src\/lib\/features\/(map|sanctuary)\//
    ],
    specs: [
      'e2e-requirements.spec.ts',
      'm4-regressions.spec.ts',
      'tier5-svet-stress.spec.ts',
      'tier5-mobile-stress.spec.ts',
      'ui-rebuild-acceptance.spec.ts'
    ]
  },
  {
    name: 'layout and theme',
    match: [
      /^akcelerator-landing-page\/src\/routes\/\+layout\.svelte$/,
      /^akcelerator-landing-page\/src\/styles\//,
      /^akcelerator-landing-page\/src\/components\//,
      /^akcelerator-landing-page\/src\/lib\/components\//
    ],
    specs: [
      'e2e-requirements.spec.ts',
      'desktop-polish.spec.ts',
      'mobile-tablet-polish.spec.ts',
      'ui-rebuild-acceptance.spec.ts'
    ]
  }
];

/**
 * Specifications no rule points at. They run only with the whole suite (`npm test`).
 * A new specification belongs in a rule above; add it here only on purpose.
 */
export const FULL_RUN_ONLY = [
  'challenger-m1-2.spec.ts',
  'challenger-m2-2.spec.ts',
  'challenger-m3-2.spec.ts',
  'm2-regressions.spec.ts'
];

/** A change here can reach any page, so nothing short of the whole suite covers it. */
const ANYTHING_ELSE_IN_THE_APP = [
  /^akcelerator-landing-page\/(src|static)\//,
  /^akcelerator-landing-page\/(package\.json|package-lock\.json|vite\.config\.js|playwright\.config\.ts)$/,
  /^akcelerator-landing-page\/tests\/support\//
];

const SPEC_FILE = /^akcelerator-landing-page\/tests\/([^/]+\.spec\.ts)$/;

/**
 * @param {string[]} changedFiles Paths relative to the repository root.
 * @returns {{ all: boolean, specs: string[], reasons: string[] }}
 *   `all` asks for the whole suite; otherwise `specs` lists file names in `tests/` (possibly none).
 */
export function selectSpecs(changedFiles) {
  /** @type {Set<string>} */
  const specs = new Set();
  /** @type {Set<string>} */
  const reasons = new Set();
  let all = false;

  for (const raw of changedFiles) {
    const file = raw.replace(/\\/g, '/');
    const ownSpec = SPEC_FILE.exec(file);
    if (ownSpec) {
      specs.add(ownSpec[1]);
      reasons.add(`${ownSpec[1]}: the specification itself changed`);
      continue;
    }
    if (!file.startsWith(APP) && !file.startsWith('supabase/')) continue;

    const matched = RULES.filter((rule) => rule.match.some((pattern) => pattern.test(file)));
    if (matched.length > 0) {
      for (const rule of matched) {
        for (const spec of rule.specs) specs.add(spec);
        reasons.add(`${rule.name}: ${file.slice(file.startsWith(APP) ? APP.length : 0)}`);
      }
      continue;
    }
    if (ANYTHING_ELSE_IN_THE_APP.some((pattern) => pattern.test(file))) {
      all = true;
      reasons.add(`whole suite: ${file.slice(APP.length)} is shared by every page`);
    }
  }

  return { all, specs: all ? [] : [...specs].sort(), reasons: [...reasons].sort() };
}
