/* 부팅 & 게임 루프 */
(function (FG) {
  'use strict';

  var last = 0;
  var running = true;

  function frame(now) {
    var dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) { dt = 0.1; }          // 탭 전환 등으로 인한 큰 점프 방지
    if (running && dt > 0) {
      FG.game.update(dt);
      FG.render.draw(dt);
      FG.ui.updateHud();
    }
    requestAnimationFrame(frame);
  }

  function boot() {
    var canvas = document.getElementById('farm');

    var loaded = FG.game.load();
    if (!loaded) { FG.game.newGame(); }

    FG.render.init(canvas);
    FG.ui.init();
    FG.input.init(canvas);

    if (!loaded) {
      setTimeout(function () { FG.ui.toast('⛏️ 경작 → 🌱 씨앗 → 💧 물 순서로 시작해 보세요!', 'good'); }, 600);
      setTimeout(function () { FG.ui.toast('🔨 두더지가 나타나면 망치로 두드려 잡으세요!', 'warn'); }, 3600);
    } else {
      FG.ui.toast('농장에 돌아오신 걸 환영합니다 — ' + FG.game.state.day + '일차', 'good');
    }

    // 탭을 벗어나면 저장하고, 돌아오면 그동안의 성장을 반영한다
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        running = false;
        FG.game.save();
      } else {
        var savedAt = FG.game.state.savedAt;
        FG.game.applyOffline(savedAt);
        last = performance.now();
        running = true;
      }
    });
    window.addEventListener('pagehide', function () { FG.game.save(); });
    window.addEventListener('beforeunload', function () { FG.game.save(); });

    last = performance.now();
    requestAnimationFrame(frame);

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* 오프라인 캐시는 선택 사항 */ });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window.FG);
