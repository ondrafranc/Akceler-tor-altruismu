/**
 * Kurátorovaný katalog českých mikro-akcí a občanských příležitostí.
 */

import { CLICK_AND_FEED } from './impactFacts.js';
import {
  EVIDENCE_TIERS,
  EVIDENCE_A_IDS,
  EVIDENCE_C_IDS,
  LONG_TERM_IDS,
  CONTACT_OK_IDS,
  PARTNER_REGISTRATION_IDS
} from './evidence.js';

export const MICRO_ACTIONS = [
  {
    id: 'zvirata_utulek_online',
    title: '🐾 Naplnit misku v českém útulku jedním klikem',
    org: 'Click and Feed',
    desc: `Jedním bezplatným kliknutím pošleš přes sponzora ${CLICK_AND_FEED.sponsor} (~${CLICK_AND_FEED.gramsPerClick} g krmiva na klik) skutečné granule psům a kočkám ve ${CLICK_AND_FEED.shelters} českých útulcích.`,
    whyItMatters: `Lidé už takto pomohli dodat přes ${CLICK_AND_FEED.totalTonnesLabel} tun krmiva do ${CLICK_AND_FEED.shelters} útulků po celé ČR.`,
    steps: [
      'Otevři stránku Click and Feed.',
      `Klikni na tlačítko „Klikni zdarma a naplň misku“ – sponzor ${CLICK_AND_FEED.sponsor} za tvůj klik pošle ~${CLICK_AND_FEED.gramsPerClick} g krmiva do českých útulků.`
    ],
    cta: 'Začít pomáhat',
    url: 'https://clickandfeed.cz/',
    reassurance: 'Zdarma a bez registrace — zabere to asi 15 vteřin.',
    selfBenefit: 'Okamžitá radost, že i v náročném dni konkrétně pomáháš',
    concreteImpact: `Podpora útulků (~${CLICK_AND_FEED.gramsPerClick} g krmiva na 1 klik od sponzora ${CLICK_AND_FEED.sponsor}; přes ${CLICK_AND_FEED.totalTonnesLabel} tun krmiva vyklikaných zdarma)`,
    element: 'animals',
    values: ['animals'],
    timeMinutes: 2,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 2 min • 💰 zdarma • 💻 online'
  },
  {
    id: 'aplikace_zachranka',
    title: '🚑 Nastavit si v mobilu českou aplikaci Záchranka',
    org: 'Aplikace Záchranka',
    desc: 'Nainstaluj si nebo zkontroluj aplikaci Záchranka — v nouzi s ní jedním stiskem přivoláš pomoc člověku na ulici a najdeš nejbližší defibrilátor.',
    whyItMatters: 'Když někdo kolem zkolabuje, přesná GPS poloha a mapa defibrilátorů rozhodují o minutách.',
    steps: [
      'Stáhni si aplikaci Záchranka (nebo v ní zkontroluj základní nastavení).',
      'Podívej se v mapě aplikace, kde je kolem tvého domova nebo školy nejbližší defibrilátor (AED).'
    ],
    cta: 'Otevřít web aplikace Záchranka',
    url: 'https://www.zachrankaapp.cz/',
    reassurance: 'Zdarma, bez reklam a funguje i na horách bez signálu dat.',
    selfBenefit: 'Jistota, že v krizové chvíli dokážeš pohotově pomoct druhým i sobě',
    concreteImpact: 'Připravená první pomoc a mapa AED defibrilátorů v kapse',
    element: 'care',
    values: ['health', 'community'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 3 min • 💰 zdarma • 📱 v mobilu'
  },
  {
    id: 'nevypusť_dusi',
    title: '🧠 Projít nebo poslat dál tahák první psychické pomoci',
    org: 'Nevypusť duši',
    desc: 'Podívej se na praktické infografiky péče o duševní zdraví pro mladé nebo pošli jeden užitečný tahák kamarádovi, kterému není dobře.',
    whyItMatters: 'Otevřenost a včasná podpora mezi kamarády snižuje pocit samoty a reálně chrání zdraví.',
    steps: [
      'Otevři stránku infografik Nevypusť duši a vyber si jedno téma (např. jak podpořit blízkého v úzkosti nebo jak nevyhořet).',
      'Ulož si obrázek do mobilu nebo ho pošli člověku, kterému se teď může hodit.'
    ],
    cta: 'Otevřít infografiky Nevypusť duši',
    url: 'https://nevypustdusi.cz/infografika/',
    reassurance: 'Všechny taháky jsou volně ke stažení zdarma a bez přihlašování.',
    selfBenefit: 'Praktické tipy proti vlastnímu přetížení a úzkosti od českých psychologů',
    concreteImpact: '1 srozumitelný tahák duševní opory po ruce',
    element: 'care',
    values: ['health', 'children', 'community'],
    timeMinutes: 4,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 4 min • 💰 zdarma • 💻 online'
  },
  {
    id: 'wikipedie_cz',
    title: '📝 Opravit překlep nebo doplnit fakt na české Wikipedii',
    org: 'Wikipedie ČR / Wikimedia Česká republika',
    desc: 'Otevři článek o své obci, škole nebo oblíbeném oboru na české Wikipedii a oprav v něm chybu nebo doplň chybějící zdroj.',
    whyItMatters: 'Českou Wikipedii čtou denně statisíce studentů. Každá drobná úprava zpřesňuje informace pro všechny ostatní.',
    steps: [
      'Otevři stránku WikiProjektu Kvalita nebo vyhledej článek o místě, které dobře znáš.',
      'Klikni na „Editovat“ a oprav překlep, zastaralý údaj nebo chybějící odkaz.'
    ],
    cta: 'Otevřít českou Wikipedii',
    url: 'https://cs.wikipedia.org/wiki/Wikipedie:WikiProjekt_Kvalita',
    reassurance: 'Drobnou opravu překlepu zvládneš v prohlížeči i bez zakládání účtu.',
    selfBenefit: 'Příjemné soustředění na jednu konkrétní věc a užitečná stopa na českém webu',
    concreteImpact: '1 zpřesněný článek pro tisíce čtenářů v ČR',
    element: 'knowledge',
    values: ['education', 'community'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 💻 online'
  },
  {
    id: 'missing_maps',
    title: '🗺️ Obkreslit 10 budov ze satelitu pro Lékaře bez hranic',
    org: 'Missing Maps CZ & SK',
    desc: 'Pomoz zmapovat bílá místa na mapě světa přímo v prohlížeči. Stačí obkreslit obdélníky střech na satelitním snímku.',
    whyItMatters: 'Když přijde povodeň nebo epidemie, humanitární týmy díky těmto mapám vědí, kde žijí lidé a kudy k nim doručit pomoc.',
    steps: [
      'Otevři český portál Missing Maps a klikni na „Začni mapovat“.',
      'Vyber si jeden malý čtverec mapy a za 10–15 minut v klidu obkresli viditelné budovy.'
    ],
    cta: 'Začít mapovat na Missing Maps',
    url: 'https://missingmaps.org/cs/',
    reassurance: 'Součástí je krátký český návod — kreslíš jen jednoduché obdélníky střech podle satelitu.',
    selfBenefit: 'Uklidňující tichá práce u obrazovky, skvělá třeba k hudbě nebo podcastu',
    concreteImpact: 'Zmapované budovy pro humanitární týmy v terénu',
    element: 'knowledge',
    values: ['health', 'poverty', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'tech',
    metaLabel: '⏱️ 10–15 min • 💰 zdarma • 💻 z domova'
  },
  {
    id: 'letters_seniors',
    title: '👵 Podpořit osamělého seniora (Krása pomoci / Ježíškova vnoučata)',
    org: 'Nadace Krása pomoci / Ježíškova vnoučata',
    desc: 'Zapoj se do přátelských návštěv, telefonátů nebo splň drobné přání osamělému seniorovi v domově.',
    whyItMatters: 'Osamělost trápí statisíce českých seniorů – osobní zájem a rozhovor jim vrací radost do běžného týdne.',
    steps: [
      'Otevři stránku Nadace Krása pomoci a podívej se, jak funguje dobrovolnictví u seniorů.',
      'Můžeš začít nezávazným přihlášením k občasnému popovídání nebo doprovodu na procházku.'
    ],
    cta: 'Otevřít Nadaci Krása pomoci',
    url: 'https://www.krasapomoci.cz/',
    reassurance: 'Koordinátoři tě citlivě provedou a domluví s tebou jen to, na co se cítíš.',
    selfBenefit: 'Zpomalení v uspěchaném týdnu a obohacující setkání s člověkem plným zkušeností',
    concreteImpact: 'Méně samoty pro konkrétního seniora v ČR',
    element: 'community',
    values: ['elderly', 'community', 'health'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'home',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 10–15 min • 💰 zdarma • 🏠 z domova i osobně'
  },
  {
    id: 'cesko_digital_micro',
    title: '💻 Pomoci neziskovce s webem, textem nebo tabulkou',
    org: 'Česko.Digital (Tržiště příležitostí)',
    desc: 'Prohlédni si aktuální mikro-úkoly na Tržišti příležitostí, kde české neziskovky hledají jednorázovou pomoc na pár hodin.',
    whyItMatters: 'Tvoje běžné digitální nebo studentské dovednosti ušetří neziskové organizaci týdny tápání.',
    steps: [
      'Otevři Tržiště příležitostí na Česko.Digital.',
      'Vyfiltruj si jednorázovou výpomoc podle toho, co umíš (texty, grafika, tabulky, kód, konzultace).',
      'Ozvi se koordinátorovi jedním klikem.'
    ],
    cta: 'Prohlédnout příležitosti na Česko.Digital',
    url: 'https://app.cesko.digital/opportunities',
    reassurance: 'Prohlížení je bez přihlášení a řada úkolů je jednorázová na 1–2 hodiny.',
    selfBenefit: 'Zkušenost na reálném smysluplném projektu a kontakt s přátelskou komunitou',
    concreteImpact: 'Vyřešený digitální úkol pro českou neziskovku',
    element: 'knowledge',
    values: ['education', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'tech',
    metaLabel: '⏱️ 5–15 min výběr • 💰 zdarma • 💻 online'
  },
  {
    id: 'ucime_online',
    title: '🧑‍🏫 Doučovat dítě online (1 hodina týdně)',
    org: 'Učíme online / Česko.Digital',
    desc: 'Pomoz přes videohovor dítěti, kterému doma nemohou poradit s češtinou, matematikou nebo angličtinou.',
    whyItMatters: 'Jedna hodina týdně dokáže dítěti vrátit sebevědomí ve škole a otevřít mu lepší šanci do života.',
    steps: [
      'Otevři portál Učíme online a podívej se na možnosti zapojení dobrovolníků.',
      'Vyber si předmět, ve kterém se cítíš jistě (stačí učivo základní školy).',
      'Nemusíš být učitel – stačí trpělivost a lidský přístup.'
    ],
    cta: 'Zjistit info na Učíme online',
    url: 'https://www.ucimeonline.cz/',
    reassurance: 'Nemusíš být učitel — stačí trpělivost s látkou základní školy.',
    selfBenefit: 'Smysluplná hodina týdně z pohodlí domova a opravdová vděčnost dítěte',
    concreteImpact: '1 dítě s lepší šancí zvládnout školu v klidu',
    element: 'knowledge',
    values: ['education', 'children', 'poverty'],
    timeMinutes: 45,
    timeBucket: '45',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'tutoring',
    metaLabel: '⏱️ registrace 5 min • 💰 zdarma • 💻 online'
  },
  {
    id: 'knihobudka_kniha',
    title: '📚 Zanést přečtenou knihu do veřejné Knihobudky v ulici',
    org: 'Kam s ním? / Sousedské knihobudky',
    desc: 'Vyber doma jednu knihu, kterou už nebudeš číst, a při nejbližší procházce ji vlož do veřejné knihobudky pro sousedy.',
    whyItMatters: 'Drobná radost pro náhodného kolemjdoucího a příjemný důvod vyjít na 10 minut ven bez jakéhokoliv tlaku.',
    steps: [
      'Najdi doma v poličce jednu hezkou knihu, kterou už máš přečtenou.',
      'Na české mapě Kam s ním? (nebo na naší Mapě v okolí pod filtrem Knihobudky) najdi nejbližší budku.',
      'Při procházce knihu vlož dovnitř – a klidně si rovnou odnes jinou.'
    ],
    cta: 'Najít knihobudku na Kam s ním?',
    url: 'https://www.kamsnim.cz/',
    reassurance: '100% bez registrace a bez domlouvání s kýmkoliv — prostě se projdeš.',
    selfBenefit: 'Deset minut na čerstvém vzduchu a provětraná polička doma',
    concreteImpact: '1 příběh poslaný zdarma dál sousedům v ulici',
    element: 'community',
    values: ['community', 'education', 'environment'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 10 min • 💰 zdarma • 🚶 procházka'
  },
  {
    id: 'trash_hero_uklid',
    title: '🧤 Posbírat 5 kusů odpadků při běžné procházce',
    org: 'Ukliďme Česko / Osobní mikro-krok',
    desc: 'Nepotřebuješ velkou organizovanou akci. Při nejbližší cestě ven posbírej 5 kusů plastu nebo papíru a vyhoď je do koše.',
    whyItMatters: 'Okamžitá proměna místa kolem tebe za 2 minuty, bez registrace a bez čekání na kohokoliv.',
    steps: [
      'Až dnes půjdeš ven (do školy, do práce nebo se projít), vezmi si do kapsy sáček nebo ubrousek.',
      'Cestou seber 5 kusů pohozeného plastu nebo papíru a hoď je do nejbližšího koše.',
      'Pokud chceš potkat další lidi, mrkni na mapu společných úklidů Ukliďme Česko.'
    ],
    cta: 'Mapa akcí Ukliďme Česko',
    url: 'https://www.uklidmecesko.cz/',
    reassurance: 'Nepotřebuješ se nikam hlásit — stačí tvoje běžná pěší cesta.',
    selfBenefit: 'Okamžitý viditelný výsledek přímo před očima a protažení na vzduchu',
    concreteImpact: 'Čistší kousek parku nebo chodníku ve tvém okolí',
    element: 'nature',
    values: ['environment', 'community'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 🌿 hned teď'
  },
  {
    id: 'inaturalist_priroda',
    title: '🦋 Vyfotit rostlinu nebo hmyz pro vědce (občanská věda)',
    org: 'iNaturalist CZ / Akademie věd ČR',
    desc: 'Při procházce vyfoť mobilem zajímavou rostlinu, houbu nebo brouka a nahraj pozorování do otevřené databáze přírody.',
    whyItMatters: 'Tvoje fotka pomůže českým biologům a ochranářům mapovat rozmanitost přírody a chránit ohrožené druhy v ČR.',
    steps: [
      'Otevři iNaturalist (web nebo bezplatnou mobilní aplikaci).',
      'Vyfoť venku jakýkoliv zajímavý druh – aplikace i komunita přírodovědců ti ho pomohou určit.'
    ],
    cta: 'Prozkoumat iNaturalist',
    url: 'https://www.inaturalist.org/',
    reassurance: 'Druh nemusíš umět určit — aplikace i přírodovědci ti s tím pomohou.',
    selfBenefit: 'Všímavá procházka přírodou, při které objevíš druhy rostoucí hned za domem',
    concreteImpact: '1 záznam biodiverzity pro vědce a ochránce přírody',
    element: 'nature',
    values: ['environment', 'education'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 5–10 min • 💰 zdarma • 🚶 venku s mobilem'
  },
  {
    id: 'darovani_krve',
    title: '🩸 Zjistit možnosti prvodárcovství krve v okolí',
    org: 'Český červený kříž',
    desc: 'Podívej se, co obnáší darování krve nebo plazmy pro prvodárce a kde je nejbližší transfuzní stanice.',
    whyItMatters: 'Jeden odběr trvá jen pár desítek minut a dokáže zachránit až 3 lidské životy.',
    steps: [
      'Projdi si 5 rychlých bodů, kdo může darovat krev (věk 18–65 let, váha nad 50 kg).',
      'Najdi si nejbližší transfuzní oddělení nemocnice a zarezervuj si termín pro prvodárce.'
    ],
    cta: 'Informace pro dárce krve (ČČK)',
    url: 'https://www.cervenykriz.eu/darcovstvi-krve/',
    reassurance: 'Před návštěvou nemusíš ke svému praktikovi — vše proběhne v klidu na místě a samotný odběr trvá do 10 minut.',
    selfBenefit: 'Bezplatný krevní obraz, občerstvení a ze zákona den volna ve škole nebo v práci',
    concreteImpact: 'Až 3 zachráněné lidské životy z 1 odběru',
    element: 'care',
    values: ['health', 'community'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 5 min info • 💰 zdarma • ❤️ vysoký dopad'
  },
  {
    id: 'kostni_dren',
    title: '🧬 Zjistit zápis do registru dárců kostní dřeně (18–35 let)',
    org: 'Český národní registr dárců dřeně (ČNRDD)',
    desc: 'Pokud je ti 18–35 let, podívej se, jak probíhá bezbolestný zápis do registru (170 104 registrovaných dárců a 2 939 odběrů) pomocí stěru z úst.',
    whyItMatters: 'Pro pacienta s leukémií jsi možná jediná shoda na světě. Samotný zápis zabere 10 minut a vůbec nebolí.',
    steps: [
      'Otevři průvodce vstupem do registru a ověř si základní zdravotní podmínky (18–35 let).',
      'Najdeš tam seznam náběrových míst po celé ČR (často i na vysokých školách a festivalech).'
    ],
    cta: 'Podmínky vstupu do registru ČNRDD',
    url: 'https://registr.kostnidren.cz/vstup-do-registru/',
    reassurance: 'Registrace není odběr – jde jen o 5minutový bezbolestný stěr vatovou štětičkou z úst.',
    selfBenefit: 'Hluboký pocit smyslu z vědomí, že jednou můžeš někomu zachránit život',
    concreteImpact: 'Zápis do klinického registru (170 104 dárců, 2 939 skutečných odběrů)',
    element: 'care',
    values: ['health', 'children', 'community'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 5 min info • 💰 zdarma • 🧬 pro mladé 18–35 let'
  },
  {
    id: 'remobil_telefon',
    title: '📱 Poslat starý mobil ze šuplíku zdarma s kódem Zásilkovny',
    org: 'Remobil, z. s.',
    desc: 'Vytáhni ze šuplíku starý nefunkční mobil a cestou do školy/práce ho podej na jakékoliv Zásilkovně s bezplatným kódem 98 765 259.',
    whyItMatters: 'Přes Remobil lidé zrecyklovali už 221 060 mobilů (2,21 mil. Kč na charitu) – z každého telefonu jde 10 Kč na dobrou věc a práce pro lidi s hendikepem.',
    reassurance: 'U přepážky Zásilkovny jen nahlásíš kód 98 765 259 – nic netiskneš a neplatíš ani korunu.',
    steps: [
      'Vytáhni ze šuplíku starý mobil (klidně i nefunkční) a zabal ho do obálky nebo krabičky.',
      'Zanes ho na jakoukoliv Zásilkovnu s bezplatným kódem 98 765 259 (nebo najdi sběrný box na webu Remobil).'
    ],
    cta: 'Detail a sběrná místa Remobil',
    url: 'https://remobil.cz/odevzdat-mobil/',
    selfBenefit: 'Uklizený šuplík bez elektroodpadu během běžné cesty kolem Zásilkovny',
    concreteImpact: '1 recyklovaný telefon + 10 Kč na charitu (celkem 221 060 mobilů)',
    element: 'nature',
    values: ['environment', 'poverty'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 10 min • 💰 zdarma (kód 98 765 259) • ♻️ z šuplíku'
  },
  {
    id: 'potravinova_banka',
    title: '🥫 Zapojit se v Potravinové bance (třídění potravin)',
    org: 'Česká federace potravinových bank',
    desc: 'Pomoz na pár hodin třídit zachráněné potraviny pro samoživitele, seniory a rodiny v nouzi ve svém kraji.',
    whyItMatters: 'Potravinové banky v ČR ročně zachrání 17 400 tun jídla pro 430 000 lidí v nouzi – za pár hodin ve skladu vidíš okamžitý výsledek.',
    steps: [
      'Na webu České federace potravinových bank klikni na svůj kraj.',
      'Napiš koordinátorovi krátký e-mail, kdy máš čas přijít na 2–3 hodiny vypomoct ve skladu.'
    ],
    cta: 'Najít potravinovou banku v kraji',
    url: 'https://www.potravinovebanky.cz/',
    reassurance: 'Stačí jednorázová domluva na pár hodin — v přátelském týmu ti na místě vše ukážou.',
    selfBenefit: 'Odpočinek od obrazovek u smysluplné ruční práce, kde hned vidíš výsledek',
    concreteImpact: 'Desítky porcí zachráněného jídla (součást 17 400 tun ročně v ČR)',
    element: 'community',
    values: ['poverty', 'environment', 'community'],
    timeMinutes: 60,
    timeBucket: '45',
    cost: 'free',
    mode: 'local',
    social: 'group',
    categoryTag: 'community',
    metaLabel: '⏱️ domluva 5 min • 💰 zdarma • 🤝 v týmu'
  },
  {
    id: 'brontosaurus_vikend',
    title: '⛺ Vyrazit na jednodenní nebo víkendovou akci v přírodě',
    org: 'Hnutí Brontosaurus',
    desc: 'Přidej se k partě mladých lidí na kosení orchidejových luk, sázení stromů nebo opravu hradu ve svém kraji.',
    whyItMatters: 'Nejlepší lék na osamělost a digitální únavu – strávíš den venku, uděláš kus práce a poznáš přátelské lidi.',
    steps: [
      'Otevři kalendář dobrovolnických akcí Brontosaura.',
      'Vyfiltruj si jednodenní nebo víkendovou akci pro prvoúčastníky (žádné předchozí zkušenosti nejsou potřeba, většina lidí jede poprvé sama).'
    ],
    cta: 'Kalendář akcí Brontosaura',
    url: 'https://brontosaurus.cz/dobrovolnicke-akce/',
    reassurance: 'Na webu je přímo filtr „jedu poprvé“ a „jednodenní“ – drtivá většina mladých vyráží poprvé sama.',
    selfBenefit: 'Den na čerstvém vzduchu mimo město a přirozené seznámení s fajn lidmi',
    concreteImpact: 'Kus opečované české přírody nebo památky',
    element: 'nature',
    values: ['environment', 'community'],
    timeMinutes: 60,
    timeBucket: '45',
    cost: 'free',
    mode: 'local',
    social: 'group',
    categoryTag: 'nature',
    metaLabel: '⏱️ výběr 5 min • 💰 zdarma/symbolicky • 🤝 noví lidé'
  },
  {
    id: 'nadeje_jidlo',
    title: '🍞 Darovat teplou polévku a nocleh (Nocleženka)',
    org: 'Armáda spásy – Nocleženka',
    desc: 'Přes Nocleženku můžeš během 2 minut zaplatit teplé jídlo, sprchu a bezpečnou noc pod střechou pro člověka bez domova.',
    whyItMatters: 'Okamžitá a velmi konkrétní pomoc člověku v akutní nouzi přímo v českých městech.',
    steps: [
      'Otevři projekt Nocleženka a vyber počet nocleženek.',
      'Člověk v nouzi díky tomu získá nejen postel v teple, ale i polévku, hygienu a oporu sociálního pracovníka.'
    ],
    cta: 'Darovat Nocleženku',
    url: 'https://noclezenka.cz/',
    reassurance: 'Jednorázová podpora online bez jakýchkoliv budoucích závazků.',
    selfBenefit: 'Hřejivý pocit, že dnes večer někdo nepřečká mráz na ulici',
    concreteImpact: '1 noc v teple, polévka a sprcha pro člověka v nouzi',
    element: 'care',
    values: ['poverty', 'community', 'health'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 2 min • 💰 od 100 Kč • 💻 online'
  },
  {
    id: 'sazime_budoucnost',
    title: '🌳 Podpořit výsadbu stromů v české krajině',
    org: 'Sázíme budoucnost (Nadace Partnerství)',
    desc: 'Podpoř výsadbu a následnou péči o stromy v české krajině a obcích – nebo se podívej na mapu výsadeb v okolí.',
    whyItMatters: 'Stromy zadržují vodu v krajině a chladí ulice. I drobný příspěvek nebo účast na výsadbě má trvalý dopad.',
    steps: [
      'Otevři web Sázíme budoucnost a prohlédni si mapu aktuálních komunitních výsadeb.',
      'Přidej se jako dobrovolník na sázecí akci v okolí, nebo přispěj drobnou částkou na sazenice.'
    ],
    cta: 'Otevřít Sázíme budoucnost',
    url: 'https://www.sazimebudoucnost.cz/',
    reassurance: 'Můžeš se jen podívat na mapu výsadeb v okolí nebo přispět libovolnou drobnou částkou.',
    selfBenefit: 'Živé propojení s českou krajinou, kolem které budeš roky chodit',
    concreteImpact: 'Podpora výsadby a péče o stromy v ČR',
    element: 'nature',
    values: ['environment', 'community'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 2–5 min • 💰 dobrovolné • 💻 online'
  },
  {
    id: 'krabice_od_bot',
    title: '🎁 Podpořit děti z chudých rodin v ČR (Krabice od bot)',
    org: 'Diakonie ČCE – Krabice od bot',
    desc: 'Celoroční sbírka a předvánoční akce na podporu dětí z azylových domů a nízkopříjmových rodin v Česku.',
    whyItMatters: 'Pomáhá dětem v nouzi zažít radost, zaplatit kroužky, školní pomůcky nebo letní tábor.',
    steps: [
      'Otevři web Krabice od bot a podívej se na aktuální možnosti zapojení (sběrná místa nebo online podpora Krabice online).',
      'Vyber si formu pomoci, která ti sedí.'
    ],
    cta: 'Otevřít Krabice od bot',
    url: 'https://www.krabiceodbot.cz/',
    reassurance: 'Lze se zapojit jednorázově online i osobně přes sběrná místa v celém Česku.',
    selfBenefit: 'Čistá radost z toho, že konkrétnímu dítěti v Česku uděláš hezčí den',
    concreteImpact: 'Podpora kroužků, pomůcek nebo dárku pro dítě v nouzi',
    element: 'care',
    values: ['children', 'poverty', 'education'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 3–5 min • 💰 dobrovolné • 💻 online i osobně'
  },
  {
    id: 'charita_dar',
    title: '💚 Jednorázový dar 100–200 Kč na terénní péči',
    org: 'Charita Česká republika',
    desc: 'Podpoř terénní sestry, hospice a pomoc rodinám v tísni přímo v českých regionech.',
    whyItMatters: 'Charita ČR patří k nejrozšířenějším sítím přímé lidské pomoci seniorům a rodinám v Česku.',
    steps: [
      'Otevři darovací stránku Charity ČR.',
      'Zvol jednorázový dar nebo QR platbu na oblast pomoci, která je ti nejbližší.'
    ],
    cta: 'Podpořit terénní péči',
    url: 'https://www.charita.cz/podporte-nas/',
    reassurance: 'Rychlá QR platba na libovolnou částku bez povinné registrace.',
    selfBenefit: 'Jistota, že dar pomáhá přímo terénním sestrám a rodinám v českých regionech',
    concreteImpact: 'Přímá podpora domácí a hospicové péče v ČR',
    element: 'care',
    values: ['health', 'elderly', 'poverty'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 3 min • 💰 dobrovolné • 💻 online'
  },
  {
    id: 'birdlife_ptaci_pasti',
    title: '🐦 Nahlásit prosklenou zastávku nebezpečnou pro ptáky',
    org: 'Česká společnost ornitologická – Ptačí pasti',
    desc: 'Místo scrollování na zastávce zadej do mobilního webu Ptačí pasti nebezpečnou prosklenou plochu nebo nález ptáka u skla – bez registrace.',
    whyItMatters: 'Díky hlášením od obyčejných lidí pak ornitologové prosazují u obcí polepy zastávek, které zachrání stovky ptáků.',
    reassurance: 'Nepotřebuješ se registrovat ani poznat druh ptáka – stačí fotka z mobilu na 2 minuty.',
    steps: [
      'Až uvidíš prosklenou zastávku nebo protihlukovou stěnu bez ochranných polepů, otevři v mobilu Ptačí pasti.',
      'Přidej místo jedním klikem bez přihlašování.'
    ],
    cta: 'Otevřít mobilní web Ptačí pasti',
    url: 'https://projekty.birds.cz/ptacipasti/',
    selfBenefit: 'Smysluplné dvouminutové využití čekání na autobus místo scrollování',
    concreteImpact: '1 nahlášená skleněná plocha pro bezpečnější let ptáků',
    element: 'animals',
    values: ['animals', 'environment'],
    timeMinutes: 2,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 2 min • 💰 zdarma • 📱 bez registrace'
  },
  {
    id: 'strnadi_nareci',
    title: '🎶 Sundat venku sluchátka a nahrát 15 s ptačího nářečí',
    org: 'ČSO & Přírodovědecká fakulta UK – Nářečí strnadů',
    desc: 'Při procházce sundej na chvíli sluchátka, zaposlouchej se a nahraj na mobil zpěv strnada obecného pro mapu českých ptačích dialektů.',
    whyItMatters: 'Uklidníš vlastní hlavu v přírodě a pomůžeš českým vědcům zmapovat unikátní kulturní dědictví v ptačím zpěvu.',
    reassurance: 'Nemusíš být ornitolog – na webu si poslechneš krátkou ukázku („jak zpívá strnad“) a nahrávku nahraješ z mobilu.',
    steps: [
      'Poslechni si na webu Strnadi.cz typický popěvek strnada (zní trochu jako začátek Beethovenovy Osudové).',
      'Až ho na procházce zaslechneš, nahraj 15 vteřin na diktafon v mobilu a vlož do mapy.'
    ],
    cta: 'Poslechnout si ptačí nářečí',
    url: 'https://strnadi.cz/vitejte',
    selfBenefit: 'Okamžité ztišení mysli, když na chvíli sundáš sluchátka a posloucháš krajinu',
    concreteImpact: '1 nahrávka pro mapu českých ptačích dialektů',
    element: 'animals',
    values: ['environment', 'animals', 'education'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 🎧 klid venku'
  },
  {
    id: 'na_ovoce_strom',
    title: '🍎 Přidat volně rostoucí jabloň nebo třešeň do mapy Na ovoce',
    org: 'Na ovoce, z. s.',
    desc: 'Víš u cesty nebo v parku o veřejném ovocném stromu, pod kterým jinak shnije úroda? Přidej špendlík do otevřené komunitní mapy.',
    whyItMatters: 'Studenti a sousedé z okolí si tam nasbírají čerstvé ovoce zdarma a staré aleje dostanou péči místo zapomnění.',
    steps: [
      'Otevři komunitní mapu Na ovoce a podívej se, jaké volně přístupné stromy rostou kolem tebe.',
      'Při procházce přidej nový ovocný strom nebo bylinku (nebo si jen dojdi nasbírat, co dozrává).'
    ],
    cta: 'Otevřít mapu Na ovoce',
    url: 'https://map.na-ovoce.cz/',
    reassurance: 'Prohlížení mapy volně přístupných stromů ve tvém okolí je zcela zdarma a bez účtu.',
    selfBenefit: 'Objevíš zapomenuté třešně, jabloně a ořešáky na procházkách kolem domova',
    concreteImpact: 'Sdílená mapa čerstvého ovoce zdarma pro sousedy',
    element: 'nature',
    values: ['environment', 'community', 'poverty'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 🌳 čerstvý vzduch'
  },
  {
    id: 'zachran_jidlo_recept',
    title: '🥕 Uvařit rychlou večeři ze surovin „na hraně“ místo vyhození',
    org: 'Zachraň jídlo',
    desc: 'Než vyhodíš gumovou mrkev, starší pečivo nebo přezrálé ovoce v lednici, naklikej si levný 15minutový záchranářský recept.',
    whyItMatters: 'Domácnosti tvoří přes polovinu plýtvání jídlem – ušetříš stovky korun za jídlo a rovnou ulevíš planetě.',
    reassurance: 'Na webu si jen zaklikneš surovinu z lednice + filtr „Levné / Rychlé“ – ideální na kolej i do bytu.',
    steps: [
      'Podívej se do lednice na jednu surovinu, která už ztrácí kondici (pečivo, zelenina, bylinky, mléčné výrobky).',
      'Na Zachraň jídlo vyber tuhle surovinu ve filtru a udělej si z ní dobrou rychlou večeři.'
    ],
    cta: 'Najít rychlý recept na Zachraň jídlo',
    url: 'https://zachranjidlo.cz/recepty/',
    selfBenefit: 'Teplá domácí večeře za pár korun ze surovin, které už doma máš',
    concreteImpact: 'Ušetřené jídlo i peníze bez zbytečného vyhazování',
    element: 'nature',
    values: ['environment', 'poverty'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'home',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 15 min • 💰 ušetří peníze • 🍳 doma v kuchyni'
  },
  {
    id: 'freerice_ryze',
    title: '🍚 Darovat zrnka rýže správnými odpověďmi v kvízu',
    org: 'Freerice (Světový potravinový program OSN)',
    desc: 'Přelož z gauče 10 anglických slovíček nebo odpověz na zeměpisné otázky – bez registrace. Za každou správnou odpověď sponzoři pošlou 10 zrnek rýže lidem v nouzi.',
    whyItMatters: 'Okamžitá náhrada za bezmyšlenkovité scrollování: procvičíš si angličtinu a reálně naplníš misku jídla.',
    reassurance: 'Funguje okamžitě od 1. vteřiny bez účtu a bez e-mailu – klidně na 2 minuty v tramvaji.',
    steps: [
      'Otevři Freerice – hned na první obrazovce na tebe čeká první slovíčko.',
      'Naklikej 10–20 správných odpovědí a sleduj, jak se ti plní miska darované rýže.'
    ],
    cta: 'Spustit kvíz Freerice bez přihlášení',
    url: 'https://play.freerice.com/',
    selfBenefit: 'Lehké procvičení slovíček a soustředění na 2 minuty místo zpráv',
    concreteImpact: 'Darovaná zrnka rýže pro Světový potravinový program',
    element: 'knowledge',
    values: ['poverty', 'education'],
    timeMinutes: 2,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 2 min • 💰 zdarma • 📱 0 s bez registrace'
  },
  {
    id: 'zooniverse_veda',
    title: '🔭 Počítat tučňáky, běluhy nebo galaxie na fotkách pro vědce',
    org: 'Zooniverse – People-Powered Research',
    desc: 'Zapoj se z gauče bez přihlášení do skutečného výzkumu Oxfordu a dalších univerzit: označuj zvířata z fotopastí nebo hvězdokupy.',
    whyItMatters: 'Lidské oko pořád vidí detaily, které algoritmům unikají. Tvých 5 minut reálně posune vědeckou studii.',
    reassurance: 'Žádný titul ani registrace nejsou potřeba – u každého projektu je 30vteřinový obrázkový návod.',
    steps: [
      'Otevři katalog projektů Zooniverse a vyber si přírodu, vesmír nebo historii.',
      'Klikni na „Classify“ a v klidu u čaje projdi 5 fotek.'
    ],
    cta: 'Prozkoumat projekty na Zooniverse',
    url: 'https://www.zooniverse.org/projects',
    selfBenefit: 'Meditativní prohlížení fotek divočiny či vesmíru u ranního čaje',
    concreteImpact: '5 klasifikovaných snímků pro skutečný vědecký výzkum',
    element: 'knowledge',
    values: ['education', 'environment', 'animals'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'tech',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 💻 uklidňující klikání'
  },
  {
    id: 'amnesty_apel',
    title: '✍️ Podepsat za 2 minuty apel za nespravedlivě vězněného člověka',
    org: 'Amnesty International ČR – Maraton psaní dopisů',
    desc: 'Připoj své jméno k dopisu solidarity pro konkrétního studenta, novináře nebo obránce přírody, který skončil nespravedlivě za mřížemi.',
    whyItMatters: 'Když úřadům přijdou tisíce dopisů z celého světa, nemohou případ ututlat – přes třetinu lidí z Maratonu se podaří dostat na svobodu.',
    reassurance: 'Soukromí v bezpečí: adresátům odchází pouze tvoje křestní jméno a první písmeno příjmení.',
    steps: [
      'Otevři český web Maratonu psaní dopisů nebo aktuálních apelů Amnesty ČR.',
      'Přečti si jeden konkrétní lidský příběh a pošli hlas na jeho obranu.'
    ],
    cta: 'Otevřít příběhy na Amnesty ČR',
    url: 'https://maraton.amnesty.cz/',
    selfBenefit: 'Pocit sounáležitosti a vědomí, že tvůj hlas má reálnou váhu',
    concreteImpact: '1 hlas solidarity na obranu nespravedlivě vězněného člověka',
    element: 'knowledge',
    values: ['community', 'education'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 3 min • 💰 zdarma • 🕊️ reálné propuštění lidí'
  },
  {
    id: 'moudra_sovicka_mobil',
    title: '🧓 Trpělivě pomoct seniorovi s mobilem nebo počítačem',
    org: 'Moudrá Sovička z.s.',
    desc: 'Pro mladého člověka 5 minut nastavení v telefonu, pro babičku, dědu nebo staršího souseda záchrana před osamělostí a podvodnými SMS.',
    whyItMatters: 'Digitální bariéra odřezává seniory od rodiny i světa – lidská trpělivost je tu cennější než peníze.',
    steps: [
      'Zeptej se prarodičů nebo staršího souseda v domě, jestli nepotřebují zvětšit písmo v mobilu, nastavit WhatsApp nebo promazat spam.',
      'Chceš-li pomáhat pravidelněji jako digitální asistent, mrkni na český spolek Moudrá Sovička.'
    ],
    cta: 'Poznat projekt Moudrá Sovička',
    url: 'https://www.moudrasovicka.cz/',
    reassurance: 'Začít můžeš úplně neformálně u vlastní babičky, dědy nebo souseda v domě.',
    selfBenefit: 'Okamžitý úsměv a obrovská úleva blízkého člověka, kterému odemkneš kontakt s rodinou',
    concreteImpact: '1 senior chráněný před digitální samotou a podvody',
    element: 'community',
    values: ['elderly', 'education', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'home',
    social: 'solo',
    categoryTag: 'tutoring',
    metaLabel: '⏱️ 15 min • 💰 zdarma • 💬 obrovská vděčnost'
  },
  {
    id: 'kola_pro_afriku',
    title: '🚲 Poslat nepoužívané kolo ze sklepa dětem na cestu do školy',
    org: 'Kola pro Afriku',
    desc: 'Práší se u vás nebo u prarodičů ve sklepě na staré horské či dětské kolo? Dovez ho na jedno ze sběrných míst po celém Česku.',
    whyItMatters: 'V české sociální dílně dají kolu druhý život a dítěti v Gambii zkrátí každodenní mnohakilometrovou pěší cestu do školy.',
    steps: [
      'Podívej se na mapu komunitních sběrných míst Kola pro Afriku ve svém kraji.',
      'Domluv se doma nebo u prarodičů a přivezte staré kolo, na kterém už nikdo nejezdí.'
    ],
    cta: 'Najít sběrné místo Kola pro Afriku',
    url: 'https://www.kolaproafriku.cz/sbernamista',
    reassurance: 'Kolo nemusí být v perfektním stavu — v české sociální dílně ho odborně seřídí.',
    selfBenefit: 'Volné místo ve sklepě nebo garáži a radost, že staré kolo dál jezdí',
    concreteImpact: '1 kolo pro každodenní cestu dítěte do školy',
    element: 'community',
    values: ['children', 'education', 'environment'],
    timeMinutes: 30,
    timeBucket: '45',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 30 min jednorázově • 💰 zdarma • 🚲 druhý život věcem'
  },
  {
    id: 'inex_workcamp_cr',
    title: '🎒 Zažít víkendový miniprojekt s mladými lidmi přímo v Česku',
    org: 'INEX – Sdružení dobrovolných aktivit',
    desc: 'Nemusíš letět přes půl světa – vyjeď na pár dní obnovit sad, památku nebo komunitní zahradu v ČR s partou mladých lidí z různých koutů světa.',
    whyItMatters: 'Vypneš hlavu od sociálních sítí, procvičíš si přirozeně angličtinu a získáš opravdové přátele mimo bublinu.',
    reassurance: 'Jede se jednotlivě (bez předchozí party) a koordinátoři se starají o pohodovou atmosféru od první minuty.',
    steps: [
      'Otevři přehled českých workcampů a víkendovek na INEX-SDA.',
      'Vyber si místo v ČR, které tě láká atmosférou (ekofarma, hrad, festival nebo příroda).'
    ],
    cta: 'Prohlédnout workcampy v ČR (INEX)',
    url: 'https://www.inexsda.cz/workcampy-v-cr/',
    selfBenefit: 'Noví kamarádi mimo bublinu a přirozená angličtina u ohně',
    concreteImpact: '1 obnovená památka, sad nebo komunitní místo v ČR',
    element: 'community',
    values: ['community', 'environment', 'education'],
    timeMinutes: 45,
    timeBucket: '45',
    cost: 'free',
    mode: 'local',
    social: 'group',
    categoryTag: 'community',
    metaLabel: '⏱️ výběr 5 min • 💰 dostupné pro studenty • 🌍 nová přátelství'
  },
  {
    id: 'zvire_v_nouzi',
    title: '🦔 Uložit si do mobilu pohotovost pro zraněné ježky a ptáky',
    org: 'ČSOP – Národní síť záchranných stanic (Zvíře v nouzi)',
    desc: 'Ulož si do kontaktů číslo 774 155 155 a podívej se na mapu 34 českých záchranných stanic pro chvíle, kdy venku najdeš zraněné volně žijící zvíře.',
    whyItMatters: 'České záchranné stanice ročně zachrání přes 40 000 divokých zvířat — včasný telefonát rozhoduje o přežití.',
    reassurance: '100% bez registrace. Než na nalezené zvíře nebo mládě sáhneš, dispečink ti po telefonu v klidu řekne, co přesně udělat.',
    selfBenefit: 'Konec paniky a bezmoci, až při procházce narazíš na zraněného ptáka nebo ježka',
    concreteImpact: 'Přímé spojení na 34 záchranných stanic v ČR',
    element: 'animals',
    steps: [
      'Otevři web Zvíře v nouzi a ulož si do mobilu centrální linku 774 155 155.',
      'Klikni na mapu a mrkni, která záchranná stanice pokrývá tvoje město nebo chatu.'
    ],
    cta: 'Otevřít Zvíře v nouzi (ČSOP)',
    url: 'https://www.zvirevnouzi.cz/',
    values: ['animals', 'environment'],
    timeMinutes: 2,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 2 min • 💰 zdarma • 📱 100% bez registrace'
  },
  {
    id: 'opatruj_se_nudz',
    title: '🧘 Zkusit 5minutový vědecký check-in duševní pohody',
    org: 'NÚDZ – Opatruj.se',
    desc: 'Projdi si anonymní 5minutové cvičení duševní hygieny nebo praktický návod od českých psychologů, jak mluvit s blízkým, kterému je těžko.',
    whyItMatters: 'Nemůžeš dlouhodobě svítit druhým, když přitom vyhoříš. Péče o vlastní hlavu a umění naslouchat kamarádovi je skutečná pomoc.',
    reassurance: '100% anonymně a bez registrace — nic se nikam neukládá ani neposílá.',
    selfBenefit: 'Okamžité zklidnění hlavy a jasnější slova pro podporu kamaráda v krizi',
    concreteImpact: '1 zvládnutý rozhovor a klidnější mysl',
    element: 'care',
    steps: [
      'Otevři český portál Opatruj.se od Národního ústavu duševního zdraví.',
      'Vyzkoušej krátký orientační test nebo sekci První pomoc pro duševní zdraví.'
    ],
    cta: 'Vyzkoušet Opatruj.se bez registrace',
    url: 'https://www.opatruj.se/otestuj-se',
    values: ['health', 'children'],
    timeMinutes: 5,
    timeBucket: '5',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 5 min • 💰 zdarma • 🧠 anonymně bez účtu'
  },
  {
    id: 's_barvou_ven',
    title: '🌈 Přečíst si 7 tipů, jak být bezpečnou oporou kamarádovi',
    org: 'S barvou ven (peer mentoring pro mladé)',
    desc: 'Podívej se na srozumitelný tahák od vyškolených peer mentorů, jak citlivě a bez frází podpořit spolužáka nebo kamaráda, který hledá přijetí.',
    whyItMatters: 'Jedna přijímající reakce v blízkém okolí prokazatelně snižuje riziko úzkostí a samoty u dospívajících na zlomek.',
    reassurance: 'Web i případná poradna fungují 100% zdarma, anonymně a v naprostém bezpečí bez hodnocení.',
    selfBenefit: 'Jistota, že v důležité chvíli blízkého člověka neodbudeš nešikovnou větou',
    concreteImpact: 'Bezpečnější prostředí pro 1 člověka ve tvém okolí',
    element: 'care',
    steps: [
      'Otevři český portál S barvou ven.',
      'Projdi si krátké praktické tipy pro kamarády a blízké (nebo pošli odkaz někomu, kdo nechce být na věci sám).'
    ],
    cta: 'Otevřít S barvou ven',
    url: 'https://www.sbarvouven.cz/',
    values: ['health', 'children', 'community'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 5–10 min • 💰 zdarma • 💜 peer podpora'
  },
  {
    id: 'estudanky_pramen',
    title: '💧 Zkontrolovat a vyčistit lesní studánku na procházce',
    org: 'ČSOP Mladí ochránci přírody – eSTUDÁNKY',
    desc: 'Najdi si v Národním registru pramenů lesní studánku poblíž své trasy, odhrň z odtoku napadané listí a pošli fotku aktuálního stavu.',
    whyItMatters: 'V Česku je přes 14 600 zmapovaných studánek a pramenů — díky drobným kontrolám od výletníků nezanikají.',
    reassurance: 'Prohlížení mapy je zcela bez registrace a zabere ti jen příjemnou zastávku v lese.',
    selfBenefit: 'Krásný cíl na odpolední procházku v tichu lesa úplně mimo obrazovky',
    concreteImpact: '1 zkontrolovaný a vyčištěný pramen v krajině',
    element: 'nature',
    steps: [
      'Otevři mapu eSTUDÁNKY.eu a najdi studánku ve svém okolí.',
      'Při procházce uvolni odtok od listí či větví, vyfoť ji a přidej krátkou zprávu o stavu vody.'
    ],
    cta: 'Najít studánku na eSTUDÁNKY.eu',
    url: 'https://www.estudanky.eu/',
    values: ['environment', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 15 min venku • 💰 zdarma • 🌲 cíl na procházku'
  },
  {
    id: 'mapko_kompost',
    title: '🌱 Najít komunitní zahradu nebo kompostér ve své čtvrti',
    org: 'Kokoza – Mapko.cz',
    desc: 'Prohlédni si otevřenou českou mapu téměř 1 600 komunitních zahrad a sousedských kompostérů, kam můžeš nosit slupky z kuchyně nebo se přidat k pěstování.',
    whyItMatters: 'Bioodpad tvoří třetinu běžné popelnice — v komunitním kompostéru se místo skládky promění v živou půdu pro stromy a záhony v ulici.',
    reassurance: 'Mapa je 100% otevřená bez registrace; spousta komunitních zahrad má i otevřená odpoledne pro sousedy.',
    selfBenefit: 'Méně odpadu v bytě a šance poznat příjemné sousedy mezi záhony',
    concreteImpact: '1 zapojená domácnost bez vyhozeného bioodpadu',
    element: 'nature',
    steps: [
      'Otevři Mapko.cz a přibliž si svoji ulici nebo kolej.',
      'Najdi nejbližší komunitní kompostér či zahradu (nebo přidej nové místo, o kterém víš).'
    ],
    cta: 'Prozkoumat mapu Mapko.cz',
    url: 'https://www.mapko.cz/',
    values: ['environment', 'community'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'group',
    categoryTag: 'nature',
    metaLabel: '⏱️ 5–10 min • 💰 zdarma • 🪴 1 590+ míst v ČR'
  },
  {
    id: 'nesnezeno_porce',
    title: '🥐 Zachránit před zavíračkou neprodanou porci jídla v okolí',
    org: 'Nesnězeno',
    desc: 'Cestou ze školy nebo z práce vyzvedni v okolní pekárně, bistru či kavárně balíček skvělého jídla, které by se večer muselo vyhodit.',
    whyItMatters: 'V Česku se už takto zachránilo přes 7,6 milionu porcí hotového jídla přímo z místních podniků.',
    reassurance: 'Žádné předplatné ani závazky — vyzvedneš jen tehdy, když máš zrovna hlad a cestu kolem.',
    selfBenefit: 'Výborná večeře nebo čerstvé pečivo se slevou 50–70 % pro tvůj rozpočet',
    concreteImpact: '1 zachráněná porce jídla před vyhozením',
    element: 'nature',
    steps: [
      'Mrkni na Nesnězeno, jaké pekárny nebo bistra kolem tebe dnes nabízejí záchranářské balíčky.',
      'Vyzvedni si porci cestou domů a ušetři peníze i jídlo.'
    ],
    cta: 'Podívat se na Nesnězeno',
    url: 'https://nesnezeno.eco/',
    values: ['environment', 'poverty'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ 10 min cestou • 💰 ušetří 50–70 % • 🥐 bez plýtvání'
  },
  {
    id: 'nevyhazujto_sousedum',
    title: '📦 Poslat 1 nevyužitou věc z pokoje dál přes Nevyhazujto',
    org: 'Nevyhazujto.cz',
    desc: 'Máš na koleji nebo v pokoji funkční lampu, skripta, batoh nebo židli, na kterou sedá prach? Vyfoť ji za 3 minuty a daruj ji za odvoz lidem v okolí.',
    whyItMatters: 'Věc neskončí u popelnic a udělá okamžitou službu studentovi nebo rodině o pár ulic vedle.',
    reassurance: 'Předání si domluvíš bezpečně venku nebo na veřejném re-use pointu bez uvádění přesné adresy bytu.',
    selfBenefit: 'Vzdušnější pokoj bez krámů a okamžitá radost člověka, kterému se věc hodí',
    concreteImpact: '1 funkční věc zachráněná pro dalšího člověka',
    element: 'community',
    steps: [
      'Vyber v pokoji jednu zachovalou věc, kterou už rok nepoužíváš.',
      'Vyfoť ji mobilem a vlož zdarma na český komunitní portál Nevyhazujto.cz.'
    ],
    cta: 'Otevřít Nevyhazujto.cz',
    url: 'https://www.nevyhazujto.cz/',
    values: ['community', 'environment', 'poverty'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'home',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 10 min doma • 💰 zdarma • 🧹 čistý stůl i hlava'
  },
  {
    id: 'pamet_naroda_vzpominka',
    title: '🎙️ Nahrát na mobil 1 vzpomínku babičky nebo dědy z mládí',
    org: 'Paměť národa (Post Bellum)',
    desc: 'Sedni si na 15 minut s babičkou, dědou nebo starším sousedem, polož jim jednu zvídavou otázku o jejich mládí a nahraj si vyprávění na diktafon v mobilu.',
    whyItMatters: 'Pro staršího člověka je opravdový zájem vnoučete obrovským darem — a pro tebe zůstane nahrávka hlasu, která má nevyčíslitelnou hodnotu.',
    reassurance: '100% soukromě a bez registrace — nahrávka může zůstat jen ve tvém rodinném archivu (nebo se inspiruj příběhy z tvé čtvrti na Paměti národa).',
    selfBenefit: 'Hluboký rozhovor s blízkým člověkem a uchovaný hlas do budoucna',
    concreteImpact: '1 zachovaná životní vzpomínka a radost seniora',
    element: 'community',
    steps: [
      'Inspiruj se krátkými příběhy pamětníků na webu Paměť národa.',
      'Až budeš mluvit s babičkou či dědou, zeptej se: „Jaké bylo tvoje nejmilejší místo, když ti bylo dvacet?“ a se souhlasem zapni nahrávání.'
    ],
    cta: 'Inspirace na Paměť národa',
    url: 'https://www.pametnaroda.cz/cs',
    values: ['elderly', 'education', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'home',
    social: 'solo',
    categoryTag: 'writing',
    metaLabel: '⏱️ 15 min • 💰 zdarma • 👵 mezigenerační blízkost'
  },
  {
    id: 'doucujte_cvt',
    title: '✏️ Doučovat 1 hodinu týdně školáka (už od 16 let!)',
    org: 'Člověk v tísni – Doučujte.cz',
    desc: 'Pomoz online z pokoje nebo osobně ve svém městě jednomu dítěti ze znevýhodněné rodiny zvládnout základku (češtinu, matiku nebo angličtinu).',
    whyItMatters: 'Pravidelná přátelská opora staršího studenta dokáže zabránit propadnutí a otevřít dítěti cestu na střední školu.',
    reassurance: 'Přihlásit se můžeš už od 16 let — nemusíš být učitel, dostaneš laskavého koordinátora a veškeré materiály.',
    selfBenefit: 'Smysluplná praxe do životopisu a viditelný pokrok konkrétního dítěte',
    concreteImpact: '1 podpořené dítě na cestě vzděláním',
    element: 'knowledge',
    steps: [
      'Otevři portál Doučujte.cz od Člověka v tísni.',
      'Vyplň 3minutový nezávazný dotazník — koordinátor s tebou probere, jestli ti víc sedí online nebo osobní forma.'
    ],
    cta: 'Zjistit podrobnosti na Doučujte.cz',
    url: 'https://www.doucujte.cz/',
    values: ['education', 'children', 'poverty'],
    timeMinutes: 45,
    timeBucket: '45',
    cost: 'free',
    mode: 'online',
    social: 'solo',
    categoryTag: 'tutoring',
    metaLabel: '⏱️ 5 min přihláška • 💰 zdarma • 🎓 vhodné už od 16 let'
  },
  {
    id: 'chodci_sobe',
    title: '♿ Nahlásit nebezpečný přechod nebo bariéru pro vozíčkáře a kočárky',
    org: 'Pěšky městem – Chodci sobě',
    desc: 'Víš cestou do školy o rozbitém chodníku, chybějícím nájezdu nebo nebezpečném přechodu? Vyfoť místo mobilem a pošli podnět radnici přes Chodci sobě.',
    whyItMatters: 'Přes portál už obyvatelé v Česku vyřešili více než 1 740 konkrétních nebezpečných míst pro seniory, děti i lidi na vozíku.',
    reassurance: 'U každého podnětu veřejně vidíš odpověď úřadu i stav opravy.',
    selfBenefit: 'Skutečný vliv na vlastní ulici — příště půjdeš kolem opraveného místa',
    concreteImpact: '1 bezpečnější místo ve veřejném prostoru',
    element: 'community',
    steps: [
      'Otevři Chodci sobě a podívej se na vyřešené podněty ve svém městě.',
      'Vyfoť bariéru nebo nebezpečný úsek na své každodenní trase a připíchni ho do mapy.'
    ],
    cta: 'Otevřít portál Chodci sobě',
    url: 'https://www.chodcisobe.cz/',
    values: ['community', 'elderly', 'health'],
    timeMinutes: 10,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 5 min venku • 💰 zdarma • 🚶 1 740+ opravených míst'
  },
  {
    id: 'epp_pohybem',
    title: '👟 Proměnit běžnou chůzi do školy nebo běh v body pro neziskovky',
    org: 'EPP – Pomáhej pohybem',
    desc: 'Zapni si při obyčejné pěší cestě, venčení psa nebo jízdě na kole bezplatnou českou aplikaci EPP a nasbírané body věnuj vybranému projektu v ČR.',
    whyItMatters: 'Přes 880 000 lidí už svým běžným pohybem venku pomohlo financovat stovky komunitních, ekologických a zdravotních projektů.',
    reassurance: '100% zdarma a funguje okamžitě i bez zakládání uživatelského účtu.',
    selfBenefit: 'Příjemná motivace jít pěšky místo MHD a rozhýbat tělo na čerstvém vzduchu',
    concreteImpact: 'Body z každé procházky přepočtené na reálnou podporu',
    element: 'nature',
    steps: [
      'Stáhni si zdarma aplikaci EPP – Pomáhej pohybem.',
      'Zapni ji při dnešní procházce a na konci vyber český projekt, kterému pošleš své body.'
    ],
    cta: 'Prozkoumat EPP – Pomáhej pohybem',
    url: 'https://pomahejpohybem.cz/',
    values: ['health', 'environment', 'community'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'nature',
    metaLabel: '⏱️ při chůzi venku • 💰 zdarma • 🏃 bez registrace'
  },
  {
    id: 'daruj_vlasy',
    title: '💇‍♀️ Darovat ostříhaný cop vlasů na paruku pro onkologické pacientky',
    org: 'Nadační fond Daruj vlasy',
    desc: 'Chystáš se shodit dlouhé vlasy (alespoň 40 cm, klidně i barvené)? Místo koše z nich v Česku vyrobí paruku na míru pro holčičku s alopecií nebo ženu po chemoterapii.',
    whyItMatters: 'Kvalitní paruka z pravých vlasů vrací dětem a ženám v těžké léčbě odvahu vyjít mezi lidi — fond už předal přes 285 paruk.',
    reassurance: 'Bez registrace účtu — v partnerských kadeřnictvích po ČR ti navíc vlasy odborně ustřihnou a odešlou zdarma.',
    selfBenefit: 'Střih zdarma v partnerském salonu a obrovský smysl pro tvou změnu účesu',
    concreteImpact: 'Pravé vlasy na paruku zdarma pro pacientku v ČR',
    element: 'care',
    steps: [
      'Otevři pravidla a mapu partnerských kadeřnictví na Daruj vlasy (nebo pošli návod kamarádce s dlouhými vlasy).',
      'Nech si svázaný cop ustřihnout a poslat na výrobu paruky.'
    ],
    cta: 'Jak funguje Daruj vlasy',
    url: 'https://www.darujvlasy.cz/daruj-vlasy/',
    values: ['health', 'children'],
    timeMinutes: 15,
    timeBucket: '15',
    cost: 'free',
    mode: 'local',
    social: 'solo',
    categoryTag: 'community',
    metaLabel: '⏱️ 5 min info • 💰 střih zdarma v salonu • 💛 obrovský dopad'
  },
  {
    id: 'dobry_andel',
    title: '👼 Poslat cenu jedné kávy rodině s vážně nemocným dítětem',
    org: 'Nadace DOBRÝ ANDĚL',
    desc: 'Podpoř drobným příspěvkem českou rodinu, kterou zasáhla onkologická nebo jiná vážná nemoc, a podívej se na konkrétní příběh, kam pomoc doputovala.',
    whyItMatters: 'Garantováno do posledního haléře: 100 % každého daru odchází přímo rodinám ještě v daném měsíci.',
    reassurance: 'Provoz nadace hradí zakladatelé ze svého a podporu můžeš kdykoliv jedním klikem upravit nebo zastavit.',
    selfBenefit: 'Naprostá důvěra — přesně vidíš konkrétní rodinu v ČR, které tvůj dar ulevil',
    concreteImpact: '100 % částky přímo rodině v těžké léčbě',
    element: 'care',
    steps: [
      'Otevři web Dobrý anděl a podívej se, jak funguje princip Do posledního haléře.',
      'Zvol si libovolnou drobnou částku podle svých možností.'
    ],
    cta: 'Otevřít Dobrý anděl',
    url: 'https://www.dobryandel.cz/',
    values: ['health', 'children', 'poverty'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 3 min • 💰 do posledního haléře • 💻 online'
  },
  {
    id: 'znesnaze21_pribeh',
    title: '🤝 Poslat 50 Kč (nebo zdarma nasdílet) ověřený příběh na Znesnáze21',
    org: 'Znesnáze21',
    desc: 'Vyber si na české platformě Znesnáze21 jeden sociálními pracovníky ověřený příběh samoživitelky, seniora nebo hendikepovaného člověka.',
    whyItMatters: '100 % vybrané částky jde obdarovanému — a i pouhé nasdílení odkazu prokazatelně přivádí další dárce.',
    reassurance: 'Bez registrace (QR / Apple Pay / Google Pay za 20 vteřin) a s garancí odborného ověření každého případu.',
    selfBenefit: 'Okamžitá přímá solidarita s konkrétním člověkem bez prostředníků',
    concreteImpact: '100 % daru přímo ověřenému člověku v nouzi',
    element: 'care',
    steps: [
      'Prohlédni si aktuální ověřené sbírky na Znesnáze21.',
      'Přispěj třeba 50 Kč přes QR kód, nebo pošli odkaz sbírky dál.'
    ],
    cta: 'Prohlédnout příběhy na Znesnáze21',
    url: 'https://www.znesnaze21.cz/',
    values: ['poverty', 'health', 'elderly'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 2 min • 💰 od 50 Kč nebo sdílení • 💻 bez registrace'
  },
  {
    id: 'donio_utulky',
    title: '🐾 Podpořit konkrétní český útulek nebo sousedský projekt na Donio',
    org: 'Donio.cz',
    desc: 'Vyber si na Donio malý místní útulek, kočičí depozitum nebo komunitní výsadbu a pošli drobný dar bez srážek a poplatků.',
    whyItMatters: '100 % tvého příspěvku dostane přímo autor sbírky a zpátky ti přijde lidská zpráva, co se díky tomu podařilo.',
    reassurance: 'Bez zakládání účtu, podpora trvá pod minutu přes QR platbu.',
    selfBenefit: 'Konkrétní radost ze zpětné zprávy, jak se projekt v Česku povedl',
    concreteImpact: '100 % příspěvku na krmivo, veterinu či komunitní akci',
    element: 'animals',
    steps: [
      'Otevři Donio.cz a vyber si kategorii Zvířata, Příroda nebo Komunita.',
      'Podpoř projekt, který ti mluví z duše.'
    ],
    cta: 'Prozkoumat sbírky na Donio.cz',
    url: 'https://donio.cz/',
    values: ['animals', 'community', 'poverty'],
    timeMinutes: 3,
    timeBucket: '5',
    cost: 'donation',
    mode: 'online',
    social: 'solo',
    categoryTag: 'donation',
    metaLabel: '⏱️ 2 min • 💰 100 % daru příjemci • 💻 bez registrace'
  }
];

/**
 * Kategorie ověřené účinnosti (Critique 5.1 & 5.2):
 * Hodnocení se vztahuje ke konkrétní aktivitě, nikoliv automaticky k celé organizaci.
 */

/** Kdy byly naposledy zkontrolovány všechny odkazy katalogu (všech 45 vracelo HTTP 200). */
export const CATALOG_LINKS_CHECKED_AT = '11/2026';

/** @type {Record<string, { sourceUrl?: string, lastVerifiedAt?: string, impactBasis?: 'doložený' | 'odhadovaný' | 'předpokládaný', impactChain?: { activity: string, immediateOutput: string, realImpact: string } }>} */
const SPECIFIC_ACTION_META = {
  zvirata_utulek_online: {
    sourceUrl: 'https://clickandfeed.cz/',
    lastVerifiedAt: '11/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Bezplatné kliknutí na webu Click and Feed',
      immediateOutput: `Započtení kliku do sponzorské kvóty (~${CLICK_AND_FEED.gramsPerClick} g krmiva od ${CLICK_AND_FEED.sponsor})`,
      realImpact: `Skutečné financování a dodané krmivo do ${CLICK_AND_FEED.shelters} českých útulků (přes ${CLICK_AND_FEED.totalTonnesLabel} tun vyklikaných zdarma)`
    }
  },
  birdlife_ptaci_pasti: {
    sourceUrl: 'https://projekty.birds.cz/ptacipasti/',
    lastVerifiedAt: '11/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Nahlášení nebezpečné skleněné plochy s fotkou z mobilu',
      immediateOutput: 'Ověřený bod v mapě České společnosti ornitologické',
      realImpact: 'Podklad pro jednání s obcí a polepení zastávky, které trvale brání nárazům ptáků'
    }
  },
  missing_maps: {
    sourceUrl: 'https://missingmaps.org/cs/',
    lastVerifiedAt: '11/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Obkreslení budov ze satelitního snímku v prohlížeči',
      immediateOutput: 'Zmapovaný sektor v OpenStreetMap validovaný zkušeným mapařem',
      realImpact: 'Podpora terénních týmů Lékařů bez hranic při epidemii či přírodní katastrofě'
    }
  },
  potravinova_banka: {
    sourceUrl: 'https://www.potravinovebanky.cz/uploads/dms/pdf/6a2004ae277ef699586774.pdf',
    lastVerifiedAt: '02/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Třídění a kompletace zachráněných potravin v krajském skladu',
      immediateOutput: 'Desítky vyexpedovaných beden jídla připravených k distribuci',
      realImpact: 'Potravinová pomoc pro samoživitele a seniory (součást 17 400 tun ročně pro 430 000 lidí)'
    }
  },
  kostni_dren: {
    sourceUrl: 'https://registr.kostnidren.cz/o-registru/aktualni-cisla/',
    lastVerifiedAt: '09/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Bezbolestný stěr z úst a zápis do registru ČNRDD',
      immediateOutput: 'Zařazení transplantačních znaků do mezinárodní databáze (170 104 dárců)',
      realImpact: 'Šance na záchranu života pacienta s leukémií při genetické shodě (2 939 odběrů)'
    }
  },
  remobil_telefon: {
    sourceUrl: 'https://remobil.cz/',
    lastVerifiedAt: '11/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Odeslání starého mobilu přes Zásilkovnu s kódem 98 765 259',
      immediateOutput: 'Odborná recyklace kovů a zaměstnání lidí s hendikepem',
      realImpact: '10 Kč z každého telefonu na charitu (celkem 221 060 mobilů a 2,21 mil. Kč)'
    }
  }
};

function deriveRecipientMacro(action) {
  if (action.element === 'animals' || action.values?.includes('animals')) return 'animals';
  if (action.element === 'nature' || (action.values?.includes('environment') && !action.values?.includes('poverty') && !action.values?.includes('children'))) {
    return 'nature';
  }
  return 'people';
}

function deriveCategory(action) {
  if (action.values?.includes('animals')) return 'animals';
  if (action.values?.includes('environment')) return 'nature';
  if (action.values?.includes('health')) return 'health';
  if (action.values?.includes('education')) return 'education';
  return 'people';
}

function buildDefaultImpactChain(action, evidenceTier) {
  if (action.cost === 'donation') {
    return {
      activity: `Finanční příspěvek přes ${action.org}`,
      immediateOutput: 'Převod prostředků na transparentní účet programu',
      realImpact: `${action.concreteImpact} (dopad závisí na nákladové efektivitě konkrétní intervence)`
    };
  }
  if (evidenceTier === 'A') {
    return {
      activity: `Zapojení podle metodiky organizace ${action.org}`,
      immediateOutput: action.concreteImpact || 'Ověřený záznam či registrace v odborném systému',
      realImpact: 'Měřitelný přínos pro výzkum, ochranu zdraví nebo terénní pomoc (závisí na kvalitě dat a návaznosti)'
    };
  }
  if (action.values?.includes('elderly') || action.values?.includes('children') || action.categoryTag === 'tutoring') {
    return {
      activity: `Osobní či online podpora člověka (${action.org})`,
      immediateOutput: action.concreteImpact || 'Konkrétní hodina věnovaná druhému člověku',
      realImpact: 'Zlepšení kvality života a snížení osamělosti (závisí na kvalitě, kontinuitě a skutečné potřebě)'
    };
  }
  if (evidenceTier === 'C') {
    return {
      activity: 'Přímá péče o okolí, přírodu nebo sousedský oběh věcí',
      immediateOutput: action.concreteImpact || 'Okamžitá lokální změna v místě, kde žiješ',
      realImpact: 'Zlepšení místního prostředí a komunity (závisí na rozsahu a trvalosti výsledku)'
    };
  }
  return {
    activity: `Dokončení aktivity u organizace ${action.org}`,
    immediateOutput: action.concreteImpact || 'Bezprostřední výstup u partnerské organizace',
    realImpact: 'Doložený praktický přínos v rámci ověřeného programu organizace'
  };
}

for (const action of MICRO_ACTIONS) {
  const custom = SPECIFIC_ACTION_META[action.id] || {};
  const impactEvidence = EVIDENCE_A_IDS.has(action.id)
    ? 'A'
    : EVIDENCE_C_IDS.has(action.id)
      ? 'C'
      : 'B';
  const commitment = LONG_TERM_IDS.has(action.id) ? 'long_term' : 'one_off';
  const contactLevel = CONTACT_OK_IDS.has(action.id) ? 'contact_ok' : 'anonymous';
  const registrationRequired = PARTNER_REGISTRATION_IDS.has(action.id);
  const recipientMacro = deriveRecipientMacro(action);
  const category = deriveCategory(action);
  const impactBasis =
    custom.impactBasis ||
    (impactEvidence === 'A' ? 'doložený' : impactEvidence === 'B' ? 'doložený' : 'odhadovaný');
  const locationLabel =
    action.mode === 'online' ? 'Online' : action.mode === 'home' ? 'Z domova' : 'V okolí';
  const costLabel = action.cost === 'free' ? 'Zdarma' : 'Dar';
  const commitLabel = commitment === 'long_term' ? 'Dlouhodobě' : 'Jednorázově';

  action.description = action.desc;
  action.category = category;
  action.recipientMacro = recipientMacro;
  action.durationMinutes = action.timeMinutes;
  action.locationType = action.mode === 'online' ? 'online' : action.mode === 'local' ? 'local' : 'anywhere';
  action.commitment = commitment;
  action.contactLevel = contactLevel;
  action.registrationRequired = registrationRequired;
  action.sourceUrl = custom.sourceUrl || action.url;
  action.externalUrl = action.url;
  // Ručně ověřené údaje o dopadu mají vlastní datum. U ostatních nic nepředstíráme —
  // uvádíme jen to, co jsme opravdu zkontrolovali (funkční odkaz při revizi katalogu).
  action.lastVerifiedAt = custom.lastVerifiedAt || null;
  action.verifiedLabel = custom.lastVerifiedAt || `funkční odkaz ${CATALOG_LINKS_CHECKED_AT}`;
  action.isAvailable = true;
  action.impactEvidence = impactEvidence;
  action.impactEvidenceBadge = EVIDENCE_TIERS[impactEvidence].badge;
  action.impactEvidenceShort = EVIDENCE_TIERS[impactEvidence].shortBadge;
  action.impactBasis = impactBasis;
  action.impactChain = custom.impactChain || buildDefaultImpactChain(action, impactEvidence);
  action.instructions = action.steps || [];
  action.ctaLabel = 'Začít pomáhat';
  action.quickTagsLabel = `${action.timeMinutes} min · ${costLabel} · ${locationLabel} · ${commitLabel}`;
}
