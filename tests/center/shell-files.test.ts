import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { SAVE_KEY } from '../../src/center/savePersistence.ts'

test('the page shell starts fetching the title picture only for a first visit, under the game\'s own save key', () => {
  const html = readFileSync('index.html', 'utf8')
  const key = /localStorage\.getItem\('([^']+)'\)/.exec(html)?.[1], picture = /art\.href = '([^']+)'/.exec(html)?.[1]
  assert.equal(key, SAVE_KEY, 'index.html reads the same save key as the game')
  assert.equal(picture, '/center/campus-v3/exterior-0.webp', 'the picture a new game opens on')
  assert.ok(existsSync('public' + picture))
})

test('the published site lets browsers keep pictures, sounds and hashed scripts instead of re-checking each one', () => {
  const rules = readFileSync('public/_headers', 'utf8').split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#'))
  const header = (path: string) => rules[rules.indexOf(path) + 1]?.trim()
  assert.equal(header('/assets/*'), 'Cache-Control: public, max-age=31536000, immutable')
  assert.match(header('/center/*') ?? '', /^Cache-Control: public, max-age=\d+, stale-while-revalidate=\d+$/)
  assert.equal(rules.filter(line => line.startsWith('/')).length, 2, 'the page itself keeps the default: always fresh')
})

test('files that were cleared out on 2026-11-19 have not come back into the shipped folder', () => {
  const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => statSync(join(dir, name)).isDirectory() ? walk(join(dir, name)) : [join(dir, name).replace(/\\/g, '/')])
  const shipped = walk('public/center')
  // Superseded art, the unused animation prototype and source-size originals are kept out of the build folder.
  for (const pattern of [/\/classes-v[23]\//, /\/interface-v2\//, /\/prototypes\//, /\/audio-trimmed\//, /\.png$/, /provenance\.json$/, /exterior-(garden|renovated)\.webp$/])
    assert.deepEqual(shipped.filter(file => pattern.test(file)), [], String(pattern))
  assert.ok(shipped.length > 250, 'the walk really covered the asset folder')
})

test('the repository holds this game only: the earlier game was removed on 2026-11-19', () => {
  assert.deepEqual(readdirSync('src').sort(), ['center', 'main.tsx', 'vite-env.d.ts'])
  assert.deepEqual(readdirSync('public').sort(), ['_headers', 'center'])
  assert.deepEqual(readdirSync('tests'), ['center'])
  assert.doesNotMatch(readFileSync('src/main.tsx', 'utf8'), /dev-assets|AssetGallery/)
})
