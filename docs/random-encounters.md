# Losowi bossowie w podróży

Po ukończeniu miasta (nie po ostatnim i nie po samym spotkaniu) losuje się spotkanie: **stałe 20%**
(`ENCOUNTER.chance` w `src/config.js`), bez powtórek w jednej grze. Wynik losuje się raz, przy otwarciu mapy,
więc pominięcie animacji lotu go nie kasuje. Na mapie statek staje w połowie drogi, alarm „!!” i „NIESPODZIEWANY
GOŚĆ!”, dotknięcie / Enter — walka. Po wygranej: +1 życie i 30 000 × mnożnik (`ENCOUNTER.lives`, `ENCOUNTER.bonus`),
bez pieczątki; potem mapa i lot dalej, od połowy drogi. Śmierć działa jak w mieście (życia przechodzą, game over
możliwy). Spotkania nie wliczają się do miast ani pieczątek.

Każde spotkanie to osobny plik etapu (`src/data/ex1.json` …, lista w `src/data/encounters.js`) z jedną falą bossa,
arena w `public/assets/bg/<id>/` (`tools/art/encounters/`, `node tools/gen-art.mjs --only=ex1` i `--only=enemies`).
Tła to pikselowe, „pokręcone” interpretacje dzieł z epoki Edo (domena publiczna), rysowane kodem; arena przesuwa
się powoli w górę przez całą walkę.

Debug: `?ex=ex1` — to spotkanie zaraz po wyborze statku; `?ex=always` — spotkanie po każdym mieście.

## Plan bossów

| # | Boss | Tło | Stan |
| --- | --- | --- | --- |
| 1 | Automat z napojami (`ex1`, `src/game/enemies/jihanki.js`) | *Wielka fala w Kanagawie* Hokusaia (ok. 1831), narysowana od nowa w pełnych 540 px: ściana fali w drobnych liniach wzdłuż nurtu, grzbiet łamiący się w rozgałęzione szpony piany, mała fala-Fuji z przodu, trzy łodzie oshiokuri-bune z wioślarzami; woda to napój gazowany (bąbelki w środku, rozprysk z bąbelków), słońce to kapsel | zrobiony |
| 2 | Kei car (`ex2`, `src/game/enemies/keicar.js`) | *53 stacje Tōkaidō* Hiroshigego (1833–34): droga z sosnami, polami ryżowymi i mostkami pędzi w pętli, na starcie most Nihonbashi z orszakiem daimyō | zrobiony |
| 3 | Kot z budowy (`ex3`, `src/game/enemies/genba.js`; własny rudy kot w żółtym kasku z latarką, bez pozy i hasła znanego mema) | namazu-e (1855): budowa w ulicy Edo dokopała się do olbrzymiego suma; kamień kaname-ishi na jego głowie, mieszczanie ciągną za wąsy | zrobiony |
| 4 | Kot bez końca (`ex4`, `src/game/enemies/nagai.js`) | *Smok dymu uciekający z Fuji* Hokusaia (1849): z krateru Fuji wije się słup dymu zakończony kocią głową z dymu; dym rozjaśniony, żeby kot i pociski były czytelne | zrobiony |
| 5 | Pokój otaku (`ex5`, `src/game/enemies/heya.js`; bossem jest pokój, trafia się monitor) | ściana oklejona „plakatami” w manierze portretów aktorów Sharaku (1794): wielkie głowy kabuki na ciemnym tle z miką; jeden w słuchawkach, jeden z padem, jeden z kocimi uszami; żaden nie kopiuje konkretnej odbitki | zrobiony |
| 6 | Babcia (`ex6`, `src/game/enemies/obachan.js`; fioletowa trwała, tygrys na bluzce, torebka, wózek z zakupami, cukierki dla wszystkich) | *Tygrys w śniegu* Hokusaia (1849): tygrys przyczajony w zaśnieżonym bambusowym gaju ryczy w niebo — z fioletową trwałą; w śniegu cukierki i zasypany wózek | zrobiony |
| 7 | Płacząca mównica (`ex7`, `src/game/enemies/mownica.js`; ożywiona mównica z mikrofonami, nawiązanie tylko do zachowania ze słynnej konferencji: ręka przy uchu, płacz, walenie w stół, bilety kolejowe; bez nazwiska, wyglądu i funkcji) | *Wodospad Kirifuri na górze Kurokami* Hokusaia (ok. 1832): wodospad leje się z dwóch zaciśniętych, płaczących oczu na szczycie urwiska | zrobiony (pierwsza wersja) |

