import { BLOCKS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, isRentalProgram } from './simulation'
import type { GameState, RoomId } from './simulation'
import { getFacilityProject } from './facilityProjects'
import './RoomScheduleSummary.css'

type OccupancyKind = 'rental' | 'class' | 'empty' | 'closed'
const LABELS: Record<OccupancyKind, string> = { rental: '대관', class: '클래스', empty: '빈 시간', closed: '미개방' }
const money = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

function occupancyAt(game: GameState, room: RoomId, slot: number): { kind: OccupancyKind; label: string } {
  const prefix = `${ROOM_NAMES[room]} · ${BLOCKS[slot]} · `
  if (!game.player.rooms.find(item => item.id === room)?.open) {
    return { kind: 'closed', label: prefix + '미개방' + (getFacilityProject(game.player, room)?.stage === 'construction' ? ' · 시공 중' : '') }
  }
  const rental = game.player.rentalRequests.find(request => request.room === room && request.slot === slot && request.status === 'accepted')
  if (rental) return { kind: 'rental', label: prefix + `대관: ${rental.title} · ${rental.client}` }
  const program = PROGRAMS.find(item => item.id === game.player.plan[room][slot] && !isRentalProgram(item.id))
  return program ? { kind: 'class', label: prefix + `클래스: ${program.name}` } : { kind: 'empty', label: prefix + '빈 시간' }
}

interface RoomScheduleSummaryProps {
  game: GameState
  selectedRoom?: RoomId
  overview?: boolean
  onSelectRoom?: (room: RoomId) => void
}

export default function RoomScheduleSummary({ game, selectedRoom, overview = false, onSelectRoom }: RoomScheduleSummaryProps) {
  const rows = ROOM_DEFINITIONS.map(room => ({ ...room, slots: BLOCKS.map((_, slot) => occupancyAt(game, room.id, slot)) }))
  const counts = rows.flatMap(room => room.slots).reduce<Record<OccupancyKind, number>>((sum, slot) => ({ ...sum, [slot.kind]: sum[slot.kind] + 1 }), { rental: 0, class: 0, empty: 0, closed: 0 })
  const accepted = game.player.rentalRequests.filter(request => request.status === 'accepted')
  const fee = accepted.reduce((sum, request) => sum + request.fee, 0)
  const cost = accepted.reduce((sum, request) => sum + request.cost, 0)

  return <section className={`room-schedule-summary ${overview ? 'room-schedule-summary--overview' : ''}`} aria-label="전체 7개 공간 주간 편성 현황">
    <div className="room-summary-heading"><h2>전체 공간 현황</h2><p>대관 <b>{counts.rental}</b> · 클래스 <b>{counts.class}</b><small>칸 / 주</small></p></div>
    <div className="room-summary-legend" aria-label="현황 범례">{(Object.keys(LABELS) as OccupancyKind[]).map(kind => <span key={kind}><i className={`room-summary-slot is-${kind}`} aria-hidden="true" />{LABELS[kind]}</span>)}</div>
    <div className="room-summary-rooms">{rows.map(room => {
      const content = <><span className="room-summary-name">{room.name}</span><span className="room-summary-bar" role="group" aria-label={`${room.name} 주간 편성`}>{room.slots.map((slot, index) => <i key={index} className={`room-summary-slot is-${slot.kind}`} title={slot.label} role="img" aria-label={slot.label} />)}</span></>
      return onSelectRoom ? <button type="button" key={room.id} className={`room-summary-row ${selectedRoom === room.id ? 'is-selected' : ''}`} onClick={() => onSelectRoom(room.id)} aria-label={`${room.name} 현황 · 방으로 이동`} aria-current={selectedRoom === room.id ? 'location' : undefined}>{content}</button> : <div key={room.id} className="room-summary-row">{content}</div>
    })}</div>
    <dl className="room-summary-finance" aria-label="승인 대관의 주간 수입 예상"><div><dt>대관 수입</dt><dd>+{money(fee)}</dd></div><div><dt>대관 운영비</dt><dd>−{money(cost)}</dd></div><div><dt>대관 잔액</dt><dd>+{money(fee - cost)}<small>점/주</small></dd></div></dl>
  </section>
}
