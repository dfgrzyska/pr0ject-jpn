# pr0ject-jpn — Kioto, Okinawa, Sapporo, Kagoshima, Osaka, Beppu

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

Parametry do testów w adresie: `?stage=1` … `?stage=6` (ten etap pierwszy, reszta losowo — 1 Kioto, 2 Okinawa, 3 Sapporo, 4 Kagoshima, 5 Osaka, 6 Beppu), `?t=120` (start od 120 s etapu), `?god` (nieśmiertelność), `?ending` (od razu zakończenie po zmyślonej podróży),
`?weapon=laser&power=5` (broń `basic|spread|laser|homing`, moc 1–5), `?ship=oni|kitsune|tsubame`,
`?noprops` (tło bez animacji). Z `?god` albo `?t=` pieczątek nie da się zdobyć.

## Panel debugowania

Napis DEBUG w prawym górnym rogu ekranu tytułowego i ekranu pauzy (albo klawisz G) włącza i wyłącza panel
w lewym górnym rogu; ustawienie zostaje w przeglądarce (`src/game/Debug.js`). Panel tylko patrzy, nic w grze
nie zmienia. Pokazuje:

- FPS oraz średni i najdłuższy czas klatki z ostatniej sekundy (ms);
- ile średnio z klatki zajmuje logika gry (LOGIKA) i rysowanie (RYS), a z logiki żywe tło (TŁO), wrogowie (WRG)
  i pociski (POC) — gdy obie liczby są małe, a klatek ubywa, czas zjada przeglądarka albo telefon;
- MUZ: planowanie muzyki (średnio na klatkę i najdłuższe w ostatniej sekundzie) — nuty są budowane z węzłów
  Web Audio zaraz po narysowaniu klatki, kiedy do następnej jest najwięcej czasu (z zegara tylko wtedy, gdy
  klatek nie ma, np. w schowanej karcie), żeby nie opóźniały klatek na telefonie;
- wykres ostatnich 90 klatek (2 ms na piksel, kreska na 16,7 ms): szare na czas, żółte spóźnione, czerwone
  przycięcia — przerwy między klatkami dłuższe niż 25 ms;
- liczbę przycięć od początku etapu i trzy ostatnie: sekunda etapu, długość i co działo się tuż przed nim —
  TEKSTURA (doszedł obraz tła innego miasta, które gra wczytuje w trakcie gry), TŁO, WROGOWIE, POCISKI,
  RYSOWANIE (ta część poprzedniej klatki trwała ponad 6 ms), MUZYKA (ponad 3 ms) albo „?”, gdy nic z tego (zwykle przeglądarka
  sprzątająca pamięć albo telefon zajęty czymś innym);
- pociski wrogów i wrogów na ekranie, aktywne elementy żywego tła (z wszystkich na mapie), obiekty na scenie;
- ile plików tła innych miast już doszło (z ilu) i czas etapu.

Płynność na telefonie: gra nie tworzy obiektów w trakcie etapu, tylko używa gotowych. Pule sprite'ów
(pociski, strzały, efekty, wrogowie) i obrazki żywego tła są tworzone na starcie etapu: tyle na każdej głębokości,
ile może być naraz na ekranie (policzone z listy ruchomych elementów). Drobne opadające cząsteczki
(popiół, żar, płatki sakury, śnieg; w burzy i zamieci po kilkaset naraz) rysuje jeden blitter zamiast setek
sprite'ów. Ruchome elementy tła są przeliczane bez tworzenia obiektów pomocniczych w każdej klatce.

## Na telefonie, offline, po angielsku

Grę można zainstalować jak aplikację: na Androidzie (i w Chrome / Edge na komputerze) na ekranie tytułowym
pojawia się strzałka w lewym rogu (albo klawisz I), na iPhonie ekran tytułowy podpowiada „Udostępnij → Do ekranu
początkowego”. Zainstalowana otwiera się na pełnym ekranie, w pionie. Po pierwszym wejściu działa też bez
internetu: service worker (`public/sw.js`) trzyma w pamięci wszystkie pliki gry, a online zawsze bierze najnowszą
wersję (`src/pwa.js`, `public/manifest.webmanifest`).

Przełącznik PL / EN jest w lewym rogu ekranu tytułowego (albo klawisz L); za pierwszym razem język wybiera się
sam według przeglądarki i zostaje zapamiętany. Gra jest napisana po polsku, a angielskie teksty podstawia
`src/i18n.js` w miejscu, gdzie napisy są rysowane (rozmówki fraz i wzorców z liczbami).

## Książeczka pieczątek

Za każde miasto można zdobyć pieczątkę w stylu stempli z japońskich dworców (eki sutanpu): trzeba przejść jego
etap bez utraty życia i bez użycia bomby. Póki się da, pod życiami świeci mała pieczęć w kolorze miasta (po
śmierci albo bombie szarzeje i znika); po bossie pieczątka spada na ekran wyników z głuchym stuknięciem, a na
mapie Japonii zdobyte miasta mają znaczek. Książeczkę z sześcioma ramkami (data zdobycia pod każdą pieczątką)
otwiera ikona w lewym górnym rogu ekranu tytułowego albo klawisz K. Pieczątki zapisują się w przeglądarce
(`src/game/Stamps.js`), a rysuje je `tools/art/stamps.mjs`: pagoda Yasaka (Kioto), brama Shureimon nad falami
(Okinawa), wieża telewizyjna w śniegu (Sapporo), wybuchająca Sakurajima (Kagoshima), zamek (Osaka) i znak ♨
gorących źródeł (Beppu), każda innym tuszem. Pieczątka zdobyta w trybie łatwym jest blada (w książeczce z
podpisem „NA ŁATWYM” zamiast daty); to samo miasto przejście na normalnym odbija w pełnym kolorze.

## Zakończenie

Po wynikach ostatniego miasta gra się nie urywa: przychodzi zakończenie w pięciu scenach, każdą można przewinąć
dotknięciem albo Enterem (`src/game/Ending.js`), przy spokojnym utworze — głównym motywie Kioto zwolnionym do
pożegnania:
1. **Mapa podróży** — na mapie Japonii rysuje się cała przebyta trasa, miasto po mieście zapala się na złoto,
   a statek odlatuje z ostatniego miasta poza mapę.
2. **Pieczęcie podróży** — na papierze washi przybijane są po kolei pieczęcie sześciu miast z kanji ich nazw,
   z głuchym stuknięciem; przy miastach, w których w tej grze zdobyto pieczątkę, stoi jej znaczek. Na dole
   licznik pieczątek z tej gry, a przy komplecie „KOMPLET W JEDNEJ GRZE!”.
