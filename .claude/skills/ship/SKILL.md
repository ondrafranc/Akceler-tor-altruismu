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

## 2. Brány CI
Spusť `npm run verify:full`. Projde po řadě typovou kontrolu (0 chyb a 0 varování), unit testy (včetně `invariants.test.js`) a celou E2E sadu; ta si sama sestaví produkční build, takže selže i na chybě buildu. Zastaví se na první chybě.

## 3. E2E
Celou sadu už pustil krok 2. Které specifikace změna potřebuje, určuje `tests/support/affected-rules.mjs` (jediný zdroj pravdy; `npm run test:affected:list` je vypíše). Specifikace z argumentu `$ARGUMENTS` pusť navíc přes `npm test -- tests/<soubor>.spec.ts`, jen pokud je chceš zopakovat samostatně.

Test označený v souhrnu jako `flaky` prošel až na druhý pokus: uveď ho ve výsledku jménem.

`api.spec.ts` potřebuje živou Supabase z `.env.local` (bez ní vrací zápisové endpointy `503`), proto neběží v CI a tato brána je jeho jediná kontrola.
## 4. Kontrola obsahu změn
- V diffu nejsou tajné klíče ani soubory `.env*` (kromě `.env.example`).
- Změna chování je zapsaná v `CHANGELOG.md` pod `[Unreleased]`.
- Pokud se změnil invariant, je upravené odpovídající pravidlo v `.claude/rules/` nebo `AGENTS.md` a případně `invariants.test.js`. Do pravidel nepřibyly počty, pixelové hodnoty ani popis historie.

## 5. Výsledek
Vypiš tabulku kroků s výsledkem (prošlo, selhalo, přeskočeno a proč) a přesnými počty z výstupů. Navrhni zprávu commitu ve formátu Conventional Commits (`feat|fix|docs|test|refactor|chore(rozsah): popis`); nesouvisející změny navrhni rozdělit do více commitů.

**Necommituj a nepushuj.** Zeptej se uživatele; na větvi `main` nejdřív navrhni novou větev.
