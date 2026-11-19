import { BLOCKS, EVALUATION_COMPONENTS, PROGRAMS, RENTAL_TRAITS, ROOM_NAMES, STAFF_MAX_LEVEL, reputationHeadroom, decideRental, freeCash, getEvaluationComponents, getRentalAt, isRentalProgram, previewClass, rentalTraitOf, staffLevel } from './simulation.ts'
import type { EvaluationComponent, Expertise, GameState, RentalRequest, RoomId, SeasonReport, SessionSummary } from './simulation.ts'
import type { EventImpact, MidseasonBrief, StoryKind, StoryRecord } from './simulation.ts'

/** Read-only presentation helpers: none of these change money, plans or scores. */
export type Grade = '매우 좋음' | '좋음' | '보통' | '주의' | '위험'
export const gradeOf = (score: number): Grade => score >= 90 ? '매우 좋음' : score >= 80 ? '좋음' : score >= 70 ? '보통' : score >= 60 ? '주의' : '위험'
export const gradeTone = (grade: Grade): 'good' | 'fair' | 'warn' => grade === '매우 좋음' || grade === '좋음' ? 'good' : grade === '보통' ? 'fair' : 'warn'
export const trendOf = (now: number, before: number | undefined, tolerance = .5): 'up' | 'down' | 'flat' | 'new' => before === undefined ? 'new' : now - before > tolerance ? 'up' : before - now > tolerance ? 'down' : 'flat'
export const programName = (id: string) => PROGRAMS.find(program => program.id === id)?.shortName ?? id
export const sessionNet = (session: SessionSummary) => Math.round((session.revenue - session.cost) * 100) / 100
export const FIELD_NAMES: Record<Expertise, string> = { culture: '문화', sport: '체육', event: '행사' }

/** The report that settled immediately before `report`, if this save still holds it. */
export function previousReport(game: GameState, report: SeasonReport): SeasonReport | undefined {
  const index = game.history.findIndex(entry => entry.year === report.year && entry.season === report.season)
  return index > 0 ? game.history[index - 1] : undefined
}

export interface SeasonDelta { key: string; label: string; value: number; before?: number; unit: 'won' | 'count' | 'point' }
export function seasonDeltas(game: GameState, report: SeasonReport): SeasonDelta[] {
  const before = previousReport(game, report)
  return [
    { key: 'visits', label: '이용', value: report.visits, before: before?.visits, unit: 'count' },
    { key: 'profit', label: '운영수지', value: report.profit, before: before?.profit, unit: 'won' },
    { key: 'reputation', label: '명성 변화', value: report.reputationChange, before: before?.reputationChange, unit: 'point' },
  ]
}

/** Sessions ordered room by room for the operation tour; empty hours are not visited. */
export function sessionsInTourOrder(report: SeasonReport | null | undefined): SessionSummary[] {
  return [...(report?.sessions ?? [])].filter(session => session.weeks > 0).sort((a, b) => a.room.localeCompare(b.room) || a.slot - b.slot)
}
export function sessionAt(report: SeasonReport | null | undefined, room: RoomId, slot: number): SessionSummary | undefined {
  return report?.sessions?.find(session => session.room === room && session.slot === slot && session.weeks > 0)
}

