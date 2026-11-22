/* 술사전 — 검색 중심 앱 (외부 AI 연동 없음) */
const CATS = window.CATEGORIES;
const DB = window.LIQUORS;
const $ = (s, r = document) => r.querySelector(s);
const view = $("#view");

/* ───────── 유틸 ───────── */
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => (/^https?:\/\//i.test(u || "") ? esc(u) : "#");
const enc = encodeURIComponent;
const fmtUSD = (n) => (n == null ? "—" : "$" + Number(n).toLocaleString("en-US"));
const store = {
  get(k, d) { try { const v = localStorage.getItem("sulsajeon." + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("sulsajeon." + k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem("sulsajeon." + k); } catch {} },
};
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.add("hidden"), 2600);
}
const googleUrl = (q) => `https://www.google.com/search?q=${enc(q)}`;

/* ───────── 한글 검색 엔진 (초성 · 부분 · 조합 중 글자) ───────── */
const CHO = "ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ";
const JONG = ["", "ㄱ", "ㄲ", "ㄳ", "ㄴ", "ㄵ", "ㄶ", "ㄷ", "ㄹ", "ㄺ", "ㄻ", "ㄼ", "ㄽ", "ㄾ", "ㄿ", "ㅀ", "ㅁ", "ㅂ", "ㅄ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
// 입력 중인 마지막 글자의 받침이 사실은 다음 글자의 초성일 수 있음: [남는 받침, 다음 초성]
const JONG_SPLIT = {};
JONG.forEach((j, i) => { if (i && CHO.includes(j)) JONG_SPLIT[i] = [0, j]; });
Object.assign(JONG_SPLIT, { 3: [1, "ㅅ"], 5: [4, "ㅈ"], 6: [4, "ㅎ"], 9: [8, "ㄱ"], 10: [8, "ㅁ"], 11: [8, "ㅂ"], 12: [8, "ㅅ"], 13: [8, "ㅌ"], 14: [8, "ㅍ"], 15: [8, "ㅎ"], 18: [17, "ㅅ"] });

function dec(ch) {
  const c = (ch || "").charCodeAt(0) - 0xac00;
  if (!(c >= 0 && c <= 11171)) return null;
  return { cho: (c / 588) | 0, jung: ((c % 588) / 28) | 0, jong: c % 28 };
}
const isJamo = (ch) => ch >= "ㄱ" && ch <= "ㆎ";
const hasHangul = (s) => /[가-힣ㄱ-ㆎ]/.test(s);

/** 정규화: 한글(완성형·자모)은 보존, 나머지는 NFKC + 악센트 제거 + 소문자, 가타카나→히라가나, 공백·기호 제거 */
function norm(s) {
  let out = "";
  for (const ch of String(s || "")) {
    if (dec(ch) || isJamo(ch)) { out += ch; continue; }
    out += ch.normalize("NFKC").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  }
  return out
    .replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[\s·・.,'’"\-–_()（）\/&!?:;]/g, "");
}

/** q가 t의 i 위치부터 일치하는지 (초성/조합 중 글자 허용) */
function matchAt(t, i, q) {
  const last = q.length - 1;
  for (let j = 0; j <= last; j++) {
    const qc = q[j], tc = t[i + j];
    if (tc === undefined) return false;
    if (CHO.includes(qc)) {                       // 초성 한 글자: 해당 초성으로 시작하는 음절이면 OK
      const d = dec(tc);
      if (!(tc === qc || (d && CHO[d.cho] === qc))) return false;
      continue;
    }
    const qd = dec(qc);
    if (qd && j === last) {                       // 마지막 음절은 조합 중일 수 있음
      const td = dec(tc);
      if (!td || td.cho !== qd.cho || td.jung !== qd.jung) return false;
      if (qd.jong === 0 || td.jong === qd.jong) continue;
      const sp = JONG_SPLIT[qd.jong];             // 예: '벤' → '베' + 다음 글자 초성 'ㄴ'
      if (sp && td.jong === sp[0]) {
        const nx = t[i + j + 1], nd = dec(nx);
        if ((nd && CHO[nd.cho] === sp[1]) || nx === sp[1]) continue;
      }
      return false;
    }
    if (tc !== qc) return false;                  // 그 밖의 문자는 정확히 일치
  }
  return true;
}
/** 0(불일치) ~ 1.3(앞부분 일치) */
function korScore(t, q) {
  if (!q || q.length > t.length + 1) return 0;
  for (let i = 0; i + q.length <= t.length + 0; i++) if (matchAt(t, i, q)) return i === 0 ? 1.3 : 1.1;
  return 0;
}
const bigrams = (s) => { const a = new Set(); for (let i = 0; i < s.length - 1; i++) a.add(s.slice(i, i + 2)); return a; };
function dice(a, b) {
  if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;
  const A = bigrams(a), B = bigrams(b); let n = 0; A.forEach((x) => B.has(x) && n++);
  return (2 * n) / (A.size + B.size);
}

// 검색 인덱스 (한 번만 계산)
const INDEX = DB.map((it) => ({
  it,
  keys: [...new Set([it.ko, it.en, it.ja, it.zh, ...(it.aliases || [])].filter(Boolean).map(norm))],
  extra: norm([it.producer, it.style, it.region, it.country, CATS[it.cat]?.ko, ...(it.ingredients || []).map((g) => g.name)].join(" ")),
}));

function search(q, limit = 50) {
  const nq = norm(q); if (!nq) return [];
  const kor = hasHangul(nq);
  const extraOk = kor ? (nq.match(/[\uac00-\ud7a3]/g) || []).length >= 2 : nq.length >= 2;
  const res = [];
  for (const { it, keys, extra } of INDEX) {
    let best = 0;
    for (const k of keys) {
      if (kor) best = Math.max(best, korScore(k, nq));
      else if (k.startsWith(nq)) best = Math.max(best, 1.3);
      else if (k.includes(nq)) best = Math.max(best, 1.1);
      else if (nq.length >= 3) best = Math.max(best, dice(k, nq) >= 0.5 ? dice(k, nq) : 0);
    }
    // 생산자·스타일·산지 등 보조 필드는 완성 글자 2자 이상일 때만 (초성 검색 잡음 방지)
    if (!best && extraOk && (kor ? korScore(extra, nq) : extra.includes(nq))) best = 0.6;
    if (best) res.push([best, it]);
  }
  return res.sort((a, b) => b[0] - a[0] || (a[1].ko || "").localeCompare(b[1].ko || "", "ko")).slice(0, limit).map((r) => r[1]);
}
const findById = (id) => DB.find((x) => x.id === id);

/* ───────── 구글 자동완성 (JSONP) ───────── */
let sugSeq = 0;
function jsonp(url, ms = 3000) {
  return new Promise((resolve, reject) => {
    const cb = "__sulsajeon_gs" + (++sugSeq);
    const s = document.createElement("script");
    const done = () => { clearTimeout(timer); delete window[cb]; s.remove(); };
    const timer = setTimeout(() => { done(); reject(new Error("timeout")); }, ms);
    window[cb] = (data) => { done(); resolve(data); };
    s.onerror = () => { done(); reject(new Error("load error")); };
    s.src = url + "&callback=" + cb;
    document.head.appendChild(s);
  });
}
async function googleSuggest(q) {
  const data = await jsonp(`https://suggestqueries.google.com/complete/search?client=chrome&hl=ko&gl=kr&q=${enc(q)}`);
  const list = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
  return list.map((x) => (Array.isArray(x) ? x[0] : x)).filter((x) => typeof x === "string" && x.trim()).slice(0, 8);
}

/* ───────── 카메라 → 구글 렌즈 ───────── */
const camInput = $("#camInput");
function openCamera() { camInput.value = ""; camInput.click(); }
camInput.addEventListener("change", async () => {
  const f = camInput.files?.[0]; if (!f) return;
  let shot;
  try { shot = await shrink(f); } catch { toast("사진을 열 수 없어요"); return; }
  showLensSheet(shot);
  // 1차: 자동으로 구글 렌즈에 업로드 (팝업이 막히면 시트의 버튼으로 한 번 더 시도)
  if (!uploadToLens(shot, true)) toast("‘구글 렌즈로 검색’을 눌러 주세요");
});
function shrink(file, max = 1600) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.width * k); cv.height = Math.round(img.height * k);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      URL.revokeObjectURL(img.src);
      cv.toBlob((blob) => blob ? res({ blob, w: cv.width, h: cv.height, url: URL.createObjectURL(blob) }) : rej(new Error("encode")), "image/jpeg", 0.88);
    };
    img.onerror = () => rej(new Error("image"));
    img.src = URL.createObjectURL(file);
  });
}
/** 사진을 구글 렌즈에 multipart POST. 성공적으로 전송 시도하면 true */
function uploadToLens(shot, auto = false) {
  let fileOk = false;
  const form = document.createElement("form");
  form.method = "POST"; form.enctype = "multipart/form-data"; form.style.display = "none";
  form.action = `https://lens.google.com/v3/upload?hl=ko&st=${Date.now()}`;
  const fi = document.createElement("input"); fi.type = "file"; fi.name = "encoded_image";
  try {
    const dt = new DataTransfer();
    dt.items.add(new File([shot.blob], "label.jpg", { type: "image/jpeg" }));
    fi.files = dt.files; fileOk = fi.files.length === 1;
  } catch { fileOk = false; }
  if (!fileOk) {                       // 자동 업로드 불가 → 렌즈 페이지를 열어 직접 선택
    if (!auto) openLensPage();
    return false;
  }
  const dim = document.createElement("input"); dim.type = "hidden"; dim.name = "processed_image_dimensions"; dim.value = `${shot.w},${shot.h}`;
  form.append(fi, dim);
  const win = window.open("", "sulsajeon_lens");
  if (!win) { form.remove(); return false; }   // 팝업 차단
  form.target = "sulsajeon_lens";
  document.body.appendChild(form); form.submit(); form.remove();
  return true;
}
function openLensPage() {
  window.open("https://lens.google.com/", "_blank", "noopener");
  toast("렌즈 화면에서 방금 찍은 사진을 선택해 주세요");
}
async function shareToLens(shot) {
  const f = new File([shot.blob], "label.jpg", { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [f] })) {
    try { await navigator.share({ files: [f] }); } catch {}
  } else toast("이 기기에서는 공유를 지원하지 않아요");
}
function showLensSheet(shot) {
  $("#lensSheet")?.remove();
  const el = document.createElement("div");
  el.id = "lensSheet"; el.className = "sheet-wrap";
  el.innerHTML = `<div class="sheet-bg"></div><div class="sheet">
      <div class="grab"></div>
      <img class="shot" src="${shot.url}" alt="찍은 사진" />
      <h3 class="sheet-h">구글 렌즈로 이 술 찾기</h3>
      <button class="btn block" data-a="lens"><svg viewBox="0 0 24 24"><path d="M4 9V6a2 2 0 0 1 2-2h3M15 4h3a2 2 0 0 1 2 2v3M20 15v3a2 2 0 0 1-2 2h-3M9 20H6a2 2 0 0 1-2-2v-3"/><circle cx="12" cy="12" r="3.2"/></svg> 구글 렌즈로 검색</button>
      <div class="linkbtns">
        <button class="btn ghost" data-a="page">렌즈 페이지 열기</button>
        <button class="btn ghost" data-a="share">공유로 렌즈 열기</button>
      </div>
      <button class="btn ghost block" data-a="retake" style="margin-top:8px">다시 찍기</button>
      <p class="hint" style="text-align:center;margin-bottom:0">자동 업로드가 안 되면 ‘렌즈 페이지 열기’ 후 사진을 선택하세요</p>
    </div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector(".sheet-bg").onclick = close;
  el.querySelector("[data-a=lens]").onclick = () => uploadToLens(shot) || openLensPage();
  el.querySelector("[data-a=page]").onclick = openLensPage;
  el.querySelector("[data-a=share]").onclick = () => shareToLens(shot);
  el.querySelector("[data-a=retake]").onclick = () => { close(); openCamera(); };
}

/* ───────── 외부 링크 ───────── */
const SOURCE_INFO = {
  "Vivino": { url: (n) => `https://www.vivino.com/search/wines?q=${enc(n)}`, d: "전 세계 사용자 평점 평균(5점 만점)" },
  "Robert Parker (Wine Advocate)": { url: (n) => googleUrl("site:robertparker.com " + n), d: "로버트 파커 와인 애드버킷(100점 만점)" },
  "Wine Spectator": { url: (n) => googleUrl("site:winespectator.com " + n), d: "미국 와인 전문지(100점 만점)" },
  "James Suckling": { url: (n) => googleUrl("site:jamessuckling.com " + n), d: "제임스 서클링(100점 만점)" },
  "SAKE COMPETITION": { url: () => "https://sakecompetition.com/", d: "일본 최대 규모 시판주 블라인드 품평회" },
  "全国新酒鑑評会": { url: () => "https://www.nrib.go.jp/kan/", d: "일본 주류총합연구소 주최 신주 품평회(금상)" },
  "IWC SAKE": { url: () => "https://www.internationalwinechallenge.com/", d: "영국 IWC 사케 부문" },
  "Kura Master": { url: () => "https://kuramaster.com/", d: "프랑스 소믈리에 심사 사케 품평회" },
  "さけのわ (Sakenowa)": { url: (n) => googleUrl("site:sakenowa.com " + n), d: "일본 최대 사케 체크인 앱 인기 랭킹" },
  "World Whiskies Awards": { url: () => "https://www.worldwhiskiesawards.com/", d: "Whisky Magazine 주관 세계 위스키 어워드" },
  "ISC": { url: () => "https://www.isc.co.uk/", d: "International Spirits Challenge (영국)" },
  "IWSC": { url: () => "https://www.iwsc.net/", d: "International Wine & Spirit Competition (영국)" },
  "San Francisco WSC": { url: () => "https://sfspiritscomp.com/", d: "San Francisco World Spirits Competition" },
  "Whisky Bible": { url: () => "https://whiskybible.com/", d: "Jim Murray's Whisky Bible" },
  "BNIC 등급": { url: () => "https://www.cognac.fr/", d: "꼬냑 사무국(BNIC) 숙성 등급 규정" },
  "中国名酒(全国评酒会)": { url: (n) => googleUrl(n + " 中国名酒 全国评酒会"), d: "중국 전국평주회(1952~1989) 선정 '명주'" },
  "Untappd": { url: (n) => `https://untappd.com/search?q=${enc(n)}`, d: "세계 최대 맥주 체크인 앱 평점(5점 만점)" },
  "RateBeer": { url: (n) => googleUrl("site:ratebeer.com " + n), d: "맥주 평점 커뮤니티(100점 환산)" },
  "World Beer Cup": { url: () => "https://www.worldbeercup.org/", d: "미국 양조협회 주최 세계 맥주 대회" },
  "대한민국 우리술 품평회": { url: (n) => googleUrl(n + " 대한민국 우리술 품평회"), d: "농림축산식품부 주최 전통주 품평회" },
  "대한민국주류대상": { url: (n) => googleUrl(n + " 대한민국주류대상"), d: "국내 주류 시장 소비자·전문가 평가 시상" },
  "Concours Mondial de Bruxelles": { url: () => "https://concoursmondial.com/", d: "브뤼셀 국제 품평회 Spirits Selection" },
};
function sourceUrl(src, name) {
  const key = Object.keys(SOURCE_INFO).find((k) => src.startsWith(k) || k.startsWith(src));
  return key ? SOURCE_INFO[key].url(name) : googleUrl(src + " " + name);
}
function priceLinks(it) {
  const n = it.en || it.ko;
  const L = [["Wine-Searcher", `https://www.wine-searcher.com/find/${enc(n.replace(/\s+/g, "+"))}`]];
  if (it.cat === "wine") L.push(["Vivino", `https://www.vivino.com/search/wines?q=${enc(n)}`]);
  if (it.cat === "sake") L.push(["楽天 (일본)", `https://search.rakuten.co.jp/search/mall/${enc(it.ja || n)}/`]);
  if (it.cat === "baijiu") L.push(["京东 (중국)", `https://search.jd.com/Search?keyword=${enc(it.zh || it.ja || n)}`]);
  L.push(["Google 쇼핑", `https://www.google.com/search?tbm=shop&q=${enc(n)}`]);
  L.push(["네이버 쇼핑", `https://search.shopping.naver.com/search/all?query=${enc(it.ko || n)}`]);
  return L;
}

