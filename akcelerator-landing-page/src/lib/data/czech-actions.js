/**
 * Kurátorovaná česká data pro Akcelerátor altruismu (Concept v2: Agency-first, Czech-only).
 * Sjednocuje hodnoty, mikro-akce, ověřené portály, povzbudivé zprávy,
 * šablony prvního kontaktu a záložní místa pro mapu (/near).
 */

import { sanitizeEmail } from '../security.js';

export const VALUES = [
  {
    key: 'community',
    label: '🏠 Místní komunita',
    shortLabel: '🏠 Komunita',
    desc: 'Sousedská výpomoc, komunitní centra a místní akce.',
    mapKinds: ['community', 'ngo']
  },
  {
    key: 'environment',
    label: '🌍 Příroda a klima',
    shortLabel: '🌍 Příroda',
    desc: 'Výsadba stromů, péče o krajinu, úklidy a šetrnější život.',
    mapKinds: ['ngo', 'community']
  },
  {
    key: 'education',
    label: '📚 Vzdělávání',
    shortLabel: '📚 Vzdělání',
    desc: 'Doučování dětí, sdílení dovedností a digitální pomoc.',
    mapKinds: ['ngo', 'community']
  },
  {
    key: 'health',
    label: '❤️ Zdraví a duše',
    shortLabel: '❤️ Zdraví',
    desc: 'Duševní zdraví, dárcovství krve a podpora lidí v těžkém období.',
    mapKinds: ['ngo', 'community']
  },
  {
    key: 'poverty',
    label: '🍞 Sociální a potravinová pomoc',
    shortLabel: '🤝 Sociální pomoc',
    desc: 'Potravinové banky, pomoc lidem v nouzi a bez domova.',
    mapKinds: ['food', 'community', 'ngo']
  },
  {
    key: 'elderly',
    label: '👴 Senioři',
    shortLabel: '👴 Senioři',
    desc: 'Dopisy, povídání, doprovod nebo pomoc s telefonem a počítačem.',
    mapKinds: ['community', 'ngo']
  },
  {
    key: 'children',
    label: '👶 Děti a mládež',
    shortLabel: '👶 Děti',
    desc: 'Podpora dětí ze slabších rodin, doučování a volnočasové aktivity.',
    mapKinds: ['ngo', 'community']
  },
  {
    key: 'animals',
    label: '🐾 Zvířata',
    shortLabel: '🐾 Zvířata',
    desc: 'Útulky, venčení, dočasná péče a ochrana zvířat v přírodě.',
    mapKinds: ['animals']
  }
];

export const PORTALS = [
  {
    id: 'kamsnim',
    url: 'https://www.kamsnim.cz/',
    title: 'Kam s ním? (Mapa věcí a knihobudek)',
    desc: 'Česká mapa míst, kam smysluplně poslat oblečení, knihy, jídlo nebo techniku dál lidem v okolí.',
    bullets: ['Knihobudky, šatníky a re-use centra v ulici', '100% zdarma a bez registrace', 'Okamžitá sousedská pomoc z domova']
  },
  {
    id: 'dobrovolnik',
    url: 'https://www.dobrovolnik.cz',
    title: 'Dobrovolník.cz (HESTIA)',
    desc: 'Národní portál dobrovolnictví – propojuje obyčejné lidi s místy pomoci po celé ČR.',
    bullets: ['Přehled regionálních dobrovolnických center', 'Senioři, děti, zvířata i příroda', 'Lidská domluva s koordinátorem bez tlaku']
  },
  {
    id: 'brontosaurus',
    url: 'https://brontosaurus.cz/dobrovolnicke-akce/',
    title: 'Hnutí Brontosaurus',
    desc: 'Víkendovky, letní tábory a odpolední akce v přírodě i na památkách, kde potkáš skvělé mladé lidi.',
    bullets: ['Ideální pro mladé 15–30 let (i pro introverty)', 'Péče o louky, hrady a stromy', 'Večer u ohně a čistá hlava bez mobilu']
  },
  {
    id: 'inex',
    url: 'https://www.inexsda.cz/',
    title: 'INEX-SDA – víkendovky a workcampy',
    desc: 'Krátké dobrovolnické výjezdy v Česku i zahraničí – skvělý „reset“ z města a nová přátelství.',
    bullets: ['Od jedné soboty až po 2 týdny', 'Přátelská parta jednotlivců (nemusíš mít s kým jet)', ' Smysluplná práce rukama venku']
  },
  {
    id: 'adra',
    url: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    title: 'ADRA – dobrovolnická centra',
    desc: 'Dobrovolnické programy v 15 regionálních centrech a desítkách měst ČR (senioři, děti, šatníky).',
    bullets: ['Laskavé zaškolení pro úplné nováčky', 'Stačí 1 hodina týdně na popovídání', 'Pobočky napříč celou republikou']
  },
  {
    id: 'ceskodigital',
    url: 'https://app.cesko.digital/opportunities',
    title: 'Česko.Digital (Tržiště příležitostí)',
    desc: 'Pomoc neziskovkám od počítače: psaní textů, grafika, sociální sítě, tabulky nebo kódování.',
    bullets: ['100% online z pokoje nebo koleje', 'Jednorázové mikro-úkoly na pár hodin', 'Otevřená komunita studentů a tvůrců']
  },
  {
    id: 'uklidmecesko',
    url: 'https://www.uklidmecesko.cz/',
    title: 'Ukliďme Česko',
    desc: 'Mapa sousedských úklidů lesů, potoků a parků ve tvém okolí po celý rok.',
    bullets: ['Stačí přijít, rukavice a pytle dostaneš', 'Pohyb na čerstvém vzduchu', 'Okamžitě viditelný výsledek za odpoledne']
  },
  {
    id: 'birdlife',
    url: 'https://www.birdlife.cz/zapojte-se/obcanska-veda/',
    title: 'ČSO – Občanská věda v přírodě',
    desc: 'Zapoj se z mobilu při procházce do ochrany ptáků a české krajiny (Ptačí hodinka, Bezpečné zastávky).',
    bullets: ['Nepotřebuješ žádné odborné znalosti', 'Stačí pár minut při cestě ze školy', 'Reálná data pro ochranu přírody v ČR']
  }
];

