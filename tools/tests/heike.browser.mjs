// Run against real Phaser: phase changes must work on every animation frame.
import assert from 'node:assert/strict';
import { startServer, launchBrowser } from './browser-support.mjs';

const server = await startServer(5178);
let browser;
try {
  browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:5178/?stage=7&t=102&god');
  await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
  const results = await page.evaluate(() => {
    const s = game.scene.getScene('Stage');
    s.startGame(); game.loop.stop();
    const e = s.enemies.spawn({ type: 'heavy', x: 90 });
    e.p2 = true;
    const results = [];
    for (let i = 0; i < 4; i++) {
      e.play({ key: 'heike', startFrame: i });
      try {
        s.enemies.heikeWorn(e);
        results.push({ frame: i, actual: e.anims.currentFrame.index - 1, key: e.anims.currentAnim.key });
      } catch (error) { results.push({ frame: i, error: error.message }); }
    }
    if (results.some(r => r.error)) return results;
    e.anims.stop(); e.setFrame('heike_guard');
    s.enemies.heikeWorn(e);
    results.push({ guard: e.frame.name });
    return results;
  });
  console.log(JSON.stringify(results));
  assert.deepEqual(results, [
    ...Array.from({ length: 4 }, (_, i) => ({ frame: i, actual: i, key: 'heike_c' })),
    { guard: 'heike_guard_c' },
  ]);
  assert.deepEqual(errors, []);
} finally {
  await browser?.close(); server.kill();
}
