// Phase/animation smoke test, not a balance test: HP and destructible parts are
// controlled to exercise transitions while real Phaser advances every sprite.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { startServer, launchBrowser } from './browser-support.mjs';

const server = await startServer(5179);
let browser;
try {
  browser = await launchBrowser();
  for (let city = 1; city <= 8; city++) for (const type of ['heavy', 'boss']) {
    // The bear's fire/charge mechanism is covered by boss-encounters.browser.mjs.
    if (city === 3 && type === 'boss') continue;
    const stage = JSON.parse(readFileSync(`src/data/stage${city}.json`, 'utf8'));
    const wave = stage.waves.find(w => w.type === type);
    const page = await browser.newPage({ viewport: { width: 540, height: 1260 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.text()); });
    await page.addInitScript(() => localStorage.setItem('shmupjp.difficulty', 'normal'));
    await page.goto(`http://127.0.0.1:5179/?stage=${city}&t=${wave.t - 1}&god`);
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title');
    const result = await page.evaluate(({ city, type }) => {
      const s = game.scene.getScene('Stage');
      s.startGame(); game.loop.stop(); s.player.fire = () => {};
      let target, elapsed = 0, changed = 0;
      const phases = new Set();
      for (let frame = 0; frame < 60 * 100; frame++) {
        s.sys.updateList.update();
        s.sys.updateList.sceneUpdate(frame * 1000 / 60, 1000 / 60);
        s.update(frame * 1000 / 60, 1000 / 60);
        target ??= type === 'heavy' ? s.enemies.live.find(e => e.type === 'heavy') : s.enemies.bossGroup;
        if (!target) continue;
        const ready = type === 'heavy' ? target.state === 'fight' : (target.state === 'fight' || target.parts?.some(p => p.state === 'fight'));
        if (ready) elapsed += 1 / 60;
        const phase = type === 'heavy' ? (target.kind === 'yukionna' || target.kind === 'oranda' ? target.phase : target.stage ?? (target.p2 ? 2 : 1)) : target.stage ?? 1;
        if (ready && phase) phases.add(phase);
        if (type === 'boss' && city === 5 && (target.piles || target.pileArt || target.slams.some(sl => sl.pinned))) throw new Error('Removed Tako pin mechanic returned');

        if (elapsed > 9 && changed === 0 || elapsed > 19 && changed === 1) {
          changed++;
          const fraction = changed === 1 ? 0.45 : 0.2;
          if (type === 'heavy') {
            if (city === 5) s.enemies.destroy(target.kuroko[changed - 1], true);
            else target.hp = target.maxHp * fraction;
          } else {
            for (const p of [...target.parts]) if (!p.dead && p.group === target) p.hp = p.maxHp * fraction;
            if (city === 2 && changed === 2) s.enemies.destroy(target.parts[0], true);
            if (city === 4 && changed === 1) for (const p of [...target.parts]) if (p.role === 'vent' && !p.dead) s.enemies.destroy(p, true);
            if (city === 5 && changed === 1) for (const p of [...target.parts]) if (p.front && !p.dead) s.enemies.destroy(p, true);
            if (city === 7 && changed === 1) for (const p of [...target.braziers]) if (!p.dead) s.enemies.destroy(p, true);
          }
        }
        if (frame % 60 === 0) { game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender(); }
        if (elapsed > 29) break;
      }
      return { phases: [...phases].sort(), elapsed, changed, kind: target?.kind };
    }, { city, type });
    console.log(`stage ${city} ${type}: ${JSON.stringify(result)}`);
    assert(result.elapsed > 29, 'encounter must run through all transition windows');
    const expected = type === 'boss' || [3, 5, 8].includes(city) ? [1, 2, 3] : [1, 2];
    assert.deepEqual(result.phases, expected, `stage ${city} ${type}: phase coverage`);
    assert.deepEqual(errors, [], `stage ${city} ${type}: browser errors/warnings`);
    await page.close();
  }
} finally {
  await browser?.close(); server.kill();
}
