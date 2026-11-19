# Silniejsze fale w pozostałych miastach: propozycja do decyzji

Fukuoka dostała w fazie 10 trzy nowe zachowania przeciwników: **sznur** (lampiony na linie, ogień biegnie od jednego do drugiego), **parę** (mentaiko, po trafieniu rozpada się na dwie połówki, które nurkują) i **wóz** (oboro-guruma, średni przeciwnik jadący drogą i rozpadający się w trzech stopniach). Do tego popcorn spadł do 43% przeciwników etapu. Pozostałe jedenaście miast ma tylko zmiany wspólne dla całej gry z fazy 2: premię za całą falę, pociski w punkty i mocniejsze zniszczenie wieżyczek.

Ten dokument proponuje, jak przenieść te trzy zachowania do innych miast. Nic tu nie jest jeszcze zbudowane.

## 1. Stan dziś

Udział popcornu wśród przeciwników etapu (bez pułapek, zasadzek i walk), liczony z plików etapów:

| Miasto | Popcorn | Własne odmiany już dziś |
|---|---|---|
| Kioto | 72% | — |
| Okinawa | 72% | — |
| Sapporo | 71% | pług śnieżny jadący ulicą (wzór dla wozu z Fukuoki) |
| Kagoshima | 74% | bomby-wulkany rozpadające się po trafieniu |
| Osaka | 69% | każdy przeciwnik w duecie manzai |
| Beppu | 64% | jajka wylęgające małe oni, gejzery i obłoki pary |
| Hiroszima | 68% | ostrygi z perłą, czerpaki-shamoji |
| Nagasaki | 69% | — |
| Tokio | 74% | pięć zestawów wyglądu, po jednym na odcinek |
| Kawaguchiko | 66% | — |
| Onomichi | 65% | — |
| **Fukuoka** | **43%** | sznur, para, wóz |

Pomiar botem w Onomichi, Kawaguchiko i Kioto (plan Fukuoki, 5.1): popcorn ginie po 1,1–1,4 s, zanim cokolwiek zrobi. Strzelec zdąża oddać jedną serię z trzech. Między popcornem a minibossem nie ma niczego, co stawia odczuwalny opór.

## 2. Co jest gotowe, a co trzeba zrobić w każdym mieście

**Gotowe (kod z Fukuoki):** wszystkie trzy zachowania biorą wygląd ze skórki miasta (`chain`, `split`, `cart` w `skins.js`, logika we wspólnym `src/game/enemies/chainSplitCart.js`, przeniesionym z `fukuoka.js` bez zmian w działaniu; kolory i dźwięki skórka może zmienić).

**Do zrobienia w każdym mieście:**
1. Grafika 540 px dla trzech wzorów. W Fukuoce to było około 35 klatek:
   - sznur: przedmiot w trzech stanach (zwykły, z okiem, płonący), spalony przedmiot i słupek;
   - para: lot, pojedyncza połówka i jej lot;
   - wóz: cztery stopnie rozpadu w ruchu i wrak.
2. Miejsca na mapie, zgodnie z zasadą, że drogi prowadzą dokądś:
   - sznur rozpięty nad prawdziwą ulicą, rzeką albo kanałem, między dwoma słupkami na lądzie;
   - wóz jedzie prawdziwą drogą przez cały czas, kiedy jest na ekranie (albo płynie wodą, jeśli to łódź);
   - nic na ziemi nie przesuwa się względem mapy.
3. Przestawienie fal: popcorn z około 70% do około 40–45%, w figurach do zestrzelenia w całości. Bez zmian w ciszy przed walkami i nad miejscami świętymi.
4. Pomiar botem: trafienia, czasy życia, serie strzelców; potem stroję.
5. Dźwięki: wspólne z Fukuoki, chyba że coś w danym mieście wyraźnie prosi o własny.

Szacunek: jedno miasto to mniej więcej tyle pracy, co fazy 9–11 Fukuoki razem (grafika, zachowania w skórce, fale), czyli dwie, trzy sesje.

## 3. Propozycje dla miast

Wszystko narysowane od zera, bez marek i postaci z cudzych dzieł. Przedmioty z miejscowej kultury, z oczami i zapowiedzią w jaskrawym kolorze, żeby nikt nie wziął ich za znajdźki. Tam, gdzie miasto ma już podobne zachowanie, proponuję je pominąć, a nie dublować.

