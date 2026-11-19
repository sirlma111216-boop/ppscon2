import { useState } from 'react'
import { playSound } from './audio'
import { signedWonAmount, wonAmount } from './currency'
import { midseasonAdvice } from './resultInsights'
import { OUTCOMES, OUTCOME_LABELS } from './simulation'
import type { MidseasonBrief, MidseasonChoice } from './simulation'
import './Insights.css'

const ART: Record<MidseasonChoice, { src: string; alt: string }> = {
  steady: { src: '/center/midseason-v1/meeting.webp', alt: '달력 앞에서 계절 중간 회의를 하는 직원들' },
  promotion: { src: '/center/midseason-v1/promotion.webp', alt: '동네 게시판에 포스터를 붙이고 전단을 나눠 주는 직원들' },
  repair: { src: '/center/midseason-v1/repair.webp', alt: '수업 사이에 운동 기구를 손보는 시설 담당 직원' },
}

/** Rules 3: the one decision of the season, taken with the first six weeks on the table. */
export default function MidseasonMeeting({ brief, onDecide }: { brief: MidseasonBrief; onDecide: (choice: MidseasonChoice) => void }) {
  const [picked, setPicked] = useState<MidseasonChoice>('steady')
  const net = Math.round((brief.revenue - brief.cost) * 100) / 100, drawn = brief.tally.reduce((a, b) => a + b, 0)
  const option = brief.options.find(item => item.id === picked)!
  return <div className="midseason-meeting">
    <img src={ART[picked].src} alt={ART[picked].alt} />
    <div className="midseason-copy">
      <span className="eyebrow">7주 차 · 계절 중간 점검</span>
      <p>여섯 주를 운영했어요. 남은 일곱 주를 어떻게 보낼지 한 가지만 정해 주세요.</p>
      <dl className="midseason-figures">
        <div><dt>여섯 주 영업</dt><dd>{signedWonAmount(net)}원</dd></div>
        <div><dt>방문</dt><dd>{brief.visits.toLocaleString('ko-KR')}회</dd></div>
        <div><dt>수업 빈자리</dt><dd>{brief.classSeats ? `${brief.emptySeats}석 / ${brief.classSeats}석` : '연 수업 없음'}</dd></div>
        <div><dt>쓸 수 있는 현금</dt><dd>{wonAmount(brief.cash)}원</dd></div>
      </dl>
      {drawn > 0 && <p className="midseason-tally">수업 주간 결과 · {OUTCOMES.map((outcome, index) => `${OUTCOME_LABELS[outcome]} ${brief.tally[index]}`).join(' · ')}</p>}
      <ul className="midseason-advice">{midseasonAdvice(brief).map(line => <li key={line}>{line}</li>)}</ul>
      <fieldset className="season-choices"><legend>센터장님, 남은 일곱 주는요?</legend>
        {brief.options.map(item => <label key={item.id} className={`${picked === item.id ? 'is-picked' : ''} ${item.affordable ? '' : 'is-blocked'}`}>
          <input type="radio" name="midseason-choice" aria-label={`${item.label} · ${item.affordable ? item.effect : '현금 부족'}`} checked={picked === item.id} disabled={!item.affordable} onChange={() => { setPicked(item.id); playSound('select') }} />
          <span><strong>{item.label}{item.cost ? ` · ${wonAmount(item.cost)}원` : ''}</strong><small>{item.description}</small><em>{item.affordable ? item.effect : '쓸 수 있는 현금이 모자라요'}</em></span>
        </label>)}
        <small>고른 내용은 7주 차부터 적용돼요. 창을 닫으면 운영을 시작하지 않고 계획으로 돌아가요.</small>
      </fieldset>
      <button className="primary-button" onClick={() => { playSound('event_choice'); onDecide(picked) }}>{option.label}{option.cost ? ` (${wonAmount(option.cost)}원)` : ''} · 남은 7주 운영</button>
    </div>
  </div>
}
