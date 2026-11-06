# 건물 공간 버튼 v3 — 현재 은색 승인안

## 현재 사용 자산: A·C·D·E·F

사용자 요청에 따라 기존 청록·금색 시안을 무광 은색 안내판으로 교체했다. 밝은 브러시드 알루미늄(#D7D7D2), 짙은 회색(#383C3C) 중간 굵기의 명조, 얇은 회색 테두리다. 문구는 비트맵에 포함되며 HTML 문구를 겹치지 않는다. 글자 높이는 판 높이의 약 50%를 요청했다.

- 도구: built-in `image_gen__imagegen`; 각 자산마다 독립 편집 호출 1회. CLI/API 대체 도구 사용 없음.
- 기준 이미지(은색 생활체육실): `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-c3514d8c-af0c-4114-96f2-844442a44853.png`
- 기준 이미지를 `view_image`로 확인한 뒤 모든 호출의 `referenced_image_paths`에 지정하고, `transparent_background: true`로 생성했다.
- 프로젝트 공용 `scripts/prepare-image-button.mjs` 사용: 알파 >16의 최대 연결 영역으로 판의 경계를 계산하여 외부 잡점을 제외하고 crop, 원본 비율 유지 높이 144px, WebP quality94 / alphaQuality100 / effort6.
- 최종 다섯 파일을 `view_image`로 육안 검증했다. 한글과 숫자는 정확하며, 상하좌우 경계에 알파 >16 픽셀이 있어 통째로 빈 바깥 행·열이 없다. 둥근 모서리 투명도는 보존한다.
- 사용자 명시 교체 요청에 따라 기존 interface-v3 파일을 덮어썼다. 이전 청록 원본은 `.preview/art-originals/interface-v3-teal/`에 별도 보존되어 있다. 새 은색 원본은 `.preview/art-originals/interface-v3/`에 복사했으며 도구 원본도 삭제하지 않았다.
- 이번 자산 작업은 CSS/TS를 수정하지 않았다.

| ID | 이미지 문구 | 현재 배포 파일 | 크기 | 가로:세로 | 용량 |
|---|---|---|---|---|---:|
| room-A | 소강당 1 | `public/center/interface-v3/room-A.webp` | 411 × 144 | 2.854:1 | 7,740 bytes |
| room-C | 대강당 | `public/center/interface-v3/room-C.webp` | 413 × 144 | 2.868:1 | 9,032 bytes |
| room-D | 소강당 2 | `public/center/interface-v3/room-D.webp` | 403 × 144 | 2.799:1 | 15,200 bytes |
| room-E | 공예실 | `public/center/interface-v3/room-E.webp` | 408 × 144 | 2.833:1 | 11,972 bytes |
| room-F | 배움실 | `public/center/interface-v3/room-F.webp` | 403 × 144 | 2.799:1 | 14,696 bytes |

은색 다섯 파일 합계: 58,640 bytes.

## 현재 은색 원본과 실제 전달 프롬프트

### room-A — 소강당 1

- 보관 원본: `.preview/art-originals/interface-v3/room-A.png`
- 원본 크기: 2098 × 750px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-4887c05f-8dbd-46d4-82f6-1d66498c92b8.png`
- crop (inclusive): left=13, top=11, right=2085, bottom=737

```text
Edit the supplied silver Korean room-sign image. It is the approved visual master and the exact material and typographic style to match. Deliver ONE finished front-facing horizontal room plaque with exactly this single-line Korean inscription baked into the bitmap: "소강당 1". Replace the original text completely. No additional letters, numbers, logos, symbols or icons. Preserve the understated matte light brushed aluminum face, neutral warm silver approximately #D7D7D2, subtle fine horizontal metal brushing, very thin quiet gray border and small softened corner radius. Preserve the dark gray #383C3C medium-weight Korean Myeongjo serif lettering of the master, never extra-bold, never black heavy display calligraphy. Text height should be about 50% of the plaque height, with calm generous top and bottom breathing space. Keep Korean glyph shape and the inscription exact. For a numbered room, include a normal space before the room number. Shorten the physical plaque width to fit this shorter inscription; the plaque itself should be approximately 2.8:1 width-to-height, with balanced side padding, not the original very wide plate. Use the same text height proportion for every room name. No teal, no gold, no brass, no bronze, no wood, no ornament, no gloss flare. Straight-on view, perfectly level horizontal baseline. The only object is the complete plaque. True transparent alpha background, tight frame to the physical edge of the plaque, no blank outside margins, no floating specks, no debris, no external shadow or floor. Exact required text: 소강당 1
```

### room-C — 대강당

- 보관 원본: `.preview/art-originals/interface-v3/room-C.png`
- 원본 크기: 2098 × 749px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-5ee0b9ab-b457-418e-a8eb-a8b88e8e3469.png`
- crop (inclusive): left=14, top=13, right=2083, bottom=733

```text
Edit the supplied silver Korean room-sign image. It is the approved visual master and the exact material and typographic style to match. Deliver ONE finished front-facing horizontal room plaque with exactly this single-line Korean inscription baked into the bitmap: "대강당". Replace the original text completely. No additional letters, numbers, logos, symbols or icons. Preserve the understated matte light brushed aluminum face, neutral warm silver approximately #D7D7D2, subtle fine horizontal metal brushing, very thin quiet gray border and small softened corner radius. Preserve the dark gray #383C3C medium-weight Korean Myeongjo serif lettering of the master, never extra-bold, never black heavy display calligraphy. Text height should be about 50% of the plaque height, with calm generous top and bottom breathing space. Keep Korean glyph shape and the inscription exact. For a numbered room, include a normal space before the room number. Shorten the physical plaque width to fit this shorter inscription; the plaque itself should be approximately 2.8:1 width-to-height, with balanced side padding, not the original very wide plate. Use the same text height proportion for every room name. No teal, no gold, no brass, no bronze, no wood, no ornament, no gloss flare. Straight-on view, perfectly level horizontal baseline. The only object is the complete plaque. True transparent alpha background, tight frame to the physical edge of the plaque, no blank outside margins, no floating specks, no debris, no external shadow or floor. Exact required text: 대강당
```

### room-D — 소강당 2

- 보관 원본: `.preview/art-originals/interface-v3/room-D.png`
- 원본 크기: 2098 × 750px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-fa3e7d4b-f5c8-4b9c-aebc-d385f22a08a6.png`
- crop (inclusive): left=2, top=0, right=2095, bottom=748

```text
Edit the supplied silver Korean room-sign image. It is the approved visual master and the exact material and typographic style to match. Deliver ONE finished front-facing horizontal room plaque with exactly this single-line Korean inscription baked into the bitmap: "소강당 2". Replace the original text completely. No additional letters, numbers, logos, symbols or icons. Preserve the understated matte light brushed aluminum face, neutral warm silver approximately #D7D7D2, subtle fine horizontal metal brushing, very thin quiet gray border and small softened corner radius. Preserve the dark gray #383C3C medium-weight Korean Myeongjo serif lettering of the master, never extra-bold, never black heavy display calligraphy. Text height should be about 50% of the plaque height, with calm generous top and bottom breathing space. Keep Korean glyph shape and the inscription exact. For a numbered room, include a normal space before the room number. Shorten the physical plaque width to fit this shorter inscription; the plaque itself should be approximately 2.8:1 width-to-height, with balanced side padding, not the original very wide plate. Use the same text height proportion for every room name. No teal, no gold, no brass, no bronze, no wood, no ornament, no gloss flare. Straight-on view, perfectly level horizontal baseline. The only object is the complete plaque. True transparent alpha background, tight frame to the physical edge of the plaque, no blank outside margins, no floating specks, no debris, no external shadow or floor. Exact required text: 소강당 2
```

### room-E — 공예실

- 보관 원본: `.preview/art-originals/interface-v3/room-E.png`
- 원본 크기: 2098 × 750px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-6a4c623c-4765-45f9-b653-d1fc8d3101e9.png`
- crop (inclusive): left=8, top=7, right=2090, bottom=741

```text
Edit the supplied silver Korean room-sign image. It is the approved visual master and the exact material and typographic style to match. Deliver ONE finished front-facing horizontal room plaque with exactly this single-line Korean inscription baked into the bitmap: "공예실". Replace the original text completely. No additional letters, numbers, logos, symbols or icons. Preserve the understated matte light brushed aluminum face, neutral warm silver approximately #D7D7D2, subtle fine horizontal metal brushing, very thin quiet gray border and small softened corner radius. Preserve the dark gray #383C3C medium-weight Korean Myeongjo serif lettering of the master, never extra-bold, never black heavy display calligraphy. Text height should be about 50% of the plaque height, with calm generous top and bottom breathing space. Keep Korean glyph shape and the inscription exact. For a numbered room, include a normal space before the room number. Shorten the physical plaque width to fit this shorter inscription; the plaque itself should be approximately 2.8:1 width-to-height, with balanced side padding, not the original very wide plate. Use the same text height proportion for every room name. No teal, no gold, no brass, no bronze, no wood, no ornament, no gloss flare. Straight-on view, perfectly level horizontal baseline. The only object is the complete plaque. True transparent alpha background, tight frame to the physical edge of the plaque, no blank outside margins, no floating specks, no debris, no external shadow or floor. Exact required text: 공예실
```

### room-F — 배움실

- 보관 원본: `.preview/art-originals/interface-v3/room-F.png`
- 원본 크기: 2098 × 750px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-24d430c2-0dbc-47da-b581-52b433db183c.png`
- crop (inclusive): left=3, top=0, right=2094, bottom=747

```text
Edit the supplied silver Korean room-sign image. It is the approved visual master and the exact material and typographic style to match. Deliver ONE finished front-facing horizontal room plaque with exactly this single-line Korean inscription baked into the bitmap: "배움실". Replace the original text completely. No additional letters, numbers, logos, symbols or icons. Preserve the understated matte light brushed aluminum face, neutral warm silver approximately #D7D7D2, subtle fine horizontal metal brushing, very thin quiet gray border and small softened corner radius. Preserve the dark gray #383C3C medium-weight Korean Myeongjo serif lettering of the master, never extra-bold, never black heavy display calligraphy. Text height should be about 50% of the plaque height, with calm generous top and bottom breathing space. Keep Korean glyph shape and the inscription exact. For a numbered room, include a normal space before the room number. Shorten the physical plaque width to fit this shorter inscription; the plaque itself should be approximately 2.8:1 width-to-height, with balanced side padding, not the original very wide plate. Use the same text height proportion for every room name. No teal, no gold, no brass, no bronze, no wood, no ornament, no gloss flare. Straight-on view, perfectly level horizontal baseline. The only object is the complete plaque. True transparent alpha background, tight frame to the physical edge of the plaque, no blank outside margins, no floating specks, no debris, no external shadow or floor. Exact required text: 배움실
```

---

아래 내용은 사용하지 않는 과거 청록 시안의 기록이다. 표의 public 경로는 이후 은색 파일로 교체되었으므로, 원래 청록 이미지는 별도 보관 PNG를 확인한다.

## 폐기된 청록·금색 시안 — A·C·D·E

## 제작 목적과 기준

건물 위 공간 버튼에 이름까지 들어간 완성 비트맵을 사용한다. 짙은 청록 에나멜, 얇은 샴페인색 금속선, 아이보리색 굵은 명조 글자를 기준 이미지와 맞췄다. HTML로 글자를 중복해서 올리지 않는다. 나무 프레임은 사용하지 않는다.

- 제작 도구: built-in `image_gen__imagegen`, 자산별 독립 편집 호출 1회. CLI/API 대체 도구 사용 없음.
- 모든 편집에 `transparent_background: true`, `referenced_image_paths`로 아래 기준 이미지 1장을 사용했다.
- 기준 이미지(생활체육실): `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-7ad4c32d-a507-41d1-9d63-c940830162eb.png`
- 기준 이미지는 `view_image`로 먼저 확인했다. 생성된 네 문구와 최종 WebP를 각각 육안 확인했다.
- 후처리는 프로젝트 공용 `scripts/prepare-image-button.mjs`의 sharp 처리만 사용했다. 알파 >16인 실제 판의 경계를 잘라내고, 비율을 유지하여 높이 144px, WebP quality94 / alphaQuality100 / effort6으로 저장했다.
- 최종 파일은 상하좌우 모두 알파 >16인 픽셀이 경계에 있어 통째로 빈 외곽 행·열이 없다. 둥근 모서리의 투명 영역은 그대로 유지했다.
- 원본 PNG는 `.preview/art-originals/interface-v3-teal/`에 복사해 보존했고, `.codex/generated_images/`의 도구 원본도 그대로 남겼다.

### 교체 전 WebP 기록 (이전 크기·용량, 현재 파일은 은색으로 대체)

| ID | 이미지 안의 문구 | 배포 파일 | 크기 | 가로:세로 | 용량 |
|---|---|---|---|---|---:|
| room-A | 소강당 1 | `public/center/interface-v3/room-A.webp` | 412 × 144 | 2.861:1 | 15,314 bytes |
| room-C | 대강당 | `public/center/interface-v3/room-C.webp` | 404 × 144 | 2.806:1 | 16,040 bytes |
| room-D | 소강당 2 | `public/center/interface-v3/room-D.webp` | 404 × 144 | 2.806:1 | 19,950 bytes |
| room-E | 공예실 | `public/center/interface-v3/room-E.webp` | 403 × 144 | 2.799:1 | 16,542 bytes |

네 파일 합계: 67,846 bytes. 모든 파일에 알파 채널이 있다. CSS/TS 소스는 이 자산 작업에서 변경하지 않았다.

## 원본과 실제 프롬프트

### room-A — 소강당 1

- 보관 원본: `.preview/art-originals/interface-v3-teal/room-A.png`
- 원본 크기: 2098 × 749px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-90f72eec-d000-4507-ae71-7ddf418846e5.png`
- 알파 경계 crop (inclusive): left=9, top=10, right=2090, bottom=737

실제 전달한 프롬프트:

```text
Edit the provided finished Korean room-sign image. It is the exact visual master for this family of game interface buttons. Produce ONE separate completed sign, front-facing, perfectly horizontal, with the exact single-line Korean inscription "소강당 1" baked into the bitmap. Replace all original letters; no other letters, logos, icons, numbers or words except "소강당 1". Retain precisely the original dark deep teal enamel surface, very thin champagne-bronze metal inlaid border, softly rounded rectangle, delicate painterly material texture, and warm ivory very bold Korean Myeongjo/serif lettering. This is a compact premium physical room plaque, not a wood sign; absolutely NO WOOD. Keep the Korean glyph height the same proportion of the sign's height as in the master (about 62% of plaque height), generous and clearly readable. Because the new inscription is shorter, SHORTEN THE PLAQUE WIDTH to fit it with modest left and right padding; do not leave the original wide empty side areas and do not enlarge the letters. The plaque itself should have an approximately 2.8:1 width-to-height ratio. For 소강당, preserve the normal space before the Arabic room number, and ensure the number is in the same ivory style. Keep the lettering beautifully centered and all glyphs perfectly accurate. Render just the single plaque on real transparent alpha, cropped very tightly so its physical edge reaches the canvas bounds, no exterior blank margins, no background, no detached shadow, no floor. The exact text required is: 소강당 1
```

### room-C — 대강당

- 보관 원본: `.preview/art-originals/interface-v3-teal/room-C.png`
- 원본 크기: 2098 × 749px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-13de1044-d9a3-4fa3-a4f0-893a9c42fd87.png`
- 알파 경계 crop (inclusive): left=0, top=0, right=2097, bottom=747

실제 전달한 프롬프트:

```text
Edit the provided finished Korean room-sign image. It is the exact visual master for this family of game interface buttons. Produce ONE separate completed sign, front-facing, perfectly horizontal, with the exact single-line Korean inscription "대강당" baked into the bitmap. Replace all original letters; no other letters, logos, icons, numbers or words except "대강당". Retain precisely the original dark deep teal enamel surface, very thin champagne-bronze metal inlaid border, softly rounded rectangle, delicate painterly material texture, and warm ivory very bold Korean Myeongjo/serif lettering. This is a compact premium physical room plaque, not a wood sign; absolutely NO WOOD. Keep the Korean glyph height the same proportion of the sign's height as in the master (about 62% of plaque height), generous and clearly readable. Because the new inscription is shorter, SHORTEN THE PLAQUE WIDTH to fit it with modest left and right padding; do not leave the original wide empty side areas and do not enlarge the letters. The plaque itself should have an approximately 2.8:1 width-to-height ratio. For 소강당, preserve the normal space before the Arabic room number, and ensure the number is in the same ivory style. Keep the lettering beautifully centered and all glyphs perfectly accurate. Render just the single plaque on real transparent alpha, cropped very tightly so its physical edge reaches the canvas bounds, no exterior blank margins, no background, no detached shadow, no floor. The exact text required is: 대강당
```

### room-D — 소강당 2

- 보관 원본: `.preview/art-originals/interface-v3-teal/room-D.png`
- 원본 크기: 2098 × 749px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-703e8e6a-9578-4b82-ab39-4981295a5fc8.png`
- 알파 경계 crop (inclusive): left=0, top=0, right=2097, bottom=746

실제 전달한 프롬프트:

```text
Edit the provided finished Korean room-sign image. It is the exact visual master for this family of game interface buttons. Produce ONE separate completed sign, front-facing, perfectly horizontal, with the exact single-line Korean inscription "소강당 2" baked into the bitmap. Replace all original letters; no other letters, logos, icons, numbers or words except "소강당 2". Retain precisely the original dark deep teal enamel surface, very thin champagne-bronze metal inlaid border, softly rounded rectangle, delicate painterly material texture, and warm ivory very bold Korean Myeongjo/serif lettering. This is a compact premium physical room plaque, not a wood sign; absolutely NO WOOD. Keep the Korean glyph height the same proportion of the sign's height as in the master (about 62% of plaque height), generous and clearly readable. Because the new inscription is shorter, SHORTEN THE PLAQUE WIDTH to fit it with modest left and right padding; do not leave the original wide empty side areas and do not enlarge the letters. The plaque itself should have an approximately 2.8:1 width-to-height ratio. For 소강당, preserve the normal space before the Arabic room number, and ensure the number is in the same ivory style. Keep the lettering beautifully centered and all glyphs perfectly accurate. Render just the single plaque on real transparent alpha, cropped very tightly so its physical edge reaches the canvas bounds, no exterior blank margins, no background, no detached shadow, no floor. The exact text required is: 소강당 2
```

### room-E — 공예실

- 보관 원본: `.preview/art-originals/interface-v3-teal/room-E.png`
- 원본 크기: 2098 × 749px
- 도구 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/exec-fe92b4be-ea86-4138-b986-bdd812de677d.png`
- 알파 경계 crop (inclusive): left=0, top=0, right=2097, bottom=748

실제 전달한 프롬프트:

```text
Edit the provided finished Korean room-sign image. It is the exact visual master for this family of game interface buttons. Produce ONE separate completed sign, front-facing, perfectly horizontal, with the exact single-line Korean inscription "공예실" baked into the bitmap. Replace all original letters; no other letters, logos, icons, numbers or words except "공예실". Retain precisely the original dark deep teal enamel surface, very thin champagne-bronze metal inlaid border, softly rounded rectangle, delicate painterly material texture, and warm ivory very bold Korean Myeongjo/serif lettering. This is a compact premium physical room plaque, not a wood sign; absolutely NO WOOD. Keep the Korean glyph height the same proportion of the sign's height as in the master (about 62% of plaque height), generous and clearly readable. Because the new inscription is shorter, SHORTEN THE PLAQUE WIDTH to fit it with modest left and right padding; do not leave the original wide empty side areas and do not enlarge the letters. The plaque itself should have an approximately 2.8:1 width-to-height ratio. For 소강당, preserve the normal space before the Arabic room number, and ensure the number is in the same ivory style. Keep the lettering beautifully centered and all glyphs perfectly accurate. Render just the single plaque on real transparent alpha, cropped very tightly so its physical edge reaches the canvas bounds, no exterior blank margins, no background, no detached shadow, no floor. The exact text required is: 공예실
```
