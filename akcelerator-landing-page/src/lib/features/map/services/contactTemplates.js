/**
 * Generátor šablon prvního kontaktu pro organizace na mapě.
 * Snižuje psychologickou bariéru a úzkost z prvního oslovení ("Co jim mám napsat?").
 */

import { sanitizeEmail } from '../../../validation.js';

/**
 * Určí, zda jde o samoobslužné bezobslužné místo (knihobudka, sdílená lednice, reuse skříňka).
 * @param {Record<string, unknown> | null | undefined} place
 * @returns {boolean}
 */
export function isSelfServicePoint(place) {
  const text = `${String(place?.name || '')} ${String(place?.subcategory || '')}`.toLowerCase();
  return (
    /knihobudka|knihovnička|public_bookcase|give_box|reuse skříňka|freeshop|sdílená lednice|food_sharing|potravinová skříňka/.test(
      text
    ) ||
    (place?.visitMode === 'drop_in' && !place?.website && !place?.email && !place?.phone)
  );
}

const CAT_SHELTER_RE =
  /(?:^|[^\p{L}\p{N}])(?:koč(?:k\p{L}*|c\p{L}*|ek(?=$|[^\p{L}\p{N}])|ič\p{L}*|ic\p{L}*)|koc(?:k\p{L}*|c\p{L}*|ek(?=$|[^\p{L}\p{N}])|ic\p{L}*|our\p{L}*|ouř\p{L}*)|koť\p{L}*|kot(?:ě\p{L}*|at\p{L}*|át\p{L}*|e(?=$|[^\p{L}\p{N}])))(?=$|[^\p{L}\p{N}])/iu;

const DOG_SHELTER_RE =
  /(?:^|[^\p{L}\p{N}])(?:p(?:es|sa|sovi|su|sem|si|sů|sům|sum|sech|sy)(?=$|[^\p{L}\p{N}])|psí\p{L}*|pejs(?:ek(?=$|[^\p{L}\p{N}])|[kc]\p{L}*)|štěň\p{L}*|štěn(?:ě\p{L}*|at\p{L}*|át\p{L}*)|sten(?:e(?=$|[^\p{L}\p{N}])|at\p{L}*|át\p{L}*)|fen(?:a|y|ě|e|u|ou|ám|ách|ami|k\p{L}*|c\p{L}*|ek)?(?=$|[^\p{L}\p{N}]))/iu;

/**
 * Určí, zda jde o útulek či depozitum zaměřené výhradně na kočky (bez psů).
 * @param {{ name?: unknown, subcategory?: unknown, description?: unknown } | null | undefined} place
 * @returns {boolean}
 */
function isCatOnlyShelter(place) {
  const text = `${String(place?.name || '')} ${String(place?.subcategory || '')} ${String(place?.description || '')}`;
  return CAT_SHELTER_RE.test(text) && !DOG_SHELTER_RE.test(text);
}

/**
 * Vrátí konkrétní akční nápovědu pro místo pomoci (sdílenou mezi kartou, popupem na mapě i spodním panelem).
 * @param {Record<string, unknown> | null | undefined} place
 * @returns {string}
 */
export function getPlaceActionHint(place) {
  if (place?.quickMission) return String(place.quickMission);
  const sub = String(place?.subcategory || '').toLowerCase();
  if (sub.includes('knihobudka') || isSelfServicePoint(place)) {
    const labelText = `${String(place?.name || '')} ${String(place?.subcategory || '')}`;
    if (/knihobudka|knihovnička|kni/i.test(labelText)) {
      return 'Přines 1–2 přečtené knížky v dobrém stavu nebo si vyber novou četbu (bez domlouvání).';
    }
    return 'Vlož trvanlivé potraviny či zachovalé oblečení pro lidi v nouzi (bez domlouvání).';
  }
  if (place?.kind === 'animals') {
    if (isCatOnlyShelter(place)) {
      return 'Zavolej nebo napiš a zeptej se na konzervy, stelivo, deky či výpomoc v depozitu.';
    }
    return 'Zavolej nebo napiš a zeptej se na venčení, staré deky nebo kvalitní krmivo a konzervy.';
  }
  if (place?.kind === 'food' || sub.includes('šatník')) {
    return 'Přines trvanlivé potraviny, drogerii nebo čisté sezónní oblečení, případně nabídni pomoc při třídění.';
  }
  if (place?.kind === 'community') {
    return 'Stav se na sousedskou akci, nabídni drobnou výpomoc nebo přines věci do komunitního oběhu.';
  }
  return 'Napiš krátkou zprávu nebo zavolej koordinátorovi — ozvou se ti s konkrétní potřebou.';
}

