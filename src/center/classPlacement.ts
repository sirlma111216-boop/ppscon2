import { BLOCKS, PROGRAMS, ROOM_NAMES, getProgramPlacementError, previewSeason, setProgram } from './simulation.ts'
import type { GameState, MutationResult, ProgramId, RoomId, SeasonReport } from './simulation.ts'
import { shortOperationReason } from './operationReason.ts'

function missedWeeks(report:SeasonReport,room:RoomId,slot:number):number {
 return (report.operationIssues??[]).filter(i=>i.room===room&&i.slot===slot).reduce((n,i)=>n+i.weeks,0)
}

/** Atomic UI action: impossible additions never overwrite a saved plan. */
export function scheduleClass(state:GameState,room:RoomId,slot:number,program:ProgramId):MutationResult {
 if(state.phase!=='planning'||state.planningStage!=='classes')return {state,error:'클래스 편성 단계에서 변경해 주세요.'}
 const error=getProgramPlacementError(state.player,room,slot,program)
 if(error)return {state,error}
 if(state.player.plan[room][slot]===program)return {state}
 const next=setProgram(state,room,slot,program)
 const after=previewSeason(next)
 if(missedWeeks(after,room,slot)>=13){
  const reasons=[...new Set((after.operationIssues??[]).filter(i=>i.room===room&&i.slot===slot).map(i=>shortOperationReason(i.reason)))]
  return {state,error:`${BLOCKS[slot]} 편성 불가 · ${reasons.join(' / ')}. 다른 시간이나 수업을 선택해 주세요.`}
 }
 const before=previewSeason(state)
 for(const other of state.player.rooms)for(let time=0;time<5;time++){
  if(other.id===room&&time===slot)continue
  const id=state.player.plan[other.id][time]
  if(!id||missedWeeks(before,other.id,time)>=13||missedWeeks(after,other.id,time)<13)continue
  const name=PROGRAMS.find(p=>p.id===id)?.shortName??id
  return {state,error:`편성 불가 · 기존 ${ROOM_NAMES[other.id]} ${BLOCKS[time]} ${name}이 운영되지 않게 됩니다. 기존 일정을 먼저 조정해 주세요.`}
 }
 return {state:next}
}
