import type { MusicTrack } from './audio.ts'

/** What the screen is showing, as far as the background music cares. */
export interface MusicScene {
  modal: string | null
  /** The season's news is on screen and it is one of the comic events. */
  comicEvent: boolean
  /** The season's news is on screen and the director is being asked to answer it. */
  eventChoiceShown: boolean
  phase: 'planning' | 'review' | 'ending'
  season: number
  rules3: boolean
  /** The season just settled carried a full evaluation. */
  evaluation: boolean
  awarded: boolean
}

/**
 * Picks the background track. Decisions (an event to answer, the mid-season meeting) get their own music, and under
 * rules 3 everything after a season has run — the tour of results, looking around, the settlement — plays the review
 * track. Older-rules saves keep the tracks they always had.
 */
export function musicTrackFor(scene: MusicScene): MusicTrack {
  const planning: MusicTrack = scene.season < 2 ? 'planning_spring_summer' : 'planning_autumn_winter'
  if (scene.modal === 'season-start' && scene.comicEvent) return 'comic_event'
  if (scene.modal === 'midseason' || (scene.modal === 'season-start' && scene.eventChoiceShown)) return 'decision'
  if (['shop', 'facility', 'campus'].includes(scene.modal ?? '')) return 'procurement'
  if (scene.modal === 'review' && scene.evaluation) return scene.phase === 'ending' ? scene.awarded ? 'final_awarded' : 'final_unawarded' : 'evaluation'
  if (scene.phase !== 'planning') return scene.rules3 ? 'result_review' : scene.modal !== 'review' ? 'operation' : planning
  return planning
}
