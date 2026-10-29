// Preview helpers: composite the mid strip over the tiled far layer (dev only).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Raster } from '../lib/raster.mjs';

export function composite(mid, far, dir, id) {
  const { strip } = mid;
  const full = new Raster(strip.w, strip.h);
  for (let y = 0; y < strip.h; y++)
    for (let x = 0; x < strip.w; x++) {
      const i = ((y % far.h) * far.w + x) * 4;
      full.setRGBA(x, y, far.data[i], far.data[i + 1], far.data[i + 2], 255);
    }
  full.blit(strip, 0, 0);
  // overview: 7 columns of 1024px (top of the stage on the left)
  const cols = Math.ceil(strip.h / 1024);
  const sheet = new Raster(cols * (strip.w + 6), 1024);
  for (let c = 0; c < cols; c++) sheet.blit(full.crop(0, c * 1024, strip.w, 1024), c * (strip.w + 6), 0);
  writeFileSync(join(dir, `${id}_mid_overview.png`), sheet.toPNG());
  // 2x detail crops of each 512 chunk, bottom (stage start) first
  for (let i = 0; i < mid.chunks.length; i++) {
    const y = strip.h - (i + 1) * 512;
    writeFileSync(join(dir, `${id}_mid_detail_${String(i).padStart(2, '0')}.png`), full.crop(0, y, strip.w, 512).scaled(2).toPNG());
  }
}
