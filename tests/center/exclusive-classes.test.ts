import test from 'node:test'
import assert from 'node:assert/strict'
import {
  BLOCKS, OFFERS, PROGRAMS, ROOM_IDS, buyEquipment, canRunProgram, createGame,
  finishRentalReview, getDemand, getProgramRequirements, isRentalProgram, migrateSave,
  moveEquipment, nextSeason, previewSeason, reinstallEquipment, roomSupportsOffer,
  roomSupportsProgram, runSeason, setProgram, storeEquipment, validateSave,
} from '../../src/center/simulation.ts'
import type {GameState,ProgramId,RoomId} from '../../src/center/simulation.ts'

const exclusive:{id:ProgramId;room:RoomId;offers:string[]}[]=[
  {id:'P11',room:'B',offers:['E02','E11']},{id:'P16',room:'B',offers:['E15','E04']},
  {id:'P14',room:'C',offers:['E07','E04']},{id:'P17',room:'C',offers:['E16','E04']},{id:'P18',room:'C',offers:['E07','E17']},
  {id:'P12',room:'E',offers:['E01','E12']},{id:'P19',room:'E',offers:['E01','E18']},
  {id:'P13',room:'F',offers:['E06B','E13']},
  {id:'P15',room:'G',offers:['E05','E14']},{id:'P20',room:'G',offers:['E05','E19']},{id:'P21',room:'G',offers:['E06','E20']},
]
function fixture(room:RoomId):GameState {
  const state=createGame(20261110);state.player.cash=10000
  // These are unit fixtures. Facility tests and the independent review use real tenders.
  state.player.rooms.find(value=>value.id===room)!.open=true
  return state
}
function buy(state:GameState,offer:string,room:RoomId):GameState {
  const result=buyEquipment(state,offer,room);assert.equal(result.error,undefined);return result.state
}
function install(state:GameState):GameState { return nextSeason(runSeason(finishRentalReview(state))) }

test('the seven ordinary classes stay available while exactly eleven specialties belong to their own rooms',()=>{
  const counts:Record<RoomId,number>={A:7,B:6,C:7,D:7,E:5,F:5,G:5}
  const exclusiveCounts:Record<RoomId,number>={A:0,B:2,C:3,D:0,E:2,F:1,G:3}
  const general:Record<RoomId,ProgramId[]>={A:['P01','P02','P03','P04','P06','P07','P09'],D:['P01','P02','P03','P04','P06','P07','P09'],B:['P03','P04','P06','P09'],C:['P03','P04','P06','P09'],E:['P01','P02','P06'],F:['P01','P02','P06','P07'],G:['P06','P07']}
  assert.equal(PROGRAMS.filter(program=>program.exclusiveRoom&&Number(program.id.slice(1))<=21).length,11)
  for(const room of ROOM_IDS){
    const classes=PROGRAMS.filter(program=>Number(program.id.slice(1))<=21&&!isRentalProgram(program.id)&&roomSupportsProgram(room,program.id))
    assert.equal(classes.length,counts[room],room)
    assert.equal(classes.filter(program=>program.exclusiveRoom).length,exclusiveCounts[room],room)
    assert.deepEqual(classes.filter(program=>!program.exclusiveRoom).map(program=>program.id),general[room])
  }
  for(const spec of exclusive){
    const program=PROGRAMS.find(program=>program.id===spec.id)!
    assert.equal(program.exclusiveRoom,spec.room);assert.equal(program.weeklyLimit,2)
    for(const room of ROOM_IDS)assert.equal(roomSupportsProgram(room,spec.id),room===spec.room)
  }
  for(const room of ['C','G'] as const){
    assert.ok(PROGRAMS.some(program=>program.exclusiveRoom===room&&roomSupportsProgram(room,program.id)))
    for(const program of PROGRAMS.filter(program=>program.exclusiveRoom===room))assert.equal(canRunProgram(createGame().player,room,program.id),false)
  }
})