Bez prawdziwych marek na puszkach, autach, kubkach i okładkach.

## 1. Automat z napojami (JIHANKI)

Stałe: `JIHANKI` w `src/game/enemies/jihanki.js` (2600 HP, progi faz 66% / 33%).

Wygląd (druga wersja): automat w lekkim rzucie z boku, pokazany 1,3× większy niż narysowany — kremowa obudowa
z daszkiem, czerwony podświetlany nagłówek to twarz (dwoje dużych oczu LED, brwi; mruga, złości się, przy
wstrząsaniu zaciska oczy „> <”, po wygranej na loterii ma spirale), jasno podświetlona witryna z butelkami,
puszkami i brązowymi buteleczkami na chromowanych półkach, cenówki, świecące przyciski, klapka-paszcza z zębami
przy wyrzucaniu puszki, krótkie nóżki i cień na ziemi (zostaje, gdy automat podskakuje). Wstrząśnięty puchnie,
witryna wypełnia się bąbelkami, z góry strzelają kapsle, a ze szczelin wycieka piana; strumienie to kłęby piany
z bąbelkami-pociskami. Monety to pięciojenówki z dziurką, rozbite puszki dają koronę rozprysku, krople kawy albo
kostki lodu; nad kałużą kawy unosi się para, kałuża brei ma kostki lodu i szron. Trafienia błyskają słabiej niż
u innych bossów (`flashTint`), żeby jasny automat nie bielał.

- **Faza 1 — automat ma dość:** puszki gorące (czerwone) i zimne (niebieskie) lecą łukiem w gracza (miga
  pierścień w miejscu lądowania). Gorąca rozlewa kałużę kawy: stanie w niej grzeje działa jak para w Beppu (gorące
  strzały, potem przegrzanie). Zimna — kałużę lodowej brei: szron spowalnia statek, a po chwili zamraża go w
  bryłę (mechanika szronu z Sapporo). Kałuża trwa 5,5 s, promień 17,25 px (powiększona o 15%), działa
  od 0,13 s po rozlaniu. Kawa: gorące strzały po ok. 1,2 s, przegrzanie po ok. 2,9 s (1,8 s bez strzelania; ciepło
  stygnie poza kałużą 0,1/s, więc się sumuje). Breja: spowalnia od razu (coraz mocniej), „SZRON!” po ok. 0,9 s
  (−27% prędkości), zamarznięcie po ok. 1,8 s na 0,9 s. Do tego wachlarz monet i kurtyna z przycisków (strzały
  spadają po kolei wzdłuż frontu, z luką na trzy).
- **Faza 2 — wstrząśnięty, nie zmieszany:** automat się trzęsie (cały ekran z nim), „SZURU SZURU!”, potem
  „PSSSHHH!” i dwa krzyżujące się strumienie piany. Wstrząśnięte puszki pękają spiralą.
- **Faza 3 — loteria:** cyfry na wyświetlaczu kręcą się i stają po kolei. Pierwsze losowanie zawsze przegrywa;
  potem 35% na cztery takie same: „ATARI!”, automat oszołomiony na 3,5 s (bierze 1,6× obrażeń) i wypluwa trzy
  złote puszki — złapane dają punkty, a przy zużytej bombie — bombę. Przegrana („HAZURE...”): szał, 8 puszek spada
  z góry ekranu w 2,6 s (stałe `rage` i `rain`). Między losowaniami automat skacze za graczem.

