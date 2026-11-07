import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame,buyEquipment,finishRentalReview,runSeason,nextSeason,setProgram,setPriceMode,setGuideMode,getDemand,validateSave} from '../../src/center/simulation.ts'
import type {GameState,RoomId} from '../../src/center/simulation.ts'

function prepared(gear:[string,RoomId][]):GameState {
  let state=createGame(20261107)
  for(const [id,room] of gear){const result=buyEquipment(state,id,room);assert.equal(result.error,undefined);state=result.state}
  return finishRentalReview(nextSeason(runSeason(finishRentalReview(state))))
}
test('discount opens an actual budget audience, while premium pricing can lose price-sensitive demand',()=>{
  let state=prepared([['E01','E']])
  state=setProgram(state,'E',3,'P01')
  const standard=runSeason(state).lastReport!
  const discount=runSeason(setPriceMode(state,'discount')).lastReport!
  assert.ok(discount.visits>standard.visits)
  const groups=getDemand(state)
  assert.ok(groups.some(group=>group.programs.includes('P01')&&group.maxFee>=1&&group.maxFee<1.15))
})
test('dance can earn a class operating surplus when compatible groups share a weekend session',()=>{
  let state=prepared([['E02','B'],['E04','B']])
  state=setProgram(state,'B',3,'P09')
  const report=runSeason(state).lastReport!
  assert.ok(report.classRevenue>report.classCost,JSON.stringify({revenue:report.classRevenue,cost:report.classCost}))
})
test('retired fast-processing mode retains the same resident guidance benefit in legacy saves',()=>{
  let state=prepared([['E01','E'],['E10','A']])
  state=setProgram(state,'E',1,'P01')
  const fast=runSeason(setGuideMode(state,'fast')).lastReport!
  const welcome=runSeason(setGuideMode(state,'welcome')).lastReport!
  assert.equal(welcome.experienceScore,fast.experienceScore)
  assert.equal(welcome.reputationChange,fast.reputationChange)
})
test('noise lowers both experience and reputation after all service effects are applied',()=>{
  let quiet=prepared([['E01','A'],['E02','B'],['E04','B'],['E09','A']])
  quiet=setProgram(setProgram(quiet,'A',3,'P02'),'B',3,'P09')
  const noisy=structuredClone(quiet)
  noisy.player.inventory=noisy.player.inventory.filter(item=>item.id!=='E09')
  noisy.player.rooms.find(room=>room.id==='A')!.equipment=noisy.player.rooms.find(room=>room.id==='A')!.equipment.filter(id=>id!=='E09')
  assert.ok(validateSave(noisy))
  const a=runSeason(quiet).lastReport!,b=runSeason(noisy).lastReport!
  assert.ok(a.experienceScore>b.experienceScore)
  assert.ok(a.reputationChange>b.reputationChange)
})
test('visible operating activity is the final week, including an empty final week',()=>{
  let state=prepared([['E01','E']])
  state=setProgram(state,'E',1,'P01')
  const report=runSeason(state).lastReport!
  assert.equal(report.activity.reduce((sum,item)=>sum+item.attendees,0),report.weekly[12].visits)
  const idle=runSeason(finishRentalReview(createGame())).lastReport!
  assert.deepEqual(idle.activity,[])
})