/** Illustration that sums up how a class or let went this season; null for an ordinary season. */
export function outcomeArt(session: SessionSummary): { src: string; alt: string } | null {
  if (session.mood === 'hot') return { src: '/center/outcomes-v1/mood-hot.webp', alt: '입소문이 퍼져 신청하려는 주민이 줄을 선 모습' }
  if (session.mood === 'cold') return { src: '/center/outcomes-v1/mood-cold.webp', alt: '비 오는 날 한산한 교실' }
  const kind = PROGRAMS.find(program => program.id === session.program)?.kind
  // Lets only get a scene when they are stage or presentation events; a meeting has no class to show.
  const field = kind === 'event' || (!session.rental && (kind === 'culture' || kind === 'sport')) ? kind : null
  const [great, , , poor] = session.tally, drawn = session.tally.reduce((a, b) => a + b, 0)
  if (!field || !drawn) return null
  const name = { culture: '공예·문화 수업', sport: '체육 수업', event: '행사' }[field]
  if (poor / drawn >= .3 && poor > great) return { src: `/center/outcomes-v1/poor-${field}.webp`, alt: `${name}에서 작은 실수가 있었던 모습` }
  if (great / drawn >= .25 && great >= poor) return { src: `/center/outcomes-v1/great-${field}.webp`, alt: `${name}이 큰 호응을 얻은 모습` }
  return null
}
/** The sound for a session's result card: the season's mood first, then a run of weeks worth a sting, otherwise a tick for money made or lost. */
export function sessionSound(session: SessionSummary): 'mood_hot' | 'mood_cold' | 'outcome_great' | 'outcome_poor' | 'delta_up' | 'delta_down' {
  if (session.mood === 'hot') return 'mood_hot'
  if (session.mood === 'cold') return 'mood_cold'
  const [great, , , poor] = session.tally, drawn = session.tally.reduce((a, b) => a + b, 0)
  if (drawn && poor / drawn >= .3 && poor > great) return 'outcome_poor'
  if (drawn && great / drawn >= .25 && great >= poor) return 'outcome_great'
  return sessionNet(session) >= 0 ? 'delta_up' : 'delta_down'
}
/** The one cue that follows the settlement sound: the rarest thing that happened this season. */
export function reviewCue(report: SeasonReport, milestone: number | null): 'trust_milestone' | 'level_up' | 'training_done' | 'briefing_open' {
  if (milestone) return 'trust_milestone'
  if (report.training?.some(result => result.leveledUp)) return 'level_up'
  if (report.training?.length) return 'training_done'
  return 'briefing_open'
}
export const TRUST_MILESTONES = [100, 150, 200] as const
/** The highest trust milestone passed between two values, or null. Each is shown in the season it is reached. */
export function trustMilestone(before: number, after: number): number | null {
  return [...TRUST_MILESTONES].reverse().find(mark => before < mark && after >= mark) ?? null
}
export const TRUST_MILESTONE_LINES: Record<number, string> = { 100: '주민들이 직원을 이름으로 부르며 인사를 건네요. 텃밭 채소를 나눠 주시는 분도 생겼어요.', 150: '로비 벽이 감사 쪽지와 아이들 그림으로 가득 찼어요.', 200: '온 동네가 센터 앞에 모여 함께 사진을 찍었어요.' }
export const STORY_ART: Record<StoryKind, string> = { exhibition: '/center/stories-v1/exhibition.webp', graduation: '/center/stories-v1/graduation.webp', contest: '/center/stories-v1/contest.webp', 'new-friend': '/center/stories-v1/new-friend.webp', 'teacher-letter': '/center/stories-v1/teacher-letter.webp' }
export const STORY_TITLES: Record<StoryKind, string> = { exhibition: '첫 작품전', graduation: '수료식', contest: '대회에서 받아 온 트로피', 'new-friend': '수업에서 만난 단짝', 'teacher-letter': '강사님께 온 손편지' }
/** What a class that has run season after season has come to mean to the people in it. */
export function storyLine(story: StoryRecord): string {
  const name = PROGRAMS.find(program => program.id === story.program)?.name ?? story.program
  const lines: Record<StoryKind, string> = {
    exhibition: `${name} 수강생들이 복도에 첫 작품전을 열었어요. 떨리는 손으로 작품을 걸었대요.`,
    graduation: `${name} 수강생들이 수료식을 했어요. 수료증을 든 얼굴마다 뿌듯함이 가득해요.`,
    contest: `${name} 수강생들이 지역 대회에서 작은 트로피를 받아 왔어요. 강사님이 눈물을 훔쳤대요.`,
    'new-friend': `${name}에서 만난 두 주민이 나이를 넘어 단짝이 됐어요. 수업이 끝나면 라운지에서 차를 마신대요.`,
    'teacher-letter': `${name} 강사님이 수강생들의 손편지를 받았어요. 빈 교실에서 한참을 읽으셨대요.`,
  }
  return lines[story.kind]
}
/** What an answered event changed beyond money and reputation. Empty for the plain events. */
export function eventImpactNotes(impact: EventImpact): string[] {
  const notes: string[] = []
  if (impact.repaired !== undefined) notes.push(impact.repaired ? `설치한 장비 ${impact.repaired}개 상태 회복` : '손볼 장비가 없었어요')
  if (impact.closed !== undefined) notes.push(impact.closed ? `한 주 동안 수업·대관 ${impact.closed}회 휴강` : '쉬어 간 수업 없음')
  if (impact.featured) notes.push(`${ROOM_NAMES[impact.featured.room]} ${programName(impact.featured.program)} 한 계절 ${impact.featured.mood === 'hot' ? '호조' : '부진'}`)
  if (impact.audience) notes.push(`주민 ${impact.audience}명 참여`)
  if (impact.learned) notes.push(`${FIELD_NAMES[impact.learned.kind]} 교육 점수 +${impact.learned.gain}`)
  if (impact.trust) notes.push(`신뢰 ${impact.trust > 0 ? '+' : '−'}${Math.abs(impact.trust)}`)
  if (impact.financial) notes.push(`재정 건전성 +${impact.financial}점`)
  if (impact.noTraining) notes.push('직원 교육은 쉬어 감')
  return notes
}
/** What the first six weeks suggest for the mid-season decision. Always at least two lines. */
export function midseasonAdvice(brief: MidseasonBrief): string[] {
  const lines: string[] = []
  const share = brief.classSeats ? Math.round(brief.emptySeats / brief.classSeats * 100) : 0
  lines.push(!brief.classSeats ? '지금까지 연 수업이 없어 홍보로 채울 자리가 없어요.' : brief.openClasses ? `수업 좌석의 ${share}%가 비었어요. ${brief.openClasses > 5 ? `빈자리가 있는 수업 ${brief.openClasses}개 가운데 가장 빈 다섯 개에 홍보가 닿아요.` : `빈자리가 있는 수업 ${brief.openClasses}개에 홍보가 닿아요.`}` : '수업이 모두 가득 차서 홍보로 더 채울 자리가 없어요.')
  const low = brief.lowestRoom && brief.lowestRoom.management < 60 ? brief.lowestRoom : null
  lines.push(low || brief.wornItems ? `${low ? `${ROOM_NAMES[low.id]} 관리상태가 ${Math.round(low.management)}까지 내려갔어요. ` : ''}${brief.wornItems ? `상태 60 미만인 장비가 ${brief.wornItems}개예요. ` : ''}정비하면 남은 수업의 만족도가 올라요.` : '공간과 장비 상태는 양호해요. 급한 정비는 없어요.')
  if (brief.canceled) lines.push(`여섯 주 동안 쉬어 간 수업·대관이 ${brief.canceled}회 있었어요.`)
  return lines
}
export interface RentalForecast { net: number; seasonNet: number; reputation: number; publicService: boolean; learning: boolean; wear: '낮음' | '보통' | '높음'; mood: number }
/** What accepting a request means beyond rent. Season figures assume all 13 weeks run. */
export function rentalForecast(request: RentalRequest, reputation = 30): RentalForecast {
  const trait = rentalTraitOf(request), soft = reputationHeadroom(reputation)
  const net = Math.round((request.fee - request.cost) * 100) / 100
  return {
    net, seasonNet: Math.round(net * 13 * 100) / 100,
    reputation: Math.round((trait ? trait.reputation * soft : .002) * 13 * 100) / 100,
    publicService: Boolean(trait?.publicShare), learning: Boolean(trait?.learning),
    wear: !trait || trait.wear <= .9 ? (trait ? '낮음' : '보통') : trait.wear >= 2 ? '높음' : '보통', mood: trait?.satisfaction ?? 0,
  }
}

