# Technický audit codebase

## 1. Kritické vady (CRITICAL)

### Nález 1: Pád navigace service workeru po 2,5 s a poškození hydratace při fallbacku na root cache
- **Soubor a řádky**: `akcelerator-landing-page/src/service-worker.js:5-7, 55-79`
- **Popis a scénář selhání**:
  Service worker v obsluze události `fetch` zavádí pro všechny navigační požadavky (`isNavigate`) striktní časový limit 2 500 ms přes `setTimeout(() => controller.abort(), 2500)`. Na mobilním připojení s vyšší latencí (např. 3G nebo slabý signál v terénu) nebo při studeném startu (cold start) bezserverových funkcí překročí odezva první navigace 2,5 sekundy. `AbortController` navigaci násilně ukončí.
  V bloku `catch` následně kód provede:
  ```javascript
  const cached =
    (await cache.match(event.request)) ||
    (isNavigate ? (await cache.match(url.pathname)) || (await cache.match('/')) : null);
  if (cached) return cached;
  throw err;
  ```
  Jelikož pole `PRECACHE_ASSETS` obsahuje pouze statické ikony (`favicon.svg`, `icon-192.png` atd.) a necachuje HTML stránky, není cílová trasa (např. `/near` nebo `/submit`) v mezipaměti. Kód proto sáhne po `await cache.match('/')` – HTML domovské stránky. Prohlížeč obdrží SSR HTML domovské stránky pod adresou `/near`. Klientský směrovač SvelteKit se pokusí hydratovat komponentu `/near` proti cizímu DOM stromu hlavní stránky, což vyvolá fatální selhání hydratace a rozhraní zcela zamrzne. Pokud navíc uživatel přišel na web poprvé a v mezipaměti nemá ani `/`, kód provede `throw err`, což v prohlížeči vyústí v nativní chybovou obrazovku pádu sítě (`ERR_FAILED`).
- **Konkrétní návrh opravy**:
  1. Odstranit umělý 2,5s abort limit pro navigační požadavky a ponechat síťovému spojení standardní systémový timeout prohlížeče (případně nastavit limit minimálně na 12–15 sekund).
  2. Zrušit fallback na kořenovou cestu `/` pro libovolné jiné URL cesty, aby nedocházelo k rozpadu hydratace.
  3. **Důležité prerekvizitní upozornění**: Zavedení vyhrazené offline stránky `/offline.html` do pole `PRECACHE_ASSETS` striktně vyžaduje nejprve vytvořit fyzický soubor `akcelerator-landing-page/static/offline.html`. Dle specifikace W3C Cache API selhává metoda `cache.addAll()` atomicky – pokud jediný soubor vrátí HTTP 404, celá instalace service workeru okamžitě havaruje a do mezipaměti se neuloží žádný soubor.
  ```javascript
  // akcelerator-landing-page/src/service-worker.js
  // POZNÁMKA: Soubor static/offline.html musí existovat před zařazením do pole!
  const PRECACHE_ASSETS = [
    '/manifest.webmanifest',
    '/favicon.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/offline.html'
  ];

  // V obsluze fetch:
  const controller = isNavigate ? new AbortController() : null;
  const navTimer = controller ? setTimeout(() => controller.abort(), 12000) : null;

  try {
    const response = await fetch(
      event.request,
      controller ? { signal: controller.signal } : undefined
    );
    if (navTimer) clearTimeout(navTimer);
    if (response && response.status === 200 && response.type === 'basic') {
      const keys = await cache.keys();
      if (keys.length >= MAX_CACHE_ENTRIES && keys[0]) {
        await cache.delete(keys[0]);
      }
      cache.put(event.request, response.clone());
    }
    return response;
  } catch (err) {
    if (navTimer) clearTimeout(navTimer);
    const cached =
      (await cache.match(event.request)) ||
      (isNavigate ? await cache.match(url.pathname) : null);
    if (cached) return cached;
    if (isNavigate) {
      const offlinePage = await cache.match('/offline.html');
      if (offlinePage) return offlinePage;
    }
    throw err;
  }
  ```

---

### Nález 4: Odmítání legitimních odeslání formuláře kvůli časovému posunu (clock skew) klienta a serveru
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/submissions/+server.js:74-77`, `akcelerator-landing-page/src/routes/submit/+page.svelte:40-41, 143`
- **Popis a scénář selhání**:
  Při otevření formuláře `/submit` klient zaznamená svůj lokální wall-clock čas:
  ```javascript
  // submit/+page.svelte:41
  const startedAt = Date.now();
  ```
  Při odeslání je hodnota `startedAt` předána v těle JSONu na server. Server provádí validaci proti botům:
  ```javascript
  // api/submissions/+server.js:74-77
  const startedAt = toFiniteNumber(body.started_at);
  if (startedAt && Date.now() - startedAt < 1000) {
    return json({ success: false, error: 'Formulář byl odeslán příliš rychle.' }, { status: 400 });
  }
  ```
  Tato kontrola předpokládá synchronizovaný čas mezi zařízením uživatele a serverem. V reálném provozu mají klientské mobilní telefony hodiny běžně posunuté o 1 až 5 sekund dopředu oproti NTP serveru Vercelu.
  Tento nesoulad neohrožuje uživatele, který formulář vyplňuje několik minut (kde serverový rozdíl `Date.now() - startedAt` činí desítky tisíc milisekund), ale fatálně dopadá na rychlá odeslání a na uživatele využívající automatické doplňování prohlížeče (browser autofill). Pokud uživatel formulář vyplní za 2–4 sekundy a jeho mobilní telefon předbíhá server o 3 sekundy, je klientský `startedAt` vyšší než serverový `Date.now()`. Rozdíl `Date.now() - startedAt` je záporné číslo (např. `-1000`). Jelikož záporné číslo je menší než `1000`, server legitimního člověka falešně označí za bota, požadavek zamítne s chybou HTTP 400 a uživateli zabrání v odeslání pomoci.
- **Konkrétní návrh opravy**:
  Klientský wall-clock čas `started_at` je nespolehlivý a bot jej může snadno zfalšovat (odesláním hodnoty z minulosti nebo vynecháním pole). Pro spolehlivou ochranu je nutné:
  1. Použít serverem generovaný podepsaný časový token (HMAC s časovým razítkem serveru vystavený při načtení formuláře do skrytého pole nebo cookie), u kterého server počítá dobu výhradně podle svých vlastních hodin.
  2. Jako primární protibotovou ochranu ponechat skrytý honeypot (`body.hp`) a IP rate limiting. Pokud se jako doplňková telemetrie použije klientský čas, měřit relativní monotónní interval přes `performance.now()` odeslaný jako celkový počet milisekund strávených na stránce, a odmítat pouze prokazatelně strojové dotazy bez chybné blokace uživatelů při posunu hodin.
  ```javascript
  // api/submissions/+server.js
  const serverToken = safeText(body.timing_token);
  // Ověření integrity serverového tokenu vystaveného při renderu formuláře:
  const tokenPayload = verifyServerTimingToken(serverToken);
  if (tokenPayload) {
    const elapsedOnServer = Date.now() - tokenPayload.issuedAt;
    if (elapsedOnServer < 1200) {
      return json({ success: false, error: 'Formulář byl odeslán příliš rychle.' }, { status: 400 });
    }
  }
  ```

---

### Nález 5: Vyčerpání GPU a pád tabu z desítek souběžných 2D canvas kontextů a listenerů DeviceOrientation
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/near/+page.svelte:1703`, `akcelerator-landing-page/src/routes/app/online/+page.svelte:486`, `akcelerator-landing-page/src/lib/sensoryEngine.js:1494, 1758-1776, 3051-3053`
- **Popis a scénář selhání**:
  Na stránce `/near` (i `/app/online`) je v šabloně pro každé nalezené místo v okolí (typicky 20 až 45 karet) vytvořen vlastní prvek `<canvas class="impact-payoff-canvas">` svázaný s akcí `use:impactCanvas`.
  Ačkoliv `sensoryEngine.js:1758-1774` již obsahuje instanci `IntersectionObserver` pro sledování viditelnosti plátna a 60fps smyčka `fn()` nevolá `onProgress` v každém snímku (volá se pouze při inicializaci a při interakci), implementace trpí třemi závažnými architektonickými a výkonnostními vadami:
  1. Každé z 20–45 pláten alokuje nezávislý HTML5 2D canvas kontext se samostatnými vyrovnávacími paměťmi v paměti GPU.
  2. Každé plátno při svém připojení v `sensoryEngine.js:1776` zaregistruje vlastní nesdílený posluchač na okně: `addEventListener('deviceorientation', onO)`. Při zobrazení 40 karet je na objektu `window` registrováno 40 samostatných listenerů. Při každém sebemenším pohybu mobilního gyroskopu se 40× za sebou vyvolá obsluha události a přepočítávají se vnitřní náklony všech karet.
  3. Proměnná `isVisible` je v `sensoryEngine.js:1494` inicializována na `let isVisible = true;`. Protože `IntersectionObserver` doručuje první záznamy asynchronně v dalším cyklu prohlížeče, všech 20–45 pláten okamžitě při svém mountu zahájí vykreslování v RAF smyčce (`id = requestAnimationFrame(fn)`). Dochází k masivnímu souběžnému nárazu desítek RAF smyček současně počítajících náročné radiální gradienty a stíny na GPU ještě předtím, než IntersectionObserver stihne karty mimo viewport uspat.
  Na mobilních zařízeních a ve vnořených In-App prohlížečích (Instagram, Facebook) způsobuje tento počáteční náraz a desítky orientačních listenerů okamžité zamrznutí UI, propad na 2–5 FPS a v krajním případě pád karty prohlížeče na vyčerpání paměti GPU.
