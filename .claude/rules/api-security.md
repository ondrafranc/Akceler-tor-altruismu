---
paths:
  - "akcelerator-landing-page/src/routes/api/**"
  - "akcelerator-landing-page/src/lib/server/**"
  - "akcelerator-landing-page/src/lib/security.js"
  - "akcelerator-landing-page/src/lib/validation.js"
  - "akcelerator-landing-page/src/hooks.server.js"
  - "akcelerator-landing-page/svelte.config.js"
  - "akcelerator-landing-page/tests/**/*security*"
  - "akcelerator-landing-page/tests/api.spec.ts"
  - "akcelerator-landing-page/vercel.json"
  - "supabase/**"
---

# API, databáze a bezpečnost

Ověření: `npm test -- tests/security.spec.ts tests/api.spec.ts` a unit testy `security.test.js`, `m2-security.test.js`.

## Databáze a Supabase klienti
- Schéma určují jen migrace v `supabase/migrations/`. Sloupce použité v `src/routes/api/**` jim musí přesně odpovídat. Existující migraci neupravuj, přidej novou.
- `getServerSupabase()` je veřejný `anon` klient pod RLS. Role `anon` a `authenticated` mají na `community_submissions` jen sloupcový `SELECT` bez `ip_hash`; `ip_hash` nesmí opustit server.
- `getAdminSupabase()` (service role) se používá jen pro moderaci a nikdy nepadá zpět na `anon`.
- Cache klientů se klíčuje přes SHA-256 `buildClientCacheKey(role, url, key)`, nikdy přes výřez z JWT.

## Identita klienta a tajemství
- `resolveClientKey(request, getClientAddress)` věří `x-vercel-forwarded-for` (na Vercelu) a non-loopback `getClientAddress()` dřív než podvrhnutelným `cf-connecting-ip` / `x-forwarded-for`.
- Tajemství se porovnávají jen přes `safeCompareTokens` (constant-time nad SHA-256 digesty).
- `isAuthorizedTestBypass(request)` v produkci (`VERCEL_ENV === 'production'`) vždy vrací `false`. `TEST_BYPASS_SECRET` nemá hardcodovaný fallback a obcházení přes `User-Agent` neexistuje.

## Endpointy
- Odpovědi API nesou `Cache-Control: no-store`, pokud nejsou záměrně cachovatelné. Chybové a záložní (`fallback: true`) odpovědi se necachují nikdy.
- **Mutace** procházejí `validateMutationOrigin` (při `sec-fetch-site: same-site` je vyžadován odpovídající `Origin`) a `readJsonBodyBounded`.
- Každý soubor endpointu používá `checkRateLimit`; nový endpoint ho dostane také. Při překročení vrací `429` s `Retry-After`.
- `PATCH /api/submissions`: ověření `x-moderator-secret` běží **před** `resolveClientKey` i rate-limitem; dál vyžaduje `Content-Type: application/json` a platné UUID.
- `POST /api/pulse`: `actionId` se validuje proti katalogu `MICRO_ACTIONS` a povoleným prefixům, `city` se ořezává; délky se počítají v code pointech.
- `/api/test-supabase`: mimo lokální vývoj vrací `404`, pokud neprojde `isAuthorizedTestBypass`.
- `/api/geocode`: fronta má strop čekání (`MAX_QUEUE_WAIT_MS`); při přetečení vrací necachované `503` s `Retry-After`, aby se chyba nedostala do cache.
- Chybové odpovědi neobsahují interní zprávy, stack ani názvy proměnných prostředí.

## CSP a hlavičky
- `svelte.config.js` používá `csp.mode: 'auto'` (nonce na každý požadavek). Proto `hooks.server.js` vrací na SSR HTML (`GET` i `HEAD`) `Cache-Control: private, no-cache, no-store, must-revalidate` a `Pragma: no-cache`. Veřejné `s-maxage` na HTML by sdílelo jeden nonce mezi uživateli.
- Nový externí zdroj (skript, dlaždice, API) vyžaduje úpravu CSP direktiv; nepřidávej domény, které kód nepoužívá.
- Statické bezpečnostní a cache hlavičky jsou v `akcelerator-landing-page/vercel.json` (jediná Vercel konfigurace; Root Directory projektu je `akcelerator-landing-page`).

## Proměnné prostředí
- Šablona je `akcelerator-landing-page/.env.example`. Novou proměnnou přidej tam a do `DEPLOYMENT_INSTRUCTIONS.md`.
- `TEST_BYPASS_SECRET` a `PULSE_ALLOW_DEV_WRITES` se v produkci nenastavují.
