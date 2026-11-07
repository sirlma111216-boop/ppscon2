import { wonAmount } from './currency'
import Icon from './Icon'
import { BLOCKS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, getRoomManagement, isRentalProgram } from './simulation'
import type { GameState, RentalRequest, RoomId } from './simulation'
import { constructionTurns, getFacilityProject } from './facilityProjects'
import './RentalReview.css'

interface RentalReviewProps {
  game: GameState
  room: RoomId
  onDecide: (id: string, status: RentalRequest['status']) => void
  onClearClass: (slot: number) => void
  onOpenFacility: (room: RoomId) => void
}

export default function RentalReview({ game, room, onDecide, onClearClass, onOpenFacility }: RentalReviewProps) {
  const accepted = game.player.rentalRequests.filter(request => request.status === 'accepted')
  const definition = ROOM_DEFINITIONS.find(item => item.id === room)!
  const roomRequests = game.player.rentalRequests.filter(request => request.room === room)
  const roomOpen = game.player.rooms.find(item => item.id === room)?.open
  const project = getFacilityProject(game.player, room)
  return <section className="rental-review" aria-label="대관 신청 검토">
    <div className="rental-intro"><span className="small-overline">01 · 이번 계절의 대관 신청</span><h2>어떤 모임에 문을 열까요?</h2></div>
      <section className="rental-applications" aria-label={`${ROOM_NAMES[room]} 대관 신청`}>
        <div className="rental-room-heading"><div><h3>{definition.name}<span>{roomRequests.length}건</span></h3><p>{definition.description}</p></div><span className="rental-management"><Icon name="check" size={15} />관리 신뢰 <b>{Math.round(getRoomManagement(game.player, room))}</b></span></div>
        {!roomOpen ? <div className="rental-facility-gateway"><Icon name="lock" size={34}/><h4>{project?.stage === 'construction' ? `개방까지 ${constructionTurns(project.remainingWeeks)}턴` : '더 높은 대관료를 위한 새 공간'}</h4><p>나라장터에 시설 조성 공고를 내고<br/>업체를 비교해 시공을 진행하세요.</p><button className="primary-button" onClick={()=>onOpenFacility(room)}>{project?.stage === 'construction' ? '시공 현황 보기' : '시설 입찰 진행'}<Icon name="arrow" size={16}/></button></div> : <div className="rental-app-list">{BLOCKS.map((block, slot) => {
          const inSlot = roomRequests.filter((request) => request.slot === slot)
          const existingClass = PROGRAMS.find((program) => program.id === game.player.plan[room][slot] && !isRentalProgram(program.id))
          return <div key={block} className="rental-time-group"><div className="rental-time-label"><Icon name="calendar" size={15} /><strong>{block}</strong><small>매주</small></div>{inSlot.length ? <div className="rental-time-requests">{existingClass && <div className="rental-class-conflict"><span>기존 {existingClass.shortName} 클래스 편성 중</span><button onClick={() => onClearClass(slot)}>클래스 비우기</button></div>}{inSlot.map((request) => {
            const conflict = accepted.find((other) => other.room === room && other.slot === slot && other.id !== request.id)
            return <article className={`rental-request-row is-${request.status}`} key={request.id}>
              <div className="rental-request-copy"><span className="rental-client">{request.client}</span><h4>{request.title}</h4><span className="rental-request-meta"><Icon name="people" size={13} />{request.attendees}명{request.status === 'accepted' ? <b>승인됨</b> : request.status === 'declined' ? <em>거절함</em> : conflict ? <em>같은 시간에 다른 대관 승인됨</em> : inSlot.length > 1 ? <em>같은 시간의 신청 중 선택</em> : null}</span></div>
              <div className="rental-request-fee"><strong>{wonAmount(request.fee)}<small>원 / 주</small></strong><span>운영비 {wonAmount(request.cost)}원</span></div>
              <div className="rental-request-actions">{request.status === 'accepted' ? <button className="rental-undo" onClick={() => onDecide(request.id, 'pending')}>승인 취소</button> : request.status === 'declined' ? <button className="rental-undo" onClick={() => onDecide(request.id, 'pending')}>다시 검토</button> : <><button className="rental-decline" onClick={() => onDecide(request.id, 'declined')}>거절</button><button className="rental-accept" disabled={Boolean(conflict)} onClick={() => onDecide(request.id, 'accepted')}><Icon name="check" size={14} />승인</button></>}</div>
            </article>
          })}</div> : <div className="rental-no-request">접수 없음 <span>{existingClass ? `${existingClass.shortName} 클래스 편성 중` : '클래스를 편성할 수 있어요'}</span></div>}</div>
        })}</div>}
      </section>
    <aside className="rental-advice" aria-label="대관 운영 안내">
        <div className="rental-advisor"><span className="dialogue-portrait"><img src="/center/jiseon-portrait.webp" alt="운영팀장 오지선" /></span><div><strong>오지선 <small>운영팀장</small></strong><p>전부 받을 필요는 없어요. 클래스에 쓸 시간도 남겨 주세요.</p></div></div>
        <p className="rental-finish-note"><Icon name="arrow" size={15} />대관 확정 후, 남은 시간에 클래스를 편성해요.</p>
    </aside>
  </section>
}