3. **Podsumowanie** — wynik i rekord, statek, stracone statki, użyte bomby, czas gry i pieczątki (na łatwym
   także kontynuacje i zachęta do trybu normalnego; podróż bez straty dostaje osobny napis).
4. **Bossowie podróży** — jak napisy końcowe przesuwają się Kyūbi z ogonami, para shisa, niedźwiedź, Sakurajima,
   ośmiornica i oni, z imionami i miastami, w kolejności tej podróży.
5. **Fudżi o wschodzie** — ilustracja (`tools/art/ending.mjs`): Fudżi ze słońcem wschodzącym zza zbocza nad
   morzem chmur (pas chmur dryfuje), pagoda Chūreitō wśród kwitnących wiśni, gałąź sakury; statek gracza
   przelatuje ku słońcu, sypią się płatki, logo przybija się jak pieczątka, „DZIĘKUJEMY ZA GRĘ” — i powrót do
   ekranu tytułowego.

Gra liczy przez całą podróż straty, bomby, czas i zdobyte pieczątki (przenoszone między etapami razem z wynikiem).

## Tryb łatwy

Na ekranie wyboru statku, pod statystykami, jest przełącznik TRYB: NORMALNY / ŁATWY (dotknięcie albo strzałki
góra / dół), zapamiętywany w przeglądarce. Łatwy to ta sama gra — te same miasta, fale, bossowie i ataki — tylko
z łagodniejszymi liczbami (`EASY` w `src/config.js`, `src/difficulty.js`):

| | Normalny | Łatwy |
| --- | --- | --- |
| Życia (Oni / Kitsune / Tsubame) | 3 / 3 / 2 | 5 / 5 / 4 |
| Trafienie z gotową bombą | śmierć | bomba wybucha sama („AUTOBOMBA!”) |
| Koniec gry | od nowa | „KONTYNUOWAĆ?” przez 10 s: dalej w tym samym miejscu, pełne życia, wynik od zera |
| Utrata mocy po śmierci | −1 poziom | brak |
| Nieśmiertelność po odrodzeniu | 2,5 s | 3,5 s |
| Otarcia do nowej bomby | 40 | 30 |
| Prędkość pocisków | ×1 | ×0,85 |
| Pociski w wachlarzach i pierścieniach | wszystkie | ok. 30% mniej (7→5, 14→10; celowany środkowy zostaje) |
| Rozprysk śnieżek, butelek sake, lawy, takoyaki | 4 | 3 |
| Wrogowie nie strzelają w dolnej części ekranu | od 62% wysokości | od 55% (bossowie jak na normalnym) |
| Cisza po wejściu wroga | 0,7 s | 1,0 s |
| Strzelający drobni wrogowie | 25% | 12% |
| Ostrzeżenia (pioruny, gejzery, szczelina oni) | ×1 | ×1,3 |
| Wytrzymałość bossów i minibossów | 100% | 75% |
| Zacięcie przegrzanej broni (Beppu) | 1,8 s | 1,0 s |

W grze przy mnożniku świeci zielone „ŁATWY”, a wyniki i koniec gry pokazują „TRYB ŁATWY” i liczbę kontynuacji.
Łatwy ma osobny rekord. Kropka trafienia, broń gracza i punkty za wrogów są takie same.

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
- Klawiatura: strzałki / WASD — ruch, Z — bomba, Esc / P — pauza, M — dźwięk, Enter — start; na ekranie tytułowym
  K — książeczka pieczątek, L — polski / angielski, I — instalacja (gdy przeglądarka na to pozwala); na ekranie
  wyboru statku góra / dół — tryb normalny / łatwy.
- Strzał jest automatyczny.
- Palec trzymany na ekranie po utracie statku przejmuje nowy statek przy pierwszym ruchu (nie trzeba dotykać od nowa);
  róg bomby bez bomby steruje jak reszta ekranu.

Punkty i bomba:
- **Ocieranie się (graze)** — pocisk przelatujący tuż obok kropki statku (do 8 px, `GRAZE` w `src/config.js`)
  daje 30 × mnożnik punktów i iskrę; gdy bomba jest zużyta, każde otarcie ładuje złoty pierścień wokół przycisku
  bomby, a 40 otarć oddaje bombę („BOMBA GOTOWA”). Nie liczy się w czasie migania po odrodzeniu.
- **Karty bossów** — 3 s przed minibossem i bossem przez ekran przejeżdża pasek z jego imieniem i podtytułem
  (pole `card` fali w `stageN.json`), z alarmem i okrzykiem kakegoe „yoo!”.
- **Zatrzymanie akcji** — przy zestrzeleniu minibossa (0,3 s) i bossa (0,45 s) gra na chwilę zamiera w błysku,
  a dopiero potem wybuchają eksplozje.

## Etap 1

Pas tła (warstwa środkowa) ~7 tys. px, ok. 3,5 min — przelot nad Kioto:
- **Gion** (0–7 s): Hanamikōji — gęste machiya z kratownicami koshi, płotkami inuyarai, doniczkami, rowerami
  i lampionami pod okapami, czerwona herbaciarnia Ichiriki-tei, maiko i riksze, kanał Shirakawa z wierzbami
  i mostkiem Tatsumi, pięciopiętrowa pagoda Yasaka, cynobrowa brama chramu Yasaka;
- **Kamogawa**: kamienie-żółwie w poprzek rzeki, tratwy płatków sakury (hanaikada) spływające z nurtem, kanie krążące nad wodą, tarasy yuka w Pontochō z lampionami, pary siedzące
  w równych odstępach na brzegu, czaple, most Shijō;
- **Fushimi Inari** (8–47 s): aleja ze sklepikami (maski kitsune na straganach), wielka torii, chram (Rōmon,
  honden, scena kagura, ściany beczek sake, czerwone flagi nobori, święte drzewa z shimenawa, tłumy);
- **Senbon Torii** (47–76 s): tunele torii na grzbiecie (z rozwidleniem na dwa) z pielgrzymami migającymi
  między bramami, kopce otsuka, lis przemykający między nimi, smugi słońca na zboczach;
- **Arashiyama** (76–103 s): gaj bambusowy z płotkami z chrustu i rikszami, czarna torii chramu Nonomiya
  (dróżka od ścieżki przez lukę w płotku),
  smugi słońca w gaju i spacerowicze w wypożyczonych kimonach, staw Sōgenchi z ogrodu Tenryū-ji (wysepka z sosną,
  skalny wodospad, żwir przed werandą pawilonu) na końcu gaju, hanami na niebieskich plandekach pod wiśniami nad rzeką,
  rzeka Katsura z mostem Togetsukyō i łodziami;
