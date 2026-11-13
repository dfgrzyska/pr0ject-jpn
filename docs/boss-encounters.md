# Interaktywne walki z bossami

Wdrożone warianty: Higuma 2A ze stałym paleniskiem i trzema szarżami, Tako jako hybryda (stara walka,
pale w zatoce jako bonus), Ja-odori 5C. Shisa i Sankibō wróciły do swoich poprzednich walk (warianty 1A i 4A
zostały wycofane); Kyūbi, Sakurajima i Oni pozostają bez zmian mechaniki.

| Walka | Akcja gracza | Nagroda / zabezpieczenie |
| --- | --- | --- |
| Higuma | Sprowokować trzy przejścia przez festiwalowe ognisko | Szarżę zapowiada szeroki pas na śniegu ze strzałkami i śladem pazurów; przejście przez ogień zostawia na rzeźbie żarzące się pęknięcia (`kuma_melt_1..3`), niedźwiedź płonie i paruje, pod ogniskiem trzy kryształki lodu zmieniają się w płomyki; skorupa przepuszcza 2% obrażeń, HP nie spada poniżej 75%, także od bomb; trzecie przejście odsłania Higumę |
| Tako | Nieobowiązkowo: stanąć przy jednym z trzech drewnianych pali cumowniczych, gdy macka się zamierza (`TAKO` w `osaka.js`) | Stara walka bez zmian (macki odcina się zwykłym ogniem); uderzenie celuje w gracza, a przy palu (24 px) trafia w pal i klinuje się na 4 s, biorąc 2,5× obrażeń; odcięta w tym stanie odsłania głowę na 4,5 s (120% obrażeń) i zmiata pociski |
| Ja-odori | Ostrzałem ładować odpowiednią wyrzutnię, przewidując trasę smoka | 1 s ładowania, 1,2 s odliczania, 0,75 s lotu; trafienie zabiera 18% życia i odsłania głowę na 3 s (strzały 70%, poza tym 6%); wyrzutnia po strzale odpoczywa 6 s, a wszystkie 2 s (`JAODORI` w `src/config.js`); czas ładowania nie zależy od obrażeń broni |

Zapowiedzi: czerwony — nadchodzący atak, złoty — obiekt mechaniki, miętowy — cel kontry
lub odsłonięty słaby punkt. Komunikaty mają wersję PL i EN. Mechaniki pracują w logicznych
jednostkach gry; rozdzielczość renderowania pozostaje 540 px. Własne obiekty mechanik
są rysowane w warstwie zapowiedzi, a stan jest przypisany do danej grupy bossa.

Implementacja: `src/game/enemies/encounters.js` (Higuma, Ja-odori), pale Tako w `osaka.js`, geometria torów w `encounterGeometry.js`.
Pliki miast zachowują tworzenie części, animacje i pozostałe zachowania. Kolizja strzałów
z wyrzutniami jest rozpatrywana przed trafieniami przeciwników. Czasy korzystają z `dt`
sceny, więc pauza i hit-stop zatrzymują również mechanikę.

## Walidacja

- `npm test` — testy jednostkowe, w tym geometria ciągłego przecięcia i tor zawracającego żaru.
- `npm run build` — build produkcyjny.
- `node tools/tests/boss-encounters.browser.mjs` — lokalny Vite i Chrome przez Playwright:
  trzy bossy (Higuma, Tako, Ja-odori) przy wysokości logicznej 320 i 420, laser/Oni oraz homing/Tsubame,
  prawdziwe wejście klawiatury/dotyku, celowe chybienia, pauza, trzy fazy, pokonanie
  normalnymi strzałami i mechaniką oraz przejście do wyników. Test zapisuje zrzuty w
  ignorowanym `tools/preview/` i sprawdza błędy konsoli.
- Dodatkowy przebieg: zmienne `BOSS_HEIGHT=320`, `BOSS_WEAPON=spread`,
  `BOSS_SHIP=kitsune`, `BOSS_RECOVERY=1` — rozrzut/Kitsune, śmierć, odrodzenie i bomba.
  `BOSS_CITY` opcjonalnie ogranicza przebieg do jednego miasta.

Harness korzysta z istniejącego lokalnego Playwright w `tools/preview/browser-runtime`
i Chrome (`CHROME_PATH` opcjonalnie wskazuje inny plik wykonywalny). God mode wyłącza
utratę żyć podczas sterowania botem, ale nie omija pancerza bossów. Test śmierci chwilowo
wyłącza tę ochronę. Te testy potwierdzają działanie i możliwość ukończenia mechanik;
ocena docelowego poziomu trudności wymaga również gry przez człowieka bez god mode.
