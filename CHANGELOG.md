# Changelog

## [Unreleased] — Bezpečnost API, North Star na `/`, podstránky a sjednocení pravidel

### Bezpečnost, API hardening a databázová vrstva (M1–M2)
- Přidána bezpečnostní migrace `supabase/migrations/0002_rls_hardening.sql`: sloupce `event_start`/`event_end`, sloupcový `SELECT` na `community_submissions` bez `ip_hash`, délkové a geografické `CHECK` limity pro ČR, zpřísnění RLS pro `feedback` (`status = 'new'`) a 24h okno pro `pulse_events`.
- Zpřesněna správa Supabase klientů (`src/lib/server/supabase.js`): oddělené `getServerSupabase()` (veřejný `anon` + RLS) a `getAdminSupabase()` s cachováním přes SHA-256 `buildClientCacheKey(role, url, key)` bez 16znakových kolizí JWT.
- Zabezpečen moderační `PATCH /api/submissions`: constant-time `safeCompareTokens` na `x-moderator-secret` běží **před** `resolveClientKey` a `checkRateLimit('submissions-mod', ...)` a odpovědi nesou `Cache-Control: no-store`.
- Zpřesněno `resolveClientKey()` v `src/lib/security.js`: priorita `x-vercel-forwarded-for` (na Vercelu) a non-loopback `getClientAddress()` před hlavičkami `cf-connecting-ip` / `x-forwarded-for`; `isAuthorizedTestBypass(request)` bezpodmínečně vrací `false` při `VERCEL_ENV === 'production'`.
- Zpřísněno `POST /api/pulse` (validace `actionId` proti 45 `MICRO_ACTIONS` a povoleným prefixům, ořezání `city` na `<= 60` code points včetně `resolveCityLocative()`, odstranění `User-Agent` bypassu ve prospěch `isAuthorizedTestBypass()`).
- Uzamčen `/api/test-supabase`: vrací `404` (`Cache-Control: no-store`) na Vercel Preview/Production a nelokálních non-dev hostech bez `isAuthorizedTestBypass()`, s rate-limitem `20/60s` na `GET`.
- Doplněn limit fronty `MAX_QUEUE_WAIT_MS = 2500` v `/api/geocode` (necachované `503` `GEOCODE_QUEUE_OVERFLOW` s `Retry-After` bez otrávení cache; odstraněno `LAST_UPSTREAM_TS`) a odstraněno nepoužívané `includeAssociations` z `/api/nearby` a `nearbyService.js`.
- Ošetřena bezpečnost CSP nonců v `src/hooks.server.js`: SSR HTML odpovědi vrací `Cache-Control: private, no-cache, no-store, must-revalidate` a `Pragma: no-cache`.

### Hlavní vstup `/`, globální prvky a Svelte 5 Runes (M3)
- `HeroSection.svelte` převedena na responzivní `<picture>` (`sanctuary-dawn-800.webp` / `sanctuary-dawn.webp` + `.jpg` fallback), podřízený skleněný `.hero-btn.primary`, vyvážený 2řádkový desktopový H1, světlý `#fef3c7` `:focus-visible` a kompaktní mobilní rozvržení (`375×667` `.btn-studio-primary` nad ohybem).
- `ActionCard.svelte` sjednocena do jediné morphing scény `.deed-stage` (`preview -> active -> payoff`, jedno `<canvas class="stage-canvas">` bez layoutového skoku a bez `<h3 class="win-title">`), `{#key currentAction.id}` resetující `<details>` a `lastCelebratedActionId` proti dvojímu `playCelebrationChord()`.
- Záložky energie na `/` filtrují balíček přes `filterHomeDeckPool()` (`45` `couch` / `8` `focus` / `16` `walk` / `9` `people`), `AA_HOME_DECK_STATE_KEY` se ukládá v `sessionStorage`, `/?action=<id>` odemyká `ignoreClosedSession` s `.deeplink-exit-btn` a `SwipeDeck.svelte` používá místní `getTodayKey()` + `$todayCompletedCount`.
- Vyčištěno byrokratické copy (*„Ověřený dopad (A/B/C)“*, *„dnešní seanci“*, *„Udělal/a“*), srovnáno `aria-label="Pro dnešek hotovo — odpočinout si"` (WCAG 2.5.3), sjednocena patička v `+layout.svelte` na jediný `/submit` odkaz bez `•` odrážek a opravena tečka v `+error.svelte`.
- Doplněna plná přístupnost `ImmediateHelp.svelte` a `FeedbackModal.svelte` (`aria-modal="true"`, `Tab` focus trap, bezpečný návrat fokusu, `tel:155` a `tel:112`, `maxlength="1500"`, odstranění `.crisis-mobile-fab`).
- Odstraněn mrtvý kód (`offlineSync.js`, `pulseService.js`, `sensoryEngine.js`, `sensory/index.js`, `czech-places.geojson`, `SYNC_OFFLINE_OUTBOX`, `globalSparkCharge`, `WORLD_MILESTONES`/`worldHealPercent`/`recordSanctuaryWish`, `.subpage-hero`, `showEffectPreview`) a migrace Svelte 5 Runes dosáhla `20/31` souborů (+ bezstavové `+error.svelte`, `10` zbývajících Svelte 4 komponent).

