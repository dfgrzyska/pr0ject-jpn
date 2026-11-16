# Pomysły na dopracowanie gry

Stan na 15.11.2026. Lista powstała z przeglądu teł wszystkich 8 miast i 7 spotkań oraz grafik bossów babci
i mównicy. Przegląd był robiony na plikach grafik w `public/assets/bg/`, nie na grze w ruchu. Wrogowie i bossowie
miast nie byli oglądani.

## Ustalona kolejność

1. Spotkanie 7: zamiast mównicy duża postać człowieka przy stole. **Zrobione 15.11** (opis w `random-encounters.md`).
2. Spotkanie 6 (babcia): tło, ruchy i grafika od nowa. **Zrobione 15.11** (opis w `random-encounters.md`).
3. Miasta: szczegóły, animacje i nowe ważne miejsca tam, gdzie jest pustka. Kagoshima i Okinawa zrobione 15.11, Sapporo i Hiroszima 16.11.

## Spotkania

Liczba animowanych elementów tła (stan po 15.11): automat 61, kei car 24, kot na budowie 81, kot bez końca 5,
pokój otaku 11, babcia 219, konferencja 193.

### 7. Płaczący człowiek przy stole (dziś: mównica) — najsłabsze

Zrobione 15.11 (postać w okularach, 22 pozy, nowe tło). Zostało: obejrzeć walkę w ruchu na telefonie i ocenić
jej czas z prawdziwym graczem. Poniżej pierwotna lista.

Decyzja: bossem ma być duża postać człowieka przy stole konferencyjnym, nie ożywiona mównica.

- Postać wymyślona, bez nazwiska, podobizny i funkcji; nawiązanie tylko do zachowania (ręka przy uchu, płacz,
  walenie w stół, wymachiwanie ręką, bilety kolejowe).
- Duża sylwetka za stołem z mikrofonami, rysowana w wielu pozach: oddech, mruganie, pochylenie z ręką przy uchu,
  szloch z otwartymi ustami, pięści w górze i uderzenie w stół, wymach ręką, rzut biletami, wycieranie nosa.
- Efekty: łzy tryskające łukiem, kałuża łez na stole, podskakujące mikrofony i szklanka przy uderzeniu, flesze
  aparatów, chusteczki.
- Tło (wodospad Kirifuri z płaczącymi oczami): dziś skała to płaskie romby, woda to proste paski, oczy są ledwo
  naszkicowane. Do zrobienia: kanciaste skały w stylu Hokusaia, animowana spadająca woda, mgła u stóp, pielgrzymi
  z parasolami, łzy z oczu.
- Gameplay do sprawdzenia: „głuchota” co drugi ruch w fazie 1 (2,2 s bez obrażeń) może frustrować; trzeba, żeby
  było widać, że strzały się odbijają. Zmierzyć czas walki i gęstość pocisków jak przy pozostałych bossach.

### 6. Babcia (tygrys w śniegu) — zrobione 15.11

Zostało: obejrzeć walkę w ruchu i ocenić jej czas z prawdziwym graczem. Poniżej pierwotna lista.

- Tło: tygrys jest płaski i toporny, bambusy jednolite. Przerobić tło, dodać padający śnieg i kołyszący się bambus.
- Boss: babcia i tygrysek mają po kilka klatek i są mali jak na bossa. Większe sprite'y, więcej póz i animacji.
- Ataki: przejrzeć od zera (czytelność zapowiedzi, balans, czas walki).
- Tygrys i wózek: zapowiedzi bez linii celowania, znakami w świecie gry (jak u kei cara i kota na budowie).

### 3. Kot na budowie — ruch w tle zrobiony 15.11

Zrobione: młoty, połysk biegnący po wąsach suma, mruganie, bąble w błocie, kurz z pęknięć, dym nad dachami.
Zostało: powtarzalne dachy Edo w górnej części.

- Ruch w tle: wąsy suma, ludzie z młotami, dym z kominów.
- Górna część z dachami Edo jest powtarzalna.

