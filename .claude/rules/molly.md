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
- Na `/svet` předává `$mollyDockBridge.atHome` kočku tůni; dock pak skrývá přepínače, které tam nedávají smysl.
- Molly nic nepočítá a nic nerozdává: žádné jídlo, počítadla, dárky ani odměny za počet skutků. Dock nese jen pohlazení, pelíšek a sledování myši. Pojistka je v `invariants.test.js`.
- Na skutek, přání v Krajině dobra a dokončené dechové zastavení reaguje poděkováním (`thankForDeed`): krátká šeptanda, srdíčka, předení. Jiskru z náhledu efektu chytá jako dřív.

## Šeptandy (bubliny)
- Bublina je vždy ukotvená těsně vedle Molly nebo nad jejíma ušima; nikdy odtržená uprostřed obrazovky. Strana ukotvení (`data-bubble-anchor`) se po dobu jedné šeptandy nemění, aby bublina neskákala.
- Bubliny žijí mimo tok dokumentu (`position: fixed`) a nezpůsobují layoutový posun.
- Když je Molly v pelíšku nebo u tůně, bublina si hledá místo bez překryvu nadpisů, kickerů a tlačítek.
- Poděkování za skutek se neukáže, pokud je vidět oslava přímo v kartě a bublina by se k Molly nevešla; krátce po něm se nespouští tip stránky ani dovedení k hlavnímu tlačítku.
- Průvodcovské šeptandy (tip stránky a dovedení k hlavnímu tlačítku) smí stránka podržet přes `holdMollyGuide()` a musí je zase uvolnit (`releaseMollyGuide()`); klid se pak počítá od uvolnění. Používá to vstupní prohlídka na `/`.

## Texty Molly
- Jeden klidný hlas „klidného útočiště“: vřelý, krátký, bez nátlaku, bez robotických pokynů.
- Správná čeština včetně pádů a množného čísla a bez rodově zabarvených tvarů.
- Testy se opírají o tyto řetězce, neměň je bez úpravy testů: `Půjdu s tebou`, `Zůstanu na svém klidném místě`, `V pelíšku`, `odpočívá v pelíšku`.
