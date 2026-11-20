## Summary
<!-- Describe what this PR does, why it is needed, and link any related issues (e.g. Closes #123) -->

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Refactoring / Modularization
- [ ] Documentation update
- [ ] Tests / CI update

## Verification Checklist
- [ ] `npm run check` passes with 0 errors and 0 warnings
- [ ] `npm run test:unit` passes (unit tests and repository invariants)
- [ ] `npm run build` succeeds locally
- [ ] Relevant Playwright E2E specs pass via `npm test -- <spec>`
- [ ] Tested on desktop (`1280×800`, `1440×900`, `1920×1080`) and narrow mobile (`360×800` / `375×667`)
- [ ] No secrets or sensitive `.env` files committed
- [ ] New or modified components use Svelte 5 Runes and follow `AGENTS.md` and the matching `.claude/rules/*.md`
- [ ] Behaviour changes are recorded in `CHANGELOG.md`; rules changed only where an invariant changed (machine-checkable rules go to `tests/unit/invariants.test.js`)

## Screenshots / Notes (optional)
<!-- Add screenshots or testing notes if applicable -->
