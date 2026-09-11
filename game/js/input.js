/* 입력: 마우스 + 터치 + 키보드 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var DRAGGABLE = { water: 1, till: 1, harvest: 1, hammer: 1, fert: 1 };
  var dragging = false;
  var lastTile = -1;
  var isTouch = false;

  function apply(i, isDrag) {
    if (i < 0) { return; }
    FG.game.useTool(i, FG.game.state.tool, isDrag);
  }

  function onDown(e) {
    if (FG.ui.isPanelOpen()) { return; }
    FG.audio.unlock();
    isTouch = e.pointerType === 'touch';
    var i = FG.render.tileAt(e.clientX, e.clientY);
    if (i < 0) { return; }
    dragging = true;
    lastTile = i;
    try { e.target.setPointerCapture(e.pointerId); } catch (err) { /* 무시 */ }
    FG.render.setHover(isTouch ? -1 : i);
    apply(i, false);
    e.preventDefault();
  }

  function onMove(e) {
    var i = FG.render.tileAt(e.clientX, e.clientY);
    if (!dragging) {
      if (e.pointerType !== 'touch') { FG.render.setHover(i); }
      return;
    }
    if (i >= 0 && i !== lastTile) {
      lastTile = i;
      if (!isTouch) { FG.render.setHover(i); }
      if (DRAGGABLE[FG.game.state.tool]) { apply(i, true); }
    }
    e.preventDefault();
  }

  function onUp(e) {
    dragging = false;
    lastTile = -1;
    if (e && e.pointerType === 'touch') { FG.render.setHover(-1); }
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { return; }
    var key = e.key;
    if (key === 'Escape') { FG.ui.closePanel(); return; }
    if (FG.ui.isPanelOpen()) { return; }

    var n = parseInt(key, 10);
    if (n >= 1 && n <= FG.TOOLS.length) {
      FG.ui.selectTool(FG.TOOLS[n - 1].id);
      FG.audio.unlock();
      return;
    }
    var k = key.toLowerCase();
    if (k === 'w') { FG.audio.unlock(); FG.game.waterAll(); }
    else if (k === 'h') { FG.audio.unlock(); FG.game.harvestAll(); }
    else if (k === 'b') { FG.ui.openPanel('barn'); }
    else if (k === 'm') { FG.ui.openPanel('market'); }
    else if (k === 's') { FG.ui.openPanel('shop'); }
  }

  FG.input = {
    init: function (canvas) {
      canvas.addEventListener('pointerdown', onDown);
      canvas.addEventListener('pointermove', onMove);
      canvas.addEventListener('pointerup', onUp);
      canvas.addEventListener('pointercancel', onUp);
      canvas.addEventListener('pointerleave', function (e) {
        if (e.pointerType !== 'touch') { FG.render.setHover(-1); }
      });
      canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      window.addEventListener('keydown', onKey);
      // iOS 사파리에서 더블탭 확대/당겨서 새로고침 방지
      document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
      document.addEventListener('touchmove', function (e) {
        if (e.target && e.target.closest && e.target.closest('.sheet-content')) { return; }
        if (e.cancelable) { e.preventDefault(); }
      }, { passive: false });
    }
  };
})(window.FG);
