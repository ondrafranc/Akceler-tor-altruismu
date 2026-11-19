# Akcelerátor altruismu

[![Node.js](https://img.shields.io/badge/node-24_LTS-brightgreen.svg)](https://nodejs.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-orange.svg)](https://kit.svelte.dev/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5-FF3E00.svg)](https://svelte.dev/)
[![License: MIT (intended)](https://img.shields.io/badge/License-MIT_(intended)-blue.svg)](#licence)
[![Zero Config](https://img.shields.io/badge/quickstart-%3C2_min-purple.svg)](#rychlý-start--quickstart--2-min)

---

### O projektu (Czech)
**Česká otevřená platforma pro okamžitou pomoc bez přetížení a výčitek.**

Hlavní severka produktu zní: **„Pomáhat pomáhat – a udělat pomáhání tak snadné jako masturbovat.“**
Aplikace je navržená pro chvíle únavy, zahlcení zprávami nebo nejistoty, kde začít. Nabízí okamžitý vstup ke **45 ověřeným českým i světovým dobrým skutkům**, lokální mapě pomoci v ČR i zklidňujícímu prostoru *Krajina dobra* — bez registrace, bez moralizování a bez manipulativního nátlaku.

### Overview (English)
**An open-source Czech civic platform delivering immediate, friction-free agency.**

Built for moments of low energy or news overwhelm, the app turns impulse into real-world good deeds in seconds — featuring a 45-deed interactive deck, a live Czech help map (`/near`), a tailored 60-second guide (`/app/guided`), and the interactive *Krajina dobra* sanctuary (`/svet`) with zero required sign-up and zero guilt-tripping.

---

## Rychlý start / Quickstart (< 2 min)

Aplikace funguje **okamžitě bez jakýchkoliv externích API klíčů či databází** díky vestavěným lokálním českým datovým sadám a záložním mechanismům.

### 1. Klonování a instalace / Clone & Install
```bash
git clone https://github.com/ondrafranc/Akceler-tor-altruismu.git
cd Akceler-tor-altruismu

# Nainstaluje závislosti v rootu i v aplikaci (vyžaduje Node 24)
npm install
```

### 2. Spuštění vývojového serveru / Start Dev Server
```bash
npm run dev
```

Otevřete v prohlížeči **[http://localhost:5173](http://localhost:5173)**.

> **Tip:** Root `package.json` obsahuje proxy skripty pro `akcelerator-landing-page/`. Stejně dobře lze příkazy spouštět pomocí `npm --prefix akcelerator-landing-page run <skript>` (výjimkou je kořenová zkratka `npm run test:api`, viz tabulka níže).

---

## Architektura a struktura repozitáře / Architecture & Layout

```text
Akcelerátor altruismu/
├── package.json                               # Kořenové proxy skripty pro vývojáře
├── AGENTS.md                                  # Hlavní severka, UX zásady a index pravidel
├── README.md                                  # Přehled projektu, quickstart a reference
├── CONTRIBUTING.md                            # Průvodce přispěvatele (Svelte 5 Runes, testy)
├── DEPLOYMENT_INSTRUCTIONS.md                 # Produkční nasazení (Vercel + Supabase 0001/0002)
├── CONCEPT_V2.md                              # Produktový koncept a principy zážitku
├── user_journeys.md                           # Klíčové uživatelské cesty
├── CHANGELOG.md                               # Přehled milníků a změn
├── vercel.json                                # Kořenová Vercel konfigurace + cache hlavičky
├── .agents/rules/                             # Modulární pravidla architektury, bezpečnosti a UI
├── .devcontainer/                             # Devcontainer prostředí (Node.js 24 Bookworm)
├── .github/                                   # CI workflow (Node 24) a šablony PR / Issues
├── supabase/migrations/
│   ├── 0001_initial_schema.sql                # Základní schéma (feedback, community_submissions, pulse_events)
│   └── 0002_rls_hardening.sql                 # RLS zpřísnění, sloupcový SELECT, CHECK limity
└── akcelerator-landing-page/                  # Hlavní SvelteKit 2 + Svelte 5 aplikace
    ├── .nvmrc                                 # Verze Node.js (24)
    ├── svelte.config.js                       # Vercel adaptér (nodejs24.x) a CSP noncy
    ├── vite.config.js                         # Vite konfigurace a auto-registrace ikon
    ├── vercel.json                            # Vercel konfigurace pro root directory aplikace
    ├── static/                                # Statické assety (art/sanctuary-{dawn,twilight}.{jpg,webp,-800.webp}, og-image-czech.jpg)
    ├── src/
    │   ├── hooks.server.js                    # Bezpečnostní hlavičky + Cache-Control pro CSP noncy
    │   ├── service-worker.js                  # Offline podpora statických assetů
    │   ├── styles/                            # Globální Czech forest design tokeny (czech-theme.css)
    │   ├── components/                        # Globální UI a patronka Molly (MollyCompanion, MollyDock, ImmediateHelp, FeedbackModal, SmallWinCelebration)
    │   ├── lib/
    │   │   ├── audio/                         # Líný Web Audio syntezátor a presety (audioContext, synthesizer, presets)
    │   │   ├── components/                    # Sdílené Runes komponenty (AppIcon, PageHeader)
    │   │   ├── core/                          # Zařízení, frameStep a bezpečné vibrace (device.js)
    │   │   ├── data/                          # Atomické české datové sady (45 skutků v micro-actions.js) + barrel czech-actions.js
    │   │   ├── features/
    │   │   │   ├── actions/                   # SwipeDeck, ActionCard, EvidenceBadge, partnerReturnService, recommendationEngine
    │   │   │   ├── home/                      # HeroSection, QuickStartSection, PathwaysBento, CityJumpStrip, SanctuaryTeaser, HopeCarousel, PortalsDrawer
    │   │   │   ├── map/                       # PlaceCard, contactTemplates
    │   │   │   └── sanctuary/                 # BreathingPacer, DeedInspectorModal, ProgressDashboard, RitualBar, sanctuaryLakeRenderer
    │   │   ├── icons/                         # Kanonický SVG registr (@lucide/svelte): iconRegistry.js, lucideIcons.js
    │   │   ├── molly/                         # Čistý 2D Canvas renderer kočky Molly (mollyCatRenderer.js)
    │   │   ├── sensory/                       # Procedurální 2D dioramy a dopadové scény (catalog, graphics, scenes, canvas, interaction)
    │   │   ├── server/                        # Serverové služby (supabase.js, nearbyService.js)
    │   │   ├── storage/                       # Centrální registr klíčů (keys.ts) a SSR-safe adaptér (index.ts)
    │   │   └── types/                         # Kanonické TypeScript definice (deed, sensory, molly, progress, api, storage)
│   │   ├── routes/
│   │   │   ├── +page.svelte                   # Hlavní vstup: <picture> WebP české tůně + dynamický claim (HOME_MODES) + toulavá Molly + .deed-stage + 45 skutků
│   │   │   ├── +error.svelte                  # Bezstavová 404 stránka se zpětnou navigací
│   │   │   ├── near/+page.svelte              # Mapa pomoci v ČR (Leaflet + OSM + 81 kurátorovaných míst + komunita)
│   │   │   ├── svet/+page.svelte              # Krajina dobra (tichá česká lesní tůň, líná noční vrstva, dechový pacer, sdílené skutky)
│   │   │   ├── submit/+page.svelte            # Komunitní formulář pro přidání místa nebo akce s nativní validací
│   │   │   ├── app/+page.svelte               # Přehledový rozcestník 4 cest pomoci
│   │   │   ├── app/guided/+page.svelte        # Průvodce výběrem na míru během 60 sekund (WCAG 2.4.3 pořadí)
│   │   │   ├── app/online/+page.svelte        # Filtrovatelný katalog samostatných karet online i lokálních mikro-akcí
│   │   │   └── api/                           # Backend endpointy (/community-nearby, /feedback, /geocode, /nearby, /pulse, /submissions, /test-supabase)
│   └── tests/                                 # Vitest jednotkové testy (17 souborů / 216 testů) a Playwright E2E (18 *.spec.ts / 324 testů)
```

### Hlavní trasy aplikace (Routes)
1. **`/` (Hlavní stránka)** — Prosvětlený vstup s `<picture>` WebP svítáním nad českou lesní tůní (`/art/sanctuary-dawn.*`) sahajícím za horní lištu na desktopu, tabletu i mobilu, vlevo zarovnaným editorial přivítáním (`Pomáhat může být lehké.` + dynamická teplá kurzíva `.hero-serif` a mobilní podtitulek `.hero-mobile-claim` reagující na aktivní režim `HOME_MODES`, `?intent=` i `?action=`), jednotnou morphing scénou `.deed-stage` (`preview -> active -> payoff`), 4 skutečně filtrujícími záložkami energie (`45` *Mám 2 min* / `8` *Mám 15 min* / `16` *Osobně* / `9` *Dlouhodobě*), `sessionStorage` stavem balíčku (`AA_HOME_DECK_STATE_KEY`), plynule toulavou a hladitelnou kočkou Molly napříč desktopem, tabletem i mobilem, rychlými portály, skokem do českých měst a upoutávkou na *Krajinu dobra*.
2. **`/near` (Mapa pomoci v okolí)** — Reálná místa pomoci po celé ČR (Leaflet + dlaždice OpenStreetMap, geokódování Nominatim přes `/api/geocode`, `81` kurátorovaných míst v `fallback-places.js` a schválené komunitní tipy ze Supabase `community_submissions` se zálohou `18` položek v `community-items.js`), šuplík sekundárních filtrů *„Filtrovat“*, sjednocená nápověda mise `getPlaceActionHint`, 1-tap `tel:`/`mailto:`/`Mapy.cz` a připravené šablony zpráv (včetně rozlišení kočičích útulků).
3. **`/svet` (Krajina dobra)** — Tiché útočiště s českou lesní tůní (`sanctuary-dawn.*` / `sanctuary-twilight.*`), lucernami a hvězdami dobrých skutků, dechovým cvičením, líně načítanou noční vrstvou, jediným počítadlem pamlsků pro Molly a výchozím ztlumeným zvukem.
4. **`/app` (Rozcestník)** — Čtyřkartový přehled cest (*Krajina dobra*, *Průvodce*, *Mapa v okolí*, *Drobné skutky*).
5. **`/app/guided` (Průvodce na míru)** — Výběr témat, času a nákladů s plánem `#personal-plan` před filtry přímo v DOM (`WCAG 2.4.3`), zdůvodněním a přechodem na `/near`.
6. **`/app/online` (Katalog mikro-skutků)** — Filtrovatelný přehled skutků podle času, nákladů a místa se samostatnými bílými kartami (`ActionCard` `variant="directory"`, `#ffffff` povrch, lesní rámeček a stín) ve vícesloupcové desktopové mřížce (`gap: 1.5rem`) a prioritou online/telefonních kroků ve výchozím pohledu *„Doporučené“*.
7. **`/submit` (Přidat místo nebo akci)** — Komunitní formulář s dynamickým podtitulkem, přístupnými záložkami typu tipu, automatickým geokódováním, nativní validací i automatickým rozbalením volitelných polí a moderačním schvalováním.

---

## Vývoj a testování / Development & Testing

| Příkaz (Command) | Popis (Czech) | Description (English) |
|---|---|---|
| `npm run dev` | Spustí vývojový server na `localhost:5173` | Starts Vite local development server on port 5173 |
| `npm run build` | Sestaví produkční verzi přes Vercel adaptér | Builds production bundle using `@sveltejs/adapter-vercel` |
| `npm run check` | Provede striktní typovou kontrolu (`svelte-check`) | Runs strict TypeScript/JSDoc typechecking |
| `npm run test:unit` | Spustí jednotkové testy (Vitest: `17` souborů, `216` testů) | Runs fast Vitest unit test suite (`17` files, `216` tests) |
| `npm run test:api` | Spustí API integrační testy (`tests/api.spec.ts`) — zkratka z root `package.json` | Runs Playwright API tests (`tests/api.spec.ts`) via root `package.json` shorthand |
| `npm test` | Spustí kompletní Playwright E2E sadu (`18` `*.spec.ts` / `325` testů) | Runs full Playwright end-to-end test suite (`18` specs / `325` tests) |

Aktuální stav migrace na Svelte 5: `23/31` `.svelte` souborů využívá Runes (`$state`, `$derived`, `$props()`, `$effect`), `2` soubory jsou bezstavový Svelte 5 (`src/routes/+error.svelte`, `src/lib/features/home/SanctuaryTeaser.svelte`) a `6` komponent zatím drží starší syntaxi Svelte 4. Pro spuštění konkrétní E2E specifikace (včetně API testů) z `akcelerator-landing-page/` používejte vždy `npm test -- <spec>` (např. `npm test -- tests/api.spec.ts` nebo z kořene `npm --prefix akcelerator-landing-page test -- tests/api.spec.ts`), nikoli holé `npx playwright test`.

---

## Proměnné prostředí / Environment Variables

### 1. Lokální fallback režim (Výchozí, Zero-Config)
Bez nastavení `.env` poběží aplikace plně na lokálních kurátorovaných českých datech v paměti (`akcelerator-landing-page/src/lib/data/`).

### 2. Produkční režim se Supabase (Volitelný)
Zkopírujte šablonu a doplňte klíče z vašeho Supabase projektu:

```bash
cp akcelerator-landing-page/.env.example akcelerator-landing-page/.env
```

| Proměnná | Typ | Popis |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Veřejná (klientská) | URL adresa vašeho projektu v Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Veřejná (klientská) | Veřejný `anon` klíč s aktivním RLS pro veřejné endpointy |
| `SUPABASE_SERVICE_ROLE_KEY` | Privátní (serverová) | Service role klíč vyhrazený pro administrátorskou moderaci (`PATCH /api/submissions`) |
| `MODERATOR_SECRET` | Privátní (serverová) | Tajný klíč hlavičky `x-moderator-secret` pro schvalování a zamítání tipů |
| `IP_HASH_SALT` | Privátní (serverová) | Sůl pro jednosměrné anonymní hashování klientských IP adres (`hashClientKey`) |
| `TEST_BYPASS_SECRET` | Pouze neprodukční testy | Tajemství pro bypass rate-limitu v E2E/CI — **v produkci musí zůstat nenastavené** |
| `PULSE_ALLOW_DEV_WRITES` | Pouze lokální dev testy | Povolí zápisy do `pulse_events` z `localhost` (`1`) — **v produkci nenastavovat** |

Podrobnosti k migracím `0001_initial_schema.sql` a `0002_rls_hardening.sql` i nasazení na Vercel najdete v [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md).

---

## Jak se zapojit / Contributing

Před odesláním Pull Requestu si prosím přečtěte [CONTRIBUTING.md](CONTRIBUTING.md) a pravidla v [AGENTS.md](AGENTS.md) a `.agents/rules/`.

---

## Licence

Otevřená občanská technologie pro každého (záměr šíření pod licencí MIT; samostatný soubor `LICENSE` ani pole `"license"` v `package.json` zatím nejsou v repozitáři přidány).
