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
| 4 | Kot bez końca (`ex4`, `src/game/enemies/nagai.js`) | *Smok dymu uciekający z Fuji* Hokusaia (1849): jak w oryginale tusz sumi na jedwabiu: Fuji to niezamalowany jedwab obrysowany szarym laserunkiem nieba i rysami żlebów, za nią kłęby czarnego dymu wiją się w górę i kończą kocią głową z dymu (oczy z gołego jedwabiu, wąsy suchym pędzlem); na pierwszym planie wzgórza z kępami drzew, czerwona pieczęć bez znaków | zrobiony |
| 5 | Pokój otaku (`ex5`, `src/game/enemies/heya.js`; bossem jest pokój, trafia się monitor) | sam pokój z góry (ujęcie 3/4), przewijany od drzwi do biurka: wejście z butami, paczkami i workami śmieci, tatami z rozgrzebanym futonem, kotatsu przed starym telewizorem z konsolą, regały mang, suszarka z praniem, wiatrak, puszki i kable; na tylnej ścianie „plakaty” w manierze portretów aktorów Sharaku (1794), zasłonięte okno, półka z figurkami (`tools/art/encounters/otakuroom.mjs`) | zrobiony |
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

Stałe: `NAGAI` w `src/game/enemies/nagai.js` (1850 HP, progi 66% / 33%, 120 segmentów co 4,5 px). Słabym punktem
jest głowa (pełne obrażenia, promień 13 px); trafienie w ciało (futrzane segmenty, co jakiś czas para białych
łapek, daleko z tyłu rozwiewa się w dym) liczy się za 35% trafienia w głowę. Ciało rani przy dotknięciu i idzie
dokładnie śladem głowy. Kot nigdy nie wypływa poza ekran.

**Okno ataku („MIAU!”):** co 5,5 s (w fazach 2–3 co 8 s), gdy głowa jest dobrze na ekranie, kot staje, miauczy
pierścieniem pocisków, obraca głowę w dół i przez 1,6 s pulsuje; ciało blednie (więcej dymu niż kota) i przepuszcza
strzały, a głowa przyjmuje podwójne obrażenia. W tym czasie nie strzela.

- **Faza 1 — kot bez końca:** wije się długimi esami od boku do boku w górnej części ekranu; pluje kulkami
  sierści (wachlarz 3 w gracza).
- **Faza 2 — mruczenie:** fale wolnych pocisków wychodzą na boki z całego ciała (co dziesiąty segment na ekranie);
  co jakiś czas rusza głową prosto na gracza na ~3 s, potem wraca na górę ekranu.
- **Faza 3 — kłębek:** owija się wokół gracza zwężającą się spiralą („NYAAA~”, promień 64 → 26 px w 5 s; trzeba
  wyjść przez lukę między zwojami albo przeczekać w środku) i rzuca kłębkami włóczki, które odbijają się od
  krawędzi ekranu.

Czas walki w symulacji (statek stale pod głową): ok. 111 s (36 / 40 / 36 s), dla porównania automat ok. 98 s.

## 5. Pokój otaku (HEYA)

Stałe: `HEYA` w `src/game/enemies/heya.js` (monitor 3000 HP, progi 66% / 33%). Boss złożony z animowanych części:
lokator siedzi tyłem do nas w fotelu gamingowym przed biurkiem, z kocem w gwiazdki na głowie i kocimi słuchawkami
(oddycha, łokcie chodzą przy pisaniu, co jakiś czas zerka przez ramię, po trafieniu odwraca się ze złością, ręką
sięga po wieżę przed rzutem); strzały w niego liczą się jak w monitor. Nad nim kineskopowy monitor (słaby punkt) z osobną warstwą ekranu (buźka, czat, „LAG...”, ruletka gacha,
kamera domofonu, niebieski ekran błędu, śnieżenie), biurko z mechaniczną klawiaturą, energetykami i maskotką,
komputer z kręcącymi się wentylatorami i tęczowym RGB, drugi ekran z grą. Po bokach dwie wieże: mangi (lewa) i kubki
po zupkach z kartonami (prawa) — osobne cele po 320 HP; 30% obrażeń zadanych wieży trafia też w monitor. Zestrzelona
wieża wali się w stertę (pierścień pocisków, punkty), a jej ataki znikają (zastępuje je „pisanie”: wachlarz i
pierścień z ekranu). Żadnych marek. Grafika: `tools/art/encounters/heya.mjs`.

**Dzwonek do drzwi** (wszystkie fazy, co 7–9,5 s): „PIN-PON!” u dołu ekranu; lokator chowa się pod kocem i drży,
na ekranie kamera domofonu z kurierem; przez 1,7 s nie atakuje, a monitor przyjmuje podwójne obrażenia; potem
„...?”.

