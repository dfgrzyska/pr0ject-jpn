// Ozaki and Jodo-ji (u 2712-3800, docs/plan-onomichi.md phase 3): the sun going down where the twin bridges come
// ashore. The old road off the first bridge swings onto the coast road; the town of Ozaki along it (its houses and
// the hillside's terraces are drawn with the rest of the hillside, senkoji.mjs), its bathhouse with the chimney and the
// soy brewer's old storehouse with white walls; Jodo-ji at the head of its stone steps: the gate, the great main hall,
// the two-storeyed tahoto pagoda, the garden with its pond; the wooded mountain behind with Kairyu-ji. The Mukaishima
// ferry's pier at Ozaki with people waiting. Our own drawing, nothing from the temple's photographs.
import { shade } from '../tokyo/kit.mjs';
import { hashPx } from '../hires.mjs';
import { makeParts, VERMILION } from '../kawaguchiko/parts.mjs';

export function jodoji(ctx) {
  const { kit, plot, pave, S } = ctx;
  const { house, building, tree, mark, ground, rand, P, R, FX, FY, queue, shadowBox, hi, crowd, E, ER, halo, smoke } = kit;
  const { roof, toro } = makeParts(ctx);

  // ---- Ozaki's bathhouse and the soy brewer's storehouse
  {
    const b = plot('ozaki_sento');
    pave(b.x, b.u, b.w, b.h, 'plaza', 701);
    house(b.x, b.u + 1, b.w, b.h - 2, { tile: 0x4e5662, hip: false, wall: 0xe8e2d4, face: 2.6, s: 7011 });
    mark(b.x + b.w - 3, b.u + b.h - 5, (X, Y) => {
      for (let k = 1; k <= 18; k++) hi.tint(X + 2 + k, Y + Math.round(k * 0.5), 0.72);
      R(X - 1, Y - 18, 4, 18, 0x8a4a32);
      R(X - 1, Y - 18, 1, 18, 0xa85a3e);
      for (let j = 0; j < 18; j += 3) R(X - 1, Y - 18 + j, 4, 1, 0x6a3a28);
    });
    smoke(b.x + b.w - 2.4, b.u + b.h + 2, { rate: 0.5, a: 0.3 });
    const g = plot('sake_gura');
    pave(g.x, g.u, g.w, g.h, 'plaza', 702);
    house(g.x, g.u + 1, g.w, g.h - 2, { tile: 0x3e444e, hip: false, wall: 0xf0ece4, face: 3, s: 7021 });
    mark(g.x + 1, g.u + 1, (X, Y) => {
      // the lower wall in black-and-white diagonal tiles (namako-kabe), a cedar ball over the door
      for (let i = 0; i < FX(g.w - 2) - FX(0); i++) P(X + i, Y - 1, (i + Y) % 4 < 2 ? 0x2a2a30 : 0xe8e4dc);
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (i * i + j * j <= 5) P(X + 6 + i, Y - 7 + j, (i + j) % 2 ? 0x6a5a34 : 0x8a7a48);
      for (let q = 0; q < 3; q++) R(X + 10 + q * 4, Y - 3, 3, 3, 0x7a5a3a); // casks
    });
  }

  // ---- Jodo-ji: its grounds of gravel, the gate at the top of the steps, the main hall, the tahoto, the garden
  {
    const [gx, gu, gw, gh] = ctx.ground('jodoji_keidai').rect;
    ground(() => {
      for (let u = gu + 1; u < gu + gh - 1; u += 1.34) for (let X = FX(gx + 1); X < FX(gx + gw - 1); X++) if (hashPx(X, Math.round(u * 3), 703) < 0.8) P(X, FY(u), 0xa49a84);
    });
    const s = plot('jodoji_sanmon');
    const [SX, SY] = [FX(s.x + s.w / 2), FY(s.u + 2)];
    queue(SY, () => {
      for (const dx of [-8, 7]) R(SX + dx, SY - 10, 2, 10, 0x3a2a20);
      roof(SX - 14, SY - 30, 28, 22, 0x4e5662);
      R(SX - 12, SY - 20, 24, 2, 0x3a3e46);
    }, () => shadowBox(SX - 14, SY - 30, 28, 30, 22, 0.6));
    const h = plot('jodoji_hondo');
    const [X0, X1, YT, YB] = [FX(h.x), FX(h.x + h.w), FY(h.u + h.h), FY(h.u + 2)];
    const fh = 9;
    queue(YB, () => {
      roof(X0 - 3, YT, X1 - X0 + 6, YB - YT - fh, 0x4e5662);
      const ry = YT + ((YB - YT - fh) >> 1);
      R(X0 + 1, ry - 1, X1 - X0 - 2, 3, 0x30343c);
      for (const ex of [X0, X1 - 4]) R(ex, ry - 3, 4, 6, 0x262a30); // the ridge's end tiles
      for (let j = 0; j < fh; j++)
        for (let i = X0 + 1; i < X1 - 1; i++) {
          let c = (i - X0) % 10 === 0 ? 0x5a2a1e : j < 2 ? 0xe8e0cc : VERMILION; // vermilion posts and doors, white plaster under the eave
          if (j > 2 && j < fh - 1 && (i - X0) % 10 >= 3 && (i - X0) % 10 <= 7) c = (i + j) % 2 ? 0x7a2a1e : 0xb8402a;
          if (j === fh - 1) c = 0x2a2226;
          P(i, YB - fh + j, c);
        }
      for (let i = X0 + 8; i < X1 - 6; i += 14) {
        E(i, YB - fh + 1, 0xffd070);
        halo(i, YB - fh + 2, 6, 4, 0xffc060, 0.3);
      }
      R(((X0 + X1) >> 1) - 6, YB, 12, 3, 0x6a4a2a); // the offering box
    }, () => shadowBox(X0 - 3, YT, X1 - X0 + 6, YB - YT, 28, 0.6));
    const t = plot('jodoji_tahoto');
    // the tahoto: a square lower roof, the round white "drum" of its upper storey, the upper roof, the spire
    const [TX, TY] = [FX(t.x + t.w / 2), FY(t.u + 3)];
    queue(TY + 2, () => {
      R(TX - 15, TY - 8, 30, 8, VERMILION);
      roof(TX - 22, TY - 38, 44, 32, 0x4a4e56);
      for (let j = -7; j <= 7; j++) for (let i = -7; i <= 7; i++) if (i * i + j * j <= 49) P(TX + i, TY - 30 + j, i * i + j * j > 36 ? 0x8a8478 : 0xf0ece0);
      roof(TX - 16, TY - 60, 32, 26, 0x4a4e56);
      R(TX - 1, TY - 80, 2, 22, 0x6a5a34);
      for (let k = 0; k < 9; k++) R(TX - 2, TY - 78 + k * 2, 4, 1, 0xb89a48);
      R(TX - 1, TY - 83, 2, 3, 0xd0a840);
    }, () => {
      shadowBox(TX - 20, TY - 38, 40, 38, 30, 0.6);
      shadowBox(TX - 14, TY - 60, 28, 26, 46, 0.62);
      shadowBox(TX, TY - 4, 2, 2, 70, 0.66);
    });
    // the garden behind: the pond (painted with the route), stones round it, a pine leaning over it, moss
    for (const [x, u, r] of [[150, 3352, 1.2], [168, 3360, 1.4], [156, 3364, 1], [164, 3350, 0.9]])
      mark(x, u, (X, Y) => {
        const Rr = Math.round(r * S);
        for (let j = -Rr; j <= Rr; j++) for (let i = -Rr; i <= Rr; i++) if (i * i + j * j <= Rr * Rr) P(X + i, Y + j, i + j < 0 ? 0xb4b0a4 : 0x7a766c);
      });
    tree('pine', 166, 3366, 2.6);
    tree('broadleaf', 150, 3344, 2);
    for (const [x, u] of [[116, 3306], [116, 3346], [122, 3304], [146, 3304]]) toro(x, u, true);
    crowd(gx + 4, gu + 2, 14, 10, 6);
  }

  // ---- the wood on the mountain behind: pine and camphor, the path up to Kairyu-ji
  {
    const [fx, fu, fw, fh] = ctx.ground('jodoji_yama').rect;
    const k = plot('kairyuji');
    for (let n = 0; n < 340; n++) {
      const [x, u] = [fx + 1 + rand() * (fw - 2), fu + 2 + rand() * (fh - 4)];
      if (x > k.x - 2 && x < k.x + k.w + 2 && u > k.u - 2 && u < k.u + k.h + 2) continue;
      tree(rand() < 0.5 ? 'pine' : 'broadleaf', x, u, 2.2 + rand() * 1.8);
    }
  }

  // ---- the Mukaishima ferry's pier at Ozaki: its shed, people and bicycles waiting
  mark(84, 2742, (X, Y) => {
    R(X, Y - 12, 12, 10, 0x8a8e94);
    R(X, Y - 12, 12, 1, 0xb8bcc0);
    ER(X + 2, Y - 4, 8, 1, 0xfff0d0);
  });
  crowd(82, 2738, 6, 10, 6);
  void shade;
  void building;
}
