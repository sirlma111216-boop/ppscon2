import { useState } from 'react'
import ProcurementHeader from './ProcurementHeader'
import ConstructionTiming from './ConstructionTiming'
import { CAMPUS_SCOPES, awardCampusContract, campusBenefits, collectCampusBids, getCampusProject, isCampusProjectBundled, postCampusTender } from './campusProjects'
import type { CampusProjectId } from './campusProjects'
import { freeCash, SEASONS } from './simulation'
import type { GameState, MutationResult } from './simulation'
import type { Notify } from './ToastFeedback'
import { expectedConstructionCompletion } from './facilityProjects'
import './FacilityDesk.css'
import './CampusDesk.css'

const money = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
export default function CampusDesk({ game, onChange, onClose, onNotify }: { game: GameState; onChange: (state: GameState) => void; onClose: () => void; onNotify?:Notify }) {
  const [selected, setSelected] = useState<CampusProjectId>('garden')
  const [chosen, setChosen] = useState<string | null>(null)
  const [error, setError] = useState('')
  const scope = CAMPUS_SCOPES.find(item => item.id === selected)!
  const project = getCampusProject(game.player, selected)
  const bundled = isCampusProjectBundled(game.player, selected)
  const legacyFacade = getCampusProject(game.player, 'facade')
  const compositeFacade = selected === 'facade' && legacyFacade?.legacyFacadeIncludesPlaza === true
  const title = compositeFacade ? '외관·광장 복합 개선 · 기존 사업' : scope.name
  const bid = project?.bids.find(item => item.id === (project.selectedBidId || chosen))
  const stage = project?.stage ?? 'brief'
  const reserve = bid ? bid.upkeep * (4 - game.season) : 0
  const required = bid ? bid.price + reserve : 0
  const benefits = campusBenefits(game.player)
  const canEdit = game.phase === 'planning'
  const completion = bid ? expectedConstructionCompletion(game,bid.weeks) : null
  const completionNote = completion ? `${completion.year}년 ${SEASONS[completion.season]} ${completion.week}주차 완공 예정${completion.withinGame ? '' : ' · 임기 이후'}` : ''
  const contractNotice = bid ? `${title} 계약 · ${money(bid.price)}점 지출 · ${completionNote}` : ''
  function act(result: MutationResult, message = contractNotice) {
    if (result.error) { setError(result.error); onNotify?.(result.error,'error'); return }
    if (result.state===game) return
    setError(''); onChange(result.state); onNotify?.(message,'success')
  }
  function chooseProject(id: CampusProjectId) { setSelected(id); setChosen(null); setError('') }
  function projectStatus(id: CampusProjectId) {
    if (isCampusProjectBundled(game.player, id)) return '기존 복합사업에 포함'
    const item = getCampusProject(game.player, id)
    return !item ? '독립 사업 · 공고 가능' : item.stage === 'complete' ? '완료' : item.stage === 'construction' ? '공사 진행 중' : item.stage === 'bidding' ? '제안 비교' : '공고 게시'
  }

  return <div className="facility-desk campus-desk">
    <ProcurementHeader service="facility" location="센터 환경 개선" guide="조경·외관·광장은 각각 선택할 수 있어요. 우리 센터에 필요한 사업부터 진행하세요." onClose={onClose} />
    <div className="facility-body">
      <div className="campus-options" role="group" aria-label="독립 환경 개선 사업 선택">{CAMPUS_SCOPES.map(item => <button key={item.id} className={selected === item.id ? 'selected' : ''} aria-pressed={selected === item.id} onClick={() => chooseProject(item.id)}><img src={item.image} alt="" /><span><small>{projectStatus(item.id)}</small><strong>{item.name}</strong></span></button>)}</div>
      <div className="facility-document-heading"><div><span>나라장터 · 환경 개선 사업</span><h3>{title}</h3></div><span className="facility-budget">가용예산 <b>{money(freeCash(game.player))}점</b></span></div>
      {bundled ? <div className="campus-bundled">
        <h4>기존 외관·광장 사업에 포함</h4>
        <p>{legacyFacade?.stage === 'complete' ? '광장까지 완공된 상태예요. 별도로 다시 계약하지 않아요.' : '진행 중인 복합 사업에서 광장도 함께 조성합니다.'}</p>
        {legacyFacade?.stage === 'construction' && <ConstructionTiming game={game} weeks={legacyFacade.remainingWeeks} />}
        <button className="secondary-button" onClick={() => chooseProject('facade')}>기존 사업 기록 보기</button>
      </div> : <>
        <p className="campus-description">{compositeFacade ? '기존 견적과 공사 조건을 유지하는 외관·광장 복합 사업입니다.' : scope.description}</p>
        {!compositeFacade && <><div className="campus-effects"><span>완공 명성 <b>+{Math.round(scope.reputation * .7)}~{scope.reputation}</b></span><span>이용 만족도 <b>최대 +{scope.experience}</b></span><span>대관 매력 <b>최대 +{money(scope.rental * 100)}%</b></span></div><p className="facility-coefficient-note">완성도에 따라 효과가 달라져요. 명성 100 이후에도 만족도·대관 효과는 유지됩니다.</p></>}
        {stage === 'brief' && <div className="facility-publish"><strong>예상 공사비 {money(scope.budget * .75)}–{money(scope.budget * 1.25)}점</strong><button className="primary-button" disabled={!canEdit} onClick={() => act(postCampusTender(game, selected),`${title} 공고를 게시했어요. 업체 제안을 받을 준비가 됐어요.`)}>환경 개선 공고 게시</button></div>}
        {stage === 'announced' && <div className="facility-publish"><h4>시설 사업 공고가 게시되었습니다.</h4><button className="primary-button" disabled={!canEdit} onClick={() => act(collectCampusBids(game, selected),`${title} 제안서 3건을 접수했어요. 가격과 기간을 비교해 주세요.`)}>환경 사업 제안서 3건 비교</button></div>}
        {stage === 'bidding' && <><div className="facility-comparison-heading"><h4>시공 업체 비교</h4><span>1턴 = 13주 · 현재 계절부터 공사</span></div><div className="facility-bids" role="group" aria-label="환경 개선 업체 선택">{project!.bids.map(offer => <button key={offer.id} className={`facility-bid ${chosen === offer.id ? 'selected' : ''}`} aria-pressed={chosen === offer.id} onClick={() => { setChosen(offer.id); setError('') }}><span className="facility-vendor">{offer.vendor}<i>{chosen === offer.id ? '✓' : '○'}</i></span><small>{offer.approach}</small><strong>{money(offer.price)}<small>점</small></strong><dl><div className="facility-duration"><dt>공사 기간</dt><dd><ConstructionTiming game={game} weeks={offer.weeks} /></dd></div><div><dt>완성도</dt><dd>{offer.qualityMin}–{offer.qualityMax}</dd></div><div><dt>계절 관리비</dt><dd>{offer.upkeep}점</dd></div></dl></button>)}</div><div className="facility-award"><div>{bid ? <><strong>{bid.vendor}</strong><span>공사비 {money(bid.price)} + 올해 관리비 {money(reserve)}점</span><small>계약 후 가용예산 {money(freeCash(game.player) - required)}점</small></> : <strong>업체를 선택해 비용을 확인하세요.</strong>}</div><button className="primary-button" disabled={!bid || freeCash(game.player) < required || !canEdit} onClick={() => { if (bid) act(awardCampusContract(game, selected, bid.id)) }}>환경 개선 계약</button></div></>}
        {stage === 'construction' && bid && <div className="facility-progress"><span>{bid.vendor} 시공 중</span><h4>공사 완료까지</h4><ConstructionTiming game={game} weeks={project!.remainingWeeks} /><div className="facility-progress-track" role="progressbar" aria-label="환경 개선 진행률" aria-valuemin={0} aria-valuemax={bid.weeks} aria-valuenow={bid.weeks - project!.remainingWeeks}><i style={{ width: `${100 * (1 - project!.remainingWeeks / bid.weeks)}%` }} /></div><p>센터의 대관과 클래스는 계속 운영합니다.<br />계절을 운영하면 공사도 진행됩니다.</p><button className="secondary-button" onClick={onClose}>센터 운영으로 돌아가기</button></div>}
        {stage === 'complete' && bid && <div className="facility-complete"><h4>{title}, 완공되었습니다.</h4><p>{bid.vendor} · 완성도 {bid.finalQuality}/100</p><div><span>전체 환경 개선 만족도<b>+{benefits.experience}</b></span><span>전체 대관 매력<b>+{money(benefits.rental * 100)}%</b></span></div><button className="primary-button" onClick={onClose}>바뀐 센터 외관 보기</button></div>}
      </>}
      {error && <p className="facility-error" role={onNotify?undefined:'alert'}>{error}</p>}
    </div><footer className="facility-footer">게임 속 조경·외관·광장 개선 모형 · 실제 공고·계약은 이루어지지 않습니다.</footer>
  </div>
}