export interface ReplacementComparison { classProfit: number; classAttendees: number; classReputation: number; classPublic: boolean; rentalNet: number; rentalReputation: number; weeklyDifference: number; seasonDifference: number; assumed: boolean }
/** Weekly money and standing given up when an accepted let replaces a scheduled class. */
export function replacementComparison(game: GameState, request: RentalRequest): ReplacementComparison | null {
  const program = game.player.plan[request.room][request.slot]
  if (!program || isRentalProgram(program)) return null
  const outlook = previewClass(game, request.room, program, request.slot), forecast = rentalForecast(request, game.player.reputation)
  const weeklyDifference = Math.round((forecast.net - outlook.profit) * 100) / 100
  return { classProfit: outlook.profit, classAttendees: outlook.attendees, classReputation: outlook.reputation, classPublic: Boolean(outlook.publicService), rentalNet: forecast.net, rentalReputation: Math.round(forecast.reputation / 13 * 100) / 100, weeklyDifference, seasonDifference: Math.round(weeklyDifference * 13 * 100) / 100, assumed: outlook.assumed }
}

export interface RentalReviewRoom { room: RoomId; undecided: number; accepted: number; total: number }
/**
 * Rooms that received rental requests this season and how many still need a decision.
 * A pending request whose hour already has an approved rental is no longer waiting.
 */
