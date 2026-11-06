import { useEffect, useRef } from 'react'
import Icon from './Icon'
import './ToastFeedback.css'

export type FeedbackTone = 'success' | 'error' | 'info'
export interface FeedbackNotice { id:number; message:string; tone:FeedbackTone }
export type Notify = (message:string,tone?:FeedbackTone)=>void

/** Presentation only: never call an economic mutation from a notification. */
export default function ToastFeedback({notice,onDismiss}:{notice:FeedbackNotice|null;onDismiss:()=>void}) {
  const dismiss = useRef(onDismiss)
  useEffect(()=>{dismiss.current=onDismiss},[onDismiss])
  useEffect(()=>{
    if(!notice||notice.tone==='error')return
    const timer=window.setTimeout(()=>dismiss.current(),5000)
    return ()=>window.clearTimeout(timer)
  },[notice?.id,notice?.tone])
  if(!notice)return null
  const isError=notice.tone==='error'
  return <div className={`action-feedback action-feedback--${notice.tone}`} key={notice.id} data-feedback-id={notice.id}>
    <div className="action-feedback-message" role={isError?'alert':'status'} aria-live={isError?'assertive':'polite'} aria-atomic="true">
      <span className="action-feedback-symbol"><Icon name={isError?'help':notice.tone==='success'?'check':'chat'} size={22}/></span>
      <p>{isError&&<strong>처리하지 못했어요. </strong>}{notice.message}</p>
    </div>
    <button className="action-feedback-close" type="button" onClick={onDismiss} aria-label="처리 결과 알림 닫기"><Icon name="close" size={19}/></button>
  </div>
}