- **Kinkaku-ji** (103–133 s): Złoty Pawilon odbity w lustrzanym stawie z wysepkami, wodospad Ryūmon,
  mchowy ogród, herbaciarnia Sekka-tei; żwirowa ścieżka od bramy Sōmon biegnie przez cały ogród aż do Ryōan-ji,
  z odejściami do dzwonnicy i pawilonu opata;
- **Ryōan-ji** (133–153 s): ogród kamienny — grabiony żwir, 15 kamieni w omszałych obwódkach, gliniany mur,
  weranda z siedzącymi gośćmi, mnich grabiący proste linie żwiru; ścieżka okrąża ogród od wschodu do wejścia pawilonu;
- **Kiyomizu-dera** (153–196 s): brukowana ulica Gojō-zaka u stóp wzgórza i odchodzące od niej schody Sannenzaka
  między sklepikami z ceramiką, brama Niōmon z lwami, dzwonnica, trzypiętrowe pagody, wodospad Otowa, wielki
  drewniany taras na kracie pali nad doliną wiśni, za główną halą ścieżka do chramu Jishu i Okunoinu i dalej w górę;
- **Daimonji o zmierzchu** (196–216 s): znak 大 z płonących stosów na zboczu (Gozan Okuribi), iskry lecące
  w górę, strażnicy ognia wspinający się ścieżką z pochodniami; tu przewijanie
  staje (pole `stop` w `scroll` w `stage1.json`, cały znak na ekranie) i budzi się boss.

Paralaksa: na grzbiecie z torii daleka warstwa to dolina pod spodem (zapętlona), środkowa — miasto,
świątynie i drzewa (wieżyczki są do niej przyczepione), bliska — płatki sakury i mgła.

Wrogowie (roboty w stylu Fushimi Inari):

| Archetyp | Wygląd | Zachowanie |
| --- | --- | --- |
| Popcorn | dron-maska kitsune | formacje: `line`, `sine`, `arc`, `row` |
| Strzelec | kanonierka podwieszona pod belką torii | wlatuje, staje, strzela celowanymi seriami (`aimed`/`fan`), odlatuje |
| Wieżyczka | kamienna latarnia tōrō z działem | na warstwie terenu, wachlarz (`fan`) lub pierścień (`ring`) |
| Nurek | chōchin-obake — czerwony papierowy lampion-yōkai z parady stu demonów (jedno oko, zęby, wywalony język) | zawisa, celuje i pikuje w gracza |
| Ciężki | tanuki — figurka z Shigaraki (kapelusz, butelka sake, zeszyt rachunków) | miniboss (ok. 150 s, nad Ryōan-ji): bębni w brzuch (pierścień na każde „pon”), rzuca butelkami sake z celownikiem na ziemi, zmienia się listkiem w trzy tanuki — kopie mają listek na kapeluszu i pękają od jednego trafienia; naraz najwyżej ok. 50 pocisków |
| Nośnik | dron z klejnotem hōju (czerwony/niebieski/zielony) | zygzak, po ~4,6 s ucieka, zawsze zostawia znajdźkę |

Znajdźki: czerwona — rozrzut, niebieska — laser, zielona — naprowadzane „lisie ognie”.

Boss: Kyūbi, lis o dziewięciu ogonach — dziki lis z chramu Inari (słomiana lina shimenawa na szyi, klejnot hōju na
piersi). Gdy tło stanie, lisi ogień zlatuje się nad głowę znaku 大, z płomieni wyłania się ciało, a ogony
rozkładają się jeden po drugim od środka (podmuch pobudki zmiata resztki fal). Ogony to osobne sprite'y
(`tools/art/kyoto/kyubi.mjs`): co 1/9 życia odrywa mu się skrajny i spala w lisim ogniu, a z niego wylatuje
błędny ognik, który przez chwilę goni gracza. Ataki: kitsune-bi (z końca każdego ogona ognik, który zawisa
i leci w gracza — im mniej ogonów, tym mniej ogników), Daimonji (znak 大 na zboczu zapala się kreska po kresce,
w kolejności pisania, najpierw pierścienie ostrzeżenia — bezpiecznie jest między kreskami), smagnięcie ogonami
(wachlarze z końców ogonów po kolei) i lisi taniec (spirala). Poniżej 35% życia wpada w szał: ogony płoną
na niebiesko, dochodzą pierścienie, a spirala ma trzy ramiona (ale rzadsza). Między atakami jest chwila oddechu
i naraz na ekranie jest najwyżej ok. 50 pocisków, także w szale. Mruga, a przy ataku otwiera pysk i rozpala oczy.

## Etap 2

Okinawa, ok. 3,5 min: morze z wyspami Kerama (zalesione wzgórza, białe plaże i skaliste cyple w najczystszej
wodzie Japonii, łodzie nurków z bąblami na powierzchni, kajaki i chatka na plaży), rafami i łodziami sabani →
plaża kurortu (parasole, hotel z podjazdem i parkingiem od drogi nadmorskiej, basen; przy brzegu motorówka z paralotnią, banana boat i skutery wodne) → wioska Bise pod drzewami fukugi (główna uliczka schodzi do drogi nadmorskiej): piaszczyste, kręte uliczki w gęstych
szpalerach fukugi, każde obejście w osobnym pierścieniu drzew z koralowym murkiem, ekranem hinpun za bramą,
domem pod czerwoną dachówką z shisa na kalenicy, przybudówką i grządkami, rowerzyści i spacerowicze → pola trzciny cukrowej i ananasów
(żniwa: na pół ścięte pole ze ścierniskiem i snopkami, ścinacze trzciny, ciężarówka załadowana pod sufit; cukrownia z blaszaną
halą, kotłownią, ceglanym kominem w dymie i stertami trzciny na placu otwartym na ostatnią uliczkę wioski) → Naha w drodze na Shuri: zbocze z grobami-żółwiami
kamekōbaka (przed jednym rodzina świętuje Shīmī na kocu z pudełkami jedzenia), ulica garncarzy Tsuboya
Yachimun-dōri (bruk z płyt wapienia, warsztaty pod czerwoną dachówką, galerie, shisa na słupkach bram, garnki
i dzbany, stary piec schodkowy noborigama z drewnem na opał i deskami suszących się naczyń, koty), rynek
Makishi pod szklanym dachem (stragany z kolorowymi rybami, homarami, małżami olbrzymimi, winogronami morskimi
i owocami) z pasażem Heiwa-dōri, sklepy z koszulami kariyushi, sanshinami i sata andagi → Kokusai-dōri
zamknięta dla parady eisa (chorąży, bębniarze z ōdaiko i shime-daiko, tancerki, klaun chondārā), restauracja
w stylu Ryūkyū z dziedzińcem, plac z zespołem sanshin → zamek Shuri (brukowane podejście od końca Kokusai-dōri przez Shureimon i bramę
w zakrzywionych murach na pasiasty dziedziniec pod halą Seiden) → las Yanbaru: kręta droga (wjeżdża zza
wschodniej krawędzi, od drogi wzdłuż wybrzeża, za zamkiem) z żółtymi znakami ostrzegającymi przed ptakami kuina (i kuinami
przebiegającymi przez jezdnię), wodospad Hiji spadający ze skalnego progu do jeziorka, strumień do klifów pod
wiszącym mostkiem i drogą, ścieżka z tarasem widokowym, mgła płynąca nad koronami → most Kōri: dwa kilometry
prosto nad szmaragdową płycizną, z latarniami, cieniem na wodzie i jadącymi autami → wyspa Kōri (domy, trzcina,
parking przy plaży Tinu i dwie skały Heart Rock w płytkiej wodzie) → otwarte morze z rafami widocznymi pod wodą
(kępy korali, piaszczyste kanały), ławicami ryb, mantami i humbakami, które wyskakują, pokazują płetwy ogonowe
i wydmuchują fontanny (miniboss) → wyspa z latarnią (ścieżka od domku latarnika do pomostu z łodzią
zaopatrzeniową) → otwarte morze z bossem.

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

