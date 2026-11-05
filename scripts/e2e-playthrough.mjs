// 실제 브라우저(Chrome 또는 Edge, 헤드리스)에서 세 임무를 처음부터 엔딩까지 플레이하는 점검 스크립트.
// 추가 패키지 없이 Node 24의 fetch·WebSocket으로 브라우저를 조작한다.
//
//   npm run dev            (또는 npm run build && npm run preview)
//   node scripts/e2e-playthrough.mjs --url http://localhost:5173 --out <화면 저장 폴더>
//
// 선택: --size 1366x768  --combo cheap|exact  --keyboard  --skip  --reduced  --browser <실행 파일 경로>
//   cheap: 임무별 최저비용 조합, exact: 예산을 정확히 쓰는 조합
//   --keyboard: 모든 조작을 초점 이동 + Enter 키로 수행
//   --skip: 실행 연출을 '건너뛰기'로 넘김(관찰 단계는 건너뛸 수 없다)
//   --reduced: '동작 줄이기' 설정으로 플레이
//   --port: 여러 개를 동시에 돌릴 때 서로 다른 값을 준다. Edge는 두 개를 동시에 돌리다 한쪽이 멈춘 적이 있어 하나씩 돌린다.
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const args = process.argv.slice(2)
const flag = (name) => args.includes(`--${name}`)
const value = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}

const url = value('url', 'http://localhost:5173')
const outDir = value('out', null)
const [width, height] = value('size', '1366x768').split('x').map(Number)
const combo = value('combo', 'cheap')
const keyboard = flag('keyboard')
const skip = flag('skip')
const reduced = flag('reduced')
const port = Number(value('port', '9333'))
const label = `${width}x${height}-${combo}${keyboard ? '-kbd' : ''}${reduced ? '-reduced' : ''}`

