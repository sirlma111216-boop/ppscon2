import { useEffect, useRef } from 'react'
import { BG } from '../assets/images'
import { getScene } from '../assets/scenes'
import { ArtFrame } from '../components/ArtFrame'
import { FacilityStage } from '../components/FacilityStage'
import { FACILITY_NAMES, MISSIONS, MISSION_ORDER } from '../game/missions'
import { getSettledView } from '../game/text'
import type { FacilityId, GameState, MissionId } from '../game/types'

type Props = {
  state: GameState
  onOpenMission: (missionId: MissionId) => void
  onGoIntro: () => void
  onOpenSettings: () => void
}

const NEEDS: Record<FacilityId, string> = {
  library: '한 방을 오전에는 독서, 오후에는 프로그램에 쓰고 싶다',
  school: '서로 다른 이용자에게 높이를 맞출 책상이 필요하다',
  community: '처음 온 주민이 갈 곳을 찾게 돕고 싶다',
  park: '행사 장소를 알리고, 쉴 그늘을 마련하고 싶다',
}

function chosenNames(state: GameState, facility: FacilityId): string[] {
  const names: string[] = []
  for (const id of MISSION_ORDER) {
    const result = state.results[id]
    if (!result) continue
    for (const requirement of MISSIONS[id].requirements) {
      if (requirement.facilityId !== facility) continue
      const option = MISSIONS[id].options[result.selections[requirement.id]]
      if (option) names.push(`임무 ${MISSIONS[id].number} · ${option.name}`)
    }
  }
  return names
}

export function EndingScene({ state, onOpenMission, onGoIntro, onOpenSettings }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const facilities: FacilityId[] = ['library', 'school', 'community', 'park']
  const total = MISSION_ORDER.reduce((sum, id) => sum + (state.results[id]?.score.total ?? 0), 0)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <main className="scene scene-ending">
      <ArtFrame src={BG.ending} region={[0.045, 0.07, 0.3, 0.3]} tone="light" className="ending-frame">
        <p className="eyebrow">세 임무를 마쳤어요</p>
        <h1 ref={headingRef} tabIndex={-1} className="ending-title">
          상자가 열린 동네
        </h1>
        <p className="ending-lead">세 번의 구매 계획이 네 곳의 하루를 조금씩 바꿨습니다.</p>
      </ArtFrame>

      <div className="ending-body">
        <section aria-labelledby="recap-title">
          <h2 id="recap-title">어디서 어떤 필요가 어떻게 풀렸나요</h2>
          <p className="fine-print">아래 장면과 문장은 이번 플레이에서 고른 공급안으로 만들어졌어요. 위 그림은 동네의 저녁 풍경입니다.</p>
          <ul className="recap-grid">
            {facilities.map((facility) => {
              const view = getSettledView(state, facility)
              const scene = getScene({ facility, missionId: view.missionId, visual: view.visual, moment: facility === 'park' ? 'a' : 'b', improved: view.improved })
              return (
                <li key={facility} className="recap-card">
                  <FacilityStage scene={scene} label={`${FACILITY_NAMES[facility]}: ${view.note}`} />
                  <h3>{FACILITY_NAMES[facility]}</h3>
                  <p className="recap-need">필요: {NEEDS[facility]}</p>
                  <p>{view.note}</p>
                  <p className="fine-print">{chosenNames(state, facility).join(' / ')}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="ending-meaning" aria-labelledby="meaning-title">
          <h2 id="meaning-title">이 게임에서 해 본 두 가지</h2>
          <ol>
            <li>
              <strong>필요에 맞는 선택</strong>
              <span>공공기관이 말한 필요를 기준으로, 조건을 충족하는 공급안을 같은 항목으로 비교해 골랐습니다. 가장 싼 물건이 답은 아니었습니다.</span>
            </li>
            <li>
              <strong>첫 구매, 그리고 한 번 더</strong>
              <span>새 제품을 처음 사서 써 보고, 이용 모습을 관찰해 공급자가 고친 뒤 다시 확인했습니다. 첫 구매와 사용 피드백이 제품의 개선으로 이어졌습니다.</span>
            </li>
          </ol>
          <p className="fine-print">
            학습 완료 표시 합계 {total} / 300 · 물품·가격·일정·점수는 게임을 위해 만든 가상의 값이며, 실제 조달 절차와 제도를 단순화했습니다.
          </p>
        </section>

        <nav className="ending-actions" aria-label="다음에 할 일">
          <div className="button-row">
            {MISSION_ORDER.map((id) => (
              <button key={id} type="button" className="btn btn-ink" onClick={() => onOpenMission(id)}>
                임무 {MISSIONS[id].number} 다시 비교해 보기
              </button>
            ))}
          </div>
          <div className="button-row">
            <button type="button" className="btn btn-ghost" onClick={onGoIntro}>
              처음 화면으로
            </button>
            <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
              설정
            </button>
          </div>
        </nav>
      </div>
    </main>
  )
}
