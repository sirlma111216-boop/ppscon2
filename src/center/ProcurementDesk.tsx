import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import ProcurementHeader from './ProcurementHeader'
import { MAX_YEARS, OFFERS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, SEASONS, buyEquipment, canRunProgram, freeCash, getProgramRequirements, isRentalProgram, roomSupportsOffer } from './simulation'
import type { GameState, Offer, Program, RoomId } from './simulation'
import type { Notify } from './ToastFeedback'
import { getRoomEquipmentUsage } from './equipmentUsage'
import './ProcurementDesk.css'

interface ProcurementDeskProps {
  game: GameState
  room: RoomId
  onRoomChange: (room: RoomId) => void
  onBuy: (id: string) => void
  onClose: () => void
  initialFilter: string
  onNotify?: Notify
  onManageEquipment?: () => void
}

const CATEGORIES = [
  { id: 'all', label: '전체 물품', icon: 'box', families: [] },
  { id: 'culture', label: '문화 · 교육', icon: 'brush', families: ['craft', 'digital', 'kiln', 'video', 'wood', 'recording', 'interpret', 'pitch'] },
  { id: 'sport', label: '생활체육', icon: 'sport', families: ['mat', 'flex', 'reformer', 'cycle'] },
  { id: 'event', label: '공연 · 발표', icon: 'music', families: ['audio', 'screen', 'stage', 'video', 'orchestra', 'lighting'] },
  { id: 'operation', label: '센터 운영', icon: 'home', families: ['energy', 'quiet', 'guide'] },
] as const
const CAPABILITIES: Record<string, string> = {
  craft: '공예 도구', mat: '매트', flex: '이동식 가구', audio: '음향', screen: '영상 장비',
  digital: '교육용 컴퓨터', digitalPro: '고성능 디지털 장비', kiln: '도예 가마', reformer: '필라테스 기구', video: '영상 제작 장비',
  recording: '녹화·발표 코칭 장비', cycle: '실내 사이클', orchestra: '합주 악기', lighting: '무대 조명', wood: '목공 작업대·집진 설비', interpret: '통역·토론 장비', pitch: '창업 발표 장비',
  stage: '무대', hall: '대강당', energy: '절전', quiet: '공간 분리', guide: '예약 안내',
}
const money = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
const OPERATING_EFFECTS: Record<string, string> = {
  flex: '활동을 바꿀 때 준비 부담 감소',
  energy: '센터 기본운영비 −12점 / 계절',
  quiet: '이웃방 음악에 따른 불편 감소',
  guide: '반복 대관 접수 · 처음 온 주민 안내 지원',
}

