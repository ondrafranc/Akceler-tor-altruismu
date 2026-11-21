# Přispívání do projektu / Contributing to Akcelerátor altruismu

Děkujeme, že pomáháte rozvíjet Akcelerátor altruismu. Tento průvodce shrnuje produktovou filozofii, standardy kódu a ověřovací postup před otevřením Pull Requestu.

---

## Filozofie produktu a hlavní severka

Hlavní severka produktu zní: **„Pomáhat pomáhat – a udělat pomáhání tak snadné jako masturbovat.“**
Globální pravidla jsou v [AGENTS.md](AGENTS.md), pravidla jednotlivých oblastí v `.claude/rules/`. Každá změna musí ctít:

1. **Okamžitost a krása (*Daylight Editorial*)**: Žádné stěny filtrů, uvítací plakáty ani morální kázání nad hlavní kartou na `/`.
2. **Ultra-nízké tření**: Žádné registrace ani hold-to-confirm smyčky — jeden konkrétní krok jedním kliknutím.
3. **Nulový manipulativní šum**: Žádná FOMO oznámení sociálního nátlaku ani nativní Unicode emoji (veškeré ikony běží přes `@lucide/svelte` v `src/lib/icons/`).
4. **Odolnost při výpadku**: Při nedostupnosti Supabase nebo geokódování Nominatim (OpenStreetMap) aplikace plynule přechází na lokální česká data (`src/lib/data/`).

---

## Rychlý start pro vývojáře (< 2 min)

### Požadavky
- **Node.js**: `24` LTS (viz `akcelerator-landing-page/.nvmrc` a `runtime: 'nodejs24.x'` v `akcelerator-landing-page/svelte.config.js`)
- **npm** (součást Node.js 24)
- **Git**

### Postup
```bash
git clone https://github.com/ondrafranc/Akceler-tor-altruismu.git
cd Akceler-tor-altruismu

# Kořen nemá vlastní závislosti; postinstall nainstaluje akcelerator-landing-page/
npm install

# Spustí vývojový server na http://localhost:5173
npm run dev
```

Pro volitelné napojení na Supabase zkopírujte šablonu:
```bash
cp akcelerator-landing-page/.env.example akcelerator-landing-page/.env
```
Databázové migrace a bezpečnostní nastavení jsou popsány v [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md).

---

## Standardy kódu (SvelteKit 2 + Svelte 5)

### Politika Svelte 5 Runes
- Veškeré **nové a refaktorované** `.svelte` komponenty musí používat **Svelte 5 Runes** (`$state`, `$derived`, `$props()`, `$effect`).
- Zbývající komponenty se starší syntaxí Svelte 4 se migrují při své úpravě. Jejich seznam hlídá `tests/unit/invariants.test.js` a smí se jen zkracovat — do upravovaných souborů staré vzory nepřidávejte.

### Příklad typované Runes komponenty (`"checkJs": true`)
```svelte
<script>
  /**
   * @type {{
   *   action: import('$lib/types/deed').MicroAction,
   *   onComplete?: () => void,
   *   variant?: 'compact' | 'full'
   * }}
   */
  let { action, onComplete, variant = 'full' } = $props();

  let isExpanded = $state(false);
  let hasDetails = $derived(Boolean(action.steps?.length));
</script>
```

### Další technická pravidla
- Kanonické TypeScript typy žijí v `akcelerator-landing-page/src/lib/types/` (`deed.ts`, `sensory.ts`, `molly.ts`, `progress.ts`, `api.ts`, `storage.ts`). V `src/` nepoužívejte `any` ani `@ts-ignore`.
- Veškeré čtení/zápis do `localStorage` / `sessionStorage` musí používat konstanty z `src/lib/storage/keys.ts` a adaptér `src/lib/storage/index.ts`.
- Nové ikony přidejte do `src/lib/icons/lucideIcons.js` a `src/lib/icons/iconRegistry.js` — `vite.config.js` si je do `optimizeDeps.include` načítá automaticky.
- Nevytvářejte duplicitní katalogy karet ani přechodové forwarder moduly.
- Pravidlo, které lze ověřit strojově, patří do `tests/unit/invariants.test.js`, ne do textu.
- V editoru používejte TypeScript z pracovního prostoru. `jsconfig.json` má `"strict": true` a kontroluje i JS soubory; nový kód typujte přes JSDoc nebo kanonické typy z `src/lib/types/`.

---

## Konvence commitů (Conventional Commits)

```text
<typ>(<volitelný rozsah>): <popis v přítomném čase>
```

Povolené typy: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`.

---

## Lokální kontrola před odesláním PR (Verification)

Z kořene repozitáře nebo z `akcelerator-landing-page/` ověřte:

```bash
# 1. Typová kontrola (musí projít s 0 chybami a 0 varováními)
npm run check

# 2. Jednotkové testy a invarianty repozitáře (Vitest)
npm run test:unit

# 3. Produkční sestavení aplikace
npm run build

# 4. E2E testy Playwright — specifikace, kterých se změna týká (viz tabulka v .claude/skills/ship/SKILL.md)
cd akcelerator-landing-page
npm test -- tests/api.spec.ts
```

### Checklist kvality pro autory změn
- [ ] `npm run check`, `npm run test:unit` a `npm run build` procházejí bez chyb a varování.
- [ ] Relevantní Playwright E2E specifikace spuštěné přes `npm test -- <spec>` procházejí.
- [ ] Nové či upravené komponenty používají Svelte 5 Runes a neobsahují `any` ani `@ts-ignore`.
- [ ] V UI, datech ani dokumentaci nejsou žádné nativní Unicode emoji.
- [ ] Ověřeno na desktopu i úzkém mobilu (`360×800` / `375×667`, dotykové plochy `>= 44×44 px`, formulářová pole `>= 16 px`).
- [ ] Žádné tajné klíče ani `.env` soubory nejsou zahrnuty v commitu.
- [ ] Změna chování je zapsaná v [CHANGELOG.md](CHANGELOG.md); pravidla v `AGENTS.md` a `.claude/rules/` se mění jen při změně invariantu (žádné počty, pixelové hodnoty ani historie).
