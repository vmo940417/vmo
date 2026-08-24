"""KRX 정보데이터시스템 공매도 수집.

네이버에서 개별종목 공매도를 받으려던 경로는 전부 죽어 있다. 윈도우 러너에서
실제로 확인했다(개발 컨테이너는 네이버가 403 이라 확인할 수 없었다).

    [FAIL] shortSellingTrend: 404
    [FAIL] shortStockTrend: 404
    [OK  ] short_trade.naver  -> 일별 공매도 표가 아니라 종목 메인 페이지

그래서 원출처인 KRX 에서 직접 받는다. 네이버가 중간에서 가공해 주던 걸
한 단계 건너뛰는 셈이라 오히려 더 안정적이다.

주의할 점 두 가지.

1. **KRX 는 6자리 종목코드가 아니라 ISIN(KR7005930003)을 받는다.** 코드에서
   ISIN 을 계산할 수도 있지만(체크디짓 규칙), 검색 엔드포인트로 물어보는 쪽이
   규칙이 바뀌어도 버틴다.
2. **공매도는 장 마감 후에 집계된다.** 장중에 '오늘 공매도'는 존재하지 않는다.
   그래서 최근 며칠을 받아 가장 최신 행을 쓰고, 그 행의 날짜를 반드시 함께
   들고 다닌다(SupplyDemand 가 그걸 화면과 프롬프트에 그대로 노출한다).

응답 스키마는 공개 문서가 없어서 여기서도 키 후보를 넓게 잡고, 못 읽으면
report.samples 에 응답 앞부분을 남긴다.

로그인 세션 (KRX_ID / KRX_PW)
------------------------------
KRX Data Marketplace 개편 이후, 개별종목 공매도(MDCSTAT30001/30101)는 익명
요청이면 파라미터가 뭐든 무조건 `400: LOGOUT` 이다 — CI 탐침으로 27가지
bld/파라미터 조합을 다 돌려봐도 예외 없이 똑같이 실패해서 확인했다. 앞서
붙여본 "메인 화면 먼저 GET 해서 세션 쿠키만 받기"로는 안 뚫렸다.

`KRX_ID`/`KRX_PW` 환경변수(사용자 본인의 KRX Data Marketplace 로그인 계정)가
설정돼 있으면, pykrx(sharebook-kr/pykrx) 의 로그인 세션 기능으로 먼저
시도한다. 계정이 없으면 이 데이터만 빠진 채로 나머지 분석은 그대로 나간다 —
공매도는 원래도 선택적 부가 정보다.

주의: 자동 로그인·수집이 KRX 약관상 명시적으로 허용되는지는 확인되지 않았다.
계정 제재 위험이 있으므로 저빈도 조회로 제한하는 게 안전하다. pykrx 는
pandas/numpy 를 끌고 오는 무거운 의존성이라, 계정이 없는 환경(대부분의
사용자)에서는 아예 import 되지 않는다(호출 시점에만 지연 import).
"""

from __future__ import annotations

import asyncio
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx

from ..config import has_krx_credentials
from ..models import ShortSale

URL = "https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd"

# Referer 가 없으면 KRX 가 빈 응답을 준다. 브라우저에서 오는 요청처럼 보여야 한다.
HEADERS = {
    "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                   "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"),
    "Referer": "https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020403",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
}

# 공매도 거래(일별). 화면마다 bld 가 달라서 후보를 둔다.
TRADE_BLDS = (
    "dbms/MDC/STAT/srt/MDCSTAT30101",   # 개별종목 공매도 거래 (기간 조회)
    "dbms/MDC/STAT/srt/MDCSTAT30001",   # 종목별 공매도 거래
)
# 공매도 잔고(일별)
BALANCE_BLDS = (
    "dbms/MDC/STAT/srt/MDCSTAT30501",
    "dbms/MDC/STAT/srt/MDCSTAT30401",
)

ISIN_BLD = "dbms/comm/finder/finder_srtisu"

DATE_KEYS = ("TRD_DD", "BAS_DD", "TRD_DT", "STD_DD")
VOLUME_KEYS = ("CVSRTSELL_TRDVOL", "SRTSELL_TRDVOL", "CVSRTSELL_TRDVOL_QTY")
VALUE_KEYS = ("CVSRTSELL_TRDVAL", "SRTSELL_TRDVAL")
# 비중은 거래대금 기준을 먼저 본다 — 금액 비중이 시장 충격을 더 잘 나타낸다.
RATIO_KEYS = ("TRDVAL_WT", "TRDVOL_WT", "CVSRTSELL_TRDVAL_WT", "CVSRTSELL_TRDVOL_WT")
BAL_QTY_KEYS = ("BAL_QTY", "BAL_QTY_TOT", "SRTSELL_BAL_QTY")
BAL_RATIO_KEYS = ("BAL_RTO", "BAL_RTO_TOT", "SRTSELL_BAL_RTO")


