# Mapa Japonii: regiony i kamera

Na mapie jest 12 miast, a dojdzie drugie tyle (Okayama, Himeji, Kobe, Nara, Uji, Nagoya, Hakone, Atami, Kamakura,
Yokohama, Saitama, Kumamoto). Już teraz w Kiusiu i między Hiroszimą a Kioto nazwy wchodzą na siebie, bo
cała Japonia mieści się na 180 px szerokości. Dlatego mapa przybliża się do regionu, w którym jest miasto.

## Regiony

Siedem regionów, z północy na południe (dane w `src/data/japan.js`, `REGIONS`):

| region | miasta teraz | dojdą |
| --- | --- | --- |
| HOKKAIDŌ | Sapporo | |
| KANTŌ | Tokio | Saitama, Jokohama, Kamakura, Hakone, Atami |
| CHŪBU | Kawaguchiko | Nagoja |
| KANSAI | Kioto, Osaka | Kobe, Himeji, Nara, Uji |
| CHŪGOKU | Onomichi, Hiroszima | Okayama |
| KIUSIU | Fukuoka, Beppu, Nagasaki, Kagoshima | Kumamoto |
| OKINAWA | Okinawa | |

Każdy region ma swoje pole na mapie, czyli to, co ma być widać nawet przy jednym mieście, np. całe Hokkaido.
Kamera ustawia się tak, żeby zmieścić to pole i miasta regionu z miejscem na nazwy. Nowe miasto
dopisuje się tylko do listy swojego regionu.

## Zasada nazw

- Gdy kamera jest przybliżona, widać nazwy miast tylko z regionu, który jest w kadrze.
- Gdy widać całą Japonię, w trakcie przelotu i w finale, zamiast nazw miast widać nazwy regionów.
- Nazwy miast same omijają siebie nawzajem, kropki, pieczątki i statek (`placeNames` w `src/game/mapCamera.js`).
  Każda najpierw próbuje swojego miejsca z danych etapu, potem nad kropką, pod nią i po bokach. Dlatego nowe
  miasta nie wymagają ręcznego ustawiania.
- Pod napisami u góry i u dołu ekranu mapa ciemnieje, żeby napisy było dobrze widać.

## Menu wyboru miasta

- Suwak zostaje. Kropki są w grupach regionów, z odstępem między grupami, a grupa wybranego miasta jest
  podkreślona. Strzałki i przeciąganie chodzą po kolei z suwaka.
- Pod napisem WYBIERZ MIASTO jest nazwa regionu.
- Po wybraniu miasta w tym samym regionie statek przelatuje, a kamera tylko się dosuwa. Po wybraniu
  miasta w innym regionie kamera oddala się w połowie lotu i przybliża na nowy region.

## Mapa między etapami

- Na starcie kamera jest na regionie miasta, które właśnie zaliczyłeś.
- Lot w tym samym regionie odbywa się w zbliżeniu.
- Lot do innego regionu: kamera oddala się tak, żeby zmieścić oba miasta, a pod koniec lotu przybliża się
  na region celu. Postój na „niespodziewanego gościa” wypada w oddaleniu.
- W finale widać całą Japonię i nazwy regionów.

## Ostrzejsza grafika

Mapa `japan.png` ma 3 px na jednostkę, więc przy pięciokrotnym zbliżeniu byłaby rozmyta. Dlatego
`tools/art/japan.mjs` rysuje osobno każdy region w gęstszej skali (`japan_<region>.png`). Ten sam relief i te
same kolory, ale drobniejsze wybrzeże, pola, miasta jako szare plamy zabudowy i linia Shinkansenu. Gra
nakłada ten rysunek na mapę ogólną i płynnie przechodzi między nimi przy zbliżaniu.

## Dalej

- Przy nowych miastach: dopisać je do regionów (test `mapRegions` pilnuje kompletu) i dodać słowa
  liczby miast w podpisie menu (do 24).
