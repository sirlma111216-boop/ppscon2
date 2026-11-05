// 이 기기의 localStorage에만 저장한다. 서버·계정·클라우드 저장은 없다.
// 진행 저장과 소리·동작 설정은 서로 다른 키를 써서, 새 게임이 설정을 지우지 않는다.
import { buildTimeline, isPlanValid } from './engine.ts'
import { MISSION_ORDER, getMission } from './missions.ts'
import { emptyPlan, initialState, newRun } from './reducer.ts'
import type { GameState, MissionId, MissionResult, MissionRun, Plan } from './types.ts'

export const SAVE_VERSION = 1
export const SAVE_KEY = 'ppscon.save'
export const SETTINGS_KEY = 'ppscon.settings'

export type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export type SaveData = {
  version: number
  results: Partial<Record<MissionId, MissionResult>>
  /** 진행 중인 임무. 계획 단계 또는 확정 직후 상태만 저장한다. */
  current: {
    missionId: MissionId
    stage: 'briefing' | 'planning' | 'confirmed'
    plan: Plan
    previewed: Record<string, string[]>
    compareOpened: Record<string, boolean>
  } | null
}

export type Settings = {
  muted: boolean
  music: number
  sfx: number
  ambience: number
  /** null이면 기기의 '동작 줄이기' 설정을 따른다 */
  reducedMotion: boolean | null
}

export const defaultSettings: Settings = { muted: false, music: 0.6, sfx: 0.8, ambience: 0.5, reducedMotion: null }

export function toSave(state: GameState): SaveData {
  const run = state.run
  let current: SaveData['current'] = null
  if (run && run.phase !== 'result') {
    current = {
      missionId: run.missionId,
      // 실행·관찰·이용 확인 도중이면 '확정 직후'로 저장해, 이어할 때 같은 계획의 실행부터 다시 본다.
      stage: run.phase === 'briefing' ? 'briefing' : run.phase === 'planning' ? 'planning' : 'confirmed',
      plan: run.plan,
      previewed: run.previewed,
      compareOpened: run.compareOpened,
    }
  }
  return { version: SAVE_VERSION, results: state.results, current }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isMissionId(value: unknown): value is MissionId {
  return typeof value === 'string' && (MISSION_ORDER as string[]).includes(value)
}

function sanitizePlan(missionId: MissionId, value: unknown): Plan {
  const plan = emptyPlan(missionId)
  if (!isRecord(value)) return plan
  const mission = getMission(missionId)
  const selections = isRecord(value.selections) ? value.selections : {}
  const starts = isRecord(value.starts) ? value.starts : {}
  for (const key of Object.keys(plan.selections)) {
    const optionId = selections[key]
    if (typeof optionId === 'string' && mission.options[optionId]?.requirementId === key) plan.selections[key] = optionId
  }
  for (const key of Object.keys(plan.starts)) {
    const start = starts[key]
    if (typeof start === 'number' && Number.isInteger(start) && start >= 1 && start <= 6) plan.starts[key] = start
  }
  return plan
}

function sanitizeSeen(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {}
  const seen: Record<string, string[]> = {}
  for (const [key, list] of Object.entries(value)) {
    if (Array.isArray(list)) seen[key] = list.filter((item): item is string => typeof item === 'string')
  }
  return seen
}

function sanitizeFlags(value: unknown): Record<string, boolean> {
  if (!isRecord(value)) return {}
  const flags: Record<string, boolean> = {}
  for (const [key, flag] of Object.entries(value)) if (flag === true) flags[key] = true
  return flags
}

function sanitizeResults(value: unknown): Partial<Record<MissionId, MissionResult>> {
  const results: Partial<Record<MissionId, MissionResult>> = {}
  if (!isRecord(value)) return results
  // 앞 임무부터 이어진 결과만 받아들인다.
  for (const id of MISSION_ORDER) {
    const item = value[id]
    if (!isRecord(item) || item.missionId !== id || !isRecord(item.selections) || !isRecord(item.score)) break
    if (typeof item.cost !== 'number' || typeof item.score.total !== 'number') break
    const mission = getMission(id)
    const known = mission.requirements.every((requirement) => {
      const optionId = (item.selections as Record<string, unknown>)[requirement.id]
      return typeof optionId === 'string' && mission.options[optionId]?.requirementId === requirement.id
    })
    if (!known) break
    results[id] = item as unknown as MissionResult
  }
  return results
}

/** 저장 데이터를 게임 상태로 되돌린다. 해석할 수 없으면 null. */
export function fromSave(value: unknown): GameState | null {
  if (!isRecord(value) || value.version !== SAVE_VERSION) return null
  const results = sanitizeResults(value.results)
  const state: GameState = { ...initialState, results }
  const current = value.current
  if (isRecord(current) && isMissionId(current.missionId)) {
    const missionId = current.missionId
    const unlocked = MISSION_ORDER.slice(0, MISSION_ORDER.indexOf(missionId)).every((id) => Boolean(results[id]))
    if (unlocked) {
      const plan = sanitizePlan(missionId, current.plan)
      const base: MissionRun = {
        ...newRun(missionId, current.stage === 'briefing' ? 'briefing' : 'planning'),
        plan,
        previewed: sanitizeSeen(current.previewed),
        compareOpened: sanitizeFlags(current.compareOpened),
      }
      const mission = getMission(missionId)
      state.run =
        current.stage === 'confirmed' && isPlanValid(mission, plan)
          ? { ...base, phase: 'executing', timeline: buildTimeline(mission, plan) }
          : base
    }
  }
  return state
}

export function hasProgress(state: GameState | null): boolean {
  return Boolean(state && (state.run || Object.keys(state.results).length > 0))
}

export function loadSave(storage: StorageLike | null): GameState | null {
  if (!storage) return null
  try {
    const raw = storage.getItem(SAVE_KEY)
    if (!raw) return null
    return fromSave(JSON.parse(raw))
  } catch {
    return null
  }
}

/** 저장에 성공하면 true. 저장이 막힌 환경에서도 게임은 계속된다. */
export function writeSave(storage: StorageLike | null, state: GameState): boolean {
  if (!storage) return false
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(toSave(state)))
    return true
  } catch {
    return false
  }
}

export function clearSave(storage: StorageLike | null): void {
  try {
    storage?.removeItem(SAVE_KEY)
  } catch {
    // 저장소를 쓸 수 없는 환경
  }
}

function clamp01(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : fallback
}

export function loadSettings(storage: StorageLike | null): Settings {
  if (!storage) return defaultSettings
  try {
    const value: unknown = JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null')
    if (!isRecord(value)) return defaultSettings
    return {
      muted: value.muted === true,
      music: clamp01(value.music, defaultSettings.music),
      sfx: clamp01(value.sfx, defaultSettings.sfx),
      ambience: clamp01(value.ambience, defaultSettings.ambience),
      reducedMotion: typeof value.reducedMotion === 'boolean' ? value.reducedMotion : null,
    }
  } catch {
    return defaultSettings
  }
}

export function writeSettings(storage: StorageLike | null, settings: Settings): void {
  try {
    storage?.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    // 저장소를 쓸 수 없는 환경
  }
}

export function getBrowserStorage(): StorageLike | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
