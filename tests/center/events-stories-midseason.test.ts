import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import {
  createGame, finishRentalReview, runSeason, nextSeason, previewSeason, previewMidseason, buyEquipment, trainStaff,
  chooseEventOption, eventOptionBlock, answeredEvent, eventText, eventRival, validateSave, migrateSave, adoptRules3,
  getEvaluationComponents, storySequence, MIDSEASON_OPTIONS, MIDSEASON_WEEK, STORY_EVERY, STORY_TRUST, ROOM_CARE_NOTICE,
} from '../../src/center/simulation.ts'
import type { GameState, SeasonReport } from '../../src/center/simulation.ts'
import { scheduleClass } from '../../src/center/classPlacement.ts'
import {
  SEASON_EVENTS, EVENT_CHOICES, EVENT_CHOICE_ART, ADDED_EVENT_IDS, LEGACY_EVENT_COUNT, EVENT_CLOSURE_REASONS, RIVAL_TOKEN,
  createEventDeck, getSeasonEvent, eventArtPath,
} from '../../src/center/seasonEvents.ts'
import { eventImpactNotes, midseasonAdvice, storyLine, STORY_ART } from '../../src/center/resultInsights.ts'
import { briefingMood, seasonBriefing } from '../../src/center/briefingAnalysis.ts'

/** Mat set ordered and yoga scheduled in the sports room during the first planning phase. */
function yogaGame(seed:number,slots=[1]):GameState {
  let game=finishRentalReview(buyEquipment(createGame(seed),'E02','B').state)
  for(const slot of slots){const placed=scheduleClass(game,'B',slot,'P03');assert.equal(placed.error,undefined);game=placed.state}
  return game
}
/** Puts the event under test in the current season; the deck stays free of duplicates. */
function withEvent(game:GameState,id:string):GameState {
  const next=structuredClone(game),turn=(next.year-1)*4+next.season,deck=next.eventDeck!,at=deck.indexOf(id)
  if(at>=0)[deck[at],deck[turn]]=[deck[turn]!,deck[at]!];else deck[turn]=id
  assert.equal(getSeasonEvent(next)?.id,id)
  return next
}
const settle=(game:GameState,choice:number):GameState=>runSeason(chooseEventOption(game,choice))
const report=(game:GameState):SeasonReport=>game.lastReport!
const near=(actual:number,expected:number,message?:string)=>assert.ok(Math.abs(actual-expected)<.02,`${message??''} ${actual} vs ${expected}`)
const art=(path:string)=>existsSync(new URL(`../../public${path}`,import.meta.url))

test('the catalogue grows to 39 cards for rules 3 while legacy games keep their 28',()=>{
  assert.equal(SEASON_EVENTS.length,39);assert.equal(LEGACY_EVENT_COUNT,28);assert.equal(ADDED_EVENT_IDS.length,11)
  for(const id of ADDED_EVENT_IDS){
    const choices=EVENT_CHOICES[id]
    assert.equal(choices?.length,2,id);assert.ok(choices.every(choice=>choice.label&&choice.description&&choice.effect),id)
    assert.notDeepEqual({...choices[0],label:'',description:''},{...choices[1],label:'',description:''},`${id} offers a real choice`)
    assert.ok(art(eventArtPath(id,0)),`${id} scene`);assert.ok(art(eventArtPath(id,1)),`${id} answer scene`)
    assert.equal(eventArtPath(id,1).endsWith('-b.webp'),EVENT_CHOICE_ART.has(id))
  }
  assert.deepEqual(ADDED_EVENT_IDS.filter(id=>!EVENT_CHOICE_ART.has(id)),['rival-visit','joint-event','poached-instructor'],'encounters keep one picture')
  const seen=new Set<string>();let variety=false
  for(let seed=1;seed<=300;seed++){
    const legacy=createEventDeck(seed),deck=createEventDeck(seed,3)
    assert.equal(new Set(legacy).size,28);assert.ok(legacy.every(id=>!ADDED_EVENT_IDS.includes(id)),'legacy decks never draw the new cards')
    assert.deepEqual(createGame(seed,true).eventDeck,legacy);assert.deepEqual(createGame(seed).eventDeck,deck)
    assert.equal(deck.length,28);assert.equal(new Set(deck).size,28);assert.ok(deck.every(id=>SEASON_EVENTS.some(event=>event.id===id)))
    const heat=deck.indexOf('heatwave');assert.ok(heat<0||heat%4===1,`seed ${seed}: a heatwave belongs to summer`)
    deck.forEach(id=>seen.add(id));if(SEASON_EVENTS.slice(0,28).some(event=>!deck.includes(event.id)))variety=true
  }
  assert.equal(seen.size,39,'every card turns up in some game');assert.ok(variety,'no game holds every card')
})

