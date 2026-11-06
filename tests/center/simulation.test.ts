import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGame, buyEquipment, freeCash, setProgram, runSeason, nextSeason,
  previewSeason, canRunProgram, validateSave, getDemand, OFFERS, PROGRAMS,
  ROOM_IDS, ROOM_DEFINITIONS, setWeekendSupport, maintainRoom, finalScore,
  moveEquipment, finishRentalReview, reopenRentalReview, decideRental,
  getRentalAt, getProgramRequirements, getRoomManagement, roomSupportsOffer,
  MAX_YEARS, MAX_TURNS,
} from '../../src/center/simulation.ts'
import type { GameState, RoomId } from '../../src/center/simulation.ts'
import { postFacilityTender, collectFacilityBids, awardFacilityContract } from '../../src/center/facilityProjects.ts'

function purchase(state:GameState, offer:string, room:RoomId):GameState {
  const result=buyEquipment(state,offer,room)
  assert.equal(result.error,undefined)
  return result.state
}
function completeInstallation(state:GameState):GameState {
  const completed=runSeason(finishRentalReview(state))
  assert.equal(completed.phase,'review')
  assert.equal(completed.player.pendingTasks.length,0)
  return nextSeason(completed)
}
function acceptAvailable(state:GameState):GameState {
  for(const request of state.player.rentalRequests) {
    const approved=decideRental(state,request.id,'accepted')
    if(!approved.error)state=approved.state
  }
  return state
}
// Isolated equipment tests start with an already completed public-facility project.
// Bidding/construction behavior is covered separately by the facility tests.
function openedFixture(room:RoomId):GameState {
  const state=createGame()
  state.player.rooms.find(r=>r.id===room)!.open=true
  return state
}

test('new game has seven differentiated spaces, protected funds and independent rivals',()=>{
  const state=createGame()
  assert.equal(state.version,2)
  assert.equal(state.planningStage,'rentals')
  assert.equal(state.player.cash,1080)
  assert.equal(state.player.reserved,320)
  assert.equal(freeCash(state.player),760)
  assert.equal(state.rivals.length,9)
  assert.equal(new Set(state.rivals.map(r=>r.id)).size,9)
  assert.equal(state.player.rooms.length,7)
  assert.deepEqual(state.player.rooms.filter(r=>r.open).map(r=>r.id).sort(),['A','B','E','F'])
  assert.deepEqual(state.player.rooms.map(r=>r.id).sort(),[...ROOM_IDS].sort())
  assert.equal(new Set(ROOM_DEFINITIONS.map(r=>r.name)).size,7)
  assert.ok(new Set(ROOM_DEFINITIONS.map(r=>r.area)).size>=5)
  assert.ok(ROOM_DEFINITIONS.find(r=>r.id==='C')!.capacity>ROOM_DEFINITIONS.find(r=>r.id==='G')!.capacity)
  state.rivals[0].cash=0
  state.rivals[0].rooms[0].management=0
  assert.equal(state.rivals[1].cash,1080)
  assert.equal(state.player.cash,1080)
  assert.ok(state.player.rooms[0].management>0)
})

test('purchase spends once, reserves maintenance and does not unlock before installation',()=>{
  const base=createGame()
  const bought=purchase(purchase(base,'E01','A'),'E02','B')
  assert.equal(base.player.inventory.length,0)
  assert.equal(bought.player.cash,base.player.cash-90-60)
  assert.equal(bought.player.reserved,base.player.reserved+4*(2+1))
  assert.equal(bought.player.pendingTasks.length,2)
  assert.ok(bought.player.inventory.every(e=>!e.ready))
  const duplicate=buyEquipment(bought,'E01B','A')
  assert.ok(duplicate.error)
  assert.equal(duplicate.state,bought)
  assert.equal(canRunProgram(bought.player,'A','P01'),false)
  assert.ok(getProgramRequirements(bought.player,'A','P01').pendingFamilies.includes('craft'))
  const completed=completeInstallation(bought)
  assert.equal(canRunProgram(completed.player,'A','P01'),true)
  assert.equal(canRunProgram(completed.player,'B','P01'),false)
  assert.equal(canRunProgram(completed.player,'B','P03'),true)
  assert.equal(canRunProgram(completed.player,'A','P03'),false)
})

