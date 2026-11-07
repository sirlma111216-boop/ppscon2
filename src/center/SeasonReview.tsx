import { ceremonyAward, ceremonyDetails } from './ceremony'
import SeasonBriefing from './SeasonBriefing'
import { wonAmount, signedWonAmount } from './currency'
import HallRegistration from './HallRegistration'
import OperationIssues from './OperationIssues'
import { useState } from 'react'
import { SEASON_EVENTS } from './seasonEvents'
import './SeasonOpening.css'
import Icon from './Icon'
import { FINAL_YEAR_BONUS, BASE_ANNUAL_BUDGET, EVALUATION_COMPONENTS, MAX_YEARS, finalScore, freeCash, getFinalRank } from './simulation'
import type { GameState, SeasonReport } from './simulation'
import './SeasonReview.css'

interface SeasonReviewProps {
  initialCeremonyStep?: number
  game: GameState
  report: SeasonReport
  onRivals: () => void
  onContinue: () => void
  onReset: () => void
}

const money = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
const signed = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`

export default function SeasonReview({ game, report, onRivals, onContinue, onReset, initialCeremonyStep = 0 }: SeasonReviewProps) {
  const [ceremonyStep,setCeremonyStep]=useState(initialCeremonyStep)
  const evaluation = report.evaluation
  const formulaFor=(component:typeof EVALUATION_COMPONENTS[number]) => component.key!=='publicService'?component.formula:!evaluation?.educationEvidenceFraction?'기존 기준 · 공공서비스 실제 참여 인원 ÷ 신청 인원 × 100':component.formula+(evaluation.educationEvidenceFraction<1?' · 새 기준 측정 주차 비중 '+money(evaluation.educationEvidenceFraction*100)+'%, 이전 주차는 기존 기준 유지':'')
  const ending = game.phase === 'ending'
  const participants = evaluation?.participants ?? report.participants ?? game.rivals.length + 1
  const awardStyle = evaluation?.award ? ['gold', 'silver', 'bronze'][evaluation.rank - 1] || 'standard' : 'standard'
  const nextBudget = evaluation && evaluation.appliesFromYear !== null
  const finalRank = ending ? getFinalRank(game) : null
  const finalAward = finalRank ? ceremonyAward(finalRank, true) : null

  const ceremony = ending || Boolean(evaluation)
  const honors = ceremonyDetails(game, report)
  const rank=ending?finalRank:evaluation?.rank
  const evaluationAward = evaluation ? ceremonyAward(evaluation.rank) : null
  if(ceremony && ceremonyStep < (ending?3:2)) return <section className={`ceremony-scene ${ending?'is-finale':''} ${honors.awarded?'is-awarded':'is-encouragement'}`} aria-label={honors.title}>
    <img src={honors.image} alt={honors.imageAlt} />
    <div className="ceremony-caption"><span className="eyebrow">{honors.title}</span>
      <h3>{ceremonyStep===0?(ending?'주민과 함께 만든 7년의 결실':'우리 센터의 운영성과를 돌아봅니다'):ceremonyStep===1?(honors.award||honors.category?.title||'함께 쌓은 성장의 기록'):'센터장님, 함께해서 고마웠습니다'}</h3>
      {ceremonyStep===0?<p>{ending?'7년의 평가 기록을 모아 종합상과 부문상을 발표합니다.':'명성·재정·주민 만족·공공서비스를 종합해 우수센터를 선정합니다.'}</p>:<>
        <strong className="ceremony-score">{rank}위 / {participants}개 센터 · {money(ending?finalScore(game.player):evaluation!.score)}점</strong>
        <p>{ceremonyStep===2?'주민의 배움과 만남을 지켜 온 센터장님의 시간을 기억하겠습니다.':honors.message}</p>
        {ceremonyStep===1&&<div className="ceremony-reasons"><span>{honors.reasonLabel}</span><b>{honors.reason}</b>{honors.category&&<p><strong>부문상 · {honors.category.title}</strong><br/>{honors.category.reason}</p>}</div>}
      </>}
      <button className="primary-button" onClick={()=>setCeremonyStep(v=>v+1)}>{ceremonyStep===0?'평가 결과 발표':ending&&ceremonyStep===1?'우리 센터의 마지막 인사':'종합 성적과 운영 기록 보기'}</button>
      <small className="ceremony-fiction">게임 속 가상 평가·시상 제도입니다.</small>
    </div></section>
  return <div className={`season-review ${evaluation ? 'has-evaluation' : ''}`}>
    {report.year===6&&report.season===3&&!ending&&<div className="final-year-notice"><strong>앞으로 1년 후, 최종 종합평가가 열립니다!</strong><br/>7년 차 봄에는 정기 예산에 특별 운영비 {wonAmount(FINAL_YEAR_BONUS)}원이 추가 지급됩니다. 마지막 네 계절을 준비하세요.</div>}
    {ending && <section className="final-award-summary" aria-label={`${MAX_YEARS}년 종합 최종상`}>
      <div className="final-award-heading"><Icon name="trophy" size={34} /><span>전국 문화체육센터 우수 운영사례 시상식 · 종합상</span></div>
      <div className="final-award-result"><div><h3>{finalAward || '우리 동네의 소중한 센터'}</h3><span>최종 <b>{finalRank}위</b> / {game.rivals.length + 1}개 센터</span></div><strong>{money(finalScore(game.player))}<small>점</small></strong></div>
      <p>종합평가 평균 50% + 마지막 평가 50%</p>
    </section>}
    {ceremony && <section className="review-honors" aria-label="선정 근거와 부문상">
      <div><span>{honors.reasonLabel}</span><strong>{honors.reason}</strong><p>{honors.message}</p></div>
      {honors.category&&<div className="review-category"><span>부문상 · {honors.category.score.toFixed(1)}점</span><h3>{honors.category.title}</h3><p>{honors.category.reason}</p></div>}
      <details><summary>부문상 선정 기준</summary><p>4개 평가 분야별 80점 이상이면서 참여 센터 중 최고점인 곳을 표창합니다. 동점은 공동 선정하며, 여러 분야에서 해당하면 가장 높은 점수의 부문상 1개만 받습니다. 최종 부문상은 평가 평균 50% + 마지막 평가 50%를 항목별로 적용합니다. 종합 순위·지원예산은 바뀌지 않습니다.</p></details>
    </section>}
    <SeasonBriefing report={report}/>
    {evaluation ? <>
      <div className={`evaluation-award evaluation-award--${awardStyle}`}>
        <span className="evaluation-award-emblem"><Icon name={evaluation.award ? 'trophy' : 'home'} size={43} /></span>
        <div><span className="eyebrow">{ending ? `${evaluation.year}년 차 운영성과 · 최종상과 별도` : evaluation.year===MAX_YEARS?`${MAX_YEARS}년 최종 연도 평가`:`${evaluation.year - 1}–${evaluation.year}년 운영성과 평가 · 우수센터 선정`}</span><h3>{ending ? '마지막 1년의 운영성과' : evaluationAward || '우리 센터의 성장 기록'}</h3><span className="evaluation-rank"><b>{evaluation.rank}위</b> / {participants}개 센터</span>{evaluation.partial && <small className="evaluation-partial">전환 이후 측정 {evaluation.measuredSeasons}계절</small>}</div>
        <div className="evaluation-total"><span>종합 점수</span><strong>{money(evaluation.score)}</strong><small>/ 100점</small></div>
      </div>
      <div className="evaluation-components" aria-label="네 가지 종합평가 항목">
        {EVALUATION_COMPONENTS.map((component) => {
          const score = evaluation.components[component.key]
          return <div key={component.key} title={`${formulaFor(component)} · 반영 비중 ${component.weight}%`}>
            <span>{component.label}<small>{component.weight}%</small></span>
            <div className="evaluation-meter" role="meter" aria-label={component.label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={score}><i style={{ width: `${Math.max(0, Math.min(100, score))}%` }} /></div>
            <b>{money(score)}</b>
          </div>
        })}
      </div>
      {nextBudget && <div className={`evaluation-budget ${evaluation.budgetChange < 0 ? 'is-reduced' : evaluation.budgetChange > 0 ? 'is-increased' : ''}`}>
        <Icon name="coin" size={27} />
        <div><span>{evaluation.appliesFromYear}–{evaluation.appliesThroughYear}년 연간 지원예산</span><strong>{wonAmount(evaluation.nextAnnualBudget)}<small>원 / 년</small></strong></div>
        <b>{signed(evaluation.budgetChange)}%</b>
      </div>}
      <details className="review-explanation"><summary>평가 기준과 계산 보기</summary><div>
        {EVALUATION_COMPONENTS.map((component) => <p key={component.key}><strong>{component.label} · {component.weight}%</strong><span>{formulaFor(component)}</span></p>)}
        <p><strong>지원예산 조정</strong><span>1·2·3위 +6·4·2%, 하위 3곳 −2·4·6%. 기본예산 {wonAmount(BASE_ANNUAL_BUDGET)}원에 적용하며 이전 증감과 누적하지 않아요.</span></p>
        {evaluation.partial && <p className="review-history-note">전환 이후 측정한 {evaluation.measuredSeasons}개 계절만 반영했어요. 이전 연간 점수는 소급 계산하지 않아요.</p>}
        <small>게임 속 기관·예산·포상은 창작 설정입니다.</small>
      </div></details>
      <details className="review-explanation review-operating-details"><summary>이번 계절 운영 내역</summary><OperationDetails report={report} /></details>
    </> : <>
      <div className="review-hero"><span className="review-medal"><Icon name="leaf" size={39} /></span><div><span className="eyebrow">{report.annual ? '연말 운영 결산' : '이번 계절의 기록'}</span><h3>{report.highlights[0] || '우리 센터에 새로운 하루가 쌓였어요.'}</h3>{report.warnings[0] && <p>{report.warnings[0]}</p>}</div></div>
      <div className="review-stats"><div><Icon name="people" /><span>이번 계절 이용</span><strong>{money(report.visits)}<small>회</small></strong></div><div><Icon name="coin" /><span>영업 잔액</span><strong>{signedWonAmount(report.profit)}<small>원</small></strong></div><div><Icon name="trophy" /><span>운영 참고 순위</span><strong>{report.rank}<small>/ {participants}곳</small></strong></div></div>
      <OperationDetails report={report} />
      <div className="review-finance"><span>가용예산 {wonAmount(freeCash(game.player))}원</span><span>종합평가 · 2 / 4 / 6 / 7년 차 겨울</span></div>
    </>}
    {ending && <HallRegistration game={game}/>}
    <div className="review-actions">
      <button className="secondary-button" onClick={onRivals}>다른 센터 살펴보기</button>
      <button className="primary-button" onClick={ending ? onReset : onContinue}>{ending ? `${MAX_YEARS}년 운영 완료 · 다시 시작` : report.year === MAX_YEARS && report.season === 3 ? `${MAX_YEARS}년 최종 결과 보기` : report.annual ? '새해를 맞이하기' : '다음 계절 계획하기'}<Icon name="arrow" size={16} /></button>
    </div>
  </div>
}

function OperationDetails({ report }: { report: SeasonReport }) {
  return <div className="operation-details">
    <OperationIssues report={report}/>
    {report.eventImpact && <p className="season-effect">{SEASON_EVENTS.find(e=>e.id===report.eventImpact!.id)?.title} · 지원금 {signedWonAmount(report.eventImpact.cash)}원 / 수입 조정 {signedWonAmount(report.eventImpact.revenue)}원 / 추가 비용 {wonAmount(report.eventImpact.cost)}원 / 명성 {signed(report.eventImpact.reputation)}</p>}
    <div className="review-business">
      <div><span>대관 운영</span><strong>{report.breakdownAvailable === false ? '—' : signedWonAmount(report.rentalRevenue)}<small>원</small></strong><p>{report.breakdownAvailable === false ? '이전 기록 · 세부 내역 없음' : `운영비 −${wonAmount(report.rentalCost)}원`}</p></div>
      <div><span>클래스 운영</span><strong>{report.breakdownAvailable === false ? '—' : signedWonAmount(report.classRevenue)}<small>원</small></strong><p>{report.breakdownAvailable === false ? '이전 기록 · 세부 내역 없음' : `운영비 −${wonAmount(report.classCost)}원`}</p></div>
      <div><span>명성 변화</span><strong>{report.breakdownAvailable === false ? '—' : signed(report.reputationChange)}</strong><p>이번 계절의 성장</p></div>
    </div>
    <div className="review-finance"><span>전체 수입 {wonAmount(report.revenue)}원</span><span>전체 지출 {wonAmount(report.cost)}원</span></div>
  </div>
}
