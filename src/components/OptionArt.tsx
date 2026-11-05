// 공급안 카드의 물품 그림. 전용 그림이 없는 안은 범용 종이 조각 그림을 쓴다.
import { CANOPY, spriteUrl } from '../assets/images'
import type { GenericKind } from '../assets/scenes'
import type { SpriteId } from '../assets/sprites.generated'
import type { OptionVisual } from '../game/types'
import { GenericProp } from './GenericProp'

const ART: Record<OptionVisual, { sprite: SpriteId } | { generic: GenericKind } | { canopy: true }> = {
  foldTable: { sprite: 'foldTable' },
  mobileTable: { sprite: 'mobileTable' },
  fixedTable: { generic: 'fixedTable' },
  compactDesk: { sprite: 'compactDesk' },
  wideDesk: { sprite: 'wideDesk' },
  fixedDesk: { generic: 'fixedDesk' },
  kioskText: { sprite: 'kiosk' },
  kioskMenu: { sprite: 'kiosk' },
  voiceOnly: { generic: 'voicePost' },
  signAssembled: { sprite: 'portableSign' },
  signReady: { sprite: 'portableSign' },
  signFixed: { generic: 'fixedSign' },
  canopyAssembled: { canopy: true },
  canopyReady: { canopy: true },
  ornament: { generic: 'ornament' },
}

export function OptionArt({ visual }: { visual: OptionVisual }) {
  const art = ART[visual]
  return (
    <span className="option-art" aria-hidden="true">
      {'sprite' in art ? (
        <img src={spriteUrl(art.sprite)} alt="" draggable={false} />
      ) : 'canopy' in art ? (
        <img src={CANOPY} alt="" draggable={false} />
      ) : (
        <GenericProp kind={art.generic} />
      )}
    </span>
  )
}
