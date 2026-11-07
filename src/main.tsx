import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.')

// 주소 끝에 #dev-assets 를 붙이면 개발용 이미지 자료실이 열린다. 게임과 스타일을 섞지 않도록 따로 불러온다.
const isGallery = window.location.hash === '#dev-assets'
window.addEventListener('hashchange', () => window.location.reload())

const Screen = isGallery
  ? lazy(() => import('./dev/AssetGallery'))
  : lazy(async () => {
      await import('./center/center.css')
      return import('./center/CenterShell')
    })

createRoot(root).render(
  <StrictMode>
    <Suspense fallback={<p style={{ padding: 24, fontFamily: 'sans-serif' }}>불러오는 중…</p>}>
      <Screen />
    </Suspense>
  </StrictMode>,
)
