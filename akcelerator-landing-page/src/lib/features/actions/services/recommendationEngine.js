/**
 * Recommendation Engine for Akcelerátor altruismu.
 * Matches and scores micro-actions based on capacity, situation, cause topics, and preferences.
 */

import { MICRO_ACTIONS } from '../../../data/micro-actions.js';

/**
 * Deterministic hash for pseudo-random tie-breaking within identical scoring buckets.
 * @param {string} str
 * @returns {number} Float in [0, 1)
 */
export function hashSignature(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * Normalizes input preferences from either an options object or positional arguments.
 * @param {any} prefsOrCapacity
 * @param {string} [situation]
 * @param {string} [topic]
 * @param {string} [city]
 * @returns {Record<string, any>}
 */
function normalizePrefs(prefsOrCapacity = {}, situation, topic, city) {
  if (typeof prefsOrCapacity === 'string') {
    // Positional signature: (capacity, situation, topic, city)
    const values = topic && topic !== 'all' ? [topic] : [];
    let timeBucket = 'any';
    if (prefsOrCapacity === '2' || prefsOrCapacity === '5') timeBucket = '5';
    else if (prefsOrCapacity === '15') timeBucket = '15';
    else if (prefsOrCapacity === '45') timeBucket = '45';

    let mode = 'any';
    if (situation === 'couch') mode = 'home';
    else if (situation === 'walk') mode = 'local';
    else if (situation === 'transit') mode = 'online';

    return {
      values,
      timeBucket,
      mode,
      city: city || undefined,
      seed: `${situation || 'any'}:${prefsOrCapacity || 'any'}:0`
    };
  }

  return prefsOrCapacity && typeof prefsOrCapacity === 'object' ? prefsOrCapacity : {};
}

/**
 * Calculates the match score and reason badges for an action against user preferences.
 * @param {any} action
 * @param {any} prefsOrCapacity Options object or capacity string
 * @param {string} [situation]
 * @param {string} [topic]
 * @returns {{ score: number, reasons: string[] }}
 */
export function calculateMatchScore(action, prefsOrCapacity = {}, situation, topic) {
  if (!action) return { score: -999, reasons: [] };

  const prefs = normalizePrefs(prefsOrCapacity, situation, topic);

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

  let score = 0;
  /** @type {string[]} */
  const reasons = [];

  // 1. Shoda s vybranými oblastmi (striktní podpora vybraných témat)
  const actionValues = Array.isArray(action.values) ? action.values : [];
  const matchedValues = actionValues.filter((v) => selectedValues.includes(v));
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
    if (seedStr.startsWith('home:couch:')) {
      if (Number(action.timeMinutes) <= 2) {
        score += 45;
      } else {
        score -= 25;
      }
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

  return { score, reasons };
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
 * } | string} [prefsOrCapacity={}]
 * @param {string} [situation]
 * @param {string} [topic]
 * @param {string} [city]
 */
export function recommendActions(prefsOrCapacity = {}, situation, topic, city) {
  const prefs = normalizePrefs(prefsOrCapacity, situation, topic, city);

  const scored = MICRO_ACTIONS.map((action) => {
    const { score, reasons } = calculateMatchScore(action, prefs);

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
