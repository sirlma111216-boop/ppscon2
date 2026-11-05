// 건물 그림 위에 물품·주민을 얹어 보여 주는 시설 무대.
// 그림은 장식 레이어이고, 장면의 뜻은 label(대체 설명)과 주변의 DOM 문장이 전한다.
import type { CSSProperties } from 'react'
import { BUILDING, CANOPY, spriteUrl } from '../assets/images'
import { FRAME_SIZE } from '../assets/layout'
import type { Actor, StageScene } from '../assets/scenes'
import { GenericProp } from './GenericProp'

function ActorArt({ actor }: { actor: Actor }) {
  if (actor.image === 'canopy') return <img src={CANOPY} alt="" draggable={false} />
  if (actor.generic) return <GenericProp kind={actor.generic} />
  if (!actor.sprite) return null
  const url = spriteUrl(actor.sprite)
  if (actor.lift !== undefined) {
    // 다리 아래쪽은 그대로 두고 상판 쪽만 올려 높이 조절을 보여 준다(그림을 늘이지 않는다).
    return (
      <span className="desk" style={{ '--lift': actor.lift } as CSSProperties}>
        <img className="desk-lower" src={url} alt="" draggable={false} />
        <img className="desk-upper" src={url} alt="" draggable={false} />
      </span>
    )
  }
  return <img src={url} alt="" draggable={false} />
}

export function FacilityStage({ scene, label, className }: { scene: StageScene; label: string; className?: string }) {
  const [vx, vy, vw, vh] = scene.view
  const px = (x: number) => `${((x - vx) / vw) * 100}%`
  const py = (y: number) => `${((y - vy) / vh) * 100}%`

  return (
    <div
      className={`stage${className ? ` ${className}` : ''}`}
      role="img"
      aria-label={label}
      style={{ aspectRatio: `${vw} / ${vh}`, '--horizon': py(scene.horizon) } as CSSProperties}
    >
      <img
        className="stage-building"
        src={BUILDING[scene.facility]}
        alt=""
        draggable={false}
        style={{ left: px(0), top: py(0), width: `${(FRAME_SIZE.w / vw) * 100}%` }}
      />
      {scene.zones.map((zone) => (
        <div
          key={zone.key}
          className="stage-zone"
          aria-hidden="true"
          style={{ left: px(zone.x), top: py(zone.y), width: `${(zone.w / vw) * 100}%`, height: `${(zone.h / vh) * 100}%` }}
        />
      ))}
      {/* 구역 이름은 인물·물품에 가리지 않게 맨 위 층에 둔다. */}
      {scene.zones.map((zone) => (
        <span key={`${zone.key}-label`} className="stage-zone-label" aria-hidden="true" style={{ left: px(zone.x), top: py(zone.y) }}>
          {zone.label}
        </span>
      ))}
      {scene.actors.map((actor) => (
        <div
          key={actor.key}
          className="actor"
          aria-hidden="true"
          style={{
            left: px(actor.x),
            top: py(actor.y),
            height: `${(actor.h / vh) * 100}%`,
            zIndex: Math.round(actor.z ?? actor.y),
            opacity: actor.opacity ?? 1,
          }}
        >
          {actor.bubble && <span className="actor-bubble">{actor.bubble}</span>}
          <span
            className="actor-art"
            style={{ transform: `scaleX(${(actor.flip ? -1 : 1) * (actor.squeeze ?? 1)}) rotate(${actor.tilt ?? 0}deg)` }}
          >
            <ActorArt actor={actor} />
          </span>
        </div>
      ))}
    </div>
  )
}
