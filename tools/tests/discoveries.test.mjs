// Run: node --experimental-vm-modules --test tools/tests/discoveries.test.mjs
// UI classes run with a small scene adapter; no browser, user saves or live game are touched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { YOKAI, FOODS, createDiscoveryStore, yokaiForEnemy } from '../../src/data/discoveries.js';
import * as config from '../../src/config.js';
import { buildSprites } from '../art/sprites.mjs';
import { buildFont, FONT } from '../art/font.mjs';
import { Raster, rgb } from '../lib/raster.mjs';

const art = new Map(buildSprites().map(({ name, raster }) => [name, raster]));
const stages = Array.from({ length: 8 }, (_, i) => JSON.parse(readFileSync(new URL(`../../src/data/stage${i + 1}.json`, import.meta.url))));
let language = 'pl';
class Item {
  constructor(scene, kind, x = 0, y = 0, frame = '') {
    Object.assign(this, { kind, x, y, frame, visible: true, scaleX: 1, scaleY: 1, originX: 0.5, originY: 0.5, depth: 0, text: '', commands: [] });
    scene.items.push(this);
  }
  get width() { return this.kind === 'text' ? Math.max(...this.text.split('\n').map((s) => s.length * 6 + 1)) : art.get(this.frame)?.w ?? this.w; }
  get height() { return this.kind === 'text' ? this.text.split('\n').length * 14 - 1 : art.get(this.frame)?.h ?? this.h; }
  setDepth(d) { this.depth = d; return this; }
  setVisible(v) { this.visible = v; return this; }
  setTint(c) { this.tint = c; return this; }
  setScale(x, y = x) { this.scaleX = x; this.scaleY = y; return this; }
  setOrigin(x, y = x) { this.originX = x; this.originY = y; return this; }
  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setText(t) { this.text = t; return this; }
  setFrame(f) { assert(art.has(f), `missing atlas frame ${f}`); this.frame = f; return this; }
  setLineSpacing() { return this; }
  clear() { this.commands = []; return this; }
  fillStyle(c, a = 1) { this.fill = c; this.alpha = a; return this; }
  lineStyle(w, c, a = 1) { this.stroke = c; return this; }
  fillRect(x, y, w, h) { this.commands.push(['fill', x, y, w, h, this.fill]); return this; }
  strokeRect(x, y, w, h) { this.commands.push(['stroke', x, y, w, h, this.stroke]); return this; }
  strokeCircle() { return this; }
  destroy() { this.visible = false; this.destroyed = true; }
}
function scene(stage = 'stage1', H = 320) {
  const s = { items: [], H, state: 'play', stage: stages.find((s) => s.id === stage), paused: false, top: 420, score: { mult: 1, score: 0, add(n) { this.score += n; } }, player: { alive: true, x: 90, y: 280 }, sfx: { pickup() {}, tick() {} }, fx: { text() {} }, hud: { cardT: 0, sealT: 0, bannerT: 0 }, closeBook() { this.closed = true; } };
  s.parallax = { screenY: (u) => s.top - u };
  s.add = {
    image: (x, y, texture, frame) => new Item(s, 'image', x, y, frame).setFrame(frame),
    graphics: () => new Item(s, 'graphics'),
    rectangle: (x, y, w, h, color) => Object.assign(new Item(s, 'rect', x, y), { w, h, color }),
  };
  s.discoveryNotice = { messages: [], add(e) { this.messages.push(e); } };
  return s;
}
const pixelText = (s, x, y, text, origin = 0.5, font = 'pixel') => Object.assign(new Item(s, 'text', x, y).setText(text).setOrigin(origin, origin === 0 ? 0 : 0.5), { font });
const mod = new SourceTextModule(readFileSync(new URL('../../src/game/Discoveries.js', import.meta.url), 'utf8'));
await mod.link(async (path) => {
  const exports = path.includes('config') ? config : path.includes('data/discoveries') ? { YOKAI, FOODS, createDiscoveryStore }
    : path.includes('stages') ? { STAGES: stages } : path.includes('i18n') ? { getLang: () => language }
      : path.includes('Hud') ? { pixelText } : { INK_FONT: 'ink' };
  return new SyntheticModule(Object.keys(exports), function () { for (const [k, v] of Object.entries(exports)) this.setExport(k, v); });
});
await mod.evaluate();
const { discoveries, FoodTrail, DiscoveryBook, DiscoveryNotice, wrapJournal } = mod.namespace;

test('save immediately, deduplicate, reload, tolerate blocked storage and corrupted saves', () => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) };
  const first = createDiscoveryStore(storage);
  assert(first.discover('kitsune')); assert(!first.discover('kitsune')); assert(!first.discover('invented'));
  assert(createDiscoveryStore(storage).has('kitsune'));
  assert(!createDiscoveryStore({ getItem: () => 'broken' }).has('kitsune'));
  assert(!createDiscoveryStore({ getItem: () => '["kitsune"]' }).has('kitsune'));
  const blocked = createDiscoveryStore({ getItem() { throw Error(); }, setItem() { throw Error(); } });
  assert(blocked.discover('takoyaki')); assert(blocked.has('takoyaki')); assert(!blocked.discover('takoyaki'));
});

