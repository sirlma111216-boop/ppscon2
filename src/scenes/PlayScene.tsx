// 임무 진행 화면: 계획(요구·비교·일정) → 실행(공급·설치·관찰) → 이용 확인.
// 단계마다 별도 컴포넌트로 마운트해, 화면 안의 임시 상태(초점·미리보기)가 다음 단계로 새지 않는다.
import { useEffect, useRef, useState } from 'react'
import type { Dispatch, ReactNode } from 'react'
import { audio } from '../audio/AudioManager'
import type { AmbienceId } from '../audio/AudioManager'
import { BG } from '../assets/images'
import { getMomentLabels, getScene } from '../assets/scenes'
import type { Moment, SceneRequest } from '../assets/scenes'
import { FacilityStage } from '../components/FacilityStage'
import { KioskScreen } from '../components/KioskScreen'
import { CompareDialog, RequirementPanel } from '../components/RequirementPanel'
import { ScheduleBoard } from '../components/ScheduleBoard'
import { TownMap } from '../components/TownMap'
import type { TownSpot } from '../components/TownMap'
import { getRequirement, getSelectedOption, getTotalCost, isEligible, slotLabel, validatePlan } from '../game/engine'
import { FACILITY_NAMES, getMission } from '../game/missions'
import type { GameAction } from '../game/reducer'
import { describeStep, getSettledView } from '../game/text'
import type { ExecStep, FacilityId, GameState, Mission, MissionRun } from '../game/types'

type ViewProps = {
  state: GameState
  run: MissionRun
  dispatch: Dispatch<GameAction>
  reducedMotion: boolean
  onOpenSettings: () => void
}

const AMBIENCE: Record<FacilityId, AmbienceId> = {
  library: 'ambience.library',
  school: 'ambience.school',
  community: 'ambience.community',
  park: 'ambience.park',
}

const ALL_FACILITIES: FacilityId[] = ['library', 'school', 'community', 'park']

// ── 공통 틀 ────────────────────────────────────────────────

function TopBar({ mission, cost, status, statusTone, onOpenSettings, action }: {
  mission: Mission
  cost: number
  status: string
  statusTone: 'warn' | 'ok' | 'info'
  onOpenSettings: () => void
  /** 상태 문장 옆의 주행동 버튼 */
  action?: ReactNode
}) {
  const over = cost - mission.budget
  return (
    <header className="topbar">
      <div className="topbar-mission">
        <p className="eyebrow">임무 {mission.number}</p>
        <h1>{mission.title}</h1>
      </div>
      <div className={`budget${over > 0 ? ' is-over' : ''}`}>
        <p className="budget-label">
          예산 <strong>{cost}</strong> / {mission.budget}점
        </p>
        <div className="budget-meter" role="img" aria-label={`예산 ${mission.budget}점 가운데 ${cost}점 사용`}>
          <span style={{ width: `${Math.min(100, (cost / mission.budget) * 100)}%` }} />
        </div>
        <p className="budget-rest">
          {over > 0 ? (
            <>
              <span aria-hidden="true">⚠</span> {over}점 초과
            </>
          ) : (
            `${mission.budget - cost}점 남음`
          )}
        </p>
      </div>
      <p id="plan-status" className={`topbar-status tone-${statusTone}`} role="status">
        <span aria-hidden="true">{statusTone === 'warn' ? '⚠' : statusTone === 'ok' ? '✓' : '›'}</span> {status}
      </p>
      <div className="topbar-buttons">
        {action}
        <button type="button" className="btn btn-ghost topbar-settings" onClick={onOpenSettings}>
          설정
        </button>
      </div>
    </header>
  )
}

function MomentToggle({ labels, moment, onChange }: { labels: { a: string; b: string }; moment: Moment; onChange: (moment: Moment) => void }) {
  return (
    <div className="moment-toggle stage-moments" role="group" aria-label="장면 전환">
      <button type="button" aria-pressed={moment === 'a'} onClick={() => onChange('a')}>
        {labels.a}
      </button>
      <button type="button" aria-pressed={moment === 'b'} onClick={() => onChange('b')}>
        {labels.b}
      </button>
    </div>
  )
}

