# AUDIT REPOZITÁŘE A AKČNÍ PLÁN: AKCELERÁTOR ALTRUISMU
**Převzetí vývoje, produktové logiky a architektury po prototypovacím modelu Argon**  
**Tým seniorních expertů:** Product & Behavioral Strategist, Principal System Architect, Lead Mobile & UX Engineer  
**Datum:** 11. listopadu 2026  
**Stav repozitáře:** Read-only inspekce dokončena. Žádný existující soubor nebyl změněn.

---

## 1. Upřímná diagnóza produktu a kódu

### 1.1 Vyhodnocení naplnění hlavního motta
> **Existenciální cíl projektu:**  
> *„Aby pomoc druhým byla tak jednoduchá, přímočará a okamžitá, jako vyhonit si nad pornem.“*

Při konfrontaci existujícího repozitáře s tímto mottem je diagnóza nekompromisní: **Aplikace ve svém současném stavu toto motto absolutně nenaplňuje a v praxi funguje jako jeho pravý opak.**

Co toto motto vyžaduje z hlediska produktové psychologie a neurobiologie:
1. **Nulové kognitivní tření:** Okamžitý vizuální a emocionální impulz v první vteřině bez nutnosti cokoliv číst, luštit nebo filtrovat.
2. **Tah na branku na 1 klik:** Jeden jediný, dominantní a nezpochybnitelný další krok přímo před očima. Žádné rozhodovací paralýzy, žádná administrativa, žádné moralizování.
3. **Blesková dopaminová odměna (Instant Payoff):** Fyziologicky citelná odezva (haptika, zvuk, vizuální satisfakce) bezprostředně vteřinu po vykonání impulzu, která v mozku uzavře smyčku odměny a vyplaví pocit úlevy a hrdosti.

Co namísto toho prototypovací model Argon reálně vytvořil v kódu:
* Místo bezprostředního impulzu uživatel dostává **4 200 pixelů dlouhou rolovací stěnu** (7–8 obrazovek mobilu) plnou akademického žargonu efektivního altruismu, hodnocení vědecké relevance a tříštících se nabídek.
* Místo 1 tahu na branku se na úvodní obrazovce nachází **více než 45 samostatných klikatelných elementů**.
* Místo bleskového kliknutí tlačítko nutí uživatele držet stisk (`HoldSparkButton`), čímž uměle zdržuje odchod.
* Místo okamžité odměny je uživatel přesměrován na cizí web třetí strany v novém tabu; pokud se vrátí, čeká ho 3sekundová prodleva (`partnerReturnService.js`), nutnost ručně potvrdit splnění skutku a následný nucený přesun do 112KB herního světa (`/svet`), kde má nakrmit virtuální kočku Molly získaným pamlskem.

Aplikace v současné podobě nepůsobí jako bleskový akcelerátor pomoci, ale jako směs psychologické poradny, akademické konference a virtuálního zverimexu.

---

### 1.2 Kde aplikace nejvíce selhává v okamžité srozumitelnosti a tahu na branku

#### A. Selhání 3vteřinového testu a invazivní plovoucí chrom
Na typickém mobilním rozlišení (375×667 px / 390×844 px) zabírá navigační chrom a plovoucí widgety **přes 210 px (více než 30 % vertikální plochy)**:
* `akcelerator-landing-page/src/routes/+layout.svelte` (řádky 69–123 a 184–212):
  1. Fixní horní kapsle `.top-nav` (značka + desktopové menu).
  2. Plovoucí mobilní lišta `.mobile-bottom-nav` s 5 záložkami (`Dnes`, `Skutky`, `V okolí`, `Krajina`, `Průvodce`).
  3. Plovoucí FAB krizové pomoci `<ImmediateHelp />` (řádek 208, tlačítko „🛡️ Opora 24/7“).
  4. Plovoucí tlačítko zpětné vazby `<FeedbackModal />` (řádek 210, „💬 Zpětná vazba“).
  5. Plovoucí virtuální patronka `<MollyCompanion />` (řádek 211, pelíšek dock s čítačem pamlsků a tlačítkem pohlazení).

Na obrazovce o šířce 360–375 px zbývá mezi levým a pravým plovoucím tlačítkem pouhých **169 px**. Do tohoto úzkého koridoru se navíc snaží vejít 75px toulavá kočka Molly. Uživatel při pokusu o posun stránky nechtěně aktivuje krizovou linku nebo kočičí pelíšek.

#### B. Hero `100svh` Trap a falešný CTA scroll
V `akcelerator-landing-page/src/lib/features/home/HeroSection.svelte`:
* Řádky 405–412: Styl pro mobilní telefony nastavuje `.hero-copy` vlastnost `min-height: calc(100svh - 6rem)`. Čistě textový blok (nadpis, odstavec a 2 tlačítka) tak zabere celou výšku obrazovky.
* Samotná karta s akcí (`ActionCard`), která má být jádrem aplikace, je odsunuta mimo první obrazovku pod záhyb.
* Aby se k ní uživatel dostal, Argon přidal berličku v podobě tlačítka pro javascriptový smooth-scroll (řádky 84–91):
  ```svelte
  <a href="#dnesni-skutek" class="hero-btn primary hero-btn-mobile" on:click={handleActionAnchorClick}>
    <span>⚡ Dnešní skutek (2 min) ↓</span>
  </a>
  ```
