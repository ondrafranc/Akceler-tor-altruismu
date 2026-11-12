# Akcelerátor altruismu — Product North Star & Engineering Guardrails

## 1. Hlavní severka produktu (Nepřekročitelný zákon)
Každá obrazovka, text i technické rozhodnutí slouží jedinému cíli: **okamžitá, přímočará a bezpracná cesta od impulzu („mám volnou chvíli u mobilu“) ke skutečnému dobrému skutku a okamžitému pocitu dokončení.**

1. **Zákon 3 vteřin a Zero-Scroll vstupu (`100dvh`)**:
   - Na mobilních rozlišeních (`360×800`, `375×667`) musí být na `/` okamžitě nad ohybem obrazovky viditelná samotná karta konkrétního skutku a její hlavní akční tlačítko (`boundingBox.bottom <= viewportHeight`).
   - Nikdy nevkládej nad kartu skutku celoobrazovkové uvítací plakáty, kotevní scroll-tlačítka, morální kázání ani stěny filtrů.
2. **Jedna dominantní akce na obrazovku**:
   - Hlavní CTA používá konkrétní akční sloveso (např. *„Nakrmit útulek teď“*) a reaguje okamžitě na první kliknutí (žádné umělé držení tlačítka / hold-to-confirm).
   - Sekundární metadata (metodologie, důkazní třídy, detaily partnera) patří výhradně do rozbalovacího detailu na vyžádání (`ℹ️ Jak to funguje`), nikdy nad primární CTA.
   - Všechny interaktivní prvky na mobilu musí splňovat minimální dotykovou plochu `44×44 px` a nesmí překrývat obsah plovoucími vrstvami.
3. **Odměna výhradně PO skutečné akci**:
   - Nikdy nezobrazuj tlačítko „Mám hotovo“ ani dopaminové minihry/vizualizace dříve, než uživatel skutečně spustil akci u partnera.
   - Odměna proběhne okamžitě in-situ přímo na kartě po návratu z akce, bez nuceného přesměrovávání na jiné trasy (`/svet`).
4. **Patronka Molly a čistá desktopová mřížka**:
   - Želvovinová kočka Molly (`MollyCompanion.svelte`) je klíčový a oblíbený prvek napříč všemi záložkami (s plynulým předáním scéně u jezera na `/svet`). Její plátno má vždy `pointer-events: none` a měření překážek probíhá výhradně mimo `requestAnimationFrame`.
   - Do horní navigační kapsle (`.nav-capsule`) nevkládej rušivé ikony krizového štítu (`🛡️`); krizová opora zůstává diskrétně v pilulce/patičce. Na desktopu musí mít `.nav-capsule`, `.hero-inner` i `.content-wrap` sjednocenou šířku (`max-width: 1140px; box-sizing: border-box`) a zarovnání horní hrany (`align-items: start`).

## 2. Architektonické a bezpečnostní invarianty
1. **Žádné duplicitní katalogy ani forwarder záplaty**:
   - Existuje jediná kanonická implementace karty skutku a akčního balíčku. Nikdy nevytvářej prázdné re-export/forwarder soubory ani nepoužívané komponenty jen kvůli průchodu testů — oprav přímo importy nebo testy.
2. **Svelte 5 & čistý výkon na mobilu**:
   - Nepoužívej celostránkové `querySelectorAll` + `getBoundingClientRect` / `getComputedStyle` uvnitř `requestAnimationFrame` smyček ani `background-attachment: fixed`.
   - Těžké knihovny (`leaflet`, velké canvas/audio scény) načítej výhradně dynamicky (`await import(...)`) až v okamžiku, kdy je uživatel skutečně zobrazí.
3. **Databáze a bezpečnost API**:
   - Jediným zdrojem pravdy pro DB schéma je `supabase/migrations/`. Každá změna sloupců v `src/routes/api/**` musí odpovídat SQL migraci.
   - Veřejné endpointy používají `PUBLIC_SUPABASE_ANON_KEY` s aktivním RLS; `SUPABASE_SERVICE_ROLE_KEY` nesmí být nikdy přijímán v klientských hlavičkách ani používán pro běžné uživatelské dotazy.
   - Testovací bypassy (`TEST_BYPASS_SECRET`) nesmí mít nikdy hardcodovaný fallback v kódu a tajemství se porovnávají přes `crypto.timingSafeEqual`.

