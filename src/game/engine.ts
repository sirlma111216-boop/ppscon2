// 적합성·비용·일정·결과를 계산하는 순수 함수. 화면 표시와 실행 확정이 같은 함수를 쓴다.
import { FACILITY_NAMES, FEATURE_LABELS, SLOT_COUNT, SLOT_LABELS } from './missions.ts'
import type {
  ExecStep,
  FeatureTag,
  Mission,
  MissionRun,
  Plan,
  PlanIssue,
  PlannedJob,
  Requirement,
  ScoreBreakdown,
  SupplyOption,
} from './types.ts'

// ── 한국어 조사 ─────────────────────────────────────────────

function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xac00 || code > 0xd7a3) return false
  return (code - 0xac00) % 28 !== 0
}

export function withJosa(word: string, pair: '이/가' | '은/는' | '을/를'): string {
  const [withFinal, withoutFinal] = pair.split('/')
  return word + (hasFinalConsonant(word) ? withFinal : withoutFinal)
}

export function slotLabel(slot: number): string {
  return SLOT_LABELS[slot] ?? `${slot}번 칸`
}

// ── 적합성 ─────────────────────────────────────────────────

export type EligibilityIssue = { kind: 'safety' } | { kind: 'feature'; feature: FeatureTag }

export function getRequirement(mission: Mission, requirementId: string): Requirement {
  const requirement = mission.requirements.find((item) => item.id === requirementId)
  if (!requirement) throw new Error(`요구를 찾지 못했습니다: ${requirementId}`)
  return requirement
}

export function getEligibilityIssues(requirement: Requirement, option: SupplyOption): EligibilityIssue[] {
  const issues: EligibilityIssue[] = []
  if (!option.safetyPass) issues.push({ kind: 'safety' })
  for (const feature of requirement.requiredFeatures) {
    if (!option.features.includes(feature)) issues.push({ kind: 'feature', feature })
  }
  return issues
}

export function isEligible(requirement: Requirement, option: SupplyOption): boolean {
  return getEligibilityIssues(requirement, option).length === 0
}

/** 실행 확정 대상이 되는 안. 비교 카드 목록을 거르는 데 쓰지 않는다. */
export function getEligibleOptions(mission: Mission, requirementId: string): SupplyOption[] {
  const requirement = getRequirement(mission, requirementId)
  return requirement.optionIds.map((id) => mission.options[id]).filter((option) => isEligible(requirement, option))
}

export function describeEligibility(requirement: Requirement, option: SupplyOption): string | null {
  const issues = getEligibilityIssues(requirement, option)
  if (issues.length === 0) return null
  if (issues.some((issue) => issue.kind === 'safety')) {
    return '필수 안전확인이 갖춰지지 않아 이 안으로 구매를 확정할 수 없어요. 자료 확인과 비교는 계속할 수 있어요.'
  }
  const labels = issues
    .filter((issue): issue is { kind: 'feature'; feature: FeatureTag } => issue.kind === 'feature')
    .map((issue) => `‘${FEATURE_LABELS[issue.feature].label}’`)
    .join('·')
  return `${withJosa(option.name, '은/는')} ${labels} 조건을 충족하지 못해 확정할 수 없어요. 다른 안의 사용 모습을 비교해 보세요.`
}

// ── 비용 ───────────────────────────────────────────────────

export function getSelectedOption(mission: Mission, plan: Plan, requirementId: string): SupplyOption | null {
  const optionId = plan.selections[requirementId]
  return optionId ? mission.options[optionId] ?? null : null
}

/** 필수 후속 작업 예약비 합계. 선택과 무관하게 처음부터 포함한다. */
export function getReservedCost(mission: Mission): number {
  return mission.requirements.reduce((sum, requirement) => sum + (requirement.followUp?.cost ?? 0), 0)
}

export function getTotalCost(mission: Mission, plan: Plan): number {
  const selected = mission.requirements.reduce(
    (sum, requirement) => sum + (getSelectedOption(mission, plan, requirement.id)?.cost ?? 0),
    0,
  )
  return selected + getReservedCost(mission)
}

// ── 일정 ───────────────────────────────────────────────────

export function getOccupiedSlots(start: number, duration: number): number[] {
  return Array.from({ length: duration }, (_, index) => start + index)
}

