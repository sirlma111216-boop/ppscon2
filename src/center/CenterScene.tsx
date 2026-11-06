import { useEffect, useRef } from 'react'
import Icon from './Icon'
import { BLOCKS, ROOM_DEFINITIONS, ROOM_NAMES } from './simulation'
import type { RoomId } from './simulation'
import type { FacilityProject } from './facilityProjects'
import './CenterScene.css'

export interface CenterSceneProps {
  selectedRoom: RoomId
  view: 'exterior' | 'room'
  onSelectRoom: (room: RoomId) => void
  onBack: () => void
  campusTier?: 0 | 1 | 2
  onOpenCampus?: () => void
  rooms: { id: RoomId; open: boolean; equipment: string[]; mode: string }[]
  facilityProjects?: FacilityProject[]
  plan: Record<RoomId, (string | null)[]>
  running: boolean
  activeSlot: number
  season: number
  report?: { activity: { room: string; slot: number; program: string; attendees: number; capacity: number }[] } | null
  reducedMotion: boolean
}

const HOTSPOTS: Record<RoomId, { left: string; top: string }> = {
  C: { left: '17%', top: '53%' }, B: { left: '45%', top: '39%' },
  E: { left: '65%', top: '41%' }, F: { left: '77%', top: '41%' },
  G: { left: '89%', top: '41%' }, A: { left: '77%', top: '65%' },
  D: { left: '90%', top: '65%' },
}
const EXTERIOR = '/center/building-v2/exterior.webp'
const PROGRAM_NAMES: Record<string, string> = { P01:'공예 강좌', P02:'주민 공예', P03:'요가', P04:'스트레칭', P05:'모임 대관', P06:'주민 모임', P07:'디지털 교실', P08:'공연 대관', P09:'댄스', P10:'발표 대관' }
const EQUIPMENT_NAMES: Record<string, string> = { E01:'공예 도구', E01B:'내구형 공예 도구', E02:'체육 매트', E03:'이동식 가구', E04:'음향', E04B:'저전력 음향', E05:'영상·발표', E06:'디지털 교육', E07:'이동무대', E08:'절전', E09:'공간 분리', E10:'예약 안내' }

export default function CenterScene({ selectedRoom, view, onSelectRoom, onBack, campusTier = 0, onOpenCampus, rooms, facilityProjects = [], plan, running, activeSlot, season, report, reducedMotion }: CenterSceneProps) {
  const scene = useRef<HTMLElement>(null)
  const previousView = useRef(view)
  useEffect(() => {
    if (previousView.current !== view) {
      const target = view === 'room' ? '.room-return-button' : '[data-room="' + selectedRoom + '"]'
      scene.current?.querySelector<HTMLButtonElement>(target)?.focus({ preventScroll: true })
      previousView.current = view
    }
  }, [view, selectedRoom])
  const room = rooms.find(item => item.id === selectedRoom)
  const definition = ROOM_DEFINITIONS.find(item => item.id === selectedRoom)!
  const construction = facilityProjects.find(project => project.room === selectedRoom && project.stage === 'construction')
  const slot = Math.max(0, Math.min(BLOCKS.length - 1, activeSlot))
  const activity = room?.open ? report?.activity.find(item => item.room === selectedRoom && item.slot === slot) : undefined
  const scheduled = room?.open ? plan[selectedRoom]?.[slot] : null
  const exteriorArt = campusTier === 2 ? '/center/building-v2/exterior-renovated.webp' : campusTier === 1 ? '/center/building-v2/exterior-garden.webp' : EXTERIOR
  return <section ref={scene} className={['center-scene center-building', view === 'room' ? 'center-building--inside' : '', reducedMotion ? 'center-building--reduced' : ''].join(' ')} data-season={season} aria-label={view === 'exterior' ? '늘봄 문화체육센터 외관 · 방 이름을 눌러 들어가기' : ROOM_NAMES[selectedRoom] + ' 내부'}>
    {view === 'exterior' ? <div className="center-building__exterior">
      <img className="center-building__exterior-art" src={exteriorArt} alt="벽돌 대강당과 유리창이 있는 2층 문화체육센터" draggable={false} onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = EXTERIOR } }} />
      {onOpenCampus && <button className="campus-project-button" onClick={onOpenCampus}><Icon name="leaf" size={15} />센터 환경 개선</button>}
      <div className="center-building__hotspots" role="group" aria-label="들어갈 공간 선택">
        {ROOM_DEFINITIONS.map(item => {
          const open = rooms.find(state => state.id === item.id)?.open === true
          const project = facilityProjects.find(value => value.room === item.id && value.stage === 'construction')
          const stateLabel = !open ? project ? ' · 시공 중 ' + project.remainingWeeks + '주' : ' · 미개방 시설' : ''
          return <button key={item.id} type="button" data-room={item.id} className={'building-room-link ' + (!open ? 'is-locked' : '')} style={HOTSPOTS[item.id]} onClick={() => onSelectRoom(item.id)} aria-label={item.name + ' 들어가기' + stateLabel}><span>{item.name}</span>{!open && <Icon name="lock" size={13} />}</button>
        })}
      </div>
    </div> : <div key={selectedRoom} className={'center-building__interior ' + (!room?.open ? 'is-locked' : '')}>
      <img className="center-building__interior-art" src={'/center/building-v2/room-' + selectedRoom + '.webp'} alt={ROOM_NAMES[selectedRoom] + '의 기본 공간과 가구'} draggable={false} onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = EXTERIOR } }} />
      <button className="room-return-button" onClick={onBack}><Icon name="arrow" size={14} />센터 외관</button>
      <div className="room-picture-caption"><div><h2>{ROOM_NAMES[selectedRoom]}</h2><span>{definition.area}㎡ · 정원 {definition.capacity}명</span></div>{!room?.open && <span className="room-picture-lock"><Icon name="lock" size={14} />{construction ? '시공 중 · ' + construction.remainingWeeks + '주' : '시설 개방 필요'}</span>}</div>
      {running && room?.open && <div className="room-last-week" aria-live="polite"><span>{BLOCKS[slot]} · 마지막 주</span><strong>{scheduled ? PROGRAM_NAMES[scheduled] || '운영 기록' : '빈 시간'}{scheduled && <b>{activity?.attendees || 0}명</b>}</strong></div>}
      {room?.open && room.equipment.length > 0 && <div className="room-installed-equipment" aria-label="설치 완료한 장비"><Icon name="box" size={14} />{room.equipment.map(id => <span key={id}>{EQUIPMENT_NAMES[id] || id}</span>)}</div>}
    </div>}
  </section>
}