/* ───────── 라우팅 ───────── */
const go = (h) => { if (location.hash !== h) location.hash = h; else render(); };
window.addEventListener("hashchange", render);
$("#backBtn").onclick = () => (history.length > 1 ? history.back() : go("#/search"));
$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  if (b.dataset.tab === "camera") return openCamera();
  go("#/" + b.dataset.tab);
});
function setChrome(tab, title, back = false) {
  document.querySelectorAll("#tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#title").innerHTML = title ?? '<span class="seal">酒</span>술사전';
  $("#backBtn").classList.toggle("hidden", !back);
  window.scrollTo(0, 0);
}
function render() {
  const [, route = "search", a, b] = location.hash.split(/[\/?]/).map(decodeURIComponent);
  applyTheme();
  if (route === "item") return renderDetail(a, b || "overview");
  if (route === "web") return renderWeb(a || "", b || "overview");
  if (route === "browse") return renderBrowse(a);
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
  root.querySelectorAll(".item[data-id]").forEach((el) => (el.onclick = () => go(`#/item/${enc(el.dataset.id)}/overview`)));
}
const ICO = {
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  cam: `<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></svg>`,
  fill: `<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>`,
  g: `<svg viewBox="0 0 24 24"><path d="M21 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.1a4.4 4.4 0 0 1-1.9 2.9v2.4h3.1c1.8-1.7 2.7-4.1 2.7-7z" fill="#4285F4" stroke="none"/><path d="M12 21.5c2.6 0 4.7-.9 6.3-2.3l-3.1-2.4c-.9.6-2 .9-3.2.9-2.5 0-4.6-1.7-5.3-3.9H3.5v2.5A9.5 9.5 0 0 0 12 21.5z" fill="#34A853" stroke="none"/><path d="M6.7 13.8a5.7 5.7 0 0 1 0-3.6V7.7H3.5a9.5 9.5 0 0 0 0 8.6z" fill="#FBBC05" stroke="none"/><path d="M12 6.3c1.4 0 2.6.5 3.6 1.4l2.7-2.7A9.5 9.5 0 0 0 3.5 7.7l3.2 2.5C7.4 8 9.5 6.3 12 6.3z" fill="#EA4335" stroke="none"/></svg>`,
};

