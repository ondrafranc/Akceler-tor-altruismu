# Vizuální styl, senzorika a UX pravidla

## 1. Daylight Editorial, atmosféra svítání a SVG ikony
1. **Paleta a typografie**:
   - Mimo scénu Hero drží aplikace styl *Daylight Editorial*: teplý papírový podklad `#F6F7F3`, bílé karty `#FFFFFF` s rámečkem `1px solid #DCE3DD`, hlavní inkoust `#14281D`, primární CTA `#1D5C40` / `#1B5E42`, lipový akcent `#256F4E`, odznaky `#E6F0EA` / `#EAF3ED`, neaktivní `.nav-pill.world-pill` bez trvalého aktivního zabarvení, písma `Plus Jakarta Sans` a `Instrument Serif`.
2. **Hero atmosféra na `/`**:
   - `.hero-stage` v `HeroSection.svelte` vykresluje responzivní `<picture>` svítání (`sanctuary-dawn-800.webp` / `sanctuary-dawn.webp` + `/art/sanctuary-dawn.jpg` fallback, `opacity: 0.78` desktop / `0.85` mobil s kontrastním scrimem `>= 4,5:1`, `.hero-aurora`, `.fireflies-layer` a `.hero-wave`).
   - Desktop H1 je vyvážený do 2 řádků; `.hero-btn.primary` používá podřízený průsvitný skleněný vzhled, aby primárním ohniskem zůstalo `.btn-studio-primary` na kartě; odkazy v `.hero-copy` mají světlý `:focus-visible` (`#fef3c7`).
   - Mobilní hero zůstává kompaktní s písmem karty `>= 15 px`, přirozeným scrollem a spodním okrajem `.btn-studio-primary` `<= 667 px` na viewportu `375×667`.
3. **Nulová nativní Unicode emoji**:
   - Veškerá ikonografie v UI, datech i mapových značkách používá `@lucide/svelte` přes `<AppIcon name="..." />` (`src/lib/components/AppIcon.svelte`) a `getSvgIconHtml()` (`src/lib/icons/iconRegistry.js`) pro Leaflet.

## 2. Jednotná morphing scéna `.deed-stage` a `use:impactCanvas`
1. **Jediný perzistentní kontejner (`preview -> active -> payoff`)**:
   - `ActionCard.svelte` renderuje jednu morphing scénu `.deed-stage` (`stageMode`: `'preview' | 'active' | 'payoff'`) nad jediným `<canvas class="stage-canvas">` (`.deed-stage .stage-canvas` výška `92 px` desktop, `84 px` `<= 680 px`, `80 px` při `<= 680 px && max-height: 700 px`) bez layoutového skoku při startu či dokončení, bez `<h3 class="win-title">` a bez odstraněného `showEffectPreview`.
   - Ve fázi `preview` (`stageMode === 'preview'`) nese `.preview-hud` (`>= 4,5:1`), `cursor: default` a záři `.is-primed` (`--spot-x`, `--spot-y`); direktiva `use:impactCanvas` (`impactCanvasAction.js` / `impactCanvasEngine.js`) hlídá `Boolean(p?.preview)` (`preview: stageMode === 'preview'`) a při náhledu nikdy nespouští vyvrcholení (`climax`), zvuk, metriky ani `data-molly-mini="ready"`.
2. **Aktivní fáze, doznění a přepínání karet**:
   - Kliknutí na partnera přepne scénu do `active` / `payoff`, odemkne *„Mám hotovo“* (`.btn-studio-done`), `.card-effect-head`, znovupřehrání *„Přehrát“* a inline *„Dát Molly pamlsek“* v `.in-situ-celebration` (bez hold-to-confirm smyček).
   - `SwipeDeck.svelte` obaluje kartu v `{#key currentAction.id}` a `ActionCard.svelte` resetuje `<details>` i `lastCelebratedActionId`, aby se `playCelebrationChord()` spustil nejvýše jednou; odměnová čísla zůstávají jednotná (`emitProgress(1)` bez `0.65` rozporu s `concreteImpact`) s `frameStep` časováním a auto-sleep.

## 3. Navigace, dotykové plochy, copy, modály a izolace stavu
1. **Horizontální zarovnání a horní hlavička**:
   - Na desktopu sdílí `.nav-capsule`, `.hero-inner` a `.content-wrap` šířku `max-width: 1140px; box-sizing: border-box` a `align-items: start`; do `.nav-capsule` nepatří ikony krizové opory.
   - Mobil a tablet používají kompaktní horní hlavičku (`a.brand`, flex `MollyDock.svelte`, `44×44 px` `.mobile-nav-toggle` pro `#mobile-top-nav-drawer`); bubliny pod `.top-nav` nesmí zakrývat karty ani CTA.
   - Patička v `+layout.svelte` obsahuje jediný odkaz na `/submit` bez textových odrážek `•`; `+error.svelte` drží tečku uvnitř `titleAccent="naděje nekončí."`.
2. **Dotykové plochy, přirozené copy, modály a formuláře**:
   - Interaktivní prvky (včetně `.footer-links a`, `.verify-source-link`, `.cycle-link` a mapových pinů `.aa-map-pin` s `aria-label` a `title`) mají minimálně `44×44 px`.
   - Jazykové čistky a WCAG 2.5.3: výrazy *„Ověřený dopad (A/B/C)“*, *„dnešní seanci“* a *„Udělal/a“* jsou trvale vyřazeny; `EvidenceBadge.svelte` i `recommendationEngine.js` používají přirozenou češtinu (*Přímý měřitelný účinek* / *Doložený přínos* / *Komunitní smysl*) a tlačítko *„Pro dnešek hotovo“* má `aria-label="Pro dnešek hotovo — odpočinout si"`.
   - `ImmediateHelp.svelte` a `FeedbackModal.svelte` mají `aria-modal="true"`, `tabindex="-1"`, `tick()` focus-on-open, `Tab` focus trap, `Escape` a návrat fokusu na viditelný prvek s odmítnutím `BODY`/`HTML`. `ImmediateHelp` nabízí `>= 44×44 px` `tel:155` a `tel:112`, `.crisis-mobile-fab` je trvale zakázána; `.crisis-widget` sedí staticky v patičce, plovoucí `.feedback-pill` je vypnutá a textarea má `maxlength="1500"`.
   - Formulářové vstupy (`input`, `textarea`, `select`) mají až do `1024 px` `font-size >= 16px`.
