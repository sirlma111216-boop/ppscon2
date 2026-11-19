# 효과음 앞 공백 조사와 재제작 프롬프트

조사: 2026-11-19. 대상: `public/center/audio/sfx_*.wav` 16개(모두 48kHz·16비트·스테레오).
파일을 10ms 단위 음량 곡선으로 분석했다. **소리 시작**은 그 파일에서 가장 큰 순간보다 20dB 작은 수준에 처음 닿는 시점이다. 귀로 들은 것이 아니라 파형을 계산한 결과이며, 원본 파일은 고치지 않았다.

## 조사 결과

| 효과음 | 쓰이는 곳 | 길이 | 소리 시작 | 판정 |
|---|---|---:|---:|---|
| `schedule_place` | 클래스 편성 | 5.00초 | **3.74초** | 다시 만들기. 앞 3.7초가 거의 무음이고 본 소리는 1초 남짓 |
| `tender_contract` | 시설 계약 체결 | 2.00초 | **0.99초** | 다시 만들기 |
| `season_open` | 계절 시작 | 1.48초 | **0.89초** | 다시 만들기. 0초에 아주 작은 소리가 난 뒤 0.9초까지 비어 있음 |
| `event_positive` | 좋은 소식 | 2.00초 | **0.79초** | 다시 만들기 |
| `install_complete` | 설치·완공 | 1.28초 | **0.73초** | 다시 만들기. 0초에 아주 작은 소리가 난 뒤 0.7초까지 비어 있음 |
| `event_comic` | 엉뚱한 소식 | 1.20초 | **0.66초** | 다시 만들기 |
| `event_negative` | 아쉬운 소식 | 1.48초 | **0.57초** | 다시 만들기 |
| `save_complete` | 저장·명예의 전당 기록 | 0.61초 | **0.34초** | 다시 만들기 |
| `rental_approve` | 대관 승인 | 0.49초 | **0.28초** | 다시 만들기. 누를 때마다 나서 늦는 것이 가장 잘 느껴짐 |
| `settlement` | 계절 결산 | 1.20초 | 0.12초 | 다시 만들기 권장. 작게 시작해 0.3초에야 제 음량이 됨 |
| `schedule_remove` | 편성·승인 취소 | 0.49초 | 0.04초 | 양호 |
| `ui_click` | 일반 클릭 | 0.49초 | 0.01초 | 양호(뒤 0.3초는 무음이라 잘라도 됨) |
| `room_enter` | 방 이동 | 0.61초 | 0.00초 | 양호 |
| `notice` | 주의·오류 | 0.49초 | 0.00초 | 양호 |
| `procurement_order` | 납품요구 | 0.81초 | 0.00초 | 양호(도장 소리 뒤 0.6초에 확인음이 한 번 더 남) |
| `award_reveal` | 수상 발표 | 3.00초 | 0.00초 | 양호 |

눌렀을 때 늦게 들리던 것은 주로 **클래스 편성(3.7초 뒤)과 대관 승인(0.3초 뒤)**이다.

## 적용한 조치: 앞 공백을 잘라 낸 사본 사용

위 10개는 **앞 공백을 잘라 낸 파일**로 바꿔 게임이 그 파일을 재생한다. 처음에는 사본을 `public/center/audio-trimmed/`에 따로 두고 전달받은 원본을 함께 보관했으나, 2026-11-19 정리에서 사본을 `public/center/audio/`로 옮겨 원본을 대체했다(원본은 커밋 3856f4d에 남아 있다).
잘라 내기는 `scripts/trim-sfx.cjs`가 한다(재인코딩 없이 구간만 복사, 시작 3ms·끝 12ms 페이드). 구간과 원본 해시는 [SFX_TRIMMED.json](SFX_TRIMMED.json)에 있다.
따라서 **지연 때문에 다시 만들 필요는 없다.** 아래 프롬프트는 소리 자체를 바꾸고 싶을 때만 쓴다.

- `rental_approve` 사본은 본 소리 0.1초 앞의 작은 예비음을, `season_open` 사본은 앞쪽의 약한 바람 소리를 포함하지 않는다. 원래대로 듣고 싶으면 사본 구간을 넓히면 된다.
- 새로 만든 파일을 넣을 때는 `node scripts/trim-sfx.cjs --force <받은 파일>`을 실행한다. 앞 공백이 60ms 이상이면 잘라서, 아니면 그대로 `public/center/audio/`에 넣는다. 코드에서 고칠 목록은 없다.

## 다시 만들 때 공통 조건

모든 프롬프트 끝에 아래 문장을 붙인다.

```
The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.
```

받은 뒤에는 편집기에서 **맨 앞 무음을 0.01초 이내로 자르고**, 끝은 짧게 페이드아웃한다. 파일 형식과 이름은 그대로(48kHz·16비트 WAV, `sfx_<이름>.wav`) 둔다.
생성 도구가 지정한 길이를 채우려고 앞뒤에 공백을 넣는 일이 잦으니, 길이는 아래 목표값보다 길게 요청하지 않는다.

## 재제작 프롬프트 (10종)

```
schedule_place | 클래스 편성 | 0.5초 | 한 번 재생
A satisfying soft wooden tile set down into place followed at once by one warm short marimba note. Tactile, tidy, played many times in a row without fatigue. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

rental_approve | 대관 승인 | 0.4초 | 한 번 재생
One crisp rubber stamp pressed on paper with a small bright wooden tick on top. Decisive and neat, very short. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

save_complete | 저장·기록 완료 | 0.5초 | 한 번 재생
A soft pencil check stroke followed immediately by a single gentle glass bell note. Reassuring and light. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

settlement | 계절 결산 | 1.0초 | 한 번 재생
Three clean ascending piano notes resolving into a soft chord, the first note struck firmly at full level. Measured satisfaction. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

tender_contract | 시설 계약 체결 | 0.9초 | 한 번 재생
One firm rubber stamp on thick paper struck immediately, then a brief fountain pen flourish and a restrained low wooden chime. Refined office sound, confident. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

install_complete | 설치·완공 | 0.9초 | 한 번 재생
Two quick small tool clicks at once followed by a gentle ascending two-note chime. No drilling, no motor noise. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

season_open | 계절 시작 | 1.2초 | 한 번 재생
Three warm bell notes starting immediately, with a soft airy sweep underneath them rather than before them. Fresh beginning, no ambience tail. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

event_positive | 좋은 소식 | 1.0초 | 한 번 재생
A playful three-note clarinet and bell flourish that starts on the first note with no lead-in. Warm modest delight. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

event_negative | 아쉬운 소식 | 0.9초 | 한 번 재생
A brief gentle descending woodwind phrase that starts on the first note with no lead-in. Mildly concerned, no horror or alarm. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.

event_comic | 엉뚱한 소식 | 0.9초 | 한 번 재생
A quick comic slide whistle upward ending in a soft woodblock bonk, starting immediately. Light slapstick, friendly, not mocking. The sound must begin at the very first instant of the file with no silence, no breath, no room tone and no fade-in before it. Immediate attack. Isolated game UI sound effect, clean background, no speech, no music bed, no reverb tail beyond the specified duration.
```

## 받은 파일 확인 방법

같은 계산을 다시 돌려 ‘소리 시작’이 0.03초 이내인지 본다.

```sh
node scripts/sfx-onset.cjs public/center/audio
```

표의 ‘-20dB at’ 열이 소리 시작(밀리초)이다.
