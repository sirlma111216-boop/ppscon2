export default function ConditionBadge({ value, label = '관리' }: { value: number; label?: string }) {
  const level = value < 20 ? 'danger' : value < 40 ? 'warning' : value < 60 ? 'caution' : 'normal'
  const note = { danger: '긴급 정비', warning: '정비 필요', caution: '주의', normal: '' }[level]
  return <span className={'condition-badge condition-' + level}>{label} {Math.round(value)}{note && <b> · {note}</b>}</span>
}
