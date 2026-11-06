import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createGame, finishRentalReview, migrateSave, nextSeason, runSeason, validateSave} from '../../src/center/simulation.ts'
import type {GameState} from '../../src/center/simulation.ts'
import {awardCampusContract, collectCampusBids, getCampusProject, postCampusTender} from '../../src/center/campusProjects.ts'
import {awardFacilityContract, collectFacilityBids, getFacilityProject, postFacilityTender} from '../../src/center/facilityProjects.ts'

const legacy=JSON.parse(readFileSync(new URL('./fixtures/v1-progress.json',import.meta.url),'utf8'))
function formerV2(state:GameState):GameState {
  const old=structuredClone(state)
  // Reconstruct the retired record without relying on the current createGame list.
  const onnuri=structuredClone(old.rivals[0])
  onnuri.id='onnuri';onnuri.name='온누리센터';onnuri.archetype='공간 활용'
  old.rivals.splice(1,0,onnuri)
  return old
}
function pendingFacility(state:GameState):GameState {
  state=postFacilityTender(state,'C').state
  state=collectFacilityBids(state,'C').state
  const result=awardFacilityContract(state,'C',getFacilityProject(state.player,'C')!.bids[2].id)
  assert.equal(result.error,undefined)
  return result.state
}

test('a new game includes our center and nine distinct rivals, with new ranks capped at ten',()=>{
  let state=createGame()
  assert.equal(state.rivals.length,9)
  assert.equal(new Set([state.player.id,...state.rivals.map(r=>r.id)]).size,10)
  assert.ok(state.rivals.every(r=>r.id!=='onnuri'))
  assert.ok(validateSave(state))
  assert.deepEqual(migrateSave(state),state)
  for(let season=0;season<4;season++){
    state=runSeason(finishRentalReview(state))
    assert.equal(state.lastReport!.rank,10,'an idle center ranks last among ten centers')
    assert.equal(state.lastReport!.participants,10)
    assert.ok(state.rivals.every(r=>r.history.length===season+1))
    state=nextSeason(state)
    assert.ok(validateSave(state))
  }
})

test('ten-rival v2 migration removes only Onnuri and preserves all active assets, projects and historical ranks',()=>{
  let expected=migrateSave(legacy)!
  expected.player.cash=5000
  expected=pendingFacility(expected)
  expected=collectCampusBids(postCampusTender(expected,'garden').state,'garden').state
  const contracted=awardCampusContract(expected,'garden',getCampusProject(expected.player,'garden')!.bids[0].id)
  assert.equal(contracted.error,undefined)
  expected=contracted.state
  const old=formerV2(expected)
  for(const report of [...old.history,old.lastReport!])delete report.participants
  const before=JSON.stringify(old)
  assert.equal(old.rivals.length,10)
  assert.equal(validateSave(old),false)
  const restored=migrateSave(old)
  assert.ok(restored&&validateSave(restored))
  assert.deepEqual(restored,expected,'only the retired competitor record may be removed')
  assert.equal(restored.lastReport!.rank,11)
  assert.equal(restored.lastReport!.participants,11)
  assert.ok(restored.history.some(report=>report.rank===11))
  assert.equal(restored.player.pendingTasks.length,legacy.player.pendingTasks.length)
  assert.equal(restored.player.facilityProjects[0].stage,'construction')
  assert.equal(restored.player.campusProjects[0].stage,'construction')
  assert.equal(JSON.stringify(old),before)
  assert.deepEqual(migrateSave(restored),restored)
})

test('competitor reduction composes with the earlier v2 campus-array migration',()=>{
  let expected=migrateSave(legacy)!
  expected.player.cash=2000
  expected=pendingFacility(expected)
  const old=formerV2(expected)
  for(const inst of [old.player,...old.rivals])delete (inst as unknown as {campusProjects?:unknown}).campusProjects
  const before=JSON.stringify(old),restored=migrateSave(old)
  assert.ok(restored&&validateSave(restored))
  assert.deepEqual(restored,expected)
  assert.equal(JSON.stringify(old),before)
  const operated=runSeason(finishRentalReview(restored))
  assert.ok(validateSave(operated))
  assert.ok(operated.lastReport!.rank<=10)
  assert.equal(operated.history[1].rank,11,'historical standings are never recomputed')
})

test('the actual ten-rival v1 fixture retains every remaining competitor and player progression',()=>{
  const before=JSON.stringify(legacy),state=migrateSave(legacy)
  assert.equal(legacy.rivals.length,10)
  assert.ok(state&&validateSave(state))
  assert.deepEqual(state.rivals.map(r=>r.id),legacy.rivals.filter((r:{id:string})=>r.id!=='onnuri').map((r:{id:string})=>r.id))
  assert.equal(state.player.cash,legacy.player.cash)
  assert.equal(state.player.reserved,legacy.player.reserved)
  for(const rival of state.rivals){
    const original=legacy.rivals.find((r:{id:string})=>r.id===rival.id)
    assert.equal(rival.cash,original.cash)
    assert.equal(rival.reserved,original.reserved)
    assert.deepEqual(rival.history,original.history)
    assert.deepEqual(rival.xp,original.xp)
    assert.equal(rival.inventory.length,original.inventory.length)
  }
  assert.equal(state.lastReport!.rank,legacy.lastReport.rank)
  assert.equal(state.lastReport!.participants,11)
  assert.deepEqual(state.history.map(r=>r.rank),legacy.history.map((r:{rank:number})=>r.rank))
  assert.equal(JSON.stringify(legacy),before)
})

test('migration never drops an arbitrary extra center or silently replaces missing competitors',()=>{
  const unknown=formerV2(createGame())
  unknown.rivals.find(r=>r.id==='onnuri')!.id='unknown-extra'
  assert.equal(migrateSave(unknown),null)
  const duplicate=formerV2(createGame())
  duplicate.rivals[0].id='onnuri'
  assert.equal(migrateSave(duplicate),null)
  const missing=createGame();missing.rivals.pop()
  assert.equal(validateSave(missing),false)
  assert.equal(migrateSave(missing),null)
  const duplicateCurrent=createGame();duplicateCurrent.rivals[0].id=duplicateCurrent.rivals[1].id
  assert.equal(validateSave(duplicateCurrent),false)
  assert.equal(migrateSave(duplicateCurrent),null)
})

test('historical participant metadata keeps old ranks meaningful and rejects impossible standings',()=>{
  const state=migrateSave(legacy)!
  delete state.lastReport!.participants
  for(const report of state.history)delete report.participants
  const restored=migrateSave(state)
  assert.ok(restored)
  assert.equal(restored.lastReport!.rank,11)
  assert.equal(restored.lastReport!.participants,11)
  const corrupt=structuredClone(restored)
  corrupt.lastReport!.participants=10
  assert.equal(validateSave(corrupt),false)
  assert.equal(migrateSave(corrupt),null)
  const overlarge=structuredClone(restored)
  overlarge.history[0].participants=12
  assert.equal(validateSave(overlarge),false)
})
