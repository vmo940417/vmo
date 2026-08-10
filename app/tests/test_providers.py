"""네이버 파서 테스트.

네트워크를 타지 않고 httpx.MockTransport 로 응답을 흉내낸다. 페이로드는 네이버
모바일 엔드포인트의 실제 형태를 따르되, 숫자를 콤마 문자열로 주거나 하락 부호를
별도 필드로 주는 등 파서가 실제로 감당해야 하는 지저분함을 그대로 담았다.
"""

from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.providers.naver import (  # noqa: E402
    NaverProvider, _weighted_sector_rate, build_context, market_of,
    parse_flow_rows, parse_frgn_html,
)
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
        assert items[0].when() == "08/06 14:43"

    async def test_unparseable_date_is_reported(self):
        """아는 형식 셋 다 못 맞히면 날짜가 통째로 빈 채로 뜬다 — 다음 진단에서
        바로 형태를 볼 수 있게 샘플로 남겨야 한다."""
        odd_news = [{"items": [{"title": "이상한 날짜 기사", "datetime": "완전히-다른-형식"}]}]

        def h(request: httpx.Request) -> httpx.Response:
            if "/news/stock/" in str(request.url):
                return httpx.Response(200, json=odd_news)
            return handler(request)

        async with make_provider(h) as p:
            items = await p.news("005930")
        assert items[0].published_at is None
        assert p.report.samples.get("news_datetime") == "완전히-다른-형식"

    async def test_resolve_by_code_skips_search(self):
        async with make_provider() as p:
            assert await p.resolve("005930") == ("005930", "삼성전자")

    async def test_resolve_by_name(self):
        """ac.stock 이 죽어도 search/all 폴백으로 해결돼야 한다."""
        async with make_provider() as p:
            assert await p.resolve("삼성전자") == ("005930", "삼성전자")

    async def test_resolve_prefers_ac_stock(self):
        """실동작 확인된 ac.stock 을 먼저 쓴다. 페이로드는 실제 응답 형태."""
        def ac_only(request: httpx.Request) -> httpx.Response:
            if "ac.stock" in str(request.url):
                return httpx.Response(200, json={
                    "query": ["삼성전자"],
                    "items": [[[["005930"], ["삼성전자"], ["KOSPI"]]]],
                })
            return httpx.Response(404)

        async with make_provider(ac_only) as p:
            assert await p.resolve("삼성전자") == ("005930", "삼성전자")
            # search/all 을 아예 때리지 않아야 한다.
            assert not any(e == "search/all" for e in p.report.ok)
            assert not any(n == "search/all" for n, _ in p.report.failed)

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


# --------------------------------------------------------------------------
# 시장 구분
#
# 이 값이 틀리면 코스닥 종목을 코스피와 비교하게 되어 분해 자체가 틀어진다.
# 실기기에서 UNKNOWN 이 떴던 적이 있어서, 실제로 올 수 있는 모양을 넓게 깐다.
# --------------------------------------------------------------------------

class TestMarketOf:
    @pytest.mark.parametrize("payload,want", [
        ({"stockExchangeType": {"code": "KOSPI", "name": "코스피"}}, "KOSPI"),
        ({"stockExchangeType": {"name": "코스피"}}, "KOSPI"),          # code 가 없는 경우
        ({"stockExchangeType": {"text": "코스닥"}}, "KOSDAQ"),
        ({"stockExchangeType": "KOSDAQ"}, "KOSDAQ"),                   # 평면 문자열
        ({"marketType": "kospi"}, "KOSPI"),                            # 소문자
        ({"stockExchangeName": "유가증권시장"}, "KOSPI"),
        ({"stockExchangeType": {"code": "KONEX"}}, "KONEX"),
        ({"stockExchangeType": {"nationCode": "KOR", "zoneId": "Asia/Seoul",
                                "name": "KOSDAQ GLOBAL"}}, "KOSDAQ"),
    ])
    def test_extracts(self, payload, want):
        assert market_of(payload) == want

    def test_unknown_when_absent(self):
        assert market_of({"stockName": "삼성전자", "closePrice": "228,500"}) == "UNKNOWN"

    def test_ignores_unrelated_fields(self):
        """marketValue 같은 필드에 걸려 엉뚱한 값을 잡으면 안 된다."""
        assert market_of({"marketValue": "1,335조", "marketValueHangeul": "1335조"}) == "UNKNOWN"

    def test_not_a_dict(self):
        assert market_of(None) == "UNKNOWN"       # type: ignore[arg-type]

    @pytest.mark.asyncio
    async def test_quote_uses_it(self):
        async with make_provider() as p:
            q = await p.quote("005930")
        assert q is not None and q.market == "KOSPI"

    @pytest.mark.asyncio
    async def test_unknown_market_leaves_a_sample(self):
        """읽지 못한 응답은 진단에 남겨야 다음 번에 고칠 수 있다."""
        def no_market(request):
            if "/integration" in str(request.url):
                return httpx.Response(200, json={"stockName": "x", "closePrice": "1000"})
            return handler(request)

        async with make_provider(no_market) as p:
            q = await p.quote("005930")
        assert q is not None and q.market == "UNKNOWN"
        assert "market" in p.report.samples


