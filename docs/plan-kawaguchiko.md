# Plan: etap 10, KAWAGUCHIKO

Stan: **w budowie**. Fazy 0–10 gotowe: całe tło etapu (taśma, daleka i bliska warstwa, panorama Fuji), przeciwnicy i fale. Dalej walki (miniboss i boss są jeszcze na zastępstwo). 2026-11-18 autor zmienił kierunek: Fuji ma być **dominantą pokazaną klasycznie** (z boku, ze śnieżną czapą), więc etap kończy się **panoramą Fuji nad jeziorem**, a wspinaczka po stokach wypada. Pora roku: **późna jesień**. Fazy z sekcji 8 idą po kolei, a postęp odznacza się w nich checkboxami.

## 1. W skrócie

- Etap zwykłej długości, jak osiem pierwszych miast: około 230 s, tło 8 kafli (7 168 px), przewijanie 30 px/s.
- Trasa: miasto Fujiyoshida, wschodni brzeg z dworcem i kolejką na Tenjō, przelot nad jeziorem, północny brzeg w jesiennych klonach. Na końcu ziemia urywa się na brzegu zachodniej części jeziora, a za nią **wyrasta klasyczna Fuji**: śnieżna czapa, różowa w zachodzącym słońcu (beni-Fuji), jej odbicie w wodzie, las u stóp. Ten sam mechanizm co widok z Inasy w Nagasaki.
- Fuji przez cały etap: z góry widać ją w odbiciu na tafli jeziora (daleka warstwa), na końcu staje przed nami w całej okazałości. Ostatni ekran to pocztówka, na której toczy się walka z bossem.
- Pora dnia płynie z trasą: popołudnie w mieście, złota godzina nad jeziorem, zachód słońca na północnym brzegu i w finale. Po walce zapada zmierzch i zapalają się światła na drugim brzegu.
- Jeden miniboss i jeden boss, każdy z trzema fazami: **Kachi-kachi Usagi** (zając z ludowej opowieści, na łodzi na jeziorze) i **Daidarabotchi** (olbrzym z legend, który usypał Fuji, wynurza się z jeziora przed górą).
- Poziom detalu jak w poprzednich miastach. Finał dostaje dodatki, ale nie kosztem miasta i brzegów.

## 2. Decyzje

| # | Pytanie | Decyzja |
|---|---|---|
| D1 | Kierunek trasy | **Fujiyoshida → wschodni brzeg → jezioro → północny brzeg → widok na Fuji.** Przelatujemy jezioro i idziemy północnym brzegiem na zachód; tam, gdzie brzeg się kończy, Fuji stoi po drugiej stronie wody, tak jak na klasycznych widokach znad jeziora. (2026-11-18, zamiast wspinaczki na szczyt.) |
| D2 | Pora roku | **Późna jesień** (połowa listopada): świeży śnieg na czapie Fuji, czerwone klony i tunel klonów na północnym brzegu, złote modrzewie, żółte miłorzęby przy chramie, czerwone krzewy kochii w parku Ōishi, suszone persymony pod okapami. Klony ma też Miyajima, ale tu grają z Fuji i jeziorem, a nie z morzem i torii w wodzie. (2026-11-18, zamiast lata.) |
| D3 | Miniboss | **Kachi-kachi Usagi** (sekcja 6.1), bez zmian. |
| D4 | Boss | **Daidarabotchi** (sekcja 6.2). Według podań olbrzym wykopał ziemię, usypał z niej Fuji, a doły po niej zalała woda. Walka nad wodą przed panoramą góry, o zachodzie słońca. |
| D5 | Miejsce w podróży | Dziesiąte miasto, w losowej kolejności z pozostałymi ośmioma; Tokio dalej zawsze ostatnie. Bez zmian. |
| D6 | Jak pokazać Fuji | **Panorama na finał** (mechanizm z Nagasaki: taśma jest przezroczysta nad linią brzegu, warstwy widoku wysuwają się zza niej) plus **odbicie w jeziorze** pod przelotem. Fuji z góry, jako rzeźba terenu, wypada. |

## 3. Zasady

