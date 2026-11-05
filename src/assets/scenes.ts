// 시설 장면의 배치 데이터. 좌표는 건물 원본 픽셀(1774×887) 기준이며
// 그림 밖 영역(음수·1774 초과)도 무대의 일부로 쓸 수 있다.
// 같은 key를 가진 개체는 상태가 바뀔 때 자리만 옮겨 가며 CSS 전환으로 움직인다.
import type { FacilityId, MissionId, OptionVisual } from '../game/types.ts'
import type { SpriteId } from './sprites.generated.ts'

export type GenericKind = 'fixedTable' | 'fixedDesk' | 'voicePost' | 'fixedSign' | 'ornament' | 'papers' | 'sun' | 'box'

export type Actor = {
  key: string
  /** 발밑 가운데의 x, y와 그림 높이 */
  x: number
  y: number
  h: number
  sprite?: SpriteId
  generic?: GenericKind
  image?: 'canopy'
  flip?: boolean
  /** 접힌 모습을 위한 가로 비율(1 = 그대로) */
  squeeze?: number
  tilt?: number
  /** 높이 조절 책상의 상판을 올린 정도(그림 높이에 대한 비율) */
  lift?: number
  opacity?: number
  /** 머리 위의 짧은 DOM 말풍선 */
  bubble?: string
  z?: number
}

export type Zone = { key: string; x: number; y: number; w: number; h: number; label: string }

export type StageScene = {
  facility: FacilityId
  view: [number, number, number, number]
  /** 바닥이 시작되는 y */
  horizon: number
  actors: Actor[]
  zones: Zone[]
}

export type Moment = 'a' | 'b'

export type SceneRequest = {
  facility: FacilityId
  missionId: MissionId
  /** null이면 구매 전의 지금 모습 */
  visual: OptionVisual | null
  moment: Moment
  /** use: 이용 장면, arrive·install·installed: 실행 연출, observe·improve: 임무 2의 관찰과 개선 */
  stage?: 'use' | 'arrive' | 'install' | 'installed' | 'observe' | 'improve'
  /** 안내 도구의 개선이 반영됐는가 */
  improved?: boolean
}

export type MomentLabels = { a: string; b: string }

export function getMomentLabels(facility: FacilityId, missionId: MissionId): MomentLabels {
  if (facility === 'library') return { a: '오전 독서', b: '오후 프로그램' }
  if (facility === 'school') return { a: '높이 맞추기 전', b: '높이를 맞춘 뒤' }
  if (facility === 'community') return { a: '주민이 들어옴', b: '안내를 본 뒤' }
  return missionId === 'M3' ? { a: '행사 날', b: '다음 행사 자리로' } : { a: '평소', b: '행사 날' }
}

// 사람·물품의 높이는 장면의 어른 키(unit)에 대한 비율로 맞춘다.
const RATIO: Record<SpriteId, number> = {
  walkingAdult: 1,
  child: 0.76,
  readingElder: 0.88,
  wheelchairUser: 0.9,
  staff: 1.03,
  supplier: 1.03,
  foldTable: 0.56,
  mobileTable: 0.54,
  compactDesk: 0.62,
  wideDesk: 0.6,
  kiosk: 0.88,
  portableSign: 0.76,
  bench: 0.6,
  solarLamp: 1.25,
  deliveryVan: 1.2,
}

function builder(unit: number) {
  return (key: string, sprite: SpriteId, x: number, y: number, extra: Partial<Actor> = {}): Actor => ({
    key,
    sprite,
    x,
    y,
    h: unit * RATIO[sprite],
    ...extra,
  })
}

function generic(key: string, kind: GenericKind, x: number, y: number, h: number, extra: Partial<Actor> = {}): Actor {
  return { key, generic: kind, x, y, h, ...extra }
}

function ghost(actors: Actor[], opacity: number): Actor[] {
  return actors.map((actor) => ({ ...actor, opacity }))
}

// ── 도서관 ─────────────────────────────────────────────────

