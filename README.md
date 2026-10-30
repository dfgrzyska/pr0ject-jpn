# Shmup Japonia — etap 1: Kioto, etap 2: Okinawa, etap 3: Sapporo, etap 4: Kagoshima

Pionowy shmup w przeglądarce (Phaser 4.2.1, WebGL), rozdzielczość wewnętrzna 180×320–420,
skalowanie całkowitą wielokrotnością pikseli urządzenia.

## Uruchomienie

```bash
npm install
npm run dev        # http://localhost:5173 (także w sieci lokalnej — do testów na telefonie)
npm run build      # statyczna wersja w dist/
npm run art        # przegenerowanie grafik do public/assets/
```

Wersja online: https://dfgrzyska.github.io/pr0ject-jpn/ — budowana automatycznie przy każdym pushu na `main`
(`.github/workflows/pages.yml`; w Settings → Pages źródło musi być ustawione na „GitHub Actions”).

Parametry do testów w adresie: `?stage=1` … `?stage=4` (ten etap pierwszy, reszta losowo — 1 Kioto, 2 Okinawa, 3 Sapporo, 4 Kagoshima), `?t=120` (start od 120 s etapu), `?god` (nieśmiertelność),
`?weapon=laser&power=5` (broń `basic|spread|laser|homing`, moc 1–5), `?ship=oni|kitsune|tsubame`.

## Statki

Po starcie wybiera się jeden z trzech statków (malowania w kolorach japońskich sieci konbini).
Parametry są w `SHIPS` w `src/config.js`.

| Statek | Malowanie | Prędkość | Siła ognia | Życia |
| --- | --- | --- | --- | --- |
| ONI (ciężki) | biel, zielony dziób, niebieska rufa | wolny, ociężale goni palec | ×1,4 | 3 |
| KITSUNE (standard) | biel z pasami pomarańczowym, zielonym, czerwonym | standard | ×1 | 3 |
| TSUBAME (szybki) | niebiesko-biała jaskółka | szybki | ×1 | 2 |

Wybór jest zapamiętywany; „jeszcze raz” wraca do ekranu wyboru z ostatnim statkiem.

## Sterowanie

- Telefon: statek podąża za ruchem palca względem miejsca dotknięcia; bomba — przycisk w prawym dolnym rogu; pauza i głośnik — prawy górny róg.
- Klawiatura: strzałki / WASD — ruch, Z — bomba, Esc / P — pauza, M — dźwięk, Enter — start.
- Strzał jest automatyczny.

## Etap 1

Pas tła (warstwa środkowa) ~7 tys. px, ok. 3,5 min: miasteczko Fushimi → rzeka z mostem i sakurami →
sandō z wielką bramą torii → kompleks świątyni (brama Rōmon, Honden) → tunele Senbon Torii na grzbiecie
góry (z rozwidleniem na dwa tunele) → Okusha → las cedrów i bambusów ze stawem Shin-ike i kopcami otsuka →
wspinaczka Yotsutsuji z punktem widokowym → szczyt Ichinomine.

Paralaksa: daleka warstwa to dolina pod grzbietem (zapętlona), środkowa — grzbiet z torii, świątyniami
i drzewami (wieżyczki są do niej przyczepione), bliska — płatki sakury i mgła.

Wrogowie (roboty w stylu Fushimi Inari):

| Archetyp | Wygląd | Zachowanie |
| --- | --- | --- |
| Popcorn | dron-maska kitsune | formacje: `line`, `sine`, `arc`, `row` |
| Strzelec | kanonierka podwieszona pod belką torii | wlatuje, staje, strzela celowanymi seriami (`aimed`/`fan`), odlatuje |
| Wieżyczka | kamienna latarnia tōrō z działem | na warstwie terenu, wachlarz (`fan`) lub pierścień (`ring`) |
| Nurek | dron kruk-tengu | zawisa, celuje i pikuje w gracza |
| Ciężki | tanuki — figurka z Shigaraki (kapelusz, butelka sake, zeszyt rachunków) | pierwszy miniboss (ok. 70 s): bębni w brzuch (pierścień na każde „pon”), rzuca butelkami sake z celownikiem na ziemi, zmienia się listkiem w trzy tanuki — kopie mają listek na kapeluszu i pękają od jednego trafienia |
| Ciężki | Kyūbi — czerwony lis o dziewięciu ogonach z klejnotem hōju i lisim ogniem | drugi miniboss (ok. 150 s, pod szczytem), pierścienie / wachlarze / spirala |
| Nośnik | dron z klejnotem hōju (czerwony/niebieski/zielony) | zygzak, po ~4,6 s ucieka, zawsze zostawia znajdźkę |

Znajdźki: czerwona — rozrzut, niebieska — laser, zielona — naprowadzane „lisie ognie”.

