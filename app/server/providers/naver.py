"""네이버 금융 데이터 수집.

주의: 네이버는 공개 문서화된 시세 API를 제공하지 않는다. 여기서 쓰는 모바일
엔드포인트들은 안정적으로 쓰이고 있지만 공식 계약이 아니므로 언제든 스키마가
바뀔 수 있다. 그래서 이 모듈은 다음 원칙을 지킨다.

  1. 엔드포인트마다 후보를 여러 개 두고 순서대로 시도한다.
  2. 어떤 필드가 없어도 예외를 던지지 않고 None 으로 흘려보낸다.
     (분석 단계가 결측을 이미 감당하도록 설계돼 있다)
  3. 무엇이 성공/실패했는지 `ProviderReport` 에 남겨서 진단할 수 있게 한다.

`python -m server.selftest` 로 각 엔드포인트의 생사를 확인할 수 있다.
"""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any, Optional

import httpx

from ..models import InvestorFlow, MarketContext, NewsItem, Quote, SupplyDemand
from . import krx

UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
      "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1")

HEADERS = {
    "User-Agent": UA,
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://m.stock.naver.com/",
}

CODE_RE = re.compile(r"^\d{6}$")


@dataclass
class ProviderReport:
    """어떤 엔드포인트가 실제로 응답했는지 기록. 진단용."""

    ok: list[str] = field(default_factory=list)
    failed: list[tuple[str, str]] = field(default_factory=list)
    # 200 은 받았는데 파싱 결과가 비었을 때의 응답 앞부분. 스키마가 예상과
    # 다를 때 화면(또는 스크린샷) 하나로 바로 고칠 수 있게 남긴다.
    samples: dict[str, str] = field(default_factory=dict)

    def note_ok(self, name: str) -> None:
        self.ok.append(name)

    def note_fail(self, name: str, err: str) -> None:
        self.failed.append((name, err[:200]))

    def note_sample(self, name: str, raw: Any) -> None:
        text = raw if isinstance(raw, str) else json.dumps(raw, ensure_ascii=False)
        self.samples[name] = text[:400]

    def as_dict(self) -> dict:
        return {
            "ok": self.ok,
            "failed": [{"endpoint": n, "error": e} for n, e in self.failed],
            "samples": self.samples,
        }


def _f(value: Any) -> Optional[float]:
    """네이버는 숫자를 '228,500' 같은 문자열로도 내려준다."""
    if value is None or value == "":
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        return float(str(value).replace(",", "").replace("%", "").strip())
    except ValueError:
        return None


def _i(value: Any) -> Optional[int]:
    f = _f(value)
    return int(f) if f is not None else None


def _first(d: dict, *keys: str) -> Any:
    """스키마가 바뀌어도 버티도록 여러 키 이름을 순서대로 본다."""
    for k in keys:
        if isinstance(d, dict) and d.get(k) not in (None, ""):
            return d[k]
    return None


# 시장 구분은 어느 지수와 비교할지를 정한다(코스닥 종목을 코스피와 비교하면
# 분해 자체가 틀린다). 그런데 네이버는 이 값을 문자열로 주기도 하고
# {code}/{name}/{text} 를 가진 객체로 주기도 해서, 키 하나만 보면 놓친다.
# 그래서 이름에 exchange/market 이 들어간 필드를 전부 훑어 토큰을 찾는다.
MARKET_TOKENS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ("KOSDAQ", ("KOSDAQ", "코스닥")),
    ("KONEX", ("KONEX", "코넥스")),
    ("KOSPI", ("KOSPI", "코스피", "유가증권")),
)


def _texts(value: Any, depth: int = 0) -> Any:
    """중첩 구조 안의 문자열만 훑는다."""
    if isinstance(value, str):
        yield value
    elif depth < 3 and isinstance(value, dict):
        for v in value.values():
            yield from _texts(v, depth + 1)
    elif depth < 3 and isinstance(value, list):
        for v in value[:8]:
            yield from _texts(v, depth + 1)


