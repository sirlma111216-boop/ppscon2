import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon'
import { OFFERS, PROGRAMS, SEASONS, buyEquipment, canRunProgram, freeCash } from './simulation'
import type { GameState, Offer, RoomId } from './simulation'
import './ProcurementDesk.css'

interface ProcurementDeskProps {
  game: GameState
  room: RoomId
  onRoomChange: (room: RoomId) => void
  onBuy: (id: string) => void
  onClose: () => void
  initialFilter: string
}

const ROOM_NAMES: Record<RoomId, string> = { A: '문화교실', B: '다목적실', C: '행사실' }
const CATEGORIES = [
  { id: 'all', label: '전체 물품', icon: 'box', families: [] },
  { id: 'culture', label: '문화 · 교육', icon: 'brush', families: ['craft', 'digital'] },
  { id: 'sport', label: '생활체육', icon: 'sport', families: ['mat', 'flex'] },
  { id: 'event', label: '공연 · 발표', icon: 'music', families: ['audio', 'screen', 'stage'] },
  { id: 'operation', label: '센터 운영', icon: 'home', families: ['energy', 'quiet', 'guide'] },
] as const
const CAPABILITIES: Record<string, string> = {
  craft: '공예 도구', mat: '매트', flex: '이동식 가구', audio: '음향', screen: '영상 장비',
  digital: '교육용 컴퓨터', stage: '무대', hall: '열린 행사실', energy: '절전', quiet: '공간 분리', guide: '예약 안내',
}
const money = (value: number) => value.toLocaleString('ko-KR', { maximumFractionDigits: 1 })

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