## Etap 2

Okinawa, ok. 3,5 min: otwarte morze z wysepkami, rafami i łodziami sabani → plaża kurortu (parasole, hotel,
basen) → wioska z czerwonymi dachami z białą zaprawą, koralowymi murkami, drzewami fukugi i betonowymi domami
ze zbiornikami na wodę → pola trzciny cukrowej i ananasów, ruiny gusuku → zamek Shuri (Shureimon,
pasiasty dziedziniec, hala Seiden) → dżungla z klifami → morze z rafami (miniboss) → wyspa z latarnią →
otwarte morze z bossem.

Daleka warstwa to głęboki ocean (płynie dalej podczas walki z bossem), bliska — chmury i mewy.
Wrogowie mają skórki wyspiarskie (`src/game/skins.js`), zachowania są te same co w Kioto:

| Archetyp | Wygląd |
| --- | --- |
| Popcorn | latająca ryba tobiuo |
| Strzelec | smocza łódź wyścigowa hārī |
| Wieżyczka | koralowy bunkier z dachem z czerwonej dachówki |
| Nurek | wąż habu |
| Ciężki | robo-manta (miniboss nad morzem) |
| Nośnik | szklana boja z ryukyuańskiego szkła w siatce |

Boss: para shisa — „A” (otwarty pysk, złota kula) i „Un” (zamknięty pysk), wspólny pasek życia.
Strzelają na zmianę wachlarzami, krzyżowymi pierścieniami, strumieniem i dużymi kulami;
gdy jedna padnie, druga wpada w szał (szybsza, gęstsze serie). Po pokonaniu etap się kończy, bomba się odnawia.

## Etap 3

Sapporo zimą, ok. 3,5 min, od zachodu słońca do nocy: skocznia Ōkurayama (rozbieg, zeskok z liniami, stadion,
wyciąg krzesełkowy) → przedmieścia z kolorowymi blaszanymi dachami pod śniegiem, zbiornikami na naftę,
zasypanymi autami i strzałkami yabane nad drogami → centrum: wieża zegarowa Tokeidai, ceglany Akarenga
z ośmiokątną kopułą i czerwonymi gwiazdami, ruch na alei → neony Susukino i zaułek ramen z lampionami →
zamarznięta rzeka Toyohira z mostami → park Nakajima (staw, Hōheikan, sala koncertowa; zamieć i miniboss) →
Festiwal Śniegu w parku Ōdōri (lodowe rzeźby, śnieżny zamek, zjeżdżalnia, kamakura, żuraw tanchō, rampa big air,
stragany, podświetlone drzewa) → plac pod wieżą telewizyjną z cokołem rzeźby niedźwiedzia.

Pora dnia przechodzi płynnie przez cały pas tła (gradacja kolorów w generatorze); okna, latarnie i neony są
dorysowywane po gradacji, więc świecą w ciemności. Daleka warstwa to ośnieżony las w dolinie, bliska — padający
śnieg z wiatrem (zamieć z smugami w czasie walki z minibossem, diamentowy pył przy spokojnej pogodzie);
natężenie opadów to pole `weather` w `stage3.json`.

Wrogowie mają nowe mechaniki:

| Archetyp | Wygląd | Mechanika |
| --- | --- | --- |
| Popcorn | raniuszki shima-enaga | **stado**: zestrzelenie całej grupy daje bonus „STADO!” (200 × liczba ptaków × mnożnik) |
| Strzelec | lodowa latarnia (świeca w bryle lodu) | **lodowy pancerz**: lód pęka w 3 etapach; potem płomień strzela 2× szybciej, ale ma mało życia; bomba kruszy lód od razu |
| Wieżyczka | bałwan (marchewka wskazuje cel) | **śnieżki**: rzut łukiem w miejsce gracza, pierścień na ziemi pokazuje miejsce upadku; w środku trafia, potem rozprysk wolnych pocisków |
| Nurek | polatucha | **skoki z drzew**: przyczepia się do krawędzi ekranu, mruga i szybuje łukiem w stronę wysokości gracza, dwa razy |
| Nośnik | miska miso ramen | bez zmian |
| Pług (nowy, naziemny) | pług wirnikowy | **jeździ ulicami** tła (w dół alei albo w poprzek) i omiata ekran strumieniem śniegu; wyrzutnik pokazuje kierunek |

Miniboss: Yuki-onna, śnieżna kobieta — znika we mgle i pojawia się gdzie indziej (wtedy strzały przez nią
przelatują). Wzory: zamarzające płatki (pociski zatrzymują się w kształt śnieżynki i ruszają ze skrętem),
zamieć (serie znoszone wiatrem — śnieg pokazuje, w którą stronę wieje), sople (mrugają u góry, potem spadają).

