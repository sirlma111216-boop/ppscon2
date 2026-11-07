import { wonAmount } from './currency.ts'
import { MAX_YEARS } from './campaign.ts'
import type { GameState, Institution, MutationResult, RoomId } from './simulation'

export interface FacilityBid {
  id:string; vendor:string; approach:string; price:number; weeks:number
  qualityMin:number; qualityMax:number; finalQuality:number; upkeep:number
}
export interface FacilityProject {
  id:string; room:RoomId; title:string; stage:'announced'|'bidding'|'construction'|'complete'
  bids:FacilityBid[]; selectedBidId:string|null; remainingWeeks:number
  announcedYear:number; announcedSeason:number
}
export interface FacilityScope { room:RoomId; title:string; brief:string; budget:number; baseUpkeep:number }
export function constructionTurns(weeks:number):number { return Math.ceil(Math.max(0,weeks)/13) }
export function expectedConstructionCompletion(calendar:Pick<GameState,'year'|'season'|'phase'>,remainingWeeks:number):{year:number;season:number;week:number;turn:number;turns:number;withinGame:boolean}|null {
  if(!Number.isFinite(remainingWeeks)||remainingWeeks<=0)return null
  const start=(calendar.year-1)*4+calendar.season+(calendar.phase==='planning'?0:1)
  const completed=start+Math.floor((remainingWeeks-1)/13),year=Math.floor(completed/4)+1
  return {year,season:completed%4,week:(remainingWeeks-1)%13+1,turn:completed+1,turns:constructionTurns(remainingWeeks),withinGame:year<=MAX_YEARS}
}
export const FACILITY_SCOPES:FacilityScope[] = [
  {room:'C',title:'대강당 시설 조성',brief:'객석·흡음·무대 기반과 안전 동선을 갖춘 큰 행사 공간',budget:540,baseUpkeep:6},
  {room:'D',title:'소강당 2 시설 조성',brief:'가변 좌석과 마감 품질을 갖춘 고급 강연·발표 공간',budget:360,baseUpkeep:4},
  {room:'G',title:'프리미엄회의실 시설 조성',brief:'방음·조명·회의 가구를 갖춘 소규모 비즈니스 공간',budget:300,baseUpkeep:3},
]
const round = (n:number) => Math.round(n*100)/100
const hash = (text:string) => { let value=2166136261; for(const character of text){value^=character.charCodeAt(0);value=Math.imul(value,16777619)} return value>>>0 }
const clone = (state:GameState):GameState => structuredClone(state)
export const getFacilityProject = (inst:Institution,room:RoomId):FacilityProject|undefined => inst.facilityProjects.find(project=>project.room===room)
export const facilityScope = (room:RoomId) => FACILITY_SCOPES.find(scope=>scope.room===room)
export function getFacilityRentMultiplier(inst:Institution,room:RoomId):number {
  const quality=inst.rooms.find(item=>item.id===room)?.facilityQuality ?? 100
  return round(.6+.004*Math.max(0,Math.min(100,quality)))
}
export function facilityUpkeep(inst:Institution):number {
  return inst.rooms.reduce((sum,room)=>{
    const project=getFacilityProject(inst,room.id)
    const bid=project?.bids.find(item=>item.id===project.selectedBidId)
    return sum+(project?.stage==='construction'||project?.stage==='complete' ? bid?.upkeep ?? 0 : room.facilityUpkeep ?? 0)
  },0)
}
function available(state:GameState,room:RoomId):string|undefined {
  if(state.phase!=='planning')return '계획 단계에서 시설 사업을 진행해 주세요.'
  if(!facilityScope(room))return '이 공간은 별도의 시설 사업이 필요하지 않아요.'
  if(state.player.rooms.find(item=>item.id===room)?.open)return '이미 개방한 공간이에요.'
}
export function postFacilityTender(state:GameState,room:RoomId):MutationResult {
  const error=available(state,room);if(error)return {state,error}
  if(getFacilityProject(state.player,room))return {state,error:'이미 공고한 시설 사업을 이어서 진행해 주세요.'}
  const next=clone(state),scope=facilityScope(room)!
  next.player.facilityProjects.push({id:`facility-${room}-${state.year}-${state.season}`,room,title:scope.title,stage:'announced',bids:[],selectedBidId:null,remainingWeeks:0,announcedYear:state.year,announcedSeason:state.season})
  return {state:next}
}
export function collectFacilityBids(state:GameState,room:RoomId):MutationResult {
  const error=available(state,room);if(error)return {state,error}
  const project=getFacilityProject(state.player,room)
  if(project?.stage!=='announced')return {state,error:'시설 공고를 먼저 게시해 주세요.'}
  const scope=facilityScope(room)!,next=clone(state),target=getFacilityProject(next.player,room)!
  const offers=[
    {suffix:'quick',vendor:'새움시설',approach:'빠른 개방 · 기본 마감',factor:.72,weeks:9,low:70,high:78,upkeep:scope.baseUpkeep+2},
    {suffix:'balanced',vendor:'바른공간',approach:'공사비와 완성도의 균형',factor:.96,weeks:18,low:83,high:90,upkeep:scope.baseUpkeep},
    {suffix:'finish',vendor:'결고운건축',approach:'긴 공정 · 정교한 마감',factor:1.2,weeks:31,low:94,high:99,upkeep:Math.max(1,scope.baseUpkeep-2)},
  ]
  target.bids=offers.map(offer=>({id:`${project.id}-${offer.suffix}`,vendor:offer.vendor,approach:offer.approach,price:Math.round(scope.budget*offer.factor),weeks:offer.weeks,qualityMin:offer.low,qualityMax:offer.high,finalQuality:offer.low+hash(`${state.seed}:${project.id}:${offer.suffix}`)%(offer.high-offer.low+1),upkeep:offer.upkeep}))
  target.stage='bidding'
  return {state:next}
}
export function awardFacilityContract(state:GameState,room:RoomId,bidId:string):MutationResult {
  const error=available(state,room);if(error)return {state,error}
  const project=getFacilityProject(state.player,room),bid=project?.bids.find(item=>item.id===bidId)
  if(project?.stage!=='bidding'||!bid)return {state,error:'접수된 제안서 중 업체를 골라 주세요.'}
  const reserve=bid.upkeep*(4-state.season),required=bid.price+reserve
  if(state.player.cash-state.player.reserved<required)return {state,error:`공사비와 올해 시설 관리비 확보에 ${wonAmount(required)}원이 필요해요.`}
  const next=clone(state),target=getFacilityProject(next.player,room)!
  next.player.cash=round(next.player.cash-bid.price)
  next.player.reserved=round(next.player.reserved+reserve)
  target.selectedBidId=bid.id;target.stage='construction';target.remainingWeeks=bid.weeks
  next.player.lastPurchase=`${target.title} · ${bid.vendor} 계약`
  return {state:next}
}

