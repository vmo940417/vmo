import * as AI from "./ai.js";

const CATS = window.CATEGORIES;
const DB = window.LIQUORS;
const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");

/* ───────── 유틸 ───────── */
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? esc(u) : "#");
const enc = encodeURIComponent;
const fmtUSD = (n) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US"));
const fmtMoney = (n, cur) => {
  if (n == null) return "—";
  try { return new Intl.NumberFormat("ko-KR", { style: "currency", currency: cur, maximumFractionDigits: 0 }).format(n); }
  catch { return `${Number(n).toLocaleString()} ${cur}`; }
};
const ago = (t) => {
  const m = Math.round((Date.now() - t) / 60000);
  if (m < 1) return "방금"; if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60); if (h < 24) return `${h}시간 전`;
  return `${Math.round(h / 24)}일 전`;
};
const store = {
  get(k, d) { try { const v = localStorage.getItem("sulsajeon." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("sulsajeon." + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("sulsajeon." + k); } catch {} },
};
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add("hidden"), 2600);
}

/* ───────── 다국어 검색 ───────── */
function norm(s) {
  return String(s || "")
    .normalize("NFKC").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC") // 악센트 제거(é→e) 후 한글 재조합
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60)) // 가타카나 → 히라가나
    .replace(/[\s·・.,'’"\-–_()（）\/&]/g, "");
}
const bigrams = (s) => { const a = new Set(); for (let i = 0; i < s.length - 1; i++) a.add(s.slice(i, i + 2)); return a; };
function dice(a, b) {
  if (!a || !b) return 0; if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a), B = bigrams(b); let n = 0; A.forEach((x) => B.has(x) && n++);
  return (2 * n) / (A.size + B.size);
}
function keysOf(it) {
  return [it.ko, it.en, it.ja, it.zh, it.producer, ...(it.aliases || [])].filter(Boolean).map(norm);
}
function allItems() { return [...DB, ...Object.values(store.get("aiItems", {}))]; }
function search(q, min = 0.42) { return searchScored(q, min).map((r) => r[1]); }
function searchScored(q, min = 0.42) {
  const nq = norm(q); if (!nq) return [];
  const res = [];
  for (const it of allItems()) {
    let best = 0;
    for (const k of keysOf(it)) {
      if (k === nq) best = Math.max(best, 1.2);
      else if (k.includes(nq) || (nq.length >= 3 && nq.includes(k) && k.length >= 2)) best = Math.max(best, 1);
      else best = Math.max(best, dice(k, nq));
    }
    const extra = norm([it.style, it.region, it.country, CATS[it.cat]?.ko, ...(it.ingredients || []).map((g) => g.name)].join(" "));
    if (nq.length >= 2 && extra.includes(nq)) best = Math.max(best, 0.6);
    if (best >= min) res.push([best, it]);
  }
  return res.sort((a, b) => b[0] - a[0]);
}
const findById = (id) => allItems().find((x) => x.id === id);

/* ───────── 외부 링크 ───────── */
const SOURCE_INFO = {
  "Vivino": { url: (n) => `https://www.vivino.com/search/wines?q=${enc(n)}`, d: "전 세계 사용자 평점 평균(5점 만점)" },
  "Robert Parker (Wine Advocate)": { url: (n) => `https://www.google.com/search?q=${enc("site:robertparker.com " + n)}`, d: "로버트 파커 와인 애드버킷(100점 만점)" },
  "Wine Spectator": { url: (n) => `https://www.google.com/search?q=${enc("site:winespectator.com " + n)}`, d: "미국 와인 전문지(100점 만점)" },
  "James Suckling": { url: (n) => `https://www.google.com/search?q=${enc("site:jamessuckling.com " + n)}`, d: "제임스 서클링(100점 만점)" },
  "SAKE COMPETITION": { url: () => "https://sakecompetition.com/", d: "일본 최대 규모 시판주 블라인드 품평회" },
  "全国新酒鑑評会": { url: () => "https://www.nrib.go.jp/kan/", d: "일본 주류총합연구소 주최, 100년 이상 역사의 신주 품평회(금상)" },
  "IWC SAKE": { url: () => "https://www.internationalwinechallenge.com/", d: "영국 IWC 사케 부문 — 해외 최대 사케 품평" },
  "Kura Master": { url: () => "https://kuramaster.com/", d: "프랑스 소믈리에 심사 사케 품평회" },
  "さけのわ (Sakenowa)": { url: (n) => `https://www.google.com/search?q=${enc("site:sakenowa.com " + n)}`, d: "일본 최대 사케 체크인 앱 인기 랭킹" },
  "World Whiskies Awards": { url: () => "https://www.worldwhiskiesawards.com/", d: "Whisky Magazine 주관 세계 위스키 어워드" },
  "ISC": { url: () => "https://www.isc.co.uk/", d: "International Spirits Challenge (영국)" },
  "IWSC": { url: () => "https://www.iwsc.net/", d: "International Wine & Spirit Competition (영국)" },
  "San Francisco WSC": { url: () => "https://sfspiritscomp.com/", d: "San Francisco World Spirits Competition" },
  "Whisky Bible": { url: () => "https://whiskybible.com/", d: "Jim Murray's Whisky Bible" },
  "BNIC 등급": { url: () => "https://www.cognac.fr/", d: "꼬냑 사무국(BNIC) 숙성 등급 규정" },
  "中国名酒(全国评酒会)": { url: (n) => `https://www.google.com/search?q=${enc(n + " 中国名酒 全国评酒会")}`, d: "중국 국가 전국평주회(1952~1989) 선정 '명주'" },
  "Concours Mondial de Bruxelles": { url: () => "https://concoursmondial.com/", d: "브뤼셀 국제 품평회 Spirits Selection" },
};
function sourceUrl(src, name) {
  const key = Object.keys(SOURCE_INFO).find((k) => src.startsWith(k) || k.startsWith(src));
  return key ? SOURCE_INFO[key].url(name) : `https://www.google.com/search?q=${enc(src + " " + name)}`;
}
function priceLinks(it) {
  const n = it.en || it.ko;
  const L = [["Wine-Searcher", `https://www.wine-searcher.com/find/${enc(n.replace(/\s+/g, "+"))}`]];
  if (it.cat === "wine") L.push(["Vivino", `https://www.vivino.com/search/wines?q=${enc(n)}`]);
  if (it.cat === "sake") L.push(["楽天 (일본)", `https://search.rakuten.co.jp/search/mall/${enc(it.ja || n)}/`]);
  if (it.cat === "baijiu") L.push(["京东 (중국)", `https://search.jd.com/Search?keyword=${enc(it.zh || it.ja || n)}`]);
  L.push(["Google 쇼핑", `https://www.google.com/search?tbm=shop&q=${enc(n)}`]);
  L.push(["국내 판매처", `https://search.shopping.naver.com/search/all?query=${enc(it.ko || n)}`]);
  return L;
}

