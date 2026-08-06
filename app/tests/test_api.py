"""파이프라인 + FastAPI 엔드투엔드 테스트 (네트워크 없이).

NaverProvider 만 MockTransport 로 갈아끼우고 나머지는 실제 코드 경로를 그대로
탄다. LLM 은 키가 없으면 자동으로 건너뛰므로 규칙 기반 경로가 검증된다.
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


@pytest.fixture(autouse=True)
def mock_naver(monkeypatch):
    """모든 테스트에서 네이버 호출을 가로챈다."""
    def factory(*args, **kwargs):
        return NaverProvider(client=httpx.AsyncClient(transport=httpx.MockTransport(handler)))

    monkeypatch.setattr(pipeline, "NaverProvider", factory)
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)


class TestPipeline:
    async def test_diagnose_end_to_end(self):
        r = await pipeline.diagnose("005930", use_llm=False)
        assert r["quote"]["name"] == "삼성전자"
        assert r["quote"]["change_rate"] == -7.11
        assert r["context"]["index_rate"] == -4.97
        assert r["attribution"]["components"]["market"]["value"] == pytest.approx(-4.97)

    async def test_components_still_sum_after_full_pipeline(self):
        r = await pipeline.diagnose("005930", use_llm=False)
        c = r["attribution"]["components"]
        total = c["market"]["value"] + c["sector"]["value"] + c["idiosyncratic"]["value"]
        assert total == pytest.approx(r["quote"]["change_rate"], abs=0.01)

    async def test_peers_resolved_for_semis(self):
        """삼성전자는 반도체 테마 -> 피어가 붙고 업종 등락률이 계산돼야 한다."""
        r = await pipeline.diagnose("005930", use_llm=False)
        assert r["context"]["peers"], "피어가 비어 있으면 업종 분해가 안 된다"
        assert r["context"]["sector_rate"] is not None

    async def test_news_scored_and_sorted(self):
        r = await pipeline.diagnose("005930", use_llm=False)
        scores = [n["score"] for n in r["news"]]
        assert scores == sorted(scores, reverse=True)

    async def test_llm_skipped_without_key(self):
        r = await pipeline.diagnose("005930", use_llm=True)
        assert r["explanation"] is None

    async def test_unknown_symbol_raises(self, monkeypatch):
        def empty(*a, **k):
            return NaverProvider(client=httpx.AsyncClient(
                transport=httpx.MockTransport(lambda r: httpx.Response(200, json={}))))

        monkeypatch.setattr(pipeline, "NaverProvider", empty)
        with pytest.raises(pipeline.NotFound):
            await pipeline.diagnose("없는종목", use_llm=False)

    async def test_render_text_has_key_sections(self):
        text = pipeline.render_text(await pipeline.diagnose("005930", use_llm=False))
        assert "삼성전자" in text
        assert "[등락률 분해]" in text
        assert "종목고유" in text


class TestHttpApi:
    def test_index_page_served(self):
        with TestClient(app) as c:
            r = c.get("/")
        assert r.status_code == 200
        assert "장중 시세 원인 분석" in r.text

    def test_health(self):
        with TestClient(app) as c:
            r = c.get("/api/health")
        assert r.status_code == 200 and r.json()["ok"] is True

    def test_why_json(self):
        with TestClient(app) as c:
            r = c.get("/api/why", params={"q": "005930", "llm": "false"})
        assert r.status_code == 200
        body = r.json()
        assert body["quote"]["code"] == "005930"
        assert "headline" in body["attribution"]
        assert body["attribution"]["driver"] in {"MARKET", "SECTOR", "IDIOSYNCRATIC"}

    def test_why_text(self):
        with TestClient(app) as c:
            r = c.get("/api/why.txt", params={"q": "005930", "llm": "false"})
        assert r.status_code == 200 and "삼성전자" in r.text

    def test_missing_query_is_422(self):
        with TestClient(app) as c:
            assert c.get("/api/why").status_code == 422
