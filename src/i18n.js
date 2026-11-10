// Two languages: Polish (the original) and English. The choice is kept in the browser; the first time, the
// browser's own language decides.
//
// The game is written in Polish, and the English comes in where text is drawn: pixelText() and the few
// setText() calls pass their text through tr(), which looks it up in the phrasebook below (whole phrases, or
// patterns for the ones with numbers and names in them). Anything not in it (scores, Japanese words) stays.
// t('key', { n: 3 }) is for texts written for both languages from the start.
const KEY = 'shmupjp.lang';

const STRINGS = {
  pl: {
    'book.title': 'KSIĄŻECZKA PIECZĄTEK',
    'book.rule': 'ETAP BEZ ŚMIERCI I BOMBY',
    'book.full': 'KOMPLET! OMEDETŌ!',
    'book.backTouch': '< > STRONA   DOTKNIJ - WRÓĆ',
    'book.backKeys': 'STRZAŁKI / ESC - POWRÓT',
    'book.openTouch': 'KSIĄŻECZKA - IKONA W ROGU',
    'book.openKeys': 'K - KSIĄŻECZKA PIECZĄTEK',
    'stamp.new': 'NOWA PIECZĄTKA!',
    'stamp.newEasy': 'NOWA PIECZĄTKA (BLADA)!',
    'book.easy': 'NA ŁATWYM',
    'stamp.have': 'PIECZĄTKA JUŻ W KSIĄŻECZCE',
    'stamp.missed': 'BEZ PIECZĄTKI',
    'lang.keys': 'L - ENGLISH',
    'app.touch': 'INSTALACJA - STRZAŁKA W ROGU',
    'app.keys': 'I - ZAINSTALUJ GRĘ',
    'app.ios1': 'JAKO APLIKACJA: UDOSTĘPNIJ',
    'app.ios2': '> DO EKRANU POCZĄTKOWEGO',
  },
  en: {
    'book.title': 'STAMP BOOK',
    'book.rule': 'NO DEATHS, NO BOMBS',
    'book.full': 'COMPLETE! OMEDETŌ!',
    'book.backTouch': '< / > PAGE   TAP - BACK',
    'book.backKeys': 'ARROWS / ESC - BACK',
    'book.openTouch': 'STAMP BOOK - CORNER ICON',
    'book.openKeys': 'K - STAMP BOOK',
    'stamp.new': 'NEW STAMP!',
    'stamp.newEasy': 'NEW STAMP (PALE)!',
    'book.easy': 'ON EASY',
    'stamp.have': 'STAMP ALREADY IN THE BOOK',
    'stamp.missed': 'NO STAMP',
    'lang.keys': 'L - POLSKI',
    'app.touch': 'INSTALL - ARROW IN THE CORNER',
    'app.keys': 'I - INSTALL THE GAME',
    'app.ios1': 'AS AN APP: TAP SHARE',
    'app.ios2': '> ADD TO HOME SCREEN',
  },
};

