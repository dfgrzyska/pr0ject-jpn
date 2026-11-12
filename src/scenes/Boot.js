import Phaser from 'phaser';
import { keepForOffline } from '../pwa.js';
import { installLegacyPixelGrid } from '../rendering.js';
import { STAGES } from '../data/stages.js';
import { setFontScale } from '../game/fontScale.js';
import { CITY_ANIMS, registerEnemyAtlas, registerSharedHi, spriteAnimTexture, unregisterEnemyAtlas } from '../game/enemyArt.js';

/** Whether a city's enemies are drawn at 540 px, in an atlas of their own (bg/<id>/enemies.png). */
const enemyArt = (id) => STAGES.some((st) => st.id === id && st.enemyArt);

export const FONT = 'pixel';
/** The same letters without their dark outline: print on light paper (the stamp book). */
export const INK_FONT = 'ink';

/**
 * Queue a city's backgrounds unless they are in already: the far loop, the middle layer's pieces and the
 * moving parts, all listed in bg/<id>/meta.json (fetched first if need be). Boot loads only what every
 * city shares, then stays on with its loader to bring the cities in one at a time (fetch), so a stage
 * starting over never cuts a download short.
 */
function queueStage(scene, id) {
  const load = scene.load;
  const tex = scene.textures;
  load.setPath('assets/');
  if (!tex.exists(`far_${id}`)) load.image(`far_${id}`, `bg/${id}/far.png`);
  if (enemyArt(id) && !tex.exists(`enemies_${id}`)) load.atlas(`enemies_${id}`, `bg/${id}/enemies.png`, `bg/${id}/enemies.json`);
  const rest = (meta) => {
    for (const name of meta.panorama ?? []) if (!tex.exists(`view_${id}_${name}`)) load.image(`view_${id}_${name}`, `bg/${id}/view_${name}.png`);
    for (let i = 0; i < meta.chunks; i++) if (!tex.exists(`mid_${id}_${i}`)) load.image(`mid_${id}_${i}`, `bg/${id}/mid_${String(i).padStart(2, '0')}.png`);
    if (meta.props && !tex.exists(`props_${id}`)) load.atlas(`props_${id}`, `bg/${id}/props.png`, `bg/${id}/props.json`);
  };
  const meta = scene.cache.json.get(`bg_${id}`);
  if (meta) rest(meta);
  else {
    load.json(`bg_${id}`, `bg/${id}/meta.json`);
    load.once(`filecomplete-json-bg_${id}`, (key, type, m) => rest(m));
  }
}

