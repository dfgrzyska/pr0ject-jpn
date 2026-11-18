# Interaktywne walki z bossami

Wdrożone warianty: Higuma 2A ze stałym paleniskiem i trzema szarżami, Tako z odstrzeliwanymi mackami bez pali i zakleszczania, Ja-odori 5C. Shisa i Sankibō wróciły do swoich poprzednich walk (warianty 1A i 4A
zostały wycofane); Kyūbi, Sakurajima i Oni pozostają bez zmian mechaniki.

| Walka | Akcja gracza | Nagroda / zabezpieczenie |
| --- | --- | --- |
| Higuma | Sprowokować trzy przejścia przez festiwalowe ognisko | Szarżę zapowiada szeroki pas na śniegu ze strzałkami i śladem pazurów; przejście przez ogień zostawia na rzeźbie żarzące się pęknięcia (`kuma_melt_1..3`), niedźwiedź płonie i paruje, pod ogniskiem trzy kryształki lodu zmieniają się w płomyki; skorupa przepuszcza 2% obrażeń, HP nie spada poniżej 75%, także od bomb; trzecie przejście odsłania Higumę |
| Tako | Odstrzeliwać macki i unikać zapowiadanych uderzeń | Bez pali, zakleszczania i bonusu obrażeń; macki to główna broń: cykl seria uderzeń → pierścienie → seria uderzeń → takoyaki (seria: 4 pojedyncze w fazie 1, 3 krzyżujące się pary w fazie 2), a między seriami wolna macka co 2,6 s / 2 s sama smaga w gracza (`TAKO.slams`, `TAKO.lash`); zapowiedź uderzenia nadal 0,7 s; po odcięciu przednich macek odsłaniają się boczne, na końcu pozostaje głowa |
| Bunraku (miniboss Osaki) | Trafiać kuroko, który idzie za swoją lalką; gejszę obchodzić z boku | Lalki nietykalne (ranią przy zderzeniu); po kolei: szarża samuraja po czerwonej linii z chwilą postoju na końcu, taniec gejszy łukiem nad graczem (wachlarz zatrzymuje strzały, 20% wraca płatkiem), gabu z „GABU!” i wachlarzem z bliska po 0,5 s drżenia; zestrzelony kuroko = lalka spada; mniej kuroko = szybsze tempo (`BUNRAKU`) |
| Ja-odori | Ostrzałem ładować odpowiednią wyrzutnię, przewidując trasę smoka | 1 s ładowania, 1,2 s odliczania, 0,75 s lotu; trafienie zabiera 18% życia i odsłania głowę na 3 s (strzały 70%, poza tym 6%); wyrzutnia po strzale odpoczywa 6 s, a wszystkie 2 s (`JAODORI` w `src/config.js`); czas ładowania nie zależy od obrażeń broni |
| Kurogane (boss Tokio) | Trafiać pięść, gdy wbita w płytę i ściągana na łańcuchu (miętowa); zestrzelić cztery drony-lampiony; strzelać w reaktor, gdy paruje | Faza 1: pancerz przepuszcza 20%, pięść przyjmuje trafienia ×3,5 i po 150 obrażeniach odpada z ręką; bez obu rąk (albo poniżej 60% życia) przemiana 1,5 s bez obrażeń. Faza 2: pancerz 40%; wszystkie drony w dół = 3 s ogłuszenia, strzały w kolumnie piersi ×2,2. Faza 3: pancerz 20%, po każdym dużym ataku reaktor otwarty 2,2 s (×1,6). Pociski naprowadzane same wybierają to, co odsłonięte (`KURO` w `tokyo-kurogane.js`) |
| Daidarabotchi (boss Kawaguchiko) | Trafiać dłoń, gdy nabiera wody z jeziora (miętowa); przestrzelić oba złote sznury kosza, gdy wisi na końcu drąga z boku; strzelać w szczelinę w piersi, gdy świeci | Pancerz z ziemi przepuszcza 55%. Faza 1: dłoń w jeziorze ×2. Faza 2: każdy sznur ma 40 obrażeń, kosz spada olbrzymowi na stopę = 3,6 s ogłuszenia i strzały w kolumnie szczeliny ×2,6; kosz wraca zawiązany. Faza 3: po każdym uderzeniu w wodę szczelina otwarta 2,4 s (×2,2). Progi faz 68% i 38%; przed początkiem fazy życie nie spada poniżej jej progu, także od bomb. Olbrzym stoi po pas w jeziorze przed panoramą Fuji (talia na linii wody widoku); to, co pod wodą, jest poza zasięgiem. Pociski naprowadzane same wybierają to, co odsłonięte (`DAIDARA` w `kawaguchiko-daidara.js`) |
| Funa-yūrei (boss Onomichi) | Przestrzeliwać złote obręcze czerpaków (czerpak traci dno); zestrzelić złotą kulę fajerwerku nad okrętem; strzelać w latarnię na dziobie, gdy miętowa | Kadłub przepuszcza 40%, latarnia odsłonięta ×3 (ogłuszony ×3,2). Faza 1: osiem rąk wzdłuż burt, czerpak ma 12 obrażeń, 60% trafienia w czerpak przechodzi na okręt; gdy cała burta ma dziurawe czerpaki, latarnia odsłonięta 3,6 s, potem ręce wracają z nowymi. Faza 2: co 4,6 s złota kula leci nad okrętem 4,4 s (3 obrażenia), zestrzelona ogłusza go na 3,8 s. Faza 3: po każdym obrocie w wirze okręt staje bokiem (dziób w prawo w dół) i latarnia jest odsłonięta 2,8 s; rzędy rąk z wody zapowiadają kręgi na zapowiedzianej linii. Progi faz 66% i 33%; przed początkiem fazy życie nie spada poniżej jej progu, także od bomb. Okręt czeka, aż miasto dojedzie do końca, i wynurza się z cieśniny; pociski naprowadzane same wybierają to, co odsłonięte (`FUNA` w `onomichi-funayurei.js`) |

