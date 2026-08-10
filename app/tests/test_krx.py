"""KRX 공매도 수집 테스트.

네이버 공매도 경로가 전부 죽어 있는 게 윈도우 빌드 진단에서 확인돼서(404 /
종목 메인 페이지 리다이렉트) 원출처인 KRX 로 갈아탔다. KRX 응답 스키마도 공개
문서가 없어 추정으로 짠 부분이 있으므로, 여기서는 "형태가 달라도 조용히 비는가,
그리고 못 읽은 건 진단에 남는가"를 중심으로 본다.
"""

from __future__ import annotations

import sys
from datetime import datetime
from pathlib import Path

import httpx
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.providers import krx  # noqa: E402
from server.providers.naver import ProviderReport  # noqa: E402

ISIN = {"block1": [{"full_code": "KR7005930003", "short_code": "005930",
                    "codeName": "삼성전자", "marketCode": "STK"}]}

# 과거->현재 순으로 온다(KRX 기본). 파서가 최신순으로 뒤집어야 한다.
TRADES = {"OutBlock_1": [
    {"TRD_DD": "2026/08/03", "CVSRTSELL_TRDVOL": "600,000",
     "CVSRTSELL_TRDVAL": "140,000,000,000", "ACC_TRDVAL": "2,800,000,000,000",
     "TRDVAL_WT": "5.0", "TRDVOL_WT": "4.8"},
    {"TRD_DD": "2026/08/04", "CVSRTSELL_TRDVOL": "700,000",
     "CVSRTSELL_TRDVAL": "170,000,000,000", "TRDVAL_WT": "6.0"},
    {"TRD_DD": "2026/08/05", "CVSRTSELL_TRDVOL": "1,500,000",
     "CVSRTSELL_TRDVAL": "350,000,000,000", "TRDVAL_WT": "12.4"},
]}

BALANCE = {"OutBlock_1": [
    {"TRD_DD": "2026/08/05", "BAL_QTY": "110,000,000", "BAL_RTO": "1.85"},
    {"TRD_DD": "2026/08/04", "BAL_QTY": "105,000,000", "BAL_RTO": "1.76"},
]}


def make_client(handler) -> httpx.AsyncClient:
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def full_handler(request: httpx.Request) -> httpx.Response:
    body = request.content.decode("utf-8")
    if "finder_srtisu" in body:
        return httpx.Response(200, json=ISIN)
    if "MDCSTAT305" in body or "MDCSTAT304" in body:
        return httpx.Response(200, json=BALANCE)
    return httpx.Response(200, json=TRADES)


class TestParseTrades:
    def test_reads_rows(self):
        rows = krx.parse_trades(TRADES)
        assert len(rows) == 3
        assert rows[0].volume == 1_500_000
        assert rows[0].value == 350_000_000_000
        assert rows[0].ratio == 12.4

    def test_newest_first(self):
        """KRX 는 과거순으로 준다. 오늘을 설명하려면 최신이 앞이어야 한다."""
        rows = krx.parse_trades(TRADES)
        assert [r.date for r in rows] == ["2026-08-05", "2026-08-04", "2026-08-03"]

    def test_slash_dates_normalised(self):
        assert krx.parse_trades(TRADES)[0].date == "2026-08-05"

    def test_prefers_value_weight(self):
        """거래대금 비중이 거래량 비중보다 시장 충격을 잘 나타낸다."""
        row = {"TRD_DD": "2026/08/03", "TRDVAL_WT": "5.0", "TRDVOL_WT": "4.8"}
        assert krx.parse_trades({"OutBlock_1": [row]})[0].ratio == 5.0

    def test_dash_is_missing_not_zero(self):
        row = {"TRD_DD": "2026/08/05", "CVSRTSELL_TRDVOL": "-", "TRDVAL_WT": "3.1"}
        got = krx.parse_trades({"OutBlock_1": [row]})[0]
        assert got.volume is None and got.ratio == 3.1

    def test_rows_without_a_date_are_dropped(self):
        assert krx.parse_trades({"OutBlock_1": [{"CVSRTSELL_TRDVOL": "100"}]}) == []

    def test_unknown_shape_is_empty(self):
        assert krx.parse_trades({"뜻밖의키": [{"a": 1}]}) == []
        assert krx.parse_trades(None) == []
        assert krx.parse_trades("<html>") == []

    def test_limit(self):
        assert len(krx.parse_trades(TRADES, limit=2)) == 2


