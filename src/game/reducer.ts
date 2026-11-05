// 명시적 상태 전이. 조건이 맞지 않는 동작은 상태를 바꾸지 않으므로
// 빠른 중복 클릭이나 건너뛰기로 결과를 두 번 적용하거나 필수 단계를 지나칠 수 없다.
import { buildTimeline, computeScore, getCompletionState, getTotalCost, isPlanValid } from './engine.ts'
import { MISSION_ORDER, getMission, nextMissionId } from './missions.ts'
import type { GameState, MissionId, MissionResult, MissionRun, Plan } from './types.ts'

export type GameAction =
  | { type: 'START_NEW' }
  | { type: 'OPEN_MISSION'; missionId: MissionId }
  | { type: 'BEGIN_PLANNING' }
  | { type: 'PREVIEW_OPTION'; requirementId: string; optionId: string }
  | { type: 'OPEN_COMPARE'; requirementId: string }
  | { type: 'SELECT_OPTION'; requirementId: string; optionId: string | null }
  | { type: 'PLACE_JOB'; jobId: string; start: number | null }
  | { type: 'CONFIRM_PLAN' }
  | { type: 'EXEC_ADVANCE' }
  | { type: 'EXEC_SKIP' }
  | { type: 'CHOOSE_IMPROVEMENT'; choiceId: string }
  | { type: 'CONFIRM_USAGE'; requirementId: string }
  | { type: 'FINISH_MISSION' }
  | { type: 'NEXT_MISSION' }
  | { type: 'REPLAN_MISSION' }
  | { type: 'GO_INTRO' }
  | { type: 'RESUME' }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD'; state: GameState }

export const initialState: GameState = { screen: 'intro', run: null, results: {} }

export function emptyPlan(missionId: MissionId): Plan {
  const mission = getMission(missionId)
  const selections: Plan['selections'] = {}
  const starts: Plan['starts'] = {}
  for (const requirement of mission.requirements) {
    selections[requirement.id] = null
    starts[requirement.id] = null
    if (requirement.followUp) starts[requirement.followUp.id] = null
  }
  return { selections, starts }
}

export function newRun(missionId: MissionId, phase: MissionRun['phase'] = 'briefing'): MissionRun {
  return {
    missionId,
    phase,
    plan: emptyPlan(missionId),
    previewed: {},
    compareOpened: {},
    timeline: [],
    stepIndex: 0,
    observation: null,
    rechecked: false,
    usageConfirmed: [],
  }
}

/** 앞 임무를 마쳐야 다음 임무가 열린다. */
export function isMissionUnlocked(state: GameState, missionId: MissionId): boolean {
  const index = MISSION_ORDER.indexOf(missionId)
  return MISSION_ORDER.slice(0, index).every((id) => Boolean(state.results[id]))
}

export function isCampaignComplete(state: GameState): boolean {
  return MISSION_ORDER.every((id) => Boolean(state.results[id]))
}

/** 실행 단계를 하나 끝낸다. 관찰 지점에서는 멈춰 선택을 기다린다. */
function advance(run: MissionRun): MissionRun {
  if (run.phase !== 'executing') return run
  const step = run.timeline[run.stepIndex]
  if (!step) return { ...run, phase: 'verifying' }
  if (step.kind === 'observe') {
    const optionId = run.plan.selections[step.requirementId]
    if (!optionId) return run
    return {
      ...run,
      phase: 'observing',
      observation: run.observation ?? { requirementId: step.requirementId, optionId, wrongAttempts: 0, chosenId: null },
    }
  }
  const stepIndex = run.stepIndex + 1
  return {
    ...run,
    stepIndex,
    rechecked: run.rechecked || step.kind === 'recheck',
    phase: stepIndex >= run.timeline.length ? 'verifying' : 'executing',
  }
}

