/* 술사전 — 참고가를 '생산국 현지 소매가(현지 통화)'로 통일
 * 앱에서 실시간 환율로 USD 환산해 표시한다(오프라인이면 아래 내장 환율).
 * 현지가는 추정치:
 *  - 사케 대표 라인업: 일본 720ml 소매 통상가(등급별)
 *  - 한국 술: 국내 소매가 그대로(원화)
 *  - 그 밖: 기존 참고가(한국 소매가·미국 소매가)에서 통상적인 수입·유통 마진을 걷어낸 값
 */
(() => {
  const REF = { USD: 1, EUR: 0.92, GBP: 0.78, JPY: 150, CNY: 7.2, TWD: 32, KRW: 1400, AUD: 1.52, NZD: 1.68, CLP: 950, ZAR: 18, CAD: 1.37, MXN: 18.5,
    HUF: 360, INR: 84, THB: 35, PHP: 57, IDR: 15800, VND: 25000, TRY: 34, CZK: 23, DKK: 6.9, SEK: 10.6, PLN: 4, RUB: 90, SGD: 1.34, ILS: 3.7, GEL: 2.7 };
  window.FX_REF = REF;
  const CUR = { 프랑스: "EUR", 이탈리아: "EUR", 스페인: "EUR", 포르투갈: "EUR", 독일: "EUR", 오스트리아: "EUR", 그리스: "EUR", 벨기에: "EUR", 네덜란드: "EUR", 아일랜드: "EUR",
    슬로베니아: "EUR", 핀란드: "EUR", 라트비아: "EUR", 스코틀랜드: "GBP", 영국: "GBP", 미국: "USD", 칠레: "CLP", 아르헨티나: "USD", 호주: "AUD", 뉴질랜드: "NZD",
    남아프리카공화국: "ZAR", 일본: "JPY", 중국: "CNY", 대만: "TWD", 대한민국: "KRW", 캐나다: "CAD", 멕시코: "MXN", 헝가리: "HUF", 인도: "INR", 태국: "THB", 필리핀: "PHP",
    인도네시아: "IDR", 베트남: "VND", 튀르키예: "TRY", 체코: "CZK", 덴마크: "DKK", 스웨덴: "SEK", 폴란드: "PLN", 러시아: "RUB", 싱가포르: "SGD", 이스라엘: "ILS", 조지아: "GEL" };
  // 한국 소매가 ÷ 현지 소매가(USD 환산) 통상 배수
  const KR_MARKUP = { wine: 2.0, whisky: 1.7, cognac: 1.7, other: 1.7, beer: 1.6, baijiu: 1.6, sake: 2.0 };
  const SAKE_JPY = { "준마이 다이긴죠": 3300, "준마이 긴죠": 2200, "준마이": 1700 };
  const round = (n, cur) => {
    if (["JPY", "KRW", "CLP", "HUF", "IDR", "VND", "INR", "PHP", "RUB", "TWD", "THB"].includes(cur)) return n >= 10000 ? Math.round(n / 1000) * 1000 : Math.max(100, Math.round(n / 100) * 100);
    if (n >= 1000) return Math.round(n / 50) * 50;
    if (n >= 100) return Math.round(n / 5) * 5;
    return Math.max(1, Math.round(n * 2) / 2);
  };
  for (const it of window.LIQUORS) {
    const p = it.price || {};
    const cur = CUR[it.country] || "USD";
    let local = null, basis = "";
    if (it.country === "대한민국") {
      local = p.krw || (p.usd ? ((p.usd[0] + p.usd[1]) / 2) * REF.KRW : null); basis = "국내 소매가";
    } else if (it.cat === "sake" && it.lineup && SAKE_JPY[it.style]) {
      local = SAKE_JPY[it.style]; basis = "일본 720ml 소매 통상가(등급 기준)";
    } else {
      let usd = null;
      if (p.usd?.length) {
        const mid = (p.usd[0] + p.usd[1]) / 2;
        usd = mid / (it.country === "미국" ? 1 : it.cat === "sake" ? 2.7 : it.country === "일본" ? 1.8 : 1.3);
        basis = "미국 소매가에서 수입 마진 제외 추정";
      } else if (p.krw) {
        usd = p.krw / REF.KRW / (KR_MARKUP[it.cat] || 1.8);
        basis = "국내 소매가에서 수입 세금·마진 제외 추정";
      }
      if (usd != null) local = usd * REF[cur];
    }
    if (local != null && isFinite(local)) it.price = { ...p, local: round(local, cur), cur, basis };
  }
})();
