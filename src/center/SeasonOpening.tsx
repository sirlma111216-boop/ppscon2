import { COMIC_EVENTS, playSound } from './audio'
import { wonAmount } from './currency'
import { useState } from 'react'
import { FINAL_YEAR_BONUS, MAX_YEARS, SEASONS } from './simulation'
import type { GameState } from './simulation'
import { getSeasonEvent, seasonArtPath } from './seasonEvents'
import './SeasonOpening.css'

export default function SeasonOpening({game,onContinue,onEventSound}:{game:GameState;onContinue:()=>void;onEventSound?:(comic:boolean)=>void}) {
  const [showEvent,setShowEvent]=useState(false)
  const event=getSeasonEvent(game)
  const art=showEvent&&event?`/center/milestones-v1/${event.id}.webp`:seasonArtPath(game)
  return <div className="season-opening">
    <img src={art} alt={showEvent&&event?event.title:`센터에 찾아온 ${SEASONS[game.season]}`} />
    <div className="season-opening-copy"><span className="eyebrow">{game.year}년 차 · {SEASONS[game.season]} {showEvent?'소식':'시작'}</span>
      <h3>{showEvent&&event?event.title:`새로운 ${SEASONS[game.season]}, 문을 열어요`}</h3>
      <p>{showEvent&&event?event.description:'대관 신청을 살펴보고, 남은 시간에 클래스를 편성해 주세요.'}</p>
      {showEvent&&event?<><strong className="season-effect">{event.effect}</strong><small>계절 결산에 한 번 반영됩니다. 수입 증감 효과는 이번 계절만 적용되며, 변동된 현금과 명성은 유지돼요.</small></>:game.year===MAX_YEARS&&game.season===0?<strong className="season-effect">마지막 1년! 정기 예산과 특별 운영비 {wonAmount(FINAL_YEAR_BONUS)}원이 지급됐어요.</strong>:null}
      <button className="primary-button" onClick={()=>{if(event&&!showEvent){setShowEvent(true);if(onEventSound){const comic=COMIC_EVENTS.has(event.id);onEventSound(comic);playSound(comic?'event_comic':event.cash<0||event.cost>0||event.reputation<0||event.revenueRate<0?'event_negative':'event_positive')}}else onContinue()}}>{event&&!showEvent?'이번 계절 소식 보기':'확인 · 계절 계획 시작'}</button>
    </div>
  </div>
}
