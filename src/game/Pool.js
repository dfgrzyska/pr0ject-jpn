import { baseScale } from './enemyArt.js';

// Sprite pool: reuse sprites instead of creating/destroying them during play.
// `resolve` (the enemies' pools: enemyTexture) picks the texture a frame comes from; each sprite keeps the
// scale its texture is drawn at as `base` (1, or 1/3 for art drawn at 540 px), and scales by it.
export class Pool {
  constructor(scene, depth, resolve = null) {
    this.scene = scene;
    this.depth = depth;
    this.resolve = resolve;
    this.live = [];
    this.free = [];
  }

  spawn(frame, x, y, props) {
    const key = this.resolve ? this.resolve(frame) : 'sprites';
    let s = this.free.pop();
    if (!s) s = this.scene.add.sprite(0, 0, key, frame);
    // (setting the depth makes Phaser re-sort the whole scene, even to the same value: only when it differs)
    if (s.depth !== this.depth) s.setDepth(this.depth);
    if (s.originX !== 0.5 || s.originY !== 0.5) s.setOrigin(0.5, 0.5);
    if (s.texture.key !== key) s.setTexture(key, frame);
    else s.setFrame(frame);
    s.base = baseScale(key);
    s.setPosition(x, y).setAlpha(1).setScale(s.base).setRotation(0).setVisible(true).setActive(true).setFlipX(false).setFlipY(false);
    if (s.blendMode !== 0) s.setBlendMode(0);
    s.clearTint();
    s.dead = false;
    if (props) Object.assign(s, props);
    this.live.push(s);
    return s;
  }

  /** Make sprites ahead, up to n in all (at a stage's start), so none has to be made in the middle of a fight. */
  warm(n, frame = 'eb_s') {
    for (let i = this.live.length + this.free.length; i < n; i++) {
      const s = this.scene.add.sprite(0, 0, 'sprites', frame).setDepth(this.depth).setVisible(false).setActive(false);
      s.dead = true;
      this.free.push(s);
    }
  }

  kill(s) {
    if (s.dead) return;
    s.dead = true;
    s.anims.stop();
    s.setVisible(false).setActive(false);
  }

  /** Remove killed sprites from the live list (call once per frame). */
  sweep() {
    let j = 0;
    for (const s of this.live) {
      if (s.dead) this.free.push(s);
      else this.live[j++] = s;
    }
    this.live.length = j;
  }

  clear() {
    for (const s of this.live) this.kill(s);
    this.sweep();
  }
}
