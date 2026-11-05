// GAME_SPEC 11장의 필수 검사 가운데 규칙·수치에 관한 항목. 실행: npm test
import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildTimeline,
  enumerateValidPlans,
  getEligibilityIssues,
  getEligibleOptions,
  getJobs,
  getOccupiedSlots,
  getTotalCost,
  isEligible,
  isPlanValid,
  validatePlan,
} from '../src/game/engine.ts'
import { MISSIONS, MISSION_ORDER } from '../src/game/missions.ts'
import type { Plan, Requirement, SupplyOption } from '../src/game/types.ts'

const { M1, M2, M3 } = MISSIONS

function plan(selections: Record<string, string>, starts: Record<string, number>): Plan {
  return { selections, starts }
}

function codes(mission: typeof M1, value: Plan): string[] {
  return validatePlan(mission, value).map((issue) => issue.code)
}

function comboKey(value: Plan): string {
  return Object.values(value.selections).join('+')
}

test('1. 모든 요구에 안전 확인과 필수 기능을 통과한 대안이 2개 이상이다', () => {
  for (const id of MISSION_ORDER) {
    for (const requirement of MISSIONS[id].requirements) {
      assert.equal(getEligibleOptions(MISSIONS[id], requirement.id).length, 2, requirement.id)
      assert.equal(requirement.optionIds.length, 3, `${requirement.id}의 비교 카드는 3장`)
    }
  }
})

test('2. 각 임무의 실행 가능한 공급안 조합은 정확히 3개이고 배치 수가 명세와 같다', () => {
  const expected: Record<string, Record<string, number>> = {
    M1: { 'L1+S1': 2, 'L1+S2': 3, 'L2+S1': 3 },
    M2: { 'I1+G1': 6, 'I1+G2': 14, 'I2+G1': 9 },
    M3: { 'P1+E1': 3, 'P1+E2': 4, 'P2+E1': 5 },
  }
  for (const id of MISSION_ORDER) {
    const counts: Record<string, number> = {}
    for (const valid of enumerateValidPlans(MISSIONS[id])) counts[comboKey(valid)] = (counts[comboKey(valid)] ?? 0) + 1
    assert.deepEqual(counts, expected[id], id)
  }
})

test('명세의 예시 계획이 그대로 통과한다', () => {
  assert.ok(isPlanValid(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 4 })))
  assert.equal(getTotalCost(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, {})), 70)
  assert.ok(
    isPlanValid(
      M2,
      plan({ 'M2-community': 'I1', 'M2-park': 'G1' }, { 'M2-park': 1, 'M2-community': 3, 'M2-community-recheck': 5 }),
    ),
  )
  assert.equal(getTotalCost(M2, plan({ 'M2-community': 'I1', 'M2-park': 'G1' }, {})), 66)
  assert.ok(isPlanValid(M3, plan({ 'M3-park': 'P1', 'M3-school': 'E1' }, { 'M3-school': 1, 'M3-park': 3 })))
  assert.equal(getTotalCost(M3, plan({ 'M3-park': 'P1', 'M3-school': 'E1' }, {})), 68)
})

test('3. 도착 이전·마감 초과·한 칸 겹침·예산 초과를 각각 차단한다', () => {
  // 도착 이전: S1은 2번 칸부터
  assert.ok(codes(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, { 'M1-school': 1, 'M1-library': 4 })).includes('before_ready'))
  // 마감 초과: 학교 마감은 3번 칸
  assert.ok(codes(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, { 'M1-school': 3, 'M1-library': 1 })).includes('past_deadline'))
  // 한 칸 겹침: 도서관 1~2, 학교 2~3
  assert.deepEqual(codes(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 1 })), ['slot_conflict'])
  // 예산 초과: 고가 조합은 시간 배치가 되어도 8점 초과
  const pricey = plan({ 'M1-library': 'L2', 'M1-school': 'S2' }, { 'M1-school': 3, 'M1-library': 4 })
  assert.deepEqual(codes(M1, pricey), ['over_budget'])
  assert.match(validatePlan(M1, pricey)[0].message, /8점/)
  assert.deepEqual(
    codes(M2, plan({ 'M2-community': 'I2', 'M2-park': 'G2' }, { 'M2-community': 2, 'M2-community-recheck': 3, 'M2-park': 4 })),
    ['over_budget'],
  )
  assert.deepEqual(codes(M3, plan({ 'M3-park': 'P2', 'M3-school': 'E2' }, { 'M3-school': 2, 'M3-park': 4 })), ['over_budget'])
})