Sapporo zimą, ok. 3,5 min, od zachodu słońca przez różowy i fioletowy zmierzch nad przedmieściem i niebieską
godzinę w centrum do nocy od Susukino: skocznia Ōkurayama (rozbieg, zeskok z liniami, stadion z drogą
dojazdową i parkingiem, wyciąg krzesełkowy, ratrak wygładzający zeskok, kibice machający flagami, droga
z przedmieścia na szczyt skoczni z kilkoma domami na skraju lasu) → przedmieścia z kolorowymi blaszanymi dachami pod śniegiem, zbiornikami na naftę,
zasypanymi autami i strzałkami yabane nad drogami → centrum: wieża zegarowa Tokeidai, ceglany Akarenga
z ośmiokątną kopułą i czerwonymi gwiazdami, targ Nijō (długa hala straganów rybnych pod zaśnieżonymi dachami:
kraby królewskie, jeżowce, kawior z łososia i łososie pod kolorowymi markizami, kupujący, para z grilla), ruch
lewostronny (auta jadą w górę zachodnim pasem Ekimae-dōri, na wschodnim stoi korek, przecznicami w obie strony),
parujące studzienki i okna biurowców gasnące i zapalające się → neony Susukino z tramwajem na przecznicy
i zaułek ramen z lampionami →
zamarznięta rzeka Toyohira z mostami → park Nakajima (ścieżki od mostów, staw, Hōheikan, sala koncertowa, górka saneczkowa z dziećmi; zamieć i miniboss) →
Festiwal Śniegu w parku Ōdōri: ogród lodowych rzeźb świecących od środka i od kolorowych lamp (smok, para
łabędzi z szyjami w serce, sowa rybołowna, lis, skacząca orka, krab, lotos i bryły lodu z zamrożonymi rybami),
wielki śnieżny zamek (kamienny cokół ze schodami, pięć pięter z oknami, dachy z zadartymi rogami, szczyty chidori
i kara, złote shachihoko) z projekcją świetlną przesuwającą kolory po ścianach, zjeżdżalnia, kamakura, żuraw
tanchō, rampa big air, stragany, podświetlone drzewa → plac pod wieżą telewizyjną z cokołem rzeźby niedźwiedzia.

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
miasto (dworzec Chūō z diabelskim młynem na dachu i peronem na wiadukcie kolejowym, po którym przejeżdżają
pociągi; tramwaj po torach porośniętych trawą środkiem alei aż do zajezdni nad rzeką — brama, cztery tory, hala,
warsztat; aleja palm, pasaż Tenmonkan, żółte worki na popiół na rogach ulic, wzgórze Shiroyama) → rzeka Kōtsuki
z dwoma kamiennymi mostami: lewy do bramy ogrodu, prawy w nadmorską drogę → ogród Sengan-en nad morzem (brama
w murze nad rzeką, ścieżka do rezydencji Shimadzu i kamiennego Shūseikanu, replika armaty; wzdłuż brzegu droga
i kolej Nippō, która wychodzi tu z tunelu pod Shiroyamą) →
czarna plaża z kąpielami w gorącym piasku jak w Ibusuki (rzędy zakopanych po szyję kąpiących się w yukatach
i ręcznikach na głowach, maty z trzciny, łaźnia z dróżką przez tory, para sącząca się z piasku, pomocnicy
z łopatami) → pola
tysięcy czarnych dzbanów z octem kurozu → zatoka Kinkō (statek wycieczkowy przy molo na początku zatoki,
terminal promowy u nasady molo i promy kursujące stamtąd do molo na Sakurajimie,
farma ryb z ośmioma sadzami, pomostami i łodzią karmiącą, inne sadze, łodzie, delfiny, cień chmury popiołu
sunący po wodzie; burza popiołowa i miniboss) → Sakurajima (przystań z długą kąpielą dla stóp nad morzem, wioska pod popiołem z uliczkami między rzędami domów, schrony przed bombami wulkanicznymi, pola
olbrzymiej rzodkwi daikon, sady komikan, zasypana brama torii w Kurokami) → pola lawy z 1914 r. (jedna droga z portu
przez wioskę i dalej krętą serpentyną przez lawę do punktu widokowego Yunohira z parkingiem — na krater drogi nie
ma; śmieciarki zamiatające popiół, kępy rdestu, pod kraterem spadające bomby wulkaniczne) → krater.

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

## Osaka