# --------------------------------------------------------------------------
# 수급 / 공매도
# --------------------------------------------------------------------------

TREND = [
    {"bizdate": "20260806", "foreignerPureBuyQuant": "-1,200,000",
     "organPureBuyQuant": "300,000", "individualPureBuyQuant": "900,000",
     "foreignerHoldRatio": "50.12"},
    {"bizdate": "20260805", "foreignerPureBuyQuant": "-800,000",
     "organPureBuyQuant": "-100,000", "individualPureBuyQuant": "900,000"},
    {"bizdate": "20260804", "foreignerPureBuyQuant": "-500,000",
     "organPureBuyQuant": "200,000", "individualPureBuyQuant": "300,000"},
    {"bizdate": "20260801", "foreignerPureBuyQuant": "400,000",
     "organPureBuyQuant": "-50,000", "individualPureBuyQuant": "-350,000"},
]

FRGN_HTML = """
<table><tr><th>날짜</th><th>종가</th></tr>
<tr><td class="tc">2026.08.06</td><td>228,500</td>
    <td><span class="blind">하락</span> 17,500</td><td>-7.11%</td>
    <td>21,854,734</td><td>+300,000</td><td>-1,200,000</td>
    <td>2,990,000,000</td><td>50.12</td></tr>
<tr><td class="tc">2026.08.05</td><td>246,000</td><td>1,000</td><td>0.41%</td>
    <td>12,000,000</td><td>-100,000</td><td>-800,000</td>
    <td>2,991,200,000</td><td>50.14</td></tr>
<tr><td colspan="9">&nbsp;</td></tr>
</table>
"""


class TestFlowParsing:
    def test_reads_quant_rows(self):
        rows = parse_flow_rows(TREND, now=datetime(2026, 8, 6, 14, 0))
        assert len(rows) == 4
        assert rows[0].date == "2026-08-06"
        assert rows[0].foreign == -1_200_000
        assert rows[0].institution == 300_000
        assert rows[0].unit == "주"
        assert rows[0].foreign_hold_ratio == 50.12

    def test_today_is_provisional_during_session(self):
        rows = parse_flow_rows(TREND, now=datetime(2026, 8, 6, 14, 0))
        assert rows[0].provisional is True
        assert rows[1].provisional is False, "어제 수급은 이미 확정이다"

    def test_after_close_is_not_provisional(self):
        rows = parse_flow_rows(TREND, now=datetime(2026, 8, 6, 19, 0))
        assert rows[0].provisional is False

    def test_amount_rows_keep_won_unit(self):
        """금액으로 오면 현재가를 곱하면 안 되므로 단위를 구분해 둔다."""
        rows = parse_flow_rows([{"bizdate": "20260806",
                                 "foreignerPureBuyAmount": "-274,000,000,000"}])
        assert rows[0].unit == "원" and rows[0].foreign == -274_000_000_000

    def test_wrapped_in_object(self):
        rows = parse_flow_rows({"trends": TREND})
        assert len(rows) == 4

    def test_rows_without_any_flow_field_are_dropped(self):
        assert parse_flow_rows([{"bizdate": "20260806", "closePrice": "228,500"}]) == []

    def test_garbage_is_empty_not_an_exception(self):
        assert parse_flow_rows(None) == []
        assert parse_flow_rows("<html>") == []

    def test_limit(self):
        assert len(parse_flow_rows(TREND, limit=2)) == 2


class TestFrgnHtmlParsing:
    def test_reads_table(self):
        rows = parse_frgn_html(FRGN_HTML, now=datetime(2026, 8, 6, 14, 0))
        assert len(rows) == 2
        assert rows[0].date == "2026-08-06"
        assert rows[0].institution == 300_000
        assert rows[0].foreign == -1_200_000
        assert rows[0].foreign_hold_ratio == 50.12

    def test_skips_non_data_rows(self):
        """헤더·안내 행이 섞여 들어오면 안 된다."""
        assert all(r.date for r in parse_frgn_html(FRGN_HTML))

    def test_empty_html(self):
        assert parse_frgn_html("") == []


KRX_ISIN = {"block1": [{"full_code": "KR7005930003", "short_code": "005930",
                        "codeName": "삼성전자"}]}

