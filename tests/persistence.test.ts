// 저장·복구와 음원 연결 조건 검사.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { readAudioManifest } from '../src/audio/manifest.ts'
import {
  SAVE_KEY,
  SETTINGS_KEY,
  clearSave,
  defaultSettings,
  fromSave,
  hasProgress,
  loadSave,
  loadSettings,
  toSave,
  writeSave,
  writeSettings,
} from '../src/game/persistence.ts'
import type { StorageLike } from '../src/game/persistence.ts'
import { gameReducer, initialState } from '../src/game/reducer.ts'
import type { GameAction } from '../src/game/reducer.ts'
import type { GameState } from '../src/game/types.ts'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
  }
}

function apply(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

const planning = apply(
  initialState,
  { type: 'START_NEW' },
  { type: 'BEGIN_PLANNING' },
  { type: 'PREVIEW_OPTION', requirementId: 'M1-library', optionId: 'L1' },
  { type: 'SELECT_OPTION', requirementId: 'M1-library', optionId: 'L1' },
  { type: 'SELECT_OPTION', requirementId: 'M1-school', optionId: 'S1' },
  { type: 'PLACE_JOB', jobId: 'M1-school', start: 2 },
)

test('계획 중인 임무를 저장했다가 그대로 이어한다', () => {
  const storage = memoryStorage()
  assert.ok(writeSave(storage, planning))
  const loaded = loadSave(storage)
  assert.ok(loaded?.run)
  assert.equal(loaded.run.phase, 'planning')
  assert.deepEqual(loaded.run.plan, planning.run?.plan)
  assert.deepEqual(loaded.run.previewed, { 'M1-library': ['L1'] })
  assert.ok(hasProgress(loaded))
})

test('확정 뒤에 저장하면 같은 계획의 실행 처음부터 이어한다', () => {
  const confirmed = apply(planning, { type: 'PLACE_JOB', jobId: 'M1-library', start: 4 }, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_ADVANCE' }, { type: 'EXEC_ADVANCE' })
  const loaded = fromSave(JSON.parse(JSON.stringify(toSave(confirmed))))
  assert.equal(loaded?.run?.phase, 'executing')
  assert.equal(loaded?.run?.stepIndex, 0)
  assert.deepEqual(loaded?.run?.timeline, confirmed.run?.timeline)
  assert.deepEqual(loaded?.run?.usageConfirmed, [])
})

test('결과까지 마친 임무는 결과만 남고, 다음 임무가 열린다', () => {
  const done = apply(
    planning,
    { type: 'PLACE_JOB', jobId: 'M1-library', start: 4 },
    { type: 'CONFIRM_PLAN' },
    { type: 'EXEC_SKIP' },
    { type: 'CONFIRM_USAGE', requirementId: 'M1-library' },
    { type: 'CONFIRM_USAGE', requirementId: 'M1-school' },
    { type: 'FINISH_MISSION' },
  )
  const loaded = fromSave(JSON.parse(JSON.stringify(toSave(done))))
  assert.equal(loaded?.run, null)
  assert.equal(loaded?.results.M1?.cost, 70)
  const resumed = gameReducer(loaded as GameState, { type: 'RESUME' })
  assert.equal(resumed.screen, 'chapter')
  assert.equal(resumed.run?.missionId, 'M2')
})

test('손상되었거나 다른 버전인 저장 데이터는 버리고 새로 시작할 수 있다', () => {
  assert.equal(loadSave(memoryStorage({ [SAVE_KEY]: '{잘린 데이터' })), null)
  assert.equal(loadSave(memoryStorage({ [SAVE_KEY]: 'null' })), null)
  assert.equal(loadSave(memoryStorage({ [SAVE_KEY]: JSON.stringify({ version: 0, results: {}, current: null }) })), null)
  assert.equal(loadSave(memoryStorage({ [SAVE_KEY]: JSON.stringify([1, 2, 3]) })), null)
  assert.equal(loadSave(null), null)
})

test('저장 데이터의 모르는 값은 걸러 낸다', () => {
  const loaded = fromSave({
    version: 1,
    results: { M2: { missionId: 'M2', selections: {}, score: { total: 100 }, cost: 1 } },
    current: {
      missionId: 'M1',
      stage: 'confirmed',
      plan: { selections: { 'M1-library': 'G1', 'M1-school': 'S1' }, starts: { 'M1-school': 99, 'M1-library': 'x' } },
      previewed: { 'M1-library': ['L1', 5] },
      compareOpened: { 'M1-school': 'yes' },
    },
  })
  assert.ok(loaded?.run)
  assert.deepEqual(loaded.results, {}, '앞 임무 결과가 없는 뒤 임무 결과는 받지 않는다')
  assert.equal(loaded.run.phase, 'planning', '유효하지 않은 계획은 실행으로 복구하지 않는다')
  assert.deepEqual(loaded.run.plan.selections, { 'M1-library': null, 'M1-school': 'S1' })
  assert.deepEqual(loaded.run.plan.starts, { 'M1-library': null, 'M1-school': null })
  assert.deepEqual(loaded.run.previewed, { 'M1-library': ['L1'] })
  assert.deepEqual(loaded.run.compareOpened, {})
  // 잠긴 임무를 진행 중이라고 적힌 저장도 받지 않는다
  assert.equal(fromSave({ version: 1, results: {}, current: { missionId: 'M3', stage: 'planning', plan: {} } })?.run, null)
})

test('저장이 막힌 환경에서도 예외 없이 진행된다', () => {
  const blocked: StorageLike = {
    getItem: () => {
      throw new Error('blocked')
    },
    setItem: () => {
      throw new Error('quota')
    },
    removeItem: () => {
      throw new Error('blocked')
    },
  }
  assert.equal(writeSave(blocked, planning), false)
  assert.equal(loadSave(blocked), null)
  assert.doesNotThrow(() => clearSave(blocked))
  assert.deepEqual(loadSettings(blocked), defaultSettings)
  assert.doesNotThrow(() => writeSettings(blocked, defaultSettings))
})

test('새 게임으로 진행을 지워도 소리·동작 설정은 남는다', () => {
  const storage = memoryStorage()
  writeSettings(storage, { ...defaultSettings, muted: true, music: 0.2, reducedMotion: true })
  writeSave(storage, planning)
  clearSave(storage)
  assert.equal(storage.data[SAVE_KEY], undefined)
  assert.ok(storage.data[SETTINGS_KEY])
  assert.deepEqual(loadSettings(storage), { ...defaultSettings, muted: true, music: 0.2, reducedMotion: true })
  // 범위를 벗어난 음량은 0~1로 맞춘다
  storage.setItem(SETTINGS_KEY, JSON.stringify({ music: 7, sfx: -1, ambience: 'loud' }))
  assert.deepEqual(loadSettings(storage), { ...defaultSettings, music: 1, sfx: 0 })
})

test('현재 오디오 매니페스트에서는 어떤 음원도 불러오지 않는다', () => {
  const manifest = JSON.parse(readFileSync(new URL('../public/assets/audio/manifest.json', import.meta.url), 'utf8'))
  const status = readAudioManifest(manifest)
  assert.equal(status.total, 27)
  assert.equal(status.loadable.length, 0)
  assert.equal(status.missing.length, 27)
})

test('음원은 파일 존재·검청 완료·불러오기 허용이 모두 맞을 때만 연결된다', () => {
  const asset = { id: 'ui.select', type: 'sfx', runtime_url: '/assets/audio/sfx/sfx_01_ui_select.ogg', loop: false, status: 'verified', exists: true }
  const policy = { allow_audio_fetch_for_current_manifest: true, required_status_before_future_load: 'verified' }
  assert.equal(readAudioManifest({ runtime_policy: policy, assets: [asset] }).loadable.length, 1)
  assert.equal(readAudioManifest({ runtime_policy: policy, assets: [{ ...asset, exists: false }] }).loadable.length, 0)
  assert.equal(readAudioManifest({ runtime_policy: policy, assets: [{ ...asset, status: 'generated' }] }).loadable.length, 0)
  assert.equal(readAudioManifest({ runtime_policy: { ...policy, allow_audio_fetch_for_current_manifest: false }, assets: [asset] }).loadable.length, 0)
  assert.equal(readAudioManifest({ runtime_policy: policy, assets: [{ ...asset, runtime_url: 'https://example.com/a.ogg' }] }).loadable.length, 0)
  assert.deepEqual(readAudioManifest('깨진 값'), { total: 0, loadable: [], missing: [] })
})
