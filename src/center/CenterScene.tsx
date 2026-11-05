import { useState } from 'react'
import type { CSSProperties } from 'react'
import './CenterScene.css'

type RoomId = 'A' | 'B' | 'C'

export interface CenterSceneProps {
  selectedRoom: RoomId
  onSelectRoom: (room: RoomId) => void
  rooms: { id: RoomId; open: boolean; equipment: string[]; mode: string }[]
  plan: Record<RoomId, (string | null)[]>
  running: boolean
  activeSlot: number
  season: number
  report?: {
    activity: { room: string; slot: number; program: string; attendees: number; capacity: number }[]
  } | null
  reducedMotion: boolean
}

const roomNames: Record<RoomId, string> = { A: '문화교실', B: '다목적실', C: '행사실' }
const programNames: Record<string, string> = {
  P01: '공예 강좌', P02: '주민 공예', P03: '요가', P04: '스트레칭',
  P05: '모임 대관', P06: '주민 모임', P07: '디지털 교실',
  P08: '공연', P09: '댄스', P10: '발표 대관',
}
const roomPositions: Record<RoomId, { left: number; width: number }> = {
  A: { left: 1, width: 23.5 }, B: { left: 28, width: 41 }, C: { left: 73, width: 25 },
}
const palettes = [
  { shirt: '#cc735b', skin: '#eac0a0', hair: '#49372e', trousers: '#4d6070', variant: 0 },
  { shirt: '#528b84', skin: '#d5a27e', hair: '#26343a', trousers: '#344454', variant: 1 },
  { shirt: '#d7ad59', skin: '#f0c6a6', hair: '#646361', trousers: '#72786c', variant: 2 },
  { shirt: '#7689bd', skin: '#e3b495', hair: '#4c3745', trousers: '#454259', variant: 3 },
]

function Person({ variant, activity, animated, delay, staff = false }: {
  variant: number; activity: string | null; animated: boolean; delay: number; staff?: boolean
}) {
  const c = palettes[variant % palettes.length]
  const movement = !activity ? 'idle' : activity === 'P03' || activity === 'P04' ? 'yoga'
    : activity === 'P09' ? 'dance'
      : activity === 'P01' || activity === 'P02' || activity === 'P07' ? 'craft'
        : activity === 'P08' || activity === 'P10' ? 'present' : 'talk'
  const seated = movement === 'craft' || movement === 'talk'
  return (
    <svg className={`center-person center-person--${movement} ${animated ? 'center-person--active' : ''}`}
      viewBox="0 0 96 160" aria-hidden="true" style={{ '--actor-delay': `${delay}s` } as CSSProperties}>
      <ellipse cx="48" cy="148" rx="23" ry="5" fill="#253f3c" opacity=".14" />
      {(movement === 'yoga' || movement === 'dance') && <path d="M9 145L70 137 91 147 29 156Z" fill="#809eae" stroke="#5d7a8e" strokeWidth="1.5" />}
      {seated && <g stroke="#555a56" strokeWidth="3" strokeLinecap="round"><path d="M28 99V145M65 100V145" /><path d="M25 100H69" strokeWidth="7" /></g>}
      <g className="center-person__body">
        <g className="center-person__leg center-person__leg--back">
          <path d={seated ? 'M55 100 L65 120 L58 142' : 'M55 99 L57 123 L62 143'} fill="none" stroke={c.trousers} strokeWidth="12" strokeLinecap="round" />
          <path d={seated ? 'M57 143h13' : 'M61 144h12'} stroke="#363b40" strokeWidth="7" strokeLinecap="round" />
        </g>
        <g className="center-person__leg center-person__leg--front">
          <path d={seated ? 'M40 100 L30 121 L32 143' : 'M40 99 L37 123 L33 143'} fill="none" stroke={c.trousers} strokeWidth="12" strokeLinecap="round" />
          <path d="M23 144h13" stroke="#363b40" strokeWidth="7" strokeLinecap="round" />
        </g>
        <path d="M35 58Q47 53 60 59L65 96Q49 106 31 97Z" fill={staff ? '#41796f' : c.shirt} stroke="#33454a" strokeWidth="1.6" />
        <path d="M34 94Q48 99 64 94" stroke="#263c47" strokeWidth="2" opacity=".3" fill="none" />
        {staff && <><path d="M40 59L46 72 54 59" fill="#f4f1e4" /><rect x="52" y="75" width="8" height="6" rx="1" fill="#e8e6d6" /></>}
        <path d="M44 49V60Q49 64 54 58V49" fill={c.skin} stroke="#6d5044" strokeWidth="1" />
        <g className="center-person__head">
          {c.variant === 1 && <ellipse cx="62" cy="32" rx="7" ry="9" fill={c.hair} />}
          <path d="M33 32Q33 14 49 15Q65 16 64 34L62 42H35Z" fill={c.hair} />
          <path d="M35 30Q48 20 61 31L61 43Q57 56 48 55Q36 51 35 40Z" fill={c.skin} stroke="#765749" strokeWidth="1.1" />
          <path d={c.variant === 2 ? 'M33 34Q27 29 33 23Q31 17 39 17Q45 9 52 15Q64 12 66 26L62 32 55 24 48 28 42 24Z' : 'M32 32Q31 13 49 15Q63 16 64 33L58 27 52 25 46 30 42 26 38 33Z'} fill={c.hair} />
          <path d="M41 36h2m11 0h2" stroke="#394044" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M48 38l-1 5h3M44 47q5 3 9-1" stroke="#9b6754" strokeWidth="1.4" fill="none" strokeLinecap="round" />
          {c.variant === 2 && <g fill="none" stroke="#54585a" strokeWidth="1.2"><rect x="37" y="32" width="11" height="9" rx="3" /><rect x="51" y="32" width="11" height="9" rx="3" /><path d="M48 35h3" /></g>}
        </g>
        <g className="center-person__arm center-person__arm--back">
          <path d="M60 63 L69 81" stroke={staff ? '#41796f' : c.shirt} strokeWidth="11" strokeLinecap="round" />
          <g className="center-person__forearm"><path d="M69 81L67 98" stroke={c.skin} strokeWidth="7" strokeLinecap="round" /><ellipse cx="67" cy="100" rx="4" ry="5" fill={c.skin} /></g>
        </g>
        <g className="center-person__arm center-person__arm--front">
          <path d="M34 64 L25 81" stroke={staff ? '#41796f' : c.shirt} strokeWidth="11" strokeLinecap="round" />
          <g className="center-person__forearm"><path d="M25 81L29 98" stroke={c.skin} strokeWidth="7" strokeLinecap="round" /><ellipse cx="29" cy="100" rx="4" ry="5" fill={c.skin} /></g>
        </g>
      </g>
      {movement === 'craft' && <g><path d="M11 104H83L88 112H6Z" fill="#c29567" stroke="#826449" strokeWidth="1.3" /><path d="M14 113v32m65-32v32" stroke="#856345" strokeWidth="4" /><path d="M39 105l7-8 13 7Z" fill={activity === 'P07' ? '#586f7e' : '#d9b6ca'} stroke="#727c80" /><rect x="57" y="102" width="11" height="3" rx="1" fill="#f4e4bb" /></g>}
    </svg>
  )
}

