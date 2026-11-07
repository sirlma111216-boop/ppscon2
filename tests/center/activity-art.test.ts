import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { PROGRAMS, isRentalProgram } from '../../src/center/simulation.ts'
import { courseSymbolPath, activityStillPath } from '../../src/center/activityArt.ts'
import { selectActivityStill, selectLastActivityStill } from '../../src/center/activityPreview.ts'

test('every playable course and rental has its own operating asset; course symbols are separate',()=>{
  for(const program of PROGRAMS){
    const still=activityStillPath(program.id)
    assert.ok(still,program.id)
    assert.ok(existsSync(new URL('../../public'+still,import.meta.url)),program.id)
    if(!isRentalProgram(program.id)){
      const symbol=courseSymbolPath(program.id)
      assert.notEqual(symbol,still)
      assert.ok(existsSync(new URL('../../public'+symbol,import.meta.url)),program.id)
    }
  }
})
test('actual classes and rentals show their own still, only in attended operating slots',()=>{
  for(const p of PROGRAMS){
    const activities=[{room:'E',slot:2,program:p.id,attendees:5}]
    const input={room:'E' as const,viewingResult:true,roomOpen:true,activeSlot:2,activities}
    assert.equal(selectActivityStill(input)?.program,p.id)
    assert.equal(selectActivityStill({...input,viewingResult:false}),null)
    assert.equal(selectActivityStill({...input,roomOpen:false}),null)
    assert.equal(selectActivityStill({...input,activeSlot:1}),null)
    assert.equal(selectActivityStill({...input,activities:[{...activities[0],attendees:0}]}),null)
    assert.equal(selectLastActivityStill(input)?.slot,2)
  }
})
