import type { SeasonReport } from './simulation'
import { seasonBriefing } from './briefingAnalysis'
import { signedWonAmount } from './currency'
export default function SeasonBriefing({report}:{report:SeasonReport}) {
  const brief=seasonBriefing(report),peer=report.peerComparison
  const n=(value:number)=>value.toLocaleString('ko-KR',{maximumFractionDigits:1})
  return <section className="season-briefing" aria-label="오지선의 계절 브리핑">
    <div className="briefing-speaker"><img src="/center/jiseon-portrait.webp" alt="운영팀장 오지선"/><strong>오지선<small>운영팀장</small></strong></div>
    <div className="briefing-content"><h3>센터장님, 이번 계절은요</h3><dl>
      <div><dt>이번 성과</dt><dd>{brief.good}</dd></div><div><dt>살펴볼 점</dt><dd>{brief.improve}</dd></div><div><dt>다음 전략</dt><dd>{brief.action}</dd></div><div><dt>상위권 전략</dt><dd>{brief.target}</dd></div>
    </dl>
    {peer&&report.serviceMix?<details><summary>다른 {peer.count}개 센터 평균과 비교</summary><table><caption>같은 계절 13주 실제 실적 · 이용은 누적 참여 횟수</caption><thead><tr><th>항목</th><th>우리 센터</th><th>다른 센터 평균</th></tr></thead><tbody>
      {([['수업 이용',report.serviceMix.classVisits,peer.serviceMix.classVisits],['대관 이용',report.serviceMix.rentalVisits,peer.serviceMix.rentalVisits],['무료 수업 이용',report.serviceMix.freeClassVisits,peer.serviceMix.freeClassVisits]] as const).map(([label,ours,others])=><tr key={label}><th>{label}</th><td>{n(ours)}회</td><td>{n(others)}회</td></tr>)}
      <tr><th>운영수지</th><td>{signedWonAmount(report.profit)}원</td><td>{signedWonAmount(peer.profit)}원</td></tr><tr><th>명성 변화</th><td>{n(report.reputationChange)}</td><td>{n(peer.reputationChange)}</td></tr>
    </tbody></table></details>:<small>이전 운영 기록에는 같은 계절의 센터별 비교 자료가 없어요.</small>}
    <p className="briefing-note">{brief.context}</p></div>
  </section>
}
