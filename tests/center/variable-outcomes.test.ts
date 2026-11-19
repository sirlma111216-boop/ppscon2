import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGame, finishRentalReview, runSeason, nextSeason, previewSeason, buyEquipment, trainStaff, decideRental,
  validateSave, migrateSave, outcomeOdds, moodOdds, rentalOdds, trainingCost, staffLevel, STAFF_MAX_LEVEL, RENTAL_TRAITS,
  chooseEventOption, getProgramPlacementError, trustDemandFactor, getDemand, adoptRules3, legacyStaffPoints,
  reputationQuality, reputationBalance, trustExpectation,
} from '../../src/center/simulation.ts'
import type { GameState } from '../../src/center/simulation.ts'
import { scheduleClass } from '../../src/center/classPlacement.ts'
import { EVENT_CHOICES, EVENT_CHOICE_ART, eventArtPath, getSeasonEvent } from '../../src/center/seasonEvents.ts'
import { existsSync } from 'node:fs'
import { outcomeArt, trustMilestone } from '../../src/center/resultInsights.ts'
import { briefingMood } from '../../src/center/briefingAnalysis.ts'
import type { SeasonReport, SessionSummary } from '../../src/center/simulation.ts'

/** Mat set ordered and yoga scheduled in the same first planning phase. */
function yogaOpening(seed:number,slots=[1]):GameState {
  let game=finishRentalReview(buyEquipment(createGame(seed),'E02','B').state)
  for(const slot of slots){const placed=scheduleClass(game,'B',slot,'P03');assert.equal(placed.error,undefined);game=placed.state}
  return game
}
/** Yoga in the first free weekday morning or afternoon of the sports room, if the mat is installed. */
function yogaPlan(game:GameState):GameState {
  for(const slot of [0,1]){const placed=scheduleClass(game,'B',slot,'P03');if(!placed.error)game=placed.state}
  return game
}
const idleYears=(game:GameState,seasons:number):GameState=>{for(let i=0;i<seasons;i++){game=runSeason(finishRentalReview(game));if(i<seasons-1)game=nextSeason(game)}return game}

test('new games use rules 3 while the legacy flag and older saves keep their rule set',()=>{
  const game=createGame(5),legacy=createGame(5,true)
  assert.equal(game.rules,3);assert.deepEqual(game.eventChoices,{});assert.equal(legacy.rules,undefined)
  assert.ok(validateSave(game));assert.ok(validateSave(legacy))
  assert.equal(migrateSave(JSON.parse(JSON.stringify(legacy)))?.rules,undefined,'migration never opts an old save into new rules')
  assert.equal(validateSave({...game,rules:4}),false)
})

test('equipment ordered this planning phase can be scheduled and runs once it is installed',()=>{
  const ordered=finishRentalReview(buyEquipment(createGame(31),'E02','B').state)
  assert.equal(getProgramPlacementError(ordered.player,'B',1,'P03'),undefined)
  assert.ok(getProgramPlacementError(ordered.player,'B',1,'P03',false),'strict check still reports the pending installation')
  assert.ok(getProgramPlacementError(ordered.player,'B',1,'P09'),'equipment that was never ordered stays blocked')
  const done=runSeason(yogaOpening(31,[0,1]))
  const sessions=done.lastReport!.sessions!.filter(s=>s.room==='B'&&s.program==='P03')
  assert.equal(sessions.find(s=>s.slot===1)?.weeks,13,'the hour after the installation slot runs from week one')
  assert.equal(sessions.find(s=>s.slot===0)?.weeks,12,'the installation hour itself is lost once')
  assert.ok(validateSave(done))
})

test('settlement is seeded and repeatable yet differs from the steady forecast',()=>{
  let differs=0
  for(let seed=1;seed<=6;seed++){
    const planned=yogaOpening(seed),before=JSON.stringify(planned)
    const forecast=previewSeason(planned),first=runSeason(planned),second=runSeason(planned)
    assert.equal(JSON.stringify(planned),before,'forecast and settlement never mutate the plan')
    assert.deepEqual(first.lastReport,second.lastReport,'the same save always settles the same way')
    const session=first.lastReport!.sessions!.find(s=>s.room==='B'&&s.slot===1)!
    assert.equal(session.tally.reduce((a,b)=>a+b,0),session.weeks)
    assert.ok(['hot','steady','cold'].includes(session.mood!))
    assert.ok(forecast.sessions!.every(s=>s.tally.every(n=>n===0)&&s.mood===undefined),'the forecast shows a steady week, not a drawn one')
    if(first.lastReport!.classRevenue!==forecast.classRevenue)differs++
    assert.ok(validateSave(first))
  }
  assert.ok(differs>=4,'real seasons seldom match the steady forecast')
})

