# Plan: etap 10, KAWAGUCHIKO

Stan: **plan**. Nic jeszcze nie zbudowane. Najpierw decyzje z sekcji 2 (rekomendacje są zaznaczone), potem fazy z sekcji 8 po kolei. Postęp odznacza się checkboxami w sekcji 8.

## 1. W skrócie

- Etap zwykłej długości, jak osiem pierwszych miast: około 232 s, tło 8 kafli (7 168 px), przewijanie 30 px/s. Tokio zostaje wyjątkiem.
- Dwie rzeczy dominują mapę: **jezioro Kawaguchi** w środku trasy i **Fuji** w drugiej połowie. Trasa prowadzi od miasta Fujiyoshida, przez brzeg i taflę jeziora, przez las na lawie na stoki i szlakiem Yoshida na sam szczyt.
- Fuji widać od pierwszych sekund: jej odbicie leży na wodzie jeziora (w dalekiej warstwie, pod wodą wyciętą z warstwy środkowej), a od połowy etapu lecimy już nad samą górą.
- Pora dnia płynie z trasą: popołudnie w mieście, złota godzina nad jeziorem (Fuji czerwienieje w odbiciu), zmierzch na piątej stacji, nocne wejście z łańcuchem czołówek wspinaczy, świt na szczycie nad morzem chmur.
- Jeden miniboss i jeden boss, każdy z trzema fazami: **Kachi-kachi Usagi** (zając z ludowej opowieści, na łodzi na jeziorze) i **Daidarabotchi** (olbrzym z legend, który usypał górę, walka na kraterze o świcie).
- Poziom detalu jak w poprzednich miastach. Finał (szczyt o świcie) dostaje dodatki, ale nie kosztem miasta i jeziora.

## 2. Decyzje do podjęcia przed startem

| # | Pytanie | Moja rekomendacja |
|---|---|---|
| D1 | Kierunek trasy | **Fujiyoshida → jezioro → Fuji → szczyt.** Lecimy w stronę góry, więc ona rośnie z każdą sekundą, a finał wypada na szczycie. Odwrotnie (zejście ze szczytu nad jezioro) daje bossa nad wodą, ale Fuji zostaje za plecami i na początku. |
| D2 | Pora roku | **Lato**, sezon wspinaczkowy (lipiec–sierpień): szlak otwarty, chatki czynne, lawenda w parku Ōishi, łódki i rowerki-łabędzie na jeziorze. Fuji ma wtedy tylko płaty śniegu w żlebach, ale za to czerwono-czarny żwir wulkaniczny, którego nie ma żadne inne miasto. Wiosna dałaby wiśnie przy pagodzie (ale wiśnie ma już Kioto), jesień czerwone liście (ma je Miyajima); w obu szlak jest zamknięty i trasa musiałaby kończyć się na piątej stacji. |
| D3 | Miniboss | **Kachi-kachi Usagi** (sekcja 6.1): zając z ludowej opowieści o górze Kachi-kachi, którą tradycja wiąże z górą Tenjō nad tym jeziorem. Walka na łodzi pośrodku jeziora. Zapas: opętany rowerek-łabędź (tsukumogami), równie lokalny. |
| D4 | Boss | **Daidarabotchi** (sekcja 6.2): olbrzym z podań, który według legendy kopał ziemię i usypał z niej Fuji. Własny projekt z ziemi, kamienia i mchu z koszem na drążku, bez podobieństwa do przezroczystych leśnych duchów ze znanych filmów. Wulkan jako boss odpada, bo ma go już Kagoshima. |
| D5 | Miejsce w podróży | Dziesiąte miasto, w **losowej** kolejności z pozostałymi ośmioma; Tokio dalej zawsze ostatnie. Menu mówi „dziesięć miast”, książeczka i zakończenie mają dziesięć pieczęci. |
| D6 | Jak pokazać Fuji, zanim nad nią dolecimy | **Odbicie w jeziorze** (daleka warstwa) plus **cień chmur** na stokach. Bez osobnej panoramy jak w Nagasaki, żeby nie przekombinować. Jeśli po fazie 3 będzie za mało Fuji w pierwszej połowie, panoramę z widokiem spod pagody Chūreitō można dodać jako rozszerzenie (mechanizm z Nagasaki już istnieje). |

## 3. Zasady

