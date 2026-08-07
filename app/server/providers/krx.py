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
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any, Optional

import httpx

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


async def _post(client: httpx.AsyncClient, report, name: str, payload: dict) -> Optional[dict]:
    try:
        r = await client.post(URL, data=payload, headers=HEADERS, timeout=10.0)
        r.raise_for_status()
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


async def short_sales(client: httpx.AsyncClient, report, code: str,
                      days: int = 10, today: Optional[datetime] = None) -> list[ShortSale]:
    """개별종목 일별 공매도(거래 + 잔고). 실패하면 빈 목록."""
    today = today or datetime.now()
    # 공매도는 마감 후 집계라 오늘 것은 없다. 휴장을 감안해 넉넉히 잡는다.
    start = (today - timedelta(days=days * 2 + 10)).strftime("%Y%m%d")
    end = today.strftime("%Y%m%d")

    isu = await isin(client, report, code)
    if not isu:
        return []

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
