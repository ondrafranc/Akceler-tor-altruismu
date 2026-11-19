# Produktový koncept: Akcelerátor altruismu

## Hlavní severka produktu
**„Pomáhat pomáhat – a udělat pomáhání tak snadné jako masturbovat.“**

Aplikace převádí impuls k pomoci do skutečného dobrého skutku během několika sekund — s krásným prosvětleným rozhraním (*Daylight Editorial* + atmosféra svítání), nulovou registrací a bez jakéhokoli moralizování.

---

## Pro koho a s jakým cílem navrhujeme
- **Pro unavené, zahlcené nebo nejisté uživatele**, kteří chtějí udělat konkrétní dobrou věc hned teď, bez zdlouhavého hledání a bez pocitu, že „to nestačí“.
- **Cíl:** Okamžitě na první obrazovce nabídnout ověřený, zvládnutelný krok — a po jeho spuštění poskytnout jemnou vizuální odezvu a klidné uzavření bez tlaku na další výkon.

---

## Nepřekročitelné produktové principy
1. **Okamžitý vstup na `/`**: Nad hlavní kartou nestojí uvítací plakáty, kotevní scroll-tlačítka ani stěny filtrů. Karta i primární CTA jsou viditelné hned po načtení na desktopu i mobilu.
2. **Jedna dominantní akce na obrazovku**: Každé hlavní CTA nese konkrétní české akční sloveso a výsledek a reaguje okamžitě na první kliknutí (bez hold-to-confirm smyček).
3. **Nulový manipulativní šum**: Žádný e-shopový / FOMO sociální nátlak (zprávy typu „právě někdo…“). Sekundární metodologie a pomocné odkazy patří do rozbalovacího detailu `Jak to funguje`.
4. **Jednotná morphing scéna karty (`.deed-stage`)**: Karta drží jednu perzistentní scénu (`preview -> active -> payoff`) bez layoutového skoku — před spuštěním dýchající diorama očekávání, po kliknutí na partnera odemčení *„Mám hotovo“*, scéna dopadu, *„Přehrát“* a inline *„Dát Molly pamlsek“* s přirozenými českými popisky dopadu.
5. **Reálná česká ukotvení**: Skutečné české organizace, portály a interaktivní mapa míst pomoci po celé ČR (Leaflet s dlaždicemi OpenStreetMap, geokódování Nominatim přes `/api/geocode`, `81` kurátorovaných záložních míst v ČR + `18` komunitních položek + schválené komunitní tipy ze Supabase).
6. **Bezpečí a úcta k energii**: V patičce je vždy dostupný modál krizové pomoci (`tel:155`, `tel:112`, fokusová past a návrat fokusu); kočičí patronka Molly doprovází uživatele nevtíravě bez zakrývání obsahu.

---

## Klíčové plochy produktu (SvelteKit 2 + Svelte 5)
- **`/` (Hlavní balíček 45 skutků)** — Prosvětlené Hero svítání (`<picture>` WebP), 4 skutečně filtrující režimy energie (`45` *Mám 2 min* / `8` *Mám 15 min* / `16` *Osobně* / `9` *Dlouhodobě*) se `sessionStorage` stavem relace (čerstvá návštěva otevírá 2min krok), podporou deep-linků `/?action=<id>` i nad uzavřenou denní relací, rychlými portály, skokem do měst a upoutávkou na *Krajinu dobra*.
- **`/near` (Mapa pomoci v okolí)** — Živá mapa útulků, knihobudek, šatníků, potravinových bank a spolků v ČR se sbalenými sekundárními filtry (*„Filtrovat“*), upřímnou nápovědou mise a 1-tap `tel:`/`mailto:`/`Mapy.cz`, inteligentními šablonami zpráv (včetně rozlišení kočičích útulků bez „venčení“) a záznamem rozpracování až při reálném kontaktu.
- **`/app/guided` (Průvodce na míru)** — Výběr témat, času a nákladů během 60 sekund s doporučením konkrétního kroku (`#personal-plan` před filtry přímo v DOM podle WCAG 2.4.3).
- **`/app/online` (Katalog mikro-skutků)** — Filtrovatelný přehled všech ověřených skutků s prioritou online/telefonních kroků ve výchozím pohledu *„Doporučené“*.
- **`/svet` (Krajina dobra)** — Interaktivní plátno dobrých skutků s jezerem, dechovým pacerem, líně načítanou noční atmosférou, dechovými volbami a jednotným počítadlem pamlsků pro Molly.
- **`/submit` (Přidat místo nebo akci)** — Komunitní formulář s dynamickým podtitulkem, přístupnými záložkami typu tipu, nativní validací povinných polí i automatickým rozbalením volitelných polí při chybě a automatickým geokódováním.
- **`/app` (Rozcestník)** — Čtyřkartový přehled všech hlavních cest pomoci.
