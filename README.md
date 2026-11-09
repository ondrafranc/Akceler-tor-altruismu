# 🌱 Akcelerátor altruismu

[![Node.js](https://img.shields.io/badge/node-%3E%3D22.12.0-brightgreen.svg)](https://nodejs.org/)
[![SvelteKit](https://img.shields.io/badge/SvelteKit-2.x-orange.svg)](https://kit.svelte.dev/)
[![Svelte 5](https://img.shields.io/badge/Svelte-5_Runes-FF3E00.svg)](https://svelte.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#licence)
[![Zero Config](https://img.shields.io/badge/quickstart-%3C2_min-purple.svg)](#rychlý-start--quickstart--2-min)

---

### 🇨🇿 O projektu (Czech)
**Česká otevřená platforma pro okamžitou pomoc bez přetížení a výčitek („agency-first“).**

Navrženo pro lidi prožívající klimatický žal, zahlcení zprávami, apatii nebo bezmoc. Naším cílem je nabídnout **jeden konkrétní, zvládnutelný krok za méně než 60 sekund** — bez nutnosti registrace, bez moralizování a s respektem k lidské energii (*„🌿 Pro dnešek stačí“*).

### 🇬🇧 Overview (English)
**An open-source Czech civic platform delivering immediate, friction-free agency for people experiencing news overwhelm, climate anxiety, or civic helplessness.**

Designed for high-overwhelm, low-energy moments. The core mission is to provide **one tangible, real-world micro-step in under 60 seconds** — zero required registration, zero guilt-tripping, and built-in energy protection.

---

## ⚡ Rychlý start / Quickstart (< 2 min)

Aplikace funguje **okamžitě bez jakýchkoliv externích API klíčů či databází** díky vestavěným in-memory českým datovým sadám a inteligentním fallbackům.

### 1. Klonování a instalace / Clone & Install
```bash
git clone https://github.com/ondras/akcelerator-altruismu.git
cd "Akcelerátor altruismu"

# Nainstaluje závislosti v rootu i v aplikaci
npm install
```

### 2. Spuštění vývojového serveru / Start Dev Server
```bash
npm run dev
```

Otevřete v prohlížeči **[http://localhost:5173](http://localhost:5173)**. Aplikace je plně funkční!

> **Tip:** Všechny příkazy lze spouštět přímo z kořenového adresáře repozitáře díky root proxy skriptům, případně s přepínačem `npm --prefix akcelerator-landing-page run <skript>`.

---

## 🏛️ Architektura a mentální model / Architecture & Mental Model

Projekt přechází na čistou **doménově řízenou architekturu (Feature-Driven / Domain-Driven Modularization)** se striktním oddělením vrstev:

```text
Akcelerátor altruismu/
├── package.json                         # Kořenová orchestrace a proxy skripty pro vývojáře
├── CONTRIBUTING.md                      # Průvodce pro přispěvatele (Svelte 5 runes, PR workflow)
├── README.md                            # Přehled architektury, quickstart a reference
├── DEPLOYMENT_INSTRUCTIONS.md           # Návod na produkční nasazení (Vercel & Supabase SQL)
├── CONCEPT_V2.md                        # Filozofie produktu a principy uživatelského zážitku
├── .devcontainer/                       # Kontejnerizované prostředí (Node.js 22 Bookworm)
├── .github/                             # CI workflow (GitHub Actions) a šablony pro PR / Issues
└── akcelerator-landing-page/            # SvelteKit aplikace
    ├── src/
    │   ├── lib/
    │   │   ├── core/                    # Bezpečnost, sanitizace vstupů, detekce zařízení
    │   │   ├── audio/                   # Čistý Web Audio API syntezátor (zvukové kotvy, ASMR)
    │   │   ├── data/                    # Atomické české datové sady (hodnoty, města, akce)
    │   │   │   └── czech-actions.js     # Zpětně kompatibilní exportní barrel
    │   │   ├── features/                # Doménové moduly a komponenty
    │   │   │   ├── actions/             # ActionCard, EvidenceBadge, HoldSparkButton
    │   │   │   ├── map/                 # LeafletMap, PlaceCard, FirstContactModal
    │   │   │   ├── sanctuary/           # Plátno Krajiny Dobra, dechový pacer, rituální lišta
    │   │   │   ├── companion/           # Kočka Molly (procedurální animace, pohlazení)
    │   │   │   ├── guided/              # 60s průvodce výběrem situace a doporučení
    │   │   │   └── pulse/               # Klient tepu komunitní aktivity (ambient pulse)
    │   │   └── components/              # Globální komponenty (Navigace, Footer, Modály)
    │   └── routes/                      # Štíhlé SvelteKit routy
    │       ├── +page.svelte             # Úvodní rozcestník s přepínačem kapacity
    │       ├── near/+page.svelte        # Interaktivní mapa pomoci v ČR
    │       ├── svet/+page.svelte        # Krajina Dobra a mezinárodní pomoc
    │       ├── submit/+page.svelte      # Komunitní formulář pro přidání organizace/akce
    │       ├── app/guided/+page.svelte  # 60s průvodce doporučením kroku
    │       ├── app/online/+page.svelte  # Katalog online mikro-akcí
    │       └── api/                     # Backendové endpointy (/nearby, /geocode, /pulse)
    └── tests/                           # Vitest jednotkové testy a Playwright E2E testy
```

### Hlavní trasy aplikace (Routes)
1. **`/` (Úvodní rozcestník)** — Okamžitá volba kapacity (*2–5 min z gauče* / *15 min* / *jít ven*), ověřené české organizace a rychlé portály.
2. **`/near` (Mapa pomoci v okolí)** — Reálná místa pomoci (OpenStreetMap / Overpass API) se záložními českými daty a asistentem prvního kontaktu (*„Co jim napsat?“*).
3. **`/app/guided` (Chytrý průvodce na 60 s)** — Rychlý výběr situace, času a rozpočtu s okamžitým doporučením a vysvětlením *„Proč právě tohle“*.
4. **`/app/online` (Online mikro-kroky)** — Katalog konkrétních akcí z domova či mobilu filtrovatelných podle času a náročnosti.
5. **`/svet` (Krajina Dobra)** — Zklidňující prostor pro reflexi dobrých skutků, dechové cvičení a mezinárodní pomoc.
6. **`/submit` (Přidat organizaci)** — Komunitní formulář s automatickým geokódováním a ochranou proti spamu.

---

## 🛠️ Vývoj a testování / Development & Testing

Díky kořenovým skriptům můžete provádět veškeré úkony přímo z kořene repozitáře:

| Příkaz (Command) | Popis (Czech) | Description (English) |
|---|---|---|
| `npm run dev` | Spustí vývojový server na `localhost:5173` | Starts Vite local development server on port 5173 |
| `npm run build` | Sestaví produkční verzi přes SvelteKit adaptér | Builds production bundle using `@sveltejs/adapter-vercel` |
| `npm run check` | Provede striktní kontrolu typů (`svelte-check`) | Runs strict TypeScript/JSDoc typechecking |
| `npm run test:unit` | Spustí bleskové jednotkové testy (Vitest, <500 ms) | Runs ultra-fast Vitest unit test suite (<500 ms) |
| `npm run test:api` | Spustí integrační Playwright testy API endpointů | Runs fast Playwright integration tests for API routes |
| `npm test` | Spustí kompletní Playwright E2E testy | Runs full Playwright end-to-end test suite |

---

## 🔐 Proměnné prostředí / Environment Variables

Aplikace podporuje dva režimy:

### 1. Lokální fallback režim (Výchozí, Zero-Config)
Nemusíte nastavovat žádné `.env` proměnné. Všechny funkce (mapa, doporučovací algoritmus, online kroky, komunitní tep) běží na lokálních kurátorovaných českých datech v paměti (`src/lib/data/`).

### 2. Produkční režim se Supabase (Volitelný)
Pokud chcete trvale ukládat anonymní zpětnou vazbu a schvalovat komunitní tipy na organizace, zkopírujte šablonu:

```bash
cp akcelerator-landing-page/.env.example akcelerator-landing-page/.env
```

| Proměnná | Typ | Popis |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Veřejná (klientská) | URL adresa vašeho projektu v Supabase |
| `PUBLIC_SUPABASE_ANON_KEY` | Veřejná (klientská) | Anonymní veřejný klíč Supabase s nastaveným RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Privátní (serverová) | *Volitelné:* Service role klíč pro administrátorské zásahy |
| `SUPABASE_URL` | Privátní (serverová) | *Volitelné:* Serverová URL adresa Supabase |

Podrobnosti k nastavení databázových tabulek a bezpečnostních pravidel (Row Level Security) naleznete v [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md).

---

## 🤝 Jak se zapojit / Contributing

Uvítáme jakékoliv návrhy, opravy chyb či rozšíření ověřených českých organizací! Před odesláním Pull Requestu si prosím přečtěte našeho průvodce přispíváním:

👉 **[Pravidla pro přispěvatele (CONTRIBUTING.md)](CONTRIBUTING.md)**

Pravidla shrnují:
- Standardy psaní kódu v **Svelte 5 Runes** (`$state`, `$derived`, `$props()`).
- Formátování commitů podle **Conventional Commits** (`feat:`, `fix:`, `docs:`, `test:`).
- Lokální kontrolu před odesláním PR (`npm run check` && `npm run test:unit` && `npm run build`).

---

## 📄 Licence

Tento projekt je šířen pod licencí MIT. Otevřená občanská technologie pro každého.
