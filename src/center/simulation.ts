import { advanceFacilityProjects, facilityUpkeep, getFacilityRentMultiplier, planRivalFacility, validateFacilityProjects } from './facilityProjects.ts'
import type { FacilityProject } from './facilityProjects.ts'
import {advanceCampusProjects,campusBenefits,campusUpkeep,migrateCampusProjects,planRivalCampus,validateCampusProjects} from './campusProjects.ts'
import type {CampusProject} from './campusProjects.ts'
/** Pure, deterministic center simulation. Money never changes during animation. */
export type RoomId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
export type ProgramId = 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10' | 'P11' | 'P12' | 'P13' | 'P14' | 'P15' | 'P16' | 'P17' | 'P18' | 'P19' | 'P20' | 'P21'
export type Expertise = 'culture' | 'sport' | 'event'
export type Plan = Record<RoomId, (ProgramId | null)[]>
export interface Program {
  id: ProgramId; name: string; shortName: string; icon: string; color: string
  capacity: number; support: number; income: number; cost: number
  requires: string[]; mode: string; kind: Expertise | 'community'
  difficulty: '입문' | '중급' | '고급'; requirementLabel: string; minArea: number
  weeklyLimit?: number; reputationMultiplier?: number; specialty?: '수익' | '명성' | '균형'; exclusiveRoom?:RoomId
}
export interface Offer {
  id: string; name: string; price: number; maintenance: number; installSlots: number
  description: string; capabilities: string[]; family: string; icon: string; exclusiveRoom?:RoomId
}
export const SEASONS = ['봄', '여름', '가을', '겨울'] as const
export const MAX_YEARS = 6
export const MAX_TURNS = MAX_YEARS * 4
export const EVALUATION_INTERVAL = 2
export const BASE_ANNUAL_BUDGET = 900
export const BLOCKS = ['평일 오전', '평일 오후', '평일 저녁', '토요일', '일요일'] as const
export const ROOM_IDS:RoomId[] = ['A','B','C','D','E','F','G']
export interface RoomDefinition { id:RoomId; name:string; area:number; capacity:number; equipmentSlots:number; rentalBase:number; description:string }
export const ROOM_DEFINITIONS:RoomDefinition[] = [
  {id:'A',name:'소강당 1',area:80,capacity:32,equipmentSlots:2,rentalBase:12,description:'공예·운동·디지털 교육과 발표를 겸하는 다목적 공간'},
  {id:'B',name:'생활체육실',area:120,capacity:24,equipmentSlots:2,rentalBase:14,description:'넓은 바닥에서 운동과 춤을 즐기는 공간'},
  {id:'C',name:'대강당',area:300,capacity:120,equipmentSlots:3,rentalBase:30,description:'공연·행사와 많은 관객을 위한 공간'},
  {id:'D',name:'소강당 2',area:90,capacity:40,equipmentSlots:2,rentalBase:19,description:'설비에 따라 문화·체육·교육 수업을 바꾸는 다목적 공간'},
  {id:'E',name:'공예실',area:45,capacity:16,equipmentSlots:2,rentalBase:9,description:'재료와 도구를 펼쳐 손으로 만드는 공간'},
  {id:'F',name:'배움실',area:50,capacity:18,equipmentSlots:2,rentalBase:10,description:'컴퓨터 교육과 생활 강좌를 위한 공간'},
  {id:'G',name:'프리미엄회의실',area:40,capacity:12,equipmentSlots:2,rentalBase:18,description:'동아리와 주민의 작은 모임 공간'},
]
export const ROOM_NAMES=Object.fromEntries(ROOM_DEFINITIONS.map(r=>[r.id,r.name])) as Record<RoomId,string>
export const PROGRAMS: Program[] = [
  { id:'P01', difficulty:'입문',requirementLabel:'공예 세트',minArea:30, name:'공예 강좌', shortName:'공예', icon:'✂', color:'#5986b9', capacity:16, support:1, income:16, cost:13, requires:['craft'], mode:'table', kind:'culture' },
  { id:'P02', difficulty:'입문',requirementLabel:'공예 세트',minArea:30, name:'주민 공예 교실', shortName:'주민 공예', icon:'❋', color:'#86a69a', capacity:16, support:1, income:0, cost:5, requires:['craft'], mode:'table', kind:'culture' },
  { id:'P03', difficulty:'입문',requirementLabel:'생활체육 매트 세트',minArea:60, name:'요가 강좌', shortName:'요가', icon:'◡', color:'#d48173', capacity:18, support:1, income:14, cost:11, requires:['mat'], mode:'floor', kind:'sport' },
  { id:'P04', difficulty:'입문',requirementLabel:'생활체육 매트 세트',minArea:60, name:'주민 스트레칭', shortName:'스트레칭', icon:'☀', color:'#b3a277', capacity:18, support:1, income:0, cost:4, requires:['mat'], mode:'floor', kind:'sport' },
  { id:'P05', difficulty:'입문',requirementLabel:'기본 공간',minArea:0, name:'공간 대관', shortName:'공간 대관', icon:'⌂', color:'#8697a9', capacity:120, support:1, income:12, cost:2, requires:[], mode:'nook', kind:'community' },
  { id:'P06', difficulty:'입문',requirementLabel:'기본 가구 · 강사 진행',minArea:0, name:'생활안전 교실', shortName:'생활안전', icon:'♡', color:'#b495a9', capacity:10, support:1, income:0, cost:1, requires:[], mode:'nook', kind:'community' },
  { id:'P07', difficulty:'고급',requirementLabel:'디지털 교육 + 영상·발표 세트',minArea:40, name:'디지털 강좌', shortName:'디지털', icon:'▣', color:'#759eb1', capacity:18, support:1, income:20, cost:17, requires:['digital','screen'], mode:'table', kind:'culture' },
  { id:'P08', difficulty:'고급',requirementLabel:'대강당 + 음향 + 이동무대',minArea:200, name:'공연 대관', shortName:'공연', icon:'♫', color:'#9e8abe', capacity:120, support:2, income:36, cost:6, requires:['audio','stage','hall'], mode:'stage', kind:'event' },
  { id:'P09', difficulty:'중급',requirementLabel:'음향 + 생활체육 매트 세트',minArea:80, name:'댄스 강좌', shortName:'댄스', icon:'♪', color:'#d58393', capacity:20, support:1, income:18, cost:15, requires:['audio','mat'], mode:'floor', kind:'sport' },
  { id:'P10', difficulty:'중급',requirementLabel:'영상·발표 세트',minArea:0, name:'장비 포함 발표 대관', shortName:'발표 대관', icon:'▤', color:'#8f9b72', capacity:120, support:1, income:16, cost:3, requires:['screen'], mode:'seats', kind:'event' },
  { id:'P11', difficulty:'고급',requirementLabel:'생활체육 매트 + 필라테스 리포머',minArea:60, name:'기구 필라테스', shortName:'필라테스', icon:'◡', color:'#789488', capacity:10, support:1, income:48, cost:28, requires:['mat','reformer'], mode:'floor', kind:'sport', weeklyLimit:2, reputationMultiplier:.8, specialty:'수익', exclusiveRoom:'B' },
  { id:'P12', difficulty:'고급',requirementLabel:'공예 세트 + 안전 도예 가마',minArea:30, name:'전문 도예 공방', shortName:'전문 도예', icon:'✂', color:'#a77961', capacity:12, support:1, income:42, cost:28, requires:['craft','kiln'], mode:'table', kind:'culture', weeklyLimit:2, reputationMultiplier:1.8, specialty:'명성', exclusiveRoom:'E' },
  { id:'P13', difficulty:'고급',requirementLabel:'고성능 디지털 + 영상 제작 세트',minArea:40, name:'주민 영상 제작', shortName:'영상 제작', icon:'▣', color:'#7b89a1', capacity:12, support:1, income:48, cost:31, requires:['digitalPro','video'], mode:'table', kind:'culture', weeklyLimit:2, reputationMultiplier:1.25, specialty:'균형', exclusiveRoom:'F' },
  { id:'P14', difficulty:'고급',requirementLabel:'이동무대 + 음향 세트',minArea:200, name:'뮤지컬 워크숍', shortName:'뮤지컬', icon:'♫', color:'#9a7390', capacity:24, support:2, income:54, cost:36, requires:['stage','audio'], mode:'stage', kind:'event', weeklyLimit:2, reputationMultiplier:1.6, specialty:'명성', exclusiveRoom:'C' },
  { id:'P15', difficulty:'중급',requirementLabel:'영상·발표 + 녹화 코칭 세트',minArea:30, name:'스피치·발표 클리닉', shortName:'스피치', icon:'▤', color:'#7c95a0', capacity:10, support:1, income:40, cost:27, requires:['screen','recording'], mode:'seats', kind:'culture', weeklyLimit:2, reputationMultiplier:1.3, specialty:'균형', exclusiveRoom:'G' },
  { id:'P16', difficulty:'중급',requirementLabel:'실내 사이클 + 음향 세트',minArea:80, name:'실내 사이클 교실', shortName:'실내 사이클', icon:'◡', color:'#7d9a77', capacity:12, support:1, income:44, cost:29, requires:['cycle','audio'], mode:'floor', kind:'sport', weeklyLimit:2, reputationMultiplier:.9, specialty:'수익', exclusiveRoom:'B' },
  { id:'P17', difficulty:'고급',requirementLabel:'합주 악기 + 음향 세트',minArea:200, name:'주민 오케스트라', shortName:'오케스트라', icon:'♫', color:'#a48b65', capacity:24, support:2, income:56, cost:39, requires:['orchestra','audio'], mode:'stage', kind:'event', weeklyLimit:2, reputationMultiplier:1.9, specialty:'명성', exclusiveRoom:'C' },
  { id:'P18', difficulty:'중급',requirementLabel:'이동무대 + 무대 조명 세트',minArea:200, name:'무대기술 교실', shortName:'무대기술', icon:'☼', color:'#857fa1', capacity:16, support:1, income:44, cost:29, requires:['stage','lighting'], mode:'stage', kind:'event', weeklyLimit:2, reputationMultiplier:1.35, specialty:'균형', exclusiveRoom:'C' },
  { id:'P19', difficulty:'중급',requirementLabel:'공예 세트 + 목공 작업 세트',minArea:30, name:'생활 목공 교실', shortName:'목공', icon:'✂', color:'#a38358', capacity:12, support:1, income:36, cost:23, requires:['craft','wood'], mode:'table', kind:'culture', weeklyLimit:2, reputationMultiplier:1.35, specialty:'균형', exclusiveRoom:'E' },
  { id:'P20', difficulty:'중급',requirementLabel:'영상·발표 + 외국어 토론 세트',minArea:30, name:'외국어 토론 클럽', shortName:'외국어 토론', icon:'▤', color:'#78958c', capacity:10, support:1, income:34, cost:22, requires:['screen','interpret'], mode:'seats', kind:'culture', weeklyLimit:2, reputationMultiplier:1.1, specialty:'균형', exclusiveRoom:'G' },
  { id:'P21', difficulty:'고급',requirementLabel:'디지털 교육 + 피칭 코칭 세트',minArea:30, name:'창업 피칭 스튜디오', shortName:'창업 피칭', icon:'▣', color:'#a28069', capacity:10, support:1, income:46, cost:30, requires:['digital','pitch'], mode:'table', kind:'culture', weeklyLimit:2, reputationMultiplier:1.2, specialty:'수익', exclusiveRoom:'G' },
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
  { id:'E06B', name:'고성능 디지털 교육 세트', price:420, maintenance:5, installSlots:2, description:'기존 컴퓨터 교육과 영상 편집을 함께 준비해요. 영상 제작 세트와 조합해요.', capabilities:['digital','digitalPro'], family:'digital', icon:'▣' },
  { id:'E07', name:'이동무대·좌석 세트', price:160, maintenance:4, installSlots:2, description:'대강당에서 음향과 함께 공연을 준비해요.', capabilities:['stage'], family:'stage', icon:'▰' },
  { id:'E08', name:'절전 설비', price:110, maintenance:1, installSlots:1, description:'센터 기본운영비를 계절마다 12점 줄여요.', capabilities:['energy'], family:'energy', icon:'☼' },
  { id:'E09', name:'이동식 공간 분리 설비', price:140, maintenance:2, installSlots:1, description:'옆방의 음악 때문에 생기는 불편을 줄여요.', capabilities:['quiet'], family:'quiet', icon:'▥' },
  { id:'E10', name:'예약·안내 도구', price:100, maintenance:3, installSlots:1, description:'반복 대관 접수를 줄이거나 처음 온 주민을 안내해요.', capabilities:['guide'], family:'guide', icon:'⌘' },
  { id:'E11', name:'필라테스 리포머 세트', price:720, maintenance:4, installSlots:2, description:'생활체육실에서 매트와 함께 기구 필라테스를 열어요.', capabilities:['reformer'], family:'reformer', icon:'◡', exclusiveRoom:'B' },
  { id:'E12', name:'안전 도예 가마 세트', price:560, maintenance:3, installSlots:2, description:'공예실에서 공예 도구와 함께 작품을 굽는 전문 도예 공방을 준비해요.', capabilities:['kiln'], family:'kiln', icon:'✂', exclusiveRoom:'E' },
  { id:'E13', name:'영상 제작 세트', price:360, maintenance:3, installSlots:2, description:'배움실의 촬영·녹음·발표 장비예요. 고성능 디지털과 영상 제작을 열어요.', capabilities:['video','screen'], family:'video', icon:'▣', exclusiveRoom:'F' },
  { id:'E14', name:'녹화 코칭 세트', price:340, maintenance:3, installSlots:2, description:'발표 모습을 녹화해 말하기와 전달력을 연습해요.', capabilities:['recording'], family:'recording', icon:'▣', exclusiveRoom:'G' },
  { id:'E15', name:'실내 사이클 세트', price:380, maintenance:3, installSlots:2, description:'음악과 함께 실내 사이클 수업을 운영해요.', capabilities:['cycle'], family:'cycle', icon:'◡', exclusiveRoom:'B' },
  { id:'E16', name:'합주 악기 세트', price:480, maintenance:4, installSlots:2, description:'주민 오케스트라를 위한 공용 연습 악기를 준비해요.', capabilities:['orchestra'], family:'orchestra', icon:'♫', exclusiveRoom:'C' },
  { id:'E17', name:'무대 조명 세트', price:300, maintenance:3, installSlots:2, description:'무대에서 조명과 공연 진행 기술을 실습해요.', capabilities:['lighting'], family:'lighting', icon:'☼', exclusiveRoom:'C' },
  { id:'E18', name:'목공 작업 세트', price:320, maintenance:3, installSlots:2, description:'공예실의 작업대와 안전 도구로 생활 목공을 배워요.', capabilities:['wood'], family:'wood', icon:'✂', exclusiveRoom:'E' },
  { id:'E19', name:'외국어 토론 세트', price:260, maintenance:2, installSlots:1, description:'회의실의 듣기·녹음 장비와 자료로 외국어 토론을 도와요.', capabilities:['interpret'], family:'interpret', icon:'▤', exclusiveRoom:'G' },
  { id:'E20', name:'피칭 코칭 세트', price:460, maintenance:3, installSlots:2, description:'컴퓨터와 함께 발표·사업 제안 수업을 준비해요.', capabilities:['pitch'], family:'pitch', icon:'▣', exclusiveRoom:'G' },
]

