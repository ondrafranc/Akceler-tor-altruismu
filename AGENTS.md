# Akcelerátor altruismu — severka a globální pravidla

Tento soubor čte každý agent při každém běhu. Obsahuje jen to, co platí vždy. Pravidla jednotlivých oblastí jsou v `.claude/rules/` (viz §6) a čtou se až při práci v dané oblasti.

## 1. Severka produktu (nepřekročitelný zákon)
„Pomáhat pomáhat – a udělat pomáhání tak snadné jako masturbovat.“

Každá obrazovka, text i technické rozhodnutí slouží jedinému cíli: pomoc druhým musí být okamžitá, bezpracná a vizuálně přitažlivá — krásné stránky a přímá cesta od impulzu ke skutečnému dobrému skutku. Dílčí pravidla nejsou dogma: jakmile některé brání kráse nebo jednoduchosti, zpochybni ho, navrhni změnu pravidla a teprve potom ho poruš.

Atmosféra webu staví na pocitu **„klidného útočiště“** — návratu tam, kde člověku bylo (nebo bude) dobře, ukotveného v české krajině a českém lese. Bez patosu: žádná patetická hesla (např. *„Skutečné skutky v Česku“*), žádné slovo *„malovaná / malovaný“* v textacích.

## 2. Principy uživatelského zážitku
1. **Okamžitý vstup bez překážek.** Nad hlavní kartou na `/` nestojí uvítací plakáty, kotevní scroll-tlačítka, morální kázání ani stěny filtrů. Stránka se přirozeně scrolluje (žádné zamčení na `100dvh`); karta a primární CTA jsou vysoko u horního okraje i na malém mobilu (`360×800`, `375×667`).
2. **Jedna dominantní akce, nulový manipulativní šum.** Primární CTA nese konkrétní české akční sloveso + výsledek a reaguje na první kliknutí (žádný hold-to-confirm). Žádný FOMO ani sociální nátlak (zprávy typu *„právě někdo…“*). Sekundární metadata (metodologie, detaily partnera, sdílení, hlášení chyby) patří do rozbalovacího detailu `Jak to funguje`.
3. **Ikony jen jako SVG.** Žádné nativní Unicode emoji v UI, datech, mapových značkách ani dokumentaci; ikony jdou přes `<AppIcon name="..." />` a `getSvgIconHtml()`.
4. **Čistá horní navigace a Molly.** Jen kompaktní horní navigace, žádná spodní mobilní lišta. Kočka Molly doprovází uživatele nevtíravě a nikdy nezakrývá obsah ani ovládací prvky.

## 3. Repozitář a příkazy
- **Aplikace žije v `akcelerator-landing-page/`** (SvelteKit 2, Svelte 5, adaptér Vercel, Supabase jen na serveru). Všechny příkazy spouštěj tam.
- **Kořen je jen obal:** `package.json` s proxy skripty (žádné závislosti, žádný lockfile), `supabase/migrations/`, dokumentace a druhý `vercel.json`. V kořeni nic neinstaluj ani nespouštěj Vite; kořenové `node_modules/` nebo `.svelte-kit/` jsou omylem vzniklé artefakty a patří smazat.
- **Dva `vercel.json`** (kořen a aplikace) existují kvůli dvěma možným nastavením Root Directory ve Vercelu. Hlavičky v nich musí být shodné; hlídá to test.
- **Node 24** je cílový runtime (`.nvmrc`, `nodejs24.x`, CI). Pole `engines` do `package.json` nepřidávej.
- **TypeScript:** projekt používá vlastní verzi z `node_modules` a `jsconfig.json` má záměrně explicitní `"strict": false`. Editor s přibaleným novějším TypeScriptem jinak hlásí chyby, které CI nevidí.

| Účel | Příkaz (v `akcelerator-landing-page/`) |
|---|---|
| Vývojový server (`localhost:5173`) | `npm run dev` |
| Typová kontrola, musí být 0 chyb a 0 varování | `npm run check` |
| Unit testy a invarianty | `npm run test:unit` |
| Produkční build | `npm run build` |
| E2E (Playwright, sám si spustí dev server) | `npm test -- tests/<soubor>.spec.ts` |

Úklid dočasného `git worktree` na Windows: pokud má junction na `node_modules`, nejdřív ji odpoj (`cmd /c rmdir "<worktree>\akcelerator-landing-page\node_modules"`), ověř, že cesta neexistuje, a teprve pak `git worktree remove --force`. Jinak se smažou sdílené závislosti.

## 4. Globální invarianty
Vynucuje je `tests/unit/invariants.test.js` (běží v `npm run test:unit` i v CI). Když se invariant oprávněně mění, změň test i tento seznam v jednom kroku.
- Žádné emoji a žádné vyřazené UI vzory či texty v `src/` a `static/`.
- Žádné explicitní `any`, `@ts-ignore` ani `@ts-nocheck` v `src/`.
- `localStorage` a `sessionStorage` jen přes `src/lib/storage/` (klíče v `keys.ts`).
- `@lucide/svelte` se importuje jen v `src/lib/icons/lucideIcons.js`.
- Seznam komponent se starou syntaxí Svelte 4 se smí jen zkracovat. Do upravovaného souboru staré vzory nepřidávej; nové komponenty jsou vždy Svelte 5 Runes.
- Odstraněné moduly a mrtvé identifikátory se nevracejí.
- SSR HTML se nikdy necachuje veřejně (per-request CSP nonce).

Mimo test platí vždy:
- Tajné klíče nepatří do kódu, logů ani commitů. Soubory `.env` a `.env.local` nečti.
- Existující migrace v `supabase/migrations/` se neupravují; změna schématu je nová migrace.
- Bez výslovného pokynu necommituj a nepushuj.

## 5. Kdy je práce hotová
1. `npm run check` hlásí 0 chyb a 0 varování, `npm run test:unit` je zelený.
2. Prošly E2E specifikace, kterých se změna týká. UI změna je ověřená na desktopu i úzkém mobilu.
3. Dokumentace odpovídá kódu, ale **nepopisuje jeho stav**: do pravidel nepiš počty testů ani souborů, pixelové hodnoty ani historii změn. Pravidlo uprav jen tehdy, když se mění invariant. Co se změnilo, patří do `CHANGELOG.md`; konkrétní hodnoty patří do CSS a testů.
4. Pravidlo, které jde ověřit strojově, přidej do `invariants.test.js` nebo do E2E, ne do textu.

## 6. Pravidla podle oblasti
Claude Code je načítá automaticky podle cesty upravovaného souboru. Ostatní agenti: přečti odpovídající soubor před prací v dané oblasti.

| Pracuješ na | Přečti |
|---|---|
| čemkoli v `src/` | `.claude/rules/architecture.md` |
| `src/routes/api/`, `src/lib/server/`, `security.js`, `hooks.server.js`, CSP, `vercel.json`, `supabase/` | `.claude/rules/api-security.md` |
| jakékoli `.svelte` komponentě nebo stylech | `.claude/rules/ui-core.md` |
| `/` (hero, balíček skutků, `ActionCard`, `SwipeDeck`) a canvas scénách | `.claude/rules/home-and-deed-stage.md` |
| kočce Molly | `.claude/rules/molly.md` |
| `/near`, `/svet`, `/app/*`, `/submit` | `.claude/rules/subpages.md` |
