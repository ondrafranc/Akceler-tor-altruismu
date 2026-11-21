# Odstranění Mollyiných pamlsků a dárků za skutky — zadání

Stav: návrh ke schválení. Datum: 2026-11-21.

## Záměr a důvod

Kočka Molly dnes za každý dokončený skutek „dostane pamlsek“, který jí návštěvník musí ručně dát, a z počtu nakrmení se odemykají dárky (obojek, zvoneček, korunka, hvězdička). Zpětná vazba od návštěvníků říká, že nerozumějí, na co se dívají. Vlastník produktu vyhodnotil, že pamlsky a dárky jsou matoucí a nepřinášejí skutečnou hodnotu: přidávají čísla, tlačítka a texty, které s pomáháním nesouvisejí.

Cílem je obojí úplně odstranit a Molly ponechat jako tichou společnici se všemi ostatními funkcemi.

Tato práce je první ze tří. Další dvě (první dojem nového návštěvníka zvlášť pro desktop a mobil; dojem „vypadá to jako od AI“) se řeší samostatně až po ní.

## Hlavní zásada: Molly se neomezuje

Molly si návštěvníci chválí. Odstraňují se jen pamlsky a dárky, nic jiného z jejího projevu. Z toho plyne pravidlo pro každé sporné místo: **kde byl pamlsek jen záminkou pro Mollyinu reakci, reakce zůstává a mění se jen její obsah.** Molly má po této práci reagovat stejně často a stejně živě jako dnes (šeptandy, srdíčka, poskok, předení, animace); jen už nemluví o jídle a odměnách a nic se nepočítá.

## Cíle

1. Návštěvník nikde neuvidí pamlsek, krmení, počet pamlsků, dárek ani postup k dárku: ani v rozhraní, ani v popiscích pro čtečky, ani v šeptandách.
2. Dock Molly dává smysl bez počítadel.
3. V kódu nezůstane mrtvý systém: stav, funkce, typy, katalogy, zvuky a animace, které sloužily jen pamlskům a dárkům, zmizí.
4. Všechny ostatní funkce Molly fungují jako dnes (viz „Co zůstává“).
5. `npm run verify:full` je zelený; pravidla a dokumentace odpovídají novému stavu.

## Co není cílem

- Nový první dojem, onboarding ani práce s „AI vzhledem“.
- Přepracování vzhledu docku nad rámec odstranění prvků a dorovnání rozestupů.
- Změna počítání skutků, světel v Krajině dobra, metrik dopadu (`emitProgress`) nebo oslavy skutku jako takové.
- Přejmenování atributu `data-molly-mini` (je to značka „scéna po skutku běží“, opírají se o ni pravidla i testy).
- Nová náhradní odměna nebo jiná herní mechanika.

## Čemu se vyhnout

- Skrytá čísla nebo texty, které pamlsky dál slibují (například v `title`, `aria-label` nebo v šeptandě).
- Zásah do toho, jak Molly obchází obsah: po skutku nesmí zakrýt oslavu v kartě.
- Hlášení návštěvníkovi, že o něco „přišel“. Staré uložené počty se tiše ignorují.
- Oslabení testů, které hlídají něco jiného než pamlsky (geometrie, přístupnost, nepřekrývání).

## Omezení

- Platí `AGENTS.md` a `.claude/rules/*` (zejména `molly.md`, `home-and-deed-stage.md`, `subpages.md`, `ui-core.md`): žádné emoji, ikony přes `AppIcon`, dotykové plochy aspoň 44×44 px, nic nezpůsobuje layoutový posun, text tlačítka je obsažen v jeho `aria-label`.
- `MollyCompanion.svelte` je největší a nejkřehčí soubor projektu; po změně musí projít `molly-stress`, `mobile-tablet-polish` i `desktop-polish`.
- Texty Molly: klidná čeština bez patosu. Řetězce, o které se opírají testy, se nemění: `Půjdu s tebou`, `Zůstanu na svém klidném místě`, `V pelíšku`, `odpočívá v pelíšku`.
- Úložiště: jediný klíč `aa_molly_companion_v1` nese pamlsková i ostatní pole dohromady. Klíč zůstává.
- Bez commitu a pushe, dokud o ně vlastník neřekne.
- **Výchozí stav** je současný pracovní strom na `main` včetně necommitnutých změn testovací infrastruktury (`tests/support/`, upravené a sloučené specifikace). `npm run verify:full` na něm prochází (ověřeno třemi běhy po sobě 2026-11-21). Selhání, které se objeví během práce, je tedy způsobené touto prací.

## Zvažované cesty

