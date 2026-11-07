import {contractRoomRemodel,REMODEL_COST} from '../src/center/roomRemodel.ts';
import {scheduleClass} from '../src/center/classPlacement.ts';
/** Reproducible adversarial playthroughs. Bots use the same public actions as the UI. */
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sim from '../src/center/simulation.ts';
import * as facilities from '../src/center/facilityProjects.ts';
import * as campus from '../src/center/campusProjects.ts';

export const STRATEGIES = [
  { id:'thoughtful_balanced', name:'균형 성장 · 수요·안내·운영비·시설 개선', classes:'mixed', rent:true, care:true, price:'standard', guide:'welcome', operatingBuffer:200, auditPreview:true, remodel:true, budgeted:true, perfect:true, train:true },
  { id:'thoughtful_premium', name:'균형 성장 · 숙련 강좌 재투자', classes:'mixed', rent:true, care:true, price:'premium', guide:'welcome', operatingBuffer:200, auditPreview:true, remodel:true, budgeted:true, train:true },
  { id:'careful_standard', name:'성실 운영 · 표준요금·안내·정비', classes:'mixed', rent:true, care:true, guide:'welcome', operatingBuffer:150, auditPreview:true, budgeted:true },
  { id:'idle', name:'아무것도 하지 않기', classes:'none' },
  { id:'community_spam', name:'무료 생활안전 교실 전칸 반복', classes:'community' },
  { id:'rent_only', name:'대관만 · 정비 포함', rent:true, care:true, classes:'none' },
  { id:'rent_perfect', name:'대관만 · 매턴 완벽 정비', rent:true, care:true, perfect:true, classes:'none' },
  { id:'rent_overload', name:'대관 전부 승인 · 정비 무시', rent:true, overload:true, classes:'none' },
  { id:'luxury_idle', name:'고급 시설만 짓고 방치', expansion:2, classes:'none' },
  { id:'cheap_rent', name:'저가 확장 + 대관만', expansion:0, rent:true, care:true, classes:'none' },
  { id:'luxury_rent', name:'고급 확장 + 대관만', expansion:2, rent:true, care:true, classes:'none' },
  { id:'class_spam', name:'유료 클래스 전칸 반복', classes:'spam', care:true },
  { id:'free_spam', name:'무료 클래스 전칸 반복', classes:'free-spam', care:true },
  { id:'paid_only', name:'수요 맞춤 유료 클래스만', classes:'paid', care:true },
  { id:'public_mix', name:'무료 공익수업 + 남는칸 대관', classes:'public', rent:true, care:true },
  { id:'paid_mix', name:'유료 수업 + 남는칸 대관', classes:'paid', rent:true, care:true },
  { id:'mixed_noexpand', name:'확장 없는 혼합 운영', classes:'mixed', rent:true, care:true },
  { id:'mixed_discount', name:'혼합 운영 · 할인 요금', classes:'mixed', rent:true, care:true, price:'discount' },
  { id:'mixed_premium', name:'혼합 운영 · 고급 요금', classes:'mixed', rent:true, care:true, price:'premium' },
  { id:'mixed_fast', name:'혼합 운영 · 빠른 접수', classes:'mixed', rent:true, care:true, guide:'fast' },
  { id:'mixed_welcome', name:'혼합 운영 · 주민 안내', classes:'mixed', rent:true, care:true, guide:'welcome' },
  { id:'cheap_mix', name:'저가 확장 + 혼합 운영', expansion:0, classes:'mixed', rent:true, care:true },
  { id:'balanced_mix', name:'중간 확장 + 혼합 운영', expansion:1, classes:'mixed', rent:true, care:true },
  { id:'luxury_mix', name:'고급 확장 + 혼합 운영', expansion:2, classes:'mixed', rent:true, care:true },
  { id:'campus_mix', name:'혼합 운영 + 정원·외관 중간 시공', expansion:1, classes:'mixed', rent:true, care:true, campus:1 },
  { id:'campus_luxury', name:'혼합 운영 + 정원·외관 고급 시공', expansion:2, classes:'mixed', rent:true, care:true, campus:2 },
  { id:'campus_allin', name:'고급 건물·조경 몰빵 + 대관만', expansion:2, classes:'none', rent:true, campus:2, allin:true },
  { id:'recover_after4', name:'첫 4턴 방치 후 할인 혼합으로 회복', classes:'mixed', rent:true, care:true, price:'discount', recoveryAfter:4 },
  { id:'recover_after8', name:'첫 8턴 방치·하위평가 후 할인 혼합 회복', classes:'mixed', rent:true, care:true, price:'discount', recoveryAfter:8 },
  { id:'recover_free8', name:'첫 8턴 무료수업 몰빵 후 할인 혼합 회복', classes:'mixed', rent:true, care:true, price:'discount', recoveryAfter:8, opening:'free-spam' },
];
export const CAUTIOUS_STRATEGY={id:'mixed_discount_buffer',name:'할인 혼합 · 예상적자와 80만원 여유를 남기는 구매',classes:'mixed',rent:true,care:true,price:'discount',operatingBuffer:80,auditPreview:true};
const roomOrder = ['E','B','F','A','D','G','C'];
const classIds = ['P01','P02','P03','P04','P06','P07','P09'];
const byProgram = Object.fromEntries(sim.PROGRAMS.map(item=>[item.id,item]));
const byOffer = Object.fromEntries(sim.OFFERS.map(item=>[item.id,item]));
const money = n => Math.round(n*100)/100;

