import type { RoomId } from './simulation'
import { activityStillPath } from './activityArt.ts'

/** Operating stills include rentals; planning and unattended slots have no still. */
export function selectActivityStill({room,viewingResult,roomOpen,activeSlot,activities}:CraftActivityPreviewInput) {
  if(!viewingResult||!roomOpen||!Number.isInteger(activeSlot)||activeSlot<0||activeSlot>=5)return null
  return activities?.find(activity=>activity.room===room&&activity.slot===activeSlot&&Number.isFinite(activity.attendees)&&activity.attendees>0&&activityStillPath(activity.program))??null
}
export function selectLastActivityStill(input:Omit<CraftActivityPreviewInput,'activeSlot'>) {
  for(let activeSlot=4;activeSlot>=0;activeSlot--){const record=selectActivityStill({...input,activeSlot});if(record)return record}
  return null
}

export interface CraftActivityPreview { room:RoomId; slot:number; program:'P01'|'P02'|'P12'; attendees:number }
interface RecordedActivity { room:string; slot:number; program:string; attendees:number }
export interface CraftActivityPreviewInput { room:RoomId; viewingResult:boolean; roomOpen:boolean; activeSlot:number; activities?:readonly RecordedActivity[] }

/** Read-only visual selection: only this room's current, actually attended operating slot. */
export function selectCraftActivityPreview({room,viewingResult,roomOpen,activeSlot,activities}:CraftActivityPreviewInput):CraftActivityPreview|null {
  if(!viewingResult||!roomOpen||!Number.isInteger(activeSlot)||activeSlot<0||activeSlot>=5)return null
  const record=activities?.find(activity=>activity.room===room&&activity.slot===activeSlot
    &&(activity.program==='P01'||activity.program==='P02'||activity.program==='P12')&&Number.isFinite(activity.attendees)&&activity.attendees>0)
  return record?{room,slot:activeSlot,program:record.program as 'P01'|'P02'|'P12',attendees:record.attendees}:null
}

/** Choose a real time explicitly when entering a room or finishing the automatic tour. */
export function selectLastCraftActivity(input:Omit<CraftActivityPreviewInput,'activeSlot'>):CraftActivityPreview|null {
  for(let activeSlot=4;activeSlot>=0;activeSlot--){const record=selectCraftActivityPreview({...input,activeSlot});if(record)return record}
  return null
}
