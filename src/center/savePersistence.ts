import type { GameState } from './simulation'
import { migrateSave, validateSave } from './simulation.ts'

export const SAVE_KEY = 'ppscon2.center.v1'
type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>

export class SaveBackupError extends Error {
  constructor() { super('이전 저장을 안전하게 백업하지 못해 자동 저장을 보류했어요. 기존 저장은 유지됩니다.'); this.name = 'SaveBackupError' }
}

/** Preserve every distinct source verbatim; never overwrite an earlier backup. */
function backupRaw(storage: SaveStorage, raw: string, base: string): string {
  try {
    let hash = 2166136261
    for (let index = 0; index < raw.length; index++) hash = Math.imul(hash ^ raw.charCodeAt(index), 16777619)
    let key = base, attempt = 0
    while (true) {
      const previous = storage.getItem(key)
      if (previous === raw) return key
      if (previous === null) {
        storage.setItem(key, raw)
        if (storage.getItem(key) !== raw) throw new Error('Backup verification failed')
        return key
      }
      key = `${base}.${(hash >>> 0).toString(16)}${attempt ? '.' + attempt : ''}`
      attempt++
    }
  } catch { throw new SaveBackupError() }
}

export function backupExclusiveSave(storage: SaveStorage, raw: string): string {
  return backupRaw(storage, raw, SAVE_KEY + '.backup.exclusive-v1')
}

/** User-requested replacement, including valid saves, always keeps a verified backup. */
export function replaceGameSave(storage: SaveStorage, game: GameState): void {
  if (!validateSave(game)) throw new Error('불러올 게임 기록을 확인할 수 없어요.')
  const previous = storage.getItem(SAVE_KEY)
  if (previous !== null) backupRaw(storage, previous, SAVE_KEY + '.backup.manual')
  storage.setItem(SAVE_KEY, JSON.stringify(game))
  if (storage.getItem(SAVE_KEY) !== JSON.stringify(game)) throw new Error('저장을 확인하지 못했어요. 기존 백업은 보존됩니다.')
}

export function parseSaveFile(raw: string): GameState {
  if (raw.length > 5_000_000) throw new Error('저장 파일이 너무 커요. 5MB 이하의 게임 저장 파일을 선택하세요.')
  let source: unknown
  try { source = JSON.parse(raw) } catch { throw new Error('올바른 JSON 저장 파일이 아니에요.') }
  if (source && typeof source === 'object' && 'game' in source) source = (source as {game:unknown}).game
  const game = migrateSave(source)
  if (!game) throw new Error('이 게임의 저장 파일이 아니거나 손상된 기록이에요.')
  return game
}

/** A failed backup aborts this write, leaving the original primary save intact. */
export function persistGameSave(storage: SaveStorage, game: GameState): void {
  const previous = storage.getItem(SAVE_KEY)
  if (previous !== null) {
    let source: unknown
    try { source = JSON.parse(previous) } catch { /* An unreadable source is backed up below. */ }
    if (!validateSave(source) && !migrateSave(source)) {
      // Even a current revision marker cannot make malformed game data safe to replace.
      backupRaw(storage, previous, SAVE_KEY + '.backup.invalid')
    } else {
      const parsed = source as { eventDeck?: unknown; campaignVersion?: unknown; version?: unknown; specialtyRulesVersion?: unknown; rivals?: unknown[]; player?: { evaluations?: unknown; evaluationStats?: unknown; annualBudget?: unknown; campusProjects?: { scopeVersion?: unknown }[] } }
      if (parsed.eventDeck === undefined) backupRaw(storage, previous, SAVE_KEY + '.backup.events-v2')
      if (parsed.campaignVersion !== 2) backupRaw(storage, previous, SAVE_KEY + '.backup.seven-years')
      if (parsed.specialtyRulesVersion !== 1) backupExclusiveSave(storage, previous)
      const oldEvaluation = parsed.version === 2 && (!Array.isArray(parsed.player?.evaluations) || !parsed.player?.evaluationStats || typeof parsed.player?.annualBudget !== 'number')
      const oldCampus = parsed.version === 2 && Array.isArray(parsed.player?.campusProjects) && parsed.player.campusProjects.some(project => project?.scopeVersion === undefined)
      if (parsed.version === 1 || oldEvaluation || oldCampus || (parsed.version === 2 && Array.isArray(parsed.rivals) && parsed.rivals.length === 10)) backupRaw(storage, previous, SAVE_KEY + '.backup')
    }
  }
  storage.setItem(SAVE_KEY, JSON.stringify(game))
}
