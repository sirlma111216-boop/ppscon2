import test from 'node:test'
import assert from 'node:assert/strict'
import {existsSync,readFileSync,readdirSync} from 'node:fs'
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
test('all eleven tracks and twenty-eight effects exist with valid media headers',()=>{
 assert.equal(audio.SFX.length,28);assert.equal(new Set(audio.SFX).size,28)
 // The audio folder holds exactly what the game plays: one file per effect and per track, nothing left over.
 assert.deepEqual(readdirSync('public/center/audio').sort(),[...audio.SFX.map(name=>`sfx_${name}.wav`),...audio.BGM.map(name=>`bgm_${name}.mp3`)].sort())
 assert.deepEqual(existsSync('public/center/audio-trimmed')?readdirSync('public/center/audio-trimmed'):[],[],'trimmed copies replaced the files they were cut from on 2026-11-19')
 assert.equal(audio.BGM.length,11);assert.ok(audio.BGM.includes('decision')&&audio.BGM.includes('result_review'))
 for(const name of audio.BGM){const b=readFileSync(`public/center/audio/bgm_${name}.mp3`);assert.ok(b.length>1000);assert.ok(b.toString('ascii',0,3)==='ID3'||b[0]===255)}
 for(const name of audio.SFX){const b=readFileSync(`public/center/audio/sfx_${name}.wav`);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WAVE')}
 const hashes=audio.BGM.map(n=>createHash('sha256').update(readFileSync(`public/center/audio/bgm_${n}.mp3`)).digest('hex'));assert.equal(new Set(hashes).size,11)
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
test('every effect is one 48 kHz 16-bit file that starts sounding within 60 ms; the fifteen trimmed ones match their record',()=>{
 const record=JSON.parse(readFileSync('docs/center-growth/SFX_TRIMMED.json','utf8')) as {files:{file:string;bytes:number;sourceBytes:number}[]}
 const trimmed=new Map(record.files.map(item=>[item.file,item]));assert.equal(trimmed.size,15)
 for(const name of audio.SFX){
  const path=`public/center/audio/sfx_${name}.wav`,file=readFileSync(path)
  assert.equal(audio.sfxPath(name),`/center/audio/sfx_${name}.wav`)
  // Find the format and the samples wherever the chunks sit: delivered files carry an extra chunk before the data.
  let pos=12,rate=0,bits=0,channels=0,start=0,size=0
  while(pos+8<=file.length){const id=file.toString('ascii',pos,pos+4),length=file.readUInt32LE(pos+4);if(id==='fmt '){channels=file.readUInt16LE(pos+10);rate=file.readUInt32LE(pos+12);bits=file.readUInt16LE(pos+22)}if(id==='data'){start=pos+8;size=Math.min(length,file.length-start);break}pos+=8+length+(length%2)}
  assert.equal(rate,48000,name);assert.equal(bits,16,name);assert.equal(channels,2,name);assert.ok(size>0&&start+size===file.length,`${name}: the samples run to the end of the file`)
  const cut=trimmed.get(path)
  if(cut){assert.equal(file.length,cut.bytes,`${name} is the trimmed file on record`);assert.ok(file.length<cut.sourceBytes);assert.equal(start,44)}
  // The first 60 ms already carry sound: some sample exceeds 2% of full scale or, for a soft swell such as mood_cold, 5% of the file's own peak.
  let peak=0;for(let offset=start;offset+1<start+size;offset+=2)peak=Math.max(peak,Math.abs(file.readInt16LE(offset)))
  let loud=false;for(let offset=start;offset<start+rate*.06*channels*2&&offset+1<start+size;offset+=2)if(Math.abs(file.readInt16LE(offset))>Math.min(655,peak*.05)){loud=true;break}
  assert.ok(loud,`${name} starts within 60 ms`)
 }
})
test('the two tracks added on 2026-11-19 loop, and the quieter one is lifted without ever passing full volume',async()=>{
 const settle=async()=>{for(let i=0;i<6;i++)await Promise.resolve()}
 assert.deepEqual(Object.keys(audio.BGM_GAIN),['result_review'])
 const dispose=audio.mountAudio();audio.setAudioSettings({muted:false,bgm:.3,sfx:.5});await settle()
 const bgm=AudioMock.all[0]
 audio.setTrack('result_review');await settle()
 assert.equal(bgm.src,'/center/audio/bgm_result_review.mp3');assert.equal(bgm.loop,true);assert.ok(Math.abs(bgm.volume-.45)<1e-9,String(bgm.volume))
 audio.setTrack('decision');await settle()
 assert.equal(bgm.src,'/center/audio/bgm_decision.mp3');assert.equal(bgm.loop,true);assert.ok(Math.abs(bgm.volume-.3)<1e-9,String(bgm.volume))
 audio.setAudioSettings({bgm:.9});await settle();audio.setTrack('result_review');await settle();assert.equal(bgm.volume,1)
 audio.setAudioSettings({bgm:.3});dispose()
})
