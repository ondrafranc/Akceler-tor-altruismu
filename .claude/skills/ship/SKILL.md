---
name: ship
description: Předávací brána před commitem nebo PR. Projde stejné kontroly jako CI, pustí E2E dotčené změnou a navrhne commit. Spouští ji jen uživatel.
disable-model-invocation: true
argument-hint: "[volitelně: seznam E2E specifikací navíc]"
---

# /ship — předávací brána

Zrcadlí `.github/workflows/ci.yml`. Když se změní CI, změň i tento soubor. Všechny příkazy běží v `akcelerator-landing-page/`. Při první chybě se zastav, ukaž výstup a navrhni opravu; žádný krok nepřeskakuj a nic neobcházej.

## 1. Prostředí
- `node -v`: pokud hlavní verze není 24, upozorni na to ve výsledku (neblokuje).
- `git status --short` a `git diff --stat`: zapiš si seznam změněných souborů pro kroky 3 a 4.

## 2. Brány CI (v tomto pořadí)
1. `npm run check` — 0 chyb a 0 varování.
2. `npm run test:unit` — vše zelené (obsahuje `invariants.test.js`).
3. `npm run build` — bez chyb.

## 3. E2E podle změněných souborů
Spusť `npm test -- <specifikace>` pro sjednocení řádků, které odpovídají změnám, plus specifikace z argumentu `$ARGUMENTS`.

| Změněno | Specifikace v `tests/` |
|---|---|
| `src/routes/api/**`, `src/lib/server/**`, `security.js`, `validation.js`, `hooks.server.js`, `svelte.config.js`, `vercel.json` | `security.spec.ts`, `api.spec.ts` |
| `MollyCompanion`, `MollyDock`, `mollyStore.js`, `mollyTypes.js`, `src/lib/molly/**` | `molly-stress.spec.ts`, `mobile-tablet-polish.spec.ts`, `desktop-polish.spec.ts` |
| `src/routes/+page.svelte`, `features/home/**`, `features/actions/**`, `src/lib/sensory/**` | `ui-rebuild-acceptance.spec.ts`, `desktop-polish.spec.ts`, `mobile-tablet-polish.spec.ts`, `delayed-gratification-and-declutter.spec.ts` |
| `/near`, `/svet`, `/app/**`, `/submit`, `features/map/**`, `features/sanctuary/**` | `e2e-requirements.spec.ts`, `m4-regressions.spec.ts` |
| `+layout.svelte`, `czech-theme.css`, `src/components/**` mimo Molly | `e2e-requirements.spec.ts`, `desktop-polish.spec.ts`, `mobile-tablet-polish.spec.ts` |
| jen dokumentace, pravidla nebo konfigurace agentů | žádné E2E |

Před velkým vydáním nebo na výslovnou žádost pusť celou sadu: `npm test`.

## 4. Kontrola obsahu změn
- V diffu nejsou tajné klíče ani soubory `.env*` (kromě `.env.example`).
- Změna chování je zapsaná v `CHANGELOG.md` pod `[Unreleased]`.
- Pokud se změnil invariant, je upravené odpovídající pravidlo v `.claude/rules/` nebo `AGENTS.md` a případně `invariants.test.js`. Do pravidel nepřibyly počty, pixelové hodnoty ani popis historie.

## 5. Výsledek
Vypiš tabulku kroků s výsledkem (prošlo, selhalo, přeskočeno a proč) a přesnými počty z výstupů. Navrhni zprávu commitu ve formátu Conventional Commits (`feat|fix|docs|test|refactor|chore(rozsah): popis`); nesouvisející změny navrhni rozdělit do více commitů.

**Necommituj a nepushuj.** Zeptej se uživatele; na větvi `main` nejdřív navrhni novou větev.
