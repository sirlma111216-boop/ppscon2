import type { GameState, SeasonReport } from './simulation'
import { operatingProfile, standingTone } from './resultInsights'
import { briefingMood, seasonBriefing } from './briefingAnalysis'
import { signedWonAmount } from './currency'
export default function SeasonBriefing({report,game}:{report:SeasonReport;game?:GameState}) {
  const brief=seasonBriefing(report),peer=report.peerComparison,mood=briefingMood(report)
  const profile=game&&game.history.length?operatingProfile(game,report):null
  const n=(value:number)=>value.toLocaleString('ko-KR',{maximumFractionDigits:1})
  return <section className="season-briefing" aria-label="오지선의 계절 브리핑">
    <div className="briefing-speaker"><img className="is-mood" key={mood} src={`/center/jiseon-${mood}.webp`} alt={`운영팀장 오지선 · ${mood==='glad'?'밝게 웃는 표정':mood==='worried'?'걱정스럽게 생각하는 표정':'다짐하는 표정'}`} onError={(event)=>{if(!event.currentTarget.dataset.fallback){event.currentTarget.dataset.fallback='true';event.currentTarget.className='';event.currentTarget.src='/center/jiseon-portrait.webp'}}}/><strong>오지선<small>운영팀장</small></strong></div>
    <div className="briefing-content"><h3>센터장님, 이번 계절은요</h3><dl>
      <div><dt>이번 성과</dt><dd>{brief.good}</dd></div><div><dt>살펴볼 점</dt><dd>{brief.improve}</dd></div><div><dt>다음 전략</dt><dd>{brief.action}</dd></div><div><dt>상위권 전략</dt><dd>{brief.target}</dd></div>
    </dl>
    {profile&&<section className="briefing-profile" aria-label="지금까지의 운영 스타일과 전략">
      <h4>센터장님의 운영 스타일 <b>{profile.style}</b>{profile.traits.map(trait=><span key={trait}>{trait}</span>)}</h4>
      <p>{profile.summary}</p>
      <ul className="briefing-balance" aria-label="평가 항목별로 다른 센터와 견준 위치">{profile.balance.map(item=><li key={item.key} className={`grade-${standingTone(item.standing)} ${item.weakest?'is-weakest':''}`}><small>{item.label}</small><b>{item.standing}</b>{item.weakest&&<em>보완 1순위</em>}{item.strongest&&!item.weakest&&<em className="is-strong">강점</em>}</li>)}</ul>
      <h4>다음에 해 볼 일</h4>
      <ol className="briefing-strategies">{profile.strategies.map(text=><li key={text}>{text}</li>)}</ol>
    </section>}
    {peer&&report.serviceMix?<details><summary>다른 {peer.count}개 센터 평균과 비교</summary><table><caption>같은 계절 13주 실제 실적 · 이용은 누적 참여 횟수</caption><thead><tr><th>항목</th><th>우리 센터</th><th>다른 센터 평균</th></tr></thead><tbody>
      {([['수업 이용',report.serviceMix.classVisits,peer.serviceMix.classVisits],['대관 이용',report.serviceMix.rentalVisits,peer.serviceMix.rentalVisits],['무료 수업 이용',report.serviceMix.freeClassVisits,peer.serviceMix.freeClassVisits]] as const).map(([label,ours,others])=><tr key={label}><th>{label}</th><td>{n(ours)}회</td><td>{n(others)}회</td></tr>)}
      <tr><th>운영수지</th><td>{signedWonAmount(report.profit)}원</td><td>{signedWonAmount(peer.profit)}원</td></tr><tr><th>명성 변화</th><td>{n(report.reputationChange)}</td><td>{n(peer.reputationChange)}</td></tr>
    </tbody></table></details>:<small>이전 운영 기록에는 같은 계절의 센터별 비교 자료가 없어요.</small>}
    <p className="briefing-note">{brief.context}</p></div>
  </section>
}