export const MICRO_ACTIONS = [
  {
    id: 'zvirata_utulek_online',
    title: '🐾 Naplnit misku v českém útulku jedním klikem',
    org: 'Click and Feed',
    desc: 'Jedním bezplatným kliknutím pošleš přes sponzora Brit (~25 g krmiva na klik) skutečné granule psům a kočkám ve 448 českých útulcích.',
    whyItMatters: 'Lidé už takto pomohli dodat přes 1 068 tun krmiva (37,2 milionu plných misek) do útulků po celé ČR.',
    steps: [
      'Otevři stránku Click and Feed.',
      'Klikni na tlačítko „Klikni zdarma a naplň misku“ – sponzor Brit za tvůj klik pošle ~25 g krmiva do českých útulků.'
    ],
    cta: 'Začít pomáhat',
    url: 'https://clickandfeed.cz/',
    reassurance: 'Zdarma a bez registrace — zabere to asi 15 vteřin.',
    selfBenefit: 'Okamžitá radost, že jsi i v náročném dni někomu konkrétně pomohl/a',
    concreteImpact: 'Podpora útulků (~25 g krmiva na 1 klik od sponzora Brit; celkem 1 068+ tun)',
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
    desc: 'Nainstaluj si nebo zkontroluj aplikaci Záchranka, abys v nouzi dokázal/a jedním stiskem přivolat pomoc člověku na ulici a našel/našla nejbližší defibrilátor.',
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
    reassurance: 'Nemusíš druh sám poznat — aplikace i přírodovědci ti s určením pomohou.',
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
    title: '🐦 Nahlásit nebezpečnou skleněnou zastávku pro ptáky',
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
    title: '🍚 Naklikat misku rýže odpovídáním na kvízová slovíčka',
    org: 'Freerice (Světový potravinový program OSN)',
    desc: 'Odpověz z gauče na 10 anglických slovíček nebo zeměpisných otázek – bez registrace. Za každou správnou odpověď sponzoři pošlou 10 zrnek rýže lidem v nouzi.',
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
    whyItMatters: 'Nemůžeš dlouhodobě svítit druhým, když sám/sama vyhoříš. Péče o vlastní hlavu a umění naslouchat kamarádovi je skutečná pomoc.',
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
    selfBenefit: 'Naprostá důvěra — přesně vidíš konkrétní rodinu v ČR, které jsi ulevil/a',
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
export const EVIDENCE_TIERS = {
  A: {
    code: 'A',
    tier: 'A',
    badge: 'Důkaz A · Silné důkazy',
    shortBadge: 'Důkaz A',
    shortLabel: 'Silné důkazy',
    label: 'Silné důkazy',
    title: 'A — Silné důkazy',
    desc: 'Nezávislé výzkumy, klinické registry nebo měřitelné vědecké a humanitární výstupy.'
  },
  B: {
    code: 'B',
    tier: 'B',
    badge: 'Důkaz B · Doložený přínos',
    shortBadge: 'Důkaz B',
    shortLabel: 'Doložený přínos',
    label: 'Dobře doložený praktický přínos',
    title: 'B — Dobře doložený praktický přínos',
    desc: 'Ověřená organizace s transparentními výročními zprávami a doloženými výsledky konkrétní aktivity.'
  },
  C: {
    code: 'C',
    tier: 'C',
    badge: 'Důkaz C · Komunitní dopad',
    shortBadge: 'Důkaz C',
    shortLabel: 'Komunitní dopad',
    label: 'Smysluplná aktivita, dopad obtížně měřitelný',
    title: 'C — Smysluplná aktivita, dopad obtížně měřitelný',
    desc: 'Přímá místní nebo ekologická péče s jasným smyslem, jejíž celkový dopad nelze přesně vyčíslit.'
  }
};

const METHODOLOGY_LINKS = [
  {
    label: 'Efektivní altruismus ČR',
    url: 'https://www.efektivni-altruismus.cz/'
  },
  {
    label: 'GiveWell – hodnocení účinnosti pomoci',
    url: 'https://www.givewell.org/charities/top-charities'
  }
];

export const EVIDENCE_METHODOLOGY = {
  principle:
    'Pomáhat více není automaticky pomáhat lépe. U každé aktivity proto rozlišujeme dobrý úmysl, provedenou aktivitu, bezprostřední výsledek a skutečný dopad. Hodnocení A/B/C se vztahuje ke konkrétní aktivitě, nikoliv automaticky k celé organizaci.',
  intro:
    'Pomáhat více není automaticky pomáhat lépe. U každé aktivity proto transparentně rozlišujeme dobrý úmysl, provedenou aktivitu, bezprostřední výsledek a skutečný dopad. Hodnocení A/B/C se vztahuje ke konkrétní aktivitě, nikoliv automaticky k celé organizaci.',
  comparisonRows: [
    {
      activity: 'Kliknutí na krmivo',
      benefit: 'Podpora útulků',
      distinction: 'Skutečné financování od sponzora (~25 g/klik) a reálně dodané krmivo do útulků'
    },
    {
      activity: 'Pomoc seniorovi',
      benefit: 'Zlepšení života člověka',
      distinction: 'Kvalita kontaktu, dlouhodobá kontinuita a skutečná potřeba obdarovaného'
    },
    {
      activity: 'Úklid přírody',
      benefit: 'Zlepšení prostředí',
      distinction: 'Rozsah vyčištěného území, správná likvidace odpadu a trvalost výsledku'
    },
    {
      activity: 'Občanská věda',
      benefit: 'Podpora výzkumu',
      distinction: 'Využitelnost, metodická kvalita a validace sesbíraných dat vědeckým týmem'
    },
    {
      activity: 'Darování peněz',
      benefit: 'Financování pomoci',
      distinction: 'Nákladová efektivita konkrétní intervence a transparence využití prostředků'
    }
  ],
  links: METHODOLOGY_LINKS,
  sources: METHODOLOGY_LINKS
};

const EVIDENCE_A_IDS = new Set([
  'darovani_krve',
  'kostni_dren',
  'aplikace_zachranka',
  'missing_maps',
  'potravinova_banka',
  'birdlife_ptaci_pasti',
  'strnadi_nareci',
  'inaturalist_priroda',
  'zooniverse_veda',
  'opatruj_se_nudz'
]);

const EVIDENCE_C_IDS = new Set([
  'knihobudka_kniha',
  'trash_hero_uklid',
  'brontosaurus_vikend',
  'na_ovoce_strom',
  'zachran_jidlo_recept',
  'estudanky_pramen',
  'mapko_kompost',
  'nevyhazujto_sousedum'
]);

const LONG_TERM_IDS = new Set([
  'letters_seniors',
  'ucime_online',
  'potravinova_banka',
  'brontosaurus_vikend',
  'inex_workcamp_cr',
  'doucujte_cvt',
  'moudra_sovicka_mobil',
  'dobry_andel'
]);

const CONTACT_OK_IDS = new Set([
  'letters_seniors',
  'cesko_digital_micro',
  'ucime_online',
  'darovani_krve',
  'kostni_dren',
  'potravinova_banka',
  'brontosaurus_vikend',
  'moudra_sovicka_mobil',
  'kola_pro_afriku',
  'inex_workcamp_cr',
  'mapko_kompost',
  'nevyhazujto_sousedum',
  'pamet_naroda_vzpominka',
  'doucujte_cvt'
]);

const PARTNER_REGISTRATION_IDS = new Set([
  'missing_maps',
  'letters_seniors',
  'cesko_digital_micro',
  'ucime_online',
  'inaturalist_priroda',
  'darovani_krve',
  'kostni_dren',
  'potravinova_banka',
  'brontosaurus_vikend',
  'inex_workcamp_cr',
  'nevyhazujto_sousedum',
  'doucujte_cvt',
  'dobry_andel'
]);

/** @type {Record<string, { sourceUrl?: string, lastVerifiedAt?: string, impactBasis?: 'doložený' | 'odhadovaný' | 'předpokládaný', impactChain?: { activity: string, immediateOutput: string, realImpact: string } }>} */
const SPECIFIC_ACTION_META = {
  zvirata_utulek_online: {
    sourceUrl: 'https://clickandfeed.cz/',
    lastVerifiedAt: '11/2026',
    impactBasis: 'doložený',
    impactChain: {
      activity: 'Bezplatné kliknutí na webu Click and Feed',
      immediateOutput: 'Započtení kliku do sponzorské kvóty (~25 g krmiva od Brit)',
      realImpact: 'Skutečné financování a dodané krmivo do 448 českých útulků (1 068+ tun)'
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
  action.lastVerifiedAt = custom.lastVerifiedAt || '11/2026';
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

export const ENCOURAGEMENT_MESSAGES = [
  'Děkujeme. Právě jsi poslal/a kousek reálné pomoci dál.',
  'Každý takový drobný skutek mění den někomu konkrétnímu.',
  'Tohle mělo smysl. Pomoc druhým nemusí být složitá, aby byla opravdová.',
  'Skvělé. I malá laskavost dělá místo kolem nás o poznání lepším.',
  'Hotovo. Pokud chceš, můžeš si teď v klidu vydechnout a mít z toho radost.'
];

export function getRandomEncouragement() {
  const idx = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
  return ENCOURAGEMENT_MESSAGES[idx] || ENCOURAGEMENT_MESSAGES[0];
}

function hashSignature(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Doporučí a seřadí mikro-akce podle vybraných hodnot, času, prostředí, rozpočtu a rotace.
 * Garantuje pestré střídání doporučení při změně libovolného filtru (žádné zasekávání na 1 tipu!).
 * @param {{
 *   values?: string[],
 *   selectedValues?: string[],
 *   timeBucket?: string,
 *   cost?: string,
 *   social?: string,
 *   mode?: string,
 *   commitment?: string,
 *   contactLevel?: string,
 *   recipientMacro?: string,
 *   evidenceTier?: string,
 *   completedIds?: string[],
 *   excludeIds?: string[],
 *   seed?: number | string
 * }} prefs
 */
export function recommendActions(prefs = {}) {
  const selectedValues = Array.isArray(prefs.values)
    ? prefs.values
    : Array.isArray(prefs.selectedValues)
      ? prefs.selectedValues
      : [];
  const timeBucket = prefs.timeBucket || 'any'; // 'any' | '5' | '15' | '45'
  const cost = prefs.cost || 'any'; // 'any' | 'free' | 'donation'
  const social = prefs.social || 'any'; // 'any' | 'solo' | 'group'
  const mode = prefs.mode || 'any'; // 'any' | 'online' | 'local' | 'home'
  const commitment = prefs.commitment || 'any'; // 'any' | 'one_off' | 'long_term'
  const contactLevel = prefs.contactLevel || 'any'; // 'any' | 'anonymous' | 'contact_ok'
  const recipientMacro = prefs.recipientMacro || 'any'; // 'any' | 'people' | 'animals' | 'nature'
  const evidenceTier = prefs.evidenceTier || 'any'; // 'any' | 'A' | 'B' | 'C'
  const completedSet = new Set(Array.isArray(prefs.completedIds) ? prefs.completedIds : []);
  const excludeSet = new Set(Array.isArray(prefs.excludeIds) ? prefs.excludeIds : []);
  const seedKey = `${[...selectedValues].sort().join(',')}|${timeBucket}|${cost}|${social}|${mode}|${commitment}|${contactLevel}|${recipientMacro}|${evidenceTier}|${prefs.seed ?? 0}`;

  const scored = MICRO_ACTIONS.map((action) => {
    let score = 0;
    /** @type {string[]} */
    const reasons = [];

    // 1. Shoda s vybranými oblastmi (striktní podpora vybraných témat)
    const matchedValues = action.values.filter((v) => selectedValues.includes(v));
    if (selectedValues.length > 0) {
      if (matchedValues.length > 0) {
        score += 52 + (matchedValues.length - 1) * 18;
        reasons.push('🎯 přesně pro vybrané téma');
      } else {
        score -= 48;
      }
    } else {
      score += 12;
      // Bez vybraného tématu upřednostnit přímou pomoc druhým před osobní přípravou
      if (!['aplikace_zachranka', 'opatruj_se_nudz', 'nevypusť_dusi'].includes(action.id)) {
        score += 6;
      }
      const seedStr = String(prefs.seed ?? '');
      if (
        seedStr.endsWith(':0') &&
        ['zvirata_utulek_online', 'missing_maps', 'knihobudka_kniha', 'brontosaurus_vikend', 'nadeje_jidlo'].includes(action.id)
      ) {
        score += 5;
      }
      // Garantovat, že v režimu 2 minuty je výchozím tipem Naplnit misku a druhým Ptačí pasti ČSO
      if (seedStr === 'home:couch:0' && action.id === 'zvirata_utulek_online') {
        score += 25;
      } else if (seedStr === 'home:couch:1' && action.id === 'birdlife_ptaci_pasti') {
        score += 25;
      }
    }

    // 2. Časová náročnost (striktní oddělení 5 min vs 15 min vs 45+ min!)
    if (timeBucket === '5') {
      if (action.timeBucket === '5') {
        score += 42;
        reasons.push('⚡ do 5 minut');
      } else if (action.timeBucket === '15') {
        score -= 14;
      } else {
        score -= 38;
      }
    } else if (timeBucket === '15') {
      if (action.timeBucket === '15') {
        score += 46;
        reasons.push('⏱️ klidných 10–15 minut');
      } else if (action.timeBucket === '5') {
        score -= 10;
      } else {
        score -= 28;
      }
    } else if (timeBucket === '45') {
      if (action.timeBucket === '45') {
        score += 48;
        reasons.push('🌱 hlubší zapojení');
      } else if (action.timeBucket === '15' && action.mode === 'local') {
        score += 12;
      } else {
        score -= 26;
      }
    } else if (action.timeBucket === '5') {
      score += 8;
      reasons.push('⚡ rychlý start');
    }

    // 3. Režim prostředí (online vs. venku vs. doma)
    if (mode === 'local') {
      if (action.mode === 'local') {
        score += 52;
        reasons.push('🚶 venku mimo obrazovky');
      } else if (action.mode === 'home') {
        score -= 16;
      } else {
        score -= 46;
      }
    } else if (mode === 'online') {
      if (action.mode === 'online') {
        score += 38;
        reasons.push('💻 hned z mobilu/PC');
      } else if (action.mode === 'home') {
        score += 24;
        reasons.push('🏠 v klidu z domova');
      } else {
        score -= 38;
      }
    } else if (mode === 'home') {
      if (action.mode === 'home') {
        score += 42;
        reasons.push('🏠 v klidu doma');
      } else if (action.mode === 'online') {
        score += 22;
      } else {
        score -= 28;
      }
    }

    // 4. Rozpočet (zdarma vs. drobný dar)
    if (cost === 'free') {
      if (action.cost === 'free') {
        score += 36;
        reasons.push('💸 0 Kč');
      } else {
        score -= 85;
      }
    } else if (cost === 'donation') {
      if (action.cost === 'donation') {
        score += 68;
        reasons.push('💚 přímý drobný dar');
      } else {
        score -= 35;
      }
    } else if (action.cost === 'free') {
      score += 4;
    }

    // 5. Sociální preference (solo vs. mezi lidmi)
    if (social === 'group') {
      if (action.social === 'group') {
        score += 56;
        reasons.push('🤝 mezi fajn lidmi');
      } else {
        score -= 26;
      }
    } else if (social === 'solo') {
      if (action.social === 'solo') {
        score += 22;
        reasons.push('🧘 bez nutnosti volat');
      } else {
        score -= 28;
      }
    }

    // 6. Jednorázově vs. dlouhodobě
    if (commitment === 'one_off') {
      if (action.commitment === 'one_off') {
        score += 45;
        reasons.push('⚡ jednorázově bez závazku');
      } else {
        score -= 55;
      }
    } else if (commitment === 'long_term') {
      if (action.commitment === 'long_term') {
        score += 85;
        reasons.push('🌱 dlouhodobá cesta');
      } else {
        score -= 65;
      }
    }

    // 7. Anonymita vs. kontakt
    if (contactLevel === 'anonymous') {
      if (action.contactLevel === 'anonymous') {
        score += 55;
        reasons.push('🔒 zcela anonymně');
      } else {
        score -= 65;
      }
    } else if (contactLevel === 'contact_ok') {
      if (action.contactLevel === 'contact_ok') {
        score += 65;
        reasons.push('👋 osobní kontakt');
      } else {
        score -= 55;
      }
    }

    // 8. Komu chci pomoci (lidé / zvířata / příroda)
    if (recipientMacro !== 'any') {
      if (action.recipientMacro === recipientMacro) {
        score += 75;
        const macroLabel =
          recipientMacro === 'people'
            ? '👥 pomoc lidem'
            : recipientMacro === 'animals'
              ? '🐾 pomoc zvířatům'
              : '🌿 pomoc přírodě';
        reasons.push(macroLabel);
      } else {
        score -= 65;
      }
    }

    // 9. Třída důkazů účinnosti (A / B / C)
    if (evidenceTier !== 'any') {
      if (action.impactEvidence === evidenceTier) {
        score += 140;
        reasons.push(`Důkazy ${evidenceTier}`);
      } else {
        score -= 140;
      }
    }

    // 10. Upřednostnit ještě nesplněné kroky a potlačit právě zobrazený tip
    if (completedSet.has(action.id)) {
      score -= 24;
    }
    if (excludeSet.has(action.id)) {
      score -= 15;
    }

    // 11. Deterministické promíchání v rámci shodného koše (odstraňuje bias indexu 0!)
    const varietyBonus = hashSignature(`${action.id}::${seedKey}`) * 9.5;
    score += varietyBonus;

    return {
      ...action,
      description: action.desc,
      score,
      reasons: reasons.slice(0, 3)
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

/**
 * Vytvoří přirozenou, nezávaznou šablonu prvního kontaktu (e-mail / zpráva) pro místo na mapě.
 * Snižuje úzkost z prvního oslovení ("Co jim mám napsat?").
 * @param {{ name?: string, kind?: string, email?: string }} place
 */
export function buildFirstContactTemplate(place) {
  const name = (place?.name || 'vaší organizaci').trim();
  const kind = place?.kind || 'ngo';

  let subject = 'Dotaz na možnost drobné výpomoci';
  let body = '';

  if (kind === 'animals') {
    subject = `Dotaz na možnost pomoci – ${name}`;
    body = `Dobrý den,\n\nnarazil/a jsem na ${name} a rád/a bych se zeptal/a, jestli teď nepotřebujete drobnou výpomoc (např. venčení, materiální dar nebo jednorázovou ruku k dílu).\n\nDejte mi prosím vědět, co by se vám teď nejvíc hodilo.\nDěkuji a přeji hezký den!`;
  } else if (kind === 'food') {
    subject = `Dotaz: Co se vám teď nejvíc hodí? (${name})`;
    body = `Dobrý den,\n\nrád/a bych podpořil/a ${name} – můžete mi prosím krátce napsat, jaké potraviny/věci teď nejvíc potřebujete, případně jestli hledáte dobrovolníky na výpomoc?\n\nMoc děkuji a přeji klidný den!`;
  } else if (kind === 'community') {
    subject = `Možnost zapojení / drobné výpomoci – ${name}`;
    body = `Dobrý den,\n\nbydlím v okolí a rád/a bych se zeptal/a, jestli v ${name} aktuálně nehledáte dobrovolníky na jednorázovou nebo občasnou výpomoc.\n\nPokud ano, dejte mi prosím vědět, s čím bych mohl/a začít.\nDěkuji a zdravím!`;
  } else {
    subject = `Dotaz na dobrovolnictví / pomoc – ${name}`;
    body = `Dobrý den,\n\nzaujala mě činnost ${name} a rád/a bych se zeptal/a, jak se u vás dá nejjednodušeji zapojit nebo s čím teď nejvíc potřebujete pomoci.\n\nPředem děkuji za krátkou zprávu a přeji hezký den!`;
  }

  const safeMail = sanitizeEmail(place?.email);
  const mailtoUrl = safeMail
    ? `mailto:${encodeURIComponent(safeMail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return {
    subject,
    body,
    mailtoUrl
  };
}

/**
 * Kurátorovaná záložní místa napříč ČR pro případ výpadku veřejného Overpass API.
 */
export const CURATED_FALLBACK_PLACES = [
  {
    id: 'curated:praha-potravinova-banka',
    name: 'Potravinová banka Praha',
    lat: 50.0792,
    lon: 14.5414,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://potravinovabankapraha.cz/',
    address: 'Ke Kablu 289, 102 00 Praha 10',
    phone: '+420 777 779 832',
    email: 'info@pbpraha.cz',
    description: 'Shromažďuje a třídí potraviny pro seniory, rodiny v nouzi a lidi bez domova v Praze.'
  },
  {
    id: 'curated:praha-nadeje',
    name: 'NADĚJE – pobočka Praha',
    lat: 50.0753,
    lon: 14.4301,
    kind: 'community',
    subcategory: 'Sociální služba',
    website: 'https://nadeje.cz/',
    address: 'Škrétova 490/12, 120 00 Praha 2',
    phone: '+420 222 522 624',
    email: 'praha@nadeje.cz',
    description: 'Praktická pomoc lidem v nouzi, nízkoprahová centra, výdej jídla a šatník.'
  },
  {
    id: 'curated:praha-utulek-troja',
    name: 'Útulek pro opuštěná zvířata Troja',
    lat: 50.1185,
    lon: 14.4216,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://upozpraha.cz/',
    address: 'V Zámcích 56, 181 00 Praha 8',
    phone: '+420 222 025 916',
    description: 'Městský útulek pro opuštěné psy a zvířata v Praze – možnost materiální podpory a adopce.'
  },
  {
    id: 'curated:praha-hestia',
    name: 'HESTIA – Národní dobrovolnické centrum',
    lat: 50.0882,
    lon: 14.4342,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://www.dobrovolnik.cz',
    address: 'Na Poříčí 1041/12, 110 00 Praha 1',
    phone: '+420 224 816 868',
    email: 'hestia@hest.cz',
    description: 'Propojuje dobrovolníky s ověřenými organizacemi, program Kompas a 3G pro seniory a děti.'
  },
  {
    id: 'curated:praha-zivot90',
    name: 'ŽIVOT 90 – komunitní centrum a pomoc seniorům',
    lat: 50.0889,
    lon: 14.4215,
    kind: 'community',
    subcategory: 'Pomoc seniorům',
    website: 'https://www.zivot90.cz/cs',
    address: 'Karoliny Světlé 286/18, 110 00 Praha 1',
    phone: '+420 222 333 555',
    email: 'info@zivot90.cz',
    description: 'Dobrovolnictví u seniorů, přátelské návštěvy, telefonická podpora a komunitní aktivity v centru Prahy.'
  },
  {
    id: 'curated:brno-vesna',
    name: 'Spolu v Brně – Ženský vzdělávací ústav Vesna',
    lat: 49.1982,
    lon: 16.5978,
    kind: 'community',
    subcategory: 'Komunitní centrum',
    website: 'https://spolekvesna.cz/',
    address: 'Údolní 221/10, 602 00 Brno',
    phone: '+420 731 843 857',
    email: 'info@spolekvesna.cz',
    description: 'Komunitní centrum, Šatník pro rodiny v nouzi, volnočasové a vzdělávací aktivity v Brně.'
  },
  {
    id: 'curated:brno-charita',
    name: 'Diecézní charita Brno – Dobrovolnické centrum',
    lat: 49.1924,
    lon: 16.6126,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://brno.charita.cz/',
    address: 'tř. Kpt. Jaroše 1928/9, 602 00 Brno',
    phone: '+420 545 426 620',
    email: 'brno@charita.cz',
    description: 'Dobrovolnictví, pomoc seniorům, lidem v krizi a potravinová pomoc na jižní Moravě.'
  },
  {
    id: 'curated:ostrava-adra',
    name: 'Dobrovolnické centrum ADRA Ostrava',
    lat: 49.8266,
    lon: 18.2683,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    address: '30. dubna 3003/9, 702 00 Ostrava',
    phone: '+420 739 386 739',
    email: 'dcostrava@adra.cz',
    description: 'Dobrovolnické programy pro seniory, děti, pacienty v nemocnicích a charitní šatníky v Ostravě.'
  },
  {
    id: 'curated:plzen-totem',
    name: 'TOTEM – Regionální dobrovolnické centrum Plzeň',
    lat: 49.7764,
    lon: 13.3688,
    kind: 'community',
    subcategory: 'Komunitní centrum',
    website: 'https://www.totemplzen.cz/',
    address: 'Kaznějovká 1517/51, 323 00 Plzeň',
    phone: '+420 377 260 425',
    email: 'totem@totemplzen.cz',
    description: 'Mezigenerační a dobrovolnické centrum v Plzni – propojuje mladé lidi, rodiny a seniory.'
  },
  {
    id: 'curated:olomouc-malteser',
    name: 'Maltézská pomoc Olomouc',
    lat: 49.5955,
    lon: 17.2518,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://maltezskapomoc.cz/',
    address: 'Křížkovského 505/6, 779 00 Olomouc',
    phone: '+420 585 227 568',
    email: 'olomouc@maltezskapomoc.cz',
    description: 'Dobrovolnické programy pro seniory, lidi se zdravotním postižením a děti z rodin v tísni.'
  },
  {
    id: 'curated:cb-adra',
    name: 'Dobrovolnické centrum ADRA České Budějovice',
    lat: 48.9747,
    lon: 14.4762,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    address: 'Biskupská 129/1, 370 01 České Budějovice',
    phone: '+420 733 742 183',
    email: 'dcceske-budejovice@adra.cz',
    description: 'Dobrovolnictví u seniorů, dětí a v charitních šatnících v Českých Budějovicích a okolí.'
  },
  {
    id: 'curated:hk-charita',
    name: 'Oblastní charita Hradec Králové – Dobrovolnické centrum',
    lat: 50.2096,
    lon: 15.8342,
    kind: 'ngo',
    subcategory: 'Neziskovka',
    website: 'https://hk.caritas.cz/',
    address: 'Komenského 266, 500 03 Hradec Králové',
    phone: '+420 495 514 722',
    email: 'dchk@hk.charita.cz',
    description: 'Pomoc seniorům, rodinám v tísni, potravinová a materiální sbírka v Hradci Králové.'
  },
  {
    id: 'curated:pardubice-konep',
    name: 'Koalíce nevládek Pardubicka (KONEP) – Dobrovolnické centrum',
    lat: 50.0378,
    lon: 15.7792,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://www.konep.cz/',
    address: 'Komenského 43, 530 02 Pardubice',
    phone: '+420 777 823 271',
    email: 'dobrovolnik@konep.cz',
    description: 'Regionální dobrovolnické centrum v Pardubicích propojující desítky neziskovek v kraji.'
  },
  {
    id: 'curated:pardubice-charita',
    name: 'Oblastní charita Pardubice',
    lat: 50.0386,
    lon: 15.7735,
    kind: 'community',
    subcategory: 'Sociální služba',
    website: 'https://pardubice.charita.cz/',
    address: 'V Ráji 732, 530 02 Pardubice',
    phone: '+420 466 611 325',
    email: 'info@charitapardubice.cz',
    description: 'Terénní péče, potravinová a materiální pomoc rodinám a seniorům na Pardubicku.'
  },
  {
    id: 'curated:liberec-archa',
    name: 'Centrum pro zvířata v nouzi Archa Liberec',
    lat: 50.7798,
    lon: 15.0835,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://zooliberec.cz/archa/',
    address: 'Ostašovská 570, 460 01 Liberec',
    phone: '+420 485 106 412',
    email: 'archa@zooliberec.cz',
    description: 'Záchranná stanice a útulek v Liberci – pomoc opuštěným psům, kočkám a volně žijícím zvířatům.'
  },
  {
    id: 'curated:usti-dcul',
    name: 'Dobrovolnické centrum Ústí nad Labem',
    lat: 50.6607,
    lon: 14.0398,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://dcul.eu/',
    address: 'Prokopa Diviše 1605/5, 400 01 Ústí nad Labem',
    phone: '+420 475 210 242',
    email: 'info@dcul.eu',
    description: 'Největší dobrovolnické centrum v Ústeckém kraji – doučování dětí, pomoc seniorům, šatník a akce.'
  },
  {
    id: 'curated:usti-charita',
    name: 'Oblastní charita Ústí nad Labem',
    lat: 50.6592,
    lon: 14.0415,
    kind: 'community',
    subcategory: 'Sociální služba',
    website: 'https://charitausti.cz/',
    address: 'Velká Hradební 49, 400 01 Ústí nad Labem',
    phone: '+420 475 215 301',
    email: 'info@charitausti.cz',
    description: 'Podpora lidí v tísni, nízkoprahová zařízení pro děti a mládež a dobrovolnictví v Ústí nad Labem.'
  },
  {
    id: 'curated:zlin-samari',
    name: 'Dobrovolnické centrum Samari Zlín',
    lat: 49.2265,
    lon: 17.6672,
    kind: 'community',
    subcategory: 'Komunitní centrum',
    website: 'https://www.samari.cz/',
    address: 'Štefánikova 2425, 760 01 Zlín',
    phone: '+420 739 062 426',
    email: 'info@samari.cz',
    description: 'Zlínská organizace propojující dobrovolníky s lidmi v nouzi, seniory a místní komunitou.'
  },
  {
    id: 'curated:jihlava-charita',
    name: 'Oblastní charita Jihlava – Dobrovolnické centrum',
    lat: 49.3961,
    lon: 15.5903,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://jihlava.charita.cz/',
    address: 'Jakubské náměstí 588/2, 586 01 Jihlava',
    phone: '+420 567 574 660',
    email: 'jihlava@charita.cz',
    description: 'Dobrovolnictví na Vysočině, pomoc rodinám, nízkoprahové kluby a terénní sociální služby.'
  },
  {
    id: 'curated:kv-instand',
    name: 'Dobrovolnické centrum Instand Karlovy Vary',
    lat: 50.2319,
    lon: 12.8669,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://dckv.cz/',
    address: 'Čankovská 212/9, 360 05 Karlovy Vary',
    phone: '+420 723 854 786',
    email: 'info@dckv.cz',
    description: 'Regionální dobrovolnické centrum Karlovarského kraje – programy pro seniory, nemocnice a komunitu.'
  },
  {
    id: 'curated:kv-charita',
    name: 'Oblastní charita Karlovy Vary',
    lat: 50.2345,
    lon: 12.8528,
    kind: 'community',
    subcategory: 'Sociální služba',
    website: 'https://www.kv.charita.cz/',
    address: 'Závodní 358/76, 360 06 Karlovy Vary',
    phone: '+420 731 619 711',
    email: 'info@kv.charita.cz',
    description: 'Pomoc lidem bez domova, seniorům a rodinám v nouzi v Karlových Varech a okolí.',
    quickMission: 'Zeptej se krátkou zprávou, jaké trvanlivé potraviny nebo teplé oblečení teď na zimu nejvíc uvítají.'
  },
  {
    id: 'curated:praha-satnik',
    name: 'Šatník Praha (Holešovická tržnice)',
    lat: 50.0989,
    lon: 14.4452,
    kind: 'food',
    subcategory: 'Komunitní šatník',
    website: 'https://www.satnikpraha.cz/',
    address: 'Bubenské nábřeží 306/13, Hala 19, Praha 7',
    email: 'info@satnikpraha.cz',
    description: 'Komunitní šatník pro rodiny samoživitelů a lidi v tísni – daruj hezké sezónní oblečení nebo pomoz s tříděním.',
    quickMission: 'Přines vyprané sezónní oblečení, boty nebo drogerii, které už doma nevyužiješ.'
  },
  {
    id: 'curated:kladno-utulek',
    name: 'Psí útulek Bouchalka (Kladensko)',
    lat: 50.1585,
    lon: 14.1675,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulekbouchalka.cz/',
    address: 'Buštěhrad 397, 273 43 Buštěhrad u Kladna',
    phone: '+420 739 433 776',
    description: 'Velký středočeský útulek u Kladna s možností venčení psů v okolní přírodě i darování krmiva.',
    quickMission: 'Zajeď o víkendu vyvenčit psa na procházku a vyčisti si hlavu od učení nebo práce.'
  },
  {
    id: 'curated:kladno-adra',
    name: 'Dobrovolnické centrum Kladno (ADRA)',
    lat: 50.1468,
    lon: 14.1032,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    address: 'Kladno – střed města',
    description: 'Propojuje dobrovolníky ve Středočeském kraji s osamělými seniory, dětmi a charitními šatníky.',
    quickMission: 'Napiš krátkou zprávu koordinátorovi – stačí 1 hodina týdně na popovídání se seniorem.'
  },
  {
    id: 'curated:mb-centrum',
    name: 'Komunitní a dobrovolnická pomoc Mladá Boleslav (Fokus)',
    lat: 50.4125,
    lon: 14.9048,
    kind: 'community',
    subcategory: 'Komunitní centrum',
    website: 'https://fokus-mb.cz/',
    address: 'Jaselská 1372, 293 01 Mladá Boleslav',
    description: 'Podpora duševního zdraví a komunitních aktivit na Mladoboleslavsku.',
    quickMission: 'Zajdi na otevřenou komunitní akci nebo nabídni drobnou dobrovolnickou ruku.'
  },
  {
    id: 'curated:kutnahora-charita',
    name: 'Oblastní charita Kutná Hora – Dobrovolnické centrum',
    lat: 49.9492,
    lon: 15.2686,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://kh.charita.cz/',
    address: 'Jakubská 1, 284 01 Kutná Hora',
    phone: '+420 327 512 332',
    description: 'Dobrovolnictví u dětí, seniorů a rodin v nouzi na Kutnohorsku a Čáslavsku.',
    quickMission: 'Ozvi se ohledně doučování dětí nebo jednorázové výpomoci na komunitní akci.'
  },
  {
    id: 'curated:brno-utulek',
    name: 'Útulek pro opuštěná zvířata MP Brno (Komín)',
    lat: 49.2314,
    lon: 16.5338,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.mpb.cz/utulek-pro-opustena-zvirata/',
    address: 'Bystrcká 46, 624 00 Brno-Komín',
    phone: '+420 541 420 111',
    description: 'Brněnský útulek pro opuštěné psy a kočky u přehrady a lesů.',
    quickMission: 'Daruj staré čisté deky, ručníky nebo konzervy pro kočky a psy.'
  },
  {
    id: 'curated:brno-pb',
    name: 'Potravinová banka Brno a Jihomoravský kraj',
    lat: 49.1764,
    lon: 16.6312,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.potravinovabankabrno.cz/',
    address: 'Černovická 15, 618 00 Brno',
    email: 'info@pbbrno.cz',
    description: 'Zachraňuje neprodané jídlo v Jihomoravském kraji a rozděluje ho lidem v nouzi.',
    quickMission: 'Nabídni 2–3 hodiny rukou při třídění potravin nebo sbírkách.'
  },
  {
    id: 'curated:ostrava-pb',
    name: 'Potravinová banka v Ostravě',
    lat: 49.8118,
    lon: 18.2485,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.potravinovabankaostrava.cz/',
    address: 'Zengrova 83, 703 00 Ostrava-Vítkovice',
    description: 'Centrum potravinové pomoci pro samoživitele a seniory v Moravskoslezském kraji.',
    quickMission: 'Přijď vypomoct s balením potravinových balíčků – vidíš výsledek hned pod rukama.'
  },
  {
    id: 'curated:ostrava-utulek',
    name: 'Útulek pro opuštěné psy Ostrava-Třebovice',
    lat: 49.8394,
    lon: 18.1806,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://utulekostrava.cz/',
    address: 'Provozní 5492/2, 722 00 Ostrava-Třebovice',
    description: 'Městský útulek v Ostravě hledající páníčky i materiální podporu pro opuštěné psy.',
    quickMission: 'Zeptej se, jaké granule, pamlsky nebo hračky teď psům udělají největší radost.'
  },
  {
    id: 'curated:plzen-utulek',
    name: 'Útulek pro zvířata v nouzi Plzeň',
    lat: 49.7662,
    lon: 13.3375,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulekplzen.cz/',
    address: 'Daimlerova 1219/7, 301 00 Plzeň',
    phone: '+420 377 244 744',
    description: 'Plzeňský útulek s aktivní komunitou dobrovolníků a možností materiální pomoci.',
    quickMission: 'Přines staré povlečení/ručníky do kotců nebo kvalitní konzervy.'
  },
  {
    id: 'curated:olomouc-utulek',
    name: 'Útulek LOZ ČR Olomouc (Neředín)',
    lat: 49.5912,
    lon: 17.2065,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.olomouckyutulek.cz/',
    address: 'U Letiště, 779 00 Olomouc-Neředín',
    phone: '+420 585 418 484',
    description: 'Oblíbený olomoucký útulek u letiště, kam chodí venčit psi desítky vysokoškoláků.',
    quickMission: 'Vezmi kamaráda a zajděte odpoledne vyvenčit jednoho z pejsků na louku u letiště!'
  },
  {
    id: 'curated:cb-utulek',
    name: 'Zvířecí útulek České Budějovice',
    lat: 48.9958,
    lon: 14.4552,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulekcb.cz/',
    address: 'České Vrbné 2394, 370 11 České Budějovice',
    description: 'Útulek pro psy a kočky u Vltavy v Českých Budějovicích.',
    quickMission: 'Domluv si venčení u řeky nebo přines krmivo pro koťata a štěňata.'
  },
  {
    id: 'curated:hk-pb',
    name: 'Potravinová banka Hradec Králové',
    lat: 50.2185,
    lon: 15.8114,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://pbhk.cz/',
    address: 'Prostřední 47, 500 11 Hradec Králové',
    description: 'Potravinová pomoc pro Královéhradecký kraj – zachraňuje čerstvé i trvanlivé jídlo.',
    quickMission: 'Pomoz na jedno dopoledne třídit darované potraviny s přátelským týmem.'
  },
  {
    id: 'curated:zlin-utulek',
    name: 'Útulek pro zvířata v nouzi Zlín – Vršava',
    lat: 49.2412,
    lon: 17.6845,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulekzlin.cz/',
    address: 'Mezilesí 636, 760 01 Zlín',
    phone: '+420 577 244 444',
    description: 'Lesní útulek na Vršavě ve Zlíně s pravidelným veřejným venčením psů v přírodě.',
    quickMission: 'Ideální odpolední procházka v lese se psem z útulku (stačí občanka a dobrá nálada).'
  },
  {
    id: 'curated:jihlava-utulek',
    name: 'Útulek pro opuštěná zvířata Jihlava – Pístov',
    lat: 49.3854,
    lon: 15.5468,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.smj.cz/sluzby/utulek-pro-opustena-zvirata',
    address: 'Pístov 58, 586 01 Jihlava',
    description: 'Útulek na okraji Jihlavy pečující o nalezené psy a kočky z Vysočiny.',
    quickMission: 'Zavolej nebo napiš, jaké pamlsky a deky se jim zrovna teď nejvíc hodí.'
  },
  {
    id: 'curated:liberec-adra',
    name: 'Dobrovolnické centrum ADRA Liberec',
    lat: 50.7685,
    lon: 15.0564,
    kind: 'ngo',
    subcategory: 'Dobrovolnické centrum',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    address: 'Palachova 504/7, 460 01 Liberec',
    description: 'Dobrovolnictví u seniorů, dětí a v charitních šatnících v Liberci a Jablonci.',
    quickMission: 'Napiš krátkou zprávu — stačí hodina týdně na popovídání se seniorem nebo výpomoc v šatníku.'
  },
  {
    id: 'curated:liberec-pb',
    name: 'Potravinová banka Libereckého kraje',
    lat: 50.7582,
    lon: 15.0488,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.pblk.cz/',
    address: 'Tanvaldská 345, 463 11 Liberec-Vratislavice',
    description: 'Shromažďuje neprodané potraviny pro rodiny samoživitelů a seniory v Libereckém kraji.',
    quickMission: 'Ozvi se na pár hodin třídění potravin nebo daruj trvanlivé jídlo.'
  },
  {
    id: 'curated:pardubice-utulek',
    name: 'Městský útulek pro opuštěná zvířata Pardubice',
    lat: 50.0242,
    lon: 15.7418,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://mp.pardubice.eu/utulek/',
    address: 'Za Pasáží 1802, 530 02 Pardubice',
    description: 'Pardubický útulek pro nalezené psy a kočky s možností materiální podpory a adopcí.',
    quickMission: 'Zeptej se, jaké konzervy pro koťata nebo čisté deky se jim teď nejvíc hodí.'
  },
  {
    id: 'curated:usti-utulek',
    name: 'Útulek pro opuštěná zvířata Ústí nad Labem (Předlice)',
    lat: 50.6548,
    lon: 13.9912,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulek-ul.cz/',
    address: 'Řeháčkova 9, 400 01 Ústí nad Labem',
    description: 'Městský útulek v Ústí nad Labem pečující o opuštěné psy a kočky z okolí.',
    quickMission: 'Daruj kvalitní pamlsky, konzervy nebo se domluv na venčení.'
  },
  {
    id: 'curated:usti-pb',
    name: 'Potravinová banka Ústeckého kraje',
    lat: 50.6652,
    lon: 14.0185,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.pbuk.cz/',
    address: 'Jateční 1588/49, 400 01 Ústí nad Labem',
    description: 'Zachraňuje potraviny před vyhozením a pomáhá tisícům lidí v nouzi v Ústeckém kraji.',
    quickMission: 'Přijď vypomoct při třídění potravinových darů — i jedno dopoledne hodně pomůže.'
  },
  {
    id: 'curated:kv-utulek',
    name: 'Útulek pro opuštěné psy Karlovy Vary (Jenišov)',
    lat: 50.2286,
    lon: 12.8115,
    kind: 'animals',
    subcategory: 'Útulek',
    website: 'https://www.utulek-kv.cz/',
    address: 'Jenišov u Karlových Varů',
    description: 'Útulek pro opuštěné psy na okraji Karlových Varů u lesních cest.',
    quickMission: 'Domluv si víkendové vyvenčení psa v přírodě nebo přines krmivo.'
  },
  {
    id: 'curated:plzen-pb',
    name: 'Potravinová banka Plzeň',
    lat: 49.7342,
    lon: 13.3892,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.potravinovabankaplzen.cz/',
    address: 'Cukrovarská 19, 301 00 Plzeň',
    description: 'Zachraňuje jídlo pro samoživitele, seniory a lidi bez domova v Plzeňském kraji.',
    quickMission: 'Nabídni ruku k dílu při balení potravinové pomoci v Plzni.'
  },
  {
    id: 'curated:cb-pb',
    name: 'Potravinová banka Jihočeského kraje',
    lat: 48.9832,
    lon: 14.4845,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.pbjck.cz/',
    address: 'Nádražní 1759, 370 01 České Budějovice',
    description: 'Centrum záchrany potravin a materiální pomoci pro rodiny v nouzi na jihu Čech.',
    quickMission: 'Ozvi se na krátkou výpomoc ve skladu nebo při potravinové sbírce.'
  },
  {
    id: 'curated:olomouc-pb',
    name: 'Potravinová banka v Olomouckém kraji',
    lat: 49.5842,
    lon: 17.2748,
    kind: 'food',
    subcategory: 'Potravinová banka',
    website: 'https://www.pbok.cz/',
    address: 'Hněvotínská, 779 00 Olomouc',
    description: 'Rozděluje zachráněné čerstvé i trvanlivé potraviny potřebným v Olomouci a okolí.',
    quickMission: 'Ideální odpolední výpomoc pro studenty UPOL — výsledky vidíš hned.'
  }
].map((p) => ({
  ...p,
  verifiedAt: p.verifiedAt || '11/2026',
  sourceType: 'verified_org'
}));

/**
 * Rychlé odkazy na všech 14 krajů ČR (včetně Středočeského – Kladno) pro 1-klikový skok na mapu (/near)
 */
export const CZECH_CITIES = [
  { id: 'praha', name: 'Praha', lat: 50.0755, lon: 14.4378, radius: 8000 },
  { id: 'brno', name: 'Brno', lat: 49.1951, lon: 16.6068, radius: 8000 },
  { id: 'ostrava', name: 'Ostrava', lat: 49.8209, lon: 18.2625, radius: 10000 },
  { id: 'plzen', name: 'Plzeň', lat: 49.7384, lon: 13.3736, radius: 8000 },
  { id: 'liberec', name: 'Liberec', lat: 50.7663, lon: 15.0543, radius: 8000 },
  { id: 'olomouc', name: 'Olomouc', lat: 49.5938, lon: 17.2509, radius: 8000 },
  { id: 'budejovice', name: 'České Budějovice', lat: 48.9745, lon: 14.4743, radius: 8000 },
  { id: 'hradec', name: 'Hradec Králové', lat: 50.2092, lon: 15.8328, radius: 8000 },
  { id: 'pardubice', name: 'Pardubice', lat: 50.0343, lon: 15.7812, radius: 8000 },
  { id: 'usti', name: 'Ústí nad Labem', lat: 50.6611, lon: 14.0531, radius: 8000 },
  { id: 'zlin', name: 'Zlín', lat: 49.2244, lon: 17.6627, radius: 8000 },
  { id: 'jihlava', name: 'Jihlava', lat: 49.3961, lon: 15.5912, radius: 8000 },
  { id: 'karlovyvary', name: 'Karlovy Vary', lat: 50.2319, lon: 12.8712, radius: 8000 },
  { id: 'kladno', name: 'Kladno (Stř. Čechy)', lat: 50.1473, lon: 14.1028, radius: 10000 }
];

/**
 * Skutečné, uvěřitelné příklady malých kroků bez patosu
 */
export const REAL_STORIES = [
  {
    id: 'story-utulek',
    person: 'Klára (19), studentka z Brna',
    icon: '🐕',
    quote: 'Měla jsem pocit, že nic nemá smysl a nikam nepatřím. Zkusila jsem napsat jednu krátkou zprávu do útulku, jestli nepotřebují vyvenčit psy. Teď chodím jednou za dva týdny na hodinu do lesa a čistím si u toho hlavu.',
    tag: 'Zvířata • 1 hodina venku',
    ctaLabel: 'Najít útulky v okolí →',
    ctaHref: '/near?kinds=animals'
  },
  {
    id: 'story-mapa',
    person: 'Matěj (21), Olomouc',
    icon: '🗺️',
    quote: 'Nechtěl jsem s nikým mluvit ani nikam volat. Večer u čaje jsem na Missing Maps za 15 minut obkreslil 30 budov ze satelitu pro Lékaře bez hranic. Nulový stres a přitom reálná pomoc.',
    tag: 'Z gauče • 15 minut • 0 Kč',
    ctaLabel: 'Zkusit online mikro-kroky →',
    ctaHref: '/app/online?filter=writing'
  },
  {
    id: 'story-satnik',
    person: 'Tereza (24), Praha',
    icon: '🧥',
    quote: 'Vzala jsem ze skříně dvě teplé mikiny, které už nenosím, a cestou na tramvaj je odnesla do komunitního šatníku o dvě ulice dál. Zabralo to 20 minut a někomu teď v zimě opravdu poslouží.',
    tag: 'Věci a jídlo • 20 minut',
    ctaLabel: 'Najít šatníky a potravinovou pomoc →',
    ctaHref: '/near?kinds=food,community'
  },
  {
    id: 'story-doucovani',
    person: 'Jakub (20), Ostrava',
    icon: '📚',
    quote: 'Přihlásil jsem se na online doučování matematiky pro jednoho třeťáka z rodiny v tísni. Jednou týdně si zavoláme na půl hodiny. Pro mě maličkost, pro něj obrovský rozdíl.',
    tag: 'Vzdělávání • z domova',
    ctaLabel: 'Najít svoji oblast v průvodci →',
    ctaHref: '/app/guided?topic=education'
  },
  {
    id: 'story-knihobudka',
    person: 'Anežka (18), Plzeň',
    icon: '📖',
    quote: 'Cestou ze školy jsem dala dvě přečtené knížky do knihobudky v parku a po cestě posbírala pár plastových lahví u lavičky. Pět minut, žádná registrace a hned lepší den.',
    tag: 'Komunita a příroda • 5 minut',
    ctaLabel: 'Rychlé kroky do 5 minut →',
    ctaHref: '/app/online?filter=fast'
  },
  {
    id: 'story-brontosaurus',
    person: 'Filip (23), České Budějovice',
    icon: '⛺',
    quote: 'Byl jsem po zkouškovém úplně vyšťavený z obrazovek. Jel jsem na sobotní výsadbu stromů s Brontosaurem. Nikoho jsem tam neznal, ale večer u ohně jsem měl poprvé po měsících čistou hlavu.',
    tag: 'Příroda a noví lidé • víkendovka',
    ctaLabel: 'Doporučit venkovní zapojení →',
    ctaHref: '/app/guided?topic=environment'
  }
];

/**
 * Protijed na doomscrolling: Ověřená fakta naděje z České republiky
 */
export const HOPE_FACTS = [
  {
    id: 'hope-banky',
    stat: '17 400 tun jídla ročně',
    title: 'České potravinové banky zachraňují tisíce tun jídla před vyhozením',
    detail: 'Díky stovkám běžných dobrovolníků a dárců dostává pravidelnou potravinovou pomoc 430 000 lidí v nouzi po celé ČR.',
    sourceLabel: 'Česká federace potravinových bank (Výroční zpráva)',
    sourceUrl: 'https://www.potravinovebanky.cz/uploads/dms/pdf/6a2004ae277ef699586774.pdf',
    verifiedAt: '02/2026',
    actionLabel: 'Najít potravinovou pomoc v okolí →',
    actionHref: '/near?kinds=food'
  },
  {
    id: 'hope-uklidme',
    stat: '1 000 000+ dobrovolníků',
    title: 'Do akce Ukliďme Česko se od vzniku zapojil už přes milion lidí',
    detail: 'Na více než 4 000 místech ČR vyrážejí sousedé, studenti a rodiny uklízet lesy, potoky a parky. Stačí vzít sáček při běžné procházce.',
    sourceLabel: 'Ukliďme Česko – Historie a statistiky úklidů',
    sourceUrl: 'https://www.uklidmecesko.cz/about/historie/',
    verifiedAt: '11/2026',
    actionLabel: 'Zkusit malý krok pro přírodu →',
    actionHref: '/app/guided?topic=environment'
  },
  {
    id: 'hope-darujme',
    stat: 'Přes 3,4 miliardy Kč',
    title: 'Češi poslali přes Darujme.cz miliardy korun pro více než 1 800 organizací',
    detail: 'Většinu darů na českých dárcovských platformách netvoří milionáři, ale statisíce obyčejných lidí, kteří pošlou drobnou částku tam, kde je to potřeba.',
    sourceLabel: 'Darujme.cz (Nadace VIA)',
    sourceUrl: 'https://www.darujme.cz/',
    verifiedAt: '11/2026',
    actionLabel: 'Prohlédnout ověřené mikro-kroky →',
    actionHref: '/app/online'
  },
  {
    id: 'hope-dren',
    stat: '170 104 dárců v registru',
    title: 'Český národní registr dárců dřeně umožnil už 2 939 odběrů krvetvorných buněk',
    detail: 'Desítky tisíc mladých Čechů (18–35 let) se bezbolestně zapsaly stěrem z úst a téměř třem tisícům pacientů s leukémií to dalo šanci na život.',
    sourceLabel: 'ČNRDD – Aktuální čísla registru',
    sourceUrl: 'https://registr.kostnidren.cz/o-registru/aktualni-cisla/',
    verifiedAt: '09/2026',
    actionLabel: 'Zjistit více o zápisu (5 min) →',
    actionHref: '/app/guided?topic=health'
  },
  {
    id: 'hope-zachranka',
    stat: '2,5 milionu uživatelů',
    title: 'Česká aplikace Záchranka chrání životy už v několika zemích Evropy',
    detail: 'Nápad českého studenta propojil horskou službu, záchranku a mapu defibrilátorů (AED) tak dobře, že český systém převzalo i Rakousko, Maďarsko a Finsko.',
    sourceLabel: 'Aplikace Záchranka – Oficiální přehled',
    sourceUrl: 'https://www.zachrankaapp.cz/',
    verifiedAt: '11/2026',
    actionLabel: 'Zkontrolovat online tipy pro zdraví →',
    actionHref: '/app/online?filter=fast'
  },
  {
    id: 'hope-krabice',
    stat: '50 000+ dárků dětem ročně',
    title: 'Sbírka Krabice od bot spojuje celé Česko na pomoc dětem v nouzi',
    detail: 'Každý rok desítky tisíc rodin a studentů připraví dárky a školní pomůcky pro děti z azylových domů a chudých rodin ve svém vlastním okrese.',
    sourceLabel: 'Krabice od bot (Diakonie ČCE)',
    sourceUrl: 'https://www.krabiceodbot.cz/',
    verifiedAt: '11/2026',
    actionLabel: 'Pomoc dětem a vzdělávání →',
    actionHref: '/app/guided?topic=children'
  }
];

/**
 * In-memory úložiště pro komunitní tipy (slouží jako okamžitý fallback, když není připojená DB)
 * @type {Array<any>}
 */
export const LOCAL_COMMUNITY_ITEMS = [
  {
    id: 'comm-seed-1',
    kind: 'org',
    name: 'Potravinová banka Praha a Středočeský kraj',
    category: 'Potraviny a materiální pomoc',
    description: 'Třídění darovaných potravin a balíčků pro samoživitele, seniory a lidi v nouzi.',
    website: 'https://potravinovabankapraha.cz/',
    email: 'info@pbpraha.cz',
    phone: '+420 777 779 832',
    address_label: 'Ke Kablu 289, Praha 10',
    lat: 50.0792,
    lon: 14.5414
  },
  {
    id: 'comm-seed-2',
    kind: 'org',
    name: 'Spolek Vesna – Šatník a komunitní centrum Brno',
    category: 'Komunita a rodiny',
    description: 'Pomoc rodinám v tísni, komunitní šatník a otevřené dílny v centru Brna.',
    website: 'https://spolekvesna.cz/',
    email: 'info@spolekvesna.cz',
    phone: '+420 731 843 857',
    address_label: 'Údolní 221/10, Brno',
    lat: 49.1982,
    lon: 16.5978
  },
  {
    id: 'comm-seed-3',
    kind: 'org',
    name: 'Dobrovolnické centrum ADRA Ostrava',
    category: 'Senioři a dobrovolnictví',
    description: 'Návštěvy osamělých seniorů, volnočasové aktivity s dětmi a charitní šatníky.',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    email: 'dcostrava@adra.cz',
    phone: '+420 739 386 739',
    address_label: '30. dubna 3003/9, Ostrava',
    lat: 49.8266,
    lon: 18.2683
  },
  {
    id: 'comm-seed-4',
    kind: 'org',
    name: 'TOTEM – Mezigenerační a dobrovolnické centrum Plzeň',
    category: 'Komunitní centrum',
    description: 'Doučování dětí, podpora seniorů a sousedské komunitní akce v Plzni.',
    website: 'https://www.totemplzen.cz/',
    email: 'totem@totemplzen.cz',
    phone: '+420 377 260 425',
    address_label: 'Kaznějovká 1517/51, Plzeň',
    lat: 49.7764,
    lon: 13.3688
  },
  {
    id: 'comm-seed-5',
    kind: 'org',
    name: 'Dobrovolnické centrum Ústí nad Labem (DCÚL)',
    category: 'Dobrovolnické centrum',
    description: 'Programy pro děti, seniory, zvířata i komunitní šatník v Ústí nad Labem.',
    website: 'https://dcul.eu/',
    email: 'info@dcul.eu',
    phone: '+420 475 210 242',
    address_label: 'Prokopa Diviše 1605/5, Ústí nad Labem',
    lat: 50.6607,
    lon: 14.0398
  },
  {
    id: 'comm-seed-6',
    kind: 'org',
    name: 'KONEP – Dobrovolnické centrum Pardubice',
    category: 'Dobrovolnické centrum',
    description: 'Koalice nevládek Pardubicka – vstupní brána k dobrovolnictví v celém Pardubickém kraji.',
    website: 'https://www.konep.cz/',
    email: 'dobrovolnik@konep.cz',
    phone: '+420 777 823 271',
    address_label: 'Komenského 43, Pardubice',
    lat: 50.0378,
    lon: 15.7792
  },
  {
    id: 'comm-seed-7',
    kind: 'org',
    name: 'Oblastní charita Jihlava – Dobrovolnické centrum',
    category: 'Dobrovolnické centrum',
    description: 'Dobrovolnictví na Vysočině, nízkoprahové kluby pro mládež a terénní pomoc.',
    website: 'https://jihlava.charita.cz/',
    email: 'jihlava@charita.cz',
    phone: '+420 567 574 660',
    address_label: 'Jakubské náměstí 588/2, Jihlava',
    lat: 49.3961,
    lon: 15.5903
  },
  {
    id: 'comm-seed-8',
    kind: 'org',
    name: 'Dobrovolnické centrum Instand Karlovy Vary',
    category: 'Dobrovolnické centrum',
    description: 'Dobrovolnické programy v nemocnicích, u seniorů a komunitní akce v Karlových Varech.',
    website: 'https://dckv.cz/',
    email: 'info@dckv.cz',
    phone: '+420 723 854 786',
    address_label: 'Čankovská 212/9, Karlovy Vary',
    lat: 50.2319,
    lon: 12.8669
  },
  {
    id: 'comm-seed-9',
    kind: 'org',
    name: 'Maltézská pomoc Olomouc – Dobrovolnické centrum',
    category: 'Senioři a rodiny',
    description: 'Dobrovolnictví u osamělých seniorů, lidí s postižením a doučování dětí v Olomouci.',
    website: 'https://maltezskapomoc.cz/',
    email: 'olomouc@maltezskapomoc.cz',
    phone: '+420 585 227 568',
    address_label: 'Křížkovského 505/6, Olomouc',
    lat: 49.5955,
    lon: 17.2518
  },
  {
    id: 'comm-seed-10',
    kind: 'org',
    name: 'Dobrovolnické centrum ADRA České Budějovice',
    category: 'Senioři a dobrovolnictví',
    description: 'Dobrovolnictví u seniorů, dětí a v charitních šatnících v Českých Budějovicích.',
    website: 'https://adra.cz/jak-pomahame/dobrovolnictvi/',
    email: 'dcceske-budejovice@adra.cz',
    phone: '+420 733 742 183',
    address_label: 'Biskupská 129/1, České Budějovice',
    lat: 48.9747,
    lon: 14.4762
  },
  {
    id: 'comm-seed-11',
    kind: 'org',
    name: 'Oblastní charita Hradec Králové – Dobrovolnické centrum',
    category: 'Potraviny a senioři',
    description: 'Pomoc seniorům, rodinám v tísni, potravinová a materiální sbírka v Hradci Králové.',
    website: 'https://hk.caritas.cz/',
    email: 'dchk@hk.charita.cz',
    phone: '+420 495 514 722',
    address_label: 'Komenského 266, Hradec Králové',
    lat: 50.2096,
    lon: 15.8342
  },
  {
    id: 'comm-seed-12',
    kind: 'org',
    name: 'Centrum pro zvířata v nouzi Archa Liberec',
    category: 'Zvířata a útulky',
    description: 'Záchranná stanice a útulek v Liberci – pomoc opuštěným psům, kočkám a volně žijícím zvířatům.',
    website: 'https://zooliberec.cz/archa/',
    email: 'archa@zooliberec.cz',
    phone: '+420 485 106 412',
    address_label: 'Ostašovská 570, Liberec',
    lat: 50.7798,
    lon: 15.0835
  },
  {
    id: 'comm-seed-13',
    kind: 'org',
    name: 'Dobrovolnické centrum Samari Zlín',
    category: 'Komunitní centrum',
    description: 'Zlínská organizace propojující dobrovolníky s lidmi v nouzi, seniory a místní komunitou.',
    website: 'https://www.samari.cz/',
    email: 'info@samari.cz',
    phone: '+420 739 062 426',
    address_label: 'Štefánikova 2425, Zlín',
    lat: 49.2265,
    lon: 17.6672
  }
];



