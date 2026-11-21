/**
 * Datový modul Molly: její texty a průvodcovské nápovědy. Bez závislostí, aby ho mohl číst store i komponenty.
 */

/**
 * Poděkování po dokončeném skutku, zapsaném přání v Krajině dobra nebo dechovém zastavení.
 * Krátké, klidné, bez odměn a bez počítání.
 */
export const MOLLY_DEED_THANKS = [
  'Mrrr… děkuji, že pomáháš.',
  'Tvůj skutek dnes někomu ulehčil. Předu ti za něj.',
  'Mrrr… to bylo hezké. Děkuji.',
  'Děkuji. I malý krok se počítá.'
];

/**
 * Molly jako průvodkyně: jemná nápověda při prvním příchodu na stránku (1× za session)
 * a nabídka hlavního kroku po chvíli nečinnosti (prvek s atributem `data-molly-guide`).
 * @type {Record<string, { icon: string, hint: string, nudge: string }>}
 */
export const MOLLY_ROUTE_GUIDES = {
  '/': {
    icon: 'paw',
    hint: 'Vyber si, kolik máš dnes času — ukážu ti jeden klidný skutek.',
    nudge: 'Tenhle drobný krok zabere jen chvilku.'
  },
  '/app': {
    icon: 'compass',
    hint: 'Vyber si cestu, která ti dnes sedí.',
    nudge: 'Když si nebudeš vědět rady s výběrem, najdeme krok na míru.'
  },
  '/app/guided': {
    icon: 'compass',
    hint: 'Společně najdeme pomoc, která ti dnes nejlépe sedne.',
    nudge: 'Tenhle skutek by ti teď mohl sedět.'
  },
  '/app/online': {
    icon: 'clock',
    hint: 'Tady stačí pár minut z domova. Vyber si jeden krok.',
    nudge: 'Tenhle krok zvládneš v klidu odkudkoliv.'
  },
  '/near': {
    icon: 'map-pin',
    hint: 'Podívej se, kdo potřebuje pomoc kousek od tebe.',
    nudge: 'Můžeš začít tímto místem — je tu i krátký návod.'
  },
  '/svet': {
    icon: 'sparkles',
    hint: 'Tady u lesní tůně odpočívám. Dotykem hladiny rozsvítíš své světlo.',
    nudge: 'Zkus si tu na chvilku klidně vydechnout.'
  },
  '/submit': {
    icon: 'sprout',
    hint: 'Znáš místo, kde se pomáhá? Přidej ho a ukaž cestu dalším.',
    nudge: 'Stačí jen název a adresa, zbytek s péčí ověříme.'
  }
};

/**
 * Pozdrav podle denní doby (lokální čas zařízení).
 * @param {Date} [d]
 */
export function getMollyGreeting(d = new Date()) {
  const h = d.getHours();
  if (h >= 5 && h < 10) return 'Dobré ráno.';
  if (h >= 10 && h < 18) return 'Klidný den.';
  if (h >= 18 && h < 23) return 'Dobrý večer.';
  return 'Tichou noc.';
}

/**
 * Šeptanda při pohlazení.
 */
export const MOLLY_PET_WHISPERS = [
  'Mrrr… každá drobná laskavost krásně hřeje.',
  'Tichounce předu. Děkuji, že tu dnes jsi.',
  'Mrrr… tvá laskavost zahřeje víc než odpolední slunce.',
  'U lesní tůně v Krajině dobra je klidné místo i pro tebe.',
  'Předu s tebou. Každý malý skutek se počítá.',
  'Mrrr… klidně si na chvilku vydechni, hlídám to tu s tebou.',
  'Děláš svět kolem o kousek vlídnějším místem.',
  'Tvoje pomoc má smysl. I malý krok mění den k lepšímu.'
];