### Kioto (Gion, Fushimi Inari, Arashiyama, Kinkaku-ji, Kiyomizu)
- **Sznur: omikuji na linie** przy chramach Fushimi Inari i Kiyomizu. Białe karteczki z wróżbą zawiązane na sznurze między dwoma słupkami. Trafiona zapala się lisim ogniem, który biegnie wzdłuż sznura.
- **Para: muszle kai-awase** z dworskiej gry epoki Heian. Zamknięta, malowana muszla spada wolno. Po trafieniu otwiera się, a obie połówki rozlatują się i nurkują.
- **Wóz: platforma yamaboko z Gion Matsuri** jadąca Shijō-dōri w pierwszej dzielnicy. Rozpad: spada szczyt z halabardą, zrywają się gobeliny, odpada koło. Bez ludzi: platforma jedzie sama.

### Okinawa (Kokusai-dōri, Shuri, Bise, Kadena, Yanbaru, most Kouri)
- **Sznur: suszone kałamarnice na linie** przy porcie i na plaży. Trafiona przypieka się i skręca, ogień idzie dalej.
- **Para: orzech kokosowy** pęka na dwie połówki, które nurkują.
- **Wóz: wóz z bawołem wodnym (suigyū-sha)**, którym w Bise wozi się ludzi między drzewami fukugi. Rozpad: zrywa się daszek, odpada koło, płonie kosz. Bawół nie ginie: odczepia się i ucieka z ekranu.

### Sapporo (Ōkurayama, Maruyama, Susukino, Nakajima, Ōdōri)
- **Sznur: suszone łososie (shiozake)** przy targu Nijō, zawieszone nad uliczką. Trafiony spada, a sąsiednie odrywają się po kolei.
- **Para: bałwan (yukidaruma)** z dwóch kul. Po trafieniu głowa i tułów rozdzielają się i toczą w stronę statku.
- **Wóz: pominąć.** Sapporo ma już pług jadący ulicą, z którego wziął się wóz Fukuoki.

### Kagoshima (Tenmonkan, Sengan-en, Kinkō-wan, Sakurajima)
- **Sznur: suszona rzodkiew (hoshi-daikon)** na rusztowaniach przy polach i zatoce. Trafiona spada, a popiół z wulkanu niesie ogień dalej.
- **Para: pominąć.** Bomby-wulkany już rozpadają się po trafieniu.
- **Wóz: wóz z glinianymi dzbanami czarnego octu** z Kurozu no Sato. Rozpad: pęka pierwszy dzban (kałuża octu na drodze jako ślad, bez szkody), odpada koło, płonie słoma.

### Osaka (Osaka-jō, Nakanoshima, Umeda, Shinsekai, Dōtonbori, port)
- **Sznur: wachlarze uchiwa z Tenjin Matsuri** rozwieszone nad ulicą Dōtonbori i nad kanałem.
- **Para: pominąć** albo zostawić duetom manzai. Każdy przeciwnik Osaki już chodzi parami, więc druga para byłaby powtórzeniem.
- **Wóz: danjiri**, rzeźbiona platforma pędzona przez ulice (Kishiwada, prefektura Osaka). Rozpad: odpadają rzeźby, zrywa się dach, odpada koło; na zakrętach skręca gwałtownie, jak danjiri.

### Beppu (Kitahama, Kannawa, piekła, Takasakiyama)
- **Sznur: bambusowe kosze jigoku-mushi** do gotowania w parze, zawieszone nad wylotami pary w Kannawie. Trafiony kosz wypuszcza obłok pary, który odpala sąsiedni.
- **Para: pominąć.** Jajka już wylęgają z siebie małe oni.
- **Wóz: beczkowóz z gorącym błotem** do kąpieli. Rozpad: spadają obręcze, wycieka błoto (plama na drodze, jak pułapki w Beppu), odpada koło.

