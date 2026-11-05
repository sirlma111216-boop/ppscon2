// 3일 × 오전·오후 = 6칸의 준비 일정. 작업을 고른 뒤 칸을 누르면 놓이고, 끌어다 놓기는 보조 조작이다.
import { useState } from 'react'
import { getJobs, getOccupiedSlots, getPlacementIssue, slotLabel, validatePlan } from '../game/engine'
import { FACILITY_NAMES, SLOT_COUNT } from '../game/missions'
import type { IssueCode, Mission, Plan, PlannedJob } from '../game/types'

type Props = {
  mission: Mission
  plan: Plan
  activeJobId: string | null
  onActivate: (jobId: string | null) => void
  onPlace: (jobId: string, start: number | null) => void
  /** 실행 중에는 읽기 전용이며 지금 칸만 표시한다 */
  readOnly?: boolean
  currentSlot?: number | null
}

const SLOT_TAGS: Partial<Record<IssueCode, string>> = {
  slot_conflict: '겹침',
  before_ready: '도착 전',
  past_deadline: '마감 뒤',
  recheck_order: '관찰 전',
  recheck_past_deadline: '마감 뒤',
}

const DAYS = [
  { label: '1일차', slots: [1, 2] },
  { label: '2일차', slots: [3, 4] },
  { label: '3일차', slots: [5, 6] },
]

function shortLabel(job: PlannedJob): string {
  return `${FACILITY_NAMES[job.facilityId]} ${job.kind === 'recheck' ? '개선·재확인' : '설치'}`
}

function placedText(job: PlannedJob): string {
  if (job.startSlot === null) return '놓기 전'
  const end = job.startSlot + job.duration - 1
  return job.duration === 1 ? slotLabel(job.startSlot) : `${slotLabel(job.startSlot)} ~ ${slotLabel(end)}`
}