### 2. Kei car — częściowo zrobione 15.11

Zrobione: „BŁYSK!”, cienie arbuzów i strzałki malowane na jezdni zamiast okręgów i linii, jaskółki i czaple nad drogą.
Nie da się bez zmian w silniku: ruch na ziemi (rolnicy, woda, flagi), bo pola to jeden zapętlony obraz pędzący 70 px/s.
Zostało: słaby obraz startowy Nihonbashi.

- Ruch w tle: rolnicy, ptaki nad polami, zmarszczki na wodzie w poletkach, flagi przy herbaciarni.
- Arbuzy: zastąpić okręgi lądowania i strzałki godzin szczytu znakami w świecie gry.
- Obraz startowy Nihonbashi w pasie środkowym jest słabej jakości.
- Napis „PIKA PIKA” zmienić na „BŁYSK!”.

### 1. Automat (Wielka Fala) — zrobione 15.11

Zrobione: pasy chmur na pustym papierze i pięć kluczy lecących żurawi.

- Górne 60% tła to pusty papier: żurawie w locie albo chmury w stylu Hokusaia.

### 4. Kot bez końca — dobre

- Do sprawdzenia w grze: mruganie dymnego kota (głowa wchodzi w kadr dopiero pod koniec walki).
- Sprawdzone 15.11: w kodzie jest „MIAU!”; „MEOW!” to tłumaczenie pokazywane tylko przy języku angielskim.

### 5. Pokój otaku — dobre

- Do sprawdzenia w grze: błysk lokatora przy trafieniu (zmiana wypchnięta bez testu), animacje tła (pranie, kurz,
  GAME OVER w telewizorze), szybkie efekty (konfetti, plamy po bulionie).
- Poprawione 15.11: drugi ekran nie zostaje już na klatce pauzy, gdy boss padnie w trakcie dzwonka.
- Boss zajmuje więcej miejsca w pionie, odkąd lokator siedzi w fotelu przed biurkiem; ocenić, czy nie jest ciasno.

## Miasta

Wszystkie mają po kilkaset animowanych elementów (Kioto 1415, Osaka 871, Beppu 459, Sapporo 386, Nagasaki 366,
Hiroszima 336, Kagoshima 333, Okinawa 235).

### Kagoshima — zrobione 15.11

Przegląd w grze (`node tools/preview/stage-shots.mjs`) pokazał, że większość pierwotnej listy już istniała: promy
na Sakurajimę, delfiny, opad popiołu, żarzące się szczeliny, zasypana brama torii w Kurokami, pola rzodkwi, a w zatoce
także tagiri, statek wycieczkowy, kajaki, boje i hodowle ryb. Pierwotna ocena „pusto” wzięła się z oglądania samych
plików tła, bez ruchomych elementów.

Dodane:

- Nazwy miejsc na całej trasie (było 2, jest 17 różnych): Kagoshima-Chuo, Tenmonkan, Shiroyama, Kotsuki-gawa,
  Sengan-en, Sunamushi Onsen, Kurozu no Sato, Kinko-wan, Kanze, Okikojima, Shinjima, Sakurajima-ko, Sakurajima,
  Kurokami, Nojiri-gawa, Arimura, Yunohira, Minamidake.
- Zatoka: wysepka Okikojima (sosny, chram z torii, przystań z łodzią, czaple) i rafa Kanze z latarnią (błysk, piana
  przyboju, kormorany).
- Lawa: koryto spływów błotnych Nojiri-gawa w betonowych ścianach, z zaporami przeciwrumowiskowymi (jedna szczelinowa
  ze stalowych rur), zakończone osadnikiem z koparką i wywrotką; droga robocza łączy osadnik z szosą, nad korytem trzy
  żleby w popiele.

Zostało: nazwy nie były oglądane w grze na pasku (zrzuty robione ze skokiem w czasie zasłania plansza tytułowa).

### Okinawa — zrobione 15.11

