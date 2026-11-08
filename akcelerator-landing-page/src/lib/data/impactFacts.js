/**
 * Jediný zdroj pravdy pro čísla dopadu, která se opakují na více místech webu
 * (karta akce, efekt na plátně, Krajina dobra, dobré zprávy). Když se změní údaj u partnera,
 * stačí ho upravit tady.
 *
 * Click and Feed: 1 bezplatné kliknutí = cca 25 g krmiva od sponzora Brit
 * (zdroj: https://clickandfeed.cz/, ověřeno 11/2026).
 */
export const CLICK_AND_FEED = Object.freeze({
  gramsPerClick: 25,
  totalTonnesLabel: '1 068',
  shelters: 448,
  sponsor: 'Brit',
  sourceUrl: 'https://clickandfeed.cz/'
});

/** Freerice: za každou správnou odpověď sponzoři darují 10 zrnek rýže (freerice.com). */
export const FREERICE = Object.freeze({
  grainsPerAnswer: 10,
  answersPerRound: 10
});

/**
 * České skloňování podle počtu (1 / 2–4 / 0 a 5+).
 * @param {number} n
 * @param {string} one
 * @param {string} few
 * @param {string} many
 */
export function czPlural(n, one, few, many) {
  const abs = Math.abs(Math.trunc(Number(n) || 0));
  if (abs === 1) return one;
  if (abs >= 2 && abs <= 4) return few;
  return many;
}