function maintain(state, perfect=false) {
  for (const room of state.player.rooms.filter(r=>r.open)) {
    if (sim.getRoomManagement(state.player,room.id)<(perfect?100:75) || state.player.inventory.some(e=>e.room===room.id&&e.condition<45))
      state=sim.maintainRoom(state,room.id).state;
  }
  return state;
}
function investCampus(state,policy) {
  if(policy.campus===undefined)return state;
  const id=(policy.campusOrder??['garden','facade','plaza']).find(id=>!campus.isCampusProjectBundled(state.player,id)&&campus.getCampusProject(state.player,id)?.stage!=='complete');
  if(!id)return state;
  if(!campus.getCampusProject(state.player,id))state=campus.postCampusTender(state,id).state;
  if(campus.getCampusProject(state.player,id)?.stage==='announced')state=campus.collectCampusBids(state,id).state;
  const project=campus.getCampusProject(state.player,id);
  if(project?.stage==='bidding'){
    const bid=project.bids[policy.campus];
    if(sim.freeCash(state.player)-bid.price-bid.upkeep*(4-state.season)>=(policy.allin?0:350))state=campus.awardCampusContract(state,id,bid.id).state;
  }
  return state;
}
function invest(state, policy) {
  if (policy.price) state=sim.setPriceMode(state,policy.price);
  if (policy.guide) {
    if (!state.player.inventory.some(e=>byOffer[e.id].family==='guide')) state=sim.buyEquipment(state,'E10','A').state;
    state=sim.setGuideMode(state,policy.guide);
  }
  // No future seed/hidden bid quality access: vendor chosen from published price tier.
  if (policy.expansion!==undefined) for (const room of ['C','D','G']) {
    if (state.player.rooms.find(r=>r.id===room).open) continue;
    if (!facilities.getFacilityProject(state.player,room)) state=facilities.postFacilityTender(state,room).state;
    if (facilities.getFacilityProject(state.player,room)?.stage==='announced') state=facilities.collectFacilityBids(state,room).state;
    const project=facilities.getFacilityProject(state.player,room);
    if (project?.stage==='bidding'){const result=facilities.awardFacilityContract(state,room,project.bids[policy.expansion].id);if(!policy.budgeted||sim.freeCash(result.state.player)>=500)state=result.state;}
    // Each strategy invests in C, then D, then G; no free unlocks.
    if (facilities.getFacilityProject(state.player,room)?.stage==='bidding') break;
  }
  if(policy.train&&sim.freeCash(state.player)>300){const kind=['culture','sport','event'].filter(k=>state.player.xp[k]>0&&sim.getLevel(state.player.xp[k])<5).sort((a,b)=>state.player.xp[a]-state.player.xp[b])[0];if(kind)state=sim.trainStaff(state,kind).state;}
  if (['none','community'].includes(policy.classes)) return state;
  const gear=[['E01','E'],['E02','B'],['E06','F'],['E05','F'],['E04','B'],['E01','A']];
  if(policy.train)gear.push(['E08','A'],['E09','A'],['E09','E'],['E09','F']);
  if (policy.classes.endsWith('spam')) for (const room of state.player.rooms.filter(r=>r.open)) gear.push(['E01',room.id],['E02',room.id]);
  for (const [id,room] of gear) {
    if (state.player.inventory.some(e=>e.room===room&&byOffer[e.id].family===byOffer[id].family)) continue;
    const purchase=sim.buyEquipment(state,id,room);
    if(purchase.error)continue;
    if(policy.operatingBuffer){
      const forecast=sim.previewSeason(prepareSeason(purchase.state,policy));
      if(sim.freeCash(purchase.state.player)<policy.operatingBuffer+Math.max(0,-forecast.profit)||forecast.warnings.some(message=>message.includes('운영비가 부족')))continue;
    }
    state=purchase.state;
  }
  return state;
}
function makePlan(state, policy) {
  const plan=Object.fromEntries(sim.ROOM_IDS.map(id=>[id,Array(5).fill(null)]));
  const allowed=classIds.filter(id=>{
    if (policy.classes==='none') return false;
    if (policy.classes==='community') return id==='P06';
    if (policy.classes==='paid'||policy.classes==='spam') return byProgram[id].income>0;
    if (policy.classes==='public'||policy.classes==='free-spam') return byProgram[id].income===0;
    return true;
  });
  if (policy.classes==='community'||policy.classes.endsWith('spam')) {
    for (const room of roomOrder) for (let slot=0;slot<5;slot++) plan[room][slot]=allowed.find(id=>sim.canRunProgram(state.player,room,id))??null;
    return plan;
  }
  // Greedy marginal demand coverage, using only the demand list visible to a player.
  // Multiple groups may share one class. A group is not counted twice for planning.
  const demand=sim.getDemand(state), remaining=new Map(demand.map(g=>[g.id,g.people]));

  const rentMargin=state.player.rentalRequests.reduce((sum,r)=>sum+Math.max(0,r.fee-r.cost),0)*.35;
  const lossBudget=Math.max(0,(sim.freeCash(state.player)-(policy.operatingBuffer??150))/13+rentMargin);let plannedLoss=0;
  const candidates=roomOrder.flatMap(room=>allowed.filter(id=>sim.canRunProgram(state.player,room,id)).map(id=>({room,id})));
  for (let step=0;step<20;step++) {
    let best=null;
    for (const {room,id} of candidates) for (let slot=0;slot<5;slot++) {
      const p=byProgram[id];
      if (plan[room][slot]) continue;
      let seats=sim.roomCapacity(room,id), utility=0;
      const served=[];
      for (const g of demand) {
        const multiplier=state.player.priceMode==='discount'?.85:state.player.priceMode==='premium'&&p.kind!=='community'&&sim.getLevel(state.player.xp[p.kind])>=2?1.15:1;
        if (!g.programs.includes(id)||!g.slots.includes(slot)||p.income/p.capacity*multiplier>g.maxFee+.0001) continue;
        const count=Math.min(seats,remaining.get(g.id));
        if (!count) continue;
        seats-=count;served.push([g.id,count]);utility+=count*(g.public?1.4:1);
      }
      // Avoid redundant classes with no attendance; public and paid goals differ.
      if (policy.classes==='mixed') utility+=served.reduce((sum,entry)=>sum+entry[1],0)*p.income/p.capacity*.12;
      const net=served.reduce((n,x)=>n+x[1],0)*p.income/p.capacity*(state.player.priceMode==='discount'?.85:1)-p.cost;
      if(policy.budgeted&&plannedLoss+Math.max(0,-net)>lossBudget)continue;
      if(policy.budgeted)utility-=Math.max(0,...state.player.rentalRequests.filter(r=>r.room===room&&r.slot===slot).map(r=>r.fee-r.cost))*.35;
      if (served.length&&(!best||utility>best.utility)) best={room,slot,id,utility,served,net};
    }
    if (!best) break;
    plan[best.room][best.slot]=best.id;plannedLoss+=Math.max(0,-best.net);
    for (const [id,count] of best.served) remaining.set(id,remaining.get(id)-count);
  }
  return plan;
}
function prepareSeason(state,policy){
  const plan=makePlan(state,policy);
  if(policy.rent)for(const request of [...state.player.rentalRequests].sort((a,b)=>(b.fee-b.cost)-(a.fee-a.cost)||a.id.localeCompare(b.id))){
    const needed=byProgram[request.program].support;
    if(plan[request.room][request.slot])continue;
    const result=sim.decideRental(state,request.id,'accepted');
    if(!result.error){state=result.state;}
  }
  state=sim.finishRentalReview(state);
  for(const room of sim.ROOM_IDS)for(let slot=0;slot<5;slot++)if(plan[room][slot])state=scheduleClass(state,room,slot,plan[room][slot]).state;
  return state;
}
export function runBot(policy,seed) {
  let state=sim.createGame(seed);
  let minCash=state.player.cash, liquiditySeasons=0, shortageSeasons=0, overloadSeasons=0;
  let rentalRevenue=0,classRevenue=0,classCost=0,rentalCost=0;
  const years=[],seasons=[],grants=[{year:1,amount:sim.BASE_ANNUAL_BUDGET}], rivalGrants=Object.fromEntries(state.rivals.map(inst=>[inst.id,[{year:1,amount:sim.BASE_ANNUAL_BUDGET}]]));
  const projectTimings=new Map();
  const projects=()=>[
    ...state.player.facilityProjects.map(project=>({key:'facility-'+project.room,project})),
    ...state.player.campusProjects.map(project=>({key:'campus-'+project.id,project})),
  ];
  let invariantChecks=0;
  const check=(condition,message)=>{invariantChecks++;if(!condition)throw new Error(`${message}: ${policy.id}/${seed}/${state.year}/${state.season}`);};
  for (let turn=0;turn<sim.MAX_TURNS;turn++) {
    const activePolicy=policy.recoveryAfter&&turn<policy.recoveryAfter?{classes:policy.opening??'none',care:policy.opening==='free-spam'}:policy;
    // Clear only last season's class plan through legal UI actions.
    for (const room of sim.ROOM_IDS) for(let slot=0;slot<5;slot++) if(state.player.plan[room][slot]) state=sim.setProgram(state,room,slot,null);
    if (activePolicy.care) state=maintain(state,activePolicy.perfect);
    const cashBeforeInvest=state.player.cash,freeBeforeInvest=sim.freeCash(state.player);
    state=invest(state,activePolicy);
    state=investCampus(state,activePolicy);
    for(const {key,project} of projects())if(project.stage==='construction'&&!projectTimings.has(key)){
      const bid=project.bids.find(item=>item.id===project.selectedBidId);
      projectTimings.set(key,{id:key,announcedTurn:(project.announcedYear-1)*4+project.announcedSeason+1,startedTurn:turn+1,weeks:bid.weeks,price:bid.price,upkeep:bid.upkeep,vendor:bid.vendor,expected:facilities.expectedConstructionCompletion(state,project.remainingWeeks),completedTurn:null});
    }
    const purchaseSpend=money(cashBeforeInvest-state.player.cash),freeAfterInvest=sim.freeCash(state.player);
    state=prepareSeason(state,activePolicy);
    if(activePolicy.remodel&&state.year>=4){
      const target=state.player.rooms.filter(r=>r.open&&!r.remodel&&state.player.plan[r.id].some(Boolean)).sort((a,b)=>state.player.plan[b.id].filter(id=>id&&!sim.isRentalProgram(id)).length-state.player.plan[a.id].filter(id=>id&&!sim.isRentalProgram(id)).length)[0];
      if(target&&sim.freeCash(state.player)>REMODEL_COST[target.id]+600)state=contractRoomRemodel(state,target.id).state;
    }
    const forecast=policy.auditPreview?sim.previewSeason(state):null;
    state=sim.runSeason(state);
    for(const {key,project} of projects())if(project.stage==='complete'&&projectTimings.has(key)&&projectTimings.get(key).completedTurn===null){
      const timing=projectTimings.get(key);timing.completedTurn=turn+1;
      check(timing.completedTurn===timing.expected.turn,'Actual construction completion matches published timing');
    }
    check(state.phase==='review'&&sim.validateSave(state),'Invalid review state');
    check(state.history.length===turn+1,'Settlement count');
    const report=state.lastReport;
    check(Boolean(report.evaluation)===sim.isEvaluationSeason(state),'Evaluation calendar');
    check(sim.runSeason(state)===state,'Duplicate settlement guard');
    for(const inst of [state.player,...state.rivals]){
      check(Number.isFinite(inst.cash)&&inst.cash>=0&&inst.reserved>=0&&inst.reserved<=inst.cash+.01,'Solvency');
      check(inst.history.length===turn+1,'Independent institution simulation');
      check(inst.evaluations.length===Math.floor((turn+1)/(sim.EVALUATION_INTERVAL*4))+(turn+1===sim.MAX_TURNS&&sim.MAX_YEARS%sim.EVALUATION_INTERVAL!==0?1:0),'Evaluation count');
      check(inst.inventory.every(e=>!e.room||sim.roomSupportsOffer(e.room,e.id)),'Legal new equipment');
    }
    rentalRevenue+=report.rentalRevenue;classRevenue+=report.classRevenue;classCost+=report.classCost;rentalCost+=report.rentalCost;
    minCash=Math.min(minCash,state.player.cash);
    if(sim.freeCash(state.player)<1) liquiditySeasons++;
    if(report.warnings.some(s=>s.includes('운영비가 부족'))) shortageSeasons++;
    if(report.warnings.some(s=>s.includes('인력이 부족'))) overloadSeasons++;
    if(report.annual) years.push({year:state.year,score:state.player.score,cash:state.player.cash,reputation:state.player.reputation,campusTier:campus.campusTier(state.player),annualBudget:state.player.annualBudget,evaluation:report.evaluation??null});
    const settled=state,next=sim.nextSeason(state),newYear=next.phase==='planning'&&next.year!==settled.year;
    for(const inst of [settled.player,...settled.rivals]){
      const after=inst.id===next.player.id?next.player:next.rivals.find(r=>r.id===inst.id);
      const actualGrant=money(after.cash-inst.cash),expected=newYear?inst.annualBudget+(next.year===sim.MAX_YEARS?sim.FINAL_YEAR_BONUS:0):0;
      check(Math.abs(actualGrant-expected)<.011,'Grant amount and once-per-year timing');
      if(newYear){if(inst.id===state.player.id)grants.push({year:next.year,amount:actualGrant});else rivalGrants[inst.id].push({year:next.year,amount:actualGrant});}
    }
    seasons.push({turn:turn+1,year:settled.year,season:settled.season,score:report.score,rank:report.rank,cash:settled.player.cash,freeCash:sim.freeCash(settled.player),reputation:settled.player.reputation,annualBudget:settled.player.annualBudget,evaluation:report.evaluation??null,grantReceived:money(next.player.cash-settled.player.cash),purchaseSpend,freeBeforeInvest,freeAfterInvest,warnings:report.warnings,forecast:forecast?{profit:forecast.profit,warnings:forecast.warnings,afterCash:forecast.afterCash}:null});
    check(sim.validateSave(next),'Invalid transitioned state');
    check(sim.nextSeason(next)===next,'Duplicate calendar advance guard');
    state=next;
  }
  check(state.phase==='ending'&&state.year===sim.MAX_YEARS&&state.season===3,'Seven-year ending');
  check(grants.length===sim.MAX_YEARS&&state.history.reduce((sum,report)=>sum+report.weekly.length,0)===sim.MAX_TURNS*13,'Weeks and grants');
  check(state.player.evaluations.every(e=>e.measuredSeasons===(e.year===sim.MAX_YEARS?4:8)&&!e.partial),'Complete evaluation evidence');
  const score=sim.finalScore(state.player);
  const rank=sim.getFinalRank(state),evaluations=structuredClone(state.player.evaluations);
  return {strategy:policy.id,seed,score,rank,award:sim.getAwardForRank(rank),evaluations,grants,seasons,invariantChecks,projectTimings:[...projectTimings.values()],campusExteriorKey:campus.campusExteriorKey(state.player),
    firstEvaluationRank:evaluations[0].rank,lastEvaluationRank:evaluations.at(-1).rank,rankRecovery:evaluations[0].rank-evaluations.at(-1).rank,
    cash:money(state.player.cash),minCash:money(minCash),publicScore:state.player.publicScore,experience:state.player.experienceScore,
    reputation:state.player.reputation,openRooms:state.player.rooms.filter(r=>r.open).length,campusTier:campus.campusTier(state.player),liquiditySeasons,shortageSeasons,overloadSeasons,
    rentalRevenue:money(rentalRevenue),rentalCost:money(rentalCost),classRevenue:money(classRevenue),classCost:money(classCost),years,
    rivals:state.rivals.map(inst=>({id:inst.id,rank:sim.getFinalRank(state,inst.id),score:sim.finalScore(inst),cash:inst.cash,evaluations:inst.evaluations,grants:rivalGrants[inst.id]}))};
}
const avg=(rows,key)=>money(rows.reduce((n,r)=>n+r[key],0)/rows.length);
export function summarize(rows,policies=STRATEGIES) {
  return policies.map(policy=>{
    const data=rows.filter(r=>r.strategy===policy.id);
    return {strategy:policy.id,name:policy.name,runs:data.length,meanScore:avg(data,'score'),minScore:Math.min(...data.map(r=>r.score)),maxScore:Math.max(...data.map(r=>r.score)),
      meanRank:avg(data,'rank'),winRate:money(data.filter(r=>r.rank===1).length/data.length*100),top3Rate:money(data.filter(r=>r.rank<=3).length/data.length*100),
      meanFirstEvaluationRank:avg(data,'firstEvaluationRank'),meanLastEvaluationRank:avg(data,'lastEvaluationRank'),meanRankRecovery:avg(data,'rankRecovery'),
      meanCash:avg(data,'cash'),meanPublic:avg(data,'publicScore'),meanReputation:avg(data,'reputation'),meanCampusTier:avg(data,'campusTier'),
      shortageRate:money(data.filter(r=>r.shortageSeasons>0).length/data.length*100),meanShortageSeasons:avg(data,'shortageSeasons'),meanOverloadSeasons:avg(data,'overloadSeasons')};
  });
}
function main() {
  const args=process.argv.slice(2), option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
  const count=Number(option('--seeds','12')),start=Number(option('--seed-start','20261101'));
  if(!Number.isInteger(count)||count<1||count>200||!Number.isInteger(start)) throw new Error('Use 1–200 integer seeds.');
  const label=option('--label','current'), output=path.resolve(option('--output','reports/center-balance'));
  const requested=option('--strategy','all'),policies=requested==='all'?STRATEGIES:[...STRATEGIES,CAUTIOUS_STRATEGY].filter(policy=>requested.split(',').includes(policy.id));
  if(!policies.length)throw new Error('Unknown strategy');
  const sourceFiles=['src/center/simulation.ts','src/center/classPlacement.ts','src/center/balanceRules.ts','src/center/campaign.ts','src/center/seasonEvents.ts','src/center/facilityProjects.ts','src/center/campusProjects.ts'];
  const hashSources=()=>Object.fromEntries(sourceFiles.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
  const sourceHashes=hashSources();
  const started=Date.now(),rows=[];
  for (const policy of policies) {
    for(let index=0;index<count;index++) rows.push(runBot(policy,start+index));
    console.log(`${policy.id}: ${count} full games completed`);
  }
  const summary=summarize(rows,policies),result={label,rules:'seven-year-28-events-ui-placement',sourceHashes,sourceUnchangedDuringRun:JSON.stringify(sourceHashes)===JSON.stringify(hashSources()),policies,years:sim.MAX_YEARS,turns:sim.MAX_TURNS,evaluationIntervalYears:sim.EVALUATION_INTERVAL,weights:sim.EVALUATION_COMPONENTS,seedStart:start,seedCount:count,strategies:policies.length,games:rows.length,seasons:rows.length*sim.MAX_TURNS,invariantChecks:rows.reduce((sum,row)=>sum+row.invariantChecks,0),elapsedSeconds:money((Date.now()-started)/1000),summary,runs:rows};
  fs.mkdirSync(output,{recursive:true});
  fs.writeFileSync(path.join(output,`${label}.json`),JSON.stringify(result,null,2)+'\n');
  const columns=Object.keys(summary[0]);
  fs.writeFileSync(path.join(output,`${label}.csv`),'\uFEFF'+columns.join(',')+'\n'+summary.map(row=>columns.map(k=>JSON.stringify(row[k])).join(',')).join('\n')+'\n');
  const md=[`# 경영 밸런스 자동 검증: ${label}`,'',`${rows.length}게임 · ${count}개 시드 · 게임당 ${sim.MAX_YEARS}년/${sim.MAX_TURNS}계절. 시드 ${start}–${start+count-1}.`,'',
    `2·4·6·7년 종합평가와 지원금 조정 적용. 총 ${result.seasons}계절, ${result.invariantChecks}회 상태·예산·진행 불변식 확인. 기존 5년 보고서와 수치를 직접 비교하지 않습니다.`,'',
    '| 전략 | 평균 평가 (최소–최대) | 평균 순위 | 1위 비율 | 3위 이내 | 평균 잔액 | 운영비 부족 경험 |','|---|---:|---:|---:|---:|---:|---:|',
    ...summary.map(s=>`| ${s.name} | ${s.meanScore} (${s.minScore}–${s.maxScore}) | ${s.meanRank} | ${s.winRate}% | ${s.top3Rate}% | ${s.meanCash} | ${s.shortageRate}% |`),'',
    '## 부진 후 회복','',
    '| 전략 | 첫 평가 평균 순위 | 마지막 평가 평균 순위 | 회복 순위 | 최종 3위 이내 |','|---|---:|---:|---:|---:|',
    ...summary.filter(s=>s.strategy.startsWith('recover_')).map(s=>`| ${s.name} | ${s.meanFirstEvaluationRank} | ${s.meanLastEvaluationRank} | ${s.meanRankRecovery} | ${s.top3Rate}% |`),'',
    '## 해석 범위','',
    '- 봇은 공개된 게임 행동 함수로만 조달·입찰·정비·대관·편성을 수행합니다. 자금·시설·명성을 강제로 넣지 않습니다.',
    '- 전략의 성적은 이 휴리스틱 봇의 성적입니다. 모든 인간 전략의 최적값, 재미 또는 균형 완성의 증명이 아닙니다.',
    '- 현금은 승리 조건이 아닙니다. 최종 1위와 주민 서비스·이용 경험·명성을 함께 비교해야 합니다.',
    '- 운영비 부족 경험은 한 계절 이상 수업 취소 경고가 발생한 게임 비율입니다. 파산 판정과 같지 않습니다.',
    '- 공통 경제·수요·시공·평가 규칙을 사용하는 경쟁기관 9곳과 비교합니다. 봇의 계획 알고리즘은 경쟁기관과 다릅니다.',
    '- 점수는 명성25%·재정20%·주민만족30%·공공서비스25%이며 최종 성적은 네 차례 평가 평균50%+마지막평가50%입니다. 현금이 많다는 이유로 재정점수가100을 넘지 않습니다.',
    '- 모든 계절의 평가·순위·지원금과 경쟁기관의 평가·지원금은 동명 JSON에 저장합니다. 조기 방치·과도한 무료운영의 손해를 이후 전략으로 회복할 수 있는지도 별도로 비교합니다.',
    '- 주어진 여러 시드는 수요 인원과 신청 시간·견적·품질의 변동을 검증합니다. 별도 게임 난이도/충격 시나리오는 포함하지 않습니다.',''];
  fs.writeFileSync(path.join(output,`${label}.md`),md.join('\n'));
  console.log(JSON.stringify({label,games:rows.length,elapsedSeconds:result.elapsedSeconds,summary},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
