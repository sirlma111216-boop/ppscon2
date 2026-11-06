# 센터 건축 아트 v2

제작일: 2026-11-06. 제작 방식: 내장 `image_gen`으로 자산별 개별 생성. 외부 API/CLI는 사용하지 않았다.

## 의도와 검수

실제 동네 문화체육센터 규모의 2층 건물을 기본으로 삼았다. 벽돌 대강당, 중앙 체육실, 오른쪽 교실동이 한 건물로 연결된다. 따뜻한 수채·과슈 안료와 섬세한 건축선을 사용하며, 궁전·대형 복합단지·아이소메트릭 도면처럼 보이지 않도록 했다.

모든 최종 그림을 직접 시각 검수했다. 인물, 얼굴, 사람 실루엣, 글자, 로고, UI는 없다. 내부 그림은 고정 마감과 기본 가구만 표현한다. 매트·음향·이동무대·스크린·컴퓨터·공예도구처럼 조달에서 구입할 기능 장비는 포함하지 않는다. 보유 장비와 운영/잠금 상태는 게임 UI에서 표시한다. 공간 면적과 수용 인원은 게임 데이터가 기준이며 그림은 건축 도면이 아니다.

기본 외관은 창 너머 완성된 활동실 분위기를 암시하는 장식적 그림이다. 창 안의 작은 사물은 실제 장비 보유 상태를 나타내지 않는다. 내부 화면이 장비 미구매 상태의 기준 이미지다.

## 실제 건축·공공시설 참고

