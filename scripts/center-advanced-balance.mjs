import {scheduleClass} from '../src/center/classPlacement.ts';
import {contractRoomRemodel,REMODEL_COST} from '../src/center/roomRemodel.ts';
import assert from 'node:assert/strict';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import * as sim from '../src/center/simulation.ts';
import * as facilities from '../src/center/facilityProjects.ts';
const projectRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const args=process.argv.slice(2),options={};
for(let index=0;index<args.length;index+=2){
  const name=args[index],value=args[index+1];
  if(!['--seeds','--seed-start','--label','--output','--strategy','--equipment-slots'].includes(name)||!value||value.startsWith('--'))throw new Error('Use --seeds N --seed-start N --label NAME --output DIRECTORY --strategy ID[,ID].');
  options[name]=value;
}
const seedCount=Number(options['--seeds']??12),seedStart=Number(options['--seed-start']??20261101);
const label=options['--label']??'advanced-classes-current',outputDirectory=path.resolve(options['--output']??path.join(projectRoot,'reports','center-balance'));
if(!Number.isInteger(seedCount)||seedCount<1||seedCount>200||!Number.isSafeInteger(seedStart)||seedStart<0||!Number.isSafeInteger(seedStart+seedCount))throw new Error('Use 1–200 seeds and a nonnegative safe integer seed start.');
if(!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(label))throw new Error('Label must contain only letters, digits, hyphens or underscores.');
const sourceFiles=['src/center/simulation.ts','src/center/classPlacement.ts','src/center/balanceRules.ts','src/center/seasonEvents.ts','src/center/campaign.ts','src/center/facilityProjects.ts','src/center/campusProjects.ts','src/center/roomRemodel.ts'];
const hashes=async()=>Object.fromEntries(await Promise.all(sourceFiles.map(async file=>[file,createHash('sha256').update(await readFile(path.join(projectRoot,file))).digest('hex')])));
const sourceHashes=await hashes(),startedAt=new Date().toISOString();
if(options['--equipment-slots']){const slots=Number(options['--equipment-slots']);assert.equal(slots,4);for(const room of sim.ROOM_DEFINITIONS)room.equipmentSlots=slots;}
const programs=Object.fromEntries(sim.PROGRAMS.map(p=>[p.id,p])),offers=Object.fromEntries(sim.OFFERS.map(o=>[o.id,o]));
const high=sim.PROGRAMS.filter(program=>program.weeklyLimit).map(program=>program.id),coreHigh=['P11','P12','P13'],base=['P01','P02','P03','P04','P06','P07','P09'];
const shared=[['E08','A'],['E10','A']];
const allPolicies=[
  {id:'rent_only',classes:[],gear:shared},
  {id:'pilates_main',classes:['P11'],gear:[['E02','B'],['E11','B'],...shared]},
  {id:'pottery_main',classes:['P12'],gear:[['E01','E'],['E12','E'],...shared]},
  {id:'video_main',classes:['P13'],gear:[['E06B','F'],['E13','F'],...shared]},
  {id:'advanced_public_mix',mixed:true,classes:[...coreHigh,...base],gear:[['E01','E'],['E02','B'],['E02','A'],['E04','A'],['E06B','F'],['E13','F'],['E12','E'],['E11','B'],['E03','A'],...shared]},
  {id:'ordinary_public_mix',mixed:true,classes:base,gear:[['E01','E'],['E02','B'],['E04','B'],['E06','F'],['E05','F'],['E01','A'],['E03','A'],...shared]},
  {id:'musical_main',classes:['P14'],expansion:'C',gear:[['E04','C'],['E07','C'],...shared]},
  {id:'speech_main',classes:['P15'],expansion:'G',gear:[['E05','G'],['E14','G'],...shared]},
  {id:'cycle_main',classes:['P16'],gear:[['E15','B'],['E04','B'],...shared]},
  {id:'orchestra_main',classes:['P17'],expansion:'C',gear:[['E16','C'],['E04','C'],...shared]},
  {id:'stagecraft_main',classes:['P18'],expansion:'C',gear:[['E07','C'],['E17','C'],...shared]},
  {id:'woodwork_main',classes:['P19'],gear:[['E01','E'],['E18','E'],...shared]},
  {id:'debate_main',classes:['P20'],expansion:'G',gear:[['E05','G'],['E19','G'],...shared]},
  {id:'pitching_main',classes:['P21'],expansion:'G',gear:[['E06','G'],['E20','G'],...shared]},
];
allPolicies.push(
  {id:'idle',classes:[],gear:[],noRentals:true},
  {id:'classes_only',mixed:true,noRentals:true,classes:base,gear:[['E01','E'],['E02','B'],['E04','B'],['E06','F'],['E05','F']]},
  {id:'expensive_only',classes:[],expansion:'C',bidIndex:2,gear:[['E01B','A'],['E04B','A'],['E06B','F'],['E13','F'],['E11','B'],['E15','B'],['E12','E'],['E18','E'],...shared]},
  {id:'all_course_mix',mixed:true,classes:sim.PROGRAMS.filter(p=>!sim.isRentalProgram(p.id)).map(p=>p.id),gear:[['E01','A'],['E02','A'],['E04','A'],['E05','A'],['E02','B'],['E04','B'],['E11','B'],['E15','B'],['E01','E'],['E12','E'],['E18','E'],['E06B','F'],['E13','F'],...shared]}
);
allPolicies.push(
{id:'sports_center',mixed:true,classes:['P03','P04','P06','P09','P11','P25','P26','P27'],gear:[['E02','B'],['E11','B'],['E02','A'],['E04','A'],...shared]},
{id:'craft_center',mixed:true,classes:['P01','P02','P06','P12','P22','P23','P34'],gear:[['E01','E'],['E12','E'],['E01','A'],...shared]},
{id:'learning_center',mixed:true,classes:['P06','P07','P13','P29','P35'],gear:[['E06B','F'],['E13','F'],['E06','A'],['E05','A'],...shared]},
{id:'performance_center',mixed:true,expansion:'C',classes:['P06','P14','P17','P28'],gear:[['E04','C'],['E07','C'],['E16','C'],...shared]},
{id:'meeting_center',mixed:true,expansion:'G',classes:['P06','P15','P31','P32','P33'],gear:[['E05','G'],['E14','G'],...shared]}
);
for(const p of [...allPolicies].filter(p=>p.id.endsWith('_center')))allPolicies.push({...p,id:p.id+'_balanced',classes:[...new Set([...p.classes,'P02','P04','P06','P07'])],gear:[...p.gear,['E01','A'],['E02','B'],['E06','F']],remodel:true});
const champion=allPolicies.find(p=>p.id==='advanced_public_mix');allPolicies.push({...champion,id:'balanced_champion',remodel:true,prudent:true});
const requested=options['--strategy']?.split(',')??allPolicies.slice(0,6).map(policy=>policy.id);

