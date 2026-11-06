# 캠퍼스 외관 v3 — 세 독립 사업의 8가지 조합

2026-11-06. 현재 환경 사업 외관의 출처·파일 크기·실제 생성 프롬프트 기록이다. 기계 판독 원본은 CAMPUS_ART_V3.json이다. 이전 BUILDING_ART_V2.md의 순차 성장 외관은 제작 이력으로 보존한다.

## 제작과 사용 방식

조경과 쉼터(garden), 건물 외관(facade), 다목적 광장(plaza)은 독립적으로 완공된다. 완공 조경=1, 외관=2, 광장=4를 조합한 0~7 번호로 이미지를 선택한다. 진행 중인 공사는 외관 비트를 켜지 않는다. 기존 복합 외관 계약이 완공되면 외관과 광장을 함께 표시한다.

- exterior-0.webp는 기존 직접 생성한 기본 외관을 그대로 재사용했다. 새로운 원화 생성이나 재인코딩을 주장하지 않는다.
- 나머지 일곱 원화는 내장 image_gen__imagegen으로 각 자산을 독립 생성·편집했다. 모델 이름은 도구가 반환하지 않아 추정하지 않는다.
- 입력 참조는 프로젝트의 직접 생성한 같은 센터 외관과 해당 사업별 편집본이다. 상용 게임 원화나 외부 사진을 배포 이미지로 복제하지 않았다.
- 건물의 크기·층수·창·진입로·카메라 위치를 유지하도록 요청했다. 조경은 왼쪽 쉼터와 식재, 외관은 입면과 입구 캐노피, 광장은 오른쪽 원형 포장·낮은 야외 무대로 구분한다. 건물 외관에는 사람·문구·로고·이름표를 넣지 않았다.
- 최종 파일은 폭 1600px의 WebP다. 원본 비율을 유지하여 일부 조합의 높이는 901px이며, 다른 조합은 900px다.
- 생성 PNG 일곱 장은 .preview/art-originals/campus-v3/exterior-1.png부터 exterior-7.png에 보존했다. 도구 생성 디렉터리 원본도 유지한다. 기본 외관 원본은 기존 building-v2 기록을 따른다.

## 파일과 화면 용량

| 번호 | 완료 조합 | 배포 파일 | 크기 | 용량 |
|---|---|---|---|---:|
| 0 | 기본 | `public/center/campus-v3/exterior-0.webp` | 1600 × 900 | 439,566 bytes |
| 1 | 조경·쉼터 | `public/center/campus-v3/exterior-1.webp` | 1600 × 900 | 401,628 bytes |
| 2 | 건물 외관 | `public/center/campus-v3/exterior-2.webp` | 1600 × 900 | 378,170 bytes |
| 3 | 조경·쉼터 + 외관 | `public/center/campus-v3/exterior-3.webp` | 1600 × 900 | 384,040 bytes |
| 4 | 다목적 광장 | `public/center/campus-v3/exterior-4.webp` | 1600 × 900 | 383,650 bytes |
| 5 | 조경·쉼터 + 광장 | `public/center/campus-v3/exterior-5.webp` | 1600 × 901 | 378,062 bytes |
| 6 | 외관 + 광장 | `public/center/campus-v3/exterior-6.webp` | 1600 × 901 | 361,510 bytes |
| 7 | 조경·쉼터 + 외관 + 광장 | `public/center/campus-v3/exterior-7.webp` | 1600 × 901 | 391,146 bytes |

전체 여덟 파일은 3,117,772바이트(약 3.12MB)다. 외관 표시에는 campusExteriorPath가 현재 조합 한 장을 선택한다. 한 장의 크기는 361,510~439,566바이트(약 0.36~0.44MB)이며 여덟 장을 한 화면에서 레이어로 합성하지 않는다. 다른 화면의 이미지와 앱 코드·음향까지 합한 전체 전송량과는 다르다.

## 실제 원본과 프롬프트

### 0 — 기본

- 생성/재사용 원본: `C:/Users/admin/OneDrive - 경희여자중학교/ppscon2/public/center/building-v2/exterior.webp`

```text
Existing base exterior; reused unchanged.
```

### 1 — 조경·쉼터

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-e53be1bd-7a59-45f8-8a67-a12550cd48aa.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-1.png`

```text
Edit this exact cultural-center exterior for the game's LANDSCAPING UPGRADE ONLY. Keep EXACT camera, framing, building structure, windows, entrance stairs/ramp, red-brick left wing, cream right wing, sky, autumn tree at upper left, time of day and hand-painted illustration style. Do not enlarge or redesign the building. Make the landscape upgrade unmistakable at thumbnail size: in the LEFT FOREGROUND replace the small plain bench/low flowers with a substantial landscaped pocket garden with curving raised pale-stone beds full of rich autumn flowers and dense shrubs, three well-shaped small trees, and a slim dark-green metal pergola shelter with a light woven shade roof and curved built-in benches. Keep it at lower left, do not hide the building windows. Add lush tiered flower beds and attractive low planting along RIGHT edge. These are realistic high-quality neighborhood public-center grounds, not a palace. The large CENTER FOREGROUND paved plaza remains plain and empty exactly like the reference, for a separate future upgrade. No stage, no additional building canopy, no new facade materials. No people, no text, no signs, no logos. Strong readable color and detailed materials, same architectural illustration, widescreen 16:9, full bleed. Preserve building positions rigorously.
```

### 2 — 건물 외관

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-2a364ed0-5181-4039-ba51-f5b5124b7f8d.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-2.png`

