# Plan: etap 9, TOKIO

Stan: **w budowie**. Fazy 0–6 gotowe; decyzje z sekcji 2 przyjęte według rekomendacji (do potwierdzenia przez autora). Postęp odznacza się checkboxami w sekcji 8.

## 1. W skrócie

- Najdłuższy etap gry: około 7 minut zamiast niecałych 4. Tło ma 14 kafli zamiast 8 (12 544 px zamiast 7 168).
- Lot po spirali zgodnej z mapą miasta: z zachodu (Nakano) przez centrum na wschód (Asakusa), potem rzeką Sumida do zatoki i na Odaibę.
- Pora dnia płynie razem z trasą: złote popołudnie w Shinjuku, deszcz o zmierzchu w Shibui, noc pełna świateł w Akihabarze, latarnie w Asakusie, nocna zatoka w finale.
- Dwóch minibossów i boss, każdy z trzema fazami: **Kasa-obake** (parasol-zjawa na skrzyżowaniu w Shibui), **Taiyaki** (ławica rybek z ciasta w Asakusie), **Kurogane** (mech w terminalu kontenerowym na Odaibie).
- Poziom detalu jak w poprzednich miastach. Finał dostaje dodatki ponad normę, ale nie kosztem innych dzielnic.

## 2. Decyzje do podjęcia przed startem

| # | Pytanie | Moja rekomendacja |
|---|---|---|
| D1 | Kierunek trasy | **Nakano → Odaiba** (opis niżej). Dzięki temu Akihabara i Asakusa wypadają w nocy, a mech w nocnej zatoce. Odwrotny kierunek (start w Asakusie) daje Akihabarę za dnia, czyli słabsze światła. |
| D2 | Drugi miniboss | **Kasa-obake**, parasol-zjawa z folkloru, na skrzyżowaniu w deszczu. Hachikō zostaje przyjaznym odkryciem, nie celem. |
| D3 | Miejsce Tokio w podróży | Dziewiąte miasto, zawsze **ostatnie** w kolejności (pozostałe osiem dalej losowo). Wymaga zmian w książeczce pieczątek i zakończeniu (faza 13). |
| D4 | Długość | Około 440 s zegara etapu plus czas obu walk na arenach. Miniboss 1 w 104 s, miniboss 2 w 295 s, boss w 400 s. |
| D5 | Wygląd mecha | Własny projekt w stylu zbroi samuraja (sekcja 6.3), bez podobieństw do znanych serii. |

## 3. Zasady, które obowiązują obie zmiany roboczą

1. **Licencje.** Żadnych logotypów, nazw sklepów, sieci, postaci z anime i gier. Budynki rysujemy z kształtu, szyldy mają wymyślone napisy albo same kształty. Na trasie celowo **nie ma**: głowy potwora na kinie w Shinjuku, posągu robota na Odaibie, maskotek sieci handlowych, numeru na wieżowcu mody w Shibui. Nazwy miejsc w pasku lokalizacji są nazwami geograficznymi, jak w poprzednich etapach.
2. **Topologia.** Drogi, tory, mosty i rzeki muszą dokądś prowadzić i zgadzać się na łączeniach kafli. Dlatego najpierw powstaje szkielet całej trasy (faza 1), dopiero potem dzielnice.
3. **Nic na ziemi się nie przesuwa względem mapy.** Ruszają się tylko rzeczy, które latają, jadą po swoim torze albo są animacją w miejscu (neony, ekrany, tłum na pasach).
4. **Detal bez wypełniaczy.** Każdy kwartał ma własne obiekty. Powtarzalne dachy tylko jako tło dla charakterystycznych miejsc.
5. **Jedna faza = jeden zamknięty kawałek.** Faza kończy się zielonymi testami, wpisem w dzienniku (sekcja 9) i commitem. Nie zaczyna się fazy, której poprzedniczki z kolumny „Wymaga” nie są odhaczone.
6. **Pliki nie nachodzą na siebie.** Każda dzielnica tła ma swój plik w `tools/art/tokyo/`, każdy boss swój plik w `src/game/enemies/`. Wspólne pliki (`stage9.json`, `Enemies.js`, `gen-art.mjs`) zmienia się tylko w zakresie opisanym w fazie.
7. **Teksty.** Każdy nowy napis ma wersję PL i EN (`src/i18n.js`), nazwy mieszczą się w czcionce gry (bez makronów w pasku lokalizacji).

## 4. Trasa

Współrzędna `u` liczona od dołu taśmy, jak w `src/data/landmarks.js`. Czas przy przewijaniu 30 px/s. Granice dzielnic ustaliła faza 1: obowiązują te z `tools/art/tokyo/route.mjs` (`DISTRICTS`), tabela niżej pokazuje je z dokładnością do kilkudziesięciu pikseli.

