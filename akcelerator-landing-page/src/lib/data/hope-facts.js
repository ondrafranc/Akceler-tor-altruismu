/**
 * Protijed na doomscrolling: Ověřená fakta naděje z České republiky.
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
    actionLabel: 'Prohlédnout ověřené drobné skutky →',
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
