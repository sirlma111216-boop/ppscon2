import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import CenterScene from './CenterScene'
import ProcurementDesk from './ProcurementDesk'
import RentalReview from './RentalReview'
import FacilityDesk from './FacilityDesk'
import CampusDesk from './CampusDesk'
import SeasonReview from './SeasonReview'
import { campusTier } from './campusProjects'
import { getFacilityProject } from './facilityProjects'
import Icon from './Icon'
import { playSound, setMusic } from './audio'
import { BLOCKS, EVALUATION_INTERVAL, MAX_TURNS, MAX_YEARS, OFFERS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, SEASONS, buyEquipment, canRunProgram, createGame, decideRental, finalScore, finishRentalReview, freeCash, getAwardForRank, getDemand, getFinalStandings, getLevel, getProgramRequirements, getRentalAt, getRoomManagement, isRentalProgram, maintainRoom, migrateSave, moveEquipment, nextSeason, previewSeason, reopenRentalReview, replaceClassWithRental, roomCapacity, roomSupportsOffer, roomSupportsProgram, runSeason, setGuideMode, setPriceMode, setProgram, setWeekendSupport, trainStaff } from './simulation'
import type { GameState, ProgramId, RentalRequest, RoomId } from './simulation'

const SAVE_KEY = 'ppscon2.center.v1'
const INTRO_KEY = 'ppscon2.intro.v1'
const PROGRAM_ICONS: Record<string, string> = { P01: 'brush', P02: 'brush', P03: 'sport', P04: 'sport', P05: 'chat', P06: 'people', P07: 'screen', P08: 'music', P09: 'music', P10: 'screen' }
const FAMILY_NAMES: Record<string, string> = { craft: '공예 도구', mat: '체육 매트', audio: '음향', digital: '교육용 컴퓨터', screen: '영상·발표 장비', stage: '이동무대', hall: '대강당' }
function classStatus(requirements: ReturnType<typeof getProgramRequirements>, roomOpen = true) {
  if (!roomOpen) return '시설 개방 필요'
  if (!requirements.spaceReady) return `${requirements.spaceRequired}㎡ 이상 필요`
  if (requirements.ready) return '개설 가능'
  if (requirements.missingFamilies.length) return '설비 조달 필요'
  if (requirements.pendingFamilies.length) return '설치 대기'
  return '설비 정비 필요'
}
const CAST = { jiseon: { name: '오지선', role: '운영팀장', file: 'jiseon' }, doyun: { name: '한도윤', role: '시설 담당', file: 'doyun' }, harin: { name: '윤하린', role: '문화강사', file: 'harin' } }
type ModalName = 'welcome' | 'shop' | 'facility' | 'campus' | 'replace-class' | 'rivals' | 'review' | 'help' | 'reset' | 'demand' | null
const money = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
function initialGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const saved: unknown = JSON.parse(raw)
      const migrated = migrateSave(saved)
      if (migrated) return migrated
    }
  } catch { /* A damaged save should not prevent starting. */ }
  return createGame()
}
function Modal({ title, onClose, children, wide = false, className = '' }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; className?: string }) {
  const container = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => { closeRef.current = onClose }, [onClose])
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focusable = () => [...(container.current?.querySelectorAll<HTMLElement>('button:not([disabled]),select:not([disabled]),input:not([disabled]),a[href]') || [])].filter((element) => element.getClientRects().length > 0)
    focusable()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current()
      if (event.key !== 'Tab') return
      const list = focusable()
      const first = list[0], last = list.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; before?.focus() }
  }, [])
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <div ref={container} className={`game-modal ${wide ? 'wide' : ''} ${className}`} role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="닫기" onClick={onClose}><Icon name="close" /></button></div>
      {children}
    </div>
  </div>
}