Boss: niedźwiedź z Festiwalu Śniegu. Rzeźba wjeżdża na cokole i budzi się, gdy tło się zatrzyma.
Faza 1: lód przepuszcza strzały, cele to dwie łapy (wachlarze, rzuty śnieżkami) i lodowe serce (pierścienie,
zamarzające płatki); serce rozbija całą rzeźbę. Faza 2: brunatny niedźwiedź higuma — ryk z pierścieniami,
zamachy łapami, łososie wijące się w locie i spadające sople; poniżej 35% życia wpada w szał.

## Etap 4

Kagoshima i wulkan Sakurajima, ok. 3,5 min, od przymglonego popiołem przedpołudnia po czerwoną łunę krateru:
miasto (dworzec Chūō z diabelskim młynem na dachu, tramwaj po torach porośniętych trawą, aleja palm, pasaż
Tenmonkan, żółte worki na popiół na rogach ulic, wzgórze Shiroyama) → rzeka Kōtsuki z kamiennymi mostami →
ogród Sengan-en nad morzem (rezydencja Shimadzu, kamienny Shūseikan, replika armaty, kolej wzdłuż brzegu) →
pola tysięcy czarnych dzbanów z octem kurozu → zatoka Kinkō (prom, sadze hodowlane, łodzie, delfiny; burza
popiołowa i miniboss) → Sakurajima (przystań, wioska pod popiołem, schrony przed bombami wulkanicznymi, pola
olbrzymiej rzodkwi daikon, sady komikan, zasypana brama torii w Kurokami) → pola lawy z 1914 r. → krater.

Daleka warstwa to zatoka w szarej mgiełce, bliska — opadający popiół, od zboczy wulkanu żar unoszący się w górę,
w czasie burzy przyciemnione niebo i błyski. Pole `embersFrom` w `stage4.json` mówi, od której sekundy leci żar.

| Archetyp | Wygląd | Mechanika |
| --- | --- | --- |
| Popcorn | bomby wulkaniczne | **rozpad**: trafiona bomba pęka na dwie mniejsze, które rozlatują się na boki (bomba gracza niszczy je w całości); tor `toss` — rzucone przez wulkan, spadają coraz szybciej |
| Strzelec | dron z arkebuzem tanegashima | **celownik**: czerwona linia podąża za graczem, blokuje się i miga, potem jeden szybki strzał wzdłuż niej |
| Wieżyczka | dzban kurozu (w środku świecą oczy) | **pokrywka**: zamknięty jest odporny (strzały odbijają się), pokrywka grzechocze, unosi się, dzban strzela i zamyka; bomba zrywa pokrywkę |
| Nurek | kappa (garappa) | **zanurzenie**: najpierw tylko kręgi na wodzie (strzały przelatują), podpływa do gracza, wynurza się z pluskiem, mruga i skacze |
| Nośnik | shirokuma (lody z mordką niedźwiadka) | **topnienie**: w ~5,5 s rozpływa się razem ze znajdźką („ROZTOPIONA”) |

Miniboss: Raijū, bestia piorunów z legend — nadciąga w burzy popiołowej nad zatoką. Słupy piorunów (najpierw miga
linia ostrzegawcza), pary kul połączone łukiem prądu (przelot między nimi rani), szarża wzdłuż pokazanej linii
z pasmem iskier.

Boss: Sakurajima — wulkan stoi w miejscu, to szczyt etapu (pozycje krateru i kominów są w fali bossa w `stage4.json`,
generator tła czyta te same liczby). Faza 1: dwa boczne kominy — bomby lawy rzucane łukiem z celownikiem na ziemi,
słupy pary w dół zbocza, strumienie żaru. Faza 2: krater się otwiera — pierścienie erupcji, rzeki lawy (rzędy
pocisków z jedną luką, która przesuwa się z każdym rzędem), wulkaniczne pioruny. Poniżej 30% wybucha na dobre.
Po pokonaniu krater stygnie i zostaje w tle.

## Kolejność etapów

Każda nowa gra losuje kolejność miast; „ETAP 1…4” to miejsce w tej kolejności, nie stałe miasto.
Po ukończeniu etapu gra przechodzi do następnego z tym samym statkiem, wynikiem, mnożnikiem, bronią i życiami;
po czwartym — „GRATULACJE!”. „Jeszcze raz” po przegranej zaczyna nową grę z nową kolejnością.

## Muzyka

