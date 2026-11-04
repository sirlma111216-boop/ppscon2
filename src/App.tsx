import { useCallback, useEffect, useRef, useState } from 'react'

type GalleryImage = { file: string; url: string; label: string }

const labels: Record<string, string> = {
  'intro-print.png': '상자 위에 펼쳐진 우리 동네',
}

const images: GalleryImage[] = __GALLERY_FILES__.map((file) => ({
  file,
  url: `${import.meta.env.BASE_URL}assets/images/${encodeURIComponent(file)}`,
  label: labels[file] ?? file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
})).sort((a, b) => Number(b.file === 'intro-print.png') - Number(a.file === 'intro-print.png'))

function Lightbox({ index, onClose, onStep }: {
  index: number
  onClose: () => void
  onStep: (offset: number) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const image = images[index]

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
    }
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="lightbox"
      aria-labelledby="lightbox-title"
      aria-describedby="lightbox-hint"
      onCancel={(event) => { event.preventDefault(); onClose() }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose() }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault()
          onStep(event.key === 'ArrowLeft' ? -1 : 1)
        }
      }}
    >
      <div className="lightbox-content">
        <div className="lightbox-heading">
          <div>
            <p className="eyebrow">이미지 크게 보기 · {index + 1} / {images.length}</p>
            <h2 id="lightbox-title">{image.label}</h2>
          </div>
          <button className="button button-secondary" onClick={onClose} autoFocus>닫기 <span aria-hidden="true">×</span></button>
        </div>
        <div className="lightbox-image-wrap">
          <img src={image.url} alt={image.label} className="lightbox-image" />
        </div>
        <div className="lightbox-footer">
          <div>
            <p className="filename">{image.file}</p>
            <p id="lightbox-hint">좌우 방향키로 이동 · Esc로 닫기</p>
          </div>
          <div className="lightbox-actions">
            <button className="button button-secondary" onClick={() => onStep(-1)} disabled={images.length < 2} aria-label="이전 이미지">← 이전</button>
            <button className="button button-secondary" onClick={() => onStep(1)} disabled={images.length < 2} aria-label="다음 이미지">다음 →</button>
            <a className="button button-primary" href={image.url} download={image.file}>이미지 저장</a>
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default function App() {
  const [selected, setSelected] = useState<number | null>(null)
  const closeLightbox = useCallback(() => setSelected(null), [])
  const stepImage = useCallback((offset: number) => {
    setSelected((current) => current === null ? null : (current + offset + images.length) % images.length)
  }, [])
  const hero = images[0]

  return (
    <>
      <a className="skip-link" href="#main">본문으로 이동</a>
      <header className="site-header">
        <a className="wordmark" href="#main" aria-label="내일을 여는 상자 처음으로">
          <span className="wordmark-symbol" aria-hidden="true">＋</span>
          <span>내일을 여는 상자</span>
        </a>
        <a className="header-link" href="#gallery">이미지 자료실 <span aria-hidden="true">↗</span></a>
      </header>

      <main id="main" tabIndex={-1}>
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="status"><span className="status-dot" aria-hidden="true" />개발 준비 자료 · 게임 개발 전</p>
            <h1 id="hero-title">작은 선택으로,<br />동네의 내일을<br /><span>열어갑니다.</span></h1>
            <p className="hero-description">필요한 곳에, 필요한 물건이 닿는 이야기.<br />《내일을 여는 상자》의 이미지와 분위기를<br className="desktop-break" /> 한곳에 모았습니다.</p>
            <a className="button button-primary hero-cta" href="#gallery">이미지 둘러보기 <span aria-hidden="true">↓</span></a>
            <p className="hero-note">현재는 개발용 이미지 자료실입니다.<br />게임 플레이는 아직 제공되지 않습니다.</p>
          </div>
          {hero && <figure className="hero-art">
            <button className="hero-art-button" onClick={() => setSelected(0)} aria-label={`${hero.label} 크게 보기`}>
              <img src={hero.url} alt={hero.label} loading="eager" fetchPriority="high" width="1536" height="1024" />
              <span className="image-zoom">크게 보기 <span aria-hidden="true">↗</span></span>
            </button>
            <figcaption>첫 장면의 분위기 · 따뜻한 종이와 인쇄의 질감</figcaption>
          </figure>}
        </section>

        <section className="gallery-section" id="gallery" aria-labelledby="gallery-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">시각 자료 모음</p>
              <h2 id="gallery-title">상자 안의 장면들<span className="count">{images.length}</span></h2>
            </div>
            <p className="section-description">이미지를 선택하면 크게 볼 수 있습니다.<br />게임 화면에 적용하기 전의 제작 자산입니다.</p>
          </div>

          {images.length ? <div className="gallery-grid">
            {images.map((image, index) => <article className="asset-card" key={image.file}>
              <button className="asset-button" onClick={() => setSelected(index)} aria-label={`${image.label} 크게 보기`}>
                <div className="asset-preview">
                  <img src={image.url} alt="" loading="lazy" decoding="async" width="1536" height="1024" />
                  <span className="asset-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="asset-open" aria-hidden="true">↗</span>
                </div>
                <div className="asset-copy">
                  <h3>{image.label}</h3>
                  <p className="filename">{image.file}</p>
                </div>
              </button>
            </article>)}
          </div> : <p className="empty-state">이미지를 준비하고 있습니다.</p>}
        </section>
      </main>

      <footer className="site-footer">
        <div><strong>내일을 여는 상자</strong><p>우리 동네의 내일을 준비하는 작은 선택.</p></div>
        <p>개발 준비 자료<br />조달청 공모전 출품 준비 프로젝트 · 비공식</p>
      </footer>

      {selected !== null && <Lightbox index={selected} onClose={closeLightbox} onStep={stepImage} />}
    </>
  )
}
