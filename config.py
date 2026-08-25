"""
채널 전역 설정. 주제/스타일/스케줄과 관련된 값은 모두 이 파일에서 관리한다.
환경변수로 오버라이드 가능한 값은 os.environ.get(...) 으로 읽는다.
"""
import os

# ── 채널/콘텐츠 ───────────────────────────────────────────────
CHANNEL_TOPIC = "아침을 여는 활력 명언 쇼츠"
TIMEZONE = "Asia/Seoul"

# 단일 주제 채널이라 카테고리는 하나뿐이지만, generate_script.py/background.py 등이
# "카테고리" 개념으로 색상·프롬프트를 다루므로 리스트 형태를 그대로 유지한다.
CATEGORIES = [
    "아침 활력 명언",
]

# 카테고리별 배경 그라디언트 컬러 (hex, [top, bottom]). 활기찬 아침 느낌의 선셋/선라이즈 톤.
CATEGORY_COLORS = {
    "아침 활력 명언": ("#ff5f6d", "#ffc371"),
}

# ── 영상 스타일 ───────────────────────────────────────────────
VIDEO_WIDTH = 1080
VIDEO_HEIGHT = 1920
VIDEO_FPS = 30
MAX_DURATION_SEC = 12  # 목표 10초 내외 쇼츠 (여유를 살짝 둔 상한)

FONT_PATH_KR = os.environ.get(
    "FONT_PATH_KR", "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf"
)
FONT_PATH_KR_REGULAR = os.environ.get(
    "FONT_PATH_KR_REGULAR", "/usr/share/fonts/truetype/nanum/NanumGothic.ttf"
)

# ── TTS ───────────────────────────────────────────────────────
# edge-tts(무료)에는 한국어 "아역/아기" 전용 목소리가 따로 없어서, 기본 성인 여성 목소리의
# 피치를 올리고 속도를 살짝 높여 다섯 살 아이처럼 귀엽고 통통 튀는 톤을 흉내낸다.
# 더 또렷하게/차분하게 하고 싶으면 TTS_PITCH를 낮추거나 TTS_RATE를 "+0%"에 가깝게 조정하면 된다.
TTS_VOICE = os.environ.get("TTS_VOICE", "ko-KR-SunHiNeural")
TTS_RATE = os.environ.get("TTS_RATE", "+15%")
TTS_PITCH = os.environ.get("TTS_PITCH", "+45Hz")

# ── LLM 대본 생성 ─────────────────────────────────────────────
ANTHROPIC_MODEL = os.environ.get("ANTHROPIC_MODEL", "claude-sonnet-5")

# ── YouTube 업로드 ────────────────────────────────────────────
YOUTUBE_CATEGORY_ID = "22"  # People & Blogs (동기부여/자기계발 계열 콘텐츠에 흔히 사용)
DEFAULT_TAGS = ["shorts", "명언", "동기부여", "아침명언", "오늘의명언", "좋은글귀", "힘내자"]
MADE_FOR_KIDS = False

# 업로드 시점 대비 실제 공개(publish) 목표 시각 (해당 시간대 로컬 기준, HH:MM)
PUBLISH_TIME_LOCAL = os.environ.get("PUBLISH_TIME_LOCAL", "03:00")

# ── 경로 ──────────────────────────────────────────────────────
OUTPUT_DIR = os.environ.get("OUTPUT_DIR", "output")
STATE_DIR = os.environ.get("STATE_DIR", "state")
STATE_FILE = os.path.join(STATE_DIR, "history.json")
TOPICS_POOL_FILE = os.path.join("scripts", "topics_pool.json")
