import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, validateSave, runSeason, finishRentalReview, nextSeason, setProgram, ROOM_DEFINITIONS, buyEquipment } from '../../src/center/simulation.ts'
import { contractRoomRemodel, advanceRoomRemodels, roomRemodelBonus, REMODEL_COST } from '../../src/center/roomRemodel.ts'
import { SAVE_KEY, parseSaveFile, replaceGameSave } from '../../src/center/savePersistence.ts'
import { HALL_KEY, readHall, registerHall } from '../../src/center/hallOfFame.ts'
function store(){const data=new Map<string,string>();return {data,getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v)}}}
test('new/import replacement backs up valid progress and rejects malformed input without changing it',()=>{
 const storage=store(),old=nextSeason(runSeason(finishRentalReview(createGame(2))))
 storage.setItem(SAVE_KEY,JSON.stringify(old));replaceGameSave(storage,createGame(3))
 assert.ok([...storage.data.entries()].some(([k,v])=>k.includes('backup.manual')&&v===JSON.stringify(old)))
 assert.equal(JSON.stringify(parseSaveFile(JSON.stringify({game:old}))),JSON.stringify(old))
 assert.throws(()=>parseSaveFile('{bad'));assert.throws(()=>parseSaveFile('{"year":7}'))
 const primary=storage.getItem(SAVE_KEY)
 assert.throws(()=>replaceGameSave({getItem:storage.getItem,setItem:()=>{throw new Error('quota')}},createGame(4)))
 assert.equal(storage.getItem(SAVE_KEY),primary)
})
test('hall records actual final scores once, survives a new game, and cannot overwrite damaged hall data',()=>{
 const storage=store();let game=createGame(32)
 assert.throws(()=>registerHall(storage,game,'센터장'))
 for(let i=0;i<28;i++)game=nextSeason(runSeason(finishRentalReview(game)))
 assert.equal(game.phase,'ending')
 const entries=registerHall(storage,game,'  테스트 센터장  ')
 assert.equal(entries.length,1);assert.equal(entries[0].name,'테스트 센터장')
 assert.deepEqual(registerHall(storage,game,'두 번'),entries)
 replaceGameSave(storage,createGame(3));assert.deepEqual(readHall(storage),entries)
 storage.setItem(HALL_KEY,'not json');assert.throws(()=>registerHall(storage,game,'다시'));assert.equal(storage.getItem(HALL_KEY),'not json')
})
test('room remodel charges once, completes only with simulation, preserves bookings and equipment',()=>{
 const game=createGame(4);game.player.cash=10000
 const original=JSON.stringify(game),result=contractRoomRemodel(game,'A')
 assert.equal(JSON.stringify(game),original);assert.equal(result.state.player.cash,8200)
 assert.ok(validateSave(result.state));assert.ok(contractRoomRemodel(result.state,'A').error)
 assert.deepEqual(result.state.player.plan,game.player.plan)
 for(let i=0;i<12;i++)advanceRoomRemodels(result.state.player)
 assert.equal(roomRemodelBonus(result.state.player.rooms[0]),0)
 advanceRoomRemodels(result.state.player);assert.equal(roomRemodelBonus(result.state.player.rooms[0]),6)
 advanceRoomRemodels(result.state.player);assert.equal(result.state.player.cash,8200)
 assert.ok(validateSave(parseSaveFile(JSON.stringify(result.state))))
 const invalid=structuredClone(result.state);invalid.player.rooms[0].remodel!.remainingWeeks=-1
 assert.equal(validateSave(invalid),false)
 assert.ok(contractRoomRemodel(game,'C').error)
 assert.ok(contractRoomRemodel(createGame(4),'A').error)
})
test('remodel improves actual satisfaction without changing immediate fees, attendance, revenue or capacity',()=>{
 let base=finishRentalReview(createGame(15));base.player.cash=20000;base=setProgram(base,'A',0,'P06')
 const improved=structuredClone(base);improved.player.rooms[0].remodel={remainingWeeks:0,paid:REMODEL_COST.A}
 const a=runSeason(base),b=runSeason(improved)
 assert.equal(a.lastReport!.revenue,b.lastReport!.revenue)
 assert.equal(a.lastReport!.visits,b.lastReport!.visits)
 assert.equal(a.lastReport!.cost,b.lastReport!.cost)
 assert.ok(b.lastReport!.experienceScore>a.lastReport!.experienceScore)
 assert.deepEqual(a.player.inventory,b.player.inventory)
})
test('all rooms allow three activity items and auditorium four; fourth ordinary-room purchase is refused',()=>{
 for(const room of ROOM_DEFINITIONS)assert.equal(room.equipmentSlots,room.id==='C'?4:3)
 let game=createGame(1);game.player.cash=10000
 for(const id of ['E01','E02','E04']){const result=buyEquipment(game,id,'A');assert.equal(result.error,undefined);game=result.state}
 const before=JSON.stringify(game),fourth=buyEquipment(game,'E06','A')
 assert.ok(fourth.error?.includes('자리'));assert.equal(JSON.stringify(fourth.state),before)
 assert.ok(validateSave(game))
})