function Equipment({ ids }: { ids: string[] }) {
  const has = (key: string) => ids.some(id => id === key || id === `${key}B`)
  return <svg className="center-scene__equipment" viewBox="0 0 300 220" aria-hidden="true">
    {has('E01') && <g transform="translate(22 147)"><path d="M0 6L58 0 88 15 27 22Z" fill="#cfa77d" stroke="#866b57" /><path d="M4 9v33m24-21v33m53-36v33" stroke="#725e4a" strokeWidth="5" /><ellipse cx="42" cy="10" rx="12" ry="5" fill="#e6d4ba" /><path d="M42 9l8-12m-4 14L33-1" stroke="#84765f" strokeWidth="2" /><rect x="57" y="5" width="10" height="8" rx="2" fill="#699294" /></g>}
    {has('E02') && <g opacity=".9" fill="#7c9aab" stroke="#587b8c"><path d="M128 180l62-11 35 15-64 13Z" /><path d="M196 154l44-8 30 13-45 9Z" /></g>}
    {has('E03') && <g transform="translate(5 117)"><path d="M0 6L22 3 34 10 11 13Z" fill="#d9c2a2" stroke="#736e62" /><path d="M4 12l4 23m20-25L13 36M0 20l30-8" stroke="#75817b" strokeWidth="3" /><circle cx="9" cy="36" r="3" fill="#56676d" /><circle cx="24" cy="30" r="3" fill="#56676d" /></g>}
    {has('E04') && <g transform="translate(251 95)"><path d="M0 0l24 4v42L0 42Z" fill="#45535e" stroke="#273944" /><ellipse cx="12" cy="30" rx="8" ry="10" fill="#293b47" stroke="#879399" /><ellipse cx="12" cy="11" rx="4" ry="5" fill="#a1a8a4" /></g>}
    {has('E05') && <g transform="translate(119 64)"><path d="M0 0L72 4v45L0 45Z" fill="#eff0dc" stroke="#5c7681" strokeWidth="3" /><path d="M9 34l18-15 17 10 19-17" stroke="#88a993" strokeWidth="3" fill="none" /><path d="M36 47v22m-14 4l14-4 14 5" stroke="#65737a" strokeWidth="3" /></g>}
    {has('E06') && <g transform="translate(125 135)"><path d="M0 26l64-4 32 16-64 5Z" fill="#c3a185" stroke="#8a7765" /><path d="M24 1L62 2v26L24 25Z" fill="#344d60" stroke="#293f50" strokeWidth="2" /><path d="M28 5l30 1v17L28 22Z" fill="#a9c7c6" /><path d="M41 27v7m-8 0h17" stroke="#4d6570" strokeWidth="3" /></g>}
    {has('E07') && <g transform="translate(105 148)"><path d="M0 14l122-12 46 26-128 16Z" fill="#bf9f87" stroke="#887465" /><path d="M0 14v14l40 26 128-17V28L40 44Z" fill="#947964" /></g>}
    {has('E09') && <g transform="translate(9 58)"><path d="M0 5L43 0v71L0 78Z" fill="#a6b9a2" stroke="#647e74" strokeWidth="2" /><path d="M21 4v70" stroke="#e0e6d5" /><path d="M0 78v10m43-17v11" stroke="#65756b" strokeWidth="3" /></g>}
    {has('E10') && <g transform="translate(270 158)"><path d="M0 0l16 2v20L0 18Z" fill="#e3e5d5" stroke="#5e777b" strokeWidth="2" /><path d="M3 4l10 1v9L3 13Z" fill="#7ea8a5" /><path d="M8 20v22m-8 1h16" stroke="#65797a" strokeWidth="3" /></g>}
  </svg>
}

