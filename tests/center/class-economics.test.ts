import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame,buyEquipment,finishRentalReview,runSeason,nextSeason,setProgram,previewClass,validateSave,decideRental,maintainRoom} from '../../src/center/simulation.ts'
import {won,wonAmount,compactWon,legacyMoneyText} from '../../src/center/currency.ts'
test('won formatting changes presentation only, including decimal balances and legacy financial text',()=>{
 assert.equal(won(1080),'10,800,000원');assert.equal(wonAmount(.02),'200');assert.equal(won(-3.5),'-35,000원');assert.equal(compactWon(12),'12만원')
 assert.equal(legacyMoneyText('계약 · 1,800점'),'계약 · 18,000,000원')
})
test('class outlook is deterministic, read-only, and matches actual direct class receipts and costs',()=>{
 let game=buyEquipment(createGame(102),'E01','E').state
 game=finishRentalReview(nextSeason(runSeason(finishRentalReview(game))))
 const before=JSON.stringify(game),a=previewClass(game,'E','P01',1),b=previewClass(game,'E','P01',1)
 assert.deepEqual(a,b);assert.equal(JSON.stringify(game),before);assert.equal(a.assumed,false)
 const actual=runSeason(setProgram(game,'E',1,'P01'))
 assert.ok(Math.abs(a.revenue*13-actual.lastReport!.classRevenue)<.1)
 assert.ok(Math.abs(a.cost*13-actual.lastReport!.classCost)<.1)
 assert.ok(a.satisfaction===null||a.satisfaction>=0&&a.satisfaction<=100)
 assert.ok(validateSave(actual))
})
test('locked classes identify their 70 percent assumption rather than pretending to predict live attendance',()=>{
 const game=createGame(14),before=JSON.stringify(game),p=previewClass(game,'B','P11')
 assert.equal(p.assumed,true);assert.equal(p.attendees,7);assert.ok(p.note.includes('70%'))
 assert.equal(JSON.stringify(game),before)
 assert.equal(previewClass(game,'A','P06').reputation,0,'public safety does not fabricate direct fame')
})
test('forecast never replaces an accepted rental or changes stored equipment and balances',()=>{
 let game=createGame(2);const r=game.player.rentalRequests.find(r=>r.room==='A')!
 game=decideRental(game,r.id,'accepted').state
 const before=JSON.stringify(game),outlook=previewClass(game,'A','P06',r.slot)
 assert.notEqual(outlook.slot,r.slot);assert.equal(JSON.stringify(game),before)
})

test('partial maintenance interruption is reported before placement while financial estimates remain available',()=>{
 let game=buyEquipment(createGame(102),'E01','E').state
 game=finishRentalReview(nextSeason(runSeason(finishRentalReview(game))))
 game=maintainRoom(game,'E').state
 const before=JSON.stringify(game),value=previewClass(game,'E','P01',0)
 assert.equal(value.blockedReason,undefined)
 assert.equal(value.interruptedWeeks,1)
 assert.match(value.interruptionReason??'',/설치·정비/)
 assert.ok(value.cost>0);assert.ok(value.revenue>0)
 const actual=runSeason(setProgram(game,'E',0,'P01'))
 assert.equal(actual.lastReport!.operationIssues!.find(i=>i.room==='E'&&i.slot===0)?.weeks,value.interruptedWeeks)
 assert.equal(JSON.stringify(game),before)
})