1. **Licencje.** Żadnych logotypów, nazw firm, sieci i maskotek. Na trasie celowo **nie ma**: parku rozrywki u stóp góry, pociągów z postaciami z bajek, maskotek kolejki linowej, sklepu sieciowego z „Fuji nad dachem”. Kolejka linowa, pociągi i statek wycieczkowy są rysowane z kształtu, bez napisów. Obrazy starych mistrzów z Fuji są w domenie publicznej, ale nie kopiujemy ich kompozycji. Nazwy miejsc w pasku lokalizacji są nazwami geograficznymi.
2. **Wrażliwe miejsca.** Las na lawie u stóp Fuji rysujemy jako przyrodę (korzenie na lawie, mech, jaskinie wiatru i lodu), **bez jego nazwy** i bez żadnych odniesień do ponurej sławy tego miejsca.
3. **Topologia.** Drogi, tory, ścieżki, mosty, pomosty i szlak muszą dokądś prowadzić i zgadzać się na łączeniach kafli. Serpentyny drogi Subaru i szlaku liczy się raz w szkielecie (faza 1).
4. **Nic na ziemi się nie przesuwa względem mapy.** Ruszają się tylko rzeczy, które latają, pływają albo jadą po swoim torze (łódki, gondole kolejki, pociąg, autobusy na serpentynach, czołówki wspinaczy idące szlakiem), oraz animacje w miejscu (falująca lawenda, ogień pochodni).
5. **Detal bez wypełniaczy.** Jezioro to nie pusta woda: łódki wędkarzy, rowerki-łabędzie, statek wycieczkowy, pomosty, wyspa z kapliczką, odbicie góry. Las to nie powtarzalne korony: polany, lawa, wejścia do jaskiń, ścieżki.
6. **Jedna faza = jeden zamknięty kawałek.** Faza kończy się zielonymi testami, wpisem w dzienniku (sekcja 9) i commitem.
7. **Pliki nie nachodzą na siebie.** Tło w `tools/art/kawaguchiko/`, walki w `src/game/enemies/kawaguchiko-*.js`. Wspólne pliki (`stage10.json`, `Enemies.js`, `gen-art.mjs`, `skins.js`) zmienia się tylko w zakresie opisanym w fazie.
8. **Teksty.** Każdy nowy napis ma wersję PL i EN, nazwy mieszczą się w czcionce gry (bez makronów w pasku lokalizacji: KAWAGUCHIKO, FUJIYOSHIDA, CHUREITO).

## 4. Trasa

Współrzędna `u` liczona od dołu taśmy. Góra ekranu jest w `u = 420 + 30 × t`. Kolumna „Czas” jest przybliżona. Granice ustali faza 1.

| u | Czas | Odcinek | Pora | Co widać |
|---|---|---|---|---|
| 0–1300 | 0–30 s | **FUJIYOSHIDA** | popołudnie | Stara ulica handlowa Honchō-dōri, której koniec celuje prosto w górę; sklepiki z udonem z Yoshidy, łaźnia, szyldy bez napisów; aleja olbrzymich kryptomerii do chramu Kitaguchi Hongū Fuji Sengen z wielką drewnianą torii; park na wzgórzu Arakura z **pięciopiętrową pagodą Chūreitō** i schodami w zieleni; tory z pociągiem |
| 1300–2100 | 30–57 s | **BRZEG JEZIORA** | późne popołudnie | Dworzec Kawaguchiko w drewnianym stylu; ryokany z gorącymi źródłami nad wodą; **park Ōishi** z pasami lawendy i krzewami kochii; promenada; **kolejka linowa** na górę Tenjō z dwiema gondolami jadącymi w górę i w dół; most Kawaguchiko-ōhashi nad przewężeniem jeziora |
| 2100–3900 | 57–117 s | **JEZIORO** | złota godzina | Szeroka tafla z **odbiciem Fuji** (sakasa-Fuji) w dalekiej warstwie; łódki wędkarzy, rowerki-łabędzie, statek wycieczkowy z kilwaterem, pomosty i przystań; **wyspa Unoshima** z kapliczką i torii; **arena minibossa** na otwartej wodzie (u ≈ 3400) |
| 3900–4700 | 117–143 s | **POŁUDNIOWY BRZEG I LAS NA LAWIE** | zachód słońca | Kemping nad wodą; pola zastygłej lawy porośnięte mchem i lasem o korzeniach na wierzchu; wejścia do **jaskini wiatru** i **jaskini lodowej** z drewnianymi schodkami; początek drogi Subaru z bramką |
| 4700–5600 | 143–173 s | **DROGA SUBARU I PIĄTA STACJA** | zmierzch | Serpentyny drogi przez coraz rzadszy las, autobusy z zapalonymi światłami; **piąta stacja**: plac, sklepy z laskami wspinaczkowymi, mała kapliczka Komitake, konie juczne, punkt widokowy nad jeziorem w dole |
| 5600–6700 | 173–210 s | **SZLAK YOSHIDA** | noc | Zakosy szlaku po czerwono-czarnym żwirze, kamienne murki i liny wzdłuż ścieżki, **chatki górskie** z ciepłym światłem i flagami, łańcuch **czołówek wspinaczy** pełznący zakosami (animacja), małe torii na szlaku, płaty śniegu w żlebach, morze chmur zaczyna się pod nami |
| 6700–7168 | 210–232 s | **SZCZYT** | świt | Torii na szczycie, kapliczka, kamienne domki na krawędzi, **krater** (arena bossa, u ≈ 6950), za krawędzią morze chmur i wschodzące słońce (goraikō) |

