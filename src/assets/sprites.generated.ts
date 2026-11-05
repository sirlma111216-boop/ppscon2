// scripts/build-assets.mjs가 만든 파일. 직접 고치지 않는다.
export const SPRITES = {
  "foldTable": {
    "url": "assets/game/sprites/foldTable.webp",
    "w": 309,
    "h": 269,
    "label": "접이식 활동 테이블"
  },
  "mobileTable": {
    "url": "assets/game/sprites/mobileTable.webp",
    "w": 355,
    "h": 256,
    "label": "이동 모듈 테이블"
  },
  "compactDesk": {
    "url": "assets/game/sprites/compactDesk.webp",
    "w": 282,
    "h": 305,
    "label": "소형 높이 조절 책상"
  },
  "wideDesk": {
    "url": "assets/game/sprites/wideDesk.webp",
    "w": 347,
    "h": 277,
    "label": "넓은 높이 조절 책상"
  },
  "kiosk": {
    "url": "assets/game/sprites/kiosk.webp",
    "w": 268,
    "h": 341,
    "label": "안내 도구"
  },
  "portableSign": {
    "url": "assets/game/sprites/portableSign.webp",
    "w": 275,
    "h": 335,
    "label": "이동 안내판"
  },
  "bench": {
    "url": "assets/game/sprites/bench.webp",
    "w": 360,
    "h": 248,
    "label": "공원 벤치"
  },
  "solarLamp": {
    "url": "assets/game/sprites/solarLamp.webp",
    "w": 183,
    "h": 358,
    "label": "공원 태양광 등"
  },
  "deliveryVan": {
    "url": "assets/game/sprites/deliveryVan.webp",
    "w": 360,
    "h": 273,
    "label": "납품 차량"
  },
  "walkingAdult": {
    "url": "assets/game/sprites/walkingAdult.webp",
    "w": 192,
    "h": 360,
    "label": "걸어가는 주민"
  },
  "child": {
    "url": "assets/game/sprites/child.webp",
    "w": 143,
    "h": 331,
    "label": "가방을 멘 학생"
  },
  "readingElder": {
    "url": "assets/game/sprites/readingElder.webp",
    "w": 248,
    "h": 361,
    "label": "책 읽는 주민"
  },
  "wheelchairUser": {
    "url": "assets/game/sprites/wheelchairUser.webp",
    "w": 293,
    "h": 360,
    "label": "휠체어를 이용하는 주민"
  },
  "staff": {
    "url": "assets/game/sprites/staff.webp",
    "w": 148,
    "h": 360,
    "label": "현장 담당자"
  },
  "supplier": {
    "url": "assets/game/sprites/supplier.webp",
    "w": 194,
    "h": 361,
    "label": "상자를 든 공급자"
  }
} as const

export type SpriteId = keyof typeof SPRITES
