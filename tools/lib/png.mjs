// Minimal RGBA PNG encoder (no dependencies).
import { deflateSync } from 'node:zlib';

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function filterRow(type, row, prev, bpp, out, offset) {
  out[offset] = type;
  const len = row.length;
  for (let i = 0; i < len; i++) {
    const x = row[i];
    const a = i >= bpp ? row[i - bpp] : 0;
    const b = prev ? prev[i] : 0;
    const c = prev && i >= bpp ? prev[i - bpp] : 0;
    const v =
      type === 0
        ? x
        : type === 1
          ? x - a
          : type === 2
            ? x - b
            : type === 3
              ? x - ((a + b) >> 1)
              : x - paeth(a, b, c);
    out[offset + 1 + i] = v & 0xff;
  }
}

function compressPixels(width, height, pixels, bpp, tryAllFilters = true) {
  const stride = width * bpp;
  const rows = Array.from({ length: height }, (_, y) => pixels.subarray(y * stride, (y + 1) * stride));
  const raw = Buffer.alloc((stride + 1) * height);

  // Adaptive per-row filtering (minimum sum of signed bytes)
  const cand = new Uint8Array(stride + 1);
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    const prev = y > 0 ? rows[y - 1] : null;
    let bestScore = Infinity;
    const off = y * (stride + 1);
    for (let t = 0; t < 5; t++) {
      filterRow(t, row, prev, bpp, cand, 0);
      let score = 0;
      for (let i = 1; i <= stride; i++) {
        const v = cand[i];
        score += v < 128 ? v : 256 - v;
      }
      if (score < bestScore) {
        bestScore = score;
        raw.set(cand, off);
      }
    }
  }
  let best = deflateSync(raw, { level: 9 });

  // Fixed filter modes often beat per-row heuristics on pixel-art with repeating patterns
  const modes = tryAllFilters ? [0, 1, 2, 4] : [0];
  for (const t of modes) {
    for (let y = 0; y < height; y++) filterRow(t, rows[y], y > 0 ? rows[y - 1] : null, bpp, raw, y * (stride + 1));
    const z = deflateSync(raw, { level: 9 });
    if (z.length < best.length) best = z;
  }
  return best;
}

function buildPNG(width, height, colorType, idat, extraChunks = []) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    ...extraChunks,
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Encode RGBA pixels (Uint8Array/Uint8ClampedArray, length w*h*4) as lossless PNG. */
export function encodePNG(width, height, rgba) {
  const n = width * height;
  let hasAlpha = false;
  const paletteMap = new Map();
  let paletteOk = true;

  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = rgba[o + 3];
    if (a < 255) hasAlpha = true;
    if (paletteOk) {
      // Canonicalize fully transparent pixels to (0,0,0,0)
      const key = a === 0 ? 0 : ((rgba[o] << 24) | (rgba[o + 1] << 16) | (rgba[o + 2] << 8) | a) >>> 0;
      if (!paletteMap.has(key)) {
        if (paletteMap.size >= 256) paletteOk = false;
        else paletteMap.set(key, 0);
      }
    }
  }

  let bestPng = null;

  // 1. Try indexed-color PNG (colorType 3) when <= 256 unique RGBA colors exist
  if (paletteOk && paletteMap.size > 0) {
    // Sort non-opaque colors first so tRNS chunk is minimal
    const keys = [...paletteMap.keys()].sort((k1, k2) => (k1 & 0xff) - (k2 & 0xff));
    const plte = Buffer.alloc(keys.length * 3);
    let trnsLen = 0;
    keys.forEach((k, idx) => {
      paletteMap.set(k, idx);
      plte[idx * 3] = (k >>> 24) & 0xff;
      plte[idx * 3 + 1] = (k >>> 16) & 0xff;
      plte[idx * 3 + 2] = (k >>> 8) & 0xff;
      if ((k & 0xff) < 255) trnsLen = idx + 1;
    });
    const extra = [chunk('PLTE', plte)];
    if (trnsLen > 0) {
      const trns = Buffer.alloc(trnsLen);
      for (let i = 0; i < trnsLen; i++) trns[i] = keys[i] & 0xff;
      extra.push(chunk('tRNS', trns));
    }
    const indices = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const a = rgba[o + 3];
      const key = a === 0 ? 0 : ((rgba[o] << 24) | (rgba[o + 1] << 16) | (rgba[o + 2] << 8) | a) >>> 0;
      indices[i] = paletteMap.get(key);
    }
    const idat = compressPixels(width, height, indices, 1, true);
    bestPng = buildPNG(width, height, 3, idat, extra);
  }

  // 2. Try truecolor RGB (colorType 2) if fully opaque, otherwise RGBA (colorType 6)
  if (!hasAlpha) {
    const rgb = new Uint8Array(n * 3);
    for (let i = 0; i < n; i++) {
      const si = i * 4;
      const di = i * 3;
      rgb[di] = rgba[si];
      rgb[di + 1] = rgba[si + 1];
      rgb[di + 2] = rgba[si + 2];
    }
    const idat = compressPixels(width, height, rgb, 3, !bestPng);
    const png = buildPNG(width, height, 2, idat);
    if (!bestPng || png.length < bestPng.length) bestPng = png;
  } else {
    const clean = new Uint8Array(n * 4);
    for (let i = 0; i < n; i++) {
      const o = i * 4;
      const a = rgba[o + 3];
      if (a > 0) {
        clean[o] = rgba[o];
        clean[o + 1] = rgba[o + 1];
        clean[o + 2] = rgba[o + 2];
        clean[o + 3] = a;
      }
    }
    const idat = compressPixels(width, height, clean, 4, !bestPng);
    const png = buildPNG(width, height, 6, idat);
    if (!bestPng || png.length < bestPng.length) bestPng = png;
  }

  return bestPng;
}