def market_of(payload: dict) -> str:
    """시세 응답에서 KOSPI / KOSDAQ / KONEX 를 뽑는다. 못 찾으면 UNKNOWN."""
    if not isinstance(payload, dict):
        return "UNKNOWN"
    for key, value in payload.items():
        low = key.lower()
        if "exchange" not in low and "market" not in low:
            continue
        for text in _texts(value):
            up = text.upper()
            for market, tokens in MARKET_TOKENS:
                if any(t in up for t in tokens):
                    return market
    return "UNKNOWN"


class NaverProvider:
    def __init__(self, client: Optional[httpx.AsyncClient] = None, timeout: float = 6.0):
        self._client = client
        self._own_client = client is None
        self._timeout = timeout
        self.report = ProviderReport()

    async def __aenter__(self) -> "NaverProvider":
        if self._client is None:
            from ..config import ca_bundle
            # verify=True 여도 truststore 가 끼워져 있으면 OS 인증서 저장소를 쓴다.
            # (config.setup_tls 참고 — 회사망 TLS 검사 장비 대응)
            self._client = httpx.AsyncClient(
                headers=HEADERS, timeout=self._timeout, follow_redirects=True,
                verify=ca_bundle() or True,
            )
        return self

    async def __aexit__(self, *exc: Any) -> None:
        if self._own_client and self._client is not None:
            await self._client.aclose()

    async def _get_json(self, name: str, url: str) -> Optional[Any]:
        assert self._client is not None
        try:
            r = await self._client.get(url)
            r.raise_for_status()
            data = r.json()
            self.report.note_ok(name)
            return data
        except Exception as e:  # noqa: BLE001 - 어떤 실패든 degrade 시킨다
            self.report.note_fail(name, f"{type(e).__name__}: {e}")
            return None

    # -- 종목 코드 해석 ---------------------------------------------------

    async def resolve(self, query: str) -> Optional[tuple[str, str]]:
        """종목명/코드 -> (코드, 이름). 못 찾으면 None."""
        query = query.strip()
        if CODE_RE.match(query):
            name = await self._name_of(query)
            return query, name or query

        # ac.stock 이 실동작 확인된 경로다. search/all 은 404 라 뒤로 뺐지만,
        # ac.stock 이 바뀔 때를 대비해 폴백으로는 남겨둔다.
        for name, url in (
            ("ac.stock", f"https://ac.stock.naver.com/ac?q={query}&target=stock&st=111"),
            ("search/all", f"https://m.stock.naver.com/api/search/all?query={query}"),
        ):
            data = await self._get_json(name, url)
            hit = self._extract_hit(data)
            if hit:
                return hit
        return None

    @staticmethod
    def _extract_hit(data: Any) -> Optional[tuple[str, str]]:
        if not data:
            return None
        # search/all 형태
        if isinstance(data, dict):
            for key in ("stocks", "domesticStocks", "items", "result"):
                bucket = data.get(key)
                if isinstance(bucket, dict):
                    bucket = bucket.get("items") or bucket.get("stocks")
                if isinstance(bucket, list) and bucket:
                    first = bucket[0]
                    if isinstance(first, dict):
                        code = _first(first, "itemCode", "code", "cd", "reutersCode")
                        nm = _first(first, "stockName", "name", "nm", "korName")
                        if code and CODE_RE.match(str(code)):
                            return str(code), str(nm or code)
            # ac.stock 형태: {"items":[[[code],[name],...]]}
            items = data.get("items")
            if isinstance(items, list) and items and isinstance(items[0], list):
                for row in items[0]:
                    if isinstance(row, list) and row:
                        flat = [str(c[0]) if isinstance(c, list) and c else str(c) for c in row]
                        codes = [c for c in flat if CODE_RE.match(c)]
                        if codes:
                            nm = next((c for c in flat if not CODE_RE.match(c) and c), codes[0])
                            return codes[0], nm
        return None

    async def _name_of(self, code: str) -> Optional[str]:
        data = await self._get_json(
            "integration/name", f"https://m.stock.naver.com/api/stock/{code}/integration")
        if isinstance(data, dict):
            return _first(data, "stockName", "name", "korName")
        return None

    # -- 시세 -------------------------------------------------------------

    async def quote(self, code: str) -> Optional[Quote]:
        integration, basic = await asyncio.gather(
            self._get_json("integration", f"https://m.stock.naver.com/api/stock/{code}/integration"),
            self._get_json("basic", f"https://m.stock.naver.com/api/stock/{code}/basic"),
        )
        merged: dict = {}
        for src in (integration, basic):
            if isinstance(src, dict):
                merged.update({k: v for k, v in src.items() if v not in (None, "")})
        if not merged:
            return None

        price = _f(_first(merged, "closePrice", "nv", "now"))
        if price is None:
            return None

        rate = _f(_first(merged, "fluctuationsRatio", "cr", "rate"))
        change = _f(_first(merged, "compareToPreviousClosePrice", "cv", "change"))
        # 네이버는 하락일 때 부호를 별도 필드로 주는 경우가 있다.
        sign = str(_first(merged, "compareToPreviousPrice", "risefall") or "")
        if change is not None and rate is not None and rate < 0 and change > 0:
            change = -change
        if change is not None and rate is None:
            prev = price - change
            rate = (change / prev * 100) if prev else None
        if change is None and rate is not None:
            change = price * rate / (100 + rate)

        industry = merged.get("industryCodeType")
        sector_name = None
        if isinstance(industry, dict):
            sector_name = _first(industry, "industryGroupKor", "industryName", "name", "text")
        elif isinstance(industry, str):
            sector_name = industry
        sector_name = sector_name or _first(merged, "industryName", "upjongName", "industryGroupKor")

        market = market_of(merged)
        if market == "UNKNOWN":
            self.report.note_sample("market", {k: v for k, v in merged.items()
                                               if "market" in k.lower() or "exchange" in k.lower()})

        return Quote(
            code=code,
            name=str(_first(merged, "stockName", "name", "korName") or code),
            price=price,
            change=change if change is not None else 0.0,
            change_rate=rate if rate is not None else 0.0,
            market=market,  # type: ignore[arg-type]
            sector_name=sector_name,
            open=_f(_first(merged, "openPrice", "ov")),
            high=_f(_first(merged, "highPrice", "hv")),
            low=_f(_first(merged, "lowPrice", "lv")),
            prev_close=_f(_first(merged, "previousClose", "pcv")),
            volume=_i(_first(merged, "accumulatedTradingVolume", "aq", "volume")),
            trading_value=_i(_first(merged, "accumulatedTradingValue", "aa")),
            market_cap=_i(_first(merged, "marketValue", "marketValueHangeul")),
            week52_high=_f(_first(merged, "highPriceOf52Weeks", "high52")),
            week52_low=_f(_first(merged, "lowPriceOf52Weeks", "low52")),
            as_of=datetime.now(),
            source="naver",
        )

    # -- 지수 -------------------------------------------------------------

    async def index(self, name: str = "KOSPI") -> tuple[Optional[float], Optional[float]]:
        data = await self._get_json(
            f"index/{name}", f"https://m.stock.naver.com/api/index/{name}/basic")
        if not isinstance(data, dict):
            return None, None
        price = _f(_first(data, "closePrice", "nv"))
        rate = _f(_first(data, "fluctuationsRatio", "cr"))
        return price, rate

    # -- 일봉 (20일 평균 거래량) -------------------------------------------

    async def avg_volume(self, code: str, days: int = 20) -> Optional[float]:
        """siseJson 은 JSON 이 아니라 파이썬 리터럴에 가까운 텍스트를 준다."""
        assert self._client is not None
        end = datetime.now().strftime("%Y%m%d")
        start = (datetime.now() - timedelta(days=days * 2 + 20)).strftime("%Y%m%d")
        url = ("https://api.finance.naver.com/siseJson.naver?"
               f"symbol={code}&requestType=1&startTime={start}&endTime={end}&timeframe=day")
        try:
            r = await self._client.get(url)
            r.raise_for_status()
            rows = json.loads(r.text.replace("'", '"'))
            self.report.note_ok("siseJson")
        except Exception as e:  # noqa: BLE001
            self.report.note_fail("siseJson", f"{type(e).__name__}: {e}")
            return None

        vols: list[float] = []
        for row in rows[1:]:  # 0번은 헤더
            if isinstance(row, list) and len(row) >= 6:
                v = _f(row[5])
                if v:
                    vols.append(v)
        if not vols:
            return None
        # 마지막 행은 당일(진행 중)이라 평균에서 뺀다.
        window = vols[-(days + 1):-1] or vols[-days:]
        return sum(window) / len(window) if window else None

    # -- 수급 / 공매도 -----------------------------------------------------

    async def _get_text(self, name: str, url: str) -> Optional[str]:
        assert self._client is not None
        try:
            r = await self._client.get(url)
            r.raise_for_status()
            self.report.note_ok(name)
            return r.text
        except Exception as e:  # noqa: BLE001
            self.report.note_fail(name, f"{type(e).__name__}: {e}")
            return None

    async def supply_demand(self, code: str, days: int = 10,
                            now: Optional[datetime] = None) -> SupplyDemand:
        """투자자별 매매동향 + 공매도.

        둘 다 시세와 달리 실시간이 아니다. 장중 수급은 잠정치고 공매도는 장이
        끝나야 나온다. 여기서는 '언제 기준 데이터인지'를 반드시 같이 담아서
        돌려주고, 해석(오늘 것이냐 어제 것이냐)은 분석 단계에서 한다.
        """
        flows, shorts = await asyncio.gather(
            self._investor_flows(code, days, now),
            # 공매도는 네이버가 더 이상 개별종목 API 로 주지 않아 원출처(KRX)에서 받는다.
            krx.short_sales(self._client, self.report, code, days),
        )
        return SupplyDemand(
            today=flows[0] if flows else None,
            history=flows,
            short=shorts[0] if shorts else None,
            short_history=shorts,
        )

    async def _investor_flows(self, code: str, days: int,
                              now: Optional[datetime]) -> list[InvestorFlow]:
        for name, url in (
            ("trend", f"https://m.stock.naver.com/api/stock/{code}/trend?pageSize={days}&page=1"),
            ("investorTrend", f"https://m.stock.naver.com/api/stock/{code}/investorTrend?pageSize={days}&page=1"),
        ):
            data = await self._get_json(name, url)
            rows = parse_flow_rows(data, days, now)
            if rows:
                return rows
            if data is not None:
                self.report.note_sample(name, data)

        # JSON 이 안 되면 오래된 HTML 화면을 긁는다. 15년 넘게 같은 주소라
        # JSON 엔드포인트보다 오히려 잘 버틴다.
        html = await self._get_text("frgn.naver", f"https://finance.naver.com/item/frgn.naver?code={code}")
        rows = parse_frgn_html(html or "", days, now)
        if not rows and html:
            self.report.note_sample("frgn.naver", html)
        return rows

    # -- 뉴스 -------------------------------------------------------------

    async def news(self, code: str, limit: int = 25) -> list[NewsItem]:
        data = await self._get_json(
            "news/stock",
            f"https://m.stock.naver.com/api/news/stock/{code}?pageSize={limit}&page=1")
        return self._parse_news(data, limit, self.report)

    @staticmethod
    def _parse_news(data: Any, limit: int, report: Optional[ProviderReport] = None) -> list[NewsItem]:
        out: list[NewsItem] = []
        if not isinstance(data, list):
            return out
        for group in data:
            # 응답은 [{items:[...]}] 형태이거나 기사 dict 가 바로 오기도 한다.
            entries = group.get("items") if isinstance(group, dict) and "items" in group else [group]
            for it in entries or []:
                if not isinstance(it, dict):
                    continue
                title = _first(it, "title", "articleTitle")
                if not title:
                    continue
                title = re.sub(r"<[^>]+>", "", str(title)).replace("&quot;", '"').replace("&amp;", "&")
                dt = None
                raw_dt = _first(it, "datetime", "officeDateTime", "dt")
                if raw_dt:
                    for fmt in ("%Y%m%d%H%M%S", "%Y-%m-%d %H:%M:%S", "%Y.%m.%d %H:%M"):
                        try:
                            dt = datetime.strptime(str(raw_dt), fmt)
                            break
                        except ValueError:
                            continue
                    # 값은 왔는데 아는 형식 셋 중 어느 것도 못 맞히면 날짜가
                    # 통째로 빈 채로 화면에 뜬다. 다음 진단에서 바로 형태를
                    # 보고 포맷을 맞출 수 있게 응답을 남긴다.
                    if dt is None and report is not None and "news_datetime" not in report.samples:
                        report.note_sample("news_datetime", raw_dt)
                oid, aid = _first(it, "officeId", "oid"), _first(it, "articleId", "aid")
                url = (f"https://n.news.naver.com/mnews/article/{oid}/{aid}"
                       if oid and aid else _first(it, "linkUrl", "url"))
                out.append(NewsItem(
                    title=title, published_at=dt, url=url,
                    press=_first(it, "officeName", "press"), source="naver",
                ))
                if len(out) >= limit:
                    return out
        return out