1. **Licencje.** Żadnych logotypów, nazw firm, sieci i maskotek. Na trasie celowo **nie ma**: parku rozrywki u stóp góry, pociągów z postaciami z bajek, maskotek kolejki linowej, sklepu sieciowego z „Fuji nad dachem”. Kolejka linowa, pociągi i statek wycieczkowy są rysowane z kształtu, bez napisów. Panorama to własna kompozycja: nie kopiujemy zdjęć ani drzeworytów (stare drzeworyty są w domenie publicznej, ale ich kompozycji też nie przenosimy). Nazwy miejsc w pasku lokalizacji są nazwami geograficznymi.
2. **Wrażliwe miejsca.** Lasu na lawie u stóp Fuji nie nazywamy i nie robimy żadnych odniesień do jego ponurej sławy. W panoramie to po prostu ciemny las u podnóża.
3. **Topologia.** Drogi, tory, ścieżki, mosty i pomosty muszą dokądś prowadzić i zgadzać się na łączeniach kafli. Na końcu taśmy drogi dochodzą do nabrzeża, nie urywają się w powietrzu.
4. **Nic na ziemi się nie przesuwa względem mapy.** Ruszają się tylko rzeczy, które latają, pływają albo jadą po swoim torze (łódki, gondole kolejki, pociąg, auta), oraz animacje w miejscu (spadające liście, dym z ognisk, latarnie). W panoramie warstwy przesuwają się względem siebie tylko przy wysuwaniu i lekko na boki za statkiem, tak jak w Nagasaki.
5. **Detal bez wypełniaczy.** Jezioro to nie pusta woda: łódki, rowerki-łabędzie, statek wycieczkowy, pomosty, wyspa z kapliczką, odbicie góry. Las to nie powtarzalne korony: klony, modrzewie, cedry i sosny w kępach, polany, ścieżki.
6. **Jedna faza to jeden zamknięty kawałek.** Faza kończy się zielonymi testami, wpisem w dzienniku (sekcja 9) i commitem.
7. **Pliki nie nachodzą na siebie.** Tło w `tools/art/kawaguchiko/`, walki w `src/game/enemies/kawaguchiko-*.js`. Wspólne pliki (`stage10.json`, `Enemies.js`, `gen-art.mjs`, `skins.js`, `Stage.js`) zmienia się tylko w zakresie opisanym w fazie.
8. **Teksty.** Każdy nowy napis ma wersję PL i EN, a nazwy mieszczą się w czcionce gry (w pasku lokalizacji bez makronów: KAWAGUCHIKO, FUJIYOSHIDA, CHUREITO).

## 4. Trasa

Współrzędna `u` jest liczona od dołu taśmy. Góra ekranu jest w `u = 420 + 30 × t`. Kolumna „Czas” jest przybliżona (bez postoju na minibossa). Granice odcinków po 3 900 ustali faza 4.

| u | Czas | Odcinek | Pora | Co widać |
|---|---|---|---|---|
| 0–1300 | 0–30 s | **FUJIYOSHIDA** (gotowe, do przemalowania na jesień) | popołudnie | Honchō-dōri wycelowana w górę, łaźnia, tkalnie, stacje; wzgórze Arakura z pagodą Chūreitō w czerwonych klonach; aleja cedrów do chramu Sengen z żółtymi miłorzębami |
| 1300–2100 | 30–57 s | **WSCHODNI BRZEG** (gotowe, do przemalowania) | późne popołudnie | Dworzec Kawaguchiko, ryokany z łaźniami, kolejka na Tenjō w złotym lesie, park Ōishi z czerwonymi kochiami i ściętą lawendą, przystań, most Ōhashi |
| 2100–3900 | 57–117 s | **JEZIORO** (gotowe) | złota godzina | Tafla z odbiciem Fuji w dalekiej warstwie; łódki, rowerki-łabędzie, statek wycieczkowy, wyspa Unoshima; **arena minibossa** (u ≈ 3400) |
| 3900–~5300 | 117–163 s | **PÓŁNOCNY BRZEG: KAWAGUCHI** | zachód słońca | Stara wieś pielgrzymów: domy oshi z bramami i chorągwiami, kurtyny suszonych persymon pod okapami, skoszone pola ze snopkami na żerdziach, ogrody z kapustą, ogniska z liści; chram Asama z wiekowymi cedrami |
| ~5300–6748 | 163–211 s | **TUNEL KLONÓW** | zachód słońca | Strumień w tunelu czerwonych klonów z latarniami, jarmark jesienny ze straganami (hōtō, persymony, rękodzieło), tłum, promenada nad zachodnią częścią jeziora, fotografowie ze statywami na nabrzeżu czekający na różową Fuji |
| 6748–7168 | 211–230 s | **WIDOK NA FUJI** | zachód słońca, potem zmierzch | Taśma kończy się na nabrzeżu. Za nim wysuwa się panorama: woda z odbiciem, drugi brzeg, las u stóp, **Fuji ze śnieżną czapą**. Tu walczymy z bossem (sekcja 6.2) |

### 4.1 Fuji: najważniejszy element etapu

Fuji to główna postać tego miasta. Lista poniżej jest wymaganiem dla panoramy (faza 5) i odbicia (faza 8), a nie propozycją.

**Bryła (panorama)**
- Klasyczna sylwetka widziana znad jeziora od północy: stoki strome przy szczycie, coraz łagodniejsze w dół, rozlane szeroko poza kadr. Płaski wierzchołek z drobnymi garbami krawędzi krateru, na północnym stoku ledwie zaznaczone ramię starego wulkanu Komitake. Góra zajmuje całą szerokość ekranu i ponad jedną trzecią jego wysokości.
- **Śnieżna czapa** świeżego jesiennego śniegu: zwarta przy szczycie, w dół rozpada się w języki wzdłuż żlebów, z postrzępionym dolnym brzegiem. Między językami ciemne grzbiety, nie płaska plama.
- **Światło zachodu** z prawej (od zachodu): prawy stok ciepły, lewy w niebieskim cieniu. Śnieg różowieje (beni-Fuji) i z czasem walki przechodzi w fiolet zmierzchu. Grzbiety rzucają cienie na śnieg.
- Niżej: ciemny las u podnóża, pas złotych modrzewi na granicy lasu, smugi mgły w lesie, niskie zalesione wzgórza po bokach (zielone i rdzawe), drugi brzeg z domami, hotelami i nabrzeżem.
- Niebo: od pomarańczu przy horyzoncie przez róż do fioletu u góry, oświetlone od spodu pasma chmur, a czasem soczewkowata chmura-czapa nad szczytem (kasa-gumo).

