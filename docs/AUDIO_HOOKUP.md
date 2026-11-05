# 음원 연결 안내 — 지금 비어 있는 27개

작성: 2026-11-05. 게임은 음원이 하나도 없어도 끝까지 진행된다. 이 문서는 나중에 음원 파일을 받았을 때
**어디에 어떤 이름으로 넣고, 무엇을 고치면 소리가 나는지**를 적은 인계 목록이다.
제작 프롬프트와 편집 기준은 [AUDIO_ELEVENLABS.md](AUDIO_ELEVENLABS.md), 원본 명세는
[오디오 매니페스트](../public/assets/audio/manifest.json)에 있다.

## 현재 상태

- 연결된 음원: **0 / 27**. 설정 창의 ‘소리’ 항목에도 같은 숫자가 보인다.
- 게임은 매니페스트만 읽고, 준비되지 않은 음원 경로에는 요청을 보내지 않는다
  (`scripts/e2e-playthrough.mjs`가 실제 브라우저에서 확인한다).
- 임의의 공개 음악이나 대체 효과음은 넣지 않았다.

## 음원을 넣는 순서

1. 편집·검청을 마친 파일을 아래 표의 경로에 **같은 파일 이름**으로 넣는다.
2. `public/assets/audio/manifest.json`에서 해당 항목을 고친다.
   - `"exists": true`
   - `"status": "verified"`
   - `"actual_duration_seconds"`에 실제 길이, 반복 음원은 `"loop_verified": true`
3. 같은 파일 위쪽의 `runtime_policy`에서 `"allow_audio_fetch_for_current_manifest": true`로 바꾼다
   (필요하면 `audio_files_provided`, `current_loadable_asset_count`도 실제 값으로 맞춘다).
4. `npm test`를 실행한다. `tests/persistence.test.ts`의 ‘현재 오디오 매니페스트에서는 어떤 음원도 불러오지 않는다’는
   음원이 0개라는 현재 상태를 고정한 검사이므로, 음원을 넣은 뒤에는 기대 숫자를 실제 연결 수로 고친다.
5. 브라우저에서 설정 창의 ‘음원 n / 27개가 연결돼 있어요’와 실제 소리를 확인한다.

세 조건(파일 있음 · 검청 완료 · 불러오기 허용)이 모두 맞는 항목만 재생된다. 일부만 준비됐다면 준비된 것만 소리가 나고
나머지는 조용히 건너뛴다. 코드는 고칠 필요가 없다. 판정은 `src/audio/manifest.ts`, 재생은 `src/audio/AudioManager.ts`에 있다.

## 파일 목록과 게임 속 재생 위치

### 음악 5

| ID | 넣을 경로 | 반복 | 목표 길이 | 재생되는 곳 |
|---|---|---|---|---|
| `music.intro` | `public/assets/audio/music/bgm_01_intro.ogg` | 예 | 18초 | 첫 화면(첫 입력 뒤) |
| `music.plan` | `public/assets/audio/music/bgm_02_plan.ogg` | 예 | 48초 | 임무 전환, 요구 확인·비교·일정 계획 |
| `music.execute` | `public/assets/audio/music/bgm_03_execute.ogg` | 예 | 48초 | 공급·설치·관찰·이용 확인 |
| `music.result` | `public/assets/audio/music/bgm_04_result.ogg` | 아니오 | 9초 | 임무 결과 화면 |
| `music.ending` | `public/assets/audio/music/bgm_05_ending.ogg` | 아니오 | 24초 | 엔딩 |

화면이 바뀌면 0.7초 동안 서로 겹쳐 바뀐다.

### 효과음 18