function libraryScene(request: SceneRequest): StageScene {
  const unit = 172
  const s = builder(unit)
  const { visual, moment } = request
  const stage = request.stage ?? 'use'
  const afternoon = moment === 'b'
  const zones: Zone[] = [{ key: 'storage', x: 178, y: 566, w: 150, h: 92, label: '수납 구역' }]
  let products: Actor[] = []
  let people: Actor[] = []

  if (visual === 'foldTable') {
    products = afternoon
      ? [
          s('t1', 'foldTable', 212, 630, { squeeze: 0.26, tilt: -5 }),
          s('t2', 'foldTable', 252, 636, { squeeze: 0.26, tilt: -5 }),
          s('t3', 'foldTable', 292, 642, { squeeze: 0.26, tilt: -5 }),
        ]
      : [s('t1', 'foldTable', 400, 642), s('t2', 'foldTable', 610, 652), s('t3', 'foldTable', 820, 642)]
  } else if (visual === 'mobileTable') {
    products = afternoon
      ? [s('t1', 'mobileTable', 262, 634), s('t2', 'mobileTable', 560, 650), s('t3', 'mobileTable', 682, 650)]
      : [s('t1', 'mobileTable', 400, 642), s('t2', 'mobileTable', 610, 652), s('t3', 'mobileTable', 820, 642)]
  } else {
    // 구매 전의 지금 모습과 고정형 큰 테이블은 같은 배치다.
    products = [
      generic('t1', 'fixedTable', 390, 646, 104),
      generic('t2', 'fixedTable', 620, 654, 104),
      generic('t3', 'fixedTable', 850, 646, 104),
    ]
  }

  if (stage === 'use') {
    const fixed = visual !== 'foldTable' && visual !== 'mobileTable'
    if (!afternoon) {
      people = [
        s('elder', 'readingElder', 498, 654),
        s('child', 'child', 712, 658, { flip: true }),
        s('wheel', 'wheelchairUser', 925, 658, { flip: true }),
      ]
    } else if (fixed) {
      // 프로그램을 열 빈 바닥이 없어 참여자가 밖에서 기다린다.
      people = [
        s('elder', 'readingElder', 498, 654),
        s('host', 'staff', 1010, 752, { bubble: '자리가 없어요' }),
        s('child', 'child', 1120, 760, { flip: true }),
        s('wheel', 'wheelchairUser', 1240, 764, { flip: true }),
      ]
    } else if (visual === 'foldTable') {
      people = [
        s('host', 'staff', 430, 650),
        s('child', 'child', 566, 660, { flip: true }),
        s('adult', 'walkingAdult', 690, 652, { flip: true }),
        s('wheel', 'wheelchairUser', 816, 660, { flip: true }),
        s('elder', 'readingElder', 938, 636, { flip: true }),
      ]
    } else {
      people = [
        s('host', 'staff', 418, 650),
        s('child', 'child', 618, 668),
        s('wheel', 'wheelchairUser', 812, 660, { flip: true }),
        s('elder', 'readingElder', 945, 634, { flip: true }),
      ]
    }
  }

  return withExecution({ facility: 'library', view: [60, 170, 1340, 640], horizon: 690, actors: [...products, ...people], zones }, request, {
    unit,
    products,
    van: [330, 800],
    supplierOutside: [600, 790],
    supplierInside: [935, 660],
    staff: [1010, 664],
  })
}

// ── 학교 ───────────────────────────────────────────────────

function schoolScene(request: SceneRequest): StageScene {
  const unit = 150
  const s = builder(unit)
  const { visual, moment, missionId } = request
  const stage = request.stage ?? 'use'
  const adjusted = moment === 'b'
  let products: Actor[] = []
  let people: Actor[] = []

  if (visual === 'compactDesk') {
    products = [
      s('d1', 'compactDesk', 340, 746, { lift: 0 }),
      s('d2', 'compactDesk', 570, 746, { lift: adjusted ? 0.1 : 0 }),
      s('d3', 'compactDesk', 800, 746, { lift: adjusted ? 0.17 : 0 }),
    ]
    people = [
      s('child', 'child', adjusted ? 276 : 262, 748),
      s('wheel', 'wheelchairUser', adjusted ? 490 : 462, 750),
      s('adult', 'walkingAdult', adjusted ? 728 : 706, 748),
    ]
  } else if (visual === 'wideDesk') {
    products = [
      s('d1', 'wideDesk', 400, 746, { lift: adjusted ? 0.02 : 0 }),
      s('d2', 'wideDesk', 730, 746, { lift: adjusted ? 0.12 : 0 }),
    ]
    if (adjusted) {
      products.push(generic('p1', 'papers', 400, 746 - 90 * 0.98, 20), generic('p2', 'papers', 730, 746 - 90 * 1.08, 20))
    }
    people = [
      s('child', 'child', adjusted ? 306 : 292, 748),
      s('wheel', 'wheelchairUser', adjusted ? 632 : 606, 750),
      s('adult', 'walkingAdult', 846, 748, { flip: true }),
    ]
  } else if (visual === 'fixedDesk' || (visual === null && missionId === 'M1')) {
    products = [
      generic('d1', 'fixedDesk', 340, 746, 92),
      generic('d2', 'fixedDesk', 570, 746, 92),
      generic('d3', 'fixedDesk', 800, 746, 92),
    ]
    const showTrouble = adjusted
    people = [
      s('child', 'child', 270, 748, showTrouble ? { bubble: '높아요' } : {}),
      s('wheel', 'wheelchairUser', 476, 750),
      s('adult', 'walkingAdult', 716, 748, showTrouble ? { bubble: '낮아요' } : {}),
    ]
  } else {
    // 임무 3: 아직 책상이 없는 지역공유 학습 자리
    people = [
      s('child', 'child', 330, 748),
      s('wheel', 'wheelchairUser', 520, 750),
      s('adult', 'walkingAdult', 716, 748, { bubble: '책상이 필요해요' }),
    ]
  }

  if (stage !== 'use') people = []

  return withExecution({ facility: 'school', view: [120, 440, 940, 420], horizon: 792, actors: [...products, ...people], zones: [] }, request, {
    unit,
    products,
    van: [935, 852],
    supplierOutside: [720, 846],
    supplierInside: [690, 750],
    staff: [240, 748],
  })
}