- **Konkrétní návrh opravy**:
  1. Nastavit výchozí stav na `let isVisible = false;`, aby žádné plátno nespouštělo RAF smyčku při mountu, dokud `IntersectionObserver` nepotvrdí viditelnost v zorném poli (lazy rendering).
  2. Nahradit desítky separátních listenerů `deviceorientation` jediným sdíleným singletonem na okně v modulu `sensoryEngine.js`.
  3. Zavést centralizovaný koordinátor animační smyčky (jeden globální `requestAnimationFrame`), který v jednom cyklu obslouží pouze aktuálně viditelná plátna, namísto desítek nezávislých RAF smyček.
  ```javascript
  // src/lib/sensoryEngine.js
  let sharedOrientation = { beta: 0, gamma: 0 };
  let orientationListening = false;

  export function ensureSharedOrientation() {
    if (orientationListening || typeof window === 'undefined') return;
    window.addEventListener(
      'deviceorientation',
      (e) => {
        sharedOrientation.beta = e.beta || 0;
        sharedOrientation.gamma = e.gamma || 0;
      },
      { passive: true }
    );
    orientationListening = true;
  }
  ```

---

### Nález 6: Tichá ztráta dat přes efemérní in-memory pole v bezserverových (serverless) handlerech
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/submissions/+server.js:173-199`, `akcelerator-landing-page/src/routes/api/test-supabase/+server.js:105-144`
- **Popis a scénář selhání**:
  Při odeslání komunitního tipu nebo zpětné vazby kód zachytává výpadky databáze:
  ```javascript
  // submissions/+server.js:173-199
  LOCAL_COMMUNITY_ITEMS.unshift({ id: localId, ...row });
  if (LOCAL_COMMUNITY_ITEMS.length > MAX_LOCAL_COMMUNITY_ITEMS) {
    LOCAL_COMMUNITY_ITEMS.length = MAX_LOCAL_COMMUNITY_ITEMS;
  }
  const supabase = createServerSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('community_submissions').insert([row]).select('id').single();
      if (!error) return json({ success: true, id: data?.id || localId, fallback: false });
    } catch {
      // Fall through to local fallback success
    }
  }
  return json({ success: true, id: localId, fallback: true });
  ```
  Pokud je Supabase nedostupná, vyprší timeout, není nakonfigurována nebo dojde k chybě RLS, handler chybu zahodí, uloží data do lokálního pole v paměti procesu (`LOCAL_COMMUNITY_ITEMS` či `LOCAL_FEEDBACK_BUFFER`) a klientovi odpoví HTTP 200 `{ success: true, fallback: true }`.
  V prostředí Vercel Serverless Functions je každá instance funkce izolovaným, krátce žijícím kontejnerem. Po odbavení požadavku nebo při škálování na nulu je kontejner zničen. Všechna data v polích `LOCAL_COMMUNITY_ITEMS` a `LOCAL_FEEDBACK_BUFFER` jsou nenávratně ztracena. Uživatel je přitom v rozhraní ubezpečen, že jeho tip byl úspěšně uložen. Dochází k tiché a nevratné ztrátě dat uživatelů.
- **Konkrétní návrh opravy**:
  Pokud primární databázový zápis selže a není k dispozici žádné trvalé úložiště (např. spolehlivá externí fronta Upstash / SQS / Redis), handler nesmí vracet falešný úspěch. Musí vrátit HTTP 500/503 s jasnou informací pro uživatele, aby bylo zřejmé, že data nebyla uložena.
  ```javascript
  // src/routes/api/submissions/+server.js
  const supabase = createServerSupabaseClient();
  if (!supabase) {
    return json(
      { success: false, error: 'Databázová služba není nakonfigurována. Zkuste to prosím později.' },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from('community_submissions')
    .insert([row])
    .select('id')
    .single();

  if (error) {
    console.error('Supabase insert error:', error.message);
    return json(
      { success: false, error: 'Tip se nepodařilo uložit do databáze. Zkuste to prosím znovu.' },
      { status: 500 }
    );
  }

  return json({ success: true, id: data.id, fallback: false });
  ```

---

### Nález 7: Nezabezpečený serverový Supabase klient s veřejným anonymním klíčem a riziko obcházení RLS
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/submissions/+server.js:18-21`, `akcelerator-landing-page/src/routes/api/community-nearby/+server.js:19-22`, `akcelerator-landing-page/src/routes/api/test-supabase/+server.js:16-21`
- **Popis a scénář selhání**:
  Serverové handlery vytvářejí klienta Supabase následovně:
  ```javascript
  import { env } from '$env/dynamic/public';
  function createServerSupabaseClient() {
    if (!env.PUBLIC_SUPABASE_URL || !env.PUBLIC_SUPABASE_ANON_KEY) return null;
    return createClient(env.PUBLIC_SUPABASE_URL, env.PUBLIC_SUPABASE_ANON_KEY);
  }
  ```
  Backend aplikace používá veřejný anonymní klíč `PUBLIC_SUPABASE_ANON_KEY`. Mezi serverovou logikou a neautentizovaným klientem z internetu neexistuje žádná bezpečnostní hranice.
  Pokud databázová politika RLS na tabulce `community_submissions` umožňuje vkládání pro roli `anon`, může kdokoliv z internetu vzít `PUBLIC_SUPABASE_ANON_KEY` (který je volně dostupný v klientském JS bundlu) a posílat přímé REST požadavky do Supabase s hodnotou `status: 'approved'`. Tím zcela obejde validace na SvelteKit serveru, honeypot i proces moderace. Pokud je navíc na tabulce povolen `select` pro `anon`, může kdokoliv přes REST API dumpnout celou tabulku včetně osobních údajů vkladatelů (jména, kontaktní e-maily, telefony).
- **Konkrétní návrh opravy**:
  1. Pro serverové endpointy používat privátní `SUPABASE_SERVICE_ROLE_KEY` importovaný z `$env/static/private` nebo `$env/dynamic/private`.
  2. V databázi Supabase nastavit přísné RLS politiky: zcela zakázat přímý přístup pro roli `anon` do tabulek `community_submissions` a `feedback`, nebo povolit zápis pouze se statickým zámkem `CHECK (status = 'pending')` vynuceným na úrovni PostgreSQL schématu.
  ```javascript
  // src/routes/api/submissions/+server.js
  import { env } from '$env/dynamic/private';
  import { env as publicEnv } from '$env/dynamic/public';
  import { createClient } from '@supabase/supabase-js';

  function createServerSupabaseClient() {
    const url = publicEnv.PUBLIC_SUPABASE_URL;
    const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) return null;
    return createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  ```

---

### Nález 8: Trojité paralelní zaplavování veřejné infrastruktury Overpass API bez rušení neúspěšných požadavků
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/nearby/+server.js:23-27, 144-166, 227-235`
- **Popis a scénář selhání**:
  Pro získání míst v okolí volá endpoint funkci `postOverpass`:
  ```javascript
  const OVERPASS_ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  async function postOverpass(query) {
    return await Promise.any(OVERPASS_ENDPOINTS.map((url) => fetchOneOverpass(url, query, 1600)));
  }
  ```
  Při každém vyhledávání odpálí server současně 3 náročné POST dotazy na 3 nezávislé veřejné komunitní servery OpenStreetMap. Jakmile nejrychlejší server odpoví, `Promise.any` vrátí výsledek. Zbývající 2 požadavky však mají vlastní izolované `AbortController` instance a běží na cizích serverech dál až do vypršení timeoutu.
  Veřejné Overpass servery mají striktní politiku férového užití a omezují počet souběžných slotů na jednu IP adresu (typicky max. 2 paralelní dotazy). Zasíláním 3 dotazů na každý uživatelský dotaz dochází k okamžitému vyčerpání slotů, vrácení chyb HTTP 429 a následnému plošnému zablokování IP adresy aplikace ze strany OSM infrastruktury. Vyhledávání v mapě `/near` pak selhává pro všechny uživatele.
- **Konkrétní návrh opravy**:
  Pozor: Naivní sekvenční cyklus přes všechny 3 servery s timeoutem 3 500 ms by v případě nedostupnosti trval 10,5 sekundy ($3 \times 3500\text{ ms} = 10,5\text{ s}$). Jelikož bezserverové funkce na Vercelu mají na standardních plánech výchozí hard limit **10,0 sekund**, vedl by takový sekvenční pád k chybě `504 Gateway Timeout` (FUNCTION_INVOCATION_TIMEOUT) zabité infrastruktuře Vercelu.
  Správné řešení:
  1. Použít paralelní dotazování se sdíleným `AbortController`, který v bloku `finally` okamžitě zruší všechny zbývající paralelní sockety jakmile první endpoint uspěje (nebo všechny selžou).
  2. Nastavit per-request timeout na 3 000 ms, což zaručí bezpečné ukončení dlouho před limitem serverless platformy.
  3. Jako alternativu použít sekvenční dotazování omezené striktně na maximálně 2 vybrané servery s timeoutem 2 500 ms, nebo 1 pokus s timeoutem 3 500 ms s okamžitým přechodem na statická offline data.
  ```javascript
  // src/routes/api/nearby/+server.js
  async function postOverpass(query) {
    const controller = new AbortController();
    try {
      return await Promise.any(
        OVERPASS_ENDPOINTS.map((url) => fetchOneOverpass(url, query, 3000, controller.signal))
      );
    } finally {
      controller.abort(); // Okamžitě přeruší zbylé síťové sockety
    }
  }
  ```

---

## 2. Závažné vady (HIGH)

### Nález 3: Cirkulární závislost modulů mezi mollyStore.js a sensoryEngine.js
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/mollyStore.js:1-7`, `akcelerator-landing-page/src/lib/sensoryEngine.js:1, 564-566`
- **Popis a scénář selhání**:
  Mezi moduly existuje přímý cyklus na úrovni top-level importů:
  - `mollyStore.js:2-7` importuje ze `sensoryEngine.js`:
    ```javascript
    import {
      getActionEffectMeta,
      playMollyPurr,
      playMollyCrunch,
      playMollyMeow
    } from './sensoryEngine.js';
    ```
  - `sensoryEngine.js:1` importuje z `mollyStore.js`:
    ```javascript
    import { notifyMollySpark } from './mollyStore.js';
    ```
  - `sensoryEngine.js:564-566` provádí inicializaci při načtení modulu:
    ```javascript
    Object.values(ACTION_EFFECT_CATALOG).forEach((spec) => {
      spec.mollyTreat = resolveMollyTreat(spec);
    });
    ```
  V prostředí Node.js a SSR engine deklarace funkcí hoistuje, takže standardní import v běhu nespadne okamžitě na TDZ (`ReferenceError`), pokud funkce nejsou vyvolány přímo během vyhodnocování top-level kódu. Nicméně vzájemný cirkulární import mezi dvěma základními moduly představuje závažné architektonické riziko: komplikuje kódové rozdělování (chunk splitting) v bundleru Vite/Rollup, znemožňuje stromové prořezávání nepoužitého kódu (tree-shaking), vytváří křehkost při testování v izolovaných unit-test runneroch a při budoucím přidání tříd či top-level proměnných vyvolá fatální TDZ pád.
- **Konkrétní návrh opravy**:
  1. Vytvořit samostatný čistý datový modul `akcelerator-landing-page/src/lib/mollyTypes.js`, do kterého se přesunou konstanty a mapování pamlsků (`MOLLY_TREAT_BY_FOOD`, `MODE_TO_MOLLY_FOOD`, `resolveMollyTreat`), které nevyžadují žádné audio ani store závislosti.
  2. Odstranit přímý import `notifyMollySpark` ze `sensoryEngine.js`. Předávat notifikaci buď parametrem, nebo zaregistrovat callback při spuštění aplikace.
  ```javascript
  // src/lib/sensoryEngine.js
  let mollySparkNotifier = null;
  export function registerMollyNotifier(fn) {
    mollySparkNotifier = fn;
  }
  // V místech vyvolání:
  if (mollySparkNotifier) mollySparkNotifier(sparkPayload);
  ```

---

### Nález 9: Obcházení rate limiteru podvržením klientských IP hlaviček a reset v serverless paměti
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/security.js:181-213, 221-244`
- **Popis a scénář selhání**:
  Funkce `resolveClientKey` určuje IP adresu klienta pro rate limiting:
  ```javascript
  export function resolveClientKey(request, getClientAddress) {
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
      const parts = vercelIp.split(',').map((s) => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return last.slice(0, 64);
    }
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
      const last = parts[parts.length - 1];
      if (last) return last.slice(0, 64);
    }
    try {
      if (typeof getClientAddress === 'function') {
        return String(getClientAddress() || 'local').slice(0, 64);
      }
    } catch { ... }
  ```
  Tato implementace má dvě zásadní vady:
  1. Dává přednost nevalidovaným klientským hlavičkám před interní funkcí SvelteKit `getClientAddress()`. Útočník může v každém požadavku zaslat náhodnou hlavičku `X-Forwarded-For: 1.2.3.X` a zcela obejít rate limit pro `/api/submissions` i `/api/feedback`.
  2. Bere poslední prvek (`last`) místo prvního. V řetězci proxy je klient na prvním místě, zatímco poslední prvek je bezprostřední proxy skok. Pokud více uživatelů přistupuje přes sdílenou bránu, sdílejí stejný limit a nevinní uživatelé dostávají chybu 429.
  3. `checkRateLimit` drží záznamy v paměťové mapě procesu Node (`RATE_LIMIT_BUCKETS`, strop 2 000 záznamů). V serverless prostředí Vercelu se po studeném startu mapa resetuje. Navíc při dosažení kapacity 2 000 záznamů kód evikuje expirované klíče nebo vymaže nejstarší záznam mapy (`RATE_LIMIT_BUCKETS.delete(victim)`). Zasláním 2 000 dotazů s náhodnými IP lze nuceně vymazat z paměti záznamy o zablokovaných útočnících.
- **Konkrétní návrh opravy**:
  Jako primární autoritu použít `getClientAddress()`. Pro produkční nasazení integrovat distribuovaný rate limiter (např. Upstash Redis / Vercel KV).
  ```javascript
  export function resolveClientKey(request, getClientAddress) {
    try {
      if (typeof getClientAddress === 'function') {
        const addr = getClientAddress();
        if (addr) return String(addr).slice(0, 64);
      }
    } catch {}
    const cfIp = request.headers.get('cf-connecting-ip');
    if (cfIp?.trim()) return cfIp.trim().slice(0, 64);
    const vercelIp = request.headers.get('x-vercel-forwarded-for');
    if (vercelIp) {
      const first = vercelIp.split(',')[0]?.trim();
      if (first) return first.slice(0, 64);
    }
    return 'anonymous';
  }
  ```

---

### Nález 10: Hardcoded testovací probe backdoor v produkčních koncových bodech
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/submissions/+server.js:60-72, 169-171`, `akcelerator-landing-page/src/routes/api/community-nearby/+server.js:39, 102`
- **Popis a scénář selhání**:
  V produkčních serverových souborech se nachází natvrdo zakódovaný magický řetězec:
  ```javascript
  // submissions/+server.js:60-72
  const name = safeText(body.name);
  const isAutomatedTestProbe = name === 'Testovací komunitní zahrada Praha';
  if (!isAutomatedTestProbe) {
    const clientKey = resolveClientKey(request, getClientAddress);
    const rl = checkRateLimit('submissions', clientKey, 15, 10 * 60 * 1000);
    if (!rl.allowed) { ... }
  }
  if (isAutomatedTestProbe) {
    return json({ success: true, id: localId, fallback: true, testProbe: true });
  }
  ```
  ```javascript
  // community-nearby/+server.js:39, 102
  if (r?.name === 'Testovací komunitní zahrada Praha') continue;
  ```
  Tento bypass byl vytvořen, aby automatizované testy procházely bez vyčerpání limitů a zápisu do DB. Zanechání tohoto kódu v produkci vytváří zranitelnost: kdokoliv může zasílat neomezené množství požadavků s tímto jménem bez aplikace rate limitu. Pokud navíc reálný uživatel zadá tento název, jeho záznam se nikdy neuloží do databáze a v dotazech bude tichým filtrem zahozen.
- **Konkrétní návrh opravy**:
  Pozor: Testy v `akcelerator-landing-page/tests/api.spec.ts:25-32` používají kontext `request.post` (Playwright fixture `APIRequestContext`), nikoliv `page`. Metoda `page.route()` zachytává pouze síťová volání z kontextu prohlížeče a volání `request.post` z Node.js vůbec nezachytí.
  Správné řešení:
  1. Zcela odstranit podmínku na název 'Testovací komunitní zahrada Praha' z produkčního kódu.
  2. Pro automatizované integrační testy zavést autorizační hlavičku pro testovací režim (např. `x-test-bypass-secret`), která je na serveru akceptována pouze tehdy, když `process.env.NODE_ENV !== 'production'` a hodnota odpovídá tajnému klíči z prostředí.
  ```javascript
  // src/routes/api/submissions/+server.js
  const testSecret = request.headers.get('x-test-bypass-secret');
  const isAuthorizedTest =
    process.env.NODE_ENV !== 'production' &&
    testSecret &&
    testSecret === process.env.TEST_BYPASS_SECRET;

  if (!isAuthorizedTest) {
    const clientKey = resolveClientKey(request, getClientAddress);
    const rl = checkRateLimit('submissions', clientKey, 15, 10 * 60 * 1000);
    if (!rl.allowed) {
      return json(
        { success: false, error: 'Příliš mnoho odeslaných tipů v krátkém čase.' },
        { status: 429 }
      );
    }
  }
  ```

---

### Nález 11: Chybějící safe-area top inset při viewport-fit=cover způsobující kolizi hlavičky s výřezem
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/+layout.svelte:210-216, 547-550`, `akcelerator-landing-page/src/app.html:9`
- **Popis a scénář selhání**:
  V `app.html:9` je definován viewport:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  ```
  V `+layout.svelte:547-550` má však fixní horní navigační lišta definováno pouze pevné odsazení:
  ```css
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 1rem;
  }
  ```
  Nastavení `viewport-fit=cover` instruuje prohlížeč (zejména mobilní Safari na iPhonech s výřezem Dynamic Island či Notchem), aby roztáhl vykreslovací plátno přes celou fyzickou obrazovku včetně systémové stavové lišty. Protože `.top-nav` postrádá dynamické odsazení `env(safe-area-inset-top)`, logotyp „Akcelerátor altruismu“, stavový odznak kočičky Molly i tlačítka pro krizovou pomoc zasahují přímo do černého výřezu kamery a systémových ikon hodin a baterie. Uživatel na moderním iPhonu nemůže na horní tlačítka spolehlivě kliknout a text je nečitelný.
- **Konkrétní návrh opravy**:
  Doplnit safe-area odsazení do stylů horní lišty s fallbackem pro starší prohlížeče:
  ```css
  .top-nav {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    padding-top: max(0.75rem, env(safe-area-inset-top));
    padding-left: max(1rem, env(safe-area-inset-left));
    padding-right: max(1rem, env(safe-area-inset-right));
    padding-bottom: 0.75rem;
  }
  ```

---

### Nález 12: Kompletní skrytí plovoucí krizové pomoci na mobilních zařízeních
- **Soubor a řádky**: `akcelerator-landing-page/src/components/ImmediateHelp.svelte:252-256`
- **Popis a scénář selhání**:
  V komponentě krizové pomoci `ImmediateHelp.svelte` se nachází responzivní pravidlo:
  ```css
  @media (max-width: 680px) {
    .crisis-pill,
    .crisis-trigger {
      display: none !important;
    }
  }
  ```
  Krizová pomoc (Linka bezpečí, Linka první psychické pomoci a krizová centra) je primární záchrannou sítí pro návštěvníky v akutní životní tísni. Více než 70 % uživatelů přistupuje k webu z mobilního telefonu (`max-width: 680px`). Kvůli tomuto pravidlu je plovoucí krizové tlačítko i spouštěcí pilulka na všech mobilních zařízeních kompletně vyřazena z DOM vykreslování (`display: none !important`). Člověk v krizi prohlížející web na mobilu nemá žádný rychlý způsob, jak se k telefonním číslům pomoci dostat.
- **Konkrétní návrh opravy**:
  Místo úplného skrytí transformovat krizový trigger na mobilních displejích do kompaktního fixního plovoucího prvku (FAB ikona telefonu s červeným křížkem) umístěného nad dolní navigační lištou.
  ```css
  @media (max-width: 680px) {
    .crisis-pill {
      display: none;
    }
    .crisis-trigger {
      display: flex !important;
      position: fixed;
      bottom: calc(4.5rem + env(safe-area-inset-bottom));
      right: 1rem;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      padding: 0;
      justify-content: center;
      align-items: center;
      z-index: 95;
    }
  }
  ```

---

### Nález 13: Překrytí formuláře virtuální klávesnicí na mobilu v centrovaném modálu bez scrollu
- **Soubor a řádky**: `akcelerator-landing-page/src/components/FeedbackModal.svelte:177-183`
- **Popis a scénář selhání**:
  Modální okno pro odeslání zpětné vazby má definováno fixní centrování:
  ```css
  .feedback-modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    max-height: 90vh;
    overflow-y: auto;
  }
  ```
  Když uživatel na mobilním telefonu klikne do vstupního textového pole `<textarea>`, vysune se softwarová klávesnice, která zabere 40 až 50 % výšky obrazovky. Prohlížeč zmenší výšku viditelného viewportu, ale pravidlo `top: 50%; transform: translate(-50%, -50%)` drží střed modálu uprostřed původního viewportu. Tlačítka pro volbu smajlíka a tlačítko „Odeslat zpětnou vazbu“ se ocitnou pod klávesnicí mimo viditelnou oblast. Protože na těle dokumentu není povolen posun a vnitřní scroll je zablokován geometrií transformace, uživatel nemůže modál posunout a nemůže odeslání dokončit.
- **Konkrétní návrh opravy**:
  Na mobilních displejích přejít ze středu obrazovky na spodní výsuvný panel (bottom sheet) s výškou vázanou na dynamické jednotky `dvh` a povoleným scrollováním:
  ```css
  @media (max-width: 640px) {
    .feedback-modal {
      top: auto;
      bottom: 0;
      left: 0;
      right: 0;
      transform: none;
      width: 100%;
      max-height: 85dvh;
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      padding-bottom: max(1.5rem, env(safe-area-inset-bottom));
    }
  }
  ```

---

### Nález 14: Molly dock s pointer-events: none způsobující nekontrolované proklikávání na pozadí
- **Soubor a řádky**: `akcelerator-landing-page/src/components/MollyCompanion.svelte:765-776, 1342-1350, 1358-1368`
- **Popis a scénář selhání**:
  Ve stylu pro mobilní dok kočičky Molly je nastaveno:
  ```css
  .molly-pelisek-dock {
    pointer-events: none;
  }
  ```
  Aby byla kočička přesto klikatelná, obsluhuje se kliknutí globálním odposlechem na celém okně:
  ```javascript
  window.addEventListener('pointerdown', (e) => {
    // Ruční výpočet vzdálenosti od středu pelíšku
    if (dist < 42) { handleMollyTap(e); }
  }, { passive: true });
  ```
  Protože prvek pelíšku má `pointer-events: none` a posluchač na okně je `passive: true` (takže nemůže zavolat `e.preventDefault()`), jakýkoliv dotyk na kočičku Molly v doku projde skrz ni na elementy na pozadí. Pokud se pod pelíškem nachází tlačítko „Chci pomoci“, odkaz na organizaci nebo karta, uživatel při pokusu pohladit kočičku nechtěně aktivuje cizí akci na stránce a je nečekaně přesměrován pryč.
- **Konkrétní návrh opravy**:
  1. Nastavit na elementu pelíšku `pointer-events: auto`.
  2. Odstranit pasivní globální posluchač na okně a navázat událost přímo na element pelíšku s voláním `e.stopPropagation()`.
  ```html
  <div
    class="molly-pelisek-dock"
    on:pointerdown|stopPropagation={handleMollyDockTap}
    role="button"
    tabindex="0"
    aria-label="Pohladit kočičku Molly"
  >
  ```

---

### Nález 15: Trvalá neomezená 60/120Hz animační smyčka v globálně přimountovaném layoutu
- **Soubor a řádky**: `akcelerator-landing-page/src/components/MollyCompanion.svelte:845-920`, `akcelerator-landing-page/src/routes/+layout.svelte:315`
- **Popis a scénář selhání**:
  Komponenta `MollyCompanion` je trvale přimountována v hlavním kořenovém rozvržení `+layout.svelte` a běží nepřetržitě na všech podstránkách webu. Uvnitř běží smyčka `requestAnimationFrame`:
  ```javascript
  function loop(time) {
    // ...
    animFrameId = requestAnimationFrame(loop);
  }
  ```
  Tato smyčka nikdy neusíná. I když je kočička Molly uspaná v pelíšku v doku (`currentState.mode === 'docked'`) a nedochází k žádnému pohybu, smyčka se neustále vyhodnocuje 60× až 120× za sekundu. Provádí matematické interpolace a vynucuje zbytečnou zátěž JavaScriptového vlákna. Na mobilních zařízeních to způsobuje permanentní spotřebu baterie na pozadí a zahřívání zařízení, i když uživatel pouze čte statický text.
- **Konkrétní návrh opravy**:
  Přerušit smyčku `requestAnimationFrame`, jakmile se animace ustálí v doku nebo když je stránka skrytá (`document.hidden`), a obnovit ji pouze při interakci uživatele:
  ```javascript
  function checkAndPauseLoop() {
    if (currentState.mode === 'docked' && !flyingTreat && heartBursts.length === 0) {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }
  }
  ```

---

### Nález 16: Absence validace CSRF a Origin u citlivých mutačních endpointů
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/submissions/+server.js:52-58`, `akcelerator-landing-page/src/routes/api/test-supabase/+server.js:80-90`, `akcelerator-landing-page/src/routes/api/feedback/+server.js:1`
- **Popis a scénář selhání**:
  Endpointy `/api/submissions` a `/api/test-supabase` (který je zároveň reexportován v `api/feedback/+server.js` a volán z klientského `FeedbackModal.svelte`) zpracovávají požadavky typu POST provádějící zápisy a mutace stavu (zápis nových komunitních tipů do tabulky `community_submissions` nebo lokálního bufferu, resp. vkládání uživatelských zpětných vazeb do tabulky `feedback` v Supabase).
  V obsluze požadavků zcela chybí validace původu požadavku – nekontroluje se hlavička `Origin`, `Referer` ani moderní fetch metadata `Sec-Fetch-Site`.
  Jelikož moderní webové prohlížeče povolují odesílání POST požadavků (např. přes standardní formuláře, `fetch` s `mode: 'no-cors'`, nebo standardní cross-origin fetch), může útočník vytvořit škodlivou webovou stránku, která v kontextu prohlížeče návštěvníka automaticky odešle POST požadavky na `https://akcelerator-altruismu.cz/api/submissions` či `/api/test-supabase`.
  Jelikož server nekontroluje původ požadavku a nezamítá cross-site volání, server takové dotazy zpracuje jako legitimní. Útočník tak může zneužít návštěvníky svého webu jako distribuovanou síť pro zaplavení databáze spamy, zahlcení paměťových bufferů `LOCAL_COMMUNITY_ITEMS` / `LOCAL_FEEDBACK_BUFFER` a vyčerpání kvót bezserverových funkcí i databáze Supabase, přičemž z pohledu serverového rate limiteru budou dotazy přicházet z tisíců různých reálných klientských IP adres.
- **Konkrétní návrh opravy**:
  Zavést přísnou kontrolu hlaviček `Sec-Fetch-Site` a `Origin` pro všechny mutační endpointy (POST/PUT/DELETE). Požadavky s `Sec-Fetch-Site: cross-site` nebo s hlavičkou `Origin`, která neodpovídá hostitelské doméně aplikace, okamžitě odmítnout s HTTP 403 Forbidden.
  ```javascript
  // src/lib/security.js
  export function validateMutationOrigin(request, url) {
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite && secFetchSite !== 'same-origin' && secFetchSite !== 'same-site') {
      return false;
    }
    const origin = request.headers.get('origin');
    if (origin) {
      try {
        const originUrl = new URL(origin);
        if (originUrl.host !== url.host) {
          return false;
        }
      } catch {
        return false;
      }
    }
    return true;
  }
  ```
  A na začátku `POST` handlerů v `api/submissions/+server.js` a `api/test-supabase/+server.js`:
  ```javascript
  export async function POST({ request, url, getClientAddress }) {
    if (!validateMutationOrigin(request, url)) {
      return json(
        { success: false, error: 'Nepovolený původ požadavku (Cross-Origin mutation rejected).' },
        { status: 403 }
      );
    }
    // ...
  ```

---

### Nález 17: Černá díra komunitních tipů a klamavé potvrzení pro uživatele
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/submit/+page.svelte:174-178`, `akcelerator-landing-page/src/routes/api/submissions/+server.js:148-151, 173-180`, `akcelerator-landing-page/src/routes/api/community-nearby/+server.js:39-41, 86`
- **Popis a scénář selhání**:
  Po odeslání nového místa formulářem `/submit` se uživateli zobrazí:
  ```javascript
  submittedMapUrl = `/near?lat=${lat}&lon=${lon}`;
  ```
  Uživatel dostane zprávu „Dobrý skutek zaznamenán! Tvůj tip pomůže ostatním najít smysluplnou pomoc v okolí.“ a tlačítko „Prohlédnout na mapě“.
  V databázi se však položka uloží se stavem:
  ```javascript
  status: 'pending'
  ```
  Při načtení mapy endpoint `/api/community-nearby` striktně filtruje:
  ```javascript
  query = query.eq('status', 'approved');
  ```
  V celé codebase neexistuje žádné administrační rozhraní, žádný schvalovací skript ani webhook pro změnu stavu z `pending` na `approved`. Uživatel, který s dobrým úmyslem přidal útulek nebo komunitní zahradu, klikne na „Prohlédnout na mapě“ a své přidané místo na mapě neuvidí. Získá dojem, že aplikace nefunguje, nebo že jeho příspěvek byl smazán. Všechny odeslané komunitní tipy končí v trvalé černé díře.
- **Konkrétní návrh opravy**:
  1. Dočasně zobrazit uživateli jeho vlastní neověřený tip v jeho lokálním prohlížeči (přes `localStorage` s příznakem „Čeká na schválení“), aby viděl výsledek své snahy.
  2. Upravit textaci v potvrzovacím dialogu: „Tvůj tip byl odeslán ke kontrole. Jakmile ověříme kontaktní údaje, zobrazí se na mapě všem.“
  3. Zavést jednoduchý schvalovací skript nebo webhook pro moderátory.

---

### Nález 18: Neošetřený běžící timer (leak) v Promise.race při dotazu na databázi
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/community-nearby/+server.js:63-78`
- **Popis a scénář selhání**:
  Při dotazu na komunitní místa je nastaven timeout přes `Promise.race`:
  ```javascript
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Supabase community query timeout')), 3500)
  );
  const result = await Promise.race([dbPromise, timeoutPromise]);
  ```
  Časovač vytvořený přes `setTimeout(..., 3500)` není nikde uložen do proměnné a po dokončení `dbPromise` není zrušen přes `clearTimeout`.
  Pokud databáze odpoví rychle (např. za 50 ms), časovač zůstává viset v frontě událostí Node.js runtime po zbývajících 3 450 ms. V bezserverovém prostředí Vercelu brání visící aktivní časovač okamžitému zmrazení běhového prostředí, prodlužuje dobu účtovaného běhu lambda funkce (execution duration) a při zátěži vede k akumulaci nezrušených časovačů v paměti procesu.
- **Konkrétní návrh opravy**:
  Vždy vyčistit časovač v bloku `finally`:
  ```javascript
  let timerId;
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error('Supabase community query timeout')), 3500);
  });
  try {
    const result = await Promise.race([dbPromise, timeoutPromise]);
    return result;
  } finally {
    clearTimeout(timerId);
  }
  ```

---

### Nález 19: Race condition v upstream rate limiteru geokódování Nominatim
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/geocode/+server.js:18-29, 125-140`
- **Popis a scénář selhání**:
  Pro dodržení pravidla OpenStreetMap (max. 1 požadavek za sekundu) obsahuje kód zámek:
  ```javascript
  let lastRequestTime = 0;
  async function waitForRateLimit() {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < 1100) {
      await new Promise((r) => setTimeout(r, 1100 - elapsed));
    }
    lastRequestTime = Date.now();
  }
  ```
  Tato implementace trpí souběhem (race condition). Pokud přijdou dva dotazy současně v čase $T=0$:
  1. Požadavek A i požadavek B přečtou stejné `lastRequestTime = 0`.
  2. Podmínka `elapsed < 1100` je pro oba vyhodnocena jako `false` (nebo oba usnou na stejnou dobu).
  3. Oba požadavky se probudí v identický okamžik a odešlou HTTP dotaz na servery Nominatim současně.
  Dochází k porušení pravidel využití Nominatim API, což vede k zablokování IP adresy serveru s chybou HTTP 429 Too Many Requests. Navíc v prostředí Vercelu existuje více instancí serverless kontejnerů, které tuto paměťovou proměnnou nesdílejí.
- **Konkrétní návrh opravy**:
  Řetězit požadavky přes slibovou frontu (promise queue):
  ```javascript
  let lastScheduleTime = 0;
  async function scheduleNominatimRequest() {
    const now = Date.now();
    const targetTime = Math.max(now, lastScheduleTime + 1100);
    lastScheduleTime = targetTime;
    const delay = targetTime - now;
    if (delay > 0) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  ```

---

### Nález 20: Falešný sociální důkaz generovaný z hodin v /api/pulse
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/pulse/+server.js:44-58`
- **Popis a scénář selhání**:
  Endpoint `/api/pulse` vrací živá oznámení pro informační ticker:
  ```javascript
  function buildPulsePayload() {
    const now = Date.now();
    const index = Math.floor(now / 15000) % RECENT_MOCK_ACTIONS.length;
    const action = RECENT_MOCK_ACTIONS[index];
    return {
      success: true,
      data: {
        message: action.text,
        city: action.city,
        ago: 'před chvílí',
        timestamp: now
      }
    };
  }
  ```
  Text „Před chvílí někdo v Brně naplnil misku v útulku“ je kompletně vymyšlený matematickým modulem ze systémového času po 15 sekundách. Aplikace deklarující jako svůj hlavní cíl čistý, ověřený altruismus předkládá uživateli syntetický sociální důkaz maskovaný jako reálné skutky jiných lidí. Pokud uživatel zjistí, že hlášení jsou podvržená, dochází ke ztrátě důvěry v celý projekt.
- **Konkrétní návrh opravy**:
  1. Napojit ticker na reálné agregované statistiky dokončených kroků z databáze (např. anonymní počítadlo za posledních 24 hodin).
  2. Pokud data nejsou k dispozici, přeformulovat textaci ze lživého tvrzení „Před chvílí někdo...“ na zjevný inspirativní tip: „Tip na dobrý skutek: Můžeš naplnit misku v útulku...“.

---

### Nález 21: Zablokování posunu stránky na mobilu mapou Leaflet
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/near/+page.svelte:1155-1159`
- **Popis a scénář selhání**:
  Mapa je inicializována s výškou `58dvh`:
  ```javascript
  map = leaflet.map(mapEl, {
    zoomControl: true,
    scrollWheelZoom: true,
    preferCanvas: true
  });
  ```
  Na mobilních zařízeních s dotykovým displejem zabírá mapa více než polovinu obrazovky. Leaflet ve výchozím nastavení zachytává všechna dotyková gesta jedním prstem pro posun mapy (`dragging: true`). Když se uživatel pokusí na mobilu posunout stránku dolů, aby si prohlédl textový seznam organizací pod mapou, dotykem na mapu začne pouze posouvat mapový výřez. Uživatel uvízne v dotykové pasti (scroll trap) a nemůže se posunout ke zbytku obsahu stránky.
- **Konkrétní návrh opravy**:
  Pozor: Řešení nesmí nastavit `dragging: !isTouchDevice`. V Leafletu nastavení `dragging: false` kompletně znehybní mapu na dotykových zařízeních – uživatel na mobilu by pak nemohl mapu posouvat vůbec (ani jedním, ani dvěma prsty), což by zcela zničilo použitelnost vyhledávání organizací.
  Správné řešení:
  1. Implementovat kooperativní zachytávání gest (např. Leaflet plugin `leaflet-gesture-handling` nebo vlastní dotykovou obsluhu), kdy mapa pro posun na dotykovém displeji vyžaduje současný tah dvěma prsty, zatímco tah jedním prstem propouští pro přirozený posun celé webové stránky a zobrazí dočasný průhledný overlay „Použijte dva prsty pro posun mapy“.
  2. Alternativně nabídnout explicitní přepínač zámku mapy (tlačítko „Aktivovat posun mapy“), které dotykový posun mapy zapíná a vypíná.
  ```javascript
  // src/routes/near/+page.svelte
  map = leaflet.map(mapEl, {
    zoomControl: true,
    scrollWheelZoom: false,
    gestureHandling: true, // Vyžaduje dva prsty pro posun mapy na dotykových zařízeních
    preferCanvas: true
  });
  ```

---

### Nález 22: Veřejná expozice interního testovacího endpointu a diagnostiky v produkci
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/test-supabase/+server.js:24-47`, `akcelerator-landing-page/src/components/FeedbackModal.svelte:63`, `akcelerator-landing-page/src/routes/api/feedback/+server.js:1`
- **Popis a scénář selhání**:
  V souboru `FeedbackModal.svelte` je odeslání zpětné vazby směrováno na:
  ```javascript
  const resp = await fetch('/api/test-supabase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ... })
  });
  ```
  Zároveň endpoint `src/routes/api/feedback/+server.js` pouze reexportuje testovací soubor:
  ```javascript
  export { GET, POST } from '../test-supabase/+server.js';
  ```
  Endpoint `/api/test-supabase` v metodě GET vypisuje kompletní diagnostiku připojení k databázi včetně stavu proměnných prostředí a počtu záznamů. Produkční kód pro zpětnou vazbu se spoléhá na interní testovací soubor určený pro ladění Supabase. Pokud útočník zavolá GET `/api/test-supabase`, získá informace o interní infrastruktuře backendu.
- **Konkrétní návrh opravy**:
  1. Přesunout produkční logiku pro zpětnou vazbu do samostatného čistého endpointu `/api/feedback/+server.js`.
  2. Ve `FeedbackModal.svelte` volat výhradně `/api/feedback`.
  3. Soubor `/api/test-supabase/+server.js` buď zcela odstranit, nebo zabezpečit tajným klíčem a vypnout v produkčním prostředí.

---

## 3. Středně závažné vady (MEDIUM)

### Nález 2: Selhání reaktivity Svelte v animaci letu pamlsku v MollyCompanion
- **Soubor a řádky**: `akcelerator-landing-page/src/components/MollyCompanion.svelte:862-873, 968-985`
- **Popis a scénář selhání**:
  Při krmení kočičky Molly se spouští animace letu pamlsku. Ve smyčce `requestAnimationFrame` se v každém snímku mutuje vnitřní vlastnost objektu `flyingTreat`:
  ```javascript
  if (flyingTreat) {
    flyingTreat.p = Math.min(
      1,
      flyingTreat.p + dt * (reduced ? 3.5 : 1.85)
    );
    if (flyingTreat.p >= 1) {
      eatTimer = 1.4;
      spawnHeartBurst(6);
      flyingTreat = null;
    }
  }
  ```
  Současně je pozice pamlsku v šabloně navázána na reaktivní deklaraci:
  ```javascript
  $: flyingTreatPos = flyingTreat
    ? (() => {
        const u = 1 - flyingTreat.p;
        const p = flyingTreat.p;
        return {
          x: u * u * flyingTreat.x0 + 2 * u * p * flyingTreat.cx + p * p * flyingTreat.x1,
          y: u * u * flyingTreat.y0 + 2 * u * p * flyingTreat.cy + p * p * flyingTreat.y1,
          icon: flyingTreat.icon,
          color: flyingTreat.color
        };
      })()
    : null;
  ```
  V reaktivním modelu Svelte (Svelte 4 i Svelte 5 v legacy módu) je reaktivní blok `$: flyingTreatPos = ...` vyhodnocen pouze tehdy, dojde-li k přímému přiřazení do proměnné `flyingTreat` (přeuložení reference). Mutace vnořené vlastnosti `flyingTreat.p = ...` kompilátor Svelte nedetekuje. V důsledku toho se `flyingTreatPos` spočítá pouze jednou při vzniku objektu s `p = 0`. Po celou dobu 1,4 s zůstává DOM element pamlsku `.molly-flying-treat` zcela nehybný na výchozích souřadnicích a následně skokově zmizí po nastavení `flyingTreat = null`. Uživatel vidí zamrzlou ikonu místo plynulého parabolického letu.
  Jedná se o kosmetickou vizuální vadu v doprovodném gamifikačním widgetu (nikoliv o pád aplikace či ztrátu dat), proto je zařazena jako středně závažná.
- **Konkrétní návrh opravy**:
  Při každém kroku animace v RAF smyčce provést reasiganci celého objektu, aby kompilátor Svelte zaregistroval změnu stavu:
  ```javascript
  if (flyingTreat) {
    const nextP = Math.min(1, flyingTreat.p + dt * (reduced ? 3.5 : 1.85));
    if (nextP >= 1) {
      eatTimer = 1.4;
      spawnHeartBurst(6);
      flyingTreat = null;
    } else {
      flyingTreat = { ...flyingTreat, p: nextP };
    }
  }
  ```

---

### Nález 23: Předčasné ukončení pseudo-SSE endpointu způsobující nekonečnou bouři reconnectů
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/pulse/+server.js:61-76`, `akcelerator-landing-page/tests/api.spec.ts:115-123`
- **Popis a scénář selhání**:
  Při požadavku s hlavičkou pro Server-Sent Events server vrátí jedinou zprávu a spojení ihned zavře:
  ```javascript
  if (wantsStream) {
    const payload = buildPulsePayload();
    const body = `event: pulse\ndata: ${JSON.stringify(payload)}\n\n`;
    return new Response(body, {
      status: 200,
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform'
      }
    });
  }
  ```
  Dle W3C specifikace `EventSource` považuje prohlížeč uzavření HTTP 200 spojení za neočekávaný výpadek sítě a automaticky se každé 3 sekundy pokouší o reconnect. Klient se tak dostává do nekonečné smyčky neustálého otevírání nového TLS spojení a HTTP dotazů, což zbytečně vytěžuje serverless funkce a spotřebovává mobilní data.
- **Konkrétní návrh opravy**:
  Pozor: Test v `akcelerator-landing-page/tests/api.spec.ts:115-123` explicitně vyžaduje funkčnost SSE endpointu:
  ```typescript
  const pulseSseRes = await request.get(baseURL! + '/api/pulse', {
    headers: { accept: 'text/event-stream' }
  });
  expect(pulseSseRes.status()).toBe(200);
  expect(pulseSseRes.headers()['content-type']).toContain('text/event-stream');
  const sseText = await pulseSseRes.text();
  expect(sseText).toContain('event: pulse');
  ```
  Prosté smazání SSE větve by rozbilo existující automatizovaný test 6.
  Správné řešení:
  Zachovat plnou kompatibilitu s testem i prohlížečem:
  1. Vrátit skutečný otevřený `ReadableStream` s periodickým heartbeat komentářem (`: keep-alive\n\n`), kde první odeslaný blok obsahuje okamžitý `event: pulse\ndata: ...\n\n`.
  2. Případně do jednorázové zprávy přidat pole `retry: 15000\n` a spojení korektně ukončit, aby prohlížeč nespouštěl agresivní třísekundovou bouři dotazů.
  ```javascript
  // src/routes/api/pulse/+server.js
  if (wantsStream) {
    const stream = new ReadableStream({
      start(controller) {
        const payload = buildPulsePayload();
        controller.enqueue(new TextEncoder().encode(`event: pulse\ndata: ${JSON.stringify(payload)}\n\n`));
        const timer = setInterval(() => {
          controller.enqueue(new TextEncoder().encode(`: keep-alive\n\n`));
        }, 15000);
        return () => clearInterval(timer);
      }
    });
    return new Response(stream, {
      headers: {
        'content-type': 'text/event-stream; charset=utf-8',
        'cache-control': 'no-cache, no-transform',
        'connection': 'keep-alive'
      }
    });
  }
  ```

---

### Nález 24: Zbytečný reaktivní churn ve Svelte při 60fps RAF v /svet
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/svet/+page.svelte:1153-1157, 2280`
- **Popis a scénář selhání**:
  Při paralaxním efektu na stránce `/svet` se v každém snímku animace aktualizuje proměnná komponenty:
  ```javascript
  parallaxStyle = `transform: scale(1.032) translate3d(${tx}px, ${ty}px, 0);`;
  ```
  V šabloně je element svázán přes `style={parallaxStyle}`. Přiřazení do `parallaxStyle` 60× za sekundu spouští reaktivní mikroúlohy Svelte a přepočet šablony v každém snímku. Na slabším mobilním hardwaru to způsobuje mikro-záseky a propady plynulosti animace.
- **Konkrétní návrh opravy**:
  Odkázat element přímo přes `bind:this={parallaxEl}` a nastavovat `parallaxEl.style.transform = ...` přímo na instanci DOM elementu bez vyvolávání reaktivity Svelte.

---

### Nález 25: Nefunkční ochrana velikosti těla požadavku umožňující chunked OOM útok
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/security.js:252-255`
- **Popis a scénář selhání**:
  Kontrola velikosti těla požadavku:
  ```javascript
  export function hasExcessiveBodySize(request, maxBytes = 32_768) {
    const len = Number(request.headers.get('content-length') || 0);
    return Number.isFinite(len) && len > maxBytes;
  }
  ```
  Funkce spoléhá výhradně na hlavičku `Content-Length`. Pokud útočník odešle požadavek s `Transfer-Encoding: chunked` nebo hlavičku vynechá, hodnota `len` je `0`. Kontrola `0 > maxBytes` vrátí `false`. Následný příkaz `await request.json()` v handleru načte nekonečně velký payload do operační paměti Node.js procesu, což vede k vyčerpání paměti (Out Of Memory) a pádu kontejneru.
- **Konkrétní návrh opravy**:
  Omezit čtení těla ze streamu `request.body.getReader()` s počítadlem přijatých bajtů a okamžitým ukončením spojení při překročení limitu.

---

### Nález 26: Ztráta postupu dobrých skutků v In-App prohlížečích (Instagram, FB, LinkedIn)
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/progress.js:6-7, 329-383`, `akcelerator-landing-page/src/lib/analytics.js:134-161`
- **Popis a scénář selhání**:
  Veškerý postup uživatele (splněné dobré skutky, rozsvícená světla v chrámu, úroveň kočičky Molly) je ukládán výhradně do lokálního úložiště prohlížeče `localStorage` (`aa_completed_steps_v2`, `aa_sanctuary_wishes_v1`). Pokud uživatel přijde na web z odkazu na sociální síti (Instagram, Facebook, LinkedIn, TikTok), otevře se stránka ve vnořeném In-App WebView prohlížeči. Tyto webview kontejnery po zavření často kompletně zahodí veškerá lokální data. Uživatel, který provedl dobrý skutek, ztratí při příští návštěvě celý svůj postup. Navíc neexistuje možnost přenést postup mezi mobilem a počítačem.
- **Konkrétní návrh opravy**:
  Umožnit volitelné vygenerování anonymního textového kódu pro obnovu (passphrase), případně synchronizaci proti anonymnímu záznamu v databázi, a jasně uživatele informovat, že v režimu anonymního prohlížeče je postup vázán na dočasnou relaci.

---

### Nález 27: Těžké neoptimalizované grafické podklady způsobující paměťové špičky na mobilu
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/svet/+page.svelte:2280-2296`, `akcelerator-landing-page/src/lib/storyCard.js:88-91`
- **Popis a scénář selhání**:
  Pozadí svatyně na `/svet` a v generátoru příběhů načítá soubory `/art/sanctuary-dawn.jpg` (664 KB) a `/art/sanctuary-twilight.jpg` (602 KB). Jedná se o objemné JPEG soubory ve vysokém rozlišení. V souboru `storyCard.js` jsou oba dekódovány do paměti a kresleny na canvas 1080x1920 (přes 8 MB surových pixelů). Na levnějších mobilních zařízeních to způsobuje prudký nárůst spotřeby RAM a zpoždění při vykreslování stránky.
- **Konkrétní návrh opravy**:
  Převést obrázky do formátu WebP/AVIF s úsporou 70 % velikosti a nabídnout responsivní varianty pro mobilní rozlišení.

---

### Nález 28: Dva nepropojené AudioContexty a nesynchronizovaný stav ztlumení
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/svet/+page.svelte:95-119`, `akcelerator-landing-page/src/lib/sensoryEngine.js:24-34, 627-636`
- **Popis a scénář selhání**:
  Stránka `/svet` vytváří svůj vlastní nezávislý `AudioContext`:
  ```javascript
  let soundEnabled = false;
  /** @type {AudioContext | null} */
  let audioCtx = null;
  ```
  Tento kontext ignoruje globální nastavení zvuku v `sensoryEngine.js` (`isSoundMuted()`, klíč `aa_sound_muted`). Pokud uživatel v aplikaci globálně ztlumil zvuk, na stránce `/svet` toto nastavení neplatí. Zároveň existence dvou instancí `AudioContext` v jedné aplikaci naráží na limity mobilního Safari (iOS omezuje počet souběžných zvukových kontextů na záložku), což vede k selhání přehrávání audia.
- **Konkrétní návrh opravy**:
  Odstranit lokální `audioCtx` a `soundEnabled` ze souboru `/svet/+page.svelte` a veškeré generování tónů přesměrovat přes sdílený singleton v `sensoryEngine.js`.

---

### Nález 29: Vysoká paměťová režie a dvojitá alokace obrázku ve storyCard.js
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/storyCard.js:446-448`, `akcelerator-landing-page/src/routes/svet/+page.svelte:1022-1024`
- **Popis a scénář selhání**:
  Při generování karty pro sdílení:
  ```javascript
  const dataUrl = canvas.toDataURL('image/png');
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  return { dataUrl, blob };
  ```
  Pro plátno 1080x1920 px se současně vytvoří jak obrovský Base64 řetězec `dataUrl` (cca 11 MB textu v paměti), tak binární `Blob`. Vzniká dvojitá alokace stejného grafického obsahu, která na mobilních zařízeních v paměťové špičce přesahuje 30 MB a vede k zabití procesu prohlížeče operačním systémem.
- **Konkrétní návrh opravy**:
  Pozor: Použití `URL.createObjectURL(blob)` bez explicitního uvolňování alokovaných URL objektů vede k paměťovému úniku. V `svet/+page.svelte:1022-1024` se funkce `refreshStoryPreview` volá reaktivně při každém otevření vysouvacího panelu a při každé změně nastavení. Každé nové volání `createObjectURL` drží v paměti prohlížeče ~8 MB grafických dat až do úplného zavření stránky.
  Správné řešení:
  Generovat pouze binární `Blob`, pro zobrazení použít `URL.createObjectURL(blob)`, a při každém přegenerování náhledu explicitně uvolnit předchozí URL přes `URL.revokeObjectURL(previousUrl)` včetně úklidu v lifecycle hooku `onDestroy`.
  ```javascript
  // src/lib/storyCard.js
  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  return { blob };

  // src/routes/svet/+page.svelte
  let previewUrl = null;
  function updatePreview(newBlob) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(newBlob);
  }
  onDestroy(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });
  ```

---

### Nález 30: Křehká komunikace přes globální Window CustomEvents u modálních oken
- **Soubor a řádky**: `akcelerator-landing-page/src/components/FeedbackModal.svelte:94-102`, `akcelerator-landing-page/src/components/ImmediateHelp.svelte:6-14`, `akcelerator-landing-page/src/routes/+layout.svelte:155, 163`
- **Popis a scénář selhání**:
  Komunikace mezi navigační lištou a modálními okny probíhá přes window eventy:
  ```javascript
  window.dispatchEvent(new CustomEvent('akcelerator:open-feedback'));
  window.dispatchEvent(new CustomEvent('akcelerator:toggle-crisis'));
  ```
  Tento přístup obchází reaktivní strom Svelte. Pokud uživatel klikne na tlačítko v okamžiku, kdy ještě probíhá hydratace a komponenta modálu nemá v `onMount` zaregistrovaný listener, událost je ztracena a modál se neotevře. Pokud se komponenta modálu přemontuje, hrozí registrace vícenásobných posluchačů.
- **Konkrétní návrh opravy**:
  Nahradit globální DOM eventy explicitním Svelte storem (např. `isFeedbackOpen = writable(false)`, `isCrisisOpen = writable(false)`).

---

### Nález 31: Rozsáhlá duplicita kódu pro normalizaci textu a výpočty vzdálenosti napříč 10 soubory
- **Soubor a řádky**:
  - `stripLeadingEmoji` / `cleanTitle` (odstraňování emoji z názvů akcí):
    * `akcelerator-landing-page/src/lib/progress.js:219` (`stripLeadingEmoji`)
    * `akcelerator-landing-page/src/components/SmallWinCelebration.svelte:55-61` (`cleanTitle`)
    * `akcelerator-landing-page/src/routes/+page.svelte:518-525` (`cleanTitle`)
    * `akcelerator-landing-page/src/routes/app/guided/+page.svelte:207-216` (`cleanTitle`)
    * `akcelerator-landing-page/src/routes/app/online/+page.svelte:151-158` (`cleanTitle`)
    * `akcelerator-landing-page/src/routes/svet/+page.svelte:80-82` (`cleanTitle`)
    * `akcelerator-landing-page/src/lib/storyCard.js:66-68` (`cleanTitle`)
    * `akcelerator-landing-page/src/lib/analytics.js:174-176` (`cleanTitle`)
  - Příbuzné textové sanitizační a vyhledávací funkce:
    * `akcelerator-landing-page/src/routes/near/+page.svelte:107-112` (`normSearchStr` – normalizace NFD pro vyhledávání bez diakritiky)
    * `akcelerator-landing-page/src/routes/submit/+page.svelte:48-56` (`safeText` a `firstText` – sanitizace a parsování čárkou)
  - Výpočet vzdálenosti `haversineKm`:
    * `akcelerator-landing-page/src/lib/security.js:74-85`
    * `akcelerator-landing-page/src/routes/app/guided/+page.svelte:172-182`
- **Popis a scénář selhání**:
  Každý soubor používá mírně odlišnou implementaci a regulární výraz pro čištění textu a ořezávání emoji (některé soubory ošetřují varianty znaků `\uFE0F\u200D`, jiné pouze základní Unicode třídy). U složených emoji (např. profese s odstínem pleti) dochází k tomu, že v jedné části aplikace zůstávají viset nečitelné zbytkové znaky, zatímco jinde jsou oříznuty. Navíc sanitizace řetězců (`safeText`) je definována nezávisle v `security.js` i lokálně v `submit/+page.svelte`. Jakákoliv oprava nebo rozšíření v jednom souboru se neprojeví v ostatních místech.
- **Konkrétní návrh opravy**:
  Vyčlenit kanonické funkce `cleanTitle`, `stripLeadingEmoji`, `normSearchStr` a `haversineKm` do sdíleného modulu `akcelerator-landing-page/src/lib/utils.js` a importovat je konzistentně ve všech komponentách.

---

### Nález 32: Chybějící typová kontrola v build skriptech balíčku
- **Soubor a řádky**: `akcelerator-landing-page/package.json:12, 19-27`
- **Popis a scénář selhání**:
  V `package.json` je definován kontrolní skript:
  ```json
  "scripts": {
    "check": "svelte-kit sync"
  }
  ```
  Příkaz `svelte-kit sync` pouze generuje typové definice manifestu trasy SvelteKit, ale neprovádí žádnou statickou kontrolu typů ani šablon Svelte. V `devDependencies` navíc chybí balíček `svelte-check` a v kořenu projektu není `tsconfig.json`. Spuštění `npm run check` v CI/CD projde bez varování i v případě vážných syntaktických či typových chyb v komponentách.
- **Konkrétní návrh opravy**:
  Nainstalovat `svelte-check` do `devDependencies`, přidat kořenový `tsconfig.json` rozšiřující `.svelte-kit/tsconfig.json` a aktualizovat skript na `"check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"`.

---

### Nález 33: Tření při vyhledávání lokace a absence ukládání konceptu formuláře
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/submit/+page.svelte:231-285`
- **Popis a scénář selhání**:
  Ve formuláři přidání místa `/submit` musí uživatel zadat město a poté explicitně kliknout na tlačítko „Najít“, aby se vyplnily souřadnice `lat` a `lon`. Pokud uživatel město vyplní, ale na tlačítko neklikne a rovnou klikne na „Odeslat tip“, formulář tiše selže na validaci chybějících souřadnic s chybovou hláškou na spodku stránky mimo zorné pole. Formulář navíc neukládá rozpracovaný koncept do `sessionStorage`. Pokud uživatel omylem klikne na odkaz nebo zavře záložku, veškerý napsaný text je ztracen.