* Toto hlavní mobilní tlačítko **nepředstavuje žádnou akci** – pouze posune stránku o 700 px dolů na kotvu `#dnesni-skutek`. Uživatel po vstupu na web vidí poletující světlušky (`.firefly`), nabídku krizové linky 116 111, tlačítko se šipkou dolů a vedle něj odkaz do Krajiny dobra. Nechápe, co má web dělat, ani jaký je okamžitý krok.

#### C. Intelektualizace a akademický filtr (Over-engineering v copy a UI)
V `akcelerator-landing-page/src/lib/features/actions/components/ActionCard.svelte`:
* Řádky 91–107: Karta otevírá meta-informacemi `quick-tags-pill` a komponentou `<EvidenceBadge tier={action.impactEvidence || 'B'} />` (hodnocení vědecké relevance A/B/C).
* Řádky 118–131: Blok `Přínos (doložený): ... Bez registrace na našem webu · Aktivita probíhá u ...`.
* Řádky 133–150: Rozbalovací akordeon `<details class="how-toggle">` s kauzálním řetězcem:
  `Aktivita: ... → Výsledek: ... → Skutečný dopad: ...`.
* Místo čistého emocionálního a přímočarého podnětu (např. *„Jedním klepnutím naplň misku psovi v útulku. Sponzor zaplatí granule za tebe.“*) je unavený uživatel konfrontován s metodologií efektivního altruismu a byrokratickým rozpadem kroků.

#### D. Mechanické tření – `HoldSparkButton`
V `ActionCard.svelte` (řádky 285–293) a `sensoryEngine.js` (řádky 1440–1520):
```svelte
<a href={action.url} target="_blank" class="btn-studio-primary" data-hold-spark="true"
   on:pointerdown={handlePrimaryPointerDown} on:pointerup={...}>
   <span>Začít pomáhat</span>
</a>
```
Tlačítko nutí uživatele držet stisk (`startHoldSpark`), aby se nabil vizuální efekt jiskření, než dojde k otevření odkazu. Místo bleskového klepnutí je zde zavedena umělá mechanická prodleva.

#### E. Rozbitá dopaminová smyčka (The Broken Dopamine Loop)
* Kliknutím na `Začít pomáhat` (`ActionCard.svelte`, řádek 464) je uživatel vyhozen z aplikace na cizí web v novém tabu. Mobilní uživatel opouští kontext aplikace a ve více než 70 % případů se již nevrátí.
* Pokud se vrátí, logika v `partnerReturnService.js` a `+page.svelte` (řádky 210–267) čeká 3 000 ms a teprve poté zobrazí dialog:
  *„✨ Vítej zpět! Povedlo se? Potvrď svůj dobrý skutek a rozsviť lucernu v Krajině dobra.“*
* Uživatel musí kliknout na potvrzení, následně je mu nabídnut odkaz na trasu `/svet` (`ActionCard.svelte`, řádek 225) a na trase `/svet` (`svet/+page.svelte`, 3 535 řádků) musí kliknout na krmení kočky Molly pamlskem (`molly-sanctuary-pill`).
* **Výsledek:** Odměna je odložená o minuty, rozbitá do tří kroků a vyžaduje přesun na jinou URL adresu. Tah na branku je ztracen.

#### F. Tříštění pozornosti (45+ klikatelných elementů)
DOM inspekce trasy `/` odhalila **přes 45 samostatných klikatelných elementů**:
1. Horní navigace: 7 odkazů.
2. Hero sekce: 2 tlačítka.
3. Karta rychlého startu: tlačítko „Jiný tip“, 4 přepínače energie (`Mám 2 min`, `Mám 15 min`, `Osobně`, `Dlouhodobě`).
4. Samotná karta akce: odkaz na téma, evidence badge, akordeon, tlačítko „Začít pomáhat“, tlačítko „Už mám hotovo“, plátno s tlačítkem „✨ Impuls“, tlačítko ztlumení zvuku 🔇, sdílet odkaz, nahlásit chybu, odkaz na zdroj.
5. Sekce Bento: 3 velké rozcestníky + lišta měst (8 odkazů na města + „Všechny obce“).
6. Teaser Krajiny dobra: 2 tlačítka + klikací náhled.
7. Kolotoč dobrých zpráv: odkaz na zdroj, tlačítko „↻ Další důkaz naděje“.
8. Šuplík portálů: rozklikávací seznam českých platforem + odkaz „Přidat tip“.
9. Patička: 6 navigačních linků + 3 akční tlačítka.
10. Plovoucí prvky: krizový FAB, feedback pill, pelíšek dock Molly (2 tlačítka), spodní mobilní lišta (5 záložek).

Uživatel nemá šanci vnímat JEDEN nepochybný krok. Pozornost je rozmetána.

---

### 1.3 Co naopak funguje jako solidní základ pro restart

Přes výše uvedené výtky má projekt mimořádně silné jádro, na kterém lze postavit špičkový produkt:

1. **Moderní, bleskový technologický stack:**
   SvelteKit 2 (`^2.70.4`) + Svelte 5 (`^5.57.3`) + Vite. Framework nabízí prakticky nulový runtime overhead, bleskový náběh pod 100 ms a vynikající předpoklady pro serverové i statické vykreslování.
