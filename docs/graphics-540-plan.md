# Plan dalszej rozbudowy oprawy do 540 px

Krok wspólny jest wdrożony: bufor 540 × 960–1260, kamera 3×, logika 180 × 320–420,
sterowanie w jednostkach logicznych oraz tekstury tylko bieżącego i następnego miasta.
Poniższe kroki są planem, nie częścią obecnego wdrożenia.

## 1. Przy pierwszym mieście przygotować obsługę dwóch gęstości grafiki

- Dodać do metadanych tła jawny współczynnik gęstości, np. `artScale: 1 | 3`.
  Brak pola oznacza dotychczasową grafikę. Pozwoli to migrować miasta pojedynczo.
- Pozostawić `length`, `chunkHeight`, pozycje dekoracji, trasy, prędkości i punkty
  charakterystyczne w obecnych jednostkach logicznych. Wymiary plików i prostokąty
  klatek atlasu będą w pikselach tekstury.
- W `Parallax.js` wyświetlać nowe fragmenty tła w skali 1/3. Osobno przeliczyć
  `TileSprite`: skalę kafla, przesunięcie tekstury i okres zapętlenia dalekiego tła.
- W `Props.js` uwzględnić 1/3 w skali bazowej dekoracji, również przy animowaniu
  ich rozmiarów i ponownym użyciu obiektów. Same pozycje i ruch pozostawić bez zmian.
- Zachować korektę siatki pikseli wyłącznie dla starych grafik; nowe grafiki powinny
  korzystać z pojedynczych pikseli bufora 540 px.
- Dostosować generator tak, aby przebudowa jednego miasta nie zmieniała wspólnego
  atlasu. Obecne `--only=stageN` nadal generuje wspólne sprite’y, fonty i inne zasoby.
- Sprawdzić rozmiary fragmentów oraz atlasów na docelowych urządzeniach. Obecny
  fragment ma 1792 px wysokości; po potrojeniu miałby 5376 px. W razie potrzeby
  dzielić go na mniejsze części, zachowując ciągłość współrzędnych logicznych.

## 2. Kyoto jako pierwszy pełny etap

1. Utrwalić obrazy porównawcze początku, środka, minibossa i końca etapu.
2. Narysować dalekie tło w nowej gęstości, dodając rzeczywiste detale.
3. Przerysować główny pas terenu: najpierw układ i duże bryły, potem architekturę,
   roślinność, materiały i światło. Zachować położenie obiektów względem fal.
4. Przerysować dekoracje i wszystkie klatki ich animacji, dopasowując je do tła.
5. Zostawić obecne statki, przeciwników, pociski, HUD i menu.
6. Przejść kontrolę opisaną w kroku 4 i dopiero wtedy rozpocząć następne miasto.

## 3. Powtarzać migrację miasto po mieście

Kolejność: Okinawa → Sapporo → Kagoshima → Osaka → Beppu → Hiroshima/Miyajima → Nagasaki.
Każde miasto to osobna, możliwa do oceny zmiana: dalekie tło → teren → dekoracje
→ animacje otoczenia → testy. Nie przebudowywać wszystkich miast naraz.

W Nagasaki dodatkowo dostosować `NagasakiView.js`: siedem warstw panoramy,
maski świateł, promy i kilwatery. Ich rozmiary przeliczyć zgodnie z gęstością
grafiki, zachowując istniejące przesunięcia, paralaksę oraz moment pojawienia się widoku.

## 4. Warunek ukończenia każdego miasta

- Sprawdzić przeglądarkę przy wysokości logicznej 320, 420 i wartości pośredniej,
  różnych skalach ekranu oraz na telefonie.
- Obejrzeć przewijanie, łączenia fragmentów, granice kafli, pozycje połówkowe,
  animacje, wstrząsy kamery i przejście do kolejnego miasta.
- Potwierdzić zgodność położeń fal, wieżyczek i charakterystycznych punktów terenu.
- Sprawdzić czytelność pocisków i hitboxu na bardziej szczegółowym tle.
- Zmierzyć czas klatki, czas wczytywania i pamięć tekstur. Potrojenie obu wymiarów
  oznacza dziewięć razy więcej pikseli dla danej tekstury.