for(const p of [...allPolicies].filter(p=>['sports_center','craft_center','learning_center','performance_center','meeting_center','advanced_public_mix'].includes(p.id)))allPolicies.push({...p,id:p.id+'_remodel',remodel:true});
if(requested.some(id=>!allPolicies.some(policy=>policy.id===id)))throw new Error('Unknown strategy.');
const policies=allPolicies.filter(policy=>requested.includes(policy.id));
if(policies.some(policy=>policy.classes.some(id=>!programs[id])||policy.gear.some(([id])=>!offers[id])))throw new Error('The selected specialty is not implemented in the loaded engine yet.');
function invest(state,policy){
  for(const room of state.player.rooms.filter(r=>r.open))if(sim.getRoomManagement(state.player,room.id)<82||state.player.inventory.some(e=>e.room===room.id&&e.ready&&e.condition<45))state=sim.maintainRoom(state,room.id).state;
  if(policy.expansion&&!state.player.rooms.find(room=>room.id===policy.expansion).open){
    if(!facilities.getFacilityProject(state.player,policy.expansion))state=facilities.postFacilityTender(state,policy.expansion).state;
    if(facilities.getFacilityProject(state.player,policy.expansion)?.stage==='announced')state=facilities.collectFacilityBids(state,policy.expansion).state;
    const project=facilities.getFacilityProject(state.player,policy.expansion);
    if(project?.stage==='bidding'){
      const bid=project.bids[policy.bidIndex??1],before=state;
      const result=facilities.awardFacilityContract(state,policy.expansion,bid.id);
      if(!result.error&&sim.freeCash(result.state.player)>=150){
        assert.ok(Math.abs(result.state.player.cash-(before.player.cash-bid.price))<.011);
        assert.ok(Math.abs(result.state.player.reserved-(before.player.reserved+bid.upkeep*(4-state.season)))<.011);
        state=result.state;
      }
    }
  }
  for(const [id,room] of policy.gear){
    const offer=offers[id];
    if(state.player.inventory.some(e=>!e.stored&&(e.room===room||e.room===null)&&offers[e.id].family===offer.family))continue;
    const result=sim.buyEquipment(state,id,room);
    if(!result.error&&sim.freeCash(result.state.player)>=150)state=result.state;
  }
  return state;
}
function planSeason(state,policy){
  const plan=Object.fromEntries(sim.ROOM_IDS.map(room=>[room,[null,null,null,null,null]]));
  const planned={...state.player,plan},demand=sim.getDemand(state),remaining=new Map(demand.map(g=>[g.id,g.people]));
  const lossBudget=Math.max(0,(sim.freeCash(state.player)-180)/13+state.player.rentalRequests.reduce((n,r)=>n+Math.max(0,r.fee-r.cost),0)*.3);let plannedLoss=0;
  for(let step=0;step<20;step++){
    let best;
    for(const room of ['E','B','F','A','D','G','C'])for(const id of policy.classes)for(let slot=0;slot<5;slot++){
      const p=programs[id];if(plan[room][slot]||sim.getProgramPlacementError(planned,room,slot,id))continue;
      let seats=sim.roomCapacity(room,id),attendees=0,utility=0,lost=0;const served=[];
      for(const group of demand){
        if((remaining.get(group.id)??0)<=0||!group.programs.includes(id)||!group.slots.includes(slot)||p.income/p.capacity>group.maxFee+.0001)continue;
        const count=Math.min(seats,remaining.get(group.id)??0);if(!count)continue;
        seats-=count;attendees+=count;served.push([group.id,count]);lost+=(remaining.get(group.id)??0)-count;
        utility+=count*(policy.mixed?(group.public?1.8:.8):.1);
      }
      if(!attendees)continue;
      const net=attendees*p.income/p.capacity-p.cost;
      if(policy.prudent&&plannedLoss+Math.max(0,-net)>lossBudget)continue;
      utility+=net*(policy.mixed?.25:1)-lost*1.5;
      if(!policy.mixed&&net<0)continue;
      if(!best||utility>best.utility)best={room,slot,id,utility,served,net};
    }
    if(!best)break;
    plan[best.room][best.slot]=best.id;plannedLoss+=Math.max(0,-best.net);
    for(const [id,count] of best.served)remaining.set(id,remaining.get(id)-count);
  }
  for(const request of [...(policy.noRentals?[]:state.player.rentalRequests)].sort((a,b)=>(b.fee-b.cost)-(a.fee-a.cost)||a.id.localeCompare(b.id))){
    if(plan[request.room][request.slot])continue;
    const result=sim.decideRental(state,request.id,'accepted');if(result.error)continue;
    state=result.state;
  }
  state=sim.finishRentalReview(state);
  for(const room of sim.ROOM_IDS)for(let slot=0;slot<5;slot++)if(plan[room][slot]){
    const id=plan[room][slot];let placement=scheduleClass(state,room,slot,id);if(placement.error)for(const alternative of policy.classes.filter(p=>p!==id)){const retry=scheduleClass(state,room,slot,alternative);if(!retry.error){placement=retry;break;}}state=placement.state;
  }
  return state;
}
let checks=0;
function check(value,message){checks++;assert.ok(value,message);}
function run(policy,seed){
  let state=sim.createGame(seed),shortages=0,forecastWarnings=0,highSeasons=0,firstHigh=null;
  const turns=[],construction={room:policy.expansion??null,contractedTurn:null,completedTurn:null,bid:null},maximumWeeklyActual={};check(state.player.cash===1080&&state.player.reserved===320,'same initial funds');
  for(let turn=1;turn<=sim.MAX_TURNS;turn++){
    for(const room of sim.ROOM_IDS)for(let slot=0;slot<5;slot++)if(state.player.plan[room][slot])state=sim.setProgram(state,room,slot,null);
    state=invest(state,policy);
    if(policy.expansion){const project=facilities.getFacilityProject(state.player,policy.expansion);if(project?.stage==='construction'&&construction.contractedTurn===null){construction.contractedTurn=turn;construction.bid=project.bids.find(bid=>bid.id===project.selectedBidId);}}
    state=planSeason(state,policy);
    if(policy.remodel&&state.year>=5){const target=state.player.rooms.filter(r=>r.open&&!r.remodel&&state.player.plan[r.id].some(Boolean)).sort((a,b)=>state.player.plan[b.id].filter(Boolean).length-state.player.plan[a.id].filter(Boolean).length)[0];if(target&&sim.freeCash(state.player)-REMODEL_COST[target.id]>=1800)state=contractRoomRemodel(state,target.id).state;}
    const forecast=sim.previewSeason(state);if(forecast.warnings.some(w=>w.includes('운영비가 부족')))forecastWarnings++;
    const demand=sim.getDemand(state);state=sim.runSeason(state);
    check(sim.validateSave(state),'valid completed save');
    if(policy.expansion&&facilities.getFacilityProject(state.player,policy.expansion)?.stage==='complete'&&construction.completedTurn===null){
      construction.completedTurn=turn;check(turn===construction.contractedTurn+Math.floor((construction.bid.weeks-1)/13),'construction completion matches actual funded contract');
    }
    for(const inst of [state.player,...state.rivals]){
      check(inst.cash>=inst.reserved&&inst.reserved>=0,'reserve protected');
      for(const id of high)check(sim.getProgramWeeklyCount(inst,id)<=2,'program centerwide weekly limit');
      check(inst.inventory.filter(e=>e.stored).every(e=>e.room===null&&!e.ready),'stored state valid');
    }
    const report=state.lastReport;
    if(report.warnings.some(w=>w.includes('운영비가 부족')))shortages++;
    const activity=report.activity.filter(a=>high.includes(a.program));
    if(activity.length){highSeasons++;firstHigh??=turn;}
    for(const id of high){
      const sessions=activity.filter(a=>a.program===id);
      maximumWeeklyActual[id]=Math.max(maximumWeeklyActual[id]??0,sessions.length);
      check(sessions.length<=programs[id].weeklyLimit,'actual weekly high class count');
      for(const session of sessions)check(sim.roomSupportsProgram(session.room,id),'actual specialty respects room purpose');
      check(sessions.reduce((sum,a)=>sum+a.attendees,0)<=demand.filter(g=>g.programs.includes(id)).reduce((sum,g)=>sum+g.people,0),'no demand duplicated between rooms or slots');
    }
    turns.push({turn,plan:structuredClone(state.player.plan),equipment:state.player.inventory.map(e=>({id:e.id,room:e.room,ready:e.ready})),remodeledRooms:state.player.rooms.filter(r=>r.remodel?.remainingWeeks===0).map(r=>r.id),classRevenue:report.classRevenue,rentalRevenue:report.rentalRevenue,operatingCost:report.cost,score:state.player.score,cash:state.player.cash,high:activity.map(a=>({program:a.program,room:a.room,slot:a.slot,attendees:a.attendees})),evaluation:report.evaluation??null});
    const current=state;state=sim.nextSeason(state);
    for(const inst of [state.player,...state.rivals]){
      const old=[current.player,...current.rivals].find(i=>i.id===inst.id);
      const expected=state.phase!=='ending'&&state.season===0?old.annualBudget+(state.year===sim.MAX_YEARS?sim.FINAL_YEAR_BONUS:0):0;
      check(Math.abs(inst.cash-old.cash-expected)<.02,'annual budget and final-year bonus paid exactly once');
    }
  }
  check(state.phase==='ending'&&state.year===sim.MAX_YEARS,'28-turn ending');
  check(state.player.evaluations.length===4,'four evaluations');
  if(policy.expansion&&policy.classes.length){check(construction.completedTurn!==null,'locked specialty room completed through tender');check(firstHigh>construction.completedTurn,'class starts only after opening and equipment installation');}
  if(policy.classes.length===1&&programs[policy.classes[0]].weeklyLimit)check(maximumWeeklyActual[policy.classes[0]]>=1,'selected specialty actually operated');
  return {strategy:policy.id,seed,score:sim.finalScore(state.player),rank:sim.getFinalRank(state),cash:state.player.cash,public:state.player.publicScore,satisfaction:state.player.experienceScore,reputation:state.player.reputation,shortages,forecastWarnings,highSeasons,firstHigh,remodeledRooms:state.player.rooms.filter(r=>r.remodel?.remainingWeeks===0).length,construction,maximumWeeklyActual,turns,rivals:state.rivals.map(inst=>({id:inst.id,score:sim.finalScore(inst),rank:sim.getFinalRank(state,inst.id),cash:inst.cash,highEquipment:inst.inventory.filter(e=>['E06B',...Array.from({length:10},(_,i)=>`E${i+11}`)].includes(e.id)).map(e=>({id:e.id,room:e.room,stored:e.stored??false}))}))};
}
const rows=[],started=Date.now();
for(const policy of policies){for(let seed=seedStart;seed<seedStart+seedCount;seed++)rows.push(run(policy,seed));console.log(`${policy.id}: ${seedCount} full games done`);}
const average=(data,key)=>Math.round(data.reduce((sum,row)=>sum+row[key],0)/data.length*100)/100;
const summary=policies.map(policy=>{const data=rows.filter(r=>r.strategy===policy.id);return {strategy:policy.id,score:average(data,'score'),rank:average(data,'rank'),wins:data.filter(r=>r.rank===1).length,top3:data.filter(r=>r.rank<=3).length,cash:average(data,'cash'),public:average(data,'public'),satisfaction:average(data,'satisfaction'),reputation:average(data,'reputation'),shortageSeasons:average(data,'shortages'),forecastWarnings:average(data,'forecastWarnings'),highSeasons:average(data,'highSeasons'),firstHighRange:[Math.min(...data.map(r=>r.firstHigh??0)),Math.max(...data.map(r=>r.firstHigh??0))]};});
const endingHashes=await hashes();
const output={label,startedAt,finishedAt:new Date().toISOString(),sourceHashes,equipmentSlotsOverride:options['--equipment-slots']??null,sourceUnchangedDuringRun:JSON.stringify(sourceHashes)===JSON.stringify(endingHashes),seedStart,seedCount,games:rows.length,seasons:rows.length*sim.MAX_TURNS,checks,elapsedSeconds:(Date.now()-started)/1000,limitations:['Greedy planning uses only visible demand; not proof of optimal human play.','Core six policies keep four starting rooms; C/G specialty policies fund their room with the ordinary balanced construction bid. No campus projects or staff training.','Purchases retain 150 free cash; remaining forecast warnings are observed, not automatically repaired.','Classes-only and idle reject all rentals; remaining strategies approve available profitable rentals.'],summary,rows};
await mkdir(outputDirectory,{recursive:true});
const outputPath=path.join(outputDirectory,`${label}.json.gz`);
await writeFile(outputPath,gzipSync(Buffer.from(JSON.stringify(output,null,2)+'\n'),{level:9}));
console.log(JSON.stringify({outputPath,sourceUnchangedDuringRun:output.sourceUnchangedDuringRun,games:output.games,seasons:output.seasons,checks,seconds:output.elapsedSeconds,summary},null,2));