test('all eleven specialties unlock only after their local pair installs, serve real demand and obey two weekly sessions',()=>{
  for(const spec of exclusive){
    let state=fixture(spec.room)
    for(const id of spec.offers)state=buy(state,id,spec.room)
    assert.equal(canRunProgram(state.player,spec.room,spec.id),false)
    assert.equal(getProgramRequirements(state.player,spec.room,spec.id).pendingFamilies.length,2)
    state=finishRentalReview(install(state))
    assert.equal(canRunProgram(state.player,spec.room,spec.id),true)
    const groups=getDemand(state).filter(group=>group.programs.includes(spec.id))
    assert.equal(groups.length,2);assert.ok(groups.every(group=>!group.public))
    const slots=[groups[0].slots[0],groups[1].slots.at(-1)!]
    assert.notEqual(slots[0],slots[1])
    for(const slot of slots)state=setProgram(state,spec.room,slot,spec.id)
    const third=BLOCKS.findIndex((_,index)=>!slots.includes(index))
    assert.equal(setProgram(state,spec.room,third,spec.id),state)
    const report=previewSeason(state)
    assert.ok(report.classRevenue>report.classCost,spec.id)
    assert.ok(report.activity.filter(activity=>activity.program===spec.id).length<=2)
    assert.ok(report.visits<=groups.reduce((sum,group)=>sum+group.people,0)*13)
    assert.equal(report.publicVisits,0)
    assert.ok(validateSave(state))
    state.player.inventory.find(item=>item.id===spec.offers[0]&&item.room===spec.room)!.condition=19
    assert.equal(canRunProgram(state.player,spec.room,spec.id),false)
  }
})

test('exclusive procurement and reinstallation reject the wrong space without losing funds or inventory',()=>{
  for(const offer of OFFERS.filter(offer=>offer.exclusiveRoom)){
    const room=offer.exclusiveRoom!,wrong:RoomId=room==='B'?'A':'B'
    let state=fixture(room)
    const before=structuredClone(state),denied=buyEquipment(state,offer.id,wrong)
    assert.equal(roomSupportsOffer(wrong,offer.id),false)
    assert.ok(denied.error);assert.equal(denied.state,state);assert.deepEqual(state,before)
    state=install(buy(state,offer.id,room))
    const equipment=state.player.inventory.find(item=>item.id===offer.id)!
    const moved=moveEquipment(state,equipment.instanceId,wrong)
    assert.ok(moved.error);assert.equal(moved.state,state)
    state=storeEquipment(state,equipment.instanceId).state
    const restored=reinstallEquipment(state,equipment.instanceId,wrong)
    assert.ok(restored.error);assert.equal(restored.state,state)
    assert.equal(reinstallEquipment(state,equipment.instanceId,room).error,undefined)
  }
})

function legacySpecialty(program:ProgramId,room:RoomId,offers:string[]):GameState {
  let state=install(fixture(room))
  delete state.specialtyRulesVersion
  state.player.cash=813.41;state.player.reserved=260
  state.player.inventory=offers.map((id,index)=>({id,instanceId:`old-${program}-${index}`,room,ready:true,condition:73-index}))
  state.player.rooms.find(value=>value.id===room)!.equipment=[...offers]
  state.player.plan[room][0]=program
  return state
}

test('old A/D/G specialty plans migrate individually with free storage, preserved capital and explicit notices',()=>{
  const cases:[ProgramId,RoomId,string[],string][]=[['P11','A',['E02','E11'],'E11'],['P11','D',['E02','E11'],'E11'],['P12','A',['E01','E12'],'E12'],['P13','G',['E06B','E13'],'E13']]
  for(const [program,room,offers,storedId] of cases){
    const old=legacySpecialty(program,room,offers),snapshot=structuredClone(old)
    assert.ok(validateSave(old),'the old structurally valid save is migratable')
    const migrated=migrateSave(old)!
    assert.ok(migrated&&validateSave(migrated));assert.deepEqual(old,snapshot)
    assert.equal(migrated.specialtyRulesVersion,1);assert.equal(migrated.player.plan[room][0],null)
    assert.equal(migrated.player.cash,old.player.cash);assert.equal(migrated.player.reserved,old.player.reserved)
    assert.deepEqual(migrated.history,old.history);assert.deepEqual(migrated.lastReport,old.lastReport)
    assert.deepEqual(migrated.player.evaluationStats,old.player.evaluationStats)
    assert.deepEqual(migrated.player.inventory.map(item=>[item.id,item.instanceId,item.condition]),old.player.inventory.map(item=>[item.id,item.instanceId,item.condition]))
    assert.equal(migrated.player.inventory.find(item=>item.id===storedId)?.stored,true)
    assert.equal(migrated.player.inventory.find(item=>item.id===offers[0])?.room,room)
    assert.ok(migrated.migrationNotices!.some(message=>message.includes('편성을 비웠어요')))
    assert.ok(migrated.migrationNotices!.some(message=>message.includes('비용 없이 보관')))
    assert.deepEqual(migrateSave(migrated),migrated,'the revision is applied once')
  }
})