### Jak czas ma się do trasy

- Miniboss na jeziorze ma pole `"hold": true` (jak w Tokio): przewijanie i zegar stoją, dopóki żyje, więc arena zostaje na wodzie. Wychodzi w około 100 s.
- Przewijanie kończy się na końcu taśmy. Boss wchodzi w około 215 s i walczy nad nieruchomym kraterem.
- Pora dnia: harmonogram `dark` w `stage10.json` rośnie do nocy na szlaku i spada do jasności na świcie. To pierwszy etap, który przy końcu jaśnieje, więc faza 0 sprawdza, że nakładanie pory dnia to umie (światła mają gasnąć w drugą stronę).

## 5. Przeciwnicy

Pięć istniejących typów zachowań dostaje jeden komplet skórek na cały etap (bez zestawów na odcinki jak w Tokio: etap jest zwykłej długości). Do tego pułapka i stwór z zasadzki, które ma teraz każde miasto.

| Typ | Skórka | Uwagi |
|---|---|---|
| popcorn | **Akatombo**, stada czerwonych ważek | stado jak ptaki w Sapporo, premia za całe stado |
| diver | **bass** (okoń wielkogębowy, ryba wędkarzy z jeziora) wyskakujący z wody łukiem | nad jeziorem naturalny, wyżej leci jak latająca ryba z Okinawy |
| shooter | **kasagumo**, chmura-kapelusz, która siada na Fuji | duch chmury z oczami; strzela kroplami, przy trafieniu rozwiewa się w strzępy |
| turret | drewniana **kapliczka pielgrzymów** z okrągłym lustrem | lustro błyska (zapowiedź) i strzela odbitym światłem; wrak: rozbite lustro |
| carrier | **brzoskwinia z Yamanashi** w koszyku na sznurku | w trzech kolorach wzmocnień |
| pułapka | **pochodnia taimatsu** z festiwalu ognia w Yoshidzie | w mieście i na brzegu; wzdłuż szlaku ten sam typ jako kamienny piec chatki (do decyzji w fazie 6) |
| zasadzka | **kret** z kopczyka | w lawendzie, na kempingu, w żwirze szlaku: pasuje do każdej ziemi na trasie |

Klatki: lot (3–4), trafienie, zniszczenie własnym efektem (skrzydełka ważek, łuski, strzępy chmury, drzazgi, pestki).

## 6. Walki

Kolory zapowiedzi jak w `docs/boss-encounters.md`: czerwony to nadchodzący atak, złoty to obiekt mechaniki, miętowy to odsłonięty słaby punkt. Jedna mechanika na fazę.

### 6.1 Miniboss: KACHI-KACHI USAGI, „ZAJĄC Z KRZESIWEM” (jezioro)

Biały zając w opasce, z krzesiwem w łapkach, na drewnianej łodzi. W starej opowieści przechytrzył tanuki, który odpłynął w łodzi z błota i zatonął. Arena: otwarte jezioro przy wyspie Unoshima, odbicie Fuji pod spodem.

