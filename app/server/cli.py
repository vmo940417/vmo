"""터미널에서 바로 쓰는 CLI + 엔드포인트 진단.

    python -m server.cli 삼성전자          # 분석
    python -m server.cli 005930 --no-llm   # 규칙 기반만
    python -m server.cli --selftest        # 데이터 소스 생사 확인
    python -m server.cli 삼성전자 --json    # 원본 JSON

`--selftest` 는 네이버 엔드포인트가 여전히 살아있는지 확인한다. 네이버는 공식
API 가 아니라 스키마가 바뀔 수 있어서, 뭔가 이상하면 여기부터 돌려보면 된다.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

from .pipeline import NotFound, diagnose, render_text
from .providers.naver import NaverProvider

PROBE_CODE = "005930"  # 삼성전자. 상장폐지 걱정 없는 기준점.


async def selftest() -> int:
    print("데이터 소스 진단\n" + "=" * 46)
    results: list[tuple[str, bool, str]] = []

    async with NaverProvider() as p:
        resolved = await p.resolve("삼성전자")
        results.append(("종목명 검색", resolved is not None, str(resolved)))

        quote = await p.quote(PROBE_CODE)
        results.append((
            "시세 조회", quote is not None,
            f"{quote.name} {quote.price:,.0f} ({quote.change_rate:+.2f}%)" if quote else "실패",
        ))

        price, rate = await p.index("KOSPI")
        results.append(("지수 조회", rate is not None, f"KOSPI {price} ({rate}%)"))

        avg = await p.avg_volume(PROBE_CODE)
        results.append(("일봉/평균거래량", avg is not None, f"20일 평균 {avg:,.0f}주" if avg else "실패"))

        news = await p.news(PROBE_CODE, limit=5)
        results.append(("뉴스 조회", bool(news), f"{len(news)}건" + (f" · 최신: {news[0].title[:36]}" if news else "")))

        report = p.report.as_dict()

    for name, ok, detail in results:
        print(f"  [{'OK  ' if ok else 'FAIL'}] {name:<16} {detail}")

    print("\n엔드포인트별 결과")
    for e in report["ok"]:
        print(f"  [OK  ] {e}")
    for f in report["failed"]:
        print(f"  [FAIL] {f['endpoint']}: {f['error']}")

    key = os.getenv("ANTHROPIC_API_KEY")
    print(f"\nLLM: {'사용 가능 (' + os.getenv('STOCKWHY_MODEL', 'claude-sonnet-5') + ')' if key else 'ANTHROPIC_API_KEY 미설정 — 규칙 기반으로만 동작합니다'}")

    failures = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results) - failures}/{len(results)} 통과")
    return 1 if failures else 0


async def run(query: str, use_llm: bool, as_json: bool) -> int:
    try:
        result = await diagnose(query, use_llm=use_llm)
    except NotFound as e:
        print(f"오류: {e}", file=sys.stderr)
        return 1

    if as_json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(render_text(result))
        if result["diagnostics"]["failed"]:
            names = ", ".join(f["endpoint"] for f in result["diagnostics"]["failed"])
            print(f"\n(일부 데이터 소스 실패: {names} — 정확도가 낮을 수 있습니다)", file=sys.stderr)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description="장중 시세 원인 분석")
    ap.add_argument("query", nargs="?", help="종목명 또는 6자리 코드")
    ap.add_argument("--no-llm", action="store_true", help="LLM 없이 규칙 기반만 사용")
    ap.add_argument("--json", action="store_true", help="원본 JSON 출력")
    ap.add_argument("--selftest", action="store_true", help="데이터 소스 생사 확인")
    args = ap.parse_args()

    if args.selftest:
        return asyncio.run(selftest())
    if not args.query:
        ap.print_help()
        return 2
    return asyncio.run(run(args.query, not args.no_llm, args.json))


if __name__ == "__main__":
    raise SystemExit(main())