- **Konkrétní návrh opravy**:
  1. Pokud jsou `lat` a `lon` prázdné, ale pole města je vyplněno, provést automatické dohledání souřadnic na pozadí při stisku „Odeslat“.
  2. Průběžně ukládat rozepsaná pole do `sessionStorage` a při návratu na formulář je automaticky obnovit.

---

### Nález 34: Nevyžádaná inicializace AudioContextu při mountu porušující pravidla prohlížeče pro autoplay
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/sensoryEngine.js:3094-3100`
- **Popis a scénář selhání**:
  Při inicializaci akce `mountImpactCanvas`:
  ```javascript
  const shouldPlayOnMount = p?.climax !== undefined ? Boolean(p.climax) : !p?.silent;
  if (shouldPlayOnMount) playPayoffAsmr(action);
  ```
  Pokud není explicitně předáno `silent: true`, funkce okamžitě volá syntézu zvuku při připojení prvku do DOMu. Prohlížeče (zejména Safari a Chrome na mobilních platformách) striktně blokují spuštění zvuku před prvním uživatelským gestem (kliknutím). V konzoli se hromadí chyby `The AudioContext was not allowed to start` a stav audiosystému přechází do zablokovaného stavu `suspended`.
- **Konkrétní návrh opravy**:
  Spouštět zvuk výhradně v reakci na explicitní uživatelskou událost (např. kliknutí na tlačítko nebo interakci s kartou), nikoliv automaticky v montovacím hooku.

---

### Nález 35: Chyba časovače při rychlém návratu od partnerské organizace
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/+page.svelte:195-226`, `akcelerator-landing-page/src/lib/sensoryEngine.js:1123-1137`
- **Popis a scénář selhání**:
  Aplikace detekuje návrat uživatele z externího webu partnerské organizace (např. z darovacího portálu). Funkce `consumePendingPartnerReturn(3000)` vyžaduje, aby od odchodu uběhlo minimálně 3 000 ms. Pokud uživatel klikne na partnerský odkaz a okamžitě se přepne zpět (např. za 2,5 s), událost `visibilitychange` zavolá funkci, ta vrátí `null` a žádná další kontrola se již nenaplánuje. Když pak uživatel na stránce zůstane, uvítací oslava návratu a potvrzení se nikdy nespustí.
