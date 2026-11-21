# Odstranění Mollyiných pamlsků a dárků — plán implementace

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Úplně odstranit pamlsky a dárky za skutky (rozhraní, texty, stav, kód) a Molly ponechat se všemi ostatními projevy; kde byl pamlsek záminkou pro její reakci, reakce zůstává s novým obsahem.

**Architecture:** Postupuje se od listů k jádru, aby typová kontrola procházela po každém úkolu: nejdřív nová reakce „poděkování za skutek“ a přepojení volajících, potom odstranění spotřebitelů pamlsků (karta, okno oslavy, dock, toulavá Molly, `/svet`) a nakonec vyčištění úložiště, typů a katalogů s pojistkou proti návratu. Každý úkol upraví i testy, které rozbije, a končí zeleným `npm run verify`.

**Tech Stack:** SvelteKit 2, Svelte 5 (Runes), JSDoc + `strict`, Vitest (`tests/unit`), Playwright (`tests/*.spec.ts`, produkční build, `fullyParallel`).

**Spec:** `docs/superpowers/specs/2026-11-21-odstraneni-pamlsku-a-darku-design.md` (čti ho celý; plán z něj vychází a neopakuje ho).

## Global Constraints

- Všechny příkazy běží v `akcelerator-landing-page/`. Ověření: `npm run verify` (typy, unit, E2E podle změny); na konci `npm run verify:full`.
- Hlavní zásada specifikace: **Molly se neomezuje.** Odstraňuje se jen jídlo, počty a dárky. Reakce (šeptanda, srdíčka, poskok, předení, letící jiskra) zůstávají.
- Žádné emoji; ikony přes `<AppIcon name="..." />`. Žádné explicitní `any`, `@ts-ignore`, `@ts-nocheck`.
- `localStorage` / `sessionStorage` jen přes `src/lib/storage/`. Klíč `aa_molly_companion_v1` zůstává.
- Texty Molly: klidná čeština bez patosu. Neměnit řetězce `Půjdu s tebou`, `Zůstanu na svém klidném místě`, `V pelíšku`, `odpočívá v pelíšku`.
- Dotykové plochy aspoň 44×44 px; žádný layoutový posun; viditelný text tlačítka je obsažen v `aria-label`.
- V `requestAnimationFrame` smyčce Molly žádné DOM dotazy; měření mimo smyčku.
- Ve specifikacích žádné `console.log`; každý test obstojí sám (`fullyParallel`).
- Testy, které hlídají něco jiného než pamlsky (geometrie, přístupnost, nepřekrývání), se neoslabují: upraví se na to, co zůstalo. Žádné `test.skip`, `test.fixme` ani `.catch(() => {})` kolem tvrzení.
- Po úpravě `.svelte` souboru, která se týká Svelte samotného (šablona, runy, direktivy), použij `svelte-autofixer`; u čistého JS stačí typová kontrola.
- Práce probíhá na větvi `feat/remove-molly-treats`; commit po každém úkolu. **Commit a push jsou podmíněné souhlasem vlastníka** (viz předání).

## Review Focus

1. **Návštěvník s uloženým starým stavem** (`availableTreats: 3`, `earnedTreatQueue` s 20 záznamy a emoji ikonami, `giftDeeds: 27`): stránka se načte bez chyby v konzoli, Molly je v uloženém režimu, `petCount` zůstal. → test v úkolu 6.
2. **Starý zálohovací kód postupu** s poli pamlsků: obnova projde a obnoví skutky i `petCount`. → test v úkolu 6.
3. **Oslava po skutku na úzkém mobilu (360×800 a 375×667):** po zkrácení poznámky nic neposkočí, tlačítka „Pro dnešek hotovo“ a „Další dobrý skutek“ jsou vidět a Molly ani její bublina je nezakrývá. → test v úkolu 2.
4. **Dock v hlavičce na 320–1024 px po odstranění počítadel:** žádný vodorovný přetok, název webu bez výpustky, plochy ≥ 44 px. → úprava T3-14 a T3-11 v úkolu 3.
5. **`/svet` bez pamlsků:** plátno má `data-sanctuary-molly="ready"` hned po načtení i pro návštěvníka, který nikdy nic neudělal; pohlazení funguje opakovaně. → test v úkolu 5.

---

### Task 1: Poděkování za skutek místo odemčení pamlsku

