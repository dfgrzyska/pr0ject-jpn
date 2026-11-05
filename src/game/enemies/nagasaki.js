import { DEPTH } from '../../config.js';
import { volley } from '../../difficulty.js';
import { DOWN, slow, normal } from './shared.js';

export const nagasaki = {
  biidoro(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(10, (e.stopY - e.y) * 2) * dt;
      if (e.y >= e.stopY - 1) { e.state = 'attack'; e.timer = .8; }
    } else if (e.state === 'attack') {
      e.timer -= dt;
      if (e.timer < 0 && this.canFire(e)) {
        const n = volley(5);
        for (let i = 0; i < n; i++) b.shot('eb_s', e.x, e.y + 7, DOWN + (i - (n - 1) / 2) * .28, slow, 1.8,
          { frz: { at: .65, hold: .35, turn: e.dir * .45, speed: normal } });
        e.timer = 1.8;
        if (++e.shots === 3) e.state = 'leave';
      }
    } else { e.y -= 45 * dt; e.x += e.dir * 12 * dt; }
  },
  hata(e, dt) {
    if (e.state === 'enter') {
      e.y += 38 * dt;
      if (e.age > 1) { e.state = 'hook'; e.timer = .7; }
    } else if (e.state === 'hook') {
      e.timer -= dt; e.x = Math.max(12, Math.min(168, e.x + e.dir * 58 * dt));
      e.rotation = e.dir * .4;
      if (e.timer <= 0) { e.state = 'aim'; e.timer = .55; }
    } else this.diver(e, dt);
  },
  oranda(e, dt, b) {
    if (e.state === 'enter') {
      e.y += Math.max(12, (68 - e.y) * 1.4) * dt;
      if (e.y >= 67) { e.state = 'fight'; e.timer = 1; e.step = 0; }
      return;
    }
    if (e.age > 34) { e.state = 'leave'; e.y -= 45 * dt; return; }
    e.x = 90 + Math.sin(e.age * .55) * 36;
    e.rotation = Math.sin(e.age * 1.7) * .05;
    e.timer -= dt;
    const side = e.step % 2 ? -1 : 1;
    if (e.timer < .65) {
      this.tele.lineStyle(1, 0xf2c35e, .5);
      this.tele.lineBetween(e.x + side * 22, e.y + 8, e.x + side * 54, e.y + 85);
    }
    if (e.timer <= 0 && this.canFire(e)) {
      b.fan(e.x + side * 22, e.y + 9, DOWN - side * .5, 5, .65, normal);
      b.fan(e.x - side * 22, e.y + 9, DOWN + side * .7, 3, .4, slow);
      e.timer = 1.5; e.step++;
    }
  },
  spawnJaodori(w, base) {
    const g = { kind: 'jaodori', t: 0, phase: 0, step: 0, timer: 1.3, parts: [], defeated: false };
    const e = this.pool.spawn('n_ja_0', 90, -30, { ...base, group: g, radius: 15 });
    e.play('n_ja'); g.parts.push(e); g.maxTotal = e.maxHp;
    // Decorative puppet body has no collision: the clearly exposed head is the target.
    g.body = Array.from({ length: 9 }, () => this.segPool.spawn('n_segment', 90, -60));
    g.pearl = this.segPool.spawn('n_pearl', 90, -40).setDepth(DEPTH.air - .05);
    this.bossGroup = g;
    return e;
  },
  updateJaodori(g, dt) {
    const e = g.parts[0];
    if (e.dead || e.hp <= 0) return;
    g.t += dt;
    if (e.state === 'enter') {
      e.y += 32 * dt;
      if (e.y >= 72) e.state = 'fight';
    } else {
      e.x = 90 + Math.sin(g.t * .64) * 53;
      e.y = 73 + Math.sin(g.t * 1.1) * 14;
    }
    g.pearl.setPosition(e.x + Math.cos(g.t * 1.3) * 27, e.y + 28);
    for (let i = 0; i < g.body.length; i++) {
      const p = g.body[i], target = i ? g.body[i - 1] : e;
      p.x += (target.x - p.x) * Math.min(1, dt * 9);
      p.y += (target.y - 5 - p.y) * Math.min(1, dt * 9);
      p.setScale(1 - i * .045);
    }
    if (e.state === 'enter' || !this.canFire(e)) return;
    g.timer -= dt;
    const b = this.scene.bullets;
    if (g.phase % 3 === 2 && g.step === 0) {
      const lane = 30 + (Math.floor(g.t / 2) % 3) * 60;
      if (g.lane == null) g.lane = lane;
      this.tele.lineStyle(2, 0x92d8b5, .5);
      this.tele.lineBetween(g.lane, 100, g.lane, this.scene.H);
    }
    if (g.timer > 0) return;
    if (g.phase % 3 === 0) {
      b.fan(g.pearl.x, g.pearl.y, this.aimAt(g.pearl), 5, .72, slow);
      g.timer = .8;
      if (++g.step >= 5) { g.phase++; g.step = 0; g.timer = 1.2; }
    } else if (g.phase % 3 === 1) {
      for (const side of [-1, 1]) b.shot('eb_s', e.x + side * 13, e.y + 12,
        DOWN + side * (.3 + Math.sin(g.step * .25) * .6), normal, 1.8, { wig: .22, wf: 3 });
      g.timer = .18;
      if (++g.step >= 20) { g.phase++; g.step = 0; g.timer = 1.4; g.lane = null; }
    } else {
      // Fixed wide safe lane, announced before the first row. No aiming after commitment.
      const n = volley(11);
      for (let i = 0; i < n; i++) {
        const x = 10 + i * 160 / (n - 1);
        if (Math.abs(x - g.lane) > 19) b.shot('eb_s', x, 10, DOWN, slow, 1.8);
      }
      g.timer = .75;
      if (++g.step >= 3) { g.phase++; g.step = 0; g.timer = 1.5; }
    }
  },
};
