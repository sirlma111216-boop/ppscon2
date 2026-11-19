# 추가 이미지·음향 목록과 생성 프롬프트

작성: 2026-11-19. **A-1~A-6의 그림 33장은 2026-11-19에 제작·적용을 마쳤다**(이벤트 대응 10, 대관 성격 5, 직원 교육 4, 결과 연출 8, 오지선 표정 3, 신뢰 기념 3). 제작 도구는 ChatGPT 이미지 생성이다. B-1~B-4의 그림 27장도 같은 날 받아 적용했고 그 기능을 함께 구현했다. 배경음 2종(A-8)도 같은 날 받아 연결했다. 효과음 12종(A-7)도 같은 날 받아 연결했다. B의 효과음 2종(`midseason_bell`, `story_chime`)만 아직 만들지 않았다.
목록은 두 부분이다. A는 이번에 구현한 기능에 바로 붙일 수 있는 자산이고, B는 내용을 더 풍성하게 하려고 제안했다가 2026-11-19에 구현한 기능과 그 자산이다.

- 그림 프롬프트는 영어로 썼다. 기존 삽화(`EVENT_ART_V2.json`)와 같은 화풍 문장을 앞에 붙여 쓴다.
- 음향 프롬프트는 `ELEVENLABS_AUDIO_PROMPTS.txt`와 같은 서식이다. BGM은 Music, 효과음은 Sound Effects용이다.
- 파일 이름과 위치는 연결할 때 쓸 제안값이다. 만들고 나면 출처·프롬프트·선별 과정을 기존처럼 기록한다.

## 공통 화풍 문장 (모든 그림 프롬프트 앞에 붙임)

```
Landscape 3:2, precise ink contours, hand painted rich natural colors, Korean slice-of-life management game, warm daylight, no text, no letters, no logos, no watermarks, complete heads safely framed, adults and seniors of varied ages in everyday Korean clothing.
```

세로형이 필요한 초상은 `Landscape 3:2`를 `Portrait 3:4, upper body`로 바꾼다.

---

## A. 이번에 구현한 기능에 바로 붙일 자산

### A-1. 선택형 이벤트의 두 번째 대응 장면 (10장) — 적용 완료

**2026-11-19 적용.** 제작자가 만든 PNG 10장을 1200×800 WebP로 바꿔 넣었고, 두 번째 대응을 고르면 그림이 바뀐다. 출처 기록: [EVENT_CHOICE_ART.json](EVENT_CHOICE_ART.json). 아래는 제작에 쓴 프롬프트다.

이전에는 이벤트마다 그림이 한 장이라 어떤 대응을 골라도 같은 장면이 나왔다. 두 번째 대응을 골랐을 때 바뀌는 장면이다.
위치 제안: `public/center/milestones-v1/<id>-b.webp` (1200×800 WebP).

| 파일 | 대응 | 프롬프트 |
|---|---|---|
| `star-concert-b` | 무대·안전 인력 지원 | Community center staff in simple safety vests guide a cheerful crowd beside a small outdoor stage in a brick courtyard at dusk, a fictional singer performing in the background, string lights, calm and well organised. |
| `culture-festival-b` | 체험 부스 직접 운영 | Community center staff run a hands-on craft booth at a small neighborhood festival, residents of all ages trying pottery painting and paper crafts at folding tables in front of a brick community center. |
| `starlight-cinema-b` | 야간 개방·간식 지원 | Evening outdoor movie night on picnic mats in a community center plaza, staff handing out paper cups of barley tea and snacks from a small table, warm lanterns, a blank glowing screen with no image. |
| `residents-exhibition-b` | 전시 도록 제작 | A staff member and two resident artists proudly looking through a freshly printed exhibition booklet with blank covers in a lobby gallery, framed paintings and ceramics displayed behind them. |
| `donation-b` | 감사 행사로 환원 | A small thank-you gathering in a community center lobby, residents sharing rice cakes and tea at a long table, staff bowing politely, handmade garlands, cosy and modest. |
| `complaint-b` | 안내문 전면 개편 | Two staff members installing clear new wayfinding boards with simple pictogram icons only in a bright community center corridor, an elderly resident nodding with relief. |
| `repair-b` | 고효율 조명으로 교체 | A facility technician on a ladder fitting bright new ceiling lights in a community center lobby, the space visibly brighter on one side, a staff member looking up pleased. |
| `queue-b` | 임시 접수 창구 운영 | A second temporary reception desk opened beside the main counter in a community center lobby, two short orderly lines, staff smiling and residents relaxed. |
| `newsletter-b` | 특집 기사에 협조 | A local reporter with a camera photographing a lively craft class in a community center, a staff member arranging residents' finished works on a table for the photo. |
| `volunteer-b` | 봉사자 감사 모임 | Staff presenting small potted plants to a group of resident volunteers in aprons in a sunny community room, warm applause, tidy shelves behind them. |