// ── 주민센터 ───────────────────────────────────────────────

function communityScene(request: SceneRequest): StageScene {
  const unit = 180
  const s = builder(unit)
  const { visual, moment } = request
  const stage = request.stage ?? 'use'
  const zones: Zone[] = [{ key: 'desk', x: 215, y: 560, w: 230, h: 120, label: '민원 창구' }]
  const counter = s('clerk', 'staff', 330, 672)
  let products: Actor[] = []
  let people: Actor[] = [counter]
  const atDoor = s('visitor', 'walkingAdult', 1225, 702, { flip: true })
  const stuck = (bubble: string) => s('visitor', 'walkingAdult', 1100, 694, { flip: true, bubble })
  const guided = s('visitor', 'walkingAdult', 540, 676, { flip: true })

  if (visual === 'kioskText' || visual === 'kioskMenu') {
    products = [s('kiosk', 'kiosk', 985, 680)]
    if (stage === 'use') people = [counter, moment === 'a' ? atDoor : guided]
    if (stage === 'observe') people = [counter, stuck('?'), s('observer', 'staff', 830, 684)]
    if (stage === 'improve') people = [counter, s('visitor', 'walkingAdult', 1225, 702, { flip: true }), s('supplier', 'supplier', 880, 684, { bubble: '개선 중' })]
  } else if (visual === 'voiceOnly') {
    products = [generic('kiosk', 'voicePost', 985, 680, 150)]
    people = [counter, moment === 'a' ? atDoor : stuck('뭐라고 했지?')]
  } else {
    people = [counter, moment === 'a' ? atDoor : stuck('어디로 가지?')]
  }

  return withExecution({ facility: 'community', view: [170, 345, 1300, 540], horizon: 770, actors: [...products, ...people], zones }, request, {
    unit,
    products,
    van: [1250, 880],
    supplierOutside: [1010, 830],
    supplierInside: [880, 684],
    staff: [820, 684],
    keep: [counter],
  })
}

// ── 공원: 안내판(임무 2) ───────────────────────────────────

function parkSignScene(request: SceneRequest): StageScene {
  const unit = 320
  const s = builder(unit)
  const { visual, moment } = request
  const stage = request.stage ?? 'use'
  const eventDay = moment === 'b'
  const zones: Zone[] = eventDay ? [{ key: 'event', x: 1330, y: 640, w: 400, h: 250, label: '오늘의 행사 장소' }] : []
  const bench = s('bench', 'bench', 960, 800)
  let products: Actor[] = []
  let people: Actor[] = []

  if (visual === 'signAssembled' || visual === 'signReady') {
    products = [eventDay ? s('sign', 'portableSign', 1150, 892) : s('sign', 'portableSign', 330, 884)]
    people = eventDay
      ? [s('visitor', 'walkingAdult', 1450, 884), s('wheel', 'wheelchairUser', 1640, 890)]
      : [s('visitor', 'walkingAdult', 120, 892), s('wheel', 'wheelchairUser', 640, 880, { opacity: 0 })]
  } else if (visual === 'signFixed') {
    products = [generic('sign', 'fixedSign', 330, 884, 250)]
    people = eventDay
      ? [s('visitor', 'walkingAdult', 620, 890, { bubble: '어디지?' }), s('wheel', 'wheelchairUser', 880, 890, { flip: true })]
      : [s('visitor', 'walkingAdult', 120, 892), s('wheel', 'wheelchairUser', 640, 880, { opacity: 0 })]
  } else {
    people = [s('visitor', 'walkingAdult', eventDay ? 520 : 160, 892, eventDay ? { bubble: '행사장이 어디지?' } : {})]
  }

  if (stage !== 'use') people = []

  return withExecution({ facility: 'park', view: [0, 130, 1774, 790], horizon: 720, actors: [bench, ...products, ...people], zones }, request, {
    unit,
    products,
    van: [1500, 900],
    supplierOutside: [1250, 895],
    supplierInside: [520, 890],
    staff: [130, 892],
    keep: [bench],
  })
}

