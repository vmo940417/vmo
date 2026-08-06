"""환경 설정 로딩.

.env 를 읽는 곳은 여기 한 군데뿐이다. main.py 와 cli.py 양쪽에서 import 하므로
서버로 띄우든 터미널에서 쓰든 동일하게 키가 적용된다.

설정 파일은 두 곳을 본다.

  1. app/.env          — 저장소를 받아서 쓰는 경우
  2. 사용자 설정 폴더  — 데스크톱 앱(.exe)처럼 소스 폴더가 없는 경우

.exe 는 실행할 때마다 임시 폴더에 풀렸다가 지워지므로 그 옆에 저장하면 설정이
매번 날아간다. 그래서 %APPDATA%\\stockwhy 같은 사용자 폴더에 따로 둔다.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

APP_DIR = Path(__file__).resolve().parent.parent   # app/
ENV_PATH = APP_DIR / ".env"

_loaded = False


def frozen() -> bool:
    """PyInstaller 로 묶인 실행 파일로 돌고 있는지."""
    return bool(getattr(sys, "frozen", False))


def user_config_dir() -> Path:
    """OS 관례를 따르는 사용자 설정 폴더."""
    if os.name == "nt":
        base = os.getenv("APPDATA") or (Path.home() / "AppData" / "Roaming")
    else:
        base = os.getenv("XDG_CONFIG_HOME") or (Path.home() / ".config")
    return Path(base) / "stockwhy"


def user_env_path() -> Path:
    return user_config_dir() / ".env"


def _apply(path: Path) -> None:
    """.env 한 개를 환경변수로 올린다. 이미 설정된 값은 덮어쓰지 않는다."""
    if not path.exists():
        return
    try:
        from dotenv import load_dotenv
        load_dotenv(path, override=False)
        return
    except ImportError:
        pass

    # python-dotenv 가 없어도 동작하도록 최소 파서를 둔다.
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key, value = key.strip(), value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


def load_env() -> None:
    """설정 파일을 환경변수로 올린다. 앞서 읽은 값이 우선한다."""
    global _loaded
    if _loaded:
        return
    _loaded = True

    # 사용자 폴더를 먼저 본다 — 데스크톱 앱에서 방금 저장한 값이 이겨야 한다.
    _apply(user_env_path())
    _apply(ENV_PATH)


def save_user_env(values: dict[str, str]) -> Path:
    """설정을 사용자 .env 에 쓴다(빈 값은 지운다). 데스크톱 앱 설정 화면용.

    키는 파일에 평문으로 남는다. 사용자 폴더라 다른 계정에서는 안 보이지만,
    같은 PC 를 여럿이 공유한다면 그건 감안해야 한다.
    """
    path = user_env_path()
    path.parent.mkdir(parents=True, exist_ok=True)

    existing: dict[str, str] = {}
    if path.exists():
        for raw in path.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                existing[k.strip()] = v.strip()

    for key, value in values.items():
        value = (value or "").strip()
        if value:
            existing[key] = value
        else:
            existing.pop(key, None)
        # 이번 실행에도 바로 반영한다(재시작 없이 먹히는 설정들이 있다).
        if value:
            os.environ[key] = value
        else:
            os.environ.pop(key, None)

    body = "\n".join(f"{k}={v}" for k, v in existing.items())
    path.write_text(("# 장중 시세 원인 분석 설정\n" + body + "\n"), encoding="utf-8")
    return path


def model_name() -> str:
    return os.getenv("STOCKWHY_MODEL", "claude-sonnet-5")


def has_api_key() -> bool:
    return bool(os.getenv("ANTHROPIC_API_KEY"))


def ca_bundle() -> str | None:
    """직접 지정한 CA 번들 경로(.pem). truststore 로도 안 될 때의 탈출구."""
    path = os.getenv("STOCKWHY_CA_BUNDLE", "").strip()
    return path or None


def setup_tls() -> str:
    """회사망 TLS 검사 장비(SSL 인스펙션) 대응.

    사내망은 HTTPS 를 중간에서 풀었다가 회사 자체 인증서로 다시 묶어 내보내는
    경우가 많다. 그 루트 인증서는 Windows/macOS 인증서 저장소에는 이미 깔려
    있지만, Python 은 OS 저장소를 안 보고 certifi 번들만 봐서 모르는 인증서라며
    거부한다. truststore 를 끼우면 Python 이 OS 저장소를 쓰게 되어 해결된다.

    인증서 검증을 끄는 선택지는 두지 않는다. 사내망에서 그건 실제 보안 저하다.

    반환값은 실제로 적용된 방식(진단 출력용).
    """
    if ca_bundle():
        return f"CA 번들 지정: {ca_bundle()}"

    if os.getenv("STOCKWHY_TLS", "").strip().lower() == "certifi":
        return "certifi (STOCKWHY_TLS=certifi)"

    try:
        import truststore
    except ImportError:
        return "certifi (truststore 미설치)"

    try:
        truststore.inject_into_ssl()
        return "OS 인증서 저장소 (truststore)"
    except Exception as e:  # noqa: BLE001
        return f"certifi (truststore 적용 실패: {type(e).__name__})"


def access_token() -> str | None:
    """설정돼 있으면 /api/ 호출에 토큰을 요구한다.

    집 와이파이나 Tailscale 처럼 이미 사설망이면 필요 없다. 하지만 공개 터널로
    열 거라면 반드시 설정해야 한다. URL 을 아는 사람이 곧 내 Claude API
    크레딧을 쓸 수 있는 사람이 되기 때문이다.
    """
    token = os.getenv("STOCKWHY_TOKEN", "").strip()
    return token or None
