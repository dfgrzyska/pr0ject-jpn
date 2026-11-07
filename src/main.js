import Phaser from 'phaser';
import { RENDER_SCALE, VIEW } from './config.js';
import { Boot } from './scenes/Boot.js';
import { Stage } from './scenes/Stage.js';
import './pwa.js';

// Render at 540 x (960..1260), retaining the old physical size and logical pixel grid.
function fit() {
  const vv = window.visualViewport;
  const box = getComputedStyle(document.getElementById('game'));
  const px = (v) => parseFloat(v) || 0;
  const vw = (vv ? vv.width : window.innerWidth) - px(box.paddingLeft) - px(box.paddingRight);
  const vh = (vv ? vv.height : window.innerHeight) - px(box.paddingTop) - px(box.paddingBottom);
  const dpr = window.devicePixelRatio || 1;
  const height = Math.max(VIEW.minHeight, Math.min(VIEW.maxHeight, Math.round((VIEW.width * vh) / vw)));
  const scale = Math.max(1, Math.floor(Math.min((vw * dpr) / VIEW.width, (vh * dpr) / height)));
  return { height: height * RENDER_SCALE, zoom: scale / dpr / RENDER_SCALE };
}

const start = fit();
const game = new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'game',
  backgroundColor: '#0b0a12',
  render: { pixelArt: true },
  scale: { mode: Phaser.Scale.NONE, width: VIEW.width * RENDER_SCALE, height: start.height, zoom: start.zoom, autoRound: false },
  input: { activePointers: 3 },
  scene: [Boot, Stage],
});

let pending = 0;
function onResize() {
  cancelAnimationFrame(pending);
  pending = requestAnimationFrame(() => {
    const { height, zoom } = fit();
    const canvas = game.canvas;
    if (game.scale.height !== height) game.scale.resize(VIEW.width * RENDER_SCALE, height);
    game.scale.setZoom(zoom);
    canvas.style.width = `${VIEW.width * RENDER_SCALE * zoom}px`;
    canvas.style.height = `${height * zoom}px`;
    game.scale.refresh();
  });
}
window.addEventListener('resize', onResize);
window.visualViewport?.addEventListener('resize', onResize);
game.events.once('ready', onResize);

if (import.meta.env.DEV) window.game = game;