const EN = {
  'NAGASAKI - ŚWIATŁA PORTU': 'NAGASAKI - HARBOUR LIGHTS',
  'HOLENDERSKI STATEK KUNCHI': 'DUTCH SHIP OF KUNCHI',
  'SMOK ŚWIĘTA KUNCHI': 'DRAGON OF KUNCHI',
  'BURTY FESTIWALOWEGO STATKU': 'FESTIVAL SHIP BROADSIDES',
  'SMOK I ZŁOTA KULA': 'DRAGON AND GOLDEN PEARL',
  'TANIEC SMOKA ZAKOŃCZONY': 'THE DRAGON DANCE ENDS',
  'PRZED NAMI NOCNA INASA': 'INASA AT NIGHT AWAITS',
  'CHWILA PAMIĘCI': 'A MOMENT OF REMEMBRANCE',
  'NAGASAKI · 9 SIERPNIA 1945': 'NAGASAKI · 9 AUGUST 1945',
  'ŚWIATŁA PORTU NAGASAKI': 'NAGASAKI HARBOUR LIGHTS',
  'LEĆ PRZEZ JAPONIĘ': 'FLY ACROSS JAPAN',
  'WYRUSZ W PODRÓŻ': 'BEGIN YOUR JOURNEY',
  'SMAKI JAPONII': 'LOCAL FLAVOURS',
  'ALBUM YOKAI': 'YOKAI ALBUM',
  'WRÓCIĆ DO MENU?': 'RETURN TO MENU?',
  'ZAKOŃCZYSZ TĘ ROZGRYWKĘ': 'THIS RUN WILL END',
  'PODRÓŻ MOŻE POCZEKAĆ': 'THE JOURNEY CAN WAIT',
  'NIE, ZOSTAJĘ': 'NO, STAY HERE',
  'TAK, WRÓĆ DO MENU': 'YES, RETURN TO MENU',
  'KONTYNUUJ': 'RESUME',
  'MENU GŁÓWNE': 'MAIN MENU',
  'JAPONIA CZEKA': 'JAPAN AWAITS',
  'OSIEM MIAST. JEDNA PODRÓŻ.': 'EIGHT CITIES. ONE JOURNEY.',
  'DOTKNIJ, ABY WYBRAĆ': 'TAP TO CHOOSE',
  'NOWA GRA': 'NEW GAME',
  'PIECZĄTKI': 'STAMPS',
  'WYBIERZ MIASTO': 'CHOOSE A CITY',
  'DALEJ >': 'NEXT >',
  '< WRÓĆ': '< BACK',
  'STRZAŁKI / ENTER': 'ARROWS / ENTER',
  // title, pause, results
  PODSTAWOWA: 'BASIC',
  ROZRZUT: 'SPREAD',
  NAPROWADZANE: 'HOMING',
  'PRZESUWAJ PALCEM': 'DRAG TO MOVE',
  'STRZAŁKI / WASD - RUCH': 'ARROWS / WASD - MOVE',
  'BOMBA - PRZYCISK W ROGU': 'BOMB - BUTTON IN THE CORNER',
  'Z - BOMBA   ESC - PAUZA': 'Z - BOMB   ESC - PAUSE',
  'DŹWIĘK - GŁOŚNIK U GÓRY': 'SOUND - SPEAKER AT THE TOP',
  'M - DŹWIĘK': 'M - SOUND',
  'DOTKNIJ, ABY ZACZĄĆ': 'TAP TO START',
  'KONIEC GRY': 'GAME OVER',
  WYNIK: 'SCORE',
  'NOWY REKORD!': 'NEW RECORD!',
  'DOTKNIJ / ENTER - JESZCZE RAZ': 'TAP / ENTER - PLAY AGAIN',
  UKOŃCZONY: 'CLEAR',
  'BOMBA UZUPEŁNIONA': 'BOMB REFILLED',
  'GRATULACJE!': 'CONGRATULATIONS!',
  'DOTKNIJ / ENTER': 'TAP / ENTER',
  PAUZA: 'PAUSE',
  'DOTKNIJ, ABY WRÓCIĆ': 'TAP TO RESUME',
  'ESC - POWRÓT': 'ESC - RESUME',
  'UWAGA!': 'WARNING!',
  'WCZYTYWANIE...': 'LOADING...',
  'CIĘŻKI CEL': 'HEAVY TARGET',
  // the map
  'PODRÓŻ PO JAPONII': 'JOURNEY ACROSS JAPAN',
  'DOTKNIJ, ABY LECIEĆ': 'TAP TO FLY',
  'ENTER - LECIMY': "ENTER - LET'S GO",
  // ships
  'WYBIERZ STATEK': 'CHOOSE YOUR SHIP',
  PRĘDKOŚĆ: 'SPEED',
  'SIŁA OGNIA': 'FIREPOWER',
  ŻYCIA: 'LIVES',
  'DOTKNIJ PONOWNIE = START': 'TAP AGAIN = START',
  TRYB: 'MODE',
  NORMALNY: 'NORMAL',
  ŁATWY: 'EASY',
  'PEŁNE WYZWANIE': 'THE FULL CHALLENGE',
  'WIĘCEJ ŻYĆ I KONTYNUACJE': 'MORE LIVES AND CONTINUES',
  'TRYB ŁATWY': 'EASY MODE',
  'KONTYNUOWAĆ?': 'CONTINUE?',
  'PEŁNE ŻYCIA, WYNIK OD ZERA': 'FULL LIVES, SCORE FROM ZERO',
  'DOTKNIJ / ENTER - TAK': 'TAP / ENTER - YES',
  'STRZAŁKI - WYBÓR': 'ARROWS - CHOOSE',
  CIĘŻKI: 'HEAVY',
  SZYBKI: 'FAST',
  'GNIEW SZTURMOWY': 'ASSAULT FURY',
  'TALIZMANY OFUDA': 'OFUDA TALISMANS',
  'PĘD JASKÓŁKI': 'SWALLOW RUSH',
  'OFUDA!': 'OFUDA!',
  'WSTRZĄS!': 'SHOCKWAVE!',
  'SENBAZURU!': 'SENBAZURU!',
  'CIĘCIE WIATRU!': 'WIND CUT!',
  // in play
  'GORĄCE DZIAŁA': 'HOT GUNS',
  'PRZEGRZANIE!': 'OVERHEAT!',
  'BOMBA GOTOWA': 'BOMB READY',
  'AUTOBOMBA!': 'AUTO BOMB!',
  'FASOLKI!': 'BEANS!',
  'MOC MAX': 'POWER MAX',
  'MOC +1': 'POWER +1',
  'SHISA WPADA W SZAŁ!': 'THE SHISA GO WILD!',
  'NIEDŹWIEDŹ WPADA W SZAŁ!': 'THE BEAR GOES WILD!',
  'LÓD PĘKA!': 'THE ICE CRACKS!',
  'TO PRAWDZIWY NIEDŹWIEDŹ!': "IT'S A REAL BEAR!",
  'UKRADZIONE!': 'STOLEN!',
  'KRADZIEŻ BOMBY!': 'BOMB STOLEN!',
  'KRADZIEŻ MOCY!': 'POWER STOLEN!',
  'BOMBA ODZYSKANA': 'BOMB RECOVERED',
  'MOC ODZYSKANA': 'POWER RECOVERED',
  ROZTOPIONA: 'MELTED',
  'SAKURAJIMA WYBUCHA!': 'SAKURAJIMA ERUPTS!',
  'KRATER SIĘ OTWIERA!': 'THE CRATER OPENS!',
  'MACKI ODCIĘTE!': 'TENTACLES CUT!',
  'OŚMIORNICA WŚCIEKŁA!': 'THE OCTOPUS IS FURIOUS!',
  'RZUCAJ FASOLKI!': 'THROW THE BEANS!',
  'ZESTRZEL MASU I ZŁAP FASOLKI': 'SHOOT THE MASU, GRAB BEANS',
  'ONI WPADA W SZAŁ!': 'THE ONI GOES WILD!',
  // the ending
  'PODRÓŻ UKOŃCZONA': 'JOURNEY COMPLETE',
  'PODRÓŻ UKOŃCZONA!': 'JOURNEY COMPLETE!',
  PODRÓŻ: 'JOURNEY',
  UKOŃCZONA: 'COMPLETE',
  'PIECZĘCIE PODRÓŻY': 'SEALS OF THE JOURNEY',
  'KOMPLET W JEDNEJ GRZE!': 'ALL IN ONE GAME!',
  'BEZ ANI JEDNEJ STRATY!': 'NOT ONE SHIP LOST!',
  'SPRÓBUJ NA NORMALNYM': 'NOW TRY NORMAL',
  'BOSSOWIE PODRÓŻY': 'BOSSES OF THE JOURNEY',
  'DZIĘKUJEMY ZA GRĘ': 'THANKS FOR PLAYING',
  'KYUBI WPADA W SZAŁ!': 'KYUBI GOES WILD!',
  // the cities
  KIOTO: 'KYOTO',
  HIROSZIMA: 'HIROSHIMA',
  'KIOTO - DAWNA STOLICA': 'KYOTO - THE OLD CAPITAL',
  'OKINAWA - RAJSKIE WYSPY': 'OKINAWA - PARADISE ISLANDS',
  'SAPPORO - ŚNIEŻNA NOC': 'SAPPORO - SNOWY NIGHT',
  'BEPPU - GORĄCE ŹRÓDŁA': 'BEPPU - HOT SPRINGS',
  'HIROSZIMA - WYSPA ŚWIĄTYNI': 'HIROSHIMA - SHRINE ISLAND',
  // warnings and boss cards
  'TANUKI NADCHODZI': 'HERE COMES THE TANUKI',
  'KYUBI NADCHODZI': 'HERE COMES KYUBI',
  'MANTA NADCHODZI': 'HERE COMES THE MANTA',
  'SHISA NADCHODZĄ': 'HERE COME THE SHISA',
  'SHISA POKONANE!': 'SHISA DEFEATED!',
  'KYUBI POKONANY!': 'KYUBI DEFEATED!',
  'YUKI-ONNA NADCHODZI': 'HERE COMES YUKI-ONNA',
  'NIEDŹWIEDŹ SIĘ BUDZI': 'THE BEAR AWAKES',
  'NIEDŹWIEDŹ POKONANY!': 'BEAR DEFEATED!',
  'RAIJU NADCHODZI': 'HERE COMES RAIJU',
  'SAKURAJIMA SIĘ BUDZI': 'SAKURAJIMA AWAKES',
  'SAKURAJIMA UCICHŁA!': 'SAKURAJIMA FALLS QUIET!',
  'BUNRAKU SIĘ ZACZYNA': 'THE BUNRAKU BEGINS',
  'OŚMIORNICA NADCHODZI': 'HERE COMES THE OCTOPUS',
  'OŚMIORNICA POKONANA!': 'OCTOPUS DEFEATED!',
  'KROKODYL Z ONIYAMY': 'THE CROCODILE OF ONIYAMA',
  'ONI SIĘ BUDZI': 'THE ONI AWAKES',
  'FIGURKA Z SHIGARAKI': 'A SHIGARAKI FIGURINE',
  'LIS O DZIEWIĘCIU OGONACH': 'THE NINE-TAILED FOX',
  'WŁADCZYNI RAFY': 'QUEEN OF THE REEF',
  'PARA STRAŻNIKÓW Z DACHÓW': 'THE ROOFTOP GUARDIANS',
  'ŚNIEŻNA ZJAWA': 'THE SNOW WOMAN',
  'NIEDŹWIEDŹ Z FESTIWALU ŚNIEGU': 'BEAR OF THE SNOW FESTIVAL',
  'BESTIA PIORUNÓW': 'THE THUNDER BEAST',
  'ŻYWY WULKAN': 'THE LIVING VOLCANO',
  'LALKA I TRZECH LALKARZY': 'A PUPPET, THREE PUPPETEERS',
  'OŚMIORNICA Z DOTONBORI': 'THE OCTOPUS OF DOTONBORI',
  'CZERWONY DEMON Z CHINOIKE': 'THE RED DEMON OF CHINOIKE',
  'CIENIE DANNOURY W MORZU SETO': 'SHADOWS OF DANNOURA IN SETO',
  'WICHURA Z GÓRY MISEN': 'GALE FROM MOUNT MISEN',
  'WICHURA Z GÓRY MISEN!': 'GALE FROM MOUNT MISEN!',
  'SANKIBŌ POKONANY!': 'SANKIBŌ DEFEATED!',
  'CHWILA CISZY': 'A MOMENT OF SILENCE',
  'NIECH SPOCZYWAJĄ W POKOJU': 'MAY THEY REST IN PEACE',
  'WIECZNY OGIEŃ MISEN PŁONIE': 'ETERNAL FLAME OF MISEN BURNS',
  'KRAB SAMURAJ Z DANNOURY': 'SAMURAI CRAB OF DANNOURA',
  'WIELKI TENGU Z GÓRY MISEN': 'GREAT TENGU OF MOUNT MISEN',
  'SANKIBŌ WPADA W SZAŁ!': 'SANKIBŌ GOES WILD!',
  'GARDA!': 'GUARD!',
};

