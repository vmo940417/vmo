"""CLI 진단(--selftest) 테스트.

사용자가 회사 PC 에서 제일 먼저 돌리는 명령이라, 여기서 예외가 나면 앱이
동작하는지조차 확인할 수 없다. 특히 수급·공매도는 못 가져오는 경우가 정상
시나리오에 포함되므로, 결측 상태에서 서식이 깨지지 않는지 본다.
"""

from __future__ import annotations

import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import cli  # noqa: E402
from server.providers.naver import NaverProvider  # noqa: E402
from tests.test_providers import FRGN_HTML, SHORT_TREND, TREND, handler  # noqa: E402


def provider_factory(h):
    def make():
        return NaverProvider(client=httpx.AsyncClient(transport=httpx.MockTransport(h)))
    return make


@pytest.mark.asyncio
class TestSelftest:
    async def test_reports_supply(self, monkeypatch, capsys):
        def full(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            if "/trend" in url:
                return httpx.Response(200, json=TREND)
            if "shortSellingTrend" in url:
                return httpx.Response(200, json=SHORT_TREND)
            return handler(request)

        monkeypatch.setattr(cli, "NaverProvider", provider_factory(full))
        code = await cli.selftest()
        out = capsys.readouterr().out
        assert "수급(투자자별)" in out and "외국인 -1,200,000주" in out
        assert "공매도" in out and "12.4%" in out
        assert code == 0

    async def test_missing_short_data_is_not_a_failure(self, monkeypatch, capsys):
        """공매도가 없어도 나머지 분석은 다 나온다 — 실패로 세면 안 된다."""
        def no_short(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            if "frgn.naver" in url:
                return httpx.Response(200, text=FRGN_HTML)
            if "short" in url.lower() or "/trend" in url:
                return httpx.Response(404, json={})
            return handler(request)

        monkeypatch.setattr(cli, "NaverProvider", provider_factory(no_short))
        code = await cli.selftest()
        out = capsys.readouterr().out
        assert "장 마감 후 공시" in out
        assert code == 0, "공매도 결측으로 진단이 실패해선 안 된다"

    async def test_unreadable_response_is_shown(self, monkeypatch, capsys):
        """스키마가 어긋났을 때 응답 앞부분을 보여줘야 파서를 고칠 수 있다."""
        def odd(request: httpx.Request) -> httpx.Response:
            if "/trend" in str(request.url):
                return httpx.Response(200, json={"unexpected": [{"a": 1}]})
            return handler(request)

        monkeypatch.setattr(cli, "NaverProvider", provider_factory(odd))
        await cli.selftest()
        out = capsys.readouterr().out
        assert "형태가 달라 읽지 못한 응답" in out and "unexpected" in out
