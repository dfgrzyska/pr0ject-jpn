# Plan przebudowy przeciwników do 540 px

Tła wszystkich ośmiu miast są już w nowej gęstości (`artScale: 3` w `public/assets/bg/stageN/meta.json`).
Przeciwnicy, minibossowie i bossowie nadal mają starą grafikę: jeden piksel sprite'a to 3 × 3 piksele bufora
(Kyūbi 29 × 49, Tako 63 × 49, Oni 63 × 68 pikseli logicznych). Ten plan to krok 5 z `graphics-540-plan.md`,
rozpisany na każdego przeciwnika. Statki gracza, pociski, efekty, HUD i menu zostają w obecnej oprawie, dopóki
nie zostanie ustalony osobny zakres.

Zasada nadrzędna: **zmienia się tylko wygląd**. Logiczny rozmiar, pivoty, promienie trafień (`radius`, `segs`),
punkty wylotu pocisków, trajektorie, HP i czasy ataków zostają bez zmian. Balans z `plan-balansu-i-mechanik.md`
nie może się przez to rozjechać.

## Inwentarz

Liczby z `public/assets/sprites.json` (klatki i ich łączna powierzchnia w pikselach logicznych; po potrojeniu
obu wymiarów powierzchnia rośnie 9 ×):

| Miasto | Klatki | Powierzchnia | × 9 | Atlas (szac.) |
| --- | ---: | ---: | ---: | --- |
| Kioto | 58 | 102 570 | 923 130 | 1024 × 1024 (ogony Kyūbi to 60%) |
| Okinawa | 38 | 26 420 | 237 780 | 512 × 512 |
| Sapporo | 74 | 35 802 | 322 218 | 512 × 768 |
| Kagoshima | 32 | 24 240 | 218 160 | 512 × 512 |
| Osaka | 28 | 15 635 | 140 715 | 512 × 384 |
| Beppu | 46 | 51 063 | 459 567 | 512 × 1024 (para `steamf` już jest w 3 ×) |
| Hiroszima | 46 | 25 043 | 225 387 | 512 × 512 |
| Nagasaki | 41 | 29 540 | 265 860 | 512 × 640 |
| **Razem** | **363** | **310 313** | **2 792 817** | |

Wspólny atlas z tym wszystkim miałby ok. 2,8 mln pikseli: przekroczyłby 2048 × 1024 i siedziałby w pamięci przez
całą grę. Dlatego przeciwnicy dostają atlas osobny dla każdego miasta (krok 1).

## Krok 1. Wspólna infrastruktura (raz, przed pierwszym miastem)

1. **Atlas miasta.** `tools/gen-art.mjs --only=stageN` pakuje przeciwników miasta do
   `public/assets/bg/stageN/enemies.png` i `enemies.json`, obok `props`. Wspólny `sprites.png` traci te klatki
   dopiero wtedy, gdy miasto przejdzie na nowy atlas, więc migracja idzie miasto po mieście.
   `meta.json` dostaje pole `enemyScale: 3`. Bez niego zostaje stara grafika ze wspólnego atlasu.
2. **Wczytywanie i zwalnianie.** `Boot.fetch()` i `retainStages()` traktują `enemies_stageN` tak jak `props_stageN`:
   ładuje się dla bieżącego i następnego miasta, a potem się zwalnia. Animacje przeciwników
   (`anims.create` w `Boot.js`, dziś zawsze z kluczem `'sprites'`) tworzą się po wczytaniu atlasu miasta i usuwają
   przy zwolnieniu, z tymi samymi kluczami (`tanuki`, `n_ja` itd.), więc `e.play(...)` w kodzie się nie zmienia.
3. **Pule ze skalą bazową.** `Pool.spawn()` dziś zawsze używa tekstury `'sprites'` i resetuje skalę do 1.
   Pule przeciwników (`pool`, `heads`, `wrecks`, `segPool`, `tailPool`, `woundPool`) dostają klucz tekstury
   i skalę bazową 1/3. `spawn()` ustawia `setTexture(key, frame)` i `setScale(base)`.