| u | Czas | Dzielnica | Pora | Co widać |
|---|---|---|---|---|
| 0–700 | 0–23 s | **NAKANO** | popołudnie | Szklany dach pasażu Sun Mall, bryła Nakano Broadway z mieszkaniami na dachu, stare sklepiki: gabloty z figurkami bez twarzy znanych postaci, zegarki, blaszane zabawki, automaty z kapsułkami, szyldy malowane ręcznie |
| 700–2100 | 23–70 s | **SHINJUKU** | złota godzina | Wieżowce zachodniej strony z bliźniaczą wieżą ratusza; dworzec z wiązką torów; domy towarowe z markizami, wystawami i tarasami na dachach; brama neonów Kabukichō; wąskie zaułki barów Golden Gai i Omoide Yokochō z dymem z rusztów; ogród Shinjuku Gyoen ze szklarnią i herbaciarnią |
| 2100–2900 | 70–97 s | **HARAJUKU** | późne popołudnie | Las Meiji Jingū z wielką drewnianą torii i beczkami sake; uliczka Takeshita (naleśniki, wata cukrowa, kolorowe markizy); aleja Omotesandō pod zelkowami; wiszący dach hali Yoyogi |
| 2900–3900 | 97–130 s | **SHIBUYA** | zmierzch, deszcz | Dworzec, plac z pieskiem Hachikō, posąg Moyai, **skrzyżowanie** (arena minibossa 1, u ≈ 3350), ściany ekranów z własnymi animacjami, Center-gai, park na dachu nad torami |
| 3900–4900 | 130–163 s | **MINATO** | niebieska godzina | Wzgórza Roppongi, **Tokyo Tower** (kratownica, podświetlenie zapala się w locie), świątynia Zōjō-ji z rzędami figurek Jizō w czerwonych czapeczkach i wiatraczkami |
| 4900–6100 | 163–203 s | **CHIYODA** | wieczór | Gmach parlamentu; **Pałac Cesarski**: fosy z łabędziami, kamienne mury, most Nijūbashi, wieżyczki yagura, ogrody wschodnie, wiśnie Chidorigafuchi z łódkami; ceglany dworzec Tokio z kopułami i plac Marunouchi |
| 6100–7200 | 203–240 s | **AKIHABARA** | noc | Rzeka Kanda i ceglane arkady Manseibashi; Miasto Elektryczne: piętrowe neony, ekrany z animacją pikselową, salony gier z rzędami automatów, hale z kapsułkami, sklepy z częściami (szpule kabli, lampy, anteny), dziewczyny z ulotkami pod kawiarniami, automaty z napojami. Najwięcej animacji i świateł w całym etapie |
| 7200–8100 | 240–270 s | **UENO** | noc | Targ Ameyoko pod wiaduktem (ryby, owoce, okrzyki); park: staw Shinobazu z lotosami i świątynką na wyspie, muzeum, zoo z pandami, latarnie |
| 8100–9500 | 270–317 s | **ASAKUSA** | noc, latarnie | Kappabashi (sklepy z woskowym jedzeniem, wielkie filiżanki na dachu); **Kaminarimon** z wielkim lampionem; **uliczka Nakamise** ze straganami; brama Hōzōmon z olbrzymimi sandałami; pagoda; **Sensō-ji** z kadzielnicą (arena minibossa 2, u ≈ 9100); stare wesołe miasteczko Hanayashiki |
| 9500–10700 | 317–357 s | **SUMIDA-GAWA** | noc | Most Azuma, wysoka wieża nadawcza po drugiej stronie rzeki, łodzie yakatabune z lampionami, hala sumo w Ryōgoku, mosty Kiyosu i Eitai, targ rybny, ogród Hama-rikyū z herbaciarnią na stawie |
| 10700–11500 | 357–383 s | **TOKYO-WAN** | noc | **Rainbow Bridge** podświetlony, wysepki dawnych fortów Daiba, promy i barki |
| 11500–12544 | 383–440 s | **ODAIBA** | noc | Plaża z repliką **Statuy Wolności**; estakada automatycznej kolejki z jadącym składem; muzeum w kształcie statku i muzeum nauki z wielkim globusem; budynek telewizji z kulą (bez logo); terminal kontenerowy z suwnicami (arena bossa, u ≈ 12 300) |

### Szkielet trasy (faza 1)

Cała trasa jest zapisana jako dane w `tools/art/tokyo/route.mjs`. Każdy, kto rysuje dzielnicę, bierze wymiary stamtąd i niczego nie przesuwa na oko.

- **`ROADS`**: ulice z klasą (aleja, ulica, zaułek, deptak, pasaż pod dachem, pomost, estakada) i szerokością. Kręgosłupy trasy: Ōme-kaidō (Nakano i Shinjuku), Meiji-dōri (Shinjuku, Harajuku, Shibuya), Roppongi-dōri pod estakadą, Chūō-dōri (Akihabara, Ueno), Nakamise, a od Asakusy rzeka.
- **`RAILS`**: tory. Linia Chūō w Nakano, wiązka torów dworca Shinjuku, Yamanote przez Harajuku i Shibuyę, wiązka dworca Tokio, Yamanote przez Akihabarę do Ueno, linia Sōbu, most kolejowy w Ryōgoku, kolejka na Odaibie, szyny suwnic.
- **`WATER`**: rzeki i zatoka wycięte do dalekiej warstwy, fosy i stawy malowane.
- **`GROUNDS`**: parki, las Meiji, dziedzińce, place, plaża, płyta terminalu.
- **`PLOTS`**: 110 działek pod budynki i obiekty, każda z opisem, co ma na niej stanąć. Do czasu narysowania są zakreskowane.
- **`ARENAS`**: trzy areny. Skrzyżowanie w Shibui ma własny kwadrat asfaltu 68 × 68 px, budynki stoją dookoła.
- **`TOD`**: pora dnia wzdłuż trasy.

Zasady pracy na szkielecie:

