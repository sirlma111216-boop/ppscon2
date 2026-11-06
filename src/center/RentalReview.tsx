import { useRef } from 'react'
import Icon from './Icon'
import { BLOCKS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, getRoomManagement, isRentalProgram } from './simulation'
import type { GameState, RentalRequest, RoomId } from './simulation'
import { getFacilityProject } from './facilityProjects'
import './RentalReview.css'

interface RentalReviewProps {
  game: GameState
  room: RoomId
  onRoomChange: (room: RoomId) => void
  onDecide: (id: string, status: RentalRequest['status']) => void
  onClearClass: (slot: number) => void
  onOpenFacility: (room: RoomId) => void
}
const money = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

/** Furnished floor plans, without people; dimensions are explained by the room labels. */
function RoomSketch({ room }: { room: RoomId }) {
  const lecture = ['A', 'C', 'D', 'F'].includes(room)
  const width = room === 'C' ? 112 : room === 'G' ? 72 : room === 'E' ? 80 : 96
  const height = room === 'C' || room === 'B' ? 65 : 54
  const left = (128 - width) / 2, top = (83 - height) / 2
  return <svg className={`rental-room-sketch sketch-${room}`} viewBox="0 0 128 83" fill="none" aria-hidden="true">
    <path d={`M${left} ${top + height}V${top}H${left + width}V${top + height}H${left + 23}m-12 0H${left}`} stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity=".055" />
    <path d={`M${left + 11} ${top + height}v-12q12 0 12 12`} stroke="currentColor" opacity=".35" />
    {lecture && <><rect x="43" y={top + 6} width="42" height={room === 'C' ? 9 : 4} rx="1" fill="currentColor" opacity=".45" />{Array.from({ length: room === 'C' ? 18 : 12 }, (_, i) => <rect key={i} x={35 + (i % 6) * 10} y={top + 22 + Math.floor(i / 6) * 12} width="6" height="7" rx="1" fill="currentColor" opacity=".35" />)}</>}
    {room === 'B' && <>{Array.from({ length: 6 }, (_, i) => <rect key={i} x={29 + i % 3 * 25} y={20 + Math.floor(i / 3) * 25} width="14" height="20" rx="2" stroke="currentColor" fill="currentColor" fillOpacity=".15" />)}<path d="M24 12h80" stroke="currentColor" strokeWidth="3" opacity=".3" /></>}
    {room === 'E' && <>{[37, 72].map((x) => <g key={x}><rect x={x} y="30" width="22" height="24" fill="currentColor" opacity=".2" /><path d={`M${x - 4} 33v5m0 7v5m30-17v5m0 7v5`} stroke="currentColor" strokeWidth="3" opacity=".6" /></g>)}<path d="M31 20h63" stroke="currentColor" strokeWidth="5" opacity=".3" /></>}
    {room === 'G' && <><rect x="47" y="26" width="34" height="30" rx="9" fill="currentColor" opacity=".2" /><path d="M42 31v6m0 8v6m44-20v6m0 8v6M52 21h8m8 0h8M52 61h8m8 0h8" stroke="currentColor" strokeWidth="3" opacity=".55" /></>}
  </svg>
}

