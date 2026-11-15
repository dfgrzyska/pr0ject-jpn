// Random encounter 5 (ex5): the hikikomori's room, a battle station behind towers of manga and noodle cups.
// Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The room (HEYA): its monitor's life (that is what to shoot), where the desk stands, the phases' thresholds;
 * the two towers (their life, how much of a hit on them reaches the monitor); the doorbell (how often, how long the
 * occupant hides, how much more the monitor takes then); how long a throw is shown coming (the reach); the manga,
 * cups and stacks; the chat bubbles (slots across, the gap, how far the next gap may be from the last); the lag
 * (how long everything hangs, how much loose shots turn); the gacha (how long the reels spin); the night.
 */
export const HEYA = {
  hp: 3000,
  home: 74,
  phase: [0.66, 0.33],
  tower: { hp: 320, pass: 0.3, pts: 3000 },
  bell: { every: [7, 9.5], dur: 1.7, take: 2 },
  reach: 0.3,
  manga: { speed: 115, open: 0.72 },
  cup: 1.0,
  stackWarn: 0.85,
  bubble: { slots: 12, gap: 2, h: 14, every: 1.3, rows: 2, step: 11, shift: 3 },
  lag: { hold: 1.0, turn: 0.25 },
  gacha: { spin: 1.1, show: 0.45 },
  dark: 0.82,
};

// where the parts sit, in logical px from the desk's anchor (VIEW centre, HEYA.home), and how deep
const LAYOUT = {
  who: [0, 24, -0.105],
  glow: [0, 24, -0.104],
  pc: [36, -26, -0.16],
  second: [-38, -12, -0.16],
  desk: [0, 22, -0.15],
  pet: [-52, 50, -0.106],
  mon: [0, -22, -0.12],
  scr: [0, -25.3, -0.115],
  hands: [5, 1, -0.125],
  tl: [-66, -6, -0.13],
  tr: [66, -6, -0.13],
};
const CAN_SPOTS = [[-44, 60], [46, 58], [-56, 54], [58, 62], [-38, 66], [52, 50], [-62, 64]]; // (empties on the floor round the chair)
const CAN_COLS = ['g', 'p', 'c', 'y', 'r'];
const NIGHT_TINT = 0x6a70a0;
const FLOOR = DEPTH.mid + 0.7; // stains, the light under the door: on the floor, under everything that moves

