import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buyEquipment, createGame, decideRental, finishRentalReview, migrateSave,
  moveEquipment, nextSeason, previewSeason, reopenRentalReview, runSeason,
  setProgram, validateSave,
} from '../../src/center/simulation.ts'
import type {GameState, Institution} from '../../src/center/simulation.ts'
import {
  CAMPUS_SCOPES, advanceCampusProjects, awardCampusContract, campusBenefits,
  campusTier, campusUpkeep, collectCampusBids, getCampusProject,
  planRivalCampus, postCampusTender, validateCampusProjects,
} from '../../src/center/campusProjects.ts'
import type {CampusProjectId} from '../../src/center/campusProjects.ts'
import {awardFacilityContract, collectFacilityBids, getFacilityProject, postFacilityTender} from '../../src/center/facilityProjects.ts'

// Funded fixtures isolate contract/accounting behavior from the separate balance bot.
function funded(seed=20261106):GameState {
  const state=createGame(seed)
  state.player.cash=20000
  return state
}
function bids(state:GameState,id:CampusProjectId='garden'):GameState {
  const posted=postCampusTender(state,id)
  assert.equal(posted.error,undefined)
  const compared=collectCampusBids(posted.state,id)
  assert.equal(compared.error,undefined)
  return compared.state
}
function contract(state:GameState,id:CampusProjectId='garden',tier=0):GameState {
  const compared=bids(state,id),bid=getCampusProject(compared.player,id)!.bids[tier]
  const result=awardCampusContract(compared,id,bid.id)
  assert.equal(result.error,undefined)
  return result.state
}
function operate(state:GameState):GameState {
  const result=runSeason(finishRentalReview(state))
  assert.equal(result.phase,'review')
  assert.ok(validateSave(result))
  return result
}
function complete(state:GameState,id:CampusProjectId):GameState {
  while(getCampusProject(state.player,id)?.stage==='construction')state=nextSeason(operate(state))
  assert.equal(getCampusProject(state.player,id)?.stage,'complete')
  return state
}

test('campus projects require a completed garden before any facade tender',()=>{
  const initial=funded(),before=JSON.stringify(initial)
  assert.equal(campusTier(initial.player),0)
  assert.deepEqual(campusBenefits(initial.player),{experience:0,rental:0})
  const locked=postCampusTender(initial,'facade')
  assert.ok(locked.error)
  assert.equal(locked.state,initial)
  assert.equal(JSON.stringify(initial),before)
  assert.ok(collectCampusBids(initial,'garden').error)
  assert.ok(awardCampusContract(initial,'garden','missing').error)
  const announced=postCampusTender(initial,'garden').state
  assert.ok(postCampusTender(announced,'garden').error)
  assert.ok(postCampusTender(announced,'facade').error)
  const compared=collectCampusBids(announced,'garden').state
  assert.ok(postCampusTender(compared,'facade').error)
  const working=awardCampusContract(compared,'garden',getCampusProject(compared.player,'garden')!.bids[0].id).state
  assert.ok(postCampusTender(working,'facade').error)
  const review=operate(working)
  assert.ok(postCampusTender(review,'facade').error,'review phase cannot publish a tender')
  const completed=nextSeason(review)
  assert.equal(campusTier(completed.player),1)
  const facade=bids(completed,'facade')
  assert.equal(getCampusProject(facade.player,'facade')?.stage,'bidding')
  assert.ok(validateSave(facade))
})

test('campus bids have stable prices, duration and quality and cannot be rerolled',()=>{
  const posted=postCampusTender(funded(),'garden').state
  const first=collectCampusBids(posted,'garden').state
  const second=collectCampusBids(posted,'garden').state
  assert.deepEqual(first,second)
  assert.equal(posted.player.cash,first.player.cash)
  const project=getCampusProject(first.player,'garden')!
  assert.deepEqual(project.bids.map(b=>b.price),[1800,2400,3000])
  assert.deepEqual(project.bids.map(b=>b.weeks),[9,18,31])
  assert.deepEqual(project.bids.map(b=>b.upkeep),[16,12,8])
  for(const bid of project.bids)assert.ok(bid.finalQuality>=bid.qualityMin&&bid.finalQuality<=bid.qualityMax)
  const again=collectCampusBids(first,'garden')
  assert.ok(again.error);assert.equal(again.state,first)
  const afterGarden=complete(contract(funded()),'garden')
  const facade=getCampusProject(bids(afterGarden,'facade').player,'facade')!
  assert.deepEqual(facade.bids.map(b=>b.price),[4500,6000,7500])
  assert.deepEqual(facade.bids.map(b=>b.weeks),[9,18,31])
  assert.deepEqual(facade.bids.map(b=>b.upkeep),[28,24,20])
})