- **Faza 1 — twierdza z mang:** tomy lecą wirując i otwierają się w wachlarz 7 kartek („BAM!”); kubki lecą łukiem
  (na ziemi rośnie cień), rozlewają wrzący bulion i pryskają pierścieniem („ZURU!”); stosy tomów spadają na gracza
  (najpierw ciemniejący cień z obwódką) i rozsypują się pierścieniem („DOSA!”). Wieże chwieją się przy rzutach i
  trafieniach.
- **Faza 2 — tryb nocny:** gaśnie światło („KLIK.”); pokój tonie w mroku, zostaje plama światła monitora (migocze)
  i jego poświata na podłodze. Czat spływa jako dymki z pocisków (dwa rzędy co 1,3 s, luka między dymkami oznaczona
  „www”; luka następnego rzędu jest najwyżej 3 pola od poprzedniej, więc każdy statek zdąży — korytarz między
  rzędami ok. 34 px); póki rzędy czatu są na ekranie, boss nie rzuca mangami ani kubkami. „LAG...”: wszystkie
  pociski zawisają na 1 s, potem lecą dalej; dymki czatu nie zmieniają kursu, luźne pociski w 25% skręcają.
- **Faza 3 — gacha:** reszta twierdzy się wali, monitor pęka, ekran śnieży, oczy płoną. Na ekranie kręci się
  ruletka; wynik decyduje o ataku: N (1/2) — 5 kapsułek pękających pierścieniem, R (1/3) — 4 pękające spiralą,
  SSR (1/6) — 3 złote pękające gwiazdą. Kapsułkę można zestrzelić w locie, zanim pęknie (zwykła 1 trafienie, złota 3);
  pierwsza zestrzelona złota zostawia nagrodę (fioletowy power-up).

Animacje walki: przed rzutem ręka wysuwa się spod koca w stronę wieży, z której poleci atak (0,3 s); stos wyrasta
nad wieżą mang, chwieje się i przewraca, a potem spada na cel; otwarta manga wyrzuca fruwające kartki; kubek
po wylądowaniu toczy się, a bulion zostaje na podłodze jako parująca plama; na dymkach czatu migają „LOL”, „GG”,
„???”, „:)”; przy „LAG” pociski drgają, wypełnia się pasek ładowania, odblokowanie błyska; bęben gachy zwalnia
z tykaniem, SSR to złoty błysk, konfetti i lokator z rękami w górze (przy N westchnienie); kapsułki rozpadają się
na połówki i zabawkę, która odbija się od podłogi. Lokator podskakuje po serii mocnych trafień (kropla potu,
„KRZK!”), co ok. 13 s pije energetyk („PSST!”), a puste puszki zbierają się na podłodze wokół fotela. Chomik w terrarium (na podłodze obok fotela)
oddycha, biega w kołowrotku i chowa się do domku przy dzwonku i wstrząsach. Monitor słabnie: poniżej 50% dymi,
poniżej 40% obraz drga i śnieży, poniżej 20% wyskakuje okienko „BATERIA?”. W fazie 2 komputer się przegrzewa
(czerwone RGB, szybsze wentylatory, para). Przy dzwonku pod drzwiami (dół ekranu) pojawia się światło z cieniem
stóp i wsuwa się ulotka, a pokój zamiera (wentylatory zwalniają, RGB gaśnie, gra na drugim ekranie pauzuje).
„KLIK.” to dwa mrugnięcia świetlówki; w nocy świecą tylko słuchawki i okulary lokatora. W fazie 3 wieże walą się
po kolei, tom po tomie, a rzeczy na podłodze podskakują przy wstrząsach. Finał: kineskop gaśnie do białej kropki,
lokator zsuwa się pod koc, gdzieś w pokoju „PING!” telefonu.

Tło (`otakuroom.mjs`) animuje: grę w telewizorze (co jakiś czas GAME OVER i od nowa), powiadomienia telefonu na
futonie, wiatrak i kołyszące się w jego podmuchu pranie, diody routera, światło w szparze zasłon, kurz w smugach
światła, parę nad kubkiem na kotatsu. Czas walki w symulacji (statek stale pod monitorem):
ok. 96 s (31 / 33 / 31 s); zagrożenie ekranu średnio 4,5% / 4,9% / 3,5%, w szczycie 10% / 11% / 12%.

## 6. Babcia (OBACHAN)

Stałe: `OBACHAN` w `src/game/enemies/obachan.js` (2400 HP, progi 66% / 33%). Grafika: `tools/art/encounters/obachan.mjs`
(babcia, tygrys, wózek, cukierki, ślady na śniegu), `torasnow.mjs` (tło). Podgląd klatek z gry i pomiar pocisków:
`node tools/preview/obachan-shots.mjs`.

