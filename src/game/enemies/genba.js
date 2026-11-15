// Random encounter 3 (ex3): the construction site cat and its tower. Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The site (GENBA): life (the tower, then the cat), the tower's place, the phases' thresholds, the beams (warning,
 * fall), the crane hook's swing (seconds, reach), the fissure (zones, spacing), the cat's pounces (crouch, speed,
 * how many in a row), its claw swipe (warning), its zoomies (speed, how far in from the edges), its wash (seconds,
 * how much harder it is hit then), and how much bigger the cat is shown once it comes down to fight.
 */
export const GENBA = {
  hp: 2500,
  home: 116,
  phase: [0.66, 0.33],
  beamWarn: 0.9,
  swing: { dur: 4.2, reach: 1.05 },
  fissure: { n: 9, gap: 17 },
  pounce: { aim: 0.8, again: 0.5, speed: 320, n: 3 },
  scratch: { warn: 0.55 },
  zoom: { speed: 300, inset: 18 },
  nap: { dur: 2.2, take: 1.5 },
  catScale: 1.3,
};
const ROOF = -54; // the cat's place on the tower's roof, off the tower's centre (logical px)

export const genba = {
  /**
   * A tower going up on a building site in an old Edo street, a ginger cat in a yellow hard hat working on top of
   * it; under the site, the giant catfish of the old prints. Three phases:
   * 1. BUDOWA W TOKU: the cat flings bolts and boomerangs its spanner; the crane drops I-beams (their shadows grow
   *    on the ground first) that shatter into shards; the crane's hook comes down on its cable and swings across;
   * 2. NAMAZU SIĘ BUDZI: the catfish shakes the ground: quakes, fissures running at the player and spitting mud;
   *    the tower cracks and leans, beams fall thicker;
   * 3. ZAWALENIE: the tower comes down; the cat jumps down to fight, furious: three pounces in a row (it crouches and
   *    wiggles its rump first, as cats do), a claw swipe that tears three lines of shots across the player, its hard
   *    hat thrown like a boomerang, its zoomies (round the edges of the screen flat out, dropping shots inwards);
   *    then it sits down to wash a paw, and is easier to hurt for a moment.
   */
  spawnGenba(w, base) {
    const g = { kind: 'genba', state: 'enter', t: 0, stage: 1, phase: 0, step: 0, timer: 1.4, parts: [], awake: false, defeated: false, act: null, beams: [], spinners: [], marks: [], hook: null, cat: null, rubble: null, take: { body: 1 } };
    const body = this.pool.spawn('tower_0', w.x, -150, { ...base, role: 'body', group: g, hp: GENBA.hp, maxHp: GENBA.hp, radius: 24, flashTint: 0x303030, segs: [{ x: 0, y: 0, r: 26 }, { x: 0, y: 0, r: 26 }, { x: 0, y: 0, r: 26 }] });
    body.setDepth(DEPTH.air - 0.12);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = GENBA.hp;
    // the cat up on the roof, working (only to look at while the tower stands)
    g.hatOut = false;
    if (body.texture.has('neko_stand')) g.cat = this.segPool.spawn('neko_stand', w.x, -200).setDepth(DEPTH.air - 0.11);
    g.catX = 0;
    this.bossGroup = g;
    return body;
  },

  updateGenba(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.genbaBeams(g, dt);
    this.genbaSpinners(g, dt);
    this.genbaMarks(g, dt);
    if (g.hook) this.genbaHook(g, dt);
    if (g.state === 'enter') {
      e.y += Math.max(12, (GENBA.home - e.y) * 1.3) * dt;
      if (e.y >= GENBA.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        s.cameras.main.shake(300, 0.006);
      }
      return this.genbaPose(g, dt);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < GENBA.phase[0] && !g.act) {
      Object.assign(g, { phase: 0, step: 0 });
      this.phaseBreak(g, e.x, e.y, 2, 'NAMAZU SIĘ BUDZI');
      this.genbaQuake(g);
    } else if (g.stage === 2 && left < GENBA.phase[1] && !g.act) {
      Object.assign(g, { phase: 0, step: 0 });
      this.phaseBreak(g, e.x, e.y, 3, 'ZAWALENIE');
      this.genbaCollapse(g);
    }
    g.take.body = g.act?.kind === 'nap' ? GENBA.nap.take : 1;
    if (g.act) this.genbaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['bolts', 'beams', 'spanner', 'hook'], ['quake', 'beams', 'bolts', 'fissure'], ['pounce', 'scratch', 'hat', 'zoomies', 'nap']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    this.genbaPose(g, dt);
  },

  genbaDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
  },

  /** Where the cat is (on the roof while the tower stands, the body itself after). */
  genbaCat(g) {
    return g.stage >= 3 ? g.body : g.cat ?? g.body;
  },

  genbaAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const c = this.genbaCat(g);
    a.t += dt;
    switch (a.kind) {
      case 'bolts':
        // a fistful of bolts, flung in a fan (the arm back, then over)
        if (a.t > a.step * 0.45) {
          a.step++;
          g.throwT = 0.4;
          if (this.canFire(g.body)) s.time.delayedCall(150, () => !g.defeated && this.canFire(g.body) && Array.from({ length: 7 }, (_, i) => b.shot('eb_pearl', c.x + 10, c.y - 8, this.aimAt(c, 10, -8) + (i / 6 - 0.5) * 1.15, normal, 2)));
        }
        if (a.step >= 3) this.genbaDone(g);
        break;
      case 'spanner':
        if (a.t > a.step * 0.5) {
          a.step++;
          g.throwT = 0.4;
          s.time.delayedCall(150, () => !g.defeated && this.genbaSpin(g, 'spanner', c.x + 10, c.y - 10));
        }
        if (a.step >= 2) this.genbaDone(g, 1.4);
        break;
      case 'hat':
        if (a.step === 0) {
          a.step = 1;
          g.throwT = 0.4;
          this.genbaSpin(g, 'hardhat', c.x, c.y - 26);
          g.hatOut = true;
          s.fx.text(c.x, c.y - 40, 'NYA!', 0.8, 0xffe080);
        }
        if (a.t > 1.6) this.genbaDone(g, 0.6);
        break;
      case 'beams':
        // the crane drops beams where the player is and round it, one after another
        if (a.t > a.step * (g.stage >= 2 ? 0.28 : 0.42)) {
          a.step++;
          const pl = s.player;
          const x = Phaser.Math.Clamp(a.step === 1 ? pl.x : pl.x + (Math.random() - 0.5) * 110, 10, VIEW.width - 10);
          const y = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 40, s.H * 0.4, s.H - 20);
          this.genbaBeam(g, x, y);
        }
        if (a.step >= (g.stage >= 2 ? 5 : 3)) this.genbaDone(g, 1);
        break;
      case 'hook':
        if (!g.hook && a.step === 0) {
          a.step = 1;
          if (g.body.texture.has('crane_hook')) g.hook = { t: 0, spr: this.segPool.spawn('crane_hook', 90, -30).setDepth(DEPTH.air + 0.04), side: Math.random() < 0.5 ? -1 : 1 };
        }
        if (!g.hook) this.genbaDone(g, 0.8);
        break;
      case 'quake':
        if (a.step === 0) {
          a.step = 1;
          this.genbaQuake(g);
        }
        if (a.t > 0.9) this.genbaDone(g, 0.3);
        break;
      case 'fissure':
        // a crack runs across the ground at the player, mud spurting up along it zone by zone
        if (a.step === 0) {
          a.step = 1;
          const pl = s.player;
          const x0 = Math.random() < 0.5 ? 6 : VIEW.width - 6;
          const y0 = s.H * (0.35 + Math.random() * 0.3);
          const ang = Math.atan2(pl.y - y0, pl.x - x0);
          for (let i = 0; i < GENBA.fissure.n; i++) {
            const x = x0 + Math.cos(ang) * GENBA.fissure.gap * i;
            const y = y0 + Math.sin(ang) * GENBA.fissure.gap * i;
            if (x < 4 || x > VIEW.width - 4 || y > s.H - 4) break;
            s.time.delayedCall(i * 110, () => !g.defeated && b.zone(x, y, 10, { warn: 0.75, live: 0.45, kind: 'mud' }));
          }
          s.cameras.main.shake(400, 0.004);
        }
        if (a.t > 1.6) this.genbaDone(g, 0.6);
        break;
      case 'pounce':
        this.genbaPounce(g, a, dt);
        break;
      case 'scratch':
        this.genbaScratch(g, a, dt);
        break;
      case 'zoomies':
        this.genbaZoomies(g, a, dt);
        break;
      case 'nap':
        // it sits down and washes a paw: a moment to hit it harder
        if (a.step === 0) {
          a.step = 1;
          s.fx.text(c.x, c.y - 44, 'PERO PERO...', 0.9, 0xffe0b0);
        }
        g.body.x += (90 - g.body.x) * Math.min(1, dt * 2);
        g.body.y += (GENBA.home - g.body.y) * Math.min(1, dt * 2);
        if (a.t > GENBA.nap.dur) this.genbaDone(g, 0.4);
        break;
      default:
        this.genbaDone(g);
    }
  },

  /** The ground shakes: the catfish under it. */
  genbaQuake(g) {
    const s = this.scene;
    s.cameras.main.shake(700, 0.009);
    s.fx.text(VIEW.width / 2, s.H * 0.5, 'GOTO GOTO GOTO!', 1.2, 0xd8c890);
    s.sfx.explode('m');
  },

  /** The tower comes down: dust, rubble left at its foot; the cat jumps down, furious. */
  genbaCollapse(g) {
    const s = this.scene;
    const e = g.body;
    s.cameras.main.shake(900, 0.012);
    for (let k = 0; k < 16; k++) s.time.delayedCall(k * 60, () => s.fx.explode(e.x + (Math.random() - 0.5) * 60, e.y + (Math.random() - 0.5) * 80, k % 3 ? 's' : 'm'));
    if (e.texture.has('tower_rubble')) g.rubble = this.segPool.spawn('tower_rubble', e.x, e.y).setDepth(DEPTH.ground + 0.6);
    if (g.cat) {
      this.segPool.kill(g.cat);
      g.cat = null;
    }
    // (the cracks it showed were the tower's)
    for (const w of e.wounds ?? []) this.woundPool.kill(w);
    e.wounds = null;
    e.setFrame('neko_hiss');
    e.setScale(e.base * GENBA.catScale);
    e.radius = 16;
    e.segs = [];
    e.y = GENBA.home - 6;
    s.fx.text(e.x, e.y - 40, 'FSSHHH!', 1, 0xff9a60);
    g.hatOut = false;
  },

  /**
   * Pounces, three in a row: it crouches, rump wiggling and eyes wide (the longer the first time), springs at where
   * the player was, lands with a swipe (a ring of claws, dust); then trots back up.
   */
  genbaPounce(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const P = GENBA.pounce;
    a.phase ??= 'aim';
    a.n ??= 0;
    const aim = a.n === 0 ? P.aim : P.again;
    if (a.phase === 'aim') {
      const pl = s.player;
      if (a.t < aim * 0.7) Object.assign(a, { tx: Phaser.Math.Clamp(pl.x, 16, VIEW.width - 16), ty: Phaser.Math.Clamp(pl.y, s.H * 0.3, s.H - 30) });
      if (a.t === dt || a.t < dt * 1.5) s.fx.text(e.x, e.y - 44, '...!', 0.6, 0xffe080);
      if (a.t > aim) Object.assign(a, { phase: 'go', t: 0, x0: e.x, y0: e.y, d: Math.hypot(a.tx - e.x, a.ty - e.y) });
    } else if (a.phase === 'go') {
      const k = Math.min(1, (a.t * P.speed) / Math.max(1, a.d));
      e.x = a.x0 + (a.tx - a.x0) * k;
      e.y = a.y0 + (a.ty - a.y0) * k - Math.sin(k * Math.PI) * 18;
      if (k >= 1) {
        s.cameras.main.shake(150, 0.005);
        for (const sx of [-1, 1]) s.fx.puff('wisp_s_1', e.x + sx * 12, e.y + 20, 0.4);
        Object.assign(a, { phase: 'land', t: 0 });
      }
    } else if (a.phase === 'land') {
      if (a.t > 0.12 && !a.swiped) {
        a.swiped = true;
        s.bullets.ring(e.x, e.y, 10, Math.random() * TAU, slow);
      }
      if (a.t > 0.4) {
        a.n++;
        if (a.n < P.n) Object.assign(a, { phase: 'aim', t: 0, swiped: false });
        else Object.assign(a, { phase: 'back', t: 0 });
      }
    } else {
      e.x += (90 - e.x) * Math.min(1, dt * 3);
      e.y += (GENBA.home - 6 - e.y) * Math.min(1, dt * 3);
      if (a.t > 1) this.genbaDone(g, 0.5);
    }
  },

  /** The claw swipe: a paw raised (claws out), then three lines of shots torn across where the player is. */
  genbaScratch(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    if (a.step === 0) {
      a.step = 1;
      a.x = Phaser.Math.Clamp(s.player.x, 30, VIEW.width - 30);
      a.y = Phaser.Math.Clamp(s.player.y - 10, s.H * 0.4, s.H - 40);
      s.fx.text(e.x, e.y - 44, 'NYAAA!', 0.9, 0xff9a60);
    }
    if (a.step === 1 && a.t > GENBA.scratch.warn) {
      a.step = 2;
      // the claw marks themselves, big across the screen; along each, a row of shots flying out from it
      if (e.texture.has('claws')) {
        const m = this.segPool.spawn('claws', a.x, a.y).setDepth(DEPTH.ground + 0.7);
        g.marks.push({ spr: m.setScale(m.base * 4.4), t: 0 });
      }
      const ux = 40 / Math.hypot(40, 44);
      const uy = 44 / Math.hypot(40, 44);
      for (let k = -1; k <= 1; k++)
        for (let i = -4; i <= 4; i++) {
          const x = a.x + ux * i * 11 + k * 13;
          const y = a.y + uy * i * 11 - k * 6;
          const out = Math.atan2(ux, -uy) + (i % 2 ? Math.PI : 0);
          s.bullets.fire(x, y, out, slow * 0.8);
        }
      s.cameras.main.shake(120, 0.004);
    }
    if (a.t > GENBA.scratch.warn + 0.6) this.genbaDone(g, 0.6);
  },

  /** The zoomies: off it goes round the edges of the screen flat out, dropping shots in towards the middle. */
  genbaZoomies(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const Z = GENBA.zoom;
    const x0 = Z.inset;
    const x1 = VIEW.width - Z.inset;
    const y0 = GENBA.home - 6;
    const y1 = s.H - 34;
    const corners = [[x0, y0], [x0, y1], [x1, y1], [x1, y0], [90, y0]];
    if (a.step === 0) {
      a.step = 1;
      a.leg = 0;
      a.fire = 0.2;
      s.fx.text(e.x, e.y - 44, 'ZUUUM!', 1, 0xffe080);
    }
    if (a.t < 0.45) return; // (a moment of wide eyes and a twitching tail first: see the pose)
    const [tx, ty] = corners[a.leg];
    const d = Math.hypot(tx - e.x, ty - e.y);
    const step = Z.speed * dt;
    if (d <= step) {
      e.x = tx;
      e.y = ty;
      a.leg++;
      if (a.leg >= corners.length) return this.genbaDone(g, 0.5);
    } else {
      e.x += ((tx - e.x) / d) * step;
      e.y += ((ty - e.y) / d) * step;
    }
    if (Math.random() < dt * 20) s.fx.puff('wisp_s_1', e.x + (Math.random() - 0.5) * 10, e.y + 18, 0.35);
    if ((a.fire -= dt) <= 0 && this.canFire(e)) {
      a.fire = 0.14;
      s.bullets.fire(e.x, e.y, Math.atan2(s.H * 0.62 - e.y, 90 - e.x) + (Math.random() - 0.5) * 0.4, slow);
    }
  },

  /** A beam: its shadow growing on the ground as it falls, then it lands, shatters into shards and lies a moment. */
  genbaBeam(g, x, y) {
    if (!g.body.texture.has('ibeam')) return;
    const spr = this.segPool.spawn('ibeam', x, -60).setDepth(DEPTH.air + 0.03).setVisible(false);
    const shadow = g.body.texture.has('beam_shadow') ? this.segPool.spawn('beam_shadow', x, y).setDepth(DEPTH.ground + 0.6).setAlpha(0) : null;
    g.beams.push({ spr, shadow, x, y, t: 0, landed: false });
  },

  genbaBeams(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const bm of g.beams) {
      bm.t += dt;
      const warn = GENBA.beamWarn;
      if (bm.t < warn) {
        // the shadow: faint and wide at first, darker and tighter as the beam comes down
        const k = bm.t / warn;
        const pulse = 0.85 + Math.sin(bm.t * (14 + k * 18)) * 0.15; // (beating faster as it comes)
        bm.shadow?.setAlpha((0.45 + k * 0.55) * pulse).setScale(bm.shadow.base * (1.5 - k * 0.5), bm.shadow.base * (1.12 - k * 0.12));
      } else if (!bm.landed) {
        const k = Math.min(1, (bm.t - warn) / 0.22);
        bm.spr.setVisible(true).setPosition(bm.x, -60 + (bm.y + 60) * k * k);
        if (k >= 1) {
          bm.landed = true;
          bm.left = 0.8;
          if (bm.shadow) this.segPool.kill(bm.shadow);
          bm.shadow = null;
          s.cameras.main.shake(100, 0.003);
          s.fx.shards(bm.x, bm.y, 8, true);
          for (const sx of [-1, 1]) s.fx.puff('wisp_s_1', bm.x + sx * 6, bm.y + 18, 0.4);
          s.fx.text(bm.x, bm.y - 26, 'GAN!', 0.5, 0xffffff);
          if (pl.alive && Math.abs(pl.x - bm.x) < 5 && Math.abs(pl.y - bm.y) < 21) pl.hit();
          const off = Math.random() * TAU;
          for (let i = 0; i < 6; i++) s.bullets.shot('eb_pearl', bm.x, bm.y + (i % 2 ? -12 : 12), off + (i / 6) * TAU, slow * 0.9, 2);
        }
      } else if ((bm.left -= dt) <= 0) {
        this.segPool.kill(bm.spr);
        continue;
      } else bm.spr.setAlpha(Math.min(1, bm.left * 2));
      g.beams[n++] = bm;
    }
    g.beams.length = n;
  },

  /** The claw marks fading off the ground. */
  genbaMarks(g, dt) {
    let n = 0;
    for (const m of g.marks) {
      m.t += dt;
      if (m.t > 0.9) {
        this.segPool.kill(m.spr);
        continue;
      }
      m.spr.setAlpha(m.t < 0.1 ? m.t * 10 : 1 - (m.t - 0.1) / 0.8);
      g.marks[n++] = m;
    }
    g.marks.length = n;
  },

  /** The crane's hook: it comes down on its cable at one side first, then swings across; touching it is a crash. */
  genbaHook(g, dt) {
    const s = this.scene;
    const h = g.hook;
    h.t += dt;
    const px = 90;
    const py = -30;
    const len = s.H * 0.55;
    const warn = 0.8;
    const k = Math.max(0, h.t - warn) / GENBA.swing.dur;
    const ang = DOWN + h.side * GENBA.swing.reach * Math.cos(k * Math.PI * 2.5);
    let x = px + Math.cos(ang) * len;
    let y = py + Math.sin(ang) * len;
    if (h.t < warn) {
      // lowered into place at its starting side, the cable paying out
      const sa = DOWN + h.side * GENBA.swing.reach;
      const q = h.t / warn;
      x = px + Math.cos(sa) * len;
      y = -30 + (py + Math.sin(sa) * len + 30) * (1 - (1 - q) ** 2);
      h.spr.setPosition(x, y);
      this.tele.lineStyle(1, 0x2a2a30, 0.9);
      this.tele.lineBetween(x, -10, x, y - 10);
      return;
    }
    h.spr.setPosition(x, y);
    this.tele.lineStyle(1, 0x2a2a30, 0.9);
    this.tele.lineBetween(px, py, x, y - 10);
    const pl = s.player;
    if (pl.alive && Math.hypot(pl.x - x, pl.y - y - 4) < 10) pl.hit();
    if (k >= 1) {
      this.segPool.kill(h.spr);
      g.hook = null;
    }
  },

  /** A spanner (or its hard hat) thrown in a loop out at the player and back (a boomerang); it hurts. */
  genbaSpin(g, kind, x, y) {
    const frame = kind === 'hardhat' ? 'hardhat_0' : 'spanner_0';
    if (!g.body.texture.has(frame)) return;
    const pl = this.scene.player;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.spinners.push({ spr, kind, x0: x, y0: y, tx: pl.x, ty: pl.y, t: 0, dur: kind === 'hardhat' ? 1.6 : 1.3, side: Math.random() < 0.5 ? -1 : 1 });
  },

  genbaSpinners(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const sp of g.spinners) {
      sp.t += dt;
      const k = Math.min(1, sp.t / sp.dur);
      // out to the player's spot and back, bowed to one side
      const out = Math.sin(k * Math.PI);
      const home = this.genbaCat(g);
      const bx = sp.x0 + (home.x - sp.x0) * k;
      const by = sp.y0 + (home.y - sp.y0) * k;
      const x = bx + (sp.tx - bx) * out + sp.side * Math.sin(k * Math.PI * 2) * 30;
      const y = by + (sp.ty - by) * out;
      sp.spr.setPosition(x, y);
      sp.spr.setFrame(sp.kind === 'hardhat' ? `hardhat_${Math.floor(sp.t * 8) % 2}` : `spanner_${Math.floor(sp.t * 16) % 4}`);
      if (pl.alive && Math.hypot(pl.x - x, pl.y - y) < (sp.kind === 'hardhat' ? 9 : 6)) pl.hit();
      if (k >= 1) {
        this.segPool.kill(sp.spr);
        if (sp.kind === 'hardhat') g.hatOut = false; // (back on its head)
        continue;
      }
      g.spinners[n++] = sp;
    }
    g.spinners.length = n;
  },

  /** The tower (its lamp blinking; leaning in phase 2), the cat on its roof at work, or the cat itself in phase 3. */
  genbaPose(g, dt) {
    const e = g.body;
    if (g.throwT > 0) g.throwT -= dt;
    const blink = g.t % 3.1 < 0.12;
    const idle = Math.floor(g.t * 1.6) % 2 ? '_stand1' : '_stand';
    const throwing = g.throwT > 0 ? (g.throwT > 0.25 ? '_throw0' : '_throw1') : null;
    if (g.stage < 3) {
      const frame = g.stage === 2 ? 'tower_lean' : Math.floor(g.t * 2) % 2 ? 'tower_1' : 'tower_0';
      if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
      if (g.state === 'fight') e.x = 90 + (g.stage === 2 ? Math.sin(g.t * 1.3) * 1.5 : 0);
      if (g.cat) {
        g.catX = -6 + Math.sin(g.t * 0.7) * 12;
        g.cat.setPosition(e.x + g.catX + (g.stage === 2 ? 4 : 0), e.y + ROOF - (g.act ? 0 : Math.abs(Math.sin(g.t * 5)) * 1));
        const cf = 'neko' + (throwing ?? (blink ? '_blink' : idle));
        if (g.cat.frame.name !== cf && g.cat.texture.has(cf)) g.cat.setFrame(cf);
      }
      const [a, b, c] = e.segs;
      Object.assign(a, { x: e.x, y: e.y - 28 });
      Object.assign(b, { x: e.x, y: e.y + 4 });
      Object.assign(c, { x: e.x, y: e.y + 34 });
    } else {
      const a = g.act;
      let p;
      if (throwing) p = throwing;
      else if (a?.kind === 'pounce') p = a.phase === 'aim' ? (Math.floor(a.t * 10) % 2 ? '_crouch1' : '_crouch0') : a.phase === 'go' ? '_leap' : a.phase === 'land' ? '_land' : Math.floor(g.t * 8) % 2 ? '_run0' : '_run1';
      else if (a?.kind === 'scratch') p = a.step < 2 ? '_scratch0' : '_scratch1';
      else if (a?.kind === 'zoomies') p = a.t < 0.45 ? '_crouch0' : Math.floor(g.t * 12) % 2 ? '_run0' : '_run1';
      else if (a?.kind === 'nap') p = '_nap';
      else p = blink ? '_blink' : '_hiss';
      const frame = 'neko' + p + (g.hatOut ? '_bare' : '');
      if (e.frame.name !== frame && e.texture.has(frame)) e.setFrame(frame);
    }
  },

  genbaCleanup(g) {
    for (const bm of g.beams) {
      this.segPool.kill(bm.spr);
      if (bm.shadow) this.segPool.kill(bm.shadow);
    }
    for (const sp of g.spinners) this.segPool.kill(sp.spr);
    for (const m of g.marks) this.segPool.kill(m.spr);
    for (const o of [g.hook?.spr, g.cat, g.rubble]) if (o) this.segPool.kill(o);
    g.beams = [];
    g.spinners = [];
    g.marks = [];
    g.hook = null;
    g.cat = null;
    g.rubble = null;
  },
};