2. **Bohatý a autentický katalog českých mikro-skutků:**
   V souboru `src/lib/data/czech-actions.js` se nachází databáze **35+ ověřených českých mikro-skutků** (`MICRO_ACTIONS`) a desítky komunitních míst (`CURATED_FALLBACK_PLACES`). Skutky jsou reálné, smysluplné a pokrývají klikání pro zvířata (Click and Feed), záchranu jídla (Nesnězeno), registraci dárců dřeně, Záchranku i lokální dobrovolnictví.
3. **Funkční Web Audio syntetizér:**
   `src/lib/sensoryEngine.js` a audio moduly obsahují poctivě naprogramované procedurální Web Audio generátory. Po odříznutí přebujelého balastu (předení kočky, ASMR) představují skvělý základ pro okamžitou, vřelou hapticko-zvukovou odezvu při dokončení akce přímo v prohlížeči bez stahování externích MP3.
4. **Pevná kostra PWA a offline provozu:**
   `src/service-worker.js` má správně postavenou Cache-First strategii pro statické assety buildu, Network-First pro navigaci a podporu manifestu. Stačí doplnit offline synchronizaci akcí a cachování dat.

---

## 2. Návrh nového průchodu a produktové logiky

### 2.1 Konkrétní návrh úpravy vstupní obrazovky (Zero-Scroll Landing View)

* **Úplné odstranění 100svh textového hero bloku:**
  Smazat monolog o tom, že „pomáhat může být lehké“. Místo řečí rovnou nabídnout pomoc.
* **Akční karta JE samotným landing view (100dvh bez rolování):**
  Uživatel po otevření webu vidí kompletní rozhraní na jediném displeji telefonu bez nutnosti pohnout prstem po skle.

#### Rozvržení prvků na obrazovce mobilu (100dvh):
```
┌────────────────────────────────────────────────────────┐
│  Akcelerátor altruismu                          [ 🛡️ ] │  <-- 40px subtilní lišta
├────────────────────────────────────────────────────────┤
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │                                                  │  │
│  │   [ Velká vizuální karta: Útulek / Pes / Miska ] │  │
│  │                                                  │  │
│  │   Jedním klepnutím naplň misku                   │  │
│  │   psovi v útulku.                                │  │
│  │                                                  │  │
│  │   Sponzor zaplatí granule za tebe.               │  │
│  │   Zdarma · 10 vteřin                             │  │
│  │                                                  │  │
│  │   ┌──────────────────────────────────────────┐   │  │
│  │   │   🐾 KLEPNOUT A NAPLNIT MISKU   →        │   │  │  <-- 56px MASIVNÍ CTA
│  │   └──────────────────────────────────────────┘   │  │
│  │                                                  │  │
│  │   ℹ️ Jak to funguje (důkazy a partner)           │  │  <-- Tichý infobox
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│   [ ↻ Jiný tip ]              [ 📍 Chci pomoct venku ] │  <-- 2 tiché alternativy
└────────────────────────────────────────────────────────┘
```

1. **Subtilní horní linka (výška 40 px):**
   Vlevo minimalistický nápis `Akcelerátor altruismu`. Vpravo tichá ikona štítu `🛡️` otevírající krizovou oporu (žádné křiklavé plovoucí bannery).
2. **Střed obrazovky – Karta akce:**
   * Žádné hodnocení vědecké relevance A/B/C v záhlaví.
   * Úderný titulek v lidském jazyce: **„Jedním klepnutím naplň misku psovi v útulku.“**
   * Subtitul: *„Sponzor zaplatí granule za tebe. Zdarma · 10 vteřin.“*
   * **JEDNO MASIVNÍ PRIMÁRNÍ TLAČÍTKO (Plná šířka, výška 56 px, kontrastní barva):**  
     `🐾 Klepnout a naplnit misku →`
   * Pod tlačítkem pouze diskrétní odkaz `ℹ️ Jak to funguje`, který v lehkém spodním listu (bottom-sheet) zobrazí partnera a metodologii pro ty, které to zajímá.
3. **Spodní ovládací linka (Pouze 2 tiché alternativy):**
   * Vlevo: `↻ Jiný tip` (bleskové otočení karty / swipe na jiný skutek pod 50 ms).
   * Vpravo: `📍 Chci pomoct venku` (odkaz na zjednodušenou mapu `/near`).

---

### 2.2 Informační hierarchie a „15vteřinový dopaminový kruh“

Cílem je zkrátit čas od otevření aplikace po pocit hrdosti na méně než 15 vteřin:

```
[ 0–3 s: VSTUP ] ────────> [ 3–10 s: AKCE ] ────────> [ 10–15 s: ODMĚNA ] ────> [ VOLBA DALŠÍHO KROKU ]
  Nulové čtení               1 klepnutí                 Haptický ráz (40 ms)        🌿 Pro dnešek stačí
  Žádné scrollování          Okamžitá reakce            Teplý Web Audio tón         ✨ Zkusit ještě jeden
  Žádná kočka                Žádný hold-spark           Miska se naplní zlatem      🌊 Odpočinout v Krajině
```

* **Zrušení zpoždění `HoldSparkButton`:** Tlačítko reaguje bleskově na standardní `pointerup/click`.
* **Konec rozhodovací paralýzy:** Uživatel na úvodu nevolí mezi 4 časovými kategoriemi (`2 min`, `15 min`, `Osobně`, `Dlouhodobě`). Aplikace mu rovnou naservíruje nejlepší 2minutový skutek. Pokud chce jiný, jedno klepnutí na `↻ Jiný tip` mu okamžitě nabídne další.