test('trained staff shift the odds without ever removing a bad week',()=>{
  for(let level=0;level<STAFF_MAX_LEVEL;level++){
    const low=outcomeOdds(level),high=outcomeOdds(level+1)
    assert.ok(high.great>low.great&&high.poor<low.poor)
    assert.ok(Math.abs(low.great+low.good+low.flat+low.poor-1)<1e-9)
    assert.ok(moodOdds(level+1).cold<moodOdds(level).cold&&rentalOdds(level+1).poor<rentalOdds(level).poor)
  }
  assert.ok(outcomeOdds(STAFF_MAX_LEVEL).poor>0&&moodOdds(STAFF_MAX_LEVEL).cold>0)
  let novicePoor=0,expertPoor=0,noviceVisits=0,expertVisits=0
  for(let seed=1;seed<=12;seed++)for(const expert of [false,true]){
    const planned=yogaOpening(seed,[0,1]);if(expert)planned.player.xp.sport=400
    for(const session of runSeason(planned).lastReport!.sessions!.filter(s=>s.program==='P03')){
      if(expert){expertPoor+=session.tally[3];expertVisits+=session.attendees}else{novicePoor+=session.tally[3];noviceVisits+=session.attendees}
    }
  }
  assert.ok(expertPoor<novicePoor,`${expertPoor} < ${novicePoor}`)
  assert.ok(expertVisits>noviceVisits,`${expertVisits} > ${noviceVisits}`)
})

test('staff training is levelled, priced by level and lands differently each time',()=>{
  assert.deepEqual([0,1,2,3,4].map(level=>trainingCost(level,3)),[20,30,45,60,80])
  assert.equal(trainingCost(3),12,'legacy price is unchanged')
  assert.deepEqual([0,29,30,80,150,240,350].map(xp=>staffLevel(xp,3)),[0,0,1,2,3,4,5])
  const gains=new Set<number>()
  for(let seed=1;seed<=10;seed++){
    const game=finishRentalReview(createGame(seed)),cash=game.player.cash
    const booked=trainStaff(game,'culture')
    assert.equal(booked.error,undefined,'training no longer needs a prior class');assert.equal(booked.state.player.cash,cash-20)
    assert.ok(trainStaff(booked.state,'sport').error,'one course per season')
    const result=runSeason(booked.state).lastReport!.training!
    assert.equal(result.length,1);assert.ok(result[0].gain>=14&&result[0].gain<=36)
    assert.equal(result[0].grade,result[0].gain>=30?'우수':result[0].gain>=20?'보통':'미흡')
    gains.add(result[0].gain)
  }
  assert.ok(gains.size>=4,'results differ from course to course')
  const master=createGame(3);master.player.xp.culture=400
  assert.match(trainStaff(master,'culture').error??'',/최고/)
})

test('rental requests trade rent against other benefits and same-hour offers always differ',()=>{
  let pairs=0,contrasts=0
  for(let seed=1;seed<=30;seed++){
    const game=createGame(seed)
    assert.ok(game.player.rentalRequests.every(r=>r.trait&&Object.hasOwn(RENTAL_TRAITS,r.trait)))
    for(const a of game.player.rentalRequests)for(const b of game.player.rentalRequests){
      if(a.id>=b.id||a.room!==b.room||a.slot!==b.slot)continue
      pairs++;assert.notEqual(a.trait,b.trait)
      const [money,name]=a.trait==='commercial'?[a,b]:b.trait==='commercial'?[b,a]:[null,null]
      if(!money||name!.trait!=='culture'||money.program!==name!.program)continue
      contrasts++
      assert.ok(money.fee>name!.fee,'the commercial let pays more')
      const run=(id:string)=>previewSeason(finishRentalReview(decideRental(game,id,'accepted').state)).sessions!.find(s=>s.room===a.room&&s.slot===a.slot)!
      assert.ok(run(name!.id).reputation>run(money.id).reputation,'the arts group does more for the name')
    }
  }
  assert.ok(pairs>=30&&contrasts>=1,`${pairs} same-hour pairs, ${contrasts} commercial/culture contrasts`)
  assert.equal(RENTAL_TRAITS.commercial.reputation,0);assert.ok(RENTAL_TRAITS.commercial.wear>RENTAL_TRAITS.community.wear)
  assert.ok(createGame(4,true).player.rentalRequests.every(r=>r.trait===undefined),'legacy requests carry no trait')
})

