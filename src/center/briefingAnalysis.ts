import { EVALUATION_COMPONENTS, ROOM_NAMES, BLOCKS } from './simulation.ts'
import { shortOperationReason } from './operationReason.ts'
import type { SeasonReport } from './simulation.ts'
export function seasonBriefing(report:SeasonReport) {
  const peer=report.peerComparison,mix=report.serviceMix
  let good=report.visits>0?'주민들이 실제로 이용한 시간을 쌓았어요.':'이번 계절에는 실제 이용 실적이 없어요.'
  if(report.profit>0)good='운영수지가 흑자예요. 다음 투자를 위한 여력이 생겼어요.'
  if(peer&&report.visits>peer.visits&&report.visits>0)good='실제 이용 횟수가 다른 센터 평균보다 높아요.'
  if(peer&&report.reputationChange>peer.reputationChange&&report.reputationChange>0)good='이번 계절 명성 상승 폭이 다른 센터 평균보다 커요.'
  let improve='칸을 채우는 것뿐 아니라 실제 참여와 운영 결과도 살펴야 해요.'
  let action='대관으로 비용을 확보하면서 주민 수요가 있는 수업을 함께 운영해 보세요.'
  const missed=report.operationIssues?.reduce((n,i)=>n+i.weeks,0)??0
  if(mix&&peer){
    if(mix.rentalVisits>mix.classVisits&&mix.classVisits<peer.serviceMix.classVisits){
      improve='대관 이용이 수업보다 많고, 수업 참여는 다른 센터 평균보다 적어요.'
      action='대관 일부를 수요가 있는 수업으로 바꿔 보세요. 대관은 교육 참여 실적에 포함되지 않아요.'
    }else if(mix.classVisits>0&&mix.paidClassVisits/mix.classVisits>.85&&mix.freeClassVisits<peer.serviceMix.freeClassVisits&&report.publicScore<75){
      improve='수업 참여가 유료 강좌에 집중되어 있어요. 무료 수업 참여는 다른 센터 평균보다 적어요.'
      action='유료 수업이 불리한 것은 아니에요. 수강료 부담이 있는 주민을 위한 생활안전 같은 무료 수업도 검토해 보세요.'
    }else if(report.reputationChange<peer.reputationChange){
      improve='명성 상승 폭이 다른 센터 평균보다 작아요.'
      action='수요가 남아 있는 시간에 명성 기여가 높은 수업을 배치해 보세요.'
    }else if(report.visits<peer.visits){
      improve='실제 이용 횟수가 다른 센터 평균에 못 미쳤어요.'
      action='예상 참여가 낮은 수업의 시간대와 수강료를 먼저 점검해 보세요.'
    }
  }
  if(report.profit<0){improve='이번 계절 지출이 수입보다 컸어요. 적자가 계속되면 운영 여력이 줄어요.';action='적자 수업을 모두 없애기보다 수요가 있는 대관과 수업차익이 좋은 강좌로 비용을 보완해 보세요.'}
  if(missed){
    const issue=[...(report.operationIssues??[])].sort((a,b)=>b.weeks-a.weeks)[0]
    improve=`${ROOM_NAMES[issue.room]} ${BLOCKS[issue.slot]}에 ${issue.weeks}주 휴강했어요. 사유: ${shortOperationReason(issue.reason)}.`
    action=issue.reason.includes('운영비')?'다음 계절 운영비를 먼저 남기고, 대관 수입으로 적자 공익수업의 비용을 보완하세요.':issue.reason.includes('배정')||issue.reason.includes('수요')?'휴강한 시간은 남은 신청 수요가 있는 수업이나 대관으로 바꿔 보세요.': '휴강 사유에 해당하는 설치·정비 일정을 먼저 해결하고 예상 운영 주수를 확인하세요.'
  }
  if(report.evaluation){
    const weakest=[...EVALUATION_COMPONENTS].sort((a,b)=>(100-report.evaluation!.components[b.key])*b.weight-(100-report.evaluation!.components[a.key])*a.weight)[0]
    if(report.evaluation.components[weakest.key]<95){
      improve='이번 종합평가에서 보완 여지가 가장 큰 항목은 '+weakest.label+'이에요.'
      action=({reputation:'명성 기여가 높은 수업과 시설 개선을 검토하세요. 실제 참여가 이어져야 해요.',financial:'다음 계절 운영비를 남기고, 대관과 수업 수입으로 지출을 충당할 수 있는지 확인하세요.',satisfaction:'휴강을 줄이고 장비 상태와 시설 관리를 먼저 챙겨 보세요.',publicService:'공공 신청 수요에 맞는 프로그램과 실제 수업 참여를 늘려 보세요. 유료 수업도 교육 참여에 포함돼요.'})[weakest.key]
    }
  }
  const pursuit=report.contender
  const moves={reputation:'실제 참여가 있는 명성 기여 수업을 유지하고, 운영비가 남으면 환경 개선을 검토하세요.',financial:'다음 계절 운영비를 확보하고 대관·흑자 강좌로 공익수업의 비용을 보완하세요.',satisfaction:'휴강과 장비 마모를 줄이고 안내 설비·방 관리를 챙기세요. 여유가 생기면 자주 쓰는 방부터 개선하세요.',publicService:'참여 가능한 시간과 수강료를 맞추고, 수요가 남은 주민을 위한 수업을 보완하세요. 유료 수업도 교육 실적에 포함돼요.'}
  let target='상위권은 명성·재정·주민 만족·공공서비스를 함께 챙겨야 해요.'
  if(pursuit){
    const aim=pursuit.rank>3?'3위권 진입':pursuit.rank>1?'1위 도전':'1위 유지'
    const gap=Math.max(0,(pursuit.rank>3?pursuit.thirdScore:pursuit.leaderScore)-pursuit.score)
    target=`${aim}${gap>0?` · 기준 점수까지 ${gap.toFixed(1)}점`:''}. ${moves[pursuit.priority]}`
  }
  return {good,improve,action,target,context:report.evaluation?'이번 종합평가와 같은 기간의 경쟁센터 점수에 근거한 조언이에요. 다음 순위를 보장하지는 않아요.':'운영 참고 순위는 이번 계절의 실적입니다. 최종상은 누적 종합평가로 결정되며 만족도·공공서비스도 포함돼요.'}
}
