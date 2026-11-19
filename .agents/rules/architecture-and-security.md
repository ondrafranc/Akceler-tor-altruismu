# Architektura, výkon a bezpečnost (`akcelerator-landing-page/`)

## 1. Doménové vrstvy a hranice odpovědností
Kódová báze uvnitř `akcelerator-landing-page/src/` dodržuje jednosměrný tok závislostí a oddělení doménové logiky od prezentační vrstvy:
1. **`src/lib/types/` (`"checkJs": true` v `jsconfig.json`)**:
   - Kanonické TypeScript definice: `deed.ts`, `sensory.ts`, `molly.ts`, `progress.ts`, `api.ts`, `storage.ts`, `index.ts`.
   - V `src/` platí nulová tolerance pro `any` i `@ts-ignore`. JS moduly používají explicitní JSDoc `@type` vazby na kanonické typy.
2. **`src/lib/sensory/` — Grafický subsystém**:
   - `catalog/` (`actionCatalog.js`, `catalogResolver.js`), `graphics/` (`primitives.js`, `math.js`), `scenes/` (`poeticDispatcher.js` + `animalsScenes.js`, `communityScenes.js`, `foodScenes.js`, `healthScenes.js`, `knowledgeScenes.js`, `natureScenes.js`), `canvas/` (`impactCanvasEngine.js`, `impactCanvasAction.js`, `controllerRegistry.js` s auto-sleep, DPR capem a `ResizeObserver`/`IntersectionObserver`), `interaction/` (`holdSpark.js`).
3. **`src/lib/storage/` — Registr klíčů a SSR-safe adaptér**:
   - `keys.ts` drží centrální exportované konstanty (`19` exportovaných konstant pro `18` unikátních klíčů a prefixů) — v komponentách je zakázáno používat surové řetězcové literály pro `localStorage`/`sessionStorage`.
   - `index.ts` zajišťuje ochranu proti `SecurityError`, in-memory fallback a evidenci `failedNativeWrites`.
4. **`src/lib/audio/` & `src/lib/core/`**:
   - Líný `audioContext.js`, `synthesizer.js` a `presets.js` respektující `isSoundMuted`; `AudioContext` se inicializuje až po prvním uživatelském gestu.
   - `device.js` (`isLowPowerDevice`, `prefersReducedMotion`, `safeVibrate`, `frameStep`).
5. **`src/lib/molly/` & `src/lib/icons/`**:
   - Čistý 2D renderer `mollyCatRenderer.js`.
   - Kanonický registr ikon: `src/lib/icons/iconRegistry.js` (včetně `getSvgIconHtml()` pro Leaflet a SSR-safe SVG stringy), `src/lib/icons/lucideIcons.js` a komponenta `src/lib/components/AppIcon.svelte`.
6. **`src/lib/features/`, `src/lib/server/` & `src/routes/api/`**:
   - Doménové služby (`sanctuary/services/sanctuaryLakeRenderer.js`, `actions/services/partnerReturnService.js`, `actions/services/recommendationEngine.js`, `map/services/contactTemplates.js`), serverové služby (`server/supabase.js`, `server/nearbyService.js`) a validované endpointy v `src/routes/api/`.

## 2. Svelte 5 Runes, Vite a čistota modulů
1. **Svelte 5 Runes politika a aktuální pokrytí (`31` `.svelte` souborů)**:
   - Veškeré **nové a refaktorované** `.svelte` komponenty musí používat Svelte 5 Runes (`$props()`, `$state()`, `$derived()`, `$effect()`).
   - Aktuální stav v `src/`: `20/31` souborů používá Runes, `1` bezstavový Svelte 5 route (`src/routes/+error.svelte` s `onclick=`) a `10` zbývajících starších Svelte 4 komponent (`SmallWinCelebration.svelte`, `CityJumpStrip.svelte`, `HopeCarousel.svelte`, `PathwaysBento.svelte`, `PortalsDrawer.svelte`, `QuickStartSection.svelte`, `SanctuaryTeaser.svelte`, `DeedInspectorModal.svelte`, `ProgressDashboard.svelte`, `src/routes/app/+page.svelte`) se migruje postupně při úpravách — do upravovaného souboru staré vzory nepřidávej.
2. **Automatické načítání `@lucide/svelte` ve Vite**:
   - `akcelerator-landing-page/vite.config.js` automaticky čte `src/lib/icons/lucideIcons.js` a vkládá importy do `optimizeDeps.include`. Nové ikony stačí přidat do `lucideIcons.js` a `iconRegistry.js` — `vite.config.js` se ručně neupravuje.
3. **Kanonický barrel vs. zakázané fasády a mrtvý kód**:
   - Zpětně kompatibilní datový barrel `src/lib/data/czech-actions.js` je povolený a udržovaný jediný datový rozcestník.
   - Přechodové forwarder fasády (`src/lib/sensoryEngine.js`, `src/lib/sensory/index.js`) a odstraněné nepoužívané moduly/vzory (`src/lib/offlineSync.js`, `src/lib/features/pulse/services/pulseService.js`, `src/lib/data/czech-places.geojson`, `SYNC_OFFLINE_OUTBOX` v `src/service-worker.js`, `LAST_UPSTREAM_TS` v `api/geocode`, `includeAssociations` / `include_associations` v `api/nearby` a `nearbyService.js`, `globalSparkCharge` v `holdSpark.js`, `WORLD_MILESTONES` / `worldHealPercent` / `recordSanctuaryWish` v `progress.js`, `.subpage-hero` v `czech-theme.css`, `showEffectPreview` v `ActionCard.svelte`/trasách) se nesmí znovu zavádět. Každý soubor v `src/lib/` musí mít aktivního konzumenta nebo veřejný kontrakt.