- Decyzja autora (2026-11-20): jedna podróż przechodzi przez wszystkie 24 miasta.
- Pomysł na później: odblokowywanie map za pieczątki. Na razie nic z tym nie robimy.

## Więcej szczegółów: iteracje (propozycja, 2026-11-21)

Stan dziś, w zbliżeniach regionów: góry to gładkie plamy cienia bez grzbietów i dolin (Alpy i środek Hokkaido to
białe placki), wszystkie niziny pokrywa ten sam wzór poletek, miasta to szare kwadraty, małe wyspy to elipsy
(Morze Wewnętrzne, Izu, Okinawa), Okinawa to patyk w pustej ramce, Biwa ma zły kształt, rzek jest kilkanaście
i są proste, nie ma dróg, mostów, promów, portów ani niczego, po czym poznać miejsce. Kafle są przy największym
zbliżeniu powiększane ok. 1,2 raza.

W grze (suwak po regionach) widać jeszcze, że w zbliżeniu przebija mapa ogólna: przy Tokio złoty róg ramki Okinawy
i płaska Fuji-obrazek przy lewym brzegu, nad Okinawą powiększona dżonka, w Chūbu łuski fal, a tam, gdzie kafel się
kończy (lewy brzeg Kantō, dół Chūgoku), mapa nagle robi się rozmyta. To idzie do iteracji 1: kafle sięgają
wszystkiego, co widać w kadrze któregoś regionu, a ozdoby mapy ogólnej (dżonki, wieloryb, chmury, róża wiatrów,
Fuji-obrazek, łuski, ramka Okinawy) gasną przy zbliżaniu.

Każda iteracja to osobny commit, oglądany w menu przed następną. Wszystko rysuje `tools/art/japan.mjs`, więc
mapa ogólna (między etapami) zyskuje to samo, ale w swojej skali.

1. **Rzeźba terenu.** Wysokość z grzbietów i dolin (pasma z nazwami: Alpy Północne, Środkowe, Południowe jako
   trzy grzbiety, Ōu, Chūgoku, Shikoku, Kiusiu, Hidaka, Daisetsu), doliny rzek wcinające się w góry, kotliny
   (Nara, Kioto, Matsumoto, Kōfu). Cieniowanie z ostrymi grzbietami i żlebami. Wulkany jako stożki z kraterami:
   Fuji na nowo, Asama, Aso z kalderą, Unzen, Kirishima, Sakurajima, Yōtei, Daisetsu. Śnieg tylko na szczytach,
   las mieszany (iglasty ciemniej, liściasty jaśniej), tarasy ryżowe na zboczach. Kafle w skali 1:1 do zbliżenia.
2. **Wybrzeża i wody.** Gęstsze linie brzegu: riasy Sanriku, Wakasa i Shimy, Noto, Kii, Ariake z równiami
   pływowymi. Wyspy jako prawdziwe kształty zamiast elips: Shōdoshima, wyspy Shimanami, Etajima, Miyajima,
   Gotō, Iki, Tsushima, Yakushima, Tanegashima, Izu, Okinawa w prawdziwym kształcie z Keramą i Kume, rafy i
   laguny. Biwa poprawiona, nowe jeziora (Towada, Inawashiro, Suwa, Kasumigaura, Shinji, Shikotsu, Tōya, Akan).
   Kilkadziesiąt rzek, meandrujących, z deltami. Głębia morza w warstwicach, rów japoński.
3. **Ziemia i miasta.** Pola według regionu: duże prostokąty Hokkaido i lawenda Furano, ryż w dolinach z
   połyskiem wody, herbata Shizuoki i Kagoshimy, sady, szklarnie. Miasta w swoim kształcie (wzdłuż zatoki, w
   kotlinie), ze śródmieściem wyższym i jaśniejszym, przedmieściami rozpływającymi się w pola, parkami i
   zamkowymi fosami. Wioski wzdłuż dolin.
