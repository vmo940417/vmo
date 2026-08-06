"""등락률 귀인 분해 + 장중 신호 추출.

이 앱의 핵심 질문은 "왜 움직였나"인데, 그 앞에 반드시 답해야 하는 질문이
"누구 탓인가"다. 시장이 다 빠져서 같이 빠진 종목에 개별 재료를 갖다 붙이면
그건 그냥 그럴듯한 헛소리가 된다. 그래서 뉴스를 읽기 전에 등락률을 먼저
세 성분으로 쪼갠다.

    종목등락 = 시장성분 + 업종초과성분 + 종목고유성분

    시장성분     = beta x 지수등락
    업종초과성분 = 업종등락 - beta x 지수등락
    종목고유성분 = 종목등락 - 업종등락

세 성분의 합은 항상 종목 등락률과 정확히 일치한다(항등식). 업종 데이터가
없으면 업종초과성분을 0으로 두고 나머지를 종목고유로 넘긴다.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal, Optional

from ..models import MarketContext, NewsItem, Quote, SupplyDemand

Driver = Literal["MARKET", "SECTOR", "IDIOSYNCRATIC"]

DRIVER_LABEL: dict[Driver, str] = {
    "MARKET": "시장 전체",
    "SECTOR": "업종",
    "IDIOSYNCRATIC": "종목 고유",
}

# 장중 이동의 '언제'를 가르는 임계값들. 종목마다 변동성이 달라서 절대값으로는
# 못 자르고, 당일 총 이동폭 대비 비율로 판단한다.
GAP_DOMINANT_SHARE = 0.6      # 갭이 당일 이동의 60% 이상이면 개장 전 재료
INTRADAY_DOMINANT_SHARE = 0.6  # 장중 이동이 60% 이상이면 장중 재료
VOLUME_SURGE_RATIO = 2.5       # 20일 평균 대비 배수
NOISE_RATE = 0.7               # 이 아래는 사실상 보합으로 본다(%)

# 수급 임계값
FLOW_BIG_EOK = 300.0           # 이 이상이면 '대규모' 순매수/순매도로 본다(억원)
FLOW_SHARE_OF_VALUE = 0.10     # 당일 거래대금의 10% 이상이면 수급이 시세를 민 것
STREAK_MIN_DAYS = 3            # 연속 순매도/순매수 일수
SHORT_SURGE_RATIO = 1.5        # 최근 평균 공매도 비중 대비 배수
SHORT_HIGH_RATIO = 10.0        # 공매도 비중 자체가 이 % 를 넘으면 언급


@dataclass
class Component:
    name: str
    value: float          # 퍼센트포인트 기여도
    share: float          # 절대값 기준 기여 비중 0~1

    def as_dict(self) -> dict:
        return {"name": self.name, "value": round(self.value, 2), "share": round(self.share, 3)}


@dataclass
class Signal:
    """사람이 읽을 수 있는 정황 증거 한 줄."""

    key: str
    text: str
    weight: float = 1.0   # 원인 설명에서의 중요도

    def as_dict(self) -> dict:
        return {"key": self.key, "text": self.text, "weight": self.weight}


@dataclass
class Attribution:
    stock_rate: float
    market: Component
    sector: Component
    idiosyncratic: Component
    driver: Driver
    confidence: float
    signals: list[Signal]
    timing: str                   # PREMARKET / INTRADAY / MIXED / FLAT
    headline: str

    @property
    def driver_label(self) -> str:
        return DRIVER_LABEL[self.driver]

    def as_dict(self) -> dict:
        return {
            "stock_rate": round(self.stock_rate, 2),
            "driver": self.driver,
            "driver_label": self.driver_label,
            "confidence": round(self.confidence, 2),
            "timing": self.timing,
            "headline": self.headline,
            "components": {
                "market": self.market.as_dict(),
                "sector": self.sector.as_dict(),
                "idiosyncratic": self.idiosyncratic.as_dict(),
            },
            "signals": [s.as_dict() for s in self.signals],
        }


def _pct(numerator: float, denominator: float) -> float:
    return (numerator / denominator) * 100.0 if denominator else 0.0


def decompose(quote: Quote, ctx: MarketContext) -> tuple[Component, Component, Component]:
    """등락률을 시장/업종초과/종목고유 세 성분으로 분해한다."""
    stock_rate = quote.change_rate
    index_rate = ctx.index_rate if ctx.index_rate is not None else 0.0
    beta = ctx.beta if ctx.beta else 1.0

    market_v = beta * index_rate
    if ctx.sector_rate is not None:
        sector_v = ctx.sector_rate - market_v
        idio_v = stock_rate - ctx.sector_rate
    else:
        sector_v = 0.0
        idio_v = stock_rate - market_v

    total = abs(market_v) + abs(sector_v) + abs(idio_v)
    if total == 0:
        shares = (0.0, 0.0, 0.0)
    else:
        shares = (abs(market_v) / total, abs(sector_v) / total, abs(idio_v) / total)

    return (
        Component("시장", market_v, shares[0]),
        Component("업종초과", sector_v, shares[1]),
        Component("종목고유", idio_v, shares[2]),
    )


def _classify_timing(quote: Quote) -> tuple[str, Optional[float], Optional[float]]:
    """움직임이 개장 전에 났는지 장중에 났는지 가른다.

    갭(전일종가 -> 시가)이 크면 밤사이 재료(해외증시, 장 마감 후 공시)이고,
    시가 -> 현재가 이동이 크면 장중에 뭔가 터진 것이다. 이 구분이 뉴스를
    어느 시간대에서 찾아야 하는지를 결정한다.
    """
    prev = quote.inferred_prev_close
    if prev is None or not prev or quote.open is None:
        return "UNKNOWN", None, None

    gap = _pct(quote.open - prev, prev)
    intraday = _pct(quote.price - quote.open, prev)
    total = abs(gap) + abs(intraday)
    if total == 0:
        return "FLAT", gap, intraday

    if abs(gap) / total >= GAP_DOMINANT_SHARE:
        return "PREMARKET", gap, intraday
    if abs(intraday) / total >= INTRADAY_DOMINANT_SHARE:
        return "INTRADAY", gap, intraday
    return "MIXED", gap, intraday


def _collect_signals(quote: Quote, ctx: MarketContext, timing: str,
                     gap: Optional[float], intraday: Optional[float]) -> list[Signal]:
    signals: list[Signal] = []
    prev = quote.inferred_prev_close

    if timing == "PREMARKET" and gap is not None:
        signals.append(Signal(
            "gap",
            f"시가부터 {gap:+.2f}% 갭으로 출발 — 개장 전(해외증시·전일 장마감 후 공시)에 재료가 나왔을 가능성이 큽니다.",
            weight=1.5,
        ))
    elif timing == "INTRADAY" and intraday is not None:
        signals.append(Signal(
            "intraday_move",
            f"시가 대비 {intraday:+.2f}% 이동 — 장중에 재료가 발생했습니다. 같은 시간대 뉴스를 봐야 합니다.",
            weight=1.5,
        ))
    elif timing == "MIXED" and gap is not None and intraday is not None:
        signals.append(Signal(
            "mixed_move",
            f"갭 {gap:+.2f}% + 장중 {intraday:+.2f}% — 개장 전 재료가 장중에도 이어지고 있습니다.",
            weight=1.0,
        ))

    # 장중 되돌림: 고가/저가와 현재가의 관계
    if quote.high is not None and quote.low is not None and prev and quote.high > quote.low:
        rng = _pct(quote.high - quote.low, prev)
        pos = (quote.price - quote.low) / (quote.high - quote.low)
        if rng >= 3.0:
            signals.append(Signal("range", f"당일 변동폭 {rng:.1f}%p로 매우 넓습니다(고가 {quote.high:,.0f} / 저가 {quote.low:,.0f})."))
        if quote.change_rate < 0 and pos <= 0.2:
            signals.append(Signal("at_low", "저가 부근에서 거래 중 — 매도 압력이 아직 해소되지 않았습니다."))
        elif quote.change_rate < 0 and pos >= 0.7:
            signals.append(Signal("rebound", "저가 대비 상당폭 회복 — 낙폭 과대 인식의 저가 매수가 들어왔습니다."))
        elif quote.change_rate > 0 and pos <= 0.3:
            signals.append(Signal("fade", "고가 대비 밀린 상태 — 상승분을 차익실현에 반납하는 중입니다."))

    # 거래량
    if quote.volume and ctx.avg_volume_20d:
        ratio = quote.volume / ctx.avg_volume_20d
        if ratio >= VOLUME_SURGE_RATIO:
            signals.append(Signal(
                "volume_surge",
                f"거래량이 20일 평균의 {ratio:.1f}배 — 단순 수급이 아니라 명확한 재료에 반응하는 거래량입니다.",
                weight=1.3,
            ))
        elif ratio <= 0.6:
            signals.append(Signal(
                "volume_dry",
                f"거래량이 20일 평균의 {ratio:.1f}배에 그칩니다 — 거래 없이 밀린 것이라 재료보다 수급 공백일 수 있습니다.",
            ))

    # 시장 폭
    breadth = ctx.breadth
    if breadth is not None:
        if breadth <= 0.35:
            signals.append(Signal("breadth", f"시장 전체가 하락 우위입니다(상승 {ctx.advances} / 하락 {ctx.declines}). 개별 이슈로 보기 어렵습니다.", weight=1.2))
        elif breadth >= 0.65:
            signals.append(Signal("breadth", f"시장은 상승 우위입니다(상승 {ctx.advances} / 하락 {ctx.declines})."))

    # 업종 대비 위치
    if ctx.sector_rate is not None:
        rel = quote.change_rate - ctx.sector_rate
        if abs(rel) >= 2.0:
            direction = "더 많이" if rel < 0 else "덜"
            signals.append(Signal(
                "vs_sector",
                f"업종({ctx.sector_name or '동종업계'}) 평균 {ctx.sector_rate:+.2f}% 대비 {abs(rel):.2f}%p {direction} 빠졌습니다 — 종목 고유 요인이 섞여 있습니다."
                if quote.change_rate < 0 else
                f"업종 평균 {ctx.sector_rate:+.2f}% 대비 {abs(rel):.2f}%p 아웃퍼폼 중입니다 — 종목 고유 호재가 있습니다.",
                weight=1.4,
            ))

    # 피어 비교
    if ctx.peers:
        worst = min(ctx.peers, key=lambda p: p.change_rate)
        best = max(ctx.peers, key=lambda p: p.change_rate)
        peer_txt = ", ".join(f"{p.name} {p.change_rate:+.2f}%" for p in ctx.peers[:4])
        signals.append(Signal("peers", f"동종 종목: {peer_txt}"))
        if worst.change_rate < quote.change_rate and best.change_rate > quote.change_rate:
            signals.append(Signal("peer_mid", "동종 종목들도 함께 움직이고 있어 업종 전반의 이슈로 보입니다."))

    signals.extend(_supply_signals(quote, ctx.supply))

    # 52주 위치
    if quote.week52_high and quote.week52_low and quote.week52_high > quote.week52_low:
        pos52 = (quote.price - quote.week52_low) / (quote.week52_high - quote.week52_low)
        if pos52 >= 0.95:
            signals.append(Signal("52w", "52주 신고가권 — 신고가 부담에 따른 차익실현이 나올 수 있는 자리입니다."))
        elif pos52 <= 0.05:
            signals.append(Signal("52w", "52주 신저가권 — 추세적 악재가 누적된 상태입니다."))

    return signals


# --------------------------------------------------------------------------
# 수급 / 공매도
#
# 분해 항등식에는 손대지 않는다. 수급은 등락률의 '성분'이 아니라 그 성분을
# 누가 만들었는지를 말해주는 정황이다. 시장 성분이 컸다는 사실과 외국인이
# 팔았다는 사실은 서로 모순이 아니라 층이 다른 이야기다.
# --------------------------------------------------------------------------

INVESTOR_LABEL = {"foreign": "외국인", "institution": "기관", "individual": "개인"}


def to_eok(value: Optional[float], unit: str, price: Optional[float]) -> Optional[float]:
    """순매수 값을 억원으로 환산. 수량(주)이면 현재가를 곱한 추정치다."""
    if value is None:
        return None
    won = value if unit == "원" else (value * price if price else None)
    return won / 1e8 if won is not None else None


def _flow_txt(value: Optional[float], unit: str, price: Optional[float]) -> str:
    eok = to_eok(value, unit, price)
    if eok is None:
        return "-"
    approx = "약 " if unit == "주" else ""
    return f"{approx}{eok:+,.0f}억"


def _supply_signals(quote: Quote, supply: Optional[SupplyDemand],
                    today: Optional[str] = None) -> list[Signal]:
    signals: list[Signal] = []
    if supply is None:
        return signals

    flow = supply.today
    if flow is not None:
        fresh = supply.is_fresh(today)
        stamp = "장중 잠정" if flow.provisional else (flow.date or "날짜 미상")
        parts = [f"{INVESTOR_LABEL[k]} {_flow_txt(getattr(flow, k), flow.unit, quote.price)}"
                 for k in ("foreign", "institution", "individual")
                 if getattr(flow, k) is not None]
        if parts:
            head = "오늘 수급" if fresh else f"최근 수급({flow.date} 기준)"
            signals.append(Signal("supply", f"{head}[{stamp}]: " + " · ".join(parts),
                                  weight=1.4 if fresh else 0.8))

        # 어느 주체가 얼마나 세게 밀었나 — 방향이 주가와 맞는지까지 본다.
        sized = [(k, getattr(flow, k)) for k in ("foreign", "institution")
                 if getattr(flow, k) is not None]
        if sized and fresh:
            who, value = max(sized, key=lambda kv: abs(kv[1]))
            eok = to_eok(value, flow.unit, quote.price)
            if eok is not None and abs(eok) >= FLOW_BIG_EOK:
                side = "순매수" if value > 0 else "순매도"
                aligned = (value > 0) == (quote.change_rate > 0)
                share = ""
                if quote.trading_value:
                    ratio = abs(eok * 1e8) / quote.trading_value
                    if ratio >= FLOW_SHARE_OF_VALUE:
                        share = f" — 당일 거래대금의 {ratio:.0%}"
                if aligned:
                    text = (f"{INVESTOR_LABEL[who]}이 {abs(eok):,.0f}억 {side}{share}. "
                            f"주가 방향과 일치해 수급이 오늘 움직임을 밀고 있습니다.")
                else:
                    text = (f"{INVESTOR_LABEL[who]}이 {abs(eok):,.0f}억 {side}{share}. "
                            f"주가 방향과 반대라 다른 주체가 더 세게 반대편에 서 있습니다.")
                signals.append(Signal("supply_side", text, weight=1.6))

        days, total = supply.streak("foreign")
        if days >= STREAK_MIN_DAYS:
            side = "순매수" if total > 0 else "순매도"
            eok = to_eok(total, flow.unit, quote.price)
            amount = f"(누적 {_flow_txt(total, flow.unit, quote.price)})" if eok is not None else ""
            signals.append(Signal(
                "supply_streak",
                f"외국인 {days}일 연속 {side}{amount} — 오늘 하루가 아니라 추세적 수급입니다.",
                weight=1.2,
            ))

    short = supply.short
    if short is not None and short.ratio is not None:
        baseline = supply.short_ratio_baseline()
        fresh = supply.short_is_fresh(today)
        when = "당일" if fresh else f"{short.date} 기준"
        text = f"공매도 비중 {short.ratio:.1f}% ({when})"
        weight = 1.0
        if baseline:
            ratio = short.ratio / baseline if baseline else 0.0
            text += f", 직전 평균 {baseline:.1f}% 의 {ratio:.1f}배"
            if ratio >= SHORT_SURGE_RATIO:
                text += " — 공매도가 평소보다 확연히 늘었습니다"
                weight = 1.5
        elif short.ratio >= SHORT_HIGH_RATIO:
            weight = 1.3
        if not fresh:
            # 한국은 장중 공매도를 실시간 공개하지 않는다. 이걸 안 적으면
            # 어제 숫자를 오늘 원인으로 읽게 된다.
            text += ". 당일 공매도는 장 마감 후에 공시되므로 지금 값은 직전 거래일 기준입니다"
        signals.append(Signal("short", text + ".", weight=weight))

    if short is not None and short.balance_ratio is not None:
        signals.append(Signal(
            "short_balance",
            f"공매도 잔고 비중 {short.balance_ratio:.2f}% — 숏 커버링 여력을 가늠할 수 있습니다.",
        ))

    return signals


def _rank(market: Component, sector: Component, idio: Component) -> list[tuple[Driver, Component]]:
    pairs: list[tuple[Driver, Component]] = [
        ("MARKET", market), ("SECTOR", sector), ("IDIOSYNCRATIC", idio),
    ]
    return sorted(pairs, key=lambda kv: abs(kv[1].value), reverse=True)


def _pick_driver(ranked: list[tuple[Driver, Component]], stock_rate: float) -> tuple[Driver, float]:
    top_key, top = ranked[0]
    if abs(stock_rate) < NOISE_RATE:
        # 사실상 보합이면 성분 비중이 커도 의미가 없다.
        return top_key, 0.2

    second = ranked[1][1]
    # 1등과 2등의 격차가 클수록 확신도가 높다.
    gap = top.share - second.share
    confidence = min(0.95, 0.45 + top.share * 0.4 + gap * 0.4)
    return top_key, confidence


# 2순위 성분이 이 조건을 넘으면 헤드라인에 같이 적는다. "시장 탓"만 말하고
# 끝내면, 시장보다 업종이 더 깊게 빠진 날 같은 진짜 중요한 정보를 놓친다.
SECONDARY_MIN_SHARE = 0.25
SECONDARY_MIN_VALUE = 1.0


def _phrase(key: Driver, value: float, ctx: MarketContext) -> str:
    if key == "MARKET":
        idx = f"{ctx.index_name} {ctx.index_rate:+.2f}%" if ctx.index_rate is not None else ctx.index_name
        return f"{idx}에 연동된 시장 전체 흐름({value:+.2f}%p)"
    if key == "SECTOR":
        sec = ctx.sector_name or "업종"
        verb = "더 깊게 하락" if value < 0 else "시장 대비 강세"
        return f"{sec} 업종이 시장보다 {verb}({value:+.2f}%p)"
    verb = "약세" if value < 0 else "강세"
    return f"종목 고유 요인({value:+.2f}%p, 동종 대비 {verb})"


def _supply_clause(quote: Quote, ctx: MarketContext) -> str:
    """헤드라인 뒤에 붙일 수급 한 마디. 오늘 확정된 방향이 있을 때만 붙인다."""
    supply = ctx.supply
    if supply is None or supply.today is None or not supply.is_fresh():
        return ""
    flow = supply.today
    sized = [(k, getattr(flow, k)) for k in ("foreign", "institution")
             if getattr(flow, k) is not None]
    if not sized:
        return ""
    who, value = max(sized, key=lambda kv: abs(kv[1]))
    eok = to_eok(value, flow.unit, quote.price)
    if eok is None or abs(eok) < FLOW_BIG_EOK:
        return ""
    side = "순매수" if value > 0 else "순매도"
    return f" 수급은 {INVESTOR_LABEL[who]} {abs(eok):,.0f}억 {side}가 주도했습니다."


def _build_headline(quote: Quote, ranked: list[tuple[Driver, Component]],
                    ctx: MarketContext) -> str:
    move = "급등" if quote.change_rate >= 3 else "상승" if quote.change_rate > 0 else \
           "급락" if quote.change_rate <= -3 else "하락" if quote.change_rate < 0 else "보합"
    head = f"{quote.name} {quote.change_rate:+.2f}% {move}"

    top_key, top = ranked[0]
    parts = [_phrase(top_key, top.value, ctx)]

    second_key, second = ranked[1]
    if second.share >= SECONDARY_MIN_SHARE and abs(second.value) >= SECONDARY_MIN_VALUE:
        parts.append(_phrase(second_key, second.value, ctx))

    body = f"{head} — 주 원인은 {parts[0]}" + \
           (f"; 여기에 {parts[1]}이 겹쳤습니다." if len(parts) > 1 else ".")
    return body + _supply_clause(quote, ctx)


def analyze(quote: Quote, ctx: MarketContext,
            news: Optional[list[NewsItem]] = None) -> Attribution:
    """시세 + 시장환경으로부터 정량적 귀인 결과를 만든다.

    뉴스는 여기서 원인을 '이름 붙이는' 데 쓰지 않는다. 그건 LLM 단계의 몫이고,
    여기서는 어느 성분이 움직였는지, 언제 움직였는지까지만 확정한다.
    """
    market, sector, idio = decompose(quote, ctx)
    ranked = _rank(market, sector, idio)
    driver, confidence = _pick_driver(ranked, quote.change_rate)
    timing, gap, intraday = _classify_timing(quote)
    signals = _collect_signals(quote, ctx, timing, gap, intraday)

    # 장중 재료인데 거래량까지 터졌으면 확신도를 올린다.
    if any(s.key == "volume_surge" for s in signals) and driver == "IDIOSYNCRATIC":
        confidence = min(0.95, confidence + 0.1)
    # 수급 방향이 주가 방향과 맞으면 설명이 한 겹 더 뒷받침된다.
    if any(s.key == "supply_side" and "일치" in s.text for s in signals):
        confidence = min(0.95, confidence + 0.05)
    # 데이터가 부족하면 확신도를 깎는다.
    if ctx.index_rate is None:
        confidence *= 0.6
    if ctx.sector_rate is None and not ctx.peers:
        confidence *= 0.8

    headline = _build_headline(quote, ranked, ctx)

    return Attribution(
        stock_rate=quote.change_rate,
        market=market,
        sector=sector,
        idiosyncratic=idio,
        driver=driver,
        confidence=round(confidence, 2),
        signals=signals,
        timing=timing,
        headline=headline,
    )


# --------------------------------------------------------------------------
# 뉴스 스코어링: 어떤 기사가 오늘 이 움직임과 관련 있을 가능성이 높은가
# --------------------------------------------------------------------------

CATEGORY_KEYWORDS: dict[str, tuple[str, ...]] = {
    "실적": ("실적", "영업이익", "어닝", "잠정", "매출", "적자", "흑자", "가이던스", "컨센서스"),
    "공시": ("공시", "정정", "조회공시", "풍문"),
    "수주/계약": ("수주", "계약", "공급", "납품", "체결", "MOU", "협약", "제휴"),
    "증자/자금": ("유상증자", "무상증자", "전환사채", "CB", "BW", "감자", "차입", "자금조달"),
    "주주환원": ("자사주", "배당", "소각", "주주환원", "매입"),
    "M&A/지분": ("인수", "합병", "매각", "지분", "최대주주", "경영권"),
    "소송/규제": ("소송", "특허", "제재", "과징금", "조사", "압수", "규제", "분쟁", "합의"),
    "임상/승인": ("임상", "승인", "허가", "FDA", "품목허가", "기술이전"),
    "증권가": ("목표주가", "투자의견", "상향", "하향", "커버리지", "리포트"),
    "수급": ("외국인", "기관", "공매도", "수급", "사이드카", "레버리지", "ETF", "패시브", "리밸런싱"),
    "매크로": ("금리", "환율", "연준", "FOMC", "관세", "유가", "지수", "나스닥", "다우"),
}

POSITIVE = ("호재", "급등", "강세", "상향", "수주", "흑자", "최대", "돌파", "기대", "회복", "확대", "승인", "종결")
NEGATIVE = ("악재", "급락", "약세", "하향", "적자", "취소", "해지", "무산", "우려", "위축", "축소", "제재", "감소")


def categorize(title: str) -> list[str]:
    return [cat for cat, kws in CATEGORY_KEYWORDS.items() if any(k in title for k in kws)]


def tone(title: str) -> int:
    """제목의 방향성. +1 긍정 / -1 부정 / 0 중립."""
    pos = sum(1 for k in POSITIVE if k in title)
    neg = sum(1 for k in NEGATIVE if k in title)
    return (pos > neg) - (neg > pos)


def score_news(news: list[NewsItem], quote: Quote, attribution: Attribution,
               now: Optional[datetime] = None) -> list[dict]:
    """기사별로 '오늘 이 움직임의 원인일 가능성' 점수를 매겨 정렬한다."""
    now = now or datetime.now()
    direction = 1 if quote.change_rate > 0 else -1 if quote.change_rate < 0 else 0
    scored: list[dict] = []

    for item in news:
        score = 0.0
        cats = categorize(item.title)
        t = tone(item.title)

        # 개별 종목 재료 카테고리는 종목고유 국면에서 가중치가 높다
        hard_cats = {"실적", "공시", "수주/계약", "증자/자금", "M&A/지분", "소송/규제", "임상/승인", "주주환원"}
        if cats:
            score += 1.0
            if attribution.driver == "IDIOSYNCRATIC" and hard_cats.intersection(cats):
                score += 2.0
            if attribution.driver == "MARKET" and {"매크로", "수급"}.intersection(cats):
                score += 1.5
            if attribution.driver == "SECTOR" and {"매크로", "수급", "증권가"}.intersection(cats):
                score += 1.0

        # 종목명이 제목에 있으면 직접 관련
        if quote.name and quote.name in item.title:
            score += 1.0

        # 방향 일치
        if direction and t == direction:
            score += 1.0
        elif direction and t == -direction:
            score -= 0.5

        # 최신성: 장중 재료면 최근 기사에 훨씬 큰 가중치
        if item.published_at:
            age_min = max(0.0, (now - item.published_at).total_seconds() / 60.0)
            if attribution.timing == "INTRADAY":
                score += max(0.0, 3.0 - age_min / 60.0)
            else:
                score += max(0.0, 1.5 - age_min / 180.0)

        scored.append({
            "title": item.title,
            "time": item.when(),
            "url": item.url,
            "press": item.press,
            "summary": item.summary,
            "categories": cats,
            "tone": t,
            "score": round(score, 2),
        })

    scored.sort(key=lambda d: d["score"], reverse=True)
    return scored
