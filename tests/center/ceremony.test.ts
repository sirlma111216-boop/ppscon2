import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { ceremonyAward, ceremonyDetails, ceremonyTitle } from '../../src/center/ceremony.ts'
import { createGame, runSeason, finishRentalReview, getBudgetChange } from '../../src/center/simulation.ts'
import type { EvaluationRecord } from '../../src/center/simulation.ts'
import { readHall, HALL_KEY } from '../../src/center/hallOfFame.ts'

function fixture(year=2, won=true) {
  const game=runSeason(finishRentalReview(createGame(114)))
  game.year=year;game.season=3;game.phase=year===7?'ending':'review'
  const record=(score:number,rank:number):EvaluationRecord=>({year,score,rank,participants:10,award:rank===1?'대통령상':null,
    components:{reputation:score,financial:score,satisfaction:score,publicService:score},budgetChange:getBudgetChange(rank),
    nextAnnualBudget:900,appliesFromYear:year+1,appliesThroughYear:year+2,measuredSeasons:8,partial:false})
  game.player.evaluations=[record(won?92:55,won?1:10)]
  game.rivals.forEach((r,i)=>{r.evaluations=[record(70+i,i+1)]})
  game.lastReport!.year=year;game.lastReport!.evaluation=game.player.evaluations[0]
  return game
}
test('four years have eight distinct awarded/unawarded assets and ceremony titles',()=>{
  const paths=new Set<string>()
  for(const year of [2,4,6,7])for(const won of [true,false]){
    const g=fixture(year,won),d=ceremonyDetails(g,g.lastReport!)
    assert.equal(d.awarded,won);paths.add(d.image)
    assert.ok(existsSync(`public${d.image}`),d.image)
    assert.ok(d.title.includes(year===7?'전국 문화체육센터 우수 운영사례 시상식':'운영성과 평가'))
  }
  assert.equal(paths.size,8)
  assert.equal(ceremonyTitle(4),'4년 차 운영성과 평가 · 우수센터 선정')
})
test('new labels leave legacy save tokens, rank and grant adjustments untouched',()=>{
  const g=fixture(),before=JSON.stringify(g)
  for(let i=0;i<5;i++)ceremonyDetails(g,g.lastReport!)
  assert.equal(JSON.stringify(g),before)
  assert.deepEqual([1,2,3,4].map(r=>ceremonyAward(r)),['최우수 운영센터','우수 운영센터','장려 운영센터',null])
  assert.deepEqual([1,2,3,4].map(r=>ceremonyAward(r,true)),['대상','최우수상','우수상',null])
  assert.deepEqual([1,2,3,8,9,10].map(r=>getBudgetChange(r)),[6,4,2,-2,-4,-6])
})
test('category can honor a non-podium specialist, never cash or score; threshold and missing evidence enforced',()=>{
  const g=fixture(4,false),r=g.player.evaluations[0]
  r.components.publicService=95
  const before=JSON.stringify(g),d=ceremonyDetails(g,g.lastReport!)
  assert.equal(d.award,null);assert.equal(d.category?.title,'공공서비스 우수상');assert.equal(d.awarded,true)
  assert.equal(JSON.stringify(g),before)
  r.components.publicService=79.99;assert.equal(ceremonyDetails(g,g.lastReport!).category,null)
  r.components.publicService=95;g.rivals[0].evaluations=[];assert.equal(ceremonyDetails(g,g.lastReport!).category,null)
})
test('final category uses all evaluation components, not just latest year; ties honor same maximum',()=>{
  const g=fixture(7,true),r=g.player.evaluations[0]
  g.player.evaluations=[{...r,year:2,components:{...r.components,publicService:60}}, {...r,components:{...r.components,publicService:100}}]
  g.rivals.forEach(i=>{i.evaluations[0].components.publicService=95})
  assert.notEqual(ceremonyDetails(g,g.lastReport!).category?.key,'publicService')
  g.player.evaluations=[{...r,components:{reputation:60,financial:60,satisfaction:60,publicService:95}}]
  assert.equal(ceremonyDetails(g,g.lastReport!).category?.key,'publicService')
})
test('award evidence reflects saved scores and legacy hall display changes without rewriting records',()=>{
  const g=fixture(),d=ceremonyDetails(g,g.lastReport!)
  assert.match(d.reason,/92.0점/)
  const raw=JSON.stringify([{id:'a',name:'센터장',award:'대통령상',rank:1,score:90,date:'2026-11-07'}])
  let writes=0
  const entries=readHall({getItem:k=>k===HALL_KEY?raw:null,setItem:()=>{writes++}})
  assert.equal(entries[0].award,'대상');assert.equal(writes,0)
})