**Files:**
- Modify: `src/lib/mollyTypes.js`, `src/lib/mollyStore.js`, `src/lib/types/molly.ts`, `src/lib/progress.js` (volání u `recordSmallWin` a `addSanctuaryWish`), `src/lib/features/sanctuary/components/BreathingPacer.svelte` (volání po dokončení), `src/components/MollyCompanion.svelte` (spouštěč přeměření po skutku, `repeatsInlineCelebration`, reakce na událost)
- Test: `tests/unit/mollyStore.test.js`

**Interfaces:**
- Produces:
  - `MOLLY_DEED_THANKS: string[]` v `mollyTypes.js` s přesně těmito texty: `'Mrrr… děkuji, že pomáháš.'`, `'Tvůj skutek dnes někomu ulehčil. Předu ti za něj.'`, `'Mrrr… to bylo hezké. Děkuji.'`, `'Děkuji. I malý krok se počítá.'`
  - `thankForDeed(): void` v `mollyStore.js`: nastaví šeptandu `{ icon: 'heart', text: <náhodná z MOLLY_DEED_THANKS>, fromThanks: true, ts }` a vyšle událost `{ type: 'thanks' }` přes `mollyEvents`. Nic nepočítá a nic neukládá.
  - `MollyWhisper.fromThanks?: boolean`, `MollyEvent.type` rozšířený o `'thanks'`.
- Consumes: nic.

- [ ] **Step 1: Napiš selhávající unit testy** do `tests/unit/mollyStore.test.js`:
  - `thankForDeed shows a thanks whisper from MOLLY_DEED_THANKS and emits a thanks event` — po volání je `get(mollyWhisper).text` jedním z `MOLLY_DEED_THANKS`, `fromThanks === true`, a odběratel `mollyEvents` dostal `type: 'thanks'`.
  - `thankForDeed changes no counter` — stav Molly před a po se liší jen v `whisper`.
  - `no thanks text mentions food or rewards` — žádný text z `MOLLY_DEED_THANKS` neodpovídá `/pamls|dobrot|odměn|mňam/i`.
- [ ] **Step 2:** `npm run test:unit` → nové testy selžou („thankForDeed is not a function“).
- [ ] **Step 3: Implementuj** `MOLLY_DEED_THANKS` a `thankForDeed` podle Interfaces.
- [ ] **Step 4: Přepoj volající.** V `progress.js` a `BreathingPacer.svelte` nahraď každé `unlockMollyTreat(...)` voláním `thankForDeed()` (zachovej podmínky, za kterých se dnes volá, včetně `silent`).
- [ ] **Step 5: `MollyCompanion.svelte`:**
  - přeměření a přesun na volné místo po skutku spouštěj událostí `thanks` místo nárůstu `availableTreats`;
  - `repeatsInlineCelebration(w)` vyhodnocuj přes `w.fromThanks`;
  - radostnou reakci, kterou dnes spouští událost `feed` (srdíčka, blažený výraz, předení; bez letícího předmětu), spusť i na `thanks`.
- [ ] **Step 6:** `npm run verify` → zelené. E2E, které čekaly text „čeká … pamlsek“ po skutku, uprav na text z `MOLLY_DEED_THANKS` (hledej v `tests/` řetězce `čeká`, `fromUnlock`).
- [ ] **Step 7: Commit** `feat(molly): thank for a deed instead of unlocking a treat`.

---

### Task 2: Karta skutku a okno oslavy bez krmení

**Files:**
- Modify: `src/lib/features/actions/components/ActionCard.svelte` (blok `.in-situ-celebration`, `fedInCelebration`, `handleFeedMollyInline`, styly tlačítka a odznaku), `src/components/SmallWinCelebration.svelte` (poznámka, tlačítko, odznak, `fedThisCelebration`, `handleFeedMolly`, událost `aa_molly_celebration_fed`), `src/components/MollyCompanion.svelte` (`OBSTACLE_SELECTOR`: odstraň `.molly-inline-fed-badge`)
- Test: `tests/delayed-gratification-and-declutter.spec.ts`, a úpravy v `tests/e2e-requirements.spec.ts`, `tests/molly-stress.spec.ts`, `tests/m2-regressions.spec.ts`, `tests/mobile-tablet-polish.spec.ts`, `tests/tier5-mobile-stress.spec.ts`, `tests/challenger-m3-2.spec.ts`

**Interfaces:**
- Produces: `.molly-celebration-note` s přesným textem `Molly děkuje.` (karta) a `Molly ti děkuje.` (okno oslavy). Selektory `.btn-inline-feed-molly`, `.molly-inline-fed-badge`, `.btn-celebration-feed`, `.molly-fed-badge` přestávají existovat.

