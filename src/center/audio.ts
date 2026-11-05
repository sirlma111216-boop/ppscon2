// Original, lightweight synthesized sketch. Replace with mastered recordings later.
let context: AudioContext | null = null
let timer: ReturnType<typeof setInterval> | null = null
let enabled = false
let beat = 0
const melody = [72, 76, 79, 76, 74, 77, 81, 77, 71, 74, 79, 74, 72, 76, 79, 84]
function note(midi: number, at: number, length: number, gain: number, type: OscillatorType = 'sine') {
  if (!context) return
  const oscillator = context.createOscillator()
  const envelope = context.createGain()
  oscillator.type = type
  oscillator.frequency.value = 440 * 2 ** ((midi - 69) / 12)
  envelope.gain.setValueAtTime(0, at)
  envelope.gain.linearRampToValueAtTime(gain, at + .018)
  envelope.gain.exponentialRampToValueAtTime(.0001, at + length)
  oscillator.connect(envelope).connect(context.destination)
  oscillator.start(at)
  oscillator.stop(at + length + .02)
}
export function setMusic(value: boolean) {
  enabled = value
  if (timer) clearInterval(timer)
  timer = null
  if (!enabled) return
  context ??= new AudioContext()
  void context.resume()
  const tick = () => {
    if (!context || !enabled || document.hidden) return
    const at = context.currentTime
    note(melody[beat % melody.length]!, at, .6, .026, 'triangle')
    if (beat % 4 === 0) { note([48, 53, 55, 48][Math.floor(beat / 4) % 4]!, at, 1.4, .03); note(melody[beat % melody.length]! - 12, at + .04, .9, .016) }
    beat++
  }
  tick()
  timer = setInterval(tick, 410)
}
export function playSound(kind: 'select' | 'buy' | 'run' | 'result') {
  if (!enabled) return
  context ??= new AudioContext()
  void context.resume()
  const notes = kind === 'buy' ? [72, 76, 79] : kind === 'result' ? [67, 72, 76, 79] : kind === 'run' ? [72, 79] : [81]
  notes.forEach((n, i) => note(n, context!.currentTime + i * .08, .25, .04, 'sine'))
}
