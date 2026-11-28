/* 술사전 대량 DB (6) — 와인 2,000종 확장 ①
 * 생산자 라인 × 품종, 부르고뉴·론 네고시앙 × 아펠라시옹, 보르도·샴페인·루아르·알자스·남프랑스.
 * 도수는 대표값, 참고가(₩)는 국내 판매가 근사치.
 */
(() => {
  const { rows } = window.BULK;
  const G = {
    CS: ["까베르네 소비뇽", "Cabernet Sauvignon", "레드"], ME: ["메를로", "Merlot", "레드"], PN: ["피노 누아", "Pinot Noir", "레드"], SY: ["쉬라즈", "Shiraz", "레드"],
    SR: ["시라", "Syrah", "레드"], MA: ["말벡", "Malbec", "레드"], CA: ["까르메네르", "Carmenère", "레드"], ZR: ["진판델", "Zinfandel", "레드"], SG: ["산지오베제", "Sangiovese", "레드"],
    TE: ["템프라니요", "Tempranillo", "레드"], GA: ["가르나차", "Garnacha", "레드"], MP: ["몬테풀치아노", "Montepulciano", "레드"], PI: ["피노타지", "Pinotage", "레드"],
    CH: ["샤르도네", "Chardonnay", "화이트"], SB: ["소비뇽 블랑", "Sauvignon Blanc", "화이트"], RI: ["리슬링", "Riesling", "화이트"], PG: ["피노 그리지오", "Pinot Grigio", "화이트"],
    PS: ["피노 그리", "Pinot Gris", "화이트"], VI: ["비오니에", "Viognier", "화이트"], MO: ["모스카토", "Moscato", "스위트"], RO: ["로제", "Rosé", "로제"],
  };
  const preset = (c, color) => c === "PN" ? "pinot" : c === "SG" || c === "MP" ? "italian" : c === "TE" || c === "GA" ? "spanish" : color === "레드" ? "redFull" : color === "스위트" ? "sweet" : "whiteCrisp";
  // 생산자 라인 × 품종
  const L = (ko, en, producer, country, region, abv, krw, codes) => codes.split(" ").forEach((c) => {
    const [gk, ge, color] = G[c];
    rows("wine", preset(c, color), [[`${ko} ${gk}`, `${en} ${ge}`, `${color} · ${gk}`, abv, country, region, producer, krw, c === "RO" ? "" : ge]]);
  });
  // 프랑스 남부
  L("제라르 베르트랑 레제르브 스페시알", "Gérard Bertrand Réserve Spéciale", "Gérard Bertrand", "프랑스", "랑그독 (Pays d'Oc)", 13.5, 18000, "CS ME CH VI PN SR");
  L("아로건트 프로그", "Arrogant Frog", "Jean-Claude Mas", "프랑스", "랑그독 (Pays d'Oc)", 13, 14000, "CS ME CH SB PN SR");
  L("폴 마스 에스테이트", "Paul Mas Estate", "Domaines Paul Mas", "프랑스", "랑그독 (Pays d'Oc)", 13.5, 16000, "CS ME CH SB PN SR MA");
  L("제이피 셰네", "J.P. Chenet", "Grands Chais de France", "프랑스", "랑그독 (Pays d'Oc)", 12.5, 10000, "CS ME CH SB RO");
  L("도멘 드 라 봄", "Domaine de la Baume", "Domaine de la Baume", "프랑스", "랑그독 (Pays d'Oc)", 13, 15000, "CS ME CH SB SR");
  L("칼베 바리에탈", "Calvet Varietals", "Calvet", "프랑스", "랑그독 (Pays d'Oc)", 12.5, 12000, "CS ME CH SB");
  L("조르주 뒤뵈프 페이 독", "Georges Duboeuf Pays d'Oc", "Georges Duboeuf", "프랑스", "랑그독 (Pays d'Oc)", 13, 13000, "CS ME CH");
  // 이탈리아
  L("조닌 클라시치", "Zonin Classici", "Zonin", "이탈리아", "베네토·아브루초", 12.5, 13000, "PG MP SG CH");
  L("카비트 컬렉션", "Cavit Collection", "Cavit", "이탈리아", "트렌티노", 12, 13000, "PN CH ME CS");
  L("메자코로나", "Mezzacorona", "Mezzacorona", "이탈리아", "트렌티노", 12.5, 15000, "PG CH PN");
  L("산타 마르게리타", "Santa Margherita", "Santa Margherita", "이탈리아", "알토 아디제", 12.5, 30000, "CH SB");
  L("칸티", "Canti", "Fratelli Martini", "이탈리아", "피에몬테·베네토", 7, 13000, "MO PG");
  // 스페인
  L("캄포 비에호", "Campo Viejo", "Campo Viejo", "스페인", "리오하", 13, 13000, "TE GA RO");
  // 칠레
  L("몬테스 리미티드 셀렉션", "Montes Limited Selection", "Viña Montes", "칠레", "레이다·콜차구아", 14, 22000, "PN SB");
  L("에라주리즈 에스테이트", "Errázuriz Estate Series", "Viña Errázuriz", "칠레", "아콩카구아", 13.5, 15000, "CS ME CA CH SB");
  L("산타 리타 레세르바", "Santa Rita Reserva", "Viña Santa Rita", "칠레", "센트럴 밸리", 13.5, 16000, "CS ME CA CH SB");
  L("까르멘 레세르바", "Carmen Reserva", "Viña Carmen", "칠레", "센트럴 밸리", 13.5, 15000, "CS CA CH SB");
  L("루이스 펠리페 에드워즈 레세르바", "Luis Felipe Edwards Reserva", "Luis Felipe Edwards", "칠레", "콜차구아", 13.5, 13000, "CS CA ME CH SB");
  L("모란데 피오네로", "Morandé Pionero", "Viña Morandé", "칠레", "센트럴 밸리", 13, 12000, "CS ME CA CH SB");
  L("비냐 마이포 미 푸에블로", "Viña Maipo Mi Pueblo", "Viña Maipo", "칠레", "센트럴 밸리", 13, 10000, "CS ME CA CH SB");
  L("운두라가 알리웬 레세르바", "Undurraga Aliwen Reserva", "Viña Undurraga", "칠레", "센트럴 밸리", 13.5, 13000, "CS CA ME CH SB");
  L("콘차이토로 테루뇨", "Concha y Toro Terrunyo", "Concha y Toro", "칠레", "마이포·카사블랑카", 14, 55000, "CS CA SB");
  L("미겔 토레스 산타 디그나", "Miguel Torres Santa Digna", "Miguel Torres Chile", "칠레", "센트럴 밸리", 13.5, 15000, "CS CA ME SB");
  L("코노 수르 오씨오", "Cono Sur Ocio", "Viña Cono Sur", "칠레", "카사블랑카", 14, 90000, "PN");
  // 아르헨티나
  L("트라피체 빈야드", "Trapiche Vineyards", "Trapiche", "아르헨티나", "멘도사", 13, 11000, "MA CS ME CH");
  L("트라피체 메달라", "Trapiche Medalla", "Trapiche", "아르헨티나", "멘도사", 14, 30000, "MA CS");
  L("노르톤 배럴 셀렉트", "Norton Barrel Select", "Bodega Norton", "아르헨티나", "멘도사", 13.5, 16000, "MA CS");
  L("산타 훌리아 오르가니카", "Santa Julia Orgánica", "Familia Zuccardi", "아르헨티나", "멘도사", 13.5, 13000, "MA CS CH");
  L("루이지 보스카", "Luigi Bosca", "Luigi Bosca", "아르헨티나", "멘도사", 14, 30000, "CS PN");
  L("수카르디 세리에 A", "Zuccardi Serie A", "Familia Zuccardi", "아르헨티나", "멘도사", 14, 22000, "MA CS");
  L("테라자스 레세르바", "Terrazas de los Andes Reserva", "Terrazas de los Andes", "아르헨티나", "멘도사", 14, 30000, "CS CH");
  L("도냐 파울라 에스테이트", "Doña Paula Estate", "Doña Paula", "아르헨티나", "멘도사", 14, 20000, "MA CS");
  L("핀카 라스 모라스", "Finca Las Moras", "Finca Las Moras", "아르헨티나", "산후안", 13.5, 11000, "MA CS SY CH");
  L("나바로 코레아스 콜렉시온 프리바다", "Navarro Correas Colección Privada", "Navarro Correas", "아르헨티나", "멘도사", 13.5, 15000, "MA CS");
  L("파스쿠알 토소", "Pascual Toso", "Pascual Toso", "아르헨티나", "멘도사", 13.5, 15000, "MA CS");
  // 미국
  L("베린저 메인 앤 바인", "Beringer Main & Vine", "Beringer Vineyards", "미국", "캘리포니아", 12.5, 11000, "CS ME CH PG MO");
  L("컬럼비아 크레스트 H3", "Columbia Crest H3", "Columbia Crest", "미국", "워싱턴 호스 헤븐 힐스", 14, 30000, "CS ME CH");
  L("로드니 스트롱", "Rodney Strong Sonoma County", "Rodney Strong", "미국", "소노마", 13.5, 30000, "CH ME PN SB");
  L("시미 소노마 카운티", "Simi Sonoma County", "Simi Winery", "미국", "소노마", 13.5, 32000, "CS CH SB");
  L("프란시스칸", "Franciscan Estate", "Franciscan Estate", "미국", "캘리포니아", 13.5, 28000, "CS CH");
  L("스털링 빈트너스 컬렉션", "Sterling Vintner's Collection", "Sterling Vineyards", "미국", "캘리포니아 센트럴 코스트", 13.5, 18000, "CS ME CH PN SB");
  L("BV 코스탈 에스테이트", "BV Coastal Estates", "Beaulieu Vineyard", "미국", "캘리포니아", 13.5, 18000, "ME CH PN SB");
  L("조엘 갓", "Joel Gott", "Joel Gott Wines", "미국", "캘리포니아", 14, 30000, "CS CH SB ZR");
  L("머피 굿", "Murphy-Goode", "Murphy-Goode", "미국", "캘리포니아", 13.5, 22000, "CS CH SB");
  L("세바스티아니", "Sebastiani Sonoma County", "Sebastiani", "미국", "소노마", 13.5, 28000, "CS CH");
  L("레이븐스우드 빈트너스 블렌드", "Ravenswood Vintners Blend", "Ravenswood", "미국", "캘리포니아", 13.5, 18000, "ZR CS");
  L("헤스 셀렉트", "Hess Select", "The Hess Collection", "미국", "캘리포니아", 13.5, 22000, "CS CH");
  L("클로 뒤 발", "Clos du Val Napa Valley", "Clos du Val", "미국", "나파 밸리", 14, 70000, "CS CH");
  L("A 투 Z 와인웍스", "A to Z Wineworks", "A to Z Wineworks", "미국", "오리건", 13, 28000, "PN PG");
  L("마크 웨스트", "Mark West", "Mark West", "미국", "캘리포니아", 13.5, 18000, "PN");
  L("킹 에스테이트", "King Estate", "King Estate", "미국", "오리건", 13.5, 30000, "PS PN");
  // 호주·뉴질랜드·남아공·독일
  L("로즈마운트 다이아몬드 라벨", "Rosemount Diamond Label", "Rosemount Estate", "호주", "사우스 이스턴 오스트레일리아", 13.5, 15000, "SY CS CH SB ME");
  L("맥기건 블랙 라벨", "McGuigan Black Label", "McGuigan Wines", "호주", "사우스 이스턴 오스트레일리아", 13, 12000, "SY CS ME CH MO");
  L("테일러스 에스테이트", "Taylors Estate", "Taylors (Wakefield)", "호주", "클레어 밸리", 14, 22000, "SY CS ME CH RI");
  L("피터 레만 포트레이트", "Peter Lehmann Portrait", "Peter Lehmann", "호주", "바로사", 14, 22000, "SY CS");
  L("펜폴즈 로슨스 리트리트", "Penfolds Rawson's Retreat", "Penfolds", "호주", "사우스 이스턴 오스트레일리아", 13.5, 13000, "SY CS CH");
  L("매투아", "Matua", "Matua", "뉴질랜드", "말보로", 12.5, 18000, "SB PN");
  L("스톤레이", "Stoneleigh", "Stoneleigh", "뉴질랜드", "말보로", 12.5, 20000, "SB PN");
  L("기슨", "Giesen", "Giesen Wines", "뉴질랜드", "말보로", 12.5, 18000, "SB PN");
  L("오이스터 베이 호크스 베이", "Oyster Bay Hawke's Bay", "Delegat", "뉴질랜드", "호크스 베이", 13.5, 21000, "ME");
  L("브랑코트 이스테이트", "Brancott Estate Marlborough", "Brancott Estate", "뉴질랜드", "말보로", 13, 20000, "PN");
  L("스피어 시그니처", "Spier Signature", "Spier", "남아프리카공화국", "웨스턴 케이프", 13.5, 14000, "CS ME CH SB PI");
  L("KWV 클래식", "KWV Classic Collection", "KWV", "남아프리카공화국", "웨스턴 케이프", 13.5, 12000, "CS PI CH SB");
  L("보스헨달 1685", "Boschendal 1685", "Boschendal", "남아프리카공화국", "프란슈후크", 13.5, 25000, "SR CH SB");
  L("빌라 볼프", "Villa Wolf", "J.L. Wolf", "독일", "팔츠", 12, 18000, "RI PS PN");

  /* ── 부르고뉴 네고시앙 × 아펠라시옹 ── */
  const B = (pk, pe, list) => rows("wine", null, list.map(([ak, ae, col, krw, cls]) => [`${pk} ${ak}`, `${pe} ${ae}`, `${col === "R" ? "레드" : "화이트"} · 부르고뉴 ${cls || "빌라주"}`, col === "R" ? 13 : 13, "프랑스", `부르고뉴 ${ak.replace(/ (1er|프르미에).*$/, "")}`, pe, krw, col === "R" ? "Pinot Noir" : "Chardonnay", col === "R" ? "pinot" : "whiteCrisp"]));
  const APP_R = [["부르고뉴 오트 코트 드 뉘", "Bourgogne Hautes-Côtes de Nuits", 40000, "지역"], ["마르사네", "Marsannay", 55000], ["픽생", "Fixin", 60000], ["쥐브레 샹베르탱", "Gevrey-Chambertin", 110000], ["모레 생 드니", "Morey-Saint-Denis", 110000],
    ["샹볼 뮈지니", "Chambolle-Musigny", 120000], ["본 로마네", "Vosne-Romanée", 140000], ["뉘 생 조르주", "Nuits-Saint-Georges", 100000], ["알록스 코르통", "Aloxe-Corton", 75000], ["사비니 레 본", "Savigny-lès-Beaune", 60000],
    ["본", "Beaune", 65000], ["포마르", "Pommard", 100000], ["볼네", "Volnay", 100000], ["상트네", "Santenay", 55000], ["메르퀴레", "Mercurey", 45000], ["지브리", "Givry", 45000]];
  const APP_W = [["뫼르소", "Meursault", 110000], ["퓔리니 몽라셰", "Puligny-Montrachet", 130000], ["샤샤뉴 몽라셰", "Chassagne-Montrachet", 120000], ["생 토뱅", "Saint-Aubin", 70000], ["륄리", "Rully", 45000],
    ["몽타니", "Montagny", 40000], ["생 베랑", "Saint-Véran", 35000], ["마꽁 빌라주", "Mâcon-Villages", 25000], ["샤블리", "Chablis", 40000], ["샤블리 1er 크뤼", "Chablis Premier Cru", 60000, "1er Cru"], ["부르고뉴 샤르도네", "Bourgogne Chardonnay", 30000, "지역"]];
  const NEG = [["루이 자도", "Louis Jadot"], ["조셉 드루앵", "Joseph Drouhin"], ["부샤 페르 에 피스", "Bouchard Père & Fils"], ["루이 라뚜르", "Louis Latour"], ["알베르 비쇼", "Albert Bichot"], ["메종 샹피", "Maison Champy"], ["장 클로드 부아세", "Jean-Claude Boisset"], ["라부레 루아", "Labouré-Roi"]];
  NEG.forEach(([pk, pe], i) => {
    const pick = (arr, step) => arr.filter((_, j) => (j + i) % step !== 0);           // 네고시앙마다 대표 아펠라시옹 위주로
    B(pk, pe, [...pick(APP_R, 3).map(([k, e, w, c]) => [k, e, "R", w, c]), ...pick(APP_W, 3).map(([k, e, w, c]) => [k, e, "W", w, c])]);
  });
  // 도멘
  rows("wine", "pinot", [
    ["도멘 페블리 니 생 조르주", "Domaine Faiveley Nuits-Saint-Georges", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 뉘 생 조르주", "Domaine Faiveley", 110000, "Pinot Noir"],
    ["도멘 드 라 로마네 콩티 코르통", "Domaine de la Romanée-Conti Corton", "레드 · 그랑 크뤼", 13.5, "프랑스", "부르고뉴 코르통", "Domaine de la Romanée-Conti", 3500000, "Pinot Noir"],
    ["도멘 르루아 부르고뉴 루즈", "Domaine Leroy Bourgogne Rouge", "레드 · 부르고뉴", 13, "프랑스", "부르고뉴", "Domaine Leroy", 350000, "Pinot Noir"],
    ["도멘 드 몽티유 볼네", "Domaine de Montille Volnay", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 볼네", "Domaine de Montille", 130000, "Pinot Noir"],
    ["도멘 콩트 라퐁 볼네 상트노", "Domaine des Comtes Lafon Volnay Santenots-du-Milieu", "레드 · 1er Cru", 13, "프랑스", "부르고뉴 볼네", "Domaine des Comtes Lafon", 250000, "Pinot Noir"],
    ["도멘 실뱅 카티아르 본 로마네", "Domaine Sylvain Cathiard Vosne-Romanée", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 본 로마네", "Domaine Sylvain Cathiard", 400000, "Pinot Noir"],
    ["도멘 앙리 구주 니 생 조르주", "Domaine Henri Gouges Nuits-Saint-Georges", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 뉘 생 조르주", "Domaine Henri Gouges", 120000, "Pinot Noir"],
    ["도멘 드 라르로 니 생 조르주", "Domaine de l'Arlot Nuits-Saint-Georges Clos de l'Arlot", "레드 · 1er Cru", 13, "프랑스", "부르고뉴 뉘 생 조르주", "Domaine de l'Arlot", 150000, "Pinot Noir"],
    ["도멘 마르키 당제르빌 볼네", "Domaine Marquis d'Angerville Volnay", "레드 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 볼네", "Domaine Marquis d'Angerville", 150000, "Pinot Noir"],
    ["도멘 프리외레 로슈 뉘 생 조르주", "Domaine Prieuré Roch Nuits-Saint-Georges", "레드 · 부르고뉴 빌라주", 12.5, "프랑스", "부르고뉴 뉘 생 조르주", "Domaine Prieuré Roch", 250000, "Pinot Noir"],
  ]);
  rows("wine", "whiteCrisp", [
    ["도멘 콩트 라퐁 뫼르소", "Domaine des Comtes Lafon Meursault", "화이트 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 뫼르소", "Domaine des Comtes Lafon", 250000, "Chardonnay"],
    ["도멘 라모네 샤샤뉴 몽라셰", "Domaine Ramonet Chassagne-Montrachet", "화이트 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 샤샤뉴 몽라셰", "Domaine Ramonet", 250000, "Chardonnay"],
    ["도멘 에티엔 소제 퓔리니 몽라셰", "Domaine Étienne Sauzet Puligny-Montrachet", "화이트 · 부르고뉴 빌라주", 13, "프랑스", "부르고뉴 퓔리니 몽라셰", "Domaine Étienne Sauzet", 180000, "Chardonnay"],
    ["도멘 라브노 샤블리 1er 크뤼 몽테 드 토네르", "Domaine François Raveneau Chablis 1er Cru Montée de Tonnerre", "화이트 · 샤블리 1er Cru", 12.5, "프랑스", "부르고뉴 샤블리", "Domaine François Raveneau", 500000, "Chardonnay"],
    ["도멘 뱅상 도비사 샤블리 1er 크뤼 라 포레", "Domaine Vincent Dauvissat Chablis 1er Cru La Forest", "화이트 · 샤블리 1er Cru", 12.5, "프랑스", "부르고뉴 샤블리", "Domaine Vincent Dauvissat", 250000, "Chardonnay"],
    ["도멘 귀팡 에냉 마꽁 피에르클로", "Domaine Guffens-Heynen Mâcon-Pierreclos", "화이트 · 마꼬네", 13.5, "프랑스", "부르고뉴 마꼬네", "Domaine Guffens-Heynen", 90000, "Chardonnay"],
    ["샤또 퓌세 푸이 퓌세 테트 드 퀴베", "Château-Fuissé Pouilly-Fuissé Tête de Cru", "화이트 · 마꼬네", 13.5, "프랑스", "부르고뉴 푸이 퓌세", "Château-Fuissé", 70000, "Chardonnay"],
    ["도멘 데 콩트 라퐁 마꽁 밀리 라마르탱", "Héritiers du Comte Lafon Mâcon-Milly-Lamartine", "화이트 · 마꼬네", 13, "프랑스", "부르고뉴 마꼬네", "Héritiers du Comte Lafon", 60000, "Chardonnay"],
  ]);

  /* ── 론 네고시앙 × 아펠라시옹 ── */
  const RH = (pk, pe, list) => rows("wine", "redMed", list.map(([ak, ae, col, krw, ing]) => [`${pk} ${ak}`, `${pe} ${ae}`, `${col === "R" ? "레드" : col === "P" ? "로제" : "화이트"} · 론`, col === "R" ? 14 : 13.5, "프랑스", `론 ${ak.replace(/ (루즈|블랑)$/, "")}`, pe, krw, ing || (col === "R" ? "Syrah/Grenache" : "Viognier/Marsanne/Roussanne"), col === "R" ? "redMed" : "whiteCrisp"]));
  RH("샤푸티에", "M. Chapoutier", [["벨뤼슈 블랑", "Belleruche Côtes du Rhône Blanc", "W", 22000], ["벨뤼슈 로제", "Belleruche Côtes du Rhône Rosé", "P", 22000, "Grenache/Cinsault"], ["마리위스 루즈", "Marius Rouge", "R", 15000],
    ["크로즈 에르미타주 레 메종니에", "Crozes-Hermitage Les Meysonniers", "R", 40000, "Syrah"], ["생 조제프 데샹", "Saint-Joseph Deschants", "R", 45000, "Syrah"], ["코트 로티 레 베카스", "Côte-Rôtie Les Bécasses", "R", 110000, "Syrah"],
    ["콩드리외 앵비타르", "Condrieu Invitare", "W", 90000, "Viognier"], ["에르미타주 샹트 알루에트", "Hermitage Chante-Alouette Blanc", "W", 120000, "Marsanne"], ["지공다스", "Gigondas", "R", 45000, "Grenache/Syrah"], ["타벨", "Tavel Beaurevoir", "P", 35000, "Grenache/Cinsault"]]);
  RH("이 기갈", "E. Guigal", [["생 조제프 리유디", "Saint-Joseph Lieu-dit Saint-Joseph Rouge", "R", 90000, "Syrah"], ["크로즈 에르미타주 블랑", "Crozes-Hermitage Blanc", "W", 45000, "Marsanne/Roussanne"],
    ["타벨", "Tavel", "P", 35000, "Grenache/Cinsault"], ["샤또 당퓌 코트 로티", "Côte-Rôtie Château d'Ampuis", "R", 200000, "Syrah/Viognier"], ["콩드리외", "Condrieu", "W", 80000, "Viognier"], ["방투", "Ventoux", "R", 18000, "Grenache/Syrah"]]);
  RH("폴 자불레 에네", "Paul Jaboulet Aîné", [["파라렐 45 블랑", "Parallèle 45 Côtes du Rhône Blanc", "W", 22000], ["파라렐 45 로제", "Parallèle 45 Côtes du Rhône Rosé", "P", 22000, "Grenache/Cinsault"],
    ["크로즈 에르미타주 레 잘레", "Crozes-Hermitage Les Jalets", "R", 35000, "Syrah"], ["생 조제프 르 그랑 퐁페", "Saint-Joseph Le Grand Pompée", "R", 45000, "Syrah"], ["코트 로티 레 쥐멜", "Côte-Rôtie Les Jumelles", "R", 120000, "Syrah"],
    ["샤또네프 뒤 파프 레 세드르", "Châteauneuf-du-Pape Les Cèdres", "R", 75000, "Grenache/Syrah/Mourvèdre"], ["방투", "Ventoux", "R", 18000]]);
  RH("들라스", "Delas Frères", [["생 에스프리 꼬뜨 뒤 론", "Côtes du Rhône Saint-Esprit Rouge", "R", 18000], ["생 조제프 프랑수아 드 투르농", "Saint-Joseph François de Tournon", "R", 45000, "Syrah"],
    ["코트 로티 세뇨르 드 모지롱", "Côte-Rôtie Seigneur de Maugiron", "R", 90000, "Syrah"], ["콩드리외 라 갈란티에르", "Condrieu La Galopine", "W", 80000, "Viognier"], ["에르미타주 마르키즈 드 라 투레트", "Hermitage Marquise de la Tourette", "R", 120000, "Syrah"]]);
  RH("페랭", "Famille Perrin", [["코뒬레 드 보카스텔 루즈", "Coudoulet de Beaucastel Rouge", "R", 45000, "Grenache/Mourvèdre/Syrah"], ["코뒬레 드 보카스텔 블랑", "Coudoulet de Beaucastel Blanc", "W", 45000, "Marsanne/Viognier/Bourboulenc"],
    ["뱅소브르 레 코르뉘", "Vinsobres Les Cornuds", "R", 35000], ["라스토 랑데올", "Rasteau L'Andéol", "R", 35000], ["케란 페르 블랑슈", "Cairanne Peyre Blanche", "R", 35000], ["바케라스 레 크리스탱", "Vacqueyras Les Christins", "R", 40000],
    ["꼬뜨 뒤 론 레제르브 블랑", "Côtes du Rhône Réserve Blanc", "W", 22000], ["샤또 드 보카스텔 블랑", "Château de Beaucastel Châteauneuf-du-Pape Blanc", "W", 160000, "Roussanne/Grenache Blanc"]]);
  RH("오지에", "Ogier", [["헤리티지 꼬뜨 뒤 론", "Héritages Côtes du Rhône Rouge", "R", 18000], ["샤또네프 뒤 파프 클로 드 로라투아르 데 파프", "Clos de l'Oratoire des Papes Châteauneuf-du-Pape", "R", 65000, "Grenache/Syrah/Mourvèdre"]]);
  RH("비달 플뢰리", "Vidal-Fleury", [["콩드리외", "Condrieu", "W", 75000, "Viognier"], ["코트 로티 브륀 에 블롱드", "Côte-Rôtie Brune et Blonde", "R", 100000, "Syrah/Viognier"], ["크로즈 에르미타주", "Crozes-Hermitage Rouge", "R", 35000, "Syrah"]]);
  rows("wine", "redMed", [
    ["도멘 장 루이 샤브 에르미타주", "Domaine Jean-Louis Chave Hermitage Rouge", "레드 · 북부 론", 13.5, "프랑스", "론 에르미타주", "Domaine Jean-Louis Chave", 600000, "Syrah"],
    ["도멘 오귀스트 클라프 코르나스", "Domaine Auguste Clape Cornas", "레드 · 북부 론", 13, "프랑스", "론 코르나스", "Domaine Auguste Clape", 180000, "Syrah"],
    ["도멘 알랭 그라이요 크로즈 에르미타주", "Domaine Alain Graillot Crozes-Hermitage", "레드 · 북부 론", 13, "프랑스", "론 크로즈 에르미타주", "Domaine Alain Graillot", 55000, "Syrah"],
    ["도멘 앙드레 페레 콩드리외", "Domaine André Perret Condrieu Chéry", "화이트 · 콩드리외", 14, "프랑스", "론 콩드리외", "Domaine André Perret", 110000, "Viognier", "whiteCrisp"],
    ["도멘 드 라 자나스 샤또네프 뒤 파프", "Domaine de la Janasse Châteauneuf-du-Pape", "레드 · 남부 론", 15, "프랑스", "론 샤또네프 뒤 파프", "Domaine de la Janasse", 75000, "Grenache/Syrah/Mourvèdre"],
    ["도멘 드 라 샤르보니에르", "Domaine de la Charbonnière Châteauneuf-du-Pape", "레드 · 남부 론", 15, "프랑스", "론 샤또네프 뒤 파프", "Domaine de la Charbonnière", 70000, "Grenache/Syrah/Mourvèdre"],
    ["샤또 드 생 콤 지공다스", "Château de Saint Cosme Gigondas", "레드 · 남부 론", 14.5, "프랑스", "론 지공다스", "Château de Saint Cosme", 60000, "Grenache/Syrah"],
    ["도멘 산타 뒤크 지공다스", "Domaine Santa Duc Gigondas", "레드 · 남부 론", 14.5, "프랑스", "론 지공다스", "Domaine Santa Duc", 55000, "Grenache/Mourvèdre"],
    ["도멘 드 라 모르두레 타벨", "Domaine de la Mordorée Tavel La Dame Rousse", "로제 · 타벨", 14, "프랑스", "론 타벨", "Domaine de la Mordorée", 40000, "Grenache/Cinsault", "whiteCrisp"],
  ]);

  /* ── 보르도: 크뤼 부르주아 · 생테밀리옹 · 포므롤 · 그라브 · 소테른 · 코트 ── */
  const BX = (appKo, style, preset, ing, list) => rows("wine", preset, list.map(([ko, en, krw]) => [ko, en, style, 13.5, "프랑스", `보르도 ${appKo}`, en, krw, ing]));
  const CSM = "Cabernet Sauvignon/Merlot", MCF = "Merlot/Cabernet Franc";
  BX("생테스테프", "레드 · 메독", "redFull", CSM, [["샤또 펠랑 세귀르", "Château Phélan Ségur", 80000], ["샤또 메이네", "Château Meyney", 55000], ["샤또 드 페즈", "Château de Pez", 60000],
    ["샤또 레 오름 드 페즈", "Château Ormes de Pez", 50000], ["샤또 오 마르뷔제", "Château Haut-Marbuzet", 70000], ["샤또 릴리앙 라두이", "Château Lilian Ladouys", 40000], ["샤또 캅베른", "Château Capbern", 45000], ["샤또 트롱코이 랄랑드", "Château Tronquoy-Lalande", 50000]]);
  BX("마고", "레드 · 메독", "redFull", CSM, [["샤또 시랑", "Château Siran", 55000], ["샤또 라베고르스", "Château Labégorce", 50000], ["샤또 다르삭", "Château d'Arsac", 35000], ["샤또 몽브리송", "Château Monbrison", 50000]]);
  BX("물리스·리스트락", "레드 · 메독", "redFull", CSM, [["샤또 푸조", "Château Poujeaux", 55000], ["샤또 포르카 오스탱", "Château Fourcas Hosten", 40000], ["샤또 모바쟁 바르통", "Château Mauvesin Barton", 35000], ["샤또 퐁레오", "Château Fonréaud", 35000], ["샤또 브라나 그랑 푸조", "Château Branas Grand Poujeaux", 45000]]);
  BX("오메독·메독", "레드 · 메독", "redFull", CSM, [["샤또 세네작", "Château Sénéjac", 40000], ["샤또 시삭", "Château Cissac", 40000], ["샤또 투르 드 비", "Château Tour de By", 35000], ["샤또 파타슈 도", "Château Patache d'Aux", 30000],
    ["샤또 다가삭", "Château d'Agassac", 40000], ["샤또 말레스카스", "Château Malescasse", 35000], ["샤또 아르노", "Château Arnauld", 35000], ["샤또 쿠프랑", "Château Coufran", 35000], ["샤또 베르디냥", "Château Verdignan", 30000],
    ["샤또 벨뷔 (오메독)", "Château Belle-Vue Haut-Médoc", 40000], ["샤또 라 투르 드 몽", "Château La Tour de Mons", 40000]]);
  BX("포이약·생쥘리앙", "레드 · 메독", "redFull", CSM, [["샤또 퐁바데", "Château Fonbadet", 55000], ["샤또 오 바주 아베루", "Château Haut-Bages Averous", 45000], ["샤또 라랑드 보리", "Château Lalande-Borie", 45000], ["샤또 페마르탱", "Château Peymartin", 35000]]);
  BX("생테밀리옹", "레드 · 생테밀리옹 그랑 크뤼", "redFull", MCF, [["샤또 퐁브로주", "Château Fombrauge", 45000], ["샤또 포제르", "Château Faugères", 55000], ["샤또 몽부스케", "Château Monbousquet", 70000], ["샤또 라르망드", "Château Larmande", 55000],
    ["샤또 라로즈", "Château Laroze", 50000], ["샤또 수타르", "Château Soutard", 60000], ["샤또 카데 봉", "Château Cadet-Bon", 50000], ["샤또 퐁플레가드", "Château Fonplégade", 60000], ["샤또 다소", "Château Dassault", 55000],
    ["샤또 라 도미니크", "Château La Dominique", 70000], ["샤또 라 투르 피작", "Château La Tour Figeac", 60000], ["샤또 카농 라 가플리에르", "Château Canon-la-Gaffelière", 130000], ["라 몽도트", "La Mondotte", 300000],
    ["샤또 벨뷔 (생테밀리옹)", "Château Bellevue Saint-Émilion", 90000], ["샤또 베를리케", "Château Berliquet", 60000], ["샤또 코르뱅", "Château Corbin", 55000], ["샤또 그랑 코르뱅 데스파뉴", "Château Grand Corbin-Despagne", 50000],
    ["샤또 장 포르", "Château Jean Faure", 55000], ["샤또 오 사르프", "Château Haut-Sarpe", 50000], ["샤또 그랑 퐁테", "Château Grand-Pontet", 50000], ["샤또 상소네", "Château Sansonnet", 50000], ["샤또 페비 포제르", "Château Péby Faugères", 180000],
    ["샤또 키노 랑클로", "Château Quinault l'Enclos", 60000], ["샤또 라 세르", "Château La Serre", 55000], ["샤또 슈발 누아", "Château Cheval Noir", 30000], ["샤또 투르 생 크리스토프", "Château Tour Saint Christophe", 45000]]);
  BX("포므롤", "레드 · 포므롤", "redFull", MCF, [["샤또 보르가르", "Château Beauregard", 80000], ["샤또 부르뇌프", "Château Bourgneuf", 60000], ["샤또 세르탕 드 메", "Château Certan de May", 130000], ["클로 레글리즈", "Clos L'Église", 150000],
    ["샤또 라 카반", "Château La Cabanne", 50000], ["샤또 라 크루아 드 게", "Château La Croix de Gay", 65000], ["샤또 라 푸앵트", "Château La Pointe", 65000], ["샤또 르 봉 파스퇴르", "Château Le Bon Pasteur", 110000],
    ["샤또 루제", "Château Rouget", 70000], ["샤또 브레 크루아 드 게", "Château Vray Croix de Gay", 70000], ["샤또 플랭스", "Château Plince", 50000], ["클로 뒤 클로셰", "Clos du Clocher", 70000], ["샤또 레글리즈 클리네", "Château L'Église-Clinet", 400000],
    ["샤또 페이티 클리네", "Château Feytit-Clinet", 90000], ["샤또 르 게", "Château Le Gay", 150000], ["샤또 라 비올레트", "Château La Violette", 250000], ["샤또 라 프로비당스", "Château La Providence", 200000]]);
  BX("페삭 레오냥", "레드 · 그라브", "redFull", CSM, [["샤또 라리베 오브리옹", "Château Larrivet Haut-Brion", 55000], ["샤또 드 피외잘", "Château de Fieuzal", 60000], ["샤또 부스코", "Château Bouscaut", 50000], ["샤또 오 베르제", "Château Haut-Bergey", 50000],
    ["샤또 드 로슈모랭", "Château de Rochemorin", 40000], ["샤또 라 루비에르", "Château La Louvière", 50000], ["샤또 올리비에", "Château Olivier", 50000], ["샤또 피크 카유", "Château Picque Caillou", 40000], ["샤또 세갱", "Château Seguin", 45000]]);
  BX("소테른·바르삭", "스위트 · 소테른", "sweet", "Sémillon/Sauvignon Blanc", [["샤또 필로", "Château Filhot", 60000], ["샤또 드 파르그", "Château de Fargues", 250000], ["샤또 드 말", "Château de Malle", 60000], ["샤또 시갈라 라보", "Château Sigalas-Rabaud", 80000],
    ["샤또 라보 프로미", "Château Rabaud-Promis", 65000], ["클로 오 페라게", "Clos Haut-Peyraguey", 80000], ["샤또 네락", "Château Nairac", 60000], ["샤또 라모트 기냐르", "Château Lamothe-Guignard", 50000], ["샤또 다르슈", "Château d'Arche", 60000], ["샤또 바스토르 라몽타뉴", "Château Bastor-Lamontagne", 40000]]);
  BX("코트·앙트르 되 메르", "레드 · 보르도 코트", "redMed", MCF, [["샤또 퓌게로", "Château Puygueraud", 40000], ["로크 드 캄브", "Roc de Cambes", 70000], ["샤또 오 베르티느리", "Château Haut-Bertinerie", 30000], ["샤또 드 레냐크", "Château de Reignac", 40000],
    ["샤또 티욀리", "Château Thieuley Rouge", 25000], ["샤또 드 라 리비에르", "Château de la Rivière (Fronsac)", 35000], ["샤또 라 비외유 퀴르", "Château La Vieille Cure (Fronsac)", 40000], ["샤또 몽페라 블랑", "Château Mont-Pérat Blanc", 22000],
    ["샤또 퐁텐", "Château Fontenil (Fronsac)", 45000], ["샤또 그랑 비야주", "Château Grand Village", 30000], ["바롱 필립 드 로칠드 무통 카데 레제르브", "Mouton Cadet Réserve Saint-Émilion", 35000], ["샤또 드 셍", "Château de Sours", 25000]]);
  BX("보르도 화이트", "화이트 · 보르도", "whiteCrisp", "Sauvignon Blanc/Sémillon", [["샤또 티욀리 블랑", "Château Thieuley Blanc", 22000], ["샤또 드 피외잘 블랑", "Château de Fieuzal Blanc", 70000], ["샤또 라 루비에르 블랑", "Château La Louvière Blanc", 55000],
    ["샤또 파프 클레망 블랑", "Château Pape Clément Blanc", 220000], ["샤또 말라르틱 라그라비에르 블랑", "Château Malartic-Lagravière Blanc", 110000], ["르 쁘띠 오 라피트 블랑", "Le Petit Haut Lafitte Blanc", 60000], ["엘 드 리외섹", "R de Rieussec", 35000]]);

  /* ── 샴페인 하우스 라인 ── */
  rows("wine", "bubbly", [
    ["모엣 샹동 그랑 빈티지 로제", "Moët & Chandon Grand Vintage Rosé", "스파클링 · 빈티지 로제", 12.5, "프랑스", "샹파뉴", "Moët & Chandon", 140000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["뵈브 클리코 데미 섹", "Veuve Clicquot Demi-Sec", "스파클링 · 드미 섹", 12, "프랑스", "샹파뉴", "Veuve Clicquot", 75000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["뵈브 클리코 빈티지", "Veuve Clicquot Vintage Brut", "스파클링 · 빈티지 샴페인", 12, "프랑스", "샹파뉴", "Veuve Clicquot", 110000, "Pinot Noir/Chardonnay"],
    ["떼땅져 녹튀른", "Taittinger Nocturne", "스파클링 · 섹", 12, "프랑스", "샹파뉴", "Taittinger", 90000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["떼땅져 콩트 드 샹파뉴 로제", "Taittinger Comtes de Champagne Rosé", "스파클링 · 프레스티지 로제", 12, "프랑스", "샹파뉴", "Taittinger", 450000, "Pinot Noir/Chardonnay"],
    ["볼랭저 R.D.", "Bollinger R.D.", "스파클링 · 프레스티지 퀴베", 12, "프랑스", "샹파뉴 아이", "Bollinger", 400000, "Pinot Noir/Chardonnay"],
    ["폴 로저 블랑 드 블랑", "Pol Roger Blanc de Blancs Vintage", "스파클링 · 블랑 드 블랑", 12.5, "프랑스", "샹파뉴 에페르네", "Pol Roger", 160000, "Chardonnay"],
    ["루이 로드레 로제 빈티지", "Louis Roederer Rosé Vintage", "스파클링 · 빈티지 로제", 12, "프랑스", "샹파뉴", "Louis Roederer", 150000, "Pinot Noir/Chardonnay"],
    ["크리스탈 로제", "Louis Roederer Cristal Rosé", "스파클링 · 프레스티지 로제", 12, "프랑스", "샹파뉴", "Louis Roederer", 1500000, "Pinot Noir/Chardonnay"],
    ["로랑 페리에 울트라 브뤼", "Laurent-Perrier Ultra Brut", "스파클링 · 브뤼 나튀르", 12, "프랑스", "샹파뉴", "Laurent-Perrier", 110000, "Chardonnay/Pinot Noir"],
    ["로랑 페리에 블랑 드 블랑", "Laurent-Perrier Blanc de Blancs Brut Nature", "스파클링 · 블랑 드 블랑", 12, "프랑스", "샹파뉴", "Laurent-Perrier", 150000, "Chardonnay"],
    ["파이퍼 하이직 레어", "Piper-Heidsieck Rare Millésime", "스파클링 · 프레스티지 퀴베", 12, "프랑스", "샹파뉴", "Piper-Heidsieck", 250000, "Chardonnay/Pinot Noir"],
    ["파이퍼 하이직 로제 소바주", "Piper-Heidsieck Rosé Sauvage", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "Piper-Heidsieck", 75000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["멈 그랑 코르동 로제", "Mumm Grand Cordon Rosé", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "G.H. Mumm", 85000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["페리에 주에 블라종 로제", "Perrier-Jouët Blason Rosé", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴", "Perrier-Jouët", 90000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["페리에 주에 벨 에포크 로제", "Perrier-Jouët Belle Epoque Rosé", "스파클링 · 프레스티지 로제", 12.5, "프랑스", "샹파뉴", "Perrier-Jouët", 400000, "Chardonnay/Pinot Noir"],
    ["뤼나르 블랑 생귈리에", "Ruinart Blanc Singulier", "스파클링 · 블랑 드 블랑", 12.5, "프랑스", "샹파뉴", "Ruinart", 180000, "Chardonnay"],
    ["드라피에 브뤼 나튀르 제로 도사주", "Drappier Brut Nature Zéro Dosage", "스파클링 · 브뤼 나튀르", 12, "프랑스", "샹파뉴 오브", "Drappier", 80000, "Pinot Noir"],
    ["앙리오 블랑 드 블랑", "Henriot Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12, "프랑스", "샹파뉴", "Henriot", 100000, "Chardonnay"],
    ["도츠 블랑 드 블랑", "Deutz Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12, "프랑스", "샹파뉴 아이", "Deutz", 150000, "Chardonnay"],
    ["도츠 로제", "Deutz Brut Rosé", "스파클링 · 로제 샴페인", 12, "프랑스", "샹파뉴 아이", "Deutz", 110000, "Pinot Noir/Chardonnay"],
    ["고세 셀레브리스", "Gosset Celebris Extra Brut", "스파클링 · 프레스티지 퀴베", 12, "프랑스", "샹파뉴 아이", "Gosset", 300000, "Chardonnay/Pinot Noir"],
    ["샤를 하이직 블랑 데 밀레네르", "Charles Heidsieck Blanc des Millénaires", "스파클링 · 블랑 드 블랑", 12, "프랑스", "샹파뉴", "Charles Heidsieck", 350000, "Chardonnay"],
    ["빌카르 살몽 블랑 드 블랑", "Billecart-Salmon Blanc de Blancs Grand Cru", "스파클링 · 블랑 드 블랑", 12, "프랑스", "샹파뉴", "Billecart-Salmon", 170000, "Chardonnay"],
    ["랑송 로제 라벨", "Lanson Le Rosé", "스파클링 · 로제 샴페인", 12.5, "프랑스", "샹파뉴 랭스", "Lanson", 75000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["포므리 아파나주 브뤼", "Pommery Apanage Brut", "스파클링 · 샴페인", 12.5, "프랑스", "샹파뉴 랭스", "Pommery", 75000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["포므리 퀴베 루이즈", "Pommery Cuvée Louise", "스파클링 · 프레스티지 퀴베", 12.5, "프랑스", "샹파뉴 랭스", "Pommery", 300000, "Chardonnay/Pinot Noir"],
    ["에드시크 모노폴 블루 탑", "Heidsieck & Co Monopole Blue Top Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴", "Heidsieck & Co Monopole", 50000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["티에노 브뤼", "Thiénot Brut", "스파클링 · 샴페인", 12, "프랑스", "샹파뉴 랭스", "Thiénot", 65000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["브루노 파이야르 프르미에 퀴베", "Bruno Paillard Première Cuvée", "스파클링 · 엑스트라 브뤼", 12, "프랑스", "샹파뉴 랭스", "Bruno Paillard", 90000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["크레망 드 부르고뉴 루이 부이요", "Louis Bouillot Crémant de Bourgogne Perle d'Ivoire", "스파클링 · 크레망", 12, "프랑스", "부르고뉴", "Louis Bouillot", 28000, "Pinot Noir/Chardonnay"],
    ["크레망 달자스 뤼시앵 알브레히트", "Lucien Albrecht Crémant d'Alsace Brut", "스파클링 · 크레망", 12, "프랑스", "알자스", "Lucien Albrecht", 25000, "Pinot Blanc/Auxerrois/Chardonnay"],
    ["부베 라두베 소뮈르", "Bouvet-Ladubay Saumur Brut", "스파클링 · 소뮈르", 12.5, "프랑스", "루아르 소뮈르", "Bouvet-Ladubay", 25000, "Chenin Blanc/Chardonnay"],
  ]);

  /* ── 루아르 · 알자스 · 남프랑스 · 남서부 ── */
  rows("wine", "whiteCrisp", [
    ["도멘 푸르니에 상세르", "Domaine Fournier Sancerre Les Belles Vignes", "화이트 · 상세르", 13, "프랑스", "루아르 상세르", "Fournier Père & Fils", 40000, "Sauvignon Blanc"],
    ["조셉 멜로 상세르", "Joseph Mellot Sancerre La Chatellenie", "화이트 · 상세르", 13, "프랑스", "루아르 상세르", "Joseph Mellot", 40000, "Sauvignon Blanc"],
    ["뤼시앵 크로셰 상세르", "Lucien Crochet Sancerre Le Chêne", "화이트 · 상세르", 13, "프랑스", "루아르 상세르", "Lucien Crochet", 50000, "Sauvignon Blanc"],
    ["앙리 펠레 므느투 살롱", "Henry Pellé Menetou-Salon Morogues", "화이트 · 므느투 살롱", 12.5, "프랑스", "루아르", "Henry Pellé", 35000, "Sauvignon Blanc"],
    ["샤또 드 트라시 푸이 퓌메", "Château de Tracy Pouilly-Fumé", "화이트 · 푸이 퓌메", 13, "프랑스", "루아르 푸이 퓌메", "Château de Tracy", 55000, "Sauvignon Blanc"],
    ["도멘 드 라 페피에르 뮈스카데", "Domaine de la Pépière Muscadet Sèvre et Maine sur Lie", "화이트 · 뮈스카데", 12, "프랑스", "루아르 낭트", "Domaine de la Pépière", 25000, "Melon de Bourgogne"],
    ["소비옹 뮈스카데", "Sauvion Muscadet Sèvre et Maine sur Lie", "화이트 · 뮈스카데", 12, "프랑스", "루아르 낭트", "Sauvion", 18000, "Melon de Bourgogne"],
    ["도멘 샹팔루 부브레", "Domaine Champalou Vouvray", "화이트 · 부브레", 13, "프랑스", "루아르 부브레", "Domaine Champalou", 35000, "Chenin Blanc"],
    ["도멘 데 보마르 사브니에르", "Domaine des Baumard Savennières", "화이트 · 사브니에르", 13.5, "프랑스", "루아르 앙주", "Domaine des Baumard", 50000, "Chenin Blanc"],
    ["휘겔 젠틸", "Hugel Gentil", "화이트 · 알자스 블렌드", 12.5, "프랑스", "알자스", "Hugel", 30000, "Gewürztraminer/Pinot Gris/Riesling/Muscat"],
    ["휘겔 게뷔르츠트라미너 그로시 라에", "Hugel Gewurztraminer Grossi Laüe", "화이트 · 알자스", 14, "프랑스", "알자스", "Hugel", 90000, "Gewürztraminer"],
    ["트림바크 피노 블랑", "Trimbach Pinot Blanc", "화이트 · 알자스", 12.5, "프랑스", "알자스", "Maison Trimbach", 35000, "Pinot Blanc"],
    ["트림바크 퀴베 프레데릭 에밀", "Trimbach Riesling Cuvée Frédéric Emile", "화이트 · 알자스", 13, "프랑스", "알자스", "Maison Trimbach", 120000, "Riesling"],
    ["진트 움브레히트 피노 그리", "Zind-Humbrecht Pinot Gris", "화이트 · 알자스", 13.5, "프랑스", "알자스", "Domaine Zind-Humbrecht", 75000, "Pinot Gris"],
    ["진트 움브레히트 게뷔르츠트라미너", "Zind-Humbrecht Gewurztraminer", "화이트 · 알자스", 13.5, "프랑스", "알자스", "Domaine Zind-Humbrecht", 75000, "Gewürztraminer"],
    ["레옹 바이어 리슬링", "Léon Beyer Riesling", "화이트 · 알자스", 12.5, "프랑스", "알자스", "Léon Beyer", 35000, "Riesling"],
    ["돕프 앤 이리옹 게뷔르츠트라미너", "Dopff & Irion Gewurztraminer", "화이트 · 알자스", 13, "프랑스", "알자스", "Dopff & Irion", 30000, "Gewürztraminer"],
    ["구스타브 로렌츠 리슬링", "Gustave Lorentz Riesling Réserve", "화이트 · 알자스", 12.5, "프랑스", "알자스", "Gustave Lorentz", 30000, "Riesling"],
    ["빌름 게뷔르츠트라미너", "Willm Gewurztraminer Réserve", "화이트 · 알자스", 13, "프랑스", "알자스", "Willm", 25000, "Gewürztraminer"],
    ["알베르 만 피노 그리", "Albert Mann Pinot Gris", "화이트 · 알자스", 13.5, "프랑스", "알자스", "Domaine Albert Mann", 50000, "Pinot Gris"],
    ["조스마이어 리슬링", "Josmeyer Riesling Le Kottabe", "화이트 · 알자스", 12.5, "프랑스", "알자스", "Josmeyer", 50000, "Riesling"],
    ["마르셀 다이스 알자스 블랑", "Marcel Deiss Alsace Blanc", "화이트 · 알자스 블렌드", 13, "프랑스", "알자스", "Domaine Marcel Deiss", 45000, "Riesling/Pinot Gris/Gewürztraminer"],
    ["오르마린 픽풀 드 피네", "Picpoul de Pinet Ormarine", "화이트 · 픽풀 드 피네", 12.5, "프랑스", "랑그독", "Ormarine", 15000, "Picpoul"],
    ["도멘 타리케 클래식", "Domaine du Tariquet Classic", "화이트 · 코트 드 가스코뉴", 10.5, "프랑스", "남서부 가스코뉴", "Domaine du Tariquet", 15000, "Ugni Blanc/Colombard"],
    ["제라르 베르트랑 시갈뤼스 블랑", "Gérard Bertrand Cigalus Blanc", "화이트 · 랑그독", 14, "프랑스", "랑그독 오드", "Gérard Bertrand", 65000, "Chardonnay/Viognier/Sauvignon Blanc"],
    ["제라르 베르트랑 꼬뜨 데 로즈 블랑", "Gérard Bertrand Côte des Roses Blanc", "화이트 · 랑그독", 13, "프랑스", "랑그독", "Gérard Bertrand", 25000, "Chardonnay/Viognier/Sauvignon Blanc"],
    ["제라르 베르트랑 꼬뜨 데 로즈 로제", "Gérard Bertrand Côte des Roses Rosé", "로제 · 랑그독", 13, "프랑스", "랑그독", "Gérard Bertrand", 25000, "Grenache/Cinsault/Syrah"],
    ["샤또 생트 로셀린 로제", "Château Sainte Roseline Cuvée Lampe de Méduse Rosé", "로제 · 프로방스 크뤼 클라세", 13, "프랑스", "프로방스", "Château Sainte Roseline", 45000, "Grenache/Cinsault/Syrah"],
    ["미뉘티 로즈 에 오르", "Château Minuty Rose et Or", "로제 · 프로방스", 13, "프랑스", "프로방스", "Château Minuty", 70000, "Grenache/Tibouren"],
    ["바이 오트 로제", "BY.OTT Rosé", "로제 · 프로방스", 13, "프랑스", "프로방스", "Domaines Ott", 45000, "Grenache/Cinsault/Syrah"],
    ["미라보 퓨어 로제", "Mirabeau Pure Rosé", "로제 · 프로방스", 12.5, "프랑스", "프로방스", "Maison Mirabeau", 35000, "Grenache/Syrah/Cinsault"],
    ["AIX 로제", "AIX Rosé", "로제 · 프로방스", 13, "프랑스", "프로방스 엑상프로방스", "Maison Saint Aix", 35000, "Grenache/Syrah/Cinsault"],
    ["샤또 드 베른 로제", "Château de Berne Inspiration Rosé", "로제 · 프로방스", 13, "프랑스", "프로방스", "Château de Berne", 30000, "Grenache/Cinsault"],
    ["샤또 라 코스트 로제", "Château La Coste Rosé d'Une Nuit", "로제 · 프로방스", 13, "프랑스", "프로방스", "Château La Coste", 40000, "Grenache/Cinsault/Syrah"],
  ]);
  rows("wine", "redFull", [
    ["샤또 몽튀스", "Château Montus Madiran", "레드 · 마디랑", 14.5, "프랑스", "남서부 마디랑", "Alain Brumont", 60000, "Tannat"],
    ["샤또 뒤 세드르 카오르", "Château du Cèdre Cahors", "레드 · 카오르", 14, "프랑스", "남서부 카오르", "Château du Cèdre", 40000, "Malbec"],
    ["샤또 드 오트 세르 카오르", "Château de Haute-Serre Cahors", "레드 · 카오르", 14, "프랑스", "남서부 카오르", "Georges Vigouroux", 35000, "Malbec"],
    ["제라르 베르트랑 오트 테르 드 타우타벨", "Gérard Bertrand Tautavel Grand Terroir", "레드 · 루시용", 14.5, "프랑스", "루시용", "Gérard Bertrand", 30000, "Grenache/Syrah/Carignan"],
    ["제라르 베르트랑 코르비에르 부트낙", "Gérard Bertrand Corbières-Boutenac Grand Terroir", "레드 · 코르비에르", 14.5, "프랑스", "랑그독 코르비에르", "Gérard Bertrand", 30000, "Carignan/Syrah/Grenache"],
    ["샤또 드 라스투르 코르비에르", "Château de Lastours Corbières", "레드 · 코르비에르", 14, "프랑스", "랑그독 코르비에르", "Château de Lastours", 25000, "Carignan/Grenache/Syrah"],
    ["샤또 생트 윌랄리 미네르부아 라 리비니에르", "Château Sainte Eulalie Minervois La Livinière", "레드 · 미네르부아", 14, "프랑스", "랑그독 미네르부아", "Château Sainte Eulalie", 30000, "Syrah/Grenache/Carignan"],
    ["샤를 졸리 시농", "Charles Joguet Chinon Cuvée Terroir", "레드 · 시농", 12.5, "프랑스", "루아르 시농", "Domaine Charles Joguet", 35000, "Cabernet Franc", "pinot"],
    ["베르나르 보드리 시농", "Bernard Baudry Chinon Les Granges", "레드 · 시농", 12.5, "프랑스", "루아르 시농", "Domaine Bernard Baudry", 40000, "Cabernet Franc", "pinot"],
    ["휘겔 피노 누아", "Hugel Pinot Noir Classic", "레드 · 알자스", 12.5, "프랑스", "알자스", "Hugel", 40000, "Pinot Noir", "pinot"],
  ]);
})();
