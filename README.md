# vmo — 아침 활력 명언 쇼츠 자동 생성 & 매일 업로드

"하루를 활기차게 시작하는 명언" 주제로 매일 새로운 유튜브 쇼츠(세로, **20초 내외**)를
자동으로 만들고, **매일 03:00(KST)**에 자동으로 채널에 공개하는 파이프라인입니다.
GitHub Actions 스케줄 워크플로우로 돌아가므로 별도의 서버가 필요 없습니다.

## 파이프라인 구성

```
대본 생성 → 음성 합성(TTS) → 배경/자막 합성(ffmpeg) → 썸네일 생성 → 유튜브 업로드(예약 공개)
```

| 단계 | 스크립트 | 사용 기술 |
|---|---|---|
| 대본 생성 | `scripts/generate_script.py` | Claude API (`ANTHROPIC_API_KEY` 있을 때), 없으면 `scripts/topics_pool.json` 폴백 |
| 음성 합성 | `scripts/tts.py` | [edge-tts](https://github.com/rany2/edge-tts) (무료, API 키 불필요) |
| 영상 합성 | `scripts/build_video.py` | 배경(AI 생성 또는 PIL 그라디언트) + ffmpeg 줌인 + 배경음악 + 자막(.ass) 번인 |
| 배경 이미지 | `scripts/ai_background.py` | Replicate API로 애니메 풍경 이미지 생성 (`REPLICATE_API_TOKEN` 있을 때), 없으면 `background.py`의 그라디언트로 대체 |
| 배경음악 | `scripts/bgm.py` | `assets/bgm/`에 넣어둔 실제 음원(유튜브 오디오 보관함 등 무료/저작권 프리)을 영상 길이에 맞춰 자르고 loudnorm으로 크기를 맞춰 믹싱 |
| 썸네일 | `scripts/thumbnail.py` | PIL |
| 업로드 | `scripts/upload_youtube.py` | YouTube Data API v3 (OAuth refresh token) |
| 오케스트레이션 | `scripts/run_daily.py` | 위 단계를 순서대로 실행 |

폰트는 오픈소스(나눔글꼴)를 쓰고, 배경은 기본적으로 코드로 직접 생성해서 스톡 영상/이미지
라이선스 문제가 없습니다. `REPLICATE_API_TOKEN`을 등록하면 매일 새로운 애니메 풍경 이미지를
AI로 생성해 배경으로 쓰도록 확장할 수도 있습니다 (아래 1-4 참고, 캐릭터 없이 풍경만 생성해
특정 저작권 캐릭터를 닮은 이미지가 나올 위험을 피했습니다).

## 1. 처음 설정하기

### 1-1. YouTube Data API 사용 설정

1. [Google Cloud Console](https://console.cloud.google.com)에서 새 프로젝트 생성
2. "API 및 서비스 → 라이브러리"에서 **YouTube Data API v3** 사용 설정
3. "OAuth 동의 화면" 구성 (User Type: 외부/테스트 모드로 충분, 업로드할 유튜브 계정을 테스트 사용자로 추가)
4. "사용자 인증 정보 → OAuth 클라이언트 ID 만들기" → 애플리케이션 유형 **데스크톱 앱** 선택 후 생성
5. 발급된 **클라이언트 ID / 클라이언트 보안 비밀**을 기록해둔다

### 1-2. Refresh Token 발급 (최초 1회, 로컬 PC에서)

```bash
pip install google-auth-oauthlib
YOUTUBE_CLIENT_ID=xxx YOUTUBE_CLIENT_SECRET=yyy python3 scripts/get_refresh_token.py
```

브라우저가 열리면 **영상을 업로드할 유튜브 채널 계정**으로 로그인 후 동의합니다.
터미널에 출력되는 `refresh_token` 값을 기록해둡니다.

### 1-3. GitHub Secrets 등록

저장소 **Settings → Secrets and variables → Actions → New repository secret**에서 아래 값을 등록합니다.

| Secret 이름 | 값 | 필수 |
|---|---|---|
| `YOUTUBE_CLIENT_ID` | 1-1에서 발급받은 클라이언트 ID | ✅ |
| `YOUTUBE_CLIENT_SECRET` | 1-1에서 발급받은 클라이언트 보안 비밀 | ✅ |
| `YOUTUBE_REFRESH_TOKEN` | 1-2에서 발급받은 refresh token | ✅ |
| `ANTHROPIC_API_KEY` | Claude API 키 (매일 새로운 대본을 LLM으로 생성하고 싶다면) | 선택 (없으면 `topics_pool.json` 폴백 사용) |
| `REPLICATE_API_TOKEN` | Replicate API 토큰 (매일 새로운 애니메 배경 이미지를 AI로 생성하고 싶다면) | 선택 (없으면 그라디언트 배경 사용) |

### 1-4. (선택) AI 배경 이미지 설정 — Replicate

배경을 매일 새로운 애니메 풍경 이미지로 만들고 싶다면:

1. https://replicate.com 가입 후 결제 수단 등록 (사용한 만큼만 청구되는 종량제)
2. **Account → API tokens**에서 토큰 발급
3. GitHub Secrets에 `REPLICATE_API_TOKEN`으로 등록 (위 1-3 표 참고)

**비용**: 이미지 1장(기본 모델 `black-forest-labs/flux-schnell` 기준)에 약 $0.003(≈4원). 하루 1장이면
연간 2천원 안팎이라 사실상 부담 없는 수준입니다. 등록만 하면 다음 실행부터 자동으로
AI 배경을 사용하고, 등록하지 않으면 지금처럼 그라디언트 배경을 계속 사용합니다.

캐릭터가 아니라 "아침 분위기의 풍경"만 그리도록 프롬프트를 설계해뒀습니다
(`scripts/ai_background.py`의 `SCENES`/`STYLE_SUFFIX`/`NEGATIVE_PROMPT`). 장면 목록이나
화풍 문구는 자유롭게 수정해도 됩니다. 일시적으로 끄고 싶으면 시크릿을 지우거나,
환경변수 `AI_BACKGROUND_ENABLED=0`을 주면 됩니다.

### 1-5. (선택) 배경음악 추가/끄기/볼륨 조정

`assets/bgm/` 폴더에 오디오 파일(mp3 등)을 넣어두면, `scripts/bgm.py`가 영상 제목을
시드로 삼아 그 중 하나를 순환 선택해서 영상 길이에 맞게 자르거나 반복하고, 내레이션과
믹싱합니다. 폴더가 비어 있으면 배경음악 없이(내레이션+자막만) 자동으로 건너뛰므로
등록하지 않아도 파이프라인은 정상 동작합니다.

음원은 [YouTube Studio](https://studio.youtube.com)의 **오디오 보관함**에서 저작권
걱정 없는 무료 음원(대부분 저작자 표시도 불필요)을 받아 넣는 걸 추천합니다. 자세한
방법은 `assets/bgm/README.md` 참고.

새로 추가한 트랙마다 원본 파일의 크기가 제각각이라도, loudnorm으로 목표 라우드니스에
맞춰 자동 정규화하므로 별도로 볼륨을 재조정할 필요가 없습니다. 끄고 싶거나 크기를
조정하고 싶으면 워크플로우/로컬 실행 시 환경변수로 덮어쓰면 됩니다.

```bash
BGM_ENABLED=0 PYTHONPATH=. DRY_RUN=1 python3 scripts/run_daily.py        # 배경음악 끄기
BGM_TARGET_LUFS=-28 PYTHONPATH=. DRY_RUN=1 python3 scripts/run_daily.py  # 더 작게 (기본값 -25 LUFS)
```

### 1-6. 워크플로우 확인 (매일 03:00 KST 자동 공개)

`.github/workflows/daily-short.yml` 이 매일 **UTC 15:07 (KST 00:07, 다음날)**에
실행되어 영상을 만들고, 유튜브에 `publishAt=03:00 KST`로 예약 업로드합니다. 실제
공개는 유튜브 서버가 그 시각에 정확히 처리하므로, **워크플로우 자체가 정시에
실행될 필요는 없습니다** — 목표 시각(03:00 KST)보다 먼저만 끝나면 됩니다.

**왜 00:07처럼 애매한 시각에 실행하나요?**
GitHub Actions의 `schedule`(cron) 트리거는 정시 실행을 보장하지 않습니다. GitHub
공식 문서에 따르면 트래픽이 몰리는 시간대, 특히 매 시 정각(`:00`)에는 실행이 몇 분에서
길게는 몇 시간까지 지연되거나 아예 건너뛸 수 있습니다 (실제로 2026-08-26 실행에서
예정보다 2시간 지연된 사례가 있었습니다). 이 지연이 목표 공개 시각을 넘겨버리면
`upload_youtube.py`가 "이미 지났다"고 판단해 예약 공개 대신 즉시 공개로 처리해버립니다.
그래서:
- 목표 시각까지 **약 3시간 버퍼**를 두고(00:07 실행 → 03:00 목표) 지연에 대비하고
- 요청이 몰리는 정각(`:00`)을 피해 `:07`에 실행해 지연 자체를 줄입니다

필요하면 `cron` 값이나 `config.py`의 `PUBLISH_TIME_LOCAL`을 수정하세요. 다만
`cron`을 목표 시각과 너무 가깝게 잡으면(예: 1시간 이내) 위와 같은 지연으로 예약
공개가 즉시 공개로 밀릴 수 있으니, **최소 2~3시간 이상 여유**를 두는 것을 권장합니다.

## 2. 테스트하기

### 로컬에서 영상만 생성 (업로드 없이)

```bash
pip install -r requirements.txt
sudo apt-get install -y ffmpeg fonts-nanum   # Debian/Ubuntu 기준
PYTHONPATH=. DRY_RUN=1 python3 scripts/run_daily.py
```

`output/video.mp4` 를 재생해서 확인합니다.

### GitHub Actions에서 수동 실행

저장소 **Actions → 매일 쇼츠 자동 생성 & 업로드 → Run workflow**에서 `dry_run: true`로
실행하면 업로드 없이 아티팩트(영상/썸네일)만 생성해서 다운로드할 수 있습니다.

## 3. 콘텐츠/스타일 커스터마이징

- `config.py`: 카테고리 목록/색상, 영상 해상도, TTS 목소리, 유튜브 업로드 기본 태그·카테고리, 공개 목표 시각 등
- `scripts/topics_pool.json`: LLM 없이도 쓸 수 있는 폴백 대본 풀 (자유롭게 추가/수정 가능)
- `scripts/generate_script.py`의 `SYSTEM_PROMPT`: LLM에게 주는 대본 작성 가이드라인
- `scripts/build_video.py`, `scripts/background.py`, `scripts/thumbnail.py`: 영상/썸네일 비주얼 스타일
- `scripts/ai_background.py`: AI 배경 이미지의 장면 목록/화풍 프롬프트 (1-4 참고)
- `assets/bgm/`: 배경음악 음원 파일 (1-5 참고), `scripts/bgm.py`: 선택/믹싱 로직

### 목소리 톤 조정 (`TTS_VOICE` / `TTS_RATE` / `TTS_PITCH`)

무료 TTS(edge-tts)에는 한국어 "아역/아기" 전용 목소리가 따로 없어서, 기본 성인 여성
목소리(`ko-KR-SunHiNeural`)의 피치를 높이고(`+45Hz`) 속도를 살짝 올려(`+15%`) 다섯 살
아이 같은 통통 튀는 느낌을 흉내내고 있습니다. 완벽한 아역 목소리는 아니니, 더 조정하고
싶다면 `config.py` 값을 바꾸거나 워크플로우/로컬 실행 시 환경변수로 덮어쓰면 됩니다.

```bash
TTS_PITCH="+60Hz" TTS_RATE="+20%" PYTHONPATH=. DRY_RUN=1 python3 scripts/run_daily.py
```

더 또렷하고 차분한 톤으로 되돌리려면 `TTS_PITCH=+0Hz TTS_RATE=+0%`로 설정하세요.
진짜 아역 성우 톤이 꼭 필요하다면, ElevenLabs·Typecast 같은 유료 TTS 서비스의 아역
보이스로 교체하는 방법도 있습니다(이 경우 `scripts/tts.py`를 해당 서비스 API 호출로
바꿔야 합니다).

## 4. 운영상 꼭 알아둘 점 (유튜브 정책 & 저작권)

- **대량 생산/반복 콘텐츠 정책**: 유튜브는 창작적 노력이 거의 없는 대량 자동 생성 콘텐츠를
  파트너 프로그램(수익화) 대상에서 제외할 수 있다고 명시합니다. 완전 자동화라도 대본 품질,
  주제 다양성, 시청자에게 주는 실질적 가치를 신경 쓰는 것이 좋습니다.
- **AI 생성/합성 콘텐츠 공개**: 사실적인 합성 인물/음성 등을 다루는 경우 유튜브 업로드 시
  "변경되었거나 합성된 콘텐츠" 표시가 필요할 수 있습니다. 이 프로젝트는 실존 인물을 다루지
  않지만, 설명란에 AI 활용 사실을 명시해두었습니다(`upload_youtube.py`의 description 참고).
- **저작권**: 배경/폰트는 모두 코드로 직접 생성하거나 오픈소스 폰트(나눔글꼴)를 사용하므로
  별도 라이선스 문제가 없습니다. `topics_pool.json`에 직접 소재를 추가할 때는 사실관계와
  출처를 확인하세요.
- **업로드 쿼터**: YouTube Data API 기본 일일 쿼터는 10,000 units이며, 영상 1회 업로드에
  약 1,600 units가 소요됩니다. 하루 1편 업로드에는 충분하지만, 테스트 업로드를 반복하면
  금방 소진될 수 있으니 주의하세요.
- **커스텀 썸네일**: `thumbnails.set` API는 전화번호 인증이 완료된 채널에서만 동작합니다.
  인증되지 않은 채널이면 영상 업로드는 성공하되 썸네일 설정만 조용히 실패하도록 처리되어
  있습니다(YouTube 스튜디오에서 채널 인증 후 재시도 가능).

## 5. 상태 파일 (`state/history.json`)

최근 업로드한 제목들을 기억해서, LLM에게 "이건 이미 다뤘으니 피해줘"라고 알려주거나
폴백 풀에서 중복 선택을 피하는 데 사용합니다. 워크플로우가 매 실행 후 자동으로 커밋합니다.
