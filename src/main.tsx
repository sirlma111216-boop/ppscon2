import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'

const root = document.getElementById('root')
if (!root) throw new Error('앱을 표시할 영역을 찾지 못했습니다.')

const Screen = lazy(async () => {
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