function buildSpots(state: GameState, mission: Mission, run: MissionRun): TownSpot[] {
  return ALL_FACILITIES.map((facility) => {
    const requirement = mission.requirements.find((item) => item.facilityId === facility)
    const settled = getSettledView(state, facility)
    const spot: TownSpot = { facility, inUse: settled.visual !== null }
    if (facility === 'park') {
      spot.sign = Boolean(state.results.M2) && mission.id !== 'M2'
      spot.canopy = Boolean(state.results.M3) && mission.id !== 'M3'
    }
    if (requirement) {
      const option = getSelectedOption(mission, run.plan, requirement.id)
      const placed = run.plan.starts[requirement.id] !== null
      const eligible = option ? isEligible(requirement, option) : false
      spot.request = {
        title: requirement.title,
        status: !option ? '요청 보기' : !eligible ? '조건 다시 보기' : placed ? '계획에 넣음' : '일정에 놓기',
        done: Boolean(option) && eligible && placed,
      }
      // 이번 임무에서 다시 구매하는 시설은 앞선 구매가 있을 때만 이용 중으로 보인다.
      spot.inUse = settled.visual !== null
    }
    return spot
  })
}

// ── 계획 ───────────────────────────────────────────────────

export function PlanningView({ state, run, dispatch, onOpenSettings }: ViewProps) {
  const mission = getMission(run.missionId)
  const [focus, setFocus] = useState<FacilityId | null>(null)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [moment, setMoment] = useState<Moment>('b')
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [compareFor, setCompareFor] = useState<string | null>(null)
  const momentTimer = useRef<number | null>(null)
  const revealed = useRef(new Set<string>())

  const issues = validatePlan(mission, run.plan)
  const cost = getTotalCost(mission, run.plan)
  const valid = issues.length === 0
  const requirement = focus ? mission.requirements.find((item) => item.facilityId === focus) ?? null : null
  const selected = requirement ? getSelectedOption(mission, run.plan, requirement.id) : null
  const previewOption = requirement && previewId && mission.options[previewId]?.requirementId === requirement.id ? mission.options[previewId] : null
  const shown = previewOption ?? selected

  useEffect(() => {
    audio.setAmbience(focus ? AMBIENCE[focus] : null)
  }, [focus])

  useEffect(
    () => () => {
      if (momentTimer.current !== null) window.clearTimeout(momentTimer.current)
    },
    [],
  )

  /** 장면을 처음 상태에서 바뀐 상태로 한 번 재생한다. */
  const playMoments = () => {
    if (momentTimer.current !== null) window.clearTimeout(momentTimer.current)
    setMoment('a')
    momentTimer.current = window.setTimeout(() => setMoment('b'), 1100)
  }

  const openFacility = (facility: FacilityId | null) => {
    if (momentTimer.current !== null) window.clearTimeout(momentTimer.current)
    setFocus(facility)
    setPreviewId(null)
    setMoment('b')
    if (facility && !revealed.current.has(facility) && mission.requirements.some((item) => item.facilityId === facility)) {
      revealed.current.add(facility)
      audio.playSfx('need.reveal')
    } else {
      audio.playSfx(facility ? 'ui.select' : 'ui.cancel')
    }
  }

  // 무대에 올릴 장면
  let sceneRequest: SceneRequest | null = null
  let caption = ''
  let momentLabels = { a: '', b: '' }
  if (focus && requirement) {
    sceneRequest = { facility: focus, missionId: mission.id, visual: shown?.visual ?? null, moment }
    momentLabels = getMomentLabels(focus, mission.id)
    caption = previewOption
      ? `${previewOption.name}: ${previewOption.previewText}`
      : selected
        ? `선택한 안 — ${selected.name}: ${selected.previewText}`
        : `지금 모습 — “${requirement.needText}”`
  } else if (focus) {
    const view = getSettledView(state, focus)
    sceneRequest = { facility: focus, missionId: view.missionId, visual: view.visual, moment, improved: view.improved }
    momentLabels = getMomentLabels(focus, view.missionId)
    caption = view.note
  }

  const firstIssue = issues[0]
  const status = valid
    ? '필요한 기능이 준비됐어요. ‘이 계획으로 진행’을 눌러 사람들이 어떻게 쓰는지 확인해 볼까요?'
    : `${firstIssue.message}${issues.length > 1 ? ` (남은 것 ${issues.length}가지)` : ''}`
  const untouched = mission.requirements.every((item) => !run.plan.selections[item.id])

  // 화면 폭에 따라 상단 바와 일정 아래 가운데 한 곳에만 보이는 같은 버튼
  const confirmButton = (className: string) => (
    <button
      type="button"
      className={`btn btn-primary ${className}`}
      aria-disabled={!valid}
      aria-describedby={valid ? undefined : 'plan-status'}
      onClick={() => {
        if (!valid) {
          audio.playSfx('inspection.recheck')
          document.getElementById('plan-status')?.scrollIntoView({ block: 'nearest' })
          return
        }
        audio.playSfx('requirement.pin')
        dispatch({ type: 'CONFIRM_PLAN' })
      }}
    >
      이 계획으로 진행
    </button>
  )

  return (
    <div className="play">
      <TopBar
        mission={mission}
        cost={cost}
        status={status}
        statusTone={valid ? 'ok' : 'warn'}
        onOpenSettings={onOpenSettings}
        action={confirmButton('topbar-action')}
      />

      <div className="play-grid">
        <section className={sceneRequest ? 'stage-area is-focused' : 'stage-area'} aria-label="동네 무대">
          {sceneRequest ? (
            <>
              <div className="stage-wrap">
                <FacilityStage scene={getScene(sceneRequest)} label={`${FACILITY_NAMES[sceneRequest.facility]} 장면. ${caption}`} />
                <button type="button" className="btn btn-ghost btn-small stage-back" onClick={() => openFacility(null)}>
                  <span aria-hidden="true">←</span> 동네 지도
                </button>
                <MomentToggle labels={momentLabels} moment={moment} onChange={setMoment} />
              </div>
              <p className="stage-caption" aria-live="polite">
                {caption}
              </p>
            </>
          ) : (
            <>
              <TownMap
                spots={buildSpots(state, mission, run)}
                onSelect={openFacility}
                highlight={mission.number === 1 && untouched ? mission.requirements[0].facilityId : null}
              />
              <p className="stage-caption">요청이 온 시설을 누르면 필요한 조건과 공급안을 볼 수 있어요. 다른 시설도 눌러 살펴볼 수 있습니다.</p>
            </>
          )}
        </section>

        <aside className="side-panel" aria-label="요구와 비교">
          {requirement ? (
            <RequirementPanel
              mission={mission}
              run={run}
              requirement={requirement}
              previewId={previewOption?.id ?? null}
              onBack={() => openFacility(null)}
              onPreview={(optionId) => {
                setPreviewId(optionId)
                playMoments()
                audio.playSfx('card.open')
                dispatch({ type: 'PREVIEW_OPTION', requirementId: requirement.id, optionId })
              }}
              onSelect={(optionId) => {
                dispatch({ type: 'SELECT_OPTION', requirementId: requirement.id, optionId })
                if (!optionId) {
                  audio.playSfx('ui.cancel')
                  setActiveJobId(null)
                  return
                }
                const ok = isEligible(requirement, mission.options[optionId])
                audio.playSfx(ok ? 'selection.confirm' : 'inspection.recheck')
                setPreviewId(optionId)
                setMoment('b')
                // 고른 안의 설치 작업을 바로 집어, 다음에 누르는 칸에 놓이게 한다.
                setActiveJobId(ok ? requirement.id : null)
              }}
              onOpenCompare={() => {
                setCompareFor(requirement.id)
                audio.playSfx('compare.open')
                dispatch({ type: 'OPEN_COMPARE', requirementId: requirement.id })
              }}
            />
          ) : focus ? (
            <div className="panel-body">
              <button type="button" className="link-button" onClick={() => openFacility(null)}>
                <span aria-hidden="true">←</span> 동네 지도로
              </button>
              <h2 className="panel-title">{FACILITY_NAMES[focus]}</h2>
              <p>{caption}</p>
              <p className="panel-hint">이번 임무에는 이 시설의 요청이 없어요. 예산과 일정은 임무마다 따로이며 다음 임무로 넘어가지 않습니다.</p>
            </div>
          ) : (
            <div className="panel-body">
              <h2 className="panel-title">이번 임무의 요청 두 가지</h2>
              <p>{mission.goalText}</p>
              <ul className="request-list">
                {mission.requirements.map((item) => {
                  const option = getSelectedOption(mission, run.plan, item.id)
                  return (
                    <li key={item.id}>
                      <button type="button" className="request-card" onClick={() => openFacility(item.facilityId)}>
                        <strong>
                          {FACILITY_NAMES[item.facilityId]} · {item.title}
                        </strong>
                        <span>“{item.needText}”</span>
                        <em>
                          {item.deadlineText} · {option ? `선택: ${option.name}` : '공급안 고르기 전'}
                        </em>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <ol className="howto">
                <li>요청을 열어 꼭 필요한 조건 두 가지를 읽어요.</li>
                <li>공급안의 사용 미리보기를 열어 조건에 맞는지 비교해요.</li>
                <li>고른 안의 설치를 아래 준비 일정 6칸에 놓아요.</li>
              </ol>
              <p className="fine-print">조달지원 담당인 여러분은 기관의 필요에 맞는 공급안을 비교해 계획을 돕습니다. 납품과 설치는 공급자가, 사용 확인은 기관이 합니다.</p>
            </div>
          )}
        </aside>

        <section className="schedule-area" aria-label="준비 일정">
          <div className="schedule-head">
            <h2>준비 일정</h2>
            <p className="fine-print">3일 × 오전·오후. 한 칸에는 설치·설정 작업을 하나만 놓을 수 있어요. 준비 과정을 단순화한 가상 시간입니다.</p>
          </div>
          <ScheduleBoard
            mission={mission}
            plan={run.plan}
            activeJobId={activeJobId}
            onActivate={(jobId) => {
              setActiveJobId(jobId)
              if (jobId) audio.playSfx('ui.select')
            }}
            onPlace={(jobId, start) => {
              dispatch({ type: 'PLACE_JOB', jobId, start })
              if (start === null) {
                audio.playSfx('ui.cancel')
                return
              }
              const trial = { selections: run.plan.selections, starts: { ...run.plan.starts, [jobId]: start } }
              const clash = validatePlan(mission, trial).some((issue) => issue.jobId === jobId || issue.jobIds?.includes(jobId))
              audio.playSfx(clash ? 'inspection.recheck' : 'offer.place')
            }}
          />
          <div className="confirm-box">
            {!valid && (
              <ul className="issue-list" aria-label="확정 전에 남은 것">
                {issues.slice(0, 3).map((issue, index) => (
                  <li key={`${issue.code}-${index}`}>
                    <span aria-hidden="true">⚠</span> {issue.message}
                  </li>
                ))}
                {issues.length > 3 && <li className="is-more">그 밖에 {issues.length - 3}가지가 더 남았어요.</li>}
              </ul>
            )}
            {confirmButton('btn-large')}
          </div>
        </section>
      </div>

      {compareFor && (
        <CompareDialog
          mission={mission}
          requirement={getRequirement(mission, compareFor)}
          onClose={() => {
            audio.playSfx('card.close')
            setCompareFor(null)
          }}
        />
      )}
    </div>
  )
}

// ── 실행: 공급 → 설치 → 기관 확인 (+ 임무 2의 관찰·개선) ───

const STEP_KIND_LABEL: Record<ExecStep['kind'], string> = {
  arrive: '납품',
  install: '설치·설정',
  installed: '기관 확인',
  observe: '사용 관찰',
  recheck: '개선·재확인',
}

function stepScene(mission: Mission, run: MissionRun, step: ExecStep): SceneRequest {
  const requirement = getRequirement(mission, step.requirementId)
  const option = getSelectedOption(mission, run.plan, step.requirementId)
  const stage: SceneRequest['stage'] =
    step.kind === 'arrive' ? 'arrive' : step.kind === 'install' ? 'install' : step.kind === 'installed' ? 'installed' : step.kind === 'observe' ? 'observe' : 'improve'
  return { facility: requirement.facilityId, missionId: mission.id, visual: option?.visual ?? null, moment: 'a', stage }
}

export function ExecutionView({ run, dispatch, reducedMotion, onOpenSettings }: ViewProps) {
  const mission = getMission(run.missionId)
  const cost = getTotalCost(mission, run.plan)
  const observing = run.phase === 'observing'
  const step = run.timeline[Math.min(run.stepIndex, run.timeline.length - 1)]
  const currentRef = useRef<HTMLLIElement>(null)
  const observationRef = useRef<HTMLHeadingElement>(null)

  // 한 단계씩 정해진 순서로 진행한다. 결과는 확정 때 이미 정해져 있고, 여기서는 보여 주기만 한다.
  useEffect(() => {
    if (run.phase !== 'executing') return
    const current = run.timeline[run.stepIndex]
    const duration = (current?.kind === 'recheck' ? 2600 : 1700) * (reducedMotion ? 0.6 : 1)
    const timer = window.setTimeout(() => dispatch({ type: 'EXEC_ADVANCE' }), duration)
    return () => window.clearTimeout(timer)
  }, [run.phase, run.stepIndex, run.timeline, reducedMotion, dispatch])

  useEffect(() => {
    const current = run.timeline[run.stepIndex]
    if (!current) return
    if (run.phase === 'observing') audio.playSfx('user.feedback')
    else if (current.kind === 'arrive') audio.playSfx('box.open')
    else if (current.kind === 'install' && current.part === 1) audio.playSfx('furniture.deploy')
    else if (current.kind === 'installed') audio.playSfx('inspection.pass')
    else if (current.kind === 'recheck') audio.playSfx('pilot.improve')
    audio.setAmbience(AMBIENCE[getRequirement(mission, current.requirementId).facilityId])
    // 지금 단계가 보이도록 옆 패널 안에서만 스크롤한다(페이지 전체는 움직이지 않는다).
    const item = currentRef.current
    const panel = item?.closest('.side-panel')
    if (item && panel) {
      const itemRect = item.getBoundingClientRect()
      const panelRect = panel.getBoundingClientRect()
      if (itemRect.bottom > panelRect.bottom || itemRect.top < panelRect.top) {
        panel.scrollTop += itemRect.top - panelRect.top - panel.clientHeight / 3
      }
    }
  }, [run.phase, run.stepIndex, run.timeline, mission])

  useEffect(() => {
    if (observing) observationRef.current?.focus({ preventScroll: true })
  }, [observing])

  const text = describeStep(mission, run.plan, step)
  const spec = run.observation ? mission.observations?.[run.observation.optionId] : undefined
  const option = getSelectedOption(mission, run.plan, step.requirementId)
  const status = observing ? '실제 사용을 관찰했어요. 무엇을 고칠지 골라 주세요.' : `${slotLabel(step.slot)} · ${text.actor}: ${text.text}`

  return (
    <div className="play">
      <TopBar mission={mission} cost={cost} status={status} statusTone="info" onOpenSettings={onOpenSettings} />
      <div className="play-grid">
        <section className="stage-area" aria-label="현장">
          <p className="stage-heading">
            {FACILITY_NAMES[getRequirement(mission, step.requirementId).facilityId]} · {observing ? '첫 사용 관찰' : STEP_KIND_LABEL[step.kind]}
          </p>
          <div className="stage-wrap">
            <FacilityStage scene={getScene(stepScene(mission, run, step))} label={status} />
          </div>
          <p className="stage-caption" aria-live="polite">
            {observing && spec ? spec.observationText : text.text}
          </p>
        </section>

        <aside className="side-panel" aria-label={observing ? '관찰과 개선' : '진행 상태'}>
          {observing && spec && option ? (
            <div className="panel-body">
              <p className="eyebrow">첫 구매 · 시범 사용</p>
              <h2 ref={observationRef} tabIndex={-1} className="panel-title">
                써 보니 이런 모습이 보여요
              </h2>
              <p>{spec.observationText}</p>
              <KioskScreen visual={option.visual} improved={false} caption="지금의 첫 화면" />
              <fieldset className="choice-group">
                <legend>공급자에게 무엇을 고쳐 달라고 할까요?</legend>
                {spec.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    className="btn btn-ink btn-block"
                    onClick={() => {
                      audio.playSfx(choice.valid ? 'pilot.improve' : 'inspection.recheck')
                      dispatch({ type: 'CHOOSE_IMPROVEMENT', choiceId: choice.id })
                    }}
                  >
                    {choice.label}
                  </button>
                ))}
              </fieldset>
              {run.observation && run.observation.wrongAttempts > 0 && (
                <p className="notice notice-warn" role="status">
                  <span aria-hidden="true">⚠</span> 지금 관찰한 불편이 무엇인지 다시 확인해 보세요. {spec.problemText}
                </p>
              )}
              <p className="fine-print">
                시간 제한이 없어요. 다시 골라도 예산·일정·점수는 달라지지 않습니다. 기본 조건을 갖춘 도구의 사용 경험을 다듬는 단계예요.
              </p>
            </div>
          ) : (
            <div className="panel-body progress-panel" style={{ backgroundImage: `url(${BG.progress})` }}>
              <h2 className="panel-title">공급과 설치</h2>
              <p className="panel-hint">확정한 계획을 순서대로 실행합니다. 납품·설치는 공급자가, 확인은 기관이 해요.</p>
              <ol className="step-list">
                {run.timeline.map((item, index) => {
                  const done = index < run.stepIndex
                  const now = index === run.stepIndex
                  const described = done || now ? describeStep(mission, run.plan, item) : null
                  return (
                    <li key={index} ref={now ? currentRef : undefined} className={done ? 'is-done' : now ? 'is-now' : 'is-next'} aria-current={now ? 'step' : undefined}>
                      <span className="step-slot">{slotLabel(item.slot)}</span>
                      <span className="step-text">
                        <strong>{described ? described.actor : STEP_KIND_LABEL[item.kind]}</strong>
                        <span>{described ? described.text : `${FACILITY_NAMES[getRequirement(mission, item.requirementId).facilityId]} · 예정`}</span>
                      </span>
                      <span className="step-mark" aria-hidden="true">
                        {done ? '✓' : now ? '●' : '○'}
                      </span>
                    </li>
                  )
                })}
              </ol>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  audio.playSfx('ui.select')
                  dispatch({ type: 'EXEC_SKIP' })
                }}
              >
                연출 건너뛰기
              </button>
              <p className="fine-print">건너뛰어도 결과는 같고, 사용 확인은 그대로 남아 있어요.</p>
            </div>
          )}
        </aside>

        <section className="schedule-area" aria-label="확정한 준비 일정">
          <div className="schedule-head">
            <h2>확정한 준비 일정</h2>
          </div>
          <ScheduleBoard mission={mission} plan={run.plan} activeJobId={null} onActivate={() => {}} onPlace={() => {}} readOnly currentSlot={step.slot} />
        </section>
      </div>
    </div>
  )
}

