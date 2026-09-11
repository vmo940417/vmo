/* 게임 상태와 규칙 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  var C = FG.CONFIG;
  var listeners = {};

  function emit(name, data) {
    (listeners[name] || []).forEach(function (fn) { fn(data); });
  }

  /* 중앙에서 바깥쪽으로 퍼지는 개간 순서 */
  function unlockOrder() {
    var order = [];
    var cx = (C.COLS - 1) / 2, cy = (C.ROWS - 1) / 2;
    for (var i = 0; i < C.COLS * C.ROWS; i++) {
      var x = i % C.COLS, y = Math.floor(i / C.COLS);
      order.push({ i: i, d: Math.abs(x - cx) * 1.05 + Math.abs(y - cy) });
    }
    order.sort(function (a, b) { return a.d - b.d || a.i - b.i; });
    return order.map(function (o) { return o.i; });
  }

  var ORDER = unlockOrder();

  function newTile(i) {
    return {
      i: i, unlocked: false, tilled: false, moisture: 0,
      fert: false, crop: null, progress: 0, wilt: 0, hole: 0, ripeFlag: false
    };
  }

  function rollWeather() {
    var list = Object.keys(FG.WEATHERS).map(function (k) { return FG.WEATHERS[k]; });
    var total = list.reduce(function (s, w) { return s + w.weight; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < list.length; i++) {
      r -= list[i].weight;
      if (r <= 0) { return list[i].id; }
    }
    return 'sunny';
  }

  var game = {
    state: null,
    moles: [],
    particles: [],
    floats: [],
    combo: 0,
    comboTimer: 0,
    moleTimer: 12,
    sprinklerTimer: C.SPRINKLER_INTERVAL,
    catTimer: C.CAT_INTERVAL,
    saveTimer: C.AUTOSAVE_INTERVAL,
    lastMoleWarn: 0,

    on: function (name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
    },
    emit: emit,

    /* ---------- 생성 / 저장 ---------- */
    newGame: function () {
      var s = {
        version: 1,
        coins: C.START_COINS,
        level: 1,
        exp: 0,
        day: 1,
        time: C.DAY_LENGTH * 0.18,
        weather: 'sunny',
        tool: 'till',
        selectedCrop: 'carrot',
        sound: true,
        tiles: [],
        inventory: {},
        upgrades: { expand: 0 },
        stats: { harvested: 0, moles: 0, earned: 0, spent: 0, died: 0, eaten: 0 },
        market: FG.market.create(),
        savedAt: Date.now()
      };
      for (var i = 0; i < C.COLS * C.ROWS; i++) { s.tiles.push(newTile(i)); }
      for (var k = 0; k < C.START_TILES; k++) { s.tiles[ORDER[k]].unlocked = true; }
      this.state = s;
      this.moles = [];
      this.particles = [];
      this.floats = [];
      FG.audio.setEnabled(true);
      emit('change');
      return s;
    },

    save: function () {
      if (!this.state) { return; }
      this.state.savedAt = Date.now();
      FG.storage.set(C.SAVE_KEY, JSON.stringify(this.state));
    },

    load: function () {
      var raw = FG.storage.get(C.SAVE_KEY);
      if (!raw) { return false; }
      try {
        var s = JSON.parse(raw);
        if (!s || !s.tiles || s.tiles.length !== C.COLS * C.ROWS) { return false; }
        // 새 작물이 추가돼도 깨지지 않도록 시장 데이터 보정
        if (!s.market) { s.market = FG.market.create(); }
        FG.CROPS.forEach(function (c) {
          if (!s.market.crops[c.id]) {
            s.market.crops[c.id] = { factor: 1, prev: 1, history: [1], next: 1 };
          }
        });
        if (!s.stats) { s.stats = { harvested: 0, moles: 0, earned: 0, spent: 0, died: 0, eaten: 0 }; }
        if (!s.upgrades) { s.upgrades = { expand: 0 }; }
        this.state = s;
        this.moles = [];
        this.particles = [];
        this.floats = [];
        FG.audio.setEnabled(s.sound !== false);
        this.applyOffline(s.savedAt);
        emit('change');
        return true;
      } catch (e) {
        return false;
      }
    },

    reset: function () {
      FG.storage.remove(C.SAVE_KEY);
      this.newGame();
      this.save();
    },

    /* 게임을 꺼둔 동안의 성장(최대 2시간)을 반영 */
    applyOffline: function (savedAt) {
      if (!savedAt) { return; }
      var elapsed = Math.min(C.OFFLINE_MAX, (Date.now() - savedAt) / 1000);
      if (elapsed < 20) { return; }
      var steps = Math.floor(elapsed);
      for (var i = 0; i < steps; i++) { this.update(1, true); }
      this.floats = [];
      emit('toast', { text: '자리를 비운 사이 ' + Math.round(elapsed / 60) + '분이 흘렀습니다', kind: 'info' });
    },

    /* ---------- 조회 헬퍼 ---------- */
    weather: function () { return FG.WEATHERS[this.state.weather] || FG.WEATHERS.sunny; },
    isNight: function () {
      var t = this.state.time / C.DAY_LENGTH;
      return t >= C.NIGHT_START || t <= C.NIGHT_END;
    },
    has: function (id) { return !!this.state.upgrades[id]; },
    tile: function (i) { return this.state.tiles[i]; },
    moleAt: function (i) {
      for (var k = 0; k < this.moles.length; k++) {
        if (this.moles[k].tile === i && !this.moles[k].done) { return this.moles[k]; }
      }
      return null;
    },
    unlockedCount: function () {
      return this.state.tiles.filter(function (t) { return t.unlocked; }).length;
    },
    inventoryCount: function () {
      var s = this.state, n = 0;
      Object.keys(s.inventory).forEach(function (k) {
        n += (s.inventory[k].normal || 0) + (s.inventory[k].gold || 0);
      });
      return n;
    },

    /* ---------- 효과 ---------- */
    float: function (tileIndex, text, color) {
      this.floats.push({ tile: tileIndex, text: text, color: color || '#fff', t: 0, life: 1.15 });
    },
    burst: function (tileIndex, color, count, kind) {
      for (var i = 0; i < (count || 8); i++) {
        this.particles.push({
          tile: tileIndex,
          x: FG.rand(-0.3, 0.3), y: FG.rand(-0.2, 0.2),
          vx: FG.rand(-0.7, 0.7), vy: FG.rand(-1.4, -0.3),
          t: 0, life: FG.rand(0.4, 0.85), color: color, kind: kind || 'dot'
        });
      }
    },
    toast: function (text, kind) { emit('toast', { text: text, kind: kind || 'info' }); },

    /* ---------- 행동 ---------- */
    useTool: function (i, toolId, isDrag) {
      var t = this.state.tiles[i];
      if (!t) { return; }
      var mole = this.moleAt(i);

      // 두더지가 있으면 무엇을 하든 먼저 반응한다
      if (mole) {
        if (toolId === 'hammer') { this.whack(mole, false); return; }
        this.scare(mole);
        return;
      }

      switch (toolId) {
        case 'till': this.till(t, isDrag); break;
        case 'seed': this.plant(t); break;
        case 'water': this.water(t, isDrag); break;
        case 'fert': this.fertilize(t, isDrag); break;
        case 'harvest': this.harvest(t, isDrag); break;
        case 'hammer':
          if (!isDrag) { this.float(i, '헛스윙!', '#cbd5e1'); FG.audio.play('error'); }
          break;
      }
    },

    till: function (t, isDrag) {
      if (!t.unlocked) {
        if (!isDrag) { this.toast('아직 개간하지 않은 땅입니다. 상점에서 밭을 확장하세요.', 'warn'); FG.audio.play('error'); }
        return;
      }
      if (t.crop) {
        if (!isDrag) { this.toast('작물이 자라는 중입니다.', 'warn'); FG.audio.play('error'); }
        return;
      }
      if (t.tilled && !t.hole) { return; }
      t.tilled = true;
      t.hole = 0;
      this.burst(t.i, '#8a5a33', 9, 'dot');
      FG.audio.play('till');
      emit('change');
    },

    plant: function (t) {
      var s = this.state;
      var crop = FG.CROP_BY_ID[s.selectedCrop];
      if (!t.unlocked) { this.toast('먼저 밭을 확장해야 합니다.', 'warn'); FG.audio.play('error'); return; }
      if (!t.tilled) { this.toast('먼저 ⛏️ 경작으로 땅을 갈아주세요.', 'warn'); FG.audio.play('error'); return; }
      if (t.crop) { this.toast('이미 심어져 있습니다.', 'warn'); FG.audio.play('error'); return; }
      if (!crop || crop.level > s.level) { this.toast('레벨이 부족한 작물입니다.', 'warn'); FG.audio.play('error'); return; }
      if (s.coins < crop.seed) { this.toast('코인이 부족합니다. (씨앗 ' + FG.fmt(crop.seed) + '원)', 'warn'); FG.audio.play('error'); return; }

      s.coins -= crop.seed;
      s.stats.spent += crop.seed;
      t.crop = crop.id;
      t.progress = 0;
      t.fert = false;
      t.wilt = 0;
      t.hole = 0;
      t.ripeFlag = false;
      this.float(t.i, '-' + FG.fmt(crop.seed), '#fca5a5');
      this.burst(t.i, crop.flower, 6, 'leaf');
      FG.audio.play('plant');
      emit('change');
    },

    waterTile: function (t, amount) {
      if (!t.unlocked || !t.tilled) { return false; }
      t.moisture = FG.clamp(t.moisture + amount, 0, 1);
      return true;
    },

    water: function (t, isDrag) {
      if (!t.unlocked || !t.tilled) {
        if (!isDrag) { FG.audio.play('error'); }
        return;
      }
      this.waterTile(t, C.WATER_PER_USE);
      this.burst(t.i, '#7dd3fc', 7, 'drop');
      if (this.has('wideWater')) {
        var x = t.i % C.COLS, y = Math.floor(t.i / C.COLS), self = this;
        for (var dy = -1; dy <= 1; dy++) {
          for (var dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) { continue; }
            var nx = x + dx, ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= C.COLS || ny >= C.ROWS) { continue; }
            var n = self.state.tiles[ny * C.COLS + nx];
            if (self.waterTile(n, C.NEIGHBOR_WATER)) { self.burst(n.i, '#7dd3fc', 3, 'drop'); }
          }
        }
      }
      if (!isDrag) { FG.audio.play('water'); }
      emit('change');
    },

    fertilize: function (t, isDrag) {
      var s = this.state;
      if (!t.crop) { if (!isDrag) { this.toast('작물이 있는 밭에만 줄 수 있습니다.', 'warn'); FG.audio.play('error'); } return; }
      if (t.fert) { if (!isDrag) { this.toast('이미 비료를 준 작물입니다.', 'warn'); FG.audio.play('error'); } return; }
      if (s.coins < C.FERT_COST) { if (!isDrag) { this.toast('코인이 부족합니다. (비료 ' + C.FERT_COST + '원)', 'warn'); FG.audio.play('error'); } return; }
      s.coins -= C.FERT_COST;
      s.stats.spent += C.FERT_COST;
      t.fert = true;
      this.float(t.i, '비료!', '#a3e635');
      this.burst(t.i, '#a3e635', 10, 'sparkle');
      FG.audio.play('fert');
      emit('change');
    },

    harvest: function (t, isDrag) {
      var s = this.state;
      if (!t.crop || t.progress < 1) {
        if (!isDrag) { FG.audio.play('error'); }
        return;
      }
      var crop = FG.CROP_BY_ID[t.crop];
      var qty = FG.randInt(crop.yield[0], crop.yield[1]) + (t.fert ? C.FERT_BONUS_YIELD : 0);
      var goldChance = t.fert ? (C.GOLD_CHANCE + (this.has('goodFert') ? 0.22 : 0)) : 0.02;
      var gold = 0;
      for (var i = 0; i < qty; i++) { if (Math.random() < goldChance) { gold++; } }
      var normal = qty - gold;

      this.addItem(crop.id, 'normal', normal);
      this.addItem(crop.id, 'gold', gold);
      s.stats.harvested += qty;

      t.crop = null;
      t.progress = 0;
      t.fert = false;
      t.wilt = 0;
      t.ripeFlag = false;
      t.moisture = Math.max(0, t.moisture - 0.25);

      this.float(t.i, crop.emoji + ' x' + qty + (gold ? ' ✨' + gold : ''), '#fde68a');
      this.burst(t.i, crop.color, 12, 'sparkle');
      this.addExp(crop.exp + gold * 3);
      FG.audio.play('harvest');
      emit('change');
    },

    harvestAll: function () {
      var self = this, n = 0;
      this.state.tiles.forEach(function (t) {
        if (t.crop && t.progress >= 1 && !self.moleAt(t.i)) { self.harvest(t, true); n++; }
      });
      if (n) { FG.audio.play('harvest'); this.toast(n + '칸을 한 번에 수확했습니다.', 'good'); }
      else { this.toast('수확할 작물이 없습니다.', 'warn'); FG.audio.play('error'); }
    },

    waterAll: function () {
      var self = this, n = 0;
      this.state.tiles.forEach(function (t) {
        if (t.unlocked && t.tilled && t.moisture < 0.95) {
          self.waterTile(t, C.WATER_PER_USE);
          self.burst(t.i, '#7dd3fc', 4, 'drop');
          n++;
        }
      });
      if (n) { FG.audio.play('water'); } else { FG.audio.play('error'); }
      emit('change');
    },

    /* ---------- 두더지 ---------- */
    moleInterval: function () {
      var s = this.state;
      var base = Math.max(C.MOLE_MIN_INTERVAL, C.MOLE_BASE_INTERVAL - s.level * 0.7);
      if (this.has('scarecrow')) { base *= 1.6; }
      base /= this.weather().mole;
      return base * FG.rand(0.75, 1.3);
    },

    spawnMole: function () {
      var candidates = this.state.tiles.filter(function (t) {
        return t.crop && t.progress > 0.05;
      });
      if (!candidates.length) { return; }
      var self = this;
      candidates = candidates.filter(function (t) { return !self.moleAt(t.i); });
      if (!candidates.length) { return; }
      var t = FG.pick(candidates);
      var life = Math.max(C.MOLE_MIN_LIFE, C.MOLE_BASE_LIFE - this.state.level * 0.25);
      this.moles.push({ tile: t.i, t: 0, life: life, done: false, hit: 0, pop: 0 });
      FG.audio.play('mole');
      emit('mole', t.i);
    },

    whack: function (mole, auto) {
      var s = this.state;
      mole.done = true;
      mole.hit = 1;
      this.combo = Math.min(C.MOLE_COMBO_MAX, this.combo + 1);
      this.comboTimer = C.MOLE_COMBO_WINDOW;
      var mult = auto ? 1 : this.combo;
      var reward = Math.round((C.MOLE_REWARD + s.level * 2) * mult);
      s.coins += reward;
      s.stats.earned += reward;
      s.stats.moles += 1;
      this.addExp(3 + s.level);
      this.float(mole.tile, '+' + FG.fmt(reward) + (mult > 1 ? ' x' + mult : ''), '#fcd34d');
      this.burst(mole.tile, '#8b5e3c', 14, 'dot');
      FG.audio.play('whack', this.combo);
      emit('change');
    },

    scare: function (mole) {
      mole.done = true;
      mole.hit = 0.5;
      this.float(mole.tile, '쫓아냄', '#cbd5e1');
      this.burst(mole.tile, '#8b5e3c', 6, 'dot');
      FG.audio.play('whack', 0);
    },

    moleEats: function (mole) {
      var t = this.state.tiles[mole.tile];
      mole.done = true;
      if (!t || !t.crop) { return; }
      var crop = FG.CROP_BY_ID[t.crop];
      var wasRipe = t.progress >= 1;
      t.crop = null;
      t.progress = 0;
      t.fert = false;
      t.wilt = 0;
      t.hole = 1;
      this.state.stats.eaten += 1;
      this.float(mole.tile, '먹혔다!', '#fca5a5');
      this.burst(mole.tile, '#7c4a2d', 12, 'dot');
      this.toast('두더지가 ' + crop.name + (wasRipe ? '를 통째로 먹어치웠습니다!' : ' 싹을 파먹었습니다!'), 'bad');
      FG.audio.play('lose');
      emit('change');
    },

    /* ---------- 창고 / 시장 ---------- */
    addItem: function (cropId, quality, qty) {
      if (qty <= 0) { return; }
      var inv = this.state.inventory;
      if (!inv[cropId]) { inv[cropId] = { normal: 0, gold: 0 }; }
      inv[cropId][quality] = (inv[cropId][quality] || 0) + qty;
    },

    priceOf: function (cropId, quality) {
      return FG.market.price(this.state.market, cropId, quality, this.has('analyst'));
    },

    sell: function (cropId, quality, qty) {
      var inv = this.state.inventory[cropId];
      if (!inv) { return 0; }
      var have = inv[quality] || 0;
      var n = Math.min(have, qty);
      if (n <= 0) { return 0; }
      var unit = this.priceOf(cropId, quality);
      var total = unit * n;
      inv[quality] -= n;
      this.state.coins += total;
      this.state.stats.earned += total;
      this.addExp(Math.max(1, Math.round(total / 40)));
      FG.audio.play('sell');
      emit('change');
      return total;
    },

    sellAll: function () {
      var self = this, total = 0;
      Object.keys(this.state.inventory).forEach(function (id) {
        total += self.sell(id, 'gold', self.state.inventory[id].gold || 0);
        total += self.sell(id, 'normal', self.state.inventory[id].normal || 0);
      });
      if (total > 0) { this.toast('전량 판매: +' + FG.fmt(total) + '원', 'good'); }
      else { this.toast('팔 작물이 없습니다.', 'warn'); FG.audio.play('error'); }
      return total;
    },

    /* ---------- 상점 ---------- */
    upgradeCost: function (id) {
      var up = FG.UPGRADES.filter(function (u) { return u.id === id; })[0];
      if (!up) { return Infinity; }
      if (!up.repeat) { return up.base; }
      var owned = this.state.upgrades[id] || 0;
      return Math.round(up.base * Math.pow(up.growth, owned));
    },

    canBuy: function (id) {
      var up = FG.UPGRADES.filter(function (u) { return u.id === id; })[0];
      if (!up) { return false; }
      if (!up.repeat && this.state.upgrades[id]) { return false; }
      if (id === 'expand' && this.unlockedCount() >= C.COLS * C.ROWS) { return false; }
      return this.state.coins >= this.upgradeCost(id);
    },

    buyUpgrade: function (id) {
      if (!this.canBuy(id)) { FG.audio.play('error'); return false; }
      var cost = this.upgradeCost(id);
      var s = this.state;
      s.coins -= cost;
      s.stats.spent += cost;
      if (id === 'expand') {
        s.upgrades.expand = (s.upgrades.expand || 0) + 1;
        var opened = 0;
        for (var k = 0; k < ORDER.length && opened < C.TILES_PER_EXPANSION; k++) {
          var t = s.tiles[ORDER[k]];
          if (!t.unlocked) { t.unlocked = true; this.burst(t.i, '#86efac', 10, 'sparkle'); opened++; }
        }
        this.toast('밭 ' + opened + '칸을 개간했습니다!', 'good');
      } else {
        s.upgrades[id] = 1;
        var up = FG.UPGRADES.filter(function (u) { return u.id === id; })[0];
        this.toast(up.emoji + ' ' + up.name + ' 구매 완료!', 'good');
      }
      FG.audio.play('buy');
      emit('change');
      return true;
    },

    /* ---------- 레벨 ---------- */
    addExp: function (n) {
      var s = this.state;
      s.exp += n;
      var guard = 0;
      while (s.exp >= FG.expToNext(s.level) && guard++ < 50) {
        s.exp -= FG.expToNext(s.level);
        s.level += 1;
        var unlocked = FG.CROPS.filter(function (c) { return c.level === s.level; });
        var msg = '레벨 ' + s.level + ' 달성!';
        if (unlocked.length) {
          msg += ' ' + unlocked.map(function (c) { return c.emoji + ' ' + c.name; }).join(', ') + ' 해금';
        }
        this.toast(msg, 'good');
        FG.audio.play('levelup');
        emit('levelup', s.level);
      }
    },

    /* ---------- 메인 업데이트 ---------- */
    update: function (dt, simulated) {
      var s = this.state;
      if (!s) { return; }
      var w = this.weather();
      var night = this.isNight();
      var self = this;

      // 시간 / 하루 경과
      s.time += dt;
      while (s.time >= C.DAY_LENGTH) {
        s.time -= C.DAY_LENGTH;
        s.day += 1;
        FG.market.advance(s.market);
        s.weather = rollWeather();
        if (!simulated) {
          var wv = this.weather();
          this.toast(s.day + '일차 — ' + wv.emoji + ' ' + wv.name, 'info');
          FG.audio.play('newday');
          emit('newday', s.day);
        }
      }

      // 밭 상태
      for (var i = 0; i < s.tiles.length; i++) {
        var t = s.tiles[i];
        if (!t.unlocked || !t.tilled) { continue; }
        if (w.rain) { t.moisture = Math.min(1, t.moisture + w.rain * dt); }
        t.moisture = Math.max(0, t.moisture - C.DRY_RATE * w.dry * dt);
        if (t.hole > 0) { t.hole = Math.max(0, t.hole - dt * 0.05); }
        if (!t.crop) { continue; }

        var crop = FG.CROP_BY_ID[t.crop];
        if (!crop) { t.crop = null; continue; }

        var rate = w.growth
          * (night ? C.NIGHT_GROWTH : 1)
          * (t.moisture > 0.02 ? 1 : C.DRY_GROWTH)
          * (t.fert ? C.FERT_GROWTH : 1);

        if (t.progress < 1) {
          t.progress = Math.min(1, t.progress + (rate / crop.grow) * dt);
          if (t.progress >= 1 && !t.ripeFlag) {
            t.ripeFlag = true;
            if (!simulated) {
              this.float(t.i, '수확 가능!', '#bbf7d0');
              this.burst(t.i, crop.color, 6, 'sparkle');
            }
          }
        }

        if (t.moisture <= 0.001) {
          // 게임을 꺼둔 동안(오프라인 보정)에는 성장만 멈출 뿐 죽지는 않는다
          if (!simulated) { t.wilt = Math.min(1, t.wilt + C.WILT_RATE * dt); }
          if (t.wilt >= 1) {
            t.crop = null; t.progress = 0; t.fert = false; t.wilt = 0; t.ripeFlag = false;
            s.stats.died += 1;
            if (!simulated) {
              this.toast(crop.name + '이(가) 말라 죽었습니다. 물을 잊지 마세요!', 'bad');
              FG.audio.play('lose');
            }
          }
        } else {
          t.wilt = Math.max(0, t.wilt - C.WILT_RECOVER * dt);
        }
      }

      // 스프링클러
      if (this.has('sprinkler')) {
        this.sprinklerTimer -= dt;
        if (this.sprinklerTimer <= 0) {
          this.sprinklerTimer = C.SPRINKLER_INTERVAL;
          s.tiles.forEach(function (t) {
            if (t.unlocked && t.tilled) {
              self.waterTile(t, C.SPRINKLER_AMOUNT);
              if (!simulated) { self.burst(t.i, '#7dd3fc', 3, 'drop'); }
            }
          });
        }
      }

      if (simulated) { return; }  // 오프라인 보정에서는 두더지/이펙트 생략

      // 두더지
      this.moleTimer -= dt;
      if (this.moleTimer <= 0) {
        this.moleTimer = this.moleInterval();
        this.spawnMole();
      }
      for (var m = this.moles.length - 1; m >= 0; m--) {
        var mole = this.moles[m];
        mole.pop = Math.min(1, mole.pop + dt * 5);
        if (mole.done) {
          mole.hit -= dt * 2.5;
          if (mole.hit <= 0) { this.moles.splice(m, 1); }
          continue;
        }
        var tile = s.tiles[mole.tile];
        if (!tile || !tile.crop) { mole.done = true; mole.hit = 0.3; continue; }
        mole.t += dt;
        if (mole.t >= mole.life) { this.moleEats(mole); mole.hit = 0.4; }
      }

      // 밭고양이
      if (this.has('cat')) {
        this.catTimer -= dt;
        if (this.catTimer <= 0) {
          this.catTimer = C.CAT_INTERVAL;
          var target = this.moles.filter(function (x) { return !x.done && x.t > 1.5; })[0];
          if (target && Math.random() < 0.6) {
            this.whack(target, true);
            this.float(target.tile, '🐈 냥!', '#fde68a');
          }
        }
      }

      // 콤보
      if (this.comboTimer > 0) {
        this.comboTimer -= dt;
        if (this.comboTimer <= 0) { this.combo = 0; }
      }

      // 이펙트
      for (var p = this.particles.length - 1; p >= 0; p--) {
        var pt = this.particles[p];
        pt.t += dt;
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vy += 2.6 * dt;
        if (pt.t >= pt.life) { this.particles.splice(p, 1); }
      }
      for (var f = this.floats.length - 1; f >= 0; f--) {
        this.floats[f].t += dt;
        if (this.floats[f].t >= this.floats[f].life) { this.floats.splice(f, 1); }
      }

      // 자동 저장
      this.saveTimer -= dt;
      if (this.saveTimer <= 0) { this.saveTimer = C.AUTOSAVE_INTERVAL; this.save(); }
    }
  };

  FG.game = game;
})(window.FG);
