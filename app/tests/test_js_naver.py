"""naver.js 파서 테스트.

픽스처의 /integration 응답은 실기기에서 실제로 확인한 형태다 — 평면 필드가 아니라
totalInfos:[{code,key,value}] 배열로 값이 온다. 첫 APK 의 연결 확인기가 여기서
undefined 를 냈고, 그 화면 덕에 진짜 응답 모양을 알게 됐다.

파이썬 클라이언트가 PC 에서 잘 돈 건 /integration 과 /basic 을 합쳐 쓰기 때문이다.
JS 이식본도 같은 방식이어야 한다는 걸 여기서 못박는다.
"""

from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

HARNESS = Path(__file__).parent / "js" / "naver_harness.mjs"

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node 없음")


# 실기기에서 확인한 /integration 실제 응답 (값은 2026-08-06 장중)
INTEGRATION = {
    "stockEndType": "stock",
    "itemCode": "005930",
    "reutersCode": "005930",
    "stockName": "삼성전자",
    "industryCodeType": {"code": "01", "industryGroupKor": "전기·전자"},
    "stockExchangeType": {"code": "KOSPI", "name": "코스피"},
    "totalInfos": [
        {"code": "lastClosePrice", "key": "전일", "value": "246,000"},
        {"code": "openPrice", "key": "시가", "value": "241,500",
         "compareToPreviousPrice": {"code": "5", "text": "하락", "name": "FALLING"}},
        {"code": "highPrice", "key": "고가", "value": "246,000",
         "compareToPreviousPrice": {"code": "3", "text": "보합", "name": "UNCHANGED"}},
        {"code": "lowPrice", "key": "저가", "value": "228,000",
         "compareToPreviousPrice": {"code": "5", "text": "하락", "name": "FALLING"}},
        {"code": "accumulatedTradingVolume", "key": "거래량", "value": "39,915,894"},
        {"code": "accumulatedTradingValue", "key": "거래대금", "value": "9조 2,003억"},
    ],
}

# /basic 은 평면 필드로 현재가를 준다 — 이게 없으면 시세를 못 만든다.
BASIC = {
    "closePrice": "228,500",
    "compareToPreviousClosePrice": "17,500",     # 부호 없이 오는 경우
    "fluctuationsRatio": "-7.11",
    "highPriceOf52Weeks": "374,500",
    "lowPriceOf52Weeks": "67,500",
}

AC_STOCK = {"query": ["삼성전자"], "items": [[[["005930"], ["삼성전자"], ["KOSPI"]]]]}

NEWS = [
    {"items": [
        {"title": "삼성전자, 넷리스트와 &quot;특허 소송&quot; 합의", "datetime": "20260806144322",
         "officeId": "018", "articleId": "0006012345", "officeName": "이데일리"},
    ]},
    {"items": [
        {"title": "<b>삼성전자</b> 주주환원 확대 검토", "datetime": "20260806140749"},
        {"title": "코스피 매도 사이드카 발동", "datetime": "20260806131139"},
    ]},
]

INDEX = {"closePrice": "6,296.38", "fluctuationsRatio": "-4.58"}

SISE = """[['날짜','시가','고가','저가','종가','거래량','외국인소진율'],
['20260801',240000,245000,239000,244000,10000000,50.0],
['20260804',244000,248000,243000,246000,14000000,50.1],
['20260806',241500,246000,228000,228500,39915894,50.2]]"""

ROUTES = {
    "/integration": INTEGRATION,
    "/basic": BASIC,
    "ac.stock": AC_STOCK,
    "/news/stock/": NEWS,
    "/index/KOSPI/basic": INDEX,
    "siseJson": SISE,
}


def run(routes: dict, want: list[str], **kw) -> dict:
    payload = {"routes": routes, "want": want, **kw}
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True, text=True, timeout=60,
    )
    assert proc.returncode == 0, f"하니스 실패:\n{proc.stderr}"
    return json.loads(proc.stdout)


@pytest.fixture(scope="module")
def q():
    # /index/KOSPI/basic 이 "/basic" 보다 먼저 매칭되도록 순서를 잡는다.
    routes = {"/index/KOSPI/basic": INDEX, **ROUTES}
    return run(routes, ["quote"])["quote"]


