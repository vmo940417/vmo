/* 공용 유틸 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  FG.clamp = function (v, a, b) { return v < a ? a : (v > b ? b : v); };
  FG.lerp = function (a, b, t) { return a + (b - a) * t; };
  FG.rand = function (a, b) { return a + Math.random() * (b - a); };
  FG.randInt = function (a, b) { return Math.floor(a + Math.random() * (b - a + 1)); };
  FG.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  FG.fmt = function (n) {
    return Math.floor(n).toLocaleString('ko-KR');
  };

  FG.pct = function (n) {
    var s = (n >= 0 ? '+' : '') + (n * 100).toFixed(1) + '%';
    return s;
  };

  /* 타일마다 고정된 무늬를 그리기 위한 결정적 난수 */
  FG.hash01 = function (n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  FG.storage = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); return true; } catch (e) { return false; }
    },
    remove: function (key) {
      try { window.localStorage.removeItem(key); } catch (e) { /* 무시 */ }
    }
  };
})(window.FG);
