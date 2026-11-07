import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGame, finishRentalReview, runSeason, nextSeason, previewSeason,
  EVALUATION_COMPONENTS, MAX_TURNS, MAX_YEARS, BASE_ANNUAL_BUDGET,
  getEvaluationComponents, getBudgetChange, getAwardForRank, isEvaluationSeason,
  finalScore, getFinalStandings, getFinalRank, validateSave, migrateSave,
  buyEquipment, maintainRoom, trainStaff, moveEquipment, setWeekendSupport,
} from '../../src/center/simulation.ts'
import type { EvaluationRecord, GameState, Institution } from '../../src/center/simulation.ts'
import { postFacilityTender, collectFacilityBids, awardFacilityContract } from '../../src/center/facilityProjects.ts'
import { postCampusTender, collectCampusBids, awardCampusContract } from '../../src/center/campusProjects.ts'

const close=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<.011,`${actual} differs from ${expected}`)
const institutions=(state:GameState)=>[state.player,...state.rivals]
const operate=(state:GameState)=>runSeason(finishRentalReview(state))
function throughTurn(turns:number):GameState {
  let state=createGame(20261105)
  for(let turn=0;turn<turns;turn++){
    if(turn)state=nextSeason(state)
    state=operate(state)
  }
  return state
}
function record(year:number,score:number,rank=4):EvaluationRecord {
  const budgetChange=year<6?getBudgetChange(rank,10):0
  return {year,score,rank,participants:10,award:getAwardForRank(rank),
    components:{reputation:score,financial:score,satisfaction:score,publicService:score},
    budgetChange,nextAnnualBudget:year<6?900*(1+budgetChange/100):900,
    appliesFromYear:year<6?year+1:null,appliesThroughYear:year<6?year+2:null,
    measuredSeasons:8,partial:false}
}

test('new institutions have independent two-year ledgers and the same starting grant',()=>{
  const game=createGame()
  assert.equal(MAX_YEARS,7)
  assert.equal(MAX_TURNS,28)
  assert.equal(game.rivals.length,9)
  for(const inst of institutions(game)){
    assert.equal(inst.annualBudget,900)
    assert.deepEqual(inst.evaluations,[])
    assert.equal(inst.evaluationStats.grants,900)
    assert.equal(inst.evaluationStats.seasons,0)
    assert.equal(inst.evaluationStats.weeks,0)
  }
  game.rivals[0].evaluationStats.grants=1
  assert.equal(game.player.evaluationStats.grants,900)
  assert.equal(game.rivals[1].evaluationStats.grants,900)
})

test('only winters 2, 4, 6 and 7 settle evaluations, rank ten institutions and apply noncompounding grants',()=>{
  let game=createGame()
  for(let turn=0;turn<28;turn++){
    const result=operate(game),checkpoint=[7,15,23,27].includes(turn)
    assert.equal(isEvaluationSeason(result),checkpoint)
    assert.equal(Boolean(result.lastReport!.evaluation),checkpoint)
    for(const inst of institutions(result)){
      assert.equal(inst.evaluations.length,Math.floor((turn+1)/8)+(turn===27?1:0))
      if(checkpoint){
        const entry=inst.evaluations.at(-1)!
        assert.equal(entry.year,result.year)
        assert.equal(entry.participants,10)
        assert.equal(entry.measuredSeasons,result.year===7?4:8)
        assert.equal(entry.partial,false)
        assert.equal(entry.award,getAwardForRank(entry.rank))
        assert.equal(inst.evaluationStats.seasons,0)
        assert.equal(inst.evaluationStats.weeks,0)
        assert.equal(inst.evaluationStats.cost,0)
        assert.equal(inst.evaluationStats.grants,0)
        if(result.year<7){
          assert.equal(entry.budgetChange,getBudgetChange(entry.rank,10))
          close(entry.nextAnnualBudget,900*(1+entry.budgetChange/100))
          assert.equal(inst.annualBudget,entry.nextAnnualBudget)
          assert.equal(entry.appliesFromYear,result.year+1)
          assert.equal(entry.appliesThroughYear,Math.min(7,result.year+2))
        }else{
          assert.equal(entry.budgetChange,0)
          assert.equal(entry.nextAnnualBudget,inst.annualBudget)
          assert.equal(entry.appliesFromYear,null)
          assert.equal(entry.appliesThroughYear,null)
        }
      }else assert.equal(inst.evaluationStats.seasons,(turn+1)%8)
    }
    if(checkpoint){
      const records=institutions(result).map(inst=>inst.evaluations.at(-1)!)
      assert.deepEqual(records.map(r=>r.rank).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10])
      assert.deepEqual(records.map(r=>r.award).filter(Boolean).sort(),['대통령상','장관상','국무총리상'].sort())
      assert.deepEqual(result.lastReport!.evaluation,result.player.evaluations.at(-1))
      assert.deepEqual(result.history.at(-1)!.evaluation,result.player.evaluations.at(-1))
    }
    const next=nextSeason(result)
    for(const inst of institutions(result)){
      const advanced=institutions(next).find(item=>item.id===inst.id)!
      close(advanced.cash-inst.cash,result.season===3&&result.year<7?inst.annualBudget+(result.year===6?450:0):0)
      assert.equal(advanced.annualBudget,inst.annualBudget)
      if(checkpoint&&result.year<7)assert.equal(advanced.evaluationStats.grants,inst.annualBudget+(result.year===6?450:0))
    }
    assert.equal(nextSeason(next),next,'advancing twice cannot pay a second grant')
    assert.ok(validateSave(next))
    game=next
  }
  assert.equal(game.phase,'ending')
  assert.equal(game.history.length,28)
  assert.equal(game.history.reduce((n,r)=>n+r.weekly.length,0),364)
  for(const inst of institutions(game))assert.deepEqual(inst.evaluations.map(r=>r.year),[2,4,6,7])
})

