// 그림 배치의 기준 좌표. 건물 접지점은 public/assets/images/manifest.json의 placement 값과 같다
// (tests/assets.test.ts가 일치를 확인한다). 장면 좌표는 건물 원본 픽셀(1774×887) 기준이다.
import type { FacilityId } from '../game/types.ts'

export const BOARD_ASPECT = 1536 / 1024
export const FRAME_SIZE = { w: 1774, h: 887 }

export type Placement = {
  /** 지도에서 건물이 접지하는 지점(0~1) */
  board: [number, number]
  /** 건물 그림에서 그 지점에 맞출 좌표(0~1) */
  sprite: [number, number]
  /** 지도 너비에 대한 건물 너비 비율 */
  width: number
}

export const BUILDING_PLACEMENT: Record<FacilityId, Placement> = {
  library: { board: [0.25, 0.36], sprite: [0.5, 0.865], width: 0.32 },
  school: { board: [0.75, 0.42], sprite: [0.5, 0.92], width: 0.33 },
  community: { board: [0.235, 0.755], sprite: [0.5, 0.915], width: 0.32 },
  park: { board: [0.75, 0.825], sprite: [0.5, 0.95], width: 0.34 },
}

/** 지도 위에서 건물 그림이 차지하는 사각형(지도 크기에 대한 비율) */
export function buildingRect(facility: FacilityId): { left: number; top: number; width: number; height: number } {
  const placement = BUILDING_PLACEMENT[facility]
  const width = placement.width
  // 높이 비율은 지도 높이에 대한 값이다: (지도너비 × width ÷ 2) ÷ 지도높이
  const height = (width * (FRAME_SIZE.h / FRAME_SIZE.w)) * BOARD_ASPECT
  return {
    left: placement.board[0] - width * placement.sprite[0],
    top: placement.board[1] - height * placement.sprite[1],
    width,
    height,
  }
}