test('saves started before the catalogue grew redraw only the seasons still ahead',()=>{
  let widened=0
  for(let seed=1;seed<=12;seed++){
    const old=createGame(seed);old.eventDeck=createEventDeck(seed);delete old.eventCatalog;old.year=3;old.season=1
    const turn=9,raw=JSON.stringify(old),migrated=migrateSave(JSON.parse(raw))!
    assert.ok(migrated);assert.equal(JSON.stringify(old),raw);assert.equal(migrated.eventCatalog,2)
    assert.deepEqual(migrated.eventDeck!.slice(0,turn+1),old.eventDeck!.slice(0,turn+1),'past seasons and the current one keep their events')
    assert.equal(new Set(migrated.eventDeck).size,28);assert.ok(validateSave(migrated))
    const future=migrated.eventDeck!.slice(turn+1),heat=migrated.eventDeck!.indexOf('heatwave')
    assert.ok(heat<0||heat%4===1)
    if(future.some(id=>ADDED_EVENT_IDS.includes(id!))){widened++;assert.ok(migrated.migrationNotices?.some(notice=>notice.includes('새 선택형 사건')))}
    assert.deepEqual(migrateSave(JSON.parse(JSON.stringify(migrated))),migrated,'the redraw happens once')
  }
  assert.ok(widened>=10,String(widened))
  const late=createGame(4);late.eventDeck=createEventDeck(4);delete late.eventCatalog;late.year=7;late.season=2
  assert.ok(!migrateSave(JSON.parse(JSON.stringify(late)))!.eventDeck!.slice(27).includes('heatwave'),'no summer is left for a heatwave')
  const legacy=createGame(6,true),kept=migrateSave(JSON.parse(JSON.stringify(legacy)))!
  assert.deepEqual(kept.eventDeck,legacy.eventDeck);assert.equal(kept.eventCatalog,undefined,'legacy rules keep the original deck')
  const adopted=adoptRules3(legacy).state
  assert.equal(adopted.eventCatalog,2);assert.equal(adopted.eventDeck![0],legacy.eventDeck![0]);assert.ok(validateSave(adopted))
  assert.equal(validateSave({...createGame(1),eventCatalog:3}),false)
})

