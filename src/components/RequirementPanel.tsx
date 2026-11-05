// 한 시설의 요구와 공급안 비교. 모든 제시안은 같은 서식의 카드로 보이고,
// 조건 충족 여부는 사용 미리보기를 열거나 잠정 선택했을 때 드러난다.
import { useEffect, useRef } from 'react'
import { describeEligibility, slotLabel } from '../game/engine'
import { FACILITY_NAMES, FEATURE_LABELS } from '../game/missions'
import type { Mission, MissionRun, Requirement, SupplyOption } from '../game/types'
import { OptionArt } from './OptionArt'

type Props = {
  mission: Mission
  run: MissionRun
  requirement: Requirement
  previewId: string | null
  onPreview: (optionId: string) => void
  onSelect: (optionId: string | null) => void
  onOpenCompare: () => void
  onBack: () => void
}

function OptionCard({ requirement, option, revealed, selected, previewing, onPreview, onSelect }: {
  requirement: Requirement
  option: SupplyOption
  revealed: boolean
  selected: boolean
  previewing: boolean
  onPreview: () => void
  onSelect: () => void
}) {
  const blocked = selected ? describeEligibility(requirement, option) : null
  return (
    <article className={`option-card${selected ? ' is-selected' : ''}${previewing ? ' is-previewing' : ''}`} aria-label={option.name}>
      <div className="option-head">
        <OptionArt visual={option.visual} />
        <div>
          <h4>{option.name}</h4>
          {selected && (
            <p className="tag tag-selected">
              <span aria-hidden="true">✓</span> 선택됨
            </p>
          )}
          <p className="option-use">{option.useText}</p>
        </div>
      </div>
      <ul className="option-conditions" aria-label="필수 조건">
        {requirement.requiredFeatures.map((feature) => {
          const met = option.features.includes(feature)
          return (
            <li key={feature} className={revealed ? (met ? 'is-met' : 'is-unmet') : 'is-unknown'}>
              <span className="cond-icon" aria-hidden="true">{revealed ? (met ? '✓' : '✕') : '?'}</span>
              <span>
                <strong>{FEATURE_LABELS[feature].label}</strong>
                {revealed ? ` · ${met ? '충족' : '불충족'} — ${option.featureNotes[feature] ?? ''}` : ' · 사용 모습을 보고 확인해요'}
              </span>
            </li>
          )
        })}
      </ul>
      <dl className="option-meta">
        <div>
          <dt>비용</dt>
          <dd>{option.cost}점</dd>
        </div>
        <div>
          <dt>도착</dt>
          <dd>{slotLabel(option.readySlot)}</dd>
        </div>
        <div>
          <dt>설치</dt>
          <dd>{option.duration}칸</dd>
        </div>
      </dl>
      <p className="option-tradeoff">{option.tradeoffText}</p>
      {blocked && (
        <p className="notice notice-warn" role="status">
          <span aria-hidden="true">⚠</span> {blocked}
        </p>
      )}
      {selected && !blocked && (
        <p className="notice notice-ok" role="status">
          <span aria-hidden="true">✓</span> 선택 근거: {option.rationaleText}
        </p>
      )}
      <div className="option-actions">
        <button type="button" className="btn btn-ghost" aria-pressed={previewing} onClick={onPreview}>
          {previewing ? '다시 보기' : '사용 미리보기'}
        </button>
        <button type="button" className={selected ? 'btn btn-ghost' : 'btn btn-ink'} onClick={onSelect}>
          {selected ? '선택 취소' : '이 안 선택'}
        </button>
      </div>
    </article>
  )
}

