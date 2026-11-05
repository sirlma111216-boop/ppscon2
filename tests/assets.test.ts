// 그림 연결 검사: 게임이 쓰는 좌표·파일이 매니페스트와 실제 파일에 맞는지 확인한다.
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { BUILDING_PLACEMENT } from '../src/assets/layout.ts'
import { getScene } from '../src/assets/scenes.ts'
import type { Moment, SceneRequest } from '../src/assets/scenes.ts'
import { SPRITES } from '../src/assets/sprites.generated.ts'
import { MISSIONS, MISSION_ORDER } from '../src/game/missions.ts'

const publicDir = fileURLToPath(new URL('../public/', import.meta.url))
const manifest = JSON.parse(readFileSync(`${publicDir}assets/images/manifest.json`, 'utf8'))

test('건물 접지점이 이미지 매니페스트와 같다', () => {
  for (const asset of manifest.assets) {
    if (!asset.placement) continue
    const placement = BUILDING_PLACEMENT[asset.placement.facility as keyof typeof BUILDING_PLACEMENT]
    assert.deepEqual(placement.board, asset.placement.boardAnchorNormalized, asset.id)
    assert.deepEqual(placement.sprite, asset.placement.spriteAnchorNormalized, asset.id)
    assert.equal(placement.width, asset.placement.widthRatioToBoard, asset.id)
  }
})

test('매니페스트의 스프라이트 15개가 모두 파생 파일로 존재한다', () => {
  const ids = manifest.assets.flatMap((asset: { sprites?: { id: string }[] }) => asset.sprites?.map((sprite) => sprite.id) ?? [])
  assert.equal(ids.length, 15)
  assert.deepEqual(Object.keys(SPRITES).sort(), [...ids].sort())
  for (const sprite of Object.values(SPRITES)) assert.ok(existsSync(publicDir + sprite.url), sprite.url)
  for (const file of ['bg/intro', 'bg/town', 'bg/chapter', 'bg/progress', 'bg/result', 'bg/ending', 'buildings/library', 'buildings/school', 'buildings/community', 'buildings/park', 'buildings/canopy']) {
    assert.ok(existsSync(`${publicDir}assets/game/${file}.webp`), file)
  }
})

test('모든 제시안에 이용 장면이 있고, 적격 안은 두 순간의 모습이 다르다', () => {
  for (const id of MISSION_ORDER) {
    const mission = MISSIONS[id]
    for (const requirement of mission.requirements) {
      const scenes = (visual: SceneRequest['visual'], moment: Moment) =>
        getScene({ facility: requirement.facilityId, missionId: id, visual, moment })
      // 구매 전 모습
      assert.ok(scenes(null, 'b').actors.length > 0, `${requirement.id} 지금 모습`)
      for (const optionId of requirement.optionIds) {
        const option = mission.options[optionId]
        const before = scenes(option.visual, 'a')
        const after = scenes(option.visual, 'b')
        assert.ok(before.actors.length > 0 && after.actors.length > 0, optionId)
        for (const actor of [...before.actors, ...after.actors]) {
          assert.ok(actor.sprite || actor.generic || actor.image, `${optionId}의 ${actor.key}에 그림이 있다`)
          if (actor.sprite) assert.ok(actor.sprite in SPRITES, actor.sprite)
        }
        const keys = before.actors.map((actor) => actor.key)
        assert.equal(new Set(keys).size, keys.length, `${optionId} 장면의 개체 key가 겹치지 않는다`)
        if (option.rationaleText) {
          assert.notDeepEqual(before.actors, after.actors, `${optionId}: 쓰임에 따라 장면이 달라진다`)
        }
      }
      // 실행 연출
      const chosen = mission.options[requirement.optionIds.find((optionId) => mission.options[optionId].rationaleText) as string]
      for (const stage of ['arrive', 'install', 'installed'] as const) {
        const scene = getScene({ facility: requirement.facilityId, missionId: id, visual: chosen.visual, moment: 'a', stage })
        assert.ok(scene.actors.some((actor) => actor.sprite === 'supplier' || actor.sprite === 'staff'), `${requirement.id} ${stage}`)
      }
    }
  }
})

test('도서관의 두 적격 안은 오후 배치가 서로 다르다', () => {
  const fold = getScene({ facility: 'library', missionId: 'M1', visual: 'foldTable', moment: 'b' })
  const mobile = getScene({ facility: 'library', missionId: 'M1', visual: 'mobileTable', moment: 'b' })
  const tables = (scene: typeof fold) => scene.actors.filter((actor) => actor.key.startsWith('t'))
  // 접이식은 모두 접혀 수납 구역에 들어가고, 이동 모듈은 접히지 않고 모여 있다.
  assert.ok(tables(fold).every((actor) => (actor.squeeze ?? 1) < 0.5 && actor.x < 330))
  assert.ok(tables(mobile).every((actor) => actor.squeeze === undefined))
  assert.ok(tables(mobile).some((actor) => actor.x > 330))
})
