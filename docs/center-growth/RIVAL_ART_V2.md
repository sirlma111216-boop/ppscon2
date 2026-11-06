# 경쟁 센터 외관 아트 v2

제작일: 2026-11-06. 최종 구성은 **우리 센터 1곳 + 경쟁 센터 9곳 = 총 10곳**이다. 최신 요청에 따라 온누리(`onnuri`)는 생성 전에 제외했으며 배포 자산도 없다.

## 제작·검수 기준

내장 `image_gen`으로 각 센터별 독립 호출 1회씩, 총 9장 생성했다. 이전 플레이어 외관 생성본을 공통 그림체 참조로 입력하되 동일 건물의 색상 변경이 아니라 개별 건물 매스·지붕·진입부·마당 구성을 다르게 설계했다. 실제 생활권 공공센터 규모의 2~3층, 선명한 벽돌·짙은 목재·잎녹색·푸른 하늘과 읽기 쉬운 중간톤 명암을 사용했다. 모든 생성 결과를 직접 보고 사람·얼굴·실루엣·글자·로고·UI가 없음을 확인했다.

생성은 내장 도구만 사용했다. 요청받은 배포 최적화만 `sharp`를 사용하여 **800px 폭, 비율 유지, WebP quality 85**로 처리했다. 모두 최종 크기 800×533이다. PNG 원본 총 30,891,252 bytes → 배포본 총 1,422,910 bytes, **95.39% 감소**. WebP 9개가 서로 다른 SHA-256을 갖고 형식/폭/파일 존재를 확인했다.

## 파일과 기관 성격

배포 경로: `public/center/rivals-v2/{id}.webp` / 웹 경로: `/center/rivals-v2/{id}.webp`.

원본 보관: `.preview/art-originals/rivals-v2/{id}.png`. 내장 도구의 `C:/Users/admin/.codex/generated_images/01a1ae4c-8fe3-71c2-939a-364898870ace/` 원본도 그대로 남겨두었다.

| ID | 센터 | 건축적 차이 | WebP bytes |
| --- | --- | --- | --- |
| boram | 보람센터 | 주민 테라스·계단형 화단이 있는 2층 L자 벽돌 센터 | 161,420 |
| rhythm | 리듬센터 | 높은 공연장 매스·톱니형 지붕과 낮은 유리 로비 | 136,246 |
| tantan | 탄탄센터 | 긴 생활체육동·짙은 녹색 경사지붕 | 152,494 |
| baeum | 배움센터 | 큰 교육 창·목재 발코니·학습실 중심 | 156,838 |
| saebom | 새봄센터 | 어긋난 현대적 모듈과 청록색 진입부 | 154,576 |
| neulpum | 늘품센터 | 정갈한 작은 중정·기와형 지붕·절제된 규모 | 166,802 |
| pureun | 푸른센터 | 목재 차양·옥상 태양광·빗물정원 | 165,242 |
| byeolbit | 별빛센터 | 기존 2층 본관과 오른쪽 3층 확장동 | 160,172 |
| daon | 다온센터 | 문화·체육·교육 세 동과 중앙 마당 | 169,120 |

## 출처와 참조

모두 게임을 위해 생성한 가상의 독자적 건물이다. 실제 특정 공공기관의 사진이나 로고를 배포하지 않는다. 입력 이미지는 이 프로젝트에서 직접 생성한 플레이어 센터 외관 `.preview/art-originals/building-v2/exterior.png` 하나이며, 공통 그림체·공공건물 비례 참고 용도다. 해당 기본 외관 제작 당시 조사한 공식 건축·공공시설 URL과 제작 내역은 [BUILDING_ART_V2.md](./BUILDING_ART_V2.md)에 있다. 경쟁센터의 이름·운영 성격은 게임 설정에서 왔다.

## 공통 스타일 지시

```text
Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
```