### Hiroszima i Miyajima (zamek, Shukkeien, zatoka, Itsukushima, Misen)
- **Sznur: liny z ostrygami pod tratwami kaki-ikada** w zatoce. Rozpięte między pływakami tratwy, ostrygi otwierają się jedna po drugiej. Bez papierowych żurawi: palenie ich w tym mieście byłoby niestosowne.
- **Para: dwa liście klonu momiji** złączone ogonkiem. Po trafieniu rozdzielają się i nurkują wirując.
- **Wóz: łódź z festiwalu Kangen-sai**, płynąca wodą zatoki w swojej dzielnicy (u 4250–4520). Rozpad: gasną i spadają lampiony, odpada wiosło, płonie daszek.

### Nagasaki (Dejima, Shinchi, Meganebashi, port, Inasayama)
- **Sznur: flagi sygnałowe na linie** nad nabrzeżem i stocznią.
- **Para: bułeczki kakuni-manjū** z Chinatown, złączone w parę na parowniku. Po trafieniu rozdzielają się i nurkują.
- **Wóz: statek-platforma z Kunchi (hikimono)** ciągnięty ulicą na kołach i kręcony na skrzyżowaniach. Rozpad: zrywa się żagiel, łamie się maszt, odpada koło.

### Tokio (pięć odcinków z własnymi zestawami)
- **Sznur: pranie na linie** między balkonami w Nakano i Shinjuku. Koszulki i skarpetki odrywają się po kolei.
- **Para: nigiri** na wysokości Tsukiji. Po trafieniu ryba zsuwa się z ryżu i każda połowa nurkuje osobno.
- **Wóz: daihachi-guruma**, drewniany wózek bagażowy z czasów Edo, z workami ryżu, jadący przez Kappabashi i Ueno. Rozpad: spadają worki, odpada koło, łamie się dyszel.
- Tokio jest najdłuższe i ma pięć zestawów wyglądu, więc te trzy wzory pojawiłyby się w jednym albo dwóch odcinkach, nie na całej trasie.

### Kawaguchiko (Fujiyoshida, Chūreitō, jezioro, Momiji Kairō)
- **Sznur: karpie koinobori** na linie nad Honchō-dōri w Fujiyoshidzie. Trafiony karp zwija się i spada, a następny łapie wiatr i rwie się dalej.
- **Para: łupina kasztana** spada w korytarzu klonów. Po trafieniu pęka, a dwa kasztany nurkują.
- **Wóz: rowerek wodny-łabędź** na jeziorze. Pływa wodą jak oboro-guruma jeździ drogą. Rozpad: przekrzywia się szyja, odpada pedał, przebija się burta. Wrak zostaje na wodzie i powoli tonie.

### Onomichi (wyspy, cieśnina, stok ze świątyniami, Hondōri)
- **Sznur: flagi tairyō-bata** (flagi rybaków na dobry połów) nad portem i stocznią w Mukaishimie.
- **Para: hassaku**: owoc pęka na dwie połówki, które nurkują.
- **Wóz: prom przez cieśninę Onomichi**, płynący od przystani w Mukaishimie do przystani po stronie Onomichi. Rozpad: zrywa się flaga, odpada rampa, płonie komin.

## 4. Decyzje dla autora

- **D1. Zakres.** Wszystkie jedenaście miast, czy najpierw jedno albo dwa na próbę? Polecam próbę na **Onomichi i Kioto**. Onomichi jest najbliżej Fukuoki pod względem gęstości, a Kioto jest pierwszym miastem, które gracz widzi.
- **D2. Kolejność.** Po próbie: miasta, gdzie dziś nic nie jest „średnie” (Okinawa, Nagasaki, Kawaguchiko), potem te z własnymi odmianami (Sapporo, Kagoshima, Osaka, Beppu, Hiroszima), Tokio na końcu.
- **D3. Popcorn do 40–45%** we wszystkich miastach, czy łagodniej, np. 55%, żeby wcześniejsze miasta zostały lżejsze, bo są pierwsze w podróży? Polecam 45% wszędzie oprócz Kioto (55%), bo Kioto jest często pierwszym etapem.
- **D4. Pomijanie.** Czy zgadzasz się nie dawać pary w Kagoshimie, Osace i Beppu ani wozu w Sapporo, bo mają już coś podobnego?
- **D5. Wzory.** Które z propozycji z sekcji 3 zmienić?

