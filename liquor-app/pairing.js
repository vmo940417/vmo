/* 오늘술상 — 음식 → 술 페어링 (구 '먹는거 먼저')
 * - 점수 엔진(pairing-engine.js)과 데이터(pairing-data.js)는 wine-sake-pairing 저장소에서 생성·검증한 파일
 * - 수록된 실제 제품(window.LIQUORS)을 페어링 스타일 54종 중 하나에 연결해 양방향으로 이어 준다
 *   · 음식 → 스타일 점수 → 그 스타일의 실제 제품
 *   · 제품 상세 → 어울리는 음식 TOP
 * app.js 의 공통 함수는 window.SulApp 으로 받아 쓴다 (app.js 가 마지막에 넣어 준다).
 */
(() => {
  const DATA = window.PAIRING_DATA;
  const engine = window.PairingEngine.createEngine(DATA);
  const STYLES = Object.fromEntries(DATA.beverages.map((b) => [b.id, b]));
  const TYPE_LABEL = { wine: "와인", sake: "사케", whisky: "위스키", brandy: "꼬냑", chinese: "중국술", korean: "전통주" };
  const FILTERS = [["all", "전체"], ...Object.entries(TYPE_LABEL)];
  const SUGGEST = ["삼겹살", "스테이크", "광어회", "해물파전", "동파육", "떡볶이", "후라이드 치킨", "초콜릿 케이크"];
  const AXES = [["acidity", "산도"], ["sweetness", "당도"], ["body", "바디"], ["tannin", "탄닌"], ["umami", "감칠맛"], ["aroma", "향 강도"], ["alcohol", "알코올"], ["oak", "오크"]];

  /* ── 실제 제품 → 페어링 스타일 ───────────────── */
  const has = (re, s) => re.test(s);
  function wineStyle(it, t) {
    if (has(/스파클링|샴페인|champagne|크레망|crémant|cava|까바|프로세코|prosecco|spumante|franciacorta/i, t)) return "champagne";
    if (has(/포트|\bport\b|porto|마데이라|madeira/i, t)) return "port";
    if (has(/셰리|sherry|jerez|헤레스/i, t)) return "fino_sherry";
    if (has(/소테른|sauternes|바르삭|토카이|tokaj|귀부|아이스바인|eiswein|ice ?wine/i, t)) return "sauternes";
    if (has(/로제|rosé|\brose\b/i, t)) return "rose";
    if (has(/모스카토|moscato|muscat/i, t)) return "riesling_offdry";
    if (has(/아마로네|amarone/i, t)) return "zinfandel";
    const g = String(it.ingredients?.[0]?.name || "").toLowerCase();
    const GRAPE = [
      [/cabernet|carmen|petit verdot/, "cabernet_sauvignon"], [/merlot/, "merlot"], [/pinot noir|spätburgunder/, "pinot_noir"],
      [/syrah|shiraz|pinotage/, "syrah"], [/grenache|garnacha|monastrell|mourv|cannonau/, "grenache"], [/malbec/, "malbec"],
      [/sangiovese|montepulciano|nero d|aglianico/, "sangiovese"], [/nebbiolo/, "nebbiolo"], [/tempranillo|touriga|tinta/, "tempranillo"],
      [/zinfandel|primitivo/, "zinfandel"], [/gamay/, "gamay"], [/barbera|corvina|dolcetto/, "barbera"],
      [/chardonnay/, /샤블리|chablis/i.test(t) ? "chablis" : "chardonnay_oaked"], [/sauvignon blanc|sémillon|semillon/, "sauvignon_blanc"],
      [/riesling/, /카비넷|kabinett|슈페트|spätlese|auslese|스위트|오프|feinherb/i.test(t) ? "riesling_offdry" : "riesling_dry"],
      [/gewürz|gewurz/, "gewurztraminer"], [/chenin/, "chenin_blanc"], [/albari/, "albarino"],
      [/pinot grigio|pinot gris|garganega|glera|vermentino/, "pinot_grigio"], [/viognier/, "viognier"], [/grüner|gruner/, "gruner_veltliner"],
      [/furmint/, "riesling_dry"],
    ];
    for (const [re, id] of GRAPE) if (re.test(g)) return id;
    const white = /화이트|white|blanc/i.test(t);
    if (white) return has(/부르고뉴|burgundy|bourgogne|뫼르소|몽라셰/i, t) ? "chardonnay_oaked" : has(/알자스|alsace|모젤|mosel/i, t) ? "riesling_dry" : "pinot_grigio";
    if (has(/부르고뉴|burgundy|bourgogne/i, t)) return "pinot_noir";
    if (has(/포므롤|pomerol|생테밀리옹|saint-émilion|st-emilion/i, t)) return "merlot";
    if (has(/메독|médoc|medoc|보르도|bordeaux|그랑 크뤼|세컨드/i, t)) return "cabernet_sauvignon";
    if (has(/남부 론|샤토네프|châteauneuf/i, t)) return "grenache";
    if (has(/론|rhône|rhone/i, t)) return "syrah";
    if (has(/리오하|rioja|리베라|ribera/i, t)) return "tempranillo";
    if (has(/키안티|chianti|토스카나|toscana|tuscany|브루넬로|brunello/i, t)) return "sangiovese";
    if (has(/바롤로|barolo|바르바레스코|barbaresco/i, t)) return "nebbiolo";
    return "merlot";
  }
  function sakeStyle(t) {
    if (has(/스파클링|발포|sparkling|スパークリング|泡/i, t)) return "sake_sparkling";
    if (has(/니고리|にごり|nigori|濁/i, t)) return "sake_nigori";
    if (has(/숙성|고슈|古酒|koshu/i, t)) return "sake_koshu";
    if (has(/키모토|기모토|야마하이|生酛|山廃|kimoto|yamahai/i, t)) return "sake_kimoto";
    if (has(/생주|생원주|나마|生酒|生原酒|\bnama/i, t)) return "sake_nama";
    if (has(/다이긴|大吟醸|daiginjo/i, t)) return "sake_junmai_daiginjo";
    if (has(/긴죠|긴조|吟醸|ginjo/i, t)) return has(/준마이|純米|junmai/i, t) ? "sake_junmai_ginjo" : "sake_ginjo";
    if (has(/혼죠조|혼조조|本醸造|honjozo|보통주|普通酒/i, t)) return "sake_honjozo";
    return "sake_junmai";
  }
  function whiskyStyle(t) {
    if (has(/피티드|피트|아일라|islay|peat|smok|라프로익|laphroaig|아드벡|ardbeg|라가불린|lagavulin|쿨 ?일라|caol ila|보모어|bowmore|탈리스커|talisker|포트 엘렌/i, t)) return "whisky_islay_peated";
    if (has(/버번|bourbon|테네시|tennessee|켄터키|kentucky|\brye\b|라이 위스키/i, t)) return "bourbon";
    if (has(/하이볼|highball|가쿠빈|角瓶|\btoki\b|토키/i, t)) return "japanese_highball";
    if (has(/셰리|sherry|올로로소|oloroso|\bpx\b|맥캘란|macallan|글렌드로낙|glendronach|글렌파클라스|glenfarclas|아벨라워|aberlour|달모어|dalmore/i, t)) return "whisky_sherry_cask";
    return "whisky_scotch_classic";
  }
  function styleOf(it) {
    if (!it) return null;
    const t = [it.style, it.ko, it.en, it.ja, it.zh, it.region].filter(Boolean).join(" ");
    switch (it.cat) {
      case "wine": return wineStyle(it, t);
      case "sake": return sakeStyle(t);
      case "whisky": return whiskyStyle(t);
      case "cognac": return has(/\bxo\b|xxo|엑스오|엑스트라|extra|최고급|hors d|나폴레옹|napoleon/i, t) ? "cognac_xo" : "cognac_vsop";
      case "baijiu":
        if (has(/장향|酱香|마오타이|茅台|moutai|랑주|郎酒|习酒|시주/i, t)) return "baijiu_sauce";
        if (has(/청향|清香|분주|汾酒|fenjiu|이과두|二锅头|erguotou/i, t)) return "baijiu_light";
        if (has(/황주|소흥|绍兴|黄酒|shaoxing|huangjiu/i, t)) return "huangjiu";
        return "baijiu_strong";
      case "soju": return has(/증류|distill|화요|안동|일품|오크|숙성/i, t) ? "soju_distilled" : "soju_diluted";
      case "makgeolli":
        if (has(/약주|청주|소곡주|법주/i, t)) return "yakju";
        if (has(/복분자|매실|오미자|과실|사과|와인/i, t)) return "bokbunja";
        if (has(/증류|소주/i, t)) return "soju_distilled";
        return "makgeolli";
      default: return null;
    }
  }
  // 스타일 → 술이 먼저야 분류 색(그라데이션·병 그림)
  const catOf = (b) => ({ wine: "wine", sake: "sake", whisky: "whisky", brandy: "cognac", chinese: "baijiu" }[b.type]
    || (b.id.startsWith("soju") ? "soju" : "makgeolli"));

  let PRODUCTS = null;
  function productsOf(styleId) {
    if (!PRODUCTS) {
      PRODUCTS = {};
      for (const it of window.LIQUORS) { const s = styleOf(it); if (s) (PRODUCTS[s] ||= []).push(it); }
      // 설명·평가가 있는 상세 항목을 먼저
      for (const k in PRODUCTS) PRODUCTS[k].sort((a, b) => (b.bulk ? 0 : 1) - (a.bulk ? 0 : 1) || (b.ratings?.length || 0) - (a.ratings?.length || 0));
    }
    return PRODUCTS[styleId] || [];
  }

  /* ── 공통 조각 ───────────────── */
  const A = () => window.SulApp;
  const scoreClass = (s) => (s >= 85 ? "s-great" : s >= 70 ? "s-good" : s >= 55 ? "s-ok" : "s-bad");
  const reasonsHtml = (rs, n) => `<ul class="p-reasons">${rs.slice(0, n).map((r) =>
    `<li class="${r.impact >= 0 ? "plus" : "minus"}"><b>${r.impact >= 0 ? "✓" : "✗"}</b>${A().esc(r.text)}</li>`).join("")}</ul>`;
  const recent = {
    get: () => A().store.get("pairRecent", []),
    add: (f) => A().store.set("pairRecent", [f, ...recent.get().filter((x) => x !== f)].slice(0, 12)),
  };
  const queryParam = (k) => new URLSearchParams(location.hash.split("?")[1] || "").get(k) || "";

  /* ── 페어링 탭: 음식 → 술 ───────────────── */
  function renderPair() {
    const { setChrome, view, esc, enc, go, $ } = A();
    setChrome("pair");
    const food = queryParam("f");
    const filter = queryParam("t") || "all";
    view.innerHTML = `
      <section class="home-hero pair-hero">
        <div class="eyebrow">Food First · 오늘술상</div>
        <h2>오늘 뭐 드세요?</h2>
        <p>음식을 입력하면 어울리는 와인·사케·위스키·꼬냑·중국술·전통주를 점수 순으로 골라 드려요</p>
        <form class="searchbox" id="pform" role="search">
          <span class="s-ico"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></span>
          <input id="pf" type="search" enterkeyhint="search" autocomplete="off" placeholder="예) 양념갈비, 연어 데리야끼" value="${esc(food)}" />
        </form>
        <div class="sug hidden" id="psug"></div>
      </section>
      <div id="pchips"></div>
      <div id="presult"></div>`;
    const input = $("#pf");
    const submit = (v) => { v = v.trim(); if (v) go(`#/pair?f=${enc(v)}`); };
    $("#pform").onsubmit = (e) => { e.preventDefault(); input.blur(); submit(input.value); };
    input.oninput = () => {
      const m = engine.searchFoods(input.value);
      const box = $("#psug");
      box.classList.toggle("hidden", !m.length || input.value.trim() === food);
      box.innerHTML = m.map((f) => `<div class="sug-row"><a href="#/pair?f=${enc(f.name_ko)}"><span>${esc(f.name_ko)}</span><small>${esc(f.cuisine)}</small></a></div>`).join("");
    };
    const rec = recent.get();
    const chipFoods = food ? rec.filter((x) => x !== food).slice(0, 8) : (rec.length ? rec.slice(0, 8) : SUGGEST);
    $("#pchips").innerHTML = chipFoods.length ? `
      <div class="section-title">${food || rec.length ? "최근 검색한 음식" : "이런 음식은 어때요?"}</div>
      <div class="chips">${chipFoods.map((f) => `<button class="chip" data-f="${esc(f)}">${esc(f)}</button>`).join("")}</div>` : "";
    $("#pchips").onclick = (e) => { const b = e.target.closest("[data-f]"); if (b) submit(b.dataset.f); };
    if (!food) { drawExample(); return; }

    recent.add(food);
    const res = engine.pair(food);
    const rows = res.results.filter((r) => filter === "all" || r.beverage.type === filter);
    $("#presult").innerHTML = `
      <div class="section-title">${esc(res.food.name_ko)}에 어울리는 술 <small>${rows.length}종</small></div>
      ${res.source === "keyword" ? `<p class="hint">등록되지 않은 음식이라 이름으로 맛을 추정했어요. 결과가 대략적일 수 있습니다.</p>` : ""}
      <div class="chips" id="pfilter">${FILTERS.map(([k, v]) => `<button class="chip ${k === filter ? "active" : ""}" data-t="${k}">${v}</button>`).join("")}</div>
      <div class="list">${rows.map((r, i) => styleRow(r, i + 1, res.food.name_ko)).join("")}</div>`;
    $("#pfilter").onclick = (e) => { const b = e.target.closest("[data-t]"); if (b) go(`#/pair?f=${enc(food)}${b.dataset.t === "all" ? "" : "&t=" + b.dataset.t}`); };
  }
  function drawExample() {
    const { $ } = A();
    const res = engine.pair("삼겹살");
    $("#presult").innerHTML = `
      <div class="section-title">예시 · 삼겹살 구이 <small>음식을 입력하면 바뀝니다</small></div>
      <div class="list">${res.results.slice(0, 5).map((r, i) => styleRow(r, i + 1, res.food.name_ko)).join("")}</div>`;
  }
  function styleRow(r, rank, foodName) {
    const { esc, enc } = A();
    const b = r.beverage, n = productsOf(b.id).length;
    return `<a class="item p-row" href="#/style/${enc(b.id)}?f=${enc(foodName)}">
      <span class="dot cat-${catOf(b)}">${window.bottle(catOf(b))}</span>
      <span class="meta"><div class="name"><span class="p-rank">${rank}</span>${esc(b.name_ko)}</div>
        <div class="sub">${esc(TYPE_LABEL[b.type])} · ${esc(b.category)} · ${b.abv}%${n ? ` · 수록 ${n}종` : ""}</div>
        ${r.reasons[0] ? `<div class="sub p-why ${r.reasons[0].impact >= 0 ? "plus" : "minus"}">${r.reasons[0].impact >= 0 ? "✓" : "✗"} ${esc(r.reasons[0].text)}</div>` : ""}</span>
      <span class="p-score ${scoreClass(r.score)}"><b>${r.score}</b>점</span></a>`;
  }

  /* ── 스타일 상세: 설명 + 궁합 + 실제 제품 ───────────────── */
  function renderStyle(id) {
    const { setChrome, view, esc, enc, $, pagedList } = A();
    const b = STYLES[id];
    if (!b) { setChrome("pair", null, true); view.innerHTML = `<div class="empty">스타일을 찾을 수 없습니다.</div>`; return; }
    const foodName = queryParam("f");
    const food = foodName ? engine.findFood(foodName) || engine.parseFood(foodName) : null;
    const pr = food ? engine.scorePairing(b, food) : null;
    const items = productsOf(id);
    setChrome("pair", esc(b.name_ko), true);
    const axes = AXES.filter(([k]) => (k === "tannin" ? b.type === "wine" : k === "oak" ? ["wine", "whisky", "brandy"].includes(b.type) : true));
    const stats = [["도수", `${b.abv}%`], pr && ["궁합", `${pr.score}점`], ["수록 제품", `${items.length}종`]].filter(Boolean);
    view.innerHTML = `
      <section class="hero cat-${catOf(b)}">
        <span class="glyph">${window.bottle(catOf(b))}</span>
        <span class="kind">${esc(TYPE_LABEL[b.type])} · ${esc(b.category)}</span>
        <h2>${esc(b.name_ko)}</h2><div class="names">${esc(b.name_en)}</div>
        <div class="stats" style="grid-template-columns:repeat(${stats.length},1fr)">${stats.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${esc(v)}</b></div>`).join("")}</div>
      </section>
      <div class="panel"><p>${esc(b.summary)}</p>
        <dl class="kv"><dt>대표 산지</dt><dd>${esc(b.regions.join(", "))}</dd><dt>마시는 법</dt><dd>${esc(b.serving_temp)}</dd></dl></div>
      ${pr ? `<div class="panel"><h3>${esc(food.name_ko)}와의 궁합 <span class="p-score inline ${scoreClass(pr.score)}"><b>${pr.score}</b>점</span></h3>${reasonsHtml(pr.reasons, 4)}</div>` : ""}
      <div class="panel"><h3>맛 프로파일 <small class="p-muted">0~5</small></h3>
        <div class="p-bars cat-text-${catOf(b)}">${axes.map(([k, l]) => `<div class="p-bar"><span>${l}</span><i><em style="width:${(b.profile[k] / 5) * 100}%"></em></i><span>${b.profile[k].toFixed(1)}</span></div>`).join("")}</div></div>
      <div class="section-title">이 스타일의 술 <small>${items.length ? `수록 ${items.length}종` : "수록 제품 없음"}</small></div>
      <div id="sprod"></div>
      ${items.length ? "" : `<p class="hint">대표 제품: ${esc(b.bottles.join(", "))}</p>`}`;
    if (items.length) pagedList($("#sprod"), items, 20);
  }

  /* ── 제품 상세 '페어링' 탭 위에 붙는 추천 음식 ───────────────── */
  function foodsPanel(it) {
    const id = styleOf(it);
    const b = id && STYLES[id];
    if (!b) return "";
    const { esc, enc } = A();
    const top = DATA.foods.map((f) => ({ f, ...engine.scorePairing(b, f) })).sort((x, y) => y.score - x.score).slice(0, 6);
    return `<div class="panel">
      <h3>어울리는 음식 <small class="p-muted">오늘술상 점수</small></h3>
      <p class="p-muted" style="font-size:13px">이 술은 <a href="#/style/${enc(b.id)}">${esc(b.name_ko)}</a> 스타일로 계산했어요.</p>
      <div class="p-foods">${top.map((x) => `<a class="p-food" href="#/style/${enc(b.id)}?f=${enc(x.f.name_ko)}">
        <span class="p-score ${scoreClass(x.score)}"><b>${x.score}</b>점</span>
        <span class="meta"><b>${esc(x.f.name_ko)}</b>${x.reasons[0] ? `<small>${x.reasons[0].impact >= 0 ? "✓" : "✗"} ${esc(x.reasons[0].text)}</small>` : ""}</span></a>`).join("")}</div>
      <a class="btn ghost block" style="margin-top:10px;display:block;text-align:center;text-decoration:none" href="#/pair">다른 음식으로 찾아보기</a>
    </div>`;
  }

  window.Pairing = { renderPair, renderStyle, foodsPanel, styleOf, engine };
})();