---

### 2.3 In-situ blesková odměna (Okamžitá satisfakce na kartě)

Stávající absurdní přesun na externí web s následným nuceným přechodem do `/svet` se ruší:

1. **Okamžitá příprava v aplikaci:**
   Při klepnutí na akční tlačítko se v aplikaci otevře externí partner (in-app prohlížeč nebo nová záložka) a karta na pozadí se **přepne do stavu oslavy**.
2. **Reakce na návrat (události `pageshow` / `visibilitychange`):**
   Jakmile se uživatel vrátí na záložku Akcelerátoru, **nenutíme ho nic potvrzovat ani odcházet jinam**:
   * **Haptika:** Okamžitý mikropulz přes Web Vibration API (`navigator.vibrate([40, 30, 60])`).
   * **Zvuk:** Teplý harmonický akord syntetizovaný přímo ve Web Audio (žádné čekání na stažení audia).
   * **Vizuální odměna na kartě:** Miska se zaplní, zlatá vlna částic přímo v těle karty:  
     *„Miska je plná! Jsi skvělý/á. Dnes už 1 420. dobrý skutek v Česku.“*
3. **Závěrečná úleva (Respekt k energii uživatele):**
   Pod odměnou se zobrazí dvě vyrovnané možnosti:
   * **`🌿 Pro dnešek mám splněno (Zavřít s čistou hlavou)`** – psychologické povolení odložit telefon a netrpět výčitkami.
   * `✨ Chci udělat ještě jeden drobný skutek →`

---

### 2.4 Vyjasnění role sub-stránek a úklid informační architektury

1. **Domovská stránka (`/`):**
   Jediný bleskový Akcelerátor altruismu. Žádné rozcestníky.
2. **Krajina dobra (`/svet`):**
   * **Přestává být nuceným krokem po každém skutku.**
   * Stává se dobrovolnou **svatyní klidu** pro ty, kteří chtějí meditovat, prodýchat úzkost dechovým trenažérem nebo se v noci podívat na rozsvícené lucerny.
   * **Kočka Molly se natrvalo stěhuje do `/svet`:** Na úvodní stránce Molly ruší a překáží; v Krajině dobra u jezera má své přirozené místo, kde dává smysl ji hladit a krmit.
3. **Mapa pomoci v okolí (`/near`):**
   * Radikálně odlehčit: odstranit 2 955 řádků monologu, zbytečné filtry 80 obcí a 3sekundové dotazy na německý Overpass.
   * Zachovat jako lehkou GPS mapu na 1 klik: zjistit polohu -> ukázat **3 nejbližší ověřená místa** (knihobudka, potravinová banka, útulek) s předpřipraveným textem SMS/zprávy a tlačítkem navigace.
4. **Zrušení sirotčích a duplicitních tras:**
   * Smazat sirotčí rozcestník `src/routes/app/+page.svelte`.
   * Trasy `/app/guided` a `/app/online` sloučit s hlavní logikou nebo nahradit lehkým swipe-deckem na domovské stránce.

---

## 3. Architektonické a nástrojové změny

### 3.1 Bezpečnost, tajné klíče a konfigurace prostředí

#### Nález 1: Ostré klíče a hesla k produkční databázi na disku
* `akcelerator-landing-page/.env`:
  * Řádek 3: `API Key=<REDACTED_SUPABASE_SECRET>`
  * Řádek 5: `PUBLIC_SUPABASE_ANON_KEY="<REDACTED_ANON_JWT>"`
  * Řádek 6: `SUPABASE_SERVICE_ROLE_KEY="<REDACTED_SERVICE_ROLE_JWT>"`
* `akcelerator-landing-page/.env.local`:
  * Řádek 6: `POSTGRES_PASSWORD="<REDACTED_DB_PASSWORD>"`
  * Řádek 7: `POSTGRES_PRISMA_URL="postgres://postgres.<project-ref>:<REDACTED_DB_PASSWORD>@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"`
  * Řádek 12: `SUPABASE_JWT_SECRET="<REDACTED_JWT_SECRET>"`
* **Doporučená náprava:**
  Okamžitá rotace všech API klíčů, JWT secretu a hesla k databázi v konzoli Supabase. Odstranění ostrých hodnot z `.env` i `.env.local`. Zachovat výhradně `.env.example` s prázdnými placeholdery.

#### Nález 2: Serverový klient Supabase kompletně vyřazuje Row Level Security (RLS)
* `akcelerator-landing-page/src/lib/server/supabase.js` (řádky 22–27, 41–42, 64–72):
  Funkce `getServerSupabase()` přednostně načítá `SUPABASE_SERVICE_ROLE_KEY`. Všechny dotazy ze serveru tak běží pod rolí PostgreSQL superusera (`service_role`). Veškeré politiky RLS jsou zcela ignorovány.
* **Doporučená náprava:**
  Přepnout klienta na `PUBLIC_SUPABASE_ANON_KEY`. `service_role` smí být použit výhradně v izolovaných administrativních úlohách, nikdy pro běžné dotazy uživatelů.