**Woda (panorama)**
- **Odbicie Fuji** odwrócone w tafli, ciemniejsze i chłodniejsze, porwane zmarszczkami w poziome pasma, które się poruszają. Kilwater łódek przecina odbicie.
- Łódki wędkarzy, statek wycieczkowy płynący wzdłuż drugiego brzegu, klucz gęsi nad wodą, kormorany.

**Odbicie pod przelotem (taśma, widok z góry)**
- Pod przezroczystą wodą jeziora w dalekiej warstwie: niebo złotej godziny z chmurami i rozmyte odbicie góry z bielą czapy, rozbijane zmarszczkami.

**Kontrola jakości**
- Najpierw jedno zbliżenie panoramy 1:1 (sama Fuji z niebem i wodą, bez ruchomych części) do akceptacji autora. Dopiero potem reszta warstw, ruch i wpięcie w grę.
- Po wpięciu: zrzuty z gry w trzech momentach (wysuwanie, walka, zmierzch po walce) i na wąskim i wysokim ekranie telefonu.

### Jak czas ma się do trasy

- Miniboss na jeziorze ma pole `"hold": true` (jak w Tokio): przewijanie i zegar stoją, dopóki żyje, więc arena zostaje na wodzie.
- Przewijanie kończy się na końcu taśmy. Panorama wysuwa się od `u = 6748` (linia nabrzeża) do końca przewijania. Boss wchodzi, gdy widok stoi, i walczy nad nim.
- Pora dnia: harmonogram `dark` w `stage10.json` rośnie łagodnie do zachodu; panorama ma własne światło (zachód, a po walce zmierzch z zapalającymi się światłami drugiego brzegu).

## 5. Przeciwnicy

Pięć istniejących typów zachowań dostaje jeden komplet skórek na cały etap. Do tego pułapka i stwór z zasadzki, które ma teraz każde miasto.

| Typ | Skórka | Uwagi |
|---|---|---|
| popcorn | **Akatombo**, stada czerwonych ważek (owady jesieni) | stado jak ptaki w Sapporo, premia za całe stado |
| diver | **bass** (okoń wielkogębowy, ryba wędkarzy z jeziora) wyskakujący z wody łukiem | nad jeziorem naturalny, nad brzegiem leci jak latająca ryba z Okinawy |
| shooter | **kasagumo**, chmura-kapelusz, która siada na Fuji | duch chmury z oczami; strzela kroplami, a przy trafieniu rozwiewa się w strzępy |
| turret | drewniana **kapliczka pielgrzymów** z okrągłym lustrem | lustro błyska (zapowiedź) i strzela odbitym światłem; wrak: rozbite lustro |
| carrier | **sznur suszonych persymon** (hoshigaki z Yamanashi) | w trzech kolorach wzmocnień |
| pułapka | **ognisko z liści** (takibi) | w ogrodach, na polach, przy straganach |
| zasadzka | **kret** z kopczyka | w ogrodach, polach i parku |

Klatki: lot (3–4), trafienie, zniszczenie własnym efektem (skrzydełka ważek, łuski, strzępy chmury, drzazgi, pestki).

## 6. Walki

Kolory zapowiedzi jak w `docs/boss-encounters.md`: czerwony to nadchodzący atak, złoty to obiekt mechaniki, miętowy to odsłonięty słaby punkt. Jedna mechanika na fazę.

### 6.1 Miniboss: KACHI-KACHI USAGI, „ZAJĄC Z KRZESIWEM” (jezioro)

Biały zając w opasce, z krzesiwem w łapkach, na drewnianej łodzi. W starej opowieści przechytrzył tanuki, który odpłynął w łodzi z błota i zatonął. Arena: otwarte jezioro przy wyspie Unoshima.

| Faza | Co robi | Jak go trafić |
|---|---|---|
| 1. Krzesiwo | Krzesze iskry („KACHI KACHI!”), z łodzi lecą wachlarze iskier. Rzuca łukiem płonące wiązki chrustu, które pływają po wodzie i parzą (czerwony krąg). | Zawsze, ale wiązki zasłaniają łódź |
| 2. Łodzie z błota | Na jeziorze pojawiają się trzy łodzie z błota z jego kukłami i wszystkie strzelają. Prawdziwa, drewniana łódź błyska złotem przy każdym pociągnięciu wioseł. | Trafione błotne łodzie rozmakają i toną z bulgotem; prawdziwą widać po złocie |
| 3. Wiosło | Wiosłuje jak szalony i taranuje przez całą szerokość po zapowiedzianej linii, zostawiając kilwater z rzędów pocisków. | Po każdej szarży łódź staje, a zając łapie oddech (miętowy) |

