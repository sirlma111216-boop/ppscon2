// 소리·동작 설정과 다시 시작. 네이티브 dialog가 초점 이동·복귀와 Esc 닫기를 맡는다.
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { audio } from '../audio/AudioManager'
import type { Settings } from '../game/persistence'

type Props = {
  settings: Settings
  reducedMotion: boolean
  onChange: (settings: Settings) => void
  onClose: () => void
  /** 진행 중인 임무가 있을 때만 */
  onReplan?: () => void
  onGoIntro?: () => void
  onNewGame?: () => void
  saveWorks: boolean
}

function subscribeAudio(listener: () => void): () => void {
  return audio.subscribe(listener)
}

let cachedStatus = audio.getStatus()
function readAudioStatus() {
  const next = audio.getStatus()
  if (next.started !== cachedStatus.started || next.connected !== cachedStatus.connected || next.total !== cachedStatus.total) cachedStatus = next
  return cachedStatus
}

function Slider({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  const percent = Math.round(value * 100)
  return (
    <label className="slider">
      <span>{label}</span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        aria-valuetext={`${percent}%`}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
      />
      <output>{percent}%</output>
    </label>
  )
}

export function SettingsDialog({ settings, reducedMotion, onChange, onClose, onReplan, onGoIntro, onNewGame, saveWorks }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const status = useSyncExternalStore(subscribeAudio, readAudioStatus)

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  const soundNote = !status.started
    ? '소리는 시작 버튼을 누른 뒤에 켜집니다.'
    : status.connected === 0
      ? `음원 파일이 아직 준비되지 않아 지금은 소리 없이 진행됩니다 (연결 0 / ${status.total}개). 소리가 없어도 모든 안내는 화면에 보입니다.`
      : `음원 ${status.connected} / ${status.total}개가 연결돼 있어요.`

  return (
    <dialog
      ref={dialogRef}
      className="dialog"
      aria-labelledby="settings-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div className="dialog-inner">
        <div className="dialog-head">
          <h2 id="settings-title">설정</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} autoFocus>
            닫기
          </button>
        </div>

        <fieldset className="settings-group">
          <legend>소리</legend>
          <label className="check">
            <input type="checkbox" checked={settings.muted} onChange={(event) => onChange({ ...settings, muted: event.target.checked })} />
            <span>전체 음소거</span>
          </label>
          <Slider label="음악" value={settings.music} disabled={settings.muted} onChange={(music) => onChange({ ...settings, music })} />
          <Slider label="효과음" value={settings.sfx} disabled={settings.muted} onChange={(sfx) => onChange({ ...settings, sfx })} />
          <Slider label="환경음" value={settings.ambience} disabled={settings.muted} onChange={(ambience) => onChange({ ...settings, ambience })} />
          <p className="fine-print">{soundNote}</p>
        </fieldset>

        <fieldset className="settings-group">
          <legend>움직임</legend>
          <label className="check">
            <input type="checkbox" checked={reducedMotion} onChange={(event) => onChange({ ...settings, reducedMotion: event.target.checked })} />
            <span>동작 줄이기</span>
          </label>
          <p className="fine-print">이동·펼침 연출을 짧은 전환으로 바꿉니다. 전달되는 내용은 같아요.</p>
        </fieldset>

        {(onReplan || onGoIntro || onNewGame) && (
          <fieldset className="settings-group">
            <legend>진행</legend>
            <div className="settings-actions">
              {onReplan && (
                <button type="button" className="btn btn-ghost" onClick={onReplan}>
                  이 임무 다시 계획
                </button>
              )}
              {onGoIntro && (
                <button type="button" className="btn btn-ghost" onClick={onGoIntro}>
                  처음 화면으로
                </button>
              )}
              {onNewGame && !confirmReset && (
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(true)}>
                  새 게임
                </button>
              )}
            </div>
            {onNewGame && confirmReset && (
              <div className="notice notice-warn" role="alertdialog" aria-label="새 게임 확인">
                <p>저장된 진행을 지우고 임무 1부터 다시 시작할까요? 소리·움직임 설정은 그대로 남습니다.</p>
                <div className="settings-actions">
                  <button type="button" className="btn btn-ink" onClick={onNewGame}>
                    지우고 새로 시작
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setConfirmReset(false)}>
                    취소
                  </button>
                </div>
              </div>
            )}
            <p className="fine-print">
              {saveWorks
                ? '진행은 이 기기의 브라우저에만 저장됩니다. 로그인이나 서버 저장은 없습니다.'
                : '이 브라우저에서는 저장이 막혀 있어, 창을 닫으면 진행이 남지 않습니다.'}
            </p>
          </fieldset>
        )}
      </div>
    </dialog>
  )
}
