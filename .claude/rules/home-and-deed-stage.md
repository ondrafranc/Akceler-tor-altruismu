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

Ověření: `tests/ui-rebuild-acceptance.spec.ts`, `tests/desktop-polish.spec.ts`, `tests/mobile-tablet-polish.spec.ts`, `tests/delayed-gratification-and-declutter.spec.ts`, unit `poetic-scenes.test.js` a `entryTour.test.js`.

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

## Vstupní prohlídka režimů
Po chvíli klidu stránka jednou projde záložky `HOME_MODES` a vrátí se na výchozí `couch`. Pravidla drží `src/lib/features/home/entryTour.js` (čistá logika bez DOM); `+page.svelte` ji jen zapojuje. Ověření: unit `entryTour.test.js`, E2E `ET*` v `tests/desktop-polish.spec.ts`.
- **Kde smí běžet:** jen na zařízení s myší, v okně dost širokém pro kartu vedle textu. Nikdy na dotykovém zařízení (telefon ani tablet, v žádné orientaci): první ťuknutí by tam bylo jediným způsobem, jak ji zastavit.
- **Kdy nezačne:** při `prefers-reduced-motion`, s deep linkem (`?action=`, `#action=`, `?intent=`), po obnovení uloženého stavu balíčku, při uzavřeném dni, při dokončení nebo návratu od partnera, ve skryté záložce prohlížeče a na odscrollované stránce.
- **Co ji zastaví, a to natrvalo:** jakýkoli vstup uživatele (stisk ukazatele, klávesa, kolečko, dotyk), fokus v kartě nebo v hero, ukazatel na kartě (i ten, který tam spočíval už při načtení), scroll, skrytí záložky prohlížeče, změna na omezený pohyb nebo na nezpůsobilý viewport a každá obsluha, která mění balíček (záložka, další nebo předchozí karta, start, dokončení, příchozí deep link). Zůstane na tom, co právě ukazuje; zvolenou záložku nikdy nepřepíše a po zastavení už žádný krok nepřijde.
- **Sáhnutí po kartě těsně po kroku míří na kartu před ním.** Vstoupí-li na kartu ukazatel, dotyk nebo fokus dřív, než si návštěvník mohl nové karty všimnout, prohlídka se zastaví na té předchozí. Hlavní tlačítko čerstvě vyměněné karty v té chvíli nic nespustí; platí to i pro návrat na `couch`.
- **Dá se zastavit i bez myši a kláves:** po dobu prohlídky je v kartě před záložkami tlačítko `Zastavit automatickou ukázku`. Vidět je až s fokusem; slouží čtečkám obrazovky, které stránce žádný jiný signál nepošlou.
- **Je pasivní:** neukládá `AA_HOME_DECK_STATE_KEY`, neposílá analytiku ani funnel, nehýbe fokusem a nenechá asistivní technologie hlásit jednotlivé kroky.
- **Nejvýše jednou za relaci prohlížeče:** při startu se zapíše `AA_HOME_ENTRY_TOUR_SEEN_KEY`; návrat na `/` ani reload ji nezopakují.
- **Bez layoutového posunu:** místo pro různě dlouhé texty režimů (věta v hero, název a popis karty, počítadlo karet) je vyhrazené předem. Primární CTA karty zůstává nad ohybem.
- **Soužití s náhledem scény a s Molly:** dokud prohlídka běží, karta sama nepobízí (`idleLure` na `SwipeDeck`) a Molly drží průvodcovské šeptandy (`holdMollyGuide`); obojí se vrací po skončení. Soužití nestojí na porovnávání prodlev jiných komponent. Zůstane-li po zastavení na obrazovce režim, který si návštěvník nevybral, Molly k hlavnímu tlačítku nevodí. Prohlídka sama nikdy nespustí vyvrcholení, zvuk, metriky ani `data-molly-mini="ready"`.
- **Žádné testovací přepínače v produkčním kódu.** Test, kterého se prohlídka netýká, si ji vypne klíčem relace v init skriptu nebo skutečnou interakcí.

## Scéna `.deed-stage`
- Karta začíná typografií (kategorie, nadpis, popis). Pod popisem je **jedna** perzistentní scéna `.deed-stage` nad jediným `<canvas class="stage-canvas">` se třemi fázemi: `preview` -> `active` -> `payoff`.
- Přechod mezi fázemi nesmí způsobit layoutový skok. Výška plátna je daná předem pro každý breakpoint.
- Všechny tři fáze drží stejný tmavě zelený lesní soumrak. Text ve scéně je čistá typografie bez tmavých pilulek.
- **`preview` nikdy nespouští vyvrcholení (`climax`), zvuk, metriky ani `data-molly-mini="ready"`.** Hlídá to `preview` příznak v `use:impactCanvas`.
- Náhled smí jemně naznačit, že scéna po skutku ožije (krátký popisek, anticipační nádech plátna). Spouští ho hover, fokus na CTA, chvíle čtení, ťuknutí do scény, rozbalení `Jak to funguje`, přepnutí karty nebo návrat na záložku prohlížeče. Vždy věcně, bez patosu a bez FOMO.
- Kliknutí na partnera přepne scénu do `active` / `payoff` a odemkne *„Mám hotovo“*. Po dokončení se nabídne *„Přehrát“* a ztlumení zvuku; Molly v kartě krátce poděkuje (`.molly-celebration-note`) a nic dalšího po návštěvníkovi nechce.
- Oslavný zvuk zazní pro jeden skutek nejvýše jednou. Čísla dopadu jsou všude stejná (`emitProgress(1)`).
- Animace používají `frameStep` a mimo viewport usínají (auto-sleep v `controllerRegistry.js`).
- Na zařízení s myší se nezobrazuje mobilní pokyn k potažení karty.
