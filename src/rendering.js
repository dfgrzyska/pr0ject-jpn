import { RENDER_SCALE } from './config.js';

/** Preserve Phaser's old safe rounding for unscaled, unrotated legacy sprites.
 * Phaser 4's safeAuto only rounds a unit matrix; camera zoom otherwise disables it.
 * High-resolution art scaled down to logical units still uses Phaser's native rounding.
 */
export function installLegacyPixelGrid(renderer) {
  for (const name of ['TransformerImage', 'TransformerTileSprite']) {
    const node = renderer.renderNodes.getNode(name);
    const run = node.run;
    node.run = function (context, object, ...args) {
      run.call(this, context, object, ...args);
      const m = this._calcMatrix.matrix;
      if (context.camera.zoom !== RENDER_SCALE ||
          m[0] !== RENDER_SCALE || m[1] !== 0 || m[2] !== 0 || m[3] !== RENDER_SCALE ||
          !object.willRoundVertices(context.camera, true)) return;
      for (let i = 0; i < 8; i++) this.quad[i] = Math.round(this.quad[i] / RENDER_SCALE) * RENDER_SCALE;
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