// phrases with numbers or names in them
const PATTERNS = [
  [/^ETAP (\d+)$/, (n) => `STAGE ${n}`],
  [/^DALEJ: ETAP (\d+) - (.+)$/, (n, city) => `NEXT: STAGE ${n} - ${tr(city)}`],
  [/^DALEJ: ETAP (\d+)$/, (n) => `NEXT: STAGE ${n}`],
  [/^MNOŻNIK ×(\d+)$/, (n) => `MULTIPLIER ×${n}`],
  [/^REKORD (\d+)$/, (n) => `BEST ${n}`],
  [/^MIASTA: (.+)$/, (n) => `CITIES: ${n}`],
  [/^STADO! \+(\d+)$/, (n) => `FLOCK! +${n}`],
  [/^KONTYNUACJE: (\d+)$/, (n) => `CONTINUES: ${n}`],
  [/^POZOSTAŁO KONTYNUACJI: (\d+)$/, (n) => `CONTINUES LEFT: ${n}`],
  [/^PIECZĄTKI: (.+)$/, (n) => `STAMPS: ${n}`],
  [/^STATEK: (.+)$/, (name) => `SHIP: ${name}`],
  [/^STRACONE STATKI: (\d+)$/, (n) => `SHIPS LOST: ${n}`],
  [/^UŻYTE BOMBY: (\d+)$/, (n) => `BOMBS USED: ${n}`],
  [/^CZAS GRY: (.+)$/, (time) => `PLAY TIME: ${time}`],
];

function initial() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch {
    /* ignore */
  }
  return (navigator.language || 'pl').toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

let lang = initial();
document.documentElement.lang = lang;

export function getLang() {
  return lang;
}

export function setLang(l) {
  lang = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(KEY, l);
  } catch {
    /* ignore */
  }
}

/** A text written for both languages. */
export function t(key, vars) {
  let s = STRINGS[lang][key] ?? STRINGS.pl[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
  return s;
}

/** A Polish text, in English when English is on (unchanged if the phrasebook doesn't know it). */
export function tr(s) {
  if (lang === 'pl' || typeof s !== 'string' || !s) return s;
  if (EN[s]) return EN[s];
  for (const [re, fn] of PATTERNS) {
    const m = s.match(re);
    if (m) return fn(...m.slice(1));
  }
  return s;
}

setLang(lang);