**Przyjęte (2026-11-19): wszystko według rekomendacji.** D1: próba na Onomichi i Kioto. D2: potem Okinawa, Nagasaki, Kawaguchiko, następnie Sapporo, Kagoshima, Osaka, Beppu, Hiroszima, Tokio na końcu. D3: popcorn około 45%, w Kioto 55%. D4: bez pary w Kagoshimie, Osace i Beppu, bez wozu w Sapporo. D5: wzory jak w sekcji 3.

## 5. Fazy (po decyzjach, dla każdego miasta)

1. Projekt grafiki trzech wzorów na tle miasta, do akceptacji.
2. Grafika w atlasie miasta i skórka w `skins.js`.
3. Miejsca na mapie (ulice, rzeki, drogi) i przestawione fale.
4. Bot: trafienia, czasy życia, serie; strojenie.
5. Testy, odkrycia bez zmian (to nie nowe yokai), commit.

Pierwszy krok, wspólny: przeniesienie zachowań z `fukuoka.js` do wspólnego modułu, bez zmiany działania w Fukuoce, sprawdzone testami i botem.

## 6. Dziennik

| Data | Kto | Krok | Co zrobione | Uwagi |
|---|---|---|---|---|
| 2026-11-19 | Claude | 0 | Zachowania przeniesione do `src/game/enemies/chainSplitCart.js` (bez zmian w działaniu; skórka może zmienić kolory liny, światło, kolor punktów, dźwięk pary, odłamki i ogień wozu). Bot w Fukuoce jak przedtem. | |
| 2026-11-19 | Claude | 1 (Onomichi, Kioto) | Projekty grafiki do akceptacji: `tools/art/onomichi/newfoes.mjs` (flagi tairyō-bata z leszczem nad falą, hassaku i jego połówki, prom z mostkiem-oczami, autami na pokładzie i rampą-szczęką, wrak nisko w wodzie) i `tools/art/kyoto/newfoes.mjs` (omikuji na słomianej linie między cynobrowymi słupkami z lisim ogniem, muszla kai-awase z oczami w szparze i jej złocone połówki z sosną i śliwą, yamaboko z drzewcem, sakaki, halabardą, gobelinami i twarzą demona, wrak przewrócony). Jeszcze nie w atlasach ani w grze. | Zaakceptowane 2026-11-19. Prom ma 4 stopnie rozpadu, platforma też. |
| 2026-11-19 | Claude | 2-5 (Onomichi, Kioto) | Grafika w atlasach `bg/stage11` i `bg/stage1`, skórki `chain`/`split`/`cart` w `skins.js` (Kioto: słomiana lina, lisi ogień niebiesko-biały, stuk muszli zamiast mlaśnięcia). Wóz umie teraz płynąć w górę mapy i zatrzymać się (`stop`), więc prom w Onomichi dobija do nabrzeża miasta i tam zostaje. **Onomichi:** 8 lin z flagami nad drogą rowerową i nadbrzeżną (słupki na lądzie, poza drogami i terenem świątyń), 13 par hassaku, 4 promy (jeden płynie cieśniną przy Ozaki, trzy przepływają z Mukaishimy i dobijają do nabrzeża); popcorn 42%. **Kioto:** 3 liny z omikuji (nad Hanamikōji i sandō Fushimi Inari), 12 par muszli, 2 platformy yamaboko (Hanamikōji, sandō); popcorn 56%. Bot (4 bronie, moc 4), trafienia przed bossem: Onomichi 5 → 15 na normalnym (0-5 na przebieg), 3 → 8 na łatwym; Kioto 14 → 17 i 10 → 11. Testy `onomichiWaves` i `kyotoWaves`. | W Kioto najpierw było 7 lin i 3 platformy: trafienia przed bossem 14 → 29. Zdjęte 2 liny z otwarcia, a wóz na Gojō-zace i 2 liny przy Sannenzace wypadały w walce z tanuki, który nie wstrzymuje przewijania. Kioto zostaje lekkie, bo jest pierwsze. Do zrobienia przez człowieka: przelot bez trybu boga. |
| 2026-11-19 | Claude | 1 (Okinawa) | Projekty grafiki do akceptacji, `tools/art/okinawa/newfoes.mjs`: suszone kałamarnice (surume) spięte klamerką na niebieskiej linie rybackiej między spłowiałymi słupkami; obudzone otwierają oczy (strzelają), przypiekana zwija się i brązowieje, zostaje czarny skręcony strzęp. Kokos z trzema „oczkami” jako twarzą, rozbłyskującą na czerwono; jego połówki z białym miąższem, wodą w środku i parą oczu. Wóz z bawołem z Bise: szary bawół z rogami zagiętymi do tyłu, mosiężnym dzwonkiem i jarzmem, dwuspadowy daszek z trzciny, spod frędzli patrzą oczy; rozpad: zerwany daszek (ławki z poduszkami bingata, sanshin, kosz trzciny cukrowej, deska z czerwonymi oczami), odpadłe koło, płonący kosz; wrak zawalony; bawół osobno, uciekający z zerwaną liną. Jeszcze nie w atlasie ani w grze. | Sznur na plaży między palmami przy barze i nad ścieżką do bungalowów: przystań na Zamami (u 236) jest na samym początku etapu, przed pierwszą falą. Wóz na uliczce z Bise do drogi nadbrzeżnej (u 1160–1354), poza trasą malowanego wozu w wiosce. Nowe w zachowaniu: bawół odczepia się przy rozbiciu wozu i ucieka uliczką, na drodze nadbrzeżnej skręca. Zaakceptowane 2026-11-19. |
| 2026-11-19 | Claude | 2-5 (Okinawa) | Grafika w atlasie `bg/stage2`, skórka (niebieska lina rybacka, stuk kokosa). Nowe w zachowaniu wozu: `cart.runner` w skórce i `flee` w fali (punkty trasy); po rozbiciu wozu bawół biegnie dalej uliczką, a potem od punktu do punktu. 5 lin z kałamarnicami: przy barze na plaży, dwie nad ścieżką do bungalowów, nad podjazdem hotelu, przy domu latarnika nad ścieżką do pomostu. 13 kokosów w miejscu fal popcornu, 1 wóz na uliczce z Bise do drogi nadbrzeżnej; bawół przecina drogę i ucieka ścieżką na plażę (na drodze jest ruch). Popcorn 45%. Bot (4 bronie, moc 4), trafienia przed bossem: 6 → 11 na normalnym, 3 → 9 na łatwym (0–5 na przebieg). Test `okinawaWaves`. | Drugi wóz nie ma tu dobrej drogi: poprzeczne uliczki Bise przecinają trasę malowanego wozu, a most Kōri i droga na wyspie wypadają przy mancie, która nie wstrzymuje przewijania. Do zrobienia przez człowieka: przelot bez trybu boga. |
| 2026-11-19 | Claude | 1 (Nagasaki) | Projekty grafiki do akceptacji, `tools/art/nagasaki/newfoes.mjs`: flagi sygnałowe na linie między stalowymi słupkami (Alfa, Delta, Kilo, Uniform na zmianę; India, żółta z czarną kulą, budzi się: kula otwiera się w oko i strzela; płonąca, zwęglony strzęp). Kakuni-manjū: dwie na papierze w bambusowym parowniku, para, obie z groźnymi minami; osobno: złożona biała bułeczka, plaster duszonego boczku, liść sałaty. Wóz: wieloryb z Kunchi (kujira no shiofuki) na platformie: czarny wieloryb tryskający wodą, płetwa ogonowa z tyłu, niebieska spódnica z białymi falami seigaiha, cztery koła, liny bez ludzi; rozpad: rozdarta spódnica i fontanna słabnie (czerwone oczy), odpadłe koło, płonący grzbiet; wrak przewrócony na bok. Jeszcze nie w atlasie ani w grze. | **Zmiana wobec planu:** zamiast statku-platformy wieloryb, bo miniboss Nagasaki to już Oranda-bune, holenderski statek z Kunchi, a boss to smok z Kunchi; tramwaj odpada, bo po torach jeżdżą malowane tramwaje. Wieloryb jedzie główną ulicą Shinchi (x 92) po walce z Oranda-bune (15–19 s botem). Flagi nad torem suwnicy w stoczni, nad drogą nadbrzeżną przy terminalu i w Oura. Nowe w zachowaniu: sznur z kilkoma wzorami na zmianę (lista klatek w skórce). Zaakceptowane 2026-11-19. |
| 2026-11-19 | Claude | 2-5 (Nagasaki) | Grafika w atlasie `bg/stage8`, skórka (biała linka, flagi na zmianę: `chain.frames`). 3 linki z flagami: dwie nad drogą nadbrzeżną przy terminalu Matsugae (słupek na nabrzeżu i za jezdnią), jedna nad torem suwnicy w stoczni. 10 kakuni-manjū w miejscu fal popcornu, wieloryb na głównej ulicy Shinchi w 106 s (po walce z Oranda-bune; przerwa po niej sięga 110 s). Popcorn 44%. Bot (4 bronie, moc 4), trafienia przed bossem: 8 → 3 na normalnym, 1 → 4 na łatwym (0–2 na przebieg: w granicach rozrzutu, Nagasaki zostaje łagodne); Oranda-bune pada w 8–44 s, ani razu nie odpływa. Testy `nagasakiWaves` (też: nic nowego nie wpada w chwilę pamięci nad Parkiem Pokoju), `nagasaki` sprawdza teraz także atlas miasta. | Para przy 142 s spadałaby, niezestrzelona, w chwilę pamięci (149–162 s): zostaje tam popcorn. Pierwsze pomiary Okinawy i Nagasaki poszły omyłkowo na Kioto (bot dostał `stage2`/`stage8` zamiast numeru i po cichu wziął pierwsze miasto); powtórzone. **Znalezione przy okazji:** minibossy ze wspólnym zachowaniem (tanuki w Kioto, manta na Okinawie) odlatują po 34 s walki; z botem dzieje się to w ok. 2 przebiegach na 8 także przed zmianą fal, a gracz traci wtedy ich wpis w albumie. Do osobnej decyzji. |