/**
 * Vytvoří přirozenou, nezávaznou šablonu prvního kontaktu (e-mail / zpráva) pro místo na mapě.
 * @param {{ name?: string, kind?: string, subcategory?: string | null, description?: string | null, email?: string | null } | null | undefined} place
 * @param {string} [userName]
 * @param {string} [userContact]
 * @returns {{ subject: string, body: string, mailtoUrl: string | null }}
 */
export function buildFirstContactTemplate(place, userName, userContact) {
  const name = (place?.name || '').trim() || 'vaše organizace';
  const kind = place?.kind || 'ngo';

  let subject = 'Dotaz na možnost drobné výpomoci';
  let body = '';

  if (kind === 'animals') {
    subject = `Dotaz na možnost pomoci – ${name}`;
    const examples = isCatOnlyShelter(place)
      ? '(např. materiální dar – konzervy, stelivo, deky – nebo jednorázovou výpomoc v depozitu)'
      : '(např. venčení, materiální dar nebo jednorázovou ruku k dílu)';
    body = `Dobrý den,\n\nozývám se ohledně vašeho působení (${name}) a chci se zeptat, jestli teď nepotřebujete drobnou výpomoc ${examples}.\n\nDejte mi prosím vědět, co by se vám teď nejvíc hodilo.\nDěkuji a přeji hezký den!`;
  } else if (kind === 'food') {
    subject = `Dotaz: Co se vám teď nejvíc hodí? (${name})`;
    body = `Dobrý den,\n\nchci podpořit vaši činnost (${name}) – můžete mi prosím krátce napsat, jaké potraviny nebo věci teď nejvíc potřebujete, případně jestli hledáte dobrovolníky na výpomoc?\n\nMoc děkuji a přeji klidný den!`;
  } else if (kind === 'community') {
    subject = `Možnost zapojení / drobné výpomoci – ${name}`;
    body = `Dobrý den,\n\nbydlím v okolí a chci se zeptat, jestli u vás (${name}) aktuálně nehledáte dobrovolníky na jednorázovou nebo občasnou výpomoc.\n\nPokud ano, dejte mi prosím vědět, čím můžu začít.\nDěkuji a zdravím!`;
  } else {
    subject = `Dotaz na dobrovolnictví / pomoc – ${name}`;
    body = `Dobrý den,\n\nzaujala mě vaše činnost (${name}) a chci se zeptat, jak se u vás dá nejjednodušeji zapojit nebo s čím teď nejvíc potřebujete pomoci.\n\nPředem děkuji za krátkou zprávu a přeji hezký den!`;
  }

  const cleanUserName = String(userName || '').trim();
  const cleanUserContact = String(userContact || '').trim();
  if (cleanUserName || cleanUserContact) {
    const signature = [cleanUserName, cleanUserContact ? `(${cleanUserContact})` : '']
      .filter(Boolean)
      .join(' ');
    body += `\n\nS pozdravem,\n${signature}`;
  }

  const safeMail = sanitizeEmail(place?.email);
  const mailtoUrl = safeMail
    ? `mailto:${safeMail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    : null;

  return {
    subject,
    body,
    mailtoUrl
  };
}