const browserPath =
  value('browser', null) ??
  [
    `${process.env.ProgramFiles}\\Google\\Chrome\\Application\\chrome.exe`,
    `${process.env['ProgramFiles(x86)']}\\Microsoft\\Edge\\Application\\msedge.exe`,
    `${process.env.ProgramFiles}\\Microsoft\\Edge\\Application\\msedge.exe`,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find((candidate) => candidate && existsSync(candidate))

if (!browserPath) {
  console.error('Chrome 또는 Edge를 찾지 못했습니다. --browser 로 실행 파일 경로를 알려 주세요.')
  process.exit(2)
}

// ── 임무별 계획 ────────────────────────────────────────────

const PLANS = {
  cheap: [
    {
      picks: [
        { facility: '도서관', option: '접이식 활동 테이블', others: ['고정형 큰 테이블', '이동 모듈 테이블'], bad: '고정형 큰 테이블', job: '도서관 설치', slot: 2 },
        { facility: '학교', option: '소형 수동 높이 조절 책상', others: ['고정 높이 책상', '넓은 높이 조절 책상'], bad: '고정 높이 책상', job: '학교 설치', slot: 2 },
      ],
      // 도서관 1일차 오후~2일차 오전과 학교가 겹친다 → 도서관을 2일차 오후로 옮긴다
      fix: { job: '도서관 설치', slot: 4, expect: '겹쳐요' },
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 70/82',
    },
    {
      picks: [
        { facility: '주민센터', option: '현장 설정형 안내 도구', others: ['음성 전용 안내 장치', '사전 설정형 안내 도구'], bad: '음성 전용 안내 장치', job: '주민센터 설치', slot: 3 },
        { facility: '공원', option: '조립형 이동 안내판', others: ['바닥 고정 안내판', '완성형 이동 안내판'], bad: '바닥 고정 안내판', job: '공원 설치', slot: 1 },
      ],
      // 첫 설치(2일차 오전~오후)가 끝나기 전의 재확인은 순서 오류다
      extra: [{ job: '주민센터 개선·재확인', slot: 4, expectTag: '관찰 전' }],
      fix: { job: '주민센터 개선·재확인', slot: 5 },
      improvement: { wrong: '기기 외관의 색만 바꾼다', right: '첫 문장과 단계 수를 줄인다' },
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 66/78',
    },
    {
      picks: [
        { facility: '공원', option: '현장 조립형 쉼 공간', others: ['행사 장식 조형물', '사전 조립형 쉼 공간'], bad: '행사 장식 조형물', job: '공원 설치', slot: 3 },
        { facility: '학교', option: '공유학습용 소형 수동 높이 조절 책상', others: ['공유학습용 고정 높이 책상', '공유학습용 넓은 높이 조절 책상'], bad: '공유학습용 고정 높이 책상', job: '학교 설치', slot: 1 },
      ],
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 68/80',
    },
  ],
  exact: [
    {
      picks: [
        { facility: '도서관', option: '이동 모듈 테이블', others: ['접이식 활동 테이블'], job: '도서관 설치', slot: 4 },
        { facility: '학교', option: '넓은 높이 조절 책상', others: ['소형 수동 높이 조절 책상'], job: '학교 설치', slot: 3 },
      ],
      // 두 고가 안은 예산을 8점 넘는다 → 학교를 소형 책상으로 바꾼다
      overBudget: { facility: '학교', option: '소형 수동 높이 조절 책상', job: '학교 설치', slot: 2, expect: '예산을 8점 넘었어요' },
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 82/82',
    },
    {
      picks: [
        { facility: '주민센터', option: '사전 설정형 안내 도구', others: ['현장 설정형 안내 도구'], job: '주민센터 설치', slot: 3 },
        { facility: '공원', option: '조립형 이동 안내판', others: ['완성형 이동 안내판'], job: '공원 설치', slot: 1 },
      ],
      extra: [{ job: '주민센터 개선·재확인', slot: 4 }],
      improvement: { wrong: '화면 배경에 장식을 더한다', right: '자주 찾는 메뉴만 앞에 크게 둔다' },
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 78/78',
    },
    {
      picks: [
        { facility: '공원', option: '사전 조립형 쉼 공간', others: ['현장 조립형 쉼 공간'], job: '공원 설치', slot: 4 },
        { facility: '학교', option: '공유학습용 소형 수동 높이 조절 책상', others: ['공유학습용 넓은 높이 조절 책상'], job: '학교 설치', slot: 1 },
      ],
      summary: '요구 2/2 충족 · 확인 2/2 · 사용 예산 80/80',
    },
  ],
}

// ── 브라우저 연결 ──────────────────────────────────────────

const profileDir = mkdtempSync(path.join(tmpdir(), 'ppscon-e2e-'))
const browser = spawn(
  browserPath,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`, `--window-size=${width},${height}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function connect() {
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
      const page = pages.find((item) => item.type === 'page')
      if (page) return new WebSocket(page.webSocketDebuggerUrl)
    } catch {
      // 아직 준비 중
    }
    await sleep(150)
  }
  throw new Error('브라우저에 연결하지 못했습니다.')
}

const socket = await connect()
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})

let nextId = 1
const pending = new Map()
const problems = []
const requests = []
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data)
  if (message.id) {
    const waiter = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) waiter?.reject(new Error(`${waiter.method}: ${message.error.message}`))
    else waiter?.resolve(message.result)
    return
  }
  const { method, params } = message
  if (method === 'Runtime.exceptionThrown') problems.push(`예외: ${params.exceptionDetails.exception?.description ?? params.exceptionDetails.text}`)
  if (method === 'Runtime.consoleAPICalled' && (params.type === 'error' || params.type === 'warning')) {
    problems.push(`콘솔 ${params.type}: ${params.args.map((arg) => arg.value ?? arg.description).join(' ')}`)
  }
  if (method === 'Log.entryAdded' && params.entry.level === 'error') problems.push(`로그 오류: ${params.entry.text} ${params.entry.url ?? ''}`)
  if (method === 'Network.requestWillBeSent') requests.push(params.request.url)
  if (method === 'Network.responseReceived' && params.response.status >= 400) problems.push(`응답 ${params.response.status}: ${params.response.url}`)
  if (method === 'Network.loadingFailed' && !params.canceled) problems.push(`요청 실패: ${params.errorText}`)
})