/** Original catalogue illustrations; these are fictional game items, not certified products. */
function ProductDrawing({ family }: { family: string }) {
  return <svg viewBox="0 0 136 106" className="pps-product-drawing" fill="none" aria-hidden="true">
    <ellipse cx="68" cy="88" rx="49" ry="8" fill="#233b4b" opacity=".07" />
    <g stroke="#425768" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {family === 'craft' && <>
        <path d="M23 50 82 41 113 59 53 70Z" fill="#d1ae82" /><path d="M27 54v31m25-16v28m56-36v25" strokeWidth="4" />
        <path d="m28 51 25 14 55-8" stroke="#a68460" /><ellipse cx="69" cy="51" rx="14" ry="5" fill="#f6ebd9" />
        <path d="m68 49 7-14m-9 16-10-13" stroke="#7d9583" strokeWidth="3" /><path d="m86 50 12 3-1 9-12-3Z" fill="#8da6ad" />
        <path d="M20 65 33 61 43 68 30 72Z" fill="#bc806f" /><path d="M22 68v18m17-16v16" />
      </>}
      {family === 'mat' && <>
        <path d="m15 69 69-19 39 24-70 21Z" fill="#8caeb0" /><path d="m20 69 35 20 62-17" stroke="#c8dcda" />
        <path d="m41 30 48-9c19 0 21 22 4 26L45 59Z" fill="#bd8f7f" /><ellipse cx="43" cy="44" rx="14" ry="16" fill="#dfb8a6" />
        <ellipse cx="43" cy="44" rx="7" ry="9" fill="#f1d6c7" /><path d="m75 24 4 25" stroke="#e3b8a0" strokeWidth="5" />
      </>}
      {family === 'flex' && <>
        <path d="m18 45 53-10 25 14-55 12Z" fill="#cab296" /><path d="m25 49 47 32m15-30L39 86" strokeWidth="4" />
        <circle cx="37" cy="88" r="4" fill="#667985" /><circle cx="74" cy="83" r="4" fill="#667985" />
        <path d="m91 39 23 3v26l-23-3Z" fill="#8fa8a5" /><path d="m86 69 26-3 14 10-27 4Z" fill="#8fa8a5" />
        <path d="m91 74 1 16m27-13v12m-8-46V28" />
      </>}
      {family === 'audio' && <>
        <path d="m25 22 32 5v57l-32-5Z" fill="#354e63" /><path d="m57 27 9-5v57l-9 5Z" fill="#24394e" />
        <ellipse cx="41" cy="64" rx="11" ry="13" fill="#182d40" stroke="#9db2be" /><ellipse cx="41" cy="38" rx="6" ry="7" fill="#98b4bd" />
        <path d="m79 33 29 4v48l-29-4Z" fill="#496577" /><ellipse cx="93" cy="66" rx="9" ry="11" fill="#24394e" stroke="#a3b9c5" />
        <ellipse cx="93" cy="46" rx="5" ry="5" fill="#b5c9cf" /><path d="m69 77 2 10 10 4" />
      </>}
      {family === 'screen' && <>
        <path d="m24 18 88 4v53l-88-4Z" fill="#f9f8ed" /><path d="m20 16 96 4" strokeWidth="4" />
        <path d="M36 56 55 39 71 49 98 31" stroke="#87a6a1" strokeWidth="4" /><circle cx="43" cy="32" r="6" fill="#d6b878" stroke="none" />
        <path d="m67 74 1 14m-18 8 18-8 20 7" strokeWidth="3" />
      </>}
      {family === 'digital' && <>
        <path d="m18 67 70-10 33 18-72 14Z" fill="#c2ac91" /><path d="m25 72 1 18m24-3v12m66-23v16" strokeWidth="3" />
        <path d="m40 20 56 4v38l-56-4Z" fill="#304c61" /><path d="m45 26 46 3v26l-46-3Z" fill="#bdd3d5" />
        <path d="m67 61 1 10m-10 2 21 1" strokeWidth="3" /><path d="m48 77 31-4 15 7-32 5Z" fill="#e3e6de" />
        <path d="m53 41 8-7 8 4 13-6" stroke="#6a9298" strokeWidth="3" />
      </>}
      {family === 'stage' && <>
        <path d="m14 58 76-17 34 22-76 20Z" fill="#bd9473" /><path d="M14 58v15l34 23V83Zm34 25 76-20v15L48 96Z" fill="#8c6c58" />
        <path d="m28 41 14-4v16l-14 4Zm26-7 14-4v16l-14 4Z" fill="#a8b8b0" /><path d="m28 56 15-4 9 6-15 5Zm26-7 15-4 9 6-15 5Z" fill="#a8b8b0" />
        <path d="M95 20v33m-8 5 8-5 8 3m-8-36 8-3" strokeWidth="3" />
      </>}
      {family === 'kiln' && <>
        <path d="m30 25 55-9 24 15v50l-56 12-23-15Z" fill="#aeb8ba" />
        <path d="m30 25 23 16 56-10M53 41v52" /><path d="m60 48 38-8v36l-38 8Z" fill="#738388" />
        <path d="m65 52 27-6v24l-27 7Z" fill="#445960" /><path d="m91 52 2 13" stroke="#e7e2d3" strokeWidth="3" />
        <path d="m29 24 54-10 25 14-55 12Z" fill="#d9ddda" /><path d="M78 13V8h13v7" />
        <path d="m35 79 1 10m65-7v9" strokeWidth="4" /><circle cx="42" cy="43" r="3" fill="#b78b50" />
      </>}
      {family === 'reformer' && <>
        <path d="m15 70 72-24 36 17-72 25Z" fill="#b99a75" /><path d="M15 70v9l36 18V88m0 9 72-25v-9" fill="#9b7a57" />
        <path d="m35 65 45-15 26 12-46 17Z" fill="#455a64" /><path d="m25 64-9-25 18-6 10 24m60 1 7-30 12-4" strokeWidth="3" />
        <path d="m87 47 21-14m-31 11 22-14" stroke="#e1d8ba" /><path d="m20 79 2 12m32 6v5m64-26v11" strokeWidth="4" />
      </>}
      {(family === 'video' || family === 'recording') && <>
        <path d="m23 30 36-7 18 12-38 8Z" fill="#617886" /><path d="M23 30v26l16 12V43m0 25 38-10V35" fill="#344d61" />
        <path d="m76 39 17-4v19l-17 4Z" fill="#243b4b" /><path d="M51 65v17m0 0-22 18m22-18 19 16m-19-16 1 19" strokeWidth="3" />
        <path d="m99 17 22 11-8 27-22-11Z" fill="#eee8cf" /><path d="M105 52v37m-13 8 13-8 15 8" strokeWidth="3" />
        <path d="m30 21 13-3 7 8" strokeWidth="4" />
      </>}
      {family === 'cycle' && <>
        <circle cx="42" cy="71" r="22" fill="#72898e" /><circle cx="42" cy="71" r="14" fill="#d5ddd8" />
        <path d="m42 71 27-23 24 30H42l10-38m17 8 8-22 19 2M43 36h25M29 96h33m21-15 18 12" strokeWidth="5" />
        <circle cx="68" cy="73" r="6" fill="#b18465" /><path d="m68 73 8 9 8-1" strokeWidth="3" />
      </>}
      {family === 'orchestra' && <>
        <path d="M48 35c-21-4-27 20-12 27-19 14-7 32 11 30 20-2 25-22 10-32 17-12 10-30-9-25Z" fill="#bc8356" />
        <path d="m46 16 5 64m-10-61 11-1m-15 61 18-1" strokeWidth="3" /><path d="M39 53q-7 5-1 11m18-14q7 5 0 12" />
        <path d="m84 21 30 6v35l-30-6Z" fill="#c0d0cf" /><path d="M100 61v26m-15 9 15-9 15 9M72 18 65 94" strokeWidth="3" />
      </>}
      {family === 'lighting' && <>
        <path d="m28 25 37-9 25 22-38 10Z" fill="#607981" /><path d="M28 25v28l24 22V48m0 27 38-11V38" fill="#344f5f" />
        <ellipse cx="70" cy="55" rx="13" ry="16" transform="rotate(28 70 55)" fill="#e5c880" /><path d="m25 46-7 8 29 31 17-7m-17 7v9m-18 7 18-7 23 6" strokeWidth="3" />
        <path d="m92 51 31-13v52L91 68" fill="#e3d9a6" opacity=".4" stroke="none" />
      </>}
      {family === 'wood' && <>
        <path d="m14 48 62-12 38 20-63 15Z" fill="#c8a277" /><path d="M20 54v35m31-18v28m55-40v26" strokeWidth="5" />
        <path d="m25 47 29-5 20 10-30 6Z" fill="#e5c99b" /><path d="m43 38 17-5 13 8-17 5Z" fill="#627e7f" />
        <rect x="99" y="66" width="22" height="30" rx="5" fill="#9eb0ac" /><path d="M111 65V48q0-9-10-9H87" strokeWidth="5" />
      </>}
      {family === 'interpret' && <>
        <path d="M28 59V41a28 28 0 0 1 56 0v18" strokeWidth="7" /><rect x="23" y="47" width="15" height="24" rx="6" fill="#799398" /><rect x="75" y="47" width="15" height="24" rx="6" fill="#799398" />
        <path d="M83 68q0 12-18 12" strokeWidth="4" /><ellipse cx="60" cy="80" rx="7" ry="4" fill="#3a5467" />
        <path d="m84 91 29-7 12 8-28 7Z" fill="#c5d0c5" /><path d="M102 86V58l-8-7" strokeWidth="3" /><circle cx="93" cy="50" r="4" fill="#b2806d" />
      </>}
      {family === 'pitch' && <>
        <path d="m18 24 81-7 17 12-81 8Z" fill="#dbe3dc" /><path d="M35 37v40l81-8V29" fill="#b6cdca" /><path d="M28 32v49l7-4" />
        <path d="m48 64 15-12 14 4 23-18" stroke="#51757b" strokeWidth="4" /><path d="m75 75 1 17m-19 8 19-8 19 6" strokeWidth="3" />
        <path d="m15 81 18-3 10 9-18 4Z" fill="#b68a62" />
      </>}
      {family === 'energy' && <>
        <path d="m30 22 67-4 13 12-69 5Z" fill="#e9e9d8" /><path d="m41 35 69-5v13l-69 6Z" fill="#c3d3c4" />
        <path d="m47 40 57-4" stroke="#faf5c6" strokeWidth="4" /><path d="m30 22 11 13v14L30 35Z" fill="#a8b7ac" />
        <path d="m64 59-15 18h15l-3 17 21-25H68l2-10Z" fill="#d2b46a" stroke="#ad8d40" />
      </>}
      {family === 'quiet' && <>
        <path d="m20 29 29-8v59l-29 9Z" fill="#9bab92" /><path d="m49 21 31 9v60l-31-10Z" fill="#bcc7a9" />
        <path d="m80 30 30-8v59l-30 9Z" fill="#8faaa2" /><path d="m20 89-3 6m32-15v12m31-2v9m30-18 4 8" strokeWidth="3" />
        <path d="m27 36 14-4m16 1 15 5m17-1 13-4" stroke="#e2e8d7" />
      </>}
      {family === 'guide' && <>
        <path d="m43 17 46 5v42l-46-5Z" fill="#d7ded7" /><path d="m49 24 34 4v26l-34-4Z" fill="#a2bec0" />
        <path d="m56 33 18 2m-18 6 12 1" stroke="#edf4ed" strokeWidth="3" /><path d="m64 62 1 22m-17 7 17-7 20 6" strokeWidth="5" />
        <path d="m25 59 12 2v18l-12-2Z" fill="#d4b378" /><path d="m28 65 5 1m-5 5 5 1" />
      </>}
    </g>
  </svg>
}