Ok. 3,5 min od popołudnia do nocy. Zamek Osaka wiosną: hanami pod kwitnącymi wiśniami (niebieskie maty
z piknikującymi, kramy z pasiastymi markizami i lampionami, fontanna), szerokie zielone fosy z łodziami
gozabune, staw w ogrodzie Nishinomaru z mostkiem taikobashi na wysepkę z sosną i kamieniami do
herbaciarni, wysokie mury ishigaki z widocznym licem z wielkich kamieni i narożnikami sangi-zumi, białe mury tamon
z narożnymi wieżami yagura i bramami, gaj śliwowy, chram Hōkoku i Miraiza ze ścieżkami od alejki, olbrzymi kamień Takoishi w bramie
Sakuramon, a w Honmaru pięciodachowy donżon na kamiennym podeście — zielona miedź, białe ściany, szczyty
chidori- i kara-hafu, czarno-złote najwyższe piętro i złote shachihoko, ze schodkowym cieniem; drewniany most
Gokuraku-bashi → Nakanoshima między dwiema rzekami (ceglana Central Public Hall z łukowym dachem, ratusz,
biblioteka z kopułą, ogród różany, promenady z lampami, statki i tramwaj wodny) → wieżowce Umedy (szklane
fasady, lądowiska na dachach, Sky Building z ogrodem na moście, czerwony diabelski młyn na dachu, dworzec
pod wielkim szklanym dachem, aleja Midōsuji z drzewami; ruch lewostronny w obie strony na trzech alejach
i przecznicach — auta skręcają z przecznic przy krawędzi ekranu i przed dworcem, nie przejeżdżają przez tory) → Shinsekai z Tsūtenkaku, zaułkiem Janjan,
lampionem-rozdymką i neonami, Abeno Harukas → kanał Dōtonbori nocą (otwarty na obu końcach jak prawdziwy:
na dole skręca na wschód, u góry na zachód, za krawędzie mapy; neony, wielkie szyldy z ośmiornicą, krabem,
takoyaki, gyoza, sushi i ramenem, tłumy na moście Ebisu, stateczki) → Osaka nocą: Hōzen-ji Yokochō (brukowana
uliczka z lampionami, omszały posąg Mizukake Fudō, ściany lampionów wotywnych, kadzielnica) → chram Namba Yasaka
z ogromną głową lwa ze sceną w pysku i girlandami lampionów → targ Kuromon Ichiba pod szklanym dachem (stragany
z rybami, krabami, tuńczykiem, jeżowcami, owocami i grillami) → Shitennō-ji (pięciopiętrowa pagoda, złota hala,
cynobrowe krużganki, staw z żółwiami) → Sumiyoshi Taisha (aleja kamiennych latarni, łukowy most Sorihashi
przez staw w osi alei, dalej ścieżka do bram w płotach wokół hal ze skrzyżowanymi belkami chigi) → nabrzeże Tempozan (diabelski młyn, akwarium
Kaiyūkan, fontanna, drzewa z iluminacją, rząd straganów yatai z lampionami na bulwarze) → zatoka z czerwonym mostem
Minato Ōhashi, żaglowcem Santa Maria przycumowanym burtą do prostego nabrzeża, łodziami rybackimi pod lampami, nabrzeżem kontenerowym z dźwigami przy lewym brzegu
i holownikami — tu wynurza się ośmiornica.

Zwrot dla zwykłych wrogów — **pary manzai** (boke i tsukkomi, osakańska komedia w duecie): każdy wróg ma
partnera (łączy ich cienka linia). Zestrzel jednego, a drugi wpada we wściekłość („!?”, czerwienieje) i od razu
strzela; zestrzel oba w ciągu 1,2 s, a dostaniesz bonus „NANDE YANEN!”. Pary to dwa kolejne egzemplarze tej
samej fali albo fale z tym samym polem `duo` w `stage5.json`.

| Archetyp | Wygląd |
| --- | --- |
| Popcorn | latające takoyaki z tańczącymi płatkami bonito |
| Strzelec | papierowy lampion-rozdymka (fugu) |
| Wieżyczka | maneki-neko na stoisku — łapka macha coraz szybciej przed strzałem |
| Nurek | kushikatsu — szaszłyk pikujący jak włócznia |
| Nośnik | zawinięty cukierek ame (chindon-ya zaczęło się podobno od osakańskiego sprzedawcy cukierków) |

Miniboss: lalka bunraku (Osaka to dom teatru bunraku) — samuraj prowadzony przez trzech lalkarzy w czerni.
Lalki nie da się trafić (strzały przez nią przelatują); każdy lalkarz prowadzi jeden atak: omozukai — głowa
i prawa ręka (miecz, szeroki wachlarz), hidarizukai — lewa ręka (strumień), ashizukai — nogi (tupnięcia
i taniec). Zestrzelony lalkarz = bezwładna część; bez wszystkich trzech lalka upada.

Boss: olbrzymia ośmiornica w opasce sprzedawcy takoyaki. Cztery macki z segmentów kołyszą się i podwijają,
plują pierścieniami z końcówek, uderzają w dół (najpierw migająca linia), głowa rzuca takoyaki z celownikiem;
trafienie w dowolny segment rani mackę. Po odcięciu wszystkich macek łeb staje się celem: spirala tuszu, na zmianę
trzy duże kule tuszu i pierścień, grad takoyaki (salwa co sekundę: jedno ląduje przy graczu, drugie obok, każde
rozpryskuje się na 3 pociski); poniżej 35% wpada w szał (spirala o trzech ramionach, ale rzadsza). Ataki są dobrane
tak, żeby na ekranie było naraz najwyżej ok. 40 pocisków, także w szale.

## Beppu

Ok. 3,5 min od mglistego poranka do czerwonego zmierzchu w mieście gorących źródeł: zatoka z promem i łodziami,
plaża z czarnym piaskiem (zakopani kąpiący się, parasole, hala kąpieli piaskowych), promenada z palmami i rząd
wysokich hoteli z basenami → dworzec z pociągiem, Beppu Tower, zadaszony pasaż handlowy, łaźnia Takegawara
z zakrzywionym szczytem karahafu, gęsta zabudowa → Kannawa: zbocze ciasno upakowanych dachów, stroma uliczka
Ideyu-zaka z lampionami i ludźmi w yukatach, kuchnia parowa jigoku-mushi, kąpiel dla stóp, ryokany z ogrodami i taras widokowy,
a w górze zbocza tarasy strzechowych chatek Myōban, w których na niebieskiej glince rośnie sól kąpielowa
yu-no-hana (para sączy się spod okapów) →
„piekła” (jigoku) na żwirowych dziedzińcach w ogrodach (bramy tam, gdzie dochodzą ścieżki; parking
autokarów i parking zajazdu z wjazdami na główną ścieżkę): kobaltowy Umi Jigoku z czerwoną kapliczką i ogromnymi
liśćmi lilii wiktorii, koszykiem jajek gotujących się na bambusowym stelażu i barierką ze zwiedzającymi, szare błoto Oniishibozu, kolorowe stawy Kamado z kucharzem-oni na kotle, mleczny Shiraike
z mostkiem → zagrody krokodyli Oniyama z figurą czerwonego oni → lasy Takasakiyamy z polaną pełną makaków
i kolejką linową na Tsurumi rozpiętą wysoko nad koronami (pylony z siedzącymi makakami, stacje z dojściami, dwa czerwone
wagoniki z cieniami) i świątynią przy kamiennych schodach → kamienna niecka gejzeru Tatsumaki z widownią i przejściem
wzdłuż wschodniego muru → krwistoczerwony staw Chinoike (dwa sklepy przy ścieżce, czerwony strumień spływający
za wschodnią krawędź).