function send(method, params = {}, timeoutMs = 30000) {
  const id = nextId++
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => {
    // 브라우저가 응답하지 않으면 끝없이 기다리지 않고 실패로 끝낸다.
    const timer = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`${method}: 브라우저가 ${timeoutMs / 1000}초 동안 응답하지 않았습니다.`))
    }, timeoutMs)
    pending.set(id, {
      method,
      resolve: (result) => {
        clearTimeout(timer)
        resolve(result)
      },
      reject: (error) => {
        clearTimeout(timer)
        reject(error)
      },
    })
  })
}

async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text)
  return result.result.value
}

async function waitFor(expression, what, timeout = 20000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    if (await evaluate(expression)) return
    await sleep(100)
  }
  throw new Error(`기다리던 상태가 오지 않았습니다: ${what}`)
}

let shot = 0
const skippedShots = []
// 화면 저장은 기록일 뿐 판정이 아니다. 브라우저의 캡처가 멈추면 그 장만 건너뛰고 계속한다.
async function screenshot(name, fullPage = false) {
  try {
    await capture(name, fullPage)
  } catch {
    skippedShots.push(name)
  }
}

async function capture(name, fullPage) {
  if (!outDir) return
  mkdirSync(outDir, { recursive: true })
  const params = { format: 'png' }
  if (fullPage) {
    const metrics = await send('Page.getLayoutMetrics')
    params.captureBeyondViewport = true
    params.clip = { x: 0, y: 0, width: metrics.cssContentSize.width, height: metrics.cssContentSize.height, scale: 1 }
  }
  const { data } = await send('Page.captureScreenshot', params, 12000)
  shot += 1
  writeFileSync(path.join(outDir, `${label}-${String(shot).padStart(2, '0')}-${name}.png`), Buffer.from(data, 'base64'))
}

// 페이지 안에서 대상을 찾는 도우미. 보이는 요소만 대상으로 한다.
const HELPERS = `
window.__e2e = {
  visible(el) { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' },
  find(sel, text, index = 0, scope) {
    const root = scope ? document.querySelector(scope) : document
    if (!root) return null
    return [...root.querySelectorAll(sel)].filter((el) => this.visible(el) && (!text || el.textContent.includes(text)))[index] ?? null
  },
  target(sel, text, index, scope) {
    const el = this.find(sel, text, index, scope)
    if (!el) return { error: '찾지 못함: ' + sel + ' / ' + (text ?? '') + (scope ? ' @ ' + scope : '') }
    el.scrollIntoView({ block: 'center', inline: 'center' })
    const r = el.getBoundingClientRect()
    const x = r.left + r.width / 2, y = r.top + r.height / 2
    const top = document.elementFromPoint(x, y)
    const covered = !(top && (top === el || el.contains(top)))
    document.querySelectorAll('[data-e2e]').forEach((item) => item.removeAttribute('data-e2e'))
    el.setAttribute('data-e2e', '1')
    return { x, y, w: r.width, h: r.height, covered, coveredBy: covered && top ? top.className || top.tagName : null, inside: r.left >= 0 && r.right <= innerWidth + 0.5 }
  },
  text(sel) { return [...document.querySelectorAll(sel)].filter((el) => this.visible(el)).map((el) => el.textContent.trim()).join(' | ') },
  overflowX() { return document.documentElement.scrollWidth - innerWidth },
}
true`

const smallTargets = new Set()

