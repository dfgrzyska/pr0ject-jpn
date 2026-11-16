import { DEPTH, RENDER_SCALE, VIEW } from '../config.js';
import { ITEM, ITEMS, RARITIES, RARITY, SHOT_FRAMES, SLOTS, lookKind } from '../data/gacha.js';
import { pixelText as plainText } from './Hud.js';
import { tr } from '../i18n.js';
import { buildShip, equip, layout, seen, setHull, usePreset, wear } from './Loadout.js';
import { applySkin, blastSkinned, flameLook } from './shipSkin.js';
import { fxTint } from './premiumFx.js';
import { drawBubble } from './bubble.js';
import { PilotCard } from './PilotCard.js';
import { sharedArt, spriteTexture } from './enemyArt.js';

// The hangar, off the title screen. From the top: the ship (on the PARTS tab: big, with its numbers beside it; on
// the tabs of looks: a stage where it flies at its real size, fires at a daruma and plays the look being looked
// at over and over), the tabs, the slots of the tab (two rows), then what the picked slot can take: a grid of
// pictures for the kinds that have one, a list of names for the others; only what the player owns (the slot's
// count says how much there is to win). Under it the name and the line of the thing looked at, the three sets
// and a button that puts it on or takes it off. Things won since the hangar was last open carry a yellow mark.
const FINE = 1 / RENDER_SCALE;
const W = VIEW.width;
const LINE = 14; // a row of the list
const CELL = 28; // a cell of the grid
const COLS = 6;
const BOX = 22; // a slot
const PER_ROW = 7;
const SLOT_NAME = { hull: 'KADŁUB', engine: 'SILNIK', gun: 'DZIAŁO', bomb: 'BOMBA', core: 'RDZEŃ', omamori: 'OMAMORI', paint: 'MALOWANIE', flame: 'PŁOMIEŃ', dye: 'BARWNIK POCISKÓW', wake: 'ŚLAD ZA STATKIEM', shot_basic: 'POCISKI: PODSTAWOWA', shot_spread: 'POCISKI: ROZRZUT', shot_laser: 'POCISKI: LASER', shot_homing: 'POCISKI: NAPROWADZANE', marker: 'ZNACZNIK HITBOXA', eb_color: 'WROGIE POCISKI: KOLOR', eb_shape: 'WROGIE POCISKI: KSZTAŁT', blast: 'WYBUCHY', bomb_look: 'WYGLĄD BOMBY', title: 'TYTUŁ PILOTA', sound: 'DŹWIĘK STRZAŁU', graze: 'ISKRA GRAZINGU', hud_color: 'KOLOR LICZNIKA', life_icon: 'IKONA ŻYCIA', companion: 'TOWARZYSZ', shot_turret: 'POCISKI: WIEŻYCZKI', shield: 'BAŃKA TARCZY', decal_nose: 'NAKLEJKA: DZIÓB', decal_lwing: 'NAKLEJKA: LEWE SKRZYDŁO', decal_rwing: 'NAKLEJKA: PRAWE SKRZYDŁO', decal_tail: 'NAKLEJKA: OGON', paint_fx: 'ANIMACJA MALOWANIA', aura: 'AURA', trail: 'SMUGA SILNIKA', entry: 'WEJŚCIE NA PLANSZĘ', victory: 'TRIUMF NAD BOSSEM', death: 'UTRATA ŻYCIA', seal: 'PIECZĘĆ TRAFIENIA', shield_shape: 'KSZTAŁT TARCZY' };
// a slot's picture: the kind's (the four weapons' skins share one), or the fitted skin itself
const itemFrame = (kind, it) => (it?.pic ? it.pic : it?.skin ? `${SHOT_FRAMES[kind][0]}_${it.skin}` : null);
const slotFrame = (kind, it) => itemFrame(kind, it) ?? (kind.startsWith('shot_') ? 'part_shot' : `part_${lookKind(kind)}`);
// the tabs: the parts, then the looks (of the ship, of the shots: its own and the enemies', of the effects)
const TABS = [
  { id: 'parts', name: 'CZĘŚCI', x: 21 },
  { id: 'ship', name: 'STATEK', x: 65, kinds: ['paint', 'paint_fx', 'decal_nose', 'decal_lwing', 'decal_rwing', 'decal_tail', 'flame', 'trail', 'wake', 'aura', 'marker', 'companion', 'title'] },
  { id: 'shots', name: 'POCISKI', x: 112, kinds: ['dye', 'shot_basic', 'shot_spread', 'shot_laser', 'shot_homing', 'shot_turret', 'eb_color', 'eb_shape', 'sound'] },
  { id: 'fx', name: 'EFEKTY', x: 159, kinds: ['blast', 'bomb_look', 'seal', 'graze', 'shield', 'shield_shape', 'hud_color', 'life_icon', 'entry', 'victory', 'death'] },
];
const TAB_Y = 98;
const SLOTS_Y = 107;
const SET_X = [54, 72, 90]; // the three sets' boxes
const BTN = { x: 142, w: 60, h: 15 }; // the button that puts on / takes off
const STATS = [
  { label: 'PRĘDKOŚĆ', get: (s) => s.speed, min: 60, max: 190, fmt: (v) => String(Math.round(v)) },
  { label: 'SIŁA OGNIA', get: (s) => s.damage, min: 0.8, max: 1.7, fmt: (v) => `×${v.toFixed(2)}` },
  { label: 'BOMBA', get: (s) => s.bomb.damage, min: 15, max: 125, fmt: (v) => String(Math.round(v)) },
  { label: 'ŻYCIA', get: (s) => s.lives, min: 0, max: 5, fmt: (v) => String(v) },
];
const STAT_X = 70;
// the stage (the tabs of looks): its panel, where the ship flies in it, the daruma it fires at
const STAGE = { x0: 9, y0: 24, x1: 171, y1: 90, ship: { x: 58, y: 72 }, dummy: { x: 58, y: 37 } };
const DECAL_DOT = { decal_nose: [0, -3], decal_lwing: [-3, 0], decal_rwing: [3, 0], decal_tail: [0, 3] };
const tint = (it) => (it.rarity ? RARITY[it.rarity].color : 0xd8d4e4);
/** A name without what its slot says already ("NAKLEJKA: ZNAK KRÓL" under the stickers: "ZNAK KRÓL"). */
const short = (it, look) => (look && it.name.includes(': ') ? it.name.slice(it.name.indexOf(': ') + 2) : it.name);
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// (the texts here change as the player looks around: each new one goes through the phrasebook too)
const pixelText = (...args) => {
  const t = plainText(...args);
  const raw = t.setText;
  t.setText = function (str) {
    return raw.call(this, tr(str));
  };
  return t;
};

