/**
 * Full seven-year demo play-throughs by ordinary and extreme players, with a digest of what looks wrong.
 * The players use only the public game actions (scripts/center-balance.mjs) and every season is checked for
 * broken state. Usage:
 *   node scripts/center-demo-play.mjs [--seeds 3] [--seed-start 20261101] [--strategy a,b] [--output dir] [--label name]
 */
import fs from 'node:fs';
import path from 'node:path';
import { DEMO_STRATEGIES, STRATEGIES, runBot } from './center-balance.mjs';

const args=process.argv.slice(2), option=(name,fallback)=>args.includes(name)?args[args.indexOf(name)+1]:fallback;
const count=Number(option('--seeds','3')), start=Number(option('--seed-start','20261101'));
const requested=option('--strategy','demo'), all=[...DEMO_STRATEGIES,...STRATEGIES];
const policies=requested==='demo'?DEMO_STRATEGIES:all.filter(policy=>requested.split(',').includes(policy.id));
if(!policies.length||!Number.isInteger(count)||count<1)throw new Error('Unknown strategy or seed count');
const round=value=>Math.round(value*100)/100, mean=values=>values.length?round(values.reduce((a,b)=>a+b,0)/values.length):0;
const pad=(value,width)=>String(value).padEnd(width);

const rows=[], findings=[];
const note=(policy,seed,message)=>findings.push(`${policy.id}/${seed}: ${message}`);
for(const policy of policies){
  for(let index=0;index<count;index++){
    const seed=start+index;
    let run;
    try{run=runBot(policy,seed)}catch(error){note(policy,seed,'중단 — '+error.message);continue}
    const seasons=run.seasons, at=year=>seasons.filter(season=>season.year===year).at(-1);
    const answered=seasons.filter(season=>season.eventChoice!==null), meetings=seasons.map(season=>season.midseason?.choice??'none');
    const row={strategy:policy.id,name:policy.name,seed,rank:run.rank,score:run.score,cash:run.cash,minCash:run.minCash,
      reputation:[2,4,5,7].map(year=>at(year).reputation),trust:[2,4,7].map(year=>at(year).trust),
      satisfaction:mean(seasons.map(season=>season.satisfaction)),visits:mean(seasons.map(season=>season.visits)),
      stories:seasons.filter(season=>season.story).length,paidAnswers:answered.filter(season=>season.eventChoice===1).length,answered:answered.length,
      promotion:meetings.filter(choice=>choice==='promotion').length,repair:meetings.filter(choice=>choice==='repair').length,
      joined:seasons.reduce((sum,season)=>sum+(season.midseason?.joined??0),0),missedWeeks:seasons.reduce((sum,season)=>sum+season.missedWeeks,0),
      shortageSeasons:run.shortageSeasons,lowestRoom:Math.min(...seasons.map(season=>season.lowestRoom)),lowestGear:Math.min(...seasons.map(season=>season.lowestGear)),
      staff:seasons.at(-1).staff.join('/'),maxReputationJump:Math.max(...seasons.map(season=>season.reputationChange)),maxTrustJump:Math.max(...seasons.map(season=>season.trustChange)),
      checks:run.invariantChecks,seasons};
    rows.push(row);
    // Things a designer would want to look at, not necessarily bugs.
    if(row.maxReputationJump>12)note(policy,seed,`한 계절에 명성 +${row.maxReputationJump}`);
    if(row.maxTrustJump>12)note(policy,seed,`한 계절에 신뢰 +${row.maxTrustJump}`);
    if(at(2).reputation>=70)note(policy,seed,`2년 차에 명성 ${at(2).reputation}`);
    if(at(7).trust>=400)note(policy,seed,`7년 차 신뢰 ${at(7).trust}`);
    if(run.cash>20000)note(policy,seed,`최종 현금 ${run.cash}만 원`);
    const worn=seasons.filter(season=>season.lowestRoom<20).length;
    if(worn>=4&&policy.classes!=='none')note(policy,seed,`관리상태 20 미만인 계절 ${worn}번`);
    for(const season of seasons)if(season.sessions>0&&season.visits===0)note(policy,seed,`${season.year}년 ${season.season+1}번째 계절: 편성은 있는데 방문 0`);
  }
  const mine=rows.filter(row=>row.strategy===policy.id);
  if(mine.length)console.log(`${pad(policy.id,18)} 순위 ${pad(mean(mine.map(row=>row.rank)),5)} 점수 ${pad(mean(mine.map(row=>row.score)),6)} 명성(2·4·5·7년) ${pad([0,1,2,3].map(i=>mean(mine.map(row=>row.reputation[i]))).join(' / '),28)} 신뢰(2·4·7년) ${pad([0,1,2].map(i=>mean(mine.map(row=>row.trust[i]))).join(' / '),22)} 현금 ${pad(mean(mine.map(row=>row.cash)),9)} 최저현금 ${pad(mean(mine.map(row=>row.minCash)),8)} 만족 ${pad(mean(mine.map(row=>row.satisfaction)),6)} 이야기 ${pad(mean(mine.map(row=>row.stories)),5)} 유료대응 ${pad(mean(mine.map(row=>row.paidAnswers))+'/'+mean(mine.map(row=>row.answered)),10)} 홍보 ${pad(mean(mine.map(row=>row.promotion)),5)} 정비 ${pad(mean(mine.map(row=>row.repair)),5)} 휴강주 ${pad(mean(mine.map(row=>row.missedWeeks)),6)} 최저관리 ${pad(mean(mine.map(row=>row.lowestRoom)),6)} 최저장비 ${pad(mean(mine.map(row=>row.lowestGear)),6)} 교육 ${mine[0].staff}`);
}
console.log(`\n${rows.length}판 완주 · 불변식 ${rows.reduce((sum,row)=>sum+row.checks,0)}회 확인`);
console.log(findings.length?'\n살펴볼 점:\n'+findings.map(line=>'- '+line).join('\n'):'\n살펴볼 점 없음');
const output=option('--output',null);
if(output){fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,`${option('--label','demo-play')}.json`),JSON.stringify({seedStart:start,seedCount:count,rows,findings},null,1)+'\n')}
