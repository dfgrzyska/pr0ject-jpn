import { clamp, mix, segmentDistance, emberPoint } from './encounterGeometry.js';
import { DOWN } from './shared.js';

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

  updateShisa(g, dt) {
    const s = this.scene, p = s.player, ink = this.tele;
    const alive = g.parts.filter(e => living(e) && e.group === g);
    if (!alive.length) return;
    g.t += dt;
    if (alive.some(e => e.state === 'enter')) {
      for (const e of alive) {
        e.y = Math.min(e.homeY, e.y + 42 * dt);
        if (e.y >= e.homeY) e.state = 'fight';
      }
      return;
    }
    const total = alive.reduce((n, e) => n + e.hp, 0);
    if (g.stage === 1 && (total < g.maxTotal * 0.55 || alive.length === 1)) {
      g.duel = null;
      this.phaseBreak(g, alive[0].x, alive[0].y, 2, 'SKŁÓCENI STRAŻNICY');
    }
    if (g.stage === 2 && alive.length === 1) {
      const last = alive[0], fallen = g.parts.find(e => e !== last);
      last.hp = Math.min(last.maxHp, last.hp + 200);
      last.radius *= 1.2;
      g.soul = { t: 0, x: fallen.x, y: fallen.y, sp: null };
      g.duelGhost = this.segPool.spawn(fallen.role === 'a' ? 'shisa_a_0' : 'shisa_un_0', fallen.x, fallen.y).setAlpha(0.45).setTint(0xa8e6ff);
      g.duel = null;
      g.enraged = true;
      this.phaseBreak(g, last.x, last.y, 3, 'RYK WIDMOWEGO STRAŻNIKA');
    }
    if (g.stage === 3) alive[0].setScale(alive[0].base * (1 + 0.2 * this.shisaSoul(g, alive[0], dt)));
    g.open = Math.max(0, (g.open ?? 0) - dt);
    g.take = { a: g.open ? 1.6 : 0.12, un: g.open ? 1.6 : 0.12 };
    this.encounterHint(g, g.stage === 3 ? 'RYK WIDMA' : 'SKŁÓĆ STRAŻNIKÓW', 'NAPROWADŹ RYK NA DRUGIEGO');
    const turn = (g.turn ?? 0) % 2;
    const source = alive.length === 2 ? alive[turn] : { x: turn ? 142 : 38, y: 66 };
    const target = alive.length === 2 ? alive[1 - turn] : alive[0];
    if (!g.duel) {
      const move = (e, x, y) => { e.x += (x - e.x) * Math.min(1, dt * 3); e.y += (y - e.y) * Math.min(1, dt * 3); };
      if (alive.length === 2) move(source, turn ? 130 : 50, 68);
      move(target, turn ? 72 : 108, 140);
    }
    if (alive.length === 1) {
      // A spectral attacker remains after the twin dies, so the counter still works.
      g.duelGhost?.setPosition(source.x, source.y);
      ink.lineStyle(2, GOLD, 0.6).strokeCircle(source.x, source.y, 13);
      ink.lineBetween(source.x - 8, source.y - 15, source.x - 4, source.y - 6);
      ink.lineBetween(source.x + 8, source.y - 15, source.x + 4, source.y - 6);
    }
    if (g.open) {
      for (const e of alive) ink.lineStyle(1, SAFE, 0.9).strokeCircle(e.x, e.y, e.radius + 5);
      return;
    }
    if (g.gate > 0 || !p.alive || p.entering > 0 || s.ceasefire || s.bombClear > 0) { g.duel = null; return; }
    if (!g.duel) {
      g.timer -= dt;
      if (g.timer > 0) return;
      g.duel = { t: 0, source: { x: source.x, y: source.y }, target, angle: DOWN, hit: false };
    }
    const d = g.duel;
    if (!living(d.target)) { g.duel = null; return; }
    d.t += dt;
    // Aim for 1.3s, then hold the final direction for 0.8s before firing.
    if (d.t < 1.3) d.angle = Math.atan2(p.y - d.source.y, p.x - d.source.x);
    const end = { x: d.source.x + Math.cos(d.angle) * s.H * 1.5, y: d.source.y + Math.sin(d.angle) * s.H * 1.5 };
    const fired = d.t >= 2.1;
    ink.lineStyle(fired ? 7 : 1.5, fired ? GOLD : WARN, fired ? 0.85 : 0.7);
    ink.lineBetween(d.source.x, d.source.y, end.x, end.y);
    ink.lineStyle(1, SAFE, 0.8).strokeCircle(d.target.x, d.target.y, d.target.radius + 5);
    if (fired && !d.hit && segmentDistance(d.target, d.source, end) < d.target.radius + 3) {
      d.hit = true;
      this.encounterOpen(g, d.target, 4.5, 'WIĘŹ PRZERWANA!');
      g.take = { a: 1.6, un: 1.6 };
      this.damage(d.target, 80);
      g.duel = null;
      g.turn = (g.turn ?? 0) + 1;
      g.timer = 1.3;
      return;
    }
    if (fired && segmentDistance(p, d.source, end) < 5) p.hit();
    if (d.t >= 2.55) { g.duel = null; g.turn = (g.turn ?? 0) + 1; g.timer = 1.5; }
  },

  kumaFurnace(g, dt) {
    const s = this.scene, p = s.player, body = g.body, ink = this.tele;
    const fire = g.fire = { x: 90, y: Math.min(190, s.H * 0.55) };
    ink.fillStyle(0x383849, 1).fillRoundedRect(fire.x - 17, fire.y - 10, 34, 20, 4);
    ink.lineStyle(2, GOLD, 0.95).strokeEllipse(fire.x, fire.y, 34, 20);
    for (let i = -1; i <= 1; i++) {
      const h = 12 + 4 * Math.sin(g.t * 9 + i * 2);
      ink.fillStyle(i ? 0xff6838 : 0xffe597, 0.95).fillTriangle(fire.x + i * 8 - 6, fire.y + 3, fire.x + i * 8 + 6, fire.y + 3, fire.x + i * 8, fire.y - h);
    }
    for (let i = 0; i < 3; i++) ink.fillStyle(i < g.melts ? SAFE : 0x7bb8df, 1).fillCircle(80 + i * 10, fire.y + 17, 3);
    this.encounterHint(g, 'STOP LODOWĄ SKORUPĘ', 'ZWAB 3 SZARŻE PRZEZ OGIEŃ');
    if (Math.hypot(p.x - fire.x, p.y - fire.y) < 11 && s.bombClear <= 0) p.hit();
    // Cracks remain between attempts and clearly communicate the three permanent melts.
    for (let i = 0; i < g.melts; i++) {
      const x = body.x - 12 + i * 15;
      ink.lineStyle(2, GOLD, 1).lineBetween(x, body.y - 17, x + 7, body.y);
      ink.lineBetween(x + 7, body.y, x - 2, body.y + 19);
    }
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
    if (c.t < 2.1) {
      ink.lineStyle(c.t < 1.4 ? 1 : 3, WARN, 0.8).lineBetween(c.from.x, c.from.y, c.to.x, c.to.y);
      ink.strokeCircle(c.to.x, c.to.y, 10);
    } else if (c.t < 2.95) {
      const prev = { x: body.x, y: body.y }, k = clamp((c.t - 2.1) / 0.85, 0, 1);
      body.setPosition(mix(c.from.x, c.to.x, k), mix(c.from.y, c.to.y, k));
      if (!c.melted && segmentDistance(fire, prev, body) < 17) {
        c.melted = true;
        g.melts++;
        s.fx.shards(body.x, body.y, 18, true);
        s.fx.smoke(body.x, body.y, 8, 16);
        s.fx.text(90, fire.y - 28, `LÓD ${g.melts}/3`, 1.6, SAFE);
        s.sfx.explode('m');
        if (g.melts === 3) {
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

  takoTraps(g, dt) {
    g.open = Math.max(0, (g.open ?? 0) - dt);
    if (g.stage >= 3) return;
    g.take.head = g.open ? 1.5 : 0.08;
    const y = Math.min(190, this.scene.H * 0.56);
    g.posts = [42, 90, 138].map(x => ({ x, y }));
    for (const post of g.posts) {
      this.tele.fillStyle(0x35485c, 1).fillRect(post.x - 7, y - 9, 14, 18);
      this.tele.lineStyle(2, GOLD, 1).strokeRect(post.x - 7, y - 9, 14, 18);
      this.tele.lineBetween(post.x - 10, y - 4, post.x + 10, y - 4);
    }
    this.encounterHint(g, 'ZAKLINUJ MACKĘ', 'ZWAB NA ZŁOTY PAL I STRZELAJ');
    if (g.open) this.tele.lineStyle(2, SAFE, 1).strokeCircle(g.head.x, g.head.y, 24);
  },

  takoArms(g, arms) {
    if (g.slams.length || g.open || g.gate > 0 || !this.canFire(g.head)) { g.timer = 0.2; return; }
    const available = arms.filter(t => !t.invuln);
    if (!available.length) return;
    const index = (g.trapTurn ?? 0) % available.length;
    const selected = [available[index]];
    if (g.stage >= 2 && available.length > 1) selected.push(available[(index + Math.ceil(available.length / 2)) % available.length]);
    g.trapTurn = (g.trapTurn ?? 0) + 1;
    g.slams = selected.map((arm, i) => ({ arm, t: -i * 1.1, k: 0, to: { x: this.scene.player.x, y: this.scene.player.y }, pinned: false }));
    g.timer = 1.2;
  },

  slamStep(g, dt) {
    const s = this.scene, p = s.player;
    for (const sl of g.slams) {
      if (sl.arm.dead || sl.arm.group !== g) { sl.over = true; continue; }
      sl.t += dt;
      if (sl.t < 0) continue;
      const from = { x: g.head.x + sl.arm.dx, y: g.head.y + sl.arm.dy };
      if (sl.t < 1.1) sl.to = { x: clamp(p.x, 16, 164), y: clamp(p.y, 115, Math.min(245, s.H - 35)) };
      if (sl.t < 1.85) {
        this.tele.lineStyle(sl.t < 1.1 ? 1 : 2, WARN, 0.8).lineBetween(from.x, from.y, sl.to.x, sl.to.y);
        this.tele.strokeCircle(sl.to.x, sl.to.y, 9);
      } else if (sl.t < 2.2) sl.k = (sl.t - 1.85) / 0.35;
      else {
        sl.k = 1;
        if (!sl.landed) {
          sl.landed = true;
          const post = g.posts?.find(q => Math.hypot(sl.to.x - q.x, sl.to.y - q.y) < 17);
          if (post) {
            sl.to = { ...post }; sl.pinned = true;
            sl.arm.radius = 8;
            s.fx.text(post.x, post.y - 18, 'STRZELAJ!', 1.6, SAFE);
            s.fx.spark(post.x, post.y);
          } else if (this.canFire(g.head)) s.bullets.ring(sl.to.x, sl.to.y, 6, 0, 32);
        }
        const hold = sl.pinned ? 6 : 2.7;
        if (sl.pinned) this.tele.lineStyle(2, SAFE, 1).strokeCircle(sl.to.x, sl.to.y, 12);
        if (sl.t > hold) { sl.pinned = false; sl.arm.radius = 3.5; sl.k = Math.max(0, 1 - (sl.t - hold) / 0.6); }
        if (sl.t > hold + 0.6) sl.over = true;
      }
    }
    g.slams = g.slams.filter(sl => !sl.over);
  },

  updateSankibo(g, dt) {
    const s = this.scene, p = s.player, e = g.body, ink = this.tele;
    if (!living(e)) return;
    g.t += dt;
    if (g.state === 'enter') {
      e.y = Math.min(g.homeY, e.y + 40 * dt);
      if (e.y === g.homeY) { g.state = 'fight'; g.awake = true; g.timer = 1.5; }
    }
    g.braziers.forEach((br, i) => {
      br.setPosition(i ? 148 : 32, e.y + 34);
      br.invuln = true; br.harmless = true;
    });
    if (g.state !== 'fight') return;
    if (g.stage === 1 && e.hp < e.maxHp * 0.65) this.phaseBreak(g, e.x, e.y, 2, 'WIATR ZMIENIA KIERUNEK');
    if (g.stage === 2 && e.hp < e.maxHp * 0.3) { g.enraged = true; this.phaseBreak(g, e.x, e.y, 3, 'GNIEW GÓRY MISEN'); }
    g.open = Math.max(0, (g.open ?? 0) - dt);
    g.take = { body: g.open ? 1.5 : 0.08 };
    this.encounterHint(g, 'ODWRÓĆ ŻAR', 'NAPROWADŹ GO NA PAS WIATRU');
    ink.lineStyle(2, g.open ? SAFE : GOLD, 0.9).strokeCircle(e.x, e.y, 22);
    if (g.open) { s.parallax.windTarget = 0; return; }
    if (!p.alive || p.entering > 0 || s.ceasefire || s.bombClear > 0 || g.gate > 0) {
      g.ember = null; s.parallax.windTarget = 0; return;
    }
    if (!g.ember) {
      g.timer -= dt;
      if (g.timer > 0) return;
      const side = g.stage === 1 ? 1 : ((g.emberTurn ?? 0) % 2 ? -1 : 1);
      g.emberTurn = (g.emberTurn ?? 0) + 1;
      g.galeDir = side;
      const br = g.braziers[side > 0 ? 0 : 1];
      g.ember = { t: 0, from: { x: br.x, y: br.y }, control: { x: p.x, y: p.y }, end: { x: 90, y: e.y } };
      e.anims.stop(); e.setFrame(side > 0 ? 'sankibo_fan_r' : 'sankibo_fan_l');
    }
    const a = g.ember;
    a.t += dt;
    const guideY = Math.min(205, s.H * 0.61);
    // Project the aimed ray onto the wind band, then bend it 50 units with the fan.
    if (a.t < 1.4) {
      const x = clamp(a.from.x + (p.x - a.from.x) * (guideY - a.from.y) / Math.max(25, p.y - a.from.y), -40, 220);
      a.control = { x, y: guideY };
      a.end = { x: x + g.galeDir * 50, y: e.y };
    }
    ink.lineStyle(1, SAFE, 0.5).lineBetween(12, guideY, 168, guideY);
    const inlet = e.x - g.galeDir * 50;
    ink.strokeCircle(inlet, guideY, 12);
    ink.lineStyle(2, GOLD, 0.8).lineBetween(74, guideY + 15, 106, guideY + 15);
    ink.lineBetween(g.galeDir > 0 ? 106 : 74, guideY + 15, g.galeDir > 0 ? 100 : 80, guideY + 10);
    let prev = a.from;
    for (let i = 1; i <= 24; i++) {
      const q = emberPoint(a.from, a.control, a.end, i / 24);
      ink.lineStyle(1, a.t < 1.4 ? GOLD : SAFE, 0.6).lineBetween(prev.x, prev.y, q.x, q.y);
      prev = q;
    }
    if (a.t < 2.2) return; // 0.8s of locked trajectory to get out of its way
    s.parallax.windTarget = g.galeDir * 55;
    const k = clamp((a.t - 2.2) / 1.6, 0, 1);
    const q = emberPoint(a.from, a.control, a.end, k);
    ink.fillStyle(WARN, 1).fillCircle(q.x, q.y, 6);
    ink.fillStyle(GOLD, 1).fillCircle(q.x, q.y, 3);
    if (segmentDistance(p, a.last ?? q, q) < 7) p.hit();
    a.last = q;
    if (k === 1) {
      if (Math.hypot(q.x - e.x, q.y - e.y) < 20) {
        this.encounterOpen(g, e, 4.5, 'PIECZĘĆ PĘKŁA!');
        g.take.body = 1.5;
        this.damage(e, 100);
      } else s.fx.text(90, guideY - 20, 'ŻAR CHYBIŁ', 1.5, GOLD);
      g.ember = null; g.timer = 1.6;
      s.parallax.windTarget = 0;
      e.play('sankibo');
    }
  },

  // Shot occupancy, rather than shot damage/count, charges every weapon at the same rate.
  bossDeviceHit(shot) {
    const g = this.bossGroup;
    if (!g || g.defeated || g.kind !== 'jaodori' || !g.launchers || g.parts[0].state !== 'fight') return false;
    for (const pad of g.launchers) {
      if (pad.cool > 0 || pad.rocket) continue;
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
    g.take = { body: g.open ? 1.5 : 0.12 };
    g.launchers ??= [38, 90, 142].map(x => ({ x, y: s.H - 83, charge: 0, cool: 0, litUntil: 0, rocket: null }));
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
      if (!pad.rocket && pad.cool <= 0 && pad.litUntil > g.t && s.player.alive && !s.player.entering) pad.charge = Math.min(1, pad.charge + dt);
      ink.fillStyle(0x28384e, 1).fillRoundedRect(pad.x - 12, pad.y - 9, 24, 18, 3);
      ink.lineStyle(1.5, pad.cool ? 0x777888 : GOLD, 1).strokeRect(pad.x - 12, pad.y - 9, 24, 18);
      ink.fillStyle(SAFE, 1).fillRect(pad.x - 10, pad.y + 5, 20 * pad.charge, 3);
      ink.lineStyle(2, GOLD, 1).lineBetween(pad.x, pad.y - 7, pad.x, pad.y - 17);
      if (pad.charge >= 1 && !pad.rocket && !(g.gate > 0)) {
        pad.charge = 0;
        pad.rocket = { t: 0 };
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
            this.encounterOpen(g, e, 4.5, 'FAJERWERK TRAFIŁ!');
            g.take.body = 1.5;
            this.damage(e, e.maxHp * 0.12);
            g.fireworkHits = (g.fireworkHits ?? 0) + 1;
          }
          pad.rocket = null; pad.cool = 2.5; pad.litUntil = 0;
        }
      }
    }
    if (g.open) ink.lineStyle(2, SAFE, 0.9).strokeCircle(e.x, e.y, 22);
    return busy || g.open > 0;
  },
};
