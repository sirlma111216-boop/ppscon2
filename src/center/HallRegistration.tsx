import { playSound } from './audio'
import { useState } from 'react'
import type { GameState } from './simulation'
import { hallId, readHall, registerHall } from './hallOfFame'
export default function HallRegistration({game}:{game:GameState}) {
 const [name,setName]=useState(''),[message,setMessage]=useState('')
 const [registered,setRegistered]=useState(()=>{try{return readHall(localStorage).find(e=>e.id===hallId(game))?.name||''}catch{return ''}})
 return <section className="hall-registration"><h3>명예의 전당에 이름을 남겨 주세요</h3>{registered?<p role="status">{registered} 센터장님의 최종 상격과 점수를 기록했어요.</p>:<form onSubmit={e=>{e.preventDefault();try{registerHall(localStorage,game,name);playSound('save_complete');setRegistered(name.trim());setMessage('')}catch(err){setMessage(err instanceof Error?err.message:'저장하지 못했어요.')}}}><label>센터장 이름<input value={name} maxLength={24} required autoComplete="off" onChange={e=>setName(e.target.value)} /></label><button className="primary-button" type="submit">최종 기록 남기기</button></form>}<small>이 브라우저의 명예의 전당에 저장됩니다.</small>{message&&<p role="alert">{message}</p>}</section>
}
