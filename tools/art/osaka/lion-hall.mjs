// Shishi-den: architectural mass, recessed stage and sculpted curls at game resolution.
export function drawLionHall(img, cx, bottom) {
  const top = bottom - 79;
  const green = [0x172d25, 0x31503d, 0x527451, 0x81956a, 0xb2b78a];
  // Broad tiled roof behind the sculpture, with raised eaves and ridge ornaments.
  img.rect(cx - 34, top + 13, 68, 50, 0x34332b);
  for (let y = 0; y < 17; y++) {
    const half = 19 + y;
    img.line(cx - half, top + y, cx + half, top + y, y % 4 === 0 ? 0x88928e : 0x3e4b50);
    for (let x = cx - half + 2; x < cx + half; x += 4) img.set(x, top + y, 0x667773);
  }
  img.line(cx - 38, top + 13, cx - 31, top + 17, 0xc2ad6a);
  img.line(cx + 38, top + 13, cx + 31, top + 17, 0xc2ad6a);
  img.line(cx - 19, top, cx + 19, top, 0xb4bcb0);
  // A broad, near-rectangular muzzle; curls break up the silhouette.
  img.ellipse(cx, top + 43, 39, 31, green[0]);
  img.ellipse(cx - 1, top + 41, 36, 29, green[2]);
  const curl = (x, y, r) => {
    img.disc(x + 1, y + 1, r, green[0]);
    img.disc(x, y, r, green[2]);
    img.disc(x - 1, y - 1, r - 1, green[3]);
    img.disc(x, y, r - 2, green[1]);
    img.disc(x + 1, y - 1, Math.max(1, r - 3), green[2]);
    img.set(x, y - r + 1, green[4]);
  };
  for (const side of [-1, 1]) {
    for (let i = 0; i < 5; i++) curl(cx + side * (29 + (i % 2) * 4), top + 27 + i * 9, 6);
    curl(cx + side * 21, top + 22, 8);
    curl(cx + side * 9, top + 19, 8);
  }
  curl(cx, top + 18, 7);
  // Recessed mouth, red door jambs and a dark rear wall behind the stage.
  img.rect(cx - 26, top + 46, 52, 26, 0x15191b);
  img.rect(cx - 27, top + 46, 5, 25, 0x873c29);
  img.rect(cx + 22, top + 46, 5, 25, 0x692a25);
  for (const x of [-22, -18, 18, 22]) img.line(cx + x, top + 49, cx + x, top + 67, 0xb15c3b);
  img.rect(cx - 17, top + 52, 34, 13, 0x322526);
  for (const x of [-15, 0, 15]) {
    img.rect(cx + x, top + 52, 1, 13, 0xaa7842);
    img.set(cx + x + 1, top + 55, 0xe2c576);
  }
  img.rect(cx - 24, top + 67, 48, 5, 0xaa8053);
  for (let x = -22; x <= 22; x += 4) img.line(cx + x, top + 67, cx + x - 1, top + 71, 0x715537);
  for (let i = 0; i < 3; i++) {
    img.rect(cx - 29 - i * 2, top + 72 + i * 2, 58 + i * 4, 2, i % 2 ? 0x595b54 : 0x929487);
    img.line(cx - 29 - i * 2, top + 72 + i * 2, cx + 28 + i * 2, top + 72 + i * 2, 0xb4b4a0);
  }
  // Eyelids shade the gold eyes; pronounced nose bridges the mouth.
  for (const side of [-1, 1]) {
    const x = cx + side * 15;
    img.ellipse(x, top + 34, 10, 6, green[0]);
    img.ellipse(x, top + 35, 8, 4, 0xc7a64d);
    img.ellipse(x - 1, top + 34, 6, 2, 0xf5d889);
    img.disc(x + side, top + 35, 2, 0x17201a);
    img.set(x + side - 1, top + 34, 0xfff6c7);
    img.line(x - 9, top + 31 - side, x + 8, top + 31 + side, green[4]);
    img.ellipse(cx + side * 7, top + 42, 8, 6, green[3]);
    img.ellipse(cx + side * 7, top + 44, 3, 2, green[0]);
    // Long ivory fangs, tapering into the stage opening.
    for (let y = 0; y < 10; y++) img.rect(cx + side * 21 - 2 + (side < 0 ? Math.floor(y / 5) : 0), top + 47 + y, Math.max(1, 4 - Math.floor(y / 3)), 1, y < 6 ? 0xf0e6c0 : 0xc5b58e);
    for (let y = 0; y < 6; y++) img.rect(cx + side * 21 - 1, top + 70 - y, Math.max(1, 3 - Math.floor(y / 2)), 1, 0xe8dfb8);
  }
  img.line(cx - 20, top + 47, cx + 20, top + 47, green[0]);
  for (let x = -16; x <= 16; x += 4) {
    img.rect(cx + x, top + 48, 3, 4, 0xe5dbb8);
    img.set(cx + x, top + 48, 0xfff1cb);
    img.rect(cx + x, top + 70, 3, 2, 0xe5dbb8);
  }
}