- [ ] **Step 1: Napiš selhávající E2E test** do `tests/delayed-gratification-and-declutter.spec.ts`: `Deed celebration: Molly thanks, offers no feeding and nothing covers the next-step buttons`, pro viewporty `360×800`, `375×667`, `1440×900`:
  - po `Mám hotovo` má `.in-situ-celebration .molly-celebration-note` text přesně `Molly děkuje.`;
  - `.btn-inline-feed-molly` a `.molly-inline-fed-badge` mají počet 0; v celé `.instant-card` není text odpovídající `/pamls/i`;
  - `.btn-next-deed` je viditelné a obdélník `.molly-roaming-actor` ani viditelné `.molly-whisper-bubble` se s ním ani s tlačítkem „Pro dnešek hotovo“ nepřekrývají (po `data-molly-settled="true"`);
  - výška `.instant-card` se mezi dvěma měřeními 600 ms po zobrazení oslavy nezmění o víc než 1 px.
- [ ] **Step 2:** `npm test -- tests/delayed-gratification-and-declutter.spec.ts` → nový test selže.
- [ ] **Step 3: Uprav `ActionCard.svelte`** podle specifikace (oddíl „Karta skutku“). Poznámku nech jako jediný řádek; po odstranění tlačítka dorovnej mezery, aby oslava neměla prázdné místo.
- [ ] **Step 4: Uprav `SmallWinCelebration.svelte`** podle specifikace (oddíl „Okno oslavy“).
- [ ] **Step 5: Uprav dotčené testy.** Testy jen o krmení z oslavy odstraň (DG-2.x o inline krmení, `m2-regressions` č. 4, F7/F9 testy o tlačítku krmení). Testy geometrie, které měřily `.btn-inline-feed-molly`, přepiš na `.btn-next-deed` a `.molly-celebration-note`. Tvrzení „poznámka obsahuje Molly“ zůstávají.
- [ ] **Step 6:** `npm run verify` → zelené.
- [ ] **Step 7: Commit** `feat(home): deed celebration without feeding`.

---

### Task 3: Dock bez počítadel a dárků

**Files:**
- Modify: `src/components/MollyDock.svelte`, `src/components/MollyCompanion.svelte` (`triggerPetInteraction`: pořadí tip → pohlazení; odstranění přípony `nextGiftText`)
- Test: `tests/mobile-tablet-polish.spec.ts` (nový test), úpravy `tests/ui-rebuild-acceptance.spec.ts` (T3-11, T3-14), `tests/e2e-requirements.spec.ts`, `tests/delayed-gratification-and-declutter.spec.ts`

**Interfaces:**
- Produces: dock s prvky podle specifikace. Tlačítko `.molly-dock-pet-btn`: `title` = `Pohladit kočičku Molly.`, `aria-label` = `Pohladit Molly.`; s čekajícím tipem má obojí předřazené `Molly má pro tebe laskavý tip. `. Přestávají existovat `data-testid` `molly-treat-count`, `molly-pending-treat-count`, `molly-gift-meter`, třída `has-pending-treat` a `LEGACY_MOLLY_ICON_MAP`. `normalizeMollyIcon(name)` zůstává a vrací jméno ikony, pokud je v registru, jinak výchozí ikonu.

- [ ] **Step 1: Napiš selhávající E2E test** do `tests/mobile-tablet-polish.spec.ts`: `Molly dock carries no numbers and no treat or gift wording`, pro `360×800`, `820×1180`, `1440×900`, se stavem předvyplněným v init skriptu (`aa_molly_companion_v1` = `{ mode: 'roaming', treatsFedTotal: 128, availableTreats: 3, giftDeeds: 27, petCount: 5 }`):
  - text, `title` a `aria-label` všech prvků uvnitř `.molly-pelisek-dock` neodpovídají `/\d|pamls|dár/i`;
  - `[data-testid="molly-treat-count"]`, `[data-testid="molly-pending-treat-count"]`, `[data-testid="molly-gift-meter"]` mají počet 0;
  - klik na `.molly-dock-pet-btn` zvýší `petCount` v uloženém stavu o 1 a ukáže šeptandu z `MOLLY_PET_WHISPERS`;
  - `.molly-dock-pet-btn` má plochu aspoň 44×44 px a stránka nemá vodorovný přetok.
