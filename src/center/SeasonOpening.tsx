import { COMIC_EVENTS, playSound } from './audio'
import { wonAmount } from './currency'
import { useEffect, useState } from 'react'
import { FINAL_YEAR_BONUS, MAX_YEARS, SEASONS, eventOptionBlock, eventText } from './simulation'
import type { GameState } from './simulation'
import { EVENT_CHOICE_ART, eventArtPath, getSeasonEvent, seasonArtPath, seasonIntroKey } from './seasonEvents'
import './SeasonOpening.css'

export default function SeasonOpening({game,onContinue,onEventSound,onChoose}:{game:GameState;onContinue:()=>void;onEventSound?:(comic:boolean)=>void;onChoose?:(index:number)=>void}) {
  const [showEvent,setShowEvent]=useState(false)
  const event=getSeasonEvent(game)
  const choices=event?.choices
  const chosen=choices?game.eventChoices?.[seasonIntroKey(game)]:undefined
  const [picked,setPicked]=useState<number|undefined>(chosen)
  const art=showEvent&&event?eventArtPath(event.id,choices?picked:undefined):seasonArtPath(game)
  // Fetch the other response's scene ahead of time so the picture changes the moment an answer is picked.
  useEffect(()=>{if(showEvent&&event&&choices&&EVENT_CHOICE_ART.has(event.id)){new Image().src=eventArtPath(event.id,1)}},[showEvent,event?.id,Boolean(choices)])
  const needsAnswer=Boolean(showEvent&&choices&&onChoose&&picked===undefined)
  return <div className="season-opening">
    <img src={art} alt={showEvent&&event?eventText(event.title,game)+(choices&&picked!==undefined?` · ${choices[picked]!.label}`:''):`센터에 찾아온 ${SEASONS[game.season]}`} />
    <div className="season-opening-copy"><span className="eyebrow">{game.year}년 차 · {SEASONS[game.season]} {showEvent?'소식':'시작'}</span>
      <h3>{showEvent&&event?eventText(event.title,game):`새로운 ${SEASONS[game.season]}, 문을 열어요`}</h3>
      <p>{showEvent&&event?eventText(event.description,game):'대관 신청을 살펴보고, 남은 시간에 클래스를 편성해 주세요.'}</p>
      {showEvent&&event?choices?<fieldset className="season-choices"><legend>센터장님, 어떻게 할까요?</legend>{choices.map((choice,index)=>{const blocked=eventOptionBlock(game,index);return <label key={choice.label} className={`${picked===index?'is-picked':''} ${blocked?'is-blocked':''}`}><input type="radio" name="season-event-choice" aria-label={`${choice.label} · ${blocked??choice.effect}`} checked={picked===index} disabled={Boolean(blocked)} onChange={()=>{setPicked(index);onChoose?.(index);playSound('select')}} /><span><strong>{choice.label}</strong><small>{choice.description}</small><em>{choice.effect}</em>{blocked&&<small className="choice-blocked">{blocked}</small>}</span></label>})}<small>이번 계절 결산에 한 번 반영돼요. 운영을 시작하기 전까지는 바꿀 수 있어요.</small></fieldset>:<><strong className="season-effect">{event.effect}</strong><small>계절 결산에 한 번 반영됩니다. 수입 증감 효과는 이번 계절만 적용되며, 변동된 현금과 명성은 유지돼요.</small></>:game.year===MAX_YEARS&&game.season===0?<strong className="season-effect">마지막 1년! 정기 예산과 특별 운영비 {wonAmount(FINAL_YEAR_BONUS)}원이 지급됐어요.</strong>:null}
      <button className="primary-button" disabled={needsAnswer} onClick={()=>{if(event&&!showEvent){setShowEvent(true);if(onEventSound){const comic=COMIC_EVENTS.has(event.id);onEventSound(comic);playSound(comic?'event_comic':event.cash<0||event.cost>0||event.reputation<0||event.revenueRate<0||event.closure||event.classMood==='cold'?'event_negative':'event_positive')}}else{if(choices&&onChoose&&picked!==undefined)playSound('event_choice');onContinue()}}}>{event&&!showEvent?'이번 계절 소식 보기':needsAnswer?'먼저 대응을 골라 주세요':'확인 · 계절 계획 시작'}</button>
    </div>
  </div>
}
