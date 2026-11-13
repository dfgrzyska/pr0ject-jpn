// Stage 7 (Hiroshima & Miyajima) sprites:
// - Near layer & FX: crimson/gold momiji autumn maple leaves (momiji_0..3)
// - Popcorn: Orizuru folded origami paper cranes (tsuru_0..1)
// - Shooter: Armored Seto giant oyster opening to reveal a glowing pearl (kaki_0..2, eb_pearl)
// - Diver: Enchanted Miyajima wooden shamoji rice paddle tsukumogami (shamoji_0..1)
// - Carrier: Golden-baked momiji-manjū maple cakes with glowing filling (manju_{c}_0..1)
// - Turret: Miyajima coastal stone lantern ishidōrō (hidoro_base, hidoro_wreck, hidoro_head_0..15)
// - Heavy miniboss: Heike-gani samurai-faced crab of Dan-no-ura (heike_0..1, heike_guard, eb_bubble_0..1)
// - Stage boss: Itsukushima Sankibō, Great Tengu of Mount Misen + orbiting Eternal Flame braziers
//   (sankibo_0..1, sankibo_fan_l, sankibo_fan_r, brazier_0..1, eb_feather_0..1, misen_fire_0..1)
import { MATERIALS, Mask, renderMask } from '../../lib/spritekit.mjs';
import { Raster } from '../../lib/raster.mjs';

const MAT = {
  ...MATERIALS,
  T: [0x8c1814, 0xd83224, 0xff6b4a], // Itsukushima vermilion / Tengu crimson
  H: [0x78808c, 0xb2bcc8, 0xe8f0f6], // calcified oyster shell
  t: [0x8c6438, 0xc89a58, 0xf0cc88], // hinoki wood (shamoji)
  m: [0x8a4e1e, 0xc87c32, 0xf2aa52], // baked momiji-manjū castella crust
  Z: [0x58626c, 0x86929c, 0xb8c4cc], // Seto granite (ishidōrō)
  X: [0x1c1628, 0x322946, 0x544872], // Tengu crow-wing plumage
};

const render = (m, opts = {}) => renderMask(m, { materials: MAT, ...opts });
const raw = (rows) => renderMask(Mask.fromRows(rows), { outline: false, materials: MAT });
const TAU = Math.PI * 2;

function ell(m, ex, ey, rx, ry, c) {
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++)
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++)
      if (((x + 0.5 - ex) / rx) ** 2 + ((y + 0.5 - ey) / ry) ** 2 < 1) m.set(x, y, c);
}

