"""귀인 엔진 테스트.

픽스처는 2026-08-06 장중(14:53) 실제 시세를 그대로 쓴다. 반도체가 시장보다
더 깊게 빠진 날이라 시장/업종/종목고유 분해가 실제로 작동하는지 보기 좋다.
"""

from __future__ import annotations

import sys
from datetime import datetime
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
from server.models import MarketContext, NewsItem, Quote  # noqa: E402


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
