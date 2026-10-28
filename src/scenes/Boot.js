import Phaser from 'phaser';

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
    this.load.json('bgMeta', 'bg/stage1.json');
    this.load.image('far', 'bg/far.png');
    // mid chunks are listed in bg/stage1.json, queue them once it arrives
    this.load.once('filecomplete-json-bgMeta', (key, type, meta) => {
      for (let i = 0; i < meta.chunks; i++) this.load.image(`mid_${i}`, `bg/mid_${String(i).padStart(2, '0')}.png`);
    });
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
    anim('heavy', ['heavy_0', 'heavy_1'], 14);
    for (const c of ['red', 'blue', 'green']) anim(`carrier_${c}`, [`carrier_${c}_0`, `carrier_${c}_1`], 10);
    anim('homing', ['ps_homing_0', 'ps_homing_1'], 10);
    anim('expl_s', [0, 1, 2, 3, 4].map((i) => `expl_s_${i}`), 16, 0);
    anim('expl_m', [0, 1, 2, 3, 4, 5].map((i) => `expl_m_${i}`), 14, 0);
    anim('expl_l', [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `expl_l_${i}`), 12, 0);
    anim('spark', ['spark_0', 'spark_1', 'spark_2'], 24, 0);

    this.scene.start('Stage');
  }
}