KRX_TRADES = {"OutBlock_1": [
    {"TRD_DD": "2026/08/04", "CVSRTSELL_TRDVOL": "700,000",
     "CVSRTSELL_TRDVAL": "170,000,000,000", "TRDVAL_WT": "6.0"},
    {"TRD_DD": "2026/08/05", "CVSRTSELL_TRDVOL": "1,500,000",
     "CVSRTSELL_TRDVAL": "350,000,000,000", "TRDVAL_WT": "12.4"},
    {"TRD_DD": "2026/08/03", "CVSRTSELL_TRDVOL": "600,000",
     "CVSRTSELL_TRDVAL": "140,000,000,000", "TRDVAL_WT": "5.0"},
]}


def krx_handler(request: httpx.Request) -> httpx.Response:
    """KRX 는 POST 한 주소로 bld 만 바꿔 부르므로 본문을 보고 갈라야 한다."""
    body = request.content.decode("utf-8")
    if "finder_srtisu" in body:
        return httpx.Response(200, json=KRX_ISIN)
    if "MDCSTAT301" in body or "MDCSTAT300" in body:
        return httpx.Response(200, json=KRX_TRADES)
    return httpx.Response(200, json={"OutBlock_1": []})


@pytest.mark.asyncio
class TestSupplyDemandFetch:
    def _handler(self, request: httpx.Request) -> httpx.Response:
        url = str(request.url)
        if "data.krx.co.kr" in url:
            return krx_handler(request)
        if "/trend" in url:
            return httpx.Response(200, json=TREND)
        return handler(request)

    async def test_collects_both(self):
        async with make_provider(self._handler) as p:
            s = await p.supply_demand("005930", now=datetime(2026, 8, 6, 14, 0))
        assert s.today is not None and s.today.foreign == -1_200_000
        assert len(s.history) == 4
        assert s.short is not None and s.short.ratio == 12.4

    async def test_streak_counts_same_direction_only(self):
        async with make_provider(self._handler) as p:
            s = await p.supply_demand("005930", now=datetime(2026, 8, 6, 14, 0))
        days, total = s.streak("foreign")
        assert days == 3, "8/1 은 순매수라 연속이 끊긴다"
        assert total == -2_500_000

    async def test_short_baseline_excludes_latest(self):
        async with make_provider(self._handler) as p:
            s = await p.supply_demand("005930")
        assert s.short_ratio_baseline() == pytest.approx(5.5)

    async def test_flows_fall_back_to_html(self):
        def json_dead(request: httpx.Request) -> httpx.Response:
            url = str(request.url)
            if "data.krx.co.kr" in url:
                return krx_handler(request)
            if "frgn.naver" in url:
                return httpx.Response(200, text=FRGN_HTML)
            if "/trend" in url:
                return httpx.Response(404, json={})
            return handler(request)

        async with make_provider(json_dead) as p:
            s = await p.supply_demand("005930", now=datetime(2026, 8, 6, 14, 0))
        assert s.today is not None and s.today.foreign == -1_200_000

    async def test_short_failure_does_not_break_flows(self):
        """공매도는 없어도 나머지 분석이 나와야 한다 — 실패 격리 확인."""
        def krx_dead(request: httpx.Request) -> httpx.Response:
            if "data.krx.co.kr" in str(request.url):
                return httpx.Response(500, json={})
            if "/trend" in str(request.url):
                return httpx.Response(200, json=TREND)
            return handler(request)

        async with make_provider(krx_dead) as p:
            s = await p.supply_demand("005930", now=datetime(2026, 8, 6, 14, 0))
        assert s.today is not None, "공매도 실패가 수급까지 끌고 내려가면 안 된다"
        assert s.short is None

    async def test_total_failure_is_empty_not_a_crash(self):
        async with make_provider(lambda r: httpx.Response(500, json={})) as p:
            s = await p.supply_demand("005930")
        assert s.today is None and s.short is None and s.history == []

    async def test_unreadable_response_leaves_a_sample(self):
        """200 인데 못 읽었으면 응답 앞부분을 남겨 다음에 고칠 수 있게 한다."""
        def odd_shape(request: httpx.Request) -> httpx.Response:
            if "/trend" in str(request.url):
                return httpx.Response(200, json={"unexpected": [{"a": 1}]})
            return httpx.Response(404, json={})

        async with make_provider(odd_shape) as p:
            await p.supply_demand("005930")
        assert "trend" in p.report.samples
        assert "unexpected" in p.report.samples["trend"]

    async def test_context_carries_supply(self):
        async with make_provider(self._handler) as p:
            quote = await p.quote("005930")
            assert quote is not None
            ctx = await build_context(p, quote, [])
        assert ctx.supply is not None and ctx.supply.today is not None
