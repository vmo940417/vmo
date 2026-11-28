/* 술사전 — 검색 중심 앱 (외부 AI 연동 없음) */
import { setupCellar } from "./cellar.js";
const CATS = window.CATEGORIES;
const DB = window.LIQUORS;
// 사케 평가는 さけのわ(일본 최대 사케 유저 평점·랭킹)만 사용
for (const it of DB) if (it.cat === "sake") it.ratings = (it.ratings || []).filter((r) => r.src.startsWith("さけのわ"));
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
// 외래어 표기 흔들림 흡수: 까/카, 따/타, 빠/파, 짜/차 · 쟈/자, 죠/조, 쥬/주, 져/저
const TENSE = { 1: 15, 4: 16, 8: 17, 13: 14 };              // ㄲ→ㅋ ㄸ→ㅌ ㅃ→ㅍ ㅉ→ㅊ (초성 인덱스)
const TENSE_J = { "ㄲ": "ㅋ", "ㄸ": "ㅌ", "ㅃ": "ㅍ", "ㅉ": "ㅊ" };
const GLIDE = { 2: 0, 6: 4, 12: 8, 17: 13 };                 // ㅑ→ㅏ ㅕ→ㅓ ㅛ→ㅗ ㅠ→ㅜ (ㅈ·ㅊ 뒤)
function foldKo(ch) {
  const d = dec(ch);
  if (!d) return TENSE_J[ch] || ch;
  let cho = TENSE[d.cho] ?? d.cho, jung = d.jung;
  if ((cho === 12 || cho === 14) && GLIDE[jung] != null) jung = GLIDE[jung];
  return String.fromCharCode(0xac00 + (cho * 21 + jung) * 28 + d.jong);
}
function norm(s) {
  let out = "";
  for (const ch of String(s || "")) {
    if (dec(ch) || isJamo(ch)) { out += foldKo(ch); continue; }
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

/* ───────── 사용자 수정 · 사용자 항목 반영 ───────── */
const EDITS = store.get("edits", {});        // { [id]: {필드} } — 내장 항목 수정분
const USER = store.get("useritems", {});     // { [id]: item } — 웹 결과를 저장한 항목
const EMPTY = (v) => v == null || v === "" || v === "—" || (Array.isArray(v) && !v.length);
function applyFields(it, f) {
  for (const [k, v] of Object.entries(f)) {
    if (k === "krw") it.price = v ? { local: Number(v), cur: "KRW", basis: "직접 입력" } : null;        // 예전 버전 수정분
    else if (k === "usd") it.price = v ? { local: Number(v), cur: "USD", basis: "직접 입력" } : null;
    else if (k === "ingredients") it.ingredients = String(v || "").split(/[,/·]/).map((s) => s.trim()).filter(Boolean).map((name) => ({ name }));
    else it[k] = v;
  }
  if (f.cat) it.pairing = pickPreset(it.cat, [it.ko, it.en, it.style].join(" "));
  it.edited = true;
  return it;
}
for (const [id, f] of Object.entries(EDITS)) { const it = DB.find((x) => x.id === id); if (it) applyFields(it, f); }
for (const u of Object.values(USER)) { if (!DB.some((x) => x.id === u.id)) DB.push(u); }

/* ───────── 검색 인덱스 ───────── */
let INDEX = [];
function buildIndex() {
  INDEX = DB.map((it) => ({
    it,
    keys: [...new Set([it.ko, it.en, it.ja, it.zh, it.query, ...(it.aliases || [])].filter(Boolean).map(norm))],
    extra: norm([it.producer, it.style, it.region, it.country, CATS[it.cat]?.ko, ...(it.ingredients || []).map((g) => g.name)].join(" ")),
  }));
}
buildIndex();
function searchScored(q, limit = 50) {
  const nq = norm(q); if (!nq) return [];
  const kor = hasHangul(nq);
  const extraOk = kor ? (nq.match(/[가-힣]/g) || []).length >= 2 : nq.length >= 2;
  const res = [];
  for (const { it, keys, extra } of INDEX) {
    let best = 0;
    for (const k of keys) {
      if (k === nq) { best = 1.5; break; }
      if (kor) best = Math.max(best, korScore(k, nq));
      else if (k.startsWith(nq)) best = Math.max(best, 1.3);
      else if (k.includes(nq)) best = Math.max(best, 1.1);
      else if (nq.length >= 3) { const d = dice(k, nq); if (d >= 0.5) best = Math.max(best, d); }
    }
    // 생산자·스타일·산지 등 보조 필드는 완성 글자 2자 이상일 때만 (초성 검색 잡음 방지)
    if (!best && extraOk && (kor ? korScore(extra, nq) : extra.includes(nq))) best = 0.6;
    if (best) res.push([best, it]);
  }
  return res.sort((a, b) => b[0] - a[0] || (a[1].ko || "").localeCompare(b[1].ko || "", "ko")).slice(0, limit);
}
const search = (q, limit) => searchScored(q, limit).map((r) => r[1]);
const findById = (id) => DB.find((x) => x.id === id);

/* ───────── 이름으로 종류·품종 추론 ───────── */
const GRAPES = [
  ["까베르네 소비뇽", "Cabernet Sauvignon", /(까베르네|카베르네)\s*소비뇽|cabernet\s*sauvignon/i, "레드"],
  ["까베르네 프랑", "Cabernet Franc", /(까베르네|카베르네)\s*프랑|cabernet\s*franc/i, "레드"],
  ["피노 누아", "Pinot Noir", /피노\s*누아|피노\s*느와|pinot\s*noir/i, "레드"],
  ["메를로", "Merlot", /메를로|멀롯|merlot/i, "레드"],
  ["쉬라즈", "Shiraz/Syrah", /쉬라즈|시라즈|시라(?!노)|shiraz|syrah/i, "레드"],
  ["말벡", "Malbec", /말벡|malbec/i, "레드"],
  ["까르메네르", "Carmenère", /까르메네르|카르메네르|carmen[eè]re/i, "레드"],
  ["진판델", "Zinfandel", /진판델|zinfandel/i, "레드"],
  ["산지오베제", "Sangiovese", /산지오베제|sangiovese|키안티|chianti|브루넬로|brunello/i, "레드"],
  ["네비올로", "Nebbiolo", /네비올로|nebbiolo|바롤로|barolo|바르바레스코|barbaresco/i, "레드"],
  ["템프라니요", "Tempranillo", /템프라니요|tempranillo|리오하|rioja/i, "레드"],
  ["그르나슈", "Grenache/Garnacha", /그르나슈|가르나차|grenache|garnacha/i, "레드"],
  ["가메", "Gamay", /가메|gamay|보졸레|beaujolais/i, "레드"],
  ["프리미티보", "Primitivo", /프리미티보|primitivo/i, "레드"],
  ["몬테풀치아노", "Montepulciano", /몬테풀치아노|montepulciano/i, "레드"],
  ["바르베라", "Barbera", /바르베라|barbera/i, "레드"],
  ["샤르도네", "Chardonnay", /샤르도네|샤도네이|샤도네|chardonnay|샤블리|chablis/i, "화이트"],
  ["소비뇽 블랑", "Sauvignon Blanc", /소비뇽\s*블랑|sauvignon\s*blanc|상세르|sancerre/i, "화이트"],
  ["리슬링", "Riesling", /리슬링|riesling/i, "화이트"],
  ["피노 그리지오", "Pinot Grigio/Gris", /피노\s*그리(지오)?|pinot\s*gri(gio|s)/i, "화이트"],
  ["게뷔르츠트라미너", "Gewürztraminer", /게뷔르츠|gew[uü]rztraminer/i, "화이트"],
  ["비오니에", "Viognier", /비오니에|viognier/i, "화이트"],
  ["슈냉 블랑", "Chenin Blanc", /슈냉\s*블랑|chenin\s*blanc/i, "화이트"],
  ["알바리뇨", "Albariño", /알바리뇨|albari[ñn]o/i, "화이트"],
  ["모스카토", "Moscato", /모스카토|moscato|muscat|뮈스카/i, "스위트"],
];
const NAME_RULES = [
  ["makgeolli", /(막걸리|탁주|동동주|약주|청주(?!.*일본)|전통주|복분자주|매실주|과실주|makgeolli)/i],
  ["soju", /(?<!일본\s?)(소주|희석식|증류식\s*소주|soju)/i],
  ["sake", /(사케|니혼슈|준마이|다이긴죠|긴죠|혼죠조|sake|nihonshu|junmai|ginjo|日本酒|純米|吟醸)/i],
  ["baijiu", /(고량주|백주|바이주|마오타이|우량예|이과두|baijiu|白酒|高粱|茅台|五粮|二锅头)/i],
  ["cognac", /(꼬냑|코냑|브랜디|아르마냑|칼바도스|\bv\.?s\.?o\.?p\b|\bx\.?o\b|cognac|brandy|armagnac|calvados)/i],
  ["whisky", /(위스키|위스키|싱글\s*몰트|블렌디드\s*몰트|버번|스카치|라이\s*위스키|whisk(e)?y|single\s*malt|bourbon|scotch)/i],
  ["beer", /(맥주|라거|에일|\bipa\b|스타우트|필스너|바이젠|둔켈|포터|사워\s*비어|beer|lager|\bale\b|stout|pils(e|ne)r|weiss|porter)/i],
  ["wine", /(와인|포도주|샤또|샤토|도멘|끌로|메종|와이너리|빈야드|에스테이트|그랑\s*크뤼|프르미에|리제르바|레세르바|크리안자|샴페인|스파클링|프로세코|까바|château|chateau|domaine|\bclos\b|winery|vineyard|estate|grand\s*cru|reserva|champagne|prosecco|\bcava\b|wine)/i],
  ["other", /(보드카|\bgin\b|진\s|런던\s*드라이|럼|데킬라|메스칼|리큐어|베르무트|압생트|쇼추|일본\s*소주|vodka|\brum\b|tequila|mezcal|liqueur|vermouth|absinthe|shochu)/i],
];
function inferFromName(name) {
  const s = String(name || "");
  const grapes = GRAPES.filter(([, , re]) => re.test(s));
  let cat = (NAME_RULES.find(([, re]) => re.test(s)) || [null])[0];
  if (!cat && grapes.length) cat = "wine";
  const color = grapes[0]?.[3];
  return {
    cat, grapes: grapes.map(([ko, en]) => ({ name: en, note: ko })),
    style: cat === "wine" && grapes.length ? `${color || "레드"} · ${grapes.map((g) => g[0]).join(" / ")}` : "",
  };
}
const guessCat = (text) => inferFromName(text).cat || "other";
function pickPreset(cat, text) {
  const t = String(text || "").toLowerCase();
  const map = {
    wine: /스파클링|샴페인|champagne|prosecco|cava|sparkling|브뤼|brut/.test(t) ? "bubbly" : /모스카토|moscato|스위트|sweet|아이스와인|포트|port/.test(t) ? "sweet" : /화이트|white|샤르도네|chardonnay|소비뇽 ?블랑|sauvignon blanc|리슬링|riesling|샤블리|chablis/.test(t) ? "whiteCrisp" : /피노 ?누아|pinot noir|부르고뉴|bourgogne|보졸레/.test(t) ? "pinot" : /산지오베제|키안티|chianti|바롤로|barolo|브루넬로/.test(t) ? "italian" : /템프라니요|리오하|rioja/.test(t) ? "spanish" : "redFull",
    sake: /긴죠|ginjo|吟醸/.test(t) ? "sakeGinjo" : /생주|나마|nama|生/.test(t) ? "sakeNama" : "sakeJunmai",
    whisky: /아일라|islay|피트|peat|라프로익|laphroaig|아드벡|ardbeg|탈리스커|talisker|라가불린/.test(t) ? "scotchPeat" : /버번|bourbon|테네시|tennessee|켄터키|kentucky|라이 ?위스키|rye/.test(t) ? "bourbon" : /일본|japan|산토리|suntory|니카|nikka/.test(t) ? "japanese" : /셰리|sherry/.test(t) ? "scotchSherry" : /블렌디드|blended/.test(t) ? "blend" : /아일랜드|irish/.test(t) ? "irish" : "scotchLight",
    cognac: "cognac", baijiu: "baijiu", beer: "beer", soju: "soju",
    makgeolli: /막걸리|탁주|makgeolli/.test(t) ? "makgeolli" : "yakju",
    other: /리큐어|liqueur|베르무트|vermouth/.test(t) ? "liqueur" : /쇼추|shochu|일본 소주/.test(t) ? "shochu" : "spirit",
  };
  return window.PAIRING_PRESETS[map[cat] || "spirit"];
}

/* ───────── 한글 → 영문 표기 (사전 + 로마자 표기) ───────── */
const KO_DICT = {
  "샤또": "Château", "샤토": "Château", "도멘": "Domaine", "끌로": "Clos", "메종": "Maison", "까베르네": "Cabernet", "카베르네": "Cabernet",
  "소비뇽": "Sauvignon", "피노": "Pinot", "누아": "Noir", "샤르도네": "Chardonnay", "샤도네이": "Chardonnay", "메를로": "Merlot", "블랑": "Blanc",
  "루즈": "Rouge", "그랑": "Grand", "크뤼": "Cru", "리제르바": "Riserva", "레세르바": "Reserva", "리저브": "Reserve", "쉬라즈": "Shiraz", "시라": "Syrah",
  "말벡": "Malbec", "리슬링": "Riesling", "모스카토": "Moscato", "브뤼": "Brut", "로제": "Rosé", "레드": "Red", "화이트": "White", "스파클링": "Sparkling",
  "위스키": "Whisky", "싱글몰트": "Single Malt", "싱글": "Single", "몰트": "Malt", "블렌디드": "Blended", "버번": "Bourbon", "스카치": "Scotch",
  "오크": "Oak", "캐스크": "Cask", "셰리": "Sherry", "배럴": "Barrel", "에디션": "Edition", "엑스트라": "Extra", "블루": "Blue", "블랙": "Black",
  "골드": "Gold", "그린": "Green", "레이블": "Label", "라벨": "Label", "퀴베": "Cuvée", "꼬냑": "Cognac", "코냑": "Cognac", "브랜디": "Brandy",
  "맥주": "beer", "라거": "Lager", "에일": "Ale", "스타우트": "Stout", "사케": "sake", "준마이": "Junmai", "다이긴죠": "Daiginjo", "긴죠": "Ginjo",
  "피노누아": "Pinot Noir", "피노느와": "Pinot Noir", "까베르네소비뇽": "Cabernet Sauvignon", "카베르네소비뇽": "Cabernet Sauvignon", "소비뇽블랑": "Sauvignon Blanc",
  "샤또네프": "Châteauneuf", "그랑크뤼": "Grand Cru", "피노그리지오": "Pinot Grigio", "까베르네프랑": "Cabernet Franc",
  "소주": "soju", "막걸리": "makgeolli", "글렌": "Glen", "더블우드": "DoubleWood", "오리지널": "Original", "클래식": "Classic", "프리미엄": "Premium",
};
const BRAND = {};
// 내장 DB에서 한글·영문 이름의 단어 수가 같으면 단어끼리 짝지어 사전을 자동으로 만든다 (예: 무통→Mouton, 알파→Alpha)
const WORD = { "무똥": "Mouton", "로스차일드": "Rothschild", "라피뜨": "Lafite", "마고": "Margaux", "딸보": "Talbot", "탈보": "Talbot", "맥켈란": "Macallan", "글렌피딕": "Glenfiddich" };
for (const it of DB) {
  const kt = (it.ko || "").split(/\s+/), et = (it.en || "").replace(/^the\s+/i, "").replace(/[\[\]()]/g, "").split(/\s+/);
  if (kt.length === et.length && kt.length <= 6) kt.forEach((k, i) => { if (hasHangul(k) && !KO_DICT[k] && !WORD[k] && /^[A-Za-zÀ-ÿ]/.test(et[i])) WORD[k] = et[i]; });
}
for (const it of DB) {
  const k = (it.ko || "").split(/\s+/)[0], e = (it.en || "").replace(/^the\s+/i, "").split(/\s+/)[0];
  if (k && e && !KO_DICT[k] && !BRAND[k] && hasHangul(k) && /^[A-Za-z]/.test(e)) BRAND[k] = e;
}
const RR_CHO = ["g", "kk", "n", "d", "tt", "r", "m", "b", "pp", "s", "ss", "", "j", "jj", "ch", "k", "t", "p", "h"];
const RR_JUNG = ["a", "ae", "ya", "yae", "eo", "e", "yeo", "ye", "o", "wa", "wae", "oe", "yo", "u", "wo", "we", "wi", "yu", "eu", "ui", "i"];
const RR_JONG = ["", "k", "k", "k", "n", "n", "n", "t", "l", "k", "m", "l", "l", "l", "p", "l", "m", "p", "p", "t", "t", "ng", "t", "t", "k", "t", "p", "t"];
function romanize(word) {
  let out = "";
  for (const ch of word) { const d = dec(ch); out += d ? RR_CHO[d.cho] + RR_JUNG[d.jung] + RR_JONG[d.jong] : ch; }
  return out.charAt(0).toUpperCase() + out.slice(1);
}
function toLatin(q) {
  return q.split(/\s+/).filter(Boolean).map((w) => {
    const y = w.match(/^(\d+)년산?$/); if (y) return `${y[1]} Year`;
    if (!hasHangul(w)) return w;
    if (KO_DICT[w]) return KO_DICT[w];
    if (WORD[w]) return WORD[w];
    if (BRAND[w]) return BRAND[w];
    for (const [k, v] of Object.entries(KO_DICT)) {
      if (w.length <= k.length) continue;
      if (w.endsWith(k)) { const h = w.slice(0, -k.length); return `${KO_DICT[h] || WORD[h] || BRAND[h] || romanize(h)} ${v}`; }
      if (w.startsWith(k)) { const t = w.slice(k.length); return `${v} ${KO_DICT[t] || WORD[t] || BRAND[t] || romanize(t)}`; }
    }
    return romanize(w);
  }).join(" ");
}
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

/* ───────── 카메라 → 라벨 읽기(후보 고르기) · 구글 렌즈 ─────────
 * 구글이 외부 사이트에서 lens.google.com 으로 사진을 직접 올리는 요청(POST)을 403으로 막기 때문에,
 * 휴대폰 공유 기능으로 사진을 넘기고 공유 화면에서 'Google 렌즈'(또는 'Google로 검색')를 고르게 한다.
 * 렌즈가 알려 준 이름은 시트의 입력칸에 넣어 바로 수록된 술에서 찾는다. */
const camInput = $("#camInput");
function openCamera() { camInput.value = ""; camInput.click(); }
camInput.addEventListener("change", async () => {
  const f = camInput.files?.[0]; if (!f) return;
  let shot;
  try { shot = await shrink(f); } catch { toast("사진을 열 수 없어요"); return; }
  shot.file = f;   // 라벨 글자 읽기는 더 큰 원본에서 (label-ocr.js)
  showLensSheet(shot);
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
const lensFile = (shot) => new File([shot.blob], "label.jpg", { type: "image/jpeg" });
const canShareShot = (shot) => !!navigator.canShare?.({ files: [lensFile(shot)] });
function openLensPage() {
  window.open("https://lens.google.com/", "_blank", "noopener");
  toast("렌즈 화면에서 방금 찍은 사진을 선택해 주세요");
}
async function shareToLens(shot) {
  if (!canShareShot(shot)) return openLensPage();
  try { await navigator.share({ files: [lensFile(shot)] }); }
  catch (e) { if (e?.name !== "AbortError") openLensPage(); }   // 사용자가 공유 창을 닫은 경우는 그대로 둔다
}
function showLensSheet(shot) {
  $("#lensSheet")?.remove();
  const el = document.createElement("div");
  el.id = "lensSheet"; el.className = "sheet-wrap";
  el.innerHTML = `<div class="sheet-bg"></div><div class="sheet">
      <div class="grab"></div>
      <div class="ocr-top">
        <img class="shot-thumb" src="${shot.url}" alt="찍은 사진" />
        <div><h3 class="sheet-h">사진 속 술 찾기</h3><p class="hint" style="margin:0">라벨 글자를 읽어 비슷한 술을 골라 드려요</p></div>
      </div>
      <div class="ocr-box"></div>
      <form class="lens-name" id="lensName" autocomplete="off">
        <label for="lensQ">후보에 없으면 이름으로 찾기</label>
        <div class="lens-name-row"><input id="lensQ" type="search" enterkeyhint="search" placeholder="예) Aubert Chardonnay" /><button class="btn" type="submit">찾기</button></div>
      </form>
      <div class="linkbtns">
        <button class="btn ghost" type="button" data-a="lens">구글 렌즈로 찾기</button>
        <button class="btn ghost" type="button" data-a="retake">다시 찍기</button>
      </div>
      <p class="hint" style="margin-top:8px">구글 렌즈는 필기체 라벨도 잘 찾아요. 공유 화면에서 <b>Google 렌즈</b>를 고르고, 알아낸 이름을 위 칸에 넣으세요.</p>
    </div>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  const q = el.querySelector("#lensQ");
  window.LabelOCR?.attach(el.querySelector(".ocr-box"), shot, { onText: (t) => { if (!q.value) q.value = t; } });
  el.querySelector(".sheet-bg").onclick = close;
  el.querySelector("[data-a=lens]").onclick = () => shareToLens(shot);
  el.querySelector("[data-a=retake]").onclick = () => { close(); openCamera(); };
  el.querySelector("#lensName").onsubmit = (e) => {
    e.preventDefault();
    const v = q.value.trim(); if (!v) return;
    close(); go(`#/search?q=${enc(v)}`);
  };
}

/* ───────── 외부 링크 ─────────
 * 특정 술 한 건으로 바로 가도록: 구글 '첫 결과로 바로 이동'(btnI) + 사이트·정확한 이름 제한 */
// 구글 검색(사이트 한정). 모바일 구글은 '첫 결과 바로 이동(btnI)'을 무시하므로 결과 맨 위 항목을 한 번 누르는 방식.
// 이름은 따옴표·쉼표·괄호를 빼서 너무 엄격하지 않게 (예: "Domaine de la Romanée-Conti, Romanée-Conti" → 결과 0건 방지)
const cleanName = (n) => String(n || "").replace(/\([^)]*\)/g, " ").replace(/[",]/g, " ").replace(/\s+/g, " ").trim();
const lucky = (q) => googleUrl(q.replace(/"/g, ""));
const quoted = (n) => `"${String(n).replace(/"/g, "")}"`;
/* 출처별: site(도메인 한정 검색) · kw(도메인이 없는 국내 시상은 키워드) · lang(그 출처가 쓰는 이름) · score(점수 형식) */
const SOURCE_INFO = {
  "Vivino": { site: "vivino.com", score: "5", d: "전 세계 사용자 평점 평균(5점 만점)" },
  "Robert Parker (Wine Advocate)": { site: "robertparker.com", score: "100", d: "로버트 파커 와인 애드버킷(100점 만점)" },
  "Wine Spectator": { site: "winespectator.com", score: "100", d: "미국 와인 전문지(100점 만점)" },
  "James Suckling": { site: "jamessuckling.com", score: "100", d: "제임스 서클링(100점 만점)" },
  "さけのわ (Sakenowa)": { site: "sakenowa.com", lang: "ja", score: "5", d: "일본 최대 사케 체크인 앱 인기 랭킹" },
  "World Whiskies Awards": { site: "worldwhiskiesawards.com", score: "medal", d: "Whisky Magazine 주관 세계 위스키 어워드" },
  "ISC": { site: "isc.co.uk", score: "medal", d: "International Spirits Challenge (영국)" },
  "IWSC": { site: "iwsc.net", score: "medal", d: "International Wine & Spirit Competition (영국)" },
  "San Francisco WSC": { site: "sfspiritscomp.com", score: "medal", d: "San Francisco World Spirits Competition" },
  "Whisky Bible": { site: "whiskybible.com", score: "100", d: "Jim Murray's Whisky Bible" },
  "BNIC 등급": { site: "cognac.fr", score: "medal", d: "꼬냑 사무국(BNIC) 숙성 등급 규정" },
  "中国名酒(全国评酒会)": { kw: "中国名酒 全国评酒会", lang: "zh", score: "medal", d: "중국 전국평주회(1952~1989) 선정 '명주'" },
  "Untappd": { site: "untappd.com", score: "5", d: "세계 최대 맥주 체크인 앱 평점(5점 만점)" },
  "RateBeer": { site: "ratebeer.com", score: "100", d: "맥주 평점 커뮤니티(100점 환산)" },
  "World Beer Cup": { site: "worldbeercup.org", score: "medal", d: "미국 양조협회 주최 세계 맥주 대회" },
  "대한민국 우리술 품평회": { kw: "대한민국 우리술 품평회", lang: "ko", score: "medal", d: "농림축산식품부 주최 전통주 품평회" },
  "대한민국주류대상": { kw: "대한민국주류대상", lang: "ko", score: "medal", d: "국내 주류 시장 소비자·전문가 평가 시상" },
  "우리술 대축제": { kw: "우리술 대축제", lang: "ko", score: "medal", d: "한국 전통주 박람회·품평" },
  "Concours Mondial de Bruxelles": { site: "concoursmondial.com", score: "medal", d: "브뤼셀 국제 품평회 Spirits Selection" },
};
const srcKey = (src) => Object.keys(SOURCE_INFO).find((k) => src.startsWith(k) || k.startsWith(src));
// 그 출처가 실제로 쓰는 표기로 검색 (사케는 일본어, 중국술은 한자, 국내 시상은 한글)
function nameFor(it, lang) {
  if (typeof it === "string") return it;
  if (lang === "ja") return it.ja || it.en || it.ko;
  if (lang === "zh") return it.zh || it.ja || it.en || it.ko;
  if (lang === "ko") return it.ko || it.en;
  return it.en || it.ko;
}
function sourceQuery(src, it) {
  const k = srcKey(src), info = k ? SOURCE_INFO[k] : {};
  const n = cleanName(nameFor(it, info.lang));
  return info.site ? `site:${info.site} ${n}` : `${n} ${info.kw || src}`;
}
const sourceUrl = (src, it) => lucky(sourceQuery(src, it));
function priceLinks(it) {
  const n = it.en || it.ko;
  const L = [["Wine-Searcher", `https://www.wine-searcher.com/find/${enc(n.replace(/\s+/g, "+"))}`]];
  if (it.cat === "wine") L.push(["Vivino", (store.get("score." + it.id)?.rs || []).find((r) => r.src === "Vivino" && r.url)?.url || sourceUrl("Vivino", it)]);
  if (it.cat === "sake") L.push(["楽天 (일본)", `https://search.rakuten.co.jp/search/mall/${enc(it.ja || n)}/`]);
  if (it.cat === "baijiu") L.push(["京东 (중국)", `https://search.jd.com/Search?keyword=${enc(it.zh || it.ja || n)}`]);
  L.push(["Google 쇼핑", `https://www.google.com/search?tbm=shop&q=${enc(quoted(n))}`]);
  L.push(["네이버 쇼핑", `https://search.shopping.naver.com/search/all?query=${enc(it.ko || n)}`]);
  return L;
}
/* ───────── 현지가 → USD (실시간 환율) ───────── */
const SYM = { USD: "$", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥", KRW: "₩", AUD: "A$", NZD: "NZ$", CAD: "C$", TWD: "NT$", CLP: "CLP ", ZAR: "R", MXN: "MX$", HUF: "Ft ", INR: "₹" };
let FX = store.get("fx", null);                       // { rates, date, at }
const fxRate = (cur) => (FX?.rates?.[cur]) || window.FX_REF?.[cur] || null;
const fxLabel = () => FX?.rates ? `실시간 환율 (${FX.date || "오늘"}, open.er-api.com)` : "내장 기준 환율(근사)";
async function loadFX() {
  if (FX && Date.now() - FX.at < 6 * 3600e3) return;
  try {
    const d = await (await fetch("https://open.er-api.com/v6/latest/USD")).json();
    if (d?.result === "success" && d.rates) { FX = { rates: d.rates, date: (d.time_last_update_utc || "").slice(5, 16), at: Date.now() }; store.set("fx", FX); }
  } catch {}
}
const usdOf = (it) => { const p = it.price; if (!p?.local) return null; const r = fxRate(p.cur); return r ? p.local / r : null; };
const fmtUSDv = (v) => v == null ? "" : "$" + (v >= 100 ? Math.round(v).toLocaleString("en-US") : v >= 10 ? v.toFixed(1).replace(/\.0$/, "") : v.toFixed(2));
const fmtLocal = (p) => p?.local ? `${SYM[p.cur] || p.cur + " "}${Number(p.local).toLocaleString("en-US")}` : "";
function priceShort(it) { return fmtUSDv(usdOf(it)); }

/* ───────── 라우팅 ───────── */
const go = (h) => { if (location.hash !== h) location.hash = h; else render(); };
window.addEventListener("hashchange", render);
$("#backBtn").onclick = () => (history.length > 1 ? history.back() : go("#/search"));
$("#tabbar").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]"); if (!b) return;
  go("#/" + b.dataset.tab);
});
function setChrome(tab, title, back = false) {
  document.querySelectorAll("#tabbar button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  $("#title").innerHTML = title ?? `<span class="seal">${bottle("wine")}</span>오늘술상`;
  $("#backBtn").classList.toggle("hidden", !back);
  window.scrollTo(0, 0);
}
function render() {
  const [, route = "pair", a, b] = location.hash.split(/[\/?]/).map(decodeURIComponent);
  const qs = location.hash.split("?")[1] || "";
  applyTheme();
  $("#editSheet")?.remove();
  if (route === "item") return renderDetail(a, b || "overview");
  if (route === "web") return renderWeb(a || "", b || "overview");
  if (route === "browse") return renderBrowse(a);
  if (route === "ranking") return renderRanking(a || "sake");
  if (route === "settings") return renderSettings();
  if (route === "cellar") return CELLAR.renderCellar(a, b, qs);
  if (route === "pair") return window.Pairing.renderPair();
  if (route === "style") return window.Pairing.renderStyle(a);
  return renderSearch(new URLSearchParams(location.hash.split("?")[1] || "").get("q") || "");
}

/* ───────── 공통 렌더 조각 ───────── */
function topScore(it) {
  const r = (it.ratings || []).find((x) => /\d/.test(x.score));
  if (r) return `<div class="score"><b>${esc(r.score)}</b>${esc(r.src.split(" (")[0])}</div>`;
  const p = priceShort(it);
  return p ? `<div class="score"><b>${esc(p)}</b>현지가</div>` : "";
}
function itemRow(it) {
  const c = CATS[it.cat] || CATS.other;
  const sub2 = [c.ko, it.country, it.style, it.abv].filter((x) => !EMPTY(x)).join(" · ");
  return `<button class="item" data-id="${esc(it.id)}">
    <span class="dot cat-${esc(it.cat)}">${bottle(it.cat)}</span>
    <span class="meta"><div class="name">${esc(it.ko || it.en)}${it.user || it.edited ? ' <small class="mine">내 정보</small>' : ""}</div>
      ${[it.en !== it.ko ? it.en : "", it.ja || it.zh].filter(Boolean).length ? `<div class="sub">${esc([it.en !== it.ko ? it.en : "", it.ja || it.zh].filter(Boolean).join(" · "))}</div>` : ""}
      <div class="sub">${esc(sub2)}</div></span>
    ${topScore(it)}</button>`;
}
function bindItems(root = view) {
  root.querySelectorAll(".item[data-id]").forEach((el) => (el.onclick = () => go(`#/item/${enc(el.dataset.id)}/overview`)));
}
/** 긴 목록은 60개씩 끊어서 */
function pagedList(root, items, step = 60) {
  let n = 0;
  const box = document.createElement("div"); box.className = "list"; root.appendChild(box);
  const more = document.createElement("button"); more.className = "btn ghost block"; more.style.marginTop = "10px";
  const draw = () => {
    box.insertAdjacentHTML("beforeend", items.slice(n, n + step).map(itemRow).join("")); n += step;
    bindItems(box);
    if (n >= items.length) more.remove(); else more.textContent = `더 보기 (${items.length - n}개 남음)`;
  };
  more.onclick = draw; root.appendChild(more); draw();
}
const ICO = {
  cam: `<svg viewBox="0 0 24 24"><path d="M4 8h3l1.6-2.2h6.8L17 8h3v11H4z"/><circle cx="12" cy="13.3" r="3.4"/></svg>`,
  search: `<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  fill: `<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>`,
  edit: `<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13 7 4 4"/></svg>`,
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
          placeholder="예) ㅊㅇㅅ, 발베, 獺祭" value="${esc(q)}" />
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
      <div class="section-title">수록된 술 <small>${r.length ? `${r.length}건${r.length === 30 ? "+" : ""}` : "일치 없음"}</small></div>
      ${r.length ? `<div class="list">${r.map(itemRow).join("")}</div>` : `<p class="hint">수록된 ${DB.length.toLocaleString()}종 중에는 없어요. 아래 추천어나 Enter로 웹 정보를 찾아보세요.</p>`}
      <div id="sugBox" class="hidden"><div class="section-title">구글 추천 검색어</div><div class="sug" id="sugList"></div></div>
      <a class="gsearch" href="${safeUrl(googleUrl(v))}" target="_blank" rel="noopener">${ICO.g}<span>구글에서 ‘<b>${esc(v)}</b>’ 검색</span><i>↗</i></a>`;
    bindItems(out);
    clearTimeout(sugTimer);
    sugTimer = setTimeout(() => loadSuggest(v), 150);
  };
  const loadSuggest = async (v) => {
    try {
      const list = await googleSuggest(v);
      if (input.value.trim() !== v) return;
      const box = $("#sugBox"); if (!box) return;
      if (!list.length) { box.classList.add("hidden"); return; }
      $("#sugList").innerHTML = list.map((s) => `
        <div class="sug-row"><a href="#/web/${enc(s)}">${ICO.search}<span>${esc(s)}</span></a>
        <button class="sug-fill" data-s="${esc(s)}" aria-label="검색창에 넣기">${ICO.fill}</button></div>`).join("");
      $("#sugList").querySelectorAll(".sug-fill").forEach((b) => (b.onclick = () => { input.value = b.dataset.s; input.focus(); draw(); }));
      box.classList.remove("hidden");
    } catch { $("#sugBox")?.classList.add("hidden"); }
  };
  ["input", "compositionupdate", "compositionend", "keyup"].forEach((ev) => input.addEventListener(ev, () => requestAnimationFrame(draw)));
  $("#sform").onsubmit = (e) => {
    e.preventDefault(); input.blur();
    const v = input.value.trim(); if (!v) return;
    const r = searchScored(v, 2);
    go(r.length === 1 || (r[0] && r[0][0] >= 1.5) ? `#/item/${enc(r[0][1].id)}/overview` : `#/web/${enc(v)}/overview`);
  };
  draw();
}
function drawHome(out) {
  const recent = store.get("recent", []).map(findById).filter(Boolean).slice(0, 6);
  const due = CELLAR.dueSummary();
  out.innerHTML = `${due.late || due.ready ? `<button class="cellar-cta" id="cellarCta"><b>🍷 내 셀러 · ${due.total}병</b><span>${[due.late && `서둘러 마실 와인 ${due.late}병`, due.ready && `지금 시음 적기 ${due.ready}병`].filter(Boolean).join(" · ")}</span></button>` : ""}
    <div class="section-title">주종 둘러보기 <small>${DB.length.toLocaleString()}종 수록</small></div>${catGrid()}
    ${recent.length ? `<div class="section-title">최근 본 술</div><div class="list">${recent.map(itemRow).join("")}</div>` : ""}`;
  out.querySelectorAll(".cat-tile").forEach((t) => (t.onclick = () => go("#/browse/" + t.dataset.cat)));
  $("#cellarCta")?.addEventListener("click", () => go("#/cellar"));
  bindItems(out);
}
function catGrid() {
  const keys = Object.keys(CATS).filter((k) => DB.some((x) => x.cat === k));
  return `<div class="cat-grid">${keys.map((k, i) => {
    const c = CATS[k]; const n = DB.filter((x) => x.cat === k).length;
    return `<button class="cat-tile cat-${k} ${i === keys.length - 1 && keys.length % 2 ? "wide" : ""}" data-cat="${k}">
      <span class="glyph">${bottle(k)}</span><b>${c.ko}</b><small>${c.en} · ${n}종</small></button>`;
  }).join("")}</div>`;
}

/* ───────── 분류 ───────── */
const priceVal = (x) => usdOf(x) || 0;
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
    <div id="blist"></div>`;
  const items = DB.filter((x) => sel === "all" || x.cat === sel);
  items.sort(sort === "price" ? (a, b) => priceVal(b) - priceVal(a) : sort === "priceLow" ? (a, b) => (priceVal(a) || 1e12) - (priceVal(b) || 1e12) : (a, b) => (a.ko || "").localeCompare(b.ko || "", "ko"));
  pagedList($("#blist"), items);
  $("#catChips").onclick = (e) => { const b = e.target.closest("[data-c]"); if (b) go("#/browse/" + b.dataset.c); };
  $("#sortChips").onclick = (e) => { const b = e.target.closest("[data-s]"); if (b) { store.set("sort", b.dataset.s); render(); } };
}

/* ───────── 상세 ───────── */
const ING_LABEL = { wine: "품종", sake: "쌀·정미", whisky: "원료·캐스크", cognac: "포도·크뤼", baijiu: "원료·향형", soju: "원료", makgeolli: "원료", beer: "원료·스타일", other: "원료" };
function renderDetail(id, tab) {
  const it = findById(id);
  if (!it) { setChrome("search", "오늘술상", true); view.innerHTML = `<div class="empty">항목을 찾을 수 없습니다.</div>`; return; }
  const recent = store.get("recent", []).filter((x) => x !== id); recent.unshift(id); store.set("recent", recent.slice(0, 20));
  renderItem(it, tab, `#/item/${enc(id)}/`);
}
function renderItem(it, tab, base) {
  const c = CATS[it.cat] || CATS.other;
  setChrome("search", esc(it.ko || it.en), true);
  const tabs = [["overview", "개요"], ["price", "가격"], ["ingredients", ING_LABEL[it.cat] || "원료"], ["ratings", "평가"], ["pairing", "페어링"]];
  const stats = [["도수", it.abv], ["산지", it.country], ["현지가", priceShort(it)]].filter(([, v]) => !EMPTY(v));
  view.innerHTML = `
    <section class="hero cat-${esc(it.cat)}">
      <span class="glyph">${bottle(it.cat)}</span>
      <span class="kind">${esc(c.en)} · ${esc(c.ko)}${it.web ? " · WEB" : ""}${it.user || it.edited ? " · 내 정보" : ""}</span>
      <h2>${esc(it.ko || it.en)}</h2>
      ${[it.en, it.ja, it.zh].filter((x) => x && x !== it.ko).length ? `<div class="names">${esc([it.en, it.ja, it.zh].filter((x) => x && x !== it.ko).join("  ·  "))}</div>` : ""}
      ${stats.length ? `<div class="stats" style="grid-template-columns:repeat(${stats.length},1fr)">${stats.map(([k, v]) => `<div class="stat"><small>${k}</small><b>${esc(v)}</b></div>`).join("")}</div>` : ""}
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
  if (tab === "overview" || !P || P === paneOverview) { loadPhoto(it); const e = $("#editBtn"); if (e) e.onclick = () => openEditor(it); CELLAR.wireItemCellar(it); }
  if (tab === "ratings") wireLiveScore(it);
}
function autoDesc(it) {
  if (!it.bulk && !it.user) return "";
  const where = [it.country, it.region].filter((x) => !EMPTY(x)).join(" ");
  return [it.producer && `${it.producer}의`, where && `${where}산`, it.style || CATS[it.cat]?.ko].filter(Boolean).join(" ") + (it.abv ? ` (${it.abv})` : "") + ".";
}
const prov = (it, k) => it.prov?.[k] ? ` <small class="prov">${esc(it.prov[k])}</small>` : "";
function kvRows(it) {
  const rows = [
    ["생산자", it.producer, "producer"], ["국가 · 산지", [it.country, it.region].filter((x) => !EMPTY(x)).join(" · "), "country"],
    ["스타일", it.style, "style"], ["도수", it.abv, "abv"], ["현지 참고가", usdOf(it) ? `${priceShort(it)}${it.price.cur !== "USD" ? ` (${fmtLocal(it.price)})` : ""}` : "", "price"],
    ["출시", it.inception ? `${it.inception}년` : "", "inception"],
  ].filter(([, v]) => !EMPTY(v));
  const site = it.website ? `<dt>공식 사이트</dt><dd><a href="${safeUrl(it.website)}" target="_blank" rel="noopener">${esc(it.website.replace(/^https?:\/\//, ""))}</a></dd>` : "";
  return rows.length || site ? `<h3>기본 정보</h3><dl class="kv">${rows.map(([k, v, f]) => `<dt>${k}</dt><dd>${esc(v)}${prov(it, f)}</dd>`).join("")}${site}</dl>` : "";
}
function paneOverview(it) {
  const t = it.tasting || {};
  const tast = [["NOSE 향", t.nose], ["PALATE 맛", t.palate], ["FINISH 여운", t.finish]].filter(([, v]) => !EMPTY(v));
  const sim = it.web && it.similar?.length ? `<div class="list">${it.similar.map((id) => findById(id)).filter(Boolean).map(itemRow).join("")}</div>` : "";
  const desc = it.desc || autoDesc(it);
  const srcs = (it.sources || []).filter((s) => s.url);
  return `${it.web && !it.desc && sim ? `<div class="section-title">이 술을 찾으셨나요?</div>${sim}<div style="height:6px"></div>` : ""}
    <figure class="photo hidden" id="photo"><img alt="" referrerpolicy="no-referrer" /><figcaption></figcaption></figure>
    <div class="panel">
      ${desc ? `<p class="lede">${esc(desc)}</p>` : it.web ? `<p class="lede">공개 자료에서 이 술의 설명을 찾지 못했어요. 아는 정보가 있다면 아래 ‘정보 수정’으로 직접 채워 두세요.</p>` : ""}
      ${srcs.length ? `<div class="src-line">출처: ${srcs.map((s) => `<a href="${safeUrl(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join(" · ")}</div>` : ""}
      ${it.user || it.edited ? `<div class="src-line">✎ 직접 수정한 정보가 반영되어 있어요</div>` : ""}
      ${it.lineup ? `<div class="src-line">ⓘ 브랜드·양조장은 실재하며, 이 항목은 등급별 <b>대표 라인업</b> 기준이에요. 실제 상품명·도수·가격은 양조장 정보로 확인하고, 다르면 ‘정보 수정’으로 고쳐 주세요.</div>` : ""}
      ${tast.length ? `<h3>테이스팅 노트</h3><div class="tasting" style="grid-template-columns:repeat(${tast.length},1fr)">${tast.map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join("")}</div>` : ""}
      ${kvRows(it)}
      <a class="gsearch" style="margin-top:14px" href="${safeUrl(googleUrl(it.en || it.ko))}" target="_blank" rel="noopener">${ICO.g}<span>구글에서 ‘<b>${esc(it.ko || it.en)}</b>’ 더 보기</span><i>↗</i></a>
      <button class="btn ghost block" id="editBtn" style="margin-top:10px">${ICO.edit} 정보 수정</button>
      ${CELLAR.itemCellarHTML(it)}
    </div>
    ${buyPanel(it)}
    ${it.web && it.desc && sim ? `<div class="section-title">수록된 비슷한 술</div>${sim}` : ""}`;
}
/* 살 수 있는 곳: 데일리샷 검색(온라인 주문·매장 픽업) + 지도 앱의 내 주변 매장.
 * 위치는 지도 앱이 직접 쓰므로 오늘술상은 위치 정보를 받지 않는다. */
const DAILYSHOT = (q) => `https://dailyshot.co/m/search/result?q=${enc(q)}`;
const SHOP_WORD = { wine: "와인샵", soju: "주류 판매점", makgeolli: "주류 판매점", beer: "주류 판매점" };
function buyPanel(it) {
  const name = cleanName(it.ko || it.en);
  const shop = SHOP_WORD[it.cat] || "바틀샵";
  return `<div class="panel buy">
      <h3>살 수 있는 곳</h3>
      <a class="buy-main" href="${safeUrl(DAILYSHOT(name))}" target="_blank" rel="noopener">
        <span><b>데일리샷에서 ‘${esc(name)}’ 찾기</b><small>온라인으로 주문하고 가까운 매장에서 픽업</small></span><i>↗</i></a>
      <div class="linkbtns">
        <a href="${safeUrl(`https://map.naver.com/p/search/${enc(shop)}`)}" target="_blank" rel="noopener">네이버 지도 ↗<small>내 주변 ${esc(shop)}</small></a>
        <a href="${safeUrl(`https://map.kakao.com/link/search/${enc(shop)}`)}" target="_blank" rel="noopener">카카오맵 ↗<small>내 주변 ${esc(shop)}</small></a>
      </div>
      <p class="hint" style="margin:10px 2px 0">지도는 휴대폰 위치로 가까운 매장을 보여줘요. 오늘술상은 위치를 받거나 저장하지 않아요.</p>
    </div>`;
}
function panePrice(it) {
  const p = it.price || {}, usd = usdOf(it);
  return `<div class="panel">
      ${usd ? `<h3>현지 참고가 <small style="font-family:var(--sans);font-weight:400;color:var(--muted);font-size:12px">생산국 소매가 → 달러</small></h3>
      <div class="price-card"><div class="price-big">${fmtUSDv(usd)}</div>
        <div class="price-sub">${p.cur !== "USD" ? `${esc(fmtLocal(p))} · ` : ""}${esc(it.country || "")} 현지 ${it.cat === "sake" ? "720ml" : it.cat === "beer" || it.cat === "soju" || it.cat === "makgeolli" ? "1병" : "750ml"} 기준</div>
        <div class="price-sub">${esc(p.basis || "추정")} · ${esc(fxLabel())}</div></div>` : ""}
      <h3>최신 시세 확인</h3>
      <div class="linkbtns">${priceLinks(it).map(([n, url]) => `<a href="${safeUrl(url)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div>
      <div class="notice">${usd ? "현지 참고가는 추정치이며 환율은 열 때마다 최신으로 갱신됩니다. " : ""}조회 시점 실제 판매가는 위 사이트에서 확인하세요.</div>
    </div>`;
}
function paneIngredients(it) {
  const g = (it.ingredients?.length ? it.ingredients : it.cat === "wine" ? inferFromName(`${it.ko} ${it.en}`).grapes : []);
  const extra = {
    wine: "블렌딩 비율은 빈티지마다 달라질 수 있습니다.",
    sake: "정미보합(精米歩合): 쌀을 깎고 남은 비율. 다이긴죠 ≤50%, 긴죠 ≤60%. 준마이 = 쌀·누룩·물만 사용(양조알코올 무첨가).",
    whisky: "싱글 몰트 = 한 증류소의 100% 맥아 보리. 블렌디드 = 몰트 + 그레인. 버번 = 옥수수 51% 이상, 새 탄화 오크통.",
    cognac: "꼬냑 크뤼: Grande Champagne > Petite Champagne > Borderies > Fins Bois 순. 숙성 등급: VS 2년 / VSOP 4년 / XO 10년 이상.",
    soju: "희석식 소주 = 주정(타피오카·쌀 등) + 물 + 감미료. 증류식 소주 = 쌀·보리 등을 발효 후 단식 증류.",
    makgeolli: "막걸리 = 쌀·누룩을 발효한 탁주, 약주·청주 = 맑게 거른 술. 생막걸리는 살아 있는 효모로 냉장 보관 필수.",
    beer: "라거 = 하면발효(깔끔), 에일 = 상면발효(풍부한 향), IPA = 홉을 많이 쓴 에일, 스타우트 = 볶은 맥아의 흑맥주.",
    other: "보드카(곡물·감자), 진(주니퍼베리), 럼(사탕수수), 데킬라(블루 아가베) 등 원료에 따라 스타일이 갈린다.",
    baijiu: "향형: 장향(茅台) · 농향(五粮液·泸州) · 청향(汾酒) · 미향(米香) · 봉향(西凤) 등. 주원료는 수수, 누룩(大曲)은 밀·보리·완두.",
  }[it.cat];
  return `${g.length ? `<div class="panel">
      <h3>${esc(ING_LABEL[it.cat] || "원료")} 구성</h3>
      ${g.map((x) => `<div class="grape"><b>${esc(x.name)}${x.note ? `<br><small style="color:var(--muted);font-weight:400">${esc(x.note)}</small>` : ""}</b>
        ${x.pct ? `<div class="bar"><i style="width:${Math.min(100, +x.pct)}%"></i></div><span>${esc(x.pct)}%</span>` : `<div style="flex:1"></div><span>${x.pct === 0 ? "보조" : ""}</span>`}</div>`).join("")}
      ${it.ingredientNote ? `<div class="notice">${esc(it.ingredientNote)}</div>` : ""}
    </div>` : ""}
    ${extra ? `<div class="panel"><h3>알아두기</h3><p>${esc(extra)}</p></div>` : ""}`;
}
function ratingCard(r, it) {
  const s = String(r.score ?? "확인");
  return `<div class="rating"><div class="medal ${s.length > 5 ? "sm" : ""}">${esc(s)}</div>
    <div class="body"><div class="src">${esc(r.src)}</div>${r.note ? `<div class="note">${esc(r.note)}</div>` : ""}
    <div class="note"><a href="${safeUrl(r.url || sourceUrl(r.src, it))}" target="_blank" rel="noopener">출처 확인 ↗</a></div></div></div>`;
}
function paneRatings(it) {
  const c = CATS[it.cat] || CATS.other, name = it.en || it.ko;
  const live = store.get("score." + it.id)?.rs || [];
  const exact = Object.fromEntries(live.filter((r) => r.url).flatMap((r) => [[r.src, r.url], [srcKey(r.src) || r.src, r.url]]));
  const have = new Set((it.ratings || []).map((r) => r.src.split(" (")[0]));
  const withUrl = (r) => { const u = exact[r.src] || exact[srcKey(r.src)]; return u && !r.url ? { ...r, url: u } : r; };
  const list = [...(it.ratings || []), ...c.sources.filter((src) => !have.has(src.split(" (")[0])).map((src) => ({ src, score: "확인", note: "이 술의 최신 점수·수상 이력은 출처에서 확인" }))].map(withUrl);
  return `<div class="panel">
      <h3>공신력 있는 평가</h3>
      ${list.map((r) => ratingCard(r, it)).join("")}
      <div id="liveScore"></div>
      ${cseOn() ? `<button class="btn gold block" id="liveScoreBtn" style="margin-top:10px">실시간 점수 불러오기 (Google 검색)</button>`
        : `<p class="hint" style="margin:10px 2px 0">설정에서 Google 검색 키를 넣으면 평점·평론가 점수·수상 이력을 실시간으로 불러올 수 있어요.</p>`}
      <div class="notice">점수는 최근 빈티지/출품 기준 통상 범위이며 '확인'은 출처에서 최신 점수를 보세요. 출처 링크는 해당 사이트로 한정한 구글 검색을 엽니다 — 맨 위 결과를 누르면 이 술의 페이지입니다. ‘실시간 점수 불러오기’를 한 번 하면 찾은 출처는 그 술의 페이지로 바로 연결됩니다.</div>
    </div>
    <div class="panel"><h3>${esc(c.ko)} 평가 기관</h3>${c.sources.map((s) => {
      const k = srcKey(s), u = exact[s] || exact[k];
      return `<div class="price-row"><span><b>${esc(s)}</b>${k ? `<br><small style="color:var(--muted)">${esc(SOURCE_INFO[k].d)}</small>` : ""}</span><a href="${safeUrl(u || sourceUrl(s, it))}" target="_blank" rel="noopener">↗</a></div>`;
    }).join("")}</div>`;
}
function panePairing(it) {
  const p = it.pairing || {};
  const serve = [["서빙 온도", p.temp], ["잔", p.glass], ["디캔팅/브리딩", p.decant]].filter(([, v]) => !EMPTY(v));
  const cards = [p.good?.length && `<div class="pair-card ok"><h4>잘 어울려요</h4><ul>${p.good.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`,
    p.avoid?.length && `<div class="pair-card no"><h4>피하세요</h4><ul>${p.avoid.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`].filter(Boolean);
  return `${window.Pairing?.foodsPanel(it) || ""}<div class="panel">
      ${cards.length ? `<div class="pair-grid" style="grid-template-columns:repeat(${cards.length},1fr)">${cards.join("")}</div>` : ""}
      ${serve.length ? `<div class="serve" style="grid-template-columns:repeat(${serve.length},1fr)">${serve.map(([k, v]) => `<div><small>${k}</small>${esc(v)}</div>`).join("")}</div>` : ""}
      ${p.caution ? `<div class="caution"><b>유의사항</b><br>${esc(p.caution)}</div>` : ""}
    </div>
    <div class="notice">공통 유의: 고도주(40%↑)는 물과 함께 천천히, 공복 음용과 탄산·에너지음료 혼합은 피하세요. 복용 중인 약이 있다면 음주 전 확인이 필요합니다.</div>`;
}

/* ───────── 외부 조회 공통 ───────── */
async function getJSON(url, ms = 7000) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { signal: ctl.signal }); if (!r.ok) throw new Error(String(r.status)); return await r.json(); }
  finally { clearTimeout(tm); }
}
const DRINK_RE = /(술|주류|와인|포도주|위스키|버번|브랜디|코냑|꼬냑|사케|청주|니혼슈|소주|맥주|막걸리|약주|전통주|증류|양조|리큐어|보드카|럼주|데킬라|고량|백주|바이주|샴페인|와이너리|증류소|wine|whisk|bourbon|brandy|cognac|sake|soju|beer|lager|ale\b|liquor|spirit|vodka|\bgin\b|\brum\b|tequila|baijiu|champagne|distill|brew|winery|château|酒|焼酎|ワイン|ウイスキー|ビール|啤酒)/i;
const STRIP_WORDS = /\s*(가격|최저가|추천|후기|리뷰|할인|구매|파는\s*곳|판매처?|면세점?|코스트코|이마트|도수|칼로리|맛|종류|안주|price|review|buy)\s*$/i;
function cleanQuery(q) { let s = q.trim(); for (let i = 0; i < 4; i++) s = s.replace(STRIP_WORDS, "").trim(); return s || q.trim(); }
const simKey = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9가-힣぀-ヿ一-鿿]/g, "");

async function wikiSearchLang(lang, q, strict) {
  const s = await getJSON(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&srsearch=${enc(q)}&srlimit=4&format=json&origin=*`);
  const hits = (s?.query?.search || []).map((h) => h.title);
  const sums = await Promise.all(hits.map((t) => getJSON(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${enc(t.replace(/ /g, "_"))}`).catch(() => null)));
  for (const sum of sums) {
    if (!sum || sum.type === "disambiguation") continue;
    if (strict) { const a = simKey(sum.title), b = simKey(q); if (!(a.length >= 4 && (b.includes(a) || a.includes(b)))) continue; }
    else if (!DRINK_RE.test(`${sum.title} ${sum.description || ""} ${sum.extract || ""}`)) continue;
    return { lang, title: sum.title, desc: sum.description || "", extract: sum.extract || "", thumb: sum.thumbnail?.source, url: sum.content_urls?.mobile?.page || sum.content_urls?.desktop?.page, qid: sum.wikibase_item };
  }
  return null;
}
async function wikidataSearch(q, lang) {
  const d = await getJSON(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${enc(q)}&language=${lang}&uselang=${lang}&limit=5&format=json&origin=*`);
  const hit = (d?.search || []).find((x) => DRINK_RE.test(`${x.label || ""} ${x.description || ""}`));
  return hit ? { qid: hit.id, desc: hit.description || "", label: hit.label } : null;
}
async function wikidata(qid) {
  const api = "https://www.wikidata.org/w/api.php?format=json&origin=*&action=wbgetentities";
  const d = await getJSON(`${api}&ids=${qid}&props=labels|claims|descriptions&languages=ko|en|ja|zh`);
  const e = d?.entities?.[qid]; if (!e) return {};
  const vals = (pp) => (e.claims?.[pp] || []).map((c) => c.mainsnak?.datavalue?.value).filter((v) => v != null);
  const ids = (pp) => vals(pp).map((v) => v.id).filter(Boolean);
  const need = [...new Set([...ids("P31"), ...ids("P176"), ...ids("P495"), ...ids("P17"), ...ids("P186"), ...ids("P279")])].slice(0, 45);
  let lab = {};
  if (need.length) { try { lab = (await getJSON(`${api}&ids=${need.join("|")}&props=labels&languages=ko|en`))?.entities || {}; } catch {} }
  const L = (id) => lab[id]?.labels?.ko?.value || lab[id]?.labels?.en?.value;
  const own = (l) => e.labels?.[l]?.value;
  const abv = vals("P2665")[0]?.amount;
  const img = vals("P18")[0];
  return {
    ko: own("ko"), en: own("en"), ja: own("ja"), zh: own("zh"),
    desc: e.descriptions?.ko?.value || e.descriptions?.en?.value || "",
    types: [...ids("P31"), ...ids("P279")].map(L).filter(Boolean),
    maker: ids("P176").map(L).filter(Boolean),
    country: (ids("P495").length ? ids("P495") : ids("P17")).map(L).filter(Boolean),
    materials: ids("P186").map(L).filter(Boolean),
    abv: abv ? `${parseFloat(abv)}%` : "",
    inception: (vals("P571")[0]?.time || "").slice(1, 5),
    website: vals("P856")[0],
    image: img ? `https://commons.wikimedia.org/wiki/Special:FilePath/${enc(img)}?width=600` : "",
  };
}

/* ───────── Google Custom Search (선택) ───────── */
const cseCfg = () => store.get("gcse", { key: "", cx: "" });
const cseOn = () => { const c = cseCfg(); return !!(c.key && c.cx); };
async function cse(q, image = false) {
  const { key, cx } = cseCfg();
  const d = await getJSON(`https://www.googleapis.com/customsearch/v1?key=${enc(key)}&cx=${enc(cx)}&hl=ko&num=${image ? 1 : 6}&q=${enc(q)}${image ? "&searchType=image&safe=active" : ""}`, 8000);
  return d.items || [];
}
const COUNTRIES = [["대한민국", /대한민국|한국산|국내산|korea/i], ["프랑스", /프랑스|france|french/i], ["이탈리아", /이탈리아|italy|italian/i], ["스페인", /스페인|spain|spanish/i],
  ["미국", /미국|usa|united states|california|napa|kentucky|캘리포니아|켄터키/i], ["칠레", /칠레|chile/i], ["아르헨티나", /아르헨티나|argentina/i], ["호주", /호주|australia/i],
  ["뉴질랜드", /뉴질랜드|new zealand/i], ["독일", /독일|germany|german/i], ["포르투갈", /포르투갈|portugal/i], ["남아프리카공화국", /남아공|남아프리카|south africa/i],
  ["일본", /일본|japan|japanese/i], ["중국", /중국|china|chinese/i], ["대만", /대만|taiwan/i], ["스코틀랜드", /스코틀랜드|scotland|scotch/i], ["아일랜드", /아일랜드|ireland|irish/i],
  ["영국", /영국|england|united kingdom/i], ["캐나다", /캐나다|canada/i], ["멕시코", /멕시코|mexico/i], ["벨기에", /벨기에|belgium/i], ["네덜란드", /네덜란드|netherlands/i],
  ["체코", /체코|czech/i], ["오스트리아", /오스트리아|austria/i], ["그리스", /그리스|greece/i], ["헝가리", /헝가리|hungary/i], ["태국", /태국|thailand/i], ["베트남", /베트남|vietnam/i], ["인도", /인도(?!네시아)|india\b/i]];
function extractFacts(items) {
  const text = items.map((x) => `${x.title} ${x.snippet} ${x.pagemap?.metatags?.[0]?.["og:description"] || ""}`).join(" \n ");
  const facts = {};
  const abvs = [...text.matchAll(/(?:알코올|도수|abv|alc\.?|alcohol)[^\d]{0,12}(\d{1,2}(?:[.,]\d{1,2})?)\s*(?:%|도|vol)|(\d{1,2}(?:\.\d{1,2})?)\s*%\s*(?:vol|abv|alc)?/gi)]
    .map((m) => parseFloat((m[1] || m[2]).replace(",", "."))).filter((v) => v >= 0.5 && v <= 70);
  if (abvs.length) { const f = {}; abvs.forEach((v) => (f[v] = (f[v] || 0) + 1)); facts.abv = `${Object.entries(f).sort((a, b) => b[1] - a[1])[0][0]}%`; }
  const cnt = COUNTRIES.map(([n, re]) => [n, (text.match(new RegExp(re.source, "gi")) || []).length]).filter(([, c]) => c).sort((a, b) => b[1] - a[1]);
  if (cnt.length) facts.country = cnt[0][0];
  const pm = text.match(/(?:생산자|제조사|제조원|제조|양조장|와이너리|증류소|producer|winery|distillery|brewery|made by|produced by)\s*[:：]?\s*([A-Za-z가-힣][\w가-힣&'.\-]{1,30}(?:\s[\w가-힣&'.\-]{1,20}){0,3})/i);
  if (pm) facts.producer = pm[1].split(/[.;|·]\s|[.;|·]$/)[0].replace(/[.,]$/, "").trim();
  const sn = items.find((x) => x.snippet && x.snippet.length > 40);
  if (sn) facts.desc = sn.snippet.replace(/\s+/g, " ").trim();
  facts.image = items.map((x) => x.pagemap?.cse_image?.[0]?.src).find(Boolean) || "";
  facts.sources = items.slice(0, 3).map((x) => ({ label: `Google: ${(x.displayLink || x.title || "").slice(0, 28)}`, url: x.link }));
  return facts;
}

/* ───────── 웹 결과 만들기 ───────── */
async function buildWebItem(query) {
  const q = cleanQuery(query);
  const cacheKey = "web2." + q + (cseOn() ? ".g" : "");
  const cached = store.get(cacheKey);
  if (cached && Date.now() - cached.at < 7 * 864e5) return cached.it;

  const inf = inferFromName(q);
  const qEn = hasHangul(q) ? toLatin(q) : q;
  // ① 위키백과(한/영) + 위키데이터를 동시에 검색 — 한글명은 영문 표기로도
  const jobs = [];
  const script = /[぀-ヿ]/.test(q) ? "ja" : /[一-鿿]/.test(q) && !hasHangul(q) ? "zh" : null;
  if (script) jobs.push(wikiSearchLang(script, q));
  if (hasHangul(q)) jobs.push(wikiSearchLang("ko", q));
  jobs.push(wikiSearchLang("en", qEn));
  if (!hasHangul(q) && !script) jobs.push(wikiSearchLang("ko", q));
  const wdJobs = [wikidataSearch(q, hasHangul(q) ? "ko" : "en"), hasHangul(q) ? wikidataSearch(qEn, "en") : Promise.resolve(null)];
  const [wikis, wds] = await Promise.all([Promise.all(jobs.map((p) => p.catch(() => null))), Promise.all(wdJobs.map((p) => p.catch(() => null)))]);
  const wiki = wikis.find(Boolean) || null;
  const qid = wiki?.qid || wds.find(Boolean)?.qid;
  let wd = {};
  if (qid) { try { wd = await wikidata(qid); } catch {} }

  const text = [q, wiki?.title, wiki?.desc, wiki?.extract, wd.desc, ...(wd.types || [])].join(" ");
  const sim = search(q, 4);
  let cat = inf.cat || inferFromName(text).cat || (sim[0]?.cat) || "other";
  const it = {
    id: "web:" + q, web: true, query: q, cat,
    ko: q, en: wd.en || (wiki?.lang === "en" ? wiki.title : "") || (hasHangul(q) ? "" : q), ja: wd.ja || "", zh: wd.zh || "",
    producer: (wd.maker || []).join(", "), country: (wd.country || []).join(", "), region: "",
    style: inf.style || (wd.types || []).slice(0, 2).join(" · ") || wiki?.desc || wd.desc || "",
    abv: wd.abv || "", inception: wd.inception || "", website: wd.website || "",
    desc: wiki?.extract || wd.desc || "", thumb: wiki?.thumb || wd.image || "",
    ingredients: (wd.materials || []).length ? wd.materials.map((name) => ({ name })) : inf.grapes,
    price: null, ratings: [], prov: {}, sources: [],
    similar: sim.map((x) => x.id),
  };
  if (wiki) it.sources.push({ label: "위키백과", url: wiki.url });
  if (qid) it.sources.push({ label: "위키데이터", url: `https://www.wikidata.org/wiki/${qid}` });
  ["producer", "country", "abv"].forEach((k) => { if (it[k]) it.prov[k] = "위키데이터"; });

  // ② 그래도 비어 있으면 Google Custom Search 요약에서 정규식 추출 (키가 있을 때만)
  if (cseOn() && (!it.abv || !it.country || !it.producer || !it.desc)) {
    try {
      const f = extractFacts(await cse(q + (cat !== "other" ? " " + (CATS[cat]?.ko || "") : "")));
      for (const k of ["abv", "country", "producer"]) if (!it[k] && f[k]) { it[k] = f[k]; it.prov[k] = "Google 검색 요약"; }
      if (!it.desc && f.desc) { it.desc = f.desc; it.prov.desc = "Google 검색 요약"; }
      if (!it.thumb && f.image) it.thumb = f.image;
      it.sources.push(...f.sources);
      if (cat === "other") { const c2 = inferFromName(`${q} ${f.desc || ""}`).cat; if (c2) it.cat = cat = c2; }
    } catch { it.cseError = true; }
  }
  it.pairing = pickPreset(cat, text + " " + it.style);
  if (it.sources.length || it.desc) store.set(cacheKey, { at: Date.now(), it });
  return it;
}
async function renderWeb(query, tab) {
  const q = cleanQuery(query);
  // 이미 저장(수정)한 항목이나 정확히 같은 이름의 수록 술이 있으면 그쪽으로
  const exact = DB.find((x) => [x.ko, x.en, x.query].some((n) => n && norm(n) === norm(q)));
  if (exact) return go(`#/item/${enc(exact.id)}/${tab}`);
  setChrome("search", esc(q), true);
  view.innerHTML = `<div class="skel" style="height:190px;border-radius:22px"></div>
    <div class="skel" style="height:50px;margin-top:10px"></div><div class="skel" style="height:220px;margin-top:10px"></div>
    <p class="hint" style="text-align:center">‘${esc(q)}’ 정보를 위키백과·위키데이터${cseOn() ? "·Google" : ""}에서 찾는 중…</p>`;
  const it = await buildWebItem(query);
  if (!location.hash.startsWith(`#/web/${enc(query)}`)) return;
  renderItem(it, tab, `#/web/${enc(query)}/`);
}

/* ───────── 실시간 점수 (Google Custom Search 요약·구조화 데이터) ───────── */
const CRITIC_SITES = [["Wine Spectator", "winespectator.com"], ["Robert Parker (Wine Advocate)", "robertparker.com"], ["James Suckling", "jamessuckling.com"], ["Decanter", "decanter.com"], ["Wine Enthusiast", "wineenthusiast.com"]];
const MEDAL_RE = /(double gold|platinum|grand gold|best in show|best in class|trophy|gold|silver|bronze|chairman'?s trophy|金賞|入賞|最高金賞|プラチナ|金奖|银奖|大金奖|대상|최우수상|금상|은상|동상|우수상|名酒)/i;
const MEDAL_KO = { "double gold": "더블 골드", platinum: "플래티넘", "grand gold": "그랜드 골드", "best in show": "최고상", "best in class": "부문 최고", trophy: "트로피", gold: "금상", silver: "은상", bronze: "동상", "金賞": "금상", "最高金賞": "최고 금상", "入賞": "입상", "プラチナ": "플래티넘", "金奖": "금상", "银奖": "은상", "大金奖": "대금상" };
function scoreFrom(kind, x) {
  const t = `${x.title || ""} ${x.snippet || ""}`;
  const ar = x.pagemap?.aggregaterating?.[0];
  if (kind === "5") {
    const v = ar?.ratingvalue || (t.match(/\b([0-4]\.\d{1,2}|5\.0)\s*(?:\/\s*5|stars?|rating|평점|点)/i) || [])[1];
    return v ? { score: String(v).slice(0, 4), extra: ar?.reviewcount || ar?.ratingcount ? `평가 ${ar.reviewcount || ar.ratingcount}건` : "" } : null;
  }
  if (kind === "100") {
    const v = (t.match(/\b(7\d|8\d|9\d|100)(?:\.\d)?\s*(?:\/\s*100|points|pts|-point|점)/i) || [])[1];
    return v ? { score: `${v}점` } : null;
  }
  const m = t.match(MEDAL_RE);
  if (!m) return null;
  const yr = (t.match(/\b(20[0-2]\d)\b/) || [])[1];
  return { score: MEDAL_KO[m[1].toLowerCase()] || MEDAL_KO[m[1]] || m[1], extra: yr ? `${yr}` : "" };
}
// 결과가 정말 이 술인지: 이름의 핵심 단어(라틴 4자+ / 한·중·일 앞 2자)가 제목·요약·주소에 있어야 채택
const GENERIC = new Set(["year", "years", "old", "the", "junmai", "daiginjo", "ginjo", "single", "malt", "whisky", "whiskey", "scotch", "blended", "edition", "reserve", "vol", "beer", "lager", "draught"]);
function relevantTo(n) {
  const fold = (t) => String(t || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").normalize("NFC").toLowerCase();
  const lat = fold(n).split(/[^a-z0-9]+/).filter((w) => w.length >= 4 && !GENERIC.has(w) && !/^\d+$/.test(w));
  const cjk = (String(n).match(/[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7a3]{2,}/g) || []).map((w) => w.slice(0, 2));
  const keys = [...lat, ...cjk];
  return (x) => !keys.length || keys.some((k) => fold(`${x.title} ${x.snippet} ${decodeURIComponent(x.link || "")}`).includes(k));
}
async function fetchLiveScores(it) {
  const c = CATS[it.cat] || CATS.other;
  const srcs = [...new Set([...c.sources, ...(it.ratings || []).map((r) => r.src)])].map((s) => [s, srcKey(s)]).filter(([, k], i, A) => k && A.findIndex(([, k2]) => k2 === k) === i);
  if (it.cat === "wine") for (const [label] of CRITIC_SITES) if (!srcs.some(([s]) => s === label)) srcs.push([label, null]);
  const site = (s, k) => (k ? SOURCE_INFO[k].site : CRITIC_SITES.find(([l]) => l === s)?.[1]);
  // 도메인 있는 출처는 언어별로 묶어 한 번에(검색 할당량 절약), 키워드형 국내·중국 시상은 각각
  const groups = {};
  for (const [s, k] of srcs) {
    const dom = site(s, k); if (!dom) continue;
    const n = cleanName(nameFor(it, k ? SOURCE_INFO[k].lang : "")); (groups[n] ||= []).push([s, dom, k]);
  }
  const jobs = Object.entries(groups).map(([n, L]) => cse(`"${n}" (${L.map(([, d]) => "site:" + d).join(" OR ")})`).then((r) => ({ L, r: r.filter(relevantTo(n)) })).catch(() => ({ L, r: [] })));
  for (const [s, k] of srcs) if (k && !SOURCE_INFO[k].site) jobs.push(cse(sourceQuery(s, it)).then((r) => ({ kw: [s, k], r: r.filter(relevantTo(nameFor(it, SOURCE_INFO[k].lang))) })).catch(() => ({ kw: [s, k], r: [] })));
  const out = [];
  for (const { L, kw, r } of await Promise.all(jobs)) {
    const pairs = L ? L.map(([s, dom, k]) => [s, k, r.filter((x) => (x.displayLink || x.link || "").includes(dom))]) : [[kw[0], kw[1], r.filter((x) => `${x.title} ${x.snippet}`.includes(SOURCE_INFO[kw[1]].kw.split(" ")[0]))]];
    for (const [s, k, hits] of pairs) {
      if (!hits.length) continue;
      const kind = k ? SOURCE_INFO[k].score : "100";
      const hit = hits.find((x) => scoreFrom(kind, x)) || hits[0], sc = scoreFrom(kind, hit);
      out.push({ src: s, score: sc ? sc.score : "확인", note: `실시간 · ${[sc?.extra, (hit.title || "").slice(0, 40)].filter(Boolean).join(" · ")}`, url: hit.link });
    }
  }
  return out;
}
function wireLiveScore(it) {
  const btn = $("#liveScoreBtn"), box = $("#liveScore"); if (!box) return;
  const key = "score." + it.id, cached = store.get(key);
  const draw = (rs) => {
    box.innerHTML = rs.length ? `<h3 style="margin-top:14px">실시간 점수 <small class="prov">Google 검색 결과 기준</small></h3>${rs.map((r) => ratingCard(r, it)).join("")}`
      : `<p class="hint">검색 결과에서 점수를 찾지 못했어요. 위 출처 링크에서 확인해 주세요.</p>`;
  };
  if (cached && Date.now() - cached.at < 7 * 864e5) draw(cached.rs);
  if (btn) btn.onclick = async () => {
    btn.disabled = true; btn.textContent = "불러오는 중…";
    try { const rs = await fetchLiveScores(it); store.set(key, { at: Date.now(), rs }); draw(rs); }
    catch (e) { box.innerHTML = `<p class="hint">불러오지 못했어요 (${esc(e.message)})</p>`; }
    finally { btn.disabled = false; btn.textContent = "실시간 점수 다시 불러오기"; }
  };
}

/* ───────── 사진 ───────── */
async function findPhoto(it) {
  if (it.photo) return { src: it.photo, cap: "직접 등록한 사진" };
  if (it.thumb) return { src: it.thumb, cap: it.sources?.some((s) => s.label === "위키백과") ? "사진: 위키백과" : "사진: 웹 검색" };
  const names = [it.en, it.ko].filter(Boolean);
  if (cseOn()) {
    try { const im = await cse(`${quoted(names[0])} ${it.cat === "beer" ? "beer" : "bottle"}`, true); if (im[0]?.link) return { src: im[0].link, cap: `사진: Google 이미지 (${im[0].displayLink || ""})`, href: im[0].image?.contextLink }; } catch {}
  }
  for (const [lang, n] of [["en", it.en], ["ko", it.ko]]) {
    if (!n) continue;
    try { const w = await wikiSearchLang(lang, n, true); if (w?.thumb) return { src: w.thumb, cap: "사진: 위키백과", href: w.url }; } catch {}
  }
  if (it.en) { try { const h = await wikidataSearch(it.en, "en"); if (h) { const d = await wikidata(h.qid); if (d.image) return { src: d.image, cap: "사진: 위키미디어 공용", href: `https://www.wikidata.org/wiki/${h.qid}` }; } } catch {} }
  if (it.producer) { try { const w = await wikiSearchLang("en", it.producer.split(/[,(]/)[0].trim(), true); if (w?.thumb) return { src: w.thumb, cap: `생산자 사진: ${w.title} (위키백과)`, href: w.url }; } catch {} }
  return null;
}
async function loadPhoto(it) {
  const fig = $("#photo"); if (!fig) return;
  const key = "img." + it.id;
  let ph = store.get(key);
  if (ph === undefined || (ph && ph.at && Date.now() - ph.at > 30 * 864e5)) {
    fig.classList.remove("hidden"); fig.classList.add("loading-photo");
    ph = await findPhoto(it).catch(() => null);
    store.set(key, ph ? { ...ph, at: Date.now() } : null);
  }
  if ($("#photo") !== fig) return;
  fig.classList.remove("loading-photo");
  if (!ph) { fig.classList.add("hidden"); return; }
  const img = fig.querySelector("img");
  img.onerror = () => { fig.classList.add("hidden"); store.del(key); };
  img.src = ph.src;
  fig.querySelector("figcaption").innerHTML = ph.href ? `<a href="${safeUrl(ph.href)}" target="_blank" rel="noopener">${esc(ph.cap)} ↗</a>` : esc(ph.cap);
  fig.classList.remove("hidden");
}

/* ───────── 정보 수정 · 저장 ───────── */
const EDIT_FIELDS = [["ko", "한글명"], ["en", "영문명"], ["cat", "종류"], ["style", "스타일"], ["abv", "도수 (예: 40%)"], ["country", "국가"], ["region", "산지"],
  ["producer", "생산자"], ["usd", "현지 참고가 (USD)"], ["ingredients", "품종·원료 (쉼표로 구분)"], ["photo", "사진 주소 (https://…)"], ["desc", "설명"]];
function openEditor(it) {
  $("#editSheet")?.remove();
  const val = (k) => k === "usd" ? (usdOf(it) ? Math.round(usdOf(it) * 100) / 100 : "") : k === "ingredients" ? (it.ingredients || []).map((g) => g.name).join(", ") : (it[k] || "");
  const el = document.createElement("div");
  el.id = "editSheet"; el.className = "sheet-wrap";
  el.innerHTML = `<div class="sheet-bg"></div><form class="sheet edit-form">
      <div class="grab"></div><h3 class="sheet-h">정보 수정</h3>
      <p class="hint" style="margin-top:0">저장하면 이 기기에서 다음 검색부터 이 값을 사용합니다.</p>
      ${EDIT_FIELDS.map(([k, label]) => `<div class="field"><label>${label}</label>${
        k === "cat" ? `<select name="cat">${Object.entries(CATS).map(([c, v]) => `<option value="${c}" ${c === it.cat ? "selected" : ""}>${v.ko}</option>`).join("")}</select>`
        : k === "desc" ? `<textarea name="desc" rows="4">${esc(val(k))}</textarea>`
        : `<input name="${k}" value="${esc(val(k))}" ${k === "usd" ? 'inputmode="decimal"' : ""} />`}</div>`).join("")}
      <button class="btn block" type="submit">저장</button>
      ${it.edited || it.user ? `<button class="btn ghost block" type="button" id="resetEdit" style="margin-top:8px">수정 내용 삭제</button>` : ""}
      <button class="btn ghost block" type="button" id="cancelEdit" style="margin-top:8px">취소</button>
    </form>`;
  document.body.appendChild(el);
  const close = () => el.remove();
  el.querySelector(".sheet-bg").onclick = close;
  el.querySelector("#cancelEdit").onclick = close;
  el.querySelector("#resetEdit")?.addEventListener("click", () => {
    if (it.user) { const u = store.get("useritems", {}); delete u[it.id]; store.set("useritems", u); }
    const e = store.get("edits", {}); delete e[it.id]; store.set("edits", e);
    toast("수정 내용을 지웠어요"); location.hash = "#/search"; location.reload();
  });
  el.querySelector("form").onsubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target), f = {};
    for (const [k] of EDIT_FIELDS) { const v = String(fd.get(k) ?? "").trim(); if (v !== String(val(k))) f[k] = k === "usd" ? v.replace(/[^\d.]/g, "") : k === "abv" && /^\d+(\.\d+)?$/.test(v) ? v + "%" : v; }
    if (!Object.keys(f).length) { close(); return; }
    let target = it;
    if (it.web) {
      // 웹 결과 → 내 항목으로 저장 (다음 검색부터 내장 DB처럼 검색됨)
      const id = "u-" + (simKey(it.query) || Date.now());
      target = { ...it, id, web: false, user: true, similar: undefined };
      applyFields(target, f);
      const u = store.get("useritems", {}); u[id] = target; store.set("useritems", u);
      DB.push(target);
    } else {
      applyFields(target, f);
      if (it.user) { const u = store.get("useritems", {}); u[it.id] = target; store.set("useritems", u); }
      else { const all = store.get("edits", {}); all[it.id] = { ...(all[it.id] || {}), ...f }; store.set("edits", all); }
    }
    store.del("img." + target.id);
    buildIndex(); close(); toast("저장했어요 — 다음 검색부터 반영됩니다");
    go(`#/item/${enc(target.id)}/overview`);
  };
}

/* ───────── 랭킹 (공식 출처 바로가기) ───────── */
const RANK_INFO = {
  sake: { t: "사케 랭킹", d: "さけのわ 인기 랭킹 (일본 최대 사케 유저 평점)", links: [["さけのわ ランキング", "https://sakenowa.com/ranking"]] },
  wine: { t: "와인 랭킹", d: "Wine Spectator Top 100 · Vivino · James Suckling", links: [["WS Top 100", "https://top100.winespectator.com/"], ["Vivino", "https://www.vivino.com/"], ["James Suckling", "https://www.jamessuckling.com/"], ["Robert Parker", "https://www.robertparker.com/"]] },
  whisky: { t: "위스키 랭킹", d: "World Whiskies Awards · ISC · IWSC · SFWSC", links: [["WWA", "https://www.worldwhiskiesawards.com/"], ["ISC", "https://www.isc.co.uk/"], ["IWSC", "https://www.iwsc.net/"], ["SFWSC", "https://sfspiritscomp.com/"]] },
  cognac: { t: "꼬냑 랭킹", d: "IWSC · San Francisco WSC · ISC 꼬냑 부문", links: [["IWSC", "https://www.iwsc.net/"], ["SFWSC", "https://sfspiritscomp.com/"], ["ISC", "https://www.isc.co.uk/"], ["BNIC", "https://www.cognac.fr/"]] },
  baijiu: { t: "중국술 랭킹", d: "中国名酒(전국평주회) · SFWSC · CMB 바이주 부문", links: [["SFWSC", "https://sfspiritscomp.com/"], ["CMB Spirits", "https://concoursmondial.com/"], ["中国名酒 검색", googleUrl("中国名酒 名单")], ["IWSC", "https://www.iwsc.net/"]] },
  soju: { t: "소주 랭킹", d: "대한민국주류대상 · 우리술 품평회 증류주 부문", links: [["대한민국주류대상", googleUrl("대한민국주류대상 소주 수상")], ["우리술 품평회", googleUrl("대한민국 우리술 품평회 증류주 대상")]] },
  makgeolli: { t: "막걸리·전통주 랭킹", d: "대한민국 우리술 품평회 · 대한민국주류대상", links: [["우리술 품평회", googleUrl("대한민국 우리술 품평회 탁주 대상")], ["대한민국주류대상", googleUrl("대한민국주류대상 막걸리")]] },
  beer: { t: "맥주 랭킹", d: "World Beer Cup · Untappd · RateBeer", links: [["World Beer Cup", "https://www.worldbeercup.org/"], ["Untappd Top", "https://untappd.com/beer/top_rated"], ["RateBeer Top", "https://www.ratebeer.com/top"]] },
};
function renderRanking(cat) {
  setChrome("ranking", "랭킹");
  if (!RANK_INFO[cat]) cat = "sake";
  const info = RANK_INFO[cat];
  view.innerHTML = `
    <div class="chips" id="rChips">${Object.keys(RANK_INFO).map((k) => `<button class="chip ${k === cat ? "active" : ""}" data-c="${k}">${CATS[k].emoji} ${CATS[k].ko}</button>`).join("")}</div>
    <section class="hero cat-${cat}" style="margin-bottom:12px"><span class="glyph">${bottle(cat)}</span>
      <span class="kind">Official Ranking</span><h2>${esc(info.t)}</h2><div class="names">${esc(info.d)}</div></section>
    <div class="panel"><h3>최신 순위 공식 사이트</h3><div class="linkbtns">${info.links.map(([n, u]) => `<a href="${safeUrl(u)}" target="_blank" rel="noopener">${esc(n)} ↗</a>`).join("")}</div></div>
    <div class="section-title">수록된 ${esc(CATS[cat].ko)} <small>${DB.filter((x) => x.cat === cat).length}종</small></div>
    <div id="rlist"></div>`;
  pagedList($("#rlist"), DB.filter((x) => x.cat === cat).sort((a, b) => (a.ko || "").localeCompare(b.ko || "", "ko")));
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
  const g = cseCfg();
  const nEdit = Object.keys(store.get("edits", {})).length, nUser = Object.keys(store.get("useritems", {})).length;
  view.innerHTML = `
    <div class="panel">
      <h3>Google 검색 보강 (선택)</h3>
      <p class="hint" style="margin-top:0">내장 DB·위키백과·위키데이터에 없는 술은 Google Custom Search 결과 요약에서 도수·국가·생산자를 뽑아 채우고 출처를 표시합니다. 사진도 Google 이미지에서 찾습니다. (무료 하루 100회)</p>
      <div class="field"><label>API 키</label><input id="gkey" type="password" autocomplete="off" placeholder="AIza…" value="${esc(g.key)}" /></div>
      <div class="field"><label>검색 엔진 ID (cx)</label><input id="gcx" autocomplete="off" placeholder="0123…:abc…" value="${esc(g.cx)}" /></div>
      <button class="btn block" id="gsave">저장</button>
      <button class="btn ghost block" id="gtest" style="margin-top:8px">연결 테스트</button>
      <div class="notice">발급: Google Cloud 콘솔에서 ‘Custom Search API’ 사용 설정 → API 키 생성, programmablesearchengine.google.com 에서 ‘전체 웹 검색’ 엔진을 만들고 ID 복사. 키는 이 기기에만 저장되며 googleapis.com 으로만 전송됩니다. ※ Google이 이 API의 신규 가입을 제한하고 있어 새 키 발급이 안 될 수 있습니다.</div>
    </div>
    <div class="panel">
      <h3>화면</h3>
      <div class="chips" id="theme" style="margin:0;padding:0">${[["system", "시스템"], ["light", "라이트"], ["dark", "다크"]].map(([k, v]) => `<button class="chip ${store.get("theme", "system") === k ? "active" : ""}" data-t="${k}">${v}</button>`).join("")}</div>
    </div>
    <div class="panel">
      <h3>데이터</h3>
      <p class="hint" style="margin-top:0">앱 버전 ${APP_VERSION} · 수록 ${DB.length.toLocaleString()}종 · 내가 수정한 술 ${nEdit}건 · 내가 저장한 술 ${nUser}건</p>
      <button class="btn ghost block" id="clear">최근 본 기록 지우기</button>
      <button class="btn ghost block" id="clearCache" style="margin-top:8px">웹 검색·사진 캐시 지우기</button>
      <button class="btn ghost block" id="clearMine" style="margin-top:8px">내 수정·저장 정보 모두 지우기</button>
    </div>
    <div class="panel">
      <h3>검색 팁</h3>
      <p>· 초성만: <b>ㅊㅇㅅ</b> → 참이슬, <b>ㅂㅂㄴ</b> → 발베니<br>· 일부 글자: <b>발베</b>, <b>맥캘</b><br>· 섞어서: <b>발ㅂ</b>, <b>참ㅇ</b><br>· 영어·일본어·중국어: <b>macallan</b>, <b>獺祭</b>, <b>茅台</b><br>· 없는 술은 Enter 또는 구글 추천어를 누르면 웹에서 정보를 모아 같은 형식으로 보여줍니다</p>
    </div>`;
  $("#gsave").onclick = () => { store.set("gcse", { key: $("#gkey").value.trim(), cx: $("#gcx").value.trim() }); toast("저장했어요"); };
  $("#gtest").onclick = async (e) => {
    store.set("gcse", { key: $("#gkey").value.trim(), cx: $("#gcx").value.trim() });
    if (!cseOn()) return toast("API 키와 검색 엔진 ID를 모두 입력해 주세요");
    e.target.disabled = true; e.target.textContent = "확인 중…";
    try { const r = await cse("Château Talbot"); toast(r.length ? "연결 성공 ✓" : "연결은 됐지만 결과가 없어요"); }
    catch (err) { toast("연결 실패 (" + err.message + ") — 키·ID·API 사용 설정을 확인하세요"); }
    finally { e.target.disabled = false; e.target.textContent = "연결 테스트"; }
  };
  $("#theme").onclick = (e) => { const b = e.target.closest("[data-t]"); if (b) { store.set("theme", b.dataset.t); renderSettings(); applyTheme(); } };
  $("#clear").onclick = () => { store.del("recent"); toast("최근 본 기록을 지웠습니다"); };
  $("#clearCache").onclick = () => { Object.keys(localStorage).filter((k) => /^sulsajeon\.(web2?|img)\./.test(k)).forEach((k) => localStorage.removeItem(k)); toast("캐시를 지웠습니다"); };
  $("#clearMine").onclick = () => { if (!confirm("직접 수정·저장한 정보를 모두 지울까요?")) return; store.del("edits"); store.del("useritems"); location.reload(); };
}

/* ───────── 시작 ───────── */
// 페어링 모듈(pairing.js)이 쓰는 공통 함수
window.SulApp = { $, view, esc, enc, go, store, setChrome, pagedList, itemRow, bindItems };
$("#setBtn").onclick = () => go("#/settings");
const APP_VERSION = "2026.11-v47";
var CELLAR; window.SulApp.cellar = () => CELLAR;
CELLAR = setupCellar({ store, $, view, esc, enc, toast, go, setChrome, bottle: window.bottle, CATS, findById, search, usdOf, fmtUSDv, fxRate, shrink, cse, cseOn, inferFromName, render: () => render() });
loadFX().then(() => { if (/#\/(item|browse|ranking)/.test(location.hash)) render(); });
// 이전 버전에서 저장된 AI 설정·캐시 정리
try { Object.keys(localStorage).filter((k) => /^sulsajeon\.(settings|aiItems|live\.|rank\.)/.test(k)).forEach((k) => localStorage.removeItem(k)); } catch {}
if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
render();