## 7. Minibossy, które odlatują (pomiar 2026-11-19)

Bot (`tools/preview/scratch/heavy-stats.mjs`, lot do końca walki z minibossem) w każdym mieście: 4 bronie × normalny i łatwy, moc 4 (3 powtórzenia) i moc 2 (2 powtórzenia), 480 lotów. Liczba to ile razy miniboss odleciał, zanim padł (gracz traci wtedy wpis w albumie).

| Miasto | Miniboss | Limit | Moc 4, normalny | Moc 4, łatwy | Moc 2, normalny | Moc 2, łatwy | Czego bot nie umie |
|---|---|---|---|---|---|---|---|
| Kioto | tanuki | 34 s | 6/12 | 4/12 | 2/8 | 1/8 | kopie z liści |
| Okinawa | manta | 34 s | 4/12 | 4/12 | 1/8 | 2/8 | (nic: zwykły miniboss) |
| Sapporo | yuki-onna | ok. 57 s | 3/12 | 4/12 | 1/8 | 1/8 | |
| Kagoshima | raijū | 34 s | 3/11 | 2/12 | 1/8 | 2/8 | |
| Osaka | bunraku | ok. 45 s | 10/12 | 9/12 | 6/8 | 6/8 | najpierw lalkarze kuroko; wachlarz gejszy odbija strzały |
| Beppu | wani | 38 s | 3/12 | 3/12 | 6/8 | 4/8 | pod wodą |
| Hiroszima | heike-gani | 35 s | 6/12 | 3/12 | 6/8 | 1/8 | szczypce blokują strzały z przodu, trzeba zajść z boku |
| Nagasaki | Oranda-bune | 52 s | 0/12 | 0/12 | 0/8 | 0/8 | |
| Tokio | kasa-obake | ok. 95 s | 5/12 | 9/12 | 5/8 | 2/8 | oko trafialne tylko przy języku |
| Tokio | taiyaki | ok. 95 s | 10/12 | 8/10 | 7/7 | 7/8 | wielka ryba odsłonięta tylko po szarży |
| Kawaguchiko | usagi | | 4/12 | 0/12 | 3/8 | 0/8 | |
| Onomichi | nekomata | | 2/12 | 0/12 | 1/8 | 0/7 | |
| Fukuoka | yatai | 110 s | 0/12 | 0/12 | 0/7 | 0/8 | (bot zna okienka) |