### A-2. 대관 성격 삽화 (5장) — 적용 완료

**2026-11-19 적용.** 대관 신청 카드에 성격별 그림이 붙는다. 출처 기록: [PROGRAM_SCENES_ART.json](PROGRAM_SCENES_ART.json).

대관 신청 카드의 성격 표시(기업·상업 / 주민 공익 / 지역 예술 / 교육·세미나 / 정기 모임) 옆에 쓸 작은 그림이다.
위치 제안: `public/center/rental-traits-v1/<trait>.webp` (600×400 WebP).

| 파일 | 프롬프트 |
|---|---|
| `commercial` | A corporate product briefing in a rented community hall, presenters in business wear, rows of chairs, sample boxes on a table, efficient but impersonal mood, slightly scuffed floor. |
| `community` | A neighborhood residents' association meeting in a cosy community room, seniors and parents seated in a circle sharing tea, a toddler playing on a mat, warm and familiar. |
| `culture` | A small local theatre troupe rehearsing on a modest stage in a community hall, actors mid-gesture, a director with a script, a few neighbors watching from the seats. |
| `education` | An adult learning seminar in a bright community classroom, a lecturer pointing at a blank whiteboard, attentive adults taking notes at desks. |
| `regular` | A relaxed weekly hobby club meeting in a multipurpose room, a handful of adults chatting around a table with board games and notebooks. |

### A-3. 직원 교육 장면 (4장) — 적용 완료

**2026-11-19 적용.** 직원 교육 패널에 고른 분야의 그림이 나오고, 결산의 교육 성과에는 승급하면 축하 장면이 나온다. 출처 기록: [PROGRAM_SCENES_ART.json](PROGRAM_SCENES_ART.json).

직원 교육을 예약했을 때와 결산에서 승급했을 때 쓸 그림이다.
위치 제안: `public/center/training-v1/<id>.webp` (900×600 WebP).

| 파일 | 프롬프트 |
|---|---|
| `training-culture` | Community center staff attending a workshop on running craft and arts classes, an instructor demonstrating at a table with clay and brushes, staff taking notes. |
| `training-sport` | Community center staff in comfortable clothes practising safe exercise instruction on yoga mats, a trainer correcting posture, mirrors and wooden floor. |
| `training-event` | Community center staff rehearsing event operations in an empty hall, checking seating layout with clipboards, one testing a microphone on a small stage. |
| `training-levelup` | A staff team celebrating a training certificate with blank paper in a community center office, modest applause, proud smiles, a plant and tidy desks. |

### A-4. 결과 연출 그림 (8장) — 적용 완료

**2026-11-19 적용.** 운영 결과 카드에 그 계절을 요약하는 그림이 붙는다: 호조·부진인 계절은 분위기 그림, 그 밖에는 대호응이 많으면(4주 중 1주 이상) 대호응 그림, 아쉬움이 많으면(10주 중 3주 이상) 아쉬움 그림. 평범한 계절에는 그림이 없다. 출처 기록: [SCENES_AND_PORTRAITS_ART.json](SCENES_AND_PORTRAITS_ART.json).

