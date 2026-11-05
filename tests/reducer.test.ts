// 상태 전이 검사: 임무 2의 관찰·개선·재확인, 건너뛰기, 다시 계획, 중복 입력.
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { computeScore, getCompletionState, getTotalCost } from '../src/game/engine.ts'
import { MISSIONS } from '../src/game/missions.ts'
import { gameReducer, initialState, isCampaignComplete, isMissionUnlocked } from '../src/game/reducer.ts'
import type { GameAction } from '../src/game/reducer.ts'
import type { GameState, MissionRun } from '../src/game/types.ts'

function apply(state: GameState, ...actions: GameAction[]): GameState {
  return actions.reduce(gameReducer, state)
}

function runOf(state: GameState): MissionRun {
  assert.ok(state.run)
  return state.run
}

const M1_PLAN: GameAction[] = [
  { type: 'SELECT_OPTION', requirementId: 'M1-library', optionId: 'L1' },
  { type: 'SELECT_OPTION', requirementId: 'M1-school', optionId: 'S1' },
  { type: 'PLACE_JOB', jobId: 'M1-school', start: 2 },
  { type: 'PLACE_JOB', jobId: 'M1-library', start: 4 },
]

const M2_PLAN: GameAction[] = [
  { type: 'SELECT_OPTION', requirementId: 'M2-community', optionId: 'I1' },
  { type: 'SELECT_OPTION', requirementId: 'M2-park', optionId: 'G2' },
  { type: 'PLACE_JOB', jobId: 'M2-community', start: 1 },
  { type: 'PLACE_JOB', jobId: 'M2-community-recheck', start: 3 },
  { type: 'PLACE_JOB', jobId: 'M2-park', start: 4 },
]

const M3_PLAN: GameAction[] = [
  { type: 'SELECT_OPTION', requirementId: 'M3-park', optionId: 'P1' },
  { type: 'SELECT_OPTION', requirementId: 'M3-school', optionId: 'E1' },
  { type: 'PLACE_JOB', jobId: 'M3-school', start: 1 },
  { type: 'PLACE_JOB', jobId: 'M3-park', start: 3 },
]

function startMission1(): GameState {
  return apply(initialState, { type: 'START_NEW' }, { type: 'BEGIN_PLANNING' })
}

function finishMission1(state = startMission1()): GameState {
  return apply(
    state,
    ...M1_PLAN,
    { type: 'CONFIRM_PLAN' },
    { type: 'EXEC_SKIP' },
    { type: 'CONFIRM_USAGE', requirementId: 'M1-library' },
    { type: 'CONFIRM_USAGE', requirementId: 'M1-school' },
    { type: 'FINISH_MISSION' },
  )
}

function startMission2(): GameState {
  return apply(finishMission1(), { type: 'NEXT_MISSION' }, { type: 'BEGIN_PLANNING' })
}

test('임무 1을 계획 → 실행 → 이용 확인 → 결과까지 진행한다', () => {
  let state = startMission1()
  assert.equal(runOf(state).phase, 'planning')
  state = apply(state, ...M1_PLAN, { type: 'CONFIRM_PLAN' })
  assert.equal(runOf(state).phase, 'executing')
  // 단계마다 하나씩 진행해도 같은 끝에 닿는다
  let guard = 0
  while (runOf(state).phase === 'executing' && guard++ < 50) state = apply(state, { type: 'EXEC_ADVANCE' })
  assert.equal(runOf(state).phase, 'verifying')
  // 이용 확인 없이는 결과로 넘어가지 못한다
  assert.equal(runOf(apply(state, { type: 'FINISH_MISSION' })).phase, 'verifying')
  state = apply(state, { type: 'CONFIRM_USAGE', requirementId: 'M1-library' }, { type: 'CONFIRM_USAGE', requirementId: 'M1-school' }, { type: 'FINISH_MISSION' })
  assert.equal(runOf(state).phase, 'result')
  assert.equal(state.results.M1?.cost, 70)
  assert.equal(state.results.M1?.score.need, 60)
  assert.equal(state.results.M1?.score.usage, 20)
})

test('유효하지 않은 계획은 확정되지 않는다', () => {
  const noPlacement = apply(startMission1(), M1_PLAN[0], M1_PLAN[1], { type: 'CONFIRM_PLAN' })
  assert.equal(runOf(noPlacement).phase, 'planning')
  const ineligible = apply(
    startMission1(),
    { type: 'SELECT_OPTION', requirementId: 'M1-library', optionId: 'L0' },
    { type: 'SELECT_OPTION', requirementId: 'M1-school', optionId: 'S1' },
    { type: 'PLACE_JOB', jobId: 'M1-school', start: 2 },
    { type: 'PLACE_JOB', jobId: 'M1-library', start: 4 },
    { type: 'CONFIRM_PLAN' },
  )
  assert.equal(runOf(ineligible).phase, 'planning', '부적격 안은 잠정 선택만 된다')
  assert.equal(runOf(ineligible).plan.selections['M1-library'], 'L0')
})

