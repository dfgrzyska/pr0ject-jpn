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
| 2026-11-19 | Claude | 1 (Onomichi, Kioto) | Projekty grafiki do akceptacji: `tools/art/onomichi/newfoes.mjs` (flagi tairyō-bata z leszczem nad falą, hassaku i jego połówki, prom z mostkiem-oczami, autami na pokładzie i rampą-szczęką, wrak nisko w wodzie) i `tools/art/kyoto/newfoes.mjs` (omikuji na słomianej linie między cynobrowymi słupkami z lisim ogniem, muszla kai-awase z oczami w szparze i jej złocone połówki z sosną i śliwą, yamaboko z drzewcem, sakaki, halabardą, gobelinami i twarzą demona, wrak przewrócony). Jeszcze nie w atlasach ani w grze. | Czeka na akceptację; prom ma 4 stopnie rozpadu, platforma też. |
