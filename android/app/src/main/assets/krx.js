/* KRX 공매도 수집 — krx.py 의 이식본.
 *
 * 네이버는 개별종목 공매도를 더 이상 API 로 주지 않는다(윈도우 빌드 진단에서
 * 확인: shortSellingTrend/shortStockTrend 404, short_trade.naver 는 종목 메인
 * 페이지). 그래서 원출처인 KRX 에서 직접 받는다.
 *
 * 두 가지만 기억하면 된다.
 *   1. KRX 는 6자리 코드가 아니라 ISIN(KR7005930003)을 받는다 — 먼저 물어본다.
 *   2. 공매도는 장 마감 후 집계라 '오늘 공매도'는 존재하지 않는다. 최신 행의
 *      날짜를 반드시 같이 들고 다닌다.
 *
 * 통신은 네이티브 브리지의 POST 를 쓴다(폼 인코딩).
 */
(function (global) {
  'use strict';

  const URL_ = 'https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd';

  // Referer 가 없으면 KRX 가 빈 응답을 준다.
  const HEADERS = {
    'Referer': 'https://data.krx.co.kr/contents/MDC/MDI/mdiLoader/index.cmd?menuId=MDC0201020403',
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
    'X-Requested-With': 'XMLHttpRequest',
  };

  const TRADE_BLDS = [
    'dbms/MDC/STAT/srt/MDCSTAT30101',   // 개별종목 공매도 거래 (기간 조회)
    'dbms/MDC/STAT/srt/MDCSTAT30001',   // 종목별 공매도 거래
  ];
  const BALANCE_BLDS = [
    'dbms/MDC/STAT/srt/MDCSTAT30501',
    'dbms/MDC/STAT/srt/MDCSTAT30401',
  ];
  const ISIN_BLD = 'dbms/comm/finder/finder_srtisu';

  const DATE_KEYS = ['TRD_DD', 'BAS_DD', 'TRD_DT', 'STD_DD'];
  const VOLUME_KEYS = ['CVSRTSELL_TRDVOL', 'SRTSELL_TRDVOL', 'CVSRTSELL_TRDVOL_QTY'];
  const VALUE_KEYS = ['CVSRTSELL_TRDVAL', 'SRTSELL_TRDVAL'];
  // 비중은 거래대금 기준을 먼저 본다 — 금액 비중이 시장 충격을 더 잘 나타낸다.
  const RATIO_KEYS = ['TRDVAL_WT', 'TRDVOL_WT', 'CVSRTSELL_TRDVAL_WT', 'CVSRTSELL_TRDVOL_WT'];
  const BAL_QTY_KEYS = ['BAL_QTY', 'BAL_QTY_TOT', 'SRTSELL_BAL_QTY'];
  const BAL_RATIO_KEYS = ['BAL_RTO', 'BAL_RTO_TOT', 'SRTSELL_BAL_RTO'];

  /** KRX 는 숫자를 '1,500,000' 으로 준다. '-' 는 결측이다. */
  function num(value) {
    if (value == null || value === '' || value === '-' || value === 'N/A') return null;
    if (typeof value === 'number') return value;
    const v = Number(String(value).replace(/,/g, '').replace(/%/g, '').trim());
    return Number.isFinite(v) ? v : null;
  }

  function first(row, keys) {
    if (!row || typeof row !== 'object') return null;
    for (const k of keys) {
      const v = row[k];
      if (v != null && v !== '' && v !== '-') return v;
    }
    return null;
  }

  /** '2026/08/06' -> '2026-08-06' */
  function normDate(raw) {
    if (raw == null || raw === '') return '';
    const d = String(raw).replace(/\D/g, '');
    return d.length >= 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : '';
  }

  function rowsOf(data) {
    if (!data || typeof data !== 'object') return [];
    for (const key of ['OutBlock_1', 'output', 'block1', 'OutBlock_2']) {
      const bucket = data[key];
      if (Array.isArray(bucket)) return bucket.filter((r) => r && typeof r === 'object');
    }
    return [];
  }

  const ymd = (d) => d.getFullYear() +
    String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

  function form(params) {
    return Object.keys(params)
      .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(params[k])).join('&');
  }

  function post(client, name, params) {
    if (typeof Native === 'undefined') {
      client.report.failed.push({ endpoint: name, error: 'Native 브리지 없음' });
      return null;
    }
    let raw;
    try {
      raw = JSON.parse(Native.httpPost(URL_, JSON.stringify(HEADERS), form(params)));
    } catch (e) {
      client.report.failed.push({ endpoint: name, error: 'bridge: ' + e.message });
      return null;
    }
    if (!raw.ok) {
      client.report.failed.push({ endpoint: name, error: raw.error || ('HTTP ' + raw.status) });
      return null;
    }
    try {
      const data = JSON.parse(raw.body);
      client.report.ok.push(name);
      return data;
    } catch (e) {
      client.report.failed.push({ endpoint: name, error: 'JSON 파싱 실패' });
      return null;
    }
  }

  /** 6자리 코드 -> ISIN. 이게 없으면 조회를 시작할 수 없다. */
  function isin(client, code) {
    const data = post(client, 'krx/isin',
      { bld: ISIN_BLD, mktsel: 'ALL', typeNo: '0', searchText: code });
    for (const row of rowsOf(data)) {
      const full = first(row, ['full_code', 'isuCd', 'ISU_CD']);
      const short = String(first(row, ['short_code', 'isuSrtCd', 'ISU_SRT_CD']) || '');
      if (full && (!short || short === code)) return String(full);
    }
    if (data) client.sample('krx/isin', data);
    return null;
  }

  function parseTrades(data, limit) {
    const out = [];
    for (const row of rowsOf(data)) {
      const date = normDate(first(row, DATE_KEYS));
      const volume = num(first(row, VOLUME_KEYS));
      const value = num(first(row, VALUE_KEYS));
      const ratio = num(first(row, RATIO_KEYS));
      if (!date || (volume == null && value == null && ratio == null)) continue;
      out.push({ date, volume, value, ratio, balance_qty: null, balance_ratio: null });
    }
    // KRX 는 과거->현재 순으로 주기도 한다. 최신이 앞이어야 한다.
    out.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    return out.slice(0, limit || 10);
  }

  /** 잔고 응답을 날짜로 맞춰 끼워 넣는다. 없으면 그대로 둔다. */
  function mergeBalance(sales, data) {
    const byDate = {};
    for (const row of rowsOf(data)) {
      const date = normDate(first(row, DATE_KEYS));
      if (date) byDate[date] = row;
    }
    for (const sale of sales) {
      const row = byDate[sale.date];
      if (row) {
        sale.balance_qty = num(first(row, BAL_QTY_KEYS));
        sale.balance_ratio = num(first(row, BAL_RATIO_KEYS));
      }
    }
    return sales;
  }

  /** 개별종목 일별 공매도(거래 + 잔고). 실패하면 빈 배열. */
  function shortSales(client, code, days, today) {
    days = days || 10;
    today = today || new Date();
    // 공매도는 마감 후 집계라 오늘 것은 없다. 휴장을 감안해 넉넉히 잡는다.
    const start = new Date(today.getTime() - (days * 2 + 10) * 86400000);

    const isu = isin(client, code);
    if (!isu) return [];

    const base = {
      isuCd: isu, isuCd2: isu, strtDd: ymd(start), endDd: ymd(today),
      searchType: '2', mktTpCd: '1', inqCondTpCd: '1',
      trdVolVal: '1', askBid: '1', share: '1', money: '1', csvxls_isNo: 'false',
    };

    let sales = [];
    for (const bld of TRADE_BLDS) {
      const name = 'krx/' + bld.split('/').pop();
      const data = post(client, name, Object.assign({ bld }, base));
      sales = parseTrades(data, days);
      if (sales.length) break;
      if (data) client.sample(name, data);
    }
    if (!sales.length) return [];

    for (const bld of BALANCE_BLDS) {
      const name = 'krx/' + bld.split('/').pop();
      const data = post(client, name, Object.assign({ bld }, base));
      if (rowsOf(data).length) {
        mergeBalance(sales, data);
        break;
      }
    }
    return sales;
  }

  global.Krx = { shortSales, isin, parseTrades, mergeBalance, normDate, _num: num };
})(typeof globalThis !== 'undefined' ? globalThis : this);