4. **Skala w kodzie zachowania.** Każde `setScale(v)` na sprite'cie przeciwnika staje się `setScale(v * base)`:
   - ogony Kyūbi: rośnięcie i odlatywanie;
   - wynurzanie Ja-odori (`size`) i jego segmenty;
   - urośnięty ostatni shisa (1.2);
   - para w Beppu (dziś ręcznie `/ 3`);
   - perły, ogniki i widmowe pochodnie.
   Najprościej dodać helper `this.scaleOf(e, v)` w `Enemies`.
5. **Miejsca, które zakładają rozmiar klatki w pikselach tekstury:**
   - `wounds()` i odrzut w `update()`: `0.5 + rec / e.height` → `e.displayHeight` (inaczej odrzut i oddech byłyby
     3 × mniejsze);
   - `newWound()`: losuje pęknięcia po `frame.width/height` i `getPixelAlpha`, czyli w pikselach tekstury;
     przesunięcia `ox/oy` trzeba dzielić przez 3, marginesy (4 px, odstęp 12) mnożyć przez 3;
   - Oni w stawie: `setCrop(0, 0, 63, vh)` i `60` w `goDown`, `oniStand`, `newWound` → razy 3;
   - `goDown()` kopiuje `scaleX/scaleY`, więc działa, jeśli bazowa skala jest już na sprite'cie;
   - `KYUBI_TAIL` (przesunięcia końców ogonów) i `Ending.js` (`BOSSES`, ogony w paradzie) zostają w jednostkach
     logicznych; trzeba tylko sprawdzić, że pivot klatki ogona leży w tym samym miejscu.
6. **Siatka pikseli.** `src/rendering.js` zaokrągla wierzchołki do siatki logicznej (co 3 piksele bufora), bo tak
   wyglądają stare grafiki. Nowe sprite'y muszą z tego wyjść i być zaokrąglane do pojedynczego piksela bufora, tak
   jak tła z `artScale: 3` (`Props.js`: `Math.round(v * artScale) / artScale`). Inaczej ruch będzie skakał co 3 px.
7. **Album yōkai i zakończenie.** `Discoveries.js` (14 portretów: `popcorn_0`, `kyubi_idle`, `oni_0`, …)
   i `Ending.js` (parada bossów) biorą klatki ze wspólnego atlasu. Wtedy atlas miasta może już nie być wczytany.
   Generator robi więc mały wspólny atlas `portraits.png` z tych klatek w 3 × (ok. 25 klatek, jeden rysunek
   wspólny z miastem), a album i zakończenie czytają z niego w skali 1/3.
8. **Generator.** `tools/lib/spritekit.mjs` (maski znaków → cieniowanie → kontur) dostaje wariant w 3 ×. Kształty
   i materiały rysuje się w siatce logicznej jak dziś, a detal, faktura i światło już w pikselach drobnych,
   na wzór `HiCanvas` (`tools/art/hires.mjs`) i `fineCloud` (`tools/art/beppu/sprites.mjs`). Pivot zostaje
   w środku klatki, a wymiary klatki to dokładnie 3 × dawne, żeby nie przesunąć niczego w kodzie.
9. **Czytelność na tle.** Szczegółowe tła mają dużo drobnego kontrastu. Każdy przeciwnik zachowuje ciemny kontur
   grubości jednego piksela logicznego (3 drobnych) i jasny górny brzeg bryły. Detal idzie do środka sylwetki,
   a nie na krawędź. Pociski i kropka trafienia muszą być dalej najjaśniejsze na ekranie.
10. **Narzędzia kontroli.** `tools/preview/enemies.mjs --only=stageN` składa arkusz porównawczy stary / nowy
    (każda klatka w 2 ×, na tle z tego miasta). Test logiki sprawdza, że każda klatka z `skins.js`, z modułu
    miasta i z `BOSSES` w zakończeniu istnieje w atlasie miasta (albo w `portraits`) i ma wymiary 3 × dawne.

## Krok 2. Miasto po mieście

