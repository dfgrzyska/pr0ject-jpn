import Phaser from 'phaser';
import { DEPTH, RENDER_SCALE, VIEW } from '../config.js';
import { RARITIES, RARITY, SHOT_FRAMES } from '../data/gacha.js';
import { BALL as BALL_FRAME, MACHINE } from '../data/gachaLayout.js';
import { pixelText } from './Hud.js';
import { pool, pull } from './Loadout.js';
import { sharedArt } from './enemyArt.js';

// The gachapon, off the title screen: a ticket in the slot, a turn of the crank, and a capsule rolls out, cracks
// open and shows what it held, in a glow of its rarity's colour. The machine holds one capsule for every part not
// yet won, so it empties as the player goes; what lies under the glass is a sample of what is left.
const FINE = 1 / RENDER_SCALE; // the art is drawn at 540 px
const W = VIEW.width;
const MX = (W - MACHINE.w * FINE) / 2; // the machine's left edge
const SHOWN = 30; // capsules under the glass at most
const BALL = (BALL_FRAME * FINE) / 2 - 0.4; // their radius, in game units (they overlap a touch: no gaps between them)
const RAINBOW = [0xff5a5a, 0xffb040, 0xfff060, 0x6ae486, 0x5cacf2, 0xb070f0];
const KIND = { hull: 'KADŁUB', engine: 'SILNIK', gun: 'DZIAŁO', bomb: 'BOMBA', core: 'RDZEŃ', omamori: 'OMAMORI', paint: 'MALOWANIE', flame: 'PŁOMIEŃ', dye: 'BARWNIK', wake: 'ŚLAD', shot_basic: 'POCISKI', shot_spread: 'POCISKI', shot_laser: 'POCISKI', shot_homing: 'POCISKI', eb_color: 'WROGIE POCISKI', eb_shape: 'WROGIE POCISKI', marker: 'ZNACZNIK', blast: 'WYBUCHY', bomb_look: 'WYGLĄD BOMBY', title: 'TYTUŁ PILOTA', sound: 'DŹWIĘK', graze: 'ISKRA', hud_color: 'LICZNIK', life_icon: 'IKONA ŻYCIA', companion: 'TOWARZYSZ', shot_turret: 'POCISKI', shield: 'TARCZA', decal: 'NAKLEJKA', card: 'KARTA' };
// how long each step of a draw takes, s (a draw of ten runs them at half the time)
const TIME = { ticket: 0.55, crank: 1.0, shake: 0.85, open: 0.4 };
const ease = (k) => k * k * (3 - 2 * k);

