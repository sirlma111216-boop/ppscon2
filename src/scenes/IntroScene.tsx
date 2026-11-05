import { useState } from 'react'
import { BG } from '../assets/images'
import { ArtFrame } from '../components/ArtFrame'
import { MISSIONS, MISSION_ORDER } from '../game/missions'
import type { GameState, MissionId } from '../game/types'

type Props = {
  state: GameState
  hasProgress: boolean
  onStart: () => void
  onContinue: () => void
  onOpenMission: (missionId: MissionId) => void
  onOpenSettings: () => void
}

export function IntroScene({ state, hasProgress, onStart, onContinue, onOpenMission, onOpenSettings }: Props) {
  const [confirming, setConfirming] = useState(false)
  const finished = MISSION_ORDER.filter((id) => state.results[id])

  return (
    <main className="scene scene-intro">
      <ArtFrame src={BG.intro} region={[0.045, 0.06, 0.34, 0.56]} className="intro-frame">
        <h1 className="intro-title">
          내일을 여는
          <br />
          상자
        </h1>
        <p className="intro-lead">상자를 열면, 누군가의 하루가 달라집니다.</p>
        <p className="intro-question">이 동네에 필요한 건, 가장 싼 물건일까요?</p>

        {confirming ? (
          <div className="notice notice-warn" role="alertdialog" aria-label="새로 시작 확인">
            <p>저장된 진행을 지우고 임무 1부터 시작할까요?</p>
            <div className="button-row">
              <button type="button" className="btn btn-primary" onClick={onStart}>
                처음부터 시작
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setConfirming(false)}>
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="button-stack">
            <button type="button" className="btn btn-primary btn-large" onClick={() => (hasProgress ? setConfirming(true) : onStart())}>
              첫 상자 열기
            </button>
            <div className="button-row">
              {hasProgress && (
                <button type="button" className="btn btn-ink" onClick={onContinue}>
                  이어하기
                </button>
              )}
              <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
                {hasProgress ? '설정' : '소리·움직임 설정'}
              </button>
            </div>
          </div>
        )}
      </ArtFrame>

      <footer className="intro-footer">
        {finished.length > 0 && (
          <nav className="mission-nav" aria-label="마친 임무 다시 하기">
            <span>다시 비교해 보기</span>
            {finished.map((id) => (
              <button key={id} type="button" className="btn btn-ghost btn-small" onClick={() => onOpenMission(id)}>
                임무 {MISSIONS[id].number} · {MISSIONS[id].title}
              </button>
            ))}
          </nav>
        )}
        <p>공공기관의 필요를 적합한 구매와 공급으로 연결하는 게임입니다. 실제 조달 절차를 쉽게 이해하도록 단순화했습니다.</p>
        <p className="fine-print">물품·가격·일정은 모두 가상의 게임 데이터입니다 · 로그인 없이 바로 시작 · 약 10~14분 · 2026 조달청 AI 게임·콘텐츠 공모전 출품 준비작</p>
      </footer>
    </main>
  )
}
