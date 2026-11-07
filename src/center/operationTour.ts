import { BLOCKS, ROOM_IDS } from './simulation.ts'
import type { RoomId } from './simulation.ts'
export interface OperationFrame {room:RoomId;slot:number}
/** Presentation only: never advances the season or modifies the simulation. */
export function buildOperationTour(rooms:{id:RoomId;open:boolean}[]):OperationFrame[] {
 return ROOM_IDS.filter(id=>rooms.some(room=>room.id===id&&room.open))
  .flatMap(room=>BLOCKS.map((_,slot)=>({room,slot})))
}
