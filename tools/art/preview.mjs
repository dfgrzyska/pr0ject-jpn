// Preview helpers: composite the mid strip over the tiled far layer (dev only).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Raster } from '../lib/raster.mjs';

export function composite(mid, far, dir, id) {
  const { strip } = mid;
  const s = mid.meta.artScale ?? 1;
  const full = new Raster(strip.w, strip.h);
  for (let y = 0; y < strip.h; y++)
    for (let x = 0; x < strip.w; x++) {
      const i = ((y % far.h) * far.w + x) * 4;
      full.setRGBA(x, y, far.data[i], far.data[i + 1], far.data[i + 2], 255);
    }
  full.blit(strip, 0, 0);
  // overview: 7 columns of 1024 logical px (top of the stage on the left)
  const colH = 1024 * s;
  const gap = 6 * s;
  const cols = Math.ceil(strip.h / colH);
  const sheet = new Raster(cols * (strip.w + gap), colH);
  for (let c = 0; c < cols; c++) sheet.blit(full.crop(0, c * colH, strip.w, colH), c * (strip.w + gap), 0);
  writeFileSync(join(dir, `${id}_mid_overview.png`), sheet.toPNG());
  // detail crops of each 512 logical chunk, bottom (stage start) first
  const detH = 512 * s;
  for (let i = 0; i < Math.ceil(strip.h / detH); i++) {
    const y = strip.h - (i + 1) * detH;
    const crop = full.crop(0, y, strip.w, detH);
    writeFileSync(join(dir, `${id}_mid_detail_${String(i).padStart(2, '0')}.png`), (s > 1 ? crop : crop.scaled(2)).toPNG());
  }
}
