import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buyEquipment, createGame, decideRental, finishRentalReview, getRentalAt, migrateSave, moveEquipment, nextSeason, previewSeason, runSeason, setProgram, validateSave } from '../../src/center/simulation.ts'

// Synthetic save produced by the actual v1 engine at commit 0a06ae7, after two
// seasons and a paid equipment move. No user/browser data is included.
const legacy = JSON.parse(readFileSync(new URL('./fixtures/v1-progress.json', import.meta.url), 'utf8'))

test('actual v1 progress migrates without losing money, activity history or a pending move', () => {
  const original = JSON.stringify(legacy)
  const state = migrateSave(legacy)
  assert.ok(state && validateSave(state))
  assert.equal(state.version, 2)
  assert.equal(state.year, legacy.year)
  assert.equal(state.season, legacy.season)
  assert.equal(state.player.cash, legacy.player.cash)
  assert.equal(state.player.reserved, legacy.player.reserved)
  assert.equal(state.player.inventory.length, legacy.player.inventory.length)
  assert.equal(state.history.length, legacy.history.length)
  assert.equal(state.player.rooms.length, 7)
  assert.equal(state.player.plan.A[0], legacy.player.plan.A[0])
  assert.equal(state.player.pendingTasks.length, legacy.player.pendingTasks.length)
  assert.equal(state.player.pendingTasks[0].room, 'B')
  assert.equal(state.player.inventory.find(e => e.id === 'E01')?.room, 'B')
  assert.equal(state.player.inventory.find(e => e.id === 'E01')?.ready, false)
  assert.deepEqual(migrateSave(state), state)
  assert.equal(JSON.stringify(legacy), original)
  const settled = runSeason(finishRentalReview(state))
  assert.ok(validateSave(settled))
  assert.equal(settled.player.inventory.find(e => e.id === 'E01')?.ready, true)
  assert.equal(settled.player.pendingTasks.length, 0)
})

test('approving and undoing an application does not pay income or reroll applications', () => {
  let state = createGame()
  const application = state.player.rentalRequests.find(r => r.program === 'P05')!
  assert.ok(application)
  const terms = state.player.rentalRequests.map(({status: _status, ...terms}) => terms)
  const cash = state.player.cash
  const approved = decideRental(state, application.id, 'accepted')
  assert.equal(approved.error, undefined)
  state = approved.state
  assert.equal(state.player.cash, cash)
  assert.equal(getRentalAt(state.player, application.room, application.slot)?.id, application.id)
  assert.equal(decideRental(state, application.id, 'accepted').state.player.cash, cash)
  state = decideRental(state, application.id, 'pending').state
  assert.equal(state.player.cash, cash)
  assert.equal(getRentalAt(state.player, application.room, application.slot), undefined)
  assert.equal(state.player.plan[application.room][application.slot], null)
  state = buyEquipment(state, 'E01', 'E').state
  assert.deepEqual(state.player.rentalRequests.map(({status: _status, ...terms}) => terms), terms)
  const loaded = migrateSave(JSON.parse(JSON.stringify(state)))!
  assert.deepEqual(loaded.player.rentalRequests, state.player.rentalRequests)
  previewSeason(loaded)
  assert.deepEqual(loaded.player.rentalRequests, state.player.rentalRequests)
})

test('approved rental blocks class placement until explicitly canceled', () => {
  let state = createGame()
  const request = state.player.rentalRequests.find(r => r.program === 'P05')!
  state = decideRental(state, request.id, 'accepted').state
  state = finishRentalReview(state)
  const before = JSON.stringify(state)
  const attempted = setProgram(state, request.room, request.slot, 'P06')
  assert.equal(JSON.stringify(attempted), before)
  assert.equal(getRentalAt(attempted.player, request.room, request.slot)?.id, request.id)
})

test('same catalogue item in separate rooms is installed and moved independently', () => {
  let state = createGame()
  for (const room of ['A', 'E'] as const) {
    const purchase = buyEquipment(state, 'E01', room)
    assert.equal(purchase.error, undefined)
    state = purchase.state
  }
  assert.ok(buyEquipment(state, 'E01B', 'A').error)
  const instances = state.player.inventory.filter(e => e.id === 'E01')
  assert.equal(new Set(instances.map(e => e.instanceId)).size, 2)
  state = nextSeason(runSeason(finishRentalReview(state)))
  assert.ok(state.player.inventory.filter(e => e.id === 'E01').every(e => e.ready))
  const first = state.player.inventory.find(e => e.id === 'E01' && e.room === 'A')!
  const second = state.player.inventory.find(e => e.id === 'E01' && e.room === 'E')!
  const untouched = structuredClone(second)
  const moved = moveEquipment(state, first.instanceId, 'F')
  assert.equal(moved.error, undefined)
  assert.equal(moved.state.player.inventory.find(e => e.instanceId === first.instanceId)?.room, 'F')
  assert.equal(moved.state.player.inventory.find(e => e.instanceId === first.instanceId)?.ready, false)
  assert.deepEqual(moved.state.player.inventory.find(e => e.instanceId === second.instanceId), untouched)
  assert.equal(moved.state.player.cash, state.player.cash - 8)
})
