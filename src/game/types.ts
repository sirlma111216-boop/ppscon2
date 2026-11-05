// 게임 규칙의 데이터 타입. 화면(React)과 무관하며 Node 테스트에서 그대로 불러온다.

export type FacilityId = 'library' | 'school' | 'community' | 'park'
export type MissionId = 'M1' | 'M2' | 'M3'

export type FeatureTag =
  | 'changes_layout'
  | 'compact_storage'
  | 'adjustable_height'
  | 'usable_knee_space'
  | 'text_and_audio'
  | 'no_personal_data_collection'
  | 'readable_symbols'
  | 'relocatable'
  | 'provides_shade'

/** 장면 연출이 고르는 물품의 사용 방식. 판정에는 쓰지 않는다. */
export type OptionVisual =
  | 'foldTable'
  | 'mobileTable'
  | 'fixedTable'
  | 'compactDesk'
  | 'wideDesk'
  | 'fixedDesk'
  | 'kioskText'
  | 'kioskMenu'
  | 'voiceOnly'
  | 'signAssembled'
  | 'signReady'
  | 'signFixed'
  | 'canopyAssembled'
  | 'canopyReady'
  | 'ornament'

export type SupplyOption = {
  id: string
  requirementId: string
  name: string
  visual: OptionVisual
  cost: number
  /** 배송이 끝나 설치를 시작할 수 있는 첫 칸 */
  readySlot: number
  /** 연속으로 쓰는 설치 칸 수 */
  duration: number
  safetyPass: boolean
  features: FeatureTag[]
  /** 카드의 이용 상황 한 문장 */
  useText: string
  /** 같은 기준으로 견주는 장단점 */
  tradeoffText: string
  /** 미리보기 장면의 설명 */
  previewText: string
  /** 결과에 남는 기능 근거 한 문장(적격 안) */
  rationaleText: string
  /** 필수 기능별 충족·불충족 설명 */
  featureNotes: Partial<Record<FeatureTag, string>>
}

export type FollowUp = {
  /** 일정에 놓는 후속 작업의 ID */
  id: string
  label: string
  cost: number
  duration: number
  deadline: number
}

export type Requirement = {
  id: string
  facilityId: FacilityId
  title: string
  speaker: string
  needText: string
  requiredFeatures: FeatureTag[]
  /** 설치 완료 마감 칸 */
  deadline: number
  deadlineText: string
  /** 화면에 보이는 모든 제시안(부적격 포함) */
  optionIds: string[]
  followUp?: FollowUp
}

export type ImprovementChoice = {
  id: string
  label: string
  valid: boolean
}

export type ObservationSpec = {
  optionId: string
  /** 관찰한 불편 */
  observationText: string
  /** 잘못된 개선을 골랐을 때 되짚을 문제 */
  problemText: string
  choices: ImprovementChoice[]
  improveText: string
  recheckText: string
}

export type Mission = {
  id: MissionId
  number: number
  title: string
  goalText: string
  storyText: string
  budget: number
  requirements: Requirement[]
  options: Record<string, SupplyOption>
  observations?: Record<string, ObservationSpec>
  /** 결과 화면에서 되짚는 한 문장 */
  lessonText: string
}

export type Plan = {
  /** 요구 ID → 잠정 선택한 제시안 ID */
  selections: Record<string, string | null>
  /** 작업 ID → 시작 칸 */
  starts: Record<string, number | null>
}

export type PlannedJob = {
  id: string
  requirementId: string
  facilityId: FacilityId
  kind: 'install' | 'recheck'
  label: string
  startSlot: number | null
  duration: number
  /** 시작할 수 있는 첫 칸. 후속 작업은 선행 설치가 놓인 뒤에 정해진다 */
  readySlot: number | null
  deadline: number
  afterJobId?: string
}

export type IssueCode =
  | 'no_selection'
  | 'safety_missing'
  | 'feature_missing'
  | 'over_budget'
  | 'not_placed'
  | 'before_ready'
  | 'out_of_range'
  | 'slot_conflict'
  | 'past_deadline'
  | 'recheck_not_placed'
  | 'recheck_order'
  | 'recheck_past_deadline'

export type PlanIssue = {
  code: IssueCode
  message: string
  requirementId?: string
  jobId?: string
  /** 겹침처럼 두 작업이 함께 걸린 문제 */
  jobIds?: string[]
  slots?: number[]
}

export type ExecStep =
  | { kind: 'arrive'; slot: number; requirementId: string }
  | { kind: 'install'; slot: number; requirementId: string; part: number; of: number }
  | { kind: 'installed'; slot: number; requirementId: string }
  | { kind: 'observe'; slot: number; requirementId: string }
  | { kind: 'recheck'; slot: number; requirementId: string }

export type Phase = 'briefing' | 'planning' | 'executing' | 'observing' | 'verifying' | 'result'

export type MissionRun = {
  missionId: MissionId
  phase: Phase
  plan: Plan
  /** 요구 ID → 미리보기를 연 제시안 */
  previewed: Record<string, string[]>
  /** 요구 ID → 나란히 비교표를 연 적이 있는가 */
  compareOpened: Record<string, boolean>
  timeline: ExecStep[]
  /** 끝난 실행 단계 수 */
  stepIndex: number
  observation: {
    requirementId: string
    optionId: string
    wrongAttempts: number
    chosenId: string | null
  } | null
  rechecked: boolean
  usageConfirmed: string[]
}

export type ScoreBreakdown = {
  need: number
  compare: number
  usage: number
  total: number
  /** 요구별 내역 */
  byRequirement: Record<string, { need: number; compare: number; usage: number }>
}

export type MissionResult = {
  missionId: MissionId
  selections: Record<string, string>
  starts: Record<string, number>
  cost: number
  budget: number
  improvementId: string | null
  score: ScoreBreakdown
}

export type Screen = 'intro' | 'chapter' | 'play' | 'ending'

export type GameState = {
  screen: Screen
  run: MissionRun | null
  results: Partial<Record<MissionId, MissionResult>>
}
