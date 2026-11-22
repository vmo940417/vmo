// 생성 파일: wine-sake-pairing 저장소의 web/engine.js 복사본. 점수 규칙은 그쪽에서 고치고 web/build.py 로 대조한 뒤 다시 복사한다.
// server/app/engine/scoring.py 와 server/app/services/food_parser.py 의 브라우저용 이식본.
// 수치나 규칙을 바꾸면 양쪽을 함께 고치고 `python3 web/build.py` 로 결과 일치를 확인한다.
(function (root) {
  const BASE_SCORE = 62;
  const MAX_REASONS = 4;
  const SEAFOOD = new Set(['fish', 'raw_fish', 'shellfish']);
  const SPIRIT_ABV = 20;

  // Python round() 와 같은 결과: 이진 부동소수의 정확한 값 기준으로 반올림하고, 정확히 절반일 때만 짝수 쪽으로.
  function pyRound(x, digits = 0) {
    const exact = Math.abs(x).toFixed(digits + 30);
    const head = exact.slice(0, exact.length - 30);
    if (!/^50*$/.test(exact.slice(exact.length - 30))) return Number(x.toFixed(digits));
    const lastDigit = Number(head.replace('.', '').slice(-1));
    const magnitude = Number(head) + (lastDigit % 2 ? 10 ** -digits : 0);
    return Number((Math.sign(x) * magnitude).toFixed(digits));
  }

  function rules(tagLabels) {
    return [
      function weight(b, f) {
        const diff = b.body - f.intensity;
        if (Math.abs(diff) <= 0.75) return [6, '술과 음식의 무게감이 비슷해 서로를 덮지 않습니다'];
        const penalty = -5 * (Math.abs(diff) - 0.75);
        return diff > 0
          ? [penalty, '술이 음식보다 무거워 음식 맛을 덮을 수 있습니다']
          : [penalty, '음식 맛이 강해 술이 묻힐 수 있습니다'];
      },
      function acidVsFat(b, f, food, bev) {
        if (f.fat < 3) return null;
        // 도수 20% 이상 증류주는 알코올이 기름기를 씻어 주므로 산도가 낮아도 감점하지 않는다.
        const acidity = bev.abv >= SPIRIT_ABV ? Math.max(b.acidity, 3) : b.acidity;
        const delta = (acidity - 3) * f.fat * 0.9;
        if (delta > 0) return [delta, '높은 산도가 기름진 맛을 씻어줍니다'];
        if (delta < 0) return [delta, '산도가 낮아 기름진 맛이 입에 남습니다'];
        return null;
      },
      function foodAcid(b, f) {
        const gap = f.acid - b.acidity;
        if (gap > 0.5) return [-gap * 5, '음식의 신맛이 술보다 강해 술이 밋밋하게 느껴집니다'];
        if (f.acid >= 2.5 && b.acidity >= f.acid) return [4, '술의 산도가 음식의 신맛을 받쳐줍니다'];
        return null;
      },
      function tannin(b, f, food) {
        const t = b.tannin;
        if (t < 1) return null;
        if (food.protein === 'red_meat') return [t * (f.fat / 5) * 3.5, '탄닌이 붉은 고기의 단백질·지방과 만나 부드러워집니다'];
        if (food.protein === 'pork') return [t * (f.fat / 5) * 1.5, '탄닌이 돼지고기의 기름기를 잡아줍니다'];
        if (SEAFOOD.has(food.protein)) return [-t * 3.5, '탄닌이 해산물과 만나면 비리고 금속성 맛이 납니다'];
        return null;
      },
      function tanninVsCream(b, f, food) {
        if (b.tannin >= 2 && food.tags.includes('cream_sauce')) return [-b.tannin * 2.5, '탄닌이 크림소스와 부딪혀 떫게 느껴집니다'];
        return null;
      },
      function tanninVsSpiceBitter(b, f) {
        const t = b.tannin;
        if (t < 1) return null;
        const delta = -t * f.spice * 0.5 - t * Math.max(0, f.bitter - 1) * 0.6;
        return delta <= -2 ? [delta, '매운맛·쓴맛이 탄닌의 떫은맛을 키웁니다'] : null;
      },
      function spice(b, f) {
        if (f.spice < 2) return null;
        const sweet = (Math.min(b.sweetness, 3) - 1) * f.spice * 0.9;
        const alcohol = -Math.max(0, b.alcohol - 3) * f.spice * 1.2;
        const delta = sweet + alcohol;
        if (delta > 0) return [delta, '적당한 단맛과 낮은 알코올이 매운맛을 진정시킵니다'];
        if (alcohol < sweet) return [delta, '높은 알코올이 매운맛을 더 뜨겁게 만듭니다'];
        return [delta, '단맛이 부족해 매운맛이 그대로 느껴집니다'];
      },
      function foodSweetness(b, f, food) {
        const gap = f.sweet - b.sweetness;
        if (gap > 1.5) return [-(gap - 1.5) * 6, '음식이 술보다 달아 술이 시고 쓰게 느껴집니다'];
        if (f.sweet >= 3.5 && gap <= 0.5) return [6, '술이 음식만큼 달아 디저트와 조화를 이룹니다'];
        const excess = -gap - 1.5;
        if (excess > 0 && food.protein !== 'cheese' && !food.tags.includes('foie_gras')) {
          return [-excess * 5, '술이 너무 달아 식사 요리와 겉돕니다'];
        }
        return null;
      },
      function umami(b, f) {
        const reasons = [];
        let delta = 0;
        if (b.umami >= 2 && f.umami >= 3) {
          delta += b.umami * f.umami * 0.35;
          reasons.push('술과 음식의 감칠맛이 서로를 끌어올립니다');
        }
        if (b.tannin >= 2 && f.umami > 3) {
          delta -= b.tannin * (f.umami - 3) * 1.5;
          reasons.push('강한 감칠맛이 탄닌을 더 쓰게 만듭니다');
        }
        if (!reasons.length) return null;
        return [delta, delta >= 0 ? reasons[0] : reasons[reasons.length - 1]];
      },
      function salt(b, f) {
        if (f.salt < 3) return null;
        const k = f.salt - 2;
        const delta = (b.acidity - 2.5) * k + (f.salt >= 4 ? b.sweetness * k * 0.6 : 0);
        return delta > 1 ? [delta, '짠맛이 술의 산도·단맛과 균형을 이룹니다'] : null;
      },
      function oak(b, f, food) {
        if (b.oak < 2.5) return null;
        if (f.intensity <= 2.5) return [-(b.oak - 2) * (3 - f.intensity) * 2.5, '오크 향이 섬세한 음식을 덮습니다'];
        if (['grilled', 'bbq', 'steak'].some((t) => food.tags.includes(t))) return [b.oak * 1.2, '오크의 훈연·토스트 향이 불향과 어울립니다'];
        return null;
      },
      function classic(b, f, food, bev) {
        const matched = bev.pairs_with.filter((t) => food.tags.includes(t));
        if (!matched.length) return null;
        const labels = matched.slice(0, 3).map((t) => tagLabels[t] || t).join(', ');
        return [Math.min(matched.length * 7, 14), `검증된 조합: ${labels}`];
      },
    ];
  }

  function createEngine(data) {
    const RULES = rules(data.tagLabels);

    function scorePairing(bev, food) {
      let total = BASE_SCORE;
      const reasons = [];
      for (const rule of RULES) {
        const hit = rule(bev.profile, food.profile, food, bev);
        if (!hit) continue;
        const [delta, text] = hit;
        total += delta;
        if (Math.abs(delta) >= 1) reasons.push({ text, impact: pyRound(delta, 1) });
      }
      reasons.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
      return { score: Math.max(1, Math.min(99, pyRound(total))), reasons: reasons.slice(0, MAX_REASONS) };
    }

    function parseFood(name) {
      const text = name.toLowerCase();
      const profile = { ...data.keywordBase };
      let protein = null;
      const tags = [];
      for (const [words, kwProtein, kwTags, adjust] of data.keywords) {
        if (!words.some((w) => text.includes(w))) continue;
        if (kwProtein && protein === null) protein = kwProtein;
        for (const t of kwTags) if (!tags.includes(t)) tags.push(t);
        for (const [axis, d] of Object.entries(adjust)) profile[axis] += d;
      }
      for (const k of Object.keys(profile)) profile[k] = Math.max(0, Math.min(5, profile[k]));
      return { id: `custom:${name}`, name_ko: name, aliases: [], cuisine: '', protein: protein || 'vegetable', profile, tags };
    }

    const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
    const names = (item) => [item.name_ko, ...item.aliases, ...(item.name_en ? [item.name_en] : [])].map(norm);

    function findFood(query) {
      const q = norm(query);
      if (!q) return null;
      return data.foods.find((f) => names(f).includes(q))
        || data.foods.find((f) => names(f).some((n) => n.includes(q) || (n.length >= 3 && q.includes(n))))
        || null;
    }

    function searchFoods(query, limit = 8) {
      const q = norm(query);
      if (!q) return [];
      return data.foods.filter((f) => names(f).some((n) => n.includes(q))).slice(0, limit);
    }

    function findBeverage(query) {
      const q = norm(query);
      if (!q) return null;
      return data.beverages.find((b) => names(b).includes(q))
        || data.beverages.find((b) => names(b).some((n) => n.length >= 2 && (n.includes(q) || q.includes(n))))
        || null;
    }

    function pair(foodName) {
      const known = findFood(foodName);
      const food = known || parseFood(foodName.trim());
      const results = data.beverages
        .map((b) => ({ beverage: b, ...scorePairing(b, food) }))
        .sort((a, b) => b.score - a.score);
      return { food, source: known ? 'db' : 'keyword', results };
    }

    const priceUrl = (name) => 'https://www.wine-searcher.com/find/'
      + name.toLowerCase().split(/\s+/).filter(Boolean).map((w) => encodeURIComponent(w).replace(/'/g, '%27')).join('+');

    return { scorePairing, parseFood, findFood, searchFoods, findBeverage, pair, priceUrl };
  }

  root.PairingEngine = { createEngine, pyRound };
  // 앱(React Native)과 node 대조 스크립트에서 모듈로 불러올 수 있게 한다.
  if (typeof module === 'object' && module.exports) module.exports = root.PairingEngine;
})(typeof window !== 'undefined' ? window : globalThis);
