import { DEPTH, RENDER_SCALE, VIEW } from '../config.js';
import { ITEM, ITEMS, RARITIES, RARITY, SHOT_FRAMES, SLOTS, lookKind } from '../data/gacha.js';
import { pixelText as plainText } from './Hud.js';
import { tr } from '../i18n.js';
import { buildShip, equip, layout, setHull, usePreset, wear } from './Loadout.js';
import { applySkin, flameLook } from './shipSkin.js';
import { fxTint } from './premiumFx.js';
import { sharedArt } from './enemyArt.js';

// The hangar, off the title screen: the ship as it is fitted, its numbers, the hull's slots, and under them the
// parts of the kind the picked slot takes. Tap a slot, then a part to fit it (the fitted one again to take it out).
// A part looked at shows what it would do to the numbers before it goes in. Parts not won yet are listed as
// question marks in their rarity's colour.
const FINE = 1 / RENDER_SCALE;
const W = VIEW.width;
const LINE = 12; // a row of the list
const BOX = 26; // a slot
const PER_ROW = 5;
const SLOT_NAME = { hull: 'KADŁUB', engine: 'SILNIK', gun: 'DZIAŁO', bomb: 'BOMBA', core: 'RDZEŃ', omamori: 'OMAMORI', paint: 'MALOWANIE', flame: 'PŁOMIEŃ', dye: 'BARWNIK POCISKÓW', wake: 'ŚLAD ZA STATKIEM', shot_basic: 'POCISKI: PODSTAWOWA', shot_spread: 'POCISKI: ROZRZUT', shot_laser: 'POCISKI: LASER', shot_homing: 'POCISKI: NAPROWADZANE', marker: 'ZNACZNIK HITBOXA', eb_color: 'WROGIE POCISKI: KOLOR', eb_shape: 'WROGIE POCISKI: KSZTAŁT', blast: 'WYBUCHY', bomb_look: 'WYGLĄD BOMBY', title: 'TYTUŁ PILOTA', sound: 'DŹWIĘK STRZAŁU', graze: 'ISKRA GRAZINGU', hud_color: 'KOLOR LICZNIKA', life_icon: 'IKONA ŻYCIA', companion: 'TOWARZYSZ', shot_turret: 'POCISKI: WIEŻYCZKI', shield: 'BAŃKA TARCZY', decal_nose: 'NAKLEJKA: DZIÓB', decal_lwing: 'NAKLEJKA: LEWE SKRZYDŁO', decal_rwing: 'NAKLEJKA: PRAWE SKRZYDŁO', decal_tail: 'NAKLEJKA: OGON', paint_fx: 'ANIMACJA MALOWANIA', aura: 'AURA', trail: 'SMUGA SILNIKA', entry: 'WEJŚCIE NA PLANSZĘ', victory: 'TRIUMF NAD BOSSEM', death: 'UTRATA ŻYCIA' };
// a slot's picture: the kind's (the four weapons' skins share one), or the fitted skin itself
const slotFrame = (kind, it) => (it?.pic ? it.pic : it?.skin ? `${SHOT_FRAMES[kind][0]}_${it.skin}` : kind.startsWith('shot_') ? 'part_shot' : `part_${lookKind(kind)}`);
// the tabs: the parts, then the looks (of the ship, of the shots: its own and the enemies', of the effects)
const TABS = [
  { id: 'parts', name: 'CZĘŚCI', x: 21 },
  { id: 'ship', name: 'STATEK', x: 65, kinds: ['paint', 'decal_nose', 'decal_lwing', 'decal_rwing', 'decal_tail', 'flame', 'wake', 'marker', 'companion', 'title'] },
  { id: 'shots', name: 'POCISKI', x: 112, kinds: ['dye', 'shot_basic', 'shot_spread', 'shot_laser', 'shot_homing', 'shot_turret', 'eb_color', 'eb_shape', 'sound'] },
  { id: 'fx', name: 'EFEKTY', x: 159, kinds: ['blast', 'bomb_look', 'graze', 'shield', 'hud_color', 'life_icon', 'paint_fx', 'aura', 'trail', 'entry', 'victory', 'death'] },
];
const TAB_Y = 95;
const SET_X = [72, 94, 116]; // the three sets' boxes
const STATS = [
  { label: 'PRĘDKOŚĆ', get: (s) => s.speed, min: 60, max: 190, fmt: (v) => String(Math.round(v)) },
  { label: 'SIŁA OGNIA', get: (s) => s.damage, min: 0.8, max: 1.7, fmt: (v) => `×${v.toFixed(2)}` },
  { label: 'BOMBA', get: (s) => s.bomb.damage, min: 15, max: 125, fmt: (v) => String(Math.round(v)) },
  { label: 'ŻYCIA', get: (s) => s.lives, min: 0, max: 5, fmt: (v) => String(v) },
];
const STAT_X = 70;
const tint = (it) => (it.rarity ? RARITY[it.rarity].color : 0xd8d4e4);

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
    this.tab = 'parts'; // PARTS (the hull and what goes in its slots) or LOOKS (paint, flame, dye)
    this.slot = 0; // the slot picked
    this.focus = 0; // the row of the list looked at
    this.scroll = 0;
    this.items = [];
    const d = DEPTH.overlay + 1;
    const add = (o, depth = d) => {
      this.items.push(o);
      return o.setDepth(depth);
    };
    this.add = add;
    this.bg = add(scene.add.rectangle(0, 0, W, VIEW.maxHeight, 0x0a1024).setOrigin(0), d - 0.5);
    this.cloth = add(scene.add.tileSprite(0, 0, W, VIEW.maxHeight, 'menu_waves').setTileScale(FINE, FINE).setOrigin(0).setAlpha(0.18), d - 0.4);
    this.gfx = add(scene.add.graphics(), d);
    this.back = add(pixelText(scene, 27, 12, '< WRÓĆ'), d + 1);
    this.title = add(pixelText(scene, W / 2, 12, 'HANGAR').setTint(0xffd6e5), d + 1);
    this.owned = add(pixelText(scene, 176, 12, '', 1).setOrigin(1, 0.5).setTint(0x9aaec2), d + 1);
    // the ship, its engine burning
    this.art = add(sharedArt(scene.add.image(36, 0, 'sprites', 'ship')).setScale(2), d + 1);
    this.flame = add(sharedArt(scene.add.sprite(36, 0, 'sprites', 'flame_0')).setOrigin(0.5, 0).setScale(2).play('flame'), d + 0.9);
    this.palArt = add(scene.add.image(54, 0, 'gacha', 'part_companion').setScale(FINE), d + 1.05).setVisible(false); // its companion
    this.hullName = add(pixelText(scene, 36, 0, ''), d + 1);
    // its numbers
    this.statLabels = STATS.map((s) => add(pixelText(scene, STAT_X, 0, s.label, 0).setOrigin(0, 0.5).setTint(0xb0aec0), d + 1));
    this.statValues = STATS.map(() => add(pixelText(scene, 176, 0, '', 1).setOrigin(1, 0.5), d + 1));
    this.tabs = TABS.map((t) => add(pixelText(scene, t.x, TAB_Y, t.name), d + 1));
    // the slots: a picture each (the kind's, or the hull itself)
    this.slotArt = Array.from({ length: PER_ROW * 3 }, () => add(scene.add.image(0, 0, 'gacha', 'part_gun').setScale(FINE), d + 1));
    this.slotShip = add(sharedArt(scene.add.image(0, 0, 'sprites', 'ship')), d + 1.1);
    // the picked slot's name, the list under it, a line about the part looked at
    this.head = add(pixelText(scene, 8, 0, '', 0).setOrigin(0, 0.5).setTint(0xffe080), d + 1);
    this.rows = Array.from({ length: 16 }, () => add(pixelText(scene, 14, 0, '', 0).setOrigin(0, 0.5), d + 1));
    this.marks = Array.from({ length: 16 }, () => add(pixelText(scene, 176, 0, '', 1).setOrigin(1, 0.5).setTint(0x9cf09a), d + 1));
    this.info = add(pixelText(scene, W / 2, 0, '').setTint(0xb8c4d4), d + 1);
    this.hint = add(pixelText(scene, W / 2, 0, scene.sys.game.device.input.touch ? 'DOTKNIJ DWA RAZY = ZAŁÓŻ' : 'STRZAŁKI / ENTER / ESC').setTint(0x6a7a92), d + 1);
    // the three sets, in a row over the hint
    this.setLabel = add(pixelText(scene, 58, 0, 'ZESTAW', 1).setOrigin(1, 0.5).setTint(0x9aaec2), d + 1);
    this.setNums = [0, 1, 2].map((i) => add(pixelText(scene, SET_X[i], 0, String(i + 1)), d + 1));
    // the test lane, in the ship's frame in place of the big ship: the ship at its real size firing the shots of
    // the picked slot at a daruma, the enemies' bullets drifting past as they will look
    this.lane = false;
    this.laneTag = add(pixelText(scene, 13, 31, 'TEST', 0).setOrigin(0, 0.5), d + 1.2);
    this.laneShots = [0, 1, 2].map(() => add(sharedArt(scene.add.image(36, 0, 'sprites', 'ps_needle')), d + 1.02).setVisible(false));
    this.laneEb = ['eb_m', 'eb_s'].map((f) => add(sharedArt(scene.add.image(0, 0, 'sprites', f)), d + 1.02).setVisible(false));
    this.dummy = add(scene.add.image(36, 38, 'gacha', 'lifeicon_daruma').setScale(FINE * 2), d + 1.01).setVisible(false);
    this.layout(scene.H);
  }

  /** The big ship, or the test lane. */
  setLane(on) {
    this.lane = on;
    this.scene.sfx.tick?.();
    this.draw();
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
    this.shipY = 54;
    this.hullName.y = this.shipY + 30;
    this.statLabels.forEach((l, i) => (l.y = 28 + i * 16));
    this.statValues.forEach((v, i) => (v.y = 28 + i * 16));
    this.slotsY = 106; // the top of the slots
    this.bottom = H - 50;
    this.info.y = H - 42;
    this.setY = H - 27;
    this.setLabel.y = this.setY;
    this.setNums.forEach((n) => (n.y = this.setY));
    this.hint.y = H - 12;
    this.draw();
  }

  /** The fitted hull's slots, the hull first: { kind, index } or (built in) { kind, fixed }. */
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

  /** What the list shows for the picked slot: every part of its kind, the ones owned first. */
  list() {
    const slot = this.slots()[this.slot];
    if (slot.fixed) return [];
    const have = new Set(this.loadout.owned);
    const all = ITEMS.filter((it) => it.kind === lookKind(slot.kind));
    const rank = (it) => (it.rarity ? RARITIES.indexOf(it.rarity) + 1 : 0);
    return [...all.filter((it) => have.has(it.id)).sort((a, b) => rank(b) - rank(a)), ...all.filter((it) => !have.has(it.id)).sort((a, b) => rank(a) - rank(b))].map((it) => ({ it, have: have.has(it.id) }));
  }

  /** The ship as it would be with the part looked at fitted (null: nothing would change). */
  preview(row, slot) {
    if (!row?.have || slot.fixed || ((slot.kind === 'hull' || slot.look) && this.fitted(slot) === row.it)) return null;
    const trial = structuredClone(this.loadout);
    return this.apply(trial, slot, row.it) ? buildShip(trial) : null;
  }

  /**
   * What picking a part from the list does: the part in the picked slot comes out; any other goes into it (one
   * fitted in another slot of the kind changes places with what was here).
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

  draw() {
    const g = this.gfx.clear();
    const slots = this.slots();
    this.slot = Math.min(this.slot, slots.length - 1);
    const slot = slots[this.slot];
    // (the list starts under the slots: two rows of them, three on a tab with more)
    this.head.y = this.slotsY + Math.max(2, Math.ceil(slots.length / PER_ROW)) * (BOX + 4) + 8;
    this.top = this.head.y + 10;
    const list = this.list();
    this.focus = Math.max(0, Math.min(this.focus, list.length - 1));
    const ship = buildShip(this.loadout);
    const next = this.preview(list[this.focus], slot);
    const total = ITEMS.length;
    this.owned.setText(`${this.loadout.owned.length}/${total}`);

    // the tabs
    TABS.forEach((t, i) => {
      const on = t.id === this.tab;
      this.tabs[i].setTint(on ? 0xffe080 : 0x6a7a92);
      if (on) g.fillStyle(0xffe080).fillRect(t.x - t.name.length * 3, TAB_Y + 6, t.name.length * 6, 1);
    });

    // the ship in its frame, in the paint and with the flame looked at
    applySkin(this.scene, next ?? ship);
    this.anim = (next ?? ship).look?.paintFx ?? null;
    // the three sets' boxes: the fitted one lit
    [0, 1, 2].forEach((i) => {
      const on = i === this.loadout.preset;
      g.fillStyle(on ? 0x24345c : 0x121a34).fillRect(SET_X[i] - 9, this.setY - 7, 18, 13);
      g.lineStyle(1, on ? 0xffe080 : 0x33416a).strokeRect(SET_X[i] - 8.5, this.setY - 6.5, 17, 12);
      this.setNums[i].setTint(on ? 0xffe080 : this.loadout.presets[i] ? 0xd8d4e4 : 0x6a7a92);
    });
    // the test lane: the shots of the picked slot (the basic weapon's for any other), dyed; the enemies' bullets
    const shown = next ?? ship;
    this.laneTag.setTint(this.lane ? 0xffe080 : 0x6a7a92);
    const shotKind = slot.kind in SHOT_FRAMES ? slot.kind : 'shot_basic';
    const shotFrame = SHOT_FRAMES[shotKind][0];
    for (const s of this.laneShots) {
      s.setVisible(this.lane).setFrame(shown.look?.shots?.[shotFrame] ?? shotFrame);
      if (shown.look?.dye) s.setTint(shown.look.dye);
      else s.clearTint();
    }
    this.laneEb.forEach((b, i) => b.setVisible(this.lane).setFrame(i ? 'eb_s' : 'eb_m'));
    this.dummy.setVisible(this.lane);
    this.art.setScale(this.lane ? 1 : 2);
    this.flameLong = flameLook(this.flame, next ?? ship);
    const palPic = (next ?? ship).look?.pal;
    this.palArt.setVisible(Boolean(palPic));
    if (palPic) this.palArt.setFrame(palPic);
    this.art.setFrame(ship.frame);
    this.flameY = ship.flameY;
    this.hullName.setText(ship.name).setTint(ship.color);
    g.lineStyle(1, ship.color, 1).strokeRect(36 - 26.5, this.shipY - 27.5, 54, 64);

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

    // the slots
    this.slotShip.setVisible(false);
    this.slotArt.forEach((art, i) => {
      const s = slots[i];
      art.setVisible(Boolean(s) && s.kind !== 'hull');
      if (!s) return;
      const { x, y } = this.slotAt(i);
      const it = this.fitted(s);
      const on = i === this.slot;
      g.fillStyle(on ? 0x24345c : 0x121a34).fillRect(x - BOX / 2, y - BOX / 2, BOX, BOX);
      g.lineStyle(1, on ? 0xffe080 : it ? tint(it) : 0x33416a, on || it ? 1 : 0.8).strokeRect(x - BOX / 2 + 0.5, y - BOX / 2 + 0.5, BOX - 1, BOX - 1);
      if (s.kind === 'hull') this.slotShip.setVisible(true).setPosition(x, y).setFrame(ship.frame);
      else art.setFrame(slotFrame(s.kind, it)).setPosition(x, y).setAlpha(it ? (s.fixed ? 0.55 : 1) : 0.22).setScale(it?.skin || it?.pic ? Math.min(FINE * 3, (BOX - 6) / art.height) : FINE);
      // a part built into the hull: a small lock in the corner
      if (s.fixed) {
        g.fillStyle(0x9aaec2).fillRect(x + 6, y + 7, 6, 4);
        g.lineStyle(1, 0x9aaec2).strokeRect(x + 7.5, y + 4.5, 3, 3);
      }
    });

    // the picked slot, and the parts for it
    const it = this.fitted(slot);
    const nth = slot.index != null && layout(this.loadout)[slot.kind] > 1 ? ` ${slot.index + 1}` : '';
    this.head.setText(`${SLOT_NAME[slot.kind]}${nth}`);
    const fit = Math.floor((this.bottom - this.top) / LINE);
    if (!this.free) {
      if (this.focus - this.scroll >= fit) this.scroll = this.focus - fit + 1;
      if (this.focus < this.scroll) this.scroll = this.focus;
    }
    this.scroll = Math.max(0, Math.min(this.scroll, list.length - fit));
    this.rows.forEach((r, k) => {
      const row = list[this.scroll + k];
      const shown = Boolean(row) && k < fit;
      r.setVisible(shown);
      this.marks[k].setVisible(false);
      if (!shown) return;
      const y = this.top + k * LINE + LINE / 2;
      const on = this.scroll + k === this.focus;
      if (on) {
        g.fillStyle(0x21364a).fillRect(6, y - LINE / 2, 168, LINE);
        g.fillStyle(0xffe080).fillTriangle(7, y - 3, 7, y + 3, 10, y);
      }
      r.setText(row.have ? row.it.name : '? ? ?').setY(y).setTint(tint(row.it)).setAlpha(row.have ? 1 : 0.45);
      // fitted here, or in another slot of the kind (which one, then)
      const at = slot.kind === 'hull' || slot.look ? -1 : this.loadout.slots[slot.kind].indexOf(row.it.id);
      // (a long name leaves no room for the word: a green tick's square then)
      if (row.it === it && row.it.name.length > 19) g.fillStyle(0x9cf09a).fillRect(169, y - 2, 4, 4);
      else if (row.it === it) this.marks[k].setVisible(true).setText('ZAŁOŻONE').setY(y).setTint(0x9cf09a);
      else if (at >= 0) this.marks[k].setVisible(true).setText(`W SLOCIE ${at + 1}`).setY(y).setTint(0x7f9a8c);
    });
    if (list.length > fit) {
      const h = Math.max(10, ((this.bottom - this.top) * fit) / list.length);
      g.fillStyle(0x365168).fillRect(176, this.top + ((this.bottom - this.top - h) * this.scroll) / Math.max(1, list.length - fit), 2, h);
    }
    const row = list[this.focus];
    this.info.setText(slot.fixed ? 'NA STAŁE W TYM KADŁUBIE' : !row ? '' : row.have ? row.it.info : `${RARITY[row.it.rarity].name}: DO WYLOSOWANIA`);
    if (slot.fixed) {
      this.rows[0].setVisible(true).setText(ITEM[slot.fixed].name).setY(this.top + LINE / 2).setTint(tint(ITEM[slot.fixed])).setAlpha(0.7);
    }
  }

  /** The centre of slot i: rows of five, each row centred. */
  slotAt(i) {
    const n = this.slots().length;
    const row = Math.floor(i / PER_ROW);
    const inRow = Math.min(PER_ROW, n - row * PER_ROW);
    const gap = BOX + 6;
    return { x: W / 2 + (i % PER_ROW - (inRow - 1) / 2) * gap, y: this.slotsY + BOX / 2 + row * (BOX + 4) };
  }

  /** Fit the part looked at into the picked slot (the fitted one: take it out). */
  activate() {
    const slot = this.slots()[this.slot];
    const row = this.list()[this.focus];
    if (slot.fixed || !row) return;
    if (!row.have) return this.scene.sfx.denied();
    this.apply(this.loadout, slot, row.it);
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
    this.focus = 0;
    this.scroll = 0;
    this.free = false;
    this.draw();
  }

  move(delta) {
    const n = this.list().length;
    if (!n) return;
    this.focus = (this.focus + delta + n) % n;
    this.free = false;
    this.draw();
  }

  /** Returns 'close' for the back arrow. */
  key(act) {
    if (act === 'back') return 'close';
    if (act === 'test') this.setLane(!this.lane);
    if (act?.startsWith('set')) this.setPreset(Number(act[3]));
    if (act === 'tab') this.setTab(TABS[(TABS.findIndex((t) => t.id === this.tab) + 1) % TABS.length].id);
    if (act === 'left') this.pickSlot(this.slot - 1);
    else if (act === 'right') this.pickSlot(this.slot + 1);
    else if (act === 'up') this.move(-1);
    else if (act === 'down') this.move(1);
    else if (act === 'confirm') this.activate();
    return null;
  }

  /** A press: the back arrow or a slot at once; on the list it may become a drag (scroll) or, on release, a tap. */
  pointer(p) {
    if (p.y < 26 && p.x < 60) return 'close';
    if (p.x >= 9 && p.x <= 64 && p.y >= 26 && p.y <= 91) return this.setLane(!this.lane);
    if (Math.abs(p.y - this.setY) <= 8) {
      const i = SET_X.findIndex((x) => Math.abs(p.x - x) <= 10);
      return i >= 0 ? this.setPreset(i) : null;
    }
    if (Math.abs(p.y - TAB_Y) <= 8) return this.setTab(TABS.reduce((a, t) => (Math.abs(p.x - t.x) < Math.abs(p.x - a.x) ? t : a)).id);
    const n = this.slots().length;
    for (let i = 0; i < n; i++) {
      const c = this.slotAt(i);
      if (Math.abs(p.x - c.x) <= BOX / 2 + 2 && Math.abs(p.y - c.y) <= BOX / 2 + 2) return this.pickSlot(i);
    }
    if (p.y >= this.top && p.y <= this.bottom) this.drag = { y: p.y, scroll: this.scroll, moved: false };
    return null;
  }

  pointerMove(p) {
    if (!this.drag || !p.isDown) return;
    const dy = p.y - this.drag.y;
    if (!this.drag.moved && Math.abs(dy) < 4) return;
    this.drag.moved = true;
    this.free = true;
    this.scroll = this.drag.scroll - Math.round(dy / LINE);
    this.draw();
  }

  /** A release without a drag is a tap on a part: look at it; tapped again, fit it. */
  pointerUp() {
    const drag = this.drag;
    this.drag = null;
    if (!drag || drag.moved) return;
    const i = this.scroll + Math.floor((drag.y - this.top) / LINE);
    if (i < 0 || i >= this.list().length) return;
    if (i === this.focus) return this.activate();
    this.focus = i;
    this.draw();
  }

  update(dt) {
    this.t += dt;
    const k = this.lane ? 1 : 2; // (the test lane shows the ship at its real size, low in the frame)
    this.art.y = this.lane ? this.shipY + 11 : this.shipY + Math.round(Math.sin(this.t * 3) * 1.5) * 2;
    this.flame.y = this.art.y + (this.flameY ?? 8) * k;
    this.flame.setScale(k, k * (this.flameLong ?? 1));
    this.palArt.setPosition(this.lane ? 24 : 54, this.lane ? this.art.y + 8 + Math.sin(this.t * 5) * 1.2 : this.shipY + 22 + Math.round(Math.sin(this.t * 5) * 1.5));
    if (this.lane) {
      // the shots climb from the nose to the daruma (it flinches as one lands); the bullets drift down the sides
      const top = 44;
      const from = this.art.y - 8;
      let hit = false;
      this.laneShots.forEach((s, i) => {
        const at = (this.t * 2.6 + i / 3) % 1;
        s.y = from - (from - top) * at;
        hit ||= at > 0.9;
      });
      this.dummy.setTint(hit ? 0xffb0b0 : 0xffffff).setX(36 + (hit ? Math.round(Math.sin(this.t * 60)) : 0));
      this.laneEb.forEach((b, i) => b.setPosition(i ? 54 : 19, (i ? 32 : 42) + ((this.t * (i ? 22 : 16) + i * 20) % (i ? 44 : 34))));
    }
    // (an animated paint job: its colour flowing over the hull)
    if (this.anim) this.art.setTint(fxTint(this.anim, this.t));
    else this.art.clearTint();
  }

  destroy() {
    for (const o of this.items) o.destroy();
  }
}
