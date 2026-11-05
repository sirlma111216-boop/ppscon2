import { useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import CenterScene from './CenterScene'
import ProcurementDesk from './ProcurementDesk'
import Icon from './Icon'
import { playSound, setMusic } from './audio'
import { BLOCKS, OFFERS, PROGRAMS, SEASONS, buyEquipment, canRunProgram, createGame, finalScore, freeCash, getDemand, getLevel, maintainRoom, moveEquipment, nextSeason, openHall, previewSeason, runSeason, setGuideMode, setPriceMode, setProgram, setWeekendSupport, trainStaff, validateSave } from './simulation'
import type { GameState, ProgramId, RoomId } from './simulation'

const SAVE_KEY = 'ppscon2.center.v1'
const INTRO_KEY = 'ppscon2.intro.v1'
const ROOM_NAMES = { A: '문화교실', B: '다목적실', C: '행사실' }
const PROGRAM_ICONS: Record<string, string> = { P01: 'brush', P02: 'brush', P03: 'sport', P04: 'sport', P05: 'chat', P06: 'people', P07: 'screen', P08: 'music', P09: 'music', P10: 'screen' }
const CAST = { jiseon: { name: '오지선', role: '운영팀장', file: 'jiseon' }, doyun: { name: '한도윤', role: '시설 담당', file: 'doyun' }, harin: { name: '윤하린', role: '문화강사', file: 'harin' } }
type ModalName = 'welcome' | 'shop' | 'rivals' | 'review' | 'help' | 'reset' | 'demand' | null
const money = (n: number) => n.toLocaleString('ko-KR', { maximumFractionDigits: 1 })
function initialGame() {
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) { const saved: unknown = JSON.parse(raw); if (validateSave(saved)) return saved } } catch { /* A damaged save should not prevent starting. */ }
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
  const [game, setGame] = useState<GameState>(initialGame)
  const [room, setRoom] = useState<RoomId>('A')
  const [selected, setSelected] = useState<ProgramId | null>('P05')
  const [modal, setModal] = useState<ModalName>(() => {
    try { return localStorage.getItem(INTRO_KEY) ? null : 'welcome' } catch { return 'welcome' }
  })
  const [shopFilter, setShopFilter] = useState('all')
  const [toast, setToast] = useState('')
  const [dialogue, setDialogue] = useState(() => game.history.length ? `${game.year}년 차 ${SEASONS[game.season]}, 우리 센터의 계획을 이어가 볼까요?` : '센터장님, 우리 동네의 첫 주를 함께 만들어 봐요.')
  const [speaker, setSpeaker] = useState<keyof typeof CAST>('jiseon')
  const [playing, setPlaying] = useState(false)
  const [activeSlot, setActiveSlot] = useState(0)
  const [setupRooms, setSetupRooms] = useState<GameState['player']['rooms'] | null>(null)
  const [speed, setSpeed] = useState(1)
  const [music, updateMusic] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [saved, setSaved] = useState(true)
  const [detail, setDetail] = useState(false)
  const [rivalId, setRivalId] = useState('')
  const preview = useMemo(() => game.phase === 'planning' ? previewSeason(game) : game.lastReport, [game])
  const roomState = game.player.rooms.find((r) => r.id === room)!
  const canEdit = game.phase === 'planning' && !playing
  const sceneRooms = playing && activeSlot < 0 && setupRooms ? setupRooms : game.phase === 'planning'
    ? game.player.rooms.map((r) => ({ ...r, equipment: r.equipment.filter((id) => game.player.inventory.some((item) => item.id === id && item.ready)) }))
    : game.player.rooms
  const currentProgram = PROGRAMS.find((p) => p.id === selected)
  const cast = CAST[speaker]
  const turn = (game.year - 1) * 4 + game.season + 1
  const standings = [...game.rivals, game.player].sort((a, b) => (game.phase === 'ending' ? finalScore(b) - finalScore(a) : b.score - a.score) || b.publicScore - a.publicScore || b.experienceScore - a.experienceScore || a.name.localeCompare(b.name))
  const finalRank = standings.findIndex((inst) => inst.id === game.player.id) + 1
  const demand = useMemo(() => getDemand(game), [game.seed, game.year, game.season])
  const selectedDemand = demand.filter((group) => selected && group.programs.includes(selected))
  const rival = game.rivals.find((r) => r.id === rivalId) || game.rivals[0]!
  useEffect(() => {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(game)); setSaved(true) } catch { setSaved(false) }
  }, [game])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 3200); return () => clearTimeout(timer) }, [toast])
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
  function selectRoom(value: RoomId) { setRoom(value); if (selected && !canRunProgram(game.player, value, selected)) setSelected('P05'); playSound('select'); setDetail(false) }
  function chooseProgram(id: ProgramId) {
    if (!canEdit) return
    const program = PROGRAMS.find((p) => p.id === id)!
    if (!canRunProgram(game.player, room, id)) {
      setShopFilter('all'); setModal('shop'); setSpeaker('doyun'); setDialogue(`${program.shortName}에 쓸 장비를 먼저 살펴볼까요?`); return
    }
    setSelected(id); playSound('select'); setSpeaker('jiseon')
    setDialogue(`${program.shortName}, 좋아요. 아래 일정에서 원하는 시간에 놓아 주세요.`)
    if (window.matchMedia('(max-width: 870px)').matches) requestAnimationFrame(() => document.querySelector('.schedule-panel')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' }))
  }
  function place(slot: number, id: ProgramId | null = selected) {
    if (!canEdit || !roomState.open) return
    if (id && !canRunProgram(game.player, room, id)) { setToast('이 활동에 필요한 물품이 아직 없어요.'); return }
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
      const suggested = PROGRAMS.find((p) => canRunProgram(result.state.player, room, p.id) && p.requires.length > 0)
      if (suggested) setSelected(suggested.id)
    }
  }
  function start() {
    if (!canEdit) return
    try {
      const next = runSeason(game)
      setSetupRooms(sceneRooms); setGame(next); setActiveSlot(game.player.pendingTasks.length ? -1 : 0); setPlaying(true); setModal(null); setSpeaker('jiseon')
      setDialogue('문을 열 시간이에요. 우리가 만든 한 주를 만나 봐요!'); playSound('run')
      requestAnimationFrame(() => document.querySelector('.scene-card')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }))
    } catch { setToast('이번 계획을 실행하지 못했어요. 편성을 확인해 주세요.') }
  }
  function continueGame() {
    const next = nextSeason(game); setGame(next); setModal(null); setSpeaker('jiseon')
    setDialogue(next.phase === 'ending' ? '센터장님과 함께한 5년, 동네에 참 많은 변화가 생겼어요.' : `${SEASONS[next.season]}이 왔어요. 지난 계획을 이어가도, 새롭게 바꿔도 좋아요.`)
  }
  const openShop = () => { setShopFilter('all'); setModal('shop') }

  return <div className={`center-game ${reducedMotion ? 'reduce-motion' : ''}`}>
    <header className="topbar">
      <a href="#" className="brand" onClick={(e) => e.preventDefault()}><span className="brand-symbol"><Icon name="home" size={25} /></span><span>센터장님,<br /><strong>다음 주는요?</strong></span></a>
      <div className="center-identity"><span className="tiny-dot" /> 늘봄 문화체육센터 <span className="identity-tag">센터 운영 일지</span></div>
      <div className="top-actions"><span className={`save-state ${!saved ? 'unsaved' : ''}`}><Icon name={saved ? 'check' : 'help'} size={13} />{saved ? '자동 저장됨' : '저장 공간 확인'}</span><button className="icon-button" aria-label={music ? '음악 끄기' : '음악 켜기'} title="음악 · 초기 합성 스케치" onClick={() => { updateMusic(!music); setMusic(!music) }}><Icon name={music ? 'volume' : 'mute'} /></button><button className="icon-button" aria-label="도움말과 설정" onClick={() => setModal('help')}><Icon name="help" /></button></div>
    </header>

    <main className="game-layout">
      <div className="page-heading"><div><div className="eyebrow">센터 운영 일지</div><h1>{game.phase === 'ending' ? '우리의 5년이 남긴 것' : playing ? '우리 동네의 하루가 시작됩니다' : '우리 동네의 다음 주'}</h1></div><div className="season-badge"><span className="season-symbol"><Icon name={game.season === 0 ? 'leaf' : game.season === 1 ? 'sun' : game.season === 2 ? 'leaf' : 'sparkle'} size={25} /></span><div><small>{game.year}년 차</small><strong>{SEASONS[game.season]} <span>· {turn}/20</span></strong></div></div><div className="budget-badge" title={`총 현금 ${money(game.player.cash)} · 필수 운영비 유보 ${money(game.player.reserved)}`}><Icon name="coin" size={25} /><div><small>쓸 수 있는 예산</small><strong>{money(freeCash(game.player))}<span>점</span></strong></div></div></div>

      <div className="main-grid">
        <section className="play-column" aria-label="센터와 주간 계획">
          <div className="scene-card"><div className="scene-toolbar"><span><span className={`live-dot ${playing ? 'active' : ''}`} />{playing ? activeSlot < 0 ? '첫 주 · 시설 준비' : `2주차 · ${BLOCKS[activeSlot]}` : '작은 공간에서 시작되는 변화'}</span><div>{playing ? <><button className="text-button" onClick={() => setSpeed(speed === 1 ? 2 : 1)}>{speed}× 속도</button><button className="text-button" onClick={() => { setPlaying(false); setModal('review') }}>건너뛰기 <Icon name="arrow" size={13} /></button></> : <span className="scene-instruction">방을 눌러 둘러보세요 <Icon name="arrow" size={12} /></span>}</div></div>
            <div className="scene-stage"><CenterScene selectedRoom={room} onSelectRoom={selectRoom} rooms={sceneRooms} plan={game.player.plan} running={playing && activeSlot >= 0} activeSlot={activeSlot} season={game.season} report={playing && activeSlot >= 0 ? game.lastReport : null} reducedMotion={reducedMotion} />{playing && activeSlot < 0 && <div className="setup-overlay" role="status"><span className="setup-crate"><Icon name="box" size={46} /></span><strong>새로운 한 주를 준비해요</strong><span>납품된 물품을 확인하고 설치·정비합니다.</span><i /></div>}</div>
            <div className="scene-footer"><span><Icon name="people" size={15} /> 주민과 함께 자라는 공간</span><span><Icon name="heart" size={14} /> 신뢰 {Math.round(game.player.trust)} <i /> 문화 {getLevel(game.player.xp.culture)} · 체육 {getLevel(game.player.xp.sport)} · 행사 {getLevel(game.player.xp.event)}</span></div>
          </div>

          <section className="schedule-panel" aria-label={`${ROOM_NAMES[room]} 주간 계획`}>
            <div className="section-heading"><div><span className="small-overline">한 주 편성</span><h2>{ROOM_NAMES[room]}의 한 주</h2></div><span className="schedule-hint">{canEdit && currentProgram ? <><Icon name={PROGRAM_ICONS[currentProgram.id]!} size={15} /><b>{currentProgram.shortName}</b> 선택 중</> : '이 계획으로 한 계절을 운영해요'}</span></div>
            <div className="schedule-slots">{BLOCKS.map((block, index) => {
              const id = game.player.plan[room][index]; const p = PROGRAMS.find((p) => p.id === id); const available = !id || canRunProgram(game.player, room, id)
              return <div key={block} className={`schedule-slot ${playing && activeSlot === index ? 'is-active' : ''} ${p ? `kind-${p.kind}` : 'empty'} ${available ? '' : 'unavailable'}`} onDragOver={(e) => { if (canEdit) e.preventDefault() }} onDrop={(e) => { e.preventDefault(); const value = e.dataTransfer.getData('text/plain') as ProgramId; if (PROGRAMS.some((p) => p.id === value)) place(index, value) }}>
                <span className="slot-day">{block}<small>{index < 3 ? '평일' : '주말'}</small></span><button className="slot-content" aria-label={`${block}: ${p?.name || '빈 시간'}. 선택한 활동 배치`} onClick={() => place(index)} disabled={!canEdit || !roomState.open}><span className="slot-icon"><Icon name={p ? PROGRAM_ICONS[p.id]! : 'plus'} size={25} /></span><strong>{p?.shortName || (roomState.open ? '활동 놓기' : '아직 닫혀 있어요')}</strong><small>{!available ? '장비 확인 필요' : p ? `${p.capacity}명 · 준비 ${p.support}` : '빈 시간도 괜찮아요'}</small></button>{p && canEdit && <button className="clear-slot" aria-label={`${block} 비우기`} onClick={() => place(index, null)}><Icon name="close" size={12} /></button>}
              </div>
            })}</div>
            <div className="schedule-bottom"><span><Icon name="calendar" size={14} />매주 반복되는 일정 · 설치 작업은 첫 주에만</span><button className="text-button" disabled={!canEdit} onClick={() => { let next = game; for (let i = 0; i < 5; i++) next = setProgram(next, room, i, null); setGame(next) }}>이 방 비우기</button></div>
          </section>
        </section>

        <aside className="decision-column">
          <div className="room-panel"><div className="section-heading"><div><span className="small-overline">활동 선택</span><h2>{ROOM_NAMES[room]}</h2></div><span className="room-letter">{room}</span></div>
            <div className="room-tabs" role="group" aria-label="방 선택">{(['A', 'B', 'C'] as const).map((r) => <button key={r} className={room === r ? 'selected' : ''} onClick={() => selectRoom(r)}>{ROOM_NAMES[r]}{!game.player.rooms.find((x) => x.id === r)?.open && <Icon name="lock" size={12} />}</button>)}</div>
            {roomState.open ? <><button className="demand-peek" onClick={() => setModal('demand')}><Icon name="people" size={17} /><span>{currentProgram?.shortName || '주민'} 신청 <b>{selectedDemand.reduce((sum, group) => sum + group.people, 0)}명</b></span><Icon name="arrow" size={13} /></button><div className="activity-heading"><span>어떤 활동을 할까요?</span><small>선택 후 일정에 놓기</small></div><div className="activity-grid">{PROGRAMS.filter((p) => canRunProgram(game.player, room, p.id)).map((p) => {
              const available = canRunProgram(game.player, room, p.id)
              return <button key={p.id} className={`activity-chip ${selected === p.id ? 'chosen' : ''} ${!available ? 'locked' : ''}`} disabled={!canEdit} draggable={canEdit && available} onDragStart={(e) => { e.dataTransfer.setData('text/plain', p.id); setSelected(p.id) }} onClick={() => chooseProgram(p.id)}><Icon name={PROGRAM_ICONS[p.id]!} size={19} /><span>{p.shortName}<small>{available ? p.income > 0 ? '수입 활동' : '주민 활동' : '물품 필요'}</small></span>{!available && <Icon name="lock" size={11} />}</button>
            })}</div><button className="procurement-button" disabled={!canEdit} onClick={openShop}><span><Icon name="box" size={21} /><span>나라장터로 물품 조달<small>기능 · 운영비 · 설치 기간 비교</small></span></span><Icon name="arrow" size={16} /></button><button className="room-details-toggle text-button" onClick={() => setDetail(!detail)}>{detail ? '시설 관리 접기' : `시설 관리 · 보유 장비 ${roomState.equipment.length}개`} <Icon name="arrow" size={12} /></button>{detail && <div className="room-details">{game.player.inventory.filter((item) => item.room === room).map((item) => <div key={item.id} className="gear-detail"><div><span>{OFFERS.find((o) => o.id === item.id)?.name}</span><span>{item.ready ? `상태 ${Math.round(item.condition)}` : '조달·설치 준비 중'}</span></div><select aria-label={`${OFFERS.find((o) => o.id === item.id)?.name} 옮길 방`} value="" disabled={!canEdit || !item.ready} onChange={(e) => act(moveEquipment(game, item.id, e.target.value as RoomId), '다음 운영 첫 주에 옮겨 놓을게요. 원래 방의 일정도 확인해 주세요.')}><option value="" disabled>다른 방으로 옮기기 · 8점</option>{game.player.rooms.filter((r) => r.open && r.id !== room).map((r) => <option key={r.id} value={r.id}>{ROOM_NAMES[r.id]}</option>)}</select></div>)}<div className="operating-options"><label>강좌 요금<select disabled={!canEdit} value={game.player.priceMode} onChange={(e) => setGame(setPriceMode(game, e.target.value as 'discount' | 'standard' | 'premium'))}><option value="discount">할인 · 85%</option><option value="standard">표준 · 100%</option><option value="premium">지원 강화 · 숙련 2부터</option></select></label><label className="support-option"><span>주말 준비 지원 · 24점</span><input type="checkbox" disabled={!canEdit} checked={game.player.supportContract} onChange={(e) => act(setWeekendSupport(game, e.target.checked), e.target.checked ? '이번 계절은 주말 준비를 한 명 더 도와드려요.' : '주말 지원 계약을 되돌렸어요.', 'jiseon')} /></label>{game.player.inventory.some((item) => item.id === 'E10') && <label>예약 안내<select disabled={!canEdit} value={game.player.guideMode} onChange={(e) => setGame(setGuideMode(game, e.target.value as 'fast' | 'welcome'))}><option value="welcome">처음 온 주민 안내</option><option value="fast">반복 대관 빠른 접수</option></select></label>}</div><div className="small-actions"><button disabled={!canEdit || !roomState.equipment.length} onClick={() => act(maintainRoom(game, room), '도구를 손보면 다음 활동도 한결 편해져요.')}>정비 · 12점</button><button disabled={!canEdit} onClick={() => act(trainStaff(game, room === 'B' ? 'sport' : room === 'C' ? 'event' : 'culture'), '배운 것을 다음 수업에 써 볼게요.', 'harin')}>직원 교육 · 12점</button></div></div>}</> : <div className="locked-room"><Icon name="home" size={44} /><h3>이곳에도 이야기가 생길까요?</h3><p>창고를 정리하면 공연과 발표를 위한<br />넓은 공간이 열려요.</p><button className="primary-button" disabled={!canEdit} onClick={() => act(openHall(game), '창고를 정리하고 새 공간을 준비할게요.')}>행사실 열기 · 220점</button><small>추가 운영비 계절당 15점</small></div>}
          </div>
          <div className="character-dialogue"><img src={`/center/${cast.file}-portrait.png`} alt={`${cast.role} ${cast.name}`} onError={(e) => { e.currentTarget.src = '/center/jiseon-portrait.png' }} /><div className="dialogue-copy"><span>{cast.name}<small>{cast.role}</small></span><p>{dialogue}</p></div></div>
        </aside>
      </div>

      <footer className="action-bar"><button className="rival-button" onClick={() => setModal('rivals')}><Icon name="trophy" size={21} /><span>이웃 센터<small>10곳의 서로 다른 도전</small></span><Icon name="arrow" size={14} /></button><div className="forecast"><span>{preview?.warnings[0] ? <><Icon name="help" size={17} /><span>{preview.warnings[0]}</span></> : <><Icon name="leaf" size={17} /><span>한 칸의 선택이, 동네의 일상을 바꿔요.</span></>}</span><small>계절 예상 이용 {preview?.visits || 0}회 · 영업 {preview ? `${preview.profit >= 0 ? '+' : ''}${money(preview.profit)}` : '0'}점</small></div>{game.phase === 'ending' ? <button className="primary-button run-button" onClick={() => setModal('review')}><Icon name="trophy" />5년의 기록 보기</button> : game.phase === 'review' && !playing ? <button className="primary-button run-button" onClick={() => setModal('review')}>계절 결과 보기 <Icon name="arrow" /></button> : <button className="primary-button run-button" disabled={!canEdit} onClick={start}><Icon name={playing ? 'pause' : 'play'} size={19} />{playing ? '주민들이 활동 중이에요' : '이번 계절 시작'}<small>주간 계획 실행</small></button>}</footer>
      <div className="build-note">첫 플레이 버전 · 게임 속 기관·예산·평가는 창작 설정입니다.</div>
    </main>

    {toast && <div className="toast" role="status"><Icon name="help" size={18} />{toast}</div>}
    {modal === 'welcome' && <Modal title="어서 오세요, 센터장님." onClose={dismissWelcome} wide><div className="welcome-layout"><div className="welcome-portrait"><img src="/center/jiseon-portrait.png" alt="반갑게 맞이하는 운영팀장 오지선" /><span>오지선 · 운영팀장</span></div><div className="welcome-copy"><span className="eyebrow">오늘부터, 우리 센터의 첫 페이지</span><h3>작은 계획으로<br />활기찬 동네를 만들어요.</h3><p>물품을 조달하고, 한 주를 계획하고.<br />주민들이 찾아오는 모습을 지켜보세요.</p><div className="starter-options"><button onClick={() => { dismissWelcome(); setRoom('A'); setShopFilter('E01'); setModal('shop') }}><Icon name="brush" size={24} /><span>손으로 만드는 즐거움<small>공예 교실부터 · 물품 90점</small></span><Icon name="arrow" size={16} /></button><button onClick={() => { dismissWelcome(); setRoom('B'); setShopFilter('E02'); setModal('shop') }}><Icon name="sport" size={24} /><span>함께 움직이는 일상<small>생활체육부터 · 물품 60점</small></span><Icon name="arrow" size={16} /></button></div><button className="text-button" onClick={dismissWelcome}>기본 가구로 먼저 시작할게요 <Icon name="arrow" size={13} /></button></div></div></Modal>}

    {modal === 'shop' && <Modal title="나라장터 · 물품 조달" onClose={() => setModal(null)} wide className="procurement-modal"><ProcurementDesk game={game} room={room} onRoomChange={setRoom} onBuy={buy} onClose={() => setModal(null)} initialFilter={shopFilter} /></Modal>}

    {modal === 'rivals' && <Modal title="각자의 방식으로, 함께 성장 중" onClose={() => setModal(null)} wide><div className="rivals-layout"><div className="ranking-list"><div className="ranking-label"><span>{game.year}년 차 공개 성적</span><span>종합 점수</span></div>{standings.map((inst, index) => <button key={inst.id} className={`ranking-row ${inst.id === game.player.id ? 'is-player' : ''} ${rival.id === inst.id ? 'viewing' : ''}`} onClick={() => { if (inst.id !== game.player.id) setRivalId(inst.id) }}><span className="rank-number">{index + 1}</span><span className="rank-avatar"><Icon name={inst.id === game.player.id ? 'home' : ['leaf', 'music', 'sport', 'brush', 'bolt'][index % 5]!} size={19} /></span><span className="rank-name">{inst.name}<small>{inst.id === game.player.id ? '우리 센터' : inst.archetype}</small></span><b>{inst.history.length ? (game.phase === 'ending' ? finalScore(inst) : inst.score).toFixed(1) : '—'}</b></button>)}</div><div className="rival-profile"><div className="rival-building"><Icon name="home" size={82} /><span>{rival.name}</span></div><span className="pill">운영 스타일</span><h3>{rival.archetype}</h3><p>최근 투자<br /><b>{rival.lastPurchase || '첫 계획을 준비하고 있어요'}</b></p><div className="rival-programs">{[...new Set(Object.values(rival.plan).flat().filter(Boolean))].slice(0, 3).map((id) => <span key={id}>{PROGRAMS.find((p) => p.id === id)?.shortName}</span>)}</div><div className="rival-metrics"><span>주민 신뢰<b>{Math.round(rival.trust)}</b></span><span>개방한 공간<b>{rival.rooms.filter((r) => r.open).length}</b></span><span>보유 장비<b>{rival.inventory.length}</b></span></div><small>같은 예산과 운영 규칙으로 매주 계산되는 기관입니다.</small></div></div></Modal>}

    {modal === 'review' && game.lastReport && <Modal title={game.phase === 'ending' ? '센터장님과 함께한 다섯 해' : `${game.lastReport.year}년 차 ${SEASONS[game.lastReport.season]}, 이렇게 달라졌어요`} onClose={() => setModal(null)} wide><div className="review-hero"><span className="review-medal"><Icon name={game.lastReport.annual ? 'trophy' : 'leaf'} size={44} /></span><div><span className="eyebrow">{game.lastReport.annual ? '연말 경영평가' : '이번 계절의 기록'}</span><h3>{game.lastReport.highlights[0] || '우리 센터에 새로운 하루가 쌓였어요.'}</h3><p>{game.lastReport.warnings[0] || '다음 계절에는 어떤 일상을 만들어 볼까요?'}</p></div></div><div className="review-stats"><div><Icon name="people" /><span>이번 계절 이용</span><strong>{money(game.lastReport.visits)}<small>회</small></strong></div><div><Icon name="coin" /><span>영업 잔액</span><strong>{game.lastReport.profit >= 0 ? '+' : ''}{money(game.lastReport.profit)}<small>점</small></strong></div><div><Icon name="trophy" /><span>{game.lastReport.annual ? '올해의 순위' : '현재 성적'}</span><strong>{game.phase === 'ending' ? finalRank : game.lastReport.rank}<small>/ 11곳</small></strong></div></div><div className="review-scores">{[['주민 요청 충족', game.lastReport.publicScore], ['이용 경험', game.lastReport.experienceScore], ['종합 평가', game.phase === 'ending' ? finalScore(game.player) : game.lastReport.score]].map(([label, score]) => <div key={label}><span>{label}</span><div><i style={{ width: `${Math.max(0, Math.min(100, Number(score)))}%` }} /></div><b>{Number(score).toFixed(0)}</b></div>)}</div><div className="review-finance"><span>수입 {money(game.lastReport.revenue)}점</span><span>운영 지출 {money(game.lastReport.cost)}점</span><span>현재 가용예산 {money(freeCash(game.player))}점</span></div>{game.phase === 'ending' ? <div className="ending-copy"><h3>{finalRank === 1 && game.lastReport.publicScore >= 50 && game.lastReport.experienceScore >= 50 ? '대통령상 · 우리 동네의 자랑' : '우리 동네의 소중한 문화체육센터'}</h3><p>가상의 게임 포상입니다. 주민들과 만든 공간과 이야기는 계속 남습니다.</p><button className="primary-button" onClick={() => setModal('reset')}>새로운 방식으로 다시 시작</button></div> : <div className="review-actions"><button className="secondary-button" onClick={() => setModal('rivals')}>다른 센터 살펴보기</button><button className="primary-button" onClick={continueGame}>{turn >= 20 ? '5년의 기록 완성하기' : game.lastReport.annual ? '새해를 맞이하기' : '다음 계절 계획하기'}<Icon name="arrow" size={16} /></button></div>}</Modal>}

    {modal === 'demand' && <Modal title="이런 활동을 기다리고 있어요" onClose={() => setModal(null)} wide><p className="demand-intro">한 그룹은 한 주에 한 번 방문해요. 원하는 시간과 요금을 맞춰 보세요.</p><div className="demand-list">{demand.map((group) => <div key={group.id}><span className="demand-icon"><Icon name={PROGRAM_ICONS[group.programs[0]!] || 'people'} size={22} /></span><div><strong>{group.title}</strong><small>{group.slots.map((slot) => BLOCKS[slot]).join(' · ')}</small></div><span>{group.people}명<small>{group.maxFee === 0 ? '무료 이용 희망' : ['P05','P08','P10'].includes(group.programs[0]!) ? `그룹 ${group.maxFee}점까지` : `1인 ${group.maxFee}점까지`}</small></span></div>)}</div></Modal>}

    {modal === 'help' && <Modal title="센터장님의 작은 안내서" onClose={() => setModal(null)}><div className="help-steps"><p><b>1. 방을 고르고</b><span>필요한 물품을 들여 새로운 활동을 열어요.</span></p><p><b>2. 한 주를 편성하고</b><span>활동을 누른 뒤 시간 칸을 누르세요. 끌어 놓아도 돼요.</span></p><p><b>3. 운영하고, 다음을 계획해요</b><span>수입과 주민 이용을 살펴보고 다음 계절을 바꿔 보세요.</span></p></div><p className="help-note">평일 준비 지원은 2, 주말은 1입니다. 방의 용도를 바꾸면 준비가 더 필요해요. 구매 후 설치가 첫 주의 활동 시간을 사용합니다. 예산·평가·기관은 게임용 설정입니다.</p><label className="setting-line"><span>움직임 줄이기</span><input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} /></label><label className="setting-line"><span>음악과 효과음 <small>초기 합성 스케치</small></span><input type="checkbox" checked={music} onChange={(e) => { updateMusic(e.target.checked); setMusic(e.target.checked) }} /></label><button className="danger-text" onClick={() => setModal('reset')}><Icon name="reset" size={15} />저장한 게임을 새로 시작</button></Modal>}
    {modal === 'reset' && <Modal title="새 센터장으로 다시 시작할까요?" onClose={() => setModal(null)}><p className="reset-copy">이 브라우저의 현재 진행 기록이 새 게임으로 바뀝니다.</p><div className="review-actions"><button className="secondary-button" onClick={() => setModal(null)}>현재 게임 계속하기</button><button className="primary-button" onClick={() => { setGame(createGame()); setRoom('A'); setSelected('P05'); setPlaying(false); setModal('welcome'); setSpeaker('jiseon'); setDialogue('새로운 센터의 첫 페이지를 열어 볼까요?') }}>새로 시작하기</button></div></Modal>}
  </div>
}
