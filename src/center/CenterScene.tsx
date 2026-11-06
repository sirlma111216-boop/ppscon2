import { useEffect, useRef } from 'react'
import type { SyntheticEvent } from 'react'
import Icon from './Icon'
import PotteryActivity from './PotteryActivity'
import { selectCraftActivityPreview } from './activityPreview'
import { BLOCKS, OFFERS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES } from './simulation'
import type { RoomId } from './simulation'
import type { FacilityProject } from './facilityProjects'
import { constructionTurns } from './facilityProjects'
import './CenterScene.css'

export interface CenterSceneProps {
  selectedRoom: RoomId
  view: 'exterior' | 'room'
  onSelectRoom: (room: RoomId) => void
  onBack: () => void
  campusExterior?: string
  onOpenCampus?: () => void
  rooms: { id: RoomId; open: boolean; equipment: string[]; mode: string }[]
  facilityProjects?: FacilityProject[]
  plan: Record<RoomId, (string | null)[]>
  viewingResult: boolean
  activeSlot: number
  season: number
  report?: { activity: { room: string; slot: number; program: string; attendees: number; capacity: number }[] } | null
  reducedMotion: boolean
  activityPaused?: boolean
}

const HOTSPOTS: Record<RoomId, { left: string; top: string }> = {
  C: { left: '17%', top: '53%' }, B: { left: '43%', top: '39%' },
  E: { left: '64%', top: '41%' }, F: { left: '78%', top: '41%' },
  G: { left: '85%', top: '25%' }, A: { left: '74%', top: '65%' },
  D: { left: '90%', top: '65%' },
}
const EXTERIOR = '/center/building-v2/exterior.webp'
const BUTTON_ART = '/center/interface-v3/'
function preserveButtonRatio(event: SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget
  if (image.naturalWidth && image.naturalHeight) image.parentElement?.style.setProperty('--button-aspect', String(image.naturalWidth / image.naturalHeight))
}
const PROGRAM_NAMES: Record<string, string> = Object.fromEntries(PROGRAMS.map(program => [program.id, program.shortName]))
const EQUIPMENT_NAMES: Record<string, string> = Object.fromEntries(OFFERS.map(offer => [offer.id, offer.name]))

export default function CenterScene({ selectedRoom, view, onSelectRoom, onBack, campusExterior = EXTERIOR, onOpenCampus, rooms, facilityProjects = [], plan, viewingResult, activeSlot, season, report, reducedMotion, activityPaused }: CenterSceneProps) {
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
  const activity = room?.open && Number.isInteger(activeSlot) && activeSlot >= 0 && activeSlot < BLOCKS.length ? report?.activity.find(item => item.room === selectedRoom && item.slot === activeSlot) : undefined
  const scheduled = room?.open ? viewingResult ? activity?.program : plan[selectedRoom]?.[slot] : null
  const showCraftActivity = selectCraftActivityPreview({ room: selectedRoom, viewingResult, roomOpen: Boolean(room?.open), activeSlot, activities: report?.activity })
  const exteriorArt = campusExterior
  return <section ref={scene} className={['center-scene center-building', view === 'room' ? 'center-building--inside' : '', reducedMotion ? 'center-building--reduced' : ''].join(' ')} data-season={season} aria-label={view === 'exterior' ? '늘봄 문화체육센터 외관 · 방 이름을 눌러 들어가기' : ROOM_NAMES[selectedRoom] + ' 내부'}>
    {view === 'exterior' ? <div className="center-building__exterior">
      <img key={exteriorArt} className="center-building__exterior-art" src={exteriorArt} alt="벽돌 대강당과 유리창이 있는 2층 문화체육센터" draggable={false} onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = EXTERIOR } }} />
      {onOpenCampus && <button type="button" className="scene-art-button campus-project-button" onClick={onOpenCampus} aria-label="센터 환경 개선"><img src={BUTTON_ART + 'campus.webp'} alt="" draggable={false} onLoad={preserveButtonRatio} /></button>}
      <div className="center-building__hotspots" role="group" aria-label="들어갈 공간 선택">
        {ROOM_DEFINITIONS.map(item => {
          const open = rooms.find(state => state.id === item.id)?.open === true
          const project = facilityProjects.find(value => value.room === item.id && value.stage === 'construction')
          const stateLabel = !open ? project ? ' · 시공 중 ' + constructionTurns(project.remainingWeeks) + '턴 남음' : ' · 미개방 시설' : ''
          return <button key={item.id} type="button" data-room={item.id} className={'scene-art-button building-room-link ' + (!open ? 'is-locked' : '')} style={HOTSPOTS[item.id]} onClick={() => onSelectRoom(item.id)} aria-label={item.name + ' 들어가기' + stateLabel}><img src={BUTTON_ART + 'room-' + item.id + '.webp'} alt="" draggable={false} onLoad={preserveButtonRatio} />{!open && <span className="scene-art-lock" aria-hidden="true"><Icon name="lock" size={9} /></span>}</button>
        })}
      </div>
    </div> : <div key={selectedRoom} className={'center-building__interior ' + (!room?.open ? 'is-locked' : '')}>
      {showCraftActivity ? <PotteryActivity key={`${selectedRoom}-${slot}`} reducedMotion={reducedMotion} paused={activityPaused} /> : <>
      <img className="center-building__interior-art" src={'/center/building-v2/room-' + selectedRoom + '.webp'} alt={ROOM_NAMES[selectedRoom] + '의 기본 공간과 가구'} draggable={false} onError={(event) => { if (!event.currentTarget.dataset.fallback) { event.currentTarget.dataset.fallback = 'true'; event.currentTarget.src = EXTERIOR } }} />
      <button type="button" className="scene-art-button room-return-button" onClick={onBack} aria-label="센터 외관으로 돌아가기"><img src={BUTTON_ART + 'return.webp'} alt="" draggable={false} onLoad={preserveButtonRatio} /></button>
      <div className="room-picture-caption"><div><h2>{ROOM_NAMES[selectedRoom]}</h2><span>{definition.area}㎡ · 정원 {definition.capacity}명</span></div>{!room?.open && <span className="room-picture-lock"><Icon name="lock" size={14} />{construction ? '시공 중 · ' + constructionTurns(construction.remainingWeeks) + '턴 남음' : '시설 개방 필요'}</span>}</div>
      {viewingResult && room?.open && <div className="room-last-week" aria-live="polite"><span>{BLOCKS[slot]} · 마지막 주</span><strong>{scheduled ? PROGRAM_NAMES[scheduled] || '운영 기록' : '빈 시간'}{scheduled && <b>{activity?.attendees || 0}명</b>}</strong></div>}
      {room?.open && room.equipment.length > 0 && <div className="room-installed-equipment" aria-label="설치 완료한 장비"><Icon name="box" size={14} />{room.equipment.map(id => <span key={id}>{EQUIPMENT_NAMES[id] || id}</span>)}</div>}
      </>}
    </div>}
  </section>
}
