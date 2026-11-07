import { useEffect, useMemo, useRef, useState } from 'react'
import CenterScene from './CenterScene'
import RentalReview from './RentalReview'
import ProcurementDesk from './ProcurementDesk'
import FacilityDesk from './FacilityDesk'
import CampusDesk from './CampusDesk'
import RoomScheduleSummary from './RoomScheduleSummary'
import SeasonOpening from './SeasonOpening'
import SeasonReview from './SeasonReview'
import { ClassEconomicsCard } from './ClassEconomics'
import { courseSymbolPath } from './activityArt'
import { SEASON_EVENTS } from './seasonEvents'
import { collectFacilityBids, postFacilityTender } from './facilityProjects'
import { createGame, finishRentalReview, nextSeason, runSeason, setProgram, previewClass, PROGRAMS, buyEquipment } from './simulation'
import { TUTORIAL_STEPS } from './tutorialSteps'
import type { TutorialStage } from './tutorialSteps'
import './center.css'
import './GameTutorial.css'

const noop = () => {}
// This state is deliberately isolated from persistence: every scene is a read-only example.
function examples() {
 const first=createGame(102)
 let prepared=buyEquipment(first,'E01','E').state
 prepared=nextSeason(runSeason(finishRentalReview(prepared)))
 prepared=setProgram(finishRentalReview(prepared),'E',1,'P01')
 prepared=setProgram(prepared,'A',0,'P06')
 const operated=runSeason(prepared)
 let evaluation=createGame(102)
 for(let i=0;i<8;i++) {evaluation=runSeason(setProgram(finishRentalReview(evaluation),'A',0,'P06'));if(i<7)evaluation=nextSeason(evaluation)}
 const tender=collectFacilityBids(postFacilityTender(first,'C').state,'C').state
 return {first,prepared,operated,evaluation,tender}
}
type Examples = ReturnType<typeof examples>
function TutorialScene({stage,demo}:{stage:TutorialStage;demo:Examples}) {
 const {first,prepared,operated,evaluation,tender}=demo
 const scene=(operating=false,exterior=false)=><CenterScene selectedRoom="E" view={exterior?'exterior':'room'} onSelectRoom={noop} onBack={noop} onManageEquipment={noop} onOpenCampus={noop} rooms={prepared.player.rooms} plan={prepared.player.plan} season={prepared.season} viewingResult={operating} activeSlot={1} report={operating?operated.lastReport:null} reducedMotion/>
 if(stage==='welcome') return <>{scene(false,true)}<RoomScheduleSummary game={first} overview/></>
 if(stage==='season') return <SeasonOpening game={first} onContinue={noop}/>
 if(stage==='rental') return <RentalReview game={first} room="A" onDecide={noop} onClearClass={noop} onOpenFacility={noop}/>
 if(stage==='procurement') return <ProcurementDesk game={prepared} room="E" onRoomChange={noop} onBuy={noop} onClose={noop} initialFilter="all"/>
 if(stage==='schedule') return <>{scene()}<RoomScheduleSummary game={prepared} selectedRoom="E" overview/><div className="tutorial-plan-example"><span>평일 오후</span><strong>공예</strong><small>편성 완료 · 매주 반복</small></div></>
 if(stage==='economy') return <div className="tutorial-class-panel"><h3>어떤 클래스를 열까요?</h3><div className="activity-grid">{PROGRAMS.filter(p=>['P01','P22','P23','P12'].includes(p.id)).map(p=><button key={p.id} className="activity-chip class-card"><span className="class-card-art"><img src={courseSymbolPath(p.id)} alt=""/></span><span className="class-card-name"><b>{p.shortName}</b></span><ClassEconomicsCard value={previewClass(prepared,'E',p.id,1)}/></button>)}</div></div>
 if(stage==='operate') return scene(true)
 if(stage==='settlement') return <SeasonReview game={operated} report={operated.lastReport!} onRivals={noop} onContinue={noop} onReset={noop}/>
 if(stage==='tender') return <FacilityDesk game={tender} room="C" onChange={noop} onClose={noop}/>
 if(stage==='upgrade') return <CampusDesk game={prepared} onChange={noop} onClose={noop}/>
 if(stage==='event') {const event=SEASON_EVENTS[0]!;return <div className="season-opening"><img src={'/center/milestones-v1/'+event.id+'.webp'} alt={event.title}/><div className="season-opening-copy"><span className="eyebrow">계절 소식 · 예시</span><h3>{event.title}</h3><p>{event.description}</p><strong className="season-effect">{event.effect}</strong></div></div>}
 if(stage==='evaluation') return <SeasonReview game={evaluation} report={evaluation.lastReport!} onRivals={noop} onContinue={noop} onReset={noop} initialCeremonyStep={3}/>
 return <div className="tutorial-finale"><img src="/center/milestones-v1/finale.webp" alt="최종 시상식에서 함께 기뻐하는 센터 주민과 직원"/><h3>센터장님, 수고하셨습니다</h3><p>7년의 선택이 우리 동네의 이야기가 됩니다.</p></div>
}
export default function GameTutorial({onFinish,onCancel,replay=false,error=''}:{onFinish:()=>void;onCancel:()=>void;replay?:boolean;error?:string}) {
 const [index,setIndex]=useState(0)
 const demo=useMemo(examples,[])
 const heading=useRef<HTMLHeadingElement>(null)
 const viewport=useRef<HTMLDivElement>(null)
 const step=TUTORIAL_STEPS[index]!
 const last=index===TUTORIAL_STEPS.length-1
 useEffect(()=>{heading.current?.focus({preventScroll:true});viewport.current?.scrollTo(0,0);window.scrollTo(0,0)},[index])
 return <main className="game-tutorial center-game">
  <header className="tutorial-top"><span>센터장님을 위한 안내 · {index+1} / {TUTORIAL_STEPS.length}</span><div><button className="text-button" onClick={onCancel}>첫 화면으로</button><button className="secondary-button" onClick={onFinish}>{replay?'안내 닫기':'튜토리얼 건너뛰기'}</button></div></header>
  <div className="tutorial-progress" role="progressbar" aria-label="안내 진행" aria-valuemin={1} aria-valuemax={TUTORIAL_STEPS.length} aria-valuenow={index+1}><span style={{width:`${(index+1)/TUTORIAL_STEPS.length*100}%`}}/></div>
  <section className="tutorial-slide" aria-labelledby="tutorial-title">
   <div className="tutorial-scene-label">실제 게임 화면 · 설명용 예시 · 조작하지 않아도 돼요</div>
   <div className="tutorial-viewport" ref={viewport} tabIndex={0} role="region" aria-label="게임 장면 예시, 스크롤하여 보기"><div className="tutorial-example" inert><TutorialScene key={step.id} stage={step.id} demo={demo}/></div></div>
   <div className="tutorial-caption"><h1 ref={heading} tabIndex={-1} id="tutorial-title">{step.title}</h1><p>{step.text}</p><p className="tutorial-tip">{step.tip}</p></div>
  </section>
  {error&&<p role="alert" className="tutorial-error">{error}</p>}
  <footer className="tutorial-nav"><button className="secondary-button" disabled={index===0} onClick={()=>setIndex(n=>n-1)}>이전</button><span>{index+1} / {TUTORIAL_STEPS.length}</span><button className="primary-button" onClick={()=>last?onFinish():setIndex(n=>n+1)}>{last?(replay?'안내 마치기':'이제 센터 운영 시작'):'다음'}</button></footer>
 </main>
}
