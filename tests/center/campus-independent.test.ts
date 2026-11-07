import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame, finishRentalReview, migrateSave, nextSeason, runSeason, validateSave} from '../../src/center/simulation.ts'
import type {GameState} from '../../src/center/simulation.ts'
import {
  advanceCampusProjects, awardCampusContract, campusBenefits, campusExteriorKey,
  campusExteriorPath, campusUpkeep, collectCampusBids, constructionTurns,
  expectedConstructionCompletion, getCampusProject, isCampusProjectBundled, postCampusTender,
} from '../../src/center/campusProjects.ts'
import type {CampusProject, CampusProjectId} from '../../src/center/campusProjects.ts'

function funded():GameState {
  const state=createGame(20261106)
  state.player.cash=30000
  return state
}
function contract(state:GameState,id:CampusProjectId,tier=0):GameState {
  const announced=postCampusTender(state,id)
  assert.equal(announced.error,undefined)
  const bidding=collectCampusBids(announced.state,id)
  assert.equal(bidding.error,undefined)
  const project=getCampusProject(bidding.state.player,id)!
  const accepted=awardCampusContract(bidding.state,id,project.bids[tier].id)
  assert.equal(accepted.error,undefined)
  return accepted.state
}
function operate(state:GameState):GameState {
  const review=runSeason(finishRentalReview(state))
  assert.equal(review.phase,'review')
  assert.ok(validateSave(review))
  return review
}

// Values verified against the pre-split campusProjects.ts in HEAD. The old
// facade included both its exterior and plaza; its contract must stay intact.
function legacyFixture(stage:CampusProject['stage']):GameState {
  let state=nextSeason(operate(contract(funded(),'garden')))
  const project:CampusProject={
    id:'facade',stage:'announced',bids:[],selectedBidId:null,remainingWeeks:0,
    announcedYear:state.year,announcedSeason:state.season,
    scopeVersion:2,legacyFacadeIncludesPlaza:true,
  }
  state.player.campusProjects.push(project)
  if(stage!=='announced'){
    project.stage='bidding'
    project.bids=[
      {id:'campus-facade-quick',vendor:'새움시설',approach:'빠른 완공 · 기본 마감',price:4500,weeks:9,qualityMin:70,qualityMax:78,finalQuality:74,upkeep:28},
      {id:'campus-facade-balanced',vendor:'바른공간',approach:'공사비와 완성도의 균형',price:6000,weeks:18,qualityMin:83,qualityMax:90,finalQuality:86,upkeep:24},
      {id:'campus-facade-finish',vendor:'결고운건축',approach:'긴 공정 · 정교한 마감',price:7500,weeks:31,qualityMin:94,qualityMax:99,finalQuality:97,upkeep:20},
    ]
  }
  if(stage==='construction'||stage==='complete'){
    state.player.cash-=6000
    state.player.reserved+=24*(4-state.season)
    project.stage='construction';project.selectedBidId='campus-facade-balanced';project.remainingWeeks=18
    state=nextSeason(operate(state))
    assert.equal(getCampusProject(state.player,'facade')!.remainingWeeks,5)
    if(stage==='complete')state=nextSeason(operate(state))
  }
  assert.ok(validateSave(state))
  for(const item of state.player.campusProjects){
    delete (item as unknown as {scopeVersion?:unknown}).scopeVersion
    delete item.legacyFacadeIncludesPlaza
  }
  return state
}

test('all eight exterior combinations follow completed independent work, not tender order',()=>{
  const scopes:CampusProjectId[]=['garden','facade','plaza']
  for(let mask=0;mask<8;mask++){
    let state=funded()
    for(let bit=0;bit<3;bit++)if(mask&(1<<bit))state=contract(state,scopes[bit])
    assert.equal(campusExteriorKey(state.player),0,'a contract cannot display a completed building')
    assert.deepEqual(campusBenefits(state.player),{experience:0,rental:0})
    for(let week=0;week<9;week++)advanceCampusProjects(state.player)
    assert.equal(campusExteriorKey(state.player),mask)
    assert.equal(campusExteriorPath(state.player),`/center/campus-v3/exterior-${mask}.webp`)
    assert.equal(isCampusProjectBundled(state.player,'plaza'),false)
    state.player.campusProjects.reverse()
    assert.equal(campusExteriorKey(state.player),mask,'array order cannot hide an upgrade')
    assert.ok(validateSave(state))
  }
})

