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

## Dziennik

- 2026-11-20: plan; regiony, kamera w menu i między etapami, ostrzejsze rysunki regionów.
