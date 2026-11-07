import Icon from './Icon'
import './ProcurementHeader.css'

interface ProcurementHeaderProps {
  service: 'shopping' | 'facility'
  location: string
  guide: string
  onClose: () => void
}

/** Shared presentation only. Transactions remain inside the game simulation. */
export default function ProcurementHeader({ service, location, guide, onClose }: ProcurementHeaderProps) {
  const shopping = service === 'shopping'
  return <div className="procurement-portal-header">
    <div className="procurement-utility"><span className="procurement-game-badge">게임 속 조달 화면</span><span className="procurement-account-name">수요기관 · 늘봄 문화체육센터</span><button onClick={onClose}>센터로 돌아가기 <Icon name="arrow" size={13} /></button></div>
    <header className="procurement-brandbar"><img className="procurement-official-logo" src="/center/official/pps-logo-horizontal.jpg" alt="조달청" /><div className="procurement-service-name"><strong>나라장터{shopping && <span>쇼핑몰</span>}</strong><small>{shopping ? '물품 구매' : '시설공사'} · 수요기관 업무</small></div><span className="procurement-service-tag">{shopping ? '계약상품 조회' : '공고 · 계약 관리'}</span></header>
    <div className="procurement-location" aria-label="현재 업무 위치"><Icon name="home" size={13} /><span>나라장터</span><Icon name="arrow" size={10} /><span>{shopping ? '쇼핑몰' : '시설공사'}</span><Icon name="arrow" size={10} /><strong>{location}</strong></div>
    <div className="procurement-guide"><img src="/center/official/nareumi-dari-3d.webp" alt="조달청 캐릭터 나르미와 달이" /><div><span>나르미·달이의 조달 메모</span><p>{guide}</p></div></div>
  </div>
}
