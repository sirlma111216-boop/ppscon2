# 《내일을 여는 상자》 오디오 제작·구현 명세

> 문서 기준일: 2026-11-04, Asia/Seoul. 대상: 혼자 제작하며 Claude Code와 생성 AI를 사용하는 개발자.
> **이 문서는 제작 지침과 생성 프롬프트다. 실제 음악·효과음·환경음 파일은 생성하거나 제공하지 않았다.** 아래 파일명은 향후 제작할 납품 자산의 이름이다. 오디오가 없거나 불러오기에 실패해도 게임은 정상 진행되어야 한다.
> **현재 런타임에서 오디오 파일을 preload·fetch·decode하지 않는다.** `public/assets/audio/manifest.json`은 미생성 자산 27개의 기계 판독용 제작 명세다. JSON 자체를 읽어 제작 상태를 표시하는 것은 가능하지만, 모든 행이 `status: "not_generated"`, `exists: false`, `preload: false`인 동안 음원 요청을 시작하면 안 된다.

## 1. 소리의 역할과 제작 범위

게임은 한국 동네를 리소그래프와 종이 무대처럼 표현하는 약 12분짜리 조달 수요 적합성 퍼즐이다. 동네는 한 장이며 도서관·학교·주민센터·공원 네 시설을 세 임무에서 사용한다. 소리는 물건이 이동하는 느낌과 함께, **필요를 이해하고, 같은 기준으로 비교하고, 품질을 확인하고, 실제 사용자의 반응을 반영하는 과정**을 구별한다.

최종 물품과 생활 동작은 다음 기준으로 맞춘다. 도서관은 **L1 접이식 활동테이블 / L2 이동 모듈테이블**로 오전 독서 공간을 오후 모임 공간으로 바꾼다. 학교는 **S1/E1 콤팩트 수동 높이 조절 책상 / S2/E2 넓은 수동 높이 조절 책상**의 사용자 적합성과 통로를 살핀다. 공원은 **이동식 쉼 그늘막**의 설치·사용, 주민센터는 **키오스크 시범 사용과 주민 피드백**을 다룬다. 도서 운반 카트나 접이식 좌석을 핵심 물품처럼 들리게 만들지 않는다.

핵심 질감은 얇은 종이의 마찰, 인쇄 잉크 롤러의 부드러운 회전, 펠트 피아노, 짧게 끊은 현의 울림, 아주 작은 우드블록이다. 목제 장난감의 둥글고 통통 튀는 소리로 전체를 덮지 않는다. 오르골·우쿨렐레·휘파람·가짜 필름 잡음·과도한 카페 재즈도 기본 어휘에서 제외한다. 한국이라는 배경은 특정 전통 악기를 장식처럼 넣는 대신 시설의 생활음과 장면에서 전달한다.

- 음악: 5개. 일정이 부족하면 인트로와 엔딩을 같은 원곡의 편집본으로 제작해 신규 생성은 4개로 줄인다.
- 효과음: 18개. 반복 사용 빈도가 높은 3개만 선택적으로 변형본을 만든다.
- 환경음: 시설별 4개. 동시에 네 개를 모두 재생하지 않는다.
- 음성 대사: 이번 범위에서 제외. 모든 정보는 짧은 한국어 문장과 시각적 상태로 전달한다.
- 게임 안에서 ElevenLabs에 접속하거나 실시간 생성하지 않는다. 확정한 로컬 오디오만 재생한다.

## 2. ElevenLabs 현재 기능: 확인한 사실과 적용

아래는 공식 문서를 2026-11-04에 확인한 결과다. 계정별 기능·가격·다운로드 형식은 바뀔 수 있으므로 결제와 생성 직전에 실제 화면을 확인한다.

| 항목 | 확인 내용 | 이 프로젝트의 사용 방식 |
|---|---|---|
| Music | 현재 개요는 `music_v2_5`를 최신 모델로 설명한다. Music v1은 사용 중단 예정 모델로 안내된다. 텍스트 생성, 구간 편집, Audio Reference를 지원한다. | 모델을 고를 수 있으면 v2.5를 명시적으로 선택. 긴 곡·파인튜닝 없이 짧은 기악곡 제작. |
| Music API | `prompt`와 `composition_plan` 중 하나를 사용한다. `music_length_ms`, `model_id`, `force_instrumental` 등이 문서화돼 있다. | 단순 프롬프트 방식과 기악 설정으로 시작. 결과의 실제 길이·템포·구조는 편집기로 확인. |
| Audio Reference | 유료 플랜에서 약 30초 이내의 오디오로 음색·제작 스타일·템포·분위기를 안내할 수 있다. 원곡 복제 기능은 아니다. | 직접 만든 짧은 모티프를 참고로 사용 가능. 다른 게임의 음원을 업로드하지 않는다. |
| SFX | 개요는 `eleven_text_to_sound_v3`를 최신 모델로 안내한다. 텍스트 효과음과 환경음, 반복용 생성 옵션이 있다. | 한 프롬프트에 한 행동. 루프 환경음만 Loop 옵션을 사용. |
| SFX API | `text`, `duration_seconds`, `loop`, `prompt_influence`, `model_id`를 제공한다. API 참조의 길이 범위는 0.5~30초다. | 짧은 클릭도 0.5~1초 이상 생성하고 실제 사용할 부분을 잘라낸다. |

