import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync} from 'node:fs'
import {SEASON_EVENTS,getSeasonEvent,seasonArtPath,createEventDeck,getLegacySeasonEvent,COMIC_EVENT_IDS,SPECIAL_EVENT_IDS} from '../../src/center/seasonEvents.ts'
import {createGame,finishRentalReview,runSeason,nextSeason,previewSeason,validateSave,migrateSave} from '../../src/center/simulation.ts'

test('every season has a unique deterministic event, with small bounded effects and real illustrations',()=>{
 for(let seed=1;seed<=10000;seed++){
  const turns:number[]=[]
  for(let turn=0;turn<28;turn++){
   const calendar={seed,year:1+Math.floor(turn/4),season:turn%4},e=getSeasonEvent(calendar)
   assert.deepEqual(e,getSeasonEvent(calendar))
   if(e)turns.push(turn)
  }
  assert.equal(turns.length,28)
  const deck=createEventDeck(seed);assert.equal(new Set(deck).size,28);assert.equal(deck.filter(id=>COMIC_EVENT_IDS.includes(id)).length,6);assert.equal(deck.filter(id=>SPECIAL_EVENT_IDS.includes(id)).length,4)
 }
 for(const e of SEASON_EVENTS){assert.ok(Math.abs(e.revenueRate)<=.03);assert.ok(Math.abs(e.reputation)<=1.5);assert.ok(e.cash<=20&&e.cost<=15);assert.ok(existsSync(new URL(`../../public/center/milestones-v1/${e.id}.webp`,import.meta.url)))}
 for(const id of ['spring','summer','autumn','winter','ceremony','finale'])assert.ok(existsSync(new URL(`../../public/center/milestones-v1/${id}.webp`,import.meta.url)))
})
test('event settlement is idempotent, forecast is read-only, and next season has no carryover modifier',()=>{
 for(const event of SEASON_EVENTS){
  let found=false
  for(let seed=1;seed<=10&&!found;seed++){
  let state=createGame(seed)
  for(let turn=0;turn<28;turn++){
   state=finishRentalReview(state)
   if(getSeasonEvent(state)?.id===event.id){
    found=true;const before=JSON.stringify(state);const preview=previewSeason(state);assert.equal(JSON.stringify(state),before)
    const result=runSeason(state),impact=result.lastReport!.eventImpact!;assert.equal(impact.id,event.id)
    assert.deepEqual(result.lastReport!.eventImpact,preview.eventImpact)
    assert.ok(Math.abs(result.player.cash-state.player.cash-result.lastReport!.profit)<.02)
    assert.ok(Math.abs(impact.revenue)<=25);assert.equal(runSeason(result),result)
    const next=nextSeason(result);if(next.phase!=='ending'){assert.ok(getSeasonEvent(next));assert.notEqual(getSeasonEvent(next)?.id,event.id)}
    assert.ok(validateSave(next));break
   }
   state=nextSeason(runSeason(state))
  }
  }
  assert.ok(found,event.id)
 }
})
test('old six-year endings migrate without replay, then pay final-year bonus once',()=>{
 let state=createGame(1)
 for(let turn=0;turn<24;turn++){state=runSeason(finishRentalReview(state));if(turn<23)state=nextSeason(state)}
 const old=JSON.parse(JSON.stringify(state));delete old.campaignVersion;old.phase='ending'
 for(const inst of [old.player,...old.rivals]){const e=inst.evaluations.at(-1);e.budgetChange=0;e.nextAnnualBudget=inst.annualBudget;e.appliesFromYear=null;e.appliesThroughYear=null}
 for(const report of [...old.history,old.lastReport])if(report.evaluation?.year===6){report.evaluation.budgetChange=0;report.evaluation.nextAnnualBudget=old.player.annualBudget;report.evaluation.appliesFromYear=null;report.evaluation.appliesThroughYear=null}
 const raw=JSON.stringify(old),restored=migrateSave(old)!;assert.ok(restored);assert.equal(JSON.stringify(old),raw);assert.equal(restored.phase,'review');assert.equal(restored.player.cash,old.player.cash);assert.equal(restored.history.length,24)
 const next=nextSeason(restored);assert.equal(next.year,7);assert.ok(Math.abs(next.player.cash-restored.player.cash-restored.player.annualBudget-450)<.02);assert.equal(nextSeason(next),next);assert.ok(validateSave(next));assert.deepEqual(migrateSave(restored),restored)
})

test('sixteen distinct seasonal images map to 2-year periods and the final year',()=>{
 const paths=new Set<string>();for(let year=1;year<=7;year++)for(let season=0;season<4;season++){const path=seasonArtPath({year,season});assert.ok(existsSync(new URL('../../public'+path,import.meta.url)),path);paths.add(path);if([2,4,6].includes(year))assert.equal(path,seasonArtPath({year:year-1,season}))}assert.equal(paths.size,16);assert.equal(SEASON_EVENTS.length,28)
})


test('legacy saves preserve history and acknowledged current event, with unique future events',()=>{
 for(let seed=1;seed<=12;seed++){
  let state=createGame(seed)
  for(let turn=0;turn<8;turn++)state=nextSeason(runSeason(finishRentalReview(state)))
  delete state.eventDeck
  // Construct real old-catalog records, including seasons with no event.
  for(const r of state.history){const e=getLegacySeasonEvent({seed,year:r.year,season:r.season});if(e)r.eventImpact={id:e.id,cash:0,cost:0,revenue:0,reputation:0};else delete r.eventImpact}
  if(state.lastReport){const r=state.history.at(-1)!;state.lastReport.eventImpact=r.eventImpact}
  state.seasonIntroSeen=`${state.year}-${state.season}`
  const raw=JSON.stringify(state),current=getLegacySeasonEvent(state),migrated=migrateSave(state)!
  assert.ok(migrated);assert.equal(JSON.stringify(state),raw);assert.deepEqual(migrated.history,state.history);assert.equal(getSeasonEvent(migrated)?.id,current?.id)
  assert.deepEqual(migrateSave(migrated),migrated)
  const future=migrated.eventDeck!.slice(9);assert.ok(future.every(Boolean));assert.equal(new Set(future).size,future.length)
  const seen=new Set(migrated.eventDeck!.slice(0,9).filter(Boolean));assert.ok(future.every(id=>!seen.has(id)))
  assert.equal(migrated.player.cash,state.player.cash)
 }
})
test('save rejects unknown or duplicate event IDs and retains order over reload',()=>{
 const state=createGame(42);assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(state)))?.eventDeck,state.eventDeck)
 const duplicate=structuredClone(state);duplicate.eventDeck![1]=duplicate.eventDeck![0];assert.equal(validateSave(duplicate),false)
 const unknown=structuredClone(state);unknown.eventDeck![0]='missing';assert.equal(validateSave(unknown),false)
})