- Dzielnica rysuje swoje budynki **na działkach** i wypełnia **kwartały między ulicami**. Ulic, torów i wody nie przesuwa. Jeśli działka jest za mała albo źle leży, zmienia się ją w `route.mjs`, a nie omija w rysunku.
- Malarze dzielnic wpinają się przez listę `PAINTERS` w `tools/art/tokyo/mid.mjs` i dostają gotowy kontekst (płótno, maskę wody, pomocnicze funkcje rysowania). Rysują przed nałożeniem pory dnia; światła nocne dojdą osobnym krokiem po niej, gdy pierwsza dzielnica będzie ich potrzebować.
- Budynki, domy, drzewa, auta, tłum, pociągi, ruch uliczny i dym rysuje się wspólnym zestawem `tools/art/tokyo/kit.mjs` (styl ustalony w fazie 2: dach, pod nim ściana południowa, cień w prawo w dół, długość cienia według pory dnia przez `setSun`). Kwartały między ulicami oddaje `ctx.blocks(u0, u1)`, a `lots()` z `blocks.mjs` tnie je na parcele. `ctx.cover(x, u, w, h, d)` pokazuje kawałek taśmy jeszcze raz nad ruchomymi częściami: `d = 0.1` nad pociągami (dach dworca), `d = -0.1` nad autami i pod pociągami (wiadukt nad aleją).
- **Światła** (od fazy 3): pora dnia jest nakładana po narysowaniu wszystkiego, więc to, co ma świecić, rysuje się przez `kit.E` / `kit.ER` (piksel zachowuje kolor), `kit.halo` (poświata dodana po gradacji) i `kit.after` (dowolny krok po gradacji, np. mokry asfalt w `shibuya.mjs`). Okna, witryny, szyldy, lampiony, latarnie (`kit.lamp`) i światła aut zapalają się same według `kit.night(u)`, czyli tam, gdzie taśma ciemnieje. Klatki animowanych świateł bierze się z `kit.frame(..., true)` (bez gradacji).
- **Skosy**: przy ulicach biegnących ukośnie kwartały bierze się przez `ctx.blocks(u0, u1, minW, minH, true)`, a parcele przez `lots(..., { small: true })`. Pociąg i auta po łuku: `kit.trainOn(pts)`, `kit.trafficOn(pts)` z `kit.offset(pts, d)` (d w lewo od kierunku jazdy). Ruch jest lewostronny.
- `npm test` pilnuje topologii (`tools/tests/tokyoRoute.test.mjs`): działki nie nachodzą na siebie ani na ulice, w arenach nie stoi nic wysokiego, każda ulica i każdy tor kończy się na krawędzi taśmy, na innej ulicy, przy działce albo na placu.
- Podgląd: `node tools/art/tokyo/overview.mjs` zapisuje całą taśmę w siedmiu kolumnach z ponumerowanymi działkami (`tools/preview/stage9_route.png`) i wypisuje klucz numerów. Z `--from=3100 --to=3600` zapisuje wybrany odcinek w pełnej rozdzielczości.
- Łączenia kafli są zgodne z konstrukcji: taśma jest rysowana w całości i dopiero potem cięta na 14 kawałków.

### Jak czas ma się do trasy

- Góra ekranu jest w `u = 420 + 30 × t`, środek ekranu około 185 px niżej. Kolumna „Czas" w tabeli jest przybliżona (liczona jako u / 30).
- Fala minibossa z polem `"hold": true` zatrzymuje przewijanie i zegar etapu, dopóki miniboss żyje. Arena stoi więc pod walką, a fale, pogoda i muzyka czekają. Po walce wszystko rusza z tego samego miejsca, więc tło i fale dalej się zgadzają.
- Przewijanie kończy się na końcu taśmy (404 s zegara). Boss wchodzi w 400 s i walczy nad nieruchomym terminalem.

## 5. Przeciwnicy

Pięć istniejących typów zachowań (`popcorn`, `diver`, `shooter`, `turret`, `carrier`) dostaje skórki zależne od dzielnicy. Zachowania zostają bez zmian, żeby nie mnożyć kodu. Zestaw wybiera się czasem: pole `sets` w `stage9.json` (`[[od sekundy, nazwa zestawu], ...]`), a wygląd każdego zestawu jest w `SKINS.tokyo.sets` w `src/game/skins.js`. Czego zestaw nie rysuje, bierze się z wpisu głównego. Fale nie muszą nic podawać.

| Odcinek | popcorn | diver | shooter | turret (naziemny) | carrier |
|---|---|---|---|---|---|
| Nakano–Shinjuku–Harajuku | **Karasu**, wielkie tokijskie wrony | **Koma**, wirujące bączki | **Kanban**, neonowy szyld, który odpina się od ściany | klimatyzator na dachu, reflektor billboardu | ciężarówka reklamowa z głośnikami |
| Shibuya–Minato–Chiyoda | **Kasa**, składane parasolki | wrona pikująca z parasolką w dziobie | dron z aparatem | wieżyczka yagura na murze pałacu, kamienna latarnia | riksza |
| Akihabara–Ueno | **Pikuseru**, 8-bitowe duszki migające klatkami (własny kształt, nie z gier) | kartridż-rakieta | kapsułka z automatu, która otwiera się i strzela | automat do gier, antena | furgon z kapsułkami |
| Asakusa–Sumida | **Chōchin**, papierowe lampiony | wachlarz uchiwa | lew komainu | kadzielnica, kamienny lis | **Mikoshi**, przenośna kapliczka niesiona przez tłum |
| Zatoka–Odaiba | mewy | dron dostawczy | boja z działkiem | suwnica, kontener z wyrzutnią | barka |

Klatki animacji na każdą skórkę: lot (3–4 klatki), trafienie, zniszczenie własnym efektem (pióra, konfetti, piksele, iskry lampionu). Portrety do odkryć tam, gdzie pasują.

## 6. Bossowie

Kolory zapowiedzi jak w `docs/boss-encounters.md`: czerwony to nadchodzący atak, złoty to obiekt mechaniki, miętowy to odsłonięty słaby punkt. Jedna mechanika na fazę.

### 6.1 Miniboss 1: KASA-OBAKE, „PARASOL ZE SKRZYŻOWANIA" (Shibuya)

Jednooki parasol na jednej nodze w sandale geta, z długim językiem. Arena: skrzyżowanie w deszczu, po pasach chodzi tłum zwykłych parasolek (dekoracja).

