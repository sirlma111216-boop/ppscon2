// 원본 PNG(public/assets/images)는 그대로 두고, 게임 런타임이 쓰는 웹용 파생본을 만든다.
//   node scripts/build-assets.mjs
// 출력: public/assets/game/**, src/assets/sprites.generated.ts, docs/IMAGE_DERIVATIVES.md
// 파생본은 저장소에 커밋한다. Cloudflare 빌드는 이 스크립트를 실행하지 않는다.
import sharp from 'sharp'
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const srcDir = path.join(root, 'public/assets/images')
const outDir = path.join(root, 'public/assets/game')
const manifest = JSON.parse(readFileSync(path.join(srcDir, 'manifest.json'), 'utf8'))

// 원본의 피사체 알파는 222~254, 번진 광륜·인쇄 자국은 대부분 1~36에 있다(scripts 실행 시 측정).
// 낮은 알파를 지우고 가장자리만 부드럽게 남긴다.
const ALPHA_LOW = 56
const ALPHA_HIGH = 208

const BACKGROUNDS = {
  'intro-print': 'bg/intro.webp',
  'town-board': 'bg/town.webp',
  'chapter-transition': 'bg/chapter.webp',
  'progress-workbench': 'bg/progress.webp',
  'result-paper': 'bg/result.webp',
  'ending-neighborhood': 'bg/ending.webp',
}
const FRAMES = {
  'library-building': 'buildings/library.webp',
  'school-building': 'buildings/school.webp',
  'community-building': 'buildings/community.webp',
  'park-building': 'buildings/park.webp',
  'shade-canopy': 'buildings/canopy.webp',
}
// 1920×1080 화면의 시설 장면에서 건물이 원본보다 크게 보이므로 원본 폭을 그대로 쓴다.
const FRAME_WIDTH = 1774
const SPRITE_MAX = 360

const rows = []
const sprites = {}

function ensureDir(file) {
  mkdirSync(path.dirname(file), { recursive: true })
}

function record(source, derived, info, note) {
  const bytes = statSync(path.join(outDir, derived)).size
  rows.push({ source, derived: `assets/game/${derived}`, size: `${info.width}×${info.height}`, bytes, note })
}