const PROGRAM = Object.fromEntries(PROGRAMS.map(p => [p.id,p])) as Record<ProgramId,Program>
const OFFER = Object.fromEntries(OFFERS.map(p => [p.id,p])) as Record<string,Offer>
const ROOM = Object.fromEntries(ROOM_DEFINITIONS.map(r => [r.id,r])) as Record<RoomId,RoomDefinition>
const ROOM_CLASSES:Record<RoomId,ProgramId[]>={
  A:['P01','P02','P03','P04','P06','P07','P09'],
  B:['P03','P04','P06','P09','P11','P16'],
  C:['P03','P04','P06','P09','P14','P17','P18'],
  D:['P01','P02','P03','P04','P06','P07','P09'],
  E:['P01','P02','P06','P12','P19'],
  F:['P01','P02','P06','P07','P13'],
  G:['P06','P07','P15','P20','P21'],
}
const COMMON_FAMILIES = ['energy','guide']
export const PREPARATION_SUPPORT = [5,5,5,4,4] as const
const round = (n:number) => Math.round((n+Number.EPSILON)*100)/100
const clamp = (n:number,low=0,high=100) => Math.max(low,Math.min(high,n))
const copy = <T>(value:T):T => structuredClone(value)
const hash = (text:string):number => { let h=2166136261; for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)} return h>>>0 }

export interface Room { id:RoomId; open:boolean; equipment:string[]; mode:string; management:number; facilityQuality:number; facilityUpkeep:number }
export interface Equipment { id:string; instanceId:string; room:RoomId|null; condition:number; ready:boolean; stored?:boolean }
export interface Task { kind:'install'|'maintain'|'train'|'open'; room:RoomId; remaining:number; equipment?:string; expertise?:Expertise }
interface RawStats { publicServed:number; publicRequested:number; experienceSum:number; experienceWeight:number; use:number; weeks:number }
export interface EvaluationStats extends RawStats { revenue:number; cost:number; grants:number; seasons:number; reputationSum:number }
export type EvaluationComponent = 'reputation'|'financial'|'satisfaction'|'publicService'
export interface EvaluationRecord {
  year:number; score:number; rank:number; participants:number
  award:'대통령상'|'국무총리상'|'장관상'|null
  components:Record<EvaluationComponent,number>
  budgetChange:number; nextAnnualBudget:number; appliesFromYear:number|null; appliesThroughYear:number|null
  measuredSeasons:number; partial:boolean
}
export const EVALUATION_COMPONENTS:{key:EvaluationComponent;label:string;weight:number;formula:string}[] = [
  {key:'reputation',label:'명성',weight:25,formula:'평가 기간의 계절말 명성 평균'},
  {key:'financial',label:'재정 건전성',weight:20,formula:'운영비 대비 수입·보조금 충당률 60% + 유보금과 다음 계절 고정비 지급여력 40% (각 100점 상한; 시설·장비 구입비는 운영비 제외)'},
  {key:'satisfaction',label:'주민 만족',weight:30,formula:'실제 방문 만족도 합계 ÷ 예약 인원 (취소된 예약은 0점)'},
  {key:'publicService',label:'공공서비스',weight:25,formula:'공공서비스 실제 참여 인원 ÷ 신청 인원 × 100'},
]
export interface RentalRequest {
  id:string; room:RoomId; slot:number; client:string; title:string; program:ProgramId
  attendees:number; fee:number; cost:number; status:'pending'|'accepted'|'declined'
}
export interface Institution {
  id:string; name:string; archetype:string; cash:number; reserved:number; plan:Plan
  rooms:Room[]; inventory:Equipment[]; xp:Record<Expertise,number>; trust:number; reputation:number
  score:number; publicScore:number; experienceScore:number; utilization:number
  history:number[]; lastPurchase:string; pendingTasks:Task[]; baseReserve:number
  yearStats:RawStats; supportContract:boolean; priceMode:'discount'|'standard'|'premium'
  guideMode:'fast'|'welcome'; trained:boolean; annualScores:number[]; rentalRequests:RentalRequest[]; facilityProjects:FacilityProject[]; campusProjects:CampusProject[]
  annualBudget:number; evaluations:EvaluationRecord[]; evaluationStats:EvaluationStats
}
export interface Activity { room:RoomId; slot:number; program:ProgramId; attendees:number; capacity:number; experience:number }
export interface SeasonReport {
  year:number; season:number; revenue:number; cost:number; profit:number; visits:number
  publicVisits:number; publicScore:number; experienceScore:number; score:number; rank:number
  highlights:string[]; warnings:string[]; activity:Activity[]
  weekly:{week:number;revenue:number;cost:number;visits:number}[]
  beforeCash:number; afterCash:number; annual:boolean
  rentalRevenue:number; classRevenue:number; rentalCost:number; classCost:number; reputationChange:number
  breakdownAvailable?:boolean
  participants?:number
  evaluation?:EvaluationRecord
}
export interface GameState {
  version:2; seed:number; year:number; season:number; phase:'planning'|'review'|'ending'
  specialtyRulesVersion?:1; migrationNotices?:string[]
  planningStage:'rentals'|'classes'; player:Institution; rivals:Institution[]
  lastReport:SeasonReport|null; history:SeasonReport[]
}
export interface DemandGroup { id:string; title:string; programs:ProgramId[]; people:number; slots:number[]; maxFee:number; public:boolean; returning:number }
export interface MutationResult { state:GameState; error?:string }
export interface ProgramRequirements { ready:boolean; roomCompatible:boolean; missingFamilies:string[]; pendingFamilies:string[]; wornFamilies:string[]; spaceRequired:number; spaceReady:boolean }
type Calendar = Pick<GameState,'seed'|'year'|'season'>
const emptyStats = ():RawStats => ({publicServed:0,publicRequested:0,experienceSum:0,experienceWeight:0,use:0,weeks:0})
const emptyEvaluationStats = (grants=0):EvaluationStats => ({...emptyStats(),revenue:0,cost:0,grants,seasons:0,reputationSum:0})
const emptyPlan = ():Plan => Object.fromEntries(ROOM_IDS.map(id=>[id,[null,null,null,null,null]])) as Plan
const roomOf = (inst:Institution,id:RoomId):Room|undefined => inst.rooms.find(r=>r.id===id)
const maintenanceCost = (inst:Institution):number => inst.inventory.reduce((sum,e)=>sum+OFFER[e.id].maintenance,0)
const hasFamily = (inst:Institution,family:string,room?:RoomId):boolean => inst.inventory.some(e=>!e.stored&&OFFER[e.id]?.family===family&&(room===undefined||e.room===room)&&e.ready&&e.condition>=20)
const actualBaseCost = (inst:Institution):number => 80-(hasFamily(inst,'energy')?12:0)
export function getLevel(xp:number):number { return [0,20,60,120,200].filter(n=>xp>=n).length-1 }
export function freeCash(inst:Institution):number { return round(Math.max(0,inst.cash-inst.reserved)) }
export function isRentalProgram(id:ProgramId|string):boolean { return ['P05','P08','P10'].includes(id) }
/** Room purpose only; opening, equipment installation and floor area are separate checks. */
export function roomSupportsProgram(room:RoomId,program:ProgramId):boolean {
  if(!ROOM[room]||!PROGRAM[program])return false
  if(PROGRAM[program].exclusiveRoom&&PROGRAM[program].exclusiveRoom!==room)return false
  if(program==='P05'||program==='P10')return true
  if(program==='P08')return room==='C'
  return ROOM_CLASSES[room].includes(program)
}
/** Buying new gear is restricted; old saves may retain incompatible gear for relocation. */
export function roomSupportsOffer(room:RoomId,offerId:string):boolean {
  const offer=OFFER[offerId]
  if(!ROOM[room]||!offer)return false
  if(offer.exclusiveRoom&&offer.exclusiveRoom!==room)return false
  if([...COMMON_FAMILIES,'quiet','flex'].includes(offer.family))return true
  return PROGRAMS.some(program=>roomSupportsProgram(room,program.id)&&offer.capabilities.some(capability=>program.requires.includes(capability)))
}
export function roomCapacity(room:RoomId,program?:ProgramId):number { return Math.min(ROOM[room]?.capacity??0,program?PROGRAM[program]?.capacity??0:Infinity) }
export function getRoomManagement(inst:Institution,room:RoomId):number {
  const value=roomOf(inst,room); if(!value)return 0
  const equipment=inst.inventory.filter(e=>e.room===room&&e.ready)
  return round(clamp(equipment.length?.7*value.management+.3*equipment.reduce((n,e)=>n+e.condition,0)/equipment.length:value.management))
}
export function getProgramRequirements(inst:Institution,room:RoomId,program:ProgramId):ProgramRequirements {
  const p=PROGRAM[program],target=roomOf(inst,room),missingFamilies:string[]=[],pendingFamilies:string[]=[],wornFamilies:string[]=[]
  if(!p)return {ready:false,roomCompatible:false,missingFamilies:[],pendingFamilies:[],wornFamilies:[],spaceRequired:0,spaceReady:false}
  const roomCompatible=roomSupportsProgram(room,program)
  const spaceReady=Boolean(target?.open)&&Boolean(ROOM[room])&&ROOM[room].area>=p.minArea&&(!p.requires.includes('hall')||room==='C')
  for(const family of p.requires.filter(f=>f!=='hall')){
    const gear=inst.inventory.filter(e=>!e.stored&&e.room===room&&OFFER[e.id]?.capabilities.includes(family))
    if(!gear.length)missingFamilies.push(family)
    else if(!gear.some(e=>e.ready))pendingFamilies.push(family)
    else if(!gear.some(e=>e.ready&&e.condition>=20))wornFamilies.push(family)
  }
  return {ready:roomCompatible&&spaceReady&&!missingFamilies.length&&!pendingFamilies.length&&!wornFamilies.length,roomCompatible,missingFamilies,pendingFamilies,wornFamilies,spaceRequired:p.minArea,spaceReady}
}
export function canRunProgram(inst:Institution,room:RoomId,program:ProgramId):boolean { return getProgramRequirements(inst,room,program).ready }
export function getProgramWeeklyCount(inst:Institution,program:ProgramId):number { return ROOM_IDS.reduce((sum,room)=>sum+inst.plan[room].filter(id=>id===program).length,0) }
export function getProgramPlacementError(inst:Institution,room:RoomId,slot:number,program:ProgramId):string|undefined {
  if(!ROOM_IDS.includes(room)||!Number.isInteger(slot)||slot<0||slot>=BLOCKS.length)return '편성할 공간과 시간을 확인해 주세요.'
  if(!PROGRAM[program]||isRentalProgram(program))return '편성할 클래스를 골라 주세요.'
  if(getRentalAt(inst,room,slot))return '승인한 대관을 취소한 뒤 편성할 수 있어요.'
  if(!canRunProgram(inst,room,program))return '이 방의 용도·면적과 필수 설비 설치·정비를 확인해 주세요.'
  const limit=PROGRAM[program].weeklyLimit
  if(limit&&getProgramWeeklyCount(inst,program)-(inst.plan[room][slot]===program?1:0)>=limit)return `${PROGRAM[program].shortName}는 센터 전체에서 주 ${limit}회까지 편성해요.`
}
export function getRentalAt(inst:Institution,room:RoomId,slot:number):RentalRequest|undefined { return inst.rentalRequests.find(r=>r.room===room&&r.slot===slot&&r.status==='accepted') }

