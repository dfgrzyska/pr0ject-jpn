import Phaser from 'phaser';
import { STAGES } from '../data/stages.js';

export const FONT = 'pixel';

export class Boot extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    this.load.setPath('assets/');
    this.load.atlas('sprites', 'sprites.png', 'sprites.json');
    this.load.image('font', 'font.png');
    this.load.json('fontMeta', 'font.json');
    this.load.image('japan', 'japan.png'); // the map between stages
    // per-stage backgrounds: far loop + mid chunks listed in bg/<id>/meta.json
    for (const { id } of STAGES) {
      this.load.image(`far_${id}`, `bg/${id}/far.png`);
      this.load.json(`bg_${id}`, `bg/${id}/meta.json`);
      this.load.once(`filecomplete-json-bg_${id}`, (key, type, meta) => {
        for (let i = 0; i < meta.chunks; i++) this.load.image(`mid_${id}_${i}`, `bg/${id}/mid_${String(i).padStart(2, '0')}.png`);
      });
    }
  }

  create() {
    const meta = this.cache.json.get('fontMeta');
    // Phaser 4: Parse returns the whole cache entry ({ data, texture, frame })
    const entry = Phaser.GameObjects.RetroFont.Parse(this, {
      image: 'font',
      width: meta.cellW,
      height: meta.cellH,
      chars: meta.chars,
      charsPerRow: meta.perRow,
      spacing: { x: meta.gap, y: meta.gap },
    });
    this.cache.bitmapFont.add(FONT, entry);

    const anim = (key, frames, frameRate, repeat = -1) =>
      this.anims.create({ key, frames: frames.map((frame) => ({ key: 'sprites', frame })), frameRate, repeat });
    anim('flame', ['flame_0', 'flame_1', 'flame_2', 'flame_1'], 20);
    anim('popcorn', ['popcorn_0', 'popcorn_1'], 3);
    anim('shooter', ['shooter_0', 'shooter_1'], 4);
    anim('diver', ['diver_0', 'diver_1'], 8);
    anim('kyubi', ['kyubi_0', 'kyubi_1', 'kyubi_2', 'kyubi_3'], 7);
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
    anim('homing', ['ps_homing_0', 'ps_homing_1'], 10);
    anim('expl_s', [0, 1, 2, 3, 4].map((i) => `expl_s_${i}`), 16, 0);
    anim('expl_m', [0, 1, 2, 3, 4, 5].map((i) => `expl_m_${i}`), 14, 0);
    anim('expl_l', [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `expl_l_${i}`), 12, 0);
    anim('spark', ['spark_0', 'spark_1', 'spark_2'], 24, 0);

    this.scene.start('Stage');
  }
}
