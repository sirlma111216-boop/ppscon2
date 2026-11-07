import test from 'node:test'
import assert from 'node:assert/strict'
import {PROGRAMS,ROOM_IDS,OFFERS,roomSupportsProgram,isRentalProgram,createGame,buyEquipment,finishRentalReview,runSeason,nextSeason,setProgram,getDemand,canRunProgram,validateSave} from '../../src/center/simulation.ts'

test('expanded catalog has nine purposeful classes and all three difficulties per room',()=>{
 const expected={A:9,B:9,C:9,D:9,E:9,F:9,G:9}
 for(const room of ROOM_IDS){const courses=PROGRAMS.filter(p=>!isRentalProgram(p.id)&&roomSupportsProgram(room,p.id));assert.equal(courses.length,expected[room]);assert.deepEqual(new Set(courses.map(p=>p.difficulty)),new Set(['입문','중급','고급']))}
})
test('each added course buys local equipment, installs, reaches real attendance and saves correctly',()=>{
 for(const p of PROGRAMS.filter(p=>Number(p.id.slice(1))>=22&&!isRentalProgram(p.id))){
  const room=ROOM_IDS.find(r=>roomSupportsProgram(r,p.id))!
  let state=createGame(740);state.player.cash=20000;state.player.rooms.find(r=>r.id===room)!.open=true
  const supplied=new Set<string>()
  for(const cap of p.requires){if(supplied.has(cap))continue;const offer=OFFERS.find(o=>o.capabilities.includes(cap)&&(!o.exclusiveRoom||o.exclusiveRoom===room))!;const result=buyEquipment(state,offer.id,room);assert.equal(result.error,undefined,p.name);state=result.state;offer.capabilities.forEach(c=>supplied.add(c))}
  state=finishRentalReview(nextSeason(runSeason(finishRentalReview(state))))
  assert.ok(canRunProgram(state.player,room,p.id),p.name)
  const demand=getDemand(state).find(g=>g.programs.includes(p.id))!;assert.ok(demand.people>0,p.name)
  state=setProgram(state,room,demand.slots[0],p.id);state=runSeason(state)
  assert.ok(state.lastReport?.activity.some(a=>a.program===p.id&&a.attendees>0),p.name)
  assert.ok(validateSave(state),p.name)
 }
})