test('heatwave, visitors and showcases: trust, reputation, audiences and shared know-how',()=>{
  const base=yogaGame(3,[0,1])
  const heat=[0,1].map(choice=>settle(withEvent(base,'heatwave'),choice))
  assert.equal(report(heat[1]).eventImpact!.trust,3);assert.equal(report(heat[1]).eventImpact!.cost,25)
  near(report(heat[1]).trustChange!-report(heat[0]).trustChange!,3,'the shelter is felt on top of the season');assert.ok(report(heat[0]).eventImpact!.revenue<=0)
  const sister=[0,1].map(choice=>report(settle(withEvent(base,'sister-center'),choice)).eventImpact!)
  assert.equal(sister[0].reputation,.5);assert.equal(sister[1].reputation,2.5);assert.equal(sister[1].cost,25)
  const club=[0,1].map(choice=>settle(withEvent(base,'club-showcase'),choice))
  assert.equal(report(club[0]).eventImpact!.cash,15);assert.equal(report(club[1]).eventImpact!.audience,120);assert.equal(report(club[1]).eventImpact!.trust,1)
  assert.equal(club[1].player.evaluationStats.experienceWeight-club[0].player.evaluationStats.experienceWeight,120)
  assert.ok(report(club[1]).experienceScore>report(club[0]).experienceScore,'a free showcase lifts satisfaction')
  const joint=report(settle(withEvent(base,'joint-event'),1)).eventImpact!
  assert.equal(joint.audience,150);assert.equal(joint.reputation,1);assert.equal(joint.cost,20)
  const visit=[0,1].map(choice=>settle(withEvent(base,'rival-visit'),choice))
  assert.deepEqual(report(visit[1]).eventImpact!.learned,{kind:'culture',gain:12},'the least trained field learns')
  near(visit[1].player.xp.culture-visit[0].player.xp.culture,12);assert.equal(report(visit[0]).eventImpact!.learned,undefined)
  for(const id of ['rival-visit','joint-event','poached-instructor']){
    const game=withEvent(base,id),event=getSeasonEvent(game)!,text=eventText(event.description,game)
    assert.ok(event.description.includes(RIVAL_TOKEN));assert.ok(!text.includes(RIVAL_TOKEN));assert.ok(text.includes(eventRival(game)!.name))
    assert.ok(game.rivals.includes(eventRival(game)!));assert.equal(eventText(event.description,game),text,'the same neighbour every time')
  }
})

test('closures stop a week without marking satisfaction down; a generator keeps the lights on',()=>{
  const base=yogaGame(5,[0,1])
  const [closed,powered]=[0,1].map(choice=>settle(withEvent(base,'blackout'),choice))
  assert.equal(report(closed).eventImpact!.closed,2,'both planned sessions pause');assert.equal(report(powered).eventImpact!.closed,undefined);assert.equal(report(powered).eventImpact!.cost,30)
  assert.ok(report(closed).operationIssues!.some(issue=>issue.reason===EVENT_CLOSURE_REASONS.blackout&&issue.weeks===1))
  assert.ok(report(closed).visits<report(powered).visits);assert.ok(report(closed).classRevenue<report(powered).classRevenue)
  assert.ok(Math.abs(report(closed).experienceScore-report(powered).experienceScore)<4,'a blackout is not counted as a broken promise')
  assert.equal(report(closed).sessions!.find(session=>session.slot===1)!.weeks,report(powered).sessions!.find(session=>session.slot===1)!.weeks-1)
  const filmed=report(settle(withEvent(base,'tv-crew'),1)),declined=report(settle(withEvent(base,'tv-crew'),0))
  assert.equal(filmed.eventImpact!.closed,2,'the busiest room pauses');assert.equal(filmed.eventImpact!.reputation,3)
  assert.ok(filmed.operationIssues!.some(issue=>issue.reason===EVENT_CLOSURE_REASONS['tv-crew']));assert.equal(declined.eventImpact!.closed,undefined)
  const paused={...report(closed),profit:10,reputationChange:1,rank:5,evaluation:undefined,contender:undefined,operationIssues:Array.from({length:14},(_,index)=>({room:'B' as const,slot:index%5,program:'P03' as const,reason:EVENT_CLOSURE_REASONS.blackout,weeks:1,lastWeek:false}))}
  assert.equal(briefingMood(paused),'resolved','weeks lost to a blackout are not the centre\'s own trouble');assert.ok(!seasonBriefing(paused).improve.includes('휴강'))
  assert.equal(briefingMood({...paused,operationIssues:[{room:'B',slot:1,program:'P03',reason:'운영비가 부족한 클래스는 쉬었어요.',weeks:13,lastWeek:true}]}),'worried')
  const empty=report(settle(withEvent(finishRentalReview(createGame(5)),'tv-crew'),1))
  assert.equal(empty.eventImpact!.closed,0,'nothing to pause in an empty timetable')
})

