# 센터 게임 자산과 출처

갱신일: 2026-11-06. 이 문서는 **현재 본게임에 사용 중인 자산**, 별도 미리보기, 이전 제작 기록을 구분합니다.

## 현재 본게임 자산

| 위치 | 내용·수량 | 출처와 사용 상태 |
|---|---|---|
| `public/center/campus-v3/exterior-0..7.webp` | 독립 조경·외관·광장 8조합 | 기본 외관 재사용 1장·내장 image_gen 편집 7장, 현재 완공 조합에 적용 |
| `public/center/building-v2/room-A..G.webp` | 실내 7장 | 2026-11-06 내장 image_gen 생성, 방 내부 화면에 적용 |
| `public/center/classes-v2/P01,P02,P03,P04,P07,P09.webp` | 클래스 카드 6장 | 내장 image_gen 생성, 정적인 인물 포함 |
| `public/center/classes-v3/P06.webp` | 생활안전 교실 카드 1장 | 내장 image_gen 편집, 강사와 학습자가 있는 무료 안전교육 장면 |
| `public/center/rivals-v2/*.webp` | 경쟁센터 외관 9장 | 내장 image_gen 생성, 경쟁센터 비교에 적용 |
| `public/center/interface-v3/room-A..G,campus,return.webp` | 한글 포함 은색 버튼 9장 | 내장 image_gen 생성·편집, 방/환경 개선/센터 외관 버튼 |
| `public/center/prototypes/pottery/poster.webp` · `src/center/potteryMotion.ts` | 공예 운영 장면·움직임 정의 | 직접 생성한 도예 원화와 고정 배경 모션, 실제 현재 방·시간대의 공예 운영 시 분할 코드 번들을 불러옴 |
| `public/center/classes-v3/premium-*.webp` | 필라테스·전문 도예·영상 제작 카드 3장 | 내장 image_gen으로 각각 생성한 창작 삽화, 원본과 프롬프트는 PREMIUM_CLASS_ART.json |
| `public/center/classes-v3/special-P14..P21.webp` | 방 전용 클래스 카드 추가 8장 | 내장 image_gen으로 각각 생성, 원본·실제 프롬프트는 SPECIALIST_CLASS_ART.json |
| `public/center/*-portrait.png` | 오지선·한도윤·윤하린 초상 3장 | 아래 2026-11-05 원본 제작 기록 참조, 정적 대화에 사용 |
| `public/center/official/` | 조달청 로고 2종·나르미와 달이 | 사용자 제공 공모전 공식 자산, 생성 이미지와 구분 |
| `src/center/ProcurementDesk.tsx` | 조달 물품 SVG 삽화 | 프로젝트에서 직접 작성한 가상 물품 그림 |
| `src/center/audio.ts` | BGM·효과음 | 직접 작성한 Web Audio 합성 스케치, 외부 음원 아님 |

메인 장면은 더 이상 코드로 그린 평면도가 아닙니다. 건물 외관 그림의 HTML 이름표를 눌러 실내로 들어갑니다. 실내 그림에는 고정 마감과 기본 가구만 있고 매트·컴퓨터·스크린·음향·이동무대·공예도구처럼 구매해야 하는 기능 장비는 미리 그리지 않았습니다. 실제 보유 상태와 기능은 엔진 데이터 및 UI가 표시합니다.

건물과 경쟁센터 외관에는 사람을 넣지 않았습니다. 사람은 정적 클래스 카드·대화 초상과 실제 공예 운영 중인 방의 인라인 장면에 나타납니다. 계획 단계에는 사람 애니메이션이 없으며 수업 팝업도 사용하지 않습니다. 버튼에는 한글 이름을 이미지 안에 포함했고 HTML 버튼의 접근 가능한 이름과 잠금·공사 상태는 별도로 유지합니다.

### 생성 기록과 웹 최적화

- [건축·성장 외관·안내판 프롬프트와 검수](BUILDING_ART_V2.md)
- [독립 환경 사업 8가지 외관과 원본 기록](CAMPUS_ART_V3.md)
- [은색 공간 버튼 A·C·D·E·F와 거절된 청록 시안](BUTTON_ART_V3_ROOMS.md)
- [은색 생활체육실·프리미엄회의실·환경 개선·외관 버튼](BUTTON_ART_V3_SILVER.md)
- [이전 청록 동작 버튼 기록 — 현재 사용하지 않는 시안](BUTTON_ART_V3_ACTIONS.md)
- [클래스 카드 7종 프롬프트와 검수](CLASS_ART_V2.md)
- [생활안전 교실 P06 교체 원화와 실제 프롬프트](SAFETY_CLASS_ART.md)
- [고급 클래스 3종 원화](PREMIUM_CLASS_ART.md)
- [전용 클래스 추가 8종 원화](SPECIALIST_CLASS_ART.md)
- [경쟁센터 외관 9종 프롬프트와 검수](RIVAL_ART_V2.md)
- [공식 조달 화면 참고 및 게임 적용](PROCUREMENT_REFERENCE.md)

