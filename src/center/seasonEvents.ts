/** Effects beyond money and reputation. Only the answers to choice events (rules 3) use them. */
export interface EventExtras {
  /** Resident trust gained at settlement. */
  trust?:number
  /** One week without sessions: in every room, or only in the busiest one. */
  closure?:'all'|'room'
  /** The class with the most seats runs hot or cold for the whole season. */
  classMood?:'hot'|'cold'
  /** Residents who come to a free occasion and leave satisfied. */
  audience?:number
  /** Condition restored to every installed item before the season runs. */
  repair?:number
  /** Staff have no time to train this season. */
  noTraining?:boolean
  /** Points added to the financial score until the next evaluation. */
  financeBonus?:number
  /** Training points for the least trained field. */
  staffPoints?:number
}
interface EventValues extends EventExtras { cash:number; reputation:number; revenueRate:number; cost:number }
export interface EventChoice extends EventValues { label:string; description:string; effect:string }
export interface SeasonEvent extends EventValues { id:string; title:string; description:string; effect:string; choices?:[EventChoice,EventChoice] }
const won=(units:number)=>(units*10_000).toLocaleString('ko-KR')+'원'
const option=(label:string,description:string,values:Partial<EventValues>&{cashLabel?:string}):EventChoice=>{
  const {cash=0,reputation=0,revenueRate=0,cost=0,cashLabel='지원금',...extras}=values
  const parts=[cost?`비용 최대 ${won(cost)}`:'',cash?`${cashLabel} +${won(cash)}`:'',revenueRate?`운영 수입 ${revenueRate>0?'+':'−'}${Math.abs(revenueRate*100)}%`:'',
    extras.closure==='all'?'한 주 동안 모든 수업·대관 휴강':extras.closure==='room'?'가장 바쁜 공간 한 주 휴강':'',
    extras.classMood==='hot'?'정원이 가장 큰 수업 한 계절 호조':extras.classMood==='cold'?'정원이 가장 큰 수업 한 계절 부진':'',
    extras.audience?`주민 ${extras.audience}명 참여 · 만족도 상승`:'',
    extras.repair?`설치한 장비 상태 +${extras.repair}`:'',
    extras.staffPoints?`교육이 가장 낮은 분야 교육 점수 +${extras.staffPoints}`:'',
    extras.noTraining?'이번 계절 직원 교육 불가':'',
    extras.financeBonus?`재정 건전성 +${extras.financeBonus}점(다음 종합평가까지)`:'',
    extras.trust?`신뢰 ${extras.trust>0?'+':'−'}${Math.abs(extras.trust)}`:''].filter(Boolean)
  // An answer that changes nothing says so once; otherwise the reputation line always closes the summary.
  const effect=parts.length||reputation?[...parts,reputation?`명성 ${reputation>0?'+':'−'}${Math.abs(reputation)}`:'명성 변화 없음'].join(' · '):'변화 없음'
  return {label,description,effect,cash,reputation,revenueRate,cost,...extras}
}
/** `{rival}` in a title or description stands for the neighbouring centre this season's encounter is with. */
export const RIVAL_TOKEN='{rival}'
/**
 * Choice events added on 2026-11-19 for rules 3. The first answer is the default; the second has its own scene for
 * the first eight. The last three are encounters with a neighbouring centre.
 */
