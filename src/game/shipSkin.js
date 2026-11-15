import { setCustomFrame } from './enemyArt.js';

// The looks out of the gachapon, put on the ship (ship.look, see Loadout.buildShip).
//
// A paint job: sprites540 has every hull in neutral white (<frame>_g) and each colour of its livery as a white
// layer (<frame>_p0, _p1...: the main colour first). The layers are laid over the white ship, each multiplied by
// its colour, into a texture of the game's own that then stands in for the hull's three frames wherever the
// ship is drawn.
const css = (c) => `#${c.toString(16).padStart(6, '0')}`;
const BANKS = ['', '_l', '_r'];

/** Paint the ship (or show it in its own livery again). Returns the ship. */
export function applySkin(scene, ship) {
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