export function getJobs(mission: Mission, plan: Plan): PlannedJob[] {
  const jobs: PlannedJob[] = []
  for (const requirement of mission.requirements) {
    const option = getSelectedOption(mission, plan, requirement.id)
    const installStart = plan.starts[requirement.id] ?? null
    if (option) {
      jobs.push({
        id: requirement.id,
        requirementId: requirement.id,
        facilityId: requirement.facilityId,
        kind: 'install',
        label: `${FACILITY_NAMES[requirement.facilityId]} · ${option.name}`,
        startSlot: installStart,
        duration: option.duration,
        readySlot: option.readySlot,
        deadline: requirement.deadline,
      })
    }
    if (requirement.followUp) {
      jobs.push({
        id: requirement.followUp.id,
        requirementId: requirement.id,
        facilityId: requirement.facilityId,
        kind: 'recheck',
        label: `${FACILITY_NAMES[requirement.facilityId]} · ${requirement.followUp.label}`,
        startSlot: plan.starts[requirement.followUp.id] ?? null,
        duration: requirement.followUp.duration,
        readySlot: option && installStart !== null ? installStart + option.duration : null,
        deadline: requirement.followUp.deadline,
        afterJobId: requirement.id,
      })
    }
  }
  return jobs
}

// ── 계획 검증 ──────────────────────────────────────────────

export function validatePlan(mission: Mission, plan: Plan): PlanIssue[] {
  const issues: PlanIssue[] = []
  const jobs = getJobs(mission, plan)

  // 1. 두 요구에 공급안이 선택됐는가
  for (const requirement of mission.requirements) {
    if (!getSelectedOption(mission, plan, requirement.id)) {
      issues.push({
        code: 'no_selection',
        requirementId: requirement.id,
        message: `${FACILITY_NAMES[requirement.facilityId]}의 공급안을 아직 고르지 않았어요. 요청을 열어 사용 모습을 비교해 보세요.`,
      })
    }
  }

  // 2. 안전 확인과 필수 기능
  for (const requirement of mission.requirements) {
    const option = getSelectedOption(mission, plan, requirement.id)
    if (!option) continue
    const message = describeEligibility(requirement, option)
    if (message) {
      issues.push({
        code: option.safetyPass ? 'feature_missing' : 'safety_missing',
        requirementId: requirement.id,
        message,
      })
    }
  }

  // 3. 예산
  const over = getTotalCost(mission, plan) - mission.budget
  if (over > 0) {
    issues.push({
      code: 'over_budget',
      message: `예산을 ${over}점 넘었어요. 같은 기능을 충족하는 다른 안을 비교해 보세요.`,
    })
  }

  // 4. 도착 이후 시작, 연속 칸
  for (const job of jobs) {
    if (job.kind !== 'install') continue
    const facility = FACILITY_NAMES[job.facilityId]
    if (job.startSlot === null) {
      issues.push({
        code: 'not_placed',
        requirementId: job.requirementId,
        jobId: job.id,
        message: `${facility}의 설치를 준비 일정에 놓아 주세요.`,
      })
      continue
    }
    if (job.readySlot !== null && job.startSlot < job.readySlot) {
      issues.push({
        code: 'before_ready',
        requirementId: job.requirementId,
        jobId: job.id,
        slots: getOccupiedSlots(job.startSlot, job.duration),
        message: `이 물품은 ${slotLabel(job.readySlot)}부터 설치할 수 있어요.`,
      })
    }
    if (job.startSlot < 1 || job.startSlot + job.duration - 1 > SLOT_COUNT) {
      issues.push({
        code: 'out_of_range',
        requirementId: job.requirementId,
        jobId: job.id,
        message: `${facility}의 설치가 ${slotLabel(SLOT_COUNT)} 안에 끝나지 않아요. 시작 칸을 앞으로 옮겨 주세요.`,
      })
    }
  }

  // 5. 칸 겹침
  const placed = jobs.filter((job) => job.startSlot !== null)
  for (let a = 0; a < placed.length; a++) {
    for (let b = a + 1; b < placed.length; b++) {
      const first = getOccupiedSlots(placed[a].startSlot as number, placed[a].duration)
      const second = getOccupiedSlots(placed[b].startSlot as number, placed[b].duration)
      const shared = first.filter((slot) => second.includes(slot))
      if (shared.length > 0) {
        issues.push({
          code: 'slot_conflict',
          jobId: placed[b].id,
          jobIds: [placed[a].id, placed[b].id],
          slots: shared,
          message: `${slotLabel(shared[0])}의 설치 지원이 겹쳐요. 다른 칸이나 준비 시간이 짧은 안을 선택해 보세요.`,
        })
      }
    }
  }

  // 6. 마감
  for (const job of jobs) {
    if (job.kind !== 'install' || job.startSlot === null) continue
    const end = job.startSlot + job.duration - 1
    if (end > job.deadline) {
      const facility = FACILITY_NAMES[job.facilityId]
      issues.push({
        code: 'past_deadline',
        requirementId: job.requirementId,
        jobId: job.id,
        slots: getOccupiedSlots(job.startSlot, job.duration).filter((slot) => slot > job.deadline),
        message: `${withJosa(facility, '이/가')} 사용하기 시작한 뒤에 완료돼요. ${slotLabel(job.deadline)}까지 끝나도록 ${facility}의 준비를 먼저 배치해 보세요.`,
      })
    }
  }

  // 7. 관찰 후 개선·재확인
  for (const job of jobs) {
    if (job.kind !== 'recheck') continue
    const facility = FACILITY_NAMES[job.facilityId]
    if (job.startSlot === null) {
      issues.push({
        code: 'recheck_not_placed',
        requirementId: job.requirementId,
        jobId: job.id,
        message: `${facility}의 ‘관찰 후 개선·재확인’ 한 칸을 준비 일정에 놓아 주세요.`,
      })
      continue
    }
    if (job.readySlot !== null && job.startSlot < job.readySlot) {
      issues.push({
        code: 'recheck_order',
        requirementId: job.requirementId,
        jobId: job.id,
        slots: getOccupiedSlots(job.startSlot, job.duration),
        message: '실제 사용을 관찰한 다음 개선·재확인을 진행해요. 첫 설치가 끝난 다음 칸부터 놓을 수 있어요.',
      })
    }
    if (job.startSlot + job.duration - 1 > job.deadline) {
      issues.push({
        code: 'recheck_past_deadline',
        requirementId: job.requirementId,
        jobId: job.id,
        slots: getOccupiedSlots(job.startSlot, job.duration),
        message: `개선·재확인은 ${slotLabel(job.deadline)}까지 끝나야 해요. 첫 설치를 앞쪽 칸으로 옮겨 보세요.`,
      })
    }
  }

  return issues
}

