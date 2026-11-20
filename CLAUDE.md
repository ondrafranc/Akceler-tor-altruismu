@AGENTS.md

## Claude Code v tomto repozitáři
- Pravidla oblastí v `.claude/rules/` mají `paths:` a načtou se sama při práci s odpovídajícím souborem. Jejich text sem ani do `AGENTS.md` nekopíruj.
- `/ship` je ruční předávací brána (zrcadlí `.github/workflows/ci.yml`). Spouští ji jen uživatel.
- Hook `Stop` po změnách v `src/` nebo `tests/` sám pustí `npm run check` a `npm run test:unit`; když selžou, oprav příčinu, kontrolu neobcházej.
- Pluginy určují postup (Superpowers: plánování, TDD, ladění; code-review: revize). Tato pravidla určují, co v projektu platí. Postupy z pluginů sem neopisuj.
- Vizuální směr je daný (*Daylight Editorial*, `.claude/rules/ui-core.md`). `frontend-design` používej v jeho mezích, ne k návrhu nové estetiky.
- Po úpravě `.svelte` souboru ho ověř nástrojem `svelte-autofixer` ze Svelte MCP.
