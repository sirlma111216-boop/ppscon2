import { useEffect, useRef } from 'react'
import { BG } from '../assets/images'
import { ArtFrame } from '../components/ArtFrame'
import { FACILITY_NAMES, MISSION_ORDER } from '../game/missions'
import { compareHint, summarizeRun } from '../game/text'
import type { Mission, MissionResult, MissionRun } from '../game/types'

type Props = {
  mission: Mission
  run: MissionRun
  result: MissionResult
  onNext: () => void
  onReplan: () => void
  onOpenSettings: () => void
}

export function ResultScene({ mission, run, result, onNext, onReplan, onOpenSettings }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const isLast = mission.number === MISSION_ORDER.length
  const hint = compareHint(mission, run)
  const improvement = result.improvementId
    ? Object.values(mission.observations ?? {})
        .flatMap((spec) => spec.choices)
        .find((choice) => choice.id === result.improvementId)
    : null

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <main className="scene scene-result">
      <ArtFrame
        src={BG.result}
        region={[0.055, 0.105, 0.635, 0.79]}
        className="result-frame"
        overlay={
          <p className="result-stamp" aria-hidden="true">
            사용
            <br />
            확인
          </p>
        }
      >
        <p className="eyebrow">임무 {mission.number} 결과</p>
        <h1 ref={headingRef} tabIndex={-1} className="result-title">
          {mission.title}
        </h1>
        <p className="result-summary">{summarizeRun(mission, run, result.cost)}</p>

        <ul className="result-choices">
          {mission.requirements.map((requirement) => {
            const option = mission.options[result.selections[requirement.id]]
            return (
              <li key={requirement.id}>
                <strong>
                  {FACILITY_NAMES[requirement.facilityId]} · {option.name}
                </strong>
                <span>{option.rationaleText}</span>
                {requirement.followUp && improvement && <span>사용을 관찰한 뒤 ‘{improvement.label}’ 개선을 반영하고 다시 확인했습니다.</span>}
              </li>
            )
          })}
        </ul>

        <table className="score-table">
          <caption>학습 완료 표시 (공공서비스 평가나 공모전 배점이 아니에요)</caption>
          <tbody>
            <tr>
              <th scope="row">수요 충족</th>
              <td>{result.score.need} / 60</td>
            </tr>
            <tr>
              <th scope="row">같은 기준으로 비교</th>
              <td>{result.score.compare} / 20</td>
            </tr>
            <tr>
              <th scope="row">사용 결과 확인</th>
              <td>{result.score.usage} / 20</td>
            </tr>
            <tr className="score-total">
              <th scope="row">합계</th>
              <td>{result.score.total} / 100</td>
            </tr>
          </tbody>
        </table>
        {hint && <p className="fine-print">{hint}</p>}
        <p className="result-lesson">{mission.lessonText}</p>

        <div className="button-row">
          <button type="button" className="btn btn-primary btn-large" onClick={onNext}>
            {isLast ? '동네 둘러보기' : `다음 임무 ${mission.number + 1}`}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onReplan}>
            다른 안으로 다시 계획
          </button>
          <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
            설정
          </button>
        </div>
      </ArtFrame>
    </main>
  )
}
