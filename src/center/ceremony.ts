import { EVALUATION_COMPONENTS, MAX_YEARS, getFinalRank } from './simulation.ts'
import type { EvaluationComponent, EvaluationRecord, GameState, Institution, SeasonReport } from './simulation.ts'

// Presentation only: legacy award tokens remain in saves; ranking and grants are untouched.
export function ceremonyAward(rank: number, final = false): string | null {
  return (final ? ['대상', '최우수상', '우수상'] : ['최우수 운영센터', '우수 운영센터', '장려 운영센터'])[rank - 1] ?? null
}
export const ceremonyTitle = (year: number) => year === MAX_YEARS
  ? '전국 문화체육센터 우수 운영사례 시상식'
  : `${year}년 차 운영성과 평가 · 우수센터 선정`

type Scores = EvaluationRecord['components']
function scoresFor(inst: Institution, year: number, final: boolean): Scores | null {
  const records = inst.evaluations.filter(e => e.year <= year)
  const latest = records.find(e => e.year === year)
  if (!latest) return null
  if (!final) return latest.components
  return Object.fromEntries(EVALUATION_COMPONENTS.map(({key}) => [key,
    records.reduce((sum, e) => sum + e.components[key], 0) / records.length * .5 + latest.components[key] * .5,
  ])) as Scores
}
const categories: Record<EvaluationComponent, {title: string; reason: string}> = {
  reputation: {title: '지역문화 신뢰상', reason: '꾸준한 명성 관리로 지역에서 신뢰받는 센터를 만들었습니다.'},
  financial: {title: '지속가능 운영상', reason: '운영비 충당과 지급 여력을 함께 관리했습니다.'},
  satisfaction: {title: '주민만족 우수상', reason: '실제 이용자의 만족을 높은 수준으로 이끌었습니다.'},
  publicService: {title: '공공서비스 우수상', reason: '공공 수요에 응답하고 주민의 교육 참여를 뒷받침했습니다.'},
}
export interface CategoryAward {key: EvaluationComponent; title: string; reason: string; score: number}
export function ceremonyDetails(game: GameState, report: SeasonReport) {
  const final = game.phase === 'ending'
  const year = report.year
  const scores = scoresFor(game.player, year, final) ?? report.evaluation?.components
  const rank = final ? getFinalRank(game) : report.evaluation?.rank ?? report.rank
  const award = ceremonyAward(rank, final)
  const competitors = [game.player, ...game.rivals].map(inst => ({id: inst.id, scores: scoresFor(inst, year, final)}))
  // No invented comparison when an old save lacks a rival's evaluation record.
  const comparable = competitors.every(c => c.scores !== null)
  const categoryCandidates: CategoryAward[] = !scores || !comparable ? [] : EVALUATION_COMPONENTS.flatMap(({key}) => {
    const best = Math.max(...competitors.map(c => c.scores![key]))
    // Equal best scores are joint winners. At most one category per center, no cash/score reward.
    return scores[key] >= 80 && Math.abs(scores[key] - best) < .000001
      ? [{key, ...categories[key], score: scores[key]}] : []
  })
  const category = categoryCandidates.sort((a,b) => b.score-a.score || a.key.localeCompare(b.key))[0] ?? null
  const strengths = scores ? [...EVALUATION_COMPONENTS].sort((a,b) => scores[b.key]*b.weight-scores[a.key]*a.weight).slice(0,2) : []
  const reason = scores && strengths.length ? strengths.map(c => `${c.label} ${scores[c.key].toFixed(1)}점`).join(' · ') : '저장된 평가 기록을 확인해 주세요.'
  const awarded = Boolean(award || category)
  return {title: ceremonyTitle(year), award, category, awarded, reason,
    reasonLabel: award ? '선정 근거 · 총점 기여가 큰 두 항목' : '이번 평가에서 힘이 된 두 항목',
    image: `/center/ceremonies-v2/y${year}-${awarded ? 'awarded' : 'unawarded'}.webp`,
    imageAlt: `${year}년 차 ${awarded ? '표창을 받고 동료와 기뻐하는 센터 직원들' : '수상하지 못했지만 서로 격려하며 성과를 돌아보는 센터 직원들'}`,
    message: award ? `${strengths.map(c=>c.label).join('과 ')}의 성과가 종합 ${rank}위에 기여했습니다.`
      : category ? '종합상과 별개로, 우리 센터만의 강점을 인정받았습니다.'
      : final ? '종합상 수상에는 이르지 못했지만, 주민과 함께 만든 7년은 소중한 성과입니다.'
      : '이번에는 선정되지 않았지만, 쌓아 온 성과를 바탕으로 다음 평가를 준비해요.',
  }
}
