/* 앱 오케스트레이션 — pipeline.py 에 대응한다.
 *
 * 수집(naver.js) -> 분해(attribution.js) -> 서술(LLM) 순서로 돌리고 화면에 넘긴다.
 * LLM 은 선택이다. 키가 없어도 분해·타이밍·정황·뉴스는 전부 나온다.
 */
(function (global) {
  'use strict';

  const T = global.Tables;

  // -- 피어 (peers.py) --------------------------------------------------

  function peersFor(code, sectorName) {
    let theme = T.CODE_OVERRIDES[code] || null;

    if (!theme && sectorName) {
      const cleaned = sectorName.replace(/\s/g, '');
      theme = T.SECTOR_ALIASES[sectorName] || T.SECTOR_ALIASES[cleaned] || null;
      if (!theme) {
        for (const [alias, key] of Object.entries(T.SECTOR_ALIASES)) {
          if (alias.includes(sectorName) || sectorName.includes(alias)) { theme = key; break; }
        }
      }
    }
    if (!theme) {
      for (const [key, codes] of Object.entries(T.PEERS)) {
        if (codes.includes(code)) { theme = key; break; }
      }
    }
    if (!theme) return [];
    return (T.PEERS[theme] || []).filter((c) => c !== code).slice(0, 6);
  }

  function themeOf(code, sectorName) {
    if (T.CODE_OVERRIDES[code]) return T.CODE_OVERRIDES[code];
    for (const [key, codes] of Object.entries(T.PEERS)) {
      if (codes.includes(code)) return key;
    }
    if (sectorName) {
      return T.SECTOR_ALIASES[sectorName] || T.SECTOR_ALIASES[sectorName.replace(/\s/g, '')] || null;
    }
    return null;
  }

  /** 시총 가중 업종 등락률. 시총이 없으면 단순 평균으로 떨어진다. */
  function sectorRate(quotes) {
    const usable = quotes.filter((q) => q && q.change_rate != null);
    if (usable.length < 2) return null;
    const weighted = usable.filter((q) => q.market_cap);
    if (weighted.length === usable.length) {
      const total = weighted.reduce((a, q) => a + q.market_cap, 0);
      if (total) return weighted.reduce((a, q) => a + q.change_rate * q.market_cap, 0) / total;
    }
    return usable.reduce((a, q) => a + q.change_rate, 0) / usable.length;
  }

  // -- 비용 (pricing.py) -------------------------------------------------

  function resolvePrice(model) {
    if (T.PRICES[model]) return [model, T.PRICES[model]];
    let best = '';
    for (const key of Object.keys(T.PRICES)) {
      if (model.startsWith(key) && key.length > best.length) best = key;
    }
    return best ? [best, T.PRICES[best]] : [model, null];
  }

  function costOf(usage, model, today) {
    today = today || new Date().toISOString().slice(0, 10);
    const [key, price] = resolvePrice(model || 'unknown');

    const tin = usage.input_tokens || 0;
    const tout = usage.output_tokens || 0;
    const twrite = usage.cache_creation_input_tokens || 0;
    const tread = usage.cache_read_input_tokens || 0;

    const base = {
      model, priced_as: price ? key : null,
      input_tokens: tin, output_tokens: tout,
      cache_write_tokens: twrite, cache_read_tokens: tread,
      total_tokens: tin + tout + twrite + tread,
    };
    if (!price) {
      // 모르는 값을 0원으로 표시하면 공짜인 줄 안다.
      return { ...base, usd: null, krw: null, intro_pricing: false,
               note: `'${model}' 요금 정보 없음 — 비용을 계산하지 못했습니다.` };
    }

    const intro = !!(price.intro_until && today <= price.intro_until &&
                     price.intro_input != null && price.intro_output != null);
    const rIn = intro ? price.intro_input : price.input;
    const rOut = intro ? price.intro_output : price.output;

    const usd = (tin * rIn + tout * rOut +
                 twrite * rIn * T.CACHE_WRITE_MULTIPLIER +
                 tread * rIn * T.CACHE_READ_MULTIPLIER) / 1e6;

    return {
      ...base,
      usd: Math.round(usd * 1e6) / 1e6,
      krw: Math.round(usd * usdKrw() * 10) / 10,
      rate_input: rIn, rate_output: rOut,
      intro_pricing: intro,
      intro_until: intro ? price.intro_until : undefined,
    };
  }

  function usdKrw() {
    const raw = Settings.get('usd_krw');
    const v = Number(raw);
    return Number.isFinite(v) && v > 0 ? v : T.DEFAULT_USD_KRW;
  }

  // -- 설정 (SharedPreferences) -----------------------------------------

  const Settings = {
    get(key) {
      try {
        if (typeof Native !== 'undefined') return Native.getPref(key) || '';
        return localStorage.getItem('stockwhy_' + key) || '';
      } catch (e) { return ''; }
    },
    set(key, value) {
      try {
        if (typeof Native !== 'undefined') Native.setPref(key, value);
        else localStorage.setItem('stockwhy_' + key, value);
      } catch (e) { /* 저장 실패가 분석을 막지 않는다 */ }
    },
  };

  // -- 사용량 누적 -------------------------------------------------------

  const Usage = {
    KEY: 'usage_log',
    record(cost) {
      if (!cost || cost.usd == null) return;   // 비용을 모르는 호출은 누적하지 않는다
      try {
        const log = this.all();
        log.push({ ts: new Date().toISOString(), usd: cost.usd, krw: cost.krw,
                   input_tokens: cost.input_tokens, output_tokens: cost.output_tokens });
        // 폰 저장소를 무한정 먹지 않도록 최근 2000건만 남긴다.
        Settings.set(this.KEY, JSON.stringify(log.slice(-2000)));
      } catch (e) { /* 가계부 때문에 분석이 죽으면 안 된다 */ }
    },
    all() {
      try { return JSON.parse(Settings.get(this.KEY) || '[]'); } catch (e) { return []; }
    },
    summary() {
      const log = this.all();
      const today = new Date().toISOString().slice(0, 10);
      const sum = (rows) => rows.reduce((a, r) => ({
        calls: a.calls + 1, usd: a.usd + (r.usd || 0), krw: a.krw + (r.krw || 0),
      }), { calls: 0, usd: 0, krw: 0 });

      const days = new Set(log.map((r) => String(r.ts).slice(0, 10)));
      const total = sum(log);
      return {
        today: sum(log.filter((r) => String(r.ts).slice(0, 10) === today)),
        total,
        activeDays: days.size,
        projectedMonthlyKrw: days.size ? Math.round(total.krw / days.size * 22) : 0,
      };
    },
  };

  // -- LLM ---------------------------------------------------------------

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const DEFAULT_MODEL = 'claude-sonnet-5';

  function explain(quote, ctx, attribution, news) {
    const key = Settings.get('api_key').trim();
    if (!key) return null;

    const model = Settings.get('model').trim() || DEFAULT_MODEL;
    const payload = {
      model, max_tokens: 1500,
      system: global.LlmPrompt.SYSTEM,
      tools: [global.LlmPrompt.RESPONSE_TOOL],
      tool_choice: { type: 'tool', name: 'report_cause' },
      messages: [{ role: 'user', content:
        `아래는 ${quote.name}의 현재 장중 데이터다. 왜 이렇게 움직이는지 판단해서 ` +
        `report_cause 도구로 보고하라.\n\n` +
        global.LlmPrompt.buildEvidence(quote, ctx, attribution, news) }],
    };

    let raw;
    try {
      raw = JSON.parse(Native.httpPost(API_URL, JSON.stringify({
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      }), JSON.stringify(payload)));
    } catch (e) {
      return { error: 'bridge: ' + e.message };
    }
    if (!raw.ok) {
      let detail = raw.error || ('HTTP ' + raw.status);
      try {
        const body = JSON.parse(raw.body);
        if (body.error && body.error.message) detail = body.error.message;
      } catch (e) { /* 본문이 JSON 이 아니면 그대로 둔다 */ }
      return { error: detail };
    }

    let data;
    try { data = JSON.parse(raw.body); } catch (e) { return { error: '응답 파싱 실패' }; }
    return global.LlmPrompt.parse(data);
  }

  // -- 파이프라인 ---------------------------------------------------------

  /**
   * 네이티브 브리지는 동기 호출이라 부르는 동안 JS 스레드가 멈춘다. WebView 는
   * 렌더링도 같은 스레드에서 하므로, 통신 사이사이에 이벤트 루프로 양보하지 않으면
   * 수집이 끝날 때까지 화면이 통째로 얼어붙는다. 그래서 단계마다 tick() 을 넣고
   * onProgress 로 진행 상황을 흘려보낸다.
   */
  const tick = () => new Promise((r) => setTimeout(r, 0));

  async function diagnose(query, opts) {
    opts = opts || {};
    const say = opts.onProgress || (() => {});
    const started = Date.now();
    const client = new global.Naver.Client();

    say('종목 확인 중…');
    await tick();
    const resolved = client.resolve(query);
    if (!resolved) throw new Error(`'${query}' 에 해당하는 종목을 찾지 못했습니다.`);

    say(`${resolved.name} 시세 조회 중…`);
    await tick();
    const quote = client.quote(resolved.code);
    if (!quote) throw new Error(`'${resolved.name}(${resolved.code})' 의 시세를 가져오지 못했습니다.`);
    if (!quote.name || quote.name === resolved.code) quote.name = resolved.name;

    const indexName = quote.market === 'KOSDAQ' ? 'KOSDAQ' : 'KOSPI';
    say(`${indexName} 지수 조회 중…`);
    await tick();
    const idx = client.index(indexName);

    const peerCodes = peersFor(resolved.code, quote.sector_name);
    const peers = [];
    for (let i = 0; i < peerCodes.length; i++) {
      say(`동종 종목 ${i + 1}/${peerCodes.length}…`);
      await tick();
      const p = client.quote(peerCodes[i]);
      if (p) peers.push(p);
    }

    say('거래량 추이 조회 중…');
    await tick();
    const avgVolume = client.avgVolume(resolved.code);

    say('수급·공매도 조회 중…');
    await tick();
    const supply = client.supplyDemand(resolved.code);

    const ctx = {
      index_name: indexName,
      index_rate: idx.rate,
      index_price: idx.price,
      sector_name: quote.sector_name || themeOf(resolved.code, quote.sector_name),
      sector_rate: sectorRate([quote, ...peers]),
      peers,
      avg_volume_20d: avgVolume,
      beta: 1.0,
      supply,
    };

    const attribution = global.Attribution.analyze(quote, ctx);

    say('뉴스 수집 중…');
    await tick();
    const newsItems = client.news(resolved.code);
    const news = global.Attribution.scoreNews(newsItems, quote, attribution);

    let explanation = null, cost = null;
    if (opts.useLlm !== false && Settings.get('api_key').trim()) {
      say('원인 판단 중… (최대 30초)');
      await tick();
      explanation = explain(quote, ctx, attribution, news);
      if (explanation && explanation._usage) {
        cost = costOf(explanation._usage, explanation._model || 'unknown');
        Usage.record(cost);
      }
    }

    return {
      query, quote, context: ctx, attribution,
      news: news.slice(0, 15),
      explanation, cost,
      elapsed_ms: Date.now() - started,
      as_of: new Date(),
      diagnostics: client.report,
    };
  }

  global.App = { diagnose, Settings, Usage, costOf, peersFor, themeOf, sectorRate };
})(typeof globalThis !== 'undefined' ? globalThis : this);
