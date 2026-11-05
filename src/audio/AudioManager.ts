// 음원이 하나도 없어도 게임이 그대로 진행되는 재생 관리자.
// - 사용자 입력 뒤에만 시작한다(start).
// - 매니페스트에서 '파일 있음 + 검청 완료 + 불러오기 허용'인 항목만 불러온다. 그 밖의 경로에는 요청을 보내지 않는다.
// - 음악·효과음·환경음 음량 분리, 전환 페이드, 효과음 중복 제한, 숨은 탭 일시정지.
// - 실시간 생성 API나 키를 쓰지 않는다. 정적 파일만 재생한다.
import { readAudioManifest } from './manifest.ts'
import type { AudioStatus, LoadableAudio } from './manifest.ts'

export type MusicId = 'music.intro' | 'music.plan' | 'music.execute' | 'music.result' | 'music.ending'
export type AmbienceId = 'ambience.library' | 'ambience.school' | 'ambience.community' | 'ambience.park'
export type SfxId =
  | 'ui.select'
  | 'ui.cancel'
  | 'card.open'
  | 'card.close'
  | 'need.reveal'
  | 'requirement.pin'
  | 'compare.open'
  | 'offer.place'
  | 'selection.confirm'
  | 'box.open'
  | 'furniture.deploy'
  | 'inspection.pass'
  | 'inspection.recheck'
  | 'user.feedback'
  | 'pilot.improve'
  | 'facility.activate'
  | 'mission.complete'
  | 'session.reset'

export type Volumes = { muted: boolean; music: number; sfx: number; ambience: number }

// 매니페스트 trigger에 적힌 중복 제한(ms). 없는 항목은 기본값을 쓴다.
const MIN_INTERVAL: Partial<Record<SfxId, number>> = {
  'ui.select': 80,
  'ui.cancel': 100,
  'card.open': 200,
  'requirement.pin': 100,
  'offer.place': 150,
  'inspection.recheck': 600,
}
const DEFAULT_INTERVAL = 120
const FADE_MS = 700
const TICK_MS = 50
const MAX_SFX_VOICES = 6

type Track = { id: string; element: HTMLAudioElement; level: number; target: number }

class LoopChannel {
  private current: Track | null = null
  private fading: Track[] = []
  private volume = 1

  setVolume(volume: number): void {
    this.volume = volume
    this.apply()
  }

  get currentId(): string | null {
    return this.current?.id ?? null
  }

  change(asset: LoadableAudio | null): void {
    if (this.current && asset && this.current.id === asset.id) return
    if (this.current) {
      this.current.target = 0
      this.fading.push(this.current)
      this.current = null
    }
    if (!asset) return
    const element = new Audio(asset.url)
    element.loop = asset.loop
    element.preload = 'auto'
    element.volume = 0
    this.current = { id: asset.id, element, level: 0, target: 1 }
    element.play().catch(() => {
      // 자동 재생이 막혔거나 파일을 읽지 못함: 소리 없이 진행
    })
  }

  /** 페이드를 한 틱 진행한다. 움직이는 트랙이 남아 있으면 true. */
  tick(): boolean {
    const step = TICK_MS / FADE_MS
    let moving = false
    for (const track of this.current ? [this.current, ...this.fading] : this.fading) {
      if (track.level === track.target) continue
      track.level = track.target > track.level ? Math.min(track.target, track.level + step) : Math.max(track.target, track.level - step)
      moving = true
    }
    this.fading = this.fading.filter((track) => {
      if (track.level > 0) return true
      track.element.pause()
      track.element.removeAttribute('src')
      return false
    })
    this.apply()
    return moving
  }

  setPaused(paused: boolean): void {
    if (!this.current) return
    if (paused) this.current.element.pause()
    else this.current.element.play().catch(() => {})
  }

  private apply(): void {
    for (const track of this.current ? [this.current, ...this.fading] : this.fading) {
      track.element.volume = Math.min(1, Math.max(0, track.level * this.volume))
    }
  }
}

