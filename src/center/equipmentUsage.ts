import { OFFERS, ROOM_DEFINITIONS } from './simulation.ts'
import type { Institution, RoomId } from './simulation.ts'

export interface EquipmentUsageItem {
  instanceId: string
  offerId: string
  name: string
  family: string
  ready: boolean
  condition: number
}

export interface RoomEquipmentUsage {
  used: number
  capacity: number
  free: number
  full: boolean
  activity: EquipmentUsageItem[]
  auxiliary: EquipmentUsageItem[]
  common: EquipmentUsageItem[]
}

/** Read-only display projection. Pending installations occupy their reserved place. */
export function getRoomEquipmentUsage(institution: Pick<Institution, 'inventory'>, room: RoomId): RoomEquipmentUsage {
  const activity: EquipmentUsageItem[] = [], auxiliary: EquipmentUsageItem[] = [], common: EquipmentUsageItem[] = []
  for (const equipment of institution.inventory) {
    if (equipment.stored) continue
    if (equipment.room !== room && equipment.room !== null) continue
    const offer = OFFERS.find(item => item.id === equipment.id)
    const item = {
      instanceId: equipment.instanceId, offerId: equipment.id,
      name: offer?.name ?? equipment.id, family: offer?.family ?? '',
      ready: equipment.ready, condition: equipment.condition,
    }
    if (equipment.room === null) common.push(item)
    else if (item.family === 'flex' || item.family === 'quiet') auxiliary.push(item)
    else activity.push(item)
  }
  const capacity = ROOM_DEFINITIONS.find(item => item.id === room)!.equipmentSlots
  return { used: activity.length, capacity, free: Math.max(0, capacity - activity.length), full: activity.length >= capacity, activity, auxiliary, common }
}
