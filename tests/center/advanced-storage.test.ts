import test from 'node:test'
import assert from 'node:assert/strict'
import {
  PROGRAMS, OFFERS, ROOM_IDS, buyEquipment, canRunProgram, createGame, decideRental,
  finishRentalReview, getDemand, getProgramPlacementError, getProgramRequirements,
  getProgramWeeklyCount, getStorageImpact, migrateSave, moveEquipment, nextSeason, previewSeason,
  reinstallEquipment, roomSupportsProgram, runSeason, setProgram, storeEquipment, validateSave,
} from '../../src/center/simulation.ts'
import type {GameState,ProgramId,RoomId} from '../../src/center/simulation.ts'
import {getRoomEquipmentUsage} from '../../src/center/equipmentUsage.ts'

const specs:{id:ProgramId;room:RoomId;offers:string[];rooms:RoomId[]}[]=[
  {id:'P11',room:'B',offers:['E02','E11'],rooms:['B']},
  {id:'P12',room:'E',offers:['E01','E12'],rooms:['E']},
  {id:'P13',room:'F',offers:['E06B','E13'],rooms:['F']},
]
function rich():GameState { const state=createGame(18620);state.player.cash=10000;return state }
function buy(state:GameState,id:string,room:RoomId):GameState {
  const result=buyEquipment(state,id,room);assert.equal(result.error,undefined);return result.state
}
function install(state:GameState):GameState { return nextSeason(runSeason(finishRentalReview(state))) }
function advanced():GameState {
  let state=rich();for(const spec of specs)for(const id of spec.offers)state=buy(state,id,spec.room)
  return finishRentalReview(install(state))
}
const item=(state:GameState,id:string,room:RoomId)=>state.player.inventory.find(e=>e.id===id&&e.room===room)!

test('advanced classes require both local installed sets without a hidden reputation or experience gate',()=>{
  for(const spec of specs){
    let state=rich();state.player.reputation=0
    state=buy(state,spec.offers[0],spec.room)
    assert.equal(canRunProgram(state.player,spec.room,spec.id),false)
    state=buy(state,spec.offers[1],spec.room)
    assert.equal(getRoomEquipmentUsage(state.player,spec.room).used,2)
    assert.equal(getProgramRequirements(state.player,spec.room,spec.id).pendingFamilies.length,2)
    assert.equal(canRunProgram(state.player,spec.room,spec.id),false)
    state=install(state)
    assert.equal(canRunProgram(state.player,spec.room,spec.id),true)
    assert.deepEqual(state.player.xp,{culture:0,sport:0,event:0})
    for(const room of ROOM_IDS)assert.equal(roomSupportsProgram(room,spec.id),spec.rooms.includes(room),`${room}/${spec.id}`)
    for(const room of spec.rooms.filter(room=>room!==spec.room))assert.equal(canRunProgram(state.player,room,spec.id),false)
    item(state,spec.offers[1],spec.room).condition=19
    assert.equal(canRunProgram(state.player,spec.room,spec.id),false)
  }
})

test('video production needs the upgraded computer, which also preserves ordinary digital teaching',()=>{
  let state=buy(buy(rich(),'E06','F'),'E13','F');state=install(state)
  assert.equal(canRunProgram(state.player,'F','P07'),true)
  assert.equal(canRunProgram(state.player,'F','P13'),false)
  assert.deepEqual(getProgramRequirements(state.player,'F','P13').missingFamilies,['digitalPro'])
  const blocked=buyEquipment(state,'E06B','F');assert.ok(blocked.error);assert.equal(blocked.state,state)
  const stored=storeEquipment(state,item(state,'E06','F').instanceId);assert.equal(stored.error,undefined)
  state=install(buy(stored.state,'E06B','F'))
  assert.equal(canRunProgram(state.player,'F','P07'),true)
  assert.equal(canRunProgram(state.player,'F','P13'),true)
  assert.equal(getRoomEquipmentUsage(state.player,'F').used,2)
  assert.equal(state.player.inventory.filter(e=>e.stored).length,1)
})