test('uncompleted independent projects do not change the visible finished scope',()=>{
  let state=contract(funded(),'plaza')
  for(let week=0;week<9;week++)advanceCampusProjects(state.player)
  state=postCampusTender(state,'facade').state
  state=contract(state,'garden',2)
  assert.equal(campusExteriorKey(state.player),4)
  state=collectCampusBids(state,'facade').state
  assert.equal(campusExteriorKey(state.player),4)
  const project=getCampusProject(state.player,'facade')!
  state=awardCampusContract(state,'facade',project.bids[1].id).state
  for(let week=0;week<18;week++)advanceCampusProjects(state.player)
  assert.equal(campusExteriorKey(state.player),6,'facade joins the finished plaza while garden remains under construction')
  assert.equal(getCampusProject(state.player,'garden')!.remainingWeeks,13)
})

test('construction estimates count actual 13-week seasons, winter rollover and the seven-year boundary',()=>{
  const planning={year:3,season:2,phase:'planning'} as const
  for(const [weeks,turns,season,week,turn,year] of [
    [9,1,2,9,11,3],[18,2,3,5,12,3],[31,3,0,5,13,4],
    [13,1,2,13,11,3],[26,2,3,13,12,3],
  ]){
    assert.equal(constructionTurns(weeks),turns)
    assert.deepEqual(expectedConstructionCompletion(planning,weeks),{year,season,week,turn,turns,withinGame:true})
  }
  assert.deepEqual(expectedConstructionCompletion({...planning,phase:'review'},18),{year:4,season:0,week:5,turn:13,turns:2,withinGame:true})
  assert.deepEqual(expectedConstructionCompletion({year:6,season:3,phase:'planning'},13),{year:6,season:3,week:13,turn:24,turns:1,withinGame:true})
  assert.deepEqual(expectedConstructionCompletion({year:6,season:3,phase:'planning'},18),{year:7,season:0,week:5,turn:25,turns:2,withinGame:true})
  assert.equal(expectedConstructionCompletion({year:7,season:3,phase:'ending'},1)?.withinGame,false)
  for(const weeks of [0,-1,NaN,Infinity])assert.equal(expectedConstructionCompletion(planning,weeks),null)
})

for(const stage of ['announced','bidding','construction','complete'] as const){
  test(`legacy composite ${stage} saves gain scope tags without changing money, history or progress`,()=>{
    const old=legacyFixture(stage),before=structuredClone(old)
    assert.equal(validateSave(old),false)
    const restored=migrateSave(old)
    assert.ok(restored&&validateSave(restored))
    const expected=structuredClone(old)
    for(const project of expected.player.campusProjects){
      project.scopeVersion=2
      if(project.id==='facade')project.legacyFacadeIncludesPlaza=true
    }
    assert.deepEqual(restored,expected,'only schema tags may change; contract/quality/XP/ledgers/reports must be retained')
    assert.deepEqual(old,before,'migration must not mutate its input')
    assert.deepEqual(migrateSave(restored),restored,'reloading cannot reprice or repay a completed project')
    assert.equal(isCampusProjectBundled(restored.player,'plaza'),true)
    const denied=postCampusTender(restored,'plaza')
    assert.ok(denied.error);assert.equal(denied.state,restored)
    assert.equal(campusExteriorKey(restored.player),stage==='complete'?7:1)
  })
}

test('a legacy announced facade keeps its original offer prices and upkeep when bids arrive',()=>{
  const restored=migrateSave(legacyFixture('announced'))!
  const compared=collectCampusBids(restored,'facade')
  assert.equal(compared.error,undefined)
  const project=getCampusProject(compared.state.player,'facade')!
  assert.deepEqual(project.bids.map(b=>b.price),[4500,6000,7500])
  assert.deepEqual(project.bids.map(b=>b.upkeep),[28,24,20])
  const cash=compared.state.player.cash,reserved=compared.state.player.reserved
  const accepted=awardCampusContract(compared.state,'facade',project.bids[1].id)
  assert.equal(accepted.error,undefined)
  assert.equal(accepted.state.player.cash,cash-6000)
  assert.equal(accepted.state.player.reserved,reserved+24*(4-restored.season))
  assert.ok(awardCampusContract(accepted.state,'facade',project.bids[1].id).error)
})

