import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createGame, buyEquipment, freeCash, setProgram, runSeason, nextSeason,
  previewSeason, canRunProgram, validateSave, openHall, getDemand, OFFERS,
  setWeekendSupport, maintainRoom, finalScore, moveEquipment,
} from '../../src/center/simulation.ts'
import type { GameState, ProgramId, RoomId } from '../../src/center/simulation.ts'

function purchase(state:GameState,offer:string,room:RoomId):GameState {
  const result=buyEquipment(state,offer,room);assert.equal(result.error,undefined);return result.state
}

test('new game has ten independent institutions and a protected operating reserve',()=>{
  const state=createGame()
  assert.equal(state.rivals.length,10)
  assert.equal(new Set(state.rivals.map(r=>r.id)).size,10)
  assert.equal(state.player.cash,720)
  assert.equal(state.player.reserved,320)
  assert.equal(freeCash(state.player),400)
  state.rivals[0].cash=0
  assert.equal(state.rivals[1].cash,720)
  assert.equal(state.player.cash,720)
})

test('a purchase is paid once and reserves only remaining current-year maintenance',()=>{
  const base=createGame()
  const bought=purchase(purchase(base,'E01','A'),'E02','B')
  assert.equal(base.player.inventory.length,0)
  assert.equal(bought.player.cash,570)
  assert.equal(bought.player.reserved,332)
  assert.equal(freeCash(bought.player),238)
  assert.equal(bought.player.pendingTasks.length,2)
  const duplicate=buyEquipment(bought,'E01B','A')
  assert.ok(duplicate.error)
  assert.equal(duplicate.state,bought)
  assert.equal(canRunProgram(bought.player,'A','P01'),true)
  assert.equal(canRunProgram(bought.player,'B','P01'),false)
})

test('room slots and hall requirements reject purchases without spending',()=>{
  let state=purchase(purchase(createGame(),'E01','A'),'E02','A')
  assert.ok(buyEquipment(state,'E05','A').error)
  assert.ok(buyEquipment(state,'E07','A').error)
  assert.ok(buyEquipment(state,'E07','C').error)
  const invalid=setProgram(state,'B',0,'P01')
  assert.equal(invalid,state)
  const opened=openHall(createGame())
  assert.equal(opened.error,undefined)
  assert.equal(opened.state.player.cash,500)
  assert.equal(opened.state.player.reserved,380)
  state=opened.state
  assert.equal(openHall(state).state,state)
})

test('equipment move preserves ownership and condition and performs one paid installation',()=>{
  let state=purchase(purchase(createGame(),'E01','A'),'E02','B')
  state.player.pendingTasks=[]
  state.player.inventory.forEach(e=>{e.ready=true})
  state.player.inventory[0].condition=80
  state=setProgram(state,'A',0,'P01')
  const before=JSON.stringify(state)
  const result=moveEquipment(state,'E01','B')
  assert.equal(result.error,undefined)
  assert.equal(JSON.stringify(state),before)
  assert.equal(result.state.player.cash,state.player.cash-8)
  assert.equal(result.state.player.reserved,state.player.reserved)
  assert.equal(result.state.player.inventory.length,state.player.inventory.length)
  const moved=result.state.player.inventory.find(e=>e.id==='E01')!
  assert.deepEqual(moved,{id:'E01',room:'B',condition:80,ready:false})
  assert.equal(result.state.player.rooms.find(r=>r.id==='A')!.equipment.includes('E01'),false)
  assert.equal(result.state.player.rooms.find(r=>r.id==='B')!.equipment.filter(id=>id==='E01').length,1)
  assert.equal(result.state.player.plan.A[0],'P01')
  assert.equal(canRunProgram(result.state.player,'A','P01'),false)
  assert.equal(canRunProgram(result.state.player,'B','P01'),true)
  assert.deepEqual(result.state.player.pendingTasks,[{kind:'install',room:'B',remaining:1,equipment:'E01'}])
  const planned=setProgram(result.state,'B',1,'P01')
  const settled=runSeason(planned)
  assert.equal(settled.player.pendingTasks.length,0)
  assert.equal(settled.player.inventory.find(e=>e.id==='E01')!.ready,true)
  assert.equal(settled.lastReport!.beforeCash,state.player.cash-8)
  assert.ok(settled.lastReport!.activity.some(a=>a.program==='P01'&&a.room==='B'))
  assert.equal(settled.lastReport!.activity.some(a=>a.program==='P01'&&a.room==='A'),false)
  assert.equal(nextSeason(settled).player.cash,settled.player.cash)
})