test('advanced weekly limits are shared across rooms and cannot be bypassed by preview or malformed saves',()=>{
  let state=rich()
  for(const id of ['E02','E11'])state=buy(state,id,'B')
  state=finishRentalReview(install(state))
  state=setProgram(state,'B',0,'P11');state=setProgram(state,'B',2,'P11')
  assert.equal(getProgramWeeklyCount(state.player,'P11'),2)
  assert.ok(getProgramPlacementError(state.player,'B',4,'P11'))
  assert.equal(setProgram(state,'B',4,'P11'),state)
  assert.equal(getProgramPlacementError(state.player,'B',0,'P11'),undefined,'reselecting the same slot does not consume another allowance')
  const baseline=previewSeason(state),tampered=structuredClone(state)
  tampered.player.plan.A[4]='P11'
  assert.equal(validateSave(tampered),false)
  const guarded=previewSeason(tampered)
  assert.equal(guarded.classRevenue,baseline.classRevenue)
  assert.equal(guarded.classCost,baseline.classCost)
  assert.ok(guarded.warnings.some(message=>message.includes('주 2회')))
})

test('advanced demand is finite, shared and produces distinct income and reputation choices',()=>{
  const state=advanced()
  const reputationChanges:number[]=[]
  for(const spec of specs){
    let planned=state
    for(const slot of spec.id==='P13'?[1,4]:[0,4])planned=setProgram(planned,spec.room,slot,spec.id)
    const report=previewSeason(planned),program=PROGRAMS.find(p=>p.id===spec.id)!
    const requested=getDemand(planned).filter(g=>g.programs.includes(spec.id)).reduce((sum,g)=>sum+g.people,0)
    assert.ok(report.classRevenue>report.classCost,`${spec.id} can produce an actual operating surplus`)
    assert.ok(report.visits<=requested*13)
    assert.equal(program.weeklyLimit,2)
    reputationChanges.push(report.reputationChange)
  }
  const [pilates,pottery,video]=specs.map(spec=>PROGRAMS.find(p=>p.id===spec.id)!)
  assert.ok(pilates.income-pilates.cost>video.income-video.cost)
  assert.ok(video.income-video.cost>pottery.income-pottery.cost)
  assert.ok(pottery.reputationMultiplier!>video.reputationMultiplier!)
  assert.ok(video.reputationMultiplier!>pilates.reputationMultiplier!)
  assert.ok(reputationChanges[1]>reputationChanges[2])
  assert.ok(reputationChanges[2]>reputationChanges[0])
})

test('specialized rivals buy advanced sets through the same priced installation and weekly limit rules',()=>{
  let state=createGame(18621);state.year=2
  for(const rival of state.rivals)rival.cash=10000
  state=runSeason(finishRentalReview(state))
  const cases=[['tantan','P11',['E02','E11']],['baeum','P12',['E01','E12']],['saebom','P13',['E06B','E13']]] as const
  for(const [id,program,offers] of cases){
    const rival=state.rivals.find(r=>r.id===id)!
    assert.ok(offers.every(offer=>rival.inventory.some(item=>item.id===offer&&!item.stored)))
    const paidCapital=rival.inventory.reduce((sum,item)=>sum+OFFERS.find(offer=>offer.id===item.id)!.price,0)
    assert.ok(Math.abs(rival.cash-(10000-paidCapital+rival.evaluationStats.revenue-rival.evaluationStats.cost))<.01,'all owned sets are paid at catalogue prices; operating and storage costs reconcile')
    assert.ok(getProgramWeeklyCount(rival,program)<=2)
  }
  state=runSeason(finishRentalReview(nextSeason(state)))
  for(const [id,program] of cases){const rival=state.rivals.find(r=>r.id===id)!;assert.ok(getProgramWeeklyCount(rival,program)>0);assert.ok(getProgramWeeklyCount(rival,program)<=2)}
  assert.ok(validateSave(state))
})

