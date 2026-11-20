---
paths:
  - "akcelerator-landing-page/src/routes/near/**"
  - "akcelerator-landing-page/src/routes/svet/**"
  - "akcelerator-landing-page/src/routes/app/**"
  - "akcelerator-landing-page/src/routes/submit/**"
  - "akcelerator-landing-page/src/lib/features/map/**"
  - "akcelerator-landing-page/src/lib/features/sanctuary/**"
---

# Podstránky

Ověření: `tests/e2e-requirements.spec.ts`, `tests/m4-regressions.spec.ts`, `tests/tier5-svet-stress.spec.ts`, `tests/tier5-mobile-stress.spec.ts`.

## Mapa `/near`
- Sekundární filtry jsou sbalené v `details.near-filters-drawer`. Na `1024×768` zůstává primární CTA první karty místa nad ohybem.
- `PlaceCard` nabízí kontakt na jedno ťuknutí (`tel:`, `mailto:`, Mapy.cz) a šablonu *„Co napsat“*. Popisek mise skládá `getPlaceActionHint(p)` + `p.quickMission`.
- Šablony zpráv odpovídají typu místa (`contactTemplates.js`; např. `isCatOnlyShelter` brání nabídce venčení u kočičího útulku).
- `markActionStarted` se volá až při skutečném kontaktu, zkopírování nebo navigaci, ne při rozbalení šablony.
- Souřadnice a texty v URL vždy přes `encodeURIComponent`.
- `initMap()` vyřeší počáteční výřez a aktivní místo dřív, než přidá dlaždice, a nepřepisuje `activePlaceId`.
- Detail místa: na desktopu `.leaflet-popup`, na mobilu a tabletu `.map-active-sheet` pod mapou.
- Leaflet se načítá dynamicky; před `map.remove()` volej `map.stop()`.

## Krajina dobra `/svet`
- Tiché útočiště: obraz české lesní tůně za svítání a v noci se shodnou kompozicí. Hladina podle `resolveSanctuaryZone()` musí lícovat s obrazem.
- Noční vrstva se připojuje líně, až po prvním přepnutí.
- Zvuk je ve výchozím stavu ztlumený.
- Počítadlo pamlsků je na stránce jediné (`.molly-sanctuary-pill`).
- `RitualBar` je `tablist`, `BreathingPacer` je `radiogroup`.

## Průvodce `/app/guided` a katalog `/app/online`
- `/app/guided`: `#personal-plan` je v DOM před filtry (WCAG 2.4.3). Stránka má jediný `aria-live="polite"` a žádnou otázku neklade dvakrát.
- `/app/online`: výchozí pohled *„Doporučené“* upřednostňuje skutky, které nejsou jen lokální. Každý skutek je samostatná bílá karta; na desktopu jsou CTA zarovnaná ke dnu karet.

## Formulář `/submit`
- Přepínač typu tipu je `tablist`; formulář má `method="post"`.
- Povinná pole používají nativní `required` + `aria-required="true"`, URL pole `type="url"`.
- Chyba ve volitelném poli uvnitř zavřeného `<details>` ho nejdřív rozbalí (`handleOptionalFieldInvalid`), jinak prohlížeč hlásí nezaostřitelný prvek.
