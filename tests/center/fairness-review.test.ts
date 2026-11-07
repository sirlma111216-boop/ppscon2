import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame,finishRentalReview,runSeason,previewSeason,getDemand,validateSave} from '../../src/center/simulation.ts'
import {scheduleClass} from '../../src/center/classPlacement.ts'
import {publicServiceScore} from '../../src/center/balanceRules.ts'
import {seasonBriefing} from '../../src/center/briefingAnalysis.ts'

test('unserved residents overflow into another class without duplicating any demand',()=>{
 let state=finishRentalReview(createGame(711))
 const one=scheduleClass(state,'A',1,'P06');assert.equal(one.error,undefined)
 const before=previewSeason(one.state)
 const two=scheduleClass(one.state,'E',1,'P06');assert.equal(two.error,undefined)
 const expected=getDemand(state).filter(g=>g.programs.includes('P06')&&g.slots.includes(1)).reduce((n,g)=>n+g.people,0)
 const forecast=previewSeason(two.state),result=runSeason(two.state).lastReport!
 assert.ok(result.visits>before.visits)
 assert.equal(result.visits,expected*13)
 assert.deepEqual(result.weekly,forecast.weekly)
 assert.equal(result.activity.reduce((n,a)=>n+a.attendees,0),expected)
 const third=scheduleClass(two.state,'F',1,'P06');assert.ok(third.error);assert.equal(third.state,two.state)
})
test('public access goal rewards actual service, never rentals or an empty plan',()=>{
 const base={publicRequested:100,publicServed:85,weeks:1,learningWeeks:1,learningServed:40}
 assert.equal(publicServiceScore(base),100)
 assert.ok(publicServiceScore({...base,publicServed:40})<80)
 assert.equal(publicServiceScore({...base,publicServed:0,learningServed:0}),0)
 assert.equal(publicServiceScore({...base,learningServed:4000}),100)
 assert.equal(publicServiceScore({...base,learningWeeks:0}),85)
})
test('ranking guidance is saved, finite and exposes no hidden numerical component',()=>{
 const state=runSeason(finishRentalReview(createGame(711))),r=state.lastReport!,target=r.contender!
 assert.ok(validateSave(state));assert.equal(target.period,'season');assert.ok(target.thirdScore<=target.leaderScore)
 const advice=seasonBriefing(r);assert.match(advice.target,/3위권/);assert.doesNotMatch(advice.target,/만족도 [0-9]|공공서비스 [0-9]/)
 const broken=structuredClone(state);broken.lastReport!.contender!.thirdScore=NaN;assert.equal(validateSave(broken),false)
 const before=JSON.stringify(r);seasonBriefing(r);assert.equal(JSON.stringify(r),before)
})