export default function CenterGame() {
  const [rawGame, setGame] = useState<GameState>(initialGame)
  const game = useMemo(() => {
    const needsSchemaUpgrade = rawGame.rivals.length === 10 || [rawGame.player, ...rawGame.rivals].some((institution) => !Array.isArray(institution.evaluations) || !institution.evaluationStats || !Number.isFinite(institution.annualBudget))
    return needsSchemaUpgrade ? migrateSave(rawGame) || rawGame : rawGame
  }, [rawGame])
  useEffect(() => { if (game !== rawGame) setGame(game) }, [game, rawGame])
  const [room, setRoom] = useState<RoomId>('A')
  const [insideRoom, setInsideRoom] = useState(false)
  const [selected, setSelected] = useState<ProgramId | null>(null)
  const [modal, setModal] = useState<ModalName>(() => {
    try { return localStorage.getItem(INTRO_KEY) ? null : 'welcome' } catch { return 'welcome' }
  })
  const [shopFilter, setShopFilter] = useState('all')
  const [replacementRentalId, setReplacementRentalId] = useState<string | null>(null)
  const [toast, setToast] = useState('')
  const [dialogue, setDialogue] = useState(() => game.history.length ? `${game.year}년 차 ${SEASONS[game.season]}, 우리 센터의 계획을 이어가 볼까요?` : '센터장님, 운영 중인 공간에 대관 신청이 왔어요. 어떤 모임을 받을까요?')
  const [speaker, setSpeaker] = useState<keyof typeof CAST>('jiseon')
  const [playing, setPlaying] = useState(false)
  const [activeSlot, setActiveSlot] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [music, updateMusic] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [saved, setSaved] = useState(true)
  const [detail, setDetail] = useState(false)
  const [rivalId, setRivalId] = useState('')
  const preview = useMemo(() => game.phase === 'planning' ? game.planningStage === 'classes' ? previewSeason(game) : null : game.lastReport, [game])
  const roomState = game.player.rooms.find((r) => r.id === room)!
  const canPlan = game.phase === 'planning' && !playing
  const reviewingRentals = canPlan && game.planningStage === 'rentals'
  const canEdit = canPlan && game.planningStage === 'classes'
  const roomDefinition = ROOM_DEFINITIONS.find((item) => item.id === room)!
  const facilityProject = getFacilityProject(game.player, room)
  const acceptedRentals = game.player.rentalRequests.filter((request) => request.status === 'accepted')
  const pendingRentals = game.player.rentalRequests.filter((request) => request.status === 'pending')
  const replacementRental = game.player.rentalRequests.find((request) => request.id === replacementRentalId)
  const replacementProgram = replacementRental ? PROGRAMS.find((program) => program.id === game.player.plan[replacementRental.room][replacementRental.slot]) : undefined
  const sceneRooms = game.phase === 'planning'
    ? game.player.rooms.map((r) => ({ ...r, equipment: r.equipment.filter((id) => game.player.inventory.some((item) => item.id === id && item.room === r.id && item.ready)) }))
    : game.player.rooms
  const currentProgram = PROGRAMS.find((p) => p.id === selected && roomSupportsProgram(room, p.id))
  const currentRequirements = currentProgram ? getProgramRequirements(game.player, room, currentProgram.id) : null
  const cast = CAST[speaker]
  const turn = (game.year - 1) * 4 + game.season + 1
  const standings = game.phase === 'ending' ? getFinalStandings(game) : [...game.rivals, game.player].sort((a, b) => b.score - a.score || b.publicScore - a.publicScore || b.experienceScore - a.experienceScore || a.name.localeCompare(b.name))
  const demand = useMemo(() => getDemand(game).filter((group) => group.programs.some((id) => !isRentalProgram(id))), [game.seed, game.year, game.season])
  const selectedDemand = demand.filter((group) => selected && group.programs.includes(selected))
  const rival = [game.player, ...game.rivals].find((r) => r.id === rivalId) || game.player
  const rivalIsPlayer = rival.id === game.player.id
  const playerExterior = `/center/building-v2/${['exterior', 'exterior-garden', 'exterior-renovated'][campusTier(game.player)]}.webp`
  const rivalExterior = rivalIsPlayer ? playerExterior : `/center/rivals-v2/${rival.id}.webp`
  useEffect(() => {
    try {
      const previous = localStorage.getItem(SAVE_KEY)
      if (previous) {
        let needsBackup = false
        try {
          const parsed = JSON.parse(previous) as { version?: unknown; rivals?: unknown[]; player?: { evaluations?: unknown; evaluationStats?: unknown; annualBudget?: unknown } }
          const oldEvaluationSchema = parsed.version === 2 && (!Array.isArray(parsed.player?.evaluations) || !parsed.player?.evaluationStats || typeof parsed.player?.annualBudget !== 'number')
          needsBackup = parsed.version === 1 || oldEvaluationSchema || (parsed.version === 2 && Array.isArray(parsed.rivals) && parsed.rivals.length === 10)
        } catch { /* Invalid saves are handled by initialGame. */ }
        if (needsBackup) {
          const backupKey = `${SAVE_KEY}.backup`
          const backup = localStorage.getItem(backupKey)
          // Preserve the original save before upgrading its schema or rival roster.
          if (backup !== previous) localStorage.setItem(backup ? `${backupKey}.${Date.now()}` : backupKey, previous)
        }
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(game)); setSaved(true)
    } catch { setSaved(false) }
  }, [game])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer) }, [toast])
  useEffect(() => { if (selected && !roomSupportsProgram(room, selected)) setSelected(null) }, [room, selected])
  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => {
      if (activeSlot >= 4) { setPlaying(false); setModal('review'); playSound('result') }
      else setActiveSlot((slot) => slot + 1)
    }, reducedMotion ? 700 : 3000 / speed)
    return () => clearTimeout(timer)
  }, [playing, activeSlot, speed, reducedMotion])
  useEffect(() => () => setMusic(false), [])
  const dismissWelcome = () => {
    try { localStorage.setItem(INTRO_KEY, 'seen') } catch { /* optional */ }
    setModal(null)
  }
  function selectRoom(value: RoomId) { setRoom(value); setInsideRoom(true); playSound('select'); setDetail(false) }
  function leaveRoom() { setInsideRoom(false); setDetail(false); playSound('select') }
  function chooseProgram(id: ProgramId) {
    if (!canEdit || !roomSupportsProgram(room, id)) return
    const program = PROGRAMS.find((p) => p.id === id)!
    setSelected(id); playSound('select')
    if (!canRunProgram(game.player, room, id)) {
      setSpeaker('doyun'); setDialogue(!roomState.open ? `${ROOM_NAMES[room]}을 먼저 개방해야 해요. 필요한 클래스 설비도 미리 살펴보세요.` : `${ROOM_NAMES[room]}에 필요한 설비를 갖춰야 ${program.shortName} 수업을 열 수 있어요.`)
      if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.class-requirements')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }))
      return
    }
    setSpeaker('jiseon')
    setDialogue(`${program.shortName}, 좋아요. 아래 일정에서 원하는 시간에 놓아 주세요.`)
    if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.schedule-panel')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }))
  }
  function place(slot: number, id: ProgramId | null = selected) {
    if (!canEdit || !roomState.open) return
    if (getRentalAt(game.player, room, slot)) { setToast('승인한 대관 시간이에요. 대관을 취소한 뒤 편성할 수 있어요.'); return }
    if (id && isRentalProgram(id)) return
    if (id && !canRunProgram(game.player, room, id)) { setToast('이 방의 설비 조건을 확인해 주세요. 설치가 끝나야 클래스를 편성할 수 있어요.'); return }
    setGame((state) => setProgram(state, room, slot, id)); playSound('select')
    setDialogue('한 주의 모양이 잡히네요. 준비 시간이 겹치지는 않는지 볼까요?')
  }
  function act(result: { state: GameState; error?: string }, success: string, actor: keyof typeof CAST = 'doyun') {
    if (result.error) { setToast(result.error); return false }
    setGame(result.state); setSpeaker(actor); setDialogue(success); playSound('buy'); return true
  }
  function buy(id: string) {
    const offer = OFFERS.find((o) => o.id === id)!
    const result = buyEquipment(game, id, room)
    if (act(result, `${offer.name} 조달을 요청했어요. 첫 주에 납품받아 확인하고 설치할게요.`)) {
      setModal(null)
    }
  }
  function start() {
    if (!canEdit) return
    try {
      const next = runSeason(game)
      setGame(next); setActiveSlot(0); setPlaying(true); setModal(null); setSpeaker('jiseon')
      setDialogue('13주 운영을 마쳤어요. 마지막 주의 공간과 이용 기록을 함께 볼까요?'); playSound('run')
      requestAnimationFrame(() => document.querySelector('.scene-card')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
    } catch { setToast('이번 계획을 실행하지 못했어요. 편성을 확인해 주세요.') }
  }
  function continueGame() {
    const next = nextSeason(game); setGame(next); setInsideRoom(false); setModal(next.phase === 'ending' ? 'review' : null); setSpeaker('jiseon')
    setDialogue(next.phase === 'ending' ? `센터장님과 함께한 ${MAX_YEARS}년, 동네에 참 많은 변화가 생겼어요.` : `${SEASONS[next.season]}의 대관 신청이 도착했어요. 수입과 클래스 시간을 함께 생각해 봐요.`)
  }
  function reviewRental(id: string, status: RentalRequest['status']) {
    const request = game.player.rentalRequests.find((item) => item.id === id)
    const existingClass = request && game.player.plan[request.room][request.slot]
    if (status === 'accepted' && existingClass && !isRentalProgram(existingClass)) {
      setReplacementRentalId(id); setModal('replace-class'); return
    }
    const result = decideRental(game, id, status)
    if (result.error) { setToast(result.error); return }
    setGame(result.state); playSound('select')
  }
  function closeReplacement() { setReplacementRentalId(null); setModal(null) }
  function confirmReplacement() {
    if (!replacementRentalId) return
    const result = replaceClassWithRental(game, replacementRentalId)
    if (result.error) { setToast(result.error); return }
    setGame(result.state); closeReplacement(); playSound('select')
    setSpeaker('jiseon'); setDialogue('선택한 시간의 클래스를 취소하고 대관을 승인했어요.')
  }
  function finishRentals() {
    setGame(finishRentalReview(game)); setSpeaker('harin')
    setDialogue('대관 일정이 정해졌네요. 남은 시간에 주민을 위한 클래스를 열어 볼까요?')
    playSound('select')
    requestAnimationFrame(() => document.querySelector('.planning-steps')?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' }))
  }
  function editRentals(cancelId?: string) {
    const next = reopenRentalReview(game)
    if (cancelId) {
      const result = decideRental(next, cancelId, 'pending')
      if (result.error) { setToast(result.error); return }
      setGame(result.state)
    } else setGame(next)
    setSpeaker('jiseon'); setDialogue('대관을 다시 검토해요. 이미 편성한 클래스와 시간이 겹치지 않는지 확인해 주세요.')
    playSound('select')
  }
  const openShop = () => { setShopFilter('all'); setModal('shop') }
  function openRequiredShop(family?: string) {
    const required = family || currentRequirements?.missingFamilies[0]
    setShopFilter(OFFERS.find((offer) => offer.family === required)?.id || 'all')
    setModal('shop')
  }

  return <div className={`center-game ${!insideRoom ? 'is-exploring' : ''} ${reducedMotion ? 'reduce-motion' : ''}`}>
    <header className="topbar">
      <a href="#" className="brand" onClick={(e) => e.preventDefault()}><span className="brand-symbol"><Icon name="home" size={25} /></span><span>센터장님,<br /><strong>다음 주는요?</strong></span></a>
      <div className="center-identity"><span className="tiny-dot" /> 늘봄 문화체육센터 <span className="identity-tag">센터 운영 일지</span></div>
      <div className="top-actions"><span className={`save-state ${!saved ? 'unsaved' : ''}`}><Icon name={saved ? 'check' : 'help'} size={13} />{saved ? '자동 저장됨' : '저장 공간 확인'}</span><button className="icon-button" aria-label={music ? '음악 끄기' : '음악 켜기'} title="음악 · 초기 합성 스케치" onClick={() => { updateMusic(!music); setMusic(!music) }}><Icon name={music ? 'volume' : 'mute'} /></button><button className="icon-button" aria-label="도움말과 설정" onClick={() => setModal('help')}><Icon name="help" /></button></div>
    </header>

    <main className="game-layout">
      <div className="page-heading"><div><div className="eyebrow">센터 운영 일지</div><h1>{game.phase === 'ending' ? `우리의 ${MAX_YEARS}년이 남긴 것` : playing ? '한 계절의 운영을 돌아봅니다' : reviewingRentals ? '센터의 문을 여는 순서' : '우리 동네의 다음 주'}</h1></div><div className="season-badge"><span className="season-symbol"><Icon name={game.season === 0 ? 'leaf' : game.season === 1 ? 'sun' : game.season === 2 ? 'leaf' : 'sparkle'} size={25} /></span><div><small>{game.year}년 차</small><strong>{SEASONS[game.season]} <span>· {turn}/{MAX_TURNS}</span></strong></div></div><div className="budget-badge" title={`총 현금 ${money(game.player.cash)} · 필수 운영비 유보 ${money(game.player.reserved)}`}><Icon name="coin" size={25} /><div><small>쓸 수 있는 예산</small><strong>{money(freeCash(game.player))}<span>점</span></strong></div></div></div>

      <div className="planning-steps" aria-label="계절 운영 순서">
        <span className={reviewingRentals ? 'is-current' : 'is-done'}><b>01</b> 대관 신청 검토</span><Icon name="arrow" size={13} />
        <span className={canEdit ? 'is-current' : ''}><b>02</b> 클래스 편성</span><Icon name="arrow" size={13} />
        <span className={playing || game.phase !== 'planning' ? 'is-current' : ''}><b>03</b> 운영 · 결산</span>
        {canEdit && <button className="text-button" onClick={() => editRentals()}>대관 다시 검토 <Icon name="arrow" size={12} /></button>}
      </div>
      <div className={`main-grid ${!insideRoom ? 'is-exterior' : reviewingRentals ? 'is-rental-room' : 'is-room-view'}`}>
        <section className="play-column" aria-label="센터와 주간 계획">
          <div className="scene-card"><div className="scene-toolbar"><span><span className={`live-dot ${playing ? 'active' : ''}`} />{playing ? `13주차 · 마지막 주 결과 · ${BLOCKS[activeSlot]}` : insideRoom ? `${ROOM_NAMES[room]} 둘러보기` : '늘봄 문화체육센터'}</span><div>{playing ? <><button className="text-button" onClick={() => setSpeed(speed === 1 ? 2 : 1)}>{speed}× 속도</button><button className="text-button" onClick={() => { setPlaying(false); setModal('review') }}>건너뛰기 <Icon name="arrow" size={13} /></button></> : <span className="scene-instruction">{insideRoom ? '공간 안에서 다음 계획을 세워요' : '방 이름을 눌러 들어가세요'} <Icon name="arrow" size={12} /></span>}</div></div>
            <div className="scene-stage"><CenterScene selectedRoom={room} view={insideRoom ? 'room' : 'exterior'} onSelectRoom={selectRoom} onBack={leaveRoom} campusTier={campusTier(game.player)} onOpenCampus={() => setModal('campus')} rooms={sceneRooms} facilityProjects={game.player.facilityProjects} plan={game.player.plan} running={playing} activeSlot={activeSlot} season={game.season} report={playing ? game.lastReport : null} reducedMotion={reducedMotion} /></div>
            {insideRoom && <div className="scene-footer"><span><Icon name="people" size={15} /> 주민과 함께 자라는 공간</span><span><Icon name="heart" size={14} /> 신뢰 {Math.round(game.player.trust)} <i /> 명성 {Math.round(game.player.reputation)} <i /> 관리 {Math.round(getRoomManagement(game.player, room))}</span></div>}
          </div>

          {insideRoom && reviewingRentals && <RentalReview game={game} room={room} onRoomChange={selectRoom} onDecide={reviewRental} onClearClass={(slot) => setGame(setProgram(game, room, slot, null))} onOpenFacility={(targetRoom) => { selectRoom(targetRoom); setModal('facility') }} />}
          {insideRoom && !reviewingRentals && <section className="schedule-panel" aria-label={`${ROOM_NAMES[room]} 주간 계획`}>
            <div className="section-heading"><div><span className="small-overline">02 · 남은 시간에 클래스 편성</span><h2>{ROOM_NAMES[room]}의 한 주</h2></div><span className="schedule-hint">{canEdit && currentProgram ? <><Icon name={PROGRAM_ICONS[currentProgram.id]!} size={15} /><b>{currentProgram.shortName}</b> {currentRequirements?.ready ? '선택 중' : '개설 조건 확인'}</> : '이 계획으로 13주를 운영해요'}</span></div>
            <div className="schedule-slots">{BLOCKS.map((block, index) => {
              const rental = getRentalAt(game.player, room, index)
              const id = game.player.plan[room][index]
              const p = PROGRAMS.find((program) => program.id === id)
              const available = !id || canRunProgram(game.player, room, id)
              return <div key={block} className={`schedule-slot ${playing && activeSlot === index ? 'is-active' : ''} ${rental ? 'kind-rental' : p ? `kind-${p.kind}` : 'empty'} ${available ? '' : 'unavailable'}`} onDragOver={(event) => { if (canEdit && !rental) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); if (rental) return; const value = event.dataTransfer.getData('text/plain') as ProgramId; if (PROGRAMS.some((program) => program.id === value && !isRentalProgram(program.id))) place(index, value) }}>
                <span className="slot-day">{block}<small>{rental ? '대관' : index < 3 ? '평일' : '주말'}</small></span>
                {rental ? <><div className="slot-content rental-slot-content"><span className="slot-icon"><Icon name="lock" size={23} /></span><strong>{rental.client}</strong><small>{rental.attendees}명 · {money(rental.fee)}점/주</small><span className="rental-slot-label">승인한 대관</span></div>{canEdit && <button className="cancel-rental-slot" onClick={() => editRentals(rental.id)} aria-label={`${block} ${rental.client} 대관 승인 취소`}>승인 취소</button>}</> : <><button className="slot-content" aria-label={`${block}: ${p?.name || '빈 시간'}. 선택한 클래스 배치`} onClick={() => place(index)} disabled={!canEdit || !roomState.open || !currentRequirements?.ready}><span className="slot-icon"><Icon name={p ? PROGRAM_ICONS[p.id]! : 'plus'} size={25} /></span><strong>{p?.shortName || '클래스 놓기'}</strong><small>{!available ? '장비 확인 필요' : p ? `${roomCapacity(room, p.id)}명 · 준비 ${p.support}` : '비워 두어도 괜찮아요'}</small></button>{p && canEdit && <button className="clear-slot" aria-label={`${block} 클래스 비우기`} onClick={() => place(index, null)}><Icon name="close" size={12} /></button>}</>}
              </div>
            })}</div>
            <div className="schedule-bottom"><span><Icon name="calendar" size={14} />매주 반복 · 대관은 잠금 · 빈 시간은 쉬어가요</span><button className="text-button" disabled={!canEdit} onClick={() => { let next = game; for (let i = 0; i < 5; i++) if (!getRentalAt(next.player, room, i)) next = setProgram(next, room, i, null); setGame(next) }}>클래스 비우기</button></div>
          </section>}
        </section>

        {insideRoom && !reviewingRentals && <aside className="decision-column">
          <div className="room-panel"><div className="section-heading"><div><span className="small-overline">클래스 · 명성 투자</span><h2>{ROOM_NAMES[room]}</h2></div><span className="room-letter">{room}</span></div>
            <button className="room-change-link text-button" onClick={leaveRoom}>다른 공간 둘러보기 <Icon name="arrow" size={12} /></button>
            <div className="room-overview"><span>{roomDefinition.area}㎡ · 정원 {roomDefinition.capacity}명</span><span>관리 신뢰 <b>{Math.round(getRoomManagement(game.player, room))}</b></span></div>
            <p className="room-purpose">{roomDefinition.description}</p>
            {!roomState.open && <div className="room-facility-entry"><span><Icon name="lock" size={14} />{facilityProject?.stage === 'construction' ? `공사 중 · ${facilityProject.remainingWeeks}주 남음` : '시설 조성 후 개방할 공간'}</span><button className="class-requirement-action" onClick={() => setModal('facility')}><Icon name="tools" size={15} />{facilityProject?.stage === 'construction' ? '시공 현황 보기' : '시설 입찰 진행'}<Icon name="arrow" size={13} /></button></div>}
            <>{currentProgram && <button className="demand-peek" onClick={() => setModal('demand')}><Icon name="people" size={17} /><span>{currentProgram?.shortName || '주민'} 신청 <b>{selectedDemand.reduce((sum, group) => sum + group.people, 0)}명</b></span><Icon name="arrow" size={13} /></button>}<div className="activity-heading"><span>어떤 클래스를 열까요?</span><small>자물쇠를 눌러 조건 확인</small></div>
            <div className="activity-grid">{PROGRAMS.filter((p) => !isRentalProgram(p.id) && roomSupportsProgram(room, p.id)).map((p) => {
              const requirements = getProgramRequirements(game.player, room, p.id)
              return <button key={p.id} className={`activity-chip class-card ${selected === p.id ? 'chosen' : ''} ${!requirements.ready ? 'locked' : ''}`} disabled={!canEdit} aria-pressed={selected === p.id} aria-label={`${p.name} · ${p.difficulty} · ${ROOM_NAMES[room]} ${classStatus(requirements, roomState.open)}`} draggable={canEdit && requirements.ready} onDragStart={(e) => { if (!canEdit || !requirements.ready) { e.preventDefault(); return } e.dataTransfer.setData('text/plain', p.id); setSelected(p.id) }} onClick={() => chooseProgram(p.id)}>
                <span className="class-card-art"><img src={`/center/classes-v2/${p.id}.webp`} alt="" draggable={false} loading="lazy" onError={(event) => { event.currentTarget.style.visibility = 'hidden' }} /><Icon name={PROGRAM_ICONS[p.id]!} size={28} /></span>
                <span className="class-card-name"><b>{p.shortName}</b>{!requirements.ready && <Icon name="lock" size={13} />}{selected === p.id && <span className="class-card-selected"><Icon name="check" size={12} /></span>}</span>
              </button>
            })}</div>
            {currentProgram && currentRequirements && <section className={`class-requirements ${currentRequirements.ready ? 'is-ready' : ''}`} aria-label={`${currentProgram.name} 개설 조건`} aria-live="polite">
              <div className="class-requirements-heading"><strong>{currentProgram.shortName}</strong><em className={`difficulty-badge difficulty-${currentProgram.difficulty}`}>{currentProgram.difficulty}</em><span>{ROOM_NAMES[room]} 기준</span></div>
              <p className="class-requirement-summary">{currentProgram.requirementLabel} · {classStatus(currentRequirements, roomState.open)}</p>
              {currentProgram.requires.length > 0 ? <ul className="class-equipment-list">{currentProgram.requires.map((family) => {
                const status = currentRequirements.missingFamilies.includes(family) ? '필요' : currentRequirements.pendingFamilies.includes(family) ? '설치 대기' : currentRequirements.wornFamilies.includes(family) ? '정비 필요' : '설치 완료'
                return <li key={family} className={status === '설치 완료' ? 'is-ready' : ''}><span><Icon name={status === '설치 완료' ? 'check' : status === '설치 대기' ? 'box' : 'lock'} size={12} />{FAMILY_NAMES[family] || family}</span><b>{status}</b></li>
              })}</ul> : <p className="class-ready-note">별도 설비 없음 · 무료 주민 모임</p>}
              {!roomState.open ? <div className="class-space-warning"><Icon name="lock" size={14} />시설 개방 후 편성 가능<button className="text-button" onClick={() => setModal('facility')}>시설 입찰 확인 <Icon name="arrow" size={12} /></button></div> : !currentRequirements.spaceReady ? <p className="class-space-warning"><Icon name="home" size={14} />{currentRequirements.spaceRequired}㎡ 이상인 방을 골라 주세요. 현재 {roomDefinition.area}㎡</p> : <>
                {currentRequirements.missingFamilies.length > 0 && <button className="class-requirement-action" disabled={!canEdit} onClick={() => openRequiredShop()}><Icon name="box" size={15} />필요 물품 조달<Icon name="arrow" size={13} /></button>}
                {currentRequirements.pendingFamilies.length > 0 && <p className="class-install-note"><Icon name="box" size={13} />{currentRequirements.missingFamilies.length || currentRequirements.wornFamilies.length ? '주문한 설비는 이번 운영 때 설치돼요.' : '설치 대기 · 이번 운영 후 개설 가능'}</p>}
                {currentRequirements.wornFamilies.length > 0 && <button className="class-requirement-action" disabled={!canEdit} onClick={() => { setDetail(true); requestAnimationFrame(() => document.querySelector('.room-details')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })) }}><Icon name="tools" size={15} />시설 관리 열기<Icon name="arrow" size={13} /></button>}
                {currentRequirements.ready && <p className="class-ready-note"><Icon name="check" size={13} />빈 시간에 놓기 · 정원 {roomCapacity(room, currentProgram.id)}명{currentProgram.id !== 'P06' && <span>{currentProgram.income > 0 ? '수강료 수입' : '무료 운영'} · 명성 성장</span>}</p>}
              </>}
              {acceptedRentals.some((request) => request.room === room) && currentProgram.id !== 'P06' && <div className="class-rental-tradeoff"><span>이 방 대관 {acceptedRentals.filter((request) => request.room === room).length}건 · {money(acceptedRentals.filter((request) => request.room === room).reduce((sum, request) => sum + request.fee, 0))}점/주</span><button className="text-button" disabled={!canEdit} onClick={() => editRentals()}>클래스 시간 확보 <Icon name="arrow" size={12} /></button></div>}
            </section>}
            <button className="procurement-button" disabled={!canEdit} onClick={openShop}><span><Icon name="box" size={21} /><span>나라장터로 물품 조달<small>기능 · 운영비 · 설치 기간 비교</small></span></span><Icon name="arrow" size={16} /></button><button className="room-details-toggle text-button" onClick={() => setDetail(!detail)}>{detail ? '시설 관리 접기' : `시설 관리 · 보유 장비 ${roomState.equipment.length}개`} <Icon name="arrow" size={12} /></button>{detail && <div className="room-details">{facilityProject && <button className="text-button" onClick={() => setModal('facility')}>시설 사업 기록 <Icon name="arrow" size={12} /></button>}{game.player.inventory.filter((item) => item.room === room).map((item) => <div key={item.instanceId} className="gear-detail"><div><span>{OFFERS.find((o) => o.id === item.id)?.name}</span><span>{item.ready ? `상태 ${Math.round(item.condition)}` : '조달·설치 준비 중'}</span></div><select aria-label={`${OFFERS.find((o) => o.id === item.id)?.name} 옮길 방`} value="" disabled={!canEdit || !item.ready} onChange={(e) => act(moveEquipment(game, item.instanceId, e.target.value as RoomId), '다음 운영 첫 주에 옮겨 놓을게요. 원래 방의 일정도 확인해 주세요.')}><option value="" disabled>다른 방으로 옮기기 · 8점</option>{game.player.rooms.filter((r) => r.open && r.id !== room && roomSupportsOffer(r.id, item.id)).map((r) => <option key={r.id} value={r.id}>{ROOM_NAMES[r.id]}</option>)}</select></div>)}<div className="room-expertise"><span>운영 숙련</span><b>문화 {getLevel(game.player.xp.culture)}</b><b>체육 {getLevel(game.player.xp.sport)}</b><b>행사 {getLevel(game.player.xp.event)}</b></div><div className="operating-options"><label>강좌 요금<select disabled={!canEdit} value={game.player.priceMode} onChange={(e) => setGame(setPriceMode(game, e.target.value as 'discount' | 'standard' | 'premium'))}><option value="discount">할인 · 85%</option><option value="standard">표준 · 100%</option><option value="premium">지원 강화 · 숙련 2부터</option></select></label><label className="support-option"><span>주말 준비 지원 · 24점</span><input type="checkbox" disabled={!canEdit} checked={game.player.supportContract} onChange={(e) => act(setWeekendSupport(game, e.target.checked), e.target.checked ? '이번 계절은 주말 준비를 한 명 더 도와드려요.' : '주말 지원 계약을 되돌렸어요.', 'jiseon')} /></label>{game.player.inventory.some((item) => item.id === 'E10') && <label>예약 안내<select disabled={!canEdit} value={game.player.guideMode} onChange={(e) => setGame(setGuideMode(game, e.target.value as 'fast' | 'welcome'))}><option value="welcome">처음 온 주민 안내</option><option value="fast">반복 대관 빠른 접수</option></select></label>}</div><div className="small-actions"><button disabled={!canEdit} onClick={() => act(maintainRoom(game, room), '도구를 손보면 다음 활동도 한결 편해져요.')}>시설 정비 · 12점</button><button disabled={!canEdit} onClick={() => act(trainStaff(game, room === 'B' ? 'sport' : ['A', 'C', 'D'].includes(room) ? 'event' : 'culture'), '배운 것을 다음 수업에 써 볼게요.', 'harin')}>직원 교육 · 12점</button></div></div>}</>
          </div>
          <div className="character-dialogue"><img src={`/center/${cast.file}-portrait.png`} alt={`${cast.role} ${cast.name}`} onError={(e) => { e.currentTarget.src = '/center/jiseon-portrait.png' }} /><div className="dialogue-copy"><span>{cast.name}<small>{cast.role}</small></span><p>{dialogue}</p></div></div>
        </aside>}
      </div>

      <footer className={`action-bar ${reviewingRentals ? 'rental-action-bar' : ''}`}>
        <button className="rival-button" onClick={() => setModal('rivals')}><Icon name="trophy" size={21} /><span>이웃 센터<small>{game.rivals.length}곳의 서로 다른 도전</small></span><Icon name="arrow" size={14} /></button>
        <div className="forecast">{reviewingRentals ? <><span><Icon name="calendar" size={17} /><span>대관 {acceptedRentals.length}건 승인 · {game.player.rooms.filter((item) => item.open).length * BLOCKS.length - acceptedRentals.length}칸에 클래스 편성 가능</span></span><small>미결정 {pendingRentals.length}건은 확정할 때 거절됩니다.</small></> : <><span>{preview?.warnings[0] ? <><Icon name="help" size={17} /><span>{preview.warnings[0]}</span></> : <><Icon name="leaf" size={17} /><span>대관으로 운영하고, 클래스로 이름을 알려요.</span></>}</span><small>예상 이용 {preview?.visits || 0}회 · 영업 {preview ? `${preview.profit >= 0 ? '+' : ''}${money(preview.profit)}` : '0'}점 · 명성 {Math.round(game.player.reputation)}</small></>}</div>
        {reviewingRentals ? <button className="primary-button run-button" onClick={finishRentals}>대관 확정 · 클래스 편성 <Icon name="arrow" size={17} /></button> : game.phase === 'ending' ? <button className="primary-button run-button" onClick={() => setModal('review')}><Icon name="trophy" />{MAX_YEARS}년의 기록 보기</button> : game.phase === 'review' && !playing ? <button className="primary-button run-button" onClick={() => setModal('review')}>계절 결과 보기 <Icon name="arrow" /></button> : <button className="primary-button run-button" disabled={!canEdit} onClick={start}><Icon name={playing ? 'pause' : 'play'} size={19} />{playing ? '시설 운영을 확인하고 있어요' : '이번 계절 시작'}<small>빈 시간도 그대로 실행</small></button>}
      </footer>
      <div className="build-note">첫 플레이 버전 · 게임 속 기관·예산·평가는 창작 설정입니다.</div>
    </main>

    {toast && <div className="toast" role="status"><Icon name="help" size={18} />{toast}</div>}
    {modal === 'welcome' && <Modal title="어서 오세요, 센터장님." onClose={dismissWelcome} wide><div className="welcome-layout"><div className="welcome-portrait"><img src="/center/jiseon-portrait.png" alt="운영팀장 오지선" /><span>오지선 · 운영팀장</span></div><div className="welcome-copy"><span className="eyebrow">일곱 공간, 센터장님의 첫 계절</span><h3>빌려 주는 시간.<br />함께 배우는 시간.</h3><p>대관으로 운영비를 벌고,<br />남은 시간의 클래스로 센터 명성을 키워요.</p><div className="welcome-turn-steps"><span><b>01</b>대관 신청 승인</span><span><b>02</b>물품 조달 · 클래스 편성</span><span><b>03</b>13주 운영 · 결과 확인</span></div><div className="starter-options"><button onClick={dismissWelcome}><Icon name="calendar" size={24} /><span>도착한 대관 신청 보기<small>일곱 공간 중 어디부터 열어 볼까요?</small></span><Icon name="arrow" size={16} /></button></div></div></div></Modal>}

    {modal === 'shop' && <Modal title="나라장터 · 물품 조달" onClose={() => setModal(null)} wide className="procurement-modal"><ProcurementDesk game={game} room={room} onRoomChange={setRoom} onBuy={buy} onClose={() => setModal(null)} initialFilter={shopFilter} /></Modal>}
    {modal === 'facility' && <Modal title="나라장터 · 시설 조성 입찰" onClose={() => setModal(null)} wide className="facility-modal"><FacilityDesk game={game} room={room} onChange={setGame} onClose={() => setModal(null)} /></Modal>}
    {modal === 'campus' && <Modal title="나라장터 · 센터 환경 개선" onClose={() => setModal(null)} wide className="facility-modal"><CampusDesk game={game} onChange={setGame} onClose={() => setModal(null)} /></Modal>}
    {modal === 'replace-class' && replacementRental && <Modal title="기존 클래스를 취소하겠습니까?" onClose={closeReplacement}><div className="class-replacement-summary"><span>{ROOM_NAMES[replacementRental.room]} · {BLOCKS[replacementRental.slot]}</span><div><strong>{replacementProgram?.name || '기존 클래스'}</strong><Icon name="arrow" size={19} /><strong>{replacementRental.client}<small>대관 · {money(replacementRental.fee)}점/주</small></strong></div></div><p className="class-replacement-note">승인하면 이 시간의 클래스가 대관으로 바뀝니다.</p><div className="review-actions"><button className="secondary-button" onClick={closeReplacement}>기존 클래스 유지</button><button className="primary-button" onClick={confirmReplacement}>클래스를 취소하고 대관 승인</button></div></Modal>}

    {modal === 'rivals' && <Modal title="각자의 방식으로, 함께 성장 중" onClose={() => setModal(null)} wide><div className="rivals-layout"><div className="ranking-list"><div className="ranking-label"><span>{game.phase === 'ending' ? `${MAX_YEARS}년 종합 최종 성적` : `${game.year}년 차 공개 성적`}</span><span>종합 점수</span></div>{standings.map((inst, index) => <button key={inst.id} className={`ranking-row ${inst.id === game.player.id ? 'is-player' : ''} ${rival.id === inst.id ? 'viewing' : ''}`} onClick={() => setRivalId(inst.id)}><span className="rank-number">{index + 1}</span><span className="rank-avatar"><Icon name={inst.id === game.player.id ? 'home' : ['leaf', 'music', 'sport', 'brush', 'bolt'][index % 5]!} size={19} /></span><span className="rank-name">{inst.name}<small>{game.phase === 'ending' && getAwardForRank(index + 1) ? `${getAwardForRank(index + 1)} · ` : ''}{inst.id === game.player.id ? '우리 센터' : inst.archetype}</small></span><b>{inst.history.length ? (game.phase === 'ending' ? finalScore(inst) : inst.score).toFixed(1) : '—'}</b></button>)}</div><div className="rival-profile"><div className="rival-building"><img key={rivalExterior} src={rivalExterior} alt={`${rival.name} 외관`} onError={(event) => { if (!event.currentTarget.src.endsWith(playerExterior)) event.currentTarget.src = playerExterior }} /><span>{rival.name}</span></div><span className="pill">운영 스타일</span><h3>{rivalIsPlayer ? '나만의 운영' : rival.archetype}</h3><p>최근 투자<br /><b>{rival.lastPurchase || '첫 계획을 준비하고 있어요'}</b></p><div className="rival-programs">{[...new Set(Object.values(rival.plan).flat().filter(Boolean))].slice(0, 3).map((id) => <span key={id}>{PROGRAMS.find((p) => p.id === id)?.shortName}</span>)}</div><div className="rival-metrics"><span>주민 신뢰<b>{Math.round(rival.trust)}</b></span><span>개방한 공간<b>{rival.rooms.filter((r) => r.open).length}</b></span><span>보유 장비<b>{rival.inventory.length}</b></span></div><small>같은 예산과 운영 규칙으로 매주 계산되는 기관입니다.</small></div></div></Modal>}

    {modal === 'review' && game.lastReport && <Modal title={game.phase === 'ending' ? `${MAX_YEARS}년 종합 최종 결과` : game.lastReport.evaluation ? `${game.lastReport.year}년 차 종합평가` : `${game.lastReport.year}년 차 ${SEASONS[game.lastReport.season]} 운영 결산`} onClose={() => setModal(null)} wide><SeasonReview game={game} report={game.lastReport} onRivals={() => setModal('rivals')} onContinue={continueGame} onReset={() => setModal('reset')} /></Modal>}

    {modal === 'demand' && <Modal title="이런 활동을 기다리고 있어요" onClose={() => setModal(null)} wide><p className="demand-intro">한 그룹은 한 주에 한 번 방문해요. 원하는 시간과 요금을 맞춰 보세요.</p><div className="demand-list">{demand.map((group) => <div key={group.id}><span className="demand-icon"><Icon name={PROGRAM_ICONS[group.programs[0]!] || 'people'} size={22} /></span><div><strong>{group.title}</strong><small>{group.slots.map((slot) => BLOCKS[slot]).join(' · ')}</small></div><span>{group.people}명<small>{group.maxFee === 0 ? '무료 이용 희망' : ['P05','P08','P10'].includes(group.programs[0]!) ? `그룹 ${group.maxFee}점까지` : `1인 ${group.maxFee}점까지`}</small></span></div>)}</div></Modal>}

    {modal === 'help' && <Modal title="센터장님의 작은 안내서" onClose={() => setModal(null)}><div className="help-steps"><p><b>1. 대관을 먼저 골라요</b><span>공간별 신청을 승인하면 그 시간이 예약돼요. 전부 받을 필요는 없어요.</span></p><p><b>2. 남은 시간에 클래스를 열어요</b><span>클래스의 필수 설비를 해당 방에 조달해요. 설치를 마친 뒤 빈 시간에 놓으세요.</span></p><p><b>3. 운영 수입과 명성을 키워요</b><span>대관은 운영비를, 클래스는 명성을 만듭니다. 빈 시간은 그대로 두어도 돼요.</span></p></div><p className="help-note">{MAX_YEARS}년 · {MAX_TURNS}턴 동안 운영하며 {EVALUATION_INTERVAL}년마다 종합평가를 받아요. 한 턴은 13주. 운영을 시작하기 전에는 대관을 다시 검토할 수 있어요. 조달 물품은 첫 운영 때 설치됩니다. 설치 완료 후 다음 계획에서 클래스를 열 수 있어요. 예산과 평가는 게임용 설정입니다.</p><label className="setting-line"><span>움직임 줄이기</span><input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /></label><label className="setting-line"><span>음악과 효과음 <small>초기 합성 스케치</small></span><input type="checkbox" checked={music} onChange={(e) => { updateMusic(e.target.checked); setMusic(e.target.checked) }} /></label><button className="danger-text" onClick={() => setModal('reset')}><Icon name="reset" size={15} />저장한 게임을 새로 시작</button></Modal>}
    {modal === 'reset' && <Modal title="새 센터장으로 다시 시작할까요?" onClose={() => setModal(null)}><p className="reset-copy">이 브라우저의 현재 진행 기록이 새 게임으로 바뀝니다.</p><div className="review-actions"><button className="secondary-button" onClick={() => setModal(null)}>현재 게임 계속하기</button><button className="primary-button" onClick={() => { setGame(createGame()); setRoom('A'); setInsideRoom(false); setSelected(null); setPlaying(false); setModal('welcome'); setSpeaker('jiseon'); setDialogue('새로운 센터의 첫 페이지를 열어 볼까요?') }}>새로 시작하기</button></div></Modal>}
  </div>
}
