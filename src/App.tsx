import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { audio } from './audio/AudioManager'
import type { MusicId } from './audio/AudioManager'
import { BG, BUILDING, CANOPY, preload, spriteUrl } from './assets/images'
import { SPRITES } from './assets/sprites.generated'
import type { SpriteId } from './assets/sprites.generated'
import { SettingsDialog } from './components/SettingsDialog'
import { getMission } from './game/missions'
import { clearSave, getBrowserStorage, hasProgress, loadSave, loadSettings, writeSave, writeSettings } from './game/persistence'
import type { Settings } from './game/persistence'
import { gameReducer, initialState } from './game/reducer'
import type { GameState, MissionId } from './game/types'
import { ChapterScene } from './scenes/ChapterScene'
import { EndingScene } from './scenes/EndingScene'
import { IntroScene } from './scenes/IntroScene'
import { ExecutionView, PlanningView, UsageView } from './scenes/PlayScene'
import { ResultScene } from './scenes/ResultScene'

const storage = getBrowserStorage()

function loadInitialState(): GameState {
  // 저장이 있어도 늘 처음 화면에서 시작하고, '이어하기'로 돌아간다.
  const saved = loadSave(storage)
  return saved ? { ...saved, screen: 'intro' } : initialState
}

function usePrefersReducedMotion(): boolean {
  const [prefers, setPrefers] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false)
  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const update = () => setPrefers(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return prefers
}

function musicFor(state: GameState): MusicId | null {
  if (state.screen === 'intro') return 'music.intro'
  if (state.screen === 'ending') return 'music.ending'
  if (state.screen === 'chapter' || !state.run) return 'music.plan'
  switch (state.run.phase) {
    case 'executing':
    case 'observing':
    case 'verifying':
      return 'music.execute'
    case 'result':
      return 'music.result'
    default:
      return 'music.plan'
  }
}

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadInitialState)
  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage))
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveWorks, setSaveWorks] = useState(storage !== null)
  // 다시 계획할 때마다 올려, 계획 화면의 임시 상태(보던 시설·미리보기·집은 작업)를 비운다.
  const [planSerial, setPlanSerial] = useState(0)
  const prefersReduced = usePrefersReducedMotion()
  const reducedMotion = settings.reducedMotion ?? prefersReduced
  const skipSave = useRef(true)
  const run = state.run
  const mission = run ? getMission(run.missionId) : null

  // 설정 반영: 음량과 '동작 줄이기'
  useEffect(() => {
    audio.setVolumes({ muted: settings.muted, music: settings.music, sfx: settings.sfx, ambience: settings.ambience })
    writeSettings(storage, settings)
  }, [settings])

  useEffect(() => {
    document.documentElement.dataset.motion = reducedMotion ? 'reduced' : 'full'
  }, [reducedMotion])

  // 오디오는 첫 사용자 입력 뒤에만 시작한다.
  useEffect(() => {
    const start = () => {
      void audio.start()
    }
    window.addEventListener('pointerdown', start, { once: true })
    window.addEventListener('keydown', start, { once: true })
    return () => {
      window.removeEventListener('pointerdown', start)
      window.removeEventListener('keydown', start)
    }
  }, [])

  const music = musicFor(state)
  useEffect(() => {
    audio.setMusic(music)
    if (state.screen !== 'play') audio.setAmbience(null)
  }, [music, state.screen])

  // 자동 저장: 임무 경계, 계획 변경, 확정 같은 안정적인 시점에만 쓴다(실행 연출의 매 단계에는 쓰지 않는다).
  const phase = run?.phase
  const missionId = run?.missionId
  const plan = run?.plan
  const previewed = run?.previewed
  const compareOpened = run?.compareOpened
  const results = state.results
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    if (!hasProgress(state)) return
    setSaveWorks(writeSave(storage, state))
    // state 전체가 아니라 저장 내용이 달라지는 값만 본다.
  }, [phase === 'executing' || phase === 'observing' || phase === 'verifying' ? 'confirmed' : phase, missionId, plan, previewed, compareOpened, results])

  // 다음 화면에서 쓸 그림을 미리 받는다. 처음에는 인트로만, 임무에 들어가면 지도·건물·소품을 받는다.
  useEffect(() => {
    if (state.screen === 'intro') preload([BG.chapter, BG.town])
    if (state.screen === 'chapter' || state.screen === 'play') {
      preload([BG.town, BG.progress, BG.result, ...Object.values(BUILDING), ...(Object.keys(SPRITES) as SpriteId[]).map(spriteUrl)])
      if (missionId === 'M3') preload([CANOPY, BG.ending])
    }
  }, [state.screen, missionId])

  const openSettings = useCallback(() => setSettingsOpen(true), [])
  const openMission = useCallback((id: MissionId) => dispatch({ type: 'OPEN_MISSION', missionId: id }), [])

  const startNew = () => {
    clearSave(storage)
    setPlanSerial((serial) => serial + 1)
    dispatch({ type: 'START_NEW' })
  }

  const replan = () => {
    audio.playSfx('session.reset')
    setPlanSerial((serial) => serial + 1)
    dispatch({ type: 'REPLAN_MISSION' })
  }

  const renderScreen = () => {
    if (state.screen === 'intro') {
      return (
        <IntroScene
          state={state}
          hasProgress={hasProgress(state)}
          onStart={startNew}
          onContinue={() => dispatch({ type: 'RESUME' })}
          onOpenMission={openMission}
          onOpenSettings={openSettings}
        />
      )
    }
    if (state.screen === 'ending') {
      return <EndingScene state={state} onOpenMission={openMission} onGoIntro={() => dispatch({ type: 'GO_INTRO' })} onOpenSettings={openSettings} />
    }
    if (!run || !mission) return null
    if (state.screen === 'chapter' || run.phase === 'briefing') {
      return <ChapterScene mission={mission} onBegin={() => dispatch({ type: 'BEGIN_PLANNING' })} onOpenSettings={openSettings} />
    }
    const viewProps = { state, run, dispatch, reducedMotion, onOpenSettings: openSettings }
    switch (run.phase) {
      case 'planning':
        return <PlanningView key={`${run.missionId}:${planSerial}`} {...viewProps} />
      case 'executing':
      case 'observing':
        return <ExecutionView key={run.missionId} {...viewProps} />
      case 'verifying':
        return <UsageView key={run.missionId} {...viewProps} />
      case 'result': {
        const result = state.results[run.missionId]
        if (!result) return null
        return (
          <ResultScene
            mission={mission}
            run={run}
            result={result}
            onNext={() => dispatch({ type: 'NEXT_MISSION' })}
            onReplan={replan}
            onOpenSettings={openSettings}
          />
        )
      }
    }
  }

  const inMission = state.screen === 'play' && run !== null && run.phase !== 'result'

  return (
    <>
      {renderScreen()}
      {settingsOpen && (
        <SettingsDialog
          settings={settings}
          reducedMotion={reducedMotion}
          saveWorks={saveWorks}
          onChange={setSettings}
          onClose={() => setSettingsOpen(false)}
          onReplan={
            inMission
              ? () => {
                  replan()
                  setSettingsOpen(false)
                }
              : undefined
          }
          onGoIntro={
            state.screen !== 'intro'
              ? () => {
                  dispatch({ type: 'GO_INTRO' })
                  setSettingsOpen(false)
                }
              : undefined
          }
          onNewGame={
            hasProgress(state)
              ? () => {
                  audio.playSfx('session.reset')
                  startNew()
                  setSettingsOpen(false)
                }
              : undefined
          }
        />
      )}
    </>
  )
}
