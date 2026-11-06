import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame,finishRentalReview,reopenRentalReview,setProgram,decideRental,replaceClassWithRental,validateSave} from '../../src/center/simulation.ts'

function conflicted(){
  const base=createGame(),request=base.player.rentalRequests.find(r=>r.room==='A')!
  const state=reopenRentalReview(setProgram(finishRentalReview(base),'A',request.slot,'P06'))
  return {state,request}
}
test('ordinary approval preserves a conflicting class; explicit replacement atomically cancels only that class',()=>{
  const {state,request}=conflicted(),before=JSON.stringify(state)
  assert.ok(decideRental(state,request.id,'accepted').error)
  assert.equal(JSON.stringify(state),before)
  const result=replaceClassWithRental(state,request.id)
  assert.equal(result.error,undefined)
  assert.equal(result.state.player.plan.A[request.slot],request.program)
  assert.equal(result.state.player.rentalRequests.find(r=>r.id===request.id)?.status,'accepted')
  assert.equal(result.state.player.cash,state.player.cash)
  assert.ok(validateSave(result.state))
  assert.equal(JSON.stringify(state),before)
})
test('failed replacement preserves the class, including missing equipment and an invalid request',()=>{
  const {state,request}=conflicted()
  state.player.rentalRequests.find(r=>r.id===request.id)!.program='P10'
  const before=JSON.stringify(state),result=replaceClassWithRental(state,request.id)
  assert.ok(result.error)
  assert.equal(JSON.stringify(result.state),before)
  assert.equal(result.state.player.plan.A[request.slot],'P06')
  assert.ok(replaceClassWithRental(state,'missing').error)
})
