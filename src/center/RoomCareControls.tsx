import { useState } from 'react'
import { freeCash, getLevel, maintainRoom, trainStaff, ROOM_NAMES } from './simulation'
import type { GameState, RoomId, MutationResult, Expertise } from './simulation'
import ConditionBadge from './ConditionBadge'

export default function RoomCareControls({ game, room, canEdit, onAct }: { game: GameState; room: RoomId; canEdit: boolean; onAct: (result: MutationResult, message: string) => void }) {
  const [field, setField] = useState<Expertise>('culture')
  const p = game.player
  const target = p.rooms.find(r => r.id === room)!
  const gear = p.inventory.filter(e => !e.stored && e.room === room)
  const pending = p.pendingTasks.some(t => t.kind === 'maintain' && t.room === room)
  const needsCare = target.management < 100 || gear.some(e => e.condition < 100)
  const cashOk = freeCash(p) >= 12
  const repairReason = pending ? '정비 예약됨' : !canEdit ? '계획 단계에서 예약' : !needsCare ? '정비 불필요' : !cashOk ? '예산 부족' : ''
  const trainingReason = p.trained ? '이번 계절 교육 예약 완료' : !canEdit ? '계획 단계에서 예약' : !p.xp[field] ? '해당 분야 운영 후 가능' : !cashOk ? '예산 부족' : ''
  const fields = { culture: '문화', sport: '체육', event: '행사' }
  return <section className="room-care-controls" aria-label="시설 정비와 직원 교육">
    <div className="room-care-item">
      <strong>시설·장비 정비 <small>{ROOM_NAMES[room]}</small></strong>
      <p>시설 관리 +35 · 이 방 장비 상태 +40</p>
      {gear.length > 0 && <ConditionBadge label="장비 최저 상태" value={Math.min(...gear.map(e => e.condition))} />}
      <button disabled={!!repairReason} onClick={() => onAct(maintainRoom(game, room), ROOM_NAMES[room] + ' 정비 예약 · 다음 운영 때 시설 +35, 장비 +40')}>{repairReason || '정비 예약 · 120,000원'}</button>
      <small>다음 운영 때 회복 · 최대 100 · 사용하면 마모</small>
    </div>
    <div className="room-care-item">
      <strong>직원 교육 <small>센터 전체 · 계절당 1회</small></strong>
      <p>운영 숙련을 높여 수업의 질을 개선해요.</p>
      <label>교육 분야 <select aria-label="직원 교육 분야" value={field} disabled={!canEdit || p.trained} onChange={e => setField(e.target.value as Expertise)}>{Object.entries(fields).map(([key, name]) => <option key={key} value={key}>{name} · 숙련 {getLevel(p.xp[key as Expertise])}</option>)}</select></label>
      <button disabled={!!trainingReason} onClick={() => onAct(trainStaff(game, field), fields[field] + ' 직원 교육 예약 · 다음 운영 때 경험치 +10')}>{trainingReason || '교육 예약 · 120,000원'}</button>
      <small>다음 운영 때 선택 분야 경험치 +10</small>
    </div>
  </section>
}
