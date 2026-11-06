import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import * as sim from '../src/center/simulation.ts';
const expected={P11:'B',P12:'E',P13:'F',P14:'C',P15:'G',P16:'B',P17:'C',P18:'C',P19:'E',P20:'G',P21:'G'};
const source=await readFile('src/center/simulation.ts'),hash=createHash('sha256').update(source).digest('hex');
const rows=[];
for(const [id,room] of Object.entries(expected)){
 const program=sim.PROGRAMS.find(p=>p.id===id);assert.ok(program,id);assert.equal(program.exclusiveRoom,room);assert.equal(program.weeklyLimit,2);
 assert.deepEqual(sim.ROOM_IDS.filter(candidate=>sim.roomSupportsProgram(candidate,id)),[room]);
 const demand=sim.getDemand({seed:20261101,year:1,season:0}).filter(g=>g.programs.includes(id));assert.ok(demand.length>=2,`${id}: two distinct weekly groups`);assert.equal(new Set(demand.map(g=>g.id)).size,demand.length);
 rows.push({id,room,capacity:program.capacity,weeklyLimit:program.weeklyLimit,required:program.requires,demandGroups:demand.length,demandPeople:demand.reduce((sum,g)=>sum+g.people,0)});
}
const preserved=[];
const fixtures=JSON.parse(gunzipSync(await readFile('reports/center-balance/exclusive-legacy-fixtures.json.gz')));
for(const [id,room] of [['P11','A'],['P12','A'],['P13','G']]){
 const original=fixtures[`${id}${room}`],snapshot=structuredClone(original);
 const migrated=sim.migrateSave(original);assert.ok(migrated,`${id}${room} cannot reset`);assert.deepEqual(original,snapshot,'migration input immutable');assert.ok(sim.validateSave(migrated));assert.deepEqual(sim.migrateSave(migrated),migrated,'migration is idempotent');
 for(const key of ['seed','year','season','phase','planningStage','history','lastReport'])assert.deepEqual(migrated[key],original[key],`${key}: no past activity or progress rewritten`);
 for(const before of [original.player,...original.rivals]){
  const after=[migrated.player,...migrated.rivals].find(inst=>inst.id===before.id);assert.ok(after);
  const omit=inst=>Object.fromEntries(Object.entries(inst).filter(([key])=>!['plan','inventory','rooms','pendingTasks'].includes(key)));
  assert.deepEqual(omit(after),omit(before),'funds, evaluations, income, reserve, reputation and facilities unchanged');
  const identity=e=>Object.fromEntries(Object.entries(e).filter(([key])=>!['stored','room','ready'].includes(key)));
  assert.deepEqual(after.inventory.map(identity),before.inventory.map(identity),'owned item identity and condition never lost');
  const roomData=r=>Object.fromEntries(Object.entries(r).filter(([key])=>key!=='equipment'));
  assert.deepEqual(after.rooms.map(roomData),before.rooms.map(roomData),'opened facilities, quality and management preserved');
  const relocated=new Set(after.inventory.filter(e=>e.stored&&!before.inventory.find(old=>old.instanceId===e.instanceId)?.stored).map(e=>e.instanceId));
  assert.deepEqual(after.pendingTasks,before.pendingTasks.filter(task=>task.kind!=='install'||!relocated.has(task.equipment)),'only obsolete installation tasks removed');
  for(const candidate of sim.ROOM_IDS)for(let slot=0;slot<5;slot++){
   const previous=before.plan[candidate][slot],program=sim.PROGRAMS.find(p=>p.id===previous);
   assert.equal(after.plan[candidate][slot],program?.exclusiveRoom&&program.exclusiveRoom!==candidate?null:previous,'only incompatible future class is cleared');
  }
 }
 assert.equal(migrated.specialtyRulesVersion,1);assert.ok(migrated.migrationNotices?.length,'explained one-time plan change');
 assert.equal(migrated.player.plan[room][0],null,'invalid future class cleared without reset');
 assert.equal(sim.canRunProgram(migrated.player,room,id),false,'old room cannot bypass new class role');
 const cleared=sim.setProgram(migrated,room,0,null);assert.equal(cleared.player.plan[room][0],null);assert.equal(cleared.player.cash,original.player.cash);
 preserved.push({id,room,year:migrated.year,season:migrated.season,cash:migrated.player.cash,history:migrated.history.length,inventory:migrated.player.inventory.length,assetsFundsHistoryProgressPreserved:true,invalidFutureClassCleared:true,notices:migrated.migrationNotices});
}
const sourceAfter=await readFile('src/center/simulation.ts');assert.equal(createHash('sha256').update(sourceAfter).digest('hex'),hash);
const result={sourceHash:hash,programs:rows,preserved,sourceUnchanged:true};await writeFile('.preview/exclusive-contract-audit.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
