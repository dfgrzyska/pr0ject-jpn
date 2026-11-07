import { RENDER_SCALE } from './config.js';

/** Preserve crisp pixel-grid vertex rounding under a zoomed camera:
 * - legacy 1x art (`scale = 1`) snaps to `RENDER_SCALE` (3 px) steps;
 * - native 540px art (`scale = 1 / RENDER_SCALE`) snaps to 1 px buffer steps with exact integer frame size
 *   (Phaser 4's Float32 `cmm[0] === 1` check misses `3 * Math.fround(1 / 3)`).
 */
export function installLegacyPixelGrid(renderer) {
  for (const name of ['TransformerImage', 'TransformerTileSprite']) {
    const node = renderer.renderNodes.getNode(name);
    const run = node.run;
    node.run = function (context, object, ...args) {
      run.call(this, context, object, ...args);
      const m = this._calcMatrix.matrix;
      if (context.camera.zoom !== RENDER_SCALE || m[1] !== 0 || m[2] !== 0 || !object.willRoundVertices(context.camera, true)) return;
      if (m[0] === RENDER_SCALE && m[3] === RENDER_SCALE) {
        for (let i = 0; i < 8; i++) this.quad[i] = Math.round(this.quad[i] / RENDER_SCALE) * RENDER_SCALE;
      } else if (Math.abs(Math.abs(m[0]) - 1) < 1e-4 && Math.abs(Math.abs(m[3]) - 1) < 1e-4) {
        const q = this.quad;
        const dx = Math.round(q[4] - q[0]);
        const dy = Math.round(q[3] - q[1]);
        const x0 = Math.round(q[0]);
        const y0 = Math.round(q[1]);
        q[0] = q[2] = x0;
        q[4] = q[6] = x0 + dx;
        q[1] = q[7] = y0;
        q[3] = q[5] = y0 + dy;
      }
    };
  }
}

export function configureCamera(camera) {
  camera.setOrigin(0, 0).setZoom(RENDER_SCALE).setScroll(0, 0).setRoundPixels(true);
  // Phaser's shake uses viewport size * zoom, then applies the camera matrix.
  // Keep its offsets in the original logical units, including integer rounding.
  const shake = camera.shake;
  camera.shake = function (duration, intensity = 0.05, ...args) {
    const divisor = RENDER_SCALE ** 2;
    const scaled = typeof intensity === 'number'
      ? intensity / divisor
      : { x: intensity.x / divisor, y: intensity.y / divisor };
    return shake.call(this, duration, scaled, ...args);
  };
}