test('storage requires explicit class cancellation and affects only this item and its dependent slots',()=>{
  let state=install(buy(buy(rich(),'E01','A'),'E01','E'))
  state=finishRentalReview(state);state=setProgram(state,'A',0,'P01');state=setProgram(state,'A',1,'P06');state=setProgram(state,'E',0,'P02')
  const equipment=item(state,'E01','A'),snapshot=structuredClone(state)
  assert.deepEqual(getStorageImpact(state.player,equipment.instanceId),{room:'A',programs:['P01'],slots:[0],rentalIds:[]})
  const denied=storeEquipment(state,equipment.instanceId)
  assert.ok(denied.error);assert.equal(denied.state,state);assert.deepEqual(state,snapshot)
  const result=storeEquipment(state,equipment.instanceId,{allowClearPlan:true})
  assert.equal(result.error,undefined)
  assert.equal(result.state.player.plan.A[0],null);assert.equal(result.state.player.plan.A[1],'P06');assert.equal(result.state.player.plan.E[0],'P02')
  const saved=result.state.player.inventory.find(e=>e.instanceId===equipment.instanceId)!
  assert.equal(saved.stored,true);assert.equal(saved.room,null);assert.equal(saved.ready,false)
  assert.equal(result.state.player.cash,state.player.cash-8)
  assert.equal(result.state.player.reserved,state.player.reserved)
  assert.equal(getRoomEquipmentUsage(result.state.player,'A').used,0)
  assert.equal(getRoomEquipmentUsage(result.state.player,'A').common.length,0)
  assert.equal(getRoomEquipmentUsage(result.state.player,'E').used,1)
  assert.ok(validateSave(result.state))
})

test('storage never silently cancels approved rentals even when clearing classes is authorized',()=>{
  let state=install(buy(rich(),'E05','A'))
  state.player.rentalRequests=[{id:'gear-rental',room:'A',slot:0,client:'발표 모임',title:'발표',program:'P10',attendees:12,fee:18,cost:4,status:'pending'}]
  state=decideRental(state,'gear-rental','accepted').state
  const id=item(state,'E05','A').instanceId,snapshot=structuredClone(state)
  assert.deepEqual(getStorageImpact(state.player,id).rentalIds,['gear-rental'])
  const result=storeEquipment(state,id,{allowClearPlan:true})
  assert.match(result.error!,/대관/);assert.equal(result.state,state);assert.deepEqual(state,snapshot)
  const moved=moveEquipment(state,id,'F',{allowClearPlan:true})
  assert.match(moved.error!,/대관/);assert.equal(moved.state,state);assert.deepEqual(state,snapshot)
})

test('direct room relocation cannot bypass explicit class-clearing confirmation',()=>{
  let state=finishRentalReview(install(buy(rich(),'E01','A')))
  state=setProgram(state,'A',0,'P01');state=setProgram(state,'A',1,'P06')
  const id=item(state,'E01','A').instanceId,snapshot=structuredClone(state)
  const denied=moveEquipment(state,id,'E')
  assert.ok(denied.error);assert.equal(denied.state,state);assert.deepEqual(state,snapshot)
  const moved=moveEquipment(state,id,'E',{allowClearPlan:true})
  assert.equal(moved.error,undefined);assert.equal(moved.state.player.plan.A[0],null)
  assert.equal(moved.state.player.plan.A[1],'P06')
  assert.equal(moved.state.player.inventory.find(e=>e.instanceId===id)?.room,'E')
})

test('stored ownership retains maintenance and condition while reinstalling charges once and waits for the original installation duration',()=>{
  let state=install(buy(rich(),'E06B','F'))
  const equipment=item(state,'E06B','F');equipment.condition=36
  const originalCost=previewSeason(state).cost,originalReserve=state.player.reserved
  const result=storeEquipment(state,equipment.instanceId);assert.equal(result.error,undefined);state=result.state
  assert.equal(previewSeason(state).cost,originalCost,'storage cannot escape the same equipment maintenance')
  assert.equal(state.player.reserved,originalReserve)
  const again=storeEquipment(state,equipment.instanceId);assert.ok(again.error);assert.equal(again.state,state)
  const installed=reinstallEquipment(state,equipment.instanceId,'A');assert.equal(installed.error,undefined)
  assert.equal(installed.state.player.cash,state.player.cash-8)
  assert.equal(installed.state.player.reserved,state.player.reserved)
  const moved=installed.state.player.inventory.find(e=>e.instanceId===equipment.instanceId)!
  assert.equal(moved.condition,36);assert.equal(moved.ready,false);assert.equal(moved.stored,undefined)
  assert.equal(installed.state.player.pendingTasks.find(t=>t.equipment===equipment.instanceId)?.remaining,OFFERS.find(o=>o.id==='E06B')!.installSlots)
  assert.ok(reinstallEquipment(installed.state,equipment.instanceId,'E').error)
  assert.ok(storeEquipment(installed.state,equipment.instanceId).error)
  const completed=install(installed.state)
  assert.equal(completed.player.inventory.find(e=>e.instanceId===equipment.instanceId)?.condition,36)
  assert.equal(completed.player.inventory.find(e=>e.instanceId===equipment.instanceId)?.ready,true)
})