/** Called on a simulation copy once per operating week, never by UI timers. */
export function advanceFacilityProjects(inst:Institution):void {
  for(const project of inst.facilityProjects){
    if(project.stage!=='construction')continue
    const bid=project.bids.find(item=>item.id===project.selectedBidId)
    if(!bid)continue
    project.remainingWeeks=Math.max(0,project.remainingWeeks-1)
    if(project.remainingWeeks>0)continue
    const room=inst.rooms.find(item=>item.id===project.room)
    if(!room)continue
    project.stage='complete';room.open=true;room.management=100
    room.facilityQuality=bid.finalQuality;room.facilityUpkeep=bid.upkeep
    inst.lastPurchase=`${project.title} 완료 · 완성도 ${bid.finalQuality}`
  }
}

/** AI uses the same public functions and costs; no free unlocks. */
export function planRivalFacility(inst:Institution,state:Pick<GameState,'seed'|'year'|'season'>):void {
  const room=inst.id==='rhythm'||inst.id==='byeolbit'?'C':inst.id==='onnuri'?'D':inst.id==='neulpum'?'G':null
  if(!room||state.year<2||inst.rooms.find(item=>item.id===room)?.open)return
  let shell={...state,version:2,phase:'planning',planningStage:'rentals',player:inst,rivals:[],lastReport:null,history:[]} as GameState
  if(!getFacilityProject(inst,room))shell=postFacilityTender(shell,room).state
  if(getFacilityProject(shell.player,room)?.stage==='announced')shell=collectFacilityBids(shell,room).state
  const project=getFacilityProject(shell.player,room)
  if(project?.stage==='bidding'){
    const order=inst.id==='neulpum'?[0,1,2]:inst.id==='byeolbit'?[2,1,0]:[1,0,2]
    for(const index of order){const bid=project.bids[index];if(!bid)continue;const result=awardFacilityContract(shell,room,bid.id);if(!result.error){shell=result.state;break}}
  }
  Object.assign(inst,shell.player)
}

export function validateFacilityProjects(inst:Institution):boolean {
  if(!Array.isArray(inst.facilityProjects)||inst.facilityProjects.length>3)return false
  const seen=new Set<RoomId>()
  for(const project of inst.facilityProjects){
    if(!project||!facilityScope(project.room)||seen.has(project.room)||typeof project.id!=='string'||typeof project.title!=='string'||!['announced','bidding','construction','complete'].includes(project.stage)||!Array.isArray(project.bids)||!Number.isInteger(project.remainingWeeks)||project.remainingWeeks<0||project.remainingWeeks>31)return false
    seen.add(project.room)
    if(!Number.isInteger(project.announcedYear)||project.announcedYear<1||project.announcedYear>MAX_YEARS||!Number.isInteger(project.announcedSeason)||project.announcedSeason<0||project.announcedSeason>3)return false
    if(project.stage==='announced'&&(project.bids.length!==0||project.selectedBidId!==null))return false
    if(project.stage!=='announced'&&project.bids.length!==3)return false
    if(new Set(project.bids.map(bid=>bid.id)).size!==project.bids.length)return false
    if(!project.bids.every(bid=>typeof bid.id==='string'&&typeof bid.vendor==='string'&&typeof bid.approach==='string'&&[bid.price,bid.weeks,bid.qualityMin,bid.qualityMax,bid.finalQuality,bid.upkeep].every(Number.isFinite)&&bid.price>0&&Number.isInteger(bid.weeks)&&bid.weeks>=1&&bid.weeks<=31&&bid.qualityMin>=0&&bid.qualityMin<=bid.finalQuality&&bid.finalQuality<=bid.qualityMax&&bid.qualityMax<=100&&bid.upkeep>=0))return false
    const selected=project.bids.find(bid=>bid.id===project.selectedBidId)
    if(project.stage==='bidding'&&project.selectedBidId!==null)return false
    if((project.stage==='construction'||project.stage==='complete')&&!selected)return false
    if(project.stage==='construction'&&(project.remainingWeeks<1||project.remainingWeeks>selected!.weeks||inst.rooms.find(room=>room.id===project.room)?.open))return false
    if(project.stage==='complete'&&(project.remainingWeeks!==0||!inst.rooms.find(room=>room.id===project.room)?.open))return false
  }
  return true
}
