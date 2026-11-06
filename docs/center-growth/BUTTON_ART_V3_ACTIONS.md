# 거절된 청록 버튼 v3 — 제작 이력

이 문서의 청록·금색 시안은 사용자가 거절하여 현재 은색 버튼으로 교체했다. 아래 public 경로의 파일은 이제 은색이며, 당시 원본은 .preview/art-originals/interface-v3-teal/에서 확인한다. 아래 크기·프롬프트는 과거 청록 시안의 기록이다. 현재 은색 공간 버튼은 BUTTON_ART_V3_ROOMS.md를 따른다.

2026-11-06. 기본 내장 `image_gen` 도구를 사용했습니다. HTML 글자나 코드로 그린 대체물을 쓰지 않았으며, 텍스트까지 이미지에 포함되어 있습니다. 담당 범위에서는 코드·CSS를 수정하지 않았습니다.

## 스타일 기준과 검증

기준 이미지: `C:/Users/admin/.codex/generated_images/01a1a51c-5d95-7181-a9da-bb27514b5ec1/exec-7ad4c32d-a507-41d1-9d63-c940830162eb.png`

짙은 청록색 판, 얇은 샴페인 금속선, 아이보리 굵은 한국어 명조를 유지했습니다. 긴 문구는 판을 넓힌 재생성본을 채택했습니다. 제작 후 네 PNG와 최종 WebP에서 한글을 육안 확인했습니다. `scripts/prepare-image-button.mjs`로 alpha > 16 경계 상자를 자르고 비율을 유지해 높이 144px, WebP 품질 94, alpha 품질 100으로 변환했습니다. 사방의 가장자리 각각에 alpha > 16인 픽셀이 있어 완전히 투명한 외부 행·열 여백이 없음을 검사했습니다. 둥근 모서리의 진짜 alpha는 유지됩니다.

## 최종 파일

| ID | 이미지 문구 | 원본 PNG | WebP | WebP 용량 |
|---|---|---|---|---:|
| room-F | 배움실 | 1983×793 | 360×144 | 15,332 bytes |
| room-G | 프리미엄회의실 | 2172×724 | 899×144 | 27,024 bytes |
| campus | 센터 환경 개선 | 2172×724 | 843×144 | 24,546 bytes |
| return | 센터 외관 | 2172×724 | 434×144 | 16,900 bytes |

최종 배포 경로는 `public/center/interface-v3/{ID}.webp`, 보존 원본은 `.preview/art-originals/interface-v3-teal/{ID}.png`입니다. 네 WebP의 총용량은 83,802 bytes입니다. 생성 디렉터리 원본도 삭제하지 않았습니다.

## room-F — 배움실

- 생성 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-1b4f72fc-f4ab-4ccc-8588-a1a5cdbccb85.png`
- 보존 원본: `.preview/art-originals/interface-v3-teal/room-F.png` (2,242,580 bytes)
- 배포 파일: `public/center/interface-v3/room-F.webp`
- 원본 SHA-256: `172f0ccb4a87c5410e80fd158a3e78f1b9d6539574243668e7857dcae05a2a39`
- 배경: 실제 alpha 투명. 글자 검증: “배움실” 정확.

### 실제 최초 프롬프트

```text
Use case: text-localization. Asset type: one finished Korean game UI button image with its text baked in. The supplied image is the exact style reference: dark deep teal subtly textured plate, thin champagne-gold metallic inset border, large warm-ivory bold Korean Myeongjo lettering. Create a matching single button whose only text is exactly "배움실". This exact phrase must be fully legible and correctly spelled, centered on one line. Keep the reference material, precise border style, small rounded corners, warm ivory ink, and confident thick Korean serif letterforms. Same apparent character height relative to plate height as the reference, about 64% of plate height. Do not shrink the type to fit: adjust plate width instead. Target visible plate width-to-height ratio 2.5:1. Tight balanced internal spacing, no wasted room. Straight-on flat view, no perspective. The asset is only the button itself on a genuinely transparent alpha background. Absolutely no extra surrounding transparent margin: visible button edges should reach image bounds at left/right/top/bottom. No exterior shadow, glow, frame beyond the thin gold inset border, room illustration, wood, icon, decorative flourish, extra words, English, logo, or watermark. Preserve the reference's recognizable typography and elegant deep-teal public-center game tone. Exact Korean text, no substitutions: "배움실".
```

## room-G — 프리미엄회의실

- 생성 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-7af936fd-46d3-44c6-b999-5ad089c7eb5d.png`
- 보존 원본: `.preview/art-originals/interface-v3-teal/room-G.png` (1,101,127 bytes)
- 배포 파일: `public/center/interface-v3/room-G.webp`
- 원본 SHA-256: `07ff09f543fdd2c42696b0d923ee33443d375486bfa7bb943a60efa1a04814a6`
- 배경: 실제 alpha 투명. 글자 검증: “프리미엄회의실” 정확.