test('campus contracts protect current-year upkeep, reject insufficient money and charge once',()=>{
  const state=bids(funded()),bid=getCampusProject(state.player,'garden')!.bids[1]
  const poor=structuredClone(state)
  poor.player.cash=poor.player.reserved+bid.price+4*bid.upkeep-1
  const before=JSON.stringify(poor),rejected=awardCampusContract(poor,'garden',bid.id)
  assert.ok(rejected.error);assert.equal(rejected.state,poor);assert.equal(JSON.stringify(poor),before)
  const badId=awardCampusContract(state,'garden','unknown')
  assert.ok(badId.error);assert.equal(badId.state,state)
  const accepted=awardCampusContract(state,'garden',bid.id)
  assert.equal(accepted.error,undefined)
  assert.equal(accepted.state.player.cash,state.player.cash-bid.price)
  assert.equal(accepted.state.player.reserved,state.player.reserved+4*bid.upkeep)
  assert.equal(campusUpkeep(accepted.state.player),bid.upkeep)
  assert.equal(campusTier(accepted.state.player),0)
  assert.deepEqual(campusBenefits(accepted.state.player),{experience:0,rental:0})
  const charged=JSON.stringify(accepted.state)
  const duplicate=awardCampusContract(accepted.state,'garden',bid.id)
  assert.ok(duplicate.error);assert.equal(duplicate.state,accepted.state)
  assert.equal(JSON.stringify(accepted.state),charged)
  assert.ok(validateSave(accepted.state))
})

for(const [tier,weeks] of [[0,9],[1,18],[2,31]]){
  test(`campus ${weeks}-week construction advances only through simulated operation`,()=>{
    let state=contract(funded(),'garden',tier)
    const before=JSON.stringify(state),bid=getCampusProject(state.player,'garden')!.bids[tier]
    assert.equal(runSeason(state),state,'rental review alone cannot advance construction')
    const planned=finishRentalReview(state),forecast=previewSeason(planned)
    assert.equal(JSON.stringify(state),before,'preview must not complete the real project')
    assert.equal(getCampusProject(state.player,'garden')?.remainingWeeks,weeks)
    const probe=structuredClone(state.player)
    for(let week=1;week<weeks;week++){
      assert.equal(advanceCampusProjects(probe),0)
      assert.equal(getCampusProject(probe,'garden')?.stage,'construction')
      assert.equal(getCampusProject(probe,'garden')?.remainingWeeks,weeks-week)
    }
    assert.ok(advanceCampusProjects(probe)>0)
    assert.equal(getCampusProject(probe,'garden')?.stage,'complete')
    assert.equal(advanceCampusProjects(probe),0)
    for(let season=1;season<=Math.ceil(weeks/13);season++){
      const cash=state.player.cash,reserve=state.player.reserved
      state=operate(state)
      assert.equal(getCampusProject(state.player,'garden')?.remainingWeeks,Math.max(0,weeks-13*season))
      assert.equal(getCampusProject(state.player,'garden')?.stage,13*season>=weeks?'complete':'construction')
      assert.equal(state.player.cash,cash-state.player.baseReserve-bid.upkeep)
      assert.equal(state.player.reserved,reserve-state.player.baseReserve-bid.upkeep)
      if(season===1)assert.equal(state.lastReport!.cost,forecast.cost)
      if(13*season<weeks)state=nextSeason(state)
    }
    assert.equal(campusTier(state.player),1)
    assert.ok(validateSave(state))
  })
}