| Faza | Co robi | Jak go trafić |
|---|---|---|
| 1. Deszcz | Skacze po pasach. Otwarta czasza zatrzymuje strzały. Zamknięty wiruje i rozsiewa pierścień kropel. | Tylko gdy jest zamknięty albo w skoku |
| 2. Scramble | Rozpada się na trzy mniejsze, które przecinają skrzyżowanie we wszystkich kierunkach naraz. Wielki sygnalizator nad areną pokazuje, które pasy zaraz ruszą (czerwony). | Na czerwonym świetle stoją i są odsłonięte |
| 3. Ulewa | Zrasta się, czasza podarta, widać druty. Kręci się jak bąk, wyrzuca druty promieniście i smaga językiem w gracza. | Oko, gdy język jest wyciągnięty |

Animacje: mruganie i wodzenie okiem, sprężynowanie nogi przed skokiem, plusk w kałuży przy lądowaniu, otwieranie i zamykanie czaszy (4 klatki), wirowanie z rozbryzgiem, język (wysunięcie, smagnięcie, cofnięcie), trzy stopnie zniszczenia (dziury, pęknięte druty, wisząca czasza), rozpad na trójkę i zrośnięcie. Koniec: składa się, kłania i odskakuje w tłum jako zwykła przezroczysta parasolka.

### 6.2 Miniboss 2: TAIYAKI, „ŁAWICA Z ŻELAZNEJ FORMY" (Asakusa)

Żeliwna forma do rybek z ciasta unosi się nad straganem przed świątynią. Otwiera się z kłębem pary i wypuszcza ławicę.

| Faza | Co robi | Jak go trafić |
|---|---|---|
| 1. Wypiek | Forma wypuszcza sześć rybek pływających w szyku ósemki; strzelają fasolkami. Zamknięta forma jest nietykalna. | Rybki |
| 2. Nadzienia | Rybki w trzech smakach: anko (celowane ciemnoczerwone kule), krem (żółte, wolne, zostają w powietrzu), matcha (zielony wachlarz). Ławica układa się w kształt jednej dużej ryby i szarżuje. | Nadgryziona rybka pokazuje nadzienie i od razu wiadomo, czym strzeli |
| 3. Ō-taiyaki | Z rozgrzanej do czerwoności formy wyskakuje jedna wielka złota ryba z chrupiącymi „skrzydełkami" z ciasta. Szarżuje przez ekran, zostawia okruchy. | Brzuch po każdej szarży (miętowy) |

Animacje: zawiasy formy, para i skwierczenie, ruch ogona i płetw (4 klatki), obrót ławicy, ślady ugryzień (3 stopnie), wypływające nadzienie, rozgrzewanie formy od szarej do czerwonej, pękanie skrzydełek. Koniec: wielka ryba pęka na pół, bucha para, forma opada na stragan.

### 6.3 Boss: KUROGANE, „MECH Z ZATOKI TOKIJSKIEJ" (Odaiba)

Własny projekt: czarna stal, cynobrowy lakier i złoto jak w zbroi samuraja. Naramienniki z płyt sode, hełm kabuto z półksiężycem, maska menpō, oczy jak lampiony. Detale z maszyn portowych: pasy ostrzegawcze, haki, siłowniki. Bez rogów w kształcie litery V, bez biało-niebiesko-czerwonej kolorystyki, bez jednego różowego oka.

| Faza | Co robi | Mechanika |
|---|---|---|
| 1. Suwnica (100–60%) | Stoi wpięty w ramę suwnicy, widać tors. Pięści na łańcuchach lecą po czerwonych pasach; zasobniki w naramiennikach wypuszczają rakietki łukiem; działko w piersi sieje wachlarzem. | Wracająca pięść świeci na miętowo. Trafiana traci pancerz, potem odpada. Bez obu rąk zaczyna się faza 2 |
| 2. Przemiana (60–25%) | Przerywnik 1,5 s: rama suwnicy odpada, nogi składają się w dysze, z pleców rozkładają się skrzydła jak dwa wachlarze. Dobywa świetlnej katany: szerokie cięcia po zapowiedzianych łukach i szarże przez cały ekran. Cztery drony-lampiony krążą i strzelają. | Zestrzelenie wszystkich dronów ogłusza go na 3 s i otwiera pierś |
| 3. Rdzeń (25–0%) | Pancerz odstrzelony, widać szkielet i reaktor. Półksiężyc z hełmu odpada, jedno oko migocze. Wiązka na całą szerokość z wąskimi bezpiecznymi pasami, pociski w spirali, rozpaczliwy chwyt ręką ze szkieletu. | Po każdym dużym ataku reaktor wypuszcza parę i jest odsłonięty (miętowy) |

Animacje: praca siłowników w bezruchu, przesuwające się światło w oczach, otwieranie zasobników, wystrzał i odrzut pięści, naprężanie łańcucha, iskry z kikutów, cała sekwencja przemiany (co najmniej 8 klatek kluczowych), rozkładanie skrzydeł, dobycie i zamach kataną ze smugą, drony, pękanie pancerza w trzech stopniach na każdej części, żar reaktora i para, migotanie uszkodzonego oka. Koniec: światła gasną po kolei, mech klęka i pada na plecy do zatoki, wielki plusk, most rozbłyska tęczą, nad zatoką fajerwerki.

## 7. Poza grafiką i bossami

- **Muzyka** (`src/audio/score9.js`): wstęp, rozwinięcie i pełny temat; osobne motywy dla obu minibossów; temat bossa. Charakter: miejski pop lat 80. na syntezatorach z shamisenem, w Akihabarze dźwięki 8-bitowe, w Asakusie bębny taiko i flet.
- **Odkrycia** (`src/data/discoveries.js`): dania (monjayaki, taiyaki, ningyō-yaki, melonpan, naleśnik z Harajuku, sushi z targu, dango) i postacie (Kasa-obake, Hachikō, Jizō z Zōjō-ji, komainu).
- **Pieczątka** miasta (`tools/art/stamps.mjs`) i punkt na mapie Japonii.
- **Kupony**: dwóch minibossów i boss dają razem 3 kupony.
- **Pogoda**: deszcz w Shibui (dzisiejszy system śniegu i popiołu dostaje wariant deszczu).