class TestQuoteMergesBothEndpoints:
    def test_price_from_basic(self, q):
        """현재가는 /basic 에만 있다 — 합치지 않으면 못 만든다."""
        assert q["price"] == 228500

    def test_ohlc_from_total_infos(self, q):
        """시가·고가·저가는 /integration 의 totalInfos 배열에 있다."""
        assert q["open"] == 241500
        assert q["high"] == 246000
        assert q["low"] == 228000

    def test_prev_close_from_total_infos(self, q):
        assert q["prev_close"] == 246000

    def test_volume_from_total_infos(self, q):
        assert q["volume"] == 39915894

    def test_negative_change_sign_corrected(self, q):
        """등락률이 음수인데 변동폭이 양수로 오면 부호를 맞춘다."""
        assert q["change_rate"] == pytest.approx(-7.11)
        assert q["change"] == -17500

    def test_sector_and_market(self, q):
        assert q["sector_name"] == "전기·전자"
        assert q["market"] == "KOSPI"

    def test_52w_range(self, q):
        assert q["week52_high"] == 374500
        assert q["week52_low"] == 67500

    def test_name(self, q):
        assert q["name"] == "삼성전자"


class TestDegradation:
    def test_integration_down_still_works(self):
        """/integration 이 죽어도 /basic 만으로 시세는 나온다."""
        routes = {**ROUTES, "/integration": None}
        q = run(routes, ["quote"])["quote"]
        assert q["price"] == 228500
        assert q["open"] is None          # totalInfos 를 못 받았으니 없다

    def test_basic_down_reports_failure(self):
        """현재가 출처가 사라지면 정직하게 실패해야 한다 — 0원으로 만들면 안 된다."""
        routes = {k: v for k, v in ROUTES.items() if k != "/basic"}
        routes["/basic"] = None
        out = run(routes, ["quote"])
        assert out["quote"] is None
        assert any(f["endpoint"] == "basic" for f in out["report"]["failed"])

    def test_both_down_returns_null(self):
        out = run({"/integration": None, "/basic": None}, ["quote"])
        assert out["quote"] is None


class TestResolve:
    def test_six_digit_code_used_directly(self):
        out = run(ROUTES, ["resolve"], query="005930")
        assert out["resolve"]["code"] == "005930"

    def test_name_via_ac_stock(self):
        out = run(ROUTES, ["resolve"], query="삼성전자")
        assert out["resolve"] == {"code": "005930", "name": "삼성전자"}

    def test_unknown_returns_null(self):
        out = run({"ac.stock": {}, "search/all": {}}, ["resolve"], query="없는종목")
        assert out["resolve"] is None