test('a guest lecture runs the largest class hot and a departing instructor runs it cold, whatever the dice say',()=>{
  for(let seed=1;seed<=8;seed++){
    const base=yogaGame(seed)
    const hot=report(settle(withEvent(base,'guest-teacher'),1)),cold=report(settle(withEvent(base,'poached-instructor'),0)),kept=report(settle(withEvent(base,'poached-instructor'),1))
    assert.deepEqual(hot.eventImpact!.featured,{room:'B',slot:1,program:'P03',mood:'hot'});assert.equal(hot.eventImpact!.cost,35)
    assert.equal(hot.sessions!.find(session=>session.room==='B'&&session.slot===1)!.mood,'hot')
    assert.equal(cold.sessions!.find(session=>session.room==='B'&&session.slot===1)!.mood,'cold');assert.equal(cold.eventImpact!.cost,0)
    assert.equal(kept.eventImpact!.featured,undefined);assert.equal(kept.eventImpact!.cost,30);assert.equal(kept.eventImpact!.trust,1)
  }
  const none=report(settle(withEvent(finishRentalReview(createGame(2)),'guest-teacher'),1))
  assert.equal(none.eventImpact!.featured,undefined,'no class, no lecture')
})

test('donated goods restore equipment; an inspection trades a season of training for the books',()=>{
  const worn=yogaGame(7);worn.player.inventory[0]!.condition=60
  const [given,mended]=[0,1].map(choice=>settle(withEvent(worn,'donated-goods'),choice))
  assert.equal(report(given).eventImpact!.reputation,1.5);assert.equal(report(mended).eventImpact!.repaired,1);assert.equal(report(mended).eventImpact!.cost,20)
  near(mended.player.inventory[0]!.condition-given.player.inventory[0]!.condition,15)
  const base=withEvent(yogaGame(7),'inspection'),focused=chooseEventOption(base,1)
  assert.equal(answeredEvent(focused,focused.player)?.noTraining,true);assert.equal(answeredEvent(base,base.player)?.noTraining,undefined)
  assert.match(trainStaff(focused,'sport').error??'',/행정 점검/);assert.equal(trainStaff(base,'sport').error,undefined)
  const trained=trainStaff(base,'sport').state
  assert.ok(eventOptionBlock(trained,1));assert.equal(eventOptionBlock(trained,0),null);assert.equal(chooseEventOption(trained,1),trained,'training already booked rules the paperwork out')
  const [plain,tidy]=[runSeason(base),runSeason(focused)]
  assert.equal(report(tidy).eventImpact!.financial,4);assert.equal(report(tidy).eventImpact!.noTraining,true);assert.equal(tidy.player.evaluationStats.financeBonus,4)
  assert.equal(getEvaluationComponents(tidy.player,3).financial,Math.min(100,getEvaluationComponents(plain.player,3).financial+4))
  assert.ok(validateSave(tidy));const broken=structuredClone(tidy);broken.player.evaluationStats.financeBonus=99;assert.equal(validateSave(broken),false)
})

