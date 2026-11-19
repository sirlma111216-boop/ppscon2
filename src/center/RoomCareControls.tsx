import { useState } from 'react'
import { STAFF_LEVELS, STAFF_MAX_LEVEL, answeredEvent, freeCash, getLevel, maintainRoom, moodOdds, outcomeOdds, staffLevel, trainStaff, trainingCost, ROOM_NAMES } from './simulation'
import type { GameState, RoomId, MutationResult, Expertise } from './simulation'
import { wonAmount } from './currency'
import ConditionBadge from './ConditionBadge'

const FIELDS: Record<Expertise, string> = { culture: '문화', sport: '체육', event: '행사' }
const percent = (value: number) => `${Math.round(value * 100)}%`

export default function RoomCareControls({ game, room, canEdit, onAct }: { game: GameState; room: RoomId; canEdit: boolean; onAct: (result: MutationResult, message: string) => void }) {
  const [field, setField] = useState<Expertise>('culture')
  const p = game.player, rules3 = game.rules === 3
  const target = p.rooms.find(r => r.id === room)!
  const gear = p.inventory.filter(e => !e.stored && e.room === room)
  const pending = p.pendingTasks.some(t => t.kind === 'maintain' && t.room === room)
  const needsCare = target.management < 100 || gear.some(e => e.condition < 100)
  const repairReason = pending ? '정비 예약됨' : !canEdit ? '계획 단계에서 예약' : !needsCare ? '정비 불필요' : freeCash(p) < 12 ? '예산 부족' : ''
  const level = staffLevel(p.xp[field], game.rules), price = trainingCost(level, game.rules), maxed = rules3 && level >= STAFF_MAX_LEVEL
  const booked = p.pendingTasks.find(t => t.kind === 'train')?.expertise
  const trainingReason = rules3 && canEdit && !p.trained && answeredEvent(game, p)?.noTraining ? '행정 점검 서류 정비 중 · 이번 계절 교육 불가' : p.trained ? `${booked ? FIELDS[booked] + ' ' : ''}교육 예약 완료` : !canEdit ? '계획 단계에서 예약' : maxed ? '최고 단계 도달' : !rules3 && !p.xp[field] ? '해당 분야 운영 후 가능' : freeCash(p) < price ? '예산 부족' : ''
  const now = outcomeOdds(level), next = outcomeOdds(Math.min(STAFF_MAX_LEVEL, level + 1)), mood = moodOdds(level), nextMood = moodOdds(Math.min(STAFF_MAX_LEVEL, level + 1))
  const floor = STAFF_LEVELS[level] ?? 0, ceiling = STAFF_LEVELS[level + 1]
  const progress = ceiling === undefined ? 100 : Math.round((p.xp[field] - floor) / (ceiling - floor) * 100)
  return <section className="room-care-controls" aria-label="시설 정비와 직원 교육">
    <div className="room-care-item">
      <strong>시설·장비 정비 <small>{ROOM_NAMES[room]}</small></strong>
      <p>시설 관리 +35 · 이 방 장비 상태 +40</p>
      {gear.length > 0 && <ConditionBadge label="장비 최저 상태" value={Math.min(...gear.map(e => e.condition))} />}
      <button disabled={!!repairReason} onClick={() => onAct(maintainRoom(game, room), ROOM_NAMES[room] + ' 정비 예약 · 다음 운영 때 시설 +35, 장비 +40')}>{repairReason || '정비 예약 · 120,000원'}</button>
      <small>다음 운영 때 회복 · 최대 100 · 사용하면 마모</small>
    </div>
    {rules3 ? <div className="room-care-item staff-training">
      <strong>직원 교육 <small>센터 전체 · 계절당 한 분야</small></strong>
      <div className="staff-training-intro"><img src={`/center/training-v1/training-${field}.webp`} alt={`${FIELDS[field]} 분야 직원 교육 장면`} loading="lazy" draggable={false} /><p>교육 단계가 높을수록 수업이 잘 풀릴 확률이 올라요. 그래도 결과는 매번 달라요.</p></div>
      <div className="staff-levels" role="group" aria-label="교육할 분야">{(Object.keys(FIELDS) as Expertise[]).map(key => {
        const value = staffLevel(p.xp[key], 3)
        return <button key={key} type="button" className={field === key ? 'is-current' : ''} aria-pressed={field === key} onClick={() => setField(key)}>{FIELDS[key]}<b>Lv.{value}</b><span className="staff-pips" aria-hidden="true">{Array.from({ length: STAFF_MAX_LEVEL }, (_, index) => <i key={index} className={index < value ? 'is-on' : ''} />)}</span></button>
      })}</div>
      <div className="staff-progress" role="meter" aria-label={`${FIELDS[field]} 다음 단계까지`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><i style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} /></div>
      <table className="staff-odds"><caption>{FIELDS[field]} 수업의 한 주 결과 확률</caption><thead><tr><th></th><th>대호응</th><th>순조</th><th>평범</th><th>아쉬움</th><th>부진한 계절</th></tr></thead><tbody>
        <tr><th>지금 Lv.{level}</th><td>{percent(now.great)}</td><td>{percent(now.good)}</td><td>{percent(now.flat)}</td><td>{percent(now.poor)}</td><td>{percent(mood.cold)}</td></tr>
        {!maxed && <tr className="is-next"><th>Lv.{level + 1}이면</th><td>{percent(next.great)}</td><td>{percent(next.good)}</td><td>{percent(next.flat)}</td><td>{percent(next.poor)}</td><td>{percent(nextMood.cold)}</td></tr>}
      </tbody></table>
      <button disabled={!!trainingReason} onClick={() => onAct(trainStaff(game, field), `${FIELDS[field]} 직원 교육 예약 · 성과는 운영 뒤에 알 수 있어요`)}>{trainingReason || `${FIELDS[field]} 교육 예약 · ${wonAmount(price)}원`}</button>
      <small>교육 성과는 그때그때 달라요(14~36점). {ceiling === undefined ? '최고 단계예요.' : `다음 단계까지 ${Math.max(0, Math.ceil(ceiling - p.xp[field]))}점 남았어요.`} 단계가 오를수록 교육비도 올라요.</small>
    </div> : <div className="room-care-item">
      <strong>직원 교육 <small>센터 전체 · 계절당 1회</small></strong>
      <p>운영 숙련을 높여 수업의 질을 개선해요.</p>
      <label>교육 분야 <select aria-label="직원 교육 분야" value={field} disabled={!canEdit || p.trained} onChange={e => setField(e.target.value as Expertise)}>{Object.entries(FIELDS).map(([key, name]) => <option key={key} value={key}>{name} · 숙련 {getLevel(p.xp[key as Expertise])}</option>)}</select></label>
      <button disabled={!!trainingReason} onClick={() => onAct(trainStaff(game, field), FIELDS[field] + ' 직원 교육 예약 · 다음 운영 때 경험치 +10')}>{trainingReason || '교육 예약 · 120,000원'}</button>
      <small>다음 운영 때 선택 분야 경험치 +10</small>
    </div>}
  </section>
}