/* ───────── 라우팅 ───────── */
const go = (h) => { if (location.hash !== h) location.hash = h; else render(); };
window.addEventListener("hashchange", render);
$("#aiBadge").onclick = () => go("#/settings");
$("#backBtn").onclick = () => history.length > 1 ? history.back() : go("#/search");
$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  go("#/" + b.dataset.tab);
});
function setChrome(tab, title, back = false) {
  document.querySelectorAll("#tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#title").innerHTML = title ?? '<span class="seal">酒</span>술사전';
  $("#backBtn").classList.toggle("hidden", !back);
  const on = AI.aiEnabled();
  const badge = $("#aiBadge"); badge.textContent = on ? "AI 연결" : "AI 꺼짐"; badge.classList.toggle("on", on);
  window.scrollTo(0, 0);
}
function render() {
  const [, route = "search", a, b] = location.hash.split(/[\/?]/).map(decodeURIComponent);
  applyTheme();
  if (route !== "camera") stopCamera();
  if (route === "item") return renderDetail(a, b || "overview");
  if (route === "browse") return renderBrowse(a);
  if (route === "camera") return renderCamera();
  if (route === "ranking") return renderRanking(a || "sake");
  if (route === "settings") return renderSettings();
  return renderSearch(new URLSearchParams(location.hash.split("?")[1] || "").get("q") || "");
}

/* ───────── 공통 렌더 조각 ───────── */
function topScore(it) {
  const r = (it.ratings || []).find((x) => /\d/.test(x.score)) || (it.ratings || [])[0];
  return r ? `<div class="score"><b>${esc(r.score)}</b>${esc(r.src.split(" (")[0])}</div>` : "";
}
function itemRow(it) {
  const c = CATS[it.cat] || { ko: "기타", glyph: "酒" };
  return `<button class="item" data-id="${esc(it.id)}">
    <span class="dot cat-${esc(it.cat)}">${esc(c.glyph)}</span>
    <span class="meta"><div class="name">${esc(it.ko || it.en)}</div>
      <div class="sub">${esc([it.en !== it.ko ? it.en : "", it.ja || it.zh].filter(Boolean).join(" · "))}</div>
      <div class="sub">${esc(c.ko)} · ${esc(it.country || "")} · ${esc(it.style || "")}</div></span>
    ${topScore(it)}</button>`;
}
function bindItems(root = view) {
  root.querySelectorAll(".item[data-id]").forEach((el) => el.onclick = () => go(`#/item/${enc(el.dataset.id)}/overview`));
}
const loadingHTML = (msg) => `<div class="loading"><span class="spinner"></span><span class="lmsg">${esc(msg)}</span></div>`;
const searchIco = `<svg class="s-ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`;