| Faza | Co robi | Jak go trafić |
|---|---|---|
| 1. Krzesiwo | Krzesze iskry („KACHI KACHI!”), z łodzi lecą wachlarze iskier; rzuca płonące wiązki chrustu łukiem, które pływają po wodzie i parzą (czerwony krąg). | Zawsze, ale wiązki zasłaniają łódź |
| 2. Łodzie z błota | Na jeziorze pojawiają się trzy łodzie z błota z jego kukłami; wszystkie strzelają. Prawdziwa drewniana łódź błyska złotem przy każdym wiosłowaniu. | Trafione błotne łodzie rozmakają i toną z bulgotem; prawdziwą widać po złocie |
| 3. Wiosło | Wiosłuje jak szalony i taranuje przez całą szerokość po zapowiedzianej linii, zostawia kilwater z rzędów pocisków. | Po każdej szarży łódź staje, zając łapie oddech (miętowy) |

Animacje: ruchy uszu, krzesanie (iskry), rzut wiązki, wiosłowanie (4 klatki), rozmakanie błotnej łodzi (3 stopnie), plusk i fala, zmęczony zając. Koniec: zając wskakuje do gondoli kolejki linowej przelatującej nad jeziorem i odjeżdża na górę Tenjō, machając.

### 6.2 Boss: DAIDARABOTCHI, „OLBRZYM, KTÓRY USYPAŁ GÓRĘ” (szczyt o świcie)

Własny projekt: olbrzym z ziemi i kamienia, porośnięty mchem i trawą, z płatami śniegu na ramionach, oczy jak dwa jeziorka odbijające niebo, na ramieniu drążek z wielkim plecionym koszem na ziemię (mokko) na sznurach. Wynurza się z morza chmur obok krateru. Bez przezroczystości i bez leśnej poświaty, żeby nie przypominał znanych duchów z filmów.

| Faza | Co robi | Mechanika |
|---|---|---|
| 1. Kopanie (100–65%) | Wielkie dłonie nabierają ziemię z krawędzi krateru. Grudy lecą łukiem i pękają w pierścienie; odciski dłoni zostają na ziemi jako krótkie strefy. | Dłoń przy nabieraniu jest odsłonięta (miętowa) |
| 2. Kosz (65–30%) | Niesie kosz na drążku. Kosz kołysze się nad ekranem i sypie toczące się kamienie rzędami z przerwami; sznury kosza świecą złotem. | Przestrzelenie obu sznurów zrzuca mu kosz na stopę: ogłuszony, pęknięcie w piersi odsłonięte |
| 3. Wschód słońca (30–0%) | Słońce wstaje za nim, olbrzym staje się sylwetką z płonącym obrysem. Zgarnia morze chmur i rzuca ściany mgły z wąskimi przejściami; na koniec uderza obiema dłońmi w ziemię, fale uderzeniowe pierścieniami. | Po każdym uderzeniu pęknięcie w piersi świeci światłem świtu (miętowe) |

Animacje: oddech (osypująca się ziemia), mruganie oczu-jezior, nabieranie i rzut, kołysanie kosza, pękanie sznurów, ogłuszenie, trzy stopnie zniszczenia (odpadające płaty mchu, pęknięcia, odłamane ramię), sylwetka pod słońce. Koniec: siada na krawędzi krateru i rozsypuje się w mały pagórek, w odcisku jego stopy zbiera się woda w maleńkie jeziorko; słońce wychodzi w pełni, wspinacze na krawędzi wiwatują.

## 7. Poza grafiką i walkami

- **Muzyka** (`src/audio/score10.js`): wstęp, rozwinięcie i pełny temat etapu; motyw minibossa (skoczny, z „kachi kachi” drewienek); temat bossa (taiko, ciężki, rozjaśnia się przy świcie). Charakter: ludowe min'yō, shakuhachi i koto, na szlaku powolne narastanie.
- **Dźwięki**: krzesiwo, plusk wioseł, wiatr na szlaku, dzwoneczki lasek wspinaczy, osypywanie się ziemi, pękanie sznura.
- **Odkrycia** (`src/data/discoveries.js`): dwa dania jak w zwykłych miastach: **hōtō** (gęsta zupa z płaskim makaronem i dynią) i **udon z Yoshidy** (twardy, z kapustą i przyprawą suridane); wpisy za walki: Kachi-kachi Usagi i Daidarabotchi.
- **Pieczątka** (`tools/art/stamps.mjs`): Fuji z odbiciem w jeziorze i pagodą; pieczęć **富士**, własny kolor tuszu; punkt na mapie Japonii.
- **Kupony**: miniboss i boss, razem 2, jak w zwykłych miastach.
- **Pogoda**: na szlaku wiatr (kąt opadających drobin), na szczycie mgła z morza chmur. Bez nowego systemu: wariant istniejącego śniegu i popiołu.
- **Gachapon**: karta-pocztówka z Kawaguchiko i kolory miasta.

