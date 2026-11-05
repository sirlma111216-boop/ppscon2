# 프로젝트 작업 규칙

이 저장소는 《내일을 여는 상자》 게임과 그 제작 자료다. `src`에 세 임무와 엔딩까지 플레이되는 게임이 구현돼 있고, 처음의 에셋 자료실은 `#dev-assets` 주소에서만 열린다. 실제 상태는 `docs/DELIVERY_STATUS.md`, 구현하며 정한 내용은 `docs/IMPLEMENTATION_NOTES.md`에 있다.

1. 먼저 `PROMPT_CLAUDE_CODE.md`, `DESIGN.md`, `docs/GAME_SPEC.md`, `docs/IMAGE_ASSETS.md`, `docs/AUDIO_ELEVENLABS.md`, `docs/DEPLOYMENT.md`를 읽는다.
2. 사용자 수정 지시가 최우선, 게임 규칙은 GAME_SPEC, 시각 규칙은 루트 DESIGN, 실제 파일 상태는 매니페스트가 기준이다. 사용자 제공 Zapier 원본을 임의로 덮어쓰지 않는다.
3. 게임을 구현하라는 요청이면 자료실 개선으로 끝내지 않는다. 화면·판정·결과가 연결된 실제 플레이를 완성한다.
4. 현재 PNG를 활용한다. 글자와 상호작용은 DOM. 이미지·오디오 파일이 있다고 추정하지 않는다. 오디오는 현재 `not_generated`이며 생성 요청·키를 웹앱에 넣지 않는다. 음원을 받으면 `docs/AUDIO_HOOKUP.md`의 순서대로 연결한다. 게임은 `public/assets/game`의 파생본을 쓰며, 원본을 바꾸면 `npm run assets`로 다시 만든다.
5. 데이터와 순수 판정 함수를 UI에서 분리한다. 규칙 변경 시 예산·납기·기능·칸 중복·혁신 후속 작업을 검증한다.
6. 원격 저장소는 `https://github.com/sirlma111216-boop/ppscon.git`, production branch는 `main`. 기존 Cloudflare Pages Git 연결을 유지하고 두 번째 배포 파이프라인을 추가하지 않는다.
7. 빌드 전 `npm run check`, `npm test`; `npm run build`. 규칙·화면을 고치면 `scripts/e2e-playthrough.mjs`로 실제 브라우저 플레이를 다시 확인한다. 검사하지 않은 내용을 완료로 기록하지 않는다.
8. 비밀번호·토큰·개인정보가 담긴 신청서·로그를 커밋하지 않는다. AI 도구·프롬프트·선별·수정·자산 권리 기록은 남긴다.
9. 게임 배포와 공모전 접수는 다르다. 제출물은 만들되 주최 측에 보내는 접수는 사용자 지시 없이 수행하지 않는다.
