# BRIEFING — 2026-11-08T18:02:00Z

## Mission
Perform an in-depth survey of the codebase regarding Molly Textations across the app (Requirement R4) and the project Build/Test setup.

## 🔒 My Identity
- Archetype: explorer
- Roles: survey, analysis
- Working directory: c:\Users\ondra\Akcelerátor altruismu\.agents\teamwork\teamwork_explorer_survey_3\
- Original parent: edc511b7-ea27-4223-9540-505f3fa4136b
- Milestone: Survey & Exploration (Molly Textations & Build/Test)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Do NOT write or modify source code files
- Write only to working directory .agents/teamwork/teamwork_explorer_survey_3/
- Inventory all Molly dialogues, quotes, tooltips, companion textations in src/
- Identify cringe phrases, meta-comments about the app/virtual nature, robotic phrasing, or awkward expressions; recommend warm, kind, supportive Czech phrasing
- Inspect package.json, build commands, test frameworks (Vitest, Playwright), existing tests, and verification setup

## Current Parent
- Conversation ID: edc511b7-ea27-4223-9540-505f3fa4136b
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `akcelerator-landing-page/package.json`, `playwright.config.ts`, `tests/api.spec.ts`, `tests/security.spec.ts`
  - `src/lib/mollyStore.js`, `src/lib/mollyTypes.js`, `src/lib/progress.js`, `src/lib/sensoryEngine.js`, `src/lib/storyCard.js`
  - `src/components/MollyCompanion.svelte`, `src/components/SmallWinCelebration.svelte`
  - `src/routes/+layout.svelte`, `src/routes/+page.svelte`, `src/routes/app/+page.svelte`, `src/routes/app/guided/+page.svelte`, `src/routes/app/online/+page.svelte`, `src/routes/near/+page.svelte`, `src/routes/submit/+page.svelte`, `src/routes/svet/+page.svelte`
- **Key findings**:
  - Build & test environment verified: SvelteKit 2 + Svelte 5 + Vite 7 + Playwright 1.55.1. Svelte-check passes (0 errors/warnings), build clean in 6.5s, 21 of 21 Playwright tests pass in 1.2m.
  - Commands must execute with `--prefix akcelerator-landing-page`.
  - Identified 28 distinct Molly text locations across 6 main files.
  - Classified 7 key categories of text issues: meta UI commands ("klikni", "na stránce", "na kartě"), robotic event triggers ("Po kliknutí na Hotovo dostane Molly pamlsek"), RPG gaming score syntax ("+1 rybka pro Molly"), voice inconsistencies (1st vs 3rd person narration), and technical explanations in user tooltips.
  - Developed full recommended replacement text table in warm, empathetic Czech.
- **Unexplored areas**: None within scope of survey. Ready for handoff synthesis.

## Key Decisions Made
- Fully cataloged all Molly textations with line numbers and file paths.
- Verified zero test regressions when textations are modernized (tests assert presence of 'Molly' in celebration note and no banned copy in BANNED_RENDERED_COPY).

## Artifact Index
- DISPATCH.md — Task assignment and message history
- progress.md — Liveness heartbeat and progress log
- BRIEFING.md — Persistent working memory
- handoff.md — Comprehensive survey report