운영 결과 카드에서 대호응·아쉬움인 주와 호조·부진인 계절을 한눈에 보여 줄 그림이다. 분야(문화·체육·행사)별 한 장씩.
위치 제안: `public/center/outcomes-v1/<id>.webp` (600×400 WebP).

| 파일 | 프롬프트 |
|---|---|
| `great-culture` | A craft class at its best, every seat filled, participants laughing and holding up finished handmade works, the instructor delighted. |
| `great-sport` | A full and energetic community exercise class moving in sync, bright faces, an instructor giving a thumbs-up. |
| `great-event` | A packed small community hall giving warm applause after a neighborhood performance, performers bowing on a modest stage. |
| `poor-culture` | An awkward craft class with several empty seats, spilled paint water on a table, an instructor apologising with a wry smile, gentle comedy, nobody upset. |
| `poor-sport` | A sparsely attended exercise class where the music speaker has stopped, an instructor fiddling with it while three participants wait patiently, light comedy. |
| `poor-event` | A community hall event with a tangled microphone cable and half-empty rows, a staff member hurrying to fix it, mild and harmless mishap. |
| `mood-hot` | A cheerful queue of residents signing up at a community center noticeboard with blank posters, word of mouth spreading, bright morning. |
| `mood-cold` | A quiet community room on a rainy day with only a couple of participants and many empty chairs, calm rather than sad. |

### A-5. 오지선 브리핑 표정 (3장) — 적용 완료

**2026-11-19 적용.** 결산 브리핑의 초상이 상황에 따라 바뀐다: 3위권이고 명성이 내려가지 않았으면 밝은 표정, 적자·긴 휴강·명성 1 이상 하락·8위 이하면 걱정하는 표정, 그 밖에는 다짐하는 표정. 출처 기록: [SCENES_AND_PORTRAITS_ART.json](SCENES_AND_PORTRAITS_ART.json).

결산 브리핑에서 상황에 따라 바뀔 운영팀장 오지선의 초상이다. 기존 `jiseon-portrait.webp`를 참조 이미지로 넣어 같은 인물로 만든다.
위치 제안: `public/center/jiseon-<mood>.webp` (세로 600×800 WebP).

| 파일 | 프롬프트 |
|---|---|
| `jiseon-glad` | Portrait 3:4, upper body. The same Korean woman operations manager in her forties with a clipboard, navy cardigan and staff lanyard, smiling brightly with relief and pride, community center office background softly blurred. |
| `jiseon-worried` | Portrait 3:4, upper body. The same operations manager looking thoughtfully concerned, one hand on her chin, reviewing her clipboard, kind eyes, not distressed. |
| `jiseon-resolved` | Portrait 3:4, upper body. The same operations manager with a determined encouraging expression, holding her clipboard against her chest, ready to propose a plan. |

### A-6. 신뢰 달성 기념 장면 (3장) — 적용 완료

**2026-11-19 적용.** 신뢰가 100·150·200을 넘긴 계절의 결산에 한 번 나온다. 출처 기록: [SCENES_AND_PORTRAITS_ART.json](SCENES_AND_PORTRAITS_ART.json).

신뢰에 상한이 없어졌으므로 100·150·200을 넘을 때 한 번씩 보여 줄 장면이다.
위치 제안: `public/center/trust-v1/trust-<n>.webp` (1200×800 WebP).

| 파일 | 프롬프트 |
|---|---|
| `trust-100` | Residents greeting staff by name at the community center entrance on a bright morning, a senior handing over a small bag of homegrown vegetables as thanks. |
| `trust-150` | A community center lobby wall covered with handwritten thank-you notes shown as blank coloured cards and children's drawings, families passing by and pointing happily. |
| `trust-200` | A whole neighborhood gathered in front of the community center for a group photo, all generations, staff in the middle, festive but modest, late afternoon light. |

### A-7. 효과음 (12종) — 적용 완료