function initialInstitution(id:string,name:string,archetype:string):Institution {
  return {id,name,archetype,cash:1080,reserved:320,plan:emptyPlan(),rooms:ROOM_IDS.map(id=>({id,open:!['C','D','G'].includes(id),equipment:[],mode:id==='B'?'floor':id==='G'?'nook':'seats',management:90,facilityQuality:100,facilityUpkeep:0})),inventory:[],xp:{culture:0,sport:0,event:0},trust:50,reputation:30,score:0,publicScore:0,experienceScore:0,utilization:0,history:[],lastPurchase:'아직 없음',pendingTasks:[],baseReserve:80,yearStats:emptyStats(),supportContract:false,priceMode:'standard',guideMode:'welcome',trained:false,annualScores:[],rentalRequests:[],facilityProjects:[],campusProjects:[],annualBudget:BASE_ANNUAL_BUDGET,evaluations:[],evaluationStats:emptyEvaluationStats(BASE_ANNUAL_BUDGET)}
}
function generateRentals(inst:Institution,state:Calendar):RentalRequest[] {
  const result:RentalRequest[]=[]
  const clients=['동네 생활모임','지역 독서회','청년 기획단','마을 동아리','주민 학습회','동네 소상공인회','생활문화 모임']
  for(const room of inst.rooms.filter(r=>r.open)){
    const definition=ROOM[room.id],management=getRoomManagement(inst,room.id)
    // Fixed per-season draw gives gradual management value without reload rerolls.
    const managementDraw=hash(`${state.seed}:${state.year}:${state.season}:${inst.id}:${room.id}:management`)%10000/10000
    const managementBonus=managementDraw<clamp((management-60)/40,0,1)*.5?1:0
    const count=1+Math.floor(inst.reputation/40)+managementBonus
    const first=hash(`${state.seed}:${state.year}:${state.season}:${inst.id}:${room.id}:slot`)%5
    for(let index=0;index<count+(room.id==='A'||room.id==='C'?1:0);index++){
      const alternate=index===count&&(room.id==='A'||room.id==='C')
      const slot=alternate?first:(first+index*2)%5
      const n=hash(`${state.seed}:${state.year}:${state.season}:${inst.id}:${room.id}:${index}`)
      const program:ProgramId=room.id==='C'&&canRunProgram(inst,room.id,'P08')?'P08':canRunProgram(inst,room.id,'P10')&&n%2===0?'P10':'P05'
      const premium=program==='P08'?1.45:program==='P10'?1.2:1
      const condition=.55+inst.reputation*.005+management*.003
      const fee=round(definition.rentalBase*condition*(.95+(n%11)/100)*premium*getFacilityRentMultiplier(inst,room.id)*(1+campusBenefits(inst).rental))
      const attendees=Math.max(4,Math.min(roomCapacity(room.id,program),Math.floor(definition.capacity*(.35+(n%40)/100))))
      result.push({id:`${state.year}-${state.season}-${inst.id}-${room.id}-${index}`,room:room.id,slot,client:clients[n%clients.length],title:program==='P08'?'정기 공연 대관':program==='P10'?'발표·세미나 대관':room.id==='B'?'동호회 공간 대관':'정기 모임 대관',program,attendees,fee,cost:round(Math.max(1,definition.rentalBase*.12)+fee*.48+(program==='P08'?2:program==='P10'?1:0)),status:'pending'})
    }
  }
  // Local rental demand is shared across the center, not multiplied endlessly by rooms.
  const limit=6+Math.floor(inst.reputation/12)
  const primary=result.filter(r=>!result.some(other=>other!==r&&other.room===r.room&&other.slot===r.slot&&other.id.localeCompare(r.id)<0))
  const selected=primary.sort((a,b)=>hash(`${state.seed}:${state.year}:${state.season}:${a.id}:market`)-hash(`${state.seed}:${state.year}:${state.season}:${b.id}:market`)).slice(0,limit)
  const keys=new Set(selected.map(r=>`${r.room}:${r.slot}`))
  return result.filter(r=>keys.has(`${r.room}:${r.slot}`))
}
export function createGame(seed=20261105):GameState {
  const definitions=[['boram','보람','주민 서비스'],['rhythm','리듬','공연 수입'],['tantan','탄탄','생활체육'],['baeum','배움','문화 교육'],['saebom','새봄','새로운 시도'],['neulpum','늘품','정비와 절약'],['pureun','푸른','에너지 효율'],['byeolbit','별빛','공간 확장'],['daon','다온','균형 성장']]
  const state:GameState={version:2,specialtyRulesVersion:1,seed,year:1,season:0,phase:'planning',planningStage:'rentals',player:initialInstitution('player','우리 센터','나만의 운영'),rivals:definitions.map(([id,name,kind])=>initialInstitution(id,name+'센터',kind)),lastReport:null,history:[]}
  for(const inst of [state.player,...state.rivals])inst.rentalRequests=generateRentals(inst,state)
  return state
}
function decideFor(inst:Institution,id:string,status:RentalRequest['status']):string|undefined {
  const request=inst.rentalRequests.find(r=>r.id===id)
  if(!request)return '대관 신청을 찾을 수 없어요.'
  if(!['accepted','declined','pending'].includes(status))return '검토 상태를 확인해 주세요.'
  if(request.status===status)return
  if(status==='accepted'){
    const other=getRentalAt(inst,request.room,request.slot)
    if(other&&other.id!==id)return '같은 시간에 이미 승인한 대관이 있어요.'
    if(inst.plan[request.room][request.slot]!==null)return '기존 클래스를 비운 뒤 이 대관을 승인해 주세요.'
    if(!canRunProgram(inst,request.room,request.program))return '이 공간의 필수 설비 설치·정비를 먼저 마쳐 주세요.'
    if(request.attendees>roomCapacity(request.room,request.program))return '신청 인원이 공간 정원을 넘어요.'
    inst.plan[request.room][request.slot]=request.program
  } else if(request.status==='accepted') inst.plan[request.room][request.slot]=null
  request.status=status
}
export function decideRental(state:GameState,id:string,status:RentalRequest['status']):MutationResult {
  if(state.phase!=='planning'||state.planningStage!=='rentals')return {state,error:'대관 검토 단계에서 변경해 주세요.'}
  const next=copy(state),error=decideFor(next.player,id,status)
  return error?{state,error}:{state:next}
}
/** Called only after the player confirms the named class cancellation in the UI. */
export function replaceClassWithRental(state:GameState,id:string):MutationResult {
  if(state.phase!=='planning'||state.planningStage!=='rentals')return {state,error:'대관 검토 단계에서 변경해 주세요.'}
  const request=state.player.rentalRequests.find(item=>item.id===id)
  if(!request)return {state,error:'대관 신청을 찾을 수 없어요.'}
  const existing=state.player.plan[request.room][request.slot]
  if(existing&&isRentalProgram(existing))return decideRental(state,id,'accepted')
  const cleared=setProgram(state,request.room,request.slot,null)
  const result=decideRental(cleared,id,'accepted')
  // If the replacement cannot be accepted, retain the original class and all state.
  return result.error?{state,error:result.error}:result
}
export function finishRentalReview(state:GameState):GameState {
  if(state.phase!=='planning'||state.planningStage!=='rentals')return state
  const next=copy(state);for(const r of next.player.rentalRequests)if(r.status==='pending')r.status='declined'
  next.planningStage='classes';return next
}
export function reopenRentalReview(state:GameState):GameState {
  if(state.phase!=='planning'||state.planningStage==='rentals')return state
  const next=copy(state);next.planningStage='rentals';return next
}
export function setProgram(state:GameState,room:RoomId,slot:number,program:ProgramId|null):GameState {
  if(state.phase!=='planning'||!ROOM_IDS.includes(room)||!Number.isInteger(slot)||slot<0||slot>4||getRentalAt(state.player,room,slot))return state
  if(program!==null&&(state.planningStage!=='classes'||getProgramPlacementError(state.player,room,slot,program)))return state
  const next=copy(state);next.player.plan[room][slot]=program;return next
}
function buyFor(inst:Institution,offerId:string,room:RoomId,season:number):string|undefined {
  const offer=OFFER[offerId],target=roomOf(inst,room)
  if(!offer)return '물품을 찾을 수 없어요.'
  if(!target?.open)return '먼저 사용할 공간을 확인해 주세요.'
  const common=COMMON_FAMILIES.includes(offer.family),location=common?null:room
  if(inst.inventory.some(e=>!e.stored&&e.room===location&&OFFER[e.id].family===offer.family))return common?'센터 공용 설비를 이미 보유하고 있어요.':'이 방에는 같은 물품군이 이미 있어요.'
  if(offer.family==='stage'&&room!=='C')return '이 무대는 대강당에 설치할 수 있어요.'
  if(!roomSupportsOffer(room,offerId))return `${ROOM_NAMES[room]}의 용도에 맞는 수업 장비를 골라 주세요.`
  if(!common&&!['flex','quiet'].includes(offer.family)&&inst.inventory.filter(e=>e.room===room&&!['flex','quiet'].includes(OFFER[e.id].family)).length>=ROOM[room].equipmentSlots)return '이 방의 장비 자리가 모두 찼어요.'
  const reserve=offer.maintenance*(4-season)
  if(freeCash(inst)<offer.price+reserve)return `구매비와 올해 유지비를 합쳐 ${offer.price+reserve}점이 필요해요.`
  let serial=1;while(inst.inventory.some(e=>e.instanceId===`${inst.id}-${offer.id}-${serial}`))serial++
  const instanceId=`${inst.id}-${offer.id}-${serial}`
  inst.cash=round(inst.cash-offer.price);inst.reserved=round(inst.reserved+reserve)
  inst.inventory.push({id:offer.id,instanceId,room:location,condition:100,ready:false})
  if(location)target.equipment.push(offer.id)
  inst.pendingTasks.push({kind:'install',room,remaining:offer.installSlots,equipment:instanceId});inst.lastPurchase=`${ROOM_NAMES[room]} · ${offer.name}`
}
export function buyEquipment(state:GameState,offerId:string,room:RoomId):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 조달을 요청할 수 있어요.'}
  const next=copy(state),error=buyFor(next.player,offerId,room,state.season);return error?{state,error}:{state:next}
}
function equipmentOf(inst:Institution,id:string):Equipment|undefined {
  const exact=inst.inventory.find(e=>e.instanceId===id);if(exact)return exact
  const offers=inst.inventory.filter(e=>e.id===id);return offers.length===1?offers[0]:undefined
}
export function moveEquipment(state:GameState,equipmentId:string,targetRoom:RoomId,options:{allowClearPlan?:boolean}={}):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 장비를 옮길 수 있어요.'}
  const equipment=equipmentOf(state.player,equipmentId)
  if(!equipment)return {state,error:'옮길 장비를 개별 선택해 주세요.'}
  if(equipment.stored)return {state,error:'보관 장비는 재설치를 선택해 주세요.'}
  if(equipment.room===null)return {state,error:'센터 공용 설비는 방 사이로 옮기지 않아요.'}
  if(!equipment.ready)return {state,error:'설치·이전 작업이 끝난 뒤 옮길 수 있어요.'}
  if(equipment.room===targetRoom)return {state,error:'이미 이 방에 있는 장비예요.'}
  if(!roomOf(state.player,targetRoom)?.open)return {state,error:'옮길 공간을 확인해 주세요.'}
  const offer=OFFER[equipment.id]
  if(offer.family==='stage'&&targetRoom!=='C')return {state,error:'이 무대는 대강당에서 사용할 수 있어요.'}
  if(!roomSupportsOffer(targetRoom,equipment.id))return {state,error:`${ROOM_NAMES[targetRoom]}에서는 이 장비를 사용하는 수업을 운영하지 않아요.`}
  if(state.player.inventory.some(e=>e.room===targetRoom&&OFFER[e.id].family===offer.family))return {state,error:'옮길 방에 같은 물품군이 있어요.'}
  if(!['flex','quiet'].includes(offer.family)&&state.player.inventory.filter(e=>e.room===targetRoom&&!['flex','quiet'].includes(OFFER[e.id].family)).length>=ROOM[targetRoom].equipmentSlots)return {state,error:'옮길 방의 장비 자리가 모두 찼어요.'}
  const impact=getStorageImpact(state.player,equipment.instanceId)
  if(impact.rentalIds.length)return {state,error:'이 장비가 필요한 승인 대관을 먼저 취소해 주세요.'}
  if(impact.slots.length&&options.allowClearPlan!==true)return {state,error:`이 장비가 필요한 클래스 ${impact.slots.length}칸을 비우는지 확인해 주세요.`}
  if(freeCash(state.player)<8)return {state,error:'장비 이전에 8점이 필요해요.'}
  const next=copy(state),moved=equipmentOf(next.player,equipment.instanceId)!
  for(const slot of impact.slots)next.player.plan[moved.room!][slot]=null
  roomOf(next.player,moved.room!)!.equipment=roomOf(next.player,moved.room!)!.equipment.filter(id=>id!==moved.id)
  moved.room=targetRoom;moved.ready=false;roomOf(next.player,targetRoom)!.equipment.push(moved.id)
  next.player.cash=round(next.player.cash-8);next.player.evaluationStats.cost+=8;next.player.pendingTasks.push({kind:'install',room:targetRoom,remaining:1,equipment:moved.instanceId})
  return {state:next}
}
export interface StorageImpact { room:RoomId|null; programs:ProgramId[]; slots:number[]; rentalIds:string[] }
/** The caller can show precisely which classes would be cleared before confirming. */
export function getStorageImpact(inst:Institution,equipmentId:string):StorageImpact {
  const equipment=equipmentOf(inst,equipmentId)
  if(!equipment||equipment.stored||equipment.room===null)return {room:null,programs:[],slots:[],rentalIds:[]}
  const room=equipment.room,capabilities=OFFER[equipment.id].capabilities
  const without=copy(inst);without.inventory=without.inventory.filter(item=>item.instanceId!==equipment.instanceId)
  const affected=(program:ProgramId)=>PROGRAM[program].requires.some(cap=>capabilities.includes(cap))&&!canRunProgram(without,room,program)
  const slots=inst.plan[room].flatMap((program,slot)=>program&&!isRentalProgram(program)&&affected(program)?[slot]:[])
  return {room,slots,programs:[...new Set(slots.map(slot=>inst.plan[room][slot]!))],rentalIds:inst.rentalRequests.filter(request=>request.room===room&&request.status==='accepted'&&affected(request.program)).map(request=>request.id)}
}
export function storeEquipment(state:GameState,equipmentId:string,options:{allowClearPlan?:boolean}={}):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 장비를 보관할 수 있어요.'}
  const equipment=equipmentOf(state.player,equipmentId)
  if(!equipment)return {state,error:'보관할 장비를 개별 선택해 주세요.'}
  if(equipment.stored)return {state,error:'이미 보관 중인 장비예요.'}
  if(equipment.room===null)return {state,error:'센터 공용 설비는 보관하지 않아요.'}
  if(!equipment.ready)return {state,error:'설치·이전 작업이 끝난 뒤 보관할 수 있어요.'}
  const impact=getStorageImpact(state.player,equipment.instanceId)
  if(impact.rentalIds.length)return {state,error:'이 장비가 필요한 승인 대관을 먼저 취소해 주세요.'}
  if(impact.slots.length&&options.allowClearPlan!==true)return {state,error:`이 장비가 필요한 클래스 ${impact.slots.length}칸을 비우는지 확인해 주세요.`}
  if(freeCash(state.player)<8)return {state,error:'장비 보관에 8점이 필요해요.'}
  const next=copy(state),stored=equipmentOf(next.player,equipment.instanceId)!,room=stored.room!
  roomOf(next.player,room)!.equipment=roomOf(next.player,room)!.equipment.filter(id=>id!==stored.id)
  for(const slot of impact.slots)next.player.plan[room][slot]=null
  stored.room=null;stored.ready=false;stored.stored=true
  // Ownership and its maintenance obligation remain; storing cannot release reserve.
  next.player.cash=round(next.player.cash-8);next.player.evaluationStats.cost=round(next.player.evaluationStats.cost+8)
  return {state:next}
}
export function reinstallEquipment(state:GameState,equipmentId:string,targetRoom:RoomId):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 보관 장비를 재설치할 수 있어요.'}
  const equipment=equipmentOf(state.player,equipmentId)
  if(!equipment?.stored)return {state,error:'재설치할 보관 장비를 개별 선택해 주세요.'}
  if(!roomOf(state.player,targetRoom)?.open)return {state,error:'재설치할 열린 공간을 확인해 주세요.'}
  const offer=OFFER[equipment.id]
  if(!roomSupportsOffer(targetRoom,equipment.id))return {state,error:`${ROOM_NAMES[targetRoom]}의 용도에 맞는 장비가 아니에요.`}
  if(state.player.inventory.some(item=>!item.stored&&item.room===targetRoom&&OFFER[item.id].family===offer.family))return {state,error:'재설치할 방에 같은 물품군이 있어요.'}
  if(!['flex','quiet'].includes(offer.family)&&state.player.inventory.filter(item=>!item.stored&&item.room===targetRoom&&!['flex','quiet'].includes(OFFER[item.id].family)).length>=ROOM[targetRoom].equipmentSlots)return {state,error:'재설치할 방의 장비 자리가 모두 찼어요.'}
  if(freeCash(state.player)<8)return {state,error:'장비 재설치에 8점이 필요해요.'}
  const next=copy(state),installed=equipmentOf(next.player,equipment.instanceId)!
  delete installed.stored;installed.room=targetRoom;installed.ready=false
  roomOf(next.player,targetRoom)!.equipment.push(installed.id)
  next.player.cash=round(next.player.cash-8);next.player.evaluationStats.cost=round(next.player.evaluationStats.cost+8)
  next.player.pendingTasks.push({kind:'install',room:targetRoom,remaining:offer.installSlots,equipment:installed.instanceId})
  return {state:next}
}
export function openHall(state:GameState):MutationResult { return {state,error:'시설 입찰과 공사를 거쳐 공간을 열어 주세요.'} }
function maintainFor(inst:Institution,room:RoomId):string|undefined {
  const target=roomOf(inst,room);if(!target?.open)return '공간을 확인해 주세요.'
  if(inst.pendingTasks.some(t=>t.kind==='maintain'&&t.room===room))return '이미 정비를 예약했어요.'
  if(target.management>=100&&!inst.inventory.some(e=>e.room===room&&e.condition<100))return '이 방은 아직 정비가 필요하지 않아요.'
  if(freeCash(inst)<12)return '시설 정비에 12점이 필요해요.'
  inst.cash=round(inst.cash-12);inst.evaluationStats.cost+=12;inst.pendingTasks.push({kind:'maintain',room,remaining:1})
}
export function maintainRoom(state:GameState,room:RoomId):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 정비를 예약해 주세요.'}
  const next=copy(state),error=maintainFor(next.player,room);return error?{state,error}:{state:next}
}
export function trainStaff(state:GameState,kind:Expertise):MutationResult {
  if(state.phase!=='planning')return {state,error:'계획 화면에서 교육을 예약해 주세요.'}
  if(!['culture','sport','event'].includes(kind))return {state,error:'교육 분야를 확인해 주세요.'}
  if(state.player.trained)return {state,error:'이번 계절에는 교육을 이미 예약했어요.'}
  if(state.player.xp[kind]===0)return {state,error:'이 분야를 한 번 운영한 뒤 교육할 수 있어요.'}
  if(freeCash(state.player)<12)return {state,error:'교육에 12점이 필요해요.'}
  const next=copy(state);next.player.cash=round(next.player.cash-12);next.player.evaluationStats.cost+=12;next.player.trained=true
  next.player.pendingTasks.push({kind:'train',room:'A',remaining:1,expertise:kind});return {state:next}
}
export function setWeekendSupport(state:GameState,enabled:boolean):MutationResult {
  if(state.phase!=='planning'||state.player.supportContract===enabled)return {state}
  if(enabled&&freeCash(state.player)<24)return {state,error:'주말 지원 계약에 24점이 필요해요.'}
  const next=copy(state);next.player.cash=round(next.player.cash+(enabled?-24:24));next.player.evaluationStats.cost=Math.max(0,next.player.evaluationStats.cost+(enabled?24:-24));next.player.supportContract=enabled;return {state:next}
}
export function setPriceMode(state:GameState,mode:Institution['priceMode']):GameState {
  if(state.phase!=='planning'||!['discount','standard','premium'].includes(mode))return state
  const next=copy(state);next.player.priceMode=mode;return next
}
export function setGuideMode(state:GameState,mode:Institution['guideMode']):GameState {
  if(state.phase!=='planning'||!['fast','welcome'].includes(mode))return state
  const next=copy(state);next.player.guideMode=mode;return next
}