## 8. Fazy pracy

Każda faza ma: zakres, pliki, które wolno ruszać, warunek ukończenia. „Wymaga" mówi, co musi być odhaczone wcześniej. Fazy bez wspólnych wymagań mogą iść na zmianę między dwoma modelami w dowolnej kolejności.

### Faza 0: silnik i szkielet etapu
Wymaga: decyzje D1–D5. Pliki: `src/data/stage9.json`, `src/data/stages.js`, `src/scenes/Boot.js`, `src/scenes/Stage.js`, `src/game/Parallax.js`, `src/game/skins.js`, `tools/gen-art.mjs`, `tools/art/tokyo/index.mjs`.
- [x] `stage9.json` zarejestrowany w `stages.js` jako `ALL_STAGES` z flagą `"wip": true`: nie ma go w podróży, książeczce ani zakończeniu, uruchamia się z menu deweloperskiego bossów albo przez `?stage=9`. Fale są zastępcze (po trochu każdego typu), prawdziwe pisze faza 10
- [x] Tło o 14 kaflach ładuje się i przewija (na razie makieta: `tools/art/tokyo/mid.mjs`)
- [ ] Pamięć i czas ładowania 14 kafli zmierzone na telefonie (około 81 MB tekstur zamiast 46 MB; do sprawdzenia, gdy kafle będą miały prawdziwą grafikę)
- [x] Dwie fale `heavy` w jednym etapie, każda z własną kartą; pole `look` wybiera wpis skórki (`kasa`, `taiyaki`), pole `music` własny motyw
- [x] Zatrzymanie przewijania i zegara na czas walki na arenie (`"hold": true`)
- [x] Zestawy skórek według odcinka trasy (`sets`); zastępczo grafiki Kioto i Okinawy na zmianę
- [x] Tokio zawsze ostatnie w kolejności podróży (`"last": true`, `src/data/journeyOrder.js`, test `journeyOrder.test.mjs`); zadziała po zdjęciu flagi `wip` w fazie 16
- [x] Deszcz jako wariant pogody (`"near": "rain"` plus harmonogram `weather`)
- [x] `npm test` i `npx vite build` przechodzą

### Faza 1: szkielet trasy
Wymaga: faza 0. Pliki: `tools/art/tokyo/route.mjs`, `tools/art/tokyo/geom.mjs`, `tools/art/tokyo/mid.mjs`, `tools/art/tokyo/overview.mjs`, `src/data/landmarks.js`, `tools/tests/tokyoRoute.test.mjs`.
- [x] Przebieg na całych 12 544 px: ulice, tory, rzeki Kanda i Sumida, fosy pałacu, stawy, linia brzegu, mosty, estakady, kolejka na Odaibie
- [x] Granice dzielnic ustalone; 51 nazw miejsc wpisanych do `landmarks.js`
- [x] 110 działek pod budynki z opisami; trzy areny zaznaczone, wolne od wysokich obiektów (pilnuje test)
- [x] Harmonogram pory dnia (`TOD` w `route.mjs`, `dark` w `stage9.json`)
- [x] Podgląd całej taśmy z numerami działek; łączenia kafli zgodne z konstrukcji
- [x] Sprawdzone w grze: Nakano, skrzyżowanie w Shibui z minibossem, Rainbow Bridge

### Fazy 2–7: dzielnice tła
Każda wymaga fazy 1. Jedna faza = jeden plik `tools/art/tokyo/<nazwa>.mjs` plus swoje animowane rekwizyty. Warunek ukończenia każdej: obiekty z tabeli w sekcji 4 narysowane, animacje w miejscu działają, łączenia z sąsiadami zgodne ze szkieletem, zrzuty przed i po w dzienniku.

- [x] **Faza 2: Nakano i Shinjuku** (u 0–2100)
  - [x] Nakano: pasaż, Broadway, stare sklepy
  - [x] Shinjuku: wieżowce i ratusz, dworzec, domy towarowe, Kabukichō, zaułki, ogród
  - [x] Animacje: neony bramy, dym z rusztów, pociągi na torach
- [x] **Faza 3: Harajuku i Shibuya** (u 2100–3900)
  - [x] Meiji Jingū, Takeshita, Omotesandō, hala Yoyogi
  - [x] Shibuya: dworzec, Hachikō, Moyai, skrzyżowanie, Center-gai
  - [x] Animacje: ekrany na ścianach, tłum na pasach, mokry asfalt z odbiciami, sygnalizatory
- [x] **Faza 4: Minato i Chiyoda** (u 3900–6100)
  - [x] Roppongi, Tokyo Tower, Zōjō-ji z figurkami Jizō
  - [x] Parlament, pałac z fosami i mostem, wiśnie, dworzec Tokio
  - [x] Animacje: zapalanie się wieży, wiatraczki, łabędzie i łódki, płatki wiśni
- [x] **Faza 5: Akihabara i Ueno** (u 6100–8100)
  - [x] Manseibashi, Miasto Elektryczne, salony gier, hale z kapsułkami
  - [x] Ameyoko, park, staw z lotosami, muzeum, zoo
  - [x] Animacje: co najmniej 12 różnych neonów i ekranów, migające automaty, pandy
- [x] **Faza 6: Asakusa i Sumida** (u 8100–10 700)
  - [x] Kappabashi, Kaminarimon, Nakamise, Hōzōmon, pagoda, Sensō-ji, Hanayashiki
  - [x] Most Azuma, wieża, hala sumo, mosty, targ, Hama-rikyū
  - [x] Animacje: kołysanie lampionów, dym kadzielnicy, łodzie z lampionami, karuzela
