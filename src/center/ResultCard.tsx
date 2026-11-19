import { BLOCKS, MOOD_LABELS, OUTCOMES, OUTCOME_LABELS, ROOM_NAMES } from './simulation'
import type { SessionSummary } from './simulation'
import { signedWonAmount } from './currency'
import { gradeOf, gradeTone, outcomeArt, programName, sessionNet } from './resultInsights'
import './ResultCard.css'
import './Insights.css'

const signed = (value: number, digits = 2) => `${value > 0 ? '+' : value < 0 ? '−' : '±'}${Math.abs(value).toLocaleString('ko-KR', { maximumFractionDigits: digits, minimumFractionDigits: value !== 0 && Math.abs(value) < 1 ? digits : 0 })}`
const tone = (value: number) => value > 0 ? 'is-up' : value < 0 ? 'is-down' : 'is-flat'

/** One class or let, with what it changed over the season it just ran. */
export function SessionResultCard({ session, compact = false }: { session: SessionSummary; compact?: boolean }) {
  const net = sessionNet(session), drawn = session.tally.reduce((a, b) => a + b, 0), grade = gradeOf(session.satisfaction), art = outcomeArt(session)
  return <article className={`result-card ${compact ? 'is-compact' : ''} ${session.rental ? 'is-rental' : ''} ${art ? 'has-art' : ''}`} aria-label={`${ROOM_NAMES[session.room]} ${BLOCKS[session.slot]} ${programName(session.program)} 결과`}>
    {art && <img className="result-art" src={art.src} alt={art.alt} loading="lazy" draggable={false} />}
    <header>
      <span className="result-card-kind">{session.rental ? '대관' : '클래스'}</span>
      <strong>{programName(session.program)}</strong>
      <small>{ROOM_NAMES[session.room]} · {BLOCKS[session.slot]} · {session.weeks}주 운영</small>
      {session.mood && session.mood !== 'steady' && <em className={`result-mood is-${session.mood}`}>{session.mood === 'hot' ? '▲' : '▼'} 이번 계절 {MOOD_LABELS[session.mood]}</em>}
    </header>
    <div className="result-deltas">
      <span className={tone(net)}><small>순수입</small><b>{signedWonAmount(net)}원</b><i>수입 {signedWonAmount(session.revenue)} · 비용 −{Math.abs(Math.round(session.cost * 10000)).toLocaleString('ko-KR')}</i></span>
      <span className={tone(session.reputation)}><small>명성</small><b>{signed(session.reputation)}</b><i>{session.reputation > 0 ? '이름을 알렸어요' : session.reputation < 0 ? '평판이 깎였어요' : '변화 없음'}</i></span>
      <span className="is-flat"><small>이용</small><b>{session.attendees.toLocaleString('ko-KR')}명</b><i>주 평균 {(session.attendees / Math.max(1, session.weeks)).toFixed(1)}명</i></span>
      <span className={`grade-${gradeTone(grade)}`}><small>만족</small><b>{grade}</b><i>{session.rental ? '이용 단체 반응' : '수강생 반응'}</i></span>
    </div>
    {drawn > 0 && <div className="result-tally" role="img" aria-label={OUTCOMES.map((key, index) => `${OUTCOME_LABELS[key]} ${session.tally[index]}주`).join(', ')}>
      <div className="result-tally-bar">{OUTCOMES.map((key, index) => session.tally[index] > 0 && <i key={key} className={`is-${key}`} style={{ flexGrow: session.tally[index] }} />)}</div>
      <div className="result-tally-legend">{OUTCOMES.map((key, index) => session.tally[index] > 0 && <span key={key} className={`is-${key}`}>{OUTCOME_LABELS[key]} {session.tally[index]}주</span>)}</div>
    </div>}
  </article>
}

/** Running totals while the operation tour walks the rooms. */
export function RunningTotals({ sessions, upTo }: { sessions: SessionSummary[]; upTo: number }) {
  const seen = sessions.slice(0, upTo + 1)
  const net = seen.reduce((sum, session) => sum + sessionNet(session), 0), reputation = seen.reduce((sum, session) => sum + session.reputation, 0), visits = seen.reduce((sum, session) => sum + session.attendees, 0)
  return <div className="running-totals" aria-live="off" aria-label="지금까지 살펴본 활동의 합계">
    <span>살펴본 활동 <b>{seen.length}/{sessions.length}</b></span>
    <span className={tone(net)}>순수입 <b>{signedWonAmount(Math.round(net * 100) / 100)}원</b></span>
    <span className={tone(reputation)}>명성 <b>{signed(Math.round(reputation * 100) / 100)}</b></span>
    <span>이용 <b>{visits.toLocaleString('ko-KR')}명</b></span>
  </div>
}
