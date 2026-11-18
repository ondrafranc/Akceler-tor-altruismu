# Akcelerátor altruismu — Product North Star & Engineering Guardrails

## 1. Hlavní severka produktu (Nepřekročitelný zákon)
Každá obrazovka, text i technické rozhodnutí slouží jedinému cíli: **okamžitá, přímočará a bezpracná cesta od impulzu („mám volnou chvíli u mobilu“) ke skutečnému dobrému skutku a okamžitému pocitu dokončení.**

1. **Zákon 3 vteřin a Zero-Scroll vstupu (`100dvh`)**:
   - Na mobilních rozlišeních (`360×800`, `375×667`) musí být na `/` okamžitě nad ohybem obrazovky viditelná samotná karta konkrétního skutku, její hlavní akční tlačítko i stránkování balíčku (`boundingBox.bottom <= viewportHeight`).
   - Nikdy nevkládej nad kartu skutku celoobrazovkové uvítací plakáty, kotevní scroll-tlačítka, morální kázání ani stěny filtrů.
   - Listování balíčkem a volba časové záložky na `/` se perzistuje přes `AA_HOME_DECK_STATE_KEY` (`aa_home_deck_state_v1`), aby obnovení stránky (`F5`) nevracelo uživatele na `1 / 45`; explicitní URL parametr `/?action=<id>` má vždy přednost a prázdné úložiště začíná na `1 / 45`.
2. **Jedna dominantní akce na obrazovku a nulový manipulativní šum**:
   - Hlavní CTA používá konkrétní akční sloveso (např. *„Nakrmit útulek teď“*) a reaguje okamžitě na první kliknutí (žádné umělé držení tlačítka / hold-to-confirm).
   - Nikde v aplikaci nepoužívej e-shopové / FOMO notifikace sociálního nátlaku typu *„právě někdo…“*, *„před X h někdo…“* ani *„v komunitě někdo…“* (`.ambient-pulse-pill`).
   - Sekundární metadata a pomocné akce (metodologie, důkazní třídy, detaily partnera, *„Ověřeno / Zdroj“*, *„Sdílet odkaz“* a *„Nahlásit chybu“*) patří výhradně dovnitř rozbalovacího detailu na vyžádání (`Jak to funguje`), nikdy přímo na výchozí plochu karty.
   - Každá záložka i filtr musí být okamžitě srozumitelné i pro prvonávštěvníka bez interních zkratek (např. *„Ověřený dopad (A)“* místo *„Důkazy A“*; u metaforické scény `/svet` kompaktní jednořádková legenda symbolů + rozbalovací klíč `Jak to funguje`, jehož přepínač při otevření nemění pozici pod kurzorem).
   - Všechny interaktivní prvky na mobilu musí splňovat minimální dotykovou plochu `44×44 px` a nesmí překrývat obsah plovoucími vrstvami.
   - Všechna formulářová pole (`input`, `textarea`, `select`) na mobilu musí mít `font-size >= 16px` (`1rem`), aby iOS Safari při fokusu automaticky nepřibližoval viewport.