def _f(value: Any) -> Optional[float]:
    """KRX 는 숫자를 '1,500,000' 처럼 콤마 문자열로 준다. '-' 는 결측이다."""
    if value in (None, "", "-", "N/A"):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").replace("%", "").strip())
    except ValueError:
        return None


def _first(row: dict, *keys: str) -> Any:
    for key in keys:
        if isinstance(row, dict) and row.get(key) not in (None, "", "-"):
            return row[key]
    return None


def _norm_date(raw: Any) -> str:
    """'2026/08/06' -> '2026-08-06'."""
    if raw in (None, ""):
        return ""
    digits = "".join(ch for ch in str(raw) if ch.isdigit())
    return f"{digits[0:4]}-{digits[4:6]}-{digits[6:8]}" if len(digits) >= 8 else ""


def _rows(data: Any) -> list[dict]:
    if not isinstance(data, dict):
        return []
    for key in ("OutBlock_1", "output", "block1", "OutBlock_2"):
        bucket = data.get(key)
        if isinstance(bucket, list):
            return [r for r in bucket if isinstance(r, dict)]
    return []


MAIN_PAGE = "https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020403"


async def _ensure_session(client: httpx.AsyncClient, report) -> None:
    """getJsonData.cmd 의 srt/STAT 계열(개별종목 공매도)은 세션 쿠키가 없으면
    파라미터가 뭐든 전부 'HTTP 400: LOGOUT' 을 준다 — 탐침 스크립트로 bld/
    파라미터 조합을 전부 돌려봐도 예외 없이 똑같이 실패해서 확인했다.
    (반면 ISIN 조회 같은 단순 finder 엔드포인트는 세션 없이도 통과한다.)
    브라우저가 화면을 열 때처럼 메인 화면을 한 번 GET 해서 JSESSIONID 를
    먼저 받아두면, 같은 httpx 클라이언트의 쿠키잔에 저장되어 이후 POST 에
    자동으로 실린다."""
    try:
        await client.get(MAIN_PAGE, headers=HEADERS, timeout=10.0)
    except Exception as e:  # noqa: BLE001 - 워밍업 실패해도 이후 POST 가 그대로
        report.note_fail("krx/session", f"{type(e).__name__}: {e}")


async def _post(client: httpx.AsyncClient, report, name: str, payload: dict) -> Optional[dict]:
    try:
        r = await client.post(URL, data=payload, headers=HEADERS, timeout=10.0)
        if r.status_code >= 400:
            # KRX 는 무엇이 잘못됐는지를 본문에 적어준다. 상태 코드만 남기면
            # "400" 만 보고 파라미터를 찍어 맞히게 된다.
            raise RuntimeError(f"HTTP {r.status_code}: {r.text[:200]}")
        data = r.json()
        report.note_ok(name)
        return data
    except Exception as e:  # noqa: BLE001 - 공매도가 없어도 나머지 분석은 나와야 한다
        report.note_fail(name, f"{type(e).__name__}: {e}")
        return None


async def isin(client: httpx.AsyncClient, report, code: str) -> Optional[str]:
    """6자리 코드 -> ISIN. KRX 조회는 이게 없으면 시작이 안 된다."""
    data = await _post(client, report, "krx/isin", {
        "bld": ISIN_BLD, "mktsel": "ALL", "typeNo": "0", "searchText": code,
    })
    for row in _rows(data):
        full = _first(row, "full_code", "isuCd", "ISU_CD")
        short = str(_first(row, "short_code", "isuSrtCd", "ISU_SRT_CD") or "")
        if full and (not short or short == code):
            return str(full)
    if data is not None:
        report.note_sample("krx/isin", data)
    return None


def parse_trades(data: Any, limit: int = 10) -> list[ShortSale]:
    """공매도 거래 응답 -> ShortSale 목록(최신순)."""
    out: list[ShortSale] = []
    for row in _rows(data):
        date = _norm_date(_first(row, *DATE_KEYS))
        volume = _f(_first(row, *VOLUME_KEYS))
        value = _f(_first(row, *VALUE_KEYS))
        ratio = _f(_first(row, *RATIO_KEYS))
        if not date or (volume is None and value is None and ratio is None):
            continue
        out.append(ShortSale(date=date, volume=volume, value=value, ratio=ratio))

    # KRX 는 과거->현재 순으로 주기도 한다. 최신이 앞이어야 한다.
    out.sort(key=lambda s: s.date, reverse=True)
    return out[:limit]