Kolejność jak przy tłach: Kioto → Okinawa → Sapporo → Kagoshima → Osaka → Beppu → Hiroszima → Nagasaki.
W każdym mieście po kolei: zwykli wrogowie → wieżyczka (podstawa, 16 kierunków głowicy, wrak) → nośnik
(trzy kolory) → miniboss i jego części → boss i jego części → portrety. Najpierw przerysowujemy istniejące
klatki (te same nazwy i ten sam rytm), potem dokładamy animacje i detale z kroku 2a.

## Krok 2a. Więcej animacji i detali

Przy przebudowie każdy przeciwnik dostaje więcej ruchu. Zasada: **animacja niesie informację, nie zmienia
mechaniki**. Pozy, które zapowiadają atak, ustawia kod (tak jak dziś `kyubi_cast`, `tanuki_drum_*`, `oni_1/2`,
`sankibo_fan_*`) w tym samym momencie, w którym zaczyna się ostrzeżenie. Animacja nie może więc wydłużać ani
skracać czasu reakcji. Animacje w pętli (`anims.create`) mogą mieć więcej klatek pod tymi samymi kluczami.

**Rodzaje animacji dla każdego przeciwnika (tam, gdzie mają sens):**
1. **Spoczynek** zamiast 2 klatek 4–6: oddech, kołysanie, mruganie, praca wirnika, falowanie materiału. Dziś
   „oddech” bossów to przesuwanie sprite'a o piksel (`wounds()`), a w nowej grafice może to być prawdziwa klatka.
2. **Zapowiedź ataku** (1–3 klatki zamachu): unoszona maczuga, nabierany oddech, otwierana muszla, napinane
   szczypce. Kod ustawia je tam, gdzie dziś są `poseT`, `flash` przed szarżą i migające linie ostrzeżeń.
3. **Reakcja na trafienie**: krótki grymas albo odchylenie (dziś tylko błysk i odrzut o piksele), wywoływane
   razem z `flash`, z tym samym limitem częstotliwości (`flashCool`).
4. **Stan zniszczeń według fazy**: zamiast losowych pęknięć (`crack_*`) narysowane stany. Bossowie mają 3 stany
   (cały, uszkodzony, ledwo żywy), zwykli wrogowie i minibossowie 2. Stan zmienia się przy `phaseBreak`
   albo przy progach 2/3 i 1/3 życia, a `wounds()` dokłada już tylko dym i iskry.
5. **Przejście fazy**: 3–6 klatek przemiany grane w czasie `PHASE.gate` (0,9 s), kiedy boss i tak wstrzymuje ogień.
6. **Wejście i zejście**: własne klatki wynurzania i budzenia (Oni ze stawu, Kyūbi z ognia, rzeźba niedźwiedzia)
   oraz końcówki z `goDown()` (zatonięcie, rozsypanie, spalenie) jako narysowane sekwencje, a nie sam tint i alfa.
7. **Warstwy wtórne**: osobne małe sprite'y nad przeciwnikiem, w trybie ADD albo z własną animacją: płomienie,
   poświata oczu, para, krople, iskry, kołyszące się shide i frędzle. Nie zmieniają hitboxu i można je wyłączyć
   przy `?noprops` albo przy spadku klatek.
8. **Detal w ruchu**: rzeczy, które dziś stoją, a w 540 px mogą się ruszać: włosy Yuki-onny, chorągiewki,
   lina shimenawa, katsuobushi na takoyaki, macki z przyssawkami, łańcuch kotwicy Oranda-bune.

**Lista dodatków według miast** (oprócz 1–4, które dostaje każdy):