test('a centre that earns nothing no longer receives full financial marks',()=>{
  const idle=idleYears(createGame(11),8),legacy=idleYears(createGame(11,true),8)
  assert.equal(legacy.player.evaluations[0].components.financial,100)
  assert.ok(idle.player.evaluations[0].components.financial<=60,String(idle.player.evaluations[0].components.financial))
  assert.ok(validateSave(idle))
})

test('choice events: the director\'s answer changes the settlement',()=>{
  let checked=0
  for(let seed=1;seed<=80&&checked<3;seed++){
    const game=createGame(seed),event=getSeasonEvent(game)
    if(!event?.choices)continue
    checked++
    assert.equal(getSeasonEvent(createGame(seed,true))?.choices,undefined,'legacy events stay passive')
    const [first,second]=[0,1].map(index=>runSeason(finishRentalReview(chooseEventOption(game,index))).lastReport!)
    assert.equal(first.eventChoice,0);assert.equal(second.eventChoice,1)
    assert.notDeepEqual(first.eventImpact,second.eventImpact)
    assert.equal(chooseEventOption(game,5),game,'unknown answers are ignored')
    assert.ok(validateSave(runSeason(finishRentalReview(chooseEventOption(game,1)))))
  }
  assert.equal(checked,3)
})

test('trust has no ceiling and brings more applicants with diminishing returns',()=>{
  assert.deepEqual([50,100,200].map(trustDemandFactor),[1,1.25,1.5]);assert.ok(trustDemandFactor(10)<1)
  const game=createGame(8),people=(trust:number)=>getDemand(game,{trust}).reduce((sum,group)=>sum+group.people,0)
  assert.ok(people(200)>people(100)&&people(100)>people(50)&&people(50)>people(0))
  assert.equal(getDemand(createGame(8,true),{trust:200}).reduce((s,g)=>s+g.people,0),getDemand(createGame(8,true)).reduce((s,g)=>s+g.people,0))
  const trusted=createGame(8);trusted.player.trust=180
  assert.ok(validateSave(trusted))
  let state=yogaOpening(2,[0,1]);state.player.trust=99
  state=runSeason(state)
  assert.ok(state.player.trust>=93&&state.player.trust<=105,'one season moves trust by at most six either way')
})

test('reputation fades without activity but never below the starting level',()=>{
  const famous=createGame(6);famous.player.reputation=80;famous.eventDeck=Array(28).fill(null) // isolate fading from the season event
  const after=runSeason(finishRentalReview(famous)).player.reputation
  assert.ok(after<80&&after>=30,String(after))
  const fresh=runSeason(finishRentalReview(createGame(6))).player.reputation
  assert.ok(fresh>=28.5,'a new centre at 30 has nothing to fade; only a season event can move it')
})

