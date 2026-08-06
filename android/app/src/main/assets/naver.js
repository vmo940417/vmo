/* 네이버 금융 수집 — naver.py 의 이식본.
 *
 * 통신은 네이티브 브리지가 대신한다(브라우저 fetch 는 CORS 에 막힘).
 *
 * 파이썬 원본과 같은 원칙을 지킨다.
 *   1. 엔드포인트마다 후보를 여러 개 두고 순서대로 시도
 *   2. 어떤 필드가 없어도 예외 대신 null 로 흘려보낸다
 *   3. 무엇이 성공/실패했는지 report 에 남긴다
 *
 * /integration 은 평면 필드가 아니라 totalInfos:[{code,key,value}] 로 값을 주는
 * 경우가 있다(실기기에서 확인). 그래서 평면 필드 -> totalInfos 순으로 훑는다.
 */
(function (global) {
  'use strict';

  const UA_HEADERS = { 'Accept': 'application/json, text/plain, */*', 'Referer': 'https://m.stock.naver.com/' };
  const CODE_RE = /^\d{6}$/;

  function bridgeGet(url, headers) {
    if (typeof Native === 'undefined') {
      return { ok: false, status: 0, error: 'Native 브리지 없음' };
    }
    try {
      return JSON.parse(Native.httpGet(url, JSON.stringify(headers || UA_HEADERS)));
    } catch (e) {
      return { ok: false, status: 0, error: 'bridge: ' + e.message };
    }
  }

  class Client {
    constructor() {
      this.report = { ok: [], failed: [] };
    }

    getJson(name, url) {
      const r = bridgeGet(url);
      if (!r.ok) {
        this.report.failed.push({ endpoint: name, error: r.error || ('HTTP ' + r.status) });
        return null;
      }
      try {
        const data = JSON.parse(r.body);
        this.report.ok.push(name);
        return data;
      } catch (e) {
        this.report.failed.push({ endpoint: name, error: 'JSON 파싱 실패' });
        return null;
      }
    }

    // -- 종목 코드 해석 -------------------------------------------------

    resolve(query) {
      query = (query || '').trim();
      if (CODE_RE.test(query)) return { code: query, name: this.nameOf(query) || query };

      // ac.stock 이 실동작 확인된 경로. search/all 은 404 라 폴백으로만 남긴다.
      const candidates = [
        ['ac.stock', `https://ac.stock.naver.com/ac?q=${encodeURIComponent(query)}&target=stock&st=111`],
        ['search/all', `https://m.stock.naver.com/api/search/all?query=${encodeURIComponent(query)}`],
      ];
      for (const [name, url] of candidates) {
        const hit = extractHit(this.getJson(name, url));
        if (hit) return hit;
      }
      return null;
    }

    nameOf(code) {
      const d = this.getJson('integration/name', `https://m.stock.naver.com/api/stock/${code}/integration`);
      return d ? (first(d, 'stockName', 'name', 'korName') || null) : null;
    }

    // -- 시세 -----------------------------------------------------------

    quote(code) {
      const integration = this.getJson('integration', `https://m.stock.naver.com/api/stock/${code}/integration`);
      const basic = this.getJson('basic', `https://m.stock.naver.com/api/stock/${code}/basic`);

      const merged = {};
      for (const src of [integration, basic]) {
        if (src && typeof src === 'object') {
          for (const k of Object.keys(src)) {
            if (src[k] !== null && src[k] !== '') merged[k] = src[k];
          }
        }
      }
      if (!Object.keys(merged).length) return null;

      // totalInfos: [{code:"lastClosePrice", key:"전일", value:"246,000"}, ...]
      const infos = {};
      const rawInfos = (integration && integration.totalInfos) || merged.totalInfos;
      if (Array.isArray(rawInfos)) {
        for (const it of rawInfos) {
          if (it && it.code) infos[it.code] = it.value;
        }
      }
      const pick = (...keys) => {
        const flat = first(merged, ...keys);
        if (flat !== null && flat !== undefined) return flat;
        for (const k of keys) if (infos[k] !== undefined) return infos[k];
        return null;
      };

      const price = num(pick('closePrice', 'nv', 'now'));
      if (price === null) return null;

      let rate = num(pick('fluctuationsRatio', 'cr', 'rate'));
      let change = num(pick('compareToPreviousClosePrice', 'cv', 'change'));

      // 네이버는 하락일 때도 변동폭을 양수로 주는 경우가 있다.
      if (change !== null && rate !== null && rate < 0 && change > 0) change = -change;

      const prevClose = num(pick('previousClose', 'pcv', 'lastClosePrice'));
      if (change === null && prevClose !== null) change = price - prevClose;
      if (rate === null && change !== null) {
        const base = prevClose !== null ? prevClose : price - change;
        rate = base ? (change / base) * 100 : null;
      }
      if (change === null && rate !== null) change = (price * rate) / (100 + rate);

      let sectorName = null;
      const industry = merged.industryCodeType;
      if (industry && typeof industry === 'object') {
        sectorName = first(industry, 'industryGroupKor', 'industryName', 'name', 'text');
      } else if (typeof industry === 'string') {
        sectorName = industry;
      }
      sectorName = sectorName || first(merged, 'industryName', 'upjongName', 'industryGroupKor');

      let marketRaw = String(first(merged, 'stockExchangeType', 'marketType', 'market') || '');
      if (merged.stockExchangeType && typeof merged.stockExchangeType === 'object') {
        marketRaw = String(merged.stockExchangeType.code || merged.stockExchangeType.name || '');
      }
      const up = marketRaw.toUpperCase();
      const market = up.includes('KOSDAQ') ? 'KOSDAQ' : up.includes('KOSPI') ? 'KOSPI' : 'UNKNOWN';

      return {
        code,
        name: String(first(merged, 'stockName', 'name', 'korName') || code),
        price,
        change: change === null ? 0 : change,
        change_rate: rate === null ? 0 : rate,
        market,
        sector_name: sectorName || null,
        open: num(pick('openPrice', 'ov')),
        high: num(pick('highPrice', 'hv')),
        low: num(pick('lowPrice', 'lv')),
        prev_close: prevClose,
        volume: int(pick('accumulatedTradingVolume', 'aq', 'volume')),
        trading_value: int(pick('accumulatedTradingValue', 'aa')),
        market_cap: int(pick('marketValue')),
        week52_high: num(pick('highPriceOf52Weeks', 'high52')),
        week52_low: num(pick('lowPriceOf52Weeks', 'low52')),
      };
    }

    // -- 지수 -----------------------------------------------------------

    index(name) {
      name = name || 'KOSPI';
      const d = this.getJson(`index/${name}`, `https://m.stock.naver.com/api/index/${name}/basic`);
      if (!d) return { price: null, rate: null };
      return {
        price: num(first(d, 'closePrice', 'nv')),
        rate: num(first(d, 'fluctuationsRatio', 'cr')),
      };
    }

    // -- 일봉 (20일 평균 거래량) -----------------------------------------

    avgVolume(code, days) {
      days = days || 20;
      const end = ymd(new Date());
      const start = ymd(new Date(Date.now() - (days * 2 + 20) * 86400000));
      const url = 'https://api.finance.naver.com/siseJson.naver?symbol=' + code +
        '&requestType=1&startTime=' + start + '&endTime=' + end + '&timeframe=day';

      const r = bridgeGet(url);
      if (!r.ok) {
        this.report.failed.push({ endpoint: 'siseJson', error: r.error || ('HTTP ' + r.status) });
        return null;
      }
      let rows;
      try {
        // siseJson 은 JSON 이 아니라 작은따옴표 리터럴을 준다.
        rows = JSON.parse(r.body.replace(/'/g, '"'));
        this.report.ok.push('siseJson');
      } catch (e) {
        this.report.failed.push({ endpoint: 'siseJson', error: '파싱 실패' });
        return null;
      }

      const vols = [];
      for (let i = 1; i < rows.length; i++) {      // 0번은 헤더
        const v = num(rows[i] && rows[i][5]);
        if (v) vols.push(v);
      }
      if (!vols.length) return null;
      // 마지막 행은 당일(진행 중)이라 평균에서 뺀다.
      const window = vols.length > 1 ? vols.slice(-(days + 1), -1) : vols;
      const use = window.length ? window : vols.slice(-days);
      return use.reduce((a, b) => a + b, 0) / use.length;
    }

    // -- 뉴스 -----------------------------------------------------------

    news(code, limit) {
      limit = limit || 25;
      const d = this.getJson('news/stock',
        `https://m.stock.naver.com/api/news/stock/${code}?pageSize=${limit}&page=1`);
      return parseNews(d, limit);
    }
  }

  // ------------------------------------------------------------------

  function extractHit(data) {
    if (!data) return null;

    // search/all 형태
    for (const key of ['stocks', 'domesticStocks', 'items', 'result']) {
      let bucket = data[key];
      if (bucket && !Array.isArray(bucket)) bucket = bucket.items || bucket.stocks;
      if (Array.isArray(bucket) && bucket.length && !Array.isArray(bucket[0])) {
        const f = bucket[0];
        if (f && typeof f === 'object') {
          const code = first(f, 'itemCode', 'code', 'cd', 'reutersCode');
          const name = first(f, 'stockName', 'name', 'nm', 'korName');
          if (code && CODE_RE.test(String(code))) {
            return { code: String(code), name: String(name || code) };
          }
        }
      }
    }

    // ac.stock 형태: {"items":[[ [["005930"],["삼성전자"],...] ]]}
    if (Array.isArray(data.items) && data.items.length && Array.isArray(data.items[0])) {
      for (const row of data.items[0]) {
        if (!Array.isArray(row)) continue;
        const flat = row.map((c) => (Array.isArray(c) && c.length ? String(c[0]) : String(c)));
        const codes = flat.filter((c) => CODE_RE.test(c));
        if (codes.length) {
          const name = flat.find((c) => c && !CODE_RE.test(c)) || codes[0];
          return { code: codes[0], name };
        }
      }
    }
    return null;
  }

  function parseNews(data, limit) {
    const out = [];
    if (!Array.isArray(data)) return out;
    for (const group of data) {
      // 응답은 [{items:[...]}] 이거나 기사 객체가 바로 오기도 한다.
      const entries = (group && typeof group === 'object' && group.items) ? group.items : [group];
      for (const it of entries || []) {
        if (!it || typeof it !== 'object') continue;
        let title = first(it, 'title', 'articleTitle');
        if (!title) continue;
        title = String(title).replace(/<[^>]+>/g, '')
          .replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&apos;/g, "'");

        const rawDt = first(it, 'datetime', 'officeDateTime', 'dt');
        const published = parseDt(rawDt);
        const oid = first(it, 'officeId', 'oid');
        const aid = first(it, 'articleId', 'aid');
        out.push({
          title,
          published_at: published,
          url: (oid && aid) ? `https://n.news.naver.com/mnews/article/${oid}/${aid}`
                            : (first(it, 'linkUrl', 'url') || null),
          press: first(it, 'officeName', 'press') || null,
        });
        if (out.length >= limit) return out;
      }
    }
    return out;
  }

  function parseDt(raw) {
    if (!raw) return null;
    const s = String(raw);
    let m = s.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);   // 20260806144322
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]);
    m = s.match(/^(\d{4})[-.](\d{2})[-.](\d{2})[ T](\d{2}):(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
    return null;
  }

  function first(obj, ...keys) {
    if (!obj || typeof obj !== 'object') return null;
    for (const k of keys) {
      const v = obj[k];
      if (v !== null && v !== undefined && v !== '') return v;
    }
    return null;
  }

  /** 네이버는 숫자를 '228,500' 같은 문자열로도 준다. */
  function num(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') return value;
    const cleaned = String(value).replace(/,/g, '').replace(/%/g, '').trim();
    const v = Number(cleaned);
    return Number.isFinite(v) ? v : null;
  }

  const int = (v) => { const n = num(v); return n === null ? null : Math.trunc(n); };

  const ymd = (d) => d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

  global.Naver = { Client, _num: num, _first: first, _extractHit: extractHit, _parseNews: parseNews };
})(typeof globalThis !== 'undefined' ? globalThis : this);