/* ───────── 검색(홈) ───────── */
function renderSearch(q) {
  setChrome("search");
  const recent = store.get("recent", []).map(findById).filter(Boolean).slice(0, 6);
  view.innerHTML = `
    <section class="home-hero">
      <div class="eyebrow">Sommelier's Notebook</div>
      <h2>오늘의 한 잔을<br/>찾아보세요</h2>
      <p>한국어 · English · 日本語 · 中文 모두 검색됩니다</p>
      <form class="searchbox" id="sform">${searchIco}
        <input id="q" type="search" enterkeyhint="search" autocomplete="off" placeholder="예) 獺祭, 오퍼스원, macallan, 茅台" value="${esc(q)}" />
      </form>
    </section>
    <div id="results"></div>`;
  const input = $("#q");
  const draw = () => {
    const v = input.value.trim();
    const out = $("#results");
    if (!v) {
      out.innerHTML = `
        ${AI.aiEnabled() ? "" : `<button class="ai-cta" id="aiCta"><b>✦ AI 연결하기</b><span>라벨 사진 판독 · 조회 시점 최신 시세 · 미수록 술 검색</span></button>`}
        <div class="section-title">주종 둘러보기 <small>${allItems().length}종 수록</small></div>${catGrid()}
        ${recent.length ? `<div class="section-title">최근 본 술</div><div class="list">${recent.map(itemRow).join("")}</div>` : ""}`;
      out.querySelectorAll(".cat-tile").forEach((t) => t.onclick = () => go("#/browse/" + t.dataset.cat));
      const cta = out.querySelector("#aiCta"); if (cta) cta.onclick = () => go("#/settings");
      bindItems(out); return;
    }
    const r = search(v);
    out.innerHTML = `
      <div class="section-title">검색 결과 <small>${r.length}건</small></div>
      ${r.length ? `<div class="list">${r.map(itemRow).join("")}</div>` : `<div class="empty"><span class="glyph">酒</span>수록된 술 중에 없어요.</div>`}
      ${r.length < 3 ? `<div class="section-title">웹에서 바로 찾기</div>
      <div class="linkbtns">${webLinks(v).map(([n, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div>` : ""}
      <button class="btn gold block" id="aiFind" style="margin-top:14px">✦ AI로 “${esc(v)}” 정리해서 보기</button>
      ${AI.aiEnabled() ? "" : `<p class="hint" style="text-align:center">AI 정리는 설정에서 Claude API 키를 넣으면 사용할 수 있어요</p>`}
      <div id="aiOut"></div>`;
    bindItems(out);
    $("#aiFind").onclick = () => aiFullLookup(v);
  };
  input.addEventListener("input", () => { history.replaceState(null, "", "#/search?q=" + enc(input.value)); draw(); });
  $("#sform").onsubmit = (e) => { e.preventDefault(); input.blur(); };
  draw();
}
function webLinks(q) {
  return [
    ["Google 검색", `https://www.google.com/search?q=${enc(q + " 술")}`],
    ["Vivino (와인)", `https://www.vivino.com/search/wines?q=${enc(q)}`],
    ["Wine-Searcher", `https://www.wine-searcher.com/find/${enc(q.trim().replace(/\s+/g, "+"))}`],
    ["さけのわ (사케)", `https://www.google.com/search?q=${enc("site:sakenowa.com " + q)}`],
  ];
}
function catGrid() {
  const keys = Object.keys(CATS);
  return `<div class="cat-grid">${keys.map((k, i) => {
    const c = CATS[k]; const n = DB.filter((x) => x.cat === k).length;
    return `<button class="cat-tile cat-${k} ${i === keys.length - 1 && keys.length % 2 ? "wide" : ""}" data-cat="${k}">
      <span class="glyph">${c.glyph}</span><b>${c.ko}</b><small>${c.en} · ${n}종</small></button>`;
  }).join("")}</div>`;
}
async function aiFullLookup(q) {
  if (!AI.aiEnabled()) { toast("설정 탭에서 Claude API 키를 입력하면 사용할 수 있어요"); return go("#/settings"); }
  const out = $("#aiOut"); const btn = $("#aiFind"); btn.disabled = true;
  out.innerHTML = loadingHTML("웹에서 최신 정보를 모으는 중… (30초~1분)");
  try {
    const it = await AI.fullLookup(q, (m) => { const l = out.querySelector(".lmsg"); if (l) l.textContent = m; });
    const all = store.get("aiItems", {}); all[it.id] = it; store.set("aiItems", all);
    go(`#/item/${enc(it.id)}/overview`);
  } catch (e) { out.innerHTML = `<div class="notice">⚠️ ${esc(e.message)}</div>`; btn.disabled = false; }
}

/* ───────── 분류 ───────── */
function renderBrowse(cat) {
  setChrome("browse", cat && CATS[cat] ? `${CATS[cat].ko} <small style="font-family:var(--sans);font-size:12px;color:var(--muted)">${CATS[cat].en}</small>` : "분류");
  const sel = CATS[cat] ? cat : "all";
  const sorts = { name: "이름순", price: "가격 높은순", priceLow: "가격 낮은순" };
  const sort = store.get("sort", "name");
  view.innerHTML = `
    <div class="chips" id="catChips">
      <button class="chip ${sel === "all" ? "active" : ""}" data-c="">전체</button>
      ${Object.entries(CATS).map(([k, c]) => `<button class="chip ${sel === k ? "active" : ""}" data-c="${k}">${c.emoji} ${c.ko}</button>`).join("")}
    </div>
    <div class="chips" id="sortChips" style="padding-top:0">${Object.entries(sorts).map(([k, v]) => `<button class="chip ${sort === k ? "active" : ""}" data-s="${k}">${v}</button>`).join("")}</div>
    ${sel !== "all" ? `<p class="hint">평가 기준: ${CATS[sel].sources.join(" · ")}</p>` : ""}
    <div class="list" id="blist"></div>`;
  let items = allItems().filter((x) => sel === "all" || x.cat === sel);
  const p = (x) => (x.price?.usd?.[0] ?? 0);
  items.sort(sort === "price" ? (a, b) => p(b) - p(a) : sort === "priceLow" ? (a, b) => p(a) - p(b) : (a, b) => (a.ko || "").localeCompare(b.ko || "", "ko"));
  $("#blist").innerHTML = items.map(itemRow).join("") || `<div class="empty">항목이 없습니다</div>`;
  bindItems();
  $("#catChips").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) go("#/browse/" + b.dataset.c); };
  $("#sortChips").onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) { store.set("sort", b.dataset.s); render(); } };
}

/* ───────── 상세 ───────── */
const ING_LABEL = { wine: "품종", sake: "쌀·정미", whisky: "원료·캐스크", cognac: "포도·크뤼", baijiu: "원료·향형", other: "원료" };
function renderDetail(id, tab) {
  const it = findById(id);
  if (!it) { setChrome("search", "술사전", true); view.innerHTML = `<div class="empty">항목을 찾을 수 없습니다.</div>`; return; }
  const recent = store.get("recent", []).filter((x) => x !== id); recent.unshift(id); store.set("recent", recent.slice(0, 20));
  const c = CATS[it.cat] || { ko: "기타", en: "Other", glyph: "酒" };
  setChrome("search", esc(it.ko || it.en), true);
  const tabs = [["overview", "개요"], ["price", "가격"], ["ingredients", ING_LABEL[it.cat] || "원료"], ["ratings", "평가"], ["pairing", "페어링"]];
  const pr = it.price?.usd;
  view.innerHTML = `
    <section class="hero cat-${esc(it.cat)}">
      <span class="glyph">${esc(c.glyph)}</span>
      <span class="kind">${esc(c.en)} · ${esc(c.ko)}${it.ai ? " · AI" : ""}</span>
      <h2>${esc(it.ko || it.en)}</h2>
      <div class="names">${esc([it.en, it.ja, it.zh].filter((x) => x && x !== it.ko).join("  ·  "))}</div>
      <div class="stats">
        <div class="stat"><small>도수</small><b>${esc(it.abv || "—")}</b></div>
        <div class="stat"><small>산지</small><b>${esc(it.country || "—")}</b></div>
        <div class="stat"><small>참고가</small><b>${pr ? `${fmtUSD(pr[0])}~` : "—"}</b></div>
      </div>
    </section>
    <nav class="dtabs" id="dtabs">${tabs.map(([k, v]) => `<button data-t="${k}" class="${k === tab ? "active" : ""}">${v}</button>`).join("")}</nav>
    <div id="pane"></div>`;
  $("#dtabs").onclick = (e) => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    history.replaceState(null, "", `#/item/${enc(id)}/${b.dataset.t}`);
    document.querySelectorAll("#dtabs button").forEach((x) => x.classList.toggle("active", x === b));
    drawPane(it, b.dataset.t);
  };
  drawPane(it, tab);
}

