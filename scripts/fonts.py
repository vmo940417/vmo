"""한글이 지원되는 폰트 파일 경로를 찾는다 (여러 배포판/설치 상태에 대응)."""
import os

import config

_BOLD_CANDIDATES = [
    config.FONT_PATH_KR,
    "/usr/share/fonts/truetype/nanum/NanumGothicBold.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    "/usr/share/fonts/truetype/noto-cjk/NotoSansCJK-Bold.ttc",
]

_REGULAR_CANDIDATES = [
    config.FONT_PATH_KR_REGULAR,
    "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
    "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
    "/usr/share/fonts/truetype/noto-cjk/NotoSansCJK-Regular.ttc",
]


def _first_existing(candidates):
    for path in candidates:
        if path and os.path.exists(path):
            return path
    raise FileNotFoundError(
        "한글 폰트를 찾을 수 없습니다. GitHub Actions에서는 `apt-get install -y fonts-nanum` "
        "을 워크플로우에 추가하거나, 로컬에서는 나눔고딕 폰트를 설치해주세요. "
        f"확인한 경로: {candidates}"
    )


def bold_font_path() -> str:
    return _first_existing(_BOLD_CANDIDATES)


def regular_font_path() -> str:
    return _first_existing(_REGULAR_CANDIDATES)
