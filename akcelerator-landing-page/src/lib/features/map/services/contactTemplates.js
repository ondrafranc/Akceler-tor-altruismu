/**
 * Generátor šablon prvního kontaktu pro organizace na mapě.
 * Snižuje psychologickou bariéru a úzkost z prvního oslovení ("Co jim mám napsat?").
 */

import { sanitizeEmail } from '../../../validation.js';

/**
 * Vytvoří přirozenou, nezávaznou šablonu prvního kontaktu (e-mail / zpráva) pro místo na mapě.
 * @param {{ name?: string, kind?: string, email?: string }} place
 * @param {string} [userName]
 * @param {string} [userContact]
 * @returns {{ subject: string, body: string, mailtoUrl: string | null }}
 */
export function buildFirstContactTemplate(place, userName, userContact) {
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

  if (userName || userContact) {
    const signature = [userName, userContact ? `(${userContact})` : ''].filter(Boolean).join(' ');
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
