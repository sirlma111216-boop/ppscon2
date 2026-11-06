import test from 'node:test'
import assert from 'node:assert/strict'
import { backupExclusiveSave, persistGameSave, SAVE_KEY, SaveBackupError } from '../../src/center/savePersistence.ts'
import { createGame } from '../../src/center/simulation.ts'

function memoryStorage() {
  const values = new Map<string, string>()
  return { values, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
}

test('migration preserves the exact source before replacing the primary save', () => {
  const storage = memoryStorage(), game = createGame(), raw = JSON.stringify({ ...game, specialtyRulesVersion: undefined }, null, 2)
  storage.setItem(SAVE_KEY, raw)
  persistGameSave(storage, game)
  assert.equal(storage.getItem(SAVE_KEY + '.backup.exclusive-v1'), raw)
  assert.equal(storage.getItem(SAVE_KEY), JSON.stringify(game))
})

test('distinct backups never replace an existing source and identical retries are reused', () => {
  const storage = memoryStorage(), base = backupExclusiveSave(storage, 'first source')
  const second = backupExclusiveSave(storage, 'second source')
  assert.notEqual(base, second)
  assert.equal(backupExclusiveSave(storage, 'second source'), second)
  assert.equal(storage.getItem(base), 'first source')
  assert.equal(storage.values.size, 2)
})

test('backup quota failure leaves the original primary save untouched', () => {
  const storage = memoryStorage(), raw = JSON.stringify({ ...createGame(), specialtyRulesVersion: undefined })
  storage.setItem(SAVE_KEY, raw)
  const failing = { getItem: storage.getItem, setItem(key: string, value: string) { if (key.includes('.backup')) throw new Error('QuotaExceededError'); storage.setItem(key, value) } }
  assert.throws(() => persistGameSave(failing, createGame()), SaveBackupError)
  assert.equal(storage.getItem(SAVE_KEY), raw)
})

test('a silent backup write failure is detected before replacing the primary save', () => {
  const storage = memoryStorage(), raw = JSON.stringify({ ...createGame(), specialtyRulesVersion: undefined })
  storage.setItem(SAVE_KEY, raw)
  const failing = { getItem: storage.getItem, setItem(key: string, value: string) { if (!key.includes('.backup')) storage.setItem(key, value) } }
  assert.throws(() => persistGameSave(failing, createGame()), SaveBackupError)
  assert.equal(storage.getItem(SAVE_KEY), raw)
})

test('current-rule saves do not create migration backups on ordinary actions', () => {
  const storage = memoryStorage(), game = createGame()
  storage.setItem(SAVE_KEY, JSON.stringify(game))
  persistGameSave(storage, { ...game, migrationNotices: undefined })
  assert.equal(storage.values.size, 1)
})

test('invalid current-rule saves retain their exact source despite a current revision marker', () => {
  const storage = memoryStorage(), game = createGame()
  const raw = JSON.stringify({ ...game, player: { ...game.player, cash: null } }, null, 2)
  storage.setItem(SAVE_KEY, raw)
  persistGameSave(storage, createGame())
  assert.equal(storage.getItem(SAVE_KEY + '.backup.invalid'), raw)
  assert.equal(storage.getItem(SAVE_KEY), JSON.stringify(createGame()))
})

test('malformed JSON, JSON primitives and empty stored text are backed up verbatim', () => {
  for (const raw of [' {"version":2,\n "unfinished":', 'null', '42', '']) {
    const storage = memoryStorage()
    storage.setItem(SAVE_KEY, raw)
    persistGameSave(storage, createGame())
    assert.equal(storage.getItem(SAVE_KEY + '.backup.invalid'), raw)
  }
})

test('failed invalid-save backups preserve current-version corruption and malformed JSON', () => {
  const game = createGame()
  for (const raw of [JSON.stringify({ ...game, player: { ...game.player, cash: null } }), '{invalid JSON', '']) {
    const storage = memoryStorage()
    storage.setItem(SAVE_KEY, raw)
    const failing = { getItem: storage.getItem, setItem(key: string, value: string) { if (key.includes('.backup')) throw new Error('QuotaExceededError'); storage.setItem(key, value) } }
    assert.throws(() => persistGameSave(failing, createGame()), SaveBackupError)
    assert.equal(storage.getItem(SAVE_KEY), raw)
  }
})