test('an older save can adopt rules 3 without rewriting its history',()=>{
  let legacy=createGame(77,true);legacy.player.cash=5000
  legacy=buyEquipment(finishRentalReview(legacy),'E02','B').state
  for(let i=0;i<5;i++){legacy=runSeason(legacy.planningStage==='rentals'?finishRentalReview(legacy):legacy);legacy=nextSeason(legacy)}
  legacy.player.xp={culture:0,sport:45,event:400}
  const history=JSON.stringify(legacy.history),evaluations=JSON.stringify(legacy.player.evaluations),cash=legacy.player.cash
  assert.equal(legacy.rules,undefined);assert.equal(legacy.planningStage,'rentals')
  const adopted=adoptRules3(legacy)
  assert.equal(adopted.error,undefined)
  const game=adopted.state
  assert.equal(game.rules,3);assert.ok(validateSave(game));assert.equal(legacy.rules,undefined,'the original state is untouched')
  assert.equal(JSON.stringify(game.history),history);assert.equal(JSON.stringify(game.player.evaluations),evaluations);assert.equal(game.player.cash,cash)
  assert.deepEqual(game.player.xp,{culture:0,sport:30,event:80},'old experience converts to Lv.0, Lv.1 and at most Lv.2')
  assert.deepEqual([0,19,20,119,120,5000].map(legacyStaffPoints),[0,0,30,30,80,80])
  assert.ok(game.rivals.every(rival=>Object.values(rival.xp).every(xp=>[0,30,80].includes(xp))),'every centre converts by the same rule')
  assert.ok(game.player.rentalRequests.length>0&&game.player.rentalRequests.every(request=>request.trait&&request.status==='pending'),'undecided requests are re-issued with trade-offs')
  assert.ok(game.migrationNotices!.length>=4)
  assert.match(adoptRules3(game).error??'',/이미/)
  const played=runSeason(yogaPlan(finishRentalReview(game)))
  assert.ok(validateSave(played));assert.ok(played.lastReport!.sessions!.some(session=>session.tally.reduce((a,b)=>a+b,0)>0),'the next season already varies week by week')
})

test('adopting rules 3 keeps rental decisions the player has already made this season',()=>{
  let legacy=createGame(78,true)
  const first=legacy.player.rentalRequests[0]!
  legacy=decideRental(legacy,first.id,'accepted').state
  const requests=JSON.stringify(legacy.player.rentalRequests),plan=JSON.stringify(legacy.player.plan)
  const game=adoptRules3(legacy).state
  assert.equal(game.rules,3);assert.ok(validateSave(game))
  assert.equal(JSON.stringify(game.player.rentalRequests),requests);assert.equal(JSON.stringify(game.player.plan),plan)
  assert.ok(game.rivals.every(rival=>rival.rentalRequests.every(request=>request.trait)),'rivals had decided nothing yet')
  assert.match(game.migrationNotices!.join(' '),/이미 검토한 대관은 그대로/)
  const review=runSeason(finishRentalReview(createGame(79,true)))
  const afterReview=adoptRules3(review)
  assert.equal(afterReview.error,undefined);assert.equal(afterReview.state.phase,'review');assert.ok(validateSave(afterReview.state))
  assert.ok(nextSeason(afterReview.state).player.rentalRequests.every(request=>request.trait),'the following season arrives under the new rules')
})

test('a name is earned by quality and balance, and trust expects more the higher it climbs',()=>{
  assert.deepEqual([50,66,75,90,97.5,100].map(reputationQuality),[.2,.2,.5,1,1.25,1.25])
  assert.equal(reputationBalance({history:[],publicScore:0}),.8,'a first season has no public-service record yet')
  assert.equal(reputationBalance({history:[70],publicScore:0}),.4);assert.equal(reputationBalance({history:[70],publicScore:80}),1);assert.equal(reputationBalance({history:[70],publicScore:100}),1)
  assert.ok(trustExpectation(200)>trustExpectation(100)&&trustExpectation(100)>trustExpectation(50))
  // The same ordinary plan lifts a little-trusted centre and cannot hold up a hugely trusted one.
  const modest=yogaOpening(5,[0,1]),revered=yogaOpening(5,[0,1]);modest.player.trust=40;revered.player.trust=320
  assert.ok(runSeason(modest).player.trust>40);assert.ok(runSeason(revered).player.trust<320)
  // Well-received classes build a name faster than the same classes run in a poorly kept room.
  const kept=yogaOpening(9,[0,1]),neglected=yogaOpening(9,[0,1])
  neglected.player.rooms.find(room=>room.id==='B')!.management=25
  const gain=(game:GameState)=>runSeason(game).lastReport!.sessions!.filter(s=>s.program==='P03').reduce((n,s)=>n+s.reputation,0)
  assert.ok(gain(kept)>gain(neglected),`${gain(kept)} > ${gain(neglected)}`)
})

