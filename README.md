# 🌱 Akcelerátor altruismu

**Česká platforma pro rychlou a praktickou pomoc bez přetížení („agency-first“).**

Navrženo pro chvíle, kdy se člověk cítí zahlcený problémy kolem sebe. Cílem je nabídnout **jeden malý, reálný krok za méně než 60 sekund** — bez registrace, bez výčitek a s okamžitým ukotvením v realitě.

## Architektura a klíčové části (`akcelerator-landing-page/`)

Celá aplikace běží jako jednotná, rychlá **SvelteKit** aplikace:

- **`/` (Rychlý start & hlavní rozcestník)** — Okamžitý přepínač kapacity (*2–5 min z gauče* / *15 min* / *jít ven*), přímý skok do českých měst na mapě, 3 hlavní cesty, uvěřitelné české příběhy a ověřené portály.
- **`/app/guided` (Chytrý průvodce na 60 s)** — Výběr 1–3 témat, času a rozpočtu (`0 Kč` / `Drobný dar`) s okamžitým doporučením nejvhodnějšího kroku a vysvětlením *„Proč právě tohle“*.
- **`/app/online` (Online mikro-kroky)** — Katalog 12+ konkrétních akcí z domova nebo mobilu s 1-klikovými filtry (*Do 5 minut*, *0 Kč*, *Z gauče*, *Online dobrovolnictví*, *Darování*).
- **`/near` (Mapa pomoci v okolí)** — Interaktivní mapa reálných organizací (OpenStreetMap / Overpass + ověřené komunitní tipy ze Supabase + záložní česká místa), chytré řazení podle nejnižšího tření a **asistent prvního kontaktu (*„💬 Co jim napsat?“*)**.
- **`/submit` (Přidat organizaci / akci)** — Jednoduchý formulář pro komunitní tipy s geokódováním a anti-spam ochranou.
- **Globální prvky (`+layout.svelte`)** — Jednotná horní navigace, klidné dokončení kroku s ochranou energie ([`SmallWinCelebration.svelte`](akcelerator-landing-page/src/components/SmallWinCelebration.svelte) — *„🌿 Pro dnešek stačí“*), vždy dostupná krizová opora ([`ImmediateHelp.svelte`](akcelerator-landing-page/src/components/ImmediateHelp.svelte) — *116 111 / 116 123*) a anonymní zpětná vazba.

## Lokální spuštění

```bash
cd akcelerator-landing-page
npm install
npm run dev
```

Produkční build:

```bash
cd akcelerator-landing-page
npm run build
```