export function hiroshimaSprites(add) {
  // ------------------------------------------------------------ near-layer & explosion momiji maple leaves
  add('momiji_0', raw(['.r.r.', 'roryr', '.ror.', '..r..']));
  add('momiji_1', raw(['r.o.r', '.ror.', 'roryr', '..r..']));
  add('momiji_2', raw(['.o.y.', 'oyhyo', '.oyo.', '..o..']));
  add('momiji_3', raw(['.r.o.', 'rrors', '.r.r.']));

  // ------------------------------------------------------------ custom high-contrast enemy bullets
  // Lustrous Seto pearl shot (dark rim + iridescent shell + pure white core)
  {
    const r = new Raster(7, 7);
    const P = [
      '..kkk..',
      '.kccck.',
      'kcwhwck',
      'kchwhck',
      'kcwhwck',
      '.kpppk.',
      '..kkk..',
    ];
    const COL = { k: 0x2c0e28, c: 0x7be8ff, p: 0xf08ab8, h: 0xfff6d8, w: 0xffffff };
    P.forEach((row, y) => [...row].forEach((ch, x) => COL[ch] && r.set(x, y, COL[ch])));
    add('eb_pearl', r);
  }

  // Heike-gani buoyant sea-froth bubbles (two animated frames)
  for (let f = 0; f < 2; f++) {
    const r = new Raster(11, 11);
    for (let y = 0; y < 11; y++)
      for (let x = 0; x < 11; x++) {
        const d = Math.hypot(x + 0.5 - 5.5, y + 0.5 - 5.5);
        if (d > 5.1) continue;
        let c = d > 4.0 ? 0x2a0c28 : d > 3.0 ? 0xe84888 : d > 2.1 ? 0x8ceeff : 0xdffbff;
        if (Math.hypot(x - (f ? 3.6 : 3.2), y - 3.2) < 1.5) c = 0xffffff;
        r.set(x, y, c);
      }
    add(`eb_bubble_${f}`, r);
  }

  // Sankibō wind-blown Tengu crimson feather blades (two spinning frames)
  for (let f = 0; f < 2; f++) {
    const r = new Raster(9, 9);
    const rows = f
      ? [
          '...kkk...',
          '..krrrk..',
          '.krhyrk..',
          '.krwhrk..',
          '..krhrk..',
          '..krrrk..',
          '...kwk...',
          '...kkk...',
          '.........',
        ]
      : [
          '..kkk....',
          '.krrrk...',
          '.krhyrk..',
          '..krwhrk.',
          '..krhrk..',
          '...krrk..',
          '....kwk..',
          '....kkk..',
          '.........',
        ];
    const COL = { k: 0x260818, r: 0xf03228, y: 0xffa838, h: 0xfff2b8, w: 0xffffff };
    rows.forEach((row, y) => [...row].forEach((ch, x) => COL[ch] && r.set(x, y, COL[ch])));
    add(`eb_feather_${f}`, r);
  }

  // Mount Misen Sacred Eternal Flame (Kiezu-no-hi) zone frames
  for (let f = 0; f < 2; f++) {
    const r = new Raster(17, 17);
    for (let y = 0; y < 17; y++)
      for (let x = 0; x < 17; x++) {
        const dx = x + 0.5 - 8.5;
        const dy = y + 0.5 - 9.5;
        const wave = Math.sin((x + f * 3) * 0.9) * 1.1;
        const d = Math.hypot(dx, dy * 0.85 + wave * 0.35);
        if (d > 7.2) continue;
        const c = d > 5.8 ? 0x3a0c14 : d > 4.2 ? 0xe8321e : d > 2.4 ? 0xff9c28 : 0xfff6b8;
        r.set(x, y, c, d > 6.2 ? 0.8 : 1);
      }
    add(`misen_fire_${f}`, r);
  }

  // ------------------------------------------------------------ popcorn: Orizuru (folded origami paper crane)
  {
    const CRANE_A = [
      '......Y',
      'T....TT',
      'TT..TTW',
      'TTT.TWW',
      '.TTTTWW',
      '..TTTWW',
      '...TTWW',
      '....TTW',
      '.....TW',
      '.....T.',
      '.....W.',
    ];
    const CRANE_B = [
      '......Y',
      '.....TT',
      '....TTW',
      'T..TTWW',
      'TTTTTWW',
      '.TTTTWW',
      '..TTTWW',
      '....TTW',
      '.....TW',
      '.....T.',
      '.....W.',
    ];
    add('tsuru_0', render(Mask.fromRows(CRANE_A, true)));
    add('tsuru_1', render(Mask.fromRows(CRANE_B, true)));
  }

  // ------------------------------------------------------------ the Peace Park interlude: paper cranes, not enemies
  // White and soft grey so the game can tint each one (the colours of the crane garlands); head up, three wing
  // beats (spread, half, raised). orizuru_glow: the soft halo round them.
  for (let f = 0; f < 3; f++) {
    const r = new Raster(17, 13);
    const cx = 8;
    const cy = 6;
    const span = [8, 6, 3.5][f];
    const lift = [0, -1, -2][f];
    const inTri = (px, py, ax, ay, bx, by, qx, qy) => {
      const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by);
      const d2 = (px - qx) * (by - qy) - (bx - qx) * (py - qy);
      const d3 = (px - ax) * (qy - ay) - (qx - ax) * (py - ay);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
    for (let y = 0; y < 13; y++)
      for (let x = 0; x < 17; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        for (const s of [-1, 1]) {
          const tx = cx + 0.5 + s * span;
          const ty = cy - 2 + lift;
          if (inTri(px, py, cx + 0.5, cy - 1.5, cx + 0.5, cy + 2.5, tx, ty)) {
            const k = Math.abs(px - cx - 0.5) / span;
            // the fold down the middle of each wing catches the light on the left
            const fold = Math.abs(py - (cy + 0.5 + (ty - cy) * k)) < 0.7;
            r.set(x, y, fold ? (s < 0 ? 0xffffff : 0xc8c8cc) : k > 0.6 ? 0xffffff : s < 0 ? 0xeeeeee : 0xd8d8dc);
          }
        }
      }
    for (let y = cy - 2; y <= cy + 3; y++) {
      const hw = y < cy + 1 ? 1 : 0;
      for (let x = cx - hw; x <= cx + hw; x++) r.set(x, y, x < cx ? 0xffffff : 0xd0d0d4);
    }
    for (let k = 1; k <= 4; k++) r.set(cx, cy - 2 - k, 0xf4f4f4); // the neck
    r.set(cx + 1, cy - 6, 0xe8e8ea); // the head, folded forward
    for (let k = 1; k <= 3; k++) r.set(cx, cy + 3 + k, k === 3 ? 0xd0d0d4 : 0xf0f0f0); // the tail
    // a dark rim so they read on any ground
    const rim = new Raster(17, 13);
    for (let y = 0; y < 13; y++)
      for (let x = 0; x < 17; x++) {
        if (r.alpha(x, y)) continue;
        if (r.alpha(x - 1, y) || r.alpha(x + 1, y) || r.alpha(x, y - 1) || r.alpha(x, y + 1)) rim.set(x, y, 0x3a3448, 0.85);
      }
    rim.blit(r, 0, 0);
    add(`orizuru_${f}`, rim);
  }
  {
    const r = new Raster(15, 15);
    for (let y = 0; y < 15; y++)
      for (let x = 0; x < 15; x++) {
        const d = Math.hypot(x + 0.5 - 7.5, y + 0.5 - 7.5) / 7.5;
        if (d < 1) r.set(x, y, 0xffffff, (1 - d) ** 2 * 0.6);
      }
    add('orizuru_glow', r);
  }

  // ------------------------------------------------------------ shooter: Kaki (armored Seto giant oyster + pearl)
  // kaki_0 = clamped shut (armored), kaki_1 = cracking open, kaki_2 = wide open exposing glowing pearl!
  for (let f = 0; f < 3; f++) {
    const m = new Mask(17, 17);
    const gap = f === 0 ? 0 : f === 1 ? 2 : 4;
    // fluted upper valve
    ell(m, 8.5, 7.5 - gap * 0.55, 7.2, 4.8, 'H');
    // fluted lower valve
    ell(m, 8.5, 9.5 + gap * 0.55, 7.2, 4.8, 'H');
    // calcified radial ribs & spiny shell edge
    for (const rx of [3, 6, 8, 10, 13]) {
      m.line(8, 3, rx, Math.max(2, 7 - gap), 'S');
      m.line(8, 13, rx, Math.min(14, 10 + gap), 'S');
    }
    if (f === 0) {
      // clamped seam
      for (let x = 2; x <= 14; x++) m.set(x, 8 + (x % 2), 'D');
    } else {
      // soft coral mantle inside
      ell(m, 8.5, 8.5, 5.4, gap + 0.8, 'O');
      if (f === 2) {
        // radiant Seto pearl at center!
        ell(m, 8.5, 8.5, 2.5, 2.5, 'w');
        m.set(7, 7, 'c');
        m.set(9, 9, 'p');
      } else {
        ell(m, 8.5, 8.5, 1.6, 1.4, 'w');
      }
    }
    add(`kaki_${f}`, render(m, f === 2 ? { glow: 'wc' } : {}));
  }

  // ------------------------------------------------------------ diver: Shamoji (enchanted Miyajima rice paddle)
  for (let f = 0; f < 2; f++) {
    const m = new Mask(13, 17);
    // wooden handle at top + fluttering shrine ofuda ribbon
    m.rect(5, 1, 3, 6, 't');
    m.rect(5, 3, 3, 1, 'T');
    m.line(8, 3, f ? 11 : 10, f ? 1 : 5, 'T');
    // broad rounded rice-scoop blade at bottom
    ell(m, 6.5, 11, 4.8, 5.2, 't');
    // spirited tsukumogami eyes + red calligraphy seal + grains of glowing rice
    m.set(4, 10, 'k');
    m.set(8, 10, 'k');
    m.set(4, 9, 'y');
    m.set(8, 9, 'y');
    m.line(6, 12, 6, 14, 'T');
    m.set(5, 13, 'T');
    m.set(3, 12, 'w');
    m.set(9, 13, 'w');
    add(`shamoji_${f}`, render(m));
  }

  // ------------------------------------------------------------ carrier: Momiji-manjū (golden maple-leaf pastry)
  for (const [col, gem, glowCh] of [
    ['red', 'R', 'r'],
    ['blue', 'B', 'c'],
    ['green', 'G', 'g'],
    ['purple', 'V', 'v'],
  ]) {
    for (let f = 0; f < 2; f++) {
      const m = new Mask(17, 17);
      // 5 maple-leaf lobes radiating out + stem at bottom
      const lobes = [
        [8.5, 2.5],
        [2.5, 6.0],
        [14.5, 6.0],
        [4.2, 12.2],
        [12.8, 12.2],
      ];
      ell(m, 8.5, 8.8, 4.4, 4.2, 'm');
      for (const [lx, ly] of lobes) {
        m.line(8, 8, Math.round(lx), Math.round(ly), 'm');
        ell(m, (8.5 + lx) * 0.5, (8.8 + ly) * 0.5, 2.4, 2.4, 'm');
        ell(m, lx, ly, 1.5, 1.5, 'm');
      }
      m.rect(8, 13, 1, 3, 'N');
      // glowing sweet filling heart pulsing inside
      ell(m, 8.5, 8.8, f ? 2.7 : 2.2, f ? 2.7 : 2.2, gem);
      m.set(8, 8, glowCh);
      if (f) m.set(9, 8, 'w');
      add(`manju_${col}_${f}`, render(m, { glow: `${glowCh}w` }));
    }
  }

  // ------------------------------------------------------------ turret: Ishidōrō (coastal stone shrine lantern)
  {
    const base = new Mask(17, 17);
    ell(base, 8.5, 8.5, 7.6, 7.6, 'S');
    ell(base, 8.5, 8.5, 5.8, 5.8, 'Z');
    // moss & tide rim accents
    base.set(4, 5, 'G');
    base.set(12, 11, 'G');
    base.set(5, 12, 'G');
    ell(base, 8.5, 8.5, 3.2, 3.2, 'D');
    add('hidoro_base', render(base));

    const wreck = new Mask(17, 17);
    ell(wreck, 8.5, 8.5, 7.4, 7.4, 'D');
    ell(wreck, 8.5, 8.5, 4.8, 4.8, 'K');
    wreck.line(4, 5, 12, 12, 'k');
    wreck.line(12, 5, 5, 11, 'k');
    wreck.set(8, 8, 'o');
    add('hidoro_wreck', render(wreck));

    // Rotatable pagoda-roofed lantern head with glowing fire window aimed along +y (0 = down/up per turret convention;
    // let's check standard TURRET_HEAD orientation: barrel points DOWN at +y in sprites.mjs lines 250-254!)
    const head = new Mask(15, 15);
    // hexagonal stone roof (kasa)
    ell(head, 7.5, 6.8, 5.4, 5.0, 'Z');
    ell(head, 7.5, 6.8, 3.4, 3.2, 'W');
    // sacred flame core + aimed fire-mouth spout pointing down (+y, matching TURRET_HEAD)
    ell(head, 7.5, 6.8, 1.8, 1.8, 'Y');
    head.rect(6, 9, 3, 4, 'Z');
    head.rect(7, 8, 1, 6, 'o');
    head.set(7, 7, 'w');
    for (let i = 0; i < 16; i++) {
      add(`hidoro_head_${i}`, render(head.rotated((i / 16) * TAU, 15)));
    }
  }

  // ------------------------------------------------------------ heavy miniboss: Heike-gani (Samurai-Faced Crab)
  for (const mode of [0, 1, 'guard']) {
    const m = new Mask(42, 30);
    const cx = 21;
    // 4 pairs of spiked jointed crab legs
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const lift = mode === 'guard' ? 0 : (k + (mode === 1 ? 1 : 0)) % 2 ? -2 : 2;
        const y0 = 9 + k * 4;
        const xKnee = cx + s * (14 + (k % 2) * 2);
        const yKnee = y0 - 2 + lift;
        const xTip = cx + s * (19 - Math.abs(k - 1.5));
        const yTip = y0 + 4 + lift;
        m.line(cx + s * 9, y0, xKnee, yKnee, 'T');
        m.line(xKnee, yKnee, xTip, yTip, 'O');
        m.set(xTip, yTip, 'W');
      }
    }
    // Broad serrated crimson samurai carapace
    ell(m, cx, 13, 12.5, 9.2, 'T');
    // Kabuto-like lateral carapace spikes
    for (const s of [-1, 1]) {
      m.set(cx + s * 12, 10, 'W');
      m.set(cx + s * 13, 12, 'T');
      m.set(cx + s * 12, 15, 'W');
    }
    // Scowling Heike samurai face (menpō) sculpted into the shell!
    // Furrowed brow ridges
    m.line(cx - 7, 8, cx - 2, 10, 'K');
    m.line(cx + 7, 8, cx + 2, 10, 'K');
    m.line(cx - 6, 7, cx - 2, 9, 'Y');
    m.line(cx + 6, 7, cx + 2, 9, 'Y');
    // Glaring samurai eyes on shell + stalk eyes at front
    m.rect(cx - 6, 10, 3, 2, 'y');
    m.rect(cx + 3, 10, 3, 2, 'y');
    m.set(cx - 5, 11, 'k');
    m.set(cx + 4, 11, 'k');
    // Nose bridge & grimacing samurai mouth with fangs
    m.rect(cx - 1, 11, 2, 3, 'D');
    m.line(cx - 6, 16, cx - 2, 15, 'K');
    m.line(cx - 2, 15, cx + 2, 15, 'K');
    m.line(cx + 2, 15, cx + 6, 16, 'K');
    m.set(cx - 4, 16, 'W');
    m.set(cx + 4, 16, 'W');
    // Stalk eyes at front edge
    m.set(cx - 4, 21, 'y');
    m.set(cx + 3, 21, 'y');

    if (mode === 'guard') {
      // Both massive pincers locked tightly across the front as an armored shield wall!
      for (const s of [-1, 1]) {
        m.line(cx + s * 10, 18, cx + s * 9, 23, 'T');
        ell(m, cx + s * 5.2, 24.5, 6.2, 3.8, 'H');
        ell(m, cx + s * 5.2, 24.5, 4.4, 2.4, 'W');
        m.line(cx - 9, 25, cx + 9, 25, 'D');
      }
      // bright specular glint showing metallic deflection
      m.set(cx - 4, 23, 'w');
      m.set(cx + 4, 23, 'w');
      add('heike_guard', render(m, { glow: 'w' }));
    } else {
      // Wide-open menacing samurai pincers poised to snap!
      const open = mode === 1 ? 1 : 0;
      for (const s of [-1, 1]) {
        m.line(cx + s * 10, 17, cx + s * 14, 21, 'T');
        ell(m, cx + s * 14, 24, 4.4, 3.8, 'T');
        // outer & inner scissor blades
        m.line(cx + s * 16, 25, cx + s * (14 + open), 28, 'W');
        m.line(cx + s * 11, 25, cx + s * (12 - open), 28, 'H');
      }
      add(`heike_${mode}`, render(m));
    }
  }

  // ------------------------------------------------------------ boss: Itsukushima Sankibō (Great Tengu of Mt. Misen)
  for (const pose of ['0', '1', 'fan_l', 'fan_r']) {
    const m = new Mask(50, 42);
    const cx = 25;
    const wingUp = pose === '0' || pose === 'fan_l';

    // Great sweeping black-indigo crow wings
    for (const s of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const wx = cx + s * (8 + i * 3);
        const wy = (wingUp ? 16 - i * 2 : 19 + i * 1.6) | 0;
        m.line(cx + s * 6, 18, wx, wy, 'X');
        m.line(wx, wy, wx + s * 2, wy + 6, 'X');
        m.set(wx + s * 2, wy + 6, 'D');
      }
    }

    // Flowing yamabushi mountain-ascetic robes (white suzukake + saffron/vermilion hakama + gold yuigesa pom-poms)
    ell(m, cx, 25, 8.5, 9.5, 'W');
    ell(m, cx, 31, 7.5, 6.5, 'T');
    // sandals / talons at bottom
    m.rect(cx - 5, 37, 3, 2, 'Y');
    m.rect(cx + 2, 37, 3, 2, 'Y');
    // golden yuigesa pom-poms across chest
    for (const px of [cx - 5, cx - 2, cx + 2, cx + 5]) {
      m.set(px, 21, 'Y');
      m.set(px, 22, 'Y');
      m.set(px, 25, 'Y');
    }

    // Fierce crimson Daitengu head + tokin cap + wild white brows & beard
    ell(m, cx, 13, 6.2, 5.8, 'T');
    // black tokin cap on forehead with gold crest
    m.rect(cx - 2, 5, 4, 3, 'K');
    m.set(cx, 6, 'Y');
    // sweeping white eyebrows & mane
    m.line(cx - 7, 9, cx - 2, 11, 'W');
    m.line(cx + 7, 9, cx + 2, 11, 'W');
    m.line(cx - 6, 16, cx, 20, 'W');
    m.line(cx + 6, 16, cx, 20, 'W');
    // glaring golden eyes + iconic long Tengu nose
    m.rect(cx - 4, 11, 2, 2, 'y');
    m.rect(cx + 2, 11, 2, 2, 'y');
    m.rect(cx - 1, 12, 2, 5, 'O');
    m.set(cx, 13, 'w');

    // Feathered Hauchiwa gale-fan!
    const fanSide = pose === 'fan_l' ? -1 : 1;
    const fx = pose === 'fan_l' || pose === 'fan_r' ? cx + fanSide * 16 : cx + 13;
    const fy = pose === 'fan_l' || pose === 'fan_r' ? 22 : wingUp ? 22 : 25;
    m.line(cx + fanSide * 7, 23, fx, fy, 't');
    ell(m, fx, fy, 5.2, 5.6, 'T');
    ell(m, fx, fy, 3.2, 3.6, 'Y');
    for (let k = -2; k <= 2; k++) m.line(fx, fy, fx + fanSide * 4, fy + k * 2, 'W');

    // Opposite hand holds yamabushi shakujō ringed staff
    const sx = cx - fanSide * 12;
    m.line(sx, 12, sx, 33, 't');
    ell(m, sx, 11, 2.4, 2.4, 'Y');

    // Wind gust arc when swinging the Hauchiwa fan!
    if (pose === 'fan_l' || pose === 'fan_r') {
      for (let a = -3; a <= 3; a++) {
        m.set(fx + fanSide * 6, fy + a * 2, 'c');
        m.set(fx + fanSide * 7, fy + a * 2, 'w');
      }
      add(`sankibo_${pose}`, render(m, { glow: 'cw' }));
    } else {
      add(`sankibo_${pose}`, render(m));
    }
  }

  // Orbiting Mount Misen Eternal Flame iron braziers (brazier_0..1)
  for (let f = 0; f < 2; f++) {
    const m = new Mask(15, 17);
    // iron tripod bowl
    ell(m, 7.5, 11.5, 5.4, 3.2, 'K');
    m.rect(4, 10, 7, 2, 'Z');
    m.line(4, 13, 3, 15, 'K');
    m.line(10, 13, 11, 15, 'K');
    // flickering eternal flame above bowl
    ell(m, 7.5, 7.2, 3.6, 4.2, 'T');
    ell(m, 7.5 + (f ? 0.5 : -0.5), 7.6, 2.2, 3.0, 'Y');
    m.set(7, f ? 3 : 4, 'o');
    m.set(8, f ? 2 : 3, 'y');
    m.set(7, 8, 'w');
    add(`brazier_${f}`, render(m, { glow: 'oyw' }));
  }
}