Animacje: ruchy uszu, krzesanie (iskry), rzut wiązki, wiosłowanie (4 klatki), rozmakanie błotnej łodzi (3 stopnie), plusk i fala, zmęczony zając. Koniec: zając wskakuje do gondoli kolejki linowej przelatującej nad jeziorem, odjeżdża na górę Tenjō i macha.

### 6.2 Boss: DAIDARABOTCHI, „OLBRZYM, KTÓRY USYPAŁ GÓRĘ” (przed Fuji, o zachodzie)

Własny projekt: olbrzym z ziemi i kamienia, porośnięty mchem i rdzawą jesienną trawą, z czerwonymi klonami na barkach jak na zboczu. Oczy ma jak dwa jeziorka odbijające niebo, a na ramieniu drążek z wielkim plecionym koszem na ziemię (mokko) na sznurach. Wynurza się z jeziora przed panoramą, do pasa w wodzie, i nie zasłania szczytu Fuji. Bez przezroczystości i bez leśnej poświaty, żeby nie przypominał znanych duchów z filmów.

| Faza | Co robi | Mechanika |
|---|---|---|
| 1. Kopanie (100–65%) | Wielkie dłonie nabierają ziemię i wodę z jeziora. Grudy lecą łukiem i pękają w pierścienie, a fale od dłoni idą po wodzie krótkimi strefami. | Dłoń przy nabieraniu jest odsłonięta (miętowa) |
| 2. Kosz (65–30%) | Niesie kosz na drążku. Kosz kołysze się nad ekranem i sypie toczące się kamienie rzędami z przerwami, a jego sznury świecą złotem. | Przestrzelenie obu sznurów zrzuca mu kosz na stopę: jest ogłuszony, a pęknięcie w piersi zostaje odsłonięte |
| 3. Zachód (30–0%) | Słońce schodzi za nim, olbrzym staje się sylwetką z płonącym obrysem, a Fuji za nim płonie różem. Zgarnia mgłę znad wody i rzuca jej ściany z wąskimi przejściami; na koniec uderza obiema dłońmi w wodę i fale idą pierścieniami. | Po każdym uderzeniu pęknięcie w piersi świeci światłem zachodu (miętowe) |

Animacje: oddech (osypująca się ziemia), mruganie oczu-jezior, nabieranie i rzut, kołysanie kosza, pękanie sznurów, ogłuszenie, trzy stopnie zniszczenia (odpadające płaty mchu, pęknięcia, odłamane ramię), sylwetka pod słońce. Koniec: siada w wodzie i rozsypuje się w małą wysepkę z jednym czerwonym klonem. Zapada zmierzch, róż na czapie Fuji gaśnie w fiolet, a na drugim brzegu zapalają się światła.

## 7. Poza grafiką i walkami

- **Muzyka** (`src/audio/score10.js`): wstęp, rozwinięcie i pełny temat etapu; motyw minibossa (skoczny, z „kachi kachi” drewienek); temat bossa (taiko, ciężki, rozjaśnia się przy zachodzie). Charakter: ludowe min'yō, shakuhachi i koto.
- **Dźwięki**: krzesiwo, plusk wioseł, szelest liści, trzask ogniska, osypywanie się ziemi, pękanie sznura.
- **Odkrycia** (`src/data/discoveries.js`): dwa dania jak w zwykłych miastach, **hōtō** (gęsta zupa z płaskim makaronem i dynią, danie na chłody) i **udon z Yoshidy** (twardy, z kapustą i przyprawą suridane); wpisy za walki: Kachi-kachi Usagi i Daidarabotchi.
- **Pieczątka** (`tools/art/stamps.mjs`): Fuji nad jeziorem z liściem klonu; pieczęć **富士**, własny kolor tuszu; punkt na mapie Japonii.
- **Kupony**: miniboss i boss, razem 2, jak w zwykłych miastach.
- **Pogoda**: spadające liście klonu w tunelu klonów i nad wsią. Bez nowego systemu: wariant istniejących drobin (śniegu i popiołu).
- **Gachapon**: karta-pocztówka z Kawaguchiko i kolory miasta.

## 8. Fazy pracy

Każda faza ma zakres, pliki, które wolno ruszać, i warunek ukończenia. „Wymaga” mówi, co musi być odhaczone wcześniej.

### Faza 0: dziesiąte miasto i szkielet etapu
Wymaga: decyzje D1–D6. Pliki: `src/data/stage10.json`, `src/data/stages.js`, `src/data/journeyOrder.js`, `src/game/skins.js`, `src/game/Stamps.js`, `src/game/Ending.js`, `tools/gen-art.mjs`, `tools/art/kawaguchiko/index.mjs`, testy z wpisaną liczbą miast.
- [x] `stage10.json` w `stages.js` z flagą `"wip": true` (uruchamia się przez `?stage=10` i z menu bossów), fale zastępcze, przeciwnicy, miniboss (tanuki) i boss (Kyūbi) z Kioto na zastępstwo
- [x] Makieta tła 8 kafli ładuje się i przewija
- [x] Gra gotowa na dziesięć miast: kolejność losowa z Tokio na końcu, książeczka pieczątek i pieczęcie zakończenia liczą miasta z listy, podpis w menu liczy je słownie („DZIESIĘĆ MIAST”, EN „TEN CITIES”); testy biorą miasta z listy plików (`tools/tests/cities.mjs`)
- [x] Pora dnia, która przy końcu etapu może jaśnieć: `darkness()` interpoluje w obie strony
- [x] `npm test` i `npx vite build` przechodzą

