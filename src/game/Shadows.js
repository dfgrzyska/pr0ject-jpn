import { DEPTH } from '../config.js';

// Shadows of what flies, thrown down and to the right on the city below (the sun is where the strip's own
// shadows say it is). They are what shows how high the ship is. A stage asks for them with "shadows": true.
const FAR = { x: 9, y: 13 }; // how far below the ship and the small enemies, px
const BIG = 22; // from about this half-width the shadow falls further: a heavy or a boss flies higher
const STRENGTH = 0.3;

export class Shadows {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    for (let i = 0; i < 24; i++) this.make();
  }

  make() {
    const o = this.scene.add.image(0, 0, 'sprites', 'eb_s').setDepth(DEPTH.ground + 0.3).setTint(0x000000).setVisible(false);
    this.list.push(o);
    return o;
  }

  /** Lay one shadow under a sprite; returns the next free slot. */
  cast(i, s, a) {
    const o = this.list[i] ?? this.make();
    const k = s.displayWidth / 2 > BIG ? 1.6 : 1;
    o.setTexture(s.texture.key, s.frame.name)
      .setPosition(s.x + FAR.x * k, s.y + FAR.y * k)
      .setScale(s.scaleX * 0.8, s.scaleY * 0.8)
      .setRotation(s.rotation)
      .setFlipX(s.flipX)
      .setFlipY(s.flipY)
      .setAlpha(a * Math.min(1, s.alpha))
      .setVisible(true);
    return i + 1;
  }

  update(H) {
    const { player, enemies, parallax } = this.scene;
    // (by night the ground is dark already, and a black shadow would read as a hole)
    const a = STRENGTH * (1 - 0.55 * parallax.darkness(H));
    let n = 0;
    if (player.alive && player.sprite.visible) n = this.cast(n, player.sprite, a);
    for (const e of enemies.pool.live) {
      if (e.dead || e.ground || e.ghost || !e.visible) continue;
      if (e.y < -30 || e.y > H + 30) continue;
      n = this.cast(n, e, a);
    }
    for (let i = n; i < this.list.length; i++) this.list[i].setVisible(false);
  }
}
