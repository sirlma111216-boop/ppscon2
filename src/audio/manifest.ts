// 오디오 매니페스트에서 '지금 실제로 불러도 되는 음원'만 골라낸다.
// 파일이 준비되지 않은 항목은 어떤 요청도 만들지 않는다.

export type AudioKind = 'music' | 'sfx' | 'ambience'

export type LoadableAudio = {
  id: string
  kind: AudioKind
  url: string
  loop: boolean
}

export type AudioStatus = {
  total: number
  loadable: LoadableAudio[]
  /** 아직 연결되지 않은 항목의 ID */
  missing: string[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 재생 조건(매니페스트의 runtime_policy와 같다)
 * 1. runtime_policy.allow_audio_fetch_for_current_manifest === true
 * 2. 항목의 exists === true
 * 3. 항목의 status === runtime_policy.required_status_before_future_load ('verified')
 */
export function readAudioManifest(manifest: unknown): AudioStatus {
  const status: AudioStatus = { total: 0, loadable: [], missing: [] }
  if (!isRecord(manifest) || !Array.isArray(manifest.assets)) return status
  const policy = isRecord(manifest.runtime_policy) ? manifest.runtime_policy : {}
  const fetchAllowed = policy.allow_audio_fetch_for_current_manifest === true
  const requiredStatus =
    typeof policy.required_status_before_future_load === 'string' ? policy.required_status_before_future_load : 'verified'

  for (const asset of manifest.assets) {
    if (!isRecord(asset) || typeof asset.id !== 'string') continue
    status.total += 1
    const kind = asset.type
    const url = asset.runtime_url
    const ready =
      fetchAllowed &&
      asset.exists === true &&
      asset.status === requiredStatus &&
      typeof url === 'string' &&
      url.startsWith('/assets/audio/') &&
      (kind === 'music' || kind === 'sfx' || kind === 'ambience')
    if (ready) status.loadable.push({ id: asset.id, kind: kind as AudioKind, url: url as string, loop: asset.loop === true })
    else status.missing.push(asset.id)
  }
  return status
}
