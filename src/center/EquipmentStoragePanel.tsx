import { OFFERS, ROOM_NAMES, roomSupportsOffer } from './simulation'
import type { GameState, RoomId } from './simulation'
import Icon from './Icon'

interface Props {
  game: GameState
  room: RoomId
  canEdit: boolean
  onMove: (instanceId: string, room: RoomId) => void
  onStore: (instanceId: string) => void
  onReinstall: (instanceId: string, room: RoomId) => void
}

export default function EquipmentStoragePanel({ game, room, canEdit, onMove, onStore, onReinstall }: Props) {
  const installed = game.player.inventory.filter(item => !item.stored && item.room === room)
  const stored = game.player.inventory.filter(item => item.stored)
  return <div className="equipment-management">
    <div className="equipment-section-heading"><strong>이 방의 장비</strong><span>{installed.length}개</span></div>
    {!installed.length && <p className="equipment-empty">아직 설치한 장비가 없어요.</p>}
    {installed.map(item => {
      const offer = OFFERS.find(value => value.id === item.id)!
      const targets = game.player.rooms.filter(value => value.open && value.id !== room && roomSupportsOffer(value.id, item.id))
      return <div key={item.instanceId} className="gear-detail">
        <div className="gear-identity"><strong>{offer.name}</strong><span>{item.ready ? `상태 ${Math.round(item.condition)}` : '설치 대기'}</span></div>
        <div className="gear-actions">
          <select aria-label={`${offer.name} 옮길 방`} value="" disabled={!canEdit || !item.ready || !targets.length} onChange={event => onMove(item.instanceId, event.target.value as RoomId)}>
            <option value="" disabled>다른 방 이전 · 8점</option>
            {targets.map(target => <option key={target.id} value={target.id}>{ROOM_NAMES[target.id]}</option>)}
          </select>
          <button className="secondary-button" disabled={!canEdit || !item.ready} onClick={() => onStore(item.instanceId)} title="자리를 비우고 장비를 창고에 보관합니다. 유지비는 계속 발생합니다."><Icon name="box" size={13} />보관 · 8점</button>
        </div>
      </div>
    })}
    <section className="equipment-storage" aria-label="센터 장비 창고">
      <div className="equipment-section-heading"><strong><Icon name="box" size={14} />센터 장비 창고</strong><span>{stored.length}개</span></div>
      <p className="equipment-storage-note">보관 중에도 유지비 발생 · 재설치 후 다음 계획부터 사용</p>
      {!stored.length && <p className="equipment-empty">장비를 보관하면 여기에서 다시 설치할 수 있어요.</p>}
      {stored.map(item => {
        const offer = OFFERS.find(value => value.id === item.id)!
        const targets = game.player.rooms.filter(value => value.open && roomSupportsOffer(value.id, item.id))
        return <div key={item.instanceId} className="gear-detail">
          <div className="gear-identity"><strong>{offer.name}</strong><span>상태 {Math.round(item.condition)}</span></div>
          <small className="stored-maintenance">유지비 {offer.maintenance}점/계절</small>
          <select aria-label={`${offer.name} 재설치할 방`} value="" disabled={!canEdit || !targets.length} onChange={event => onReinstall(item.instanceId, event.target.value as RoomId)}>
            <option value="" disabled>{targets.length ? '재설치할 방 선택 · 8점' : '재설치 가능한 열린 방 없음'}</option>
            {targets.map(target => <option key={target.id} value={target.id}>{ROOM_NAMES[target.id]}</option>)}
          </select>
        </div>
      })}
    </section>
  </div>
}