4. **Komunikacja.** Autostrady i zwykła kolej (cieńsze niż Shinkansen), mosty: Akashi-Kaikyō, Seto-Ōhashi,
   Shimanami-Kaidō, Kanmon, Tokyo Bay Aqua-Line. Promy przerywaną linią, porty z falochronami i dźwigami,
   lotniska (Haneda, Kansai na swojej wyspie, Centrair, Fukuoka, Naha).
5. **Miejsca.** Miniaturka przy każdym mieście z jego etapu (pagoda Kioto, zamek Osaki, kopuła Hiroszimy,
   torii Miyajimy w wodzie, Skytree, wieża zegarowa Sapporo, Shuri, dymiąca Sakurajima, pary Beppu,
   pagoda Chūreitō nad Kawaguchiko) i znane miejsca bez etapu (Himeji, Ise, Nikkō, Matsushima, Kanazawa).
   Miniaturki nie wchodzą pod nazwy miast (dopisane do przeszkód w `placeNames`).
6. **(dodatek, poza prośbą) Życie na mapie.** Promy płynące po swoich liniach, pociągi Shinkansen, dym
   Sakurajimy i Aso, pary Beppu, cienie chmur. Rusza się tylko to, co pływa, jedzie lub leci.

## Dziennik

- 2026-11-20: plan; regiony, kamera w menu i między etapami, ostrzejsze rysunki regionów.
- 2026-11-21: propozycja sześciu iteracji szczegółów mapy.
- 2026-11-21: iteracja 1. Rzeźba: 42 pasma jako grzbiety z bocznymi grzbietami w poprzek osi, 40 kotlin i równin,
  doliny rzek wcięte w góry, 33 wulkany (stożki ze żlebami i kraterami, kaldery Aso, Hakone i Akan, czynne z popiołem,
  samotne stożki z płaskim podnóżem, Fuji i Yōtei z czapą śniegu w smugach), cieniowanie z krzywizną (grzbiety
  jaśniej, fałdy ciemniej), granica lasu i śniegu zależna od szerokości, lasy liściaste, plantacje sugi, iglaste
  pod granicą lasu, kwitnące dzikie wiśnie, tarasy ryżowe po warstwicach. Czysty kadr: kafel `japan_mid` (cała
  Japonia, 8 px na jednostkę, bez ozdób) od zbliżenia 1,25, ostre kafle zachód i środek (18 px, 1:1) od 3,2,
  wstawka Okinawy osobno, widoczna tylko w kadrze Okinawy (`insetFocus`). Test pilnuje, że każdy kadr regionu jest
  ostry od brzegu do brzegu. Pliki mapy: 5,7 MB (było 2,3 MB). `node tools/gen-art.mjs --only=map` rysuje samą mapę.
- 2026-11-21: iteracja 2. Geografia w `tools/art/japan-geo.mjs`. Gęstsze wybrzeże Morza Japońskiego (Shimane z
  Shinji i Nakaumi, Tango, Wakasa, Noto, zatoka Toyama, Oga, Tsugaru, zatoka Mutsu, Shimokita) i Hokkaido (Uchiura,
  Nemuro, Shiretoko); riasy wycinane drobno (Sanriku, Wakasa, Shima, Kii, Uwajima, Saikai i Hirado, Tsushima, Gotō,
  Amakusa, Izu, Saiki), z dala od portów miast. Wyspy w swoich kształtach: Sado, Tsushima, Iki, Hirado, Gotō,
  Yakushima, Tanegashima, Amami, Shōdoshima, Oki, Izu Ōshima z Miharą, Rishiri ze stożkiem, Rebun, Okushiri,
  Okinawa z Motobu i Katsuren, Kume, Kerama, Ie, Aguni; Shimanami, Etajima, Kurahashi, Miyajima, Suō-Ōshima;
  rozsiane wysepki Morza Wewnętrznego, Kujūku-shima, Matsushimy, zatoki Ago, Gotō, Amakusy; rafy Okinawy z laguną i
  przybojem. Biwa z Chikubushimą, Kasumigaura, Shinji, Nakaumi, Inawashiro, Saroma, Towada, Shikotsu, Tōya z wyspą,
  Kussharo, Suwa, Chūzenji, Tazawa, Ogawara, Mashū, Akan. 62 rzeki od źródła do ujścia, gładkie, meandrujące niżej,
  szersze ku ujściu, z deltą Ōty w Hiroszimie. Morze barwione głębią, izobaty cienkimi liniami, rowy Japoński,
  Izu-Ogasawara, Nankai i Ryūkyū, równie pływowe Ariake. Wąskie plaże tylko na płaskich brzegach, skały na
  stromych, cienki przybój. Wstawka Okinawy obejmuje tylko to, co przy Okinawie (`inInset`): zachodnie Gotō
  wychodziły dotąd pasem przez całą mapę.
