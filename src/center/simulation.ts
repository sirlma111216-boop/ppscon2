/** Pure, deterministic center simulation. Money never changes during animation. */
export type RoomId = 'A' | 'B' | 'C'
export type ProgramId = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10'
export type Expertise = 'culture' | 'sport' | 'event'
export type Plan = Record<RoomId, (ProgramId | null)[]>
export interface Program {
  id: ProgramId; name: string; shortName: string; icon: string; color: string
  capacity: number; support: number; income: number; cost: number
  requires: string[]; mode: string; kind: Expertise | 'community'
}
export interface Offer {
  id: string; name: string; price: number; maintenance: number; installSlots: number
  description: string; capabilities: string[]; family: string; icon: string
}
export const SEASONS = ['봄', '여름', '가을', '겨울'] as const
export const BLOCKS = ['평일 오전', '평일 오후', '평일 저녁', '토요일', '일요일'] as const
export const PROGRAMS: Program[] = [
  { id:'P01', name:'공예 강좌', shortName:'공예', icon:'✂', color:'#5986b9', capacity:8, support:1, income:8, cost:5, requires:['craft'], mode:'table', kind:'culture' },
  { id:'P02', name:'주민 공예 교실', shortName:'주민 공예', icon:'❋', color:'#86a69a', capacity:8, support:1, income:0, cost:2, requires:['craft'], mode:'table', kind:'culture' },
  { id:'P03', name:'요가 강좌', shortName:'요가', icon:'◡', color:'#d48173', capacity:8, support:1, income:6, cost:3, requires:['mat'], mode:'floor', kind:'sport' },
  { id:'P04', name:'주민 스트레칭', shortName:'스트레칭', icon:'☀', color:'#b3a277', capacity:8, support:1, income:0, cost:1, requires:['mat'], mode:'floor', kind:'sport' },
  { id:'P05', name:'소규모 모임 대관', shortName:'모임 대관', icon:'⌂', color:'#8697a9', capacity:6, support:1, income:3, cost:1, requires:[], mode:'nook', kind:'community' },
  { id:'P06', name:'주민 모임', shortName:'주민 모임', icon:'♡', color:'#b495a9', capacity:6, support:1, income:0, cost:0, requires:[], mode:'nook', kind:'community' },
  { id:'P07', name:'디지털 강좌', shortName:'디지털', icon:'▣', color:'#759eb1', capacity:6, support:1, income:10, cost:5, requires:['digital'], mode:'table', kind:'culture' },
  { id:'P08', name:'공연 대관', shortName:'공연', icon:'♫', color:'#9e8abe', capacity:14, support:2, income:18, cost:8, requires:['audio','stage','hall'], mode:'stage', kind:'event' },
  { id:'P09', name:'댄스 강좌', shortName:'댄스', icon:'♪', color:'#d58393', capacity:8, support:1, income:8, cost:4, requires:['audio'], mode:'floor', kind:'sport' },
  { id:'P10', name:'장비 포함 발표 대관', shortName:'발표 대관', icon:'▤', color:'#8f9b72', capacity:10, support:1, income:10, cost:4, requires:['screen'], mode:'seats', kind:'event' },
]
export const OFFERS: Offer[] = [
  { id:'E01', name:'기본 공예 세트', price:90, maintenance:2, installSlots:1, description:'테이블과 작업 도구로 공예 교실을 열어요.', capabilities:['craft'], family:'craft', icon:'✂' },
  { id:'E01B', name:'내구형 공예 세트', price:125, maintenance:1, installSlots:2, description:'설치는 길지만 유지비와 사용 마모가 적어요.', capabilities:['craft'], family:'craft', icon:'✂' },
  { id:'E02', name:'생활체육 매트 세트', price:60, maintenance:1, installSlots:1, description:'요가와 주민 스트레칭을 시작해요.', capabilities:['mat'], family:'mat', icon:'◡' },
  { id:'E03', name:'이동식 가구 세트', price:80, maintenance:2, installSlots:1, description:'테이블·좌석·빈 바닥 전환에 드는 준비를 줄여요.', capabilities:['flex'], family:'flex', icon:'▱' },
  { id:'E04', name:'기본 음향 세트', price:120, maintenance:4, installSlots:1, description:'댄스 강좌, 무대와 함께 공연을 열어요.', capabilities:['audio'], family:'audio', icon:'♫' },
  { id:'E04B', name:'저전력 음향 세트', price:145, maintenance:2, installSlots:2, description:'장기간 사용할 때 유지비를 아낄 수 있어요.', capabilities:['audio'], family:'audio', icon:'♫' },
  { id:'E05', name:'영상·발표 세트', price:90, maintenance:2, installSlots:1, description:'스크린을 갖춘 발표 대관을 받을 수 있어요.', capabilities:['screen'], family:'screen', icon:'▤' },
  { id:'E06', name:'디지털 교육 세트', price:180, maintenance:5, installSlots:2, description:'컴퓨터 교육을 위한 새로운 교실을 만들어요.', capabilities:['digital'], family:'digital', icon:'▣' },
  { id:'E07', name:'이동무대·좌석 세트', price:160, maintenance:4, installSlots:2, description:'열린 행사실에서 음향과 함께 공연을 준비해요.', capabilities:['stage'], family:'stage', icon:'▰' },
  { id:'E08', name:'절전 설비', price:110, maintenance:1, installSlots:1, description:'센터 기본운영비를 계절마다 12점 줄여요.', capabilities:['energy'], family:'energy', icon:'☼' },
  { id:'E09', name:'이동식 공간 분리 설비', price:140, maintenance:2, installSlots:1, description:'옆방의 음악 때문에 생기는 불편을 줄여요.', capabilities:['quiet'], family:'quiet', icon:'▥' },
  { id:'E10', name:'예약·안내 도구', price:100, maintenance:3, installSlots:1, description:'반복 대관 접수를 줄이거나 처음 온 주민을 안내해요.', capabilities:['guide'], family:'guide', icon:'⌘' },
]
const PROGRAM = Object.fromEntries(PROGRAMS.map(p => [p.id,p])) as Record<ProgramId,Program>
const OFFER = Object.fromEntries(OFFERS.map(p => [p.id,p])) as Record<string,Offer>
const ROOM_IDS: RoomId[] = ['A','B','C']
const ACTIVITY_FAMILIES = ['craft','mat','audio','screen','digital','stage']
const SUPPORT = [2,2,2,1,1]
const round = (n:number) => Math.round((n + Number.EPSILON) * 100) / 100
const clamp = (n:number, low=0, high=100) => Math.max(low,Math.min(high,n))
const copy = <T>(value:T):T => structuredClone(value)