test('second-response event scenes exist for every illustrated choice and nothing else changes picture',()=>{
  assert.equal(EVENT_CHOICE_ART.size,18)
  for(const id of EVENT_CHOICE_ART){
    assert.ok(EVENT_CHOICES[id],`${id} is a choice event`)
    assert.equal(eventArtPath(id,1),`/center/milestones-v1/${id}-b.webp`)
    assert.equal(eventArtPath(id,0),`/center/milestones-v1/${id}.webp`);assert.equal(eventArtPath(id),`/center/milestones-v1/${id}.webp`)
    assert.ok(existsSync(new URL(`../../public/center/milestones-v1/${id}-b.webp`,import.meta.url)),`${id}-b.webp is in the build`)
  }
  assert.equal(eventArtPath('rain',1),'/center/milestones-v1/rain.webp','events without a second scene keep their one picture')
})

test('rental trait and staff training illustrations exist for every trait and field',()=>{
  for(const trait of Object.keys(RENTAL_TRAITS))assert.ok(existsSync(new URL(`../../public/center/rental-traits-v1/${trait}.webp`,import.meta.url)),`${trait} rental illustration`)
  for(const id of ['culture','sport','event','levelup'])assert.ok(existsSync(new URL(`../../public/center/training-v1/training-${id}.webp`,import.meta.url)),`training-${id} illustration`)
})

test('outcome scenes, briefing faces and trust milestones pick the right picture and every file exists',()=>{
  const files=['outcomes-v1/great-culture','outcomes-v1/great-sport','outcomes-v1/great-event','outcomes-v1/poor-culture','outcomes-v1/poor-sport','outcomes-v1/poor-event','outcomes-v1/mood-hot','outcomes-v1/mood-cold','trust-v1/trust-100','trust-v1/trust-150','trust-v1/trust-200','jiseon-glad','jiseon-worried','jiseon-resolved']
  for(const name of files)assert.ok(existsSync(new URL(`../../public/center/${name}.webp`,import.meta.url)),name)
  const session=(patch:Partial<SessionSummary>):SessionSummary=>({room:'B',slot:0,program:'P03',rental:false,weeks:13,attendees:100,revenue:10,cost:5,reputation:1,satisfaction:80,tally:[1,5,6,1],...patch})
  assert.equal(outcomeArt(session({})),null,'an ordinary season shows no scene')
  assert.match(outcomeArt(session({tally:[5,4,3,1]}))!.src,/great-sport/)
  assert.match(outcomeArt(session({tally:[1,3,4,5]}))!.src,/poor-sport/)
  assert.match(outcomeArt(session({program:'P01',tally:[4,4,4,1]}))!.src,/great-culture/)
  assert.match(outcomeArt(session({program:'P14',tally:[0,3,5,5]}))!.src,/poor-event/)
  assert.match(outcomeArt(session({mood:'hot',tally:[1,3,4,5]}))!.src,/mood-hot/,'the season mood is the headline')
  assert.match(outcomeArt(session({mood:'cold'}))!.src,/mood-cold/)
  assert.equal(outcomeArt(session({program:'P06',tally:[6,3,3,1]})),null,'a safety class has no field scene')
  assert.equal(outcomeArt(session({program:'P05',rental:true,tally:[6,0,6,1]})),null,'a meeting let has no scene')
  assert.match(outcomeArt(session({program:'P08',rental:true,tally:[5,0,7,1]}))!.src,/great-event/)
  assert.equal(outcomeArt(session({tally:[0,0,0,0]})),null,'legacy sessions without weekly results show nothing')
  assert.deepEqual([[99,100],[100,104],[140,151],[149.9,150],[190,205],[90,160],[50,60]].map(([a,b])=>trustMilestone(a,b)),[100,null,150,150,200,150,null])
  const report=(patch:Partial<SeasonReport>)=>({profit:10,reputationChange:1,rank:5,operationIssues:[],...patch}) as SeasonReport
  assert.equal(briefingMood(report({rank:2})),'glad');assert.equal(briefingMood(report({})),'resolved')
  assert.equal(briefingMood(report({profit:-1,rank:1})),'worried');assert.equal(briefingMood(report({rank:9})),'worried');assert.equal(briefingMood(report({reputationChange:-1.2})),'worried')
  assert.equal(briefingMood(report({rank:2,reputationChange:-.2})),'resolved','a top-three season that lost standing is not a celebration')
})