| Miasto | Nowe animacje i detale |
| --- | --- |
| Kioto | kitsune: odbite światło na masce i wirnik w 4 klatkach; chōchin-obake: migająca świeca i język; tanuki: picie sake jako przejście fazy, kopie znikające w liściach (sekwencja), bębnienie w 4 klatkach; Kyūbi: ogony falujące w 6 klatkach zamiast 3, ogień na czubkach jako warstwa ADD, odrywanie się ogona jako sekwencja, warga i uszy w `cast`, ogniki-satelity z migotaniem |
| Okinawa | tobiuo: rozkładanie płetw przy wyskoku; hārī: wiosłowanie w 4 klatkach; manta: falowanie skrzydeł w 6, drgające skrzela; shisa: grzywa na wietrze, „A” toczące kulę, przejście w fazie 3 (wchłonięcie duszy, urośnięcie) |
| Sapporo | shima-enaga: trzepot w 4 klatkach; latarnia: płomień w 4 klatkach i pękanie lodu jako sekwencja; pług: sypiący śnieg jako warstwa; Yuki-onna: włosy i rąbek kimona w ruchu, znikanie we mgle jako sekwencja; niedźwiedź: kruszenie rzeźby (przejście fazy 1→2), ryk z parą z pyska, zamieć fazy 3 z oszronioną sierścią |
| Kagoshima | bomba: żarzenie pulsujące; arkebuz: dym z lufy po strzale; kappa: wynurzanie w 3 klatkach; Raijū: wyładowania w sierści jako warstwa ADD, napięcie przed szarżą; Sakurajima: krater otwierany w 4 klatkach, lawa w kraterze w ruchu, wielka erupcja jako warstwa dymu i błyskawic |
| Osaka | takoyaki: falujące katsuobushi; fugu: nadymanie przed strzałem; maneki-neko: kiwanie łapą w 4 klatkach; bunraku: ruch głowy i rąk prowadzony przez kuroko (osobne pozy dla omo, hidari, ashi), bezwładne części po zestrzeleniu lalkarza; Tako: przyssawki na segmentach, mruganie i ruch źrenic za graczem, tusz z syfonu, opaska z powiewającymi końcami |
| Beppu | jajko: pękanie w 3 klatkach przed wykluciem; makak: chwytanie i ucieczka z łupem; dysza: żar i para w 3 klatkach; Wani: kłapanie w 3 klatkach, obrót śmierci jako sekwencja; Oni: wynurzanie ze stawu, unoszenie i uderzenie kanabō w 3+2 klatkach, złamanie rogu i pęknięcie maczugi jako przejścia faz, krzyk „ONI WA SOTO” z grymasem |
| Hiroszima | żuraw: machanie skrzydłami w 4 klatkach; ostryga: otwieranie w 3 klatkach (perła widoczna dopiero w ostatniej); Heike-gani: maska samuraja zapalająca się przy fazie 2, garda i kontratak w osobnych klatkach; Sankibō: łopot skrzydeł, zamach wachlarzem w 3 klatkach, płomienie pochodni w 4 i widmowe pochodnie z własnym kolorem |
| Nagasaki | lampion: kołysanie frędzli; biidoro: drganie szkła przed strzałem; hata: łopot ogona latawca; Oranda-bune: falujące żagle i flagi, dym z dział, przechył przy *mawashi*; Ja-odori: wąsy i grzywa w ruchu, otwieranie paszczy przed atakiem, drążki tancerzy pod segmentami, perła z poświatą, podział perły jako przejście fazy 3 |

**Budżet.** Więcej klatek to większe atlasy. Na start przyjmujemy najwyżej 1024 × 1024 na miasto
(Kioto ze względu na ogony do 1024 × 2048). Szacunkowo atlasy z tabeli „Inwentarz” rosną o 1,5–2,5 ×.
Żeby się zmieścić:
- prosty ruch rysujemy jako warstwę wtórną (krok 2a.7) albo odbijamy w kodzie, a nie jako pełne klatki;
- przycinamy puste piksele klatek; pivot zapisany w JSON-ie atlasu, więc kod się nie zmienia;
- symetryczne pary (ogony Kyūbi, łapy, szczypce, macki) rysujemy raz i odbijamy.

Każdą pozę wywoływaną przez kod (zapowiedź ataku, trafienie, faza) dopisujemy w module miasta
w `src/game/enemies/` obok ataku, którego dotyczy. Pętle zostają w `anims.create`. W kroku 3 dochodzi kontrola,
że żadna animacja nie zmienia czasu ataku: nagranie walki z `?god` z identycznym logiem ataków przed i po.

### Kioto (58 klatek) — pilot

