# Cloudflare Pages 배포 안내

공식 문서 확인일: 2026-11-04. 대상 저장소는 [sirlma111216-boop/ppscon](https://github.com/sirlma111216-boop/ppscon)이다. 이 문서는 Claude Code가 개발할 React + TypeScript + Vite 정적 게임과 그 개발 인계용 화면을 같은 저장소에서 배포하기 위한 설정이다. 초기 인계 화면이 배포되더라도 게임 완성을 뜻하지 않는다.

**이 저장소는 Cloudflare Pages에 이미 연결했다.** [실제 연결과 첫 배포 확인 기록](DELIVERY_STATUS.md)을 참고하고 새 프로젝트를 중복 생성하지 않는다. 아래는 연결 복구·인계를 위한 설정이다. 실제 연결 상태는 Cloudflare 프로젝트의 연결 저장소, 배포 기록, 커밋 SHA, 공개 URL을 확인해 판단한다. 기존 저장소와 프로젝트를 먼저 확인하고 재사용한다. 새 GitHub 저장소, 별도 게임 앱, 중복 Pages 프로젝트를 임의로 만들지 않는다.

## 1. 권장 경로: Cloudflare의 기본 GitHub 연동

한 번 GitHub 접근을 승인하고 Pages 프로젝트에 저장소를 연결하면, 이후 지정 브랜치에 push할 때 Cloudflare가 빌드와 배포를 실행한다. 이 경로에는 GitHub Secrets의 Cloudflare API 토큰이나 배포용 GitHub Actions가 필요 없다. 검증만 수행하는 CI는 함께 사용해도 된다. [공식 Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)

### 저장소와 빌드 기준

kit의 **내용물**이 저장소 루트에 들어가는 구성을 기준으로 한다. `package.json`, `package-lock.json`, `index.html`, `.node-version`, `src/`, `public/`, `docs/`가 같은 루트에 위치한다. 로컬 전달 폴더 이름인 `outputs/ppscon-kit`는 Cloudflare의 Root directory 값이 아니다.

| 설정 | 값 |
| --- | --- |
| 연결할 저장소 | `sirlma111216-boop/ppscon` |
| 운영 브랜치 | `main` |
| Framework preset | 실제 연결은 `None` + 빌드 명령·출력 폴더 직접 지정. `React (Vite)` 프리셋도 같은 두 값을 사용 |
| Root directory | 비워 둠: 저장소 루트 |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node 버전 | 저장소 루트 `.node-version`의 `24` |
| 운영 자동 배포 | 활성화 |
| Preview branch | 필요할 때 사용. 작업 브랜치 배포는 운영과 분리 |

React(Vite)의 공식 설정은 `npm run build`와 `dist`이다. 나중에 앱을 하위 폴더로 옮기면 Root directory도 함께 수정해야 한다. [Cloudflare 빌드 설정](https://developers.cloudflare.com/pages/configuration/build-configuration/)

Node 24는 확인일 기준 지원 중인 LTS 계열이다. 로컬·CI·Pages를 24 계열로 맞춘다. 이 문서에서는 설치 검증하지 않은 특정 패치 버전을 고정하지 않는다. 재현성을 더 엄격히 관리할 때는 실제 검증한 패치 버전으로 세 환경을 함께 고정한다. [Node 공식 릴리스 상태](https://nodejs.org/en/about/previous-releases)

Pages는 `.node-version` 또는 `NODE_VERSION` 빌드 환경변수로 Node를 지정할 수 있다. 기본 설치 버전에 의존하지 않는다. 대시보드에 `NODE_VERSION`이 별도로 있다면 `.node-version`과 같은 값으로 맞춘다. v3 빌드 환경은 `package.json`의 `engines`만으로 Node 버전을 선택하지 않는다. [Cloudflare 빌드 이미지](https://developers.cloudflare.com/pages/configuration/build-image/)

### 최초 연결 순서

1. 위 저장소의 기존 파일과 브랜치를 확인하고, 루트의 Vite 앱이 빌드되는 상태로 커밋한다. 기존 코드를 덮어쓰거나 이력을 초기화하지 않는다.
2. Cloudflare의 **Workers & Pages**에서 이 저장소에 연결된 Pages 프로젝트가 있는지 확인한다. 있으면 그 프로젝트의 설정을 수정한다.
3. 아직 없다면 Pages의 Git 연결 흐름을 선택한다. GitHub 연동 승인이 필요한 경우 지정 저장소에 접근할 수 있게 승인한다. 이 단계를 Direct Upload나 Workers 배포와 혼동하지 않는다.
4. 위 표대로 설정하고 최초 배포를 실행한다. 계정 선택·GitHub 승인·프로젝트 설정은 실제 사용자 계정에서 완료되어야 한다.
5. 배포 성공 뒤 표시된 실제 `pages.dev` URL을 연다. 프로젝트 이름만 보고 URL을 추측하지 않는다. 배포 기록의 커밋 SHA가 GitHub `main`의 대상 커밋과 같은지 확인한다.
6. 이후 `main` push 또는 PR merge로 생긴 새 커밋이 새 운영 배포를 만드는지 확인한다. 운영 자동 배포가 꺼져 있으면 push만으로는 배포되지 않는다.

공식 흐름: [Git 연동 시작하기](https://developers.cloudflare.com/pages/get-started/git-integration/), [브랜치별 배포 제어](https://developers.cloudflare.com/pages/configuration/branch-build-controls/).

## 2. Claude가 지켜야 할 정적 앱 규칙

### 경로와 SPA 새로고침

- 기본 Pages 도메인의 루트에 서비스하므로 Vite `base`는 기본값 `/`를 사용한다. GitHub 저장소 이름 때문에 `/ppscon/`로 바꾸지 않는다. `src`에서 가져오는 자산은 import로 관리하고, `public` 자산은 배포 기준 경로를 일관되게 사용한다. [Vite base](https://vite.dev/config/shared-options.html#base)
- 현재처럼 한 화면 안에서 게임 상태를 바꾸는 앱에는 별도 URL 라우팅이 없어도 된다. 실제로 `/play` 같은 클라이언트 경로를 추가했다면 그 주소를 직접 열고 새로고침해서 확인한다.
- Pages는 최상위 `404.html`이 없으면 존재하지 않는 정적 경로에 기본 SPA 처리를 제공한다. 이 정적 게임은 이 동작을 기본으로 사용한다. 무조건적인 `/* /index.html 200` 규칙을 추가할 필요는 없다. [Pages SPA 처리](https://developers.cloudflare.com/pages/configuration/serving-pages/)
- 별도 리디렉션이 필요할 때만 `public/_redirects`에 작성하고 빌드 결과 `dist/_redirects`를 확인한다. JS·이미지·오디오 요청까지 HTML로 보내는 규칙을 피한다. 자산 요청의 응답 형식과 본문도 확인한다. [Pages redirects](https://developers.cloudflare.com/pages/configuration/redirects/)
- Cloudflare에는 `dist`를 정적으로 서비스한다. `vite preview`는 로컬 빌드 확인용이며 운영 서버 명령이 아니다. 기본 Git 연동에서는 배포를 위해 Wrangler 파일이나 Cloudflare Vite 플러그인을 추가할 필요가 없다. [Vite 정적 배포](https://vite.dev/guide/static-deploy.html#cloudflare-pages)

### 그래픽·음향 자산

Pages의 파일당 한도는 **25 MiB**, Free 플랜의 사이트 파일 수 한도는 **20,000개**이다. Free 플랜은 월 500회 빌드, 계정당 동시 빌드 1개이며 빌드는 20분에 시간 초과된다. 실제 계정 플랜과 변경된 한도는 출시 전에 다시 확인한다. [Pages 한도](https://developers.cloudflare.com/pages/platform/limits/)

원본 PSD, 무압축 장시간 WAV, 제작용 대형 스프라이트 원본, 심사용 MP4를 `public`에 넣지 않는다. 게임에 쓰는 최적화된 자산만 배포한다. 큰 배경·음악은 압축하거나 나누고 필요한 시점에 읽는다. 25 MiB를 넘는 파일은 먼저 최적화한다. 별도 저장소가 정말 필요한 경우에만 R2 등 외부 자산 호스팅을 검토한다. CDN 업로드 성공과 첫 화면 로딩 속도는 별개의 문제다.

배경음은 페이지 로드 직후 자동 재생에 의존하지 않는다. **시작하기 또는 소리 켜기 버튼의 사용자 동작에서 오디오를 활성화**하고, 재생 거부를 처리하며, 음소거·볼륨 선택을 제공한다. 소리가 재생되지 않아도 게임 진행은 가능해야 한다. 브라우저의 자동 재생 제한을 배포 실패로 오인하지 않는다. [MDN 자동 재생 안내](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay)

### 환경변수와 키

이 게임은 제작 과정에서 AI로 만든 자산을 정적으로 제공하는 구성이며, 플레이에 생성형 AI API 호출을 필수로 두지 않는다. 정적 앱에 API 비밀키를 보관할 안전한 공간은 없다.

`VITE_`로 시작하는 환경변수는 빌드된 브라우저 코드에 노출된다. AI API 키, GitHub 토큰, Cloudflare 토큰을 넣지 않는다. 접두사를 바꾸더라도 코드를 통해 번들에 삽입하면 비밀이 아니다. `.env.local`·토큰 파일은 커밋하지 않고, `.env.example`에는 공개 가능한 예시만 둔다. 향후 서버 기능이 필요하면 별도 설계 후 서버 쪽 비밀 설정을 사용한다. [Vite 환경변수](https://vite.dev/guide/env-and-mode)

## 3. 배포 전후 확인

저장소 루트에서 실행한다. `package-lock.json`이 아직 없다면 최초 의존성 설치로 만들고 검토·커밋한 뒤 다음 흐름을 사용한다.

```sh
npm ci
npm run build
npm run preview
```

개발 서버에서만 동작하는지를 확인하는 데 그치지 말고 `dist` 기반 화면을 점검한다. `node_modules`와 로컬 `dist`는 소스 저장소에 커밋하지 않고, Cloudflare가 소스로부터 빌드하게 한다.

README에 넣을 수 있는 간단한 확인 목록:

- [ ] Node 24와 잠금 파일로 설치·빌드 성공.
- [ ] 연결 저장소가 `sirlma111216-boop/ppscon`, 운영 브랜치가 `main`인지 확인.
- [ ] 실제 Pages URL에서 화면·폰트·이미지·음향이 정상이고 콘솔 오류가 없음.
- [ ] 새로고침 및 실제로 사용하는 직접 경로 접근 정상.
- [ ] 소리 켜기·음소거·재시작 정상, 비밀키와 제작 원본이 배포물에 없음.
- [ ] 대상 커밋 SHA와 성공한 운영 배포의 SHA가 일치하며, 후속 push 자동 배포 확인.

게임 구현 후에는 위 목록에 첫 임무부터 엔딩까지 진행, 저장/초기화, 목표 화면 크기에서 조작 가능 여부를 추가한다. 자산 갤러리 검증과 게임 플레이 검증을 구분해 보고한다.

## 4. 대안: GitHub Actions로 직접 배포해야 할 때만

기본 Git 연동이 불가능하거나 별도 CI 빌드·승인 절차가 필요한 경우에만 검토한다. 이 문서는 배포용 workflow를 활성화하지 않는다.

필요한 것은 실제 Pages 프로젝트 이름과 Account ID, 해당 계정에 한정한 **Cloudflare Pages: Edit** 권한의 API 토큰, GitHub Actions Secrets의 자격증명, 빌드된 `dist`를 업로드하는 Wrangler 단계다. 운영 배포는 `main`으로 제한하고, 외부 PR에는 배포 비밀키를 제공하지 않는다. API 토큰은 코드·문서·클라이언트 환경변수에 넣지 않는다. [Cloudflare 공식 CI 배포 안내](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/)

같은 프로젝트에 **기본 Git 자동 배포와 Actions 배포를 동시에 활성화하지 않는다.** 기본 Git 방식이면 Actions는 빌드/검증만 수행한다. Actions 배포로 전환한다면 기존 Pages 자동 운영·미리보기 배포를 먼저 끄고 전환을 검증한다. Git 연동 프로젝트 유형을 Direct Upload 유형으로 바꾸는 것은 지원되지 않지만, 자동 Git 배포를 끈 뒤 Wrangler로 배포하는 방법은 공식적으로 지원된다. [Git 연동 및 자동 배포 제어](https://developers.cloudflare.com/pages/configuration/git-integration/)
