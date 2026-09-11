/* WebAudio로 즉석 합성하는 효과음 (오디오 파일 불필요) */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var ctx = null;
  var master = null;
  var enabled = true;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') { ctx.resume(); }
      return ctx;
    }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { return null; }
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
    return ctx;
  }

  function tone(freq, dur, type, gain, slideTo) {
    if (!enabled || !ensure()) { return; }
    var t = ctx.currentTime;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) { osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t + dur); }
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.5, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g); g.connect(master);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function noise(dur, filterFreq, gain, sweep) {
    if (!enabled || !ensure()) { return; }
    var t = ctx.currentTime;
    var len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) { data[i] = (Math.random() * 2 - 1) * (1 - i / len); }
    var src = ctx.createBufferSource();
    src.buffer = buf;
    var flt = ctx.createBiquadFilter();
    flt.type = 'bandpass';
    flt.frequency.setValueAtTime(filterFreq, t);
    if (sweep) { flt.frequency.linearRampToValueAtTime(sweep, t + dur); }
    flt.Q.value = 0.9;
    var g = ctx.createGain();
    g.gain.setValueAtTime(gain || 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.02);
  }

  var SFX = {
    till: function () { noise(0.22, 420, 0.5, 180); tone(120, 0.16, 'triangle', 0.25, 70); },
    plant: function () { tone(520, 0.12, 'sine', 0.4, 760); },
    water: function () { noise(0.36, 900, 0.35, 2600); },
    fert: function () { tone(660, 0.1, 'triangle', 0.3); setTimeout(function () { tone(880, 0.12, 'triangle', 0.3); }, 70); },
    whack: function (combo) {
      var base = 150 + (combo || 0) * 40;
      noise(0.14, 700, 0.6, 200);
      tone(base, 0.18, 'square', 0.32, base * 0.4);
    },
    harvest: function () { tone(660, 0.1, 'sine', 0.35); setTimeout(function () { tone(990, 0.16, 'sine', 0.3); }, 80); },
    sell: function () { tone(880, 0.08, 'triangle', 0.3); setTimeout(function () { tone(1320, 0.1, 'triangle', 0.28); }, 60); setTimeout(function () { tone(1760, 0.14, 'triangle', 0.24); }, 130); },
    buy: function () { tone(420, 0.09, 'square', 0.25, 620); },
    levelup: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.2, 'triangle', 0.3); }, i * 90); }); },
    mole: function () { tone(330, 0.1, 'sawtooth', 0.22, 260); },
    lose: function () { tone(240, 0.3, 'sawtooth', 0.3, 90); },
    error: function () { tone(180, 0.12, 'square', 0.2, 140); },
    newday: function () { [392, 523, 659].forEach(function (f, i) { setTimeout(function () { tone(f, 0.24, 'sine', 0.24); }, i * 110); }); }
  };

  FG.audio = {
    play: function (name, arg) { if (SFX[name]) { SFX[name](arg); } },
    unlock: function () { ensure(); },
    setEnabled: function (v) { enabled = !!v; if (v) { ensure(); } },
    isEnabled: function () { return enabled; }
  };
})(window.FG);