/* ───────── 검색(홈) ───────── */
function renderSearch(q) {
  setChrome("search");
  view.innerHTML = `
    <section class="home-hero">
      <div class="eyebrow">Sommelier's Notebook</div>
      <h2>오늘의 한 잔을<br/>찾아보세요</h2>
      <p>초성(ㅂㅂㄴ) · 한국어 · English · 日本語 · 中文</p>
      <form class="searchbox" id="sform" role="search">
        <span class="s-ico">${ICO.search}</span>
        <input id="q" type="search" enterkeyhint="search" autocomplete="off" autocapitalize="off" spellcheck="false"
          placeholder="예) ㅂㅂㄴ, 발베, 獺祭" value="${esc(q)}" />
        <button type="button" class="cam-btn" id="camBtn" aria-label="카메라로 검색">${ICO.cam}</button>
      </form>
    </section>
    <div id="results"></div>`;
  const input = $("#q");
  $("#camBtn").onclick = openCamera;
  let sugTimer = 0, lastQ = null;

  const draw = () => {
    const v = input.value.trim();
    if (v === lastQ) return; lastQ = v;
    history.replaceState(null, "", v ? "#/search?q=" + enc(v) : "#/search");
    const out = $("#results");
    if (!v) { drawHome(out); return; }
    const r = search(v, 30);
    out.innerHTML = `
      <div class="section-title">술사전 <small>${r.length ? `${r.length}건` : "일치 없음"}</small></div>
      ${r.length ? `<div class="list">${r.map(itemRow).join("")}</div>` : `<p class="hint">수록된 ${DB.length}종 중에는 없어요. 아래 구글 검색을 이용해 보세요.</p>`}
      <div id="sugBox" class="hidden"><div class="section-title">구글 추천 검색어</div><div class="sug" id="sugList"></div></div>
      <a class="gsearch" href="${safeUrl(googleUrl(v))}" target="_blank" rel="noopener">${ICO.g}<span>구글에서 ‘<b>${esc(v)}</b>’ 검색</span><i>↗</i></a>`;
    bindItems(out);
    clearTimeout(sugTimer);
    sugTimer = setTimeout(() => loadSuggest(v), 150);
  };
  const loadSuggest = async (v) => {
    try {
      const list = await googleSuggest(v);
      if (input.value.trim() !== v) return;           // 그 사이 입력이 바뀌면 버림
      const box = $("#sugBox"); if (!box) return;
      if (!list.length) { box.classList.add("hidden"); return; }
      $("#sugList").innerHTML = list.map((s) => `
        <div class="sug-row"><a href="#/web/${enc(s)}">${ICO.search}<span>${esc(s)}</span></a>
        <button class="sug-fill" data-s="${esc(s)}" aria-label="검색창에 넣기">${ICO.fill}</button></div>`).join("");
      $("#sugList").querySelectorAll(".sug-fill").forEach((b) => (b.onclick = () => { input.value = b.dataset.s; input.focus(); draw(); }));
      box.classList.remove("hidden");
    } catch {
      $("#sugBox")?.classList.add("hidden");           // 자동완성 실패 시 이 목록만 숨김
    }
  };
  // 조합 중인 글자까지 반영: input + composition 이벤트 모두 사용
  ["input", "compositionupdate", "compositionend", "keyup"].forEach((ev) => input.addEventListener(ev, () => requestAnimationFrame(draw)));
  $("#sform").onsubmit = (e) => {
    e.preventDefault(); input.blur();
    const v = input.value.trim(); if (!v) return;
    const r = search(v, 2);
    go(r.length === 1 ? `#/item/${enc(r[0].id)}/overview` : `#/web/${enc(v)}/overview`);
  };
  draw();
}
function drawHome(out) {
  const recent = store.get("recent", []).map(findById).filter(Boolean).slice(0, 6);
  out.innerHTML = `
    <div class="section-title">주종 둘러보기 <small>${DB.length}종 수록</small></div>${catGrid()}
    ${recent.length ? `<div class="section-title">최근 본 술</div><div class="list">${recent.map(itemRow).join("")}</div>` : ""}`;
  out.querySelectorAll(".cat-tile").forEach((t) => (t.onclick = () => go("#/browse/" + t.dataset.cat)));
  bindItems(out);
}
function catGrid() {
  const keys = Object.keys(CATS).filter((k) => DB.some((x) => x.cat === k));
  return `<div class="cat-grid">${keys.map((k, i) => {
    const c = CATS[k]; const n = DB.filter((x) => x.cat === k).length;
    return `<button class="cat-tile cat-${k} ${i === keys.length - 1 && keys.length % 2 ? "wide" : ""}" data-cat="${k}">
      <span class="glyph">${c.glyph}</span><b>${c.ko}</b><small>${c.en} · ${n}종</small></button>`;
  }).join("")}</div>`;
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
      ${Object.entries(CATS).filter(([k]) => DB.some((x) => x.cat === k)).map(([k, c]) => `<button class="chip ${sel === k ? "active" : ""}" data-c="${k}">${c.emoji} ${c.ko}</button>`).join("")}
    </div>
    <div class="chips" id="sortChips" style="padding-top:0">${Object.entries(sorts).map(([k, v]) => `<button class="chip ${sort === k ? "active" : ""}" data-s="${k}">${v}</button>`).join("")}</div>
    ${sel !== "all" ? `<p class="hint">평가 기준: ${CATS[sel].sources.join(" · ")}</p>` : ""}
    <div class="list" id="blist"></div>`;
  const items = DB.filter((x) => sel === "all" || x.cat === sel);
  const p = (x) => x.price?.usd?.[0] ?? 0;
  items.sort(sort === "price" ? (a, b) => p(b) - p(a) : sort === "priceLow" ? (a, b) => p(a) - p(b) : (a, b) => (a.ko || "").localeCompare(b.ko || "", "ko"));
  $("#blist").innerHTML = items.map(itemRow).join("") || `<div class="empty">항목이 없습니다</div>`;
  bindItems();
  $("#catChips").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) go("#/browse/" + b.dataset.c); };
  $("#sortChips").onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) { store.set("sort", b.dataset.s); render(); } };
}

/* ───────── 상세 ───────── */
const ING_LABEL = { wine: "품종", sake: "쌀·정미", whisky: "원료·캐스크", cognac: "포도·크뤼", baijiu: "원료·향형", soju: "원료", beer: "원료·스타일", other: "원료" };
function renderDetail(id, tab) {
  const it = findById(id);
  if (!it) { setChrome("search", "술사전", true); view.innerHTML = `<div class="empty">항목을 찾을 수 없습니다.</div>`; return; }
  const recent = store.get("recent", []).filter((x) => x !== id); recent.unshift(id); store.set("recent", recent.slice(0, 20));
  renderItem(it, tab, `#/item/${enc(id)}/`);
}
function renderItem(it, tab, base) {
  const c = CATS[it.cat] || CATS.other;
  setChrome("search", esc(it.ko || it.en), true);
  const tabs = [["overview", "개요"], ["price", "가격"], ["ingredients", ING_LABEL[it.cat] || "원료"], ["ratings", "평가"], ["pairing", "페어링"]];
  const pr = it.price?.usd;
  view.innerHTML = `
    <section class="hero cat-${esc(it.cat)} ${it.thumb ? "has-thumb" : ""}">
      <span class="glyph">${esc(c.glyph)}</span>${it.thumb ? `<img class="thumb" src="${safeUrl(it.thumb)}" alt="" referrerpolicy="no-referrer" />` : ""}
      <span class="kind">${esc(c.en)} · ${esc(c.ko)}${it.web ? " · WEB" : ""}</span>
      <h2>${esc(it.ko || it.en)}</h2>
      <div class="names">${esc([it.en, it.ja, it.zh].filter((x) => x && x !== it.ko).join("  ·  "))}</div>
      <div class="stats">
        <div class="stat"><small>도수</small><b>${esc(it.abv || "—")}</b></div>
        <div class="stat"><small>산지</small><b>${esc(it.country || "—")}</b></div>
        <div class="stat"><small>참고가</small><b>${pr ? `${fmtUSD(pr[0])}~` : "시세 탭"}</b></div>
      </div>
    </section>
    <nav class="dtabs" id="dtabs">${tabs.map(([k, v]) => `<button data-t="${k}" class="${k === tab ? "active" : ""}">${v}</button>`).join("")}</nav>
    <div id="pane"></div>`;
  $("#dtabs").onclick = (e) => {
    const b = e.target.closest("[data-t]"); if (!b) return;
    history.replaceState(null, "", base + b.dataset.t);
    document.querySelectorAll("#dtabs button").forEach((x) => x.classList.toggle("active", x === b));
    drawPane(it, b.dataset.t);
  };
  drawPane(it, tab);
}
function drawPane(it, tab) {
  const P = { overview: paneOverview, price: panePrice, ingredients: paneIngredients, ratings: paneRatings, pairing: panePairing }[tab] || paneOverview;
  $("#pane").innerHTML = P(it);
}
function paneOverview(it) {
  const t = it.tasting || {};
  const sim = it.web && it.similar?.length ? `<div class="list">${it.similar.map((id) => findById(id)).filter(Boolean).map(itemRow).join("")}</div>` : "";
  return `${it.web && !it.desc && sim ? `<div class="section-title">이 술을 찾으셨나요?</div>${sim}<div style="height:6px"></div>` : ""}<div class="panel">
      <p class="lede">${esc(it.desc || "공개 백과사전에서 이 술의 설명을 찾지 못했어요. 아래 구글 검색과 각 탭의 출처 링크로 확인해 보세요.")}</p>
      ${it.web ? `<div class="src-line">${it.wikiUrl ? `출처: <a href="${safeUrl(it.wikiUrl)}" target="_blank" rel="noopener">위키백과 ↗</a>${it.qid ? ` · <a href="https://www.wikidata.org/wiki/${esc(it.qid)}" target="_blank" rel="noopener">위키데이터 ↗</a>` : ""}` : "출처: 웹 검색"} · 검색어 ‘${esc(it.query)}’</div>` : ""}
      ${it.tasting ? `<h3>테이스팅 노트</h3>
      <div class="tasting"><div><small>NOSE 향</small>${esc(t.nose || "—")}</div><div><small>PALATE 맛</small>${esc(t.palate || "—")}</div><div><small>FINISH 여운</small>${esc(t.finish || "—")}</div></div>` : ""}
      <h3>기본 정보</h3>
      <dl class="kv">
        <dt>생산자</dt><dd>${esc(it.producer || "—")}</dd>
        <dt>국가 · 산지</dt><dd>${esc([it.country, it.region].filter(Boolean).join(" · ") || "—")}</dd>
        <dt>스타일</dt><dd>${esc(it.style || "—")}</dd>
        <dt>도수</dt><dd>${esc(it.abv || "—")}</dd>
        ${it.inception ? `<dt>출시</dt><dd>${esc(it.inception)}년</dd>` : ""}
        ${it.website ? `<dt>공식 사이트</dt><dd><a href="${safeUrl(it.website)}" target="_blank" rel="noopener">${esc(it.website.replace(/^https?:\/\//, ""))}</a></dd>` : ""}
      </dl>
      <a class="gsearch" style="margin-top:14px" href="${safeUrl(googleUrl(it.en || it.ko))}" target="_blank" rel="noopener">${ICO.g}<span>구글에서 ‘<b>${esc(it.ko || it.en)}</b>’ 더 보기</span><i>↗</i></a>
    </div>
    ${it.web && it.desc && sim ? `<div class="section-title">술사전에 수록된 비슷한 술</div>${sim}` : ""}`;
}
function panePrice(it) {
  const p = it.price || {}; const u = p.usd || [];
  return `<div class="panel">
      ${u.length ? `<h3>참고 가격대 <small style="font-family:var(--sans);font-weight:400;color:var(--muted);font-size:12px">(${esc(p.asOf || window.LIQUOR_ASOF)} 수집)</small></h3>
      <div class="price-card"><div class="price-big">${u.length ? `${fmtUSD(u[0])} – ${fmtUSD(u[1])}` : "—"}</div>
        <div class="price-sub">해외 소매 · USD · ${esc(p.note || "750ml 기준")}</div></div>` : ""}
      <h3>최신 시세 확인</h3>
      <div class="linkbtns">${priceLinks(it).map(([n, url]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div>
      <div class="notice">${u.length ? "참고 가격대는 수집 시점의 값입니다. " : ""}조회 시점 최신 가격은 위 사이트에서 확인하세요.</div>
    </div>`;
}
function paneIngredients(it) {
  const g = it.ingredients || [];
  const extra = {
    wine: "블렌딩 비율은 빈티지마다 달라질 수 있습니다.",
    sake: "정미보합(精米歩合): 쌀을 깎고 남은 비율. 다이긴죠 ≤50%, 긴죠 ≤60%. 준마이 = 쌀·누룩·물만 사용(양조알코올 무첨가).",
    whisky: "싱글 몰트 = 한 증류소의 100% 맥아 보리. 블렌디드 = 몰트 + 그레인. 버번 = 옥수수 51% 이상, 새 탄화 오크통.",
    cognac: "꼬냑 크뤼: Grande Champagne > Petite Champagne > Borderies > Fins Bois 순. 숙성 등급: VS 2년 / VSOP 4년 / XO 10년 이상.",
    soju: "희석식 소주 = 주정(타피오카·쌀 등) + 물 + 감미료. 증류식 소주 = 쌀·보리 등을 발효 후 단식 증류. 막걸리 = 쌀·누룩을 발효한 탁주.",
    beer: "라거 = 하면발효(깔끔), 에일 = 상면발효(풍부한 향), IPA = 홉을 많이 쓴 에일, 스타우트 = 볶은 맥아의 흑맥주.",
    other: "보드카(곡물·감자), 진(주니퍼베리), 럼(사탕수수), 데킬라(블루 아가베) 등 원료에 따라 스타일이 갈린다.",
    baijiu: "향형: 장향(茅台) · 농향(五粮液·泸州) · 청향(汾酒) · 미향(米香) · 봉향(西凤) 등. 주원료는 수수, 누룩(大曲)은 밀·보리·완두.",
  }[it.cat];
  return `<div class="panel">
      <h3>${esc(ING_LABEL[it.cat] || "원료")} 구성</h3>
      ${g.length ? g.map((x) => `<div class="grape"><b>${esc(x.name)}${x.note ? `<br><small style="color:var(--muted);font-weight:400">${esc(x.note)}</small>` : ""}</b>
        ${x.pct ? `<div class="bar"><i style="width:${Math.min(100, +x.pct)}%"></i></div><span>${esc(x.pct)}%</span>` : `<div style="flex:1"></div><span>${x.pct === 0 ? "보조" : ""}</span>`}</div>`).join("") : `<p>정보 없음</p>`}
      ${it.ingredientNote ? `<div class="notice">${esc(it.ingredientNote)}</div>` : ""}
    </div>
    ${extra ? `<div class="panel"><h3>알아두기</h3><p>${esc(extra)}</p></div>` : ""}`;
}
function ratingCard(r, name) {
  const s = String(r.score ?? "—");
  return `<div class="rating"><div class="medal ${s.length > 5 ? "sm" : ""}">${esc(s)}</div>
    <div class="body"><div class="src">${esc(r.src)}</div><div class="note">${esc(r.note || "")}</div>
    <div class="note"><a href="${safeUrl(r.url || sourceUrl(r.src, name))}" target="_blank" rel="noopener">출처 확인 ↗</a></div></div></div>`;
}
function paneRatings(it) {
  const c = CATS[it.cat] || CATS.other, name = it.en || it.ko;
  return `<div class="panel">
      <h3>공신력 있는 평가</h3>
      ${(it.ratings || []).map((r) => ratingCard(r, name)).join("") || "<p>등록된 평가가 없습니다.</p>"}
      <div class="notice">점수는 최근 빈티지/출품 기준 통상 범위이며 '확인'은 출처에서 최신 점수를 보세요.</div>
    </div>
    <div class="panel"><h3>${esc((c || CATS.other).ko)} 평가 기관</h3>${c.sources.map((s) => {
      const k = Object.keys(SOURCE_INFO).find((x) => x.startsWith(s) || s.startsWith(x));
      return `<div class="price-row"><span><b>${esc(s)}</b><br><small style="color:var(--muted)">${esc(k ? SOURCE_INFO[k].d : "")}</small></span><a href="${safeUrl(sourceUrl(s, name))}" target="_blank" rel="noopener">↗</a></div>`;
    }).join("")}</div>`;
}
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
    <div class="notice">공통 유의: 고도주(40%↑)는 물과 함께 천천히, 공복 음용과 탄산·에너지음료 혼합은 피하세요. 복용 중인 약이 있다면 음주 전 확인이 필요합니다.</div>`;
}

/* ───────── 웹 결과 (위키백과 · 위키데이터) ───────── */
const STRIP_WORDS = /\s*(가격|최저가|추천|후기|리뷰|할인|구매|파는\s*곳|판매처?|면세점?|코스트코|이마트|도수|칼로리|맛|종류|안주|price|review|buy)\s*$/i;
function cleanQuery(q) { let s = q.trim(); for (let i = 0; i < 4; i++) s = s.replace(STRIP_WORDS, "").trim(); return s || q.trim(); }
const DRINK_RE = /(술|주류|와인|포도주|위스키|버번|브랜디|코냑|꼬냑|사케|청주|니혼슈|소주|맥주|막걸리|약주|전통주|증류|양조|리큐어|보드카|럼주|데킬라|고량|백주|바이주|샴페인|wine|whisk|bourbon|brandy|cognac|sake|soju|beer|lager|ale\b|liquor|spirit|vodka|\bgin\b|\brum\b|tequila|baijiu|champagne|distill|brew|酒|焼酎|ワイン|ウイスキー|ビール|啤酒)/i;
const CAT_RULES = [
  ["baijiu", /(백주|바이주|고량|baijiu|白酒|高粱|茅台|五粮|汾酒|二锅头|泸州)/i],
  ["sake", /(사케|니혼슈|준마이|긴죠|다이긴죠|일본\s*청주|sake|nihonshu|junmai|ginjo|日本酒|純米|吟醸)/i],
  ["cognac", /(꼬냑|코냑|브랜디|아르마냑|칼바도스|cognac|brandy|armagnac|calvados|ブランデー)/i],
  ["whisky", /(위스키|버번|스카치|whisk|bourbon|scotch|ウイスキー|威士忌)/i],
  ["wine", /(와인|포도주|샴페인|스파클링|프로세코|까바|wine|champagne|prosecco|\bcava\b|ワイン|葡萄酒)/i],
  ["soju", /(소주|막걸리|약주|전통주|탁주|청주|soju|makgeolli|焼酎)/i],
  ["beer", /(맥주|라거|에일|스타우트|beer|lager|\bale\b|stout|\bipa\b|ビール|啤酒)/i],
];
const guessCat = (text) => (CAT_RULES.find(([, re]) => re.test(text)) || ["other"])[0];
function pickPreset(cat, text) {
  const t = text.toLowerCase();
  const map = {
    wine: /스파클링|샴페인|champagne|prosecco|cava|sparkling/.test(t) ? "bubbly" : /모스카토|moscato|스위트|sweet|아이스와인/.test(t) ? "sweet" : /화이트|white|샤르도네|chardonnay|소비뇽 ?블랑|sauvignon blanc|리슬링|riesling/.test(t) ? "whiteCrisp" : /피노 ?누아|pinot noir/.test(t) ? "pinot" : "redFull",
    sake: /긴죠|ginjo|吟醸/.test(t) ? "sakeGinjo" : /생주|나마|nama|生/.test(t) ? "sakeNama" : "sakeJunmai",
    whisky: /아일라|islay|피트|peat|라프로익|laphroaig|아드벡|ardbeg|탈리스커|talisker|라가불린/.test(t) ? "scotchPeat" : /버번|bourbon|테네시|tennessee|켄터키|kentucky|라이 ?위스키|rye/.test(t) ? "bourbon" : /일본|japan|산토리|suntory|니카|nikka/.test(t) ? "japanese" : /셰리|sherry/.test(t) ? "scotchSherry" : /블렌디드|blended/.test(t) ? "blend" : /아일랜드|irish/.test(t) ? "irish" : "scotchLight",
    cognac: "cognac", baijiu: "baijiu", beer: "beer", other: "spirit",
    soju: /막걸리|탁주|makgeolli/.test(t) ? "makgeolli" : "soju",
  };
  return window.PAIRING_PRESETS[map[cat] || "spirit"];
}
async function getJSON(url, ms = 7000) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
  finally { clearTimeout(tm); }
}
async function wikiFind(q) {
  const langs = /[\u3040-\u30ff]/.test(q) ? ["ja", "ko", "en"] : /[\u4e00-\u9fff]/.test(q) && !hasHangul(q) ? ["zh", "ja", "ko", "en"] : /[a-z]/i.test(q) && !hasHangul(q) ? ["en", "ko"] : ["ko", "en"];
  for (const lang of langs) {
    try {
      const s = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${enc(q)}&srlimit=4&format=json&origin=*`);
      const hits = (s?.query?.search || []).map((h) => h.title);
      const sums = await Promise.all(hits.map((t) => getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc(t.replace(/ /g, "_"))}`).catch(() => null)));
      for (const sum of sums) {
        if (!sum || sum.type === "disambiguation") continue;
        if (DRINK_RE.test(`${sum.title} ${sum.description || ""} ${sum.extract || ""}`))
          return { lang, title: sum.title, desc: sum.description || "", extract: sum.extract || "", thumb: sum.thumbnail?.source, url: sum.content_urls?.mobile?.page || sum.content_urls?.desktop?.page, qid: sum.wikibase_item };
      }
    } catch {}
  }
  return null;
}
async function wikidata(qid) {
  const api = "https://www.wikidata.org/w/api.php?format=json&origin=*&action=wbgetentities";
  const d = await getJSON(`${api}&ids=${qid}&props=labels|claims&languages=ko|en|ja|zh`);
  const e = d?.entities?.[qid]; if (!e) return {};
  const vals = (pp) => (e.claims?.[pp] || []).map((c) => c.mainsnak?.datavalue?.value).filter((v) => v != null);
  const ids = (pp) => vals(pp).map((v) => v.id).filter(Boolean);
  const need = [...new Set([...ids("P31"), ...ids("P176"), ...ids("P495"), ...ids("P17"), ...ids("P186"), ...ids("P279")])].slice(0, 45);
  let lab = {};
  if (need.length) { try { lab = (await getJSON(`${api}&ids=${need.join("|")}&props=labels&languages=ko|en`))?.entities || {}; } catch {} }
  const L = (id) => lab[id]?.labels?.ko?.value || lab[id]?.labels?.en?.value;
  const own = (l) => e.labels?.[l]?.value;
  const abv = vals("P2665")[0]?.amount;
  return {
    ko: own("ko"), en: own("en"), ja: own("ja"), zh: own("zh"),
    types: [...ids("P31"), ...ids("P279")].map(L).filter(Boolean),
    maker: ids("P176").map(L).filter(Boolean),
    country: (ids("P495").length ? ids("P495") : ids("P17")).map(L).filter(Boolean),
    materials: ids("P186").map(L).filter(Boolean),
    abv: abv ? `${parseFloat(abv)}%` : "",
    inception: (vals("P571")[0]?.time || "").slice(1, 5),
    website: vals("P856")[0],
  };
}
async function buildWebItem(query) {
  const q = cleanQuery(query);
  const cached = store.get("web." + q);
  if (cached && Date.now() - cached.at < 7 * 864e5) return cached.it;
  let wiki = null, wd = {};
  try { wiki = await wikiFind(q); } catch {}
  if (wiki?.qid) { try { wd = await wikidata(wiki.qid); } catch {} }
  const text = [q, wiki?.title, wiki?.desc, wiki?.extract, ...(wd.types || [])].join(" ");
  const sim = search(q, 4);
  let cat = guessCat(text);
  if (cat === "other" && sim[0]) cat = sim[0].cat;           // 백과 정보가 없으면 가장 비슷한 수록 술의 분류
  const sources = (CATS[cat] || CATS.other).sources;
  const it = {
    id: "web:" + q, web: true, query: q, cat,
    ko: q, en: wd.en || (wiki?.lang === "en" ? wiki.title : ""), ja: wd.ja || "", zh: wd.zh || "",
    alt: wiki && wiki.title !== q ? wiki.title : "",
    producer: (wd.maker || []).join(", "), country: (wd.country || []).join(", "), region: "",
    style: (wd.types || []).slice(0, 2).join(" · ") || wiki?.desc || CATS[cat].ko,
    abv: wd.abv || "", inception: wd.inception || "", website: wd.website || "",
    desc: wiki?.extract || "", wikiUrl: wiki?.url || "", qid: wiki?.qid || "", thumb: wiki?.thumb || "",
    tasting: null,
    ingredients: (wd.materials || []).map((name) => ({ name })),
    price: null,
    ratings: sources.map((src) => ({ src, score: "확인", note: "이 술의 최신 점수·수상 이력은 출처에서 확인" })),
    pairing: pickPreset(cat, text),
    similar: sim.map((x) => x.id),
  };
  if (wiki) store.set("web." + q, { at: Date.now(), it });
  return it;
}
async function renderWeb(query, tab) {
  setChrome("search", esc(cleanQuery(query)), true);
  view.innerHTML = `<div class="skel" style="height:190px;border-radius:22px"></div>
    <div class="skel" style="height:50px;margin-top:10px"></div><div class="skel" style="height:220px;margin-top:10px"></div>
    <p class="hint" style="text-align:center">‘${esc(query)}’ 정보를 모으는 중…</p>`;
  const it = await buildWebItem(query);
  if (!location.hash.startsWith(`#/web/${enc(query)}`)) return;   // 그 사이 다른 화면으로 이동
  if (it.alt) it.en = it.en || it.alt;
  renderItem(it, tab, `#/web/${enc(query)}/`);
}

/* ───────── 랭킹 (공식 출처 바로가기) ───────── */
const RANK_INFO = {
  sake: { t: "사케 랭킹", d: "일본 SAKE COMPETITION 최신 회차 + さけのわ 인기 랭킹", links: [["SAKE COMPETITION", "https://sakecompetition.com/"], ["さけのわ ランキング", "https://sakenowa.com/ranking"], ["全国新酒鑑評会", "https://www.nrib.go.jp/kan/"], ["Kura Master", "https://kuramaster.com/"]] },
  wine: { t: "와인 랭킹", d: "Wine Spectator Top 100 · Vivino · James Suckling", links: [["WS Top 100", "https://top100.winespectator.com/"], ["Vivino", "https://www.vivino.com/"], ["James Suckling", "https://www.jamessuckling.com/"], ["Robert Parker", "https://www.robertparker.com/"]] },
  whisky: { t: "위스키 랭킹", d: "World Whiskies Awards · ISC · IWSC · SFWSC", links: [["WWA", "https://www.worldwhiskiesawards.com/"], ["ISC", "https://www.isc.co.uk/"], ["IWSC", "https://www.iwsc.net/"], ["SFWSC", "https://sfspiritscomp.com/"]] },
  cognac: { t: "꼬냑 랭킹", d: "IWSC · San Francisco WSC · ISC 꼬냑 부문", links: [["IWSC", "https://www.iwsc.net/"], ["SFWSC", "https://sfspiritscomp.com/"], ["ISC", "https://www.isc.co.uk/"], ["BNIC", "https://www.cognac.fr/"]] },
  baijiu: { t: "중국술 랭킹", d: "中国名酒(전국평주회) · SFWSC · CMB 바이주 부문", links: [["SFWSC", "https://sfspiritscomp.com/"], ["CMB Spirits", "https://concoursmondial.com/"], ["中国名酒 검색", googleUrl("中国名酒 名单")], ["IWSC", "https://www.iwsc.net/"]] },
};
function renderRanking(cat) {
  setChrome("ranking", "랭킹");
  const info = RANK_INFO[cat] || RANK_INFO.sake;
  view.innerHTML = `
    <div class="chips" id="rChips">${Object.keys(RANK_INFO).map((k) => `<button class="chip ${k === cat ? "active" : ""}" data-c="${k}">${CATS[k].emoji} ${CATS[k].ko}</button>`).join("")}</div>
    <section class="hero cat-${cat}" style="margin-bottom:12px"><span class="glyph">${CATS[cat].glyph}</span>
      <span class="kind">Official Ranking</span><h2>${esc(info.t)}</h2><div class="names">${esc(info.d)}</div></section>
    <div class="panel"><h3>최신 순위 공식 사이트</h3><div class="linkbtns">${info.links.map(([n, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div></div>
    <div class="section-title">술사전 수록 ${esc(CATS[cat].ko)} <small>${DB.filter((x) => x.cat === cat).length}종</small></div>
    <div class="list">${DB.filter((x) => x.cat === cat).map(itemRow).join("")}</div>`;
  bindItems();
  $("#rChips").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) go("#/ranking/" + b.dataset.c); };
}

