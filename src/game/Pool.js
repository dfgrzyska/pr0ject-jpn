// Sprite pool: reuse sprites instead of creating/destroying them during play.
export class Pool {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.live = [];
    this.free = [];
  }

  spawn(frame, x, y, props) {
    let s = this.free.pop();
    if (!s) s = this.scene.add.sprite(0, 0, 'sprites', frame);
    s.setFrame(frame).setPosition(x, y).setDepth(this.depth).setAlpha(1).setVisible(true).setActive(true).setFlipX(false);
    s.clearTint();
    s.dead = false;
    if (props) Object.assign(s, props);
    this.live.push(s);
    return s;
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