### 실제 최초 프롬프트

```text
Use case: text-localization. Asset type: one finished Korean game UI button image with its text baked in. The supplied image is the exact style reference: dark deep teal subtly textured plate, thin champagne-gold metallic inset border, large warm-ivory bold Korean Myeongjo lettering. Create a matching single button whose only text is exactly "프리미엄회의실". This exact phrase must be fully legible and correctly spelled, centered on one line. Keep the reference material, precise border style, small rounded corners, warm ivory ink, and confident thick Korean serif letterforms. Same apparent character height relative to plate height as the reference, about 64% of plate height. Do not shrink the type to fit: adjust plate width instead. Target visible plate width-to-height ratio 5:1. Tight balanced internal spacing, no wasted room. Straight-on flat view, no perspective. The asset is only the button itself on a genuinely transparent alpha background. Absolutely no extra surrounding transparent margin: visible button edges should reach image bounds at left/right/top/bottom. No exterior shadow, glow, frame beyond the thin gold inset border, room illustration, wood, icon, decorative flourish, extra words, English, logo, or watermark. Preserve the reference's recognizable typography and elegant deep-teal public-center game tone. Exact Korean text, no substitutions: "프리미엄회의실".
```

### 채택한 재생성 프롬프트

입력 1은 첫 생성 이미지 `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-fb3672c1-8d5f-4310-b0d7-d84165b9ed6f.png`, 입력 2는 공통 스타일 기준 이미지입니다.

```text
Use case: text-localization. Image 1 is the edit target, a Korean button. Image 2 is the original visual style standard. Make one corrected matching button with only the exact text "프리미엄회의실". The ONLY correction is the shape and typesetting proportions: make the VISIBLE TEAL PLATE much wider and shallower, exactly 5.1:1 width to height. Example visible geometry: width 2040 pixels and height 400 pixels. Keep Korean letters large, naturally proportioned, broad, thick, warm ivory Myeongjo serif like Image 2, never horizontally compressed. Letters should be about 62 percent of plate height. Text must read "프리미엄회의실" exactly, centered on one line, no extra content. Retain deep teal subtly textured fill, a single fine champagne-gold inset border, small softly rounded corners. Flat front view. IMPORTANT: if the output canvas cannot be this wide, put the wide thin plate across the middle and leave entirely transparent bands above and below; the final file will be trimmed to alpha bounds, so preserve the 5.1:1 visible plate shape instead of making a taller plaque. The background must be real alpha transparency. No drop shadow, no decorative icons, no wood, no illustration, no watermark. All nontransparent pixels must belong only to the button. Do not crop any glyph or border.
```

## campus — 센터 환경 개선