export function isPlanValid(mission: Mission, plan: Plan): boolean {
  return validatePlan(mission, plan).length === 0
}

/** 한 작업을 특정 칸에서 시작할 때 생기는 문제의 첫 문장. 문제가 없으면 null. */
export function getPlacementIssue(mission: Mission, plan: Plan, jobId: string, start: number): string | null {
  const trial: Plan = { selections: plan.selections, starts: { ...plan.starts, [jobId]: start } }
  const scheduleCodes = ['before_ready', 'out_of_range', 'slot_conflict', 'past_deadline', 'recheck_order', 'recheck_past_deadline']
  const issue = validatePlan(mission, trial).find(
    (item) => scheduleCodes.includes(item.code) && (item.jobId === jobId || item.jobIds?.includes(jobId)),
  )
  if (issue) return issue.message
  const job = getJobs(mission, trial).find((item) => item.id === jobId)
  if (job && start + job.duration - 1 > SLOT_COUNT) return `${slotLabel(SLOT_COUNT)} 안에 끝나지 않아요.`
  return null
}

/** 모든 적격 조합과 시작 칸을 열거해 실행 가능한 계획을 돌려준다(검산·테스트용). */
export function enumerateValidPlans(mission: Mission): Plan[] {
  const valid: Plan[] = []
  const pools = mission.requirements.map((requirement) => getEligibleOptions(mission, requirement.id))
  const jobIds = mission.requirements.flatMap((requirement) =>
    requirement.followUp ? [requirement.id, requirement.followUp.id] : [requirement.id],
  )
  const pickOptions = (index: number, selections: Record<string, string>) => {
    if (index === pools.length) {
      pickStarts(0, selections, {})
      return
    }
    for (const candidate of pools[index]) {
      pickOptions(index + 1, { ...selections, [mission.requirements[index].id]: candidate.id })
    }
  }
  const pickStarts = (index: number, selections: Record<string, string>, starts: Record<string, number>) => {
    if (index === jobIds.length) {
      const plan: Plan = { selections, starts }
      if (isPlanValid(mission, plan)) valid.push(plan)
      return
    }
    for (let slot = 1; slot <= SLOT_COUNT; slot++) {
      pickStarts(index + 1, selections, { ...starts, [jobIds[index]]: slot })
    }
  }
  pickOptions(0, {})
  return valid
}