export interface Room { id:RoomId; open:boolean; equipment:string[]; mode:string }
export interface Equipment { id:string; room:RoomId|null; condition:number; ready:boolean }
export interface Task { kind:'install'|'maintain'|'train'|'open'; room:RoomId; remaining:number; equipment?:string; expertise?:Expertise }
interface RawStats { publicServed:number; publicRequested:number; experienceSum:number; experienceWeight:number; use:number; weeks:number }
export interface Institution {
  id:string; name:string; archetype:string; cash:number; reserved:number; plan:Plan
  rooms:Room[]; inventory:Equipment[]; xp:Record<Expertise,number>; trust:number
  score:number; publicScore:number; experienceScore:number; utilization:number
  history:number[]; lastPurchase:string; pendingTasks:Task[]; baseReserve:number
  yearStats:RawStats; supportContract:boolean; priceMode:'discount'|'standard'|'premium'
  guideMode:'fast'|'welcome'; trained:boolean; annualScores:number[]
}
export interface Activity { room:RoomId; slot:number; program:ProgramId; attendees:number; capacity:number; experience:number }
export interface SeasonReport {
  year:number; season:number; revenue:number; cost:number; profit:number; visits:number
  publicVisits:number; publicScore:number; experienceScore:number; score:number; rank:number
  highlights:string[]; warnings:string[]; activity:Activity[]
  weekly:{week:number;revenue:number;cost:number;visits:number}[]
  beforeCash:number; afterCash:number; annual:boolean
}
export interface GameState {
  version:1; seed:number; year:number; season:number; phase:'planning'|'review'|'ending'
  player:Institution; rivals:Institution[]; lastReport:SeasonReport|null; history:SeasonReport[]
}
export interface DemandGroup { id:string; title:string; programs:ProgramId[]; people:number; slots:number[]; maxFee:number; public:boolean; returning:number }
export interface MutationResult { state:GameState; error?:string }
const emptyStats = ():RawStats => ({publicServed:0,publicRequested:0,experienceSum:0,experienceWeight:0,use:0,weeks:0})
const emptyPlan = ():Plan => ({A:[null,null,null,null,null],B:[null,null,null,null,null],C:[null,null,null,null,null]})
export function getLevel(xp:number):number { return [0,20,60,120,200].filter(n => xp >= n).length - 1 }
export function freeCash(inst:Institution):number { return round(Math.max(0, inst.cash-inst.reserved)) }
const roomOf = (inst:Institution,id:RoomId):Room => inst.rooms.find(r => r.id === id)!
const hasFamily = (inst:Institution,family:string,room?:RoomId,readyOnly=false):boolean => inst.inventory.some(e => OFFER[e.id]?.family === family && (room === undefined || e.room === room) && e.condition >= 20 && (!readyOnly || e.ready))
const maintenanceCost = (inst:Institution):number => inst.inventory.reduce((sum,e) => sum+OFFER[e.id].maintenance,0)
const actualBaseCost = (inst:Institution):number => 80+(roomOf(inst,'C').open?15:0)-(hasFamily(inst,'energy',undefined,true)?12:0)