- [ ] **Step 2:** spusť soubor → nový test selže.
- [ ] **Step 3: Uprav `MollyDock.svelte`** podle specifikace (oddíl „Dock Molly“): odstraň prvky, deriváty, importy a styly pamlsků a dárků; dorovnej rozestupy na šířkách, kde se dock zobrazuje.
- [ ] **Step 4: Uprav `triggerPetInteraction`** a odstraň příponu o dárku.
- [ ] **Step 5: Uprav dotčené testy.** T3-14 (trojciferné počítadlo v hlavičce) přepiš tak, aby se stejným předvyplněným stavem dál hlídal nulovou výpustku a kolize značky s dockem. Testy jen o počítadle nebo měřáku odstraň.
- [ ] **Step 6:** `npm run verify` → zelené (musí proběhnout `molly-stress`, `mobile-tablet-polish`, `desktop-polish`).
- [ ] **Step 7: Commit** `feat(molly): dock without counters and gifts`.

---

### Task 4: Toulavá Molly bez jídla a dárků, jiskra zůstává

**Files:**
- Modify: `src/components/MollyCompanion.svelte`, `src/lib/molly/mollyCatRenderer.js`, `src/lib/mollyStore.js` (`petMolly`: vždy `MOLLY_PET_WHISPERS`), `src/lib/mollyTypes.js` (odstranění `MOLLY_UNEARNED_PET_WHISPERS`)
- Test: `tests/unit/mollyStore.test.js`, `tests/molly-stress.spec.ts`

**Interfaces:**
- Consumes: událost `thanks` z úkolu 1.
- Produces: chování `CATCH_SPARK` (přejmenované `CATCH_TREAT`), stav letící jiskry `flyingSpark` (přejmenované `flyingTreat*`, `treatEl`, `applyTreatTransform` → `applySparkTransform`), třída prvku `.molly-flying-spark`. Renderer nepřijímá `accessories` a nezná náladu `eating`. Vrstva `.molly-companion-layer` nenese `data-molly-treats`, `data-molly-available-treats`, `data-molly-gift-deeds`.

- [ ] **Step 1: Napiš selhávající testy.**
  - unit `petMolly always answers from MOLLY_PET_WHISPERS` — po 30 voláních je každý text v `MOLLY_PET_WHISPERS` a žádný neodpovídá `/pamls|dobrot|odměn/i`.
  - E2E v `tests/molly-stress.spec.ts`: `Spark still flies to Molly and she catches it` — na `/` po spuštění náhledu efektu (stejný krok, jakým dnešní testy volají „Přehrát“ / jiskru) se objeví `.molly-flying-spark` a Molly projde chováním `CATCH_SPARK`; `.molly-companion-layer` nemá žádný z atributů `data-molly-treats`, `data-molly-available-treats`, `data-molly-gift-deeds`.
- [ ] **Step 2:** spusť je → selžou.
- [ ] **Step 3: `MollyCompanion.svelte`:** odstraň větev krmení (`feed` událost, `eatTimer`, ikony jídla), milníkovou šeptandu a srdíčkovou salvu k ní, atributy na vrstvě a `accessories`. Kód letícího předmětu ponech pro jiskru a přejmenuj podle Interfaces.
- [ ] **Step 4: `mollyCatRenderer.js`:** odstraň kresbu obojku, zvonečku, korunky a hvězdičky a vše vázané na `eating`; výraz při chytání jiskry zůstává.
- [ ] **Step 5: `mollyStore.js` a `mollyTypes.js`:** `petMolly` bez větve podle pamlsků; odstraň `MOLLY_UNEARNED_PET_WHISPERS`.
- [ ] **Step 6:** `npm run verify` → zelené. Testy, které tvrdily atribut `data-molly-treats` na vrstvě (např. „Přehrát nenafukuje pamlsky“ v `security.spec.ts`), přepiš na to, že se po jiskře nezmění uložený stav kromě šeptandy, nebo odstraň, pokud jiné tvrzení nenesou.
- [ ] **Step 7: Commit** `feat(molly): no food or gifts on the roaming cat, spark stays`.

---

### Task 5: Krajina dobra bez pamlsků

**Files:**
- Modify: `src/routes/svet/+page.svelte`
- Test: `tests/tier5-svet-stress.spec.ts`, `tests/e2e-requirements.spec.ts`, `tests/molly-stress.spec.ts`, `tests/desktop-polish.spec.ts` (selektor tlačítka u tůně)

**Interfaces:**
- Produces: `.molly-sanctuary-pill` s viditelným textem `Pohladit Molly`, `title` `Pohladit patronku Molly u lesní tůně`, `aria-label` `Pohladit patronku Molly`. Stav Molly u tůně `JOY` (přejmenované `EAT_TREAT`). `canvas.sanctuary-canvas` má `data-sanctuary-molly="ready"` nezávisle na jakémkoli počtu a nemá `data-molly-treats`.

