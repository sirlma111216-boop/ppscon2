import {useState} from 'react'
import ProcurementHeader from './ProcurementHeader'
import {CAMPUS_SCOPES,awardCampusContract,campusBenefits,collectCampusBids,getCampusProject,postCampusTender} from './campusProjects'
import type {CampusProjectId} from './campusProjects'
import {freeCash} from './simulation'
import type {GameState,MutationResult} from './simulation'
import './FacilityDesk.css'
import './CampusDesk.css'

const money=(n:number)=>n.toLocaleString('ko-KR',{maximumFractionDigits:1})
export default function CampusDesk({game,onChange,onClose}:{game:GameState;onChange:(state:GameState)=>void;onClose:()=>void}){
  const [selected,setSelected]=useState<CampusProjectId>('garden')
  const [chosen,setChosen]=useState<string|null>(null),[error,setError]=useState('')
  const scope=CAMPUS_SCOPES.find(s=>s.id===selected)!,project=getCampusProject(game.player,selected)
  const bid=project?.bids.find(b=>b.id===(project.selectedBidId||chosen)),stage=project?.stage??'brief'
  const locked=selected==='facade'&&getCampusProject(game.player,'garden')?.stage!=='complete'
  const reserve=bid?bid.upkeep*(4-game.season):0,required=bid?bid.price+reserve:0
  const act=(result:MutationResult)=>{if(result.error){setError(result.error);return}setError('');onChange(result.state)}
  const benefits=campusBenefits(game.player)
  return <div className="facility-desk campus-desk">
    <ProcurementHeader service="facility" location="센터 환경 개선" guide="운영으로 모은 예산을 정원과 건물에 투자해요. 주민이 찾고 싶은 센터로 가꾸어 보세요." onClose={onClose}/>
    <div className="facility-body">
      <div className="campus-options" role="group" aria-label="환경 개선 사업 선택">{CAMPUS_SCOPES.map((item,index)=><button key={item.id} className={selected===item.id?'selected':''} aria-pressed={selected===item.id} onClick={()=>{setSelected(item.id);setChosen(null);setError('')}}><img src={item.image} alt=""/><span><small>0{index+1} · {getCampusProject(game.player,item.id)?.stage==='complete'?'완료':index===1?'정원 완공 후':'첫 환경 사업'}</small><strong>{item.name}</strong></span></button>)}</div>
      <div className="facility-document-heading"><div><span>나라장터 · 장기 시설 사업</span><h3>{scope.name}</h3></div><span className="facility-budget">가용예산 <b>{money(freeCash(game.player))}점</b></span></div>
      <p>{scope.description}</p>
      <div className="campus-effects"><span>완공 명성 <b>+{Math.round(scope.reputation*.7)}~{scope.reputation}</b></span><span>이용 만족도 <b>최대 +{scope.experience}</b></span><span>대관 매력 <b>최대 +{Math.round(scope.rental*100)}%</b></span></div>
      <p className="facility-coefficient-note">완성도에 따라 효과가 달라져요. 명성은 100까지이며 이후에도 만족도와 대관 매력 효과는 유지됩니다. 투자 금액 자체는 평가점수가 아닙니다.</p>
      {stage==='brief'&&<div className="facility-publish"><strong>예상 공사비 {money(scope.budget*.75)}–{money(scope.budget*1.25)}점</strong><button className="primary-button" disabled={locked||game.phase!=='planning'} onClick={()=>act(postCampusTender(game,selected))}>{locked?'정원과 쉼터 완공 후 공고':'환경 개선 공고 게시'}</button></div>}
      {stage==='announced'&&<div className="facility-publish"><h4>시설 사업 공고가 게시되었습니다.</h4><button className="primary-button" onClick={()=>act(collectCampusBids(game,selected))}>환경 사업 제안서 3건 비교</button></div>}
      {stage==='bidding'&&<><div className="facility-comparison-heading"><h4>시공 업체 비교</h4><span>기간 · 완성도 · 장기 관리비</span></div><div className="facility-bids" role="group" aria-label="환경 개선 업체 선택">{project!.bids.map(offer=><button key={offer.id} className={`facility-bid ${chosen===offer.id?'selected':''}`} aria-pressed={chosen===offer.id} onClick={()=>setChosen(offer.id)}><span className="facility-vendor">{offer.vendor}<i>{chosen===offer.id?'✓':'○'}</i></span><small>{offer.approach}</small><strong>{money(offer.price)}<small>점</small></strong><dl><div><dt>공사 기간</dt><dd>{offer.weeks}주 · 약 {Math.ceil(offer.weeks/13)}계절</dd></div><div><dt>완성도</dt><dd>{offer.qualityMin}–{offer.qualityMax}</dd></div><div><dt>계절 관리비</dt><dd>{offer.upkeep}점</dd></div></dl></button>)}</div><div className="facility-award"><div>{bid?<><strong>{bid.vendor}</strong><span>공사비 {money(bid.price)} + 올해 관리비 {money(reserve)}점</span><small>계약 후 가용예산 {money(freeCash(game.player)-required)}점</small></>:<strong>업체를 선택해 비용을 확인하세요.</strong>}</div><button className="primary-button" disabled={!bid||freeCash(game.player)<required||game.phase!=='planning'} onClick={()=>{if(bid)act(awardCampusContract(game,selected,bid.id))}}>환경 개선 계약</button></div></>}
      {stage==='construction'&&bid&&<div className="facility-progress"><span>{bid.vendor} 시공 중</span><h4>새로운 모습까지 {project!.remainingWeeks}주</h4><div className="facility-progress-track" role="progressbar" aria-label="환경 개선 진행률" aria-valuemin={0} aria-valuemax={bid.weeks} aria-valuenow={bid.weeks-project!.remainingWeeks}><i style={{width:`${100*(1-project!.remainingWeeks/bid.weeks)}%`}}/></div><p>센터의 대관과 클래스는 계속 운영합니다. 계절 운영을 진행하면 공사도 진행됩니다.</p><button className="secondary-button" onClick={onClose}>센터 운영으로 돌아가기</button></div>}
      {stage==='complete'&&bid&&<div className="facility-complete"><h4>{scope.name}, 완공되었습니다.</h4><p>{bid.vendor} · 완성도 {bid.finalQuality}/100</p><div><span>전체 환경 개선 만족도<b>+{benefits.experience}</b></span><span>전체 대관 매력<b>+{money(benefits.rental*100)}%</b></span></div><button className="primary-button" onClick={onClose}>바뀐 센터 외관 보기</button></div>}
      {error&&<p className="facility-error" role="alert">{error}</p>}
    </div><footer className="facility-footer">게임 속 조경·외관 개선 모형 · 실제 공고·계약은 이루어지지 않습니다.</footer>
  </div>
}
