import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, finishRentalReview, nextSeason, previewSeason, runSeason, validateSave } from '../../src/center/simulation.ts'
import { awardFacilityContract, collectFacilityBids, facilityUpkeep, getFacilityProject, getFacilityRentMultiplier, postFacilityTender } from '../../src/center/facilityProjects.ts'

function tenders(){
  let state=createGame()
  state=postFacilityTender(state,'C').state
  state=collectFacilityBids(state,'C').state
  return state
}

test('facility procurement moves through announcement and comparison before a paid contract',()=>{
  const initial=createGame(),posted=postFacilityTender(initial,'C')
  assert.equal(posted.error,undefined)
  assert.equal(getFacilityProject(initial.player,'C'),undefined)
  assert.equal(posted.state.player.cash,initial.player.cash)
  assert.equal(getFacilityProject(posted.state.player,'C')?.stage,'announced')
  assert.ok(postFacilityTender(posted.state,'C').error)
  const compared=collectFacilityBids(posted.state,'C').state
  assert.equal(compared.player.cash,initial.player.cash)
  assert.deepEqual(collectFacilityBids(posted.state,'C').state,compared)
  assert.equal(getFacilityProject(compared.player,'C')?.bids.length,3)
  assert.ok(collectFacilityBids(compared,'C').error)
  const bid=getFacilityProject(compared.player,'C')!.bids[0]
  const contracted=awardFacilityContract(compared,'C',bid.id)
  assert.equal(contracted.error,undefined)
  assert.equal(contracted.state.player.cash,initial.player.cash-bid.price)
  assert.equal(contracted.state.player.reserved,initial.player.reserved+4*bid.upkeep)
  assert.equal(contracted.state.player.rooms.find(room=>room.id==='C')?.open,false)
  assert.ok(awardFacilityContract(contracted.state,'C',bid.id).error)
  assert.ok(validateSave(contracted.state))
})

test('contract rejection leaves the offer, money and room unchanged',()=>{
  const state=tenders(),bid=getFacilityProject(state.player,'C')!.bids[2]
  state.player.cash=state.player.reserved+bid.price-1
  const before=JSON.stringify(state)
  const result=awardFacilityContract(state,'C',bid.id)
  assert.ok(result.error)
  assert.equal(result.state,state)
  assert.equal(JSON.stringify(state),before)
  assert.ok(awardFacilityContract(state,'A',bid.id).error)
  assert.ok(awardFacilityContract(state,'C','not-a-bid').error)
})

test('construction advances through simulated weeks and completion quality affects rental value',()=>{
  const state=tenders(),project=getFacilityProject(state.player,'C')!
  let quick=awardFacilityContract(state,'C',project.bids[0].id).state
  let quality=awardFacilityContract(state,'C',project.bids[2].id).state
  quick=finishRentalReview(quick);quality=finishRentalReview(quality)
  const snapshot=JSON.stringify(quality)
  previewSeason(quality)
  assert.equal(JSON.stringify(quality),snapshot)
  quick=runSeason(quick);quality=runSeason(quality)
  assert.equal(quick.player.rooms.find(room=>room.id==='C')?.open,true)
  assert.equal(quality.player.rooms.find(room=>room.id==='C')?.open,false)
  assert.equal(getFacilityProject(quality.player,'C')?.remainingWeeks,18)
  assert.equal(quick.player.reserved,3*(quick.player.baseReserve+facilityUpkeep(quick.player)))
  quick=runSeason(finishRentalReview(nextSeason(quick)))
  quality=runSeason(finishRentalReview(nextSeason(quality)))
  assert.equal(quality.player.rooms.find(room=>room.id==='C')?.open,false)
  assert.equal(getFacilityProject(quality.player,'C')?.remainingWeeks,5)
  quality=runSeason(finishRentalReview(nextSeason(quality)))
  assert.equal(quality.player.rooms.find(room=>room.id==='C')?.open,true)
  assert.equal(getFacilityProject(quality.player,'C')?.stage,'complete')
  assert.ok(getFacilityRentMultiplier(quality.player,'C')>getFacilityRentMultiplier(quick.player,'C'))
  assert.ok(facilityUpkeep(quality.player)<facilityUpkeep(quick.player))
  assert.ok(validateSave(quick)&&validateSave(quality))
  const next=nextSeason(quality)
  assert.ok(next.player.rentalRequests.some(request=>request.room==='C'))
})

test('invalid construction and duplicate project records are rejected on load validation',()=>{
  const state=tenders(),bid=getFacilityProject(state.player,'C')!.bids[0]
  const working=awardFacilityContract(state,'C',bid.id).state
  const damaged=structuredClone(working)
  damaged.player.facilityProjects[0].remainingWeeks=NaN
  assert.equal(validateSave(damaged),false)
  const duplicate=structuredClone(working)
  duplicate.player.facilityProjects.push(structuredClone(duplicate.player.facilityProjects[0]))
  assert.equal(validateSave(duplicate),false)
})
