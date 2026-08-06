"""도메인 모델.

모든 등락률(`*_rate`)은 퍼센트 단위다. -7.11 은 -7.11% 를 뜻한다.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime
from typing import Literal, Optional

Market = Literal["KOSPI", "KOSDAQ", "KONEX", "UNKNOWN"]


@dataclass
class Quote:
    """한 종목의 현재 시세 스냅샷."""

    code: str
    name: str
    price: float
    change: float
    change_rate: float
    market: Market = "UNKNOWN"
    sector_name: Optional[str] = None

    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    prev_close: Optional[float] = None

    volume: Optional[int] = None
    trading_value: Optional[int] = None
    market_cap: Optional[int] = None

    week52_high: Optional[float] = None
    week52_low: Optional[float] = None

    as_of: Optional[datetime] = None
    source: str = "unknown"

    @property
    def inferred_prev_close(self) -> Optional[float]:
        """전일 종가. 제공되지 않으면 현재가 - 전일대비로 역산한다."""
        if self.prev_close is not None:
            return self.prev_close
        if self.price is not None and self.change is not None:
            return self.price - self.change
        return None


@dataclass
class NewsItem:
    title: str
    published_at: Optional[datetime] = None
    url: Optional[str] = None
    summary: Optional[str] = None
    press: Optional[str] = None
    source: str = "unknown"

    def when(self) -> str:
        return self.published_at.strftime("%H:%M") if self.published_at else "--:--"


@dataclass
class InvestorFlow:
    """하루치 투자자별 순매수. 부호는 순매수(+) / 순매도(-)."""

    date: str = ""
    foreign: Optional[float] = None
    institution: Optional[float] = None
    individual: Optional[float] = None
    # 네이버는 엔드포인트에 따라 수량(주)으로도, 금액(원)으로도 준다.
    # 단위를 잃어버리면 "-1,200억"과 "-1,200주"를 구분 못 하므로 같이 들고 다닌다.
    unit: Literal["주", "원"] = "주"
    foreign_hold_ratio: Optional[float] = None
    provisional: bool = False      # 장중 잠정치(확정 아님)

    def net(self) -> Optional[float]:
        """외국인 + 기관. 이른바 '양대 수급'."""
        vals = [v for v in (self.foreign, self.institution) if v is not None]
        return sum(vals) if vals else None


@dataclass
class ShortSale:
    """하루치 공매도. 한국은 장중 실시간 공매도를 공개하지 않는다(마감 후 집계)."""

    date: str = ""
    volume: Optional[float] = None        # 공매도 거래량(주)
    value: Optional[float] = None         # 공매도 거래대금(원)
    ratio: Optional[float] = None         # 전체 거래 대비 비중 %
    balance_qty: Optional[float] = None   # 공매도 잔고 수량
    balance_ratio: Optional[float] = None  # 상장주식 대비 잔고 비중 %


@dataclass
class SupplyDemand:
    """수급·공매도 묶음.

    이 앱에서 가장 조심해야 하는 부분이다. 수급과 공매도는 시세와 달리
    **실시간이 아니다**. 장중 투자자별 매매동향은 잠정치이고, 공매도는 장이
    끝나야 공시된다. 그래서 값만 들고 다니지 않고 '언제 기준인지'를 항상 함께
    들고 다닌다. 날짜를 잃어버리면 어제 숫자로 오늘을 설명하게 된다.
    """

    today: Optional[InvestorFlow] = None
    history: list[InvestorFlow] = field(default_factory=list)   # 최신순
    short: Optional[ShortSale] = None
    short_history: list[ShortSale] = field(default_factory=list)  # 최신순

    def is_fresh(self, today: Optional[str] = None) -> bool:
        """수급 데이터가 오늘 것인지."""
        if not self.today or not self.today.date:
            return False
        return self.today.date == (today or datetime.now().strftime("%Y-%m-%d"))

    def short_is_fresh(self, today: Optional[str] = None) -> bool:
        if not self.short or not self.short.date:
            return False
        return self.short.date == (today or datetime.now().strftime("%Y-%m-%d"))

    def streak(self, who: str = "foreign") -> tuple[int, float]:
        """같은 방향(순매수/순매도)이 며칠 이어졌는지와 그 누적치.

        `history` 는 최신순이며 today 를 포함한다고 본다.
        """
        days, total, sign = 0, 0.0, 0
        for row in self.history:
            v = getattr(row, who, None)
            if v is None or v == 0:
                break
            s = 1 if v > 0 else -1
            if sign == 0:
                sign = s
            elif s != sign:
                break
            days += 1
            total += v
        return days, total

    def short_ratio_baseline(self, days: int = 5) -> Optional[float]:
        """직전 며칠간의 평균 공매도 비중. 오늘(최신) 값은 비교 대상이라 뺀다."""
        past = [s.ratio for s in self.short_history[1:days + 1] if s.ratio is not None]
        return sum(past) / len(past) if past else None


@dataclass
class MarketContext:
    """종목을 둘러싼 시장/업종 환경."""

    index_name: str = "KOSPI"
    index_rate: Optional[float] = None
    index_price: Optional[float] = None
    advances: Optional[int] = None
    declines: Optional[int] = None

    sector_name: Optional[str] = None
    sector_rate: Optional[float] = None

    peers: list[Quote] = field(default_factory=list)
    avg_volume_20d: Optional[float] = None
    beta: float = 1.0

    supply: Optional[SupplyDemand] = None

    @property
    def breadth(self) -> Optional[float]:
        """상승 종목 비율. 0.5 미만이면 하락 우위."""
        if self.advances is None or self.declines is None:
            return None
        total = self.advances + self.declines
        return self.advances / total if total else None
