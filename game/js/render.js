/* 캔버스 렌더링 (이미지 파일 없이 전부 코드로 그린다) */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var C = FG.CONFIG;

  var view = {
    canvas: null, ctx: null,
    w: 0, h: 0, dpr: 1,
    tile: 60, ox: 0, oy: 0, gap: 6,
    cols: C.COLS, rows: C.ROWS, transposed: false,
    hover: -1, time: 0
  };

  function resize() {
    var cv = view.canvas;
    var rect = cv.parentNode.getBoundingClientRect();
    var dpr = Math.min(2.5, window.devicePixelRatio || 1);
    view.w = Math.max(200, rect.width);
    view.h = Math.max(200, rect.height);
    view.dpr = dpr;
    cv.width = Math.round(view.w * dpr);
    cv.height = Math.round(view.h * dpr);
    cv.style.width = view.w + 'px';
    cv.style.height = view.h + 'px';
    view.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 세로로 긴 화면(모바일 세로)에서는 밭을 90도 돌려 배치해 칸을 더 크게 쓴다
    view.transposed = view.h > view.w * 1.12;
    view.cols = view.transposed ? C.ROWS : C.COLS;
    view.rows = view.transposed ? C.COLS : C.ROWS;

    var pad = Math.max(8, Math.min(view.w, view.h) * 0.03);
    var gap = Math.max(4, Math.min(view.w, view.h) * 0.012);
    var tw = (view.w - pad * 2 - gap * (view.cols - 1)) / view.cols;
    var th = (view.h - pad * 2 - gap * (view.rows - 1)) / view.rows;
    var size = Math.max(28, Math.min(tw, th));
    view.gap = gap;
    view.tile = size;
    view.ox = (view.w - (size * view.cols + gap * (view.cols - 1))) / 2;
    view.oy = (view.h - (size * view.rows + gap * (view.rows - 1))) / 2;
  }

  function tileRect(i) {
    var x = i % C.COLS, y = Math.floor(i / C.COLS);
    var cx = view.transposed ? y : x;
    var cy = view.transposed ? x : y;
    return {
      x: view.ox + cx * (view.tile + view.gap),
      y: view.oy + cy * (view.tile + view.gap),
      s: view.tile
    };
  }

  function tileAt(clientX, clientY) {
    var rect = view.canvas.getBoundingClientRect();
    var px = clientX - rect.left, py = clientY - rect.top;
    var step = view.tile + view.gap;
    var gx = Math.floor((px - view.ox + view.gap / 2) / step);
    var gy = Math.floor((py - view.oy + view.gap / 2) / step);
    if (gx < 0 || gy < 0 || gx >= view.cols || gy >= view.rows) { return -1; }
    return view.transposed ? (gx * C.COLS + gy) : (gy * C.COLS + gx);
  }

  function roundRect(ctx, x, y, w, h, r) {
    var rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawBackground(ctx) {
    var g = ctx.createLinearGradient(0, 0, 0, view.h);
    g.addColorStop(0, '#6fbf5f');
    g.addColorStop(1, '#4c9c47');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, view.w, view.h);

    // 잔디 무늬
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = '#2f7a33';
    ctx.lineWidth = 1.5;
    var n = Math.floor((view.w * view.h) / 5200);
    for (var i = 0; i < n; i++) {
      var x = FG.hash01(i * 3.1) * view.w;
      var y = FG.hash01(i * 7.7 + 1) * view.h;
      var len = 4 + FG.hash01(i * 2.3) * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 2, y - len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSoil(ctx, t, r) {
    var s = r.s;
    var wet = t.moisture;
    var base = wet > 0.05 ? '#6b4326' : '#9a6b42';
    var top = wet > 0.05 ? '#7a4d2c' : '#a9784b';

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    roundRect(ctx, r.x + 2, r.y + 4, s, s, s * 0.16);
    ctx.fill();

    var g = ctx.createLinearGradient(r.x, r.y, r.x, r.y + s);
    g.addColorStop(0, top);
    g.addColorStop(1, base);
    ctx.fillStyle = g;
    roundRect(ctx, r.x, r.y, s, s, s * 0.16);
    ctx.fill();

    // 고랑
    ctx.globalAlpha = 0.22;
    ctx.strokeStyle = '#4f2f1a';
    ctx.lineWidth = Math.max(1, s * 0.035);
    for (var k = 1; k <= 3; k++) {
      var yy = r.y + (s * k) / 4;
      ctx.beginPath();
      ctx.moveTo(r.x + s * 0.12, yy);
      ctx.lineTo(r.x + s * 0.88, yy);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // 두더지가 파먹은 구멍
    if (t.hole > 0) {
      ctx.globalAlpha = Math.min(1, t.hole);
      ctx.fillStyle = '#3a2214';
      ctx.beginPath();
      ctx.ellipse(r.x + s * 0.5, r.y + s * 0.62, s * 0.2, s * 0.13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawGrassTile(ctx, t, r) {
    var s = r.s;
    ctx.save();
    if (!t.unlocked) {
      ctx.fillStyle = 'rgba(20,40,20,0.35)';
      roundRect(ctx, r.x, r.y, s, s, s * 0.16);
      ctx.fill();
      ctx.setLineDash([s * 0.08, s * 0.06]);
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, r.x + 2, r.y + 2, s - 4, s - 4, s * 0.14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.45;
      ctx.font = (s * 0.24) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#e8f5e9';
      ctx.fillText('🔒', r.x + s / 2, r.y + s / 2);
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.10)';
      roundRect(ctx, r.x, r.y, s, s, s * 0.16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, r.x + 1, r.y + 1, s - 2, s - 2, s * 0.15);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPlant(ctx, t, r) {
    var crop = FG.CROP_BY_ID[t.crop];
    if (!crop) { return; }
    var s = r.s;
    var cx = r.x + s / 2;
    var cy = r.y + s * 0.72;
    var p = t.progress;
    var wilt = t.wilt;
    var sway = Math.sin(view.time * 1.6 + r.x * 0.05) * s * 0.02 * (1 - wilt);

    ctx.save();
    ctx.translate(cx, cy);

    var green = wilt > 0.02
      ? 'rgb(' + Math.round(120 + wilt * 90) + ',' + Math.round(160 - wilt * 80) + ',' + Math.round(70 - wilt * 30) + ')'
      : '#3f9c45';

    // 줄기
    var h = s * (0.09 + p * 0.28);
    ctx.strokeStyle = green;
    ctx.lineWidth = Math.max(2, s * 0.05);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(sway, -h * 0.6, sway * 2, -h);
    ctx.stroke();

    // 잎
    var leaves = p < 0.25 ? 1 : (p < 0.6 ? 2 : 3);
    for (var i = 0; i < leaves; i++) {
      var ly = -h * (0.35 + i * 0.24);
      var dir = i % 2 === 0 ? 1 : -1;
      var lw = s * (0.11 + p * 0.1);
      ctx.fillStyle = green;
      ctx.beginPath();
      ctx.ellipse(dir * lw * 0.8 + sway, ly, lw, lw * 0.42, dir * (-0.5 + wilt * 1.1), 0, Math.PI * 2);
      ctx.fill();
    }

    // 열매 / 꽃
    if (p >= 0.62) {
      var bob = p >= 1 ? Math.sin(view.time * 3.2 + r.y) * s * 0.035 : 0;
      var scale = p >= 1 ? 1 : 0.45 + (p - 0.62) * 1.2;
      ctx.globalAlpha = p >= 1 ? 1 : 0.85;
      ctx.font = (s * 0.42 * scale) + 'px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(crop.emoji, sway * 2, -h - s * 0.04 + bob);
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // 비료 반짝임
    if (t.fert) {
      ctx.save();
      ctx.globalAlpha = 0.55 + Math.sin(view.time * 4 + r.x) * 0.25;
      ctx.fillStyle = '#d9f99d';
      for (var k = 0; k < 3; k++) {
        var a = view.time * 1.2 + k * 2.1;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * s * 0.3, cy - s * 0.25 + Math.sin(a) * s * 0.18, s * 0.025, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 시듦 경고
    if (t.wilt > 0.25) {
      ctx.save();
      ctx.globalAlpha = 0.5 + Math.sin(view.time * 6) * 0.4;
      ctx.font = (s * 0.26) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️', r.x + s * 0.82, r.y + s * 0.28);
      ctx.restore();
    }
  }

  function drawMeters(ctx, t, r) {
    var s = r.s;
    // 수분
    if (t.tilled) {
      var bw = s * 0.7, bh = Math.max(3, s * 0.055);
      var bx = r.x + (s - bw) / 2, by = r.y + s - bh - s * 0.07;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, bx, by, bw, bh, bh / 2); ctx.fill();
      ctx.fillStyle = t.moisture > 0.25 ? '#38bdf8' : '#f87171';
      roundRect(ctx, bx, by, Math.max(2, bw * t.moisture), bh, bh / 2); ctx.fill();
    }
    // 성장
    if (t.crop) {
      var gw = s * 0.7, gh = Math.max(3, s * 0.055);
      var gx = r.x + (s - gw) / 2, gy = r.y + s * 0.06;
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      roundRect(ctx, gx, gy, gw, gh, gh / 2); ctx.fill();
      ctx.fillStyle = t.progress >= 1 ? '#facc15' : '#86efac';
      roundRect(ctx, gx, gy, Math.max(2, gw * t.progress), gh, gh / 2); ctx.fill();
    }
  }

  function drawMole(ctx, mole, r) {
    var s = r.s;
    var cx = r.x + s * 0.5, cy = r.y + s * 0.58;
    var pop = mole.done ? Math.max(0, mole.hit) : mole.pop;
    var scale = mole.done ? 0.6 + pop * 0.6 : 0.6 + pop * 0.4;
    var shake = mole.done ? 0 : Math.sin(view.time * 22) * s * 0.012;

    ctx.save();
    ctx.translate(cx + shake, cy);
    ctx.scale(scale, scale);

    // 흙더미
    ctx.fillStyle = '#5a3720';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.16, s * 0.3, s * 0.11, 0, 0, Math.PI * 2);
    ctx.fill();

    // 몸통
    ctx.fillStyle = '#6b4a33';
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.21, s * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 코
    ctx.fillStyle = '#f2a2a2';
    ctx.beginPath();
    ctx.ellipse(0, s * 0.05, s * 0.07, s * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();

    // 눈
    ctx.fillStyle = '#20140c';
    ctx.beginPath(); ctx.arc(-s * 0.08, -s * 0.05, s * 0.026, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(s * 0.08, -s * 0.05, s * 0.026, 0, Math.PI * 2); ctx.fill();

    // 발
    ctx.fillStyle = '#8a6448';
    ctx.beginPath(); ctx.ellipse(-s * 0.19, s * 0.1, s * 0.06, s * 0.04, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(s * 0.19, s * 0.1, s * 0.06, s * 0.04, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    if (mole.done) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, mole.hit);
      ctx.font = (s * 0.34) + 'px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('💥', cx, cy - s * 0.25);
      ctx.restore();
      return;
    }

    // 남은 시간 링
    var ratio = 1 - mole.t / mole.life;
    ctx.save();
    ctx.lineWidth = Math.max(2.5, s * 0.06);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = ratio > 0.4 ? '#fbbf24' : '#ef4444';
    ctx.beginPath();
    ctx.arc(cx, cy, s * 0.36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ratio);
    ctx.stroke();
    ctx.restore();
  }

  function drawParticles(ctx) {
    var list = FG.game.particles;
    for (var i = 0; i < list.length; i++) {
      var p = list[i];
      var r = tileRect(p.tile);
      var s = r.s;
      var a = 1 - p.t / p.life;
      var x = r.x + s * (0.5 + p.x) + p.vx * s * 0.3;
      var y = r.y + s * (0.5 + p.y) + p.t * p.vy * s * 0.3;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      if (p.kind === 'drop') {
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.03, s * 0.05, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'sparkle') {
        ctx.translate(x, y);
        ctx.rotate(p.t * 6);
        ctx.fillRect(-s * 0.03, -s * 0.008, s * 0.06, s * 0.016);
        ctx.fillRect(-s * 0.008, -s * 0.03, s * 0.016, s * 0.06);
      } else if (p.kind === 'leaf') {
        ctx.beginPath();
        ctx.ellipse(x, y, s * 0.045, s * 0.02, p.t * 4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, s * 0.032, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawFloats(ctx) {
    var list = FG.game.floats;
    for (var i = 0; i < list.length; i++) {
      var f = list[i];
      var r = tileRect(f.tile);
      var a = 1 - f.t / f.life;
      ctx.save();
      ctx.globalAlpha = Math.max(0, a);
      ctx.font = '600 ' + Math.max(12, r.s * 0.24) + 'px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(0,0,0,0.55)';
      ctx.fillStyle = f.color;
      var y = r.y + r.s * 0.35 - f.t * r.s * 0.5;
      ctx.strokeText(f.text, r.x + r.s / 2, y);
      ctx.fillText(f.text, r.x + r.s / 2, y);
      ctx.restore();
    }
  }

  function drawWeather(ctx) {
    var w = FG.game.weather();
    if (w.id === 'rain') {
      ctx.save();
      ctx.strokeStyle = 'rgba(180,220,255,0.45)';
      ctx.lineWidth = 1.4;
      var n = Math.floor(view.w / 12);
      for (var i = 0; i < n; i++) {
        var seed = FG.hash01(i * 1.7);
        var x = (seed * view.w + view.time * 70) % view.w;
        var y = ((FG.hash01(i * 5.3) * view.h) + view.time * 620) % view.h;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 6, y + 16);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(30,50,80,0.18)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    } else if (w.id === 'drought') {
      ctx.save();
      ctx.fillStyle = 'rgba(255,170,60,0.13)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    } else if (w.id === 'cloudy') {
      ctx.save();
      ctx.fillStyle = 'rgba(120,130,150,0.13)';
      ctx.fillRect(0, 0, view.w, view.h);
      ctx.restore();
    }
  }

  function drawNight(ctx) {
    var t = FG.game.state.time / C.DAY_LENGTH;
    var a = 0;
    if (t >= C.NIGHT_START) { a = FG.clamp((t - C.NIGHT_START) / (1 - C.NIGHT_START) * 1.6, 0, 0.55); }
    else if (t <= C.NIGHT_END) { a = FG.clamp((C.NIGHT_END - t) / C.NIGHT_END * 0.55, 0, 0.55); }
    else if (t > C.NIGHT_START - 0.12) { a = (t - (C.NIGHT_START - 0.12)) / 0.12 * 0.12; }
    if (a <= 0.001) { return; }
    ctx.save();
    ctx.fillStyle = 'rgba(18,26,64,' + a.toFixed(3) + ')';
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  }

  function drawHover(ctx) {
    if (view.hover < 0) { return; }
    var r = tileRect(view.hover);
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, r.s * 0.035);
    roundRect(ctx, r.x - 2, r.y - 2, r.s + 4, r.s + 4, r.s * 0.18);
    ctx.stroke();
    ctx.restore();
  }

  FG.render = {
    view: view,
    init: function (canvas) {
      view.canvas = canvas;
      view.ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      if (window.visualViewport) { window.visualViewport.addEventListener('resize', resize); }
    },
    resize: resize,
    tileAt: tileAt,
    tileRect: tileRect,
    setHover: function (i) { view.hover = i; },

    draw: function (dt) {
      var ctx = view.ctx;
      var g = FG.game;
      if (!ctx || !g.state) { return; }
      view.time += dt;

      drawBackground(ctx);

      for (var i = 0; i < g.state.tiles.length; i++) {
        var t = g.state.tiles[i];
        var r = tileRect(i);
        if (t.unlocked && t.tilled) { drawSoil(ctx, t, r); }
        else { drawGrassTile(ctx, t, r); }
        if (t.crop) { drawPlant(ctx, t, r); }
        drawMeters(ctx, t, r);
      }

      for (var m = 0; m < g.moles.length; m++) {
        drawMole(ctx, g.moles[m], tileRect(g.moles[m].tile));
      }

      drawParticles(ctx);
      drawNight(ctx);
      drawWeather(ctx);
      drawHover(ctx);
      drawFloats(ctx);
    }
  };
})(window.FG);