출처: [Music 기능 개요](https://elevenlabs.io/docs/overview/capabilities/music), [Music API](https://elevenlabs.io/docs/api-reference/music/compose), [SFX 기능 개요](https://elevenlabs.io/docs/overview/capabilities/sound-effects), [SFX API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert).

**문서 간 차이 처리:** Music 개요의 최대 길이와 API 스키마의 최대 길이는 다르게 표시된다. SFX도 개요와 API에서 최소 길이가 다르다. 이 키트는 그 공통 범위 안인 음악 9~48초, SFX 생성 0.5~30초만 사용한다. SFX WAV 다운로드는 반복 여부·화면·요금제에 따라 안내가 달라 실제 제공 형식을 확인한다. 지원되는 파일을 받은 뒤 개발용 형식으로 변환한다. MP3를 WAV로 변환해도 원래 손실 정보가 복구되지는 않는다.

**보장하지 않는 것:** 프롬프트의 정확한 음정, 반복 횟수, 실제 BPM, 무음 길이, 4마디 구조, 음악의 완벽한 루프, 효과와 화면의 프레임 단위 동기화. 공식 SFX 안내도 정확한 반복 횟수 요청이 항상 지켜지지는 않는다고 명시한다. 모든 숫자는 납품 목표이며, 생성 후 편집과 검청을 통과해야 확정된다. [SFX 프롬프트 안내](https://elevenlabs.io/docs/overview/capabilities/sound-effects)

## 3. 공통 음악 언어와 4음 모티프

### 고유 모티프

목표 음정은 **D4 → F#4 → A4 → E4**. 80 BPM에서 길이는 **8분음표 → 8분음표 → 4분음표 → 2분음표**로, 한 마디 약 3초다. 마지막 E는 질문이 조금 남는 느낌을 주며, 엔딩에서는 반주를 D장조로 정리한다. 이를 ‘필요 발견 → 조건 이해 → 선택 → 사용자의 반응 듣기’에 대응시키되, 플레이어에게 음악 이론을 설명하지 않는다.

이 네 음 자체의 독점적 권리나 절대적 독창성을 주장하지 않는다. 이 게임의 편곡·음색·사용 맥락을 일관되게 만드는 제작 규칙이다.

**중요:** 생성 모델이 이 음표를 정확히 연주할 것이라고 기대하지 않는다. 정확한 모티프는 DAW의 MIDI 또는 간단한 직접 연주로 만든다. 생성 음악의 음정이 맞지 않으면 모티프를 억지로 겹치지 말고, 멜로디가 적은 구간을 고르거나 배경 반주와 모티프를 편집한다. 직접 만든 10~20초 참고 파일이 있다면 Audio Reference로 음색 일관성을 도울 수 있다.

### 공통 편곡 지침

- 기본 템포: 80 BPM. 모든 곡을 같은 숫자로 요청하되 결과의 박자를 실제 측정한다.
- 기본 조성: D major. 모달 분위기나 전조를 불필요하게 추가하지 않는다.
- 주 악기: felt piano, muted plucked strings, quiet woodblock, soft brushed percussion.
- 공간: 가까운 소리, 짧은 잔향. 큰 홀과 과장된 스테레오 확장은 피한다.
- 감정: 차분한 관찰, 작은 발견, 절제된 희망. 거래 성사만으로 승리 음악을 틀지 않는다.
- 멜로디: 요청서를 읽는 동안 비워 둔다. 매 2초마다 모티프를 반복하지 않는다.
- 인위적인 레코드 잡음과 오래된 테이프 흔들림을 ‘리소그래프’의 필수 표현으로 취급하지 않는다.

## 4. 파일 경로와 제작본 규칙

게임 프로젝트 루트 기준 최종 배포 경로는 `public/assets/audio/`다. 음악은 `music/`, 효과음은 `sfx/`, 환경음은 `ambience/`에 둔다. 아래 표의 이름을 자산 ID와 함께 유지한다.

- 최종 기본 파일: `.ogg`(Vorbis). 대상 브라우저 검증을 위해 동일 basename의 `.mp3` 대체 파일을 준비할 수 있다.
- 편집 마스터: 원본 다운로드 형식을 보존하고, 가능하면 48 kHz WAV 작업본을 유지한다. 손실 압축 재인코딩을 반복하지 않는다.
- 표에 있는 `.ogg`는 ElevenLabs가 그 형식을 직접 제공한다는 뜻이 아니다. 다운로드 후 변환한 배포 형식이다.
- 파일명에 한글·공백·날짜를 섞지 않는다. 후보본은 작업 폴더에서 `_take01`처럼 구분하고 최종 파일명에는 남기지 않는다.
- 미생성·미검청 파일을 빈 오디오나 다른 소리로 채워 ‘완료’로 표시하지 않는다.

## 5. 음악 5트랙: 영어 생성 프롬프트

모든 트랙은 Music의 Instrumental 옵션을 켠다. API라면 `force_instrumental: true`를 사용한다. 아래 길이는 생성 목표와 편집 납품 목표다. 음악 생성 API에 SFX용 `loop` 인자를 넣지 않는다.

| ID / 정확한 최종 파일명 | 목표 길이 | 루프 | 사용 트리거 |
|---|---:|---|---|
| `music.intro` / `music/bgm_01_intro.ogg` | 18초 | 편집 후 반복 가능 | 시작 버튼을 눌러 오디오가 활성화된 뒤 제목·프롤로그 |
| `music.plan` / `music/bgm_02_plan.ogg` | 48초 | 필수: 편집·검청 | 수요 확인, 조건 설정, 같은 기준으로 제안 비교 |
| `music.execute` / `music/bgm_03_execute.ogg` | 48초 | 필수: 편집·검청 | 납품, 품질 확인, 시범 사용과 사용자 반응 반영 |
| `music.result` / `music/bgm_04_result.ogg` | 9초 | 아니오 | 실제 사용 결과가 확정된 임무 결과 화면. 끝나면 잔잔한 환경음만 유지 |
| `music.ending` / `music/bgm_05_ending.ogg` | 24초 | 선택: 편집 후 반복 | 세 임무 뒤 마을 전체와 배운 내용 표시 |

### M01 — 인트로

```text
Create an 18-second instrumental cue for a Korean neighborhood puzzle game presented as a risograph-printed paper stage. Intimate felt piano, a dry muted plucked string, and barely audible brushed percussion. D major, approximately 80 BPM. A small four-note idea, D4 F-sharp4 A4 E4, should feel like noticing something worth caring about; leave generous silence around it. Restrained, observant and quietly hopeful, with a human-scale editorial-film sensibility. Close recording, short room ambience, soft attacks. No voice, choir, ukulele, music box, whistle, cinematic swell, tape hiss or dramatic ending. Keep the texture simple enough to edit into a short title-screen loop.
```

### M02 — 계획·비교

```text
Create a 48-second instrumental background for carefully reading requests and comparing practical options in a Korean neighborhood procurement puzzle. D major, approximately 80 BPM. Sparse felt-piano intervals, muted plucked strings, tiny dry woodblock pulses and an occasional soft brush. Patient and precise rather than sleepy or sentimental. Suggest the four-note idea D4 F-sharp4 A4 E4 only occasionally, leaving long gaps for thought. Keep a stable light texture, modest dynamics, no build, no climax and no final cadence. No vocals, humming, choir, ukulele, jazz solo, music box, heavy bass or synthetic notification sounds. A quietly rhythmic, open-ended piece suitable for a carefully edited gameplay loop.
```

### M03 — 실행·검수·시범 사용

```text
Create a 48-second instrumental companion to a restrained felt-piano planning cue. D major, approximately 80 BPM. Keep the same intimate felt piano and muted plucked strings, with a slightly clearer dry woodblock pulse and soft brushed percussion. The scene is useful objects being delivered, checked against requirements, tried by residents and improved after feedback. Convey attentive forward movement, not a race and not a victory parade. Use the four-note idea D4 F-sharp4 A4 E4 sparingly. Stable energy and harmony, soft transients, close room sound, no sharp ending. No vocals, choir, ukulele, toy-like bouncing, trailer drums, cash-register sounds or emotional crescendo. Designed for post-edited looping.
```

### M04 — 결과

```text
Create a 9-second instrumental resolution for a small public service successfully meeting a resident's real need. Intimate felt piano and one muted plucked string, D major, approximately 80 BPM. A gentle four-note phrase based on D4 F-sharp4 A4 E4, followed by a short warm harmonic resolution and a natural quiet tail. The feeling is a considered job well done, with room for reflection and user feedback. No fanfare, applause, coins, brass, choir, ukulele, sparkling bells, loud accent or spoken words. Small, clear and emotionally restrained.
```

### M05 — 엔딩

```text
Create a 24-second instrumental closing cue for a risograph paper-stage Korean neighborhood quietly coming to life. D major, approximately 80 BPM. Reprise an intimate four-note idea, D4 F-sharp4 A4 E4, on felt piano, with muted plucked strings, very soft woodblock and a light brushed texture. Allow a little more warmth than the planning music without becoming grand or sentimental. The story is listening to people, choosing suitable goods and improving a first public purchase through feedback. Clear small ensemble, short room ambience, gentle harmonic closure, a few seconds of quiet natural decay. No vocals, choir, ukulele, music box, fireworks, applause, trailer swell or heavy drums.
```

**제작 절약:** M01과 M05를 같은 원곡의 다른 구간·편곡으로 편집하면 음색을 통일하기 쉽다. M02와 M03는 서로 다른 생성물을 ‘동기화된 스템’처럼 동시에 재생하지 않는다. 실제 템포·조성·위상이 맞는지 확인되지 않았다면 두 완성 믹스 사이를 크로스페이드한다. 스템 기능이 계정에 있어도 본 키트의 필수 조건은 아니다.

## 6. 효과음 18개: 영어 생성 프롬프트

기본 설정: SFX v3, Loop off. 최초 `prompt_influence`는 0.3 부근에서 시작해 결과에 따라 조정한다. 모든 프롬프트는 그대로 붙여 넣을 수 있는 짧은 단일 행동 요청이다. 생성 길이는 최종 길이보다 여유 있게 둔다. 버튼 클릭은 무음 시작 부분을 잘라 입력 직후 들리게 만든다.

| ID / 최종 파일명(`sfx/`) | 생성 목표 → 편집 길이 | 사용 트리거 / 반복 정책 | English prompt |
|---|---|---|---|
| `ui.select` / `sfx_01_ui_select.ogg` | 1초 → 0.12~0.22초 | 실제 버튼 선택. hover에는 사용하지 않음. 80ms 중복 제한 | `A single tiny fingertip tap on thick uncoated paper resting on a desk. Dry, soft, precise and tactile, with a very short tail. Isolated one-shot, close microphone. No click from a computer mouse, no music, no voice, no room noise.` |
| `ui.cancel` / `sfx_02_ui_cancel.ogg` | 1초 → 0.15~0.3초 | 뒤로·선택 취소. 100ms 제한 | `One soft brief paper edge flick, slightly lower and gentler than a confirmation tap. Close dry recording, muted transient, short decay. Isolated one-shot. No swoosh, music, speech, alarm or background ambience.` |
| `card.open` / `sfx_03_card_open.ogg` | 1.5초 → 0.35~0.65초 | 요청·제안 카드 펼침. 200ms 제한 | `A small sheet of textured uncoated paper unfolding once, with a delicate fiber rustle and a soft landing on a desk. Intimate, dry and understated. One isolated gesture. No envelope tearing, music, speech or background noise.` |
| `card.close` / `sfx_04_card_close.ogg` | 1초 → 0.25~0.45초 | 카드 닫힘 | `One small paper card gently folding closed and settling flat. Subtle dry paper friction and a soft muted contact. Close recording, short tail, one-shot. No sharp snap, music, voice or other movement.` |
| `need.reveal` / `sfx_05_need_reveal.ogg` | 2초 → 0.6~1초 | 새로운 생활 수요 발견. 이미 본 카드에는 반복하지 않음 | `A small paper tab being pulled out, followed by one warm delicate muted string pluck. Curious and attentive rather than magical. Close, quiet, dry one-shot with a short decay. No sparkle, bells, music bed, speech or dramatic swoosh.` |
| `requirement.pin` / `sfx_06_requirement_pin.ogg` | 1초 → 0.2~0.35초 | 필수 조건 확정. 100ms 제한 | `A tiny paper clip sliding onto a stiff paper card, ending in a gentle muted tick. Clean, tactile and precise, with no harsh metal ringing. Close dry isolated one-shot. No voice, melody or ambience.` |
| `compare.open` / `sfx_07_compare_slide.ogg` | 2초 → 0.6~0.9초 | 같은 조건으로 제안 나란히 표시 | `Three thick paper cards gently sliding into an aligned row across a smooth desk, one compact continuous gesture. Soft paper friction, controlled and neat, no distinct loud impacts. Close dry sound. No music, voices or room noise.` |
| `offer.place` / `sfx_08_offer_place.ogg` | 1.5초 → 0.3~0.6초 | 비교 슬롯에 제안 배치. 150ms 제한 | `One stiff paper product card laid carefully into a shallow paper tray. A brief soft slide followed by a small muted tap. Intimate dry isolated one-shot, not wooden or plastic. No voice, music or background noise.` |
| `selection.confirm` / `sfx_09_selection_confirm.ogg` | 2초 → 0.6~0.9초 | 선정 이유까지 확인한 뒤. 아직 임무 성공 소리는 아님 | `A restrained rubber approval stamp touching an ink pad and then pressing once onto thick paper, quiet and precise. Two closely related soft contacts, no heavy thump. Close dry sound, short tail. No celebratory chime, coins, speech or music.` |
| `box.open` / `sfx_10_box_open.ogg` | 2초 → 0.8~1.3초 | 납품 상자 개봉 | `A small cardboard delivery box gently opening: light tape release and two soft cardboard flaps lifting. Careful close-up Foley, dry and human-scale. One compact gesture. No ripping explosion, packing peanuts, voice, music or background ambience.` |
| `furniture.deploy` / `sfx_11_furniture_deploy.ogg` | 3초 → 1~1.8초 | 테이블 다리·책상 지지부·그늘막 받침을 펼쳐 고정하는 공통 동작. 한 번, 건너뛰면 페이드 | `A compact folding support leg gently opening and locking into place, followed by one soft grounded contact. Low, muted mechanical friction, careful human-scale handling, no bright metal ringing. One close dry gesture. No motor, voice, music, wheels, alarm or dramatic impact.` |
| `inspection.pass` / `sfx_12_inspection_pass.ogg` | 2초 → 0.45~0.8초 | 납품물의 필수 조건 확인 통과. 항목마다 난사하지 않음 | `A small measuring tool softly closing, followed by one warm low muted pluck. Clear and reassuring, careful workmanship rather than celebration. Close dry isolated one-shot with a short tail. No bright bell, alarm, voice, melody bed or ambient sound.` |
| `inspection.recheck` / `sfx_13_inspection_recheck.ogg` | 1.5초 → 0.35~0.7초 | 조건 불일치·다시 살펴보기. 같은 경고 600ms 제한 | `Two very soft low fingertip taps on a thick paper folder, inviting a second look. Gentle, non-punitive, dry and subdued, with no sharp attack. Short isolated one-shot. No error buzzer, alarm, descending cartoon whistle, voice or music.` |
| `user.feedback` / `sfx_14_user_feedback.ogg` | 2초 → 0.7~1초 | 시범 사용 후 주민 피드백 카드 도착 | `A handwritten paper note being placed carefully on a desk, followed by a single quiet questioning muted-string pluck. Thoughtful and human, a little open-ended. Close dry one-shot. No speech, notification beep, sparkle or background music.` |
| `pilot.improve` / `sfx_15_pilot_improve.ogg` | 2초 → 0.8~1.3초 | 사용자 피드백에 맞춰 개선안 반영 | `A short gentle pencil revision on textured paper, then a neat paper card sliding into place and a quiet reassuring pluck. Compact, tactile and understated. Close dry one-shot, soft high frequencies. No scribbling frenzy, voice, music bed or celebratory bells.` |
| `facility.activate` / `sfx_16_facility_activate.ogg` | 3초 → 1.2~1.8초 | 검수·사용 확인을 마친 시설이 활동 상태로 전환 | `A restrained paper-stage transformation: two light layers of card shifting into place, a soft press-roller movement, and one warm sustained muted chord. Human-scale and quietly satisfying, not magical. Short dry tail. No fireworks, sparkle cascade, voice or loud impact.` |
| `mission.complete` / `sfx_17_mission_complete.ogg` | 4초 → 약 3초 | 결과 음악을 생략하는 짧은 완료 화면 전용. M04와 동시 재생 금지 | `A small instrumental acknowledgement on dry felt piano with a muted plucked string: D4, F-sharp4, A4, E4, played gently as one short phrase with a natural tail. Quietly satisfied and reflective, no fanfare. No vocals, bells, applause, percussion roll, bass drop or background ambience.` |
| `session.reset` / `sfx_18_reset_paper.ogg` | 2초 → 0.5~0.9초 | 사용자가 임무 다시 시작을 확정 | `A small stack of thick paper cards being neatly gathered and squared once on a desk. Light dry friction, one muted tap, modest volume. One compact close-up Foley gesture. No shuffling frenzy, voice, music or background ambience.` |

SFX 17의 음표는 생성 결과를 검청하고 필요하면 직접 만든 모티프로 교체한다. SFX 07의 ‘세 장’도 정확한 이벤트 수를 보장하지 않는다. 화면과 정확히 맞아야 한다면 카드 한 장 소리를 편집기로 세 번 배치한다.

선택적 변형본: `sfx_01_ui_select_b.ogg`, `sfx_03_card_open_b.ogg`, `sfx_08_offer_place_b.ogg`. 원본과 비슷한 음량으로 맞추고 무작위로 고르되, 사용자가 상태를 구분해야 하는 소리의 의미를 바꾸지 않는다.

## 7. 환경음 4개: 시설이 일상으로 돌아오는 소리

SFX에서 생성한다. 요청 길이 30초, Loop on을 사용하되 실제 무봉합 반복을 반드시 검청한다. 루프 중간에 뚜렷한 사건이나 알아들을 수 있는 대사가 있으면 쉽게 반복이 드러나므로 제외한다. 최종 길이는 편집 후 20~30초 범위에서 정하고 매니페스트에 실제 값을 기록한다.

| ID / 정확한 최종 파일명 | 사용 트리거 | English prompt |
|---|---|---|
| `ambience.library` / `ambience/amb_01_library.ogg` | 도서관의 오전 독서·오후 모임 공간 선택. 전환 장면에만 SFX 11을 별도로 사용 | `A quiet small neighborhood library activity space: soft room air and occasional faint paper handling, pages and worksheets resting on tables. Warm and occupied without voices. Even understated texture, no distinct repeating actions, carts, wheels, music, announcements, alarms or footsteps. Natural short room acoustics, suitable for a seamless ambience loop.` |
| `ambience.school` / `ambience/amb_02_school.ogg` | 높이가 맞는 책상을 사용하는 학교 장면 | `A calm small classroom during quiet independent work, with low room air, faint pencil writing and subtle paper movement on desks. No intelligible speech, no children calling, no school bell or public-address system. Gentle, safe and unobtrusive, not empty or eerie. A steady natural atmosphere for a seamless loop, no music or sudden events.` |
| `ambience.community` / `ambience/amb_03_community_center.ogg` | 주민센터 선택·시범 사용·사용자 반응 장면 | `A small neighborhood community-center activity room, soft ventilation, faint distant paper handling and very gentle fabric movement. Quiet human presence without any voices or recognizable conversation. Neutral, welcoming and practical. No music, PA announcements, phone rings or sharp sounds. Stable low-detail texture for a seamless ambience loop.` |
| `ambience.park` / `ambience/amb_04_park.ogg` | 공원 선택·마을 마무리 장면 | `A modest urban neighborhood park in mild afternoon weather: soft leaves, gentle air and a very distant neutral city hush. Sparse subtle birds far away, with no memorable repeating calls. No speech, dogs, playground screams, sirens or music. Quiet and unromantic, steady natural texture suitable for a seamless ambience loop.` |

네 시설이 지도에 보인다고 네 루프를 모두 켜지 않는다. 기본은 현재 선택한 시설 한 개이며, 다른 시설로 전환할 때 1~2초에 걸쳐 교체한다. 전체 지도에서는 공원 환경음을 아주 낮게 사용하거나 무음에 가깝게 둔다. 시설 주변의 방향감은 장식적 효과이며, 방향을 듣지 못해도 진행에 지장이 없어야 한다.

## 8. 생성·선별·후편집 순서

1. **처음에는 M02, SFX 01·03·12·13, 도서관 환경음만 생성한다.** 첫 임무에 넣어 과도하게 귀엽거나 부드러워 판단이 흐려지지 않는지 확인한다.
2. 각 자산은 처음에 후보 2개 정도로 시작한다. 실제 UI가 여러 변형을 함께 생성하면 그 안에서 먼저 고른다. 같은 문제를 반복 생성으로만 해결하지 않는다.
3. 소리의 의미가 맞는지, 원하지 않는 사람 목소리·노래·잡음·깨지는 고음이 있는지 먼저 검사한다.
4. 그다음 길이를 편집한다. 클릭은 시작 무음을 잘라내고, 끝에는 필요한 만큼의 잔향을 남긴다. 음악은 실제 박자를 확인한 뒤 마디 경계에 맞춰 자른다.
5. 짧은 소리는 시작·끝에 수 ms의 완만한 페이드를 넣어 잘린 파형의 클릭을 줄인다. 음악과 환경음은 장면에 맞는 반복 지점을 별도로 선정한다.
6. 환경음 루프는 꼬리와 머리를 약 0.5~2초 겹쳐 검청할 수 있다. 박자 음악에 무조건 같은 크로스페이드를 적용하면 이중 박자가 생길 수 있으므로 다른 방식으로 편집한다.
7. 최종 루프를 최소 5회 연속 재생한다. MP3 대체본도 인코더 여백 때문에 경계가 달라질 수 있어 별도로 확인한다.
8. 실제 게임에서 읽기·비교·검수·피드백·결과 전환을 모두 거친 뒤 확정한다. 헤드폰과 노트북 스피커, 모노 출력, 음소거도 확인한다.

생성 단계에서 완벽한 48초·정확한 80 BPM을 얻지 못해도 채택 가능한 소재일 수 있다. 최종 길이를 임의로 숨기지 말고 편집 결과를 메타데이터에 기록한다. 단순 타임 스트레치로 음질이 나빠지면 더 짧고 자연스러운 반복 구간을 사용한다.

## 9. 믹싱과 런타임 재생 기준

다음 수치는 이 게임의 **출발점**이며 납품 표준이나 ElevenLabs 보증이 아니다. 숫자를 맞춘 뒤에도 청감과 실제 동시 재생을 확인한다.

| 대상 | 편집·믹싱 출발점 | 런타임 초기 gain |
|---|---|---:|
| 음악 | 대략 -23~-19 LUFS-I, 과도한 리미팅 금지, true peak 약 -2 dBTP 이하 | 0.55 |
| 환경음 | 대략 -32~-27 LUFS-I부터 시작. 실제 밀도가 낮으면 수치보다 청감 우선 | 0.40 |
| UI SFX | 짧아 LUFS-I 비교가 부적절할 수 있음. 피크 약 -14~-8 dBFS부터 청감 조정 | 0.75 |
| 진행·검수 SFX | 피크 약 -12~-6 dBFS부터 시작. 경고가 성공음보다 크지 않게 | 0.70 |
| 전체 합산 | 가장 바쁜 장면에서 클리핑 없이 여유 유지. 최종 출력 목표 true peak -1 dBTP 이하 | master 0.85 |

- 실제 최종 크기는 자산 음량 × 개별 gain × 채널 slider × master다. 이 수치를 그대로 중복 적용해 지나치게 작아지면 실제 장면에서 조정한다.
- 음악은 한 번에 한 곡. 전환 동안만 두 곡을 약 1~1.5초 겹친다. 박자 동기가 확인되지 않았다면 자연스러운 문장 끝에서 전환한다.
- 결과 소리 재생 중에는 기존 음악을 약 4 dB 낮추거나 끈다. M04와 SFX 17을 함께 재생하지 않는다.
- 같은 UI 소리는 80~100ms 안에 다시 울리지 않는다. 실수 알림은 최소 600ms 간격. 동시 UI 음성 수는 3개 정도로 제한한다.
- 전달·변환 장면을 건너뛰면 연결된 효과음을 80~150ms에 걸쳐 정리한다. 다음 화면에 이전 소리가 남지 않게 한다.
- 순환 환경음은 1개를 기본으로, 교체 중만 2개. 지속적인 시설별 스테레오 이동은 필요하지 않다.
- 탭이 숨겨지면 루프를 일시정지하거나 페이드아웃한다. 돌아왔을 때 누락된 효과음을 한꺼번에 재생하지 않는다.
- 시작 버튼 또는 음향 켜기 같은 사용자 입력 후 오디오를 활성화한다. 자동 재생 실패가 게임 시작을 막지 않게 한다.
- Music / SFX / Ambience 음량과 전체 음소거를 제공하고 선택을 저장한다. 초기 볼륨은 작게 시작한다.

## 10. Claude Code 통합 계약

오디오 ID와 게임 상태를 분리한다. 게임 로직은 예를 들어 `inspection.pass`를 알리고, AudioManager가 파일 경로·gain·중복 제한을 처리한다. 파일이 빠져도 해당 이벤트의 화면·텍스트·점수 변화는 실행한다.

기계 판독용 전체 목록은 `public/assets/audio/manifest.json`에 있다. 현재는 제작 명세이므로, **`status === "verified" && exists === true`가 모두 충족된 행만 향후 로드 후보로 삼는다.** 현재 27개 행은 모두 미생성이므로 후보가 0개여야 한다. 폴더의 예정 파일명을 자동으로 preload 목록에 넣거나, 실패하는 요청을 재시도하지 않는다. 실제 음원이 편집·검청된 뒤 그 파일의 상태와 길이를 별도 갱신한다.

아래는 **구현 참고용 데이터 형태**다. 실제 자산 파일이나 구현 완료를 뜻하지 않는다.

```json
{
  "id": "inspection.pass",
  "sources": [
    "/assets/audio/sfx/sfx_12_inspection_pass.ogg",
    "/assets/audio/sfx/sfx_12_inspection_pass.mp3"
  ],
  "bus": "sfx",
  "loop": false,
  "gain": 0.7,
  "cooldownMs": 200,
  "durationSec": null,
  "loopStartSec": null,
  "loopEndSec": null,
  "status": "not_generated"
}
```

`durationSec`와 루프 지점은 최종 파일을 분석한 뒤 채운다. 루프의 실제 파일 시작·끝이 이미 맞으면 별도 구간 없이 전체 루프를 사용한다. 매니페스트에 없는 파일을 있다고 가정하거나 이름만 맞춰 임의의 음원으로 대체하지 않는다.

### 상태별 기본 매핑

| 게임 상태·행동 | 음악 | SFX·환경음 |
|---|---|---|
| 제목·프롤로그 | M01 | 첫 사용자 입력 전 무음 |
| 생활 수요 확인 | M02 | SFX 05 + 해당 시설 환경음 |
| 요구 조건 확정·비교 | M02 유지 | SFX 06~08. 같은 기준 적용은 UI 문구로 설명 |
| 선정 이유 확인 | M02 유지 | SFX 09. 결과·승리 음악을 시작하지 않음 |
| 개봉·설치·공간 전환 | M03로 전환 | SFX 10 → 11. 펼침·고정이 없는 동작에는 SFX 11을 억지로 붙이지 않음 |
| 품질 확인 | M03 유지 | SFX 12 또는 13 + 구체적인 상태 문구 |
| 첫 공공구매의 시범 사용 | M03 유지 | 환경음이 조금 선명해지고 SFX 14로 피드백 도착 |
| 사용자 의견에 맞춘 개선 | M03 유지 | SFX 15. 개선 이유와 효과는 화면에도 표시 |
| 적합한 물품이 실제 사용됨 | 음악 살짝 낮춤 | SFX 16. 큰 폭죽 없이 시설 활동이 켜짐 |
| 임무 결과 | M04 | SFX 17은 생략. 9초 뒤 환경음만 유지 가능 |
| 전체 마무리 | M05 | 공원 환경음 약하게. 다음 화면으로 넘어가면 정리 |

혁신 실증 임무에서 ‘시제품이 도착했다’만으로 완전 성공 소리를 내지 않는다. **시범 사용 → 반응 확인 → 필요한 개선 → 사용 결과**가 이어진 뒤 최종 보상을 준다. 정책 용어의 사실관계와 게임의 단순화 범위는 별도 기획 문서 기준을 따른다.

## 11. 접근성: 소리는 보완 정보

- 모든 확인·경고·새 피드백에는 텍스트와 형태 변화가 함께 있어야 한다. 색상만으로도 전달하지 않는다.
- `inspection.recheck`의 안내 예시는 “책상 높이 조절과 통로 확보 조건을 다시 확인해요”처럼 구체적으로 쓴다. “삐 소리가 나면 실패”라는 규칙은 만들지 않는다.
- 음소거 상태로 세 임무를 끝낼 수 있어야 한다. 환경음 활성화가 필수 힌트가 되지 않게 한다.
- 경고음에 갑작스러운 고음·큰 음량·반복 경보를 사용하지 않는다. 소리를 안 듣는다고 점수를 깎지 않는다.
- 소리와 함께 나오는 연출은 건너뛰기 가능. 동작 줄이기 설정이 켜졌을 때도 오디오가 짧고 자연스럽게 끝나게 한다.
- 음량 설정은 메뉴 안 깊은 곳에 숨기지 않는다. 상태를 식별하는 문자열을 읽기 쉬운 한국어로 표시한다.

## 12. 요금제·권리·출처 기록

### 생성 전에 확인할 항목

ElevenLabs의 일반 도움말은 유료 플랜의 상업 이용을 설명하지만, Music에는 별도 약관과 요금제별 사용 범위가 있다. **‘유료 구독이면 모든 매체와 기관 재사용이 자동 허용된다’고 쓰지 않는다.** 일반 도움말과 Music 표의 무료 플랜 안내도 일치하지 않는 부분이 있으므로 이 프로젝트는 무료 생성물의 배포 가능성을 가정하지 않는다. [일반 게시·상업 이용 안내](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)

2026-10-09판 Music 약관은 Indie Game과 Studio Game을 구분하고, 일반 플랜과 Enterprise의 매체 권한을 다르게 둔다. 1인 제작이라는 이유만으로 모든 조건이 충족된다고 확정하지 않는다. 공모전 제출 게임, 시연 영상, 이후 조달청의 온라인 홍보·전시·방송 등 **실제 사용할 범위**를 해당 약관과 주최 측 이용 조건에 맞춰 확인한다. 약관은 아티스트·작곡가 이름, 곡명·앨범명 등을 프롬프트에 넣는 것도 제한한다. 본 문서의 프롬프트에는 그런 참조를 쓰지 않았다. [Music Terms와 플랜별 권한 표](https://elevenlabs.io/music-terms)

- 결제 직전에 [가격·제공량 페이지](https://elevenlabs.io/pricing)와 실제 계정 화면에서 Music 생성량·다운로드·원하는 형식을 확인한다. 여기에는 가격이나 총 제작비를 확정하지 않는다.
- 본인 생성물과 별도 Marketplace 라이선스 자산을 섞어 기록하지 않는다. Marketplace를 쓴다면 그 상품의 사용 범위를 따로 확인한다.
- 이 문서는 ‘게임에 포함된 완성 음향’을 위한 계획이다. 생성 음원을 다른 사람이 재사용하는 공개 음악 라이브러리로 배포하는 계획이 아니다.
- 기관이 원본 오디오를 따로 가져가 다른 콘텐츠에 재사용하려면 그 범위도 확인한다. 확인이 필요한 상태를 전체 게임 제작의 중단 사유로 삼을 필요는 없으며, 통합·테스트는 대체 가능한 자산 구조로 진행한다.

### 자산마다 남길 기록

별도 자산대장에 다음 값을 기록한다. 이 문서와 키트에는 API 키·계정 비밀번호를 넣지 않는다.

```text
asset_id:
final_filename:
status: not_generated | generated | edited | verified
tool: ElevenLabs Music / ElevenLabs SFX / own recording
model_id:
generation_date:
plan_at_generation:
generation_or_song_id:
prompt_exact:
duration_requested_sec:
duration_delivered_sec:
reference_audio_source_and_rights:
download_original_format:
edits: trim / EQ / gain / loop edit / own MIDI motif / other
loop_points_sec:
credit_required_and_text:
terms_checked_date:
terms_url:
intended_uses_checked: game / demo video / organizer online promotion / other
proof_location:
reviewer_notes:
```

요금제 영수증, 해당 날짜의 약관, 원본 프롬프트·다운로드·편집본을 보관한다. 출처 표기는 예를 들어 “음악·효과음 제작에 ElevenLabs 사용, 기획·선별·편집은 제작자 수행”처럼 실제 작업에 맞춰 작성하되, 구체적인 필수 표기 문구가 있으면 그 조건을 우선한다. 이 단계에서 실제 작업을 아직 하지 않았다면 제작 완료 문구를 쓰지 않는다.

## 13. 오디오 완료 판정

- [ ] 음악 5개(또는 인트로·엔딩 통합 제작), SFX 18개, 환경음 4개의 상태가 자산대장에 기록돼 있다.
- [ ] 파일명과 매니페스트 경로가 일치하고, 없는 파일도 게임을 멈추지 않는다.
- [ ] 현재 미생성 27개 파일에 대한 preload·fetch·decode 요청이 0회다.
- [ ] 요청·비교·선정·검수·시범 사용·피드백·개선이 서로 다른 화면 반응과 적절한 소리로 연결된다.
- [ ] 4음 모티프는 직접 검청했으며, 음정이 다른 생성물에 무리하게 겹치지 않았다.
- [ ] 루프를 5회 반복해 이음매·리듬 밀림·반복 사건을 확인했다.
- [ ] 가장 바쁜 장면에서 음악·생활음·버튼 소리가 서로 가리지 않고 클리핑이 없다.
- [ ] 결과 음악과 완료 효과음을 중복 재생하지 않는다.
- [ ] 장면 건너뛰기·탭 전환·음소거·다시 시작 후 소리가 중첩되지 않는다.
- [ ] 헤드폰·노트북 스피커·모노·완전 음소거로 확인했다.
- [ ] 알아들을 수 있는 우발적 대사·가사·불필요한 경보·유명 선율과 혼동될 만한 구간이 없다.
- [ ] 생성 당시 요금제와 제출·홍보 사용 범위를 확인할 자료가 남아 있다.

## 공식 자료 목록

모두 2026-11-04 확인. 위 제작 수량·템포·음량·연출은 이 게임을 위한 설계안이며 서비스의 약속이 아니다.

1. [Eleven Music 기능 개요](https://elevenlabs.io/docs/overview/capabilities/music)
2. [Compose Music API](https://elevenlabs.io/docs/api-reference/music/compose)
3. [Sound Effects 기능·프롬프트 개요](https://elevenlabs.io/docs/overview/capabilities/sound-effects)
4. [Create Sound Effect API](https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert)
5. [Sound Effects 제품 사용 안내](https://elevenlabs.io/docs/eleven-creative/playground/sound-effects)
6. [콘텐츠 게시·상업 이용 도움말](https://elevenlabs.io/docs/help-center/legal/can-i-publish-the-content-i-generate-on-the-platform)
7. [Music Terms](https://elevenlabs.io/music-terms)
8. [현재 요금제](https://elevenlabs.io/pricing)