// ── 이용 확인 ──────────────────────────────────────────────

export function UsageView({ run, dispatch, onOpenSettings }: ViewProps) {
  const mission = getMission(run.missionId)
  const cost = getTotalCost(mission, run.plan)
  const pending = mission.requirements.filter((item) => !run.usageConfirmed.includes(item.id))
  const requirement = pending[0] ?? mission.requirements[mission.requirements.length - 1]
  const index = mission.requirements.indexOf(requirement)
  const option = getSelectedOption(mission, run.plan, requirement.id)
  const [moment, setMoment] = useState<Moment>('a')
  const headingRef = useRef<HTMLHeadingElement>(null)
  const spec = option ? mission.observations?.[option.id] : undefined
  const improved = Boolean(requirement.followUp)
  const facilityName = FACILITY_NAMES[requirement.facilityId]
  const labels = getMomentLabels(requirement.facilityId, mission.id)

  useEffect(() => {
    setMoment('a')
    const timer = window.setTimeout(() => setMoment('b'), 1200)
    audio.setAmbience(AMBIENCE[requirement.facilityId])
    audio.playSfx('facility.activate')
    headingRef.current?.focus({ preventScroll: true })
    return () => window.clearTimeout(timer)
  }, [requirement.id, requirement.facilityId])

  if (!option) return null
  const next = pending[1]
  const scene = getScene({ facility: requirement.facilityId, missionId: mission.id, visual: option.visual, moment, improved })
  let detail: ReactNode = null
  if (spec && improved) {
    detail = (
      <>
        <div className="kiosk-pair">
          <KioskScreen visual={option.visual} improved={false} caption="고치기 전" />
          <KioskScreen visual={option.visual} improved caption="고친 뒤" />
        </div>
        <p>{spec.recheckText}</p>
      </>
    )
  }

  return (
    <div className="play">
      <TopBar
        mission={mission}
        cost={cost}
        status={`설치를 마쳤어요. ${facilityName}에서 실제로 어떻게 쓰이는지 확인해 보세요.`}
        statusTone="ok"
        onOpenSettings={onOpenSettings}
      />
      <div className="play-grid is-usage">
        <section className="stage-area" aria-label="이용 장면">
          <p className="stage-heading">
            {facilityName} · 이용 모습 ({index + 1}/{mission.requirements.length})
          </p>
          <div className="stage-wrap">
            <FacilityStage scene={scene} label={`${facilityName} 이용 장면. ${option.previewText}`} />
            <MomentToggle labels={labels} moment={moment} onChange={setMoment} />
          </div>
          <p className="stage-caption" aria-live="polite">
            {moment === 'a' ? labels.a : labels.b} — {option.previewText}
          </p>
        </section>

        <aside className="side-panel" aria-label="이용 확인">
          <div className="panel-body">
            <p className="eyebrow">
              이용 확인 {index + 1} / {mission.requirements.length}
            </p>
            <h2 ref={headingRef} tabIndex={-1} className="panel-title">
              {facilityName}에서 이렇게 쓰여요
            </h2>
            <p>{option.previewText}</p>
            {detail}
            <p className="notice notice-ok">
              <span aria-hidden="true">✓</span> {option.rationaleText}
            </p>
            <p className="fine-print">
              {option.name} · {facilityName}의 요청 “{requirement.needText}”
            </p>
            <button
              type="button"
              className="btn btn-primary btn-large btn-block"
              onClick={() => {
                audio.playSfx('ui.select')
                dispatch({ type: 'CONFIRM_USAGE', requirementId: requirement.id })
                if (!next) dispatch({ type: 'FINISH_MISSION' })
              }}
            >
              {next ? `다음: ${FACILITY_NAMES[next.facilityId]} 이용 모습` : '결과 보기'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
