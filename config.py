"""
채널 전역 설정. 주제/스타일/스케줄과 관련된 값은 모두 이 파일에서 관리한다.
환경변수로 오버라이드 가능한 값은 os.environ.get(...) 으로 읽는다.
"""
import os

# ── 채널/콘텐츠 ───────────────────────────────────────────────
CHANNEL_TOPIC = "지식・상식・명언 쇼츠"
TIMEZONE = "Asia/Seoul"

# 날짜(연중 일수)에 따라 매일 하나씩 순환되는 소주제 카테고리.
# generate_script.py 가 오늘의 카테고리를 고르고, LLM 프롬프트/폴백 풀 필터링에 사용한다.
CATEGORIES = [
    "과학 상식",
    "역사 한 조각",
    "심리 상식",
    "명언 한마디",
    "우주 이야기",
    "동물 상식",
    "경제·생활 상식",
    "건강 상식",
    "언어·어원 상식",
    "인체 상식",
]

# 카테고리별 배경 그라디언트 컬러 (hex, [top, bottom])
CATEGORY_COLORS = {
    "과학 상식": ("#0f2027", "#2c5364"),
    "역사 한 조각": ("#3a1c71", "#6a3093"),
    "심리 상식": ("#232526", "#414345"),
    "명언 한마디": ("#141e30", "#243b55"),
    "우주 이야기": ("#000000", "#1b2735"),
    "동물 상식": ("#134e5e", "#71b280"),
    "경제·생활 상식": ("#0f0c29", "#302b63"),
    "건강 상식": ("#093028", "#237a57"),
    "언어·어원 상식": ("#1a2980", "#26d0ce"),
    "인체 상식": ("#4b0082", "#8a2be2"),
}

# ── 영상 스타일 ───────────────────────────────────────────────
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
VIDEO_FPS = 30
MAX_DURATION_SEC = 58  # 쇼츠 판정 기준(60초 이내) 여유를 둔 상한

FONT_PATH_KR = os.environ.get(
    "FONT_PATH_KR", "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
)
FONT_PATH_KR_REGULAR = os.environ.get(
    "FONT_PATH_KR_REGULAR", "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
)

# ── TTS ───────────────────────────────────────────────────────
TTS_VOICE = os.environ.get("TTS_VOICE", "ko-KR-SunHiNeural")
TTS_RATE = os.environ.get("TTS_RATE", "+0%")

# ── LLM 대본 생성 ─────────────────────────────────────────────
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

# ── YouTube 업로드 ────────────────────────────────────────────
YOUTUBE_CATEGORY_ID = "27"  # Education
DEFAULT_TAGS = ["shorts", "지식", "상식", "꿀팁", "명언", "지식상식", "몰랐던사실"]
MADE_FOR_KIDS = False

# 업로드 시점 대비 실제 공개(publish) 목표 시각 (해당 시간대 로컬 기준, HH:MM)
PUBLISH_TIME_LOCAL = os.environ.get("PUBLISH_TIME_LOCAL", "06:00")

# ── 경로 ──────────────────────────────────────────────────────
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "output")
STATE_DIR = os.environ.get("STATE_DIR", "state")
STATE_FILE = os.path.join(STATE_DIR, "history.json")
TOPICS_POOL_FILE = os.path.join("scripts", "topics_pool.json")
