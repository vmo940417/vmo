"""Claude 기반 원인 서술.

역할 분담이 중요하다. 귀인 엔진(attribution.py)이 "시장이냐 업종이냐 종목이냐"를
숫자로 이미 확정했고, LLM은 그 결론을 뒤집는 게 아니라 **왜 그렇게 됐는지를
뉴스로 채우는** 역할만 한다. 그래서 프롬프트에서 분해 결과를 '주어진 사실'로
못박고, 근거 없는 추측을 금지한다.

장중 즉답이 목적이라 지연시간이 중요해서 기본 모델은 Sonnet 으로 둔다.
더 깊은 판단이 필요하면 STOCKWHY_MODEL=claude-opus-5 로 바꾸면 된다.
"""

from __future__ import annotations

import json
import os
from typing import Any, Optional

from ..models import MarketContext, Quote
from .attribution import INVESTOR_LABEL, Attribution, to_eok

DEFAULT_MODEL = os.getenv("STOCKWHY_MODEL", "claude-sonnet-5")

API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"

SYSTEM = """\
당신은 한국 주식시장 장중 데스크의 애널리스트다. 트레이더가 "이 종목 왜 이래?"라고
물으면 30초 안에 답해야 한다.

지켜야 할 원칙:
1. 등락률 분해(시장/업종/종목고유)는 이미 계산되어 주어진다. 이것은 산술적 사실이므로
   절대 뒤집거나 무시하지 마라. 당신의 일은 그 분해 결과에 '이름을 붙이는' 것이다.
2. 주어진 뉴스와 수치에서 근거를 찾을 수 없으면 "확인된 재료 없음"이라고 명시하라.
   그럴듯한 이야기를 지어내는 것이 가장 나쁘다.
3. 시장이 주도한 하락에 개별 종목 재료를 억지로 갖다 붙이지 마라. 반대도 마찬가지다.
4. 뉴스 제목의 시각과 주가가 움직인 시각(장중/개장전)이 맞는지 따져라. 장중 급락인데
   장 시작 전 기사를 원인으로 대면 틀린 답이다.
5. 수급(외국인/기관/개인)과 공매도는 시세와 달리 실시간이 아니다. 장중 수급은 잠정치이고
   공매도는 장 마감 후에 공시된다. 주어진 기준 날짜를 확인하고, 오늘 것이 아니면
   "직전 거래일 기준"이라고 밝혀라. 어제 수급으로 오늘 급락을 설명하지 마라.
6. 한국어로, 결론부터, 군더더기 없이. 투자 권유나 매수/매도 의견은 내지 마라.
"""

RESPONSE_TOOL: dict[str, Any] = {
    "name": "report_cause",
    "description": "장중 시세 변동의 원인 분석 결과를 보고한다.",
    "input_schema": {
        "type": "object",
        "properties": {
            "answer": {
                "type": "string",
                "description": "한 문장 결론. 왜 움직였는지를 즉답 형태로. 100자 이내.",
            },
            "reasons": {
                "type": "array",
                "description": "근거 2~4개. 중요한 순서대로.",
                "items": {
                    "type": "object",
                    "properties": {
                        "point": {"type": "string", "description": "근거 요약 (20자 내외)"},
                        "detail": {"type": "string", "description": "구체적 설명. 수치나 기사 시각을 인용."},
                    },
                    "required": ["point", "detail"],
                },
            },
            "catalyst": {
                "type": "string",
                "description": "직접적 촉발 재료. 특정 못 하면 '확인된 개별 재료 없음'.",
            },
            "confidence": {
                "type": "string",
                "enum": ["high", "medium", "low"],
                "description": "이 설명에 대한 확신도. 재료를 특정 못 했으면 low.",
            },
            "watch": {
                "type": "string",
                "description": "지금부터 확인해야 할 것 한 가지.",
            },
        },
        "required": ["answer", "reasons", "catalyst", "confidence", "watch"],
    },
}