function initialInstitution(id:string,name:string,archetype:string):Institution {
  const plan=emptyPlan(); plan.A=['P05',null,'P06',null,null]; plan.B=[null,'P05',null,null,'P06']
  return {id,name,archetype,cash:720,reserved:320,plan,rooms:[{id:'A',open:true,equipment:[],mode:'seats'},{id:'B',open:true,equipment:[],mode:'floor'},{id:'C',open:false,equipment:[],mode:'seats'}],inventory:[],xp:{culture:0,sport:0,event:0},trust:50,score:0,publicScore:0,experienceScore:0,utilization:0,history:[],lastPurchase:'아직 없음',pendingTasks:[],baseReserve:80,yearStats:emptyStats(),supportContract:false,priceMode:'standard',guideMode:'welcome',trained:false,annualScores:[]}
}
export function createGame(seed=20261105):GameState {
  const definitions=[['boram','보람','주민 서비스'],['onnuri','온누리','공간 활용'],['rhythm','리듬','공연 수입'],['tantan','탄탄','생활체육'],['baeum','배움','문화 교육'],['saebom','새봄','새로운 시도'],['neulpum','늘품','정비와 절약'],['pureun','푸른','에너지 효율'],['byeolbit','별빛','공간 확장'],['daon','다온','균형 성장']]
  return {version:1,seed,year:1,season:0,phase:'planning',player:initialInstitution('player','우리 센터','나만의 운영'),rivals:definitions.map(([id,name,kind]) => initialInstitution(id,name+'센터',kind)),lastReport:null,history:[]}
}
export function canRunProgram(inst:Institution,room:RoomId,program:ProgramId):boolean {
  const p=PROGRAM[program]; if (!p || !roomOf(inst,room)?.open) return false
  const repairScheduled=inst.pendingTasks.some(task=>task.kind==='maintain'&&task.room===room)
  return p.requires.every(cap => cap === 'hall' ? room === 'C' : inst.inventory.some(e=>e.room===room&&OFFER[e.id].family===cap&&(e.condition>=20||(repairScheduled&&e.condition+40>=20))))
}
export function setProgram(state:GameState,room:RoomId,slot:number,program:ProgramId|null):GameState {
  if (state.phase !== 'planning' || !ROOM_IDS.includes(room) || !Number.isInteger(slot) || slot<0 || slot>4 || (program!==null && !canRunProgram(state.player,room,program))) return state
  const next=copy(state); next.player.plan[room][slot]=program; return next
}
function addTask(inst:Institution,task:Task) { inst.pendingTasks.push(task) }
function buyFor(inst:Institution,offerId:string,room:RoomId,season:number):string|undefined {
  const offer=OFFER[offerId]
  if (!offer) return '물품을 찾을 수 없어요.'
  if (!roomOf(inst,room)?.open) return '먼저 사용할 방을 열어 주세요.'
  if (inst.inventory.some(e => OFFER[e.id].family === offer.family)) return '같은 물품군을 이미 보유하고 있어요.'
  if (offer.family==='stage' && room!=='C') return '이 무대는 행사실에 설치할 수 있어요.'
  if (ACTIVITY_FAMILIES.includes(offer.family) && inst.inventory.filter(e => e.room===room && ACTIVITY_FAMILIES.includes(OFFER[e.id].family)).length>=2) return '이 방의 활동 장비 자리가 모두 찼어요.'
  const reserve=offer.maintenance*(4-season)
  if (freeCash(inst)<offer.price+reserve) return `구매비와 올해 유지비를 합쳐 ${offer.price+reserve}점이 필요해요.`
  inst.cash=round(inst.cash-offer.price); inst.reserved=round(inst.reserved+reserve)
  const location=['energy','guide'].includes(offer.family)?null:room
  inst.inventory.push({id:offer.id,room:location,condition:100,ready:false})
  if(location) roomOf(inst,location).equipment.push(offer.id)
  addTask(inst,{kind:'install',room,remaining:offer.installSlots,equipment:offer.id})
  inst.lastPurchase=offer.name
}
export function buyEquipment(state:GameState,offerId:string,room:RoomId):MutationResult {
  if(state.phase!=='planning') return {state,error:'다음 계절의 계획 화면에서 구매할 수 있어요.'}
  const next=copy(state);const error=buyFor(next.player,offerId,room,state.season)
  return error?{state,error}:{state:next}
}
export function moveEquipment(state:GameState,equipmentId:string,targetRoom:RoomId):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 장비를 옮길 수 있어요.'}
  const equipment=state.player.inventory.find(e=>e.id===equipmentId)
  if(!equipment)return {state,error:'보유한 장비를 선택해 주세요.'}
  if(equipment.room===null)return {state,error:'센터 공용 설비는 방 사이로 옮기지 않아요.'}
  if(!equipment.ready)return {state,error:'현재 설치·이전 작업이 끝난 뒤 옮길 수 있어요.'}
  if(equipment.room===targetRoom)return {state,error:'이미 이 방에 있는 장비예요.'}
  if(!roomOf(state.player,targetRoom)?.open)return {state,error:'먼저 옮길 방을 열어 주세요.'}
  const offer=OFFER[equipment.id]
  if(offer.family==='stage'&&targetRoom!=='C')return {state,error:'이 무대는 행사실에서 사용할 수 있어요.'}
  if(ACTIVITY_FAMILIES.includes(offer.family)&&state.player.inventory.filter(e=>e.room===targetRoom&&ACTIVITY_FAMILIES.includes(OFFER[e.id].family)).length>=2)return {state,error:'옮길 방의 활동 장비 자리가 모두 찼어요.'}
  if(freeCash(state.player)<8)return {state,error:'장비 이전에 8점이 필요해요.'}
  const next=copy(state),moved=next.player.inventory.find(e=>e.id===equipmentId)!
  roomOf(next.player,moved.room!).equipment=roomOf(next.player,moved.room!).equipment.filter(id=>id!==equipmentId)
  moved.room=targetRoom;moved.ready=false
  roomOf(next.player,targetRoom).equipment.push(equipmentId)
  next.player.cash=round(next.player.cash-8)
  addTask(next.player,{kind:'install',room:targetRoom,remaining:1,equipment:equipmentId})
  return {state:next}
}
function openFor(inst:Institution,season:number):string|undefined {
  if(roomOf(inst,'C').open) return '행사실이 이미 열려 있어요.'
  const reserve=15*(4-season)
  if(freeCash(inst)<220+reserve) return `개방비와 올해 운영비로 ${220+reserve}점이 필요해요.`
  inst.cash=round(inst.cash-220);inst.reserved=round(inst.reserved+reserve);inst.baseReserve+=15
  roomOf(inst,'C').open=true;addTask(inst,{kind:'open',room:'C',remaining:2});inst.lastPurchase='행사실 개방'
}
export function openHall(state:GameState):MutationResult {
  if(state.phase!=='planning') return {state,error:'계획 화면에서 행사실을 열 수 있어요.'}
  const next=copy(state); const error=openFor(next.player,state.season);return error?{state,error}:{state:next}
}
function maintainFor(inst:Institution,room:RoomId):string|undefined {
  if(!inst.inventory.some(e=>e.room===room && e.condition<100)) return '이 방의 장비는 아직 정비가 필요하지 않아요.'
  if(inst.pendingTasks.some(t=>t.kind==='maintain'&&t.room===room)) return '이미 정비를 계획했어요.'
  if(freeCash(inst)<12) return '정비에 12점이 필요해요.'
  inst.cash=round(inst.cash-12);addTask(inst,{kind:'maintain',room,remaining:1})
}
export function maintainRoom(state:GameState,room:RoomId):MutationResult {
  if(state.phase!=='planning') return {state,error:'계획 화면에서 정비를 예약해 주세요.'}
  const next=copy(state);const error=maintainFor(next.player,room);return error?{state,error}:{state:next}
}
export function trainStaff(state:GameState,kind:Expertise):MutationResult {
  if(state.phase!=='planning') return {state,error:'계획 화면에서 교육을 예약해 주세요.'}
  if(!['culture','sport','event'].includes(kind)) return {state,error:'교육 분야를 확인해 주세요.'}
  if(state.player.trained) return {state,error:'이번 계절에는 교육을 이미 예약했어요.'}
  if(state.player.xp[kind]===0) return {state,error:'이 분야를 한 번 운영한 뒤 교육할 수 있어요.'}
  if(freeCash(state.player)<12) return {state,error:'교육에 12점이 필요해요.'}
  const next=copy(state);next.player.cash=round(next.player.cash-12);next.player.trained=true
  addTask(next.player,{kind:'train',room:'A',remaining:1,expertise:kind});return {state:next}
}
export function setWeekendSupport(state:GameState,enabled:boolean):MutationResult {
  if(state.phase!=='planning'||state.player.supportContract===enabled) return {state}
  if(enabled&&freeCash(state.player)<24) return {state,error:'주말 지원 계약에 24점이 필요해요.'}
  const next=copy(state);next.player.cash=round(next.player.cash+(enabled?-24:24));next.player.supportContract=enabled;return {state:next}
}
export function setPriceMode(state:GameState,mode:Institution['priceMode']):GameState {
  if(state.phase!=='planning') return state
  const next=copy(state);next.player.priceMode=mode;return next
}
export function setGuideMode(state:GameState,mode:Institution['guideMode']):GameState {
  if(state.phase!=='planning') return state
  const next=copy(state);next.player.guideMode=mode;return next
}
function stableHash(text:string):number { let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0 }
export function getDemand(state:Pick<GameState,'seed'|'year'|'season'>):DemandGroup[] {
  const n=(id:string,max:number)=>stableHash(`${state.seed}:${state.year}:${state.season}:${id}`)%max
  const sizes=(id:string,base:number)=>base+n(id,3)
  const groups:DemandGroup[]=[
    {id:'craft-a',title:'오전 공예 모임',programs:['P01','P02'],people:sizes('ca',6),slots:[0,1],maxFee:1.2,public:true,returning:.8},
    {id:'craft-b',title:'저녁 공예 모임',programs:['P01','P02'],people:sizes('cb',6),slots:[1,2],maxFee:1.2,public:false,returning:.8},
    {id:'craft-c',title:'주민 공예 신청',programs:['P01','P02'],people:sizes('cc',6),slots:[0,1,3],maxFee:0,public:true,returning:.3},
    {id:'craft-d',title:'주말 만들기 모임',programs:['P01','P02'],people:sizes('cd',5),slots:[3,4],maxFee:state.season===2?1.2:0,public:true,returning:.4},
    {id:'yoga-a',title:'아침 요가 신청',programs:['P03','P04'],people:sizes('ya',6),slots:[0,1],maxFee:.9,public:true,returning:.9},
    {id:'yoga-b',title:'퇴근 후 운동 모임',programs:['P03','P04'],people:sizes('yb',6),slots:[1,2,4],maxFee:.9,public:false,returning:.8},
    {id:'yoga-c',title:'주민 스트레칭',programs:['P03','P04'],people:sizes('yc',6),slots:[0,2,3],maxFee:0,public:true,returning:.3},
    {id:'meeting-a',title:'동네 동아리 대관',programs:['P05','P06'],people:6,slots:[0,1,3],maxFee:3.5,public:false,returning:.9},
    {id:'meeting-b',title:'주말 독서 모임',programs:['P05','P06'],people:5,slots:[2,3,4],maxFee:3.5,public:true,returning:.8},
    {id:'meeting-c',title:'주민 자치 모임',programs:['P05','P06'],people:6,slots:[1,2,4],maxFee:0,public:true,returning:.8},
    {id:'dance-a',title:'저녁 댄스 모임',programs:['P09'],people:sizes('da',5),slots:[2,3,4],maxFee:1.2,public:true,returning:.6},
    {id:'screen-a',title:'동아리 발표회',programs:['P10'],people:6+n('sa',3),slots:[1,2,3],maxFee:12,public:true,returning:.8},
  ]
  if(state.year>=2) groups.push({id:'digital-a',title:'생활 디지털 교실',programs:['P07'],people:6,slots:[0,1,4],maxFee:1.9,public:true,returning:.5},{id:'performance-a',title:'지역 공연단',programs:['P08'],people:12+n('pa',3),slots:[1,2,3],maxFee:20,public:true,returning:.8})
  if(state.season===1) groups.push({id:'summer-yoga',title:'여름 건강 교실',programs:['P03','P04'],people:8,slots:[1,2,4],maxFee:.9,public:true,returning:.5})
  if(state.season===2&&state.year>=2) groups.push({id:'autumn-performance',title:'가을 작은 음악회',programs:['P08'],people:14,slots:[2,3,4],maxFee:22,public:true,returning:.6})
  if(state.season===3) groups.push({id:'winter-craft',title:'겨울 선물 만들기',programs:['P01','P02'],people:8,slots:[1,3,4],maxFee:1.2,public:true,returning:.4})
  return groups
}
function feeFor(inst:Institution,p:Program):number {
  if(['P05','P08','P10'].includes(p.id)) return p.income
  const premium=p.kind!=='community'&&getLevel(inst.xp[p.kind])>=2&&inst.priceMode==='premium'
  return p.income/p.capacity*(inst.priceMode==='discount'?.85:premium?1.15:1)
}
function workingCapabilities(inst:Institution,room:RoomId):string[] {
  return inst.inventory.filter(e=>e.room===room&&e.ready&&e.condition>=20).flatMap(e=>OFFER[e.id].capabilities).concat(room==='C'?['hall']:[])
}
interface Session {
  room:RoomId;slot:number;program:Program;capacity:number;bookings:{group:DemandGroup;people:number}[]
  attended:number; publicAttended:number; experience:number; revenue:number; cost:number; canceled:number
}
function finishTask(inst:Institution,task:Task) {
  if(task.kind==='install') {
    const e=inst.inventory.find(item=>item.id===task.equipment)!;e.ready=true
    const family=OFFER[e.id].family
    if(['craft','digital'].includes(family))roomOf(inst,task.room).mode='table'
    if(family==='mat')roomOf(inst,task.room).mode='floor'
    if(family==='stage')roomOf(inst,task.room).mode='stage'
  }
  if(task.kind==='maintain')inst.inventory.filter(e=>e.room===task.room).forEach(e=>{e.condition=Math.min(100,e.condition+40)})
  if(task.kind==='train'&&task.expertise)inst.xp[task.expertise]+=10
}
function runWeek(inst:Institution,demand:DemandGroup[],warnings:Set<string>):{stats:RawStats;activity:Activity[];revenue:number;cost:number;visits:number;publicVisits:number} {
  const stats=emptyStats();stats.weeks=1;stats.publicRequested=demand.filter(g=>g.public).reduce((sum,g)=>sum+g.people,0)
  let revenue=0,cost=0,visits=0,publicVisits=0
  const usedGroups=new Set<string>();const activity:Activity[]=[]
  // Provisional bookings are made once, then capacity/support can reduce actual attendance.
  const sessions:Session[]=[]
  for(let slot=0;slot<5;slot++)for(const roomId of ROOM_IDS){
    const room=roomOf(inst,roomId), id=inst.plan[roomId][slot]
    if(!room.open||!id)continue
    const p=PROGRAM[id]; if(!p)continue
    sessions.push({room:roomId,slot,program:p,capacity:Math.min(roomId==='C'?14:8,p.capacity),bookings:[],attended:0,publicAttended:0,experience:0,revenue:0,cost:0,canceled:0})
  }
  const eligible=(g:DemandGroup,s:Session)=>g.programs.includes(s.program.id)&&g.slots.includes(s.slot)&&feeFor(inst,s.program)<=g.maxFee+.0001&&canRunProgram(inst,s.room,s.program.id)
  const sorted=[...demand].sort((a,b)=>sessions.filter(s=>eligible(a,s)).length-sessions.filter(s=>eligible(b,s)).length||a.id.localeCompare(b.id))
  for(const g of sorted){
    if(usedGroups.has(g.id))continue
    const choices=sessions.filter(s=>eligible(g,s)).filter(s=>{
      const available=s.capacity-s.bookings.reduce((sum,b)=>sum+b.people,0)
      return ['P05','P08','P10'].includes(s.program.id)?s.bookings.length===0&&g.people<=available:available>0
    }).sort((a,b)=>{
      const value=(s:Session)=>{
        const xp=s.program.kind==='community'?0:getLevel(inst.xp[s.program.kind])*3
        const affordability=g.maxFee===0?100:100*(1-feeFor(inst,s.program)/g.maxFee)
        return .6*(70+xp)+.4*affordability
      }
      return value(b)-value(a)||a.slot-b.slot||a.room.localeCompare(b.room)
    })
    if(!choices.length)continue
    const chosen=choices[0];chosen.bookings.push({group:g,people:Math.min(g.people,chosen.capacity-chosen.bookings.reduce((sum,b)=>sum+b.people,0))});usedGroups.add(g.id)
  }
  for(let slot=0;slot<5;slot++){
    let support=SUPPORT[slot]+(slot>=3&&inst.supportContract?1:0)
    const blocked=new Set<RoomId>()
    for(const roomId of ROOM_IDS){
      const task=inst.pendingTasks.find(t=>t.room===roomId&&t.remaining>0)
      if(task&&support>0){support--;blocked.add(roomId);task.remaining--;if(task.remaining===0)finishTask(inst,task)}
    }
    inst.pendingTasks=inst.pendingTasks.filter(t=>t.remaining>0)
    for(const s of sessions.filter(s=>s.slot===slot)){
      const p=s.program,booked=s.bookings.reduce((sum,b)=>sum+b.people,0)
      if(!booked)continue
      const caps=workingCapabilities(inst,s.room),room=roomOf(inst,s.room)
      const returning=s.bookings.reduce((sum,b)=>sum+b.people*b.group.returning,0)/booked
      const fast=hasFamily(inst,'guide',undefined,true)&&inst.guideMode==='fast'&&['P05','P10'].includes(p.id)&&returning>=.75
      const required=Math.max(0,p.support-(fast?1:0))
      if(blocked.has(s.room)||!p.requires.every(cap=>caps.includes(cap))){s.canceled=booked;warnings.add(blocked.has(s.room)?'설치·정비 시간과 겹친 예약이 있었어요.':'장비 상태를 확인해 주세요.');stats.experienceWeight+=booked;continue}
      if(support<required){s.canceled=booked;warnings.add('같은 시간에 준비 인력이 부족했어요.');stats.experienceWeight+=booked;continue}
      support-=required
      const switching=p.mode!=='nook'&&p.mode!==room.mode
      const flexible=hasFamily(inst,'flex',s.room,true)&&p.mode!=='stage'&&room.mode!=='stage'
      const needSetup=switching&&!flexible
      const delayed=needSetup&&support<1
      if(needSetup&&support>=1)support--
      if(p.mode!=='nook')room.mode=p.mode
      const capacity=delayed?Math.floor(s.capacity*.75):s.capacity
      const rental=['P05','P08','P10'].includes(p.id)
      if(rental&&booked>capacity){s.canceled=booked;warnings.add('전환 준비가 늦어 대관 정원을 맞추지 못했어요.');stats.experienceWeight+=booked;continue}
      s.attended=Math.min(booked,capacity);s.canceled=booked-s.attended
      let remaining=s.attended
      for(const b of s.bookings){const admitted=Math.min(remaining,b.people);if(b.group.public)s.publicAttended+=admitted;remaining-=admitted}
      const premium=p.kind!=='community'&&getLevel(inst.xp[p.kind])>=2&&inst.priceMode==='premium'
      s.revenue=round(rental?p.income:feeFor(inst,p)*s.attended)
      s.cost=p.cost+(premium?1:0)
      if(freeCash(inst)+s.revenue<s.cost){s.attended=0;s.publicAttended=0;s.revenue=0;s.cost=0;s.canceled=booked;warnings.add('운영비가 부족한 활동은 쉬었어요. 다음 편성을 조정해 보세요.');stats.experienceWeight+=booked;continue}
      const neededEquipment=inst.inventory.filter(e=>e.room===s.room&&OFFER[e.id].capabilities.some(cap=>p.requires.includes(cap)))
      const worn=neededEquipment.some(e=>e.condition<50)
      const welcome=hasFamily(inst,'guide',undefined,true)&&inst.guideMode==='welcome'&&returning<.75
      s.experience=clamp(70+(p.kind==='community'?0:getLevel(inst.xp[p.kind])*3)+(premium?3:0)+(welcome?5:0)-(delayed?15:0)-(worn?5:0))
      inst.cash=round(inst.cash+s.revenue-s.cost)
      if(p.kind!=='community')inst.xp[p.kind]++
      for(const e of neededEquipment)e.condition=round(Math.max(0,e.condition-(e.id==='E01B'?.15:.25)))
      if(switching&&flexible){const e=inst.inventory.find(e=>e.room===s.room&&OFFER[e.id].family==='flex')!;e.condition=round(Math.max(0,e.condition-.25))}
      revenue+=s.revenue;cost+=s.cost;visits+=s.attended;publicVisits+=s.publicAttended
      stats.publicServed+=s.publicAttended;stats.experienceSum+=s.attended*s.experience;stats.experienceWeight+=booked;stats.use+=s.attended/s.capacity
      activity.push({room:s.room,slot,program:p.id,attendees:s.attended,capacity:s.capacity,experience:s.experience})
      if(delayed)warnings.add('방을 바꾸어 쓰는 준비 시간이 빠듯했어요.')
      if(worn)warnings.add('자주 쓰는 장비를 정비하면 이용 경험이 좋아져요.')
    }
    // Noise comes from activities that actually ran, never a canceled booking.
    const active=sessions.filter(s=>s.slot===slot&&s.attended>0&&s.room!=='C')
    for(const s of active){
      if(!['P01','P02','P07'].includes(s.program.id)||hasFamily(inst,'quiet',s.room,true))continue
      if(active.some(other=>other.room!==s.room&&['P08','P09'].includes(other.program.id))){
        const penalty=Math.min(10,s.experience);s.experience-=penalty;stats.experienceSum-=s.attended*penalty
        const visual=activity.find(a=>a.room===s.room&&a.slot===slot);if(visual)visual.experience=s.experience
        warnings.add('음악 활동과 조용한 수업의 시간을 나누어 보세요.')
      }
    }
  }
  const mean=stats.experienceWeight?stats.experienceSum/stats.experienceWeight:70
  const totalBooked=sessions.reduce((sum,s)=>sum+s.bookings.reduce((x,b)=>x+b.people,0),0)
  const canceled=sessions.reduce((sum,s)=>sum+s.canceled,0)
  if(totalBooked)inst.trust=clamp(inst.trust+clamp((mean-70)/20-canceled/Math.max(1,totalBooked),-1,1))
  return {stats,activity,revenue:round(revenue),cost:round(cost),visits,publicVisits}
}
function addStats(target:RawStats,source:RawStats){for(const key of Object.keys(source) as (keyof RawStats)[])target[key]+=source[key]}
function scoreStats(inst:Institution,stats:RawStats):{publicScore:number;experienceScore:number;utilization:number;score:number} {
  const publicScore=stats.publicRequested?clamp(100*stats.publicServed/stats.publicRequested):0
  const experienceScore=stats.experienceWeight?clamp(stats.experienceSum/stats.experienceWeight):0
  const utilization=clamp(100*stats.use/Math.max(1,8*stats.weeks))
  const buffer=clamp(100*freeCash(inst)/80)
  return {publicScore:round(publicScore),experienceScore:round(experienceScore),utilization:round(utilization),score:round(.4*publicScore+.35*experienceScore+.25*(.6*utilization+.4*buffer))}
}
function resolveInstitution(inst:Institution,state:Pick<GameState,'seed'|'year'|'season'>):SeasonReport {
  const beforeCash=inst.cash,trustStart=inst.trust,warnings=new Set<string>(),stats=emptyStats()
  // Only general repeat demand changes with trust; the common public-service denominator stays fixed.
  const demand=getDemand(state).map(group=>group.public?group:{...group,people:Math.max(1,Math.round(group.people*(1+.002*(trustStart-50))))})
  const weekly:SeasonReport['weekly']=[];let revenue=0,cost=0,visits=0,publicVisits=0;let activity:Activity[]=[]
  for(let week=0;week<13;week++){
    const outcome=runWeek(inst,demand,warnings);addStats(stats,outcome.stats)
    inst.trust=round(clamp(inst.trust,Math.max(0,trustStart-5),Math.min(100,trustStart+5)))
    revenue+=outcome.revenue;cost+=outcome.cost;visits+=outcome.visits;publicVisits+=outcome.publicVisits
    weekly.push({week:week+1,revenue:outcome.revenue,cost:outcome.cost,visits:outcome.visits})
    // A normal operating week is the representative animation; installation is visualized separately.
    if(week===1||activity.length===0)activity=outcome.activity
  }
  const fixed=actualBaseCost(inst)+maintenanceCost(inst)
  const released=inst.baseReserve+maintenanceCost(inst)
  inst.cash=round(inst.cash-fixed);inst.reserved=round(Math.max(0,inst.reserved-released));cost+=fixed
  addStats(inst.yearStats,stats)
  const scores=scoreStats(inst,state.season===3?inst.yearStats:stats)
  Object.assign(inst,scores);inst.history.push(scores.score)
  if(state.season===3)inst.annualScores.push(scores.score)
  const profit=round(revenue-cost)
  const highlights=[visits>0?`이번 계절 ${visits}번의 방문이 있었어요.`:'다음 계절에는 주민의 시간에 맞춰 문을 열어 보세요.',profit>=0?`운영 후 ${profit}점이 남았어요.`:`주민 서비스를 위해 ${Math.abs(profit)}점을 사용했어요.`]
  return {year:state.year,season:state.season,revenue:round(revenue),cost:round(cost),profit,visits,publicVisits,publicScore:scores.publicScore,experienceScore:scores.experienceScore,score:scores.score,rank:1,highlights,warnings:[...warnings],activity,weekly,beforeCash,afterCash:inst.cash,annual:state.season===3}
}
function priorityPrograms(id:string):ProgramId[] {
  if(id==='boram')return ['P02','P04','P06','P01','P03','P05','P07','P10','P09','P08']
  if(id==='rhythm'||id==='byeolbit')return ['P08','P10','P09','P05','P01','P03','P06','P02','P04','P07']
  if(id==='tantan')return ['P03','P09','P04','P05','P01','P06','P10','P02','P07','P08']
  if(id==='baeum')return ['P07','P01','P02','P10','P05','P06','P03','P04','P09','P08']
  return ['P01','P03','P10','P05','P02','P04','P06','P09','P07','P08']
}
function planUtility(inst:Institution,report:SeasonReport):number {
  const income=report.profit*.045
  if(inst.id==='boram')return report.publicScore*.65+report.experienceScore*.25+income
  if(inst.id==='neulpum'||inst.id==='pureun')return report.score*.6+report.profit*.2
  if(inst.id==='rhythm'||inst.id==='byeolbit')return report.score*.65+report.profit*.12
  return report.score+income
}
function optimizePlan(inst:Institution,state:Pick<GameState,'seed'|'year'|'season'>):void {
  const order=priorityPrograms(inst.id),plan=emptyPlan()
  const assigned=new Set<string>();const demand=getDemand(state)
  // Prefer scarce requests first, reserving actual staff support at each block.
  for(let slot=0;slot<5;slot++){
    let support=SUPPORT[slot]+(slot>=3&&inst.supportContract?1:0)
    const rooms=inst.rooms.filter(r=>r.open).sort((a,b)=>['rhythm','byeolbit'].includes(inst.id)?Number(b.id==='C')-Number(a.id==='C'):0)
    for(const room of rooms){
      const options=order.filter(id=>canRunProgram(inst,room.id,id)&&PROGRAM[id].support<=support).map(id=>{
        const p=PROGRAM[id]
        const g=demand.filter(g=>!assigned.has(g.id)&&g.programs.includes(id)&&g.slots.includes(slot)&&feeFor(inst,p)<=g.maxFee+.0001&&(!['P05','P08','P10'].includes(id)||g.people<=Math.min(room.id==='C'?14:8,p.capacity)))
        return {id,groups:g,value:g.reduce((sum,g)=>sum+g.people,0)+(order.length-order.indexOf(id))*.65}
      }).filter(x=>x.groups.length>0).sort((a,b)=>b.value-a.value||a.id.localeCompare(b.id))
      if(options.length){const choice=options[0];plan[room.id][slot]=choice.id;support-=PROGRAM[choice.id].support;assigned.add(choice.groups[0].id)}
    }
  }
  const before=copy(inst);const candidate=copy(inst);candidate.plan=plan
  const oldReport=resolveInstitution(before,state),newReport=resolveInstitution(candidate,state)
  if(planUtility(inst,newReport)>=planUtility(inst,oldReport))inst.plan=plan
  // Bounded local improvement by adding/removing/swapping a single program.
  for(let pass=0;pass<2;pass++){
    let best=planUtility(inst,resolveInstitution(copy(inst),state)),bestPlan:Plan|null=null
    for(const room of inst.rooms.filter(r=>r.open))for(let slot=0;slot<5;slot++)for(const id of [null,...order] as (ProgramId|null)[]){
      if(id!==null&&!canRunProgram(inst,room.id,id))continue
      if(inst.plan[room.id][slot]===id)continue
      const test=copy(inst);test.plan[room.id][slot]=id
      const utility=planUtility(inst,resolveInstitution(test,state))
      if(utility>best+.01){best=utility;bestPlan=copy(test.plan)}
    }
    if(bestPlan)inst.plan=bestPlan
  }
}
function chooseRivalPlan(inst:Institution,state:Pick<GameState,'seed'|'year'|'season'>):void {
  const turn=(state.year-1)*4+state.season
  for(const room of inst.rooms){if(inst.inventory.some(e=>e.room===room.id&&e.condition<35))maintainFor(inst,room.id)}
  const intentions:Record<string,{id:string;room:RoomId}[]>={
    boram:[{id:'E01',room:'A'},{id:'E02',room:'B'},{id:'E03',room:'A'},{id:'E10',room:'A'}],
    onnuri:[{id:'E01',room:'A'},{id:'E02',room:'A'},{id:'E03',room:'A'},{id:'E05',room:'B'},{id:'E08',room:'A'}],
    rhythm:[{id:'E05',room:'A'},{id:'E04',room:'C'},{id:'E07',room:'C'}],
    tantan:[{id:'E02',room:'B'},{id:'E04',room:'B'},{id:'E03',room:'B'},{id:'E01',room:'A'}],
    baeum:[{id:'E01B',room:'A'},{id:'E06',room:'A'},{id:'E05',room:'B'},{id:'E08',room:'A'}],
    saebom:[{id:'E02',room:'B'},{id:'E10',room:'A'},{id:'E06',room:'A'},{id:'E04B',room:'B'}],
    neulpum:[{id:'E01B',room:'A'},{id:'E02',room:'B'},{id:'E08',room:'A'}],
    pureun:[{id:'E08',room:'A'},{id:'E02',room:'B'},{id:'E01B',room:'A'},{id:'E04B',room:'B'}],
    byeolbit:[{id:'E02',room:'B'},{id:'E04',room:'C'},{id:'E07',room:'C'},{id:'E05',room:'A'}],
    daon:[{id:'E01',room:'A'},{id:'E02',room:'B'},{id:'E05',room:'A'},{id:'E04',room:'B'},{id:'E08',room:'A'}],
  }
  if(['rhythm','byeolbit'].includes(inst.id)&&turn>=2&&!roomOf(inst,'C').open)openFor(inst,state.season)
  if(turn%2===0||turn<2){
    const next=(intentions[inst.id]??[]).find(item=>!inst.inventory.some(e=>OFFER[e.id].family===OFFER[item.id].family))
    if(next)buyFor(inst,next.id,next.room,state.season)
  }
  if(roomOf(inst,'C').open&&hasFamily(inst,'stage')&&freeCash(inst)>100){inst.cash=round(inst.cash-24);inst.supportContract=true}
  optimizePlan(inst,state)
}
export function previewSeason(state:GameState):SeasonReport {
  if(state.phase!=='planning'&&state.lastReport)return copy(state.lastReport)
  const report=resolveInstitution(copy(state.player),state)
  report.rank=1+state.rivals.filter(r=>r.score>report.score).length;return report
}
export function runSeason(state:GameState):GameState {
  if(state.phase!=='planning')return state
  const next=copy(state)
  for(const rival of next.rivals)chooseRivalPlan(rival,next)
  const report=resolveInstitution(next.player,next)
  for(const rival of next.rivals)resolveInstitution(rival,next)
  report.rank=1+next.rivals.filter(r=>r.score>next.player.score).length
  next.lastReport=report;next.history.push(copy(report));next.phase='review';return next
}
export function nextSeason(state:GameState):GameState {
  if(state.phase!=='review')return state
  const next=copy(state)
  if(state.year===5&&state.season===3){next.phase='ending';return next}
  next.season=(state.season+1)%4
  if(next.season===0)next.year++
  for(const inst of [next.player,...next.rivals]){
    inst.supportContract=false;inst.trained=false
    if(next.season===0){inst.cash=round(inst.cash+480);inst.baseReserve=actualBaseCost(inst);inst.reserved=round(4*(inst.baseReserve+maintenanceCost(inst)));inst.yearStats=emptyStats()}
  }
  next.phase='planning';return next
}
export function finalScore(inst:Institution):number {
  if(!inst.annualScores.length)return inst.score
  return round(.5*(inst.annualScores.reduce((a,b)=>a+b,0)/inst.annualScores.length)+.5*inst.annualScores.at(-1)!)
}
export function validateSave(value:unknown):value is GameState {
  try {
  if(!value||typeof value!=='object')return false
  const s=value as Partial<GameState>
  if(s.version!==1||!Number.isInteger(s.seed)||!Number.isInteger(s.year)||s.year!<1||s.year!>5||!Number.isInteger(s.season)||s.season!<0||s.season!>3||!['planning','review','ending'].includes(String(s.phase))||!Array.isArray(s.rivals)||s.rivals.length!==10||!Array.isArray(s.history)||s.history.length>20)return false
  const valid=(x:unknown):x is Institution=>{
    if(!x||typeof x!=='object')return false
    const i=x as Institution
    if(typeof i.id!=='string'||typeof i.name!=='string'||typeof i.archetype!=='string'||!Number.isFinite(i.cash)||!Number.isFinite(i.reserved)||i.cash<0||i.reserved<0||i.reserved>i.cash+.01||!Number.isFinite(i.trust)||!Array.isArray(i.inventory)||!Array.isArray(i.rooms)||i.rooms.length!==3||!Array.isArray(i.pendingTasks)||!Array.isArray(i.history)||!Array.isArray(i.annualScores)||!i.xp||!i.yearStats)return false
    if(!ROOM_IDS.every(id=>i.rooms.some(r=>r.id===id&&typeof r.open==='boolean'&&Array.isArray(r.equipment))&&Array.isArray(i.plan?.[id])&&i.plan[id].length===5&&i.plan[id].every(p=>p===null||Boolean(PROGRAM[p]))))return false
    if(!i.inventory.every(e=>e&&Boolean(OFFER[e.id])&&Number.isFinite(e.condition)&&e.condition>=0&&e.condition<=100&&(e.room===null||ROOM_IDS.includes(e.room))))return false
    if(!i.pendingTasks.every(t=>['install','maintain','train','open'].includes(t.kind)&&ROOM_IDS.includes(t.room)&&Number.isInteger(t.remaining)&&t.remaining>0&&t.remaining<=5&&(t.kind!=='install'||Boolean(OFFER[t.equipment??'']))))return false
    return Object.values(i.xp).every(n=>Number.isFinite(n)&&n>=0)&&['culture','sport','event'].every(k=>Number.isFinite(i.xp[k as Expertise]))&&Number.isFinite(i.baseReserve)&&Object.keys(emptyStats()).every(k=>Number.isFinite(i.yearStats[k as keyof RawStats])&&i.yearStats[k as keyof RawStats]>=0)&&[i.score,i.publicScore,i.experienceScore,i.utilization,...i.history,...i.annualScores].every(Number.isFinite)&&['discount','standard','premium'].includes(i.priceMode)&&['fast','welcome'].includes(i.guideMode)
  }
  const validReport=(report:unknown):boolean=>{
    if(!report||typeof report!=='object')return false
    const r=report as SeasonReport
    return [r.year,r.season,r.revenue,r.cost,r.profit,r.visits,r.publicVisits,r.publicScore,r.experienceScore,r.score,r.rank,r.beforeCash,r.afterCash].every(Number.isFinite)&&Array.isArray(r.highlights)&&r.highlights.every(x=>typeof x==='string')&&Array.isArray(r.warnings)&&r.warnings.every(x=>typeof x==='string')&&Array.isArray(r.activity)&&r.activity.every(a=>a&&ROOM_IDS.includes(a.room)&&Boolean(PROGRAM[a.program])&&[a.slot,a.attendees,a.capacity,a.experience].every(Number.isFinite))&&Array.isArray(r.weekly)&&r.weekly.length===13&&r.weekly.every(w=>w&&[w.week,w.revenue,w.cost,w.visits].every(Number.isFinite))
  }
  return valid(s.player)&&s.rivals.every(valid)&&new Set(s.rivals.map(r=>r.id)).size===10&&s.history.every(validReport)&&(s.phase==='planning'||validReport(s.lastReport))
  } catch { return false }
}