- 2026-11-21: iteracja 3. Niziny pocięte na nieregularne dzielnice, każda z własnym ułożeniem pól (prosto na
  północy, w misach ryżowych i na Chikushi) i uprawami swojego regionu wiosną (`CROPS` w `japan-geo.mjs`): zalane
  pola ryżowe z odbiciem nieba, świeżo posadzony ryż, pszenica, kwitnący rzepak, warzywa w rzędach, zaorana ziemia,
  herbata Makinohary, Uji i Chiranu, kwitnące brzoskwinie Kōfu i Okayamy, jabłonie Tsugaru i Nagano, mikan Aridy i
  Ehime, szklarnie Kōchi, Atsumi, Kumamoto i Miyazaki, na Hokkaido wielkie pola pszenicy, buraków i pastwisk z
  pasami drzew, lawenda Furano, trzcina Okinawy; miedze między polami, przysiółki w gajach. Dna dolin rzecznych w
  górach uprawne, z przysiółkami. Miasta (ok. 120) rozlewają się po płaskim i stają u podnóża wzgórz: śródmieście z
  jasnymi wysokimi blokami i ich cieniami, aleje, dachy domów w siatce ulic rzednące w pola, gaje świątynne i
  parki; siatka prosto w Kioto, Narze, Nagoi, Sapporo, Asahikawie, Obihiro i Takayamie. Zamki w fosach (Pałac
  Cesarski, Osaka, Nagoya, Himeji, Kumamoto, Hiroszima i inne) jako znaki, parki (Nara, Ōdōri, Yoyogi, Shuri,
  Park Pokoju).
- 2026-11-21: iteracja 4. Autostrady (Tōmei, Meishin, San'yō, Chūgoku, Kiusiu, Nagasaki, Ōita, Chūō, Kan-Etsu,
  Tōhoku, Jōban, Hokuriku, Hokkaido i inne) bursztynowe w ciemnym obrysie; nad cieśninami mosty z jasnym pomostem,
  cieniem na wodzie i pylonem przy brzegu (Akashi-Kaikyō, Ōnaruto, Seto-Ōhashi, Shimanami, Kanmon, Aqua-Line z
  tunelem pod zatoką). Stare linie kolejowe ciemne z jasnymi kreskami (San'in, Uetsu, Ōu, Kisei, Nippō, Yosan, Dosan,
  Hakodate, Nemuro, Sōya). Promy przerywaną linią (Aomori–Hakodate, Ōarai–Tomakomai, Tsuruga i Maizuru–Otaru, Sado,
  Izu, Sakurajima, Yakushima, Iki i Tsushima, Gotō, Beppu–Osaka, Uno–Takamatsu, Hiroszima–Matsuyama, Miyajima,
  Wakayama–Tokushima, Naha–Tokashiki i Kume). Porty z pirsami, dźwigami i falochronami (Tokio, Jokohama, Chiba,
  Nagoya, Osaka, Kobe, Sakai, Kitakiusiu, Hakata, Hiroszima, Mizushima, Tomakomai i inne). Lotniska z płytą i
  pasami (Haneda, Narita, Kansai, Itami, Kobe, Centrair, Chitose, Fukuoka, Naha i inne), sztuczne wyspy lotnisk
  Kansai, Kobe, Centrair i Nagasaki.