- [I'M Architecten — Dorpshuis de Terp](https://www.im-architecten.nl/project/dorpshuis-de-terp): 체육관과 작은 극장·도서관·공용 기능을 연결하는 지역 복합시설의 구성과 열린 진입부를 참고했다.
- [Snug Architects — Kings Barton Community Center](https://www.snugarchitects.co.uk/our-work/community-and-education): 생활권 규모, 벽돌과 유리, 캐노피, 커뮤니티 정원 등 공공건축의 절제된 재료·구성을 참고했다.
- [Sport England — Community Leisure Hub](https://production.sportengland.org/guidance-and-support/facilities-and-planning/design-and-cost-guidance/community-leisure-hub): 접근성 있는 진입 동선과 여러 활동실이 연결되는 시설 구성의 참고 자료다.
- [공주시 행복누림 — 시설 대관 안내](https://www.gongju.go.kr/nurim/prog/rsvt/main/sub08_04/fcltSearch.do): 공식 강당·다목적실·교육실 안내와 시설 사진의 용도·규모 설명을 참고했다.

위 외부 자료는 건물 기능·비례를 정하는 텍스트/이미지 검색 참고 자료다. 해당 사진을 다운로드하여 게임 자산으로 배포하거나 생성기의 입력 이미지로 사용하지 않았다. 외관은 새로 생성한 독자적 가상 시설이며, 내부와 성장 단계는 그 생성 외관만을 스타일/건물 참조 입력으로 사용했다.

## 최종 파일

웹 경로 접두어는 `/center/building-v2/`, 실제 배포 경로는 `public/center/building-v2/`다. 아래 PNG 이름과 같은 stem의 **WebP**를 배포한다. 예: `/center/building-v2/exterior.webp`, `/center/building-v2/room-A.webp`.

PNG 10장은 프로젝트의 `.preview/art-originals/building-v2/`로 이동 보존했고, 이동 전후 SHA-256이 동일함을 확인했다. 원본 생성 파일도 `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/`에 그대로 보존했다. 모두 불투명 배경이다.

배포 최적화는 요청에 따라 `sharp`로 수행했다. 외관 3장 폭 1600px, 내부 7장 폭 1280px, WebP quality 86, 비율 유지. 파일 크기는 총 30,745,119 bytes에서 2,749,340 bytes로 **91.06% 감소**했다. 외관 기본/정비는 1600×900, 조경은 원본 비율 차이로 1600×901, 내부는 모두 1280×720이다. 아래 표의 크기는 보관 PNG 원본 기준이다.

| 파일 | 내용 | 픽셀 크기 |
| --- | --- | --- |
| exterior.png | 기본 외관 | 1672 × 941 |
| exterior-garden.png | 화단·벤치·쉼터·포장 개선 | 1671 × 941 |
| exterior-renovated.png | 같은 건물의 마감·캐노피·창호·조명·조경 정비 | 1672 × 941 |
| room-A.png | 소강당 1, 80㎡, 기본 접이식 가구 | 1672 × 941 |
| room-B.png | 생활체육실, 120㎡, 빈 마루와 벽거울 | 1672 × 941 |
| room-C.png | 대강당, 300㎡, 높은 천장과 흡음 마감 | 1672 × 941 |
| room-D.png | 소강당 2, 90㎡, 정교한 목재·흡음 마감 | 1672 × 941 |
| room-E.png | 공예실, 45㎡, 빈 작업대와 싱크·수납 | 1672 × 941 |
| room-F.png | 배움실, 50㎡, 전자장비 없는 기본 책상 | 1672 × 941 |
| room-G.png | 프리미엄회의실, 40㎡, 기본 회의 가구 | 1672 × 941 |

외관 세 버전은 동일한 구도와 창 위치를 유지한다. 생성 도구의 garden 원본에만 가로 1px 차이가 있어 배포본 높이가 1px 다르다. 동일한 16:9 UI 컨테이너와 정규화 좌표를 사용한다. 이미지에 직접 글자를 그리지 않는다. 아래 프롬프트의 `exterior.png` 편집/참조 대상은 이제 `.preview/art-originals/building-v2/exterior.png`에 보관되어 있다.

권장 방 선택 좌표(왼쪽·위 기준 백분율): C(17,53), B(45,39), E(65,41), F(77,41), G(89,41), A(77,64), D(90,64). 중앙 1층(43,65)은 현관이다. 실제 UI 라벨 크기에 따라 조정한다.

## 공통 스타일 지시

```text
Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
```

## 외관 최종 생성 프롬프트

참조 입력 없음. 신규 생성.

```text
Use case: stylized-concept.
Asset type: final 16:9 landscape background for a Korean culture-and-sports center management game; high-resolution architectural illustration.
Primary request: An original, realistically buildable, welcoming neighborhood culture-and-sports center, compact and dignified, exactly two main storeys, roughly 850 to 1100 square metres total, with seven activity spaces. It must feel like a well-built public community center, NOT a palace, luxury resort, monumental museum, school campus or huge civic complex.
Architecture: one connected asymmetric building. On the LEFT a taller but modest brick auditorium wing, about 300sqm, with a simple sloped roof and narrow acoustic clerestory glazing. In the MIDDLE a two-storey high window bay over a sheltered accessible entrance, showing the light wood floor of a community exercise studio. On the RIGHT a clean two-storey classroom wing with individual window bays: several smaller craft, learning, meeting and multipurpose rooms. A small sheltered terrace connects the wings. Realistic stairs and a gentle entrance ramp, restrained accessible landscaping, two small benches, native grasses and a few trees only near the image edges. Quiet neighborhood greenery in the far distance. No giant plaza, no fountains, no statues, no domes.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: whole building fully visible with comfortable margin, shallow elevated front three-quarter view, nearly frontal enough to distinguish room window bays. Building fills about 78% of image width and the middle 65% of height. Pale sky above and quiet paving in foreground leave breathing space for the game's separate HTML room labels. No labels drawn in the picture. Keep all windows and entrances unobstructed. Full environment to image edges, no white cutout border.
Lighting: gentle early-autumn afternoon, warm but natural, subtle cool shadows, calm inviting lived-in architecture with NO occupants.
Reference principles: practical adaptable public rooms and welcoming brick/glass entrances, inspired by real community centers such as I'M Architecten's Dorpshuis de Terp and Snug Architects' Kings Barton community center, without copying their design.
```

## A · 소강당 1 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room A 소강당 1. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: An 80 square metre, 8 by 10 metre everyday small multipurpose hall in this same Korean neighborhood culture and sports center. Modest 3.2m ceiling. Ash wood floor, ivory acoustic ceiling, muted celadon lower wall panels, wide windows on the right admitting soft daylight. A handful of simple oak stackable chairs and folded plain tables neatly stored at the rear edge, leaving the central wood floor clear for flexible use. A plain built-in storage wall on the left. A practical room comfortably accommodating 32 people, clearly larger than a classroom and much smaller than the main auditorium. No stage, projection screen, audio, craft tools or exercise equipment.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## B · 생활체육실 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room B 생활체육실. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: A 120 square metre, roughly 10 by 12 metre neighborhood exercise studio in the same center, realistically spacious but NOT a basketball arena or huge gym. 3.6m high ceiling, a wide empty sprung ash wood floor with beautiful subtle grain, daylight from generous mullioned windows on the left, a long wall mirror on the far right reflecting only the empty architecture and windows, muted warm gray and sage walls, discreet ceiling ventilation and simple long overhead lights. One very small built-in storage cabinet, no sports markings on floor. The clear uninterrupted floor is the main feature. NO yoga mats, balls, sound equipment, portable apparatus or people. Mirror contains NO human silhouettes.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## C · 대강당 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room C 대강당. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: The 300 square metre neighborhood main hall inside the LEFT brick wing of the same center. Roughly 15 by 20 metres with a realistic 5.2m high ceiling, capacity for 120 people but not a concert palace. View from a rear corner toward the plain front wall; wood acoustic battens, deep warm terracotta acoustic fabric panels, narrow high clerestory windows, restrained fixed ceiling lights. The generous flat oak floor is mostly open, some ordinary stackable basic chairs stored along the side wall. A shallow architectural niche at the front is empty, with no raised stage and no stage equipment. The tall room and acoustic treatment distinguish it from small halls. NO mobile stage, performance seats, speakers, spotlights, musical instruments, screen, projector, text or occupants.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## D · 소강당 2 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room D 소강당 2. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: A refined 90 square metre small hall inside the same center, around 9 by 10 metres, 3.4m ceiling, designed for up to 40 people. High-quality natural oak wall slats mixed with pale cream acoustic plaster, simple bronze-toned door fittings, tall windows and restrained indirect cove lighting. A subtle warm-gray curtain can be drawn across one window. Flexible open center floor with several plain upholstered stacking chairs and a slim built-in cabinet along the side. More polished finishing than room A, yet still a prudent Korean public facility, not a luxury hotel or corporate ballroom. NO stage, projector, screen, speakers, training gear, people or text.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## E · 공예실 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room E 공예실. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: A compact 45 square metre community craft classroom inside the same center, approximately 5 by 9 metres, low 2.9m ceiling and intimate scale. Four plain sturdy rectangular pale ash worktables, sixteen simple wooden stools, some partly outside the camera frame. Closed storage cabinets along one wall, a built-in utility sink and durable light stone countertop. Empty shelves and entirely clear tabletop surfaces awaiting future procurement of craft sets. Soft warm clay-colored linoleum floor, cream walls and bright side windows looking onto autumn foliage. It should unmistakably feel like a smaller practical maker classroom, NOT a giant workshop or art boutique. NO craft tools, art materials, paint, easels, ceramics, screens, computers or people.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## F · 배움실 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room F 배움실. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: A modest 50 square metre community learning classroom inside the same center, about 5 by 10 metres, ceiling 3m. Nine compact light wood training tables seating up to eighteen simple sage-green chairs, arranged in three short rows with a broad accessible side aisle. All desks completely empty. At the front only an unadorned cream plaster wall and a small built-in storage cupboard. Large windows cast soft daylight across a quiet cork-colored floor. Neat cable-ready floor covers are visible but no installed electronics. A calm general education room awaiting digital procurement, NOT a university lecture theatre. NO computers, keyboards, monitors, projector, screen, whiteboard, writing, people or decorative clutter.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## G · 프리미엄회의실 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 외관을 그대로 편집하는 것이 아니라 같은 건물의 새 내부 그림을 생성한다.

```text
Use case: stylized-concept.
Asset type: final high-resolution 16:9 landscape room background for a management game, room G 프리미엄회의실. Generate ONE new interior illustration.
Input image: the exterior image is a STYLE AND ARCHITECTURE REFERENCE ONLY; do not redraw the exterior. Show the INTERIOR of one room in that same building.
Subject: A compact premium meeting room of only 40 square metres inside the same public center, about 5 by 8 metres, 2.9m ceiling. One beautifully crafted oval ash-wood conference table with twelve modestly upholstered charcoal and muted teal chairs, clear tabletop, a simple understated linear pendant, acoustic felt wall sections and fine walnut trim. A wide window looks onto nearby small autumn trees. A closed sideboard built into one wall. Good public architecture with calm dignified material quality, NOT an executive penthouse, luxury boardroom, hotel lounge or palace. Small convincing room scale and restrained furnishings. NO displays, screen, projector, microphones, computers, writing, logos, people or reflections of people.
Style/medium: Original watercolor and opaque gouache architectural game background on subtly textured warm paper, precise fine graphite and sepia construction lines, believable contemporary Korean municipal architecture, restrained burnt-clay brick, pale limestone, natural ash wood and muted celadon accents, hand-painted foliage and soft afternoon light. Distinctive observational architectural illustration, not glossy 3D, not vector art, not generic pastel mobile-game isometric graphics. Correct perspective, practical human-scale proportions. Absolutely no people, faces, mannequins, human silhouettes, text, lettering, logos, signage, labels, UI, markers, arrows, numbers or watermark.
Composition: immersive interior architectural view from one rear corner at approximately 1.6m eye height, natural wide lens with straight verticals, two or three room walls visible and a substantial clear foreground floor. Furniture and ceiling must have believable scale and accurate perspective. Fill the full rectangular canvas; no frames, no vignette, no cutaway, no dollhouse, no isometric view, no split panels. Keep subtle enough for separately overlaid game labels.
Lighting/mood: gentle afternoon natural light with cool soft shadows, warm observational gouache rendering. Match the reference's confident detailed architectural drawing, delicate pigment texture, and ash wood/ivory/earthy palette.
Critical invariants: the room contains ONLY baseline fixed building finishes and basic furniture. No purchasable functional equipment. Absolutely no humans, body parts, silhouettes, mannequins, faces, text, numbers, symbols, logos, labels, UI or watermark.
```

## 조경 성장 단계 편집 프롬프트

참조/편집 대상: `exterior.png`.

```text
Use case: precise-object-edit.
Asset type: 16:9 game building progression background, upgrade stage 1.
Edit target: the supplied image is the exact original exterior of our community culture and sports center.
Change ONLY the OUTDOOR LANDSCAPING and outdoor seating to show a thoughtful, clearly visible public landscape investment. Add richer layered native flower beds in the low foreground edges, subtle brick-and-stone planter borders, one elegant low timber pergola over a small seating nook at the far lower-right edge, improved accessible paving patterns and two handsome timber benches. Keep a generous clear arrival path and the entrance ramp. The upgrade should be obvious and delightful but modest, plausible for a neighborhood public facility.
ABSOLUTE INVARIANTS: preserve the SAME building, SAME two-storey massing, SAME roof silhouettes, SAME brick left auditorium, SAME central glass exercise bay, SAME right-side classroom windows, SAME entrance location, SAME perspective/camera/crop/aspect ratio, SAME scale and all existing room-window positions. In particular the left auditorium, central upper studio, three right upper windows and two right lower windows must stay at precisely their original screen coordinates for UI hotspots. Do not move, crop, enlarge or reshape the building. Do not alter architecture or interior furnishings. Do not let the pergola, vegetation or new furniture obscure any room window or entrance. Keep the original afternoon light and autumn palette.
Match every original watercolor/gouache texture and fine architectural line. Entirely empty of people, faces or silhouettes, no text, signage, logos, icons, labels, diagrams or watermark. No fountain, statue, ornate garden or palace.
```

첫 조경 초안의 우측 쉼터가 방 창을 가려, 해당 생성 초안을 대상으로 아래 수정 지시를 한 차례 적용했다. 최종 `exterior-garden.png`는 이 수정 결과다.

```text
Edit only the small timber pergola at the right edge of this exact image. It currently blocks the ground-floor far-right classroom window. REMOVE that pergola entirely from beside the building and replace it with a much smaller low timber shade-and-bench nook in the extreme BOTTOM-RIGHT FOREGROUND, with its roof below the bottom edge of ALL building windows. Its highest pixel must be below 80% of the image height, and its right side can be cropped at the frame edge. Restore the entire far-right ground-floor window exactly as in the adjacent facade, unobstructed and fully readable. Keep every other pixel/feature as close as possible: same architecture, same camera, same roofline, same seven room windows, same landscaping flowerbeds, curved paving pattern, benches, light, palette and watercolor/architectural-line style. This is only a relocation and reduction of the shade nook, no other redesign. No people, text, signs or UI.
```

## 외관 정비 성장 단계 편집 프롬프트

참조/편집 대상: `exterior.png`.

```text
Use case: precise-object-edit.
Asset type: 16:9 game building progression background, upgrade stage 2 (final tasteful public-facility renovation).
Edit target: the supplied image is the exact original exterior of our neighborhood culture and sports center.
Change ONLY the QUALITY OF SURFACE FINISHES, entrance canopy detailing, landscaping and restrained exterior lights to depict a substantial but realistic refurbishment. Retain the red brick auditorium and cream stone identity, carefully restore the masonry, add slim fine ash-wood facade accents between existing window bays, refine window-frame finish to muted bronze/charcoal, upgrade the EXISTING entrance canopy with thin elegant timber soffits and integrated warm lights without moving its outline significantly, improve the low stone entrance paving and matching ramp rail finish. Include a richer planted forecourt and a small low timber-shaded seating nook at far lower right, handsome benches and discreet warm architectural sconces. This is the SAME building with better craftsmanship and a more cared-for public garden, not a new building.
ABSOLUTE INVARIANTS: SAME building outline, SAME two storeys, SAME roofs and roof heights, SAME footprint, SAME geometry, SAME exact camera/crop/perspective and canvas aspect. Do not widen or enlarge the building. Keep all room openings and window bays at precisely the original positions: left brick auditorium, central upper glass exercise studio, three upper classroom bays at right, and two lower classroom bays at right. Keep entrance door, stair and ramp locations unchanged. No garden feature may conceal room hotspot windows. Do not add a floor, roof tower, dome, monument, fountain, portico, grand staircase or extension. The setting remains an approachable local Korean public center. Keep the original soft autumn AFTERNOON lighting; upgraded warm lamps are subtle, not a night scene.
Preserve the supplied image's distinctive watercolor and opaque gouache pigments, fine graphite architectural lines and hand-painted foliage. NO people anywhere, NO faces or silhouettes even in windows, NO text, signage, labels, logos, UI, arrows, icons or watermark.
```



## 방 이름·센터 환경 개선 안내판 스킨

2026-11-06 추가. 내장 `image_gen` 신규 생성 후 원본을 직접 확인하고 동일 형상을 편집해 선택 상태를 만들었다. 라벨은 HTML로 얹으며 이미지 자체에는 글자·아이콘·로고가 없다.

- `.preview/art-originals/interface-v2/room-plaque.png`: 2172×724, 기본 아이보리 도자기 인셋·웜 오크·매트 브론즈.
- `.preview/art-originals/interface-v2/room-plaque-active.png`: 2172×724, 같은 형상에 은은한 꿀빛 강조.
- 두 파일 모두 PNG 알파 채널이 있음을 확인했다. 3:1 비율, 약 150×50 CSS px로 사용할 수 있다. 사진의 안내판 안쪽에 텍스트를 배치하고 기존 클릭/키보드 동작을 유지한다.
- 생성 원본을 손대지 않고 복사했다. 자동 생성 도구 미리보기에서 보인 밝은 가장자리 점들은 픽셀 검사상 alpha 1~2/255 수준이다. 투명도는 보존했다.

기본 최종 프롬프트:

```text
Use case: product-mockup.
Asset type: production transparent-background button skin for a watercolor architectural management game. ONE blank room-name plaque, no text, designed to display at about 150 by 50 CSS pixels.
Primary request: a beautifully crafted contemporary public-building room sign, seen EXACTLY straight-on from the front. Wide horizontal rectangle, approximately 3.5 times as wide as tall, subtly softened square corners, a flat inset warm-ivory matte porcelain center, a very THIN natural warm-oak outer frame with believable delicate grain and fine restrained brushed-bronze corner joints. Modest public-building craftsmanship, not luxury jewelry or a fantasy object. Subtle hand-painted gouache pigment texture and delicate architectural-pencil edge lines, visually consistent with warm realistic watercolor illustrations of a Korean culture and sports center.
Composition: tightly frame the single isolated horizontal plaque. The canvas itself should be a wide 3.5:1 horizontal aspect ratio (for example 1400 by 400), NOT a square with large empty margins. The plaque takes about 94% of width and 88% of height, with just enough transparent margin for a gentle short physical drop shadow. It has no wall behind it, no desk, stand, handle, chains or surrounding objects. Perfectly level and symmetric with accurate flat frontal geometry, no perspective tilt or isometric view.
Material: calm eggshell ceramic center covering at least 84% of width, comfortably clear for separate HTML lettering. Thin oak border and understated dull bronze details. Fine physical bevel, softly rounded inner corners, graceful tactile finish; low contrast texture that will not compete with dark readable labels.
Lighting: subtle diffuse daylight from upper-left, natural soft contact shadow only. Warm but not yellow/orange-heavy.
Background: genuinely TRANSPARENT, preserve alpha around object and shadow; no checkerboard graphic, no white rectangle background.
ABSOLUTELY NO text, numbers, letters, glyphs, symbols, icons, logo, emblem, screw heads arranged as symbols, watermark, stars, glints, gold ornament, gemstones, neon, glow, overly thick frame or glossy plastic.
```

선택 상태 최종 편집 프롬프트(참조 대상: 기본 안내판):

```text
Use case: precise-object-edit. Edit this exact blank room-name plaque to make its SELECTED/ACTIVE state for the same watercolor architectural game. Preserve the identical canvas size, object outline, straight-on camera, border thickness, corner shape, center area, proportions, position and transparent outer margin so switching states causes no layout jump. Change only the warm ivory ceramic inset to a slightly warmer pale honey-cream tone, add a subtle thin warm amber inset edge emphasis, and make the existing brushed bronze corner joints softly warmer. The center must remain pale and completely blank for dark HTML text. This is a restrained tactile selection state, not a glowing neon effect, not glittering gold. Preserve the delicate matte oak grain, hand-painted watercolor/gouache pigment and natural short soft physical shadow. Keep truly transparent background and clean neutral-colored antialiased outer edges without stray yellow/red/magenta pixels or paint splatter. Absolutely no text, letters, numbers, symbols, icons, logos, stars, sparkles, arrows or watermark. Do not change the plaque geometry or add any other object.
```


안내판 배포 최적화 추가: `room-plaque.webp`와 `room-plaque-active.webp`는 sharp로 폭600px·비율유지·quality86·alphaQuality100으로 생성한 600×200 알파 WebP이다. 실제 UI는 이 WebP 경로를 사용한다. 합계36,856 bytes이며 원본 PNG 4,225,016 bytes보다99.13% 작다. PNG 원본은 소비처가 없음을 확인한 뒤 .preview/art-originals/interface-v2/로 이동하고 SHA-256 일치를 확인했다. 배포 폴더에는 WebP만 남긴다.
