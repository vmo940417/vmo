"""네이버 파서 테스트.

네트워크를 타지 않고 httpx.MockTransport 로 응답을 흉내낸다. 페이로드는 네이버
모바일 엔드포인트의 실제 형태를 따르되, 숫자를 콤마 문자열로 주거나 하락 부호를
별도 필드로 주는 등 파서가 실제로 감당해야 하는 지저분함을 그대로 담았다.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.providers.naver import NaverProvider, _weighted_sector_rate  # noqa: E402
from server.models import Quote  # noqa: E402

INTEGRATION = {
    "stockName": "삼성전자",
    "symbolCode": "005930",
    "closePrice": "228,500",
    "compareToPreviousClosePrice": "17,500",          # 부호 없이 내려오는 경우
    "compareToPreviousPrice": {"code": "5", "text": "하락"},
    "fluctuationsRatio": "-7.11",
    "stockExchangeType": {"code": "KOSPI", "name": "코스피"},
    "industryCodeType": {"code": "01", "industryGroupKor": "전기·전자"},
    "marketValue": "1,335조 8,747억",                  # 숫자로 파싱 불가 -> None 이어야 함
}

BASIC = {
    "openPrice": "241,500",
    "highPrice": "246,000",
    "lowPrice": "228,000",
    "previousClose": "246,000",
    "accumulatedTradingVolume": "21,854,734",
    "accumulatedTradingValue": "5112648725750",
    "highPriceOf52Weeks": "374,500",
    "lowPriceOf52Weeks": "67,500",
}

INDEX = {"closePrice": "6,270.11", "fluctuationsRatio": "-4.97"}

NEWS = [{
    "items": [
        {"title": "삼성전자, 넷리스트와 &quot;특허 소송&quot; 합의",
         "datetime": "20260806144322", "officeId": "018", "articleId": "0006012345",
         "officeName": "이데일리"},
        {"title": "<b>삼성전자</b> 주주환원 확대 검토",
         "datetime": "20260806140749", "officeId": "015", "articleId": "0005099887"},
    ]
}]

SISE = """[['날짜','시가','고가','저가','종가','거래량','외국인소진율'],
['20260801',240000,245000,239000,244000,10000000,50.0],
['20260804',244000,248000,243000,246000,14000000,50.1],
['20260806',241500,246000,228000,228500,21854734,50.2]]"""


def handler(request: httpx.Request) -> httpx.Response:
    url = str(request.url)
    if "/integration" in url:
        return httpx.Response(200, json=INTEGRATION)
    if "/basic" in url and "/index/" in url:
        return httpx.Response(200, json=INDEX)
    if "/basic" in url:
        return httpx.Response(200, json=BASIC)
    if "siseJson" in url:
        return httpx.Response(200, text=SISE)
    if "/news/stock/" in url:
        return httpx.Response(200, json=NEWS)
    if "search/all" in url:
        return httpx.Response(200, json={"stocks": [{"itemCode": "005930", "stockName": "삼성전자"}]})
    return httpx.Response(404, json={})


def make_provider(h=handler) -> NaverProvider:
    client = httpx.AsyncClient(transport=httpx.MockTransport(h))
    return NaverProvider(client=client)


@pytest.mark.asyncio
class TestQuote:
    async def test_parses_comma_numbers(self):
        async with make_provider() as p:
            q = await p.quote("005930")
        assert q is not None
        assert q.price == 228500
        assert q.open == 241500
        assert q.volume == 21854734

    async def test_negative_change_sign_corrected(self):
        """등락률이 음수인데 변동폭이 양수로 오면 부호를 맞춰야 한다."""
        async with make_provider() as p:
            q = await p.quote("005930")
        assert q.change_rate == -7.11
        assert q.change == -17500

    async def test_sector_and_market_extracted(self):
        async with make_provider() as p:
            q = await p.quote("005930")
        assert q.sector_name == "전기·전자"
        assert q.market == "KOSPI"

    async def test_unparseable_market_cap_becomes_none(self):
        """'1,335조 8,747억' 은 숫자가 아니다. 예외 대신 None 이어야 한다."""
        async with make_provider() as p:
            q = await p.quote("005930")
        assert q.market_cap is None

    async def test_missing_endpoint_degrades_not_crashes(self):
        def broken(request: httpx.Request) -> httpx.Response:
            if "/integration" in str(request.url):
                return httpx.Response(200, json=INTEGRATION)
            return httpx.Response(500, text="boom")

        async with make_provider(broken) as p:
            q = await p.quote("005930")
        assert q is not None and q.price == 228500
        assert q.open is None            # basic 이 죽어도 시세는 나온다
        assert any(e[0] == "basic" for e in p.report.failed)

    async def test_total_failure_returns_none(self):
        async with make_provider(lambda r: httpx.Response(503)) as p:
            assert await p.quote("005930") is None


@pytest.mark.asyncio
class TestOther:
    async def test_index(self):
        async with make_provider() as p:
            price, rate = await p.index("KOSPI")
        assert price == 6270.11 and rate == -4.97

    async def test_avg_volume_excludes_today(self):
        """마지막 행(당일 진행 중)은 평균에서 빠져야 한다."""
        async with make_provider() as p:
            avg = await p.avg_volume("005930")
        assert avg == pytest.approx((10_000_000 + 14_000_000) / 2)

    async def test_news_strips_html_and_builds_url(self):
        async with make_provider() as p:
            items = await p.news("005930")
        assert len(items) == 2
        assert items[0].title == '삼성전자, 넷리스트와 "특허 소송" 합의'
        assert "<b>" not in items[1].title
        assert items[0].url == "https://n.news.naver.com/mnews/article/018/0006012345"
        assert items[0].when() == "14:43"

    async def test_resolve_by_code_skips_search(self):
        async with make_provider() as p:
            assert await p.resolve("005930") == ("005930", "삼성전자")

    async def test_resolve_by_name(self):
        async with make_provider() as p:
            assert await p.resolve("삼성전자") == ("005930", "삼성전자")

    async def test_resolve_unknown_returns_none(self):
        async with make_provider(lambda r: httpx.Response(200, json={})) as p:
            assert await p.resolve("없는종목") is None


class TestSectorRate:
    def _q(self, rate: float, cap: int | None) -> Quote:
        return Quote(code="x", name="x", price=1, change=0, change_rate=rate, market_cap=cap)

    def test_market_cap_weighted(self):
        rate = _weighted_sector_rate([self._q(-7.11, 300), self._q(-10.19, 100)])
        assert rate == pytest.approx((-7.11 * 300 + -10.19 * 100) / 400)

    def test_falls_back_to_simple_mean_without_caps(self):
        rate = _weighted_sector_rate([self._q(-7.11, None), self._q(-10.19, None)])
        assert rate == pytest.approx((-7.11 + -10.19) / 2)

    def test_single_quote_is_not_a_sector(self):
        assert _weighted_sector_rate([self._q(-7.11, 300)]) is None
