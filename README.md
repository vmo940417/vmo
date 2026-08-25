# vmo — 아침 활력 명언 쇼츠 자동 생성 & 매일 업로드

"하루를 활기차게 시작하는 명언" 주제로 매일 새로운 유튜브 쇼츠(세로, **10초 내외**)를
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
| 영상 합성 | `scripts/build_video.py` | PIL로 생성한 그라디언트 배경 + ffmpeg 줌인 + 자막(.ass) 번인 |
| 썸네일 | `scripts/thumbnail.py` | PIL |
| 업로드 | `scripts/upload_youtube.py` | YouTube Data API v3 (OAuth refresh token) |
| 오케스트레이션 | `scripts/run_daily.py` | 위 단계를 순서대로 실행 |

모든 소재(배경, 폰트)는 코드로 직접 생성하므로 스톡 영상/이미지 라이선스 문제가 없습니다.

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

### 1-4. 워크플로우 확인

`.github/workflows/daily-short.yml` 이 매일 **UTC 17:00 (KST 02:00)**에 실행되어,
03:00 KST를 목표 공개 시각(`publishAt`)으로 예약 업로드합니다. 필요하면
`cron` 값이나 `config.py`의 `PUBLISH_TIME_LOCAL`을 수정하세요.

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