class TestOther:
    def test_index(self):
        out = run({"/index/KOSPI/basic": INDEX}, ["index"])
        assert out["index"] == {"price": 6296.38, "rate": -4.58}

    def test_avg_volume_excludes_today(self):
        """마지막 행은 당일(진행 중)이라 평균에서 빠져야 한다."""
        out = run({"siseJson": SISE}, ["avgVolume"])
        assert out["avgVolume"] == pytest.approx((10_000_000 + 14_000_000) / 2)

    def test_news_walks_all_groups(self):
        """첫 그룹만 보면 기사를 놓친다 — 첫 APK 가 1건만 잡은 원인."""
        out = run({"/news/stock/": NEWS}, ["news"])
        assert len(out["news"]) == 3

    def test_news_strips_html_entities(self):
        out = run({"/news/stock/": NEWS}, ["news"])
        assert out["news"][0]["title"] == '삼성전자, 넷리스트와 "특허 소송" 합의'
        assert "<b>" not in out["news"][1]["title"]

    def test_news_builds_article_url(self):
        out = run({"/news/stock/": NEWS}, ["news"])
        assert out["news"][0]["url"] == "https://n.news.naver.com/mnews/article/018/0006012345"

    def test_news_parses_timestamp(self):
        out = run({"/news/stock/": NEWS}, ["news"])
        assert out["news"][0]["published_at"].startswith("2026-08-06T")

    def test_news_missing_is_empty_not_error(self):
        out = run({"/news/stock/": None}, ["news"])
        assert out["news"] == []

    def test_unparseable_date_is_reported(self):
        """아는 형식 두 개 다 못 맞히면 날짜가 통째로 빈 채로 뜬다 — 다음 진단에서
        바로 형태를 볼 수 있게 샘플로 남겨야 한다."""
        odd_news = [{"items": [{"title": "이상한 날짜 기사", "datetime": "완전히-다른-형식"}]}]
        out = run({"/news/stock/": odd_news}, ["news"])
        assert out["news"][0]["published_at"] is None
        assert out["report"]["samples"].get("news_datetime") == "완전히-다른-형식"

    def test_news_datetime_without_seconds_is_parsed(self):
        """실기기 진단으로 확인된 실제 형태: 초 없이 분까지만 12자리
        (202608100930). news_datetime 샘플로 잡혔던 값 그대로 회귀 테스트."""
        news = [{"items": [{"title": "초 없는 날짜 기사", "datetime": "202608100930",
                            "officeId": "015", "articleId": "1"}]}]
        out = run({"/news/stock/": news}, ["news"])
        assert out["news"][0]["published_at"] is not None
        assert out["news"][0]["published_at"].startswith("2026-08-10T09:30")
        assert "news_datetime" not in out["report"]["samples"]

    def test_news_sorted_newest_first(self):
        """네이버가 순서를 뒤죽박죽으로 줘도 화면엔 최신순으로 나와야 한다."""
        mixed = [
            {"items": [{"title": "오래된 기사", "datetime": "20260805090000",
                        "officeId": "015", "articleId": "1"}]},
            {"items": [{"title": "가장 최신 기사", "datetime": "20260806144322",
                        "officeId": "018", "articleId": "2"},
                       {"title": "중간 기사", "datetime": "20260806090000",
                        "officeId": "015", "articleId": "3"}]},
        ]
        out = run({"/news/stock/": mixed}, ["news"])
        assert [n["title"] for n in out["news"]] == ["가장 최신 기사", "중간 기사", "오래된 기사"]

    def test_news_without_date_sorts_last(self):
        mixed = [{"items": [
            {"title": "날짜 없는 기사", "officeId": "015", "articleId": "1"},
            {"title": "날짜 있는 기사", "datetime": "20260806090000",
             "officeId": "015", "articleId": "2"},
        ]}]
        out = run({"/news/stock/": mixed}, ["news"])
        assert [n["title"] for n in out["news"]] == ["날짜 있는 기사", "날짜 없는 기사"]


# --------------------------------------------------------------------------
# 시장 구분
#
# 실기기에서 UNKNOWN 이 떴던 자리다. UNKNOWN 이면 코스닥 종목도 코스피와
# 비교하게 되어 분해가 통째로 틀어지므로, 실제로 올 수 있는 모양을 넓게 깐다.
# --------------------------------------------------------------------------

class TestMarketDetection:
    def _market(self, exchange) -> str:
        integration = {k: v for k, v in INTEGRATION.items() if k != "stockExchangeType"}
        if exchange is not None:
            integration["stockExchangeType"] = exchange
        routes = {"/index/KOSPI/basic": INDEX, **ROUTES, "/integration": integration}
        return run(routes, ["quote"])["quote"]["market"]

    @pytest.mark.parametrize("exchange,want", [
        ({"code": "KOSPI", "name": "코스피"}, "KOSPI"),
        ({"name": "코스피"}, "KOSPI"),                    # code 가 없는 경우
        ({"text": "코스닥"}, "KOSDAQ"),
        ("KOSDAQ", "KOSDAQ"),                             # 평면 문자열
        ("kospi", "KOSPI"),                               # 소문자
        ({"code": "KONEX"}, "KONEX"),
    ])
    def test_variants(self, exchange, want):
        assert self._market(exchange) == want

    def test_unknown_leaves_a_sample(self):
        """못 읽었으면 응답을 남겨야 다음 번에 스크린샷 한 장으로 고칠 수 있다."""
        integration = {k: v for k, v in INTEGRATION.items() if k != "stockExchangeType"}
        routes = {"/index/KOSPI/basic": INDEX, **ROUTES, "/integration": integration}
        got = run(routes, ["quote"])
        assert got["quote"]["market"] == "UNKNOWN"
        assert "market" in got["report"]["samples"]


# --------------------------------------------------------------------------
# 수급 / 공매도
# --------------------------------------------------------------------------