function drawPane(it, tab) {
  const pane = $("#pane");
  const P = { overview: paneOverview, price: panePrice, ingredients: paneIngredients, ratings: paneRatings, pairing: panePairing }[tab] || paneOverview;
  pane.innerHTML = P(it);
  if (tab === "price") wirePrice(it);
  if (tab === "ratings") wireRatings(it);
}

function paneOverview(it) {
  const t = it.tasting || {};
  return `<div class="panel">
      <p class="lede">${esc(it.desc)}</p>
      <h3>테이스팅 노트</h3>
      <div class="tasting"><div><small>NOSE 향</small>${esc(t.nose || "—")}</div><div><small>PALATE 맛</small>${esc(t.palate || "—")}</div><div><small>FINISH 여운</small>${esc(t.finish || "—")}</div></div>
      <h3>기본 정보</h3>
      <dl class="kv">
        <dt>생산자</dt><dd>${esc(it.producer || "—")}</dd>
        <dt>국가 · 산지</dt><dd>${esc([it.country, it.region].filter(Boolean).join(" · ") || "—")}</dd>
        <dt>스타일</dt><dd>${esc(it.style || "—")}</dd>
        <dt>도수</dt><dd>${esc(it.abv || "—")}</dd>
      </dl>
    </div>
    ${it.ai ? `<div class="notice">✦ AI가 웹 검색으로 정리한 항목입니다 (${ago(it.fetchedAt)}). ${sourcesHTML(it.sources)}</div>` : ""}`;
}

/* 가격 */
function panePrice(it) {
  const p = it.price || {}; const u = p.usd || [];
  const L = priceLinks(it);
  return `<div class="panel">
      <h3>실시간 최신 시세</h3>
      <div id="live">${AI.aiEnabled() ? "" : `<div class="notice">설정에서 Claude API 키를 등록하면 조회 시점의 최신 해외 시세(판매처·환율 포함)를 불러옵니다.</div>`}</div>
      <button class="btn gold block" id="liveBtn" style="margin-top:10px">✦ 최신 시세 · 평가 조회</button>
    </div>
    <div class="panel">
      <h3>참고 가격대 <small style="font-family:var(--sans);font-weight:400;color:var(--muted);font-size:12px">(${esc(p.asOf || window.LIQUOR_ASOF)} 수집)</small></h3>
      <div class="price-card"><div class="price-big">${u.length ? `${fmtUSD(u[0])} – ${fmtUSD(u[1])}` : "—"}</div>
        <div class="price-sub">해외 소매 · USD · ${esc(p.note || "750ml 기준")}</div></div>
      <div class="linkbtns">${L.map(([n, url]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div>
      <div class="notice">참고 가격대는 시점이 지난 값입니다. 의사결정에는 위의 최신 시세를 사용하세요.</div>
    </div>`;
}
function liveHTML(L) {
  const loc = L.priceLocal || {};
  return `<div class="price-card">
      <div class="price-big">${fmtUSD(L.priceUSD?.avg)}</div>
      <div class="price-sub">평균 · 범위 ${fmtUSD(L.priceUSD?.low)} – ${fmtUSD(L.priceUSD?.high)}${loc.avg ? ` · ≈ ${fmtMoney(loc.avg, loc.currency || "KRW")}` : ""}</div>
      <div class="price-sub">기준일 ${esc(L.asOf || "")} · ${esc(L.priceNote || "")}${L.fx ? ` · ${esc(L.fx)}` : ""}</div>
    </div>
    ${(L.offers || []).length ? `<div style="margin-top:8px">${L.offers.map((o) => `<div class="price-row"><span>${o.url ? `<a href="${safeUrl(o.url)}" target="_blank" rel="noopener">${esc(o.seller)}</a>` : esc(o.seller)} <small style="color:var(--muted)">${esc(o.country || "")}</small></span><b>${esc(o.price)}</b></div>`).join("")}</div>` : ""}
    ${L.summary ? `<div class="ai-box"><div class="ai-h">✦ AI 요약</div>${esc(L.summary)}</div>` : ""}
    <div class="price-sub" style="margin-top:8px">조회 ${ago(L.fetchedAt)}</div>${sourcesHTML(L.sources)}`;
}
function sourcesHTML(s) {
  if (!s || !s.length) return "";
  return `<details class="src-links"><summary>출처 ${s.length}건</summary>${s.map((x) => `<a href="${safeUrl(x.url)}" target="_blank" rel="noopener">${esc(x.title)}</a>`).join("")}</details>`;
}
const liveKey = (it) => "live." + it.id;
async function fetchLive(it, box, btn) {
  if (!AI.aiEnabled()) { toast("설정에서 API 키를 먼저 입력해 주세요"); return go("#/settings"); }
  btn && (btn.disabled = true);
  box.innerHTML = loadingHTML("최신 시세를 조회하는 중… (30초~1분)");
  try {
    const L = await AI.liveLookup(it, (m) => { const l = box.querySelector(".lmsg"); if (l) l.textContent = m; });
    store.set(liveKey(it), L);
    return L;
  } catch (e) { box.innerHTML = `<div class="notice">⚠️ ${esc(e.message)}</div>`; }
  finally { btn && (btn.disabled = false); }
}
function wirePrice(it) {
  const box = $("#live"), btn = $("#liveBtn");
  const cached = store.get(liveKey(it));
  if (cached) box.innerHTML = liveHTML(cached);
  const stale = !cached || Date.now() - cached.fetchedAt > 12 * 3600e3;
  btn.onclick = async () => { const L = await fetchLive(it, box, btn); if (L) box.innerHTML = liveHTML(L); };
  if (AI.aiEnabled() && AI.getSettings().autoPrice && stale) btn.onclick();
}