test('room slots and auditorium-only stage reject purchases without spending',()=>{
  const full=purchase(purchase(createGame(),'E01','A'),'E02','A')
  for(const [offer,room] of [['E05','A'],['E07','A']] as const){
    const before=JSON.stringify(full),rejected=buyEquipment(full,offer,room)
    assert.ok(rejected.error)
    assert.equal(rejected.state,full)
    assert.equal(JSON.stringify(full),before)
  }
  assert.ok(buyEquipment(createGame(),'E07','C').error)
  const hall=buyEquipment(openedFixture('C'),'E07','C')
  assert.equal(hall.error,undefined)
  assert.equal(hall.state.player.inventory.find(e=>e.id==='E07')?.room,'C')
  const shared=purchase(createGame(),'E08','A')
  assert.ok(buyEquipment(shared,'E08','B').error)
})

test('identical sets in different rooms have separate installation, wear and identity',()=>{
  const purchased=purchase(purchase(createGame(),'E01','A'),'E01','E')
  const [first,second]=purchased.player.inventory
  assert.notEqual(first.instanceId,second.instanceId)
  assert.deepEqual(purchased.player.pendingTasks.map(task=>task.equipment).sort(),[first.instanceId,second.instanceId].sort())
  const installed=completeInstallation(purchased)
  assert.equal(canRunProgram(installed.player,'A','P01'),true)
  assert.equal(canRunProgram(installed.player,'E','P01'),true)
  assert.ok(moveEquipment(installed,'E01','F').error,'offer ID alone is ambiguous when two sets exist')
  const completed=runSeason(setProgram(finishRentalReview(installed),'A',0,'P01'))
  assert.ok(completed.lastReport!.visits>0)
  const used=completed.player.inventory.find(e=>e.instanceId===first.instanceId)!
  const unused=completed.player.inventory.find(e=>e.instanceId===second.instanceId)!
  assert.ok(used.condition<unused.condition)
  assert.equal(unused.condition,installed.player.inventory.find(e=>e.instanceId===second.instanceId)!.condition)
  const moved=moveEquipment(nextSeason(completed),first.instanceId,'F')
  assert.equal(moved.error,undefined)
  assert.equal(moved.state.player.inventory.find(e=>e.instanceId===second.instanceId)!.room,'E')
  assert.equal(canRunProgram(moved.state.player,'E','P01'),true)
})

test('paid classes start locked with explicit difficulty and required sets',()=>{
  const state=createGame()
  const expected=[['P01','입문',['craft']],['P03','입문',['mat']],['P09','중급',['audio','mat']],['P07','고급',['digital','screen']]] as const
  for(const [id,difficulty,families] of expected){
    const program=PROGRAMS.find(p=>p.id===id)!
    assert.equal(program.difficulty,difficulty)
    assert.ok(program.requirementLabel.length>0)
    assert.deepEqual([...program.requires].sort(),[...families].sort())
    for(const room of ROOM_IDS)assert.equal(canRunProgram(state.player,room,id),false)
    const needs=getProgramRequirements(state.player,'A',id)
    assert.equal(needs.ready,false)
    assert.deepEqual([...needs.missingFamilies].sort(),[...families].sort())
  }
  assert.equal(canRunProgram(state.player,'A','P06'),true)
  assert.equal(canRunProgram(state.player,'G','P06'),false)
})

test('intermediate and advanced classes need every set installed in the same room',()=>{
  let state=purchase(purchase(createGame(),'E04','B'),'E06','F')
  state=completeInstallation(state)
  assert.equal(canRunProgram(state.player,'B','P09'),false)
  assert.deepEqual(getProgramRequirements(state.player,'B','P09').missingFamilies,['mat'])
  assert.equal(canRunProgram(state.player,'F','P07'),false)
  assert.deepEqual(getProgramRequirements(state.player,'F','P07').missingFamilies,['screen'])
  state=purchase(purchase(state,'E02','B'),'E05','F')
  assert.equal(canRunProgram(state.player,'B','P09'),false)
  assert.ok(getProgramRequirements(state.player,'B','P09').pendingFamilies.includes('mat'))
  state=completeInstallation(state)
  assert.equal(canRunProgram(state.player,'B','P09'),true)
  assert.equal(canRunProgram(state.player,'F','P07'),true)
  assert.equal(canRunProgram(state.player,'A','P09'),false)
  assert.equal(canRunProgram(state.player,'A','P07'),false)
})

