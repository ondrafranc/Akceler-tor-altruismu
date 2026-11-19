# Uživatelské cesty (User Journeys)

Hlavním vstupem do produktu je **`/`** (okamžitý 45-kartový balíček skutků), doplněný specializovanými plochami **`/near`**, **`/svet`**, **`/app/guided`**, **`/app/online`**, **`/submit`** a rozcestníkem **`/app`**.

---

## 1. Okamžitý mikro-skutek na `/` (15–60 s)
1. Uživatel otevře `/` — nad kartou nejsou žádné překážky; rovnou vidí kartu skutku v jednotné morphing scéně `.deed-stage`, primární CTA nad ohybem (včetně `375×667`) a 4 záložky energie (`45` *Mám 2 min* / `8` *Mám 15 min* / `16` *Osobně* / `9` *Dlouhodobě*).
2. Čerstvá návštěva otevírá 2minutový krok; při listování nebo přepnutí režimu se stav ukládá do `sessionStorage` (`AA_HOME_DECK_STATE_KEY`). Přímý odkaz `/?action=<id>` otevře cílový skutek i nad uzavřenou denní relací s tlačítkem *„Zpět k dnešnímu shrnutí“*.
3. Jedním kliknutím na hlavní CTA otevře stránku partnera.
4. Po návratu odemkne potvrzení *„Mám hotovo“*, scéna plynule přejde do dopadu (`payoff`), zobrazí se *„Přehrát“* a tlačítko *„Dát Molly pamlsek“*.

## 2. Pomoc v okolí na `/near` (30–90 s)
1. Uživatel otevře `/near` (z horní navigace, ze skoku podle města na `/` nebo z `/app`).
2. Použije geolokaci, vybere město nebo hledá v oblasti; sekundární filtry jsou sbalené v šuplíku *„Filtrovat“* (`details.near-filters-drawer`).
3. Vybere místo na mapě (na desktopu v `.leaflet-popup`, na mobilu v `.map-active-sheet` pod mapou), kde vidí upřímnou nápovědu mise (`getPlaceActionHint`), 1-tap `tel:`/`mailto:`/`Mapy.cz` i šablonu *„Co napsat“* přizpůsobenou typu místa (např. kočičím útulkům). Rozpracování se zapíše až při skutečném kontaktu, zkopírování či navigaci.

## 3. Výběr na míru přes `/app/guided` (60 s)
1. Uživatel otevře `/app/guided`.
2. Hned v čele dokumentu (`#personal-plan` před `.compass-foundations` dle WCAG 2.4.3) vidí aktuálně doporučený skutek s odůvodněním a může jej upravit volbou témat, času a nákladů bez duplicitních otázek.
3. Jedním kliknutím spustí vybraný krok nebo přejde na `/near`.

## 4. Katalog skutků `/app/online` (30–90 s)
1. Uživatel otevře `/app/online`, kde výchozí pohled *„Doporučené“* upřednostňuje online/telefonní akce (`mode !== 'local'`).
2. Filtruje skutky podle času, nákladů a způsobu zapojení.
3. Jedním kliknutím ze zarovnaného spodního CTA přejde přímo ke konkrétní akci.

## 5. Klidná reflexe v Krajině dobra `/svet`
1. Uživatel přejde na `/svet` (z navigace, upoutávky na `/` nebo předáním od kočky Molly).
2. Prohlédne si rozsvícené dobré skutky v krajině, může přepnout do noční atmosféry (líně načítaná noční vrstva), vyzkoušet dechový pacer, rituální lištu, nakrmit Molly v jediném počítadle nebo zapnout doprovodný zvuk (ve výchozím stavu vypnutý).

## 6. Přidání komunitního tipu přes `/submit`
1. Uživatel otevře `/submit` a přepne typ tipu (jednorázová akce vs. stálé místo pomoci) s dynamickým podtitulkem.
2. Vyplní název, kategorii, město/polohu (s automatickým geokódováním) a povinné kontaktní/URL pole (případné chyby ve sbalených volitelných detailech se před odesláním automaticky rozbalí).
3. Tip se odešle se stavem `pending` ke schválení moderátorem a na tomto zařízení se ihned propíše na mapu.

---

## Kritéria úspěchu každé cesty
- Uživatel se dostane ke konkrétnímu reálnému dobrému skutku pod 60 sekund bez registrace.
- Rozhraní zůstává klidné, přehledné a dostupné na desktopu i úzkém mobilu (`360×800`, `375×667`).
