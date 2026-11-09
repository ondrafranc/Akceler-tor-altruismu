/**
 * Povzbuzující zprávy a hřejivá potvrzení po dokončení kroku.
 */

export const ENCOURAGEMENT_MESSAGES = [
  'Děkujeme. Právě putuje kousek reálné pomoci dál.',
  'Každý takový drobný skutek mění den někomu konkrétnímu.',
  'Tohle mělo smysl. Pomoc druhým nemusí být složitá, aby byla opravdová.',
  'Skvělé. I malá laskavost dělá místo kolem nás o poznání lepším.',
  'Hotovo. Pokud chceš, můžeš si teď v klidu vydechnout a mít z toho radost.'
];

export function getRandomEncouragement() {
  const idx = Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length);
  return ENCOURAGEMENT_MESSAGES[idx] || ENCOURAGEMENT_MESSAGES[0];
}
