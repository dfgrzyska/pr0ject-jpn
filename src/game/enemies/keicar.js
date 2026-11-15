// Random encounter 2 (ex2): the kei car. Methods of Enemies (mixed in like the cities').
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The kei car (KEI): life, its row, the phases' thresholds, the charge (aiming time, speed in phases 1 / 2-3),
 * the drift (radius, turn rate, seconds), the cones (how long they lie on the road), the rush hour (lanes as
 * shares of the screen's height, cars per lane, their spacing and speed).
 */
export const KEI = {
  hp: 2400,
  home: 70,
  phase: [0.66, 0.33],
  aim: 0.9,
  speed: [290, 340],
  donut: { r: 52, w: 2.8, dur: 3.4 }, // (small enough that the whole circle stays on the screen)
  beams: { aim: 0.8, fire: 0.6 }, // high beams: seconds of warning, seconds of fire
  slalom: { show: 0.8, speed: 165, amp: 50, wave: 55 }, // weaving down the road: warning, speed, sway, wavelength
  cone: 7,
  lanes: [0.56, 0.71, 0.86],
  cars: 4,
  gap: 62,
  carSpeed: [85, 115],
};

export const keicar = {
  /**
   * A tiny kei car comes down the old Tōkaidō, yellow plate, mint paint, headlights glaring like eyes. It is
   * small and it is furious:
   * 1. MAŁY, ALE WŚCIEKŁY: it revs, two red lines show its lane, it honks (a ring) and rams straight down the
   *    road at the player, out at the bottom and back in from the top; it flashes its high beams (two cones of
   *    light at the player, then two streams of shots down them); it slaloms down the road on a weaving line
   *    shown first, hazard lights blinking and firing to the sides; a long honk sends rings one after another;
   * 2. TUNING: spoiler, stripes, flames painted on: it drifts doughnuts round the player (shots converge on the
   *    middle), lobs traffic cones that lie on the road and come down with it (touch one and it's a crash,
   *    shoot one and it flies off), and rams twice in a row;
   * 3. KEI-TORA: it unfolds into a kei truck: the rush hour, lanes of little cars crossing the screen (an arrow
   *    across the lane first, gaps between them), and watermelons lobbed off its flatbed, bursting into seeds.
   * Its skid marks stay on the road and go by with it.
   */
  spawnKei(w, base) {
    const g = { kind: 'keicar', state: 'enter', t: 0, stage: 1, phase: 0, step: 0, timer: 1.2, parts: [], awake: false, defeated: false, x: w.x, act: null, cones: [], marks: [], traffic: [], melons: [], splats: [], skidT: 0, take: { body: 1 } };
    const body = this.pool.spawn('kei_0', w.x, -60, { ...base, role: 'body', group: g, hp: KEI.hp, maxHp: KEI.hp, radius: 13, flashTint: 0x2a2a2a, segs: [{ x: 0, y: 0, r: 12 }, { x: 0, y: 0, r: 12 }] });
    body.setDepth(DEPTH.air - 0.1);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = KEI.hp;
    this.bossGroup = g;
    return body;
  },

  /** How fast the road goes by (the far layer: the cones and the skid marks lie on it). */
  keiRoad() {
    return this.scene.stage.scroll?.far ?? 70;
  },

  updateKei(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.keiCones(g, dt);
    this.keiMarks(g, dt);
    this.keiTraffic(g, dt);
    this.keiMelons(g, dt);
    if (g.state === 'enter') {
      e.y += Math.max(20, (KEI.home - e.y) * 1.6) * dt;
      this.keiExhaust(g, dt, 1);
      if (e.y >= KEI.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 0.8 });
        s.fx.text(e.x, e.y + 30, 'PAAAP!', 1, 0xffe080);
        s.sfx.warning?.();
      }
      return this.keiPose(g);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < KEI.phase[0] && !g.act) {
      Object.assign(g, { phase: 0, step: 0 });
      this.phaseBreak(g, e.x, e.y, 2, 'TUNING!');
    } else if (g.stage === 2 && left < KEI.phase[1] && !g.act) {
      Object.assign(g, { phase: 0, step: 0 });
      this.phaseBreak(g, e.x, e.y, 3, 'KEI-TORA!');
      // the car unfolds into a truck: a bigger body, its flatbed behind
      e.segs = [{ x: 0, y: 0, r: 13 }, { x: 0, y: 0, r: 13 }, { x: 0, y: 0, r: 13 }];
    }
    if (g.act) this.keiAct(g, dt);
    else {
      // at its row: a little weave, the engine idling
      g.x += (90 + Math.sin(g.t * 0.9) * 40 - g.x) * Math.min(1, dt * 1.5);
      e.x = g.x + (Math.random() - 0.5) * 0.8;
      e.y += (KEI.home + Math.sin(g.t * 2.3) * 2 - e.y) * Math.min(1, dt * 3);
      if (e.rotation) e.setRotation(Phaser.Math.Angle.RotateTo(e.rotation, 0, dt * 6));
      this.keiExhaust(g, dt, 0.4);
      g.timer -= dt;
      if (g.timer <= 0 && this.canFire(e)) this.keiNext(g);
    }
    this.keiPose(g);
  },

  /** What it does next, by phase. */
  keiNext(g) {
    const plan = [['charge', 'beams', 'slalom', 'honk'], ['donut', 'cones', 'charge2', 'cones'], ['traffic', 'melons', 'charge', 'melons']][g.stage - 1];
    const kind = plan[g.phase++ % plan.length];
    g.act = { kind, t: 0, step: 0 };
  },

  keiDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
  },

  keiAct(g, dt) {
    const a = g.act;
    a.t += dt;
    if (a.kind === 'charge' || a.kind === 'charge2') return this.keiCharge(g, a, dt);
    if (a.kind === 'hazard') return this.keiHazard(g, a, dt);
    if (a.kind === 'beams') return this.keiBeams(g, a, dt);
    if (a.kind === 'slalom') return this.keiSlalom(g, a, dt);
    if (a.kind === 'honk') return this.keiHonk(g, a, dt);
    if (a.kind === 'donut') return this.keiDonut(g, a, dt);
    if (a.kind === 'cones') return this.keiThrowCones(g, a, dt);
    if (a.kind === 'traffic') return this.keiRush(g, a, dt);
    if (a.kind === 'melons') return this.keiThrowMelons(g, a, dt);
    this.keiDone(g);
  },

  /**
   * The ram: it lines up with the player and revs, then a burnout — it backs off a little, the rear wheels spin and
   * smoke, rubber left on the road, the headlamps flashing — honks, charges down and out, comes back in from the top.
   */
  keiCharge(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const pl = s.player;
    a.phase ??= 'aim';
    if (a.phase === 'aim') {
      if (a.t < KEI.aim * 0.65) a.tx = Phaser.Math.Clamp(pl.x, 18, VIEW.width - 18);
      g.x += (a.tx - g.x) * Math.min(1, dt * 5);
      const burn = Math.max(0, (a.t - KEI.aim * 0.4) / (KEI.aim * 0.6)); // the burnout, building
      e.x = g.x + (Math.random() - 0.5) * (1.5 + burn * 2.5);
      e.y += (KEI.home - burn * 9 - e.y) * Math.min(1, dt * 8);
      this.keiExhaust(g, dt, 3);
      if (a.step === 0) {
        a.step = 1;
        s.fx.text(e.x, e.y - 30, 'BURORORO!', 0.7, 0xffb050);
      }
      if (burn > 0) {
        // smoke pouring off the spinning rear wheels, the rubber they leave, the lamps flashing faster and faster
        if (Math.random() < dt * 30 * burn) for (const sx of [-1, 1]) s.fx.puff('wisp_s_1', e.x + sx * 12 + (Math.random() - 0.5) * 6, e.y - 16 + (Math.random() - 0.5) * 6, 0.5);
        this.keiSkid(g, dt);
        if (Math.floor(a.t * (6 + burn * 14)) % 2) g.beamT = g.t + 0.02;
      }
      if (a.t > KEI.aim) {
        Object.assign(a, { phase: 'go', t: 0 });
        s.fx.text(e.x, e.y + 34, 'PAAAP!', 0.8, 0xffe080);
        if (this.canFire(e)) s.bullets.ring(e.x, e.y + 20, 10, Math.random() * TAU, slow);
        s.cameras.main.shake(120, 0.003);
      }
    } else if (a.phase === 'go') {
      e.y += KEI.speed[g.stage > 1 ? 1 : 0] * dt;
      e.x = g.x;
      this.keiSkid(g, dt);
      if (e.y > s.H + 60) {
        // round again from the top: a second ram straight away (phase 2), or back to its row
        a.passes = (a.passes ?? 0) + 1;
        g.x = Phaser.Math.Clamp(a.kind === 'charge2' && a.passes < 2 ? pl.x : 30 + Math.random() * (VIEW.width - 60), 18, VIEW.width - 18);
        e.y = -60;
        if (a.kind === 'charge2' && a.passes < 2) Object.assign(a, { phase: 'aim', t: KEI.aim * 0.3 });
        else Object.assign(a, { phase: 'back', t: 0 });
      }
    } else {
      e.y += Math.max(30, (KEI.home - e.y) * 2) * dt * (e.y > KEI.home + 2 ? -1 : 1);
      e.x = g.x;
      e.setRotation(Phaser.Math.Angle.RotateTo(e.rotation, 0, dt * 5));
      if (Math.abs(e.y - KEI.home) < 2) this.keiDone(g, 0.7);
    }
  },

  /** High beams: the lamps flicker, faster and faster, onto the player, then two streams of shots pour out of them. */
  keiBeams(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const B = KEI.beams;
    const lamps = [-1, 1].map((sx) => [e.x + sx * 7, e.y + 18]);
    if (a.t < B.aim) {
      // the warning: the beams follow the player for most of it, then hold
      if (a.t < B.aim * 0.7) a.aim = lamps.map(([x, y], i) => Math.atan2(s.player.y - y, s.player.x + (i ? 10 : -10) - x));
      // the warning: the lamps flicker, faster as it comes, and flare at the end
      if (Math.floor(a.t * (5 + (a.t / B.aim) * 16)) % 2 || a.t > B.aim * 0.85) g.beamT = g.t + 0.02;
      if (a.step === 0 && a.t > 0.05) {
        a.step = 1;
        s.fx.text(e.x, e.y + 34, 'PIKA PIKA!', 0.8, 0xfff0a0);
      }
      return;
    }
    g.beamT = g.t + 0.05;
    if ((a.fire = (a.fire ?? 0) - dt) <= 0 && this.canFire(e)) {
      a.fire = 0.06;
      lamps.forEach(([x, y], i) => s.bullets.fire(x, y, a.aim[i] + (Math.random() - 0.5) * 0.05, normal * 1.25));
    }
    if (a.t > B.aim + B.fire) this.keiDone(g, 0.9);
  },

  /** The slalom: it shimmies, hazard lamps blinking, then weaves down the road, firing out to the sides. */
  keiSlalom(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const L = KEI.slalom;
    if (a.x0 === undefined) {
      a.x0 = Phaser.Math.Clamp(s.player.x, L.amp + 14, VIEW.width - L.amp - 14);
      a.ph = Math.random() * TAU;
      a.phase = 'show';
    }
    const path = (y) => a.x0 + Math.sin((y - KEI.home) / L.wave + a.ph) * L.amp;
    if (a.phase === 'show') {
      // it lines up and shimmies from side to side, the hazard lamps blinking: it's about to weave
      g.x += (path(e.y) - g.x) * Math.min(1, dt * 6);
      e.x = g.x + Math.sin(a.t * 40) * 3;
      e.setRotation(Math.sin(a.t * 40) * 0.12);
      g.hazardT = g.t + 0.05;
      this.keiExhaust(g, dt, 3);
      if (a.step === 0) {
        a.step = 1;
        s.fx.text(e.x, e.y - 30, 'SURARŌMU!', 0.7, 0xffb050);
      }
      if (a.t > L.show) Object.assign(a, { phase: 'go', t: 0, fire: 0 });
      return;
    }
    // weaving down: nose along the line, the hazard lamps firing out to the sides by turns
    e.y += L.speed * dt;
    const x = path(e.y);
    e.setRotation(-Math.atan2(path(e.y + 4) - x, 4) * 0.8);
    e.x = g.x = x;
    this.keiSkid(g, dt);
    g.hazardT = g.t + 0.05;
    if ((a.fire -= dt) <= 0 && this.canFire(e)) {
      a.fire = 0.28;
      a.side = -(a.side ?? 1);
      s.bullets.fan(e.x + a.side * 10, e.y - 18, a.side < 0 ? Math.PI : 0, 3, 0.7, slow);
    }
    if (e.y > s.H + 60) {
      g.x = 30 + Math.random() * (VIEW.width - 60);
      e.y = -60;
      e.setRotation(0);
      Object.assign(a, { kind: 'charge', phase: 'back', t: 0 });
    }
  },

  /** Hazard lights: they blink, and each blink fires a little fan from that side's lamp. */
  keiHazard(g, a, dt) {
    const e = g.body;
    if (a.t > a.step * 0.34) {
      a.step++;
      const sx = a.step % 2 ? -1 : 1;
      if (this.canFire(e)) this.scene.bullets.fan(e.x + sx * 10, e.y - 18, this.aimAt(e, sx * 10, -18), 3, 0.5, normal);
    }
    if (a.step >= 7) this.keiDone(g);
  },

  /** The long honk: rings one after another, each turned a little. */
  keiHonk(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    if (a.t > a.step * 0.32) {
      if (a.step === 0) s.fx.text(e.x, e.y + 34, 'PAAAAAAP!', 1.4, 0xffe080);
      a.step++;
      if (this.canFire(e)) s.bullets.ring(e.x, e.y + 20, 12, a.step * 0.13, slow);
      s.cameras.main.shake(80, 0.002);
    }
    if (a.step >= 5) this.keiDone(g, 1.1);
  },

  /** The doughnut: it drifts round and round the player, tyres smoking, firing in at the middle. */
  keiDonut(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    const R = KEI.donut.r;
    if (a.cx === undefined) {
      // the circle (R * 1.1 across, R * 0.85 up and down) kept whole on the screen, with room for the car
      a.cx = Phaser.Math.Clamp(s.player.x, R * 1.1 + 16, VIEW.width - R * 1.1 - 16);
      a.cy = Phaser.Math.Clamp(s.player.y - 10, s.H * 0.4, s.H - R * 0.85 - 18);
      a.ang = Math.atan2(e.y - a.cy, e.x - a.cx);
      a.fire = 0;
      s.fx.text(e.x, e.y + 30, 'DORIFTO!', 1, 0xff9a60);
    }
    const into = Math.min(1, a.t / 0.7); // swinging out into the circle
    a.ang += KEI.donut.w * dt * (0.4 + 0.6 * into);
    const tx = a.cx + Math.cos(a.ang) * R * 1.1;
    const ty = a.cy + Math.sin(a.ang) * R * 0.85;
    e.x = Phaser.Math.Clamp(e.x + (tx - e.x) * Math.min(1, dt * (2 + into * 10)), 14, VIEW.width - 14);
    e.y = Phaser.Math.Clamp(e.y + (ty - e.y) * Math.min(1, dt * (2 + into * 10)), 20, s.H - 16);
    g.x = e.x;
    // nose along the circle, the tail kicked out (a drift)
    e.setRotation(a.ang + Math.PI + 0.45);
    this.keiSkid(g, dt);
    if (Math.random() < dt * 14) s.fx.puff('wisp_s_1', e.x + (Math.random() - 0.5) * 16, e.y + (Math.random() - 0.5) * 16, 0.5);
    if (into >= 1 && (a.fire -= dt) <= 0) {
      a.fire = 0.17;
      s.bullets.fire(e.x, e.y, Math.atan2(a.cy - e.y, a.cx - e.x) + (Math.random() - 0.5) * 0.3, slow);
    }
    if (a.t > KEI.donut.dur) Object.assign(g.act, { kind: 'charge', phase: 'back', t: 0 });
  },

  /** Traffic cones, lobbed onto the road: they lie there and come down with it. */
  keiThrowCones(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    if (a.t > a.step * 0.32) {
      a.step++;
      const tx = 16 + Math.random() * (VIEW.width - 32);
      const ty = s.H * (0.3 + Math.random() * 0.35);
      if (e.texture.has('cone')) {
        const spr = this.segPool.spawn('cone', e.x, e.y).setDepth(DEPTH.air - 0.2);
        g.cones.push({ spr, x0: e.x, y0: e.y, tx, ty, t: 0, dur: 0.8, landed: false, life: KEI.cone });
      }
    }
    if (a.step >= 4) this.keiDone(g, 0.8);
  },

  /** The rush hour: lanes of little cars across the screen, an arrow across each lane first. */
  keiRush(g, a, dt) {
    const s = this.scene;
    if (a.step === 0) {
      a.step = 1;
      // two lanes of the three (a different pair each time), crossing in opposite directions
      const skip = Math.floor(Math.random() * 3);
      a.lanes = KEI.lanes.map((k, i) => ({ y: s.H * k, dir: i % 2 ? -1 : 1, sp: KEI.carSpeed[0] + Math.random() * (KEI.carSpeed[1] - KEI.carSpeed[0]), left: KEI.cars, next: 0 })).filter((_, i) => i !== skip);
      s.fx.text(VIEW.width / 2, s.H * 0.48, 'GODZINA SZCZYTU!', 1.2, 0xffe080);
    }
    let busy = false;
    for (const L of a.lanes) {
      if (a.t < 0.9) {
        // the warning: an arrow across the lane, blinking
        busy = true;
        if (Math.floor(a.t * 10) % 2) {
          this.tele.lineStyle(1, 0xffe080, 0.7);
          this.tele.lineBetween(4, L.y, VIEW.width - 4, L.y);
          const hx = L.dir > 0 ? VIEW.width - 6 : 6;
          this.tele.lineBetween(hx, L.y, hx - L.dir * 6, L.y - 4);
          this.tele.lineBetween(hx, L.y, hx - L.dir * 6, L.y + 4);
        }
        continue;
      }
      if (L.left > 0) {
        busy = true;
        if ((L.next -= dt) <= 0) {
          L.left--;
          L.next = (KEI.gap + Math.random() * 18) / L.sp;
          const frame = ['mini_r', 'mini_b', 'mini_w', 'mini_y'][Math.floor(Math.random() * 4)];
          if (g.body.texture.has(frame)) {
            const spr = this.segPool.spawn(frame, L.dir > 0 ? -24 : VIEW.width + 24, L.y).setDepth(DEPTH.air - 0.15).setRotation(L.dir > 0 ? -DOWN : DOWN);
            g.traffic.push({ spr, vx: L.dir * L.sp });
          }
        }
      }
    }
    if (!busy) this.keiDone(g, 1.2);
  },

  /** Watermelons off the flatbed, lobbed at the player; they burst into seeds where they land. */
  keiThrowMelons(g, a, dt) {
    const s = this.scene;
    const e = g.body;
    if (a.t > a.step * 0.45) {
      a.step++;
      const pl = s.player;
      if (e.texture.has('suika_0')) {
        const spr = this.segPool.spawn('suika_0', e.x, e.y - 10).setDepth(DEPTH.air + 0.05);
        const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 40, 14, VIEW.width - 14);
        const ty = Phaser.Math.Clamp(pl.y + (Math.random() - 0.5) * 30, s.H * 0.45, s.H - 14);
        g.melons.push({ spr, x0: e.x, y0: e.y - 10, tx, ty, t: 0, dur: 1.0 });
        g.throwUntil = g.t + 0.25;
      }
    }
    if (a.step >= 3) this.keiDone(g, 0.9);
  },

  // ---------------------------------------------------------------- the things on the road

  keiCones(g, dt) {
    const s = this.scene;
    const pl = s.player;
    const road = this.keiRoad();
    let n = 0;
    for (const c of g.cones) {
      c.t += dt;
      if (!c.landed) {
        const k = Math.min(1, c.t / c.dur);
        c.spr.setPosition(c.x0 + (c.tx - c.x0) * k, c.y0 + (c.ty - c.y0) * k - Math.sin(k * Math.PI) * 26);
        c.spr.rotation += 9 * dt;
        if (k >= 1) {
          c.landed = true;
          c.spr.setRotation(0);
          s.fx.puff('wisp_s_1', c.tx, c.ty, 0.3);
        }
        g.cones[n++] = c;
        continue;
      }
      // on the road, going by with it
      c.spr.y += road * dt;
      c.life -= dt;
      let gone = c.life <= 0 || c.spr.y > s.H + 20;
      // a shot knocks it flying
      for (const sh of s.player.shots.live) {
        if (sh.dead || Math.abs(sh.x - c.spr.x) > 6 || Math.abs(sh.y - c.spr.y) > 6) continue;
        s.player.shots.kill(sh);
        s.score.add(100 * s.score.mult);
        s.fx.spark(c.spr.x, c.spr.y);
        gone = true;
        break;
      }
      if (!gone && pl.alive && Math.abs(pl.x - c.spr.x) < 5 && Math.abs(pl.y - c.spr.y) < 5) pl.hit();
      if (gone) {
        this.segPool.kill(c.spr);
        continue;
      }
      g.cones[n++] = c;
    }
    g.cones.length = n;
  },

  keiTraffic(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const c of g.traffic) {
      c.spr.x += c.vx * dt;
      if (pl.alive && Math.abs(pl.x - c.spr.x) < 12 && Math.abs(pl.y - c.spr.y) < 6) pl.hit();
      if (c.spr.x < -40 || c.spr.x > VIEW.width + 40) {
        this.segPool.kill(c.spr);
        continue;
      }
      g.traffic[n++] = c;
    }
    g.traffic.length = n;
  },

  keiMelons(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    let n = 0;
    for (const m of g.melons) {
      m.t += dt;
      const k = Math.min(1, m.t / m.dur);
      m.spr.setPosition(m.x0 + (m.tx - m.x0) * k, m.y0 + (m.ty - m.y0) * k - Math.sin(k * Math.PI) * 34);
      m.spr.setFrame(`suika_${Math.floor(m.t * 12) % 4}`);
      if (Math.floor(m.t * 12) % 2) {
        this.tele.lineStyle(1, 0x8ae070, 0.8);
        this.tele.strokeCircle(m.tx, m.ty, 9 * (1 - k * 0.5));
      }
      if (k < 1) {
        g.melons[n++] = m;
        continue;
      }
      // splat: red flesh and rind flying, a ring of black seeds
      b.shot('splat', m.tx, m.ty, 0, 0, 6, { life: 0.12 });
      if (m.spr.texture.has('suika_splat_0')) {
        m.spr.setFrame('suika_splat_0').setScale(m.spr.base * 1.3);
        g.splats.push({ spr: m.spr, t: 0 });
      } else this.segPool.kill(m.spr);
      s.fx.text(m.tx, m.ty - 16, 'GUSHA!', 0.5, 0xff8a6a);
      const off = Math.random() * TAU;
      for (let i = 0; i < 10; i++) b.shot('jb_seed', m.tx, m.ty, off + (i / 10) * TAU, slow * (0.75 + (i % 2) * 0.3), 2, { spin: true });
    }
    g.melons.length = n;
    // the bursting melons' frames, then gone
    let k = 0;
    for (const sp of g.splats) {
      sp.t += dt;
      if (sp.t > 0.3) {
        this.segPool.kill(sp.spr);
        continue;
      }
      sp.spr.setFrame(`suika_splat_${Math.min(2, Math.floor(sp.t * 10))}`).setAlpha(sp.t > 0.2 ? (0.3 - sp.t) * 10 : 1);
      g.splats[k++] = sp;
    }
    g.splats.length = k;
  },

  /** Skid marks behind it, left on the road, going by with it and fading. */
  keiSkid(g, dt) {
    const e = g.body;
    if ((g.skidT -= dt) > 0 || !e.texture.has('skid')) return;
    g.skidT = 0.05;
    const spr = this.segPool.spawn('skid', e.x - Math.sin(e.rotation) * 16, e.y - Math.cos(e.rotation) * 16).setDepth(DEPTH.ground + 0.4).setRotation(e.rotation).setAlpha(0.7);
    g.marks.push({ spr, t: 0 });
  },

  keiMarks(g, dt) {
    const road = this.keiRoad();
    let n = 0;
    for (const m of g.marks) {
      m.t += dt;
      m.spr.y += road * dt;
      m.spr.setAlpha(0.7 * Math.max(0, 1 - m.t / 3));
      if (m.t > 3 || m.spr.y > this.scene.H + 30) {
        this.segPool.kill(m.spr);
        continue;
      }
      g.marks[n++] = m;
    }
    g.marks.length = n;
  },

  keiExhaust(g, dt, k) {
    const e = g.body;
    if (Math.random() < dt * 6 * k) this.scene.fx.puff('wisp_s_1', e.x + (Math.random() - 0.5) * 6 - Math.sin(e.rotation) * 22, e.y - Math.cos(e.rotation) * 22, 0.35);
  },

  /** Its frame (car, tuned, truck; the hazard lamps), its hit circles along its length. */
  keiPose(g) {
    const e = g.body;
    let frame;
    const roll = Math.floor(g.t * 14) % 2; // the wheels turning
    if (g.stage >= 3) frame = g.t < (g.throwUntil ?? 0) ? 'keitora_1' : roll ? 'keitora_2' : 'keitora_0';
    else if (g.stage === 2) frame = roll ? 'kei_tuned_1' : 'kei_tuned';
    else if (g.t < (g.beamT ?? 0)) frame = 'kei_beam';
    else if (g.t < (g.hazardT ?? 0) || g.act?.kind === 'hazard') frame = Math.floor(g.t * 6) % 2 ? 'kei_1' : roll ? 'kei_2' : 'kei_0';
    else if (g.act?.kind === 'charge' || g.act?.kind === 'slalom') frame = roll ? 'kei_angry_1' : 'kei_angry';
    else frame = roll ? 'kei_2' : 'kei_0';
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
    const sn = Math.sin(e.rotation);
    const cs = Math.cos(e.rotation);
    const n = e.segs.length;
    e.segs.forEach((sg, i) => {
      const d = (i - (n - 1) / 2) * 22; // along its length, the nose down
      sg.x = e.x - sn * d;
      sg.y = e.y + cs * d;
    });
  },

  keiCleanup(g) {
    for (const list of [g.cones, g.marks, g.traffic, g.melons, g.splats]) for (const o of list) this.segPool.kill(o.spr);
    g.cones = [];
    g.marks = [];
    g.traffic = [];
    g.melons = [];
    g.splats = [];
  },
};
