import { useState } from 'react'
import Icon from './Icon'
import ProcurementHeader from './ProcurementHeader'
import ConstructionTiming from './ConstructionTiming'
import { ROOM_DEFINITIONS, ROOM_NAMES, SEASONS, freeCash } from './simulation'
import type { GameState, MutationResult, RoomId } from './simulation'
import type { Notify } from './ToastFeedback'
import { awardFacilityContract, collectFacilityBids, expectedConstructionCompletion, facilityScope, getFacilityProject, getFacilityRentMultiplier, postFacilityTender } from './facilityProjects'
import './FacilityDesk.css'

interface FacilityDeskProps { game:GameState; room:RoomId; onChange:(state:GameState)=>void; onClose:()=>void; onNotify?:Notify }
const money=(n:number)=>n.toLocaleString('ko-KR',{maximumFractionDigits:1})
export default function FacilityDesk({game,room,onChange,onClose,onNotify}:FacilityDeskProps){
  const [chosen,setChosen]=useState<string|null>(null)
  const [error,setError]=useState('')
  const scope=facilityScope(room),definition=ROOM_DEFINITIONS.find(item=>item.id===room)!
  const project=getFacilityProject(game.player,room)
  const bid=project?.bids.find(item=>item.id===(project.selectedBidId||chosen))
  const stage=project?.stage ?? 'brief'
  const reserve=bid?bid.upkeep*(4-game.season):0
  const required=bid?bid.price+reserve:0
  const open=game.player.rooms.find(item=>item.id===room)?.open
  const step=stage==='complete'?3:stage==='construction'?2:stage==='bidding'?1:0
  const completion=bid?expectedConstructionCompletion(game,bid.weeks):null
  const completionNote=completion?`${completion.year}년 ${SEASONS[completion.season]} ${completion.week}주차 완공 예정${completion.withinGame?'':' · 임기 이후'}`:''
  const contractNotice=bid?`${ROOM_NAMES[room]} 계약 · ${money(bid.price)}점 지출 · ${completionNote}`:''
  const act=(result:MutationResult,message=contractNotice)=>{
    if(result.error){setError(result.error);onNotify?.(result.error,'error');return}
    if(result.state===game)return
    setError('');onChange(result.state);onNotify?.(message,'success')
  }
  if(!scope)return <div className="facility-unavailable"><Icon name="home" size={32}/><p>별도의 시설 사업이 필요하지 않은 공간입니다.</p><button onClick={onClose}>센터로 돌아가기</button></div>
  return <div className="facility-desk">
    <ProcurementHeader service="facility" location="시설 조성 공고" guide="공사비·기간·완성도를 함께 비교해요. 계약한 업체가 공간을 새롭게 만듭니다." onClose={onClose}/>
    <nav className="facility-steps" aria-label="시설 사업 진행 단계">{['입찰공고','제안서 비교','계약·시공','완료·개방'].map((label,index)=><span className={index===step?'current':index<step?'done':''} key={label}><b>0{index+1}</b>{label}</span>)}</nav>
    <div className="facility-body">
      <div className="facility-document-heading"><div><span>시설공사 · 게임 사업</span><h3>{scope.title}</h3></div><span className="facility-document-status">{stage==='brief'?'공고 준비':stage==='announced'?'공고 게시':stage==='bidding'?'제안서 접수':stage==='construction'?'시공 중':'개방 완료'}</span></div>
      <dl className="facility-document-facts"><div><dt>공고번호 · 게임</dt><dd>{project?.id||'공고 작성 전'}</dd></div><div><dt>수요기관</dt><dd>늘봄 문화체육센터</dd></div><div><dt>공사 장소</dt><dd>{ROOM_NAMES[room]}</dd></div></dl>
      <div className="facility-brief"><div className="facility-blueprint" aria-hidden="true"><svg viewBox="0 0 220 140" fill="none"><path d="M15 15H205V125H135m-35 0H15V15M100 125V90q35 0 35 35" stroke="currentColor" strokeWidth="2"/><path d="M35 35H185V50H35Z" stroke="currentColor"/>{[0,1,2].map(row=>[0,1,2,3,4].map(col=><rect key={`${row}-${col}`} x={38+col*31} y={64+row*17} width="17" height="9" rx="1" fill="currentColor" opacity=".35"/>))}</svg><strong>{definition.area}㎡</strong><span>정원 {definition.capacity}명</span></div><div><span className="facility-kicker">사업 개요</span><h4>{open?'시공이 완료된 공간':'시설 조성 계획'}</h4><p>{scope.brief}</p><span className="facility-budget">현재 가용예산 <b>{money(freeCash(game.player))}점</b></span></div></div>
      {stage==='brief'&&!open&&<div className="facility-publish"><p>공사비, 기간, 완성도를 비교해 시공 업체를 선택하세요.</p><button className="primary-button" onClick={()=>act(postFacilityTender(game,room),`${ROOM_NAMES[room]} 시설 공고를 게시했어요. 업체 제안을 받을 준비가 됐어요.`)}><Icon name="screen" size={18}/>시설 조성 공고 게시</button><small>공고 게시에는 비용이 들지 않습니다.</small></div>}
      {stage==='announced'&&<div className="facility-publish"><span className="facility-stamp"><Icon name="check" size={20}/>공고 게시됨</span><h4>업체 제안서를 확인할 차례입니다.</h4><button className="primary-button" onClick={()=>act(collectFacilityBids(game,room),`${ROOM_NAMES[room]} 제안서 3건을 접수했어요. 가격과 기간을 비교해 주세요.`)}>제안서 3건 접수 · 비교하기<Icon name="arrow" size={16}/></button></div>}
      {stage==='bidding'&&<><div className="facility-comparison-heading"><h4>접수 제안서 <span>3건</span></h4><span>공사비는 계약 때 · 관리비는 매 계절</span></div><div className="facility-bids" role="group" aria-label="시설 공사 업체 선택">{project!.bids.map(offer=><button key={offer.id} aria-pressed={chosen===offer.id} className={`facility-bid ${chosen===offer.id?'selected':''}`} onClick={()=>{setChosen(offer.id);setError('')}}><span className="facility-vendor"><Icon name="home" size={19}/>{offer.vendor}<i>{chosen===offer.id?'✓':'○'}</i></span><small>{offer.approach}</small><strong>{money(offer.price)}<small>점</small></strong><dl><div className="facility-duration"><dt>공사 기간</dt><dd><ConstructionTiming game={game} weeks={offer.weeks}/></dd></div><div><dt>예상 완성도</dt><dd>{offer.qualityMin}–{offer.qualityMax}<small>/100</small></dd></div><div><dt>시설 관리비</dt><dd>{offer.upkeep}점 / 계절</dd></div><div><dt>대관료 계수</dt><dd>{Math.round(60+.4*offer.qualityMin)}–{Math.round(60+.4*offer.qualityMax)}%</dd></div></dl></button>)}</div><p className="facility-coefficient-note">대관료 계수는 시설 완성도에 따른 차이입니다. 센터 명성과 관리상태도 실제 견적에 반영됩니다.</p><div className="facility-award"><div>{bid?<><strong>{bid.vendor} 선택</strong><span>공사비 {bid.price} + 올해 관리비 확보 {reserve} = 필요 {required}점</span><small>계약 후 가용예산 {money(freeCash(game.player)-required)}점</small></>:<strong>업체를 선택하면 계약 비용을 확인할 수 있어요.</strong>}</div><button className="primary-button" disabled={!bid||freeCash(game.player)<required||game.phase!=='planning'} onClick={()=>{if(bid)act(awardFacilityContract(game,room,bid.id))}}>업체 선정 · 계약<Icon name="arrow" size={16}/></button>{bid&&freeCash(game.player)<required&&<p className="facility-error" role="status">예산이 {money(required-freeCash(game.player))}점 부족해요.</p>}</div></>}
      {stage==='construction'&&bid&&<div className="facility-progress"><span className="facility-stamp"><Icon name="box" size={20}/>시공 중 · {bid.vendor}</span><h4>개방까지</h4><ConstructionTiming game={game} weeks={project!.remainingWeeks}/><div className="facility-progress-track" role="progressbar" aria-label="공사 진행률" aria-valuemin={0} aria-valuemax={bid.weeks} aria-valuenow={bid.weeks-project!.remainingWeeks}><i style={{width:`${(1-project!.remainingWeeks/bid.weeks)*100}%`}}/></div><p>계절 운영을 실행하면 실제 주차에 따라 공사가 진행됩니다.<br/>시공 중에는 이 공간을 대관하거나 클래스를 열 수 없어요.</p><div className="facility-progress-facts"><span>완성도 예상 <b>{bid.qualityMin}–{bid.qualityMax}</b></span><span>계절 관리비 <b>{bid.upkeep}점</b></span></div><button className="secondary-button" onClick={onClose}>센터 운영으로 돌아가기</button></div>}
      {stage==='complete'&&bid&&<div className="facility-complete"><Icon name="check" size={38}/><h4>{ROOM_NAMES[room]}, 개방되었습니다.</h4><p>{bid.vendor} 시공 · 다음 계절부터 대관 신청을 받습니다.</p><div><span>시설 완성도<b>{bid.finalQuality}<small>/100</small></b></span><span>대관료 계수<b>{Math.round(getFacilityRentMultiplier(game.player,room)*100)}<small>%</small></b></span><span>계절 관리비<b>{bid.upkeep}<small>점</small></b></span></div><button className="primary-button" onClick={onClose}>공간 살펴보기<Icon name="arrow" size={16}/></button></div>}
      {stage==='brief'&&open&&<div className="facility-complete"><h4>이미 개방된 공간입니다.</h4><button className="secondary-button" onClick={onClose}>센터로 돌아가기</button></div>}
      {error&&<p className="facility-error" role={onNotify?undefined:'alert'}>{error}</p>}
    </div>
    <footer className="facility-footer">게임용 시설 입찰 모형 · 업체·금액·기간은 창작 설정이며 실제 계약은 이루어지지 않습니다.</footer>
  </div>
}