3. **Vizuální styl *Daylight Editorial*, 100% SVG ikony a dvoufázový prožitek karty**:
   - **Zákaz „AI vzhledu“ na kartách/podstránkách, podpora desktopové lesní Hero scény a 0 nativních Unicode emoji**: Mimo desktopovou Hero scénu používá celá aplikace střídmý směr *Daylight Editorial* se svěží českou lipovou a šumavskou zelenou (`#F6F7F3` teplý papírový podklad, `#FFFFFF` karty s `1px solid #DCE3DD`, `#14281D` lesní inkoust, `#1D5C40` / `#1B5E42` primární CTA, `#256F4E` lipový akcent, světlé šalvějově-lipové plochy `#E6F0EA` / `#EAF3ED` na odznacích a upoutávce *Krajiny dobra*, `Plus Jakarta Sans` + `Instrument Serif`). Na desktopu (`> 680px`) na `/` používá `.hero-stage` v `HeroSection.svelte` hlubokou šumavskou lesní atmosféru (`#0b261b`–`#174934`) s podkladem `/art/sanctuary-dawn`, jemnou září (`.hero-aurora`), světluškami (`.fireflies-layer`), vysoce kontrastní světlou/zlatavou typografií a CTA (`>= 4,5:1`) a spodní křivkou `.hero-wave` SVG přecházející do `--surface-page` (`#f6f7f3`), zatímco na mobilu (`<= 680px`) zůstává `.hero-stage` čistě kompaktní a světlá. Na kartách, pečetích, dlaždicích a v těle stránky nikdy nepoužívej těžké černo-zelené plochy (`#11291E` / `#173829`), `.card-halo`, třpytky ani lesklé přelety přes tlačítka. V UI šablonách, datových katalozích ani mapových značkách nesmí být **žádná nativní Unicode emoji** — všechny ikony se vykreslují výhradně přes `@lucide/svelte` (`<AppIcon name="..." />` ze `src/lib/icons/iconRegistry.js` a `getSvgIconHtml()` pro Leaflet).
   - **Před spuštěním (`!isStarted`)**: Karta nikdy nesmí působit jako suchý textový formulář — zobrazuje tematické diorama očekávání specifické pro daný skutek (`.deed-preview-stage` / `canvas.preview-diorama-canvas`, např. paprsek čekající před hranolem nebo prázdná miska u pejska) bez předčasného vyzrazení odměny, bez překryvu horního štítku s kresbou, bez falešné affordance tlačítka (`cursor: default`) a se stránkováním balíčku dole pod obsahem. V klidovém stavu si `.deed-preview-stage` zachovává světlý rámeček *Daylight Editorial* (`#edf2ee` / `#ffffff` `.preview-hud`) a při najetí kurzoru na `.deed-preview-stage` nebo hlavní CTA (`.btn-studio-primary`) se aktivuje `.is-primed` s jemnou teplou žlutozlatou září sledující kurzor (`--spot-x`, `--spot-y`) a teplým zlatavým zvýrazněním okraje/stínu. Na desktopu (`> 680px`) má `.preview-diorama-canvas` velkorysejší výšku (`92px`, měřítko `0.96×`), zatímco na mobilu (`<= 680px`) zůstává kompaktním nerušivým proužkem (`50px` / `46px`, měřítko `0.88×`), aby CTA i stránkování vždy seděly nad ohybem.
   - **Poetická proměna PO akci místo miniher (`isStarted` / `justCompleted`)**: Nikdy nevyžaduj arkádové vyklikávání bodů či miniherní smyčky. Tlačítko splnění (`.btn-studio-done`), scéna dopadu (`.card-effect-stage` s ne-překrývající lištou `.card-effect-head` nad `canvas.impact-payoff-canvas`) i pamlsek pro Molly se odemykají až po kliknutí na akci u partnera; po dokončení se in-situ odehraje plynulá tematická proměna *Před → Po* (standard `sbarvouven.cz`: paprsek → hranol → duha) s `frameStep` časováním nezávislým na 60/120Hz a automatickým uspáním smyčky po doznění.
4. **Výhradně horní navigace (bez spodní lišty), patronka Molly a čistá mřížka**:
   - **Zákaz spodní mobilní lišty (`.mobile-bottom-nav`)**: V DOMu ani stylech nikdy nevytvářej spodní navigační lištu. Na mobilu/tabletu slouží výhradně kompaktní horní hlavička (`a.brand` s nezkráceným dvouřádkovým názvem *Akcelerátor / altruismu* čitelným od `320px` + flex-integrovaný `MollyDock.svelte` + `44×44px` `.mobile-nav-toggle` otevírající `#mobile-top-nav-drawer`).
   - Želvovinová kočka Molly (`MollyCompanion.svelte`) je klíčový a oblíbený prvek napříč všemi záložkami (s plynulým předáním scéně u jezera na `/svet`). Na desktopu (`> 680px`) musí být viditelná hned na úvodní obrazovce (`scrollY === 0`) v přirozeném měřítku (`0.78`–`0.92`) bez nutnosti scrollovat dolů: měření překážek u nadpisů a odstavců mimo karty používá těsné hranice textu (`Document.createRange()`), přičemž Molly drží konzistentní podlahu (`groundLine`, žádné výškové skákání po římsách karet) a za viditelnosti **nikdy** nepoužívá skokové přepsání souřadnic (`posX = targetX; posY = targetY` / `snapMollyToFreeSpot`) — při scrollování zůstává klidná a po ustálení případně plynule popojde krokem (`WALK_ROAM`) mimo tlačítka i nadpisy `h2`/`h3`. Její plátno má vždy `pointer-events: none` a měření překážek probíhá výhradně mimo `requestAnimationFrame`.
   - Na mobilu (`<= 680px`) nikdy neskrývej `.molly-pelisek-dock` přes `display: none`; integruj jej přímo do flexboxu `.nav-capsule` a bubliny vykresluj pod `.top-nav` s nulovým překryvem karet, stránkování a CTA.
   - Do horní navigační kapsle (`.nav-capsule`) nevkládej rušivé ikony krizové opory; krizová opora zůstává diskrétně v menu/pilulce/patičce. Na desktopu musí mít `.nav-capsule`, `.hero-inner` i `.content-wrap` sjednocenou šířku (`max-width: 1140px; box-sizing: border-box`) a zarovnání horní hrany (`align-items: start`).

