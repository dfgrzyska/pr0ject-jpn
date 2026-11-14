// Random encounters in the real game: the vending machine's arena loads, its three phases run without a missing
// frame or a console warning, beating it pays a life and the flight goes on to the next city; a forced roll on the
// map stops the flight and the fight is at the same place in the journey.
import assert from 'node:assert/strict';
import { startServer, launchBrowser } from './browser-support.mjs';

const server = await startServer(5181);
let browser;
try {
  browser = await launchBrowser();
  const open = async (query) => {
    const page = await browser.newPage({ viewport: { width: 540, height: 1260 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (['warning', 'error'].includes(m.type())) errors.push(m.text()); });
    await page.goto(`http://127.0.0.1:5181/?${query}`);
    await page.waitForFunction(() => window.game?.scene.getScene('Stage')?.state === 'title', null, { timeout: 30000 });
    await page.evaluate(() => {
      window.step = (frames) => {
        const s = game.scene.getScene('Stage');
        for (let i = 0; i < frames; i++) { s.sys.updateList.update(); s.sys.updateList.sceneUpdate(0, 1000 / 60); s.update(0, 1000 / 60); }
        game.renderer.preRender(); game.scene.render(game.renderer); game.renderer.postRender();
      };
    });
    return { page, errors };
  };

  // 1. the fight itself, then on to the next city
  {
    const { page, errors } = await open('ex=ex1&god');
    const r = await page.evaluate(async () => {
      let s = game.scene.getScene('Stage');
      s.startGame(); game.loop.stop(); s.player.fire = () => {};
      const out = { id: s.stage.id, pos: s.pos, lives0: s.player.lives, phases: [] };
      step(60 * 6);
      const g = s.enemies.bossGroup;
      out.awake = g?.kind === 'jihanki' && g.awake;
      for (const f of [0.6, 0.3]) {
        g.body.hp = g.body.maxHp * f;
        step(60 * 14);
        out.phases.push(g.stage);
      }
      s.enemies.destroy(g.body);
      step(60 * 6);
      out.state = s.state;
      out.lives1 = s.player.lives;
      s.endTimer = 0;
      s.leaveClear();
      out.map = s.state === 'map' && s.map.resume;
      s.map.finish(); step(5);
      s.leaveMap();
      game.loop.start(game.step.bind(game)); // (the scene restarts on the game's own loop)
      for (let i = 0; i < 300 && !(game.scene.getScene('Stage').state === 'play' && game.scene.getScene('Stage').pos !== out.pos); i++) await new Promise((r) => setTimeout(r, 50));
      s = game.scene.getScene('Stage');
      out.next = { pos: s.pos, encounter: Boolean(s.encounter), id: s.stage.id };
      return out;
    });
    console.log(JSON.stringify(r));
    assert.equal(r.id, 'ex1');
    assert(r.awake, 'the machine is in and awake');
    assert.deepEqual(r.phases, [2, 3]);
    assert.equal(r.state, 'clear');
    assert.equal(r.lives1, r.lives0 + 1, 'an extra life');
    assert(r.map, 'the map resumes the flight');
    assert.deepEqual([r.next.pos, r.next.encounter], [r.pos + 1, false], 'on to the next city');
    await page.screenshot({ path: 'tools/preview/encounter-next.png' });
    assert.deepEqual(errors, [], 'ex1: console');
    await page.close();
  }

  // 2. a forced roll after a city: the flight stops, the fight is at the same place in the journey
  {
    const { page, errors } = await open('ex=always&god&stage=2');
    const r = await page.evaluate(async () => {
      let s = game.scene.getScene('Stage');
      s.startGame(); game.loop.stop();
      const pos = s.pos;
      s.openMap();
      const out = { pos, pending: s.pendingEncounter, alarm: s.map.encounter };
      step(60 * 3);
      out.ready = s.map.ready;
      s.leaveMap();
      game.loop.start(game.step.bind(game));
      for (let i = 0; i < 400 && !(game.scene.getScene('Stage').state === 'play' && game.scene.getScene('Stage').encounter); i++) await new Promise((r) => setTimeout(r, 50));
      s = game.scene.getScene('Stage');
      out.after = { pos: s.pos, id: s.stage.id };
      return out;
    });
    console.log(JSON.stringify(r));
    assert.equal(r.pending, 'ex1');
    assert(r.alarm && r.ready);
    assert.deepEqual(r.after, { pos: r.pos, id: 'ex1' });
    await page.screenshot({ path: 'tools/preview/encounter-arena.png' });
    assert.deepEqual(errors, [], 'forced roll: console');
    await page.close();
  }
} finally { await browser?.close(); server.kill(); }
