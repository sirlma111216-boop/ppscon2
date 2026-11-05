// 안내 도구의 첫 화면을 DOM으로 그린 모형. 조작할 수 없는 그림이며 뜻은 label로 전한다.
import type { OptionVisual } from '../game/types'

const MANY_MENUS = ['증명서', '전입', '복지', '여권', '세금', '주차', '교육', '행사', '대관', '민원', '분실물', '기타']
const MAIN_MENUS = ['서류 발급', '전입 신고', '복지 상담']

export function KioskScreen({ visual, improved, caption }: { visual: OptionVisual; improved: boolean; caption: string }) {
  const menuType = visual === 'kioskMenu'
  const label = improved
    ? menuType
      ? '개선한 화면: 자주 찾는 메뉴 세 개가 크게 보인다'
      : '개선한 화면: 짧은 질문 한 줄과 큰 버튼 세 개'
    : menuType
      ? '처음 화면: 작은 버튼 열두 개가 빽빽하다'
      : '처음 화면: 긴 안내 문장이 화면을 채운다'

  return (
    <figure className={`kiosk${improved ? ' is-improved' : ''}`}>
      <div className="kiosk-screen" role="img" aria-label={label}>
        {improved ? (
          <>
            <p className="kiosk-question">어떤 일로 오셨나요?</p>
            <div className="kiosk-main">
              {MAIN_MENUS.map((menu) => (
                <span key={menu}>{menu}</span>
              ))}
            </div>
            <p className="kiosk-step">{menuType ? '다른 업무 더 보기 ›' : '1 / 2 단계 · 음성 안내 켜짐'}</p>
          </>
        ) : menuType ? (
          <>
            <p className="kiosk-small">업무를 선택하세요</p>
            <div className="kiosk-grid">
              {MANY_MENUS.map((menu) => (
                <span key={menu}>{menu}</span>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="kiosk-long">
              안녕하세요. 저희 주민센터를 찾아 주셔서 감사합니다. 원하시는 업무를 처리하시려면 먼저 아래의 안내 사항을 끝까지 읽으신 다음, 해당하는 업무의 종류를
              선택하여 주시기 바랍니다.
            </p>
            <p className="kiosk-step">1 / 5 단계 · 음성 안내 켜짐</p>
          </>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  )
}