test('invalid equipment moves never spend money or mutate the plan',()=>{
  let state=purchase(createGame(),'E01','A')
  assert.ok(moveEquipment(state,'E01','B').error)
  state.player.inventory[0].ready=true;state.player.pendingTasks=[]
  for(const [id,target] of [['missing','B'],['E01','A'],['E01','C']] as [string,RoomId][]){
    const before=JSON.stringify(state),result=moveEquipment(state,id,target)
    assert.ok(result.error);assert.equal(result.state,state);assert.equal(JSON.stringify(state),before)
  }
  const poor=structuredClone(state);poor.player.cash=poor.player.reserved+7
  assert.ok(moveEquipment(poor,'E01','B').error)
  assert.equal(moveEquipment(poor,'E01','B').state,poor)
  const common=purchase(createGame(),'E08','A');common.player.inventory[0].ready=true
  assert.ok(moveEquipment(common,'E08','B').error)
  assert.equal(moveEquipment({...state,phase:'review'},'E01','B').error,'계획 화면에서 장비를 옮길 수 있어요.')
})

test('equipment move respects target activity slots and auditorium-only stage',()=>{
  const full=purchase(purchase(purchase(createGame(),'E01','A'),'E02','B'),'E05','B')
  full.player.inventory.forEach(e=>{e.ready=true});full.player.pendingTasks=[]
  const rejected=moveEquipment(full,'E01','B')
  assert.ok(rejected.error?.includes('자리'))
  assert.equal(rejected.state,full)
  let hall=createGame();hall.player.cash=1500
  hall=openHall(hall).state;hall=purchase(hall,'E07','C')
  hall.player.pendingTasks=[];hall.player.inventory[0].ready=true
  assert.ok(moveEquipment(hall,'E07','A').error?.includes('행사실'))
})

test('preview is deterministic and read-only; phase guards prevent repeated settlement',()=>{
  let state=purchase(createGame(),'E01','A')
  state=setProgram(state,'A',0,'P01')
  state=setProgram(state,'A',1,'P02')
  const before=JSON.stringify(state)
  const first=previewSeason(state),second=previewSeason(state)
  assert.deepEqual(first,second)
  assert.equal(JSON.stringify(state),before)
  const result=runSeason(state)
  assert.equal(result.phase,'review')
  assert.equal(result.lastReport?.revenue,first.revenue)
  assert.equal(result.lastReport?.cost,first.cost)
  assert.equal(result.lastReport?.weekly.length,13)
  assert.equal(result.player.pendingTasks.length,0)
  assert.ok(result.player.inventory.every(e=>e.ready))
  assert.equal(result.history.length,1)
  assert.equal(runSeason(result),result)
  assert.equal(JSON.stringify(state),before)
})

test('copying free meetings into every slot cannot duplicate the same requests',()=>{
  let state=createGame()
  for(const room of ['A','B'] as RoomId[])for(let slot=0;slot<5;slot++)state=setProgram(state,room,slot,'P06')
  const report=previewSeason(state)
  const meetingDemand=getDemand(state).filter(g=>g.programs.includes('P06')).reduce((n,g)=>n+g.people,0)
  assert.ok(report.visits<=meetingDemand*13)
  assert.equal(report.revenue,0)
  assert.equal(report.cost,80)
  assert.equal(report.afterCash,640)
})

test('installation is a one-off task and maintenance does not recur every week',()=>{
  let state=purchase(createGame(),'E01','A')
  for(let slot=0;slot<5;slot++)state=setProgram(state,'A',slot,'P01')
  const result=runSeason(state)
  const next=nextSeason(result)
  assert.equal(next.player.inventory.length,1)
  assert.equal(next.player.pendingTasks.length,0)
  assert.equal(next.player.reserved,246)
  next.player.inventory[0].condition=40
  const condition=next.player.inventory[0].condition
  const repaired=maintainRoom(next,'A')
  assert.equal(repaired.error,undefined)
  assert.equal(repaired.state.player.cash,next.player.cash-12)
  assert.equal(repaired.state.player.inventory[0].condition,condition)
  const completed=runSeason(repaired.state)
  assert.ok(completed.player.inventory[0].condition>condition)
  assert.equal(completed.player.pendingTasks.length,0)
})

test('support contracts are a reversible planning cost, not a recurring free toggle',()=>{
  const original=createGame()
  const hired=setWeekendSupport(original,true).state
  assert.equal(hired.player.cash,696)
  assert.equal(setWeekendSupport(hired,true).state,hired)
  const canceled=setWeekendSupport(hired,false).state
  assert.equal(canceled.player.cash,720)
  const settled=runSeason(hired)
  assert.equal(setWeekendSupport(settled,false).state,settled)
  assert.equal(nextSeason(settled).player.supportContract,false)
})

test('scheduled repairs allow planning a worn-out program, but the repair block stays unavailable',()=>{
  let state=purchase(createGame(),'E01','A')
  state.player.inventory[0].ready=true
  state.player.inventory[0].condition=10
  state.player.pendingTasks=[]
  assert.equal(canRunProgram(state.player,'A','P01'),false)
  state=maintainRoom(state,'A').state
  assert.equal(canRunProgram(state.player,'A','P01'),true)
  state=setProgram(state,'A',0,'P01')
  state=setProgram(state,'A',1,'P01')
  const report=previewSeason(state)
  assert.ok(report.visits>0)
  assert.ok(report.warnings.some(x=>x.includes('설치·정비')))
})