export class AudioManager {
  private started = false
  private starting: Promise<void> | null = null
  private status: AudioStatus = { total: 0, loadable: [], missing: [] }
  private assets = new Map<string, LoadableAudio>()
  private volumes: Volumes = { muted: false, music: 0.6, sfx: 0.8, ambience: 0.5 }
  private music = new LoopChannel()
  private ambience = new LoopChannel()
  private wantedMusic: MusicId | null = null
  private wantedAmbience: AmbienceId | null = null
  private lastPlayed = new Map<string, number>()
  private voices: HTMLAudioElement[] = []
  private timer: number | null = null
  private listeners = new Set<() => void>()

  /** 첫 사용자 입력에서 한 번 부른다. 실패해도 예외를 던지지 않는다. */
  start(): Promise<void> {
    if (this.starting) return this.starting
    this.starting = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}assets/audio/manifest.json`)
        if (response.ok) this.status = readAudioManifest(await response.json())
      } catch {
        // 매니페스트를 읽지 못함: 무음으로 진행
      }
      this.assets = new Map(this.status.loadable.map((asset) => [asset.id, asset]))
      this.started = true
      document.addEventListener('visibilitychange', this.onVisibility)
      this.applyVolumes()
      this.music.change(this.find(this.wantedMusic))
      this.ambience.change(this.find(this.wantedAmbience))
      this.ensureTicking()
      this.notify()
    })()
    return this.starting
  }

  /** 설정 화면에 보여 줄 연결 상태 */
  getStatus(): { started: boolean; total: number; connected: number; missing: string[] } {
    return { started: this.started, total: this.status.total, connected: this.status.loadable.length, missing: this.status.missing }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  setVolumes(volumes: Volumes): void {
    this.volumes = volumes
    this.applyVolumes()
  }

  setMusic(id: MusicId | null): void {
    this.wantedMusic = id
    if (!this.started) return
    this.music.change(this.find(id))
    this.ensureTicking()
  }

  setAmbience(id: AmbienceId | null): void {
    this.wantedAmbience = id
    if (!this.started) return
    this.ambience.change(this.find(id))
    this.ensureTicking()
  }

  playSfx(id: SfxId): void {
    if (!this.started || this.volumes.muted || document.hidden) return
    const asset = this.assets.get(id)
    if (!asset) return
    const now = performance.now()
    const last = this.lastPlayed.get(id)
    if (last !== undefined && now - last < (MIN_INTERVAL[id] ?? DEFAULT_INTERVAL)) return
    this.lastPlayed.set(id, now)
    this.voices = this.voices.filter((voice) => !voice.ended && !voice.paused)
    if (this.voices.length >= MAX_SFX_VOICES) return
    const voice = new Audio(asset.url)
    voice.volume = this.volumes.sfx
    this.voices.push(voice)
    voice.play().catch(() => {})
  }

  private find(id: string | null): LoadableAudio | null {
    return id ? this.assets.get(id) ?? null : null
  }

  private applyVolumes(): void {
    const { muted, music, ambience, sfx } = this.volumes
    this.music.setVolume(muted ? 0 : music)
    this.ambience.setVolume(muted ? 0 : ambience)
    for (const voice of this.voices) voice.volume = muted ? 0 : sfx
  }

  private ensureTicking(): void {
    if (this.timer !== null) return
    this.timer = window.setInterval(() => {
      const moving = [this.music.tick(), this.ambience.tick()].some(Boolean)
      if (!moving && this.timer !== null) {
        window.clearInterval(this.timer)
        this.timer = null
      }
    }, TICK_MS)
  }

  private onVisibility = (): void => {
    const hidden = document.hidden
    this.music.setPaused(hidden)
    this.ambience.setPaused(hidden)
    if (hidden) for (const voice of this.voices) voice.pause()
  }

  private notify(): void {
    for (const listener of this.listeners) listener()
  }
}

export const audio = new AudioManager()
