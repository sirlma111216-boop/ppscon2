import test from 'node:test'
import assert from 'node:assert/strict'
import {selectCraftActivityPreview,selectLastCraftActivity} from '../../src/center/activityPreview.ts'

const activity=(slot:number,program='P01',attendees=6,room='E')=>({room,slot,program,attendees})
const input=(activities:ReturnType<typeof activity>[])=>({room:'E' as const,viewingResult:true,roomOpen:true,activeSlot:2,activities})

test('actual current slot preserves its own craft program and attendance',()=>{
  assert.deepEqual(selectCraftActivityPreview(input([activity(0),activity(2,'P02',9),activity(4)])),{room:'E',slot:2,program:'P02',attendees:9})
})
test('empty or non-craft current slots never fall back to another craft time',()=>{
  assert.equal(selectCraftActivityPreview(input([activity(4),activity(2,'P06'),activity(1,'P02')])),null)
  assert.equal(selectCraftActivityPreview(input([activity(0)])),null)
})
test('zero or nonfinite attendance, other rooms and non-craft programs are rejected',()=>{
  for(const row of [activity(2,'P01',0),activity(2,'P01',-1),activity(2,'P02',6,'A'),activity(2,'P05'),activity(2,'P01',NaN),activity(2,'P01',Infinity)])
    assert.equal(selectCraftActivityPreview(input([row])),null)
})
test('planning, missing records and unopened rooms never show a recorded class',()=>{
  const request=input([activity(2)])
  assert.equal(selectCraftActivityPreview({...request,viewingResult:false}),null)
  assert.equal(selectCraftActivityPreview({...request,roomOpen:false}),null)
  assert.equal(selectCraftActivityPreview({...request,activities:undefined}),null)
})
test('invalid current slots are rejected instead of being clamped or defaulted',()=>{
  for(const activeSlot of [-1,5,99,1.5,NaN,Infinity])assert.equal(selectCraftActivityPreview({...input([activity(2)]),activeSlot}),null)
})
test('selection is read-only and repeated rendering cannot alter operating records',()=>{
  const activities=[activity(0),activity(2,'P02',8)];activities.forEach(Object.freeze);Object.freeze(activities)
  const request=Object.freeze(input(activities));const before=JSON.stringify(request)
  for(let i=0;i<8;i++)assert.equal(selectCraftActivityPreview(request)?.attendees,8)
  assert.equal(JSON.stringify(request),before)
})

test('advanced pottery reuses the craft visual only at its own attended slot',()=>{
  assert.deepEqual(selectCraftActivityPreview(input([activity(2,'P12',11)])),{room:'E',slot:2,program:'P12',attendees:11})
  assert.equal(selectCraftActivityPreview(input([activity(0,'P12',11)])),null)
  for(const program of ['P11','P13'])assert.equal(selectCraftActivityPreview(input([activity(2,program,10)])),null)
})

test('room entry and tour completion select the latest real craft time without fabricating attendance',()=>{
  const request=input([activity(0),activity(2,'P12',7),activity(4,'P01',0),activity(3,'P13',9)])
  assert.equal(selectLastCraftActivity(request)?.slot,2)
  assert.equal(selectLastCraftActivity({...request,viewingResult:false}),null)
  assert.equal(selectLastCraftActivity({...request,activities:[activity(4,'P01',0)]}),null)
  assert.equal(selectCraftActivityPreview({...request,activeSlot:4}),null,'manual empty time remains empty')
})