# --------------------------------------------------------------------------
# 수급 / 공매도 파서
#
# 응답 스키마를 확정할 수 없어서(비공식 엔드포인트) 키 이름 후보를 넓게 잡고,
# 하나도 못 읽으면 빈 리스트를 준다. 빈 결과는 report.samples 에 응답 앞부분이
# 남으므로 실제 응답을 보고 키를 맞추면 된다.
# --------------------------------------------------------------------------

# 수량(주) 기준 키와 금액(원) 기준 키. 단위를 섞으면 안 되므로 따로 본다.
FLOW_QUANT_KEYS: dict[str, tuple[str, ...]] = {
    "foreign": ("foreignerPureBuyQuant", "frgnPureBuyQuant", "foreignPureBuyQuant",
                "foreignerNetBuyQuant", "foreignerPureBuyVolume"),
    "institution": ("organPureBuyQuant", "institutionPureBuyQuant", "organNetBuyQuant",
                    "organPureBuyVolume"),
    "individual": ("individualPureBuyQuant", "personPureBuyQuant", "individualNetBuyQuant",
                   "individualPureBuyVolume"),
}
FLOW_AMOUNT_KEYS: dict[str, tuple[str, ...]] = {
    "foreign": ("foreignerPureBuyAmount", "frgnPureBuyAmount", "foreignPureBuyAmount",
                "foreignerNetBuyAmount"),
    "institution": ("organPureBuyAmount", "institutionPureBuyAmount", "organNetBuyAmount"),
    "individual": ("individualPureBuyAmount", "personPureBuyAmount", "individualNetBuyAmount"),
}

