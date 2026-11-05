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
    for (const target of [12, 24, 70, 103, 115, 141, 155, 166, 185, 210]) {
      const sample = await page.evaluate(target => {
        const s = game.scene.getScene('Stage');
        let frames = 0;
        while (s.t < target && s.state === 'play' && frames++ < 10000) {
          for (const e of s.enemies.live) if (e.type === 'boss') e.hp = 1e6;
          s.update(0, 1000 / 60);
        }
        return { t: s.t, u: s.parallax.uTop, state: s.state, enemies: s.enemies.count(), bullets: s.bullets.pool.live.length, quiet: s.ceasefire, phase: s.enemies.bossGroup?.phase };
      }, target);
      assert.equal(sample.state, 'play'); assert(sample.t >= target);
      if (target >= 141 && target <= 166) { assert(sample.quiet); assert.equal(sample.bullets, 0); assert.equal(sample.enemies, 0); }
      if (target === 210) { assert.equal(sample.u, 6100); assert(sample.phase >= 3); }
      samples.push(sample);
      if (H === 320 && [12, 70, 103, 166].includes(target)) {
        await page.evaluate(() => game.loop.start(game.step.bind(game)));
        await page.waitForTimeout(500);
        await page.screenshot({ path: `tools/preview/nagasaki-route-${target}.png` });
        await page.evaluate(() => game.loop.stop());
      }
    }
    const defeated = await page.evaluate(() => {
      const s = game.scene.getScene('Stage'); s.enemies.damage(s.enemies.bossGroup.parts[0], 2e6);
      return { won: s.bossDown, body: s.enemies.segPool.live.filter(e => !e.dead).length, quiet: s.ceasefire };
    });
    assert.deepEqual(defeated, { won: true, body: 0, quiet: true });
    const vista = await page.evaluate(() => {
      const s = game.scene.getScene('Stage'); let frames = 0;
      while (s.scenicView.t < 10 && frames++ < 10000) s.update(0, 1000 / 60);
      return { u: s.parallax.uTop, t: s.scenicView.t, done: s.scenicView.done, objects: s.scenicView.layers.length + s.scenicView.points.length };
    });
    assert(vista.u >= 6700); assert(vista.t >= 10); assert(!vista.done); assert.equal(vista.objects, 31);
    await page.evaluate(() => game.loop.start(game.step.bind(game)));
    // Let Phaser's own animation manager finish effects after accelerated simulation.
    await page.waitForTimeout(1800);
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
    assert.notEqual(before.ferryX, after.ferryX); assert.notEqual(before.windowAlpha, after.windowAlpha);
    assert.equal(before.count, after.count, 'the vista must reuse its scene objects');
    const clear = await page.evaluate(() => {
      game.loop.stop(); const s = game.scene.getScene('Stage');
      const before = s.scenicView.t; s.paused = true; s.update(0, 50);
      const paused = s.scenicView.t === before; s.paused = false;
      for (let i = 0; i < 1800 && s.state === 'play'; i++) s.update(0, 1000 / 60);
      return { state: s.state, done: s.scenicView.done, paused };
    });
    assert.deepEqual(clear, { state: 'clear', done: true, paused: true });
    assert.deepEqual(errors, []);
    console.log(`Nagasaki ${H}: route, memorial, boss phases, scroll gate, victory, vista, pause and clear passed.`);
    await page.close();
  }
} finally {
  await browser?.close();
  server.kill();
}
