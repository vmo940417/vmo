"""접근 토큰 테스트.

공개 터널로 열면 URL 을 아는 사람이 곧 내 Claude API 크레딧을 쓸 수 있는
사람이 된다. 잠금이 실제로 잠기는지, 그리고 잠그지 않았을 때 방해가 되지
않는지를 둘 다 확인한다.
"""

from __future__ import annotations

import sys
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.test_providers import handler  # noqa: E402
from server import pipeline  # noqa: E402
from server.main import app  # noqa: E402
from server.providers.naver import NaverProvider  # noqa: E402

TOKEN = "s3cret-token-value"


@pytest.fixture(autouse=True)
def mock_naver(monkeypatch):
    monkeypatch.setattr(pipeline, "NaverProvider", lambda *a, **k: NaverProvider(
        client=httpx.AsyncClient(transport=httpx.MockTransport(handler))))
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


@pytest.fixture
def locked(monkeypatch):
    monkeypatch.setenv("STOCKWHY_TOKEN", TOKEN)
    with TestClient(app) as c:
        yield c


@pytest.fixture
def unlocked(monkeypatch):
    monkeypatch.delenv("STOCKWHY_TOKEN", raising=False)
    with TestClient(app) as c:
        yield c


class TestUnlocked:
    def test_no_token_needed(self, unlocked):
        assert unlocked.get("/api/why", params={"q": "005930", "llm": "false"}).status_code == 200

    def test_health_reports_unlocked(self, unlocked):
        assert unlocked.get("/api/health").json()["auth_required"] is False


class TestLocked:
    def test_rejects_missing_token(self, locked):
        r = locked.get("/api/why", params={"q": "005930", "llm": "false"})
        assert r.status_code == 401

    def test_rejects_wrong_token(self, locked):
        r = locked.get("/api/why", params={"q": "005930", "llm": "false"},
                       headers={"X-Token": "nope"})
        assert r.status_code == 401

    def test_accepts_header(self, locked):
        r = locked.get("/api/why", params={"q": "005930", "llm": "false"},
                       headers={"X-Token": TOKEN})
        assert r.status_code == 200

    def test_accepts_query_param(self, locked):
        """폰에서 최초 1회 ?t=... 로 접속하는 경로."""
        r = locked.get("/api/why", params={"q": "005930", "llm": "false", "t": TOKEN})
        assert r.status_code == 200

    def test_text_endpoint_also_locked(self, locked):
        assert locked.get("/api/why.txt", params={"q": "005930"}).status_code == 401

    def test_page_and_assets_stay_open(self, locked):
        """HTML 과 아이콘까지 잠그면 폰이 토큰을 저장할 화면조차 못 연다."""
        assert locked.get("/").status_code == 200
        assert locked.get("/sw.js").status_code == 200
        assert locked.get("/static/icons/icon-192.png").status_code == 200

    def test_health_reports_locked(self, locked):
        body = locked.get("/api/health").json()
        assert body["auth_required"] is True
        assert TOKEN not in str(body), "토큰 값이 응답에 새어나가면 안 된다"


class TestFrontendWiring:
    def test_stores_token_and_scrubs_url(self, unlocked):
        """?t=... 를 주소창에 남겨두면 공유하다 새기 쉽다."""
        html = unlocked.get("/").text
        assert "localStorage.setItem(TOKEN_KEY" in html
        assert "history.replaceState" in html

    def test_sends_token_header(self, unlocked):
        assert "'X-Token': tk" in unlocked.get("/").text
