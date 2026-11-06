# 클래스 선택 카드 일러스트 v2

제작일: 2026-11-06

사용자 요청에 따라 단색 클래스 버튼 대신 활동을 읽을 수 있는 정적인 그림을 제작했습니다. 카드에는 인물을 포함하며, 시설 장면의 사람 애니메이션을 복원하지 않습니다. 모든 그림은 내장 `image_gen__imagegen`으로 각 에셋마다 별도 생성했습니다. 외부 사진·작가 그림·상용 스톡·참조 이미지는 사용하지 않았습니다.

## 파일과 확인

- 배포 위치: `public/center/classes-v2/`
- 배포 형식: WebP, 가로 3:2, 768×512, quality 85
- 프로젝트 내 원본 보관: `.preview/art-originals/classes-v2/`의 같은 이름 PNG 7개, 1536×1024
- 원본을 재편집하지 않고 Sharp로 해상도·형식만 최적화했습니다. 원본은 배포 폴더에서 보관 폴더로 옮겼으며 이동 전후 SHA-256이 일치합니다.
- 원본 PNG 합계 23,498,630바이트 → 배포 WebP 합계 723,772바이트로 약 96.9% 줄었습니다.
- 이미지 내 문자·로고·버튼·잠금 아이콘을 넣지 않았습니다. 클래스 이름·잠금·상태는 접근 가능한 HTML로 표시합니다.
- 7장 모두 생성 결과를 시각적으로 확인했습니다. 각 활동, 인물 비율, 손·발과 주요 도구, 카드에서의 구분, 화면 내 텍스트 부재를 점검했습니다.
- 일러스트의 인물·공간은 창작된 것이며 특정 실제 인물을 묘사하도록 요청하지 않았습니다.

| 파일 | 활동 | 장면 |
|---|---|---|
| `P01.webp` | 공예 강좌 | 성인 도예·목공 |
| `P02.webp` | 주민 공예 교실 | 가족·노년의 공동 패치워크 |
| `P03.webp` | 요가 강좌 | 성인 요가 |
| `P04.webp` | 주민 스트레칭 | 노년층 의자 스트레칭 |
| `P06.webp` | 주민 모임 | 둥근 탁자의 독서·동아리 모임 |
| `P07.webp` | 디지털 강좌 | 태블릿·컴퓨터 학습 |
| `P09.webp` | 댄스 강좌 | 성인 단체 안무 |

배포 파생본 생성 설정: `sharp(original).resize(768, 512, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 85, effort: 6 })`. 원래 3:2 비율을 유지하며 잘라내지 않았습니다. 생성된 WebP 7개 모두 해상도를 확인했고 P01 파생본의 시각 품질을 추가로 확인했습니다.

## 공통 프롬프트

각 호출은 아래 공통 프롬프트와 해당 에셋의 장면 프롬프트를 줄바꿈으로 연결했습니다. `transparent_background`는 `false`이며 참조 이미지나 편집 대상은 지정하지 않았습니다.

```text
Use case: illustration-story. Asset type: static illustrated activity-selection card for a Korean public culture-and-sports center management game. One single finished 3:2 landscape illustration, approximately 1536x1024. Art direction: original hand-painted gouache with translucent watercolor pooling and visible fine colored-pencil contours on warm ivory cotton paper. Distinctive observational Korean picture-book illustration, restrained pigment palette of ink navy, warm ochre, muted sage, terracotta and milky cream. Irregular human brush edges, tiny convincing details and gentle lively character acting; beautiful art-book quality, not generic corporate clipart. Adult bodies have coherent natural proportions and varied faces; tasteful simplified facial features and individually different hair and clothing. The activity and people must read instantly as a small card thumbnail. Center the complete key activity within the central 80 percent with breathing room around heads and hands. Calm simplified Korean municipal-center interior, wood floor or worktable and soft window light, minimal background clutter. No text at all, no letters, numbers, labels, signage, logos, watermark, borders, icons or UI. No photorealism, 3D, glossy surfaces, vector-flat stock art, chibi heads, excessive sepia filter, sticker outlines or decorative floating symbols. This is a static illustration, not an animation sheet.
```

## 에셋별 장면 프롬프트

### P01 · 공예 강좌

```text
Scene: a paid adult craft workshop. Two Korean adults in their thirties and forties wearing practical blue and ochre aprons sit at a generous wooden worktable, concentrating on shaping a small terracotta clay bowl and carefully carving a small wooden object by hand. A few tactile clay cups, wood curls and neatly placed safe hand tools reveal a well-equipped craft lesson. One adult has short hair and round glasses, the other a loose tied-back hairstyle. Hands and materials are the central focus; relaxed professional learning, satisfaction from making. Warm ochre and muted blue accents. Three-quarter intimate room view, full upper bodies and natural hands.
```

### P02 · 주민 공예 교실