/* 품종/원료 */
function paneIngredients(it) {
  const g = it.ingredients || [];
  const extra = {
    wine: "블렌딩 비율은 빈티지마다 달라질 수 있습니다.",
    sake: "정미보합(精米歩合): 쌀을 깎고 남은 비율. 다이긴죠 ≤50%, 긴죠 ≤60%. 준마이 = 쌀·누룩·물만 사용(양조알코올 무첨가).",
    whisky: "싱글 몰트 = 한 증류소의 100% 맥아 보리. 블렌디드 = 몰트 + 그레인. 버번 = 옥수수 51% 이상, 새 탄화 오크통.",
    cognac: "꼬냑 크뤼: Grande Champagne > Petite Champagne > Borderies > Fins Bois 순. 숙성 등급: VS 2년 / VSOP 4년 / XO 10년 이상.",
    baijiu: "향형: 장향(茅台) · 농향(五粮液·泸州) · 청향(汾酒) · 미향(米香) · 봉향(西凤) 등 12종. 주원료는 수수, 누룩(大曲)은 밀·보리·완두.",
  }[it.cat];
  return `<div class="panel">
      <h3>${esc(ING_LABEL[it.cat] || "원료")} 구성</h3>
      ${g.length ? g.map((x) => `<div class="grape"><b>${esc(x.name)}${x.note ? `<br><small style="color:var(--muted);font-weight:400">${esc(x.note)}</small>` : ""}</b>
        ${x.pct ? `<div class="bar"><i style="width:${Math.min(100, +x.pct)}%"></i></div><span>${esc(x.pct)}%</span>` : `<div style="flex:1"></div><span>${x.pct === 0 ? "보조" : ""}</span>`}</div>`).join("") : `<p>정보 없음</p>`}
      ${it.ingredientNote ? `<div class="notice">${esc(it.ingredientNote)}</div>` : ""}
    </div>
    ${extra ? `<div class="panel"><h3>알아두기</h3><p>${esc(extra)}</p></div>` : ""}`;
}

/* 평가 */
function ratingCard(r, name) {
  const s = String(r.score ?? "—");
  return `<div class="rating"><div class="medal ${s.length > 5 ? "sm" : ""}">${esc(s)}</div>
    <div class="body"><div class="src">${esc(r.src)}</div><div class="note">${esc(r.note || r.detail || "")}</div>
    <div class="note"><a href="${safeUrl(r.url || sourceUrl(r.src, name))}" target="_blank" rel="noopener">출처 확인 ↗</a></div></div></div>`;
}
function paneRatings(it) {
  const c = CATS[it.cat];
  const name = it.en || it.ko;
  return `<div class="panel">
      <h3>공신력 있는 평가</h3>
      ${(it.ratings || []).map((r) => ratingCard(r, name)).join("") || "<p>등록된 평가가 없습니다.</p>"}
      <div class="notice">점수 범위는 최근 빈티지/출품 기준의 통상 범위이며, 정확한 최신 점수는 아래 ‘최신 평가’ 또는 출처에서 확인하세요.</div>
    </div>
    <div class="panel"><h3>최신 평가 · 수상 (AI)</h3><div id="liveR"></div>
      <button class="btn gold block" id="liveRBtn" style="margin-top:10px">✦ 최신 평가 조회</button></div>
    ${c ? `<div class="panel"><h3>${esc(c.ko)} 평가 기관 안내</h3>${c.sources.map((s) => {
      const k = Object.keys(SOURCE_INFO).find((x) => x.startsWith(s) || s.startsWith(x));
      return `<div class="price-row"><span><b>${esc(s)}</b><br><small style="color:var(--muted)">${esc(k ? SOURCE_INFO[k].d : "")}</small></span><a href="${safeUrl(sourceUrl(s, name))}" target="_blank" rel="noopener">↗</a></div>`;
    }).join("")}</div>` : ""}`;
}
function wireRatings(it) {
  const box = $("#liveR"), btn = $("#liveRBtn");
  const draw = (L) => { box.innerHTML = (L.ratings || []).map((r) => ratingCard(r, it.en)).join("") + `<div class="price-sub">조회 ${ago(L.fetchedAt)}</div>` + sourcesHTML(L.sources); };
  const cached = store.get(liveKey(it)); if (cached) draw(cached);
  btn.onclick = async () => { const L = await fetchLive(it, box, btn); if (L) draw(L); };
}

/* 페어링 */
function panePairing(it) {
  const p = it.pairing || {};
  return `<div class="panel">
      <div class="pair-grid">
        <div class="pair-card ok"><h4>잘 어울려요</h4><ul>${(p.good || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
        <div class="pair-card no"><h4>피하세요</h4><ul>${(p.avoid || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
      </div>
      <div class="serve">
        <div><small>서빙 온도</small>${esc(p.temp || "—")}</div>
        <div><small>잔</small>${esc(p.glass || "—")}</div>
        <div><small>디캔팅/브리딩</small>${esc(p.decant || "—")}</div>
      </div>
      ${p.caution ? `<div class="caution"><b>유의사항</b><br>${esc(p.caution)}</div>` : ""}
    </div>
    <div class="notice">공통 유의: 고도주(40%↑)는 물과 함께 천천히, 공복 음용과 탄산음료·에너지음료 혼합은 피하세요. 복용 중인 약이 있다면 음주 전 확인이 필요합니다.</div>`;
}

