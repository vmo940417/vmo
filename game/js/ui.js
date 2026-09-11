/* DOM UI: HUD, 툴바, 상점/시장/창고/메뉴 패널 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var C = FG.CONFIG;
  var el = {};
  var current = null;   // 열려 있는 패널 id

  function $(id) { return document.getElementById(id); }

  function cacheDom() {
    ['coins', 'level', 'expFill', 'day', 'dayFill', 'weather', 'barnCount', 'toolbar',
     'sheet', 'sheetTitle', 'sheetContent', 'sheetClose', 'toasts', 'combo',
     'qWater', 'qHarvest'].forEach(function (id) { el[id] = $(id); });
  }

  /* ---------------- 툴바 ---------------- */
  function buildToolbar() {
    el.toolbar.innerHTML = FG.TOOLS.map(function (t, i) {
      return '<button class="tool" data-tool="' + t.id + '" title="' + t.hint + '">' +
        '<kbd>' + (i + 1) + '</kbd>' +
        (t.id === 'seed' ? '<em class="badge" id="seedBadge"></em>' : '') +
        '<span class="emoji">' + t.emoji + '</span>' +
        '<span>' + t.name + '</span></button>';
    }).join('');
    el.toolbar.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-tool]');
      if (!btn) { return; }
      var id = btn.getAttribute('data-tool');
      FG.audio.unlock();
      if (id === 'seed' && FG.game.state.tool === 'seed') { UI.openPanel('seeds'); return; }
      UI.selectTool(id);
    });
  }

  function refreshToolbar() {
    var tool = FG.game.state.tool;
    Array.prototype.forEach.call(el.toolbar.querySelectorAll('[data-tool]'), function (b) {
      b.classList.toggle('active', b.getAttribute('data-tool') === tool);
    });
    var badge = $('seedBadge');
    var crop = FG.CROP_BY_ID[FG.game.state.selectedCrop];
    if (badge && crop) { badge.textContent = crop.emoji; }
  }

  /* ---------------- HUD ---------------- */
  function clock(t) {
    var total = (t / C.DAY_LENGTH) * 24;
    var h = Math.floor(total);
    var m = Math.floor((total - h) * 60);
    return (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m;
  }

  function updateHud() {
    var s = FG.game.state;
    if (!s) { return; }
    el.coins.textContent = FG.fmt(s.coins);
    el.level.textContent = s.level;
    el.expFill.style.width = FG.clamp(s.exp / FG.expToNext(s.level), 0, 1) * 100 + '%';
    el.day.textContent = s.day;
    el.dayFill.style.width = (s.time / C.DAY_LENGTH) * 100 + '%';
    var w = FG.game.weather();
    el.weather.textContent = w.emoji + ' ' + w.name + ' ' + clock(s.time) + (FG.game.isNight() ? ' 🌙' : '');
    var n = FG.game.inventoryCount();
    el.barnCount.textContent = n > 0 ? (n > 99 ? '99+' : n) : '';

    var combo = FG.game.combo;
    el.combo.classList.toggle('on', combo >= 2);
    if (combo >= 2) { el.combo.textContent = '🔨 ' + combo + ' 콤보!'; }
  }

  /* ---------------- 토스트 ---------------- */
  function toast(text, kind) {
    var div = document.createElement('div');
    div.className = 'toast ' + (kind || 'info');
    div.textContent = text;
    el.toasts.appendChild(div);
    while (el.toasts.children.length > 3) { el.toasts.removeChild(el.toasts.firstChild); }
    setTimeout(function () {
      div.style.transition = 'opacity .4s';
      div.style.opacity = '0';
      setTimeout(function () { if (div.parentNode) { div.parentNode.removeChild(div); } }, 420);
    }, 2600);
  }

  /* ---------------- 공용 조각 ---------------- */
  function sparkline(history, color) {
    if (!history || history.length < 2) { return '<svg class="sparkline"></svg>'; }
    var w = 74, h = 26, pad = 3;
    var min = Math.min.apply(null, history), max = Math.max.apply(null, history);
    var span = Math.max(0.0001, max - min);
    var pts = history.map(function (v, i) {
      var x = pad + (i / (history.length - 1)) * (w - pad * 2);
      var y = h - pad - ((v - min) / span) * (h - pad * 2);
      return x.toFixed(1) + ',' + y.toFixed(1);
    }).join(' ');
    return '<svg class="sparkline" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none">' +
      '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="1.8" ' +
      'stroke-linejoin="round" stroke-linecap="round"/></svg>';
  }

  function changeTag(v) {
    var cls = v >= 0 ? 'up' : 'down';
    return '<span class="tag ' + cls + '">' + FG.pct(v) + '</span>';
  }

  /* ---------------- 패널: 씨앗 / 상점 ---------------- */
  function seedRows() {
    var g = FG.game, s = g.state;
    return FG.CROPS.map(function (c) {
      var locked = c.level > s.level;
      var sel = s.selectedCrop === c.id;
      var price = g.priceOf(c.id, 'normal');
      return '<div class="row' + (locked ? ' locked' : '') + (sel && !locked ? ' sel' : '') + '">' +
        '<div class="ico">' + c.emoji + '</div>' +
        '<div class="body">' +
          '<div class="title">' + c.name +
            (locked ? '<span class="tag">Lv.' + c.level + ' 필요</span>' : '') +
            (sel && !locked ? '<span class="tag up">선택됨</span>' : '') + '</div>' +
          '<div class="desc">씨앗 ' + FG.fmt(c.seed) + '원 · 성장 ' + c.grow + '초 · 수확 ' +
            c.yield[0] + '~' + c.yield[1] + '개 · 현재 시세 ' + FG.fmt(price) + '원</div>' +
        '</div>' +
        (locked ? '' : '<button class="btn" data-act="selectCrop" data-id="' + c.id + '">선택</button>') +
      '</div>';
    }).join('');
  }

  function renderSeeds() {
    return '<div class="section-title">심을 작물 고르기</div>' + seedRows();
  }

  function renderShop() {
    var g = FG.game;
    var ups = FG.UPGRADES.map(function (u) {
      var owned = g.state.upgrades[u.id];
      var maxed = (!u.repeat && owned) ||
        (u.id === 'expand' && g.unlockedCount() >= C.COLS * C.ROWS);
      var cost = g.upgradeCost(u.id);
      var can = g.canBuy(u.id);
      return '<div class="row' + (maxed ? ' locked' : '') + '">' +
        '<div class="ico">' + u.emoji + '</div>' +
        '<div class="body">' +
          '<div class="title">' + u.name +
            (u.repeat && owned ? '<span class="tag">' + owned + '회 구매</span>' : '') +
            (maxed ? '<span class="tag up">보유중</span>' : '') + '</div>' +
          '<div class="desc">' + u.desc + '</div>' +
        '</div>' +
        (maxed ? '' : '<button class="btn' + (can ? '' : ' ghost') + '" data-act="buyUp" data-id="' + u.id + '"' +
          (can ? '' : ' disabled') + '>🪙 ' + FG.fmt(cost) + '</button>') +
      '</div>';
    }).join('');

    return '<div class="section-title">농장 업그레이드</div>' + ups +
      '<div class="section-title">씨앗 (탭해서 선택 → 밭에 심기)</div>' + seedRows();
  }

  /* ---------------- 패널: 시장 ---------------- */
  function renderMarket() {
    var g = FG.game, m = g.state.market;
    var analyst = g.has('analyst');
    var idxChange = m.indexHistory.length > 1
      ? m.index / m.indexHistory[m.indexHistory.length - 2] - 1 : 0;

    var head = '<div class="row">' +
      '<div class="ico">📊</div>' +
      '<div class="body"><div class="title">농산물 종합지수 ' + (m.index * 100).toFixed(1) + changeTag(idxChange) + '</div>' +
      '<div class="desc">' + g.state.day + '일차 시세 · 매일 아침 가격이 새로 형성됩니다' +
      (analyst ? ' · 📈 분석 리포트 적용중 (판매가 +5%)' : '') + '</div></div>' +
      sparkline(m.indexHistory, '#7ed957') + '</div>';

    var rows = FG.CROPS.map(function (c) {
      var e = m.crops[c.id];
      var price = g.priceOf(c.id, 'normal');
      var chg = FG.market.change(m, c.id);
      var fc = FG.market.forecastChange(m, c.id);
      var locked = c.level > g.state.level;
      return '<div class="row' + (locked ? ' locked' : '') + '">' +
        '<div class="ico">' + c.emoji + '</div>' +
        '<div class="body">' +
          '<div class="title">' + c.name + ' ' + FG.fmt(price) + '원 ' + changeTag(chg) + '</div>' +
          '<div class="desc">기준가 ' + FG.fmt(c.price) + '원 · 배수 ' + e.factor.toFixed(2) + 'x' +
            (analyst ? ' · 내일 전망 ' + FG.pct(fc) : '') + '</div>' +
        '</div>' +
        sparkline(e.history, chg >= 0 ? '#7ee787' : '#ff8b8b') +
      '</div>';
    }).join('');

    return head + '<div class="section-title">작물별 시세</div>' + rows;
  }

  /* ---------------- 패널: 창고 ---------------- */
  function renderBarn() {
    var g = FG.game, inv = g.state.inventory;
    var rows = '';
    var total = 0;

    FG.CROPS.forEach(function (c) {
      var it = inv[c.id];
      if (!it) { return; }
      ['gold', 'normal'].forEach(function (q) {
        var n = it[q] || 0;
        if (n <= 0) { return; }
        var unit = g.priceOf(c.id, q);
        total += unit * n;
        rows += '<div class="row">' +
          '<div class="ico">' + c.emoji + (q === 'gold' ? '<div style="font-size:11px">✨</div>' : '') + '</div>' +
          '<div class="body">' +
            '<div class="title">' + c.name + (q === 'gold' ? ' <span class="tag gold" style="color:#ffd24a">황금</span>' : '') +
              ' <span class="tag">x' + n + '</span></div>' +
            '<div class="desc">개당 ' + FG.fmt(unit) + '원 · 합계 ' + FG.fmt(unit * n) + '원</div>' +
          '</div>' +
          '<div class="btn-col">' +
            '<div class="btn-row">' +
              '<button class="btn ghost" data-act="sell" data-id="' + c.id + '" data-q="' + q + '" data-n="1">1개</button>' +
              '<button class="btn ghost" data-act="sell" data-id="' + c.id + '" data-q="' + q + '" data-n="10">10개</button>' +
            '</div>' +
            '<button class="btn" data-act="sell" data-id="' + c.id + '" data-q="' + q + '" data-n="9999">전부 팔기</button>' +
          '</div>' +
        '</div>';
      });
    });

    if (!rows) {
      return '<div class="help" style="text-align:center;padding:28px 10px">창고가 비어 있습니다.<br>밭에서 다 자란 작물을 🧺 수확해 오세요.</div>';
    }

    return '<div class="row"><div class="ico">💰</div>' +
      '<div class="body"><div class="title">창고 평가액 ' + FG.fmt(total) + '원</div>' +
      '<div class="desc">시세가 좋을 때 파는 게 이득입니다. 📈 시장에서 흐름을 확인하세요.</div></div>' +
      '<button class="btn gold" data-act="sellAll">전량 판매</button></div>' +
      '<div class="section-title">보유 작물</div>' + rows;
  }

  /* ---------------- 패널: 메뉴 ---------------- */
  function renderMenu() {
    var g = FG.game, s = g.state;
    var st = s.stats;
    return '<div class="section-title">설정</div>' +
      '<div class="row"><div class="ico">' + (FG.audio.isEnabled() ? '🔊' : '🔇') + '</div>' +
        '<div class="body"><div class="title">효과음</div><div class="desc">터치·수확·망치 소리</div></div>' +
        '<button class="btn" data-act="toggleSound">' + (FG.audio.isEnabled() ? '켜짐' : '꺼짐') + '</button></div>' +
      '<div class="row"><div class="ico">⛶</div>' +
        '<div class="body"><div class="title">전체 화면</div><div class="desc">모바일에서 주소창을 숨깁니다</div></div>' +
        '<button class="btn" data-act="fullscreen">전환</button></div>' +
      '<div class="row"><div class="ico">💾</div>' +
        '<div class="body"><div class="title">저장</div><div class="desc">진행 상황은 이 기기에 자동 저장됩니다</div></div>' +
        '<button class="btn" data-act="save">지금 저장</button></div>' +

      '<div class="section-title">농장 기록</div>' +
      '<div class="stats-grid">' +
        '<div><span>총 수확</span>' + FG.fmt(st.harvested) + '개</div>' +
        '<div><span>두더지 격퇴</span>' + FG.fmt(st.moles) + '마리</div>' +
        '<div><span>누적 수입</span>' + FG.fmt(st.earned) + '원</div>' +
        '<div><span>누적 지출</span>' + FG.fmt(st.spent) + '원</div>' +
        '<div><span>말라 죽은 작물</span>' + FG.fmt(st.died) + '개</div>' +
        '<div><span>두더지에게 뺏김</span>' + FG.fmt(st.eaten) + '개</div>' +
      '</div>' +

      '<div class="section-title">조작법</div>' +
      '<div class="help">' +
        '<ul>' +
        '<li>아래 툴바에서 도구를 고른 뒤 밭을 <b>탭(클릭)</b>하면 적용됩니다.</li>' +
        '<li>물·경작·수확은 <b>드래그</b>하면 여러 칸에 연속 적용됩니다.</li>' +
        '<li>두더지가 나오면 <b>🔨 망치</b>로 두드려 잡으세요. 연속으로 잡으면 콤보 보상이 커집니다. 다른 도구로 치면 쫓아내기만 하고 보상은 없습니다.</li>' +
        '<li>제한 시간 안에 못 잡으면 작물을 통째로 먹어치웁니다.</li>' +
        '<li>물이 마르면 성장이 거의 멈추고, 오래 두면 작물이 죽습니다.</li>' +
        '<li>비료는 성장 속도 ' + C.FERT_GROWTH + '배 + 수확량 증가 + ✨황금 등급 확률을 줍니다.</li>' +
        '<li>키보드: <b>1~6</b> 도구 전환, <b>W</b> 전체 물주기, <b>H</b> 전체 수확, <b>Esc</b> 닫기.</li>' +
        '</ul>' +
      '</div>' +

      '<div class="section-title">위험 구역</div>' +
      '<div class="row"><div class="ico">🗑️</div>' +
        '<div class="body"><div class="title">새로 시작</div><div class="desc">모든 진행이 삭제됩니다</div></div>' +
        '<button class="btn" style="background:#7a2525;border-color:#b33" data-act="reset">초기화</button></div>';
  }

  /* ---------------- 패널 제어 ---------------- */
  var PANELS = {
    shop:   { title: '🏪 상점', render: renderShop },
    market: { title: '📈 시장', render: renderMarket },
    barn:   { title: '🧺 창고', render: renderBarn },
    menu:   { title: '⚙️ 메뉴', render: renderMenu },
    seeds:  { title: '🌱 씨앗 선택', render: renderSeeds }
  };

  var UI = {
    init: function () {
      cacheDom();
      buildToolbar();
      refreshToolbar();

      document.querySelectorAll('[data-panel]').forEach(function (b) {
        b.addEventListener('click', function () { FG.audio.unlock(); UI.openPanel(b.getAttribute('data-panel')); });
      });
      el.sheetClose.addEventListener('click', function () { UI.closePanel(); });
      el.sheet.addEventListener('click', function (e) { if (e.target === el.sheet) { UI.closePanel(); } });
      el.sheetContent.addEventListener('click', onAction);

      el.qWater.addEventListener('click', function () { FG.audio.unlock(); FG.game.waterAll(); });
      el.qHarvest.addEventListener('click', function () { FG.audio.unlock(); FG.game.harvestAll(); });

      FG.game.on('toast', function (d) { toast(d.text, d.kind); });
      FG.game.on('change', function () { if (current) { UI.refreshPanel(); } refreshToolbar(); });
    },

    selectTool: function (id) {
      FG.game.state.tool = id;
      refreshToolbar();
    },

    openPanel: function (name) {
      if (!PANELS[name]) { return; }
      current = name;
      el.sheetTitle.textContent = PANELS[name].title;
      el.sheetContent.innerHTML = PANELS[name].render();
      el.sheetContent.scrollTop = 0;
      el.sheet.hidden = false;
    },

    refreshPanel: function () {
      if (!current) { return; }
      var top = el.sheetContent.scrollTop;
      el.sheetContent.innerHTML = PANELS[current].render();
      el.sheetContent.scrollTop = top;
    },

    closePanel: function () {
      current = null;
      el.sheet.hidden = true;
    },

    isPanelOpen: function () { return !!current; },
    updateHud: updateHud,
    toast: toast
  };

  function onAction(e) {
    var btn = e.target.closest('[data-act]');
    if (!btn) { return; }
    var act = btn.getAttribute('data-act');
    var id = btn.getAttribute('data-id');
    var g = FG.game;
    FG.audio.unlock();

    if (act === 'selectCrop') {
      g.state.selectedCrop = id;
      g.state.tool = 'seed';
      refreshToolbar();
      FG.audio.play('plant');
      var crop = FG.CROP_BY_ID[id];
      toast(crop.emoji + ' ' + crop.name + ' 선택 — 밭을 탭해서 심으세요', 'good');
      if (current === 'seeds') { UI.closePanel(); } else { UI.refreshPanel(); }
      return;
    }
    if (act === 'buyUp') { g.buyUpgrade(id); UI.refreshPanel(); return; }
    if (act === 'sell') {
      var n = parseInt(btn.getAttribute('data-n'), 10);
      var q = btn.getAttribute('data-q');
      var got = g.sell(id, q, n);
      if (got > 0) { toast('+' + FG.fmt(got) + '원', 'good'); }
      UI.refreshPanel();
      return;
    }
    if (act === 'sellAll') { g.sellAll(); UI.refreshPanel(); return; }
    if (act === 'toggleSound') {
      var on = !FG.audio.isEnabled();
      FG.audio.setEnabled(on);
      g.state.sound = on;
      UI.refreshPanel();
      return;
    }
    if (act === 'fullscreen') {
      var d = document.documentElement;
      if (document.fullscreenElement) { document.exitFullscreen(); }
      else if (d.requestFullscreen) { d.requestFullscreen().catch(function () {}); }
      else if (d.webkitRequestFullscreen) { d.webkitRequestFullscreen(); }
      else { toast('이 브라우저에서는 전체화면을 지원하지 않습니다.', 'warn'); }
      return;
    }
    if (act === 'save') { g.save(); toast('저장했습니다.', 'good'); return; }
    if (act === 'reset') {
      if (window.confirm('정말 처음부터 다시 시작할까요? 모든 진행이 사라집니다.')) {
        g.reset();
        UI.closePanel();
        toast('새 농장을 시작합니다!', 'good');
      }
      return;
    }
  }

  FG.ui = UI;
})(window.FG);