test('garden and facade award reputation exactly once and outside the class-growth cap',()=>{
  let state=contract(funded(),'garden',0)
  const garden=getCampusProject(state.player,'garden')!,gardenBid=garden.bids[0]
  const gardenGain=Math.round(CAMPUS_SCOPES[0].reputation*gardenBid.finalQuality/100)
  state=operate(state)
  assert.equal(state.lastReport!.reputationChange,gardenGain)
  assert.equal(state.player.reputation,30+gardenGain)
  state=operate(nextSeason(state))
  assert.equal(state.lastReport!.reputationChange,0)
  state=contract(nextSeason(state),'facade',2)
  const facadeBid=getCampusProject(state.player,'facade')!.bids[2]
  const expected=Math.round(CAMPUS_SCOPES[1].reputation*facadeBid.finalQuality/100)
  assert.ok(expected>8,'a premium facade reward must not be clipped to the class cap')
  const started=state.player.reputation
  state=complete(state,'facade')
  assert.equal(state.player.reputation,started+expected)
  assert.equal(state.lastReport!.reputationChange,expected)
  assert.equal(campusTier(state.player),2)
  const completed=state.player.reputation
  assert.equal(advanceCampusProjects(state.player),0)
  assert.equal(state.player.reputation,completed)
  const repeated=operate(state)
  assert.equal(repeated.lastReport!.reputationChange,0)
  assert.equal(repeated.player.reputation,completed)
})

test('completed campus benefits still improve experience and fixed rental quotes at reputation 100',()=>{
  let state=contract(funded(),'garden',0)
  state.player.reputation=100
  state=operate(state)
  assert.equal(state.player.reputation,100)
  assert.equal(state.lastReport!.reputationChange,0)
  const untreated=structuredClone(state)
  untreated.player.campusProjects=[]
  const upgraded=nextSeason(state),baseline=nextSeason(untreated)
  assert.equal(upgraded.player.reputation,baseline.player.reputation)
  assert.deepEqual(upgraded.player.rentalRequests.map(r=>r.id),baseline.player.rentalRequests.map(r=>r.id))
  for(const request of upgraded.player.rentalRequests){
    const comparable=baseline.player.rentalRequests.find(r=>r.id===request.id)!
    assert.ok(request.fee>comparable.fee,'completed garden affects quotes without any reputation increase')
  }
  const withMeeting=setProgram(finishRentalReview(upgraded),'A',0,'P06')
  const plainMeeting=setProgram(finishRentalReview(baseline),'A',0,'P06')
  const better=previewSeason(withMeeting),plain=previewSeason(plainMeeting)
  assert.equal(better.visits,plain.visits)
  assert.ok(better.experienceScore>plain.experienceScore)
  assert.ok(campusBenefits(upgraded.player).experience>0)
  assert.ok(campusBenefits(upgraded.player).rental>0)
})

test('last-week activity reflects a garden completed during the season',()=>{
  let working=contract(funded(),'garden',0)
  working=setProgram(finishRentalReview(working),'A',0,'P06')
  const plain=structuredClone(working)
  plain.player.campusProjects=[]
  const expected=previewSeason(plain),actual=runSeason(working)
  assert.equal(getCampusProject(actual.player,'garden')?.stage,'complete')
  assert.ok(actual.lastReport!.activity.length>0)
  assert.ok(actual.lastReport!.activity[0].experience>expected.activity[0].experience)
  assert.ok(Math.abs(actual.lastReport!.activity[0].experience-expected.activity[0].experience-campusBenefits(actual.player).experience)<.0001)
})