1. **Úplné odstranění (zvoleno).** Zmizí rozhraní, texty, stav i kód pamlsků a dárků. Molly zůstává společnicí. Je to největší zásah, ale nenechává mrtvý kód ani falešné sliby.
2. **Jen skrýt rozhraní.** Počítadla a tlačítka zmizí, logika zůstane. Rychlé, ale v kódu zůstane neudržovaný systém, šeptandy by dál slibovaly odměnu a testy by hlídaly něco, co nikdo nevidí.
3. **Zjednodušit na automatickou odměnu** (skutek = Molly se rovnou potěší, bez ručního krmení a bez dárků). Menší zmatek, ale pořád je to mechanika navíc, kterou vlastník nechce.

Vlastník zvolil cestu 1 a potvrdil dvě věci: po dokončení skutku zůstává krátké „Molly děkuje.“ a všechny ostatní funkce Molly se zachovají.

## Co se mění, místo po místě

### Dock Molly (`MollyDock.svelte`)

Zůstává: avatar a jméno „Molly“ (tlačítko pohlazení), tečka uloženého tipu, přepínač pelíšku, přepínač sledování myši (jen s jemným ukazatelem), šeptanda docku.

Mizí: počítadlo pamlsků (`molly-treat-count`), pilulka čekajících pamlsků `+N` (`molly-pending-treat-count`), měřák dárku (`molly-gift-meter`), zvýraznění `has-pending-treat`, texty „Čeká N pamlsek…“, „Darované pamlsky: N“ a „Do dárku … chybí N skutky“.

Klik na Molly: je-li uložený tip, ukáže ho; jinak Molly pohladí. Krok „nakrm, když je pamlsek“ odpadá.

Popisky tlačítka pohlazení: `title` „Pohladit kočičku Molly.“ (s předřazeným „Molly má pro tebe laskavý tip.“, když tip čeká), `aria-label` „Pohladit Molly.“ se stejným předřazením. Viditelný text „Molly“ je v popisku obsažen.

Po odstranění prvků se dock nesmí rozpadnout: rozestupy a šířky se dorovnají na všech šířkách, kde se dock zobrazuje (hlavička do 1024 px, plovoucí dock nad ní). Pravidlo o nepřekrývání značky v hlavičce a o čitelnosti názvu webu platí dál.

`LEGACY_MOLLY_ICON_MAP` překládal staré uložené emoji pamlsků na jména ikon. Po odstranění pamlsků se žádné uložené emoji k ikonám nedostane (šeptandy a tipy se neukládají), takže mapa zmizí i s výjimkou pro emoji, kterou kvůli ní má `invariants.test.js` a `molly.md`. Funkce `normalizeMollyIcon` zůstává jako prostá kontrola jména ikony, protože ji používají i ikony šeptand a tipů (rozhodnutí autora zadání).

### Toulavá Molly a šeptandy (`MollyCompanion.svelte`, `mollyStore.js`, `mollyTypes.js`, `mollyCatRenderer.js`)

Mizí šeptandy o jídle a dárcích: „Mrrr… děkuji za …, moc mi chutná.“, „Díky tvému dobrému skutku mě teď zdobí …“, „… Pamlsky si nechávám až za dobrý skutek.“ a přípona o dalším dárku. Šeptanda po skutku nemizí, mění se na poděkování (viz níže).

Pohlazení odpovídá vždy šeptandou z `MOLLY_PET_WHISPERS`. Sada `MOLLY_UNEARNED_PET_WHISPERS` zmizí.

**Po dokončení skutku Molly reaguje stejně jako dnes, jen bez pamlsku.** Šeptandu „Za tvůj dobrý skutek tu na mě čeká …“ nahradí poděkování za skutek (například „Mrrr… děkuji, že pomáháš.“; stavitel připraví několik krátkých variant v Mollyině hlase). Spouští se ve stejných chvílích jako dosavadní odemčení pamlsku: po skutku, po přání v Krajině dobra a po dokončeném dechovém zastavení. Platí pro ni všechno, co dnes platí pro odměnovou šeptandu, beze změny chování: pokud je vidět oslava přímo v kartě a bublina by se k Molly nevešla, neukáže se (`repeatsInlineCelebration` zůstává, jen se váže na poděkování), a krátce po ní se nespouští tip stránky ani dovedení k hlavnímu tlačítku.

**Molly se dál uhne oslavě v kartě:** přeměření a přesun na volné místo dnes spouští nárůst `availableTreats`; nově ho spustí samotné dokončení skutku (volba signálu je na staviteli, například událost ze `recordSmallWin`).

Radostná reakce, kterou dnes Molly ukazuje při krmení (srdíčka, blažené oči, předení), se přesouvá na okamžik poděkování za skutek, aby o ni návštěvník nepřišel.

Mizí kresba dárků na kočce (obojek, zvoneček, květinová korunka, hvězdička) a pole `accessories`.

