// Trees swaying in the wind, for a stage whose strip is marked for it (meta.sway): the art generator leaves the crowns
// of the trees in the strip's alpha at 240..254, a number of their own. This draws a chunk of the strip with a shader
// that moves each crown a few pixels from side to side in its own time, the whole crown together, and puts the
// alpha back to opaque. Nothing else moves. It is cheap (a draw call a chunk) and steps out if the game runs slowly.
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uOn;
uniform vec2 uRes;
varying vec2 outTexCoord;

bool isCrown(float a) { return a > 0.937 && a < 0.998; }

// how far this crown is carried just now, in whole pixels of the art
float carried(float a) {
  float k = floor(a * 255.0 + 0.5) - 240.0;
  float phase = k * 0.419;
  float gust = 0.62 + 0.38 * sin(uTime * 0.23 + k * 0.7);
  return floor(2.6 * gust * sin(uTime * (1.05 + k * 0.022) + phase) + 0.5);
}

void main() {
  vec4 here = texture2D(uMainSampler, outTexCoord);
  if (uOn < 0.5) {
    if (isCrown(here.a)) here = vec4(here.rgb / here.a, 1.0);
    gl_FragColor = here;
    return;
  }
  vec4 col = here;
  bool found = false;
  float dx = 1.0 / uRes.x;
  // which crown pixel lands here: look to either side for one carried by just that much, the nearest first
  for (int i = 0; i < 7; i++) {
    if (found) break;
    float o = (i == 0) ? 0.0 : (mod(float(i), 2.0) > 0.5 ? (float(i) + 1.0) * 0.5 : -float(i) * 0.5);
    vec4 s = (i == 0) ? here : texture2D(uMainSampler, outTexCoord + vec2(o * dx, 0.0));
    if (isCrown(s.a) && abs(carried(s.a) + o) < 0.5) {
      col = s;
      found = true;
    }
  }
  if (isCrown(col.a)) col = vec4(col.rgb / col.a, 1.0);
  gl_FragColor = col;
}
`;

const SLOW_FPS = 28;
const SLOW_FOR = 4; // s

export class TreeSway {
  constructor(scene, stageId, meta, depth, viewWidth) {
    this.time = 0;
    this.on = !new URLSearchParams(location.search).has('nosway');
    this.slow = 0;
    this.loop = scene.game.loop;
    this.chunks = [];
    const res = [meta.width * meta.artScale, meta.chunkHeight * meta.artScale];
    for (let i = 0; i < meta.chunks; i++) {
      const c = scene.add.shader(
        {
          name: `treeSway${stageId}${i}`,
          fragmentSource: FRAGMENT,
          setupUniforms: (set) => {
            set('uMainSampler', 0);
            set('uTime', this.time);
            set('uOn', this.on ? 1 : 0);
            set('uRes', res);
          },
        },
        0,
        0,
        viewWidth,
        meta.chunkHeight,
        [`mid_${stageId}_${i}`],
      );
      this.chunks.push(c.setOrigin(0, 0).setDepth(depth).setVisible(false));
    }
  }

  update(dt) {
    this.time += dt;
    // (a slow phone keeps the game and loses the swaying)
    if (this.on) {
      this.slow = this.loop.actualFps < SLOW_FPS ? this.slow + dt : 0;
      if (this.slow > SLOW_FOR) this.on = false;
    }
  }
}
