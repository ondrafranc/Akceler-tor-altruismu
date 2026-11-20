---
paths:
  - "akcelerator-landing-page/src/routes/+page.svelte"
  - "akcelerator-landing-page/src/routes/+layout.svelte"
  - "akcelerator-landing-page/src/lib/features/home/**"
  - "akcelerator-landing-page/src/lib/features/actions/**"
  - "akcelerator-landing-page/src/lib/sensory/**"
  - "akcelerator-landing-page/src/lib/audio/**"
  - "akcelerator-landing-page/src/lib/data/micro-actions.js"
---

# Hlavní stránka `/`, balíček skutků a scéna `.deed-stage`

Ověření: `tests/ui-rebuild-acceptance.spec.ts`, `tests/desktop-polish.spec.ts`, `tests/mobile-tablet-polish.spec.ts`, `tests/delayed-gratification-and-declutter.spec.ts`, unit `poetic-scenes.test.js`.

## Hero
- `.hero-stage` je responzivní `<picture>` české lesní tůně za svítání (`static/art/sanctuary-dawn.*`). Sahá plynule až za horní navigaci, bez bílého pruhu.
- Obrazy svítání a soumraku (`sanctuary-twilight.*`) mají shodnou kompozici a horizont; `/svet` na tom staví. Při výměně obrazu zachovej obojí.
- Nadpis `Pomáhat může být lehké.` doplňuje dynamická kurzíva `.hero-serif` a na mobilu `.hero-mobile-claim`. Obojí se mění podle režimu `HOME_MODES`, záložky `.energy-tabs` i parametrů `?intent=` a `?action=`.
- Primárním ohniskem stránky je `.btn-studio-primary` na kartě. Tlačítka v hero jsou vizuálně podřízená.
- Na každém podporovaném viewportu je primární CTA karty nad ohybem. Na úzkých telefonech se kvůli tomu skrývají sekundární odkazy v hero, ne karta.

## Balíček skutků
- Zdroj skutků je `src/lib/data/micro-actions.js`. `filterHomeDeckPool()` z něj skládá čtyři režimy energie (`couch`, `focus`, `walk`, `people`); `couch` je výchozí a nabízí celý katalog s dvouminutovými online kroky vpředu.
- Stav balíčku (`AA_HOME_DECK_STATE_KEY`) žije v `sessionStorage`: čerstvá návštěva začíná v `couch`, reload v téže relaci drží pozici.
- `/?action=<id>` otevře skutek i nad zavřenou denní relací (`ignoreClosedSession`), nabídne návrat (`.deeplink-exit-btn`) a nepřepíše uložený stav balíčku.
- Návrat od partnera (`AA_PARTNER_RETURN_KEY`) se páruje jen přes `matchesSurfaceFilter`.
- `SwipeDeck` obaluje kartu v `{#key currentAction.id}`, takže se stav karty při přepnutí resetuje.

## Scéna `.deed-stage`
- Karta začíná typografií (kategorie, nadpis, popis). Pod popisem je **jedna** perzistentní scéna `.deed-stage` nad jediným `<canvas class="stage-canvas">` se třemi fázemi: `preview` -> `active` -> `payoff`.
- Přechod mezi fázemi nesmí způsobit layoutový skok. Výška plátna je daná předem pro každý breakpoint.
- Všechny tři fáze drží stejný tmavě zelený lesní soumrak. Text ve scéně je čistá typografie bez tmavých pilulek.
- **`preview` nikdy nespouští vyvrcholení (`climax`), zvuk, metriky ani `data-molly-mini="ready"`.** Hlídá to `preview` příznak v `use:impactCanvas`.
- Náhled smí jemně naznačit, že scéna po skutku ožije (krátký popisek, anticipační nádech plátna). Spouští ho hover, fokus na CTA, chvíle čtení, ťuknutí do scény, rozbalení `Jak to funguje`, přepnutí karty nebo návrat na záložku prohlížeče. Vždy věcně, bez patosu a bez FOMO.
- Kliknutí na partnera přepne scénu do `active` / `payoff` a odemkne *„Mám hotovo“*. Po dokončení se nabídne *„Přehrát“*, ztlumení zvuku a *„Dát Molly pamlsek“* přímo v kartě.
- Oslavný zvuk zazní pro jeden skutek nejvýše jednou. Odměnová čísla jsou všude stejná (`emitProgress(1)`).
- Animace používají `frameStep` a mimo viewport usínají (auto-sleep v `controllerRegistry.js`).
- Na zařízení s myší se nezobrazuje mobilní pokyn k potažení karty.