test('8. 공급안을 바꾸면 그 요구의 설치 칸이 비워지고 비용은 다시 계산된다', () => {
  let state = apply(startMission1(), ...M1_PLAN)
  assert.equal(getTotalCost(MISSIONS.M1, runOf(state).plan), 70)
  state = apply(state, { type: 'SELECT_OPTION', requirementId: 'M1-library', optionId: 'L2' })
  assert.equal(runOf(state).plan.starts['M1-library'], null)
  assert.equal(runOf(state).plan.starts['M1-school'], 2, '다른 요구의 칸은 그대로')
  assert.equal(getTotalCost(MISSIONS.M1, runOf(state).plan), 82)
  state = apply(state, { type: 'SELECT_OPTION', requirementId: 'M1-library', optionId: 'L1' })
  assert.equal(getTotalCost(MISSIONS.M1, runOf(state).plan), 70)
})

test('10. 건너뛰어도 최종 판정이 같고 이용 확인은 남아 있다', () => {
  const stepped = (() => {
    let state = apply(startMission1(), ...M1_PLAN, { type: 'CONFIRM_PLAN' })
    while (runOf(state).phase === 'executing') state = apply(state, { type: 'EXEC_ADVANCE' })
    return state
  })()
  const skipped = apply(startMission1(), ...M1_PLAN, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_SKIP' }, { type: 'EXEC_SKIP' }, { type: 'EXEC_ADVANCE' })
  assert.deepEqual(runOf(skipped), runOf(stepped))
  assert.equal(runOf(skipped).phase, 'verifying')
  assert.deepEqual(runOf(skipped).usageConfirmed, [])
})

test('중복 입력은 결과를 두 번 적용하지 않는다', () => {
  const once = finishMission1()
  const twice = apply(once, { type: 'FINISH_MISSION' }, { type: 'CONFIRM_PLAN' }, { type: 'CONFIRM_USAGE', requirementId: 'M1-library' })
  assert.deepEqual(twice, once)
  const next = apply(once, { type: 'NEXT_MISSION' })
  assert.equal(next.run?.missionId, 'M2')
  assert.deepEqual(apply(next, { type: 'NEXT_MISSION' }), next, '결과 화면이 아니면 다음 임무로 다시 넘어가지 않는다')
})

test('7. 임무 2는 관찰·개선·재확인 없이 완료되지 않는다', () => {
  let state = apply(startMission2(), ...M2_PLAN, { type: 'CONFIRM_PLAN' })
  // 건너뛰기를 여러 번 눌러도 관찰에서 멈춘다
  state = apply(state, { type: 'EXEC_SKIP' }, { type: 'EXEC_SKIP' }, { type: 'EXEC_ADVANCE' })
  assert.equal(runOf(state).phase, 'observing')
  assert.equal(runOf(state).rechecked, false)
  // 관찰 중에는 이용 확인·완료가 먹지 않는다
  const forced = apply(state, { type: 'CONFIRM_USAGE', requirementId: 'M2-community' }, { type: 'CONFIRM_USAGE', requirementId: 'M2-park' }, { type: 'FINISH_MISSION' })
  assert.deepEqual(forced, state)

  // 잘못된 개선은 진행되지 않고 점수·예산에 남지 않는다
  const wrong = apply(state, { type: 'CHOOSE_IMPROVEMENT', choiceId: 'recolor_case' })
  assert.equal(runOf(wrong).phase, 'observing')
  assert.equal(runOf(wrong).observation?.chosenId, null)
  assert.equal(runOf(wrong).observation?.wrongAttempts, 1)
  assert.equal(getTotalCost(MISSIONS.M2, runOf(wrong).plan), 74)
  // 없는 선택지도 무시한다
  assert.deepEqual(apply(wrong, { type: 'CHOOSE_IMPROVEMENT', choiceId: 'simplify_menu' }), wrong)

  state = apply(wrong, { type: 'CHOOSE_IMPROVEMENT', choiceId: 'simplify_text' })
  assert.equal(runOf(state).phase, 'executing')
  assert.equal(runOf(state).rechecked, false, '재확인 칸이 실행되기 전')
  state = apply(state, { type: 'EXEC_SKIP' })
  assert.equal(runOf(state).phase, 'verifying')
  assert.equal(runOf(state).rechecked, true)

  state = apply(state, { type: 'CONFIRM_USAGE', requirementId: 'M2-community' }, { type: 'CONFIRM_USAGE', requirementId: 'M2-park' }, { type: 'FINISH_MISSION' })
  assert.equal(runOf(state).phase, 'result')
  assert.equal(state.results.M2?.improvementId, 'simplify_text')
  // 잘못 고른 적이 있어도 감점이 없다
  assert.equal(state.results.M2?.score.usage, 20)
  assert.equal(state.results.M2?.cost, 74)
})

test('7. 관찰을 거치지 않은 상태는 완료로 계산되지 않는다', () => {
  const state = apply(startMission2(), ...M2_PLAN, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_SKIP' })
  // 관찰을 건너뛴 것처럼 꾸민 실행 상태
  const forged: MissionRun = { ...runOf(state), phase: 'verifying', stepIndex: runOf(state).timeline.length, usageConfirmed: ['M2-community', 'M2-park'] }
  const completion = getCompletionState(MISSIONS.M2, forged)
  assert.equal(completion.missionComplete, false)
  assert.equal(computeScore(MISSIONS.M2, forged).byRequirement['M2-community'].usage, 0)
  assert.equal(runOf(apply({ ...state, run: forged }, { type: 'FINISH_MISSION' })).phase, 'verifying')
})

test('12. 두 적격 대안을 살펴본 기록은 자동으로 남고 점수에 반영된다', () => {
  let state = apply(
    startMission1(),
    { type: 'PREVIEW_OPTION', requirementId: 'M1-library', optionId: 'L0' },
    { type: 'PREVIEW_OPTION', requirementId: 'M1-library', optionId: 'L1' },
  )
  state = finishMission1(state)
  assert.equal(state.results.M1?.score.byRequirement['M1-library'].compare, 0, '적격 안 하나만 봤다')
  assert.equal(state.results.M1?.score.total, 80)

  let compared = apply(
    startMission1(),
    { type: 'PREVIEW_OPTION', requirementId: 'M1-library', optionId: 'L1' },
    { type: 'PREVIEW_OPTION', requirementId: 'M1-library', optionId: 'L2' },
    { type: 'OPEN_COMPARE', requirementId: 'M1-school' },
  )
  compared = finishMission1(compared)
  assert.equal(compared.results.M1?.score.compare, 20)
  assert.equal(compared.results.M1?.score.total, 100)
})

test('9. 다시 계획하면 그 임무의 선택·칸·확인이 비워지고 다른 임무 결과는 남는다', () => {
  let state = apply(startMission2(), ...M2_PLAN, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_SKIP' }, { type: 'CHOOSE_IMPROVEMENT', choiceId: 'simplify_text' })
  const m1Result = state.results.M1
  state = apply(state, { type: 'REPLAN_MISSION' })
  const run = runOf(state)
  assert.equal(run.missionId, 'M2')
  assert.equal(run.phase, 'planning')
  assert.deepEqual(Object.values(run.plan.selections), [null, null])
  assert.deepEqual(Object.values(run.plan.starts), [null, null, null])
  assert.equal(run.observation, null)
  assert.equal(run.rechecked, false)
  assert.deepEqual(run.usageConfirmed, [])
  assert.deepEqual(run.timeline, [])
  assert.equal(state.results.M1, m1Result)
  assert.equal(state.results.M2, undefined)
  // 임무 2의 계획에 임무 1의 물품이 섞이지 않는다
  assert.deepEqual(apply(state, { type: 'SELECT_OPTION', requirementId: 'M2-park', optionId: 'L1' }), state)
})

test('세 임무를 마치면 엔딩으로 가고, 잠긴 임무는 열리지 않는다', () => {
  assert.equal(isMissionUnlocked(initialState, 'M2'), false)
  assert.deepEqual(apply(initialState, { type: 'OPEN_MISSION', missionId: 'M3' }), initialState)

  let state = apply(startMission2(), ...M2_PLAN, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_SKIP' }, { type: 'CHOOSE_IMPROVEMENT', choiceId: 'simplify_text' }, { type: 'EXEC_SKIP' })
  state = apply(state, { type: 'CONFIRM_USAGE', requirementId: 'M2-community' }, { type: 'CONFIRM_USAGE', requirementId: 'M2-park' }, { type: 'FINISH_MISSION' }, { type: 'NEXT_MISSION' }, { type: 'BEGIN_PLANNING' })
  assert.equal(runOf(state).missionId, 'M3')
  state = apply(state, ...M3_PLAN, { type: 'CONFIRM_PLAN' }, { type: 'EXEC_SKIP' })
  state = apply(state, { type: 'CONFIRM_USAGE', requirementId: 'M3-park' }, { type: 'CONFIRM_USAGE', requirementId: 'M3-school' }, { type: 'FINISH_MISSION' })
  assert.equal(state.results.M3?.cost, 68)
  assert.ok(isCampaignComplete(state))
  state = apply(state, { type: 'NEXT_MISSION' })
  assert.equal(state.screen, 'ending')
  // 예산은 임무별이며 이월되지 않는다
  assert.equal(state.results.M1?.budget, 82)
  assert.equal(state.results.M2?.budget, 78)
  assert.equal(state.results.M3?.budget, 80)
})