## 2. Kei car (KEI)

Stałe: `KEI` w `src/game/enemies/keicar.js` (2400 HP, progi 66% / 33%). Tło pędzi jak w pościgu (warstwa dalsza
w pętli 2304 px, 70 px/s); pachołki i ślady opon leżą na drodze i przesuwają się razem z nią.

Wygląd (druga wersja): wysokie, wąskie pudełko kei-wagonu z krótką maską, kremowym dachem z relingami nad miętowym
lakierem, czarne plastikowe zderzaki, małe koła w samych narożnikach (kręcą się), okrągłe reflektory-oczy w
chromowanych obwódkach, grill-uśmiech, lusterka, żółta tablica klasy kei (pusta). Po tuningu w stylu bōsōzoku:
rury wydechowe „takeyari” sterczące z tyłu, wysokie skrzydło, wysunięty spojler, płomienie, fioletowa poświata pod
autem. W fazie 3 biała ciężarówka kei typu cab-over z arbuzami i kapustą na pace.

Tło (druga wersja): Tōkaidō z *53 stacji* Hiroshigego z góry — droga z ubitej ochry z koleinami, kamykami i kępkami
trawy oraz namalowanymi pasami, sosny po obu stronach rzucające cień na drogę, a za nimi po kolei: zalane pola
ryżowe z odbiciem nieba i chmur, rzędami sadzonek i czaplami; złoty ryż z rolnikami w słomkowych kapeluszach;
łukowate rzędy krzewów herbaty z Shizuoki; wioska z krytymi strzechą domami (dym z paleniska) i białym magazynem
kura; czerwona brama torii z kamiennymi latarniami; przydrożna herbaciarnia z ławkami i podróżnymi; gaj
bambusowy; kopce milowe ichirizuka; rzeka z drewnianym mostem i łódkami.

- **Faza 1 — mały, ale wściekły:** ustawia się w linii gracza i warczy („BURORORO!”), potem palenie gumy — cofa się kawałek, tylne koła dymią i
  zostawiają ślady, reflektory migają coraz szybciej — trąbi („PAAAP!”, pierścień) i
  taranuje w dół drogi, wyjeżdża dołem i wraca z góry. Długie światła („PIKA PIKA!”): reflektory migają coraz
  szybciej, celując w gracza (0,8 s), potem lecą z nich dwa strumienie szybkich pocisków. Slalom („SURARŌMU!”): auto
  najpierw wierci się na boki z migającymi awaryjnymi, potem jedzie zygzakiem w dół drogi, a światła awaryjne strzelają na boki. Długie trąbienie —
  kilka pierścieni po kolei.
- **Faza 2 — tuning:** drift w kółko wokół gracza („DORIFTO!”), pociski lecą do środka koła; koło ma promień
  52 px i całe mieści się na ekranie (auto nie wyjeżdża poza krawędź); rzuca pachołki na drogę — leżą i jadą
  w dół razem z nią (dotknięcie = zderzenie, strzał je zbija); taranuje dwa razy z rzędu.
- **Faza 3 — kei-tora:** godzina szczytu: dwa z trzech pasów przecinają ekran sznurki małych aut kei (najpierw
  miga strzałka w poprzek pasa, między autami są luki); arbuzy z paki lecą łukiem w gracza i rozpryskują się
  („GUSHA!”) pierścieniem czarnych pestek.

## 3. Kot z budowy (GENBA)

Stałe: `GENBA` w `src/game/enemies/genba.js` (2500 HP, progi 66% / 33%). Trafia się wieżę (w fazie 3 — kota).