### Podstránky M4 a šablona `.env.example`
- **`/near`**: Sekundární filtry sbaleny do `details.near-filters-drawer`, mobilní ovládání srovnáno na `360 px`, sjednoceny nápovědy `PlaceCard` (`getPlaceActionHint` + `p.quickMission`) a 1-tap `tel:`/`mailto:`/`Mapy.cz`, doplněna ochrana `isCatOnlyShelter` v `contactTemplates.js`, opravena hierarchie `h1 -> h2`, `markActionStarted` až při reálné akci a pořadí `initMap()` před OSM dlaždicemi.
- **`/svet`**: Líně připojovaná noční vrstva (`hasActivatedNight`), `dawnLayerOpacity = 0` v noci, jediné počítadlo pamlsků přes `!$mollyDockBridge.atHome`, dotykové plochy `>= 44×44 px` (`.guide-toggle-summary`, `RitualBar`, `BreathingPacer`), čistý `#ritual-deed-input`, odstranění `.qp-sep`, ARIA `tablist`/`radiogroup` a ztlumený výchozí zvuk.
- **`/app/guided`**: `#personal-plan` před `.compass-foundations` přímo v DOM (`WCAG 2.4.3`), odstranění duplicitní Q2/Q3, jediný `aria-live`, `aria-pressed`, zalamování `.topic-pills` a `.alt-card h3`.
- **`/app/online`**: Priorita `mode !== 'local'` ve výchozím pohledu *„Doporučené“*, zalamování `.hero-tools-row` na `360 px`, spodní zarovnání CTA v desktopové mřížce a `aria-pressed` na `.filter-chip`.
- **`/submit`**: Dynamický `headerSubtitle`, `role="tablist"`/`tab`, `aria-pressed` na `.q-pill`, nativní `required` + `aria-required="true"` + `type="url"`, hierarchie `h1 -> h2` a `handleOptionalFieldInvalid` s `validatingOptionalOpen` pro bezpečné rozbalení `<details>`.
- **`.env.example`**: Zarovnáno s neprodukčními proměnnými `TEST_BYPASS_SECRET` a `PULSE_ALLOW_DEV_WRITES`.

### Dokumentace, pravidla a toolchain
- Sjednocena pravidla do root `AGENTS.md` (včetně povinné synchronizace dokumentace na konci každého běhu v § 3) a `.agents/rules/{architecture-and-security,ui-and-sensory}.md` bez duplicit a frontmatteru; odstraněna `.cursor/rules/todo2*.mdc`.
- Zarovnáno prostředí na Node.js `24` (`.nvmrc`, `nodejs24.x`, `.github/workflows/ci.yml`, `.devcontainer/devcontainer.json`) a sesynchronizována projektová dokumentace (`README.md`, `CONTRIBUTING.md`, `DEPLOYMENT_INSTRUCTIONS.md`, `CONCEPT_V2.md`, `user_journeys.md`, `.github/pull_request_template.md`).

---

## Předchozí základ (SvelteKit migrace)
- Spuštěn SvelteKit základ s trasami `/app`, `/app/guided`, `/app/online`, `/near`, `/submit` a API endpointy (`/api/nearby`, `/api/geocode`, `/api/community-nearby`, `/api/submissions`, `/api/feedback`, `/api/pulse`, `/api/test-supabase`).
- Odstraněny původní Streamlit zbytky a těžké nevyužité závislosti (`three`, `p5`).
