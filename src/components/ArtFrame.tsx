// 전체 화면 그림 위의 빈 종이 영역에 실제 DOM 글과 버튼을 얹는다.
// 그림은 3:2 비율을 지켜 잘리지 않으며, 좁은 화면에서는 글이 그림 아래로 내려간다.
import type { CSSProperties, ReactNode } from 'react'

type Props = {
  src: string
  /** 글을 얹을 영역: [왼쪽, 위, 너비, 높이] (그림 크기에 대한 비율) */
  region: [number, number, number, number]
  tone?: 'ink' | 'light'
  className?: string
  children: ReactNode
  /** 그림 위에 겹치는 추가 요소 */
  overlay?: ReactNode
}

export function ArtFrame({ src, region, tone = 'ink', className, children, overlay }: Props) {
  const style = {
    '--region-left': `${region[0] * 100}%`,
    '--region-top': `${region[1] * 100}%`,
    '--region-width': `${region[2] * 100}%`,
    '--region-height': `${region[3] * 100}%`,
  } as CSSProperties
  return (
    <div className={`art-frame tone-${tone}${className ? ` ${className}` : ''}`} style={style}>
      <img className="art-image" src={src} alt="" width={1536} height={1024} draggable={false} />
      {overlay}
      <div className="art-region">{children}</div>
    </div>
  )
}