Mizí jen letící **pamlsek** a chroupání (`playMollyCrunch`, nálada `eating`). Animace letící jiskry, kterou Molly chytá při reakci na „jiskru“ (`notifyMollySpark` z náhledu efektu, `/near`), zůstává celá; sdílený kód se jen přejmenuje, aby nenesl „treat“ v názvu, a přestane znát ikony jídla.

Z vrstvy Molly mizí atributy `data-molly-treats`, `data-molly-available-treats`, `data-molly-gift-deeds`. Zůstávají `data-molly-mode`, `data-molly-mood`, `data-molly-home`, `data-molly-settled`.

### Karta skutku na `/` po „Mám hotovo“ (`ActionCard.svelte`)

Poznámka `.molly-celebration-note` zůstává, zkrácená na „**Molly děkuje.**“ Mizí věta o čekajícím pamlsku s odkazem do Krajiny dobra, tlačítko „Dát Molly pamlsek“ (`.btn-inline-feed-molly`) a odznak „Molly spokojeně chroupe…“ (`.molly-inline-fed-badge`). Tlačítka „Pro dnešek hotovo“ a „Další dobrý skutek“ zůstávají. Oslava po zkrácení nesmí poskočit ani nechat prázdné místo.

### Okno oslavy na podstránkách (`SmallWinCelebration.svelte`)

Poznámka se zkrátí na „**Molly ti děkuje.**“ Mizí zmínka o dobrotě, tlačítko „Dát Molly zasloužený pamlsek“ (`.btn-celebration-feed`), odznak „Molly spokojeně chroupe…“ (`.molly-fed-badge`) a analytická událost `aa_molly_celebration_fed`. Ostatní obsah okna zůstává.

### Krajina dobra `/svet`

Tlačítko u tůně (`.molly-sanctuary-pill`): vždy „Pohladit Molly“, `title` „Pohladit patronku Molly u lesní tůně“, `aria-label` „Pohladit patronku Molly“. Bez čísla a bez ikony pamlsku.

Klik na Molly v plátně nebo na tlačítko ji pohladí: radostný poskok, srdíčka, vlnka a hláška „Patronka Molly spokojeně přede u břehu tůně.“ Stav `EAT_TREAT` a miska s granulemi mizí.

Světelné oblouky, které se spouštějí při rozsvícení skutku, přání nebo zasazení semínka, zůstávají: jsou to světla, ne krmení. Oblouk spouštěný krmením mizí. Když světlo k Molly doletí, Molly radostně poskočí a na hladině se udělá vlnka, bez zvuku chroupání; vnitřní stav se z „jí pamlsek“ stává stavem radosti. Miska zmizí celá (záře, odraz, granule), kámen na břehu zůstává (rozhodnutí autora zadání).

Legenda `.legend-molly`: popisek „Molly“, `title` „Patronka Molly na břehu tůně“. Třetí krok návodu: „Rozsviť světlo — každý skutek přidá do krajiny jedno světlo.“ (znění může stavitel doladit v duchu pravidel textů).

Atribut `data-sanctuary-molly="ready"` na plátně se dnes zapisuje jen při změně počtu pamlsků. Musí se zapsat nezávisle na nich, jakmile je Molly u tůně připravená; testy na něj čekají. `data-molly-treats` z plátna mizí.

Dokončené dechové zastavení už nic neodemyká; Molly za něj poděkuje stejně jako za skutek.

### Scéna skutku a katalog efektů

Mizí `mollyTreat` z katalogu efektů (`actionCatalog.js`, `catalogResolver.js`, `types/sensory.ts`) a atribut `data-molly-treat` z plátna. `data-molly-mini="ready"` a `data-molly-arcs` zůstávají beze změny významu.

### Stav, úložiště a záloha

Ze stavu Molly mizí pole `treatsFedTotal`, `treatsFedToday`, `lastFedIso`, `availableTreats`, `earnedTreatQueue`, `lastTreat`, `giftDeeds` a funkce `unlockMollyTreat`, `feedMolly`, `feedMollyFromAction`, `milestoneWhisperOr` a pomocné funkce jen pro ně. Z `mollyTypes.js` mizí katalog pamlsků, mapování režimů na pamlsky, žebříček dárků a funkce kolem nich (`pluralPamlsek`, `describeNextMollyGift`, `getNextMollyGiftProgress`, `getMollyAccessories`, `getUnlockedMilestone`, `resolveMollyTreat`, `pluralSkutek`, pokud nemá jiného čtenáře).

Volání `unlockMollyTreat` z `recordSmallWin`, `addSanctuaryWish` a z dechového cvičení odpadají. Počítání skutků a jejich oslava se nemění.

Načtení uloženého stavu: neznámá (bývalá) pole se tiše zahodí, nic se nemigruje a nic se návštěvníkovi neoznamuje. Při dalším uložení se už nezapíší. `petCount`, režim, sledování myši a ostatní pole fungují dál.

