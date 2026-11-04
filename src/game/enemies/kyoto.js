// Kyoto: the tanuki (the miniboss, with its shapeshifted copies) and Kyūbi, the nine-tailed fox (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { volley } from '../../difficulty.js';
import { slow, normal, fast, TAU, EXTRAS } from './shared.js';

// the tanuki's shapeshifted copies: one hit and they turn back into leaves
const DECOY = { hp: 1, weight: 0, score: 300, radius: 13, explosion: 's' };
// Kyūbi's tails, in step with tools/art/kyoto/kyubi.mjs: tail i (0 = far left, 4 = straight up, 8 = far right)
// fans out from a root 7 px under the body's centre; x, y = where its tip is from the body's centre, a = the
// way it points. The right-hand tails are the left-hand ones mirrored.
const KYUBI_TAIL = Array.from({ length: 9 }, (_, i) => {
  const j = Math.min(i, 8 - i);
  const a = -Math.PI + 0.12 + (j + 0.5) * ((Math.PI - 0.24) / 9);
  const d = 42 - Math.abs(j - 4) * 1.5;
  const droop = -(4 - j) * 1.1;
  const x = Math.cos(a) * d - Math.sin(a) * droop;
  const y = Math.sin(a) * d + Math.cos(a) * droop + 7;
  return { frame: `kyubi_tail_${j}`, flip: i > 4, x: i > 4 ? -x : x, y, a: i > 4 ? -Math.PI - a : a };
});
const KYUBI_ORDER = [0, 8, 1, 7, 2, 6, 3, 5, 4]; // drawn outer to centre, and lost in that order (the centre one last)
// the 大 laid out in fire beds on the Daimonji slope at the end of the Kyoto strip, stroke by stroke in the order
// it is written ([x, u], as in tools/art/kyoto/mid.mjs)
export const DAIMONJI = [
  [[30, 6676], [150, 6676]],
  [[90, 6820], [84, 6720], [62, 6580], [34, 6450]],
  [[92, 6676], [114, 6580], [146, 6450]],
];