/* ───────── 촬영 (렌즈 스타일) ───────── */
let camStream = null;
function stopCamera() { if (camStream) { camStream.getTracks().forEach((t) => t.stop()); camStream = null; } }
const ICON = {
  gallery: `<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/></svg>`,
  lens: `<svg viewBox="0 0 24 24"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.2"/></svg>`,
  retake: `<svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>`,
};
function renderCamera() {
  setChrome("camera", "라벨 촬영");
  view.innerHTML = `
    <section class="lens" id="lens">
      <video id="vid" playsinline muted autoplay></video>
      <img id="shot" class="hidden" alt="" />
      <div class="lens-frame"><i></i><i></i><i></i><i></i><div class="scanline hidden" id="scan"></div></div>
      <div class="lens-hint" id="hint">라벨을 프레임 안에 맞춰 주세요</div>
      <div class="lens-ctrl">
        <button class="lens-side" id="gal" aria-label="앨범">${ICON.gallery}<span>앨범</span></button>
        <button class="shutter" id="snap" aria-label="촬영"><span></span></button>
        <button class="lens-side" id="glens" aria-label="Google 렌즈">${ICON.lens}<span>구글 렌즈</span></button>
      </div>
    </section>
    <input id="file" type="file" accept="image/*" class="hidden" />
    <div class="sheet hidden" id="sheet"><div class="grab"></div><div id="camOut"></div></div>`;
  const vid = $("#vid"), file = $("#file");
  let lastBlob = null;

  const startCam = async () => {
    stopCamera();
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
      vid.srcObject = camStream; await vid.play().catch(() => {});
    } catch {
      $("#hint").textContent = "카메라를 열 수 없어요 — 셔터를 누르면 기본 카메라가 열립니다";
      vid.classList.add("hidden");
    }
  };
  const reset = () => {
    $("#shot").classList.add("hidden"); vid.classList.remove("hidden");
    $("#sheet").classList.add("hidden"); $("#scan").classList.add("hidden");
    $("#hint").textContent = "라벨을 프레임 안에 맞춰 주세요"; $("#hint").classList.remove("hidden");
    $("#snap").innerHTML = "<span></span>"; $("#snap").classList.remove("retake");
    if (!camStream) startCam();
  };
  const process = async (dataUrl, base64) => {
    stopCamera();
    lastBlob = await (await fetch(dataUrl)).blob();
    const shot = $("#shot"); shot.src = dataUrl; shot.classList.remove("hidden"); vid.classList.add("hidden");
    $("#scan").classList.remove("hidden"); $("#hint").textContent = AI.aiEnabled() ? "AI가 라벨을 읽는 중…" : "글자를 읽는 중…";
    $("#snap").innerHTML = ICON.retake; $("#snap").classList.add("retake");
    const out = $("#camOut");
    try {
      if (AI.aiEnabled()) await identifyWithAI(base64, out);
      else await identifyWithOCR(dataUrl, out);
    } catch (e) { out.innerHTML = `<div class="notice">⚠️ ${esc(e.message)}</div>${lensActions()}`; wireLensActions(out); }
    $("#scan").classList.add("hidden"); $("#hint").classList.add("hidden");
    $("#sheet").classList.remove("hidden");
  };
  const lensActions = () => `<div class="linkbtns" style="margin-top:12px">
      <button class="btn ghost" data-act="glens">${ICON.lens} 구글 렌즈로 보기</button>
      <button class="btn ghost" data-act="retake">${ICON.retake} 다시 찍기</button></div>`;
  const wireLensActions = (root) => {
    root.querySelectorAll("[data-act=glens]").forEach((b) => b.onclick = () => openGoogleLens(lastBlob));
    root.querySelectorAll("[data-act=retake]").forEach((b) => b.onclick = reset);
  };
  window.__lensActions = { html: lensActions, wire: wireLensActions };

  $("#snap").onclick = async () => {
    if ($("#snap").classList.contains("retake")) return reset();
    if (!camStream || !vid.videoWidth) return file.click();
    const k = Math.min(1, 1568 / Math.max(vid.videoWidth, vid.videoHeight));
    const cv = document.createElement("canvas"); cv.width = Math.round(vid.videoWidth * k); cv.height = Math.round(vid.videoHeight * k);
    cv.getContext("2d").drawImage(vid, 0, 0, cv.width, cv.height);
    const dataUrl = cv.toDataURL("image/jpeg", 0.85);
    $("#lens").classList.add("flash"); setTimeout(() => $("#lens")?.classList.remove("flash"), 250);
    process(dataUrl, dataUrl.split(",")[1]);
  };
  $("#gal").onclick = () => file.click();
  $("#glens").onclick = () => lastBlob ? openGoogleLens(lastBlob) : openGoogleLens(null);
  file.onchange = async () => { const f = file.files?.[0]; if (!f) return; const { dataUrl, base64 } = await shrink(f); process(dataUrl, base64); file.value = ""; };
  startCam();
}
async function openGoogleLens(blob) {
  // 안드로이드: 공유 시트 → "Google 렌즈" 또는 "Google" 앱 선택
  if (blob) {
    const f = new File([blob], "label.jpg", { type: "image/jpeg" });
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], title: "술사전 라벨" }); return; } catch (e) { if (e.name === "AbortError") return; }
    }
  }
  toast(blob ? "공유가 지원되지 않아 구글 렌즈 웹을 엽니다" : "먼저 사진을 찍으면 그 사진을 구글 렌즈로 보낼 수 있어요");
  if (!blob) return;
  window.open("https://lens.google.com/", "_blank", "noopener");
}
function shrink(file, max = 1568) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      const dataUrl = cv.toDataURL("image/jpeg", 0.85);
      URL.revokeObjectURL(img.src);
      res({ dataUrl, base64: dataUrl.split(",")[1] });
    };
    img.onerror = () => rej(new Error("이미지를 열 수 없습니다."));
    img.src = URL.createObjectURL(file);
  });
}
async function identifyWithAI(base64, out) {
  const r = await AI.identifyImage(base64, "image/jpeg");
  const A = window.__lensActions;
  if (!r.found) {
    out.innerHTML = `<h3 class="sheet-h">라벨을 식별하지 못했어요</h3><p class="hint">라벨이 정면으로 크게 보이게 다시 찍어 주세요.${r.labelText ? `<br>읽은 글자: ${esc(r.labelText)}` : ""}</p>${A.html()}`;
    A.wire(out); return;
  }
  const hits = [r.en, r.ko, r.ja, r.zh, ...(r.candidates || [])].filter(Boolean).flatMap((q) => search(q, 0.75));
  const uniq = [...new Map(hits.map((x) => [x.id, x])).values()].slice(0, 5);
  const label = r.ko || r.en;
  out.innerHTML = `<div class="sheet-top"><span class="pill">✦ 신뢰도 ${Math.round((r.confidence || 0) * 100)}%</span></div>
    <h3 class="sheet-h">${esc(label)}${r.vintage ? ` <small>${esc(r.vintage)}</small>` : ""}</h3>
    <p class="hint" style="margin:0 0 10px">${esc([r.en !== label ? r.en : "", r.ja, r.zh, r.producer].filter(Boolean).join(" · "))}</p>
    ${uniq.length ? `<div class="list">${uniq.map(itemRow).join("")}</div>` : ""}
    <button class="btn gold block" id="aiFind" style="margin-top:12px">✦ ${uniq.length ? "웹에서 최신 정보 조회" : `“${esc(label)}” 전체 정보 조회`}</button><div id="aiOut"></div>
    ${A.html()}`;
  bindItems(out); A.wire(out);
  $("#aiFind").onclick = () => aiFullLookup([r.en, r.vintage].filter(Boolean).join(" ") || label);
}
async function identifyWithOCR(dataUrl, out) {
  const A = window.__lensActions;
  if (!window.Tesseract) await new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/tesseract.js@6.0.1/dist/tesseract.min.js";
    s.onload = res; s.onerror = () => rej(new Error("글자 인식 엔진을 불러오지 못했습니다(네트워크 확인)."));
    document.head.appendChild(s);
  });
  const { data } = await window.Tesseract.recognize(dataUrl, "eng+jpn+chi_sim");
  const text = (data.text || "").replace(/\s+/g, " ").trim();
  const tokens = [text, ...text.split(/[\s|]+/).filter((t) => t.length >= 2)];
  const scored = new Map();
  tokens.forEach((t) => search(t).forEach((it, i) => scored.set(it.id, (scored.get(it.id) || 0) + 1 / (i + 1))));
  const list = [...scored].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([id]) => findById(id));
  out.innerHTML = `<h3 class="sheet-h">${list.length ? "이 술인가요?" : "일치하는 술을 찾지 못했어요"}</h3>
    ${list.length ? `<div class="list">${list.map(itemRow).join("")}</div>` : `<p class="hint">구글 렌즈로 보거나, 설정에서 AI를 켜면 라벨을 훨씬 정확하게 읽어요.</p>`}
    ${A.html()}
    <div class="notice">기기 내 글자 인식 결과: ${esc(text.slice(0, 120) || "(없음)")}<br>✦ 설정에서 Claude API 키를 넣으면 AI가 라벨을 직접 판독합니다.</div>`;
  bindItems(out); A.wire(out);
}

