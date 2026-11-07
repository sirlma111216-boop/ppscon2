import { wonAmount } from './currency.ts'
import type { GameState, Institution, MutationResult, RoomId } from './simulation'
export interface RoomRemodel { remainingWeeks:number; paid:number }
export const REMODEL_COST:Record<RoomId,number>={A:1800,B:2600,C:3600,D:2000,E:2200,F:2200,G:2400}
export const REMODEL_SATISFACTION=6
export const REMODEL_WEEKS=13
export function roomRemodelComplete(room:{remodel?:RoomRemodel}):boolean{return room.remodel?.remainingWeeks===0}
export function roomRemodelBonus(room:{remodel?:RoomRemodel}):number{return roomRemodelComplete(room)?REMODEL_SATISFACTION:0}
export function contractRoomRemodel(state:GameState,id:RoomId):MutationResult{
 const room=state.player.rooms.find(r=>r.id===id)
 if(state.phase!=='planning')return {state,error:'계획 단계에서 계약해 주세요.'}
 if(!room?.open)return {state,error:'먼저 시설을 개방해 주세요.'}
 if(room.remodel)return {state,error:'이미 계약한 실내 리모델링입니다. 방마다 한 번만 가능해요.'}
 const price=REMODEL_COST[id]
 if(state.player.cash-state.player.reserved<price)return {state,error:`리모델링 비용 ${wonAmount(price)}원이 필요해요.`}
 const next=structuredClone(state)
 next.player.cash=Math.round((next.player.cash-price)*100)/100
 next.player.rooms.find(r=>r.id===id)!.remodel={remainingWeeks:REMODEL_WEEKS,paid:price}
 next.player.lastPurchase='실내 리모델링 계약 · '+wonAmount(price)+'원'
 return {state:next}
}
/** Off-hours work: existing bookings and equipment remain intact. */
export function advanceRoomRemodels(inst:Institution):void{
 for(const room of inst.rooms)if(room.remodel&&room.remodel.remainingWeeks>0){room.remodel.remainingWeeks--;if(!room.remodel.remainingWeeks)inst.lastPurchase='실내 리모델링 완공 · 이용 환경 개선'}
}
export function validateRoomRemodel(value:unknown):boolean{
 if(value===undefined)return true
 if(!value||typeof value!=='object')return false
 const r=value as RoomRemodel
 return Number.isInteger(r.remainingWeeks)&&r.remainingWeeks>=0&&r.remainingWeeks<=REMODEL_WEEKS&&Number.isFinite(r.paid)&&Object.values(REMODEL_COST).includes(r.paid)
}
/** Rivals can make the same optional late-game purchase, retaining operating liquidity. */
export function planRivalRemodel(inst:Institution,year:number):void{
 if(year<5)return
 const candidates=inst.rooms.filter(r=>r.open&&!r.remodel).sort((a,b)=>inst.plan[b.id].filter(Boolean).length-inst.plan[a.id].filter(Boolean).length)
 const room=candidates[0];if(!room||!inst.plan[room.id].some(Boolean))return
 const price=REMODEL_COST[room.id]
 if(inst.cash-inst.reserved-price<1800)return
 inst.cash=Math.round((inst.cash-price)*100)/100;room.remodel={remainingWeeks:REMODEL_WEEKS,paid:price}
}