test('evaluation uses period evidence and the specified four weights, not final-day reputation alone',()=>{
  assert.deepEqual(Object.fromEntries(EVALUATION_COMPONENTS.map(c=>[c.key,c.weight])),{reputation:25,financial:20,satisfaction:30,publicService:25})
  const inst=createGame().player
  inst.reputation=100;inst.cash=80;inst.reserved=80
  Object.assign(inst.evaluationStats,{seasons:4,weeks:52,reputationSum:240,
    publicServed:30,publicRequested:100,experienceSum:7000,experienceWeight:100,
    cost:200,revenue:0,grants:100})
  assert.deepEqual(getEvaluationComponents(inst),{reputation:60,financial:50,satisfaction:70,publicService:30})
  inst.reputation=0
  assert.equal(getEvaluationComponents(inst).reputation,60,'a late change cannot replace the measured average')
  inst.evaluationStats.experienceWeight=200
  assert.equal(getEvaluationComponents(inst).satisfaction,35,'canceled bookings remain in the denominator')
  const result=throughTurn(8),entry=result.player.evaluations[0],c=entry.components
  close(entry.score,.25*c.reputation+.2*c.financial+.3*c.satisfaction+.25*c.publicService)
})

test('financial evaluation caps wealth, penalizes operating deficits and records unpaid fixed obligations',()=>{
  const inst=createGame().player
  inst.cash=10000;inst.reserved=0
  Object.assign(inst.evaluationStats,{cost:200,revenue:0,grants:100})
  assert.equal(getEvaluationComponents(inst).financial,70)
  inst.cash=100000000
  assert.equal(getEvaluationComponents(inst).financial,70,'extra wealth cannot erase a coverage deficit')
  inst.evaluationStats.revenue=100
  assert.equal(getEvaluationComponents(inst).financial,100)
  inst.evaluationStats.revenue=100000000
  assert.equal(getEvaluationComponents(inst).financial,100)
  const poor=createGame();poor.player.cash=0;poor.player.reserved=0;poor.player.evaluationStats.grants=0
  const settled=operate(poor)
  assert.equal(settled.player.cash,0)
  assert.equal(settled.lastReport!.cost,0,'nothing was actually paid')
  assert.ok(settled.player.evaluationStats.cost>0,'unpaid operating obligations still count')
  assert.equal(getEvaluationComponents(settled.player).financial,0)
})

