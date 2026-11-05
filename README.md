# 내일을 여는 상자

2026 조달청 AI 게임·콘텐츠 공모전 출품을 준비하는 한국어 웹 게임입니다.
공공기관이 말한 필요를 읽고, 같은 기준으로 공급안을 비교해 고르고, 준비 일정을 맞춘 뒤, 그 물품이 동네에서 실제로 쓰이는 모습을 확인합니다.

- 임무 3개 · 시설 4곳 · 첫 플레이 10~14분 · 시간 제한 없음
- 로그인·서버·실시간 AI 호출 없음. 진행은 이 기기의 브라우저에만 저장됩니다.
- 물품·가격·일정·점수는 게임을 위한 가상의 값이며, 실제 조달 절차를 단순화했습니다.

현재 구현·검증 상태와 남은 일은 [docs/DELIVERY_STATUS.md](docs/DELIVERY_STATUS.md)에 있습니다.
**효과음·배경음악은 아직 제작 전이라 게임은 소리 없이 진행됩니다.** 음원을 넣는 방법은 [docs/AUDIO_HOOKUP.md](docs/AUDIO_HOOKUP.md)를 보세요.

## 실행

Node.js 24와 npm을 사용합니다.

```sh
npm ci
npm run dev        # 개발 서버
npm run check      # 타입 검사
npm test           # 규칙·상태·저장·그림 연결 검사
npm run build      # 타입 검사 + 빌드(dist)
npm run preview    # 빌드 결과 확인
```

실제 브라우저에서 세 임무와 엔딩까지 자동으로 플레이해 보는 점검(Chrome 또는 Edge 필요):

```sh
node scripts/e2e-playthrough.mjs --url http://localhost:4173 --out ./e2e-shots
```

원본 PNG를 바꿨다면 `npm run assets`로 게임용 파생본을 다시 만듭니다.
개발용 이미지 자료실은 주소 끝에 `#dev-assets`를 붙이면 열립니다.

## 게임의 흐름

인트로 → 생활 수요 발견 → 필수 조건 두 가지 확인 → 공급안 비교(사용 미리보기·나란히 비교표) → 선택 → 준비 일정 6칸에 배치 →
계획 검증 → 공급·설치 → 실제 이용 확인 → 결과 → 다음 임무 → 엔딩.
임무 2는 새 안내 도구를 처음 사서 써 보고, 이용 모습을 관찰해 공급자가 고친 뒤 다시 확인하는 단계가 더 있습니다.

조작은 클릭만으로 끝까지 할 수 있고, 키보드(Tab 이동, Enter·Space 선택, Esc로 창 닫기)로도 모두 할 수 있습니다.
설정에서 전체 음소거, 음악·효과음·환경음 음량, 동작 줄이기를 바꿉니다.

## 자료 위치

| 파일 | 내용 |
|---|---|
| [PROMPT_CLAUDE_CODE.md](PROMPT_CLAUDE_CODE.md) | 전체 개발 지시문, 단계별 완료 기준 |
| [DESIGN.md](DESIGN.md) | 게임에 적용하는 디자인 기준 |
| [docs/GAME_SPEC.md](docs/GAME_SPEC.md) | 3개 임무의 수치, 규칙, 정책 표현, 검산 사례 |
| [docs/IMPLEMENTATION_NOTES.md](docs/IMPLEMENTATION_NOTES.md) | 코드 구조, 구현하며 정한 내용, 검사 방법 |
| [docs/DELIVERY_STATUS.md](docs/DELIVERY_STATUS.md) | 실제로 구현·검사한 것과 남은 일 |
| [docs/AUDIO_HOOKUP.md](docs/AUDIO_HOOKUP.md) | 비어 있는 음원 27개의 경로와 연결 순서 |
| [docs/AUDIO_ELEVENLABS.md](docs/AUDIO_ELEVENLABS.md) | 음악 5곡·효과음 18개·환경음 4개 제작 프롬프트 |
| [docs/IMAGE_ASSETS.md](docs/IMAGE_ASSETS.md) | 원본 이미지 목록, 용도, 조합 방식 |
| [docs/IMAGE_DERIVATIVES.md](docs/IMAGE_DERIVATIVES.md) | 원본 PNG와 게임용 WebP 파생본의 대응표 |
| [docs/IMAGE_PROMPTS.json](docs/IMAGE_PROMPTS.json) | 이미지 생성에 사용한 프롬프트 |
| [docs/PLAYTEST_OBSERVATION.md](docs/PLAYTEST_OBSERVATION.md) | 비개발자 5명 관찰 기록지(아직 미실시) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | GitHub → Cloudflare Pages 자동 배포 설정 |
| [docs/CONTEST_AND_CREDITS.md](docs/CONTEST_AND_CREDITS.md) | 공모전 기준, 제출물, 출처·AI 활용 기록 |
| [docs/references/DESIGN-zapier.md](docs/references/DESIGN-zapier.md) | 사용자가 제공한 원본 스타일 파일 |

## 저장소와 배포

- 저장소: https://github.com/sirlma111216-boop/ppscon
- 배포 방식: Cloudflare Pages의 Git 연동, `main`, 빌드 `npm run build`, 출력 `dist`
- GitHub Actions: 타입 검사·테스트·빌드 확인만 수행합니다. Cloudflare와 중복 배포하지 않습니다.

공모전 응모, 음원 생성, 개인정보가 있는 신청서의 공개 업로드는 이 저장소의 작업에 포함되지 않습니다.
