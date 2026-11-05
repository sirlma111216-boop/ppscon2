// 네 시설이 놓인 동네 지도. 그림은 레이어, 선택은 실제 버튼이 맡는다.
import { BG, BUILDING, CANOPY, spriteUrl } from '../assets/images'
import { buildingRect } from '../assets/layout'
import type { SpriteId } from '../assets/sprites.generated'
import { FACILITY_NAMES } from '../game/missions'
import type { FacilityId } from '../game/types'

export type TownSpot = {
  facility: FacilityId
  /** 이번 임무에 열린 요청 */
  request?: { title: string; status: string; done: boolean }
  /** 구매한 물품이 쓰이고 있는가 */
  inUse: boolean
  /** 임무 3의 그늘막이 놓였는가(공원) */
  canopy?: boolean
  /** 임무 2의 안내판이 놓였는가(공원) */
  sign?: boolean
}

const FACILITIES: FacilityId[] = ['library', 'school', 'community', 'park']

// 사용 중인 시설 앞에 서는 작은 주민. 좌표는 지도 크기에 대한 비율, h는 지도 높이에 대한 비율.
const VISITORS: Record<FacilityId, { sprite: SpriteId; x: number; y: number; h: number; flip?: boolean }[]> = {
  library: [
    { sprite: 'walkingAdult', x: 0.445, y: 0.365, h: 0.1, flip: true },
    { sprite: 'child', x: 0.475, y: 0.39, h: 0.076, flip: true },
  ],
  school: [
    { sprite: 'child', x: 0.585, y: 0.5, h: 0.076 },
    { sprite: 'wheelchairUser', x: 0.545, y: 0.475, h: 0.09 },
  ],
  community: [
    { sprite: 'walkingAdult', x: 0.435, y: 0.79, h: 0.1, flip: true },
    { sprite: 'staff', x: 0.4, y: 0.765, h: 0.1 },
  ],
  park: [
    { sprite: 'readingElder', x: 0.59, y: 0.9, h: 0.088 },
    { sprite: 'wheelchairUser', x: 0.545, y: 0.93, h: 0.09 },
  ],
}

export function TownMap({ spots, onSelect, highlight }: {
  spots: TownSpot[]
  onSelect: (facility: FacilityId) => void
  /** 처음 눌러 볼 곳을 알려 주는 시설 */
  highlight?: FacilityId | null
}) {
  const byFacility = new Map(spots.map((spot) => [spot.facility, spot]))
  const park = byFacility.get('park')

  return (
    <div className="town">
      <img className="town-bg" src={BG.town} alt="" draggable={false} />
      {FACILITIES.map((facility) => {
        const rect = buildingRect(facility)
        return (
          <img
            key={facility}
            className="town-building"
            src={BUILDING[facility]}
            alt=""
            draggable={false}
            style={{ left: `${rect.left * 100}%`, top: `${rect.top * 100}%`, width: `${rect.width * 100}%` }}
          />
        )
      })}
      {park?.canopy && <img className="town-prop" src={CANOPY} alt="" draggable={false} style={{ left: '82%', top: '70.5%', width: '17%' }} />}
      {park?.sign && (
        <img className="town-prop" src={spriteUrl('portableSign')} alt="" draggable={false} style={{ left: '90.5%', top: '80%', height: '10%' }} />
      )}
      {spots
        .filter((spot) => spot.inUse)
        .flatMap((spot) =>
          VISITORS[spot.facility].map((visitor, index) => (
            <img
              key={`${spot.facility}-${index}`}
              className="town-visitor"
              src={spriteUrl(visitor.sprite)}
              alt=""
              draggable={false}
              style={{
                left: `${visitor.x * 100}%`,
                top: `${visitor.y * 100}%`,
                height: `${visitor.h * 100}%`,
                transform: `translate(-50%, -100%) scaleX(${visitor.flip ? -1 : 1})`,
              }}
            />
          )),
        )}
      {FACILITIES.map((facility) => {
        const spot = byFacility.get(facility)
        const rect = buildingRect(facility)
        const name = FACILITY_NAMES[facility]
        const request = spot?.request
        return (
          <button
            key={facility}
            type="button"
            className={`town-spot${request ? ' has-request' : ''}${request?.done ? ' is-done' : ''}${highlight === facility ? ' is-highlight' : ''}`}
            style={{ left: `${rect.left * 100}%`, top: `${rect.top * 100}%`, width: `${rect.width * 100}%`, height: `${rect.height * 100}%` }}
            onClick={() => onSelect(facility)}
          >
            <span className="town-label">
              <span className="town-name">{name}</span>
              {request ? (
                <span className="town-request">
                  <span aria-hidden="true">{request.done ? '✓' : '✉'}</span> {request.status}
                </span>
              ) : (
                <span className="town-request is-quiet">{spot?.inUse ? '이용 중' : '살펴보기'}</span>
              )}
            </span>
          </button>
        )
      })}
    </div>
  )
}