test('operating actions enter the financial ledger once while capital procurement remains separate',()=>{
  let game=createGame();game.player.cash=10000
  game.player.xp.culture=1 // A prior class unlocks staff training in this ledger fixture.
  game=buyEquipment(game,'E01','A').state
  game=collectFacilityBids(postFacilityTender(game,'C').state,'C').state
  const facility=game.player.facilityProjects[0].bids[0]
  const awarded=awardFacilityContract(game,'C',facility.id)
  assert.equal(awarded.error,undefined);game=awarded.state
  game=collectCampusBids(postCampusTender(game,'garden').state,'garden').state
  const campus=game.player.campusProjects[0].bids[0]
  const landscaped=awardCampusContract(game,'garden',campus.id)
  assert.equal(landscaped.error,undefined);game=landscaped.state
  assert.equal(game.player.evaluationStats.cost,0,'equipment and construction prices are capital investment')
  const repaired=maintainRoom(game,'A');assert.equal(repaired.error,undefined);game=repaired.state
  assert.equal(game.player.evaluationStats.cost,12)
  assert.ok(maintainRoom(game,'A').error)
  const trained=trainStaff(game,'culture');assert.equal(trained.error,undefined);game=trained.state
  assert.equal(game.player.evaluationStats.cost,24)
  const support=setWeekendSupport(game,true).state
  assert.equal(support.player.evaluationStats.cost,48)
  assert.equal(setWeekendSupport(support,true).state,support)
  game=setWeekendSupport(support,false).state
  assert.equal(game.player.evaluationStats.cost,24)
  const settled=operate(game)
  close(settled.player.evaluationStats.cost,24+settled.lastReport!.cost)
  game=nextSeason(settled)
  const before=game.player.evaluationStats.cost
  const moved=moveEquipment(game,game.player.inventory[0].instanceId,'E')
  assert.equal(moved.error,undefined)
  assert.equal(moved.state.player.evaluationStats.cost,before+8)
  assert.ok(moveEquipment(moved.state,moved.state.player.inventory[0].instanceId,'A').error)
  assert.equal(moved.state.player.evaluationStats.cost,before+8)
})

test('evaluation previews and duplicate settlement do not award twice or change source evidence',()=>{
  const game=nextSeason(throughTurn(7)),before=JSON.stringify(game)
  assert.equal(game.year,2);assert.equal(game.season,3)
  previewSeason(finishRentalReview(game));previewSeason(finishRentalReview(game))
  assert.equal(JSON.stringify(game),before)
  assert.equal(game.player.evaluations.length,0)
  const settled=operate(game),snapshot=JSON.stringify(settled.player.evaluations)
  close(settled.player.cash,game.player.cash+settled.lastReport!.profit)
  assert.equal(runSeason(settled),settled)
  assert.equal(nextSeason(settled).player.evaluations.length,1)
  assert.equal(JSON.stringify(settled.player.evaluations),snapshot)
})

test('top and bottom three budget bands use the full ten-center ranking',()=>{
  assert.equal(BASE_ANNUAL_BUDGET,900)
  assert.deepEqual(Array.from({length:10},(_,i)=>getBudgetChange(i+1,10)),[6,4,2,0,0,0,0,-2,-4,-6])
  assert.deepEqual(Array.from({length:4},(_,i)=>getAwardForRank(i+1)),['대통령상','국무총리상','장관상',null])
})

test('equal evaluation scores receive unique reproducible ranks by institution identity',()=>{
  let game=createGame();game.year=2;game.season=3
  for(const inst of institutions(game)){
    inst.cash=0;inst.reserved=0;inst.rentalRequests=[];inst.evaluationStats.grants=0
  }
  const first=operate(game),second=operate(game)
  const ranked=institutions(first).sort((a,b)=>a.evaluations[0].rank-b.evaluations[0].rank)
  assert.equal(new Set(ranked.map(inst=>inst.evaluations[0].score)).size,1)
  assert.deepEqual(ranked.map(inst=>inst.id),institutions(game).map(inst=>inst.id).sort((a,b)=>a.localeCompare(b)))
  assert.deepEqual(institutions(first).map(inst=>inst.evaluations),institutions(second).map(inst=>inst.evaluations))
})

test('final standings use evaluation history, so the latest evaluation winner need not win overall',()=>{
  const game=createGame()
  for(const inst of institutions(game))inst.evaluations=[record(2,20),record(4,20),record(6,20)]
  game.player.evaluations=[record(2,100,1),record(4,100,1),record(6,70,2)]
  game.rivals[0].evaluations=[record(2,50,2),record(4,50,2),record(6,90,1)]
  assert.equal(finalScore(game.player),80)
  close(finalScore(game.rivals[0]),76.67)
  assert.equal(game.player.evaluations.at(-1)!.rank,2)
  assert.equal(getFinalStandings(game)[0].id,game.player.id)
  assert.equal(getFinalRank(game),1)
  game.player.annualScores=[0,0,0,0,0,0]
  assert.equal(finalScore(game.player),80,'old annual scores cannot overwrite the new evaluation history')
  const legacy=createGame().player;legacy.annualScores=[30,70]
  assert.equal(finalScore(legacy),60)
})