#### Nález 3: Předávání superuser klíče v HTTP hlavičce pro moderaci
* `akcelerator-landing-page/src/routes/api/submissions/+server.js` (řádky 229–236):
  ```javascript
  export async function PATCH({ request }) {
    const modSecret = (request.headers.get('x-moderator-secret') || '').trim();
    const expectedSecret = (
      privateEnv.MODERATOR_SECRET ||
      privateEnv.SUPABASE_SERVICE_ROLE_KEY ||
      privateEnv.SUPABASE_SECRET_KEY ||
      ''
    ).trim();
  ```
  Pokud administrátor nenastavil `MODERATOR_SECRET`, endpoint očekává v plaintextové hlavičce `x-moderator-secret` master klíč `SUPABASE_SERVICE_ROLE_KEY`. Klientský prohlížeč tak posílá plná administrátorská práva přes síť.
* **Doporučená náprava:**
  Zrušit fallback na `SUPABASE_SERVICE_ROLE_KEY`. Vyžadovat dedikovaný kryptografický token nebo autentizaci přes Supabase Auth.

#### Nález 4: Zranitelná testovací zadní vrátka pro rate-limiting
* `akcelerator-landing-page/src/lib/security.js` (řádky 406–413):
  ```javascript
  export function isAuthorizedTestBypass(request) {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' && process.env?.VERCEL_ENV === 'production') {
      return false;
    }
    const headerSecret = request.headers.get('x-test-bypass-secret');
    const expected = (typeof process !== 'undefined' && process.env?.TEST_BYPASS_SECRET) || 'akcelerator-dev-test';
    return Boolean(headerSecret && headerSecret === expected);
  }
  ```
  Pokud aplikace běží mimo produkční Vercel (např. preview deployment, staging, vlastní VPS), zasláním `x-test-bypass-secret: akcelerator-dev-test` útočník kompletně vypne veškerý rate-limiting a spam filtry.
* **Doporučená náprava:**
  Zrušit hardcoded fallback `'akcelerator-dev-test'`. Pokud není explicitně definován `TEST_BYPASS_SECRET` v privátních proměnných, bypass je vždy neplatný.

#### Nález 5: In-memory Rate Limiting nefunkční v Serverless prostředí
* `akcelerator-landing-page/src/lib/security.js` (řádek 13):
  `const RATE_LIMIT_BUCKETS = new Map();`
  V serverless prostředí (Vercel Functions) má každá lambda instance vlastní paměť. In-memory mapa neposkytuje žádnou ochranu proti distribuovanému spamu.
* **Doporučená náprava:**
  Pro produkční rate-limiting nasadit Upstash Redis REST nebo edge rate-limiter, případně integrovat ochranu na úrovni Cloudflare / Vercel Firewall.

---

### 3.2 Závažný rozpor databázového schématu a dokumentace

Oficiální instrukce pro nasazení (`DEPLOYMENT_INSTRUCTIONS.md`) jsou v přímém rozporu se zdrojovým kódem. Pokud by kdokoliv nasadil databázi podle dokumentace, aplikace okamžitě havaruje na SQL chybách `column does not exist`:

1. **Nekompatibilita tabulky `feedback`:**
   * `DEPLOYMENT_INSTRUCTIONS.md` (řádky 25–30) vytváří sloupce: `id, text, emotion, rating, created_at`.
   * `akcelerator-landing-page/src/routes/api/feedback/+server.js` (řádky 115–122) vkládá:  
     `message, category, page_url, contact, user_agent, status`.  
     *Žádný z těchto sloupců v SQL schématu neexistuje!*
2. **Nekompatibilita tabulky `community_submissions`:**
   * `DEPLOYMENT_INSTRUCTIONS.md` (řádky 40–58) vyžaduje povinný sloupec `kind TEXT NOT NULL` a sloupce `website, email, phone, postcode...`.
   * `akcelerator-landing-page/src/routes/api/submissions/+server.js` (řádky 142–154) vkládá objekt bez sloupce `kind` a naopak posílá neexistující sloupce `address, url, contact, ip_hash`. Insert selže na porušení `NOT NULL` constraintu.
3. **Zcela chybějící DDL pro `pulse_events`:**
   * `akcelerator-landing-page/src/routes/api/pulse/+server.js` (řádky 195 a 336) provádí selecty a inserty do tabulky `pulse_events`. V `DEPLOYMENT_INSTRUCTIONS.md` tato tabulka vůbec není uvedena.
4. **Absence migračního systému:**
   V repozitáři chybí jakékoliv verzování schématu (`supabase/migrations/`).
* **Doporučená náprava:**
  Založit adresář `supabase/migrations/0001_initial_schema.sql` se skutečně používaným schématem, sjednotit názvy sloupců v kódu i DDL a aktualizovat dokumentaci.

---

### 3.3 Výkonnost, síťové prodlevy a CDN cachování

1. **3sekundový Overpass API bottleneck:**
   * `akcelerator-landing-page/src/routes/api/nearby/+server.js` (řádky 145–180):  
     Při každém otevření mapy server závodí (`Promise.any`) proti 3 přetíženým veřejným zrcadlům OpenStreetMap Overpass s timeoutem 3 000 ms.
   * Uživatel na mobilu běžně čeká celé 3 sekundy na bílou obrazovku, než požadavek spadne do lokálního fallbacku.
   * **Doporučená náprava:**  
     Zrušit live dotazování na externí německá zrcadla. Nahradit statickým předem vygenerovaným souborem českých míst (GeoJSON) nebo PostGIS tabulkou v Supabase. Odezva klesne z 3 000 ms pod 50 ms.
