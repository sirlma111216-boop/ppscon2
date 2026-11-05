import type { CSSProperties } from 'react'

const paths: Record<string, string> = {
  sun: 'M12 3v1m0 16v1M3 12h1m16 0h1M5.6 5.6l.8.8m11.2 11.2.8.8M5.6 18.4l.8-.8M17.6 6.4l.8-.8M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  leaf: 'M19 4C7 3 3 10 7 16s13 0 12-12ZM5 20l10-11',
  arrow: 'm9 5 7 7-7 7',
  play: 'm8 4 12 8-12 8V4Z',
  pause: 'M8 5v14M16 5v14',
  close: 'm6 6 12 12M6 18 18 6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12 4 4L19 6',
  box: 'm3 7 9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10M7 5l10 4',
  coin: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M15 8H9v4h6v4H9M12 6v12',
  people: 'M10 8a3 3 0 1 1-6 0 3 3 0 0 1 6 0M1 20v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6m0 3a5 5 0 0 1 6 5',
  trophy: 'M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 15v5m-4 1h8',
  home: 'm3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7',
  calendar: 'M4 5h16v16H4V5Zm4-3v6m8-6v6M4 10h16m-12 4h2m4 0h2m-8 3h2',
  brush: 'm13 13 7-10-2-1-9 9m0 0c-7-1-1 9-7 9 7 3 11-3 7-9Z',
  sport: 'M15 4a2 2 0 1 1-4 0 2 2 0 0 1 4 0M5 10l7-2 5 4 4-1M12 8l-2 7-5 6m5-6 6 1 1 5',
  music: 'M9 17V5l11-2v12M9 8l11-2M9 17c0 4-6 5-6 2s6-5 6-2Zm11-2c0 4-6 5-6 2s6-5 6-2Z',
  screen: 'M3 4h18v13H3V4Zm9 13v4m-5 0h10',
  chat: 'M4 4h16v12H9l-5 4V4Zm4 5h8m-8 3h5',
  chair: 'M6 3h12v10H6V3ZM4 13h16v4H4v-4Zm2 4v4m12-4v4',
  bolt: 'm13 2-9 12h7l-1 8 10-13h-8l1-7Z',
  tools: 'm14 5 4 4 3-3c1 6-4 9-8 6l-8 8-3-3 8-8c-3-4 0-9 6-8l-2 4Z',
  heart: 'M12 20S2 14 2 8c0-6 8-6 10-1 2-5 10-5 10 1 0 6-10 12-10 12Z',
  volume: 'M3 9h4l5-5v16l-5-5H3V9Zm13-1a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mute: 'M3 9h4l5-5v16l-5-5H3V9Zm13 0 6 6m-6 0 6-6',
  help: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M9 9c0-4 7-3 5 0l-2 2v3m0 3h.01',
  reset: 'M3 10a9 9 0 1 1 1 8M3 3v7h7',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4M12 14v3',
  sparkle: 'm12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z',
  flag: 'M5 22V3c5-4 9 4 15 0v11c-6 4-10-4-15 0',
}
export default function Icon({ name, size = 20, style }: { name: string; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name] || paths.box} /></svg>
}
