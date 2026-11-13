# Interaktywne walki z bossami

Wdrożone warianty: Shisa 1A, Higuma 2A ze stałym paleniskiem i trzema szarżami,
Tako 3A, Sankibō 4A, Ja-odori 5C. Kyūbi, Sakurajima i Oni pozostają bez zmian mechaniki.

| Walka | Akcja gracza | Nagroda / zabezpieczenie |
| --- | --- | --- |
| Shisa | Ustawić drugi posąg na linii ryku, po zablokowaniu kierunku odlecieć | 4,5 s odsłonięcia obu; ocalały nadal może zostać trafiony przez widmo partnera |
| Higuma | Sprowokować trzy przejścia przez stałe palenisko | Trwałe pęknięcia i licznik 0–3; skorupa przepuszcza 2% obrażeń, HP nie spada poniżej 75%, także od bomb; trzecie przejście odsłania Higumę |
| Tako | Zwabić koniec macki na jeden ze złotych pali i ostrzelać zaklinowany koniec | Mocno zwiększone obrażenia macki, odcięcie odsłania głowę na 4,5 s; głowa nie ginie przed ostatnią fazą |
| Sankibō | Naprowadzić żar na oznaczone miejsce w pasie wiatru, który zawróci go do pieczęci | 4,5 s odsłonięcia; pochodnie są trwałe, więc źródło żaru nie znika; od drugiej fazy zmienia się kierunek |
| Ja-odori | Ostrzałem ładować odpowiednią wyrzutnię, przewidując trasę smoka | 1 s ładowania, 1,2 s odliczania, 0,75 s lotu; trafienie zabiera 18% życia i odsłania głowę na 3 s (strzały 70%, poza tym 6%); wyrzutnia po strzale odpoczywa 6 s, a wszystkie 2 s (`JAODORI` w `src/config.js`); czas ładowania nie zależy od obrażeń broni |

Zapowiedzi: czerwony — nadchodzący atak, złoty — obiekt mechaniki, miętowy — cel kontry
lub odsłonięty słaby punkt. Komunikaty mają wersję PL i EN. Mechaniki pracują w logicznych
jednostkach gry; rozdzielczość renderowania pozostaje 540 px. Własne obiekty mechanik
są rysowane w warstwie zapowiedzi, a stan jest przypisany do danej grupy bossa.

Implementacja: `src/game/enemies/encounters.js`, geometria torów w `encounterGeometry.js`.
Pliki miast zachowują tworzenie części, animacje i pozostałe zachowania. Kolizja strzałów
z wyrzutniami jest rozpatrywana przed trafieniami przeciwników. Czasy korzystają z `dt`
sceny, więc pauza i hit-stop zatrzymują również mechanikę.

## Walidacja

- `npm test` — testy jednostkowe, w tym geometria ciągłego przecięcia i tor zawracającego żaru.
- `npm run build` — build produkcyjny.
- `node tools/tests/boss-encounters.browser.mjs` — lokalny Vite i Chrome przez Playwright:
  pięć bossów przy wysokości logicznej 320 i 420, laser/Oni oraz homing/Tsubame,
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
