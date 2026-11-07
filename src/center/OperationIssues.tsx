import { shortOperationReason } from './operationReason'
import { BLOCKS, PROGRAMS, ROOM_NAMES } from './simulation'
import type { SeasonReport } from './simulation'
import { won } from './currency'

export default function OperationIssues({report,forecast=false}:{report:SeasonReport;forecast?:boolean}) {
 const issues=report.operationIssues??[]
 return <section className="operation-issues" aria-label={forecast?'운영 전 확인 사항':'미운영 내역'}>
  {issues.length>0&&<><h3>{forecast?'이 일정은 일부 또는 전부 운영되지 않을 수 있어요':'편성했지만 운영하지 못한 일정'}</h3><ul>{issues.map((item,index)=><li key={index}><strong>{ROOM_NAMES[item.room]} · {BLOCKS[item.slot]} · {PROGRAMS.find(p=>p.id===item.program)?.shortName}</strong><span>{shortOperationReason(item.reason)} · {item.weeks}/13주{item.lastWeek?' · 마지막 주 포함':''}</span></li>)}</ul></>}
  {report.fixedCost!==undefined&&<p>공통 운영·시설·장비 유지비 {won(report.fixedCost)} / 계절{report.unpaidFixedCost?` · 미납 ${won(report.unpaidFixedCost)} (재정 평가에 반영)`:''}</p>}
  {Boolean(report.retiredSupportRefund)&&<p>폐지된 주말 준비 지원 계약금 {won(report.retiredSupportRefund!)} 반환{forecast?' 예정':''}</p>}
  {forecast&&<p>수업 신청 수요는 센터 전체에서 공유합니다. 주민 한 명은 주 1회 참여합니다. 정원 때문에 못 들어간 주민은 다른 가능한 수업으로 배분돼요. 칸을 늘려도 총 신청자는 늘지 않아요.</p>}
 </section>
}
