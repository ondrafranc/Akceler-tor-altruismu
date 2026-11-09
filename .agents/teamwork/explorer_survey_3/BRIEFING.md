# BRIEFING — 2026-11-09T22:33:00Z

## Mission
Investigate Mobile UX (visual-first hero & responsive controls), Molly character animations & particle star-chasing/mouse-tracking effects, and testing infrastructure for the Altruism Accelerator landing page.

## 🔒 My Identity
- Archetype: Teamwork explorer
- Roles: Read-only investigation, mobile UX analysis, Molly & VFX architecture analysis, test infrastructure audit, synthesis & handoff
- Working directory: c:\Users\ondra\Akcelerátor altruismu\.agents\teamwork\explorer_survey_3\
- Original parent: ace324df-14a7-4d9e-b562-c43e0abb14a5
- Milestone: Explorer Survey Phase

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify any project code files
- Focus exclusively on:
  1. Mobile UX on `src/routes/+page.svelte` and related components (375-430px viewports, visual-first hero, reveals on scroll/interaction)
  2. Molly & VFX (`Molly.svelte`, `ActionCard.svelte`, particle stars/fireflies, star chasing, mouse follow toggle, pointer-events, reduced motion)
  3. Testing infrastructure (`package.json`, Vitest, Playwright, test coverage)
- Write reports in own folder only

## Current Parent
- Conversation ID: ace324df-14a7-4d9e-b562-c43e0abb14a5
- Updated: 2026-11-09T22:33:00Z

## Investigation State
- **Explored paths**:
  - `src/routes/+page.svelte` (mobile vs desktop hero layout, instant-card placement)
  - `src/lib/features/home/HeroSection.svelte` (desktop 2-column grid vs mobile 1-column stack and hidden CTAs)
  - `src/lib/features/actions/components/ActionCard.svelte` (minigame canvas CSS and aspect-ratio mismatch)
  - `src/lib/sensoryEngine.js` (`mountImpactCanvas`, 300x92 logical coordinates vs 320x118 canvas, clipping Mini-Molly at x=274)
  - `src/components/MollyCompanion.svelte` (procedural tortoiseshell cat canvas, roaming loop, pointer tracking, pelisek dock)
  - `src/lib/mollyStore.js` (companion store, feeds, treats, pet whispers, lack of followMouse toggle)
  - `src/lib/features/home/SanctuaryTeaser.svelte` (static JPEG preview, styling clash, navigation to /svet)
  - `src/routes/svet/+page.svelte` & subcomponents (`RitualBar.svelte`, `DeedInspectorModal.svelte`, `BreathingPacer.svelte`, `ProgressDashboard.svelte`)
  - Test suites: `package.json`, `vitest.config.js`, `playwright.config.ts`, `tests/` suites.
- **Key findings**:
  - Root cause of clipped minigame canvas: CSS hardcodes height 118px on max-width 320px (ratio 2.71), while canvas engine computes scale `ch / 92`, blowing logical width 300 past physical buffer width by ~65 CSS pixels; Mini-Molly at `w - 26 = 274` is cropped off.
  - Root cause of mobile hero clutter: mobile media query hides hero CTAs and stacks `.instant-card` immediately under title/lead, filling initial 375px–430px viewport with 550px of dense controls.
  - Architecture formulated for visual-first mobile layout (visual hero above the fold, dedicated interactive hub below fold or upon scroll/prompt).
  - Architecture formulated for Molly mouse-follow toggle (persisted in store, toggled in dock, active only on fine pointers, zero pointer-event interference) and star/firefly chasing (`CHASE_STAR` behavior with pounce, stardust burst, and tail physics).
- **Unexplored areas**: None for this survey scope.

## Key Decisions Made
- All findings and step-by-step logic chains documented in `handoff.md`.

## Artifact Index
- `c:\Users\ondra\Akcelerátor altruismu\.agents\teamwork\explorer_survey_3\handoff.md` — Final 5-component handoff report
- `c:\Users\ondra\Akcelerátor altruismu\.agents\teamwork\explorer_survey_3\progress.md` — Liveness & progress heartbeat
- `c:\Users\ondra\Akcelerátor altruismu\.agents\teamwork\explorer_survey_3\DISPATCH.md` — Incoming dispatch messages
