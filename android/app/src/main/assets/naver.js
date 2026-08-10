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
      // samples: 200 은 받았는데 파싱이 빈 경우의 응답 앞부분. 스키마가 예상과
      // 다를 때 화면(스크린샷) 하나로 바로 고칠 수 있게 남긴다.
      this.report = { ok: [], failed: [], samples: {} };
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

    getText(name, url) {
      const r = bridgeGet(url);
      if (!r.ok) {
        this.report.failed.push({ endpoint: name, error: r.error || ('HTTP ' + r.status) });
        return null;
      }
      this.report.ok.push(name);
      return r.body;
    }

    sample(name, raw) {
      this.report.samples[name] = (typeof raw === 'string' ? raw : JSON.stringify(raw)).slice(0, 400);
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

      const market = marketOf(merged);
      if (market === 'UNKNOWN') this.report.samples.market = JSON.stringify(merged).slice(0, 400);

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

    // -- 수급 / 공매도 ---------------------------------------------------

    /**
     * 투자자별 매매동향 + 공매도.
     *
     * 시세와 달리 실시간이 아니다. 장중 수급은 잠정치이고 공매도는 장 마감 후
     * 공시된다. 그래서 '언제 기준인지'를 반드시 같이 담아 돌려준다.
     */
    supplyDemand(code, days) {
      days = days || 10;
      return {
        today: null, history: [], short: null, short_history: [],
        // 공매도는 네이버가 더 이상 개별종목 API 로 주지 않아 원출처(KRX)에서 받는다.
        ...pack(this.investorFlows(code, days), global.Krx.shortSales(this, code, days)),
      };
    }

    investorFlows(code, days) {
      const candidates = [
        ['trend', `https://m.stock.naver.com/api/stock/${code}/trend?pageSize=${days}&page=1`],
        ['investorTrend', `https://m.stock.naver.com/api/stock/${code}/investorTrend?pageSize=${days}&page=1`],
      ];
      for (const [name, url] of candidates) {
        const data = this.getJson(name, url);
        const rows = parseFlowRows(data, days);
        if (rows.length) return rows;
        if (data) this.sample(name, data);
      }
      // JSON 이 안 되면 오래된 HTML 화면을 긁는다. 15년 넘게 같은 주소라
      // JSON 엔드포인트보다 오히려 잘 버틴다.
      const html = this.getText('frgn.naver', `https://finance.naver.com/item/frgn.naver?code=${code}`);
      const rows = parseFrgnHtml(html || '', days);
      if (!rows.length && html) this.sample('frgn.naver', html);
      return rows;
    }

    // -- 뉴스 -----------------------------------------------------------

    news(code, limit) {
      limit = limit || 25;
      const d = this.getJson('news/stock',
        `https://m.stock.naver.com/api/news/stock/${code}?pageSize=${limit}&page=1`);
      return parseNews(d, limit, this);
    }
  }

  // ------------------------------------------------------------------

  // -- 시장 구분 --------------------------------------------------------
  //
  // 어느 지수와 비교할지를 정하는 값이라 틀리면 분해 자체가 틀린다(코스닥 종목을
  // 코스피와 비교하게 된다). 네이버는 이 값을 문자열로도, {code,name,text} 객체로도
  // 주기 때문에 키 하나만 보면 놓친다. 이름에 exchange/market 이 들어간 필드를
  // 전부 훑어 토큰을 찾는다.

  const MARKET_TOKENS = [
    ['KOSDAQ', ['KOSDAQ', '코스닥']],
    ['KONEX', ['KONEX', '코넥스']],
    ['KOSPI', ['KOSPI', '코스피', '유가증권']],
  ];

  function* texts(value, depth) {
    depth = depth || 0;
    if (typeof value === 'string') yield value;
    else if (depth < 3 && Array.isArray(value)) {
      for (const v of value.slice(0, 8)) yield* texts(v, depth + 1);
    } else if (depth < 3 && value && typeof value === 'object') {
      for (const v of Object.values(value)) yield* texts(v, depth + 1);
    }
  }

  function marketOf(payload) {
    if (!payload || typeof payload !== 'object') return 'UNKNOWN';
    for (const [key, value] of Object.entries(payload)) {
      const low = key.toLowerCase();
      if (!low.includes('exchange') && !low.includes('market')) continue;
      for (const text of texts(value)) {
        const up = text.toUpperCase();
        for (const [market, tokens] of MARKET_TOKENS) {
          if (tokens.some((t) => up.includes(t))) return market;
        }
      }
    }
    return 'UNKNOWN';
  }

  // -- 수급 / 공매도 파서 -----------------------------------------------
  //
  // 응답 스키마를 확정할 수 없어서(비공식 엔드포인트) 키 이름 후보를 넓게 잡고,
  // 하나도 못 읽으면 빈 배열을 준다. 빈 결과는 report.samples 에 응답 앞부분이
  // 남으므로 실제 응답을 보고 키를 맞추면 된다.

  const FLOW_QUANT_KEYS = {
    foreign: ['foreignerPureBuyQuant', 'frgnPureBuyQuant', 'foreignPureBuyQuant',
              'foreignerNetBuyQuant', 'foreignerPureBuyVolume'],
    institution: ['organPureBuyQuant', 'institutionPureBuyQuant', 'organNetBuyQuant',
                  'organPureBuyVolume'],
    individual: ['individualPureBuyQuant', 'personPureBuyQuant', 'individualNetBuyQuant',
                 'individualPureBuyVolume'],
  };
  const FLOW_AMOUNT_KEYS = {
    foreign: ['foreignerPureBuyAmount', 'frgnPureBuyAmount', 'foreignPureBuyAmount',
              'foreignerNetBuyAmount'],
    institution: ['organPureBuyAmount', 'institutionPureBuyAmount', 'organNetBuyAmount'],
    individual: ['individualPureBuyAmount', 'personPureBuyAmount', 'individualNetBuyAmount'],
  };

  const DATE_KEYS = ['bizdate', 'localTradedAt', 'localDate', 'tradeDate', 'date', 'dt'];

  const TR_RE = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const TD_RE = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  const DATE_CELL_RE = /^(\d{4})[.\-/](\d{2})[.\-/](\d{2})$/;

  /** 네이버가 주는 온갖 날짜 표기를 YYYY-MM-DD 로 통일한다. */
  function normDate(raw) {
    if (raw == null || raw === '') return '';
    const m = String(raw).trim().match(/^(\d{4})[.\-/]?(\d{2})[.\-/]?(\d{2})/);
    return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
  }

  /** 오늘 날짜의 수급은 장이 끝나기 전까지 잠정치다. */
  function isProvisional(date, now) {
    now = now || new Date();
    const today = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') +
      '-' + String(now.getDate()).padStart(2, '0');
    return !!date && date === today && now.getHours() < 18;
  }

  function rowsOf(data) {
    if (Array.isArray(data)) return data.filter((r) => r && typeof r === 'object' && !Array.isArray(r));
    if (data && typeof data === 'object') {
      for (const key of ['trends', 'items', 'result', 'datas', 'list', 'stockTrends', 'trendList']) {
        let bucket = data[key];
        if (bucket && !Array.isArray(bucket)) bucket = bucket.items || bucket.list;
        if (Array.isArray(bucket)) return bucket.filter((r) => r && typeof r === 'object');
      }
    }
    return [];
  }

  function parseFlowRows(data, limit, now) {
    const out = [];
    for (const row of rowsOf(data).slice(0, limit || 10)) {
      const date = normDate(first(row, ...DATE_KEYS));
      const grab = (table) => {
        const v = {};
        for (const k of Object.keys(table)) v[k] = num(first(row, ...table[k]));
        return v;
      };
      const quant = grab(FLOW_QUANT_KEYS);
      const amount = grab(FLOW_AMOUNT_KEYS);

      let values, unit;
      if (Object.values(quant).some((v) => v != null)) { values = quant; unit = '주'; }
      else if (Object.values(amount).some((v) => v != null)) { values = amount; unit = '원'; }
      else continue;

      out.push({
        date,
        foreign: values.foreign, institution: values.institution, individual: values.individual,
        unit,
        foreign_hold_ratio: num(first(row, 'foreignerHoldRatio', 'frgnHoldRatio',
                                      'foreignHoldRatio', 'foreignerExhaustRate')),
        provisional: isProvisional(date, now),
      });
    }
    return out;
  }

  function cellsOf(rowHtml) {
    const out = [];
    TD_RE.lastIndex = 0;
    let m;
    while ((m = TD_RE.exec(rowHtml)) !== null) {
      out.push(m[1].replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&').trim().split(/\s+/).join(' '));
    }
    return out;
  }

  function htmlRows(html) {
    const out = [];
    TR_RE.lastIndex = 0;
    let m;
    while ((m = TR_RE.exec(html)) !== null) out.push(m[1]);
    return out;
  }

  /**
   * finance.naver.com/item/frgn.naver 의 일별 표.
   * 열 순서: 날짜 | 종가 | 전일비 | 등락률 | 거래량 | 기관 순매매량 |
   *          외국인 순매매량 | 보유주수 | 보유율
   *
   * 이 페이지는 EUC-KR 이라 브리지가 UTF-8 로 읽으면 한글이 깨진다. 여기서 읽는
   * 값은 날짜와 숫자뿐이고 둘 다 ASCII 라 깨져도 그대로 파싱된다.
   */
  function parseFrgnHtml(html, limit, now) {
    const out = [];
    for (const rowHtml of htmlRows(html)) {
      const cells = cellsOf(rowHtml);
      if (cells.length < 7 || !DATE_CELL_RE.test(cells[0])) continue;
      const institution = num(cells[5]), foreign = num(cells[6]);
      // 열 위치가 예상과 다르면 조용히 버린다(틀린 숫자보다 없는 게 낫다).
      if (institution == null && foreign == null) continue;
      const date = normDate(cells[0]);
      out.push({
        date, institution, foreign, individual: null, unit: '주',
        foreign_hold_ratio: cells.length > 8 ? num(cells[8]) : null,
        provisional: isProvisional(date, now),
      });
      if (out.length >= (limit || 10)) break;
    }
    return out;
  }

  const pack = (flows, shorts) => ({
    today: flows[0] || null, history: flows,
    short: shorts[0] || null, short_history: shorts,
  });

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

  function parseNews(data, limit, client) {
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
        // 값은 왔는데 우리 정규식 두 개 중 어느 것도 못 맞히면 날짜가 통째로
        // 빈 채로 화면에 뜬다. report.samples 에 남겨서 다음 진단에서 바로
        // 형태를 보고 정규식을 맞출 수 있게 한다(다른 엔드포인트들과 같은 방식).
        if (rawDt && !published && client && !client.report.samples.news_datetime) {
          client.sample('news_datetime', rawDt);
        }
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

  global.Naver = {
    Client, marketOf, parseFlowRows, parseFrgnHtml, normDate,
    _num: num, _first: first, _extractHit: extractHit, _parseNews: parseNews,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