test('legacy video screens supporting ordinary teaching or signed rentals remain installed',()=>{
  for(const rental of [false,true]){
    const old=legacySpecialty('P13','G',['E06B','E13'])
    old.player.plan.G[1]=rental?'P10':'P07'
    if(rental)old.player.rentalRequests=[{id:'legacy-presentation',room:'G',slot:1,client:'기존 발표단체',title:'발표 대관',program:'P10',attendees:10,fee:22,cost:7,status:'accepted'}]
    const migrated=migrateSave(old)!
    assert.ok(migrated&&validateSave(migrated))
    assert.equal(migrated.player.plan.G[0],null)
    assert.equal(migrated.player.plan.G[1],rental?'P10':'P07')
    assert.equal(migrated.player.inventory.find(item=>item.id==='E13')!.room,'G')
    assert.equal(migrated.player.inventory.find(item=>item.id==='E13')!.stored,undefined)
    assert.equal(canRunProgram(migrated.player,'G',rental?'P10':'P07'),true)
    assert.deepEqual(migrated.player.rentalRequests,old.player.rentalRequests)
    assert.ok(migrated.migrationNotices!.some(message=>message.includes('설치 상태로 보존')))
    assert.deepEqual(migrateSave(migrated),migrated)
  }
})

test('migration cancels only incompatible installation work and preserves independent tasks and rivals',()=>{
  const old=legacySpecialty('P12','A',['E01','E12'])
  for(const item of old.player.inventory)item.ready=false
  old.player.pendingTasks=[...old.player.inventory.map(item=>({kind:'install' as const,room:'A' as const,remaining:1,equipment:item.instanceId})),{kind:'maintain',room:'B',remaining:1}]
  const rival=old.rivals[0]
  rival.inventory=[{id:'E11',instanceId:'rival-reformer',room:'A',ready:true,condition:60}]
  rival.rooms.find(room=>room.id==='A')!.equipment=['E11'];rival.plan.A[2]='P11'
  const migrated=migrateSave(old)!
  assert.ok(migrated&&validateSave(migrated))
  assert.equal(migrated.player.pendingTasks.length,2)
  assert.ok(migrated.player.pendingTasks.some(task=>task.equipment===old.player.inventory[0].instanceId))
  assert.ok(migrated.player.pendingTasks.some(task=>task.kind==='maintain'&&task.room==='B'))
  assert.equal(migrated.rivals[0].plan.A[2],null)
  assert.equal(migrated.rivals[0].inventory[0].stored,true)
  assert.equal(migrated.rivals[0].cash,rival.cash)
})

test('new saves reject out-of-room specialty plans and malformed revision notices rather than resetting history',()=>{
  const state=createGame()
  state.player.plan.A[0]='P11'
  assert.equal(validateSave(state),false);assert.equal(migrateSave(state),null)
  for(const mutate of [
    (copy:GameState)=>{(copy as unknown as {specialtyRulesVersion:unknown}).specialtyRulesVersion=2},
    (copy:GameState)=>{(copy as unknown as {migrationNotices:unknown}).migrationNotices='changed'},
  ]){const bad=createGame();mutate(bad);assert.equal(validateSave(bad),false);assert.equal(migrateSave(bad),null)}
})