test('only real defeated folklore types unlock; bosses require complete victory', () => {
  for (const entry of YOKAI) assert.equal(yokaiForEnemy(entry.stage, { type: entry.type }, true), entry);
  assert.equal(yokaiForEnemy('stage2', { type: 'boss', role: 'body' }), null);
  assert.equal(yokaiForEnemy('stage1', { type: 'decoy' }), null);
  assert.equal(yokaiForEnemy('stage5', { type: 'kuroko' }), null);
  assert.equal(yokaiForEnemy('stage3', { type: 'popcorn' }), null);
});

test('all cities have two distinct reachable food stops and existing illustrations', () => {
  assert.equal(new Set([...YOKAI, ...FOODS].map((e) => e.id)).size, YOKAI.length + FOODS.length);
  for (const stage of stages) {
    const foods = FOODS.filter((e) => e.stage === stage.id);
    assert.equal(foods.length, 2);
    for (const food of foods) {
      assert(food.x >= 20 && food.x <= 160);
      assert((food.u + 36 - stage.scroll.anchor) / stage.scroll.mid < stage.end - 10);
      assert(art.has(food.frame));
    }
  }
  for (const e of YOKAI) assert(art.has(e.frame));
});

test('food releases once, pauses, collects immediately, awards repeat points and misses cleanly', () => {
  const s = scene('stage5'); const trail = new FoodTrail(s); const stop = trail.stops.find((p) => p.entry.id === 'takoyaki');
  s.top = stop.entry.u + 35; trail.update(0); assert.equal(stop.state, 'waiting');
  s.top++; trail.update(0); assert.equal(stop.state, 'falling'); assert(stop.sprite.visible);
  s.paused = true; trail.update(1); assert.equal(stop.sprite.y, 36); s.paused = false;
  Object.assign(s.player, { x: stop.sprite.x, y: stop.sprite.y }); trail.update(0);
  assert.equal(stop.state, 'collected'); assert(discoveries.has('takoyaki')); assert.equal(s.score.score, 1000);
  trail.update(1); assert.equal(s.score.score, 1000);
  const repeat = scene('stage5'); repeat.top = s.top; Object.assign(repeat.player, { x: 54, y: 36 });
  const again = new FoodTrail(repeat); again.update(0); assert.equal(repeat.score.score, 250); assert.equal(repeat.discoveryNotice.messages.length, 0);
  const miss = scene('stage2'); const missed = new FoodTrail(miss); miss.top = 3600; missed.update(0);
  assert(missed.stops.every((p) => p.state === 'missed')); assert(!discoveries.has('goya'));
  const dead = scene('stage1'); const deadTrail = new FoodTrail(dead); dead.player.alive = false; dead.top = 386; Object.assign(dead.player, { x: 38, y: 36 }); deadTrail.update(0);
  assert.equal(deadTrail.stops[0].state, 'falling'); assert(!discoveries.has('yatsuhashi'));
  dead.state = 'over'; deadTrail.update(0); assert(!deadTrail.stops[0].sprite.visible);
  dead.state = 'play'; deadTrail.update(0); assert(deadTrail.stops[0].sprite.visible);
});

test('notices queue, wait for boss cards, pause and hide outside gameplay', () => {
  const s = scene(); const notice = new DiscoveryNotice(s); notice.add(YOKAI[0]); notice.add(YOKAI[1]);
  s.hud.cardT = 2; notice.update(1); assert.equal(notice.queue.length, 2); assert(!notice.band.visible);
  s.hud.cardT = 0; notice.update(0); assert.equal(notice.name.text, 'KITSUNE');
  assert.equal(notice.label.text, 'POKONANO · NOWY WPIS');
  s.paused = true; notice.update(5); assert.equal(notice.time, 2.8); assert(!notice.band.visible);
  s.paused = false; notice.update(3); assert.equal(notice.name.text, 'CHOCHIN-OBAKE');
  s.state = 'clear'; notice.update(0); assert(!notice.band.visible);
});

test('a Kyoto sweet unlocks only the dish, never Kitsune', () => {
  const s = scene('stage1');
  const trail = new FoodTrail(s);
  const foxBefore = discoveries.has('kitsune');
  s.top = 386;
  Object.assign(s.player, { x: 38, y: 36 });
  trail.update(0);
  assert(discoveries.has('yatsuhashi'));
  assert.equal(discoveries.has('kitsune'), foxBefore);
  assert.deepEqual(s.discoveryNotice.messages.map(e => e.id), ['yatsuhashi']);
});