새 그림은 내장 `image_gen`으로 제작했습니다. 사용한 모델 이름은 도구가 반환하지 않아 임의로 명시하지 않습니다. 특정 작가의 그림이나 상용 게임 원화를 배포 자산으로 사용하지 않았습니다. 건물의 텍스트/공공건축 참고 자료와 생성 참조 입력은 위 제작 기록에 구분해 적었습니다. 경쟁센터는 새로 생성한 우리 센터 외관을 스타일 참조로 사용하되 각자 다른 건물 형태로 제작했습니다.

배포 파생본은 Sharp로 크기·형식을 최적화했습니다. 우리 외관은 폭 1600px, 내부는 1280px, 클래스 카드는 768×512, 경쟁 외관은 800×533입니다. 은색 버튼은 알파 최대 연결 영역의 바깥 여백을 잘라 높이 144px·원본 비율·WebP quality94/alphaQuality100으로 저장했습니다. 색 교체와 환경 사업 조합은 내장 image_gen 편집이며 코드로 재착색한 작업이 아닙니다.

생성 PNG 원본은 `.preview/art-originals/` 아래 `building-v2/`, `campus-v3/`, `classes-v2/`, `classes-v3/`, `rivals-v2/`, `interface-v2/`, `interface-v3/`에 보관합니다. 거절된 청록·금색 버튼 9장의 원본은 `interface-v3-teal/`로 분리했습니다. 원본을 public에 중복 배포하지 않으며 실제 UI는 WebP를 사용합니다. 원본 생성 경로·최종 프롬프트는 개별 제작 기록을 따릅니다.

외관 8장 합계는 3,117,772바이트(약 3.12MB), 은색 버튼 9장은 114,676바이트입니다. 외관 장면은 완공 조합에 맞는 한 장(361,510~439,566바이트)을 선택하며 여덟 장을 겹쳐 합성하지 않습니다. 이 수치는 외관 자산 단위 용량이며, 모달·실내·클래스 등 다른 화면의 이미지 전송량을 포함하지 않습니다.

경쟁기관 ID는 `boram, rhythm, tantan, baeum, saebom, neulpum, pureun, byeolbit, daon`입니다. 기존 온누리는 현재 경쟁 목록과 자산 생성 범위에서 제외했습니다. 우리 센터까지 총 10개 기관입니다.

### 사용자 제공 공식 자산

- `pps-logo-horizontal.jpg`: 가로형 조달청 로고.
- `pps-logo-vertical.jpg`: 세로형 조달청 로고 보관본.
- `nareumi-dari-3d.png`: 제공 파일 “조달청 나르미와 달이 3D.png”의 내부 파일명. 화면에는 **나르미·달이**로 표기합니다.

사용자 제공 원본을 복사해 사용했으며 새로운 AI 생성 자산으로 취급하지 않습니다. 로고와 캐릭터의 색·비율을 변형하지 않습니다. 조달 화면의 게임 표시를 유지하며 실제 기관의 거래 화면이나 실제 계약 인증을 뜻하지 않습니다.

## 공예 관람 연출과 미사용 기록

최신 사용자 요청에 따라 고정 배경 시안을 **실제 공예 수업 시간의 실내 그림 자리**에 테두리 없이 표시합니다. 재생용 `poster.webp`는 80,006바이트이고 `src/center/potteryMotion.ts`는 Vite 분할 번들입니다. public 모듈 직접 import와 2.47MB 저장용 애니메이션 WebP는 본게임에서 사용하지 않습니다. 네 사람의 고개·상체·팔을 연결해 움직이고 배경·가구·그릇은 유지합니다. 운영 시간대와 그림 동작을 각각 멈출 수 있으며 경제 계산을 다시 실행하지 않습니다. 다른 종류의 클래스 애니메이션은 미구현입니다. 픽셀 검증과 한계는 [도예 움직임 기록](POTTERY_ANIMATION_PROTOTYPE.md), 새 카드의 프롬프트와 용량은 [고급 클래스 그림](PREMIUM_CLASS_ART.md)을 따릅니다.

