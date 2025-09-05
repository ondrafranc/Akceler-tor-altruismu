# Contributing Guide

Thank you for helping improve Akcelerátor Altruismu. This guide keeps code and documentation in sync, with an emphasis on clarity, cultural integrity, and safety.

## Development workflow
- Create a feature branch from `main`.
- Keep changes small and cohesive. Update docs in the same PR.
- Write clear commit messages (imperative mood): "Add", "Fix", "Update".

## Documentation policy (mandatory)
- Update relevant docs for any user-facing change:
  - `README.md` (root overview, env vars)
  - `akcelerator-landing-page/README_LANDINGPAGE.md` (frontend)
  - `DEPLOYMENT_INSTRUCTIONS.md` and `akcelerator-landing-page/VERCEL_PRODUCTION_SETUP.md`
- Replace hardcoded URLs/keys with environment variables.
- Add a CHANGELOG entry (see below).

## Environment variables
- Public client-side only:
  - `PUBLIC_SUPABASE_URL`
  - `PUBLIC_SUPABASE_ANON_KEY`
  - `PUBLIC_STREAMLIT_BASE_URL`
- Never commit secrets. `.env` files must not be committed.

## Review schedule (process)
- Docs review cadence: monthly (or after any major release).
- During review: verify examples, links, and env var names match code.

## CHANGELOG
- Maintain `CHANGELOG.md` with Keep a Changelog style.
- Add an entry under "Unreleased" or the new version in each PR.

## Pull Requests
- Use the PR template checklist.
- Include screenshots/gifs for UI changes (when helpful).
- Confirm you tested locally or in preview.

## Coding standards
- SvelteKit: follow existing patterns and file structure.
- Python/Streamlit: keep functions small, descriptive names, no silent exceptions.
- Accessibility: keyboard navigation and contrast remain functional.

## Contact
Open a GitHub issue for questions or proposals.