## 보람센터 (boram) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `boram.png`로 보관하고 `boram.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 보람센터, operational personality: resident service. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: An approachable TWO-STOREY L-shaped red brick community building with a low flat roof, broad shaded ground-floor terrace and a long wooden bench built into the edge of a planted courtyard. A generous accessible corner entrance and many human-scale windows. Welcoming neighborhood service rooms, no giant auditorium wing. Distinctive stepped brick garden walls and slightly rounded terrace corner.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 리듬센터 (rhythm) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `rhythm.png`로 보관하고 `rhythm.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 리듬센터, operational personality: performance. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A modest community performing-arts center consisting of a TWO-STOREY dark warm brick theatre box with a single distinctive sloped sawtooth-style roof volume and a lower long transparent foyer. The performance wing has tall narrow acoustic windows, while the sunny foyer has generous clear glazing. Restrained deep plum/red-brown architectural accents and charcoal roof, small paved arrival court. No stage visible outdoors, no neon, no giant concert arena.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 탄탄센터 (tantan) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `tantan.png`로 보관하고 `tantan.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 탄탄센터, operational personality: community sport. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A long LOW TWO-STOREY community sports building, a clear horizontal gymnasium wing with a shallow pitched dark-green metal roof, sturdy pale-brick base and rhythmic tall windows. A smaller two-storey service/education block at one end, short covered entrance path, simple grass verge and native planting. The sports wing is noticeably longer than the attached classrooms. Compact local scale, no football stadium or swimming pool.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 배움센터 (baeum) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `baeum.png`로 보관하고 `baeum.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 배움센터, operational personality: culture and education. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A TWO-STOREY public learning-and-culture center made of two intersecting warm stone and dark wood volumes. One prominent tall rectangular reading-room window reveals shelves and tables at a distance, with a shaded upper balcony and quiet garden-facing classroom windows. A broad but modest timber canopy shelters the entrance. Deep olive planting and rich dark timber frames distinguish this calm education center.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 새봄센터 (saebom) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `saebom.png`로 보관하고 `saebom.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 새봄센터, operational personality: new experiments. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A cheerful but mature TWO-STOREY modular public community center built from three offset rectangular volumes, off-white mineral panels, a muted teal entrance block and small terracotta architectural inserts. One volume cantilevers only slightly over a practical accessible entrance. Large asymmetrically grouped windows, a tiny roof garden and movable-looking but permanent modular geometry. Fresh contemporary civic architecture, not toy blocks or futuristic sci-fi.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 늘품센터 (neulpum) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `neulpum.png`로 보관하고 `neulpum.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 늘품센터, operational personality: care and thrift. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A small impeccably maintained TWO-STOREY courtyard community center with a simple U-shaped layout enclosing a narrow green pocket garden. Low economical cream brick volumes, deep brown timber doors and frames, plain durable tiled sloping roofs, orderly paving and carefully pruned low shrubs. The design expresses practical stewardship and quiet thrift, modest proportions, no luxurious large forecourt. The opening of the U-shaped courtyard faces the viewer.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 푸른센터 (pureun) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `pureun.png`로 보관하고 `pureun.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 푸른센터, operational personality: energy efficiency. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A TWO-STOREY environmentally thoughtful community center with a long warm timber-clad bar and a shorter pale-brick wing, a clearly visible but modest array of dark blue photovoltaic panels on the low sloped roof, external timber sunshading louvers, green planted edges and a narrow rain garden. Deep leaf greens and warm dark wood dominate; the solar array must be believable building-scale equipment, no glowing sci-fi panels, wind farm or extravagant green fantasy.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 별빛센터 (byeolbit) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `byeolbit.png`로 보관하고 `byeolbit.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 별빛센터, operational personality: gradual expansion. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: An established TWO-STOREY warm terracotta brick neighborhood culture-and-sports center with a DISTINCT ATTACHED THREE-STOREY EXPANSION WING on the RIGHT. The new wing is compact and dignified, dark timber fins and pale limestone around three stacked window levels, connected to the older two-storey center by a narrow glazed link. On the LEFT the older building contains a medium-sized multi-use hall with a simple low sloping roof and a modest column-free glass entrance. The whole institution is about a neighborhood library/sports-center scale, roughly 1200 square metres, not gigantic. A short shared arrival terrace, small trees at image edges, accessible ramp, planted strip. The old and new wings must make a coherent, realistically buildable composition. Rich terracotta brick and dark walnut window frames, clear afternoon light and blue sky.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```

## 다온센터 (daon) 최종 생성 프롬프트

스타일 참조 입력: `.preview/art-originals/building-v2/exterior.png`. 결과는 `daon.png`로 보관하고 `daon.webp`로 배포한다.

```text
Use case: stylized-concept.
Asset type: ONE distinct rival institution exterior portrait for a Korean management game, landscape 3:2 canvas, eventually displayed at 800px wide.
Institution identity: 다온센터, operational personality: balanced growth. Do not write its name or any words in the image.
Input image role: the supplied player-center image is ONLY a reference for an architecturally plausible hand-painted game world. DO NOT copy that building or merely recolor it. The following architecture must have a distinctly different massing and facade. Increase midtone richness and color clarity substantially compared with the pale reference.
Building design: A balanced TWO-STOREY culture-and-sports center made from three distinct but harmonious wings gathered around a clearly visible central open garden court. One squat brick activity hall on the left, a light wood and cream-stone classroom wing on the right, a glazed entry connector at the rear center. An open-front courtyard gives the overall massing a shallow C shape. Well-proportioned mixed public functions, modest trees and benches, planted courtyard, confident warm brick, dark timber and rich natural greens. No symmetry resembling a palace.
Style: Original hand-painted architectural game illustration with convincing modern Korean municipal building proportions, fine precise graphite/sepia construction lines, visible opaque gouache brushwork and restrained watercolor texture. Rich middle values and CLEAR color separation: deep burnt-clay brick, dark walnut or charcoal framing, lively leaf green, natural pale warm stone, and a clear soft blue sky. Crisp readable sunlight/shadow modeling, saturated enough to stay legible as a small rival portrait; avoid milky beige wash, pastel haze, washed-out color, uniform ochre tint, shiny CGI or flat vector rendering. A practical neighborhood culture-and-sports center of two or three storeys, modest civic dignity, not a palace, luxury resort, giant arena, skyscraper or monumental museum. No people, bodies, silhouettes, characters, cars, text, signs, logos, flags, letters, numbers, UI, annotations, markers or watermark.
Composition: entire building visible in a shallow elevated front three-quarter view, nearly frontal, realistic architectural perspective and straight verticals. Building fills about 82% of width and 64% of height; quiet sky behind and restrained paved foreground. Surroundings must reinforce local civic scale. No framing border, no cutaway, no plan, no dollhouse model, no montage, no multiple separate images. One original cohesive exterior scene.
Lighting: clear natural afternoon daylight, strong enough contact shadows to define the architecture and foliage, warm sun balanced with blue-gray shadows. Paint with distinct material colors, not an all-beige wash.
Constraints: exactly one plausible 2-3-storey public center, no people or human silhouettes anywhere, no cars, no text/sign/logo/flag/UI/labels/watermark. No castle, monumental staircase, oversize plaza, fountain or statue.
```