export function rentalReviewRooms(game: GameState): RentalReviewRoom[] {
  const requests = game.player.rentalRequests
  return game.player.rooms.filter(room => room.open).map(room => {
    const mine = requests.filter(request => request.room === room.id)
    return { room: room.id, total: mine.length, accepted: mine.filter(request => request.status === 'accepted').length, undecided: mine.filter(request => request.status === 'pending' && !getRentalAt(game.player, request.room, request.slot)).length }
  }).filter(item => item.total > 0)
}
export type RentalPriority = 'income' | 'reputation' | 'public'
export const RENTAL_PRIORITY_LABELS: Record<RentalPriority, string> = { income: '수입 우선', reputation: '명성 우선', public: '공공서비스 우선' }
/** One-click review: for every free hour, approve the request that best serves the chosen priority. */
export function autoPickRentals(game: GameState, priority: RentalPriority): { state: GameState; approved: number; skipped: number } {
  let state = game, approved = 0, skipped = 0
  const worth = (request: RentalRequest) => {
    const forecast = rentalForecast(request, game.player.reputation), trait = rentalTraitOf(request)
    return priority === 'income' ? forecast.net : priority === 'reputation' ? forecast.reputation * 100 + forecast.net * .01 : (trait?.publicShare ?? 0) * 1000 + (trait?.learning ?? 0) * 600 + (trait?.satisfaction ?? 0) * 10 + forecast.net * .01
  }
  const hours = new Map<string, RentalRequest[]>()
  for (const request of game.player.rentalRequests) hours.set(`${request.room}:${request.slot}`, [...(hours.get(`${request.room}:${request.slot}`) ?? []), request])
  for (const requests of hours.values()) {
    const { room, slot } = requests[0]!
    if (getRentalAt(state.player, room, slot)) continue
    if (state.player.plan[room][slot]) { skipped++; continue }
    const best = requests.filter(request => request.status !== 'accepted').sort((a, b) => worth(b) - worth(a) || a.id.localeCompare(b.id))[0]
    if (!best) continue
    const result = decideRental(state, best.id, 'accepted')
    if (result.error) skipped++; else { state = result.state; approved++ }
  }
  return { state, approved, skipped }
}

