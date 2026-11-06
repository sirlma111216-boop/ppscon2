import test from 'node:test'
import assert from 'node:assert/strict'
import {createGame,finishRentalReview,MAX_YEARS,runSeason,validateSave} from '../../src/center/simulation.ts'
import {awardFacilityContract,collectFacilityBids,postFacilityTender} from '../../src/center/facilityProjects.ts'
import {awardCampusContract,collectCampusBids,postCampusTender} from '../../src/center/campusProjects.ts'

test('a facility tender started in the sixth year remains valid through construction',()=>{
  let game=createGame();game.year=MAX_YEARS;game.player.cash=10000
  game=collectFacilityBids(postFacilityTender(game,'C').state,'C').state
  const contract=awardFacilityContract(game,'C',game.player.facilityProjects[0].bids[1].id)
  assert.equal(contract.error,undefined)
  assert.ok(validateSave(contract.state))
  const operated=runSeason(finishRentalReview(contract.state))
  assert.equal(operated.player.facilityProjects[0].remainingWeeks,5)
  assert.ok(validateSave(operated))
})

test('a campus tender started in the sixth year remains valid through completion',()=>{
  let game=createGame();game.year=MAX_YEARS;game.player.cash=10000
  game=collectCampusBids(postCampusTender(game,'garden').state,'garden').state
  const contract=awardCampusContract(game,'garden',game.player.campusProjects[0].bids[0].id)
  assert.equal(contract.error,undefined)
  assert.ok(validateSave(contract.state))
  const operated=runSeason(finishRentalReview(contract.state))
  assert.equal(operated.player.campusProjects[0].stage,'complete')
  assert.ok(validateSave(operated))
})