/* ───────── 설정 ───────── */
function applyTheme() {
  const t = store.get("theme", "system");
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}
function renderSettings() {
  setChrome("settings", "설정");
  view.innerHTML = `
    <div class="panel">
      <h3>화면</h3>
      <div class="chips" id="theme" style="margin:0;padding:0">${[["system", "시스템"], ["light", "라이트"], ["dark", "다크"]].map(([k, v]) => `<button class="chip ${store.get("theme", "system") === k ? "active" : ""}" data-t="${k}">${v}</button>`).join("")}</div>
    </div>
    <div class="panel">
      <h3>데이터</h3>
      <p class="hint" style="margin-top:0">수록 ${DB.length}종 · 기본 데이터 수집 ${esc(window.LIQUOR_ASOF)}</p>
      <button class="btn ghost block" id="clear">최근 본 기록 지우기</button>
    </div>
    <div class="panel">
      <h3>검색 팁</h3>
      <p>· 초성만: <b>ㅂㅂㄴ</b> → 발베니<br>· 일부 글자: <b>발베</b>, <b>맥캘</b><br>· 섞어서: <b>발ㅂ</b>, <b>참ㅇ</b><br>· 영어·일본어·중국어: <b>macallan</b>, <b>獺祭</b>, <b>茅台</b><br>· 카메라 버튼: 라벨을 찍어 구글 렌즈로 검색</p>
    </div>`;
  $("#theme").onclick = (e) => { const b = e.target.closest("[data-t]"); if (b) { store.set("theme", b.dataset.t); renderSettings(); applyTheme(); } };
  $("#clear").onclick = () => { store.del("recent"); toast("최근 본 기록을 지웠습니다"); };
}

/* ───────── 시작 ───────── */
// 이전 버전에서 저장된 AI 설정·캐시 정리
try { Object.keys(localStorage).filter((k) => /^sulsajeon\.(settings|aiItems|live\.|rank\.)/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch {}
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
render();