3. **Katalog 45 skutků, `sessionStorage` a deep-linky na `/`**:
   - `filterHomeDeckPool()` filtruje 45 skutků z `src/lib/data/micro-actions.js` na `45` (`couch`, 2min online vpředu) / `8` (`focus`) / `16` (`walk`) / `9` (`people`); `.energy-tabs` používají `role="tab"` + `aria-selected` a dynamický Hero claim.
   - `AA_HOME_DECK_STATE_KEY` (`aa_home_deck_state_v1`) se ukládá do `sessionStorage` (`"session"`), takže čerstvá návštěva otevírá `couch` (`1 / 45`), zatímco reload v téže relaci drží pozici.
   - `/?action=<id>` předává `ignoreClosedSession` přes `SwipeDeck.svelte`, obchází zavřenou denní relaci a zobrazuje `>= 44 px` `.deeplink-exit-btn` bez předčasného přepsání uloženého balíčku; `SwipeDeck.svelte` počítá místní `getTodayKey()` a `$todayCompletedCount`.
   - `AA_PARTNER_RETURN_KEY` (`partnerReturnService.js`) se páruje výhradně přes `matchesSurfaceFilter`.

## 4. Kočka Molly a specifická pravidla podstránek
1. **Molly (`MollyCompanion.svelte`, `MollyDock.svelte`)**:
   - Na desktopu (`> 680 px`) je Molly viditelná při `scrollY === 0` (`0.78–0.92` měřítko); `$mollyDockBridge.atHome` na `/svet` skrývá duplicitní počítadlo a tlačítka v docku a nebrání jí žádná `.crisis-mobile-fab`.
   - Měření překážek (`Document.createRange()` mimo rAF, `pointer-events: none`, `groundLine`) respektuje `h2`/`h3`, blokové odkazy karet, `.quick-tags-pill`, `.category-aura-chip` a `.molly-celebration-note` s plynulým `canAutoPark` na `> 1024 px`.
2. **Mapa `/near`**:
   - Sekundární filtry jsou sbaleny v `details.near-filters-drawer` (`activeFilterCount`), `.controls-top` se na `360 px` skládá pod sebe a filtry/přepínače mají `aria-pressed`.
   - `PlaceCard.svelte` sjednocuje popisek přes `getPlaceActionHint(p)` + `p.quickMission` a nabízí 1-tap `tel:`/`mailto:`/`Mapy.cz`/*„Co napsat“*; `contactTemplates.js` hlídá `isCatOnlyShelter` proti nesmyslnému „venčení“ koček; hierarchie drží `h1 -> h2`.
   - `markActionStarted` se spouští až při reálném kontaktu, kopírování či navigaci (nikoli při rozbalení *„Co napsat“*). `initMap()` řeší počáteční meze/aktivní místo před přidáním OSM `tileLayer` a nepřepisuje `activePlaceId`; desktop (`> 980 px`) používá `.leaflet-popup`, mobil/tablet (`<= 980 px`) `.map-active-sheet` se `scrollIntoView`.
3. **Krajina dobra `/svet`**:
   - Noční `<picture>` se připojuje líně (`hasActivatedNight`), noční režim nastavuje `dawnLayerOpacity = 0`, počítadlo pamlsků je jediné v `.molly-sanctuary-pill`.
   - `.guide-toggle-summary`, `RitualBar` a `BreathingPacer` splňují `>= 44×44 px`, `#ritual-deed-input` má ostrý `1px` rámeček, `.qp-sep` se nerenderuje; `RitualBar` používá `role="tablist"`/`tab`/`aria-selected`, `BreathingPacer` `role="radiogroup"`/`radio`/`aria-checked` + `aria-pressed` a zvuk je výchozím stavem ztlumený (`aria-pressed="false"`).
4. **Průvodce `/app/guided` a katalog `/app/online`**:
   - `/app/guided`: pořadí v DOM odpovídá mobilnímu pořadí s `#personal-plan` před `.compass-foundations` (`WCAG 2.4.3`), Q2/Q3 nejsou duplikované, stránka má jediný `aria-live="polite"`, `aria-pressed` na volbách, zalamovací `.topic-pills` a `.alt-card h3` (`H1 -> H2 -> H3`).
   - `/app/online`: výchozí pohled *„Doporučené“* upřednostňuje `mode !== 'local'`, `.hero-tools-row` se na `360 px` zalamuje, desktopová mřížka srovnává CTA ke dnu karty (`order: 4; margin-top: auto`) a `.filter-chip` nesou `aria-pressed`.
5. **Komunitní formulář `/submit`**:
   - Dynamický `headerSubtitle`, přepínač režimu s `role="tablist"`/`role="tab"`/`aria-selected`, `aria-pressed` na `.q-pill`, `method="post"`, nativní `required` + `aria-required="true"` + `type="url"` na `#event_url` a `#website`, čistá hierarchie `h1 -> h2` a `handleOptionalFieldInvalid` se zámkem `validatingOptionalOpen` pro automatické rozbalení volitelného `<details>` bez chyby nezaostřitelného prvku.
