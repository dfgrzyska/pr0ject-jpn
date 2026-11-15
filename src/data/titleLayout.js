// Integer pixel positions shared by the live title and the art preview.
export function titleLayout(H) {
  const start = Math.round(H * 0.49);
  const gap = 32 + Math.round((H - 320) * 0.08);
  return { artY: start - 158, logoY: start - 90, taglineY: start - 70, start,
    buttons: [start, start + gap, start + gap * 2, start + gap * 3], captionY: H - 40, hintY: H - 12 };
}