- 생성 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-4b039dd5-506b-4e62-9511-f5512b054e05.png`
- 보존 원본: `.preview/art-originals/interface-v3-teal/campus.png` (1,119,747 bytes)
- 배포 파일: `public/center/interface-v3/campus.webp`
- 원본 SHA-256: `024f55280a84f64fed9aa2f5bdb0257541f950d380247c132c2072e3ad02f30e`
- 배경: 실제 alpha 투명. 글자 검증: “센터 환경 개선” 정확.

### 실제 최초 프롬프트

```text
Use case: text-localization. Asset type: one finished Korean game UI button image with its text baked in. The supplied image is the exact style reference: dark deep teal subtly textured plate, thin champagne-gold metallic inset border, large warm-ivory bold Korean Myeongjo lettering. Create a matching single button whose only text is exactly "센터 환경 개선". This exact phrase must be fully legible and correctly spelled, centered on one line. Keep the reference material, precise border style, small rounded corners, warm ivory ink, and confident thick Korean serif letterforms. Same apparent character height relative to plate height as the reference, about 64% of plate height. Do not shrink the type to fit: adjust plate width instead. Target visible plate width-to-height ratio 4.8:1. Tight balanced internal spacing, no wasted room. Straight-on flat view, no perspective. The asset is only the button itself on a genuinely transparent alpha background. Absolutely no extra surrounding transparent margin: visible button edges should reach image bounds at left/right/top/bottom. No exterior shadow, glow, frame beyond the thin gold inset border, room illustration, wood, icon, decorative flourish, extra words, English, logo, or watermark. Preserve the reference's recognizable typography and elegant deep-teal public-center game tone. Exact Korean text, no substitutions: "센터 환경 개선".
```

### 채택한 재생성 프롬프트

입력 1은 첫 생성 이미지 `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-ed919d61-909b-43ae-a610-1b1ccb064cc9.png`, 입력 2는 공통 스타일 기준 이미지입니다.

```text
Use case: text-localization. Image 1 is the edit target, a Korean button. Image 2 is the original visual style standard. Make one corrected matching button with only the exact text "센터 환경 개선". The ONLY correction is the shape and typesetting proportions: make the VISIBLE TEAL PLATE much wider and shallower, exactly 4.8:1 width to height. Example visible geometry: width 2040 pixels and height 425 pixels. Keep Korean letters large, naturally proportioned, broad, thick, warm ivory Myeongjo serif like Image 2, never horizontally compressed. Letters should be about 62 percent of plate height. Text must read "센터 환경 개선" exactly, centered on one line, no extra content. Retain deep teal subtly textured fill, a single fine champagne-gold inset border, small softly rounded corners. Flat front view. IMPORTANT: if the output canvas cannot be this wide, put the wide thin plate across the middle and leave entirely transparent bands above and below; the final file will be trimmed to alpha bounds, so preserve the 4.8:1 visible plate shape instead of making a taller plaque. The background must be real alpha transparency. No drop shadow, no decorative icons, no wood, no illustration, no watermark. All nontransparent pixels must belong only to the button. Do not crop any glyph or border.
```

## return — 센터 외관

- 생성 원본: `C:/Users/admin/.codex/generated_images/01a1ae4c-5074-7502-9429-9f1be74f8ced/exec-234e1e50-2104-4e76-8c7c-7aad699ce09f.png`
- 보존 원본: `.preview/art-originals/interface-v3-teal/return.png` (2,173,796 bytes)
- 배포 파일: `public/center/interface-v3/return.webp`
- 원본 SHA-256: `c191148cec23b19d39d8c6dc5a68a9b21a38d947710ef6cd33938f4bdfa7072f`
- 배경: 실제 alpha 투명. 글자 검증: “센터 외관” 정확.

### 실제 최초 프롬프트

```text
Use case: text-localization. Asset type: one finished Korean game UI button image with its text baked in. The supplied image is the exact style reference: dark deep teal subtly textured plate, thin champagne-gold metallic inset border, large warm-ivory bold Korean Myeongjo lettering. Create a matching single button whose only text is exactly "센터 외관". This exact phrase must be fully legible and correctly spelled, centered on one line. Keep the reference material, precise border style, small rounded corners, warm ivory ink, and confident thick Korean serif letterforms. Same apparent character height relative to plate height as the reference, about 64% of plate height. Do not shrink the type to fit: adjust plate width instead. Target visible plate width-to-height ratio 3.2:1. Tight balanced internal spacing, no wasted room. Straight-on flat view, no perspective. The asset is only the button itself on a genuinely transparent alpha background. Absolutely no extra surrounding transparent margin: visible button edges should reach image bounds at left/right/top/bottom. No exterior shadow, glow, frame beyond the thin gold inset border, room illustration, wood, icon, decorative flourish, extra words, English, logo, or watermark. Preserve the reference's recognizable typography and elegant deep-teal public-center game tone. Exact Korean text, no substitutions: "센터 외관".
```