function buildResult(run: MissionRun): MissionResult {
  const mission = getMission(run.missionId)
  const selections: Record<string, string> = {}
  const starts: Record<string, number> = {}
  for (const [key, value] of Object.entries(run.plan.selections)) if (value) selections[key] = value
  for (const [key, value] of Object.entries(run.plan.starts)) if (value !== null) starts[key] = value
  return {
    missionId: run.missionId,
    selections,
    starts,
    cost: getTotalCost(mission, run.plan),
    budget: mission.budget,
    improvementId: run.observation?.chosenId ?? null,
    score: computeScore(mission, run),
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  const run = state.run

  switch (action.type) {
    case 'LOAD':
      return action.state

    case 'RESET_ALL':
      return initialState

    case 'START_NEW':
      return { screen: 'chapter', run: newRun('M1'), results: {} }

    case 'OPEN_MISSION':
      if (!isMissionUnlocked(state, action.missionId)) return state
      return { ...state, screen: 'chapter', run: newRun(action.missionId) }

    case 'GO_INTRO':
      return { ...state, screen: 'intro' }

    case 'RESUME': {
      if (run) return { ...state, screen: run.phase === 'briefing' ? 'chapter' : 'play' }
      const next = MISSION_ORDER.find((id) => !state.results[id])
      if (!next) return { ...state, screen: 'ending' }
      return { ...state, screen: 'chapter', run: newRun(next) }
    }

    case 'BEGIN_PLANNING':
      if (!run || run.phase !== 'briefing') return state
      return { ...state, screen: 'play', run: { ...run, phase: 'planning' } }

    case 'PREVIEW_OPTION': {
      if (!run || run.phase !== 'planning') return state
      const seen = run.previewed[action.requirementId] ?? []
      if (seen.includes(action.optionId)) return state
      return { ...state, run: { ...run, previewed: { ...run.previewed, [action.requirementId]: [...seen, action.optionId] } } }
    }

    case 'OPEN_COMPARE':
      if (!run || run.phase !== 'planning' || run.compareOpened[action.requirementId]) return state
      return { ...state, run: { ...run, compareOpened: { ...run.compareOpened, [action.requirementId]: true } } }

    case 'SELECT_OPTION': {
      if (!run || run.phase !== 'planning') return state
      if (run.plan.selections[action.requirementId] === action.optionId) return state
      const mission = getMission(run.missionId)
      if (action.optionId && mission.options[action.optionId]?.requirementId !== action.requirementId) return state
      // 설치 길이가 달라지므로 그 요구의 기존 설치 칸은 비운다. 비용은 선택에서 다시 계산된다.
      return {
        ...state,
        run: {
          ...run,
          plan: {
            selections: { ...run.plan.selections, [action.requirementId]: action.optionId },
            starts: { ...run.plan.starts, [action.requirementId]: null },
          },
        },
      }
    }

    case 'PLACE_JOB': {
      if (!run || run.phase !== 'planning') return state
      if (!(action.jobId in run.plan.starts)) return state
      if (run.plan.starts[action.jobId] === action.start) return state
      return { ...state, run: { ...run, plan: { ...run.plan, starts: { ...run.plan.starts, [action.jobId]: action.start } } } }
    }

    case 'CONFIRM_PLAN': {
      if (!run || run.phase !== 'planning') return state
      const mission = getMission(run.missionId)
      if (!isPlanValid(mission, run.plan)) return state
      return {
        ...state,
        run: {
          ...run,
          phase: 'executing',
          timeline: buildTimeline(mission, run.plan),
          stepIndex: 0,
          observation: null,
          rechecked: false,
          usageConfirmed: [],
        },
      }
    }

    case 'EXEC_ADVANCE':
      if (!run || run.phase !== 'executing') return state
      return { ...state, run: advance(run) }

    case 'EXEC_SKIP': {
      if (!run || run.phase !== 'executing') return state
      let current = run
      while (current.phase === 'executing') current = advance(current)
      return { ...state, run: current }
    }

    case 'CHOOSE_IMPROVEMENT': {
      if (!run || run.phase !== 'observing' || !run.observation) return state
      const spec = getMission(run.missionId).observations?.[run.observation.optionId]
      const choice = spec?.choices.find((item) => item.id === action.choiceId)
      if (!choice) return state
      if (!choice.valid) {
        // 다시 고를 수 있고 점수·예산·시간에 남지 않는다. 횟수는 안내 문구를 보여 주는 데만 쓴다.
        return { ...state, run: { ...run, observation: { ...run.observation, wrongAttempts: run.observation.wrongAttempts + 1 } } }
      }
      return {
        ...state,
        run: {
          ...run,
          phase: 'executing',
          stepIndex: run.stepIndex + 1,
          observation: { ...run.observation, chosenId: choice.id },
        },
      }
    }

    case 'CONFIRM_USAGE': {
      if (!run || run.phase !== 'verifying') return state
      if (run.usageConfirmed.includes(action.requirementId)) return state
      if (!(action.requirementId in run.plan.selections)) return state
      return { ...state, run: { ...run, usageConfirmed: [...run.usageConfirmed, action.requirementId] } }
    }

    case 'FINISH_MISSION': {
      if (!run || run.phase !== 'verifying') return state
      if (!getCompletionState(getMission(run.missionId), run).missionComplete) return state
      return {
        ...state,
        run: { ...run, phase: 'result' },
        results: { ...state.results, [run.missionId]: buildResult(run) },
      }
    }

    case 'NEXT_MISSION': {
      if (!run || run.phase !== 'result') return state
      const next = nextMissionId(run.missionId)
      if (!next) return { ...state, screen: 'ending', run: null }
      return { ...state, screen: 'chapter', run: newRun(next) }
    }

    case 'REPLAN_MISSION':
      // 같은 임무를 빈 계획으로 다시 연다. 다른 임무의 결과는 건드리지 않는다.
      // 이미 살펴본 비교 기록은 같은 임무 안에서만 이어진다.
      if (!run) return state
      return {
        ...state,
        screen: 'play',
        run: { ...newRun(run.missionId, 'planning'), previewed: run.previewed, compareOpened: run.compareOpened },
      }

    default:
      return state
  }
}
