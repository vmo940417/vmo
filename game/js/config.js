/* 농장 게임 - 기본 수치/데이터 정의 */
window.FG = window.FG || {};
(function (FG) {
  'use strict';

  FG.CONFIG = {
    COLS: 6,
    ROWS: 5,
    START_TILES: 6,          // 시작 시 열려 있는 밭 칸 수
    TILES_PER_EXPANSION: 3,  // 확장 1회당 추가되는 칸 수
    START_COINS: 120,

    DAY_LENGTH: 150,         // 하루(초). 실제 시간 기준
    NIGHT_START: 0.78,       // 하루의 78% 지점부터 밤
    NIGHT_END: 0.06,
    NIGHT_GROWTH: 0.55,      // 밤에는 성장 속도 감소

    DRY_RATE: 0.022,         // 초당 수분 감소량(맑음 기준). 가득 찬 수분이 약 45초 유지
    DRY_GROWTH: 0.12,        // 수분 0일 때 성장 배율
    WILT_RATE: 0.01,         // 수분 0일 때 초당 시듦 진행 (완전 방치 시 약 100초 뒤 고사)
    WILT_RECOVER: 0.12,      // 물 주면 회복
    WATER_PER_USE: 0.65,     // 물 한 번에 차오르는 수분
    NEIGHBOR_WATER: 0.45,    // 광역 물뿌리개가 주변 칸에 주는 양

    FERT_COST: 18,           // 비료 1회 비용
    FERT_GROWTH: 1.7,        // 비료 성장 배율
    FERT_BONUS_YIELD: 1,     // 비료 수확량 보너스
    GOLD_CHANCE: 0.18,       // 비료 준 작물의 황금 등급 확률
    GOLD_MULT: 2.4,          // 황금 등급 판매가 배율

    MOLE_BASE_INTERVAL: 20,  // 두더지 등장 간격(초) 기준값
    MOLE_MIN_INTERVAL: 7,
    MOLE_BASE_LIFE: 7.0,     // 두더지가 작물을 먹기까지 걸리는 시간
    MOLE_MIN_LIFE: 3.4,
    MOLE_COMBO_WINDOW: 3.2,  // 콤보 유지 시간
    MOLE_COMBO_MAX: 5,
    MOLE_REWARD: 9,          // 기본 격퇴 보상

    SPRINKLER_INTERVAL: 22,  // 스프링클러 작동 주기(초)
    SPRINKLER_AMOUNT: 0.4,
    CAT_INTERVAL: 9,         // 밭고양이가 두더지를 노리는 주기(초)

    OFFLINE_MAX: 2 * 3600,   // 오프라인 진행 최대 인정 시간(초)
    AUTOSAVE_INTERVAL: 6,
    SAVE_KEY: 'fg.farm.save.v1'
  };

  /* 작물 정의
   * grow: 총 성장 시간(초), seed: 씨앗 가격, price: 기준 판매가
   * yield: [최소, 최대] 수확량, level: 해금 레벨 */
  FG.CROPS = [
    { id: 'carrot',     name: '당근',     emoji: '🥕', seed: 12,  price: 26,  grow: 42,  yield: [2, 3], level: 1, exp: 4,  color: '#f2833a', flower: '#7cc24a' },
    { id: 'potato',     name: '감자',     emoji: '🥔', seed: 20,  price: 44,  grow: 62,  yield: [2, 4], level: 1, exp: 6,  color: '#c99a5b', flower: '#d8d2a8' },
    { id: 'tomato',     name: '토마토',   emoji: '🍅', seed: 34,  price: 78,  grow: 88,  yield: [2, 4], level: 2, exp: 9,  color: '#e2453c', flower: '#ffe066' },
    { id: 'corn',       name: '옥수수',   emoji: '🌽', seed: 52,  price: 118, grow: 112, yield: [2, 3], level: 3, exp: 13, color: '#f5c542', flower: '#e8e07a' },
    { id: 'strawberry', name: '딸기',     emoji: '🍓', seed: 78,  price: 178, grow: 138, yield: [3, 5], level: 4, exp: 18, color: '#ef3b5b', flower: '#fff0f3' },
    { id: 'pumpkin',    name: '호박',     emoji: '🎃', seed: 120, price: 276, grow: 170, yield: [2, 3], level: 5, exp: 24, color: '#ef8c25', flower: '#f5d76e' },
    { id: 'watermelon', name: '수박',     emoji: '🍉', seed: 180, price: 420, grow: 205, yield: [2, 3], level: 6, exp: 32, color: '#2f9e58', flower: '#f7f7c8' },
    { id: 'sunflower',  name: '해바라기', emoji: '🌻', seed: 250, price: 580, grow: 240, yield: [2, 4], level: 7, exp: 42, color: '#f6c026', flower: '#ffe873' },
    { id: 'goldapple',  name: '황금사과', emoji: '🍎', seed: 420, price: 980, grow: 300, yield: [2, 3], level: 9, exp: 60, color: '#e8b419', flower: '#fff3b0' }
  ];

  FG.CROP_BY_ID = {};
  FG.CROPS.forEach(function (c) { FG.CROP_BY_ID[c.id] = c; });

  /* 도구 (하단 툴바) */
  FG.TOOLS = [
    { id: 'till',    name: '경작',   emoji: '⛏️', hint: '풀밭을 갈아 밭으로 만듭니다' },
    { id: 'seed',    name: '씨앗',   emoji: '🌱', hint: '밭에 씨를 뿌립니다 (탭하면 작물 선택)' },
    { id: 'water',   name: '물',     emoji: '💧', hint: '수분을 채웁니다. 드래그하면 여러 칸' },
    { id: 'fert',    name: '비료',   emoji: '🧪', hint: '성장 속도와 수확량이 올라갑니다' },
    { id: 'hammer',  name: '망치',   emoji: '🔨', hint: '두더지를 때려잡습니다' },
    { id: 'harvest', name: '수확',   emoji: '🧺', hint: '다 자란 작물을 거둡니다' }
  ];

  /* 상점 업그레이드 */
  FG.UPGRADES = [
    { id: 'expand',    name: '밭 확장',        emoji: '🚜', repeat: true,  base: 150, growth: 1.55,
      desc: '밭 ' + FG.CONFIG.TILES_PER_EXPANSION + '칸을 추가로 개간합니다.' },
    { id: 'wideWater', name: '광역 물뿌리개',  emoji: '🚿', repeat: false, base: 650,
      desc: '물을 줄 때 주변 8칸에도 수분이 일부 들어갑니다.' },
    { id: 'scarecrow', name: '허수아비',       emoji: '🎏', repeat: false, base: 900,
      desc: '두더지 출현 간격이 60% 길어집니다.' },
    { id: 'sprinkler', name: '자동 스프링클러', emoji: '⛲', repeat: false, base: 1400,
      desc: '일정 주기마다 모든 밭에 자동으로 물을 줍니다.' },
    { id: 'goodFert',  name: '고급 비료',      emoji: '✨', repeat: false, base: 1900,
      desc: '비료 준 작물의 황금 등급 확률이 크게 올라갑니다.' },
    { id: 'cat',       name: '밭고양이',       emoji: '🐈', repeat: false, base: 2600,
      desc: '두더지를 발견하면 가끔 알아서 쫓아냅니다.' },
    { id: 'analyst',   name: '시장 분석 리포트', emoji: '📈', repeat: false, base: 3400,
      desc: '시장에 내일 시세 전망이 표시되고, 판매가가 5% 올라갑니다.' }
  ];

  /* 날씨 */
  FG.WEATHERS = {
    sunny:   { id: 'sunny',   name: '맑음',   emoji: '☀️', growth: 1.0,  dry: 1.0, rain: 0,     mole: 1.0, weight: 42 },
    cloudy:  { id: 'cloudy',  name: '흐림',   emoji: '☁️', growth: 0.9,  dry: 0.6, rain: 0,     mole: 1.0, weight: 24 },
    rain:    { id: 'rain',    name: '비',     emoji: '🌧️', growth: 1.1,  dry: 0.0, rain: 0.075, mole: 1.25, weight: 22 },
    drought: { id: 'drought', name: '가뭄',   emoji: '🔥', growth: 0.95, dry: 2.3, rain: 0,     mole: 1.1, weight: 12 }
  };

  FG.expToNext = function (level) {
    return Math.floor(70 * Math.pow(level, 1.45));
  };

  FG.unlockedCrops = function (level) {
    return FG.CROPS.filter(function (c) { return c.level <= level; });
  };
})(window.FG);
