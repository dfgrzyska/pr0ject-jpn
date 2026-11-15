// Random encounter 5 (ex5): the hikikomori's room, a battle station behind towers of manga and noodle cups.
// Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The room (HEYA): its monitor's life (that is what to shoot), where the desk stands, the phases' thresholds;
 * the two towers (their life, how much of a hit on them reaches the monitor); the doorbell (how often, how long the
 * occupant hides, how much more the monitor takes then); the manga, cups and stacks; the chat bubbles (how many
 * slots across, the gap); the lag (how long everything hangs); the gacha (how long the reels spin); the night.
 */
export const HEYA = {
  hp: 3000,
  home: 74,
  phase: [0.66, 0.33],
  tower: { hp: 320, pass: 0.3, pts: 3000 },
  bell: { every: [7, 9.5], dur: 1.7, take: 2 },
  manga: { speed: 115, open: 0.72 },
  cup: 1.0,
  stackWarn: 0.85,
  bubble: { slots: 12, gap: 2, h: 14, every: 1.0, rows: 2, step: 11 },
  lag: { hold: 1.0, turn: 0.4 },
  gacha: { spin: 1.1, show: 0.45 },
  dark: 0.82,
};

// where the parts sit, in logical px from the desk's anchor (VIEW centre, HEYA.home), and how deep
const LAYOUT = {
  who: [0, -46, -0.17],
  pc: [36, -26, -0.16],
  second: [-38, -12, -0.16],
  desk: [0, 22, -0.15],
  mon: [0, -22, -0.12],
  scr: [0, -25.3, -0.115],
  hands: [5, 1, -0.125],
  tl: [-66, -6, -0.13],
  tr: [66, -6, -0.13],
};
const NIGHT_TINT = 0x6a70a0;