test('journal locking, page wrap, touch navigation, destruction and PL/EN layout at both sizes', () => {
  const lockedScene = scene(); const locked = new DiscoveryBook(lockedScene, 'yokai');
  assert.equal(locked.name.text, '???'); assert(!locked.art.visible); assert(!locked.story.text.includes('LISY'));
  locked.turn(-1); assert.equal(locked.index, YOKAI.length - 1); locked.turn(1); assert.equal(locked.index, 0);
  locked.pointer({ x: 150, y: 276 }); assert.equal(locked.index, 1);
  locked.pointer({ x: 90, y: 307 }); assert(lockedScene.closed);
  locked.destroy(); assert(locked.items.every((o) => o.destroyed));
  for (const e of [...YOKAI, ...FOODS]) discoveries.discover(e.id);
  const chars = buildFont().chars;
  for (const lang of ['pl', 'en']) {
    language = lang;
    for (const H of [320, 420]) for (const kind of ['food', 'yokai']) {
      const book = new DiscoveryBook(scene('stage1', H), kind);
      for (let i = 0; i < book.entries.length; i++) {
        book.index = i; book.layout(H);
        assert(book.art.visible);
        assert(book.art.width * book.art.scaleX <= 70, `${kind}/${i} illustration too wide`);
        assert(book.art.height * book.art.scaleY <= 55, `${kind}/${i} illustration too tall`);
        assert.equal(book.art.scaleX, book.art.scaleY, 'illustrations retain their proportions');
        assert(book.story.y + book.story.height <= book.hint.y - 4, `${kind}/${i}/${lang} story overlaps controls`);
        for (const line of book.story.text.split('\n')) assert(line.length <= 25);
        for (const ch of book.story.text) assert(ch === '\n' || chars.includes(ch), `missing glyph ${ch}`);
        for (const o of [book.name, book.city, book.title]) assert(o.width <= 160);
        assert.equal(book.story.scaleX, 1);
      }
      book.destroy();
    }
  }
});

// Render the very same page objects using the game's bitmap font and sprite generators.
// This is a deterministic art/layout preview, not a substitute for a browser gameplay test.
function render(s, H) {
  const out = new Raster(180, H); out.rect(0, 0, 180, H, 0x0b0a12);
  for (const o of [...s.items].sort((a, b) => a.depth - b.depth)) {
    if (!o.visible) continue;
    if (o.kind === 'rect') out.rect(o.x - Math.floor(o.w * o.originX), o.y - Math.floor(o.h * o.originY), o.w, o.h, o.color);
    if (o.kind === 'graphics') for (const [type, x, y, w, h, c] of o.commands) {
      if (type === 'fill') out.rect(x, y, w, h, c);
      else { out.line(x, y, x + w, y, c); out.line(x, y, x, y + h, c); out.line(x + w, y, x + w, y + h, c); out.line(x, y + h, x + w, y + h, c); }
    }
    if (o.kind === 'image') out.blit(art.get(o.frame).scaled(o.scaleX), o.x - Math.floor(o.width * o.originX) * o.scaleX, o.y - Math.floor(o.height * o.originY) * o.scaleY);
    if (o.kind === 'text') {
      const font = buildFont(o.font !== 'ink');
      const bitmap = new Raster(o.width, o.height);
      o.text.split('\n').forEach((line, row) => [...line].forEach((ch, col) => {
        const i = font.chars.indexOf(ch); if (i < 0) return;
        const glyph = font.raster.crop(i % FONT.perRow * 8, Math.floor(i / FONT.perRow) * 14, 7, 13);
        if (o.tint) glyph.map((r, g, b, a) => [r * rgb(o.tint)[0] / 255, g * rgb(o.tint)[1] / 255, b * rgb(o.tint)[2] / 255, a]);
        bitmap.blit(glyph, col * 6, row * 14);
      }));
      out.blit(bitmap.scaled(o.scaleX), o.x - Math.floor(o.width * o.originX) * o.scaleX, o.y - Math.floor(o.height * o.originY) * o.scaleY);
    }
  }
  return out;
}
test('write deterministic album and food layout previews', () => {
  language = 'pl';
  mkdirSync('tools/preview', { recursive: true });
  for (const [kind, index] of [['yokai', 5], ['food', 9]]) {
    const s = scene(); const book = new DiscoveryBook(s, kind); book.index = index; book.layout(320);
    writeFileSync(`tools/preview/${kind}-journal.png`, render(s, 320).scaled(3).toPNG());
  }
  const sheet = new Raster(140, 40);
  FOODS.forEach((e, i) => sheet.blit(art.get(e.frame), i % 7 * 20, Math.floor(i / 7) * 20));
  writeFileSync('tools/preview/foods.png', sheet.scaled(4, 0x182432).toPNG());
});
