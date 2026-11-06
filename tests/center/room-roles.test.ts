import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {
  PROGRAMS, ROOM_IDS, buyEquipment, canRunProgram, createGame, finishRentalReview,
  getProgramRequirements, migrateSave, moveEquipment, nextSeason, roomSupportsOffer,
  roomSupportsProgram, runSeason, setProgram, validateSave,
} from '../../src/center/simulation.ts'
import type {GameState, ProgramId, RoomId} from '../../src/center/simulation.ts'

const classes:ProgramId[]=['P01','P02','P03','P04','P06','P07','P09']
const allowed:Record<RoomId,ProgramId[]>={
  A:classes,D:classes,
  B:['P03','P04','P06','P09'],C:['P03','P04','P06','P09'],
  E:['P01','P02','P06'],F:['P01','P02','P06','P07'],G:['P06','P07'],
}
function openFixture(room:RoomId):GameState {
  const state=createGame()
  // Space-construction tests separately cover how locked rooms are opened.
  state.player.rooms.find(r=>r.id===room)!.open=true
  return state
}
function install(state:GameState):GameState {
  return nextSeason(runSeason(finishRentalReview(state)))
}
function purchase(state:GameState,id:string,room:RoomId):GameState {
  const result=buyEquipment(state,id,room)
  assert.equal(result.error,undefined)
  return result.state
}

test('room roles distinguish multipurpose halls, sports, craft, learning and meeting rooms',()=>{
  for(const room of ROOM_IDS)for(const program of classes){
    assert.equal(roomSupportsProgram(room,program),allowed[room].includes(program),`${room}/${program}`)
    assert.equal(getProgramRequirements(createGame().player,room,program).roomCompatible,allowed[room].includes(program))
  }
  for(const room of ROOM_IDS){
    assert.equal(roomSupportsProgram(room,'P05'),true)
    assert.equal(roomSupportsProgram(room,'P10'),true)
    assert.equal(roomSupportsProgram(room,'P08'),room==='C')
  }
  assert.equal(roomSupportsProgram('D','P07'),true,'purpose does not imply the room is already open')
  assert.equal(canRunProgram(createGame().player,'D','P06'),false)
})

test('both multipurpose halls support every class after its own required installation',()=>{
  const configurations:{offers:string[];programs:ProgramId[]}[]=[
    {offers:['E01','E02'],programs:['P01','P02','P03','P04','P06']},
    {offers:['E02','E04'],programs:['P03','P04','P09','P06']},
    {offers:['E06','E05'],programs:['P07','P06']},
  ]
  for(const room of ['A','D'] as const)for(const configuration of configurations){
    let state=openFixture(room)
    for(const id of configuration.offers)state=purchase(state,id,room)
    for(const program of configuration.programs.filter(id=>id!=='P06'))assert.equal(canRunProgram(state.player,room,program),false)
    state=install(state)
    for(const program of configuration.programs)assert.equal(canRunProgram(state.player,room,program),true,`${room}/${program}`)
  }
})

test('purpose-incompatible equipment purchases fail without spending or creating work',()=>{
  const examples:[RoomId,string][]=[['B','E01'],['B','E01B'],['B','E06'],['C','E01'],['C','E06'],['E','E02'],['E','E06'],['F','E04'],['G','E01'],['G','E02']]
  for(const [room,offer] of examples){
    const state=openFixture(room),before=JSON.stringify(state)
    assert.equal(roomSupportsOffer(room,offer),false)
    const result=buyEquipment(state,offer,room)
    assert.ok(result.error,`${room}/${offer}`)
    assert.equal(result.state,state)
    assert.equal(JSON.stringify(state),before)
  }
})

test('presentation screens and common or supporting facilities remain available in every room',()=>{
  for(const room of ROOM_IDS){
    for(const offer of ['E03','E05','E08','E09','E10']){
      assert.equal(roomSupportsOffer(room,offer),true,`${room}/${offer}`)
      assert.equal(buyEquipment(openFixture(room),offer,room).error,undefined)
    }
    const screened=install(purchase(openFixture(room),'E05',room))
    assert.equal(canRunProgram(screened.player,room,'P10'),true)
  }
})