def _supply_lines(quote: Quote, ctx: MarketContext) -> list[str]:
    """수급·공매도 근거. 기준 날짜를 반드시 함께 적는다.

    LLM 이 어제 수급으로 오늘을 설명하는 것이 여기서 가장 흔한 실패다. 그래서
    숫자만 주지 않고 '언제 것인지', '잠정인지 확정인지'를 문장으로 붙여준다.
    """
    supply = ctx.supply
    if supply is None:
        return []

    lines: list[str] = []
    flow = supply.today
    if flow is not None:
        fresh = supply.is_fresh()
        stamp = f"{flow.date or '날짜 미상'}" + (" · 장중 잠정치" if flow.provisional else " · 확정")
        lines.append("")
        lines.append(f"[수급] {stamp}" + ("" if fresh else " (오늘 것이 아님 — 오늘 수급은 아직 집계 전)"))
        for key in ("foreign", "institution", "individual"):
            value = getattr(flow, key)
            if value is None:
                continue
            eok = to_eok(value, flow.unit, quote.price)
            shown = f"{eok:+,.0f}억원" + ("(수량x현재가 환산 추정)" if flow.unit == "주" else "")
            lines.append(f"  {INVESTOR_LABEL[key]} {shown}")
        days, total = supply.streak("foreign")
        if days >= 2:
            side = "순매수" if total > 0 else "순매도"
            lines.append(f"  외국인 {days}일 연속 {side}")

    short = supply.short
    if short is not None:
        lines.append("")
        when = "당일" if supply.short_is_fresh() else f"{short.date or '날짜 미상'} (직전 거래일)"
        lines.append(f"[공매도] {when}")
        if short.ratio is not None:
            baseline = supply.short_ratio_baseline()
            extra = f" / 직전 평균 {baseline:.1f}%" if baseline else ""
            lines.append(f"  거래 대비 비중 {short.ratio:.2f}%{extra}")
        if short.balance_ratio is not None:
            lines.append(f"  잔고 비중 {short.balance_ratio:.2f}%")
        if not supply.short_is_fresh():
            lines.append("  ※ 한국은 당일 공매도를 장중에 공개하지 않는다. "
                         "위 수치를 오늘 움직임의 원인으로 단정하지 마라.")
    return lines


def build_evidence(quote: Quote, ctx: MarketContext, attr: Attribution,
                   news: list[dict], max_news: int = 12) -> str:
    """LLM 에 넘길 증거 묶음. 숫자는 이미 해석된 형태로 준다."""
    lines: list[str] = []

    lines.append(f"[종목] {quote.name} ({quote.code}) / {quote.market} / 업종: {quote.sector_name or '미상'}")
    lines.append(f"  현재가 {quote.price:,.0f}원  전일대비 {quote.change:+,.0f} ({quote.change_rate:+.2f}%)")
    if quote.open is not None:
        lines.append(f"  시가 {quote.open:,.0f} / 고가 {quote.high or 0:,.0f} / 저가 {quote.low or 0:,.0f}")
    if quote.volume:
        vol = f"  거래량 {quote.volume:,}주"
        if ctx.avg_volume_20d:
            vol += f" (20일 평균의 {quote.volume / ctx.avg_volume_20d:.1f}배)"
        lines.append(vol)
    if quote.week52_high and quote.week52_low:
        lines.append(f"  52주 범위 {quote.week52_low:,.0f} ~ {quote.week52_high:,.0f}")

    lines.append("")
    lines.append(f"[시장] {ctx.index_name} {ctx.index_rate:+.2f}%" if ctx.index_rate is not None
                 else f"[시장] {ctx.index_name} 등락률 확인 불가")
    if ctx.advances is not None:
        lines.append(f"  상승 {ctx.advances} / 하락 {ctx.declines}")
    if ctx.sector_rate is not None:
        lines.append(f"[업종] {ctx.sector_name or '동종'} 평균 {ctx.sector_rate:+.2f}%")
    if ctx.peers:
        lines.append("  동종 종목: " + ", ".join(f"{p.name} {p.change_rate:+.2f}%" for p in ctx.peers))

    lines.extend(_supply_lines(quote, ctx))

    lines.append("")
    lines.append("[등락률 분해 — 산술적 사실, 합계는 종목 등락률과 일치]")
    lines.append(f"  시장 성분     {attr.market.value:+.2f}%p (비중 {attr.market.share:.0%})")
    lines.append(f"  업종초과 성분 {attr.sector.value:+.2f}%p (비중 {attr.sector.share:.0%})")
    lines.append(f"  종목고유 성분 {attr.idiosyncratic.value:+.2f}%p (비중 {attr.idiosyncratic.share:.0%})")
    lines.append(f"  => 주도 요인: {attr.driver_label} (확신도 {attr.confidence})")

    timing_txt = {
        "PREMARKET": "개장 전에 이미 벌어진 움직임 (갭). 밤사이 해외증시나 전일 장마감 후 공시를 봐야 한다.",
        "INTRADAY": "장중에 발생한 움직임. 오늘 장중 시간대 기사를 봐야 한다.",
        "MIXED": "개장 전 재료가 장중에도 이어지는 중.",
        "FLAT": "의미 있는 이동 없음.",
        "UNKNOWN": "시가 정보가 없어 타이밍 판별 불가.",
    }
    lines.append(f"  => 타이밍: {timing_txt.get(attr.timing, attr.timing)}")

    if attr.signals:
        lines.append("")
        lines.append("[정황 신호]")
        lines.extend(f"  - {s.text}" for s in attr.signals)

    lines.append("")
    if news:
        lines.append("[관련도 순 뉴스] (score 는 오늘 움직임과의 관련성 추정치)")
        for n in news[:max_news]:
            cats = f" [{'/'.join(n['categories'])}]" if n["categories"] else ""
            lines.append(f"  {n['time']} (score {n['score']}){cats} {n['title']}")
    else:
        lines.append("[관련도 순 뉴스] 수집된 기사 없음")

    return "\n".join(lines)