## 2. Architektonické a bezpečnostní invarianty
1. **Žádné duplicitní katalogy ani forwarder záplaty**:
   - Existuje jediná kanonická implementace karty skutku a akčního balíčku. Nikdy nevytvářej prázdné re-export/forwarder soubory ani nepoužívané komponenty jen kvůli průchodu testů — oprav přímo importy nebo testy.
2. **Svelte 5 & čistý výkon na mobilu**:
   - Nepoužívej celostránkové `querySelectorAll` + `getBoundingClientRect` / `getComputedStyle` uvnitř `requestAnimationFrame` smyček ani `background-attachment: fixed`.
   - Těžké knihovny (`leaflet`, velké canvas/audio scény) načítej výhradně dynamicky (`await import(...)`) až v okamžiku, kdy je uživatel skutečně zobrazí. Při přidání nové ikony z `@lucide/svelte` do `src/lib/icons/lucideIcons.js` ji vždy zahrň i do `optimizeDeps.include` ve `vite.config.js`, aby v dev režimu nevznikaly kaskády požadavků.
   - Na mapě `/near` striktně odděluj desktop a mobil: na desktopu (`> 980px`) se detail místa otevírá v `.leaflet-popup` (s `autoPanPadding` mimo *„Jemný podklad“* a `.search-area-btn`), zatímco na mobilu/tabletu (`<= 980px`) se `.leaflet-popup` neotevírá (ani přes klávesu `Enter`) a detail se vykresluje v `.map-active-sheet` **pod mapou** (nikdy uvnitř `.leaflet-container`), přičemž asynchronní `initMap()` / `fetchNearby()` nesmí přepsat vycentrování aktivního `activePlaceId`.
   - V `src/app.html` používej pro statické ikony a manifest výhradně kořenově absolutní cesty (`/soubor`), pro úpravu URL parametrů `goto(..., { replaceState: true, noScroll: true, keepFocus: true })` (nikdy přímé `history.pushState`/`replaceState`), před `map.remove()` vždy volej `map.stop()` a `AudioContext` inicializuj až po prvním uživatelském gestu.
3. **Databáze a bezpečnost API**:
   - Jediným zdrojem pravdy pro DB schéma je `supabase/migrations/`. Každá změna sloupců v `src/routes/api/**` musí odpovídat SQL migraci.
   - Veřejné endpointy používají `PUBLIC_SUPABASE_ANON_KEY` s aktivním RLS; `SUPABASE_SERVICE_ROLE_KEY` nesmí být nikdy přijímán v klientských hlavičkách ani používán pro běžné uživatelské dotazy.
   - Testovací bypassy (`TEST_BYPASS_SECRET`) nesmí mít nikdy hardcodovaný fallback v kódu a tajemství se porovnávají přes `crypto.timingSafeEqual`.
4. **Toolchain, Vercel Node Runtime a E2E spouštění**:
   - Do `akcelerator-landing-page/package.json` nikdy nepřidávej pole `"engines"` (`node`) — otevřený rozsah (`>=22`) způsobí, že Vercel přebije Project Settings `"24.x"` (`runtime: 'nodejs24.x'` v `svelte.config.js`) nejnovější major verzí (`26.x`), zatímco striktní pin rozbije lokální vývoj na Node `22.x`. Udržuj `@types/node` na `^24` a `"allowScripts"` pinované na přesnou verzi balíčku.
   - Playwright E2E testy v `akcelerator-landing-page` spouštěj vždy přes `npm test -- <spec>` (nikoliv holým `npx playwright test`, které natáhne nekompatibilní globální verzi mimo lokální `@playwright/test`).

## 3. Cílová architektura a doménové vrstvy (Refaktoring 2026)