- [ ] **Faza 7: zatoka i Odaiba** (u 10 700–12 544)
  - [ ] Rainbow Bridge, forty, plaża i statua, muzea, budynek z kulą, terminal z suwnicami
  - [ ] Animacje: skład kolejki na estakadzie, światła mostu, fale, promy

### Faza 8: warstwy daleka i bliska
Wymaga: fazy 2–7. Pliki: `tools/art/tokyo/far.mjs`, `src/game/Parallax.js`.
- [ ] Daleka warstwa: chmury, potem nocne niebo i łuna miasta
- [ ] Bliska warstwa: tylko to, co lata (wrony, balony reklamowe, sterowiec bez napisów)
- [ ] Przejścia pory dnia sprawdzone na całej trasie

### Faza 9: grafika przeciwników
Wymaga: faza 0. Pliki: `tools/art/tokyo/enemies.mjs`, `tools/art/tokyo/sprites.mjs`, `src/game/skins.js`.
- [ ] Zestaw Nakano–Harajuku
- [ ] Zestaw Shibuya–Chiyoda
- [ ] Zestaw Akihabara–Ueno
- [ ] Zestaw Asakusa–Sumida
- [ ] Zestaw zatoka–Odaiba
- [ ] Efekty zniszczenia i portrety; test `enemyArt` i `sprites540` przechodzą

### Faza 10: fale
Wymaga: fazy 0 i 9. Plik: `src/data/stage9.json`.
- [ ] Fale 0–112 s (do minibossa 1)
- [ ] Fale 125–303 s (do minibossa 2)
- [ ] Fale 318–410 s (do bossa)
- [ ] Oddechy przed każdą areną i dostawy wzmocnień po każdej walce

### Faza 11: Kasa-obake
Wymaga: faza 0. Pliki: `src/game/enemies/tokyo-kasa.js`, `tools/art/tokyo/kasa.mjs`.
- [ ] Grafika i wszystkie animacje z sekcji 6.1
- [ ] Faza 1 · [ ] Faza 2 z sygnalizatorem · [ ] Faza 3
- [ ] Wejście, zakończenie, kupon, wpis w menu deweloperskim bossów

### Faza 12: Taiyaki
Wymaga: faza 0. Pliki: `src/game/enemies/tokyo-taiyaki.js`, `tools/art/tokyo/taiyaki.mjs`.
- [ ] Grafika i wszystkie animacje z sekcji 6.2
- [ ] Faza 1 · [ ] Faza 2 z trzema nadzieniami · [ ] Faza 3
- [ ] Wejście, zakończenie, kupon, wpis w menu deweloperskim bossów

### Faza 13: Kurogane, grafika
Wymaga: faza 0. Plik: `tools/art/tokyo/kurogane.mjs`.
- [ ] Projekt w trzech postaciach (w suwnicy, w locie, szkielet) do akceptacji przed rysowaniem klatek
- [ ] Części i stopnie zniszczenia
- [ ] Sekwencja przemiany
- [ ] Katana, drony, pociski, portret

### Faza 14: Kurogane, walka
Wymaga: faza 13. Plik: `src/game/enemies/tokyo-kurogane.js`.
- [ ] Faza 1 z pięściami · [ ] Faza 2 z dronami · [ ] Faza 3 z reaktorem
- [ ] Wejście z kartą, zakończenie z fajerwerkami
- [ ] Wpis w `docs/boss-encounters.md` i w teście `tools/tests/boss-encounters.browser.mjs`

### Faza 15: muzyka i dźwięk
Wymaga: faza 0. Plik: `src/audio/score9.js`.
- [ ] Trzy części tematu etapu
- [ ] Dwa motywy minibossów i temat bossa
- [ ] Dźwięki: deszcz, sygnalizator, skwierczenie, siłowniki, katana

### Faza 16: wpięcie w grę
Wymaga: fazy 10–14.
- [ ] Odkrycia i ich teksty PL/EN
- [ ] Pieczątka, punkt na mapie, menu podróży
- [ ] Książeczka pieczątek i zakończenie dla dziewięciu miast
- [ ] Angielskie wersje wszystkich nowych napisów

### Faza 17: balans i szlif
Wymaga: wszystko powyżej.
- [ ] Przejście całego etapu na każdym poziomie trudności bez trybu nieśmiertelności
- [ ] Przegląd równego detalu: żadna dzielnica nie odstaje od pozostałych
- [ ] Wydajność na telefonie w Akihabarze i w walce z bossem
- [ ] Przejście testowe przez człowieka i poprawki po nim

## 9. Dziennik przekazań

Po każdej sesji jeden wiersz: kto, która faza, co zrobione, co zostało, na co uważać. Następny model zaczyna od przeczytania ostatnich trzech wierszy.