| ID | 넣을 경로 | 목표 길이 | 재생되는 곳 |
|---|---|---|---|
| `ui.select` | `public/assets/audio/sfx/sfx_01_ui_select.ogg` | 0.12~0.22초 | 시설·작업·다음 버튼 선택 |
| `ui.cancel` | `public/assets/audio/sfx/sfx_02_ui_cancel.ogg` | 0.15~0.3초 | 지도로 돌아가기, 선택 취소, 일정에서 빼기 |
| `card.open` | `public/assets/audio/sfx/sfx_03_card_open.ogg` | 0.35~0.65초 | 사용 미리보기 열기 |
| `card.close` | `public/assets/audio/sfx/sfx_04_card_close.ogg` | 0.25~0.45초 | 나란히 비교표 닫기 |
| `need.reveal` | `public/assets/audio/sfx/sfx_05_need_reveal.ogg` | 0.6~1초 | 시설의 요청을 처음 열 때(같은 시설은 한 번만) |
| `requirement.pin` | `public/assets/audio/sfx/sfx_06_requirement_pin.ogg` | 0.2~0.35초 | 계획 확정 |
| `compare.open` | `public/assets/audio/sfx/sfx_07_compare_slide.ogg` | 0.6~0.9초 | 나란히 비교표 열기 |
| `offer.place` | `public/assets/audio/sfx/sfx_08_offer_place.ogg` | 0.3~0.6초 | 일정 칸에 작업 놓기(문제없을 때) |
| `selection.confirm` | `public/assets/audio/sfx/sfx_09_selection_confirm.ogg` | 0.6~0.9초 | 조건을 충족하는 안 선택 |
| `box.open` | `public/assets/audio/sfx/sfx_10_box_open.ogg` | 0.8~1.3초 | 실행: 납품 |
| `furniture.deploy` | `public/assets/audio/sfx/sfx_11_furniture_deploy.ogg` | 1~1.8초 | 실행: 설치 시작(작업마다 한 번) |
| `inspection.pass` | `public/assets/audio/sfx/sfx_12_inspection_pass.ogg` | 0.45~0.8초 | 실행: 기관의 설치 확인 |
| `inspection.recheck` | `public/assets/audio/sfx/sfx_13_inspection_recheck.ogg` | 0.35~0.7초 | 부적격 안 선택, 일정 문제, 확정할 수 없을 때, 맞지 않는 개선 선택 |
| `user.feedback` | `public/assets/audio/sfx/sfx_14_user_feedback.ogg` | 0.7~1초 | 임무 2: 사용 관찰 패널 등장 |
| `pilot.improve` | `public/assets/audio/sfx/sfx_15_pilot_improve.ogg` | 0.8~1.3초 | 임무 2: 맞는 개선 선택, 개선·재확인 단계 |
| `facility.activate` | `public/assets/audio/sfx/sfx_16_facility_activate.ogg` | 1.2~1.8초 | 이용 확인 장면 시작 |
| `mission.complete` | `public/assets/audio/sfx/sfx_17_mission_complete.ogg` | 약 3초 | **지금은 쓰지 않음.** 결과 화면에는 `music.result`가 나오며 둘을 함께 재생하지 않는다 |
| `session.reset` | `public/assets/audio/sfx/sfx_18_reset_paper.ogg` | 0.5~0.9초 | 임무 다시 계획, 새 게임 |

같은 효과음은 매니페스트에 적힌 간격(예: 선택 80ms, 다시 살펴보기 600ms)보다 빨리 거듭 나지 않는다. hover에는 소리를 쓰지 않는다.

### 환경음 4

| ID | 넣을 경로 | 반복 | 목표 길이 | 재생되는 곳 |
|---|---|---|---|---|
| `ambience.library` | `public/assets/audio/ambience/amb_01_library.ogg` | 예 | 20~30초 | 도서관 장면을 볼 때 |
| `ambience.school` | `public/assets/audio/ambience/amb_02_school.ogg` | 예 | 20~30초 | 학교 장면을 볼 때 |
| `ambience.community` | `public/assets/audio/ambience/amb_03_community_center.ogg` | 예 | 20~30초 | 주민센터 장면을 볼 때 |
| `ambience.park` | `public/assets/audio/ambience/amb_04_park.ogg` | 예 | 20~30초 | 공원 장면을 볼 때 |

## 이미 구현된 동작

- 첫 클릭·키 입력 뒤에만 오디오를 시작한다. 브라우저가 재생을 막아도 게임은 그대로 진행된다.
- 설정에서 전체 음소거와 음악·효과음·환경음 음량을 따로 조절하고, 값은 이 기기에 저장된다. 새 게임을 해도 지워지지 않는다.
- 탭을 숨기면 음악·환경음을 멈추고 돌아오면 이어서 재생한다.
- 소리로만 전하는 정보는 없다. 경고·완료·선택 결과는 모두 화면의 글과 표시로도 보인다.

## 음원을 받은 뒤 남는 검증

음원이 없는 지금은 아래를 확인할 수 없었다. 파일을 넣은 뒤 직접 들어 보며 확인한다.

- [ ] 반복 음악·환경음의 이음매, 화면 전환 때의 겹침이 자연스러운가
- [ ] 효과음이 겹칠 때 갑자기 커지거나 찢어지지 않는가(음량 기본값: 음악 60%, 효과음 80%, 환경음 50%)
- [ ] 음소거·음량 조절이 재생 중에도 바로 반영되는가
- [ ] OGG를 재생하지 못하는 브라우저(예: 일부 Safari)에서 소리 없이도 문제없이 진행되는가, MP3 대체본이 필요한가
