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

    @property
    def breadth(self) -> Optional[float]:
        """상승 종목 비율. 0.5 미만이면 하락 우위."""
        if self.advances is None or self.declines is None:
            return None
        total = self.advances + self.declines
        return self.advances / total if total else None