export const heya = {
  /**
   * The room of someone who no longer goes out, and it fights back. Behind the desk the occupant, wrapped in a
   * blanket, glasses glinting; on the desk the old CRT (the weak point), the PC with its lights going round, a
   * second screen, a hamster in its tank; on either side a tower that can be shot down (a share of every hit on it
   * reaches the monitor): manga on the left (it throws volumes and topples stacks), noodle cups on the right (it lobs
   * cups). A throw is shown coming: the glasses glint, a hand reaches for that tower. Now and then the doorbell
   * rings: someone's feet in the light under the front door, a flyer slid in; the occupant hides under the blanket,
   * the whole room holds its breath, and the monitor takes double.
   * 1. TWIERDZA Z MANG: volumes fly open into fans of pages, cups splash scalding broth, stacks sway over the tower
   *    and topple; with a tower down its attacks go, and the keyboard spits letters instead;
   * 2. TRYB NOCNY: the lights flicker off, only the screen lights the room (the PC overheats); lines of chat come
   *    down as speech bubbles of shots with a gap ("www"); "LAG...": everything hangs, juddering, then flies on;
   * 3. GACHA: what is left of the fortress falls in, volume by volume; a roulette spins and the pull decides the
   *    attack (N: rings; R: spirals; SSR: gold stars, confetti); capsules can be shot down, a gold one drops a prize.
   * It wears down visibly: the screen glitches, the monitor smokes, an error box pops up; at the end the tube dies
   * to a white dot and the occupant sinks under the blanket.
   */
  spawnHeya(w, base) {
    const s = this.scene;
    const g = { kind: 'heya', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], stacks: [], bits: [], deco: {}, towers: {}, heaps: [], cans: [], ay: -70, darkA: 0, bellAt: 8, drinkAt: 14, petRunAt: 6, pcPh: 0, take: { body: 1 } };
    const mon = this.pool.spawn('heya_mon', VIEW.width / 2, g.ay, { ...base, role: 'body', group: g, hp: HEYA.hp, maxHp: HEYA.hp, radius: 20, flashTint: 0x2a2a2a });
    mon.setDepth(DEPTH.air + LAYOUT.mon[2]);
    g.body = mon;
    g.parts.push(mon);
    g.maxTotal = HEYA.hp;
    const first = { who: 'heya_who_b0', glow: 'heya_wglow_b0', pc: 'heya_pc_0', second: 'heya_second_0', desk: 'heya_desk', pet: 'heya_pet_idle0', scr: 'scr_idle' };
    for (const k of Object.keys(first)) if (mon.texture.has(first[k])) g.deco[k] = this.segPool.spawn(first[k], VIEW.width / 2, g.ay).setDepth(DEPTH.air + LAYOUT[k][2]);
    g.deco.glow?.setAlpha(0);
    if (mon.texture.has('heya_feet')) g.feet = this.segPool.spawn('heya_feet', VIEW.width / 2, s.H - 10).setDepth(FLOOR).setAlpha(0);
    // the towers: enemies of their own (they can be shot down), but not what the fight is won by
    for (const side of ['tl', 'tr']) {
      const t = this.pool.spawn(`heya_${side}_0`, VIEW.width / 2 + LAYOUT[side][0], g.ay, { ...base, role: 'tower', side, group: g, hp: HEYA.tower.hp, maxHp: HEYA.tower.hp, radius: 18, pts: HEYA.tower.pts, passOn: { to: mon, k: HEYA.tower.pass }, flashTint: 0x2a2a2a });
      t.setDepth(DEPTH.air + LAYOUT[side][2]);
      t.lastHp = t.hp;
      g.towers[side] = t;
    }
    // the night: a dark over the room with a pool of the screen's light in it, and its glow on the floor
    g.dark = s.add.image(VIEW.width / 2, s.H / 2, this.heyaDarkTexture()).setDepth(DEPTH.mid + 0.5).setAlpha(0);
    g.glow = s.add.image(VIEW.width / 2, HEYA.home + 60, this.heyaGlowTexture()).setDepth(DEPTH.mid + 0.55).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    this.bossGroup = g;
    return mon;
  },

  /** The dark of night, a hole of light round the monitor (drawn once, on a canvas). */
  heyaDarkTexture() {
    const s = this.scene;
    const key = 'heya_dark';
    if (s.textures.exists(key)) return key;
    const w = VIEW.width;
    const h = Math.ceil(s.H);
    const tex = s.textures.createCanvas(key, w, h);
    const ctx = tex.getContext();
    const gr = ctx.createRadialGradient(w / 2, HEYA.home - 16, 14, w / 2, HEYA.home + 10, 150);
    gr.addColorStop(0, 'rgba(20,40,90,0)');
    gr.addColorStop(0.35, 'rgba(8,14,40,0.55)');
    gr.addColorStop(1, 'rgba(3,5,14,1)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
    return key;
  },

  heyaGlowTexture() {
    const s = this.scene;
    const key = 'heya_glow';
    if (s.textures.exists(key)) return key;
    const tex = s.textures.createCanvas(key, 160, 120);
    const ctx = tex.getContext();
    const gr = ctx.createRadialGradient(80, 30, 4, 80, 50, 80);
    gr.addColorStop(0, 'rgba(90,180,255,0.5)');
    gr.addColorStop(1, 'rgba(90,180,255,0)');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 160, 120);
    tex.refresh();
    return key;
  },

  updateHeya(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.heyaItems(g, dt);
    this.heyaStacks(g, dt);
    this.heyaAmbient(g, dt);
    this.heyaBits(g, dt);
    // the lights fade off at night ("KLIK.": a fluorescent tube's stutter first), back on (dimly) when it falls in
    const want = g.stage === 2 ? HEYA.dark : g.stage === 3 ? HEYA.dark * 0.4 : 0;
    const k = g.t - (g.klikT ?? -9);
    if (k < 0.42) g.darkA = k < 0.1 ? 0.6 : k < 0.18 ? 0.1 : k < 0.3 ? 0.78 : 0.25;
    else g.darkA += (want - g.darkA) * Math.min(1, dt * 2);
    const flick = 1 - (Math.random() < 0.06 ? 0.08 : 0) - Math.sin(g.t * 9) * 0.015;
    g.dark?.setAlpha(g.darkA * flick);
    g.glow?.setAlpha(Math.min(1, g.darkA / HEYA.dark) * 0.9 * flick).setPosition(e.x, g.ay + 64);
    if (g.state === 'enter') {
      g.ay += Math.max(14, (HEYA.home - g.ay) * 1.4) * dt;
      if (g.ay >= HEYA.home - 1) {
        g.ay = HEYA.home;
        Object.assign(g, { state: 'fight', awake: true, timer: 1, bellAt: g.t + 7 });
        s.fx.text(e.x, g.ay + 30, '...', 0.8, 0xd8e8f0);
      }
      return this.heyaPose(g, dt);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < HEYA.phase[0] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 2, 'TRYB NOCNY');
      s.fx.text(e.x, e.y + 30, 'KLIK.', 0.9, 0xd8e8f0);
      g.klikT = g.t;
    } else if (g.stage === 2 && left < HEYA.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'GACHA');
      s.cameras.main.shake(500, 0.008);
      // what is left of the fortress falls in, one tower and then the other
      if (this.heyaTower(g, 'tl')) this.heyaTowerDown(g.towers.tl, true);
      g.fallRightAt = g.t + (this.heyaTower(g, 'tl') ? 0.5 : 0.5);
    }
    if (g.fallRightAt && g.t > g.fallRightAt) {
      g.fallRightAt = 0;
      if (this.heyaTower(g, 'tr')) this.heyaTowerDown(g.towers.tr, true);
    }
    if (g.act) this.heyaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan0 = [['manga', 'cups', 'stacks', 'manga', 'cups'], ['bubbles', 'lag', 'manga', 'bubbles', 'cups'], ['gacha', 'manga', 'gacha', 'bubbles']][g.stage - 1];
      const next = plan0[g.phase % plan0.length];
      // nothing thrown into the chat: while its rows are still coming down, it waits
      const chatOn = (next === 'manga' || next === 'cups' || next === 'stacks') && s.bullets.pool.live.some((bl) => bl.chat && !bl.dead && bl.y < s.H - 10);
      if (g.t > g.bellAt) g.act = { kind: 'bell', t: 0, step: 0 };
      else if (chatOn) g.timer = 0.2;
      else {
        let kind = plan0[g.phase++ % plan0.length];
        // a tower down takes its attacks with it (the heaps still have volumes in them, once it has all fallen in)
        if ((kind === 'manga' || kind === 'stacks') && g.stage < 3 && !this.heyaTower(g, 'tl')) kind = 'typing';
        if (kind === 'cups' && !this.heyaTower(g, 'tr')) kind = 'typing';
        if (kind === 'lag' && s.bullets.pool.live.length < 10) kind = 'bubbles';
        g.act = { kind, t: 0, step: 0 };
        // a throw is shown coming: an arm reaches out of the blanket for the tower it comes from
        if (kind === 'manga' || kind === 'cups' || kind === 'stacks') {
          g.reach = kind === 'cups' ? 4 : g.stage < 3 ? 3 : 0;
          g.reachT = g.t + HEYA.reach + 0.15;
        }
      }
    } else if (!g.act && g.timer > 0.3 && g.t > g.drinkAt && this.canFire(e)) {
      // a sip of an energy drink between attacks; the empties pile up on the desk
      g.drinkT = g.t + 0.9;
      g.timer += 0.6;
      g.drinkAt = g.t + 11 + Math.random() * 5;
      s.fx.text(e.x + 14, g.ay - 60, 'PSST!', 0.5, 0xc8f0ff);
      s.time.delayedCall(900, () => this.heyaCan(g));
    }
    g.take = { body: g.act?.kind === 'bell' && g.act.t < HEYA.bell.dur ? HEYA.bell.take : 1 };
    this.heyaPose(g, dt);
  },

  /** A tower still standing (pooled sprites: check it is still this room's). */
  heyaTower(g, side) {
    const t = g.towers[side];
    return t && !t.dead && t.hp > 0 && t.group === g ? t : null;
  },

  /** A tower brought down (shot, or the room falling in): it comes apart volume by volume, a heap left behind. */
  heyaTowerDown(t, fallIn = false) {
    const s = this.scene;
    const g = t.group;
    if (!fallIn) {
      const pts = t.pts * s.score.mult;
      s.score.add(pts);
      s.fx.text(t.x, t.y - 20, `+${pts}`, 1.1, 0xffb868);
    }
    s.fx.explode(t.x, t.y, 'm');
    s.cameras.main.shake(220, 0.005);
    s.fx.text(t.x, t.y - 34, 'DOSA DOSA!', 0.8, 0xffffff);
    if (this.canFire(g.body) && !fallIn) s.bullets.ring(t.x, t.y + 20, 10, Math.random() * TAU, slow);
    // what it was made of, flying and bouncing on the floor
    for (let k = 0; k < 14; k++) {
      const frame = t.side === 'tl' ? `heya_vol_${k % 4}` : `noodle_${k % 2}`;
      this.heyaBit(g, frame, t.x + (Math.random() - 0.5) * 36, t.y - 30 + Math.random() * 50, { vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 80, ay: 320, spin: (Math.random() - 0.5) * 12, floor: t.y + 30 + Math.random() * 14, bounce: 0.35, life: 1.3, depth: DEPTH.air - 0.1, scale: 0.9 });
    }
    this.heyaJolt(g, t.x, t.y + 40);
    const heap = `heya_${t.side}_heap`;
    if (t.texture.has(heap)) g.heaps.push({ spr: this.segPool.spawn(heap, t.x, t.y).setDepth(t.depth).setAlpha(0), side: t.side, t: 0 });
    g.towers[t.side] = null;
    this.remove(t);
  },

  heyaDone(g, rest = 0.7) {
    g.act = null;
    g.timer = rest;
  },

  /** Where the things come from: the manga tower (left), the cups (right), the screen. */
  heyaFrom(g, where) {
    const x0 = VIEW.width / 2;
    if (where === 'books') return [x0 + LAYOUT.tl[0] + (Math.random() - 0.5) * 30, g.ay - 30 + Math.random() * 30];
    if (where === 'cups') return [x0 + LAYOUT.tr[0] + (Math.random() - 0.5) * 24, g.ay - 20 + Math.random() * 20];
    return [g.body.x, g.ay - 10];
  },

  /** A glint off both lenses (the occupant's look before a throw, or at a good pull). */
  heyaGlint(g) {
    // (it glances back over its shoulder: the glint off its one lens showing)
    const [wx, wy] = [VIEW.width / 2 + LAYOUT.who[0], g.ay + LAYOUT.who[1]];
    g.lookT = g.t + 0.5;
    this.heyaBit(g, 'heya_glint', wx - 9.3, wy - 14.3, { life: 0.45, depth: DEPTH.air - 0.1, pulse: 1.7 });
  },

  heyaAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    const R = HEYA.reach;
    a.t += dt;
    switch (a.kind) {
      case 'bell': {
        // the doorbell: it freezes, hides under the blanket; the screen shows who is at the door, whose feet
        // darken the light under it; a flyer slides in
        const B = HEYA.bell;
        if (a.step === 0) {
          a.step = 1;
          s.sfx.bell?.();
          s.fx.text(VIEW.width / 2, s.H - 34, 'PIN-PON!', 1.1, 0xfff0a0);
          s.fx.text(e.x, g.ay + 26, '!!', 0.6, 0xffffff);
          g.petHideT = g.t + B.dur + 0.8;
        }
        if (a.step === 1 && a.t > 0.6 && !a.flyer) {
          a.flyer = true;
          this.heyaBit(g, 'heya_flyer', VIEW.width / 2 + (Math.random() - 0.5) * 30, s.H + 6, { vy: -48, drag: 3, spin: (Math.random() - 0.5) * 1.5, life: 2.4, depth: FLOOR + 0.01 });
        }
        if (a.step === 1 && a.t > B.dur) {
          a.step = 2;
          s.fx.text(e.x, g.ay + 26, '...?', 0.8, 0xd8e8f0);
        }
        if (a.t > B.dur + 0.45) {
          g.bellAt = g.t + B.every[0] + Math.random() * (B.every[1] - B.every[0]);
          this.heyaDone(g, 0.5);
        }
        break;
      }
      case 'manga': {
        // volumes flung out one after another, spinning; each flies open into a fan of pages
        const n = g.stage === 3 ? 5 : 4;
        if (a.t > R + a.step * (g.stage === 3 ? 0.28 : 0.38)) {
          a.step++;
          const [x, y] = this.heyaFrom(g, 'books');
          const ang = Math.atan2(pl.y - y, pl.x - x) + (Math.random() - 0.5) * 0.5;
          const v = HEYA.manga.speed * (g.stage === 3 ? 1.2 : 1);
          this.heyaItem(g, 'manga', x, y, Math.cos(ang) * v, Math.sin(ang) * v, { open: HEYA.manga.open * (0.8 + Math.random() * 0.4) });
          g.throwT = g.t + 0.25;
          this.heyaWobble(g, 'tl');
        }
        if (a.step >= n) this.heyaDone(g, g.stage === 1 ? 0.45 : 0.8);
        break;
      }
      case 'cups':
        // noodle cups lobbed at the player and round them: scalding broth where they land (a shadow first)
        if (a.t > R + a.step * 0.32) {
          a.step++;
          const [x, y] = this.heyaFrom(g, 'cups');
          const tx = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 90, 10, VIEW.width - 10);
          const ty = Phaser.Math.Clamp(a.step === 1 ? pl.y : pl.y + (Math.random() - 0.5) * 50, s.H * 0.4, s.H - 16);
          this.heyaItem(g, 'cup', x, y, 0, 0, { x0: x, y0: y, tx, ty, time: HEYA.cup });
          g.throwT = g.t + 0.25;
          this.heyaWobble(g, 'tr');
        }
        if (a.step >= 4) this.heyaDone(g, 0.5);
        break;
      case 'stacks':
        // whole stacks of volumes rise over the tower, sway and topple onto the player (their shadow first)
        if (a.t > R * 0.5 + a.step * 0.4) {
          a.step++;
          const x = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 100, 10, VIEW.width - 10);
          const y = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 40, s.H * 0.4, s.H - 22);
          if (e.texture.has('manga_stack')) {
            const tl = this.heyaTower(g, 'tl');
            const spr = this.segPool.spawn('manga_stack', tl ? tl.x : x, tl ? tl.y - 40 : -50).setDepth(tl ? tl.depth - 0.001 : DEPTH.air + 0.03).setVisible(!!tl).setAlpha(0);
            g.stacks.push({ spr, x, y, t: 0, landed: false, from: tl ? [tl.x + (a.step - 2) * 10, tl.y - 30] : null, depthFall: DEPTH.air + 0.03 });
          }
          this.heyaWobble(g, 'tl');
        }
        if (a.step >= 4) this.heyaDone(g, 0.5);
        break;
      case 'typing':
        // (a tower down) the keyboard: a burst of keystrokes off the screen, a fan at the player and a ring
        if (a.t > a.step * 0.3) {
          a.step++;
          g.typeT = g.t + 0.4;
          if (a.step % 2) b.fan(e.x, e.y + 14, this.aimAt(e), 5, 0.8, normal);
          else b.ring(e.x, e.y + 14, 10, Math.random() * TAU, slow);
          s.fx.text(e.x + (Math.random() - 0.5) * 30, e.y + 22, ['KATA', 'KACHI', 'TAN!'][a.step % 3], 0.5, 0x9ad8ff);
        }
        if (a.step >= 4) this.heyaDone(g, 0.8);
        break;
      case 'bubbles':
        // lines of chat as speech bubbles of shots sweeping down; a gap between them ("www" there)
        if (a.t > a.step * HEYA.bubble.every) {
          a.step++;
          this.heyaBubbleRow(g);
          g.typeT = g.t + 0.5;
        }
        if (a.step >= HEYA.bubble.rows) this.heyaDone(g, 0.8);
        break;
      case 'lag': {
        // "LAG...": everything on the screen hangs, juddering, a loading bar fills; then it all flies on (chat
        // bubbles keep their course; some loose shots turn)
        const L = HEYA.lag;
        if (a.step === 0) {
          a.step = 1;
          g.lagId = (g.lagId ?? 0) + 1;
          for (const bl of b.pool.live) {
            if (bl.dead || bl.frz || bl.home || bl.safe > 0) continue;
            bl.lag = { id: g.lagId, vx: bl.vx, vy: bl.vy, ax: bl.ax ?? 0, ay: bl.ay ?? 0, x: bl.x, y: bl.y };
            bl.vx = bl.vy = 0;
            bl.ax = bl.ay = 0;
          }
          s.fx.text(VIEW.width / 2, s.H * 0.45, 'LAG...', 1.2, 0xffe07a);
        }
        if (a.step === 1) {
          const jit = Math.floor(a.t * 18) % 2 ? 0.7 : -0.7;
          for (const bl of b.pool.live) if (bl.lag && bl.lag.id === g.lagId && !bl.dead) bl.x = bl.lag.x + jit;
          const ink = this.tele;
          const [bx, by] = [VIEW.width / 2 - 30, s.H * 0.45 + 12];
          ink.fillStyle(0x101828, 0.75).fillRect(bx - 1, by - 1, 62, 6);
          ink.fillStyle(0xffe07a, 0.9).fillRect(bx, by, 60 * Math.min(1, a.t / L.hold), 4);
        }
        if (a.step === 1 && a.t > L.hold) {
          a.step = 2;
          for (const bl of b.pool.live) {
            const Lg = bl.lag;
            if (!Lg || Lg.id !== g.lagId || bl.dead) continue;
            const turn = !bl.chat && Math.random() < L.turn ? (Math.random() - 0.5) * 1.3 : 0;
            const c = Math.cos(turn);
            const sn = Math.sin(turn);
            bl.x = Lg.x;
            bl.vx = Lg.vx * c - Lg.vy * sn;
            bl.vy = Lg.vx * sn + Lg.vy * c;
            bl.ax = Lg.ax;
            bl.ay = Lg.ay;
            bl.lag = null;
          }
          s.cameras.main.flash(70, 120, 150, 200);
        }
        if (a.t > L.hold + 0.5) this.heyaDone(g, 0.6);
        break;
      }
      case 'gacha': {
        // the roulette spins, slowing, ticking; it stops on a pull, and the pull is the attack
        const G = HEYA.gacha;
        if (a.step === 0) {
          a.step = 1;
          a.ph = 0;
          s.fx.text(e.x, g.ay + 26, 'GACHA!', 0.8, 0xffe080);
          const r = Math.random();
          a.pull = r < 1 / 6 ? 'ssr' : r < 0.5 ? 'r' : 'n';
        }
        if (a.step === 1) {
          const k = Math.min(1, a.t / G.spin);
          const before = Math.floor(a.ph);
          a.ph += dt * 16 * (1 - k * k * 0.85);
          if (Math.floor(a.ph) !== before && k > 0.55) s.sfx.graze?.();
          g.reel = Math.floor(a.ph) % 3;
          g.typeT = g.t + 0.1;
        }
        if (a.step === 1 && a.t > G.spin) {
          a.step = 2;
          s.fx.text(e.x, g.ay + 26, { n: 'N...', r: 'R!', ssr: 'SSR!!' }[a.pull], 0.9, { n: 0xd0d0d8, r: 0x9ab8ff, ssr: 0xffe060 }[a.pull]);
          if (a.pull === 'ssr') {
            s.cameras.main.flash(160, 255, 220, 120);
            s.sfx.powerUp?.();
            g.cheerT = g.t + 1.4;
            for (let i = 0; i < 26; i++) this.heyaBit(g, `heya_confetti_${i % 4}`, Math.random() * VIEW.width, -6 - Math.random() * 30, { vx: (Math.random() - 0.5) * 20, vy: 30 + Math.random() * 40, ay: 20, spin: (Math.random() - 0.5) * 10, sway: 14, life: 2.6, depth: DEPTH.fx - 0.5 });
          } else if (a.pull === 'r') this.heyaGlint(g);
          else g.sighT = g.t + 1.1;
        }
        const n = { n: 5, r: 4, ssr: 3 }[a.pull];
        if (a.step >= 2 && a.t > G.spin + G.show + (a.step - 2) * 0.3 && a.step - 2 < n) {
          a.step++;
          const gold = a.pull === 'ssr';
          const col = gold ? 'y' : ['r', 'u', 'g'][a.step % 3];
          const frame = gold ? 'gacha_gold' : `gacha_${col}`;
          const [x, y] = this.heyaFrom(g, 'screen');
          const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 120, 10, VIEW.width - 10);
          this.heyaItem(g, 'gacha', x, y, (tx - x) * 0.9, -120, { frame, col, gold, pull: a.pull, hp: gold ? 3 : 1, burstY: Phaser.Math.Clamp(pl.y - 40 + Math.random() * 60, s.H * 0.35, s.H - 30) });
        }
        if (a.step - 2 >= n && a.t > G.spin + G.show + n * 0.3 + 0.6) this.heyaDone(g, 0.8);
        break;
      }
      default:
        this.heyaDone(g);
    }
  },

  /** A row of chat: speech bubbles of shots across the screen, a gap between two of them. */
  heyaBubbleRow(g) {
    const s = this.scene;
    const b = s.bullets;
    const B = HEYA.bubble;
    const dx = VIEW.width / B.slots;
    // the next gap is never more than `shift` slots from the last one: every row can be got through by any ship
    const hi = B.slots - B.gap - 1;
    const last = g.lastGap ?? 1 + Math.floor(Math.random() * hi);
    const gap = Phaser.Math.Clamp(last + Math.round((Math.random() * 2 - 1) * B.shift), 1, hi);
    g.lastGap = gap;
    const y0 = g.ay + 12;
    const v = slow * 0.85;
    const spans = [[0, gap], [gap + B.gap, B.slots]];
    for (const [i0, i1] of spans) {
      if (i1 - i0 < 2) continue;
      const x0 = i0 * dx + 5;
      const x1 = i1 * dx - 5;
      const n = Math.max(2, Math.round((x1 - x0) / B.step));
      const shots = [];
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n;
        shots.push(b.fire(x, y0, DOWN, v), b.fire(x, y0 - B.h, DOWN, v));
      }
      shots.push(b.fire(x0 - 3, y0 - B.h / 2, DOWN, v), b.fire(x1 + 3, y0 - B.h / 2, DOWN, v));
      shots.push(b.fire(x0 + 8, y0 - B.h - 6, DOWN, v)); // its tail (on top: the corridor below it stays clear)
      for (const sh of shots) if (sh) sh.chat = true; // (a lag leaves these on course: the bubble keeps its gap)
      // what the message says, for a moment, riding down inside it
      const tag = ['lol', 'gg', 'q', 'smile'][Math.floor(Math.random() * 4)];
      this.heyaBit(g, `heya_chat_${tag}`, (x0 + x1) / 2, y0 - B.h / 2, { vy: v * 1.05, life: 0.8, depth: DEPTH.enemyBullet - 0.05, fadeIn: 0.1 });
    }
    s.fx.text((gap + B.gap / 2) * dx, y0 + 4, 'www', 0.6, 0x9affd0);
  },

  heyaWobble(g, side) {
    const t = this.heyaTower(g, side);
    if (t) t.wobT = g.t + 0.35;
  },

  /** An empty can set down on the desk (in the first free spot). */
  heyaCan(g) {
    const e = g.body;
    if (g.defeated || !e || e.dead || g.cans.length >= CAN_SPOTS.length) return;
    const frame = `heya_can_${CAN_COLS[g.cans.length % CAN_COLS.length]}`;
    if (!e.texture.has(frame)) return;
    const [dx, dy] = CAN_SPOTS[g.cans.length];
    g.cans.push({ spr: this.segPool.spawn(frame, 0, 0).setDepth(DEPTH.air - 0.107), dx, dy });
  },

  /** A jolt through the floor: a couple of things lying about hop (and the hamster dives into its house). */
  heyaJolt(g, x, y) {
    const s = this.scene;
    g.petHideT = Math.max(g.petHideT ?? 0, g.t + 1.5);
    for (let k = 0; k < 3; k++) {
      const fx = Phaser.Math.Clamp(x + (Math.random() - 0.5) * 80, 10, VIEW.width - 10);
      const fy = Phaser.Math.Clamp(y + (Math.random() - 0.5) * 50, g.ay + 50, s.H - 10);
      this.heyaBit(g, `heya_can_${CAN_COLS[k]}`, fx, fy, { vx: (Math.random() - 0.5) * 30, vy: -50, ay: 260, floor: fy, bounce: 0.3, spin: (Math.random() - 0.5) * 6, life: 1.1, depth: FLOOR + 0.02, scale: 0.7, fadeIn: 0.1 });
    }
  },

  heyaItem(g, kind, x, y, vx, vy, more) {
    const frame = more.frame ?? (kind === 'manga' ? 'manga_0' : kind === 'cup' ? 'noodle_0' : 'gacha_r');
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ kind, spr: spr.setScale(spr.base * 1.15), vx, vy, t: 0, ...more });
  },

  /** A capsule coming apart: its two halves and the little toy inside, bouncing on the floor. */
  heyaCapsuleOpen(g, sp, col) {
    const fl = sp.y + 16;
    this.heyaBit(g, 'cap_top', sp.x - 3, sp.y - 2, { vx: -35, vy: -70, ay: 260, spin: -6, floor: fl, bounce: 0.4, life: 1.1, depth: DEPTH.air + 0.03 });
    this.heyaBit(g, `cap_bot_${col}`, sp.x + 3, sp.y + 2, { vx: 35, vy: -55, ay: 260, spin: 6, floor: fl, bounce: 0.4, life: 1.1, depth: DEPTH.air + 0.03 });
    this.heyaBit(g, `cap_toy_${Math.floor(Math.random() * 4)}`, sp.x, sp.y, { vx: (Math.random() - 0.5) * 20, vy: -45, ay: 260, floor: fl + 4, bounce: 0.5, life: 1.5, depth: DEPTH.air + 0.03 });
  },

  /** The volumes, cups and capsules in flight (capsules can be shot down). */
  heyaItems(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const pl = s.player;
    const ink = this.tele;
    let n = 0;
    for (const it of g.items) {
      it.t += dt;
      const sp = it.spr;
      let gone = false;
      if (it.kind === 'manga') {
        sp.x += it.vx * dt;
        sp.y += it.vy * dt;
        sp.setFrame(`manga_${Math.floor(it.t * 12) % 3}`);
        if (it.t > it.open) {
          const aim = this.aimAt(sp);
          if (this.canFire(sp) || sp.y < s.H * 0.7) b.fan(sp.x, sp.y, aim, g.stage === 1 ? 7 : 5, g.stage === 1 ? 1.1 : 0.9, normal);
          s.fx.text(sp.x, sp.y - 8, 'BAM!', 0.5, 0xffffff);
          // its pages fly out along the fan for a moment
          for (let k = -1; k <= 1; k++) {
            const a = aim + k * 0.4;
            this.heyaBit(g, `heya_page_${(k + 2) % 2}`, sp.x, sp.y, { vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, spin: (Math.random() - 0.5) * 14, life: 0.35, depth: DEPTH.air + 0.04 });
          }
          gone = true;
        }
      } else if (it.kind === 'cup') {
        // in an arc to where it lands; its shadow on the floor grows and darkens as it comes
        const k = Math.min(1, it.t / it.time);
        sp.setPosition(it.x0 + (it.tx - it.x0) * k, it.y0 + (it.ty - it.y0) * k - Math.sin(k * Math.PI) * 50);
        sp.setFrame(`noodle_${Math.floor(it.t * 8) % 2}`);
        ink.fillStyle(0x000000, 0.2 + k * 0.35).fillEllipse(it.tx, it.ty + 2, 10 + k * 14, 5 + k * 7);
        ink.fillStyle(0xffc070, 0.25 + k * 0.4).fillEllipse(it.tx, it.ty + 2, 3 + k * 5, 2 + k * 2);
        if (k >= 1) {
          b.zone(it.tx, it.ty, 13, { warn: 0.05, live: 0.9, kind: 'fire' });
          if (g.stage === 1) b.ring(it.tx, it.ty, 6, Math.random() * TAU, slow * 0.8); // the broth splashes
          s.fx.text(it.tx, it.ty - 10, 'ZURU!', 0.5, 0xffd080);
          // the cup rolls off, the broth stays as a stain for a while, steaming
          this.heyaBit(g, 'noodle_1', it.tx, it.ty, { vx: (Math.random() < 0.5 ? -1 : 1) * 50, drag: 3, spin: 8, life: 0.8, depth: DEPTH.air + 0.03 });
          this.heyaBit(g, 'heya_stain', it.tx, it.ty + 2, { life: 2.6, depth: FLOOR, fadeIn: 0.1 });
          for (let q = 0; q < 3; q++) s.time.delayedCall(250 + q * 300, () => this.heyaBit(g, 'heya_steam_0', it.tx + (Math.random() - 0.5) * 12, it.ty, { vy: -10, life: 1.2, grow: true, depth: FLOOR + 0.01 }));
          gone = true;
        }
      } else if (it.kind === 'gacha') {
        // up, then down under gravity; it bursts where it was meant to (once coming down) unless shot first
        it.vy += 260 * dt;
        sp.x += it.vx * dt;
        sp.y += it.vy * dt;
        sp.rotation += dt * 4;
        for (const sh of pl.shots.live) {
          if (sh.dead || Math.hypot(sh.x - sp.x, sh.y - sp.y) > 9) continue;
          pl.shots.kill(sh);
          if (--it.hp > 0) {
            s.fx.spark(sp.x, sp.y);
            continue;
          }
          this.heyaCapsuleOpen(g, sp, it.col);
          if (it.gold) {
            s.fx.text(sp.x, sp.y - 10, 'NAGRODA!', 0.9, 0xffe080);
            if (!g.prize) {
              g.prize = true;
              s.spawnPickup('purple', sp.x, sp.y, -40);
            }
          } else s.fx.text(sp.x, sp.y - 8, 'PAF', 0.45, 0xffffff);
          s.score.add(500 * s.score.mult);
          gone = true;
          break;
        }
        if (!gone && it.vy > 0 && sp.y >= it.burstY) {
          if (it.pull === 'ssr') {
            for (let i = 0; i < 5; i++) b.fan(sp.x, sp.y, (i / 5) * TAU, 3, 0.25, slow);
            s.fx.text(sp.x, sp.y - 10, 'SSR!', 1, 0xffe080);
          } else if (it.pull === 'r') {
            // a spiral: two arms, each shot a little further round and a little faster
            const a0 = Math.random() * TAU;
            for (let arm = 0; arm < 2; arm++) for (let i = 0; i < 7; i++) b.fire(sp.x, sp.y, a0 + arm * Math.PI + i * 0.42, slow * (0.55 + i * 0.08));
            s.fx.text(sp.x, sp.y - 8, 'PON!', 0.5, 0x9ab8ff);
          } else {
            b.ring(sp.x, sp.y, 9, Math.random() * TAU, slow);
            s.fx.text(sp.x, sp.y - 8, 'PON!', 0.5, 0xffffff);
          }
          this.heyaCapsuleOpen(g, sp, it.col);
          gone = true;
        }
      }
      if (!gone && pl.alive && Math.hypot(pl.x - sp.x, pl.y - sp.y) < 7) {
        pl.hit();
        gone = true;
      }
      if (gone || sp.y > s.H + 30 || sp.x < -30 || sp.x > VIEW.width + 30) {
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  /**
   * A stack of volumes: it rises over the manga tower, sways, tips; meanwhile its shadow darkens where it will land;
   * then it drops onto that spot and scatters into a ring.
   */
  heyaStacks(g, dt) {
    const s = this.scene;
    const pl = s.player;
    const ink = this.tele;
    let n = 0;
    for (const st of g.stacks) {
      st.t += dt;
      const warn = HEYA.stackWarn;
      if (st.t < warn) {
        const k = st.t / warn;
        ink.fillStyle(0x000000, 0.15 + k * 0.4).fillEllipse(st.x, st.y + 18, 10 + k * 10, 5 + k * 4);
        ink.lineStyle(1, 0xffe080, 0.3 + k * 0.5).strokeEllipse(st.x, st.y + 18, 10 + k * 10, 5 + k * 4);
        if (st.from) {
          const rise = Math.min(1, st.t / 0.3);
          const sway = st.t > 0.3 ? Math.sin((st.t - 0.3) * 18) * 0.14 * Math.min(1, (st.t - 0.3) / 0.2) : 0;
          const tip = st.t > warn - 0.15 ? (st.t - (warn - 0.15)) / 0.15 : 0;
          st.spr.setAlpha(rise).setPosition(st.from[0] + sway * 20, st.from[1] - rise * 24 - tip * 30).setRotation(sway + tip * 0.6);
        }
      } else if (!st.landed) {
        const k = Math.min(1, (st.t - warn) / 0.22);
        st.spr.setVisible(true).setAlpha(1).setRotation(0).setDepth(st.depthFall).setPosition(st.x, -50 + (st.y + 50) * k * k);
        if (k >= 1) {
          st.landed = true;
          st.left = 0.7;
          s.cameras.main.shake(100, 0.003);
          if (pl.alive && Math.abs(pl.x - st.x) < 7 && Math.abs(pl.y - st.y) < 21) pl.hit();
          s.bullets.ring(st.x, st.y, 10, Math.random() * TAU, slow * 0.9);
          s.fx.text(st.x, st.y - 24, 'DOSA!', 0.6, 0xffffff);
          this.heyaJolt(g, st.x, st.y + 10);
        }
      } else if ((st.left -= dt) <= 0) {
        st.spr.setRotation(0);
        this.segPool.kill(st.spr);
        continue;
      } else st.spr.setAlpha(Math.min(1, st.left * 2));
      g.stacks[n++] = st;
    }
    g.stacks.length = n;
  },

  /** What goes on round the fight: steam off the cups, smoke off a failing monitor, an overheating PC. */
  heyaAmbient(g, dt) {
    const e = g.body;
    if (!e.texture.has('heya_steam_0')) return;
    g.steamT = (g.steamT ?? 0) - dt;
    if (g.steamT <= 0) {
      g.steamT = 0.35;
      const tr = this.heyaTower(g, 'tr');
      const [x, y] = tr ? [tr.x - 14 + Math.random() * 30, tr.y - 10 + Math.random() * 40] : [VIEW.width / 2 - 60, g.ay + 2];
      this.heyaBit(g, 'heya_steam_0', x, y, { vx: (Math.random() - 0.5) * 4, vy: -9, life: 1.8, grow: true, depth: DEPTH.air - 0.1, alpha: g.darkA > 0.3 ? 0.5 : 0.9 });
    }
    // the monitor gives up by degrees: smoke from its vents, more of it the closer it is to the end
    const hurt = 1 - e.hp / e.maxHp;
    g.smokeT = (g.smokeT ?? 0) - dt;
    if (hurt > 0.5 && g.smokeT <= 0 && g.state === 'fight') {
      g.smokeT = 1.4 - hurt * 1.1;
      this.heyaBit(g, 'heya_steam_1', e.x - 18 + Math.random() * 36, e.y - 22, { vx: (Math.random() - 0.5) * 6, vy: -12, life: 1.6, grow: true, tint: 0x605860, depth: DEPTH.air - 0.119, alpha: 0.8 });
    }
    // phase 2: the PC runs hot, puffing from its top
    g.pcSteamT = (g.pcSteamT ?? 0) - dt;
    if (g.stage === 2 && g.pcSteamT <= 0) {
      g.pcSteamT = 0.5;
      this.heyaBit(g, 'heya_steam_0', VIEW.width / 2 + LAYOUT.pc[0] + (Math.random() - 0.5) * 10, g.ay + LAYOUT.pc[1] - 24, { vy: -14, life: 1.2, grow: true, depth: DEPTH.air - 0.159, alpha: 0.6 });
    }
  },

  /**
   * A bit of business (pages, steam, a rolling cup, capsule halves, confetti, cans hopping...): it moves, falls,
   * bounces off a floor line, spins, sways, fades. o: vx, vy, ay, drag, spin, floor, bounce, sway, life, depth,
   * scale, alpha, fadeIn, grow (steam's three sizes), pulse (a glint swelling and going), tint.
   */
  heyaBit(g, frame, x, y, o = {}) {
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(o.depth ?? DEPTH.air);
    if (o.scale) spr.setScale(spr.base * o.scale);
    if (o.tint) spr.setTint(o.tint);
    g.bits.push({ spr, t: 0, vx: 0, vy: 0, ay: 0, life: 1, alpha: 1, ...o, x0: x });
  },

  heyaBits(g, dt) {
    let n = 0;
    for (const bt of g.bits) {
      bt.t += dt;
      const sp = bt.spr;
      if (bt.t > bt.life || sp.dead) {
        sp.setRotation(0);
        this.segPool.kill(sp);
        continue;
      }
      if (bt.drag) {
        bt.vx *= Math.max(0, 1 - bt.drag * dt);
        bt.vy *= Math.max(0, 1 - bt.drag * dt);
      }
      bt.vy += bt.ay * dt;
      sp.x += bt.vx * dt + (bt.sway ? Math.cos(bt.t * 4 + bt.x0) * bt.sway * dt : 0);
      sp.y += bt.vy * dt;
      if (bt.floor != null && sp.y > bt.floor && bt.vy > 0) {
        sp.y = bt.floor;
        bt.vy = -bt.vy * (bt.bounce ?? 0);
        bt.vx *= 0.6;
        bt.spin = (bt.spin ?? 0) * 0.5;
        if (Math.abs(bt.vy) < 12) bt.vy = 0;
      }
      if (bt.spin) sp.rotation += bt.spin * dt;
      const k = bt.t / bt.life;
      let a = bt.alpha * (k > 0.7 ? (1 - k) / 0.3 : 1);
      if (bt.fadeIn) a *= Math.min(1, bt.t / bt.fadeIn);
      if (bt.grow) sp.setFrame(`heya_steam_${Math.min(2, Math.floor(k * 3))}`), (a *= Math.min(1, bt.t * 3) * (1 - k));
      if (bt.pulse) sp.setScale(sp.base * Math.sin(Math.min(1, k) * Math.PI) * bt.pulse);
      sp.setAlpha(Math.max(0, a));
      g.bits[n++] = bt;
    }
    g.bits.length = n;
  },

  /** Every part where it belongs and showing what it is doing (and in the dark, darker but for the screen). */
  heyaPose(g, dt = 0) {
    const s = this.scene;
    const e = g.body;
    const x0 = VIEW.width / 2 + (Math.floor(g.t * 3) % 9 === 0 ? Math.sin(g.t * 60) * 0.5 : 0);
    const a = g.act;
    const bell = a?.kind === 'bell';
    const hiding = bell && a.step === 1;
    // hits: a short glare; a hard run of them makes it jump (a drop of sweat, a crackle in the headphones)
    const lost = Math.max(0, (g.lastHp ?? e.hp) - e.hp);
    if (lost > 0) g.hurtT = g.t + 0.25;
    g.lastHp = e.hp;
    g.dmgAcc = Math.max(0, (g.dmgAcc ?? 0) * (1 - dt * 3) + lost);
    if (g.dmgAcc > 22 && g.t > (g.jumpCd ?? 0) && !hiding && g.state === 'fight') {
      g.jumpT = g.t + 0.35;
      g.jumpCd = g.t + 3;
      const [wx, wy] = [x0 + LAYOUT.who[0], g.ay + LAYOUT.who[1]];
      this.heyaBit(g, 'heya_sweat', wx + 12, wy - 24, { vx: 20, vy: -30, ay: 160, life: 0.6, depth: DEPTH.air - 0.1 });
      s.fx.text(wx + 30, wy - 18, 'KRZK!', 0.45, 0xff9ad0);
    }
    const hurt = g.t < (g.hurtT ?? 0);
    e.setPosition(x0 + LAYOUT.mon[0], g.ay + LAYOUT.mon[1]);
    // shots at the occupant in front of the desk count as shots at the room (they do not pass through it)
    const [ox, oy] = [x0 + LAYOUT.who[0], g.ay + LAYOUT.who[1]];
    e.shotSegs ??= [{ x: 0, y: 0, r: 13, take: 1 }, { x: 0, y: 0, r: 18, take: 1 }];
    e.shotSegs[0].x = ox;
    e.shotSegs[0].y = oy - 8;
    e.shotSegs[1].x = ox;
    e.shotSegs[1].y = oy + 14;
    if (e.texture.has('heya_mon_crack')) e.setFrame(g.stage === 3 ? 'heya_mon_crack' : 'heya_mon');
    const d = g.deco;
    const at = (k) => [x0 + LAYOUT[k][0], g.ay + LAYOUT[k][1]];
    // the occupant, its back to us: breathing, its elbows going when it types; now and then a glance back at us;
    // turned round glaring while it is being hit (and for good, near the end)
    if (lost > 0) g.glareT = g.t + 0.5;
    let mood = g.t < (g.typeT ?? 0) ? (Math.floor(g.t * 10) % 2 ? 't1' : 't0') : Math.floor(g.t / 0.9) % 2 ? 'b1' : 'b0';
    if (g.t % 5.5 < 0.6 || g.t < (g.lookT ?? 0)) mood = 'look';
    if (g.t < (g.glareT ?? 0) || ((g.stage === 3 || e.hp < e.maxHp * 0.12) && g.t % 2.6 < 1)) mood = 'glare';
    if (g.t < (g.reachT ?? 0) && g.reach) mood = g.reach === 4 ? 'reachR' : 'reachL';
    if (g.t < (g.throwT ?? 0)) mood = g.reach === 4 ? 'reachR' : g.reach === 3 ? 'reachL' : 'throw';
    if (g.t < (g.drinkT ?? 0)) mood = 'drink';
    if (g.t < (g.sighT ?? 0)) mood = 'sigh';
    if (g.t < (g.jumpT ?? 0)) mood = 'jump';
    if (g.t < (g.cheerT ?? 0)) mood = 'cheer';
    if (hiding) mood = Math.floor(a.t * 14) % 2 ? 'hide1' : 'hide0';
    d.who?.setPosition(...at('who')).setFrame(`heya_who_${mood}`);
    // (in the dark only what glows of it shows bright: headphones, glasses)
    const night = Math.min(1, g.darkA / HEYA.dark);
    if (d.glow) {
      const gf = `heya_wglow_${mood}`;
      const on = night > 0.05 && d.glow.texture.has(gf);
      d.glow.setVisible(on);
      if (on) d.glow.setPosition(...at('glow')).setFrame(gf).setAlpha(night);
    }
    // the PC: fans and lights going round (hot in phase 2; all but stopped while the bell rings)
    g.pcPh += dt * (hiding ? 1.5 : g.stage === 2 ? 14 : 8);
    if (d.pc) {
      d.pc.setPosition(...at('pc')).setFrame(`heya_pc_${g.stage === 2 ? 'hot_' : ''}${Math.floor(g.pcPh) % 6}`);
      if (hiding) d.pc.setTint(0x7a7a8a).setTintMode(Phaser.TintModes.MULTIPLY);
    }
    if (d.second) d.second.setPosition(...at('second')).setFrame(hiding ? 'heya_second_pause' : `heya_second_${Math.floor(g.t * 4) % 3}`);
    d.desk?.setPosition(...at('desk'));
    for (const c of g.cans) c.spr.setPosition(x0 + c.dx, g.ay + c.dy);
    // the hamster: breathing, now and then a run in its wheel, into its house when the bell rings or things fall
    if (d.pet) {
      if (g.t > g.petRunAt + 2.2) g.petRunAt = g.t + 7 + Math.random() * 6;
      let f = Math.floor(g.t / 1.2) % 2 ? 'idle1' : 'idle0';
      if (g.t > g.petRunAt) f = Math.floor(g.t * 10) % 2 ? 'run1' : 'run0';
      if (g.t < (g.petHideT ?? 0)) f = 'hide';
      d.pet.setPosition(...at('pet')).setFrame(`heya_pet_${f}`);
    }
    if (d.hands) {
      const typing = g.t < (g.typeT ?? 0);
      let f = typing ? Math.floor(g.t * 10) % 2 : 0;
      if (g.t < (g.reachT ?? 0) && g.reach) f = g.reach;
      if (g.t < (g.throwT ?? 0)) f = g.reach || 2;
      d.hands.setPosition(...at('hands')).setFrame(`heya_hands_${f}`).setVisible(!hiding && mood !== 'drink' && mood !== 'cheer');
    }
    if (d.scr) {
      let f = g.t % 4.2 < 0.15 ? 'scr_blink' : 'scr_idle';
      if (g.stage === 2) f = g.t < (g.typeT ?? 0) || a?.kind === 'bubbles' ? `scr_chat_${Math.floor(g.t * 6) % 3}` : f;
      if (g.stage === 3) f = Math.floor(g.t * 8) % 2 ? 'scr_static_0' : 'scr_static_1';
      if (a?.kind === 'typing') f = `scr_chat_${Math.floor(g.t * 8) % 3}`;
      if (a?.kind === 'lag') f = `scr_lag_${Math.floor(g.t * 5) % 2}`;
      if (a?.kind === 'gacha') f = a.step <= 1 || !a.pull ? `scr_reel_${g.reel ?? 0}` : `scr_res_${a.pull}`;
      if (hurt && !a) f = 'scr_angry';
      // worn down: an error box now and then below a fifth of its life, the blue screen at the very end
      const left = e.hp / e.maxHp;
      if (left < 0.2 && !a && g.t % 6 < 0.8) f = 'scr_batt';
      if (left < 0.06) f = 'scr_bsod';
      if (bell) f = a.step === 1 ? `scr_door_${Math.floor(g.t * 2) % 2}` : 'scr_what';
      // and the picture judders and snows for a frame, more often the worse it gets
      let jx = 0;
      if (left < 0.4 && !bell && Math.random() < (0.4 - left) * 0.25) {
        jx = Math.random() < 0.5 ? -1 : 1;
        if (Math.random() < 0.4) f = 'scr_static_0';
      }
      const [sx, sy] = at('scr');
      d.scr.setPosition(sx + jx, sy).setFrame(f);
    }
    // the light under the front door: someone's feet in it while the bell rings
    if (g.feet) g.feet.setAlpha(Phaser.Math.Linear(g.feet.alpha, hiding ? 0.9 : 0, Math.min(1, dt * 6)));
    // the towers sway when they throw or are hit
    for (const side of ['tl', 'tr']) {
      const t = this.heyaTower(g, side);
      if (!t) continue;
      if (t.hp < t.lastHp) t.wobT = g.t + 0.2;
      t.lastHp = t.hp;
      t.setPosition(...at(side)).setFrame(`heya_${side}_${g.t < (t.wobT ?? 0) && Math.floor(g.t * 12) % 2 ? 1 : 0}`);
    }
    for (const h of g.heaps) {
      h.t += dt;
      h.spr.setPosition(...at(h.side)).setAlpha(Math.min(1, Math.max(0, (h.t - 0.3) / 0.4)));
    }
    // the dark: everything in the room sinks into it, the screen stays bright, the hands catch its light
    const tint = (k) => Phaser.Display.Color.GetColor(255 - (255 - ((NIGHT_TINT >> 16) & 255)) * night * k, 255 - (255 - ((NIGHT_TINT >> 8) & 255)) * night * k, 255 - (255 - (NIGHT_TINT & 255)) * night * k);
    const M = Phaser.TintModes.MULTIPLY;
    if (night > 0.01) {
      for (const k of ['who', 'second', 'desk', 'pet']) d[k]?.setTint(tint(1)).setTintMode(M);
      if (!hiding) d.pc?.setTint(tint(0.7)).setTintMode(M);
      d.hands?.setTint(tint(0.6)).setTintMode(M);
      for (const c of g.cans) c.spr.setTint(tint(1)).setTintMode(M);
      for (const side of ['tl', 'tr']) {
        const t = this.heyaTower(g, side);
        if (t && !(t.flash > 0)) t.setTint(tint(1)).setTintMode(M);
      }
      for (const h of g.heaps) h.spr.setTint(tint(1)).setTintMode(M);
      if (!(e.flash > 0)) e.setTint(tint(0.5)).setTintMode(M);
    } else if (g.tinted || !hiding) {
      for (const k of ['who', 'second', 'desk', 'hands', 'pet']) d[k]?.clearTint();
      if (!hiding) d.pc?.clearTint();
      if (g.tinted) {
        for (const c of g.cans) c.spr.clearTint();
        for (const h of g.heaps) h.spr.clearTint();
        e.clearTint();
        for (const side of ['tl', 'tr']) this.heyaTower(g, side)?.clearTint();
      }
    }
    g.tinted = night > 0.01;
    // a hit flashes the occupant with the monitor (shots at it count: it should look like it)
    if (e.flash > 0 && d.who) d.who.setTint(0x707070).setTintMode(Phaser.TintModes.ADD);
    else if (d.who && d.who.tintMode === Phaser.TintModes.ADD) d.who.clearTint();
  },

  heyaCleanup(g) {
    const s = this.scene;
    const won = g.body && g.body.hp <= 0;
    for (const it of g.items) this.segPool.kill(it.spr);
    for (const st of g.stacks) {
      st.spr.setRotation(0);
      this.segPool.kill(st.spr);
    }
    for (const bt of g.bits) {
      bt.spr.setRotation(0);
      this.segPool.kill(bt.spr);
    }
    for (const side of ['tl', 'tr']) {
      const t = this.heyaTower(g, side);
      if (t) {
        s.fx.explode(t.x, t.y, 'm');
        this.pool.kill(t);
      }
    }
    // what stays on the desk for the end: the tube dies to a white dot, the occupant sinks under the blanket, a
    // phone pings somewhere in the room; then it all fades
    const stay = [...Object.values(g.deco), ...g.cans.map((c) => c.spr), ...g.heaps.map((h) => h.spr), g.feet].filter(Boolean);
    if (won && stay.length) {
      const d = g.deco;
      d.glow?.setVisible(false);
      d.hands?.setVisible(false);
      if (d.second?.frame.name === 'heya_second_pause') d.second.setFrame('heya_second_0'); // (beaten while the doorbell rang: not left paused)
      d.scr?.setFrame('scr_off_0');
      s.time.delayedCall(250, () => d.scr?.setFrame('scr_off_1'));
      s.time.delayedCall(500, () => d.scr?.setFrame('scr_off_2'));
      if (d.who) {
        d.who.setFrame('heya_who_hide0');
        s.tweens.add({ targets: d.who, y: d.who.y + 12, duration: 1400, ease: 'Sine.easeIn' });
      }
      s.time.delayedCall(1300, () => {
        s.fx.text(VIEW.width * 0.75, s.H * 0.7, 'PING!', 0.7, 0xc8f0ff);
        s.sfx.pickup?.();
      });
      s.tweens.add({ targets: stay, alpha: 0, delay: 1400, duration: 900, onComplete: () => stay.forEach((sp) => this.segPool.kill(sp)) });
    } else for (const sp of stay) this.segPool.kill(sp);
    g.items = [];
    g.stacks = [];
    g.bits = [];
    g.heaps = [];
    g.cans = [];
    g.deco = {};
    g.towers = {};
    g.feet = null;
    g.dark?.destroy();
    g.glow?.destroy();
    g.dark = null;
    g.glow = null;
  },
};