TREND = [
    {"bizdate": "20260806", "foreignerPureBuyQuant": "-1,200,000",
     "organPureBuyQuant": "300,000", "individualPureBuyQuant": "900,000",
     "foreignerHoldRatio": "50.12"},
    {"bizdate": "20260805", "foreignerPureBuyQuant": "-800,000",
     "organPureBuyQuant": "-100,000", "individualPureBuyQuant": "900,000"},
]

KRX_ISIN = {"block1": [{"full_code": "KR7005930003", "short_code": "005930"}]}

# KRX 는 과거->현재 순으로 준다. 파서가 최신순으로 뒤집어야 한다.
KRX_TRADES = {"OutBlock_1": [
    {"TRD_DD": "2026/08/04", "CVSRTSELL_TRDVOL": "700,000", "TRDVAL_WT": "6.0"},
    {"TRD_DD": "2026/08/05", "CVSRTSELL_TRDVOL": "1,500,000",
     "CVSRTSELL_TRDVAL": "350,000,000,000", "TRDVAL_WT": "12.4"},
]}
KRX_BALANCE = {"OutBlock_1": [{"TRD_DD": "2026/08/05", "BAL_RTO": "1.85"}]}

# 본문(bld)으로 갈리는 POST 픽스처.
KRX_POST = {
    "finder_srtisu": KRX_ISIN,
    "MDCSTAT30101": KRX_TRADES,
    "MDCSTAT30501": KRX_BALANCE,
}

FRGN_HTML = """
<table><tr><th>날짜</th><th>종가</th></tr>
<tr><td class="tc">2026.08.06</td><td>228,500</td>
    <td><span class="blind">하락</span> 17,500</td><td>-7.11%</td>
    <td>21,854,734</td><td>+300,000</td><td>-1,200,000</td>
    <td>2,990,000,000</td><td>50.12</td></tr>
<tr><td colspan="9">&nbsp;</td></tr></table>
"""

class TestSupplyDemand:
    def _supply(self, extra: dict, post: dict | None = None) -> dict:
        routes = {"/index/KOSPI/basic": INDEX, **ROUTES, **extra}
        return run(routes, ["supply"], postRoutes=KRX_POST if post is None else post)

    def test_json_endpoint(self):
        s = self._supply({"/trend": TREND})["supply"]
        assert s["today"]["foreign"] == -1_200_000
        assert s["today"]["unit"] == "주"
        assert s["today"]["date"] == "2026-08-06"
        assert len(s["history"]) == 2

    def test_krx_short_selling(self):
        """네이버 공매도는 죽었다. KRX 에서 받아 최신순으로 정렬돼야 한다."""
        s = self._supply({"/trend": TREND})["supply"]
        assert s["short"]["date"] == "2026-08-05"
        assert s["short"]["ratio"] == 12.4
        assert s["short"]["balance_ratio"] == 1.85
        assert [r["date"] for r in s["short_history"]] == ["2026-08-05", "2026-08-04"]

    def test_flows_html_fallback(self):
        """수급 JSON 이 죽어도 오래된 HTML 화면에서 긁어온다."""
        s = self._supply({"frgn.naver": FRGN_HTML})["supply"]
        assert s["today"]["foreign"] == -1_200_000
        assert s["today"]["institution"] == 300_000

    def test_amount_unit_preserved(self):
        rows = [{"bizdate": "20260806", "foreignerPureBuyAmount": "-274,000,000,000"}]
        s = self._supply({"/trend": rows})["supply"]
        assert s["today"]["unit"] == "원" and s["today"]["foreign"] == -274_000_000_000

    def test_all_endpoints_down(self):
        s = self._supply({}, post={})["supply"]
        assert s["today"] is None and s["short"] is None and s["history"] == []

    def test_krx_failure_does_not_break_flows(self):
        """공매도가 죽어도 수급은 나와야 한다."""
        s = self._supply({"/trend": TREND}, post={})["supply"]
        assert s["today"] is not None and s["short"] is None

    def test_unreadable_response_leaves_a_sample(self):
        got = self._supply({"/trend": {"unexpected": [{"a": 1}]}})
        assert "trend" in got["report"]["samples"]
        assert "unexpected" in got["report"]["samples"]["trend"]