**2026-11-19 적용.** `public/center/audio/sfx_<name>.wav`. 결과 순회의 각 장면에서 그 수업의 결과에 맞는 소리 하나가 난다(호조·부진 > 대호응·아쉬움이 많았던 수업 > 순수입 증감). 사건 대응 확정과 중간 점검 결정에는 event_choice, 대관 빠른 승인에는 rental_stamp, 결산에서는 정산 소리 0.9초 뒤에 신뢰 달성 > 교육 승급 > 교육 수료 > 브리핑 시작 가운데 하나가 난다. 늦게 시작하는 5개는 잘라 낸 사본을 재생한다. 기록: [AUDIO_ASSETS.json](AUDIO_ASSETS.json), [SFX_TRIMMED.json](SFX_TRIMMED.json). 사람이 들어 확인하지는 않았다.

위치 제안: `public/center/audio/sfx_<name>.wav`. 모두 대사·음성 없이 만든다.

```
outcome_great | 대호응 | 1.4초 | 1회
Bright short success sting for a cosy management game. Two rising marimba notes, a soft glockenspiel sparkle and a faint warm applause tail. Cheerful, not a fanfare. No voice, no speech. Clean start, natural short tail, no clipping.

outcome_poor | 아쉬움 | 1.1초 | 1회
Gentle comic stumble sting. A soft descending pizzicato pluck and a muted woodblock tap, like a small harmless slip. Wry, never harsh or sad. No voice, no speech. Clean start, short tail.

mood_hot | 호조인 계절 | 1.6초 | 1회
Warm upward swell with light hand claps and a rising felt piano arpeggio, the feeling of a class catching on. No voice, no speech. Smooth tail.

mood_cold | 부진한 계절 | 1.5초 | 1회
Soft falling clarinet phrase over a quiet room tone, calm and slightly wistful, not gloomy. No voice, no speech. Smooth tail.

delta_up | 수치 상승 | 0.5초 | 1회
Tiny bright tick-up, two quick soft wooden clicks rising in pitch with a small coin-like chime. Very short, can repeat often without fatigue. No voice.

delta_down | 수치 하락 | 0.5초 | 1회
Tiny soft tick-down, two quick muted wooden clicks falling in pitch. Neutral, not alarming. Very short. No voice.

training_done | 교육 수료 | 1.3초 | 1회
Short satisfied completion cue, a pencil check stroke on paper followed by two warm vibraphone notes. Tidy and encouraging. No voice.

level_up | 교육 단계 승급 | 2.0초 | 1회
Rewarding level-up cue for a calm game. Ascending three-note felt piano and glockenspiel figure with a soft shimmer and a gentle final chord. Proud but modest. No voice, no speech.

event_choice | 이벤트 대응 확정 | 0.8초 | 1회
Decisive soft stamp on a paper form followed by a single warm marimba note. Confident and neat. No voice.

rental_stamp | 대관 일괄 승인 | 0.9초 | 1회
Three quick rubber stamps on paper in a neat rhythm, then a short page flip. Office-like and satisfying. No voice.

trust_milestone | 신뢰 달성 | 2.2초 | 1회
Warm community cue, a small group of hand claps with a rising acoustic guitar strum and a soft bell. Heartfelt, not grand. No voice, no cheering words.

briefing_open | 브리핑 시작 | 0.9초 | 1회
A clipboard set down gently, one page turned, and a single soft piano note. Attentive and friendly. No voice.
```

### A-8. 배경음 (2종) — 적용 완료

**2026-11-19 적용.** `public/center/audio/bgm_decision.mp3`, `bgm_result_review.mp3`. decision은 사건 대응을 고르는 화면과 계절 중간 점검에서, result_review는 운영 뒤 결과 순회부터 결산까지(종합평가 시상 제외) 나온다. 새 규칙(규칙 3) 게임에만 적용되며, 이 게임에서는 기존 operation 곡이 더는 나오지 않는다(예전 규칙 저장에서는 그대로 나온다). result_review는 다른 곡보다 작게 만들어져 재생 음량만 1.5배로 올렸다. 기록: [AUDIO_ASSETS.json](AUDIO_ASSETS.json). 사람이 들어 확인하지는 않았다.