test('an answer that costs money is paid up front; a centre that cannot pay keeps the first answer',()=>{
  const base=withEvent(yogaGame(7),'sister-center')
  const poor=structuredClone(base);poor.player.cash=poor.player.reserved+5
  assert.match(eventOptionBlock(poor,1)??'',/현금이 모자라요/);assert.equal(eventOptionBlock(poor,0),null);assert.equal(chooseEventOption(poor,1),poor)
  // Chosen while the money was there, then spent before the season ran.
  const chosen=chooseEventOption(base,1),spent=structuredClone(chosen);spent.player.cash=spent.player.reserved+5
  const settled=runSeason(chosen),paid=report(settled),fallen=report(runSeason(spent))
  assert.equal(paid.eventChoice,1);assert.equal(paid.eventImpact!.cost,25);assert.equal(paid.eventImpact!.reputation,2.5)
  near(settled.player.cash-chosen.player.cash,paid.profit,'the cost is counted once')
  assert.equal(fallen.eventChoice,0);assert.equal(fallen.eventImpact!.cost,0);assert.equal(fallen.eventImpact!.reputation,.5,'an empty purse buys no goodwill')
  assert.ok(fallen.warnings.some(warning=>warning.includes('기본 대응')));assert.ok(!paid.warnings.some(warning=>warning.includes('기본 대응')))
  assert.equal(previewSeason(spent).eventChoice,0,'the forecast says so before the season runs')
  // A first answer that costs money is still paid as far as the cash goes.
  const lobby=withEvent(yogaGame(7),'repair');lobby.player.cash=lobby.player.reserved+5
  const patched=report(runSeason(lobby));assert.equal(patched.eventChoice,0);assert.ok(patched.eventImpact!.cost<=15)
  // The generator has to be paid for, or the lights stay off.
  const dark=chooseEventOption(withEvent(yogaGame(5,[0,1]),'blackout'),1);dark.player.cash=dark.player.reserved+5
  assert.equal(report(runSeason(dark)).eventImpact!.closed,2)
})

test('a room close to closing is flagged while there is still time, and the briefing says what to do',()=>{
  // What counts is upkeep and equipment together (70% and 30%): 12 and 60 make about 26, above the closing line of 20.
  const worn=yogaGame(3);worn.player.rooms.find(room=>room.id==='B')!.management=12;worn.player.inventory[0]!.condition=60;worn.player.inventory[0]!.ready=true
  assert.ok(previewSeason(worn).warnings.includes(ROOM_CARE_NOTICE),'the plan check shows it before the season runs')
  assert.ok(report(runSeason(worn)).warnings.includes(ROOM_CARE_NOTICE));assert.ok(!report(runSeason(yogaGame(3))).warnings.includes(ROOM_CARE_NOTICE))
  const closed={...report(runSeason(yogaGame(3))),profit:10,evaluation:undefined,operationIssues:[{room:'B' as const,slot:1,program:'P03' as const,reason:'관리상태가 낮은 공간은 운영을 쉬었어요.',weeks:13,lastWeek:true}]}
  assert.match(seasonBriefing(closed).action,/정비를 예약/)
})

test('forecast and settlement agree on what every new answer does, and saves stay valid',()=>{
  const base=yogaGame(11,[0,1]);base.player.inventory[0]!.condition=70
  for(const id of ADDED_EVENT_IDS)for(const choice of [0,1]){
    const game=chooseEventOption(withEvent(base,id),choice),before=JSON.stringify(game)
    const {revenue:_forecast,...forecast}=previewSeason(game).eventImpact!,done=runSeason(game),{revenue:_settled,...settled}=report(done).eventImpact!
    assert.equal(JSON.stringify(game),before);assert.deepEqual(settled,forecast,`${id} answer ${choice}`)
    assert.equal(report(done).eventChoice,choice);assert.ok(validateSave(done),`${id} answer ${choice}`);assert.ok(validateSave(nextSeason(done)))
    assert.ok(eventImpactNotes(report(done).eventImpact!).every(note=>note.length>0))
  }
  const featured=report(settle(withEvent(base,'guest-teacher'),1)).eventImpact!
  assert.ok(eventImpactNotes(featured).some(note=>note.includes('호조')));assert.deepEqual(eventImpactNotes({id:'rain',cash:0,revenue:0,cost:0,reputation:0}),[])
  const tampered=runSeason(chooseEventOption(withEvent(base,'guest-teacher'),1));tampered.lastReport!.eventImpact!.featured!.mood='warm' as never
  assert.equal(validateSave(tampered),false)
})