async function cleanedRaw(file, rect) {
  let image = sharp(path.join(srcDir, file))
  if (rect) image = image.extract({ left: rect[0], top: rect[1], width: rect[2], height: rect[3] })
  const { data, info } = await image.ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  let minX = info.width, minY = info.height, maxX = -1, maxY = -1
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4 + 3
      const a = data[i]
      const cleaned = a <= ALPHA_LOW ? 0 : a >= ALPHA_HIGH ? 255 : Math.round(((a - ALPHA_LOW) / (ALPHA_HIGH - ALPHA_LOW)) * 255)
      data[i] = cleaned
      if (cleaned > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  return { data, info, bounds: { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 } }
}

for (const asset of manifest.assets) {
  if (BACKGROUNDS[asset.id]) {
    const derived = BACKGROUNDS[asset.id]
    const out = path.join(outDir, derived)
    ensureDir(out)
    const info = await sharp(path.join(srcDir, asset.file)).webp({ quality: 80, effort: 6 }).toFile(out)
    record(asset.file, derived, info, '전체 장면, 크기 유지')
  } else if (FRAMES[asset.id]) {
    // 매니페스트의 접지점 비율을 그대로 쓰도록 투명 여백을 포함한 전체 틀을 유지한다.
    const derived = FRAMES[asset.id]
    const out = path.join(outDir, derived)
    ensureDir(out)
    const { data, info } = await cleanedRaw(asset.file)
    const result = await sharp(data, { raw: info })
      .resize({ width: FRAME_WIDTH })
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toFile(out)
    record(asset.file, derived, result, '전체 틀 유지, 낮은 알파 정리')
  } else if (asset.kind === 'atlas') {
    for (const sprite of asset.sprites) {
      const derived = `sprites/${sprite.id}.webp`
      const out = path.join(outDir, derived)
      ensureDir(out)
      const { data, info, bounds } = await cleanedRaw(asset.file, sprite.cropRect)
      const scale = Math.min(1, SPRITE_MAX / Math.max(bounds.width, bounds.height))
      const result = await sharp(data, { raw: info })
        .extract(bounds)
        .resize({ width: Math.round(bounds.width * scale) })
        .webp({ quality: 86, alphaQuality: 92, effort: 6 })
        .toFile(out)
      sprites[sprite.id] = { url: `assets/game/${derived}`, w: result.width, h: result.height, label: sprite.label }
      record(`${asset.file} › ${sprite.id} cropRect [${sprite.cropRect.join(', ')}]`, derived, result, '피사체 경계로 자름, 광륜 제거')
    }
  }
}

const generated = `// scripts/build-assets.mjs가 만든 파일. 직접 고치지 않는다.
export const SPRITES = ${JSON.stringify(sprites, null, 2)} as const

export type SpriteId = keyof typeof SPRITES
`
writeFileSync(path.join(root, 'src/assets/sprites.generated.ts'), generated)

const total = rows.reduce((sum, row) => sum + row.bytes, 0)
const doc = `# 게임용 이미지 파생본 대응표

\`node scripts/build-assets.mjs\`가 만든다. 원본 PNG는 \`public/assets/images/\`에 그대로 보존하고,
게임 화면은 아래 WebP 파생본만 불러온다. 원본 좌표는 [이미지 매니페스트](../public/assets/images/manifest.json)가 기준이다.

- 배경 6장: 원본 크기 유지, WebP 품질 80.
- 건물 4장·그늘막: 접지점 비율을 유지하려고 투명 여백을 포함한 전체 틀(${FRAME_WIDTH}px 폭)을 그대로 쓴다.
- 아틀라스 스프라이트 15개: 매니페스트의 \`cropRect\`로 자른 뒤 피사체 경계에 맞췄다.
- 투명 정리: 알파 ${ALPHA_LOW} 이하는 지우고 ${ALPHA_HIGH} 이상은 불투명으로 올렸다. 주민 그림 주변의 번진 광륜과
  물품 주변의 흩어진 인쇄 자국을 없애기 위한 처리이며, 색과 윤곽은 바꾸지 않았다.

파생본 합계: ${total.toLocaleString('en-US')}바이트 (원본 합계 31,355,956바이트).

| 원본 | 파생본 | 크기(px) | 바이트 | 처리 |
|---|---|---:|---:|---|
${rows.map((row) => `| \`${row.source}\` | \`${row.derived}\` | ${row.size} | ${row.bytes.toLocaleString('en-US')} | ${row.note} |`).join('\n')}
`
writeFileSync(path.join(root, 'docs/IMAGE_DERIVATIVES.md'), doc)
console.log(`파생본 ${rows.length}개, 합계 ${total.toLocaleString('en-US')}바이트`)

// 정리 결과를 눈으로 확인하는 점검용 시트(선택): node scripts/build-assets.mjs --sheet <png 경로>
const sheetIndex = process.argv.indexOf('--sheet')
if (sheetIndex > 0 && process.argv[sheetIndex + 1]) {
  const ids = Object.keys(sprites)
  const cell = 200
  const columns = 5
  const composites = []
  for (const [index, id] of ids.entries()) {
    const buffer = await sharp(path.join(root, 'public', sprites[id].url)).resize({ width: cell - 20, height: cell - 20, fit: 'inside' }).png().toBuffer()
    composites.push({ input: buffer, left: (index % columns) * cell + 10, top: Math.floor(index / columns) * cell + 10 })
  }
  await sharp({ create: { width: columns * cell, height: Math.ceil(ids.length / columns) * cell, channels: 3, background: '#F1E4C9' } })
    .composite(composites)
    .png()
    .toFile(process.argv[sheetIndex + 1])
}