export default function CenterScene({ selectedRoom, onSelectRoom, rooms, plan, running, activeSlot, season, report, reducedMotion }: CenterSceneProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const evening = running && activeSlot === 2
  return <section className={`center-scene ${running ? 'center-scene--running' : ''} ${evening ? 'center-scene--evening' : ''} ${reducedMotion ? 'center-scene--reduced' : ''}`} aria-label="우리 센터의 모습">
    {!imageFailed && <img className="center-scene__background" src="/center/center-interior.png" alt="햇빛이 드는 문화체육센터의 세 교실과 앞쪽 로비" onError={() => setImageFailed(true)} />}
    {imageFailed && <div className="center-scene__fallback" aria-hidden="true"><span /><span /><span /></div>}
    <div className="center-scene__light" aria-hidden="true" />
    <div className="center-scene__season"><span aria-hidden="true">{['✿', '☀', '❧', '❄'][season]}</span> {['따뜻한 봄날', '싱그러운 여름', '선선한 가을', '포근한 겨울'][season]}</div>
    {rooms.map(room => {
      const pos = roomPositions[room.id]
      const activity = report?.activity.find(a => a.room === room.id && a.slot === activeSlot)
      const scheduled = plan[room.id]?.[activeSlot] ?? null
      const attendance = running && activity ? activity.attendees : 0
      const population = Math.min(4, attendance)
      const style = { left: `${pos.left}%`, width: `${pos.width}%` }
      return <div className={`center-scene__room ${selectedRoom === room.id ? 'center-scene__room--selected' : ''} ${room.open ? '' : 'center-scene__room--locked'}`} style={style} key={room.id}>
        <button className="center-scene__room-label" onClick={() => onSelectRoom(room.id)} aria-pressed={selectedRoom === room.id}>
          <span className="center-scene__room-letter">{room.id}</span><span>{roomNames[room.id]}</span>
          {!room.open && <svg viewBox="0 0 20 20" width="14" height="14" fill="none" aria-hidden="true"><path d="M6 9V6a4 4 0 018 0v3M5 9h10v8H5Z" stroke="currentColor" strokeWidth="1.5" /></svg>}
        </button>
        <button className="center-scene__room-hit" aria-label={`${roomNames[room.id]} ${room.open ? '선택' : '개방 살펴보기'}`} onClick={() => onSelectRoom(room.id)} tabIndex={-1} />
        {room.open && <Equipment ids={room.equipment} />}
        {!room.open && <div className="center-scene__storage" aria-hidden="true"><span /><span /><span /></div>}
        {room.open && Array.from({ length: population }, (_, i) => <div className="center-scene__actor" key={`${room.id}-${i}`} style={{ left: `${room.id === 'B' ? [10, 32, 53, 75][i] : [12, 55, 10, 54][i]}%`, bottom: `${room.id === 'B' ? [4, 11, 5, 15][i] : [2, 5, 21, 23][i]}%`, width: `${((i >= 2 && room.id !== 'B' ? 4.6 : 5.4) / pos.width) * 100}%`, zIndex: i >= 2 && room.id !== 'B' ? 2 : 3 }}>
          <Person variant={i + (room.id === 'B' ? 1 : 0)} activity={activity?.program ?? scheduled} animated={running && !reducedMotion} delay={i * -.47} />
        </div>)}
        {room.open && running && scheduled && <div className={`center-scene__activity-tag ${attendance === 0 ? 'center-scene__activity-tag--empty' : ''}`}>
          {attendance > 0 && <span className="center-scene__live-dot" aria-hidden="true" />}
          <span>{programNames[scheduled] ?? '운영 중'}</span><strong>{attendance > 0 ? `${attendance}명` : '예약 없음'}</strong>
        </div>}
      </div>
    })}
    {!running && <div className="center-scene__caretaker"><Person variant={1} activity={null} animated={false} delay={0} staff /></div>}
    <div className="center-scene__front-caption">{running ? '이번 주의 하루가 펼쳐집니다' : '방을 선택해서 다음 주를 준비하세요'}</div>
  </section>
}