- **Konkrétní návrh opravy**:
  Pokud je návrat detekován před uplynutím minimálního času, naplánovat kontrolu se zpožděním přes `setTimeout` na zbývající časový interval.

---

### Nález 36: Duplicitní implementace akce impactCanvas
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/+page.svelte:404-444`
- **Popis a scénář selhání**:
  V souboru `+page.svelte` je nadefinována privátní funkce `function impactCanvas(node, params)`, která duplikuje a částečně modifikuje kanonickou implementaci z `src/lib/sensoryEngine.js`. Obě verze mají odlišné zpracování parametrů a odlišné životní cykly. Vzniká nekonzistence chování plátna na hlavní stránce oproti stránkám `/near` a `/app/online`.
- **Konkrétní návrh opravy**:
  Smazat lokální definici `impactCanvas` z `+page.svelte` a importovat jednotnou funkci z `$lib/sensoryEngine.js`.

---

### Nález 37: Chyba kódování Mailto URI dle RFC 6068 způsobující nefunkčnost v nativních e-mailových klientech
- **Soubor a řádky**: `akcelerator-landing-page/src/lib/data/czech-actions.js:1874-1876`
- **Popis a scénář selhání**:
  Generování odkazu pro kontaktování organizace:
  ```javascript
  const safeMail = sanitizeEmail(place?.email);
  const mailtoUrl = safeMail
    ? `mailto:${encodeURIComponent(safeMail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  ```
  Adresa příjemce je prohnána funkcí `encodeURIComponent(safeMail)`, která nahradí zavináč `@` za `%40` (např. `info%40utulek.cz`). Dle standardu RFC 6068 musí být e-mailová adresa v části `to` platným mailboxem; kódování znaku `@` do `%40` způsobuje, že nativní e-mailoví klienti na mobilních zařízeních (iOS Mail, výchozí Android e-mail, Gmail intent) odmítnou adresu jako syntakticky neplatnou a zobrazí chybu neexistujícího příjemce.
