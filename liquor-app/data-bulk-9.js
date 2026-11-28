/* 술이 먼저야 대량 DB (9) — 와인 500 · 사케 200 · 위스키 100 · 꼬냑/브랜디 100 · 중국술 100 추가 (사용자 요청)
 * 이미 수록된 술은 BULK.add 가 영문명으로 걸러 건너뛴다. 도수는 대표값, 참고가(₩)는 국내 시판 근사치.
 * P(): 생산자 한 곳의 여러 퀴베를 한 번에 — [한글 퀴베, 영문 퀴베, 스타일, 도수, 참고가, 원료, 프리셋?, 산지?]
 */
(() => {
  const { rows } = window.BULK;
  const P = (cat, preset, pk, pe, country, region, producer, list) =>
    rows(cat, preset, list.map(([k, e, style, abv, krw, ing, pr, reg]) => [`${pk} ${k}`.trim(), `${pe} ${e}`.trim(), style, abv, country, reg || region, producer, krw, ing, pr]));
  const F = "프랑스", I = "이탈리아", E = "스페인", PT = "포르투갈", US = "미국", DE = "독일", AT = "오스트리아";
  const BDX = "Cabernet Sauvignon/Merlot/Cabernet Franc", RB = "Merlot/Cabernet Franc", LB = "Cabernet Sauvignon/Merlot";
  const PN = "Pinot Noir", CH = "Chardonnay", SB = "Sauvignon Blanc", RI = "Riesling", SY = "Syrah", CS = "Cabernet Sauvignon";
  const CHAMP = "Chardonnay/Pinot Noir/Pinot Meunier", NEB = "Nebbiolo", SAN = "Sangiovese", TEM = "Tempranillo", GSM = "Grenache/Syrah/Mourvèdre";

  /* ═════════ 와인 ═════════ */
  // ── 샹파뉴
  P("wine", "bubbly", "볼랭저", "Bollinger", F, "샹파뉴 아이", "Bollinger", [
    ["스페셜 퀴베", "Special Cuvée", "스파클링 · 샴페인", 12, 90000, CHAMP], ["로제", "Rosé", "스파클링 · 로제 샴페인", 12, 120000, CHAMP],
    ["라 그랑드 아네", "La Grande Année", "스파클링 · 빈티지 샴페인", 12, 250000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "폴 로저", "Pol Roger", F, "샹파뉴 에페르네", "Pol Roger", [
    ["브뤼 레제르브", "Brut Réserve", "스파클링 · 샴페인", 12.5, 80000, CHAMP], ["블랑 드 블랑 빈티지", "Blanc de Blancs Vintage", "스파클링 · 블랑 드 블랑", 12.5, 180000, CH],
    ["브뤼 빈티지", "Brut Vintage", "스파클링 · 빈티지 샴페인", 12.5, 150000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "루이 로드레", "Louis Roederer", F, "샹파뉴 랭스", "Louis Roederer", [
    ["콜렉시옹 243", "Collection 243", "스파클링 · 샴페인", 12.5, 90000, CHAMP], ["블랑 드 블랑 빈티지", "Blanc de Blancs Vintage", "스파클링 · 블랑 드 블랑", 12, 180000, CH],
    ["크리스탈 로제", "Cristal Rosé", "스파클링 · 프레스티지 로제", 12, 1200000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "샤를 하이직", "Charles Heidsieck", F, "샹파뉴 랭스", "Charles Heidsieck", [
    ["로제 레제르브", "Rosé Réserve", "스파클링 · 로제 샴페인", 12, 110000, CHAMP], ["브뤼 밀레짐", "Brut Millésimé", "스파클링 · 빈티지 샴페인", 12, 160000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "파이퍼 하이직", "Piper-Heidsieck", F, "샹파뉴 랭스", "Piper-Heidsieck", [
    ["퀴베 브뤼", "Cuvée Brut", "스파클링 · 샴페인", 12, 60000, CHAMP], ["에상시엘 엑스트라 브뤼", "Essentiel Extra Brut", "스파클링 · 샴페인", 12, 80000, CHAMP]]);
  P("wine", "bubbly", "테탱제", "Taittinger", F, "샹파뉴 랭스", "Taittinger", [
    ["프렐뤼드 그랑 크뤼", "Prélude Grands Crus", "스파클링 · 그랑 크뤼", 12.5, 120000, "Chardonnay/Pinot Noir"], ["프레스티지 로제", "Prestige Rosé", "스파클링 · 로제 샴페인", 12, 110000, CHAMP],
    ["콩트 드 샹파뉴 로제", "Comtes de Champagne Rosé", "스파클링 · 프레스티지 로제", 12, 450000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "뵈브 클리코", "Veuve Clicquot", F, "샹파뉴 랭스", "Veuve Clicquot", [
    ["엑스트라 브뤼 엑스트라 올드", "Extra Brut Extra Old", "스파클링 · 샴페인", 12, 120000, CHAMP], ["라 그랑 담 로제", "La Grande Dame Rosé", "스파클링 · 프레스티지 로제", 12.5, 500000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "모엣 샹동", "Moët & Chandon", F, "샹파뉴 에페르네", "Moët & Chandon", [
    ["넥타르 앵페리알", "Nectar Impérial", "스파클링 · 드미 섹", 12, 70000, CHAMP], ["앵페리알 로제", "Rosé Impérial", "스파클링 · 로제 샴페인", 12, 80000, CHAMP]]);
  P("wine", "bubbly", "돔 페리뇽", "Dom Pérignon", F, "샹파뉴 에페르네", "Moët & Chandon", [
    ["로제", "Rosé Vintage", "스파클링 · 프레스티지 로제", 12.5, 900000, "Pinot Noir/Chardonnay"], ["P2", "P2 Plénitude Brut", "스파클링 · 프레스티지 (장기 숙성)", 12.5, 1000000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "로랑 페리에", "Laurent-Perrier", F, "샹파뉴 투르 쉬르 마른", "Laurent-Perrier", [
    ["라 퀴베", "La Cuvée", "스파클링 · 샴페인", 12, 70000, CHAMP], ["울트라 브뤼", "Ultra Brut", "스파클링 · 브뤼 나튀르", 12, 100000, "Chardonnay/Pinot Noir"],
    ["그랑 시에클", "Grand Siècle", "스파클링 · 프레스티지 퀴베", 12, 350000, "Chardonnay/Pinot Noir"]]);
  P("wine", "bubbly", "빌카르 살몽", "Billecart-Salmon", F, "샹파뉴 마뢰이 쉬르 아이", "Billecart-Salmon", [
    ["브뤼 레제르브", "Brut Réserve", "스파클링 · 샴페인", 12, 90000, CHAMP], ["블랑 드 블랑 그랑 크뤼", "Blanc de Blancs Grand Cru", "스파클링 · 블랑 드 블랑", 12, 180000, CH],
    ["퀴베 니콜라 프랑수아", "Cuvée Nicolas François", "스파클링 · 프레스티지 퀴베", 12, 300000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "크룩", "Krug", F, "샹파뉴 랭스", "Krug", [["클로 뒤 메닐", "Clos du Mesnil", "스파클링 · 싱글 빈야드 블랑 드 블랑", 12, 2500000, CH]]);
  P("wine", "bubbly", "뤼나르", "Ruinart", F, "샹파뉴 랭스", "Ruinart", [
    ["R 드 뤼나르 브뤼", "R de Ruinart Brut", "스파클링 · 샴페인", 12, 90000, CHAMP], ["돔 뤼나르 블랑 드 블랑", "Dom Ruinart Blanc de Blancs", "스파클링 · 프레스티지 블랑 드 블랑", 12.5, 400000, CH]]);
  P("wine", "bubbly", "자크송", "Jacquesson", F, "샹파뉴 디지", "Jacquesson", [["디지 코르네 보트레", "Dizy Corne Bautray", "스파클링 · 싱글 빈야드", 12.5, 300000, CH]]);
  P("wine", "bubbly", "아그라파르 에 피스", "Agrapart & Fils", F, "샹파뉴 아비즈", "Agrapart & Fils", [
    ["7 크뤼", "7 Crus Brut", "스파클링 · 블랑 드 블랑", 12, 90000, CH], ["미네랄 엑스트라 브뤼", "Minéral Extra Brut Grand Cru", "스파클링 · 블랑 드 블랑 그랑 크뤼", 12, 180000, CH]]);
  P("wine", "bubbly", "울리스 콜랭", "Ulysse Collin", F, "샹파뉴 코트 드 세잔", "Ulysse Collin", [["레 피에리에르", "Les Pierrières Blanc de Blancs", "스파클링 · 싱글 빈야드 블랑 드 블랑", 12.5, 350000, CH]]);
  P("wine", "bubbly", "베레슈 에 피스", "Bérêche et Fils", F, "샹파뉴 몽타뉴 드 랭스", "Bérêche et Fils", [["브뤼 레제르브", "Brut Réserve", "스파클링 · 샴페인", 12, 100000, CHAMP]]);
  P("wine", "bubbly", "샤르토뉴 타이예", "Chartogne-Taillet", F, "샹파뉴 메리페르", "Chartogne-Taillet", [["생트 안", "Sainte Anne Brut", "스파클링 · 샴페인", 12, 90000, "Pinot Noir/Chardonnay"]]);
  P("wine", "bubbly", "빌마르 에 시", "Vilmart & Cie", F, "샹파뉴 릴리 라 몽타뉴", "Vilmart & Cie", [["그랑드 레제르브", "Grande Réserve 1er Cru", "스파클링 · 1er Cru", 12.5, 100000, "Pinot Noir/Chardonnay"],
    ["쾨르 드 퀴베", "Coeur de Cuvée", "스파클링 · 프레스티지 퀴베", 12.5, 250000, "Chardonnay/Pinot Noir"]]);

  // ── 루아르 · 알자스 · 쥐라 · 사부아 · 보졸레
  P("wine", "whiteCrisp", "도멘 파스칼 코타", "Domaine Pascal Cotat", F, "루아르 상세르", "Domaine Pascal Cotat", [["상세르 라 그랑드 코트", "Sancerre La Grande Côte", "화이트 · 상세르", 13, 120000, SB]]);
  P("wine", "whiteCrisp", "프랑수아 코타", "François Cotat", F, "루아르 상세르", "Domaine François Cotat", [["상세르 레 몽 다네", "Sancerre Les Monts Damnés", "화이트 · 상세르", 13, 120000, SB]]);
  P("wine", "whiteCrisp", "도멘 바슈롱", "Domaine Vacheron", F, "루아르 상세르", "Domaine Vacheron", [["상세르 블랑", "Sancerre Blanc", "화이트 · 상세르", 13, 60000, SB],
    ["상세르 레 로망", "Sancerre Les Romains", "화이트 · 상세르", 13, 100000, SB]]);
  P("wine", "whiteCrisp", "알퐁스 멜로", "Alphonse Mellot", F, "루아르 상세르", "Domaine Alphonse Mellot", [["상세르 라 무시에르", "Sancerre La Moussière", "화이트 · 상세르", 13, 60000, SB],
    ["상세르 제네라시옹 XIX", "Sancerre Génération XIX", "화이트 · 상세르", 13.5, 150000, SB]]);
  P("wine", "whiteCrisp", "도멘 프랑수아 시데느", "Domaine François Chidaine", F, "루아르 몽루이", "Domaine François Chidaine", [["몽루이 레 부르네", "Montlouis-sur-Loire Les Bournais", "화이트 · 몽루이 쉬르 루아르", 13, 60000, "Chenin Blanc"]]);
  P("wine", "whiteCrisp", "도멘 데 로셰 뇌브", "Domaine des Roches Neuves", F, "루아르 소뮈르", "Thierry Germain", [["소뮈르 블랑 앵솔리트", "Saumur Blanc L'Insolite", "화이트 · 소뮈르", 13, 70000, "Chenin Blanc"]]);
  P("wine", "whiteCrisp", "도멘 드 라 페피에르", "Domaine de la Pépière", F, "루아르 뮈스카데", "Domaine de la Pépière", [["뮈스카데 세브르 에 멘 클로 데 브리오", "Muscadet Sèvre et Maine Clos des Briords", "화이트 · 뮈스카데", 12, 30000, "Melon de Bourgogne"]]);
  P("wine", "redMed", "베르나르 보드리", "Bernard Baudry", F, "루아르 시농", "Domaine Bernard Baudry", [["시농 레 그레조", "Chinon Les Grézeaux", "레드 · 시농", 13, 50000, "Cabernet Franc"]]);
  P("wine", "redMed", "필리프 알리에", "Philippe Alliet", F, "루아르 시농", "Domaine Philippe Alliet", [["시농 비에유 비뉴", "Chinon Vieilles Vignes", "레드 · 시농", 13, 50000, "Cabernet Franc"]]);
  P("wine", "whiteCrisp", "트림바크", "Trimbach", F, "알자스", "Maison Trimbach", [["퀴베 프레데릭 에밀", "Riesling Cuvée Frédéric Emile", "화이트 · 알자스 리슬링", 13, 120000, RI],
    ["피노 그리 레제르브", "Pinot Gris Réserve", "화이트 · 알자스 피노 그리", 13.5, 50000, "Pinot Gris"]]);
  P("wine", "whiteCrisp", "위겔", "Hugel", F, "알자스", "Famille Hugel", [["리슬링 에스테이트", "Riesling Estate", "화이트 · 알자스 리슬링", 12.5, 50000, RI]]);
  P("wine", "whiteCrisp", "알베르 만", "Albert Mann", F, "알자스", "Domaine Albert Mann", [["리슬링 슐로스베르크 그랑 크뤼", "Riesling Schlossberg Grand Cru", "화이트 · 알자스 그랑 크뤼", 13, 90000, RI]]);
  P("wine", "whiteCrisp", "도멘 오스테르타그", "Domaine Ostertag", F, "알자스", "Domaine Ostertag", [["리슬링 뮈엔슈베르크 그랑 크뤼", "Riesling Muenchberg Grand Cru", "화이트 · 알자스 그랑 크뤼", 13, 120000, RI]]);
  P("wine", "whiteCrisp", "도멘 슐룸베르제", "Domaines Schlumberger", F, "알자스", "Domaines Schlumberger", [["게뷔르츠트라미너 케슬러 그랑 크뤼", "Gewurztraminer Kessler Grand Cru", "화이트 · 알자스 그랑 크뤼", 14, 70000, "Gewurztraminer"]]);
  P("wine", "whiteCrisp", "장 프랑수아 가네바", "Jean-François Ganevat", F, "쥐라", "Domaine Ganevat", [["코트 뒤 쥐라 레 샬라스", "Côtes du Jura Les Chalasses", "화이트 · 쥐라", 13, 150000, CH]]);
  P("wine", "whiteCrisp", "도멘 티소", "Domaine André et Mireille Tissot", F, "쥐라 아르부아", "Domaine Tissot", [["아르부아 사바냥", "Arbois Savagnin", "화이트 · 쥐라 사바냥", 13.5, 80000, "Savagnin"],
    ["크레망 뒤 쥐라 BBF", "Crémant du Jura BBF", "스파클링 · 크레망 뒤 쥐라", 12, 50000, CH, "bubbly"]]);
  P("wine", "whiteCrisp", "샤토 샬롱", "Château-Chalon", F, "쥐라 샤토 샬롱", "Jean Macle", [["뱅 존 장 마클", "Vin Jaune Jean Macle", "화이트 · 뱅 존 (산화 숙성)", 14, 150000, "Savagnin"]]);
  P("wine", "whiteCrisp", "도멘 데 자르두아지에르", "Domaine des Ardoisières", F, "사부아", "Domaine des Ardoisières", [["아르질", "Argile Blanc", "화이트 · 사부아", 12, 60000, "Jacquère/Chardonnay/Mondeuse Blanche"]]);
  P("wine", "redMed", "도멘 장 폴 테브네", "Domaine Jean-Paul Thévenet", F, "보졸레 모르공", "Domaine Jean-Paul Thévenet", [["모르공 비에유 비뉴", "Morgon Vieilles Vignes", "레드 · 보졸레 크뤼", 13, 50000, "Gamay"]]);
  P("wine", "redMed", "기 브르통", "Guy Breton", F, "보졸레 모르공", "Domaine Guy Breton", [["모르공 비에유 비뉴", "Morgon Vieilles Vignes", "레드 · 보졸레 크뤼", 13, 55000, "Gamay"]]);
  P("wine", "redMed", "샤토 티뱅", "Château Thivin", F, "보졸레 코트 드 브루이", "Château Thivin", [["코트 드 브루이 레 셉트 비뉴", "Côte de Brouilly Les Sept Vignes", "레드 · 보졸레 크뤼", 13, 40000, "Gamay"]]);
  P("wine", "redMed", "쥘리앙 쉬니에", "Julien Sunier", F, "보졸레 플뢰리", "Julien Sunier", [["플뢰리", "Fleurie", "레드 · 보졸레 크뤼", 13, 50000, "Gamay"]]);

  // ── 부르고뉴
  P("wine", "pinot", "메종 루이 자도", "Maison Louis Jadot", F, "부르고뉴", "Maison Louis Jadot", [
    ["쥐브레 샹베르탱 클로 생 자크", "Gevrey-Chambertin 1er Cru Clos Saint-Jacques", "레드 · 쥐브레 샹베르탱 1er Cru", 13.5, 300000, PN, "pinot", "부르고뉴 쥐브레 샹베르탱"],
    ["샹베르탱 클로 드 베즈", "Chambertin-Clos de Bèze Grand Cru", "레드 · 그랑 크뤼", 13.5, 500000, PN, "pinot", "부르고뉴 쥐브레 샹베르탱"],
    ["뮈지니", "Musigny Grand Cru", "레드 · 그랑 크뤼", 13.5, 900000, PN, "pinot", "부르고뉴 샹볼 뮈지니"],
    ["슈발리에 몽라셰 레 드무아젤", "Chevalier-Montrachet Les Demoiselles", "화이트 · 그랑 크뤼", 13.5, 900000, CH, "whiteCrisp", "부르고뉴 퓔리니 몽라셰"]]);
  P("wine", "pinot", "조셉 드루앵", "Joseph Drouhin", F, "부르고뉴", "Maison Joseph Drouhin", [
    ["그랑 에셰조", "Grands-Échezeaux Grand Cru", "레드 · 그랑 크뤼", 13.5, 500000, PN, "pinot", "부르고뉴 본 로마네"],
    ["샹볼 뮈지니 1er 크뤼", "Chambolle-Musigny 1er Cru", "레드 · 샹볼 뮈지니 1er Cru", 13, 180000, PN, "pinot", "부르고뉴 샹볼 뮈지니"],
    ["마르키 드 라기슈 몽라셰", "Montrachet Marquis de Laguiche", "화이트 · 그랑 크뤼", 13.5, 1500000, CH, "whiteCrisp", "부르고뉴 퓔리니 몽라셰"]]);
  P("wine", "pinot", "부샤 페르 에 피스", "Bouchard Père & Fils", F, "부르고뉴", "Bouchard Père & Fils", [
    ["본 1er 크뤼 마르코니", "Beaune 1er Cru Marconnets", "레드 · 본 1er Cru", 13, 100000, PN, "pinot", "부르고뉴 본"],
    ["코르통 샤를마뉴", "Corton-Charlemagne Grand Cru", "화이트 · 그랑 크뤼", 13.5, 350000, CH, "whiteCrisp", "부르고뉴 알록스 코르통"],
    ["뫼르소 주느브리에르", "Meursault 1er Cru Genevrières", "화이트 · 뫼르소 1er Cru", 13.5, 200000, CH, "whiteCrisp", "부르고뉴 뫼르소"]]);
  P("wine", "pinot", "메종 루이 라투르", "Maison Louis Latour", F, "부르고뉴", "Maison Louis Latour", [
    ["샤토 코르통 그랑세", "Château Corton Grancey Grand Cru", "레드 · 그랑 크뤼", 13.5, 200000, PN, "pinot", "부르고뉴 알록스 코르통"],
    ["알록스 코르통", "Aloxe-Corton", "레드 · 빌라주", 13, 90000, PN, "pinot", "부르고뉴 알록스 코르통"],
    ["퓔리니 몽라셰", "Puligny-Montrachet", "화이트 · 빌라주", 13, 120000, CH, "whiteCrisp", "부르고뉴 퓔리니 몽라셰"]]);
  P("wine", "pinot", "도멘 페블리", "Domaine Faiveley", F, "부르고뉴", "Domaine Faiveley", [
    ["샹베르탱 클로 드 베즈 레 우브레 로댕", "Chambertin-Clos de Bèze Les Ouvrées Rodin", "레드 · 그랑 크뤼", 13.5, 700000, PN, "pinot", "부르고뉴 쥐브레 샹베르탱"],
    ["뉘 생 조르주", "Nuits-Saint-Georges", "레드 · 빌라주", 13, 90000, PN, "pinot", "부르고뉴 뉘 생 조르주"]]);
  P("wine", "pinot", "알베르 비쇼", "Albert Bichot", F, "부르고뉴", "Albert Bichot", [
    ["클로 프랑탱 리쉬부르", "Domaine du Clos Frantin Richebourg Grand Cru", "레드 · 그랑 크뤼", 13.5, 800000, PN, "pinot", "부르고뉴 본 로마네"],
    ["샤블리 그랑 크뤼 레 클로 도멘 롱 데파키", "Domaine Long-Depaquit Chablis Grand Cru Les Clos", "화이트 · 샤블리 그랑 크뤼", 13, 150000, CH, "whiteCrisp", "부르고뉴 샤블리"]]);
  P("wine", "pinot", "도멘 메오 카뮈제", "Domaine Méo-Camuzet", F, "부르고뉴", "Domaine Méo-Camuzet", [
    ["본 로마네 1er 크뤼 레 쇼", "Vosne-Romanée 1er Cru Les Chaumes", "레드 · 본 로마네 1er Cru", 13, 450000, PN, "pinot", "부르고뉴 본 로마네"],
    ["코르통 클로 로녜", "Corton Clos Rognet Grand Cru", "레드 · 그랑 크뤼", 13.5, 350000, PN, "pinot", "부르고뉴 알록스 코르통"]]);
  P("wine", "pinot", "도멘 아르누 라쇼", "Domaine Arnoux-Lachaux", F, "부르고뉴 본 로마네", "Domaine Arnoux-Lachaux", [["본 로마네", "Vosne-Romanée", "레드 · 빌라주", 13, 400000, PN]]);
  P("wine", "pinot", "도멘 엠마뉘엘 루제", "Domaine Emmanuel Rouget", F, "부르고뉴 본 로마네", "Domaine Emmanuel Rouget", [["에셰조", "Échezeaux Grand Cru", "레드 · 그랑 크뤼", 13.5, 1500000, PN]]);
  P("wine", "pinot", "도멘 드니 모르테", "Domaine Denis Mortet", F, "부르고뉴 쥐브레 샹베르탱", "Domaine Denis Mortet", [["쥐브레 샹베르탱 메 셍크 테루아", "Gevrey-Chambertin Mes Cinq Terroirs", "레드 · 빌라주", 13.5, 250000, PN]]);
  P("wine", "pinot", "도멘 푸리에", "Domaine Fourrier", F, "부르고뉴 쥐브레 샹베르탱", "Domaine Fourrier", [["쥐브레 샹베르탱 비에유 비뉴", "Gevrey-Chambertin Vieilles Vignes", "레드 · 빌라주", 13, 250000, PN]]);
  P("wine", "pinot", "도멘 클로드 뒤가", "Domaine Claude Dugat", F, "부르고뉴 쥐브레 샹베르탱", "Domaine Claude Dugat", [["쥐브레 샹베르탱", "Gevrey-Chambertin", "레드 · 빌라주", 13, 300000, PN]]);
  P("wine", "pinot", "도멘 트라페", "Domaine Trapet Père et Fils", F, "부르고뉴 쥐브레 샹베르탱", "Domaine Trapet", [["쥐브레 샹베르탱 오스트레아", "Gevrey-Chambertin Ostrea", "레드 · 빌라주", 13, 150000, PN]]);
  P("wine", "pinot", "도멘 로베르 그로피에", "Domaine Robert Groffier", F, "부르고뉴 모레 생드니", "Domaine Robert Groffier", [["샹볼 뮈지니 레 장티앙", "Chambolle-Musigny 1er Cru Les Sentiers", "레드 · 샹볼 뮈지니 1er Cru", 13, 300000, PN]]);
  P("wine", "pinot", "도멘 기슬랭 바르테", "Domaine Ghislaine Barthod", F, "부르고뉴 샹볼 뮈지니", "Domaine Ghislaine Barthod", [["샹볼 뮈지니", "Chambolle-Musigny", "레드 · 빌라주", 13, 200000, PN]]);
  P("wine", "pinot", "도멘 자크 프리외르", "Domaine Jacques Prieur", F, "부르고뉴 뫼르소", "Domaine Jacques Prieur", [["볼네 클로 데 상트노", "Volnay 1er Cru Clos des Santenots", "레드 · 볼네 1er Cru", 13, 200000, PN],
    ["뫼르소 클로 드 마즈레", "Meursault Clos de Mazeray", "화이트 · 빌라주", 13.5, 150000, CH, "whiteCrisp"]]);
  P("wine", "pinot", "도멘 콩트 아르망", "Domaine du Comte Armand", F, "부르고뉴 포마르", "Domaine du Comte Armand", [["포마르 클로 데 제프노", "Pommard 1er Cru Clos des Epeneaux", "레드 · 포마르 1er Cru 모노폴", 13, 250000, PN]]);
  P("wine", "pinot", "도멘 드 쿠르세", "Domaine de Courcel", F, "부르고뉴 포마르", "Domaine de Courcel", [["포마르 그랑 클로 데 제프노", "Pommard 1er Cru Grand Clos des Epenots", "레드 · 포마르 1er Cru", 13, 200000, PN]]);
  P("wine", "pinot", "도멘 시몽 비즈", "Domaine Simon Bize", F, "부르고뉴 사비니 레 본", "Domaine Simon Bize", [["사비니 레 본 1er 크뤼 오 베르줄레스", "Savigny-lès-Beaune 1er Cru Aux Vergelesses", "레드 · 사비니 1er Cru", 13, 100000, PN]]);
  P("wine", "whiteCrisp", "도멘 장 마르크 브로카르", "Domaine Jean-Marc Brocard", F, "부르고뉴 샤블리", "Domaine Jean-Marc Brocard", [["샤블리 1er 크뤼 몽맹", "Chablis 1er Cru Montmains", "화이트 · 샤블리 1er Cru", 12.5, 60000, CH]]);
  P("wine", "whiteCrisp", "도멘 윌리엄 페브르", "Domaine William Fèvre", F, "부르고뉴 샤블리", "Domaine William Fèvre", [["샤블리 1er 크뤼 몽테 드 토네르", "Chablis 1er Cru Montée de Tonnerre", "화이트 · 샤블리 1er Cru", 13, 90000, CH],
    ["샤블리 그랑 크뤼 부그로 코트 부게로", "Chablis Grand Cru Bougros Côte Bouguerots", "화이트 · 샤블리 그랑 크뤼", 13, 150000, CH]]);
  P("wine", "whiteCrisp", "도멘 크리스티앙 모로", "Domaine Christian Moreau", F, "부르고뉴 샤블리", "Domaine Christian Moreau Père et Fils", [["샤블리 그랑 크뤼 레 클로", "Chablis Grand Cru Les Clos", "화이트 · 샤블리 그랑 크뤼", 13, 150000, CH]]);
  P("wine", "whiteCrisp", "도멘 파트리크 피즈", "Domaine Patrick Piuze", F, "부르고뉴 샤블리", "Patrick Piuze", [["샤블리 테루아 드 쿠르지", "Chablis Terroir de Courgis", "화이트 · 샤블리", 12.5, 50000, CH]]);
  P("wine", "whiteCrisp", "도멘 피에르 이브 콜랭 모레", "Domaine Pierre-Yves Colin-Morey", F, "부르고뉴 샤샤뉴 몽라셰", "Domaine Pierre-Yves Colin-Morey", [["생토뱅 1er 크뤼 앙 레미이", "Saint-Aubin 1er Cru En Remilly", "화이트 · 생토뱅 1er Cru", 13.5, 150000, CH],
    ["샤샤뉴 몽라셰 1er 크뤼 레 카이유레", "Chassagne-Montrachet 1er Cru Les Caillerets", "화이트 · 샤샤뉴 몽라셰 1er Cru", 13.5, 300000, CH]]);
  P("wine", "whiteCrisp", "도멘 르플레브", "Domaine Leflaive", F, "부르고뉴 퓔리니 몽라셰", "Domaine Leflaive", [["퓔리니 몽라셰 1er 크뤼 클라바용", "Puligny-Montrachet 1er Cru Clavoillon", "화이트 · 퓔리니 몽라셰 1er Cru", 13, 400000, CH],
    ["마콩 베르제", "Mâcon-Verzé", "화이트 · 마콩", 13, 70000, CH]]);
  P("wine", "whiteCrisp", "도멘 발레트", "Domaine Valette", F, "부르고뉴 마코네", "Domaine Valette", [
    ["푸이 퓌세 비에유 비뉴", "Pouilly-Fuissé Vieilles Vignes", "화이트 · 푸이 퓌세", 13.5, 70000, CH]]);
  P("wine", "whiteCrisp", "도멘 기요 브루", "Domaine Guillot-Broux", F, "부르고뉴 마코네", "Domaine Guillot-Broux", [["마콩 크뤼지유", "Mâcon-Cruzille", "화이트 · 마콩", 13, 50000, CH]]);
  P("wine", "whiteCrisp", "도멘 데 콩트 라퐁", "Domaine des Comtes Lafon", F, "부르고뉴 마코네", "Héritiers du Comte Lafon", [["마콩 밀리 라마르탱", "Mâcon-Milly-Lamartine", "화이트 · 마콩", 13, 60000, CH]]);

  // ── 론 · 프로방스 · 랑그도크 · 남서부 · 코르시카
  P("wine", "redFull", "E. 기갈", "E. Guigal", F, "론", "E. Guigal", [
    ["샤토 당퓌 코트 로티", "Château d'Ampuis Côte-Rôtie", "레드 · 코트 로티", 13.5, 200000, "Syrah/Viognier", "redFull", "론 코트 로티"],
    ["에르미타주 엑스 보토", "Ermitage Ex-Voto Rouge", "레드 · 에르미타주", 14, 400000, SY, "redFull", "론 에르미타주"],
    ["콩드리외 라 도리안", "Condrieu La Doriane", "화이트 · 콩드리외", 14, 150000, "Viognier", "whiteCrisp", "론 콩드리외"],
    ["지공다스", "Gigondas", "레드 · 지공다스", 14.5, 50000, GSM, "redFull", "론 지공다스"],
    ["타벨 로제", "Tavel Rosé", "로제 · 타벨", 14, 35000, "Grenache/Cinsault", "whiteCrisp", "론 타벨"]]);
  P("wine", "redFull", "M. 샤푸티에", "M. Chapoutier", F, "론", "M. Chapoutier", [
    ["에르미타주 르 메알", "Ermitage Le Méal", "레드 · 에르미타주", 14, 400000, SY, "redFull", "론 에르미타주"],
    ["크로즈 에르미타주 레 메존 블랑슈", "Crozes-Hermitage Les Meysonniers", "레드 · 크로즈 에르미타주", 13.5, 40000, SY, "redFull", "론 크로즈 에르미타주"],
    ["샤토뇌프 뒤 파프 라 베르나르딘", "Châteauneuf-du-Pape La Bernardine", "레드 · 샤토뇌프 뒤 파프", 14.5, 80000, "Grenache/Syrah", "redFull", "론 샤토뇌프 뒤 파프"]]);
  P("wine", "redFull", "폴 자불레 에네", "Paul Jaboulet Aîné", F, "론", "Paul Jaboulet Aîné", [
    ["크로즈 에르미타주 도멘 드 탈라베르", "Crozes-Hermitage Domaine de Thalabert", "레드 · 크로즈 에르미타주", 13.5, 70000, SY, "redFull", "론 크로즈 에르미타주"],
    ["파랄렐 45 루즈", "Parallèle 45 Rouge", "레드 · 코트 뒤 론", 14, 25000, "Grenache/Syrah", "redMed", "론"]]);
  P("wine", "redFull", "도멘 장 루이 샤브", "Domaine Jean-Louis Chave", F, "론", "Domaine Jean-Louis Chave", [
    ["에르미타주 블랑", "Hermitage Blanc", "화이트 · 에르미타주", 14, 500000, "Marsanne/Roussanne", "whiteCrisp", "론 에르미타주"]]);
  P("wine", "redFull", "장 루이 샤브 셀렉시옹", "Jean-Louis Chave Sélection", F, "론", "Jean-Louis Chave Sélection", [["생 조제프 오페뤼스", "Saint-Joseph Offerus", "레드 · 생 조제프", 13, 60000, SY, "redFull", "론 생 조제프"]]);
  P("wine", "redFull", "도멘 장 미셸 제랭", "Domaine Jean-Michel Gerin", F, "론 코트 로티", "Domaine Jean-Michel Gerin", [["코트 로티 샹팽 르 세뇌르", "Côte-Rôtie Champin le Seigneur", "레드 · 코트 로티", 13.5, 100000, "Syrah/Viognier"]]);
  P("wine", "redFull", "도멘 스테판 오지에", "Domaine Stéphane Ogier", F, "론 코트 로티", "Domaine Stéphane Ogier", [["코트 로티 레제르브", "Côte-Rôtie Réserve", "레드 · 코트 로티", 13.5, 150000, SY]]);
  P("wine", "redFull", "도멘 드 라 비에유 쥘리엔", "Domaine de la Vieille Julienne", F, "론 샤토뇌프 뒤 파프", "Domaine de la Vieille Julienne", [["샤토뇌프 뒤 파프 레제르브", "Châteauneuf-du-Pape Réserve", "레드 · 샤토뇌프 뒤 파프", 15, 200000, "Grenache"]]);
  P("wine", "redFull", "샤토 드 라 가르딘", "Château de la Gardine", F, "론 샤토뇌프 뒤 파프", "Famille Brunel", [["샤토뇌프 뒤 파프", "Châteauneuf-du-Pape", "레드 · 샤토뇌프 뒤 파프", 14.5, 70000, GSM]]);
  P("wine", "redFull", "샤토 드 생 코스메", "Château de Saint Cosme", F, "론", "Château de Saint Cosme", [["리틀 제임스 바스켓 프레스 루즈", "Little James' Basket Press Rouge", "레드 · 뱅 드 프랑스", 14, 20000, "Grenache", "redMed"]]);
  P("wine", "redFull", "도멘 드 트레발롱", "Domaine de Trévallon", F, "프로방스 레 보 드 프로방스", "Domaine de Trévallon", [["알피유 루즈", "Alpilles Rouge", "레드 · IGP 알피유", 13.5, 150000, "Cabernet Sauvignon/Syrah"]]);
  P("wine", "whiteCrisp", "미라발", "Miraval", F, "프로방스", "Château Miraval", [["스튜디오 바이 미라발 로제", "Studio by Miraval Rosé", "로제 · 프로방스", 12.5, 30000, "Cinsault/Grenache/Rolle"]]);
  P("wine", "whiteCrisp", "샤토 데스클랑", "Château d'Esclans", F, "프로방스", "Château d'Esclans", [["위스퍼링 엔젤", "Whispering Angel Rosé", "로제 · 코트 드 프로방스", 13, 40000, "Grenache/Cinsault/Rolle"], ["록 엔젤", "Rock Angel Rosé", "로제 · 코트 드 프로방스", 13.5, 60000, "Grenache/Rolle"]]);
  P("wine", "whiteCrisp", "도멘 오트", "Domaines Ott", F, "프로방스", "Domaines Ott", [["바이 오트 로제", "By.Ott Rosé", "로제 · 코트 드 프로방스", 13, 40000, "Grenache/Cinsault/Syrah"], ["샤토 드 셀", "Château de Selle Rosé", "로제 · 코트 드 프로방스", 13, 80000, "Grenache/Cinsault/Syrah"]]);
  P("wine", "redFull", "제라르 베르트랑", "Gérard Bertrand", F, "랑그도크", "Gérard Bertrand", [
    ["클로 도라", "Clos d'Ora", "레드 · 미네르부아 라 리비니에르", 14.5, 200000, "Syrah/Grenache/Mourvèdre/Carignan"],
    ["코트 데 로즈 로제", "Côte des Roses Rosé", "로제 · 랑그도크", 13, 30000, "Grenache/Cinsault/Syrah", "whiteCrisp"]]);
  P("wine", "redFull", "도멘 드 라 그랑주 데 페르", "Domaine de la Grange des Pères", F, "랑그도크 에로", "Domaine de la Grange des Pères", [["블랑", "Blanc", "화이트 · 페이 테로", 14, 400000, "Roussanne/Marsanne/Chardonnay", "whiteCrisp"]]);
  P("wine", "redFull", "도멘 고비", "Domaine Gauby", F, "루시용", "Domaine Gauby", [["문타다 코트 카탈란 루즈", "Muntada Côtes Catalanes Rouge", "레드 · IGP 코트 카탈란", 13.5, 150000, "Syrah/Grenache/Carignan"]]);
  P("wine", "redFull", "샤토 몽튀스", "Château Montus", F, "남서부 마디랑", "Alain Brumont", [["마디랑 루즈", "Madiran", "레드 · 마디랑", 14.5, 40000, "Tannat/Cabernet Sauvignon"]]);
  P("wine", "redFull", "도멘 콩트 아바투치", "Domaine Comte Abbatucci", F, "코르시카", "Domaine Comte Abbatucci", [["퀴베 포스틴 루즈", "Cuvée Faustine Rouge", "레드 · 코르시카", 13, 70000, "Sciaccarellu/Niellucciu"]]);
  P("wine", "redFull", "클로 카나렐리", "Clos Canarelli", F, "코르시카 피가리", "Clos Canarelli", [["코르스 피가리 루즈", "Corse Figari Rouge", "레드 · 코르시카", 13, 80000, "Niellucciu/Sciaccarellu/Syrah"]]);

  // ── 이탈리아
  P("wine", "italian", "가야", "Gaja", I, "피에몬테", "Gaja", [
    ["바르바레스코", "Barbaresco", "레드 · 바르바레스코", 14, 400000, NEB, "italian", "피에몬테 바르바레스코"],
    ["소리 산 로렌초", "Sorì San Lorenzo", "레드 · 랑게 네비올로", 14, 900000, NEB, "italian", "피에몬테 바르바레스코"],
    ["소리 틸딘", "Sorì Tildìn", "레드 · 랑게 네비올로", 14, 900000, NEB, "italian", "피에몬테 바르바레스코"],
    ["콘테이사", "Conteisa", "레드 · 랑게 네비올로", 14.5, 600000, NEB, "italian", "피에몬테 바롤로"],
    ["시토 모레스코", "Sito Moresco", "레드 · 랑게", 14, 90000, "Nebbiolo/Merlot/Cabernet Sauvignon", "italian", "피에몬테 랑게"],
    ["로시 바스", "Rossj-Bass", "화이트 · 랑게 샤르도네", 13.5, 150000, "Chardonnay/Sauvignon Blanc", "whiteCrisp", "피에몬테 랑게"],
    ["피에베 산타 레스티투타 브루넬로", "Pieve Santa Restituta Brunello di Montalcino", "레드 · 브루넬로", 14.5, 150000, SAN, "italian", "토스카나 몬탈치노"]]);
  P("wine", "italian", "자코모 콘테르노", "Giacomo Conterno", I, "피에몬테 바롤로", "Giacomo Conterno", [
    ["바롤로 몬포르티노 리제르바", "Barolo Monfortino Riserva", "레드 · 바롤로 리제르바", 14.5, 1500000, NEB],
    ["바롤로 아리오네", "Barolo Arione", "레드 · 바롤로", 14.5, 450000, NEB],
    ["바르베라 달바 체레타", "Barbera d'Alba Cerretta", "레드 · 바르베라 달바", 14.5, 90000, "Barbera"]]);
  P("wine", "italian", "브루노 지아코사", "Bruno Giacosa", I, "피에몬테", "Bruno Giacosa", [
    ["로에로 아르네이스", "Roero Arneis", "화이트 · 로에로 아르네이스", 13.5, 50000, "Arneis", "whiteCrisp", "피에몬테 로에로"],
    ["네비올로 달바 발마조레", "Nebbiolo d'Alba Valmaggiore", "레드 · 네비올로 달바", 14, 70000, NEB, "italian", "피에몬테 로에로"]]);
  P("wine", "italian", "체레토", "Ceretto", I, "피에몬테", "Ceretto", [
    ["바롤로 브리코 로케", "Barolo Bricco Rocche", "레드 · 바롤로", 14.5, 500000, NEB, "italian", "피에몬테 바롤로"],
    ["바르바레스코 아실리", "Barbaresco Asij", "레드 · 바르바레스코", 14, 90000, NEB, "italian", "피에몬테 바르바레스코"],
    ["블랑게 아르네이스", "Blangè Arneis", "화이트 · 랑게 아르네이스", 12.5, 35000, "Arneis", "whiteCrisp", "피에몬테 랑게"]]);
  P("wine", "italian", "피오 체사레", "Pio Cesare", I, "피에몬테", "Pio Cesare", [
    ["바롤로", "Barolo", "레드 · 바롤로", 14, 100000, NEB, "italian", "피에몬테 바롤로"],
    ["바롤로 오르날라토", "Barolo Ornato", "레드 · 바롤로", 14.5, 180000, NEB, "italian", "피에몬테 바롤로"],
    ["바르바레스코", "Barbaresco", "레드 · 바르바레스코", 14, 90000, NEB, "italian", "피에몬테 바르바레스코"]]);
  P("wine", "italian", "라 스피네타", "La Spinetta", I, "피에몬테", "La Spinetta", [
    ["바르바레스코 갈리나", "Barbaresco Gallina", "레드 · 바르바레스코", 14, 250000, NEB, "italian", "피에몬테 바르바레스코"],
    ["바롤로 캄페", "Barolo Campè", "레드 · 바롤로", 14.5, 250000, NEB, "italian", "피에몬테 바롤로"]]);
  P("wine", "italian", "브라이다", "Braida", I, "피에몬테 아스티", "Braida", [
    ["바르베라 다스티 비친 델 우셀", "Barbera d'Asti Bricco dell'Uccellone", "레드 · 바르베라 다스티", 15, 90000, "Barbera"],
    ["바르베라 다스티 아이 수마", "Barbera d'Asti Ai Suma", "레드 · 바르베라 다스티", 15.5, 120000, "Barbera"]]);
  P("wine", "italian", "로베르토 보에르치오", "Roberto Voerzio", I, "피에몬테 바롤로", "Roberto Voerzio", [["바롤로 체레퀴오", "Barolo Cerequio", "레드 · 바롤로", 14.5, 500000, NEB]]);
  P("wine", "italian", "파올로 스카비노", "Paolo Scavino", I, "피에몬테 바롤로", "Paolo Scavino", [["바롤로 브릭 델 피아스크", "Barolo Bric del Fiasc", "레드 · 바롤로", 14.5, 250000, NEB]]);
  P("wine", "italian", "도메니코 클레리코", "Domenico Clerico", I, "피에몬테 바롤로", "Domenico Clerico", [["바롤로 치아보트 멘틴", "Barolo Ciabot Mentin", "레드 · 바롤로", 14.5, 250000, NEB]]);
  P("wine", "italian", "엘리오 그라소", "Elio Grasso", I, "피에몬테 바롤로", "Elio Grasso", [["바롤로 지네스트라 카사 마테", "Barolo Ginestra Casa Matè", "레드 · 바롤로", 14.5, 200000, NEB]]);
  P("wine", "italian", "카발로토", "Cavallotto", I, "피에몬테 바롤로", "Cavallotto", [["바롤로 브리코 보스키스", "Barolo Bricco Boschis", "레드 · 바롤로", 14.5, 150000, NEB]]);
  P("wine", "italian", "오데로", "Oddero", I, "피에몬테 바롤로", "Oddero Poderi e Cantine", [["바롤로", "Barolo", "레드 · 바롤로", 14, 90000, NEB]]);
  P("wine", "italian", "주세페 마스카렐로", "Giuseppe Mascarello e Figlio", I, "피에몬테 바롤로", "Giuseppe Mascarello e Figlio", [["바롤로 몬프리바토", "Barolo Monprivato", "레드 · 바롤로", 14.5, 500000, NEB]]);
  P("wine", "italian", "안티노리", "Antinori", I, "토스카나", "Marchesi Antinori", [
    ["구아도 알 타소", "Guado al Tasso", "레드 · 볼게리 수페리오레", 14, 180000, "Cabernet Sauvignon/Merlot/Cabernet Franc", "italian", "토스카나 볼게리"],
    ["일 브루치아토", "Il Bruciato", "레드 · 볼게리", 13.5, 40000, "Cabernet Sauvignon/Merlot/Syrah", "italian", "토스카나 볼게리"],
    ["바디아 아 파시냐노 그란 셀레치오네", "Badia a Passignano Chianti Classico Gran Selezione", "레드 · 키안티 클라시코 그란 셀레치오네", 14, 90000, SAN, "italian", "토스카나 키안티"],
    ["펩폴리 키안티 클라시코", "Pèppoli Chianti Classico", "레드 · 키안티 클라시코", 13.5, 35000, SAN, "italian", "토스카나 키안티"],
    ["체르바로 델라 살라", "Cervaro della Sala", "화이트 · 움브리아", 13, 80000, "Chardonnay/Grechetto", "whiteCrisp", "움브리아"]]);
  P("wine", "italian", "테누타 산 구이도", "Tenuta San Guido", I, "토스카나 볼게리", "Tenuta San Guido", [
    ["구이달베르토", "Guidalberto", "레드 · 토스카나 IGT", 14, 80000, "Cabernet Sauvignon/Merlot"], ["레 디페세", "Le Difese", "레드 · 토스카나 IGT", 13.5, 40000, "Cabernet Sauvignon/Sangiovese"]]);
  P("wine", "italian", "테누타 델 오르넬라이아", "Tenuta dell'Ornellaia", I, "토스카나 볼게리", "Tenuta dell'Ornellaia", [["마세토", "Masseto", "레드 · 토스카나 IGT", 14.5, 1500000, "Merlot"]]);
  P("wine", "italian", "프레스코발디", "Frescobaldi", I, "토스카나", "Marchesi Frescobaldi", [
    ["몬테소디", "Montesodi Chianti Rufina", "레드 · 키안티 루피나", 14, 70000, SAN, "italian", "토스카나 루피나"],
    ["니포차노 리제르바", "Nipozzano Chianti Rufina Riserva", "레드 · 키안티 루피나 리제르바", 13.5, 40000, SAN, "italian", "토스카나 루피나"],
    ["루체", "Luce", "레드 · 토스카나 IGT", 14.5, 150000, "Sangiovese/Merlot", "italian", "토스카나 몬탈치노"]]);
  P("wine", "italian", "카스텔로 반피", "Castello Banfi", I, "토스카나 몬탈치노", "Castello Banfi", [["서머스", "SummuS", "레드 · 토스카나 IGT", 14.5, 90000, "Sangiovese/Cabernet Sauvignon/Syrah"]]);
  P("wine", "italian", "카파르초", "Caparzo", I, "토스카나 몬탈치노", "Caparzo", [["브루넬로 디 몬탈치노", "Brunello di Montalcino", "레드 · 브루넬로", 14, 70000, SAN]]);
  P("wine", "italian", "카사노바 디 네리", "Casanova di Neri", I, "토스카나 몬탈치노", "Casanova di Neri", [["브루넬로 테누타 누오바", "Brunello di Montalcino Tenuta Nuova", "레드 · 브루넬로", 14.5, 180000, SAN]]);
  P("wine", "italian", "콜 도르차", "Col d'Orcia", I, "토스카나 몬탈치노", "Col d'Orcia", [["브루넬로 리제르바 포지오 알 비노", "Brunello di Montalcino Riserva Poggio al Vento", "레드 · 브루넬로 리제르바", 14.5, 200000, SAN]]);
  P("wine", "italian", "발디쿠바", "Valdicava", I, "토스카나 몬탈치노", "Valdicava", [["브루넬로 디 몬탈치노", "Brunello di Montalcino", "레드 · 브루넬로", 14.5, 250000, SAN]]);
  P("wine", "italian", "폰토디", "Fontodi", I, "토스카나 키안티", "Fontodi", [["비냐 델 소르보", "Chianti Classico Gran Selezione Vigna del Sorbo", "레드 · 키안티 클라시코 그란 셀레치오네", 14.5, 150000, SAN]]);
  P("wine", "italian", "카스텔로 디 볼파이아", "Castello di Volpaia", I, "토스카나 키안티", "Castello di Volpaia", [["키안티 클라시코 리제르바", "Chianti Classico Riserva", "레드 · 키안티 클라시코 리제르바", 14, 60000, SAN], ["콜타살라", "Coltassala", "레드 · 키안티 클라시코 그란 셀레치오네", 14, 120000, "Sangiovese/Mammolo"]]);
  P("wine", "italian", "산 펠리체", "San Felice", I, "토스카나 키안티", "San Felice", [["비고렐로", "Vigorello", "레드 · 토스카나 IGT", 14, 90000, "Cabernet Sauvignon/Merlot/Pugnitello"]]);
  P("wine", "italian", "테누타 디 비세르노", "Tenuta di Biserno", I, "토스카나 볼게리", "Tenuta di Biserno", [["비세르노", "Biserno", "레드 · 토스카나 IGT", 14.5, 300000, "Cabernet Franc/Merlot/Cabernet Sauvignon/Petit Verdot"]]);
  P("wine", "italian", "투아 리타", "Tua Rita", I, "토스카나 수베레토", "Tua Rita", [["지우스토 디 노트리", "Giusto di Notri", "레드 · 토스카나 IGT", 14.5, 150000, "Cabernet Sauvignon/Merlot/Cabernet Franc"]]);
  P("wine", "italian", "알레그리니", "Allegrini", I, "베네토 발폴리첼라", "Allegrini", [
    ["아마로네 클라시코", "Amarone della Valpolicella Classico", "레드 · 아마로네", 15.5, 100000, "Corvina/Corvinone/Rondinella"],
    ["팔라초 델라 토레", "Palazzo della Torre", "레드 · 베로네제 IGT", 13.5, 35000, "Corvina/Rondinella/Sangiovese"]]);
  P("wine", "italian", "마시", "Masi", I, "베네토 발폴리첼라", "Masi Agricola", [["캄포피오린", "Campofiorin", "레드 · 로소 델 베로네제", 13.5, 30000, "Corvina/Rondinella/Molinara"],
    ["마차노 아마로네 클라시코", "Mazzano Amarone Classico", "레드 · 아마로네", 16, 300000, "Corvina/Rondinella/Molinara"]]);
  P("wine", "italian", "주세페 퀸타렐리", "Giuseppe Quintarelli", I, "베네토 발폴리첼라", "Giuseppe Quintarelli", [["아마로네 클라시코", "Amarone della Valpolicella Classico", "레드 · 아마로네", 16.5, 1000000, "Corvina/Corvinone/Rondinella"]]);
  P("wine", "italian", "제나토", "Zenato", I, "베네토 발폴리첼라", "Zenato", [["아마로네 클라시코", "Amarone della Valpolicella Classico", "레드 · 아마로네", 16.5, 80000, "Corvina/Rondinella/Oseleta"], ["리파소 수페리오레", "Ripassa Valpolicella Superiore", "레드 · 리파소", 14, 40000, "Corvina/Rondinella/Oseleta"]]);
  P("wine", "italian", "베르타니", "Bertani", I, "베네토 발폴리첼라", "Bertani", [["아마로네 클라시코", "Amarone della Valpolicella Classico", "레드 · 아마로네", 15, 250000, "Corvina/Rondinella"]]);
  P("wine", "italian", "산타 마르게리타", "Santa Margherita", I, "베네토·알토 아디제", "Santa Margherita", [["피노 그리지오 발다디제", "Pinot Grigio Valdadige", "화이트 · 피노 그리지오", 12.5, 30000, "Pinot Grigio", "whiteCrisp"]]);
  P("wine", "italian", "알로이스 라게더", "Alois Lageder", I, "알토 아디제", "Alois Lageder", [["뢰벤강 샤르도네", "Löwengang Chardonnay", "화이트 · 알토 아디제", 13, 70000, CH, "whiteCrisp"]]);
  P("wine", "italian", "칸티나 테를라노", "Cantina Terlano", I, "알토 아디제", "Cantina Terlano", [["콰르츠 소비뇽", "Quarz Sauvignon", "화이트 · 알토 아디제", 14, 80000, SB, "whiteCrisp"], ["노바 도무스", "Nova Domus Riserva", "화이트 · 알토 아디제", 14, 80000, "Pinot Bianco/Chardonnay/Sauvignon Blanc", "whiteCrisp"]]);
  P("wine", "italian", "J. 호프슈테터", "J. Hofstätter", I, "알토 아디제", "J. Hofstätter", [["콜벤호프 게뷔르츠트라미너", "Kolbenhof Gewürztraminer", "화이트 · 알토 아디제", 14.5, 60000, "Gewürztraminer", "whiteCrisp"]]);
  P("wine", "italian", "칸티나 산 미켈레 아피아노", "Cantina San Michele Appiano", I, "알토 아디제", "Cantina San Michele Appiano", [["산크트 발렌틴 소비뇽", "Sanct Valentin Sauvignon", "화이트 · 알토 아디제", 14, 60000, SB, "whiteCrisp"]]);
  P("wine", "italian", "비에 디 로마", "Vie di Romans", I, "프리울리 이손초", "Vie di Romans", [["피에르 소비뇽", "Piere Sauvignon", "화이트 · 프리울리 이손초", 14, 70000, SB, "whiteCrisp"]]);
  P("wine", "italian", "쉬오페토", "Schiopetto", I, "프리울리 콜리오", "Schiopetto", [["프리울라노", "Friulano Collio", "화이트 · 콜리오", 13.5, 50000, "Friulano", "whiteCrisp"]]);
  P("wine", "italian", "라디콘", "Radikon", I, "프리울리 오슬라비아", "Radikon", [["리볼라", "Ribolla", "화이트 · 오렌지 (스킨 컨택트)", 13.5, 100000, "Ribolla Gialla", "whiteCrisp"]]);
  P("wine", "italian", "마스트로베라르디노", "Mastroberardino", I, "캄파니아", "Mastroberardino", [["그레코 디 투포 노바 세라", "Greco di Tufo Nova Serra", "화이트 · 그레코 디 투포", 13, 40000, "Greco", "whiteCrisp"]]);
  P("wine", "italian", "몬테베트라노", "Montevetrano", I, "캄파니아", "Montevetrano", [["", "", "레드 · 콜리 디 살레르노", 14, 120000, "Cabernet Sauvignon/Merlot/Aglianico"]]);
  P("wine", "italian", "갈라르디", "Galardi", I, "캄파니아", "Galardi", [["테라 디 라보로", "Terra di Lavoro", "레드 · 로카몬피나", 13.5, 150000, "Aglianico/Piedirosso"]]);
  P("wine", "italian", "타우리노", "Cosimo Taurino", I, "풀리아", "Cosimo Taurino", [["파트리리오네", "Patriglione", "레드 · 살렌토 IGT", 14.5, 80000, "Negroamaro/Malvasia Nera"]]);
  P("wine", "italian", "산 마르차노", "San Marzano", I, "풀리아", "Cantine San Marzano", [["세싼타니 프리미티보 디 만두리아", "Sessantanni Primitivo di Manduria", "레드 · 프리미티보 디 만두리아", 14.5, 40000, "Primitivo"]]);
  P("wine", "italian", "타스카 달메리타", "Tasca d'Almerita", I, "시칠리아", "Tasca d'Almerita", [["로소 델 콘테", "Rosso del Conte", "레드 · 콘테아 디 스클라파니", 14, 100000, "Nero d'Avola/Perricone"]]);
  P("wine", "italian", "피리아토", "Firriato", I, "시칠리아", "Firriato", [["하르모니움 네로 다볼라", "Harmonium Nero d'Avola", "레드 · 시칠리아", 14.5, 60000, "Nero d'Avola"]]);
  P("wine", "italian", "벤안티", "Benanti", I, "시칠리아 에트나", "Benanti", [["피에트라 마리나", "Pietra Marina Etna Bianco Superiore", "화이트 · 에트나 비앙코", 12.5, 90000, "Carricante", "whiteCrisp"]]);
  P("wine", "italian", "피에트라돌체", "Pietradolce", I, "시칠리아 에트나", "Pietradolce", [["바르바갈리", "Barbagalli Etna Rosso", "레드 · 에트나 로쏘", 14, 200000, "Nerello Mascalese"]]);
  P("wine", "italian", "아르지올라스", "Argiolas", I, "사르데냐", "Argiolas", [["투리가", "Turriga", "레드 · 이솔라 데이 누라기", 14.5, 120000, "Cannonau/Carignano/Bovale"]]);
  P("wine", "italian", "아그리콜라 푸니카", "Agricola Punica", I, "사르데냐", "Agricola Punica (Tenuta San Guido)", [["바루아", "Barrua", "레드 · 이솔라 데이 누라기", 14, 70000, "Carignano/Cabernet Sauvignon/Merlot"]]);
  P("wine", "italian", "우마니 론키", "Umani Ronchi", I, "마르케", "Umani Ronchi", [["카스텔리 디 예지 베르디키오 카살 디 세라", "Verdicchio dei Castelli di Jesi Casal di Serra", "화이트 · 베르디키오", 13.5, 30000, "Verdicchio", "whiteCrisp"]]);
  P("wine", "italian", "부치", "Bucci", I, "마르케", "Bucci", [["빌라 부치 리제르바", "Villa Bucci Verdicchio Riserva", "화이트 · 베르디키오 리제르바", 13.5, 80000, "Verdicchio", "whiteCrisp"]]);
  P("wine", "italian", "카 델 보스코", "Ca' del Bosco", I, "롬바르디아 프란차코르타", "Ca' del Bosco", [["안나마리아 클레멘티", "Annamaria Clementi", "스파클링 · 프란차코르타 리제르바", 12.5, 200000, "Chardonnay/Pinot Bianco/Pinot Nero", "bubbly"]]);
  P("wine", "italian", "페라리", "Ferrari", I, "트렌티노", "Ferrari Trento", [["페를레", "Perlé", "스파클링 · 트렌토 DOC", 12.5, 50000, CH, "bubbly"], ["줄리오 페라리 리제르바 델 폰다토레", "Giulio Ferrari Riserva del Fondatore", "스파클링 · 트렌토 DOC 리제르바", 12.5, 250000, CH, "bubbly"]]);
  P("wine", "italian", "니노 프랑코", "Nino Franco", I, "베네토 발도비아데네", "Nino Franco", [["루스티코 프로세코 수페리오레", "Rustico Valdobbiadene Prosecco Superiore", "스파클링 · 프로세코 수페리오레", 11, 30000, "Glera", "bubbly"]]);
  P("wine", "italian", "비솔", "Bisol", I, "베네토 발도비아데네", "Bisol", [["카르티체", "Cartizze Valdobbiadene Superiore di Cartizze", "스파클링 · 카르티체", 11.5, 60000, "Glera", "bubbly"]]);

  // ── 스페인
  P("wine", "spanish", "베가 시실리아", "Vega Sicilia", E, "카스티야 이 레온", "Vega Sicilia", [
    ["알리온", "Alión", "레드 · 리베라 델 두에로", 14.5, 150000, TEM, "spanish", "카스티야 이 레온 리베라 델 두에로"],
    ["핀티아", "Pintia", "레드 · 토로", 14.5, 120000, "Tinta de Toro", "spanish", "카스티야 이 레온 토로"],
    ["마칸", "Macán", "레드 · 리오하", 14.5, 150000, TEM, "spanish", "리오하"]]);
  P("wine", "spanish", "보데가스 아알토", "Bodegas Aalto", E, "카스티야 이 레온 리베라 델 두에로", "Bodegas Aalto", [["아알토", "Aalto", "레드 · 리베라 델 두에로", 14.5, 90000, TEM]]);
  P("wine", "spanish", "보데가스 알레한드로 페르난데스", "Bodegas Alejandro Fernández", E, "카스티야 이 레온 리베라 델 두에로", "Tinto Pesquera", [["틴토 페스케라 크리안사", "Tinto Pesquera Crianza", "레드 · 리베라 델 두에로 크리안사", 14, 50000, TEM]]);
  P("wine", "spanish", "아바디아 레투에르타", "Abadía Retuerta", E, "카스티야 이 레온", "Abadía Retuerta", [["셀렉시온 에스페시알", "Selección Especial", "레드 · 카스티야 이 레온", 14.5, 60000, "Tempranillo/Cabernet Sauvignon/Syrah"]]);
  P("wine", "spanish", "보데가스 로다", "Bodegas Roda", E, "리오하", "Bodegas Roda", [["로다 레세르바", "Roda Reserva", "레드 · 리오하 레세르바", 14, 80000, "Tempranillo/Graciano/Garnacha"], ["시르시온", "Cirsion", "레드 · 리오하", 14, 400000, TEM]]);
  P("wine", "spanish", "콘티노", "Contino", E, "리오하", "Viñedos del Contino (CVNE)", [["레세르바", "Reserva", "레드 · 리오하 레세르바", 14, 70000, "Tempranillo/Graciano/Garnacha"]]);
  P("wine", "spanish", "라 리오하 알타", "La Rioja Alta", E, "리오하", "La Rioja Alta", [["비냐 아르단사 레세르바", "Viña Ardanza Reserva", "레드 · 리오하 레세르바", 14, 60000, "Tempranillo/Garnacha"]]);
  P("wine", "spanish", "보데가스 몬테시요", "Bodegas Montecillo", E, "리오하", "Bodegas Montecillo", [["그란 레세르바", "Gran Reserva", "레드 · 리오하 그란 레세르바", 13.5, 40000, TEM]]);
  P("wine", "spanish", "마르케스 데 리스칼", "Marqués de Riscal", E, "리오하", "Marqués de Riscal", [["바론 데 치렐", "Barón de Chirel Reserva", "레드 · 리오하 레세르바", 14, 100000, "Tempranillo/Cabernet Sauvignon"], ["레세르바", "Reserva", "레드 · 리오하 레세르바", 14, 35000, "Tempranillo/Graciano"]]);
  P("wine", "spanish", "아르타디", "Artadi", E, "리오하", "Artadi", [["비냐스 데 가인", "Viñas de Gain", "레드 · 리오하", 14, 50000, TEM]]);
  P("wine", "spanish", "벤하민 로메오", "Benjamín Romeo", E, "리오하", "Bodega Contador", [["콘타도르", "Contador", "레드 · 리오하", 15, 500000, TEM]]);
  P("wine", "spanish", "텔모 로드리게스", "Telmo Rodríguez", E, "리오하", "Compañía de Vinos Telmo Rodríguez", [["란사가", "Lanzaga", "레드 · 리오하", 14, 60000, "Tempranillo/Garnacha/Graciano"]]);
  P("wine", "spanish", "알바로 팔라시오스", "Álvaro Palacios", E, "카탈루냐 프리오랏", "Álvaro Palacios", [["핀카 도피", "Finca Dofí", "레드 · 프리오랏", 15, 200000, "Garnacha"], ["카민스 델 프리오랏", "Camins del Priorat", "레드 · 프리오랏", 14.5, 40000, "Garnacha/Cariñena/Syrah"]]);
  P("wine", "spanish", "마스 도이스", "Mas Doix", E, "카탈루냐 프리오랏", "Mas Doix", [["살랑케스", "Salanques", "레드 · 프리오랏", 15, 80000, "Garnacha/Cariñena/Syrah"]]);
  P("wine", "spanish", "토레스", "Torres", E, "카탈루냐 페네데스", "Familia Torres", [["마스 라 플라나", "Mas La Plana", "레드 · 페네데스", 14.5, 90000, CS], ["그란 코로나스", "Gran Coronas Reserva", "레드 · 페네데스", 14, 30000, "Cabernet Sauvignon/Tempranillo"],
    ["그란 비냐 솔", "Gran Viña Sol", "화이트 · 페네데스", 12.5, 25000, "Chardonnay/Parellada", "whiteCrisp"]]);
  P("wine", "spanish", "그라모나", "Gramona", E, "카탈루냐 페네데스", "Gramona", [["임페리알 그란 레세르바", "Imperial Gran Reserva Brut", "스파클링 · 코르피나트", 12, 60000, "Xarel·lo/Macabeo/Chardonnay", "bubbly"]]);
  P("wine", "spanish", "레카레도", "Recaredo", E, "카탈루냐 페네데스", "Recaredo", [["테레스 브뤼 나튀레", "Terrers Brut Nature", "스파클링 · 코르피나트", 12, 60000, "Xarel·lo/Macabeo/Parellada", "bubbly"]]);
  P("wine", "spanish", "코도르니우", "Codorníu", E, "카탈루냐 페네데스", "Codorníu", [["안나 데 코도르니우 블랑 데 블랑", "Anna de Codorníu Blanc de Blancs", "스파클링 · 까바", 11.5, 25000, "Chardonnay/Macabeo/Parellada", "bubbly"]]);
  P("wine", "spanish", "무가", "Muga", E, "리오하", "Bodegas Muga", [["아로", "Aro", "레드 · 리오하", 14.5, 500000, "Tempranillo/Graciano"], ["토레 무가", "Torre Muga", "레드 · 리오하", 14.5, 200000, "Tempranillo/Mazuelo/Graciano"]]);
  P("wine", "spanish", "보데가스 엘 니도", "Bodegas El Nido", E, "후미야", "Bodegas El Nido", [["엘 니도", "El Nido", "레드 · 후미야", 15.5, 250000, "Cabernet Sauvignon/Monastrell"], ["클리오", "Clio", "레드 · 후미야", 15.5, 80000, "Monastrell/Cabernet Sauvignon"]]);
  P("wine", "spanish", "보데가스 후안 힐", "Bodegas Juan Gil", E, "후미야", "Bodegas Juan Gil", [["실버 라벨 모나스트렐", "Silver Label Monastrell", "레드 · 후미야", 15, 30000, "Monastrell"]]);
  P("wine", "spanish", "라파엘 팔라시오스", "Rafael Palacios", E, "갈리시아 발데오라스", "Rafael Palacios", [["아스 소르테스", "As Sortes", "화이트 · 발데오라스", 13.5, 100000, "Godello", "whiteCrisp"], ["로우로 두 볼로", "Louro do Bolo", "화이트 · 발데오라스", 13, 40000, "Godello", "whiteCrisp"]]);
  P("wine", "spanish", "사라테", "Zárate", E, "갈리시아 리아스 바이사스", "Bodegas Zárate", [["알바리뇨", "Albariño", "화이트 · 리아스 바이사스", 12.5, 40000, "Albariño", "whiteCrisp"]]);
  P("wine", "spanish", "곤살레스 비아스", "González Byass", E, "안달루시아 헤레스", "González Byass", [["티오 페페 피노", "Tío Pepe Fino", "주정강화 · 피노 셰리", 15, 25000, "Palomino Fino", "sweet"], ["노에 페드로 히메네스 30년", "Noé Pedro Ximénez 30 Years", "주정강화 · PX 셰리", 15.5, 80000, "Pedro Ximénez", "sweet"]]);
  P("wine", "spanish", "루스타우", "Lustau", E, "안달루시아 헤레스", "Emilio Lustau", [["아몬티야도 로스 아르코스", "Los Arcos Amontillado", "주정강화 · 아몬티야도 셰리", 18.5, 30000, "Palomino Fino", "sweet"], ["올로로소 돈 누뇨", "Don Nuño Oloroso", "주정강화 · 올로로소 셰리", 20, 35000, "Palomino Fino", "sweet"]]);
  P("wine", "spanish", "에키포 나바소스", "Equipo Navazos", E, "안달루시아 헤레스", "Equipo Navazos", [["라 보타 데 피노", "La Bota de Fino", "주정강화 · 피노 셰리", 15, 60000, "Palomino Fino", "sweet"]]);

  // ── 포르투갈
  P("wine", "spanish", "니포트", "Niepoort", PT, "도우루", "Niepoort", [["바투타", "Batuta", "레드 · 도우루", 14, 150000, "Touriga Franca/Tinta Roriz/Tinta Amarela"], ["레도마 브랑쿠", "Redoma Branco", "화이트 · 도우루", 13, 60000, "Rabigato/Códega/Viosinho", "whiteCrisp"],
    ["10년 토니 포트", "10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, 60000, "Touriga Franca/Tinta Roriz", "sweet"]]);
  P("wine", "spanish", "킨타 두 발레 메앙", "Quinta do Vale Meão", PT, "도우루", "Quinta do Vale Meão", [["", "", "레드 · 도우루", 14.5, 150000, "Touriga Nacional/Touriga Franca/Tinta Roriz"]]);
  P("wine", "spanish", "킨타 두 크라스투", "Quinta do Crasto", PT, "도우루", "Quinta do Crasto", [["비냐 마리아 테레자", "Vinha Maria Teresa", "레드 · 도우루", 14.5, 250000, "Field Blend"], ["크라스투 도우루 틴투", "Crasto Douro Tinto", "레드 · 도우루", 13.5, 30000, "Touriga Nacional/Touriga Franca/Tinta Roriz"]]);
  rows("wine", "sweet", [
    ["크로프트 킨타 다 호에다 빈티지 포트", "Croft Quinta da Roêda Vintage Port", "주정강화 · 싱글 킨타 빈티지 포트", 20, PT, "도우루", "Croft (Symington)", 80000, "Touriga Nacional/Touriga Franca"],
    ["다우스 킨타 두 봄핑 빈티지 포트", "Dow's Quinta do Bomfim Vintage Port", "주정강화 · 싱글 킨타 빈티지 포트", 20, PT, "도우루", "Dow's (Symington)", 80000, "Touriga Nacional/Touriga Franca"],
    ["그레이엄스 식스 그레이프스", "Graham's Six Grapes Reserve Port", "주정강화 · 루비 리저브 포트", 20, PT, "도우루", "Graham's (Symington)", 40000, "Touriga Nacional/Touriga Franca"],
    ["크리세이아", "Chryseia", "레드 · 도우루", 14, PT, "도우루", "Prats & Symington", 150000, "Touriga Nacional/Touriga Franca", "redFull"],
  ]);
  P("wine", "spanish", "테일러스", "Taylor's", PT, "도우루", "Taylor's", [["10년 토니 포트", "10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, 50000, "Touriga Nacional/Touriga Franca", "sweet"], ["20년 토니 포트", "20 Year Old Tawny Port", "주정강화 · 토니 포트", 20, 100000, "Touriga Nacional/Touriga Franca", "sweet"]]);
  P("wine", "spanish", "폰세카", "Fonseca", PT, "도우루", "Fonseca", [["빈티지 포트", "Vintage Port", "주정강화 · 빈티지 포트", 20.5, 150000, "Touriga Nacional/Touriga Franca", "sweet"], ["빈 27", "Bin No. 27 Reserve Port", "주정강화 · 루비 리저브 포트", 20, 35000, "Touriga Nacional/Touriga Franca", "sweet"]]);
  P("wine", "spanish", "킨타 두 노발", "Quinta do Noval", PT, "도우루", "Quinta do Noval", [["나시오날 빈티지 포트", "Nacional Vintage Port", "주정강화 · 빈티지 포트", 20, 1500000, "Touriga Nacional", "sweet"], ["10년 토니 포트", "10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, 60000, "Touriga Nacional/Touriga Franca", "sweet"]]);
  P("wine", "spanish", "블랜디스", "Blandy's", PT, "마데이라", "Blandy's", [["10년 말름지", "10 Year Old Malmsey", "주정강화 · 마데이라", 19, 70000, "Malvasia", "sweet"]]);
  P("wine", "spanish", "에스포랑", "Herdade do Esporão", PT, "알렌테주", "Esporão", [["레제르바 틴투", "Reserva Tinto", "레드 · 알렌테주", 14.5, 40000, "Aragonez/Trincadeira/Cabernet Sauvignon"]]);
  P("wine", "spanish", "루이스 파투", "Luís Pato", PT, "바이하다", "Luís Pato", [["비냐스 벨랴스 틴투", "Vinhas Velhas Tinto", "레드 · 바이하다", 13, 50000, "Baga"]]);
  P("wine", "spanish", "소알례이루", "Soalheiro", PT, "비뉴 베르드", "Soalheiro", [["알바리뇨", "Alvarinho", "화이트 · 비뉴 베르드", 12.5, 35000, "Alvarinho", "whiteCrisp"]]);


  // ── 독일 · 오스트리아
  rows("wine", "whiteCrisp", [
    ["J.J. 프륌 벨레너 존넨우어 리슬링 아우슬레제", "J.J. Prüm Wehlener Sonnenuhr Riesling Auslese", "화이트 · 리슬링 아우슬레제", 7.5, DE, "모젤", "Weingut Joh. Jos. Prüm", 150000, RI],
    ["J.J. 프륌 벨레너 존넨우어 리슬링 카비넷", "J.J. Prüm Wehlener Sonnenuhr Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, DE, "모젤", "Weingut Joh. Jos. Prüm", 80000, RI],
    ["에곤 뮐러 샤르츠호프 리슬링", "Egon Müller Scharzhof Riesling QbA", "화이트 · 리슬링", 9.5, DE, "모젤 자르", "Weingut Egon Müller", 90000, RI],
    ["클레멘스 부슈 마리엔부르크 GG", "Clemens Busch Marienburg Riesling GG", "화이트 · 리슬링 그로세스 게베흐스", 12.5, DE, "모젤", "Weingut Clemens Busch", 90000, RI],
    ["카르트호이저호프 리슬링 트로켄", "Karthäuserhof Riesling Trocken", "화이트 · 리슬링", 12, DE, "모젤 루버", "Weingut Karthäuserhof", 50000, RI],
    ["막시민 그륀하우스 압츠베르크 리슬링 슈페트레제", "Maximin Grünhaus Abtsberg Riesling Spätlese", "화이트 · 리슬링 슈페트레제", 8.5, DE, "모젤 루버", "Maximin Grünhaus", 80000, RI],
    ["닥터 루젠 블루 슬레이트 리슬링 카비넷", "Dr. Loosen Blue Slate Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, DE, "모젤", "Weingut Dr. Loosen", 35000, RI],
    ["슐로스 요하니스베르크 겔프락 리슬링", "Schloss Johannisberg Gelblack Riesling", "화이트 · 리슬링", 11, DE, "라인가우", "Schloss Johannisberg", 50000, RI],
    ["로베르트 바일 리슬링 트로켄", "Robert Weil Riesling Trocken", "화이트 · 리슬링", 12, DE, "라인가우", "Weingut Robert Weil", 45000, RI],
    ["퀸스틀러 호흐하이머 횔레 리슬링 GG", "Künstler Hochheimer Hölle Riesling GG", "화이트 · 리슬링 그로세스 게베흐스", 13, DE, "라인가우", "Weingut Künstler", 90000, RI],
    ["비트만 베스트호펜 리슬링", "Wittmann Westhofener Riesling", "화이트 · 리슬링", 12.5, DE, "라인헤센", "Weingut Wittmann", 50000, RI],
    ["켈러 G-막스", "Weingut Keller G-Max Riesling", "화이트 · 리슬링", 12.5, DE, "라인헤센", "Weingut Keller", 2500000, RI],
    ["바서만 요르단 리슬링 트로켄", "Bassermann-Jordan Riesling Trocken", "화이트 · 리슬링", 12, DE, "팔츠", "Weingut Geheimer Rat Dr. von Bassermann-Jordan", 35000, RI],
    ["셰퍼 프뢸리히 할렌베르크 GG", "Schäfer-Fröhlich Halenberg Riesling GG", "화이트 · 리슬링 그로세스 게베흐스", 13, DE, "나에", "Weingut Schäfer-Fröhlich", 120000, RI],
    ["된호프 리슬링 트로켄", "Dönnhoff Riesling Trocken", "화이트 · 리슬링", 12, DE, "나에", "Weingut Dönnhoff", 45000, RI],
    ["크놀 리슬링 스마라그트 쉬트", "Emmerich Knoll Riesling Smaragd Ried Schütt", "화이트 · 바하우 스마라그트", 13.5, AT, "바하우", "Weingut Emmerich Knoll", 120000, RI],
    ["도메네 바하우 그뤼너 펠틀리너 페더슈필", "Domäne Wachau Grüner Veltliner Federspiel Terrassen", "화이트 · 바하우 페더슈필", 12.5, AT, "바하우", "Domäne Wachau", 35000, "Grüner Veltliner"],
    ["알칭어 그뤼너 펠틀리너 스마라그트 로이벤베르크", "Alzinger Grüner Veltliner Smaragd Loibenberg", "화이트 · 바하우 스마라그트", 13.5, AT, "바하우", "Weingut Alzinger", 90000, "Grüner Veltliner"],
    ["니콜라이호프 그뤼너 펠틀리너", "Nikolaihof Grüner Veltliner Hefeabzug", "화이트 · 바하우", 12, AT, "바하우", "Nikolaihof", 50000, "Grüner Veltliner"],
    ["슐로스 고벨스부르크 그뤼너 펠틀리너 람", "Schloss Gobelsburg Grüner Veltliner Ried Lamm", "화이트 · 캄프탈", 13.5, AT, "캄프탈", "Schloss Gobelsburg", 80000, "Grüner Veltliner"],
    ["사틀러호프 소비뇽 블랑", "Sattlerhof Sauvignon Blanc Südsteiermark", "화이트 · 쥐트슈타이어마르크", 12.5, AT, "쥐트슈타이어마르크", "Sattlerhof", 50000, SB],
  ].filter(([, en]) => en !== "x"));
  rows("wine", "redMed", [
    ["모릭 블라우프랭키슈", "Moric Blaufränkisch", "레드 · 부르겐란트", 13, AT, "부르겐란트", "Moric", 70000, "Blaufränkisch"],
    ["우마툼 츠바이겔트", "Umathum Zweigelt", "레드 · 부르겐란트", 13, AT, "부르겐란트", "Umathum", 40000, "Zweigelt"],
    ["프리드리히 베커 슈페트부르군더", "Friedrich Becker Spätburgunder", "레드 · 슈페트부르군더", 13, DE, "팔츠", "Weingut Friedrich Becker", 70000, PN, "pinot"],
    ["베른하르트 후버 슈페트부르군더", "Bernhard Huber Spätburgunder", "레드 · 슈페트부르군더", 13, DE, "바덴", "Weingut Bernhard Huber", 60000, PN, "pinot"],
    ["마이어 네켈 슈페트부르군더", "Meyer-Näkel Spätburgunder", "레드 · 슈페트부르군더", 13.5, DE, "아르", "Weingut Meyer-Näkel", 70000, PN, "pinot"],
  ]);

  // ── 그 밖의 유럽 · 지중해
  rows("wine", "redFull", [
    ["트빌비노 사페라비", "Tbilvino Saperavi", "레드 · 카헤티", 13, "조지아", "카헤티", "Tbilvino", 25000, "Saperavi"],
    ["페전츠 티어스 사페라비", "Pheasant's Tears Saperavi", "레드 · 카헤티 (크베브리)", 13, "조지아", "카헤티", "Pheasant's Tears", 50000, "Saperavi"],
    ["야르덴 까베르네 소비뇽", "Yarden Cabernet Sauvignon", "레드 · 골란 하이츠", 14.5, "이스라엘", "골란 하이츠", "Golan Heights Winery", 60000, CS],
    ["도멘 뒤 카스텔 그랑 뱅", "Domaine du Castel Grand Vin", "레드 · 유대 언덕", 14, "이스라엘", "유대 언덕", "Domaine du Castel", 100000, BDX],
    ["샤토 크사라 레제르브 뒤 쿠방", "Château Ksara Réserve du Couvent", "레드 · 베카 밸리", 13.5, "레바논", "베카 밸리", "Château Ksara", 30000, "Cabernet Sauvignon/Syrah/Cabernet Franc"],
    ["샤토 케프라야 콩트 드 엠", "Château Kefraya Comte de M", "레드 · 베카 밸리", 14, "레바논", "베카 밸리", "Château Kefraya", 80000, "Cabernet Sauvignon/Syrah"],
    ["알파 에스테이트 쉬노마브로 레세르브", "Alpha Estate Xinomavro Reserve Vieilles Vignes", "레드 · 아민데오", 14, "그리스", "마케도니아 아민데오", "Alpha Estate", 60000, "Xinomavro"],
    ["키르 야니 람니스타 쉬노마브로", "Kir-Yianni Ramnista Xinomavro", "레드 · 나우사", 14, "그리스", "마케도니아 나우사", "Kir-Yianni", 40000, "Xinomavro"],
    ["가이아 아요르이티코", "Gaia Agiorgitiko", "레드 · 네메아", 13.5, "그리스", "펠로폰네소스 네메아", "Gaia Wines", 30000, "Agiorgitiko"],
    ["보크 퀴베 카펠라", "Bock Cuvée Capella Villány", "레드 · 빌라니", 14, "헝가리", "빌라니", "Bock Pince", 70000, "Cabernet Franc/Cabernet Sauvignon/Merlot"],
    ["모비아 레불라", "Movia Rebula", "화이트 · 브르다", 13, "슬로베니아", "고리슈카 브르다", "Movia", 50000, "Rebula", "whiteCrisp"],
    ["세인츠 힐스 딩가치 플라바츠 말리", "Saints Hills Dingač Plavac Mali", "레드 · 딩가치", 14.5, "크로아티아", "달마티아 펠레샤츠", "Saints Hills", 70000, "Plavac Mali"],
    ["나이팀버 클래식 퀴베", "Nyetimber Classic Cuvée", "스파클링 · 잉글리시 스파클링", 12, "영국", "웨스트 서식스", "Nyetimber", 80000, CHAMP, "bubbly"],
    ["채플 다운 브뤼", "Chapel Down Brut", "스파클링 · 잉글리시 스파클링", 12, "영국", "켄트", "Chapel Down", 50000, CHAMP, "bubbly"],
    ["거스본 블랑 드 블랑", "Gusbourne Blanc de Blancs", "스파클링 · 잉글리시 스파클링", 12, "영국", "켄트", "Gusbourne", 100000, CH, "bubbly"],
    ["샤토 메르시앙 그리 드 고슈", "Château Mercian Koshu Gris de Koshu", "화이트 · 고슈", 12, "일본", "야마나시", "Château Mercian", 40000, "Koshu", "whiteCrisp"],
    ["그레이스 와인 고슈 가야가타케", "Grace Wine Grace Koshu Kayagatake", "화이트 · 고슈", 11.5, "일본", "야마나시", "Chuo Budoshu (Grace Wine)", 50000, "Koshu", "whiteCrisp"],
    ["이니스킬린 비달 아이스와인", "Inniskillin Vidal Icewine", "스위트 · 아이스와인", 9.5, "캐나다", "온타리오 나이아가라", "Inniskillin", 80000, "Vidal", "sweet"],
    ["이니스킬린 카베르네 프랑 아이스와인", "Inniskillin Cabernet Franc Icewine", "스위트 · 아이스와인", 9.5, "캐나다", "온타리오 나이아가라", "Inniskillin", 120000, "Cabernet Franc", "sweet"],
  ].filter(([, en]) => en !== "x"));

  // ── 미국
  rows("wine", "redFull", [
    ["캐이머스 나파 밸리 까베르네 소비뇽", "Caymus Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.8, US, "캘리포니아 나파 밸리", "Caymus Vineyards", 150000, CS],
    ["조셉 펠프스 나파 밸리 까베르네 소비뇽", "Joseph Phelps Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "Joseph Phelps Vineyards", 130000, CS],
    ["케이크브레드 나파 밸리 까베르네 소비뇽", "Cakebread Cellars Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "Cakebread Cellars", 150000, CS],
    ["케이크브레드 나파 밸리 샤르도네", "Cakebread Cellars Napa Valley Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 나파 밸리", "Cakebread Cellars", 80000, CH, "whiteCrisp"],
    ["덕혼 나파 밸리 메를로", "Duckhorn Napa Valley Merlot", "레드 · 메를로", 14.5, US, "캘리포니아 나파 밸리", "Duckhorn Vineyards", 90000, "Merlot"],
    ["덕혼 나파 밸리 까베르네 소비뇽", "Duckhorn Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "Duckhorn Vineyards", 120000, CS],
    ["골든아이 앤더슨 밸리 피노 누아", "Goldeneye Anderson Valley Pinot Noir", "레드 · 피노 누아", 14.5, US, "캘리포니아 앤더슨 밸리", "Duckhorn (Goldeneye)", 90000, PN, "pinot"],
    ["디코이 소노마 까베르네 소비뇽", "Decoy Sonoma County Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.9, US, "캘리포니아 소노마", "Duckhorn (Decoy)", 40000, CS],
    ["팔메이어 프로프라이어터리 레드", "Pahlmeyer Proprietary Red", "레드 · 보르도 블렌드", 15, US, "캘리포니아 나파 밸리", "Pahlmeyer", 200000, BDX],
    ["로버트 몬다비 오크빌 까베르네 소비뇽", "Robert Mondavi Oakville Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리 오크빌", "Robert Mondavi Winery", 100000, CS],
    ["로버트 몬다비 토 칼론 리저브", "Robert Mondavi To Kalon Vineyard Reserve Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, US, "캘리포니아 나파 밸리 오크빌", "Robert Mondavi Winery", 300000, CS],
    ["베린저 프라이빗 리저브 까베르네 소비뇽", "Beringer Private Reserve Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "Beringer Vineyards", 200000, CS],
    ["샤토 몬텔레나 까베르네 소비뇽", "Château Montelena Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, US, "캘리포니아 나파 밸리 캘리스토가", "Château Montelena", 120000, CS],
    ["그르기치 힐스 까베르네 소비뇽", "Grgich Hills Estate Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "Grgich Hills Estate", 120000, CS],
    ["그르기치 힐스 샤르도네", "Grgich Hills Estate Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 나파 밸리", "Grgich Hills Estate", 80000, CH, "whiteCrisp"],
    ["조던 까베르네 소비뇽", "Jordan Alexander Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.8, US, "캘리포니아 소노마 알렉산더 밸리", "Jordan Vineyard & Winery", 90000, CS],
    ["오쇼네시 하웰 마운틴 까베르네 소비뇽", "O'Shaughnessy Howell Mountain Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리 하웰 마운틴", "O'Shaughnessy Estate", 200000, CS],
    ["오비드 나파 밸리", "Ovid Napa Valley", "레드 · 보르도 블렌드", 14.5, US, "캘리포니아 나파 밸리 프리처드 힐", "Ovid Napa Valley", 600000, BDX],
    ["할란 더 메이든", "Harlan Estate The Maiden", "레드 · 세컨드 와인", 14.5, US, "캘리포니아 나파 밸리 오크빌", "Harlan Estate", 600000, BDX],
    ["본드 플루리버스", "BOND Pluribus", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리", "BOND Estates", 1000000, CS],
    ["타블라스 크릭 에스프리 드 타블라스", "Tablas Creek Esprit de Tablas", "레드 · 론 블렌드", 14, US, "캘리포니아 파소 로블레스", "Tablas Creek Vineyard", 90000, "Mourvèdre/Grenache/Syrah/Counoise"],
    ["저스틴 아이소셀레스", "Justin Isosceles", "레드 · 보르도 블렌드", 15, US, "캘리포니아 파소 로블레스", "Justin Vineyards", 120000, BDX],
    ["샤토 생 미셸 콜드 크릭 까베르네 소비뇽", "Chateau Ste. Michelle Cold Creek Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "워싱턴 컬럼비아 밸리", "Chateau Ste. Michelle", 50000, CS],
    ["콜 솔라레", "Col Solare", "레드 · 보르도 블렌드", 14.5, US, "워싱턴 레드 마운틴", "Col Solare (Antinori × Ste. Michelle)", 120000, BDX],
    ["우드워드 캐니언 아티스트 시리즈 까베르네 소비뇽", "Woodward Canyon Artist Series Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "워싱턴 왈라 왈라 밸리", "Woodward Canyon", 100000, CS],
    ["K 빈트너스 모터 시티 키티 시라", "K Vintners Motor City Kitty Syrah", "레드 · 시라", 14, US, "워싱턴 왈라 왈라 밸리", "K Vintners", 80000, SY],
    ["카유스 카이유 빈야드 시라", "Cayuse Cailloux Vineyard Syrah", "레드 · 시라", 14, US, "워싱턴·오리건 왈라 왈라 밸리", "Cayuse Vineyards", 400000, SY],
    ["리지 리튼 스프링스", "Ridge Lytton Springs", "레드 · 진판델 블렌드", 14.5, US, "캘리포니아 소노마 드라이 크릭", "Ridge Vineyards", 70000, "Zinfandel/Petite Sirah/Carignane"],
    ["세게시오 올드 바인 진판델", "Seghesio Old Vine Zinfandel", "레드 · 진판델", 15, US, "캘리포니아 소노마", "Seghesio Family Vineyards", 60000, "Zinfandel"],
    ["오린 스위프트 파피용", "Orin Swift Papillon", "레드 · 보르도 블렌드", 15.5, US, "캘리포니아 나파 밸리", "Orin Swift Cellars", 120000, BDX],
    ["오린 스위프트 에이트 이어스 인 더 데저트", "Orin Swift 8 Years in the Desert", "레드 · 진판델 블렌드", 15.5, US, "캘리포니아", "Orin Swift Cellars", 80000, "Zinfandel/Petite Sirah/Syrah"],
    ["더 프리즈너 레드 블렌드", "The Prisoner Red Blend", "레드 · 진판델 블렌드", 15.2, US, "캘리포니아 나파 밸리", "The Prisoner Wine Company", 70000, "Zinfandel/Cabernet Sauvignon/Petite Sirah"],
  ].filter(([, en]) => en !== "x"));
  rows("wine", "whiteCrisp", [
    ["콩스가드 더 저지", "Kongsgaard The Judge Chardonnay", "화이트 · 샤르도네", 14.5, US, "캘리포니아 나파 밸리", "Kongsgaard Wine", 500000, CH],
    ["오베르 리치 빈야드 샤르도네", "Aubert Ritchie Vineyard Chardonnay", "화이트 · 샤르도네", 14.5, US, "캘리포니아 소노마 코스트", "Aubert Wines", 250000, CH],
    ["키슬러 맥크레아 빈야드 샤르도네", "Kistler McCrea Vineyard Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 소노마 마운틴", "Kistler Vineyards", 150000, CH],
    ["롬바우어 샤르도네", "Rombauer Carneros Chardonnay", "화이트 · 샤르도네", 14.5, US, "캘리포니아 카네로스", "Rombauer Vineyards", 70000, CH],
    ["뉴턴 언필터드 샤르도네", "Newton Unfiltered Chardonnay", "화이트 · 샤르도네", 14.5, US, "캘리포니아 나파 밸리", "Newton Vineyard", 80000, CH],
    ["샤토 몬텔레나 샤르도네", "Château Montelena Napa Valley Chardonnay", "화이트 · 샤르도네", 13.5, US, "캘리포니아 나파 밸리", "Château Montelena", 90000, CH],
    ["스포츠우드 소비뇽 블랑", "Spottswoode Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13.5, US, "캘리포니아 나파 밸리", "Spottswoode", 80000, SB],
    ["메리 에드워즈 소비뇽 블랑", "Merry Edwards Russian River Valley Sauvignon Blanc", "화이트 · 소비뇽 블랑", 14, US, "캘리포니아 소노마 러시안 리버 밸리", "Merry Edwards Winery", 60000, SB],
  ].filter(([, en]) => en !== "x"));
  rows("wine", "pinot", [
    ["메리 에드워즈 메레디스 에스테이트 피노 누아", "Merry Edwards Meredith Estate Pinot Noir", "레드 · 피노 누아", 14.5, US, "캘리포니아 소노마 러시안 리버 밸리", "Merry Edwards Winery", 120000, PN],
    ["도멘 세린 에벤스타드 리저브 샤르도네", "Domaine Serene Evenstad Reserve Chardonnay", "화이트 · 샤르도네", 13.5, US, "오리건 던디 힐스", "Domaine Serene", 120000, CH, "whiteCrisp"],
    ["패트리샤 그린 셀러스 피노 누아", "Patricia Green Cellars Reserve Pinot Noir", "레드 · 피노 누아", 13.5, US, "오리건 윌라멧 밸리", "Patricia Green Cellars", 60000, PN],
    ["아처리 서밋 아커스 에스테이트 피노 누아", "Archery Summit Arcus Estate Pinot Noir", "레드 · 피노 누아", 14, US, "오리건 던디 힐스", "Archery Summit", 150000, PN],
    ["렉스 힐 피노 누아", "Rex Hill Willamette Valley Pinot Noir", "레드 · 피노 누아", 13.5, US, "오리건 윌라멧 밸리", "Rex Hill", 50000, PN],
    ["킹 에스테이트 피노 누아", "King Estate Willamette Valley Pinot Noir", "레드 · 피노 누아", 13.5, US, "오리건 윌라멧 밸리", "King Estate", 45000, PN],
    ["코스타 브라운 소노마 코스트 피노 누아", "Kosta Browne Sonoma Coast Pinot Noir", "레드 · 피노 누아", 14.1, US, "캘리포니아 소노마 코스트", "Kosta Browne", 150000, PN],
    ["벨 글로스 클라크 앤 텔레폰 피노 누아", "Belle Glos Clark & Telephone Pinot Noir", "레드 · 피노 누아", 14.9, US, "캘리포니아 산타 마리아 밸리", "Belle Glos (Caymus)", 70000, PN],
    ["메이오미 피노 누아", "Meiomi Pinot Noir", "레드 · 피노 누아", 13.7, US, "캘리포니아", "Meiomi", 30000, PN],
    ["산포드 피노 누아", "Sanford Sta. Rita Hills Pinot Noir", "레드 · 피노 누아", 14, US, "캘리포니아 산타 리타 힐스", "Sanford Winery", 60000, PN],
    ["브루어 클리프턴 피노 누아", "Brewer-Clifton Sta. Rita Hills Pinot Noir", "레드 · 피노 누아", 14, US, "캘리포니아 산타 리타 힐스", "Brewer-Clifton", 80000, PN],
    ["칼레라 젠슨 빈야드 피노 누아", "Calera Mt. Harlan Jensen Vineyard Pinot Noir", "레드 · 피노 누아", 14, US, "캘리포니아 마운트 할런", "Calera Wine Company", 120000, PN],
  ].filter(([, en]) => en !== "x"));

  // ── 칠레 · 아르헨티나 · 우루과이
  rows("wine", "redFull", [
    ["콘차 이 토로 마르케스 데 카사 콘차 까베르네 소비뇽", "Concha y Toro Marqués de Casa Concha Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "칠레", "마이포 밸리", "Concha y Toro", 35000, CS],
    ["콘차 이 토로 테루뇨 까르메네르", "Concha y Toro Terrunyo Carmenère", "레드 · 까르메네르", 14.5, "칠레", "카차포알 밸리 페우모", "Concha y Toro", 60000, "Carmenère"],
    ["카르민 데 페우모", "Concha y Toro Carmín de Peumo", "레드 · 까르메네르", 14.5, "칠레", "카차포알 밸리 페우모", "Concha y Toro", 300000, "Carmenère"],
    ["몬테스 알파 엠", "Montes Alpha M", "레드 · 보르도 블렌드", 14.5, "칠레", "콜차구아 밸리 아팔타", "Viña Montes", 120000, BDX],
    ["몬테스 폴리 시라", "Montes Folly Syrah", "레드 · 시라", 15, "칠레", "콜차구아 밸리 아팔타", "Viña Montes", 120000, SY],
    ["산타 리타 메달라 레알 까베르네 소비뇽", "Santa Rita Medalla Real Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "칠레", "마이포 밸리", "Viña Santa Rita", 30000, CS],
    ["코노 수르 20 배럴 피노 누아", "Cono Sur 20 Barrels Pinot Noir", "레드 · 피노 누아", 14, "칠레", "카사블랑카 밸리", "Viña Cono Sur", 50000, PN, "pinot"],
    ["카사 실바 마이크로테루아 데 로스 링게스 까르메네르", "Casa Silva Microterroir de Los Lingues Carmenère", "레드 · 까르메네르", 14.5, "칠레", "콜차구아 밸리 로스 링게스", "Viña Casa Silva", 80000, "Carmenère"],
    ["에라주리즈 라스 피사라스 피노 누아", "Errázuriz Las Pizarras Pinot Noir", "레드 · 피노 누아", 13.5, "칠레", "아콩카과 코스타", "Viña Errázuriz", 120000, PN, "pinot"],
    ["코우시뇨 마쿨 피니스 테라에", "Cousiño-Macul Finis Terrae", "레드 · 보르도 블렌드", 14, "칠레", "마이포 밸리", "Viña Cousiño-Macul", 50000, "Cabernet Sauvignon/Merlot/Syrah"],
    ["데 마르티노 비에하스 티나하스 생소", "De Martino Viejas Tinajas Cinsault", "레드 · 이타타", 12.5, "칠레", "이타타 밸리", "De Martino", 40000, "Cinsault", "redMed"],
    ["카테나 알타 까베르네 소비뇽", "Catena Alta Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "아르헨티나", "멘도사", "Bodega Catena Zapata", 70000, CS],
    ["카테나 사파타 아드리아나 빈야드 문두스 바실루스 테라에 말벡", "Catena Zapata Adrianna Vineyard Mundus Bacillus Terrae Malbec", "레드 · 말벡", 13.5, "아르헨티나", "멘도사 우코 밸리 과티야이", "Bodega Catena Zapata", 400000, "Malbec"],
    ["테라사스 레세르바 말벡", "Terrazas de los Andes Reserva Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Terrazas de los Andes", 30000, "Malbec"],
    ["트라피체 테루아 시리즈 말벡", "Trapiche Terroir Series Finca Ambrosía Malbec", "레드 · 말벡", 14.5, "아르헨티나", "멘도사 우코 밸리", "Trapiche", 70000, "Malbec"],
    ["노르톤 레세르바 말벡", "Norton Reserva Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Bodega Norton", 25000, "Malbec"],
    ["수사나 발보 벤마르코 말벡", "Susana Balbo BenMarco Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Susana Balbo Wines", 35000, "Malbec"],
    ["주카르디 알루비오날 파라헤 알타미라", "Zuccardi Aluvional Paraje Altamira Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사 우코 밸리 알타미라", "Familia Zuccardi", 120000, "Malbec"],
    ["콜로메 에스테이트 말벡", "Colomé Estate Malbec", "레드 · 말벡", 14.5, "아르헨티나", "살타 칼차키 밸리", "Bodega Colomé", 40000, "Malbec"],
    ["엘 에스테코 올드 바인스 토론테스", "El Esteco Old Vines Torrontés", "화이트 · 토론테스", 13.5, "아르헨티나", "살타 카파야테", "El Esteco", 35000, "Torrontés", "whiteCrisp"],
    ["보데가 가르손 타나트 레세르바", "Bodega Garzón Tannat Reserva", "레드 · 타나트", 14, "우루과이", "말도나도", "Bodega Garzón", 35000, "Tannat"],
    ["보데가 가르손 알바리뇨 레세르바", "Bodega Garzón Albariño Reserva", "화이트 · 알바리뇨", 13, "우루과이", "말도나도", "Bodega Garzón", 35000, "Albariño", "whiteCrisp"],
  ].filter(([, en]) => en !== "x"));

  // ── 호주 · 뉴질랜드 · 남아공
  rows("wine", "redFull", [
    ["펜폴즈 빈 389", "Penfolds Bin 389 Cabernet Shiraz", "레드 · 까베르네 시라즈", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 100000, "Cabernet Sauvignon/Shiraz"],
    ["펜폴즈 빈 128", "Penfolds Bin 128 Coonawarra Shiraz", "레드 · 시라즈", 14.5, "호주", "쿠나와라", "Penfolds", 60000, "Shiraz"],
    ["펜폴즈 빈 28", "Penfolds Bin 28 Kalimna Shiraz", "레드 · 시라즈", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 60000, "Shiraz"],
    ["펜폴즈 빈 407", "Penfolds Bin 407 Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 100000, CS],
    ["토브렉 더 팩터", "Torbreck The Factor Shiraz", "레드 · 시라즈", 15, "호주", "바로사 밸리", "Torbreck Vintners", 200000, "Shiraz"],
    ["토브렉 우드커터스 시라즈", "Torbreck Woodcutter's Shiraz", "레드 · 시라즈", 15, "호주", "바로사 밸리", "Torbreck Vintners", 40000, "Shiraz"],
    ["엘더튼 커맨드 시라즈", "Elderton Command Single Vineyard Shiraz", "레드 · 시라즈", 14.5, "호주", "바로사 밸리", "Elderton Wines", 150000, "Shiraz"],
    ["얄룸바 더 시그너처", "Yalumba The Signature Cabernet Shiraz", "레드 · 까베르네 시라즈", 14.5, "호주", "바로사", "Yalumba", 90000, "Cabernet Sauvignon/Shiraz"],
    ["얄룸바 Y 시리즈 비오니에", "Yalumba Y Series Viognier", "화이트 · 비오니에", 13.5, "호주", "사우스 오스트레일리아", "Yalumba", 20000, "Viognier", "whiteCrisp"],
    ["다렌버그 데드 암", "d'Arenberg The Dead Arm Shiraz", "레드 · 시라즈", 14.5, "호주", "맥라렌 베일", "d'Arenberg", 90000, "Shiraz"],
    ["몰리두커 벨벳 글러브", "Mollydooker Velvet Glove Shiraz", "레드 · 시라즈", 16, "호주", "맥라렌 베일", "Mollydooker", 250000, "Shiraz"],
    ["몰리두커 더 박서", "Mollydooker The Boxer Shiraz", "레드 · 시라즈", 16, "호주", "맥라렌 베일", "Mollydooker", 50000, "Shiraz"],
    ["윈즈 쿠나와라 존 리독 까베르네 소비뇽", "Wynns Coonawarra John Riddoch Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "호주", "쿠나와라", "Wynns Coonawarra Estate", 150000, CS],
    ["윈즈 블랙 라벨 까베르네 소비뇽", "Wynns Black Label Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "호주", "쿠나와라", "Wynns Coonawarra Estate", 50000, CS],
    ["제이콥스 크릭 세인트 휴고 쿠나와라 까베르네 소비뇽", "Jacob's Creek St Hugo Coonawarra Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "호주", "쿠나와라", "Jacob's Creek (Pernod Ricard)", 60000, CS],
    ["그랜트 버지 메샤흐", "Grant Burge Meshach Shiraz", "레드 · 시라즈", 14.5, "호주", "바로사 밸리", "Grant Burge", 150000, "Shiraz"],
    ["피터 레만 스톤웰", "Peter Lehmann Stonewell Shiraz", "레드 · 시라즈", 14.5, "호주", "바로사 밸리", "Peter Lehmann", 100000, "Shiraz"],
    ["헨쉬키 헨리스 세븐", "Henschke Henry's Seven", "레드 · 시라즈 블렌드", 14.5, "호주", "바로사", "Henschke", 70000, "Shiraz/Grenache/Mataro/Viognier"],
    ["케이프 멘텔 까베르네 소비뇽", "Cape Mentelle Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "호주", "마거릿 리버", "Cape Mentelle", 80000, CS],
    ["클라우디 베이 테 코코", "Cloudy Bay Te Koko", "화이트 · 소비뇽 블랑 (오크)", 13.5, "뉴질랜드", "말보로", "Cloudy Bay", 90000, SB, "whiteCrisp"],
    ["클라우디 베이 피노 누아", "Cloudy Bay Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "말보로", "Cloudy Bay", 60000, PN, "pinot"],
    ["빌라 마리아 프라이빗 빈 소비뇽 블랑", "Villa Maria Private Bin Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "뉴질랜드", "말보로", "Villa Maria", 25000, SB, "whiteCrisp"],
    ["세레신 피노 누아", "Seresin Estate Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "말보로", "Seresin Estate", 60000, PN, "pinot"],
    ["프로펫스 록 피노 누아", "Prophet's Rock Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "센트럴 오타고", "Prophet's Rock", 90000, PN, "pinot"],
    ["마운트 디피컬티 배녹번 피노 누아", "Mt. Difficulty Bannockburn Pinot Noir", "레드 · 피노 누아", 14, "뉴질랜드", "센트럴 오타고", "Mt. Difficulty", 60000, PN, "pinot"],
    ["크래기 레인지 소피아", "Craggy Range Sophia", "레드 · 보르도 블렌드", 14, "뉴질랜드", "호크스 베이 김블렛 그래블스", "Craggy Range", 120000, "Merlot/Cabernet Franc/Cabernet Sauvignon"],
    ["테 마타 콜레레인", "Te Mata Coleraine", "레드 · 보르도 블렌드", 13.5, "뉴질랜드", "호크스 베이", "Te Mata Estate", 120000, BDX],
    ["테 마타 엘스턴 샤르도네", "Te Mata Elston Chardonnay", "화이트 · 샤르도네", 13.5, "뉴질랜드", "호크스 베이", "Te Mata Estate", 70000, CH, "whiteCrisp"],
    ["클라인 콘스탄시아 소비뇽 블랑", "Klein Constantia Estate Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "남아프리카공화국", "콘스탄시아", "Klein Constantia", 30000, SB, "whiteCrisp"],
    ["루스텐버그 존 X 메리먼", "Rustenberg John X Merriman", "레드 · 보르도 블렌드", 14.5, "남아프리카공화국", "스텔렌보스", "Rustenberg", 40000, BDX],
    ["메르스트 메를로", "Meerlust Merlot", "레드 · 메를로", 14, "남아프리카공화국", "스텔렌보스", "Meerlust Estate", 50000, "Merlot"],
    ["카농콥 피노타지", "Kanonkop Pinotage", "레드 · 피노타지", 14.5, "남아프리카공화국", "스텔렌보스", "Kanonkop Estate", 60000, "Pinotage"],
    ["새디 패밀리 팔라디우스", "Sadie Family Palladius", "화이트 · 스와틀랜드 블렌드", 13.5, "남아프리카공화국", "스와틀랜드", "Sadie Family Wines", 200000, "Chenin Blanc/Grenache Blanc/Roussanne", "whiteCrisp"],
    ["뮬리뉴 시라", "Mullineux Syrah", "레드 · 시라", 14, "남아프리카공화국", "스와틀랜드", "Mullineux", 60000, SY],
    ["워윅 트릴로지", "Warwick Estate Trilogy", "레드 · 보르도 블렌드", 14.5, "남아프리카공화국", "스텔렌보스", "Warwick Estate", 50000, BDX],
    ["토카라 디렉터스 리저브 레드", "Tokara Director's Reserve Red", "레드 · 보르도 블렌드", 14.5, "남아프리카공화국", "스텔렌보스", "Tokara", 70000, BDX],
    ["그레이엄 벡 브뤼", "Graham Beck Brut NV", "스파클링 · 캡 클라시크", 12, "남아프리카공화국", "로버트슨", "Graham Beck", 30000, "Chardonnay/Pinot Noir", "bubbly"],
  ].filter(([, en]) => en !== "x"));


  // ── 보르도 크뤼 부르주아 · 위성 산지
  rows("wine", "redFull", [
    ["샤또 포탕삭", "Château Potensac", "레드 · 메독", 13.5, F, "보르도 메독", "Domaines Delon", 50000, BDX],
    ["샤또 시랑", "Château Siran", "레드 · 마고", 13.5, F, "보르도 마고", "Château Siran", 60000, BDX],
    ["샤또 라베고르스", "Château Labégorce", "레드 · 마고", 13.5, F, "보르도 마고", "Château Labégorce", 60000, BDX],
    ["샤또 당글뤼데", "Château d'Angludet", "레드 · 마고", 13.5, F, "보르도 마고", "Famille Sichel", 60000, BDX],
    ["샤또 몽브리송", "Château Monbrison", "레드 · 마고", 13.5, F, "보르도 마고", "Château Monbrison", 70000, BDX],
    ["샤또 푸르카 오스탕", "Château Fourcas Hosten", "레드 · 리스트락 메독", 13.5, F, "보르도 리스트락", "Château Fourcas Hosten", 40000, BDX],
    ["샤또 클라르크", "Château Clarke", "레드 · 리스트락 메독", 13.5, F, "보르도 리스트락", "Edmond de Rothschild Heritage", 50000, "Merlot/Cabernet Sauvignon"],
    ["샤또 라네상", "Château Lanessan", "레드 · 오 메독", 13.5, F, "보르도 오 메독", "Château Lanessan", 40000, BDX],
    ["샤또 시트랑", "Château Citran", "레드 · 오 메독", 13.5, F, "보르도 오 메독", "Château Citran", 35000, BDX],
    ["샤또 라로즈 트랭토동", "Château Larose-Trintaudon", "레드 · 오 메독", 13.5, F, "보르도 오 메독", "Château Larose-Trintaudon", 30000, BDX],
    ["샤또 릴리앙 라두이", "Château Lilian Ladouys", "레드 · 생테스테프", 13.5, F, "보르도 생테스테프", "Château Lilian Ladouys", 50000, BDX],
    ["샤또 트롱코이 라랑드", "Château Tronquoy-Lalande", "레드 · 생테스테프", 13.5, F, "보르도 생테스테프", "Château Tronquoy-Lalande (Bouygues)", 60000, BDX],
    ["샤또 오 마르뷔제", "Château Haut-Marbuzet", "레드 · 생테스테프", 13.5, F, "보르도 생테스테프", "Famille Duboscq", 70000, BDX],
    ["샤또 카프베른", "Château Capbern", "레드 · 생테스테프", 13.5, F, "보르도 생테스테프", "Château Calon-Ségur", 40000, BDX],
    ["샤또 레 조름 소르베", "Château Les Ormes Sorbet", "레드 · 메독", 13.5, F, "보르도 메독", "Château Les Ormes Sorbet", 35000, BDX],
    ["샤또 그레이삭", "Château Greysac", "레드 · 메독", 13, F, "보르도 메독", "Château Greysac", 30000, BDX],
    ["샤또 파타슈 도", "Château Patache d'Aux", "레드 · 메독", 13, F, "보르도 메독", "Château Patache d'Aux", 30000, BDX],
    ["샤또 투르 드 비", "Château Tour de By", "레드 · 메독", 13.5, F, "보르도 메독", "Château Tour de By", 30000, BDX],
    ["샤또 시삭", "Château Cissac", "레드 · 오 메독", 13.5, F, "보르도 오 메독", "Château Cissac", 35000, BDX],
    ["샤또 뒤 글라나", "Château du Glana", "레드 · 생쥘리앙", 13.5, F, "보르도 생쥘리앙", "Château du Glana", 50000, BDX],
    ["샤또 글로리아", "Château Gloria", "레드 · 생쥘리앙", 13.5, F, "보르도 생쥘리앙", "Domaines Henri Martin", 70000, BDX],
    ["샤또 퐁바데", "Château Fonbadet", "레드 · 포이약", 13.5, F, "보르도 포이약", "Château Fonbadet", 60000, BDX],
    ["샤또 피브랑", "Château Pibran", "레드 · 포이약", 13.5, F, "보르도 포이약", "AXA Millésimes", 60000, BDX],
    ["샤또 오 바주 리베랄", "Château Haut-Bages Libéral", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 포이약", "Château Haut-Bages Libéral", 80000, BDX],
    ["샤또 페데클로", "Château Pédesclaux", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 포이약", "Famille Lorenzetti", 70000, BDX],
    ["샤또 크루아제 바주", "Château Croizet-Bages", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 포이약", "Château Croizet-Bages", 60000, BDX],
    ["샤또 린치 무사", "Château Lynch-Moussas", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 포이약", "Famille Castéja", 60000, BDX],
    ["샤또 그랑 퓌 뒤카스", "Château Grand-Puy Ducasse", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 포이약", "Château Grand-Puy Ducasse", 70000, BDX],
    ["샤또 벨그라브", "Château Belgrave", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 오 메독", "Château Belgrave", 50000, BDX],
    ["샤또 드 카망삭", "Château de Camensac", "레드 · 보르도 그랑 크뤼 5등급", 13.5, F, "보르도 오 메독", "Château de Camensac", 50000, BDX],
    ["샤또 마르키 달렘", "Château Marquis d'Alesme", "레드 · 보르도 그랑 크뤼 3등급", 13.5, F, "보르도 마고", "Château Marquis d'Alesme", 80000, BDX],
    ["샤또 페리에르", "Château Ferrière", "레드 · 보르도 그랑 크뤼 3등급", 13.5, F, "보르도 마고", "Château Ferrière", 70000, BDX],
    ["샤또 푸제", "Château Pouget", "레드 · 보르도 그랑 크뤼 4등급", 13.5, F, "보르도 마고", "Château Pouget", 60000, BDX],
    ["샤또 부아드 캉트낙", "Château Boyd-Cantenac", "레드 · 보르도 그랑 크뤼 3등급", 13.5, F, "보르도 마고", "Château Boyd-Cantenac", 70000, BDX],
    ["샤또 데스미라이", "Château Desmirail", "레드 · 보르도 그랑 크뤼 3등급", 13.5, F, "보르도 마고", "Château Desmirail", 60000, BDX],
    ["샤또 부스코 루즈", "Château Bouscaut Rouge", "레드 · 그라브 크뤼 클라세", 13.5, F, "보르도 페삭 레오냥", "Château Bouscaut", 50000, BDX],
    ["샤또 라투르 마르티약 루즈", "Château Latour-Martillac Rouge", "레드 · 그라브 크뤼 클라세", 13.5, F, "보르도 페삭 레오냥", "Famille Kressmann", 60000, BDX],
    ["샤또 라 루비에르 루즈", "Château La Louvière Rouge", "레드 · 페삭 레오냥", 13.5, F, "보르도 페삭 레오냥", "André Lurton", 60000, BDX],
    ["샤또 레 카름 오브리옹", "Château Les Carmes Haut-Brion", "레드 · 페삭 레오냥", 14, F, "보르도 페삭 레오냥", "Château Les Carmes Haut-Brion", 200000, "Cabernet Franc/Merlot/Cabernet Sauvignon"],
    ["샤또 오 베르제", "Château Haut-Bergey", "레드 · 페삭 레오냥", 13.5, F, "보르도 페삭 레오냥", "Château Haut-Bergey", 60000, BDX],
    ["샤또 카농 라 가플리에르", "Château Canon-la-Gaffelière", "레드 · 생테밀리옹 1등급 B", 14, F, "보르도 생테밀리옹", "Comtes von Neipperg", 200000, "Merlot/Cabernet Franc/Cabernet Sauvignon"],
    ["라 몽도트", "La Mondotte", "레드 · 생테밀리옹 1등급 B", 14.5, F, "보르도 생테밀리옹", "Comtes von Neipperg", 500000, RB],
    ["샤또 라르시 뒤카스", "Château Larcis Ducasse", "레드 · 생테밀리옹 1등급 B", 14, F, "보르도 생테밀리옹", "Château Larcis Ducasse", 150000, RB],
    ["샤또 파비 마캥", "Château Pavie Macquin", "레드 · 생테밀리옹 1등급 B", 14.5, F, "보르도 생테밀리옹", "Château Pavie Macquin", 130000, RB],
    ["샤또 테르트르 로트뵈프", "Château Tertre Rotebœuf", "레드 · 생테밀리옹 그랑 크뤼", 14.5, F, "보르도 생테밀리옹", "François Mitjavile", 400000, RB],
    ["샤또 몽부스케", "Château Monbousquet", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14.5, F, "보르도 생테밀리옹", "Gérard Perse", 80000, RB],
    ["샤또 그랑 메인", "Château Grand Mayne", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14.5, F, "보르도 생테밀리옹", "Château Grand Mayne", 80000, RB],
    ["샤또 퐁브로주", "Château Fombrauge", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Bernard Magrez", 50000, RB],
    ["샤또 쉬타르", "Château Soutard", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Château Soutard", 60000, RB],
    ["샤또 다소", "Château Dassault", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Château Dassault", 60000, RB],
    ["샤또 라 도미니크", "Château La Dominique", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Famille Fayat", 80000, RB],
    ["샤또 바르드 오", "Château Barde-Haut", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14.5, F, "보르도 생테밀리옹", "Château Barde-Haut", 60000, RB],
    ["클로 드 로라투아르", "Clos de l'Oratoire", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Comtes von Neipperg", 70000, RB],
    ["샤또 퐁플레가드", "Château Fonplégade", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Château Fonplégade", 70000, RB],
    ["샤또 라 투르 피자크", "Château La Tour Figeac", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Château La Tour Figeac", 70000, RB],
    ["샤또 그랑 코르뱅 데스판뉴", "Château Grand Corbin-Despagne", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Famille Despagne", 60000, RB],
    ["샤또 플뢰르 카르디날", "Château Fleur Cardinale", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14, F, "보르도 생테밀리옹", "Château Fleur Cardinale", 60000, RB],
    ["샤또 르 봉 파스퇴르", "Château Le Bon Pasteur", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Le Bon Pasteur", 120000, RB],
    ["샤또 라 플뢰르 드 게", "Château La Fleur de Gay", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château La Croix de Gay", 150000, "Merlot"],
    ["샤또 세르탕 드 메", "Château Certan de May", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Certan de May", 150000, RB],
    ["샤또 부르뇌프", "Château Bourgneuf", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Bourgneuf", 90000, RB],
    ["샤또 라 푸앵트", "Château La Pointe", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château La Pointe", 80000, RB],
    ["샤또 루제", "Château Rouget", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Rouget", 90000, RB],
    ["샤또 르 게", "Château Le Gay", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Le Gay", 200000, RB],
    ["샤또 오잔나", "Château Hosanna", "레드 · 포므롤", 14, F, "보르도 포므롤", "Établissements Jean-Pierre Moueix", 400000, RB],
    ["샤또 페이티 클리네", "Château Feytit-Clinet", "레드 · 포므롤", 14, F, "보르도 포므롤", "Famille Chasseuil", 150000, RB],
    ["샤또 라 비올레트", "Château La Violette", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château La Violette", 300000, "Merlot"],
    ["샤또 마제르", "Château Mazeyres", "레드 · 포므롤", 14, F, "보르도 포므롤", "Château Mazeyres", 60000, RB],
    ["샤또 드 라 리비에르", "Château de la Rivière", "레드 · 프롱삭", 14, F, "보르도 프롱삭", "Château de la Rivière", 40000, RB],
    ["샤또 달렘", "Château Dalem", "레드 · 프롱삭", 14, F, "보르도 프롱삭", "Château Dalem", 35000, RB],
    ["샤또 라 비에유 퀴르", "Château La Vieille Cure", "레드 · 프롱삭", 14, F, "보르도 프롱삭", "Château La Vieille Cure", 40000, RB],
    ["샤또 록 드 캉브", "Château Roc de Cambes", "레드 · 코트 드 부르", 14, F, "보르도 코트 드 부르", "François Mitjavile", 70000, RB],
    ["샤또 퓌게로", "Château Puygueraud", "레드 · 프랑 코트 드 보르도", 14, F, "보르도 프랑", "Famille Thienpont", 35000, RB],
    ["샤또 데귀유", "Château d'Aiguilhe", "레드 · 카스티용 코트 드 보르도", 14, F, "보르도 카스티용", "Comtes von Neipperg", 40000, RB],
    ["샤또 주아냉 베코", "Château Joanin Bécot", "레드 · 카스티용 코트 드 보르도", 14, F, "보르도 카스티용", "Famille Bécot", 40000, RB],
    ["샤또 클로 퓌가르? ".replace("? ", ""), "x", "", 0, F, "", "", 0, RB],
  ].filter(([, en]) => en !== "x"));
  rows("wine", "sweet", [
    ["샤또 리외섹", "Château Rieussec", "스위트 · 소테른 1등급", 14, F, "보르도 소테른", "Domaines Barons de Rothschild (Lafite)", 120000, "Sémillon/Sauvignon Blanc"],
    ["샤또 쉬뒤로", "Château Suduiraut", "스위트 · 소테른 1등급", 14, F, "보르도 소테른", "AXA Millésimes", 120000, "Sémillon/Sauvignon Blanc"],
    ["샤또 클리망", "Château Climens", "스위트 · 바르삭 1등급", 13.5, F, "보르도 바르삭", "Château Climens", 150000, "Sémillon"],
    ["샤또 쿠테", "Château Coutet", "스위트 · 바르삭 1등급", 14, F, "보르도 바르삭", "Château Coutet", 100000, "Sémillon/Sauvignon Blanc/Muscadelle"],
    ["샤또 기로", "Château Guiraud", "스위트 · 소테른 1등급", 14, F, "보르도 소테른", "Château Guiraud", 100000, "Sémillon/Sauvignon Blanc"],
    ["샤또 두아지 다엔", "Château Doisy-Daëne", "스위트 · 바르삭 2등급", 13.5, F, "보르도 바르삭", "Famille Dubourdieu", 80000, "Sémillon/Sauvignon Blanc"],
    ["샤또 라 투르 블랑슈", "Château La Tour Blanche", "스위트 · 소테른 1등급", 13.5, F, "보르도 소테른", "Château La Tour Blanche", 90000, "Sémillon/Sauvignon Blanc/Muscadelle"],
    ["샤또 라포리 페라게", "Château Lafaurie-Peyraguey", "스위트 · 소테른 1등급", 13.5, F, "보르도 소테른", "Château Lafaurie-Peyraguey (Lalique)", 100000, "Sémillon/Sauvignon Blanc"],
    ["샤또 드 파르그", "Château de Fargues", "스위트 · 소테른", 14, F, "보르도 소테른", "Famille Lur-Saluces", 300000, "Sémillon/Sauvignon Blanc"],
  ]);
  rows("wine", "whiteCrisp", [
    ["샤또 스미스 오 라피트 블랑", "Château Smith Haut Lafitte Blanc", "화이트 · 페삭 레오냥", 13.5, F, "보르도 페삭 레오냥", "Famille Cathiard", 250000, "Sauvignon Blanc/Sémillon"],
    ["샤또 라투르 마르티약 블랑", "Château Latour-Martillac Blanc", "화이트 · 그라브 크뤼 클라세", 13.5, F, "보르도 페삭 레오냥", "Famille Kressmann", 60000, "Sauvignon Blanc/Sémillon"],
    ["샤또 쿠앵 뤼르통", "Château Couhins-Lurton", "화이트 · 그라브 크뤼 클라세", 13.5, F, "보르도 페삭 레오냥", "André Lurton", 60000, SB],
    ["클로 플로리덴 블랑", "Clos Floridène Blanc", "화이트 · 그라브", 13, F, "보르도 그라브", "Famille Dubourdieu", 40000, "Sauvignon Blanc/Sémillon"],
    ["파비용 블랑 뒤 샤또 마고", "Pavillon Blanc du Château Margaux", "화이트 · 보르도 블랑", 14, F, "보르도 마고", "Château Margaux", 400000, SB],
    ["샤또 오 브리옹 블랑? ".replace("? ", ""), "x", "", 0, F, "", "", 0, SB],
    ["에일 다르장", "Aile d'Argent", "화이트 · 보르도 블랑", 13.5, F, "보르도 포이약", "Château Mouton Rothschild", 300000, "Sauvignon Blanc/Sémillon"],
  ].filter(([, en]) => en !== "x"));

  // ── 부르고뉴 빌라주 (생산자 × 마을)
  rows("wine", "pinot", [
    ["앙투안 지라르댕? ".replace("? ", ""), "x", "", 0, F, "", "", 0, PN],
    ["도멘 미셸 라파르주 볼네 비에유 비뉴", "Domaine Michel Lafarge Volnay Vendanges Sélectionnées", "레드 · 빌라주", 13, F, "부르고뉴 볼네", "Domaine Michel Lafarge", 150000, PN],
    ["도멘 니콜라 로시뇰 볼네", "Domaine Nicolas Rossignol Volnay", "레드 · 빌라주", 13, F, "부르고뉴 볼네", "Domaine Nicolas Rossignol", 80000, PN],
    ["도멘 샹동 드 브리아유 사비니 레 본", "Domaine Chandon de Briailles Savigny-lès-Beaune", "레드 · 빌라주", 12.5, F, "부르고뉴 사비니 레 본", "Domaine Chandon de Briailles", 60000, PN],
    ["도멘 데 크루아 본 1er 크뤼 레 브레상드", "Domaine des Croix Beaune 1er Cru Bressandes", "레드 · 본 1er Cru", 13, F, "부르고뉴 본", "Domaine des Croix", 100000, PN],
    ["도멘 드 레스피네? ".replace("? ", ""), "x", "", 0, F, "", "", 0, PN],
    ["도멘 위들로 노엘라 본 로마네", "Domaine Hudelot-Noëllat Vosne-Romanée", "레드 · 빌라주", 13, F, "부르고뉴 본 로마네", "Domaine Hudelot-Noëllat", 200000, PN],
    ["도멘 몽제아르 뮈뉴레 에셰조", "Domaine Mongeard-Mugneret Échezeaux Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 본 로마네", "Domaine Mongeard-Mugneret", 300000, PN],
    ["도멘 프랑수아 라마르슈 본 로마네", "Domaine François Lamarche Vosne-Romanée", "레드 · 빌라주", 13, F, "부르고뉴 본 로마네", "Domaine François Lamarche", 150000, PN],
    ["도멘 베르트랑 앙브루아즈 뉘 생 조르주", "Domaine Bertrand Ambroise Nuits-Saint-Georges", "레드 · 빌라주", 13, F, "부르고뉴 뉘 생 조르주", "Domaine Bertrand Ambroise", 70000, PN],
    ["도멘 프리외르 로슈 뉘 생 조르주 클로 데 코르베", "Domaine Prieuré Roch Nuits-Saint-Georges Clos des Corvées", "레드 · 뉘 생 조르주 1er Cru 모노폴", 13, F, "부르고뉴 뉘 생 조르주", "Domaine Prieuré Roch", 250000, PN],
    ["도멘 위베르 리니에 모레 생드니", "Domaine Hubert Lignier Morey-Saint-Denis", "레드 · 빌라주", 13, F, "부르고뉴 모레 생드니", "Domaine Hubert Lignier", 150000, PN],
    ["도멘 필리프 파칼레 쥐브레 샹베르탱", "Philippe Pacalet Gevrey-Chambertin", "레드 · 빌라주", 12.5, F, "부르고뉴 쥐브레 샹베르탱", "Philippe Pacalet", 150000, PN],
    ["도멘 앙리 리옹? ".replace("? ", ""), "x", "", 0, F, "", "", 0, PN],
    ["메종 앙드레 구아쇼? ".replace("? ", ""), "x", "", 0, F, "", "", 0, PN],
    ["도멘 실뱅 파타유 마르사네 랑세스트랄", "Domaine Sylvain Pataille Marsannay L'Ancestrale", "레드 · 마르사네", 13, F, "부르고뉴 마르사네", "Domaine Sylvain Pataille", 80000, PN],
    ["도멘 브뤼노 클레르 마르사네 레 롱주루아", "Domaine Bruno Clair Marsannay Les Longeroies", "레드 · 마르사네", 13, F, "부르고뉴 마르사네", "Domaine Bruno Clair", 60000, PN],
    ["도멘 장 푸르니에 마르사네", "Domaine Jean Fournier Marsannay", "레드 · 마르사네", 13, F, "부르고뉴 마르사네", "Domaine Jean Fournier", 50000, PN],
  ].filter(([, en]) => en !== "x"));

  // ── 데일리 와인 (국내 유통 많은 라인업)
  rows("wine", "redMed", [
    ["E. 기갈 크로즈 에르미타주 루즈", "E. Guigal Crozes-Hermitage Rouge", "레드 · 크로즈 에르미타주", 13.5, F, "론 크로즈 에르미타주", "E. Guigal", 45000, SY],
    ["페랭 코트 뒤 론 레제르브 루즈", "Famille Perrin Côtes du Rhône Réserve Rouge", "레드 · 코트 뒤 론", 14, F, "론", "Famille Perrin", 25000, "Grenache/Syrah/Mourvèdre"],
    ["라 비에유 페름 루즈", "La Vieille Ferme Rouge", "레드 · 방투", 13.5, F, "론 방투", "Famille Perrin", 15000, "Grenache/Syrah/Cinsault/Carignan"],
    ["델라스 크로즈 에르미타주 레 레샤스? ".replace("? ", ""), "x", "", 0, F, "", "", 0, SY],
    ["델라스 생 조제프 프랑수아 드 투르농", "Delas Saint-Joseph François de Tournon", "레드 · 생 조제프", 13.5, F, "론 생 조제프", "Delas Frères", 50000, SY],
    ["바롱 필립 드 로칠드 에스쿠도 로호", "Baron Philippe de Rothschild Escudo Rojo Gran Reserva", "레드 · 보르도 블렌드", 14, "칠레", "마이포 밸리", "Baron Philippe de Rothschild Maipo Chile", 25000, "Cabernet Sauvignon/Carmenère/Syrah/Cabernet Franc", "redFull"],
    ["라포스톨 그랑 셀렉시옹 까르메네르", "Lapostolle Grand Selection Carmenère", "레드 · 까르메네르", 14, "칠레", "라펠 밸리", "Lapostolle", 20000, "Carmenère", "redFull"],
    ["몬테스 알파 시라", "Montes Alpha Syrah", "레드 · 시라", 14.5, "칠레", "콜차구아 밸리", "Viña Montes", 35000, SY, "redFull"],
    ["몬테스 알파 까르메네르", "Montes Alpha Carmenère", "레드 · 까르메네르", 14.5, "칠레", "콜차구아 밸리", "Viña Montes", 35000, "Carmenère", "redFull"],
    ["몬테스 알파 피노 누아", "Montes Alpha Pinot Noir", "레드 · 피노 누아", 14, "칠레", "아콩카과 코스타", "Viña Montes", 35000, PN, "pinot"],
    ["몬테스 아우스? ".replace("? ", ""), "x", "", 0, "칠레", "", "", 0, CS],
    ["코노 수르 비시클레타 피노 누아", "Cono Sur Bicicleta Pinot Noir", "레드 · 피노 누아", 13.5, "칠레", "센트럴 밸리", "Viña Cono Sur", 12000, PN, "pinot"],
    ["산타 리타 120 까베르네 소비뇽", "Santa Rita 120 Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "칠레", "센트럴 밸리", "Viña Santa Rita", 10000, CS],
    ["산 페드로 1865 셀렉티드 빈야드 까베르네 소비뇽", "San Pedro 1865 Selected Vineyards Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "칠레", "마이포 밸리", "Viña San Pedro", 25000, CS, "redFull"],
    ["산 페드로 알타이르", "San Pedro Altaïr", "레드 · 보르도 블렌드", 14.5, "칠레", "카차포알 밸리", "Viña San Pedro", 100000, BDX, "redFull"],
    ["언두라가 T.H. 까베르네 소비뇽", "Undurraga T.H. Terroir Hunter Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "칠레", "마이포 알토", "Viña Undurraga", 40000, CS, "redFull"],
    ["발디비에소 카바요 로코 그랑 크뤼", "Valdivieso Caballo Loco Grand Cru", "레드 · 블렌드", 14.5, "칠레", "마이포 밸리", "Viña Valdivieso", 70000, "Cabernet Sauvignon/Carmenère", "redFull"],
    ["트라피체 오크 캐스크 말벡", "Trapiche Oak Cask Malbec", "레드 · 말벡", 13.5, "아르헨티나", "멘도사", "Trapiche", 15000, "Malbec", "redFull"],
    ["알타비스타 클라시크 말벡", "Altavista Classic Malbec", "레드 · 말벡", 14, "아르헨티나", "멘도사", "Bodega Altavista", 20000, "Malbec", "redFull"],
    ["루티니 까베르네 말벡", "Rutini Cabernet Malbec", "레드 · 까베르네 말벡", 14, "아르헨티나", "멘도사 우코 밸리", "Rutini Wines", 35000, "Cabernet Sauvignon/Malbec", "redFull"],
    ["카이켄 울트라 까베르네 소비뇽", "Kaiken Ultra Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "아르헨티나", "멘도사", "Kaiken (Montes)", 30000, CS, "redFull"],
    ["펜폴즈 쿠눙가 힐 시라즈 까베르네", "Penfolds Koonunga Hill Shiraz Cabernet", "레드 · 시라즈 까베르네", 14, "호주", "사우스 오스트레일리아", "Penfolds", 20000, "Shiraz/Cabernet Sauvignon", "redFull"],
    ["펜폴즈 맥스 시라즈", "Penfolds Max's Shiraz", "레드 · 시라즈", 14.5, "호주", "사우스 오스트레일리아", "Penfolds", 35000, "Shiraz", "redFull"],
    ["옐로 테일 시라즈", "Yellow Tail Shiraz", "레드 · 시라즈", 13.5, "호주", "사우스 이스턴 오스트레일리아", "Casella Family Brands", 10000, "Shiraz"],
    ["울프 블라스 옐로 라벨 까베르네 소비뇽", "Wolf Blass Yellow Label Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "호주", "사우스 오스트레일리아", "Wolf Blass", 18000, CS],
    ["제이콥스 크릭 더블 배럴 시라즈", "Jacob's Creek Double Barrel Shiraz", "레드 · 시라즈", 14.5, "호주", "바로사 밸리", "Jacob's Creek (Pernod Ricard)", 30000, "Shiraz", "redFull"],
    ["투 핸즈 에인절스 셰어 시라즈", "Two Hands Angels' Share Shiraz", "레드 · 시라즈", 14.5, "호주", "맥라렌 베일", "Two Hands Wines", 45000, "Shiraz", "redFull"],
    ["얄룸바 패치워크 시라즈", "Yalumba Patchwork Shiraz", "레드 · 시라즈", 14, "호주", "바로사", "Yalumba", 30000, "Shiraz", "redFull"],
    ["린드만 빈 50 시라즈", "Lindeman's Bin 50 Shiraz", "레드 · 시라즈", 13.5, "호주", "사우스 이스턴 오스트레일리아", "Lindeman's", 12000, "Shiraz"],
    ["킴 크로포드 피노 누아", "Kim Crawford Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "말보로", "Kim Crawford", 30000, PN, "pinot"],
    ["오이스터 베이 피노 누아", "Oyster Bay Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "말보로", "Oyster Bay Wines", 25000, PN, "pinot"],
    ["베린저 파운더스 에스테이트 까베르네 소비뇽", "Beringer Founders' Estate Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.9, US, "캘리포니아", "Beringer Vineyards", 20000, CS],
    ["로버트 몬다비 프라이빗 셀렉션 까베르네 소비뇽", "Robert Mondavi Private Selection Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, US, "캘리포니아", "Robert Mondavi Winery", 20000, CS],
    ["J. 로르 세븐 오크스 까베르네 소비뇽", "J. Lohr Seven Oaks Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.9, US, "캘리포니아 파소 로블레스", "J. Lohr Vineyards", 30000, CS],
    ["켄달 잭슨 빈트너스 리저브 샤르도네", "Kendall-Jackson Vintner's Reserve Chardonnay", "화이트 · 샤르도네", 13.5, US, "캘리포니아", "Kendall-Jackson", 25000, CH, "whiteCrisp"],
    ["라 크레마 소노마 코스트 피노 누아", "La Crema Sonoma Coast Pinot Noir", "레드 · 피노 누아", 13.5, US, "캘리포니아 소노마 코스트", "La Crema", 35000, PN, "pinot"],
    ["조쉬 셀러스 까베르네 소비뇽", "Josh Cellars Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, US, "캘리포니아", "Josh Cellars", 20000, CS],
    ["보글 올드 바인 진판델", "Bogle Old Vine Zinfandel", "레드 · 진판델", 14.5, US, "캘리포니아", "Bogle Vineyards", 20000, "Zinfandel"],
    ["19 크라임스 레드 블렌드", "19 Crimes Red Blend", "레드 · 블렌드", 13.5, "호주", "사우스 이스턴 오스트레일리아", "Treasury Wine Estates", 15000, "Shiraz/Cabernet Sauvignon"],
    ["안티노리 산타 크리스티나 로소", "Antinori Santa Cristina Rosso", "레드 · 토스카나 IGT", 13, I, "토스카나", "Marchesi Antinori", 15000, "Sangiovese/Merlot", "italian"],
    ["루피노 리제르바 두칼레 오로", "Ruffino Riserva Ducale Oro Chianti Classico Gran Selezione", "레드 · 키안티 클라시코 그란 셀레치오네", 13.5, I, "토스카나 키안티", "Ruffino", 50000, SAN, "italian"],
    ["반피 키안티 클라시코", "Banfi Chianti Classico", "레드 · 키안티 클라시코", 13, I, "토스카나 키안티", "Castello Banfi", 25000, SAN, "italian"],
    ["카세 비아 네로 다볼라? ".replace("? ", ""), "x", "", 0, I, "", "", 0, "Nero d'Avola"],
    ["파스쿠아 아마로네? ".replace("? ", ""), "x", "", 0, I, "", "", 0, "Corvina"],
    ["토르 디 메초? ".replace("? ", ""), "x", "", 0, I, "", "", 0, "Primitivo"],
    ["체사리 아마로네 클라시코", "Cesari Amarone della Valpolicella Classico", "레드 · 아마로네", 15.5, I, "베네토 발폴리첼라", "Gerardo Cesari", 50000, "Corvina/Rondinella/Molinara", "italian"],
    ["파르네세 판티니 몬테풀치아노 다브루초", "Farnese Fantini Montepulciano d'Abruzzo", "레드 · 몬테풀치아노 다브루초", 13, I, "아브루초", "Farnese Vini", 12000, "Montepulciano", "italian"],
    ["보데가스 토레스 산그레 데 토로", "Torres Sangre de Toro", "레드 · 카탈루냐", 13.5, E, "카탈루냐", "Familia Torres", 15000, "Garnacha/Cariñena", "spanish"],
    ["캄포 비에호 레세르바", "Campo Viejo Reserva", "레드 · 리오하 레세르바", 13.5, E, "리오하", "Bodegas Campo Viejo", 20000, "Tempranillo/Graciano/Mazuelo", "spanish"],
    ["바론 데 레이 그란 레세르바", "Barón de Ley Gran Reserva", "레드 · 리오하 그란 레세르바", 14, E, "리오하", "Barón de Ley", 35000, TEM, "spanish"],
    ["펠리페 루터? ".replace("? ", ""), "x", "", 0, E, "", "", 0, TEM],
    ["프로토스 크리안사", "Protos Crianza", "레드 · 리베라 델 두에로 크리안사", 14, E, "카스티야 이 레온 리베라 델 두에로", "Bodegas Protos", 30000, TEM, "spanish"],
    ["보데가스 보르사오 트레스 피코스", "Bodegas Borsao Tres Picos Garnacha", "레드 · 캄포 데 보르하", 15, E, "아라곤 캄포 데 보르하", "Bodegas Borsao", 25000, "Garnacha", "spanish"],
    ["프레시넷 코르동 로사도? ".replace("? ", ""), "x", "", 0, E, "", "", 0, "Trepat"],
  ].filter(([, en]) => en !== "x"));


  // ── 부르고뉴 그랑 크뤼 · 1er 크뤼 (도멘별)
  rows("wine", "pinot", [
    ["도멘 아르망 루소 샹베르탱", "Domaine Armand Rousseau Chambertin Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Armand Rousseau", 2500000, PN],
    ["도멘 아르망 루소 클로 생 자크", "Domaine Armand Rousseau Gevrey-Chambertin 1er Cru Clos Saint-Jacques", "레드 · 쥐브레 샹베르탱 1er Cru", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Armand Rousseau", 1200000, PN],
    ["도멘 아르망 루소 클로 드 라 로슈", "Domaine Armand Rousseau Clos de la Roche Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 모레 생드니", "Domaine Armand Rousseau", 900000, PN],
    ["도멘 뒤작 클로 드 라 로슈", "Domaine Dujac Clos de la Roche Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 모레 생드니", "Domaine Dujac", 700000, PN],
    ["도멘 뒤작 클로 생드니", "Domaine Dujac Clos Saint-Denis Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 모레 생드니", "Domaine Dujac", 700000, PN],
    ["도멘 퐁소 클로 드 라 로슈 비에유 비뉴", "Domaine Ponsot Clos de la Roche Vieilles Vignes", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 모레 생드니", "Domaine Ponsot", 800000, PN],
    ["도멘 조르주 루미에 본 마르", "Domaine Georges Roumier Bonnes-Mares Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 샹볼 뮈지니", "Domaine Georges Roumier", 2000000, PN],
    ["도멘 콩트 조르주 드 보귀에 뮈지니 비에유 비뉴", "Domaine Comte Georges de Vogüé Musigny Vieilles Vignes", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 샹볼 뮈지니", "Domaine Comte Georges de Vogüé", 2000000, PN],
    ["도멘 콩트 조르주 드 보귀에 본 마르", "Domaine Comte Georges de Vogüé Bonnes-Mares", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 샹볼 뮈지니", "Domaine Comte Georges de Vogüé", 1000000, PN],
    ["도멘 자크 프레데리크 뮈니에 뮈지니", "Domaine Jacques-Frédéric Mugnier Musigny Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 샹볼 뮈지니", "Domaine Jacques-Frédéric Mugnier", 2500000, PN],
    ["도멘 자크 프레데리크 뮈니에 클로 드 라 마레샬", "Domaine Jacques-Frédéric Mugnier Nuits-Saint-Georges 1er Cru Clos de la Maréchale", "레드 · 뉘 생 조르주 1er Cru 모노폴", 13, F, "부르고뉴 뉘 생 조르주", "Domaine Jacques-Frédéric Mugnier", 250000, PN],
    ["도멘 뒤 콩트 리제 벨레르 라 로마네", "Domaine du Comte Liger-Belair La Romanée Grand Cru", "레드 · 그랑 크뤼 모노폴", 13.5, F, "부르고뉴 본 로마네", "Domaine du Comte Liger-Belair", 5000000, PN],
    ["도멘 뒤 콩트 리제 벨레르 본 로마네 라 콜롬비에르", "Domaine du Comte Liger-Belair Vosne-Romanée La Colombière", "레드 · 빌라주", 13, F, "부르고뉴 본 로마네", "Domaine du Comte Liger-Belair", 400000, PN],
    ["도멘 르루아 리쉬부르", "Domaine Leroy Richebourg Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 본 로마네", "Domaine Leroy", 8000000, PN],
    ["도멘 르루아 본 로마네", "Domaine Leroy Vosne-Romanée", "레드 · 빌라주", 13, F, "부르고뉴 본 로마네", "Domaine Leroy", 1500000, PN],
    ["도멘 메오 카뮈제 리쉬부르", "Domaine Méo-Camuzet Richebourg Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 본 로마네", "Domaine Méo-Camuzet", 3000000, PN],
    ["도멘 메오 카뮈제 클로 드 부조", "Domaine Méo-Camuzet Clos de Vougeot Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 부조", "Domaine Méo-Camuzet", 600000, PN],
    ["도멘 장 그리보 본 로마네", "Domaine Jean Grivot Vosne-Romanée", "레드 · 빌라주", 13, F, "부르고뉴 본 로마네", "Domaine Jean Grivot", 200000, PN],
    ["도멘 장 그리보 리쉬부르", "Domaine Jean Grivot Richebourg Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 본 로마네", "Domaine Jean Grivot", 1500000, PN],
    ["도멘 안 그로 리쉬부르", "Domaine Anne Gros Richebourg Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 본 로마네", "Domaine Anne Gros", 1500000, PN],
    ["도멘 그로 프레르 에 쇠르 클로 드 부조 뮈지니", "Domaine Gros Frère et Sœur Clos Vougeot Musigni", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 부조", "Domaine Gros Frère et Sœur", 400000, PN],
    ["도멘 드니 모르테 샹베르탱", "Domaine Denis Mortet Chambertin Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Denis Mortet", 1500000, PN],
    ["도멘 푸리에 클로 생 자크", "Domaine Fourrier Gevrey-Chambertin 1er Cru Clos Saint-Jacques", "레드 · 쥐브레 샹베르탱 1er Cru", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Fourrier", 600000, PN],
    ["도멘 브뤼노 클레르 샹베르탱 클로 드 베즈", "Domaine Bruno Clair Chambertin-Clos de Bèze Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Bruno Clair", 800000, PN],
    ["도멘 트라페 샹베르탱", "Domaine Trapet Chambertin Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Trapet", 700000, PN],
    ["도멘 로시뇰 트라페 샹베르탱", "Domaine Rossignol-Trapet Chambertin Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Rossignol-Trapet", 600000, PN],
    ["도멘 드루앵 라로즈 샹베르탱 클로 드 베즈", "Domaine Drouhin-Laroze Chambertin-Clos de Bèze Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 쥐브레 샹베르탱", "Domaine Drouhin-Laroze", 500000, PN],
    ["도멘 미셸 라파르주 볼네 클로 데 셴", "Domaine Michel Lafarge Volnay 1er Cru Clos des Chênes", "레드 · 볼네 1er Cru", 13, F, "부르고뉴 볼네", "Domaine Michel Lafarge", 300000, PN],
    ["도멘 마르키 당제르빌 볼네 클로 데 뒥", "Domaine Marquis d'Angerville Volnay 1er Cru Clos des Ducs", "레드 · 볼네 1er Cru 모노폴", 13, F, "부르고뉴 볼네", "Domaine Marquis d'Angerville", 500000, PN],
    ["도멘 데 콩트 라퐁 볼네 상트노 뒤 밀리외", "Domaine des Comtes Lafon Volnay 1er Cru Santenots-du-Milieu", "레드 · 볼네 1er Cru", 13, F, "부르고뉴 볼네", "Domaine des Comtes Lafon", 300000, PN],
    ["도멘 드 라 푸스 도르 코르통 클로 뒤 루아", "Domaine de la Pousse d'Or Corton Clos du Roi Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 알록스 코르통", "Domaine de la Pousse d'Or", 300000, PN],
    ["도멘 보노 뒤 마르트레 코르통", "Domaine Bonneau du Martray Corton Grand Cru", "레드 · 그랑 크뤼", 13.5, F, "부르고뉴 알록스 코르통", "Domaine Bonneau du Martray", 300000, PN],
    ["도멘 보노 뒤 마르트레 코르통 샤를마뉴", "Domaine Bonneau du Martray Corton-Charlemagne Grand Cru", "화이트 · 그랑 크뤼", 13.5, F, "부르고뉴 알록스 코르통", "Domaine Bonneau du Martray", 500000, CH, "whiteCrisp"],
    ["도멘 코슈 뒤리 코르통 샤를마뉴", "Domaine Coche-Dury Corton-Charlemagne Grand Cru", "화이트 · 그랑 크뤼", 13.5, F, "부르고뉴 알록스 코르통", "Domaine Coche-Dury", 8000000, CH, "whiteCrisp"],
    ["도멘 룰로 뫼르소 레 페리에르", "Domaine Roulot Meursault 1er Cru Les Perrières", "화이트 · 뫼르소 1er Cru", 13.5, F, "부르고뉴 뫼르소", "Domaine Roulot", 1500000, CH, "whiteCrisp"],
    ["도멘 데 콩트 라퐁 뫼르소 페리에르", "Domaine des Comtes Lafon Meursault 1er Cru Perrières", "화이트 · 뫼르소 1er Cru", 13.5, F, "부르고뉴 뫼르소", "Domaine des Comtes Lafon", 900000, CH, "whiteCrisp"],
    ["도멘 데 콩트 라퐁 몽라셰", "Domaine des Comtes Lafon Montrachet Grand Cru", "화이트 · 그랑 크뤼", 14, F, "부르고뉴 퓔리니 몽라셰", "Domaine des Comtes Lafon", 6000000, CH, "whiteCrisp"],
    ["도멘 라모네 몽라셰", "Domaine Ramonet Montrachet Grand Cru", "화이트 · 그랑 크뤼", 14, F, "부르고뉴 샤샤뉴 몽라셰", "Domaine Ramonet", 5000000, CH, "whiteCrisp"],
    ["도멘 르플레브 슈발리에 몽라셰", "Domaine Leflaive Chevalier-Montrachet Grand Cru", "화이트 · 그랑 크뤼", 13.5, F, "부르고뉴 퓔리니 몽라셰", "Domaine Leflaive", 2000000, CH, "whiteCrisp"],
    ["에티엔 소제 바타르 몽라셰", "Étienne Sauzet Bâtard-Montrachet Grand Cru", "화이트 · 그랑 크뤼", 13.5, F, "부르고뉴 퓔리니 몽라셰", "Domaine Étienne Sauzet", 900000, CH, "whiteCrisp"],
    ["부샤 페르 에 피스 몽라셰", "Bouchard Père & Fils Montrachet Grand Cru", "화이트 · 그랑 크뤼", 14, F, "부르고뉴 퓔리니 몽라셰", "Bouchard Père & Fils", 1500000, CH, "whiteCrisp"],
  ]);
  // ── 론 크뤼
  rows("wine", "redFull", [
    ["도멘 자메 코트 로티", "Domaine Jamet Côte-Rôtie", "레드 · 코트 로티", 13, F, "론 코트 로티", "Domaine Jamet", 250000, SY],
    ["도멘 자메 코트 로티 코트 브륀", "Domaine Jamet Côte-Rôtie Côte Brune", "레드 · 코트 로티", 13, F, "론 코트 로티", "Domaine Jamet", 700000, SY],
    ["클뤼젤 로슈 코트 로티 레 그랑드 플라스", "Clusel-Roch Côte-Rôtie Les Grandes Places", "레드 · 코트 로티", 13, F, "론 코트 로티", "Domaine Clusel-Roch", 200000, SY],
    ["베르나르 르베 코트 로티 라 샹발리에르", "Bernard Levet Côte-Rôtie La Chavarine", "레드 · 코트 로티", 13, F, "론 코트 로티", "Domaine Bernard Levet", 150000, SY],
    ["M. 샤푸티에 에르미타주 레르미트", "M. Chapoutier Ermitage L'Ermite", "레드 · 에르미타주", 14, F, "론 에르미타주", "M. Chapoutier", 800000, SY],
    ["M. 샤푸티에 에르미타주 르 파비용", "M. Chapoutier Ermitage Le Pavillon", "레드 · 에르미타주", 14, F, "론 에르미타주", "M. Chapoutier", 600000, SY],
    ["폴 자불레 에네 에르미타주 셰발리에 드 스테랭베르", "Paul Jaboulet Aîné Hermitage Chevalier de Sterimberg", "화이트 · 에르미타주", 14, F, "론 에르미타주", "Paul Jaboulet Aîné", 150000, "Marsanne/Roussanne", "whiteCrisp"],
    ["티에리 알망 코르나스 샤이요", "Thierry Allemand Cornas Chaillot", "레드 · 코르나스", 13, F, "론 코르나스", "Domaine Thierry Allemand", 400000, SY],
    ["오귀스트 클라프 코르나스 르네상스", "Auguste Clape Cornas Renaissance", "레드 · 코르나스", 13, F, "론 코르나스", "Domaine Auguste Clape", 120000, SY],
    ["알랭 보주 코르나스 비에유 비뉴", "Alain Voge Cornas Vieilles Vignes", "레드 · 코르나스", 13.5, F, "론 코르나스", "Domaine Alain Voge", 100000, SY],
    ["알랭 그라이요 크로즈 에르미타주 라 기로드", "Alain Graillot Crozes-Hermitage La Guiraude", "레드 · 크로즈 에르미타주", 13, F, "론 크로즈 에르미타주", "Domaine Alain Graillot", 120000, SY],
    ["도멘 뒤 페고 퀴베 레제르베", "Domaine du Pégau Châteauneuf-du-Pape Cuvée Réservée", "레드 · 샤토뇌프 뒤 파프", 15, F, "론 샤토뇌프 뒤 파프", "Domaine du Pégau", 120000, GSM],
    ["도멘 뒤 페고 퀴베 다 카포", "Domaine du Pégau Châteauneuf-du-Pape Cuvée Da Capo", "레드 · 샤토뇌프 뒤 파프", 15, F, "론 샤토뇌프 뒤 파프", "Domaine du Pégau", 700000, GSM],
    ["비유 동종 샤토뇌프 뒤 파프", "Le Vieux Donjon Châteauneuf-du-Pape", "레드 · 샤토뇌프 뒤 파프", 14.5, F, "론 샤토뇌프 뒤 파프", "Le Vieux Donjon", 90000, GSM],
    ["도멘 샤르뱅 샤토뇌프 뒤 파프", "Domaine Charvin Châteauneuf-du-Pape", "레드 · 샤토뇌프 뒤 파프", 14.5, F, "론 샤토뇌프 뒤 파프", "Domaine Charvin", 90000, "Grenache/Syrah/Mourvèdre/Vaccarèse"],
    ["클로 뒤 몽 올리베 샤토뇌프 뒤 파프", "Clos du Mont-Olivet Châteauneuf-du-Pape", "레드 · 샤토뇌프 뒤 파프", 14.5, F, "론 샤토뇌프 뒤 파프", "Clos du Mont-Olivet", 80000, GSM],
    ["도멘 피에르 위셀리오 퀴베 드 몽 아이윌", "Domaine Pierre Usseglio Châteauneuf-du-Pape Cuvée de Mon Aïeul", "레드 · 샤토뇌프 뒤 파프", 15, F, "론 샤토뇌프 뒤 파프", "Domaine Pierre Usseglio", 200000, "Grenache"],
    ["도멘 로제 사봉 프레스티주", "Domaine Roger Sabon Châteauneuf-du-Pape Prestige", "레드 · 샤토뇌프 뒤 파프", 15, F, "론 샤토뇌프 뒤 파프", "Domaine Roger Sabon", 120000, GSM],
    ["샤토 몽 르동 샤토뇌프 뒤 파프", "Château Mont-Redon Châteauneuf-du-Pape", "레드 · 샤토뇌프 뒤 파프", 14.5, F, "론 샤토뇌프 뒤 파프", "Château Mont-Redon", 60000, GSM],
  ]);
  // ── 피에몬테 · 토스카나 크뤼
  rows("wine", "italian", [
    ["브루노 자코사 바롤로 레 로케 델 팔레토", "Bruno Giacosa Barolo Le Rocche del Falletto Riserva", "레드 · 바롤로 리제르바", 14.5, I, "피에몬테 바롤로", "Bruno Giacosa", 1200000, NEB],
    ["브루노 자코사 바르바레스코 라바야", "Bruno Giacosa Barbaresco Rabajà", "레드 · 바르바레스코", 14, I, "피에몬테 바르바레스코", "Bruno Giacosa", 300000, NEB],
    ["콘테르노 판티노 바롤로 소리 지네스트라", "Conterno Fantino Barolo Sorì Ginestra", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Conterno Fantino", 200000, NEB],
    ["알도 콘테르노 바롤로 그란부시아", "Aldo Conterno Barolo Granbussia Riserva", "레드 · 바롤로 리제르바", 14.5, I, "피에몬테 바롤로", "Poderi Aldo Conterno", 900000, NEB],
    ["알도 콘테르노 바롤로 부시아", "Aldo Conterno Barolo Bussia", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Poderi Aldo Conterno", 200000, NEB],
    ["마솔리노 바롤로 비냐 리온다", "Massolino Barolo Vigna Rionda Riserva", "레드 · 바롤로 리제르바", 14.5, I, "피에몬테 바롤로", "Massolino", 300000, NEB],
    ["마솔리노 바롤로", "Massolino Barolo", "레드 · 바롤로", 14, I, "피에몬테 바롤로", "Massolino", 90000, NEB],
    ["브로비아 바롤로 로케 디 카스틸리오네", "Brovia Barolo Rocche di Castiglione", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Brovia", 200000, NEB],
    ["G.B. 부를로토 바롤로 몬비질리에로", "G.B. Burlotto Barolo Monvigliero", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로 베르두노", "Comm. G.B. Burlotto", 300000, NEB],
    ["카펠라노 바롤로 피에 루페스트리스", "Cappellano Barolo Piè Rupestris", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Cappellano", 400000, NEB],
    ["주세페 리날디 바롤로 트레 티네", "Giuseppe Rinaldi Barolo Tre Tine", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Giuseppe Rinaldi", 400000, NEB],
    ["비에티 바롤로 로케 디 카스틸리오네", "Vietti Barolo Rocche di Castiglione", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Vietti", 300000, NEB],
    ["비에티 바롤로 빌레로 리제르바", "Vietti Barolo Villero Riserva", "레드 · 바롤로 리제르바", 14.5, I, "피에몬테 바롤로", "Vietti", 900000, NEB],
    ["루치아노 산드로네 바롤로 레 비녜", "Luciano Sandrone Barolo Le Vigne", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Luciano Sandrone", 300000, NEB],
    ["파올로 스카비노 바롤로 로케 델라눈치아타 리제르바", "Paolo Scavino Barolo Rocche dell'Annunziata Riserva", "레드 · 바롤로 리제르바", 14.5, I, "피에몬테 바롤로", "Paolo Scavino", 400000, NEB],
    ["로베르토 보에르치오 바롤로 브루나테", "Roberto Voerzio Barolo Brunate", "레드 · 바롤로", 14.5, I, "피에몬테 바롤로", "Roberto Voerzio", 600000, NEB],
    ["로아냐 바르바레스코 파제", "Roagna Barbaresco Pajè", "레드 · 바르바레스코", 14, I, "피에몬테 바르바레스코", "Roagna", 300000, NEB],
    ["소티마노 바르바레스코 파조레", "Sottimano Barbaresco Pajoré", "레드 · 바르바레스코", 14, I, "피에몬테 바르바레스코", "Sottimano", 150000, NEB],
    ["알비노 로카 바르바레스코 론키", "Albino Rocca Barbaresco Ronchi", "레드 · 바르바레스코", 14.5, I, "피에몬테 바르바레스코", "Albino Rocca", 120000, NEB],
    ["프로두토리 델 바르바레스코 리제르바 몬테스테파노", "Produttori del Barbaresco Barbaresco Riserva Montestefano", "레드 · 바르바레스코 리제르바", 14.5, I, "피에몬테 바르바레스코", "Produttori del Barbaresco", 100000, NEB],
    ["프로두토리 델 바르바레스코 리제르바 오벨로", "Produttori del Barbaresco Barbaresco Riserva Ovello", "레드 · 바르바레스코 리제르바", 14.5, I, "피에몬테 바르바레스코", "Produttori del Barbaresco", 100000, NEB],
    ["펠시나 란차", "Fèlsina Rancia Chianti Classico Riserva", "레드 · 키안티 클라시코 리제르바", 14, I, "토스카나 키안티", "Fèlsina", 90000, SAN],
    ["펠시나 폰탈로로", "Fèlsina Fontalloro", "레드 · 토스카나 IGT", 14, I, "토스카나 키안티", "Fèlsina", 100000, SAN],
    ["카스텔로 데이 람폴라 삼마르코", "Castello dei Rampolla Sammarco", "레드 · 토스카나 IGT", 14.5, I, "토스카나 판차노", "Castello dei Rampolla", 150000, "Cabernet Sauvignon/Sangiovese"],
    ["카스텔로 데이 람폴라 달체오", "Castello dei Rampolla d'Alceo", "레드 · 토스카나 IGT", 14.5, I, "토스카나 판차노", "Castello dei Rampolla", 300000, "Cabernet Sauvignon/Petit Verdot"],
    ["몬테베르티네 로소 디 몬테베르티네", "Montevertine Rosso di Montevertine", "레드 · 토스카나 IGT", 13.5, I, "토스카나 라다 인 키안티", "Montevertine", 100000, SAN],
    ["리에치네 키안티 클라시코", "Riecine Chianti Classico", "레드 · 키안티 클라시코", 13.5, I, "토스카나 가이올레", "Riecine", 50000, SAN],
    ["체르바이오나 브루넬로 디 몬탈치노", "Cerbaiona Brunello di Montalcino", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Cerbaiona", 400000, SAN],
    ["레 포타치네 브루넬로 디 몬탈치노", "Le Potazzine Brunello di Montalcino", "레드 · 브루넬로", 14, I, "토스카나 몬탈치노", "Le Potazzine", 150000, SAN],
    ["풀리니 브루넬로 디 몬탈치노", "Fuligni Brunello di Montalcino", "레드 · 브루넬로", 14, I, "토스카나 몬탈치노", "Fuligni", 120000, SAN],
    ["리시니 브루넬로 우골라이아", "Lisini Brunello di Montalcino Ugolaia", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Lisini", 250000, SAN],
    ["우첼리에라 브루넬로 디 몬탈치노", "Uccelliera Brunello di Montalcino", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Uccelliera", 120000, SAN],
    ["마스트로자니 브루넬로 스키에나 다시노", "Mastrojanni Brunello di Montalcino Schiena d'Asino", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Mastrojanni", 250000, SAN],
    ["비온디 산티 브루넬로 리제르바", "Biondi-Santi Brunello di Montalcino Riserva", "레드 · 브루넬로 리제르바", 13.5, I, "토스카나 몬탈치노", "Biondi-Santi", 1000000, SAN],
    ["알테지노 브루넬로 몬토솔리", "Altesino Brunello di Montalcino Montosoli", "레드 · 브루넬로", 14, I, "토스카나 몬탈치노", "Altesino", 150000, SAN],
    ["치아치 피콜로미니 브루넬로 피안로소", "Ciacci Piccolomini d'Aragona Brunello di Montalcino Pianrosso", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Ciacci Piccolomini d'Aragona", 150000, SAN],
    ["탈렌티 브루넬로 디 몬탈치노", "Talenti Brunello di Montalcino", "레드 · 브루넬로", 14.5, I, "토스카나 몬탈치노", "Talenti", 90000, SAN],
  ]);
  // ── 스페인 · 포르투갈 아이콘
  rows("wine", "spanish", [
    ["베가 시실리아 우니코 레세르바 에스페시알", "Vega Sicilia Único Reserva Especial", "레드 · 리베라 델 두에로", 14, E, "카스티야 이 레온 리베라 델 두에로", "Vega Sicilia", 1200000, "Tempranillo/Cabernet Sauvignon"],
    ["도미니오 데 핑구스 PSI", "Dominio de Pingus PSI", "레드 · 리베라 델 두에로", 14.5, E, "카스티야 이 레온 리베라 델 두에로", "Dominio de Pingus", 60000, TEM],
    ["클로스 에라스무스", "Clos Erasmus", "레드 · 프리오랏", 15, E, "카탈루냐 프리오랏", "Clos i Terrasses", 500000, "Garnacha/Syrah/Cabernet Sauvignon"],
    ["테루아 알 리미트 레스 마니에스", "Terroir al Límit Les Manyes", "레드 · 프리오랏", 14, E, "카탈루냐 프리오랏", "Terroir al Límit", 300000, "Garnacha"],
    ["마스 마르티네트 클로스 마르티네트", "Mas Martinet Clos Martinet", "레드 · 프리오랏", 15, E, "카탈루냐 프리오랏", "Mas Martinet", 100000, "Garnacha/Syrah/Cabernet Sauvignon/Cariñena"],
    ["R. 로페스 데 에레디아 비냐 톤도니아 그란 레세르바", "R. López de Heredia Viña Tondonia Gran Reserva", "레드 · 리오하 그란 레세르바", 13, E, "리오하", "R. López de Heredia", 200000, "Tempranillo/Garnacha/Graciano/Mazuelo"],
    ["무가 셀렉시온 에스페시알", "Muga Selección Especial Reserva", "레드 · 리오하 레세르바", 14, E, "리오하", "Bodegas Muga", 70000, "Tempranillo/Garnacha/Mazuelo/Graciano"],
    ["레미레스 데 가누사 레세르바", "Remírez de Ganuza Reserva", "레드 · 리오하 레세르바", 14, E, "리오하", "Bodegas Remírez de Ganuza", 150000, "Tempranillo/Graciano"],
    ["시에라 칸타브리아 아만시오", "Sierra Cantabria Amancio", "레드 · 리오하", 14.5, E, "리오하", "Sierra Cantabria", 200000, TEM],
    ["핀카 아옌데 아우루스", "Finca Allende Aurus", "레드 · 리오하", 14.5, E, "리오하", "Finca Allende", 300000, "Tempranillo/Graciano"],
    ["라 리오하 알타 그란 레세르바 890", "La Rioja Alta Gran Reserva 890", "레드 · 리오하 그란 레세르바", 13.5, E, "리오하", "La Rioja Alta", 250000, "Tempranillo/Graciano/Mazuelo"],
    ["보데가스 마우로 VS", "Bodegas Mauro VS Vendimia Seleccionada", "레드 · 카스티야 이 레온", 14.5, E, "카스티야 이 레온", "Bodegas Mauro", 120000, TEM],
    ["테소 라 몽하 빅토리노", "Teso La Monja Victorino", "레드 · 토로", 15, E, "카스티야 이 레온 토로", "Teso La Monja", 150000, "Tinta de Toro"],
    ["누만시아", "Numanthia", "레드 · 토로", 15, E, "카스티야 이 레온 토로", "Bodega Numanthia (LVMH)", 90000, "Tinta de Toro"],
    ["아시엔다 모나스테리오 레세르바", "Hacienda Monasterio Reserva", "레드 · 리베라 델 두에로 레세르바", 14.5, E, "카스티야 이 레온 리베라 델 두에로", "Hacienda Monasterio", 100000, "Tempranillo/Cabernet Sauvignon/Merlot"],
    ["도미니오 데 아타우타", "Dominio de Atauta", "레드 · 리베라 델 두에로", 14.5, E, "카스티야 이 레온 리베라 델 두에로", "Dominio de Atauta", 60000, TEM],
    ["테일러스 킨타 드 바르젤라스 빈티지 포트", "Taylor's Quinta de Vargellas Vintage Port", "주정강화 · 싱글 킨타 빈티지 포트", 20, PT, "도우루", "Taylor's", 100000, "Touriga Nacional/Touriga Franca", "sweet"],
    ["그레이엄스 빈티지 포트", "Graham's Vintage Port", "주정강화 · 빈티지 포트", 20, PT, "도우루", "Graham's (Symington)", 150000, "Touriga Nacional/Touriga Franca", "sweet"],
    ["다우스 빈티지 포트", "Dow's Vintage Port", "주정강화 · 빈티지 포트", 20, PT, "도우루", "Dow's (Symington)", 140000, "Touriga Nacional/Touriga Franca", "sweet"],
    ["워레스 빈티지 포트", "Warre's Vintage Port", "주정강화 · 빈티지 포트", 20, PT, "도우루", "Warre's (Symington)", 130000, "Touriga Nacional/Touriga Franca", "sweet"],
    ["라모스 핀투 20년 토니 포트", "Ramos Pinto Quinta do Bom Retiro 20 Year Old Tawny Port", "주정강화 · 토니 포트 20년", 20, PT, "도우루", "Ramos Pinto", 100000, "Touriga Nacional/Touriga Franca", "sweet"],
    ["니포트 샤르미", "Niepoort Charme", "레드 · 도우루", 13.5, PT, "도우루", "Niepoort", 200000, "Touriga Franca/Tinta Roriz", "redFull"],
  ]);
  // ── 미국 · 호주 · 뉴질랜드 · 남아공 아이콘
  rows("wine", "redIcon", [
    ["스크리밍 이글 세컨드 플라이트", "Screaming Eagle Second Flight", "레드 · 세컨드 와인", 14.5, US, "캘리포니아 나파 밸리 오크빌", "Screaming Eagle", 2500000, BDX],
    ["색섬 제임스 베리 빈야드", "Saxum James Berry Vineyard", "레드 · 론 블렌드", 15.5, US, "캘리포니아 파소 로블레스", "Saxum Vineyards", 500000, "Grenache/Mourvèdre/Syrah"],
    ["알반 레바 시라", "Alban Vineyards Reva Syrah", "레드 · 시라", 15, US, "캘리포니아 에드나 밸리", "Alban Vineyards", 200000, SY],
    ["폴 홉스 벡스토퍼 토 칼론 까베르네 소비뇽", "Paul Hobbs Beckstoffer To Kalon Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리 오크빌", "Paul Hobbs Winery", 600000, CS],
    ["폴 홉스 러시안 리버 밸리 샤르도네", "Paul Hobbs Russian River Valley Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 소노마 러시안 리버 밸리", "Paul Hobbs Winery", 100000, CH, "whiteCrisp"],
    ["헌드레드 에이커 케일리 모건", "Hundred Acre Kayli Morgan Vineyard Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15.5, US, "캘리포니아 나파 밸리", "Hundred Acre", 1200000, CS],
    ["스캐어크로", "Scarecrow Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리 러더퍼드", "Scarecrow Wine", 1500000, CS],
    ["아브레우 마드로나 랜치", "Abreu Madrona Ranch", "레드 · 까베르네 블렌드", 14.5, US, "캘리포니아 나파 밸리 세인트 헬레나", "Abreu Vineyards", 1200000, BDX],
    ["컨티뉴엄", "Continuum Estate", "레드 · 보르도 블렌드", 14.5, US, "캘리포니아 나파 밸리 프리처드 힐", "Continuum Estate (Tim Mondavi)", 400000, BDX],
    ["프로몬토리", "Promontory", "레드 · 까베르네 소비뇽", 14.5, US, "캘리포니아 나파 밸리 오크빌", "Promontory (Harlan family)", 1000000, CS],
    ["베리테 라 뮈즈", "Vérité La Muse", "레드 · 메를로 블렌드", 14.5, US, "캘리포니아 소노마", "Vérité Winery", 600000, "Merlot/Cabernet Franc/Cabernet Sauvignon"],
    ["로코야 마운트 비더 까베르네 소비뇽", "Lokoya Mount Veeder Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, US, "캘리포니아 나파 밸리 마운트 비더", "Lokoya", 500000, CS],
    ["카디널레", "Cardinale", "레드 · 까베르네 블렌드", 14.5, US, "캘리포니아 나파 밸리", "Cardinale (Jackson Family)", 400000, "Cabernet Sauvignon/Merlot"],
    ["잉글누크 루비콘", "Inglenook Rubicon", "레드 · 보르도 블렌드", 14.5, US, "캘리포니아 나파 밸리 러더퍼드", "Inglenook", 300000, BDX],
    ["다이아몬드 크릭 볼캐닉 힐", "Diamond Creek Volcanic Hill Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, US, "캘리포니아 나파 밸리 다이아몬드 마운틴", "Diamond Creek Vineyards", 300000, CS],
    ["필립 토니 까베르네 소비뇽", "Philip Togni Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, US, "캘리포니아 나파 밸리 스프링 마운틴", "Philip Togni Vineyard", 300000, CS],
    ["허시 샌 안드레아스 폴트 피노 누아", "Hirsch Vineyards San Andreas Fault Pinot Noir", "레드 · 피노 누아", 13.5, US, "캘리포니아 소노마 코스트", "Hirsch Vineyards", 100000, PN, "pinot"],
    ["리스 앨파인 빈야드 피노 누아", "Rhys Alpine Vineyard Pinot Noir", "레드 · 피노 누아", 13, US, "캘리포니아 산타크루즈 마운틴스", "Rhys Vineyards", 250000, PN, "pinot"],
    ["한젤 샤르도네", "Hanzell Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 소노마", "Hanzell Vineyards", 150000, CH, "whiteCrisp"],
    ["마운트 에덴 에스테이트 샤르도네", "Mount Eden Vineyards Estate Chardonnay", "화이트 · 샤르도네", 14, US, "캘리포니아 산타크루즈 마운틴스", "Mount Eden Vineyards", 120000, CH, "whiteCrisp"],
    ["펜폴즈 빈 150 마라낭가 시라즈", "Penfolds Bin 150 Marananga Shiraz", "레드 · 시라즈", 14.5, "호주", "바로사 밸리", "Penfolds", 120000, "Shiraz"],
    ["펜폴즈 매길 에스테이트 시라즈", "Penfolds Magill Estate Shiraz", "레드 · 시라즈", 14.5, "호주", "애들레이드", "Penfolds", 200000, "Shiraz"],
    ["펜폴즈 빈 311 샤르도네", "Penfolds Bin 311 Chardonnay", "화이트 · 샤르도네", 13, "호주", "툼바룸바", "Penfolds", 60000, CH, "whiteCrisp"],
    ["헨쉬키 시릴 헨쉬키", "Henschke Cyril Henschke Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "호주", "이든 밸리", "Henschke", 300000, CS],
    ["토브렉 디센던트", "Torbreck Descendant Shiraz Viognier", "레드 · 시라즈", 15, "호주", "바로사 밸리", "Torbreck Vintners", 250000, "Shiraz/Viognier"],
    ["웬도리 시라즈", "Wendouree Shiraz", "레드 · 시라즈", 13.5, "호주", "클레어 밸리", "Wendouree Cellars", 200000, "Shiraz"],
    ["짐 배리 디 아마", "Jim Barry The Armagh Shiraz", "레드 · 시라즈", 14.5, "호주", "클레어 밸리", "Jim Barry Wines", 400000, "Shiraz"],
    ["짐 배리 로지 힐 리슬링", "Jim Barry Lodge Hill Riesling", "화이트 · 리슬링", 12, "호주", "클레어 밸리", "Jim Barry Wines", 30000, RI, "whiteCrisp"],
    ["루윈 에스테이트 아트 시리즈 까베르네 소비뇽", "Leeuwin Estate Art Series Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "호주", "마거릿 리버", "Leeuwin Estate", 120000, CS],
    ["바스 펠릭스 톰 컬리티", "Vasse Felix Tom Cullity Cabernet Sauvignon Malbec", "레드 · 까베르네 블렌드", 14, "호주", "마거릿 리버", "Vasse Felix", 200000, "Cabernet Sauvignon/Malbec"],
    ["자콘다 에스테이트 샤르도네", "Giaconda Estate Vineyard Chardonnay", "화이트 · 샤르도네", 13.5, "호주", "비치워스", "Giaconda", 300000, CH, "whiteCrisp"],
    ["쇼 앤 스미스 M3 샤르도네", "Shaw + Smith M3 Chardonnay", "화이트 · 샤르도네", 13, "호주", "애들레이드 힐스", "Shaw + Smith", 70000, CH, "whiteCrisp"],
    ["톨퍼들 피노 누아", "Tolpuddle Vineyard Pinot Noir", "레드 · 피노 누아", 13.5, "호주", "태즈메이니아", "Tolpuddle Vineyard (Shaw + Smith)", 120000, PN, "pinot"],
    ["펠튼 로드 블록 3 피노 누아", "Felton Road Block 3 Pinot Noir", "레드 · 피노 누아", 14, "뉴질랜드", "센트럴 오타고", "Felton Road", 140000, PN, "pinot"],
    ["펠튼 로드 코니시 포인트 피노 누아", "Felton Road Cornish Point Pinot Noir", "레드 · 피노 누아", 14, "뉴질랜드", "센트럴 오타고", "Felton Road", 120000, PN, "pinot"],
    ["번 코티지 피노 누아", "Burn Cottage Pinot Noir", "레드 · 피노 누아", 13.5, "뉴질랜드", "센트럴 오타고", "Burn Cottage", 120000, PN, "pinot"],
    ["도그 포인트 섹션 94", "Dog Point Section 94 Sauvignon Blanc", "화이트 · 소비뇽 블랑 (오크)", 13.5, "뉴질랜드", "말보로", "Dog Point Vineyard", 60000, SB, "whiteCrisp"],
    ["쿠뮤 리버 마테스 빈야드 샤르도네", "Kumeu River Maté's Vineyard Chardonnay", "화이트 · 샤르도네", 13.5, "뉴질랜드", "오클랜드 쿠뮤", "Kumeu River", 100000, CH, "whiteCrisp"],
    ["부켄하우츠클루프 시라", "Boekenhoutskloof Syrah", "레드 · 시라", 14, "남아프리카공화국", "프란슈후크", "Boekenhoutskloof", 80000, SY],
    ["부켄하우츠클루프 초콜릿 블록", "Boekenhoutskloof The Chocolate Block", "레드 · 시라 블렌드", 14.5, "남아프리카공화국", "웨스턴 케이프", "Boekenhoutskloof", 40000, "Syrah/Grenache/Cabernet Sauvignon/Cinsault"],
    ["알하이트 카르톨로지", "Alheit Vineyards Cartology", "화이트 · 슈냉 블랑 블렌드", 13, "남아프리카공화국", "웨스턴 케이프", "Alheit Vineyards", 80000, "Chenin Blanc/Sémillon", "whiteCrisp"],
    ["페르헬레헨 V", "Vergelegen V", "레드 · 보르도 블렌드", 14.5, "남아프리카공화국", "서머싯 웨스트", "Vergelegen", 150000, BDX],
  ]);


  // ══ 꼬냑 · 아르마냑 · 칼바도스 · 세계 브랜디
  {
    const C = "꼬냑", UB = "위니 블랑", FR = "프랑스", AR = "아르마냑", ARG = "바코 블랑/위니 블랑/콜롱바르/폴 블랑슈", CAL = "사과(·배)";
    rows("cognac", "cognac", [
      ["헤네시 마스터 블렌더스 셀렉션 No.5", "Hennessy Master Blender's Selection No.5", "꼬냑 · 마스터 블렌더 셀렉션", 43, FR, C, "Jas Hennessy & Co. (LVMH)", 150000, UB],
      ["헤네시 파라디 앵페리알", "Hennessy Paradis Impérial", "꼬냑 · 엑스트라", 40, FR, C, "Jas Hennessy & Co. (LVMH)", 3500000, UB],
      ["헤네시 퓨어 화이트", "Hennessy Pure White", "꼬냑 · 퓨어 화이트", 40, FR, C, "Jas Hennessy & Co. (LVMH)", 80000, UB],
      ["헤네시 제임스 헤네시", "Hennessy James Hennessy", "꼬냑 · XO급", 40, FR, C, "Jas Hennessy & Co. (LVMH)", 250000, UB],
      ["헤네시 8", "Hennessy 8", "꼬냑 · 8대 마스터 블렌더 헌정", 40, FR, C, "Jas Hennessy & Co. (LVMH)", 2000000, UB],
      ["레미 마르탱 XO 엑설런스", "Rémy Martin Excellence XO", "꼬냑 XO · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Rémy Martin", 230000, UB],
      ["레미 마르탱 1738 아코르 루아얄 캐스크 피니시", "Rémy Martin 1738 Cask Finish", "꼬냑 · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Rémy Martin", 110000, UB],
      ["루이 13세 블랙 펄", "Louis XIII Black Pearl", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Rémy Martin", 30000000, UB],
      ["레미 마르탱 센타우르 드 디아망", "Rémy Martin Centaure de Diamant", "꼬냑 · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Rémy Martin", 1500000, UB],
      ["레미 마르탱 카르트 블랑슈", "Rémy Martin Carte Blanche", "꼬냑 · 셀러 마스터 셀렉션", 42.2, FR, "꼬냑 핀 샹파뉴", "Rémy Martin", 400000, UB],
      ["마르텔 코르동 블루 엑스트라", "Martell Cordon Bleu Extra", "꼬냑 · 엑스트라", 40, FR, "꼬냑 보르드리", "Martell", 600000, UB],
      ["마르텔 샹트루", "Martell Chanteloup XXO", "꼬냑 · XXO", 40, FR, C, "Martell", 450000, UB],
      ["마르텔 블루 스위프트 VSOP", "Martell Blue Swift VSOP", "꼬냑 VSOP", 40, FR, C, "Martell", 70000, UB],
      ["마르텔 크레아시옹 그랑 엑스트라", "Martell Création Grand Extra", "꼬냑 · 엑스트라", 40, FR, C, "Martell", 1500000, UB],
      ["쿠르부아지에 XO 로열", "Courvoisier XO Royal", "꼬냑 XO", 40, FR, C, "Courvoisier", 300000, UB],
      ["쿠르부아지에 이니셔 엑스트라", "Courvoisier Initiale Extra", "꼬냑 · 엑스트라", 40, FR, C, "Courvoisier", 400000, UB],
      ["쿠르부아지에 아방가르드", "Courvoisier Avant-Garde Bourbon Cask", "꼬냑 · 버번 캐스크", 40, FR, C, "Courvoisier", 90000, UB],
      ["쿠르부아지에 VSOP 익스클루시브", "Courvoisier VSOP Exclusif", "꼬냑 VSOP", 40, FR, C, "Courvoisier", 80000, UB],
      ["카뮈 XO 보르드리", "Camus XO Borderies Family Reserve", "꼬냑 XO · 보르드리", 40, FR, "꼬냑 보르드리", "Camus", 250000, UB],
      ["카뮈 일 드 레 더블 마추어드", "Camus Île de Ré Double Matured", "꼬냑 · 일 드 레", 40, FR, "꼬냑 봉 부아 (일 드 레)", "Camus", 120000, UB],
      ["카뮈 VS 엘레강스", "Camus VS Intensely Aromatic", "꼬냑 VS", 40, FR, C, "Camus", 50000, UB],
      ["카뮈 퀴베 3.128", "Camus Cuvée 3.128", "꼬냑 · 리미티드", 40, FR, C, "Camus", 900000, UB],
      ["오타르 VS", "Otard VS", "꼬냑 VS", 40, FR, C, "Baron Otard (Bacardi)", 45000, UB],
      ["오타르 엑스트라 1795", "Otard Extra 1795", "꼬냑 · 엑스트라", 40, FR, C, "Baron Otard (Bacardi)", 700000, UB],
      ["하인 앙티크 XO", "Hine Antique XO Premier Cru", "꼬냑 XO · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Thomas Hine & Co", 250000, UB],
      ["하인 H 바이 하인 VSOP", "H by Hine VSOP Fine Champagne", "꼬냑 VSOP · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Thomas Hine & Co", 60000, UB],
      ["하인 트리옹프", "Hine Triomphe", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Thomas Hine & Co", 450000, UB],
      ["델라맹 베스퍼 그랑드 샹파뉴", "Delamain Vesper Grande Champagne", "꼬냑 XO · 그랑드 샹파뉴", 42, FR, "꼬냑 그랑드 샹파뉴", "Delamain", 300000, UB],
      ["델라맹 레제르브 드 라 파미유", "Delamain Réserve de la Famille", "꼬냑 · 그랑드 샹파뉴", 43, FR, "꼬냑 그랑드 샹파뉴", "Delamain", 700000, UB],
      ["델라맹 레글", "Delamain L'Aigle Grande Champagne", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Delamain", 220000, UB],
      ["프라팽 샤토 퐁피노 XO", "Frapin Château Fontpinot XO", "꼬냑 XO · 그랑드 샹파뉴", 41, FR, "꼬냑 그랑드 샹파뉴", "Frapin", 200000, UB],
      ["프라팽 엑스트라", "Frapin Extra Grande Champagne", "꼬냑 · 엑스트라", 40, FR, "꼬냑 그랑드 샹파뉴", "Frapin", 600000, UB],
      ["프라팽 1270", "Frapin 1270 Grande Champagne", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Frapin", 60000, UB],
      ["프라팽 시가르 블렌드", "Frapin Cigar Blend Vieille Réserve", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Frapin", 150000, UB],
      ["피에르 페랑 레제르브 더블 캐스크", "Pierre Ferrand Réserve Double Cask", "꼬냑 · 그랑드 샹파뉴", 42.3, FR, "꼬냑 그랑드 샹파뉴", "Maison Ferrand", 130000, UB],
      ["피에르 페랑 셀렉시옹 데 앙주", "Pierre Ferrand Sélection des Anges", "꼬냑 · 그랑드 샹파뉴", 41.8, FR, "꼬냑 그랑드 샹파뉴", "Maison Ferrand", 250000, UB],
      ["피에르 페랑 10 제너레이션", "Pierre Ferrand 10 Générations", "꼬냑 · 그랑드 샹파뉴", 46, FR, "꼬냑 그랑드 샹파뉴", "Maison Ferrand", 100000, UB],
      ["ABK6 VSOP", "ABK6 VSOP Single Estate", "꼬냑 VSOP · 핀 부아", 40, FR, "꼬냑 핀 부아", "ABK6 (Abecassis)", 60000, UB],
      ["ABK6 XO 르네상스", "ABK6 XO Renaissance", "꼬냑 XO", 40, FR, "꼬냑 핀 부아", "ABK6 (Abecassis)", 150000, UB],
      ["ABK6 허니", "ABK6 Honey", "꼬냑 리큐어 · 꿀", 35, FR, C, "ABK6 (Abecassis)", 50000, "위니 블랑/꿀"],
      ["레이라 XO 비에유 레제르브", "Leyrat XO Vieille Réserve", "꼬냑 XO · 핀 부아", 40, FR, "꼬냑 핀 부아", "Leyrat (Abecassis)", 120000, UB],
      ["테세롱 로트 No.29 엑셉시옹", "Tesseron Lot No.29 Exception", "꼬냑 · 엑스트라", 40, FR, "꼬냑 그랑드 샹파뉴", "Tesseron", 900000, UB],
      ["테세롱 로트 No.76 트라디시옹", "Tesseron Lot No.76 XO Tradition", "꼬냑 XO", 40, FR, C, "Tesseron", 200000, UB],
      ["테세롱 로트 No.90 XO 오드", "Tesseron Lot No.90 XO Ode", "꼬냑 XO", 40, FR, C, "Tesseron", 130000, UB],
      ["장 필루 트레 비유", "Jean Fillioux Très Vieux", "꼬냑 · 그랑드 샹파뉴", 42, FR, "꼬냑 그랑드 샹파뉴", "Jean Fillioux", 250000, UB],
      ["장 필루 라 푸야드", "Jean Fillioux La Pouyade", "꼬냑 · 그랑드 샹파뉴", 42, FR, "꼬냑 그랑드 샹파뉴", "Jean Fillioux", 100000, UB],
      ["폴 지로 비에유 레제르브 15년", "Paul Giraud Vieille Réserve 15 Ans", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Paul Giraud", 100000, UB],
      ["폴 지로 트레 라르 35년", "Paul Giraud Très Rare 35 Ans", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Paul Giraud", 250000, UB],
      ["라뇨 사부랭 VSOP", "Ragnaud-Sabourin VSOP Grande Champagne", "꼬냑 VSOP · 그랑드 샹파뉴", 41, FR, "꼬냑 그랑드 샹파뉴", "Ragnaud-Sabourin", 80000, UB],
      ["레몽 라뇨 오르 다주 엑스트라", "Raymond Ragnaud Hors d'Âge Extra", "꼬냑 · 그랑드 샹파뉴", 41, FR, "꼬냑 그랑드 샹파뉴", "Raymond Ragnaud", 200000, UB],
      ["바슈 가브리엘슨 XO 파인 샹파뉴", "Bache-Gabrielsen XO Fine Champagne", "꼬냑 XO · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Bache-Gabrielsen", 130000, UB],
      ["바슈 가브리엘슨 아메리칸 오크", "Bache-Gabrielsen American Oak", "꼬냑 · 아메리칸 오크", 40, FR, C, "Bache-Gabrielsen", 50000, UB],
      ["막심 트리졸 XO", "Maxime Trijol XO Grande Champagne", "꼬냑 XO · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Maxime Trijol", 120000, UB],
      ["고티에 XO", "Gautier XO Gold & Blue", "꼬냑 XO", 40, FR, C, "Gautier", 100000, UB],
      ["프뤼니에 VSOP", "Prunier VSOP Fine Champagne", "꼬냑 VSOP · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Prunier", 70000, UB],
      ["프뤼니에 XO", "Prunier XO Très Vieille Grande Champagne", "꼬냑 XO · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Prunier", 180000, UB],
      ["라센 XO 바이킹 쉽", "Larsen XO Viking Ship", "꼬냑 XO", 40, FR, C, "Larsen", 120000, UB],
      ["라센 VSOP", "Larsen VSOP Fine Champagne", "꼬냑 VSOP · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Larsen", 60000, UB],
      ["비스킷 앤 뒤부셰 XO", "Bisquit & Dubouché XO", "꼬냑 XO", 40, FR, C, "Bisquit & Dubouché", 110000, UB],
      ["비스킷 앤 뒤부셰 VSOP", "Bisquit & Dubouché VSOP", "꼬냑 VSOP", 40, FR, C, "Bisquit & Dubouché", 50000, UB],
      ["다니엘 부쥐 VSOP", "Daniel Bouju VSOP Grande Champagne", "꼬냑 VSOP · 그랑드 샹파뉴", 42, FR, "꼬냑 그랑드 샹파뉴", "Daniel Bouju", 80000, UB],
      ["다니엘 부쥐 브뤼 드 퓌 엑스트라", "Daniel Bouju Brut de Fût Extra", "꼬냑 · 캐스크 스트렝스", 60, FR, "꼬냑 그랑드 샹파뉴", "Daniel Bouju", 200000, UB],
      ["레오폴 구르멜 레상스 20 카라", "Léopold Gourmel L'Essence 20 Carats", "꼬냑 · 핀 부아", 42, FR, "꼬냑 핀 부아", "Léopold Gourmel", 350000, UB],
      ["레오폴 구르멜 아주 뒤 프뤼 10 카라", "Léopold Gourmel Âge du Fruit 10 Carats", "꼬냑 · 핀 부아", 41, FR, "꼬냑 핀 부아", "Léopold Gourmel", 120000, UB],
      ["뒤도뇽 레제르브 10년", "Dudognon Réserve 10 Ans Grande Champagne", "꼬냑 · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "Dudognon", 80000, UB],
      ["아르디 XO 레어", "Hardy XO Rare", "꼬냑 XO", 40, FR, C, "A. Hardy", 130000, UB],
      ["아르디 노스 도르 쉬블림", "Hardy Noces d'Or Sublime", "꼬냑 · 그랑드 샹파뉴", 41, FR, "꼬냑 그랑드 샹파뉴", "A. Hardy", 500000, UB],
      ["레미 마르탱 XO 캐스크 피니시", "Rémy Martin XO Cask Finish", "꼬냑 XO", 40, FR, "꼬냑 핀 샹파뉴", "Rémy Martin", 280000, UB],
      ["모네 XO", "Monnet XO", "꼬냑 XO", 40, FR, C, "Monnet", 90000, UB],
      ["고데 XO 테르", "Godet XO Terre", "꼬냑 XO", 40, FR, C, "Godet", 130000, UB],
      ["노르망댕 메르시에 비에유 핀 샹파뉴", "Normandin-Mercier Vieille Fine Champagne", "꼬냑 · 핀 샹파뉴", 40, FR, "꼬냑 핀 샹파뉴", "Normandin-Mercier", 100000, UB],
      ["디우세 VSOP", "D'Ussé VSOP", "꼬냑 VSOP", 40, FR, C, "Château de Cognac (Bacardi)", 70000, UB],
      ["디우세 XO", "D'Ussé XO", "꼬냑 XO", 40, FR, C, "Château de Cognac (Bacardi)", 250000, UB],
      ["바슈 가브리엘슨 트레 코르스 VSOP", "Bache-Gabrielsen Tre Kors VSOP", "꼬냑 VSOP", 40, FR, C, "Bache-Gabrielsen", 60000, UB],
      ["브리예 XO 그랑드 샹파뉴", "Brillet XO Grande Champagne", "꼬냑 XO · 그랑드 샹파뉴", 40, FR, "꼬냑 그랑드 샹파뉴", "J.R. Brillet", 130000, UB],
      ["세녜트 VS", "Seignette VS", "꼬냑 VS", 40, FR, C, "Seignette", 40000, UB],
      ["마리 뒤포 나폴레옹 바 아르마냑", "Marie Duffau Napoléon Bas-Armagnac", "아르마냑 · 나폴레옹", 40, FR, "아르마냑 바 아르마냑", "Marie Duffau", 60000, ARG],
      // 아르마냑
      ["샤토 드 로바드 XO", "Château de Laubade XO", "아르마냑 XO · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Château de Laubade", 120000, ARG],
      ["샤토 드 로바드 인텐스", "Château de Laubade Intemporel No.5", "아르마냑 · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Château de Laubade", 250000, ARG],
      ["다르로즈 레 그랑 아상블라주 20년", "Darroze Les Grands Assemblages 20 Ans", "아르마냑 · 바 아르마냑", 42, FR, "아르마냑 바 아르마냑", "Darroze", 200000, ARG],
      ["다르로즈 레 그랑 아상블라주 12년", "Darroze Les Grands Assemblages 12 Ans", "아르마냑 · 바 아르마냑", 42, FR, "아르마냑 바 아르마냑", "Darroze", 120000, ARG],
      ["샤토 뒤 타리케 XO", "Château du Tariquet XO", "아르마냑 XO · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Château du Tariquet", 90000, ARG],
      ["샤토 뒤 타리케 블랑슈 아르마냑", "Château du Tariquet Blanche Armagnac", "블랑슈 아르마냑", 46, FR, "아르마냑 바 아르마냑", "Château du Tariquet", 50000, ARG],
      ["델로르 XO", "Delord XO Bas-Armagnac", "아르마냑 XO · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Delord", 80000, ARG],
      ["델로르 25년", "Delord 25 Ans d'Âge Bas-Armagnac", "아르마냑 · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Delord", 180000, ARG],
      ["도멘 부아녜르 폴 블랑슈", "Domaine Boingnères Folle Blanche", "아르마냑 · 바 아르마냑", 48, FR, "아르마냑 바 아르마냑", "Domaine Boingnères", 250000, "폴 블랑슈"],
      ["자노 XO 로열", "Janneau XO Royal", "아르마냑 XO", 40, FR, AR, "Janneau", 110000, ARG],
      ["샤보 XO", "Chabot XO Superior", "아르마냑 XO", 40, FR, AR, "Chabot", 90000, ARG],
      ["마르키 드 몽테스키우 XO", "Marquis de Montesquiou XO Impérial", "아르마냑 XO", 40, FR, AR, "Marquis de Montesquiou", 100000, ARG],
      ["사마랑 XO", "Samalens XO Bas-Armagnac", "아르마냑 XO · 바 아르마냑", 40, FR, "아르마냑 바 아르마냑", "Samalens", 100000, ARG],
      ["도멘 도냐스 XO", "Domaine d'Ognoas XO", "아르마냑 XO · 바 아르마냑", 42, FR, "아르마냑 바 아르마냑", "Domaine d'Ognoas", 120000, ARG],
      ["샤토 드 라키 XO", "Château de Lacquy XO", "아르마냑 XO · 바 아르마냑", 42, FR, "아르마냑 바 아르마냑", "Château de Lacquy", 150000, ARG],
      ["드 몽탈 VSOP", "De Montal VSOP Bas-Armagnac", "아르마냑 VSOP", 40, FR, "아르마냑 바 아르마냑", "De Montal", 50000, ARG],
      ["클레 데 뒤크 VSOP", "Clés des Ducs VSOP", "아르마냑 VSOP", 40, FR, AR, "Clés des Ducs (La Martiniquaise)", 40000, ARG],
      // 칼바도스
      ["크리스티앙 드루앵 XO", "Christian Drouin Calvados Pays d'Auge XO", "칼바도스 XO · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Christian Drouin", 120000, CAL],
      ["크리스티앙 드루앵 셀렉시옹", "Christian Drouin Calvados Sélection", "칼바도스 · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Christian Drouin", 50000, CAL],
      ["불라르 XO", "Boulard Calvados XO", "칼바도스 XO · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Boulard", 120000, CAL],
      ["불라르 VSOP", "Boulard Calvados VSOP", "칼바도스 VSOP · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Boulard", 70000, CAL],
      ["페르 마글루아르 VSOP", "Père Magloire Calvados VSOP", "칼바도스 VSOP", 40, FR, "노르망디 칼바도스", "Père Magloire", 60000, CAL],
      ["페르 마글루아르 피네 오크", "Père Magloire Calvados Fine", "칼바도스", 40, FR, "노르망디 칼바도스", "Père Magloire", 40000, CAL],
      ["로제 그루 15년", "Roger Groult Calvados Pays d'Auge 15 Ans", "칼바도스 · 페이 도주", 41, FR, "노르망디 칼바도스 페이 도주", "Roger Groult", 150000, CAL],
      ["로제 그루 8년", "Roger Groult Calvados Pays d'Auge 8 Ans", "칼바도스 · 페이 도주", 41, FR, "노르망디 칼바도스 페이 도주", "Roger Groult", 90000, CAL],
      ["샤토 뒤 브뢰유 15년", "Château du Breuil Calvados Pays d'Auge 15 Ans", "칼바도스 · 페이 도주", 41, FR, "노르망디 칼바도스 페이 도주", "Château du Breuil", 150000, CAL],
      ["샤토 뒤 브뢰유 파인", "Château du Breuil Calvados Fine", "칼바도스 · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Château du Breuil", 50000, CAL],
      ["도멘 뒤퐁 오르 다주", "Domaine Dupont Calvados Hors d'Âge", "칼바도스 · 페이 도주", 42, FR, "노르망디 칼바도스 페이 도주", "Domaine Dupont", 120000, CAL],
      ["르콩트 18년", "Lecompte Calvados Pays d'Auge 18 Ans", "칼바도스 · 페이 도주", 42, FR, "노르망디 칼바도스 페이 도주", "Lecompte", 200000, CAL],
      ["피에르 위에 칼바도스 오르 다주", "Pierre Huet Calvados Pays d'Auge Hors d'Âge", "칼바도스 · 페이 도주", 40, FR, "노르망디 칼바도스 페이 도주", "Pierre Huet", 100000, CAL],
      ["콩트 루이 드 로리스통 동프롱테 12년", "Calvados Comte Louis de Lauriston Domfrontais 12 Ans", "칼바도스 · 동프롱테", 42, FR, "노르망디 칼바도스 동프롱테", "Comte Louis de Lauriston", 130000, "배/사과"],
      // 스페인 · 이탈리아 · 기타 브랜디
      ["카를로스 1세 임페리얼 XO", "Carlos I Imperial XO", "브랜디 데 헤레스 솔레라 그란 레세르바", 40, "스페인", "안달루시아 헤레스", "Osborne", 100000, "아이렌/팔로미노"],
      ["카르데날 멘도사 솔레라 그란 레세르바", "Cardenal Mendoza Solera Gran Reserva", "브랜디 데 헤레스 솔레라 그란 레세르바", 40, "스페인", "안달루시아 헤레스", "Sánchez Romate", 60000, "아이렌/팔로미노"],
      ["카르데날 멘도사 논 플러스 울트라", "Cardenal Mendoza Non Plus Ultra", "브랜디 데 헤레스", 40, "스페인", "안달루시아 헤레스", "Sánchez Romate", 400000, "아이렌/팔로미노"],
      ["레판토 솔레라 그란 레세르바", "Lepanto Solera Gran Reserva", "브랜디 데 헤레스 솔레라 그란 레세르바", 36, "스페인", "안달루시아 헤레스", "González Byass", 70000, "팔로미노"],
      ["소베라노 솔레라 레세르바", "Soberano Solera Reserva", "브랜디 데 헤레스 솔레라 레세르바", 36, "스페인", "안달루시아 헤레스", "González Byass", 25000, "아이렌/팔로미노"],
      ["토레스 15 레세르바 프리바다", "Torres 15 Reserva Privada", "스페인 브랜디", 40, "스페인", "카탈루냐 페네데스", "Torres", 60000, "파렐야다/우니 블랑"],
      ["토레스 하이메 1세", "Torres Jaime I 30 Years", "스페인 브랜디", 38, "스페인", "카탈루냐 페네데스", "Torres", 250000, "파렐야다/우니 블랑"],
      ["그란 두케 달바", "Gran Duque de Alba Solera Gran Reserva", "브랜디 데 헤레스 솔레라 그란 레세르바", 40, "스페인", "안달루시아 헤레스", "Williams & Humbert", 70000, "아이렌/팔로미노"],
      ["자코포 폴리 아르젠테", "Jacopo Poli Arzente", "이탈리아 브랜디 (아콰비테 디 비노)", 43, "이탈리아", "베네토", "Jacopo Poli", 120000, "토카이 프리울라노"],
      ["마롤로 그라파 디 바롤로 12년", "Marolo Grappa di Barolo 12 Anni", "그라파 · 숙성", 50, "이탈리아", "피에몬테", "Marolo", 120000, "네비올로 포마스"],
      ["노니노 그라파 리세르바", "Nonino Grappa Riserva Antica Cuvée", "그라파 · 숙성", 43, "이탈리아", "프리울리", "Nonino", 90000, "포도 포마스"],
      ["노니노 우에 피콜리트", "Nonino ÙE Cru Monovitigno Picolit", "포도 브랜디", 38, "이탈리아", "프리울리", "Nonino", 200000, "피콜리트 포도"],
      ["폴리 그라파 사르파 오로", "Poli Sarpa Oro di Poli", "그라파 · 숙성", 40, "이탈리아", "베네토", "Jacopo Poli", 60000, "메를로/까베르네 포마스"],
      ["베르타 트레솔레", "Berta Tre Soli Tre", "그라파 · 숙성", 43, "이탈리아", "피에몬테", "Distillerie Berta", 150000, "네비올로 포마스"],
      ["메탁사 프라이빗 리저브", "Metaxa Private Reserve", "그리스 브랜디 · 아마라", 40, "그리스", "—", "Rémy Cointreau", 120000, "Savatiano/Muscat 와인"],
      ["메탁사 엔젤스 트레저", "Metaxa Angels' Treasure", "그리스 브랜디 · 아마라", 40, "그리스", "—", "Rémy Cointreau", 90000, "Savatiano/Muscat 와인"],
      ["아라랏 아흐타마르 10년", "Ararat Akhtamar 10 Years", "아르메니아 브랜디", 40, "아르메니아", "예레반", "Yerevan Brandy Company (Pernod Ricard)", 70000, "아르메니아 토착 백포도"],
      ["아라랏 나이리 20년", "Ararat Nairi 20 Years", "아르메니아 브랜디", 41, "아르메니아", "예레반", "Yerevan Brandy Company (Pernod Ricard)", 150000, "아르메니아 토착 백포도"],
      ["아라랏 5스타", "Ararat 5 Stars", "아르메니아 브랜디", 40, "아르메니아", "예레반", "Yerevan Brandy Company (Pernod Ricard)", 40000, "아르메니아 토착 백포도"],
      ["사라지시빌리 XO", "Sarajishvili XO", "조지아 브랜디", 40, "조지아", "트빌리시", "Sarajishvili", 100000, "르카치텔리/므츠바네"],
      ["피스코 포르톤 모스토 베르데", "Pisco Portón Mosto Verde", "피스코 · 모스토 베르데", 43, "페루", "이카", "Hacienda La Caravedo", 70000, "퀘브란타/알비야/토론텔"],
      ["바르솔 피스코 퀘브란타", "Barsol Pisco Quebranta", "피스코 · 푸로", 41.3, "페루", "이카", "Bodega San Isidro", 45000, "퀘브란타"],
      ["알토 델 카르멘 피스코 레세르바도", "Alto del Carmen Pisco Reservado", "피스코", 40, "칠레", "아타카마", "Capel", 30000, "머스캣"],
      ["저메인 로빈 XO", "Germain-Robin XO", "캘리포니아 알렘빅 브랜디", 40, "미국", "캘리포니아 멘도시노", "Germain-Robin", 150000, "피노 누아/콜롱바르"],
      ["KWV 10년 브랜디", "KWV 10 Year Old Brandy", "남아공 포트 스틸 브랜디", 38, "남아프리카공화국", "웨스턴 케이프", "KWV", 50000, "슈냉 블랑/콜롱바르"],
      ["KWV 15년 알렘빅", "KWV 15 Year Old Alambic Brandy", "남아공 포트 스틸 브랜디", 38, "남아프리카공화국", "웨스턴 케이프", "KWV", 80000, "슈냉 블랑/콜롱바르"],
      ["반 라인스 12년", "Van Ryn's 12 Year Old Distillers Reserve", "남아공 포트 스틸 브랜디", 38, "남아프리카공화국", "스텔렌보스", "Van Ryn's", 70000, "슈냉 블랑/콜롱바르"],
      ["샤토 타눈다 그랜드 바로사 브랜디", "Chateau Tanunda Grand Barossa Brandy", "호주 브랜디", 40, "호주", "바로사 밸리", "Château Tanunda", 60000, "포도"],
      ["장위 XO 브랜디", "Changyu XO Brandy", "중국 브랜디", 40, "중국", "산둥 옌타이", "Changyu", 100000, "위니 블랑"],
      ["산토리 브랜디 VSOP", "Suntory Brandy V.S.O.P", "일본 브랜디", 40, "일본", "—", "Suntory", 30000, "포도"],
      ["아스바흐 우랄트", "Asbach Uralt", "독일 브랜디", 36, "독일", "라인가우 뤼데스하임", "Asbach", 30000, "포도"],
      ["아스바흐 15년 셰리 캐스크", "Asbach 15 Jahre Sherry Cask", "독일 브랜디", 40, "독일", "라인가우 뤼데스하임", "Asbach", 100000, "포도"],
      ["스톡 84 VSOP", "Stock 84 VSOP", "이탈리아 브랜디", 38, "이탈리아", "—", "Stock Spirits", 25000, "포도"],
      ["베키아 로마냐 리제르바 트레 보티", "Vecchia Romagna Riserva Tre Botti", "이탈리아 브랜디", 38, "이탈리아", "에밀리아로마냐", "Montenegro", 60000, "트레비아노"],
      // 오드비 (과일 브랜디)
      ["마스네 푸아르 윌리엄스", "Massenez Poire Williams", "오 드 비 · 서양배", 40, FR, "알자스", "G.E. Massenez", 70000, "윌리엄스 배"],
      ["메트 프랑부아즈 소바주", "Metté Framboise Sauvage", "오 드 비 · 산딸기", 45, FR, "알자스", "Jean-Paul Metté", 120000, "야생 라즈베리"],
      ["메트 키르슈", "Metté Kirsch", "오 드 비 · 체리", 45, FR, "알자스", "Jean-Paul Metté", 90000, "체리"],
      ["슐라더러 키르슈바서", "Schladerer Kirschwasser", "슈납스 · 체리", 42, "독일", "슈바르츠발트", "Schladerer", 60000, "체리"],
      ["모랑 윌리아민", "Morand Williamine", "오 드 비 · 서양배", 43, "스위스", "발레", "Louis Morand", 80000, "윌리엄스 배"],
      ["츠바크 팔링카 바라크", "Zwack Pálinka Barack", "팔링카 · 살구", 40, "헝가리", "—", "Zwack", 50000, "살구"],
      ["마라스카 슬리보비차", "Maraska Šljivovica", "슬리보비츠 · 자두", 40, "크로아티아", "자다르", "Maraska", 40000, "자두"],
    ]);
  }


  // ══ 위스키 — 버번·라이·아이리시·재패니즈·블렌디드·월드
  {
    const US = "미국", KY = "켄터키", BB = "켄터키 스트레이트 버번", RYE = "스트레이트 라이", MB = "옥수수/호밀/맥아 보리", MW = "옥수수/밀/맥아 보리", RM = "호밀/옥수수/맥아 보리";
    rows("whisky", "bourbon", [
      ["버팔로 트레이스 이글 레어 17년", "Eagle Rare 17 Year Old", BB, 50.5, US, KY, "Buffalo Trace Distillery", 2000000, MB],
      ["E.H. 테일러 스몰 배치", "E.H. Taylor Jr. Small Batch Bottled-in-Bond", "켄터키 스트레이트 버번 · BiB", 50, US, KY, "Buffalo Trace Distillery", 120000, MB],
      ["E.H. 테일러 스트레이트 라이", "E.H. Taylor Jr. Straight Rye", "스트레이트 라이 · BiB", 50, US, KY, "Buffalo Trace Distillery", 150000, "호밀/맥아 보리"],
      ["스태그 주니어", "Stagg Kentucky Straight Bourbon", "켄터키 스트레이트 버번 · 배럴 프루프", 64, US, KY, "Buffalo Trace Distillery", 200000, MB],
      ["조지 T. 스태그", "George T. Stagg", "켄터키 스트레이트 버번 · 배럴 프루프", 65, US, KY, "Buffalo Trace Distillery", 1500000, MB],
      ["블랑톤 스트레이트 프롬 더 배럴", "Blanton's Straight from the Barrel", "켄터키 스트레이트 버번 · 싱글 배럴", 64, US, KY, "Buffalo Trace Distillery", 500000, MB],
      ["블랑톤 골드 에디션", "Blanton's Gold Edition", "켄터키 스트레이트 버번 · 싱글 배럴", 51.5, US, KY, "Buffalo Trace Distillery", 350000, MB],
      ["W.L. 웰러 12년", "W.L. Weller 12 Year Old", "켄터키 스트레이트 휘티드 버번", 45, US, KY, "Buffalo Trace Distillery", 250000, MW],
      ["W.L. 웰러 앤티크 107", "Old Weller Antique 107", "켄터키 스트레이트 휘티드 버번", 53.5, US, KY, "Buffalo Trace Distillery", 150000, MW],
      ["사제락 라이", "Sazerac Rye", RYE, 45, US, KY, "Buffalo Trace Distillery", 70000, RM],
      ["러셀스 리저브 싱글 배럴", "Russell's Reserve Single Barrel", "켄터키 스트레이트 버번 · 싱글 배럴", 55, US, KY, "Wild Turkey", 120000, MB],
      ["와일드 터키 롱브랜치", "Wild Turkey Longbranch", "켄터키 스트레이트 버번", 43, US, KY, "Wild Turkey", 70000, MB],
      ["와일드 터키 켄터키 스피릿", "Wild Turkey Kentucky Spirit", "켄터키 스트레이트 버번 · 싱글 배럴", 50.5, US, KY, "Wild Turkey", 100000, MB],
      ["와일드 터키 101 라이", "Wild Turkey 101 Rye", RYE, 50.5, US, KY, "Wild Turkey", 60000, RM],
      ["노브 크릭 싱글 배럴 리저브", "Knob Creek Single Barrel Reserve 9 Year", "켄터키 스트레이트 버번 · 싱글 배럴", 60, US, KY, "Jim Beam (Suntory Global Spirits)", 100000, MB],
      ["노브 크릭 라이", "Knob Creek Straight Rye", RYE, 50, US, KY, "Jim Beam (Suntory Global Spirits)", 70000, RM],
      ["부커스 버번", "Booker's Bourbon", "켄터키 스트레이트 버번 · 배럴 프루프", 63, US, KY, "Jim Beam (Suntory Global Spirits)", 150000, MB],
      ["베이커스 7년", "Baker's 7 Year Old Single Barrel", "켄터키 스트레이트 버번 · 싱글 배럴", 53.5, US, KY, "Jim Beam (Suntory Global Spirits)", 110000, MB],
      ["올드 그랜드 대드 114", "Old Grand-Dad 114", "켄터키 스트레이트 버번", 57, US, KY, "Jim Beam (Suntory Global Spirits)", 60000, RM],
      ["리틀 북", "Little Book", "블렌디드 스트레이트 위스키 · 캐스크 스트렝스", 60, US, KY, "Jim Beam (Suntory Global Spirits)", 200000, MB],
      ["메이커스 마크 캐스크 스트렝스", "Maker's Mark Cask Strength", "켄터키 스트레이트 휘티드 버번 · 캐스크 스트렝스", 55, US, KY, "Maker's Mark", 100000, MW],
      ["메이커스 마크 101", "Maker's Mark 101", "켄터키 스트레이트 휘티드 버번", 50.5, US, KY, "Maker's Mark", 70000, MW],
      ["엘라이저 크레이그 배럴 프루프", "Elijah Craig Barrel Proof", "켄터키 스트레이트 버번 · 배럴 프루프", 64, US, KY, "Heaven Hill", 130000, MB],
      ["엘라이저 크레이그 18년", "Elijah Craig 18 Year Old Single Barrel", "켄터키 스트레이트 버번 · 싱글 배럴", 45, US, KY, "Heaven Hill", 500000, MB],
      ["엘라이저 크레이그 스트레이트 라이", "Elijah Craig Straight Rye", RYE, 47, US, KY, "Heaven Hill", 50000, RM],
      ["헤븐 힐 보틀드 인 본드 7년", "Heaven Hill Bottled-in-Bond 7 Year Old", "켄터키 스트레이트 버번 · BiB", 50, US, KY, "Heaven Hill", 60000, MB],
      ["올드 피츠제럴드 BiB", "Old Fitzgerald Bottled-in-Bond", "켄터키 스트레이트 휘티드 버번 · BiB", 50, US, KY, "Heaven Hill", 300000, MW],
      ["라세니 켄터키 스트레이트 버번", "Larceny Kentucky Straight Bourbon", "켄터키 스트레이트 휘티드 버번", 46, US, KY, "Heaven Hill", 50000, MW],
      ["리튼하우스 라이 BiB", "Rittenhouse Rye Bottled-in-Bond", "스트레이트 라이 · BiB", 50, US, KY, "Heaven Hill", 45000, RM],
      ["파이크스빌 라이", "Pikesville Straight Rye 6 Year", RYE, 55, US, KY, "Heaven Hill", 80000, RM],
      ["포 로지스 스몰 배치 셀렉트", "Four Roses Small Batch Select", "켄터키 스트레이트 버번", 52, US, KY, "Four Roses (Kirin)", 90000, MB],
      ["올드 포레스터 1920 프로히비션 스타일", "Old Forester 1920 Prohibition Style", "켄터키 스트레이트 버번", 57.5, US, KY, "Brown-Forman", 80000, MB],
      ["올드 포레스터 1910 올드 파인 위스키", "Old Forester 1910 Old Fine Whisky", "켄터키 스트레이트 버번 · 더블 배럴", 46.5, US, KY, "Brown-Forman", 80000, MB],
      ["올드 포레스터 스트레이트 라이", "Old Forester Rye", RYE, 50, US, KY, "Brown-Forman", 50000, RM],
      ["우드포드 리저브 더블 오크드", "Woodford Reserve Double Oaked", "켄터키 스트레이트 버번", 45.2, US, KY, "Brown-Forman", 100000, MB],
      ["우드포드 리저브 라이", "Woodford Reserve Kentucky Straight Rye", RYE, 45.2, US, KY, "Brown-Forman", 70000, RM],
      ["잭 다니엘 보틀드 인 본드", "Jack Daniel's Bottled-in-Bond", "테네시 위스키 · BiB", 50, US, "테네시 린치버그", "Jack Daniel Distillery", 50000, "옥수수/호밀/맥아 보리"],
      ["잭 다니엘 10년", "Jack Daniel's 10 Year Old", "테네시 위스키", 48.5, US, "테네시 린치버그", "Jack Daniel Distillery", 150000, "옥수수/호밀/맥아 보리"],
      ["잭 다니엘 싱글 배럴 배럴 프루프", "Jack Daniel's Single Barrel Barrel Proof", "테네시 위스키 · 배럴 프루프", 65, US, "테네시 린치버그", "Jack Daniel Distillery", 120000, "옥수수/호밀/맥아 보리"],
      ["조지 디켈 12년", "George Dickel No.12", "테네시 위스키", 45, US, "테네시 툴라호마", "George Dickel (Diageo)", 45000, "옥수수/호밀/맥아 보리"],
      ["앤젤스 엔비 캐스크 스트렝스", "Angel's Envy Cask Strength", "스트레이트 버번 · 포트 캐스크 피니시", 60, US, KY, "Angel's Envy (Bacardi)", 350000, MB],
      ["앤젤스 엔비 라이", "Angel's Envy Rye Rum Cask Finish", "라이 · 럼 캐스크 피니시", 50, US, KY, "Angel's Envy (Bacardi)", 150000, "호밀/맥아 보리"],
      ["미크터스 US*1 켄터키 스트레이트 라이", "Michter's US*1 Kentucky Straight Rye", RYE, 42.4, US, KY, "Michter's Distillery", 90000, RM],
      ["미크터스 10년 버번", "Michter's 10 Year Kentucky Straight Bourbon", "켄터키 스트레이트 버번 · 싱글 배럴", 47.2, US, KY, "Michter's Distillery", 300000, MB],
      ["미크터스 US*1 사워 매시", "Michter's US*1 Sour Mash", "아메리칸 위스키 · 사워 매시", 43, US, KY, "Michter's Distillery", 90000, MB],
      ["윌렛 포트 스틸 리저브", "Willett Pot Still Reserve", "켄터키 스트레이트 버번", 47, US, KY, "Willett Distillery", 100000, MB],
      ["윌렛 패밀리 이스테이트 4년 라이", "Willett Family Estate 4 Year Rye", RYE, 55, US, KY, "Willett Distillery", 150000, RM],
      ["노아스 밀", "Noah's Mill", "켄터키 스트레이트 버번", 57.15, US, KY, "Willett Distillery", 120000, MB],
      ["1792 스몰 배치", "1792 Small Batch", "켄터키 스트레이트 버번", 46.85, US, KY, "Barton 1792 Distillery", 50000, MB],
      ["1792 풀 프루프", "1792 Full Proof", "켄터키 스트레이트 버번", 62.5, US, KY, "Barton 1792 Distillery", 90000, MB],
      ["베리 올드 바턴", "Very Old Barton Bottled-in-Bond", "켄터키 스트레이트 버번 · BiB", 50, US, KY, "Barton 1792 Distillery", 40000, MB],
      ["바즈타운 버번 컴퍼니 퓨전", "Bardstown Bourbon Company Fusion Series", "켄터키 스트레이트 버번", 49, US, KY, "Bardstown Bourbon Company", 90000, MB],
      ["하이 웨스트 아메리칸 프레리 버번", "High West American Prairie Bourbon", "블렌디드 스트레이트 버번", 46, US, "유타 파크시티", "High West Distillery", 60000, MB],
      ["하이 웨스트 렌데부 라이", "High West Rendezvous Rye", "블렌디드 스트레이트 라이", 46, US, "유타 파크시티", "High West Distillery", 90000, RM],
      ["휘슬피그 10년 라이", "WhistlePig 10 Year Old Straight Rye", RYE, 50, US, "버몬트", "WhistlePig", 150000, "호밀"],
      ["휘슬피그 피기백 6년", "WhistlePig PiggyBack 6 Year Rye", RYE, 48.28, US, "버몬트", "WhistlePig", 70000, "호밀"],
      ["킹스 카운티 스트레이트 버번", "Kings County Straight Bourbon", "스트레이트 버번", 45, US, "뉴욕 브루클린", "Kings County Distillery", 90000, "옥수수/맥아 보리"],
      ["발코네스 베이비 블루", "Balcones Baby Blue Corn Whisky", "텍사스 콘 위스키", 46, US, "텍사스 웨이코", "Balcones Distilling", 80000, "블루 옥수수"],
      ["발코네스 텍사스 싱글 몰트", "Balcones Texas Single Malt", "아메리칸 싱글 몰트", 53, US, "텍사스 웨이코", "Balcones Distilling", 150000, "맥아 보리"],
      ["스트라나한스 콜로라도 위스키", "Stranahan's Original Colorado Whiskey", "아메리칸 싱글 몰트", 47, US, "콜로라도 덴버", "Stranahan's", 80000, "맥아 보리"],
    ]);
    const IE = "아일랜드", PS = "아이리시 싱글 팟 스틸", BAR = "맥아 보리/비맥아 보리";
    rows("whisky", "irish", [
      ["레드브레스트 15년", "Redbreast 15 Year Old", PS, 46, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 200000, BAR],
      ["레드브레스트 21년", "Redbreast 21 Year Old", PS, 46, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 500000, BAR],
      ["레드브레스트 12년 캐스크 스트렝스", "Redbreast 12 Year Old Cask Strength", PS, 57, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 180000, BAR],
      ["그린 스팟", "Green Spot", PS, 40, IE, "코크 미들턴", "Mitchell & Son / Irish Distillers", 90000, BAR],
      ["옐로 스팟 12년", "Yellow Spot 12 Year Old", PS, 46, IE, "코크 미들턴", "Mitchell & Son / Irish Distillers", 150000, BAR],
      ["파워스 존스 레인", "Powers John's Lane Release 12 Year Old", PS, 46, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 110000, BAR],
      ["미들턴 베리 레어", "Midleton Very Rare", "아이리시 블렌디드", 40, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 300000, "맥아 보리/옥수수"],
      ["제임슨 18년", "Jameson 18 Year Old", "아이리시 블렌디드", 40, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 250000, "맥아 보리/옥수수"],
      ["제임슨 크레스티드", "Jameson Crested", "아이리시 블렌디드", 40, IE, "코크 미들턴", "Irish Distillers (Pernod Ricard)", 50000, "맥아 보리/옥수수"],
      ["부시밀즈 16년", "Bushmills 16 Year Old Single Malt", "아이리시 싱글 몰트", 40, IE, "북아일랜드 앤트림", "Bushmills", 180000, "맥아 보리"],
      ["부시밀즈 21년", "Bushmills 21 Year Old Single Malt", "아이리시 싱글 몰트", 40, IE, "북아일랜드 앤트림", "Bushmills", 350000, "맥아 보리"],
      ["틸링 블랙피츠 피티드", "Teeling Blackpitts Peated Single Malt", "아이리시 싱글 몰트 · 피트", 46, IE, "더블린", "Teeling Whiskey", 90000, "맥아 보리"],
      ["틸링 싱글 팟 스틸", "Teeling Single Pot Still", PS, 46, IE, "더블린", "Teeling Whiskey", 90000, BAR],
      ["코네마라 피티드 싱글 몰트", "Connemara Peated Single Malt", "아이리시 싱글 몰트 · 피트", 40, IE, "라우스 쿨리", "Cooley (Suntory Global Spirits)", 60000, "맥아 보리"],
      ["더 타이어코넬 10년 셰리 캐스크", "The Tyrconnell 10 Year Old Sherry Cask Finish", "아이리시 싱글 몰트", 46, IE, "라우스 쿨리", "Cooley (Suntory Global Spirits)", 90000, "맥아 보리"],
      ["웨스트코크 10년", "West Cork 10 Year Old Single Malt", "아이리시 싱글 몰트", 40, IE, "코크 스키버린", "West Cork Distillers", 60000, "맥아 보리"],
      ["더 슬레인", "Slane Irish Whiskey Triple Casked", "아이리시 블렌디드", 40, IE, "미스 슬레인", "Slane Distillery (Brown-Forman)", 50000, "맥아 보리/옥수수"],
      ["딩글 싱글 몰트", "Dingle Single Malt", "아이리시 싱글 몰트", 46.5, IE, "케리 딩글", "Dingle Distillery", 120000, "맥아 보리"],
    ]);
    const JP = "일본";
    rows("whisky", "japanese", [
      ["야마자키 25년", "The Yamazaki 25 Year Old", "재패니즈 싱글 몰트", 43, JP, "오사카 야마자키", "Suntory", 15000000, "맥아 보리"],
      ["하쿠슈 25년", "The Hakushu 25 Year Old", "재패니즈 싱글 몰트", 43, JP, "야마나시 하쿠슈", "Suntory", 12000000, "맥아 보리"],
      ["히비키 30년", "Hibiki 30 Year Old", "재패니즈 블렌디드", 43, JP, "—", "Suntory", 20000000, "맥아 보리/곡물"],
      ["히비키 블로섬 하모니", "Hibiki Blossom Harmony", "재패니즈 블렌디드", 43, JP, "—", "Suntory", 400000, "맥아 보리/곡물"],
      ["요이치 10년", "Yoichi 10 Year Old", "재패니즈 싱글 몰트", 45, JP, "홋카이도 요이치", "Nikka", 300000, "맥아 보리"],
      ["미야기쿄 10년", "Miyagikyo 10 Year Old", "재패니즈 싱글 몰트", 45, JP, "미야기 센다이", "Nikka", 300000, "맥아 보리"],
      ["다케쓰루 17년", "Taketsuru 17 Year Old Pure Malt", "재패니즈 블렌디드 몰트", 43, JP, "—", "Nikka", 600000, "맥아 보리"],
      ["닛카 세션", "Nikka Session Blended Malt", "재패니즈 블렌디드 몰트", 43, JP, "—", "Nikka", 70000, "맥아 보리"],
      ["닛카 프롬 더 배럴 프론티어", "Nikka Frontier", "재패니즈 블렌디드", 48, JP, "—", "Nikka", 50000, "맥아 보리/곡물"],
      ["이치로즈 몰트 더블 디스틸러리", "Ichiro's Malt Double Distilleries", "재패니즈 블렌디드 몰트", 46.5, JP, "사이타마 지치부", "Venture Whisky", 200000, "맥아 보리"],
      ["이치로즈 몰트 미즈나라 우드 리저브", "Ichiro's Malt Mizunara Wood Reserve", "재패니즈 블렌디드 몰트", 46.5, JP, "사이타마 지치부", "Venture Whisky", 250000, "맥아 보리"],
      ["치치부 온 더 웨이", "Chichibu On The Way", "재패니즈 싱글 몰트", 51.5, JP, "사이타마 지치부", "Venture Whisky", 400000, "맥아 보리"],
      ["마르스 이와이 45", "Mars Iwai 45", "재패니즈 블렌디드", 45, JP, "나가노 고마가타케", "Hombo Shuzo", 40000, "맥아 보리/곡물"],
      ["마르스 쓰누키 싱글 몰트", "Mars Tsunuki Single Malt", "재패니즈 싱글 몰트", 50, JP, "가고시마 쓰누키", "Hombo Shuzo", 200000, "맥아 보리"],
      ["가노스케 더블 디스틸러리", "Kanosuke Double Distillery Blended Malt", "재패니즈 블렌디드 몰트", 48, JP, "가고시마 히오키", "Komasa Jyozo", 150000, "맥아 보리"],
      ["나가하마 아마하간 에디션 No.1", "Nagahama Amahagan World Malt Edition No.1", "블렌디드 몰트", 47, JP, "시가 나가하마", "Nagahama Distillery", 80000, "맥아 보리"],
      ["시즈오카 싱글 몰트 콘택트 S", "Shizuoka Single Malt Contact S", "재패니즈 싱글 몰트", 55.5, JP, "시즈오카", "Gaiaflow", 250000, "맥아 보리"],
      ["후지 싱글 그레인", "Fuji Single Grain", "재패니즈 싱글 그레인", 46, JP, "시즈오카 고텐바", "Kirin Fuji Gotemba", 100000, "옥수수"],
      ["후지 싱글 블렌디드", "Fuji Single Blended", "재패니즈 블렌디드", 43, JP, "시즈오카 고텐바", "Kirin Fuji Gotemba", 90000, "맥아 보리/옥수수"],
      ["아카시 싱글 몰트 셰리 캐스크", "Akashi Single Malt Sherry Cask", "재패니즈 싱글 몰트", 50, JP, "효고 아카시", "Eigashima Shuzo", 200000, "맥아 보리"],
      ["사부로마루 III 디 엠프리스", "Saburomaru III The Empress", "재패니즈 싱글 몰트 · 피트", 48, JP, "도야마", "Wakatsuru Shuzo", 200000, "맥아 보리"],
      ["가이쿄 하토자키 퓨어 몰트", "Kaikyo Hatozaki Pure Malt", "블렌디드 몰트", 46, JP, "효고 아카시", "Akashi Sake Brewery", 80000, "맥아 보리"],
    ]);
    const SC = "스코틀랜드", BL = "블렌디드 스카치", BM = "블렌디드 몰트 스카치", SG = "싱글 그레인 스카치", MG = "맥아 보리/곡물";
    rows("whisky", "blend", [
      ["조니워커 블루 라벨 고스트 앤 레어", "Johnnie Walker Blue Label Ghost and Rare", BL, 43.8, SC, "—", "Diageo", 500000, MG],
      ["조니워커 킹 조지 5세", "Johnnie Walker King George V", BL, 43, SC, "—", "Diageo", 800000, MG],
      ["조니워커 하이 라이", "Johnnie Walker High Rye", BL, 45, SC, "—", "Diageo", 40000, "맥아 보리/호밀"],
      ["로열 살루트 32년", "Royal Salute 32 Year Old Union of the Crowns", BL, 40, SC, "—", "Chivas Brothers (Pernod Ricard)", 4000000, MG],
      ["로열 살루트 21년 폴로 에스탄시아", "Royal Salute 21 Year Old Polo Estancia Edition", BL, 40, SC, "—", "Chivas Brothers (Pernod Ricard)", 300000, MG],
      ["시바스 리갈 엑스트라 15", "Chivas Regal 15 Year Old XV", BL, 40, SC, "—", "Chivas Brothers (Pernod Ricard)", 90000, MG],
      ["시바스 리갈 얼티스", "Chivas Regal Ultis", BM, 40, SC, "스페이사이드", "Chivas Brothers (Pernod Ricard)", 350000, "맥아 보리"],
      ["발렌타인 7년 버번 피니시", "Ballantine's 7 Year Old Bourbon Barrel Finish", BL, 40, SC, "—", "Chivas Brothers (Pernod Ricard)", 35000, MG],
      ["발렌타인 40년", "Ballantine's 40 Year Old", BL, 43, SC, "—", "Chivas Brothers (Pernod Ricard)", 8000000, MG],
      ["듀어스 18년", "Dewar's 18 Year Old The Vintage", BL, 40, SC, "—", "John Dewar & Sons (Bacardi)", 150000, MG],
      ["듀어스 25년 시그니처", "Dewar's 25 Year Old The Signature", BL, 40, SC, "—", "John Dewar & Sons (Bacardi)", 350000, MG],
      ["컴파스 박스 헤도니즘", "Compass Box Hedonism", "블렌디드 그레인 스카치", 43, SC, "—", "Compass Box", 150000, "곡물"],
      ["컴파스 박스 스파이스 트리", "Compass Box The Spice Tree", BM, 46, SC, "—", "Compass Box", 100000, "맥아 보리"],
      ["컴파스 박스 글래스고 블렌드", "Compass Box Glasgow Blend", BL, 43, SC, "—", "Compass Box", 60000, MG],
      ["컴파스 박스 아티스트 블렌드", "Compass Box Artist Blend", BL, 43, SC, "—", "Compass Box", 50000, MG],
      ["멍키 숄더 스모키 몽키", "Monkey Shoulder Smokey Monkey", BM, 40, SC, "—", "William Grant & Sons", 60000, "맥아 보리"],
      ["더 디콘", "The Deacon", BL, 40, SC, "—", "Sip Better Co.", 50000, MG],
      ["그란츠 스모키", "Grant's Smoky", BL, 40, SC, "—", "William Grant & Sons", 30000, MG],
      ["헤이그 클럽", "Haig Club Clubman", SG, 40, SC, "파이프 캐머런브리지", "Diageo", 50000, "밀/맥아 보리"],
      ["로크 로몬드 싱글 그레인", "Loch Lomond Single Grain", SG, 46, SC, "로크 로몬드", "Loch Lomond Group", 50000, "맥아 보리"],
      ["스카치 블루 21년", "Scotch Blue 21", BL, 40, SC, "—", "Lotte Chilsung", 200000, MG],
      ["윈저 21년", "Windsor 21", BL, 40, SC, "—", "Diageo Korea / Drinks International", 200000, MG],
      ["임페리얼 17년", "Imperial 17", BL, 40, SC, "—", "Drinks International", 70000, MG],
      ["올드파 18년", "Old Parr 18 Year Old", BL, 40, SC, "—", "Diageo", 150000, MG],
      ["올드파 수페리어", "Old Parr Superior", BL, 43, SC, "—", "Diageo", 400000, MG],
      ["J&B 리저브 15년", "J&B Reserve 15 Year Old", BL, 40, SC, "—", "Diageo", 70000, MG],
      ["화이트 앤 맥케이 13년", "Whyte & Mackay 13 Year Old", BL, 40, SC, "—", "Whyte & Mackay", 50000, MG],
      ["블랙 앤 화이트", "Black & White", BL, 40, SC, "—", "Diageo", 25000, MG],
      ["커티삭 프로히비션", "Cutty Sark Prohibition Edition", BL, 50, SC, "—", "La Martiniquaise", 50000, MG],
    ]);
    rows("whisky", "spirit", [
      ["암룻 피티드 인디안 싱글 몰트", "Amrut Peated Indian Single Malt", "인디안 싱글 몰트 · 피트", 46, "인도", "벵갈루루", "Amrut Distilleries", 100000, "맥아 보리", "scotchPeat"],
      ["암룻 인터미디에이트 셰리", "Amrut Intermediate Sherry", "인디안 싱글 몰트", 57.1, "인도", "벵갈루루", "Amrut Distilleries", 150000, "맥아 보리", "scotchSherry"],
      ["폴 존 피티드 셀렉트 캐스크", "Paul John Peated Select Cask", "인디안 싱글 몰트 · 피트", 55.5, "인도", "고아", "John Distilleries", 120000, "맥아 보리", "scotchPeat"],
      ["인드리 트리니", "Indri Trini Three Wood", "인디안 싱글 몰트", 46, "인도", "하리아나", "Piccadily Distilleries", 80000, "맥아 보리", "scotchLight"],
      ["카발란 솔리스트 버번 캐스크", "Kavalan Solist Ex-Bourbon Cask", "타이완 싱글 몰트", 57, "대만", "이란현", "King Car", 250000, "맥아 보리", "scotchLight"],
      ["카발란 포디움", "Kavalan Podium", "타이완 싱글 몰트", 46, "대만", "이란현", "King Car", 120000, "맥아 보리", "scotchLight"],
      ["난터우 오마르 버번 캐스크", "Nantou Omar Bourbon Cask", "타이완 싱글 몰트", 46, "대만", "난터우", "Nantou Distillery (TTL)", 90000, "맥아 보리", "scotchLight"],
      ["스타워드 투폴드", "Starward Two-Fold", "오스트레일리안 위스키", 40, "호주", "멜버른", "Starward", 70000, "밀/맥아 보리", "scotchLight"],
      ["설리번스 코브 프렌치 오크", "Sullivans Cove French Oak Cask", "오스트레일리안 싱글 몰트", 47.5, "호주", "태즈메이니아", "Sullivans Cove", 400000, "맥아 보리", "scotchLight"],
      ["라크 클래식 캐스크", "Lark Classic Cask", "오스트레일리안 싱글 몰트", 43, "호주", "태즈메이니아", "Lark Distillery", 200000, "맥아 보리", "scotchLight"],
      ["밀크 앤 허니 클래식", "M&H Classic Single Malt", "이스라엘 싱글 몰트", 46, "이스라엘", "텔아비브", "Milk & Honey Distillery", 90000, "맥아 보리", "scotchLight"],
      ["코츠워즈 싱글 몰트", "Cotswolds Single Malt", "잉글리시 싱글 몰트", 46, "잉글랜드", "코츠월드", "Cotswolds Distillery", 90000, "맥아 보리", "scotchLight"],
      ["더 잉글리시 오리지널", "The English Original Single Malt", "잉글리시 싱글 몰트", 43, "잉글랜드", "노퍽", "The English Distillery", 70000, "맥아 보리", "scotchLight"],
      ["펜데린 마데이라 피니시", "Penderyn Madeira Finish", "웰시 싱글 몰트", 46, "웨일스", "브레콘 비컨스", "Penderyn Distillery", 80000, "맥아 보리", "scotchLight"],
      ["하이 코스트 비지터 센터 캐스크", "High Coast Whisky Visitor Center Cask", "스웨디시 싱글 몰트", 48, "스웨덴", "회가쿠스텐", "High Coast Distillery", 120000, "맥아 보리", "scotchPeat"],
      ["브렌 에스테이트 캐스크", "Brenne Estate Cask French Single Malt", "프렌치 싱글 몰트", 40, "프랑스", "꼬냑", "Brenne", 80000, "맥아 보리", "scotchLight"],
      ["아르모리크 클래식", "Armorik Classic Single Malt", "프렌치 싱글 몰트", 46, "프랑스", "브르타뉴", "Distillerie Warenghem", 60000, "맥아 보리", "scotchLight"],
      ["크라운 로열 노던 하베스트 라이", "Crown Royal Northern Harvest Rye", "캐나디안 위스키", 45, "캐나다", "매니토바 김리", "Crown Royal (Diageo)", 50000, "호밀", "bourbon"],
      ["로트 40 캐나디안 라이", "Lot No. 40 Rye", "캐나디안 라이", 43, "캐나다", "온타리오 윈저", "Corby (Pernod Ricard)", 60000, "호밀/맥아 호밀", "bourbon"],
      ["포티 크릭 컨페더레이션 오크", "Forty Creek Confederation Oak Reserve", "캐나디안 위스키", 40, "캐나다", "온타리오 그림즈비", "Forty Creek (Campari)", 60000, "호밀/보리/옥수수", "bourbon"],
      ["쓰리 소사이어티 기원", "Three Societies Ki One Single Malt", "코리안 싱글 몰트", 46, "한국", "경기 남양주", "쓰리소사이어티스", 90000, "맥아 보리", "scotchLight"],
      ["김창수 위스키 쉐리 캐스크", "Kim Chang Soo Whisky Sherry Cask", "코리안 싱글 몰트", 60, "한국", "경기 김포", "김창수위스키증류소", 250000, "맥아 보리", "scotchSherry"],
    ]);
  }


  // ══ 중국술 — 백주(향형별)·황주·대만·기타
  {
    const CN = "중국", SG = "수수/밀·보리·완두", SO = "수수", MT = "贵州茅台酒股份有限公司", GZ = "구이저우 런화이 마오타이진";
    const JX = "장향형 백주", NX = "농향형 백주", QX = "청향형 백주", FX = "봉향형 백주", MX = "미향형 백주", JZ = "겸향형 백주", DX = "동향형 백주", ZX = "지마향형 백주", TX = "특향형 백주", LX = "노백간향형 백주", CX = "시향형 백주", FUX = "복욱향형 백주";
    rows("baijiu", "baijiu", [
      // 장향형
      ["마오타이 생초주 계묘 토끼해", "Kweichow Moutai Zodiac Year of the Rabbit|贵州茅台酒 癸卯兔年", JX, 53, CN, GZ, MT, 700000, SO],
      ["마오타이 진품", "Kweichow Moutai Zhenpin|贵州茅台酒 珍品", JX, 53, CN, GZ, MT, 1000000, SO],
      ["마오타이 30년", "Kweichow Moutai Aged 30 Years|贵州茅台酒 30年", JX, 53, CN, GZ, MT, 3500000, SO],
      ["마오타이 50년", "Kweichow Moutai Aged 50 Years|贵州茅台酒 50年", JX, 53, CN, GZ, MT, 7000000, SO],
      ["마오타이 징핀", "Kweichow Moutai Jingpin|贵州茅台酒 精品", JX, 53, CN, GZ, MT, 1100000, SO],
      ["화이좡 주", "Huaizhuang Jiu|怀庄酒", JX, 53, CN, GZ, "贵州怀庄酒业", 50000, SO],
      ["궈타이 궈인", "Guotai Guoyin|国台 国印", JX, 53, CN, GZ, "贵州国台酒业", 200000, SO],
      ["궈타이 룽녠", "Guotai Longnian|国台 龙年", JX, 53, CN, GZ, "贵州国台酒业", 500000, SO],
      ["진사 후이사 5성", "Jinsha Huisha 5 Star|金沙回沙 五星", JX, 53, CN, "구이저우 진사", "贵州金沙窖酒酒业", 100000, SO],
      ["진사 자이야오", "Jinsha Zhaiyao|金沙 摘要", JX, 53, CN, "구이저우 진사", "贵州金沙窖酒酒业", 150000, SO],
      ["시주 쥔핀 장", "Xijiu Junpin Jiang|习酒 君品 酱", JX, 53, CN, "구이저우 시수이", "贵州习酒", 250000, SO],
      ["시주 인즈", "Xijiu Yinzhi|习酒 银质", JX, 53, CN, "구이저우 시수이", "贵州习酒", 40000, SO],
      ["시주 진즈", "Xijiu Jinzhi|习酒 金质", JX, 53, CN, "구이저우 시수이", "贵州习酒", 60000, SO],
      ["랑주 칭화랑 20년", "Langjiu Qinghualang 20|郎酒 青花郎 20", JX, 53, CN, "쓰촨 구린", "四川古蔺郎酒厂", 250000, SO],
      ["랑주 칭화랑 30년", "Langjiu Qinghualang 30|郎酒 青花郎 30", JX, 53, CN, "쓰촨 구린", "四川古蔺郎酒厂", 600000, SO],
      ["랑주 홍화랑 10년", "Langjiu Honghualang 10|郎酒 红花郎 10", JX, 53, CN, "쓰촨 구린", "四川古蔺郎酒厂", 70000, SO],
      ["랑주 순핀랑", "Langjiu Shunpinlang|郎酒 顺品郎", "겸향형 백주", 45, CN, "쓰촨 구린", "四川古蔺郎酒厂", 25000, SO],
      ["랑주 샤오랑주", "Langjiu Xiaolangjiu|郎酒 小郎酒", "겸향형 백주", 45, CN, "쓰촨 구린", "四川古蔺郎酒厂", 10000, SO],
      ["전주 전 30", "Zhenjiu Zhen 30|珍酒 珍三十", JX, 53, CN, "구이저우 쭌이", "贵州珍酒酿酒", 300000, SO],
      ["전주 전 8", "Zhenjiu Zhen 8|珍酒 珍八", JX, 53, CN, "구이저우 쭌이", "贵州珍酒酿酒", 80000, SO],
      ["우링주 장향", "Wuling Jiu Jiangxiang|武陵酒 酱香 少酱", JX, 53, CN, "후난 창더", "湖南武陵酒", 200000, SO],
      ["디아오위타이 궈빈 15", "Diaoyutai Guobin 15|钓鱼台 国宾 15", JX, 53, CN, GZ, "贵州钓鱼台国宾酒业", 300000, SO],
      // 농향형
      ["우량예 경전", "Wuliangye Jingdian|五粮液 经典", NX, 52, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 600000, "수수/쌀/찹쌀/밀/옥수수"],
      ["우량예 1995", "Wuliangye 1995 Commemorative|五粮液 1995", NX, 52, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 400000, "수수/쌀/찹쌀/밀/옥수수"],
      ["우량예 50년", "Wuliangye 50 Years|五粮液 五十年", NX, 52, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 3000000, "수수/쌀/찹쌀/밀/옥수수"],
      ["우량예 39도", "Wuliangye 39%|五粮液 39度", NX, 39, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 180000, "수수/쌀/찹쌀/밀/옥수수"],
      ["우량터취", "Wuliang Tequ|五粮特曲", NX, 52, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 60000, "수수/쌀/찹쌀/밀/옥수수"],
      ["우량춘 2대", "Wuliangchun 2nd Gen.|五粮春 二代", NX, 45, CN, "쓰촨 이빈", "宜宾五粮液股份有限公司", 45000, "수수/쌀/찹쌀/밀/옥수수"],
      ["젠난춘 진젠난 K9", "Jiannanchun Jinjiannan K9|剑南春 金剑南 K9", NX, 52, CN, "쓰촨 몐주", "四川剑南春", 80000, "수수/쌀/찹쌀/밀/옥수수"],
      ["젠난춘 둥팡훙", "Jiannanchun Dongfanghong|剑南春 东方红", NX, 52, CN, "쓰촨 몐주", "四川剑南春", 200000, "수수/쌀/찹쌀/밀/옥수수"],
      ["궈자오 1573 핀젠", "Guojiao 1573 Pinjian|国窖1573 品鉴", NX, 52, CN, "쓰촨 루저우", "泸州老窖", 350000, SO],
      ["궈자오 1573 중궈핀웨이", "Guojiao 1573 Zhongguo Pinwei|国窖1573 中国品味", NX, 52, CN, "쓰촨 루저우", "泸州老窖", 1000000, SO],
      ["루저우 라오자오 자오링 60", "Luzhou Laojiao Jiaoling 60|泸州老窖 窖龄 60", NX, 52, CN, "쓰촨 루저우", "泸州老窖", 150000, SO],
      ["루저우 라오자오 헤이가이", "Luzhou Laojiao Heigai|泸州老窖 黑盖", NX, 42, CN, "쓰촨 루저우", "泸州老窖", 20000, SO],
      ["루저우 라오자오 얼취", "Luzhou Laojiao Erqu|泸州老窖 二曲", NX, 52, CN, "쓰촨 루저우", "泸州老窖", 15000, SO],
      ["수이징팡 뎬창", "Shuijingfang Dianzang|水井坊 典藏", NX, 52, CN, "쓰촨 청두", "四川水井坊 (Diageo)", 500000, "수수/쌀/찹쌀/밀/옥수수"],
      ["서더 톈쯔", "Shede Zhihui Shede|舍得 智慧舍得", NX, 52, CN, "쓰촨 쑤이닝 서훙", "舍得酒业", 400000, SO],
      ["퉈파이 6년", "Tuopai Liunian|沱牌 六粮", NX, 50, CN, "쓰촨 쑤이닝 서훙", "舍得酒业", 25000, SO],
      ["양허 멍즈란 M3", "Yanghe Haizhilan Meng Zhi Lan M3|洋河 梦之蓝 M3", "면유형 농향 백주", 52, CN, "장쑤 쑤첸 양허", "江苏洋河酒厂", 120000, SO],
      ["양허 서우궁반", "Yanghe Shouchuang|洋河 手工班", "면유형 농향 백주", 52, CN, "장쑤 쑤첸 양허", "江苏洋河酒厂", 600000, SO],
      ["양허 하이즈란 42도", "Yanghe Haizhilan 42%|洋河 海之蓝 42度", "면유형 농향 백주", 42, CN, "장쑤 쑤첸 양허", "江苏洋河酒厂", 40000, SO],
      ["솽거우 다취", "Shuanggou Daqu|双沟 大曲", NX, 46, CN, "장쑤 쓰훙 솽거우", "江苏双沟酒业", 15000, SO],
      ["솽거우 쑤신", "Shuanggou Suxin|双沟 苏心", NX, 52, CN, "장쑤 쓰훙 솽거우", "江苏双沟酒业", 100000, SO],
      ["진스위안 궈위안 V9", "Jinshiyuan Guoyuan V9|今世缘 国缘 V9", NX, 52, CN, "장쑤 화이안", "江苏今世缘酒业", 300000, SO],
      ["진스위안 궈위안 쓰카이", "Jinshiyuan Guoyuan Sikai|今世缘 国缘 四开", NX, 42, CN, "장쑤 화이안", "江苏今世缘酒业", 80000, SO],
      ["구징 궁주 녠펀 위안장 구 16", "Gujing Gongjiu Nianfen Yuanjiang Gu 16|古井贡酒 年份原浆 古16", NX, 50, CN, "안후이 보저우", "安徽古井贡酒", 90000, SO],
      ["구징 궁주 녠펀 위안장 구 26", "Gujing Gongjiu Nianfen Yuanjiang Gu 26|古井贡酒 年份原浆 古26", NX, 50, CN, "안후이 보저우", "安徽古井贡酒", 250000, SO],
      ["구징 궁주 셴리반", "Gujing Gongjiu Xianli Edition|古井贡酒 献礼版", NX, 50, CN, "안후이 보저우", "安徽古井贡酒", 30000, SO],
      ["커우쯔자오 20년", "Kouzijiao 20 Years|口子窖 二十年", "겸향형 백주", 50, CN, "안후이 화이베이", "安徽口子酒业", 150000, SO],
      ["커우쯔자오 6년", "Kouzijiao 6 Years|口子窖 六年", "겸향형 백주", 46, CN, "안후이 화이베이", "安徽口子酒业", 40000, SO],
      ["잉자 궁주 둥창 6", "Yingjia Gongjiu Dongcang 6|迎驾贡酒 洞藏 6", NX, 52, CN, "안후이 훠산", "安徽迎驾贡酒", 70000, SO],
      ["잉자 궁주 둥창 16", "Yingjia Gongjiu Dongcang 16|迎驾贡酒 洞藏 16", NX, 52, CN, "안후이 훠산", "安徽迎驾贡酒", 200000, SO],
      ["쑹허 량예", "Songhe Liangye|宋河 粮液", NX, 50, CN, "허난 루이", "河南宋河酒业", 30000, SO],
      ["두캉 자오취", "Dukang Jiaoqu|杜康 窖区", NX, 50, CN, "허난 뤼양", "洛阳杜康控股", 50000, SO],
      ["양사오 차이타오팡 디리", "Yangshao Caitao Fang|仰韶 彩陶坊 地利", "도향형 백주", 46, CN, "허난 몐츠", "河南仰韶酒业", 60000, "수수/쌀/찹쌀/밀/옥수수/좁쌀/보리"],
      ["바이수이두캉", "Baishui Dukang|白水杜康", NX, 52, CN, "산시(陝西) 바이수이", "陕西白水杜康酒业", 40000, SO],
      ["징즈 바이간", "Jingzhi Baigan|景芝 白干", ZX, 52, CN, "산둥 안추 징즈", "山东景芝酒业", 20000, SO],
      ["징즈 이핀 징즈 18년", "Jingzhi Yipin Jingzhi 18|景芝 一品景芝 18", ZX, 52, CN, "산둥 안추 징즈", "山东景芝酒业", 150000, SO],
      ["반다오징 30년", "Bandaojing 30 Years|扳倒井 30年", ZX, 52, CN, "산둥 가오칭", "山东扳倒井", 250000, SO],
      ["바이윈볜 20년", "Baiyunbian 20 Years|白云边 二十年", JZ, 53, CN, "후베이 쑹쯔", "湖北白云边酒业", 150000, SO],
      ["바이윈볜 12년", "Baiyunbian 12 Years|白云边 十二年", JZ, 42, CN, "후베이 쑹쯔", "湖北白云边酒业", 60000, SO],
      ["진주", "Jingpai Jinjiu|劲牌 劲酒", "보건주 (약초 배합)", 35, CN, "후베이 다예", "劲牌有限公司", 10000, "백주/약초"],
      // 청향형
      ["펀주 칭화 40", "Fenjiu Qinghua 40|汾酒 青花 40", QX, 53, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 400000, SO],
      ["펀주 칭화 50", "Fenjiu Qinghua 50|汾酒 青花 50", QX, 53, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 700000, SO],
      ["펀주 라오바이펀 10", "Fenjiu Laobaifen 10|汾酒 老白汾 10", QX, 53, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 40000, SO],
      ["펀주 황가이 보리", "Fenjiu Huanggai Boli|汾酒 黄盖玻汾", QX, 53, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 15000, SO],
      ["싱화춘 주", "Xinghuacun Jiu|杏花村酒", QX, 53, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 20000, SO],
      ["바오펑 궈써 칭샹", "Baofeng Daqu Qinghua|宝丰 清香 国色清香", QX, 50, CN, "허난 바오펑", "河南宝丰酒业", 60000, SO],
      ["뉴란산 바이녠 훙", "Niulanshan Bainian Hong|牛栏山 百年红", "청향형 백주 (얼궈터우)", 52, CN, "베이징 순이", "北京顺鑫农业", 20000, SO],
      ["융펑 얼궈터우", "Yongfeng Erguotou|永丰 二锅头", "청향형 백주 (얼궈터우)", 56, CN, "베이징", "北京永丰酒厂", 10000, SO],
      ["훙싱 얼궈터우 56도", "Hongxing Erguotou 56%|红星 二锅头 56度", "청향형 백주 (얼궈터우)", 56, CN, "베이징", "北京红星", 6000, SO],
      ["훙싱 란핑 8년", "Hongxing Lanping 8|红星 蓝瓶 八年", "청향형 백주 (얼궈터우)", 53, CN, "베이징", "北京红星", 20000, SO],
      ["장샤오바이 진비", "Jiangxiaobai Jinbi 25|江小白 金奖", "소곡 청향형 백주", 40, CN, "충칭 장진", "江小白酒业", 15000, "수수"],
      ["장샤오바이 메이장", "Jiangxiaobai Meijiang|江小白 梅见", "매실주 (청향 백주 기주)", 12, CN, "충칭 장진", "江小白酒业", 15000, "청매/백주"],
      ["후주 칭커주", "Huzhu Qingkejiu|互助 青稞酒", "청향형 백주 (칭커)", 52, CN, "칭하이 후주", "青海互助青稞酒", 30000, "칭커 보리"],
      ["이리 터취", "Yili Tequ|伊力特 伊力特曲", NX, 50, CN, "신장 이리", "新疆伊力特", 20000, SO],
      // 봉향·미향·기타 향형
      ["시펑 30년", "Xifeng 30 Years|西凤酒 三十年", FX, 52, CN, "산시(陝西) 펑샹", "陕西西凤酒", 300000, SO],
      ["시펑 홍시펑", "Xifeng Hongxifeng|西凤酒 红西凤", FX, 52, CN, "산시(陝西) 펑샹", "陕西西凤酒", 150000, SO],
      ["시펑 녹병", "Xifeng Lüping|西凤酒 绿瓶", FX, 55, CN, "산시(陝西) 펑샹", "陕西西凤酒", 15000, SO],
      ["구이린 싼화 진품", "Guilin Sanhua Jiu Jinpin|桂林三花酒 珍品", MX, 52, CN, "광시 구이린", "桂林三花", 30000, "쌀"],
      ["샹취안 주", "Xiangquan Jiu|湘泉", "복욱향형 백주", 52, CN, "후난 지서우", "酒鬼酒股份有限公司", 25000, SO],
      ["주구이 홍탄", "Jiugui Hongtan|酒鬼酒 红坛", "복욱향형 백주", 52, CN, "후난 지서우", "酒鬼酒股份有限公司", 150000, SO],
      ["주구이 20년", "Jiugui Jiu 20|酒鬼酒 二十年", "복욱향형 백주", 52, CN, "후난 지서우", "酒鬼酒股份有限公司", 300000, SO],
      ["둥주 터미", "Dongjiu Temi|董酒 特密", DX, 54, CN, "구이저우 쭌이", "贵州董酒", 250000, SO],
      ["둥주 바이미", "Dongjiu Baimi|董酒 白密", DX, 54, CN, "구이저우 쭌이", "贵州董酒", 120000, SO],
      ["쓰터주 둥팡 윈", "Site Jiu Dongfang Yun|四特酒 东方韵", TX, 52, CN, "장시 장수", "四特酒有限责任公司", 100000, "쌀"],
      ["헝수이 라오바이간 스바주팡", "Hengshui Laobaigan 18|衡水老白干 十八酒坊", LX, 67, CN, "허베이 헝수이", "衡水老白干酒业", 40000, SO],
      ["헝수이 라오바이간 1915", "Hengshui Laobaigan 1915|衡水老白干 1915", LX, 52, CN, "허베이 헝수이", "衡水老白干酒业", 150000, SO],
      ["스완 위빙사오 전창", "Shiwan Jiu Yubingshao Zhencang|石湾 玉冰烧 珍藏", "시향형 백주", 33, CN, "광둥 포산", "广东石湾酒厂", 15000, "쌀"],
      ["샤오후투셴 징뎬", "Xiaohutuxian Jingdian|小糊涂仙 经典", NX, 52, CN, "구이저우 런화이", "小糊涂仙酒业", 50000, SO],
      ["징파이 마오푸 쿠차오주", "Jingpai Maopu Kuqiao|劲牌 毛铺苦荞酒", "고량 메밀주", 42, CN, "후베이 다예", "劲牌有限公司", 20000, "메밀/수수"],
      ["다오광 녠우", "Daoguang Nianwu|道光廿五", NX, 52, CN, "랴오닝 진저우", "锦州道光廿五", 40000, SO],
      ["라오룽커우", "Laolongkou Jiu|老龙口", NX, 52, CN, "랴오닝 선양", "沈阳天江老龙口", 20000, SO],
      ["위취안", "Yuquan Jiu|玉泉 方瓶", "겸향형 백주", 52, CN, "헤이룽장 하얼빈", "黑龙江玉泉酒业", 20000, SO],
      ["구이저우 마오타이진 화마오", "Huamao Jiu|华茅", JX, 53, CN, GZ, MT, 250000, SO],
      // 대만 · 홍콩
      ["진먼 고량주 바이진룽", "Kinmen Kaoliang Baijinlong|金門高粱酒 白金龍", "청향형 고량주", 58, "대만", "진먼", "金門酒廠", 50000, SO],
      ["진먼 고량주 황진룽", "Kinmen Kaoliang Huangjinlong|金門高粱酒 黃金龍", "청향형 고량주", 56, "대만", "진먼", "金門酒廠", 60000, SO],
      ["진먼 고량주 58도 12년", "Kinmen Kaoliang Aged 12 Years|金門高粱酒 12年陳釀", "청향형 고량주", 58, "대만", "진먼", "金門酒廠", 150000, SO],
      ["바바컹다오 고량주", "Ba Ba Keng Dao Kaoliang|八八坑道 高粱酒", "청향형 고량주", 58, "대만", "마쭈·진먼", "八八坑道", 50000, SO],
      ["마쭈 고량주 둥인", "Matsu Kaoliang Dongyin|馬祖高粱酒 東引", "청향형 고량주", 58, "대만", "마쭈", "馬祖酒廠", 40000, SO],
      ["위산 고량주 58도", "Yushan Kaoliang 58%|玉山高粱酒 58度", "청향형 고량주", 58, "대만", "타이완", "台灣菸酒公司", 30000, SO],
      ["타이완 사오싱주", "Taiwan Shaoxing Jiu|台灣紹興酒", "황주 (사오싱 스타일)", 17, "대만", "난터우 푸리", "台灣菸酒公司", 10000, "찹쌀/밀누룩", "makgeolli"],
      ["장위 메이구이루", "Changyu Rose Fen Jiu|张裕 玫瑰露", "로즈 리큐어 (메이구이루)", 54, CN, "산둥 옌타이", "Changyu", 20000, "백주/장미", "liqueur"],
      // 황주 · 미주 · 과실주
      ["구웨룽산 30년", "Guyue Longshan 30 Years|古越龙山 三十年", "황주 · 화탸오", 16, CN, "저장 사오싱", "古越龙山绍兴酒", 300000, "찹쌀/밀누룩", "makgeolli"],
      ["구웨룽산 칭춘", "Guyue Longshan Qingchun|古越龙山 清醇", "황주 · 칭솽", 12, CN, "저장 사오싱", "古越龙山绍兴酒", 10000, "찹쌀/밀누룩", "makgeolli"],
      ["콰이지산 1743", "Kuaijishan 1743|会稽山 1743", "황주 · 화탸오", 16, CN, "저장 사오싱", "会稽山绍兴酒", 100000, "찹쌀/밀누룩", "makgeolli"],
      ["타파이 리주", "Pagoda Shaoxing Lizhu|塔牌 丽醇", "황주 · 칭솽", 14, CN, "저장 사오싱", "塔牌绍兴酒", 15000, "찹쌀/밀누룩", "makgeolli"],
      ["사오싱 산냥주", "Shaoxing Shanniang|绍兴 善酿酒", "황주 · 산냥", 14, CN, "저장 사오싱", "绍兴黄酒集团", 30000, "찹쌀/밀누룩", "makgeolli"],
      ["사오싱 샹쉐주", "Shaoxing Xiangxue|绍兴 香雪酒", "황주 · 샹쉐 (단맛)", 18, CN, "저장 사오싱", "绍兴黄酒集团", 30000, "찹쌀/밀누룩/백주", "makgeolli"],
      ["사오싱 위안훙주", "Shaoxing Yuanhong|绍兴 元红酒", "황주 · 위안훙 (드라이)", 15, CN, "저장 사오싱", "绍兴黄酒集团", 15000, "찹쌀/밀누룩", "makgeolli"],
      ["스쿠먼 황주", "Shikumen Huangjiu|石库门 上海老酒", "해파 황주", 11.5, CN, "상하이", "上海金枫酒业", 15000, "찹쌀/밀누룩", "makgeolli"],
      ["지모 라오주", "Jimo Laojiu|即墨老酒", "북방 황주 (기장)", 11.5, CN, "산둥 칭다오 지모", "即墨黄酒厂", 15000, "기장/누룩", "makgeolli"],
      ["푸젠 라오주 훙취", "Fujian Laojiu Hongqu|福建老酒 红曲", "홍곡 황주", 15, CN, "푸젠 푸저우", "福建省福州酒厂", 15000, "찹쌀/홍국", "makgeolli"],
      ["커자 냥주", "Hakka Niangjiu|客家娘酒", "객가 미주", 13, CN, "광둥 메이저우", "梅州客家酒业", 15000, "찹쌀/홍국", "makgeolli"],
      ["구이화 천주", "Guihua Chenjiu|桂花陈酒", "계화 진주 (리큐어)", 15, CN, "베이징", "北京龙徽酿酒", 15000, "포도주/계화", "liqueur"],
      ["펀주 주예칭 무단", "Fenjiu Zhuyeqing Mudan|竹叶青 牡丹", "죽엽청 (약초 배합주)", 45, CN, "산시(山西) 펀양 싱화춘", "山西杏花村汾酒", 50000, "펀주/죽엽·약초", "liqueur"],
      ["우자피주", "Wujiapi Jiu|五加皮酒", "오가피주 (약초 배합주)", 40, CN, "광둥", "广东", 15000, "백주/오가피", "liqueur"],
    ]);
  }

  // ══ 사케 — 브랜드별 대표 퀴베 (구체 제품명)
  {
    const J = "일본";
    const JD = "준마이 다이긴죠", JG = "준마이 긴죠", JM = "준마이", TJ = "토쿠베츠 준마이", DG = "다이긴죠", GJ = "긴죠", HJ = "혼죠조", KI = "키모토 준마이", YH = "야마하이 준마이", NG = "니고리", SP = "스파클링", KJ = "숙성 고슈";
    const YN = "야마다니시키", OM = "오마치", GH = "고햐쿠만고쿠", MY = "미야마니시키", OY = "오야마니시키";
    // ks/es/js 는 브랜드 뒤에 붙는 제품명. preset: g=sakeGinjo, j=sakeJunmai, n=sakeNama
    const PR = { g: "sakeGinjo", j: "sakeJunmai", n: "sakeNama" };
    const S = (pref, brewery, bk, be, bj, list) => rows("sake", "sakeGinjo", list.map((r) => {
      if (r[0] === "__FULL__") { const [, ko, enja, style, abv, krw, rice, p] = r; return [ko, enja, style, abv, J, pref, brewery, krw, rice, PR[p || "g"]]; }
      const [ks, es, js, style, abv, krw, rice, p] = r;
      return [`${bk} ${ks}`.trim(), `${be} ${es}`.trim() + "|" + `${bj} ${js}`.trim(), style, abv, J, pref, brewery, krw, rice, PR[p || "g"]];
    }));

    S("야마가타현", "高木酒造", "쥬욘다이", "Juyondai", "十四代", [
      ["오리카라미", "Origarami Junmai Ginjo", "純米吟醸 おりからみ", JG, 15, 400000, "아이야마", "n"],
      ["__FULL__", "쥬욘다이 조토쿠센", "Juyondai Chotokusen Junmai Daiginjo|十四代 超特撰 純米大吟醸", GJ, 16, 500000, "야마다니시키", "g"],
      ["류노오토시고", "Ryu no Otoshigo", "龍の落とし子", JG, 15, 400000, "류노오토시고", "g"],
      ["반슈 야마다니시키", "Banshu Yamadanishiki Junmai Daiginjo", "播州山田錦 純米大吟醸", JD, 16, 600000, YN, "g"],
    ]);
    S("미에현", "木屋正酒造", "지콘", "Jikon", "而今", [
      ["준마이 긴죠 오마치 무로카 나마", "Junmai Ginjo Omachi Muroka Nama", "純米吟醸 雄町 無濾過生", JG, 16, 150000, OM, "n"],
      ["준마이 긴죠 센본니시키 히이레", "Junmai Ginjo Senbon Nishiki Hiire", "純米吟醸 千本錦 火入", JG, 16, 140000, "센본니시키", "g"],
      ["토쿠베츠 준마이 무로카 나마", "Tokubetsu Junmai Muroka Nama", "特別純米 無濾過生", TJ, 16, 100000, "이세니시키/야마다니시키", "n"],
      ["니고리자케 나마", "Nigorizake Nama", "にごり酒 生", NG, 16, 100000, YN, "n"],
    ]);
    S("아키타현", "新政酒造", "아라마사", "Aramasa", "新政", [
      ["No.6 R-type", "No.6 R-type", "No.6 R-type", "키모토 준마이 (생주)", 13, 70000, "아키타산 쌀", "n"],
      ["라피스 라줄리", "Lapis Lazuli", "瑠璃 Lapis Lazuli", "키모토 준마이", 13, 70000, "아키타산 쌀", "j"],
      ["컬러즈 에쿠루", "Colors Ecru", "Colors 生成 エクリュ", "키모토 준마이", 14, 60000, "가메노오", "j"],
      ["컬러즈 코스모스", "Colors Cosmos", "Colors 秋櫻 コスモス", "키모토 준마이", 14, 60000, "미요시니시키", "j"],
    ]);
    S("야마구치현", "旭酒造", "닷사이", "Dassai", "獺祭", [
      ["니와리산부", "Niwari Sanbu Junmai Daiginjo 23 Enshin Bunri", "純米大吟醸 磨き二割三分 遠心分離", JD, 16, 200000, YN, "g"],
      ["미가키 손노 사키에", "Migaki Sono Saki e", "磨きその先へ", JD, 16, 800000, YN, "g"],
      ["니고리 스파클링 45", "Nigori Sparkling 45", "にごりスパークリング45", SP, 14, 50000, YN, "n"],
      ["__FULL__", "닷사이 블루 타입 23", "Dassai Blue Type 23|獺祭 DASSAI BLUE Type 23", JD, 16, 120000, YN, "g"],
    ]);
    S("후쿠이현", "石田屋二左衛門", "고쿠류", "Kokuryu", "黒龍", [
      ["니자에몬", "Nizaemon", "二左衛門", DG, 16, 600000, YN, "g"],
      ["시즈쿠", "Shizuku", "しずく", DG, 16, 200000, YN, "g"],
      ["__FULL__", "고쿠류 준긴 38호", "Kokuryu Junmai Ginjo Sanjuhachi-go|黒龍 純吟 三十八号", JG, 15, 50000, OM, "g"],
    ]);
    S("니가타현", "八海醸造", "핫카이산", "Hakkaisan", "八海山", [
      ["__FULL__", "핫카이산 곤고신", "Hakkaisan Kongoshin|八海山 金剛心", JD, 17, 300000, YN, "g"],
      ["아와 스파클링", "Awa Sparkling", "あわ", SP, 13, 60000, "고햐쿠만고쿠/야마다니시키", "n"],
      ["유키무로 차조 8년", "Yukimuro Chozo 8 Years", "雪室瓶貯蔵 八年", KJ, 17, 120000, GH, "j"],
    ]);
    S("야마가타현", "楯の川酒造", "다테노카와", "Tatenokawa", "楯野川", [
      ["__FULL__", "다테노카와 혼류", "Tatenokawa Honryu Junmai Daiginjo|楯野川 本流 純米大吟醸", JD, 15, 60000, "데와산산", "g"],
      ["세이류", "Seiryu Junmai Daiginjo", "清流 純米大吟醸", JD, 15, 50000, "데와산산", "g"],
      ["__FULL__", "다테노카와 고묘", "Tatenokawa Komyo Junmai Daiginjo|楯野川 光明 純米大吟醸", JD, 16, 400000, YN, "g"],
    ]);
    S("야마가타현", "出羽桜酒造", "데와자쿠라", "Dewazakura", "出羽桜", [
      ["이치로", "Ichiro Junmai Daiginjo", "一路 純米大吟醸", JD, 15, 90000, "데와산산", "g"],
      ["데와산산 준마이 긴죠", "Dewasansan Junmai Ginjo", "出羽燦々 純米吟醸", JG, 15, 50000, "데와산산", "g"],
      ["__FULL__", "데와자쿠라 이즈미주단", "Dewazakura Izumi Judan Tokubetsu Honjozo|出羽桜 泉十段 特別本醸造", "토쿠베츠 혼죠조", 15, 35000, "미야마니시키", "j"],
      ["오카 긴죠 나마즈메", "Oka Ginjo Namazume", "桜花吟醸 生詰", GJ, 15, 45000, "미야마니시키", "n"],
    ]);
    S("아이치현", "萬乗醸造", "가모시비토 쿠헤이지", "Kuheiji", "醸し人九平次", [
      ["__FULL__", "쿠헤이지 소바주", "Kuheiji Sauvage Junmai Daiginjo|醸し人九平次 純米大吟醸 SAUVAGE", JD, 16, 80000, YN, "g"],
      ["__FULL__", "쿠헤이지 휴먼", "Kuheiji Human|醸し人九平次 HUMAN 純米吟醸", JG, 16, 70000, YN, "g"],
      ["__FULL__", "쿠헤이지 구로다쇼니 우마레테", "Kuheiji Kurodasho ni Umarete|醸し人九平次 黒田庄に生まれて 純米大吟醸", JD, 16, 200000, YN, "g"],
      ["__FULL__", "쿠헤이지 히간", "Kuheiji Higan|醸し人九平次 彼の岸 純米大吟醸", JD, 16, 300000, YN, "g"],
    ]);
    S("후쿠시마현", "宮泉銘醸", "샤라쿠", "Sharaku", "寫樂", [
      ["준마이 긴죠 오마치", "Junmai Ginjo Omachi", "純米吟醸 雄町", JG, 16, 70000, OM, "g"],
      ["준마이 긴죠 아이야마", "Junmai Ginjo Aiyama", "純米吟醸 愛山", JG, 16, 80000, "아이야마", "g"],
      ["준마이 긴죠 반슈 야마다니시키", "Junmai Ginjo Banshu Yamadanishiki", "純米吟醸 播州山田錦", JG, 16, 75000, YN, "g"],
      ["준마이 긴죠 사케미라이", "Junmai Ginjo Sakemirai", "純米吟醸 酒未来", JG, 16, 75000, "사케미라이", "g"],
    ]);
    S("이와테현", "赤武酒造", "아카부", "AKABU", "赤武", [
      ["F", "F Junmai Ginjo Nama", "F 純米吟醸 生酒", JG, 15, 60000, "긴오토메", "n"],
      ["__FULL__", "아카부 아이야마 준마이 다이긴죠", "AKABU Aiyama Junmai Daiginjo|赤武 愛山 純米大吟醸", JD, 15, 120000, "아이야마", "g"],
      ["__FULL__", "아카부 유이노카 준마이 긴죠", "AKABU Yui no Ka Junmai Ginjo|赤武 結の香 純米吟醸", JG, 15, 70000, "유이노카", "g"],
    ]);
    S("아오모리현", "八戸酒造", "뭇쓰 핫센", "Mutsu Hassen", "陸奥八仙", [
      ["핑크 라벨 긴죠", "Pink Label Ginjo", "ピンクラベル 吟醸", GJ, 16, 50000, "하나후부키", "g"],
      ["레드 라벨 도쿠베츠 준마이", "Red Label Tokubetsu Junmai", "赤ラベル 特別純米", TJ, 16, 40000, "게이노유메/마시로", "j"],
      ["그린 라벨 도쿠베츠 준마이 나마", "Green Label Tokubetsu Junmai Nama", "緑ラベル 特別純米 生", TJ, 16, 45000, "게이노유메", "n"],
      ["__FULL__", "뭇쓰 핫센 스파클링 니고리", "Mutsu Hassen Sparkling Nigori Dry|陸奥八仙 発泡 にごり 生", SP, 13, 50000, "하나부키", "n"],
    ]);
    S("야마가타현", "亀の井酒造", "구도키조즈", "Kudoki Jozu", "くどき上手", [
      ["__FULL__", "구도키조즈 바쿠렌 초가라쿠치 긴죠", "Kudoki Jozu Bakuren Chokarakuchi Ginjo|くどき上手 ばくれん 超辛口 吟醸", "긴죠 (초가라쿠치)", 17, 50000, "가메노오", "g"],
      ["__FULL__", "구도키조즈 하쿠쓰루니시키 준마이 다이긴죠", "Kudoki Jozu Hakutsurunishiki Junmai Daiginjo|くどき上手 白鶴錦 純米大吟醸", JD, 16, 70000, "하쿠쓰루니시키", "g"],
    ]);
    S("미야기현", "新澤醸造店", "하쿠라쿠세이", "Hakurakusei", "伯楽星", [
      ["도쿠베츠 준마이", "Tokubetsu Junmai", "特別純米", TJ, 16, 45000, "구라노하나", "j"],
      ["__FULL__", "하쿠라쿠세이 준마이 다이긴죠 도조 아키쓰", "Hakurakusei Junmai Daiginjo Tojo Akitsu|伯楽星 純米大吟醸 東条秋津", JD, 16, 150000, YN, "g"],
    ]);
    S("미야기현", "新澤醸造店", "아타고노 마쓰", "Atagonomatsu", "あたごのまつ", [
      ["__FULL__", "아타고노 마쓰 준마이 긴죠", "Atagonomatsu Junmai Ginjo|あたごのまつ 純米吟醸", JG, 16, 45000, "구라노하나", "g"],
      ["__FULL__", "아타고노 마쓰 준마이 다이긴죠", "Atagonomatsu Junmai Daiginjo|あたごのまつ 純米大吟醸", JD, 16, 70000, YN, "g"],
      ["__FULL__", "아타고노 마쓰 스파클링", "Atagonomatsu Sparkling|あたごのまつ スパークリング", SP, 12, 50000, "구라노하나", "n"],
    ]);
    S("니가타현", "麒麟山酒造", "기린잔", "Kirinzan", "麒麟山", [
      ["덴토카라", "Dento Kara", "伝統辛口", "후쓰슈 (가라쿠치)", 15, 25000, GH, "j"],
      ["조카라", "Cho Kara", "超辛口", "긴죠 (초가라쿠치)", 15, 30000, GH, "j"],
      ["긴카라", "Gin Kara", "吟辛", "긴죠 (가라쿠치)", 15, 35000, GH, "g"],
    ]);
    S("이시카와현", "車多酒造", "덴구마이", "Tengumai", "天狗舞", [
      ["야마하이 지코미 다이긴죠", "Yamahai Daiginjo", "山廃仕込 大吟醸", DG, 16, 100000, YN, "g"],
      ["고슈 준마이 다이긴죠", "Koshu Junmai Daiginjo 5 Years", "古古酒 純米大吟醸", KJ, 16, 200000, YN, "j"],
    ]);
    S("이시카와현", "菊姫合資", "기쿠히메", "Kikuhime", "菊姫", [
      ["구로 긴죠", "Kuro Ginjo", "黒吟", DG, 17, 400000, YN, "g"],
      ["BY 다이긴죠", "BY Daiginjo", "BY 大吟醸", DG, 17, 250000, YN, "g"],
      ["__FULL__", "기쿠히메 구쿠리히메", "Kikuhime Kukurihime|菊姫 菊理媛", KJ, 17, 1500000, YN, "j"],
      ["쓰루노사토", "Tsurunosato", "鶴乃里", YH, 16, 70000, YN, "j"],
    ]);
    S("효고현", "剣菱酒造", "겐비시", "Kenbishi", "剣菱", [
      ["미즈호", "Mizuho", "瑞穂 黒松剣菱", "숙성 혼죠조", 17, 70000, YN, "j"],
      ["__FULL__", "겐비시 고쿠조 구로마쓰", "Kenbishi Gokujo Kuromatsu|剣菱 極上 黒松剣菱", "숙성 혼죠조", 17, 50000, YN, "j"],
    ]);
    S("나라현", "今西酒造", "미무로스기", "Mimurosugi", "みむろ杉", [
      ["로망 준마이 긴죠", "Roman Junmai Ginjo", "ろまんシリーズ 純米吟醸", JG, 16, 60000, YN, "g"],
      ["__FULL__", "미무로스기 디오 아비타", "Mimurosugi Dio Abita|みむろ杉 Dio Abita", "저알코올 준마이", 13, 50000, YN, "g"],
      ["__FULL__", "미무로스기 기오케 보다이모토 준마이", "Mimurosugi Kioke Bodaimoto Junmai|みむろ杉 木桶菩提酛 純米", KI, 16, 70000, "쓰유하카제", "j"],
    ]);
    S("나라현", "油長酒造", "가제노 모리", "Kaze no Mori", "風の森", [
      ["알파 1", "ALPHA 1 Junmai", "ALPHA 1 次章への鍵", "준마이 (저알코올 생주)", 14, 50000, "아키쓰호", "n"],
      ["오마치 807", "Omachi 807", "雄町 807", "준마이 무로카 나마겐슈", 17, 60000, OM, "n"],
      ["야마다니시키 807", "Yamadanishiki 807", "山田錦 807", "준마이 무로카 나마겐슈", 17, 60000, YN, "n"],
      ["아이야마 507", "Aiyama 507", "愛山 507", "준마이 다이긴죠 무로카 나마겐슈", 16, 90000, "아이야마", "n"],
    ]);
    S("후쿠시마현", "廣木酒造本店", "히로키", "Hiroki", "飛露喜", [
      ["준마이 긴죠 구로라벨", "Junmai Ginjo Kuro Label", "純米吟醸 黒ラベル", JG, 16, 120000, YN, "g"],
      ["도쿠베츠 준마이 가스미자케", "Tokubetsu Junmai Kasumizake", "特別純米 かすみ酒", TJ, 16, 120000, "고햐쿠만고쿠", "n"],
      ["__FULL__", "히로키 준마이 다이긴죠 비젠 오마치", "Hiroki Junmai Daiginjo Bizen Omachi|飛露喜 純米大吟醸 備前雄町", JD, 16, 200000, OM, "g"],
    ]);
    S("야마가타현", "東光 小嶋総本店", "도코", "Toko", "東光", [
      ["준마이 긴죠", "Junmai Ginjo Genshu", "純米吟醸 原酒", JG, 16, 40000, "데와산산", "g"],
      ["준마이 다이긴죠", "Junmai Daiginjo Yamadanishiki", "純米大吟醸 山田錦", JD, 16, 70000, YN, "g"],
    ]);
    S("야마가타현", "小嶋総本店", "도코 스파클링", "Toko Sparkling", "東光 スパークリング", [
    ]);
    S("미야기현", "萩野酒造", "하기노 쓰루", "Hagi no Tsuru", "萩の鶴", [
      ["__FULL__", "하기노 쓰루 준마이 긴죠 네코 라벨", "Hagi no Tsuru Junmai Ginjo Neko Label|萩の鶴 純米吟醸 猫ラベル こたつ猫", JG, 16, 50000, "구라노하나", "g"],
      ["도쿠베츠 준마이", "Tokubetsu Junmai", "特別純米", TJ, 16, 35000, "구라노하나", "j"],
    ]);
    S("아키타현", "福禄寿酒造", "잇파쿠스이세이", "Ippaku Suisei", "一白水成", [
      ["준마이 긴죠 미야마니시키", "Junmai Ginjo Miyamanishiki", "純米吟醸 美山錦", JG, 16, 60000, MY, "g"],
      ["준마이 긴죠 사케코마치", "Junmai Ginjo Sakekomachi", "純米吟醸 酒こまち", JG, 16, 60000, "사케코마치", "g"],
      ["Premium 준마이 다이긴죠", "Premium Junmai Daiginjo", "Premium 純米大吟醸", JD, 16, 150000, YN, "g"],
    ]);
    S("야마가타현", "髙橋酒造店", "도호쿠이즈미", "Tohoku Izumi", "東北泉", [
      ["준마이 긴죠 오마치", "Junmai Ginjo Omachi", "純米吟醸 雄町", JG, 16, 60000, OM, "g"],
    ]);
    S("니가타현", "宮尾酒造", "시메하리쓰루", "Shimeharitsuru", "〆張鶴", [
      ["준", "Jun Junmai Ginjo", "純 純米吟醸", JG, 15, 50000, GH, "g"],
      ["긴", "Gin Daiginjo", "銀 大吟醸", DG, 16, 90000, YN, "g"],
      ["__FULL__", "시메하리쓰루 킨", "Shimeharitsuru Kin Daiginjo|〆張鶴 金 大吟醸", DG, 16, 150000, YN, "g"],
      ["쓰키", "Tsuki Honjozo", "月 本醸造", HJ, 15, 30000, GH, "j"],
    ]);
    S("니가타현", "石本酒造", "고시노 칸바이", "Koshi no Kanbai", "越乃寒梅", [
      ["무쿠 준마이 다이긴죠", "Muku Junmai Daiginjo", "無垢 純米大吟醸", JD, 16, 100000, YN, "g"],
      ["사이 준마이 긴죠", "Sai Junmai Ginjo", "灑 純米吟醸", JG, 15, 50000, GH, "g"],
      ["벳센", "Bessen Ginjo", "別撰 吟醸", GJ, 16, 45000, GH, "g"],
      ["시로", "Shiro Futsushu", "白ラベル", "후쓰슈", 15, 30000, GH, "j"],
      ["킨무쿠", "Kin Muku Daiginjo", "金無垢 純米大吟醸", JD, 16, 250000, YN, "g"],
    ]);
    S("니가타현", "朝日酒造", "구보타", "Kubota", "久保田", [
      ["__FULL__", "구보타 셋포", "Kubota Seppou|久保田 雪峰", "준마이 다이긴죠 (야마하이)", 16, 90000, GH, "g"],
      ["__FULL__", "구보타 스파클링", "Kubota Sparkling|久保田 スパークリング", SP, 13, 60000, GH, "n"],
      ["센주 나마자케", "Senju Namazake", "千寿 生原酒", "긴죠 나마겐슈", 18, 40000, GH, "n"],
    ]);
    S("니가타현", "青木酒造", "가쿠레이", "Kakurei", "鶴齢", [
      ["준마이 긴죠", "Junmai Ginjo Gohyakumangoku", "純米吟醸 五百万石", JG, 16, 40000, GH, "g"],
      ["도쿠베츠 준마이", "Tokubetsu Junmai Koshitanrei", "特別純米 越淡麗", TJ, 16, 35000, "고시탄레이", "j"],
    ]);
    S("니가타현", "加茂錦酒造", "가모니시키", "Kamonishiki", "加茂錦", [
      ["니후다자케 오마치", "Nifudazake Omachi", "荷札酒 雄町", JD, 15, 60000, OM, "n"],
      ["니후다자케 미야마니시키", "Nifudazake Miyamanishiki", "荷札酒 美山錦", JD, 15, 60000, MY, "n"],
      ["니후다자케 반슈 야마다니시키", "Nifudazake Banshu Yamadanishiki", "荷札酒 播州山田錦", JD, 15, 65000, YN, "n"],
    ]);
    S("나가노현", "宮坂醸造", "마스미", "Masumi", "真澄", [
      ["유메도노", "Yumedono Daiginjo", "夢殿 大吟醸", DG, 17, 250000, YN, "g"],
      ["__FULL__", "마스미 나나고", "Masumi Nanago Yamahai Junmai Daiginjo|真澄 七號 山廃純米大吟醸", "야마하이 준마이 다이긴죠", 16, 90000, MY, "g"],
      ["__FULL__", "마스미 가라쿠치 기잇폰", "Masumi Karakuchi Kippon Junmai|真澄 辛口生一本 純米吟醸", JG, 15, 40000, MY, "j"],
      ["__FULL__", "마스미 아라바시리", "Masumi Arabashiri Nama Genshu|真澄 あらばしり 生原酒", "준마이 나마겐슈", 17, 40000, MY, "n"],
      ["스파클링", "Sparkling", "スパークリング", SP, 12, 50000, MY, "n"],
    ]);
    S("나가노현", "大信州酒造", "다이신슈", "Daishinshu", "大信州", [
      ["__FULL__", "다이신슈 데잇파이", "Daishinshu Te-ippai Junmai Ginjo|大信州 手いっぱい 純米吟醸", JG, 16, 60000, "히토고코치", "g"],
      ["초가라쿠치 준마이 긴죠", "Chokarakuchi Junmai Ginjo", "超辛口 純米吟醸", JG, 16, 45000, MY, "g"],
    ]);
    S("나가노현", "湯川酒造店", "기소지", "Kisoji", "木曽路", [
      ["준마이 긴죠", "Junmai Ginjo", "純米吟醸", JG, 16, 40000, MY, "g"],
    ]);
    S("시즈오카현", "磯自慢酒造", "이소지만", "Isojiman", "磯自慢", [
      ["다이긴죠 32", "Daiginjo 32", "大吟醸 32", DG, 17, 300000, YN, "g"],
      ["브루어스 스피릿", "Brewer's Spirit Junmai Ginjo", "Brewer's Spirit 純米吟醸", JG, 16, 120000, YN, "g"],
      ["__FULL__", "이소지만 도쿠베츠 혼죠조", "Isojiman Tokubetsu Honjozo|磯自慢 特別本醸造", "토쿠베츠 혼죠조", 15, 50000, YN, "j"],
    ]);
    S("시즈오카현", "富士高砂酒造", "다카사고", "Takasago", "高砂", [
      ["야마하이 준마이 긴죠", "Yamahai Junmai Ginjo", "山廃純米吟醸", "야마하이 준마이 긴죠", 15, 40000, YN, "j"],
    ]);
    S("시즈오카현", "初亀醸造", "하쓰카메", "Hatsukame", "初亀", [
      ["아이", "Ai Junmai Daiginjo", "愛 純米大吟醸", JD, 16, 250000, YN, "g"],
      ["가메 준마이 다이긴죠", "Kame Junmai Daiginjo", "亀 純米大吟醸", JD, 16, 150000, YN, "g"],
    ]);
    S("시즈오카현", "土井酒造場", "가이운", "Kaiun", "開運", [
      ["이와이자케", "Iwaizake Daiginjo", "祝酒 大吟醸", DG, 17, 100000, YN, "g"],
      ["도쿠베츠 준마이", "Tokubetsu Junmai", "特別純米", TJ, 16, 35000, YN, "j"],
    ]);
    S("가나가와현", "泉橋酒造", "이즈미바시", "Izumibashi", "いづみ橋", [
      ["구로 톤보 키모토", "Kuro Tombo Kimoto Junmai", "黒とんぼ 生酛純米", KI, 16, 40000, "야마다니시키 (자가 재배)", "j"],
      ["아카 톤보", "Aka Tombo Junmai", "赤とんぼ 純米", JM, 16, 30000, YN, "j"],
    ]);
    S("도쿄도", "小澤酒造", "사와노이", "Sawanoi", "澤乃井", [
      ["봉 다이긴죠", "Bon Daiginjo", "梵 大吟醸", DG, 16, 100000, YN, "g"],
      ["이로하", "Iroha Kimoto Junmai", "いろは 生酛純米", KI, 15, 35000, "아키타코마치", "j"],
      ["오쿠다마", "Okutama Karakuchi Junmai", "奥多摩 辛口純米", JM, 15, 30000, "아키타코마치", "j"],
    ]);
    S("교토부", "木下酒造", "다마가와", "Tamagawa", "玉川", [
      ["아이스브레이커", "Ice Breaker", "アイスブレーカー", "준마이 긴죠 무로카 나마겐슈", 17, 50000, "니혼바레", "n"],
      ["타임 머신 1712", "Time Machine 1712", "タイムマシン1712", "키모토 준마이 (고대 양조법, 단맛)", 14, 70000, "니혼바레", "j"],
      ["레드 라벨", "Red Label Yamahai Junmai", "赤ラベル 自然仕込 純米 山廃", YH, 20, 50000, "기타니시키", "j"],
    ]);
    S("교토부", "月桂冠", "겟케이칸", "Gekkeikan", "月桂冠", [
      ["__FULL__", "겟케이칸 호린", "Gekkeikan Horin Junmai Daiginjo|月桂冠 鳳麟 純米大吟醸", JD, 16, 70000, YN, "g"],
    ]);
    S("효고현", "白鶴酒造", "하쿠쓰루", "Hakutsuru", "白鶴", [
      ["사유리 니고리", "Sayuri Nigori", "さゆり にごり酒", NG, 12.5, 25000, "쌀", "n"],
      ["__FULL__", "하쿠쓰루 쇼운", "Hakutsuru Sho-Une Junmai Daiginjo|白鶴 翔雲 純米大吟醸", JD, 15, 50000, "하쿠쓰루니시키", "g"],
      ["__FULL__", "하쿠쓰루 조센 준마이", "Hakutsuru Josen Junmai|白鶴 上撰 純米", JM, 14, 20000, "쌀", "j"],
    ]);
    S("효고현", "菊正宗酒造", "기쿠마사무네", "Kiku-Masamune", "菊正宗", [
      ["__FULL__", "기쿠마사무네 햐쿠모쿠", "Kiku-Masamune Hyakumoku Junmai Daiginjo|菊正宗 百黙 純米大吟醸", JD, 16, 80000, YN, "g"],
      ["__FULL__", "기쿠마사무네 다루자케", "Kiku-Masamune Taruzake|菊正宗 樽酒", "다루자케 (삼나무 통)", 15, 30000, "쌀", "j"],
    ]);
    S("효고현", "沢の鶴", "사와노쓰루", "Sawanotsuru", "沢の鶴", [
      ["__FULL__", "사와노쓰루 고슈 10년", "Sawanotsuru Koshu 10 Years|沢の鶴 古酒 熟成十年", KJ, 17, 150000, "쌀", "j"],
    ]);
    S("효고현", "富久錦", "후쿠니시키", "Fukunishiki", "富久錦", [
    ]);
    S("오카야마현", "利守酒造", "사카히토", "Sakehitosuji", "酒一筋", [
      ["__FULL__", "사케히토스지 준마이 긴죠 아카이와 오마치", "Sakehitosuji Junmai Ginjo Akaiwa Omachi|酒一筋 純米吟醸 赤磐雄町", JG, 16, 60000, OM, "g"],
      ["__FULL__", "사케히토스지 기모토 준마이 아카이와 오마치", "Sakehitosuji Kimoto Junmai Akaiwa Omachi|酒一筋 生酛 純米 赤磐雄町", KI, 16, 50000, OM, "j"],
    ]);
    S("히로시마현", "賀茂泉酒造", "가모이즈미", "Kamoizumi", "賀茂泉", [
      ["__FULL__", "가모이즈미 슈센 혼지코미 준마이 긴죠", "Kamoizumi Shusen Junmai Ginjo|賀茂泉 朱泉本仕込 純米吟醸", JG, 16, 40000, "하치탄니시키", "j"],
      ["고메노 사사야키", "Kome no Sasayaki", "米の囁き", "준마이 (단맛)", 14, 35000, "쌀", "j"],
    ]);
    S("히로시마현", "竹鶴酒造", "다케쓰루", "Taketsuru", "竹鶴", [
      ["준마이 오마치", "Junmai Omachi", "純米 雄町", JM, 16, 60000, OM, "j"],
      ["히덴", "Hiden Junmai", "秘伝 純米", JM, 16, 40000, "하치탄니시키", "j"],
    ]);
    S("히로시마현", "富久長 今田酒造本店", "후쿠초", "Fukucho", "富久長", [
      ["__FULL__", "후쿠초 시푸드", "Fukucho Seafood Junmai|富久長 海風土 シーフード", "준마이 (백국)", 15, 45000, "하치탄소", "g"],
      ["핫탄소 준마이 긴죠", "Hattanso Junmai Ginjo", "八反草 純米吟醸", JG, 16, 50000, "핫탄소", "g"],
    ]);
    S("야마구치현", "永山本家酒造場", "다카", "Taka", "貴", [
      ["도쿠베츠 준마이 60", "Tokubetsu Junmai 60", "特別純米 60", TJ, 16, 40000, YN, "j"],
      ["준마이 다이긴죠", "Junmai Daiginjo 35", "純米大吟醸 35", JD, 16, 100000, YN, "g"],
    ]);
    S("야마구치현", "八百新酒造", "간기", "Gangi", "雁木", [
      ["__FULL__", "간기 노이치 무로카 나마겐슈", "Gangi No-ichi Junmai Muroka Nama Genshu|雁木 ノ壱 純米無濾過生原酒", "준마이 무로카 나마겐슈", 17, 50000, YN, "n"],
    ]);
    S("야마구치현", "澄川酒造場", "도요비진", "Toyo Bijin", "東洋美人", [
      ["온시", "Onshi Junmai Daiginjo", "恩師 純米大吟醸", JD, 16, 150000, YN, "g"],
    ]);
    S("고치현", "酔鯨酒造", "스이게이", "Suigei", "酔鯨", [
      ["__FULL__", "스이게이 만", "Suigei Man Junmai Daiginjo|酔鯨 純米大吟醸 万 MAN", JD, 16, 120000, YN, "g"],
      ["__FULL__", "스이게이 긴레이", "Suigei Ginrei Junmai Ginjo|酔鯨 吟麗 純米吟醸", JG, 16, 40000, "긴노유메", "g"],
    ]);
    S("고치현", "亀泉酒造", "가메이즈미", "Kameizumi", "亀泉", [
      ["준마이 긴죠 겐슈 CEL-24", "Junmai Ginjo Nama Genshu CEL-24", "純米吟醸原酒 CEL-24", JG, 14, 60000, "하치탄니시키", "n"],
    ]);
    S("고치현", "司牡丹酒造", "쓰카사보탄", "Tsukasabotan", "司牡丹", [
    ]);
    S("에히메현", "石鎚酒造", "이시즈치", "Ishizuchi", "石鎚", [
      ["미도리 라벨", "Midori Label Junmai Ginjo", "緑ラベル 純米吟醸", JG, 16, 45000, "시즈쿠히메/마쓰야마미이", "g"],
    ]);
    S("후쿠오카현", "若竹屋酒造場", "시게마스", "Shigemasu", "繁桝", [
      ["다이긴죠", "Daiginjo", "大吟醸", DG, 17, 120000, YN, "g"],
    ]);
    S("사가현", "富久千代酒造", "나베시마", "Nabeshima", "鍋島", [
      ["뉴 문", "New Moon Junmai Ginjo", "New Moon 純米吟醸", JG, 15, 70000, "사가산 쌀", "n"],
      ["하베스트 문", "Harvest Moon Junmai Ginjo", "Harvest Moon 純米吟醸", JG, 16, 70000, "사가산 쌀", "g"],
      ["아이야마 준마이 긴죠", "Aiyama Junmai Ginjo", "愛山 純米吟醸", JG, 16, 90000, "아이야마", "g"],
      ["오마치 준마이 긴죠", "Omachi Junmai Ginjo", "雄町 純米吟醸", JG, 16, 80000, OM, "g"],
    ]);
    S("사가현", "天吹酒造", "아마부키", "Amabuki", "天吹", [
      ["이치고 하나", "Ichigo Hana Junmai Ginjo", "いちごの花酵母 純米吟醸", JG, 16, 50000, OM, "g"],
      ["히마와리 꽃효모", "Himawari Hana Kobo Junmai", "ひまわりの花酵母 純米", JM, 15, 45000, OM, "j"],
    ]);
    S("구마모토현", "熊本県酒造研究所", "고로", "Koro", "香露", [
      ["다이긴죠", "Daiginjo", "大吟醸", DG, 17, 150000, YN, "g"],
    ]);
    S("구마모토현", "瑞鷹", "즈이요", "Zuiyo", "瑞鷹", [
      ["아카자케", "Akazake", "赤酒", "아카자케 (구마모토 전통 적주)", 12, 20000, "쌀/목회", "j"],
    ]);
    S("아키타현", "齋彌酒造店", "유키노 보샤", "Yuki no Bosha", "雪の茅舎", [
      ["__FULL__", "유키노 보샤 세이조반고슈", "Yuki no Bosha Seizo Bango-shu Junmai Daiginjo|雪の茅舎 製造番号酒 純米大吟醸", JD, 16, 150000, YN, "g"],
      ["__FULL__", "유키노 보샤 야마하이 준마이 긴죠", "Yuki no Bosha Yamahai Junmai Ginjo|雪の茅舎 山廃純米吟醸", "야마하이 준마이 긴죠", 16, 50000, "아키타사케코마치", "j"],
    ]);
    S("아키타현", "秋田清酒", "가리호", "Kariho", "刈穂", [
      ["야마하이 준마이 쵸카라구치", "Yamahai Junmai Chokarakuchi", "山廃純米 超辛口", YH, 16, 35000, "미야마니시키", "j"],
      ["__FULL__", "가리호 롯슈", "Kariho Rokushu Junmai Ginjo|刈穂 六舟 純米吟醸", JG, 16, 50000, "미야마니시키", "g"],
    ]);
    S("아키타현", "日の丸醸造", "만사쿠노 하나", "Mansaku no Hana", "まんさくの花", [
      ["준마이 다이긴죠", "Junmai Daiginjo", "純米大吟醸", JD, 16, 70000, YN, "g"],
      ["가메노오 준마이 긴죠", "Kame no O Junmai Ginjo", "亀ノ尾 純米吟醸", JG, 16, 50000, "가메노오", "g"],
    ]);
    S("아키타현", "両関酒造", "아마노토", "Amanoto", "天の戸", [
      ["__FULL__", "아마노토 우마시네", "Amanoto Umashine Junmai Daiginjo|天の戸 美稲 純米大吟醸", JD, 16, 60000, "긴노세이", "g"],
    ]);
    S("이와테현", "南部美人", "난부비진", "Nanbu Bijin", "南部美人", [
      ["슈퍼 프리미엄", "Super Premium Junmai Daiginjo", "スーパープレミアム 純米大吟醸", JD, 16, 300000, YN, "g"],
      ["우메슈 (설탕 무첨가)", "All Koji Umeshu", "梅酒 糖類無添加", "우메슈 (사케 베이스)", 10, 40000, "청매/사케", "j"],
      ["도쿠베츠 준마이", "Tokubetsu Junmai", "特別純米", TJ, 15, 40000, "긴오토메", "j"],
    ]);
    S("이와테현", "あさ開", "아사비라키", "Asabiraki", "あさ開", [
      ["도쿠베츠 준마이", "Nanbu Toji Tokubetsu Junmai", "南部流伝承造り 特別純米", TJ, 15, 35000, "긴긴가", "j"],
    ]);
    S("미야기현", "一ノ蔵", "이치노쿠라", "Ichinokura", "一ノ蔵", [
      ["스즈네", "Suzune", "すず音", "준마이 스파클링 (저알코올)", 5, 30000, "도요니시키", "n"],
      ["무감사 혼죠조", "Mukansa Honjozo Karakuchi", "無鑑査 本醸造 辛口", HJ, 15, 25000, "사사니시키", "j"],
    ]);
    S("미야기현", "仙台伊澤家 勝山酒造", "가쓰야마", "Katsuyama", "勝山", [
      ["아카쓰키", "Akatsuki Junmai Daiginjo", "暁 純米大吟醸", JD, 16, 200000, YN, "g"],
      ["겐 준마이 긴죠", "Ken Junmai Ginjo", "献 純米吟醸", JG, 16, 70000, "구라노하나", "g"],
    ]);
    S("후쿠시마현", "大七酒造", "다이시치", "Daishichi", "大七", [
      ["미노와몬", "Minowamon Junmai Daiginjo", "箕輪門 純米大吟醸 雫原酒", JD, 17, 200000, YN, "g"],
      ["__FULL__", "다이시치 묘카란교쿠", "Daishichi Myoka Rangyoku Kimoto Daiginjo|大七 妙花闌曲 生酛純米大吟醸", JD, 16, 500000, YN, "g"],
    ]);
    S("후쿠시마현", "鶴乃江酒造", "아이즈 나카죠", "Aizu Chujo", "会津中将", [
      ["준마이 긴죠", "Junmai Ginjo", "純米吟醸", JG, 16, 50000, "유메노카", "g"],
    ]);
    S("후쿠시마현", "仁井田本家", "니이다 혼케", "Niida Honke", "仁井田本家", [
      ["시젠슈 기모토 준마이", "Shizenshu Kimoto Junmai Ginjo", "自然酒 生酛 純米吟醸", "키모토 준마이 긴죠", 15, 50000, "자연재배 미", "j"],
    ]);
    S("후쿠시마현", "曙酒造", "덴메이", "Tenmei", "天明", [
      ["__FULL__", "덴메이 미카즈키", "Tenmei Mikazuki Junmai Ginjo|天明 三日月 純米吟醸", JG, 16, 50000, "고혼만고쿠", "n"],
    ]);
    S("도치기현", "せんきん", "센킨", "Senkin", "仙禽", [
      ["__FULL__", "센킨 클래식 무쿠", "Senkin Classic Senkin Muku|仙禽 クラシック仙禽 無垢", "키모토 준마이", 15, 50000, YN, "j"],
      ["카부토무시", "Kabutomushi", "かぶとむし", "준마이 (산미, 생주)", 15, 50000, YN, "n"],
      ["__FULL__", "센킨 유키다루마", "Senkin Yukidaruma|仙禽 雪だるま", NG, 14, 50000, YN, "n"],
    ]);
    S("도치기현", "外池酒造店", "호오비덴", "Hououbiden", "鳳凰美田", [
      ["블랙 피닉스", "Black Phoenix Junmai Ginjo", "Black Phoenix 純米吟醸", JG, 16, 70000, "고햐쿠만고쿠", "g"],
      ["와인 셀", "Wine Cell Junmai Ginjo", "WINE CELL 純米吟醸", JG, 16, 70000, "고햐쿠만고쿠", "g"],
      ["__FULL__", "호오비덴 쓰루기 가라쿠치 준마이", "Hououbiden Tsurugi Karakuchi Junmai|鳳凰美田 剱 辛口純米", "준마이 (가라쿠치)", 16, 50000, OM, "j"],
    ]);
    S("이바라키현", "来福酒造", "라이후쿠", "Raifuku", "来福", [
      ["준마이 긴죠 아이야마", "Junmai Ginjo Aiyama", "純米吟醸 愛山", JG, 16, 60000, "아이야마", "g"],
      ["__FULL__", "라이후쿠 사쿠라 꽃효모 준마이 긴죠", "Raifuku Sakura Hana Kobo Junmai|来福 桜の花酵母 純米吟醸", JG, 16, 50000, "쌀", "g"],
    ]);
    S("군마현", "永井酒造", "미즈바쇼", "Mizubasho", "水芭蕉", [
      ["퓨어", "Pure Sparkling", "MIZUBASHO PURE", "스파클링 (병내 2차 발효)", 13, 90000, YN, "n"],
    ]);
    S("군마현", "龍神酒造", "오제노 유키도케", "Oze no Yukidoke", "尾瀬の雪どけ", [
      ["준마이 다이긴죠", "Junmai Daiginjo", "純米大吟醸", JD, 16, 60000, "오마치", "g"],
    ]);
    S("사이타마현", "神亀酒造", "신카메", "Shinkame", "神亀", [
      ["준마이 히코마고", "Hikomago Junmai", "ひこ孫 純米", "숙성 준마이", 15, 60000, YN, "j"],
    ]);
    S("지바현", "寺田本家", "데라다 혼케", "Terada Honke", "寺田本家", [
      ["다이고노 시즈쿠", "Daigo no Shizuku", "醍醐のしずく", "보다이모토 준마이 (생주)", 14, 50000, "자연재배 미", "n"],
      ["무스히", "Musuhi", "むすひ", "키모토 준마이 (무여과 생주)", 14, 40000, "자연재배 미", "n"],
    ]);
    S("지바현", "木戸泉酒造", "기도이즈미", "Kidoizumi", "木戸泉", [
      ["아후리카", "Afrika", "AFS アフス", "고산도 준마이 (고온 야마하이)", 15, 50000, "쌀", "j"],
    ]);
    S("이시카와현", "福光屋", "가가토비", "Kagatobi", "加賀鳶", [
      ["__FULL__", "가가토비 준마이 다이긴죠 아이", "Kagatobi Junmai Daiginjo Ai|加賀鳶 純米大吟醸 藍", JD, 16, 60000, YN, "g"],
    ]);
    S("이시카와현", "白藤酒造店", "오쿠노토노 시라기쿠", "Okunoto no Shiragiku", "奥能登の白菊", [
      ["준마이 긴죠", "Junmai Ginjo", "純米吟醸", JG, 16, 50000, YN, "g"],
    ]);
    S("도야마현", "桝田酒造店", "마스이즈미", "Masuizumi", "満寿泉", [
      ["__FULL__", "마스이즈미 R", "Masuizumi R|満寿泉 R", "숙성 준마이 (와인통)", 17, 150000, YN, "j"],
      ["__FULL__", "마스이즈미 플래티넘", "Masuizumi Platinum Junmai Daiginjo|満寿泉 プラチナ 純米大吟醸", JD, 16, 150000, YN, "g"],
    ]);
    S("후쿠이현", "加藤吉平商店", "본", "Born", "梵", [
      ["__FULL__", "본 긴센", "Born Ginsen Junmai Daiginjo|梵 吟撰 純米大吟醸", JD, 16, 60000, YN, "g"],
      ["니혼노 쓰바사", "Nihon no Tsubasa", "日本の翼 純米大吟醸", JD, 16, 300000, YN, "g"],
    ]);
    S("후쿠이현", "一本義久保本店", "잇폰기", "Ippongi", "一本義", [
      ["준마이 긴죠", "Junmai Ginjo", "純米吟醸", JG, 16, 40000, GH, "g"],
    ]);
    S("시가현", "冨田酒造", "시치혼야리", "Shichi Hon Yari", "七本鎗", [
      ["준마이 다마사카에", "Junmai Tamasakae", "純米 玉栄", JM, 15, 40000, "다마사카에", "j"],
      ["__FULL__", "시치혼야리 무우 무로카 나마겐슈", "Shichi Hon Yari Muroka Nama Genshu|七本鎗 無有 純米 無濾過生原酒", "준마이 무로카 나마겐슈", 17, 45000, "긴후부키", "n"],
    ]);
    S("시가현", "上原酒造", "후로센", "Furosen", "不老泉", [
      ["야마하이 지코미 준마이 긴죠", "Yamahai Junmai Ginjo Nama Genshu", "山廃仕込 純米吟醸 生原酒", "야마하이 준마이 긴죠", 17, 50000, "야마다니시키", "n"],
    ]);
    S("나라현", "梅乃宿酒造", "우메노야도", "Umenoyado", "梅乃宿", [
      ["아라고시 유즈슈", "Aragoshi Yuzu", "あらごし ゆず酒", "유즈 리큐어 (사케 베이스)", 8, 35000, "유자/사케", "j"],
      ["아라고시 모모슈", "Aragoshi Momo", "あらごし もも酒", "복숭아 리큐어 (사케 베이스)", 8, 35000, "복숭아/사케", "j"],
    ]);
    S("나라현", "千代酒造", "시노미네", "Shinomine", "篠峯", [
      ["준마이 긴죠 오마치", "Junmai Ginjo Omachi Nakadori", "雄町 純米吟醸 中取り", JG, 16, 50000, OM, "g"],
    ]);
    S("와카야마현", "名手酒造店", "구로우시", "Kuroushi", "黒牛", [
      ["준마이 오마치", "Junmai Omachi", "純米 雄町", JM, 15, 40000, OM, "j"],
    ]);
    S("돗토리현", "山根酒造場", "히오키자쿠라", "Hiokizakura", "日置桜", [
      ["__FULL__", "히오키자쿠라 고리키", "Hiokizakura Goriki Junmai|日置桜 強力 純米", JM, 16, 50000, "고리키", "j"],
    ]);
    S("돗토리현", "諏訪酒造", "스와이즈미", "Suwaizumi", "諏訪泉", [
      ["__FULL__", "스와이즈미 만텐세이", "Suwaizumi Mantensei Junmai Ginjo|諏訪泉 満天星 純米吟醸", JG, 16, 50000, "다마사카에", "g"],
    ]);
    S("시마네현", "李白酒造", "리하쿠", "Rihaku", "李白", [
      ["원더링 포에트", "Wandering Poet Junmai Ginjo", "超特撰 純米吟醸 Wandering Poet", JG, 15, 50000, YN, "g"],
      ["__FULL__", "리하쿠 다이긴죠", "Rihaku Daiginjo|李白 大吟醸", DG, 16, 100000, YN, "g"],
    ]);
    S("시마네현", "王祿酒造", "오로쿠", "Oroku", "王祿", [
      ["__FULL__", "오로쿠 조케이", "Oroku Jokei Junmai Muroka Nama Genshu|王祿 丈径 純米無濾過生原酒", "준마이 무로카 나마겐슈", 17, 60000, OM, "n"],
    ]);
    S("오카야마현", "嘉美心酒造", "가비신", "Kabishin", "嘉美心", [
    ]);
    S("도쿠시마현", "三芳菊酒造", "미요시키쿠", "Miyoshikiku", "三芳菊", [
      ["와일드 사이드", "Wild Side Junmai Ginjo Muroka Nama Genshu", "ワイルドサイドを歩け 純米吟醸", JG, 16, 50000, YN, "n"],
    ]);
    S("가가와현", "西野金陵", "긴료", "Kinryo", "金陵", [
      ["__FULL__", "긴료 다이긴죠 고아이", "Kinryo Daiginjo Koai|金陵 大吟醸 濃藍", DG, 17, 70000, YN, "g"],
    ]);
    S("후쿠오카현", "白糸酒造", "시라이토", "Shiraito", "白糸", [
      ["하네기", "Haneki Junmai Ginjo", "ハネ木搾り 純米吟醸", JG, 16, 50000, YN, "g"],
    ]);
    S("오이타현", "八鹿酒造", "얏시카", "Yatsushika", "八鹿", [
      ["준마이 다이긴죠", "Junmai Daiginjo", "純米大吟醸", JD, 16, 70000, YN, "g"],
    ]);
    S("미야자키현", "千徳酒造", "센토쿠", "Sentoku", "千徳", [
      ["다이긴죠", "Daiginjo", "大吟醸", DG, 16, 60000, YN, "g"],
    ]);
    S("홋카이도", "上川大雪酒造", "가미카와 다이세쓰", "Kamikawa Taisetsu", "上川大雪", [
      ["긴푸", "Ginpu Junmai Ginjo", "吟風 純米吟醸", JG, 16, 50000, "긴푸", "g"],
      ["스이세이 준마이 다이긴죠", "Suisei Junmai Daiginjo", "彗星 純米大吟醸", JD, 16, 70000, "스이세이", "g"],
    ]);
    S("홋카이도", "男山", "오토코야마", "Otokoyama", "男山", [
      ["기모토 준마이", "Kimoto Junmai", "生酛純米", KI, 15, 40000, "쌀", "j"],
    ]);
    S("홋카이도", "国稀酒造", "구니마레", "Kunimare", "国稀", [
      ["__FULL__", "구니마레 홋카이 오니코로시", "Kunimare Hokkai Onikoroshi|国稀 北海鬼ころし", "혼죠조 (초가라쿠치)", 17, 30000, "쌀", "j"],
    ]);
  }
})();
