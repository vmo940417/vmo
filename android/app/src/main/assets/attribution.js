/* 등락률 귀인 분해 — attribution.py 의 이식본.
 *
 * 파이썬 쪽이 테스트로 검증된 원본이고 여기는 그대로 옮긴 것이다. 상수와 산식을
 * 손대면 두 구현이 갈라지므로, 고칠 일이 생기면 양쪽을 같이 고쳐야 한다.
 * tests/test_parity.mjs 가 같은 픽스처로 두 결과가 일치하는지 확인한다.
 *
 * 핵심: "왜 움직였나"에 답하기 전에 "누구 탓인가"를 숫자로 확정한다.
 *
 *   종목등락 = 시장성분 + 업종초과성분 + 종목고유성분
 */
(function (global) {
  'use strict';

  const DRIVER_LABEL = {
    MARKET: '시장 전체',
    SECTOR: '업종',
    IDIOSYNCRATIC: '종목 고유',
  };

  // 장중 이동의 '언제'를 가르는 임계값. 종목마다 변동성이 달라 절대값으로는 못 자르고
  // 당일 총 이동폭 대비 비율로 판단한다.
  const GAP_DOMINANT_SHARE = 0.6;
  const INTRADAY_DOMINANT_SHARE = 0.6;
  const VOLUME_SURGE_RATIO = 2.5;
  const NOISE_RATE = 0.7;

  // 2순위 성분이 이 조건을 넘으면 헤드라인에 같이 적는다.
  const SECONDARY_MIN_SHARE = 0.25;
  const SECONDARY_MIN_VALUE = 1.0;

  const pct = (num, den) => (den ? (num / den) * 100 : 0);
  const fmt = (v, d = 2) => (v > 0 ? '+' : '') + v.toFixed(d);
  const won = (v) => Math.round(v).toLocaleString('ko-KR');

  function prevClose(q) {
    if (q.prev_close != null) return q.prev_close;
    if (q.price != null && q.change != null) return q.price - q.change;
    return null;
  }

  function breadth(ctx) {
    if (ctx.advances == null || ctx.declines == null) return null;
    const total = ctx.advances + ctx.declines;
    return total ? ctx.advances / total : null;
  }

  /** 등락률을 시장/업종초과/종목고유 세 성분으로 분해한다. 합은 항상 종목 등락률. */
  function decompose(quote, ctx) {
    const stockRate = quote.change_rate;
    const indexRate = ctx.index_rate != null ? ctx.index_rate : 0;
    const beta = ctx.beta || 1.0;

    const marketV = beta * indexRate;
    let sectorV, idioV;
    if (ctx.sector_rate != null) {
      sectorV = ctx.sector_rate - marketV;
      idioV = stockRate - ctx.sector_rate;
    } else {
      sectorV = 0;
      idioV = stockRate - marketV;
    }

    const total = Math.abs(marketV) + Math.abs(sectorV) + Math.abs(idioV);
    const share = (v) => (total ? Math.abs(v) / total : 0);

    return {
      market: { name: '시장', value: marketV, share: share(marketV) },
      sector: { name: '업종초과', value: sectorV, share: share(sectorV) },
      idiosyncratic: { name: '종목고유', value: idioV, share: share(idioV) },
    };
  }

  /**
   * 움직임이 개장 전에 났는지 장중에 났는지 가른다.
   * 이 구분이 뉴스를 어느 시간대에서 찾아야 하는지를 결정한다.
   */
  function classifyTiming(quote) {
    const prev = prevClose(quote);
    if (prev == null || !prev || quote.open == null) {
      return { timing: 'UNKNOWN', gap: null, intraday: null };
    }
    const gap = pct(quote.open - prev, prev);
    const intraday = pct(quote.price - quote.open, prev);
    const total = Math.abs(gap) + Math.abs(intraday);
    if (total === 0) return { timing: 'FLAT', gap, intraday };
    if (Math.abs(gap) / total >= GAP_DOMINANT_SHARE) return { timing: 'PREMARKET', gap, intraday };
    if (Math.abs(intraday) / total >= INTRADAY_DOMINANT_SHARE) return { timing: 'INTRADAY', gap, intraday };
    return { timing: 'MIXED', gap, intraday };
  }

  function collectSignals(quote, ctx, timing, gap, intraday) {
    const out = [];
    const add = (key, text, weight = 1.0) => out.push({ key, text, weight });
    const prev = prevClose(quote);

    if (timing === 'PREMARKET' && gap != null) {
      add('gap', `시가부터 ${fmt(gap)}% 갭으로 출발 — 개장 전(해외증시·전일 장마감 후 공시)에 재료가 나왔을 가능성이 큽니다.`, 1.5);
    } else if (timing === 'INTRADAY' && intraday != null) {
      add('intraday_move', `시가 대비 ${fmt(intraday)}% 이동 — 장중에 재료가 발생했습니다. 같은 시간대 뉴스를 봐야 합니다.`, 1.5);
    } else if (timing === 'MIXED' && gap != null && intraday != null) {
      add('mixed_move', `갭 ${fmt(gap)}% + 장중 ${fmt(intraday)}% — 개장 전 재료가 장중에도 이어지고 있습니다.`);
    }

    if (quote.high != null && quote.low != null && prev && quote.high > quote.low) {
      const rng = pct(quote.high - quote.low, prev);
      const pos = (quote.price - quote.low) / (quote.high - quote.low);
      if (rng >= 3.0) {
        add('range', `당일 변동폭 ${rng.toFixed(1)}%p로 매우 넓습니다(고가 ${won(quote.high)} / 저가 ${won(quote.low)}).`);
      }
      if (quote.change_rate < 0 && pos <= 0.2) {
        add('at_low', '저가 부근에서 거래 중 — 매도 압력이 아직 해소되지 않았습니다.');
      } else if (quote.change_rate < 0 && pos >= 0.7) {
        add('rebound', '저가 대비 상당폭 회복 — 낙폭 과대 인식의 저가 매수가 들어왔습니다.');
      } else if (quote.change_rate > 0 && pos <= 0.3) {
        add('fade', '고가 대비 밀린 상태 — 상승분을 차익실현에 반납하는 중입니다.');
      }
    }

    if (quote.volume && ctx.avg_volume_20d) {
      const ratio = quote.volume / ctx.avg_volume_20d;
      if (ratio >= VOLUME_SURGE_RATIO) {
        add('volume_surge', `거래량이 20일 평균의 ${ratio.toFixed(1)}배 — 단순 수급이 아니라 명확한 재료에 반응하는 거래량입니다.`, 1.3);
      } else if (ratio <= 0.6) {
        add('volume_dry', `거래량이 20일 평균의 ${ratio.toFixed(1)}배에 그칩니다 — 거래 없이 밀린 것이라 재료보다 수급 공백일 수 있습니다.`);
      }
    }

    const b = breadth(ctx);
    if (b != null) {
      if (b <= 0.35) {
        add('breadth', `시장 전체가 하락 우위입니다(상승 ${ctx.advances} / 하락 ${ctx.declines}). 개별 이슈로 보기 어렵습니다.`, 1.2);
      } else if (b >= 0.65) {
        add('breadth', `시장은 상승 우위입니다(상승 ${ctx.advances} / 하락 ${ctx.declines}).`);
      }
    }

    if (ctx.sector_rate != null) {
      const rel = quote.change_rate - ctx.sector_rate;
      if (Math.abs(rel) >= 2.0) {
        const sec = ctx.sector_name || '동종업계';
        const text = quote.change_rate < 0
          ? `업종(${sec}) 평균 ${fmt(ctx.sector_rate)}% 대비 ${Math.abs(rel).toFixed(2)}%p ${rel < 0 ? '더 많이' : '덜'} 빠졌습니다 — 종목 고유 요인이 섞여 있습니다.`
          : `업종 평균 ${fmt(ctx.sector_rate)}% 대비 ${Math.abs(rel).toFixed(2)}%p 아웃퍼폼 중입니다 — 종목 고유 호재가 있습니다.`;
        add('vs_sector', text, 1.4);
      }
    }

    if (ctx.peers && ctx.peers.length) {
      const worst = ctx.peers.reduce((a, p) => (p.change_rate < a.change_rate ? p : a));
      const best = ctx.peers.reduce((a, p) => (p.change_rate > a.change_rate ? p : a));
      add('peers', '동종 종목: ' + ctx.peers.slice(0, 4)
        .map((p) => `${p.name} ${fmt(p.change_rate)}%`).join(', '));
      if (worst.change_rate < quote.change_rate && best.change_rate > quote.change_rate) {
        add('peer_mid', '동종 종목들도 함께 움직이고 있어 업종 전반의 이슈로 보입니다.');
      }
    }

    if (quote.week52_high && quote.week52_low && quote.week52_high > quote.week52_low) {
      const pos52 = (quote.price - quote.week52_low) / (quote.week52_high - quote.week52_low);
      if (pos52 >= 0.95) {
        add('52w', '52주 신고가권 — 신고가 부담에 따른 차익실현이 나올 수 있는 자리입니다.');
      } else if (pos52 <= 0.05) {
        add('52w', '52주 신저가권 — 추세적 악재가 누적된 상태입니다.');
      }
    }

    return out;
  }

  function rank(comps) {
    return [
      ['MARKET', comps.market],
      ['SECTOR', comps.sector],
      ['IDIOSYNCRATIC', comps.idiosyncratic],
    ].sort((a, b) => Math.abs(b[1].value) - Math.abs(a[1].value));
  }

  function pickDriver(ranked, stockRate) {
    const [topKey, top] = ranked[0];
    if (Math.abs(stockRate) < NOISE_RATE) return { driver: topKey, confidence: 0.2 };
    const second = ranked[1][1];
    const gap = top.share - second.share;
    return { driver: topKey, confidence: Math.min(0.95, 0.45 + top.share * 0.4 + gap * 0.4) };
  }

  function phrase(key, value, ctx) {
    if (key === 'MARKET') {
      const idx = ctx.index_rate != null
        ? `${ctx.index_name} ${fmt(ctx.index_rate)}%` : ctx.index_name;
      return `${idx}에 연동된 시장 전체 흐름(${fmt(value)}%p)`;
    }
    if (key === 'SECTOR') {
      const sec = ctx.sector_name || '업종';
      return `${sec} 업종이 시장보다 ${value < 0 ? '더 깊게 하락' : '시장 대비 강세'}(${fmt(value)}%p)`;
    }
    return `종목 고유 요인(${fmt(value)}%p, 동종 대비 ${value < 0 ? '약세' : '강세'})`;
  }

  function buildHeadline(quote, ranked, ctx) {
    const r = quote.change_rate;
    const move = r >= 3 ? '급등' : r > 0 ? '상승' : r <= -3 ? '급락' : r < 0 ? '하락' : '보합';
    const head = `${quote.name} ${fmt(r)}% ${move}`;

    const [topKey, top] = ranked[0];
    const parts = [phrase(topKey, top.value, ctx)];
    const [secondKey, second] = ranked[1];
    if (second.share >= SECONDARY_MIN_SHARE && Math.abs(second.value) >= SECONDARY_MIN_VALUE) {
      parts.push(phrase(secondKey, second.value, ctx));
    }
    return `${head} — 주 원인은 ${parts[0]}` +
      (parts.length > 1 ? `; 여기에 ${parts[1]}이 겹쳤습니다.` : '.');
  }

  /** 시세 + 시장환경으로부터 정량적 귀인 결과를 만든다. 뉴스는 여기서 쓰지 않는다. */
  function analyze(quote, ctx) {
    const comps = decompose(quote, ctx);
    const ranked = rank(comps);
    let { driver, confidence } = pickDriver(ranked, quote.change_rate);
    const { timing, gap, intraday } = classifyTiming(quote);
    const signals = collectSignals(quote, ctx, timing, gap, intraday);

    if (signals.some((s) => s.key === 'volume_surge') && driver === 'IDIOSYNCRATIC') {
      confidence = Math.min(0.95, confidence + 0.1);
    }
    if (ctx.index_rate == null) confidence *= 0.6;
    if (ctx.sector_rate == null && !(ctx.peers && ctx.peers.length)) confidence *= 0.8;

    return {
      stock_rate: quote.change_rate,
      driver,
      driver_label: DRIVER_LABEL[driver],
      confidence: Math.round(confidence * 100) / 100,
      timing,
      headline: buildHeadline(quote, ranked, ctx),
      components: {
        market: round(comps.market),
        sector: round(comps.sector),
        idiosyncratic: round(comps.idiosyncratic),
      },
      signals,
    };
  }

  const round = (c) => ({
    name: c.name,
    value: Math.round(c.value * 100) / 100,
    share: Math.round(c.share * 1000) / 1000,
  });

  // ------------------------------------------------------------------
  // 뉴스 스코어링
  // ------------------------------------------------------------------

  const CATEGORY_KEYWORDS = {
    '실적': ['실적', '영업이익', '어닝', '잠정', '매출', '적자', '흑자', '가이던스', '컨센서스'],
    '공시': ['공시', '정정', '조회공시', '풍문'],
    '수주/계약': ['수주', '계약', '공급', '납품', '체결', 'MOU', '협약', '제휴'],
    '증자/자금': ['유상증자', '무상증자', '전환사채', 'CB', 'BW', '감자', '차입', '자금조달'],
    '주주환원': ['자사주', '배당', '소각', '주주환원', '매입'],
    'M&A/지분': ['인수', '합병', '매각', '지분', '최대주주', '경영권'],
    '소송/규제': ['소송', '특허', '제재', '과징금', '조사', '압수', '규제', '분쟁', '합의'],
    '임상/승인': ['임상', '승인', '허가', 'FDA', '품목허가', '기술이전'],
    '증권가': ['목표주가', '투자의견', '상향', '하향', '커버리지', '리포트'],
    '수급': ['외국인', '기관', '공매도', '수급', '사이드카', '레버리지', 'ETF', '패시브', '리밸런싱'],
    '매크로': ['금리', '환율', '연준', 'FOMC', '관세', '유가', '지수', '나스닥', '다우'],
  };

  const POSITIVE = ['호재', '급등', '강세', '상향', '수주', '흑자', '최대', '돌파', '기대', '회복', '확대', '승인', '종결'];
  const NEGATIVE = ['악재', '급락', '약세', '하향', '적자', '취소', '해지', '무산', '우려', '위축', '축소', '제재', '감소'];

  const HARD_CATS = ['실적', '공시', '수주/계약', '증자/자금', 'M&A/지분', '소송/규제', '임상/승인', '주주환원'];

  function categorize(title) {
    return Object.keys(CATEGORY_KEYWORDS)
      .filter((cat) => CATEGORY_KEYWORDS[cat].some((k) => title.includes(k)));
  }

  function tone(title) {
    const pos = POSITIVE.filter((k) => title.includes(k)).length;
    const neg = NEGATIVE.filter((k) => title.includes(k)).length;
    return (pos > neg ? 1 : 0) - (neg > pos ? 1 : 0);
  }

  const hasAny = (list, set) => list.some((x) => set.includes(x));

  /** 기사별로 '오늘 이 움직임의 원인일 가능성' 점수를 매겨 정렬한다. */
  function scoreNews(news, quote, attribution, now) {
    now = now || new Date();
    const direction = quote.change_rate > 0 ? 1 : quote.change_rate < 0 ? -1 : 0;

    const scored = news.map((item) => {
      let score = 0;
      const cats = categorize(item.title);
      const t = tone(item.title);

      if (cats.length) {
        score += 1.0;
        if (attribution.driver === 'IDIOSYNCRATIC' && hasAny(cats, HARD_CATS)) score += 2.0;
        if (attribution.driver === 'MARKET' && hasAny(cats, ['매크로', '수급'])) score += 1.5;
        if (attribution.driver === 'SECTOR' && hasAny(cats, ['매크로', '수급', '증권가'])) score += 1.0;
      }

      if (quote.name && item.title.includes(quote.name)) score += 1.0;

      if (direction && t === direction) score += 1.0;
      else if (direction && t === -direction) score -= 0.5;

      if (item.published_at) {
        const ageMin = Math.max(0, (now - item.published_at) / 60000);
        score += attribution.timing === 'INTRADAY'
          ? Math.max(0, 3.0 - ageMin / 60.0)
          : Math.max(0, 1.5 - ageMin / 180.0);
      }

      return {
        title: item.title,
        time: item.published_at ? hhmm(item.published_at) : '--:--',
        url: item.url || null,
        press: item.press || null,
        categories: cats,
        tone: t,
        score: Math.round(score * 100) / 100,
      };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored;
  }

  const hhmm = (d) =>
    String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');

  global.Attribution = {
    analyze, decompose, classifyTiming, scoreNews, categorize, tone,
    DRIVER_LABEL,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
