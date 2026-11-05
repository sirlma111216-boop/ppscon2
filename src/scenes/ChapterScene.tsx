import { useEffect, useRef } from 'react'
import { BG } from '../assets/images'
import { ArtFrame } from '../components/ArtFrame'
import { getReservedCost } from '../game/engine'
import { FACILITY_NAMES, MISSION_ORDER } from '../game/missions'
import type { Mission } from '../game/types'

export function ChapterScene({ mission, onBegin, onOpenSettings }: { mission: Mission; onBegin: () => void; onOpenSettings: () => void }) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const reserved = getReservedCost(mission)

  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [mission.id])

  return (
    <main className="scene scene-chapter">
      <ArtFrame src={BG.chapter} region={[0.215, 0.215, 0.57, 0.55]} className="chapter-frame">
        <p className="eyebrow">
          임무 {mission.number} / {MISSION_ORDER.length}
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="chapter-title">
          {mission.title}
        </h1>
        <p className="chapter-goal">{mission.goalText}</p>
        <p className="chapter-story">{mission.storyText}</p>
        <ul className="chapter-facts">
          <li>
            <strong>요청</strong> {mission.requirements.map((requirement) => `${FACILITY_NAMES[requirement.facilityId]} · ${requirement.title}`).join(' / ')}
          </li>
          <li>
            <strong>예산</strong> {mission.budget}점{reserved > 0 ? ` (개선·재확인 예약 ${reserved}점 포함)` : ''} · <strong>준비</strong> 3일, 6칸
          </li>
        </ul>
        <div className="button-row">
          <button type="button" className="btn btn-primary btn-large" onClick={onBegin}>
            {mission.number === 1 ? '요청 들으러 가기' : '계획 시작'}
          </button>
          <button type="button" className="btn btn-ghost" onClick={onOpenSettings}>
            설정
          </button>
        </div>
        <p className="fine-print">시간 제한이 없어요. 계획은 확정 전까지 몇 번이든 고칠 수 있습니다.</p>
      </ArtFrame>
    </main>
  )
}
