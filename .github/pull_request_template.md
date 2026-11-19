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
- [ ] `npm run test:unit` passes (all unit tests green)
- [ ] `npm run build` succeeds locally
- [ ] Relevant Playwright E2E specs pass via `npm test -- <spec>`
- [ ] Tested on desktop (`1440×900`) and narrow mobile (`360×800` / `375×667`)
- [ ] No secrets or sensitive `.env` files committed
- [ ] New or modified components adhere to Svelte 5 Runes (`$state`, `$derived`, `$props()`, `$effect`) and project rules in `AGENTS.md` / `.agents/rules/`
- [ ] Relevant `.md` documentation, `.agents/rules/`, and `CHANGELOG.md` are synced with code/test changes per `AGENTS.md` §3

## Screenshots / Notes (optional)
<!-- Add screenshots or testing notes if applicable -->