| Przeciwnik | Klatki | Kierunek przebudowy |
| --- | --- | --- |
| Popcorn: dron-maska kitsune | `popcorn_0..1` | lakierowana maska z czerwonymi znakami, złote oczy, wirnik pod maską z rozmyciem w drugiej klatce |
| Strzelec: kanonierka pod belką torii | `shooter_0..1` | belka z cynobru i czarnym kasagi, lina shimenawa z papierowymi shide, lufa z mosiężnym pierścieniem |
| Nurek: chōchin-obake | `diver_0..1` | żebra papieru, prześwitujące światło świecy, jedno oko z połyskiem, poszarpany język |
| Nośnik: dron z klejnotem hōju | `carrier_{c}_0..1` | klejnot z wewnętrznym płomieniem w kolorze broni, złota oprawa w kształcie płomienia |
| Wieżyczka: kamienna latarnia tōrō | `turret_base`, `turret_head_0..15`, `turret_wreck` | faktura granitu, mech na daszku, świecące okienko; głowica: mosiężna lufa w 16 kierunkach; wrak: pęknięty kamień i rozsypane okruchy |
| Miniboss: tanuki z Shigaraki | `tanuki_0..1`, `tanuki_drum_0..1`, `tanuki_leaf_0..1` | szkliwiona ceramika z zaciekami, słomkowy kapelusz z fakturą plecionki, butelka sake z napisem, zeszyt rachunków; listek na kapeluszu u kopii wyraźny nawet w ruchu (to jest tell mechaniki) |
| Boss: Kyūbi | `kyubi_idle/blink/cast`, `kyubi_tail_*` (15), `kitsunebi_0..1`, `eb_fox*` | futro pasmami, shimenawa z papierowymi shide, klejnot hōju z odblaskiem; ogony z jaśniejszymi końcówkami i ogniem na czubkach; w `cast` oczy i pysk świecą; ogniki dwuwarstwowe (biały rdzeń, błękitna poświata), bo w fazach 2–3 są stałymi satelitami. Ogony to 60% atlasu Kioto: rysować je w 3 ×, ale przyciąć puste rogi klatek |
| Cienie chmur | `cshadow_*` | poza zakresem (to element tła) |

Kontrola specyficzna: kopie tanuki muszą się różnić od oryginału tylko listkiem, bo na tym polega trik.
Ogony muszą zachować punkty wylotu z `KYUBI_TAIL`.

### Okinawa (38 klatek)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: ryba tobiuo | łuski z opalizującym błękitem, rozpostarte płetwy-skrzydła z błoną, krople przy wyskoku |
| Strzelec: łódź hārī | malowany smoczy dziób i rufa, wiosła w dwóch klatkach, flaga |
| Nurek: wąż habu | wzór plam w zygzak, łuski brzuszne, połysk na grzbiecie |
| Nośnik: boja z ryukyuańskiego szkła | szkło z bąbelkami i refleksem, siatka z węzłami |
| Wieżyczka: koralowy bunkier | porowaty koral, czerwona dachówka z zaprawą, mała shisa na kalenicy |
| Miniboss: robo-manta | gładka skóra z plamkami, nity i panele, świecące skrzela, w czterech klatkach falowanie skrzydeł |
| Boss: shisa „A” i „Un” | glazurowana glina z pęknięciami i zaciekami, grzywa w lokach, złota kula u „A”; w fazie 3 ocalały rośnie do 1,2, więc detal musi znieść skalę |