/* ───────── 랭킹 ───────── */
const RANK_INFO = {
  sake: { t: "사케 랭킹", d: "일본 SAKE COMPETITION 최신 회차 부문별 결과 + さけのわ 인기 랭킹", links: [["SAKE COMPETITION", "https://sakecompetition.com/"], ["さけのわ ランキング", "https://sakenowa.com/ranking"]] },
  wine: { t: "와인 랭킹", d: "Wine Spectator Top 100 최신호 (참고: James Suckling Top 100)", links: [["WS Top 100", "https://top100.winespectator.com/"], ["Vivino", "https://www.vivino.com/"]] },
  whisky: { t: "위스키 랭킹", d: "World Whiskies Awards 'World's Best' + ISC/IWSC 최고상", links: [["WWA", "https://www.worldwhiskiesawards.com/"], ["ISC", "https://www.isc.co.uk/"]] },
  cognac: { t: "꼬냑 랭킹", d: "IWSC · San Francisco WSC · ISC 꼬냑 부문 최고상", links: [["IWSC", "https://www.iwsc.net/"], ["SFWSC", "https://sfspiritscomp.com/"]] },
  baijiu: { t: "중국술 랭킹", d: "中国名酒(전국평주회) + SFWSC · CMB 바이주 부문 최고상", links: [["SFWSC", "https://sfspiritscomp.com/"], ["CMB Spirits", "https://concoursmondial.com/"]] },
};
function renderRanking(cat) {
  setChrome("ranking", "랭킹");
  const info = RANK_INFO[cat];
  view.innerHTML = `
    <div class="chips" id="rChips">${Object.keys(RANK_INFO).map((k) => `<button class="chip ${k === cat ? "active" : ""}" data-c="${k}">${CATS[k].emoji} ${CATS[k].ko}</button>`).join("")}</div>
    <section class="hero cat-${cat}" style="margin-bottom:12px"><span class="glyph">${CATS[cat].glyph}</span>
      <span class="kind">Latest Ranking</span><h2>${esc(info.t)}</h2><div class="names">${esc(info.d)}</div></section>
    <div class="panel"><div id="rank"></div>
      <button class="btn gold block" id="rankBtn" style="margin-top:10px">✦ 최신 순위 불러오기</button>
      <div class="linkbtns">${info.links.map(([n, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div></div>
    <div class="section-title">술사전 수록 ${esc(CATS[cat].ko)}</div><div class="list">${DB.filter((x) => x.cat === cat).map(itemRow).join("")}</div>`;
  bindItems();
  $("#rChips").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) go("#/ranking/" + b.dataset.c); };
  const box = $("#rank"), btn = $("#rankBtn");
  const draw = (R) => {
    box.innerHTML = `<h3>${esc(R.title || "")}</h3>${(R.items || []).map((x) => {
      const local = search(x.name).concat(x.ko ? search(x.ko) : [])[0];
      return `<div class="rank-row"><span class="rank-no">${esc(x.rank)}</span><div class="r-main"><b>${esc(x.ko || x.name)}</b><small>${esc([x.name !== x.ko ? x.name : "", x.producer, x.detail].filter(Boolean).join(" · "))}</small></div>
        ${local ? `<button class="chip" data-open="${esc(local.id)}">보기</button>` : x.url ? `<a href="${safeUrl(x.url)}" target="_blank" rel="noopener">↗</a>` : ""}</div>`;
    }).join("")}<div class="price-sub">기준 ${esc(R.asOf || "")} · 조회 ${ago(R.fetchedAt)}</div>${R.note ? `<div class="price-sub">${esc(R.note)}</div>` : ""}${sourcesHTML(R.sources)}`;
    box.querySelectorAll("[data-open]").forEach((b) => b.onclick = () => go(`#/item/${enc(b.dataset.open)}/overview`));
  };
  const cached = store.get("rank." + cat);
  if (cached) draw(cached); else if (!AI.aiEnabled()) box.innerHTML = `<p class="hint">API 키를 등록하면 최신 회차 순위를 웹에서 불러옵니다.</p>`;
  btn.onclick = async () => {
    if (!AI.aiEnabled()) { toast("설정에서 API 키를 먼저 입력해 주세요"); return go("#/settings"); }
    btn.disabled = true; box.innerHTML = loadingHTML("최신 순위를 찾는 중… (30초~1분)");
    try { const R = await AI.ranking(cat, (m) => { const l = box.querySelector(".lmsg"); if (l) l.textContent = m; }); store.set("rank." + cat, R); draw(R); }
    catch (e) { box.innerHTML = `<div class="notice">⚠️ ${esc(e.message)}</div>`; }
    finally { btn.disabled = false; }
  };
}