test('a class that runs four seasons in a row earns its story, one story a season',()=>{
  assert.deepEqual(storySequence('P01'),['exhibition','new-friend','teacher-letter']);assert.deepEqual(storySequence('P07'),['graduation','new-friend','teacher-letter'])
  assert.deepEqual(storySequence('P03'),['contest','new-friend','teacher-letter']);assert.deepEqual(storySequence('P14'),['contest','new-friend','teacher-letter'])
  assert.deepEqual(storySequence('P06'),['new-friend','teacher-letter'])
  let game=yogaGame(9);const stories:(string|undefined)[]=[]
  for(let season=0;season<13;season++){
    game=runSeason(game)
    assert.ok(report(game).sessions!.some(session=>session.program==='P03'&&session.weeks>=10),`season ${season+1} ran`)
    stories.push(report(game).story?.kind)
    if(report(game).story){
      const story=report(game).story!
      assert.equal(story.program,'P03');assert.equal(story.seasons,season+1);assert.equal(story.trust,STORY_TRUST);assert.ok(story.reputation>0&&story.reputation<=.3,String(story.reputation))
      assert.ok(storyLine(story).includes('요가'));assert.ok(art(STORY_ART[story.kind]))
    }
    assert.ok(validateSave(game));game=finishRentalReview(nextSeason(game))
  }
  assert.deepEqual(stories.map((kind,index)=>kind?`${index+1}:${kind}`:'').filter(Boolean),[`${STORY_EVERY}:contest`,`${STORY_EVERY*2}:new-friend`,`${STORY_EVERY*3}:teacher-letter`])
  assert.deepEqual(game.player.streaks!.P03,{seasons:13,told:3})
  // A season without the class breaks the run; stories already told stay told.
  const paused=structuredClone(game);paused.player.plan.B[1]=null
  assert.deepEqual(runSeason(paused).player.streaks!.P03,{seasons:0,told:3})
  let legacy=finishRentalReview(buyEquipment(createGame(9,true),'E02','B').state)
  for(let season=0;season<5;season++){legacy=runSeason(scheduleClass(legacy,'B',1,'P03').state);assert.equal(report(legacy).story,undefined);if(season<4)legacy=finishRentalReview(nextSeason(legacy))}
  assert.equal(legacy.player.streaks,undefined,'legacy rules have no stories')
  const broken=structuredClone(game);broken.player.streaks!.P03!.seasons=99;assert.equal(validateSave(broken),false)
})

test('two long-running classes take turns: the second story waits a season',()=>{
  // Stretching joins yoga in a free hour of the same room.
  const second=scheduleClass(yogaGame(9),'B',3,'P04');assert.equal(second.error,undefined)
  let game=second.state
  const told:string[]=[]
  for(let season=0;season<6;season++){
    game=runSeason(game);const story=report(game).story;if(story)told.push(`${season+1}:${story.program}`)
    game=finishRentalReview(nextSeason(game))
  }
  const ranBoth=(game.player.streaks!.P03?.seasons??0)>=6&&(game.player.streaks!.P04?.seasons??0)>=6
  if(ranBoth)assert.deepEqual(told,['4:P03','5:P04'],'same streak: programme order decides, the other follows next season')
  else assert.ok(told.length<=2)
})

