"""표준 라이브러리만 쓰는 경량 웹서버 — 폰(Termux)에서 돌리기 위한 것.

main.py 는 FastAPI + uvicorn 을 쓰는데, 이것들은 pydantic-core 같은 Rust/C 확장을
끌고 온다. 안드로이드에서 그걸 빌드하면 20분 걸리고 자주 실패한다. 그래서 폰에서는
파이썬 내장 http.server 로 같은 화면과 같은 API 를 서빙한다.

의존성은 httpx 하나뿐이고 그것도 순수 파이썬이라 컴파일이 없다.

    python -m server.lite            # 폰에서: http://localhost:8000
    python -m server.lite --port 9000

라우트는 main.py 와 동일하다. 프론트엔드(index.html)는 그대로 재사용한다.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import mimetypes
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from . import usage
from .config import access_token, has_api_key, load_env, model_name, setup_tls
from .pipeline import NotFound, diagnose, render_text

STATIC = Path(__file__).parent / "static"


def _truthy(value: str | None, default: bool = True) -> bool:
    if value is None:
        return default
    return value.strip().lower() not in {"0", "false", "no", "off"}


class Handler(BaseHTTPRequestHandler):
    server_version = "stockwhy-lite"

    # -- 응답 헬퍼 --------------------------------------------------------

    def _send(self, status: int, body: bytes, ctype: str,
              extra: dict[str, str] | None = None) -> None:
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (extra or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _json(self, status: int, payload: dict) -> None:
        self._send(status, json.dumps(payload, ensure_ascii=False).encode("utf-8"),
                   "application/json; charset=utf-8")

    def _text(self, status: int, text: str) -> None:
        self._send(status, text.encode("utf-8"), "text/plain; charset=utf-8")

    def _file(self, path: Path, ctype: str | None = None,
              extra: dict[str, str] | None = None) -> None:
        if not path.is_file():
            self._json(404, {"detail": "not found"})
            return
        guessed = ctype or mimetypes.guess_type(path.name)[0] or "application/octet-stream"
        if guessed.startswith("text/") or guessed.endswith(("javascript", "json")):
            guessed += "; charset=utf-8"
        self._send(200, path.read_bytes(), guessed, extra)

    # -- 인증 -------------------------------------------------------------

    def _authorized(self, params: dict) -> bool:
        """STOCKWHY_TOKEN 이 설정된 경우에만 검사한다(미설정이면 통과)."""
        expected = access_token()
        if expected is None:
            return True
        import hmac
        supplied = self.headers.get("X-Token") or (params.get("t") or [""])[0]
        return hmac.compare_digest(supplied, expected)

    # -- 라우팅 -----------------------------------------------------------

    def do_GET(self) -> None:  # noqa: N802 - http.server 규약
        url = urlparse(self.path)
        route, params = url.path, parse_qs(url.query)

        if route == "/":
            return self._file(STATIC / "index.html", "text/html")
        if route == "/sw.js":
            # 서비스 워커는 스코프가 자기 경로 이하라 루트에서 서빙해야 한다.
            return self._file(STATIC / "sw.js", "application/javascript",
                              {"Cache-Control": "no-cache", "Service-Worker-Allowed": "/"})
        if route == "/manifest.webmanifest":
            return self._file(STATIC / "manifest.webmanifest", "application/manifest+json")
        if route.startswith("/static/"):
            return self._static(route)
        if route == "/api/health":
            return self._json(200, {
                "ok": True, "llm_enabled": has_api_key(), "model": model_name(),
                "auth_required": access_token() is not None, "server": "lite",
            })

        if not self._authorized(params):
            return self._json(401, {"detail": "토큰이 필요합니다."})

        if route == "/api/usage":
            return self._json(200, usage.summarize())
        if route in ("/api/why", "/api/why.txt"):
            return self._why(route, params)

        self._json(404, {"detail": "not found"})

    def _static(self, route: str) -> None:
        target = (STATIC / route[len("/static/"):]).resolve()
        # 경로 탈출 차단: static 밖으로 나가는 요청은 거부한다.
        if not str(target).startswith(str(STATIC.resolve())):
            return self._json(403, {"detail": "forbidden"})
        self._file(target)

    def _why(self, route: str, params: dict) -> None:
        query = (params.get("q") or [""])[0].strip()
        if not query:
            return self._json(422, {"detail": "종목명 또는 코드를 입력하세요."})
        use_llm = _truthy((params.get("llm") or [None])[0])

        try:
            result = asyncio.run(diagnose(query, use_llm=use_llm))
        except NotFound as e:
            return self._json(404, {"detail": str(e)})
        except Exception as e:  # noqa: BLE001
            return self._json(502, {"detail": f"{type(e).__name__}: {e}"})

        if route == "/api/why.txt":
            return self._text(200, render_text(result))
        self._json(200, result)

    def log_message(self, fmt: str, *args) -> None:
        """기본 로그는 요청마다 두 줄씩 찍혀 폰 화면을 덮는다. 한 줄로 줄인다."""
        sys.stderr.write(f"  {self.address_string()} {fmt % args}\n")


def serve(port: int = 8000, host: str = "0.0.0.0") -> int:
    load_env()
    setup_tls()

    tok = access_token()
    suffix = f"/?t={tok}" if tok else ""
    print("장중 시세 원인 분석 (경량 서버)")
    print(f"  주소   http://localhost:{port}{suffix}")
    print(f"  LLM    {'사용 (' + model_name() + ')' if has_api_key() else '미사용 — 규칙 기반'}")
    print(f"  TLS    {setup_tls()}")
    print("  중지: Ctrl+C\n")

    httpd = ThreadingHTTPServer((host, port), Handler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n종료합니다.")
    finally:
        httpd.server_close()
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="장중 시세 원인 분석 (경량 서버)")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="0.0.0.0", help="기본은 모든 인터페이스")
    args = ap.parse_args()
    return serve(args.port, args.host)


if __name__ == "__main__":
    raise SystemExit(main())
