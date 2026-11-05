// A pixel-art festival evening, with room for the title and the four menu cards.
// Kept in the sprite atlas: no extra download or canvas work during play.
import { Raster, mix, rng } from '../lib/raster.mjs';

export function menuSprites() {
  const out = [];
  const add = (name, raster) => out.push({ name, raster });
  const r = new Raster(180, 220);
  const rand = rng(1987);
  for (let y = 0; y < r.h; y++) for (let x = 0; x < r.w; x++) {
    const c = y < 128 ? mix(0x111b36, 0x805568, Math.max(0, y - 28) / 100) : mix(0x493d57, 0x111c2b, Math.min(1, (y - 128) / 50));
    r.set(x, y, c);
  }
  // A warm moon, and Fuji's snow still catching the last light.
  r.disc(131, 90, 21, 0xb47a78, 0.25);
  r.disc(131, 90, 17, 0xffc68e);
  r.disc(129, 88, 15, 0xffdba8);
  for (let x = 25; x < 170; x++) {
    const d = Math.max(0, Math.abs(x - 91) - 3);
    const ridge = Math.round(87 + d * 0.74);
    for (let y = ridge; y < 146; y++) {
      const snow = y < 104 + Math.sin(x * 0.43) * 3 && d < 24;
      r.set(x, y, snow ? (x < 90 ? 0xffe1c4 : 0xb9b8ce) : x < 90 ? 0x615779 : 0x454860);
      if (!snow && (x + y * 2) % 21 === 0) r.set(x, y, 0x72708a, 0.35);
    }
  }
  for (let layer = 0; layer < 3; layer++) for (let x = 0; x < 180; x++) {
    const y = Math.round(130 + layer * 9 + Math.sin(x / (16 + layer * 5) + layer) * 5);
    r.rect(x, y, 1, 44, [0x4b4965, 0x303b54, 0x202d43][layer]);
  }
  // Five-roof pagoda and the warm windows of a distant shopping lane.
  for (let i = 0; i < 5; i++) {
    const cy = 100 + i * 12, half = 8 + i * 2;
    r.rect(29 - half + 3, cy, half * 2 - 6, 9, 0x6b3540);
    for (const x of [26, 31]) r.rect(x, cy + 2, 2, 5, 0xffbb6a);
    for (let x = -half; x <= half; x++) {
      const roof = cy - 4 + Math.floor(Math.abs(x) * 0.25);
      r.rect(29 + x, roof, 1, 4, 0x17273b);
      r.set(29 + x, roof, 0xb27465);
    }
    r.set(29 - half, cy - 3, 0xd6a377); r.set(29 + half, cy - 3, 0xd6a377);
  }
  r.line(29, 84, 29, 97, 0xe1b783);
  for (let y = 86; y < 96; y += 3) r.rect(27, y, 5, 1, 0x956961);
  for (let i = 0; i < 7; i++) {
    const x = 104 + i * 12, y = 137 + (i % 3) * 5;
    r.rect(x, y, 10, 27, 0x342b37);
    r.rect(x - 2, y - 3, 14, 4, 0x172334);
    for (let k = 0; k < 3; k++) r.rect(x + 2 + k * 3, y + 5, 2, 7, 0xffbc71);
  }
  // Torii, framing rather than crossing the title. Dark roof, worn vermilion timber.
  for (const x of [11, 162]) {
    r.rect(x + 2, 33, 7, 146, 0x472734);
    r.rect(x, 32, 6, 142, 0xac443c);
    r.rect(x, 34, 2, 137, 0xdf7250);
    r.rect(x - 1, 170, 8, 5, 0x20263a);
  }
  for (let x = 1; x < 179; x++) {
    const y = 24 + Math.round(5 * Math.sin(x / 180 * Math.PI));
    r.rect(x, y, 1, 7, 0x8d3539);
    r.rect(x, y, 1, 2, 0xef9b6d);
    r.rect(x, y - 3, 1, 3, 0x182237);
  }
  r.rect(7, 44, 166, 4, 0x8b3538); r.rect(9, 44, 162, 1, 0xd66b4d);
  // Flowering branches reach in from both sides, leaving a quiet centre for the logo.
  for (const side of [-1, 1]) {
    const ox = side < 0 ? 0 : 179;
    r.line(ox, 17, ox - side * 43, 4, 0x392338);
    r.line(ox, 18, ox - side * 22, 50, 0x392338);
    for (let i = 0; i < 35; i++) {
      const x = ox - side * rand.int(0, 37), y = rand.int(0, 29);
      if (x > 25 && x < 155 && y > 18) continue;
      const c = rand.pick([0x87465f, 0xc57891, 0xefa8b7, 0xffd6d7]);
      r.disc(x, y, rand.int(1, 3), c);
      r.set(x, y, 0xffe2c4);
    }
  }
  // A smooth fade into the navy textile under the menu.
  for (let y = 174; y < 220; y++) for (let x = 0; x < 180; x++) r.set(x, y, 0x111c2b, (y - 174) / 45);
  add('menu_evening', r);

  const cloth = new Raster(180, 24);
  cloth.rect(0, 0, 180, 24, 0x111c2b);
  // Seigaiha wave pattern, intentionally subdued behind the cards.
  for (let row = 0; row < 3; row++) for (let cx = -12; cx < 204; cx += 24) {
    const x = cx + (row % 2) * 12, cy = row * 12 + 12;
    for (const radius of [4, 8, 12]) for (let dx = -radius; dx <= radius; dx++) {
      const y = cy - Math.round(Math.sqrt(radius * radius - dx * dx));
      cloth.set(x + dx, y, 0x29364a, 0.6);
    }
  }
  add('menu_waves', cloth);

  const lantern = new Raster(18, 34);
  lantern.line(9, 0, 9, 6, 0xc89d72);
  lantern.ellipse(9, 17, 8, 11, 0x792d38);
  lantern.ellipse(9, 16, 7, 10, 0xd85843);
  lantern.ellipse(8, 16, 4, 9, 0xffb663);
  for (let y = 9; y < 25; y += 3) lantern.line(3, y, 14, y, 0x963b35, 0.5);
  lantern.rect(5, 5, 8, 2, 0x2a2634); lantern.rect(5, 26, 8, 2, 0x2a2634);
  lantern.line(9, 28, 9, 32, 0xeb9a56); lantern.rect(7, 31, 5, 2, 0xc34e3d);
  add('menu_lantern', lantern);

  for (const primary of [false, true]) for (const active of [false, true]) {
    const card = new Raster(152, 30);
    card.rect(1, 2, 150, 28, 0x090e18);
    card.rect(0, 0, 152, 27, primary ? (active ? 0xc94b3b : 0x973c37) : (active ? 0xffebc4 : 0xe3d1ae));
    card.rect(2, 2, 148, 1, primary ? 0xffbc79 : 0xb49b74);
    card.rect(2, 24, 148, 1, primary ? 0x742c31 : 0xc0a479);
    card.rect(2, 2, 1, 23, primary ? 0xf08b58 : 0xb49b74);
    card.rect(149, 2, 1, 23, primary ? 0xf08b58 : 0xb49b74);
    if (!primary) {
      for (let i = 0; i < 150; i++) card.set(rand.int(4, 147), rand.int(4, 23), 0xab885d, 0.12);
      card.rect(31, 5, 1, 17, 0xc3ab83);
      card.rect(120, 5, 1, 17, 0xc3ab83);
    }
    if (active) { card.rect(0, 0, 3, 27, 0xffcf85); card.rect(149, 0, 3, 27, 0xffcf85); }
    add(`menu_${primary ? 'start' : 'paper'}_${active ? 'on' : 'off'}`, card);
  }
  return out;
}