test('noise penalties come only from simultaneous activities that actually operate',()=>{
  let state=purchase(purchase(createGame(),'E01','A'),'E04','B')
  state.player.pendingTasks=[]
  state.player.inventory.forEach(e=>{e.ready=true})
  state.player.rooms[0].mode='table';state.player.rooms[1].mode='floor'
  state.player.plan={A:[null,null,null,'P02',null],B:[null,null,null,'P09',null],C:[null,null,null,null,null]}
  const canceledDance=previewSeason(state)
  assert.equal(canceledDance.activity.find(a=>a.program==='P02')?.experience,70)
  assert.equal(canceledDance.activity.some(a=>a.program==='P09'),false)
  state.player.plan={A:[null,null,'P01',null,null],B:[null,null,'P09',null,null],C:[null,null,null,null,null]}
  const actualDance=previewSeason(state)
  assert.equal(actualDance.activity.find(a=>a.program==='P01')?.experience,60)
  assert.ok(actualDance.activity.some(a=>a.program==='P09'))
})

test('all equipment ownership combinations leave next-year base operation affordable',()=>{
  const families=[...new Set(OFFERS.map(o=>o.family))]
  const combos=(index:number,selected:typeof OFFERS):void=>{
    if(index===families.length){
      const maintenance=selected.reduce((sum,o)=>sum+o.maintenance,0)
      const annual=4*(95-(selected.some(o=>o.family==='energy')?12:0)+maintenance)
      assert.ok(annual<=480)
      return
    }
    combos(index+1,selected)
    for(const offer of OFFERS.filter(o=>o.family===families[index]))combos(index+1,[...selected,offer])
  }
  combos(0,[])
})

test('five years settle exactly 260 weeks, maintain rivals and end without a sixth grant',()=>{
  let state=purchase(purchase(createGame(73),'E01','A'),'E02','B')
  const plan:Record<'A'|'B',(ProgramId|null)[]>={A:['P01','P01','P02','P05',null],B:['P03','P03','P04',null,'P05']}
  for(const room of ['A','B'] as const)for(let slot=0;slot<5;slot++)state=setProgram(state,room,slot,plan[room][slot])
  for(let turn=0;turn<20;turn++){
    const result=runSeason(state)
    assert.equal(result.history.length,turn+1)
    for(const inst of [result.player,...result.rivals]){
      assert.ok(inst.cash>=0,`${inst.id} cash`)
      assert.ok(inst.reserved>=0,`${inst.id} reserve`)
      assert.ok(inst.cash>=inst.reserved-.01,`${inst.id} cash covers reserve`)
      assert.ok(Number.isFinite(inst.score))
      assert.equal(inst.history.length,turn+1)
    }
    const next=nextSeason(result)
    if(result.season===3&&result.year<5)assert.equal(next.player.cash,result.player.cash+480)
    if(turn===19)assert.equal(next.player.cash,result.player.cash)
    assert.equal(nextSeason(next),next)
    assert.ok(validateSave(next))
    state=next
  }
  assert.equal(state.phase,'ending')
  assert.equal(state.year,5)
  assert.equal(state.history.reduce((sum,r)=>sum+r.weekly.length,0),260)
  assert.equal(state.player.annualScores.length,5)
  assert.equal(runSeason(state),state)
  assert.ok(state.rivals.every(r=>r.inventory.length>0))
  assert.ok(new Set(state.rivals.map(r=>r.score)).size>3)
  assert.ok(Number.isFinite(finalScore(state.player)))
})

test('save validation rejects malformed data and accepts JSON round trips',()=>{
  const valid=createGame()
  assert.ok(validateSave(JSON.parse(JSON.stringify(valid))))
  assert.equal(validateSave(null),false)
  assert.equal(validateSave({version:1}),false)
  const corrupt=structuredClone(valid);corrupt.player.inventory.push({id:'not-real',room:'A',condition:100,ready:true})
  assert.equal(validateSave(corrupt),false)
  const brokenPlan=structuredClone(valid);brokenPlan.player.plan.A=[]
  assert.equal(validateSave(brokenPlan),false)
  const invalidMoney=structuredClone(valid);invalidMoney.player.cash=Number.NaN
  assert.equal(validateSave(invalidMoney),false)
  const badRooms=JSON.parse(JSON.stringify(valid));badRooms.player.rooms=[null,null,null]
  assert.equal(validateSave(badRooms),false)
  const badStats=JSON.parse(JSON.stringify(valid));badStats.player.yearStats={}
  assert.equal(validateSave(badStats),false)
  const badReport=JSON.parse(JSON.stringify(valid));badReport.phase='review';badReport.lastReport={}
  assert.equal(validateSave(badReport),false)
})
