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

    async def test_news_shown_newest_first(self):
        """관련도 점수는 LLM 근거를 고를 때만 쓰고, 화면에는 최신순으로 보여야 한다."""
        r = await pipeline.diagnose("005930", use_llm=False)
        times = [n["time"] for n in r["news"]]
        assert times == sorted(times, reverse=True)
        assert all("_dt" not in n for n in r["news"]), "내부용 _dt 필드가 응답에 새면 안 된다"

    async def test_news_recency_wins_over_score(self, monkeypatch):
        """관련도 점수가 더 높아도, 화면 순서는 무조건 최신 기사가 위로 온다."""
        odd_news = [{"items": [
            # 관련도는 높지만(종목명+수주 재료 언급) 더 오래된 기사
            {"title": "삼성전자, 대규모 수주 계약 체결…사상 최대",
             "datetime": "20260806090000", "officeId": "015", "articleId": "1"},
            # 관련도는 낮지만 더 최신인 기사
            {"title": "오늘의 날씨", "datetime": "20260806143000",
             "officeId": "015", "articleId": "2"},
        ]}]

        def h(request: httpx.Request) -> httpx.Response:
            if "/news/stock/" in str(request.url):
                return httpx.Response(200, json=odd_news)
            return handler(request)

        def factory(*args, **kwargs):
            return NaverProvider(client=httpx.AsyncClient(transport=httpx.MockTransport(h)))

        monkeypatch.setattr(pipeline, "NaverProvider", factory)

        r = await pipeline.diagnose("005930", use_llm=False)
        assert r["news"][0]["title"] == "오늘의 날씨"

    async def test_llm_skipped_without_key(self):
        r = await pipeline.diagnose("005930", use_llm=True)
        assert r["explanation"] is None
        assert r["cost"] is None

    async def test_cost_computed_from_real_usage(self, monkeypatch, tmp_path):
        """LLM 응답에 실린 토큰 수로 비용이 나오고 기록까지 남아야 한다."""
        monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(tmp_path / "u.jsonl"))

        async def fake_explain(*a, **k):
            return {
                "answer": "시장 전체 하락에 연동",
                "reasons": [], "catalyst": "확인된 개별 재료 없음",
                "confidence": "medium", "watch": "외국인 수급",
                "_model": "claude-sonnet-5",
                "_usage": {"input_tokens": 2000, "output_tokens": 600},
            }

        monkeypatch.setattr(pipeline.llm, "explain", fake_explain)
        r = await pipeline.diagnose("005930", use_llm=True)

        assert r["cost"]["input_tokens"] == 2000
        assert r["cost"]["usd"] is not None
        assert r["cost"]["krw"] > 0
        assert (tmp_path / "u.jsonl").exists(), "사용량이 기록되지 않았다"

    async def test_llm_failure_yields_no_cost(self, monkeypatch):
        """호출이 실패하면 usage 가 없으므로 비용도 없어야 한다(0원 아님)."""
        async def failed(*a, **k):
            return {"error": "APIConnectionError: boom"}

        monkeypatch.setattr(pipeline.llm, "explain", failed)
        r = await pipeline.diagnose("005930", use_llm=True)
        assert r["cost"] is None

    async def test_render_text_shows_cost(self, monkeypatch, tmp_path):
        monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(tmp_path / "u.jsonl"))

        async def fake_explain(*a, **k):
            return {"answer": "x", "reasons": [], "_model": "claude-sonnet-5",
                    "_usage": {"input_tokens": 2000, "output_tokens": 600}}

        monkeypatch.setattr(pipeline.llm, "explain", fake_explain)
        text = pipeline.render_text(await pipeline.diagnose("005930", use_llm=True))
        assert "[비용]" in text and "토큰" in text

    async def test_render_text_without_llm_says_so(self):
        text = pipeline.render_text(await pipeline.diagnose("005930", use_llm=False))
        assert "LLM 미사용" in text

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

    def test_usage_endpoint(self, monkeypatch, tmp_path):
        monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(tmp_path / "u.jsonl"))
        with TestClient(app) as c:
            r = c.get("/api/usage")
        assert r.status_code == 200
        body = r.json()
        assert len(body["buckets"]) == 3
        assert body["buckets"][0]["calls"] == 0

    def test_frontend_renders_cost(self):
        with TestClient(app) as c:
            html = c.get("/").text
        assert "costLabel" in html
        assert "/api/usage" in html
