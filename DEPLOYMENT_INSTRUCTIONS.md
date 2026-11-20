# Nasazení a databáze (Deployment & Supabase Guide)

Aplikace **Akcelerátor altruismu** je postavená na **SvelteKitu 2 + Svelte 5** (`akcelerator-landing-page/`) s cílovým runtime **Node.js 24 (`nodejs24.x`)**. Bez připojené databáze běží plně nad lokálními kurátorovanými českými daty; po připojení Supabase ukládá zpětnou vazbu, komunitní tipy (`/submit` -> `/near`) a anonymní události pulzu do PostgreSQL.

---

## 1. Nasazení na Vercel (Dual `vercel.json` parita)

Repozitář udržuje dva synchronizované konfigurační soubory pro Vercel podle toho, odkud projekt nasazujete:

- **Kořen repozitáře (`vercel.json`)** — používá se při nasazení z kořene (`Root Directory` ponecháno prázdné / `.`). Spouští `cd akcelerator-landing-page && npm ci && npm run build` a kopíruje `.vercel/output`.
- **Aplikační adresář (`akcelerator-landing-page/vercel.json`)** — používá se, pokud je ve Vercel Project Settings nastaven **Root Directory: `akcelerator-landing-page`** (`framework: "sveltekit"`).

Obě konfigurace musí mít shodné pole `headers` (bezpečnostní i `Cache-Control` hlavičky); shodu hlídá `tests/unit/invariants.test.js`. Jakmile je jisté, které nastavení Root Directory projekt ve Vercelu používá, druhý soubor lze odstranit.

### Nastavení projektu ve Vercelu
1. **Node.js Version**: `24.x` (shodně s `akcelerator-landing-page/.nvmrc` a `runtime: 'nodejs24.x'` v `akcelerator-landing-page/svelte.config.js`).
2. **Build & Output**:
   - Při Root Directory `akcelerator-landing-page`: Framework `SvelteKit`, Build Command `npm run build`, Install Command `npm install`.
   - Při Root Directory `.`: Build Command z kořenového `vercel.json`.

---

## 2. Proměnné prostředí (Environment Variables)

Nastavte v **Vercel Project Settings -> Environment Variables**:

| Proměnná | Prostředí | Popis |
|---|---|---|
| `PUBLIC_SUPABASE_URL` | Production, Preview | URL adresa Supabase projektu (`https://<projekt>.supabase.co`) |
| `PUBLIC_SUPABASE_ANON_KEY` | Production, Preview | Veřejný `anon` klíč používaný `getServerSupabase()` s aktivním RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Privátní serverový klíč pro `getAdminSupabase()` v `PATCH /api/submissions` |
| `MODERATOR_SECRET` | Production, Preview | Silné tajemství pro hlavičku `x-moderator-secret` při moderaci tipů |
| `IP_HASH_SALT` | Production, Preview | Stabilní tajná sůl pro anonymizaci IP adres (`hashClientKey`) |
| `TEST_BYPASS_SECRET` | **V Production nenastavovat** | Pouze pro neprodukční CI/E2E bypass rate-limitu |
| `PULSE_ALLOW_DEV_WRITES` | **V Production nenastavovat** | Pouze pro lokální testování zápisu do `pulse_events` (`1`) |

### Důležitá bezpečnostní hygiena
- Legacy název proměnné `API Key` se v kódu již nepoužívá (`resolveSupabaseConfig()` v `src/lib/server/supabase.js`) — z Vercelu jej odstraňte, pokud tam zůstal ze starší konfigurace.
- `TEST_BYPASS_SECRET` a `PULSE_ALLOW_DEV_WRITES` musí v **Production** zůstat zcela nenastavené; `isAuthorizedTestBypass(request)` při `VERCEL_ENV === 'production'` bezpodmínečně vrací `false`.
- Chování endpointů, rate-limity, CSP a cache hlavičky popisuje `.claude/rules/api-security.md`; ověřují je `tests/security.spec.ts` a `tests/api.spec.ts`.

---

## 3. Databázové schéma a migrace Supabase (`supabase/migrations/`)

Jediným zdrojem pravdy pro PostgreSQL schéma jsou dvě sekvenční migrace v `supabase/migrations/`:

1. **`supabase/migrations/0001_initial_schema.sql`**
   - Vytváří rozšíření `pgcrypto` a tabulky `feedback`, `community_submissions` a `pulse_events` včetně základních indexů a RLS politik pro `anon` a `service_role`.
2. **`supabase/migrations/0002_rls_hardening.sql`** *(povinná bezpečnostní migrace)*
   - Přidává sloupce `event_start` a `event_end` do `community_submissions`.
   - Odebírá plošný `SELECT` rolím `anon, authenticated` na `community_submissions` a uděluje výhradně **sloupcový `SELECT` bez `ip_hash`**.
   - Vynucuje délkové `CHECK` limity textových polí, kontrolu data akce (`event_end >= event_start`) a geografické hranice ČR (`lat BETWEEN 48.0 AND 51.5`, `lon BETWEEN 11.5 AND 19.5`).
   - Zpřísňuje `INSERT` politiku pro `feedback` (`status = 'new'`, `char_length(message) BETWEEN 1 AND 1500`).
   - Zpřísňuje `pulse_events` na 24hodinové okno pro veřejné čtení a délku `action_id` / `city`.

### Postup inicializace nebo aktualizace vzdálené databáze
1. Na nové databázi spusťte v **Supabase SQL Editoru** nejprve `supabase/migrations/0001_initial_schema.sql` a ihned poté `supabase/migrations/0002_rls_hardening.sql` (případně použijte `supabase db push` přes Supabase CLI).
2. Při aplikaci `0002_rls_hardening.sql` na existující produkční databázi nejprve zkontrolujte případné starší záznamy mimo rozsahy nové migrace (např. `lat`/`lon` mimo ČR nebo dlouhé texty v `community_submissions` / `pulse_events`), aby `ALTER TABLE ... ADD CONSTRAINT` prošlo čistě.

---

## 4. Checklist vzdáleného nasazení a smoke-testů (Remote-Only Verification)

Po nasazení na Vercel ověřte produkční/preview doménu:
- [ ] `GET /` vrací `200`, hlavičku `Content-Security-Policy` s unikátním nonce při každém načtení a `Cache-Control: private, no-cache, no-store, must-revalidate`.
- [ ] `GET /api/test-supabase` na Vercel Production a Preview (bez `TEST_BYPASS_SECRET`, který musí v Production zůstat nenastavený) záměrně vrací HTTP `404` s `Cache-Control: no-store` (`{ "success": false, "error": "Not found" }`); při povoleném bypassu mimo Production je `GET` limitován na `20/60s`.
- [ ] `GET /api/feedback` slouží jako živý health-check napojení na Supabase a vrací `{ "success": true, "status": "ok" }` (HTTP `200`, případně `503`, pokud databáze není nakonfigurována).
- [ ] `GET /api/community-nearby?lat=50.08&lon=14.43` vrací schválené komunitní položky bez pole `ip_hash`.
- [ ] `POST /api/feedback` a `POST /api/submissions` ukládají záznam se stavem `new` / `pending`; `PATCH /api/submissions` bez platného `x-moderator-secret` vrací `401` (s platným tajemstvím a `SUPABASE_SERVICE_ROLE_KEY` aktualizuje status).
- [ ] Na mobilním viewportu (`360×800`, `375×667`) i desktopu (`1440×900`) se čistě načítá `/`, `/near`, `/svet`, `/app/guided`, `/app/online` a `/submit` bez konzolových či CSP chyb.