test('legacy equipment in a small incompatible room does not bypass area or purpose',()=>{
  const state=openedFixture('G')
  state.player.inventory.push({id:'E02',instanceId:'legacy-mat',room:'G',ready:true,condition:100})
  state.player.rooms.find(room=>room.id==='G')!.equipment.push('E02')
  const needs=getProgramRequirements(state.player,'G','P03')
  assert.equal(needs.spaceReady,false)
  assert.equal(needs.roomCompatible,false)
  assert.ok(needs.spaceRequired>ROOM_DEFINITIONS.find(r=>r.id==='G')!.area)
  assert.equal(needs.missingFamilies.length,0)
  assert.equal(needs.pendingFamilies.length,0)
  assert.equal(canRunProgram(state.player,'G','P03'),false)
  const planning=finishRentalReview(state)
  assert.equal(setProgram(planning,'G',0,'P03'),planning)
})

test('moving a set preserves identity and locks both rooms until reinstallation',()=>{
  let state=completeInstallation(purchase(purchase(createGame(),'E01','A'),'E02','B'))
  state=finishRentalReview(state)
  state=setProgram(state,'A',0,'P01')
  const equipment=state.player.inventory.find(e=>e.id==='E01')!
  const before=JSON.stringify(state)
  const result=moveEquipment(state,equipment.instanceId,'E')
  assert.equal(result.error,undefined)
  assert.equal(JSON.stringify(state),before)
  assert.equal(result.state.player.cash,state.player.cash-8)
  assert.equal(result.state.player.reserved,state.player.reserved)
  assert.equal(result.state.player.inventory.length,state.player.inventory.length)
  const moved=result.state.player.inventory.find(e=>e.instanceId===equipment.instanceId)!
  assert.equal(moved.room,'E')
  assert.equal(moved.condition,equipment.condition)
  assert.equal(moved.ready,false)
  assert.equal(result.state.player.plan.A[0],'P01')
  assert.equal(canRunProgram(result.state.player,'A','P01'),false)
  assert.equal(canRunProgram(result.state.player,'E','P01'),false)
  assert.ok(result.state.player.pendingTasks.some(t=>t.equipment===equipment.instanceId&&t.room==='E'))
  const completed=completeInstallation(result.state)
  assert.equal(canRunProgram(completed.player,'E','P01'),true)
  assert.equal(canRunProgram(completed.player,'A','P01'),false)
  assert.equal(completed.player.cash,result.state.player.cash+completed.lastReport!.profit)
})

test('invalid moves never spend money or mutate the original state',()=>{
  const pending=purchase(createGame(),'E01','A')
  assert.ok(moveEquipment(pending,pending.player.inventory[0].instanceId,'E').error)
  const state=completeInstallation(pending)
  const id=state.player.inventory[0].instanceId
  for(const [equipment,target] of [['missing','B'],[id,'A']] as [string,RoomId][]){
    const before=JSON.stringify(state),result=moveEquipment(state,equipment,target)
    assert.ok(result.error);assert.equal(result.state,state);assert.equal(JSON.stringify(state),before)
  }
  const poor=structuredClone(state);poor.player.cash=poor.player.reserved+7
  assert.ok(moveEquipment(poor,id,'E').error)
  const common=completeInstallation(purchase(createGame(),'E08','A'))
  assert.ok(moveEquipment(common,common.player.inventory[0].instanceId,'B').error)
  const full=completeInstallation(purchase(purchase(purchase(createGame(),'E01','A'),'E06','F'),'E05','F'))
  assert.ok(moveEquipment(full,full.player.inventory.find(e=>e.id==='E01')!.instanceId,'F').error)
  const hall=completeInstallation(purchase(openedFixture('C'),'E07','C'))
  assert.ok(moveEquipment(hall,hall.player.inventory[0].instanceId,'A').error)
})