### Faza 1: szkielet trasy
Wymaga: faza 0. Pliki: `tools/art/kawaguchiko/route.mjs`, `mid.mjs`, `overview.mjs`, `src/data/landmarks.js`, `tools/tests/kawaguchikoRoute.test.mjs`.
- [x] Jezioro z ramieniem i półwyspem Ōishi, wyspa, most Ōhashi, pomosty; ulice Fujiyoshidy, tor lokalnej kolejki, kolejka linowa na Tenjō, droga wzdłuż brzegu
- [x] Nazwy miejsc, działki pod obiekty, areny, harmonogram pory dnia, test topologii, arkusz podglądu

### Faza 2: Fujiyoshida (u 0–1300)
Wymaga: faza 1. Plik: `tools/art/kawaguchiko/fujiyoshida.mjs`.
- [x] Stacje, Honchō-dōri ze sklepami, łaźnią, tkalnią, sklepem z sake, kawiarnią i bankiem, słupy z drutami, spiżowa torii; kwartały; wzgórze Arakura z pagodą; wielka torii, aleja cedrów i chram Sengen z całym wyposażeniem
- [x] Animacje: pociąg, auta, dym, chorągwie, karpie

### Faza 3: brzeg i jezioro (u 1300–3900)
Wymaga: faza 1. Pliki: `tools/art/kawaguchiko/shore.mjs`, `lake.mjs`, `boats.mjs`, `parts.mjs`.
- [x] Dworzec Kawaguchiko, ryokany z łaźniami, hotel, sklepy, góra Tenjō z kolejką, kapliczką zająca i dzwonem, park Ōishi, most Ōhashi, przystań, Unoshima, trzciny, boje, plaża
- [x] Animacje: gondole, łódki, łabędzie, motorówki, statek wycieczkowy, perkozy, kanie, ryby, ruch na moście

### Faza 4: nowa trasa po jeziorze
Wymaga: fazy 1–3. Pliki: `tools/art/kawaguchiko/route.mjs`, `mid.mjs`, `overview.mjs`, `src/data/landmarks.js`, `src/data/stage10.json`, `tools/tests/kawaguchikoRoute.test.mjs`; usunięcie `tools/art/kawaguchiko/fuji.mjs` (Fuji z góry; zostaje w historii gita).
- [x] Odcinki od 3 900 w górę: północny brzeg (wieś Kawaguchi, chram Asama), tunel klonów i promenada, nabrzeże na `u = 6748` (`VIEW_FROM`), za nim taśma przezroczysta do końca
- [x] Drogi, strumień, ścieżki i działki nowych odcinków (27 nowych); drogi dochodzą do promenady na nabrzeżu
- [x] Arena bossa nad panoramą (bez wysokich obiektów na ostatnim ekranie taśmy), pora dnia do zachodu, nowe nazwy miejsc
- [x] `stage10.json`: `dark` do zachodu, zapowiedź bossa „OLBRZYM WSTAJE Z JEZIORA”. Pole `panorama` dochodzi w fazie 5 razem z widokiem (dziś `Stage.js` dla każdej panoramy tworzy widok Nagasaki)
- [x] Test topologii przepisany (bez szlaku, za to: nad nabrzeżem nic nie stoi i żadna droga nie wychodzi), arkusz podglądu

### Faza 5: panorama Fuji
Wymaga: faza 4. Pliki: `tools/art/kawaguchiko/view.mjs`, `src/game/FujiView.js`, `src/data/fujiView.js`, `src/scenes/Stage.js` (tylko wybór widoku), `tools/gen-art.mjs` (tylko wpięcie).
- [x] **Zbliżenie 1:1 do akceptacji autora** (2026-11-18: „akceptuję, rób dalej”)
- [x] Warstwy widoku: niebo, góra o zmierzchu i w słońcu, wzgórza z drugim brzegiem, woda o zmierzchu i w słońcu, światła drugiego brzegu z ich smugami na wodzie
- [x] Ruch: wysuwanie warstw zza nabrzeża każda swoim tempem, lekkie przesunięcie za statkiem, łódki wędkarzy z kilwaterem, klucz gęsi co jakiś czas. Chmury stoją (bez przewijania nieba, żeby nie przekombinować)
- [x] Światło: po upadku bossa róż schodzi z czapy (warstwy w słońcu gasną w wersje zmierzchowe), niebo i wzgórza ciemnieją, zapalają się okna; napis „FUJI-SAN · 3776 M”, „KAWAGUCHIKO O ZMIERZCHU”
- [x] Zrzuty z gry: wysuwanie, walka, zmierzch po walce, na ekranie 380 i 420 px wysokości