- **Konkrétní návrh opravy**:
  Nekódovat samotnou e-mailovou adresu, ale pouze parametry dotazu (`subject` a `body`):
  ```javascript
  const mailtoUrl = safeMail
    ? `mailto:${safeMail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;
  ```

---

### Nález 38: Chybějící kontaktní údaje v hlavičce User-Agent pro Nominatim a Overpass
- **Soubor a řádky**: `akcelerator-landing-page/src/routes/api/geocode/+server.js:117`, `akcelerator-landing-page/src/routes/api/nearby/+server.js:152`
- **Popis a scénář selhání**:
  Při komunikaci s veřejnými servery OpenStreetMap:
  ```javascript
  'user-agent': 'AkceleratorAltruismu/2.5 (SvelteKit; Czech-only)'
  ```
  Podmínky použití (Acceptable Use Policy) služeb Nominatim i Overpass API výslovně vyžadují, aby hlavička `User-Agent` obsahovala platný kontaktní údaj (funkční e-mailovou adresu správce nebo URL adresu projektu). Pokud automatizované monitorovací systémy OpenStreetMap detekují provoz s User-Agentem bez kontaktních údajů, je tento User-Agent zařazen na černou listinu a veškeré požadavky jsou plošně odmítány s HTTP 403 Forbidden.
- **Konkrétní návrh opravy**:
  Doplnit kontaktní e-mail a URL projektu do hlavičky:
  ```javascript
  'user-agent': 'AkceleratorAltruismu/2.5 (https://akcelerator-altruismu.cz; info@akcelerator-altruismu.cz)'
  ```
