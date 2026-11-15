import { setCustomFrame } from './enemyArt.js';

// The looks out of the gachapon, put on the ship (ship.look, see Loadout.buildShip).
//
// A paint job: sprites540 has every hull in neutral white (<frame>_g) and each colour of its livery as a white
// layer (<frame>_p0, _p1...: the main colour first). The layers are laid over the white ship, each multiplied by
// its colour, into a texture of the game's own that then stands in for the hull's three frames wherever the
// ship is drawn.
const css = (c) => `#${c.toString(16).padStart(6, '0')}`;
const BANKS = ['', '_l', '_r'];

// The enemies' standard bullets (eb_s, eb_m and their frames) in a shape and a colour out of the gachapon: the
// shape's frames (the gacha atlas, tools/art/ebullets.mjs) or the bullets' own are copied into a texture of the
// game's, their magenta turned into the colour, and that texture stands in for them.
const EB = ['eb_s', 'eb_m'];
const ebFrames = (n) => [n, ...[0, 1, 2, 3, 4, 5, 6, 7].map((k) => `${n}_${k}`), ...[0, 1, 2].map((k) => `${n}_f${k}`)];
const EB_CELL = 34;
let ebWorn = '';

function bulletSkin(scene, ship) {
  const color = ship.look?.ebColor ?? null;
  const shape = ship.look?.ebShape ?? null;
  const from = scene.textures.exists(shape ? 'gacha' : 'sprites') ? scene.textures.get(shape ? 'gacha' : 'sprites') : null;
  const name = (f) => (shape ? `${f}_${shape}` : f);
  const worn = (color == null && !shape) || !from?.has(name('eb_s')) ? '' : `${color}|${shape}`;
  if (worn === ebWorn) return;
  ebWorn = worn;
  const all = EB.flatMap(ebFrames);
  if (!worn) {
    for (const f of all) setCustomFrame(f, null);
    return;
  }
  const w = EB_CELL * ebFrames('eb_s').length;
  const h = EB_CELL * EB.length;
  let tex = scene.textures.exists('eb_skin') ? scene.textures.get('eb_skin') : null;
  if (!tex) {
    tex = scene.textures.createCanvas('eb_skin', w, h);
    EB.forEach((n, row) => ebFrames(n).forEach((f, i) => {
      const size = scene.textures.get('sprites').get(f).cutWidth;
      tex.add(f, 0, i * EB_CELL, row * EB_CELL, size, size);
    }));
  }
  const src = from.getSourceImage();
  const ctx = tex.context;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w, h);
  EB.forEach((n, row) => ebFrames(n).forEach((f, i) => {
    const fr = from.get(name(f));
    ctx.drawImage(src, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, i * EB_CELL, row * EB_CELL, fr.cutWidth, fr.cutHeight);
  }));
  if (color != null) {
    // (the rule of tools/art/ebullets.mjs recolour(): magenta becomes the colour, its tints and darks with it)
    const body = [(color >> 16) & 255, (color >> 8) & 255, color & 255];
    const img = ctx.getImageData(0, 0, w, h);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const g = d[i + 1];
      if (!d[i + 3] || d[i] - g < 40 || d[i + 2] - g < 40) continue;
      const t = (g - 60) / 195;
      for (let k = 0; k < 3; k++) d[i + k] = t >= 0 ? Math.round(body[k] + (255 - body[k]) * Math.min(1, t)) : Math.round(body[k] * (g / 60));
    }
    ctx.putImageData(img, 0, 0);
  }
  tex.refresh();
  for (const f of all) setCustomFrame(f, 'eb_skin');
}

/** Paint the ship (or show it in its own livery again), and dress the enemies' bullets. Returns the ship. */
export function applySkin(scene, ship) {
  bulletSkin(scene, ship);
  const base = ship.frame;
  const atlas = scene.textures.exists('sprites540') ? scene.textures.get('sprites540') : null;
  const colors = ship.look?.paint;
  if (!colors || !atlas?.has(`${base}_g`)) {
    for (const b of BANKS) setCustomFrame(`${base}${b}`, null);
    return ship;
  }
  const first = atlas.get(`${base}_g`);
  const w = first.cutWidth;
  const h = first.cutHeight;
  const key = `skin_${base}`;
  let tex = scene.textures.exists(key) ? scene.textures.get(key) : null;
  if (!tex) {
    tex = scene.textures.createCanvas(key, w * BANKS.length, h);
    BANKS.forEach((b, i) => tex.add(`${base}${b}`, 0, i * w, 0, w, h));
  }
  const src = atlas.getSourceImage();
  const ctx = tex.context;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, w * BANKS.length, h);
  const layer = document.createElement('canvas');
  layer.width = w;
  layer.height = h;
  const l = layer.getContext('2d');
  BANKS.forEach((b, i) => {
    const g = atlas.get(`${base}${b}_g`);
    ctx.drawImage(src, g.cutX, g.cutY, w, h, i * w, 0, w, h);
    for (let r = 0; atlas.has(`${base}${b}_p${r}`); r++) {
      const p = atlas.get(`${base}${b}_p${r}`);
      l.globalCompositeOperation = 'source-over';
      l.clearRect(0, 0, w, h);
      l.drawImage(src, p.cutX, p.cutY, w, h, 0, 0, w, h);
      l.globalCompositeOperation = 'multiply';
      l.fillStyle = css(colors[r] ?? colors[0]);
      l.fillRect(0, 0, w, h);
      l.globalCompositeOperation = 'destination-in'; // (the fill is kept only where the layer is)
      l.drawImage(src, p.cutX, p.cutY, w, h, 0, 0, w, h);
      ctx.drawImage(layer, i * w, 0);
    }
  });
  tex.refresh();
  for (const b of BANKS) setCustomFrame(`${base}${b}`, key);
  return ship;
}

/** The engine flame in the ship's colour (a sprite playing 'flame'). Returns how long it burns (1: as ever). */
export function flameLook(sprite, ship) {
  const f = ship.look?.flame;
  const anim = f ? 'flamew' : 'flame';
  if (sprite.anims.getName() !== anim) sprite.play(anim);
  if (!f) sprite.clearTint();
  else if (f.bottom) sprite.setTint(f.top, f.top, f.bottom, f.bottom);
  else sprite.setTint(f.top);
  return f?.long ?? 1;
}
