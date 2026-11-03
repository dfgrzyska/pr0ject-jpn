// Sapporo: the lanterns' ice shells, flying squirrels, snowplows, Yuki-onna (the miniboss) and the Snow Festival bear (the boss).
// Methods of Enemies (src/game/Enemies.js mixes them in), so `this` is the enemies of the stage.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

export const sapporo = {
  /** The ice lantern's shell breaks: the bare flame flares up and fires faster. */
  shatter(e) {
    const s = this.scene;
    e.armor = 0;
    e.radius = 6;
    e.play('wisp');
    s.fx.shards(e.x, e.y, 12);
    s.sfx.explode('s');
    if (e.state === 'leave') {
      e.state = 'attack';
      e.shots = 0;
    }
    e.shots += 2;
    e.timer = Math.max(e.timer, 0.45);
  },

  /**
   * Flying squirrel: hops in from the trees at a screen edge, blinks, then glides across in a swoop
   * that dips towards the player's height (never into the bottom quarter), and does it once more.
   */
  glide(e, dt) {
    const W = VIEW.width;
    const s = this.scene;
    if (e.state === 'enter') {
      const edge = e.dir > 0 ? 8 : W - 8;
      e.x += (edge - e.x) * Math.min(1, dt * 8);
      e.setFlipX(e.dir < 0);
      e.timer -= dt;
      if (e.timer <= 0) {
        e.state = 'cling';
        e.timer = 0.45;
      }
    } else if (e.state === 'cling') {
      e.timer -= dt;
      e.flash = Math.floor(e.timer * 20) % 2 ? 0.02 : 0;
      if (e.timer <= 0) {
        e.state = 'leap';
        e.k = 0;
        e.xs = e.x;
        e.ys = e.y;
        e.yt = Phaser.Math.Clamp(s.player.y, e.ys + 30, s.H * 0.72);
        e.play('momonga');
      }
    } else if (e.state === 'leap') {
      e.k += dt / 1.7;
      const k = Math.min(1, e.k);
      const xe = e.dir > 0 ? W - 8 : 8;
      e.x = e.xs + (xe - e.xs) * k;
      e.y = e.ys + (e.yt - e.ys) * Math.sin(Math.PI * k) + 16 * k;
      if (k >= 1) {
        e.leaps++;
        e.dir = -e.dir;
        if (e.leaps >= 2) {
          e.state = 'leave';
          e.vy = 30;
        } else {
          e.state = 'cling';
          e.timer = 0.5;
          e.anims.stop();
          e.setFrame('momonga_2').setFlipX(e.dir < 0);
        }
      }
    } else {
      // last glide: off the far side and down
      e.x += -e.dir * 90 * dt;
      e.y += e.vy * dt;
    }
  },

  /**
   * Rotary snowplough: drives along its street (down an avenue faster than the scroll, or across)
   * and sweeps its chute back and forth, throwing a stream of snow pellets. The chute shows the aim.
   */
  plow(e, dt, b) {
    const s = this.scene;
    if (e.horiz) e.x += e.dir * 22 * dt;
    else e.u -= 16 * dt;
    e.y = s.parallax.screenY(e.u);
    const ang = DOWN + Math.sin(e.age * 1.3) * 1.0;
    const th = Math.atan2(-Math.cos(ang), Math.sin(ang));
    const i = ((Math.round(th / (TAU / 16)) % 16) + 16) % 16;
    const hx = e.horiz ? e.x + e.dir * 5 : e.x;
    const hy = e.horiz ? e.y : e.y + 4;
    e.head.setFrame(`${this.skin.plow.chute}${i}`).setPosition(hx, hy);
    if (!this.canFire(e)) return;
    if (e.spray > 0) {
      e.spray -= dt;
      e.cool -= dt;
      if (e.cool <= 0) {
        e.cool = 0.11;
        b.fire(hx + Math.cos(ang) * 4, hy + Math.sin(ang) * 4, ang, slow);
      }
    } else if ((e.timer -= dt) <= 0) {
      e.spray = 1.6;
      e.timer = 1.4;
    }
  },

  /**
   * Yuki-onna: appears in the blizzard, fades out and back in somewhere else between attacks
   * (shots pass through her while she is mist). Freezing snowflakes, wind-blown fans, falling icicles.
   */
  yukiOnna(e, dt, b) {
    const s = this.scene;
    if (e.state === 'enter') {
      e.y += Math.max(6, (70 - e.y) * 0.8) * dt;
      if (e.y >= 69) Object.assign(e, { state: 'fight', fight: 0, timer: 0.8, patternIndex: 0, step: 0, homeX: e.x, blink: null });
      return;
    }
    if (e.state === 'leave') {
      e.setAlpha(Math.max(0, e.alpha - dt * 0.8));
      e.ghost = e.alpha < 0.5;
      s.parallax.windTarget = 0;
      if (e.alpha <= 0) this.remove(e);
      return;
    }
    e.fight += dt;
    if (e.fight > 34) {
      e.state = 'leave';
      return;
    }
    if (e.blink) {
      const k = (e.blink.t += dt);
      if (k < 0.35) e.setAlpha(1 - k / 0.35);
      else if (k < 0.7) {
        e.x = e.homeX = e.blink.x;
        e.y = e.blink.y;
        e.setAlpha((k - 0.35) / 0.35);
      } else {
        e.setAlpha(1);
        e.blink = null;
      }
      e.ghost = !!e.blink && e.alpha < 0.6;
      return;
    }
    e.x = e.homeX + 6 * Math.sin(e.fight * 1.1);
    e.timer -= dt;
    if (e.timer > 0 || !this.canFire(e)) return;
    const next = (n) => {
      if (++e.step < n) return;
      e.patternIndex++;
      e.step = 0;
      e.timer = 1.1;
      s.parallax.windTarget = 0;
      e.blink = { t: 0, x: 40 + Math.random() * 100, y: 58 + Math.random() * 30 };
    };
    switch (e.patternIndex % 3) {
      case 0: {
        // six arms of bullets stop into a snowflake, hang, then drift on with a twist
        const rot = e.step * 0.3 + Math.random() * 0.3;
        for (let arm = 0; arm < 6; arm++)
          for (let k = 0; k < 4; k++)
            b.shot('eb_s', e.x, e.y + 6, rot + (arm / 6) * TAU, 40 + k * 22, 1.8, { frz: { at: 0.55, hold: 0.7, turn: e.step % 2 ? -0.45 : 0.45, speed: slow } });
        e.timer = 1.6;
        next(3);
        break;
      }
      case 1: {
        // blizzard: aimed bursts blown sideways by the wind (the snow shows which way it blows)
        const wind = Math.floor(e.step / 6) % 2 ? 36 : -36;
        s.parallax.windTarget = wind * 1.4;
        const a = this.aimAt(e, 0, 8);
        for (const d of [-0.25, 0, 0.25]) b.shot('eb_s', e.x, e.y + 8, a + d - wind * 0.006, normal, 1.8, { ax: wind, maxV: 95 });
        e.timer = 0.24;
        next(12);
        break;
      }
      default:
        // icicles appear along the top, blink, then fall
        for (let k = 0; k < 5; k++) b.shot('icicle', 10 + ((k + Math.random() * 0.8) / 5) * (VIEW.width - 20), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
        b.ring(e.x, e.y + 4, 10, e.step * 0.3, slow);
        e.timer = 0.8;
        next(4);
    }
  },

  // ---------------------------------------------------------------- boss: the Snow Festival bear
  /**
   * Phase 1: an ice sculpture of a rearing bear rides in on its pedestal and wakes when the scroll stops.
   * Both paws and the ice heart are separate targets; the sculpture's body is solid ice. Breaking the
   * heart shatters the sculpture: phase 2 is the brown higuma that was inside.
   */
  spawnKuma(w, base) {
    const s = this.scene;
    const y = -36;
    const u = s.parallax.stripU(y);
    const g = { kind: 'kuma', state: 'dormant', t: 0, phase: 0, step: 0, timer: 1, parts: [], enraged: false, defeated: false };
    Object.assign(g, { awake: false, stage: 1, home: w.x, homeY: 76, restY: 0, roar: 0, body: null });
    const part = (frame, role, dx, dy, hp, radius, pts) => {
      const e = this.pool.spawn(frame, w.x + dx, y + dy, { ...base, role, dx, dy, u, hp, maxHp: hp, radius, pts, group: g, invuln: true, ground: true });
      e.setDepth(DEPTH.ground + (role === 'body' ? 0.3 : 0.35));
      g.parts.push(e);
      return e;
    };
    // parts before the body, so shots reach them first
    part('kuma_heart_0', 'heart', 0, 4, 330, 6, 6000).play('kuma_heart');
    part('kuma_paw', 'paw', -22, -13, 165, 7, 3000).setFlipX(true);
    part('kuma_paw', 'paw', 22, -13, 165, 7, 3000);
    g.body = part('kuma_ice', 'body', 0, 0, 770, 20, 0);
    g.body.pass = true; // shots go through the ice to reach the paws and the heart
    g.maxTotal = g.parts.reduce((sum, p) => sum + p.maxHp, 0);
    this.bossGroup = g;
    return g.body;
  },

  updateKuma(g, dt) {
    const s = this.scene;
    const alive = g.parts.filter((p) => !p.dead && p.group === g && p.hp > 0);
    const body = g.body;
    const place = (x, y) => {
      for (const p of alive) {
        p.x = x + p.dx;
        p.y = y + p.dy;
      }
    };
    if (g.state === 'dormant') {
      place(g.home, s.parallax.screenY(body.u));
      if (s.parallax.time >= s.parallax.maxTime - 1e-3) {
        g.state = 'wake';
        g.t = 0;
        g.restY = body.y;
        s.cameras.main.shake(1300, 0.005);
      }
      return;
    }
    g.t += dt;
    g.roar -= dt;
    if (g.stage === 2) body.setFrame(g.roar > 0 ? 'kuma_1' : 'kuma_0');
    if (g.state === 'wake') {
      // shakes off the snow, then rises from the pedestal into the air
      const k = Math.max(0, Math.min(1, (g.t - 1.3) / 1.2));
      place(g.home + (g.t < 1.3 ? Math.round(Math.random() * 2 - 1) : 0), g.restY + (g.homeY - g.restY) * k * k * (3 - 2 * k));
      if (Math.random() < dt * 14) s.fx.shards(body.x + (Math.random() - 0.5) * 50, body.y + (Math.random() - 0.5) * 44, 2, true);
      if (g.t >= 1.3 && body.ground)
        for (const p of alive) {
          p.ground = false;
          p.setDepth(DEPTH.air - (p.role === 'body' ? 0.2 : 0.1));
        }
      if (g.t >= 2.5) {
        g.state = 'fight';
        g.awake = true;
        g.t = 0;
        g.timer = 0.6;
        for (const p of alive) if (p.role !== 'body') p.invuln = false;
      }
      return;
    }
    if (g.state === 'break') {
      // the ice falls away and the real bear roars
      place(g.home + Math.round(Math.random() * 2 - 1), g.homeY);
      if (g.t >= 1.4) {
        g.state = 'fight';
        g.t = 0;
        g.timer = 0.5;
        body.invuln = false;
        body.pass = false;
      }
      return;
    }
    const sp = g.enraged ? 1.5 : 1;
    place(g.home + (g.stage === 1 ? 12 : 26) * Math.sin(g.t * 0.5 * sp), g.homeY + 4 * Math.sin(g.t * 0.9 * sp));
    if (g.stage === 2 && !g.enraged && body.hp < body.maxHp * 0.35) {
      g.enraged = true;
      g.timer = 0.5;
      g.roar = 1;
      s.hud.show('', 'NIEDŹWIEDŹ WPADA W SZAŁ!', 1.6, true);
    }
    g.timer -= dt * (g.enraged ? 1.4 : 1);
    if (g.timer > 0) return;
    if (g.stage === 1) this.kumaIce(g, alive);
    else this.kumaBear(g, body);
  },

  /** Phase 1: paw swipes, heart pulses, a frozen snowflake from the heart while the paws lob snowballs. */
  kumaIce(g, alive) {
    const b = this.scene.bullets;
    const pl = this.scene.player;
    const heart = alive.find((e) => e.role === 'heart');
    const paws = alive.filter((e) => e.role === 'paw');
    const can = (e) => e && this.canFire(e);
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 1;
    };
    switch (g.phase % 3) {
      case 0: {
        const paw = paws[g.step % Math.max(1, paws.length)];
        if (can(paw)) b.fan(paw.x, paw.y + 5, this.aimAt(paw, 0, 5), 7, 1.0, normal);
        else if (can(heart)) b.fan(heart.x, heart.y, this.aimAt(heart), 5, 0.7, normal);
        g.timer = 0.6;
        if (++g.step >= 6) next();
        break;
      }
      case 1:
        if (can(heart)) b.ring(heart.x, heart.y, 14, g.step * 0.22, slow, g.step % 2 === 1);
        g.timer = 0.85;
        if (++g.step >= 4) next();
        break;
      default:
        if (can(heart))
          for (let arm = 0; arm < 6; arm++)
            for (let k = 0; k < 3; k++)
              b.shot('eb_s', heart.x, heart.y, g.step * 0.5 + (arm / 6) * TAU, 34 + k * 22, 1.8, { frz: { at: 0.55, hold: 0.6, turn: 0.4, speed: slow } });
        for (const paw of paws) if (can(paw)) b.lob(paw.x, paw.y, Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 40, 10, VIEW.width - 10), pl.y, 1.1);
        g.timer = 1.3;
        if (++g.step >= 3) next();
    }
  },

  /** Phase 2: roaring rings, alternating paw swipes, thrown salmon with icicles falling from above. */
  kumaBear(g, body) {
    const s = this.scene;
    const b = s.bullets;
    if (!this.canFire(body)) {
      g.timer = 0.2;
      return;
    }
    const next = () => {
      g.phase++;
      g.step = 0;
      g.timer = 0.9;
    };
    switch (g.phase % 3) {
      case 0:
        if (g.step === 0) {
          g.roar = 1.4;
          s.cameras.main.shake(500, 0.004);
        }
        b.ring(body.x, body.y + 14, g.enraged ? 22 : 18, g.step * 0.17, g.step % 2 ? normal : slow, g.step === 1);
        g.timer = 0.45;
        if (++g.step >= 3) next();
        break;
      case 1: {
        const side = g.step % 2 ? 1 : -1;
        b.fan(body.x + side * 24, body.y - 15, this.aimAt(body, side * 24, -15), g.enraged ? 13 : 11, 1.4, normal);
        g.timer = 0.5;
        if (++g.step >= 6) next();
        break;
      }
      default: {
        const a = this.aimAt(body, 0, 14);
        const n = g.enraged ? 5 : 3;
        for (let i = 0; i < n; i++) b.shot('salmon', body.x, body.y + 14, a + (i / (n - 1) - 0.5) * 0.7, 64, 2.2, { wig: 5, wf: 8, spin: true });
        for (let k = 0; k < 4; k++) b.shot('icicle', 12 + Math.random() * (VIEW.width - 24), 8, DOWN, 0, 1.8, { ay: 150, maxV: 150, safe: 0.7 });
        g.timer = 0.85;
        if (++g.step >= 4) next();
      }
    }
  },

  /** A paw or the heart of the sculpture breaks off. The heart takes the whole sculpture with it. */
  kumaPartDown(e) {
    const s = this.scene;
    const g = e.group;
    const pts = e.pts * s.score.mult;
    s.score.add(pts);
    s.fx.explode(e.x, e.y, 'm');
    s.fx.shards(e.x, e.y, 16);
    s.fx.text(e.x, e.y - 12, `${pts}`, 1.2, 0xffe080);
    this.remove(e);
    if (e.role !== 'heart') return;
    for (const p of g.parts)
      if (!p.dead && p.group === g && p.role === 'paw') {
        s.fx.explode(p.x, p.y, 's');
        s.fx.shards(p.x, p.y, 10);
        p.hp = 0;
        this.remove(p);
      }
    Object.assign(g, { stage: 2, state: 'break', t: 0, phase: 0, step: 0, roar: 1.6 });
    g.body.radius = 20;
    s.bullets.cancelAll(s.fx);
    s.fx.flash(0.7, 0.5);
    s.fx.shards(g.body.x, g.body.y, 40);
    s.cameras.main.shake(700, 0.006);
    s.hud.show('LÓD PĘKA!', 'TO PRAWDZIWY NIEDŹWIEDŹ!', 2.2);
  },
};
