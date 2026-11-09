/**
 * Civic activity pulse client service.
 * Fetches real-time anonymous altruistic actions completed across Czechia and formats descriptive text.
 */

/**
 * Fetches recent ambient pulse event from backend API.
 * Returns null if network fails or no active pulse is available.
 * @returns {Promise<any | null>}
 */
export async function fetchAmbientPulse() {
  try {
    const r = await fetch('/api/pulse');
    if (r.ok) return await r.json();
  } catch {}
  // Bez odpovědi serveru nic nevymýšlíme (dříve se ukazovala smyšlená věta o Brně)
  return null;
}

/**
 * Text „pulzu komunity“ podle místa, kde se zobrazuje.
 * - `inCard`: pod konkrétní kartou smí být bez označení jen skutečná událost ke STEJNÉMU skutku
 *   (dříve se pod Freerice nebo NADĚJÍ ukazovala „miska v útulku“, jako by šlo o tenhle krok).
 *   Jiná skutečná událost je zřetelně označená jako „Mezitím v komunitě“, tip na jiný skutek
 *   pod kartu nepatří (konkuroval by hlavní volbě).
 * - jinde: skutečná událost s označením „V komunitě:“, nebo tip na skutek.
 * @param {any} pulse
 * @param {{ actionId?: string | null, inCard?: boolean }} [opts]
 * @returns {string}
 */
export function describeAmbientPulse(pulse, opts = {}) {
  const neutral = 'Až skutek dokončíš, objeví se tu anonymně jako pulz komunity.';
  const msg = String(pulse?.message || '').trim();
  if (!msg) return neutral;
  const isLive = Boolean(pulse?.isLive);
  const lowered = `${msg.charAt(0).toLowerCase()}${msg.slice(1)}`;
  if (opts.inCard) {
    if (!isLive) return neutral;
    return opts.actionId && pulse.actionId === opts.actionId ? msg : `Mezitím v komunitě: ${lowered}`;
  }
  return isLive ? `V komunitě: ${lowered}` : msg;
}