### 3.1 Doménové vrstvy a hranice odpovědností
Kódová báze striktně dodržuje jednosměrný tok závislostí a izolaci doménové logiky od prezentační vrstvy:
1. **`src/lib/types/` — Kanonické TypeScript typy**:
   - Centrální kontraktní rozhraní pro celý projekt: `deed.ts` (modely mikro-skutků, evidence tier, sensory specifikace), `sensory.ts` (parametry procedurálních scén a efektů), `molly.ts` (stavy nálady, režimy a pamlsky kočky Molly), `progress.ts` (splněné kroky, poutní přání v jezeře), `api.ts` (kontrakty serverových endpointů) a `storage.ts` (typová mapa a schémata pro úložiště).
   - **Pravidlo nulového `any` a `"checkJs": true`**: Veškerý JavaScript v projektu podléhá striktní typové kontrole v `jsconfig.json`. Je zakázáno použití `any`, `unknown as any` či `@ts-ignore` — všechna data a rozhraní musí mít explicitní JSDoc `@type` vazbu na kanonické typy.
2. **`src/lib/sensory/` — Modularizovaný grafický subsystém**:
   - Původní monolitický god-module byl plně dekomponován do čistých submodulů:
     - `catalog/`: Registr a resolver 45 procedurálních proměn skutků (`actionCatalog.js`, `catalogResolver.js`).
     - `graphics/`: 2D vykreslovací primitiva, harmonické křivky a matematické utility (`primitives.js`, `math.js`).
     - `scenes/`: Dispečer (`poeticDispatcher.js`) a 45 doménových procedurálních transformací rozdělených podle témat (`animalsScenes.js`, `communityScenes.js`, `foodScenes.js`, `healthScenes.js`, `knowledgeScenes.js`, `natureScenes.js`).
     - `canvas/`: Životní cyklus plátna (`impactCanvasEngine.js`, `impactCanvasAction.js`, `controllerRegistry.js`) zajišťující automatické uspání animační smyčky po odeznění (auto-sleep), dynamický DPR cap (1.5× pro slabší zařízení, 2.0× max) a adaptivní měření layoutu přes `ResizeObserver` a `IntersectionObserver`.
     - `interaction/`: Hmatové a vizuální mikrorituály potvrzení (`holdSpark.js`).
   - Měření rozměrů a layoutu probíhá výhradně v reaktivních handlerech mimo smyčku `requestAnimationFrame`, aby se zabránilo layout thrashingu.
3. **`src/lib/storage/` — Centralizovaný registr klíčů a SSR-safe adaptér**:
   - `keys.ts`: Jediný autoritativní registr všech 18 klíčů a prefixů pro `localStorage` a `sessionStorage` (např. `AA_COMPLETED_STEPS_KEY`, `AA_SANCTUARY_WISHES_KEY`, `AA_MOLLY_COMPANION_KEY`, `AA_PARTNER_RETURN_KEY`, `AA_HOME_DECK_STATE_KEY`, atd.). Zákaz používání surových řetězcových literálů v komponentách.
   - `index.ts`: SSR-safe úložiště chráněné proti `SecurityError` (např. privátní režim Safari, blokování cookies v In-App WebView). Obsahuje in-memory fallback mapy (`MEMORY_LOCAL`, `MEMORY_SESSION`) a registr selhaných nativních zápisů (`failedNativeWrites`), který zabraňuje čtení zastaralých dat z disku při selhání zápisu.
4. **`src/lib/audio/` — Web Audio API subsystém**:
   - Izolovaný audio kontext (`audioContext.js`), procedurální syntezátor harmonických tónů a šumu (`synthesizer.js`) a ASMR presety (`presets.js`: purr, chime, crunch, meow, payoff ASMR).
   - Zvukový subsystém se inicializuje líně výhradně po explicitním uživatelském gestu a respektuje globální stav ztlumení (`isSoundMuted`).
5. **`src/lib/core/` — Platforma a detekce zařízení**:
   - `device.js`: Detekce slabších zařízení (`isLowPowerDevice`), čtení preferencí snížení pohybu (`prefersReducedMotion`), výpočet DPR capu, bezpečná haptika (`safeVibrate`) a normalizace časového kroku (`frameStep`) pro nezávislost animací na obnovovací frekvenci displeje (60/120 Hz).
6. **`src/lib/molly/` & `src/lib/icons/` — Vykreslování Molly a registr SVG ikon**:
   - `molly/mollyCatRenderer.js`: Vysoce optimalizovaný 2D canvas renderer želvovinové kočky Molly s asymetrickými skvrnami, blaze kresbou obličeje, harmonickým ocasem s Bézierovými body a fyzikou vousků.
   - `icons/iconRegistry.js`, `icons/lucideIcons.js` & `components/AppIcon.svelte`: Jediný kanonický registr 96 sémantických SVG ikon (`@lucide/svelte`) včetně `getSvgIconHtml()` pro Leaflet značky a popupy.
