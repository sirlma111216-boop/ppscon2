import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'

class AudioMock {
 static all:AudioMock[]=[]
 src='';volume=1;paused=true;loop=false;preload='';currentTime=0;playCount=0
 onended:Function|null=null;onerror:Function|null=null
 constructor(src=''){this.src=src;AudioMock.all.push(this)}
 async play(){this.paused=false;this.playCount++}
 pause(){this.paused=true}
 removeAttribute(){this.src=''}
 load(){}
}
const handlers=new Map<string,Function>()
const doc={hidden:false,addEventListener:(k:string,f:Function)=>handlers.set(k,f),removeEventListener:(k:string)=>handlers.delete(k)}
const saved=new Map<string,string>();let time=1000
Object.assign(globalThis,{Audio:AudioMock,document:doc,localStorage:{getItem:(k:string)=>saved.get(k)??null,setItem:(k:string,v:string)=>saved.set(k,v)},requestAnimationFrame:(f:Function)=>{f(performance.now()+1000);return 1}})
Object.defineProperty(globalThis,'performance',{value:{now:()=>time+=100},configurable:true})
const audio=await import('../../src/center/audio.ts')
test('all nine tracks and sixteen effects exist with valid media headers',()=>{
 for(const name of audio.BGM){const b=readFileSync(`public/center/audio/bgm_${name}.mp3`);assert.ok(b.length>1000);assert.ok(b.toString('ascii',0,3)==='ID3'||b[0]===255)}
 for(const name of audio.SFX){const b=readFileSync(`public/center/audio/sfx_${name}.wav`);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE')}
 const hashes=audio.BGM.map(n=>createHash('sha256').update(readFileSync(`public/center/audio/bgm_${n}.mp3`)).digest('hex'));assert.equal(new Set(hashes).size,9)
})
test('gesture gating, stable track, independent volume, mute, visibility and cleanup',async()=>{
 const dispose=audio.mountAudio();audio.setTrack('title');assert.equal(AudioMock.all.length,0)
 handlers.get('pointerdown')!();await Promise.resolve();const bgm=AudioMock.all[0];assert.equal(bgm.src,'/center/audio/bgm_title.mp3');assert.equal(bgm.paused,false)
 bgm.currentTime=14;audio.setTrack('title');assert.equal(bgm.currentTime,14);assert.equal(bgm.playCount,1)
 audio.setTrack('procurement');await Promise.resolve();assert.equal(bgm.src,'/center/audio/bgm_procurement.mp3')
 audio.setAudioSettings({bgm:0});assert.equal(bgm.paused,true);audio.playSound('rental_approve');assert.equal(AudioMock.all.at(-1)!.paused,false)
 audio.setAudioSettings({muted:true});assert.ok(AudioMock.all.every(a=>a.paused));const count=AudioMock.all.length;audio.playSound('notice');assert.equal(AudioMock.all.length,count)
 audio.setAudioSettings({muted:false,bgm:.2,sfx:0});audio.playSound('notice');assert.equal(AudioMock.all.length,count)
 doc.hidden=true;handlers.get('visibilitychange')!();assert.equal(bgm.paused,true);doc.hidden=false;handlers.get('visibilitychange')!();assert.equal(bgm.paused,false)
 audio.setTrack('final_unawarded');await Promise.resolve();assert.equal(bgm.loop,false)
 dispose();assert.equal(bgm.paused,true);assert.equal(handlers.size,0)
})