Znak rozpoznawczy miasta to kolumny pary wychodzące spomiędzy domów. Są żywe: w tle jest narysowana tylko
wilgotna plama i niska mgiełka przy każdym źródle, a samą kolumnę tworzą kłęby, które gra ciągle wypuszcza —
cieniowane jak chmury, puchną w miarę wznoszenia, przechylają się razem przy podmuchach wiatru, a co jakiś
czas któreś źródło bucha mocniej (zob. „Żywe tło”). Para, która grzeje działa, ma ciepły, brzoskwiniowy
odcień, żeby nie myliła się z białą parą w tle.

Otoczenie atakuje: **gejzery** (fala `geyser`) siedzą w tle i co kilka sekund wybuchają — najpierw na ziemi
wypełnia się pierścień, potem bije słup wrzątku i rozpryskują się krople (`"kind": "mud"` — szerszy, dłuższy
wybuch błota z ciężkimi grudami). **Chmury pary** (fala `steam`) dryfują po ekranie i zasłaniają wrogów;
lot w parze rozgrzewa działa: od znacznika na pasku przy broni strzały są gorące (×1,5 obrażeń, pomarańczowe),
ale przy pełnym pasku działa się zacinają na ~2 s — trzeba wlatywać i wylatywać.

| Archetyp | Wygląd | Mechanika |
| --- | --- | --- |
| Popcorn | jajka gotowane w źródłach (jigoku-mushi) | **wykluwanie**: jajko chwieje się coraz mocniej i po ~2 s na ekranie pęka — wylatuje mały oni, który goni gracza i strzela |
| Strzelec | żelazny kocioł Kamado z kucharzem-oni | **rykoszety**: szeroki wachlarz, który raz odbija się od krawędzi ekranu |
| Wieżyczka | dysza pary na kamiennym postumencie | **kłęby**: pociski-obłoki rosną, zwalniają i wiszą w powietrzu; to wrząca, różowoczerwona para z ciemnym obrysem i białym środkiem (nie do pomylenia z białą parą w tle), a dysza przed strzałem rozgrzewa się na czerwono |
| Nurek | makak z Takasakiyamy | **kradzież**: zamiast taranować kradnie poziom mocy (albo bombę) i ucieka zygzakiem z łupem; zestrzel go, a łup wraca |
| Nośnik | drewniane wiaderko kąpielowe z ręcznikiem | — |

Miniboss: krokodyl z Oniyamy (piekło krokodyli działa od 1923 roku). Zanurza się (widać tylko oczy i kręgi
na wodzie, strzały przelatują) i płynie pod gracza, wynurza się z pierścieniem; kłapie szczękami — dwa rzędy
„zębów” zamykają się na pozycji gracza; robi „obrót śmierci” — spirala i wybuchy wrzątku wokół gracza.

Boss: czerwony oni z kolczastą maczugą kanabō, jak figury z Oniyamy. Śpi w stawie Chinoike i wynurza się
z krwi, gdy przewijanie stanie. Zwykłe strzały ledwie go drapią — działają **fasolki Setsubun** („Oni wa soto,
fuku wa uchi”): co kilka sekund przez ekran przelatuje drewniane pudełko masu, zestrzel je i złap fasolki —
przez 9 s co druga salwa dorzuca parę świecących fasolek, które wirują w locie i pękają na oni w okruchy;
póki działają, wokół statku krążą dwie fasolki (migają, gdy się kończą), a pasek nad paskiem temperatury pokazuje,
ile zostało. Ataki: cios kanabō (zaznaczone
miejsce uderzenia i szczelina z wybuchów biegnąca do gracza), tupnięcia budzące gejzery w całym ekranie, ryk
z wachlarzami; poniżej 35% wpada w szał i kręci maczugą (spirala).

## Kolejność etapów

Każda nowa gra losuje kolejność miast; „ETAP n” to miejsce w tej kolejności, nie stałe miasto.
Po ukończeniu etapu gra przechodzi do następnego z tym samym statkiem, wynikiem, mnożnikiem, bronią i życiami;
po ostatnim — „GRATULACJE!”. „Jeszcze raz” po przegranej zaczyna nową grę z nową kolejnością.

Między etapami (po ekranie wyniku) pokazuje się **mapa Japonii** (`src/game/JapanMap.js`): miasta tego biegu —
zaliczone na złoto, następne pulsuje, pozostałe przygaszone — złota kropkowana trasa dotychczasowej podróży
i statek gracza lecący łukiem do następnego miasta; dotknięcie w trakcie lotu go skraca, po wylądowaniu
startuje następny etap. Okinawa jest we wstawce (jak na mapach Japonii). Położenie miasta i podpisu to pole
`map: [lon, lat, dx, dy]` w `stageN.json`; mapę rysuje `tools/art/japan.mjs` (rzut w `src/data/japan.js`).

## Muzyka

Oryginalna ścieżka „Senbon” grana na żywo przez Web Audio (`src/audio/`) — bez plików audio.
Skala *in* (miyako-bushi) na A, instrumenty: koto, flet w stylu shakuhachi, chiptune'owy bas, taiko,
kołatka i shaker. Muzyka rośnie z etapem: spokojne miasto → rozkręcenie przy świątyni → pełny utwór na grzbiecie
→ skoczny motyw tanuki (pon-poko na taiko, shamisen) → finał na szczycie → motyw bossa przy Kyūbim; do tego dżingle końca etapu i końca gry oraz spokojny utwór zakończenia (główny motyw zwolniony, druga połowa oktawę niżej).
Nuty są tekstem w `src/audio/score.js` (16 kroków na takt, np. `'A4 - - E5 - - F5 - ...'`).
Etap 2 ma własną ścieżkę „Churaumi” (`src/audio/score2.js`): skala ryukyu (C E F G B), sanshin, flet,
bębny eisa (duży bęben i paranku), kołatki sanba i bujający rytm kachāshī; osobne motywy manty i shisa.
Etap 3 gra „Kita no Yoru” (`src/audio/score3.js`) w stylu festiwalu Yosakoi Sōran: skala min'yō (D F G A C),
shamisen, pozytywka (Otaru), flet, taiko, drewniane kołatki naruko i dzwonki sań; rozstrojona pozytywka
dla Yuki-onny i szybki, ciężki motyw niedźwiedzia.
Etap 4 gra „Hi no Shima” (`src/audio/score4.js`): festiwalowo w skali yo (D E G A B) jak orkiestry Ohara-matsuri —
shamisen, flet, taiko, gong kane — z satsuma-biwą (głęboka lutnia uderzana dużą kostką); trzeszczący motyw Raijū
i powolny, ciężki motyw wulkanu w skali in na E.
Osaka gra „Naniwa Chindon” (`src/audio/score5.js`): orkiestra chindon-ya — klarnet w skali yonanuki (C D E G A)
na bujającym rytmie pyonko, gong kane i taiko, shamisen; teatralny motyw bunraku z niskim shamisenem
i trzaskiem kołatek hyōshigi; ośmiornica — orkiestra w pełnym pędzie.
Beppu gra „Yukemuri” (`src/audio/score6.js`): pieśń min'yō uzdrowisk — oddechowe shakuhachi w skali min'yō
(D F G A C), koto, shamisen i bębenek tsuzumi („pon” i „ta”, tokeny `z` / `Z`); leniwie jak w kąpieli,
potem coraz gęściej. Krokodyl ma pełzające półtonowe ostinato, oni — taiko i krzyczące shakuhachi w skali in na D.
Efekty (`src/audio/Sfx.js`): ciche, syntetyzowane strzały każdej broni (z limitem częstotliwości), eksplozje
w trzech rozmiarach, znajdźki i wzrost mocy, otarcia (graze), bomba, utrata statku, trafienia w bossa (pancerz oni
brzmi głucho), alarm przed bossem z okrzykiem kakegoe „yoo!”. Głośnik / M wycisza muzykę i efekty razem.
iOS: dźwięk startuje po pierwszym dotknięciu; przełącznik wyciszenia telefonu wycisza też grę.