export default function RentalReview({ game, room, onRoomChange, onDecide, onClearClass, onOpenFacility }: RentalReviewProps) {
  const requests = game.player.rentalRequests
  const accepted = requests.filter((request) => request.status === 'accepted')
  const definition = ROOM_DEFINITIONS.find((item) => item.id === room)!
  const roomRequests = requests.filter((request) => request.room === room)
  const roomOpen = game.player.rooms.find((item) => item.id === room)?.open
  const project = getFacilityProject(game.player, room)
  const panel = useRef<HTMLElement>(null)
  const weeklyFee = accepted.reduce((sum, request) => sum + request.fee, 0)
  const weeklyCost = accepted.reduce((sum, request) => sum + request.cost, 0)
  function chooseRoom(id: RoomId) {
    onRoomChange(id)
    if (window.matchMedia('(max-width: 600px)').matches) requestAnimationFrame(() => panel.current?.scrollIntoView({ block: 'start', behavior: 'auto' }))
  }

  return <section className="rental-review" aria-label="대관 신청 검토">
    <div className="rental-intro"><div><span className="small-overline">01 · 이번 계절의 대관 신청</span><h2>어떤 모임에 문을 열까요?</h2></div><div className="rental-intro-state"><p>대관은 운영 수입, 클래스는 센터 명성.</p><span>센터 명성 <b>{Math.round(game.player.reputation)}</b><i /> 주민 신뢰 <b>{Math.round(game.player.trust)}</b></span></div></div>
    <div className="rental-room-list" role="group" aria-label="대관 신청을 확인할 공간">{ROOM_DEFINITIONS.map((item) => {
      const inRoom = requests.filter((request) => request.room === item.id)
      const approved = inRoom.filter((request) => request.status === 'accepted').length
      const pending = inRoom.filter((request) => request.status === 'pending').length
      const isOpen = game.player.rooms.find((entry) => entry.id === item.id)?.open
      const construction = getFacilityProject(game.player,item.id)?.stage === 'construction'
      return <button key={item.id} className={`rental-room-card ${room === item.id ? 'is-selected' : ''}`} onClick={() => chooseRoom(item.id)} aria-pressed={room === item.id}>
        <span className="rental-room-code">{item.id}<small>{!isOpen ? construction ? '시공 중' : '시설 개방 필요' : approved ? `${approved}건 승인` : pending ? `${pending}건 접수` : '검토 완료'}</small></span>
        <RoomSketch room={item.id} /><strong>{item.name}</strong><span>{item.area}㎡ <i /> {item.capacity}명</span>
        <span className="rental-room-times" aria-label={`승인한 시간 ${approved}칸`}>{BLOCKS.map((block, index) => <i key={block} className={accepted.some((request) => request.room === item.id && request.slot === index) ? 'is-booked' : ''} />)}</span>
      </button>
    })}</div>

    <div className="rental-columns">
      <section className="rental-applications" ref={panel} aria-label={`${ROOM_NAMES[room]} 대관 신청`}>
        <div className="rental-room-heading"><div><h3>{definition.name}<span>{roomRequests.length}건</span></h3><p>{definition.description}</p></div><span className="rental-management"><Icon name="check" size={15} />관리 신뢰 <b>{Math.round(getRoomManagement(game.player, room))}</b></span></div>
        {!roomOpen ? <div className="rental-facility-gateway"><Icon name="lock" size={34}/><h4>{project?.stage === 'construction' ? `개방까지 ${project.remainingWeeks}주` : '더 높은 대관료를 위한 새 공간'}</h4><p>나라장터에 시설 조성 공고를 내고<br/>업체를 비교해 시공을 진행하세요.</p><button className="primary-button" onClick={()=>onOpenFacility(room)}>{project?.stage === 'construction' ? '시공 현황 보기' : '시설 입찰 진행'}<Icon name="arrow" size={16}/></button></div> : <div className="rental-app-list">{BLOCKS.map((block, slot) => {
          const inSlot = roomRequests.filter((request) => request.slot === slot)
          const existingClass = PROGRAMS.find((program) => program.id === game.player.plan[room][slot] && !isRentalProgram(program.id))
          return <div key={block} className="rental-time-group"><div className="rental-time-label"><Icon name="calendar" size={15} /><strong>{block}</strong><small>매주</small></div>{inSlot.length ? <div className="rental-time-requests">{existingClass && <div className="rental-class-conflict"><span>기존 {existingClass.shortName} 클래스 편성 중</span><button onClick={() => onClearClass(slot)}>클래스 비우기</button></div>}{inSlot.map((request) => {
            const conflict = accepted.find((other) => other.room === room && other.slot === slot && other.id !== request.id)
            return <article className={`rental-request-row is-${request.status}`} key={request.id}>
              <div className="rental-request-copy"><span className="rental-client">{request.client}</span><h4>{request.title}</h4><span className="rental-request-meta"><Icon name="people" size={13} />{request.attendees}명{request.status === 'accepted' ? <b>승인됨</b> : request.status === 'declined' ? <em>거절함</em> : conflict ? <em>같은 시간에 다른 대관 승인됨</em> : inSlot.length > 1 ? <em>같은 시간의 신청 중 선택</em> : null}</span></div>
              <div className="rental-request-fee"><strong>{money(request.fee)}<small>점 / 주</small></strong><span>운영비 {money(request.cost)}점</span></div>
              <div className="rental-request-actions">{request.status === 'accepted' ? <button className="rental-undo" onClick={() => onDecide(request.id, 'pending')}>승인 취소</button> : request.status === 'declined' ? <button className="rental-undo" onClick={() => onDecide(request.id, 'pending')}>다시 검토</button> : <><button className="rental-decline" onClick={() => onDecide(request.id, 'declined')}>거절</button><button className="rental-accept" disabled={Boolean(conflict)} onClick={() => onDecide(request.id, 'accepted')}><Icon name="check" size={14} />승인</button></>}</div>
            </article>
          })}</div> : <div className="rental-no-request">접수 없음 <span>{existingClass ? `${existingClass.shortName} 클래스 편성 중` : '클래스를 편성할 수 있어요'}</span></div>}</div>
        })}</div>}
      </section>

      <aside className="rental-summary" aria-label="대관 승인 요약"><div className="rental-ledger"><span className="small-overline">이번 계절에 승인한 대관</span><h3>{accepted.length}<small>건 / 주</small></h3><div className="rental-ledger-rooms">{ROOM_DEFINITIONS.map((item) => <div key={item.id}><span>{item.name}</span><div>{BLOCKS.map((block, slot) => <i title={block} key={block} className={accepted.some((request) => request.room === item.id && request.slot === slot) ? 'is-booked' : ''} />)}</div></div>)}</div><dl><div><dt>대관 수입 / 주</dt><dd>+{money(weeklyFee)}점</dd></div><div><dt>운영비 / 주</dt><dd>−{money(weeklyCost)}점</dd></div><div className="rental-ledger-net"><dt>대관 잔액 / 주</dt><dd>+{money(weeklyFee - weeklyCost)}점</dd></div></dl><p>매주 반복 · 이번 계절 13주 운영<br />실제 수입은 시설 준비와 운영 결과에 따라 달라져요.</p></div><div className="rental-advisor"><img src="/center/jiseon-portrait.png" alt="운영팀장 오지선" /><div><strong>오지선 <small>운영팀장</small></strong><p>전부 받을 필요는 없어요. 클래스에 쓸 시간도 남겨 주세요.</p></div></div><p className="rental-finish-note"><Icon name="arrow" size={15} />대관 확정 후, 남은 시간에 클래스를 편성해요.</p></aside>
    </div>
  </section>
}