### Sapporo (74 klatki)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: raniuszek shima-enaga | puszysta biała kulka z czarnymi brwiami-paskami, w stadzie musi się dać policzyć |
| Strzelec: lodowa latarnia | lód z wewnętrznymi pęknięciami (3 etapy, `tourou_0..2`) i płomień świecy; pęknięcia muszą czytelnie rosnąć, bo pokazują pancerz |
| Nurek: polatucha | futro, rozpięta błona lotna, duże oczy |
| Nośnik: miska miso ramen | para, chashu, naruto, pałeczki |
| Wieżyczka: bałwan | śnieg z fakturą, wiadro na głowie, marchewka; głowica w 16 kierunkach to dziś marchewka wskazująca cel, więc musi zostać czytelna |
| Pług wirnikowy | żółta karoseria z odpryskami, wirnik z łopatkami w dwóch klatkach, wyrzutnik śniegu w 16 kierunkach, wrak |
| Miniboss: Yuki-onna | białe kimono z falującym rąbkiem, długie czarne włosy, sine usta; mgła, kryształy i lustra (`mist`, `ice_crystal`, `yukimirror`) z drobnymi refleksami |
| Boss: niedźwiedź z Festiwalu Śniegu | rzeźba: lód z fakturą dłuta i przejrzystością, serce pulsujące wewnątrz; higuma: brunatne futro pasmami, pazury, w `kuma_1` otwarty pysk; łapy i serce osobno, bo to cele |
| Łosoś, sople, śnieżki | poza zakresem, jeśli zostają w pociskach; łosoś (`salmon`) jako pocisk z charakterem do decyzji |

### Kagoshima (32 klatki)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: bomba wulkaniczna | porowata skała z żarzącymi się szczelinami, smuga dymu; połówki `kazan_s` w tym samym stylu |
| Strzelec: arkebuz tanegashima | drewniane łoże, lont z iskrą, dron z herbem Satsumy |
| Nurek: kappa | zielona skóra, skorupa, talerzyk z wodą na głowie z odblaskiem; kręgi na wodzie (`ripple`) w drobnych pikselach |
| Nośnik: shirokuma | lody z mordką z owoców; 3 etapy topnienia muszą być czytelne |
| Wieżyczka: dzban kurozu | faktura ceramiki, sznur, pokrywka w dwóch klatkach i świecące oczy w środku |
| Miniboss: Raijū | futro z wyładowaniami, iskry w sierści, świecące ślepia |
| Boss: Sakurajima | kominy (`vent`) z warstwami lawy, krater zamknięty, otwarty i zastygły (`crater_shut/crater/crater_cold`), wraki kominów; to cele naziemne na tle, więc kontur musi je od tła odciąć |

### Osaka (28 klatek)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: takoyaki | przypieczona kulka, sos, majonez w zygzak, katsuobushi falujące w drugiej klatce |
| Strzelec: fugu | latarnia-ryba z Dōtonbori, kolce, wzór kropek |
| Nurek: kushikatsu | panierka z fakturą, patyczek, kropla sosu |
| Nośnik: cukierki ame | celofan ze skrętami, połysk |
| Wieżyczka: maneki-neko | porcelana, czerwona obroża z dzwonkiem, koban; łapa w dwóch klatkach |
| Miniboss: lalka bunraku i trzej kuroko | kostium samuraja z brokatem, maska z ruchomą brwią w `ningyo_1`; kuroko półprzezroczyści w czerni z kapturem |
| Boss: Tako | opaska sprzedawcy takoyaki z węzłem, skóra z plamkami, przyssawki na spodzie segmentów (`tseg_0..2`), końcówka macki (`ttip`) zwinięta; 8 macek w dwóch rzędach: tylne ciemniejsze, żeby było widać, że są cofnięte (faza 1) |

### Beppu (46 klatek)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: jajko onsen / mały oni | skorupa z drobnymi plamkami, pęknięcia przed wykluciem (`tamago_1`); `imp` z różkami i maczugą |
| Strzelec: garnek kamado z kucharzem oni | żeliwo, para z pokrywki, kucharz w opasce |
| Nurek: makak | futro, czerwony pysk, łapy wyciągnięte do kradzieży |
| Nośnik: drewniana balia oke | słoje drewna, metalowe obręcze, woda z parą |
| Wieżyczka: rura parowa i dysza | rdza, nity, czerwony żar przed strzałem (16 kierunków dyszy) |
| Gejzery | bulgotanie wody i błota (`boil`, `mudboil`) w drobnych pikselach |
| Miniboss: krokodyl Wani | łuski na grzbiecie z połyskiem wody, wersja zanurzona (`wani_sub`) tylko oczy i grzbiet |
| Boss: czerwony oni z Chinoike | mięśnie i skóra, kolczasta kanabō z fakturą żelaza, przepaska z tygrysiej skóry, złote oczy; `oni_hurt`; złamany róg w fazie 2 i pęknięta maczuga w fazie 3 to **nowe klatki** (dziś faza zmienia się tylko w kodzie), bo grafika ma nieść pancerz; masu z napisem 福 |

