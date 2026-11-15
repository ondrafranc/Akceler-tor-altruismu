# Akcelerátor altruismu — Product North Star & Engineering Guardrails

## 1. Hlavní severka produktu (Nepřekročitelný zákon)
Každá obrazovka, text i technické rozhodnutí slouží jedinému cíli: **okamžitá, přímočará a bezpracná cesta od impulzu („mám volnou chvíli u mobilu“) ke skutečnému dobrému skutku a okamžitému pocitu dokončení.**

1. **Zákon 3 vteřin a Zero-Scroll vstupu (`100dvh`)**:
   - Na mobilních rozlišeních (`360×800`, `375×667`) musí být na `/` okamžitě nad ohybem obrazovky viditelná samotná karta konkrétního skutku a její hlavní akční tlačítko (`boundingBox.bottom <= viewportHeight`).
   - Nikdy nevkládej nad kartu skutku celoobrazovkové uvítací plakáty, kotevní scroll-tlačítka, morální kázání ani stěny filtrů.
2. **Jedna dominantní akce na obrazovku a nulový manipulativní šum**:
   - Hlavní CTA používá konkrétní akční sloveso (např. *„Nakrmit útulek teď“*) a reaguje okamžitě na první kliknutí (žádné umělé držení tlačítka / hold-to-confirm).
   - Nikde v aplikaci nepoužívej e-shopové / FOMO notifikace sociálního nátlaku typu *„právě někdo…“*, *„před X h někdo…“* ani *„v komunitě někdo…“* (`.ambient-pulse-pill`).
   - Sekundární metadata a pomocné akce (metodologie, důkazní třídy, detaily partnera, *„Ověřeno / Zdroj“*, *„Sdílet odkaz“* a *„Nahlásit chybu“*) patří výhradně dovnitř rozbalovacího detailu na vyžádání (`ℹ️ Jak to funguje`), nikdy přímo na výchozí plochu karty.
   - Každá záložka i filtr musí být okamžitě srozumitelné i pro prvonávštěvníka bez interních zkratek (např. *„Ověřený dopad (A)“* místo *„Důkazy A“*; u metaforické scény `/svet` kompaktní jednořádková legenda symbolů + rozbalovací klíč `▸ Jak to funguje`, jehož přepínač při otevření nemění pozici pod kurzorem).
   - Všechny interaktivní prvky na mobilu musí splňovat minimální dotykovou plochu `44×44 px` a nesmí překrývat obsah plovoucími vrstvami.
   - Všechna formulářová pole (`input`, `textarea`, `select`) na mobilu musí mít `font-size >= 16px` (`1rem`), aby iOS Safari při fokusu automaticky nepřibližoval viewport.
3. **Dvoufázový prožitek karty: Živá anticipace PŘED akcí, odměna až PO akci**:
   - **Před spuštěním (`!isStarted`)**: Karta nikdy nesmí působit jako suchý textový formulář — zobrazuje kompaktní tematické diorama očekávání specifické pro daný skutek (`.deed-preview-stage` / `canvas.preview-diorama-canvas`, např. paprsek čekající před hranolem nebo prázdná miska u pejska) bez předčasného vyzrazení odměny, bez překryvu horního štítku s kresbou, bez falešné affordance tlačítka (`cursor: default`) a se stránkováním balíčku dole pod obsahem. Na tmavých tlačítkách a odznacích používej ostré vektorové `<svg>` ikony místo systémových emoji (např. `🐾`), která mají na Windows nízký kontrast.
   - **Poetická proměna PO akci místo miniher (`isStarted` / `justCompleted`)**: Nikdy nevyžaduj arkádové vyklikávání bodů či miniherní smyčky. Tlačítko splnění (`.btn-studio-done`), scéna dopadu (`.card-effect-stage` s ne-překrývající lištou `.card-effect-head` nad `canvas.impact-payoff-canvas`) i pamlsek pro Molly se odemykají až po kliknutí na akci u partnera; po dokončení se in-situ odehraje plynulá tematická proměna *Před → Po* (standard `sbarvouven.cz`: paprsek → hranol → duha) s `frameStep` časováním nezávislým na 60/120Hz a automatickým uspáním smyčky po doznění.
