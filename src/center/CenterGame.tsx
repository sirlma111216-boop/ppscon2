import AudioControls from './AudioControls'
import { ceremonyAward, ceremonyTitle, ceremonyDetails } from './ceremony'
import { buildOperationTour } from './operationTour'
import type { OperationFrame } from './operationTour'
import { scheduleClass } from './classPlacement'
import { shortOperationReason } from './operationReason'
import OperationIssues from './OperationIssues'
import { ClassEconomicsCard, ClassEconomicsDetail } from './ClassEconomics'
import { wonAmount, legacyMoneyText } from './currency'
import SeasonOpening from './SeasonOpening'
import { seasonIntroKey, getSeasonEvent } from './seasonEvents'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import CenterScene from './CenterScene'
import ScheduleProgramIcon from './ScheduleProgramIcon'
import { selectActivityStill, selectLastActivityStill } from './activityPreview'
import { courseSymbolPath } from './activityArt'
import ProcurementDesk from './ProcurementDesk'
import RentalReview from './RentalReview'
import RoomScheduleSummary from './RoomScheduleSummary'
import EquipmentStoragePanel from './EquipmentStoragePanel'
import FacilityDesk from './FacilityDesk'
import CampusDesk from './CampusDesk'
import SeasonReview from './SeasonReview'
import ToastFeedback from './ToastFeedback'
import type { FeedbackNotice, FeedbackTone } from './ToastFeedback'
import { campusExteriorPath } from './campusProjects'
import { constructionTurns, getFacilityProject } from './facilityProjects'
import { getRoomEquipmentUsage } from './equipmentUsage'
import { SAVE_KEY, SaveBackupError, backupExclusiveSave, persistGameSave, replaceGameSave } from './savePersistence'
import Icon from './Icon'
import { playSound, playOnce, setTrack } from './audio'
import { BLOCKS, EVALUATION_INTERVAL, MAX_TURNS, MAX_YEARS, OFFERS, PROGRAMS, ROOM_DEFINITIONS, ROOM_NAMES, SEASONS, buyEquipment, canRunProgram, createGame, decideRental, finalScore, finishRentalReview, freeCash,  getDemand, getFinalStandings, getLevel, getProgramRequirements, getProgramPlacementError, getProgramWeeklyCount, getStorageImpact, getRentalAt, getRoomManagement, isRentalProgram, maintainRoom, migrateSave, moveEquipment, storeEquipment, reinstallEquipment, nextSeason, previewSeason, previewClass, reopenRentalReview, replaceClassWithRental, roomCapacity, roomSupportsProgram, runSeason, setPriceMode, setProgram, trainStaff } from './simulation'
import type { GameState, ProgramId, RentalRequest, RoomId } from './simulation'