```text
Scene: an inclusive neighborhood craft workshop. A Korean grandmother with silver bobbed hair, an adult parent and a school-age child sit together at a low broad wooden table, happily arranging hand-cut colored paper and small fabric pieces into one large communal patchwork artwork. Their collaborative gestures clearly differ from a commercial pottery lesson: sharing materials, passing a piece, looking at the communal work together. Friendly intergenerational public-center atmosphere. Sage green and faded coral accents; simple hanging paper artworks in background without text. Three-quarter view, the shared artwork prominently visible, anatomically sensible hands.
```

### P03 · 요가 강좌

```text
Scene: an adult yoga lesson in a warm public-center exercise studio. Two Korean adults, one woman with a short ponytail in muted coral exercise clothes and one man with cropped hair in ink-blue loose exercise clothes, practice a calm standing warrior pose on separate sage-colored yoga mats. Show coherent full adult bodies from head to toes, naturally bent front knees, extended arms and aligned feet. A small neatly stacked pile of spare mats identifies equipment-enabled class. Soft morning window light, simple pale wood floor, spacious composed arrangement. Quiet focus and welcoming everyday fitness, no extreme flexibility or luxury spa.
```

### P04 · 주민 스트레칭

```text
Scene: a gentle free stretching session for older neighborhood residents. Two Korean seniors, a silver-haired woman in sage cardigan and an older man in a soft ochre tracksuit, sit securely on simple sturdy chairs and gently stretch one arm overhead while smiling at each other. A friendly middle-aged instructor demonstrates an easy shoulder stretch nearby. Comfortable realistic range of motion, everyday bodies, clearly senior-friendly seated mobility rather than yoga. Warm cream, apricot and sage; a public-center wood-floor exercise room with neatly rolled mats. Show complete natural bodies and chair legs, welcoming active-aging mood.
```

### P06 · 주민 모임

```text
Scene: a neighborhood reading club in a Korean public center. Three different Korean adults of mixed ages sit around a small circular wooden table, leaning in with interest and gently discussing an open picture book. One older woman has short gray hair, a young adult wears simple round glasses, a middle-aged man wears a green cardigan. Books contain abstract pictures only, absolutely no lettering. Include a simple teapot and two plain mugs, restrained small bookshelf behind them. Their faces and the unmistakably round table form a clear cozy composition. Sage, honey wood and navy accents, friendly voluntary community gathering, no lecturer or classroom computer.
```

### P07 · 디지털 강좌

```text
Scene: a practical digital-literacy class in a Korean public center. A patient Korean adult instructor in a muted blue shirt stands beside an older woman and an older man learning at a tidy wooden desk. The woman touches a tablet with one finger while the man uses a compact laptop. Screens have only simple unlabeled colored shapes and abstract picture thumbnails, no words, letters or numbers. The teacher points gently toward the tablet without touching the learner. Curious, capable expressions; intergenerational access to technology, no sci-fi equipment. Fine warm wood grain, cool blue and lilac accents, a softly glowing projection screen in the distant background with no text.
```

### P09 · 댄스 강좌

```text
Scene: a cheerful adult dance class in a Korean public-center exercise studio. Three Korean adults of different builds and ages follow one simple rhythmic step together, knees slightly bent and arms in clear different lively but anatomically plausible dance positions. A short-haired woman wears muted coral, a man wears navy and ochre, a woman with tied hair wears sage. Full figures with feet visible, natural adult proportions, energetic joyful static action illustration. A discreet small speaker and rolled mats identify the necessary sound-and-mat equipment. Warm wooden floor, softly lit plain studio wall, no mirror reflections, no stage spotlights, no musical-note symbols.
```

## 생성 원본 경로

프로젝트 원본은 아래 생성 결과에서 복사한 후 `.preview/art-originals/classes-v2/P01.png` 등의 동일 이름으로 보관합니다. Codex 생성 이미지 원본도 아래 위치에 그대로 남아 있습니다. 실제 웹앱은 `public/center/classes-v2/P01.webp` 등의 파생본만 사용합니다.

- `P01.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-4ff6b78b-8c87-4050-b2ab-6e976d5e1d64.png`
- `P02.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-d8d4558b-3fa6-4f90-8972-84c3179edc0e.png`
- `P03.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-6528a2db-1066-4993-8905-9d6e209c749a.png`
- `P04.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-53e1b1a9-ff00-41af-b016-ea7975da1e25.png`
- `P06.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-1bd7f4da-0777-4661-ae1d-5acba0557a7a.png`
- `P07.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-46922b55-22e3-444e-9e1e-907d0c7e7223.png`
- `P09.png`: `C:\Users\admin\.codex\generated_images\01a1ae4c-5074-7502-9429-9f1be74f8ced\exec-1c1da1e0-8dd7-43f5-a2ed-7471481b93ee.png`

## 전달 방식

일러스트는 문서나 UI를 통째로 이미지화한 것이 아닙니다. 활동을 설명하는 그림만 포함하며 카드 이름·선택·잠금 상태는 코드가 렌더링합니다. 작은 카드에서는 `aspect-ratio: 3 / 2`와 `object-fit: cover`를 사용해 전체 구도가 유지되도록 연결합니다.
