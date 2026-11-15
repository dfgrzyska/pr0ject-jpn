// Random encounter 4 (ex4): the endless cat. Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The endless cat (NAGAI): life (its head takes the hits), the phases' thresholds, how many body segments trail
 * behind it and how far apart, how much a hit on the body counts, how fast it swims and turns, the chase, the coil round the player (start and end
 * radius, seconds), the yarn balls.
 */
export const NAGAI = {
  hp: 1850,
  phase: [0.66, 0.33],
  segs: 120,
  gap: 4.5,
  scale: 1.35,
  speed: [95, 120],
  turn: [2.4, 3.2],
  chase: 3.2,
  coil: { r0: 64, r1: 26, dur: 5, w: 2.4 },
  yarn: 6,
  rest: { every: [5.5, 8], dur: 1.6, take: 2 }, // after a meow it stops, stretches its head down: the head takes double
  bodyTake: 0.35, // a hit on its body: this much of a hit on its head (the head is the weak point, not the only one)
};

export const nagai = {
  /**
   * A cat whose body has no end swims in and out of the screen over Fuji, its head the only part that can be hurt;
   * its body (round furry segments, paws now and then, thinning into smoke far behind) stops shots and hurts to
   * touch. Three phases:
   * 1. KOT BEZ KOŃCA: it weaves across the screen in long S-curves, out at one side and back in at another,
   *    coughing up hairballs at the player and meowing (rings);
   * 2. MRUCZENIE: it purrs: waves of shots roll out sideways from its whole body; now and then it comes for the
   *    player, head first, for a few seconds;
   * 3. KŁĘBEK: it coils itself round the player in a tightening spiral (get out through the gap before it closes),
   *    and bats balls of yarn about that bounce off the edges.
   */
  spawnNagai(w, base) {
    const g = { kind: 'nagai', state: 'enter', t: 0, stage: 1, timer: 1, parts: [], awake: false, defeated: false, mode: 'swim', modeT: 0, restAt: 5, wp: null, heading: DOWN, trail: [], segs: [], yarns: [], fire: 1.2, take: { body: 1 } };
    const head = this.pool.spawn('nagai_head_0', w.x, -30, { ...base, role: 'body', group: g, hp: NAGAI.hp, maxHp: NAGAI.hp, radius: 13 });
    head.setDepth(DEPTH.air - 0.05).setScale(head.scaleX * NAGAI.scale * 1.15); // (over the 540 px art's own scale)
    head.base0 = head.scaleX;
    g.head = g.body = head;
    g.parts.push(head);
    g.maxTotal = NAGAI.hp;
    if (head.texture.has('nagai_seg_a'))
      for (let i = 0; i < NAGAI.segs; i++) {
        const frame = i % 12 === 5 ? 'nagai_seg_paws' : i % 2 ? 'nagai_seg_b' : 'nagai_seg_a';
        const sg = this.segPool.spawn(frame, w.x, -40 - i * NAGAI.gap).setDepth(DEPTH.air - 0.06 - i * 0.0001);
        g.segs.push(sg.setScale(sg.scaleX * NAGAI.scale));
      }
    // the trail the body follows: where the head has been (the body starts strung out above the screen)
    for (let i = 0; i < NAGAI.segs * NAGAI.gap + 10; i++) g.trail.push([w.x, -30 - i]);
    this.bossGroup = g;
    return head;
  },

  updateNagai(g, dt) {
    const s = this.scene;
    const h = g.head;
    g.t += dt;
    this.nagaiYarns(g, dt);
    const left = h.hp / h.maxHp;
    if (g.state === 'enter') {
      this.nagaiSteer(g, dt, 90, s.H * 0.3, NAGAI.speed[0], NAGAI.turn[0]);
      if (h.y > 40) Object.assign(g, { state: 'fight', awake: true });
    } else {
      if (g.stage === 1 && left < NAGAI.phase[0]) {
        this.phaseBreak(g, h.x, h.y, 2, 'MRUCZENIE');
        Object.assign(g, { mode: 'swim', modeT: 0, restAt: g.t + 4 });
        h.setScale(h.base0);
      } else if (g.stage === 2 && left < NAGAI.phase[1]) {
        this.phaseBreak(g, h.x, h.y, 3, 'KŁĘBEK');
        Object.assign(g, { mode: 'swim', modeT: 0, restAt: g.t + 4 });
        h.setScale(h.base0);
      }
      this.nagaiMove(g, dt);
      this.nagaiAttack(g, dt);
    }
    this.nagaiBody(g);
    this.nagaiTouch(g);
  },

  /** Turn towards (tx, ty) at no more than `turn` rad/s, and swim on at `speed`. */
  nagaiSteer(g, dt, tx, ty, speed, turn) {
    const h = g.head;
    const want = Math.atan2(ty - h.y, tx - h.x);
    g.heading = Phaser.Math.Angle.RotateTo(g.heading, want, turn * dt);
    h.x += Math.cos(g.heading) * speed * dt;
    h.y += Math.sin(g.heading) * speed * dt;
    h.setRotation(g.heading - DOWN);
  },

  /** Where it goes: weaving in and out of the screen, chasing the player, coiling round them. */
  nagaiMove(g, dt) {
    const s = this.scene;
    const h = g.head;
    const pl = s.player;
    const fast = g.stage > 1 ? 1 : 0;
    g.modeT += dt;
    if (g.mode === 'swim') {
      // waypoints: long S-curves from side to side over the top of the screen, never leaving it (its head is what
      // the player is after: out of sight it could not be hurt at all)
      if (!g.wp || Math.hypot(g.wp[0] - h.x, g.wp[1] - h.y) < 24) {
        g.wpn = (g.wpn ?? 0) + 1;
        const side = g.wpn % 2 ? -1 : 1;
        g.wp = [VIEW.width / 2 + side * (30 + Math.random() * (VIEW.width / 2 - 50)), s.H * (0.12 + Math.random() * 0.42)];
      }
      this.nagaiSteer(g, dt, g.wp[0], g.wp[1], NAGAI.speed[fast], NAGAI.turn[fast]);
      // every so often it stops for a meow (see 'rest'), as long as its head is well on the screen
      if (g.t > g.restAt && h.x > 20 && h.x < VIEW.width - 20 && h.y > 20 && h.y < s.H * 0.55) {
        Object.assign(g, { mode: 'rest', modeT: 0, rot0: h.rotation });
        this.nagaiMeow(g);
        return;
      }
      // phase 2: now and then it comes for the player; phase 3: it coils round them
      if (g.stage === 2 && g.modeT > 6 && this.canFire(h)) Object.assign(g, { mode: 'chase', modeT: 0 });
      if (g.stage === 3 && g.modeT > 5 && h.y > 0 && h.y < s.H * 0.6 && h.x > 0 && h.x < VIEW.width) Object.assign(g, { mode: 'coil', modeT: 0, cx: Phaser.Math.Clamp(pl.x, 40, VIEW.width - 40), cy: Phaser.Math.Clamp(pl.y - 20, s.H * 0.45, s.H - 50), ang: null });
    } else if (g.mode === 'rest') {
      // the meow: it stops dead, its head swings round to look down at the player, its body (more smoke than cat
      // for a moment) lets the shots through, and the head takes double; then it swims on
      const R = NAGAI.rest;
      const k = Math.min(1, g.modeT / 0.3);
      h.setRotation(Phaser.Math.Angle.RotateTo(h.rotation, 0, 8 * dt));
      h.setScale(h.base0 * (1 + 0.07 * Math.sin(g.modeT * 14) * k));
      if (g.modeT > R.dur) {
        h.setScale(h.base0);
        Object.assign(g, { mode: 'swim', modeT: 0, restAt: g.t + R.every[g.stage > 1 ? 1 : 0] });
        g.heading = Phaser.Math.Angle.Wrap(h.rotation + DOWN);
        g.fire = Math.max(g.fire, 0.5);
      }
    } else if (g.mode === 'chase') {
      this.nagaiSteer(g, dt, pl.x, pl.y, NAGAI.speed[1] * 0.85, NAGAI.turn[1] * 0.7);
      if (g.modeT > NAGAI.chase || h.y > s.H * 0.8) Object.assign(g, { mode: 'swim', modeT: 0, wp: [h.x < 90 ? 24 : VIEW.width - 24, s.H * 0.18] });
    } else if (g.mode === 'coil') {
      const C = NAGAI.coil;
      if (g.ang === null) {
        g.ang = Math.atan2(h.y - g.cy, h.x - g.cx);
        s.fx.text(h.x, h.y - 16, 'NYAAA~', 1, 0xffe080);
      }
      const k = Math.min(1, g.modeT / C.dur);
      const r = C.r0 + (C.r1 - C.r0) * k;
      g.ang += (C.w * C.r0 / r) * dt * 0.85;
      const tx = g.cx + Math.cos(g.ang) * r;
      const ty = g.cy + Math.sin(g.ang) * r;
      const px = h.x;
      const py = h.y;
      h.x += (tx - h.x) * Math.min(1, dt * 6);
      h.y += (ty - h.y) * Math.min(1, dt * 6);
      g.heading = Math.atan2(h.y - py, h.x - px);
      h.setRotation(g.heading - DOWN);
      if (k >= 1) Object.assign(g, { mode: 'swim', modeT: 0, wp: [g.cx, s.H * 0.12] });
    }
  },

  /** What it throws: hairballs and meows; the purr off its body; the yarn. */
  nagaiAttack(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const h = g.head;
    g.take = { body: g.mode === 'rest' ? NAGAI.rest.take : 1 };
    if ((g.fire -= dt) > 0 || !this.canFire(h) || g.gate > 0 || g.mode === 'rest') return;
    if (g.stage === 1) {
      for (let i = -1; i <= 1; i++) b.fire(h.x, h.y, this.aimAt(h) + i * 0.22, normal, true);
      g.fire = 0.9;
    } else if (g.stage === 2) {
      // the purr: a wave of shots out of both sides of every tenth segment on the screen
      g.n = (g.n ?? 0) + 1;
      if (g.n % 2) {
        g.purrT = g.t + 0.8;
        let k = 0;
        g.segs.forEach((sg, i) => {
          if (i % 10 !== 5 || sg.x < 4 || sg.x > VIEW.width - 4 || sg.y < 4 || sg.y > s.H * 0.7 || k > 8) return;
          k++;
          for (const sx of [-1, 1]) b.fire(sg.x, sg.y, sg.rotation + (sx > 0 ? 0 : Math.PI), slow);
        });
      } else for (let i = -1; i <= 1; i++) b.fire(h.x, h.y, this.aimAt(h) + i * 0.25, normal, true);
      g.fire = 1.1;
    } else {
      // yarn: a ball batted out, bouncing about the screen; hairballs between
      g.n = (g.n ?? 0) + 1;
      if (g.n % 3 === 0 && g.yarns.length < NAGAI.yarn) this.nagaiYarn(g);
      else if (g.mode !== 'coil') for (let i = -1; i <= 1; i++) b.fire(h.x, h.y, this.aimAt(h) + i * 0.25, normal, true);
      g.fire = g.mode === 'coil' ? 0.6 : 0.85;
    }
  },

  /** The meow that opens its rest: a ring of shots off its head (thinner once it is purring or coiling). */
  nagaiMeow(g) {
    const s = this.scene;
    const h = g.head;
    if (this.canFire(h)) s.bullets.ring(h.x, h.y, g.stage === 1 ? 12 : 9, Math.random() * TAU, slow);
    g.meowT = g.t + NAGAI.rest.dur;
    s.fx.text(h.x, h.y - 16, 'MIAU!', 0.9, 0xffe080);
  },

  nagaiYarn(g) {
    const h = g.head;
    const frame = Math.random() < 0.5 ? 'yarn_r' : 'yarn_b';
    if (!h.texture.has(frame)) return;
    const a = this.aimAt(h) + (Math.random() - 0.5) * 1.2;
    g.yarns.push({ spr: this.segPool.spawn(frame, h.x, h.y).setDepth(DEPTH.air + 0.03), vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, t: 0, bounces: 0 });
  },

  nagaiYarns(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const y of g.yarns) {
      y.t += dt;
      y.spr.x += y.vx * dt;
      y.spr.y += y.vy * dt;
      y.spr.rotation += (y.vx / 60) * dt * 4;
      // it bounces off the sides and the top, and off the bottom twice before it rolls away
      if ((y.spr.x < 6 && y.vx < 0) || (y.spr.x > VIEW.width - 6 && y.vx > 0)) y.vx *= -1;
      if (y.spr.y < 6 && y.vy < 0) y.vy *= -1;
      if (y.spr.y > s.H - 6 && y.vy > 0 && y.bounces < 2) {
        y.vy *= -1;
        y.bounces++;
      }
      if (pl.alive && Math.hypot(pl.x - y.spr.x, pl.y - y.spr.y) < 7) pl.hit();
      if (y.spr.y > s.H + 20 || y.t > 12) {
        this.segPool.kill(y.spr);
        continue;
      }
      g.yarns[n++] = y;
    }
    g.yarns.length = n;
  },

  /** The body follows the head's trail; far behind, it thins into smoke. Its face follows its mood. */
  nagaiBody(g) {
    const h = g.head;
    const tr = g.trail;
    const last = tr[0];
    // keep the trail as points a pixel apart (filling in however far the head went this frame)
    const d = Math.hypot(h.x - last[0], h.y - last[1]);
    if (d >= 1) {
      const n = Math.min(40, Math.floor(d));
      for (let k = 1; k <= n; k++) tr.unshift([last[0] + ((h.x - last[0]) * k) / d, last[1] + ((h.y - last[1]) * k) / d]);
      if (tr.length > NAGAI.segs * NAGAI.gap + 20) tr.length = NAGAI.segs * NAGAI.gap + 20;
    }
    const n = g.segs.length;
    g.segs.forEach((sg, i) => {
      const k = Math.min(tr.length - 2, Math.round((i + 1) * NAGAI.gap));
      const [x, y] = tr[k];
      const [x2, y2] = tr[k + 1];
      sg.setPosition(x, y).setRotation(Math.atan2(y - y2, x - x2) - DOWN);
      sg.setAlpha(i > n * 0.7 ? Math.max(0, 1 - (i - n * 0.7) / (n * 0.3)) : 1);
    });
    // the solid part of the body (every other segment is enough) can be shot, for bodyTake of a hit on the head
    const resting = g.mode === 'rest';
    if (resting) for (const sg of g.segs) sg.setAlpha(sg.alpha * 0.55);
    const segsN = resting ? 0 : Math.floor((n * 0.8) / 2);
    if (h.shotSegs) h.shotSegs.length = Math.min(h.shotSegs.length, segsN);
    h.shotSegs ??= [];
    for (let j = 0; j < segsN; j++) {
      const sg = g.segs[1 + j * 2];
      const c = (h.shotSegs[j] ??= { x: 0, y: 0, r: 8, take: NAGAI.bodyTake });
      c.x = sg.x;
      c.y = sg.y;
    }
    const mood = g.t < (g.meowT ?? 0) ? 'nagai_head_meow' : g.t < (g.purrT ?? 0) || g.mode === 'coil' ? 'nagai_head_purr' : 'nagai_head_0';
    if (h.texture.has(mood) && h.frame.name !== mood) h.setFrame(mood);
  },

  /** Its body hurts to touch (the part that has not gone to smoke). */
  nagaiTouch(g) {
    const pl = this.scene.player;
    if (!pl.alive) return;
    const n = g.segs.length;
    for (let i = 2; i < n * 0.8; i++) {
      const sg = g.segs[i];
      if (Math.abs(pl.x - sg.x) < 7 && Math.abs(pl.y - sg.y) < 7) {
        pl.hit();
        return;
      }
    }
  },

  /** (Its body no longer just eats the player's shots: it takes a share of them, see nagaiBody.) */
  nagaiBlock() {
    return false;
  },

  nagaiCleanup(g) {
    for (const sg of g.segs) this.segPool.kill(sg);
    for (const y of g.yarns) this.segPool.kill(y.spr);
    g.segs = [];
    g.yarns = [];
  },
};