test('the mid-season meeting sees exactly the first six weeks and its decision shapes the last seven',()=>{
  assert.equal(MIDSEASON_WEEK,6);assert.deepEqual(Object.keys(MIDSEASON_OPTIONS),['steady','promotion','repair'])
  assert.equal(previewMidseason(finishRentalReview(createGame(4,true))),null,'legacy rules run straight through');assert.equal(previewMidseason(createGame(4)),null,'rentals are reviewed first')
  let promotedSeeds=0
  for(let seed=1;seed<=6;seed++){
    const game=yogaGame(seed,[0,1]),before=JSON.stringify(game),brief=previewMidseason(game)!
    assert.equal(JSON.stringify(game),before,'the meeting never changes the plan')
    assert.deepEqual(brief.options.map(option=>[option.id,option.cost,option.affordable]),[['steady',0,true],['promotion',20,true],['repair',30,true]])
    const steady=report(runSeason(game)),promoted=report(runSeason(game,'promotion'))
    const firstHalf=(r:SeasonReport)=>r.weekly.slice(0,MIDSEASON_WEEK)
    near(firstHalf(steady).reduce((sum,week)=>sum+week.revenue,0),brief.revenue,`seed ${seed} revenue`);assert.equal(firstHalf(steady).reduce((sum,week)=>sum+week.visits,0),brief.visits)
    assert.deepEqual(firstHalf(promoted),firstHalf(steady),'nothing changes before the meeting')
    assert.equal(brief.tally.reduce((a,b)=>a+b,0)>0,true);assert.ok(brief.emptySeats>=0&&brief.emptySeats<=brief.classSeats)
    assert.deepEqual(steady.midseason,{choice:'steady',cost:0});assert.equal(promoted.midseason!.choice,'promotion');assert.equal(promoted.midseason!.cost,20)
    assert.equal(promoted.visits-steady.visits,promoted.midseason!.joined,'every newcomer is counted')
    near(promoted.cost-steady.cost,20,'the campaign is the only added cost');if(promoted.midseason!.joined!>0){promotedSeeds++;assert.ok(promoted.classRevenue>steady.classRevenue)}
    assert.ok(midseasonAdvice(brief).length>0);assert.ok(validateSave(runSeason(game,'promotion')))
  }
  assert.ok(promotedSeeds>=4,String(promotedSeeds))
  const worn=yogaGame(2,[0,1]);worn.player.rooms.find(room=>room.id==='B')!.management=50;worn.player.inventory[0]!.condition=60
  const [left,fixed]=[runSeason(worn),runSeason(worn,'repair')]
  assert.equal(report(fixed).midseason!.choice,'repair');assert.ok(report(fixed).midseason!.restored!>=1&&report(fixed).midseason!.restored!<=2);near(report(fixed).cost-report(left).cost,30)
  near(fixed.player.rooms.find(room=>room.id==='B')!.management-left.player.rooms.find(room=>room.id==='B')!.management,25)
  near(fixed.player.inventory[0]!.condition-left.player.inventory[0]!.condition,25)
  // Only the two rooms in the worst state are touched: an emergency fix is no substitute for regular upkeep.
  const open=(game:GameState)=>game.player.rooms.filter(room=>room.open)
  assert.equal(open(fixed).filter((room,index)=>room.management>open(left)[index]!.management+1).length,2)
  assert.ok(previewMidseason(worn)!.lowestRoom!.management<60);assert.equal(previewMidseason(worn)!.wornItems,1)
  const poor=yogaGame(2);poor.player.cash=poor.player.reserved
  assert.equal(previewMidseason(poor)!.options.find(option=>option.id==='promotion')!.affordable,false)
  assert.deepEqual(report(runSeason(poor,'promotion')).midseason,{choice:'steady',cost:0},'a decision the centre cannot pay for is not taken')
  const plan=yogaGame(2);assert.equal(runSeason(plan,'bogus' as never),plan)
  const legacy=scheduleClass(finishRentalReview(buyEquipment(createGame(2,true),'E02','B').state),'B',1,'P03').state
  assert.deepEqual(report(runSeason(legacy,'promotion')),report(runSeason(legacy)));assert.equal(report(runSeason(legacy)).midseason,undefined)
  const tampered=runSeason(plan,'repair');tampered.lastReport!.midseason!.choice='party' as never;assert.equal(validateSave(tampered),false)
})

test('every delivered scene for encounters, the mid-season meeting and stories is in place',()=>{
  for(const path of ['/center/midseason-v1/meeting.webp','/center/midseason-v1/promotion.webp','/center/midseason-v1/repair.webp',...Object.values(STORY_ART)])assert.ok(art(path),path)
  assert.deepEqual(Object.keys(STORY_ART).sort(),['contest','exhibition','graduation','new-friend','teacher-letter'])
})
