/* 오늘술상 — 라벨 사진의 글자를 기기 안에서 읽어(OCR) 수록된 술에서 찾는다.
 * - 글자 인식: Tesseract.js (vendor/ocr 에 자체 호스팅, 외부 CDN 없음). 처음 한 번 엔진·언어 데이터를 내려받고 이후엔 기기에 저장된 것을 쓴다.
 * - 1차로 영어(라틴 문자) 라벨을 읽고, 맞는 술이 없으면 한국어·일본어·중국어로 한 번 더 읽는다.
 * - 찾기: 라벨 글자 토큰과 술 이름·생산자 토큰을 비교. 흔한 단어(chardonnay, valley 등)는 가중치를 낮추고(IDF) 철자 1~2자 오류는 허용.
 * app.js 의 카메라 시트(showLensSheet)가 window.LabelOCR.attach(시트, 사진)을 부른다.
 */
(() => {
  const BASE = "vendor/ocr";
  const READY_KEY = "sulsajeon.ocrReady";
  const LATIN_STOP = new Set(["the", "and", "of", "de", "la", "le", "les", "du", "des", "di", "del", "della", "da", "von", "van", "et",
    "wine", "vin", "vino", "red", "white", "rouge", "blanc", "product", "produce", "produced", "bottled", "by", "estate", "year", "years", "old", "aged", "ml", "vol", "alc"]);

  /* ── 토큰 ───────────────── */
  const fold = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  // OCR 이 자주 헷갈리는 숫자↔글자(0/O, 1/l, 5/S)를 글자가 섞인 단어 안에서만 바로잡는다
  const deOcr = (w) => (/[a-z]/.test(w) && /[015]/.test(w) ? w.replace(/0/g, "o").replace(/1/g, "l").replace(/5/g, "s") : w);
  const latinTokens = (s) => (fold(s).match(/[a-z0-9][a-z0-9']{2,}/g) || []).map((t) => deOcr(t.replace(/'/g, "")))
    .filter((t) => /^[a-z]/.test(t) && t.length >= 3 && !LATIN_STOP.has(t));
  const numbers = (s) => new Set(String(s || "").match(/\b\d{1,4}\b/g) || []);
  const hangulTokens = (s) => String(s || "").match(/[가-힣]{2,}/g) || [];
  const cjk = (s) => (String(s || "").match(/[぀-ヿ㐀-鿿]+/g) || []).join("");
  const bigrams = (s) => { const a = new Set(); for (let i = 0; i < s.length - 1; i++) a.add(s.slice(i, i + 2)); return a; };

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i]; let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        best = Math.min(best, cur[j]);
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  // 짧은 단어는 철자 오류를 허용하지 않는다 (aubert↔albert, grand↔grant 오인 방지)
  const allowed = (len) => (len >= 9 ? 2 : len >= 7 ? 1 : 0);

  /* ── 술 이름 색인 (처음 쓸 때 한 번) ───────────────── */
  let INDEX = null;
  function buildIndex(db) {
    const df = new Map();
    const items = db.map((it) => {
      const nameLatin = [...new Set(latinTokens(it.en))];
      const aliasLatin = [...new Set((it.aliases || []).flatMap(latinTokens))].filter((t) => !nameLatin.includes(t));
      const prodLatin = [...new Set(latinTokens(it.producer))].filter((t) => !nameLatin.includes(t));
      const hangul = [...new Set([...hangulTokens(it.ko), ...(it.aliases || []).flatMap(hangulTokens)])];
      const han = [it.ja, it.zh, ...(it.aliases || [])].map(cjk).filter((x) => x.length >= 2);
      const nums = [...numbers(`${it.en} ${it.ko}`)].filter((n) => !/^(19|20)\d\d$/.test(n));  // 빈티지 연도는 제외
      for (const t of new Set([...nameLatin, ...prodLatin, ...hangul])) df.set(t, (df.get(t) || 0) + 1);
      return { it, nameLatin, aliasLatin, prodLatin, hangul, han, nums };
    });
    const N = db.length;
    const idf = (t) => Math.log((N + 1) / ((df.get(t) || 0) + 1));
    // 브랜드 단어: 이름에서 처음 나오는 흔하지 않은 단어(château·domaine 같은 흔한 말은 건너뜀) + 생산자 이름의 흔하지 않은 단어
    for (const x of items) {
      const first = x.nameLatin.find((t) => idf(t) >= 4);
      x.brand = [...(first ? [first] : []), ...x.prodLatin.filter((t) => idf(t) >= 4)];
    }
    return { items, idf };
  }

  /** 라벨 글자 → 수록된 술 후보 (점수 높은 순) */
  function match(text, db = window.LIQUORS, limit = 5) {
    INDEX ||= buildIndex(db);
    const { items, idf } = INDEX;
    const ocrLatin = [...new Set(latinTokens(text))];
    const ocrHangul = new Set(hangulTokens(text));
    const ocrHan = cjk(text);
    const ocrHanBi = bigrams(ocrHan);
    const ocrNums = numbers(text);
    const joined = ocrLatin.join("");
    const hit = (t) => ocrLatin.some((o) => o === t || (allowed(t.length) && lev(o, t, allowed(t.length)) <= allowed(t.length)))
      || (t.length >= 7 && joined.includes(t));
    const out = [];
    for (const x of items) {
      let got = 0, total = 0, distinctive = 0, script = false;
      for (const t of x.nameLatin) { const w = idf(t); total += w; if (hit(t)) { got += w; if (w > 3) distinctive++; } }
      for (const t of x.aliasLatin) { if (hit(t)) { got += idf(t) * 0.8; distinctive++; } }
      for (const t of x.prodLatin) { if (hit(t)) { const w = idf(t) * 0.6; got += w; if (idf(t) > 3) distinctive++; } }
      for (const t of x.hangul) { const w = idf(t); total += w; if ([...ocrHangul].some((o) => o.includes(t) || (t.includes(o) && o.length >= 2))) { got += w; script = true; if (w > 3) distinctive++; } }
      for (const h of x.han) {
        if (ocrHan.includes(h)) { got += 4 + h.length; distinctive++; script = true; break; }
        const hb = bigrams(h); let common = 0; hb.forEach((b) => ocrHanBi.has(b) && common++);
        if (hb.size && common / hb.size >= 0.6) { got += 3 * common / hb.size + h.length / 2; distinctive++; script = true; break; }
      }
      if (!distinctive || got < 3.5) continue;
      // 라틴 문자로만 맞았다면 브랜드 단어가 하나는 맞아야 한다.
      // 'Russian River Valley Chardonnay' 같은 흔한 산지·품종명만으로 다른 와이너리를 고르지 않게
      if (!script && x.brand.length && !x.brand.some(hit) && !x.aliasLatin.some(hit)) continue;
      const coverage = total ? Math.min(1, got / total) : 0.5;
      let score = got * (0.5 + coverage);
      if (x.nums.length) score *= x.nums.some((n) => ocrNums.has(n)) ? 1.35 : 0.85;   // 12년·25도·23 같은 숫자로 정확한 제품을 고른다
      if (!script && score < 7) continue;   // 라틴 문자로 약하게만 맞은 후보는 버린다
      out.push({ it: x.it, score });
    }
    out.sort((a, b) => b.score - a.score);
    // 1위와 너무 차이 나는 후보는 빼서 엉뚱한 술이 섞이지 않게
    const top = out[0]?.score || 0;
    return out.filter((r) => r.score >= top * 0.45).slice(0, limit);
  }

  /** 웹 검색에 넘길 깔끔한 라벨 글자 (의미 있는 단어만, 최대 8개) */
  function queryFrom(text) {
    const words = [...latinTokens(text).filter((t) => t.length >= 4 || /\d/.test(t)), ...hangulTokens(text)];
    const han = String(text || "").match(/[぀-ヿ㐀-鿿]{2,}/g) || [];
    const years = String(text || "").match(/\b(19|20)\d{2}\b/g) || [];
    const uniq = [...new Set([...words, ...han])].slice(0, 8);
    return [...uniq, ...years.slice(0, 1)].join(" ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  /* ── 글자 인식 엔진 ───────────────── */
  let libPromise = null, worker = null, workerLangs = "";
  function loadLib() {
    libPromise ||= new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = `${BASE}/tesseract.min.js`; s.onload = () => res(window.Tesseract); s.onerror = () => rej(new Error("엔진을 불러오지 못했어요"));
      document.head.appendChild(s);
    });
    return libPromise;
  }
  async function recognize(blob, langs, onProgress) {
    const T = await loadLib();
    const key = langs.join("+");
    if (!worker) {
      worker = await T.createWorker(langs, T.OEM.LSTM_ONLY, {
        workerPath: `${BASE}/worker.min.js`, corePath: `${BASE}/core`, langPath: `${BASE}/lang`, gzip: true,
        logger: (m) => onProgress?.(m),
      });
      workerLangs = key;
    } else if (workerLangs !== key) {
      await worker.reinitialize(langs, T.OEM.LSTM_ONLY);
      workerLangs = key;
    }
    const { data } = await worker.recognize(blob);
    try { localStorage.setItem(READY_KEY, "1"); } catch {}
    return data.text || "";
  }

  /** 글자 인식용 이미지: 원본을 긴 변 2400px 이하로 (작은 글씨가 뭉개지지 않게 렌즈용 1600px 보다 크게) */
  async function ocrImage(shot) {
    if (!shot.file) return shot.blob;
    try {
      const bmp = await createImageBitmap(shot.file);
      const k = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
      const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
      c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
      return c;
    } catch { return shot.blob; }
  }
  // 의미 있는 글자가 6자 이상일 때만 '읽었다'고 본다 (필기체에서 나오는 'Alin' 같은 잡음 제외)
  const readable = (text) => (String(text).match(/[A-Za-z]{3,}|[가-힣]{2,}|[\u3040-\u30ff\u3400-\u9fff]{2,}/g) || []).join("").length >= 6;

  /* ── 카메라 시트에 붙는 화면 ───────────────── */
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const isReady = () => { try { return localStorage.getItem(READY_KEY) === "1"; } catch { return false; } };
  const STAGE = { "loading tesseract core": "글자 인식 엔진 준비 중", "initializing tesseract": "엔진 시작 중", "loading language traineddata": "언어 데이터 받는 중",
    "initializing api": "언어 준비 중", "recognizing text": "라벨 글자 읽는 중" };

  function attach(sheet, shot) {
    const box = document.createElement("div");
    box.className = "ocr-box";
    sheet.querySelector(".sheet-h").before(box);
    sheet.querySelector(".sheet-h").textContent = "구글 렌즈로 찾기";
    const close = () => sheet.closest(".sheet-wrap")?.remove();
    const idle = () => {
      box.innerHTML = `<button class="btn gold block" data-o="run">앱에서 라벨 읽기</button>
        <p class="hint ocr-note">사진 속 라벨 글자를 이 휴대폰 안에서 읽어 수록된 술에서 찾아요.${isReady() ? "" : " 처음 한 번은 글자 인식 데이터(약 7MB)를 내려받습니다."}</p>`;
      box.querySelector("[data-o=run]").onclick = run;
    };
    const status = (msg, pct) => {
      box.innerHTML = `<div class="ocr-status"><span class="ocr-spin"></span><span>${esc(msg)}${pct != null ? ` ${pct}%` : ""}</span></div>`;
    };
    async function run() {
      status("라벨 글자 읽는 중");
      const progress = (m) => status(STAGE[m.status] || "준비 중", m.progress != null && m.progress < 1 ? Math.round(m.progress * 100) : null);
      try {
        const image = await ocrImage(shot);
        let text = await recognize(image, ["eng"], progress);
        let found = match(text);
        if (!found.length) {                      // 라틴 문자로 못 찾으면 한·중·일 문자로 한 번 더
          status("한국어·일본어·중국어로 다시 읽는 중");
          const more = await recognize(image, ["kor", "jpn", "chi_sim"], progress);
          text = `${text}\n${more}`;
          found = match(text);
        }
        show(text, found);
      } catch (e) {
        box.innerHTML = `<p class="hint ocr-note">라벨을 읽지 못했어요 (${esc(e.message || e)}). 아래 구글 렌즈로 찾아보세요.</p>`;
      }
    }
    function show(text, found) {
      const q = found.length || readable(text) ? queryFrom(text) : "";
      const { itemRow, go } = window.SulApp;
      box.innerHTML = `
        ${found.length
          ? `<div class="ocr-h">라벨과 맞는 술 <small>${found.length}건</small></div><div class="list">${found.map((r) => itemRow(r.it)).join("")}</div>`
          : readable(text)
            ? `<div class="ocr-h">수록된 술에서 찾지 못했어요</div><p class="hint ocr-note">읽은 글자로 웹에서 찾거나, 아래 구글 렌즈를 써 보세요.</p>`
            : `<div class="ocr-h">라벨 글자를 읽지 못했어요</div><p class="hint ocr-note">필기체·장식 글씨는 읽기 어려워요. 라벨이 화면에 가득 차게, 밝은 곳에서 흔들림 없이 다시 찍거나 이름을 직접 입력하세요. 구글 렌즈는 필기체도 잘 찾습니다.</p>`}
        <label class="ocr-label" for="ocrq">${q ? "읽은 글자 <small>틀린 글자는 고쳐서 검색하세요</small>" : "술 이름 직접 입력"}</label>
        <input id="ocrq" class="ocr-q" type="search" enterkeyhint="search" value="${esc(q)}" placeholder="예) Aubert Chardonnay" />
        <div class="linkbtns ocr-actions">
          <button class="btn ghost" data-o="search">앱에서 검색</button>
          <button class="btn ghost" data-o="web">웹에서 정보 찾기</button>
        </div>`;
      const val = () => box.querySelector("#ocrq").value.trim();
      box.querySelectorAll(".item[data-id]").forEach((el) => (el.onclick = () => { close(); go(`#/item/${encodeURIComponent(el.dataset.id)}/overview`); }));
      box.querySelector("[data-o=search]").onclick = () => { if (val()) { close(); go(`#/search?q=${encodeURIComponent(val())}`); } };
      box.querySelector("[data-o=web]").onclick = () => { if (val()) { close(); go(`#/web/${encodeURIComponent(val())}/overview`); } };
      box.querySelector("#ocrq").onkeydown = (e) => { if (e.key === "Enter") box.querySelector("[data-o=search]").click(); };
    }
    if (isReady()) run(); else idle();
  }

  window.LabelOCR = { attach, match, queryFrom };
})();
