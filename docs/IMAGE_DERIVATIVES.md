# 게임용 이미지 파생본 대응표

`node scripts/build-assets.mjs`가 만든다. 원본 PNG는 `public/assets/images/`에 그대로 보존하고,
게임 화면은 아래 WebP 파생본만 불러온다. 원본 좌표는 [이미지 매니페스트](../public/assets/images/manifest.json)가 기준이다.

- 배경 6장: 원본 크기 유지, WebP 품질 80.
- 건물 4장·그늘막: 접지점 비율을 유지하려고 투명 여백을 포함한 전체 틀(1774px 폭)을 그대로 쓴다.
- 아틀라스 스프라이트 15개: 매니페스트의 `cropRect`로 자른 뒤 피사체 경계에 맞췄다.
- 투명 정리: 알파 56 이하는 지우고 208 이상은 불투명으로 올렸다. 주민 그림 주변의 번진 광륜과
  물품 주변의 흩어진 인쇄 자국을 없애기 위한 처리이며, 색과 윤곽은 바꾸지 않았다.

파생본 합계: 2,660,436바이트 (원본 합계 31,355,956바이트).

| 원본 | 파생본 | 크기(px) | 바이트 | 처리 |
|---|---|---:|---:|---|
| `intro-print.png` | `assets/game/bg/intro.webp` | 1536×1024 | 296,508 | 전체 장면, 크기 유지 |
| `town-board.png` | `assets/game/bg/town.webp` | 1536×1024 | 231,490 | 전체 장면, 크기 유지 |
| `library-building.png` | `assets/game/buildings/library.webp` | 1774×887 | 244,820 | 전체 틀 유지, 낮은 알파 정리 |
| `school-building.png` | `assets/game/buildings/school.webp` | 1774×887 | 217,062 | 전체 틀 유지, 낮은 알파 정리 |
| `community-building.png` | `assets/game/buildings/community.webp` | 1774×887 | 211,782 | 전체 틀 유지, 낮은 알파 정리 |
| `park-building.png` | `assets/game/buildings/park.webp` | 1774×887 | 199,992 | 전체 틀 유지, 낮은 알파 정리 |
| `product-atlas.png › foldTable cropRect [23, 16, 401, 396]` | `assets/game/sprites/foldTable.webp` | 309×269 | 16,904 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › mobileTable cropRect [425, 0, 393, 412]` | `assets/game/sprites/mobileTable.webp` | 355×256 | 24,024 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › compactDesk cropRect [819, 0, 417, 412]` | `assets/game/sprites/compactDesk.webp` | 282×305 | 17,768 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › wideDesk cropRect [0, 412, 424, 400]` | `assets/game/sprites/wideDesk.webp` | 347×277 | 17,702 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › kiosk cropRect [425, 412, 393, 400]` | `assets/game/sprites/kiosk.webp` | 268×341 | 31,712 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › portableSign cropRect [819, 412, 421, 400]` | `assets/game/sprites/portableSign.webp` | 275×335 | 22,666 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › bench cropRect [0, 812, 424, 419]` | `assets/game/sprites/bench.webp` | 360×248 | 30,350 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › solarLamp cropRect [425, 812, 391, 442]` | `assets/game/sprites/solarLamp.webp` | 183×358 | 13,374 | 피사체 경계로 자름, 광륜 제거 |
| `product-atlas.png › deliveryVan cropRect [819, 812, 417, 422]` | `assets/game/sprites/deliveryVan.webp` | 360×273 | 30,602 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › walkingAdult cropRect [0, 33, 556, 461]` | `assets/game/sprites/walkingAdult.webp` | 192×360 | 21,466 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › child cropRect [583, 13, 377, 477]` | `assets/game/sprites/child.webp` | 143×331 | 12,482 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › readingElder cropRect [1007, 34, 519, 460]` | `assets/game/sprites/readingElder.webp` | 248×361 | 27,824 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › wheelchairUser cropRect [103, 527, 459, 481]` | `assets/game/sprites/wheelchairUser.webp` | 293×360 | 32,014 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › staff cropRect [639, 529, 255, 481]` | `assets/game/sprites/staff.webp` | 148×360 | 17,300 | 피사체 경계로 자름, 광륜 제거 |
| `resident-atlas.png › supplier cropRect [1009, 529, 505, 479]` | `assets/game/sprites/supplier.webp` | 194×361 | 21,010 | 피사체 경계로 자름, 광륜 제거 |
| `shade-canopy.png` | `assets/game/buildings/canopy.webp` | 1774×887 | 95,646 | 전체 틀 유지, 낮은 알파 정리 |
| `chapter-transition.png` | `assets/game/bg/chapter.webp` | 1536×1024 | 232,368 | 전체 장면, 크기 유지 |
| `progress-workbench.png` | `assets/game/bg/progress.webp` | 1536×1024 | 164,566 | 전체 장면, 크기 유지 |
| `result-paper.png` | `assets/game/bg/result.webp` | 1536×1024 | 117,462 | 전체 장면, 크기 유지 |
| `ending-neighborhood.png` | `assets/game/bg/ending.webp` | 1536×1024 | 311,542 | 전체 장면, 크기 유지 |
