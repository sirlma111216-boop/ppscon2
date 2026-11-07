import { finalScore, getAwardForRank, getFinalRank, MAX_YEARS } from './simulation.ts'
import type { GameState } from './simulation'
export const HALL_KEY='ppscon2.hall.v1'
export interface HallEntry { id:string; name:string; award:string; score:number; rank:number; date:string }
type Store=Pick<Storage,'getItem'|'setItem'>
export function hallId(game:GameState):string {
  const raw=JSON.stringify([game.seed,game.history,game.player.evaluations])
  let hash=2166136261;for(const c of raw) hash=Math.imul(hash^c.charCodeAt(0),16777619)
  return `${game.seed}-${(hash>>>0).toString(16)}`
}
export function readHall(storage:Store):HallEntry[] {
  const raw=storage.getItem(HALL_KEY);if(!raw)return []
  const entries:unknown=JSON.parse(raw)
  if(!Array.isArray(entries)||entries.length>100||!entries.every(e=>e&&typeof e.id==='string'&&typeof e.name==='string'&&e.name.length<=24&&typeof e.award==='string'&&Number.isFinite(e.score)&&e.score>=0&&e.score<=100&&Number.isInteger(e.rank)&&e.rank>=1&&e.rank<=10&&typeof e.date==='string'))throw new Error('명예의 전당 기록을 읽지 못했어요. 기존 기록은 보존됩니다.')
  return entries as HallEntry[]
}
export function registerHall(storage:Store,game:GameState,name:string):HallEntry[] {
  if(game.phase!=='ending'||game.year!==MAX_YEARS||game.season!==3||!game.player.evaluations.some(e=>e.year===MAX_YEARS))throw new Error('7년 운영과 최종평가를 마친 뒤 등록할 수 있어요.')
  const clean=name.trim().replace(/[\u0000-\u001f\u007f]/g,'')
  if(!clean||clean.length>24)throw new Error('센터장 이름을 1~24자로 입력해 주세요.')
  const entries=readHall(storage),id=hallId(game)
  if(entries.some(e=>e.id===id))return entries
  const rank=getFinalRank(game)
  entries.push({id,name:clean,award:getAwardForRank(rank)||'운영 완주',score:finalScore(game.player),rank,date:new Date().toISOString()})
  entries.sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date))
  const result=entries.slice(0,100),raw=JSON.stringify(result)
  storage.setItem(HALL_KEY,raw)
  if(storage.getItem(HALL_KEY)!==raw)throw new Error('기록을 저장하지 못했어요.')
  return result
}