export default function ProcurementDesk({ game, room, onRoomChange, onBuy, onClose, initialFilter }: ProcurementDeskProps) {
  const initialOffer = OFFERS.find((offer) => initialFilter !== 'all' && offer.id === initialFilter)
  const [category, setCategory] = useState('all')
  const [familyFilter, setFamilyFilter] = useState<string | null>(initialOffer?.family || null)
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(initialOffer?.id || null)
  const submitting = useRef(false)
  const detail = useRef<HTMLElement>(null)
  const selected = OFFERS.find((offer) => offer.id === selectedId)
  const available = freeCash(game.player)
  const seasonsLeft = 4 - game.season
  const termSeasons = (5 - game.year) * 4 + seasonsLeft
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
    if (!selected || validation?.error || submitting.current) return
    submitting.current = true
    onBuy(selected.id)
  }

  return <div className="pps-desk">
    <header className="pps-masthead">
      <div className="pps-wordmark"><span className="pps-mark"><Icon name="box" size={28} /></span><div><small>조달청</small><strong>나라장터<span>조달 업무</span></strong></div></div>
      <div className="pps-account"><span className="pps-game-label">게임 속 조달 화면</span><span>수요기관 · 늘봄 문화체육센터</span><button onClick={onClose}>센터로 돌아가기 <Icon name="arrow" size={14} /></button></div>
    </header>
    <div className="pps-workflow" aria-label="물품 조달 순서"><span className={!selected ? 'is-current' : 'is-done'}><b>01</b> 필요한 물품</span><Icon name="arrow" size={14} /><span className={selected ? 'is-current' : ''}><b>02</b> 비교 · 요청</span><Icon name="arrow" size={14} /><span><b>03</b> 납품 · 설치</span><small>{game.year}년 차 {SEASONS[game.season]}</small></div>

    <div className="pps-workspace">
      <aside className="pps-navigation">
        <h3>어떤 활동을 열까요?</h3>
        <nav aria-label="조달 물품 분류">{CATEGORIES.map((item) => <button key={item.id} className={category === item.id && !familyFilter ? 'is-selected' : ''} aria-pressed={category === item.id && !familyFilter} onClick={() => { setCategory(item.id); setFamilyFilter(null); setQuery('') }}><Icon name={item.icon} size={18} /><span>{item.label}</span>{category === item.id && !familyFilter && <Icon name="arrow" size={12} />}</button>)}</nav>
        <div className="pps-budget"><small>우리 센터의 가용예산</small><strong>{money(available)}<span>점</span></strong><span>필수 운영비 {money(game.player.reserved)}점 별도 확보</span></div>
        <div className="pps-role"><span>조달청의 역할</span><p>조달청은 계약을 마련해요.<br />센터는 물품을 선택해요.</p><small>물품·가격은 게임용 설정입니다.</small></div>
      </aside>

      <section className="pps-catalog" aria-label="물품 카탈로그">
        <div className="pps-catalog-top"><h3>{familyFilter ? '같은 기능, 다른 선택' : chosenCategory.label}<span>{offers.length}</span></h3><label className="pps-search"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><circle cx="10" cy="10" r="6" /><path d="m15 15 6 6" /></svg><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="물품 찾기" aria-label="조달 물품 검색" /></label></div>
        {familyFilter && <button className="pps-filter-reset" onClick={() => setFamilyFilter(null)}>전체 물품 보기 <Icon name="close" size={12} /></button>}
        <div className="pps-catalog-list">{offers.map((offer) => {
          const owned = game.player.inventory.some((equipment) => OFFERS.find((item) => item.id === equipment.id)?.family === offer.family)
          return <button className={`pps-product ${selectedId === offer.id ? 'is-selected' : ''} ${owned ? 'is-owned' : ''}`} key={offer.id} aria-pressed={selectedId === offer.id} onClick={() => chooseOffer(offer)}>
            <span className="pps-product-image"><ProductDrawing family={offer.family} /></span>
            <span className="pps-product-info"><span className="pps-product-code">게임 물품 {offer.id}{owned && <em>보유 중</em>}</span><strong>{offer.name}</strong><span className="pps-product-description">{offer.description}</span><span className="pps-product-facts"><span>구매 <b>{offer.price}</b>점</span><span>유지 <b>{offer.maintenance}</b>점/계절</span><span>설치 <b>{offer.installSlots}</b>칸</span></span></span>
            <span className="pps-product-select"><Icon name={selectedId === offer.id ? 'check' : 'plus'} size={17} /></span>
          </button>
        })}{offers.length === 0 && <div className="pps-no-results"><Icon name="box" size={34} /><p>찾는 물품이 없어요.</p><button onClick={() => { setQuery(''); setFamilyFilter(null); setCategory('all') }}>전체 물품 보기</button></div>}</div>
      </section>

      <aside ref={detail} className={`pps-request ${selected ? 'has-selection' : ''}`} aria-label="조달 요청서">
        {selected ? <>
          <div className="pps-request-body">
          <div className="pps-request-title"><span>선택한 물품</span><Icon name="calendar" size={20} /></div>
          <h3>{selected.name}</h3>
          {alternatives.length > 1 && <div className="pps-comparison"><span>같은 기능 비교</span><div>{alternatives.map((offer) => <button key={offer.id} className={offer.id === selectedId ? 'is-selected' : ''} onClick={() => setSelectedId(offer.id)}><strong>{offer.name.replace(' 공예 세트', '').replace(' 음향 세트', '')}</strong><span>구매 {offer.price} · 유지 {offer.maintenance}</span><b>{offer.price + offer.maintenance * termSeasons}<small>점</small></b></button>)}</div><small>5년 차까지 구매 + 정기 유지비 · 정비비 별도</small></div>}
          <label className="pps-room-select">설치할 공간<select value={room} onChange={(event) => onRoomChange(event.target.value as RoomId)}>{game.player.rooms.filter((item) => item.open).map((item) => <option key={item.id} value={item.id}>{ROOM_NAMES[item.id]}</option>)}</select></label>
          <div className="pps-unlocks"><span>{requestedPrograms.length ? '물품으로 열리는 활동' : '운영에 생기는 변화'}</span>{requestedPrograms.length ? <div>{requestedPrograms.map((program) => {
            const ready = validation && !validation.error && canRunProgram(validation.state.player, room, program.id)
            const missing = program.requires.filter((cap) => cap === 'hall' ? room !== 'C' : !selected.capabilities.includes(cap) && !game.player.inventory.some((equipment) => equipment.room === room && OFFERS.find((item) => item.id === equipment.id)?.capabilities.includes(cap)))
            return <span className={ready ? '' : 'needs-more'} key={program.id}><Icon name={ready ? 'check' : 'plus'} size={12} />{program.shortName}{missing.length > 0 && <small>{missing.map((cap) => CAPABILITIES[cap]).join(' · ')} 필요</small>}</span>
          })}</div> : <p>{selected.description}</p>}</div>
          <dl className="pps-costs"><div><dt>물품 구매비</dt><dd>{selected.price}<span>점</span></dd></div><div><dt>올해 유지비 확보 <small>{seasonsLeft}계절</small></dt><dd>{selected.maintenance * seasonsLeft}<span>점</span></dd></div><div className="pps-total"><dt>필요 예산</dt><dd>{total}<span>점</span></dd></div><div className="pps-remaining"><dt>요청 후 가용예산</dt><dd>{money(available - total)}<span>점</span></dd></div></dl>
          <div className="pps-delivery"><Icon name="box" size={19} /><span>첫 운영 주에 납품·설치<strong>설치 준비 {selected.installSlots}칸 사용</strong></span></div>
          </div>
          <div className="pps-request-actions">
          {validation?.error && <p className="pps-error" role="status"><Icon name="help" size={16} />{validation.error}</p>}
          <button className="pps-submit" disabled={Boolean(validation?.error) || game.phase !== 'planning'} onClick={submit}>조달 요청 보내기 <Icon name="arrow" size={17} /></button>
          <small className="pps-request-note">요청하면 구매비가 지출되고 유지비는 따로 확보됩니다.</small>
          </div>
        </> : <div className="pps-request-empty"><span className="pps-request-document"><Icon name="calendar" size={39} /></span><h3>우리 센터의<br />다음 변화는?</h3><p>물품을 고르면 가격과 설치 계획이<br />이곳에 함께 표시됩니다.</p><div><Icon name="check" size={15} /><span>필요한 기능</span></div><div><Icon name="coin" size={15} /><span>구매비와 유지비</span></div><div><Icon name="calendar" size={15} /><span>설치할 공간과 시간</span></div></div>}
      </aside>
    </div>
    <footer className="pps-footer"><span><Icon name="home" size={14} /> 조달청 나라장터를 소재로 한 게임용 구매 모형</span><span>실제 거래·계약은 이루어지지 않습니다.</span></footer>
  </div>
}