Zapowiedzi: czerwony — nadchodzący atak, złoty — obiekt mechaniki, miętowy — cel kontry
lub odsłonięty słaby punkt. Komunikaty mają wersję PL i EN. Mechaniki pracują w logicznych
jednostkach gry; rozdzielczość renderowania pozostaje 540 px. Własne obiekty mechanik
są rysowane w warstwie zapowiedzi, a stan jest przypisany do danej grupy bossa.

Implementacja: `src/game/enemies/encounters.js` (Higuma, Ja-odori), macki Tako w `osaka.js`, Kurogane w `tokyo-kurogane.js`, Daidarabotchi w `kawaguchiko-daidara.js`, Funa-yūrei w `onomichi-funayurei.js`, geometria torów w `encounterGeometry.js`.
Pliki miast zachowują tworzenie części, animacje i pozostałe zachowania. Kolizja strzałów
z wyrzutniami jest rozpatrywana przed trafieniami przeciwników. Czasy korzystają z `dt`
sceny, więc pauza i hit-stop zatrzymują również mechanikę.

## Walidacja

- `npm test` — testy jednostkowe, w tym geometria ciągłego przecięcia i tor zawracającego żaru.
- `npm run build` — build produkcyjny.
- `node tools/tests/boss-encounters.browser.mjs` — lokalny Vite i Chrome przez Playwright:
  pięć bossów (Higuma, Tako, Ja-odori, Kurogane, Daidarabotchi) przy wysokości logicznej 320 i 420, laser/Oni oraz homing/Tsubame,
  prawdziwe wejście klawiatury/dotyku, celowe chybienia, pauza, trzy fazy, pokonanie
  normalnymi strzałami i mechaniką oraz przejście do wyników. Test zapisuje zrzuty w
  ignorowanym `tools/preview/` i sprawdza błędy konsoli.
- Dodatkowy przebieg: zmienne `BOSS_HEIGHT=320`, `BOSS_WEAPON=spread`,
  `BOSS_SHIP=kitsune`, `BOSS_RECOVERY=1` — rozrzut/Kitsune, śmierć, odrodzenie i bomba.
  `BOSS_CITY` opcjonalnie ogranicza przebieg do jednego miasta.

Harness korzysta z przypiętego Playwright i jego Chromium (`CHROME_PATH` opcjonalnie wskazuje własny Chrome). God mode wyłącza
utratę żyć podczas sterowania botem, ale nie omija pancerza bossów. Test śmierci chwilowo
wyłącza tę ochronę. Te testy potwierdzają działanie i możliwość ukończenia mechanik;
ocena docelowego poziomu trudności wymaga również gry przez człowieka bez god mode.

W trzeciej fazie Higumy pozostają sople, ale wiatr nie przesuwa statku ani pocisków.