- [ ] **Step 1: Napiš selhávající E2E test** do `tests/tier5-svet-stress.spec.ts`: `Sanctuary Molly is ready for a first-time visitor and can be petted repeatedly without any treat wording`:
  - s prázdným úložištěm má plátno `data-sanctuary-molly="ready"` a nemá atribut `data-molly-treats`;
  - `.molly-sanctuary-pill` má text přesně `Pohladit Molly`; tři kliky po sobě zvýší `petCount` o 3;
  - text celé stránky (`main`), `title` a `aria-label` legendy a tlačítka neodpovídají `/pamls|misk|granul/i`.
- [ ] **Step 2:** spusť → selže.
- [ ] **Step 3: Uprav `/svet`** podle specifikace (oddíl „Krajina dobra“): `feedSanctuaryMolly` se stává pohlazením; odstraň misku, oblouk krmení, `playMollyCrunch`, mrtvé importy (`feedMolly`, `feedMollyFromAction`, `unlockMollyTreat`); přejmenuj stav na `JOY`; dopad světelného oblouku na Molly = poskok a vlnka bez zvuku; legenda a třetí krok návodu podle specifikace; zápis `data-sanctuary-molly` odpoj od počtu pamlsků.
- [ ] **Step 4: Uprav dotčené testy.** T5-3 („click-to-feed“) přepiš na přesnost pohlazení (stejná geometrie zásahu, tvrzení o `petCount` místo pamlsků). T5-2 nech hlídat, že po kliku nastane stav radosti (halo). `Molly 2` v `molly-stress` obdobně. Testy jen o krmení u tůně a T4-1 („earn → feed on /svet“) odstraň nebo přepiš na „skutek → světlo v krajině“, pokud to už nehlídá jiný test.
- [ ] **Step 5:** `npm run verify` → zelené.
- [ ] **Step 6: Commit** `feat(svet): petting only, no bowl and no treats`.

---

### Task 6: Úložiště, typy, katalogy a pojistka proti návratu

**Files:**
- Modify: `src/lib/mollyStore.js`, `src/lib/mollyTypes.js`, `src/lib/types/molly.ts`, `src/lib/types/storage.ts`, `src/lib/types/sensory.ts`, `src/lib/progress.js` (záloha a obnova), `src/lib/sensory/catalog/actionCatalog.js`, `src/lib/sensory/catalog/catalogResolver.js`, `src/lib/sensory/canvas/impactCanvasEngine.js`, `src/lib/audio/presets.js`, `src/lib/icons/lucideIcons.js`, `src/lib/icons/iconRegistry.js`
- Test: `tests/unit/mollyStore.test.js`, `tests/unit/security.test.js` (záloha), `tests/unit/invariants.test.js`, `tests/unit/data.test.js`, `tests/unit/m2-regressions.test.js`, `tests/unit/poetic-scenes.test.js`

**Interfaces:**
- Produces: `MollyState` = `{ mode, mood, followMouse, petCount, whisper }` (a případná další dnešní pole nesouvisející s pamlsky). Zálohovací kód: část `m` = `{ petCount }`. Plátno scény: `data-molly-mini`, `data-molly-arcs` beze změny; `data-molly-treat` neexistuje.

- [ ] **Step 1: Napiš selhávající unit testy.**
  - `mollyStore.test.js` — `loads a legacy saved state: drops treat and gift fields, keeps mode and petCount`: uložený záznam `{ mode: 'pelisek', petCount: 12, treatsFedTotal: 128, treatsFedToday: 2, lastFedIso: '2026-01-01T10:00:00.000Z', availableTreats: 3, earnedTreatQueue: [<20 záznamů s emoji ikonou>], lastTreat: {...}, giftDeeds: 27 }` → po načtení `mode === 'pelisek'`, `petCount === 12`, a objekt stavu ani příští uložený JSON neobsahují žádný z klíčů `treatsFedTotal`, `treatsFedToday`, `lastFedIso`, `availableTreats`, `earnedTreatQueue`, `lastTreat`, `giftDeeds`.
  - `mollyStore.test.js` — `survives a corrupted legacy record` (`earnedTreatQueue: 'x'`, `giftDeeds: null`) bez výjimky.
  - `security.test.js` — `restores a backup code created before treats were removed`: kód s `m: { treatsFedTotal: 9, petCount: 4, giftDeeds: 9, availableTreats: 1 }` se obnoví, `petCount === 4`, skutky obnoveny; nový kód má `m` jen s `petCount`.
  - `invariants.test.js` — do seznamu vyřazených vzorů přidej pro `src/`: `/pamls/i`, `/mňamk/i`, `/Dát Molly/`, `/availableTreats/`, `/treatsFedTotal/`, `/giftDeeds/`, `/unlockMollyTreat/`, `/feedMolly/`, `/MOLLY_MILESTONES/`; výjimka pro `src/lib/data/fallback-places.js` u `/pamls/i`. Odstraň výjimku pro emoji v `MollyDock.svelte`.