_TR_RE = re.compile(r"<tr[^>]*>(.*?)</tr>", re.S | re.I)
_TD_RE = re.compile(r"<td[^>]*>(.*?)</td>", re.S | re.I)
_TAG_RE = re.compile(r"<[^>]+>")
_DATE_CELL_RE = re.compile(r"^(\d{4})[.\-/](\d{2})[.\-/](\d{2})$")


def _norm_date(raw: Any) -> str:
    """네이버가 주는 온갖 날짜 표기를 YYYY-MM-DD 로 통일한다."""
    if raw in (None, ""):
        return ""
    s = str(raw).strip()
    m = re.match(r"^(\d{4})[.\-/]?(\d{2})[.\-/]?(\d{2})", s)
    return f"{m.group(1)}-{m.group(2)}-{m.group(3)}" if m else ""


def _is_provisional(date: str, now: Optional[datetime]) -> bool:
    """오늘 날짜의 수급은 장이 끝나기 전까지 잠정치다."""
    now = now or datetime.now()
    return bool(date) and date == now.strftime("%Y-%m-%d") and now.hour < 18


def _rows_of(data: Any) -> list:
    if isinstance(data, list):
        return [r for r in data if isinstance(r, dict)]
    if isinstance(data, dict):
        for key in ("trends", "items", "result", "datas", "list", "stockTrends", "trendList"):
            bucket = data.get(key)
            if isinstance(bucket, dict):
                bucket = bucket.get("items") or bucket.get("list")
            if isinstance(bucket, list):
                return [r for r in bucket if isinstance(r, dict)]
    return []