/** 보이는 버튼을 실제 입력으로 누른다. 가려져 있거나 화면 밖이면 실패한다. */
async function press(sel, text, { index = 0, scope } = {}) {
  const target = await evaluate(`window.__e2e.target(${JSON.stringify(sel)}, ${JSON.stringify(text ?? null)}, ${index}, ${JSON.stringify(scope ?? null)})`)
  if (target.error) throw new Error(target.error)
  if (target.covered) throw new Error(`버튼이 가려져 있습니다: ${sel} / ${text ?? ''} (위에 ${target.coveredBy})`)
  if (!target.inside) throw new Error(`버튼이 화면 가로 밖으로 나갔습니다: ${sel} / ${text ?? ''}`)
  if (target.w < 44 || target.h < 44) smallTargets.add(`${text ?? sel} (${Math.round(target.w)}×${Math.round(target.h)})`)
  if (keyboard) {
    await evaluate(`document.querySelector('[data-e2e]').focus({ preventScroll: true }); document.activeElement === document.querySelector('[data-e2e]')`)
    const key = { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 }
    await send('Input.dispatchKeyEvent', { type: 'keyDown', ...key, text: '\r' })
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...key })
  } else {
    const point = { x: target.x, y: target.y, button: 'left', clickCount: 1 }
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: target.x, y: target.y })
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point })
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point })
  }
  await sleep(60)
}

function expect(condition, message) {
  if (!condition) throw new Error(`확인 실패: ${message}`)
}

async function textOf(sel) {
  return evaluate(`window.__e2e.text(${JSON.stringify(sel)})`)
}

async function checkLayout(where) {
  const overflow = await evaluate('window.__e2e.overflowX()')
  if (overflow > 1) problems.push(`가로 넘침 ${overflow}px: ${where}`)
}

const confirmSel = '.topbar-action, .confirm-box .btn-primary'

// 시설의 요청 패널을 연다. 다른 시설을 보고 있으면 지도로 돌아갔다가 연다.
async function openFacility(name) {
  const title = await evaluate(`document.querySelector('.panel-title')?.textContent ?? ''`)
  if (title.includes(`${name}의 요청`)) return
  if (!(await evaluate(`!!document.querySelector('.town')`))) {
    await press('.stage-back')
    await waitFor(`!!document.querySelector('.town')`, '동네 지도로 돌아옴')
  }
  await press('.town-spot', name)
  await waitFor(`document.querySelector('.panel-title')?.textContent.includes(${JSON.stringify(name)})`, `${name} 요청 패널`)
}

async function placeJob(job, slot) {
  await press('.job-chip', job)
  await press('button.slot', null, { index: slot - 1 })
}

// ── 플레이 ─────────────────────────────────────────────────

