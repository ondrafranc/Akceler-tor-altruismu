---
paths:
  - "akcelerator-landing-page/src/components/Molly*.svelte"
  - "akcelerator-landing-page/src/components/SmallWinCelebration.svelte"
  - "akcelerator-landing-page/src/lib/molly/**"
  - "akcelerator-landing-page/src/lib/mollyStore.js"
  - "akcelerator-landing-page/src/lib/mollyTypes.js"
  - "akcelerator-landing-page/src/lib/types/molly.ts"
  - "akcelerator-landing-page/tests/**/*molly*"
---

# Kočka Molly

Ověření: `tests/molly-stress.spec.ts`, `tests/mobile-tablet-polish.spec.ts`, `tests/desktop-polish.spec.ts`, unit `mollyStore.test.js`. `MollyCompanion.svelte` je největší a nejkřehčí soubor projektu; po každé změně pusť všechny tři specifikace.

## Chování
- Molly je viditelná a toulavá na desktopu, tabletu i mobilu, při `scrollY === 0` i během scrollu.
- **Nikdy nezakrývá obsah ani ovládací prvky.** Nadpisy, odstavce, CTA, scéna `.deed-stage`, čipy a kickery jsou tvrdé překážky. Prázdné vnější obaly karet jsou měkké, aby na úzké obrazovce neuvízla.
- Seznam překážek je selektor v `MollyCompanion.svelte`. Nový typ obsahu, přes který Molly leze, přidej tam.
- Měření překážek probíhá mimo `requestAnimationFrame`. Smyčka `tick()` neobsahuje žádné DOM dotazy.
- Souřadnice Molly zůstávají uvnitř šířky viewportu.
- O místě Molly a o auto-parku rozhoduje jen kočka sama, nikdy rozsvícená bublina. Bublina se přizpůsobí kočce, ne naopak.
- `.molly-companion-layer` nese `data-molly-settled`. Test, který měří klidový stav, čeká na `"true"` místo pevné prodlevy.
- Na `<= 1024 px` hledá místo nejdřív v přízemním pásmu obrazovky. Do pelíšku se sama uklidí (auto-park) jen když opravdu není volné místo. Na desktopu se auto-park nepoužívá.
- Při auto-parku ukazuje `MollyDock` pravdivý stav (`aria-pressed="true"`, popisek `V pelíšku`) a kliknutí ji probudí.
- Pohlazení je ťuknutí bez posunu; scrollovací tah pohlazením není. Pohlazení na ploše blokového odkazu nespustí navigaci.
- Na `/svet` předává `$mollyDockBridge.atHome` kočku tůni; dock pak skrývá duplicitní počítadlo a tlačítka.

## Šeptandy (bubliny)
- Bublina je vždy ukotvená těsně vedle Molly nebo nad jejíma ušima; nikdy odtržená uprostřed obrazovky. Strana ukotvení (`data-bubble-anchor`) se po dobu jedné šeptandy nemění, aby bublina neskákala.
- Bubliny žijí mimo tok dokumentu (`position: fixed`) a nezpůsobují layoutový posun.
- Když je Molly v pelíšku nebo u tůně, bublina si hledá místo bez překryvu nadpisů, kickerů a tlačítek.
- Duplicitní odměnová šeptanda se potlačí, pokud je vidět oslava přímo v kartě.
- Průvodcovské šeptandy (tip stránky a dovedení k hlavnímu tlačítku) smí stránka podržet přes `holdMollyGuide()` a musí je zase uvolnit (`releaseMollyGuide()`); klid se pak počítá od uvolnění. Používá to vstupní prohlídka na `/`.

## Texty Molly
- Jeden klidný hlas „klidného útočiště“: vřelý, krátký, bez nátlaku, bez robotických pokynů.
- Správná čeština včetně pádů a množného čísla (`nameAcc` u pamlsků, `pluralPamlsek`) a bez rodově zabarvených tvarů.
- Testy se opírají o tyto řetězce, neměň je bez úpravy testů: `Půjdu s tebou`, `Zůstanu na svém klidném místě`, `V pelíšku`, `odpočívá v pelíšku`.
- `LEGACY_MOLLY_ICON_MAP` v `MollyDock.svelte` překládá staré uložené emoji na jména ikon. Je to jediné povolené místo s emoji v kódu; nemaž ho a nic dalšího do něj nepřidávej.
