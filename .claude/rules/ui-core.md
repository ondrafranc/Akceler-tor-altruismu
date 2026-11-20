---
paths:
  - "akcelerator-landing-page/src/**/*.svelte"
  - "akcelerator-landing-page/src/styles/**"
  - "akcelerator-landing-page/src/app.html"
  - "akcelerator-landing-page/static/**/*.html"
---

# UI: styl Daylight Editorial a přístupnost

Vizuální směr je daný. Konkrétní hodnoty (barvy, rozměry, breakpointy) jsou v `src/styles/czech-theme.css` a v komponentách; ověřují je `tests/desktop-polish.spec.ts`, `tests/mobile-tablet-polish.spec.ts` a `tests/ui-rebuild-acceptance.spec.ts`. Sem hodnoty neopisuj.

## Styl
- Paleta *česká krajina – český les*: teplý papírový podklad, bílé karty s jemným lesním rámečkem, tmavě zelený inkoust, lesní zelená pro primární CTA. Tmavá je jen scéna hero a `.deed-stage`.
- Barvy ber z tokenů v `czech-theme.css` (`--border-forest*`, `--bohemian-*`, `--ink-muted`, `--forest-brook-*`, `--moss-olive-*`, `--rowan-*`, `--accent-warm-ink`). Nový odstín znamená nový token, ne hex v komponentě.
- Žádné duhové, elektrické ani neonové barvy. Výchozí modrá odkazů je resetovaná (`:where(a) { color: inherit; }`).
- Teplý text a kickery používají `--accent-warm-ink`; `--accent-warm` je jen dekorace (nemá kontrast pro text).
- Písma: `Plus Jakarta Sans` pro text, `Instrument Serif` pro kurzívní akcenty.
- Chybové stavy používají tóny `--rowan-*`.

## Přístupnost (tvrdé minimum)
- Kontrast textu aspoň `4,5:1`; text na tmavých scénách aspoň `7:1`.
- Každý interaktivní prvek má plochu aspoň `44×44 px`, včetně odkazů v patičce a mapových pinů (ty mají `aria-label` i `title`).
- `input`, `textarea` a `select` mají do šířky `1024 px` písmo aspoň `16 px` (jinak iOS přibližuje).
- Přepínače nesou `aria-pressed`, záložky `role="tab"` + `aria-selected`, volby typu radio `role="radio"` + `aria-checked`.
- Hierarchie nadpisů nepřeskakuje úrovně; pořadí v DOM odpovídá vizuálnímu pořadí.
- Modály (`ImmediateHelp`, `FeedbackModal`): `aria-modal="true"`, fokus po otevření dovnitř, past na `Tab`, zavření přes `Escape`, návrat fokusu na viditelný prvek (nikdy na `BODY`).
- Viditelný text tlačítka je obsažen v jeho `aria-label` (WCAG 2.5.3).
- Animace respektují `prefers-reduced-motion`. Nic nezpůsobuje layoutový posun (`CLS = 0`).

## Rozvržení a navigace
- `.nav-capsule`, `.hero-inner` a `.content-wrap` sdílejí na desktopu stejnou maximální šířku.
- Mobil a tablet mají kompaktní horní hlavičku (značka, `MollyDock`, tlačítko šuplíku `#mobile-top-nav-drawer`). Po odscrollování je hlavička plně krycí, aby pod ní neprosvítal obsah.
- Krizová pomoc (`.crisis-widget`) sedí staticky v patičce a nabízí `tel:155` a `tel:112`. Žádné plovoucí krizové ani feedback tlačítko.
- Patička obsahuje jediný odkaz na `/submit`.

## Texty
- Klidná, přirozená čeština bez patosu, úředního tónu a nátlaku. CTA je sloveso + výsledek.
- Důkazní úrovně se jmenují *Přímý měřitelný účinek*, *Doložený přínos*, *Komunitní smysl*.
- Vodní plocha na `/svet` je *lesní tůň*, ne jezero.
- Vyřazené výrazy hlídá `invariants.test.js`; nový zákaz přidej tam.
