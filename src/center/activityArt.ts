import type { ProgramId } from './simulation'

/** Separate assets for choosing a course and viewing its actual operation. */
export const courseSymbolPath = (program: ProgramId) => `/center/course-symbols-v4/${program}.webp`
export const activityStillPath = (program: string) => /^P(0[1-9]|[12][0-9]|3[0-8])$/.test(program) ? `/center/activities-v4/${program}.webp` : null
/** Stills the result tour is about to show, each once. A session nobody attended shows no still. */
export const tourStillPaths = (sessions: readonly { program: string; attendees: number }[]): string[] =>
  [...new Set(sessions.filter(session => session.attendees > 0).map(session => activityStillPath(session.program)).filter((still): still is string => still !== null))]