- [ ] **Step 2:** `npm run test:unit` → nové testy selžou.
- [ ] **Step 3: Vyčisti stav a funkce** podle specifikace (oddíl „Stav, úložiště a záloha“): pole, `unlockMollyTreat`, `feedMolly`, `feedMollyFromAction`, `milestoneWhisperOr`, `countStoredDeeds`, pomocné funkce dne, `DEED_FEED_SOURCES`; katalog pamlsků, mapování režimů, žebříček a funkce kolem něj; typy.
- [ ] **Step 4: Vyčisti katalog efektů a plátno** (`mollyTreat`, `data-molly-treat`), zvuk `playMollyCrunch` a ikony `fish`, `milk`, `bell`, pokud je `Grep` nenajde jinde v `src/`.
- [ ] **Step 5: Uprav zálohu a obnovu** v `progress.js` podle Interfaces.
- [ ] **Step 6: Uprav zbylé unit testy** (odstraň testy pamlsků a dárků; v `poetic-scenes` a `data.test.js` odstraň jen tvrzení o `data-molly-treat`, katalogu pamlsků a žebříčku).
- [ ] **Step 7:** `npm run verify:full` → zelené. `Grep` na vzory z invariantu v `src/` nic nenajde mimo výjimku.
- [ ] **Step 8: Commit** `refactor(molly): remove treat and gift state, types and catalogs`.

---

### Task 7: Pravidla, dokumentace a závěrečné ověření

**Files:**
- Modify: `.claude/rules/molly.md`, `.claude/rules/home-and-deed-stage.md`, `.claude/rules/subpages.md`, `.claude/rules/architecture.md`, `README.md`, `CONCEPT_V2.md`, `user_journeys.md`, `CHANGELOG.md`; případně `tests/support/affected-rules.mjs` při přejmenování specifikace

- [ ] **Step 1: Uprav pravidla** tak, aby popisovala nový stav bez pamlsků a dárků:
  - `molly.md`: věta o duplicitní odměnové šeptandě → poděkování za skutek se neukáže, když by zakrylo oslavu v kartě; odstraň `nameAcc`, `pluralPamlsek` a odstavec o `LEGACY_MOLLY_ICON_MAP`; `atHome` už neskrývá počítadlo, jen přepínače.
  - `home-and-deed-stage.md`: po dokončení se nabízí „Přehrát“ a ztlumení zvuku; bez „Dát Molly pamlsek“.
  - `subpages.md`: řádek o jediném počítadle pamlsků nahraď: u tůně je jediné tlačítko pro pohlazení Molly (`.molly-sanctuary-pill`).
  - `architecture.md`: `mollyTypes.js` je datový modul textů a průvodců Molly.
- [ ] **Step 2: Uprav `README.md`, `CONCEPT_V2.md`, `user_journeys.md`** na místech, která zmiňují pamlsky; historii v `CHANGELOG.md` neměň a přidej záznam pod `[Unreleased]`.
- [ ] **Step 3: Přejmenuj specifikaci**, pokud po odstranění bloku pamlsků název `delayed-gratification-and-declutter.spec.ts` neodpovídá obsahu: nový název `progressive-disclosure.spec.ts`; uprav `affected-rules.mjs` a odkazy v pravidlech. `npm run test:unit` musí projít (`affected.test.js`).
- [ ] **Step 4: Závěrečné ověření podle specifikace:** `npm run verify:full` zelené; ruční průchod na `1440×900` a `360×800` (`/` s dokončením skutku, okno oslavy na `/app/online`, `/svet` s pohlazením a dechovým zastavením, dock v hlavičce i plovoucí) se snímky obrazovky pro vlastníka; načtení se starým uloženým stavem bez chyby v konzoli.
- [ ] **Step 5: Commit** `docs: describe Molly without treats and gifts`.