def parse_flow_rows(data: Any, limit: int = 10,
                    now: Optional[datetime] = None) -> list[InvestorFlow]:
    out: list[InvestorFlow] = []
    for row in _rows_of(data)[:limit]:
        date = _norm_date(_first(row, "bizdate", "localTradedAt", "localDate",
                                 "tradeDate", "date", "dt"))
        quant = {k: _f(_first(row, *keys)) for k, keys in FLOW_QUANT_KEYS.items()}
        amount = {k: _f(_first(row, *keys)) for k, keys in FLOW_AMOUNT_KEYS.items()}

        if any(v is not None for v in quant.values()):
            values, unit = quant, "주"
        elif any(v is not None for v in amount.values()):
            values, unit = amount, "원"
        else:
            continue

        out.append(InvestorFlow(
            date=date,
            foreign=values["foreign"],
            institution=values["institution"],
            individual=values["individual"],
            unit=unit,  # type: ignore[arg-type]
            foreign_hold_ratio=_f(_first(row, "foreignerHoldRatio", "frgnHoldRatio",
                                         "foreignHoldRatio", "foreignerExhaustRate")),
            provisional=_is_provisional(date, now),
        ))
    return out


def _cells(row_html: str) -> list[str]:
    out = []
    for raw in _TD_RE.findall(row_html):
        text = _TAG_RE.sub(" ", raw).replace("&nbsp;", " ").replace("&amp;", "&")
        out.append(" ".join(text.split()))
    return out