## Fale

`src/data/stage1.json` … `stage6.json` — dane etapu (wygląd, muzyka, ostrzeżenia) i harmonogram fal,
edytowalne bez zmian w kodzie:

```json
{ "t": 4.0, "type": "popcorn", "x": 40, "path": "sine", "count": 6 }
{ "t": 9.5, "type": "carrier", "x": 120, "path": "zigzag", "color": "red" }
{ "t": 25.2, "type": "turret", "x": 64, "pattern": "fan" }
```

Opcjonalne pola: `gap` (odstęp w serii), `look` (inna skórka z `skins.js`, np. `tanuki`), `warning` i `music` (własne ostrzeżenie i motyw dla ciężkiego), `spacing` (dla `row`), `y` (wysokość zatrzymania), `hp`, `dir`.
Sapporo: `{ "type": "plow", "x": 90, "dir": "down" }` (pług w dół alei) albo `{ "type": "plow", "y": 36, "dir": 1 }`
(w poprzek, od lewej; `-1` od prawej) — generator rysuje pod nim ulicę; nurek `{ "x": 0, "y": 50 }` startuje z lewej krawędzi.
Beppu: `{ "type": "geyser", "x": 50, "every": 3, "delay": 1, "kind": "mud" }` (wybuch co `every` s, pierwszy po `delay` s;
otwór rysuje generator tła) i `{ "type": "steam", "x": 60 }` (chmura pary); boss `"pond": [x, u]` — pozycja stawu na pasie tła.
Pod każdą wieżyczką generator tła rysuje kamienną platformę i wycina drzewa — po zmianie wieżyczek
uruchom `npm run art`. Mnożnik: N = suma wag wrogów w etapie / 9 (liczone automatycznie, `src/config.js`).

## Żywe tło

Na każdej mapie część tła się rusza (`src/game/Props.js`; generator rysuje klatki do `bg/stageN/props.png`
i zapisuje w `meta.json`, gdzie co stoi i jak się porusza — `tools/art/props.mjs`):

| Mapa | Co żyje |
|---|---|
| Kioto | płynące Kamo i Katsura z tratwami płatków sakury, łódki pod Togetsukyō, podmuchy wiatru w gaju bambusowym, falujące odbicie Złotego Pawilonu i karpie w stawie, trzy strumienie Otowa, riksze w Gion i w bambusach, maiko pod czerwonymi parasolkami i turyści na Hanamikōji, pielgrzymi w tunelach torii, lis między kopcami i smugi słońca, łopoczące chorągwie nobori w Fushimi, migoczące ognie 大 z dymem, kanie nad Kamo, spacerowicze w kimonach i smugi światła w gaju bambusowym, mnich grabiący żwir w Ryōan-ji, strażnicy ognia z pochodniami i iskry nad 大 |
| Okinawa | fale napływające na każdą plażę i biała piana na rafach, błyski na lagunach, łodzie sabani i prom z kilwaterem, bąble nurków przy Keramie, cienie żółwi morskich, ławic ryb i mant, wyskakujące humbaki z fontannami i płetwami ogonowymi, rowerzyści w Bise, wodospad Hiji z pyłem wodnym, kuiny na drodze w Yanbaru, mgła nad lasem, auta na moście Kōri, podmuchy wiatru nad trzciną cukrową, parada eisa na Kokusai-dōri, flagi nad ulicą, noren w drzwiach warsztatów Tsuboya i koty na bruku, kupujący pod dachem pasażu, chorągwie na dziedzińcu Shuri, błyskająca latarnia morska, ścinacze trzciny i dym z cukrowni, paralotnia, banana boat i skutery przy plaży kurortu, ulewy przesuwające się nad morzem |
| Sapporo | projekcja świetlna na śnieżnym zamku, wyciąg krzesełkowy, skoczek na skoczni Ōkurayama, samochody w centrum (ruch lewostronny), tramwaj w Susukino, śnieg zsuwający się z dachów, parujące studzienki, gasnące i zapalające się okna biurowców, kupujący i para na targu Nijō, dym z kominów, para nad nurtem zamarzniętej rzeki, migające neony Susukino, para z ramenowni, łyżwiarze na stawie w parku Nakajima, zegar na TV Tower odliczający czas etapu, ratrak na zeskoku i flagi kibiców, dzieci na sankach, odśnieżający mieszkańcy, rzeźbiarze z piłami przy żurawiu |
| Kagoshima | diabelski młyn na dworcu Chūō, tramwaje na trawiastych torach, para z gorącego piasku i pomocnicy z łopatami, promy na Sakurajimę, łódź karmiąca na farmie ryb, cień chmury popiołu nad zatoką, wyskakujące delfiny, kolumna popiołu z krateru, para z otworów i szczelin, pulsująca lawa, para nad kąpielą dla stóp, śmieciarki popiołu w kurzu, bomby wulkaniczne pod kraterem |
| Osaka | oba diabelskie młyny (na Tempozan kolory przebiegają po obręczy), ruch na alejach i przecznicach, statki na rzekach i kanale Dōtonbori, pociągi pod szklanym dachem Umedy, łabędzie w fosach i karpie w stawie, neony zapalające się litera po literze i biegające światła na billboardach, krab machający szczypcami i ośmiornica, kołyszące się girlandy lampionów, fontanna, drgające odbicia neonów w wodzie, dryfujące łodzie rybackie, tłum na moście Ebisu i spacerowicze nad kanałem, para nad straganami z takoyaki, gasnące i zapalające się okna biurowców Umedy, gołębie zrywające się z placów przy zamku, para nad yatai na Tempozan, holowniki przy dźwigach w zatoce |
| Beppu | żywe kolumny pary, bąble w gorących stawach (w szarym błocie Oniishibozu rosną i pękają „głowy mnichów”), fale na czarnej plaży, prom i łodzie, pociągi na stacji, pływające krokodyle, makaki na polanie, para spod strzech chatek Myōban, wagoniki kolejki na Tsurumi z cieniami na lesie, ludzie w yukatach i rozjaśniające się latarnie w Kannawie, para nad koszykiem jajek w Umi Jigoku, zwiedzający przy barierce, światełka biegnące po wieży Beppu |