export function getDemand(state:Calendar):DemandGroup[] {
  const n=(id:string,base:number)=>base+hash(`${state.seed}:${state.year}:${state.season}:${id}`)%3
  const groups:DemandGroup[]=[
    {id:'craft-a',title:'오전 공예 모임',programs:['P01','P02'],people:n('ca',7),slots:[0,1],maxFee:1.2,public:true,returning:.8},
    {id:'craft-b',title:'저녁 공예 모임',programs:['P01','P02'],people:n('cb',7),slots:[1,2],maxFee:1.05,public:false,returning:.8},
    {id:'craft-budget',title:'알뜰 공예 신청',programs:['P01','P02'],people:4,slots:[1,3],maxFee:.9,public:true,returning:.5},
    {id:'craft-c',title:'주민 공예 신청',programs:['P01','P02'],people:n('cc',7),slots:[0,1,3],maxFee:0,public:true,returning:.3},
    {id:'craft-d',title:'주말 만들기 모임',programs:['P01','P02'],people:n('cd',6),slots:[3,4],maxFee:state.season===2?1.2:0,public:true,returning:.4},
    {id:'yoga-a',title:'아침 요가 신청',programs:['P03','P04'],people:n('ya',8),slots:[0,1],maxFee:.95,public:true,returning:.9},
    {id:'yoga-b',title:'퇴근 후 운동 모임',programs:['P03','P04'],people:n('yb',7),slots:[1,2,4],maxFee:.8,public:false,returning:.8},
    {id:'yoga-budget',title:'알뜰 요가 신청',programs:['P03','P04'],people:5,slots:[1,4],maxFee:.7,public:true,returning:.5},
    {id:'yoga-c',title:'주민 스트레칭',programs:['P03','P04'],people:n('yc',8),slots:[0,2,3],maxFee:0,public:true,returning:.3},
    {id:'meeting-a',title:'가정 안전 배우기',programs:['P06'],people:6,slots:[0,1,3],maxFee:0,public:true,returning:.9},
    {id:'meeting-b',title:'주말 생활안전 교실',programs:['P06'],people:5,slots:[2,3,4],maxFee:0,public:true,returning:.8},
    {id:'meeting-c',title:'일상 사고 예방 교실',programs:['P06'],people:6,slots:[1,2,4],maxFee:0,public:true,returning:.8},
    {id:'dance-a',title:'저녁 댄스 모임',programs:['P09'],people:n('da',10),slots:[2,3,4],maxFee:1.2,public:true,returning:.6},
    {id:'dance-b',title:'주말 댄스 동아리',programs:['P09'],people:n('dbudget',8),slots:[3,4],maxFee:.95,public:false,returning:.6},
    {id:'digital-a',title:'생활 디지털 교실',programs:['P07'],people:n('di',10),slots:[0,1,4],maxFee:1.5,public:true,returning:.5},
    {id:'digital-budget',title:'알뜰 디지털 신청',programs:['P07'],people:5,slots:[1,4],maxFee:1.05,public:true,returning:.5},
    {id:'pilates-a',title:'기구 필라테스 오전반',programs:['P11'],people:n('pa',8),slots:[0,1,3],maxFee:5.6,public:false,returning:.85},
    {id:'pilates-b',title:'기구 필라테스 직장인반',programs:['P11'],people:n('pb',8),slots:[2,4],maxFee:4.9,public:false,returning:.8},
    {id:'pottery-a',title:'작품 도예 기초반',programs:['P12'],people:n('pot-a',10),slots:[0,1,3],maxFee:4.1,public:false,returning:.75},
    {id:'pottery-b',title:'주말 도예 작품반',programs:['P12'],people:n('pot-b',9),slots:[2,3,4],maxFee:3.8,public:false,returning:.75},
    {id:'video-a',title:'마을 영상 제작반',programs:['P13'],people:n('vi-a',10),slots:[1,2,3],maxFee:4.7,public:false,returning:.7},
    {id:'video-b',title:'주말 영상 편집반',programs:['P13'],people:n('vi-b',9),slots:[0,4],maxFee:4.1,public:false,returning:.7},
  ]
  const specialtyDemand:{program:ProgramId;title:string;people:[number,number];slots:[number[],number[]];fees:[number,number]}[]=[
    {program:'P14',title:'뮤지컬 워크숍',people:[22,20],slots:[[1,2],[3,4]],fees:[2.7,2.35]},
    {program:'P15',title:'스피치·발표',people:[8,8],slots:[[0,2],[3,4]],fees:[4.7,4.1]},
    {program:'P16',title:'실내 사이클',people:[10,10],slots:[[0,1],[2,4]],fees:[4.3,3.8]},
    {program:'P17',title:'주민 오케스트라',people:[22,20],slots:[[0,1],[3,4]],fees:[2.8,2.4]},
    {program:'P18',title:'무대기술',people:[14,12],slots:[[1,3],[2,4]],fees:[3.3,2.85]},
    {program:'P19',title:'생활 목공',people:[10,9],slots:[[1,3],[0,4]],fees:[3.55,3.1]},
    {program:'P20',title:'외국어 토론',people:[8,8],slots:[[1,2],[3,4]],fees:[4,3.5]},
    {program:'P21',title:'창업 피칭',people:[8,8],slots:[[2,3],[0,4]],fees:[5.4,4.75]},
  ]
  for(const entry of specialtyDemand)for(const index of [0,1] as const){
    const id=`${entry.program.toLowerCase()}-${index}`
    groups.push({id,title:`${entry.title} ${index?'주말':'정기'}반`,programs:[entry.program],people:n(id,entry.people[index]),slots:entry.slots[index],maxFee:entry.fees[index],public:false,returning:.75})
  }
  if(state.year>=2)groups.push({id:'digital-b',title:'퇴근 후 디지털 교실',programs:['P07'],people:n('db',8),slots:[1,2,3],maxFee:1.2,public:false,returning:.7})
  if(state.season===1)groups.push({id:'summer-yoga',title:'여름 건강 교실',programs:['P03','P04'],people:10,slots:[1,2,4],maxFee:.95,public:true,returning:.5})
  if(state.season===3)groups.push({id:'winter-craft',title:'겨울 선물 만들기',programs:['P01','P02'],people:10,slots:[1,3,4],maxFee:1.2,public:true,returning:.4})
  return groups
}
function feeFor(inst:Institution,p:Program):number {
  const premium=p.kind!=='community'&&getLevel(inst.xp[p.kind])>=2&&inst.priceMode==='premium'
  return p.income/p.capacity*(inst.priceMode==='discount'?.85:premium?1.15:1)
}
function finishTask(inst:Institution,task:Task):void {
  const room=roomOf(inst,task.room)!
  if(task.kind==='install'){
    const equipment=inst.inventory.find(e=>e.instanceId===task.equipment)
    if(!equipment||equipment.stored)return
    equipment.ready=true
    const family=OFFER[equipment.id].family
    if(['craft','digital'].includes(family))room.mode='table'
    if(family==='mat')room.mode='floor'
    if(family==='stage')room.mode='stage'
  }
  if(task.kind==='maintain'){
    room.management=clamp(room.management+35)
    for(const equipment of inst.inventory.filter(e=>e.room===task.room))equipment.condition=clamp(equipment.condition+40)
  }
  if(task.kind==='train'&&task.expertise)inst.xp[task.expertise]+=10
  if(task.kind==='open')room.open=true
}
interface Session {
  room:RoomId;slot:number;program:Program;capacity:number;rental?:RentalRequest
  bookings:{group:DemandGroup;people:number}[]; attended:number; canceled:number; experience:number
}
interface WeekOutcome {
  stats:RawStats;activity:Activity[];revenue:number;cost:number;visits:number;publicVisits:number
  rentalRevenue:number;classRevenue:number;rentalCost:number;classCost:number
  investmentReputation:number
}
function runWeek(inst:Institution,demand:DemandGroup[],warnings:Set<string>):WeekOutcome {
  advanceFacilityProjects(inst)
  const investmentReputation=advanceCampusProjects(inst)
  const stats=emptyStats();stats.weeks=1;stats.publicRequested=demand.filter(g=>g.public).reduce((n,g)=>n+g.people,0)
  const result:WeekOutcome={stats,activity:[],revenue:0,cost:0,visits:0,publicVisits:0,rentalRevenue:0,classRevenue:0,rentalCost:0,classCost:0,investmentReputation}
  const sessions:Session[]=[],scheduledCounts=new Map<ProgramId,number>()
  for(let slot=0;slot<5;slot++)for(const room of inst.rooms){
    const id=inst.plan[room.id][slot];if(!room.open||!id)continue
    const rental=getRentalAt(inst,room.id,slot)
    if(isRentalProgram(id)&&!rental)continue
    const limit=PROGRAM[id].weeklyLimit,count=scheduledCounts.get(id)??0
    if(limit&&count>=limit){warnings.add(`${PROGRAM[id].shortName}는 센터 전체에서 주 ${limit}회까지만 운영해요.`);continue}
    scheduledCounts.set(id,count+1)
    sessions.push({room:room.id,slot,program:PROGRAM[id],capacity:roomCapacity(room.id,id),rental,bookings:[],attended:0,canceled:0,experience:0})
  }
  const eligible=(g:DemandGroup,s:Session)=>!s.rental&&g.programs.includes(s.program.id)&&g.slots.includes(s.slot)&&feeFor(inst,s.program)<=g.maxFee+.0001&&canRunProgram(inst,s.room,s.program.id)
  for(const group of [...demand].sort((a,b)=>sessions.filter(s=>eligible(a,s)).length-sessions.filter(s=>eligible(b,s)).length||a.id.localeCompare(b.id))){
    // Each group selects at most one session per week, irrespective of room count.
    const session=sessions.filter(s=>eligible(group,s)&&s.bookings.reduce((n,b)=>n+b.people,0)<s.capacity)
      .sort((a,b)=>feeFor(inst,a.program)-feeFor(inst,b.program)||a.slot-b.slot||a.room.localeCompare(b.room))[0]
    if(session)session.bookings.push({group,people:Math.min(group.people,session.capacity-session.bookings.reduce((n,b)=>n+b.people,0))})
  }
  for(let slot=0;slot<5;slot++){
    let support=PREPARATION_SUPPORT[slot]+(slot>=3&&inst.supportContract?1:0)
    const blocked=new Set<RoomId>()
    for(const room of inst.rooms){
      const task=inst.pendingTasks.find(t=>t.room===room.id&&t.remaining>0)
      if(task&&support>0){support--;blocked.add(room.id);task.remaining--;if(!task.remaining)finishTask(inst,task)}
    }
    inst.pendingTasks=inst.pendingTasks.filter(t=>t.remaining>0)
    for(const session of sessions.filter(s=>s.slot===slot)){
      const p=session.program,rental=session.rental,booked=rental?.attendees??session.bookings.reduce((n,b)=>n+b.people,0)
      if(!booked)continue
      const cancel=(message:string)=>{session.canceled=booked;stats.experienceWeight+=booked;warnings.add(message)}
      if(blocked.has(session.room)){cancel('설치·정비 시간과 겹친 예약이 있었어요.');continue}
      if(!canRunProgram(inst,session.room,p.id)){cancel('필수 설비의 설치·정비 상태를 확인해 주세요.');continue}
      if(getRoomManagement(inst,session.room)<20){cancel('관리상태가 낮은 공간은 운영을 쉬었어요.');continue}
      const required=Math.max(0,p.support-(rental&&hasFamily(inst,'guide')&&inst.guideMode==='fast'?1:0))
      if(support<required){cancel('같은 시간에 준비 인력이 부족했어요.');continue}
      support-=required
      const room=roomOf(inst,session.room)!,switching=p.mode!=='nook'&&p.mode!==room.mode
      const flexible=hasFamily(inst,'flex',session.room)&&p.mode!=='stage'&&room.mode!=='stage'
      const delayed=switching&&!flexible&&support<1
      if(switching&&!flexible&&support>0)support--
      if(p.mode!=='nook')room.mode=p.mode
      const capacity=delayed?Math.floor(session.capacity*.75):session.capacity
      if(rental&&booked>capacity){cancel('전환 준비가 늦어 대관 정원을 맞추지 못했어요.');continue}
      const attendees=Math.min(booked,capacity)
      const revenue=round(rental?rental.fee:feeFor(inst,p)*attendees)
      const premium=!rental&&p.kind!=='community'&&getLevel(inst.xp[p.kind])>=2&&inst.priceMode==='premium'
      const cost=round(rental?rental.cost:p.cost+(premium?1:0))
      if(freeCash(inst)+revenue<cost){cancel('운영비가 부족한 클래스는 쉬었어요. 다음 편성을 조정해 보세요.');continue}
      session.attended=attendees;session.canceled=booked-attendees
      const gear=inst.inventory.filter(e=>e.room===session.room&&OFFER[e.id].capabilities.some(cap=>p.requires.includes(cap)))
      const worn=gear.some(e=>e.condition<50),management=getRoomManagement(inst,session.room)
      const welcome=hasFamily(inst,'guide')&&inst.guideMode==='welcome'?4:0
      const finishQuality=(room.facilityQuality-90)*.08
      session.experience=clamp(68+management*.1+finishQuality+welcome+campusBenefits(inst).experience+(p.kind==='community'?0:getLevel(inst.xp[p.kind])*3)+(premium?3:0)-(delayed?15:0)-(worn?8:0))
      let publicAttended=0,remaining=attendees
      if(!rental)for(const booking of session.bookings){const admitted=Math.min(remaining,booking.people);if(booking.group.public)publicAttended+=admitted;remaining-=admitted}
      inst.cash=round(inst.cash+revenue-cost)
      if(!rental&&p.kind!=='community')inst.xp[p.kind]++
      if(rental&&p.kind==='event')inst.xp.event=round(inst.xp.event+.2)
      for(const equipment of gear)equipment.condition=round(clamp(equipment.condition-(equipment.id==='E01B'?.15:.25)))
      if(switching&&flexible){const equipment=inst.inventory.find(e=>e.room===session.room&&OFFER[e.id].family==='flex')!;equipment.condition=round(clamp(equipment.condition-.2))}
      room.management=round(clamp(room.management-(rental?.14:.1)))
      if(rental)inst.reputation=clamp(inst.reputation+.002)
      result.revenue+=revenue;result.cost+=cost;result.visits+=attendees;result.publicVisits+=publicAttended
      if(rental){result.rentalRevenue+=revenue;result.rentalCost+=cost}else{result.classRevenue+=revenue;result.classCost+=cost}
      stats.publicServed+=publicAttended;stats.experienceSum+=attendees*session.experience;stats.experienceWeight+=booked;stats.use+=attendees/session.capacity
      result.activity.push({room:session.room,slot,program:p.id,attendees,capacity:session.capacity,experience:session.experience})
      if(delayed)warnings.add('공간 전환 준비 시간이 빠듯했어요.')
      if(worn)warnings.add('자주 쓰는 장비를 정비하면 수업 품질이 좋아져요.')
    }
    const active=sessions.filter(s=>s.slot===slot&&s.attended>0)
    const adjacent:Record<RoomId,RoomId[]>={A:['B','D'],B:['A','C'],C:['B'],D:['A','E'],E:['D','F'],F:['E','G'],G:['F']}
    for(const session of active){
      if(!['P01','P02','P07','P12','P13','P15','P20','P21'].includes(session.program.id)||hasFamily(inst,'quiet',session.room))continue
      if(active.some(other=>adjacent[session.room].includes(other.room)&&['P08','P09','P14','P16','P17','P19'].includes(other.program.id))){
        session.experience-=10;stats.experienceSum-=session.attended*10
        const activity=result.activity.find(a=>a.room===session.room&&a.slot===slot);if(activity)activity.experience=session.experience
        warnings.add('이웃 공간의 음악과 조용한 클래스 시간을 나누어 보세요.')
      }
    }
    // Reputation uses the final experience after noise and all quality adjustments.
    for(const session of active)if(!session.rental&&session.program.kind!=='community')
      inst.reputation=clamp(inst.reputation+session.attended*.015*session.experience/100*(session.program.reputationMultiplier??1))
  }
  const mean=stats.experienceWeight?stats.experienceSum/stats.experienceWeight:70
  if(stats.experienceWeight)inst.trust=clamp(inst.trust+clamp((mean-70)/30,-.7,.7))
  return result
}
function addStats(target:RawStats,source:RawStats):void { for(const key of Object.keys(source) as (keyof RawStats)[])target[key]+=source[key] }
const fixedOperatingCost = (inst:Institution):number => actualBaseCost(inst)+maintenanceCost(inst)+facilityUpkeep(inst)+campusUpkeep(inst)
function financialScore(inst:Institution):number {
  const stats=inst.evaluationStats
  const coverage=stats.cost>0?clamp((stats.revenue+stats.grants)/stats.cost,0,1):1
  const liquidity=clamp(inst.cash/Math.max(1,inst.reserved+fixedOperatingCost(inst)),0,1)
  return round(60*coverage+40*liquidity)
}
export function getEvaluationComponents(inst:Institution):Record<EvaluationComponent,number> {
  const stats=inst.evaluationStats
  return {
    reputation:round(stats.seasons?stats.reputationSum/stats.seasons:inst.reputation),
    financial:financialScore(inst),
    satisfaction:round(stats.experienceWeight?clamp(stats.experienceSum/stats.experienceWeight):0),
    publicService:round(stats.publicRequested?clamp(stats.publicServed/stats.publicRequested*100):0),
  }
}
const evaluationScore=(components:Record<EvaluationComponent,number>):number=>round(EVALUATION_COMPONENTS.reduce((sum,item)=>sum+components[item.key]*item.weight/100,0))
export function isEvaluationSeason(state:Pick<GameState,'year'|'season'>):boolean { return state.season===3&&state.year%EVALUATION_INTERVAL===0 }
export function getAwardForRank(rank:number):EvaluationRecord['award'] { return rank===1?'대통령상':rank===2?'국무총리상':rank===3?'장관상':null }
export function getBudgetChange(rank:number,participants=10):number {
  if(rank<=3)return [6,4,2][rank-1]??0
  return rank>=participants-2?-2*(rank-(participants-3)):0
}
function settleEvaluation(state:GameState):void {
  const standings=[state.player,...state.rivals].map(inst=>({inst,components:getEvaluationComponents(inst)}))
    .map(entry=>({...entry,score:evaluationScore(entry.components)}))
    .sort((a,b)=>b.score-a.score||b.components.publicService-a.components.publicService||b.components.satisfaction-a.components.satisfaction||a.inst.id.localeCompare(b.inst.id))
  standings.forEach(({inst,components,score},index)=>{
    const rank=index+1,continues=state.year<MAX_YEARS,budgetChange=continues?getBudgetChange(rank,standings.length):0
    const record:EvaluationRecord={year:state.year,score,rank,participants:standings.length,award:getAwardForRank(rank),components,budgetChange,
      nextAnnualBudget:continues?round(BASE_ANNUAL_BUDGET*(1+budgetChange/100)):inst.annualBudget,
      appliesFromYear:continues?state.year+1:null,appliesThroughYear:continues?state.year+EVALUATION_INTERVAL:null,
      measuredSeasons:inst.evaluationStats.seasons,partial:inst.evaluationStats.seasons<EVALUATION_INTERVAL*4}
    inst.evaluations.push(record)
    if(continues)inst.annualBudget=record.nextAnnualBudget
    inst.evaluationStats=emptyEvaluationStats()
  })
}
function scoreStats(inst:Institution,stats:RawStats){
  const publicScore=stats.publicRequested?clamp(stats.publicServed/stats.publicRequested*100):0
  const experienceScore=stats.experienceWeight?clamp(stats.experienceSum/stats.experienceWeight):0
  const utilization=clamp(100*stats.use/Math.max(1,inst.rooms.filter(r=>r.open).length*5*stats.weeks))
  const financial=financialScore(inst)
  return {publicScore:round(publicScore),experienceScore:round(experienceScore),utilization:round(utilization),score:round(.25*publicScore+.3*experienceScore+.25*inst.reputation+.2*financial)}
}
function resolveInstitution(inst:Institution,state:Calendar):SeasonReport {
  const beforeCash=inst.cash,reputationStart=inst.reputation,trustStart=inst.trust,warnings=new Set<string>(),stats=emptyStats(),demand=getDemand(state)
  const weekly:SeasonReport['weekly']=[];let revenue=0,cost=0,visits=0,publicVisits=0,rentalRevenue=0,classRevenue=0,rentalCost=0,classCost=0,investmentReputation=0,activity:Activity[]=[]
  for(let week=0;week<13;week++){
    const result=runWeek(inst,demand,warnings);addStats(stats,result.stats)
    investmentReputation+=result.investmentReputation
    inst.reputation=clamp(inst.reputation,Math.max(0,reputationStart-8),Math.min(100,reputationStart+8+investmentReputation))
    inst.trust=clamp(inst.trust,Math.max(0,trustStart-5),Math.min(100,trustStart+5))
    revenue+=result.revenue;cost+=result.cost;visits+=result.visits;publicVisits+=result.publicVisits
    rentalRevenue+=result.rentalRevenue;classRevenue+=result.classRevenue;rentalCost+=result.rentalCost;classCost+=result.classCost
    weekly.push({week:week+1,revenue:round(result.revenue),cost:round(result.cost),visits:result.visits})
    activity=result.activity
  }
  const fixed=fixedOperatingCost(inst)
  // Facility contracts reserve their added current-year cost before work starts.
  const release=inst.baseReserve+maintenanceCost(inst)+facilityUpkeep(inst)+campusUpkeep(inst)
  const paid=Math.min(inst.cash,fixed)
  inst.cash=round(inst.cash-paid);inst.reserved=round(Math.max(0,Math.min(inst.cash,inst.reserved-release)));cost+=paid
  inst.reputation=round(inst.reputation);inst.trust=round(inst.trust)
  addStats(inst.yearStats,stats)
  addStats(inst.evaluationStats,stats)
  inst.evaluationStats.revenue=round(inst.evaluationStats.revenue+revenue)
  // Unpaid fixed obligations remain costs for the financial evaluation.
  inst.evaluationStats.cost=round(inst.evaluationStats.cost+cost+fixed-paid)
  inst.evaluationStats.seasons++;inst.evaluationStats.reputationSum+=inst.reputation
  const scores=scoreStats(inst,state.season===3?inst.yearStats:stats)
  Object.assign(inst,scores);inst.history.push(scores.score);if(state.season===3)inst.annualScores.push(scores.score)
  const profit=round(revenue-cost)
  return {year:state.year,season:state.season,revenue:round(revenue),cost:round(cost),profit,visits,publicVisits,...scores,rank:1,
    highlights:[visits?`이번 계절 ${visits}번의 방문이 있었어요.`:'이번 계절에는 시설을 준비하며 쉬었어요.',`대관 수입 ${round(rentalRevenue)}점 · 클래스 수입 ${round(classRevenue)}점`],warnings:[...warnings],activity,weekly,beforeCash,afterCash:inst.cash,annual:state.season===3,rentalRevenue:round(rentalRevenue),classRevenue:round(classRevenue),rentalCost:round(rentalCost),classCost:round(classCost),reputationChange:round(inst.reputation-reputationStart),breakdownAvailable:true}
}