const ADDED_CHOICE_EVENTS:Array<{id:string;title:string;description:string;choices:[EventChoice,EventChoice]}>=[
  {id:'heatwave',title:'숨이 턱 막히는 폭염',description:'연일 이어지는 무더위에 주민들이 쉴 곳을 찾고 있어요.',choices:[option('평소대로 운영','수업은 그대로 열지만 더위에 발길이 조금 줄어요.',{revenueRate:-.03}),option('무더위 쉼터로 개방','로비를 쉼터로 열고 시원한 보리차와 부채를 준비해요.',{cost:25,trust:3})]},
  {id:'tv-crew',title:'지역 방송의 촬영 요청',description:'지역 방송국이 센터의 수업 풍경을 담고 싶다고 찾아왔어요.',choices:[option('정중히 거절','수업에 집중하도록 이번에는 사양해요.',{}),option('촬영 허가','가장 바쁜 공간이 촬영 준비로 한 주 쉬지만 센터가 널리 알려져요.',{reputation:3,closure:'room'})]},
  {id:'guest-teacher',title:'유명 강사의 특강 제안',description:'이름난 강사가 센터에서 특강을 열고 싶다며 포트폴리오를 들고 왔어요.',choices:[option('다음 기회로','일정과 예산을 생각해 다음을 기약해요.',{}),option('특강 초빙','강사료를 들여 정원이 가장 큰 수업에 특강을 붙여요. 한 계절 내내 입소문이 나요.',{cost:35,classMood:'hot'})]},
  {id:'blackout',title:'동네에 갑자기 찾아온 정전',description:'변전 설비 고장으로 동네 전체에 전기가 끊겼어요. 복구까지 시간이 걸려요.',choices:[option('하루 휴관','안전을 위해 문을 닫아요. 그 주의 수업과 대관은 모두 쉬어요.',{closure:'all'}),option('발전기 임차','발전기를 빌려 불을 밝히고 평소처럼 운영해요.',{cost:30})]},
  {id:'club-showcase',title:'주민 동아리 발표회',description:'주민 동아리들이 한 해 동안 갈고닦은 솜씨를 센터에서 선보이고 싶어 해요.',choices:[option('대관료 받고 열기','정해진 대관료를 받고 장소를 빌려줘요.',{cash:15,cashLabel:'대관료'}),option('무료로 열어 주기','대관료 없이 장소를 내어 주고 온 동네를 초대해요.',{audience:120,trust:1})]},
  {id:'sister-center',title:'자매 센터 방문단',description:'다른 지역의 자매 센터에서 운영 사례를 배우러 방문단이 찾아왔어요.',choices:[option('간단한 견학','시설을 둘러보도록 안내해요.',{reputation:.5}),option('환영 행사','다과와 기념품을 준비해 정성껏 맞이해요.',{cost:25,reputation:2.5})]},
  {id:'donated-goods',title:'상자 가득 도착한 기부 물품',description:'주민들이 쓰던 운동·공예 용품을 상자 가득 보내왔어요.',choices:[option('필요한 곳에 재기부','센터에는 넘치는 물품이라 이웃 시설에 다시 나눠요.',{reputation:1.5}),option('직접 정비해 사용','직원과 봉사자가 손봐서 센터 장비를 보강해요.',{cost:20,repair:15})]},
  {id:'inspection',title:'정기 행정 점검',description:'시청에서 정기 행정 점검을 나왔어요. 서류를 얼마나 꼼꼼히 챙길지 정해야 해요.',choices:[option('평소대로 받기','있는 그대로 점검을 받아요.',{}),option('서류 정비에 집중','직원 모두가 증빙과 장부를 정리해요. 이번 계절에는 교육할 시간이 없어요.',{noTraining:true,financeBonus:4})]},
  {id:'rival-visit',title:'이웃 센터장의 방문',description:'{rival} 센터장이 우리 센터를 둘러보러 찾아왔어요. 웃으며 악수했지만 눈빛은 진지해요.',choices:[option('가볍게 안내하기','로비와 대표 공간만 보여 드려요.',{}),option('운영 비결 나누기','직원들이 한나절 시간을 내어 서로의 운영 방법을 배우고 가르쳐요.',{cost:10,staffPoints:12,reputation:.5})]},
  {id:'joint-event',title:'이웃 센터와 합동 체육대회',description:'{rival}에서 동네 합동 체육대회를 함께 열자고 제안해 왔어요.',choices:[option('다음 기회로','이번 계절 일정에 집중해요.',{}),option('함께 열기','운영비를 나눠 내고 두 센터 주민이 한자리에 모여요.',{cost:20,audience:150,reputation:1})]},
  {id:'poached-instructor',title:'인기 강사에게 온 영입 제안',description:'{rival}에서 우리 인기 강사에게 자리를 제안했대요. 강사님이 미안한 얼굴로 먼저 알려 왔어요.',choices:[option('보내 드리기','앞날을 응원하며 보내 드려요. 새 강사가 자리 잡을 때까지 그 수업은 힘들어요.',{classMood:'cold'}),option('처우를 개선해 붙잡기','강사료를 올려 계속 함께하기로 해요.',{cost:30,trust:1})]},
]
export const ADDED_EVENT_IDS=ADDED_CHOICE_EVENTS.map(event=>event.id)
/** Events that only make sense in summer. */
export const SUMMER_EVENT_IDS=['heatwave']
/** Why sessions stopped for a week, by event. These are not the centre's own failures. */
export const EVENT_CLOSURE_REASONS:Record<string,string>={blackout:'동네 정전으로 하루 휴관했어요.','tv-crew':'방송 촬영 준비로 한 주 쉬었어요.'}
/** Rules 3 only: the centre director answers these events. The first option is the default. */
export const EVENT_CHOICES:Record<string,[EventChoice,EventChoice]>={
  'star-concert':[option('협력단체에 맡기기','무대 운영은 협력단체가 맡고 센터는 평소처럼 운영해요.',{revenueRate:.03}),option('무대·안전 인력 지원','직원과 예산을 들여 안전하고 풍성한 공연으로 만들어요.',{cost:40,reputation:3})],
  'culture-festival':[option('장소만 제공','앞마당을 빌려주고 협력단체의 사례금을 받아요.',{cash:10,reputation:1}),option('체험 부스 직접 운영','센터 이름을 걸고 체험 부스를 열어요.',{cost:30,reputation:2.5})],
  'starlight-cinema':[option('정리 비용만 부담','상영은 동호회에 맡기고 뒷정리만 도와요.',{cost:10}),option('야간 개방·간식 지원','늦은 시간까지 문을 열고 주민 간식을 준비해요.',{cost:25,reputation:2})],
  'residents-exhibition':[option('지원금을 운영비로','협력단체 지원금을 센터 운영에 보태요.',{cash:20}),option('전시 도록 제작','지원금에 예산을 더해 주민 작품 도록을 만들어요.',{cost:20,reputation:2})],
  donation:[option('운영비로 사용','응원금을 센터 살림에 보태요.',{cash:20}),option('감사 행사로 환원','응원금으로 주민 감사 행사를 열어요.',{reputation:1.5})],
  complaint:[option('직원 구두 안내로 대응','당분간 직원이 직접 안내해요.',{reputation:-1}),option('안내문 전면 개편','비용을 들여 안내 체계를 새로 만들어요.',{cost:15,reputation:.5})],
  repair:[option('기본 조명으로 교체','필요한 만큼만 고쳐요.',{cost:15}),option('고효율 조명으로 교체','더 밝고 오래 가는 조명으로 바꿔요.',{cost:30,reputation:1})],
  queue:[option('양해를 구하기','기다린 주민들께 사과드려요.',{reputation:-.5}),option('임시 접수 창구 운영','인력을 더 써서 대기줄을 줄여요.',{cost:12,reputation:.5})],
  newsletter:[option('간단히 소개되기','보내 온 질문에 답변만 해요.',{reputation:1}),option('특집 기사에 협조','사진과 자료를 제작해 특집으로 실어요.',{cost:12,reputation:2})],
  volunteer:[option('운영 지원금 받기','봉사 실적에 따른 지원금을 받아요.',{cash:10}),option('봉사자 감사 모임','지원금 대신 감사 모임을 열어요.',{reputation:1.2})],
  ...Object.fromEntries(ADDED_CHOICE_EVENTS.map(event=>[event.id,event.choices])),
}
/** Events whose second response has its own illustration (`<id>-b.webp`, delivered 2026-11-19). */
export const EVENT_CHOICE_ART=new Set(['star-concert','culture-festival','starlight-cinema','residents-exhibition','donation','complaint','repair','queue','newsletter','volunteer','heatwave','tv-crew','guest-teacher','blackout','club-showcase','sister-center','donated-goods','inspection'])
/** Picture for an event. The second response shows its own scene when one exists. */
export function eventArtPath(id:string,choice?:number):string { return `/center/milestones-v1/${id}${choice===1&&EVENT_CHOICE_ART.has(id)?'-b':''}.webp` }
/** Returns the event as it applies once the chosen option replaces its default effect. */
export function applyEventChoice(event:SeasonEvent,index:number):SeasonEvent {
  const choice=event.choices?.[index]
  if(!choice)return event
  // Start from a clean card so an effect of the default answer never leaks into the other one.
  const {label:_label,description:_description,...values}=choice
  return {id:event.id,title:event.title,description:event.description,choices:event.choices,...values}
}
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
  // Rules 3 only. A card's own figures are those of its default answer.
  ...ADDED_CHOICE_EVENTS.map(({choices,...event}):SeasonEvent=>{const {label:_label,description:_description,...values}=choices[0];return {...event,...values}}),
]
/** The catalogue every legacy-rules game draws from. */
export const LEGACY_EVENT_COUNT=28
function hash(value:string){let n=2166136261;for(const c of value)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export const COMIC_EVENT_IDS=['cat-director','balloons','robot-dance','rooster-mic','mascot-parade','umbrella-mixup']
export const SPECIAL_EVENT_IDS=['star-concert','culture-festival','starlight-cinema','residents-exhibition']
type EventCalendar={seed:number;year:number;season:number;eventDeck?:Array<string|null>}
function shuffled(ids:string[],start:number):string[]{
 let n=start
 for(let i=ids.length-1;i>0;i--){n=(n+0x6D2B79F5)|0;let t=n;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);const j=Math.floor(((t^(t>>>14))>>>0)/4294967296*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
 return ids
}
/** A summer card drawn for another season moves to a summer still to come (turns 1, 5, 9, …). */
function settleSeasonal<T extends string|null>(deck:T[],from:number,seed:number):T[]{
 for(const id of SUMMER_EVENT_IDS){
  const at=deck.indexOf(id as T);if(at<from||at%4===1)continue
  const summers=deck.map((_,turn)=>turn).filter(turn=>turn>=from&&turn%4===1)
  if(!summers.length)continue
  const to=summers[hash(`${seed}:${id}:summer`)%summers.length]!;[deck[at],deck[to]]=[deck[to]!,deck[at]!]
 }
 return deck
}
/**
 * Seeded Fisher–Yates, stored in saves so later catalog changes cannot reroll events.
 * Legacy games draw all 28 original cards; rules 3 draws 28 of the whole catalogue, so no two games meet the same set.
 */
export function createEventDeck(seed:number,rules?:number):string[]{
 if(rules!==3)return shuffled(SEASON_EVENTS.slice(0,LEGACY_EVENT_COUNT).map(e=>e.id),hash(`${seed}:events-v2`))
 return settleSeasonal(shuffled(SEASON_EVENTS.map(e=>e.id),hash(`${seed}:events-v3`)).slice(0,28),0,seed)
}
/**
 * Rules-3 saves started before the catalogue grew: redraw only the seasons not yet reached, from every card not yet
 * seen. Past seasons and the current one are never touched. Returns true when a new event entered the deck.
 */
export function expandEventDeck(state:EventCalendar&{rules?:number;eventCatalog?:number;phase:string}):boolean {
 if(state.rules!==3||state.eventCatalog===2)return false
 state.eventCatalog=2
 if(!state.eventDeck||state.phase==='ending')return false
 const current=(state.year-1)*4+state.season,kept=state.eventDeck.slice(0,current+1),used=new Set(kept.filter(Boolean))
 const summerLeft=Array.from({length:Math.max(0,27-current)},(_,i)=>current+1+i).some(turn=>turn%4===1)
 const pool=shuffled(SEASON_EVENTS.map(e=>e.id).filter(id=>!used.has(id)&&(summerLeft||!SUMMER_EVENT_IDS.includes(id))),hash(`${state.seed}:events-v3:${current}`))
 state.eventDeck=settleSeasonal([...kept,...pool].slice(0,28),current+1,state.seed)
 return state.eventDeck.slice(current+1).some(id=>id!==null&&ADDED_EVENT_IDS.includes(id))
}
/** Frozen original 20-card draw, only for preserving an already announced legacy season. */
export function getLegacySeasonEvent(state:EventCalendar):SeasonEvent|null {
 const turn=(state.year-1)*4+state.season;let due=1+hash(`${state.seed}:first`)%2,index=0
 while(due<turn){index++;due+=2+hash(`${state.seed}:gap:${index}`)%2}
 if(due!==turn)return null
 const parity=(index+hash(`${state.seed}:tone`)%2)%2
 return SEASON_EVENTS[parity+2*((hash(`${state.seed}:deck`)%10+Math.floor(index/2))%10)]
}
export function getSeasonEvent(state:EventCalendar&{rules?:number}):SeasonEvent|null {
 const turn=(state.year-1)*4+state.season
 const id=(state.eventDeck??createEventDeck(state.seed,state.rules))[turn]
 const event=SEASON_EVENTS.find(e=>e.id===id)??null
 return event&&state.rules===3&&EVENT_CHOICES[event.id]?{...event,choices:EVENT_CHOICES[event.id]}:event
}
/** Never replay historical effects or change the event the player already acknowledged. */
export function migrateEventDeck(state:EventCalendar&{rules?:number;phase:string;seasonIntroSeen?:string;history:Array<{year:number;season:number;eventImpact?:{id:string}}>}){
 if(state.eventDeck)return
 const current=(state.year-1)*4+state.season
 const prefix:Array<string|null>=Array(current).fill(null)
 for(const report of state.history){const turn=(report.year-1)*4+report.season;if(turn<current)prefix[turn]=report.eventImpact?.id??null}
 if(state.phase!=='planning'||state.seasonIntroSeen===`${state.year}-${state.season}`){
  const report=state.history.find(r=>r.year===state.year&&r.season===state.season)
  prefix.push(report?report.eventImpact?.id??null:getLegacySeasonEvent(state)?.id??null)
 }
 const used=new Set(prefix.filter(Boolean))
 const deck=[...prefix,...createEventDeck(state.seed,state.rules).filter(id=>!used.has(id))].slice(0,28)
 state.eventDeck=state.rules===3?settleSeasonal(deck,prefix.length,state.seed):deck
}
export const seasonIntroKey=(state:{year:number;season:number})=>`${state.year}-${state.season}`

/** Four visual periods: years 1–2, 3–4, 5–6 and year 7. */
export function seasonArtPath(state:{year:number;season:number}) { const year=state.year>=7?7:state.year>=5?5:state.year>=3?3:1; return `/center/milestones-v1/${['spring','summer','autumn','winter'][state.season]}-y${year}.webp` }