export class Gacha {
  constructor(scene, loadout, save) {
    this.scene = scene;
    this.loadout = loadout;
    this.save = save;
    this.t = 0;
    this.phase = 'idle';
    this.pt = 0; // s into the phase
    this.queue = 0; // draws still to come (a draw of ten)
    this.fast = false;
    this.items = [];
    const d = DEPTH.overlay + 1;
    const add = (o, depth = d) => {
      this.items.push(o);
      return o.setDepth(depth);
    };
    this.bg = add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0a1024).setOrigin(0), d - 0.5);
    this.cloth = add(scene.add.tileSprite(0, 0, W, VIEW.maxHeight, 'menu_waves').setTileScale(FINE, FINE).setOrigin(0).setAlpha(0.22), d - 0.4);
    this.floor = add(scene.add.graphics(), d - 0.2);
    this.neko = add(scene.add.image(0, 0, 'gacha', 'neko_0').setOrigin(0.5, 1).setScale(FINE), d + 1);
    this.machine = add(scene.add.image(MX, 0, 'gacha', 'machine').setOrigin(0).setScale(FINE), d + 1);
    this.lamps = MACHINE.lamps.map(() => add(scene.add.image(0, 0, 'sprites', 'glow').setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb030).setScale(0.5), d + 1.2));
    this.balls = [];
    this.glass = add(scene.add.image(MX + MACHINE.window.x0 * FINE, 0, 'gacha', 'glass').setOrigin(0).setScale(FINE), d + 3);
    this.crank = add(scene.add.image(MX + MACHINE.dial.x * FINE, 0, 'gacha', 'crank').setScale(FINE), d + 2);
    this.ticket = add(scene.add.image(0, 0, 'gacha', 'ticket').setScale(FINE).setVisible(false), d + 4);
    // the top line: back, the title, the tickets in hand
    this.back = add(pixelText(scene, 27, 12, '< WRÓĆ'), d + 5);
    this.title = add(pixelText(scene, W / 2, 12, 'GACHAPON').setTint(0xffd6e5), d + 5);
    this.ticketIcon = add(scene.add.image(150, 12, 'gacha', 'ticket').setScale(FINE * 0.67), d + 5);
    this.count = add(pixelText(scene, 176, 12, '', 1).setOrigin(1, 0.5).setTint(0xffe080), d + 5);
    // the two buttons, what is left in the machine, a hint
    this.btn = add(scene.add.graphics(), d + 5);
    this.btnText = ['LOSUJ', 'LOSUJ ×10'].map((s) => add(pixelText(scene, 0, 0, s), d + 5.1));
    this.left = add(pixelText(scene, W / 2, 0, '').setTint(0x9aaec2), d + 5);
    this.hint = add(pixelText(scene, W / 2, 0, '').setTint(0x6a7a92), d + 5);
    this.focus = 0;
    // the capsule that comes out, whole and in halves; the glow under it
    this.cap = add(scene.add.image(0, 0, 'gacha', 'cap_N').setScale(FINE).setVisible(false), d + 6);
    this.halves = ['top', 'bottom'].map((h) => add(scene.add.image(0, 0, 'gacha', `cap_N_${h}`).setScale(FINE).setVisible(false), d + 6));
    // the prize: the screen dimmed, rays turning behind it, a ring, sparkles, its picture and what it is
    this.dim = add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x05060e).setOrigin(0).setAlpha(0), d + 7);
    this.rays = add(scene.add.graphics().setBlendMode(Phaser.BlendModes.ADD), d + 7.5);
    this.flash = add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0xffffff).setOrigin(0).setAlpha(0), d + 9);
    this.sparks = Array.from({ length: 22 }, () => add(scene.add.image(0, 0, 'gacha', 'sparkle').setScale(FINE).setVisible(false), d + 8.5));
    this.stars = [0, 1, 2, 3, 4].map(() => add(scene.add.image(0, 0, 'gacha', 'sparkle').setScale(FINE * 0.67).setVisible(false), d + 8.2));
    this.prize = null; // the picture, made for each prize
    this.kind = add(pixelText(scene, W / 2, 0, '').setTint(0x9aaec2).setVisible(false), d + 8.2);
    this.rarity = add(pixelText(scene, W / 2, 0, '').setVisible(false), d + 8.2);
    this.name = add(pixelText(scene, W / 2, 0, '').setVisible(false), d + 8.2);
    this.info = add(pixelText(scene, W / 2, 0, '').setTint(0xb8c4d4).setVisible(false), d + 8.2);
    this.more = add(pixelText(scene, W / 2, 0, '').setTint(0xffe080).setVisible(false), d + 8.2);
    this.layout(scene.H);
    this.fill();
    this.refresh();
  }

  layout(H) {
    this.H = H;
    for (const o of [this.bg, this.cloth, this.dim, this.flash]) o.setSize(W, H);
    const my = Math.round(46 + (H - 320) * 0.3); // the machine's top (the cat sits above it)
    const dy = my - (this.my ?? my);
    this.my = my;
    this.machine.y = my;
    this.neko.setPosition(MX + MACHINE.neko.x * FINE, my + MACHINE.neko.y * FINE);
    this.glass.y = my + MACHINE.window.y0 * FINE;
    this.crank.y = my + MACHINE.dial.y * FINE;
    this.lamps.forEach((l, i) => l.setPosition(MX + MACHINE.lamps[i].x * FINE, my + MACHINE.lamps[i].y * FINE));
    this.floorY = my + MACHINE.h * FINE + 24; // where the capsule comes to rest
    this.box = { x0: MX + MACHINE.window.x0 * FINE, y0: my + MACHINE.window.y0 * FINE, x1: MX + MACHINE.window.x1 * FINE, y1: my + MACHINE.window.y1 * FINE };
    for (const b of this.balls) b.y += dy;
    this.btnY = H - 58;
    this.btnText.forEach((t, i) => t.setPosition(i ? 131 : 49, this.btnY));
    this.left.y = H - 30;
    this.hint.y = H - 12;
    this.cy = Math.round(H * 0.4); // the prize's centre
    this.drawFloor();
  }

  drawFloor() {
    const g = this.floor.clear();
    const y = this.my + MACHINE.h * FINE;
    // the light the machine stands in: rings of it, fading outwards
    for (let i = 0; i < 12; i++) g.fillStyle(0xffb878, 0.028).fillEllipse(W / 2, this.my + 74, 250 - i * 17, 300 - i * 20);
    g.fillStyle(0x060a18, 0.85).fillRect(0, y - 2, W, this.H - y + 2);
    g.fillStyle(0x24345c, 1).fillRect(0, y - 2, W, 1);
    g.fillStyle(0x000000, 0.4).fillEllipse(W / 2, y + 1, 96, 9);
    // floor boards running away from us
    for (let i = -6; i <= 6; i++) g.lineStyle(1, 0x121c38, 0.9).lineBetween(W / 2 + i * 13, y, W / 2 + i * 30, this.H);
  }

  // ---------------------------------------------------------------- the capsules under the glass
  /** Put a sample of what the machine still holds under the glass. */
  fill() {
    for (const b of this.balls) b.img.destroy();
    const left = Phaser.Utils.Array.Shuffle([...pool(this.loadout)]).slice(0, SHOWN);
    const { x0, x1, y1 } = this.box;
    this.balls = left.map((it, i) => {
      const img = this.scene.add.image(0, 0, 'gacha', `ball_${it.rarity}`).setScale(FINE).setDepth(DEPTH.overlay + 3.5);
      return { img, rarity: it.rarity, x: x0 + BALL + Math.random() * (x1 - x0 - BALL * 2), y: y1 - BALL - (i % 8) * BALL * 1.6 - Math.random() * 6, vx: 0, vy: 0, rot: Math.random() * 6.28, vr: 0 };
    });
    for (let i = 0; i < 90; i++) this.physics(1 / 60); // let them settle
  }

  /** Circles in a box: gravity, the walls, each other. */
  physics(dt) {
    const { x0, x1, y0, y1 } = this.box;
    for (const b of this.balls) {
      b.vy += 260 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (b.x < x0 + BALL) { b.x = x0 + BALL; b.vx = Math.abs(b.vx) * 0.4; }
      if (b.x > x1 - BALL) { b.x = x1 - BALL; b.vx = -Math.abs(b.vx) * 0.4; }
      if (b.y < y0 + BALL) { b.y = y0 + BALL; b.vy = Math.abs(b.vy) * 0.3; }
      if (b.y > y1 - BALL) {
        b.y = y1 - BALL;
        b.vy = -Math.abs(b.vy) * 0.3;
        b.vx *= 0.9;
        b.vr = b.vx * 0.16;
      }
    }
    for (let pass = 0; pass < 2; pass++)
      for (let i = 0; i < this.balls.length; i++)
        for (let j = i + 1; j < this.balls.length; j++) {
          const a = this.balls[i];
          const b = this.balls[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 >= BALL * BALL * 4 || d2 === 0) continue;
          const dist = Math.sqrt(d2);
          const nx = dx / dist;
          const ny = dy / dist;
          const push = (BALL * 2 - dist) / 2;
          a.x -= nx * push;
          a.y -= ny * push;
          b.x += nx * push;
          b.y += ny * push;
          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
          if (rel < 0) {
            a.vx += nx * rel * 0.6;
            a.vy += ny * rel * 0.6;
            b.vx -= nx * rel * 0.6;
            b.vy -= ny * rel * 0.6;
          }
        }
    for (const b of this.balls) {
      b.vx *= 0.985;
      b.vr *= 0.97;
      b.img.setPosition(b.x, b.y).setRotation(b.rot);
    }
  }

  /** The capsules thrown about (the crank turning). */
  stir(force) {
    for (const b of this.balls) {
      b.vx += (Math.random() - 0.5) * force;
      b.vy -= Math.random() * force;
      b.vr += (Math.random() - 0.5) * 12;
    }
  }

  // ---------------------------------------------------------------- drawing
  refresh() {
    const left = pool(this.loadout).length;
    this.count.setText(`×${this.loadout.tickets}`);
    this.left.setText(left ? `W AUTOMACIE: ${left}` : 'AUTOMAT JEST PUSTY');
    const touch = this.scene.sys.game.device.input.touch;
    this.hint.setText(!left ? 'MASZ JUŻ WSZYSTKO!' : this.loadout.tickets ? (touch ? 'DOTKNIJ, ABY LOSOWAĆ' : 'STRZAŁKI / ENTER / ESC') : 'KUPONY DAJĄ BOSSOWIE');
  }

  /** Can a capsule be drawn now? */
  ready() {
    return this.loadout.tickets > 0 && pool(this.loadout).length > 0;
  }

  /** A draw (or ten, as far as the tickets and the machine go). */
  start(n = 1) {
    if (this.phase !== 'idle') return;
    if (!this.ready()) {
      this.scene.sfx.denied();
      this.denied = 0.4;
      return;
    }
    this.queue = Math.min(n, this.loadout.tickets, pool(this.loadout).length) - 1;
    this.fast = n > 1;
    this.draw();
  }

  draw() {
    this.item = pull(this.loadout);
    this.save();
    this.refresh();
    this.tier = RARITIES.indexOf(this.item.rarity);
    this.go('ticket');
    this.ticket.setVisible(true).setPosition(this.ticketIcon.x, this.ticketIcon.y).setScale(FINE * 0.67).setAlpha(1);
  }

  go(phase) {
    this.phase = phase;
    this.pt = 0;
    this.step = 0;
  }

  /** The rarity's colour (the legendary one runs through the rainbow). */
  color(shift = 0) {
    return this.item.rarity === 'UR' ? RAINBOW[Math.floor(this.t * 5 + shift) % RAINBOW.length] : RARITY[this.item.rarity].color;
  }

  update(dt) {
    this.t += dt;
    // the machine at rest: the cat beckons, the lamps wink in turn, a capsule stirs now and then
    this.neko.setFrame(Math.floor(this.t * 2.2) % 2 ? 'neko_1' : 'neko_0');
    const busy = this.phase === 'crank' || this.phase === 'ticket';
    this.lamps.forEach((l, i) => l.setAlpha(busy ? 0.55 + 0.45 * Math.sin(this.t * 22 + i * Math.PI) : 0.25 + 0.2 * Math.sin(this.t * 2.4 + i * Math.PI)));
    if (this.phase === 'idle' && this.balls.length && Math.random() < dt * 0.7) {
      const b = this.balls[Math.floor(Math.random() * this.balls.length)];
      b.vy -= 26;
      b.vx += (Math.random() - 0.5) * 20;
    }
    this.physics(Math.min(dt, 1 / 30));
    this.denied = Math.max(0, (this.denied ?? 0) - dt);
    this.count.setTint(this.denied > 0 && Math.floor(this.denied * 14) % 2 ? 0xff5a5a : 0xffe080);
    this.drawButtons();
    const k = this.fast ? 2 : 1;
    this.pt += dt;
    if (this.phase === 'ticket') this.stepTicket(this.pt / (TIME.ticket / k));
    else if (this.phase === 'crank') this.stepCrank(this.pt / (TIME.crank / k));
    else if (this.phase === 'drop') this.stepDrop(dt * (this.fast ? 1.5 : 1));
    else if (this.phase === 'shake') this.stepShake(this.pt / (TIME.shake / k));
    else if (this.phase === 'open') this.stepOpen(this.pt / TIME.open);
    else if (this.phase === 'reveal') this.stepReveal(dt);
  }

  drawButtons() {
    const g = this.btn.clear();
    const idle = this.phase === 'idle';
    [[49, 76], [131, 76]].forEach(([x, w], i) => {
      const on = idle && this.focus === i && this.ready();
      g.fillStyle(on ? 0xa8201c : 0x3a1418, idle ? 1 : 0.5).fillRoundedRect(x - w / 2, this.btnY - 12, w, 24, 4);
      g.lineStyle(1, on ? 0xffe080 : 0x8a6a30, idle ? 1 : 0.5).strokeRoundedRect(x - w / 2 + 0.5, this.btnY - 11.5, w - 1, 23, 4);
      this.btnText[i].setTint(on ? 0xfff1c9 : 0xc8a878).setAlpha(idle ? 1 : 0.5);
    });
  }

  /** The ticket flies from the counter into its slot. */
  stepTicket(k) {
    const e = ease(Math.min(1, k));
    const tx = MX + MACHINE.slot.x * FINE;
    const ty = this.my + MACHINE.slot.y * FINE;
    const x0 = this.ticketIcon.x;
    const y0 = this.ticketIcon.y;
    // an arc, then it is pulled in
    this.ticket.setPosition(x0 + (tx - x0) * e, y0 + (ty - y0) * e - Math.sin(e * Math.PI) * 26).setRotation((1 - e) * -0.6);
    this.ticket.setScale(FINE * (0.67 + 0.33 * Math.sin(e * Math.PI)), FINE * (0.67 + 0.33 * Math.sin(e * Math.PI)) * (k > 0.85 ? Math.max(0.1, 1 - (k - 0.85) / 0.15) : 1));
    if (k < 1) return;
    this.ticket.setVisible(false);
    this.scene.sfx.ticketIn();
    this.go('crank');
  }

  /** A full turn of the crank, notch by notch; the capsules tumble. */
  stepCrank(k) {
    const e = ease(Math.min(1, k));
    this.crank.setRotation(e * Math.PI * 2);
    const notch = Math.floor(e * 6);
    if (notch > this.step && notch <= 6) {
      this.step = notch;
      this.scene.sfx.crankClick();
      this.stir(150);
      this.scene.sfx.capsuleRattle();
    }
    if (k < 1) return;
    this.crank.setRotation(0);
    // one capsule of that rarity leaves the glass (any, if none of it is showing)
    const i = this.balls.findIndex((b) => b.rarity === this.item.rarity);
    if (i >= 0 || this.balls.length > pool(this.loadout).length) this.balls.splice(i >= 0 ? i : 0, 1)[0].img.destroy();
    // ... and comes out of the chute
    this.cap.setFrame(`cap_${this.item.rarity}`).setVisible(true).setScale(FINE * 0.7).setRotation(0).setAlpha(1);
    this.fall = { x: MX + MACHINE.chute.x * FINE, y: this.my + MACHINE.chute.y * FINE, vx: (Math.random() < 0.5 ? -1 : 1) * (10 + Math.random() * 8), vy: 20, bounces: 0, rot: 0, out: 0 };
    this.go('drop');
  }

  /** It rolls off the tray, drops, bounces and comes to rest. */
  stepDrop(dt) {
    const f = this.fall;
    f.out = Math.min(1, f.out + dt * 3.2);
    f.vy += 520 * dt;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.rot += f.vx * dt * 0.22;
    if (f.y > this.floorY) {
      f.y = this.floorY;
      f.bounces++;
      this.scene.sfx.capsuleBounce(f.bounces);
      f.vy = f.bounces >= 3 ? 0 : -f.vy * 0.42;
      f.vx *= 0.6;
    }
    this.cap.setPosition(f.x, f.y).setRotation(f.rot).setScale(FINE * (0.7 + 0.3 * f.out));
    if (f.bounces >= 3 || this.pt > 2) this.go('shake');
  }

  /** It trembles harder and harder, its colour gathering under it. */
  stepShake(k) {
    const f = this.fall;
    const amp = Math.min(1, k) ** 2;
    this.cap.setPosition(f.x + Math.sin(this.t * 60) * amp * 1.6, this.floorY - Math.abs(Math.sin(this.t * 34)) * amp * 2).setRotation(f.rot + Math.sin(this.t * 48) * amp * 0.3);
    this.glow(this.rays.clear(), f.x, this.floorY, 12 + 22 * amp, 0.03 + 0.07 * amp);
    if (k >= 1) this.open();
  }

  /** A glow in the rarity's colour: discs of light, one inside the other. */
  glow(g, x, y, r, alpha) {
    for (let i = 0; i < 7; i++) g.fillStyle(this.color(), alpha).fillCircle(x, y, r * (1 - i / 8));
  }

  /** The halves fly apart in a flash. */
  open() {
    const f = this.fall;
    this.cap.setVisible(false);
    this.halves.forEach((h, i) => h.setFrame(`cap_${this.item.rarity}_${i ? 'bottom' : 'top'}`).setVisible(true).setPosition(f.x, this.floorY).setRotation(f.rot).setAlpha(1).setScale(FINE));
    this.scene.sfx.capsuleOpen();
    this.flash.setFillStyle(this.tier >= 4 ? 0xffffff : this.color(), 1).setAlpha(this.tier >= 3 ? 0.9 : 0.45);
    this.showPrize();
    this.go('open');
  }

  stepOpen(k) {
    const f = this.fall;
    const e = Math.min(1, k);
    this.halves.forEach((h, i) => {
      const side = i ? 1 : -1;
      h.setPosition(f.x + side * e * 34, this.floorY + (i ? e * e * 26 - e * 12 : -e * 46 + e * e * 30)).setRotation(f.rot + side * e * 2.4).setAlpha(1 - e * e);
    });
    this.flash.setAlpha(this.flash.alpha * 0.86);
    this.stepReveal(0);
    if (k < 1) return;
    this.halves.forEach((h) => h.setVisible(false));
    this.phase = 'reveal'; // (pt runs on: the prize has been coming up since the capsule opened)
  }

  /** What the capsule held: its picture, and what it is. */
  showPrize() {
    const it = this.item;
    const d = DEPTH.overlay + 9.2;
    this.prize?.destroy();
    this.prize = it.kind === 'hull' ? sharedArt(this.scene.add.image(0, 0, 'sprites', it.ship.frame)) : this.scene.add.image(0, 0, 'gacha', it.pic ? it.pic : it.skin ? `${SHOT_FRAMES[it.kind].at(-1)}_${it.skin}` : `part_${it.kind}`);
    this.prize.setDepth(d);
    this.prizeScale = it.kind === 'hull' ? 3 : it.pic ? FINE * (it.kind === 'marker' ? 6 : it.kind === 'life_icon' ? 5 : it.kind === 'decal' ? 8 : 4) : it.skin ? FINE * (it.kind === 'shot_laser' ? 3 : 6) : FINE * 2;
    const col = RARITY[it.rarity].color;
    this.kind.setText(KIND[it.kind]).setVisible(true).setY(this.cy - 44);
    this.rarity.setText(RARITY[it.rarity].name).setTint(col).setVisible(true).setY(this.cy + 46);
    this.name.setText(it.name).setVisible(true).setY(this.cy + 60);
    this.info.setText(it.info).setVisible(true).setY(this.cy + 74);
    this.more.setText(this.queue > 0 ? `JESZCZE ${this.queue}` : 'DOTKNIJ / ENTER').setY(this.cy + 96);
    this.stars.forEach((s, i) => s.setVisible(i <= this.tier).setPosition(W / 2 + (i - this.tier / 2) * 9, this.cy + 34));
    this.scene.sfx.prize(this.tier);
    this.sparkT = 0;
  }

  /** The prize rising out of the capsule in its glow. */
  stepReveal(dt) {
    const t = this.pt; // s since the capsule opened (the opening counts in)
    const rise = ease(Math.min(1, t / 0.45));
    const f = this.fall;
    const x = f.x + (W / 2 - f.x) * rise;
    const y = this.floorY + (this.cy - this.floorY) * rise;
    // it pops: over its size, then back
    const pop = rise < 1 ? rise * 1.2 : 1 + 0.2 * Math.max(0, 1 - (t - 0.45) / 0.18);
    this.prize.setPosition(x, y + Math.sin(this.t * 2.6) * 1.5 * rise).setScale(this.prizeScale * pop);
    this.dim.setAlpha(0.86 * rise);
    this.flash.setAlpha(this.flash.alpha * 0.9);
    // the rays: more of them, longer and brighter, the rarer
    const g = this.rays.clear();
    this.glow(g, x, y, (30 + this.tier * 5) * rise, 0.06 + 0.015 * Math.sin(this.t * 5));
    const n = 6 + this.tier * 3;
    const reach = (48 + this.tier * 16) * rise;
    for (let i = 0; i < n; i++) {
      const a = this.t * (0.5 + this.tier * 0.12) + (i * Math.PI * 2) / n;
      const wdt = (Math.PI / n) * (i % 2 ? 0.55 : 0.3);
      const len = reach * (i % 2 ? 1 : 0.72);
      g.fillStyle(this.color(i), (0.16 + this.tier * 0.05) * rise);
      g.fillTriangle(x, y, x + Math.cos(a - wdt) * len, y + Math.sin(a - wdt) * len, x + Math.cos(a + wdt) * len, y + Math.sin(a + wdt) * len);
    }
    // the ring bursting out as it opens, a steady one round the prize
    const burst = Math.min(1, t / 0.5);
    if (burst < 1) g.lineStyle(2, this.color(), 1 - burst).strokeCircle(x, y, 10 + burst * 70);
    g.lineStyle(1, this.color(2), 0.5 * rise).strokeCircle(x, y, 27 + Math.sin(this.t * 3) * 1.5);
    // sparkles: thrown out, twinkling as they drift down; more of them the rarer
    this.sparkT -= dt;
    if (dt > 0 && this.sparkT <= 0) {
      this.sparkT = 0.16 - this.tier * 0.028;
      const s = this.sparks.find((q) => !q.visible);
      if (s) {
        const a = Math.random() * Math.PI * 2;
        const r = 16 + Math.random() * (30 + this.tier * 10);
        s.setVisible(true).setPosition(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.9).setTint(this.tier >= 4 ? RAINBOW[Math.floor(Math.random() * 6)] : Math.random() < 0.4 ? 0xffffff : this.color());
        s.life = s.max = 0.5 + Math.random() * 0.5;
        s.size = FINE * (0.4 + Math.random() * 0.6);
      }
    }
    for (const s of this.sparks) {
      if (!s.visible) continue;
      s.life -= dt;
      if (s.life <= 0) { s.setVisible(false); continue; }
      const k = s.life / s.max;
      s.y += dt * 9;
      s.setScale(s.size * Math.sin(k * Math.PI)).setRotation(this.t * 2);
    }
    for (const o of [this.kind, this.rarity, this.name, this.info]) o.setAlpha(Math.max(0, Math.min(1, (t - 0.35) / 0.25)));
    this.stars.forEach((s, i) => s.setAlpha(Math.max(0, Math.min(1, (t - 0.4 - i * 0.07) / 0.1))).setTint(this.color(i)).setRotation(Math.sin(this.t * 3 + i) * 0.3));
    this.more.setVisible(t > 0.8 && Math.floor(this.t * 2.5) % 2 === 0);
  }

  /** The prize put away: on to the next draw of a run, or back to the machine. */
  dismiss() {
    for (const o of [this.kind, this.rarity, this.name, this.info, this.more, ...this.stars, ...this.sparks, ...this.halves]) o.setVisible(false);
    this.prize?.destroy();
    this.prize = null;
    this.rays.clear();
    this.dim.setAlpha(0);
    this.flash.setAlpha(0);
    this.phase = 'idle';
    if (this.queue > 0 && this.ready()) {
      this.queue--;
      this.draw();
    } else this.queue = 0;
  }

  // ---------------------------------------------------------------- input
  /** A tap or Enter: on the prize, put it away; mid-draw, skip to the capsule opening; else as asked. */
  confirm(n = this.focus ? 10 : 1) {
    if (this.phase === 'reveal') return this.pt > 0.8 && this.dismiss();
    if (this.phase === 'open') return;
    if (this.phase !== 'idle') return this.skip();
    this.start(n);
  }

  /** Straight to the capsule lying there, about to open. */
  skip() {
    if (this.phase === 'ticket') { this.ticket.setVisible(false); this.go('crank'); }
    if (this.phase === 'crank') this.stepCrank(1);
    if (this.phase === 'drop') Object.assign(this.fall, { y: this.floorY, bounces: 3, out: 1 });
    this.cap.setScale(FINE);
    this.go('shake');
    this.pt = (TIME.shake / (this.fast ? 2 : 1)) * 0.6;
  }

  /** Returns 'close' for the back arrow. */
  pointer(p) {
    if (this.phase === 'idle') {
      if (p.y < 26 && p.x < 60) return 'close';
      if (Math.abs(p.y - this.btnY) <= 14) {
        this.focus = p.x < W / 2 ? 0 : 1;
        return this.start(this.focus ? 10 : 1);
      }
      // a tap on the crank turns it too
      if (Math.hypot(p.x - this.crank.x, p.y - this.crank.y) < 18) return this.start(1);
      return null;
    }
    return this.confirm();
  }

  key(act) {
    if (act === 'back') return this.phase === 'idle' ? 'close' : this.confirm();
    if (act === 'left' || act === 'right') this.focus = act === 'left' ? 0 : 1;
    else if (act === 'confirm') this.confirm();
    return null;
  }

  destroy() {
    for (const o of this.items) o.destroy();
    for (const b of this.balls) b.img.destroy();
    this.prize?.destroy();
  }
}
