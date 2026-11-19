/**
 * Builds the contest submission: a folder that runs by double-clicking index.html (no server, no install), and a ZIP of it.
 *
 * The normal build (npm run build) is made for a web server: it loads ES modules and asks for pictures and sounds
 * at absolute addresses (/center/...). Neither works from a file opened on disk, so this build differs in three ways:
 *   1. one classic script and one stylesheet instead of module chunks,
 *   2. every address is relative to index.html,
 *   3. the hosting-only _headers file is left out and a README.txt with running instructions is added.
 * The game code, rules, pictures and sounds are the same files as the published site.
 *
 * Usage (project root):
 *   node scripts/build-submission.mjs [--zip "submission/AI게임_실행파일_센터장님 다음 주는요_성명.zip"] [--out submission/game] [--keep]
 * The folder is removed once the ZIP is written unless --keep is given. Replace 성명 in the file name with the
 * entrant's name (or team name) before sending; the contest's rule is AI게임_실행파일_작품명_성명(또는 팀명).zip.
 * The work's title contains "?" and ",", which a Windows file name cannot or should not carry, so the name leaves them out.
 */
import fs from 'node:fs'
import path from 'node:path'
import zlib from 'node:zlib'
import { pathToFileURL } from 'node:url'

const root = process.cwd(), args = process.argv.slice(2), option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const out = path.resolve(root, option('--out', 'submission/game'))
const zipPath = path.resolve(root, option('--zip', 'submission/AI게임_실행파일_센터장님 다음 주는요_성명.zip'))
const ONLINE = 'https://ppscon2.pages.dev'
const fail = message => { console.error('제출용 빌드 실패: ' + message); process.exit(1) }
if (!fs.existsSync(path.join(root, 'vite.config.ts'))) fail('프로젝트 루트에서 실행하세요.')
// The folder is emptied before building, so it must never be the project itself or anything the project sits inside.
if (out === root || (root + path.sep).startsWith(out + path.sep)) fail('출력 폴더로 쓸 수 없는 위치입니다: ' + out)
for (const sibling of ['src', 'public', 'docs', 'scripts', 'tests', 'node_modules', '.git']) if (out === path.join(root, sibling) || out.startsWith(path.join(root, sibling) + path.sep)) fail('출력 폴더로 쓸 수 없는 위치입니다: ' + out)

const { build } = await import(pathToFileURL(path.join(root, 'node_modules/vite/dist/node/index.js')).href)
await build({
  root, base: './', logLevel: 'warn',
  build: {
    outDir: out, emptyOutDir: true, cssCodeSplit: false, modulePreload: false,
    // One script on purpose, so its size is expected.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      // Vite's chunk-loading helper mentions import.meta; with everything in one classic script it is never used.
      onwarn(warning, warn) { if (warning.code !== 'EMPTY_IMPORT_META') warn(warning) },
      // A classic (IIFE) script cannot be split, so the lazily loaded parts are folded into the one file.
      output: { format: 'iife', entryFileNames: 'assets/game.js', assetFileNames: 'assets/[name][extname]' },
    },
  },
})