export function RequirementPanel({ mission, run, requirement, previewId, onPreview, onSelect, onOpenCompare, onBack }: Props) {
  const selectedId = run.plan.selections[requirement.id]
  const seen = run.previewed[requirement.id] ?? []
  const headingRef = useRef<HTMLHeadingElement>(null)

  // 시설을 열면 패널 제목으로 초점을 옮겨, 키보드·화면낭독기 사용자가 바로 이어 읽게 한다.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [requirement.id])

  return (
    <div className="panel-body">
      <button type="button" className="link-button" onClick={onBack}>
        <span aria-hidden="true">←</span> 동네 지도로
      </button>
      <h2 ref={headingRef} tabIndex={-1} className="panel-title">
        {FACILITY_NAMES[requirement.facilityId]}의 요청
      </h2>
      <blockquote className="need-quote">
        <p>“{requirement.needText}”</p>
        <footer>
          {requirement.speaker} · {requirement.deadlineText}
        </footer>
      </blockquote>

      <h3 className="panel-subtitle">꼭 필요한 조건 두 가지</h3>
      <ul className="need-conditions">
        {requirement.requiredFeatures.map((feature) => (
          <li key={feature}>
            <strong>{FEATURE_LABELS[feature].label}</strong>
            <span>{FEATURE_LABELS[feature].need}</span>
          </li>
        ))}
      </ul>
      {requirement.followUp && (
        <p className="notice notice-info">
          <span aria-hidden="true">＋</span> 처음 써 보는 도구라서 ‘{requirement.followUp.label}’ 한 칸과 {requirement.followUp.cost}점이 처음부터 예약돼
          있어요. {slotLabel(requirement.followUp.deadline)}까지 마쳐야 해요.
        </p>
      )}

      <div className="panel-row">
        <h3 className="panel-subtitle">공급안 {requirement.optionIds.length}가지</h3>
        <button type="button" className="btn btn-ghost btn-small" onClick={onOpenCompare}>
          나란히 비교표
        </button>
      </div>
      <p className="panel-hint">사용 미리보기를 열면 무대에서 쓰이는 모습과 조건 충족 여부를 볼 수 있어요. 고른 뒤에도 언제든 바꿀 수 있어요.</p>

      <div className="option-list">
        {requirement.optionIds.map((optionId) => {
          const option = mission.options[optionId]
          const selected = selectedId === optionId
          return (
            <OptionCard
              key={optionId}
              requirement={requirement}
              option={option}
              revealed={selected || seen.includes(optionId) || Boolean(run.compareOpened[requirement.id])}
              selected={selected}
              previewing={previewId === optionId}
              onPreview={() => onPreview(optionId)}
              onSelect={() => onSelect(selected ? null : optionId)}
            />
          )
        })}
      </div>
    </div>
  )
}

/** 같은 기준으로 세 안을 나란히 보는 표. 여는 동작이 비교 기록으로 남는다. */
export function CompareDialog({ mission, requirement, onClose }: { mission: Mission; requirement: Requirement; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const options = requirement.optionIds.map((id) => mission.options[id])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      className="dialog dialog-wide"
      aria-labelledby="compare-title"
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
          <h2 id="compare-title">{FACILITY_NAMES[requirement.facilityId]} · 같은 기준으로 나란히 비교</h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} autoFocus>
            닫기
          </button>
        </div>
        <div className="table-scroll">
          <table className="compare-table">
            <thead>
              <tr>
                <th scope="col">기준</th>
                {options.map((option) => (
                  <th key={option.id} scope="col">
                    {option.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requirement.requiredFeatures.map((feature) => (
                <tr key={feature}>
                  <th scope="row">필수 · {FEATURE_LABELS[feature].label}</th>
                  {options.map((option) => {
                    const met = option.features.includes(feature)
                    return (
                      <td key={option.id} className={met ? 'is-met' : 'is-unmet'}>
                        <strong>
                          <span aria-hidden="true">{met ? '✓' : '✕'}</span> {met ? '충족' : '불충족'}
                        </strong>
                        <span>{option.featureNotes[feature]}</span>
                      </td>
                    )
                  })}
                </tr>
              ))}
              <tr>
                <th scope="row">비용</th>
                {options.map((option) => (
                  <td key={option.id}>{option.cost}점</td>
                ))}
              </tr>
              <tr>
                <th scope="row">도착</th>
                {options.map((option) => (
                  <td key={option.id}>{slotLabel(option.readySlot)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">설치</th>
                {options.map((option) => (
                  <td key={option.id}>{option.duration}칸</td>
                ))}
              </tr>
              <tr>
                <th scope="row">쓰임과 장단점</th>
                {options.map((option) => (
                  <td key={option.id}>{option.tradeoffText}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="fine-print">비용은 게임 예산점, 일정은 준비 과정을 단순화한 가상 시간이에요. 실제 가격·규격·인증이 아닙니다.</p>
      </div>
    </dialog>
  )
}
