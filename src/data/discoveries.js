// Folklore entries describe their inspiration, not a claim that every game enemy is a yokai.
const spirit = (id, stage, frame, name, pl, en, type, category = 'YOKAI') =>
  ({ id, stage, frame, name, pl, en, type, category });
export const YOKAI = [
  spirit('kitsune', 'stage1', 'popcorn_0', 'KITSUNE', 'Lisy z opowieści potrafią zmieniać postać. Przy chramach Inari lis jest posłańcem bóstwa. W grze jego maska zdobi drona.', 'Foxes in folklore can change shape. At Inari shrines the fox is a divine messenger. Its mask decorates our drone.', 'popcorn'),
  spirit('chochin', 'stage1', 'diver_0', 'CHOCHIN-OBAKE', 'Papierowy lampion ożywa, otwiera jedno oko i wysuwa język. Ten figlarny straszak należy do świata ożywionych przedmiotów.', 'A paper lantern comes alive, opens one eye and sticks out its tongue. This playful spook belongs to the world of animated objects.', 'diver'),
  spirit('tanuki', 'stage1', 'tanuki_0', 'TANUKI', 'Mistrz przemian i psot. Figurki z wielkim brzuchem, kapeluszem i butelką sake witają gości przed japońskimi lokalami.', 'A shapeshifting trickster. Round-bellied statues with a hat and sake bottle welcome guests outside Japanese shops.', 'heavy'),
  spirit('kyubi', 'stage1', 'kyubi_idle', 'KYUBI', 'Dziewięć ogonów zdradza niezwykłą moc legendarnego lisa. Nasz boss splata ten motyw z lisim ogniem i scenerią Kioto.', 'Nine tails mark the legendary fox\'s extraordinary power. Our boss combines this motif with fox fire and the scenery of Kyoto.', 'boss'),
  spirit('shisa', 'stage2', 'shisa_a_0', 'SHISA', 'Lwi strażnicy Okinawy czuwają na dachach i przy wejściach. Mają odpędzać zło. W grze występują jako para obrońców wyspy.', 'Okinawa\'s lion guardians watch from roofs and entrances, warding off evil. In the game they defend the island as a pair.', 'boss', 'STRAŻNIK / GUARDIAN'),
  spirit('yukionna', 'stage3', 'yukionna_0', 'YUKI-ONNA', 'Kobieta śniegu pojawia się w opowieściach o zimowych nocach. Jej piękno skrywa śmiertelny chłód. W grze przywołuje zamieć.', 'The snow woman appears in tales of winter nights. Her beauty conceals a deadly chill. In the game she summons a blizzard.', 'heavy'),
  spirit('kappa', 'stage4', 'kappa_0', 'KAPPA', 'Wodna istota z miseczką na głowie. W opowieściach jej siła zależy od wody w tym zagłębieniu. Nasza kappa czai się pod taflą.', 'A water creature with a dish on its head. In folklore its strength depends on the water held there. Our kappa lurks beneath the surface.', 'diver'),
  spirit('raiju', 'stage4', 'raiju_0', 'RAIJU', 'Bestia piorunów towarzyszy burzom. Dawne wyobrażenia nadają jej różne zwierzęce kształty. W grze przemyka wśród błyskawic.', 'The thunder beast accompanies storms. Old depictions give it different animal forms. In the game it darts among lightning bolts.', 'heavy'),
  spirit('neko', 'stage5', 'neko_base', 'MANEKI-NEKO', 'Kot z uniesioną łapą zaprasza szczęście i klientów. To talizman, a nie groźny demon. Nasza wieżyczka mruga do tej tradycji.', 'The raised-paw cat invites fortune and customers. This lucky charm inspired our beckoning turret.', 'turret', 'TALIZMAN / CHARM'),
  spirit('oni', 'stage6', 'oni_0', 'ONI', 'Rogate olbrzymy pojawiają się w wielu opowieściach. Podczas Setsubun rzuca się fasolę, odpędzając oni i zapraszając szczęście.', 'Horned giants appear in many tales. During Setsubun, people throw beans to drive oni away and invite good fortune.', 'boss'),
  spirit('heikegani', 'stage7', 'heike_0', 'HEIKE-GANI', 'Wzór na pancerzu kraba przypomina twarz wojownika. Legenda wiąże te kraby z duszami wojowników rodu Heike.', 'The crab\'s shell resembles a warrior\'s face. Legend connects these crabs with the spirits of warriors of the Heike clan.', 'heavy', 'LEGENDA / LEGEND'),
  spirit('sankibo', 'stage7', 'sankibo_0', 'SANKIBO / TENGU', 'Tengu są związane z górami i niezwykłymi mocami. Sankibo należy do tradycji góry Misen na Miyajimie, gdzie kończy się ten etap.', 'Tengu are mountain beings with magical powers. Sankibo belongs to the lore of Mount Misen on Miyajima, where this stage ends.', 'boss'),
];