def merge_balance(sales: list[ShortSale], data: Any) -> list[ShortSale]:
    """잔고 응답을 날짜로 맞춰 끼워 넣는다. 없으면 그대로 둔다."""
    by_date: dict[str, dict] = {}
    for row in _rows(data):
        date = _norm_date(_first(row, *DATE_KEYS))
        if date:
            by_date[date] = row
    for sale in sales:
        row = by_date.get(sale.date)
        if row:
            sale.balance_qty = _f(_first(row, *BAL_QTY_KEYS))
            sale.balance_ratio = _f(_first(row, *BAL_RATIO_KEYS))
    return sales


def _fetch_short_status_sync(isu_cd: str, fromdate: str, todate: str) -> list[dict]:
    """MDCSTAT30001(개별종목 공매도 종합정보)을 pykrx 의 로그인 세션 기능으로
    받는다. pykrx 는 동기(블로킹) 라이브러리라 반드시 asyncio.to_thread 로만
    불러야 한다 — 직접 호출하면 이벤트 루프가 그동안 막힌다.

    pykrx 가 안 깔려 있거나 로그인이 실패하면 예외를 그대로 던진다. 호출부
    (_short_sales_via_pykrx)에서 잡아 report 에 남기고 빈 목록으로 넘어간다.
    """
    from pykrx.website.krx.market.core import 개별종목_공매도_종합정보
    df = 개별종목_공매도_종합정보().fetch(strtDd=fromdate, endDd=todate, isuCd=isu_cd)
    return df.to_dict(orient="records")


async def _short_sales_via_pykrx(report, isu: str, days: int, today: datetime) -> list[ShortSale]:
    """KRX_ID/KRX_PW 로 로그인해서 받는 경로. 실패해도 예외를 밖으로 던지지
    않는다 — 계정 문제 하나로 나머지 분석까지 막히면 안 된다."""
    start = (today - timedelta(days=days * 2 + 10)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")
    try:
        rows = await asyncio.to_thread(_fetch_short_status_sync, isu, start, end)
    except Exception as e:  # noqa: BLE001 - pykrx 미설치/로그인 실패 등, 사유는 report 에 남긴다
        report.note_fail("krx/pykrx", f"{type(e).__name__}: {e}")
        return []

    data = {"OutBlock_1": rows}
    sales = parse_trades(data, days)
    if not sales:
        if rows:
            report.note_sample("krx/pykrx", rows[:3])
        return []
    merge_balance(sales, data)  # 종합정보 응답에 잔고 컬럼이 같이 오면 이 자리에서 채워진다
    report.note_ok("krx/pykrx")
    return sales


async def short_sales(client: httpx.AsyncClient, report, code: str,
                      days: int = 10, today: Optional[datetime] = None) -> list[ShortSale]:
    """개별종목 일별 공매도(거래 + 잔고). 실패하면 빈 목록."""
    today = today or datetime.now()
    # 공매도는 마감 후 집계라 오늘 것은 없다. 휴장을 감안해 넉넉히 잡는다.
    start = (today - timedelta(days=days * 2 + 10)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")

    # ISIN 조회는 세션이 필요 없는 엔드포인트라 워밍업과 동시에 보내도 된다.
    isu, _ = await asyncio.gather(isin(client, report, code), _ensure_session(client, report))
    if not isu:
        return []

    # KRX Data Marketplace 개편 이후 STAT 계열(MDCSTAT30001/30101)은 로그인
    # 세션 없이는 파라미터가 뭐든 무조건 400 LOGOUT 이다 — CI 탐침으로 확인된
    # 사실이라 익명 세션 워밍업으로는 못 뚫는다. 로그인 계정(KRX_ID/KRX_PW)이
    # 설정돼 있으면 먼저 시도한다.
    if has_krx_credentials():
        sales = await _short_sales_via_pykrx(report, isu, days, today)
        if sales:
            return sales
        # 로그인 조회가 비었어도(휴장/계정 문제 등) 밑져야 본전이니 아래
        # 익명 경로를 마저 시도한다 — 실패 사유는 report 에 이미 남아 있다.

    base = {
        "isuCd": isu, "isuCd2": isu, "strtDd": start, "endDd": end,
        "searchType": "2", "mktTpCd": "1", "inqCondTpCd": "1",
        "trdVolVal": "1", "askBid": "1", "share": "1", "money": "1",
        "csvxls_isNo": "false",
    }

    sales: list[ShortSale] = []
    for bld in TRADE_BLDS:
        name = f"krx/{bld.rsplit('/', 1)[-1]}"
        data = await _post(client, report, name, {**base, "bld": bld})
        sales = parse_trades(data, days)
        if sales:
            break
        if data is not None:
            report.note_sample(name, data)
    if not sales:
        return []

    for bld in BALANCE_BLDS:
        name = f"krx/{bld.rsplit('/', 1)[-1]}"
        data = await _post(client, report, name, {**base, "bld": bld})
        if _rows(data):
            merge_balance(sales, data)
            break

    return sales
