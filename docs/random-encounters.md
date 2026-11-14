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
| 1 | Automat z napojami (`ex1`, `src/game/enemies/jihanki.js`) | *Wielka fala w Kanagawie* Hokusaia (ok. 1831), fala z gazowanego napoju, puszki zamiast łodzi | zrobiony |
| 2 | Kei car | *53 stacje Tōkaidō* Hiroshigego, droga jak taśma, orszak daimyō | plan |
| 3 | Kot w żółtym kasku i walące się rusztowanie (własny kot, bez pozy/hasła znanego mema) | namazu-e (1855), sum pod ziemią | plan |
| 4 | Nieskończenie długi kot | *Smok dymu uciekający z Fuji* Hokusaia | plan |
| 5 | Pokój hikikomori / otaku (bossem jest pokój) | „plakaty” w stylu portretów aktorów Sharaku (1794) | plan |
| 6 | Babcia z fioletowymi włosami i tygrysem na koszulce | *Tygrys w śniegu* Hokusaia (1849) | plan |
| 7 | Boss od łez i ręki przy uchu (nawiązanie do zachowania, bez nazwiska, wyglądu i funkcji) | do ustalenia | plan |

Bez prawdziwych marek na puszkach, autach, kubkach i okładkach.

## 1. Automat z napojami (JIHANKI)

Stałe: `JIHANKI` w `src/game/enemies/jihanki.js` (2600 HP, progi faz 66% / 33%).

- **Faza 1 — automat ma dość:** puszki gorące (czerwone) i zimne (niebieskie) lecą łukiem w gracza (miga
  pierścień w miejscu lądowania). Gorąca rozlewa kałużę kawy: stanie w niej grzeje działa jak para w Beppu (gorące
  strzały, potem przegrzanie). Zimna — kałużę lodowej brei: szron spowalnia statek, a po chwili zamraża go w
  bryłę (mechanika szronu z Sapporo). Kałuża trwa 5,5 s. Do tego wachlarz monet i kurtyna z przycisków (strzały
  spadają po kolei wzdłuż frontu, z luką na trzy).
- **Faza 2 — wstrząśnięty, nie zmieszany:** automat się trzęsie (cały ekran z nim), „SZURU SZURU!”, potem
  „PSSSHHH!” i dwa krzyżujące się strumienie piany. Wstrząśnięte puszki pękają spiralą.
- **Faza 3 — loteria:** cyfry na wyświetlaczu kręcą się i stają po kolei. Pierwsze losowanie zawsze przegrywa;
  potem 35% na cztery takie same: „ATARI!”, automat oszołomiony na 3,5 s (bierze 1,6× obrażeń) i wypluwa trzy
  złote puszki — złapane dają punkty, a przy zużytej bombie — bombę. Przegrana („HAZURE...”): szał, puszki spadają
  z góry ekranu. Między losowaniami automat skacze za graczem.