Żeby nie przeszkadzało w czytaniu pocisków: wszystko leży pod wrogami (i daleko pod ich pociskami), rusza się
wolno albo w miejscu, nic małego i jasnego nie lata po ekranie (światła tylko mrugają, samochody jadące w dół
nie mają reflektorów, odbłyski wody to krótkie poziome kreski), kolory przechodzą tę samą korektę pory dnia co
tło, a gdy pocisków robi się dużo, efekty (para, dym, bąble, błyski, neony) przygasają — pełne obiekty, które
zastępują fragment tła (młyny, pojazdy, zwierzęta), zostają bez zmian. `?noprops` wyłącza żywe tło do porównania.

Ruchome obiekty stoją tam, gdzie wynika z zegara etapu (`src/game/pathTime.js`), a nie z sumowania kroków, więc
po zjechaniu z ekranu i powrocie są we właściwym miejscu. Generator liczy ich pozycje tym samym wzorem
(`planTraffic` w `tools/art/props.mjs`): auta na jednym pasie jadą jednym tempem, a start każdej trasy jest dobrany
tak, żeby żadne auto nie przejechało przez inne, przez tramwaj ani pociąg wtedy, gdy ich spotkanie jest na ekranie.

## Grafika

Cała grafika jest generowana kodem (`tools/`) do zwykłych plików PNG w `public/assets/`:
atlas sprite'ów (`sprites.png` + `sprites.json`), font pikselowy z polskimi znakami, a dla każdego etapu
`bg/stageN/far.png`, 4 kawałki warstwy środkowej `bg/stageN/mid_XX.png` (180×1792) i atlas ruchomych
części tła `bg/stageN/props.png` (+ `props.json`; ich lista jest w `meta.json`).
Generatory teł: `tools/art/kyoto/`, `tools/art/okinawa/`, `tools/art/sapporo/`, `tools/art/kagoshima/`, `tools/art/osaka/`, `tools/art/beppu/` (`node tools/gen-art.mjs --only=stage6` buduje jeden etap). Każdy plik można podmienić ręcznie
rysowaną grafiką o tych samych wymiarach/nazwach ramek. `node tools/gen-art.mjs --preview` zapisuje
powiększone podglądy do `tools/preview/`.

Statki i wrogowie to maski znaków (`tools/art/sprites.mjs`) z automatycznym cieniowaniem i obrysem.

Efekty wspólne dla wszystkich miast (`tools/art/fx.mjs`, `src/game/Fx.js`):
- **Wybuchy** to kula ognia, a po niej kłęby dymu, odłamki i kawałki zależne od miasta: płatki sakury
  (Kioto), krople wody (Okinawa), lód (Sapporo), popiół i żar (Kagoshima), kolorowe iskry neonów (Osaka),
  para (Beppu). Po zestrzelonych działkach na ziemi zostaje ślad spalenizny.
- **Światło wybuchów:** każdy wybuch na chwilę oświetla ziemię wokół siebie. Siła zależy od pory dnia na
  trasie (pole `dark` w `stageN.json`), więc w nocnym Sapporo czy Osace widać ją wyraźnie, a w dzień ledwo.
- **Cienie chmur** powoli przesuwają się po ziemi i znikają, gdy zapada noc.
- **Bossowie i minibossowie** oddychają (piksel w górę i w dół), przy 2/3 i 1/3 życia pękają, dymią i iskrzą
  (Kyūbi zamiast tego traci ogony).
  Zestrzelony nie znika od razu: trzęsie się i błyska w serii wybuchów, a potem odchodzi po swojemu. Oni
  zapada się w krwawy staw, ośmiornica, krokodyl i manta toną, Yuki-onna pęka jak lód, shisa i lalka bunraku
  rozpadają się na kawałki, tanuki rozsypuje się w liście, Sakurajima stygnie, Kyūbi spala się w niebieskim
  lisim ogniu, a znak 大 na zboczu za nim buchnie płomieniem, reszta wybucha.
- **Statek** ma błysk przy lufie, iskry z silników i rozpada się na kawałki we własnych kolorach.
- **Logo** pr0ject-jpn (`tools/art/logo.mjs`) spada na ekran tytułowy jak przybijana pieczątka. Na starcie
  etapu pieczęć miasta z kanji jego nazwy (京都, 沖縄, 札幌, 鹿児島, 大阪, 別府, w kolorze tuszu miasta)
  ląduje nad tytułem. Kanji 16×16 pochodzą z japońskiej czcionki bitmapowej (`tools/art/kanji.mjs`).

Gra wczytuje na starcie tylko to, co wspólne (sprite'y, font, mapa) i tło pierwszego miasta; tła pozostałych
miast scena `Boot` doczytuje w tle (następne miasto pierwsze), gdy widać już ekran tytułowy. Gdyby miasto nie
zdążyło się wczytać, etap czeka z napisem „WCZYTYWANIE...”.

## Struktura

```
src/main.js            konfiguracja Phaser, skalowanie całkowite, safe-area
src/config.js          parametry rozgrywki (bronie, wrogowie, mnożnik, fair play)
src/scenes/Boot.js     ładowanie, font, animacje
src/scenes/Stage.js    pętla etapu, kolizje, stany (tytuł / gra / pauza / koniec)
src/data/              etapy (stages.js + stageN.json)
src/game/*.js          paralaksa i żywe tło, gracz i bronie, wrogowie (rdzeń w Enemies.js), skórki, pociski, fale,
                       wynik, HUD, efekty, mapa Japonii, książeczka pieczątek, panel debugowania
src/game/enemies/      wrogowie i bossowie każdego miasta (kyoto.js … beppu.js, metody dołączane do Enemies)
                       i to, co dzielą z rdzeniem (shared.js); zmiana w jednym mieście dotyka tylko jego pliku
src/i18n.js            język (PL / EN)
src/pwa.js             instalacja na telefonie, gra offline (z public/sw.js)
tools/                 generator grafiki
```