Bot celuje w środek minibossa i nie zna mechanik, poza tymi, których go nauczono (Yatai-obake, Funa-yurei, Nurikabe). Tam, gdzie mechanika jest (Kioto, Osaka, Beppu, Hiroszima, Tokio), liczby zawyżają ucieczki względem gracza, który ją rozumie. Pewne są te bez mechaniki: manta odlatuje w około 1 locie na 3, także na mocy 4.

Wydłużone (2026-11-19): tanuki i raijū 34 → 45 s, manta 34 → 39 s (przy 45 s jej walka w 18 lotach na 40 wpadała na linę surume przy domu latarnika, 192 s). Ponowny pomiar z 45 s dla wszystkich trojga (po 40 lotów):

| Miasto | Ucieczki przy 34 s | Ucieczki przy 45 s | HP przy ucieczce, 34 s | HP przy ucieczce, 45 s |
|---|---|---|---|---|
| Kioto (tanuki) | 13/40 | 17/38 | 28-49% | 4-38% |
| Okinawa (manta) | 11/40 | 14/40 | 6-49% | 1-31% |
| Kagoshima (raijū) | 8/39 | 5/40 | 17-39% | 8-24% |

Bot nie zestrzeliwuje ich częściej, tylko odlatują z mniejszym zapasem: walki, które się przeciągają, przeciągają się dalej (w drugiej fazie bot zbija ok. 1-2% na sekundę). To więc nie brak czasu, tylko to, jak bot strzela w drugiej fazie; ile da graczowi 11 s więcej, pokaże dopiero przelot człowieka albo mądrzejszy bot.

