// Random encounter 3 (ex3): the construction site cat and its tower. Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The site (GENBA): life (the tower, then the cat), the tower's place, the phases' thresholds, the beams (warning,
 * fall), the crane hook's swing (seconds, reach), the fissure (zones, spacing), the cat's pounce (aim, speed) and
 * how much bigger the cat is shown once it comes down to fight.
 */
export const GENBA = {
  hp: 2500,
  home: 100,
  phase: [0.66, 0.33],
  beamWarn: 0.9,
  swing: { dur: 4.2, reach: 1.05 },
  fissure: { n: 9, gap: 17 },
  pounce: { aim: 0.8, speed: 300 },
  catScale: 1.5,
};

export const genba = {
  /**
   * A tower going up on a building site in an old Edo street, a ginger cat in a yellow hard hat working on top of
   * it; under the site, the giant catfish of the old prints. Three phases:
   * 1. BUDOWA W TOKU: the cat flings bolts and boomerangs its spanner; the crane drops I-beams (a red shadow
   *    first) that shatter into shards; the crane's hook swings across the screen on its cable;
   * 2. NAMAZU SIĘ BUDZI: the catfish shakes the ground: quakes, fissures running at the player and spitting mud;
   *    the tower cracks and leans, beams fall thicker;
   * 3. ZAWALENIE: the tower comes down; the cat, furious and hatless, jumps down to fight: it pounces at the
   *    player (a line shows where), throws its hard hat like a boomerang, sweeps its headlamp's beam of shots.
   */
  spawnGenba(w, base) {
    const g = { kind: 'genba', state: 'enter', t: 0, stage: 1, phase: 0, step: 0, timer: 1.4, parts: [], awake: false, defeated: false, act: null, beams: [], spinners: [], hook: null, cat: null, rubble: null, take: { body: 1 } };
    const body = this.pool.spawn('tower_0', w.x, -140, { ...base, role: 'body', group: g, hp: GENBA.hp, maxHp: GENBA.hp, radius: 20, segs: [{ x: 0, y: 0, r: 22 }, { x: 0, y: 0, r: 22 }, { x: 0, y: 0, r: 22 }] });
    body.setDepth(DEPTH.air - 0.12);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = GENBA.hp;
    // the cat up on the roof, working (only to look at while the tower stands)
    g.hatOut = false;
    if (body.texture.has('neko_0')) g.cat = this.segPool.spawn('neko_0', w.x, -200).setDepth(DEPTH.air - 0.11);
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
    if (g.act) this.genbaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['bolts', 'beams', 'spanner', 'hook'], ['quake', 'beams', 'bolts', 'fissure'], ['pounce', 'hat', 'lamp', 'fissure']][g.stage - 1];
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
        // a fistful of bolts, flung in a fan (the arm up)
        if (a.t > a.step * 0.45) {
          a.step++;
          g.throwT = 0.3;
          if (this.canFire(g.body)) for (let i = 0; i < 7; i++) b.shot('eb_pearl', c.x + 6, c.y - 4, this.aimAt(c, 6, -4) + (i / 6 - 0.5) * 1.15, normal, 2);
        }
        if (a.step >= 3) this.genbaDone(g);
        break;
      case 'spanner':
        if (a.t > a.step * 0.5) {
          a.step++;
          g.throwT = 0.3;
          this.genbaSpin(g, 'spanner', c.x - 8, c.y);
        }
        if (a.step >= 2) this.genbaDone(g, 1.4);
        break;
      case 'hat':
        if (a.step === 0) {
          a.step = 1;
          this.genbaSpin(g, 'hardhat', c.x, c.y - 10);
          g.hatOut = true;
          s.fx.text(c.x, c.y - 26, 'NYA!', 0.8, 0xffe080);
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
          if (g.body.texture.has('crane_hook')) g.hook = { t: 0, spr: this.segPool.spawn('crane_hook', 90, -20).setDepth(DEPTH.air + 0.04), side: Math.random() < 0.5 ? -1 : 1 };
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
      case 'lamp':
        // the headlamp's beam, swept from side to side: a stream of shots
        if ((a.fire = (a.fire ?? 0) - dt) <= 0 && this.canFire(g.body)) {
          a.fire = 0.06;
          const sweep = Math.sin(a.t * 2.6) * 1.1;
          b.fire(c.x, c.y - 4, DOWN + sweep, normal);
        }
        if (a.t > 2.4) this.genbaDone(g, 0.8);
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

  /** The tower comes down: dust, rubble left at its foot; the cat jumps down, hatless and furious. */
  genbaCollapse(g) {
    const s = this.scene;
    const e = g.body;
    s.cameras.main.shake(900, 0.012);
    for (let k = 0; k < 14; k++) s.time.delayedCall(k * 60, () => s.fx.explode(e.x + (Math.random() - 0.5) * 50, e.y + (Math.random() - 0.5) * 70, k % 3 ? 's' : 'm'));
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
    e.radius = 11;
    e.segs = [];
    e.y = GENBA.home + 10;
    s.fx.text(e.x, e.y - 30, 'FSSHHH!', 1, 0xff9a60);
    g.hatOut = false;
  },

  /** Phase 3: the cat crouches, a line shows where it will spring, and it pounces; then back up. */
  genbaPounce(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    a.phase ??= 'aim';
    if (a.phase === 'aim') {
      const pl = s.player;
      if (a.t < GENBA.pounce.aim * 0.7) Object.assign(a, { tx: pl.x, ty: Math.min(pl.y, s.H - 30) });
      e.x += (Math.random() - 0.5) * 1.2;
      if (Math.floor(a.t * 14) % 2) {
        this.tele.lineStyle(2, 0xff5040, 0.6);
        this.tele.lineBetween(e.x, e.y, a.tx, a.ty);
      }
      if (a.t > GENBA.pounce.aim) Object.assign(a, { phase: 'go', t: 0, x0: e.x, y0: e.y, d: Math.hypot(a.tx - e.x, a.ty - e.y) });
    } else if (a.phase === 'go') {
      const k = Math.min(1, (a.t * GENBA.pounce.speed) / Math.max(1, a.d));
      e.x = a.x0 + (a.tx - a.x0) * k;
      e.y = a.y0 + (a.ty - a.y0) * k;
      if (k >= 1) {
        s.cameras.main.shake(150, 0.004);
        Object.assign(a, { phase: 'land', t: 0 });
      }
    } else if (a.phase === 'land') {
      // a swipe where it lands: a short ring of claws
      if (a.t > 0.15 && !a.swiped) {
        a.swiped = true;
        s.bullets.ring(e.x, e.y, 8, Math.random() * TAU, slow);
      }
      if (a.t > 0.5) Object.assign(a, { phase: 'back', t: 0 });
    } else {
      e.x += (90 - e.x) * Math.min(1, dt * 2.5);
      e.y += (GENBA.home + 10 - e.y) * Math.min(1, dt * 2.5);
      if (a.t > 1.2) this.genbaDone(g, 0.6);
    }
  },

  /** A beam: its red shadow on the ground first, then it drops, shatters into shards and lies there a moment. */
  genbaBeam(g, x, y) {
    if (!g.body.texture.has('ibeam')) return;
    const spr = this.segPool.spawn('ibeam', x, -50).setDepth(DEPTH.air + 0.03).setVisible(false);
    g.beams.push({ spr, x, y, t: 0, landed: false });
  },

  genbaBeams(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const bm of g.beams) {
      bm.t += dt;
      const warn = GENBA.beamWarn;
      if (bm.t < warn) {
        if (Math.floor(bm.t * 12) % 2) {
          this.tele.lineStyle(1, 0xff5040, 0.8);
          this.tele.strokeRect(bm.x - 4.5, bm.y - 20, 9, 40);
        }
      } else if (!bm.landed) {
        const k = Math.min(1, (bm.t - warn) / 0.22);
        bm.spr.setVisible(true).setPosition(bm.x, -50 + (bm.y + 50) * k * k);
        if (k >= 1) {
          bm.landed = true;
          bm.left = 0.8;
          s.cameras.main.shake(100, 0.003);
          s.fx.shards(bm.x, bm.y, 8, true);
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

  /** The crane's hook swings across on its cable (an arc of warning first); touching it is a crash. */
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
    const x = px + Math.cos(ang) * len;
    const y = py + Math.sin(ang) * len;
    if (h.t < warn) {
      if (Math.floor(h.t * 12) % 2) {
        this.tele.lineStyle(1, 0xffe080, 0.6);
        for (let q = -1; q <= 1; q += 0.1) this.tele.lineBetween(px + Math.cos(DOWN + q * GENBA.swing.reach) * len, py + Math.sin(DOWN + q * GENBA.swing.reach) * len, px + Math.cos(DOWN + (q + 0.05) * GENBA.swing.reach) * len, py + Math.sin(DOWN + (q + 0.05) * GENBA.swing.reach) * len);
      }
      h.spr.setPosition(px + Math.cos(DOWN + h.side * GENBA.swing.reach) * len, -20);
      return;
    }
    h.spr.setPosition(x, y);
    this.tele.lineStyle(1, 0x2a2a30, 0.9);
    this.tele.lineBetween(px, py, x, y - 8);
    const pl = s.player;
    if (pl.alive && Math.hypot(pl.x - x, pl.y - y - 4) < 9) pl.hit();
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
      if (pl.alive && Math.hypot(pl.x - x, pl.y - y) < (sp.kind === 'hardhat' ? 8 : 6)) pl.hit();
      if (k >= 1) {
        this.segPool.kill(sp.spr);
        if (sp.kind === 'hardhat') g.hatOut = false; // (back on its head)
        continue;
      }
      g.spinners[n++] = sp;
    }
    g.spinners.length = n;
  },

  /** The tower (leaning in phase 2), the cat on its roof walking about (its throw), or the cat itself in phase 3. */
  genbaPose(g, dt) {
    const e = g.body;
    if (g.throwT > 0) g.throwT -= dt;
    if (g.stage < 3) {
      const frame = g.stage === 2 ? 'tower_1' : 'tower_0';
      if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
      if (g.state === 'fight') e.x = 90 + (g.stage === 2 ? Math.sin(g.t * 1.3) * 1.5 : 0);
      if (g.cat) {
        g.catX = Math.sin(g.t * 0.7) * 16;
        g.cat.setPosition(e.x + g.catX + (g.stage === 2 ? 2 : 0), e.y - 44 - Math.abs(Math.sin(g.t * 6)) * (g.act ? 0 : 1));
        const cf = g.throwT > 0 ? 'neko_1' : 'neko_0';
        if (g.cat.frame.name !== cf) g.cat.setFrame(cf);
      }
      const [a, b, c] = e.segs;
      Object.assign(a, { x: e.x, y: e.y - 24 });
      Object.assign(b, { x: e.x, y: e.y + 4 });
      Object.assign(c, { x: e.x, y: e.y + 30 });
    } else {
      const crouch = g.act?.kind === 'pounce' && g.act.phase === 'aim';
      const frame = (crouch ? 'neko_pounce' : 'neko_hiss') + (g.hatOut ? '_bare' : '');
      if (e.frame.name !== frame) e.setFrame(frame);
    }
  },

  genbaCleanup(g) {
    for (const bm of g.beams) this.segPool.kill(bm.spr);
    for (const sp of g.spinners) this.segPool.kill(sp.spr);
    for (const o of [g.hook?.spr, g.cat, g.rubble]) if (o) this.segPool.kill(o);
    g.beams = [];
    g.spinners = [];
    g.hook = null;
    g.cat = null;
    g.rubble = null;
  },
};