def parse_frgn_html(html: str, limit: int = 10,
                    now: Optional[datetime] = None) -> list[InvestorFlow]:
    """finance.naver.com/item/frgn.naver 의 일별 표.

    열 순서: 날짜 | 종가 | 전일비 | 등락률 | 거래량 | 기관 순매매량 |
             외국인 순매매량 | 보유주수 | 보유율
    """
    out: list[InvestorFlow] = []
    for row_html in _TR_RE.findall(html):
        cells = _cells(row_html)
        if len(cells) < 7 or not _DATE_CELL_RE.match(cells[0]):
            continue
        institution, foreign = _f(cells[5]), _f(cells[6])
        if institution is None and foreign is None:
            continue   # 열 위치가 예상과 다르면 조용히 버린다(틀린 숫자보다 없는 게 낫다)
        date = _norm_date(cells[0])
        out.append(InvestorFlow(
            date=date,
            institution=institution,
            foreign=foreign,
            unit="주",
            foreign_hold_ratio=_f(cells[8]) if len(cells) > 8 else None,
            provisional=_is_provisional(date, now),
        ))
        if len(out) >= limit:
            break
    return out


async def build_context(provider: NaverProvider, quote: Quote,
                        peer_codes: Optional[list[str]] = None) -> MarketContext:
    """지수 + 피어를 모아 분석에 넣을 시장 환경을 구성한다.

    업종 지수 엔드포인트는 신뢰도가 낮아서, 업종 등락률은 피어들의 시가총액
    가중 평균으로 근사한다. 피어가 없으면 업종 성분은 비워두고 분석 단계가
    잔차를 종목고유로 처리하게 둔다.
    """
    index_name = "KOSDAQ" if quote.market == "KOSDAQ" else "KOSPI"
    index_price, index_rate = await self_index(provider, index_name)

    peers: list[Quote] = []
    if peer_codes:
        results = await asyncio.gather(
            *(provider.quote(c) for c in peer_codes if c != quote.code),
            return_exceptions=True,
        )
        peers = [q for q in results if isinstance(q, Quote)]

    sector_rate = _weighted_sector_rate([quote, *peers])
    avg_vol, supply = await asyncio.gather(
        provider.avg_volume(quote.code),
        provider.supply_demand(quote.code),
    )

    return MarketContext(
        index_name=index_name,
        index_rate=index_rate,
        index_price=index_price,
        sector_name=quote.sector_name,
        sector_rate=sector_rate,
        peers=peers,
        avg_volume_20d=avg_vol,
        supply=supply,
    )


async def self_index(provider: NaverProvider, name: str) -> tuple[Optional[float], Optional[float]]:
    return await provider.index(name)


def _weighted_sector_rate(quotes: list[Quote]) -> Optional[float]:
    """시총 가중 업종 등락률. 시총이 없으면 단순 평균으로 떨어진다."""
    usable = [q for q in quotes if q.change_rate is not None]
    if len(usable) < 2:
        return None
    weighted = [(q, q.market_cap) for q in usable if q.market_cap]
    if len(weighted) == len(usable):
        total = sum(w for _, w in weighted)
        if total:
            return sum(q.change_rate * w for q, w in weighted) / total
    return sum(q.change_rate for q in usable) / len(usable)