### Faza 6: jesień na gotowych odcinkach (u 0–3900)
Wymaga: faza 4. Pliki: `fujiyoshida.mjs`, `shore.mjs`, `lake.mjs`, `mid.mjs` (tylko paleta drzew i gruntów).
- [x] Drzewa: klony czerwone i pomarańczowe, miłorzęby żółte, modrzewie złote, zelkowy rdzawe, cedry i sosny zielone, kilka zimozielonych; w kępach według miejsca (klony wokół pagody, miłorzęby przy chramie Sengen i wzdłuż drogi krajowej)
- [x] Park Ōishi: czerwone kochie na płowym trawniku, lawenda ścięta na zimę, rabaty aksamitek, kosmosów i szałwii; trawniki płowe; liście na ziemi pod klonami i miłorzębami, dno lasu w opadłych liściach
- [x] Ludzie w płaszczach i kurtkach, persymony z owocami w ogrodach, kula z cedru nad sklepem z sake brązowa
- [x] Przegląd na zbliżeniach całej przemalowanej taśmy

### Faza 7: północny brzeg i tunel klonów (u 3900–6748)
Wymaga: faza 4. Plik: `tools/art/kawaguchiko/north.mjs`.
- [x] Wieś Kawaguchi: domy pielgrzymów oshi (kamienne mury, brama w budynku, wielki dach, biały spichlerz, ogród z sosną, latarnią i persymoną, chorągwie), kurtyny persymon pod okapami, sad persymon z drabiną, chata kryta strzechą, świetlica, zagroda z traktorkiem, jizō w czerwonych śliniakach, pola ze snopkami na żerdziach i stogami, ogrody z kapustą, ogniska z liści z dymem, słupy z drutami
- [x] Chram Asama: kamienna torii nad ścieżką, siedem wiekowych cedrów w sznurach z papierami, dwa miłorzęby, pawilony pod korą cyprysową, scena kagura, pawilon do obmyć, latarnie wzdłuż drogi, stojak z tabliczkami
- [x] Tunel klonów: korony schodzą się nad ścieżką, strumień zostaje odkryty, cynobrowe mostki, liście na ścieżce, latarnie wzdłuż niej, stragany jarmarku z parą, dom herbaciany i herbaciarnia z czerwonymi parasolami, ryokan i pensjonat z łaźniami, galeria z kamiennym ogrodem, parking, taras nad wodą, promenada z latarniami, fotografowie ze statywami na nabrzeżu
- [x] Animacje: liście wirujące w tunelu klonów i nad wsią, dym z ognisk, kuchni i straganów, para z łaźni, czapla na ściernisku, auta na drogach, chorągwie; latarnie zapalają się o zachodzie

### Faza 8: warstwy daleka i bliska
Wymaga: fazy 4 i 5. Pliki: `tools/art/kawaguchiko/far.mjs`, `src/game/Parallax.js` (tylko jeśli trzeba).
- [x] Daleka warstwa pod jeziorem: woda z pasmami światła złotej godziny i odbicie Fuji do góry nogami (podstawa ku drugiemu brzegowi, czapa ku nam), miękkie, porwane zmarszczkami, z błyskami słońca; pętla bez szwu
- [x] Bliska warstwa: spadające liście klonu (istniejący rodzaj `momiji` z Miyajimy, bez nowego kodu). Ważki są przeciwnikami, a gęsi lecą w panoramie, więc w bliskiej warstwie ich nie ma
- [x] Przejścia pory dnia sprawdzone w grze: 23, 65, 83, 99, 143 i 203 s

### Faza 9: grafika przeciwników, pułapki i zasadzki
Wymaga: faza 0. Pliki: `tools/art/kawaguchiko/enemies.mjs`, `sprites.mjs`, `tools/art/traps.mjs`, `tools/art/ambush.mjs`, `src/game/skins.js`.
- [x] Pięć skórek z sekcji 5 w 540 px (`tools/art/kawaguchiko/enemies.mjs`, atlas `bg/stage10/enemies.*`): akatombo (4 klatki skrzydeł, stado z premią), okoń (machnięcia ogonem, szeroka paszcza), kasagumo (puchnie, mruga, wypluwa kroplę), sznur persymon z amuletem w kolorze wzmocnienia (kołysze się), kapliczka pielgrzymów z lustrem w 16 kierunkach i wrak z rozbitym lustrem. Zniszczenie sypie liśćmi klonu (`near: momiji`)
- [x] Ognisko z liści z grabiami (4 klatki: tli się, łapie, bucha iskrami) i kret z kopczyka (5 klatek) we wspólnym atlasie
- [x] Testy przechodzą; `enemyArt`, `traps` i `ambush` obejmą Kawaguchiko po zdjęciu flagi `wip`

### Faza 10: fale
Wymaga: fazy 4 i 9. Plik: `src/data/stage10.json`.
- [x] Fale do minibossa i od minibossa do bossa (130 wpisów): nad miastem i brzegiem ważki, chmury i kapliczki; nad jeziorem okonie i chmury, bez kapliczek na wodzie; nad północnym brzegiem i w tunelu klonów wszystko razem, gęściej pod koniec
- [x] 11 ognisk i 6 kretów tam, gdzie się grabi liście: ogrody, lasy przy chramach i pagodzie, park Ōishi, sad persymon, pola, las klonowy; liczone z miejsca na mapie (`u = 430 + 30 t`), z dala od walk
- [x] Oddech 13 s przed areną zająca, dwa sznury persymon zaraz po nim, cisza od 205 s, gdy wysuwa się panorama. Bot na normalnym: 1 trafienie w falach (Hiroszima 0)

