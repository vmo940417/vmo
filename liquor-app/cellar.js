/* 술이 먼저야 — 나의 와인셀러
 * 보유(병) · 시음 적기 · 오늘 뭘 열까(음식 → 보유 와인) · 시음 기록 · 백업
 * 데이터는 이 기기 localStorage("sulsajeon.cellar")에만 저장된다. */
export function setupCellar(ctx) {
  const { store, $, view, esc, enc, toast, go, setChrome, bottle, CATS, findById, search, usdOf, fmtUSDv, fxRate, shrink, cse, cseOn } = ctx;
  const KEY = "cellar";
  const load = () => { const c = store.get(KEY, null) || {}; return { bottles: c.bottles || [], log: c.log || [] }; };
  let C = load();
  const save = () => { try { localStorage.setItem("sulsajeon." + KEY, JSON.stringify(C)); return true; } catch { toast("저장 공간이 부족해요 — 라벨 사진을 줄이거나 백업 후 정리해 주세요"); return false; } };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const YEAR = () => new Date().getFullYear();
  const today = () => new Date().toISOString().slice(0, 10);
  const itemOf = (b) => (b.itemId && findById(b.itemId)) || null;
  const nameOf = (b) => b.name || itemOf(b)?.ko || itemOf(b)?.en || "이름 없는 와인";
  const catOf = (b) => itemOf(b)?.cat || b.cat || "wine";
  const active = () => C.bottles.filter((b) => b.qty > 0);
  const won = (n) => "₩" + Math.round(n).toLocaleString("ko-KR");
  const toUSD = (v, cur) => { const r = fxRate(cur || "USD"); return v && r ? v / r : null; };

  /* ───────── 와인서쳐 시세 ───────── */
  const wsName = (b) => itemOf(b)?.en || b.name || "";
  const wsUrl = (b) => {
    const slug = wsName(b).normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\([^)]*\)/g, " ").replace(/[^a-z0-9가-힣]+/g, "+").replace(/^\++|\++$/g, "");
    return `https://www.wine-searcher.com/find/${slug}${b.vintage ? "/" + b.vintage : ""}`;
  };
  const SYMCUR = { "$": "USD", "US$": "USD", "₩": "KRW", "€": "EUR", "£": "GBP", "¥": "JPY", "HK$": "HKD", "A$": "AUD", "S$": "SGD" };
  // 구글 검색 결과의 와인서쳐 요약에서 평균가(세전, 750ml) 추출
  function wsParse(items, b) {
    for (const x of items) {
      if (!/wine-searcher\.com/.test(x.link || "")) continue;
      if (b.vintage && /\/\d{4}(?:$|[/?#])/.test(x.link) && !x.link.includes("/" + b.vintage)) continue;
      const t = `${x.title || ""} ${x.snippet || ""}`;
      const m = t.match(/(?:avg\.?|average)\s*price[^$₩€£¥\d]{0,30}(US\$|HK\$|A\$|S\$|[$₩€£¥])\s?([\d,]+(?:\.\d+)?)/i)
        || t.match(/(US\$|HK\$|A\$|S\$|[$₩€£¥])\s?([\d,]+(?:\.\d+)?)\s*(?:\/\s*750ml|avg|average)/i);
      const off = x.pagemap?.offer?.[0] || x.pagemap?.aggregateoffer?.[0];
      const cur = m ? SYMCUR[m[1].toUpperCase()] || "USD" : off?.pricecurrency;
      const val = m ? +m[2].replace(/,/g, "") : +(off?.price || off?.lowprice || 0);
      const usd = val ? toUSD(val, cur) : null;
      if (usd && usd > 3) return { usd: Math.round(usd * 100) / 100, at: today(), url: x.link };
    }
    return null;
  }
  async function wsFetch(b) {
    const items = await cse(`site:wine-searcher.com "${wsName(b).replace(/"/g, "")}"${b.vintage ? " " + b.vintage : ""} price`);
    return wsParse(items, b);
  }
  const wsVal = (b) => b.ws?.usd || null;

  /* ───────── 시음 적기 추정 ───────── */
  const RE = {
    spark: /champagne|샴페인|스파클링|sparkling|cava|까바|prosecco|프로세코|crémant|cremant|크레망|spumante|franciacorta|sekt/i,
    sweet: /sauternes|소테른|barsac|tokaj|토카이|ice ?wine|아이스 ?와인|beerenauslese|trockenbeeren|yquem|이켐|vin santo/i,
    port: /\bport\b|porto|포트 와인|vintage port|madeira|마데이라/i,
    rose: /로제|rosé|\brose\b|rosado|rosato/i,
    nouveau: /nouveau|누보/i,
    white: /화이트|white|blanc\b|bianco|blanco|riesling|리슬링|chardonnay|샤르도네|sauvignon blanc|소비뇽 블랑|chablis|샤블리|sancerre|상세르|pouilly|meursault|뫼르소|montrachet|몽라셰|gewurz|게뷔르츠|moscato|모스카토|pinot gri|피노 그리|albariño|알바리뇨|grüner|vermentino|viognier|비오니에|chenin|슈냉|semillon|세미용/i,
    long: /1er cru|premier cru|프리미에 크뤼|프르미에 크뤼|flaccianello|플라치아넬로|플라차넬로|fontodi|폰토디|tignanello|티냐넬로|solaia|솔라이아|masseto|마세토|barolo|바롤로|barbaresco|바르바레스코|brunello|브루넬로|hermitage|에르미타주|grand cru|그랑 ?크뤼|grange|그랜지|vega sicilia|베가 시실리아|unico|côte[- ]r[oô]tie|코트 로티|amarone|아마로네|pauillac|포이악|margaux|마고|saint[- ]julien|생 ?쥘리앙|saint[- ]est[eè]phe|pomerol|포므롤|petrus|페트뤼스|ch[aâ]teauneuf|샤토뇌프|romanée|로마네|musigny|chambertin|샹베르탱|sassicaia|사시카이아|ornellaia|오르넬라이아|opus one|오퍼스 원|screaming eagle|harlan|할란|penfolds|펜폴즈/i,
  };
  // [시작, 끝] = 빈티지 + 년수. 근거: 가격대(품질 등급 대용) × 와인 유형 × 장기 숙성형 산지·생산자
  function estimateWindow(b) {
    const it = itemOf(b), cat = catOf(b);
    const buyY = +(b.buyDate || today()).slice(0, 4);
    const t = `${it?.en || ""} ${it?.ko || ""} ${it?.style || ""} ${it?.region || ""} ${b.name || ""}`;
    if (cat === "sake" || cat === "beer" || cat === "makgeolli") return { from: buyY, to: buyY + 1, why: "신선할 때 마시는 술 — 구매 후 1년 이내" };
    if (cat !== "wine") return { from: null, to: null, why: "증류주는 병 숙성이 거의 없어 언제든 (개봉 후 1~2년 내 권장)" };
    if (RE.nouveau.test(t)) return { from: buyY, to: buyY + 1, why: "누보 — 출시 직후" };
    const usd = wsVal(b) || (it && usdOf(it)) || 30;
    let [s, e] = usd >= 400 ? [8, 30] : usd >= 150 ? [6, 22] : usd >= 60 ? [4, 14] : usd >= 30 ? [2, 8] : usd >= 15 ? [1, 5] : [0, 3];
    let why = `가격대($${Math.round(usd)}) 기준`;
    if (RE.port.test(t)) { [s, e] = usd >= 50 ? [12, 45] : [2, 15]; why = "포트·마데이라 — 장기 숙성형"; }
    else if (RE.sweet.test(t)) { [s, e] = usd >= 50 ? [6, 40] : [2, 15]; why = "귀부·아이스 스위트 — 장기 숙성형"; }
    else if (RE.spark.test(t)) { [s, e] = b.vintage ? (usd >= 100 ? [6, 25] : [3, 12]) : [0, 3]; why = b.vintage ? "빈티지 샴페인·스파클링" : "논빈티지 스파클링 — 구매 후 2~3년"; }
    else if (RE.rose.test(t)) { [s, e] = [0, 2]; why = "로제 — 어릴 때"; }
    else if (RE.white.test(t)) {
      const longW = RE.long.test(t) || usd >= 80 || /riesling|리슬링/i.test(t) && usd >= 40;
      [s, e] = longW ? [Math.max(2, Math.round(s * 0.6)), Math.max(10, Math.round(e * 0.7))] : [Math.round(s * 0.4), Math.max(3, Math.round(e * 0.5))];
      why = longW ? "장기 숙성형 화이트" : "화이트 — 과실이 살아 있을 때";
    } else if (RE.long.test(t) && usd >= 40) { s = Math.max(s, 5); e = Math.max(e, 20); why = "장기 숙성형 산지·생산자"; }
    if (!b.vintage) return { from: buyY, to: buyY + Math.max(2, Math.round(e / 3)), why: why + " · 빈티지 미입력이라 구매일 기준" };
    return { from: +b.vintage + s, to: +b.vintage + e, why };
  }
  // 시음 적기는 저장하지 않고 조회할 때마다 계산 (빈티지·와인·구매일 기준)
  const windowOf = (b) => estimateWindow(b);
  const ST = {
    aging: { t: "숙성 중", c: "aging", rank: 3 }, ready: { t: "시음 적기", c: "ready", rank: 1 },
    late: { t: "서둘러요", c: "late", rank: 0 }, past: { t: "정점 지남", c: "past", rank: 2 }, any: { t: "언제든", c: "any", rank: 4 },
  };
  function statusOf(b) {
    const w = windowOf(b), y = YEAR();
    if (!w.from && !w.to) return ST.any;
    if (w.from && y < w.from) return ST.aging;
    if (w.to && y > w.to) return ST.past;
    if (w.to && w.to - y <= Math.max(1, Math.round(((w.to - (w.from || w.to)) || 1) * 0.2))) return ST.late;
    return ST.ready;
  }
  const winText = (w) => (w.from || w.to ? `${w.from || "~"}–${w.to || "~"}` : "언제든");

  /* ───────── 음식 → 보유 와인 ───────── */
  const FOODS = [
    ["스테이크·소고기", /스테이크|소고기|갈비|등심|안심|bbq|바비큐|불고기|붉은 ?고기|육류|비프/i],
    ["양고기", /양갈비|양고기|램/],
    ["돼지고기·삼겹살", /삼겹|목살|돼지|족발|보쌈|햄|살라미|샤퀴|하몽|프로슈토|소시지/],
    ["닭·오리", /닭|치킨|오리|가금|칠면조/],
    ["회·초밥", /(^|[\s·(])회($|[\s·)])|생선회|초밥|스시|사시미|굴|카르파초|세비체|날생선/],
    ["해산물·생선", /해산물|생선|새우|랍스터|조개|관자|게\b|게요리|연어|대구|흰살|문어|오징어|해물/],
    ["치즈", /치즈|콩테|파르미|브리|까망베르|고르곤졸라|그뤼에르|체다/],
    ["파스타·피자", /파스타|피자|리조토|라구|라자냐/],
    ["버섯·트러플", /버섯|트러플|송로/],
    ["한식", /불고기|갈비|전\b|부침|잡채|한식|나물|보쌈|찜|구이|김치|떡갈비/],
    ["매운 음식", /매운|마라|떡볶이|카레|타이|스파이시|양념/],
    ["중식", /중식|딤섬|탕수육|베이징|짜장|중국|훠궈/],
    ["디저트", /디저트|케이크|타르트|과일|초콜릿|푸아그라|블루치즈|단 음식/],
    ["튀김·가벼운 안주", /튀김|프라이|감자|견과|안주|아페리티프|핑거|카나페|샐러드/],
  ];
  function pairScore(b, fi) {
    const it = itemOf(b), re = FOODS[fi][1], p = it?.pairing || {};
    const mine = C.log.filter((l) => (l.itemId && l.itemId === b.itemId || l.bottleId === b.id) && (l.foods || []).includes(FOODS[fi][0]));
    if (mine.some((l) => l.pair === "bad")) return { s: -1, why: "직접 마셔 보니 별로였던 조합" };
    if ((p.avoid || []).some((x) => re.test(x))) return { s: -1 };
    const good = (p.good || []).filter((x) => re.test(x));
    let s = good.length * 2 + mine.filter((l) => l.pair === "good").length * 3;
    if (!s) return { s: 0 };
    return { s, why: mine.some((l) => l.pair === "good") ? "내가 좋았던 조합" + (good.length ? ` · ${good[0]}` : "") : `어울림: ${good.slice(0, 2).join(", ")}` };
  }

  /* ───────── 공통 조각 ───────── */
  const badge = (st) => `<span class="cst ${st.c}">${st.t}</span>`;
  function winBar(b) {
    const w = windowOf(b); if (!w.from && !w.to) return "";
    const y = YEAR(), lo = Math.min(+b.vintage || w.from, y) - 1, hi = Math.max(w.to, y) + 2, span = hi - lo || 1;
    const pct = (v) => ((v - lo) / span) * 100;
    return `<div class="winbar"><i class="seg" style="left:${pct(w.from)}%;width:${Math.max(2, pct(w.to + 1) - pct(w.from))}%"></i><i class="now" style="left:${pct(y + 0.5)}%"></i></div>
      <div class="winlab"><span>${lo + 1}</span><span>올해 ${y}</span><span>${hi}</span></div>`;
  }
  function bottleRow(b, extra = "") {
    const st = statusOf(b), w = windowOf(b), cat = catOf(b);
    return `<button class="item cbtl" data-b="${esc(b.id)}">
      ${b.photo ? `<img class="cthumb" src="${esc(b.photo)}" alt="" />` : `<span class="dot cat-${esc(cat)}">${bottle(cat)}</span>`}
      <span class="meta"><div class="name">${esc(nameOf(b))}${b.vintage ? ` <b class="vin">${esc(b.vintage)}</b>` : ""}</div>
        <div class="sub">${esc([b.size && b.size !== 750 ? (b.size >= 1000 ? b.size / 1000 + "L" : b.size + "ml") : "", b.loc].filter(Boolean).join(" · ") || (itemOf(b)?.region || itemOf(b)?.country || ""))}</div>
        <div class="sub">${badge(st)} <span>${esc(winText(w))}</span>${wsVal(b) && !extra ? ` · <span class="wsv">WS ${fmtUSDv(wsVal(b))}</span>` : ""}${extra ? ` · ${extra}` : ""}</div></span>
      <div class="score"><b>${b.qty}</b>병</div></button>`;
  }
  const bindRows = (root) => root.querySelectorAll("[data-b]").forEach((el) => (el.onclick = () => go("#/cellar/" + enc(el.dataset.b))));

  /* ───────── 셀러 메인 ───────── */
  // #/cellar/add/<술id>?v=2020&q=1 → 미리 채운 '셀러에 추가' 화면
  function quickAdd(id, qs) {
    const it = findById(id), p = new URLSearchParams(qs || "");
    history.replaceState(null, "", "#/cellar");
    renderCellar();
    if (!it) return toast("해당 술을 찾을 수 없어요");
    openBottleSheet(null, it, { vintage: (p.get("v") || "").replace(/\D/g, "").slice(0, 4), qty: Math.max(1, parseInt(p.get("q")) || 1), loc: p.get("loc") || "", note: p.get("note") || "" });
  }
  // #/cellar/addmany?items=id:빈티지[:병수],id:빈티지 → 확인 후 여러 병을 한 번에 추가 (같은 와인+빈티지는 병 수만 더함)
  function addMany(qs) {
    const list = (new URLSearchParams(qs || "").get("items") || "").split(",").map((x) => x.split(":")).filter(([id]) => findById(id))
      .map(([id, v, q]) => ({ it: findById(id), v: (v || "").replace(/\D/g, "").slice(0, 4), q: Math.max(1, parseInt(q) || 1) }));
    history.replaceState(null, "", "#/cellar");
    if (!list.length) { renderCellar(); return toast("추가할 와인을 찾을 수 없어요"); }
    renderCellar();
    if (!confirm(`셀러에 ${list.length}종을 추가할까요?\n\n` + list.map(({ it, v, q }) => `· ${it.ko} ${v} × ${q}병`).join("\n"))) return;
    C = load();
    for (const { it, v, q } of list) {
      const same = C.bottles.find((b) => b.itemId === it.id && String(b.vintage || "") === v);
      if (same) same.qty += q; else C.bottles.push({ id: uid(), itemId: it.id, name: "", vintage: v, size: 750, qty: q, buyDate: today(), loc: "", note: "", photo: "", added: today() });
    }
    if (!save()) return;
    toast(`${list.length}종을 셀러에 추가했어요 🍷`); renderCellar();
  }
  function renderCellar(bid, arg, qs) {
    if (bid === "addmany") return addMany(qs);
    if (bid === "add") return quickAdd(arg, qs);
    if (bid) return renderBottle(bid);
    setChrome("cellar", "나의 와인셀러");
    C = load();
    const A = active(), n = A.reduce((s, b) => s + b.qty, 0);
    const wsN = A.filter(wsVal).length, ws = A.reduce((s, b) => s + (wsVal(b) || 0) * b.qty, 0);
    const val = A.reduce((s, b) => s + ((itemOf(b) && usdOf(itemOf(b))) || 0) * b.qty, 0);
    const krw = fxRate("KRW") || 1400;
    const krwOf = (usd) => "≈ " + won(usd * krw);
    const cnt = (k) => A.filter((b) => statusOf(b).c === k).reduce((s, b) => s + b.qty, 0);
    const filt = store.get("cellar.f", "all"), sort = store.get("cellar.s", "window");
    const fl = A.filter((b) => filt === "all" || statusOf(b).c === filt);
    const key = { window: (b) => [statusOf(b).rank, windowOf(b).to || 9999], buy: (b) => [-(Date.parse(b.buyDate) || 0)], price: (b) => [-(wsVal(b) || (itemOf(b) && usdOf(itemOf(b))) || 0)], name: (b) => [nameOf(b)] }[sort] || ((b) => [0]);
    fl.sort((a, b) => { const x = key(a), y = key(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return x[i] < y[i] ? -1 : 1; return 0; });
    view.innerHTML = `
      <section class="hero cat-wine cellar-hero"><span class="glyph">${bottle("wine")}</span>
        <span class="kind">My Cellar</span><h2>${n ? `${n}병 <small>${A.length}종</small>` : "셀러가 비어 있어요"}</h2>
        ${n ? `<div class="stats" style="grid-template-columns:repeat(2,1fr)">
          <div class="stat"><small>와인서쳐 시세 합계${wsN ? ` · ${wsN}/${A.length}종` : ""}</small><b>${ws ? fmtUSDv(ws) : "—"}</b>${ws ? `<small>${krwOf(ws)}</small>` : ""}</div>
          <div class="stat"><small>현지 참고가 합계</small><b>${val ? fmtUSDv(val) : "—"}</b>${val ? `<small>${krwOf(val)}</small>` : ""}</div></div>` : `<div class="names">와인을 추가하면 시음 적기와 페어링을 관리해 드려요</div>`}
      </section>
      <button class="btn gold block" id="cAdd" style="margin-top:12px">＋ 와인 추가</button>
      ${n && cseOn() ? `<button class="btn ghost block" id="cWsAll" style="margin-top:8px">와인서쳐 시세 모두 불러오기</button>` : ""}
      ${n ? `<div class="alerts">
        <button data-f="late" class="al late"><b>${cnt("late")}</b><span>서둘러요</span></button>
        <button data-f="ready" class="al ready"><b>${cnt("ready")}</b><span>지금 적기</span></button>
        <button data-f="aging" class="al aging"><b>${cnt("aging")}</b><span>숙성 중</span></button>
        <button data-f="past" class="al past"><b>${cnt("past")}</b><span>정점 지남</span></button></div>
      <div class="panel"><h3>오늘 뭘 열까?</h3><p class="hint" style="margin:0 0 8px">음식을 고르면 보유 와인 중 어울리는 병을 시음 적기가 급한 순으로 추천해요</p>
        <div class="chips" id="foodChips" style="margin:0 -16px;padding-bottom:6px">${FOODS.map(([f], i) => `<button class="chip" data-i="${i}">${esc(f)}</button>`).join("")}</div>
        <div id="pick"></div></div>
      <div class="section-title">보유 와인 <small>${fl.length}종</small></div>
      <div class="chips" id="cf">${[["all", "전체"], ["late", "서둘러요"], ["ready", "적기"], ["aging", "숙성 중"], ["past", "지남"], ["any", "언제든"]].map(([k, v]) => `<button class="chip ${k === filt ? "active" : ""}" data-f="${k}">${v}</button>`).join("")}
        <span style="flex:none;width:8px"></span>${[["window", "적기순"], ["buy", "최근 구매"], ["price", "시세"], ["name", "이름"]].map(([k, v]) => `<button class="chip ${k === sort ? "active" : ""}" data-s="${k}">${v}</button>`).join("")}</div>
      <div class="list" id="clist">${fl.map((b) => bottleRow(b)).join("") || `<div class="empty">해당하는 병이 없어요</div>`}</div>` : ""}
      ${C.log.length ? `<div class="section-title">시음 기록 <small>${C.log.length}회</small></div>
      <div class="list">${C.log.slice().sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 15).map(logRow).join("")}</div>` : ""}
      <div class="panel"><h3>백업</h3><p class="hint" style="margin-top:0">셀러 기록은 이 휴대폰에만 저장돼요. 폰을 바꾸거나 앱 데이터를 지우기 전에 백업 파일을 저장해 두세요.</p>
        <div class="linkbtns"><button class="btn ghost" id="cExp">백업 파일 저장</button><button class="btn ghost" id="cImp">백업 불러오기</button><button class="btn ghost" id="cCsv">엑셀(CSV) 저장</button></div>
        <input type="file" id="cImpFile" accept="application/json,.json" class="hidden" /></div>`;
    $("#cAdd").onclick = () => openBottleSheet();
    $("#cWsAll")?.addEventListener("click", async (e) => {
      const btn = e.target, todo = A.filter((b) => (itemOf(b)?.cat || b.cat) === "wine" && b.ws?.at !== today());
      if (!todo.length) return toast("오늘 이미 모두 불러왔어요");
      btn.disabled = true; let ok = 0;
      for (const [i, b] of todo.entries()) {
        btn.textContent = `불러오는 중… ${i + 1}/${todo.length}`;
        try { const r = await wsFetch(b); if (r) { const bb = C.bottles.find((x) => x.id === b.id); bb.ws = r; ok++; } } catch (err) { toast("검색 실패: " + err.message); break; }
      }
      save(); toast(`${ok}종의 시세를 찾았어요${ok < todo.length ? ` (못 찾은 ${todo.length - ok}종은 와인서쳐 링크로 확인)` : ""}`); renderCellar();
    });
    bindRows(view);
    view.querySelectorAll("[data-log]").forEach((el) => (el.onclick = () => openDrinkSheet(C.bottles.find((b) => b.id === el.dataset.bid), C.log.find((l) => l.id === el.dataset.log))));
    view.querySelectorAll(".alerts [data-f], #cf [data-f]").forEach((el) => (el.onclick = () => { store.set("cellar.f", el.dataset.f === filt && el.closest(".alerts") ? "all" : el.dataset.f); renderCellar(); }));
    view.querySelectorAll("#cf [data-s]").forEach((el) => (el.onclick = () => { store.set("cellar.s", el.dataset.s); renderCellar(); }));
    const fc = $("#foodChips");
    if (fc) fc.onclick = (e) => {
      const ch = e.target.closest("[data-i]"); if (!ch) return;
      fc.querySelectorAll(".chip").forEach((x) => x.classList.toggle("active", x === ch));
      const i = +ch.dataset.i;
      const r = A.map((b) => ({ b, p: pairScore(b, i), st: statusOf(b) })).filter((x) => x.p.s > 0 && x.st.c !== "aging")
        .sort((x, y) => x.st.rank - y.st.rank || y.p.s - x.p.s).slice(0, 5);
      const aging = A.filter((b) => pairScore(b, i).s > 0 && statusOf(b).c === "aging").length;
      $("#pick").innerHTML = r.length ? `<div class="list" style="margin-top:6px">${r.map(({ b, p }) => bottleRow(b, esc(p.why))).join("")}</div>`
        : `<p class="hint" style="margin-top:8px">지금 마시기 좋은 병 중에는 ${esc(FOODS[i][0])}와 딱 맞는 와인이 없어요.${aging ? ` (숙성 중인 병 ${aging}종은 어울리지만 아직 일러요)` : ""}</p>`;
      bindRows($("#pick"));
    };
    $("#cExp").onclick = exportJSON; $("#cCsv").onclick = exportCSV;
    $("#cImp").onclick = () => $("#cImpFile").click();
    $("#cImpFile").onchange = importJSON;
  }
  function logRow(l) {
    const b = C.bottles.find((x) => x.id === l.bottleId);
    return `<button class="item" data-log="${esc(l.id)}" data-bid="${esc(l.bottleId || "")}">
      <span class="dot cat-wine">${bottle(b ? catOf(b) : "wine")}</span>
      <span class="meta"><div class="name">${esc(l.name || (b ? nameOf(b) : ""))}${l.vintage ? ` <b class="vin">${esc(l.vintage)}</b>` : ""}</div>
        <div class="sub">${esc([l.date, l.with, l.occasion].filter(Boolean).join(" · "))}</div>
        ${l.food || l.foods?.length ? `<div class="sub">${l.pair === "good" ? "👍 " : l.pair === "bad" ? "👎 " : ""}${esc(l.food || l.foods.join(", "))}</div>` : ""}</span>
      ${l.score ? `<div class="score"><b>${esc(l.score)}</b>내 점수</div>` : ""}</button>`;
  }

  /* ───────── 병 상세 ───────── */
  function renderBottle(id) {
    C = load();
    const b = C.bottles.find((x) => x.id === id);
    if (!b) { setChrome("cellar", "나의 와인셀러", true); view.innerHTML = `<div class="empty">이 병을 찾을 수 없어요</div>`; return; }
    const it = itemOf(b), cat = catOf(b), st = statusOf(b), w = windowOf(b), p = it?.pairing || {};
    setChrome("cellar", esc(nameOf(b)), true);
    const logs = C.log.filter((l) => l.bottleId === b.id || (b.itemId && l.itemId === b.itemId)).sort((a, c) => (c.date || "").localeCompare(a.date || ""));
    const myPairs = logs.filter((l) => l.pair && (l.food || l.foods?.length));
    const krw = fxRate("KRW") || 1400;
    const rows = [["빈티지", b.vintage || "NV / 미입력"], ["용량", b.size ? (b.size >= 1000 ? b.size / 1000 + "L" : b.size + "ml") : ""], ["보유", `${b.qty}병`],
      ["구매일", b.buyDate], ["보관 위치", b.loc], ["메모", b.note]].filter(([, v]) => v);
    view.innerHTML = `
      <section class="hero cat-${esc(cat)}"><span class="glyph">${bottle(cat)}</span>
        <span class="kind">My Cellar · ${badge(st)}</span><h2>${esc(nameOf(b))}${b.vintage ? ` ${esc(b.vintage)}` : ""}</h2>
        ${it && it.en && it.en !== nameOf(b) ? `<div class="names">${esc(it.en)}</div>` : ""}
        <div class="stats" style="grid-template-columns:repeat(3,1fr)"><div class="stat"><small>보유</small><b>${b.qty}병</b></div>
          <div class="stat"><small>시음 적기</small><b>${esc(winText(w))}</b></div><div class="stat"><small>상태</small><b>${st.t}</b></div></div></section>
      ${b.photo ? `<figure class="photo"><img src="${esc(b.photo)}" alt="라벨 사진" /></figure>` : ""}
      <div class="panel"><h3>시음 적기</h3>${winBar(b)}
        <p class="hint" style="margin:8px 0 0">자동 추정 — ${esc(w.why)}. 실제 적기는 빈티지 작황·보관 상태에 따라 달라요.</p></div>
      <div class="linkbtns" style="margin-top:10px"><button class="btn" id="bDrink" ${b.qty ? "" : "disabled"}>🍷 한 병 마셨어요</button><button class="btn ghost" id="bEdit">수정</button></div>
      ${cat === "wine" || !it ? `<div class="panel"><h3>와인서쳐 시세 <small class="prov">Wine-Searcher</small></h3>
        ${b.ws ? `<div class="price-card"><div class="price-big">${fmtUSDv(b.ws.usd)}</div>
          <div class="price-sub">평균가(세전·750ml) ≈ ${won(b.ws.usd * krw)} · ${esc(b.ws.at)} 조회</div>
          ${b.qty > 1 ? `<div class="price-sub">보유 ${b.qty}병 합계 ${fmtUSDv(b.ws.usd * b.qty)} (≈ ${won(b.ws.usd * b.qty * krw)})</div>` : ""}</div>`
          : `<p class="hint" style="margin:0 0 10px">${cseOn() ? "아래 버튼으로 와인서쳐 평균가를 불러올 수 있어요." : "설정에서 Google 검색 키를 넣으면 와인서쳐 평균가를 불러와 표시해요. 지금은 링크로 확인하세요."}</p>`}
        <div class="linkbtns"><a class="btn ghost" href="${esc(b.ws?.url || wsUrl(b))}" target="_blank" rel="noopener">와인서쳐에서 보기 ↗</a>
          ${cseOn() ? `<button class="btn ghost" id="bWs">${b.ws ? "다시 불러오기" : "평균가 불러오기"}</button>` : ""}</div>
        ${it && usdOf(it) ? `<p class="hint" style="margin:10px 0 0">참고: 앱 내장 현지 참고가 ${fmtUSDv(usdOf(it))} (빈티지 무관 추정)</p>` : ""}</div>` : ""}
      <div class="panel"><h3>보유 정보</h3><dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join("")}</dl>
        ${it ? `<button class="btn ghost block" id="bItem" style="margin-top:12px">술 정보 보기 (설명·가격·평가)</button>` : ""}</div>
      ${p.good?.length || p.avoid?.length || myPairs.length ? `<div class="panel"><h3>페어링</h3>
        ${myPairs.length ? `<div class="mypairs">${myPairs.map((l) => `<div class="${l.pair}">${l.pair === "good" ? "👍" : l.pair === "bad" ? "👎" : "·"} ${esc(l.food || l.foods.join(", "))} <small>${esc(l.date || "")}</small></div>`).join("")}</div>` : ""}
        ${p.good?.length ? `<div class="pair-grid" style="grid-template-columns:repeat(${p.avoid?.length ? 2 : 1},1fr)"><div class="pair-card ok"><h4>잘 어울려요</h4><ul>${p.good.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
          ${p.avoid?.length ? `<div class="pair-card no"><h4>피하세요</h4><ul>${p.avoid.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}</div>` : ""}
        ${[["서빙 온도", p.temp], ["잔", p.glass], ["디캔팅", p.decant]].filter(([, v]) => v).length ? `<div class="serve" style="grid-template-columns:repeat(${[p.temp, p.glass, p.decant].filter(Boolean).length},1fr)">${[["서빙 온도", p.temp], ["잔", p.glass], ["디캔팅", p.decant]].filter(([, v]) => v).map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join("")}</div>` : ""}
      </div>` : ""}
      ${logs.length ? `<div class="section-title">시음 기록 <small>${logs.length}회</small></div><div class="list">${logs.map(logRow).join("")}</div>` : ""}
      <button class="btn ghost block" id="bDel" style="margin-top:14px;color:var(--warn)">셀러에서 삭제</button>`;
    $("#bDrink").onclick = () => openDrinkSheet(b);
    $("#bWs")?.addEventListener("click", async (e) => {
      e.target.disabled = true; e.target.textContent = "불러오는 중…";
      try {
        const r = await wsFetch(b);
        if (!r) { toast("검색 결과에서 평균가를 찾지 못했어요 — 와인서쳐 링크로 확인하세요"); e.target.disabled = false; e.target.textContent = "다시 불러오기"; return; }
        C = load(); const bb = C.bottles.find((x) => x.id === b.id); bb.ws = r; save(); toast("시세를 불러왔어요"); renderBottle(b.id);
      } catch (err) { toast("불러오지 못했어요 (" + err.message + ")"); e.target.disabled = false; e.target.textContent = "평균가 불러오기"; }
    });
    $("#bEdit").onclick = () => openBottleSheet(b);
    $("#bItem")?.addEventListener("click", () => go(`#/item/${enc(b.itemId)}/overview`));
    view.querySelectorAll("[data-log]").forEach((el) => (el.onclick = () => openDrinkSheet(b, C.log.find((l) => l.id === el.dataset.log))));
    $("#bDel").onclick = () => {
      if (!confirm(`‘${nameOf(b)}’을(를) 셀러에서 삭제할까요? (시음 기록은 남아요)`)) return;
      C.bottles = C.bottles.filter((x) => x.id !== b.id); save(); toast("삭제했어요"); go("#/cellar");
    };
  }

  /* ───────── 추가·수정 시트 ───────── */
  function sheet(html) {
    $("#editSheet")?.remove();
    const el = document.createElement("div"); el.id = "editSheet"; el.className = "sheet-wrap";
    el.innerHTML = `<div class="sheet-bg"></div><form class="sheet edit-form"><div class="grab"></div>${html}</form>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.querySelector(".sheet-bg").onclick = close;
    el.querySelector("[data-close]")?.addEventListener("click", close);
    return { el, form: el.querySelector("form"), close };
  }
  function openBottleSheet(b0, preItem, pre) {
    const edit = !!b0;
    const b = b0 ? { ...b0 } : { id: uid(), itemId: preItem?.id || "", name: "", vintage: "", size: 750, qty: 1, buyDate: today(), loc: "", note: "", photo: "", ...(pre || {}) };
    const { el, form, close } = sheet(`
      <h3 class="sheet-h">${edit ? "보유 와인 수정" : "셀러에 추가"}</h3>
      <div class="field"><label>와인</label><input id="bq" autocomplete="off" placeholder="이름·초성으로 검색 (예: 딸보, ㅇㅍㅅㅇ)" value="${esc(itemOf(b)?.ko || b.name)}" />
        <div class="picked" id="bPicked">${itemOf(b) ? `✓ ${esc(itemOf(b).ko)} <small>${esc(itemOf(b).en || "")}</small>` : b.name ? `직접 입력: ${esc(b.name)}` : ""}</div>
        <div class="list mini" id="bRes"></div></div>
      <div class="frow"><div class="field"><label>빈티지</label><input name="vintage" inputmode="numeric" placeholder="예: 2018 (NV는 비움)" value="${esc(b.vintage)}" /></div>
        <div class="field"><label>수량(병)</label><input name="qty" type="number" min="0" inputmode="numeric" value="${esc(b.qty)}" /></div></div>
      <div class="frow"><div class="field"><label>구매일</label><input name="buyDate" type="date" value="${esc(b.buyDate)}" /></div>
        <div class="field"><label>용량</label><select name="size">${[[375, "375ml (하프)"], [500, "500ml"], [750, "750ml"], [1500, "1.5L (매그넘)"], [3000, "3L"]].map(([v, t]) => `<option value="${v}" ${+b.size === v ? "selected" : ""}>${t}</option>`).join("")}</select></div></div>
      <a class="wslink" id="bWsLink" target="_blank" rel="noopener" href="#">와인서쳐에서 시세 보기 ↗</a>
      <div class="field"><label>보관 위치</label><input name="loc" placeholder="예: 셀러 A · 3단 · 왼쪽 2번째" value="${esc(b.loc)}" /></div>
      <div class="field"><label>메모</label><textarea name="note" rows="2" placeholder="선물 받음, 결혼기념일용 등">${esc(b.note)}</textarea></div>
      <div class="field"><label>라벨 사진</label><div class="frow" style="margin:0;align-items:center">${b.photo ? `<img id="bPh" class="cthumb lg" src="${esc(b.photo)}" alt="" />` : `<img id="bPh" class="cthumb lg hidden" alt="" />`}
        <button type="button" class="btn ghost" id="bPhoto" style="flex:1">📷 사진 ${b.photo ? "바꾸기" : "추가"}</button></div>
        <input type="file" id="bPhFile" accept="image/*" capture="environment" class="hidden" /></div>
      <button class="btn block" type="submit">${edit ? "저장" : "셀러에 추가"}</button>
      <button class="btn ghost block" type="button" data-close style="margin-top:8px">취소</button>`);
    const q = el.querySelector("#bq"), res = el.querySelector("#bRes"), picked = el.querySelector("#bPicked");
    const hint = () => {
      const f = new FormData(form);
      const lk = el.querySelector("#bWsLink"), nm = wsName(b);
      lk.classList.toggle("hidden", !nm); lk.href = wsUrl({ ...b, vintage: String(f.get("vintage") || "").replace(/\D/g, "").slice(0, 4) });
      lk.textContent = `와인서쳐에서 ‘${nm}${f.get("vintage") ? " " + f.get("vintage") : ""}’ 시세 보기 ↗`;
    };
    const pick = (it) => { b.itemId = it.id; b.name = ""; q.value = it.ko || it.en; res.innerHTML = ""; picked.innerHTML = `✓ ${esc(it.ko)} <small>${esc(it.en || "")}</small>`; hint(); };
    q.oninput = () => {
      const s = q.value.trim(); b.itemId = ""; b.name = s;
      picked.textContent = s ? `직접 입력: ${s}` : "";
      const r = s ? search(s, 8) : [];
      res.innerHTML = r.map((it) => `<button type="button" class="item" data-pid="${esc(it.id)}"><span class="dot cat-${esc(it.cat)}">${bottle(it.cat)}</span><span class="meta"><div class="name">${esc(it.ko || it.en)}</div><div class="sub">${esc([it.en !== it.ko ? it.en : "", it.country].filter(Boolean).join(" · "))}</div></span></button>`).join("");
      res.querySelectorAll("[data-pid]").forEach((x) => (x.onclick = () => pick(findById(x.dataset.pid))));
      hint();
    };
    ["vintage", "buyDate"].forEach((n) => form.elements[n].addEventListener("input", hint));
    hint();
    el.querySelector("#bPhoto").onclick = () => el.querySelector("#bPhFile").click();
    el.querySelector("#bPhFile").onchange = async (e) => {
      const f = e.target.files?.[0]; if (!f) return;
      try {
        const shot = await shrink(f, 520);
        b.photo = await new Promise((r) => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(shot.blob); });
        const im = el.querySelector("#bPh"); im.src = b.photo; im.classList.remove("hidden");
      } catch { toast("사진을 열 수 없어요"); }
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      if (!b.itemId && !b.name) { toast("와인을 검색해서 고르거나 이름을 입력해 주세요"); return; }
      const num = (v) => String(v || "").replace(/[^\d.]/g, "");
      Object.assign(b, { vintage: num(f.vintage).slice(0, 4), qty: Math.max(0, parseInt(f.qty) || 0), buyDate: f.buyDate, size: +f.size,
        loc: f.loc.trim(), note: f.note.trim() });
      delete b.from; delete b.to;
      if (!b.itemId) b.cat = "wine";
      if (b0 && (b0.vintage !== b.vintage || b0.itemId !== b.itemId || b0.name !== b.name)) delete b.ws;
      C = load();
      const i = C.bottles.findIndex((x) => x.id === b.id);
      if (i >= 0) C.bottles[i] = b; else C.bottles.push({ ...b, added: today() });
      if (!save()) return;
      close(); toast(edit ? "저장했어요" : "셀러에 추가했어요 🍷");
      go("#/cellar/" + enc(b.id));
    };
  }

  /* ───────── 시음 기록 시트 ───────── */
  function openDrinkSheet(b, l0) {
    const edit = !!l0;
    const l = l0 ? { ...l0, foods: [...(l0.foods || [])] } : { id: uid(), bottleId: b?.id, itemId: b?.itemId || "", name: b ? nameOf(b) : "", vintage: b?.vintage || "", date: today(), n: 1, with: "", occasion: "", food: "", foods: [], pair: "", score: "", note: "" };
    const { el, form, close } = sheet(`
      <h3 class="sheet-h">${edit ? "시음 기록" : "한 병 마셨어요"} <small>${esc(l.name)}${l.vintage ? " " + esc(l.vintage) : ""}</small></h3>
      <div class="frow"><div class="field"><label>날짜</label><input name="date" type="date" value="${esc(l.date)}" /></div>
        ${edit ? "" : `<div class="field" style="max-width:96px"><label>병 수</label><input name="n" type="number" min="1" max="${b?.qty || 1}" value="1" /></div>`}</div>
      <div class="frow"><div class="field"><label>함께한 사람</label><input name="with" value="${esc(l.with)}" placeholder="예: 가족, 김 대표" /></div>
        <div class="field"><label>자리</label><input name="occasion" value="${esc(l.occasion)}" placeholder="예: 생일, 접대" /></div></div>
      <div class="field"><label>음식</label><input name="food" value="${esc(l.food)}" placeholder="예: 한우 채끝 스테이크" />
        <div class="chips" id="dFoods" style="margin:8px -16px 0;padding-bottom:4px">${FOODS.map(([f]) => `<button type="button" class="chip ${l.foods.includes(f) ? "active" : ""}" data-f="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>
      <div class="field"><label>페어링은 어땠나요?</label><div class="seg3" id="dPair">${[["good", "👍 좋았어요"], ["ok", "보통"], ["bad", "👎 별로"]].map(([k, v]) => `<button type="button" data-p="${k}" class="${l.pair === k ? "active" : ""}">${v}</button>`).join("")}</div></div>
      <div class="field"><label>내 점수 (100점)</label><input name="score" type="number" min="50" max="100" inputmode="numeric" value="${esc(l.score)}" placeholder="예: 92" /></div>
      <div class="field"><label>한 줄 노트</label><textarea name="note" rows="2" placeholder="향·맛·상태 (예: 2시간 디캔팅 후 활짝)">${esc(l.note)}</textarea></div>
      <button class="btn block" type="submit">${edit ? "저장" : "기록하고 1병 빼기"}</button>
      ${edit ? `<button class="btn ghost block" type="button" id="dDel" style="margin-top:8px;color:var(--warn)">기록 삭제</button>` : ""}
      <button class="btn ghost block" type="button" data-close style="margin-top:8px">취소</button>`);
    el.querySelector("#dFoods").onclick = (e) => { const c = e.target.closest("[data-f]"); if (!c) return; c.classList.toggle("active"); const f = c.dataset.f; l.foods = l.foods.includes(f) ? l.foods.filter((x) => x !== f) : [...l.foods, f]; };
    // 입력한 음식 이름으로 분류 칩 자동 선택
    form.elements.food.addEventListener("change", () => {
      const v = form.elements.food.value;
      FOODS.forEach(([f, re]) => { if (re.test(v) && !l.foods.includes(f)) { l.foods.push(f); el.querySelector(`#dFoods [data-f="${CSS.escape(f)}"]`)?.classList.add("active"); } });
    });
    el.querySelector("#dPair").onclick = (e) => { const c = e.target.closest("[data-p]"); if (!c) return; l.pair = l.pair === c.dataset.p ? "" : c.dataset.p; el.querySelectorAll("#dPair button").forEach((x) => x.classList.toggle("active", x.dataset.p === l.pair)); };
    el.querySelector("#dDel")?.addEventListener("click", () => {
      if (!confirm("이 시음 기록을 삭제할까요? (병 수는 그대로예요)")) return;
      C = load(); C.log = C.log.filter((x) => x.id !== l.id); save(); close(); toast("삭제했어요"); ctx.render();
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(form));
      Object.assign(l, { date: f.date, with: f.with.trim(), occasion: f.occasion.trim(), food: f.food.trim(), score: f.score ? Math.min(100, Math.max(0, +f.score)) : "", note: f.note.trim() });
      FOODS.forEach(([fd, re]) => { if (re.test(l.food) && !l.foods.includes(fd)) l.foods.push(fd); });
      C = load();
      if (edit) C.log = C.log.map((x) => (x.id === l.id ? l : x));
      else {
        const n = Math.max(1, parseInt(f.n) || 1); l.n = n; C.log.push(l);
        const bb = C.bottles.find((x) => x.id === b.id); if (bb) bb.qty = Math.max(0, bb.qty - n);
      }
      if (!save()) return;
      close();
      const left = C.bottles.find((x) => x.id === l.bottleId)?.qty;
      toast(edit ? "저장했어요" : left ? `기록했어요 · 남은 ${left}병` : "기록했어요 · 마지막 병이었어요");
      ctx.render();
    };
  }

  /* ───────── 백업 ───────── */
  function download(name, text, type) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }
  function exportJSON() {
    const data = { app: "술이 먼저야", kind: "backup", v: 1, at: new Date().toISOString(), cellar: load(), edits: store.get("edits", {}), useritems: store.get("useritems", {}) };
    download(`suli-backup-${today()}.json`, JSON.stringify(data), "application/json");
    toast("백업 파일을 저장했어요 — 다운로드 폴더를 확인하세요");
  }
  async function importJSON(e) {
    const f = e.target.files?.[0]; if (!f) return;
    try {
      const d = JSON.parse(await f.text());
      if (!d?.cellar?.bottles) throw new Error("형식");
      const cur = load();
      const mode = cur.bottles.length || cur.log.length ? (confirm(`백업(${d.cellar.bottles.length}종 · 기록 ${d.cellar.log?.length || 0}회)을 불러옵니다.\n\n확인: 지금 셀러와 합치기\n취소: 그만두기`) ? "merge" : null) : "merge";
      if (!mode) return;
      const byId = (arr, add) => { const m = new Map(arr.map((x) => [x.id, x])); for (const x of add || []) m.set(x.id, x); return [...m.values()]; };
      C = { bottles: byId(cur.bottles, d.cellar.bottles), log: byId(cur.log, d.cellar.log) };
      save();
      if (d.edits) store.set("edits", { ...store.get("edits", {}), ...d.edits });
      if (d.useritems) store.set("useritems", { ...store.get("useritems", {}), ...d.useritems });
      toast("백업을 불러왔어요"); setTimeout(() => location.reload(), 600);
    } catch { toast("백업 파일을 읽을 수 없어요"); }
  }
  function exportCSV() {
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const B = load();
    const head = ["와인", "영문", "빈티지", "용량ml", "수량", "구매일", "보관위치", "시음적기 시작", "시음적기 끝", "상태", "와인서쳐 평균가USD", "조회일", "현지참고가USD", "와인서쳐 링크", "메모"];
    const rows = B.bottles.map((b) => { const it = itemOf(b), w = windowOf(b); return [nameOf(b), it?.en || "", b.vintage, b.size, b.qty, b.buyDate, b.loc, w.from || "", w.to || "", statusOf(b).t, b.ws?.usd || "", b.ws?.at || "", it && usdOf(it) ? Math.round(usdOf(it)) : "", b.ws?.url || wsUrl(b), b.note]; });
    const lhead = ["날짜", "와인", "빈티지", "병수", "함께", "자리", "음식", "페어링", "내점수", "노트"];
    const lrows = B.log.map((l) => [l.date, l.name, l.vintage, l.n || 1, l.with, l.occasion, [l.food, ...(l.foods || [])].filter(Boolean).join(" / "), { good: "좋음", ok: "보통", bad: "별로" }[l.pair] || "", l.score, l.note]);
    const csv = "﻿" + [head, ...rows].map((r) => r.map(q).join(",")).join("\r\n") + "\r\n\r\n" + [lhead, ...lrows].map((r) => r.map(q).join(",")).join("\r\n");
    download(`suli-cellar-${today()}.csv`, csv, "text/csv");
    toast("CSV를 저장했어요 — 엑셀에서 열 수 있어요");
  }

  /* ───────── 술 상세 화면 연동 ───────── */
  function itemCellarHTML(it) {
    const mine = load().bottles.filter((b) => b.itemId === it.id && b.qty > 0);
    const n = mine.reduce((s, b) => s + b.qty, 0);
    return `<div class="incellar">${n ? `<button class="incellar-on" id="inCellar">🍷 내 셀러에 <b>${n}병</b> · ${mine.map((b) => `${b.vintage || "NV"} ${statusOf(b).t}(${winText(windowOf(b))})`).join(", ")} ›</button>` : ""}
      <button class="btn ghost block" id="toCellar">＋ 내 셀러에 추가</button></div>`;
  }
  function wireItemCellar(it) {
    $("#toCellar")?.addEventListener("click", () => openBottleSheet(null, it));
    $("#inCellar")?.addEventListener("click", () => { const b = load().bottles.find((x) => x.itemId === it.id && x.qty > 0); if (b) go("#/cellar/" + enc(b.id)); });
  }
  // 홈 화면 알림용
  function dueSummary() {
    const A = load().bottles.filter((b) => b.qty > 0);
    const late = A.filter((b) => statusOf(b).c === "late").reduce((s, b) => s + b.qty, 0);
    const ready = A.filter((b) => statusOf(b).c === "ready").reduce((s, b) => s + b.qty, 0);
    return { late, ready, total: A.reduce((s, b) => s + b.qty, 0) };
  }
  // 페어링 탭용: 보유 중인 병 + 그 병(같은 와인)의 내 시음 기록
  function pairingList() {
    C = load();
    return active().map((b) => ({
      id: b.id, it: itemOf(b) || (() => { const g = ctx.inferFromName?.(b.name) || {}; return { cat: b.cat || "wine", ko: b.name, en: b.name, style: g.style || "", ingredients: g.grapes || [] }; })(), name: nameOf(b), vintage: b.vintage, qty: b.qty, loc: b.loc, st: statusOf(b), win: winText(windowOf(b)),
      logs: C.log.filter((l) => l.bottleId === b.id || (b.itemId && l.itemId === b.itemId)),
    }));
  }
  return { renderCellar, itemCellarHTML, wireItemCellar, dueSummary, estimateWindow, statusOf, pairingList };
}
