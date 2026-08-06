"""귀인 엔진 테스트.

픽스처는 2026-08-06 장중(14:53) 실제 시세를 그대로 쓴다. 반도체가 시장보다
더 깊게 빠진 날이라 시장/업종/종목고유 분해가 실제로 작동하는지 보기 좋다.
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.analysis.attribution import (  # noqa: E402
    analyze,
    categorize,
    decompose,
    score_news,
    tone,
)
from server.models import (  # noqa: E402
    InvestorFlow, MarketContext, NewsItem, Quote, ShortSale, SupplyDemand,
)


def samsung() -> Quote:
    return Quote(
        code="005930", name="삼성전자", price=228500, change=-17500, change_rate=-7.11,
        market="KOSPI", sector_name="전기·전자",
        open=241500, high=246000, low=228000,
        volume=21854734, trading_value=5112648725750, market_cap=13358747,
        week52_high=374500, week52_low=67500, source="KIS",
    )


def hynix() -> Quote:
    return Quote(
        code="000660", name="SK하이닉스", price=1498000, change=-170000, change_rate=-10.19,
        market="KOSPI", sector_name="전기·전자",
        open=1600000, high=1606000, low=1494000,
        volume=4177590, week52_high=2987000, week52_low=245000, source="KIS",
    )


def kospi_context(**overrides) -> MarketContext:
    base = dict(
        index_name="KOSPI", index_rate=-4.97, index_price=6270.11,
        advances=418, declines=456,
        sector_name="전기·전자", sector_rate=-8.65,   # 삼전/하이닉스 가중 평균 근사
        peers=[hynix()], avg_volume_20d=12_000_000, beta=1.0,
    )
    base.update(overrides)
    return MarketContext(**base)


class TestDecompose:
    def test_components_sum_to_stock_rate(self):
        """분해는 항등식이어야 한다 — 합이 실제 등락률과 일치."""
        q, ctx = samsung(), kospi_context()
        m, s, i = decompose(q, ctx)
        assert m.value + s.value + i.value == pytest.approx(q.change_rate, abs=1e-9)

    def test_shares_sum_to_one(self):
        m, s, i = decompose(samsung(), kospi_context())
        assert m.share + s.share + i.share == pytest.approx(1.0)

    def test_no_sector_data_folds_into_idiosyncratic(self):
        """업종 데이터가 없으면 잔차는 전부 종목고유로 간다."""
        q = samsung()
        ctx = kospi_context(sector_rate=None, peers=[])
        m, s, i = decompose(q, ctx)
        assert s.value == 0.0
        assert m.value + i.value == pytest.approx(q.change_rate, abs=1e-9)

    def test_beta_scales_market_component(self):
        q = samsung()
        m1, _, _ = decompose(q, kospi_context(beta=1.0))
        m2, _, _ = decompose(q, kospi_context(beta=1.5))
        assert m2.value == pytest.approx(m1.value * 1.5)


class TestAnalyze:
    def test_samsung_on_semis_selloff_decomposition(self):
        """지수 -4.97%, 업종 -8.65%, 종목 -7.11%인 날의 실제 분해값."""
        a = analyze(samsung(), kospi_context())
        assert a.market.value == pytest.approx(-4.97)
        assert a.sector.value == pytest.approx(-3.68)
        assert a.idiosyncratic.value == pytest.approx(1.54)
        # 시장 성분(4.97)이 업종초과(3.68)보다 크므로 주 원인은 시장이다.
        assert a.driver == "MARKET"

    def test_material_secondary_driver_appears_in_headline(self):
        """'시장 탓'으로 끝내면 안 된다. 업종이 시장보다 더 빠진 사실도 실려야 한다."""
        a = analyze(samsung(), kospi_context())
        assert "시장 전체 흐름" in a.headline
        assert "업종" in a.headline and "-3.68%p" in a.headline

    def test_negligible_secondary_driver_omitted(self):
        """2순위가 미미하면 헤드라인을 어지럽히지 않는다."""
        q = samsung()
        q.change_rate = -5.10
        a = analyze(q, kospi_context(sector_rate=-5.05))
        assert a.driver == "MARKET"
        assert "겹쳤습니다" not in a.headline

    def test_samsung_outperforms_its_sector(self):
        """삼전(-7.11)은 업종(-8.65)보다 덜 빠졌다 = 고유 성분은 플러스."""
        a = analyze(samsung(), kospi_context())
        assert a.idiosyncratic.value > 0

    def test_market_driven_when_stock_tracks_index(self):
        q = samsung()
        q.change_rate = -5.0
        a = analyze(q, kospi_context(sector_rate=-5.05))
        assert a.driver == "MARKET"

    def test_idiosyncratic_when_stock_diverges_hard(self):
        """시장/업종은 멀쩡한데 혼자 +18% 간 경우."""
        q = samsung()
        q.change_rate = 18.0
        q.open = 230000
        q.price = 260000
        a = analyze(q, kospi_context(index_rate=0.3, sector_rate=0.5))
        assert a.driver == "IDIOSYNCRATIC"
        assert a.confidence > 0.7

    def test_flat_stock_gets_low_confidence(self):
        q = samsung()
        q.change_rate = 0.2
        a = analyze(q, kospi_context())
        assert a.confidence < 0.3

    def test_confidence_drops_without_index_data(self):
        full = analyze(samsung(), kospi_context()).confidence
        thin = analyze(samsung(), kospi_context(index_rate=None)).confidence
        assert thin < full


class TestTiming:
    def test_gap_down_is_premarket(self):
        """전일 246,000 -> 시가 241,500 갭하락 후 장중 소폭 이동."""
        q = samsung()
        q.price, q.open, q.change_rate = 240000, 241500, -2.0
        q.prev_close = 246000
        a = analyze(q, kospi_context())
        assert a.timing == "PREMARKET"
        assert any(s.key == "gap" for s in a.signals)

    def test_intraday_collapse_is_intraday(self):
        """시가는 전일과 비슷한데 장중에 무너진 경우."""
        q = samsung()
        q.prev_close, q.open, q.price, q.change_rate = 246000, 245800, 228500, -7.11
        a = analyze(q, kospi_context())
        assert a.timing == "INTRADAY"
        assert any(s.key == "intraday_move" for s in a.signals)

    def test_unknown_without_open(self):
        q = samsung()
        q.open = None
        a = analyze(q, kospi_context())
        assert a.timing == "UNKNOWN"


class TestSignals:
    def test_volume_surge_detected(self):
        # 21.8M vs 20일 평균 12M = 1.8배 -> 임계값(2.5) 미달
        a = analyze(samsung(), kospi_context())
        assert not any(s.key == "volume_surge" for s in a.signals)
        # 평균을 5M으로 낮추면 4.4배 -> 감지
        a2 = analyze(samsung(), kospi_context(avg_volume_20d=5_000_000))
        assert any(s.key == "volume_surge" for s in a2.signals)

    def test_trading_near_low_flagged(self):
        """현재가 228,500이 저가 228,000 바로 위 = 저가권."""
        a = analyze(samsung(), kospi_context())
        assert any(s.key == "at_low" for s in a.signals)

    def test_breadth_signal_on_weak_market(self):
        a = analyze(samsung(), kospi_context(advances=100, declines=800))
        assert any(s.key == "breadth" for s in a.signals)

    def test_peers_listed(self):
        a = analyze(samsung(), kospi_context())
        peer_sig = next(s for s in a.signals if s.key == "peers")
        assert "SK하이닉스" in peer_sig.text

    def test_headline_mentions_driver(self):
        a = analyze(samsung(), kospi_context())
        assert "삼성전자" in a.headline and "-7.11%" in a.headline


class TestNewsScoring:
    def test_categorize(self):
        assert "소송/규제" in categorize("삼성전자, 넷리스트와 특허 소송 합의")
        assert "수급" in categorize("단일종목 레버리지 ETF 거래 40%가 외국인")
        assert "주주환원" in categorize("삼성전자·SK하이닉스, 주주환원 확대 검토")
        assert categorize("오늘의 날씨") == []

    def test_tone(self):
        assert tone("삼성전자 급등, 사상 최대 수주") > 0
        assert tone("실적 급락 우려에 약세") < 0
        assert tone("삼성전자 임원 소유주식수 변동") == 0

    def test_market_driven_ranks_macro_news_higher(self):
        """시장 주도 국면에서는 수급/매크로 기사가 위로 올라와야 한다."""
        q, ctx = samsung(), kospi_context(sector_rate=-5.0)
        a = analyze(q, ctx)
        news = [
            NewsItem(title="삼성전자, 임원ㆍ주요주주 특정증권등 소유주식수 변동"),
            NewsItem(title="코스피 장중 낙폭 확대에 매도 사이드카…외국인 2.8조 순매도"),
        ]
        ranked = score_news(news, q, a)
        assert "사이드카" in ranked[0]["title"]

    def test_idiosyncratic_ranks_hard_catalyst_higher(self):
        q = samsung()
        q.change_rate = 15.0
        a = analyze(q, kospi_context(index_rate=0.1, sector_rate=0.2))
        news = [
            NewsItem(title="코스피 강보합 마감"),
            NewsItem(title="삼성전자, 대규모 수주 계약 체결…사상 최대"),
        ]
        ranked = score_news(news, q, a)
        assert "수주" in ranked[0]["title"]

    def test_recent_news_wins_when_intraday(self):
        q = samsung()
        q.prev_close, q.open, q.price = 246000, 245800, 228500
        a = analyze(q, kospi_context())
        now = datetime(2026, 8, 6, 14, 53)
        news = [
            NewsItem(title="삼성전자 실적 우려 확대", published_at=datetime(2026, 8, 6, 9, 5)),
            NewsItem(title="삼성전자 실적 우려 확대", published_at=datetime(2026, 8, 6, 14, 40)),
        ]
        ranked = score_news(news, q, a, now=now)
        assert ranked[0]["time"] == "14:40"

    def test_empty_news_is_safe(self):
        a = analyze(samsung(), kospi_context())
        assert score_news([], samsung(), a) == []


# --------------------------------------------------------------------------
# 수급 / 공매도
#
# 여기서 가장 위험한 실수는 '어제 수급으로 오늘을 설명하는 것'이다. 그래서
# 값이 맞는지보다 기준 날짜가 문구에 드러나는지를 더 촘촘히 본다.
# --------------------------------------------------------------------------

TODAY = datetime.now().strftime("%Y-%m-%d")
YESTERDAY = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")


def flow(date: str = TODAY, foreign: float = -1_200_000, institution: float = 300_000,
         individual: float = 900_000, unit: str = "주", provisional: bool = True) -> InvestorFlow:
    return InvestorFlow(date=date, foreign=foreign, institution=institution,
                        individual=individual, unit=unit,  # type: ignore[arg-type]
                        provisional=provisional)


def supply(**kw) -> SupplyDemand:
    today = kw.pop("today", flow())
    history = kw.pop("history", [today] if today else [])
    return SupplyDemand(today=today, history=history, **kw)


def signal_of(attribution, key: str):
    return next((s for s in attribution.signals if s.key == key), None)


class TestSupplySignals:
    def test_lists_all_three_investors(self):
        a = analyze(samsung(), kospi_context(supply=supply()))
        s = signal_of(a, "supply")
        assert s is not None
        for who in ("외국인", "기관", "개인"):
            assert who in s.text

    def test_quantity_is_marked_as_an_estimate(self):
        """수량(주)에 현재가를 곱한 값은 추정이다 — '약'을 빼면 확정치로 읽힌다."""
        s = signal_of(analyze(samsung(), kospi_context(supply=supply())), "supply")
        assert s is not None and "약 " in s.text

    def test_amount_unit_is_not_marked_estimate(self):
        f = flow(unit="원", foreign=-274_000_000_000, institution=None, individual=None)
        s = signal_of(analyze(samsung(), kospi_context(supply=supply(today=f))), "supply")
        assert s is not None
        assert "외국인 -2,740억" in s.text and "약" not in s.text

    def test_marks_intraday_numbers_as_provisional(self):
        s = signal_of(analyze(samsung(), kospi_context(supply=supply())), "supply")
        assert s is not None and "장중 잠정" in s.text

    def test_stale_data_says_when_it_is_from(self):
        f = flow(date=YESTERDAY, provisional=False)
        s = signal_of(analyze(samsung(), kospi_context(supply=supply(today=f))), "supply")
        assert s is not None
        assert YESTERDAY in s.text and "최근 수급" in s.text
        assert s.weight < 1.0, "오늘 것이 아니면 비중을 낮춰야 한다"

    def test_dominant_seller_aligned_with_price(self):
        """외국인이 팔고 주가도 빠졌으면 수급이 움직임을 밀었다고 말할 수 있다."""
        s = signal_of(analyze(samsung(), kospi_context(supply=supply())), "supply_side")
        assert s is not None
        assert "외국인" in s.text and "순매도" in s.text and "일치" in s.text

    def test_dominant_buyer_against_price_is_flagged(self):
        f = flow(foreign=1_200_000, institution=-200_000, individual=-1_000_000)
        s = signal_of(analyze(samsung(), kospi_context(supply=supply(today=f))), "supply_side")
        assert s is not None and "반대" in s.text

    def test_small_flows_do_not_get_a_headline_signal(self):
        f = flow(foreign=-1000, institution=500, individual=500)
        a = analyze(samsung(), kospi_context(supply=supply(today=f)))
        assert signal_of(a, "supply_side") is None
        assert signal_of(a, "supply") is not None, "규모가 작아도 수치 자체는 보여준다"

    def test_share_of_trading_value(self):
        """규모는 절대금액보다 '거래대금 대비 몇 %'가 훨씬 잘 와닿는다."""
        f = flow(foreign=-3_000_000)     # 약 6,855억 = 당일 거래대금의 13%
        s = signal_of(analyze(samsung(), kospi_context(supply=supply(today=f))), "supply_side")
        assert s is not None and "당일 거래대금의 13%" in s.text

    def test_modest_flow_omits_the_share(self):
        """거래대금의 10% 도 안 되는 수급을 '거래대금의 5%'라고 굳이 적으면 잡음이다."""
        s = signal_of(analyze(samsung(), kospi_context(supply=supply())), "supply_side")
        assert s is not None and "거래대금의" not in s.text

    def test_stale_data_never_claims_to_drive_today(self):
        f = flow(date=YESTERDAY, provisional=False)
        a = analyze(samsung(), kospi_context(supply=supply(today=f)))
        assert signal_of(a, "supply_side") is None

    def test_streak(self):
        rows = [flow(), flow(date=YESTERDAY, foreign=-800_000),
                flow(date="2026-08-04", foreign=-500_000)]
        a = analyze(samsung(), kospi_context(supply=supply(history=rows)))
        s = signal_of(a, "supply_streak")
        assert s is not None and "3일 연속 순매도" in s.text

    def test_streak_breaks_on_direction_change(self):
        rows = [flow(), flow(date=YESTERDAY, foreign=-800_000), flow(date="2026-08-04", foreign=+500_000)]
        a = analyze(samsung(), kospi_context(supply=supply(history=rows)))
        assert signal_of(a, "supply_streak") is None, "2일은 추세라 부르지 않는다"

    def test_no_supply_no_signals(self):
        a = analyze(samsung(), kospi_context(supply=None))
        assert not [s for s in a.signals if s.key.startswith("supply")]

    def test_missing_investor_is_skipped_not_zeroed(self):
        f = flow(institution=None, individual=None)
        s = signal_of(analyze(samsung(), kospi_context(supply=supply(today=f))), "supply")
        assert s is not None and "기관" not in s.text


class TestShortSellingSignals:
    def _supply(self, ratios: list[float], date: str = YESTERDAY) -> SupplyDemand:
        rows = [ShortSale(date=date if i == 0 else f"2026-07-{20 + i:02d}", ratio=r)
                for i, r in enumerate(ratios)]
        return SupplyDemand(today=flow(), history=[flow()], short=rows[0], short_history=rows)

    def test_reports_ratio_and_baseline(self):
        s = signal_of(analyze(samsung(), kospi_context(
            supply=self._supply([12.4, 6.0, 5.0, 6.0]))), "short")
        assert s is not None
        assert "12.4%" in s.text and "직전 평균" in s.text

    def test_flags_a_surge(self):
        a = analyze(samsung(), kospi_context(supply=self._supply([12.4, 6.0, 5.0, 6.0])))
        s = signal_of(a, "short")
        assert s is not None and "확연히 늘었습니다" in s.text and s.weight >= 1.5

    def test_quiet_short_is_not_flagged(self):
        s = signal_of(analyze(samsung(), kospi_context(
            supply=self._supply([6.1, 6.0, 5.9, 6.2]))), "short")
        assert s is not None and "확연히" not in s.text

    def test_says_yesterdays_data_is_yesterdays(self):
        """장중에 당일 공매도는 존재하지 않는다. 이 문구가 빠지면 오해를 부른다."""
        s = signal_of(analyze(samsung(), kospi_context(supply=self._supply([12.4, 6.0]))), "short")
        assert s is not None
        assert "장 마감 후에 공시" in s.text and YESTERDAY in s.text

    def test_todays_data_needs_no_disclaimer(self):
        s = signal_of(analyze(samsung(), kospi_context(
            supply=self._supply([12.4, 6.0], date=TODAY))), "short")
        assert s is not None and "당일" in s.text and "장 마감 후에 공시" not in s.text

    def test_balance_ratio(self):
        sd = SupplyDemand(short=ShortSale(date=YESTERDAY, ratio=8.0, balance_ratio=1.85),
                          short_history=[ShortSale(date=YESTERDAY, ratio=8.0)])
        s = signal_of(analyze(samsung(), kospi_context(supply=sd)), "short_balance")
        assert s is not None and "1.85%" in s.text

    def test_no_short_data_no_signal(self):
        a = analyze(samsung(), kospi_context(supply=supply()))
        assert signal_of(a, "short") is None


class TestSupplyInHeadlineAndConfidence:
    def test_headline_names_the_dominant_flow(self):
        a = analyze(samsung(), kospi_context(supply=supply()))
        assert "수급은 외국인" in a.headline and "순매도가 주도했습니다" in a.headline

    def test_headline_keeps_the_decomposition_first(self):
        """수급은 덧붙이는 말이지 분해를 대체하지 않는다."""
        a = analyze(samsung(), kospi_context(supply=supply()))
        assert a.headline.index("주 원인은") < a.headline.index("수급은")

    def test_headline_silent_without_fresh_supply(self):
        f = flow(date=YESTERDAY, provisional=False)
        a = analyze(samsung(), kospi_context(supply=supply(today=f)))
        assert "수급은" not in a.headline

    def test_aligned_supply_raises_confidence(self):
        plain = analyze(samsung(), kospi_context())
        withflow = analyze(samsung(), kospi_context(supply=supply()))
        assert withflow.confidence > plain.confidence

    def test_supply_does_not_touch_the_identity(self):
        """수급은 성분이 아니다 — 분해 합은 그대로 등락률이어야 한다."""
        a = analyze(samsung(), kospi_context(supply=supply()))
        total = a.market.value + a.sector.value + a.idiosyncratic.value
        assert total == pytest.approx(samsung().change_rate, abs=0.01)