test('reinstallation rejects incompatible, locked, occupied and full rooms without spending or changing the stored item',()=>{
  let state=install(buy(buy(buy(buy(rich(),'E01','A'),'E01','E'),'E06','F'),'E05','F'))
  const id=item(state,'E01','A').instanceId;state=storeEquipment(state,id).state
  for(const room of ['B','D','E','F'] as const){
    const snapshot=structuredClone(state),result=reinstallEquipment(state,id,room)
    assert.ok(result.error,room);assert.equal(result.state,state);assert.deepEqual(state,snapshot)
  }
  state.player.cash=state.player.reserved
  const noMoney=reinstallEquipment(state,id,'A');assert.ok(noMoney.error);assert.equal(noMoney.state,state)
})

test('common equipment cannot be stored and pending installations cannot be canceled into storage',()=>{
  let state=buy(buy(rich(),'E08','A'),'E01','E')
  assert.ok(storeEquipment(state,state.player.inventory.find(e=>e.id==='E01')!.instanceId).error)
  state=install(state)
  const common=state.player.inventory.find(e=>e.id==='E08')!
  assert.ok(storeEquipment(state,common.instanceId).error)
  assert.equal(getRoomEquipmentUsage(state.player,'A').common.length,1)
})

test('old saves omit storage flags normally and new stored saves reject contradictory or dangling state',()=>{
  const old=install(buy(rich(),'E01','A'))
  assert.ok(old.player.inventory.every(e=>e.stored===undefined));assert.deepEqual(migrateSave(old),old)
  const stored=storeEquipment(old,old.player.inventory[0].instanceId).state
  assert.deepEqual(migrateSave(stored),stored)
  const invalid:((state:GameState)=>void)[]=[
    state=>{state.player.inventory[0].room='A'},
    state=>{state.player.inventory[0].ready=true},
    state=>{(state.player.inventory[0] as unknown as {stored:unknown}).stored='yes'},
    state=>{state.player.inventory[0].id='E08'},
    state=>{state.player.pendingTasks.push({kind:'install',room:'A',remaining:1,equipment:state.player.inventory[0].instanceId})},
    state=>{state.player.rooms.find(r=>r.id==='A')!.equipment.push('E01')},
  ]
  for(const change of invalid){const bad=structuredClone(stored);change(bad);assert.equal(validateSave(bad),false);assert.equal(migrateSave(bad),null)}
})

test('multiple stored copies retain individual identities and never unlock rooms or share installation',()=>{
  let state=install(buy(buy(rich(),'E01','A'),'E01','E'))
  const ids=state.player.inventory.map(e=>e.instanceId)
  for(const id of ids)state=storeEquipment(state,id).state
  assert.ok(validateSave(state));assert.equal(state.player.inventory.filter(e=>e.stored).length,2)
  state=reinstallEquipment(state,ids[0],'F').state
  assert.equal(state.player.inventory.find(e=>e.instanceId===ids[1])!.stored,true)
  assert.equal(canRunProgram(state.player,'F','P01'),false)
  state=install(state)
  assert.equal(canRunProgram(state.player,'F','P01'),true)
  assert.equal(canRunProgram(state.player,'A','P01'),false)
  assert.equal(canRunProgram(state.player,'E','P01'),false)
})