- Sprawdzić zwolnienie poprzedniego miasta, ponowne wejście do niego oraz działanie
  po aktualizacji cache PWA i bez sieci. Zachować testy logiki i build bez błędów.

## 5. Dopiero po ukończeniu teł zaktualizować przeciwników

1. Ustalić pakowanie nowych atlasów. Jeśli będą oddzielne dla miast, rozszerzyć
   ładowanie i zwalnianie tekstur oraz zarządzanie odwołującymi się do nich animacjami.
2. Migrować zestawy miasto po mieście: zwykli wrogowie → jednostki naziemne
   → miniboss → boss i jego części.
3. Zachować logiczny rozmiar obiektów, pivoty, pozycje uzbrojenia, hitboksy,
   trajektorie, czasy ataków, HP oraz obrażenia.
4. Uwzględnić skalę 1/3 w pulach sprite’ów: `Pool.spawn()` obecnie resetuje skalę
   do 1. Sprawdzić też kod animujący skalę i korzystający z szerokości klatek.
5. Porównać wszystkie klatki animacji oraz pełne walki z bossami. Powtórzyć
   kontrolę czytelności, wydajności i pamięci z kroku 4.

Statki gracza, HUD i menu pozostają w obecnej oprawie, dopóki nie zostanie ustalony
osobny zakres ich modernizacji.

## 6. Wspólne sprite’y w 540 px (zakres ustalony w listopadzie 2026)

Wspólny atlas `sprites.png` zostaje bez zmian (jest wzorcem rozmiarów dla testów i rezerwą). Obok niego powstaje
`sprites540.png` (+ `.json`) z tymi samymi nazwami klatek w dokładnie 3 × rozmiarze; gra bierze klatkę stamtąd,
jeśli ją tam znajdzie (jak atlasy wrogów miast), i pokazuje ją w skali 1/3. Wczytywany razem z `sprites` przed
ekranem tytułowym. Kolejność prac i co wchodzi:

| Grupa | Klatki | Uwagi |
| --- | --- | --- |
| A. Wybuchy i efekty | `expl_s/m/l`, `smoke`, `spark`, `debris`, `debris_hot`, `shard`, `splash`, `splat`, `scorch`, `muzzle`, `flame`, `bloodball`, `lavaball` | najczęściej na ekranie |
| B. Pociski wrogów | `eb_s`, `eb_m` (9 kolorów i klatki błysku), `eb_fox`, `eb_fox_s`, `eb_ice`, `eb_ink`, `eb_ink_m`, `eb_lava`, `eb_pearl`, `eb_bubble`, `eb_feather`, `eb_steam`, `orb`, `snowball`, `icicle`, `salmon`, `tokkuri`, `tako_ball`, `kitsunebi`, `misen_fire`, `n_keg`, `lob_mark` | promienie trafień bez zmian; rdzeń pocisku musi pozostać najjaśniejszy na ekranie |
| C. Statek gracza i jego rzeczy | `ship*` (3 statki × 3 przechyły), `ps_*` (strzały), `hitbox`, `ice_block`, `orizuru`, `orizuru_glow`, `pickup_*` | |
| D. HUD | `btn_*`, `icon_*`, `wpn_*`, `pip_*`, `stamp_icon` | najpierw makieta do akceptacji: font pikselowy zostaje w 1 × |

Poza zakresem: drobinki 1–3 px (`ashf`, `dot`, `drop`, `dust`, `flake`, `leaf`, `petal`, `momiji`, `streak`,
`ember`, `bean_bit`, `n_traffic`), elementy tła (`cloud`, `cshadow`, `mist`, `gull`, `n_view_*`, `steam`;
`steamf` już jest w 3 ×), `glow` (miękki gradient), ikony potraw, pieczątki i pieczęcie miast (album i menu).

Kontrole: test rozmiarów 3 × dla każdej klatki `sprites540`, `?hitbox` także dla pocisków i znajdziek,
porównanie zapisu ataków przed i po (te same ziarna), czytelność na najciemniejszych etapach (Osaka, Nagasaki).

