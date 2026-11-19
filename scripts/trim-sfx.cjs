// Makes trimmed copies of effect sounds that start with silence. The delivered files are never modified.
// Usage: node scripts/trim-sfx.cjs [--force]
//   reads  public/center/audio/sfx_*.wav          (as delivered)
//   writes public/center/audio-trimmed/sfx_*.wav  (only for files whose sound starts 60 ms or later)
// A copy starts 15 ms before the sound, with a 3 ms fade-in so the cut cannot click, and ends 80 ms after
// the sound has died away, with a 12 ms fade-out. Prints one JSON line per file for the provenance record.
const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const input = 'public/center/audio', output = 'public/center/audio-trimmed', force = process.argv.includes('--force')
const LEAD_THRESHOLD_MS = 60, PRE_ROLL_MS = 15, TAIL_MS = 80, FADE_IN_MS = 3, FADE_OUT_MS = 12

fs.mkdirSync(output, { recursive: true })
for (const name of fs.readdirSync(input).filter(file => /^sfx_.*\.wav$/.test(file)).sort()) {
  const source = fs.readFileSync(path.join(input, name))
  if (source.toString('ascii', 0, 4) !== 'RIFF' || source.toString('ascii', 8, 12) !== 'WAVE') throw new Error(name + ': not a WAV file')
  let pos = 12, fmt = null, data = null
  while (pos + 8 <= source.length) {
    const id = source.toString('ascii', pos, pos + 4), size = source.readUInt32LE(pos + 4)
    if (id === 'fmt ') fmt = { tag: source.readUInt16LE(pos + 8), channels: source.readUInt16LE(pos + 10), rate: source.readUInt32LE(pos + 12), bits: source.readUInt16LE(pos + 22) }
    if (id === 'data') { data = { start: pos + 8, size: Math.min(size, source.length - pos - 8) }; break }
    pos += 8 + size + (size % 2)
  }
  if (!fmt || !data || fmt.tag !== 1 || fmt.bits !== 16) throw new Error(name + ': expected 16-bit PCM')
  const frame = fmt.channels * 2, frames = Math.floor(data.size / frame), window = Math.round(fmt.rate / 100)
  const envelope = []
  for (let w = 0; w * window < frames; w++) {
    let sum = 0, count = 0
    for (let i = w * window; i < Math.min(frames, (w + 1) * window); i++) for (let c = 0; c < fmt.channels; c++) { const v = source.readInt16LE(data.start + i * frame + c * 2) / 32768; sum += v * v; count++ }
    envelope.push(Math.sqrt(sum / Math.max(1, count)))
  }
  const loudest = Math.max(...envelope), level = value => 20 * Math.log10(Math.max(value, 1e-7) / loudest)
  // The sound proper: the first clearly loud moment (-12 dB), walked back to where that continuous sound begins (-30 dB).
  // This ignores a faint stray blip separated from the sound by silence, as in install_complete and season_open.
  let begin = envelope.findIndex(value => level(value) >= -12)
  while (begin > 0 && level(envelope[begin - 1]) >= -30) begin--
  const onsetMs = begin * 10
  if (onsetMs < LEAD_THRESHOLD_MS) { console.log(JSON.stringify({ name, action: 'kept', onsetMs })); continue }
  let lastWindow = envelope.length - 1
  while (lastWindow > 0 && level(envelope[lastWindow]) < -45) lastWindow--
  const first = Math.max(0, Math.round((onsetMs - PRE_ROLL_MS) / 1000 * fmt.rate))
  const last = Math.min(frames, Math.round(((lastWindow + 1) * 10 + TAIL_MS) / 1000 * fmt.rate))
  const length = last - first, pcm = Buffer.from(source.subarray(data.start + first * frame, data.start + last * frame))
  const fadeIn = Math.round(FADE_IN_MS / 1000 * fmt.rate), fadeOut = Math.round(FADE_OUT_MS / 1000 * fmt.rate)
  const scale = (index, gain) => { for (let c = 0; c < fmt.channels; c++) { const at = index * frame + c * 2; pcm.writeInt16LE(Math.round(pcm.readInt16LE(at) * gain), at) } }
  for (let i = 0; i < Math.min(fadeIn, length); i++) scale(i, i / fadeIn)
  for (let i = 0; i < Math.min(fadeOut, length); i++) scale(length - 1 - i, i / fadeOut)
  const header = Buffer.alloc(44)
  header.write('RIFF', 0, 'ascii'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVE', 8, 'ascii'); header.write('fmt ', 12, 'ascii')
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(fmt.channels, 22); header.writeUInt32LE(fmt.rate, 24)
  header.writeUInt32LE(fmt.rate * frame, 28); header.writeUInt16LE(frame, 32); header.writeUInt16LE(16, 34); header.write('data', 36, 'ascii'); header.writeUInt32LE(pcm.length, 40)
  const target = path.join(output, name)
  if (fs.existsSync(target) && !force) throw new Error(target + ' exists; pass --force to rebuild')
  fs.writeFileSync(target, Buffer.concat([header, pcm]))
  console.log(JSON.stringify({ name, action: 'trimmed', sourceSha256: createHash('sha256').update(source).digest('hex'), sourceMs: Math.round(frames / fmt.rate * 1000), cutFromMs: Math.round(first / fmt.rate * 1000), cutToMs: Math.round(last / fmt.rate * 1000), lengthMs: Math.round(length / fmt.rate * 1000), sourceBytes: source.length, bytes: 44 + pcm.length }))
}
