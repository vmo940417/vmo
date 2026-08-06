/* LLM 증거 묶음 구성과 응답 파싱 — llm.py 의 이식본.
 *
 * SYSTEM 프롬프트와 도구 스키마는 tables.js 에 파이썬에서 생성돼 들어온다(문구가
 * 갈라지면 앱과 서버가 다른 답을 내므로). 여기 있는 건 증거를 짜는 코드다.
 *
 * 역할 분담은 파이썬과 같다. 귀인 엔진이 "시장이냐 업종이냐 종목이냐"를 숫자로
 * 이미 확정했고, LLM 은 그 결론을 뒤집는 게 아니라 왜 그렇게 됐는지를 뉴스로
 * 채우기만 한다.
 */
(function (global) {
  'use strict';

  const TIMING_TEXT = {
    PREMARKET: '개장 전에 이미 벌어진 움직임 (갭). 밤사이 해외증시나 전일 장마감 후 공시를 봐야 한다.',
    INTRADAY: '장중에 발생한 움직임. 오늘 장중 시간대 기사를 봐야 한다.',
    MIXED: '개장 전 재료가 장중에도 이어지는 중.',
    FLAT: '의미 있는 이동 없음.',
    UNKNOWN: '시가 정보가 없어 타이밍 판별 불가.',
  };

  const n = (v) => (v == null ? 0 : v).toLocaleString('en-US');
  const f2 = (v) => (v > 0 ? '+' : '') + Number(v).toFixed(2);
  const pctInt = (v) => Math.round(v * 100) + '%';
  // 파이썬의 f"{v:+,.0f}" 과 같은 문자열(반올림 규칙까지 맞춘다)
  const f0 = (v) => (v >= 0 ? '+' : '-') +
    global.Attribution.round0(Math.abs(v)).toLocaleString('en-US');

  /**
   * 수급·공매도 근거. 기준 날짜를 반드시 함께 적는다.
   *
   * LLM 이 어제 수급으로 오늘을 설명하는 것이 여기서 가장 흔한 실패다. 그래서
   * 숫자만 주지 않고 '언제 것인지', '잠정인지 확정인지'를 문장으로 붙여준다.
   */
  function supplyLines(quote, ctx) {
    const supply = ctx.supply;
    if (!supply) return [];
    const A = global.Attribution;
    const L = [];

    const flow = supply.today;
    if (flow) {
      const fresh = A.isFresh(supply);
      const stamp = (flow.date || '날짜 미상') + (flow.provisional ? ' · 장중 잠정치' : ' · 확정');
      L.push('');
      L.push(`[수급] ${stamp}` + (fresh ? '' : ' (오늘 것이 아님 — 오늘 수급은 아직 집계 전)'));
      for (const key of ['foreign', 'institution', 'individual']) {
        if (flow[key] == null) continue;
        const eok = A.toEok(flow[key], flow.unit, quote.price);
        const shown = f0(eok) + '억원' + (flow.unit === '주' ? '(수량x현재가 환산 추정)' : '');
        L.push(`  ${A.INVESTOR_LABEL[key]} ${shown}`);
      }
      const st = A.streak(supply, 'foreign');
      if (st.days >= 2) L.push(`  외국인 ${st.days}일 연속 ${st.total > 0 ? '순매수' : '순매도'}`);
    }

    const short = supply.short;
    if (short) {
      const freshShort = A.shortIsFresh(supply);
      L.push('');
      L.push(`[공매도] ${freshShort ? '당일' : (short.date || '날짜 미상') + ' (직전 거래일)'}`);
      if (short.ratio != null) {
        const baseline = A.shortBaseline(supply);
        L.push(`  거래 대비 비중 ${short.ratio.toFixed(2)}%` +
          (baseline ? ` / 직전 평균 ${baseline.toFixed(1)}%` : ''));
      }
      if (short.balance_ratio != null) L.push(`  잔고 비중 ${short.balance_ratio.toFixed(2)}%`);
      if (!freshShort) {
        L.push('  ※ 한국은 당일 공매도를 장중에 공개하지 않는다. ' +
          '위 수치를 오늘 움직임의 원인으로 단정하지 마라.');
      }
    }
    return L;
  }

  /** LLM 에 넘길 증거 묶음. 숫자는 이미 해석된 형태로 준다. */
  function buildEvidence(quote, ctx, attr, news, maxNews) {
    maxNews = maxNews || 12;
    const L = [];

    L.push(`[종목] ${quote.name} (${quote.code}) / ${quote.market} / 업종: ${quote.sector_name || '미상'}`);
    L.push(`  현재가 ${n(quote.price)}원  전일대비 ${f2(quote.change)} (${f2(quote.change_rate)}%)`);
    if (quote.open != null) {
      L.push(`  시가 ${n(quote.open)} / 고가 ${n(quote.high || 0)} / 저가 ${n(quote.low || 0)}`);
    }
    if (quote.volume) {
      let v = `  거래량 ${n(quote.volume)}주`;
      if (ctx.avg_volume_20d) v += ` (20일 평균의 ${(quote.volume / ctx.avg_volume_20d).toFixed(1)}배)`;
      L.push(v);
    }
    if (quote.week52_high && quote.week52_low) {
      L.push(`  52주 범위 ${n(quote.week52_low)} ~ ${n(quote.week52_high)}`);
    }

    L.push('');
    L.push(ctx.index_rate != null
      ? `[시장] ${ctx.index_name} ${f2(ctx.index_rate)}%`
      : `[시장] ${ctx.index_name} 등락률 확인 불가`);
    if (ctx.advances != null) L.push(`  상승 ${ctx.advances} / 하락 ${ctx.declines}`);
    if (ctx.sector_rate != null) {
      L.push(`[업종] ${ctx.sector_name || '동종'} 평균 ${f2(ctx.sector_rate)}%`);
    }
    if (ctx.peers && ctx.peers.length) {
      L.push('  동종 종목: ' + ctx.peers.map((p) => `${p.name} ${f2(p.change_rate)}%`).join(', '));
    }

    L.push(...supplyLines(quote, ctx));

    const c = attr.components;
    L.push('');
    L.push('[등락률 분해 — 산술적 사실, 합계는 종목 등락률과 일치]');
    L.push(`  시장 성분     ${f2(c.market.value)}%p (비중 ${pctInt(c.market.share)})`);
    L.push(`  업종초과 성분 ${f2(c.sector.value)}%p (비중 ${pctInt(c.sector.share)})`);
    L.push(`  종목고유 성분 ${f2(c.idiosyncratic.value)}%p (비중 ${pctInt(c.idiosyncratic.share)})`);
    L.push(`  => 주도 요인: ${attr.driver_label} (확신도 ${attr.confidence})`);
    L.push(`  => 타이밍: ${TIMING_TEXT[attr.timing] || attr.timing}`);

    if (attr.signals && attr.signals.length) {
      L.push('');
      L.push('[정황 신호]');
      for (const s of attr.signals) L.push(`  - ${s.text}`);
    }

    L.push('');
    if (news && news.length) {
      L.push('[관련도 순 뉴스] (score 는 오늘 움직임과의 관련성 추정치)');
      for (const item of news.slice(0, maxNews)) {
        const cats = item.categories && item.categories.length ? ` [${item.categories.join('/')}]` : '';
        L.push(`  ${item.time} (score ${item.score})${cats} ${item.title}`);
      }
    } else {
      L.push('[관련도 순 뉴스] 수집된 기사 없음');
    }

    return L.join('\n');
  }

  /** SDK / HTTP 어느 경로로 왔든 같은 모양이라 처리도 하나로 끝난다. */
  function parse(raw) {
    const meta = { _model: raw.model || 'unknown', _usage: usageOf(raw) };
    const blocks = raw.content || [];

    for (const b of blocks) {
      if (b.type === 'tool_use' && b.name === 'report_cause') {
        return Object.assign({}, b.input || {}, meta);
      }
    }

    // 도구를 안 쓰고 텍스트로만 답한 경우를 대비한 폴백
    const text = blocks.filter((b) => b.type === 'text').map((b) => b.text || '').join('');
    try {
      return Object.assign({}, JSON.parse(text), meta);
    } catch (e) {
      return Object.assign({
        answer: text.trim().slice(0, 500), reasons: [], catalyst: '',
        confidence: 'low', watch: '',
      }, meta);
    }
  }

  function usageOf(raw) {
    const u = raw.usage || {};
    return {
      input_tokens: u.input_tokens || 0,
      output_tokens: u.output_tokens || 0,
      cache_creation_input_tokens: u.cache_creation_input_tokens || 0,
      cache_read_input_tokens: u.cache_read_input_tokens || 0,
    };
  }

  global.LlmPrompt = {
    get SYSTEM() { return global.Tables.SYSTEM; },
    get RESPONSE_TOOL() { return global.Tables.RESPONSE_TOOL; },
    buildEvidence, parse, TIMING_TEXT,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