test('예산을 1점만 넘어도 차단한다', () => {
  const tight = { ...M1, budget: 81 }
  const exact = plan({ 'M1-library': 'L2', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 4 })
  assert.deepEqual(codes(tight, exact), ['over_budget'])
  assert.match(validatePlan(tight, exact)[0].message, /1점/)
})

test('4. 예산을 정확히 82·78·80 쓰는 계획을 허용한다', () => {
  const m1 = plan({ 'M1-library': 'L2', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 4 })
  assert.equal(getTotalCost(M1, m1), 82)
  assert.ok(isPlanValid(M1, m1))
  const m2 = plan({ 'M2-community': 'I2', 'M2-park': 'G1' }, { 'M2-park': 1, 'M2-community': 3, 'M2-community-recheck': 4 })
  assert.equal(getTotalCost(M2, m2), 78)
  assert.ok(isPlanValid(M2, m2))
  const m3 = plan({ 'M3-park': 'P2', 'M3-school': 'E1' }, { 'M3-school': 1, 'M3-park': 4 })
  assert.equal(getTotalCost(M3, m3), 80)
  assert.ok(isPlanValid(M3, m3))
})

test('5. 길이 2를 2번 칸에서 시작하면 2·3번 칸만 쓴다', () => {
  assert.deepEqual(getOccupiedSlots(2, 2), [2, 3])
  assert.deepEqual(getOccupiedSlots(4, 1), [4])
})

test('6. 임무 2의 개선비·개선 칸·순서·마감을 지킨다', () => {
  const selections = { 'M2-community': 'I1', 'M2-park': 'G2' }
  // 개선비 8점은 아무것도 고르기 전부터 포함된다
  assert.equal(getTotalCost(M2, plan({}, {})), 8)
  assert.equal(getTotalCost(M2, plan(selections, {})), 42 + 8 + 24)
  // 개선 칸 누락
  assert.deepEqual(codes(M2, plan(selections, { 'M2-community': 1, 'M2-park': 4 })), ['recheck_not_placed'])
  // 초기 설치(1~2)와 같은 칸의 재확인
  const same = codes(M2, plan(selections, { 'M2-community': 1, 'M2-community-recheck': 2, 'M2-park': 4 }))
  assert.ok(same.includes('recheck_order'))
  // 설치보다 앞선 재확인
  assert.ok(codes(M2, plan(selections, { 'M2-community': 2, 'M2-community-recheck': 1, 'M2-park': 4 })).includes('recheck_order'))
  // 6번 칸의 재확인
  assert.deepEqual(codes(M2, plan(selections, { 'M2-community': 1, 'M2-community-recheck': 6, 'M2-park': 4 })), ['recheck_past_deadline'])
  // 설치 바로 다음 칸은 가능
  assert.ok(isPlanValid(M2, plan(selections, { 'M2-community': 1, 'M2-community-recheck': 3, 'M2-park': 4 })))
})

