import { constructionTurns, expectedConstructionCompletion } from './facilityProjects'
import { SEASONS } from './simulation'
import type { GameState } from './simulation'

export default function ConstructionTiming({ game, weeks }: { game: Pick<GameState, 'year' | 'season' | 'phase'>; weeks: number }) {
  const completion = expectedConstructionCompletion(game, weeks)
  return <span className={`construction-timing ${completion && !completion.withinGame ? 'is-after-term' : ''}`}>
    <b>{constructionTurns(weeks)}턴<small> · {weeks}주</small></b>
    {completion && <small>{completion.year}년 {SEASONS[completion.season]} {completion.week}주차 예정{!completion.withinGame && <em>임기 종료 후</em>}</small>}
  </span>
}