export default function ProcurementDesk({ game, room, onRoomChange, onBuy, onClose, initialFilter, onNotify, onManageEquipment }: ProcurementDeskProps) {
  const initialOffer = OFFERS.find((offer) => initialFilter !== 'all' && offer.id === initialFilter)
  const [category, setCategory] = useState('all')
  const [familyFilter, setFamilyFilter] = useState<string | null>(initialOffer?.family || null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialOffer?.id || null)
  const submitting = useRef(false)
  const detail = useRef<HTMLElement>(null)
  const selected = OFFERS.find((offer) => offer.id === selectedId)
  const selectedRoom = ROOM_DEFINITIONS.find((item) => item.id === room)!
  const equipmentUsage = getRoomEquipmentUsage(game.player, room)
  const selectedCompatible = selected ? roomSupportsOffer(room, selected.id) : true
  const available = freeCash(game.player)
  const seasonsLeft = 4 - game.season
  const termSeasons = (MAX_YEARS - game.year) * 4 + seasonsLeft
  const total = selected ? selected.price + selected.maintenance * seasonsLeft : 0
  const validation = useMemo(() => selected ? buyEquipment(game, selected.id, room) : null, [game, selected, room])
  const alternatives = selected ? OFFERS.filter((offer) => offer.family === selected.family) : []
  const requestedPrograms = selected ? PROGRAMS.filter((program) => program.requires.some((cap) => selected.capabilities.includes(cap))) : []
  const chosenCategory = CATEGORIES.find((item) => item.id === category)!
  const offers = OFFERS.filter((offer) => (!familyFilter || offer.family === familyFilter)
    && (category === 'all' || (chosenCategory.families as readonly string[]).includes(offer.family))
    && `${offer.name} ${offer.description}`.includes(query.trim()))

  useEffect(() => { submitting.current = false }, [game, room, selectedId])

  function chooseOffer(offer: Offer) {
    setSelectedId(offer.id)
    if (window.matchMedia('(max-width: 760px)').matches) {
      requestAnimationFrame(() => detail.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }))
    }
  }

  function submit() {
    if (!selected || submitting.current) return
    if (validation?.error) { onNotify?.(validation.error,'error'); return }
    submitting.current = true
    onBuy(selected.id)
  }

  function connectionNote(program: Program, offer: Offer) {
    const requirements = getProgramRequirements(game.player, room, program.id)
    if (!requirements.roomCompatible) return { ready: false, note: '이 공간의 운영 대상 아님' }
    const additional = requirements.missingFamilies.filter((family) => !offer.capabilities.includes(family)).map((family) => CAPABILITIES[family] || family)
    if (!requirements.spaceReady && !additional.includes('대강당')) additional.push(`${requirements.spaceRequired}㎡ 공간`)
    if (additional.length) return { ready: false, note: `${additional.join(' · ')} 추가 필요` }
    if (!game.player.rooms.find((item) => item.id === room)?.open) return { ready: false, note: '시설 개방 필요' }
    if (requirements.wornFamilies.length) return { ready: false, note: '기존 장비 정비 필요' }
    if (requirements.ready) return { ready: true, note: '이 방에서 운영 가능' }
    if (requirements.pendingFamilies.length) return { ready: false, note: '주문한 설비 설치 대기' }
    return { ready: false, note: '이 물품 설치 후 가능' }
  }

  return <div className="pps-desk">
    <ProcurementHeader service="shopping" location="계약상품 조회" guide="같은 기능도 가격·유지비·설치 시간이 달라요. 우리 공간에 맞게 골라 보세요." onClose={onClose} />
    <div className="pps-workflow" aria-label="물품 조달 순서"><span className={!selected ? 'is-current' : 'is-done'}><b>01</b> 상품 조회</span><Icon name="arrow" size={14} /><span className={selected ? 'is-current' : ''}><b>02</b> 비교 · 납품요구</span><Icon name="arrow" size={14} /><span><b>03</b> 납품 · 설치</span><small>{game.year}년 차 {SEASONS[game.season]}</small></div>

    <div className="pps-workspace">
      <aside className="pps-navigation">
        <h3>상품 분류</h3>
        <nav aria-label="조달 물품 분류">{CATEGORIES.map((item) => <button key={item.id} className={category === item.id && !familyFilter ? 'is-selected' : ''} aria-pressed={category === item.id && !familyFilter} onClick={() => { setCategory(item.id); setFamilyFilter(null); setQuery('') }}><Icon name={item.icon} size={18} /><span>{item.label}</span>{category === item.id && !familyFilter && <Icon name="arrow" size={12} />}</button>)}</nav>
        <div className="pps-budget"><small>우리 센터의 가용예산</small><strong>{money(available)}<span>점</span></strong><span>필수 운영비 {money(game.player.reserved)}점 별도 확보</span></div>
        <div className="pps-role"><span>조달청 → 계약 마련</span><p>우리 센터 → 상품 선택<br />공급업체 → 납품·설치</p></div>
      </aside>

      <section className="pps-catalog" aria-label="물품 카탈로그">
        <label className="pps-search"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="상품명·기능으로 검색" aria-label="조달 물품 검색" /></label>
        <div className="pps-catalog-top"><h3>{familyFilter ? '같은 기능 상품 비교' : chosenCategory.label}<span>{offers.length}건</span></h3><span className="pps-result-room">설치 대상 · {ROOM_NAMES[room]}</span></div>
        {familyFilter && <button className="pps-filter-reset" onClick={() => setFamilyFilter(null)}>전체 물품 보기 <Icon name="close" size={12} /></button>}
        <div className="pps-catalog-list">{offers.map((offer) => {
          const owned = game.player.inventory.some((equipment) => !equipment.stored && (equipment.room === room || equipment.room === null) && OFFERS.find((item) => item.id === equipment.id)?.family === offer.family)
          const compatible = roomSupportsOffer(room, offer.id)
          const connections = PROGRAMS.filter((program) => program.requires.some((capability) => offer.capabilities.includes(capability)))
          return <button className={`pps-product ${selectedId === offer.id ? 'is-selected' : ''} ${owned ? 'is-owned' : ''} ${!compatible ? 'is-incompatible' : ''}`} key={offer.id} aria-pressed={selectedId === offer.id} onClick={() => chooseOffer(offer)}>
            <span className="pps-product-image"><ProductDrawing family={offer.family} /></span>
            <span className="pps-product-info"><span className="pps-product-code">게임 물품번호 {offer.id}{owned && <em>보유 중</em>}</span><strong>{offer.name}</strong>{!compatible && <span className="pps-room-incompatible"><Icon name="lock" size={12} />이 공간에 설치 불가</span>}<span className="pps-product-connections" aria-label="연결 클래스와 효과">{connections.length ? <><small>연결 클래스 · 대관</small>{connections.map((program) => {
              const connection = connectionNote(program, offer)
              const name = isRentalProgram(program.id) ? program.shortName.includes('대관') ? program.shortName : `${program.shortName} 대관` : program.shortName
              return <span className={connection.ready ? 'is-ready' : 'needs-equipment'} key={program.id}><Icon name={connection.ready ? 'check' : 'plus'} size={11} /><b>{name}</b><em>{connection.note}</em></span>
            })}</> : <span className="operating-effect"><Icon name="tools" size={12} />{OPERATING_EFFECTS[offer.family] || offer.description}</span>}</span><span className="pps-product-facts"><span>단가 <b>{offer.price}</b>점</span><span>유지 <b>{offer.maintenance}</b>점/계절</span><span>설치 <b>{offer.installSlots}</b>칸</span></span></span>
            <span className="pps-product-select"><Icon name={selectedId === offer.id ? 'check' : 'plus'} size={17} /></span>
          </button>
        })}{offers.length === 0 && <div className="pps-no-results"><Icon name="box" size={34} /><p>찾는 물품이 없어요.</p><button onClick={() => { setQuery(''); setFamilyFilter(null); setCategory('all') }}>전체 물품 보기</button></div>}</div>
      </section>

      <aside ref={detail} className={`pps-request ${selected ? 'has-selection' : ''}`} aria-label="납품요구서">
        {selected ? <>
          <div className="pps-request-body">
          <div className="pps-request-title"><span>납품요구서</span><Icon name="calendar" size={20} /></div>
          <h3>{selected.name}</h3>
          {selected.exclusiveRoom && <p className="pps-room-spec">{ROOM_NAMES[selected.exclusiveRoom]} 전용 설비</p>}
          {alternatives.length > 1 && <div className="pps-comparison"><span>같은 기능 비교</span><div>{alternatives.map((offer) => <button key={offer.id} className={offer.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedId(offer.id)}><strong>{offer.name.replace(' 공예 세트', '').replace(' 음향 세트', '')}</strong><span>구매 {offer.price} · 유지 {offer.maintenance}</span><b>{offer.price + offer.maintenance * termSeasons}<small>점</small></b></button>)}</div><small>{MAX_YEARS}년 차까지 구매 + 정기 유지비 · 정비비 별도</small></div>}
          <label className="pps-room-select">납품·설치 장소<select value={room} onChange={(event) => onRoomChange(event.target.value as RoomId)}>{game.player.rooms.filter((item) => item.open).map((item) => <option key={item.id} value={item.id}>{ROOM_NAMES[item.id]}</option>)}</select></label>
          <div className="pps-room-spec"><span>{selectedRoom.area}㎡ · 정원 {selectedRoom.capacity}명</span><strong>활동 장비 {equipmentUsage.used}/{equipmentUsage.capacity}자리</strong><small>보조 {equipmentUsage.auxiliary.length}개 · 센터 공용 {equipmentUsage.common.length}개는 자리 별도</small></div>
          {equipmentUsage.full && <div className="pps-equipment-capacity">
            <strong>활동 장비 자리를 모두 사용하고 있어요</strong>
            <ul aria-label={`${ROOM_NAMES[room]}의 활동 장비`}>{equipmentUsage.activity.map(item => <li key={item.instanceId}>{item.name}{!item.ready && <small>설치 준비 중</small>}</li>)}</ul>
            <p>장비를 보관하거나 다른 방으로 옮기면 자리가 생겨요. 보관한 장비는 다시 설치할 수 있어요.</p>
            {onManageEquipment && <button type="button" onClick={onManageEquipment}>설치 장비 관리 <Icon name="arrow" size={13} /></button>}
          </div>}
          {!selectedCompatible && <p className="pps-room-incompatible pps-room-incompatible-detail"><Icon name="lock" size={14} />이 공간에 설치 불가 · 설치 장소를 바꿔 주세요.</p>}
          <div className="pps-unlocks"><span>{requestedPrograms.length ? '물품으로 가능한 클래스 · 대관' : '운영에 생기는 변화'}</span>{requestedPrograms.length ? <div>{requestedPrograms.map((program) => {
            const afterPurchase = validation && !validation.error ? validation.state.player : game.player
            const requirements = getProgramRequirements(afterPurchase, room, program.id)
            const ready = canRunProgram(afterPurchase, room, program.id)
            const missing = requirements.missingFamilies.filter((family) => !selected.capabilities.includes(family))
            const note = !requirements.roomCompatible ? '이 공간의 운영 대상 아님' : !requirements.spaceReady ? `${requirements.spaceRequired}㎡ 이상 필요`
              : missing.length ? `${missing.map((cap) => CAPABILITIES[cap] || cap).join(' · ')} 추가 필요`
                : requirements.wornFamilies.length ? '기존 장비 정비 필요'
                  : ready ? isRentalProgram(program.id) ? '대관 신청 승인 후 운영' : '이 방에서 개설 가능' : '이 방에 설치 완료 후 개설'
            return <span className={ready ? '' : 'needs-more'} key={program.id}><Icon name={ready ? 'check' : 'plus'} size={12} />{program.shortName}<small>{!isRentalProgram(program.id) && `${program.difficulty} · `}{note}</small></span>
          })}</div> : <p>{selected.description}</p>}</div>
          <dl className="pps-costs"><div><dt>물품 구매비</dt><dd>{selected.price}<span>점</span></dd></div><div><dt>올해 유지비 확보 <small>{seasonsLeft}계절</small></dt><dd>{selected.maintenance * seasonsLeft}<span>점</span></dd></div><div className="pps-total"><dt>필요 예산</dt><dd>{total}<span>점</span></dd></div><div className="pps-remaining"><dt>요청 후 가용예산</dt><dd>{money(available - total)}<span>점</span></dd></div></dl>
          <div className="pps-delivery"><Icon name="box" size={19} /><span>{ROOM_NAMES[room]}에 납품·설치<strong>첫 운영 주 준비 {selected.installSlots}칸 · 설치 후 해당 방에서 개설</strong></span></div>
          </div>
          <div className="pps-request-actions">
          {validation?.error && <p className="pps-error" role="status"><Icon name="help" size={16} />{validation.error}</p>}
          <button className="pps-submit" disabled={!selectedCompatible || Boolean(validation?.error) || game.phase !== 'planning'} onClick={submit}>납품요구 보내기 <Icon name="arrow" size={17} /></button>
          <small className="pps-request-note">요청하면 구매비가 지출되고 유지비는 따로 확보됩니다.</small>
          </div>
        </> : <div className="pps-request-empty"><span className="pps-request-document"><Icon name="calendar" size={39} /></span><h3>우리 센터의<br />다음 변화는?</h3><p>물품을 고르면 가격과 설치 계획이<br />이곳에 함께 표시됩니다.</p><div><Icon name="check" size={15} /><span>필요한 기능</span></div><div><Icon name="coin" size={15} /><span>구매비와 유지비</span></div><div><Icon name="calendar" size={15} /><span>설치할 공간과 시간</span></div></div>}
      </aside>
    </div>
    <footer className="pps-footer"><span><Icon name="home" size={14} /> 조달청 나라장터를 소재로 한 게임용 구매 모형</span><span>실제 거래·계약은 이루어지지 않습니다.</span></footer>
  </div>
}