export function ScheduleBoard({ mission, plan, activeJobId, onActivate, onPlace, readOnly = false, currentSlot = null }: Props) {
  const [hintSlot, setHintSlot] = useState<number | null>(null)
  const jobs = getJobs(mission, plan)
  const activeJob = readOnly ? undefined : jobs.find((job) => job.id === activeJobId)
  const issues = validatePlan(mission, plan)
  const unselected = mission.requirements.filter((requirement) => !plan.selections[requirement.id])

  const tagsBySlot = new Map<number, string[]>()
  for (const issue of issues) {
    const tag = SLOT_TAGS[issue.code]
    if (!tag || !issue.slots) continue
    for (const slot of issue.slots) tagsBySlot.set(slot, [...new Set([...(tagsBySlot.get(slot) ?? []), tag])])
  }

  const fits = (job: PlannedJob, slot: number) => slot + job.duration - 1 <= SLOT_COUNT
  const place = (jobId: string, slot: number) => {
    const job = jobs.find((item) => item.id === jobId)
    if (!job || !fits(job, slot)) {
      setHintSlot(slot)
      return
    }
    onPlace(jobId, slot)
    onActivate(null)
    setHintSlot(null)
  }

  const hintText = (() => {
    if (!activeJob) return null
    if (hintSlot === null) return `‘${shortLabel(activeJob)}’을 시작할 칸을 눌러 주세요. ${activeJob.duration}칸을 이어서 씁니다.`
    if (!fits(activeJob, hintSlot)) return `${slotLabel(hintSlot)}: ${activeJob.duration}칸이 ${slotLabel(SLOT_COUNT)} 안에 들어가지 않아요.`
    const problem = getPlacementIssue(mission, plan, activeJob.id, hintSlot)
    return `${slotLabel(hintSlot)}: ${problem ?? '여기서 시작할 수 있어요.'}`
  })()

  return (
    <div className={`schedule${readOnly ? ' is-readonly' : ''}`}>
      {!readOnly && (
        <div className="job-tray" role="group" aria-label="놓을 작업">
          {jobs.map((job) => (
            <div key={job.id} className={`job-chip-wrap${job.startSlot !== null ? ' is-placed' : ''}`}>
              <button
                type="button"
                className={`job-chip job-${job.facilityId}${job.kind === 'recheck' ? ' is-recheck' : ''}`}
                aria-pressed={activeJobId === job.id}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData('text/plain', job.id)
                  event.dataTransfer.effectAllowed = 'move'
                  onActivate(job.id)
                }}
                onClick={() => {
                  onActivate(activeJobId === job.id ? null : job.id)
                  setHintSlot(null)
                }}
              >
                <strong>
                  {shortLabel(job)} <em>{placedText(job)}</em>
                </strong>
                <span>
                  {job.duration}칸 · {job.readySlot !== null && job.readySlot <= SLOT_COUNT ? `${slotLabel(job.readySlot)}부터` : '첫 설치 다음 칸부터'} ·{' '}
                  {slotLabel(job.deadline)}까지
                </span>
              </button>
              {job.startSlot !== null && (
                <button type="button" className="btn btn-ghost btn-small" onClick={() => onPlace(job.id, null)} aria-label={`${shortLabel(job)} 일정에서 빼기`}>
                  빼기
                </button>
              )}
            </div>
          ))}
          {unselected.map((requirement) => (
            <p key={requirement.id} className="job-empty">
              {FACILITY_NAMES[requirement.facilityId]} 설치: 공급안을 고르면 여기에 나타나요.
            </p>
          ))}
        </div>
      )}

      <div className="slot-days" role="group" aria-label="준비 일정 6칸">
        {DAYS.map((day) => (
          <div key={day.label} className="slot-day">
            <p className="slot-day-label">{day.label}</p>
            <div className="slot-pair">
              {day.slots.map((slot) => {
                const here = jobs.filter((job) => job.startSlot !== null && getOccupiedSlots(job.startSlot, job.duration).includes(slot))
                const tags = tagsBySlot.get(slot) ?? []
                const deadlines = mission.requirements.flatMap((requirement) => {
                  const facility = FACILITY_NAMES[requirement.facilityId]
                  const marks: string[] = []
                  if (requirement.deadline === slot) marks.push(`${facility} 마감`)
                  if (requirement.followUp?.deadline === slot) marks.push(`재확인 마감`)
                  return marks
                })
                const problem = activeJob && fits(activeJob, slot) ? getPlacementIssue(mission, plan, activeJob.id, slot) : null
                const canStart = Boolean(activeJob) && fits(activeJob as PlannedJob, slot) && !problem
                const classes = [
                  'slot',
                  here.length > 0 ? 'is-filled' : '',
                  tags.length > 0 ? 'has-issue' : '',
                  canStart ? 'can-start' : '',
                  currentSlot === slot ? 'is-now' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                const content = (
                  <>
                    <span className="slot-name">
                      {slot % 2 === 1 ? '오전' : '오후'}
                      {currentSlot === slot && <span className="slot-now"> · 지금</span>}
                    </span>
                    <span className="slot-jobs">
                      {here.map((job) => (
                        <span key={job.id} className={`slot-job job-${job.facilityId}${job.kind === 'recheck' ? ' is-recheck' : ''}`}>
                          {shortLabel(job)}
                          {job.duration > 1 ? ` ${slot - (job.startSlot as number) + 1}/${job.duration}` : ''}
                        </span>
                      ))}
                      {here.length === 0 && canStart && (
                        <span className="slot-start">
                          <span aria-hidden="true">＋</span> 여기서 시작
                        </span>
                      )}
                    </span>
                    {tags.length > 0 && (
                      <span className="slot-tags">
                        <span aria-hidden="true">⚠</span> {tags.join(' · ')}
                      </span>
                    )}
                    {deadlines.map((mark) => (
                      <span key={mark} className="slot-deadline">
                        <span aria-hidden="true">⚑</span> {mark}
                      </span>
                    ))}
                  </>
                )
                if (readOnly) {
                  return (
                    <div key={slot} className={classes} aria-current={currentSlot === slot ? 'step' : undefined}>
                      {content}
                    </div>
                  )
                }
                return (
                  <button
                    key={slot}
                    type="button"
                    className={classes}
                    aria-label={`${slotLabel(slot)}${here.length ? `, ${here.map(shortLabel).join(', ')}` : ', 비어 있음'}${tags.length ? `, 문제: ${tags.join(', ')}` : ''}${
                      activeJob ? `, ${problem ?? (canStart ? '여기서 시작할 수 있어요' : '칸이 모자라요')}` : ''
                    }`}
                    onFocus={() => setHintSlot(slot)}
                    onMouseEnter={() => setHintSlot(slot)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const jobId = event.dataTransfer.getData('text/plain')
                      if (jobId) place(jobId, slot)
                    }}
                    onClick={() => {
                      if (activeJob) place(activeJob.id, slot)
                      else if (here.length > 0) {
                        // 놓인 작업을 눌러 다시 집는다.
                        onActivate(here[0].id)
                        setHintSlot(null)
                      } else setHintSlot(slot)
                    }}
                  >
                    {content}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!readOnly && (
        <p className="schedule-hint" role="status">
          {hintText ?? (jobs.length > 0 ? '작업을 고른 다음 시작할 칸을 눌러 주세요. 끌어다 놓아도 됩니다.' : '공급안을 고르면 설치 작업이 생겨요.')}
        </p>
      )}
    </div>
  )
}
