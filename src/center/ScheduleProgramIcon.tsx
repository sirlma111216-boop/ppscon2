import type { ProgramId } from './simulation'
import './ScheduleProgramIcon.css'

/** Decorative: the adjacent program/client label supplies the accessible name. */
export default function ScheduleProgramIcon({program}:{program:ProgramId}) {
  return <img className="schedule-program-icon" src={'/center/schedule-icons-v1/'+program+'.webp'} alt="" width={72} height={48} draggable={false} decoding="async" />
}
