# Pomysły na dopracowanie gry

Stan na 15.11.2026. Lista powstała z przeglądu teł wszystkich 8 miast i 7 spotkań oraz grafik bossów babci
i mównicy. Przegląd był robiony na plikach grafik w `public/assets/bg/`, nie na grze w ruchu. Wrogowie i bossowie
miast nie byli oglądani.

## Ustalona kolejność

1. Spotkanie 7: zamiast mównicy duża postać człowieka przy stole.
2. Spotkanie 6 (babcia): tło, ruchy i grafika od nowa.
3. Miasta: szczegóły, animacje i nowe ważne miejsca tam, gdzie jest pustka.

## Spotkania

Liczba animowanych elementów tła: automat 10, kei car 0, kot na budowie 0, kot bez końca 5, pokój otaku 11,
babcia 0, mównica 0.

### 7. Płaczący człowiek przy stole (dziś: mównica) — najsłabsze

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

### 6. Babcia (tygrys w śniegu) — słabe, nietknięte

- Tło: tygrys jest płaski i toporny, bambusy jednolite. Przerobić tło, dodać padający śnieg i kołyszący się bambus.
- Boss: babcia i tygrysek mają po kilka klatek i są mali jak na bossa. Większe sprite'y, więcej póz i animacji.
- Ataki: przejrzeć od zera (czytelność zapowiedzi, balans, czas walki).
- Tygrys i wózek: zapowiedzi bez linii celowania, znakami w świecie gry (jak u kei cara i kota na budowie).

### 3. Kot na budowie — dobre, ale tło martwe

- Ruch w tle: wąsy suma, ludzie z młotami, dym z kominów.
- Górna część z dachami Edo jest powtarzalna.

### 2. Kei car — dobre, ale tło martwe

- Ruch w tle: rolnicy, ptaki nad polami, zmarszczki na wodzie w poletkach, flagi przy herbaciarni.
- Arbuzy: zastąpić okręgi lądowania i strzałki godzin szczytu znakami w świecie gry.
- Obraz startowy Nihonbashi w pasie środkowym jest słabej jakości.
- Napis „PIKA PIKA” zmienić na „BŁYSK!”.

### 1. Automat (Wielka Fala) — dobre

- Górne 60% tła to pusty papier: żurawie w locie albo chmury w stylu Hokusaia.

### 4. Kot bez końca — dobre

- Do sprawdzenia w grze: mruganie dymnego kota (głowa wchodzi w kadr dopiero pod koniec walki).
- Do sprawdzenia: gra pokazuje „MEOW!” zamiast „MIAU!” (wygląda na tłumaczenie tekstów efektów).

### 5. Pokój otaku — dobre

- Do sprawdzenia w grze: błysk lokatora przy trafieniu (zmiana wypchnięta bez testu), animacje tła (pranie, kurz,
  GAME OVER w telewizorze), szybkie efekty (konfetti, plamy po bulionie).
- Drugi ekran zostaje na klatce pauzy, jeśli boss padnie w trakcie dzwonka.
- Boss zajmuje więcej miejsca w pionie, odkąd lokator siedzi w fotelu przed biurkiem; ocenić, czy nie jest ciasno.

## Miasta

Wszystkie mają po kilkaset animowanych elementów (Kioto 1415, Osaka 871, Beppu 459, Sapporo 386, Nagasaki 366,
Hiroszima 336, Kagoshima 333, Okinawa 235).

### Kagoshima

- Dwa z ośmiu odcinków to prawie jednolite pole lawy, zatoka jest pusta.
- Dodać: prom na Sakurajimę, delfiny w zatoce, opad popiołu, żarzące się szczeliny, zasypaną bramę torii
  w Kurokami, pola rzodkwi.
- Nazwane są tylko 2 atrakcje (Sengan-en, Sakurajima). Kandydaci: Tenmonkan, Shiroyama, Kinko-wan, Kurokami.

### Okinawa

- Najmniej animacji; pierwszy i ostatni odcinek to otwarte morze z kilkoma wysepkami.
- Dodać: rafy koralowe pod wodą, cienie mant, łodzie, wieloryby.

### Sapporo

- Trzy odcinki to powtarzalna siatka osiedli.
- Nazwane są 3 atrakcje (Okurayama, Susukino, Odori), choć w tle jest więcej: rzeźby śnieżne, wieża telewizyjna,
  kopuła. Dodać nazwy.
- Przełamać siatkę: tramwaj, browar-muzeum, park.

### Hiroszima

- Odcinek z morzem i tratwami ostryg jest pusty.
- Dodać: promy na Miyajimę, jelenie na wyspie, tramwaje.
- Stadion baseballowy jest narysowany, ale bez nazwy.

### Kioto, Osaka, Beppu, Nagasaki

- Nic wartego ruszania w tłach.

## Sprawy techniczne

- Dwa testy w przeglądarce (`nagasaki`, `rendering`) mają wpisaną na sztywno ścieżkę do Chrome z Windowsa
  i nie uruchamiają się poza nim.
