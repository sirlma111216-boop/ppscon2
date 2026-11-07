import { wonAmount } from './currency'
import { useState } from 'react'
import { ROOM_NAMES, freeCash } from './simulation'
import type { GameState, RoomId } from './simulation'
import { contractRoomRemodel, REMODEL_COST, roomRemodelComplete } from './roomRemodel'
import type { Notify } from './ToastFeedback'
export default function RoomRemodelPanel({game,onChange,onNotify}:{game:GameState;onChange:(game:GameState)=>void;onNotify?:Notify}){
 const [selected,setSelected]=useState<RoomId>('A'),[quote,setQuote]=useState(false),[error,setError]=useState('')
 const room=game.player.rooms.find(r=>r.id===selected)!,cost=REMODEL_COST[selected]
 return <section className="room-remodel-panel"><h3>실내 리모델링</h3><p>방마다 한 번 · 완공 후 해당 방 이용 환경 개선 · 만족도는 평가회에서 공개<br/>수강료·대관료 배율, 정원, 장비 자리는 그대로입니다.</p>
 <div className="remodel-room-tabs">{game.player.rooms.map(r=><button key={r.id} className={selected===r.id?'selected':''} aria-pressed={selected===r.id} onClick={()=>{setSelected(r.id);setQuote(false);setError('')}}>{ROOM_NAMES[r.id]}{roomRemodelComplete(r)?' ✓':r.remodel?' · 공사 중':!r.open?' · 미개방':''}</button>)}</div>
 <div className="remodel-comparison"><figure><img src={'/center/building-v2/room-'+selected+'.webp'} alt={ROOM_NAMES[selected]+' 기존 실내'}/><figcaption>기존 실내</figcaption></figure><figure><img src={'/center/room-upgrades-v1/room-'+selected+'.webp'} alt={ROOM_NAMES[selected]+' 리모델링 완공 예상'}/><figcaption>{roomRemodelComplete(room)?'완공된 실내':'완공 예상 모습'}</figcaption></figure></div>
 <div className="facility-publish"><div><h4>{ROOM_NAMES[selected]} · 조명·내장·기본 가구 개선</h4><strong>{wonAmount(cost)}원 · 1턴 (13주)</strong><p>운영 종료 시간에 시공해 기존 예약은 유지합니다.<br/>별도 명성 즉시 지급은 없으며 실제 이용 만족도에 반영됩니다.</p></div>
 {room.remodel?<strong role="status">{roomRemodelComplete(room)?'리모델링 완료 · 다시 구매하지 않습니다':`시공 중 · ${room.remodel.remainingWeeks}주 남음`}</strong>:<button className="primary-button" disabled={!room.open||game.phase!=='planning'} onClick={()=>setQuote(true)}>조달 견적 확인</button>}</div>
 {quote&&!room.remodel&&<div className="facility-award"><div><strong>게임용 리모델링 견적 · {wonAmount(cost)}원</strong><p>지급 후 가용예산 {wonAmount(freeCash(game.player)-cost)}원</p><small>이용이 많은 방부터 투자하세요. 수입을 직접 늘리는 공사는 아닙니다.</small></div><button className="secondary-button" onClick={()=>setQuote(false)}>취소</button><button className="primary-button" disabled={freeCash(game.player)<cost||game.phase!=='planning'} onClick={()=>{const result=contractRoomRemodel(game,selected);if(result.error){setError(result.error);return}onChange(result.state);setQuote(false);onNotify?.(`${ROOM_NAMES[selected]} 리모델링 계약 · ${wonAmount(cost)}원 · 이번 계절 말 완공`,'success')}}>비용 지급 · 계약</button></div>}{error&&<p role="alert">{error}</p>}
 </section>
}
