"""수집 -> 분해 -> 서술 파이프라인."""

from __future__ import annotations

import asyncio
import os
from datetime import datetime
from typing import Any, Optional

from . import usage
from .analysis import llm
from .analysis.attribution import analyze, score_news, sort_news_by_recency
from .models import NewsItem, Quote
from .peers import peers_for, theme_of
from .pricing import cost_of, format_cost
from .providers.naver import NaverProvider, build_context


class NotFound(Exception):
    """종목을 못 찾은 경우."""


async def diagnose(query: str, use_llm: bool = True,
                   api_key: Optional[str] = None) -> dict[str, Any]:
    """종목 하나에 대한 장중 원인 분석 전체를 수행한다."""
    started = datetime.now()

    async with NaverProvider() as provider:
        resolved = await provider.resolve(query)
        if not resolved:
            raise NotFound(f"'{query}' 에 해당하는 종목을 찾지 못했습니다.")
        code, name = resolved

        quote = await provider.quote(code)
        if quote is None:
            raise NotFound(f"'{name}({code})' 의 시세를 가져오지 못했습니다.")
        if not quote.name or quote.name == code:
            quote.name = name

        peer_codes = peers_for(code, quote.sector_name)
        ctx, news_items = await asyncio.gather(
            build_context(provider, quote, peer_codes),
            provider.news(code),
        )
        ctx.sector_name = ctx.sector_name or theme_of(code, quote.sector_name)
        provider_report = provider.report.as_dict()

    attribution = analyze(quote, ctx, news_items)
    ranked_news = score_news(news_items, quote, attribution)

    explanation: Optional[dict] = None
    cost: Optional[dict] = None
    if use_llm:
        explanation = await llm.explain(quote, ctx, attribution, ranked_news, api_key=api_key)
        cost = _cost_of(explanation)
        usage.record(query, quote.code, cost)

    # LLM 근거 자료는 관련도 순서를 그대로 쓰고(위에서 이미 넘김), 화면에
    # 보여줄 목록만 최신순으로 다시 정렬한다.
    news_for_display = sort_news_by_recency(ranked_news[:15])

    return {
        "query": query,
        "as_of": started.isoformat(timespec="seconds"),
        "elapsed_ms": int((datetime.now() - started).total_seconds() * 1000),
        "quote": _quote_dict(quote),
        "context": _context_dict(ctx),
        "attribution": attribution.as_dict(),
        "news": news_for_display,
        "explanation": explanation,
        "cost": cost,
        "diagnostics": provider_report,
    }


def _cost_of(explanation: Optional[dict]) -> Optional[dict]:
    """LLM 응답에 실려온 실제 토큰 수로 비용을 낸다(추정 아님)."""
    if not explanation:
        return None
    tokens = explanation.get("_usage")
    if not tokens:
        return None   # 호출 실패 등으로 usage 가 없으면 비용도 없다
    return cost_of(tokens, explanation.get("_model") or "unknown")


def _quote_dict(q: Quote) -> dict:
    return {
        "code": q.code, "name": q.name, "price": q.price,
        "change": q.change, "change_rate": q.change_rate,
        "market": q.market, "sector_name": q.sector_name,
        "open": q.open, "high": q.high, "low": q.low,
        "prev_close": q.inferred_prev_close,
        "volume": q.volume, "trading_value": q.trading_value,
        "market_cap": q.market_cap,
        "week52_high": q.week52_high, "week52_low": q.week52_low,
        "source": q.source,
    }


def _context_dict(ctx) -> dict:
    return {
        "index_name": ctx.index_name, "index_rate": ctx.index_rate,
        "index_price": ctx.index_price,
        "sector_name": ctx.sector_name, "sector_rate": ctx.sector_rate,
        "avg_volume_20d": ctx.avg_volume_20d, "beta": ctx.beta,
        "peers": [{"code": p.code, "name": p.name, "change_rate": p.change_rate}
                  for p in ctx.peers],
        "supply": _supply_dict(ctx.supply),
    }


def _supply_dict(supply) -> Optional[dict]:
    """수급은 값보다 '언제 기준인지'가 중요해서 신선도를 같이 내보낸다."""
    if supply is None:
        return None
    flow, short = supply.today, supply.short
    days, streak_total = supply.streak("foreign")
    return {
        "fresh": supply.is_fresh(),
        "flow": None if flow is None else {
            "date": flow.date, "unit": flow.unit, "provisional": flow.provisional,
            "foreign": flow.foreign, "institution": flow.institution,
            "individual": flow.individual,
            "foreign_hold_ratio": flow.foreign_hold_ratio,
        },
        "streak_days": days, "streak_total": streak_total,
        "short_fresh": supply.short_is_fresh(),
        "short": None if short is None else {
            "date": short.date, "ratio": short.ratio, "volume": short.volume,
            "value": short.value, "balance_ratio": short.balance_ratio,
        },
        "short_baseline": supply.short_ratio_baseline(),
    }


def render_text(result: dict[str, Any]) -> str:
    """터미널/채팅용 텍스트 렌더링."""
    q, a = result["quote"], result["attribution"]
    out: list[str] = []

    arrow = "▲" if q["change_rate"] > 0 else "▼" if q["change_rate"] < 0 else "―"
    out.append(f"{q['name']} ({q['code']})  {q['price']:,.0f}원  {arrow} {q['change']:+,.0f} ({q['change_rate']:+.2f}%)")
    out.append("")

    exp = result.get("explanation")
    if exp and exp.get("answer"):
        out.append(f"■ {exp['answer']}")
        out.append("")
        for r in exp.get("reasons", []):
            out.append(f"  · {r['point']} — {r['detail']}")
        if exp.get("catalyst"):
            out.append(f"\n  촉발 재료: {exp['catalyst']}")
        if exp.get("watch"):
            out.append(f"  체크포인트: {exp['watch']}")
        out.append(f"  확신도: {exp.get('confidence', '-')}")
    else:
        out.append(f"■ {a['headline']}")

    out.append("")
    c = a["components"]
    out.append("[등락률 분해]")
    out.append(f"  시장     {c['market']['value']:+.2f}%p ({c['market']['share']:.0%})")
    out.append(f"  업종초과 {c['sector']['value']:+.2f}%p ({c['sector']['share']:.0%})")
    out.append(f"  종목고유 {c['idiosyncratic']['value']:+.2f}%p ({c['idiosyncratic']['share']:.0%})")

    if a["signals"]:
        out.append("")
        out.append("[정황]")
        out.extend(f"  · {s['text']}" for s in a["signals"])

    if result.get("news"):
        out.append("")
        out.append("[관련 뉴스]")
        for n in result["news"][:5]:
            out.append(f"  {n['time']}  {n['title']}")

    out.append("")
    out.append(f"[비용] {format_cost(result.get('cost'))} · {result['elapsed_ms']}ms")

    return "\n".join(out)