| 2026-11-19 | Claude | 1 (Kawaguchiko) | Projekty grafiki do akceptacji, `tools/art/kawaguchiko/newfoes.mjs`: karpie koinobori na linie nad Honchō-dōri, między masztami z wiatraczkami yaguruma i złotą kulą; wiatr wieje wzdłuż linii, więc każdy karp ciągnie od obręczy ku następnemu (czarny ojciec, czerwona matka, niebieskie dziecko na zmianę); budzi się czarny: namalowane oko robi się czerwone, pyszczek się rozdziawia (strzela); płonący od ogona, zostaje zwęglona obręcz ze strzępem. Łupina kasztana z korytarza klonów, pęknięta na cztery, z dwoma błyszczącymi kasztanami, które na zmianę łypią na czerwono, z liściem klonu na kolcach; osobno kasztan z jasną podstawą, kępką i kolcem w boku. Rowerek wodny-łabędź płynący w dół jeziora: białe ciało, skrzydła wzdłuż burt, kokpit z dwoma różowymi siedzeniami, pedałami i sterem, długa szyja i głowa z pomarańczowym dziobem, koło łopatkowe pod ogonem w pianie, kilwater; rozpad: szyja wybita na bok i pęknięta u nasady (oczy czerwone), urwane koło (korba się kiwa, łódź zbacza), rozbita burta i woda w kokpicie; wrak pod wodą: widać tylko zgiętą szyję z głową, czubek skrzydła i poduszkę, rozchodzą się kręgi. Jeszcze nie w atlasie ani w grze. | Łabędź jest większy od rowerków przy przystani (to yokai). |
| 2026-11-19 | Claude | 2-5 (Kawaguchiko) | Grafika w atlasie `bg/stage10`, skórka (konopna linka, karpie na zmianę czerwony, czarny i niebieski; budzi się czarny; trzask łupiny). 3 linki z karpiami nad Honchō-dōri (2,6 s, 7,8 s i 14,2 s; maszty na dachach i w lesie Arakurayamy, z dala od torów, ulic poprzecznych i brązowej torii). 12 łupin kasztanów w miejscu fal popcornu: po 4 w Fujiyoshidzie, w Kawaguchi i w korytarzu klonów, żadnej nad jeziorem. Łabędź w 80 s na otwartym jeziorze, z dala od Unoshimy, przed ciszą przed zającem. Popcorn 44%. Bot (4 bronie, moc 4), trafienia przed bossem: 13 → 10 na normalnym, 2 → 5 na łatwym (w granicach rozrzutu); liny, łupiny i łabędź zestrzelone za każdym razem. Test: kawaguchikoWaves. | |
