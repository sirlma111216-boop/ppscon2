import test from 'node:test'
import assert from 'node:assert/strict'
import { musicTrackFor } from '../../src/center/musicTrack.ts'
import type { MusicScene } from '../../src/center/musicTrack.ts'
import { reviewCue, sessionSound } from '../../src/center/resultInsights.ts'
import type { SeasonReport, SessionSummary } from '../../src/center/simulation.ts'

const scene = (patch: Partial<MusicScene>): MusicScene => ({ modal: null, comicEvent: false, eventChoiceShown: false, phase: 'planning', season: 0, rules3: true, evaluation: false, awarded: false, ...patch })

test('decisions and the look back at a season have their own music under rules 3', () => {
  assert.equal(musicTrackFor(scene({})), 'planning_spring_summer'); assert.equal(musicTrackFor(scene({ season: 2 })), 'planning_autumn_winter')
  assert.equal(musicTrackFor(scene({ modal: 'season-start' })), 'planning_spring_summer', 'the season greeting keeps the planning music')
  assert.equal(musicTrackFor(scene({ modal: 'season-start', eventChoiceShown: true })), 'decision')
  assert.equal(musicTrackFor(scene({ modal: 'season-start', eventChoiceShown: true, comicEvent: true })), 'comic_event', 'a comic event stays comic')
  assert.equal(musicTrackFor(scene({ modal: 'midseason' })), 'decision')
  assert.equal(musicTrackFor(scene({ modal: 'shop' })), 'procurement')
  for (const modal of [null, 'rivals', 'review']) assert.equal(musicTrackFor(scene({ phase: 'review', modal })), 'result_review', String(modal))
  assert.equal(musicTrackFor(scene({ phase: 'review', modal: 'review', evaluation: true })), 'evaluation')
  assert.equal(musicTrackFor(scene({ phase: 'review', evaluation: true })), 'result_review', 'the evaluation music waits for the ceremony')
  assert.equal(musicTrackFor(scene({ phase: 'ending', modal: 'review', evaluation: true, awarded: true })), 'final_awarded')
  assert.equal(musicTrackFor(scene({ phase: 'ending', modal: 'review', evaluation: true })), 'final_unawarded')
})

test('each stop of the result tour and each settlement gets the sound that matches what happened', () => {
  const session = (patch: Partial<SessionSummary>): SessionSummary => ({ room: 'B', slot: 0, program: 'P03', rental: false, weeks: 13, attendees: 100, revenue: 10, cost: 5, reputation: 1, satisfaction: 80, tally: [1, 5, 6, 1], ...patch })
  assert.equal(sessionSound(session({})), 'delta_up'); assert.equal(sessionSound(session({ revenue: 3 })), 'delta_down', 'an ordinary season ticks with the money')
  assert.equal(sessionSound(session({ revenue: 5 })), 'delta_up', 'breaking even is not a loss')
  assert.equal(sessionSound(session({ tally: [5, 4, 3, 1] })), 'outcome_great'); assert.equal(sessionSound(session({ tally: [1, 3, 4, 5] })), 'outcome_poor')
  assert.equal(sessionSound(session({ mood: 'hot', tally: [1, 3, 4, 5], revenue: 0 })), 'mood_hot', 'the season mood comes first')
  assert.equal(sessionSound(session({ mood: 'cold', tally: [6, 4, 3, 0] })), 'mood_cold'); assert.equal(sessionSound(session({ mood: 'steady' })), 'delta_up')
  assert.equal(sessionSound(session({ tally: [0, 0, 0, 0], revenue: 1 })), 'delta_down', 'older-rules sessions have no weekly results')
  const report = (patch: Partial<SeasonReport>) => ({ profit: 10, reputationChange: 1, rank: 5, ...patch }) as SeasonReport
  assert.equal(reviewCue(report({}), null), 'briefing_open')
  assert.equal(reviewCue(report({ training: [{ kind: 'sport', gain: 20, level: 1, leveledUp: false, grade: '보통' }] }), null), 'training_done')
  assert.equal(reviewCue(report({ training: [{ kind: 'sport', gain: 30, level: 2, leveledUp: true, grade: '우수' }] }), null), 'level_up')
  assert.equal(reviewCue(report({ training: [{ kind: 'sport', gain: 30, level: 2, leveledUp: true, grade: '우수' }] }), 100), 'trust_milestone', 'the rarest moment wins')
})

test('older-rules saves keep the tracks they always had', () => {
  const legacy = (patch: Partial<MusicScene>) => musicTrackFor(scene({ rules3: false, ...patch }))
  assert.equal(legacy({ phase: 'review' }), 'operation'); assert.equal(legacy({ phase: 'review', modal: 'rivals' }), 'operation')
  assert.equal(legacy({ phase: 'review', modal: 'review', season: 3 }), 'planning_autumn_winter')
  assert.equal(legacy({ phase: 'review', modal: 'review', evaluation: true }), 'evaluation')
  assert.equal(legacy({ modal: 'season-start', comicEvent: true }), 'comic_event'); assert.equal(legacy({ modal: 'facility' }), 'procurement')
  assert.equal(legacy({}), 'planning_spring_summer')
})