test('preview is deterministic and read-only, with duplicate settlement guards',()=>{
  let state=completeInstallation(purchase(createGame(),'E01','A'))
  assert.equal(runSeason(state),state,'rental review must finish before running')
  state=finishRentalReview(state)
  state=setProgram(setProgram(state,'A',0,'P01'),'A',1,'P02')
  const before=JSON.stringify(state),first=previewSeason(state),second=previewSeason(state)
  assert.deepEqual(first,second)
  assert.equal(JSON.stringify(state),before)
  const result=runSeason(state)
  assert.equal(result.phase,'review')
  assert.equal(result.lastReport?.revenue,first.revenue)
  assert.equal(result.lastReport?.cost,first.cost)
  assert.equal(result.lastReport?.weekly.length,13)
  assert.equal(result.history.length,state.history.length+1)
  assert.equal(runSeason(result),result)
  assert.equal(JSON.stringify(state),before)
})

test('all applications may be declined and every space left empty',()=>{
  const base=createGame(),state=finishRentalReview(base)
  assert.ok(state.player.rentalRequests.every(r=>r.status==='declined'))
  for(const room of ROOM_IDS)assert.ok(state.player.plan[room].every(p=>p===null))
  const result=runSeason(state)
  assert.equal(result.phase,'review')
  assert.equal(result.lastReport!.visits,0)
  assert.equal(result.lastReport!.revenue,0)
  assert.equal(result.lastReport!.reputationChange,0)
  assert.ok(result.player.cash>=result.player.reserved)
  assert.equal(nextSeason(result).planningStage,'rentals')
})

test('class bookings and rental applications cannot silently replace each other',()=>{
  let state=createGame()
  const request=state.player.rentalRequests.find(r=>r.program==='P05')!
  assert.ok(request)
  state=finishRentalReview(state)
  state=setProgram(state,request.room,request.slot,'P06')
  state=reopenRentalReview(state)
  state=decideRental(state,request.id,'pending').state
  const rejected=decideRental(state,request.id,'accepted')
  assert.ok(rejected.error)
  assert.equal(rejected.state.player.plan[request.room][request.slot],'P06')
  state=setProgram(state,request.room,request.slot,null)
  const approved=decideRental(state,request.id,'accepted')
  assert.equal(approved.error,undefined)
  state=finishRentalReview(approved.state)
  assert.equal(setProgram(state,request.room,request.slot,'P06'),state)
  assert.equal(getRentalAt(state.player,request.room,request.slot)?.id,request.id)
})

test('only one competing application occupies a room and time',()=>{
  let state=createGame()
  const first=state.player.rentalRequests.find(r=>r.program==='P05')!
  const competing={...first,id:first.id+'-competing',client:'다른 동아리'}
  state.player.rentalRequests.push(competing)
  state=decideRental(state,first.id,'accepted').state
  const before=JSON.stringify(state),rejected=decideRental(state,competing.id,'accepted')
  assert.ok(rejected.error)
  assert.equal(JSON.stringify(state),before)
  assert.equal(state.player.rentalRequests.filter(r=>r.room===first.room&&r.slot===first.slot&&r.status==='accepted').length,1)
})

test('repeating free meetings cannot duplicate demand or farm class reputation',()=>{
  let state=finishRentalReview(createGame())
  for(const room of ROOM_IDS)for(let slot=0;slot<5;slot++)state=setProgram(state,room,slot,'P06')
  const report=previewSeason(state)
  const requests=getDemand(state).filter(g=>g.programs.includes('P06')).reduce((n,g)=>n+g.people,0)
  assert.ok(report.visits<=requests*13)
  assert.equal(report.revenue,0)
  assert.equal(report.reputationChange,0)
  assert.ok(report.cost>0)
})

test('maintenance costs once, repairs worn sets and restores unequipped spaces',()=>{
  let state=completeInstallation(purchase(createGame(),'E01','A'))
  state.player.inventory[0].condition=10
  state.player.rooms.find(r=>r.id==='A')!.management=40
  state.player.rooms.find(r=>r.id==='E')!.management=30
  assert.equal(canRunProgram(state.player,'A','P01'),false)
  assert.ok(getProgramRequirements(state.player,'A','P01').wornFamilies.includes('craft'))
  const before=state.player.cash,oldManagement=getRoomManagement(state.player,'E')
  let repaired=maintainRoom(state,'A')
  assert.equal(repaired.error,undefined)
  state=repaired.state
  assert.equal(state.player.cash,before-12)
  assert.equal(canRunProgram(state.player,'A','P01'),false,'scheduled repair is not completed repair')
  assert.ok(maintainRoom(state,'A').error)
  repaired=maintainRoom(state,'E')
  assert.equal(repaired.error,undefined)
  const completed=completeInstallation(repaired.state)
  assert.equal(canRunProgram(completed.player,'A','P01'),true)
  assert.ok(completed.player.inventory[0].condition>10)
  assert.ok(getRoomManagement(completed.player,'E')>oldManagement)
})

