import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

// Cut generated transparent outer margins, preserve baked lettering and proportions.
const [source, name, explicitCrop] = process.argv.slice(2);
if (!source || !/^(room-[A-G]|campus|return)$/.test(name ?? '')) throw new Error('Usage: node scripts/prepare-image-button.mjs source.png room-B');
const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let left = info.width, top = info.height, right = -1, bottom = -1, largest = 0;
// Generated alpha may contain isolated specks outside the plate. Crop to the
// largest connected component rather than allowing a speck to create padding.
const visited = new Uint8Array(info.width * info.height);
const queue = new Int32Array(visited.length);
for (let start = 0; start < visited.length; start++) {
  if (visited[start] || data[start * 4 + 3] <= 16) continue;
  let head = 0, tail = 1, l = info.width, t = info.height, r = -1, b = -1;
  queue[0] = start; visited[start] = 1;
  while (head < tail) {
    const pixel = queue[head++], x = pixel % info.width, y = Math.floor(pixel / info.width);
    l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
    const adjacent = [x > 0 ? pixel - 1 : -1, x + 1 < info.width ? pixel + 1 : -1,
      y > 0 ? pixel - info.width : -1, y + 1 < info.height ? pixel + info.width : -1];
    for (const next of adjacent) if (next >= 0 && !visited[next] && data[next * 4 + 3] > 16) { visited[next] = 1; queue[tail++] = next; }
  }
  if (tail > largest) { largest = tail; left = l; top = t; right = r; bottom = b; }
}
if (right < left) throw new Error('Empty artwork');
if (explicitCrop) {
  const bounds = explicitCrop.split(',').map(Number);
  if (bounds.length !== 4 || bounds.some(n => !Number.isInteger(n) || n < 0)) throw new Error('Crop must be left,top,width,height');
  left = bounds[0]; top = bounds[1]; right = left + bounds[2] - 1; bottom = top + bounds[3] - 1;
  if (right >= info.width || bottom >= info.height) throw new Error('Crop outside artwork');
}
const outputDir = path.resolve('public/center/interface-v3');
const archiveDir = path.resolve('.preview/art-originals/interface-v3');
await fs.mkdir(outputDir, { recursive: true });
await fs.mkdir(archiveDir, { recursive: true });
await fs.copyFile(source, path.join(archiveDir, name + '.png'));
const target = path.join(outputDir, name + '.webp');
await sharp(source).extract({ left, top, width: right - left + 1, height: bottom - top + 1 })
  .resize({ height: 144 }).webp({ quality: 94, alphaQuality: 100, effort: 6 }).toFile(target);
const { data: rgba, info: result } = await sharp(target).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const edgeAlpha = [[], [], [], []];
for (let x = 0; x < result.width; x++) {
  edgeAlpha[0].push(rgba[x * 4 + 3]); edgeAlpha[1].push(rgba[((result.height - 1) * result.width + x) * 4 + 3]);
}
for (let y = 0; y < result.height; y++) {
  edgeAlpha[2].push(rgba[y * result.width * 4 + 3]); edgeAlpha[3].push(rgba[(y * result.width + result.width - 1) * 4 + 3]);
}
if (edgeAlpha.some(edge => Math.max(...edge) <= 16)) throw new Error('Transparent outside margin remains');
console.log(JSON.stringify({ name, source, target, width: result.width, height: result.height, crop: { left, top, right, bottom }, bytes: (await fs.stat(target)).size }));
