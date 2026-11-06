import { useEffect, useRef, useState } from 'react'
import './PotteryActivity.css'

// Load the fixed-background motion only for an actually operating craft slot.
const POSTER = '/center/prototypes/pottery/poster.webp'

export default function PotteryActivity({ reducedMotion, paused = reducedMotion }: { reducedMotion: boolean; paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const controls = useRef<{ setPlaying: (value: boolean) => void } | null>(null)
  const pausedRef = useRef(paused)
  const [ready, setReady] = useState(false)
  useEffect(() => { pausedRef.current = paused; controls.current?.setPlaying(!paused) }, [paused])

  useEffect(() => {
    let disposed = false, frame = 0, elapsed = 0, previousTime: number | null = null
    let shouldPlay = !pausedRef.current
    let visibilityHandler: (() => void) | undefined
    setReady(false)
    async function initialize() {
      try {
        const module = await import('./potteryMotion')
        const image = new Image()
        image.src = POSTER
        await image.decode()
        if (disposed) return
        const canvas = canvasRef.current
        const context = canvas?.getContext('2d', { willReadFrequently: true })
        if (!canvas || !context) throw new Error('Canvas unavailable')
        canvas.width = module.WIDTH; canvas.height = module.HEIGHT
        context.drawImage(image, 0, 0, module.WIDTH, module.HEIGHT)
        const source = context.getImageData(0, 0, module.WIDTH, module.HEIGHT)
        const target = new ImageData(new Uint8ClampedArray(source.data), module.WIDTH, module.HEIGHT)
        const motion = module.createMotion(source.data)
        function draw() { motion.render(elapsed, target.data); context!.putImageData(target, 0, 0) }
        function tick(time: number) {
          if (disposed || !shouldPlay || document.hidden) return
          if (previousTime !== null) elapsed = (elapsed + Math.min(50, time - previousTime)) % module.LOOP_MS
          previousTime = time; draw(); frame = requestAnimationFrame(tick)
        }
        function synchronize() {
          cancelAnimationFrame(frame); previousTime = null
          if (shouldPlay && !document.hidden && !disposed) frame = requestAnimationFrame(tick)
        }
        controls.current = { setPlaying(value) { shouldPlay = value; synchronize() } }
        visibilityHandler = synchronize
        document.addEventListener('visibilitychange', synchronize)
        shouldPlay = !pausedRef.current
        draw(); setReady(true); synchronize()
      } catch {
        // The still poster remains visible if motion cannot initialize.
      }
    }
    void initialize()
    return () => {
      disposed = true; cancelAnimationFrame(frame); controls.current = null
      if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
    }
  }, [])

  return <div className="pottery-activity">
    <div className="pottery-activity__picture">
      <canvas ref={canvasRef} width={600} height={400} hidden={!ready} role="img" aria-label="고정된 도예 교실에서 여러 수강생과 강사가 고개와 상체, 팔을 움직이며 그릇을 빚는 장면" />
      {!ready && <img src={POSTER} width={600} height={400} alt="여러 수강생과 강사가 함께 그릇을 빚는 도예 수업" />}
    </div>
  </div>
}
