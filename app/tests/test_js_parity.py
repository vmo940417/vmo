"""파이썬 구현과 JS 이식본이 같은 답을 내는지 확인한다.

안드로이드 앱은 attribution.js 로 분석하고, 그건 attribution.py 를 손으로 옮긴
것이다. 손으로 옮긴 코드는 반드시 어딘가 갈라지므로, 같은 픽스처를 양쪽에 넣고
결과를 통째로 비교한다. 상수 하나만 어긋나도 여기서 잡힌다.

node 가 없는 환경에서는 건너뛴다(PC 전용 CI 등).
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.analysis.attribution import analyze, score_news  # noqa: E402
from server.models import (  # noqa: E402
    InvestorFlow, MarketContext, NewsItem, Quote, ShortSale, SupplyDemand,
)

HARNESS = Path(__file__).parent / "js" / "parity_harness.mjs"
NOW = datetime(2026, 8, 6, 14, 53)

# 수급 신선도는 실행 시점의 오늘 날짜로 판정한다(파이썬·JS 모두). 픽스처 날짜를
# 2026-08-06 으로 굳혀두면 항상 '옛날 데이터'가 되어 정작 확인하려는 경로를
# 못 밟는다. 그래서 오늘 기준으로 만든다.
TODAY = datetime.now().strftime("%Y-%m-%d")
D1 = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
D2 = (datetime.now() - timedelta(days=2)).strftime("%Y-%m-%d")

FLOWS_TODAY = [
    dict(date=TODAY, foreign=-3_000_000, institution=300_000, individual=2_700_000,
         unit="주", provisional=True),
    dict(date=D1, foreign=-800_000, institution=-100_000, individual=900_000, unit="주"),
    dict(date=D2, foreign=-500_000, institution=200_000, individual=300_000, unit="주"),
]
SHORTS = [
    dict(date=D1, ratio=12.4, balance_ratio=1.85),
    dict(date=D2, ratio=6.0),
    dict(date="2026-07-31", ratio=5.0),
]

SUPPLY_FRESH = dict(today=FLOWS_TODAY[0], history=FLOWS_TODAY,
                    short=SHORTS[0], short_history=SHORTS)
SUPPLY_STALE = dict(today=dict(FLOWS_TODAY[1], provisional=False),
                    history=FLOWS_TODAY[1:], short=SHORTS[0], short_history=SHORTS)
SUPPLY_AMOUNT = dict(today=dict(date=TODAY, foreign=-274_000_000_000, institution=None,
                                individual=None, unit="원", provisional=True),
                     history=[], short=None, short_history=[])

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node 없음")


# 실제 장중에 나올 법한 국면들을 고루 담는다 — 시장 주도, 종목 단독 급등,
# 갭 하락, 장중 붕괴, 데이터 결측, 보합.
CASES: list[dict] = [
    {
        "name": "반도체 동반 급락 (시장 주도)",
        "quote": dict(code="005930", name="삼성전자", price=228500, change=-17500,
                      change_rate=-7.11, open=241500, high=246000, low=228000,
                      volume=21854734, week52_high=374500, week52_low=67500),
        "context": dict(index_name="KOSPI", index_rate=-4.97, sector_name="전기·전자",
                        sector_rate=-8.65, avg_volume_20d=12000000, beta=1.0,
                        advances=418, declines=456),
    },
    {
        "name": "종목 단독 급등",
        "quote": dict(code="000660", name="SK하이닉스", price=260000, change=39000,
                      change_rate=17.65, open=225000, high=262000, low=224000,
                      volume=9000000),
        "context": dict(index_name="KOSPI", index_rate=0.3, sector_name="전기·전자",
                        sector_rate=0.5, avg_volume_20d=2000000, beta=1.0),
    },
    {
        "name": "개장 전 갭 하락",
        "quote": dict(code="035420", name="NAVER", price=240000, change=-6000,
                      change_rate=-2.44, open=241500, prev_close=246000,
                      high=243000, low=239000, volume=1500000),
        "context": dict(index_name="KOSPI", index_rate=-0.5, sector_rate=-1.2,
                        avg_volume_20d=1400000, beta=1.0),
    },
    {
        "name": "장중 붕괴",
        "quote": dict(code="005930", name="삼성전자", price=228500, change=-17500,
                      change_rate=-7.11, open=245800, prev_close=246000,
                      high=246000, low=228000, volume=40000000),
        "context": dict(index_name="KOSPI", index_rate=-1.0, sector_rate=-2.0,
                        avg_volume_20d=12000000, beta=1.0),
    },
    {
        "name": "지수·업종 결측",
        "quote": dict(code="123456", name="어떤종목", price=10000, change=800,
                      change_rate=8.70, open=9300, volume=500000),
        "context": dict(index_name="KOSDAQ", beta=1.0),
    },
    {
        "name": "보합",
        "quote": dict(code="005930", name="삼성전자", price=246200, change=200,
                      change_rate=0.08, open=246000, high=247000, low=245500,
                      volume=8000000),
        "context": dict(index_name="KOSPI", index_rate=0.1, sector_rate=0.15,
                        avg_volume_20d=12000000, beta=1.0),
    },
    {
        "name": "베타 1.5 + 신고가권",
        "quote": dict(code="042700", name="한미반도체", price=99000, change=-9000,
                      change_rate=-8.33, open=104000, high=105000, low=98000,
                      volume=6000000, week52_high=99500, week52_low=30000),
        "context": dict(index_name="KOSPI", index_rate=-3.0, sector_rate=-6.0,
                        avg_volume_20d=1500000, beta=1.5),
    },
    {
        "name": "수급 — 오늘 외국인 대량 순매도",
        "quote": dict(code="005930", name="삼성전자", price=228500, change=-17500,
                      change_rate=-7.11, open=241500, high=246000, low=228000,
                      volume=21854734, trading_value=5112648725750),
        "context": dict(index_name="KOSPI", index_rate=-4.97, sector_name="전기·전자",
                        sector_rate=-8.65, avg_volume_20d=12000000, beta=1.0,
                        supply=SUPPLY_FRESH),
    },
    {
        "name": "수급 — 직전 거래일 것만 있음",
        "quote": dict(code="005930", name="삼성전자", price=228500, change=-17500,
                      change_rate=-7.11, open=241500, high=246000, low=228000,
                      volume=21854734, trading_value=5112648725750),
        "context": dict(index_name="KOSPI", index_rate=-4.97, sector_rate=-8.65,
                        avg_volume_20d=12000000, beta=1.0, supply=SUPPLY_STALE),
    },
    {
        "name": "수급 — 금액 단위",
        "quote": dict(code="000660", name="SK하이닉스", price=1498000, change=-170000,
                      change_rate=-10.19, open=1600000, high=1606000, low=1494000,
                      volume=4177590),
        "context": dict(index_name="KOSPI", index_rate=-4.97, sector_rate=-8.65,
                        avg_volume_20d=2000000, beta=1.0, supply=SUPPLY_AMOUNT),
    },
]

NEWS = [
    {"title": "삼성전자, 넷리스트와 특허 소송 합의", "published_at": "2026-08-06T14:43:00"},
    {"title": "코스피 장중 낙폭 확대에 매도 사이드카…외국인 2.8조 순매도",
     "published_at": "2026-08-06T13:11:00"},
    {"title": "삼성전자·SK하이닉스, 역대급 실적에 주주환원 확대 검토",
     "published_at": "2026-08-06T14:07:00"},
    {"title": "[특징주] SK하이닉스, 글로벌 반도체 투자 심리 위축에 9%대 급락",
     "published_at": "2026-08-06T14:25:00"},
    {"title": "오후장 기술적 분석 특징주 B(코스피)", "published_at": "2026-08-06T14:08:00"},
    {"title": "삼성전자 목표주가 하향, 투자의견 유지", "published_at": "2026-08-06T09:05:00"},
    {"title": "날짜 없는 기사", "published_at": None},
]


def run_js(payload: dict) -> dict:
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True, text=True, timeout=60,
    )
    assert proc.returncode == 0, f"JS 하니스 실패:\n{proc.stderr}"
    return json.loads(proc.stdout)


def py_supply(raw: dict | None) -> SupplyDemand | None:
    """JSON 픽스처를 파이썬 데이터클래스로. JS 쪽은 같은 dict 를 그대로 쓴다."""
    if raw is None:
        return None
    return SupplyDemand(
        today=InvestorFlow(**raw["today"]) if raw.get("today") else None,
        history=[InvestorFlow(**r) for r in raw.get("history") or []],
        short=ShortSale(**raw["short"]) if raw.get("short") else None,
        short_history=[ShortSale(**r) for r in raw.get("short_history") or []],
    )


def py_analyze(case: dict):
    quote = Quote(**case["quote"])
    ctx = MarketContext(**{**case["context"], "supply": py_supply(case["context"].get("supply"))})
    return quote, ctx, analyze(quote, ctx)


@pytest.fixture(scope="module")
def js():
    payload = {
        "now": NOW.isoformat(),
        "cases": [{**c, "news": NEWS if c["name"].startswith("반도체") else None}
                  for c in CASES],
    }
    return {c["name"]: c for c in run_js(payload)["cases"]}


@pytest.mark.parametrize("case", CASES, ids=[c["name"] for c in CASES])
class TestAttributionParity:
    def test_driver(self, case, js):
        _, _, py = py_analyze(case)
        assert js[case["name"]]["attribution"]["driver"] == py.driver

    def test_components(self, case, js):
        _, _, py = py_analyze(case)
        got = js[case["name"]]["attribution"]["components"]
        want = py.as_dict()["components"]
        for part in ("market", "sector", "idiosyncratic"):
            assert got[part]["value"] == pytest.approx(want[part]["value"], abs=0.01), part
            assert got[part]["share"] == pytest.approx(want[part]["share"], abs=0.002), part

    def test_components_still_sum(self, case, js):
        """이식본에서도 항등식이 깨지면 안 된다."""
        c = js[case["name"]]["attribution"]["components"]
        total = c["market"]["value"] + c["sector"]["value"] + c["idiosyncratic"]["value"]
        assert total == pytest.approx(case["quote"]["change_rate"], abs=0.02)

    def test_timing(self, case, js):
        _, _, py = py_analyze(case)
        assert js[case["name"]]["attribution"]["timing"] == py.timing

    def test_confidence(self, case, js):
        _, _, py = py_analyze(case)
        assert js[case["name"]]["attribution"]["confidence"] == pytest.approx(
            py.confidence, abs=0.01)

    def test_headline(self, case, js):
        _, _, py = py_analyze(case)
        assert js[case["name"]]["attribution"]["headline"] == py.headline

    def test_signals(self, case, js):
        """정황 문구는 사용자가 그대로 읽는 텍스트라 한 글자도 갈라지면 안 된다."""
        _, _, py = py_analyze(case)
        got = [(s["key"], s["text"]) for s in js[case["name"]]["attribution"]["signals"]]
        want = [(s.key, s.text) for s in py.signals]
        assert got == want


class TestNewsParity:
    NAME = "반도체 동반 급락 (시장 주도)"

    @pytest.fixture
    def both(self, js):
        case = next(c for c in CASES if c["name"] == self.NAME)
        quote, _, attribution = py_analyze(case)
        items = [NewsItem(title=n["title"],
                          published_at=datetime.fromisoformat(n["published_at"])
                          if n["published_at"] else None)
                 for n in NEWS]
        return js[self.NAME]["news"], score_news(items, quote, attribution, now=NOW)

    def test_same_order(self, both):
        got, want = both
        assert [n["title"] for n in got] == [n["title"] for n in want]

    def test_same_scores(self, both):
        got, want = both
        for g, w in zip(got, want):
            assert g["score"] == pytest.approx(w["score"], abs=0.01), g["title"]

    def test_same_categories(self, both):
        got, want = both
        for g, w in zip(got, want):
            assert g["categories"] == w["categories"], g["title"]

    def test_same_tone(self, both):
        got, want = both
        for g, w in zip(got, want):
            assert g["tone"] == w["tone"], g["title"]

    def test_same_times(self, both):
        got, want = both
        assert [n["time"] for n in got] == [n["time"] for n in want]


class TestNewsTimeGuardsAgainstInvalidDates:
    """날짜 파싱이 깨진 값을 넘겨도 'NaN/NaN NaN:NaN' 같은 쓰레기가 찍히면 안 된다.

    실기기에서 새 날짜 형식을 만나면 이 경로를 타게 된다 — 정규식이 못 맞히면
    파이썬 쪽은 애초에 None 으로 떨어지지만(datetime.fromisoformat 이 예외를
    던지므로 이 사례는 파이썬과 나란히 비교할 수 없다), JS 의 hhmm() 은 자체
    방어가 있어야 한다.
    """

    NAME = "반도체 동반 급락 (시장 주도)"

    def test_invalid_date_falls_back_to_placeholder(self):
        case = next(c for c in CASES if c["name"] == self.NAME)
        payload = {
            "now": NOW.isoformat(),
            "cases": [{**case, "news": [
                {"title": "날짜가 깨진 기사", "published_at": "이건-날짜가-아니다"},
            ]}],
        }
        result = run_js(payload)["cases"][0]["news"][0]
        assert result["time"] == "--/-- --:--"
