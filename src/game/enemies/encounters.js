import { clamp, mix, segmentDistance } from './encounterGeometry.js';
import { baseScale, enemyTexture, hasEnemyFrame } from '../enemyArt.js';
import { DEPTH, JAODORI } from '../../config.js';

const GOLD = 0xffd06a, SAFE = 0x81f3cc, WARN = 0xff735e;
const living = p => !p.dead && p.hp > 0;

// Interactive attacks use the existing logical coordinates and scene-owned telegraph layer.
// No real-time callbacks: pause, hit-stop, restart and scene shutdown stop them together.
export const encounters = {
  encounterHint(g, message, detail = '') {
    if (g.hint === message) return;
    g.hint = message;
    this.scene.hud.show(message, detail, 3);
  },

  encounterOpen(g, body, seconds, message) {
    g.open = seconds;
    this.scene.fx.text(body.x, body.y + 28, message, 1.4, SAFE);
    this.scene.fx.shockwave(body.x, body.y);
    this.scene.bullets.cancelAll(this.scene.fx);
    this.scene.sfx.explode('m');
  },

  kumaFurnace(g, dt) {
    const s = this.scene, p = s.player, body = g.body, ink = this.tele;
    const fire = g.fire = { x: 90, y: Math.min(190, s.H * 0.55) };
    const fx = s.fx;
    // the Snow Festival bonfire: its art (four frames of flame), the glow it throws on the snow, sparks
    if (!g.fireArt && hasEnemyFrame('kuma_fire_0')) {
      const key = enemyTexture('kuma_fire_0');
      g.fireArt = s.add.image(0, 0, key, 'kuma_fire_0').setScale(baseScale(key)).setDepth(DEPTH.ground + 0.6);
    }
    if (g.fireArt) g.fireArt.setPosition(fire.x, fire.y - 3).setFrame(`kuma_fire_${Math.floor(g.t * 9) % 4}`);
    else {
      ink.fillStyle(0x383849, 1).fillRoundedRect(fire.x - 17, fire.y - 10, 34, 20, 4);
      ink.fillStyle(0xff6838, 0.95).fillTriangle(fire.x - 7, fire.y + 3, fire.x + 7, fire.y + 3, fire.x, fire.y - 14);
    }
    if ((g.glowT = (g.glowT ?? 0) - dt) <= 0) {
      g.glowT = 0.14;
      fx.light(fire.x, fire.y - 6, 1.7 + Math.random() * 0.3, true, 0xff9040);
      const sp = fx.part(fx.parts, 'dot_1', fire.x + (Math.random() - 0.5) * 12, fire.y - 10, { vx: (Math.random() - 0.5) * 14, vy: -26 - Math.random() * 22, drag: 0.6, life: 0.5 + Math.random() * 0.4, a0: 0.95 });
      sp.setTint(Math.random() < 0.5 ? 0xffd070 : 0xff8030);
    }
    // the shell, melting: the sculpture's cracks glow and widen with each pass through the fire, it drips
    if (g.melts > 0 && hasEnemyFrame(`kuma_melt_${g.melts}`) && body.frame.name !== `kuma_melt_${g.melts}`) body.setFrame(`kuma_melt_${g.melts}`);
    if (g.melts > 0 && Math.random() < dt * (3 + g.melts * 3)) {
      const d = fx.part(fx.parts, 'drop_0', body.x + (Math.random() - 0.5) * 34, body.y + 18 + Math.random() * 8, { vy: 30, g: 120, drag: 0, life: 0.45 });
      d.setTint(0xbfe8ff);
    }
    // a pass through the fire leaves the bear in flames and steam for a moment
    if (g.burn > 0) {
      g.burn -= dt;
      if (Math.random() < dt * 40) {
        const fl = fx.part(fx.parts, 'dot_1', body.x + (Math.random() - 0.5) * 30, body.y + (Math.random() - 0.3) * 30, { vx: (Math.random() - 0.5) * 10, vy: -40 - Math.random() * 30, drag: 1, life: 0.35 + Math.random() * 0.25, a0: 1, grow: 1.5 });
        fl.setTint(Math.random() < 0.4 ? 0xffe080 : 0xff6a28).setBlendMode('ADD');
      }
      if (Math.random() < dt * 8) fx.puff('wisp_s_1', body.x + (Math.random() - 0.5) * 26, body.y - 6, 0.6);
      body.setTint(Math.floor(g.burn * 14) % 2 ? 0xffc890 : 0xffffff);
    } else if (g.burn !== undefined) { body.clearTint(); g.burn = undefined; }
    // the three melts to go, under the fire: ice crystals that turn to flames as they melt
    for (let i = 0; i < 3; i++) {
      const x = 78 + i * 12, y = fire.y + 21;
      if (i < g.melts) {
        ink.fillStyle(0xff8030, 1).fillTriangle(x - 3.5, y + 3, x + 3.5, y + 3, x, y - 5);
        ink.fillStyle(0xffe080, 1).fillTriangle(x - 1.8, y + 3, x + 1.8, y + 3, x, y - 1.5);
      } else {
        ink.lineStyle(1.5, 0xd8f4ff, 0.95);
        for (let k = 0; k < 3; k++) {
          const an = (k / 3) * Math.PI;
          ink.lineBetween(x - Math.cos(an) * 4, y - Math.sin(an) * 4, x + Math.cos(an) * 4, y + Math.sin(an) * 4);
        }
      }
    }
    this.encounterHint(g, 'STOP LODOWĄ SKORUPĘ', 'ZWAB 3 SZARŻE PRZEZ OGIEŃ');
    if (Math.hypot(p.x - fire.x, p.y - fire.y) < 11 && s.bombClear <= 0) p.hit();
    if (!p.alive || p.entering > 0 || s.ceasefire) {
      g.charge = null; body.harmless = true;
      body.x += (g.home - body.x) * Math.min(1, dt * 3);
      body.y += (g.homeY - body.y) * Math.min(1, dt * 3);
      return;
    }
    if (!g.charge) {
      body.harmless = false;
      g.timer -= dt;
      if (g.timer > 0 || g.gate > 0 || s.bombClear > 0) return;
      g.charge = { t: 0, from: { x: body.x, y: body.y }, to: { x: p.x, y: p.y }, melted: false };
    }
    const c = g.charge;
    c.t += dt;
    if (c.t < 1.4) c.to = { x: clamp(p.x, 20, 160), y: clamp(p.y, 110, s.H - 25) };
    if (c.t < 2.1) this.kumaChargeTrack(g, c);
    else if (c.t < 2.95) {
      const prev = { x: body.x, y: body.y }, k = clamp((c.t - 2.1) / 0.85, 0, 1);
      body.setPosition(mix(c.from.x, c.to.x, k), mix(c.from.y, c.to.y, k));
      // the charge kicks up snow behind it
      if (Math.random() < dt * 50) fx.part(fx.parts, 'flake_1', body.x + (Math.random() - 0.5) * 20, body.y + 16, { vx: (Math.random() - 0.5) * 40, vy: -10 - Math.random() * 20, drag: 3, life: 0.5, a0: 0.9 });
      if (!c.melted && segmentDistance(fire, prev, body) < 17) {
        c.melted = true;
        g.melts++;
        g.burn = 1.1;
        fx.shards(body.x, body.y, 22, true);
        fx.smoke(body.x, body.y, 10, 18);
        for (let k = 0; k < 6; k++) fx.puff('wisp_s_1', fire.x + (Math.random() - 0.5) * 30, fire.y - Math.random() * 16, 0.8);
        fx.shockwave(fire.x, fire.y);
        fx.light(fire.x, fire.y, 3, true, 0xffb060);
        s.cameras.main.shake(220, 0.006);
        fx.text(90, fire.y - 34, g.melts < 3 ? `SKORUPA TOPNIEJE ${g.melts}/3` : 'SKORUPA PĘKA!', 1.6, 0xffd070);
        s.sfx.explode('m');
        if (g.melts === 3) {
          g.fireArt?.destroy();
          g.fireArt = null;
          body.clearTint();
          g.burn = undefined;
          g.charge = null;
          g.take = null;
          body.harmless = true;
          Object.assign(g, { state: 'break', t: 0, phase: 0, step: 0, roar: 1.6 });
          this.phaseBreak(g, body.x, body.y, 2, 'SKORUPA STOPIONA — HIGUMA');
          return;
        }
      }
    } else {
      body.harmless = true;
      const k = clamp((c.t - 2.95) / 1.2, 0, 1);
      const home = g.melts % 2 ? 55 : 125;
      body.setPosition(mix(c.to.x, home, k), mix(c.to.y, g.homeY, k));
      if (k === 1) { g.charge = null; g.timer = 1; body.harmless = false; }
    }
  },

  /** The coming charge, on the snow: a wide band the bear's width, chevrons running along it, claw marks at its end. */
  kumaChargeTrack(g, c) {
    const ink = this.tele;
    const locked = c.t >= 1.4;
    const dx = c.to.x - c.from.x, dy = c.to.y - c.from.y;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len, nx = -uy, ny = ux;
    const half = 13;
    const pulse = locked ? 0.3 + 0.12 * Math.sin(c.t * 30) : 0.1 + 0.05 * Math.sin(c.t * 8);
    ink.fillStyle(WARN, pulse).fillPoints([
      { x: c.from.x + nx * half, y: c.from.y + ny * half }, { x: c.to.x + nx * half, y: c.to.y + ny * half },
      { x: c.to.x - nx * half, y: c.to.y - ny * half }, { x: c.from.x - nx * half, y: c.from.y - ny * half },
    ], true);
    ink.lineStyle(1, WARN, locked ? 0.95 : 0.5);
    for (const sd of [-1, 1]) ink.lineBetween(c.from.x + nx * half * sd, c.from.y + ny * half * sd, c.to.x + nx * half * sd, c.to.y + ny * half * sd);
    // chevrons running towards the end, faster once it is locked on
    const step = 16, shift = (c.t * (locked ? 70 : 30)) % step;
    ink.lineStyle(2, locked ? 0xffe0c8 : WARN, locked ? 0.95 : 0.6);
    for (let d = shift; d < len - 6; d += step) {
      const x = c.from.x + ux * d, y = c.from.y + uy * d;
      ink.lineBetween(x - ux * 5 + nx * 7, y - uy * 5 + ny * 7, x, y);
      ink.lineBetween(x - ux * 5 - nx * 7, y - uy * 5 - ny * 7, x, y);
    }
    // the claw marks where it will land
    ink.lineStyle(2, WARN, locked ? 1 : 0.7);
    for (let k = -1; k <= 1; k++) {
      const ox = c.to.x + nx * k * 5, oy = c.to.y + ny * k * 5;
      ink.lineBetween(ox - ux * 8 - nx * 2, oy - uy * 8 - ny * 2, ox + ux * 8 + nx * 2, oy + uy * 8 + ny * 2);
    }
  },

  // Shot occupancy, rather than shot damage/count, charges every weapon at the same rate.
  bossDeviceHit(shot) {
    const g = this.bossGroup;
    if (!g || g.defeated || g.kind !== 'jaodori' || !g.launchers || g.parts[0].state !== 'fight') return false;
    for (const pad of g.launchers) {
      if (pad.cool > 0 || pad.rocket || g.lock > 0) continue;
      if (Math.abs(shot.x - pad.x) <= 12 + shot.radius && Math.abs(shot.y - pad.y) <= 9 + shot.radius) {
        pad.litUntil = g.t + 0.22;
        return true;
      }
    }
    return false;
  },

  dragonFestival(g, e, dt) {
    const s = this.scene, ink = this.tele;
    g.open = Math.max(0, (g.open ?? 0) - dt);
    g.take = { body: g.open ? JAODORI.openTake : JAODORI.shut };
    g.launchers ??= [38, 90, 142].map(x => ({ x, y: s.H - 83, charge: 0, cool: 0, litUntil: 0, rocket: null }));
    g.lock = Math.max(0, (g.lock ?? 0) - dt); // after a launch every launcher rests a moment
    // the launchers' art: a festival mortar in its crate, loaded or spent (the plain boxes where it is missing)
    if (!g.padArt && hasEnemyFrame('n_pad')) {
      g.padArt = g.launchers.map(() => {
        const key = enemyTexture('n_pad');
        return s.add.image(0, 0, key, 'n_pad').setScale(baseScale(key)).setDepth(DEPTH.ground + 0.6);
      });
    }
    this.encounterHint(g, 'FAJERWERKI', 'ŁADUJ WYRZUTNIĘ POD SMOKIEM');
    const route = ft => ({ x: 90 + Math.sin(ft * 0.65) * 52, y: 88 + Math.sin(ft * 1.3) * 10 });
    const speed = g.stage >= 3 ? 1.4 : 1;
    const future = route(g.ft + 1.95 * speed);
    ink.lineStyle(1, GOLD, 0.55);
    let prev = route(g.ft);
    for (let i = 1; i <= 24; i++) {
      const q = route(g.ft + i / 12 * speed);
      ink.lineBetween(prev.x, prev.y, q.x, q.y); prev = q;
    }
    ink.strokeCircle(future.x, future.y, 9);
    let busy = false;
    for (const pad of g.launchers) {
      pad.y = s.H - 83;
      pad.cool = Math.max(0, pad.cool - dt);
      const ready = !pad.rocket && pad.cool <= 0 && !(g.lock > 0);
      const lit = ready && pad.litUntil > g.t && s.player.alive && !s.player.entering;
      if (lit) pad.charge = Math.min(1, pad.charge + dt / JAODORI.charge);
      const art = g.padArt?.[g.launchers.indexOf(pad)];
      if (art) {
        // loaded while it can be charged or is about to fly; spent (dark and dimmed) while it rests
        art.setPosition(pad.x, pad.y).setFrame(ready || (pad.rocket && pad.rocket.t < 1.2) ? 'n_pad' : 'n_pad_empty');
        art.setAlpha(ready || pad.rocket ? 1 : 0.7).setTint(lit ? 0xfff0c0 : 0xffffff);
      } else {
        ink.fillStyle(0x28384e, 1).fillRoundedRect(pad.x - 12, pad.y - 9, 24, 18, 3);
        ink.lineStyle(2, GOLD, 1).lineBetween(pad.x, pad.y - 7, pad.x, pad.y - 17);
      }
      // round the tube's mouth: the charge filling in mint; while it rests, a grey arc running down
      const A0 = -Math.PI / 2;
      if (pad.cool > 0 || (g.lock > 0 && !pad.rocket)) {
        const k = pad.cool > 0 ? pad.cool / JAODORI.cool : g.lock / JAODORI.lock;
        ink.lineStyle(2, 0x8a8ca0, 0.9).beginPath().arc(pad.x, pad.y, 7.5, A0, A0 + Math.PI * 2 * k).strokePath();
      } else if (!pad.rocket) {
        ink.lineStyle(1, GOLD, 0.5 + 0.3 * Math.sin(g.t * 6)).strokeCircle(pad.x, pad.y, 7.5);
        if (pad.charge > 0) ink.lineStyle(2.5, SAFE, 1).beginPath().arc(pad.x, pad.y, 7.5, A0, A0 + Math.PI * 2 * pad.charge).strokePath();
      }
      if (!art) ink.lineStyle(1.5, ready ? GOLD : 0x777888, ready ? 0.9 : 0.5).strokeRect(pad.x - 12, pad.y - 9, 24, 18);
      if (pad.charge >= 1 && !pad.rocket && !(g.gate > 0)) {
        pad.charge = 0;
        pad.rocket = { t: 0 };
        g.lock = JAODORI.lock;
        for (const q of g.launchers) if (q !== pad) q.charge = Math.min(q.charge, 0.5);
        s.fx.text(pad.x, pad.y - 24, 'GOTOWE!', 1, SAFE);
      }
      if (!pad.rocket) continue;
      busy = true;
      const r = pad.rocket;
      r.t += dt;
      const target = route(g.ft + Math.max(0, 1.95 - r.t) * speed);
      ink.lineStyle(1, SAFE, 0.65).lineBetween(pad.x, pad.y - 18, pad.x, 88);
      ink.strokeCircle(pad.x, 88, 22);
      ink.lineStyle(1, GOLD, 0.85).strokeCircle(target.x, target.y, 10);
      if (r.t < 1.2) {
        ink.fillStyle(GOLD, 1).fillRect(pad.x - 10, pad.y - 13, 20 * (1 - r.t / 1.2), 2);
      } else {
        const k = clamp((r.t - 1.2) / 0.75, 0, 1);
        const y = mix(pad.y - 18, 88, k);
        ink.lineStyle(3, GOLD, 1).lineBetween(pad.x, y + 13, pad.x, y);
        ink.fillStyle(0xffffff, 1).fillCircle(pad.x, y, 3);
        if (k === 1) {
          s.fx.shockwave(pad.x, 88); s.fx.light(pad.x, 88, 1.5, false, GOLD);
          if (Math.hypot(e.x - pad.x, e.y - 88) < 26) {
            this.encounterOpen(g, e, JAODORI.open, 'FAJERWERK TRAFIŁ!');
            g.take.body = 1;
            this.damage(e, e.maxHp * JAODORI.firework);
            g.take.body = JAODORI.openTake;
            g.fireworkHits = (g.fireworkHits ?? 0) + 1;
          }
          pad.rocket = null; pad.cool = JAODORI.cool; pad.litUntil = 0;
        }
      }
    }
    if (g.open) ink.lineStyle(2, SAFE, 0.9).strokeCircle(e.x, e.y, 22);
    return busy || g.open > 0;
  },
};