export const kyoto = {
  /**
   * Tanuki (Shigaraki figurine): waddles about, drums its belly (a ring of bullets on every "pon"),
   * lobs sake flasks at the player, and shapeshifts — a leaf on its hat, a puff of leaves, and two
   * copies that keep the leaf on. The real one has no leaf. Copies burst into leaves at one hit.
   */
  tanuki(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (72 - e.y) * 0.8) * dt;
      if (e.y >= 71) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, tx: null, decoys: [] });
      return;
    }
    if (e.state === 'leave') {
      e.vy = (e.vy ?? 0) - 40 * dt;
      e.y += e.vy * dt;
      return;
    }
    e.fight += dt;
    if (e.fight > 34) {
      this.dropDecoys(e);
      e.play('tanuki');
      e.state = 'leave';
      return;
    }
    // waddle; while shapeshifted, walk to its place in the line-up instead
    const goal = e.tx ?? 90 + 30 * Math.sin(e.fight * 0.6);
    e.x += (goal - e.x) * Math.min(1, dt * (e.tx === null ? 2 : 4));
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    switch (e.patternIndex % 3) {
      case 0:
        // hara-tsuzumi: paws up, paws down on the belly — pon, poko
        e.anims.stop();
        e.setFrame(e.step % 2 ? 'tanuki_drum_1' : 'tanuki_drum_0');
        if (e.step % 2) {
          const pon = e.step % 4 === 1;
          b.ring(e.x, e.y + 8, pon ? 12 : 8, e.step * 0.21, pon ? slow : normal, !pon);
          s.fx.text(e.x + (pon ? -14 : 14), e.y + 4, pon ? 'PON' : 'POKO', 0.5, 0xffe0b0);
          s.fx.rings.push({ x: e.x, y: e.y + 8, r: 4, life: 0.22 });
          for (const b of s.parallax.bitsLive) {
            const dx = b.x - e.x;
            const dy = b.y - e.y;
            const d = Math.hypot(dx, dy) || 1;
            if (d < 110) {
              b.vx += (dx / d) * 95;
              b.vy += (dy / d) * 95;
            }
          }
        }
        e.timer = 0.28;
        if (++e.step >= 16) {
          e.play('tanuki');
          this.nextPattern(e);
        }
        break;
      case 1: {
        // sake flasks thrown where the player is (and to both sides), plus a small aimed fan
        const pl = s.player;
        for (const dx of e.step % 2 ? [-36, 36] : [0]) b.lob(e.x + (dx > 0 ? 18 : -20), e.y + 12, Phaser.Math.Clamp(pl.x + dx, 10, VIEW.width - 10), pl.y, 1.2, 'tokkuri');
        b.fan(e.x, e.y + 12, this.aimAt(e, 0, 12), 3, 0.5, slow);
        e.timer = 0.95;
        if (++e.step >= 5) this.nextPattern(e);
        break;
      }
      default:
        this.tanukiTrick(e, b);
    }
  },

  tanukiTrick(e, b) {
    const s = this.scene;
    const lineup = () => {
      const slots = Phaser.Utils.Array.Shuffle([40, 90, 140]);
      e.tx = slots[0];
      e.decoys.forEach((d, i) => (d.tx = slots[i + 1]));
    };
    if (e.step === 0) {
      // the tell: a leaf on its hat
      e.play('tanuki_leaf');
      e.timer = 0.9;
    } else if (e.step === 1) {
      s.fx.leaves(e.x, e.y, 24);
      s.fx.flash(0.25, 0.25);
      s.sfx.explode('s');
      e.play('tanuki');
      for (let i = 0; i < 2; i++) {
        const d = this.pool.spawn('tanuki_leaf_0', e.x, e.y, {
          ...EXTRAS, type: 'decoy', def: DECOY, hp: 1, maxHp: 1, radius: DECOY.radius, age: 0, seen: 1, state: 'fight', timer: 1.1 + i * 0.5, flash: 0, flashCool: 0,
          ground: false, head: null, master: e, tx: e.x,
        });
        d.play('tanuki_leaf').setDepth(DEPTH.air - 0.1);
        e.decoys.push(d);
      }
      lineup();
      e.timer = 0.9;
    } else if (e.step < 9) {
      // shuffle once halfway, like the cup game; the real one fires a fan meanwhile
      e.decoys = e.decoys.filter((d) => !d.dead && d.master === e);
      if (e.step === 5) lineup();
      b.fan(e.x, e.y + 12, this.aimAt(e, 0, 12), 5, 0.8, slow);
      e.timer = 1.0;
    } else {
      this.dropDecoys(e);
      e.tx = null;
      this.nextPattern(e);
      return;
    }
    e.step++;
  },

  decoy(e, dt, b) {
    const m = e.master;
    e.x += (e.tx - e.x) * Math.min(1, dt * 4);
    e.y = m.y;
    if ((e.timer -= dt) <= 0) {
      e.timer = 1.4;
      if (this.canFire(e)) b.fire(e.x, e.y + 12, this.aimAt(e, 0, 12), slow);
    }
  },

  /** The copies turn back into leaves (trick over, or the tanuki is gone). */
  dropDecoys(e) {
    for (const d of e.decoys ?? []) {
      if (d.dead || d.master !== e) continue;
      this.scene.fx.leaves(d.x, d.y, 10);
      this.pool.kill(d);
    }
    e.decoys = [];
  },

  // ---------------------------------------------------------------- boss: Kyūbi, the nine-tailed fox
  /**
   * Waits at the head of the 大 on the Daimonji slope while fox-fire gathers; when the scroll stops it condenses
   * out of the flames and its nine tails unfurl. Every ninth of its life it loses a tail, which burns away into
   * a wisp hunting the player; the attacks fired from the tail tips thin out with them.
   */
  spawnKyubi(w, base) {
    const g = { kind: 'kyubi', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false, awake: false };
    Object.assign(g, { home: w.x, homeY: 66, sway: 0, n: 0, tails: [], poseT: 0, blinkT: 2 });
    const e = this.pool.spawn('kyubi_idle', g.home, g.homeY, { ...base, role: 'body', hp: 1430, maxHp: 1430, radius: 13, group: g, ghost: true, invuln: true });
    e.setDepth(DEPTH.air - 0.1).setAlpha(0);
    for (let i = 0; i < 9; i++) {
      const tl = this.tailPool.spawn(`${KYUBI_TAIL[i].frame}_0`, e.x, e.y, { i, lost: false, fly: null, grown: 0 });
      tl.setDepth(DEPTH.air - 0.13 + KYUBI_ORDER.indexOf(i) * 0.001).setVisible(false);
      g.tails.push(tl);
    }
    g.body = e;
    g.parts.push(e);
    g.maxTotal = e.maxHp;
    this.bossGroup = g;
    return e;
  },

  updateKyubi(g, dt) {
    const s = this.scene;
    const fx = s.fx;
    const e = g.body;
    if (e.dead || e.group !== g) return;
    g.t += dt;
    if (g.state === 'dormant') {
      // fox-fire drifting in from all round to where it will appear
      if (Math.random() < dt * 10) {
        const a = Math.random() * TAU;
        const p = fx.part(fx.parts, `kitsunebi_${Math.floor(Math.random() * 2)}`, g.home + Math.cos(a) * 46, g.homeY + Math.sin(a) * 34, { vx: -Math.cos(a) * 60, vy: -Math.sin(a) * 45, drag: 0, life: 0.7, a0: 0.8 });
        p.setScale(0.6);
      }
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        Object.assign(g, { state: 'rise', t: 0 });
        s.cameras.main.shake(1800, 0.004);
        fx.flash(0.35, 0.4);
        // its waking flare sweeps the slope: whatever is left of the waves goes up with it
        for (const o of this.pool.live) if (!o.dead && o.group !== g && o.def.weight > 0) this.destroy(o);
        s.bullets.cancelAll(fx);
      }
      return;
    }
    if (g.state === 'rise') {
      // the body condenses out of a flare of fox-fire, then the tails unfurl from the centre outwards
      e.setAlpha(Math.min(1, g.t / 1.0) * (Math.floor(g.t * 16) % 2 && g.t < 1 ? 0.6 : 1));
      if (g.t < 1 && Math.random() < dt * 30) fx.foxfire(e.x + (Math.random() - 0.5) * 26, e.y + (Math.random() - 0.5) * 30, 1, 2);
      const grown = Math.max(0, Math.min(9, Math.floor((g.t - 1.0) / 0.16) + 1));
      while (g.n < grown) {
        const i = [4, 3, 5, 2, 6, 1, 7, 0, 8][g.n++];
        g.tails[i].grown = 0.001;
        fx.foxfire(e.x + KYUBI_TAIL[i].x, e.y + KYUBI_TAIL[i].y, 3, 3);
      }
      this.layKyubi(g, dt);
      if (g.t >= 1.0 + 9 * 0.16 + 0.5) {
        Object.assign(g, { state: 'fight', awake: true, t: 0, timer: 1.2, poseT: 0.6 });
        Object.assign(e, { ghost: false, invuln: false });
        e.setAlpha(1);
        fx.text(e.x, e.y - 36, 'KON!', 0.9, 0xffe0b0);
        s.sfx.shout();
      }
      return;
    }
    // hovering over the 大, swaying, blinking now and then; eyes blaze and the mouth opens as it casts
    g.sway += dt * (g.enraged ? 0.75 : 0.5);
    e.x = g.home + 28 * Math.sin(g.sway);
    e.y = g.homeY + 4 * Math.sin(g.t * 1.3);
    g.poseT -= dt;
    if ((g.blinkT -= dt) < 0) g.blinkT = 2 + Math.random() * 2.5;
    e.setFrame(g.poseT > 0 ? 'kyubi_cast' : g.blinkT < 0.12 ? 'kyubi_blink' : 'kyubi_idle');
    const want = Math.max(1, Math.ceil((9 * e.hp) / e.maxHp - 1e-6));
    while (g.n > want) this.kyubiLoseTail(g);
    if (!g.enraged && e.hp < e.maxHp * 0.35) {
      Object.assign(g, { enraged: true, timer: 0.8, phase: 0, step: 0 });
      s.hud.show('', 'KYUBI WPADA W SZAŁ!', 1.6, true);
    }
    this.layKyubi(g, dt);
    g.timer -= dt * (g.enraged ? 1.15 : 1);
    if (g.timer > 0 || !this.canFire(e)) return;
    this.kyubiAttack(g, e);
  },

  /** The tails on the body: swaying, unfurling, flashing with it, ablaze in blue when it rages; lost ones flying off. */
  layKyubi(g, dt) {
    const s = this.scene;
    const e = g.body;
    const f = Math.floor(g.t * 5);
    for (const tl of g.tails) {
      if (tl.dead) continue;
      const T = KYUBI_TAIL[tl.i];
      if (tl.fly) {
        // torn loose: it drifts away and burns out
        const fl = tl.fly;
        fl.t += dt;
        tl.x += fl.vx * dt;
        tl.y += fl.vy * dt;
        tl.setAlpha(Math.max(0, 1 - fl.t / 0.6)).setScale(Math.max(0.2, 1 - fl.t)).setTint(0x3060c0).setTintMode(Phaser.TintModes.ADD);
        if (Math.random() < dt * 30) s.fx.foxfire(tl.x + T.x * 0.6 * tl.scaleX, tl.y + (T.y - 7) * 0.6 * tl.scaleX, 1, 3);
        if (fl.t >= 0.6) this.tailPool.kill(tl);
        continue;
      }
      if (!tl.grown) continue;
      tl.grown = Math.min(1, tl.grown + dt / 0.2);
      const lag = g.state === 'fight' ? -Math.cos(g.sway) * (g.enraged ? 0.26 : 0.18) + Math.sin(g.t * 4.5 - Math.abs(tl.i - 4) * 0.55) * 0.08 : 0;
      tl.setVisible(true).setPosition(e.x + lag * 8, e.y + 7).setScale(0.3 + 0.7 * tl.grown).setRotation(lag * (0.65 + Math.abs(tl.i - 4) * 0.12)).setFlipX(T.flip).setAlpha(e.alpha);
      tl.setFrame(`${T.frame}_${(f + (T.flip ? 1 : 0) + (tl.i % 2)) % 3}`);
      if (e.flash > 0) tl.setTint(0x808080).setTintMode(Phaser.TintModes.ADD);
      else if (g.enraged) {
        const k = 0.6 + 0.4 * Math.sin(g.t * 9 + tl.i);
        tl.setTint(Phaser.Display.Color.GetColor(16 * k, 40 * k, 110 * k)).setTintMode(Phaser.TintModes.ADD);
        if (Math.random() < dt * 4) s.fx.foxfire(e.x + T.x, e.y + T.y, 1, 2);
      } else tl.clearTint();
    }
  },

  /** Where the tips of the tails it still has are, left to right: [{ x, y, a }]. */
  kyubiTips(g) {
    const e = g.body;
    const out = [];
    for (const tl of g.tails) if (!tl.lost) out.push({ x: e.x + KYUBI_TAIL[tl.i].x, y: e.y + KYUBI_TAIL[tl.i].y, a: KYUBI_TAIL[tl.i].a });
    return out;
  },

  /** A ninth of its life gone: the outermost tail tears loose and burns away, its wisp of fox-fire hunting the player. */
  kyubiLoseTail(g) {
    const s = this.scene;
    const e = g.body;
    const i = KYUBI_ORDER[9 - g.n--];
    const tl = g.tails[i];
    const T = KYUBI_TAIL[i];
    tl.lost = true;
    tl.fly = { t: 0, vx: Math.cos(T.a) * 34, vy: Math.sin(T.a) * 34 - 12 };
    const x = e.x + T.x;
    const y = e.y + T.y;
    s.fx.foxfire(x, y, 8, 5);
    s.fx.light(x, y, 0.8, false, 0x80b0ff);
    s.sfx.explode('s');
    s.cameras.main.shake(160, 0.004);
    g.poseT = 0.35;
    if (this.canFire(e)) s.bullets.shot('kitsunebi_0', x, y, this.aimAt(e, T.x, T.y), 42, 3, { home: 1.5, life: 3.4, spin: true });
  },

  kyubiAttack(g, e) {
    const s = this.scene;
    const b = s.bullets;
    const list = g.enraged ? ['fire', 'lash', 'daimonji', 'dance', 'rings'] : ['fire', 'daimonji', 'lash', 'dance'];
    const next = (pause = 1.3) => {
      g.phase++;
      g.step = 0;
      g.timer = pause;
    };
    const tips = this.kyubiTips(g);
    g.poseT = 0.3;
    switch (list[g.phase % list.length]) {
      case 'fire': {
        // kitsune-bi: a flame from every tail tip drifts out, hangs a moment, then they fly at the player one by one
        const n = volley(tips.length);
        for (let k = 0; k < n; k++) {
          const p = tips[Math.round((k * (tips.length - 1)) / Math.max(1, n - 1))];
          const order = g.step % 2 ? n - 1 - k : k;
          b.shot('eb_fox', p.x, p.y, p.a, 34, 2.5, { frz: { at: 0.45, hold: 0.3 + order * 0.09, turn: 0, speed: g.enraged ? fast : normal, aim: true, frame: 'eb_fox' } });
        }
        g.timer = g.enraged ? 0.95 : 1.2;
        if (++g.step >= (g.enraged ? 4 : 3)) next();
        break;
      }
      case 'daimonji': {
        if (g.step === 0) {
          // the 大 on the slope catches fire stroke by stroke, the way it is written (warning rings first); the
          // safe places are between the strokes
          let k = 0;
          for (const st of DAIMONJI) {
            for (let j = 0; j < st.length - 1; j++) {
              const [ax, au] = st[j];
              const [bx, bu] = st[j + 1];
              const n = Math.ceil(Math.hypot(bx - ax, bu - au) / 12);
              for (let q = j === 0 ? 0 : 1; q <= n; q++) {
                const x = ax + ((bx - ax) * q) / n;
                const u = au + ((bu - au) * q) / n;
                const y = s.parallax.screenY(u);
                k++;
                if (y > -10 && y < s.H + 10) b.zone(x, y, 8, { warn: 0.9 + k * 0.016, live: g.enraged ? 1.0 : 0.6, kind: 'fire', u });
              }
            }
            k += 8; // a breath between the strokes
          }
          s.fx.text(e.x, e.y - 34, 'DAIMONJI!', 1.2, 0xffc070);
          g.timer = 0.8;
          g.step = 1;
          break;
        }
        // while it burns: small aimed fans
        b.fan(e.x, e.y + 10, this.aimAt(e, 0, 10), g.enraged ? 5 : 3, 0.5, slow);
        g.timer = 0.7;
        if (++g.step >= 5) next(1.2);
        break;
      }
      case 'lash': {
        // the tails lash in a sweep, each one flinging a little fan at the player from its tip
        const n = tips.length;
        const k = g.step % n;
        const p = tips[Math.floor(g.step / n) % 2 ? n - 1 - k : k];
        b.fan(p.x, p.y, Math.atan2(s.player.y - p.y, s.player.x - p.x), 3, 0.32, normal);
        g.timer = 0.18;
        if (++g.step >= n + 3) next(); // (one sweep along the tails and a few back)
        break;
      }
      case 'dance': {
        // the fox dance: a spiral of fox-fire (three arms when it rages, sparser, with a slow counter-spiral)
        const arms = g.enraged ? 3 : 2;
        for (let k = 0; k < arms; k++) b.shot('eb_fox_s', e.x, e.y + 4, g.step * (g.enraged ? 0.45 : 0.36) + (k * TAU) / arms, slow + 6, 1.8);
        if (g.enraged && g.step % 5 === 0) b.fire(e.x, e.y + 4, -g.step * 0.3, slow);
        g.timer = g.enraged ? 0.22 : 0.145;
        if (++g.step >= (g.enraged ? 20 : 24)) next();
        break;
      }
      default:
        // rings with interleaving gaps
        b.ring(e.x, e.y + 4, 12, g.step * 0.22, slow, g.step % 2 === 1);
        g.timer = 0.8;
        if (++g.step >= 4) next(1.8); // (the rings drift off before the flames come)
    }
  },
};
