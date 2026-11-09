import { useEffect, useSyncExternalStore } from 'react'
export const BGM = ['title','planning_spring_summer','planning_autumn_winter','procurement','operation','comic_event','evaluation','final_awarded','final_unawarded'] as const
export type MusicTrack = typeof BGM[number]
export const SFX = ['ui_click','room_enter','schedule_place','schedule_remove','rental_approve','notice','procurement_order','tender_contract','install_complete','season_open','event_positive','event_negative','event_comic','settlement','award_reveal','save_complete'] as const
export type Sound = typeof SFX[number]
const KEY='ppscon2.audio.v1'
type Settings={muted:boolean;bgm:number;sfx:number}
let settings:Settings={muted:false,bgm:.3,sfx:.65}
try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)settings={muted:s.muted===true,bgm:Number.isFinite(s.bgm)?Math.max(0,Math.min(1,s.bgm)):.3,sfx:Number.isFinite(s.sfx)?Math.max(0,Math.min(1,s.sfx)):.65}}catch{/* optional preferences */}
const listeners=new Set<()=>void>()
let music:HTMLAudioElement|null=null,desired:MusicTrack='title',current:MusicTrack|null=null,unlocked=false,generation=0
const active=new Set<HTMLAudioElement>(),once=new Set<string>()
let lastSound=0
const audible=()=>unlocked&&!settings.muted&&!document.hidden
function stopEffects(){for(const a of active){a.pause();a.removeAttribute('src');a.load()}active.clear()}
function fade(to:number,ms:number,done?:()=>void){const id=++generation,a=music;if(!a)return;const from=a.volume,start=performance.now();function tick(now:number){if(id!==generation)return;const f=Math.max(0,Math.min(1,(now-start)/ms));a!.volume=Math.max(0,Math.min(1,from+(to-from)*f));if(f<1)requestAnimationFrame(tick);else done?.()}requestAnimationFrame(tick)}
function sync(){
 if(!unlocked)return
 music??=new Audio();music.preload='none';music.loop=true
 if(!audible()||settings.bgm===0){generation++;music.pause();if(!audible())stopEffects();return}
 if(current===desired){void music.play().catch(()=>{});fade(settings.bgm,350);return}
 const swap=()=>{if(!music||!audible())return;current=desired;music.src=`/center/audio/bgm_${desired}.mp3`;music.volume=0;music.loop=!desired.startsWith('final_');void music.play().then(()=>fade(settings.bgm,500)).catch(()=>{})}
 if(!music.paused)fade(0,220,swap);else swap()
}
export function setTrack(track:MusicTrack){if(desired===track&&current===track)return;desired=track;sync()}
export function setAudioSettings(patch:Partial<Settings>){settings={...settings,...patch};settings.bgm=Math.max(0,Math.min(1,settings.bgm));settings.sfx=Math.max(0,Math.min(1,settings.sfx));try{localStorage.setItem(KEY,JSON.stringify(settings))}catch{/* audio still works */}if(settings.muted||settings.sfx===0)stopEffects();for(const a of active)a.volume=settings.sfx;sync();listeners.forEach(f=>f())}
export function useAudioSettings(){return useSyncExternalStore(f=>{listeners.add(f);return()=>{listeners.delete(f)}},()=>settings)}
export function playSound(kind:Sound|'select'|'buy'|'run'|'result'){
 if(kind==='run'||!audible()||settings.sfx===0)return
 const now=performance.now();if(now-lastSound<75)return;lastSound=now
 const name=kind==='select'?'ui_click':kind==='buy'?'procurement_order':kind==='result'?'settlement':kind
 for(const previous of active){if(previous.src.endsWith(`/sfx_${name}.wav`)){previous.pause();active.delete(previous)}}
 if(active.size>=3){const oldest=active.values().next().value!;oldest.pause();active.delete(oldest)}
 const a=new Audio(`/center/audio/sfx_${name}.wav`);a.volume=settings.sfx;active.add(a)
 const release=()=>active.delete(a);a.onended=release;a.onerror=release;void a.play().catch(release)
}
export function playOnce(key:string,sound:Sound){if(once.has(key)||!audible())return;once.add(key);playSound(sound)}
export function mountAudio(){const unlock=()=>{if(!unlocked){unlocked=true;sync()}};const visibility=()=>{if(document.hidden)stopEffects();sync()};document.addEventListener('pointerdown',unlock,true);document.addEventListener('keydown',unlock,true);document.addEventListener('visibilitychange',visibility);return()=>{document.removeEventListener('pointerdown',unlock,true);document.removeEventListener('keydown',unlock,true);document.removeEventListener('visibilitychange',visibility);generation++;music?.pause();stopEffects()}}
export function useAudioBoot(){useEffect(mountAudio,[])}
export const COMIC_EVENTS=new Set(['cat-director','balloons','robot-dance','rooster-mic','mascot-parade','umbrella-mixup'])
