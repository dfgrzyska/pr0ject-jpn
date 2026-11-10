// Folklore entries describe their inspiration, not a claim that every game enemy is a yokai.
const spirit = (id, stage, frame, name, pl, en, type, category = 'YOKAI') =>
  ({ id, stage, frame, name, pl, en, type, category });
export const YOKAI = [
  spirit('kitsune', 'stage1', 'popcorn_0', 'KITSUNE', 'Za lisią maską kryje się mistrz przemian. W chramach Inari lis służy jako posłaniec bóstwa; tutaj jego oblicze nosi dron.', 'Behind the fox mask lurks a shapeshifter. At Inari shrines, foxes serve as divine messengers; here a drone wears their face.', 'popcorn'),
  spirit('chochin', 'stage1', 'diver_0', 'CHOCHIN-OBAKE', 'Jeden błysk oka, długi język i lampion przestaje być lampionem. Chochin-obake przypomina, że nawet przedmioty mają swoje sekrety.', 'One eye opens, a long tongue slips out: this is no ordinary lantern. Chochin-obake gives a familiar object a mischievous life.', 'diver'),
  spirit('tanuki', 'stage1', 'tanuki_0', 'TANUKI', 'Wielki brzuch, kapelusz i sake: ten gość wygląda niewinnie. W opowieściach tanuki zwodzi ludzi, przybierając coraz to nowe postacie.', 'A round belly, a hat and sake: an innocent-looking guest. In folklore, tanuki fool people by taking one surprising shape after another.', 'heavy'),
  spirit('kyubi', 'stage1', 'kyubi_idle', 'KYUBI', 'Dziewięć ogonów, dziewięć znaków niezwykłej mocy. Legendarny lis przybiera w grze postać strażnika Kioto otoczonego lisim ogniem.', 'Nine tails reveal extraordinary power. Our legendary fox guards Kyoto in a swirl of fox fire, each tail joining the dance.', 'boss'),
  spirit('shisa', 'stage2', 'shisa_a_0', 'SHISA', 'Z dachu i sprzed bramy spoglądają lwi strażnicy Okinawy. Ich groźne pyski mają odpędzać zło. W grze para pilnuje całej wyspy.', 'From rooftops and gates, Okinawa\'s lion guardians watch. Their fierce faces ward off evil; our pair stands guard over the island.', 'boss', 'STRAŻNIK / GUARDIAN'),
  spirit('yukionna', 'stage3', 'yukionna_0', 'YUKI-ONNA', 'Wśród śnieżnych wirów pojawia się piękna kobieta. To Yuki-onna: w zimowych opowieściach za jej spokojem kryje się śmiertelny chłód.', 'A beautiful woman appears in swirling snow. This is Yuki-onna: in winter tales, her calm beauty conceals a deadly chill.', 'heavy'),
  spirit('kappa', 'stage4', 'kappa_0', 'KAPPA', 'Pod taflą czai się kappa. Jej sekret to woda w zagłębieniu na głowie: według opowieści właśnie od niej zależy siła tej istoty.', 'A kappa waits beneath the surface. Its secret is the water in the dish on its head: in folklore, that water sustains its strength.', 'diver'),
  spirit('raiju', 'stage4', 'raiju_0', 'RAIJU', 'Błysk rozcina niebo, a w ślad za nim mknie Raiju. Bestia piorunów ma w dawnych wyobrażeniach wiele zwierzęcych postaci.', 'Lightning splits the sky and Raiju races in its wake. Old depictions give this thunder beast many different animal forms.', 'heavy'),
  spirit('neko', 'stage5', 'neko_base', 'MANEKI-NEKO', 'Uniesiona łapa woła gości do środka. Maneki-neko przynosi sklepom szczęście i klientów; w grze ten talizman został wieżyczką.', 'A raised paw beckons visitors inside. Maneki-neko brings shops luck and customers; in our game, the charm becomes a turret.', 'turret', 'TALIZMAN / CHARM'),
  spirit('oni', 'stage6', 'oni_0', 'ONI', 'Rogi, potężna sylwetka i zła sława. A jednak podczas Setsubun przeciw oni wystarcza garść fasoli: zło precz, szczęście do domu!', 'Horns, a towering figure and a fearsome name. At Setsubun, people meet oni with handfuls of beans: evil out, good fortune in!', 'boss'),
  spirit('heikegani', 'stage7', 'heike_0', 'TAKA-ASHI-GANI', 'Japoński krab pająkowaty, największy stawonóg świata: nogi do 3,7 m. Żyje w głębinach i dożywa stu lat.', 'The Japanese spider crab, the largest arthropod alive: legs up to 3.7 m. It lives in the deep and can reach a hundred years.', 'heavy', 'STWÓR GŁĘBIN / DEEP-SEA GIANT'),
  spirit('sankibo', 'stage7', 'sankibo_0', 'SANKIBO / TENGU', 'Na górze Misen czeka Sankibo. Ten tengu należy do miejscowych opowieści Miyajimy, w których góry są domeną niezwykłych mocy.', 'Sankibo awaits on Mount Misen. This tengu belongs to Miyajima\'s local lore, where the mountains are a realm of mysterious powers.', 'boss'),
  spirit('oranda', 'stage8', 'n_oranda_0', 'ORANDA-BUNE', 'Statek tańczy na lądzie! Podczas Nagasaki Kunchi tragarze obracają holenderski okręt. Ten festiwalowy wir stał się atakiem w grze.', 'A ship dances on land! At Nagasaki Kunchi, bearers spin a Dutch ship float. That festival whirl inspired its spinning attack.', 'heavy', 'FESTIWAL / FESTIVAL'),
  spirit('jaodori', 'stage8', 'n_ja_0', 'JA-ODORI', 'Złota kula prowadzi, długi smok podąża za nią. Tancerze Kunchi ożywiają go wspólnym ruchem; stąd pomysł na finałowy taniec bossa.', 'A golden ball leads and a long dragon follows. Kunchi dancers bring it to life together, inspiring our boss\'s final dance.', 'boss', 'FESTIWAL / FESTIVAL'),
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
  dish('champon', 'stage8', 'CHAMPON', 3240, 92, 'SHINCHI', 'Makaron w sycącym bulionie z warzywami, mięsem i owocami morza. Specjał Nagasaki opowiada o chińskich wpływach w portowym mieście.', 'Noodles in a hearty broth with vegetables, meat and seafood. This Nagasaki speciality reflects the port city and its Chinese influences.'),
  dish('castella', 'stage8', 'CASTELLA', 2716, 136, 'DEJIMA', 'Miękkie ciasto z jaj, cukru i mąki z brązową skórką. Przybyło wraz z Portugalczykami i stało się słynną słodyczą Nagasaki.', 'Soft egg, sugar and flour cake with a brown crust. Introduced by Portuguese traders, it became a celebrated Nagasaki sweet.'),

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
