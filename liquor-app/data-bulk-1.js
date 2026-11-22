/* 술사전 대량 DB (1) — 공통 도우미 + 와인
 * 한국 시판 위주. 도수는 대표값, 참고가(₩)는 국내 마트·전문점 기준 근사치.
 */
(() => {
  const L = window.LIQUORS, P = window.PAIRING_PRESETS;
  Object.assign(P, {
    yakju: { good: ["전·부침개", "잡채", "갈비찜", "한과·약과"], avoid: ["매운 양념 과다", "탄산음료 혼합"], temp: "8~12℃", glass: "작은 잔·잔술잔", decant: "불필요", caution: "단맛이 있는 약주·과실주는 과음하기 쉬우니 천천히." },
    liqueur: { good: ["칵테일 베이스", "디저트·아이스크림", "커피"], avoid: ["짠 안주", "공복 음용"], temp: "냉장 또는 얼음", glass: "록 글라스·리큐어잔", decant: "불필요", caution: "당분이 많아 소량씩. 개봉 후 서늘한 곳 보관." },
    shochu: { good: ["야키토리", "돈코츠·사쓰마아게", "고구마 요리", "회"], avoid: ["단 디저트"], temp: "온더락 · 미즈와리 · 오유와리(따뜻한 물)", glass: "록 글라스", decant: "불필요", caution: "25도 전후 — 물·얼음으로 희석해 식중주로." },
  });
  const key = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9぀-ヿ一-鿿가-힣]+/g, "");
  const seen = new Set(L.map((x) => key(x.en || x.ko)));
  const ids = new Set(L.map((x) => x.id));
  const add = (o) => {
    const k = key(o.en || o.ko); if (!k || seen.has(k)) return; seen.add(k);
    let id = "b-" + (key(o.en).replace(/[^a-z0-9]/g, "").slice(0, 48) || key(o.ko).slice(0, 24));
    while (ids.has(id)) id += "-2"; ids.add(id);
    const { p, ...rest } = o;
    L.push({ id, bulk: true, ratings: [], ...rest, pairing: P[p] || P.spirit });
  };
  /** 범용 행: [한글명, "English|原語", 스타일, 도수, 국가, 산지, 생산자, 참고가₩, "원료/원료", 프리셋] */
  const rows = (cat, preset, list) => list.forEach(([ko, en, style, abv, country, region, producer, krw, ing, pr]) => {
    const [e, orig] = String(en).split("|");
    add({ cat, ko, en: e, [cat === "baijiu" ? "zh" : "ja"]: orig || "", style, abv: abv ? `${abv}%` : "", country, region, producer,
      price: krw ? { krw } : null, ingredients: ing ? ing.split("/").map((name) => ({ name })) : [], p: pr || preset });
  });
  window.BULK = { add, rows, key, P };

  /* ── 와인: 생산자 라인 × 품종 ── */
  const G = {
    CS: ["까베르네 소비뇽", "Cabernet Sauvignon", "레드"], ME: ["메를로", "Merlot", "레드"], PN: ["피노 누아", "Pinot Noir", "레드"],
    SY: ["쉬라즈", "Shiraz", "레드"], SR: ["시라", "Syrah", "레드"], MA: ["말벡", "Malbec", "레드"], CA: ["까르메네르", "Carmenère", "레드"],
    ZI: ["진판델", "Zinfandel", "레드"], SG: ["산지오베제", "Sangiovese", "레드"], TE: ["템프라니요", "Tempranillo", "레드"],
    GA: ["가르나차", "Garnacha", "레드"], CF: ["까베르네 프랑", "Cabernet Franc", "레드"], RB: ["레드 블렌드", "Red Blend", "레드"],
    CH: ["샤르도네", "Chardonnay", "화이트"], SB: ["소비뇽 블랑", "Sauvignon Blanc", "화이트"], RI: ["리슬링", "Riesling", "화이트"],
    PG: ["피노 그리지오", "Pinot Grigio", "화이트"], VI: ["비오니에", "Viognier", "화이트"], MO: ["모스카토", "Moscato", "스위트"],
    RO: ["로제", "Rosé", "로제"],
  };
  const presetOf = (code, color) => code === "PN" ? "pinot" : code === "SG" ? "italian" : code === "TE" || code === "GA" ? "spanish" : color === "레드" ? "redFull" : color === "스위트" ? "sweet" : "whiteCrisp";
  const WS = (ko, en, producer, country, region, abv, krw, codes) => codes.split(" ").forEach((c) => {
    const [gk, ge, color] = G[c];
    add({ cat: "wine", ko: `${ko} ${gk}`, en: `${en} ${ge}`, style: `${color} · ${gk}`, abv: `${abv}%`, country, region, producer,
      price: { krw }, ingredients: c === "RB" || c === "RO" ? [] : [{ name: ge, pct: 100 }], p: presetOf(c, color) });
  });
  // 칠레
  WS("까시예로 델 디아블로", "Casillero del Diablo", "Concha y Toro", "칠레", "센트럴 밸리", 13.5, 16000, "CS ME CA MA PN SY CH SB");
  WS("콘차이토로 프론테라", "Frontera", "Concha y Toro", "칠레", "센트럴 밸리", 13, 9000, "CS ME CA CH SB");
  WS("콘차이토로 선라이즈", "Sunrise", "Concha y Toro", "칠레", "센트럴 밸리", 13, 11000, "CS ME CA CH SB");
  WS("마르께스 데 까사 콘차", "Marqués de Casa Concha", "Concha y Toro", "칠레", "마이포·리마리", 14, 38000, "CS CA ME CH PN");
  WS("몬테스 클래식", "Montes Classic Series", "Viña Montes", "칠레", "콜차구아", 13.5, 18000, "CS ME MA CA CH SB");
  WS("몬테스 알파", "Montes Alpha", "Viña Montes", "칠레", "콜차구아·아팔타", 14, 33000, "ME CA SR PN CH MA");
  WS("산타 리타 120", "Santa Rita 120", "Viña Santa Rita", "칠레", "센트럴 밸리", 13.5, 13000, "CS ME CA CH SB");
  WS("코노 수르 비씨클레타", "Cono Sur Bicicleta", "Viña Cono Sur", "칠레", "센트럴 밸리", 13.5, 14000, "PN CS ME CA CH SB RI VI");
  WS("코노 수르 20 배럴", "Cono Sur 20 Barrels", "Viña Cono Sur", "칠레", "카사블랑카·마이포", 14, 48000, "PN CS CH SB");
  WS("1865 싱글 빈야드", "1865 Single Vineyard", "Viña San Pedro", "칠레", "마이포·엘키", 14, 28000, "CA SR MA SB");
  WS("산 페드로 35 사우스", "35 South", "Viña San Pedro", "칠레", "센트럴 밸리", 13, 11000, "CS ME CA CH SB");
  WS("에라주리즈 맥스", "Errázuriz Max", "Viña Errázuriz", "칠레", "아콩카구아", 14, 32000, "CS CA CH SB SR PN");
  WS("타라파카 그란 레세르바", "Tarapacá Gran Reserva", "Viña Tarapacá", "칠레", "마이포", 14, 26000, "CS CA ME");
  WS("칼리테라 레세르바", "Caliterra Reserva", "Viña Caliterra", "칠레", "콜차구아", 13.5, 14000, "CS ME CA CH SB");
  WS("운두라가 시바리스", "Undurraga Sibaris", "Viña Undurraga", "칠레", "센트럴 밸리", 13.5, 22000, "CS CA PN CH SB");
  // 아르헨티나
  WS("카테나", "Catena", "Bodega Catena Zapata", "아르헨티나", "멘도사", 13.5, 32000, "CS CH");
  WS("알라모스", "Alamos", "Bodega Catena Zapata", "아르헨티나", "멘도사", 13.5, 16000, "MA CS CH");
  WS("트라피체 오크 캐스크", "Trapiche Oak Cask", "Trapiche", "아르헨티나", "멘도사", 13.5, 14000, "MA CS CH");
  WS("노르톤 레세르바", "Norton Reserva", "Bodega Norton", "아르헨티나", "멘도사", 14, 26000, "MA CS");
  WS("엘 에스테코 돈 다비드", "El Esteco Don David", "El Esteco", "아르헨티나", "살타 칼차키 밸리", 14, 25000, "MA CS");
  // 미국
  WS("우드브릿지", "Woodbridge by Robert Mondavi", "Constellation Brands", "미국", "캘리포니아", 13.5, 13000, "CS ME CH PN SB MO");
  WS("로버트 몬다비 프라이빗 셀렉션", "Robert Mondavi Private Selection", "Robert Mondavi", "미국", "캘리포니아", 13.5, 23000, "CS ME CH PN");
  WS("베린저 파운더스 에스테이트", "Beringer Founders' Estate", "Beringer Vineyards", "미국", "캘리포니아", 13.5, 25000, "CS ME CH PN ZI");
  WS("켄달 잭슨 빈트너스 리저브", "Kendall-Jackson Vintner's Reserve", "Kendall-Jackson", "미국", "캘리포니아", 13.5, 36000, "CH CS PN ME SB");
  WS("베어풋", "Barefoot", "E. & J. Gallo", "미국", "캘리포니아", 12, 11000, "MO CS ME CH PG PN");
  WS("조시 셀라스", "Josh Cellars", "Deutsch Family", "미국", "캘리포니아", 13.5, 26000, "CS CH PN ME SB");
  WS("메이오미", "Meiomi", "Constellation Brands", "미국", "캘리포니아 코스트", 13.8, 38000, "PN CH");
  WS("라 크레마 소노마 코스트", "La Crema Sonoma Coast", "La Crema", "미국", "소노마 코스트", 13.5, 48000, "PN CH");
  WS("클로 뒤 부아", "Clos du Bois", "Clos du Bois", "미국", "소노마", 13.5, 26000, "CH CS ME");
  WS("덕혼 나파 밸리", "Duckhorn Napa Valley", "Duckhorn Vineyards", "미국", "나파 밸리", 14.5, 115000, "ME CS SB");
  WS("디코이", "Decoy", "Duckhorn Vineyards", "미국", "소노마 카운티", 13.9, 42000, "CS ME PN CH SB ZI");
  WS("보글", "Bogle", "Bogle Vineyards", "미국", "캘리포니아", 13.5, 22000, "CS ME CH PN ZI");
  WS("14 핸즈", "14 Hands", "Ste. Michelle Wine Estates", "미국", "워싱턴", 13.5, 20000, "CS ME CH");
  WS("샤토 생 미셸", "Chateau Ste. Michelle", "Ste. Michelle Wine Estates", "미국", "워싱턴 컬럼비아 밸리", 13.5, 25000, "CS ME CH RI");
  // 호주·뉴질랜드
  WS("옐로우 테일", "[yellow tail]", "Casella Family Brands", "호주", "사우스 이스턴 오스트레일리아", 13, 11000, "SY CS ME CH MO PG SB PN");
  WS("제이콥스 크릭 클래식", "Jacob's Creek Classic", "Pernod Ricard Winemakers", "호주", "사우스 오스트레일리아", 13.5, 13000, "SY CS ME CH RI MO");
  WS("펜폴즈 쿠누가 힐", "Penfolds Koonunga Hill", "Penfolds", "호주", "사우스 오스트레일리아", 13.5, 27000, "SY CS CH");
  WS("펜폴즈 맥스", "Penfolds Max's", "Penfolds", "호주", "사우스 오스트레일리아", 14, 38000, "SY CS CH");
  WS("울프 블라스 옐로우 라벨", "Wolf Blass Yellow Label", "Wolf Blass", "호주", "사우스 오스트레일리아", 13.5, 19000, "CS SY ME CH");
  WS("린드만", "Lindeman's Bin Series", "Treasury Wine Estates", "호주", "사우스 이스턴 오스트레일리아", 13, 12000, "SY CS ME CH");
  WS("하디스 스탬프", "Hardys Stamp", "Accolade Wines", "호주", "사우스 이스턴 오스트레일리아", 13, 11000, "SY CS CH");
  WS("클라우디 베이", "Cloudy Bay", "Cloudy Bay", "뉴질랜드", "말보로", 13.5, 70000, "PN CH");
  WS("킴 크로포드", "Kim Crawford", "Kim Crawford", "뉴질랜드", "말보로", 13, 26000, "PN CH RO");
  WS("빌라 마리아 프라이빗 빈", "Villa Maria Private Bin", "Villa Maria", "뉴질랜드", "말보로", 13, 23000, "SB PN CH RI");
  WS("오이스터 베이", "Oyster Bay", "Delegat", "뉴질랜드", "말보로", 13, 21000, "SB PN CH");
  WS("생 클레어", "Saint Clair Family Estate", "Saint Clair", "뉴질랜드", "말보로", 13, 25000, "SB PN");
  // 남아공·기타
  WS("니더버그 위너리", "Nederburg Winemaster's", "Nederburg", "남아프리카공화국", "웨스턴 케이프", 13.5, 15000, "CS SB CH");

  /* ── 와인: 개별 제품 ── */
  const R = (preset, list) => rows("wine", preset, list);
  const BDX = "Cabernet Sauvignon/Merlot";
  R("redIcon", [
    ["샤또 린치 바쥬", "Château Lynch-Bages", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Famille Cazes", 250000, BDX],
    ["샤또 퐁테 까네", "Château Pontet-Canet", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Famille Tesseron", 230000, BDX],
    ["샤또 피숑 바롱", "Château Pichon Baron", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 포이약", "AXA Millésimes", 300000, BDX],
    ["샤또 피숑 롱그빌 콩테스 드 랄랑드", "Château Pichon Longueville Comtesse de Lalande", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 포이약", "Roederer", 330000, BDX],
    ["샤또 코스 데스투르넬", "Château Cos d'Estournel", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생테스테프", "Michel Reybier", 350000, BDX],
    ["샤또 몽로즈", "Château Montrose", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생테스테프", "Bouygues", 330000, BDX],
    ["샤또 팔머", "Château Palmer", "레드 · 보르도 그랑 크뤼 3등급", 13.5, "프랑스", "보르도 마고", "Château Palmer", 550000, "Merlot/Cabernet Sauvignon/Petit Verdot"],
    ["샤또 레오빌 라스 카즈", "Château Léoville Las Cases", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생쥘리앙", "Domaines Delon", 450000, BDX],
    ["샤또 뒤크뤼 보카이유", "Château Ducru-Beaucaillou", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생쥘리앙", "Famille Borie", 380000, BDX],
    ["샤또 레오빌 바르통", "Château Léoville Barton", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생쥘리앙", "Famille Barton", 170000, BDX],
    ["샤또 그뤼오 라로즈", "Château Gruaud Larose", "레드 · 보르도 그랑 크뤼 2등급", 13.5, "프랑스", "보르도 생쥘리앙", "Château Gruaud Larose", 150000, BDX],
    ["샤또 라그랑주", "Château Lagrange (Saint-Julien)", "레드 · 보르도 그랑 크뤼 3등급", 13.5, "프랑스", "보르도 생쥘리앙", "Suntory", 110000, BDX],
    ["샤또 베이슈벨", "Château Beychevelle", "레드 · 보르도 그랑 크뤼 4등급", 13.5, "프랑스", "보르도 생쥘리앙", "Château Beychevelle", 190000, BDX],
    ["샤또 칼롱 세귀르", "Château Calon-Ségur", "레드 · 보르도 그랑 크뤼 3등급", 13.5, "프랑스", "보르도 생테스테프", "Château Calon-Ségur", 220000, BDX],
    ["샤또 지스쿠르", "Château Giscours", "레드 · 보르도 그랑 크뤼 3등급", 13.5, "프랑스", "보르도 마고", "Château Giscours", 120000, BDX],
    ["샤또 깡트메를르", "Château Cantemerle", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 오메독", "Château Cantemerle", 70000, BDX],
    ["샤또 그랑 퓌 라코스트", "Château Grand-Puy-Lacoste", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Famille Borie", 140000, BDX],
    ["샤또 바타이", "Château Batailley", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Borie-Manoux", 90000, BDX],
    ["샤또 다르마이악", "Château d'Armailhac", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Baron Philippe de Rothschild", 120000, BDX],
    ["샤또 클레르 밀롱", "Château Clerc Milon", "레드 · 보르도 그랑 크뤼 5등급", 13.5, "프랑스", "보르도 포이약", "Baron Philippe de Rothschild", 140000, BDX],
    ["샤또 뒤아르 밀롱", "Château Duhart-Milon", "레드 · 보르도 그랑 크뤼 4등급", 13.5, "프랑스", "보르도 포이약", "Domaines Barons de Rothschild (Lafite)", 150000, BDX],
    ["까뤼아드 드 라피트", "Carruades de Lafite", "레드 · 세컨드 와인", 13, "프랑스", "보르도 포이약", "Domaines Barons de Rothschild (Lafite)", 450000, BDX],
    ["르 쁘띠 무통", "Le Petit Mouton de Mouton Rothschild", "레드 · 세컨드 와인", 13.5, "프랑스", "보르도 포이약", "Château Mouton Rothschild", 400000, BDX],
    ["레 포르 드 라뚜르", "Les Forts de Latour", "레드 · 세컨드 와인", 13.5, "프랑스", "보르도 포이약", "Château Latour", 380000, BDX],
    ["파비용 루즈 뒤 샤또 마고", "Pavillon Rouge du Château Margaux", "레드 · 세컨드 와인", 13.5, "프랑스", "보르도 마고", "Château Margaux", 330000, BDX],
    ["르 클라랑스 드 오브리옹", "Le Clarence de Haut-Brion", "레드 · 세컨드 와인", 14, "프랑스", "보르도 페삭 레오냥", "Domaine Clarence Dillon", 250000, "Merlot/Cabernet Sauvignon/Cabernet Franc"],
    ["샤또 스미스 오 라피트", "Château Smith Haut Lafitte Rouge", "레드 · 그라브 크뤼 클라세", 14, "프랑스", "보르도 페삭 레오냥", "Cathiard", 200000, BDX],
    ["샤또 파프 클레망", "Château Pape Clément Rouge", "레드 · 그라브 크뤼 클라세", 14, "프랑스", "보르도 페삭 레오냥", "Bernard Magrez", 200000, BDX],
    ["샤또 앙젤뤼스", "Château Angélus", "레드 · 생테밀리옹", 14.5, "프랑스", "보르도 생테밀리옹", "Famille de Boüard", 650000, "Merlot/Cabernet Franc"],
    ["샤또 오존", "Château Ausone", "레드 · 생테밀리옹", 14, "프랑스", "보르도 생테밀리옹", "Famille Vauthier", 1500000, "Cabernet Franc/Merlot"],
    ["샤또 피작", "Château Figeac", "레드 · 생테밀리옹 1등급 A", 14, "프랑스", "보르도 생테밀리옹", "Famille Manoncourt", 450000, "Cabernet Sauvignon/Cabernet Franc/Merlot"],
    ["샤또 파비", "Château Pavie", "레드 · 생테밀리옹", 14.5, "프랑스", "보르도 생테밀리옹", "Gérard Perse", 550000, "Merlot/Cabernet Franc"],
    ["샤또 레방질", "Château L'Évangile", "레드 · 포므롤", 14, "프랑스", "보르도 포므롤", "Domaines Barons de Rothschild (Lafite)", 400000, "Merlot/Cabernet Franc"],
    ["르 팽", "Le Pin", "레드 · 포므롤", 14, "프랑스", "보르도 포므롤", "Famille Thienpont", 5000000, "Merlot"],
    ["오퍼스 원 오버추어", "Overture by Opus One", "레드 · 나파 블렌드", 14.5, "미국", "나파 밸리", "Opus One Winery", 250000, "Cabernet Sauvignon/Merlot/Cabernet Franc"],
    ["스크리밍 이글", "Screaming Eagle Cabernet Sauvignon", "레드 · 컬트 와인", 14.5, "미국", "나파 밸리 오크빌", "Screaming Eagle", 6000000, "Cabernet Sauvignon"],
    ["하를란 에스테이트", "Harlan Estate", "레드 · 컬트 와인", 14.5, "미국", "나파 밸리 오크빌", "Harlan Estate", 1500000, BDX],
    ["조셉 펠프스 인시그니아", "Joseph Phelps Insignia", "레드 · 나파 블렌드", 14.5, "미국", "나파 밸리", "Joseph Phelps", 450000, "Cabernet Sauvignon/Petit Verdot/Malbec"],
    ["스택스 립 아르테미스", "Stag's Leap Wine Cellars Artemis Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "미국", "나파 밸리", "Stag's Leap Wine Cellars", 110000, "Cabernet Sauvignon"],
    ["샤또 몬텔레나 샤르도네", "Chateau Montelena Chardonnay", "화이트 · 샤르도네", 13.5, "미국", "나파 밸리", "Chateau Montelena", 120000, "Chardonnay"],
    ["펜폴즈 빈 407", "Penfolds Bin 407 Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 140000, "Cabernet Sauvignon"],
    ["펜폴즈 빈 28", "Penfolds Bin 28 Kalimna Shiraz", "레드 · 쉬라즈", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 70000, "Shiraz"],
    ["펜폴즈 빈 128", "Penfolds Bin 128 Coonawarra Shiraz", "레드 · 쉬라즈", 14, "호주", "쿠나와라", "Penfolds", 70000, "Shiraz"],
    ["펜폴즈 세인트 앙리", "Penfolds St Henri Shiraz", "레드 · 쉬라즈", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 180000, "Shiraz"],
    ["토브렉 우드커터스 쉬라즈", "Torbreck Woodcutter's Shiraz", "레드 · 쉬라즈", 15, "호주", "바로사 밸리", "Torbreck", 50000, "Shiraz"],
    ["몰리두커 더 복서", "Mollydooker The Boxer Shiraz", "레드 · 쉬라즈", 16, "호주", "맥라렌 베일", "Mollydooker", 60000, "Shiraz"],
    ["헨쉬키 힐 오브 그레이스", "Henschke Hill of Grace", "레드 · 쉬라즈", 14.5, "호주", "에덴 밸리", "Henschke", 1200000, "Shiraz"],
    ["카논콥 피노타지", "Kanonkop Pinotage", "레드 · 피노타지", 14.5, "남아프리카공화국", "스텔렌보스", "Kanonkop", 60000, "Pinotage"],
    ["가야 프로미스", "Ca'Marcanda Promis (Gaja)", "레드 · 토스카나 블렌드", 14, "이탈리아", "토스카나 볼게리", "Gaja", 70000, "Merlot/Syrah/Sangiovese"],
    ["과도 알 타소", "Guado al Tasso (Antinori)", "레드 · 슈퍼 투스칸", 14.5, "이탈리아", "토스카나 볼게리", "Marchesi Antinori", 200000, "Cabernet Sauvignon/Merlot/Cabernet Franc"],
    ["솔라이아", "Solaia (Antinori)", "레드 · 슈퍼 투스칸", 14.5, "이탈리아", "토스카나", "Marchesi Antinori", 650000, "Cabernet Sauvignon/Sangiovese/Cabernet Franc"],
    ["레 세레 누오베 델 오르넬라이아", "Le Serre Nuove dell'Ornellaia", "레드 · 세컨드 와인", 14.5, "이탈리아", "토스카나 볼게리", "Tenuta dell'Ornellaia", 120000, "Merlot/Cabernet Sauvignon"],
    ["구이달베르토", "Guidalberto (Tenuta San Guido)", "레드 · 토스카나 블렌드", 14, "이탈리아", "토스카나 볼게리", "Tenuta San Guido", 80000, "Cabernet Sauvignon/Merlot"],
    ["레 디페제", "Le Difese (Tenuta San Guido)", "레드 · 토스카나 블렌드", 13.5, "이탈리아", "토스카나 볼게리", "Tenuta San Guido", 50000, "Cabernet Sauvignon/Sangiovese"],
    ["폰타나프레다 바롤로", "Fontanafredda Barolo", "레드 · 바롤로 DOCG", 14, "이탈리아", "피에몬테 바롤로", "Fontanafredda", 65000, "Nebbiolo"],
    ["피오 체사레 바롤로", "Pio Cesare Barolo", "레드 · 바롤로 DOCG", 14.5, "이탈리아", "피에몬테 바롤로", "Pio Cesare", 120000, "Nebbiolo"],
    ["마르케시 디 바롤로 바롤로", "Marchesi di Barolo Barolo", "레드 · 바롤로 DOCG", 14, "이탈리아", "피에몬테 바롤로", "Marchesi di Barolo", 70000, "Nebbiolo"],
    ["프루노토 바롤로", "Prunotto Barolo", "레드 · 바롤로 DOCG", 14, "이탈리아", "피에몬테 바롤로", "Prunotto (Antinori)", 75000, "Nebbiolo"],
    ["베가 시실리아 발부에나 5°", "Vega Sicilia Valbuena 5°", "레드 · 리베라 델 두에로", 14, "스페인", "리베라 델 두에로", "Bodegas Vega Sicilia", 250000, "Tempranillo/Merlot"],
    ["핑구스", "Dominio de Pingus", "레드 · 리베라 델 두에로", 14.5, "스페인", "리베라 델 두에로", "Dominio de Pingus", 1300000, "Tempranillo"],
    ["알리온", "Alión", "레드 · 리베라 델 두에로", 14.5, "스페인", "리베라 델 두에로", "Bodegas Vega Sicilia", 120000, "Tempranillo"],
  ]);
  R("redFull", [
    ["무통 카데 루즈", "Mouton Cadet Rouge", "레드 · 보르도", 13.5, "프랑스", "보르도", "Baron Philippe de Rothschild", 20000, "Merlot/Cabernet Sauvignon/Cabernet Franc"],
    ["샤또 클라르크", "Château Clarke", "레드 · 보르도", 13.5, "프랑스", "보르도 리스트락 메독", "Edmond de Rothschild", 55000, "Merlot/Cabernet Sauvignon"],
    ["샤또 글로리아", "Château Gloria", "레드 · 보르도", 13.5, "프랑스", "보르도 생쥘리앙", "Domaines Henri Martin", 70000, BDX],
    ["샤또 라네상", "Château Lanessan", "레드 · 보르도", 13.5, "프랑스", "보르도 오메독", "Famille Bouteiller", 45000, BDX],
    ["샤또 라로즈 트랭도동", "Château Larose-Trintaudon", "레드 · 보르도", 13, "프랑스", "보르도 오메독", "Allianz", 40000, BDX],
    ["샤또 그레삭", "Château Greysac", "레드 · 보르도", 13, "프랑스", "보르도 메독", "Château Greysac", 35000, "Merlot/Cabernet Sauvignon"],
    ["샤또 시탕", "Château Citran", "레드 · 보르도", 13.5, "프랑스", "보르도 오메독", "Château Citran", 40000, BDX],
    ["샤또 소시앙도 말레", "Château Sociando-Mallet", "레드 · 보르도", 13.5, "프랑스", "보르도 오메독", "Famille Gautreau", 80000, BDX],
    ["샤또 샤스 스플린", "Château Chasse-Spleen", "레드 · 보르도", 13.5, "프랑스", "보르도 물리", "Famille Villars", 75000, BDX],
    ["샤또 포탕삭", "Château Potensac", "레드 · 보르도", 13.5, "프랑스", "보르도 메독", "Domaines Delon", 50000, BDX],
    ["바롱 필립 드 로칠드 마스 데 롱", "Baron Philippe de Rothschild Mas Andes", "레드 · 블렌드", 13.5, "칠레", "센트럴 밸리", "Baron Philippe de Rothschild", 20000, "Cabernet Sauvignon/Carmenère"],
    ["샤또 몬텔레나 까베르네 소비뇽", "Chateau Montelena Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "미국", "나파 밸리", "Chateau Montelena", 130000, "Cabernet Sauvignon"],
    ["조단 까베르네 소비뇽", "Jordan Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.8, "미국", "소노마 알렉산더 밸리", "Jordan Vineyard & Winery", 95000, "Cabernet Sauvignon"],
    ["어포틱 레드", "Apothic Red", "레드 · 블렌드", 13.5, "미국", "캘리포니아", "E. & J. Gallo", 18000, "Zinfandel/Merlot/Syrah/Cabernet Sauvignon"],
    ["더 프리즈너", "The Prisoner Red Blend", "레드 · 블렌드", 15, "미국", "나파 밸리", "The Prisoner Wine Co.", 75000, "Zinfandel/Cabernet Sauvignon/Petite Sirah"],
    ["1000 스토리즈 진판델", "1000 Stories Bourbon Barrel Aged Zinfandel", "레드 · 진판델", 15, "미국", "캘리포니아", "Fetzer", 30000, "Zinfandel"],
    ["알마비바 엡", "EPU (Almaviva)", "레드 · 세컨드 와인", 14.5, "칠레", "마이포 밸리 푸엔테 알토", "Viña Almaviva", 60000, "Cabernet Sauvignon/Carmenère"],
    ["몬테스 폴리 시라", "Montes Folly Syrah", "레드 · 시라", 15, "칠레", "콜차구아 아팔타", "Viña Montes", 95000, "Syrah"],
    ["세냐", "Seña", "레드 · 블렌드", 14, "칠레", "아콩카구아", "Viña Seña (Errázuriz)", 160000, "Cabernet Sauvignon/Carmenère/Malbec"],
    ["돈 막시미아노", "Don Maximiano Founder's Reserve", "레드 · 블렌드", 14, "칠레", "아콩카구아", "Viña Errázuriz", 110000, "Cabernet Sauvignon/Carmenère"],
    ["카테나 알타 말벡", "Catena Alta Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Bodega Catena Zapata", 70000, "Malbec"],
    ["니콜라스 카테나 자파타", "Nicolás Catena Zapata", "레드 · 블렌드", 14, "아르헨티나", "멘도사", "Bodega Catena Zapata", 140000, "Cabernet Sauvignon/Malbec"],
    ["슈발 데 앙데스", "Cheval des Andes", "레드 · 블렌드", 14.5, "아르헨티나", "멘도사", "Terrazas de los Andes × Cheval Blanc", 130000, "Malbec/Cabernet Sauvignon"],
    ["테라자스 레세르바 말벡", "Terrazas de los Andes Reserva Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Terrazas de los Andes", 30000, "Malbec"],
    ["펜폴즈 빈 8", "Penfolds Bin 8 Cabernet Shiraz", "레드 · 블렌드", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 40000, "Cabernet Sauvignon/Shiraz"],
    ["울프 블라스 그레이 라벨", "Wolf Blass Grey Label Shiraz", "레드 · 쉬라즈", 14.5, "호주", "랭혼 크릭", "Wolf Blass", 70000, "Shiraz"],
    ["울프 블라스 블랙 라벨", "Wolf Blass Black Label", "레드 · 블렌드", 14.5, "호주", "사우스 오스트레일리아", "Wolf Blass", 180000, "Cabernet Sauvignon/Shiraz"],
    ["엘더튼 커맨드 쉬라즈", "Elderton Command Shiraz", "레드 · 쉬라즈", 14.5, "호주", "바로사 밸리", "Elderton", 130000, "Shiraz"],
    ["투 핸즈 엔젤스 쉐어", "Two Hands Angels' Share Shiraz", "레드 · 쉬라즈", 14.5, "호주", "맥라렌 베일", "Two Hands", 45000, "Shiraz"],
    ["마주앙 레드", "Majuang Red", "레드 · 블렌드", 12.5, "대한민국", "—", "롯데칠성음료", 10000, "Cabernet Sauvignon/Merlot"],
  ]);
  R("italian", [
    ["빌라 안티노리 로쏘", "Villa Antinori Rosso", "레드 · 토스카나 IGT", 13.5, "이탈리아", "토스카나", "Marchesi Antinori", 30000, "Sangiovese/Cabernet Sauvignon/Merlot"],
    ["페폴리 키안티 클라시코", "Antinori Peppoli Chianti Classico", "레드 · 키안티 클라시코", 13.5, "이탈리아", "토스카나 키안티", "Marchesi Antinori", 30000, "Sangiovese"],
    ["마르케세 안티노리 키안티 클라시코 리제르바", "Marchese Antinori Chianti Classico Riserva", "레드 · 키안티 클라시코 리제르바", 14, "이탈리아", "토스카나 키안티", "Marchesi Antinori", 55000, "Sangiovese/Cabernet Sauvignon"],
    ["루피노 키안티", "Ruffino Chianti", "레드 · 키안티 DOCG", 12.5, "이탈리아", "토스카나", "Ruffino", 15000, "Sangiovese"],
    ["루피노 리제르바 두칼레 오로", "Ruffino Riserva Ducale Oro", "레드 · 키안티 클라시코 그란 셀레치오네", 14, "이탈리아", "토스카나 키안티", "Ruffino", 60000, "Sangiovese/Merlot"],
    ["프레스코발디 니포차노 리제르바", "Frescobaldi Nipozzano Riserva", "레드 · 키안티 루피나", 13.5, "이탈리아", "토스카나", "Frescobaldi", 35000, "Sangiovese"],
    ["카스텔로 디 아마 키안티 클라시코", "Castello di Ama Chianti Classico", "레드 · 키안티 클라시코", 13.5, "이탈리아", "토스카나 키안티", "Castello di Ama", 60000, "Sangiovese/Merlot"],
    ["반피 로쏘 디 몬탈치노", "Banfi Rosso di Montalcino", "레드 · 로쏘 디 몬탈치노", 13.5, "이탈리아", "토스카나 몬탈치노", "Castello Banfi", 35000, "Sangiovese"],
    ["카사노바 디 네리 브루넬로", "Casanova di Neri Brunello di Montalcino", "레드 · 브루넬로", 14.5, "이탈리아", "토스카나 몬탈치노", "Casanova di Neri", 120000, "Sangiovese"],
    ["비온디 산티 브루넬로", "Biondi-Santi Brunello di Montalcino", "레드 · 브루넬로", 13.5, "이탈리아", "토스카나 몬탈치노", "Biondi-Santi", 250000, "Sangiovese"],
    ["제나토 아마로네", "Zenato Amarone della Valpolicella Classico", "레드 · 아마로네", 16.5, "이탈리아", "베네토 발폴리첼라", "Zenato", 80000, "Corvina/Rondinella"],
    ["제나토 리파싸", "Zenato Ripassa", "레드 · 리파소", 14, "이탈리아", "베네토 발폴리첼라", "Zenato", 35000, "Corvina/Rondinella"],
    ["토마시 아마로네", "Tommasi Amarone della Valpolicella Classico", "레드 · 아마로네", 15, "이탈리아", "베네토 발폴리첼라", "Tommasi", 70000, "Corvina/Rondinella"],
    ["알레그리니 팔라초 델라 토레", "Allegrini Palazzo della Torre", "레드 · 베로네제 IGT", 13.5, "이탈리아", "베네토", "Allegrini", 35000, "Corvina/Rondinella/Sangiovese"],
    ["마시 캄포피오린", "Masi Campofiorin", "레드 · 리파소 스타일", 13, "이탈리아", "베네토", "Masi Agricola", 28000, "Corvina/Rondinella"],
    ["판티니 몬테풀치아노 다브루초", "Farnese Fantini Montepulciano d'Abruzzo", "레드 · 몬테풀치아노", 13, "이탈리아", "아브루초", "Farnese Vini", 13000, "Montepulciano"],
    ["판티니 산지오베제", "Farnese Fantini Sangiovese", "레드 · 산지오베제", 13, "이탈리아", "아브루초", "Farnese Vini", 13000, "Sangiovese"],
    ["돈나푸가타 세다라", "Donnafugata Sedàra", "레드 · 시칠리아", 13.5, "이탈리아", "시칠리아", "Donnafugata", 28000, "Nero d'Avola"],
    ["플라네타 라 세그레타 로쏘", "Planeta La Segreta Rosso", "레드 · 시칠리아", 13.5, "이탈리아", "시칠리아", "Planeta", 25000, "Nero d'Avola/Merlot/Syrah"],
    ["산 마르차노 세산티안니", "San Marzano Sessantanni Primitivo di Manduria", "레드 · 프리미티보", 14.5, "이탈리아", "풀리아", "San Marzano", 40000, "Primitivo"],
    ["미켈레 끼아를로 레 오르메 바르베라 다스티", "Michele Chiarlo Le Orme Barbera d'Asti", "레드 · 바르베라", 13.5, "이탈리아", "피에몬테 아스티", "Michele Chiarlo", 30000, "Barbera"],
    ["카스텔로 반피 산탄티모 엑셀서스", "Castello Banfi Excelsus", "레드 · 토스카나 블렌드", 14, "이탈리아", "토스카나 몬탈치노", "Castello Banfi", 110000, "Cabernet Sauvignon/Merlot"],
  ]);
  R("spanish", [
    ["토레스 그란 코로나스", "Torres Gran Coronas Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "스페인", "페네데스", "Familia Torres", 30000, "Cabernet Sauvignon/Tempranillo"],
    ["토레스 셀레스테", "Torres Celeste Crianza", "레드 · 리베라 델 두에로", 14, "스페인", "리베라 델 두에로", "Familia Torres", 30000, "Tempranillo"],
    ["쿠네 크리안자", "CVNE Cune Crianza", "레드 · 리오하 크리안자", 13.5, "스페인", "리오하", "CVNE", 22000, "Tempranillo"],
    ["쿠네 임페리얼 레세르바", "CVNE Imperial Reserva", "레드 · 리오하 레세르바", 14, "스페인", "리오하", "CVNE", 75000, "Tempranillo/Graciano"],
    ["라 리오하 알타 비냐 아르단자", "La Rioja Alta Viña Ardanza Reserva", "레드 · 리오하 레세르바", 14, "스페인", "리오하", "La Rioja Alta", 65000, "Tempranillo/Garnacha"],
    ["무가 레세르바", "Bodegas Muga Reserva", "레드 · 리오하 레세르바", 14, "스페인", "리오하", "Bodegas Muga", 45000, "Tempranillo/Garnacha/Mazuelo/Graciano"],
    ["캄포 비에호 레세르바", "Campo Viejo Reserva", "레드 · 리오하 레세르바", 13.5, "스페인", "리오하", "Campo Viejo", 20000, "Tempranillo/Garnacha/Mazuelo"],
    ["파우스티노 I 그란 레세르바", "Faustino I Gran Reserva", "레드 · 리오하 그란 레세르바", 13.5, "스페인", "리오하", "Bodegas Faustino", 45000, "Tempranillo/Graciano/Mazuelo"],
    ["마르케스 데 리스칼 그란 레세르바", "Marqués de Riscal Gran Reserva", "레드 · 리오하 그란 레세르바", 14, "스페인", "리오하", "Herederos del Marqués de Riscal", 55000, "Tempranillo/Graciano"],
    ["페스케라 크리안자", "Tinto Pesquera Crianza", "레드 · 리베라 델 두에로", 14, "스페인", "리베라 델 두에로", "Familia Fernández Rivera", 50000, "Tempranillo"],
    ["에밀리오 모로", "Emilio Moro", "레드 · 리베라 델 두에로", 14.5, "스페인", "리베라 델 두에로", "Bodegas Emilio Moro", 45000, "Tempranillo"],
    ["보르사오 트레스 피코스", "Borsao Tres Picos Garnacha", "레드 · 가르나차", 15, "스페인", "캄포 데 보르하", "Bodegas Borsao", 30000, "Garnacha"],
    ["후안 힐 모나스트렐", "Juan Gil Monastrell (Silver Label)", "레드 · 모나스트렐", 15, "스페인", "후미야", "Bodegas Juan Gil", 28000, "Monastrell"],
    ["알바로 팔라시오스 카민스 델 프리오랏", "Alvaro Palacios Camins del Priorat", "레드 · 프리오랏", 14.5, "스페인", "프리오랏", "Alvaro Palacios", 45000, "Garnacha/Cariñena"],
  ]);
  R("pinot", [
    ["루이 자도 쥐브레 샹베르탱", "Louis Jadot Gevrey-Chambertin", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 코트 드 뉘", "Maison Louis Jadot", 110000, "Pinot Noir"],
    ["조셉 드루앵 부르고뉴 피노 누아", "Joseph Drouhin Bourgogne Pinot Noir (Laforêt)", "레드 · 부르고뉴", 12.5, "프랑스", "부르고뉴", "Maison Joseph Drouhin", 30000, "Pinot Noir"],
    ["부샤 페르 에 피스 부르고뉴 피노 누아", "Bouchard Père & Fils Bourgogne Pinot Noir", "레드 · 부르고뉴", 12.5, "프랑스", "부르고뉴", "Bouchard Père & Fils", 30000, "Pinot Noir"],
    ["알베르 비쇼 부르고뉴 비에유 비뉴", "Albert Bichot Bourgogne Vieilles Vignes Pinot Noir", "레드 · 부르고뉴", 12.5, "프랑스", "부르고뉴", "Albert Bichot", 30000, "Pinot Noir"],
    ["페블리 메르퀴레", "Domaine Faiveley Mercurey", "레드 · 코트 샬로네즈", 13, "프랑스", "부르고뉴 메르퀴레", "Domaine Faiveley", 55000, "Pinot Noir"],
    ["도멘 드 라 로마네 콩티 에셰조", "Domaine de la Romanée-Conti Échezeaux", "레드 · 부르고뉴 그랑 크뤼", 13.5, "프랑스", "부르고뉴 본 로마네", "Domaine de la Romanée-Conti", 6000000, "Pinot Noir"],
    ["도멘 아르망 루소 쥐브레 샹베르탱", "Domaine Armand Rousseau Gevrey-Chambertin", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 쥐브레 샹베르탱", "Domaine Armand Rousseau", 450000, "Pinot Noir"],
    ["도멘 드 라 부즈레 부르고뉴", "Domaine de Villaine Bourgogne Côte Chalonnaise La Digoine", "레드 · 부르고뉴", 13, "프랑스", "부르고뉴 코트 샬로네즈", "Domaine de Villaine", 70000, "Pinot Noir"],
    ["메종 루이 라뚜르 부르고뉴 피노 누아", "Louis Latour Bourgogne Pinot Noir", "레드 · 부르고뉴", 13, "프랑스", "부르고뉴", "Maison Louis Latour", 30000, "Pinot Noir"],
    ["벨 글로스 클라크 앤 텔레폰", "Belle Glos Clark & Telephone Pinot Noir", "레드 · 피노 누아", 14.5, "미국", "산타 마리아 밸리", "Belle Glos (Wagner Family)", 75000, "Pinot Noir"],
    ["펠튼 로드 바녹번 피노 누아", "Felton Road Bannockburn Pinot Noir", "레드 · 피노 누아", 14, "뉴질랜드", "센트럴 오타고", "Felton Road", 90000, "Pinot Noir"],
    ["조르주 뒤뵈프 보졸레 빌라주", "Georges Duboeuf Beaujolais-Villages", "레드 · 보졸레", 12.5, "프랑스", "보졸레", "Georges Duboeuf", 20000, "Gamay"],
    ["조르주 뒤뵈프 보졸레 누보", "Georges Duboeuf Beaujolais Nouveau", "레드 · 보졸레 누보", 12.5, "프랑스", "보졸레", "Georges Duboeuf", 20000, "Gamay"],
    ["루이 자도 보졸레 빌라주", "Louis Jadot Beaujolais-Villages", "레드 · 보졸레", 12.5, "프랑스", "보졸레", "Maison Louis Jadot", 22000, "Gamay"],
    ["루이 자도 물랭 아 방", "Louis Jadot Moulin-à-Vent Château des Jacques", "레드 · 보졸레 크뤼", 13.5, "프랑스", "보졸레 물랭 아 방", "Maison Louis Jadot", 50000, "Gamay"],
  ]);
  R("redMed", [
    ["이 기갈 크로즈 에르미타주", "E. Guigal Crozes-Hermitage Rouge", "레드 · 북부 론", 13.5, "프랑스", "론 크로즈 에르미타주", "E. Guigal", 45000, "Syrah"],
    ["이 기갈 샤또네프 뒤 파프", "E. Guigal Châteauneuf-du-Pape", "레드 · 남부 론", 14.5, "프랑스", "론 샤또네프 뒤 파프", "E. Guigal", 75000, "Grenache/Syrah/Mourvèdre"],
    ["샤푸티에 벨뤼슈 루즈", "M. Chapoutier Belleruche Côtes du Rhône Rouge", "레드 · 꼬뜨 뒤 론", 14, "프랑스", "론", "M. Chapoutier", 22000, "Grenache/Syrah"],
    ["폴 자불레 에네 파라렐 45", "Paul Jaboulet Aîné Parallèle 45 Rouge", "레드 · 꼬뜨 뒤 론", 14, "프랑스", "론", "Paul Jaboulet Aîné", 22000, "Grenache/Syrah"],
    ["샤또 드 보카스텔 샤또네프 뒤 파프", "Château de Beaucastel Châteauneuf-du-Pape Rouge", "레드 · 남부 론", 14.5, "프랑스", "론 샤또네프 뒤 파프", "Famille Perrin", 150000, "Grenache/Mourvèdre/Syrah"],
    ["페랭 꼬뜨 뒤 론 레제르브", "Perrin Côtes du Rhône Réserve Rouge", "레드 · 꼬뜨 뒤 론", 14, "프랑스", "론", "Famille Perrin", 22000, "Grenache/Syrah"],
    ["제라르 베르트랑 꼬뜨 데 로즈 루즈", "Gérard Bertrand Côte des Roses Rouge", "레드 · 랑그독", 13.5, "프랑스", "랑그독", "Gérard Bertrand", 25000, "Grenache/Syrah/Carignan"],
    ["마주앙 모젤", "Majuang Mosel", "화이트 · 리슬링", 10, "독일", "모젤", "롯데칠성음료", 12000, "Riesling"],
  ]);
  R("whiteCrisp", [
    ["루이 자도 부르고뉴 샤르도네", "Louis Jadot Bourgogne Chardonnay", "화이트 · 부르고뉴", 12.5, "프랑스", "부르고뉴", "Maison Louis Jadot", 30000, "Chardonnay"],
    ["루이 자도 마꽁 빌라주", "Louis Jadot Mâcon-Villages", "화이트 · 마꼬네", 12.5, "프랑스", "부르고뉴 마꼬네", "Maison Louis Jadot", 25000, "Chardonnay"],
    ["루이 자도 푸이 퓌세", "Louis Jadot Pouilly-Fuissé", "화이트 · 마꼬네", 13, "프랑스", "부르고뉴 마꼬네", "Maison Louis Jadot", 50000, "Chardonnay"],
    ["루이 자도 샤블리", "Louis Jadot Chablis", "화이트 · 샤블리", 12.5, "프랑스", "부르고뉴 샤블리", "Maison Louis Jadot", 40000, "Chardonnay"],
    ["조셉 드루앵 샤블리", "Joseph Drouhin Chablis (Domaine de Vaudon)", "화이트 · 샤블리", 12.5, "프랑스", "부르고뉴 샤블리", "Maison Joseph Drouhin", 45000, "Chardonnay"],
    ["윌리엄 페브르 샤블리 프르미에 크뤼 몽테 드 토네르", "William Fèvre Chablis 1er Cru Montée de Tonnerre", "화이트 · 샤블리 1er Cru", 13, "프랑스", "부르고뉴 샤블리", "Domaine William Fèvre", 85000, "Chardonnay"],
    ["도멘 르플레브 퓔리니 몽라셰", "Domaine Leflaive Puligny-Montrachet", "화이트 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 퓔리니 몽라셰", "Domaine Leflaive", 300000, "Chardonnay"],
    ["무통 카데 블랑", "Mouton Cadet Blanc", "화이트 · 보르도", 12, "프랑스", "보르도", "Baron Philippe de Rothschild", 20000, "Sauvignon Blanc/Sémillon"],
    ["샤또 스미스 오 라피트 블랑", "Château Smith Haut Lafitte Blanc", "화이트 · 그라브", 13.5, "프랑스", "보르도 페삭 레오냥", "Cathiard", 200000, "Sauvignon Blanc/Sémillon"],
    ["파스칼 졸리베 상세르", "Pascal Jolivet Sancerre", "화이트 · 루아르", 13, "프랑스", "루아르 상세르", "Pascal Jolivet", 45000, "Sauvignon Blanc"],
    ["앙리 부르주아 상세르", "Henri Bourgeois Sancerre Les Baronnes", "화이트 · 루아르", 13, "프랑스", "루아르 상세르", "Henri Bourgeois", 45000, "Sauvignon Blanc"],
    ["라도세트 푸이 퓌메", "de Ladoucette Pouilly-Fumé", "화이트 · 루아르", 12.5, "프랑스", "루아르 푸이 퓌메", "de Ladoucette", 65000, "Sauvignon Blanc"],
    ["트림바크 리슬링", "Trimbach Riesling", "화이트 · 알자스", 12.5, "프랑스", "알자스", "Maison Trimbach", 40000, "Riesling"],
    ["휘겔 게뷔르츠트라미너", "Hugel Gewurztraminer", "화이트 · 알자스", 13.5, "프랑스", "알자스", "Hugel", 40000, "Gewürztraminer"],
    ["이 기갈 꼬뜨 뒤 론 블랑", "E. Guigal Côtes du Rhône Blanc", "화이트 · 꼬뜨 뒤 론", 13.5, "프랑스", "론", "E. Guigal", 25000, "Viognier/Roussanne/Marsanne"],
    ["산타 마르게리타 피노 그리지오", "Santa Margherita Pinot Grigio", "화이트 · 피노 그리지오", 12.5, "이탈리아", "알토 아디제", "Santa Margherita", 30000, "Pinot Grigio"],
    ["카비트 피노 그리지오", "Cavit Pinot Grigio", "화이트 · 피노 그리지오", 12, "이탈리아", "트렌티노", "Cavit", 15000, "Pinot Grigio"],
    ["피에로판 소아베 클라시코", "Pieropan Soave Classico", "화이트 · 소아베", 12, "이탈리아", "베네토", "Pieropan", 30000, "Garganega"],
    ["토레스 비냐 솔", "Torres Viña Sol", "화이트 · 스페인", 11.5, "스페인", "카탈루냐", "Familia Torres", 15000, "Parellada/Garnacha Blanca"],
    ["토레스 비냐 에스메랄다", "Torres Viña Esmeralda", "화이트 · 세미 스위트", 11.5, "스페인", "카탈루냐", "Familia Torres", 18000, "Moscatel/Gewürztraminer"],
    ["마르틴 코닥스 알바리뇨", "Martín Códax Albariño", "화이트 · 리아스 바이샤스", 12.5, "스페인", "리아스 바이샤스", "Martín Códax", 28000, "Albariño"],
    ["까살 가르시아 비뉴 베르드", "Casal Garcia Vinho Verde", "화이트 · 비뉴 베르드", 9.5, "포르투갈", "비뉴 베르드", "Aveleda", 13000, "Loureiro/Trajadura/Arinto"],
    ["마테우스 로제", "Mateus Rosé", "로제 · 약발포", 11, "포르투갈", "—", "Sogrape", 13000, "Baga/Rufete/Touriga Franca"],
    ["샤토 생 미셸 에로이카 리슬링", "Eroica Riesling", "화이트 · 리슬링", 12, "미국", "워싱턴 컬럼비아 밸리", "Chateau Ste. Michelle × Dr. Loosen", 30000, "Riesling"],
    ["케이크브레드 샤르도네", "Cakebread Cellars Chardonnay", "화이트 · 샤르도네", 14.1, "미국", "나파 밸리", "Cakebread Cellars", 85000, "Chardonnay"],
    ["롬바우어 샤르도네", "Rombauer Chardonnay", "화이트 · 샤르도네", 14.5, "미국", "카네로스", "Rombauer Vineyards", 75000, "Chardonnay"],
    ["카테나 알타 샤르도네", "Catena Alta Chardonnay", "화이트 · 샤르도네", 13.5, "아르헨티나", "멘도사", "Bodega Catena Zapata", 60000, "Chardonnay"],
    ["린드만 빈 65 샤르도네", "Lindeman's Bin 65 Chardonnay", "화이트 · 샤르도네", 13, "호주", "사우스 이스턴 오스트레일리아", "Treasury Wine Estates", 12000, "Chardonnay"],
    ["닥터 루젠 블루 슬레이트 리슬링 카비넷", "Dr. Loosen Blue Slate Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, "독일", "모젤", "Weingut Dr. Loosen", 35000, "Riesling"],
    ["요하네스베르크 리슬링", "Schloss Johannisberg Gelblack Riesling", "화이트 · 리슬링", 11.5, "독일", "라인가우", "Schloss Johannisberg", 50000, "Riesling"],
    ["블루 넌", "Blue Nun", "화이트 · 독일", 10, "독일", "라인헤센", "Langguth Erben", 10000, "Müller-Thurgau/Riesling"],
    ["마주앙 화이트", "Majuang White", "화이트 · 블렌드", 12, "대한민국", "—", "롯데칠성음료", 10000, ""],
  ]);
  R("sweet", [
    ["간치아 모스카토 다스티", "Gancia Moscato d'Asti", "스위트 · 모스카토 다스티", 5.5, "이탈리아", "피에몬테 아스티", "Gancia", 15000, "Moscato Bianco"],
    ["마르티니 아스티", "Martini Asti Spumante", "스위트 · 아스티 스푸만테", 7.5, "이탈리아", "피에몬테 아스티", "Martini & Rossi", 15000, "Moscato Bianco"],
    ["사라코 모스카토 다스티", "Saracco Moscato d'Asti", "스위트 · 모스카토 다스티", 5.5, "이탈리아", "피에몬테 아스티", "Paolo Saracco", 28000, "Moscato Bianco"],
    ["미켈레 끼아를로 니볼레 모스카토 다스티", "Michele Chiarlo Nivole Moscato d'Asti", "스위트 · 모스카토 다스티", 5, "이탈리아", "피에몬테 아스티", "Michele Chiarlo", 22000, "Moscato Bianco"],
    ["빌라 엠 로쏘", "Villa M Rosso", "스위트 · 약발포 레드", 5.5, "이탈리아", "피에몬테", "Gianni Gagliardo", 18000, "Brachetto"],
    ["반피 로사 레갈레 브라케토 다퀴", "Banfi Rosa Regale Brachetto d'Acqui", "스위트 · 스파클링 레드", 7, "이탈리아", "피에몬테 아퀴", "Castello Banfi", 32000, "Brachetto"],
    ["스텔라 로사 블랙", "Stella Rosa Black", "스위트 · 세미 스파클링 레드", 5, "이탈리아", "피에몬테", "Stella Rosa (Riboli)", 22000, "Brachetto"],
    ["토카이 아수 5 푸토뇨스", "Royal Tokaji 5 Puttonyos Aszú", "스위트 · 토카이 귀부", 11, "헝가리", "토카이", "Royal Tokaji", 70000, "Furmint/Hárslevelű"],
    ["이니스킬린 비달 아이스와인", "Inniskillin Vidal Icewine", "스위트 · 아이스와인", 9.5, "캐나다", "나이아가라 페닌슐라", "Inniskillin", 90000, "Vidal"],
    ["테일러 10년 토니 포트", "Taylor's 10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, "포르투갈", "도우루", "Taylor's", 50000, "Touriga Nacional/Touriga Franca"],
    ["그라함 식스 그레이프스", "Graham's Six Grapes Reserve Port", "주정강화 · 루비 포트", 19.5, "포르투갈", "도우루", "Graham's", 40000, "Touriga Nacional/Touriga Franca"],
    ["샌드맨 루비 포트", "Sandeman Ruby Porto", "주정강화 · 루비 포트", 19.5, "포르투갈", "도우루", "Sandeman", 28000, "Touriga Nacional/Tinta Roriz"],
    ["곤살레스 비아스 티오 페페", "González Byass Tío Pepe Fino", "주정강화 · 피노 셰리", 15, "스페인", "헤레스", "González Byass", 25000, "Palomino"],
  ]);
  R("bubbly", [
    ["모엣 샹동 로제 임페리얼", "Moët & Chandon Rosé Impérial", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "Moët & Chandon", 95000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["모엣 샹동 넥타 임페리얼", "Moët & Chandon Nectar Impérial", "스파클링 · 드미 섹", 12, "프랑스", "샹파뉴", "Moët & Chandon", 85000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["뵈브 클리코 로제", "Veuve Clicquot Rosé", "스파클링 · 로제 샴페인", 12.5, "프랑스", "샹파뉴", "Veuve Clicquot", 110000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["뵈브 클리코 라 그랑 담", "Veuve Clicquot La Grande Dame", "스파클링 · 프레스티지 퀴베", 12.5, "프랑스", "샹파뉴", "Veuve Clicquot", 330000, "Pinot Noir/Chardonnay"],
    ["떼땅져 브뤼 레제르브", "Taittinger Brut Réserve", "스파클링 · 샴페인", 12.5, "프랑스", "샹파뉴", "Taittinger", 75000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["떼땅져 콩트 드 샹파뉴", "Taittinger Comtes de Champagne Blanc de Blancs", "스파클링 · 프레스티지 퀴베", 12.5, "프랑스", "샹파뉴", "Taittinger", 350000, "Chardonnay"],
    ["볼랭저 스페셜 퀴베", "Bollinger Special Cuvée", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴 아이", "Bollinger", 95000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["로랑 페리에 라 퀴베", "Laurent-Perrier La Cuvée", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Laurent-Perrier", 75000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["로랑 페리에 퀴베 로제", "Laurent-Perrier Cuvée Rosé", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "Laurent-Perrier", 130000, "Pinot Noir"],
    ["폴 로저 브뤼 레제르브", "Pol Roger Brut Réserve", "스파클링 · 샴페인", 12.5, "프랑스", "샹파뉴 에페르네", "Pol Roger", 85000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["파이퍼 하이직 퀴베 브뤼", "Piper-Heidsieck Cuvée Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Piper-Heidsieck", 60000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["샤를 하이직 브뤼 레제르브", "Charles Heidsieck Brut Réserve", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Charles Heidsieck", 90000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["니콜라 푀이야트 브뤼 레제르브", "Nicolas Feuillatte Réserve Exclusive Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Nicolas Feuillatte", 55000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["멈 코르동 루즈", "G.H. Mumm Cordon Rouge Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "G.H. Mumm", 65000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["뤼나르 블랑 드 블랑", "Ruinart Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12.5, "프랑스", "샹파뉴", "Ruinart", 150000, "Chardonnay"],
    ["뤼나르 R 브뤼", "R de Ruinart Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Ruinart", 95000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["루이 로드레 컬렉션", "Louis Roederer Collection", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Louis Roederer", 90000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["크리스탈", "Louis Roederer Cristal", "스파클링 · 프레스티지 퀴베", 12, "프랑스", "샹파뉴", "Louis Roederer", 550000, "Pinot Noir/Chardonnay"],
    ["빌카르 살몽 브뤼 레제르브", "Billecart-Salmon Brut Réserve", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Billecart-Salmon", 90000, "Pinot Meunier/Chardonnay/Pinot Noir"],
    ["빌카르 살몽 브뤼 로제", "Billecart-Salmon Brut Rosé", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "Billecart-Salmon", 150000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["페리에 주에 그랑 브뤼", "Perrier-Jouët Grand Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Perrier-Jouët", 70000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["돔 뤼나르 블랑 드 블랑", "Dom Ruinart Blanc de Blancs", "스파클링 · 프레스티지 퀴베", 12.5, "프랑스", "샹파뉴", "Ruinart", 450000, "Chardonnay"],
    ["살롱 블랑 드 블랑", "Salon Le Mesnil Blanc de Blancs", "스파클링 · 프레스티지 퀴베", 12, "프랑스", "샹파뉴 르 메닐", "Salon", 1800000, "Chardonnay"],
    ["아르망 드 브리냑 브뤼 골드", "Armand de Brignac Brut Gold", "스파클링 · 샴페인", 12.5, "프랑스", "샹파뉴", "Armand de Brignac", 450000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["샹동 브뤼", "Chandon Brut", "스파클링 · 스파클링 와인", 12, "미국", "캘리포니아", "Chandon", 35000, "Chardonnay/Pinot Noir"],
    ["미오네토 프로세코", "Mionetto Prosecco Brut", "스파클링 · 프로세코", 11, "이탈리아", "베네토", "Mionetto", 18000, "Glera"],
    ["라 마르카 프로세코", "La Marca Prosecco", "스파클링 · 프로세코", 11, "이탈리아", "베네토", "La Marca", 20000, "Glera"],
    ["산타 마르게리타 프로세코 수페리오레", "Santa Margherita Prosecco Superiore", "스파클링 · 프로세코 DOCG", 11.5, "이탈리아", "베네토 발도비아데네", "Santa Margherita", 30000, "Glera"],
    ["벨라비스타 프란차코르타 알마", "Bellavista Alma Gran Cuvée Franciacorta", "스파클링 · 프란차코르타", 12.5, "이탈리아", "롬바르디아", "Bellavista", 60000, "Chardonnay/Pinot Nero"],
    ["프레시넷 코르동 네그로", "Freixenet Cordon Negro Brut", "스파클링 · 까바", 11.5, "스페인", "페네데스", "Freixenet", 15000, "Macabeo/Xarel·lo/Parellada"],
    ["프레시넷 이탈리안 로제", "Freixenet Italian Rosé", "스파클링 · 로제", 11, "이탈리아", "베네토", "Freixenet", 18000, "Glera/Pinot Noir"],
    ["코도르니우 클라식 브뤼", "Codorníu Clásico Brut", "스파클링 · 까바", 11.5, "스페인", "페네데스", "Codorníu", 15000, "Macabeo/Xarel·lo/Parellada"],
    ["제이콥스 크릭 스파클링 로제", "Jacob's Creek Sparkling Rosé", "스파클링 · 로제", 11.5, "호주", "사우스 오스트레일리아", "Pernod Ricard Winemakers", 15000, "Pinot Noir/Chardonnay"],
    ["옐로우 테일 버블스", "[yellow tail] Bubbles", "스파클링 · 스파클링 와인", 11.5, "호주", "사우스 이스턴 오스트레일리아", "Casella Family Brands", 13000, ""],
  ]);
})();