위치 제안: `public/center/audio/bgm_<name>.mp3`.

```
result_review | 활동별 결과 순회 | 60초 | 반복 재생
Light, curious review music for looking back at a season. Pizzicato strings, soft marimba and a walking upright bass, 96 BPM. Gently playful with small rises that suit numbers going up and down. Original instrumental only. No vocals, speech, lyrics or recognizable existing melody. Balanced game-ready mix, no loud transient peaks. Seamless loop, matched opening and ending harmony, no fade out.

decision | 이벤트 대응 선택 | 45초 | 반복 재생
Thoughtful decision music with a hint of suspense. Soft piano ostinato, muted plucked bass and a quiet clarinet line, 84 BPM. Calm and attentive, never tense or dramatic. Original instrumental only. No vocals, speech, lyrics or recognizable existing melody. Balanced game-ready mix, no loud transient peaks. Seamless loop, matched opening and ending harmony, no fade out.
```

---

## B. 제안 기능과 자산 — 그림 27장 적용, 기능 구현 완료

아래 네 가지는 2026-11-19에 규칙과 화면을 만들고 전달받은 그림 27장을 연결했다. 새 규칙(규칙 3)으로 진행하는 게임에만 적용된다. 표의 "대응(안)"은 제안 당시 문구이고, 실제 수치는 각 항목의 적용 메모와 `docs/center-growth/IMPLEMENTATION_STATUS.md`에 있다. 효과음 `midseason_bell`, `story_chime`은 만들지 않았다.

### B-1. 새 선택형 이벤트 (8종) — 적용 완료

**2026-11-19 적용.** 사건이 39종으로 늘었고 새 게임은 그 가운데 28종을 뽑는다. 폭염은 여름에만 나온다. 대응: 폭염(평소대로 = 수입 −3% / 쉼터 = 비용 25만·신뢰 +3), 방송 촬영(거절 / 허가 = 명성 +3·가장 바쁜 공간 한 주 휴강), 유명 강사(다음 기회 / 초빙 = 비용 35만·정원이 가장 큰 수업 한 계절 호조), 정전(하루 휴관 = 한 주 전체 휴강 / 발전기 = 비용 30만), 동아리 발표회(대관료 +15만 / 무료 = 주민 120명 참여·신뢰 +1), 자매 센터(견학 = 명성 +0.5 / 환영 = 비용 25만·명성 +2.5), 기부 물품(재기부 = 명성 +1.5 / 정비 = 비용 20만·장비 상태 +15), 행정 점검(평소대로 / 서류 정비 = 그 계절 교육 불가·재정 건전성 +4점). 돈이 드는 대응은 운영을 시작할 때 전액을 먼저 내며, 쓸 수 있는 현금이 모자라면 고를 수 없고 기본 대응으로 처리된다. 출처 기록: [NEW_EVENT_SCENES_ART.json](NEW_EVENT_SCENES_ART.json).

지금은 28종 가운데 10종에만 대응 선택이 있다. 선택 폭이 큰 사건을 더해 18종으로 늘리는 안이다. 각 사건은 기본 장면 한 장과 대응 장면 한 장이 필요하다.
위치 제안: `public/center/milestones-v1/<id>.webp`, `<id>-b.webp`.