class TestMergeBalance:
    def test_matches_by_date(self):
        rows = krx.merge_balance(krx.parse_trades(TRADES), BALANCE)
        assert rows[0].balance_ratio == 1.85
        assert rows[1].balance_ratio == 1.76

    def test_missing_balance_leaves_it_none(self):
        rows = krx.merge_balance(krx.parse_trades(TRADES), {"OutBlock_1": []})
        assert all(r.balance_ratio is None for r in rows)

    def test_does_not_invent_dates(self):
        """잔고에만 있는 날짜를 거래 목록에 끼워 넣으면 안 된다."""
        rows = krx.merge_balance(krx.parse_trades(TRADES), BALANCE)
        assert len(rows) == 3
        assert rows[2].balance_ratio is None    # 8/3 은 잔고 데이터가 없다


@pytest.mark.asyncio
class TestIsin:
    async def test_resolves(self):
        report = ProviderReport()
        async with make_client(full_handler) as c:
            assert await krx.isin(c, report, "005930") == "KR7005930003"

    async def test_rejects_a_different_code(self):
        """검색이 엉뚱한 종목을 물어오면 그 ISIN 으로 조회하면 안 된다."""
        other = {"block1": [{"full_code": "KR7000660001", "short_code": "000660"}]}
        report = ProviderReport()
        async with make_client(lambda r: httpx.Response(200, json=other)) as c:
            assert await krx.isin(c, report, "005930") is None

    async def test_empty_leaves_a_sample(self):
        report = ProviderReport()
        async with make_client(lambda r: httpx.Response(200, json={"block1": []})) as c:
            assert await krx.isin(c, report, "005930") is None
        assert "krx/isin" in report.samples

    async def test_failure_is_recorded(self):
        report = ProviderReport()
        async with make_client(lambda r: httpx.Response(500, json={})) as c:
            assert await krx.isin(c, report, "005930") is None
        assert any(n == "krx/isin" for n, _ in report.failed)


