// Optional integration smoke test. See docs/nagasaki-research.md for setup.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { chromium } from '../preview/browser-runtime/node_modules/playwright/index.mjs';
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5175'], { windowsHide: true, stdio: 'ignore' });
let browser;
try {
  await new Promise(r => setTimeout(r, 1500));
  browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  for (const H of [320, 420]) {
    const page = await browser.newPage({ viewport: { width: 540, height: H * 3 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
    await page.goto('http://127.0.0.1:5175/?stage=8&god');
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
    await page.evaluate(() => { const s = game.scene.getScene('Stage'); s.startGame(); game.loop.stop(); s.music.play = () => {}; });
    const samples = [];
    for (const target of [12, 24, 70, 90, 115, 152, 158, 175, 200, 216, 229]) {
      const sample = await page.evaluate(target => {
        const s = game.scene.getScene('Stage');
        let frames = 0;
        while (s.t < target && s.state === 'play' && frames++ < 12000) {
          for (const e of s.enemies.live) if (e.type === 'boss') e.hp = 1e6;
          s.update(0, 1000 / 60);
        }
        const v = s.scenicView;
        return { t: s.t, u: s.parallax.uTop, state: s.state, enemies: s.enemies.count(), bullets: s.bullets.pool.live.length, quiet: s.ceasefire,
          heavy: s.enemies.heavy?.kind ?? null, mode: s.enemies.heavy?.mode ?? null, view: v.layers[0].visible, cityY: v.layers[1].y - v.tops[1], boss: s.enemies.bossGroup?.parts[0]?.state ?? null };
      }, target);
      assert.equal(sample.state, 'play'); assert(sample.t >= target);
      if (target === 90) assert.equal(sample.heavy, 'oranda');
      if (target >= 152 && target <= 158) { assert(sample.quiet); assert.equal(sample.bullets, 0); assert.equal(sample.enemies, 0); }
      if (target < 210) assert.equal(sample.view, false);
      if (target === 216) { assert(sample.view); assert(sample.cityY > 0, 'the city still rising'); }
      if (target === 229) { assert(sample.u >= 7160, 'the climb has crested'); assert(sample.cityY <= 2); assert(['rise', 'fight'].includes(sample.boss)); }
      samples.push(sample);
      if (H === 320 && [12, 70, 90, 158, 216, 229].includes(target)) {
        await page.evaluate(() => game.loop.start(game.step.bind(game)));
        await page.waitForTimeout(500);
        await page.screenshot({ path: `tools/preview/nagasaki-route-${target}.png` });
        await page.evaluate(() => game.loop.stop());
      }
    }
    const fight = await page.evaluate(() => {
      const s = game.scene.getScene('Stage');
      const phases = new Set();
      let frames = 0;
      // Firework countdowns and exposed-head windows deliberately pause ordinary volleys.
      while (s.enemies.bossGroup.phase < 3 && frames++ < 5400) {
        s.enemies.bossGroup.parts[0].hp = 1e6;
        s.update(0, 1000 / 60);
        phases.add(s.enemies.bossGroup.phase % 3);
      }
      return { state: s.state, phase: s.enemies.bossGroup.phase, phases: [...phases],
        body: s.enemies.bossGroup.body.length,
        length: s.enemies.bossGroup.parts[0].y - s.enemies.bossGroup.body.at(-1).y };
    });
    assert.equal(fight.state, 'play'); assert.equal(fight.phase, 3);
    assert.deepEqual([...fight.phases].sort(), [0, 1, 2]);
    assert.equal(fight.body, 9); assert(fight.length > 55);
    await page.evaluate(() => { game.scene.getScene('Stage').paused = true; game.loop.start(game.step.bind(game)); });
    await page.waitForTimeout(200);
    await page.screenshot({ path: `tools/preview/nagasaki-dragon-${H}.png` });
    await page.evaluate(() => { game.loop.stop(); game.scene.getScene('Stage').paused = false; });
    const defeated = await page.evaluate(() => {
      const s = game.scene.getScene('Stage');
      let frames = 0;
      while (s.enemies.bossGroup.parts[0].state !== 'fight' && frames++ < 600) s.update(0, 1000 / 60);
      // This route test forces victory through armor; interactive victories have their own harness.
      s.enemies.damage(s.enemies.bossGroup.parts[0], 2e8);
      return { won: s.bossDown, body: s.enemies.segPool.live.filter(e => !e.dead).length, quiet: s.ceasefire };
    });
    assert.deepEqual(defeated, { won: true, body: 0, quiet: true });
    const vista = await page.evaluate(() => {
      const s = game.scene.getScene('Stage'); let frames = 0;
      while (s.scenicView.t < 3 && frames++ < 10000) s.update(0, 1000 / 60);
      return { t: s.scenicView.t, done: s.scenicView.done, shade: s.scenicView.shade.alpha, objects: s.scenicView.layers.length + s.scenicView.points.length };
    });
    // The 540 px panorama has seven cropped layers and 36 moving light points.
    assert(vista.t >= 3); assert(!vista.done); assert(vista.shade < 0.2); assert.equal(vista.objects, 43);
    await page.evaluate(() => game.loop.start(game.step.bind(game)));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `tools/preview/nagasaki-inasa-${H}.png` });
    const before = await page.evaluate(() => {
      const v = game.scene.getScene('Stage').scenicView;
      return { ferryX: v.ferries[0].boat.x, windowAlpha: v.layers[2].alpha, count: game.scene.getScene('Stage').children.list.length };
    });
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => {
      const v = game.scene.getScene('Stage').scenicView;
      return { ferryX: v.ferries[0].boat.x, windowAlpha: v.layers[2].alpha, count: game.scene.getScene('Stage').children.list.length };
    });
    assert.notEqual(before.ferryX, after.ferryX);
    assert.equal(before.count, after.count, 'the vista must reuse its scene objects');
    const clear = await page.evaluate(() => {
      game.loop.stop(); const s = game.scene.getScene('Stage');
      const before = s.scenicView.t; s.paused = true; s.update(0, 50);
      const paused = s.scenicView.t === before; s.paused = false;
      for (let i = 0; i < 1800 && s.state === 'play'; i++) s.update(0, 1000 / 60);
      return { state: s.state, done: s.scenicView.done, paused };
    });
    assert.deepEqual(clear, { state: 'clear', done: true, paused: true });
    await page.reload();
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
    const illustration = await page.evaluate(async () => {
      const { discoveries } = await import('/src/game/Discoveries.js');
      discoveries.discover('oranda');
      const s = game.scene.getScene('Stage');
      s.openCollection('yokai');
      s.book.index = s.book.entries.findIndex(e => e.id === 'oranda');
      s.book.layout(s.H);
      return { width: s.book.art.displayWidth, height: s.book.art.displayHeight, visible: s.book.art.visible };
    });
    assert(illustration.visible && illustration.width <= 70 + 1e-6 && illustration.height <= 55 + 1e-6, JSON.stringify(illustration));
    await page.waitForTimeout(200);
    await page.screenshot({ path: `tools/preview/oranda-album-${H}.png` });
    assert.deepEqual(errors, []);
    console.log(`Nagasaki ${H}: route, float, memorial, the rising view, the dragon, victory, pause and clear passed.`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