## 8. Fazy pracy

Każda faza ma: zakres, pliki, które wolno ruszać, warunek ukończenia. „Wymaga” mówi, co musi być odhaczone wcześniej.

### Faza 0: dziesiąte miasto i szkielet etapu
Wymaga: decyzje D1–D6. Pliki: `src/data/stage10.json`, `src/data/stages.js`, `src/data/journeyOrder.js`, `src/game/skins.js`, `src/game/Stamps.js`, `src/game/Ending.js`, `tools/gen-art.mjs`, `tools/art/kawaguchiko/index.mjs`, testy z wpisaną liczbą miast.
- [ ] `stage10.json` w `stages.js` z flagą `"wip": true` (uruchamia się przez `?stage=10`), fale zastępcze
- [ ] Makieta tła 8 kafli ładuje się i przewija
- [ ] Gra gotowa na dziesięć miast: losowa kolejność z Tokio na końcu, druga strona książeczki pieczątek, dziesięć pieczęci w zakończeniu, napisy „dziesięć miast”; testy, które dziś zakładają dziewięć etapów (`traps`, `ambush`, `discoveries`, `tokyoJourney`, przejście renderingu), liczą je z listy
- [ ] Pora dnia, która przy końcu etapu jaśnieje (świt): światła gasną z powrotem
- [ ] `npm test` i `npx vite build` przechodzą

### Faza 1: szkielet trasy
Wymaga: faza 0. Pliki: `tools/art/kawaguchiko/route.mjs`, `tools/art/kawaguchiko/mid.mjs`, `tools/art/kawaguchiko/overview.mjs`, `src/data/landmarks.js`, `tools/tests/kawaguchikoRoute.test.mjs`.
- [ ] Linia brzegu jeziora, wyspa, przewężenie z mostem; ulice Fujiyoshidy, tory, droga wzdłuż brzegu; serpentyny drogi Subaru; zakosy szlaku; krawędź krateru
- [ ] Granice odcinków i nazwy miejsc w `landmarks.js`
- [ ] Działki pod obiekty z opisami; dwie areny zaznaczone, wolne od wysokich obiektów
- [ ] Harmonogram pory dnia
- [ ] Test topologii: drogi, tory i szlak kończą się na krawędzi, na innej drodze, przy działce albo na placu

### Faza 2: Fujiyoshida (u 0–1300)
Wymaga: faza 1. Plik: `tools/art/kawaguchiko/fujiyoshida.mjs`.
- [ ] Honchō-dōri ze sklepikami, aleja kryptomerii i chram z wielką torii, wzgórze z pagodą Chūreitō i schodami
- [ ] Animacje: pociąg na torach, dym z kuchni z udonem, flagi

### Faza 3: brzeg i jezioro (u 1300–3900)
Wymaga: faza 1. Pliki: `tools/art/kawaguchiko/shore.mjs`, `tools/art/kawaguchiko/lake.mjs`.
- [ ] Dworzec, ryokany, park Ōishi z lawendą i kochią, promenada, kolejka linowa, most
- [ ] Jezioro: przystań, pomosty, wyspa Unoshima z kapliczką, arena minibossa
- [ ] Animacje: gondole w górę i w dół, łódki wędkarzy, rowerki-łabędzie, statek z kilwaterem, falująca lawenda

### Faza 4: las na lawie, droga Subaru, piąta stacja (u 3900–5600)
Wymaga: faza 1. Plik: `tools/art/kawaguchiko/slopes.mjs`.
- [ ] Kemping, lawa z mchem i korzeniami, wejścia do jaskiń wiatru i lodu, bramka drogi
- [ ] Serpentyny przez rzednący las, piąta stacja z placem, sklepami, kapliczką i końmi
- [ ] Animacje: autobusy na serpentynach, konie, światła zmierzchu

### Faza 5: szlak i szczyt (u 5600–7168)
Wymaga: faza 1. Plik: `tools/art/kawaguchiko/summit.mjs`.
- [ ] Zakosy po czerwono-czarnym żwirze, murki i liny, chatki ze światłem, małe torii, płaty śniegu
- [ ] Szczyt: torii, kapliczka, kamienne domki, krater (arena bossa)
- [ ] Animacje: łańcuch czołówek idących szlakiem, migające okna chatek, flagi na wietrze

