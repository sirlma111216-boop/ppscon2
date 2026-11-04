# 인계 및 배포 상태

## 실제 연결

- GitHub: [sirlma111216-boop/ppscon](https://github.com/sirlma111216-boop/ppscon), production branch `main`.
- Cloudflare Pages: [공개 이미지 자료실](https://ppscon.pages.dev/). 기존 GitHub 연결에서 `ppscon` 저장소를 선택했다.
- 빌드: 프로젝트 루트, `npm run build`, 출력 `dist`. 별도 Cloudflare 토큰을 저장소에 넣지 않는다.
- 최초 배포: 커밋 [`916e256`](https://github.com/sirlma111216-boop/ppscon/commit/916e25628814fa0b46e7a6dbdb8e5f0be4ae0b7f)에서 Cloudflare Pages가 **Deployed successfully**를 반환했다. [첫 배포 검사 기록](https://github.com/sirlma111216-boop/ppscon/runs/126466656765). 공개 주소에서도 자료실이 열리는 것을 확인했다.
- 이후 `main`에 푸시하면 Cloudflare가 자동 빌드·배포한다. GitHub Actions는 검사/빌드만 한다. 최신 배포 결과는 [저장소 커밋별 검사](https://github.com/sirlma111216-boop/ppscon/commits/main/)에서 확인할 수 있다.

## 이 버전의 실제 범위

| 항목 | 상태 |
|---|---|
| 게임 개발 프롬프트·임무 수치·판정 기준·접근성·제출 계획 | 작성 |
| 제공받은 Zapier 원본·게임용 DESIGN.md | 원본 보존, 적용 문서 작성 |
| 리소그래프 종이 무대 PNG 13장·생성 프롬프트·아틀라스 좌표 | 제공 |
| 음악5·효과음18·환경음4 | ElevenLabs 제작 프롬프트와 매니페스트 제공, 실제 음원 미생성 |
| 3개 임무 예산·일정 해 검산 | 명세 단독 검산 완료. `node scripts/verify-mission-balance.cjs`로 재실행 가능 |
| 현재 실행 웹 화면 | 이미지 자료실: 미리보기·확대·저장 |
| 게임 플레이·플레이테스트·공모전 제출 | 아직 수행 전. Claude Code 구현 단계의 작업 |
