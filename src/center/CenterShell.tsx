import AudioControls from './AudioControls'
import { useAudioBoot, setTrack, playSound } from './audio'
import { useEffect, useRef, useState } from 'react'
import CenterGame from './CenterGame'
import GameTutorial from './GameTutorial'
import { createGame, SEASONS } from './simulation'
import type { GameState } from './simulation'
import { parseSaveFile, replaceGameSave, SAVE_KEY } from './savePersistence'
import { readHall } from './hallOfFame'
import type { HallEntry } from './hallOfFame'
import { campusExteriorPath } from './campusProjects'
import './CenterShell.css'

function snapshot(){try{const raw=localStorage.getItem(SAVE_KEY);return {raw,game:raw?parseSaveFile(raw):null,error:''}}catch{return {raw:null,game:null,error:'저장 기록을 읽지 못했어요. 기존 데이터는 그대로 보존됩니다.'}}}
export default function CenterShell(){
 useAudioBoot()
 const [screen,setScreen]=useState<'home'|'game'|'hall'|'tutorial'>('home')
 useEffect(()=>{if(screen!=='game')setTrack('title')},[screen])
 const [tutorialGame,setTutorialGame]=useState<GameState|null>(null)
 const [save,setSave]=useState(snapshot),[message,setMessage]=useState('')
 const [pending,setPending]=useState<{game:GameState;label:string;newGame?:boolean}|null>(null)
 const [entries,setEntries]=useState<HallEntry[]>([])
 const file=useRef<HTMLInputElement>(null)
 useEffect(()=>{if(!pending&&screen!=='hall')return;const before=document.activeElement as HTMLElement|null;const old=document.body.style.overflow;document.body.style.overflow='hidden';const dialog=document.querySelector<HTMLElement>('.title-dialog');const items=()=>[...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]),input')||[])];items()[0]?.focus();const key=(e:KeyboardEvent)=>{if(e.key==='Escape'){setPending(null);setScreen('home')}if(e.key==='Tab'){const all=items(),first=all[0],last=all.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}}};document.addEventListener('keydown',key);return()=>{document.body.style.overflow=old;document.removeEventListener('keydown',key);before?.focus()}},[pending,screen])
 function home(){setSave(snapshot());setScreen('home')}
 function replace(game:GameState){try{replaceGameSave(localStorage,game);setPending(null);setSave(snapshot());setMessage('');setScreen('game')}catch(e){setMessage(e instanceof Error?e.message:'저장하지 못했어요.')}}
 function exportSave(){try{const raw=localStorage.getItem(SAVE_KEY);if(!raw)throw new Error('내보낼 저장 기록이 없어요.');const url=URL.createObjectURL(new Blob([raw],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='센터장님-게임저장-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);playSound('save_complete');setMessage('저장 파일을 내려받았어요. 다른 기기의 파일 불러오기로 이어갈 수 있어요.')}catch(e){setMessage(e instanceof Error?e.message:'내보내지 못했어요.')}}
 if(screen==='game')return <CenterGame onHome={home} skipWelcome/>
 if(screen==='tutorial')return <GameTutorial replay={!tutorialGame} error={message} onCancel={()=>{setTutorialGame(null);setMessage('');home()}} onFinish={()=>{if(tutorialGame)replace(tutorialGame);else home()}}/>
 return <main className="center-title-screen">
  <img className="title-art" src={save.game?campusExteriorPath(save.game.player):'/center/campus-v3/exterior-0.webp'} alt="햇살이 비치는 우리 동네 문화체육센터"/>
  <section className="title-panel"><AudioControls/>
   <span className="title-kicker">우리 동네를 키우는 7년</span>
   <h1>센터장님,<br/>다음 주는요?</h1>
   <p>나라장터에서 물품을 고르고, 수업을 열고,<br/>주민과 함께 센터의 내일을 만드세요.</p>
   <nav className="title-menu" aria-label="게임 시작 메뉴">
    <button className="primary-button" onClick={()=>{setMessage('');if(save.raw){setPending({game:createGame(),newGame:true,label:'새로운 7년을 시작할까요? 안내를 마치거나 건너뛰어 본 게임을 시작할 때 기존 진행을 백업합니다.'})}else{setTutorialGame(createGame());setScreen('tutorial')}}}>새 게임 시작</button>
    <button className="secondary-button" disabled={!save.game} onClick={()=>setScreen('game')}>이어서 하기{save.game&&<small>{save.game.year}년 차 · {SEASONS[save.game.season]}{save.game.phase==='ending'?' · 최종 기록':''}</small>}</button>
    <button className="secondary-button" onClick={()=>{try{setEntries(readHall(localStorage));setScreen('hall');setMessage('')}catch(e){setMessage(e instanceof Error?e.message:'기록을 읽지 못했어요.')}}}>명예의 전당</button>
   </nav>
   <div className="title-save-tools"><button onClick={()=>{setTutorialGame(null);setMessage('');setScreen('tutorial')}}>게임 방법 보기</button><button onClick={exportSave}>저장 파일 내보내기</button><button onClick={()=>file.current?.click()}>파일 불러오기</button></div>
   <input ref={file} type="file" accept=".json,application/json" hidden onChange={async e=>{const selected=e.target.files?.[0];e.target.value='';if(!selected)return;try{if(selected.size>5_000_000)throw new Error('5MB 이하의 저장 파일을 선택하세요.');const game=parseSaveFile(await selected.text());setPending({game,label:`${game.year}년 차 ${SEASONS[game.season]} 기록을 불러올까요? 현재 진행은 먼저 백업합니다.`});setMessage('')}catch(err){setMessage(err instanceof Error?err.message:'불러오지 못했어요.')}}}/>
   <small className="title-save-note">자동저장 · 이 브라우저에 보관<br/>브라우저 데이터를 지우기 전 저장 파일을 내려받아 주세요.</small>
   {(message||save.error)&&<p className="title-message" role="status">{message||save.error}</p>}
  </section>
  {pending&&<div className="title-overlay"><section role="dialog" aria-modal="true" aria-labelledby="replace-title" className="title-dialog"><h2 id="replace-title">진행 기록 확인</h2><p>{pending.label}</p>{message&&<p role="alert">{message}</p>}<div className="review-actions"><button autoFocus className="secondary-button" onClick={()=>setPending(null)}>취소</button><button className="primary-button" onClick={()=>{if(pending.newGame){setTutorialGame(pending.game);setPending(null);setScreen('tutorial')}else replace(pending.game)}}>{pending.newGame?'게임 안내 보기':'확인하고 시작'}</button></div></section></div>}
  {screen==='hall'&&<div className="title-overlay"><section className="title-dialog hall-board" role="dialog" aria-modal="true" aria-labelledby="hall-title"><h2 id="hall-title">명예의 전당</h2><p>7년을 함께한 센터장님들 · 이 기기의 상위 100개 기록</p>{entries.length?<ol>{entries.map(e=><li key={e.id}><span><strong>{e.name}</strong><small>{e.award} · 최종 {e.rank}위</small></span><b>{e.score.toFixed(1)}점</b></li>)}</ol>:<p className="hall-empty">첫 번째 센터장님의 이야기를 기다리고 있어요.</p>}<button autoFocus className="secondary-button" onClick={()=>setScreen('home')}>첫 화면으로</button></section></div>}
 </main>
}
