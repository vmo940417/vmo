/* 술사전 — 주종별 병 일러스트 (SVG, currentColor) */
window.BOTTLES = (() => {
  const s = (body) => `<svg class="btl" viewBox="0 0 64 80" aria-hidden="true">${body}</svg>`;
  const lbl = 'fill="currentColor" opacity=".28"';
  return {
    // 와인: 어깨가 둥근 보르도병 + 라벨 + 캡슐
    wine: s(`<path fill="currentColor" d="M28 4h8v4h-8z" opacity=".75"/><path fill="currentColor" d="M28.5 8h7v14c0 3 9 6 9 15v36a4 4 0 0 1-4 4H23.5a4 4 0 0 1-4-4V37c0-9 9-12 9-15z"/><rect x="22.5" y="46" width="19" height="16" rx="2" ${lbl}/><path d="M26 51h12M27.5 55.5h9" stroke="currentColor" stroke-width="1.3" opacity=".55"/>`),
    // 사케: 도쿠리(술병) + 오초코(잔)
    sake: s(`<path fill="currentColor" d="M25 6h10v3h-10z" opacity=".75"/><path fill="currentColor" d="M26.5 9h7v9c0 2.5 5 5 9 12 4 8 4.5 20 0 31-2.5 6-6.5 9-11.5 9s-9-3-11.5-9c-4.5-11-4-23 0-31 4-7 7-9.5 7-12z"/><path d="M19 44c8 3 18 3 26 0" stroke="currentColor" stroke-width="1.6" opacity=".35" fill="none"/><path fill="currentColor" opacity=".8" d="M47 62h13l-1.5 8a3 3 0 0 1-3 2.5h-4a3 3 0 0 1-3-2.5z"/>`),
    // 위스키: 각진 병 + 짧은 목 + 큰 라벨
    whisky: s(`<rect x="27" y="4" width="10" height="7" rx="1.5" fill="currentColor" opacity=".75"/><path fill="currentColor" d="M28.5 11h7v6c6 1 11 4 11 9v46a4 4 0 0 1-4 4H21.5a4 4 0 0 1-4-4V26c0-5 5-8 11-9z"/><rect x="21" y="38" width="22" height="22" rx="1.5" ${lbl}/><path d="M25 45h14M26.5 50h11M28 55h8" stroke="currentColor" stroke-width="1.3" opacity=".55"/>`),
    // 꼬냑: 둥근 디캔터 + 마개
    cognac: s(`<path fill="currentColor" opacity=".8" d="M27 3h10a3 3 0 0 1 0 6H27a3 3 0 0 1 0-6z"/><path fill="currentColor" d="M28.5 9h7v12c9 3 15 11 15 22 0 15-8.5 32-18.5 32S13.5 58 13.5 43c0-11 6-19 15-22z"/><ellipse cx="32" cy="50" rx="10" ry="7" ${lbl}/><path d="M18 34c4-4 9-6 14-6" stroke="currentColor" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/>`),
    // 중국술: 원통형 백자 병 + 붉은 띠
    baijiu: s(`<rect x="27" y="4" width="10" height="9" rx="2" fill="currentColor" opacity=".85"/><path fill="currentColor" d="M28 13h8l2 5h5a3 3 0 0 1 3 3v52a4 4 0 0 1-4 4H22a4 4 0 0 1-4-4V21a3 3 0 0 1 3-3h5z"/><path d="M24 13c4 3 12 3 16 0l1 6c-6 3-12 3-18 0z" fill="currentColor" opacity=".4"/><rect x="22" y="40" width="20" height="18" rx="9" ${lbl}/>`),
    // 소주: 초록 병, 가는 목, 돌림 캡
    soju: s(`<rect x="27.5" y="4" width="9" height="8" rx="1.5" fill="currentColor" opacity=".75"/><path d="M28 7.5h8" stroke="currentColor" stroke-width="1" opacity=".4"/><path fill="currentColor" d="M29 12h6v10c0 2 7 4 7 11v40a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4V33c0-7 7-9 7-11z"/><rect x="24.5" y="44" width="15" height="17" rx="1.5" ${lbl}/><path d="M24 36h16" stroke="currentColor" stroke-width="1.2" opacity=".3"/>`),
    // 막걸리: 페트병 + 사발
    makgeolli: s(`<rect x="15" y="4" width="10" height="6" rx="1.5" fill="currentColor" opacity=".8"/><path fill="currentColor" d="M16 10h8v4c4 2 6 5 6 9v38a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3V23c0-4 2-7 6-9z"/><path d="M10 30h20M10 34h20" stroke="currentColor" stroke-width="1" opacity=".3"/><rect x="12.5" y="40" width="15" height="13" rx="1.5" ${lbl}/><path fill="currentColor" opacity=".85" d="M30 56h30c0 9-6.5 16-15 16s-15-7-15-16z"/><ellipse cx="45" cy="56" rx="15" ry="2.6" fill="currentColor" opacity=".45"/>`),
    // 맥주: 거품 맥주잔
    beer: s(`<path fill="currentColor" opacity=".55" d="M16 14c0-5 4-8 8-7 2-4 9-5 12-1 4-2 10 1 10 6 3 0 5 3 4 6H16z"/><path fill="currentColor" d="M16 18h30v50a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5z"/><path d="M46 28h5a6 6 0 0 1 6 6v14a6 6 0 0 1-6 6h-5" stroke="currentColor" stroke-width="5" fill="none"/><path d="M23 28v38M31 28v38M39 28v38" stroke="currentColor" stroke-width="1.5" opacity=".3"/>`),
    // 기타(보드카·진·칵테일): 마티니 잔 + 올리브
    other: s(`<path fill="currentColor" d="M8 12h48L35 38v26h11v6H18v-6h11V38z"/><path d="M14 18h36" stroke="currentColor" stroke-width="1.5" opacity=".35"/><circle cx="40" cy="22" r="4" fill="currentColor" opacity=".45"/><path d="M40 22 50 6" stroke="currentColor" stroke-width="1.6" opacity=".6"/>`),
  };
})();
window.bottle = (cat) => window.BOTTLES[cat] || window.BOTTLES.other;