2. **Umělé zpoždění geokódování (Nominatim rate limit):**
   * `akcelerator-landing-page/src/routes/api/geocode/+server.js` (řádky 96–104):  
     `scheduleNominatimRequest(minIntervalMs = 1100)` uměle zdržuje každé vyhledání adresy o více než sekundu.
3. **Úplná likvidace Edge CDN cachování v `hooks.server.js`:**
   * `akcelerator-landing-page/src/hooks.server.js` (řádky 26–34):
     ```javascript
     if (
       event.request.method === 'GET' &&
       response.status === 200 &&
       !event.url.pathname.startsWith('/api/') &&
       !headers.has('cache-control') &&
       (headers.get('content-type') || '').includes('text/html')
     ) {
       headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
     }
     ```
   * Každá HTML stránka (včetně čistě statické úvodní stránky) má výslovně zakázáno cachování na Edge síti Vercelu! Každá mobilní návštěva musí vyvolat studený start serverless funkce (prodleva 200–800 ms TTFB).
   * **Doporučená náprava:**  
     Nahradit hlavičkou `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`. Úvodní stránka se bude servírovat z Edge CDN s TTFB pod 30 ms.
4. **Masivní objem klientského JavaScriptu:**
   V `.svelte-kit/output/client/_app/immutable/chunks` mají největší chunk soubory:  
   `DD4GqyS1.js` (192 KB), `Byf149Wh.js` (150 KB), `svet` uzel (76 KB), `near` uzel (64 KB). Úvodní stránka stahuje přes **450 KB minifikovaného JS**.

---

### 3.4 Technický dluh po prototypování (Argon dluh)

#### A. Layout Thrashing smyčka v `MollyCompanion.svelte` (2 770 řádků)
* Soubor `akcelerator-landing-page/src/components/MollyCompanion.svelte` je namountován globálně v `+layout.svelte` (řádek 211) na všech stránkách.
* Běží v něm nepřetržitá animační smyčka `requestAnimationFrame` (řádky 2023, 2030).
* V metodě `collectObstacles` (řádky 533–577):
  ```javascript
  const nodes = document.querySelectorAll(OBSTACLE_SELECTOR);
  for (const el of nodes) {
    const r = el.getBoundingClientRect(); // VYNUCUJE SYNCHRONNÍ REFLOW
    const cs = getComputedStyle(el);      // VYNUCUJE VÝPOČET STYLŮ
  }
  ```
* Následně v `findBestSpot` (řádky 643–659) prochází šířku okna po krocích **10 px** a pro každý bod testuje kolize se všemi nalezenými elementy v DOMu. Na mobilních telefonech to způsobuje desítky nucených synchronních reflows za sekundu, přehřívání procesoru a trhání animací.

#### B. 6 zombie komponent v repozitáři (0 importů v aplikaci)
V repozitáři existují komponenty, které model Argon vytvořil pouze proto, aby prošly syntetické unit testy kompilace v `tests/unit/components.test.js`, ale v samotné aplikaci **nejsou nikde importovány**:
1. `src/lib/features/actions/components/HoldSparkButton.svelte` (3,1 KB) – 0 importů.
2. `src/lib/features/actions/components/PartnerReturnModal.svelte` (4,4 KB) – 0 importů.
3. `src/lib/features/map/components/CategoryFilters.svelte` (3,8 KB) – 0 importů.
4. `src/lib/features/map/components/FirstContactModal.svelte` (4,9 KB) – 0 importů.
5. `src/lib/features/map/components/GeocodeSearch.svelte` (5,4 KB) – 0 importů.
6. `src/lib/features/map/components/LeafletMap.svelte` (15,8 KB) – 0 importů.
7. Sirotčí rozcestník `src/routes/app/+page.svelte` (222 řádků) – nikde nelinkováno.

#### C. Byte-to-byte identické soubory a forwarder záplaty
* Identické kopie:
  * `src/lib/features/home/HeroSection.svelte` vs. `src/lib/features/home/components/HeroSection.svelte` (13 022 B, 547 řádků – binárně identické soubory).
  * `src/lib/features/home/QuickStartSection.svelte` vs. `src/lib/features/home/components/QuickStartSection.svelte` (identické 17řádkové wrappery).
* Opičí forwardery vytvořené pro záplatování špatných importů v testech:
  * `src/lib/components/MollyCompanion.svelte` (pouhý 6řádkový forwarder na `../../components/MollyCompanion.svelte`).
  * `src/lib/stores/mollyStore.js` (2řádkový forwarder na `../mollyStore.js`).
  * `src/routes/api/test-supabase/+server.js` (forwarder na `api/feedback/+server.js`).

#### D. Monolitický barrel `czech-actions.js`
Soubor `src/lib/data/czech-actions.js` re-exportuje 21 různých entit včetně `MICRO_ACTIONS` (68 KB dat) a `CURATED_FALLBACK_PLACES` (50 KB dat). Každá komponenta, která z něj cokoliv importuje, táhne do svého grafu závislostí masivní statická data, což znemožňuje efektivní tree-shaking ve Vite.