화면 재구성·손 동작 보강 전 중간 빌드의 모션 청크는 1,368바이트(gzip 854바이트), 관람 그림과의 합계는 81,374바이트였습니다. 후속 보강본의 최종 크기는 새 빌드 후 기록합니다. 실제 전송 압축과 캐시는 제공 서버·브라우저에 따라 달라집니다. TypeScript 모션과 독립 모션은 같은 알고리즘을 유지하며 픽셀 일치를 회귀 검사합니다.

`public/center/center-interior.png`는 이전 3실 배경 보관본으로, 현재 메인 센터 장면에서는 사용하지 않습니다. 아래의 생성 당시 프롬프트에 적힌 사람 오버레이·추가 스프라이트 계획은 당시 제작 의도이며 현재 본게임의 구현 지시가 아닙니다. 최종 음원은 아직 제작·연결하지 않았습니다.

`building-v2/exterior-garden.webp`, `exterior-renovated.webp`의 순차 성장 외관과 `interface-v2/room-plaque*.webp`는 이전 시안입니다. `BUILDING_ART_V2.md`와 이전 청록 버튼 프롬프트는 제작 이력으로 보존하며 현재 스타일 지침으로 사용하지 않습니다. 현재 P06은 생활안전 교실이고, P05 모임 대관은 활동과 표시를 유지합니다.

## 2026-11-05 원본 제작 기록

다음 기록은 초상과 이전 배경의 출처·프롬프트 보존을 위한 것입니다. 현재 사용 상태와 범위는 위 목록을 우선합니다.

The image assets documented below were generated on 2026-11-05 using the built-in image_gen tool. They are newly generated originals for the center-growth game, with no uploaded artist reference or existing game assets used. Model name was not returned by the tool and is not asserted here.

## Center interior

- Project path: public/center/center-interior.png
- Original: C:/Users/admin/.codex/generated_images/01a1aa99-3704-7003-adc9-3998f17ff215/exec-2138220c-67d0-405d-b679-0186e1528b60.png
- Generation background: opaque
- Visual review: three empty activity rooms, no people, no baked lettering, clear foreground floor. Actual wall boundaries are approximately 25% and 70% of image width; adapt room overlays to the generated architecture.
- Post-processing: none at generation handoff. Original copied unchanged.

### Final prompt

Use case: illustration-story. Asset type: 16:9 wide environment background for a Korean institution-raising management game, with separate animated characters to be overlaid later.
Create a polished original 2D hand-drawn animation background of a modest modern Korean neighborhood municipal culture and sports center. Front wall removed in a wide architectural cutaway, almost frontal camera slightly elevated, consistent single perspective. THREE adjacent rooms with clear vertical separating walls, left culture classroom at 8-35% image width, center multipurpose activity room at 39-66%, right event/storage room at 70-96%. All three have mostly clear unobstructed floor space in the lower half, for animated people to stand around 62-82% image height. A few basic chairs and simple storage along rear/perimeter walls ONLY. No activity equipment, no computers, no yoga mats, no stage, no supplies yet purchased. Upper half has lovely tall windows with understated leafy neighborhood trees outside. Small foreground lobby/walkway, a few houseplants and a blank noticeboard. Contemporary Korean public facility details, warm light wood, pale blue walls, muted teal and coral accents. Warm late-morning daylight. Individually drawn asymmetrical lines, restrained two/three-value cel shading over softly painted background surfaces. Charming but mature and believable, premium 2D life-simulation production art, nuanced material handling and confident clear composition. NOT plastic 3D, NOT toy dollhouse, NOT paper collage, NOT risograph, NOT generic beige AI style. NO PEOPLE, NO HUMAN FIGURES. NO letters, signs, numbers, typography, logos, watermark, UI, or borders. Keep open foreground floors readable, all rooms equal visual importance. Entire image is the environment, no text panels.

## Oh Jiseon portrait

- Project path: public/center/jiseon-portrait.png
- Original: C:/Users/admin/.codex/generated_images/01a1aa99-3704-7003-adc9-3998f17ff215/exec-c82af9a0-3792-4e35-b2f9-2b120215ddcc.png
- Generation background: transparent alpha requested
- Visual review: adult face, teal cardigan, blank clipboard, two visible hands; no baked lettering.
- Post-processing: none at generation handoff. Original copied unchanged.

### Final prompt