test('pre-campus v2 saves migrate without changing money, history, rental snapshots or pending work',()=>{
  let state=funded()
  state=buyEquipment(state,'E01','A').state
  state=postFacilityTender(state,'C').state
  state=collectFacilityBids(state,'C').state
  state=awardFacilityContract(state,'C',getFacilityProject(state.player,'C')!.bids[2].id).state
  state=nextSeason(operate(state))
  state=setProgram(finishRentalReview(state),'A',0,'P01')
  state=moveEquipment(state,state.player.inventory[0].instanceId,'E').state
  state=reopenRentalReview(state)
  const request=state.player.rentalRequests.find(r=>r.room!=='A')!
  state=decideRental(state,request.id,'accepted').state
  assert.ok(state.player.pendingTasks.length>0)
  assert.equal(state.player.facilityProjects[0].stage,'construction')
  const old=structuredClone(state)
  for(const inst of [old.player,...old.rivals])delete (inst as unknown as {campusProjects?:unknown}).campusProjects
  const before=JSON.stringify(old)
  assert.equal(validateSave(old),false)
  const restored=migrateSave(old)
  assert.ok(restored&&validateSave(restored))
  assert.deepEqual(restored,state,'migration adds only missing empty campus arrays')
  assert.equal(JSON.stringify(old),before)
  const resumed=operate(restored)
  assert.equal(resumed.player.pendingTasks.length,0)
  assert.equal(resumed.player.facilityProjects[0].remainingWeeks,5)
  const invalid=structuredClone(old)
  ;(invalid.player as unknown as {campusProjects:unknown}).campusProjects=null
  assert.equal(migrateSave(invalid),null,'a present malformed field must not be silently reset')
})

test('rivals use the same campus contract costs and preserve their operating buffer',()=>{
  for(const [id,tier] of [['neulpum',0],['daon',1],['byeolbit',2]] as const){
    const base=createGame(41),rival=structuredClone(base.rivals.find(inst=>inst.id===id)!)
    rival.cash=10000
    const calendar={seed:base.seed,year:3,season:1}
    const shell={...base,...calendar,player:structuredClone(rival)}
    const expected=contract(shell,'garden',tier).player
    planRivalCampus(rival,calendar)
    assert.deepEqual(rival,expected)
    assert.ok(rival.cash-rival.reserved>=350)
    const snapshot=structuredClone(rival)
    planRivalCampus(rival,calendar)
    assert.deepEqual(rival,snapshot,'AI cannot pay for a project twice')
    const poor=structuredClone(base.rivals.find(inst=>inst.id===id)!)
    const selected=getCampusProject(expected,'garden')!.bids[tier]
    poor.cash=poor.reserved+selected.price+selected.upkeep*3+349
    const cash=poor.cash,reserve=poor.reserved
    planRivalCampus(poor,calendar)
    assert.equal(getCampusProject(poor,'garden')?.stage,'bidding')
    assert.equal(poor.cash,cash);assert.equal(poor.reserved,reserve)
    const early=structuredClone(base.rivals.find(inst=>inst.id===id)!)
    early.cash=10000
    planRivalCampus(early,{...calendar,year:2})
    assert.equal(early.campusProjects.length,0)
  }
})

test('save validation rejects malformed campus stages, duplicate projects, bad bids and broken prerequisites',()=>{
  const valid=contract(funded())
  assert.ok(validateCampusProjects(valid.player))
  const cases:((inst:Institution)=>void)[]=[
    inst=>{inst.campusProjects.push(structuredClone(inst.campusProjects[0]))},
    inst=>{inst.campusProjects[0].remainingWeeks=NaN},
    inst=>{inst.campusProjects[0].remainingWeeks=32},
    inst=>{inst.campusProjects[0].selectedBidId='unknown'},
    inst=>{inst.campusProjects[0].bids[0].upkeep=-1},
    inst=>{inst.campusProjects[0].bids[0].price=Infinity},
    inst=>{inst.campusProjects[0].bids[0].finalQuality=101},
    inst=>{inst.campusProjects[0].bids[1].id=inst.campusProjects[0].bids[0].id},
    inst=>{inst.campusProjects[0].announcedSeason=4},
    inst=>{inst.campusProjects[0].id='facade'},
    inst=>{inst.campusProjects[0].stage='complete'},
  ]
  for(const corrupt of cases){
    const state=structuredClone(valid);corrupt(state.player)
    assert.equal(validateSave(state),false)
    assert.equal(migrateSave(state),null)
  }
  const invalidRival=structuredClone(valid)
  invalidRival.rivals[0].campusProjects=structuredClone(valid.player.campusProjects)
  invalidRival.rivals[0].campusProjects[0].remainingWeeks=-1
  assert.equal(validateSave(invalidRival),false)
})
