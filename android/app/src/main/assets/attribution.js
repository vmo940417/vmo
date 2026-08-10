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

    out.push(...supplySignals(quote, ctx.supply));

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

  // ------------------------------------------------------------------
  // 수급 / 공매도 (models.SupplyDemand + attribution._supply_signals 이식본)
  //
  // 분해 항등식에는 손대지 않는다. 수급은 등락률의 '성분'이 아니라 그 성분을
  // 누가 만들었는지를 말해주는 정황이다.
  // ------------------------------------------------------------------

  const INVESTOR_LABEL = { foreign: '외국인', institution: '기관', individual: '개인' };

  const FLOW_BIG_EOK = 300.0;
  const FLOW_SHARE_OF_VALUE = 0.10;
  const STREAK_MIN_DAYS = 3;
  const SHORT_SURGE_RATIO = 1.5;
  const SHORT_HIGH_RATIO = 10.0;

  const todayStr = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
      '-' + String(d.getDate()).padStart(2, '0');
  };

  /** 순매수 값을 억원으로 환산. 수량(주)이면 현재가를 곱한 추정치다. */
  function toEok(value, unit, price) {
    if (value == null) return null;
    const won2 = unit === '원' ? value : (price ? value * price : null);
    return won2 == null ? null : won2 / 1e8;
  }

  /**
   * 파이썬 format(x, '.0f') 과 같은 반올림.
   *
   * 파이썬은 정확히 .5 일 때 짝수로 붙이고(banker's rounding) JS Math.round 는
   * 위로 올린다. 100,000주 x 228,500원 = 228.5억 같은 값이 실제로 나오기 때문에,
   * 이걸 맞추지 않으면 같은 데이터로 서버는 -228억, 앱은 -229억을 띄운다.
   */
  function round0(v) {
    const floor = Math.floor(v);
    const diff = v - floor;
    if (diff > 0.5) return floor + 1;
    if (diff < 0.5) return floor;
    return floor % 2 === 0 ? floor : floor + 1;
  }

  /** 파이썬의 f"{v:+,.0f}억" 과 같은 문자열을 만든다. */
  function eokTxt(value, unit, price) {
    const eok = toEok(value, unit, price);
    if (eok == null) return '-';
    return (unit === '주' ? '약 ' : '') + (eok >= 0 ? '+' : '-') +
      round0(Math.abs(eok)).toLocaleString('en-US') + '억';
  }

  const eokAbs = (eok) => round0(Math.abs(eok)).toLocaleString('en-US');

  const isFresh = (s, today) =>
    !!(s && s.today && s.today.date && s.today.date === (today || todayStr()));
  const shortIsFresh = (s, today) =>
    !!(s && s.short && s.short.date && s.short.date === (today || todayStr()));

  /** 같은 방향(순매수/순매도)이 며칠 이어졌는지와 누적치. */
  function streak(supply, who) {
    let days = 0, total = 0, sign = 0;
    for (const row of (supply && supply.history) || []) {
      const v = row[who];
      if (v == null || v === 0) break;
      const s = v > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) break;
      days += 1;
      total += v;
    }
    return { days, total };
  }

  /** 직전 며칠 평균 공매도 비중. 오늘(최신) 값은 비교 대상이라 뺀다. */
  function shortBaseline(supply, days = 5) {
    const past = ((supply && supply.short_history) || []).slice(1, days + 1)
      .map((s) => s.ratio).filter((r) => r != null);
    return past.length ? past.reduce((a, b) => a + b, 0) / past.length : null;
  }

  function supplySignals(quote, supply, today) {
    const out = [];
    if (!supply) return out;
    const add = (key, text, weight = 1.0) => out.push({ key, text, weight });

    const flow = supply.today;
    if (flow) {
      const fresh = isFresh(supply, today);
      const stamp = flow.provisional ? '장중 잠정' : (flow.date || '날짜 미상');
      const parts = ['foreign', 'institution', 'individual']
        .filter((k) => flow[k] != null)
        .map((k) => `${INVESTOR_LABEL[k]} ${eokTxt(flow[k], flow.unit, quote.price)}`);
      if (parts.length) {
        const head = fresh ? '오늘 수급' : `최근 수급(${flow.date} 기준)`;
        add('supply', `${head}[${stamp}]: ` + parts.join(' · '), fresh ? 1.4 : 0.8);
      }

      const sized = ['foreign', 'institution'].filter((k) => flow[k] != null)
        .map((k) => [k, flow[k]]);
      if (sized.length && fresh) {
        const [who, value] = sized.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a));
        const eok = toEok(value, flow.unit, quote.price);
        if (eok != null && Math.abs(eok) >= FLOW_BIG_EOK) {
          const side = value > 0 ? '순매수' : '순매도';
          const aligned = (value > 0) === (quote.change_rate > 0);
          let share = '';
          if (quote.trading_value) {
            const ratio = Math.abs(eok * 1e8) / quote.trading_value;
            if (ratio >= FLOW_SHARE_OF_VALUE) share = ` — 당일 거래대금의 ${Math.round(ratio * 100)}%`;
          }
          add('supply_side', aligned
            ? `${INVESTOR_LABEL[who]}이 ${eokAbs(eok)}억 ${side}${share}. 주가 방향과 일치해 수급이 오늘 움직임을 밀고 있습니다.`
            : `${INVESTOR_LABEL[who]}이 ${eokAbs(eok)}억 ${side}${share}. 주가 방향과 반대라 다른 주체가 더 세게 반대편에 서 있습니다.`,
            1.6);
        }
      }

      const st = streak(supply, 'foreign');
      if (st.days >= STREAK_MIN_DAYS) {
        const side = st.total > 0 ? '순매수' : '순매도';
        const eok = toEok(st.total, flow.unit, quote.price);
        const amount = eok != null ? `(누적 ${eokTxt(st.total, flow.unit, quote.price)})` : '';
        add('supply_streak',
          `외국인 ${st.days}일 연속 ${side}${amount} — 오늘 하루가 아니라 추세적 수급입니다.`, 1.2);
      }
    }

    const short = supply.short;
    if (short && short.ratio != null) {
      const baseline = shortBaseline(supply);
      const fresh = shortIsFresh(supply, today);
      const when = fresh ? '당일' : `${short.date} 기준`;
      let text = `공매도 비중 ${short.ratio.toFixed(1)}% (${when})`;
      let weight = 1.0;
      if (baseline) {
        const ratio = short.ratio / baseline;
        text += `, 직전 평균 ${baseline.toFixed(1)}% 의 ${ratio.toFixed(1)}배`;
        if (ratio >= SHORT_SURGE_RATIO) {
          text += ' — 공매도가 평소보다 확연히 늘었습니다';
          weight = 1.5;
        }
      } else if (short.ratio >= SHORT_HIGH_RATIO) {
        weight = 1.3;
      }
      if (!fresh) {
        // 한국은 장중 공매도를 실시간 공개하지 않는다.
        text += '. 당일 공매도는 장 마감 후에 공시되므로 지금 값은 직전 거래일 기준입니다';
      }
      add('short', text + '.', weight);
    }

    if (short && short.balance_ratio != null) {
      add('short_balance',
        `공매도 잔고 비중 ${short.balance_ratio.toFixed(2)}% — 숏 커버링 여력을 가늠할 수 있습니다.`);
    }

    return out;
  }

  /** 헤드라인 뒤에 붙일 수급 한 마디. 오늘 확정된 방향이 있을 때만 붙인다. */
  function supplyClause(quote, ctx, today) {
    const supply = ctx.supply;
    if (!supply || !supply.today || !isFresh(supply, today)) return '';
    const flow = supply.today;
    const sized = ['foreign', 'institution'].filter((k) => flow[k] != null).map((k) => [k, flow[k]]);
    if (!sized.length) return '';
    const [who, value] = sized.reduce((a, b) => (Math.abs(b[1]) > Math.abs(a[1]) ? b : a));
    const eok = toEok(value, flow.unit, quote.price);
    if (eok == null || Math.abs(eok) < FLOW_BIG_EOK) return '';
    return ` 수급은 ${INVESTOR_LABEL[who]} ${eokAbs(eok)}억 ${value > 0 ? '순매수' : '순매도'}가 주도했습니다.`;
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
    const body = `${head} — 주 원인은 ${parts[0]}` +
      (parts.length > 1 ? `; 여기에 ${parts[1]}이 겹쳤습니다.` : '.');
    return body + supplyClause(quote, ctx);
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
    // 수급 방향이 주가 방향과 맞으면 설명이 한 겹 더 뒷받침된다.
    if (signals.some((s) => s.key === 'supply_side' && s.text.includes('일치'))) {
      confidence = Math.min(0.95, confidence + 0.05);
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
        time: item.published_at ? hhmm(item.published_at) : '--/-- --:--',
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

  // 시간만으로는 어제 기사인지 오늘 기사인지 구분이 안 된다 — 날짜를 같이 낸다.
  // 파이썬의 strftime('%m/%d %H:%M') 과 같은 형태로 맞춘다.
  const hhmm = (d) => {
    // 날짜 파싱이 깨진 값을 넘기면 new Date(NaN,...) 이 나올 수 있다. 그 상태로
    // 포맷하면 "NaN/NaN NaN:NaN" 이 찍히므로, 차라리 결측 자리표시자로 뭉갠다.
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '--/-- --:--';
    return String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0') + ' ' +
      String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  global.Attribution = {
    analyze, decompose, classifyTiming, scoreNews, categorize, tone,
    supplySignals, toEok, streak, shortBaseline, isFresh, shortIsFresh, round0,
    DRIVER_LABEL, INVESTOR_LABEL,
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