async function playMission(number, plan) {
  // 임무 전환
  await waitFor(`!!document.querySelector('.scene-chapter')`, `임무 ${number} 전환 화면`)
  await sleep(400)
  await screenshot(`m${number}-chapter`)
  await checkLayout(`임무 ${number} 전환`)
  await press('.scene-chapter .btn-primary')
  await waitFor(`!!document.querySelector('.town')`, '동네 지도')
  await sleep(500)
  await screenshot(`m${number}-town`)
  await checkLayout(`임무 ${number} 지도`)
  expect((await evaluate(`document.querySelector('.topbar-action, .confirm-box .btn-primary')?.getAttribute('aria-disabled')`)) === 'true', '빈 계획은 확정할 수 없다')

  for (const [pickIndex, pick] of plan.picks.entries()) {
    await openFacility(pick.facility)
    await sleep(700)
    await screenshot(`m${number}-${pickIndex + 1}-need`)
    // 부적격 안도 처음부터 열려 있고 누를 수 있다
    expect((await evaluate(`document.querySelectorAll('.option-card').length`)) === 3, '공급안 카드 3장')
    expect((await evaluate(`[...document.querySelectorAll('.option-card button')].every((b) => !b.disabled)`)) === true, '어떤 카드도 비활성화돼 있지 않다')
    expect((await evaluate(`document.querySelectorAll('.option-conditions .is-unknown').length`)) === 6, '살펴보기 전에는 조건 판정을 보여 주지 않는다')

    for (const other of pick.others) {
      await press('.option-card button', '사용 미리보기', { scope: `.option-card[aria-label=${JSON.stringify(other)}]` })
      await sleep(reduced ? 1300 : 2300)
      await screenshot(`m${number}-${pickIndex + 1}-preview-${other.replaceAll(' ', '')}`)
    }
    if (pick.bad) {
      // 부적격 안을 잠정 선택하면 이유가 나오고 확정이 막힌다
      await press('.option-card button', '이 안 선택', { scope: `.option-card[aria-label=${JSON.stringify(pick.bad)}]` })
      await sleep(300)
      const warning = await textOf('.option-card.is-selected .notice-warn')
      expect(warning.includes('충족하지 못해 확정할 수 없어요'), `부적격 안의 이유 표시 (${pick.bad}): ${warning}`)
      expect((await evaluate(`document.querySelector(${JSON.stringify(confirmSel)})?.getAttribute('aria-disabled')`)) === 'true', '부적격 안으로는 확정할 수 없다')
      await screenshot(`m${number}-${pickIndex + 1}-ineligible`)
      await checkLayout(`임무 ${number} 부적격 선택`)
    }
    if (pickIndex === 0) {
      await press('.btn', '나란히 비교표')
      await waitFor(`!!document.querySelector('dialog[open] .compare-table')`, '비교표')
      await sleep(300)
      await screenshot(`m${number}-compare`)
      if (keyboard) {
        await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
        await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 })
      } else {
        await press('dialog[open] .btn', '닫기')
      }
      await waitFor(`!document.querySelector('dialog[open]')`, '비교표 닫힘')
    }
    await press('.option-card button', '사용 미리보기', { scope: `.option-card[aria-label=${JSON.stringify(pick.option)}]` })
    await sleep(reduced ? 1300 : 2300)
    await screenshot(`m${number}-${pickIndex + 1}-preview-${pick.option.replaceAll(' ', '')}`)
    await press('.option-card button', '이 안 선택', { scope: `.option-card[aria-label=${JSON.stringify(pick.option)}]` })
    await sleep(200)
    expect((await textOf('.option-card.is-selected .notice-ok')).includes('선택 근거'), '선택 근거 표시')
    // 고른 안의 설치 작업이 집힌 상태이므로 칸만 누르면 놓인다
    await press('button.slot', null, { index: pick.slot - 1 })
    await sleep(200)
  }

  for (const extra of plan.extra ?? []) {
    await placeJob(extra.job, extra.slot)
    await sleep(200)
    if (extra.expectTag) {
      const tags = await textOf('.slot-tags')
      expect(tags.includes(extra.expectTag), `칸의 문제 표시 (${extra.expectTag}): ${tags}`)
      await screenshot(`m${number}-schedule-issue`)
    }
  }

  if (plan.overBudget) {
    const status = await textOf('#plan-status')
    expect(status.includes(plan.overBudget.expect), `예산 초과 안내: ${status}`)
    expect((await evaluate(`document.querySelector(${JSON.stringify(confirmSel)})?.getAttribute('aria-disabled')`)) === 'true', '예산을 넘으면 확정할 수 없다')
    await screenshot(`m${number}-over-budget`)
    await openFacility(plan.overBudget.facility)
    await press('.option-card button', '이 안 선택', { scope: `.option-card[aria-label=${JSON.stringify(plan.overBudget.option)}]` })
    await press('button.slot', null, { index: plan.overBudget.slot - 1 })
    await sleep(200)
  }

  if (plan.fix) {
    if (plan.fix.expect) {
      const status = await textOf('#plan-status')
      expect(status.includes(plan.fix.expect), `일정 문제 안내 (${plan.fix.expect}): ${status}`)
      expect((await evaluate(`document.querySelectorAll('.slot.has-issue').length`)) > 0, '문제가 있는 칸 표시')
      await screenshot(`m${number}-conflict`)
    }
    await placeJob(plan.fix.job, plan.fix.slot)
    await sleep(200)
  }

  const ready = await textOf('#plan-status')
  expect(ready.includes('필요한 기능이 준비됐어요'), `계획 준비 완료: ${ready}`)
  await evaluate('window.scrollTo(0, 0)')
  await sleep(200)
  await screenshot(`m${number}-plan-ready`)
  await checkLayout(`임무 ${number} 계획 완료`)

  // 확정 → 실행
  await press(confirmSel)
  await waitFor(`!!document.querySelector('.step-list')`, '실행 화면')
  await evaluate('window.scrollTo(0, 0)')
  await sleep(900)
  await screenshot(`m${number}-exec-start`)
  await checkLayout(`임무 ${number} 실행`)
  const executionStarted = Date.now()

  if (plan.improvement) {
    if (skip) {
      // 건너뛰기를 거듭 눌러도 관찰은 지나칠 수 없다
      await press('.btn', '연출 건너뛰기')
      await evaluate(`window.__e2e.find('.btn', '연출 건너뛰기')?.click(); true`)
    }
    await waitFor(`!!document.querySelector('.choice-group')`, '사용 관찰', 40000)
    await sleep(900)
    await screenshot(`m${number}-observation`)
    await checkLayout(`임무 ${number} 관찰`)
    expect((await evaluate(`!!document.querySelector('.is-usage')`)) === false, '관찰 전에는 이용 확인으로 넘어가지 않는다')
    await press('.choice-group .btn', plan.improvement.wrong)
    await sleep(300)
    expect((await textOf('.side-panel .notice-warn')).includes('다시 확인해 보세요'), '잘못된 개선 안내')
    expect((await evaluate(`!!document.querySelector('.choice-group')`)) === true, '잘못 골라도 다시 고를 수 있다')
    await screenshot(`m${number}-observation-retry`)
    await press('.choice-group .btn', plan.improvement.right)
    await waitFor(`!document.querySelector('.choice-group')`, '개선 반영')
    await sleep(1200)
    await screenshot(`m${number}-improve`)
  } else {
    await sleep(skip ? 0 : 3600)
    if (!skip) await screenshot(`m${number}-exec-mid`)
  }
  if (skip) await evaluate(`window.__e2e.find('.btn', '연출 건너뛰기')?.click(); true`)
  await waitFor(`!!document.querySelector('.is-usage')`, '이용 확인', 40000)
  const executionSeconds = (Date.now() - executionStarted) / 1000
  if (!skip && !plan.improvement) expect(executionSeconds <= 24, `실행 연출 ${executionSeconds.toFixed(1)}초 (24초 이하)`)

  // 이용 확인: 건너뛰었어도 두 시설 모두 남아 있다
  for (let index = 0; index < plan.picks.length; index++) {
    await evaluate('window.scrollTo(0, 0)')
    await sleep(reduced ? 500 : 700)
    await screenshot(`m${number}-usage-${index + 1}-a`)
    await sleep(reduced ? 1300 : 2400)
    await screenshot(`m${number}-usage-${index + 1}-b`)
    await checkLayout(`임무 ${number} 이용 확인 ${index + 1}`)
    await press('.side-panel .btn-primary')
    await sleep(300)
  }

  await waitFor(`!!document.querySelector('.scene-result')`, '결과 화면')
  await sleep(500)
  const summary = await textOf('.result-summary')
  expect(summary === plan.summary, `결과 요약: ${summary} (기대: ${plan.summary})`)
  const total = await textOf('.score-total td')
  expect(total === '100 / 100', `학습 완료 표시: ${total}`)
  await screenshot(`m${number}-result`)
  await checkLayout(`임무 ${number} 결과`)
  return executionSeconds
}