// --- 1. script: addresses relative to the page. The one comparison against a full address keeps its leading slash.
const scriptFile = path.join(out, 'assets/game.js')
let script = fs.readFileSync(scriptFile, 'utf8')
if (/\bimport\s*\(|import\.meta/.test(script)) fail('스크립트에 모듈 불러오기가 남아 있습니다.')
const before = (script.match(/["'`]\/center\//g) ?? []).length
script = script.replace(/(?<!endsWith\()(["'`])\/center\//g, '$1./center/')
const kept = (script.match(/["'`]\/center\//g) ?? []).length, loose = (script.match(/[^."'`]\/center\//g) ?? []).length
if (!before || kept > 4 || loose) fail(`주소 바꾸기 결과가 예상과 다릅니다 (바꿀 곳 ${before}, 남은 곳 ${kept}, 따옴표 없이 쓰인 곳 ${loose}).`)
fs.writeFileSync(scriptFile, script)

// --- 2. page: a classic script (module scripts are refused for files on disk), no cross-origin attributes.
const pageFile = path.join(out, 'index.html')
let page = fs.readFileSync(pageFile, 'utf8')
page = page.replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/, '<script defer src="$1"></script>')
  .replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/, '<link rel="stylesheet" href="$1">')
  .replace(/(["'])\/center\//g, '$1./center/')
if (/type="module"|crossorigin|=["']\//.test(page) || !page.includes('<script defer src="./assets/game.js">')) fail('index.html에 서버용 주소가 남아 있습니다.')
const styles = [...page.matchAll(/<link rel="stylesheet" href="\.\/assets\/([^"]+)">/g)].map(match => match[1])
if (styles.length !== 1 || !fs.existsSync(path.join(out, 'assets', styles[0]))) fail('스타일 파일이 하나가 아닙니다: ' + styles.join(', '))
fs.writeFileSync(pageFile, page)

// --- 3. leave out what only the hosting service reads, add instructions.
fs.rmSync(path.join(out, '_headers'), { force: true })
const readme = [
  '센터장님, 다음 주는요?',
  '2026 조달청 AI 게임·콘텐츠 공모전 · AI 게임 부문 실행파일',
  '',
  '■ 실행 방법',
  '1. 이 압축 파일을 먼저 모두 풉니다. (압축 프로그램 안에서 바로 열면 그림과 소리가 나오지 않습니다.)',
  '2. 풀린 폴더의 index.html 을 더블클릭합니다. 크롬 또는 엣지 브라우저를 권장합니다.',
  '3. 설치나 인터넷 연결은 필요하지 않습니다.',
  '',
  '■ 온라인으로도 실행할 수 있습니다',
  ONLINE + '  (PC·모바일 브라우저)',
  '',
  '■ 조작',
  '마우스나 터치로 진행합니다. 처음 시작하면 튜토리얼이 나옵니다.',
  '소리는 화면을 한 번 누른 뒤부터 나며, 화면의 음향 설정에서 끄거나 음량을 바꿀 수 있습니다.',
  '',
  '■ 저장',
  '진행 상황은 이 브라우저에 자동으로 저장됩니다.',
  '첫 화면의 "저장 파일 내보내기"와 "파일 불러오기"로 다른 기기나 브라우저로 옮길 수 있습니다.',
  '브라우저의 사이트 데이터를 지우면 저장도 함께 지워집니다.',
  '',
  '■ 구성',
  'index.html   게임 시작 파일',
  'assets/      프로그램(스크립트·스타일)',
  'center/      그림과 소리',
  '',
].join('\r\n')
fs.writeFileSync(path.join(out, 'README.txt'), '﻿' + readme)

// --- 4. nothing in the folder may still point at a server address or be missing.
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)])
const files = walk(out).map(file => path.relative(out, file).replace(/\\/g, '/')).sort()
const named = [...new Set([...script.matchAll(/["'`]\.\/(center\/[A-Za-z0-9_\-./]+\.(?:webp|png|jpg|svg|mp3|wav))["'`]/g)].map(match => match[1]))]
const absent = named.filter(name => !files.includes(name))
if (absent.length) fail('스크립트가 가리키는 파일이 없습니다: ' + absent.join(', '))
for (const top of new Set(files.map(file => file.split('/')[0]))) if (!['index.html', 'README.txt', 'assets', 'center'].includes(top)) fail('예상하지 않은 항목이 들어 있습니다: ' + top)

// --- 5. ZIP. Written here rather than with a system tool so that names use forward slashes and are flagged UTF-8,
//        which every current unzip program reads. Already-compressed media are stored as they are.
const stored = /\.(webp|png|jpg|jpeg|mp3)$/i, parts = [], central = []
let offset = 0
const dosTime = (date => ({ time: date.getHours() << 11 | date.getMinutes() << 5 | date.getSeconds() >> 1, day: (date.getFullYear() - 1980) << 9 | (date.getMonth() + 1) << 5 | date.getDate() }))(new Date())
for (const name of files) {
  const data = fs.readFileSync(path.join(out, name)), packed = stored.test(name) ? data : zlib.deflateRawSync(data, { level: 9 })
  const method = packed === data || packed.length >= data.length ? 0 : 8, body = method ? packed : data, nameBytes = Buffer.from(name, 'utf8'), crc = zlib.crc32(data)
  const local = Buffer.alloc(30)
  local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6); local.writeUInt16LE(method, 8); local.writeUInt16LE(dosTime.time, 10); local.writeUInt16LE(dosTime.day, 12)
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBytes.length, 26); local.writeUInt16LE(0, 28)
  const entry = Buffer.alloc(46)
  entry.writeUInt32LE(0x02014b50, 0); entry.writeUInt16LE(20, 4); entry.writeUInt16LE(20, 6); entry.writeUInt16LE(0x0800, 8); entry.writeUInt16LE(method, 10); entry.writeUInt16LE(dosTime.time, 12); entry.writeUInt16LE(dosTime.day, 14)
  entry.writeUInt32LE(crc, 16); entry.writeUInt32LE(body.length, 20); entry.writeUInt32LE(data.length, 24); entry.writeUInt16LE(nameBytes.length, 28); entry.writeUInt32LE(offset, 42)
  parts.push(local, nameBytes, body); central.push(entry, nameBytes); offset += 30 + nameBytes.length + body.length
}
const directory = Buffer.concat(central), end = Buffer.alloc(22)
end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16)
fs.mkdirSync(path.dirname(zipPath), { recursive: true })
fs.writeFileSync(zipPath, Buffer.concat([...parts, directory, end]))

const folderBytes = files.reduce((sum, name) => sum + fs.statSync(path.join(out, name)).size, 0), mb = bytes => (bytes / 1048576).toFixed(1) + ' MB'
const keep = args.includes('--keep')
if (!keep) fs.rmSync(out, { recursive: true, force: true })
console.log(JSON.stringify({ folder: keep ? path.relative(root, out) || out : '(ZIP을 만든 뒤 지움 · --keep으로 남길 수 있음)', files: files.length, folderSize: mb(folderBytes), zip: path.relative(root, zipPath) || zipPath, zipSize: mb(fs.statSync(zipPath).size), addressesMadeRelative: before - kept, addressesKeptForComparison: kept, mediaNamedInScript: named.length, stylesheet: styles[0] }, null, 2))