Wygląd (druga wersja): duży rudy pręgowany kot (40 × 44 px, w fazie 3 pokazany 1,3×) z białym pyskiem, piersią
i skarpetkami, w żółtym kasku z latarką i zielonym krzyżem, pomarańczowej kamizelce z odblaskami i pasie na
narzędzia; oddycha i macha ogonem, mruga, bierze zamach i rzuca, syczy, przyczaja się z kręcącym się zadkiem, skacze,
ląduje, macha łapą z pazurami, pędzi, siada i myje łapę — każda poza też bez kasku. Wieża: stalowa konstrukcja
w zielonej siatce i rusztowaniach, drabina, światła w środku, pasy ostrzegawcze, kontener na dachu z migającą lampą
i żuraw wieżowy; potem pęknięta i przechylona; potem gruzowisko. Tło: Edo z góry (dachówki z rzędami gąsiorów,
cienie okapów, sosny, ludzie), plac budowy za deskowym płotem (pomosty, sterty drewna, piasek, taczka), a w wykopie
z deskowaniem głowa olbrzymiego suma: oliwkowa, cętkowana, złote oczka, jasne wargi, kamień kaname-ishi ze świętym
sznurem, wąsy wyciągnięte za płot, za które ciągną mieszczanie; inni okładają go młotkami; pęknięcia w mieście.

- **Faza 1 — budowa w toku:** kot na dachu bierze zamach i rzuca garście śrub i klucz jak bumerang; żuraw zrzuca
  dwuteowniki — najpierw na ziemi rośnie i ciemnieje ich cień, potem belka spada i rozbija się na odłamki
  („GAN!”); hak żurawia najpierw zjeżdża na linie przy jednej krawędzi, potem przelatuje wahadłem przez ekran.
- **Faza 2 — namazu się budzi:** trzęsienia („GOTO GOTO GOTO!”), szczeliny biegną w stronę gracza i plują błotem
  (strefy jak gejzery w Beppu); wieża pęka i się przechyla, belki spadają gęściej.
- **Faza 3 — zawalenie:** wieża się wali, kot schodzi walczyć. Trzy skoki pod rząd: przed każdym przyczaja się
  z szeroko otwartymi oczami i kręci zadkiem (pierwszy raz dłużej), skacze tam, gdzie był gracz, ląduje z
  pierścieniem pazurów i kurzem. Pazury („NYAAA!”): namierza miejsce gracza i unosi łapę; przez 0,7 s w tym miejscu na ziemi
  prześwitują trzy ciemne rysy (coraz wyraźniejsze, na końcu migają), po czym przecinają je trzy wielkie ślady pazurów
  i trzy rzędy pocisków rozlatują się od nich prostopadle — uciekać wzdłuż ukosu rys. Kask jak bumerang. „ZUUUM!” — kocie szaleństwo: pędzi
  dookoła ekranu wzdłuż krawędzi i zrzuca pociski do środka. Na koniec siada i myje łapę („PERO PERO...”) — przez
  2,2 s bierze 1,5× obrażeń.

## 4. Kot bez końca (NAGAI)

Stałe: `NAGAI` w `src/game/enemies/nagai.js` (2300 HP, progi 66% / 33%, 120 segmentów co 4,5 px). Trafia się
tylko głowę; ciało (futrzane segmenty, co jakiś czas para białych łapek, daleko z tyłu rozwiewa się w dym)
zatrzymuje strzały gracza i rani przy dotknięciu. Ciało idzie dokładnie śladem głowy.

- **Faza 1 — kot bez końca:** wije się długimi esami przez ekran, wychodzi za krawędź i wraca z innej strony;
  pluje kulkami sierści (wachlarz 3 w gracza), co czwarty raz miauczy pierścieniem („MIAU!”).
- **Faza 2 — mruczenie:** fale wolnych pocisków wychodzą na boki z całego ciała (co dziesiąty segment na ekranie);
  co jakiś czas rusza głową prosto na gracza na ~3 s.