function planRivalSpecialty(inst:Institution,state:Calendar):void {
  if(state.year<2)return
  const choices:Record<string,{room:RoomId;offers:string[]}>={tantan:{room:'B',offers:['E02','E11']},baeum:{room:'E',offers:['E01','E12']},saebom:{room:'F',offers:['E06B','E13']},rhythm:{room:'C',offers:['E04','E07']},byeolbit:{room:'C',offers:['E07','E17']},neulpum:{room:'G',offers:['E05','E19']}}
  const choice=choices[inst.id];if(!choice||!roomOf(inst,choice.room)?.open)return
  const local=inst.inventory.filter(item=>!item.stored&&item.room===choice.room&&!['flex','quiet'].includes(OFFER[item.id].family))
  const satisfies=(item:Equipment,id:string)=>OFFER[item.id].family===OFFER[id].family&&(id!=='E06B'||OFFER[item.id].capabilities.includes('digitalPro'))
  const missing=choice.offers.filter(id=>!local.some(item=>satisfies(item,id)))
  if(!missing.length)return
  const remove=local.filter(item=>!choice.offers.some(id=>satisfies(item,id)))
  if(remove.some(item=>!item.ready))return
  const total=remove.length*8+missing.reduce((sum,id)=>sum+OFFER[id].price+OFFER[id].maintenance*(4-state.season),0)
  if(freeCash(inst)<total+220)return
  // Use the same storage costs, installation delay and capital reserve as the player.
  let shell={...state,version:2,phase:'planning',planningStage:'classes',player:inst,rivals:[],lastReport:null,history:[]} as GameState
  for(const item of remove){const result=storeEquipment(shell,item.instanceId);if(result.error)return;shell=result.state}
  for(const id of missing){const result=buyEquipment(shell,id,choice.room);if(result.error)return;shell=result.state}
  Object.assign(inst,shell.player)
}
function chooseRivalPlan(inst:Institution,state:Calendar):void {
  planRivalFacility(inst,state)
  planRivalCampus(inst,state)
  const adaptive=inst.id==='daon'||inst.id==='saebom'
  const intentions:Record<string,{id:string;room:RoomId}[]>={
    boram:[{id:'E01',room:'A'},{id:'E02',room:'B'},{id:'E01',room:'E'}],
    rhythm:[{id:'E04',room:'B'},{id:'E02',room:'B'},{id:'E05',room:'A'}],
    tantan:[{id:'E02',room:'B'},{id:'E04',room:'B'},{id:'E01',room:'E'}],
    baeum:[{id:'E06',room:'F'},{id:'E05',room:'F'},{id:'E01',room:'A'}],
    saebom:[{id:'E02',room:'A'},{id:'E04B',room:'A'},{id:'E01',room:'E'},{id:'E06',room:'F'},{id:'E05',room:'F'},{id:'E10',room:'A'}],
    neulpum:[{id:'E01B',room:'E'},{id:'E02',room:'B'},{id:'E08',room:'A'}],
    pureun:[{id:'E08',room:'A'},{id:'E02',room:'B'},{id:'E01B',room:'E'}],
    byeolbit:[{id:'E01',room:'A'},{id:'E05',room:'F'},{id:'E06',room:'F'}],
    daon:[{id:'E01',room:'A'},{id:'E02',room:'B'},{id:'E06',room:'F'},{id:'E05',room:'F'},{id:'E04',room:'B'},{id:'E10',room:'A'}],
  }
  for(const room of inst.rooms.filter(r=>r.open))if(getRoomManagement(inst,room.id)<(inst.id==='daon'?80:75)||inst.inventory.some(e=>e.room===room.id&&e.condition<(adaptive?45:40)))maintainFor(inst,room.id)
  // The player can buy several sets in one planning phase. These two institutions
  // also do so, paying the ordinary prices and maintenance reserve before use.
  for(let purchase=0;purchase<(adaptive?2:1);purchase++){
    const next=(intentions[inst.id]??[]).find(item=>!inst.inventory.some(e=>!e.stored&&(e.room===item.room||e.room===null)&&OFFER[item.id].capabilities.every(capability=>OFFER[e.id].capabilities.includes(capability))))
    if(!next)break
    const offer=OFFER[next.id],buffer=adaptive?(inst.id==='daon'?140:180):0
    if(freeCash(inst)<offer.price+offer.maintenance*(4-state.season)+buffer)break
    if(buyFor(inst,next.id,next.room,state.season))break
  }
  inst.plan=emptyPlan();for(const request of inst.rentalRequests)request.status='pending'
  planRivalSpecialty(inst,state)
  if(adaptive){
    // Daon prioritizes accessible classes; Saebom tries more paid sport/digital
    // sessions. Both plan from the same published demand and rental requests.
    inst.priceMode=inst.id==='daon'&&freeCash(inst)>=450?'discount':'standard'
    inst.guideMode=inst.id==='saebom'&&inst.rentalRequests.length>=7?'fast':'welcome'
    const demand=getDemand(state),remaining=new Map(demand.map(group=>[group.id,group.people]))
    const support:number[]=[...PREPARATION_SUPPORT]
    const roomOrder:RoomId[]=inst.id==='daon'?['A','B','F','E','D','G','C']:['E','A','F','B','D','G','C']
    const order:ProgramId[]=inst.id==='daon'?['P02','P04','P07','P09','P01','P03','P06']:['P13','P09','P07','P03','P01','P04','P02','P06']
    const alternatives=new Map<string,number>()
    for(const request of inst.rentalRequests){
      const key=`${request.room}:${request.slot}`
      alternatives.set(key,Math.max(alternatives.get(key)??0,request.fee-request.cost))
    }
    // Only half of the uncommitted rental opportunity finances the provisional
    // class budget; occupied rooms and staff may prevent accepting all requests.
    const lossBudget=Math.max(0,freeCash(inst)/13+[...alternatives.values()].reduce((sum,n)=>sum+n,0)*.5-4)
    let plannedLoss=0
    const candidates=roomOrder.flatMap(room=>order.filter(id=>canRunProgram(inst,room,id)).map(id=>({room,id})))
    for(let step=0;step<15;step++){
      let best:{room:RoomId;slot:number;id:ProgramId;utility:number;net:number;served:string[]}|undefined
      for(const {room,id} of candidates)for(let slot=0;slot<5;slot++){
        const p=PROGRAM[id]
        if(inst.plan[room][slot]||support[slot]<p.support||getProgramPlacementError(inst,room,slot,id))continue
        let seats=roomCapacity(room,id),attendees=0,utility=0
        const served:string[]=[],fee=feeFor(inst,p)
        for(const group of demand){
          if(!group.programs.includes(id)||!group.slots.includes(slot)||fee>group.maxFee+.0001)continue
          const count=Math.min(seats,remaining.get(group.id)??0)
          if(!count)continue
          seats-=count;attendees+=count;served.push(group.id)
          utility+=count*(group.public?(inst.id==='daon'?1.5:1.3):1)
        }
        if(!attendees)continue
        const net=fee*attendees-p.cost
        if(plannedLoss+Math.max(0,-net)>lossBudget)continue
        utility+=net*(inst.id==='saebom'?.2:.1)-(alternatives.get(`${room}:${slot}`)??0)*.2
        if(p.id==='P06')utility*=.75
        if(!best||utility>best.utility)best={room,slot,id,utility,net,served}
      }
      if(!best)break
      inst.plan[best.room][best.slot]=best.id
      support[best.slot]-=PROGRAM[best.id].support
      plannedLoss+=Math.max(0,-best.net)
      // A partially admitted group does not create a second weekly visit.
      for(const id of best.served)remaining.set(id,0)
    }
    for(const request of [...inst.rentalRequests].sort((a,b)=>(b.fee-b.cost)-(a.fee-a.cost)||a.id.localeCompare(b.id))){
      if(inst.plan[request.room][request.slot])continue
      const p=PROGRAM[request.program]
      const needed=Math.max(0,p.support-(hasFamily(inst,'guide')&&inst.guideMode==='fast'?1:0))
      const mixedLayout=p.mode!=='nook'&&!hasFamily(inst,'flex',request.room)&&inst.plan[request.room].some(id=>id&&PROGRAM[id].mode!=='nook'&&PROGRAM[id].mode!==p.mode)
      const reserve=needed+(mixedLayout?1:0)
      if(support[request.slot]<reserve)continue
      if(!decideFor(inst,request.id,'accepted'))support[request.slot]-=reserve
    }
    for(const request of inst.rentalRequests)if(request.status==='pending')request.status='declined'
    return
  }
  const publicFirst=inst.id==='boram',rentalFirst=['rhythm','neulpum','pureun'].includes(inst.id)
  const demand=getDemand(state),assigned=new Set<string>()
  const allocateClasses=()=>{
    const order:ProgramId[]=publicFirst?['P02','P04','P07','P01','P03','P09','P06']:inst.id==='tantan'?['P11','P16','P03','P09','P04','P01','P06']:['P12','P13','P14','P15','P17','P18','P19','P20','P21','P01','P07','P03','P09','P02','P04','P06']
    for(let slot=0;slot<5;slot++){
      let support=PREPARATION_SUPPORT[slot]-inst.rentalRequests.filter(r=>r.status==='accepted'&&r.slot===slot).reduce((n,r)=>n+PROGRAM[r.program].support,0)
      for(const room of inst.rooms.filter(r=>r.open)){
        if(inst.plan[room.id][slot])continue
        const candidates=order.filter(id=>!getProgramPlacementError(inst,room.id,slot,id)&&PROGRAM[id].support<=support).map(id=>({id,group:demand.find(g=>!assigned.has(g.id)&&g.programs.includes(id)&&g.slots.includes(slot)&&feeFor(inst,PROGRAM[id])<=g.maxFee)})).filter(item=>item.group)
        const choice=candidates[0];if(!choice)continue
        inst.plan[room.id][slot]=choice.id;assigned.add(choice.group!.id);support-=PROGRAM[choice.id].support
      }
    }
  }
  const allocateRentals=()=>{
    const reservedSupport=[0,0,0,0,0]
    for(const room of inst.rooms)for(let slot=0;slot<5;slot++){const p=inst.plan[room.id][slot];if(p)reservedSupport[slot]+=PROGRAM[p].support}
    for(const request of [...inst.rentalRequests].sort((a,b)=>(b.fee-b.cost)-(a.fee-a.cost)||a.id.localeCompare(b.id))){
      if(reservedSupport[request.slot]+PROGRAM[request.program].support>PREPARATION_SUPPORT[request.slot])continue
      if(!decideFor(inst,request.id,'accepted'))reservedSupport[request.slot]+=PROGRAM[request.program].support
    }
  }
  if(rentalFirst){allocateRentals();allocateClasses()}else{allocateClasses();allocateRentals()}
  for(const request of inst.rentalRequests)if(request.status==='pending')request.status='declined'
}
export function previewSeason(state:GameState):SeasonReport {
  if(state.phase!=='planning'&&state.lastReport)return copy(state.lastReport)
  const report=resolveInstitution(copy(state.player),state);report.rank=1+state.rivals.filter(r=>r.score>report.score).length;report.participants=state.rivals.length+1;return report
}
export function runSeason(state:GameState):GameState {
  if(state.phase!=='planning'||state.planningStage!=='classes')return state
  const next=copy(state)
  for(const rival of next.rivals)chooseRivalPlan(rival,next)
  const report=resolveInstitution(next.player,next)
  for(const rival of next.rivals)resolveInstitution(rival,next)
  report.rank=1+next.rivals.filter(r=>r.score>next.player.score).length
  report.participants=next.rivals.length+1
  if(isEvaluationSeason(next)){
    settleEvaluation(next)
    report.evaluation=copy(next.player.evaluations.at(-1)!)
  }
  next.lastReport=report;next.history.push(copy(report));next.phase='review';return next
}
export function nextSeason(state:GameState):GameState {
  if(state.phase!=='review')return state
  const next=copy(state)
  if(state.year===MAX_YEARS&&state.season===3){next.phase='ending';return next}
  next.season=(state.season+1)%4;if(next.season===0)next.year++
  for(const inst of [next.player,...next.rivals]){
    inst.supportContract=false;inst.trained=false
    for(const room of inst.rooms)for(let slot=0;slot<5;slot++)if(inst.plan[room.id][slot]&&isRentalProgram(inst.plan[room.id][slot]!))inst.plan[room.id][slot]=null
    if(next.season===0){inst.cash=round(inst.cash+inst.annualBudget);inst.evaluationStats.grants+=inst.annualBudget;inst.baseReserve=actualBaseCost(inst);inst.reserved=round(Math.min(inst.cash,4*(inst.baseReserve+maintenanceCost(inst)+facilityUpkeep(inst)+campusUpkeep(inst))));inst.yearStats=emptyStats()}
    inst.rentalRequests=generateRentals(inst,next)
  }
  next.phase='planning';next.planningStage='rentals';return next
}
export function finalScore(inst:Institution):number {
  if(inst.evaluations.length)return round(.5*inst.evaluations.reduce((sum,entry)=>sum+entry.score,0)/inst.evaluations.length+.5*inst.evaluations.at(-1)!.score)
  if(!inst.annualScores.length)return inst.score
  return round(.5*inst.annualScores.reduce((sum,n)=>sum+n,0)/inst.annualScores.length+.5*inst.annualScores.at(-1)!)
}
/** Shared final ordering for the UI and balance bots; no tied awards. */
export function getFinalStandings(state:Pick<GameState,'player'|'rivals'>):Institution[] {
  return [state.player,...state.rivals].sort((a,b)=>finalScore(b)-finalScore(a)
    ||(b.evaluations.at(-1)?.components.publicService??b.publicScore)-(a.evaluations.at(-1)?.components.publicService??a.publicScore)
    ||(b.evaluations.at(-1)?.components.satisfaction??b.experienceScore)-(a.evaluations.at(-1)?.components.satisfaction??a.experienceScore)
    ||a.id.localeCompare(b.id))
}
export function getFinalRank(state:Pick<GameState,'player'|'rivals'>,institutionId=state.player.id):number {
  const index=getFinalStandings(state).findIndex(inst=>inst.id===institutionId)
  return index<0?0:index+1
}