Oryginalna ścieżka „Senbon” grana na żywo przez Web Audio (`src/audio/`) — bez plików audio.
Skala *in* (miyako-bushi) na A, instrumenty: koto, flet w stylu shakuhachi, chiptune'owy bas, taiko,
kołatka i shaker. Muzyka rośnie z etapem: spokojne miasto → rozkręcenie przy świątyni → pełny utwór na grzbiecie
→ skoczny motyw tanuki (pon-poko na taiko, shamisen) i osobny motyw Kyūbiego → finał na szczycie; do tego dżingle końca etapu i końca gry.
Nuty są tekstem w `src/audio/score.js` (16 kroków na takt, np. `'A4 - - E5 - - F5 - ...'`).
Etap 2 ma własną ścieżkę „Churaumi” (`src/audio/score2.js`): skala ryukyu (C E F G B), sanshin, flet,
bębny eisa (duży bęben i paranku), kołatki sanba i bujający rytm kachāshī; osobne motywy manty i shisa.
Etap 3 gra „Kita no Yoru” (`src/audio/score3.js`) w stylu festiwalu Yosakoi Sōran: skala min'yō (D F G A C),
shamisen, pozytywka (Otaru), flet, taiko, drewniane kołatki naruko i dzwonki sań; rozstrojona pozytywka
dla Yuki-onny i szybki, ciężki motyw niedźwiedzia.
Etap 4 gra „Hi no Shima” (`src/audio/score4.js`): festiwalowo w skali yo (D E G A B) jak orkiestry Ohara-matsuri —
shamisen, flet, taiko, gong kane — z satsuma-biwą (głęboka lutnia uderzana dużą kostką); trzeszczący motyw Raijū
i powolny, ciężki motyw wulkanu w skali in na E.
Efekty (`src/audio/Sfx.js`): ciche, syntetyzowane strzały każdej broni (z limitem częstotliwości) i eksplozje
w trzech rozmiarach. Głośnik / M wycisza muzykę i efekty razem.
iOS: dźwięk startuje po pierwszym dotknięciu; przełącznik wyciszenia telefonu wycisza też grę.

## Fale

`src/data/stage1.json` … `stage4.json` — dane etapu (wygląd, muzyka, ostrzeżenia) i harmonogram fal,
edytowalne bez zmian w kodzie:

```json
{ "t": 4.0, "type": "popcorn", "x": 40, "path": "sine", "count": 6 }
{ "t": 9.5, "type": "carrier", "x": 120, "path": "zigzag", "color": "red" }
{ "t": 25.2, "type": "turret", "x": 64, "pattern": "fan" }
```

Opcjonalne pola: `gap` (odstęp w serii), `look` (inna skórka z `skins.js`, np. `tanuki`), `warning` i `music` (własne ostrzeżenie i motyw dla ciężkiego), `spacing` (dla `row`), `y` (wysokość zatrzymania), `hp`, `dir`.
Sapporo: `{ "type": "plow", "x": 90, "dir": "down" }` (pług w dół alei) albo `{ "type": "plow", "y": 36, "dir": 1 }`
(w poprzek, od lewej; `-1` od prawej) — generator rysuje pod nim ulicę; nurek `{ "x": 0, "y": 50 }` startuje z lewej krawędzi.
Pod każdą wieżyczką generator tła rysuje kamienną platformę i wycina drzewa — po zmianie wieżyczek
uruchom `npm run art`. Mnożnik: N = suma wag wrogów w etapie / 9 (liczone automatycznie, `src/config.js`).

## Grafika

Cała grafika jest generowana kodem (`tools/`) do zwykłych plików PNG w `public/assets/`:
atlas sprite'ów (`sprites.png` + `sprites.json`), font pikselowy z polskimi znakami, a dla każdego etapu
`bg/stageN/far.png` i 14 kawałków warstwy środkowej `bg/stageN/mid_XX.png` (180×512).
Generatory teł: `tools/art/kyoto/`, `tools/art/okinawa/`, `tools/art/sapporo/`, `tools/art/kagoshima/` (`node tools/gen-art.mjs --only=stage4` buduje jeden etap). Każdy plik można podmienić ręcznie
rysowaną grafiką o tych samych wymiarach/nazwach ramek. `node tools/gen-art.mjs --preview` zapisuje
powiększone podglądy do `tools/preview/`.

Statki i wrogowie to maski znaków (`tools/art/sprites.mjs`) z automatycznym cieniowaniem i obrysem.

## Struktura

```
src/main.js            konfiguracja Phaser, skalowanie całkowite, safe-area
src/config.js          parametry rozgrywki (bronie, wrogowie, mnożnik, fair play)
src/scenes/Boot.js     ładowanie, font, animacje
src/scenes/Stage.js    pętla etapu, kolizje, stany (tytuł / gra / pauza / koniec)
src/data/              etapy (stages.js + stageN.json)
src/game/*.js          paralaksa, gracz i bronie, wrogowie i bossowie, skórki, pociski, fale, wynik, HUD, efekty
tools/                 generator grafiki
```