test('8. 계획을 고쳐도 비용과 점유 칸이 누적되지 않는다', () => {
  const first = plan({ 'M1-library': 'L2', 'M1-school': 'S2' }, {})
  const second = plan({ 'M1-library': 'L1', 'M1-school': 'S2' }, {})
  assert.equal(getTotalCost(M1, first), 90)
  assert.equal(getTotalCost(M1, second), 78)
  const jobs = getJobs(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S2' }, { 'M1-library': 1, 'M1-school': 3 }))
  assert.equal(jobs.length, 2)
  assert.deepEqual(jobs.map((job) => [job.id, job.startSlot, job.duration]), [['M1-library', 1, 2], ['M1-school', 3, 1]])
})

test('11. 부적격 제시안도 목록에 남고, 잠정 선택하면 이유를 알리며 확정을 막는다', () => {
  const ineligible: [typeof M1, string, string][] = [
    [M1, 'M1-library', 'L0'],
    [M1, 'M1-school', 'S0'],
    [M2, 'M2-community', 'I0'],
    [M2, 'M2-park', 'G0'],
    [M3, 'M3-park', 'P0'],
    [M3, 'M3-school', 'E0'],
  ]
  for (const [mission, requirementId, optionId] of ineligible) {
    const requirement = mission.requirements.find((item) => item.id === requirementId) as Requirement
    assert.ok(requirement.optionIds.includes(optionId), `${optionId}는 비교 목록에 있다`)
    assert.ok(!getEligibleOptions(mission, requirementId).some((item) => item.id === optionId))
    const other = mission.requirements.find((item) => item.id !== requirementId) as Requirement
    const partner = getEligibleOptions(mission, other.id)[0]
    const issues = validatePlan(mission, plan({ [requirementId]: optionId, [other.id]: partner.id }, {}))
    const blocked = issues.find((issue) => issue.code === 'feature_missing')
    assert.ok(blocked, `${optionId} 확정 차단`)
    assert.match(blocked.message, /충족하지 못해 확정할 수 없어요/)
    // 불충족 기능마다 사용상 설명이 있다
    for (const issue of getEligibilityIssues(requirement, mission.options[optionId])) {
      assert.ok(issue.kind === 'feature' && mission.options[optionId].featureNotes[issue.feature])
    }
  }
})

test('11. 안전 확인이 없는 안은 기능을 갖춰도 확정할 수 없다', () => {
  const unsafe: SupplyOption = { ...M1.options.L1, id: 'LX', safetyPass: false }
  const mission = {
    ...M1,
    options: { ...M1.options, LX: unsafe },
    requirements: M1.requirements.map((item) => (item.id === 'M1-library' ? { ...item, optionIds: [...item.optionIds, 'LX'] } : item)),
  }
  assert.ok(!isEligible(mission.requirements[0], unsafe))
  const issues = validatePlan(mission, plan({ 'M1-library': 'LX', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 4 }))
  assert.deepEqual(issues.map((issue) => issue.code), ['safety_missing'])
  assert.match(issues[0].message, /안전확인/)
})

test('13. 적격 안은 모두 필수 기능을 갖추되 사용 모습이 서로 다르다', () => {
  const pairs: [typeof M1, string, string][] = [
    [M1, 'L1', 'L2'],
    [M1, 'S1', 'S2'],
    [M3, 'E1', 'E2'],
    [M2, 'I1', 'I2'],
    [M2, 'G1', 'G2'],
    [M3, 'P1', 'P2'],
  ]
  for (const [mission, a, b] of pairs) {
    const first = mission.options[a]
    const second = mission.options[b]
    const requirement = mission.requirements.find((item) => item.id === first.requirementId) as Requirement
    assert.ok(isEligible(requirement, first) && isEligible(requirement, second))
    assert.notEqual(first.visual, second.visual, `${a}/${b}의 연출이 다르다`)
    assert.ok(first.rationaleText.length > 0 && second.rationaleText.length > 0)
    // 어느 한쪽도 비용·도착·설치 모두에서 우월하지 않다
    const dominates = (x: SupplyOption, y: SupplyOption) => x.cost <= y.cost && x.readySlot <= y.readySlot && x.duration <= y.duration
    assert.ok(!dominates(first, second) && !dominates(second, first), `${a}/${b}에 장단점이 있다`)
  }
  assert.equal(M1.options.S1.visual, M3.options.E1.visual)
  assert.equal(M1.options.S2.visual, M3.options.E2.visual)
})

test('실행 단계는 도착 → 설치 → 기관 확인 순서이며 임무 2는 관찰 뒤에 재확인이 온다', () => {
  const m1 = buildTimeline(M1, plan({ 'M1-library': 'L1', 'M1-school': 'S1' }, { 'M1-school': 2, 'M1-library': 4 }))
  assert.deepEqual(
    m1.map((step) => `${step.slot}:${step.kind}:${step.requirementId.split('-')[1]}`),
    ['1:arrive:library', '2:arrive:school', '2:install:school', '3:install:school', '3:installed:school', '4:install:library', '5:install:library', '5:installed:library'],
  )
  const m2 = buildTimeline(M2, plan({ 'M2-community': 'I1', 'M2-park': 'G2' }, { 'M2-community': 1, 'M2-community-recheck': 3, 'M2-park': 4 }))
  const kinds = m2.map((step) => step.kind)
  const installed = m2.findIndex((step) => step.kind === 'installed' && step.requirementId === 'M2-community')
  assert.equal(kinds[installed + 1], 'observe')
  assert.ok(kinds.indexOf('recheck') > kinds.indexOf('observe'))
  assert.equal(kinds.filter((kind) => kind === 'observe').length, 1)
})