type Data = Record<string,unknown>
const object = (value:unknown):value is Data => typeof value==='object'&&value!==null&&!Array.isArray(value)
const numberIn = (value:unknown,min=0,max=Number.MAX_SAFE_INTEGER):value is number => typeof value==='number'&&Number.isFinite(value)&&value>=min&&value<=max
const integerIn = (value:unknown,min:number,max:number):value is number => numberIn(value,min,max)&&Number.isInteger(value)
const strings = (value:unknown):value is string[] => Array.isArray(value)&&value.every(item=>typeof item==='string')
const numbers = (value:unknown):value is number[] => Array.isArray(value)&&value.every(item=>numberIn(item))
const roomId = (value:unknown):value is RoomId => typeof value==='string'&&ROOM_IDS.includes(value as RoomId)
const programId = (value:unknown):value is ProgramId => typeof value==='string'&&Object.hasOwn(PROGRAM,value)
function validEvaluation(value:unknown):value is EvaluationRecord {
  if(!object(value)||![2,4,6].includes(value.year as number)||!integerIn(value.participants,1,11)||!integerIn(value.rank,1,value.participants)||!numberIn(value.score,0,100))return false
  if(value.award!==getAwardForRank(value.rank)||!object(value.components)||!EVALUATION_COMPONENTS.every(item=>numberIn((value.components as Data)[item.key],0,100)))return false
  if(Math.abs(value.score-evaluationScore(value.components as Record<EvaluationComponent,number>))>.011)return false
  if(!integerIn(value.measuredSeasons,1,8)||value.partial!==(value.measuredSeasons<8))return false
  const continues=(value.year as number)<MAX_YEARS
  if(value.budgetChange!==(continues?getBudgetChange(value.rank,value.participants):0))return false
  if(continues)return value.nextAnnualBudget===round(BASE_ANNUAL_BUDGET*(1+(value.budgetChange as number)/100))&&value.appliesFromYear===(value.year as number)+1&&value.appliesThroughYear===(value.year as number)+EVALUATION_INTERVAL
  return numberIn(value.nextAnnualBudget,BASE_ANNUAL_BUDGET*.94,BASE_ANNUAL_BUDGET*1.06)&&value.appliesFromYear===null&&value.appliesThroughYear===null
}
function validReport(value:unknown,legacy=false):boolean {
  if(!object(value)||!integerIn(value.year,1,MAX_YEARS)||!integerIn(value.season,0,3)||!integerIn(value.rank,1,11)||typeof value.annual!=='boolean')return false
  if(value.participants!==undefined&&(!integerIn(value.participants,1,11)||value.rank>value.participants))return false
  if(value.evaluation!==undefined&&(!validEvaluation(value.evaluation)||value.evaluation.year!==value.year||value.season!==3))return false
  if(!['revenue','cost','visits','publicVisits','beforeCash','afterCash'].every(key=>numberIn(value[key]))||!numberIn(value.profit,-Number.MAX_SAFE_INTEGER))return false
  if(!['publicScore','experienceScore','score'].every(key=>numberIn(value[key],0,100))||!strings(value.highlights)||!strings(value.warnings))return false
  if(!Array.isArray(value.weekly)||value.weekly.length!==13||!value.weekly.every((week,index)=>object(week)&&week.week===index+1&&['revenue','cost','visits'].every(key=>numberIn(week[key]))))return false
  if(!Array.isArray(value.activity)||!value.activity.every(activity=>object(activity)&&roomId(activity.room)&&integerIn(activity.slot,0,4)&&programId(activity.program)&&numberIn(activity.capacity,0,ROOM[activity.room].capacity)&&numberIn(activity.attendees,0,activity.capacity as number)&&numberIn(activity.experience,0,100)))return false
  return legacy||(['rentalRevenue','classRevenue','rentalCost','classCost'].every(key=>numberIn(value[key]))&&numberIn(value.reputationChange,-100,100)&&(value.breakdownAvailable===undefined||typeof value.breakdownAvailable==='boolean'))
}
function validInstitution(value:unknown,legacy=false):boolean {
  if(!object(value)||!['id','name','archetype','lastPurchase'].every(key=>typeof value[key]==='string'))return false
  if(!numberIn(value.cash)||!numberIn(value.reserved,0,value.cash)||!numberIn(value.baseReserve)||!numberIn(value.trust,0,100))return false
  if(!['score','publicScore','experienceScore','utilization'].every(key=>numberIn(value[key],0,100))||!numbers(value.history)||!numbers(value.annualScores))return false
  if(!object(value.xp)||!['culture','sport','event'].every(key=>numberIn((value.xp as Data)[key])))return false
  if(!object(value.yearStats)||!['publicServed','publicRequested','experienceSum','experienceWeight','use','weeks'].every(key=>numberIn((value.yearStats as Data)[key])))return false
  if(typeof value.supportContract!=='boolean'||typeof value.trained!=='boolean'||!['standard','discount','premium'].includes(value.priceMode as string)||!['fast','welcome'].includes(value.guideMode as string))return false
  const expected:RoomId[]=legacy?['A','B','C']:ROOM_IDS
  if(!Array.isArray(value.rooms)||value.rooms.length!==expected.length||!value.rooms.every(room=>object(room)&&expected.includes(room.id as RoomId)&&typeof room.open==='boolean'&&typeof room.mode==='string'&&strings(room.equipment)&&room.equipment.every(id=>Object.hasOwn(OFFER,id))&&(legacy||numberIn(room.management,0,100)&&numberIn(room.facilityQuality,0,100)&&numberIn(room.facilityUpkeep))))return false
  if(new Set(value.rooms.map(room=>(room as Data).id)).size!==expected.length||!object(value.plan)||!expected.every(id=>Array.isArray((value.plan as Data)[id])&&((value.plan as Data)[id] as unknown[]).length===5&&((value.plan as Data)[id] as unknown[]).every(p=>p===null||programId(p))))return false
  if(!Array.isArray(value.inventory)||!value.inventory.every(equipment=>object(equipment)&&typeof equipment.id==='string'&&Object.hasOwn(OFFER,equipment.id)&&(equipment.room===null||expected.includes(equipment.room as RoomId))&&numberIn(equipment.condition,0,100)&&typeof equipment.ready==='boolean'&&(equipment.stored===undefined||typeof equipment.stored==='boolean')&&(legacy||typeof equipment.instanceId==='string'&&equipment.instanceId.length>0)))return false
  const inventory=value.inventory as unknown as Equipment[]
  if(!legacy&&new Set(inventory.map(e=>e.instanceId)).size!==inventory.length)return false
  const families=new Set<string>()
  for(const equipment of inventory){
    if(equipment.stored){
      if(legacy||equipment.room!==null||equipment.ready||COMMON_FAMILIES.includes(OFFER[equipment.id].family))return false
      continue
    }
    const key=`${equipment.room}:${OFFER[equipment.id].family}`
    if(families.has(key))return false
    families.add(key)
    if(COMMON_FAMILIES.includes(OFFER[equipment.id].family)!==(equipment.room===null))return false
  }
  for(const id of expected){
    const installed=inventory.filter(e=>e.room===id).map(e=>e.id).sort()
    const declared=(value.rooms as unknown as Room[]).find(room=>room.id===id)!.equipment.slice().sort()
    if(JSON.stringify(installed)!==JSON.stringify(declared))return false
    if(!legacy&&inventory.filter(e=>e.room===id&&!['flex','quiet'].includes(OFFER[e.id].family)).length>ROOM[id].equipmentSlots)return false
  }
  if(!Array.isArray(value.pendingTasks)||!value.pendingTasks.every(task=>{
    if(!object(task)||!['install','maintain','train','open'].includes(task.kind as string)||!expected.includes(task.room as RoomId)||!integerIn(task.remaining,1,5))return false
    if(task.kind==='install')return inventory.some(e=>!e.stored&&(legacy?e.id:e.instanceId)===task.equipment&&(e.room===task.room||e.room===null)&&!e.ready)
    return task.kind!=='train'||['culture','sport','event'].includes(task.expertise as string)
  }))return false
  if(legacy)return true
  for(const program of PROGRAMS)if(program.weeklyLimit&&ROOM_IDS.reduce((sum,room)=>sum+(value.plan as Plan)[room].filter(id=>id===program.id).length,0)>program.weeklyLimit)return false
  if(![846,864,882,900,918,936,954].includes(value.annualBudget as number)||!Array.isArray(value.evaluations)||value.evaluations.length>3||!value.evaluations.every(validEvaluation))return false
  const evaluationYears=value.evaluations.map(entry=>entry.year)
  if(evaluationYears.some((year,index)=>index>0&&year<=evaluationYears[index-1]))return false
  if(!object(value.evaluationStats)||!['publicServed','publicRequested','experienceSum','experienceWeight','use','weeks','revenue','cost','grants','reputationSum'].every(key=>numberIn((value.evaluationStats as Data)[key]))||!integerIn(value.evaluationStats.seasons,0,8))return false
  if(value.evaluationStats.weeks!==value.evaluationStats.seasons*13||!numberIn(value.evaluationStats.reputationSum,0,value.evaluationStats.seasons*100+.01))return false
  if(!numberIn(value.reputation,0,100)||!Array.isArray(value.rentalRequests))return false
  const occupied=new Set<string>(),requestIds=new Set<string>()
  for(const request of value.rentalRequests){
    if(!object(request)||typeof request.id!=='string'||requestIds.has(request.id)||!roomId(request.room)||!integerIn(request.slot,0,4)||!programId(request.program)||!isRentalProgram(request.program)||typeof request.client!=='string'||typeof request.title!=='string'||!numberIn(request.attendees,1,roomCapacity(request.room,request.program))||!numberIn(request.fee)||!numberIn(request.cost)||!['pending','accepted','declined'].includes(request.status as string))return false
    requestIds.add(request.id)
    if(!(value.rooms as unknown as Room[]).find(room=>room.id===request.room)?.open)return false
    if(request.status==='accepted'){
      const key=`${request.room}:${request.slot}`
      if(occupied.has(key)||(value.plan as Plan)[request.room][request.slot]!==request.program)return false
      occupied.add(key)
    }
  }
  for(const id of expected)for(let slot=0;slot<5;slot++)if(isRentalProgram((value.plan as Plan)[id][slot]??'')&&!occupied.has(`${id}:${slot}`))return false
  return validateFacilityProjects(value as unknown as Institution)&&validateCampusProjects(value as unknown as Institution)
}
/** Reject malformed saves before any UI or economic operation reads their data. */
export function validateSave(value:unknown):value is GameState {
  try {
    if(!object(value)||value.version!==2||!integerIn(value.seed,0,Number.MAX_SAFE_INTEGER)||!integerIn(value.year,1,MAX_YEARS)||!integerIn(value.season,0,3)||!['planning','review','ending'].includes(value.phase as string)||!['rentals','classes'].includes(value.planningStage as string))return false
    if(value.specialtyRulesVersion!==undefined&&value.specialtyRulesVersion!==1)return false
    if(value.migrationNotices!==undefined&&(!Array.isArray(value.migrationNotices)||value.migrationNotices.length>1000||!value.migrationNotices.every(message=>typeof message==='string'&&message.length<=500)))return false
    if(!validInstitution(value.player)||!Array.isArray(value.rivals)||value.rivals.length!==9||!value.rivals.every(rival=>validInstitution(rival)))return false
    if(value.specialtyRulesVersion===1&&[value.player,...value.rivals].some(institution=>ROOM_IDS.some(room=>(institution as Institution).plan[room].some(id=>id&&PROGRAM[id].exclusiveRoom&&PROGRAM[id].exclusiveRoom!==room))))return false
    const ids=[(value.player as Institution).id,...(value.rivals as Institution[]).map(r=>r.id)]
    if(new Set(ids).size!==10||ids.includes('onnuri'))return false
    if(!Array.isArray(value.history)||value.history.length>MAX_TURNS||!value.history.every(report=>validReport(report)))return false
    if(value.lastReport!==null&&!validReport(value.lastReport))return false
    if(value.phase!=='planning'&&value.lastReport===null)return false
    if(value.phase==='ending'&&(value.year!==MAX_YEARS||value.season!==3))return false
    if([value.player,...value.rivals].some(inst=>(inst as Institution).evaluations.some(record=>record.year>(value.year as number))))return false
    return true
  }catch{return false}
}
/** One-time compatibility change: preserve capital and history, explain only future-plan changes. */
function migrateSpecialtyRules(state:GameState):void {
  if(state.specialtyRulesVersion===1)return
  const notices:string[]=[]
  for(const inst of [state.player,...state.rivals]){
    const label=inst.id==='player'?'우리 센터':inst.name.slice(0,40)
    for(const room of ROOM_IDS)for(let slot=0;slot<BLOCKS.length;slot++){
      const id=inst.plan[room][slot],program=id?PROGRAM[id]:undefined
      if(program?.exclusiveRoom&&program.exclusiveRoom!==room){
        inst.plan[room][slot]=null
        notices.push(`${label} · ${ROOM_NAMES[room]} ${BLOCKS[slot]}: ${program.shortName} 편성을 비웠어요. 이제 ${ROOM_NAMES[program.exclusiveRoom]} 전용 수업이에요. 기존 운영 기록과 자금은 유지했어요.`)
      }
    }
    for(const equipment of inst.inventory){
      const offer=OFFER[equipment.id],room=equipment.room
      if(equipment.stored||room===null||!offer.exclusiveRoom||offer.exclusiveRoom===room)continue
      // Video gear also supplies a screen. Do not break an ordinary class or signed rental.
      const neededByGeneralPlan=inst.plan[room].some(id=>id&&!PROGRAM[id].exclusiveRoom&&PROGRAM[id].requires.some(capability=>offer.capabilities.includes(capability)))
      const neededByRental=inst.rentalRequests.some(request=>request.status==='accepted'&&request.room===room&&PROGRAM[request.program].requires.some(capability=>offer.capabilities.includes(capability)))
      if(neededByGeneralPlan||neededByRental){
        notices.push(`${label} · ${ROOM_NAMES[room]}의 ${offer.name}: 기존 일반 수업·승인 대관에 필요한 기능이 있어 설치 상태로 보존했어요. 새 구매·재설치는 ${ROOM_NAMES[offer.exclusiveRoom]}에서 할 수 있어요.`)
        continue
      }
      roomOf(inst,room)!.equipment=roomOf(inst,room)!.equipment.filter(id=>id!==equipment.id)
      inst.pendingTasks=inst.pendingTasks.filter(task=>task.kind!=='install'||task.equipment!==equipment.instanceId)
      equipment.room=null;equipment.ready=false;equipment.stored=true
      notices.push(`${label} · ${ROOM_NAMES[room]}의 ${offer.name}을 비용 없이 보관했어요. 개체·상태·유지비는 유지하며 ${ROOM_NAMES[offer.exclusiveRoom]}에 재설치할 수 있어요.`)
    }
  }
  state.specialtyRulesVersion=1
  if(notices.length)state.migrationNotices=[...new Set([...(state.migrationNotices??[]),...notices])].slice(-1000)
}
/** Upgrade saves without replaying, repricing or reranking their recorded history. */
export function migrateSave(value:unknown):GameState|null {
  if(validateSave(value)){
    const next=copy(value)
    // Some already-upgraded saves retain an eleven-center historical ranking.
    for(const report of [...next.history,...(next.lastReport?[next.lastReport]:[])])if(report.participants===undefined)report.participants=Math.max(next.rivals.length+1,report.rank)
    migrateSpecialtyRules(next)
    return next
  }
  try {
    if(object(value)&&value.version===2&&object(value.player)&&Array.isArray(value.rivals)&&value.rivals.every(object)){
      const upgraded=copy(value)
      const oldParticipants=(upgraded.rivals as Data[]).length+1
      if((upgraded.rivals as Data[]).length===10){
        if((upgraded.rivals as Data[]).filter(inst=>inst.id==='onnuri').length!==1)return null
        upgraded.rivals=(upgraded.rivals as Data[]).filter(inst=>inst.id!=='onnuri')
      }
      for(const inst of [upgraded.player as Data,...upgraded.rivals as Data[]]){
        if(inst.campusProjects===undefined)inst.campusProjects=[]
        migrateCampusProjects(inst as unknown as Institution)
        // Recorded annual scores remain historical; missing two-year evidence is
        // never reconstructed from old scores or from today's cash balance.
        if(inst.annualBudget===undefined&&inst.evaluations===undefined&&inst.evaluationStats===undefined){inst.annualBudget=BASE_ANNUAL_BUDGET;inst.evaluations=[];inst.evaluationStats=emptyEvaluationStats()}
      }
      if(upgraded.phase==='ending'&&upgraded.year===5&&upgraded.season===3)upgraded.phase='review'
      const reports=[...(Array.isArray(upgraded.history)?upgraded.history:[]),...(object(upgraded.lastReport)?[upgraded.lastReport]:[])]
      for(const report of reports)if(object(report)&&report.participants===undefined)report.participants=Math.max(oldParticipants,typeof report.rank==='number'?report.rank:0)
      if(!validateSave(upgraded))return null
      migrateSpecialtyRules(upgraded)
      return validateSave(upgraded)?upgraded:null
    }
    if(!object(value)||value.version!==1||!integerIn(value.seed,0,Number.MAX_SAFE_INTEGER)||!integerIn(value.year,1,5)||!integerIn(value.season,0,3)||!['planning','review','ending'].includes(value.phase as string))return null
    if(!validInstitution(value.player,true)||!Array.isArray(value.rivals)||![9,10].includes(value.rivals.length)||!value.rivals.every(inst=>validInstitution(inst,true)))return null
    if(value.rivals.length===10&&value.rivals.filter(inst=>(inst as Institution).id==='onnuri').length!==1)return null
    if(!Array.isArray(value.history)||value.history.length>20||!value.history.every(report=>validReport(report,true))||(value.lastReport!==null&&!validReport(value.lastReport,true)))return null
    const next=copy(value) as unknown as GameState
    next.rivals=next.rivals.filter(inst=>inst.id!=='onnuri')
    next.version=2;next.planningStage=next.phase==='planning'?'rentals':'classes'
    for(const inst of [next.player,...next.rivals]){
      const original=inst.rooms
      inst.rooms=ROOM_IDS.map(id=>{
        const room=original.find(room=>room.id===id)
        return room?{...room,management:90,facilityQuality:100,facilityUpkeep:0}:{id,open:!['C','D','G'].includes(id),equipment:[],mode:id==='G'?'nook':'seats',management:90,facilityQuality:100,facilityUpkeep:0}
      })
      for(const id of ROOM_IDS)inst.plan[id]=(inst.plan[id]??[null,null,null,null,null]).map(p=>p&&isRentalProgram(p)?null:p)
      inst.inventory.forEach((equipment,index)=>{equipment.instanceId=`${inst.id}-legacy-${index+1}`})
      for(const task of inst.pendingTasks)if(task.kind==='install')task.equipment=inst.inventory.find(e=>e.id===task.equipment&&(e.room===task.room||e.room===null))!.instanceId
      inst.reputation=30;inst.facilityProjects=[];inst.campusProjects=[];inst.rentalRequests=next.phase==='planning'?generateRentals(inst,next):[]
      inst.annualBudget=BASE_ANNUAL_BUDGET;inst.evaluations=[];inst.evaluationStats=emptyEvaluationStats()
    }
    const legacyParticipants=value.rivals.length+1
    const upgradeReport=(report:SeasonReport):SeasonReport=>({...report,rentalRevenue:0,classRevenue:0,rentalCost:0,classCost:0,reputationChange:0,breakdownAvailable:false,participants:report.participants??legacyParticipants})
    next.history=next.history.map(upgradeReport)
    next.lastReport=next.lastReport?upgradeReport(next.lastReport):null
    if(next.phase==='ending'&&next.year===5&&next.season===3)next.phase='review'
    if(!validateSave(next))return null
    migrateSpecialtyRules(next)
    return validateSave(next)?next:null
  }catch{return null}
}
