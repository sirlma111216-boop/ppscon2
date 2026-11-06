# 센터 게임 자산과 출처

갱신일: 2026-11-06. 이 문서는 **현재 본게임에 사용 중인 자산**, 별도 미리보기, 이전 제작 기록을 구분합니다.

## 현재 본게임 자산

| 위치 | 내용·수량 | 출처와 사용 상태 |
|---|---|---|
| `public/center/building-v2/*.webp` | 우리 센터 외관 3단계·실내 7장 | 2026-11-06 내장 image_gen 생성, 외관/실내 화면에 적용 |
| `public/center/classes-v2/P01,P02,P03,P04,P06,P07,P09.webp` | 클래스 카드 7장 | 내장 image_gen 신규 생성, 정적인 인물 포함 |
| `public/center/rivals-v2/*.webp` | 경쟁센터 외관 9장 | 내장 image_gen 생성, 경쟁센터 비교에 적용 |
| `public/center/interface-v2/room-plaque*.webp` | 기본/활성 안내판 2종 | 내장 image_gen 생성·편집, 방/환경 개선/돌아가기 버튼 스킨 |
| `public/center/*-portrait.png` | 오지선·한도윤·윤하린 초상 3장 | 아래 2026-11-05 원본 제작 기록 참조, 정적 대화에 사용 |
| `public/center/official/` | 조달청 로고 2종·나르미와 달이 | 사용자 제공 공모전 공식 자산, 생성 이미지와 구분 |
| `src/center/ProcurementDesk.tsx` | 조달 물품 SVG 삽화 | 프로젝트에서 직접 작성한 가상 물품 그림 |
| `src/center/audio.ts` | BGM·효과음 | 직접 작성한 Web Audio 합성 스케치, 외부 음원 아님 |

메인 장면은 더 이상 코드로 그린 평면도가 아닙니다. 건물 외관 그림의 HTML 이름표를 눌러 실내로 들어갑니다. 실내 그림에는 고정 마감과 기본 가구만 있고 매트·컴퓨터·스크린·음향·이동무대·공예도구처럼 구매해야 하는 기능 장비는 미리 그리지 않았습니다. 실제 보유 상태와 기능은 엔진 데이터 및 UI가 표시합니다.

건물과 경쟁센터 외관에는 사람을 넣지 않았습니다. 본게임에서 사람은 정적 클래스 카드와 대화 초상에만 나타납니다. 이미지 자체에 버튼 글자나 잠금 표시를 구워 넣지 않았으며 이름과 상태는 접근 가능한 HTML로 표시합니다.

### 생성 기록과 웹 최적화

- [건축·성장 외관·안내판 프롬프트와 검수](BUILDING_ART_V2.md)
- [클래스 카드 7종 프롬프트와 검수](CLASS_ART_V2.md)
- [경쟁센터 외관 9종 프롬프트와 검수](RIVAL_ART_V2.md)
- [공식 조달 화면 참고 및 게임 적용](PROCUREMENT_REFERENCE.md)

새 그림은 내장 `image_gen`으로 제작했습니다. 사용한 모델 이름은 도구가 반환하지 않아 임의로 명시하지 않습니다. 특정 작가의 그림이나 상용 게임 원화를 배포 자산으로 사용하지 않았습니다. 건물의 텍스트/공공건축 참고 자료와 생성 참조 입력은 위 제작 기록에 구분해 적었습니다. 경쟁센터는 새로 생성한 우리 센터 외관을 스타일 참조로 사용하되 각자 다른 건물 형태로 제작했습니다.

배포 파생본은 Sharp로 크기·형식을 최적화했습니다. 우리 외관은 폭 1600px, 내부는 1280px, 클래스 카드는 768×512, 경쟁 외관은 800×533, 안내판은 알파를 보존한 600×200 WebP입니다. 원본 그림의 색을 일괄 변환하거나 다른 그림으로 다시 합성한 것이 아닙니다.

생성 PNG 원본은 `.preview/art-originals/building-v2/`, `classes-v2/`, `rivals-v2/`에 보관합니다. 안내판 원본 PNG는 현재 `public/center/interface-v2/`에도 보존되어 있지만 실제 UI는 WebP를 사용합니다. 원본 생성 경로·이동 전후 해시 확인·최종 프롬프트는 개별 제작 기록을 따릅니다.

경쟁기관 ID는 `boram, rhythm, tantan, baeum, saebom, neulpum, pureun, byeolbit, daon`입니다. 기존 온누리는 현재 경쟁 목록과 자산 생성 범위에서 제외했습니다. 우리 센터까지 총 10개 기관입니다.

### 사용자 제공 공식 자산

- `pps-logo-horizontal.jpg`: 가로형 조달청 로고.
- `pps-logo-vertical.jpg`: 세로형 조달청 로고 보관본.
- `nareumi-dari-3d.png`: 제공 파일 “조달청 나르미와 달이 3D.png”의 내부 파일명. 화면에는 **나르미·달이**로 표기합니다.

사용자 제공 원본을 복사해 사용했으며 새로운 AI 생성 자산으로 취급하지 않습니다. 로고와 캐릭터의 색·비율을 변형하지 않습니다. 조달 화면의 게임 표시를 유지하며 실제 기관의 거래 화면이나 실제 계약 인증을 뜻하지 않습니다.

## 별도 미리보기와 미사용 기록

**도예 수업은 별도 미리보기이며 본게임에 미적용**입니다. `public/center/prototypes/pottery/`의 작업 중 시안과 관련 원본은 본게임의 사람 애니메이션 완성 자산으로 집계하지 않습니다. 사용자 검토와 후속 작업이 진행 중입니다.

`public/center/center-interior.png`는 이전 3실 배경 보관본으로, 현재 메인 센터 장면에서는 사용하지 않습니다. 아래의 생성 당시 프롬프트에 적힌 사람 오버레이·추가 스프라이트 계획은 당시 제작 의도이며 현재 본게임의 구현 지시가 아닙니다. 최종 음원은 아직 제작·연결하지 않았습니다.

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