Babcia to jedna kukiełka w 16 pozach (każda też w wersji z pustą bluzką), pokazywana 1,15× większa niż narysowana:
drepcze, zerka, bierze zamach i rzuca, krzyczy z ręką przy ustach, kręci torebką nad głową, wskazuje wózek, śmieje się.
Tygrys ma 11 klatek (siedzi, mruga, liże nos, przyczaja się, skacze, ląduje, ryczy, wraca).

- **Faza 1 — AME-CHAN:** wachlarze cukierków; papierek otwiera się i cukierek drży przez 0,28 s, zanim pęknie
  w pierścień 5 pocisków. Wózek: babcia wskazuje stronę, po śniegu od tej strony rysują się koleiny, wózek brzęczy
  przy krawędzi („CHIRIN!”) i po 1 s taranuje. Torebka: 4 pierścienie po 9 pocisków spiralą.
- **Faza 2 — MAKETE!:** okrzyki z wachlarzem dużych pocisków („MAKETE!”, „-50%”, „-80%!”), wózki z obu stron.
- **Faza 3 — TYGRYS!:** tygrys zrywa się z bluzki i poluje sam. Zapowiedź skoku jest na śniegu, bez linii celowania:
  ślady łap biegną do miejsca lądowania, wokół niego zaciska się pierścień (0,95 s; cel jest stały od początku).
  Lądowanie: pierścień 8 pocisków, „GAO!”.
- **Koniec:** nie wybucha; siada w śniegu, zdyszana, i wyciąga cukierka, tygrys siada obok.
- **Tło:** tygrys w śniegu Hokusaia z trwałą; na ekranie od początku. Animowane (219 elementów): padający śnieg,
  liście bambusa (i śnieg, który z nich spada), para z pyska, mruganie, ucho, koniec ogona, iskry na śniegu.
- **Pomiar (30 s na fazę, bez strzelania):** średnio 27 / 23 / 30 pocisków na ekranie, szczyt 60 / 62 / 54
  (przed przeróbką: średnio 47 / 27 / 63, szczyt 104 / 62 / 114).

## 7. Konferencja prasowa (KAIKEN)

Stałe: `KAIKEN` w `src/game/enemies/kaiken.js` (2400 HP, progi 66% / 33%). Grafika: `tools/art/encounters/kaiken.mjs`
(postać), `kirifuri.mjs` (tło). Podgląd klatek z gry i pomiar pocisków: `node tools/preview/kaiken-shots.mjs`.

Boss to wymyślony pan w garniturze i okularach za stołem konferencyjnym (bez nazwiska, podobizny i funkcji;
nawiązanie tylko do zachowania). Jedna kukiełka w 22 pozach, pokazywana 1,35× większa niż narysowana; stół,
mikrofony, szklanka, kałuża łez i zużyte chusteczki to osobne części.

- **Faza 1 — „HA? NANI?”:** wachlarze „odpowiedzi” z ust; siorbnięcie nosem (po trzy łzy na boki); co czwarty ruch
  przykłada rękę do ucha i przez 1,6 s nic nie słyszy: strzały zatrzymują się na łuku narysowanym przed stołem
  i odskakują w bok, a część wraca jako echo.
- **Faza 2 — „UAAA!”:** szloch (łuki łez z obu oczu); walenie pięściami w stół („DON!”, podwójny pierścień, wstrząs,
  mikrofony i szklanka podskakują, kałuża chlapie); wymachiwanie ręką (strumień pocisków z dłoni).
- **Faza 3 — „ZMIENIĘ ŚWIAT!”:** rzuca bilety kolejowe (numerowane, do #195), które spadają, obracając się; co piąty
  ma czerwony stempel i pęka pierścieniem („UNKYŪ!”). Po wygranej osuwa się czołem na stół: „PAN TEGO NIE ZROZUMIE”.
- **Co widać w trakcie:** kałuża łez rośnie z fazami i spływa po obrusie, między atakami wyciera nos (rośnie kupka
  chusteczek), po bokach ekranu błyskają flesze.
- **Tło:** wodospad Kirifuri Hokusaia; twarz w skale (krzaczaste brwi, zaciśnięte powieki) jest na ekranie od początku,
  pod stołem. Animowane: woda w każdym strumieniu, błyski łez na powiekach, krople, mgła, bryzgi, zmarszczki na
  stawie, czterech pielgrzymów z parasolami.
- **Pomiar (30 s na fazę, bez strzelania):** średnio 21 / 36 / 24 pocisków na ekranie, szczyt 32 / 54 / 54
  (automat: 17 / 34 / 22, szczyt 33 / 57 / 54).
