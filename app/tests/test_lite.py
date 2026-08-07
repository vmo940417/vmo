"""경량 서버(폰용) 테스트.

FastAPI 를 못 쓰는 환경을 위한 서버라, 정작 그 환경에서 처음 돌려보고 깨지면
곤란하다. 그래서 목이 아니라 진짜 소켓을 열고 HTTP 로 때려서 검증한다.
"""

from __future__ import annotations

import sys
import threading
from http.server import ThreadingHTTPServer
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.test_providers import handler as naver_handler  # noqa: E402
from server import lite, pipeline  # noqa: E402
from server.providers.naver import NaverProvider  # noqa: E402

TOKEN = "lite-secret"


@pytest.fixture
def base(monkeypatch, tmp_path):
    """실제 소켓을 열어 서버를 띄우고 base URL 을 준다."""
    monkeypatch.setattr(pipeline, "NaverProvider", lambda *a, **k: NaverProvider(
        client=httpx.AsyncClient(transport=httpx.MockTransport(naver_handler))))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(tmp_path / "u.jsonl"))

    httpd = ThreadingHTTPServer(("127.0.0.1", 0), lite.Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()
    try:
        yield f"http://127.0.0.1:{httpd.server_address[1]}"
    finally:
        httpd.shutdown()
        httpd.server_close()


@pytest.fixture
def unlocked(monkeypatch, base):
    monkeypatch.delenv("STOCKWHY_TOKEN", raising=False)
    return base


@pytest.fixture
def locked(monkeypatch, base):
    monkeypatch.setenv("STOCKWHY_TOKEN", TOKEN)
    return base


def get(url: str, **kw) -> httpx.Response:
    return httpx.get(url, timeout=30, trust_env=False, **kw)


class TestPages:
    def test_index(self, unlocked):
        r = get(f"{unlocked}/")
        assert r.status_code == 200
        assert "장중 시세 원인 분석" in r.text
        assert "text/html" in r.headers["content-type"]

    def test_service_worker_from_root(self, unlocked):
        """스코프가 자기 경로 이하라 /static/sw.js 로는 전체를 못 잡는다."""
        r = get(f"{unlocked}/sw.js")
        assert r.status_code == 200
        assert r.headers.get("Service-Worker-Allowed") == "/"
        assert "no-cache" in r.headers.get("Cache-Control", "")

    def test_manifest(self, unlocked):
        r = get(f"{unlocked}/manifest.webmanifest")
        assert r.status_code == 200
        assert "manifest" in r.headers["content-type"]

    def test_icon_is_png(self, unlocked):
        r = get(f"{unlocked}/static/icons/icon-192.png")
        assert r.status_code == 200
        assert r.content[:8] == b"\x89PNG\r\n\x1a\n"
        assert r.headers["content-type"] == "image/png"

    def test_unknown_route_404(self, unlocked):
        assert get(f"{unlocked}/nope").status_code == 404


class TestPathTraversal:
    @pytest.mark.parametrize("attack", [
        "/static/../config.py",
        "/static/../../server/config.py",
        "/static/%2e%2e/config.py",
    ])
    def test_cannot_escape_static(self, unlocked, attack):
        r = get(f"{unlocked}{attack}")
        assert r.status_code in (403, 404)
        assert "ANTHROPIC_API_KEY" not in r.text


class TestApi:
    def test_health_needs_no_token(self, locked):
        body = get(f"{locked}/api/health").json()
        assert body["ok"] is True
        assert body["server"] == "lite"
        assert body["auth_required"] is True

    def test_why_json(self, unlocked):
        r = get(f"{unlocked}/api/why", params={"q": "005930", "llm": "false"})
        assert r.status_code == 200
        body = r.json()
        assert body["quote"]["name"] == "삼성전자"
        assert body["attribution"]["driver"] in {"MARKET", "SECTOR", "IDIOSYNCRATIC"}

    def test_why_matches_fastapi_shape(self, unlocked):
        """폰과 PC 가 같은 프론트엔드를 쓰므로 응답 모양이 같아야 한다."""
        body = get(f"{unlocked}/api/why", params={"q": "005930", "llm": "false"}).json()
        for key in ("quote", "context", "attribution", "news", "cost",
                    "explanation", "diagnostics", "elapsed_ms", "as_of"):
            assert key in body, f"{key} 가 응답에 없다"

    def test_why_text(self, unlocked):
        r = get(f"{unlocked}/api/why.txt", params={"q": "005930", "llm": "false"})
        assert r.status_code == 200
        assert "[등락률 분해]" in r.text

    def test_missing_query(self, unlocked):
        assert get(f"{unlocked}/api/why").status_code == 422

    def test_unknown_symbol(self, unlocked, monkeypatch):
        monkeypatch.setattr(pipeline, "NaverProvider", lambda *a, **k: NaverProvider(
            client=httpx.AsyncClient(
                transport=httpx.MockTransport(lambda r: httpx.Response(200, json={})))))
        assert get(f"{unlocked}/api/why", params={"q": "없는종목"}).status_code == 404

    def test_usage(self, unlocked):
        body = get(f"{unlocked}/api/usage").json()
        assert len(body["buckets"]) == 3

    def test_llm_flag_parsed(self, unlocked):
        for value in ("false", "0", "no", "off"):
            body = get(f"{unlocked}/api/why", params={"q": "005930", "llm": value}).json()
            assert body["explanation"] is None

    def test_hung_pipeline_times_out(self, unlocked, monkeypatch):
        """개별 요청 타임아웃을 뚫고 늘어지는 네트워크 경로가 있었다(사내 프록시,
        낯선 도메인 TLS 협상). 전체 파이프라인에 상한이 없으면 스레드가 무기한
        붙잡혀 화면은 영원히 '분석 중…' 으로 남는다. 상한이 실제로 끊는지 확인한다.
        """
        import asyncio  # noqa: PLC0415

        async def hang(*a, **kw):
            await asyncio.sleep(10)

        monkeypatch.setattr(lite, "WHY_TIMEOUT_S", 0.2)
        # lite.py 는 `from .pipeline import diagnose` 로 이름을 로컬에 들여왔으므로
        # pipeline.diagnose 가 아니라 lite.diagnose 를 바꿔야 실제로 먹는다.
        monkeypatch.setattr(lite, "diagnose", hang)
        r = get(f"{unlocked}/api/why", params={"q": "005930", "llm": "false"})
        assert r.status_code == 504
        assert "진단" in r.json()["detail"]


class TestAuth:
    def test_rejects_without_token(self, locked):
        assert get(f"{locked}/api/why", params={"q": "005930"}).status_code == 401

    def test_accepts_header(self, locked):
        r = get(f"{locked}/api/why", params={"q": "005930", "llm": "false"},
                headers={"X-Token": TOKEN})
        assert r.status_code == 200

    def test_accepts_query_param(self, locked):
        r = get(f"{locked}/api/why",
                params={"q": "005930", "llm": "false", "t": TOKEN})
        assert r.status_code == 200

    def test_wrong_token_rejected(self, locked):
        r = get(f"{locked}/api/why", params={"q": "005930"},
                headers={"X-Token": "wrong"})
        assert r.status_code == 401

    def test_page_stays_open(self, locked):
        """HTML 을 잠그면 폰이 토큰을 저장할 화면조차 못 연다."""
        assert get(f"{locked}/").status_code == 200
        assert get(f"{locked}/sw.js").status_code == 200


BLOCKED = ("fastapi", "uvicorn", "anthropic", "pydantic", "pydantic_core", "starlette")

BLOCKER = f"""
import sys
BANNED = {BLOCKED!r}

class Blocker:
    def find_spec(self, name, path=None, target=None):
        if name.split(".")[0] in BANNED:
            raise ImportError("폰에 없는 패키지: " + name)
        return None

sys.meta_path.insert(0, Blocker())
"""


class TestRunsWithoutHeavyDeps:
    """폰에는 fastapi/uvicorn/anthropic 이 없다.

    소스에서 문자열을 찾는 검사는 주석이나 URL에 걸려 헛돈다. 그래서 실제로
    import 를 차단한 하위 프로세스에서 돌려본다 — 이게 진짜 보증이다.
    """

    def _run(self, body: str):
        import subprocess
        return subprocess.run(
            [sys.executable, "-c", BLOCKER + body],
            cwd=str(Path(__file__).resolve().parents[1]),
            capture_output=True, text=True, timeout=90,
        )

    def test_lite_server_imports(self):
        r = self._run("import server.lite; print('ok')")
        assert r.returncode == 0, f"경량 서버가 뜨지 않는다:\n{r.stderr}"
        assert "ok" in r.stdout

    def test_cli_imports(self):
        r = self._run("import server.cli; print('ok')")
        assert r.returncode == 0, f"CLI 가 뜨지 않는다:\n{r.stderr}"

    def test_analysis_pipeline_runs(self):
        """수집 빼고 분해까지 전부 무거운 의존성 없이 돌아야 한다."""
        r = self._run(
            "from server.analysis.attribution import analyze;"
            "from server.models import Quote, MarketContext;"
            "q = Quote(code='005930', name='삼성전자', price=228500,"
            "          change=-17500, change_rate=-7.11, open=241500);"
            "a = analyze(q, MarketContext(index_rate=-4.97, sector_rate=-8.65));"
            "print(a.driver, round(a.market.value, 2))"
        )
        assert r.returncode == 0, r.stderr
        assert "MARKET -4.97" in r.stdout

    def test_blocker_actually_blocks(self):
        """차단기가 동작하지 않으면 위 테스트들이 전부 무의미해진다."""
        r = self._run("import fastapi")
        assert r.returncode != 0
        assert "폰에 없는 패키지" in r.stderr

    def test_fastapi_server_still_needs_it(self):
        """대조군: PC용 서버는 fastapi 가 있어야 뜨는 게 정상이다."""
        r = self._run("import server.main")
        assert r.returncode != 0, "main.py 가 fastapi 없이 떴다 — 테스트가 잘못됐다"


class TestLlmFallback:
    def test_http_path_exists(self):
        """SDK 가 없는 폰에서도 LLM 을 부를 수 있어야 한다."""
        from server.analysis import llm
        assert hasattr(llm, "_call_http")

    def test_sdk_is_the_default_path(self):
        from server.analysis import llm
        assert hasattr(llm, "_call_sdk")

    def test_both_paths_share_one_parser(self):
        """SDK/HTTP 응답 모양이 같아야 처리가 갈리지 않는다."""
        from server.analysis.llm import _parse
        raw = {
            "model": "claude-sonnet-5",
            "usage": {"input_tokens": 2000, "output_tokens": 600},
            "content": [{"type": "tool_use", "name": "report_cause",
                         "input": {"answer": "시장 연동", "confidence": "medium"}}],
        }
        out = _parse(raw)
        assert out["answer"] == "시장 연동"
        assert out["_model"] == "claude-sonnet-5"
        assert out["_usage"]["input_tokens"] == 2000

    def test_parser_handles_text_only_reply(self):
        from server.analysis.llm import _parse
        out = _parse({"model": "m", "usage": {},
                      "content": [{"type": "text", "text": "도구를 안 썼다"}]})
        assert "도구를 안 썼다" in out["answer"]
        assert out["confidence"] == "low"

    def test_parser_survives_empty_response(self):
        from server.analysis.llm import _parse
        out = _parse({})
        assert out["_model"] == "unknown"
        assert out["_usage"]["input_tokens"] == 0