/* ───────── 설정 ───────── */
function applyTheme() {
  const t = store.get("theme", "system");
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}
function renderSettings() {
  setChrome("settings", "설정");
  const s = AI.getSettings();
  view.innerHTML = `
    <div class="panel">
      <h3>✦ AI 연결 (Claude)</h3>
      <p class="hint" style="margin-top:0">라벨 사진 인식, 조회 시점 최신 시세·평가, 최신 랭킹, 수록되지 않은 술 검색에 사용됩니다.</p>
      <div class="field"><label>Claude API 키</label><input id="key" type="password" autocomplete="off" placeholder="sk-ant-..." value="${esc(s.apiKey)}" /></div>
      <div class="field"><label>모델</label><select id="model">${Object.entries(AI.MODELS).map(([k, v]) => `<option value="${k}" ${k === s.model ? "selected" : ""}>${v}</option>`).join("")}</select></div>
      <div class="field"><label>현지 통화 환산</label><select id="cur">${["KRW", "USD", "JPY", "EUR", "CNY"].map((c) => `<option ${c === s.currency ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div class="field"><label><input id="auto" type="checkbox" ${s.autoPrice ? "checked" : ""} style="width:auto;margin-right:6px" />가격 탭을 열면 최신 시세 자동 조회 (12시간 캐시)</label></div>
      <button class="btn block" id="save">저장</button>
      <button class="btn ghost block" id="test" style="margin-top:8px">연결 테스트</button>
      <div class="notice">API 키는 이 기기의 브라우저 저장소에만 보관되며 Anthropic API(api.anthropic.com)로만 전송됩니다. 공용 기기에서는 사용 후 키를 지워 주세요. 웹 검색 조회 1회당 수 센트 수준의 API 비용이 발생할 수 있습니다.</div>
    </div>
    <div class="panel">
      <h3>화면</h3>
      <div class="chips" id="theme" style="margin:0;padding:0">${[["system", "시스템"], ["light", "라이트"], ["dark", "다크"]].map(([k, v]) => `<button class="chip ${store.get("theme", "system") === k ? "active" : ""}" data-t="${k}">${v}</button>`).join("")}</div>
    </div>
    <div class="panel">
      <h3>데이터</h3>
      <p class="hint" style="margin-top:0">수록 ${DB.length}종 · AI 검색 저장 ${Object.keys(store.get("aiItems", {})).length}종 · 기본 데이터 수집 ${esc(window.LIQUOR_ASOF)}</p>
      <button class="btn ghost block" id="clear">캐시(최신 시세·랭킹·AI 항목) 비우기</button>
    </div>`;
  const collect = () => ({ apiKey: $("#key").value.trim(), model: $("#model").value, currency: $("#cur").value, autoPrice: $("#auto").checked });
  $("#save").onclick = () => { AI.saveSettings(collect()); setChrome("settings", "설정"); toast("저장했습니다"); };
  $("#test").onclick = async (e) => {
    AI.saveSettings(collect()); setChrome("settings", "설정");
    e.target.disabled = true; e.target.textContent = "확인 중…";
    try { await AI.ping(); toast("연결 성공 ✓"); } catch (err) { toast("연결 실패: " + err.message); }
    finally { e.target.disabled = false; e.target.textContent = "연결 테스트"; }
  };
  $("#theme").onclick = (e) => { const b = e.target.closest("[data-t]"); if (b) { store.set("theme", b.dataset.t); renderSettings(); applyTheme(); } };
  $("#clear").onclick = () => {
    Object.keys(localStorage).filter((k) => /^sulsajeon\.(live|rank)\./.test(k)).forEach((k) => localStorage.removeItem(k));
    store.del("aiItems"); toast("캐시를 비웠습니다"); renderSettings();
  };
}

/* ───────── 시작 ───────── */
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
render();
