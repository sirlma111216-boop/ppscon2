# 내일을 여는 상자

2026 조달청 AI 게임·콘텐츠 공모전을 위한 **Claude Code 개발 인계 키트**입니다. 현재 실행되는 웹 화면은 이미지 자료실이며 완성된 게임이 아닙니다. 게임 구현은 아래 프롬프트로 시작합니다.

## Claude Code에서 시작

이 저장소를 열고 다음 문장을 전달하세요.

> `CLAUDE.md`와 `PROMPT_CLAUDE_CODE.md`를 읽고, 그 문서가 지시하는 기획·디자인·에셋 명세에 따라 《내일을 여는 상자》의 완성된 게임을 구현해 주세요. 현재 자료실 화면은 개발 인계용입니다. 첫 임무를 실제로 플레이하고 검증할 수 있는 상태부터 구현한 뒤 세 임무·음향·접근성·배포 검증까지 진행하세요. 보유한 PNG 에셋을 실제 장면과 화면 전환에 사용하고, 수요 적합성·공정한 비교·혁신제품의 사용 관찰과 개선이 플레이에서 드러나게 해 주세요. 기존 GitHub/Cloudflare 연결은 유지하세요.

## 자료 위치

| 파일 | 내용 |
|---|---|
| [PROMPT_CLAUDE_CODE.md](PROMPT_CLAUDE_CODE.md) | 전체 개발 지시문, 단계별 완료 기준 |
| [DESIGN.md](DESIGN.md) | 사용자 제공 Zapier 스타일을 게임에 맞게 조정한 디자인 기준 |
| [docs/GAME_SPEC.md](docs/GAME_SPEC.md) | 3개 임무의 수치, 규칙, 정책 표현, 검산 사례 |
| [docs/IMAGE_ASSETS.md](docs/IMAGE_ASSETS.md) | 이미지 목록, 용도, 화면 배치, 조합 방식 |
| [docs/IMAGE_PROMPTS.json](docs/IMAGE_PROMPTS.json) | 실제 이미지 생성에 사용한 프롬프트 |
| [public/assets/images/manifest.json](public/assets/images/manifest.json) | 이미지 실제 크기·경로·투명도·아틀라스 좌표 |
| [docs/AUDIO_ELEVENLABS.md](docs/AUDIO_ELEVENLABS.md) | 음악 5곡·효과음 18개·환경음 4개 제작 프롬프트 |
| [public/assets/audio/manifest.json](public/assets/audio/manifest.json) | 음향 통합 명세. 실제 음원은 아직 생성되지 않음 |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | GitHub → Cloudflare Pages 자동 배포 설정 |
| [docs/CONTEST_AND_CREDITS.md](docs/CONTEST_AND_CREDITS.md) | 공모전 기준, 제출물, 출처·AI 활용 기록 |
| [docs/references/DESIGN-zapier.md](docs/references/DESIGN-zapier.md) | 사용자가 제공한 원본 스타일 파일 |

## 실행

Node.js 24와 npm을 사용합니다.

```sh
npm ci
npm run dev
npm run check
npm run build
```

현재 자료실은 `public/assets/images/`의 실제 PNG 파일을 빌드 때 자동으로 수집합니다. 이미지 생성 프롬프트·원본 PNG는 보존하고, 게임을 구현할 때 자료실을 게임 화면으로 교체합니다. 대형 원본은 게임 런타임에 전부 한 번에 내려받지 않습니다.

## 저장소와 배포

- 저장소: https://github.com/sirlma111216-boop/ppscon
- 배포 방식: Cloudflare Pages의 Git 연동, `main`, 빌드 `npm run build`, 출력 `dist`
- GitHub Actions: 타입 검사와 빌드 확인만 수행합니다. Cloudflare와 중복 배포하지 않습니다.
- 실제 연결 및 실행 결과: [docs/DELIVERY_STATUS.md](docs/DELIVERY_STATUS.md)

공모전 응모, 음원 생성, 개인정보가 있는 신청서 공개 업로드는 이 키트에 포함되지 않습니다. 공모전용 최종 ZIP·시연 영상·신청서 준비는 개발 프롬프트에 명시했습니다.