test('installed legacy craft and digital gear cannot override the sports-room purpose',()=>{
  for(const program of ['P01','P07'] as const){
    let state=createGame()
    const offers=program==='P01'?['E01']:['E06','E05']
    state.player.inventory=offers.map((id,index)=>({id,instanceId:`legacy-${index}`,room:'B',ready:true,condition:100}))
    state.player.rooms.find(r=>r.id==='B')!.equipment=offers.slice()
    const required=getProgramRequirements(state.player,'B',program)
    assert.equal(required.spaceReady,true)
    assert.deepEqual(required.missingFamilies,[])
    assert.deepEqual(required.pendingFamilies,[])
    assert.equal(required.roomCompatible,false)
    assert.equal(required.ready,false)
    state=finishRentalReview(state)
    assert.equal(setProgram(state,'B',0,program),state)
    assert.ok(validateSave(state),'old incompatible equipment is preserved as relocatable inventory')
    assert.deepEqual(migrateSave(state),state)
  }
})

test('invalid equipment moves preserve identity and money while compatible destinations still work',()=>{
  const state=install(purchase(createGame(),'E01','A'))
  const item=state.player.inventory[0],snapshot=JSON.stringify(state)
  const rejected=moveEquipment(state,item.instanceId,'B')
  assert.ok(rejected.error)
  assert.equal(rejected.state,state)
  assert.equal(JSON.stringify(state),snapshot)
  const accepted=moveEquipment(state,item.instanceId,'F')
  assert.equal(accepted.error,undefined)
  assert.equal(accepted.state.player.cash,state.player.cash-8)
  assert.equal(accepted.state.player.inventory[0].instanceId,item.instanceId)
  assert.equal(accepted.state.player.inventory[0].room,'F')
  assert.equal(accepted.state.player.inventory[0].ready,false)
  const completed=install(accepted.state)
  assert.equal(canRunProgram(completed.player,'F','P01'),true)
  assert.equal(canRunProgram(completed.player,'A','P01'),false)
})

test('an actual old save keeps incompatible inventory and can recover it through normal relocation',()=>{
  const legacy=JSON.parse(readFileSync(new URL('./fixtures/v1-progress.json',import.meta.url),'utf8'))
  let state=migrateSave(legacy)
  assert.ok(state)
  const original=state.player.inventory.find(item=>item.id==='E01')!
  assert.equal(original.room,'B')
  assert.equal(state.player.cash,legacy.player.cash)
  assert.equal(state.player.reserved,legacy.player.reserved)
  assert.equal(canRunProgram(state.player,'B','P01'),false)
  state=install(state)
  const installed=state.player.inventory.find(item=>item.instanceId===original.instanceId)!
  assert.equal(installed.ready,true)
  const beforeCash=state.player.cash
  const result=moveEquipment(state,installed.instanceId,'E')
  assert.equal(result.error,undefined)
  assert.equal(result.state.player.cash,beforeCash-8)
  assert.equal(result.state.player.inventory.length,legacy.player.inventory.length)
  state=install(result.state)
  assert.equal(canRunProgram(state.player,'E','P01'),true)
  assert.equal(canRunProgram(state.player,'B','P01'),false)
  assert.equal(state.player.inventory.find(item=>item.instanceId===original.instanceId)?.room,'E')
  assert.ok(validateSave(state))
})

test('new rival purchases and operated class schedules obey the same room purposes',()=>{
  let state=createGame(20261106)
  for(let season=0;season<8;season++){
    state=runSeason(finishRentalReview(state))
    for(const rival of state.rivals){
      for(const equipment of rival.inventory)if(equipment.room)assert.ok(roomSupportsOffer(equipment.room,equipment.id),`${rival.id}/${equipment.room}/${equipment.id}`)
      for(const room of ROOM_IDS)for(const program of rival.plan[room])if(program)assert.ok(roomSupportsProgram(room,program),`${rival.id}/${room}/${program}`)
    }
    assert.ok(validateSave(state))
    state=nextSeason(state)
  }
  assert.equal(PROGRAMS.filter(program=>classes.includes(program.id)).length,7)
})
