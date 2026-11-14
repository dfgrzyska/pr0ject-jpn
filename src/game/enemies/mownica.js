// Random encounter 7 (ex7): the weeping lectern. Methods of Enemies (mixed in like the cities'). A nod to the
// behaviour at a famous press conference (the hand cupped to the ear, the wailing, the desk banged, the arm waved,
// the train tickets), with no name, no likeness and no office: the boss is a lectern.
import Phaser from 'phaser';
import { DEPTH, VIEW } from '../../config.js';
import { slow, normal, DOWN, TAU } from './shared.js';

/**
 * The lectern (MOWNICA): life, where it stands, the phases' thresholds, how much bigger it is shown; how long it
 * holds its hand to its ear (and how often a shot comes back then), the tickets (how many to a throw, one in how many
 * stamped, how fast they flutter down).
 */
export const MOWNICA = {
  hp: 2400,
  home: 90,
  phase: [0.66, 0.33],
  scale: 1.5,
  deaf: { dur: 2.2, echo: 0.06 },
  tickets: { n: 9, stamped: 5, fall: 55 },
};

export const mownica = {
  /**
   * A press-conference lectern come to life, microphones fanned on top, a face on its front, white-gloved hands.
   * Three phases:
   * 1. HA? NANI?: it fires off answers at the player (fans); now and then it cups a hand to its ear and hears
   *    nothing: no shot hurts it then, and some come back at the player as echoes ("HA?");
   * 2. UAAA!: it wails: sobs of tears out of both eyes in arcs, the desk banged (a ring, the screen shakes), an
   *    arm waved about (a sweeping stream);
   * 3. ZMIENIĘ ŚWIAT!: it throws its train tickets about, numbered up and up; one in five is stamped for a day no
   *    train ran, and bursts.
   */
  spawnMownica(w, base) {
    const g = { kind: 'mownica', state: 'enter', t: 0, stage: 1, phase: 0, timer: 1.2, parts: [], awake: false, defeated: false, act: null, items: [], tickets: 0, deafT: 0, take: { body: 1 } };
    const body = this.pool.spawn('lect_0', 90, -60, { ...base, role: 'body', group: g, hp: MOWNICA.hp, maxHp: MOWNICA.hp, radius: 20 });
    body.setDepth(DEPTH.air - 0.1).setScale(body.base * MOWNICA.scale);
    g.body = body;
    g.parts.push(body);
    g.maxTotal = MOWNICA.hp;
    this.bossGroup = g;
    return body;
  },

  updateMownica(g, dt) {
    const s = this.scene;
    const e = g.body;
    g.t += dt;
    this.mownicaItems(g, dt);
    g.deafT = Math.max(0, g.deafT - dt);
    g.take.body = g.deafT > 0 ? 0 : 1;
    if (g.state === 'enter') {
      e.y += Math.max(14, (MOWNICA.home - e.y) * 1.4) * dt;
      if (e.y >= MOWNICA.home - 1) {
        Object.assign(g, { state: 'fight', awake: true, timer: 1 });
        s.fx.text(e.x, e.y - 50, '*SNIFF*', 0.8, 0x9ad8ff);
      }
      return this.mownicaPose(g);
    }
    const left = e.hp / e.maxHp;
    if (g.stage === 1 && left < MOWNICA.phase[0] && !g.act) {
      g.phase = 0;
      g.deafT = 0;
      this.phaseBreak(g, e.x, e.y, 2, 'UAAA!');
    } else if (g.stage === 2 && left < MOWNICA.phase[1] && !g.act) {
      g.phase = 0;
      this.phaseBreak(g, e.x, e.y, 3, 'ZMIENIĘ ŚWIAT!');
    }
    if (g.act) this.mownicaAct(g, dt);
    else if ((g.timer -= dt) <= 0 && this.canFire(e)) {
      const plan = [['answers', 'ear', 'answers', 'ear'], ['sob', 'bang', 'wave', 'sob'], ['tickets', 'sob', 'tickets', 'bang']][g.stage - 1];
      g.act = { kind: plan[g.phase++ % plan.length], t: 0, step: 0 };
    }
    // a sob shakes it now and then
    e.x = 90 + (g.stage >= 2 ? Math.sin(g.t * 30) * (Math.sin(g.t * 2) > 0.6 ? 1 : 0) : 0);
    this.mownicaPose(g);
  },

  mownicaDone(g, rest = 0.9) {
    g.act = null;
    g.timer = rest;
  },

  /** Its eyes, on the front panel (as shown, scaled). */
  mownicaEyes(g) {
    const e = g.body;
    const k = MOWNICA.scale / 3;
    return [-1, 1].map((sx) => [e.x + sx * 9 * k, e.y + (60 - 52) * k]);
  },

  mownicaAct(g, dt) {
    const s = this.scene;
    const b = s.bullets;
    const a = g.act;
    const pl = s.player;
    const e = g.body;
    a.t += dt;
    switch (a.kind) {
      case 'answers':
        // a fan of answers, three times; none of them answers anything
        if (a.t > a.step * 0.6) {
          a.step++;
          b.fan(e.x, e.y + 10, this.aimAt(e, 0, 10), 5, 0.9, normal);
          if (a.step === 2) s.fx.text(e.x, e.y - 50, ['...', 'IE...', 'TO...'][Math.floor(Math.random() * 3)], 0.7, 0xd8e8f0);
        }
        if (a.step >= 3) this.mownicaDone(g, 0.8);
        break;
      case 'ear':
        // the hand to the ear: it hears nothing, and some shots come back
        if (a.step === 0) {
          a.step = 1;
          g.deafT = MOWNICA.deaf.dur;
          s.fx.text(e.x - 30, e.y - 30, ['HA?', 'NANI?', 'HAA?'][Math.floor(Math.random() * 3)], 1, 0xffe080);
        }
        if (a.t > MOWNICA.deaf.dur) this.mownicaDone(g, 0.6);
        break;
      case 'sob':
        // sobs: arcs of tears out of both eyes, in bursts, as it gulps for breath
        if (a.t > a.step * 0.5) {
          a.step++;
          g.cryT = g.t + 0.45;
          for (const [i, [x, y]] of this.mownicaEyes(g).entries()) {
            const out = i ? 1 : -1;
            for (let k = 0; k < 4; k++) b.fire(x, y, DOWN + out * (0.25 + k * 0.22) + (Math.random() - 0.5) * 0.08, slow * (0.9 + k * 0.1));
          }
          if (a.step % 2) s.fx.text(e.x + (Math.random() - 0.5) * 30, e.y - 50, a.step === 1 ? 'UAAA...' : 'UAAAAA!', 0.8, 0x9ad8ff);
        }
        if (a.step >= (g.stage === 3 ? 3 : 4)) this.mownicaDone(g, 0.8);
        break;
      case 'bang':
        // both fists up... and down on the desk: a ring, the screen shakes
        if (a.step === 0 && a.t > 0.5) {
          a.step = 1;
          g.bangT = g.t - 1; // (fists up until now)
          b.ring(e.x, e.y + 20, 16, Math.random() * TAU, normal);
          b.ring(e.x, e.y + 20, 8, Math.random() * TAU, slow);
          s.cameras.main.shake(250, 0.008);
          s.fx.text(e.x, e.y + 40, 'DON!', 1, 0xffffff);
        }
        if (a.step === 0) g.bangT = g.t + 0.1;
        if (a.t > 1.3) this.mownicaDone(g, 0.8);
        break;
      case 'wave': {
        // an arm flung about: a stream of shots swept back and forth
        g.waveT = g.t + 0.1;
        const k = Math.sin(a.t * 3.2);
        if (a.t > a.step * 0.07) {
          a.step++;
          b.fire(e.x + 20, e.y - 10, DOWN + k * 0.9, normal);
        }
        if (a.t > 2) this.mownicaDone(g, 0.9);
        break;
      }
      case 'tickets':
        // the tickets, numbered up and up, fluttering down; the stamped ones burst
        if (a.t > a.step * 0.18) {
          a.step++;
          g.tickets++;
          const stamped = g.tickets % MOWNICA.tickets.stamped === 0;
          const tx = Phaser.Math.Clamp(pl.x + (Math.random() - 0.5) * 150, 10, VIEW.width - 10);
          this.mownicaTicket(g, e.x, e.y - 10, tx, stamped);
          if (a.step === 1 || stamped) s.fx.text(e.x + (Math.random() - 0.5) * 40, e.y - 50, `#${Math.min(195, g.tickets)}`, 0.7, stamped ? 0xff8a6a : 0xffffff);
        }
        if (a.step >= MOWNICA.tickets.n) this.mownicaDone(g, 1);
        break;
      default:
        this.mownicaDone(g);
    }
  },

  mownicaTicket(g, x, y, tx, stamped) {
    const frame = stamped ? 'ticket_x' : 'ticket_0';
    if (!g.body.texture.has(frame)) return;
    const spr = this.segPool.spawn(frame, x, y).setDepth(DEPTH.air + 0.04);
    g.items.push({ spr: spr.setScale(spr.base * 1.4), stamped, vx: (tx - x) * 1.2, vy: -60, t: 0, burstY: this.scene.H * (0.45 + Math.random() * 0.3), ph: Math.random() * TAU });
  },

  /** The tickets: thrown up, then fluttering down side to side; the stamped ones burst into a ring. */
  mownicaItems(g, dt) {
    const s = this.scene;
    const pl = s.player;
    let n = 0;
    for (const it of g.items) {
      it.t += dt;
      const sp = it.spr;
      it.vx *= Math.max(0, 1 - dt * 1.5);
      it.vy = Math.min(MOWNICA.tickets.fall, it.vy + 160 * dt);
      sp.x += (it.vx + Math.sin(it.t * 4 + it.ph) * 40) * dt;
      sp.y += it.vy * dt;
      if (!it.stamped) sp.setFrame(Math.floor(it.t * 6 + it.ph) % 2 ? 'ticket_1' : 'ticket_0');
      let gone = false;
      if (it.stamped && it.vy > 0 && sp.y > it.burstY) {
        s.bullets.ring(sp.x, sp.y, 10, Math.random() * TAU, slow);
        s.fx.text(sp.x, sp.y - 10, 'UNKYŪ!', 0.6, 0xff8a6a);
        gone = true;
      } else if (pl.alive && Math.abs(pl.x - sp.x) < 7 && Math.abs(pl.y - sp.y) < 5) {
        pl.hit();
        gone = true;
      }
      if (gone || sp.y > s.H + 20) {
        this.segPool.kill(sp);
        continue;
      }
      g.items[n++] = it;
    }
    g.items.length = n;
  },

  /** While its hand is at its ear the player's shots do nothing, and now and then one comes back as an echo. */
  mownicaDeaf(shot) {
    const g = this.bossGroup;
    if (!g || g.kind !== 'mownica' || g.defeated || g.deafT <= 0) return false;
    const e = g.body;
    if (Math.abs(shot.x - e.x) > 26 || Math.abs(shot.y - e.y) > 34) return false;
    if (Math.random() < MOWNICA.deaf.echo && this.canFire(e)) this.scene.bullets.fire(shot.x, shot.y + 4, this.aimAt({ x: shot.x, y: shot.y }), slow);
    return true;
  },

  mownicaPose(g) {
    const e = g.body;
    let frame = 'lect_0';
    if (g.deafT > 0) frame = 'lect_ear';
    else if (g.t < (g.bangT ?? 0)) frame = 'lect_bang';
    else if (g.t < (g.waveT ?? 0)) frame = 'lect_wave';
    else if (g.t < (g.cryT ?? 0) || g.stage >= 2) frame = 'lect_cry';
    if (e.texture.has(frame) && e.frame.name !== frame) e.setFrame(frame);
  },

  mownicaCleanup(g) {
    for (const it of g.items) this.segPool.kill(it.spr);
    g.items = [];
  },
};