/** Where the centre stands among the ten on one evaluation item; never the hidden score itself. */
export type Standing = '선두권' | '중위권' | '하위권'
export const standingOf = (rank: number): Standing => rank <= 3 ? '선두권' : rank <= 7 ? '중위권' : '하위권'
export const standingTone = (standing: Standing): 'good' | 'fair' | 'warn' => standing === '선두권' ? 'good' : standing === '중위권' ? 'fair' : 'warn'
export interface OperatingProfile {
  style: string; traits: string[]; summary: string
  balance: { key: EvaluationComponent; label: string; standing: Standing; rank: number; score: number; weakest: boolean; strongest: boolean }[]
  strategies: string[]
}
/** Jiseon's reading of how the centre has been run so far and what to do next. */
export function operatingProfile(game: GameState, report: SeasonReport): OperatingProfile {
  const player = game.player, rules3 = game.rules === 3
  const recent = game.history.slice(-4), all = game.history
  const sum = (list: SeasonReport[], read: (r: SeasonReport) => number) => list.reduce((n, r) => n + read(r), 0)
  const rental = sum(recent, r => r.rentalRevenue ?? 0), classes = sum(recent, r => r.classRevenue ?? 0)
  const rentShare = rental + classes > 0 ? rental / (rental + classes) : 0
  const classVisits = sum(recent, r => r.serviceMix?.classVisits ?? 0), freeVisits = sum(recent, r => r.serviceMix?.freeClassVisits ?? 0)
  const freeShare = classVisits > 0 ? freeVisits / classVisits : 0
  const style = classVisits === 0 ? rental > 0 ? '대관 전문 운영' : '준비 중인 센터' : rentShare > .65 ? '대관 중심 안정형' : rentShare < .35 ? '수업 중심 성장형' : '균형 운영형'
  const traits: string[] = []
  if (freeShare > .5) traits.push('공익 서비스 지향'); else if (classVisits > 0 && freeShare < .15) traits.push('유료 강좌 중심')
  const specialties = new Set(Object.values(player.plan).flat().filter(id => id && PROGRAMS.find(p => p.id === id)?.exclusiveRoom))
  if (specialties.size >= 3) traits.push('전문 강좌 특화')
  const openRooms = player.rooms.filter(room => room.open).length
  if (openRooms >= 6 || player.inventory.length >= 12) traits.push('확장 투자형')
  if (freeCash(player) > player.annualBudget * 1.5) traits.push('신중한 저축형')
  const levels = (['culture', 'sport', 'event'] as Expertise[]).map(kind => ({ kind, level: staffLevel(player.xp[kind], game.rules) }))
  if (rules3 && levels.some(entry => entry.level >= 3)) traits.push('직원 교육 중시')
  const commercial = recent.length ? player.rentalRequests.filter(request => request.status === 'accepted' && request.trait === 'commercial').length : 0
  if (commercial >= 3) traits.push('상업 행사 유치')

  const components = getEvaluationComponents(player, game.rules), others = game.rivals.map(rival => getEvaluationComponents(rival, game.rules))
  // Rank each item against the nine rivals, then weigh how many points catching the leader would add.
  const gaps = EVALUATION_COMPONENTS.map(item => {
    const score = components[item.key], rank = 1 + others.filter(other => other[item.key] > score + .005).length
    const best = Math.max(score, ...others.map(other => other[item.key]))
    return { ...item, score, rank, gap: (best - score) * item.weight }
  })
  const weakestKey = [...gaps].sort((a, b) => b.gap - a.gap || b.rank - a.rank)[0]!.key, strongestKey = [...gaps].sort((a, b) => a.rank - b.rank || b.score - a.score)[0]!.key
  const balance = gaps.map(item => ({ key: item.key, label: item.label, standing: standingOf(item.rank), rank: item.rank, score: item.score, weakest: item.key === weakestKey && item.gap > 0, strongest: item.key === strongestKey }))
  const spread = Math.max(...gaps.map(g => g.rank)) - Math.min(...gaps.map(g => g.rank))
  const share = Math.round(rentShare * 100)
  const summary = classVisits === 0 && rental === 0 ? '아직 운영 기록이 쌓이지 않았어요. 대관과 수업을 하나씩 열어 볼까요?'
    : `최근 ${recent.length}계절 수입의 ${share}%가 대관, ${100 - share}%가 수업이에요.${classVisits ? ` 수업 참여의 ${Math.round(freeShare * 100)}%는 무료 강좌예요.` : ''} ${spread <= 2 || !balance.some(b => b.weakest) ? '네 평가 항목이 다른 센터와 비교해 고르게 자라고 있어요.' : `다른 센터와 견주면 ${balance.find(b => b.strongest)!.label}은 앞서고 ${balance.find(b => b.weakest)!.label}은 뒤처져 있어요.`}`

  const strategies: string[] = []
  // 1. Staff training where bad weeks pile up.
  if (rules3) {
    const tally: Record<Expertise, { poor: number; total: number }> = { culture: { poor: 0, total: 0 }, sport: { poor: 0, total: 0 }, event: { poor: 0, total: 0 } }
    for (const entry of recent) for (const session of entry.sessions ?? []) {
      const kind = PROGRAMS.find(p => p.id === session.program)?.kind
      if (session.rental || !kind || kind === 'community') continue
      tally[kind].poor += session.tally[3]; tally[kind].total += session.tally.reduce((a, b) => a + b, 0)
    }
    const worst = (Object.entries(tally) as [Expertise, { poor: number; total: number }][]).filter(([, v]) => v.total >= 13).sort((a, b) => b[1].poor / b[1].total - a[1].poor / a[1].total)[0]
    if (worst) {
      const level = levels.find(entry => entry.kind === worst[0])!.level, rate = Math.round(worst[1].poor / worst[1].total * 100)
      if (rate >= 15 && level < STAFF_MAX_LEVEL) strategies.push(`${FIELD_NAMES[worst[0]]} 수업의 ${rate}%가 '아쉬움'으로 끝났어요. ${FIELD_NAMES[worst[0]]} 직원 교육(현재 Lv.${level})을 올리면 아쉬운 주와 부진한 계절이 줄어요.`)
    }
    const cold = (report.sessions ?? []).filter(session => !session.rental && session.mood === 'cold' && sessionNet(session) < 0)
    if (cold.length) strategies.push(`${ROOM_NAMES[cold[0]!.room]} ${BLOCKS[cold[0]!.slot]} ${programName(cold[0]!.program)}이 부진한 계절을 보냈어요. 다음 계절에도 부진하면 시간대나 수업을 바꿔 보세요.`)
  }
  // 2. The component holding the total back.
  const weakest = balance.find(b => b.weakest)
  if (weakest) strategies.push(({
    reputation: rules3 ? '다른 센터보다 명성이 가장 뒤처져요. 명성은 만족도가 높은 수업에서 크게 올라요. 직원 교육과 정비로 수업의 질을 올리고, 공공서비스가 낮으면 명성도 더디게 오르니 함께 챙기세요. 같은 시간이라면 지역 예술 단체 대관도 도움이 돼요.' : '명성이 가장 뒤처져요. 실제 참여가 있는 명성 기여 수업을 늘려 보세요.',
    financial: rules3 ? '다른 센터보다 재정이 가장 약해요. 기업·상업 행사 대관과 수업차익이 좋은 강좌로 자체 수입을 늘려 보세요. 보조금만으로는 만점이 되지 않아요.' : '재정이 가장 약해요. 다음 계절 운영비를 남기고 대관·흑자 강좌로 지출을 충당하세요.',
    satisfaction: rules3 ? '다른 센터보다 주민 만족이 가장 약해요. 직원 교육과 정비로 아쉬운 주를 줄이고, 시설 부담이 큰 상업 행사는 조금 덜어 보세요.' : '주민 만족이 가장 약해요. 휴강을 줄이고 장비 상태와 시설 관리를 챙겨 보세요.',
    publicService: rules3 ? '다른 센터보다 공공서비스가 가장 약해요. 무료 강좌와 주민 공익 모임 대관, 교육·세미나 대관을 늘려 보세요.' : '공공서비스가 가장 약해요. 공공 신청 수요에 맞는 수업 참여를 늘려 보세요.',
  })[weakest.key])
  // 3. Idle capacity or idle money.
  const emptySlots = player.rooms.filter(room => room.open).reduce((n, room) => n + player.plan[room.id].filter(id => !id).length, 0)
  const lastEmpty = report.sessions ? player.rooms.filter(room => room.open).length * 5 - report.sessions.filter(session => session.weeks > 0).length : emptySlots
  if (lastEmpty >= 6) strategies.push(`지난 계절 ${lastEmpty}칸이 비어 있었어요. 신청 수요가 남은 수업이나 대관으로 채우면 이용과 명성이 함께 올라요.`)
  if (freeCash(player) > player.annualBudget * 1.5) strategies.push('쓸 수 있는 예산이 넉넉해요. 새 공간 입찰, 전용 장비, 실내 리모델링처럼 오래 가는 투자를 검토해 보세요.')
  if (all.length >= 4 && rentShare > .75 && classVisits > 0) strategies.push('수입 대부분이 대관이에요. 대관은 교육 참여 실적이 되지 않으니, 인기 시간 한두 칸은 수업에 내어 주세요.')
  if (!strategies.length) strategies.push('지금의 균형이 좋아요. 약해지는 항목이 생기는지 계절마다 등급을 살펴보세요.')
  return { style, traits: traits.slice(0, 3), summary, balance, strategies: strategies.slice(0, 3) }
}
/** Keeps unused-import checks honest for trait labels shown by callers. */
export const RENTAL_TRAIT_LABELS = Object.fromEntries(Object.entries(RENTAL_TRAITS).map(([key, value]) => [key, value.label])) as Record<keyof typeof RENTAL_TRAITS, string>
