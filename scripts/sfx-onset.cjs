// Perceived onset of each WAV effect from a 10 ms RMS envelope. Read-only. Usage: node sfx-onset.cjs <audio dir>
const fs = require('fs')
const path = require('path')
const dir = process.argv[2]
const out = []
for (const name of fs.readdirSync(dir).filter(f => f.endsWith('.wav')).sort()) {
  const b = fs.readFileSync(path.join(dir, name))
  let pos = 12, rate = 48000, channels = 2, bytes = 2, start = 44, size = b.length - 44
  while (pos + 8 <= b.length) {
    const id = b.toString('ascii', pos, pos + 4), len = b.readUInt32LE(pos + 4)
    if (id === 'fmt ') { channels = b.readUInt16LE(pos + 10); rate = b.readUInt32LE(pos + 12); bytes = b.readUInt16LE(pos + 22) / 8 }
    if (id === 'data') { start = pos + 8; size = Math.min(len, b.length - pos - 8); break }
    pos += 8 + len + (len % 2)
  }
  const frame = bytes * channels, frames = Math.floor(size / frame), win = Math.round(rate / 100)
  const env = []
  for (let w = 0; w * win < frames; w++) {
    let sum = 0, n = 0
    for (let i = w * win; i < Math.min(frames, (w + 1) * win); i++) for (let c = 0; c < channels; c++) { const v = b.readInt16LE(start + i * frame + c * bytes) / 32768; sum += v * v; n++ }
    env.push(Math.sqrt(sum / Math.max(1, n)))
  }
  const max = Math.max(...env), db = v => 20 * Math.log10(Math.max(v, 1e-6) / max)
  const firstAt = level => { const i = env.findIndex(v => db(v) >= level); return i < 0 ? null : i * 10 }
  const peakAt = env.indexOf(max) * 10
  // Sketch: one character per 100 ms, 0-9 = loudness relative to the file's loudest moment (9 = within 3 dB, 0 = more than 27 dB below).
  const sketch = []
  for (let i = 0; i < env.length; i += 10) { const top = Math.max(...env.slice(i, i + 10)); sketch.push(String(Math.max(0, Math.min(9, 9 + Math.floor(db(top) / 3))))) }
  out.push({ name: name.replace(/^sfx_|\.wav$/g, ''), lengthMs: env.length * 10, onset20: firstAt(-20), onset10: firstAt(-10), peakAt, sketch: sketch.join('') })
}
const pad = (v, n) => String(v ?? '-').padEnd(n)
console.log(pad('effect', 20), pad('length', 8), pad('-20dB at', 10), pad('-10dB at', 10), pad('loudest', 9), 'loudness per 100 ms (9 = loudest, 0 = silent)')
for (const r of out) console.log(pad(r.name, 20), pad(r.lengthMs, 8), pad(r.onset20, 10), pad(r.onset10, 10), pad(r.peakAt, 9), r.sketch)