let failed = false
const started = Date.now()
try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Log.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 })
  if (width < 700) await send('Emulation.setTouchEmulationEnabled', { enabled: false })

  await send('Page.navigate', { url })
  await waitFor(`document.readyState === 'complete' && !!document.querySelector('.scene-intro')`, '인트로')
  // 깨끗한 저장 상태에서 시작한다. 동작 줄이기는 설정 저장값으로 켠다.
  await evaluate(`localStorage.clear(); ${reduced ? `localStorage.setItem('ppscon.settings', JSON.stringify({ reducedMotion: true }));` : ''} true`)
  await send('Page.reload')
  await sleep(300)
  await waitFor(`document.readyState === 'complete' && !!document.querySelector('.scene-intro .btn-primary')`, '인트로')
  await evaluate(HELPERS)
  await sleep(900)
  await screenshot('intro')
  await checkLayout('인트로')
  expect((await evaluate(`document.querySelectorAll('.scene-intro .btn-primary').length`)) === 1, '첫 화면의 주 버튼은 하나')
  expect((await textOf('.scene-intro .btn')).includes('이어하기') === false, '저장이 없으면 이어하기가 없다')

  await press('.scene-intro .btn-primary', '첫 상자 열기')

  const seconds = []
  for (const [index, plan] of PLANS[combo].entries()) {
    seconds.push(await playMission(index + 1, plan))
    if (index === 0) {
      // 임무 경계에서 저장됐는지: 새로고침 뒤 이어하기로 다음 임무가 열린다
      await send('Page.reload')
      await sleep(300)
      await waitFor(`document.readyState === 'complete' && !!document.querySelector('.scene-intro .btn')`, '새로고침 뒤 인트로')
      await evaluate(HELPERS)
      await sleep(600)
      expect((await textOf('.scene-intro .btn')).includes('이어하기'), '저장이 있으면 이어하기가 보인다')
      await screenshot('intro-continue')
      await press('.scene-intro .btn', '이어하기')
    } else {
      await press('.scene-result .btn-primary')
    }
  }

  await waitFor(`!!document.querySelector('.scene-ending')`, '엔딩')
  await sleep(1200)
  await screenshot('ending')
  await screenshot('ending-full', true)
  await checkLayout('엔딩')
  expect((await evaluate(`document.querySelectorAll('.recap-card').length`)) === 4, '엔딩에서 네 시설을 되짚는다')
  expect((await textOf('.ending-meaning')).includes('첫 구매'), '엔딩의 두 가지 의미')

  // 설정: 음소거와 음원 상태
  await press('.scene-ending .btn', '설정')
  await waitFor(`!!document.querySelector('dialog[open]')`, '설정 창')
  await sleep(300)
  await screenshot('settings')
  const soundNote = await textOf('dialog[open] .settings-group .fine-print')
  expect(soundNote.includes('소리 없이 진행됩니다'), `음원 없음 안내: ${soundNote}`)
  await evaluate(`document.querySelector('dialog[open] input[type=checkbox]').click(); true`)
  expect((await evaluate(`JSON.parse(localStorage.getItem('ppscon.settings')).muted`)) === true, '음소거 설정 저장')

  // 마친 임무를 다시 열기 → 다시 계획 → 새 게임 → 처음 화면
  await press('dialog[open] .btn', '닫기')
  await waitFor(`!document.querySelector('dialog[open]')`, '설정 창 닫힘')
  await press('.scene-ending .btn', '임무 2 다시 비교해 보기')
  await waitFor(`document.querySelector('.chapter-title')?.textContent.includes('첫 구매')`, '임무 2 다시 열기')
  await press('.scene-chapter .btn-primary')
  await waitFor(`!!document.querySelector('.town')`, '임무 2 지도')
  expect((await textOf('.budget-label strong')) === '8', '다시 연 임무는 빈 계획에 개선 예약비 8점만 있다')
  await openFacility('공원')
  await press('.option-card button', '이 안 선택', { scope: `.option-card[aria-label="조립형 이동 안내판"]` })
  await sleep(200)
  expect((await textOf('.budget-label strong')) === '24', '선택한 안의 비용이 예산에 반영된다')
  await press('.topbar .btn', '설정')
  await press('dialog[open] .btn', '이 임무 다시 계획')
  await waitFor(`!document.querySelector('dialog[open]') && !!document.querySelector('.town')`, '다시 계획')
  expect((await textOf('.budget-label strong')) === '8', '다시 계획하면 선택과 비용이 비워진다')
  expect((await evaluate(`Object.keys(JSON.parse(localStorage.getItem('ppscon.save')).results).length`)) === 3, '다른 임무의 결과는 남는다')
  await press('.topbar .btn', '설정')
  await press('dialog[open] .btn', '새 게임')
  await press('dialog[open] .btn', '지우고 새로 시작')
  await waitFor(`document.querySelector('.chapter-title')?.textContent.includes('내일의 독서 공간')`, '새 게임')
  await sleep(300)
  expect((await evaluate(`Object.keys(JSON.parse(localStorage.getItem('ppscon.save') ?? '{"results":{}}').results).length`)) === 0, '새 게임은 진행을 지운다')
  expect((await evaluate(`JSON.parse(localStorage.getItem('ppscon.settings')).muted`)) === true, '새 게임을 해도 소리 설정은 남는다')
  await press('.scene-chapter .btn', '설정')
  await press('dialog[open] .btn', '처음 화면으로')
  await waitFor(`!!document.querySelector('.scene-intro')`, '처음 화면')
  expect((await textOf('.scene-intro .btn')).includes('이어하기'), '진행 중인 임무가 있으면 이어하기가 보인다')

  // 불러온 자원 확인
  const audioFiles = requests.filter((item) => item.includes('/assets/audio/') && !item.endsWith('manifest.json'))
  if (audioFiles.length > 0) problems.push(`준비되지 않은 음원을 요청했습니다: ${audioFiles.join(', ')}`)
  const originals = requests.filter((item) => item.includes('/assets/images/'))
  if (originals.length > 0) problems.push(`게임이 원본 PNG를 불러왔습니다: ${originals.join(', ')}`)

  console.log(`[${label}] 세 임무와 엔딩까지 진행 완료 · ${((Date.now() - started) / 1000).toFixed(0)}초 · 실행 연출 ${seconds.map((item) => item.toFixed(1)).join(' / ')}초 · 요청 ${requests.length}건`)
  if (skippedShots.length > 0) console.log('[' + label + '] 브라우저가 화면 저장에 응답하지 않아 건너뛴 장: ' + skippedShots.join(', '))
  if (smallTargets.size > 0) console.log(`[${label}] 44px보다 작은 누름 영역: ${[...smallTargets].join(', ')}`)
} catch (error) {
  failed = true
  console.error(`[${label}] 실패: ${error.message}`)
  await screenshot('failure').catch(() => {})
}

if (problems.length > 0) {
  failed = true
  console.error(`[${label}] 문제 ${problems.length}건`)
  for (const problem of [...new Set(problems)]) console.error(`  - ${problem}`)
} else if (!failed) {
  console.log(`[${label}] 콘솔 오류·실패한 요청·가로 넘침 없음`)
}

socket.close()
// 브라우저가 띄운 하위 프로세스까지 함께 끝낸다.
if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(browser.pid), '/T', '/F'], { stdio: 'ignore' })
else browser.kill()
await sleep(400)
try {
  rmSync(profileDir, { recursive: true, force: true })
} catch {
  // 브라우저가 아직 파일을 잡고 있으면 임시 폴더는 남는다
}
process.exit(failed ? 1 : 0)