test('unfinished legacy composite awards its old benefit once while completed saves get no replay',()=>{
  const state=migrateSave(legacyFixture('construction'))!
  const original=structuredClone(state.player),project=getCampusProject(state.player,'facade')!
  assert.equal(project.remainingWeeks,5)
  const garden=getCampusProject(state.player,'garden')!
  assert.equal(campusUpkeep(state.player),24+garden.bids.find(b=>b.id===garden.selectedBidId)!.upkeep)
  for(let week=0;week<4;week++)assert.equal(advanceCampusProjects(state.player),0)
  assert.equal(advanceCampusProjects(state.player),10,'86% of old composite reputation 12 rounds to 10')
  assert.equal(state.player.reputation,original.reputation+10)
  const withoutFacade=structuredClone(state.player)
  withoutFacade.campusProjects=withoutFacade.campusProjects.filter(p=>p.id!=='facade')
  const gardenBenefit=campusBenefits(withoutFacade)
  const facadeOnly=structuredClone(state.player)
  facadeOnly.campusProjects=facadeOnly.campusProjects.filter(p=>p.id==='facade')
  assert.deepEqual(campusBenefits(facadeOnly),{experience:2.15,rental:.03},'legacy 86% quality retains the combined 2.5 experience and 4% rental scope')
  assert.ok(campusBenefits(state.player).experience>gardenBenefit.experience)
  assert.ok(campusBenefits(state.player).rental>gardenBenefit.rental)
  assert.equal(advanceCampusProjects(state.player),0)
  assert.equal(state.player.cash,original.cash)
  assert.equal(state.player.reserved,original.reserved)
  const complete=migrateSave(legacyFixture('complete'))!,reputation=complete.player.reputation
  assert.equal(advanceCampusProjects(complete.player),0)
  assert.equal(complete.player.reputation,reputation)
  assert.equal(campusExteriorKey(complete.player),7)
})

test('legacy tags migrate rivals too without touching their funds or recorded results',()=>{
  const old=legacyFixture('complete')
  old.rivals[0].campusProjects=structuredClone(old.player.campusProjects)
  const before=structuredClone(old.rivals[0])
  const restored=migrateSave(old)
  assert.ok(restored)
  for(const project of before.campusProjects){
    project.scopeVersion=2
    if(project.id==='facade')project.legacyFacadeIncludesPlaza=true
  }
  assert.deepEqual(restored.rivals[0],before)
  assert.equal(campusExteriorKey(restored.rivals[0]),7)
  assert.equal(isCampusProjectBundled(restored.rivals[0],'plaza'),true)
})

test('invalid scope tags and duplicate legacy plazas are rejected rather than silently repaired',()=>{
  const good=migrateSave(legacyFixture('complete'))!
  for(const value of [0,1,3,'2',null]){
    const broken=structuredClone(good)
    ;(broken.player.campusProjects[1] as unknown as Record<string,unknown>).scopeVersion=value
    assert.equal(validateSave(broken),false)
    assert.equal(migrateSave(broken),null)
  }
  for(const value of [false,'true',1,null]){
    const broken=structuredClone(good)
    ;(broken.player.campusProjects[1] as unknown as Record<string,unknown>).legacyFacadeIncludesPlaza=value
    assert.equal(migrateSave(broken),null)
  }
  const misplaced=structuredClone(good)
  misplaced.player.campusProjects[0].legacyFacadeIncludesPlaza=true
  assert.equal(migrateSave(misplaced),null)
  const duplicate=structuredClone(good)
  duplicate.player.campusProjects.push(postCampusTender(funded(),'plaza').state.player.campusProjects[0])
  assert.equal(validateSave(duplicate),false)
  assert.equal(migrateSave(duplicate),null)
  const missingVersion=structuredClone(good)
  delete (missingVersion.player.campusProjects[1] as unknown as {scopeVersion?:unknown}).scopeVersion
  assert.equal(migrateSave(missingVersion),null,'a partially written new schema is not an old save')
})