| 사건 | 고를 수 있는 대응(안) | 기본 장면 프롬프트 | 두 번째 대응 장면 프롬프트 |
|---|---|---|---|
| `heatwave` 폭염 | 무더위 쉼터로 개방(비용↑·신뢰↑) / 평소대로 운영 | A scorching summer afternoon outside a brick community center, residents fanning themselves under a shimmering sun, cicadas implied by stillness. | The community center lobby turned into a cool resting place, seniors relaxing with cold barley tea and electric fans, staff handing out paper fans with blank surfaces. |
| `tv-crew` 방송 촬영 요청 | 촬영 허가(명성↑·그 주 일부 휴강) / 정중히 거절 | A small local broadcast crew with a camera and boom microphone arriving at a community center entrance, staff greeting them with curiosity. | A camera crew filming a lively dance class in a community center studio, participants a little shy but smiling. |
| `guest-teacher` 유명 강사 제안 | 특강 초빙(비용↑·한 수업 한 계절 호조 확정) / 다음 기회로 | A well-known instructor in a smart casual outfit visiting a community center office with a portfolio, staff listening with interest. | A packed special lecture in a community hall with an inspiring guest instructor on stage, every seat taken. |
| `blackout` 동네 정전 | 발전기 임차(비용↑·휴강 없음) / 하루 휴관(휴강 1주) | A community center lobby during a sudden power cut, staff holding flashlights and calmly guiding residents, dim daylight from large windows. | A portable generator humming outside a community center side door at dusk, lights back on inside, a technician checking cables. |
| `club-showcase` 동아리 발표회 | 대강당 무료 개방(수입↓·만족↑) / 정상 대관료 | Members of resident hobby clubs excitedly asking a staff member about holding a showcase, holding instruments and handmade crafts. | A joyful resident club showcase in a community hall, a ukulele group on stage and craft displays along the wall, families applauding. |
| `sister-center` 자매 센터 방문단 | 환영 행사(비용↑·명성↑) / 간단한 견학 | A visiting delegation from another town's community center arriving by small bus, exchanging polite bows with staff at the entrance. | A warm welcome tea table in a community center meeting room, visitors and staff exchanging small gifts and looking at a model of the building. |
| `donated-goods` 기부 물품 도착 | 직접 정비해 사용(비용↑·장비 상태↑) / 필요한 곳에 재기부(명성↑) | Staff opening large donated boxes of used sports and craft equipment in a community center storage room, surprised and grateful. | Staff and volunteers repairing and cleaning donated equipment on a workbench, neatly arranged tools, satisfying order. |
| `inspection` 행정 점검 | 서류 정비에 집중(교육 불가 한 계절·재정 평가 보너스) / 평소대로 | Two municipal inspectors with document folders arriving at a community center office, staff standing politely by tidy shelves of binders with blank spines. | A staff team working late at an office table covered in neatly sorted binders with blank spines and a calculator, tired but organised. |

### B-2. 계절 중간 점검 (그림 3장, 효과음 1종) — 그림 적용 완료, 효과음 미제작

**2026-11-19 적용.** 운영을 시작하면 7주 차 회의 화면이 먼저 뜬다. 앞선 6주의 영업·방문·빈자리·공간 상태를 보고 그대로 진행(무료), 홍보 강화(20만 원: 빈자리가 가장 많은 수업 5개에 남은 7주 동안 매주 새 수강생), 긴급 정비(30만 원: 상태가 가장 나쁜 공간 2곳의 관리상태와 그 방 장비 상태 +25. 최종 점검에서 15만 원·전 공간 +15이던 것을 고침) 가운데 하나를 고른다. 창을 닫으면 운영하지 않고 계획으로 돌아간다. 출처 기록: [MIDSEASON_RIVALS_STORIES_ART.json](MIDSEASON_RIVALS_STORIES_ART.json).

13주 운영을 7주에서 한 번 멈추고 "홍보 강화 / 긴급 정비 / 그대로 진행" 가운데 하나를 고르게 하는 안이다.

| 파일 | 프롬프트 |
|---|---|
| `midseason-meeting` | A short mid-season staff meeting around a small table in a community center office, a wall calendar with blank squares half filled with stickers, three staff discussing calmly. |
| `midseason-promotion` | Staff pinning colourful blank posters on a neighborhood noticeboard and handing blank flyers to passers-by on a sunny street corner. |
| `midseason-repair` | A facility staff member doing quick maintenance on exercise equipment in an empty studio between classes, toolbox open, tidy and efficient. |

```
midseason_bell | 중간 점검 알림 | 1.2초 | 1회
A soft desk bell followed by a single page turn, signalling a pause to review. Friendly and unhurried. No voice.
```

### B-3. 경쟁 센터와의 접점 (그림 3장) — 적용 완료