test('support is reversible during planning and cannot be refunded after settlement',()=>{
  const original=createGame(),hired=setWeekendSupport(original,true).state
  assert.equal(hired.player.cash,original.player.cash-24)
  assert.equal(setWeekendSupport(hired,true).state,hired)
  assert.equal(setWeekendSupport(hired,false).state.player.cash,original.player.cash)
  const settled=runSeason(finishRentalReview(hired))
  assert.equal(setWeekendSupport(settled,false).state,settled)
  assert.equal(nextSeason(settled).player.supportContract,false)
})

test('healthy management and reputation improve the next fixed rental offer set',()=>{
  const settled=runSeason(finishRentalReview(createGame(20261105)))
  const low=structuredClone(settled),high=structuredClone(settled)
  low.player.reputation=0;high.player.reputation=100
  low.player.trust=20;high.player.trust=100
  for(const room of low.player.rooms)room.management=20
  for(const room of high.player.rooms)room.management=100
  const fewer=nextSeason(low).player.rentalRequests,better=nextSeason(high).player.rentalRequests
  assert.ok(better.length>fewer.length)
  const feePerRoom=(requests:typeof better,room:RoomId)=>requests.filter(r=>r.room===room).reduce((sum,r)=>sum+r.fee,0)/requests.filter(r=>r.room===room).length
  for(const room of low.player.rooms.filter(r=>r.open).map(r=>r.id))assert.ok(feePerRoom(better,room)>feePerRoom(fewer,room),room)
  assert.deepEqual(nextSeason(high).player.rentalRequests,better)
  assert.deepEqual(nextSeason(low).player.rentalRequests,fewer)
})

test('rentals earn cash while taught classes contribute substantially more reputation',()=>{
  const base=completeInstallation(purchase(purchase(createGame(20261105),'E01','A'),'E02','B'))
  const rentals=finishRentalReview(acceptAvailable(structuredClone(base)))
  let classes=finishRentalReview(structuredClone(base))
  for(let slot=0;slot<5;slot++){
    classes=setProgram(classes,'A',slot,slot%2?'P02':'P01')
    classes=setProgram(classes,'B',slot,slot%2?'P04':'P03')
  }
  const rentalReport=previewSeason(rentals),classReport=previewSeason(classes)
  assert.ok(rentalReport.rentalRevenue>0)
  assert.equal(rentalReport.classRevenue,0)
  assert.ok(classReport.classCost>0)
  assert.ok(classReport.classRevenue>0)
  assert.equal(classReport.rentalRevenue,0)
  assert.ok(rentalReport.profit>classReport.profit)
  assert.ok(classReport.reputationChange>rentalReport.reputationChange+1)
  assert.equal(rentalReport.revenue,rentalReport.rentalRevenue+rentalReport.classRevenue)
})

test('maximum legal equipment maintenance fits the annual operation grant',()=>{
  let state=createGame()
  state.player.cash=100000
  for(const room of ['C','D','G'] as const){
    state=collectFacilityBids(postFacilityTender(state,room).state,room).state
    const bid=[...state.player.facilityProjects.find(project=>project.room===room)!.bids].sort((a,b)=>b.upkeep-a.upkeep)[0]
    const contract=awardFacilityContract(state,room,bid.id)
    assert.equal(contract.error,undefined)
    state=contract.state
  }
  state=completeInstallation(state)
  assert.ok(state.player.rooms.every(room=>room.open))
  const activityFamilies=['craft','mat','audio','screen','digital','stage']
  const expensive=(family:string)=>[...OFFERS.filter(o=>o.family===family)].sort((a,b)=>b.maintenance-a.maintenance)[0]
  state=purchase(purchase(state,'E08','A'),'E10','A')
  for(const room of ROOM_DEFINITIONS){
    const eligible=activityFamilies.map(expensive).filter(offer=>roomSupportsOffer(room.id,offer.id)).sort((a,b)=>b.maintenance-a.maintenance)
    for(const offer of eligible.slice(0,room.equipmentSlots))state=purchase(state,offer.id,room.id)
    state=purchase(purchase(state,'E03',room.id),'E09',room.id)
  }
  while(state.season<3)state=nextSeason(runSeason(finishRentalReview(state)))
  const yearEnd=runSeason(finishRentalReview(state)),newYear=nextSeason(yearEnd)
  const annualGrant=newYear.player.cash-yearEnd.player.cash
  assert.equal(annualGrant,900)
  assert.ok(newYear.player.reserved<=annualGrant,'all opened rooms and legal equipment fit the annual protected budget')
})