// ── 공원: 이동형 쉼·그늘 공간(임무 3) ──────────────────────

function parkCanopyScene(request: SceneRequest): StageScene {
  const unit = 330
  const s = builder(unit)
  const { visual, moment } = request
  const stage = request.stage ?? 'use'
  const moved = moment === 'b'
  const shift = moved ? 420 : 0
  const zones: Zone[] = moved && (visual === 'canopyAssembled' || visual === 'canopyReady')
    ? [{ key: 'before', x: 1985, y: 770, w: 1400, h: 140, label: '옮기기 전 자리' }]
    : []
  const sun = generic('sun', 'sun', 1560, 190, 190)
  let products: Actor[] = []
  let people: Actor[] = []

  if (visual === 'canopyAssembled' || visual === 'canopyReady') {
    // 그늘막 그림(1774×887)을 원본 크기로 놓는다. x는 그림 가운데, y는 받침의 아래.
    products = [{ key: 'canopy', image: 'canopy', x: 2690 + shift, y: 900, h: 887, z: 880 }]
    people = [
      s('elder', 'readingElder', 2420 + shift, 892, { z: 900 }),
      s('child', 'child', 2640 + shift, 884, { z: 900 }),
      s('wheel', 'wheelchairUser', 2900 + shift, 896, { flip: true, z: 900 }),
      s('adult', 'walkingAdult', 3120 + shift, 890, { flip: true, z: 900 }),
    ]
  } else if (visual === 'ornament') {
    products = [generic('canopy', 'ornament', 2700, 900, 430)]
    people = [
      s('elder', 'readingElder', 2360, 892, { bubble: '그늘이 없어요' }),
      s('child', 'child', 2980, 888),
      s('wheel', 'wheelchairUser', 3200, 896, { flip: true }),
    ]
  } else {
    people = [
      s('elder', 'readingElder', 2360, 892, { bubble: '햇볕이 뜨거워요' }),
      s('child', 'child', 2760, 888),
      s('wheel', 'wheelchairUser', 3080, 896, { flip: true }),
    ]
  }

  if (stage !== 'use') people = []

  return withExecution({ facility: 'park', view: [1150, -70, 2700, 1060], horizon: 730, actors: [sun, ...products, ...people], zones }, request, {
    unit,
    products,
    van: [3500, 930],
    supplierOutside: [3250, 920],
    supplierInside: [2250, 900],
    staff: [3200, 900],
    keep: [sun],
  })
}

// ── 실행 연출 덧입히기 ─────────────────────────────────────

type ExecutionSpots = {
  unit: number
  products: Actor[]
  van: [number, number]
  supplierOutside: [number, number]
  supplierInside: [number, number]
  staff: [number, number]
  keep?: Actor[]
}

function withExecution(scene: StageScene, request: SceneRequest, spots: ExecutionSpots): StageScene {
  const stage = request.stage ?? 'use'
  if (stage === 'use' || stage === 'observe' || stage === 'improve') return scene
  const s = builder(spots.unit)
  const keep = spots.keep ?? []
  const front = { z: 2000 }
  if (stage === 'arrive') {
    return {
      ...scene,
      actors: [
        ...keep,
        s('van', 'deliveryVan', spots.van[0], spots.van[1], front),
        s('supplier', 'supplier', spots.supplierOutside[0], spots.supplierOutside[1], { ...front, bubble: '납품' }),
      ],
    }
  }
  if (stage === 'install') {
    return {
      ...scene,
      actors: [
        ...keep,
        ...ghost(spots.products, 0.6),
        s('supplier', 'supplier', spots.supplierInside[0], spots.supplierInside[1], { ...front, bubble: '설치 중' }),
      ],
    }
  }
  return {
    ...scene,
    actors: [...keep, ...spots.products, s('checker', 'staff', spots.staff[0], spots.staff[1], { ...front, bubble: '확인했어요' })],
  }
}

export function getScene(request: SceneRequest): StageScene {
  switch (request.facility) {
    case 'library':
      return libraryScene(request)
    case 'school':
      return schoolScene(request)
    case 'community':
      return communityScene(request)
    case 'park':
      return request.missionId === 'M3' ? parkCanopyScene(request) : parkSignScene(request)
  }
}
