# 현재 은색 버튼 — 생활체육실·회의실·환경 개선·외관

2026-11-06. 내장 image_gen으로 제작한 현재 사용 자산이다. 실제 도구 원본과 프롬프트는 BUTTON_ART_V3_SILVER.json에 함께 보관한다. 나머지 A·C·D·E·F 다섯 버튼은 BUTTON_ART_V3_ROOMS.md를 따른다.

무광 밝은 브러시드 알루미늄, 짙은 회색 중간 굵기 명조, 얇은 회색 테두리다. 한글은 이미지 안에 포함했다. 기존 청록·금색 원본은 .preview/art-originals/interface-v3-teal/에 분리 보관하며 현재 버튼으로 사용하지 않는다.

Sharp 공용 스크립트로 알파의 최대 연결 영역을 기준으로 잘라, 원본 비율 유지 높이 144px·WebP quality94/alphaQuality100으로 저장한다. 프롬프트의 목표 비율과 생성 결과의 실제 비율은 다를 수 있으므로 화면에는 실제 파일 비율을 사용한다.

| ID | 문구 | 실제 크기 | 용량 |
|---|---|---|---:|
| room-B | 생활체육실 | 576 × 144 | 16,932 bytes |
| room-G | 프리미엄회의실 | 574 × 144 | 15,832 bytes |
| campus | 센터 환경 개선 | 581 × 144 | 13,330 bytes |
| return | 센터 외관 | 575 × 144 | 9,942 bytes |

## room-B — 생활체육실

- 배포: `public/center/interface-v3/room-B.webp`
- 보관 원본: `.preview/art-originals/interface-v3/room-B.png`
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-c3514d8c-af0c-4114-96f2-844442a44853.png`
- 제작 기록의 crop: [19,96,2133,533]

```text
Redesign this ONE button as understated premium SILVER architectural signage. Keep exact Korean text "생활체육실", but change the whole style. Front-facing slim rectangular plaque, ratio about 3.8:1. Face: light matte brushed aluminum silver #D7D7D2, subtle satin horizontal grain, no mirror reflections, no gradients with strong contrast. Border: ONE extremely fine graphite-silver hairline, tiny softly rounded corners; NO gold, NO brass, NO green, NO wood. Text: charcoal gray #383C3C, refined medium-weight Korean serif (NOT heavy bold, NOT calligraphy), centered on one line, crisp and readable, letters only about 48 percent of plaque height with compact balanced inner space. It must feel quiet and integrated into a warm hand-painted building, not a highway sign or fantasy UI. Render all Korean letters inside the image itself. No icons, no extra words. No outer shadow, no background panel, no empty external padding; only real transparent alpha outside the exact plate outline. Croppable tight silhouette.
```

## room-G — 프리미엄회의실

- 배포: `public/center/interface-v3/room-G.webp`
- 보관 원본: `.preview/art-originals/interface-v3/room-G.png`
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-620a0889-8a4a-42b9-9c90-628cba9a0680.png`
- 제작 기록의 crop: [19,94,2133,535]

```text
Edit target: the supplied SILVER button, not the previous green design. Create exactly ONE standalone button with exact Korean wording "프리미엄회의실". Keep the same light matte brushed aluminum silver #D7D7D2 face, subtle grain, charcoal gray #383C3C medium-weight Korean serif (NOT heavy bold), thin graphite-silver outline, tiny rounded corners. Change only wording and plaque WIDTH: horizontal plate ratio 5.6:1, enough width that Korean letters remain normal-width, never condensed. Text about half of plate height, quiet refined architectural sign. All text MUST be baked into image. No green, gold, wood, icon, scene, additional text or external shadow. No empty exterior padding; genuinely transparent alpha outside the tight plate outline, no isolated pixels or specks. Front-on orthographic, complete unclipped plate.
```

## campus — 센터 환경 개선

- 배포: `public/center/interface-v3/campus.webp`
- 보관 원본: `.preview/art-originals/interface-v3/campus.png`
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-256dd5e7-4f5a-4e94-a18c-959e47c7e269.png`
- 제작 기록의 crop: [7,93,2157,535]

```text
Edit target: the supplied SILVER button, not the previous green design. Create exactly ONE standalone button with exact Korean wording "센터 환경 개선". Keep the same light matte brushed aluminum silver #D7D7D2 face, subtle grain, charcoal gray #383C3C medium-weight Korean serif (NOT heavy bold), thin graphite-silver outline, tiny rounded corners. Change only wording and plaque WIDTH: horizontal plate ratio 5.3:1, enough width that Korean letters remain normal-width, never condensed. Text about half of plate height, quiet refined architectural sign. All text MUST be baked into image. No green, gold, wood, icon, scene, additional text or external shadow. No empty exterior padding; genuinely transparent alpha outside the tight plate outline, no isolated pixels or specks. Front-on orthographic, complete unclipped plate.
```

## return — 센터 외관

- 배포: `public/center/interface-v3/return.webp`
- 보관 원본: `.preview/art-originals/interface-v3/return.png`
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-789065f3-5a5f-4145-a96f-a32d7a88f469.png`
- 제작 기록의 crop: [19,95,2133,534]

```text
Edit target: the supplied SILVER button, not the previous green design. Create exactly ONE standalone button with exact Korean wording "센터 외관". Keep the same light matte brushed aluminum silver #D7D7D2 face, subtle grain, charcoal gray #383C3C medium-weight Korean serif (NOT heavy bold), thin graphite-silver outline, tiny rounded corners. Change only wording and plaque WIDTH: horizontal plate ratio 3.3:1, enough width that Korean letters remain normal-width, never condensed. Text about half of plate height, quiet refined architectural sign. All text MUST be baked into image. No green, gold, wood, icon, scene, additional text or external shadow. No empty exterior padding; genuinely transparent alpha outside the tight plate outline, no isolated pixels or specks. Front-on orthographic, complete unclipped plate.
```
