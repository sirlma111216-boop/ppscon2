import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.')

// 개발 서버에서 주소 끝에 #dev-assets 를 붙이면 이미지 자료실이 열린다. 배포본에는 자료실과 원본 그림을 싣지 않는다.
const isGallery = import.meta.env.DEV && window.location.hash === '#dev-assets'
window.addEventListener('hashchange', () => window.location.reload())

const Screen = import.meta.env.DEV && isGallery
  ? lazy(() => import('./dev/AssetGallery'))
  : lazy(async () => {
      // The development server applies styles in the order modules finish, so there the base stylesheet is awaited first.
      if (import.meta.env.DEV) {
        await import('./center/center.css')
        return import('./center/CenterShell')
      }
      // In the published build both parts download together. The base stylesheet is still requested first,
      // so its <link> is placed first and the cascade is the same as when they loaded one after the other.
      const base = import('./center/center.css'), shell = import('./center/CenterShell')
      return Promise.all([base, shell]).then(([, module]) => module)
    })

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={<p style={{ padding: 24, fontFamily: 'sans-serif' }}>불러오는 중…</p>}>
      <Screen />
    </Suspense>
  </StrictMode>,
)