#### E. Trojí duplicita aplikační logiky akčních karet
Logika karty akce (měření odchodu, návratový dialog, canvas dopadu, badge důkazů, zvukové efekty) je implementována třikrát nezávisle na sobě:
1. `src/lib/features/actions/components/ActionCard.svelte` (1 111 řádků)
2. `src/routes/app/guided/+page.svelte` (řádky 600–1 100)
3. `src/routes/app/online/+page.svelte` (řádky 350–780)

#### F. DOM Duplication Hack v `ActionCard.svelte`
V `ActionCard.svelte` (řádky 91–196 a 950–1005) Argon vyřešil mobilní responsivitu zdvojením celého DOM stromu. Prvky metadat skryl pro mobil přes `display: none !important` a kompletně je naklonoval do `<div class="mobile-details-extra">` uvnitř akordeonu. To vede ke zdvojení uzlů i event listenerů.

---

## 4. Prioritizovaný akční plán (3 fáze)

Následující plán představuje ucelený postup transformace repozitáře po schválení uživatelem:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FÁZE 1: VYČIŠTĚNÍ CESTY K AKCI (Okamžitý mobilní tah na branku & Bezpečnost)   │
│ - Sanace klíčů a odstranění bezpečnostních děr                                  │
│ - Oprava DDL schématu pro feedback a submissions                                │
│ - Odstranění Molly a plovoucích widgetů z layoutu                               │
│ - Zero-Scroll úvodní obrazovka (odstranění 100svh Hero bloku)                   │
│ - Odstranění HoldSpark prodlení a zjednodušení karty akce                       │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FÁZE 2: ARCHITEKTONICKÝ A DATOVÝ ŘEZ (Zrychlení odezvy & Úklid dluhu po Argonu) │
│ - Nahrazení 3s Overpass API statickým GeoJSON pod 50 ms                         │
│ - Fyzická likvidace 6 zombie komponent, duplicit a opičích forwarderů           │
│ - Konsolidace trojí implementace ActionCard do jediné komponenty                │
│ - Povolení Edge CDN cachování v hooks.server.js (TTFB pod 30 ms)                │
│ - Rozbití monolitického barrelu czech-actions.js                                │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│ FÁZE 3: NÁVYKOVÁ LEHKOST A FINÁLNÍ VYBRUŠOVÁNÍ (Mikro-interakce & PWA)          │
│ - In-situ blesková haptická (40 ms) a zvuková odměna na kartě                   │
│ - Swipe deck pro bleskové listování skutky (0 ms)                               │
│ - Rituální zakončení seance („Pro dnešek hotovo“)                               │
│ - PWA offline synchronizace přes IndexedDB a Background Sync                    │
│ - Lazy loading pro Krajinu dobra (/svet) a Leaflet mapu                         │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

### Fáze 1: Vyčištění cesty k akci (Vstupní dojem, ořezání rušivých prvků a bezpečnost)
* **Cíl:** Zprovoznit čistý 3vteřinový test na mobilu bez rozptylování a uzavřít kritická bezpečnostní rizika.
* **Konkrétní kroky:**
  1. **Bezpečnostní sanace klíčů a konfigurace:**
     * Rotovat všechny API klíče, JWT secret a heslo k PostgreSQL v konzoli Supabase.
     * Vyčistit soubory `.env` a `.env.local` od ostrých hesel.
     * V `src/lib/server/supabase.js` přepnout výchozí inicializaci na `anonKey`, aby se uplatnila pravidla RLS.
     * V `src/lib/security.js` (řádek 411) odstranit fallback heslo `'akcelerator-dev-test'`.
     * V `src/routes/api/submissions/+server.js` (řádek 230) zrušit akceptaci `SUPABASE_SERVICE_ROLE_KEY` v HTTP hlavičce `x-moderator-secret`.
  2. **Oprava schématu databáze a migrace:**
     * Vytvořit adresář `supabase/migrations/0001_initial_schema.sql`.
     * Sjednotit DDL pro `feedback`: definovat reálně vkládané sloupce (`message, category, page_url, contact, user_agent, status`).
     * Sjednotit DDL pro `community_submissions`: sladit kód s DDL (vyřešit sloupec `kind NOT NULL` a sloupce `address, url, contact, ip_hash`).
     * Přidat chybějící DDL pro `pulse_events` (`action_id, city, kind, created_at`).
     * Aktualizovat `DEPLOYMENT_INSTRUCTIONS.md`.
  3. **Radikální zjednodušení layoutu (`src/routes/+layout.svelte`):**
     * Odstranit `<MollyCompanion />` z globálního layoutu.
     * Sloučit plovoucí FAB tlačítko `<ImmediateHelp />` do decentní statické ikony v záhlaví.
     * Schovat plovoucí `<FeedbackModal />` do patičky.
     * Na displeji mobilu zůstane pouze obsah a čistá spodní navigační lišta.
  4. **Redesign úvodní obrazovky na Zero-Scroll (`HeroSection.svelte` + `+page.svelte`):**
     * V `HeroSection.svelte` odstranit `min-height: calc(100svh - 6rem)` a zkrátit texty.
     * Zrušit rolovací kotvu `⚡ Dnešní skutek (2 min) ↓`.
     * Umístit doporučenou kartu akce (`ActionCard`) přímo do prvního zobrazení mobilního viewportu (100dvh).
  5. **Odstranění tření z `ActionCard.svelte`:**
     * Odstranit povinné držení tlačítka (`HoldSparkButton`, `data-hold-spark`). Tlačítko reaguje okamžitě na klik.
     * Schovat Evidence badges, metodologii a kauzální řetězce za tichý odkaz `ℹ️ Jak to funguje`.
     * Zvětšit všechny dotykové plochy (`.cycle-link`, tlačítka) na minimálně **44×44 px** dle WCAG 2.5.5.