- **Faza 3 — kłębek:** owija się wokół gracza zwężającą się spiralą („NYAAA~”, promień 64 → 26 px w 5 s; trzeba
  wyjść przez lukę między zwojami albo przeczekać w środku) i rzuca kłębkami włóczki, które odbijają się od
  krawędzi ekranu.

## 5. Pokój otaku (HEYA)

Stałe: `HEYA` w `src/game/enemies/heya.js` (2500 HP, progi 66% / 33%). Twierdza na górze ekranu: wieże mang
z lewej, piramida kubków po zupkach i pudła z dostaw z prawej, biurko z kineskopowym monitorem w środku (to w niego
się strzela), za nim postać zawinięta w koc — widać tylko oczy. Żadnych marek: kubki z gładkim paskiem, grzbiety
w jednolitych kolorach.

- **Faza 1 — twierdza z mang:** tomy mangi lecą wirując i otwierają się w wachlarz kartek („BAM!”); kubki z zupką
  lecą łukiem w gracza (miga okrąg) i rozlewają wrzący bulion („ZURU!”); całe stosy tomów spadają na gracza
  (najpierw czerwony obrys) i rozsypują się pierścieniem („DOSA!”).
- **Faza 2 — tryb nocny:** gaśnie światło („KLIK.”, tło ciemnieje, monitor i oczy świecą); z ekranu lecą „linijki
  czatu” — rzędy pocisków przez cały ekran z luką, w luce „www”; między nimi kubki i mangi.
- **Faza 3 — gacha:** twierdza się wali (rozsypane tomy, pęknięty ekran, czerwone oczy); kapsułki gacha wyskakują
  w górę i spadają na gracza, pękając pierścieniem („PON!”), złota (1 na 5) gwiazdą („SSR!”); mangi szybsze.

## 6. Babcia (OBACHAN)

Stałe: `OBACHAN` w `src/game/enemies/obachan.js` (2400 HP, progi 66% / 33%). Babcia drepcze w lewo i w prawo.

- **Faza 1 — ame-chan:** „AME, IRU?” — rzuca wachlarze cukierków w papierkach; zwalniają i rozwijają się
  w małe pierścienie; taranuje ekran wózkiem z zakupami (najpierw czerwona linia i strzałka, z kosza wypadają
  pociski, „DOITE DOITE!”); kręci torebką (pierścienie spiralą).
- **Faza 2 — MAKETE!:** targuje się: okrzyki z wachlarzem dużych pocisków („MAKETE!”, „-50%”, „-80%!”), wózki
  z obu stron naraz.
- **Faza 3 — tygrys!:** tygrys zeskakuje z bluzki (na bluzce zostaje dziura) i poluje sam: przyczaja się (linia
  celu), skacze, ląduje z rykiem (pierścień, „GAO!”), odpoczywa; babcia dalej rozdaje cukierki i się targuje.

## 7. Płacząca mównica (MOWNICA)

Stałe: `MOWNICA` w `src/game/enemies/mownica.js` (2400 HP, progi 66% / 33%). Pierwsza wersja do przerobienia.

- **Faza 1 — „HA? NANI?”:** wachlarze „odpowiedzi” w gracza; co drugi ruch przykłada rękę do ucha i przez 2,2 s
  nic nie słyszy: strzały nie zadają obrażeń, a część wraca do gracza jako echo.
- **Faza 2 — „UAAA!”:** szloch — łuki łez z obu oczu w rytmie łapania oddechu; walenie pięściami w stół („DON!”,
  podwójny pierścień, wstrząs ekranu); wymachiwanie ręką (strumień pocisków omiatający ekran).
- **Faza 3 — „ZMIENIĘ ŚWIAT!”:** rzuca bilety kolejowe (numerowane w górę, do #195), które spadają, kołysząc się;
  co piąty ma czerwony stempel „pociąg nie jechał” i pęka pierścieniem („UNKYŪ!”). Po wygranej: „PAN TEGO NIE
  ZROZUMIE”.