```text
Edit the provided exact neighborhood cultural-center exterior for the FACADE REFURBISHMENT ONLY. Keep the exact building massing, roofline, all seven room window positions, stairs and ramp, camera framing/perspective, sky and autumn trees. Keep TWO stories, realistic local public building. Make the improvement immediately recognizable: replace the plain cream facade surrounds on the central/right two-story wings with refined light limestone panels outlined with strong thin dark bronze vertical fins; replace the long plain horizontal entrance awning with a clearly projecting flat glass-and-deep-bronze portico canopy, a crisp modern geometrical entrance feature supported by two slender bronze posts aligned with the existing posts. Add restrained architectural linear lighting below the new canopy; daytime stays unchanged. Preserve the red brick auditorium wing on the left with a narrow bronze vertical architectural accent at its right corner. Rich, refined architectural design, not ornate and not palace. Keep ALL surrounding gardens, plain foreground plaza paving and small original benches EXACTLY like the reference: no pergola, no raised garden beds, no outdoor stage, no circular plaza, no added building wings. No people, no text, no logos, no labels. Same hand-painted detailed architectural illustration, fuller material contrast, 16:9 full bleed. The facade change must be visually obvious while this remains the exact same center.
```

### 3 — 조경·쉼터 + 외관

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-4c58754a-d059-4891-8628-f9b40fd9af8d.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-3.png`

```text
Create ONE exact combination state of this SAME cultural-center building. Input1 is the LANDSCAPED GARDEN version: preserve its entire lower-left green metal pergola, curving raised stone flower beds, colorful planted small trees and landscaped right edge. Input2 is the FACADE UPGRADE version: use its refined pale limestone facade surrounds and slim bronze vertical fins, wide projecting glass-and-bronze entrance portico, linear light under canopy. COMBINE these two upgrades in one image. Camera, building footprint, roofline, seven room window positions, stairs/ramp, sky, autumn framing tree MUST remain identical. Keep CENTER FOREGROUND the plain original paving: NO circular plaza, NO outdoor stage. Do not invent new structures. Exact recognizable shapes from both references, realistic neighborhood scale, no people or text, same rich hand-painted architecture style, full bleed16:9.
```

### 4 — 다목적 광장

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-1cb133cc-965e-46ea-8eab-bc5310552706.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-4.png`

```text
Edit this exact public cultural-center exterior for the MULTIPURPOSE PLAZA UPGRADE ONLY. Keep exact camera, 16:9 framing, original red-brick and plain cream two-story facade, stairs, accessible ramp, sky, autumn trees, original small gardens and benches. Make the open center/right foreground an unmistakable small public activity square: a broad circular light-gray stone inlay with concentric darker paving bands; at its right back edge, a low accessible semicircular outdoor performance platform, only 35cm high, finished in charcoal stone and pale timber, with two slim integrated standing light posts. A few low curved stone seating blocks flank the activity circle. Keep clear central path to entrance and ramp. Place new activity square in CENTER-RIGHT foreground, leaving lower LEFT garden area and the entire facade unchanged. No tall structures or roofs obscuring room windows. Realistic tasteful neighborhood cultural-center plaza, not grand monument. The new circular plaza and little stage must read clearly even at thumbnail size. Same detailed hand-painted architecture style. NO people, NO letters, NO extra building canopy, NO green pergola or landscaped raised flowerbeds. Full bleed.
```

### 5 — 조경·쉼터 + 광장

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-36f7560d-2d08-4543-bfb4-8c63dc6ae566.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-5.png`

```text
Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine input1 LANDSCAPING (lower-left dark green pergola, curving stone raised gardens with vivid autumn flowers and small trees, landscaped right-edge) with input2 PLAZA (center-right circular paving rings, low curved stone seats, low timber outdoor performance platform at right with two slim lamp posts). Keep the building facade original: red brick left, plain cream surrounds and original short wood-lined entrance awning, no new bronze glass portico or bronze fins. All three landscape features and circular activity plaza must remain clearly visible together.
```

### 6 — 외관 + 광장

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-ea277150-a24b-44ea-9214-e65ca17087f5.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-6.png`

```text
Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine input1 FACADE refurbishment (large projecting glass-and-bronze entrance portico, bronze vertical fins around pale limestone facade) with input2 PLAZA (center-right circular paving rings, low curved stone seats, low timber outdoor stage at right with two slim lamp posts). Keep ORIGINAL modest landscaping: plain bench and low simple flowers at left, no green pergola, no raised curving flowerbeds, no new large landscaped trees. Show only these TWO upgrades together.
```

### 7 — 조경·쉼터 + 외관 + 광장

- 생성/재사용 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-9ed199da-3e06-4b68-be3a-921553c26e87.png`
- 보관 PNG: `.preview/art-originals/campus-v3/exterior-7.png`

```text
Make ONE precise combined upgrade state of this SAME neighborhood cultural center. Preserve EXACT same camera/framing, 16:9, two stories, roofline, seven room window positions, entrance stairs and accessible ramp, autumn sky/tree, realistic neighborhood scale, same detailed painted architectural style. No people, no writing, no new extra wings. Match exact shapes/positions of the requested upgrades from references, not unrelated redesigns. Combine ALL THREE upgrades exactly: input1 landscaped garden with lower-left dark-green pergola, curved stone raised flowerbeds full of colorful flowers/small trees and lush right-edge planting; input2 pale limestone/bronze fins facade and large projecting bronze/glass entrance portico with linear light; input3 circular center-right activity plaza with stone paving rings, curved low seats and low timber outdoor stage at right with two slim lamp posts. Retain the red brick left auditorium and all windows. All THREE upgrades must be unmistakably present simultaneously. Do not remove the pergola, the glass portico, or the small stage.
```
