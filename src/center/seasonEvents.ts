export interface SeasonEvent { id:string; title:string; description:string; effect:string; cash:number; reputation:number; revenueRate:number; cost:number }
export const SEASON_EVENTS:SeasonEvent[]=[
  {id:'word-of-mouth',title:'동네에 퍼진 좋은 입소문',description:'주민들이 센터의 프로그램을 주변에 소개하고 있어요.',effect:'이번 계절 운영 수입 +3% · 최대 250,000원',cash:0,reputation:0,revenueRate:.03,cost:0},
  {id:'rain',title:'비가 잦은 계절',description:'궂은 날씨로 현장 추가 이용 수입이 조금 줄어요. 승인한 예약은 유지됩니다.',effect:'이번 계절 운영 수입 −3% · 최대 250,000원',cash:0,reputation:0,revenueRate:-.03,cost:0},
  {id:'donation',title:'작은 응원금이 도착했어요',description:'지역 주민들이 센터 운영을 응원하는 소액 후원금을 보내왔어요.',effect:'이번 계절 결산 때 후원금 +200,000원 · 받은 돈은 유지',cash:20,reputation:0,revenueRate:0,cost:0},
  {id:'repair',title:'로비 조명 긴급 교체',description:'로비의 노후 조명을 교체합니다. 수업과 대관은 정상 운영해요.',effect:'이번 계절 수선비 최대 150,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:15},
  {id:'praise',title:'주민의 감사 편지',description:'센터에서 보낸 시간이 즐거웠다는 편지가 도착했어요.',effect:'이번 계절 결산 때 명성 +1.5 · 증가분은 유지',cash:0,reputation:1.5,revenueRate:0,cost:0},
  {id:'complaint',title:'안내가 조금 아쉬웠대요',description:'이용 안내가 헷갈렸다는 의견이 접수됐어요. 직원들이 안내문을 정리합니다.',effect:'이번 계절 결산 때 명성 −1 · 감소분은 유지',cash:0,reputation:-1,revenueRate:0,cost:0},
  {id:'saving',title:'에너지 절약 환급',description:'직원들의 꼼꼼한 소등과 절약으로 소액 환급을 받게 됐어요.',effect:'이번 계절 결산 때 환급금 +120,000원 · 받은 돈은 유지',cash:12,reputation:0,revenueRate:0,cost:0},
  {id:'supplies',title:'소모품 가격이 올랐어요',description:'공용 소모품 가격이 조금 올랐어요. 이번 계절 추가 비용만 반영합니다.',effect:'이번 계절 소모품비 최대 100,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:10},
  {"id":"newsletter","title":"동네 소식지에 소개됐어요","description":"센터의 작은 활동이 동네 소식지에 실렸어요.","effect":"이번 계절 결산 때 명성 +1 · 증가분은 유지","cash":0,"reputation":1,"revenueRate":0,"cost":0},
  {"id":"detour","title":"센터 앞 잠깐의 우회로","description":"인근 도로 공사로 방문 동선이 조금 길어져 현장 추가 수입이 줄어요.","effect":"이번 계절 운영 수입 −2% · 최대 250,000원","cash":0,"reputation":0,"revenueRate":-0.02,"cost":0},
  {"id":"refund","title":"공과금 정산 환급","description":"이전 공과금을 정산하면서 소액 환급금이 발생했어요.","effect":"이번 계절 결산 때 환급금 +180,000원 · 받은 돈은 유지","cash":18,"reputation":0,"revenueRate":0,"cost":0},
  {"id":"cleaning","title":"로비 특별 청소","description":"빗물과 흙이 들어온 로비를 한 번 더 깨끗하게 정리해요.","effect":"이번 계절 청소비 최대 120,000원 · 가용 현금 내 지출","cash":0,"reputation":0,"revenueRate":0,"cost":12},
  {"id":"volunteer","title":"봉사자들의 작은 도움","description":"주민 봉사자들이 자료와 소모품 정리를 도와 운영 지원금을 받게 됐어요.","effect":"이번 계절 결산 때 운영 지원금 +100,000원 · 받은 돈은 유지","cash":10,"reputation":0,"revenueRate":0,"cost":0},
  {"id":"heating","title":"예상보다 쌀쌀한 날씨","description":"실내 온도를 편안하게 유지하려고 난방을 조금 더 가동해요.","effect":"이번 계절 난방비 최대 150,000원 · 가용 현금 내 지출","cash":0,"reputation":0,"revenueRate":0,"cost":15},
  {"id":"alumni","title":"다시 찾아온 수강생들","description":"수업을 마친 주민들이 감사 인사를 전하러 돌아왔어요.","effect":"이번 계절 결산 때 명성 +1 · 증가분은 유지","cash":0,"reputation":1,"revenueRate":0,"cost":0},
  {"id":"queue","title":"접수대에 작은 대기줄","description":"접수가 잠깐 몰려 기다린 주민들이 불편 의견을 남겼어요.","effect":"이번 계절 결산 때 명성 −0.5 · 감소분은 유지","cash":0,"reputation":-0.5,"revenueRate":0,"cost":0},
  {"id":"cat-director","title":"고양이의 명예 센터장 취임","description":"동네 고양이가 센터장 의자를 차지했어요. 주민들의 사진 속에서 오늘의 주인공이 됐네요.","effect":"이번 계절 결산 때 명성 +1 · 증가분은 유지","cash":0,"reputation":1,"revenueRate":0,"cost":0},
  {"id":"balloons","title":"풍선으로 가득 찬 오배송 상자","description":"주문한 파일철 대신 풍선 한 상자가 도착했어요. 반품은 끝났지만 천장의 풍선부터 잡아야겠어요.","effect":"이번 계절 정리 비용 최대 50,000원 · 가용 현금 내 지출","cash":0,"reputation":0,"revenueRate":0,"cost":5},
  {"id":"robot-dance","title":"로봇청소기의 댄스 데뷔","description":"청소기가 수업 대열에 합류했어요. 절묘한 회전에 웃음이 터지고 체험 수업 문의가 조금 늘었어요.","effect":"이번 계절 운영 수입 +1% · 최대 250,000원","cash":0,"reputation":0,"revenueRate":0.01,"cost":0},
  {"id":"rooster-mic","title":"마이크에서 갑자기 닭 울음이!","description":"합창 연습 시작과 동시에 꼬끼오! 효과음 버튼을 잘못 눌렀네요. 한바탕 웃었지만 진행 점수는 살짝 아쉬워요.","effect":"이번 계절 결산 때 명성 −0.5 · 감소분은 유지","cash":0,"reputation":-0.5,"revenueRate":0,"cost":0},
  {id:'mascot-parade',title:'탈인형 센터장의 문턱 도전',description:'행사 도우미의 빌린 탈인형이 문에 걸렸어요. 옆문으로 돌아 나오는 모습에 주민들이 한바탕 웃었어요.',effect:'이번 계절 결산 때 명성 +1 · 증가분은 유지',cash:0,reputation:1,revenueRate:0,cost:0},
  {id:'umbrella-mixup',title:'노란 우산들의 단체 미팅',description:'우산꽂이에 똑같은 노란 우산만 모였어요! 이름표를 붙여 주인을 찾아드렸습니다.',effect:'이번 계절 이름표·정리비 최대 50,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:5},
  {id:'star-concert',title:'인기 가수 하늘온의 깜짝 콘서트',description:'가상의 인기 가수 하늘온이 재능기부로 센터 앞 특설 무대에 섰어요. 지역 협력단체가 무대를 지원해 정규 수업은 그대로 진행해요.',effect:'이번 계절 운영 수입 +3% · 최대 250,000원',cash:0,reputation:0,revenueRate:.03,cost:0},
  {id:'culture-festival',title:'온 동네가 모이는 문화축제',description:'지역 협력단체와 센터 앞에서 작은 문화축제를 열어요. 체험 부스와 공연을 찾은 주민들로 동네가 북적입니다.',effect:'이번 계절 결산 때 명성 +1.5 · 증가분은 유지',cash:0,reputation:1.5,revenueRate:0,cost:0},
  {id:'starlight-cinema',title:'돗자리 위의 별빛 영화제',description:'지역 영상 동호회가 상영 허락을 받은 영화를 들고 찾아왔어요. 센터 앞 임시 상영 공간의 정리 비용만 부담합니다.',effect:'이번 계절 행사 정리비 최대 100,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:10},
  {id:'residents-exhibition',title:'우리 동네 숨은 작가 작품축제',description:'동네 작가와 주민들의 작품을 로비에 전시했어요. 협력단체가 행사 운영을 돕는 작은 지원금을 보내왔습니다.',effect:'이번 계절 결산 때 지원금 +200,000원 · 받은 돈은 유지',cash:20,reputation:0,revenueRate:0,cost:0},
  {id:'window-repair',title:'출입문 유리 보수',description:'출입문 옆 작은 유리에 금이 가 안전하게 보수해요. 다른 출입문을 이용하며 수업과 대관은 정상 운영합니다.',effect:'이번 계절 보수비 최대 150,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:15},
  {id:'printing-cost',title:'안내 책자 추가 인쇄',description:'안내 책자가 예상보다 일찍 동났어요. 필요한 만큼 추가 인쇄해 방문객들에게 나눠 드립니다.',effect:'이번 계절 인쇄비 최대 80,000원 · 가용 현금 내 지출',cash:0,reputation:0,revenueRate:0,cost:8},
]
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export const COMIC_EVENT_IDS=['cat-director','balloons','robot-dance','rooster-mic','mascot-parade','umbrella-mixup']
export const SPECIAL_EVENT_IDS=['star-concert','culture-festival','starlight-cinema','residents-exhibition']
type EventCalendar={seed:number;year:number;season:number;eventDeck?:Array<string|null>}
/** Seeded Fisher–Yates, stored in saves so later catalog changes cannot reroll events. */
export function createEventDeck(seed:number):string[]{
 const ids=SEASON_EVENTS.map(e=>e.id)
 let n=hash(`${seed}:events-v2`)
 for(let i=ids.length-1;i>0;i--){n=(n+0x6D2B79F5)|0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);const j=Math.floor(((t^(t>>>14))>>>0)/4294967296*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
 return ids
}
/** Frozen original 20-card draw, only for preserving an already announced legacy season. */
export function getLegacySeasonEvent(state:EventCalendar):SeasonEvent|null {
 const turn=(state.year-1)*4+state.season;let due=1+hash(`${state.seed}:first`)%2,index=0
 while(due<turn){index++;due+=2+hash(`${state.seed}:gap:${index}`)%2}
 if(due!==turn)return null
 const parity=(index+hash(`${state.seed}:tone`)%2)%2
 return SEASON_EVENTS[parity+2*((hash(`${state.seed}:deck`)%10+Math.floor(index/2))%10)]
}
export function getSeasonEvent(state:EventCalendar):SeasonEvent|null {
 const turn=(state.year-1)*4+state.season
 const id=(state.eventDeck??createEventDeck(state.seed))[turn]
 return SEASON_EVENTS.find(e=>e.id===id)??null
}
/** Never replay historical effects or change the event the player already acknowledged. */
export function migrateEventDeck(state:EventCalendar&{phase:string;seasonIntroSeen?:string;history:Array<{year:number;season:number;eventImpact?:{id:string}}>}){
 if(state.eventDeck)return
 const current=(state.year-1)*4+state.season
 const prefix:Array<string|null>=Array(current).fill(null)
 for(const report of state.history){const turn=(report.year-1)*4+report.season;if(turn<current)prefix[turn]=report.eventImpact?.id??null}
 if(state.phase!=='planning'||state.seasonIntroSeen===`${state.year}-${state.season}`){
  const report=state.history.find(r=>r.year===state.year&&r.season===state.season)
  prefix.push(report?report.eventImpact?.id??null:getLegacySeasonEvent(state)?.id??null)
 }
 const used=new Set(prefix.filter(Boolean))
 state.eventDeck=[...prefix,...createEventDeck(state.seed).filter(id=>!used.has(id))].slice(0,28)
}
export const seasonIntroKey=(state:{year:number;season:number})=>`${state.year}-${state.season}`

/** Four visual periods: years 1–2, 3–4, 5–6 and year 7. */
export function seasonArtPath(state:{year:number;season:number}) { const year=state.year>=7?7:state.year>=5?5:state.year>=3?3:1; return `/center/milestones-v1/${['spring','summer','autumn','winter'][state.season]}-y${year}.webp` }
