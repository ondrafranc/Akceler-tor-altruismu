/**
 * Metodika a klasifikace tříd důkazů účinnosti pomoci (Concept v2: Agency-first, Czech-only).
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

export const EVIDENCE_A_IDS = new Set([
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

export const EVIDENCE_C_IDS = new Set([
  'knihobudka_kniha',
  'trash_hero_uklid',
  'brontosaurus_vikend',
  'na_ovoce_strom',
  'zachran_jidlo_recept',
  'estudanky_pramen',
  'mapko_kompost',
  'nevyhazujto_sousedum'
]);

export const LONG_TERM_IDS = new Set([
  'letters_seniors',
  'ucime_online',
  'potravinova_banka',
  'brontosaurus_vikend',
  'inex_workcamp_cr',
  'doucujte_cvt',
  'moudra_sovicka_mobil',
  'dobry_andel'
]);

export const CONTACT_OK_IDS = new Set([
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

export const PARTNER_REGISTRATION_IDS = new Set([
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