| Data | Kto | Faza | Zrobione | Zostało / uwagi |
|---|---|---|---|---|
| 2026-11-17 | Claude | 6 | Wspólny moduł `wafu.mjs` (hala świątynna z dachem czterospadowym i kolumnadą, kamienne latarnie, wielkie lampiony i sznury lampionów kołyszące się w klatkach, stragany z jedzeniem). Asakusa (`asakusa.mjs`): Kappabashi z garnkami, misami i woskowym jedzeniem na chodnikach i olbrzymimi filiżankami, nożem, sztućcami i miską makaronu na dachach; świątynia za murem z dzwonem i cmentarzem; Kaminarimon ze strażnikami i rikszami; Nakamise: około 80 straganów pod miedzianymi dachami, każdy z własnym towarem na ladzie, lampiony nad przejściem; Denbōin-dōri i ogród Denbōin ze stawem i herbaciarnią; Hōzōmon z sandałami; pagoda z iglicą; dziedziniec Sensō-ji: kadzielnica z dymem, pawilon do obmyć, rzędy straganów (jeden z rybkami z ciasta), wróżby, Buddowie z brązu, dzwonnica, hala sześcioboczna, gołębie; hala główna podświetlona, chram Asakusa; Hanayashiki: karuzela, wieża z domkami, wieża spadowa, filiżanki, łabędzie na kanale, statek, nawiedzony dom, kolejka górska dookoła działki. Sumida (`sumida.mjs`): park z wiśniami, ścieżką wzdłuż rzeki, straganami, bieżnią i placem zabaw, świątynia na kopcu; chram z potrójną torii; tarasy na obu brzegach z latarniami i ich odbiciem w wodzie; sześć mostów, każdy innego kształtu i koloru (łukowy pod jezdnią, łuk nad jezdnią, kratownica kolejowa, belkowy, wiszący, łuk ściągnięty); wieża nadawcza (trójkąt u stóp, okrąg pod pokładami) z biegnącymi światłami; stacja Ryōgoku, hala sumo z flagami i wieżą bębna, muzeum na nogach, ogród ze stawem i herbaciarnią; łodzie yakatabune przy pomostach; targ rybny z łukowymi halami i tuńczykami; wieżowce u ujścia; Hama-rikyū z herbaciarnią na stawie, mostkami, polem kwiatów i starą sosną. Animacje: lampiony, karuzela, filiżanki, domki wokół wieży, wieża spadowa, kolejka, łabędzie, gołębie, dym kadzielnicy i straganów, płatki, yakatabune, tramwaj wodny i holownik z barką ze śladem na wodzie, pociągi na moście, auta na mostach i ulicach, karpie, kaczki, światła wieży. | Prostokąt z czerwonymi paskami widoczny na zrzucie w 293 s to karta ostrzeżenia przed minibossem, nie tło. Łodzie płyną pod mostami (`cover` z `d: -0.3`), auta jadą po nich. Odbicia świateł w rzece rysowane po gradacji na odkrytych pikselach (`kit.after`), półprzezroczyste nad daleką warstwą. Kołyszący się statek w Hanayashiki stoi w miejscu (za mało klatek na huśtanie). Fale w `stage9.json` nadal zastępcze; pomiar na telefonie nie zrobiony. |
| 2026-11-17 | Claude | 5 | Wspólny moduł świateł `neon.mjs` dla nocnych dzielnic: `screen` (14 własnych obrazków: kroczący stworek-pudełko, rakieta, migające pismo z kresek, plazma, wiatraczek, szachownica, pasek z bursztynowych kropek, oscyloskop, mrugająca buzia, moneta, kapsułka, filiżanka, gwiazda, pasek postępu), `sign` (szyldy: mruganie, zapalanie po kolei, biegnące żarówki), `twinkle` (lampki automatów za szybą). Akihabara (`akihabara.mjs`): most nad Kandą i ceglane arkady Manseibashi z tarasem, gmach z ekranem, salon gier z drążkiem i przyciskami na dachu, sklepy z częściami pod antenami, stacja pod szklanymi sklepieniami, stragany pod wiaduktem, hala kapsułek, kawiarnie w pastelach z dziewczynami z ulotkami, neony północy, automaty z napojami w zaułkach. Ueno (`ueno.mjs`): Ameyoko ze straganami i skrzynkami, dworzec, schody i pomnik z psem, staw Shinobazu z lotosami, groblami i Bentendō, aleja wiśni z lampionami i piknikami, zoo (pandy, słonie, żyrafy, skała małp, flamingi, białe niedźwiedzie, pagoda), Tōshō-gū, fontanna, muzeum narodowe ze stawem, boisko pod reflektorami, wieloryb, sala koncertowa, galeria. Animacje: ekrany i szyldy, lampki automatów, cztery pociągi wzdłuż (zawracają na dworcu Tokio) i dwa w poprzek, auta na Chūō-dōri, pandy, flamingi, kaczki, łódki-łabędzie, fontanna, płatki. Nowe uliczki w `route.mjs` (Akihabara północ, Okachimachi). `kit.trainOn` dostał `mode` i `hold`. | Kapsułka jest morsko-żółta i leży na boku (czerwono-biała za bardzo przypominała cudzy znak): nie przywracać. Ekrany są częścią rekwizytów (`props.png` 277 KB, `props.json` 121 KB); na telefonie nie zmierzone. Pociągi Yamanote mają jedną gradację (u 6800). Pandy, flamingi i fontanna sprawdzone tylko na zrzutach, nie w ruchu. Po dodaniu ulic kafel `mid_11` (Harajuku) różni się 48 pikselami w jednym wierszu przy u 2546: nieszkodliwe, przyczyny nie szukałem. Ścieżki w zachodniej części parku i dojście do Tōshō-gū są malowane w `ueno.mjs`, nie w `route.mjs`. Fale w `stage9.json` nadal zastępcze. |
| 2026-11-17 | Claude | 4 | Minato (`minato.mjs`): wieże Roppongi z ogrodem i tarasem, skrzyżowanie, park Shiba, Tokyo Tower (cztery nogi, dwa pokłady, maszt; zapala się piętrami w miarę lotu), Zōjō-ji z bramą, dzwonem, kadzielnicą, grobami szogunów i dwoma rzędami Jizō z wiatraczkami. Chiyoda (`chiyoda.mjs`): ministerstwa Kasumigaseki, parlament z piramidą nad ogrodem z fontanną, pałac: fosa w kamiennych murach, kamienny most pod latarniami, brama, dwie wieżyczki, sale pod miedzianymi dachami, trawnik z sosnami, las, ogrody wschodnie z podstawą wieży, stawem i irysami, Chidorigafuchi pod podświetlonymi wiśniami z przystanią; Marunouchi, plac i ceglany dworzec Tokio z dwiema kopułami, sześć peronów pod wiatami, biały dach po drugiej stronie. Animacje: światła wieży, wiatraczki, dym kadzielnicy, łabędzie na fosie, łódki wiosłowe, płatki wiśni, dziesięć pociągów na dworcu. Nowe uliczki i ścieżki w `route.mjs`. | Zewnętrzne brzegi fosy są wyłączone z zabudowy (`claim`): żwir z sosnami przed bramą, trawa pod wiśniami po bokach i od północy. Wiadukt torów do Akihabary kończy się zaokrągleniem nad peronami dworca (tak jest w szkielecie). Łabędzie i łódki są małe (ok. 3 i 5 jednostek), sprawdzone w grze tylko na zrzutach, nie w ruchu klatka po klatce. Pomiar wydajności tylko przy ukrytym panelu (30 kl./s), na telefonie nie zrobiony. Fale w `stage9.json` nadal zastępcze. |
| 2026-11-16 | Claude | 3 | Dworzec Nakano przesunięty na u 134–186 (widać go od pierwszej klatki), na południe od niego nowe uliczki. Harajuku (`harajuku.mjs`): las Meiji z 1500 drzew, dwie torii, beczki sake i wina, chram z krużgankiem, staw z irysami, polana, stacja z wieżyczką, Takeshita ze słodyczami na dachach, Omotesandō pod zelkowami, hale Yoyogi. Shibuya (`shibuya.mjs`): dworzec z wieżą, plac z Moyai, Hachikō i zielonym wagonem, skrzyżowanie z pasami na czterech bokach i przekątnych, ściany ekranów, okrągła wieża, Center-gai, park na dachu nad torami. Krok świateł w `kit.mjs`. Animacje: 7 ekranów, grupki pod parasolami na pasach, sygnalizatory, kręgi deszczu, pociągi Yamanote w obie strony, auta na Meiji-dōri. Ruch w Shinjuku poprawiony na lewostronny. Zrzuty: `node tools/preview/_tokyo_shots.mjs 60 78 90 103+1`. | Auta na ramionach skrzyżowania stoją (czerwone światło dla wszystkich), żeby nic nie jeździło po arenie. Tłum na pasach jest pod przeciwnikami (`d: -0.3`), w stonowanych kolorach; do oceny w fazie 11, czy nie myli się z pociskami Kasa-obake. Pociąg Yamanote ma jedną gradację koloru na całą trasę (u 2600), więc w Shibui jest odrobinę za jasny. Auta Meiji-dōri znikają pod wiaduktem na łuku przy u 2893. Fale w `stage9.json` są nadal zastępcze. Odcinek 3640–3900 (Roppongi-dōri pod estakadą) ma zwykłe kwartały, bez własnych obiektów. |
| 2026-11-16 | Claude | 2 | Nakano i Shinjuku narysowane (`nakano.mjs`, `shinjuku.mjs`) wspólnym zestawem `kit.mjs`: dworzec Nakano, pasaż, Broadway z ogrodem i basenem na dachu, automaty z kapsułkami, Arai Yakushi, domki i parkingi; dziewięć wieżowców z ratuszem, dworzec Shinjuku z wiatami, domy towarowe z tarasami, Kabukichō z bramą, Golden Gai, Omoide Yokochō, Gyoen ze szklarnią, herbaciarnią nad stawem i mostem. Animacje: pociągi pięciu barw wjeżdżające i odjeżdżające, auta na Ōme-kaidō (pod wiaduktami), lampy bramy, dym z rusztów. Poprawka: menu podróży wywracało się przy `?stage=9`. Zrzuty z gry: `node tools/preview/_tokyo_shots.mjs 0 28+3 44` (czas etapu + sekundy lotu). | Dworzec Nakano leży w u 28–72, a ekran startuje od u 100–420 (zależnie od wysokości), więc widać go tylko na wysokich telefonach i tylko w pierwszej sekundzie: do decyzji, czy przesunąć początek trasy. Staw w Gyoen poszerzony w `route.mjs`, żeby herbaciarnia stała nad wodą. Tłum stoi na jezdni Shinjuku-dōri celowo (deptak w dni wolne). Długie cienie wieżowców nie padają na jadące auta ani na korony drzew. Nocne dzielnice będą potrzebowały kroku świateł po nałożeniu pory dnia, którego `kit.mjs` jeszcze nie ma. |
| 2026-11-16 | Claude | 1 | Szkielet całej trasy jako dane (`route.mjs`) i jego rysunek (`mid.mjs`): ulice z chodnikami i liniami, tory, woda z kamiennym brzegiem, parki i place, zakreskowane działki, pora dnia. Test topologii. Narzędzie podglądu. | Noc od Akihabary jest na razie bardzo ciemna, bo nie ma jeszcze świateł; każda nocna dzielnica musi dodać swoje. Skrzyżowanie w Shibui ma pod spodem zwykłe chodniki alei, zebrę rysuje faza 3. Arena w Shibui ma promień 34 (sam kwadrat skrzyżowania), pozostałe 62. Układ nie trzyma stron świata, tylko kolejność miejsc. Nazwy i układ spisane z pamięci, bez weryfikacji w sieci. |
| 2026-11-16 | Claude | 0 | Szkielet etapu: `stage9.json` (wip), makieta tła 14 kafli z dzielnicami i trzema arenami, zestawy skórek, zatrzymanie na arenie, deszcz, kolejność podróży. Sprawdzone w przeglądarce: obaj zastępczy minibossowie, boss na końcu taśmy, rzeka prześwitująca do dalekiej warstwy. | Minibossowie i boss to podstawieni Tanuki, Manta i Kyūbi, muzyka pożyczona z Osaki. Nowi minibossowie z `hold` nie mogą opierać swoich czasów na `scene.t` (zegar stoi), tylko na własnym `e.age`. Granice dzielnic w `tools/art/tokyo/route.mjs` i `landmarks.js` są wstępne, faza 1 je ustala. Pomiar na telefonie nie zrobiony. |
