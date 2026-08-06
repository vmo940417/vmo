"""환경 설정 로딩.

.env 를 읽는 곳은 여기 한 군데뿐이다. main.py 와 cli.py 양쪽에서 import 하므로
서버로 띄우든 터미널에서 쓰든 동일하게 키가 적용된다.
"""

from __future__ import annotations

import os
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent   # app/
ENV_PATH = APP_DIR / ".env"

_loaded = False


def load_env() -> None:
    """app/.env 를 환경변수로 올린다. 이미 설정된 값은 덮어쓰지 않는다."""
    global _loaded
    if _loaded:
        return
    _loaded = True

    if not ENV_PATH.exists():
        return

    try:
        from dotenv import load_dotenv
        load_dotenv(ENV_PATH, override=False)
        return
    except ImportError:
        pass

    # python-dotenv 가 없어도 동작하도록 최소 파서를 둔다.
    for raw in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def model_name() -> str:
    return os.getenv("STOCKWHY_MODEL", "claude-sonnet-5")


def has_api_key() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def access_token() -> str | None:
    """설정돼 있으면 /api/ 호출에 토큰을 요구한다.

    집 와이파이나 Tailscale 처럼 이미 사설망이면 필요 없다. 하지만 공개 터널로
    열 거라면 반드시 설정해야 한다. URL 을 아는 사람이 곧 내 Claude API
    크레딧을 쓸 수 있는 사람이 되기 때문이다.
    """
    token = os.getenv("STOCKWHY_TOKEN", "").strip()
    return token or None
