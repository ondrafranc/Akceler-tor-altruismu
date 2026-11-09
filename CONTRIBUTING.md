# Přispívání do projektu / Contributing to Akcelerátor altruismu 🌱

Děkujeme, že pomáháte rozvíjet Akcelerátor altruismu! Tento průvodce slouží k hladkému zapojení nových i stávajících vývojářů a udržení vysokých standardů kvality kódu, přístupnosti a architektonické integrity.

Thank you for your interest in contributing! This guide provides a smooth onboarding path and maintains our bleeding-edge engineering standards, accessibility, and product philosophy.

---

## 🧭 Filozofie produktu / Product Philosophy

Každý kód, komponenta a text v aplikaci musí ctít naše základní principy (viz také [CONCEPT_V2.md](CONCEPT_V2.md)):

1. **Agency first (Podpora vlastní akceschopnosti)**: „Můžeš udělat jeden malý krok“ místo moralizujícího „měl bys pomáhat“.
2. **Ultra-nízké tření (Zero friction)**: Žádné povinné registrace, žádné zdlouhavé dotazníky. Jeden primární krok za méně než 60 sekund.
3. **Ochrana energie (Energy protection)**: Respektujeme únavu a zahlcení. Vždy dáváme uživateli svolení skončit (*„🌿 Pro dnešek stačí“*).
4. **Odolnost a lokální zálohy**: Aplikace nikdy nesmí selhat na bílé obrazovce. Při výpadku externích služeb (Overpass OSM, Supabase) se automaticky přepne na lokální kurátorovaná data (`src/lib/data/`).

---

## ⚡ Rychlý start pro vývojáře (< 2 min)

### Požadavky
- **Node.js**: `>=22.12.0` (doporučujeme Node 24 LTS, repo obsahuje `.nvmrc`)
- **npm** (součást Node.js)
- **Git**

### Krok za krokem
```bash
# 1. Naklonujte repozitář
git clone https://github.com/ondras/akcelerator-altruismu.git
cd "Akcelerátor altruismu"

# 2. Nainstalujte závislosti (automaticky nainstaluje i aplikaci)
npm install

# 3. Spusťte vývojový server
npm run dev
```

Aplikace se spustí na adrese **[http://localhost:5173](http://localhost:5173)**. Aplikace běží v plnohodnotném offline režimu s in-memory českými daty bez potřeby Supabase přihlašovacích údajů.

Pokud chcete lokálně pracovat s databází Supabase, zkopírujte šablonu proměnných prostředí:
```bash
cp akcelerator-landing-page/.env.example akcelerator-landing-page/.env
```
Podrobnosti o databázovém schématu naleznete v [DEPLOYMENT_INSTRUCTIONS.md](DEPLOYMENT_INSTRUCTIONS.md).

---

## 💻 Standardy kódu (Svelte 5 Runes)

Projekt používá **Svelte 5**. Veškerý nový kód a refaktorované komponenty musí striktně dodržovat moderní syntaxi **Svelte Runes**:

### 1. Reaktivní stav (`$state`)
Používejte `$state()` namísto zastaralých `let` proměnných:
```svelte
<script>
  let isExpanded = $state(false);
  let selectedFilter = $state('all');
</script>
```

### 2. Vypočítané hodnoty (`$derived`)
Namísto zastaralé syntaxe `$: foo = bar * 2` používejte `$derived()`:
```svelte
<script>
  let count = $state(0);
  let double = $derived(count * 2);
  let isPositive = $derived(count > 0);
</script>
```

### 3. Vlastnosti komponent (`$props()`)
Namísto zastaralého `export let title` používejte destrukturované typované `$props()`:
```svelte
<script>
  /**
   * @type {{
   *   action: import('$lib/data/micro-actions.js').MicroAction,
   *   onComplete?: () => void,
   *   variant?: 'compact' | 'full'
   * }}
   */
  let { action, onComplete, variant = 'full' } = $props();
</script>
```

### 4. Vedlejší efekty (`$effect`)
`$effect()` používejte s rozvahou pouze pro synchronizaci s vnějším světem (DOM, Web Audio, LocalStorage). Nikdy nepoužívejte `$effect` pro výpočet stavu, který lze odvodit pomocí `$derived`.

### 🚫 Zakázané zastaralé vzory
- ❌ Žádné `export let propName;` (nahrazeno `$props()`)
- ❌ Žádné `$: statement;` (nahrazeno `$derived` nebo explicitními handlery)
- ❌ Žádné `writable()` / `readable()` Svelte stores v nových komponentách (nahrazeno `$state`)

---

## 🌿 Konvence commitů (Conventional Commits)

Commit zprávy musí následovat standard [Conventional Commits](https://www.conventionalcommits.org/):

```text
<typ>(<volitelný rozsah>): <popis v přítomném čase>
```

### Povolené typy:
- `feat:` — nová uživatelská funkce nebo schopnost (např. `feat(map): add category filter for animal shelters`)
- `fix:` — oprava chyby (např. `fix(audio): handle iOS autoplay policy gracefully`)
- `docs:` — změna dokumentace (např. `docs: update onboarding guide with devcontainer instructions`)
- `test:` — přidání nebo oprava testů (např. `test(actions): add unit tests for recommendation engine`)
- `refactor:` — úprava kódu bez změny chování či API (např. `refactor(data): split czech-actions into atomic modules`)
- `chore:` — úpravy build nástrojů, závislostí a konfigurace (např. `chore: upgrade svelte-check to 4.7.8`)

---

## 🔍 Lokální kontrola před odesláním PR (Verification)

Před otevřením Pull Requestu ověřte, že všechny automatizované kontroly procházejí:

```bash
# 1. Typová kontrola (musí projít s 0 chybami a 0 varováními)
npm run check

# 2. Bleskové jednotkové testy (Vitest)
npm run test:unit

# 3. Produkční sestavení aplikace
npm run build

# 4. Volitelně: integrační testy API endpointů (Playwright)
npm run test:api
```

### Checklist kvality pro autory změn:
- [ ] Všechny testy a typové kontroly procházejí (`npm run check` && `npm run test:unit` && `npm run build`).
- [ ] Žádné tajné klíče ani lokální `.env` soubory nejsou zahrnuty v commitu.
- [ ] Responzivita a mobilní zobrazení: ověřeno na malých displejích (touch targets minimálně 44×44 px, kontrast textu minimálně 4.5:1).
- [ ] Aktualizace relevantní dokumentace a záznam v [CHANGELOG.md](CHANGELOG.md).

---

## 🚀 Životní cyklus Pull Requestu

1. Vytvořte si větev z větve `main`:
   ```bash
   git checkout -b feat/nazev-vasi-funkce
   ```
2. Proveďte změny v souladu s pravidly.
3. Zkontrolujte kód pomocí výše uvedených příkazů.
4. Zapište změny pomocí Conventional Commits a pushněte do svého forku.
5. Otevřete Pull Request. Naše šablona PR vás automaticky provede finálním kontrolním seznamem.
6. Automatizované CI na GitHub Actions ověří typovou správnost, testy i produkční build.

Máte-li otázky nebo nápad k diskuzi, neváhejte otevřít GitHub Issue! Těšíme se na vaše příspěvky.