**2026-11-19 적용.** 선택형 사건 3종으로 넣었다. 계절마다 정해지는 이웃 센터의 이름이 글에 들어간다. 대응: 이웃 센터장의 방문(가볍게 안내 / 운영 비결 나누기 = 비용 10만·교육이 가장 낮은 분야 교육 점수 +12·명성 +0.5), 합동 체육대회(다음 기회 / 함께 열기 = 비용 20만·주민 150명 참여·명성 +1), 인기 강사 영입 제안(보내 드리기 = 정원이 가장 큰 수업 한 계절 부진 / 붙잡기 = 비용 30만·신뢰 +1). 상대 센터의 수치를 바꾸지는 않는다. 그림은 사건마다 한 장이다. 출처 기록: [MIDSEASON_RIVALS_STORIES_ART.json](MIDSEASON_RIVALS_STORIES_ART.json).

경쟁 센터가 순위표로만 보이지 않도록, 가끔 사건으로 만나게 하는 안이다.

| 파일 | 프롬프트 |
|---|---|
| `rival-visit` | A director from a neighboring community center visiting to look around, shaking hands with staff in a bright lobby, friendly rivalry in their smiles. |
| `joint-event` | Two community center teams in different coloured staff lanyards co-hosting an outdoor neighborhood sports day, tug-of-war in the background. |
| `poached-instructor` | A popular instructor apologetically telling a staff member about an offer from another center, both standing in a studio doorway, respectful and slightly awkward. |

### B-4. 수강생 이야기 (그림 5장) — 그림 적용 완료, 효과음 미제작

**2026-11-19 적용.** 한 수업이 네 계절을 쉬지 않고 이어지면(계절마다 13주 중 10주 이상 운영) 결산에 이야기가 한 편 나온다. 수업마다 4·8·12계절째에 한 편씩, 한 계절에는 한 편만 나온다. 첫 이야기는 수업 종류에 따른다(공예 계열 = 첫 작품전, 그 밖의 문화 수업 = 수료식, 체육·행사 수업 = 대회 트로피). 둘째는 단짝, 셋째는 손편지다. 보상은 신뢰 +1과 명성 최대 +0.3(명성이 높을수록 작아짐)이다. 출처 기록: [MIDSEASON_RIVALS_STORIES_ART.json](MIDSEASON_RIVALS_STORIES_ART.json).

한 수업을 여러 계절 이어서 운영했을 때 생기는 작은 보상 장면이다(예: 4계절 연속 운영 시 명성·신뢰 보너스).

| 파일 | 프롬프트 |
|---|---|
| `story-exhibition` | Adult craft class students nervously and proudly setting up their first small exhibition in a community center corridor. |
| `story-graduation` | A modest completion ceremony for a digital skills class, seniors holding certificates with blank paper, an instructor clapping. |
| `story-contest` | A community dance class returning with a small trophy from a local contest, hugging in the studio, the instructor wiping a happy tear. |
| `story-new-friend` | Two residents who met in a class chatting over tea in the community center lounge, one much older than the other, an easy friendship. |
| `story-teacher-letter` | An instructor reading a handwritten thank-you letter shown as a page with soft illegible strokes in a quiet classroom after class, touched. |

```
story_chime | 수강생 이야기 등장 | 1.8초 | 1회
Tender short cue, a music-box phrase with a soft string pad underneath, the feeling of a small heartwarming moment. No voice, no speech.
```

---

## 만들 때 확인할 것

- 그림 안에 글자·간판·로고가 생기지 않았는지 확인한다. 읽어야 하는 글은 모두 화면의 DOM 텍스트로 넣는다.
- 인물의 얼굴·손이 잘리거나 뭉개지지 않았는지, 기존 삽화와 화풍이 어긋나지 않는지 본다.
- 효과음은 시작 지연과 끝 꼬리를 다듬고, 자주 울리는 `delta_up`·`delta_down`은 특히 작고 짧게 만든다.
- 사용한 도구·프롬프트·선별·수정 과정과 원본 경로를 기존 출처 기록과 같은 방식으로 남긴다.
