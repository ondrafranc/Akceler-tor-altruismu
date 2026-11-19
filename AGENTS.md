# Akcelerátor altruismu — Hlavní severka a pravidla produktu

## 1. Hlavní severka produktu (Nepřekročitelný zákon)
„Pomáhat pomáhat – a udělat pomáhání tak snadné jako masturbovat.“

Každá obrazovka, text i technické rozhodnutí slouží jedinému cíli: pomoc druhým musí být okamžitá, bezpracná a vizuálně přitažlivá — krásné stránky a přímá cesta od impulzu ke skutečnému dobrému skutku. Dílčí pravidla nejsou dogma: jakmile některé brání kráse nebo jednoduchosti, zpochybni ho a oprav.

Atmosféra a identita webu staví na pocitu **„klidného útočiště“** — návratu tam, kde člověku bylo (nebo bude) dobře, přirozeně ukotveného v české krajině a českém lese. Tím nenápadně a bez jakéhokoli patosu připomíná přirozenou českou sounáležitost a štědrost. Nepoužívej patetická hesla (např. *„Skutečné skutky v Česku“*) ani popisné slovo *„malovaná / malovaný“* v textacích.

## 2. Základní principy uživatelského zážitku
1. **Okamžitý, prosvětlený vstup bez překážek**:
   - Na mobilu ani desktopu nestojí nad hlavní kartou na `/` celoobrazovkové uvítací plakáty, kotevní scroll-tlačítka, morální kázání ani stěny filtrů. Tvrdé zamčení stránkování `100dvh` bez scrollu na malém mobilu (`360×800`, `375×667`) je trvale vyřazeno ve prospěch přirozeného scrollu s hlavní kartou a CTA vysoko u horního okraje.
2. **Jedna dominantní akce a nulový manipulativní šum**:
   - Každé primární CTA nese konkrétní české akční sloveso + výsledek a reaguje okamžitě na první kliknutí (žádný hold-to-confirm).
   - Žádný e-shopový či FOMO sociální nátlak (`.ambient-pulse-pill` a zprávy typu *„právě někdo…“* jsou zakázány).
   - Sekundární metadata (metodologie, důkazní třídy, detaily partnera, sdílení, hlášení chyby) patří dovnitř rozbalovacího detailu (`Jak to funguje`), nikoli na výchozí plochu karty.
3. **100 % SVG ikonografie a nulové nativní Unicode emoji**:
   - V UI, datech, mapových značkách, pravidlech i projektové dokumentaci nepoužívej žádné nativní Unicode emoji — veškeré ikony běží přes SVG registr `@lucide/svelte`.
4. **Čistá horní navigace a patronka Molly**:
   - Výhradně kompaktní horní navigace (spodní mobilní lišta `.mobile-bottom-nav` je zakázána). Kočka Molly doprovází uživatele nevtíravě bez zakrývání obsahu či ovládacích prvků.

## 3. Povinná synchronizace dokumentace na konci každého běhu
- **Povinná synchronizace dokumentace na konci každého běhu (Mandatory end-of-run documentation sync):** Na konci každého agentího běhu MUSÍ každý běh vždy zkontrolovat a aktualizovat veškerou relevantní/dotčenou projektovou dokumentaci (všechny `.md` soubory a pravidla v `.agents/` v repozitáři) tak, aby dokumentace před ukončením běhu ze 100 % odpovídala aktuálnímu stavu kódu, architektury, testů a platných pravidel.

## 4. Modulární pravidla (`.agents/rules/`)
Podrobná technická a vizuální pravidla jsou rozdělena bez duplicit do samostatných souborů:
- `.agents/rules/architecture-and-security.md` — doménové vrstvy, Svelte 5 Runes politika, Vite auto-loading ikon, povolené/zakázané fasády, čisté ESM canvas renderery, DB migrace a RLS, CSP nonces, secrets, Node 24 a spouštění E2E testů.
- `.agents/rules/ui-and-sensory.md` — vizuální styl *Daylight Editorial*, jednotná morphing scéna `.deed-stage` a `use:impactCanvas`, dotykové plochy a modály, persistence a izolace stavu, pravidla pro Molly, `/near`, `/svet`, `/app/guided`, `/app/online` a `/submit`.