## 3. Čisté canvas renderery, výkon a úklid worktree
1. **Čisté ESM canvas moduly**:
   - Výpočetní a vykreslovací smyčky (`mollyCatRenderer.js`, `sanctuaryLakeRenderer.js`) jsou čisté ESM moduly bez vazby na DOM s defenzivními null guardy (`if (!ctx || !state) return;`, `if (!Array.isArray(mistClouds)) return;`).
2. **Výkon a DOM disciplína**:
   - Nikdy nepoužívej celostránkové `querySelectorAll` + `getBoundingClientRect` / `getComputedStyle` uvnitř `requestAnimationFrame` smyček ani `background-attachment: fixed`.
   - Těžké knihovny (`leaflet`, velké canvas/audio scény) načítat dynamicky (`await import(...)`).
   - V `src/app.html` používej kořenově absolutní cesty (`/soubor`), pro URL parametry `goto(..., { replaceState: true, noScroll: true, keepFocus: true })` a před `map.remove()` vždy volej `map.stop()`.
3. **Úklid `git worktree` na Windows**:
   - Pokud má dočasné worktree Windows Directory Junction pro `node_modules`, nejprve odpoj junction přes `cmd /c rmdir "<worktree>\akcelerator-landing-page\node_modules"`, ověř `!(Test-Path ...)`, a teprve poté spusť `git worktree remove --force`.

## 4. Databáze, bezpečnost API, CSP a Node 24 toolchain
1. **Supabase schéma, klienti a RLS**:
   - Jediným zdrojem pravdy pro DB schéma jsou migrace `supabase/migrations/0001_initial_schema.sql` a `supabase/migrations/0002_rls_hardening.sql`. Změny sloupců v `src/routes/api/**` musí přesně odpovídat těmto migracím.
   - `src/lib/server/supabase.js` cachuje `getServerSupabase()` (veřejný `anon` s RLS, kde `anon`/`authenticated` mají na `community_submissions` výhradně sloupcový `SELECT` bez `ip_hash`) a `getAdminSupabase()` přes SHA-256 `buildClientCacheKey(role, url, key)` — nikdy přes 16znakové řezy JWT.
   - Moderační `PATCH /api/submissions` spouští constant-time `safeCompareTokens` na `x-moderator-secret` **před** `resolveClientKey` a `checkRateLimit('submissions-mod', ...)`, vyžaduje `getAdminSupabase()` bez fallbacku na `anon`, kontroluje `Content-Type: application/json`, platné UUID a vrací `Cache-Control: no-store`.
2. **Identifikace klienta, tajné klíče a zabezpečení API endpointů**:
   - `resolveClientKey(request, getClientAddress)` (`src/lib/security.js`) upřednostňuje `x-vercel-forwarded-for` (na Vercelu) a non-loopback `getClientAddress()` před podvrhnutelnými hlavičkami `cf-connecting-ip` / `x-forwarded-for`.
   - `TEST_BYPASS_SECRET` nesmí mít hardcodovaný fallback; `isAuthorizedTestBypass(request)` porovnává tajemství přes `crypto.timingSafeEqual` (SHA-256 digesty v `safeCompareTokens`) a při `VERCEL_ENV === 'production'` bezpodmínečně vrací `false`.
   - `POST /api/pulse` validuje `actionId` (`<= 80` code points) proti 45 `MICRO_ACTIONS` a povoleným prefixům (`curated:`, `comm-seed-`, `comm:`, `submit_`, UUID, interní ID), ořezává `city` (`<= 60` code points, též v `resolveCityLocative()`) a používá `isAuthorizedTestBypass(request)` bez `User-Agent` bypassu.
   - `/api/test-supabase` vrací na `GET`/`POST` odpověď `404` (`Cache-Control: no-store`) ve Vercel Preview/Production a na nelokálních non-dev hostech, pokud neprojde `isAuthorizedTestBypass(request)`; navíc uplatňuje rate-limit `20/60s` na `GET`.
   - `/api/geocode` vynucuje `MAX_QUEUE_WAIT_MS = 2500` před zápisem do fronty a při přetečení vrací necachované `503` (`GEOCODE_QUEUE_OVERFLOW`, `Retry-After`) bez otrávení cache.
   - `/api/nearby` a `nearbyService.js` nepodporují ani nerozdělují cache podle `includeAssociations`.
3. **CSP Nonce vs. CDN Cache**:
   - `akcelerator-landing-page/svelte.config.js` používá `csp.mode: 'auto'` (per-request nonce). Všechny SSR HTML odpovědi musí v `akcelerator-landing-page/src/hooks.server.js` vracet `Cache-Control: private, no-cache, no-store, must-revalidate` a `Pragma: no-cache` (nikdy veřejné `s-maxage`), aby Edge CDN nesdílel stejný nonce mezi uživateli.
4. **Runtime Node 24 a spouštění testů**:
   - Cílový runtime je Node `24` (`akcelerator-landing-page/.nvmrc` = `24`, `runtime: 'nodejs24.x'` v `svelte.config.js`, `@types/node` na `^24`).
   - Do `akcelerator-landing-page/package.json` nepřidávej pole `"engines"` (`node`) a udržuj `"allowScripts"` pinované na přesnou verzi balíčku (`"esbuild@0.28.2"`).
   - Playwright E2E testy v `akcelerator-landing-page` spouštěj vždy přes `npm test -- <spec>` (nikoli holým `npx playwright test`).