---

### Fáze 2: Architektonický a datový řez (Zrychlení odezvy a úklid dluhu po Argonu)
* **Cíl:** Odstranit zbytečné soubory, sjednotit duplicitní kód a zkrátit odezvu sítě pod 50 ms.
* **Konkrétní kroky:**
  1. **Nahrazení Overpass API statickým GeoJSON pod 50 ms:**
     * V `src/routes/api/nearby/+server.js` zrušit 3sekundové dotazování na externí německá zrcadla Overpass.
     * Nahradit předem vygenerovaným statickým souborem českých míst (GeoJSON) nebo optimalizovaným PostGIS dotazem.
     * Sloučit `/api/nearby` a `/api/community-nearby` do jednoho konzistentního endpointu.
  2. **Fyzická likvidace zombie komponent a duplicit:**
     * Smazat 6 nepoužitých zombie komponent: `HoldSparkButton.svelte`, `PartnerReturnModal.svelte`, `CategoryFilters.svelte`, `FirstContactModal.svelte`, `GeocodeSearch.svelte`, `LeafletMap.svelte`.
     * Smazat duplicitní soubory `src/lib/features/home/components/HeroSection.svelte` a `QuickStartSection.svelte`.
     * Smazat opičí forwardery `src/lib/components/MollyCompanion.svelte`, `src/lib/stores/mollyStore.js` a `api/test-supabase/+server.js`.
     * Smazat sirotčí trasu `src/routes/app/+page.svelte`.
  3. **Konsolidace akční karty a eliminace DOM Duplication hacku:**
     * V `ActionCard.svelte` odstranit duplikaci DOMu do `.mobile-details-extra`. Nahradit čistým CSS flexboxem bez `display: none !important`.
     * Nahradit duplicitní implementace v `src/routes/app/guided/+page.svelte` a `src/routes/app/online/+page.svelte` znovupoužitím jediné komponenty `ActionCard.svelte` (úspora přes 1 200 řádků duplicitního kódu).
  4. **Rozbití monolitického barrelu `czech-actions.js`:**
     * Rozdělit monolit na samostatné importovatelné moduly (`micro-actions.js`, `fallback-places.js`). Umožnit Vite provádět přesný tree-shaking.
  5. **Povolení Edge CDN cachování v `src/hooks.server.js`:**
     * Odstranit direktivu `Cache-Control: private, no-store` pro anonymní HTML požadavky.
     * Nastavit `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`. Úvodní stránka se bude servírovat z Vercel Edge Cache po celém Česku s TTFB pod 30 ms.

---

### Fáze 3: Návyková lehkost a finální vybrušování (Mikro-interakce & PWA)
* **Cíl:** Vytvořit viscerální zážitek, kde pomoc přináší okamžitou dopaminovou odměnu srovnatelnou s moderními mobilními aplikacemi.
* **Konkrétní kroky:**
  1. **In-situ blesková haptická a zvuková odměna:**
     * Přepracovat návratový tok (`partnerReturnService.js`): po návratu z akce okamžitě spustit oslavu přímo na kartě bez nutnosti cokoliv potvrzovat.
     * Haptická odezva: 40 ms ráz přes `navigator.vibrate`.
     * Zvuková odezva: teplý harmonický akord syntetizovaný přímo přes Web Audio API bez stahování audio souborů.
     * Vizuální odezva: animace naplnění misky / rozsvícení stopy přímo v těle karty. Žádný nucený redirect na `/svet`.
  2. **Bleskový Swipe Deck (0 ms z lokální paměti):**
     * Možnost přepínat mezi 3–5 doporučenými mikro-skutky lehkým gestem do strany (swipe) s okamžitým vykreslením z paměti telefonu.
  3. **Psychologické rituální zakončení („Pro dnešek hotovo“):**
     * Tlačítko pro explicitní uzavření seance: aplikace uživatele pochválí, uklidní a řekne mu, že pro dnešek udělal dost a může mobil odložit s čistou hlavou.
  4. **PWA offline synchronizace přes IndexedDB a Service Worker:**
     * Ukládat splněné skutky a odeslanou zpětnou vazbu do IndexedDB fronty při výpadku signálu.
     * Automaticky synchronizovat data na pozadí (Background Sync API) po obnovení připojení.
  5. **Lazy loading pro Krajinu dobra (`/svet`) a Leaflet mapu (`/near`):**
     * Vyčlenit těžké WebGL/Canvas skripty Krajiny dobra a Leaflet mapu do dynamických importů (`await import(...)`), aby hlavní bundle aplikace klesl pod 80 KB.

---

## 5. Závěrečné zastavení (Milestone Gate)

V souladu se zadáním a architektonickým mandátem se seniorní tým expertů v tomto bodě **zastavuje**:
* **Žádné implementační změny, úpravy kódu ani mazání souborů nebudou prováděny**, dokud uživatel neprostuduje tento audit a neschválí vybrané body akčního plánu k realizaci.
* Repozitář zůstává ve stabilním, nezměněném stavu.