export class Hangar {
  constructor(scene, loadout, save) {
    this.scene = scene;
    this.loadout = loadout;
    this.save = save;
    this.t = 0;
    this.tab = 'parts';
    this.slot = 0; // the slot picked
    this.focus = 0; // which of the slot's things is looked at
    this.scroll = 0; // rows scrolled
    this.items = [];
    const d = DEPTH.overlay + 1;
    const add = (o, depth = d) => {
      this.items.push(o);
      return o.setDepth(depth);
    };
    const shared = (frame, depth) => add(sharedArt(scene.add.image(0, 0, 'sprites', 'dot_2')).setFrame(frame), depth).setVisible(false);
    this.bg = add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0a1024).setOrigin(0), d - 0.5);
    this.cloth = add(scene.add.tileSprite(0, 0, W, VIEW.maxHeight, 'menu_waves').setTileScale(FINE, FINE).setOrigin(0).setAlpha(0.18), d - 0.4);
    this.gfx = add(scene.add.graphics(), d);
    this.sg = add(scene.add.graphics(), d + 0.6); // the stage's own: its rings and the bubble, drawn every frame
    this.back = add(pixelText(scene, 27, 12, '< WRÓĆ'), d + 1);
    this.title = add(pixelText(scene, W / 2, 12, 'HANGAR').setTint(0xffd6e5), d + 1);
    this.owned = add(pixelText(scene, 176, 12, '', 1).setOrigin(1, 0.5).setTint(0x9aaec2), d + 1).setVisible(false);
    this.cardBtn = add(pixelText(scene, 154, 12, 'KARTA').setTint(0xffe080), d + 1); // the pilot's card (see PilotCard)
    // the ship, its engine burning, its companion; a dragon's body under its head (ship.anim.segs)
    this.art = add(sharedArt(scene.add.image(36, 0, 'sprites', 'ship')).setScale(2), d + 1);
    this.flame = add(sharedArt(scene.add.sprite(36, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setScale(2).play('flame'), d + 0.9);
    this.palArt = add(scene.add.image(54, 0, 'gacha', 'part_companion').setScale(FINE), d + 1.05).setVisible(false);
    this.segArt = [0, 1, 2, 3, 4].map(() => shared('ship', d + 0.95));
    // its numbers (the PARTS tab)
    this.statLabels = STATS.map((s) => add(pixelText(scene, STAT_X, 0, s.label, 0).setOrigin(0, 0.5).setTint(0xb0aec0), d + 1));
    this.statValues = STATS.map(() => add(pixelText(scene, 176, 0, '', 1).setOrigin(1, 0.5), d + 1));
    // the stage (the tabs of looks): its shots, the daruma, the enemies' bullets, the ship's marker and aura, a
    // blast, small bits; and a corner of the HUD (the score, the lives, the pilot's title)
    this.shots = [0, 1, 2].map(() => shared('ps_needle', d + 1.02));
    this.ebs = ['eb_m', 'eb_s'].map((f) => shared(f, d + 1.02));
    this.dummy = add(scene.add.image(STAGE.dummy.x, STAGE.dummy.y, 'gacha', 'lifeicon_daruma').setScale(FINE * 2), d + 1.01).setVisible(false);
    this.marker = shared('hitbox', d + 1.1);
    this.aura = [0, 1, 2, 3, 4, 5].map(() => shared('dot_2', d + 1.04));
    this.boom = add(sharedArt(scene.add.sprite(0, 0, 'sprites', 'expl_m_0')), d + 1.06).setVisible(false);
    this.bits = Array.from({ length: 72 }, () => ({ img: shared('dot_2', d + 1.03), life: 0 }));
    this.rings = [];
    this.hudScore = add(pixelText(scene, 138, 34, '00128400').setVisible(false), d + 1);
    this.hudLives = [0, 1, 2].map(() => shared('icon_life', d + 1));
    this.hudTitle = add(pixelText(scene, 138, 62, '').setTint(0xffe080).setVisible(false), d + 1);
    this.tabs = TABS.map((t) => add(pixelText(scene, t.x, TAB_Y, t.name), d + 1));
    // the slots: a picture each (the kind's, or what is fitted; the hull itself)
    this.slotArt = Array.from({ length: PER_ROW * 2 }, () => add(scene.add.image(0, 0, 'gacha', 'part_gun').setScale(FINE), d + 1));
    this.slotShip = add(sharedArt(scene.add.image(0, 0, 'sprites', 'ship')), d + 1.1);
    // the picked slot's name and how much of it is the player's; then the grid's pictures, or the list's rows
    this.head = add(pixelText(scene, 8, 0, '', 0).setOrigin(0, 0.5).setTint(0xffe080), d + 1);
    this.count = add(pixelText(scene, 172, 0, '', 1).setOrigin(1, 0.5).setTint(0x9aaec2), d + 1);
    this.cells = Array.from({ length: COLS * 5 }, () => add(scene.add.image(0, 0, 'gacha', 'part_gun'), d + 1).setVisible(false));
    this.rows = Array.from({ length: 14 }, () => add(pixelText(scene, 14, 0, '', 0).setOrigin(0, 0.5), d + 1));
    this.marks = Array.from({ length: 14 }, () => add(pixelText(scene, 172, 0, '', 1).setOrigin(1, 0.5), d + 1));
    this.empty = add(pixelText(scene, W / 2, 0, '').setTint(0x6a7a92), d + 1);
    // the thing looked at: its name and its line; the sets, the button, a hint
    this.name = add(pixelText(scene, W / 2, 0, ''), d + 1);
    this.info = add(pixelText(scene, W / 2, 0, '').setTint(0xb8c4d4), d + 1);
    this.setLabel = add(pixelText(scene, 8, 0, 'ZESTAW', 0).setOrigin(0, 0.5).setTint(0x9aaec2), d + 1);
    this.setNums = [0, 1, 2].map((i) => add(pixelText(scene, SET_X[i], 0, String(i + 1)), d + 1));
    this.btn = add(pixelText(scene, BTN.x, 0, ''), d + 1);
    this.hint = add(pixelText(scene, W / 2, 0, scene.sys.game.device.input.touch ? 'SLOT, POTEM PRZEDMIOT' : 'STRZAŁKI / ENTER / TAB / ESC').setTint(0x6a7a92), d + 1);
    this.layout(scene.H);
  }

  /** Switch to another of the three sets. */
  setPreset(i) {
    if (!usePreset(this.loadout, i)) return;
    this.save();
    this.scene.sfx.pickup();
    this.pickSlot(0);
  }

  layout(H) {
    this.H = H;
    for (const o of [this.bg, this.cloth]) o.setSize(W, H);
    this.statLabels.forEach((l, i) => (l.y = 28 + i * 16));
    this.statValues.forEach((v, i) => (v.y = 28 + i * 16));
    this.head.y = this.count.y = SLOTS_Y + 2 * (BOX + 3) + 7;
    this.top = this.head.y + 9;
    this.name.y = H - 56;
    this.info.y = H - 45;
    this.bottom = H - 65;
    this.setY = H - 28;
    this.setLabel.y = this.btn.y = this.setY;
    this.setNums.forEach((n) => (n.y = this.setY));
    this.hint.y = H - 11;
    this.draw();
  }

  /** The tab's slots; on PARTS the fitted hull's, the hull first: { kind, index } or (built in) { kind, fixed }. */
  slots() {
    const tab = TABS.find((t) => t.id === this.tab);
    if (tab.kinds) return tab.kinds.map((kind) => ({ kind, look: true }));
    const hull = ITEM[this.loadout.hull];
    const out = [{ kind: 'hull' }];
    for (const k of SLOTS) {
      if (hull.fixed?.[k]) out.push({ kind: k, fixed: hull.fixed[k] });
      for (let i = 0; i < layout(this.loadout)[k]; i++) out.push({ kind: k, index: i });
    }
    return out;
  }

  /** The part in a slot (null: empty). */
  fitted(slot) {
    if (slot.kind === 'hull') return ITEM[this.loadout.hull];
    if (slot.look) return ITEM[this.loadout.look[slot.kind]] ?? null;
    return ITEM[slot.fixed ?? this.loadout.slots[slot.kind][slot.index]] ?? null;
  }

  /** Everything of the slot's kind, and which of it the player owns (the rarest first). */
  stock(slot = this.slots()[this.slot]) {
    const all = slot.fixed ? [] : ITEMS.filter((it) => it.kind === lookKind(slot.kind));
    const have = new Set(this.loadout.owned);
    const rank = (it) => (it.rarity ? RARITIES.indexOf(it.rarity) + 1 : 0);
    return { all: all.length, own: all.filter((it) => have.has(it.id)).sort((a, b) => rank(b) - rank(a)) };
  }

  /** The owned things of the picked slot, as the grid or the list shows them. */
  list() {
    return this.stock().own;
  }

  /** The ship as it would be with the thing looked at fitted (null: nothing would change). */
  preview(it, slot) {
    if (!it || slot.fixed || ((slot.kind === 'hull' || slot.look) && this.fitted(slot) === it)) return null;
    const trial = structuredClone(this.loadout);
    return this.apply(trial, slot, it) ? buildShip(trial) : null;
  }

  /**
   * What picking a part does: the part in the picked slot comes out; any other goes into it (one fitted in
   * another slot of the kind changes places with what was here).
   */
  apply(state, slot, it) {
    if (slot.kind === 'hull') return setHull(state, it.id);
    if (slot.look) return wear(state, slot.kind, state.look[slot.kind] === it.id ? null : it.id);
    const slots = state.slots[slot.kind];
    const from = slots.indexOf(it.id);
    if (from === slot.index) return equip(state, slot.kind, slot.index, null);
    const here = slots[slot.index];
    if (!equip(state, slot.kind, slot.index, it.id)) return false;
    if (from >= 0 && here) equip(state, slot.kind, from, here);
    return true;
  }

  /** Is the slot's stock shown as pictures? (Kinds whose things each have one.) */
  grid(slot, own) {
    return slot.kind === 'hull' || own.some((it) => itemFrame(slot.kind, it));
  }

  draw() {
    const g = this.gfx.clear();
    const slots = this.slots();
    this.slot = Math.min(this.slot, slots.length - 1);
    const slot = slots[this.slot];
    const { all, own } = this.stock(slot);
    this.focus = Math.max(0, Math.min(this.focus, own.length - 1));
    const looked = own[this.focus] ?? null;
    if (looked && seen(this.loadout, looked.id)) this.save(); // (looked at: no longer new)
    const fresh = new Set(this.loadout.fresh);
    const ship = buildShip(this.loadout);
    const next = this.preview(looked, slot);
    const shown = next ?? ship;
    this.shown = shown;
    this.kind = slot.kind;
    this.staged = Boolean(slot.look);
    // (what is painted or stuck on the hull is looked at on a big ship: at its real size it would not be seen)
    this.big = this.staged && ['paint', 'paint_fx', 'flame'].includes(slot.kind) || Boolean(DECAL_DOT[slot.kind]);
    this.owned.setText(`${this.loadout.owned.length}/${ITEMS.length}`);

    g.lineStyle(1, 0xffe080).strokeRect(134.5, 5.5, 39, 13);
    // the tabs (a yellow dot: something new in it)
    TABS.forEach((t, i) => {
      const on = t.id === this.tab;
      this.tabs[i].setTint(on ? 0xffe080 : 0x6a7a92);
      if (on) g.fillStyle(0xffe080).fillRect(t.x - t.name.length * 3, TAB_Y + 6, t.name.length * 6, 1);
      const kinds = t.kinds ? t.kinds.map(lookKind) : ['hull', ...SLOTS];
      if ([...fresh].some((id) => kinds.includes(ITEM[id]?.kind))) g.fillStyle(0xffe04f).fillRect(t.x + t.name.length * 3 + 1, TAB_Y - 6, 3, 3);
    });

    // the ship: big in its frame with its numbers (PARTS), or at its real size on the stage (the looks)
    applySkin(this.scene, shown);
    this.anim = shown.look?.paintFx ?? null;
    // (a hull that moves does so here too: through its frames in turn, whatever sets them off in a game)
    const n = ship.anim?.n;
    this.beat = ship.anim ? { frame: ship.frame, rate: ship.anim.rate ?? 4, cycle: ship.anim.cycle ?? (n === 2 ? [0, 1] : [0, 1, 2, 1]) } : null;
    this.body = ship.anim?.segs ? ship.frame : null;
    this.segArt.forEach((s, i) => {
      if (this.body) s.setFrame(i === this.segArt.length - 1 ? `${this.body}_tail` : `${this.body}_seg`).setScale(1 - i * 0.05);
    });
    this.small = (this.staged && !this.big) || Boolean(this.body);
    this.art.setFrame(ship.frame).setScale(this.small ? 1 : 2).setX(this.staged ? STAGE.ship.x : 36);
    this.flame.setX(this.art.x);
    this.flameLong = flameLook(this.flame, shown);
    this.flameY = ship.flameY;
    const palPic = shown.look?.pal;
    this.palArt.setVisible(Boolean(palPic));
    if (palPic) this.palArt.setFrame(palPic);
    for (const o of [...this.statLabels, ...this.statValues]) o.setVisible(!this.staged);
    for (const o of [...this.shots, ...this.ebs, this.marker]) o.setVisible(this.staged && !this.big);
    for (const o of [this.hudScore, ...this.hudLives]) o.setVisible(this.staged);
    this.hudTitle.setVisible(this.staged);
    if (!this.staged) {
      for (const o of [this.dummy, this.boom, ...this.aura]) o.setVisible(false);
      for (const b of this.bits) { b.life = 0; b.img.setVisible(false); }
      this.rings.length = 0;
      g.lineStyle(1, ship.color, 1).strokeRect(36 - 26.5, 26.5, 54, 64);
      // the numbers: a bar each; a part looked at shows the change (green: more, red: less)
      STATS.forEach((st, i) => {
        const y = 28 + i * 16;
        const v = st.get(ship);
        const nv = next ? st.get(next) : v;
        const k = (x) => Math.max(0, Math.min(1, (x - st.min) / (st.max - st.min)));
        const w = 176 - STAT_X;
        g.fillStyle(0x1c2848).fillRect(STAT_X, y + 8, w, 2);
        if (nv > v) g.fillStyle(0x6ae486).fillRect(STAT_X, y + 8, Math.round(w * k(nv)), 2);
        g.fillStyle(nv < v ? 0xff5a5a : 0xffd040).fillRect(STAT_X, y + 8, Math.round(w * k(v)), 2);
        if (nv < v) g.fillStyle(0xffd040).fillRect(STAT_X, y + 8, Math.round(w * k(nv)), 2);
        this.statValues[i].setText(st.fmt(nv)).setTint(nv > v ? 0x6ae486 : nv < v ? 0xff5a5a : 0xffffff);
      });
    } else {
      // the stage's panel; the shots of the picked slot (the basic weapon's for any other), dyed; a corner of the HUD
      g.fillStyle(0x060a18).fillRect(STAGE.x0, STAGE.y0, STAGE.x1 - STAGE.x0, STAGE.y1 - STAGE.y0);
      g.lineStyle(1, 0x33416a).strokeRect(STAGE.x0 + 0.5, STAGE.y0 + 0.5, STAGE.x1 - STAGE.x0 - 1, STAGE.y1 - STAGE.y0 - 1);
      g.lineStyle(1, 0x1c2848).lineBetween(106, STAGE.y0 + 4, 106, STAGE.y1 - 4);
      const shotFrame = SHOT_FRAMES[slot.kind in SHOT_FRAMES ? slot.kind : 'shot_basic'][0];
      this.shotMove = shown.look?.shotMove?.[shotFrame] ?? null;
      for (const s of this.shots) {
        s.setFrame(shown.look?.shots?.[shotFrame] ?? shotFrame).setRotation(0).setScale(1);
        if (shown.look?.dye) s.setTint(shown.look.dye);
        else s.clearTint();
      }
      this.ebs.forEach((b, i) => b.setFrame(i ? 'eb_s' : 'eb_m'));
      this.marker.setFrame(shown.look?.marker ?? 'hitbox');
      this.hudScore.setTint(shown.look?.hud ?? 0xffffff);
      this.hudLives.forEach((l, i) => l.setFrame(shown.life).setPosition(128 + i * 10, 48));
      this.hudTitle.setText(shown.look?.title ?? '');
    }

    // the slots, two rows of them
    this.slotShip.setVisible(false);
    this.slotArt.forEach((art, i) => {
      const s = slots[i];
      art.setVisible(Boolean(s) && s.kind !== 'hull');
      if (!s) return;
      const { x, y } = this.slotAt(i);
      const it = this.fitted(s);
      const on = i === this.slot;
      g.fillStyle(on ? 0x24345c : 0x121a34).fillRect(x - BOX / 2, y - BOX / 2, BOX, BOX);
      g.lineStyle(1, on ? 0xffe080 : it ? tint(it) : 0x33416a, 1).strokeRect(x - BOX / 2 + 0.5, y - BOX / 2 + 0.5, BOX - 1, BOX - 1);
      if (s.kind === 'hull') this.slotShip.setVisible(true).setPosition(x, y).setFrame(ship.frame).setScale(Math.min(1, (BOX - 4) / Math.max(this.slotShip.width, this.slotShip.height) / FINE));
      else {
        art.setFrame(slotFrame(s.kind, it)).setPosition(x, y).setAlpha(it ? (s.fixed ? 0.6 : 1) : 0.45);
        art.setScale(Math.min((BOX - 4) / Math.max(art.width, art.height), 1));
      }
      // a part built into the hull: a small lock in the corner; a sticker's place on the hull: one of four dots lit
      if (s.fixed) {
        g.fillStyle(0x9aaec2).fillRect(x + 4, y + 5, 6, 4);
        g.lineStyle(1, 0x9aaec2).strokeRect(x + 5.5, y + 2.5, 3, 3);
      }
      if (DECAL_DOT[s.kind]) for (const [k, [dx, dy]] of Object.entries(DECAL_DOT)) g.fillStyle(k === s.kind ? 0xffe04f : 0x4a587c).fillRect(x + 6 + dx - 1, y - 6 + dy - 1, 2, 2);
      // something new for this slot: a yellow mark in its corner
      if (!s.fixed && [...fresh].some((id) => ITEM[id]?.kind === lookKind(s.kind))) g.fillStyle(0xffe04f).fillRect(x - BOX / 2 + 1, y - BOX / 2 + 1, 4, 4);
    });

    // the picked slot: its name, how much of its kind is the player's
    const it = this.fitted(slot);
    const nth = slot.index != null && layout(this.loadout)[slot.kind] > 1 ? ` ${slot.index + 1}` : '';
    this.head.setText(`${SLOT_NAME[slot.kind]}${nth}`);
    this.count.setText(slot.fixed ? '' : `${own.length}/${all}`);
    const asGrid = this.grid(slot, own);
    this.asGrid = asGrid;
    const unit = asGrid ? CELL : LINE;
    const per = asGrid ? COLS : 1;
    const fit = Math.max(1, Math.floor((this.bottom - this.top) / unit));
    const total = Math.ceil(own.length / per);
    const at = Math.floor(this.focus / per);
    if (!this.free) {
      if (at - this.scroll >= fit) this.scroll = at - fit + 1;
      if (at < this.scroll) this.scroll = at;
    }
    this.scroll = Math.max(0, Math.min(this.scroll, total - fit));
    this.unit = unit;
    this.per = per;
    // the grid: a picture in each cell, framed in its rarity's colour; the one looked at lit, the fitted one ticked
    this.cells.forEach((c, k) => {
      const i = this.scroll * COLS + k;
      const cell = asGrid && k < fit * COLS ? own[i] : null;
      c.setVisible(Boolean(cell));
      if (!cell) return;
      const x = 6 + (k % COLS) * CELL + CELL / 2;
      const y = this.top + Math.floor(k / COLS) * CELL + CELL / 2;
      const frame = cell.kind === 'hull' ? cell.ship.frame : itemFrame(slot.kind, cell);
      c.setTexture(this.scene.textures.get('gacha').has(frame) ? 'gacha' : spriteTexture(frame), frame).setPosition(x, y);
      c.setScale(Math.min((CELL - 8) / Math.max(c.width, c.height), 1));
      const on = i === this.focus;
      g.fillStyle(on ? 0x24345c : 0x10182e).fillRect(x - CELL / 2 + 1, y - CELL / 2 + 1, CELL - 2, CELL - 2);
      g.lineStyle(1, on ? 0xffe080 : tint(cell), on ? 1 : 0.6).strokeRect(x - CELL / 2 + 1.5, y - CELL / 2 + 1.5, CELL - 3, CELL - 3);
      if (cell === it) {
        g.fillStyle(0x6ae486).fillTriangle(x + CELL / 2 - 2, y - CELL / 2 + 2, x + CELL / 2 - 9, y - CELL / 2 + 2, x + CELL / 2 - 2, y - CELL / 2 + 9);
      }
      if (fresh.has(cell.id)) g.fillStyle(0xffe04f).fillRect(x - CELL / 2 + 2, y - CELL / 2 + 2, 4, 4);
    });
    // the list: a name a row, short (the slot says the rest); fitted here, or in another slot of the kind; new
    this.rows.forEach((r, k) => {
      const row = asGrid || slot.fixed ? null : own[this.scroll + k];
      const visible = Boolean(row) && k < fit;
      r.setVisible(visible);
      this.marks[k].setVisible(false);
      if (!visible) return;
      const y = this.top + k * LINE + LINE / 2;
      if (this.scroll + k === this.focus) {
        g.fillStyle(0x21364a).fillRect(6, y - LINE / 2, 168, LINE);
        g.fillStyle(0xffe080).fillTriangle(7, y - 3, 7, y + 3, 10, y);
      }
      r.setText(short(row, slot.look)).setY(y).setTint(tint(row));
      const other = slot.kind === 'hull' || slot.look ? -1 : this.loadout.slots[slot.kind].indexOf(row.id);
      if (row === it) this.marks[k].setVisible(true).setText('ZAŁOŻONE').setY(y).setTint(0x9cf09a);
      else if (other >= 0) this.marks[k].setVisible(true).setText(`W SLOCIE ${other + 1}`).setY(y).setTint(0x7f9a8c);
      else if (fresh.has(row.id)) this.marks[k].setVisible(true).setText('NOWE').setY(y).setTint(0xffe04f);
    });
    if (slot.fixed) this.rows[0].setVisible(true).setText(ITEM[slot.fixed].name).setY(this.top + LINE / 2).setTint(tint(ITEM[slot.fixed])).setAlpha(0.7);
    else this.rows[0].setAlpha(1);
    if (total > fit) {
      const h = Math.max(10, ((this.bottom - this.top) * fit) / total);
      g.fillStyle(0x365168).fillRect(176, this.top + ((this.bottom - this.top - h) * this.scroll) / Math.max(1, total - fit), 2, h);
    }
    this.empty.setVisible(!slot.fixed && !own.length).setY(this.top + 16).setText('JESZCZE NIC: LOSUJ W AUTOMACIE');

    // the thing looked at; the button: put it on, or take it off
    this.name.setText(slot.fixed || !asGrid || !looked ? '' : short(looked, slot.look)).setTint(looked ? tint(looked) : 0xffffff); // (the list shows the name itself)
    this.info.setText(slot.fixed ? 'NA STAŁE W TYM KADŁUBIE' : looked ? looked.info : '');
    const off = looked && looked === it && slot.kind !== 'hull';
    this.can = Boolean(looked) && !slot.fixed && !(slot.kind === 'hull' && looked === it);
    this.btn.setText(off ? 'ZDEJMIJ' : 'ZAŁÓŻ').setTint(this.can ? 0xffffff : 0x4a587c);
    g.fillStyle(!this.can ? 0x121a34 : off ? 0x5a2430 : 0x1f5a3a).fillRect(BTN.x - BTN.w / 2, this.setY - BTN.h / 2 - 1, BTN.w, BTN.h);
    g.lineStyle(1, !this.can ? 0x33416a : off ? 0xff8a8a : 0x6ae486).strokeRect(BTN.x - BTN.w / 2 + 0.5, this.setY - BTN.h / 2 - 0.5, BTN.w - 1, BTN.h - 1);
    // the three sets' boxes: the fitted one lit
    [0, 1, 2].forEach((i) => {
      const on = i === this.loadout.preset;
      g.fillStyle(on ? 0x24345c : 0x121a34).fillRect(SET_X[i] - 8, this.setY - 8, 16, 14);
      g.lineStyle(1, on ? 0xffe080 : 0x33416a).strokeRect(SET_X[i] - 7.5, this.setY - 7.5, 15, 13);
      this.setNums[i].setTint(on ? 0xffe080 : this.loadout.presets[i] ? 0xd8d4e4 : 0x6a7a92);
    });
  }

  /** The centre of slot i: rows of seven, each row centred. */
  slotAt(i) {
    const n = this.slots().length;
    const row = Math.floor(i / PER_ROW);
    const inRow = Math.min(PER_ROW, n - row * PER_ROW);
    return { x: W / 2 + (i % PER_ROW - (inRow - 1) / 2) * (BOX + 3), y: SLOTS_Y + BOX / 2 + row * (BOX + 3) };
  }

  /** Put the thing looked at into the picked slot (the fitted one: take it out). */
  activate() {
    const slot = this.slots()[this.slot];
    const it = this.list()[this.focus];
    if (!this.can || !it) return this.scene.sfx.denied();
    this.apply(this.loadout, slot, it);
    this.save();
    this.scene.sfx.pickup();
    this.draw();
  }

  setTab(tab) {
    if (tab === this.tab) return;
    this.tab = tab;
    this.scene.sfx.tick?.();
    this.pickSlot(0);
  }

  pickSlot(i) {
    const n = this.slots().length;
    this.slot = (i + n) % n;
    this.scroll = 0;
    this.free = false;
    // (start on what is fitted, so its neighbours are at hand)
    const slot = this.slots()[this.slot];
    this.focus = Math.max(0, this.list().indexOf(this.fitted(slot)));
    this.draw();
  }

  /** Look at another of the slot's things. */
  look(i) {
    const n = this.list().length;
    if (!n) return;
    this.focus = ((i % n) + n) % n;
    this.free = false;
    this.draw();
    // (a voice for the shots is heard as it is looked at)
    const it = this.list()[this.focus];
    if (it?.sound) this.scene.sfx.shot('basic', it.sound);
  }

  /** The pilot's card: shown over the hangar until a tap or a key. */
  openCard() {
    this.card = new PilotCard(this.scene, this.loadout, buildShip(this.loadout));
    this.scene.sfx.pickup();
  }

  closeCard() {
    this.card?.destroy();
    this.card = null;
  }

  /** Returns 'close' for the back arrow. */
  key(act) {
    if (this.card) return act ? void this.closeCard() ?? null : null;
    if (act === 'card') return void this.openCard() ?? null;
    if (act === 'back') return 'close';
    if (act?.startsWith('set')) this.setPreset(Number(act[3]));
    if (act === 'tab') this.setTab(TABS[(TABS.findIndex((t) => t.id === this.tab) + 1) % TABS.length].id);
    if (act === 'left') this.pickSlot(this.slot - 1);
    else if (act === 'right') this.pickSlot(this.slot + 1);
    else if (act === 'up') this.look(this.focus - 1);
    else if (act === 'down') this.look(this.focus + 1);
    else if (act === 'confirm') this.activate();
    return null;
  }

  /** A press: the back arrow, a tab, a slot, a set or the button at once; on the stock it may become a drag (scroll) or, on release, a tap. */
  pointer(p) {
    if (this.card) return void this.closeCard() ?? null;
    if (p.y < 24 && p.x < 60) return 'close';
    if (p.y < 22 && p.x > 130) return void this.openCard() ?? null;
    if (Math.abs(p.y - this.setY) <= 10) {
      if (Math.abs(p.x - BTN.x) <= BTN.w / 2 + 2) return this.activate();
      const i = SET_X.findIndex((x) => Math.abs(p.x - x) <= 9);
      return i >= 0 ? this.setPreset(i) : null;
    }
    if (Math.abs(p.y - TAB_Y) <= 7) return this.setTab(TABS.reduce((a, t) => (Math.abs(p.x - t.x) < Math.abs(p.x - a.x) ? t : a)).id);
    const n = this.slots().length;
    for (let i = 0; i < n; i++) {
      const c = this.slotAt(i);
      if (Math.abs(p.x - c.x) <= BOX / 2 + 1.5 && Math.abs(p.y - c.y) <= BOX / 2 + 1.5) return this.pickSlot(i);
    }
    if (p.y >= this.top && p.y <= this.bottom) this.drag = { x: p.x, y: p.y, scroll: this.scroll, moved: false };
    return null;
  }

  pointerMove(p) {
    if (!this.drag || !p.isDown) return;
    const dy = p.y - this.drag.y;
    if (!this.drag.moved && Math.abs(dy) < 4) return;
    this.drag.moved = true;
    this.free = true;
    this.scroll = this.drag.scroll - Math.round(dy / this.unit);
    this.draw();
  }

  /** A release without a drag is a tap on a thing: look at it; tapped again, put it on. */
  pointerUp() {
    const drag = this.drag;
    this.drag = null;
    if (!drag || drag.moved) return;
    const row = this.scroll + Math.floor((drag.y - this.top) / this.unit);
    const i = this.asGrid ? row * COLS + Math.floor((drag.x - 6) / CELL) : row;
    if (drag.x < 6 || (this.asGrid && drag.x >= 6 + COLS * CELL) || i < 0 || i >= this.list().length) return;
    if (i === this.focus) return this.activate();
    this.look(i);
  }

  // ---------------------------------------------------------------- the stage
  /** A small bit on the stage: a frame flying, fading out over its life. */
  bit(frame, x, y, o = {}) {
    const b = this.bits.find((q) => q.life <= 0);
    if (!b) return;
    Object.assign(b, { x, y, vx: 0, vy: 0, g: 0, spin: 0, drag: 0, life: 0.6, a0: 1, scale: 1, tint: null, ...o });
    b.max = b.life;
    b.img.setFrame(frame).setScale(b.scale).setRotation(0).setVisible(true);
    if (b.tint != null) b.img.setTint(b.tint);
    else b.img.clearTint();
  }

  /** One bit of a look now and then (as Player.emit): a trail, a wake, what an animated paint sheds. */
  emit(l, x, y, sx, sy, dt) {
    if (Math.random() >= dt * l.rate) return;
    this.bit(pick(l.frames), x + (Math.random() - 0.5) * sx, y + (Math.random() - 0.5) * sy, { vx: (Math.random() - 0.5) * (l.spread ?? 10), vy: l.vy ?? 30, g: l.g ?? 0, life: (l.life ?? 0.5) * (0.8 + Math.random() * 0.4), a0: l.alpha ?? 0.9, scale: l.scale ?? 1, spin: (Math.random() - 0.5) * (l.spin ?? 0), tint: l.tints ? pick(l.tints) : null });
  }

  /** A ring and a burst of a look's bits (a bomb, an entrance, a triumph, a fall), small enough for the stage. */
  burst(l, x, y, n = 16) {
    this.rings.push({ x, y, r: 3, life: 0.5, c: Array.isArray(l?.ring) ? pick(l.ring) : l?.ring ?? 0xffffff });
    const frames = l?.frames ?? ['petal_0', 'petal_1', 'petal_2', 'petal_3'];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = 25 + Math.random() * 55;
      this.bit(frames[i % frames.length], x, y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 1.5, life: 0.5 + Math.random() * 0.4, scale: l?.scale ?? 1, tint: l?.tints ? l.tints[i % l.tints.length] : null, spin: (Math.random() - 0.5) * 8 });
    }
  }

  /** The stage, a frame of it: the ship firing at the daruma, and the look of the picked slot played over and over. */
  stage(dt) {
    const look = this.shown.look ?? {};
    const t = this.t;
    const { ship, dummy } = STAGE;
    const big = this.big;
    const sy = big ? 56 + Math.round(Math.sin(t * 3) * 1.5) * 2 : ship.y + Math.round(Math.sin(t * 2.2) * 1.5);
    const every = (period, at = 0) => Math.floor((t - at) / period) !== Math.floor((t - dt - at) / period);
    // the daruma is shot down every little while (the look of the blasts, the seal), then stands again
    const cyc = t % 2.6;
    const up = cyc < 2;
    this.dummy.setVisible(up && !big);
    if (!big && every(2.6, 2)) {
      this.boom.setVisible(true).setPosition(dummy.x, dummy.y).play(look.blast?.ramp && blastSkinned() ? 'expl_m_skin' : 'expl_m');
      this.boom.once('animationcomplete', () => this.boom.setVisible(false));
      const b = look.blast?.bits;
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const v = (b?.speed ?? 70) * (0.3 + Math.random() * 0.5);
        this.bit(b ? b.frames[i % b.frames.length] : `debris_${i % 4}`, dummy.x, dummy.y, { vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: b?.g ?? 0, drag: b?.drag ?? 2.4, life: (b?.life ?? 0.6) * (0.7 + Math.random() * 0.5), scale: b?.scale ?? 1, tint: b?.tints ? b.tints[i % b.tints.length] : null, spin: (Math.random() - 0.5) * 10 });
      }
      if (look.seal) this.bit(look.seal, dummy.x + 14, dummy.y, { life: 0.9, a0: 0.95, scale: 1.1 });
    }
    // the shots climb from the nose to the daruma (it flinches as one lands), stirring as their skin does
    let hit = false;
    const m = this.shotMove;
    this.shots.forEach((s, i) => {
      const at = (t * 2.4 + i / 3) % 1;
      s.setPosition(ship.x, sy - 9 - (sy - 9 - dummy.y - 6) * at);
      if (m?.spin) s.setRotation(t * m.spin + i);
      else if (m?.wag) s.setRotation(Math.sin(t * m.rate + i) * m.wag);
      else if (m?.flip) s.setScale(Math.cos(t * m.flip + i), 1);
      else if (m?.flap) s.setScale(0.5 + 0.5 * Math.abs(Math.sin(t * m.flap + i)), 1);
      else if (m?.pulse) s.setScale(0.85 + 0.3 * Math.abs(Math.sin(t * m.pulse + i)));
      hit ||= up && at > 0.9;
    });
    this.dummy.setTint(hit ? 0xffb0b0 : 0xffffff).setX(dummy.x + (hit ? Math.round(Math.sin(t * 60)) : 0));
    // the enemies' bullets drift down either side, as they will look
    this.ebs.forEach((b, i) => b.setPosition(i ? 92 : 22, STAGE.y0 + 8 + ((t * (i ? 24 : 17) + i * 20) % (STAGE.y1 - STAGE.y0 - 16))));
    this.marker.setPosition(ship.x, sy);
    // what the ship wears all the time: an aura, a trail, a wake, the bits of an animated paint
    const au = look.aura;
    this.aura.forEach((a, i) => {
      a.setVisible(Boolean(au) && i < au.n);
      if (!a.visible) return;
      const ang = t * au.speed + (i * Math.PI * 2) / au.n;
      a.setFrame(au.frames[(i + Math.floor(t * (au.anim ?? 0))) % au.frames.length]).setPosition(ship.x + Math.cos(ang) * au.r, sy + 1 + Math.sin(ang) * au.r * 0.62).setScale(au.scale ?? 1).setRotation(au.turn ? ang : 0);
      if (au.tints) a.setTint(au.tints[i % au.tints.length]);
      else a.clearTint();
    });
    if (look.trail) this.emit(look.trail, ship.x, sy + this.flameY + 4, 3, 2, dt);
    if (look.paintFx?.bits) this.emit(look.paintFx.bits, ship.x, sy, 14, 16, dt);
    if (look.wake && Math.random() < dt * 14) {
      const side = Math.random() < 0.5 ? -1 : 1;
      this.bit(pick(look.wake.frames), ship.x + side * 7, sy + 2, { vx: side * (30 + Math.random() * 20), vy: 22, g: look.wake.g ?? 12, drag: 2, life: look.wake.life ?? 0.5, a0: look.wake.alpha ?? 0.65, scale: look.wake.scale ?? 1, tint: look.wake.tints ? pick(look.wake.tints) : null, spin: side * 5 });
    }
    // what plays only while its slot is picked: the bomb, the three bursts, the spark of a graze
    if (this.kind === 'bomb_look' && every(2.2, 0.6)) this.burst(look.bombLook, ship.x, sy, 22);
    if (this.kind === 'entry' && look.entry && every(1.8, 0.4)) this.burst(look.entry, ship.x, sy);
    if (this.kind === 'death' && look.death && every(1.8, 0.4)) this.burst(look.death, ship.x, sy);
    if (this.kind === 'victory' && look.victory && every(1.8, 0.4)) this.burst(look.victory, dummy.x + (Math.random() - 0.5) * 30, dummy.y + 8);
    if (this.kind === 'graze' && every(0.45)) {
      const gl = look.graze;
      const gx = ship.x + (Math.random() < 0.5 ? -8 : 8);
      this.bit('spark_1', gx, sy - 2, { life: 0.25, tint: gl?.tints ? pick(gl.tints) : null });
      if (gl?.bits) for (let i = 0; i < 3; i++) this.bit(pick(gl.bits.frames), gx, sy - 2, { vx: (Math.random() - 0.5) * 60, vy: (Math.random() - 0.5) * 60, g: gl.bits.g ?? 0, life: gl.bits.life ?? 0.5 });
    }
    // the bits and the rings; the turrets' bubble while its colour or shape is being picked
    const sg = this.sg.clear();
    for (const b of this.bits) {
      if (b.life <= 0) continue;
      b.life -= dt;
      b.vy += b.g * dt;
      const k = Math.max(0, 1 - b.drag * dt);
      b.vx *= k;
      b.vy *= k;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const inside = b.x > STAGE.x0 + 3 && b.x < 104 && b.y > STAGE.y0 + 3 && b.y < STAGE.y1 - 3;
      b.img.setVisible(b.life > 0 && inside).setPosition(b.x, b.y).setAlpha(b.a0 * Math.min(1, (b.life / b.max) * 2));
      if (b.spin) b.img.rotation += b.spin * dt;
    }
    this.rings = this.rings.filter((r) => (r.life -= dt) > 0);
    for (const r of this.rings) {
      r.r += dt * 70;
      if (r.r < 30) sg.lineStyle(1.5, r.c, r.life * 2).strokeCircle(r.x, r.y, r.r);
    }
    if (this.kind === 'shield' || this.kind === 'shield_shape') drawBubble(sg, ship.x, sy + 1, 14 + Math.sin(t * 5) * 0.6, t, { gold: t % 4 > 2, shield: look.shield, shape: look.shieldShape });
    return sy;
  }

  update(dt) {
    this.t += dt;
    this.card?.update(dt);
    const k = this.small ? 1 : 2; // (the ship at its real size on the stage, and a dragon whatever the tab)
    this.sg.clear();
    if (this.staged) this.art.y = this.stage(dt);
    else this.art.y = this.body ? 40 + Math.round(Math.sin(this.t * 3) * 1.5) : 54 + Math.round(Math.sin(this.t * 3) * 1.5) * 2;
    // (a dragon's body swaying under its head, as far as there is room for it)
    const floor = this.staged ? STAGE.y1 - 6 : 84;
    this.segArt.forEach((g, i) => {
      const y = this.art.y + 3 + (i + 1) * 8;
      const sway = Math.sin(this.t * 3 - (i + 1) * 0.7) * (i + 1) * 0.9;
      g.setPosition(this.art.x + sway, y).setRotation(Math.cos(this.t * 3 - (i + 1) * 0.7) * -0.06 * (i + 1)).setVisible(Boolean(this.body) && y < floor);
    });
    this.flame.y = this.art.y + (this.flameY ?? 8) * k;
    this.flame.setScale(k, k * (this.flameLong ?? 1)).setVisible(!this.body);
    const beside = this.staged && !this.big;
    this.palArt.setPosition(beside ? this.art.x - 12 : this.art.x + 18, beside ? this.art.y + 9 + Math.sin(this.t * 5) * 1.2 : this.staged ? this.art.y + 20 : 76 + Math.round(Math.sin(this.t * 5) * 1.5));
    if (this.beat) {
      const b = this.beat.cycle[Math.floor(this.t * this.beat.rate) % this.beat.cycle.length];
      const frame = b ? `${this.beat.frame}_f${b}` : this.beat.frame;
      if (this.art.frame.name !== frame) this.art.setFrame(frame);
    }
    // (an animated paint job: its colour flowing over the hull)
    if (this.anim) this.art.setTint(fxTint(this.anim, this.t));
    else this.art.clearTint();
  }

  destroy() {
    this.closeCard();
    for (const o of this.items) o.destroy();
  }
}
