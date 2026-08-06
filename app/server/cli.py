"""터미널에서 바로 쓰는 CLI + 엔드포인트 진단.

    python -m server.cli 삼성전자          # 분석
    python -m server.cli 005930 --no-llm   # 규칙 기반만
    python -m server.cli --selftest        # 데이터 소스 생사 확인
    python -m server.cli 삼성전자 --json    # 원본 JSON
    python -m server.cli serve             # 웹서버 (폰 접속 주소 안내)

`--selftest` 는 네이버 엔드포인트가 여전히 살아있는지 확인한다. 네이버는 공식
API 가 아니라 스키마가 바뀔 수 있어서, 뭔가 이상하면 여기부터 돌려보면 된다.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import socket
import sys

from .config import access_token, has_api_key, load_env, model_name, setup_tls
from .pipeline import NotFound, diagnose, render_text
from .providers.naver import NaverProvider

PROBE_CODE = "005930"  # 삼성전자. 상장폐지 걱정 없는 기준점.


def lan_ip() -> str | None:
    """이 PC 의 사설망 IP. 같은 와이파이의 폰이 접속할 주소다."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("8.8.8.8", 80))       # 실제로 패킷을 보내진 않는다
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def serve(port: int) -> int:
    import uvicorn

    ip = lan_ip()
    tok = access_token()
    suffix = f"/?t={tok}" if tok else ""

    print("장중 시세 원인 분석 서버")
    print(f"  이 PC       http://localhost:{port}{suffix}")
    if ip:
        print(f"  같은 와이파이의 폰   http://{ip}:{port}{suffix}")
    else:
        print("  (사설 IP를 찾지 못했습니다. 폰 접속은 --host 를 직접 확인하세요)")
    print(f"  LLM         {'사용 (' + model_name() + ')' if has_api_key() else '미사용 — 규칙 기반'}")
    print(f"  TLS         {setup_tls()}")
    if tok:
        print("  잠금        켜짐 — 폰에서 위 ?t=... 주소로 한 번만 접속하면 저장됩니다")
    else:
        print("  잠금        꺼짐 — 공개 터널로 열 거라면 STOCKWHY_TOKEN 을 설정하세요")
    print("  중지: Ctrl+C\n")

    uvicorn.run("server.main:app", host="0.0.0.0", port=port, log_level="warning")
    return 0


TLS_HELP = """
────────────────────────────────────────────────────────────────
전부 인증서 오류입니다. 회사망의 TLS 검사 장비 때문입니다.

사내망은 HTTPS 를 중간에서 풀었다가 회사 자체 인증서로 다시 묶어 내보냅니다.
그 루트 인증서는 Windows 에 이미 깔려 있지만 Python 은 OS 저장소를 안 보고
자체 번들만 봐서 거부합니다. 네이버가 막은 게 아닙니다.

해결:  python -m pip install truststore
       (설치하면 Python 이 Windows 인증서 저장소를 쓰게 되어 바로 해결됩니다)

그래도 안 되면 회사 루트 인증서를 .pem 으로 내보내서 .env 에 지정하세요:
       STOCKWHY_CA_BUNDLE=C:\\path\\to\\company-root.pem

인증서 검증을 끄는 방법은 안내하지 않습니다. 사내망에서는 실제 보안 저하입니다.
────────────────────────────────────────────────────────────────"""


async def selftest() -> int:
    print("데이터 소스 진단\n" + "=" * 46)
    print(f"  TLS: {setup_tls()}\n")
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

    print(f"\nLLM: {'사용 가능 (' + model_name() + ')' if has_api_key() else 'ANTHROPIC_API_KEY 미설정 — 규칙 기반으로만 동작합니다'}")

    failures = sum(1 for _, ok, _ in results if not ok)
    print(f"\n{len(results) - failures}/{len(results)} 통과")

    # 실패 원인이 하나로 수렴하면 그 해결책을 바로 알려준다.
    errors = " ".join(f["error"] for f in report["failed"])
    if "CERTIFICATE_VERIFY" in errors or "SSLCertVerification" in errors:
        print(TLS_HELP)
    elif failures and ("ProxyError" in errors or "ConnectTimeout" in errors):
        print("\n네트워크가 막혀 있습니다. 사내 프록시를 쓴다면 HTTPS_PROXY 환경변수를 설정하세요.")

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
    load_env()
    setup_tls()   # httpx 클라이언트를 만들기 전에 해야 한다.

    ap = argparse.ArgumentParser(description="장중 시세 원인 분석")
    ap.add_argument("query", nargs="?", help="종목명 또는 6자리 코드 (또는 'serve')")
    ap.add_argument("--no-llm", action="store_true", help="LLM 없이 규칙 기반만 사용")
    ap.add_argument("--json", action="store_true", help="원본 JSON 출력")
    ap.add_argument("--selftest", action="store_true", help="데이터 소스 생사 확인")
    ap.add_argument("--port", type=int, default=8000, help="serve 포트 (기본 8000)")
    args = ap.parse_args()

    if args.selftest:
        return asyncio.run(selftest())
    if args.query == "serve":
        return serve(args.port)
    if not args.query:
        ap.print_help()
        return 2
    return asyncio.run(run(args.query, not args.no_llm, args.json))


if __name__ == "__main__":
    raise SystemExit(main())
