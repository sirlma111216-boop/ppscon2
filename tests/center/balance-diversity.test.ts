import test from 'node:test'
import assert from 'node:assert/strict'
import {publicServiceScore,seasonReputationGrowthLimit,rentalOperatingCostRate} from '../../src/center/balanceRules.ts'
import {createGame,buyEquipment,finishRentalReview,runSeason,nextSeason,setProgram,decideRental,validateSave,migrateSave} from '../../src/center/simulation.ts'

test('paid education can contribute without replacing the accessibility half of the score',()=>{
 const evidence={publicServed:0,publicRequested:100,weeks:1,learningWeeks:1,learningServed:40}
 assert.equal(publicServiceScore(evidence),50)
 assert.equal(publicServiceScore({...evidence,learningServed:400}),50,'volume cannot buy the accessibility half')
 assert.equal(publicServiceScore({...evidence,publicServed:100}),100)
 assert.equal(publicServiceScore({...evidence,learningServed:0}),0)
})
test('legacy evidence is neither fabricated nor reweighted before new weeks are measured',()=>{
 const old={publicServed:30,publicRequested:100,weeks:2}
 assert.equal(publicServiceScore(old),30)
 assert.ok(Math.abs(publicServiceScore({...old,learningWeeks:1,learningServed:40})-48.8235294118)<.000001)
})
test('actual paid attendance is recorded once; rentals and idle time are not education',()=>{
 let game=createGame(20261201)
 game=buyEquipment(game,'E01','E').state
 game=nextSeason(runSeason(finishRentalReview(game)))
 game=setProgram(finishRentalReview(game),'E',0,'P01')
 const before=game.player.evaluationStats.learningServed??0
 const result=runSeason(game)
 assert.ok((result.player.evaluationStats.learningServed??0)>before)
 assert.equal(result.player.evaluationStats.learningWeeks,26)
 assert.equal(runSeason(result),result)
 let rental=createGame(20261201)
 const request=rental.player.rentalRequests.find(r=>r.program==='P05')!
 assert.ok(request)
 rental=decideRental(rental,request.id,'accepted').state
 rental=runSeason(finishRentalReview(rental))
 assert.ok(rental.lastReport!.rentalRevenue>0)
 assert.equal(rental.player.evaluationStats.learningServed,0)
 assert.equal(rental.player.publicScore,0)
 assert.ok(validateSave(result));assert.ok(validateSave(rental))
})
test('missing legacy fields survive migration and resume measured learning without NaN',()=>{
 let game=createGame(17)
 for(let t=0;t<8;t++){game=runSeason(finishRentalReview(game));if(t<7)game=nextSeason(game)}
 const old=structuredClone(game)
 for(const inst of [old.player,...old.rivals])for(const stats of [inst.yearStats,inst.evaluationStats]){delete stats.learningServed;delete stats.learningWeeks}
 const records=JSON.stringify(old.player.evaluations),cash=old.player.cash
 const restored=migrateSave(old)!
 assert.ok(restored);assert.equal(restored.player.cash,cash);assert.equal(JSON.stringify(restored.player.evaluations),records)
 const next=runSeason(finishRentalReview(nextSeason(restored)))
 assert.ok(validateSave(next));assert.ok(Number.isFinite(next.player.publicScore))
})
test('invalid education counters cannot inflate public-service evidence',()=>{
 for(const patch of [{learningServed:-1},{learningServed:Infinity},{learningWeeks:1},{learningServed:1}]){
  const game=createGame();Object.assign(game.player.evaluationStats,patch);assert.equal(validateSave(game),false)
 }
})
test('startup rental support is preserved and fame grows more slowly near the ceiling',()=>{
 assert.equal(rentalOperatingCostRate(1),.48);assert.equal(rentalOperatingCostRate(2),.48);assert.equal(rentalOperatingCostRate(3),.60);assert.equal(rentalOperatingCostRate(7),.60)
 assert.ok(seasonReputationGrowthLimit(90)<seasonReputationGrowthLimit(50))
 assert.equal(seasonReputationGrowthLimit(30),8)
})