Przegląd w grze pokazał to samo co w Kagoshimie: rafy, cienie mant, żółwie, humbaki, łodzie, statek wycieczkowy
i szkwały już były. Morze wyglądało pusto, bo raf było tylko osiem małych plam.

Dodane:

- Rafa barierowa u północnych brzegów (19 nowych płatów w przerywanym łuku, z przejściami dla łodzi) i pięć raf
  między wyspami Kerama. Rafy są danymi w `geo.mjs` (`REEFS`), więc koralowce i piana przyboju rysują się same.
- Regaty sabani między wyspami Kerama: sześć łodzi pod kolorowymi żaglami z wioślarzami i łódź eskorty.
- Farma mozuku na rafie: sieci z wodorostami w rzędach, tyczki, dwie płaskodenne łodzie, nurek.
- Nazwy miejsc na morskich odcinkach (było 9, jest 17 różnych): Kerama Shoto, Onna Kaigan, Yanbaru, Kouri Ohashi,
  Kouri-jima, Sangosho, Mozuku-batake, Maboroshi no Shima, Todai-jima.

### Sapporo — zrobione 16.11

Tu uwaga z dokumentu była trafna: przedmieście między skocznią a centrum to były same rzędy domów.

Dodane:

- Hokkaidō Jingū: brama torii, aleja z latarniami, pawilon pod śniegiem, jodły dookoła.
- Muzeum piwa (Sapporo Biiru-en): hala z czerwonej cegły z gwiazdą, komin z dymem, beczki na dziedzińcu.
- Szkoła podstawowa: budynek, boisko odśnieżone w prostokąt, bałwany, bramki.
- Każde z tych miejsc zajmuje jedną kwartę zamiast jej domów. Reszta miasta nie drgnęła ani o piksel (domy kwarty
  są losowane jak dawniej i cofane, żeby ciąg liczb losowych został ten sam).
- Nazwy miejsc: były 3, jest 13 (Maruyama, Hokkaido Jingu, Sapporo Biiru-en, Shogakko, Tokeidai, Akarenga,
  Nijo Ichiba, Toyohira-gawa, Nakajima Koen, Terebi-to i dawne trzy).

Nie zrobione: tramwaj (już jeździ w centrum, na przedmieściu nie ma torów, którymi mógłby dokądś dojechać).

### Hiroszima — zrobione 16.11

Przegląd w grze: promy JR i Matsudai, łódź Aqua Net, łodzie robocze przy tratwach, rybacy, boje, mewy, jelenie
i tramwaje już były. Zatoka nużyła, bo przez 55 sekund powtarzały się tylko tratwy i wysepki.

Dodane:

- Procesja Kangen-sai w cieśninie przed Miyajimą: gozabune (trzy łodzie pod jednym pokładem, kurtyna, hōren pod
  złoconym dachem, muzycy, wielki bęben, lampiony) holowana przez dwie łodzie wioślarskie z Agi i Eby. Płynie po
  pętli, holowniki zawsze z przodu.
- Trzy kutry wioślarskie szkoły morskiej z Etajimy ścigające się między tratwami.
- Morświny bezpłetwe (sunameri) wynurzające się w trzech spokojnych miejscach poza torami promów.
- Nazwy miejsc: było 5, jest 22 (m.in. Mazda Stadium, Okonomimura / Hondori, Miyajimaguchi, Ono Seto, Kaki Ikada,
  Kangen-sai, Omotesando, O-Torii, Itsukushima Jinja, Gojunoto / Senjokaku, Daisho-in, Momijidani, Misen).

### Kioto, Osaka, Beppu, Nagasaki

- Nic wartego ruszania w tłach.

## Sprawy techniczne

- Poprawione 15.11: testy `nagasaki` i `rendering` uruchamiają przeglądarkę i serwer tak jak pozostałe (bez ścieżki
  do Chrome z Windowsa). `rendering` przechodzi; `nagasaki` pada na asercji widoczności sprite'a 13×12 — padał tak
  samo przed zmianą, do zbadania osobno.
