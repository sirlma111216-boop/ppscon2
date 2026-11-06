import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { createMotion, WIDTH, HEIGHT, LOOP_MS, EXPORT_FRAMES } from '../public/center/prototypes/pottery/motion.mjs';

const directory = path.resolve('public/center/prototypes/pottery');
const source = await sharp(path.join(directory, 'poster.webp')).ensureAlpha().raw().toBuffer();
const motion = createMotion(source), frames = [];
let maxOutsideDifference = 0, maxStepDifference = 0;
const frameDelta = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i += 4) if (motion.movingMask[i / 4]) for (let c = 0; c < 3; c++) sum += Math.abs(a[i + c] - b[i + c]);
  return sum / (motion.movingPixels * 3);
};
for (let f = 0; f < EXPORT_FRAMES; f++) {
  const frame = Buffer.from(motion.render(f * LOOP_MS / EXPORT_FRAMES));
  for (let i = 0; i < source.length; i += 4) if (!motion.movingMask[i / 4]) {
    for (let c = 0; c < 4; c++) maxOutsideDifference = Math.max(maxOutsideDifference, Math.abs(frame[i + c] - source[i + c]));
  }
  if (frames.length) maxStepDifference = Math.max(maxStepDifference, frameDelta(frames.at(-1), frame));
  frames.push(frame);
}
assert.equal(maxOutsideDifference, 0, 'Pixels outside people must stay byte-identical');
assert.deepEqual(motion.render(0), motion.render(LOOP_MS), 'Loop endpoint must be identical');
const wrapStepDifference = frameDelta(frames.at(-1), frames[0]);
assert.ok(wrapStepDifference <= maxStepDifference * 1.1, 'Loop boundary must not jump');
// Lossless animated WebP keeps unchanged background pixels identical after decoding.
const output = path.join(directory, 'pottery-fixed.webp');
await sharp(Buffer.concat(frames), { raw: { width: WIDTH, height: HEIGHT * EXPORT_FRAMES, channels: 4, pageHeight: HEIGHT } })
  .webp({ lossless: true, loop: 0, delay: LOOP_MS / EXPORT_FRAMES, effort: 6, minSize: true }).toFile(output);
const decoded = await sharp(output, { animated: true }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const metadata = await sharp(output, { animated: true }).metadata();
assert.equal(metadata.pages, EXPORT_FRAMES);
assert.equal(metadata.loop, 0);
for (let f = 0; f < EXPORT_FRAMES; f++) {
  const frame = decoded.data.subarray(f * source.length, (f + 1) * source.length);
  assert.deepEqual(frame, frames[f], `Lossless frame ${f}`);
}
const report = { width: WIDTH, height: HEIGHT, frames: EXPORT_FRAMES, fps: 1000 * EXPORT_FRAMES / LOOP_MS, durationMs: LOOP_MS,
  movingPixels: motion.movingPixels, fixedPixels: WIDTH * HEIGHT - motion.movingPixels, maxOutsideDifference,
  maxStepDifference, wrapStepDifference, loopEndpointIdentical: true, decodedFramesExact: true, bytes: (await fs.stat(output)).size };
await fs.writeFile(path.join(directory, 'motion-validation.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
