/*
 * Screen demo play for the centre game: plays through the real interface and audits every screen it meets.
 *
 * Development only. Paste this file into the browser console of the dev server (npm run dev), or have a browser
 * automation tool evaluate it, then call:
 *   __demo.start({ seasons: 28, events: 'alternate', midseason: 'rotate', newGame: true })
 * and read __demo.report() when __demo.done is true.
 *
 * Buttons, radio buttons and dialogs are operated through the DOM exactly as a player would. Buying equipment,
 * upkeep, training and the class timetable are applied with the same public game actions the interface calls
 * (through window.__centerDemo, which exists only in development builds), because clicking through every
 * placement would make a seven-year run take hours.
 *
 * The audit looks for: horizontal overflow, text under 12.5 px, clipped text, controls smaller than 36 px,
 * elements cut off at the right edge and broken images.
 */
(() => {
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms))
  const shown = element => !element.disabled && element.offsetParent !== null
  const modal = () => document.querySelector('.game-modal')
  const find = (text, root = document) => [...root.querySelectorAll('button')].filter(shown).find(button => `${button.textContent} ${button.getAttribute('aria-label') ?? ''}`.includes(text))
  const click = (text, root) => { const button = find(text, root); if (button) button.click(); return Boolean(button) }
  const name = element => element.tagName.toLowerCase() + (typeof element.className === 'string' && element.className.trim() ? '.' + element.className.trim().split(/\s+/).slice(0, 2).join('.') : '')
  const scrolls = element => { for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) if (['auto', 'scroll'].includes(getComputedStyle(node).overflowX)) return true; return false }
  const demo = window.__demo = { running: false, done: false, error: null, seasons: 0, log: [], audits: {}, options: {} }

  function audit(label) {
    const width = innerWidth, root = modal() ?? document.body, found = demo.audits[label] ??= { times: 0 }
    const add = (kind, value) => { (found[kind] ??= []); if (!found[kind].includes(value) && found[kind].length < 10) found[kind].push(value) }
    found.times++
    if (document.documentElement.scrollWidth > width + 1) add('pageOverflowX', `${document.documentElement.scrollWidth} > ${width}`)
    const box = modal(); if (box && box.scrollWidth > box.clientWidth + 1) add('modalOverflowX', `${box.scrollWidth} > ${box.clientWidth}`)
    for (const element of root.querySelectorAll('*')) {
      const rect = element.getBoundingClientRect(); if (rect.width < 1 || rect.height < 1) continue
      const style = getComputedStyle(element); if (style.visibility === 'hidden' || style.display === 'none' || Number(style.opacity) === 0) continue
      if (element.closest('[aria-hidden="true"]') || (element.checkVisibility && !element.checkVisibility({ opacityProperty: true, visibilityProperty: true }))) continue
      const text = [...element.childNodes].filter(node => node.nodeType === 3).map(node => node.textContent.trim()).join('')
      if (text) {
        const size = parseFloat(style.fontSize); if (size < 12.5) add('smallText', `${name(element)} ${size}px "${text.slice(0, 14)}"`)
        if (element.scrollWidth > element.clientWidth + 2 && ['hidden', 'clip'].includes(style.overflowX) && style.textOverflow !== 'ellipsis') add('clippedText', `${name(element)} "${text.slice(0, 16)}"`)
      }
      if (rect.left < width && rect.right > width + 2 && !scrolls(element)) add('pastRightEdge', `${name(element)} +${Math.round(rect.right - width)}px`)
      if (element.matches('button, a[href], summary, select, input[type=checkbox], input[type=radio], input[type=range]')) {
        const target = element.matches('input') ? element.closest('label') ?? element : element, area = target.getBoundingClientRect()
        if (shown(element) && Math.min(area.width, area.height) < 36) add('smallTarget', `${name(element)} ${Math.round(area.width)}x${Math.round(area.height)} "${(element.textContent || element.getAttribute('aria-label') || '').trim().slice(0, 12)}"`)
      }
      if (element.tagName === 'IMG' && element.complete && element.naturalWidth === 0) add('brokenImage', element.getAttribute('src'))
    }
  }

  let sim, placement
  // The development hook is replaced on every render, so it is looked up afresh each time.
  const current = () => window.__centerDemo.get()
  /** Buying, upkeep, training and the timetable, with the same public actions the interface calls. */
  async function plan(stage) {
    let game = current(); const careless = demo.options.careless
    if (stage === 'rentals' && !careless) {
      for (const [offer, room] of [['E02', 'B'], ['E01', 'E'], ['E10', 'A'], ['E06', 'F'], ['E05', 'F'], ['E04', 'B'], ['E01', 'A']]) {
        if (game.player.inventory.some(item => item.id === offer && item.room === room)) continue
        const bought = sim.buyEquipment(game, offer, room); if (!bought.error && sim.freeCash(bought.state.player) > 450) { game = bought.state; break }
      }
      for (const room of game.player.rooms.filter(item => item.open)) if (sim.getRoomManagement(game.player, room.id) < 70) { const kept = sim.maintainRoom(game, room.id); if (!kept.error) game = kept.state }
      if (!game.player.trained && sim.freeCash(game.player) > 350) for (const field of ['sport', 'culture', 'event'].sort((a, b) => game.player.xp[a] - game.player.xp[b])) { const trained = sim.trainStaff(game, field); if (!trained.error) { game = trained.state; break } }
    }
    if (stage === 'classes') {
      for (const room of ['B', 'E', 'F', 'A', 'D', 'G', 'C']) for (let slot = 0; slot < 5; slot++) {
        if (game.player.plan[room][slot]) continue
        for (const program of ['P03', 'P01', 'P07', 'P09', 'P04', 'P02', 'P06']) {
          const placed = placement.scheduleClass(game, room, slot, program); if (placed.error) continue
          const forecast = sim.previewSeason(placed.state)
          if ((forecast.operationIssues ?? []).some(issue => issue.room === room && issue.slot === slot) || forecast.afterCash < 400) continue
          game = placed.state; break
        }
      }
    }
    if (game !== current()) { window.__centerDemo.set(game); await wait(400) }
  }

  async function lookAround() {
    for (const [label, open] of [['room', '생활체육실 들어가기'], ['rivals', '이웃 센터'], ['help', '도움말과 설정'], ['campus', '센터 환경 개선']]) {
      if (!click(open)) continue
      await wait(700); audit(label)
      if (modal()) { modal().querySelectorAll('details').forEach(item => { item.open = true }); await wait(150); audit(label + '-details'); click('닫기', modal()); await wait(400) }
      if (label === 'room') { if (click('관리')) { await wait(600); audit('room-care'); if (modal()) { click('닫기', modal()); await wait(300) } } click('센터 외관으로 돌아가기'); await wait(500) }
    }
  }

  async function season() {
    const options = demo.options; let game = current()
    const turn = (game.year - 1) * 4 + game.season
    if (modal() && find('소식 보기', modal())) {
      audit('season-greeting'); click('소식 보기', modal()); await wait(500); audit('season-news')
      const answers = [...modal().querySelectorAll('.season-choices input')].filter(input => !input.disabled)
      if (answers.length) { (options.events === 'pay' ? answers.at(-1) : options.events === 'alternate' ? answers[turn % answers.length] : answers[0]).click(); await wait(300); audit('season-answer') }
      click('확인 · 계절 계획 시작', modal()); await wait(700)
    }
    game = current()
    if (game.phase === 'planning' && game.planningStage === 'rentals') {
      await plan('rentals'); audit('plan-rentals')
      click(['수입 우선', '명성 우선', '공공서비스 우선'][turn % 3]); await wait(400)
      click('대관 확정 · 클래스 편성'); await wait(600)
      if (modal()) { audit('confirm-rentals'); const box = modal(); (box.querySelector('.primary-button') ?? find('확정', box))?.click(); await wait(600) }
    }
    game = current()
    if (game.phase === 'planning' && game.planningStage === 'classes') {
      await plan('classes'); audit('plan-classes')
      if (turn % 6 === 1) await lookAround()
      click('이번 계절 시작'); await wait(600)
      if (modal() && find('확인한 계획으로 운영', modal())) { audit('confirm-plan'); click('확인한 계획으로 운영', modal()); await wait(800) }
      if (modal()?.querySelector('.midseason-meeting')) {
        audit('midseason')
        const choices = [...modal().querySelectorAll('.season-choices input')]
        const wanted = options.midseason === 'promotion' ? 1 : options.midseason === 'repair' ? 2 : options.midseason === 'rotate' ? turn % 3 : 0
        if (!choices[wanted].disabled) choices[wanted].click(); await wait(250)
        modal().querySelector('.midseason-copy .primary-button').click(); await wait(900)
      }
    }
    game = current()
    if (game.phase === 'planning') throw new Error(`the season did not start (${game.year}-${game.season}, ${game.planningStage}, dialog ${modal()?.querySelector('h2')?.textContent ?? 'none'})`)
    audit('tour')
    if (turn % 9 === 0) { await wait(3000); audit('tour-next-stop') }
    if (click('건너뛰기')) await wait(600)
    audit('after-tour'); click('계절 결과 보기'); await wait(900)
    for (let step = 0; step < 4 && modal(); step++) {
      const next = find('평가 결과 발표', modal()) ?? find('우리 센터의 마지막 인사', modal()) ?? find('종합 성적과 운영 기록 보기', modal()); if (!next) break
      audit(`ceremony-${step}${game.phase === 'ending' ? '-final' : ''}`); next.click(); await wait(700)
    }
    const kind = game.phase === 'ending' ? 'ending' : game.lastReport?.evaluation ? 'review-evaluation' : 'review'
    audit(kind); modal()?.querySelectorAll('details').forEach(item => { item.open = true }); await wait(200); audit(kind + '-details')
    demo.log.push(`${game.year}년 ${['봄', '여름', '가을', '겨울'][game.season]} · ${game.lastReport?.rank}위 · 명성 ${game.player.reputation} · 신뢰 ${game.player.trust} · 현금 ${Math.round(game.player.cash)} · 사건 ${game.lastReport?.eventImpact?.id ?? '-'}/${game.lastReport?.eventChoice ?? '-'} · 중간 ${game.lastReport?.midseason?.choice ?? '-'} · 이야기 ${game.lastReport?.story?.kind ?? '-'} · 휴강 ${(game.lastReport?.operationIssues ?? []).reduce((sum, issue) => sum + issue.weeks, 0)}주`)
    demo.seasons++
    if (game.phase === 'ending') { demo.endingButtons = [...(modal() ?? document).querySelectorAll('button')].filter(shown).map(button => button.textContent.trim().slice(0, 24)); return false }
    if (click('7년 최종 결과 보기', modal() ?? document)) { await wait(1200); return true }
    if (!click('다음 계절 계획하기', modal() ?? document) && !click('새해를 맞이하기', modal() ?? document)) throw new Error('no way on to the next season: ' + [...(modal() ?? document).querySelectorAll('button')].filter(shown).map(button => button.textContent.trim().slice(0, 16)).join(' / '))
    await wait(900)
    return true
  }

  demo.start = async options => {
    if (demo.running) return 'already running'
    Object.assign(demo, { running: true, done: false, error: null, seasons: 0, log: [], audits: {}, options: { seasons: 28, events: 'default', midseason: 'steady', ...options } })
    try {
      sim = await import('/src/center/simulation.ts'); placement = await import('/src/center/classPlacement.ts')
      if (demo.options.newGame) {
        audit('title'); click('새 게임 시작'); await wait(1000)
        for (let step = 0; step < 16 && document.body.innerText.includes('튜토리얼 건너뛰기'); step++) { audit('tutorial'); if (!click('다음') && !click('이제 센터 운영 시작')) break; await wait(350) }
        await wait(900)
      } else if (find('이어서 하기')) { click('이어서 하기'); await wait(1300) }
      if (!window.__centerDemo) throw new Error('window.__centerDemo is missing: this needs the development server')
      while (demo.running && demo.seasons < demo.options.seasons && await season()) { /* next season */ }
      demo.done = true
    } catch (error) { demo.error = String(error?.stack ?? error) }
    demo.running = false
    return demo.report()
  }
  demo.report = () => ({ seasons: demo.seasons, done: demo.done, error: demo.error, viewport: `${innerWidth}x${innerHeight}`, endingButtons: demo.endingButtons, lastLog: demo.log.slice(-3),
    findings: Object.fromEntries(Object.entries(demo.audits).map(([label, found]) => [label, Object.fromEntries(Object.entries(found).filter(([kind]) => kind !== 'times'))]).filter(([, found]) => Object.keys(found).length)) })
  return 'ready'
})()
