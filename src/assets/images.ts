// 게임이 불러오는 웹용 파생 이미지의 경로. 원본 PNG는 개발용 자료실에서만 쓴다.
import type { FacilityId } from '../game/types.ts'
import { SPRITES } from './sprites.generated.ts'
import type { SpriteId } from './sprites.generated.ts'

const base = import.meta.env.BASE_URL

export const BG = {
  intro: `${base}assets/game/bg/intro.webp`,
  town: `${base}assets/game/bg/town.webp`,
  chapter: `${base}assets/game/bg/chapter.webp`,
  progress: `${base}assets/game/bg/progress.webp`,
  result: `${base}assets/game/bg/result.webp`,
  ending: `${base}assets/game/bg/ending.webp`,
} as const

export const BUILDING: Record<FacilityId, string> = {
  library: `${base}assets/game/buildings/library.webp`,
  school: `${base}assets/game/buildings/school.webp`,
  community: `${base}assets/game/buildings/community.webp`,
  park: `${base}assets/game/buildings/park.webp`,
}

export const CANOPY = `${base}assets/game/buildings/canopy.webp`

export function spriteUrl(id: SpriteId): string {
  return base + SPRITES[id].url
}

const requested = new Set<string>()

/** 다음 화면에서 쓸 그림을 미리 받아 둔다. 실패해도 화면은 그대로 진행된다. */
export function preload(urls: readonly string[]): void {
  for (const url of urls) {
    if (requested.has(url)) continue
    requested.add(url)
    const image = new Image()
    image.decoding = 'async'
    image.src = url
  }
}
