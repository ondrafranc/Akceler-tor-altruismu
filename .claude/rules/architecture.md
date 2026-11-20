---
paths:
  - "akcelerator-landing-page/src/**"
  - "akcelerator-landing-page/*.{js,ts,json}"
---

# Architektura `akcelerator-landing-page/src/`

## Vrstvy
Závislosti tečou jedním směrem: `routes` -> `components` / `lib/features` -> `lib` služby a data -> `lib/types`. Doménová logika nepatří do `.svelte` souborů.

| Kde | Co tam patří |
|---|---|
| `src/components/` | Globální komponenty připojené v layoutu: `MollyCompanion`, `MollyDock`, `ImmediateHelp`, `FeedbackModal`, `SmallWinCelebration` |
| `src/lib/components/` | Sdílené stavební prvky (`AppIcon`, `PageHeader`) |
| `src/lib/features/<oblast>/` | Komponenty a služby jedné oblasti (`actions`, `home`, `map`, `sanctuary`) |
| `src/lib/types/` | Kanonické typy. JS moduly se na ně vážou přes JSDoc `@type` |
| `src/lib/storage/` | Jediný přístup k `localStorage` / `sessionStorage`: klíče v `keys.ts`, SSR-safe adaptér s in-memory fallbackem v `index.ts` |
| `src/lib/icons/` | Registr ikon: `lucideIcons.js` (importy), `iconRegistry.js` (jména, `getSvgIconHtml()` pro Leaflet) |
| `src/lib/sensory/`, `src/lib/audio/`, `src/lib/molly/` | Canvas scény, zvuk a renderer Molly; čisté ESM bez vazby na DOM |
| `src/lib/core/device.js` | `isLowPowerDevice`, `prefersReducedMotion`, `safeVibrate`, `frameStep` |
| `src/lib/data/` | Česká data. `czech-actions.js` je jediný povolený barrel |
| `src/lib/server/`, `src/lib/security.js`, `src/lib/validation.js` | Serverová logika a bezpečnost (viz `api-security.md`) |
| `src/lib/` (volné soubory) | `mollyStore.js`, `progress.js`, `analytics.js`, `storyCard.js`, `utils.js` |

Pozor na jména: `src/lib/mollyTypes.js` je datový modul (katalog pamlsků), ne typy. Typy Molly jsou v `src/lib/types/molly.ts`.

## Pravidla modulů
- Každý soubor v `src/lib/` má aktivního konzumenta. Nevytvářej přeposílací fasády ani druhý katalog skutků.
- Novou ikonu přidej do `lucideIcons.js` a `iconRegistry.js`. `vite.config.js` si importy načte sám, ručně ho neupravuj.
- Nové a upravované komponenty používají Svelte 5 Runes (`$props`, `$state`, `$derived`, `$effect`).

## Výkon
- V `requestAnimationFrame` smyčce nikdy nevolej celostránkové `querySelectorAll`, `getBoundingClientRect` ani `getComputedStyle`. Měření dělej mimo smyčku.
- Nepoužívej `background-attachment: fixed`.
- Těžké knihovny (`leaflet`, velké canvas a audio scény) načítej přes `await import(...)`.
- Canvas renderery mají na vstupu null guardy (`if (!ctx || !state) return;`).
- `AudioContext` vzniká až po prvním gestu uživatele a respektuje `isSoundMuted`.

## SvelteKit
- V `src/app.html` jen kořenově absolutní cesty (`/soubor`).
- Změna URL parametrů bez navigace: `goto(..., { replaceState: true, noScroll: true, keepFocus: true })`.
- Před `map.remove()` vždy zavolej `map.stop()`.
- `allowScripts` v `package.json` zůstává pinované na přesnou verzi balíčku.
