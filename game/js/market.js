/* 시장 시세: 평균회귀 랜덤워크로 매일 가격이 움직인다 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var HISTORY = 12;

  function newEntry() {
    return { factor: 1, prev: 1, history: [1], next: 1 };
  }

  FG.market = {
    create: function () {
      var m = { crops: {}, index: 1, indexHistory: [1] };
      FG.CROPS.forEach(function (c) { m.crops[c.id] = newEntry(); });
      m.crops[FG.CROPS[0].id].next = 1;
      FG.market.rollForecast(m);
      return m;
    },

    /* 다음 날 예상 시세를 미리 뽑아둔다(분석 리포트 업그레이드가 이걸 보여준다) */
    rollForecast: function (m) {
      FG.CROPS.forEach(function (c) {
        var e = m.crops[c.id];
        var drift = (1 - e.factor) * 0.28;                 // 평균 회귀
        var shock = (Math.random() - 0.5) * 0.34;          // 일일 변동
        if (Math.random() < 0.07) { shock += (Math.random() < 0.5 ? -1 : 1) * 0.28; } // 가끔 큰 이벤트
        e.next = FG.clamp(e.factor + drift + shock, 0.55, 2.1);
      });
    },

    /* 하루가 지날 때 호출 */
    advance: function (m) {
      var sum = 0, n = 0;
      FG.CROPS.forEach(function (c) {
        var e = m.crops[c.id];
        e.prev = e.factor;
        e.factor = e.next;
        e.history.push(e.factor);
        if (e.history.length > HISTORY) { e.history.shift(); }
        sum += e.factor; n++;
      });
      m.index = sum / Math.max(1, n);
      m.indexHistory.push(m.index);
      if (m.indexHistory.length > HISTORY) { m.indexHistory.shift(); }
      FG.market.rollForecast(m);
    },

    price: function (m, cropId, quality, analyst) {
      var crop = FG.CROP_BY_ID[cropId];
      if (!crop) { return 0; }
      var f = m.crops[cropId] ? m.crops[cropId].factor : 1;
      var p = crop.price * f;
      if (quality === 'gold') { p *= FG.CONFIG.GOLD_MULT; }
      if (analyst) { p *= 1.05; }
      return Math.max(1, Math.round(p));
    },

    change: function (m, cropId) {
      var e = m.crops[cropId];
      if (!e || !e.prev) { return 0; }
      return e.factor / e.prev - 1;
    },

    forecastChange: function (m, cropId) {
      var e = m.crops[cropId];
      if (!e || !e.factor) { return 0; }
      return e.next / e.factor - 1;
    }
  };
})(window.FG);