### Faza 6: warstwy daleka i bliska
Wymaga: fazy 2–5. Pliki: `tools/art/kawaguchiko/far.mjs`, `src/game/Parallax.js` (tylko jeśli trzeba).
- [ ] Daleka warstwa pod jeziorem: **odbicie Fuji**, czerwieniejące w złotej godzinie, rozbijane zmarszczkami
- [ ] Daleka warstwa pod szczytem: morze chmur i wschód słońca
- [ ] Bliska warstwa: tylko to, co lata (ważki, chmury, paralotnia bez napisów)
- [ ] Przejścia pory dnia sprawdzone na całej trasie

### Faza 7: grafika przeciwników, pułapki i zasadzki
Wymaga: faza 0. Pliki: `tools/art/kawaguchiko/enemies.mjs`, `tools/art/kawaguchiko/sprites.mjs`, `tools/art/traps.mjs`, `tools/art/ambush.mjs`, `src/game/skins.js`.
- [ ] Pięć skórek z sekcji 5 z klatkami lotu, trafienia i efektem zniszczenia
- [ ] Pochodnia taimatsu (4 klatki), kret z kopczyka (5 klatek)
- [ ] Testy `enemyArt`, `sprites540`, `traps`, `ambush` przechodzą

### Faza 8: fale
Wymaga: fazy 0 i 7. Plik: `src/data/stage10.json`.
- [ ] Fale 0–90 s (do minibossa), 115–200 s (do bossa)
- [ ] 8–14 pułapek i 4–10 zasadzek w miejscach z sensem (zbliżenia mapy), z dala od walk
- [ ] Oddechy przed areną i dostawa wzmocnień po minibossie

### Faza 9: Kachi-kachi Usagi
Wymaga: faza 0. Pliki: `src/game/enemies/kawaguchiko-usagi.js`, `tools/art/kawaguchiko/usagi.mjs`.
- [ ] Grafika i animacje z sekcji 6.1
- [ ] Faza 1 · [ ] Faza 2 z łodziami z błota · [ ] Faza 3
- [ ] Wejście z kartą, zakończenie z gondolą, kupon, wpis w menu deweloperskim bossów

### Faza 10: Daidarabotchi, grafika
Wymaga: faza 0. Plik: `tools/art/kawaguchiko/daidara.mjs`.
- [ ] Projekt w trzech postaciach (kopiący, z koszem, sylwetka pod słońce) do akceptacji przed rysowaniem klatek
- [ ] Części, stopnie zniszczenia, kosz i sznury, portret

### Faza 11: Daidarabotchi, walka
Wymaga: faza 10. Plik: `src/game/enemies/kawaguchiko-daidara.js`.
- [ ] Faza 1 z dłońmi · [ ] Faza 2 z koszem · [ ] Faza 3 ze świtem
- [ ] Wejście z kartą, zakończenie z jeziorkiem w odcisku stopy
- [ ] Wpis w `docs/boss-encounters.md` i w teście walk bossów

### Faza 12: muzyka i dźwięk
Wymaga: faza 0. Plik: `src/audio/score10.js`.
- [ ] Trzy części tematu, motyw minibossa, temat bossa
- [ ] Dźwięki z sekcji 7

### Faza 13: wpięcie w grę
Wymaga: fazy 8–11.
- [ ] Odkrycia (dwa dania, dwie walki) z tekstami PL/EN
- [ ] Pieczątka, pieczęć 富士, punkt na mapie, karta-pocztówka w gachaponie
- [ ] Zdjęcie flagi `wip`: miasto w podróży, książeczce i zakończeniu

### Faza 14: balans i szlif
Wymaga: wszystko powyżej.
- [ ] Bot przechodzi etap na obu poziomach trudności; czasy walk w widełkach innych miast
- [ ] Przegląd równego detalu: żaden odcinek nie odstaje
- [ ] Wydajność na telefonie nad jeziorem (odbicie) i w walce z bossem
- [ ] Przejście testowe przez człowieka i poprawki po nim

## 9. Dziennik przekazań

Po każdej sesji jeden wiersz: kto, która faza, co zrobione, co zostało, na co uważać.

| Data | Kto | Faza | Zrobione | Zostało / uwagi |
|---|---|---|---|---|
| 2026-11-17 | Claude | plan | Plan etapu napisany: trasa, przeciwnicy, dwie walki, fazy. | Czeka na decyzje D1–D6. |