test('final score ties use public service, satisfaction and then stable identity consistently',()=>{
  const game=createGame()
  for(const inst of institutions(game))inst.evaluations=[record(2,50),record(4,50),record(6,50)]
  const publicLeader=game.rivals[0],satisfactionLeader=game.rivals[1]
  publicLeader.evaluations[2].components={reputation:40,financial:50,satisfaction:50,publicService:60}
  satisfactionLeader.evaluations[2].components={reputation:40,financial:35,satisfaction:60,publicService:60}
  assert.ok(institutions(game).every(inst=>finalScore(inst)===50))
  const expected=[satisfactionLeader.id,publicLeader.id,...institutions(game).filter(inst=>![satisfactionLeader.id,publicLeader.id].includes(inst.id)).map(inst=>inst.id).sort((a,b)=>a.localeCompare(b))]
  assert.deepEqual(getFinalStandings(game).map(inst=>inst.id),expected)
  expected.forEach((id,index)=>assert.equal(getFinalRank(game,id),index+1))
})

test('an old five-year ending resumes in year six without fabricated past evaluations',()=>{
  const legacy=JSON.parse(JSON.stringify(throughTurn(20)))
  legacy.phase='ending'
  const removed=structuredClone(legacy.rivals[0]);removed.id='onnuri';removed.name='온누리센터';legacy.rivals.push(removed)
  for(const inst of [legacy.player,...legacy.rivals]){
    delete inst.annualBudget;delete inst.evaluations;delete inst.evaluationStats
  }
  for(const report of [...legacy.history,legacy.lastReport]){delete report.evaluation;delete report.participants}
  legacy.history.at(-1).rank=11;legacy.lastReport.rank=11
  const before=JSON.stringify(legacy),restored=migrateSave(legacy)
  assert.ok(restored)
  assert.equal(JSON.stringify(legacy),before)
  assert.equal(restored.phase,'review')
  assert.equal(restored.year,5)
  assert.equal(restored.season,3)
  assert.equal(restored.rivals.length,9)
  assert.equal(restored.history.length,20)
  assert.equal(restored.lastReport!.rank,11)
  assert.equal(restored.lastReport!.participants,11)
  assert.equal(restored.player.cash,legacy.player.cash)
  assert.deepEqual(restored.player.annualScores,legacy.player.annualScores)
  assert.deepEqual(restored.player.history,legacy.player.history)
  assert.deepEqual(restored.player.evaluations,[])
  assert.equal(restored.player.evaluationStats.seasons,0)
  let game=nextSeason(restored)
  assert.equal(game.year,6);assert.equal(game.season,0)
  close(game.player.cash,restored.player.cash+900)
  for(let season=0;season<4;season++){
    game=operate(game)
    if(season<3)assert.equal(game.lastReport!.evaluation,undefined)
    game=nextSeason(game)
  }
  assert.equal(game.phase,'planning')
  assert.equal(game.year,7)
  assert.equal(game.history.length,24)
  for(const inst of institutions(game)){
    assert.equal(inst.evaluations.length,1)
    assert.equal(inst.evaluations[0].year,6)
    assert.equal(inst.evaluations[0].measuredSeasons,4)
    assert.equal(inst.evaluations[0].partial,true)
  }
  assert.ok(validateSave(game))
})

test('save validation rejects inconsistent evaluation records and only migrates wholly absent new ledgers',()=>{
  const valid=throughTurn(8)
  assert.ok(validateSave(valid))
  const changes:((inst:Institution)=>void)[]=[
    inst=>{inst.annualBudget=901},
    inst=>{inst.evaluations[0].score+=1},
    inst=>{inst.evaluations[0].rank=11},
    inst=>{inst.evaluations[0].components.financial=101},
    inst=>{inst.evaluations[0].nextAnnualBudget+=1},
    inst=>{inst.evaluations[0].appliesThroughYear=5},
    inst=>{inst.evaluations[0].measuredSeasons=9},
    inst=>{inst.evaluations[0].partial=true},
    inst=>{inst.evaluations.push(structuredClone(inst.evaluations[0]))},
    inst=>{inst.evaluationStats.weeks=13},
    inst=>{inst.evaluationStats.grants=Number.NaN},
  ]
  for(const change of changes){const malformed=structuredClone(valid);change(malformed.player);assert.equal(validateSave(malformed),false);assert.equal(migrateSave(malformed),null)}
  const incomplete=JSON.parse(JSON.stringify(valid));delete incomplete.player.evaluationStats
  assert.equal(migrateSave(incomplete),null,'partial schema damage must not erase the existing evaluation history')
  const mismatchedReport=structuredClone(valid);mismatchedReport.lastReport!.evaluation!.year=4
  assert.equal(validateSave(mismatchedReport),false)
})