const dish = (id, stage, name, u, x, place, pl, en) => ({ id, stage, name, u, x, place, pl, en, frame: `food_${id}` });
export const FOODS = [
  dish('yatsuhashi', 'stage1', 'YATSUHASHI', 350, 38, 'GION', 'Słodycz kojarzona z Kioto. Miękkie nama yatsuhashi składa się w trójkąt, często z nadzieniem ze słodkiej fasoli.', 'A Kyoto sweet. Soft nama yatsuhashi is folded into a triangle, often around a sweet bean filling.'),
  dish('inari', 'stage1', 'INARI-ZUSHI', 1500, 140, 'FUSHIMI INARI', 'Ryż do sushi zamknięty w słodkawej kieszeni ze smażonego tofu. Tofu łączy się w tradycji z lisimi posłańcami Inari.', 'Sushi rice tucked into a sweet fried-tofu pocket. Tofu is traditionally associated with Inari\'s fox messengers.'),
  dish('andagi', 'stage2', 'SATA ANDAGI', 2800, 34, 'TSUBOYA', 'Okinawskie słodkie kulki smażone na złoto. Pęknięta skórka kryje gęste, miękkie ciasto.', 'Golden fried sweet dough balls from Okinawa. A cracked crust surrounds a dense, soft centre.'),
  dish('goya', 'stage2', 'GOYA CHAMPURU', 2940, 140, 'MAKISHI', 'Okinawska mieszanka z patelni z gorzkim melonem goya i tofu. Często dodaje się jajko i wieprzowinę.', 'An Okinawan stir-fry with bitter melon and tofu, often joined by egg and pork.'),
  dish('ramen', 'stage3', 'MISO RAMEN', 3350, 40, 'SUSUKINO', 'Sapporo słynie z ramenu na bazie miso. Gorący bulion i sprężysty makaron świetnie pasują do śnieżnego krajobrazu.', 'Sapporo is known for miso ramen. Hot broth and springy noodles suit its snowy scenery.'),
  dish('corn', 'stage3', 'YAKI TOMOROKOSHI', 5480, 140, 'ODORI', 'Grillowana kukurydza pachnąca sosem sojowym. To przysmak kojarzony ze stoiskami w parku Odori.', 'Grilled corn fragrant with soy sauce, associated with the stalls of Odori Park.'),
  dish('shirokuma', 'stage4', 'SHIROKUMA', 650, 36, 'KAGOSHIMA', 'Deser z lodu z mlekiem skondensowanym i owocami. Jego nazwa oznacza białego niedźwiedzia.', 'Shaved ice with condensed milk and fruit. Its name means polar bear.'),
  dish('karukan', 'stage4', 'KARUKAN', 1680, 142, 'SENGAN-EN', 'Lekki przysmak z Kagoshimy z mąki ryżowej, cukru i pochrzynu. Wersja manju skrywa nadzienie z fasoli.', 'A light Kagoshima sweet made with rice flour, sugar and yam. The manju version contains bean paste.'),
  dish('kushi', 'stage5', 'KUSHIKATSU', 3330, 40, 'SHINSEKAI', 'Panierowane i smażone kąski na patyczkach, mocno kojarzone z dzielnicą Shinsekai w Osace.', 'Breaded, deep-fried bites on skewers, closely associated with Osaka\'s Shinsekai district.'),
  dish('takoyaki', 'stage5', 'TAKOYAKI', 4390, 54, 'DOTONBORI', 'Kulki z ciasta z kawałkiem ośmiornicy, pieczone w okrągłych zagłębieniach patelni. Uliczny klasyk Osaki.', 'Batter balls with a piece of octopus, cooked in round moulds. An Osaka street-food classic.'),
  dish('toriten', 'stage6', 'TORITEN', 2480, 36, 'KANNAWA', 'Kurczak w lekkim cieście smażony jak tempura. To jedna ze specjalności prefektury Oita, w której leży Beppu.', 'Chicken fried in a light tempura-style batter. A speciality of Oita Prefecture, home to Beppu.'),
  dish('pudding', 'stage6', 'JIGOKU-MUSHI PURIN', 3420, 128, 'UMI JIGOKU', 'Budyń gotowany na parze gorących źródeł. W Beppu ciepło ziemi służy również do przyrządzania jedzenia.', 'Custard pudding cooked with hot-spring steam. In Beppu, the earth\'s heat is used for cooking too.'),
  dish('okonomiyaki', 'stage7', 'OKONOMIYAKI', 2600, 40, 'HIROSHIMA', 'W wersji z Hiroszimy składniki układa się warstwami. Kapusta i makaron trafiają na płytę razem z cienkim plackiem.', 'The Hiroshima version is layered. Cabbage and noodles cook on the griddle with a thin pancake.'),
  dish('momiji', 'stage7', 'MOMIJI MANJU', 5600, 142, 'MIYAJIMA', 'Ciastko w kształcie liścia klonu, kojarzone z Miyajimą. Klasyczne nadzienie to słodka pasta z fasoli.', 'A maple-leaf-shaped cake associated with Miyajima. The classic filling is sweet bean paste.'),
];

export function yokaiForEnemy(stage, enemy, bossDefeated = false) {
  if (enemy.type === 'boss' && !bossDefeated) return null;
  return YOKAI.find((entry) => entry.stage === stage && entry.type === enemy.type) ?? null;
}

// Shared by the game and tests; no Phaser or browser dependency here.
export function createDiscoveryStore(storage) {
  const key = 'shmupjp.discoveries.v1';
  const valid = new Set([...YOKAI, ...FOODS].map((entry) => entry.id));
  let found = {};
  try {
    const raw = JSON.parse(storage?.getItem(key));
    if (raw && typeof raw === 'object' && !Array.isArray(raw))
      for (const [id, date] of Object.entries(raw)) if (valid.has(id) && typeof date === 'string') found[id] = date;
  } catch { /* a damaged save starts an empty journal */ }
  return {
    has: (id) => Object.hasOwn(found, id),
    date: (id) => found[id] ?? null,
    discover(id) {
      if (!valid.has(id) || Object.hasOwn(found, id)) return false;
      found[id] = new Date().toISOString().slice(0, 10);
      try { storage?.setItem(key, JSON.stringify(found)); } catch { /* keep discoveries for this session */ }
      return true;
    },
  };
}