const INTRO_KEY = 'ppscon2.intro.v1'
const PROGRAM_ICONS: Record<string, string> = { P01: 'brush', P02: 'brush', P03: 'sport', P04: 'sport', P05: 'chat', P06: 'people', P07: 'screen', P08: 'music', P09: 'music', P10: 'screen', P11: 'sport', P12: 'brush', P13: 'screen', P14: 'music', P15: 'chat', P16: 'sport', P17: 'music', P18: 'bolt', P19: 'tools', P20: 'chat', P21: 'screen', P22: 'brush', P23: 'brush', P24: 'tools', P25: 'sport', P26: 'sport', P27: 'sport', P28: 'music', P29: 'screen', P30: 'brush', P31: 'chat', P32: 'chat', P33: 'chat', P34: 'leaf', P35: 'screen' }
const FAMILY_NAMES: Record<string, string> = { craft: '공예 도구', mat: '체육 매트', audio: '음향', digital: '교육용 컴퓨터', screen: '영상·발표 장비', stage: '이동무대', hall: '대강당', reformer: '필라테스 리포머', kiln: '안전 도예 가마', digitalPro: '고성능 디지털', video: '영상 제작 장비', recording: '녹화 코칭', cycle: '실내 사이클', orchestra: '합주 악기', lighting: '무대 조명', wood: '목공 작업 도구', interpret: '외국어 토론 장비', pitch: '피칭 코칭' }
function classStatus(requirements: ReturnType<typeof getProgramRequirements>, roomOpen = true) {
  if (!roomOpen) return '시설 개방 필요'
  if (!requirements.spaceReady) return `${requirements.spaceRequired}㎡ 이상 필요`
  if (requirements.ready) return '개설 가능'
  if (requirements.missingFamilies.length) return '설비 조달 필요'
  if (requirements.pendingFamilies.length) return '설치 대기'
  return '설비 정비 필요'
}
const CAST = { jiseon: { name: '오지선', role: '운영팀장', file: 'jiseon' }, doyun: { name: '한도윤', role: '시설 담당', file: 'doyun' }, harin: { name: '윤하린', role: '문화강사', file: 'harin' } }
type ModalName = 'season-start' | 'equipment' | 'welcome' | 'shop' | 'facility' | 'campus' | 'confirm-rentals' | 'confirm-empty' | 'store-equipment' | 'replace-class' | 'rivals' | 'review' | 'help' | 'reset' | 'demand' | null
const money = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
function initialGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (raw) {
      const saved: unknown = JSON.parse(raw)
      const migrated = migrateSave(saved)
      if (migrated) {
        if ((saved as { specialtyRulesVersion?: unknown } | null)?.specialtyRulesVersion !== 1) {
          try { backupExclusiveSave(localStorage, raw) } catch { /* The save effect will retain the source and report the blocked backup. */ }
        }
        return migrated
      }
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

export default function CenterGame({onHome,skipWelcome=false}: {onHome?:()=>void;skipWelcome?:boolean} = {}) {
  const [rawGame, setGame] = useState<GameState>(initialGame)
  const game = useMemo(() => {
    const needsSchemaUpgrade = !rawGame.eventDeck || rawGame.campaignVersion !== 2 || rawGame.specialtyRulesVersion !== 1 || rawGame.rivals.length === 10 || [rawGame.player, ...rawGame.rivals].some((institution) => !Array.isArray(institution.evaluations) || !institution.evaluationStats || !Number.isFinite(institution.annualBudget) || institution.campusProjects.some((project) => project.scopeVersion === undefined))
    return needsSchemaUpgrade ? migrateSave(rawGame) || rawGame : rawGame
  }, [rawGame])
  useEffect(() => { if (game !== rawGame) setGame(game) }, [game, rawGame])
  const [room, setRoom] = useState<RoomId>('A')
  const [insideRoom, setInsideRoom] = useState(false)
  const [selectedByRoom, setSelectedByRoom] = useState<Partial<Record<RoomId, ProgramId | null>>>({})
  const selected = selectedByRoom[room] ?? null
  const [slotSelection, setSlotSelection] = useState<{ room: RoomId; slot: number } | null>(null)
  const [modal, setModal] = useState<ModalName>(() => {
    if(skipWelcome)return null
    try { return localStorage.getItem(INTRO_KEY) ? null : 'welcome' } catch { return 'welcome' }
  })
  useEffect(() => { if(game.phase === 'planning' && modal === null && game.seasonIntroSeen !== seasonIntroKey(game)) setModal('season-start') }, [game.year, game.season, game.phase, game.seasonIntroSeen, modal])
  const [shopFilter, setShopFilter] = useState('all')
  const [replacementRentalId, setReplacementRentalId] = useState<string | null>(null)
  const [storageEquipmentId, setStorageEquipmentId] = useState<string | null>(null)
  const [storageTargetRoom, setStorageTargetRoom] = useState<RoomId | null>(null)
  const [feedback, setFeedback] = useState<FeedbackNotice | null>(null)
  const feedbackSerial = useRef(0)
  const [dialogue, setDialogue] = useState(() => game.history.length ? `${game.year}년 차 ${SEASONS[game.season]}, 우리 센터의 계획을 이어가 볼까요?` : '센터장님, 운영 중인 공간에 대관 신청이 왔어요. 어떤 모임을 받을까요?')
  const [speaker, setSpeaker] = useState<keyof typeof CAST>('jiseon')
  const [playing, setPlaying] = useState(false)
  const [operationTour,setOperationTour]=useState<OperationFrame[]>([])
  const [tourIndex,setTourIndex]=useState(0)
  const [operationPaused, setOperationPaused] = useState(false)
  const [activeSlot, setActiveSlot] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [comicEvent, setComicEvent] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [saved, setSaved] = useState(true)
  const [saveIssue, setSaveIssue] = useState<string | null>(null)
  const migrationNoticeShown = useRef('')
  const [detail, setDetail] = useState(false)
  const [rivalId, setRivalId] = useState('')
  const preview = useMemo(() => game.phase === 'planning' ? game.planningStage === 'classes' ? previewSeason(game) : null : game.lastReport, [game])
  const roomState = game.player.rooms.find((r) => r.id === room)!
  const roomEquipmentUsage = getRoomEquipmentUsage(game.player, room)
  const viewingResult = (game.phase === 'review' || game.phase === 'ending') && Boolean(game.lastReport)
  const roomHasActualClass = game.lastReport?.activity.some(activity => activity.room === room && !isRentalProgram(activity.program) && activity.attendees > 0)
  const activeActivityStill = selectActivityStill({ room, viewingResult: insideRoom && viewingResult, roomOpen: roomState.open, activeSlot, activities: game.lastReport?.activity })
  const canPlan = game.phase === 'planning' && !playing
  const reviewingRentals = canPlan && game.planningStage === 'rentals'
  const canEdit = canPlan && game.planningStage === 'classes'
  const selectedSlot = canEdit && slotSelection?.room === room ? slotSelection.slot : null
  const roomDefinition = ROOM_DEFINITIONS.find((item) => item.id === room)!
  const facilityProject = getFacilityProject(game.player, room)
  const acceptedRentals = game.player.rentalRequests.filter((request) => request.status === 'accepted')
  const pendingRentals = game.player.rentalRequests.filter((request) => request.status === 'pending')
  const emptyRoomSchedules = game.player.rooms.filter(value => value.open).map(value => ({
    room: value.id,
    slots: BLOCKS.map((_, slot) => slot).filter(slot => !game.player.plan[value.id][slot] && !getRentalAt(game.player, value.id, slot)),
  })).filter(value => value.slots.length > 0)
  const emptySlotCount = emptyRoomSchedules.reduce((sum, value) => sum + value.slots.length, 0)
  const replacementRental = game.player.rentalRequests.find((request) => request.id === replacementRentalId)
  const replacementProgram = replacementRental ? PROGRAMS.find((program) => program.id === game.player.plan[replacementRental.room][replacementRental.slot]) : undefined
  const storageEquipment = game.player.inventory.find(item => item.instanceId === storageEquipmentId)
  const storageOffer = OFFERS.find(offer => offer.id === storageEquipment?.id)
  const storageImpact = storageEquipment ? getStorageImpact(game.player, storageEquipment.instanceId) : null
  const sceneRooms = game.phase === 'planning'
    ? game.player.rooms.map((r) => ({ ...r, equipment: r.equipment.filter((id) => game.player.inventory.some((item) => item.id === id && item.room === r.id && item.ready)) }))
    : game.player.rooms
  const currentProgram = PROGRAMS.find((p) => p.id === selected && roomSupportsProgram(room, p.id))
  const roomPrograms = PROGRAMS.filter(program => !isRentalProgram(program.id) && roomSupportsProgram(room, program.id))
  const classOutlooks = useMemo(()=>Object.fromEntries(PROGRAMS.filter(p=>!isRentalProgram(p.id)&&roomSupportsProgram(room,p.id)).map(p=>[p.id,previewClass(game,room,p.id,selectedSlot)])),[game,room,selectedSlot])
  const currentRequirements = currentProgram ? getProgramRequirements(game.player, room, currentProgram.id) : null
  const cast = CAST[speaker]
  const turn = (game.year - 1) * 4 + game.season + 1
  const standings = game.phase === 'ending' ? getFinalStandings(game) : [...game.rivals, game.player].sort((a, b) => b.score - a.score || b.publicScore - a.publicScore || b.experienceScore - a.experienceScore || a.name.localeCompare(b.name))
  const demand = useMemo(() => getDemand(game).filter((group) => group.programs.some((id) => !isRentalProgram(id))), [game.seed, game.year, game.season])
  const selectedDemand = demand.filter((group) => selected && group.programs.includes(selected))
  const rival = [game.player, ...game.rivals].find((r) => r.id === rivalId) || game.player
  const rivalIsPlayer = rival.id === game.player.id
  const playerExterior = campusExteriorPath(game.player)
  const rivalExterior = rivalIsPlayer ? playerExterior : `/center/rivals-v2/${rival.id}.webp`
  useEffect(() => {
    try { persistGameSave(localStorage, game); setSaved(true); setSaveIssue(null) }
    catch (error) { setSaved(false); setSaveIssue(error instanceof SaveBackupError ? error.message : '자동 저장을 완료하지 못했어요. 브라우저 저장 공간을 확인해 주세요.') }
  }, [game])
  const migrationNoticeSignature = (game.migrationNotices || []).join('\n')
  useEffect(() => {
    if (!saveIssue && migrationNoticeSignature && migrationNoticeShown.current !== migrationNoticeSignature) {
      migrationNoticeShown.current = migrationNoticeSignature
      notify('전용 클래스 규칙 반영 · 변경 내역 ' + game.migrationNotices!.length + '건. 도움말에서 확인해 주세요.', 'info')
    }
  }, [migrationNoticeSignature, saveIssue])
  useEffect(() => { if (saveIssue) notify(saveIssue, 'error') }, [saveIssue])
  useEffect(() => { if (selected && !roomSupportsProgram(room, selected)) setSelected(null) }, [room, selected])
  useEffect(() => { setSlotSelection(null) }, [room, game.phase, game.planningStage, game.year, game.season])
  useEffect(() => { setSelectedByRoom({}) }, [game.phase, game.planningStage, game.year, game.season])
  useEffect(() => {
    if (!playing || operationPaused) return
    const frame=operationTour[tourIndex]
    if(!frame){setPlaying(false);return}
    setRoom(frame.room);setInsideRoom(true);setActiveSlot(frame.slot)
    const timer=setTimeout(()=>{
      if(tourIndex+1>=operationTour.length){
        setPlaying(false)
        const last=selectLastActivityStill({room:frame.room,viewingResult:true,roomOpen:true,activities:game.lastReport?.activity})
        if(last)setActiveSlot(last.slot)

      }else setTourIndex(index=>index+1)
    },1500/speed)
    return ()=>clearTimeout(timer)
  },[playing,operationPaused,tourIndex,operationTour,speed,game.lastReport])
  useEffect(() => {
    const track = modal==='season-start'&&comicEvent ? 'comic_event' : ['shop','facility','campus'].includes(modal||'') ? 'procurement' : modal==='review'&&game.lastReport?.evaluation ? game.phase==='ending' ? ceremonyDetails(game,game.lastReport).awarded?'final_awarded':'final_unawarded' : 'evaluation' : game.phase!=='planning'&&modal!=='review' ? 'operation' : game.season<2 ? 'planning_spring_summer':'planning_autumn_winter'
    setTrack(track)
    if(modal==='season-start')playOnce('season-'+game.seed+'-'+game.year+'-'+game.season,'season_open')
    if(modal==='review')playOnce('review-'+game.seed+'-'+game.year+'-'+game.season,'settlement')
  }, [modal,comicEvent,game.phase,game.year,game.season,game.seed,game.lastReport])
  useEffect(()=>{if(modal!=='season-start')setComicEvent(false)},[modal])
  const dismissWelcome = () => {
    try { localStorage.setItem(INTRO_KEY, 'seen') } catch { /* optional */ }
    setModal(null)
  }
  function notify(message: string, tone: FeedbackTone = 'success') { if(tone==='error')playSound('notice');else if(tone==='success'&&message.includes('계약 ·'))playSound('tender_contract');setFeedback({ id: ++feedbackSerial.current, message, tone }) }
  function setSelected(program: ProgramId | null) { setSelectedByRoom(previous => ({ ...previous, [room]: program })) }
  function cancelSlotSelection() { setSlotSelection(null) }
  function selectRoom(value: RoomId) {
    if(playing)setOperationPaused(true)
    setSlotSelection(null); setRoom(value); setInsideRoom(true); playSound('room_enter'); setDetail(false)
    if (viewingResult) {
      const input = { room: value, viewingResult, roomOpen: Boolean(game.player.rooms.find(item => item.id === value)?.open), activities: game.lastReport?.activity }
      if (!selectActivityStill({ ...input, activeSlot })) { const last = selectLastActivityStill(input); if (last) setActiveSlot(last.slot) }
    }
  }
  function leaveRoom() { if(playing)setOperationPaused(true); setSlotSelection(null); setInsideRoom(false); setDetail(false); playSound('select') }
  function chooseProgram(id: ProgramId) {
    if (!canEdit || !roomSupportsProgram(room, id)) return
    const program = PROGRAMS.find((p) => p.id === id)!
    setSelected(id); playSound('select')
    if (!canRunProgram(game.player, room, id)) {
      setSpeaker('doyun'); setDialogue(!roomState.open ? `${ROOM_NAMES[room]}을 먼저 개방해야 해요. 필요한 클래스 설비도 미리 살펴보세요.` : `${ROOM_NAMES[room]}에 필요한 설비를 갖춰야 ${program.shortName} 수업을 열 수 있어요.`)
      if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.class-requirements')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }))
      return
    }
    if (selectedSlot !== null) {
      place(selectedSlot, id)
      return
    }
    setSpeaker('jiseon')
    setDialogue(`${program.shortName}, 좋아요. 아래 일정에서 원하는 시간에 놓아 주세요.`)
    if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.schedule-panel')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }))
  }
  function viewRecordedSlot(slot: number) {
    if (!viewingResult || !Number.isInteger(slot) || slot < 0 || slot >= BLOCKS.length) return
    setActiveSlot(slot); if (playing) setOperationPaused(true)
  }
  function chooseSlot(slot: number) {
    if (!canEdit || !roomState.open || !Number.isInteger(slot) || slot < 0 || slot >= BLOCKS.length) return
    if (getRentalAt(game.player, room, slot)) { notify('승인한 대관 시간이에요. 대관을 취소한 뒤 편성할 수 있어요.', 'error'); return }
    if (selected && canRunProgram(game.player, room, selected)) { place(slot, selected); return }
    if (selectedSlot === slot) { cancelSlotSelection(); return }
    setSelected(null); setSlotSelection({ room, slot }); playSound('select')
    setDialogue(`${BLOCKS[slot]}에 열 클래스를 골라 주세요.`)
    if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.activity-heading')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
  }
  function place(slot: number, id: ProgramId | null = selected) {
    if (!canEdit || !roomState.open || !Number.isInteger(slot) || slot < 0 || slot >= BLOCKS.length) return
    if (getRentalAt(game.player, room, slot)) { notify('승인한 대관 시간이에요. 대관을 취소한 뒤 편성할 수 있어요.', 'error'); return }
    if (id && isRentalProgram(id)) return
    if (id) { const error = getProgramPlacementError(game.player, room, slot, id); if (error) { notify(error, 'error'); return } }
    if (!id) { clearClass(slot); return }
    if (game.player.plan[room][slot] === id) { setSlotSelection(null); setSelected(null); notify(`${BLOCKS[slot]}에 이미 편성되어 있어요.`, 'info'); return }
    const previous = PROGRAMS.find(program => program.id === game.player.plan[room][slot])
    const placement = scheduleClass(game, room, slot, id)
    if (placement.error) { notify(placement.error, 'error'); setSlotSelection({room,slot}); setSelected(id); return }
    const next = placement.state
    if (next.player.plan[room][slot] !== id) { notify('클래스를 편성하지 못했어요. 시간과 공간 조건을 확인해 주세요.', 'error'); return }
    const placementIssues=previewSeason(next).operationIssues?.filter(issue=>issue.room===room&&issue.slot===slot)??[]
    const interruptionNotice=placementIssues.length?` · ${shortOperationReason(placementIssues[0]!.reason)} · ${placementIssues.reduce((n,i)=>n+i.weeks,0)}/13주 휴강`:''
    setGame(next); setSlotSelection(null); setSelected(null); playSound('schedule_place')
    notify(`${ROOM_NAMES[room]} · ${BLOCKS[slot]} · ${previous ? previous.shortName + ' → ' : ''}${PROGRAMS.find(program => program.id === id)?.shortName} 편성${interruptionNotice}`)
    setDialogue('편성이 완료됐어요. 시작 전 운영 예상과 비용을 확인해 주세요.')
  }
  function clearClass(slot: number) {
    if (!canPlan || getRentalAt(game.player, room, slot)) return
    const previous = PROGRAMS.find(program => program.id === game.player.plan[room][slot])
    if (!previous) { notify('이미 빈 시간이에요.', 'info'); return }
    setGame(setProgram(game, room, slot, null)); setSlotSelection(null); playSound('schedule_remove')
    notify(`${ROOM_NAMES[room]} · ${BLOCKS[slot]} · ${previous.shortName} 편성 취소`)
  }
  function clearRoomClasses() {
    if (!canEdit) return
    setSelected(null); setSlotSelection(null)
    let next = game, removed = 0
    BLOCKS.forEach((_, slot) => {
      if (next.player.plan[room][slot] && !getRentalAt(next.player, room, slot)) { next = setProgram(next, room, slot, null); removed++ }
    })
    setGame(next)
    if(removed)playSound('schedule_remove')
    notify(removed ? `${ROOM_NAMES[room]} 클래스 ${removed}칸을 비웠어요. 대관 일정은 유지됩니다.` : '비울 클래스가 없어요.', removed ? 'success' : 'info')
  }
  function act(result: { state: GameState; error?: string }, success: string, actor: keyof typeof CAST = 'doyun') {
    if (result.error) { notify(result.error, 'error'); return false }
    if (result.state === game) { notify('이미 적용된 설정이에요.', 'info'); return false }
    const cashChange = result.state.player.cash - game.player.cash
    const cost = cashChange ? ` · 예산 ${cashChange > 0 ? '+' : '−'}${wonAmount(Math.abs(cashChange))}원` : ''
    setGame(result.state); setSpeaker(actor); setDialogue(success); notify(success + cost); playSound(success.includes('납품요구')?'procurement_order':'ui_click'); return true
  }
  function requestEquipmentStorage(instanceId: string) {
    if (!canEdit) return
    setStorageTargetRoom(null)
    const impact = getStorageImpact(game.player, instanceId)
    if (impact.slots.length || impact.rentalIds.length) { setStorageEquipmentId(instanceId); setModal('store-equipment'); return }
    const offer = OFFERS.find(value => value.id === game.player.inventory.find(item => item.instanceId === instanceId)?.id)
    act(storeEquipment(game, instanceId), (offer?.name || '장비') + ' 창고 보관 · 설치 자리 확보')
  }
  function requestEquipmentMove(instanceId: string, target: RoomId) {
    if (!canEdit) return
    const impact = getStorageImpact(game.player, instanceId)
    if (impact.slots.length || impact.rentalIds.length) { setStorageEquipmentId(instanceId); setStorageTargetRoom(target); setModal('store-equipment'); return }
    act(moveEquipment(game, instanceId, target), ROOM_NAMES[target] + ' 장비 이전 예약 · 다음 운영 때 설치')
  }
  function closeEquipmentConfirmation() { setModal(null); setStorageEquipmentId(null); setStorageTargetRoom(null) }
  function confirmEquipmentStorage() {
    if (!storageEquipment || !canEdit) return
    const result = storageTargetRoom ? moveEquipment(game, storageEquipment.instanceId, storageTargetRoom, { allowClearPlan: true }) : storeEquipment(game, storageEquipment.instanceId, { allowClearPlan: true })
    const message = storageTargetRoom ? ROOM_NAMES[storageTargetRoom] + ' 장비 이전 예약 · 이전 방의 관련 클래스 취소' : (storageOffer?.name || '장비') + ' 보관 · 필요한 클래스 편성 취소'
    if (act(result, message)) { closeEquipmentConfirmation(); setSlotSelection(null) }
  }
  function buy(id: string) {
    const offer = OFFERS.find((o) => o.id === id)!
    const result = buyEquipment(game, id, room)
    if (act(result, `${offer.name} 납품요구 전송 · ${ROOM_NAMES[room]} 설치 준비`)) {
      setModal(null)
    }
  }
  function start() {
    if (!canEdit) return
    if (emptySlotCount > 0 || preview?.operationIssues?.length || preview?.warnings.length || preview?.unpaidFixedCost || preview?.retiredSupportRefund) { setModal('confirm-empty'); return }
    runPlannedSeason()
  }
  function runPlannedSeason() {
    if (!canEdit) return
    try {
      const next = runSeason(game)
      const installed=next.player.inventory.some(e=>e.ready&&!game.player.inventory.find(p=>p.instanceId===e.instanceId)?.ready)
      const completed=next.player.facilityProjects.some(p=>p.stage==='complete'&&game.player.facilityProjects.find(old=>old.id===p.id)?.stage!=='complete')||next.player.campusProjects.some(p=>p.stage==='complete'&&game.player.campusProjects.find(old=>old.id===p.id)?.stage!=='complete')||next.player.rooms.some(r=>r.remodel?.remainingWeeks===0&&game.player.rooms.find(old=>old.id===r.id)?.remodel?.remainingWeeks!==0)
      if(installed||completed)playSound('install_complete')
      const tour=buildOperationTour(next.player.rooms)
      setOperationTour(tour);setTourIndex(0)
      if(tour[0]){setRoom(tour[0].room);setActiveSlot(tour[0].slot);setInsideRoom(true)}
      setGame(next); setOperationPaused(false); setPlaying(tour.length>0); setModal(null); setSpeaker('jiseon')
      const report = next.lastReport!
      notify(`13주 운영 완료 · 영업 ${report.profit >= 0 ? '+' : ''}${wonAmount(report.profit)}원 · 명성 ${report.reputationChange >= 0 ? '+' : ''}${money(report.reputationChange)}`)
      setDialogue('13주 운영을 마쳤어요. 마지막 주의 공간과 이용 기록을 함께 볼까요?'); playSound('run')
      requestAnimationFrame(() => document.querySelector('.scene-card')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
    } catch { notify('이번 계획을 실행하지 못했어요. 편성을 확인해 주세요.', 'error') }
  }
  function continueGame() {
    const next = nextSeason(game); setGame(next); setInsideRoom(false); setModal(next.phase === 'ending' ? 'review' : 'season-start'); setSpeaker('jiseon')
    setDialogue(next.phase === 'ending' ? `센터장님과 함께한 ${MAX_YEARS}년, 동네에 참 많은 변화가 생겼어요.` : `${SEASONS[next.season]}의 대관 신청이 도착했어요. 수입과 클래스 시간을 함께 생각해 봐요.`)
    notify(next.phase === 'ending' ? `${MAX_YEARS}년 운영 완료 · 최종 결과를 확인하세요.` : `${next.year}년 ${SEASONS[next.season]} 계획 시작 · 새 대관 신청 도착`, 'info')
  }
  function reviewRental(id: string, status: RentalRequest['status']) {
    const request = game.player.rentalRequests.find((item) => item.id === id)
    const existingClass = request && game.player.plan[request.room][request.slot]
    if (status === 'accepted' && existingClass && !isRentalProgram(existingClass)) {
      setReplacementRentalId(id); setModal('replace-class'); return
    }
    const result = decideRental(game, id, status)
    if (result.error) { notify(result.error, 'error'); return }
    setGame(result.state); playSound(status==='accepted'?'rental_approve':'schedule_remove')
    if (request) notify(`${ROOM_NAMES[request.room]} · ${BLOCKS[request.slot]} · ${request.client} ${status === 'accepted' ? '대관 승인' : status === 'declined' ? '신청 거절' : request.status === 'accepted' ? '승인 취소' : '다시 검토'}${status === 'accepted' ? ` · ${wonAmount(request.fee)}원/주` : ''}`)
  }
  function closeReplacement() { setReplacementRentalId(null); setModal(null); notify('기존 클래스를 유지했어요.', 'info') }
  function confirmReplacement() {
    if (!replacementRentalId) return
    const result = replaceClassWithRental(game, replacementRentalId)
    if (result.error) { notify(result.error, 'error'); return }
    setGame(result.state); setReplacementRentalId(null); setModal(null); playSound('rental_approve')
    if (replacementRental) notify(`${ROOM_NAMES[replacementRental.room]} · ${BLOCKS[replacementRental.slot]} · ${replacementProgram?.shortName || '클래스'} 취소 → ${replacementRental.client} 대관 승인`)
    setSpeaker('jiseon'); setDialogue('선택한 시간의 클래스를 취소하고 대관을 승인했어요.')
  }
  function finishRentals(confirmed=false) {
    if(pendingRentals.length&&!confirmed){setModal('confirm-rentals');return}
    setModal(null)
    setGame(finishRentalReview(game)); setSpeaker('harin')
    setDialogue('대관 일정이 정해졌네요. 남은 시간에 주민을 위한 클래스를 열어 볼까요?')
    notify(`대관 ${acceptedRentals.length}건 확정 · 남은 시간에 클래스를 편성하세요.`)
    playSound('select')
    requestAnimationFrame(() => document.querySelector('.planning-steps')?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' }))
  }
  function editRentals(cancelId?: string) {
    const next = reopenRentalReview(game)
    if (cancelId) {
      const result = decideRental(next, cancelId, 'pending')
      if (result.error) { notify(result.error, 'error'); return }
      setGame(result.state)
      const request = game.player.rentalRequests.find(item => item.id === cancelId)
      notify(`${request ? ROOM_NAMES[request.room] + ' · ' + BLOCKS[request.slot] + ' · ' : ''}대관 승인을 취소했어요.`)
    } else { setGame(next); notify('대관 검토로 돌아왔어요. 기존 클래스 편성은 유지됩니다.', 'info') }
    setSpeaker('jiseon'); setDialogue('대관을 다시 검토해요. 이미 편성한 클래스와 시간이 겹치지 않는지 확인해 주세요.')
    playSound('select')
  }
  const openShop = () => { setShopFilter('all'); setModal('shop') }
  function openRequiredShop(family?: string) {
    const required = family || currentRequirements?.missingFamilies[0]
    setShopFilter(OFFERS.find((offer) => offer.capabilities.includes(required || ''))?.id || 'all')
    setModal('shop')
  }

  return <div className={`center-game ${!insideRoom ? 'is-exploring' : ''} ${reducedMotion ? 'reduce-motion' : ''}`}>
    <header className="topbar">
      <a href="#" className="brand" aria-label="저장하고 첫 화면으로" onClick={(e) => { e.preventDefault(); try { persistGameSave(localStorage, game); onHome?.() } catch { notify("저장하지 못했어요. 현재 화면을 유지합니다.", "error") } }}><span className="brand-symbol"><Icon name="home" size={25} /></span><span>센터장님,<br /><strong>다음 주는요?</strong></span></a>
      <div className="center-identity"><span className="tiny-dot" /> 늘봄 문화체육센터 <span className="identity-tag">센터 운영 일지</span></div>
      <div className="top-actions"><span className={`save-state ${!saved ? 'unsaved' : ''}`}><Icon name={saved ? 'check' : 'help'} size={13} />{saved ? '자동 저장됨' : '저장 공간 확인'}</span><AudioControls/><button className="icon-button" aria-label="도움말과 설정" onClick={() => setModal('help')}><Icon name="help" /></button></div>
    </header>

    <main className="game-layout">
      <div className="page-heading"><div><div className="eyebrow">센터 운영 일지</div><h1>{game.phase === 'ending' ? `우리의 ${MAX_YEARS}년이 남긴 것` : playing ? '한 계절의 운영을 돌아봅니다' : reviewingRentals ? '센터의 문을 여는 순서' : '우리 동네의 다음 주'}</h1></div><div className="season-badge"><span className="season-symbol"><Icon name={game.season === 0 ? 'leaf' : game.season === 1 ? 'sun' : game.season === 2 ? 'leaf' : 'sparkle'} size={25} /></span><div><small>{game.year}년 차</small><strong>{SEASONS[game.season]} <span>· {turn}/{MAX_TURNS}</span></strong></div></div><div className="budget-badge" title={`총 현금 ${wonAmount(game.player.cash)} · 필수 운영비 유보 ${wonAmount(game.player.reserved)}`}><Icon name="coin" size={25} /><div><small>쓸 수 있는 예산</small><strong>{wonAmount(freeCash(game.player))}<span>원</span></strong></div></div></div>

      <div className="planning-steps" aria-label="계절 운영 순서">
        <span className={reviewingRentals ? 'is-current' : 'is-done'}><b>01</b> 대관 신청 검토</span><Icon name="arrow" size={13} />
        <span className={canEdit ? 'is-current' : ''}><b>02</b> 클래스 편성</span><Icon name="arrow" size={13} />
        <span className={playing || game.phase !== 'planning' ? 'is-current' : ''}><b>03</b> 운영 · 결산</span>
        {canEdit && <button className="text-button" onClick={() => editRentals()}>대관 다시 검토 <Icon name="arrow" size={12} /></button>}
      </div>
      {insideRoom && <nav className="room-navigation" aria-label="공간 바로 이동">{ROOM_DEFINITIONS.map(item => {
        const isOpen = game.player.rooms.find(value => value.id === item.id)?.open
        const status = isOpen ? '' : getFacilityProject(game.player, item.id)?.stage === 'construction' ? '시공 중' : '미개방'
        return <button key={item.id} type="button" className={room === item.id ? 'is-current' : ''} onClick={() => selectRoom(item.id)} aria-current={room === item.id ? 'location' : undefined} aria-label={`${item.name}${status ? ' · ' + status : ''} 바로 이동`} title={status || item.name}><small>{item.id}</small><span>{item.name}</span>{!isOpen && <Icon name="lock" size={11} />}</button>
      })}</nav>}
      <div className={`main-grid ${!insideRoom ? 'is-exterior' : reviewingRentals ? 'is-rental-room' : 'is-room-view'} ${insideRoom && !reviewingRentals && roomPrograms.length <= 4 ? 'is-short-catalog' : ''}`}>
        <section className="play-column" aria-label="센터와 주간 계획">
          <div className="scene-card">
            <div className={`scene-toolbar ${activeActivityStill ? 'has-activity' : ''}`}>
              <span><span className={`live-dot ${playing ? 'active' : ''}`} />{playing ? `운영 중 · ${ROOM_NAMES[room]} · ${BLOCKS[activeSlot]} (${tourIndex+1}/${operationTour.length})` : viewingResult ? `운영 기록 · ${BLOCKS[activeSlot]}${activeActivityStill ? ' · ' + PROGRAMS.find(program => program.id === activeActivityStill.program)?.shortName : ''}` : insideRoom ? `${ROOM_NAMES[room]} 둘러보기` : '늘봄 문화체육센터'}</span>
              <div>
                {playing ? <><button className="text-button" onClick={() => setOperationPaused(!operationPaused)} aria-pressed={operationPaused}>{operationPaused ? '운영 계속' : '운영 멈춤'}</button><button className="text-button" onClick={() => setSpeed(speed === 1 ? 2 : 1)}>{speed}× 속도</button><button className="text-button" onClick={() => { setPlaying(false); setModal('review') }}>건너뛰기 · 결과 <Icon name="arrow" size={13} /></button></> : <span className="scene-instruction">{viewingResult ? insideRoom && !roomHasActualClass ? '이 방에서 실제 진행된 클래스가 없어요' : '시간표를 눌러 운영 기록 보기' : insideRoom ? '공간 안에서 다음 계획을 세워요' : '방 이름을 눌러 들어가세요'} <Icon name="arrow" size={12} /></span>}
              </div>
            </div>
            <div className="scene-stage"><CenterScene selectedRoom={room} view={insideRoom ? 'room' : 'exterior'} onSelectRoom={selectRoom} onBack={leaveRoom} onManageEquipment={() => setModal('equipment')} campusExterior={playerExterior} onOpenCampus={() => setModal('campus')} rooms={sceneRooms} facilityProjects={game.player.facilityProjects} plan={game.player.plan} viewingResult={viewingResult} activeSlot={activeSlot} season={game.season} report={viewingResult ? game.lastReport : null} reducedMotion={reducedMotion} /></div>
            {insideRoom && <div className="scene-footer"><span><Icon name="people" size={15} /> 주민과 함께 자라는 공간</span><span><Icon name="heart" size={14} /> 신뢰 {Math.round(game.player.trust)} <i /> 명성 {Math.round(game.player.reputation)} <i /> 관리 {Math.round(getRoomManagement(game.player, room))}</span></div>}
          </div>

          {(!insideRoom || reviewingRentals) && <RoomScheduleSummary game={game} selectedRoom={insideRoom ? room : undefined} overview={!insideRoom} onSelectRoom={selectRoom} />}
          {insideRoom && !reviewingRentals && <section className="schedule-panel" aria-label={`${ROOM_NAMES[room]} ${viewingResult ? '운영 기록' : '주간 계획'}`}>
            <div className="section-heading"><div><span className="small-overline">{viewingResult ? '03 · 마지막 주의 실제 운영 기록' : '02 · 남은 시간에 클래스 편성'}</span><h2>{ROOM_NAMES[room]}의 한 주</h2></div><span className="schedule-hint">{canEdit && currentProgram ? <><Icon name={PROGRAM_ICONS[currentProgram.id]!} size={15} /><b>{currentProgram.shortName}</b> {currentRequirements?.ready ? '선택 중' : '개설 조건 확인'}</> : viewingResult ? '시간을 눌러 마지막 주 기록 확인' : '이 계획으로 13주를 운영해요'}</span></div>
            {canEdit && selectedSlot !== null && <div className="slot-selection-prompt" role="status"><span><b>{BLOCKS[selectedSlot]}</b>에 열 클래스 선택</span><button className="text-button" onClick={cancelSlotSelection}>시간 선택 취소</button></div>}
            <div className="schedule-slots">{BLOCKS.map((block, index) => {
              const scheduleIssues = !viewingResult ? preview?.operationIssues?.filter(issue=>issue.room===room&&issue.slot===index)??[] : []
              const interruptedWeeks = scheduleIssues.reduce((n,issue)=>n+issue.weeks,0)
              const rental = getRentalAt(game.player, room, index)
              const recorded = viewingResult ? game.lastReport?.activity.find(activity => activity.room === room && activity.slot === index) : undefined
              const id = viewingResult ? recorded?.program : game.player.plan[room][index]
              const p = PROGRAMS.find((program) => program.id === id)
              const available = viewingResult || !id || canRunProgram(game.player, room, id)
              return <div key={block} className={`schedule-slot ${viewingResult && activeSlot === index ? 'is-active' : ''} ${selectedSlot === index ? 'is-selected-time' : ''} ${rental ? 'kind-rental' : p ? `kind-${p.kind}` : 'empty'} ${available ? '' : 'unavailable'}`} onDragOver={(event) => { if (canEdit && !rental) event.preventDefault() }} onDrop={(event) => { event.preventDefault(); if (rental) return; const value = event.dataTransfer.getData('text/plain') as ProgramId; if (PROGRAMS.some((program) => program.id === value && !isRentalProgram(program.id))) place(index, value) }}>
                <span className="slot-day">{block}<small>{rental ? '대관' : index < 3 ? '평일' : '주말'}</small></span>
                {viewingResult ? <button className="slot-content result-slot-content" aria-label={`${block}: ${p?.name || '실제 운영 기록 없음'}${recorded ? ' · ' + recorded.attendees + '명' : ''}. 운영 기록 보기`} aria-pressed={activeSlot === index} onClick={() => viewRecordedSlot(index)} disabled={!roomState.open}><span className="slot-icon">{p ? <ScheduleProgramIcon program={p.id} /> : <Icon name="calendar" size={25} />}</span><strong>{p?.shortName || PROGRAMS.find(value=>value.id===game.player.plan[room][index])?.shortName || '빈 시간'}</strong><small>{recorded ? `${recorded.attendees}명 · 운영 기록` : game.lastReport?.operationIssues?.filter(issue=>issue.room===room&&issue.slot===index&&issue.lastWeek).map(issue=>shortOperationReason(issue.reason)).join(' · ') || (game.player.plan[room][index]?'미운영 · 이전 기록에 사유 없음':'편성 없음')}</small></button> : rental ? <><div className="slot-content rental-slot-content"><span className="slot-icon"><ScheduleProgramIcon program={rental.program} /></span><strong>{rental.client}</strong><small>{rental.attendees}명 · {wonAmount(rental.fee)}원/주</small><span className="rental-slot-label">승인한 대관</span>{scheduleIssues.length>0&&<span className="schedule-warning">! {shortOperationReason(scheduleIssues[0]!.reason)} · {interruptedWeeks}/13주 휴강</span>}</div>{canEdit && <button className="cancel-rental-slot" onClick={() => editRentals(rental.id)} aria-label={`${block} ${rental.client} 대관 승인 취소`}>승인 취소</button>}</> : <><button className="slot-content" aria-label={`${block}: ${p?.name || '빈 시간'}. 시간 선택 또는 클래스 편성`} aria-pressed={selectedSlot === index} onClick={() => chooseSlot(index)} disabled={!canEdit || !roomState.open}><span className="slot-icon">{p ? <ScheduleProgramIcon program={p.id} /> : <Icon name="plus" size={25} />}</span><strong>{p?.shortName || (selectedSlot === index ? '선택한 시간' : '시간 선택')}</strong><small>{!available ? '장비 확인 필요' : selectedSlot === index ? '클래스를 골라 주세요' : p ? `${roomCapacity(room, p.id)}명 · 강사·진행비 포함` : '비워 두어도 괜찮아요'}</small>{scheduleIssues.length>0&&<span className="schedule-warning">! {shortOperationReason(scheduleIssues[0]!.reason)} · {interruptedWeeks}/13주 휴강</span>}</button>{p && canEdit && <button className="clear-slot" aria-label={`${block} 클래스 비우기`} onClick={() => place(index, null)}><Icon name="close" size={12} /></button>}</>}
              </div>
            })}</div>
            <div className="schedule-bottom"><span><Icon name="calendar" size={14} />{viewingResult ? '13주차 실제 기록 · 편성 변경 없음' : '매주 반복 · 대관은 잠금 · 빈 시간은 쉬어가요'}</span>{!viewingResult && <button className="text-button" disabled={!canEdit} onClick={clearRoomClasses}>클래스 비우기</button>}</div>
          </section>}
        </section>

        {insideRoom && reviewingRentals && <RentalReview game={game} room={room} onDecide={reviewRental} onClearClass={clearClass} onOpenFacility={(targetRoom) => { selectRoom(targetRoom); setModal('facility') }} />}
        {insideRoom && !reviewingRentals && <aside className="decision-column">
          <div className="room-panel"><div className="class-panel-heading"><h2>클래스 선택</h2><span>{ROOM_NAMES[room]}</span></div>
            {canEdit && selectedSlot !== null && <div className="slot-selection-prompt"><span><b>{BLOCKS[selectedSlot]}</b>에 열 클래스 선택</span><button className="text-button" onClick={cancelSlotSelection}>시간 선택 취소</button></div>}
            {!roomState.open && <div className="room-facility-entry"><span><Icon name="lock" size={14} />{facilityProject?.stage === 'construction' ? `공사 중 · ${constructionTurns(facilityProject.remainingWeeks)}턴 남음` : '시설 조성 후 개방할 공간'}</span><button className="class-requirement-action" onClick={() => setModal('facility')}><Icon name="tools" size={15} />{facilityProject?.stage === 'construction' ? '시공 현황 보기' : '시설 입찰 진행'}<Icon name="arrow" size={13} /></button></div>}
            <button className="procurement-button" disabled={!canEdit} onClick={openShop}><span><Icon name="box" size={21} /><span>나라장터로 물품 조달<small>기능 · 운영비 · 설치 기간 비교</small></span></span><Icon name="arrow" size={16} /></button>
            <>{currentProgram && <button className="demand-peek" onClick={() => setModal('demand')}><Icon name="people" size={17} /><span>{currentProgram?.shortName || '주민'} 신청 <b>{selectedDemand.reduce((sum, group) => sum + group.people, 0)}명</b></span><Icon name="arrow" size={13} /></button>}<div className="activity-heading"><span>어떤 클래스를 열까요?</span><small>금액은 주 1회 기준 · 선택하면 상세</small></div>
            <div className="activity-grid">{roomPrograms.map((p) => {
              const requirements = getProgramRequirements(game.player, room, p.id)
              return <button key={p.id} className={`activity-chip class-card ${selected === p.id ? 'chosen' : ''} ${!requirements.ready ? 'locked' : ''}`} disabled={!canEdit} aria-pressed={selected === p.id} aria-label={`${p.name} · ${p.difficulty}${p.exclusiveRoom ? ' · ' + ROOM_NAMES[p.exclusiveRoom] + ' 전용' : ''} · ${ROOM_NAMES[room]} ${classStatus(requirements, roomState.open)}`} draggable={canEdit && requirements.ready} onDragStart={(e) => { if (!canEdit || !requirements.ready) { e.preventDefault(); return } e.dataTransfer.setData('text/plain', p.id); setSelected(p.id) }} onClick={() => chooseProgram(p.id)}>
                <span className="class-card-art"><img src={courseSymbolPath(p.id)} alt="" draggable={false} loading="lazy" /></span>
                <span className="class-card-name"><b>{p.shortName}</b>{p.exclusiveRoom ? <span className="class-premium-mark" title={ROOM_NAMES[p.exclusiveRoom] + ' 전용 클래스'} aria-label={ROOM_NAMES[p.exclusiveRoom] + ' 전용'}>전용</span> : p.specialty && <span className="class-premium-mark" title={p.specialty + ' 특화 클래스'}>특화</span>}{!requirements.ready && <Icon name="lock" size={13} />}{selected === p.id && <span className="class-card-selected"><Icon name="check" size={12} /></span>}</span>
                <ClassEconomicsCard value={classOutlooks[p.id]}/>
              </button>
            })}</div>
            {currentProgram && currentRequirements && <section className={`class-requirements ${currentRequirements.ready ? 'is-ready' : ''}`} aria-label={`${currentProgram.name} 개설 조건`} aria-live="polite">
              <div className="class-requirements-heading"><strong>{currentProgram.shortName}</strong><em className={`difficulty-badge difficulty-${currentProgram.difficulty}`}>{currentProgram.difficulty}</em><span>{currentProgram.exclusiveRoom ? ROOM_NAMES[currentProgram.exclusiveRoom] + ' 전용' : ROOM_NAMES[room] + ' 기준'}</span></div>
              <ClassEconomicsDetail value={classOutlooks[currentProgram.id]}/>
              {currentProgram.specialty && <div className="premium-class-summary">
                <div><b>{currentProgram.specialty === '균형' ? '균형 성장' : currentProgram.specialty + ' 특화'}</b><span>만석 수업차익 <strong>+{wonAmount(currentProgram.income * roomCapacity(room, currentProgram.id) / currentProgram.capacity - currentProgram.cost)}원/회</strong></span><span>명성 기여 <strong>×{currentProgram.reputationMultiplier}</strong></span></div>
                <small>표준요금 · 장비 유지비 별도 · 센터 전체 주 {currentProgram.weeklyLimit}회 <b>({getProgramWeeklyCount(game.player, currentProgram.id)}/{currentProgram.weeklyLimit})</b></small>
              </div>}
              <p className="class-requirement-summary">{currentProgram.requirementLabel} · {classStatus(currentRequirements, roomState.open)}</p>
              {currentProgram.requires.length > 0 ? <ul className="class-equipment-list">{currentProgram.requires.map((family) => {
                const status = currentRequirements.missingFamilies.includes(family) ? '필요' : currentRequirements.pendingFamilies.includes(family) ? '설치 대기' : currentRequirements.wornFamilies.includes(family) ? '정비 필요' : '설치 완료'
                return <li key={family} className={status === '설치 완료' ? 'is-ready' : ''}><span><Icon name={status === '설치 완료' ? 'check' : status === '설치 대기' ? 'box' : 'lock'} size={12} />{FAMILY_NAMES[family] || family}</span><b>{status}</b></li>
              })}</ul> : <p className="class-ready-note">강사가 이끄는 무료 수업 · 별도 설비 없음</p>}
              {!roomState.open ? <div className="class-space-warning"><Icon name="lock" size={14} />시설 개방 후 편성 가능<button className="text-button" onClick={() => setModal('facility')}>시설 입찰 확인 <Icon name="arrow" size={12} /></button></div> : !currentRequirements.spaceReady ? <p className="class-space-warning"><Icon name="home" size={14} />{currentRequirements.spaceRequired}㎡ 이상인 방을 골라 주세요. 현재 {roomDefinition.area}㎡</p> : <>
                {currentRequirements.missingFamilies.length > 0 && <button className="class-requirement-action" disabled={!canEdit} onClick={() => openRequiredShop()}><Icon name="box" size={15} />필요 물품 조달<Icon name="arrow" size={13} /></button>}
                {currentRequirements.pendingFamilies.length > 0 && <p className="class-install-note"><Icon name="box" size={13} />{currentRequirements.missingFamilies.length || currentRequirements.wornFamilies.length ? '주문한 설비는 이번 운영 때 설치돼요.' : '설치 대기 · 이번 운영 후 개설 가능'}</p>}
                {currentRequirements.wornFamilies.length > 0 && <button className="class-requirement-action" disabled={!canEdit} onClick={() => { setDetail(true); requestAnimationFrame(() => document.querySelector('.room-details')?.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' })) }}><Icon name="tools" size={15} />시설 관리 열기<Icon name="arrow" size={13} /></button>}
                {currentRequirements.ready && <p className="class-ready-note"><Icon name="check" size={13} />빈 시간에 놓기 · 정원 {roomCapacity(room, currentProgram.id)}명<span>{currentProgram.id === 'P06' ? '무료 안전교육 · 공공서비스' : (currentProgram.income > 0 ? '수강료 수입' : '무료 운영') + ' · 교육 참여·명성 성장'}</span></p>}
              </>}
              {acceptedRentals.some((request) => request.room === room) && <div className="class-rental-tradeoff"><span>이 방 대관 {acceptedRentals.filter((request) => request.room === room).length}건 · {wonAmount(acceptedRentals.filter((request) => request.room === room).reduce((sum, request) => sum + request.fee, 0))}원/주</span><button className="text-button" disabled={!canEdit} onClick={() => editRentals()}>클래스 시간 확보 <Icon name="arrow" size={12} /></button></div>}
            </section>}
            <button className="room-details-toggle text-button" aria-expanded={detail} aria-controls="room-management-details" onClick={() => setDetail(!detail)}>{detail ? '시설 관리 접기' : `시설 관리 · 활동 ${roomEquipmentUsage.used}/${roomEquipmentUsage.capacity} · 창고 ${game.player.inventory.filter(item => item.stored).length}개`} <Icon name="arrow" size={12} /></button>{detail && <div className="room-details" id="room-management-details">{facilityProject && <button className="text-button" onClick={() => setModal('facility')}>시설 사업 기록 <Icon name="arrow" size={12} /></button>}<EquipmentStoragePanel game={game} room={room} canEdit={canEdit} onMove={requestEquipmentMove} onStore={requestEquipmentStorage} onReinstall={(instanceId, target) => act(reinstallEquipment(game, instanceId, target), ROOM_NAMES[target] + ' 보관 장비 재설치 예약 · 다음 운영 때 설치')} /><div className="room-expertise"><span>운영 숙련</span><b>문화 {getLevel(game.player.xp.culture)}</b><b>체육 {getLevel(game.player.xp.sport)}</b><b>행사 {getLevel(game.player.xp.event)}</b></div><div className="operating-options"><label>강좌 요금<select disabled={!canEdit} value={game.player.priceMode} onChange={(e) => { const next = setPriceMode(game, e.target.value as 'discount' | 'standard' | 'premium'); setGame(next); notify('강좌 요금 · ' + ({ discount: '할인', standard: '표준', premium: '지원 강화' })[next.player.priceMode] + ' 적용') }}><option value="discount">할인 · 85%</option><option value="standard">표준 · 100%</option><option value="premium">지원 강화 · 숙련 2부터</option></select></label></div><div className="small-actions"><button disabled={!canEdit} onClick={() => act(maintainRoom(game, room), ROOM_NAMES[room] + ' 정비 예약 · 다음 운영 때 적용')}>시설 정비 · 120,000원</button><button disabled={!canEdit} onClick={() => act(trainStaff(game, room === 'B' ? 'sport' : ['A', 'C', 'D'].includes(room) ? 'event' : 'culture'), '직원 교육 예약 · 다음 운영 때 숙련에 반영', 'harin')}>직원 교육 · 120,000원</button></div></div>}</>
          </div>
        </aside>}
        {insideRoom && !reviewingRentals && <div className="character-dialogue room-dialogue"><span className="dialogue-portrait"><img src={`/center/${cast.file}-portrait.webp`} alt={`${cast.role} ${cast.name}`} onError={(e) => { e.currentTarget.src = '/center/jiseon-portrait.webp' }} /></span><div className="dialogue-copy"><span>{cast.name}<small>{cast.role}</small></span><p>{dialogue}</p></div></div>}
      </div>

      <footer className={`action-bar ${reviewingRentals ? 'rental-action-bar' : ''} ${canEdit ? 'planning-action-bar' : ''} ${playing ? 'operating-action-bar' : ''}`}>
        <button className="rival-button" aria-label="이웃 센터 비교" onClick={() => setModal('rivals')}><Icon name="trophy" size={21} /><span>이웃 센터<small>{game.rivals.length}곳의 서로 다른 도전</small></span><Icon name="arrow" size={14} /></button>
        <div className="forecast">{reviewingRentals ? <><span><Icon name="calendar" size={17} /><span>대관 {acceptedRentals.length}건 승인 · {game.player.rooms.filter((item) => item.open).length * BLOCKS.length - acceptedRentals.length}칸에 클래스 편성 가능</span></span><small>미결정 {pendingRentals.length}건은 확정할 때 거절됩니다.</small></> : <><span>{preview?.warnings[0] ? <><Icon name="help" size={17} /><span>{preview.warnings[0]}</span></> : <><Icon name="leaf" size={17} /><span>대관으로 운영하고, 클래스로 이름을 알려요.</span></>}</span><small>예상 이용 {preview?.visits || 0}회 · 영업 {preview ? `${preview.profit >= 0 ? '+' : ''}${wonAmount(preview.profit)}` : '0'}원 · 명성 {Math.round(game.player.reputation)}</small></>}</div>
        <div className="actionbar-actions">
          {playing && <button className="secondary-button actionbar-skip" onClick={() => { setPlaying(false); setOperationPaused(false); setModal('review') }}>빠르게 넘기기 <Icon name="arrow" size={16}/></button>}
          {canEdit && <button className="secondary-button actionbar-back" onClick={() => editRentals()} aria-label="대관 검토로 돌아가기 · 기존 클래스 편성 유지" title="기존 클래스 편성을 유지하며 대관을 다시 검토합니다."><span className="actionbar-back-full">대관 검토로 돌아가기</span><span className="actionbar-back-short">대관 다시 검토</span></button>}
          {reviewingRentals ? <button className="primary-button run-button" onClick={()=>finishRentals()}>대관 확정 · 클래스 편성 <Icon name="arrow" size={17} /></button> : game.phase === 'ending' ? <button className="primary-button run-button" onClick={() => setModal('review')}><Icon name="trophy" />{MAX_YEARS}년의 기록 보기</button> : playing ? <button className="primary-button run-button operation-busy" disabled aria-busy="true"><span className={`operation-spinner ${operationPaused?'is-paused':''}`} aria-hidden="true" />{operationPaused?'운영 일시정지':'운영 중'}<small>{ROOM_NAMES[room]} · {tourIndex+1}/{operationTour.length}</small></button> : game.phase === 'review' ? <button className="primary-button run-button" onClick={() => { setPlaying(false); setModal('review') }}>계절 결과 보기 <Icon name="arrow" /></button> : <button className="primary-button run-button" disabled={!canEdit} onClick={start}><Icon name={playing ? 'pause' : 'play'} size={19} />{playing ? '시설 운영을 확인하고 있어요' : '이번 계절 시작'}<small>빈 시간도 그대로 실행</small></button>}
        </div>
      </footer>
      <div className="build-note">{getSeasonEvent(game) ? `이번 계절 소식: ${getSeasonEvent(game)!.title} · ${getSeasonEvent(game)!.effect} / ` : ''}게임 속 기관·예산·평가는 창작 설정입니다.</div>
    </main>

    <ToastFeedback notice={feedback} onDismiss={() => setFeedback(null)} />
    {modal === 'store-equipment' && storageEquipment && storageOffer && storageImpact && <Modal title={storageImpact.rentalIds.length ? '승인한 대관에 필요한 장비예요' : storageTargetRoom ? '클래스를 비우고 이전할까요?' : '클래스를 비우고 보관할까요?'} onClose={closeEquipmentConfirmation}>
      <div className="storage-confirm-summary"><strong>{storageOffer.name}</strong><span>{storageTargetRoom ? ROOM_NAMES[storageTargetRoom] + '로 이전 80,000원 · 다음 운영 때 설치' : '보관 80,000원'} · 유지비 {wonAmount(storageOffer.maintenance)}원/계절은 계속 발생</span></div>
      <ul className="storage-impact-list">{storageImpact.slots.map(slot => <li key={slot}><span>{storageImpact.room && ROOM_NAMES[storageImpact.room]} · {BLOCKS[slot]}</span><b>{PROGRAMS.find(program => program.id === game.player.plan[storageImpact.room!][slot])?.name}</b><small>{storageTargetRoom ? '이전하면 편성 취소' : '보관하면 편성 취소'}</small></li>)}{storageImpact.rentalIds.map(id => { const request = game.player.rentalRequests.find(value => value.id === id)!; return <li key={id}><span>{ROOM_NAMES[request.room]} · {BLOCKS[request.slot]}</span><b>{request.client}</b><small>승인 대관 · 먼저 직접 취소 필요</small></li> })}</ul>
      <div className="review-actions"><button className="secondary-button" onClick={closeEquipmentConfirmation}>장비와 일정 유지</button>{storageImpact.rentalIds.length ? <button className="primary-button" onClick={() => { closeEquipmentConfirmation(); editRentals() }}>대관 검토로 이동</button> : <button className="primary-button" onClick={confirmEquipmentStorage}>{storageTargetRoom ? '클래스를 비우고 이전 · 80,000원' : '클래스를 비우고 보관 · 80,000원'}</button>}</div>
    </Modal>}
    {modal === 'confirm-rentals' && <Modal title="미결정 대관을 거절하고 넘어갈까요?" onClose={()=>setModal(null)}><p>승인 {acceptedRentals.length}건은 유지하고, 미결정 {pendingRentals.length}건은 거절합니다. 클래스 편성 중에도 대관 검토로 돌아올 수 있어요.</p><div className="review-actions"><button className="secondary-button" onClick={()=>setModal(null)}>계속 검토</button><button className="primary-button" onClick={()=>finishRentals(true)}>거절하고 클래스 편성</button></div></Modal>}
    {modal === 'confirm-empty' && <Modal title="운영 전에 계획을 확인해 주세요" onClose={() => setModal(null)}>{preview&&<OperationIssues report={preview} forecast/>}<p className="empty-schedule-summary"><strong>빈 일정 {emptySlotCount}칸 · {emptyRoomSchedules.length}개 공간</strong><span>대관이나 클래스가 없는 시간이에요. 비워 두어도 운영할 수 있습니다.</span></p><div className="empty-schedule-rooms">{emptyRoomSchedules.map(value => <span key={value.room}>{ROOM_NAMES[value.room]} <b>{value.slots.length}칸</b></span>)}</div><div className="review-actions"><button className="secondary-button" onClick={() => setModal(null)}>계획 계속하기</button><button className="primary-button" onClick={runPlannedSeason}>확인한 계획으로 운영 <Icon name="play" size={15} /></button></div></Modal>}
    {modal === 'welcome' && <Modal title="어서 오세요, 센터장님." onClose={dismissWelcome} wide><div className="welcome-layout"><div className="welcome-portrait"><img src="/center/jiseon-portrait.webp" alt="운영팀장 오지선" /><span>오지선 · 운영팀장</span></div><div className="welcome-copy"><span className="eyebrow">일곱 공간, 센터장님의 첫 계절</span><h3>빌려 주는 시간.<br />함께 배우는 시간.</h3><p>대관으로 운영비를 벌고,<br />남은 시간의 클래스로 센터 명성을 키워요.</p><div className="welcome-turn-steps"><span><b>01</b>대관 신청 승인</span><span><b>02</b>물품 조달 · 클래스 편성</span><span><b>03</b>13주 운영 · 결과 확인</span></div><div className="starter-options"><button onClick={dismissWelcome}><Icon name="calendar" size={24} /><span>도착한 대관 신청 보기<small>일곱 공간 중 어디부터 열어 볼까요?</small></span><Icon name="arrow" size={16} /></button></div></div></div></Modal>}

    {modal === 'equipment' && <Modal title={ROOM_NAMES[room] + ' · 설치 물품과 창고'} onClose={() => setModal(null)}><EquipmentStoragePanel game={game} room={room} canEdit={canEdit} onMove={requestEquipmentMove} onStore={requestEquipmentStorage} onReinstall={(instanceId, target) => act(reinstallEquipment(game, instanceId, target), ROOM_NAMES[target] + ' 재설치 예약')} />{!canEdit && <p>물품 이동은 다음 계절 계획에서 할 수 있어요.</p>}</Modal>}
    {modal === 'shop' && <Modal title="나라장터 · 물품 조달" onClose={() => setModal(null)} wide className="procurement-modal"><ProcurementDesk game={game} room={room} onRoomChange={setRoom} onBuy={buy} onNotify={notify} onManageEquipment={() => { setModal(null); setDetail(true); requestAnimationFrame(() => document.querySelector('.room-details')?.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' })) }} onClose={() => setModal(null)} initialFilter={shopFilter} /></Modal>}
    {modal === 'facility' && <Modal title="나라장터 · 시설 조성 입찰" onClose={() => setModal(null)} wide className="facility-modal"><FacilityDesk game={game} room={room} onChange={setGame} onNotify={notify} onClose={() => setModal(null)} /></Modal>}
    {modal === 'campus' && <Modal title="나라장터 · 센터 환경 개선" onClose={() => setModal(null)} wide className="facility-modal"><CampusDesk game={game} onChange={setGame} onNotify={notify} onClose={() => setModal(null)} /></Modal>}
    {modal === 'replace-class' && replacementRental && <Modal title="기존 클래스를 취소하겠습니까?" onClose={closeReplacement}><div className="class-replacement-summary"><span>{ROOM_NAMES[replacementRental.room]} · {BLOCKS[replacementRental.slot]}</span><div><strong>{replacementProgram?.name || '기존 클래스'}</strong><Icon name="arrow" size={19} /><strong>{replacementRental.client}<small>대관 · {wonAmount(replacementRental.fee)}원/주</small></strong></div></div><p className="class-replacement-note">승인하면 이 시간의 클래스가 대관으로 바뀝니다.</p><div className="review-actions"><button className="secondary-button" onClick={closeReplacement}>기존 클래스 유지</button><button className="primary-button" onClick={confirmReplacement}>클래스를 취소하고 대관 승인</button></div></Modal>}

    {modal === 'rivals' && <Modal title="각자의 방식으로, 함께 성장 중" onClose={() => setModal(null)} wide><div className="rivals-layout"><div className="ranking-list"><div className="ranking-label"><span>{game.phase === 'ending' ? `${MAX_YEARS}년 종합 최종 성적` : `${game.year}년 차 공개 성적`}</span><span>종합 점수</span></div>{standings.map((inst, index) => <button key={inst.id} className={`ranking-row ${inst.id === game.player.id ? 'is-player' : ''} ${rival.id === inst.id ? 'viewing' : ''}`} onClick={() => setRivalId(inst.id)}><span className="rank-number">{index + 1}</span><span className="rank-avatar"><Icon name={inst.id === game.player.id ? 'home' : ['leaf', 'music', 'sport', 'brush', 'bolt'][index % 5]!} size={19} /></span><span className="rank-name">{inst.name}<small>{game.phase === 'ending' && ceremonyAward(index + 1, true) ? `${ceremonyAward(index + 1, true)} · ` : ''}{inst.id === game.player.id ? '우리 센터' : inst.archetype}</small></span><b>{inst.history.length ? (game.phase === 'ending' ? finalScore(inst) : inst.score).toFixed(1) : '—'}</b></button>)}</div><div className="rival-profile"><div className="rival-building"><img key={rivalExterior} src={rivalExterior} alt={`${rival.name} 외관`} onError={(event) => { if (!event.currentTarget.src.endsWith('/center/building-v2/exterior.webp')) event.currentTarget.src = '/center/building-v2/exterior.webp' }} /><span>{rival.name}</span></div><span className="pill">운영 스타일</span><h3>{rivalIsPlayer ? '나만의 운영' : rival.archetype}</h3><p>최근 투자<br /><b>{legacyMoneyText(rival.lastPurchase || '첫 계획을 준비하고 있어요').replace(/이용 만족도 \+6/g, '이용 환경 개선')}</b></p><div className="rival-programs">{[...new Set(Object.values(rival.plan).flat().filter(Boolean))].slice(0, 3).map((id) => <span key={id}>{PROGRAMS.find((p) => p.id === id)?.shortName}</span>)}</div><div className="rival-metrics"><span>주민 신뢰<b>{Math.round(rival.trust)}</b></span><span>개방한 공간<b>{rival.rooms.filter((r) => r.open).length}</b></span><span>보유 장비<b>{rival.inventory.length}</b></span></div><small>같은 예산과 운영 규칙으로 매주 계산되는 기관입니다.</small></div></div></Modal>}

    {modal === 'season-start' && <Modal title={`${game.year}년 차 ${SEASONS[game.season]} 시작`} onClose={() => {setGame({...game,seasonIntroSeen:seasonIntroKey(game)});setModal(null)}} wide><SeasonOpening key={seasonIntroKey(game)} game={game} onEventSound={setComicEvent} onContinue={() => {setGame({...game,seasonIntroSeen:seasonIntroKey(game)});setModal(null)}} /></Modal>}
    {modal === 'review' && game.lastReport && <Modal title={game.phase === 'ending' ? ceremonyTitle(MAX_YEARS) : game.lastReport.evaluation ? ceremonyTitle(game.lastReport.year) : `${game.lastReport.year}년 차 ${SEASONS[game.lastReport.season]} 운영 결산`} onClose={() => setModal(null)} wide><SeasonReview key={`${game.year}-${game.season}-${game.phase}`} game={game} report={game.lastReport} onRivals={() => setModal('rivals')} onContinue={continueGame} onReset={() => setModal('reset')} /></Modal>}

    {modal === 'demand' && <Modal title="이런 활동을 기다리고 있어요" onClose={() => setModal(null)} wide><p className="demand-intro">한 그룹은 한 주에 한 번 방문해요. 원하는 시간과 요금을 맞춰 보세요.</p><div className="demand-list">{demand.map((group) => <div key={group.id}><span className="demand-icon"><Icon name={PROGRAM_ICONS[group.programs[0]!] || 'people'} size={22} /></span><div><strong>{group.title}</strong><small>{group.slots.map((slot) => BLOCKS[slot]).join(' · ')}</small></div><span>{group.people}명<small>{group.maxFee === 0 ? '무료 이용 희망' : ['P05','P08','P10'].includes(group.programs[0]!) ? `그룹 ${wonAmount(group.maxFee)}원까지` : `1인 ${wonAmount(group.maxFee)}원까지`}</small></span></div>)}</div></Modal>}

    {modal === 'help' && <Modal title="센터장님의 작은 안내서" onClose={() => setModal(null)}>{saveIssue && <p className="save-issue-note" role="status">{saveIssue}</p>}{Boolean(game.migrationNotices?.length) && <section className="migration-notice-panel" aria-label="저장 이관 안내"><h3>전용 클래스 배치가 바뀌었어요</h3><p>진행과 자금, 과거 성적은 유지했습니다. 이번 변경 내역을 확인해 주세요.</p><ul>{game.migrationNotices!.map((message, index) => <li key={index}>{message}</li>)}</ul><button className="secondary-button" onClick={() => { const next = { ...game }; delete next.migrationNotices; setGame(next); notify('변경 내역을 확인했어요.', 'info') }}>확인했어요</button></section>}<div className="help-steps"><p><b>1. 대관을 먼저 골라요</b><span>공간별 신청을 승인하면 그 시간이 예약돼요. 전부 받을 필요는 없어요.</span></p><p><b>2. 남은 시간에 클래스를 열어요</b><span>시간과 클래스는 어느 쪽부터 골라도 돼요. 생활안전 교실은 별도 설비 없이 무료로 열 수 있어요.</span></p><p><b>3. 운영 수입과 명성을 키워요</b><span>대관으로 운영비를 벌고, 강좌로 명성을 키워요. 공공서비스는 접근성 50%·교육 참여 50%예요. 유·무료 강좌 모두 실제 참여를 인정해요.</span></p></div><p className="help-note">대관 운영원가는 첫 2년 지원 기간에 대관료의 48%, 3년 차부터 60%에 공간 기본비를 더해요. 기존 승인 건은 유지하며 새 신청의 비용에 표시돼요. 명성이 높아질수록 추가 상승은 완만해져요.</p><p className="help-note">{MAX_YEARS}년 · {MAX_TURNS}턴 동안 운영하며 {EVALUATION_INTERVAL}년마다 종합평가를 받아요. 한 턴은 13주. 운영을 시작하기 전에는 대관을 다시 검토할 수 있어요. 조달 물품은 첫 운영 때 설치됩니다. 설치 완료 후 다음 계획에서 클래스를 열 수 있어요. 현금은 원, 평가점수는 점으로 표시합니다. 예산은 공개 가격을 참고한 게임용 설정이며 실제 기관의 전체 인건비·시설원가를 재현하지 않습니다.</p><label className="setting-line"><span>움직임 줄이기</span><input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /></label><AudioControls/><button className="danger-text" onClick={() => setModal('reset')}><Icon name="reset" size={15} />저장한 게임을 새로 시작</button></Modal>}
    {modal === 'reset' && <Modal title="새 센터장으로 다시 시작할까요?" onClose={() => setModal(null)}><p className="reset-copy">이 브라우저의 현재 진행 기록이 새 게임으로 바뀝니다.</p><div className="review-actions"><button className="secondary-button" onClick={() => setModal(null)}>현재 게임 계속하기</button><button className="primary-button" onClick={() => { const fresh=createGame(); try { replaceGameSave(localStorage,fresh) } catch { notify("기존 기록을 백업하지 못해 새 게임을 시작하지 않았어요.","error"); return } setGame(fresh); setRoom('A'); setInsideRoom(false); setSelectedByRoom({}); setFeedback(null); setPlaying(false); setModal('welcome'); setSpeaker('jiseon'); setDialogue('새로운 센터의 첫 페이지를 열어 볼까요?') }}>새로 시작하기</button></div></Modal>}
  </div>
}
