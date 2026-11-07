/** Compact player-facing labels; retain the detailed engine reason for optional disclosure. */
export function shortOperationReason(reason:string):string {
 if(reason.includes('이미 ')&&reason.includes('배정'))return '다른 수업에 배정'
 if(reason.includes('수강료'))return '수강료 초과'
 if(reason.includes('참여할 수'))return '시간대 수요 없음'
 if(reason.includes('수요')||reason.includes('신청자'))return '신청 수요 없음'
 if(reason.includes('운영비'))return '운영비 부족'
 if(reason.includes('관리상태'))return '관리상태 부족'
 if(reason.includes('설치·정비 시간'))return '설치·정비 중'
 if(reason.includes('설비')||reason.includes('장비'))return '장비·공간 조건 미충족'
 if(reason.includes('개설 한도'))return '개설 횟수 초과'
 if(reason.includes('대관으로'))return '대관으로 빈 시간 없음'
 if(reason.includes('정원'))return '정원 초과'
 if(reason.includes('개방'))return '시설 개방 필요'
 return '운영 조건 확인 필요'
}
