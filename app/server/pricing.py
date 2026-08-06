"""모델 요금표와 비용 계산.

토큰 추정은 믿을 게 못 된다. 특히 한국어는 영어보다 토큰을 훨씬 많이 먹어서
어림짐작이 몇 배씩 틀린다. 그래서 여기서는 추정하지 않고 API 응답의 usage를
그대로 받아 계산한다.

요금은 100만 토큰당 USD. 도입가(intro)가 있는 모델은 만료일이 지나면 자동으로
정가로 넘어간다 — 날짜를 넘겨서 계산하므로 코드를 고칠 필요가 없다.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import date
from typing import Optional


@dataclass(frozen=True)
class ModelPrice:
    """100만 토큰당 USD."""

    input: float
    output: float
    # 도입가: intro_until 까지만 적용되고 이후 정가로 돌아간다.
    intro_input: Optional[float] = None
    intro_output: Optional[float] = None
    intro_until: Optional[date] = None

    def rates(self, on: date) -> tuple[float, float, bool]:
        """(입력단가, 출력단가, 도입가 적용중인지)."""
        if self.intro_until and on <= self.intro_until:
            if self.intro_input is not None and self.intro_output is not None:
                return self.intro_input, self.intro_output, True
        return self.input, self.output, False


PRICES: dict[str, ModelPrice] = {
    "claude-sonnet-5": ModelPrice(
        input=3.00, output=15.00,
        intro_input=2.00, intro_output=10.00, intro_until=date(2026, 8, 31),
    ),
    "claude-opus-5": ModelPrice(input=5.00, output=25.00),
    "claude-fable-5": ModelPrice(input=10.00, output=50.00),
    "claude-opus-4-8": ModelPrice(input=5.00, output=25.00),
    "claude-opus-4-7": ModelPrice(input=5.00, output=25.00),
    "claude-opus-4-6": ModelPrice(input=5.00, output=25.00),
    "claude-sonnet-4-6": ModelPrice(input=3.00, output=15.00),
    "claude-haiku-4-5": ModelPrice(input=1.00, output=5.00),
}

# 프롬프트 캐시 배수. 이 앱은 캐시를 쓰지 않지만 usage에 값이 오면 반영한다.
CACHE_WRITE_MULTIPLIER = 1.25
CACHE_READ_MULTIPLIER = 0.10

DEFAULT_USD_KRW = 1400.0


def usd_krw() -> float:
    """표시용 환율. 정확한 청구액이 아니라 감을 잡기 위한 근사값이다."""
    raw = os.getenv("STOCKWHY_USD_KRW", "").strip()
    try:
        rate = float(raw)
        return rate if rate > 0 else DEFAULT_USD_KRW
    except ValueError:
        return DEFAULT_USD_KRW


def _resolve(model: str) -> tuple[str, Optional[ModelPrice]]:
    """응답 모델명은 'claude-sonnet-5-20260101' 처럼 접미사가 붙기도 한다."""
    if model in PRICES:
        return model, PRICES[model]
    # 가장 긴 접두사 매칭 — 'claude-opus-5' 가 'claude-opus-4-8' 보다 먼저 잡히면 안 된다.
    best = ""
    for key in PRICES:
        if model.startswith(key) and len(key) > len(best):
            best = key
    return (best, PRICES[best]) if best else (model, None)


def cost_of(usage: dict, model: str, on: Optional[date] = None) -> dict:
    """usage(토큰 수) + 모델명 -> 비용 내역.

    요금표에 없는 모델이면 tokens 는 채우되 비용은 None 으로 둔다. 모르는 값을
    0으로 표시하면 공짜인 줄 알게 된다.
    """
    on = on or date.today()
    key, price = _resolve(model)

    tin = int(usage.get("input_tokens") or 0)
    tout = int(usage.get("output_tokens") or 0)
    twrite = int(usage.get("cache_creation_input_tokens") or 0)
    tread = int(usage.get("cache_read_input_tokens") or 0)

    result: dict = {
        "model": model,
        "priced_as": key if price else None,
        "input_tokens": tin,
        "output_tokens": tout,
        "cache_write_tokens": twrite,
        "cache_read_tokens": tread,
        "total_tokens": tin + tout + twrite + tread,
    }

    if price is None:
        result.update({"usd": None, "krw": None, "intro_pricing": False,
                       "note": f"'{model}' 요금 정보 없음 — 비용을 계산하지 못했습니다."})
        return result

    rate_in, rate_out, intro = price.rates(on)
    usd = (
        tin * rate_in
        + tout * rate_out
        + twrite * rate_in * CACHE_WRITE_MULTIPLIER
        + tread * rate_in * CACHE_READ_MULTIPLIER
    ) / 1_000_000

    result.update({
        "usd": round(usd, 6),
        "krw": round(usd * usd_krw(), 1),
        "rate_input": rate_in,
        "rate_output": rate_out,
        "intro_pricing": intro,
    })
    if intro and price.intro_until:
        result["intro_until"] = price.intro_until.isoformat()
    return result


def format_cost(cost: Optional[dict]) -> str:
    """한 줄 요약."""
    if not cost:
        return "LLM 미사용 — 비용 없음"
    if cost.get("usd") is None:
        return f"{cost['total_tokens']:,} 토큰 · {cost.get('note', '비용 미상')}"

    line = (f"{cost['input_tokens']:,} in / {cost['output_tokens']:,} out 토큰 · "
            f"${cost['usd']:.4f} (약 {cost['krw']:.0f}원)")
    if cost.get("intro_pricing"):
        line += f" · 도입가 적용중 (~{cost['intro_until']})"
    return line