// ── 실행 단계 ──────────────────────────────────────────────

/** 확정한 계획을 칸 순서의 실행 단계로 푼다. 계획이 유효하다는 전제에서만 쓴다. */
export function buildTimeline(mission: Mission, plan: Plan): ExecStep[] {
  const steps: ExecStep[] = []
  const jobs = getJobs(mission, plan)
  for (let slot = 1; slot <= SLOT_COUNT; slot++) {
    for (const job of jobs) {
      if (job.kind === 'install' && job.readySlot === slot) {
        steps.push({ kind: 'arrive', slot, requirementId: job.requirementId })
      }
    }
    for (const job of jobs) {
      if (job.startSlot === null) continue
      const end = job.startSlot + job.duration - 1
      if (slot < job.startSlot || slot > end) continue
      if (job.kind === 'recheck') {
        steps.push({ kind: 'recheck', slot, requirementId: job.requirementId })
        continue
      }
      steps.push({ kind: 'install', slot, requirementId: job.requirementId, part: slot - job.startSlot + 1, of: job.duration })
      if (slot === end) {
        steps.push({ kind: 'installed', slot, requirementId: job.requirementId })
        if (getRequirement(mission, job.requirementId).followUp) {
          steps.push({ kind: 'observe', slot, requirementId: job.requirementId })
        }
      }
    }
  }
  return steps
}

// ── 완료 상태와 점수 ───────────────────────────────────────

export function isComparisonReviewed(mission: Mission, run: MissionRun, requirementId: string): boolean {
  if (run.compareOpened[requirementId]) return true
  const seen = run.previewed[requirementId] ?? []
  const eligible = getEligibleOptions(mission, requirementId)
  return eligible.length >= 2 && eligible.every((option) => seen.includes(option.id))
}

export type RequirementCompletion = {
  requirementId: string
  eligible: boolean
  installed: boolean
  /** 후속 작업이 있는 요구만 의미가 있다 */
  improved: boolean
  rechecked: boolean
  usageConfirmed: boolean
  complete: boolean
}

export function getCompletionState(mission: Mission, run: MissionRun): { requirements: RequirementCompletion[]; missionComplete: boolean } {
  const done = run.timeline.slice(0, run.stepIndex)
  const requirements = mission.requirements.map((requirement) => {
    const option = getSelectedOption(mission, run.plan, requirement.id)
    const eligible = option ? isEligible(requirement, option) : false
    const installed = done.some((step) => step.kind === 'installed' && step.requirementId === requirement.id)
    const needsFollowUp = Boolean(requirement.followUp)
    const improved = needsFollowUp
      ? run.observation?.requirementId === requirement.id && run.observation.chosenId !== null
      : true
    const rechecked = needsFollowUp ? run.rechecked && done.some((step) => step.kind === 'recheck' && step.requirementId === requirement.id) : true
    const usageConfirmed = run.usageConfirmed.includes(requirement.id)
    return {
      requirementId: requirement.id,
      eligible,
      installed,
      improved,
      rechecked,
      usageConfirmed,
      complete: eligible && installed && improved && rechecked && usageConfirmed,
    }
  })
  return { requirements, missionComplete: requirements.every((item) => item.complete) }
}

/** GAME_SPEC 6장의 고정식. 안전·예산·납기는 점수가 아니라 실행 조건이다. */
export function computeScore(mission: Mission, run: MissionRun): ScoreBreakdown {
  const completion = getCompletionState(mission, run)
  const byRequirement: ScoreBreakdown['byRequirement'] = {}
  let need = 0
  let compare = 0
  let usage = 0
  for (const item of completion.requirements) {
    const row = {
      need: item.eligible && item.installed ? 30 : 0,
      compare: isComparisonReviewed(mission, run, item.requirementId) ? 10 : 0,
      usage: item.usageConfirmed && item.improved && item.rechecked ? 10 : 0,
    }
    byRequirement[item.requirementId] = row
    need += row.need
    compare += row.compare
    usage += row.usage
  }
  return { need, compare, usage, total: need + compare + usage, byRequirement }
}