### Hiroszima i Miyajima (46 klatek)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: papierowy żuraw | zagięcia papieru z cieniem, wzór washi; stado |
| Strzelec: ostryga z Seto | muszla z warstwami, perła z refleksem w otwartej klatce; zamknięta i otwarta muszą się wyraźnie różnić, bo to mechanika krytycznego trafienia |
| Nurek: shamoji | drewniana łopatka z wypalonym napisem |
| Nośnik: momiji manjū | ciastko w kształcie liścia klonu z przypieczeniem |
| Wieżyczka: kamienna latarnia pływowa | glony i wodorosty na podstawie, mokry połysk (16 kierunków) |
| Miniboss: Heike-gani | pancerz z twarzą samuraja (legenda), szczypce z zębami; `heike_guard`; maska rozgniewana jako **nowa klatka** drugiej fazy |
| Boss: Sankibō | pióra skrzydeł, czerwona twarz z długim nosem, wachlarz hauchiwa w dwóch klatkach; pochodnie Kiezu-no-hi z płomieniem; widmowe pochodnie fazy 3 to dziś zabarwiona kopia, więc warto dorysować ich wersję |

### Nagasaki (41 klatek)

| Przeciwnik | Kierunek przebudowy |
| --- | --- |
| Popcorn: lampion | czerwony jedwab, złote frędzle, świecące wnętrze |
| Strzelec: biidoro | szklana zabawka z cienką szyjką i refleksem |
| Nurek: latawiec hata | wzór holenderskiej flagi i krawędź z papieru |
| Nośnik: castella | pudełko z napisem, przekrój ciasta |
| Wieżyczka: wciągarka portowa | stal, kable, zębatki (16 kierunków) |
| Miniboss: Oranda-bune | holenderski statek z kunchi: olinowanie, malowane burty, działa (`n_oranda_gun`), spalona burta (`n_oranda_burnt`); 106 px szerokości, największa klatka w mieście |
| Boss: Ja-odori | głowa smoka z wąsami i grzywą, segmenty ciała z łuskami i drążkami tancerzy, złota perła; druga perła fazy 3 jako osobna klatka; detal musi wytrzymać wynurzanie od skali 0,3 |

### Stan kroku 2a (listopad 2026)

Zrobione (klatki w atlasach miast, sterowanie w `src/game/enemies/`; wszystko tylko do oglądania, czasy i wzory
ataków bez zmian, co sprawdza zapis ataków przed i po z tym samym ziarnem losowania):
- **Kioto:** tanuki pije sake na przejściu do fazy 2 (`tanuki_sake_0..3`), bębnienie w 4 klatkach
  (`tanuki_drum_2/3` między uderzeniami), kopie rozsypują się w liście (`tanuki_poof_0..2`); ogniki na czubkach
  ogonów Kyūbi (warstwa ADD z klatek `kyubi_spirit`). Odrywanie ogona zostaje sekwencją w kodzie (dryf, zanik,
  niebieski ogień).
- **Okinawa:** w fazie 3 dusza poległej shisa (hitodama, `shisa_soul_0..3`) leci łukiem do ocalałej, która rośnie
  razem z nią.
- **Sapporo:** rzeźba kruszy się w niedźwiedzia na przejściu fazy (`kuma_thaw_0..3`), oszroniona sierść
  w zamieci fazy 3 (`kuma_0f/1f`), kłąb oddechu przy ryku (`kuma_breath_0..3`).
- **Kagoshima:** skorupa krateru pęka i odpada w lawę na początku fazy 2 (`crater_open_0..3`), wyładowania
  w sierści Raijū (`raiju_spark_0..3`, ADD, mocniejsze przy zamachu do szarży i w fazie 2).