### Faza 11: Kachi-kachi Usagi
Wymaga: faza 0. Pliki: `src/game/enemies/kawaguchiko-usagi.js`, `tools/art/kawaguchiko/usagi.mjs`.
- [ ] Grafika i animacje z sekcji 6.1
- [ ] Faza 1 · [ ] Faza 2 z łodziami z błota · [ ] Faza 3
- [ ] Wejście z kartą, zakończenie z gondolą, kupon, wpis w menu deweloperskim bossów

### Faza 12: Daidarabotchi, grafika
Wymaga: faza 5. Plik: `tools/art/kawaguchiko/daidara.mjs`.
- [ ] Projekt w trzech postaciach (kopiący, z koszem, sylwetka pod słońce) na tle panoramy, do akceptacji przed rysowaniem klatek
- [ ] Części, stopnie zniszczenia, kosz i sznury, portret

### Faza 13: Daidarabotchi, walka
Wymaga: faza 12. Plik: `src/game/enemies/kawaguchiko-daidara.js`.
- [ ] Faza 1 z dłońmi · [ ] Faza 2 z koszem · [ ] Faza 3 z zachodem
- [ ] Wejście z kartą, zakończenie z wysepką i zmierzchem
- [ ] Wpis w `docs/boss-encounters.md` i w teście walk bossów

### Faza 14: muzyka i dźwięk
Wymaga: faza 0. Plik: `src/audio/score10.js`.
- [ ] Trzy części tematu, motyw minibossa, temat bossa
- [ ] Dźwięki z sekcji 7

### Faza 15: wpięcie w grę
Wymaga: fazy 10–13.
- [ ] Odkrycia (dwa dania, dwie walki) z tekstami PL/EN
- [ ] Pieczątka, pieczęć 富士, punkt na mapie, karta-pocztówka w gachaponie
- [ ] Zdjęcie flagi `wip`: miasto w podróży, książeczce i zakończeniu

### Faza 16: balans i szlif
Wymaga: wszystko powyżej.
- [ ] Bot przechodzi etap na obu poziomach trudności; czasy walk w widełkach innych miast
- [ ] Przegląd równego detalu: żaden odcinek nie odstaje
- [ ] Wydajność na telefonie nad jeziorem i w walce z bossem przed panoramą
- [ ] Przejście testowe przez człowieka i poprawki po nim

## 9. Dziennik przekazań

Po każdej sesji jeden wiersz: kto, która faza, co zrobione, co zostało, na co uważać.

