/**
 * 8 hlavních tematických oblastí pomoci (Concept v2: Agency-first, Czech-only).
 */

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
