# Shmup Japonia — etap 1: Kioto, etap 2: Okinawa

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

Parametry do testów w adresie: `?stage=2` (start od etapu 2), `?t=120` (start od 120 s etapu), `?god` (nieśmiertelność),
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
| Ciężki | Kyūbi — czerwony lis o dziewięciu ogonach z klejnotem hōju i lisim ogniem | miniboss w połowie etapu, pierścienie / wachlarze / spirala |
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

Po ukończeniu etapu 1 gra przechodzi do etapu 2 z tym samym statkiem, wynikiem, mnożnikiem, bronią i życiami.
„Jeszcze raz” po przegranej zaczyna od nowa bieżący etap.

## Muzyka

Oryginalna ścieżka „Senbon” grana na żywo przez Web Audio (`src/audio/`) — bez plików audio.
Skala *in* (miyako-bushi) na A, instrumenty: koto, flet w stylu shakuhachi, chiptune'owy bas, taiko,
kołatka i shaker. Muzyka rośnie z etapem: spokojne miasto → rozkręcenie przy świątyni → pełny utwór na grzbiecie
→ osobny motyw minibossa → finał na szczycie; do tego dżingle końca etapu i końca gry.
Nuty są tekstem w `src/audio/score.js` (16 kroków na takt, np. `'A4 - - E5 - - F5 - ...'`).
Etap 2 ma własną ścieżkę „Churaumi” (`src/audio/score2.js`): skala ryukyu (C E F G B), sanshin, flet,
bębny eisa (duży bęben i paranku), kołatki sanba i bujający rytm kachāshī; osobne motywy manty i shisa.
Efekty (`src/audio/Sfx.js`): ciche, syntetyzowane strzały każdej broni (z limitem częstotliwości) i eksplozje
w trzech rozmiarach. Głośnik / M wycisza muzykę i efekty razem.
iOS: dźwięk startuje po pierwszym dotknięciu; przełącznik wyciszenia telefonu wycisza też grę.

## Fale

`src/data/stage1.json`, `src/data/stage2.json` — dane etapu (wygląd, muzyka, ostrzeżenia) i harmonogram fal,
edytowalne bez zmian w kodzie:

```json
{ "t": 4.0, "type": "popcorn", "x": 40, "path": "sine", "count": 6 }
{ "t": 9.5, "type": "carrier", "x": 120, "path": "zigzag", "color": "red" }
{ "t": 25.2, "type": "turret", "x": 64, "pattern": "fan" }
```

Opcjonalne pola: `gap` (odstęp w serii), `spacing` (dla `row`), `y` (wysokość zatrzymania), `hp`, `dir`.
Pod każdą wieżyczką generator tła rysuje kamienną platformę i wycina drzewa — po zmianie wieżyczek
uruchom `npm run art`. Mnożnik: N = suma wag wrogów w etapie / 9 (liczone automatycznie, `src/config.js`).

## Grafika

Cała grafika jest generowana kodem (`tools/`) do zwykłych plików PNG w `public/assets/`:
atlas sprite'ów (`sprites.png` + `sprites.json`), font pikselowy z polskimi znakami, a dla każdego etapu
`bg/stageN/far.png` i 14 kawałków warstwy środkowej `bg/stageN/mid_XX.png` (180×512).
Generatory teł: `tools/art/kyoto/`, `tools/art/okinawa/` (`node tools/gen-art.mjs --only=stage2` buduje jeden etap). Każdy plik można podmienić ręcznie
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