Zálohovací kód postupu (`createProgressBackupCode`): část o Molly nese už jen `petCount`. Starší kódy, které obsahují pamlsková pole, se musí dál dát obnovit; tato pole se při obnově ignorují.

Typy v `types/molly.ts` a `types/storage.ts` se zúží odpovídajícím způsobem.

### Ikony

Ikony používané jen pamlsky a dárky (`fish`, `milk`, `bell`) se z registru odstraní, pokud nemají jiného čtenáře. `flower-2` zůstává (používá ji katalog efektů).

## Co zůstává (funkce Molly, které se nesmí změnit)

- Toulání s obcházením obsahu, auto-park na úzkých obrazovkách, sledování kurzoru.
- Tipy ke stránce, pozdrav podle denní doby, dovedení k hlavnímu tlačítku, podržení průvodce během vstupní prohlídky (`holdMollyGuide` / `releaseMollyGuide`).
- Uložený tip v docku a jeho tečka.
- Pohlazení (srdíčka, předení, šeptanda), i přímo ťuknutím na Molly.
- Odpočinek v pelíšku a probuzení, včetně pravdivého stavu docku při auto-parku.
- Reakce na jiskru včetně letící jiskry, kterou Molly chytá.
- Radostná reakce po skutku (poděkování, srdíčka), jen bez pamlsku.
- Dechové zastavení na `/svet#dech` s náladou `breathing`.
- Molly u tůně na `/svet`: hlídka po břehu, čištění, pohlazení, odraz.
- Předání Molly tůni přes `$mollyDockBridge.atHome`.

## Testy

- Testy, které ověřují jen pamlsky nebo dárky, se odstraní (jde zhruba o 35–45 testů v `delayed-gratification-and-declutter`, `e2e-requirements`, `molly-stress`, `m2-regressions`, `ui-rebuild-acceptance`, `tier5-svet-stress`, `unit/mollyStore`, `unit/m2-regressions`).
- Testy, které se pamlsků jen dotýkají (geometrie tlačítka krmení, počítadlo se třemi číslicemi v hlavičce, selektory poznámky v oslavě, `data-molly-treat`), se upraví tak, aby dál hlídaly svou původní věc na tom, co zůstalo.
- Přibudou pojistky:
  - unit: stav Molly načtený ze starého uloženého záznamu s pamlskovými poli se načte bez chyby, pole zahodí a zachová `petCount` a režim; starý zálohovací kód se obnoví;
  - E2E: po dokončení skutku na `/` je v oslavě „Molly děkuje.“, není tam žádné tlačítko krmení a Molly oslavu nezakrývá;
  - E2E: dock neobsahuje žádné číslo ani zmínku o pamlsku v textu, `title` ani `aria-label`;
  - invariant (`invariants.test.js`, seznam vyřazených vzorů a textů): výrazy `pamlsek`, `pamlsk`, `mňamk`, `Dát Molly`, `availableTreats`, `treatsFedTotal`, `giftDeeds` se nesmějí vrátit do `src/` (s výjimkou `src/lib/data/fallback-places.js`, kde jde o pamlsky pro psy v útulcích).
- Soubor `delayed-gratification-and-declutter.spec.ts` po odstranění bloku o pamlscích obsahuje hlavně progresivní odkrývání; přejmenování souboru je na staviteli (pokud ho přejmenuje, upraví `affected-rules.mjs`).

## Dokumentace a pravidla

Upravit tak, aby popisovaly nový stav a nezmiňovaly pamlsky ani dárky: `.claude/rules/molly.md`, `home-and-deed-stage.md`, `subpages.md`, `architecture.md` (popis `mollyTypes.js`), `README.md`, `CONCEPT_V2.md`, `user_journeys.md`. Do `CHANGELOG.md` zapsat změnu pod `[Unreleased]`; historické záznamy se nemění.

## Ověření hotové práce

1. `npm run verify:full` projde.
2. Ruční průchod na desktopu (1440×900) a úzkém mobilu (360×800): `/` včetně dokončení skutku, okno oslavy na `/app/online`, `/svet` včetně pohlazení Molly a dechového zastavení, dock v hlavičce i plovoucí.
3. Hledání v `src/` nenajde žádný z vyřazených výrazů mimo uvedenou výjimku.
4. Starý uložený stav (s pamlsky a dárky) se po nasazení načte bez chyby v konzoli.

## Co je ponecháno na staviteli

- Pořadí kroků a rozdělení práce.
- Signál, kterým se po dokončení skutku spustí přeměření polohy Molly.
- Přesné rozestupy a šířky docku po odstranění prvků.
- Drobné doladění znění nových textů v mezích pravidel.
- Zda přejmenovat vnitřní identifikátory, které mají „treat“ jen v názvu a slouží světelným obloukům na `/svet`.
- Rozhodnutí u jednotlivých testů, zda je odstranit, nebo upravit, podle pravidla výše.
