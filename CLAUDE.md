@AGENTS.md

## Claude Code v tomto repozitáři
- Pravidla oblastí v `.claude/rules/` mají `paths:` a načtou se sama při práci s odpovídajícím souborem. Jejich text sem ani do `AGENTS.md` nekopíruj.
- **Ověřování:** změnu ověř příkazem `npm run verify` (v `akcelerator-landing-page/`). Sám vybere potřebné E2E a vypíše jen to podstatné; nespouštěj místo něj kontroly jednotlivě a neopakuj běh, který prošel. `/ship` je ruční předávací brána s celou sadou a spouští ji jen uživatel.
- Hook `Stop` po změnách v `src/` nebo `tests/` sám pustí `npm run check` a `npm run test:unit`; když selžou, oprav příčinu, kontrolu neobcházej.
- **Pluginy podle velikosti úkolu.** Superpowers (brainstorming, plán, TDD) použij u nové funkce, změny chování přes více souborů nebo na výslovnou žádost. U dotazu, drobné opravy, úpravy textu, konfigurace nebo testů pracuj rovnou, bez skillů a bez plánovacích dokumentů; systematické ladění zapoj, až když příčina chyby není zřejmá. Tato pravidla určují, co v projektu platí; postupy z pluginů sem neopisuj.
- **Subagenti střídmě.** Práci, kterou zvládneš několika voláními nástrojů, nedeleguj. Subagenta použij pro čtení napříč mnoha soubory nebo pro nezávislou práci, která může běžet souběžně; dva běhy Playwrightu ve stejném checkoutu najednou nepouštěj.
- Vizuální směr je daný (*Daylight Editorial*, `.claude/rules/ui-core.md`). `frontend-design` používej v jeho mezích, ne k návrhu nové estetiky.
- `svelte-autofixer` ze Svelte MCP použij u nové komponenty a u změn, které se týkají Svelte samotného (runy, reaktivita, šablona, direktivy). U úpravy běžného JavaScriptu uvnitř `<script>` stačí `npm run check`.
