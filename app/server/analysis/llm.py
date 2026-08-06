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
from .attribution import Attribution

DEFAULT_MODEL = os.getenv("STOCKWHY_MODEL", "claude-sonnet-5")

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
5. 한국어로, 결론부터, 군더더기 없이. 투자 권유나 매수/매도 의견은 내지 마라.
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

    try:
        from anthropic import AsyncAnthropic
    except ImportError:
        return None

    evidence = build_evidence(quote, ctx, attr, news)
    prompt = (
        f"아래는 {quote.name}의 현재 장중 데이터다. 왜 이렇게 움직이는지 판단해서 "
        f"report_cause 도구로 보고하라.\n\n{evidence}"
    )

    client = AsyncAnthropic(api_key=key)
    try:
        resp = await client.messages.create(
            model=model or DEFAULT_MODEL,
            max_tokens=1500,
            system=SYSTEM,
            tools=[RESPONSE_TOOL],
            tool_choice={"type": "tool", "name": "report_cause"},
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:  # noqa: BLE001 - LLM 실패해도 앱은 답을 내야 한다
        return {"error": f"{type(e).__name__}: {e}"}
    finally:
        await client.close()

    meta = {"_model": resp.model, "_usage": _usage_of(resp)}

    for block in resp.content:
        if block.type == "tool_use" and block.name == "report_cause":
            return {**dict(block.input), **meta}

    # 도구를 안 쓰고 텍스트로만 답한 경우를 대비한 폴백
    text = "".join(b.text for b in resp.content if b.type == "text")
    try:
        return {**json.loads(text), **meta}
    except (json.JSONDecodeError, TypeError):
        return {"answer": text.strip()[:500], "reasons": [], "catalyst": "",
                "confidence": "low", "watch": "", **meta}


def _usage_of(resp) -> dict:
    """응답의 토큰 사용량. 추정하지 않고 API 가 알려준 값을 그대로 쓴다."""
    u = getattr(resp, "usage", None)
    if u is None:
        return {}
    return {
        "input_tokens": getattr(u, "input_tokens", 0) or 0,
        "output_tokens": getattr(u, "output_tokens", 0) or 0,
        # 이 앱은 캐시를 쓰지 않지만, 값이 오면 비용에 반영되도록 실어 보낸다.
        "cache_creation_input_tokens": getattr(u, "cache_creation_input_tokens", 0) or 0,
        "cache_read_input_tokens": getattr(u, "cache_read_input_tokens", 0) or 0,
    }