| Data | Kto | Faza | Zrobione | Zostało / uwagi |
|---|---|---|---|---|
| 2026-11-18 | Claude | 10 | Fale w `stage10.json` (generowane skryptem, jeden wpis w wierszu), pułapki i zasadzki ze współrzędnych mapy. | Testy `traps` i `ambush` obejmą etap po zdjęciu `wip`; reguły sprawdzone już przy pisaniu. Następna: faza 11 (Kachi-kachi Usagi). |
| 2026-11-18 | Claude | 9 | Przeciwnicy z prefiksem `k_` (animacje w `CITY_ANIMS`), `"enemyArt": true` w `stage10.json`, skórka `kawaguchiko` z pułapką (pierścień 7 pocisków co 3,8 s) i zasadzką. Miniboss i boss dalej na zastępstwo (tanuki i Kyūbi ze wspólnego atlasu). | Następna: faza 10 (fale, pułapki, zasadzki). |
| 2026-11-18 | Claude | 8 | `far.mjs`: jezioro z odbiciem Fuji (okresy szumów dobrane do pętli 384 px); `stage10.json`: `"near": "momiji"`. | Następne: faza 9 (grafika przeciwników, pułapki i zasadzki). |
| 2026-11-18 | Claude | 7 | Północny brzeg w `tools/art/kawaguchiko/north.mjs`; `DRAWN_TO` = 6748 (żadna działka nie jest już kreskowana). Kawałek za zakrętem drogi wypełniany osobno wyszukiwarką skośną (inaczej klin zjadały wąskie paski). Persymony z owocami także dla drzew zamówionych wprost (`kaki`). | Następne: faza 8 (daleka warstwa pod jeziorem z odbiciem Fuji, bliska z liśćmi i gęsiami). |
| 2026-11-18 | Claude | 6 | Jesień na odcinkach 0–3900: nowe barwy koron w `tools/art/nature.mjs` (momiji, kaede, icho, karamatsu, keyaki, kaki), a zestaw miejski (`tools/art/tokyo/kit.mjs`) przyjmuje od etapu `kinds` (zamiana gatunków drzew) i `cloth` (barwy ubrań); dla Tokio bez zmian. W `mid.mjs` funkcja `autumn` wybiera gatunek kępami według miejsca i sypie liście pod klony i miłorzęby; grunty parku, lasu, lawendy i kochii jesienne. | Następna: faza 7 (północny brzeg i tunel klonów). |
| 2026-11-18 | Claude | 5 | Panorama w grze: `src/game/FujiView.js` (wybierany polem `"view": "fuji"` w `panorama` w `stage10.json`), siedem warstw z `view.mjs` (góra i woda malowane dwa razy: w słońcu i o zmierzchu, przenikane po walce), klatki łódki, kilwateru i gęsi w rekwizytach etapu (`viewFrames` w `mid.mjs`), test warstw. | Boss Kioto na zastępstwo zasłania szczyt: właściwy Daidarabotchi (fazy 12–13) ma stać niżej. Następne: faza 6 (jesień na gotowych odcinkach). |
| 2026-11-18 | Claude | 5 (część) | Zbliżenie panoramy (`tools/art/kawaguchiko/view.mjs`, podgląd: `node tools/art/kawaguchiko/viewPreview.mjs` → `tools/preview/stage10_view.png`): Fuji jako stożek widziany z boku, każdy punkt zbocza z głębokości pod szczytem i azymutu, oświetlony nachyleniem z grzbietami i żlebami; czapa śniegu z językami w żlebach, żwir, modrzewie, las, mgła u stóp; jesienne wzgórza z koronami drzew, domy drugiego brzegu, niebo o zachodzie z chmurami, odbicie w wodzie porwane zmarszczkami. Trzy warstwy: niebo, ląd, woda. | Czeka na akceptację autora. Potem: ruch, wpięcie w grę (`FujiView.js`, pole `panorama`), światła po walce. |
| 2026-11-18 | Claude | 4 | Nowa trasa za jeziorem w `route.mjs`: północny brzeg z wsią Kawaguchi (domy oshi, sad persymon, pola, zagroda, jizō, chram Asama z cedrami), tunel klonów wzdłuż strumienia Nashi z jarmarkiem, promenada i nabrzeże; nad `VIEW_FROM` = 6748 taśma wycięta pod panoramę (woda typu `view`, krawędź jako mur nabrzeża). Grunty `field` i `momiji`. Fuji z góry usunięta (`fuji.mjs`, klasa drogi `road`, szlak, zejście). Nazwy miejsc, `dark`, test topologii. | Następna: faza 5, zaczyna się od zbliżenia panoramy do akceptacji. Działki od 3 900 są kreskowane do fazy 7. |
| 2026-11-18 | Claude | plan | Zmiana kierunku na prośbę autora: Fuji jako klasyczna dominanta (z boku, ze śnieżną czapą) w panoramie na końcu etapu, mechanizmem z Nagasaki; wspinaczka po stokach wypada. Pora roku: późna jesień. Nowa trasa za jeziorem (północny brzeg, tunel klonów, nabrzeże), boss przed panoramą o zachodzie, nowy nośnik (persymony) i pułapka (ognisko z liści). Fazy przenumerowane od 4. | Czeka na akceptację planu. Fuji z góry (`fuji.mjs`, commit 11cec4e) zostaje w historii; faza 4 usuwa ją z kodu. |
| 2026-11-17 | Claude | 4 (stara) | Fuji z góry jako rzeźba terenu ze stokami, szlakiem, chatkami i szczytem (`fuji.mjs`); zbliżenia zaakceptowane. | Zastąpione 2026-11-18 panoramą. |
| 2026-11-17 | Claude | 3 | Brzeg i jezioro (`shore.mjs`, `lake.mjs`), łodzie w `boats.mjs`, wspólne części w `parts.mjs`; z Tokio wzięte fale za łodziami i boje (`tools/art/tokyo/umi.mjs`). `DRAWN_TO` = 3900, arena jeziora bez pierścienia (`ARENA_DRAWN`). | Odbicie Fuji pod jeziorem dojdzie w fazie 8. |
| 2026-11-17 | Claude | 2 | Fujiyoshida (`fujiyoshida.mjs`) rysowana tokijskim zestawem (`tools/art/tokyo/kit.mjs`, `blocks.mjs`), który `mid.mjs` podpina tak jak w Tokio. Działki odcinków już narysowanych nie są kreskowane (`DRAWN_TO` w `mid.mjs`). | Po każdej fazie przesunąć `DRAWN_TO`. |
| 2026-11-17 | Claude | 1 | Trasa jako dane w `route.mjs`, szkielet malowany z danych w `mid.mjs` (geometria wspólna z Tokio: `tools/art/tokyo/geom.mjs`), test topologii, arkusz podglądu, nazwy miejsc. Miniboss na 105,5 s. | Daleka warstwa jest jedna na etap: pod jeziorem woda z odbiciem; panorama to osobny widok jak w Nagasaki. |
| 2026-11-17 | Claude | 0 | Etap 10 w budowie: `stage10.json` (flaga `wip`, fale zastępcze, miniboss z `"hold"`, boss w 220 s), makieta tła, skórka `kawaguchiko` z przeciwnikami Kioto na zastępstwo, nazwy odcinków, napisy PL/EN, podpis menu liczy miasta słownie, testy biorą miasta z listy plików. | Muzyka na razie z Kioto. |
| 2026-11-17 | Claude | plan | Plan etapu napisany i przyjęty (decyzje D1–D6), sekcja 4.1 o Fuji. | |
