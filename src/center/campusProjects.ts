import type {GameState,Institution,MutationResult} from './simulation'
import type {FacilityBid} from './facilityProjects'

export type CampusProjectId='garden'|'facade'
export interface CampusProject {
  id:CampusProjectId; stage:'announced'|'bidding'|'construction'|'complete'; bids:FacilityBid[]
  selectedBidId:string|null; remainingWeeks:number; announcedYear:number; announcedSeason:number
}
export const CAMPUS_SCOPES=[
  {id:'garden' as const,name:'정원과 쉼터 조성',budget:2400,upkeep:12,reputation:8,experience:1.5,rental:.02,image:'/center/building-v2/exterior-garden.webp',description:'수목·화단·벤치와 그늘 쉼터를 갖춘 앞마당'},
  {id:'facade' as const,name:'외관과 광장 개선',budget:6000,upkeep:24,reputation:12,experience:2.5,rental:.04,image:'/center/building-v2/exterior-renovated.webp',description:'같은 건물의 외장·출입구·보행 광장을 품격 있게 개선'},
]
const round=(n:number)=>Math.round(n*100)/100
const hash=(text:string)=>{let h=2166136261;for(const c of text){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
export const getCampusProject=(inst:Institution,id:CampusProjectId)=>inst.campusProjects.find(item=>item.id===id)
export function campusTier(inst:Institution):0|1|2{return getCampusProject(inst,'facade')?.stage==='complete'?2:getCampusProject(inst,'garden')?.stage==='complete'?1:0}
export function campusUpkeep(inst:Institution):number {
  return inst.campusProjects.reduce((sum,p)=>sum+(['construction','complete'].includes(p.stage)?p.bids.find(b=>b.id===p.selectedBidId)?.upkeep??0:0),0)
}
export function campusBenefits(inst:Institution){
  let experience=0,rental=0
  for(const project of inst.campusProjects.filter(p=>p.stage==='complete')){
    const scope=CAMPUS_SCOPES.find(s=>s.id===project.id)!,bid=project.bids.find(b=>b.id===project.selectedBidId)!
    experience+=scope.experience*bid.finalQuality/100;rental+=scope.rental*bid.finalQuality/100
  }
  return {experience:round(experience),rental:round(rental)}
}
function allowed(state:GameState,id:CampusProjectId){
  if(state.phase!=='planning')return '계획 단계에서 환경 개선 사업을 진행해 주세요.'
  if(!CAMPUS_SCOPES.some(s=>s.id===id))return '사업을 확인해 주세요.'
  if(id==='facade'&&getCampusProject(state.player,'garden')?.stage!=='complete')return '정원과 쉼터 조성을 마친 뒤 외관 사업을 진행할 수 있어요.'
}
export function postCampusTender(state:GameState,id:CampusProjectId):MutationResult{
  const error=allowed(state,id);if(error)return {state,error}
  if(getCampusProject(state.player,id))return {state,error:'이미 공고한 사업을 이어서 진행해 주세요.'}
  const next=structuredClone(state)
  next.player.campusProjects.push({id,stage:'announced',bids:[],selectedBidId:null,remainingWeeks:0,announcedYear:state.year,announcedSeason:state.season})
  return {state:next}
}
export function collectCampusBids(state:GameState,id:CampusProjectId):MutationResult{
  const error=allowed(state,id);if(error)return {state,error}
  const project=getCampusProject(state.player,id)
  if(project?.stage!=='announced')return {state,error:'시설 공고를 먼저 게시해 주세요.'}
  const next=structuredClone(state),target=getCampusProject(next.player,id)!,scope=CAMPUS_SCOPES.find(s=>s.id===id)!
  const specs=[{name:'새움시설',suffix:'quick',factor:.75,weeks:9,low:70,high:78,extra:4},
    {name:'바른공간',suffix:'balanced',factor:1,weeks:18,low:83,high:90,extra:0},
    {name:'결고운건축',suffix:'finish',factor:1.25,weeks:31,low:94,high:99,extra:-4}]
  target.bids=specs.map(s=>({id:`campus-${id}-${s.suffix}`,vendor:s.name,approach:s.suffix==='quick'?'빠른 완공 · 기본 마감':s.suffix==='balanced'?'공사비와 완성도의 균형':'긴 공정 · 정교한 마감',price:Math.round(scope.budget*s.factor),weeks:s.weeks,qualityMin:s.low,qualityMax:s.high,finalQuality:s.low+hash(`${state.seed}:${id}:${project.announcedYear}:${project.announcedSeason}:${s.suffix}`)%(s.high-s.low+1),upkeep:scope.upkeep+s.extra}))
  target.stage='bidding';return {state:next}
}
export function awardCampusContract(state:GameState,id:CampusProjectId,bidId:string):MutationResult{
  const error=allowed(state,id);if(error)return {state,error}
  const project=getCampusProject(state.player,id),bid=project?.bids.find(b=>b.id===bidId)
  if(project?.stage!=='bidding'||!bid)return {state,error:'접수한 제안서에서 업체를 골라 주세요.'}
  const reserve=bid.upkeep*(4-state.season)
  if(state.player.cash-state.player.reserved<bid.price+reserve)return {state,error:`공사비와 올해 관리비 ${bid.price+reserve}점이 필요해요.`}
  const next=structuredClone(state),target=getCampusProject(next.player,id)!
  next.player.cash=round(next.player.cash-bid.price);next.player.reserved=round(next.player.reserved+reserve)
  target.stage='construction';target.selectedBidId=bid.id;target.remainingWeeks=bid.weeks
  next.player.lastPurchase=`${CAMPUS_SCOPES.find(s=>s.id===id)!.name} · ${bid.vendor} 계약`
  return {state:next}
}
/** Return the one-time reputation gain separately from organic class growth. */
export function advanceCampusProjects(inst:Institution):number{
  let gain=0
  for(const project of inst.campusProjects){
    if(project.stage!=='construction')continue
    project.remainingWeeks=Math.max(0,project.remainingWeeks-1)
    if(project.remainingWeeks)continue
    project.stage='complete'
    const scope=CAMPUS_SCOPES.find(s=>s.id===project.id)!,bid=project.bids.find(b=>b.id===project.selectedBidId)!
    gain+=Math.round(scope.reputation*bid.finalQuality/100)
    inst.lastPurchase=`${scope.name} 완료 · 완성도 ${bid.finalQuality}`
  }
  inst.reputation=Math.min(100,inst.reputation+gain)
  return gain
}
export function planRivalCampus(inst:Institution,calendar:Pick<GameState,'seed'|'year'|'season'>):void{
  if(calendar.year<3||!['byeolbit','neulpum','daon'].includes(inst.id))return
  const id:CampusProjectId=campusTier(inst)>0?'facade':'garden'
  if(getCampusProject(inst,id)?.stage==='complete')return
  let state={...calendar,version:2,phase:'planning',planningStage:'rentals',player:inst,rivals:[],history:[],lastReport:null} as GameState
  if(!getCampusProject(inst,id))state=postCampusTender(state,id).state
  if(getCampusProject(state.player,id)?.stage==='announced')state=collectCampusBids(state,id).state
  const project=getCampusProject(state.player,id)
  if(project?.stage==='bidding'){
    const bid=project.bids[inst.id==='byeolbit'?2:inst.id==='neulpum'?0:1]
    if(state.player.cash-state.player.reserved-bid.price-bid.upkeep*(4-calendar.season)>=350)state=awardCampusContract(state,id,bid.id).state
  }
  Object.assign(inst,state.player)
}
export function validateCampusProjects(inst:Institution):boolean{
  if(!Array.isArray(inst.campusProjects)||inst.campusProjects.length>2)return false
  const ids=new Set<string>()
  for(const p of inst.campusProjects){
    if(!p||!CAMPUS_SCOPES.some(s=>s.id===p.id)||ids.has(p.id)||!['announced','bidding','construction','complete'].includes(p.stage))return false
    ids.add(p.id)
    if(!Number.isInteger(p.announcedYear)||p.announcedYear<1||p.announcedYear>6||!Number.isInteger(p.announcedSeason)||p.announcedSeason<0||p.announcedSeason>3||!Number.isInteger(p.remainingWeeks)||p.remainingWeeks<0||p.remainingWeeks>31||!Array.isArray(p.bids))return false
    if(p.stage==='announced'&&(p.bids.length!==0||p.selectedBidId!==null||p.remainingWeeks!==0))return false
    if(p.stage!=='announced'&&p.bids.length!==3)return false
    if(new Set(p.bids.map(b=>b.id)).size!==p.bids.length||!p.bids.every(b=>typeof b.id==='string'&&typeof b.vendor==='string'&&typeof b.approach==='string'&&[b.price,b.weeks,b.upkeep,b.qualityMin,b.qualityMax,b.finalQuality].every(Number.isFinite)&&b.price>0&&Number.isInteger(b.weeks)&&b.weeks>0&&b.weeks<=31&&b.upkeep>=0&&b.qualityMin>=0&&b.qualityMin<=b.finalQuality&&b.finalQuality<=b.qualityMax&&b.qualityMax<=100))return false
    const bid=p.bids.find(b=>b.id===p.selectedBidId)
    if(p.stage==='bidding'&&(p.selectedBidId!==null||p.remainingWeeks!==0))return false
    if(['construction','complete'].includes(p.stage)&&!bid)return false
    if(p.stage==='construction'&&(p.remainingWeeks<1||p.remainingWeeks>bid!.weeks))return false
    if(p.stage==='complete'&&p.remainingWeeks!==0)return false
    if(p.id==='facade'&&getCampusProject(inst,'garden')?.stage!=='complete')return false
  }
  return true
}