export const heya = {
  /**
   * The room of someone who no longer goes out, and it fights back. Behind the desk the occupant, wrapped in a
   * blanket, glasses glinting; on the desk the old CRT (the weak point), the PC with its lights going round, a
   * second screen; on either side a tower that can be shot down (a share of every hit on it reaches the monitor):
   * manga on the left (it throws volumes and topples stacks), noodle cups on the right (it lobs cups). Now and then
   * the doorbell rings: the occupant hides under the blanket, stops everything, and the monitor takes double.
   * 1. TWIERDZA Z MANG: volumes flung open into fans of pages, scalding cups, stacks toppling; with a tower down its
   *    attacks go, and the keyboard spits letters instead;
   * 2. TRYB NOCNY: the lights go off, only the screen lights the room; lines of chat come down as speech bubbles of
   *    shots with a gap ("www"); "LAG...": everything on the screen hangs for a second, some of it flies on turned;
   * 3. GACHA: what is left of the fortress falls in; the screen spins a roulette and the pull decides the attack
   *    (N: capsules bursting into rings; R: into spirals; SSR: gold ones into stars); a capsule can be shot down in
   *    the air before it bursts, and a gold one shot down drops a prize.
   */
  spawnHeya(w, base) {
    const s = this.scene;
    const g = { kind: 'heya', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], stacks: [], bits: [], deco: {}, towers: {}, heaps: [], ay: -70, darkA: 0, bellAt: 8, take: { body: 1 } };
    const mon = this.pool.spawn('heya_mon', VIEW.width / 2, g.ay, { ...base, role: 'body', group: g, hp: HEYA.hp, maxHp: HEYA.hp, radius: 20, flashTint: 0x2a2a2a });
    mon.setDepth(DEPTH.air + LAYOUT.mon[2]);
    g.body = mon;
    g.parts.push(mon);
    g.maxTotal = HEYA.hp;
    for (const k of ['who', 'pc', 'second', 'desk', 'scr', 'hands']) {
      const frame = { who: 'heya_who_b0', pc: 'heya_pc_0', second: 'heya_second_0', desk: 'heya_desk', scr: 'scr_idle', hands: 'heya_hands_0' }[k];
      if (mon.texture.has(frame)) g.deco[k] = this.segPool.spawn(frame, VIEW.width / 2, g.ay).setDepth(DEPTH.air + LAYOUT[k][2]);
    }
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
    this.heyaBits(g, dt);
    // the lights fade off at night, back on (dimly) when the room falls in; the screen's light flickers
    const want = g.stage === 2 ? HEYA.dark : g.stage === 3 ? HEYA.dark * 0.4 : 0;
    g.darkA += (want - g.darkA) * Math.min(1, dt * 2);
    const flick = 1 - (Math.random() < 0.06 ? 0.08 : 0) - Math.sin(g.t * 9) * 0.015;
    g.dark?.setAlpha(g.darkA * flick);
    g.glow?.setAlpha((g.darkA / HEYA.dark) * 0.9 * flick).setPosition(e.x, g.ay + 64);
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
    } else if (g.stage === 2 && left < HEYA.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'GACHA');
      s.cameras.main.shake(500, 0.008);
      // what is left of the fortress falls in
      for (const side of ['tl', 'tr']) if (this.heyaTower(g, side)) this.heyaTowerDown(g.towers[side], true);
    }
    if (g.act) this.heyaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      if (g.t > g.bellAt) g.act = { kind: 'bell', t: 0, step: 0 };
      else {
        const plan = [['manga', 'cups', 'stacks', 'manga', 'cups'], ['bubbles', 'lag', 'manga', 'bubbles', 'cups'], ['gacha', 'manga', 'gacha', 'bubbles']][g.stage - 1];
        let kind = plan[g.phase++ % plan.length];
        // a tower down takes its attacks with it (the heaps still have volumes in them, once it has all fallen in)
        if ((kind === 'manga' || kind === 'stacks') && g.stage < 3 && !this.heyaTower(g, 'tl')) kind = 'typing';
        if (kind === 'cups' && !this.heyaTower(g, 'tr')) kind = 'typing';
        if (kind === 'lag' && s.bullets.pool.live.length < 10) kind = 'bubbles';
        g.act = { kind, t: 0, step: 0 };
      }
    }
    g.take = { body: g.act?.kind === 'bell' && g.act.t < HEYA.bell.dur ? HEYA.bell.take : 1 };
    this.heyaPose(g, dt);
  },

  /** A tower still standing (pooled sprites: check it is still this room's). */
  heyaTower(g, side) {
    const t = g.towers[side];
    return t && !t.dead && t.hp > 0 && t.group === g ? t : null;
  },

  /** A tower brought down (shot, or the room falling in): a heap left where it stood, volumes or cups flying. */
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
    const heap = `heya_${t.side}_heap`;
    if (t.texture.has(heap)) g.heaps.push({ spr: this.segPool.spawn(heap, t.x, t.y).setDepth(t.depth), side: t.side });
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

  heyaAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'bell': {
        // the doorbell: it freezes, hides under the blanket; the screen shows who is at the door
        const B = HEYA.bell;
        if (a.step === 0) {
          a.step = 1;
          s.sfx.bell?.();
          s.fx.text(VIEW.width / 2, s.H - 34, 'PIN-PON!', 1.1, 0xfff0a0);
          s.fx.text(e.x, g.ay + 26, '!!', 0.6, 0xffffff);
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
        if (a.t > a.step * (g.stage === 3 ? 0.28 : 0.38)) {
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
        if (a.t > a.step * 0.32) {
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
        // whole stacks of volumes topple onto the player (their shadow first, darkening as they come)
        if (a.t > a.step * 0.4) {
          a.step++;
          const x = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 100, 10, VIEW.width - 10);
          const y = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 40, s.H * 0.4, s.H - 22);
          if (e.texture.has('manga_stack')) {
            const spr = this.segPool.spawn('manga_stack', x, -50).setDepth(DEPTH.air + 0.03).setVisible(false);
            g.stacks.push({ spr, x, y, t: 0, landed: false });
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
      case 'lag':
        // "LAG...": everything on the screen hangs for a moment, then flies on (some of it turned)
        if (a.step === 0) {
          a.step = 1;
          g.lagId = (g.lagId ?? 0) + 1;
          for (const bl of b.pool.live) {
            if (bl.dead || bl.frz || bl.home || bl.safe > 0) continue;
            bl.lag = { id: g.lagId, vx: bl.vx, vy: bl.vy, ax: bl.ax ?? 0, ay: bl.ay ?? 0 };
            bl.vx = bl.vy = 0;
            bl.ax = bl.ay = 0;
          }
          s.fx.text(VIEW.width / 2, s.H * 0.45, 'LAG...', 1.2, 0xffe07a);
        }
        if (a.step === 1 && a.t > HEYA.lag.hold) {
          a.step = 2;
          for (const bl of b.pool.live) {
            const L = bl.lag;
            if (!L || L.id !== g.lagId || bl.dead) continue;
            const turn = Math.random() < HEYA.lag.turn ? (Math.random() - 0.5) * 1.3 : 0;
            const c = Math.cos(turn);
            const sn = Math.sin(turn);
            bl.vx = L.vx * c - L.vy * sn;
            bl.vy = L.vx * sn + L.vy * c;
            bl.ax = L.ax;
            bl.ay = L.ay;
            bl.lag = null;
          }
        }
        if (a.t > HEYA.lag.hold + 0.5) this.heyaDone(g, 0.6);
        break;
      case 'gacha': {
        // the roulette spins, stops on a pull; the pull is the attack
        const G = HEYA.gacha;
        if (a.step === 0) {
          a.step = 1;
          s.fx.text(e.x, g.ay + 26, 'GACHA!', 0.8, 0xffe080);
          const r = Math.random();
          a.pull = r < 1 / 6 ? 'ssr' : r < 0.5 ? 'r' : 'n';
        }
        g.typeT = a.t < G.spin ? g.t + 0.1 : g.typeT;
        if (a.step === 1 && a.t > G.spin) {
          a.step = 2;
          s.fx.text(e.x, g.ay + 26, { n: 'N', r: 'R!', ssr: 'SSR!!' }[a.pull], 0.9, { n: 0xd0d0d8, r: 0x9ab8ff, ssr: 0xffe060 }[a.pull]);
        }
        const n = { n: 5, r: 4, ssr: 3 }[a.pull];
        if (a.step >= 2 && a.t > G.spin + G.show + (a.step - 2) * 0.3 && a.step - 2 < n) {
          a.step++;
          const gold = a.pull === 'ssr';
          const frame = gold ? 'gacha_gold' : ['gacha_r', 'gacha_u', 'gacha_g'][a.step % 3];
          const [x, y] = this.heyaFrom(g, 'screen');
          const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 120, 10, VIEW.width - 10);
          this.heyaItem(g, 'gacha', x, y, (tx - x) * 0.9, -120, { frame, gold, pull: a.pull, hp: gold ? 3 : 1, burstY: Phaser.Math.Clamp(pl.y - 40 + Math.random() * 60, s.H * 0.35, s.H - 30) });
        }
        if (a.step - 2 >= n && a.t > G.spin + G.show + n * 0.3 + 0.6) this.heyaDone(g, 0.8);
        break;
      }
      default:
        this.heyaDone(g);
    }
  },

  /** A row of chat: two or three speech bubbles of shots across the screen, a gap between two of them. */
  heyaBubbleRow(g) {
    const s = this.scene;
    const b = s.bullets;
    const B = HEYA.bubble;
    const dx = VIEW.width / B.slots;
    const gap = 1 + Math.floor(Math.random() * (B.slots - B.gap - 2));
    const y0 = g.ay + 12;
    const v = slow * 0.85;
    const spans = [[0, gap], [gap + B.gap, B.slots]];
    // a long bubble may split in two (with a narrow gap that the shots still close)
    for (const [i0, i1] of spans) {
      if (i1 - i0 < 2) continue;
      const x0 = i0 * dx + 5;
      const x1 = i1 * dx - 5;
      const n = Math.max(2, Math.round((x1 - x0) / B.step));
      for (let k = 0; k <= n; k++) {
        const x = x0 + ((x1 - x0) * k) / n;
        b.fire(x, y0, DOWN, v);
        b.fire(x, y0 - B.h, DOWN, v);
      }
      b.fire(x0 - 3, y0 - B.h / 2, DOWN, v);
      b.fire(x1 + 3, y0 - B.h / 2, DOWN, v);
      b.fire(x0 + 8, y0 + 6, DOWN, v); // its tail
    }
    s.fx.text((gap + B.gap / 2) * dx, y0 + 4, 'www', 0.6, 0x9affd0);
  },

  heyaWobble(g, side) {
    const t = this.heyaTower(g, side);
    if (t) t.wobT = g.t + 0.35;
  },

  heyaItem(g, kind, x, y, vx, vy, more) {
    const frame = more.frame ?? (kind === 'manga' ? 'manga_0' : kind === 'cup' ? 'noodle_0' : 'gacha_r');
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ kind, spr: spr.setScale(spr.base * 1.15), vx, vy, t: 0, ...more });
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
          if (this.canFire(sp) || sp.y < s.H * 0.7) b.fan(sp.x, sp.y, this.aimAt(sp), g.stage === 1 ? 7 : 5, g.stage === 1 ? 1.1 : 0.9, normal);
          s.fx.text(sp.x, sp.y - 8, 'BAM!', 0.5, 0xffffff);
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
          s.fx.shards(sp.x, sp.y, 5, true);
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
          s.fx.shards(sp.x, sp.y, 5, true);
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

  /** A stack of volumes: its shadow first, then it drops and scatters into a ring. */
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
      } else if (!st.landed) {
        const k = Math.min(1, (st.t - warn) / 0.22);
        st.spr.setVisible(true).setPosition(st.x, -50 + (st.y + 50) * k * k);
        if (k >= 1) {
          st.landed = true;
          st.left = 0.7;
          s.cameras.main.shake(100, 0.003);
          if (pl.alive && Math.abs(pl.x - st.x) < 7 && Math.abs(pl.y - st.y) < 21) pl.hit();
          s.bullets.ring(st.x, st.y, 10, Math.random() * TAU, slow * 0.9);
          s.fx.text(st.x, st.y - 24, 'DOSA!', 0.6, 0xffffff);
        }
      } else if ((st.left -= dt) <= 0) {
        this.segPool.kill(st.spr);
        continue;
      } else st.spr.setAlpha(Math.min(1, st.left * 2));
      g.stacks[n++] = st;
    }
    g.stacks.length = n;
  },

  /** Steam off the cups (and the mug), drifting up and thinning. */
  heyaBits(g, dt) {
    g.steamT = (g.steamT ?? 0) - dt;
    const e = g.body;
    if (g.steamT <= 0 && e.texture.has('heya_steam_0')) {
      g.steamT = 0.35;
      const tr = this.heyaTower(g, 'tr');
      const [x, y] = tr ? [tr.x - 14 + Math.random() * 30, tr.y - 10 + Math.random() * 40] : [VIEW.width / 2 - 60, g.ay + 2];
      g.bits.push({ spr: this.segPool.spawn('heya_steam_0', x, y).setDepth(DEPTH.air - 0.1), t: 0, vx: (Math.random() - 0.5) * 4 });
    }
    let n = 0;
    for (const bt of g.bits) {
      bt.t += dt;
      if (bt.t > 1.8) {
        this.segPool.kill(bt.spr);
        continue;
      }
      bt.spr.x += bt.vx * dt + Math.sin(bt.t * 3) * 0.1;
      bt.spr.y -= 9 * dt;
      bt.spr.setFrame(`heya_steam_${Math.min(2, Math.floor(bt.t / 0.6))}`).setAlpha(Math.min(1, bt.t * 3) * (1 - bt.t / 1.8) * (g.darkA > 0.3 ? 0.5 : 0.9));
      g.bits[n++] = bt;
    }
    g.bits.length = n;
  },

  /** Every part where it belongs and showing what it is doing (and in the dark, darker but for the screen). */
  heyaPose(g) {
    const s = this.scene;
    const e = g.body;
    const x0 = VIEW.width / 2 + (Math.floor(g.t * 3) % 9 === 0 ? Math.sin(g.t * 60) * 0.5 : 0);
    const a = g.act;
    const bell = a?.kind === 'bell';
    const hurt = g.t < (g.hurtT ?? 0);
    if (e.hp < (g.lastHp ?? e.hp)) g.hurtT = g.t + 0.25;
    g.lastHp = e.hp;
    e.setPosition(x0 + LAYOUT.mon[0], g.ay + LAYOUT.mon[1]);
    if (e.texture.has('heya_mon_crack')) e.setFrame(g.stage === 3 ? 'heya_mon_crack' : 'heya_mon');
    const d = g.deco;
    const at = (k) => [x0 + LAYOUT[k][0], g.ay + LAYOUT[k][1]];
    // the occupant: breathing, blinking; glaring when hurt or in the end; under the blanket when the bell rings
    if (d.who) {
      let f = Math.floor(g.t / 0.9) % 2 ? 'heya_who_b1' : 'heya_who_b0';
      if (g.t % 3.7 < 0.14) f = 'heya_who_blink';
      if (hurt || g.stage === 3 || e.hp < e.maxHp * 0.12) f = 'heya_who_angry';
      if (bell && a.step === 1) f = Math.floor(a.t * 14) % 2 ? 'heya_who_hide1' : 'heya_who_hide0';
      d.who.setPosition(...at('who')).setFrame(f);
    }
    d.pc?.setPosition(...at('pc')).setFrame(`heya_pc_${Math.floor(g.t * 8) % 6}`);
    d.second?.setPosition(...at('second')).setFrame(`heya_second_${Math.floor(g.t * 4) % 3}`);
    d.desk?.setPosition(...at('desk'));
    if (d.hands) {
      const typing = g.t < (g.typeT ?? 0);
      const f = g.t < (g.throwT ?? 0) ? 2 : typing ? Math.floor(g.t * 10) % 2 : 0;
      d.hands.setPosition(...at('hands')).setFrame(`heya_hands_${f}`).setVisible(!(bell && a.step === 1));
    }
    if (d.scr) {
      let f = g.t % 4.2 < 0.15 ? 'scr_blink' : 'scr_idle';
      if (g.stage === 2) f = g.t < (g.typeT ?? 0) || a?.kind === 'bubbles' ? `scr_chat_${Math.floor(g.t * 6) % 3}` : f;
      if (g.stage === 3) f = Math.floor(g.t * 8) % 2 ? 'scr_static_0' : 'scr_static_1';
      if (a?.kind === 'typing') f = `scr_chat_${Math.floor(g.t * 8) % 3}`;
      if (a?.kind === 'lag') f = `scr_lag_${Math.floor(g.t * 5) % 2}`;
      if (a?.kind === 'gacha') f = a.t < HEYA.gacha.spin ? `scr_reel_${Math.floor(g.t * 14) % 3}` : `scr_res_${a.pull}`;
      if (hurt && !a) f = 'scr_angry';
      if (e.hp < e.maxHp * 0.06) f = 'scr_bsod';
      if (bell) f = a.step === 1 ? `scr_door_${Math.floor(g.t * 2) % 2}` : 'scr_what';
      d.scr.setPosition(...at('scr')).setFrame(f);
    }
    // the towers sway when they throw or are hit
    for (const side of ['tl', 'tr']) {
      const t = this.heyaTower(g, side);
      if (!t) continue;
      if (t.hp < t.lastHp) t.wobT = g.t + 0.2;
      t.lastHp = t.hp;
      t.setPosition(...at(side)).setFrame(`heya_${side}_${g.t < (t.wobT ?? 0) && Math.floor(g.t * 12) % 2 ? 1 : 0}`);
    }
    for (const h of g.heaps) h.spr.setPosition(...at(h.side));
    // the dark: everything in the room sinks into it, the screen stays bright, the hands catch its light
    const night = g.darkA / HEYA.dark;
    const tint = (k) => Phaser.Display.Color.GetColor(255 - (255 - ((NIGHT_TINT >> 16) & 255)) * night * k, 255 - (255 - ((NIGHT_TINT >> 8) & 255)) * night * k, 255 - (255 - (NIGHT_TINT & 255)) * night * k);
    if (night > 0.01 && !hurt) {
      const M = Phaser.TintModes.MULTIPLY;
      for (const k of ['who', 'pc', 'second', 'desk']) d[k]?.setTint(tint(1)).setTintMode(M);
      d.hands?.setTint(tint(0.6)).setTintMode(M);
      for (const side of ['tl', 'tr']) {
        const t = this.heyaTower(g, side);
        if (t && !(t.flash > 0)) t.setTint(tint(1)).setTintMode(M);
      }
      for (const h of g.heaps) h.spr.setTint(tint(1)).setTintMode(M);
      if (!(e.flash > 0)) e.setTint(tint(0.5)).setTintMode(M);
    } else if (night <= 0.01 && g.tinted) {
      for (const k of ['who', 'pc', 'second', 'desk', 'hands']) d[k]?.clearTint();
      for (const h of g.heaps) h.spr.clearTint();
      e.clearTint();
      for (const side of ['tl', 'tr']) this.heyaTower(g, side)?.clearTint();
    }
    g.tinted = night > 0.01;
    void s;
  },

  heyaCleanup(g) {
    for (const it of g.items) this.segPool.kill(it.spr);
    for (const st of g.stacks) this.segPool.kill(st.spr);
    for (const bt of g.bits) this.segPool.kill(bt.spr);
    for (const h of g.heaps) this.segPool.kill(h.spr);
    for (const k of Object.keys(g.deco)) if (g.deco[k]) this.segPool.kill(g.deco[k]);
    for (const side of ['tl', 'tr']) {
      const t = this.heyaTower(g, side);
      if (t) {
        this.scene.fx.explode(t.x, t.y, 'm');
        this.pool.kill(t);
      }
    }
    g.items = [];
    g.stacks = [];
    g.bits = [];
    g.heaps = [];
    g.deco = {};
    g.towers = {};
    g.dark?.destroy();
    g.glow?.destroy();
    g.dark = null;
    g.glow = null;
  },
};