- **Osaka:** oczy Tako śledzą gracza i mrugają (`tako_eyes_0..3`).
- **Beppu:** w fazie 3 pęknięta kanabō (`oni_*_c`).
- **Hiroszima:** pęknięty pancerz kraba w fazie 2 (`heike_*_c`; po zmianie na taka-ashi-gani nie ma już maski
  samuraja), zamach wachlarzem Sankibō z klatką uniesienia (`sankibo_fan_up_l/r`).
- **Nagasaki:** ciało smoka jako jeden ciągły wąż (segmenty obrócone wzdłuż łańcucha), pulsująca poświata perły
  (i drugiej perły w fazie 3).
- **Wspólne:** pęknięcia bossów w 540 px (`crack_0..2` w każdym atlasie miasta), osobne losowanie dla wyglądu
  (`Enemies.vrand`), warstwy dekoracyjne wyłączane przez `?noprops`, `?hitbox` z obrysami trafień, ciaśniejsze
  pakowanie atlasów (`packAtlasTight`).

Świadomie inaczej niż w planie: narysowane stany zniszczeń zamiast losowych pęknięć zrobione tylko tam, gdzie niosą
znaczenie (róg i maczuga Oni, pancerz kraba, szron niedźwiedzia); u reszty zostają pęknięcia w 540 px. Reakcja na
trafienie zostaje błyskiem i odrzutem (osobne klatki grymasu myliłyby się z zapowiedziami ataków, np. rykiem).

## Krok 3. Warunek ukończenia każdego miasta

Tak samo jak w `graphics-540-plan.md`, krok 4, oraz dodatkowo:

- arkusz porównawczy stary / nowy w `tools/preview/` dla każdej klatki i animacji;
- przejście `?stage=N&t=<boss − 5>&god` przy wysokości 320 i 420 oraz na telefonie, wszystkie fazy bossa
  i minibossa; trafienia, odrzut, oddech, pęknięcia (`wounds`), błysk trafienia i tint szału wyglądają poprawnie;
- pozycje wylotów pocisków i promienie trafień zgadzają się z rysunkiem (podgląd z `?debug` z obrysem `radius`
  i `segs` dorobić w kroku 1);
- czytelność: przeciwnik oddziela się od tła, a pociski są jaśniejsze niż sprite przeciwnika;
- album yōkai i parada w zakończeniu pokazują nowe portrety;
- pamięć tekstur i czas wczytania miasta (atlas wroga ładuje się razem z tłem); bez przycięć przy przejściu
  do następnego miasta (panel debugowania: TEKSTURA);
- `npm test`, `npm run build`, działanie offline po aktualizacji cache PWA.

## Krok 4. Po wszystkich miastach

1. Usunąć stare klatki przeciwników ze wspólnego `sprites.png` (zostają statki, pociski, efekty, HUD).
2. Zdecydować o pociskach wrogów, wybuchach, pęknięciach i odłamkach (`eb_*`, `expl_*`, `crack_*`, `debris`).
   Przy szczegółowych przeciwnikach stare 1 × mogą odstawać, ale to osobny zakres, który dotyka czytelności walki.
3. Zaktualizować README (sekcja „Grafika”).

## Kolejność pracy i rozmiar

| Etap | Zawartość | Uwagi |
| --- | --- | --- |
| 1 | infrastruktura (krok 1) + Kioto | pilot: tu zapada decyzja o stylu, grubości konturu i ilości detalu |
| 2 | Okinawa, Sapporo | Sapporo ma najwięcej klatek (74, w tym 2 × 16 kierunków) |
| 3 | Kagoshima, Osaka | Tako: 8 macek, przyssawki segmentów |
| 4 | Beppu | nowe klatki faz Oni (róg, maczuga) |
| 5 | Hiroszima, Nagasaki | nowa klatka Heike-gani, druga perła, Oranda-bune |
| 6 | krok 4 | sprzątanie wspólnego atlasu, decyzja o pociskach |

Każde miasto to osobny commit (albo dwa: zwykli wrogowie, potem miniboss i boss), z arkuszem porównawczym
do oceny przed następnym.
