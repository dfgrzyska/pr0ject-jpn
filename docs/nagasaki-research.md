# Nagasaki — research and stage design

## References inspected

- [Mt. Inasa access and geography, official prefectural tourism](https://www.discover-nagasaki.com/en/featured-topics/access_mtinasa): the viewpoint above the western side of the port, ropeway from Fuchi-jinja, summit 333 m. The game depicts the ropeway, not the separate slope car.
- [Photographic panorama from Inasa](https://yakei.jp/report/first-nagasaki-guide/), [reference photograph](https://yakei.jp/photo/1280/inasayama3.jpg): viewed directly during implementation. Dense lights climb the opposite slopes on the left; dark port water opens across the middle, narrowing to the right toward the illuminated cable-stayed Megami Bridge. Shipyards sit on the near shore, with a large dark wooded foreground. No generic skyscraper skyline.
- [Official Nagasaki night-view locations](https://www.discover-nagasaki.com/en/featured-topics/nightscape-panorama): cross-checks the relationship between Inasa, the port, Glover Garden, Nabekanmuri and Megami Bridge. Photographs from Nabekanmuri must not be mistaken for Inasa views.
- [Gunkanjima tour map and aerial building plan](https://www.gunkanjima-concierge.com/pdf/leaflet2026_en.pdf), [JNTO Hashima](https://www.japan.travel/en/spot/752/), [school geography aerial reference](https://www2.news.ed.jp/bunrui/syoukai/gaiyou/77000ictkatuyou/250129.html): seawall outline, dense concrete apartment blocks on the residential side, central rocky ridge, industrial ruins and landing quay. Building 30, school complex and exposed courtyards are distinctive silhouettes. Hashima is southwest offshore, not in the inner harbour.
- [Glover Garden](https://www.discover-nagasaki.com/en/sightseeing/101), [illuminated landmarks](https://www.discover-nagasaki.com/en/featured-topics/nightscape-lightup): hillside Western houses, Oura church, stone steps, Dejima waterfront and the double arch of Meganebashi over the Nakashima River.
- [Peace Park, Nagasaki City](https://www.nagasakicity.com/spots/detail/209), [prefectural guide](https://www.discover-nagasaki.com/en/sightseeing/130): statue on the northern side of the memorial axis; figure's right arm points upward, left extends horizontally. Fountain commemorates victims seeking water; jets suggest wings. The hypocentre is a distinct site to the south. Neither memorial is a combat target.
- [Nagasaki Kunchi, official guide](https://www.discover-nagasaki.com/en/events_multilingual/60489), [JNTO festival overview](https://faq.japan-travel.jnto.go.jp/en/spot/343/), [JNTO cultural experience](https://www.japan.travel/en/experiences-in-japan/2812/): Dutch ship floats and Chinese-influenced Ja-odori dragon dance are locally grounded motifs. The dragon follows a pearl; it is a festival performance, not an assertion that a particular historical monster attacked Nagasaki.

## Route and adaptation

Gunkanjima → Megami Bridge / port entrance → Glover Garden and Oura → fan-shaped Dejima → Shinchi Chinatown → Meganebashi → Suwa Shrine → Urakami / Peace Park → port crossing and Fuchi-jinja ropeway → Inasa ascent → panoramic night-view coda.

This is a curated, compressed sightseeing route, not a scale navigational map. The south-to-north mainland progression and the westward turn toward Inasa preserve the major geographical relationships. Individual sights retain their recognisable outlines and architectural details. Twilight gradually turns to night.

## Enemies and encounter decisions

- Lantern drones: warm red/gold silhouettes based on the city's lantern festivities.
- Biidoro glass shooters: a short, visible pause followed by a turning glass-note volley.
- Hata kite divers: Nagasaki kite motif; a sideways approach followed by a hooked dive.
- Castella carriers: coloured gift boxes carrying weapon drops.
- Harbour winch turrets: paired shots at different speeds, inspired by working-port machinery.
- Miniboss: **Oranda-bune**, a Dutch-ship Kunchi float. Alternating port/starboard broadsides and staggered rows leave a readable passage. Better suited than another giant animal and tied to Nagasaki's history of exchange.
- Boss: **Ja-odori**, a long articulated festival dragon following its pearl. Pearl-led sweeps, paired curling streams, and a lantern procession with an announced safe lane. Festival colour palette, with a clear head hurtbox and decorative body segments.

The memorial interlude is a tribute, with guns/bombs held and combatants removed without score. After the boss is defeated, all combat ends. The ship climbs the dark wooded flank alongside the ropeway; scrolling slows and layered scenery dissolves into the night panorama. The city view is a reward, not a backdrop buried under bullets.

## Performance budget

Static scenery is generated offline into the existing strip chunks. Movers reuse PropKit pools. Panorama uses a handful of pre-rendered layers and grouped light masks rather than one object per window; traffic is a fixed blitter pool. No dynamic texture uploads, no runtime pixel painting, bounded boss/bullet populations. Camera motion uses differing layer offsets, and lights pulse at slow, varied rhythms rather than strobing. `?noprops` also suppresses panorama animations for comparison.

Reference photographs are research only; the shipped pixel artwork is newly drawn by the repository's raster generators.
