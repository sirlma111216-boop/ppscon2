# 프로젝트 작업 규칙

이 저장소는 《센터장님, 다음 주는요?》(문화체육센터 육성·경영 게임)와 그 제작 자료다. 게임은 `src/center`, 그림과 소리는 `public/center`에 있다. 구현 범위와 검증 기록은 `docs/center-growth/IMPLEMENTATION_STATUS.md`, 자산의 제작·권리 기록은 `docs/center-growth/ASSET_PROVENANCE.md`와 같은 폴더의 기록 파일에 있다. 이전 게임 《내일을 여는 상자》의 소스·그림·문서는 2026-11-19에 제작자 지시로 지웠다(커밋 b132ebe까지의 이력에 남아 있다).

1. 먼저 `AGENTS.md`, `DESIGN.md`, `docs/center-growth/SPACE_AND_RENTALS.md`, `docs/center-growth/IMPLEMENTATION_STATUS.md`의 최근 항목을 읽는다.
2. 사용자 수정 지시가 최우선, 게임 규칙은 `src/center/simulation.ts`와 SPACE_AND_RENTALS, 시각 규칙은 루트 DESIGN, 실제 파일 상태는 저장소가 기준이다. 사용자가 제공한 그림·음원·공식 로고 원본을 임의로 덮어쓰지 않는다.
3. 게임을 고치라는 요청이면 문서나 자료 정리로 끝내지 않는다. 화면·판정·결과가 연결된 실제 플레이로 완성한다.
4. 글자와 상호작용은 DOM. 이미지·오디오 파일이 있다고 추정하지 않는다. 생성 요청·키를 웹앱에 넣지 않는다. 새 자산은 `public/center` 아래에 두고 제작 기록을 남긴다.
5. 데이터와 순수 판정 함수를 UI에서 분리한다. 규칙을 바꾸면 봇의 전 구간 플레이(`scripts/center-demo-play.mjs`)로 예산·평가·휴강 등 상태를 검증한다.
6. 원격 저장소는 `https://github.com/sirlma111216-boop/ppscon2.git`, production branch는 `main`. 기존 Cloudflare Pages Git 연결을 유지하고 두 번째 배포 파이프라인을 추가하지 않는다.
7. 빌드 전 `npm run check`, `npm test`; `npm run build`. 규칙·화면을 고치면 실제 브라우저 플레이(`scripts/center-ui-demo.js`)로 다시 확인한다. 검사하지 않은 내용을 완료로 기록하지 않는다.
8. 비밀번호·토큰·개인정보가 담긴 신청서·로그를 커밋하지 않는다. AI 도구·프롬프트·선별·수정·자산 권리 기록은 남긴다.
9. 게임 배포와 공모전 접수는 다르다. 제출물은 만들되(`npm run submission`) 주최 측에 보내는 접수는 사용자 지시 없이 수행하지 않는다.