@pytest.mark.asyncio
class TestShortSales:
    async def test_end_to_end(self):
        report = ProviderReport()
        async with make_client(full_handler) as c:
            rows = await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert rows[0].date == "2026-08-05"
        assert rows[0].ratio == 12.4
        assert rows[0].balance_ratio == 1.85

    async def test_sends_the_isin_not_the_code(self):
        """KRX 는 6자리 코드로는 조회가 안 된다."""
        seen: list[str] = []

        def spy(request: httpx.Request) -> httpx.Response:
            seen.append(request.content.decode("utf-8"))
            return full_handler(request)

        report = ProviderReport()
        async with make_client(spy) as c:
            await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        trade_calls = [b for b in seen if "MDCSTAT" in b]
        assert trade_calls and all("KR7005930003" in b for b in trade_calls)

    async def test_sends_a_referer(self):
        """Referer 가 없으면 KRX 가 빈 응답을 준다."""
        seen: list[httpx.Headers] = []

        def spy(request: httpx.Request) -> httpx.Response:
            seen.append(request.headers)
            return full_handler(request)

        report = ProviderReport()
        async with make_client(spy) as c:
            await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert all("data.krx.co.kr" in h.get("referer", "") for h in seen)

    async def test_no_isin_means_no_query(self):
        """ISIN 을 못 얻으면 조회 자체를 시도하지 않는다."""
        calls: list[str] = []

        def isin_dead(request: httpx.Request) -> httpx.Response:
            body = request.content.decode("utf-8")
            calls.append(body)
            return httpx.Response(200, json={"block1": []})

        report = ProviderReport()
        async with make_client(isin_dead) as c:
            assert await krx.short_sales(c, report, "005930") == []
        assert not any("MDCSTAT" in b for b in calls)

    async def test_falls_through_to_the_second_bld(self):
        """첫 화면 코드가 바뀌어도 다음 후보로 넘어가야 한다."""
        def only_second(request: httpx.Request) -> httpx.Response:
            body = request.content.decode("utf-8")
            if "finder_srtisu" in body:
                return httpx.Response(200, json=ISIN)
            if "MDCSTAT30101" in body:
                return httpx.Response(200, json={"OutBlock_1": []})
            if "MDCSTAT30001" in body:
                return httpx.Response(200, json=TRADES)
            return httpx.Response(200, json={"OutBlock_1": []})

        report = ProviderReport()
        async with make_client(only_second) as c:
            rows = await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert rows and rows[0].ratio == 12.4

    async def test_unreadable_response_leaves_a_sample(self):
        def odd(request: httpx.Request) -> httpx.Response:
            body = request.content.decode("utf-8")
            if "finder_srtisu" in body:
                return httpx.Response(200, json=ISIN)
            return httpx.Response(200, json={"뜻밖의키": [{"a": 1}]})

        report = ProviderReport()
        async with make_client(odd) as c:
            assert await krx.short_sales(c, report, "005930") == []
        assert any(k.startswith("krx/MDCSTAT") for k in report.samples)

    async def test_balance_failure_keeps_the_trades(self):
        """잔고를 못 받아도 비중은 살아야 한다."""
        def no_balance(request: httpx.Request) -> httpx.Response:
            body = request.content.decode("utf-8")
            if "finder_srtisu" in body:
                return httpx.Response(200, json=ISIN)
            if "MDCSTAT305" in body or "MDCSTAT304" in body:
                return httpx.Response(500, json={})
            return httpx.Response(200, json=TRADES)

        report = ProviderReport()
        async with make_client(no_balance) as c:
            rows = await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert rows[0].ratio == 12.4 and rows[0].balance_ratio is None

    async def test_warms_up_session_before_stat_queries(self):
        """srt/STAT 계열은 세션 쿠키 없이는 파라미터가 뭐든 400 LOGOUT 을 준다
        (실기기 CI 탐침으로 확인됨) — POST 전에 메인 화면을 GET 해서
        세션을 먼저 받아야 한다."""
        seen: list[tuple[str, str]] = []

        def spy(request: httpx.Request) -> httpx.Response:
            seen.append((request.method, str(request.url)))
            if request.method == "GET":
                return httpx.Response(200, text="<html></html>")
            return full_handler(request)

        report = ProviderReport()
        async with make_client(spy) as c:
            await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert any(m == "GET" and "data.krx.co.kr" in u for m, u in seen), \
            "세션 워밍업 GET 이 없으면 실기기에서 STAT 조회가 전부 400 LOGOUT 난다"

    async def test_session_warmup_failure_does_not_block_the_rest(self):
        """워밍업 GET 이 죽어도(네트워크 문제 등) 이후 POST 시도 자체는 계속돼야
        한다 — 워밍업 실패가 곧 공매도 조회 포기를 뜻하면 안 된다."""
        def get_dies(request: httpx.Request) -> httpx.Response:
            if request.method == "GET":
                raise httpx.ConnectError("워밍업 실패")
            return full_handler(request)

        report = ProviderReport()
        async with make_client(get_dies) as c:
            rows = await krx.short_sales(c, report, "005930", today=datetime(2026, 8, 6))
        assert rows and rows[0].ratio == 12.4
        assert any(n == "krx/session" for n, _ in report.failed)

    async def test_date_window_covers_holidays(self):
        """공매도는 마감 후 집계라 오늘 것이 없다. 창이 좁으면 빈손으로 끝난다."""
        seen: list[str] = []

        def spy(request: httpx.Request) -> httpx.Response:
            seen.append(request.content.decode("utf-8"))
            return full_handler(request)

        report = ProviderReport()
        async with make_client(spy) as c:
            await krx.short_sales(c, report, "005930", days=10, today=datetime(2026, 8, 6))
        trade = next(b for b in seen if "MDCSTAT" in b)
        assert "strtDd=20260707" in trade and "endDd=20260806" in trade
