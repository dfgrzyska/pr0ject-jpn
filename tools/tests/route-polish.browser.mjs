import assert from 'node:assert/strict';
import { startServer, launchBrowser } from './browser-support.mjs';
const server = await startServer(5180);
let browser;
try {
  browser = await launchBrowser();
  for (const [city, time, label] of [[1, 90, 'otagi'], [6, 0, 'wani-yokai'], [7, 26, 'dome']]) {
    const page = await browser.newPage({ viewport: { width: 540, height: 1260 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['warning', 'error'].includes(m.type())) errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:5180/?stage=${city}&t=${time}&god`);
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
    await page.evaluate(city => {
      const s = game.scene.getScene('Stage'); s.startGame(); game.loop.stop();
      window.advance = frames => {
        for (let i = 0; i < frames; i++) {
          s.sys.updateList.update(); s.sys.updateList.sceneUpdate(0, 1000 / 60); s.update(0, 1000 / 60);
          if (s.ceasefire && s.player.shots.live.some(p => !p.dead)) throw new Error('Player shots remain during ceasefire');
          if (s.ceasefire && s.enemies.live.some(e => !e.dead)) throw new Error('Enemy remains during ceasefire');
        }
        game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
        return { t: s.t, quiet: s.ceasefire, top: s.parallax.uTop };
      };
      if (city === 6) {
        s.waves.update = () => {};
        s.player.fire = () => {};
        const e = s.enemies.spawn({ type: 'heavy', x: 90 });
        s.enemies.update = () => { e.y = 90; e.setRotation(0).setFrame('wani_0'); };
      }
    }, city);
    if (city === 7) {
      const start = await page.evaluate(() => advance(100));
      assert(start.quiet && start.top >= 1245 && start.top < 1265);
      await page.screenshot({ path: 'tools/preview/dome-ceasefire.png' });
      const mid = await page.evaluate(() => advance(300));
      assert(mid.quiet);
      await page.screenshot({ path: 'tools/preview/hiroshima-silence.png' });
      const end = await page.evaluate(() => advance(400));
      assert(!end.quiet && end.t > 39 && end.top > 2055);
    } else {
      await page.evaluate(n => advance(n), city === 6 ? 240 : 1);
      if (city === 1) await page.evaluate(() => {
        const s = game.scene.getScene('Stage'); s.hud.banner.setVisible(false); s.hud.bannerSub.setVisible(false);
        game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
      });
      await page.screenshot({ path: `tools/preview/${label}.png` });
    }
    assert.deepEqual(errors, [], `${label}: console`);
    await page.close();
  }
} finally { await browser?.close(); server.kill(); }
