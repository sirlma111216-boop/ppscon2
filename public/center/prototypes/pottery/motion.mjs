// A single immutable illustration. Compact deformation fields are confined to
// people: windows, shelves, tables, bowls and camera never change between frames.
export const WIDTH = 600;
export const HEIGHT = 400;
export const LOOP_MS = 4800;
export const EXPORT_FRAMES = 120;
// x, y, radiusX, radiusY, x amplitude, y amplitude, phase, cycles.
// Supports are deliberately inside clothing/skin rather than across silhouettes.
const JOINTS = [
  [87, 319, 33, 15, 2.8, -.65, 0, 2],
  [178, 318, 17, 20, -1.9, .8, .2, 2],
  [111, 281, 41, 37, .3, .65, .3, 1],
  [122, 201, 23, 25, .3, .55, .4, 1],
  [213, 230, 30, 12, 1.6, -.55, 1.1, 2],
  [277, 236, 15, 13, -1.2, .5, 1.25, 2],
  [250, 200, 23, 20, .25, .45, 1.1, 1],
  [254, 165, 17, 20, -.25, .4, 1.1, 1],
  [324, 182, 14, 18, 1.8, -1.4, 2.2, 1],
  [350, 185, 18, 16, -1.25, 1.3, 2.4, 1],
  [378, 236, 22, 47, .35, .7, 2, 1],
  [375, 119, 21, 23, .4, .5, 2, 1],
  [427, 323, 36, 17, 2.25, -.9, 3.4, 2],
  [552, 320, 29, 17, -2.1, .8, 3.5, 2],
  [483, 278, 37, 32, .3, .8, 3.3, 1],
  [491, 194, 25, 25, -.35, .6, 3.3, 1],
];

export function createMotion(source) {
  if (source.length !== WIDTH * HEIGHT * 4) throw new Error('Expected a 600 × 400 RGBA plate');
  const pixels = [];
  const movingMask = new Uint8Array(WIDTH * HEIGHT);
  for (let y = 0; y < HEIGHT; y++) for (let x = 0; x < WIDTH; x++) {
    const weights = [];
    JOINTS.forEach(([cx, cy, rx, ry], j) => {
      const distance = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (distance < 1) weights.push([j, (1 - distance) ** 3]);
    });
    if (weights.length) {
      pixels.push({ x, y, i: (y * WIDTH + x) * 4, weights });
      movingMask[y * WIDTH + x] = 1;
    }
  }
  function render(milliseconds, target = new Uint8ClampedArray(source)) {
    target.set(source);
    const phase = ((milliseconds % LOOP_MS) + LOOP_MS) % LOOP_MS / LOOP_MS * Math.PI * 2;
    const shifts = JOINTS.map(([, , , , dx, dy, offset, cycles]) => {
      const wave = Math.sin(phase * cycles + offset);
      return [dx * wave, dy * wave];
    });
    for (const { x, y, i, weights } of pixels) {
      let dx = 0, dy = 0;
      for (const [j, weight] of weights) { dx += shifts[j][0] * weight; dy += shifts[j][1] * weight; }
      const sx = x - dx, sy = y - dy;
      const x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      const a = (y0 * WIDTH + x0) * 4, b = a + WIDTH * 4;
      for (let c = 0; c < 3; c++) target[i + c] =
        (source[a + c] * (1 - fx) + source[a + 4 + c] * fx) * (1 - fy) +
        (source[b + c] * (1 - fx) + source[b + 4 + c] * fx) * fy;
    }
    return target;
  }
  return { render, movingMask, movingPixels: pixels.length };
}