test('six years settle 312 weeks with independent rivals and no seventh grant',()=>{
  let state=purchase(purchase(createGame(73),'E01','A'),'E02','B')
  for(let turn=0;turn<MAX_TURNS;turn++){
    state=finishRentalReview(acceptAvailable(state))
    if(turn>0){
      for(let slot=0;slot<5;slot++){
        if(!getRentalAt(state.player,'A',slot))state=setProgram(state,'A',slot,'P01')
        if(!getRentalAt(state.player,'B',slot))state=setProgram(state,'B',slot,'P03')
      }
    }
    const result=runSeason(state)
    assert.equal(result.history.length,turn+1)
    assert.ok(result.lastReport!.rank>=1&&result.lastReport!.rank<=10)
    for(const inst of [result.player,...result.rivals]){
      assert.ok(inst.cash>=0,inst.id+' cash')
      assert.ok(inst.reserved>=0,inst.id+' reserve')
      assert.ok(inst.cash>=inst.reserved-.01,inst.id+' cash covers reserve')
      assert.ok(Number.isFinite(inst.score))
      assert.equal(inst.history.length,turn+1)
    }
    const next=nextSeason(result)
    if(result.season===3&&result.year<MAX_YEARS)assert.ok(Math.abs(next.player.cash-result.player.cash-result.player.annualBudget)<.001)
    if(turn===MAX_TURNS-1)assert.equal(next.player.cash,result.player.cash)
    assert.equal(nextSeason(next),next)
    assert.ok(validateSave(next))
    state=next
  }
  assert.equal(state.phase,'ending')
  assert.equal(state.year,MAX_YEARS)
  assert.equal(state.history.reduce((sum,r)=>sum+r.weekly.length,0),312)
  assert.equal(state.player.annualScores.length,MAX_YEARS)
  assert.deepEqual(state.player.evaluations.map(e=>e.year),[2,4,6])
  assert.equal(runSeason(state),state)
  assert.ok(state.rivals.every(r=>r.inventory.length>0))
  assert.ok(new Set(state.rivals.map(r=>r.score)).size>3)
  assert.ok(Number.isFinite(finalScore(state.player)))
})

test('save validation rejects malformed money, rooms, equipment and reports',()=>{
  const valid=createGame()
  assert.ok(validateSave(JSON.parse(JSON.stringify(valid))))
  assert.equal(validateSave(null),false)
  assert.equal(validateSave({version:2}),false)
  const corrupt=JSON.parse(JSON.stringify(valid));corrupt.player.inventory.push({id:'not-real',instanceId:'fake',room:'A',condition:100,ready:true})
  assert.equal(validateSave(corrupt),false)
  const brokenPlan=structuredClone(valid);brokenPlan.player.plan.A=[]
  assert.equal(validateSave(brokenPlan),false)
  const invalidMoney=structuredClone(valid);invalidMoney.player.cash=Number.NaN
  assert.equal(validateSave(invalidMoney),false)
  const badRooms=JSON.parse(JSON.stringify(valid));badRooms.player.rooms=[null,null,null]
  assert.equal(validateSave(badRooms),false)
  const badStats=JSON.parse(JSON.stringify(valid));badStats.player.yearStats={}
  assert.equal(validateSave(badStats),false)
  const badReport=JSON.parse(JSON.stringify(valid));badReport.phase='review';badReport.lastReport={}
  assert.equal(validateSave(badReport),false)
  const badRequest=JSON.parse(JSON.stringify(valid));badRequest.player.rentalRequests[0].fee=Number.NaN
  assert.equal(validateSave(badRequest),false)
})
