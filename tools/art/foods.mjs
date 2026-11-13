import { FOODS } from '../../src/data/discoveries.js';
import { downsample } from './icon.mjs';
import { food540 } from './foods540.mjs';

/**
 * The local dishes for the old 20 px atlas: the 540 px drawings (foods540.mjs) area-filtered down, so both
 * atlases show the same dish; the in-flight gold halo marks them as pickups.
 */
export function foodSprites() {
  return FOODS.map(({ id, frame }) => ({ name: frame, raster: downsample(food540(id), 20) }));
}

/** The same dishes at 540 px, for sprites540 (shown at a third: the pickup in flight and the journal's pages). */
export function foodSprites540() {
  return FOODS.map(({ id, frame }) => ({ name: frame, raster: food540(id) }));
}