7. **`src/lib/features/` — Doménové služby**:
   - Každá doména má vyhrazenou servisní vrstvu oddělenou od UI komponent:
     - `sanctuary/services/sanctuaryLakeRenderer.js`: Čisté vykreslování jezera vzpomínek, vln a mlhy na `/svet`.
     - `actions/services/partnerReturnService.js`: Sledování návratu uživatele z webu partnera a odemknutí odměny.
     - `actions/services/recommendationEngine.js`: Algoritmus doporučování skutků podle preferencí a historie.
     - `pulse/services/pulseService.js`: Anonymizovaný ambientní pulz bez manipulativních prvků.
     - `map/services/contactTemplates.js`: Šablony kontaktování místních organizací na `/near`.
8. **`src/routes/` — Prezentační vrstva a API endpointy**:
   - Svelte 5 komponenty plní roli tenkých prezentačních pohledů. Veškerá aplikační logika je delegována do doménových služeb a úložišť. API endpointy v `src/routes/api/` striktně validují vstupy a dodržují bezpečnostní zásady (timing-safe tokeny, anti-bot ochrana).

### 3.2 Zákaz forwarderů a eliminace mrtvého kódu
1. **Úplná eliminace přechodových fasád**:
   - Jakékoliv přechodové a prázdné re-export/forwarder soubory (včetně `src/lib/sensoryEngine.js` a `src/lib/sensory/index.js`) jsou v cílovém stavu trvale odstraněny. Všechny komponenty, stránky a testy importují přímo z kanonických submodulů (např. `$lib/sensory/catalog/catalogResolver.js`, `$lib/sensory/canvas/impactCanvasAction.js`, `$lib/audio/presets.js`).
2. **Čistka nepoužívaných souborů a exportů**:
   - V repozitáři nesmí zůstat žádná osiřelá data ani mrtvé exporty (trvale smazán nepoužívaný 2354-řádkový `src/lib/data/czech-places.geojson` i nepoužívané re-exporty v `src/lib/utils.js`). Každý soubor v `src/lib/` má aktivního konzumenta nebo je součástí veřejného kontraktu.

### 3.3 Oddělení komponent od canvas výpočtů a bezpečný audit worktree
1. **Čisté výpočetní moduly bez závislosti na DOM**:
   - Výpočetně náročné vykreslovací smyčky (kočka Molly v `src/lib/molly/mollyCatRenderer.js` i jezero vzpomínek v `src/lib/features/sanctuary/services/sanctuaryLakeRenderer.js`) jsou vyčleněny do čistých ESM modulů bez jakékoliv vazby na DOM elementy, okenní události či reaktivní stav komponent.
2. **Defenzivní null guardy a robustnost**:
   - Všechny exportované kreslicí funkce obsahují defenzivní kontroly vstupů (`if (!ctx || !state) return;`, `if (!Array.isArray(mistClouds)) return;`). Pokud se komponenta odpojí z DOMu nebo kontext plátna není dostupný, smyčka bezpečně a tiše skončí bez vyvolání runtime chyb či memory leaků.
3. **Sdílená Svelte direktiva `use:impactCanvas` nesmí přepisovat třídy šablony**:
   - `use:impactCanvas` (`src/lib/sensory/canvas/impactCanvasAction.js`) obsluhuje jak náhledové plátno před akcí (`.preview-diorama-canvas` s výškou `92px` na PC / `50px`–`46px` na mobilu), tak větší plátno odměny po akci (`.impact-payoff-canvas` s výškou `118px` / `82px`). Direktiva nikdy nesmí bezpodmínečně přidávat `.impact-payoff-canvas` na `node.classList` ani nastavovat `data-molly-mini="ready"` při `params.preview === true` — obojí patří výhradně režimu odměny (`!isPreview`). Mock plátna v unit testech (`createMockCanvas`) musí vždy modelovat `classList` a `hasAttribute`.
4. **Bezpečný úklid dočasných `git worktree` s Windows Junction (`node_modules`)**:
   - Při 1:1 srovnávacích auditech proti baseline v dočasném `git worktree` s připojeným `node_modules` přes Windows Directory Junction (`New-Item -ItemType Junction`) vždy nejprve odpoj samotný junction příkazem `cmd /c rmdir "<worktree>\akcelerator-landing-page\node_modules"`, ověř `!(Test-Path ...)`, a teprve poté volej `git worktree remove --force` (nikdy nevolej `Remove-Item -Recurse` na adresář s aktivním junctionem).


