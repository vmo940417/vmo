"""KRX 공매도 엔드포인트 탐침 — 일회성 진단 도구.

    python tools/probe_krx.py

개발 컨테이너에서는 KRX 가 403 이라 응답을 볼 수 없어서, 화면 코드(bld)와
파라미터 조합을 추측으로 짰다. 첫 시도에서 ISIN 조회는 통과했지만 거래 조회는
400 이 났다 — 전송 방식은 맞고 bld/파라미터가 틀렸다는 뜻이다.

한 번에 하나씩 고쳐 올리면 CI 왕복이 계속 쌓이므로, 후보를 격자로 훑어
어느 조합이 200 을 주는지 한 번에 본다. 정답을 찾으면 krx.py 에 반영하고
이 파일은 지운다.

네트워크가 열린 곳(윈도우 러너)에서 돌려야 의미가 있다.
"""

from __future__ import annotations

import asyncio
import sys
from datetime import datetime, timedelta
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.providers.krx import HEADERS, URL  # noqa: E402

CODE = "005930"
ISIN = "KR7005930003"

BLDS = [
    "dbms/MDC/STAT/srt/MDCSTAT30101",
    "dbms/MDC/STAT/srt/MDCSTAT30001",
    "dbms/MDC/STAT/srt/MDCSTAT30201",
    "dbms/MDC/STAT/srt/MDCSTAT30301",
    "dbms/MDC/STAT/srt/MDCSTAT30401",
    "dbms/MDC/STAT/srt/MDCSTAT30501",
    "dbms/MDC/STAT/srt/MDCSTAT30601",
    "dbms/MDC/STAT/srt/MDCSTAT30701",
    "dbms/MDC/STAT/standard/MDCSTAT30101",
]

END = datetime.now()
START = END - timedelta(days=30)


def param_sets() -> dict[str, dict]:
    base = {
        "isuCd": ISIN, "strtDd": START.strftime("%Y%m%d"), "endDd": END.strftime("%Y%m%d"),
        "share": "1", "money": "1", "csvxls_isNo": "false",
    }
    return {
        # locale 이 빠지면 KRX 가 거부하는 화면이 있다.
        "A(minimal+locale)": {**base, "locale": "ko_KR"},
        "B(full)": {
            **base, "locale": "ko_KR", "inqCondTpCd": "1", "trdVolVal": "1",
            "mktTpCd": "1", "secugrpId": "STMFRTSCIFDRFS", "askBid": "1",
        },
        # 현재 krx.py 가 보내는 조합 (locale 없음)
        "C(current)": {
            **base, "isuCd2": ISIN, "searchType": "2", "mktTpCd": "1",
            "inqCondTpCd": "1", "trdVolVal": "1", "askBid": "1",
        },
    }


async def probe(client: httpx.AsyncClient, bld: str, label: str, params: dict) -> None:
    try:
        r = await client.post(URL, data={**params, "bld": bld}, headers=HEADERS, timeout=15.0)
    except Exception as e:  # noqa: BLE001
        print(f"  {bld:<40} {label:<18} 예외 {type(e).__name__}: {e}")
        return

    body = r.text.replace("\n", " ")[:220]
    mark = "OK  " if r.status_code == 200 and '"' in r.text and len(r.text) > 40 else "----"
    print(f"  [{mark}] {bld:<40} {label:<18} {r.status_code}  {body}")


async def main() -> int:
    print("KRX 공매도 엔드포인트 탐침")
    print(f"  종목 {CODE} / ISIN {ISIN}")
    print(f"  기간 {START:%Y%m%d} ~ {END:%Y%m%d}\n")

    async with httpx.AsyncClient(follow_redirects=True) as client:
        # 먼저 ISIN 조회가 되는지 — 이게 되면 전송 방식(주소·헤더·인코딩)은 맞다.
        r = await client.post(URL, headers=HEADERS, timeout=15.0, data={
            "bld": "dbms/comm/finder/finder_srtisu", "mktsel": "ALL",
            "typeNo": "0", "searchText": CODE,
        })
        print(f"  ISIN 조회: {r.status_code}  {r.text[:160]}\n")

        for label, params in param_sets().items():
            for bld in BLDS:
                await probe(client, bld, label, params)
            print()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