async def explain(quote: Quote, ctx: MarketContext, attr: Attribution,
                  news: list[dict], api_key: Optional[str] = None,
                  model: Optional[str] = None) -> Optional[dict]:
    """Claude 로 원인을 서술한다. 키가 없거나 실패하면 None (규칙 기반 결과만 사용)."""
    key = api_key or os.getenv("ANTHROPIC_API_KEY")
    if not key:
        return None

    evidence = build_evidence(quote, ctx, attr, news)
    payload = {
        "model": model or DEFAULT_MODEL,
        "max_tokens": 1500,
        "system": SYSTEM,
        "tools": [RESPONSE_TOOL],
        "tool_choice": {"type": "tool", "name": "report_cause"},
        "messages": [{
            "role": "user",
            "content": (f"아래는 {quote.name}의 현재 장중 데이터다. 왜 이렇게 움직이는지 "
                        f"판단해서 report_cause 도구로 보고하라.\n\n{evidence}"),
        }],
    }

    try:
        raw = await _call_sdk(payload, key)
        if raw is None:
            # SDK 가 없는 환경(폰의 Termux 등). Messages API 는 단순 JSON POST 라
            # httpx 만으로도 동일하게 호출된다 — 순수 파이썬이라 컴파일이 필요 없다.
            raw = await _call_http(payload, key)
    except Exception as e:  # noqa: BLE001 - LLM 실패해도 앱은 답을 내야 한다
        return {"error": f"{type(e).__name__}: {e}"}

    return _parse(raw)


async def _call_sdk(payload: dict, key: str) -> Optional[dict]:
    """공식 SDK 경로(기본). 설치돼 있지 않으면 None 을 돌려 HTTP 경로로 넘긴다."""
    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return None

    client = AsyncAnthropic(api_key=key)
    try:
        resp = await client.messages.create(**payload)
    finally:
        await client.close()
    return resp.model_dump()


async def _call_http(payload: dict, key: str) -> dict:
    """SDK 없이 Messages API 를 직접 호출한다."""
    import httpx

    from ..config import ca_bundle

    headers = {
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
    }
    async with httpx.AsyncClient(timeout=90.0, verify=ca_bundle() or True) as client:
        r = await client.post(API_URL, headers=headers, json=payload)
        r.raise_for_status()
        return r.json()


def _parse(raw: dict) -> dict:
    """SDK / HTTP 어느 경로로 왔든 같은 dict 모양이라 처리도 하나로 끝난다."""
    meta = {"_model": raw.get("model", "unknown"), "_usage": _usage_of(raw)}
    blocks = raw.get("content") or []

    for block in blocks:
        if block.get("type") == "tool_use" and block.get("name") == "report_cause":
            return {**dict(block.get("input") or {}), **meta}

    # 도구를 안 쓰고 텍스트로만 답한 경우를 대비한 폴백
    text = "".join(b.get("text", "") for b in blocks if b.get("type") == "text")
    try:
        return {**json.loads(text), **meta}
    except (json.JSONDecodeError, TypeError):
        return {"answer": text.strip()[:500], "reasons": [], "catalyst": "",
                "confidence": "low", "watch": "", **meta}


def _usage_of(raw: dict) -> dict:
    """응답의 토큰 사용량. 추정하지 않고 API 가 알려준 값을 그대로 쓴다."""
    u = raw.get("usage") or {}
    return {
        "input_tokens": u.get("input_tokens") or 0,
        "output_tokens": u.get("output_tokens") or 0,
        # 이 앱은 캐시를 쓰지 않지만, 값이 오면 비용에 반영되도록 실어 보낸다.
        "cache_creation_input_tokens": u.get("cache_creation_input_tokens") or 0,
        "cache_read_input_tokens": u.get("cache_read_input_tokens") or 0,
    }
