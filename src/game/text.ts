// 실행 단계와 결과를 사람이 읽는 문장으로 푸는 순수 함수.
import { getRequirement, getSelectedOption, isComparisonReviewed, withJosa } from './engine.ts'
import { FACILITY_NAMES, getMission } from './missions.ts'
import type { ExecStep, FacilityId, GameState, Mission, MissionRun, OptionVisual, Plan } from './types.ts'

export type StepText = {
  /** 이 단계를 수행하는 주체 */
  actor: string
  text: string
}

const ARRIVAL_NOTE: Partial<Record<OptionVisual, string>> = {
  signAssembled: '부품 상태로',
  signReady: '완성된 상태로',
  canopyAssembled: '부품 상태로',
  canopyReady: '조립을 마친 상태로',
  kioskText: '현장에서 설정할 상태로',
  kioskMenu: '설정을 마친 상태로',
}

export function describeStep(mission: Mission, plan: Plan, step: ExecStep): StepText {
  const requirement = getRequirement(mission, step.requirementId)
  const facility = FACILITY_NAMES[requirement.facilityId]
  const option = getSelectedOption(mission, plan, step.requirementId)
  const name = option?.name ?? '물품'
  switch (step.kind) {
    case 'arrive': {
      const note = option ? ARRIVAL_NOTE[option.visual] : undefined
      return { actor: '공급자', text: `${withJosa(name, '을/를')} ${note ? `${note} ` : ''}${facility}에 납품했어요.` }
    }
    case 'install':
      return { actor: '공급자', text: `${facility}에서 ${withJosa(name, '을/를')} 설치·설정하고 있어요${step.of > 1 ? ` (${step.part}/${step.of}칸)` : ''}.` }
    case 'installed':
      return { actor: facility, text: `${withJosa(facility, '이/가')} 설치된 상태와 필수 조건을 확인했어요.` }
    case 'observe':
      return { actor: facility, text: `${withJosa(facility, '이/가')} 실제로 쓰는 모습을 지켜보고 있어요.` }
    case 'recheck': {
      const spec = option ? mission.observations?.[option.id] : undefined
      return { actor: `공급자 · ${facility}`, text: spec ? `${spec.improveText} ${spec.recheckText}` : '개선을 반영하고 다시 확인했어요.' }
    }
  }
}

/** 결과 화면의 대표 표시: 요구 2/2 충족 · 확인 2/2 · 사용 예산 70/82 */
export function summarizeRun(mission: Mission, run: MissionRun, cost: number): string {
  const met = mission.requirements.filter((requirement) => {
    const option = getSelectedOption(mission, run.plan, requirement.id)
    return option && requirement.requiredFeatures.every((feature) => option.features.includes(feature))
  }).length
  const total = mission.requirements.length
  return `요구 ${met}/${total} 충족 · 확인 ${run.usageConfirmed.length}/${total} · 사용 예산 ${cost}/${mission.budget}`
}

export function compareHint(mission: Mission, run: MissionRun): string | null {
  const missed = mission.requirements.filter((requirement) => !isComparisonReviewed(mission, run, requirement.id))
  if (missed.length === 0) return null
  const names = missed.map((requirement) => FACILITY_NAMES[requirement.facilityId]).join('·')
  return `${names}에서는 조건을 충족하는 두 안을 모두 살펴보지 않았어요. 다시 계획할 때 다른 안의 사용 미리보기도 열어 보세요.`
}

export type FacilityView = {
  /** 장면 배치를 고르는 임무(공원은 임무에 따라 장면이 다르다) */
  missionId: Mission['id']
  visual: OptionVisual | null
  improved: boolean
  /** 그 시설의 지금 모습에 대한 한 문장 */
  note: string
}

/**
 * 진행 중인 임무에 요구가 없는 시설의 '지금 모습'.
 * 앞 임무에서 마친 구매는 사용 상태로 남고, 아직 다루지 않은 시설은 구매 전 모습이다.
 */
export function getSettledView(state: GameState, facility: FacilityId): FacilityView {
  const m1 = state.results.M1
  const m2 = state.results.M2
  const m3 = state.results.M3
  if (facility === 'library') {
    const option = m1 ? getMission('M1').options[m1.selections['M1-library']] : null
    return {
      missionId: 'M1',
      visual: option?.visual ?? null,
      improved: false,
      note: option ? `${withJosa(option.name, '이/가')} 쓰이고 있어요. 오전 독서 자리가 오후 프로그램 자리로 바뀝니다.` : '오후 프로그램을 열 빈자리가 부족해요.',
    }
  }
  if (facility === 'school') {
    const later = m3 ? getMission('M3').options[m3.selections['M3-school']] : null
    const first = m1 ? getMission('M1').options[m1.selections['M1-school']] : null
    const option = later ?? first
    return {
      missionId: later ? 'M3' : 'M1',
      visual: option?.visual ?? null,
      improved: false,
      note: option ? `${withJosa(option.name, '이/가')} 쓰이고 있어요. 이용자마다 높이를 맞춰 앉습니다.` : '모든 책상이 같은 높이예요.',
    }
  }
  if (facility === 'community') {
    const option = m2 ? getMission('M2').options[m2.selections['M2-community']] : null
    return {
      missionId: 'M2',
      visual: option?.visual ?? null,
      improved: Boolean(option),
      note: option ? `개선을 마친 ${withJosa(option.name, '이/가')} 쓰이고 있어요. 처음 온 주민도 창구를 찾아갑니다.` : '처음 온 주민이 입구에서 멈춰 서요.',
    }
  }
  const canopy = m3 ? getMission('M3').options[m3.selections['M3-park']] : null
  if (canopy) {
    return { missionId: 'M3', visual: canopy.visual, improved: false, note: `${withJosa(canopy.name, '이/가')} 놓여 주민들이 그늘에서 쉽니다.` }
  }
  const sign = m2 ? getMission('M2').options[m2.selections['M2-park']] : null
  return {
    missionId: 'M2',
    visual: sign?.visual ?? null,
    improved: false,
    note: sign ? `${withJosa(sign.name, '이/가')} 행사 장소를 알려 주고 있어요.` : '행사 장소를 찾는 사람들이 입구에서 헤매요.',
  }
}