Use case: illustration-story. Asset type: transparent-background half-body dialogue portrait for the same modern Korean culture and sports center life simulation.
An original distinctive 43-year-old Korean woman called Oh Jiseon, practical warm operations manager, standing in a relaxed three-quarter pose facing slightly left towards the player. Waist-up with head and both hands completely within frame. Shoulder-length dark brown hair with natural side part, defined thoughtful eyebrows, mature oval-square face with subtle smile lines and a characterful nose, intelligent gentle confident expression. Teal knitted cardigan over cream blouse, understated work lanyard without text. Holds a blank clipboard naturally near the waist with two anatomically coherent hands. Adult realistic animation proportions around 6.5 heads, not chibi, not idealized teenage anime face. Distinctive hand-drawn varied-weight dark navy outlines, two/three-tone cel shading, soft painterly material accents, polished modern 2D animated-life-simulation character art. Small asymmetries and lived-in professionalism, appealing but grounded. Palette warm skin, dark brown hair, cream and teal. Lighting soft warm from upper left. Transparent alpha background with clean edges, no shadows outside character, no scenery. No text or logos anywhere. Do not make a 3D render, clay character, photographic face, risograph illustration or paper-cutout. Single character only, single pose, full unobscured face.

## Scope

This historical first pair was followed by the other two portraits and the v2 artwork indexed above. Additional portrait expressions and final audio remain unfinished. No audio asset was generated by the original image task.

## Han Doyun portrait

- Generated on 2026-11-05 using the built-in image_gen tool.
- Project path: public/center/doyun-portrait.png
- Original: C:/Users/admin/.codex/generated_images/01a1aa99-3704-7003-adc9-3998f17ff215/exec-373e2346-c400-4988-b0a9-7404435940fa.png
- Reference: newly generated Oh Jiseon portrait above, used only to match the project's original art style.
- Visual review: distinct male technician, short curls, broad shoulders, navy/amber work vest, screwdriver and work gloves, coherent hands, no text.
- Post-processing: none at generation handoff.

### Final prompt

Use case: style-transfer / companion character portrait. The supplied image is the STYLE REFERENCE for an existing game cast, not an identity to preserve. Produce one NEW cast portrait in precisely the same refined hand-drawn 2D Korean life-simulation illustration style: varied-weight dark navy line, clean two/three-tone cel shading, subtle tactile painted clothing, warm upper-left light. Replace the woman entirely with Han Doyun, a 31-year-old Korean male facilities technician. Waist-up adult character, broad shoulders and sturdy build, short dark curly hair, open friendly adult face with a slightly square jaw and a confident practical smile. Modern navy work vest over rolled-sleeve light warm-gray shirt, restrained amber-orange pockets/trim, a pair of work gloves tucked naturally at the waist. One hand holds a small screwdriver naturally near his midsection while the other hand rests casually, coherent five-finger anatomy and proportionate hands. Half body with full head, elbows and hands inside frame, gentle three-quarter orientation towards the player, balanced readable silhouette like the reference. Single character only. Distinct face, body and hair from the reference woman; no identical face swap. Polished modern animation character portrait, not chibi, not toy, not photorealistic, not plastic 3D. Genuine transparent alpha background, no scene, no cast shadow outside character. No text, logos, badges with writing, watermark, labels or frame.

## Yoon Harin portrait

- Generated on 2026-11-05 using the built-in image_gen tool.
- Project path: public/center/harin-portrait.png
- Original: C:/Users/admin/.codex/generated_images/01a1aa99-3704-7003-adc9-3998f17ff215/exec-51b10ea1-08b8-4896-9495-8b02714ad4fd.png
- Reference: newly generated Oh Jiseon portrait above, used only to match the project's original art style.
- Visual review: bob haircut with bangs, enthusiastic adult instructor, coral apron, brush and blank sketchbook, coherent hands, no text.
- Post-processing: none at generation handoff.

### Final prompt

Use case: style-transfer / companion character portrait. The supplied image is the STYLE REFERENCE for an existing game cast, not an identity to preserve. Produce one NEW cast portrait in precisely the same refined hand-drawn 2D Korean life-simulation illustration style: varied-weight dark navy outlines, clear two/three-value cel shading, subtle painterly texture in fabric, warm upper-left light, adult realistic animation proportions. Replace the reference woman entirely with Yoon Harin, a 29-year-old Korean woman culture and craft instructor. Distinct youthful adult face, expressive lively eyes and a bright enthusiastic smile; charcoal-black short bob hair with short straight bangs, different face and silhouette from the reference manager. Long cream shirt with sleeves neatly rolled, muted coral-pink artist apron with useful pockets. One hand holds a small paintbrush, the other supports a plain blank sketchbook, natural coherent hands, relaxed engaged teaching pose. Waist-up portrait with full head and both hands fully in frame, angled slightly towards the player, consistent scale and finish with the reference. Friendly creative energy, mature approachable actual community arts instructor, not a fantasy heroine. Single character only. Genuine transparent alpha background and clean silhouette edges, no scenery or shadow beyond figure. No words, lettering, logos, watermark, decorative UI or frame. Not chibi, not photoreal, not 3D or paper-cutout.
