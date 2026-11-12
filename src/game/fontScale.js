// The size the bitmap font is shown at: 1 for the 1x font, a third for the 540 px one (Boot picks, pixelText uses).
let scale = 1;

export function setFontScale(k) {
  scale = k;
}

export function fontScale() {
  return scale;
}
