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

Gunkanjima → the coasts closing in, breakwater lights and channel buoys → Megami Ōhashi → inner harbour (Mitsubishi shipyard with the Giant Cantilever Crane and an LNG carrier, Matsugae terminal with a liner) → Oura (Ishibashi tram terminus, Glover-dori, Oura Cathedral) → Glover Garden on its terraces → Oranda-zaka → Dejima in its bay with the Omotemon bridge → Shinchi Chinatown → the Nakashima's bridges and Meganebashi → Suwa Shrine → the hypocentre and the Peace Park → the inner harbour crossing, Fuchi Shrine and the ropeway → the Inasa driveway → the summit, where the night view rises behind the ridge.

The strip's map (shores, river, roads, tramway) lives in `tools/art/nagasaki/geo.mjs`: every road and track runs edge to edge, loops, or ends at a terminus, car park or building; the Nakashima flows from Dejima's channel to off the west edge and every street crosses it on a bridge. Traffic routes are checked by the tests to start and end off the screen or to turn back.

This is a curated, compressed sightseeing route, not a scale navigational map. The south-to-north mainland progression and the westward turn toward Inasa preserve the major geographical relationships. Individual sights retain their recognisable outlines and architectural details. Twilight gradually turns to night.

## Enemies and encounter decisions

- Lantern drones: warm red/gold silhouettes based on the city's lantern festivities.
- Biidoro glass shooters: a short, visible pause followed by a turning glass-note volley.
- Hata kite divers: Nagasaki kite motif; a sideways approach followed by a hooked dive.
- Castella carriers: coloured gift boxes carrying weapon drops.
- Harbour winch turrets: paired shots at different speeds, inspired by working-port machinery.
- Miniboss: **Oranda-bune**, the Dutch-ship Kunchi float, meets the player at Dejima. Two broadside batteries are separate targets (one shot off silences its side). Rolling salvoes port by port with a bow chaser; at two thirds the *mawashi* spin (as the bearers spin the float at the festival) fires out of both sides in a reversing spiral; at one third it charges down an announced lane and lobs powder kegs.
- Boss: **Ja-odori**, a long articulated festival dragon following its pearl. Pearl-led sweeps, paired curling streams, and a lantern procession with an announced safe lane. Festival colour palette, with a clear head hurtbox and decorative body segments.

The memorial interlude is a tribute, with guns/bombs held and combatants removed without score; it lasts about 13 s. The ship then crosses the inner harbour and climbs Inasa with a few light waves; the scroll eases off as it crests the summit, and the night view rises from behind the ridge in parallax layers (the sky fixed, the city and port slower than the near slope, all shifting slightly with the ship). The Ja-odori dragon rises out of the city's lights and is fought over the dimmed view; when it falls the lights flare up and the stage ends a few seconds later.

## Performance budget

Static scenery is generated offline into the existing strip chunks. Movers reuse PropKit pools. Panorama uses a handful of pre-rendered layers and grouped light masks rather than one object per window; traffic is a fixed blitter pool. No dynamic texture uploads, no runtime pixel painting, bounded boss/bullet populations. Camera motion uses differing layer offsets, and lights pulse at slow, varied rhythms rather than strobing. `?noprops` also suppresses panorama animations for comparison.

Reference photographs are research only; the shipped pixel artwork is newly drawn by the repository's raster generators.

## Visual revision and second-pass review

Compared the initial art with Osaka's layered buildings and Hiroshima's textured materials. The initial Nagasaki strip had repeated flat roofs and circular trees; its panorama had a regular window grid, excessive empty foreground and little architectural depth.

The revised strip adds shaded crowns using the same nature renderer as other cities, masonry, concrete weathering, roof tiles, open stairwells, collapsed slabs, retaining terraces, planted gardens, veranda columns, pointed church windows, timber shopfronts, cargo yards and modelled bronze. Chinatown now has varied narrow shop buildings instead of repeated identical halls. The peace interlude and the recognisable right-arm-up / left-arm-out statue gesture are retained.

The requested additional review used the [official Hashima aerial photograph](https://www.nagasaki-tabinet.com/storage/tourism_attractions/51797/responsive_images/J7LrgWShqMqcAbS93Lx1UsWTEf9IfBMdo5mV6vJ6__1023_680.jpeg), [Oura photograph](https://rimage.gnst.jp/livejapan.com/public/article/detail/a/00/04/a0004962/img/en/a0004962_parts_60b59911e62c5.jpg) and the Inasa reference above. It prompted further changes: removed the invented intact mine-headframe, strengthened Hashima's rocky retaining terraces and schoolyard, differentiated Glover's wings, added Oura's pointed entrance bays and palms, and connected the panorama's dark eastern hills to the skyline rather than leaving an artificial circular hole in the city.

The new vista has atmospheric ridges, individually shaded terraced buildings, winding roads, waterfront blocks, broken reflection ribbons, dry dock and ship, varied cranes, near-side neighbourhoods and both lit Megami pylons. The port geometry is shared by the painter and runtime traffic so cars and ferries follow their actual roads/water. The artwork is a compressed portrait-format interpretation, not a cadastral reconstruction.

Life pass: walking visitors, fixed street traffic, restaurant steam, glowing signs, river glints, working hoists, the existing tram/ropeway, plus three ferries and wakes in the final view. Static detail is baked in four strip textures and seven panorama textures. The vista keeps 24 light points and six ferry/wake images; nothing is allocated per window or per animation frame.

Validation: `npm test`, `npm run build`, and the optional Chrome integration test at 180×320 and 180×420. The latter covers the route, silent memorial, boss phases, scroll gate, victory, panorama, pause and stage clear; it checks that ferry positions and window alpha change while scene-object count stays constant. Screenshots of Hashima, Oura, Shinchi and Inasa are written to the ignored `tools/preview/` directory.

Optional browser test setup: `npm install --prefix tools/preview/browser-runtime --no-save --package-lock=false playwright`, then `node tools/tests/nagasaki.browser.mjs`. Set `CHROME_PATH` if Chrome is installed elsewhere. Headless rendering is not a performance measurement on a physical phone.