/** Whether a city's backgrounds are all in. */
export function stageReady(scene, id) {
  const meta = scene.cache.json.get(`bg_${id}`);
  const tex = scene.textures;
  return Boolean(meta) && (meta.panorama ?? []).every(name => tex.exists(`view_${id}_${name}`)) && tex.exists(`far_${id}`) && (!meta.props || tex.exists(`props_${id}`)) && (!enemyArt(id) || tex.exists(`enemies_${id}`)) && [...Array(meta.chunks).keys()].every((i) => tex.exists(`mid_${id}_${i}`));
}

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets/');
    this.load.atlas('sprites', 'sprites.png', 'sprites.json');
    this.load.atlas('sprites540', 'sprites540.png', 'sprites540.json'); // (the same frames at 540 px, where drawn)
    this.load.atlas('portraits', 'portraits.png', 'portraits.json'); // the album's and the parade's enemies at 540 px
    this.load.image('font', 'font.png');
    this.load.image('font_ink', 'font_ink.png');
    this.load.json('fontMeta', 'font.json');
    this.load.image('font540', 'font540.png'); // the same font at 540 px (the same layout times three)
    this.load.image('font540_ink', 'font540_ink.png');
    this.load.image('japan', 'japan.png'); // the map between stages (at 540 px)
    this.load.atlas('menu', 'menu.png', 'menu.json'); // the title screen (at 540 px)
    this.load.image('menu_waves', 'menu_waves.png');
    this.load.image('menu_washi', 'menu_washi.png'); // the paper of the books
    this.load.image('ending', 'ending.png'); // the ending's last picture (Fuji at sunrise)
    this.load.image('ending_clouds', 'ending_clouds.png');
    this.load.image('ending_night', 'ending_night.png'); // the night behind the summary and the bosses' parade
    // the cities' backgrounds come later, one city at a time (queueStage)
  }

  create() {
    installLegacyPixelGrid(this.game.renderer);
    this.load.on('complete', this.releaseUnusedStages, this);
    keepForOffline(); // what every city shares is in now
    this.textures.get('japan').setFilter(Phaser.Textures.FilterMode.LINEAR); // (the city menu shows it at 0.8)
    const meta = this.cache.json.get('fontMeta');
    // Phaser 4: Parse returns the whole cache entry ({ data, texture, frame })
    // the 540 px font when it is there (shown at a third by pixelText), else the 1x one
    const fine = this.textures.exists('font540') && this.textures.exists('font540_ink') ? 3 : 1;
    setFontScale(1 / fine);
    const font = (image) =>
      Phaser.GameObjects.RetroFont.Parse(this, {
        image: fine === 3 ? image.replace('font', 'font540') : image,
        width: meta.cellW * fine,
        height: meta.cellH * fine,
        chars: meta.chars,
        charsPerRow: meta.perRow,
        spacing: { x: meta.gap * fine, y: meta.gap * fine },
      });
    this.cache.bitmapFont.add(FONT, font('font'));
    this.cache.bitmapFont.add(INK_FONT, font('font_ink'));

    // (kept, so an animation a city's own atlas took over can come back when that atlas goes: cityArtOut)
    this.legacyAnims = {};
    this.cityAnims = {}; // key -> the city atlas it plays from now
    registerSharedHi(this.textures);
    const anim = (key, frames, frameRate, repeat = -1) => {
      this.legacyAnims[key] = [frames, frameRate, repeat];
      const tex = spriteAnimTexture(frames);
      this.anims.create({ key, frames: frames.map((frame) => ({ key: tex, frame })), frameRate, repeat });
    };
    this.textures.on('addtexture', (key) => {
      if (key.startsWith('enemies_')) this.cityArtIn(key);
    });
    anim('flame', ['flame_0', 'flame_1', 'flame_2', 'flame_1'], 20);
    anim('popcorn', ['popcorn_0', 'popcorn_1'], 3);
    anim('shooter', ['shooter_0', 'shooter_1'], 4);
    anim('diver', ['diver_0', 'diver_1'], 3);
    anim('tanuki', ['tanuki_0', 'tanuki_1'], 3);
    anim('tanuki_leaf', ['tanuki_leaf_0', 'tanuki_leaf_1'], 3);
    for (const c of ['red', 'blue', 'green']) anim(`carrier_${c}`, [`carrier_${c}_0`, `carrier_${c}_1`], 10);
    // stage 2 (Okinawa)
    anim('tobiuo', ['tobiuo_0', 'tobiuo_1'], 8);
    anim('hari', ['hari_0', 'hari_1'], 4);
    anim('habu', ['habu_0', 'habu_1'], 5);
    anim('manta', ['manta_0', 'manta_1', 'manta_2', 'manta_3'], 5);
    anim('shisa_a', ['shisa_a_0', 'shisa_a_1'], 3);
    anim('shisa_un', ['shisa_un_0', 'shisa_un_1'], 3);
    anim('gull', ['gull_0', 'gull_1'], 6);
    for (const c of ['red', 'blue', 'green']) anim(`glass_${c}`, [`glass_${c}_0`, `glass_${c}_1`], 10);
    // stage 3 (Sapporo)
    anim('enaga', ['enaga_0', 'enaga_1'], 9);
    anim('momonga', ['momonga_0', 'momonga_1'], 5);
    anim('wisp', ['wisp_0', 'wisp_1'], 10);
    anim('yukionna', [0, 1, 2, 3].map((i) => `yukionna_${i}`), 6);
    anim('kuma_heart', ['kuma_heart_0', 'kuma_heart_1'], 3);
    anim('plow_d', ['plow_d_0', 'plow_d_1'], 6);
    anim('plow_r', ['plow_r_0', 'plow_r_1'], 6);
    anim('dust', ['dust_0', 'dust_1'], 5);
    // stage 4 (Kagoshima)
    anim('kazan', ['kazan_0', 'kazan_1'], 6);
    anim('kazan_s', ['kazan_s_0', 'kazan_s_1'], 8);
    anim('teppo', ['teppo_0', 'teppo_1'], 6);
    anim('kappa', ['kappa_0', 'kappa_1'], 5);
    anim('ripple', ['ripple_0', 'ripple_1', 'ripple_2'], 6);
    anim('raiju', [0, 1, 2, 3].map((i) => 'raiju_' + i), 10);
    anim('vent', ['vent_0', 'vent_1'], 4);
    anim('crater', ['crater_0', 'crater_1'], 3);
    // stage 5 (Osaka)
    anim('takoyaki', ['takoyaki_0', 'takoyaki_1'], 6);
    anim('fugu', ['fugu_0', 'fugu_1'], 4);
    anim('kushi', ['kushi_0', 'kushi_1'], 10);
    anim('kuroko', ['kuroko_0', 'kuroko_1'], 3);
    anim('tako', ['tako_0', 'tako_1'], 2);
    for (const c of ['red', 'blue', 'green']) anim('ame_' + c, ['ame_' + c + '_0', 'ame_' + c + '_1'], 6);
    // stage 6 (Beppu)
    anim('imp', ['imp_0', 'imp_1'], 8);
    anim('kamado', ['kamado_0', 'kamado_1'], 4);
    anim('saru', ['saru_0', 'saru_1'], 8);
    anim('boil', ['boil_0', 'boil_1'], 10);
    anim('mudboil', ['mudboil_0', 'mudboil_1'], 5);
    for (const c of ['red', 'blue', 'green']) anim(`oke_${c}`, [`oke_${c}_0`, `oke_${c}_1`], 3);
    for (const c of ['red', 'blue', 'green']) anim(`ramen_${c}`, [`ramen_${c}_0`, `ramen_${c}_1`], 4);
    for (const name of ['n_lantern', 'n_biidoro', 'n_hata', 'n_oranda', 'n_ja']) anim(name, [name + '_0', name + '_1'], 5);
    for (const c of ['red', 'blue', 'green']) anim('n_castella_' + c, ['n_castella_' + c + '_0', 'n_castella_' + c + '_1'], 5);
    // stage 7 (Hiroshima & Miyajima)
    anim('tsuru', ['tsuru_0', 'tsuru_1'], 7);
    anim('shamoji', ['shamoji_0', 'shamoji_1'], 6);
    anim('heike', ['heike_0', 'heike_1'], 5);
    anim('sankibo', ['sankibo_0', 'sankibo_1'], 4);
    anim('brazier', ['brazier_0', 'brazier_1'], 7);
    for (const c of ['red', 'blue', 'green']) anim(`manju_${c}`, [`manju_${c}_0`, `manju_${c}_1`], 5);
    anim('homing', ['ps_homing_0', 'ps_homing_1'], 10);
    anim('expl_s', [0, 1, 2, 3, 4].map((i) => `expl_s_${i}`), 16, 0);
    anim('expl_m', [0, 1, 2, 3, 4, 5].map((i) => `expl_m_${i}`), 14, 0);
    anim('expl_l', [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `expl_l_${i}`), 12, 0);
    anim('spark', ['spark_0', 'spark_1', 'spark_2'], 24, 0);

    this.scene.launch('Stage'); // Boot stays, its loader keeps fetching (see fetch)
  }

  /** Bring in these cities' backgrounds, in this order (whatever isn't in or on its way already). */
  fetch(ids) {
    for (const id of ids) queueStage(this, id);
    if (!this.load.isLoading() && this.load.list.size) {
      this.load.once('complete', keepForOffline);
      this.load.start();
    }
  }

  retainStages(ids) {
    this.retainedStages = new Set(ids);
    this.releaseUnusedStages();
  }

  releaseUnusedStages() {
    if (!this.retainedStages) return;
    // Keep metadata and shared atlases/fonts; remove GPU textures, including late downloads.
    for (const key of this.textures.getTextureKeys()) {
      const city = /^(?:far|mid|props|view|enemies)_(stage\d+)(?:_|$)/.exec(key)?.[1];
      if (city && !this.retainedStages.has(city)) {
        if (key.startsWith('enemies_')) this.cityArtOut(key); // (its frames and animations go with it)
        this.textures.remove(key);
      }
    }
  }

  /** A city's 540 px enemies are in: its frames are looked up there, its animations play from there. */
  cityArtIn(key) {
    registerEnemyAtlas(this.textures, key);
    const tex = this.textures.get(key);
    for (const [k, [frames, frameRate, repeat = -1]] of Object.entries(CITY_ANIMS)) {
      if (!frames.every((f) => tex.has(f))) continue;
      this.anims.remove(k);
      this.anims.create({ key: k, frames: frames.map((frame) => ({ key, frame })), frameRate, repeat });
      this.cityAnims[k] = key;
    }
  }

  /** A city's atlas is going: its animations go back to the shared atlas (or away), its frames too. */
  cityArtOut(key) {
    unregisterEnemyAtlas(key);
    for (const [k, from] of Object.entries(this.cityAnims)) {
      if (from !== key) continue;
      this.anims.remove(k);
      delete this.cityAnims[k];
      const legacy = this.legacyAnims[k];
      if (legacy) this.anims.create({ key: k, frames: legacy[0].map((frame) => ({ key: spriteAnimTexture(legacy[0]), frame })), frameRate: legacy[1], repeat: legacy[2] });
    }
  }
}