4. **Patronka Molly a čistá desktopová mřížka**:
   - Želvovinová kočka Molly (`MollyCompanion.svelte`) je klíčový a oblíbený prvek napříč všemi záložkami (s plynulým předáním scéně u jezera na `/svet`). Její plátno má vždy `pointer-events: none` a měření překážek probíhá výhradně mimo `requestAnimationFrame`.
   - Na mobilu (`<= 680px`) nikdy neskrývej `.molly-pelisek-dock` přes `display: none`; dokuj jej do pravé části horní kapsle `.nav-capsule` a bubliny vykresluj pod `.top-nav` s nulovým překryvem karet a CTA.
   - Do horní navigační kapsle (`.nav-capsule`) nevkládej rušivé ikony krizového štítu (`🛡️`); krizová opora zůstává diskrétně v pilulce/patičce. Na desktopu musí mít `.nav-capsule`, `.hero-inner` i `.content-wrap` sjednocenou šířku (`max-width: 1140px; box-sizing: border-box`) a zarovnání horní hrany (`align-items: start`).

## 2. Architektonické a bezpečnostní invarianty
1. **Žádné duplicitní katalogy ani forwarder záplaty**:
   - Existuje jediná kanonická implementace karty skutku a akčního balíčku. Nikdy nevytvářej prázdné re-export/forwarder soubory ani nepoužívané komponenty jen kvůli průchodu testů — oprav přímo importy nebo testy.
2. **Svelte 5 & čistý výkon na mobilu**:
   - Nepoužívej celostránkové `querySelectorAll` + `getBoundingClientRect` / `getComputedStyle` uvnitř `requestAnimationFrame` smyček ani `background-attachment: fixed`.
   - Těžké knihovny (`leaflet`, velké canvas/audio scény) načítej výhradně dynamicky (`await import(...)`) až v okamžiku, kdy je uživatel skutečně zobrazí.
   - V `src/app.html` používej pro statické ikony a manifest výhradně kořenově absolutní cesty (`/soubor`), pro úpravu URL parametrů `goto(..., { replaceState: true, noScroll: true, keepFocus: true })` (nikdy přímé `history.pushState`/`replaceState`), před `map.remove()` vždy volej `map.stop()` a `AudioContext` inicializuj až po prvním uživatelském gestu.
3. **Databáze a bezpečnost API**:
   - Jediným zdrojem pravdy pro DB schéma je `supabase/migrations/`. Každá změna sloupců v `src/routes/api/**` musí odpovídat SQL migraci.
   - Veřejné endpointy používají `PUBLIC_SUPABASE_ANON_KEY` s aktivním RLS; `SUPABASE_SERVICE_ROLE_KEY` nesmí být nikdy přijímán v klientských hlavičkách ani používán pro běžné uživatelské dotazy.
   - Testovací bypassy (`TEST_BYPASS_SECRET`) nesmí mít nikdy hardcodovaný fallback v kódu a tajemství se porovnávají přes `crypto.timingSafeEqual`.
4. **Toolchain, Vercel Node Runtime a E2E spouštění**:
   - Do `akcelerator-landing-page/package.json` nikdy nepřidávej pole `"engines"` (`node`) — otevřený rozsah (`>=22`) způsobí, že Vercel přebije Project Settings `"24.x"` (`runtime: 'nodejs24.x'` v `svelte.config.js`) nejnovější major verzí (`26.x`), zatímco striktní pin rozbije lokální vývoj na Node `22.x`. Udržuj `@types/node` na `^24` a `"allowScripts"` pinované na přesnou verzi balíčku.
   - Playwright E2E testy v `akcelerator-landing-page` spouštěj vždy přes `npm test -- <spec>` (nikoliv holým `npx playwright test`, které natáhne nekompatibilní globální verzi mimo lokální `@playwright/test`).

