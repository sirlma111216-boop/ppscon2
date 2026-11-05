// 전용 그림이 없는 제시안(고정형 테이블·책상, 음성 전용 장치 등)을 위한 범용 종이 조각 그림.
// 그림 팔레트(감색·청록·감빛 주황·겨자·종이색)만 쓴다.
import type { GenericKind } from '../assets/scenes'

const INK = '#243747'
const TEAL = '#286C70'
const PERSIMMON = '#C65C3B'
const MUSTARD = '#D6A442'
const PAPER = '#F1E4C9'

export function GenericProp({ kind }: { kind: GenericKind }) {
  switch (kind) {
    case 'fixedTable':
      return (
        <svg viewBox="0 0 200 110" aria-hidden="true">
          <path d="M12 30 L60 8 L192 16 L150 42 Z" fill={PERSIMMON} transform="translate(3 3)" />
          <path d="M12 30 L60 8 L192 16 L150 42 Z" fill={PAPER} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M12 30 L150 42 L150 104 L12 92 Z" fill={INK} />
          <path d="M150 42 L192 16 L192 78 L150 104 Z" fill={TEAL} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
        </svg>
      )
    case 'fixedDesk':
      return (
        <svg viewBox="0 0 120 110" aria-hidden="true">
          <path d="M8 22 L40 8 L114 12 L84 28 Z" fill={MUSTARD} transform="translate(2 3)" />
          <path d="M8 22 L40 8 L114 12 L84 28 Z" fill={PAPER} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M14 26 L14 104 M80 30 L80 104 M108 16 L108 86" stroke={INK} strokeWidth="9" strokeLinecap="square" />
          <path d="M14 70 L80 76" stroke={TEAL} strokeWidth="7" />
        </svg>
      )
    case 'voicePost':
      return (
        <svg viewBox="0 0 90 150" aria-hidden="true">
          <rect x="18" y="8" width="54" height="74" rx="8" fill={PERSIMMON} transform="translate(3 3)" />
          <rect x="18" y="8" width="54" height="74" rx="8" fill={PAPER} stroke={INK} strokeWidth="4" />
          <circle cx="45" cy="38" r="15" fill={INK} />
          <circle cx="45" cy="38" r="6" fill={MUSTARD} />
          <circle cx="45" cy="68" r="5" fill={TEAL} />
          <rect x="36" y="82" width="18" height="52" fill={INK} />
          <rect x="16" y="132" width="58" height="14" rx="3" fill={PAPER} stroke={INK} strokeWidth="4" />
        </svg>
      )
    case 'fixedSign':
      return (
        <svg viewBox="0 0 120 190" aria-hidden="true">
          <rect x="10" y="8" width="100" height="78" rx="6" fill={PERSIMMON} transform="translate(3 3)" />
          <rect x="10" y="8" width="100" height="78" rx="6" fill={PAPER} stroke={INK} strokeWidth="5" />
          <path d="M30 47 H70 V34 L92 47 L70 60 V47" fill={MUSTARD} stroke={MUSTARD} strokeWidth="6" strokeLinejoin="round" />
          <rect x="52" y="86" width="16" height="84" fill={INK} />
          <path d="M22 186 L42 164 H78 L98 186 Z" fill={TEAL} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </svg>
      )
    case 'ornament':
      return (
        <svg viewBox="0 0 150 200" aria-hidden="true">
          <circle cx="75" cy="52" r="38" fill="none" stroke={PERSIMMON} strokeWidth="12" transform="translate(4 3)" />
          <circle cx="75" cy="52" r="38" fill="none" stroke={MUSTARD} strokeWidth="12" />
          <path d="M40 150 L75 92 L110 150 Z" fill={TEAL} stroke={INK} strokeWidth="5" strokeLinejoin="round" />
          <rect x="69" y="88" width="12" height="80" fill={INK} />
          <rect x="34" y="166" width="82" height="24" rx="4" fill={PAPER} stroke={INK} strokeWidth="5" />
        </svg>
      )
    case 'papers':
      return (
        <svg viewBox="0 0 90 26" aria-hidden="true">
          <path d="M4 18 L22 6 L44 9 L26 22 Z" fill={PAPER} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M36 20 L52 8 L74 12 L58 24 Z" fill={MUSTARD} stroke={INK} strokeWidth="2" strokeLinejoin="round" />
          <path d="M66 10 L86 4" stroke={PERSIMMON} strokeWidth="4" strokeLinecap="round" />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="54" cy="52" r="34" fill={PERSIMMON} opacity="0.55" />
          <circle cx="50" cy="50" r="34" fill={MUSTARD} />
        </svg>
      )
    case 'box':
      return (
        <svg viewBox="0 0 100 90" aria-hidden="true">
          <path d="M10 30 L50 14 L90 30 L50 46 Z" fill={PAPER} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M10 30 L50 46 V84 L10 68 Z" fill={MUSTARD} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M90 30 L50 46 V84 L90 68 Z" fill={PERSIMMON} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
        </svg>
      )
  }
}
