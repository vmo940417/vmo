/* 술사전 대량 DB (4) — 와인 추가 (보르도 등급·부르고뉴·론·샴페인·이탈리아·스페인·신대륙 등)
 * 도수는 대표값, 참고가(₩)는 국내 판매가 근사치.
 */
(() => {
  const { rows } = window.BULK;
  // [한글명, 영문명, 스타일, 도수, 산지, 생산자, 참고가, 품종]
  const W = (preset, country, list) => rows("wine", preset, list.map(([ko, en, st, abv, rg, pr, krw, ing]) => [ko, en, st, abv, country, rg, pr, krw, ing]));
  const BDX = "Cabernet Sauvignon/Merlot", RB = "Merlot/Cabernet Franc", SW = "Sémillon/Sauvignon Blanc";
  const C = (n) => `레드 · 보르도 그랑 크뤼 ${n}등급`;

  /* ── 보르도 1855 메독 등급 · 그라브 · 소테른 ── */
  W("redIcon", "프랑스", [
    ["샤또 로장 세글라", "Château Rauzan-Ségla", C(2), 13.5, "보르도 마고", "Chanel (Wertheimer)", 230000, BDX],
    ["샤또 로장 가시", "Château Rauzan-Gassies", C(2), 13.5, "보르도 마고", "Famille Quié", 120000, BDX],
    ["샤또 레오빌 푸아페레", "Château Léoville Poyferré", C(2), 13.5, "보르도 생쥘리앙", "Famille Cuvelier", 200000, BDX],
    ["샤또 뒤르포르 비방", "Château Durfort-Vivens", C(2), 13.5, "보르도 마고", "Famille Lurton", 130000, BDX],
    ["샤또 라스콩브", "Château Lascombes", C(2), 13.5, "보르도 마고", "Château Lascombes", 160000, BDX],
    ["샤또 브란 깡트낙", "Château Brane-Cantenac", C(2), 13.5, "보르도 마고", "Henri Lurton", 150000, BDX],
    ["샤또 키르완", "Château Kirwan", C(3), 13.5, "보르도 마고", "Famille Schÿler", 100000, BDX],
    ["샤또 디상", "Château d'Issan", C(3), 13.5, "보르도 마고", "Famille Cruse", 120000, BDX],
    ["샤또 랑고아 바르통", "Château Langoa Barton", C(3), 13.5, "보르도 생쥘리앙", "Famille Barton", 120000, BDX],
    ["샤또 말레스코 생텍쥐페리", "Château Malescot St. Exupéry", C(3), 13.5, "보르도 마고", "Famille Zuger", 140000, BDX],
    ["샤또 부아드 깡트낙", "Château Boyd-Cantenac", C(3), 13.5, "보르도 마고", "Famille Guillemet", 100000, BDX],
    ["샤또 깡트낙 브라운", "Château Cantenac Brown", C(3), 13.5, "보르도 마고", "Famille Le Lous", 110000, BDX],
    ["샤또 라 라귄", "Château La Lagune", C(3), 13.5, "보르도 오메독", "Famille Frey", 110000, BDX],
    ["샤또 데미라이", "Château Desmirail", C(3), 13.5, "보르도 마고", "Château Desmirail", 90000, BDX],
    ["샤또 페리에르", "Château Ferrière", C(3), 13.5, "보르도 마고", "Famille Villars", 100000, BDX],
    ["샤또 마르퀴스 달렘", "Château Marquis d'Alesme", C(3), 13.5, "보르도 마고", "Famille Perrodo", 100000, BDX],
    ["샤또 생 피에르", "Château Saint-Pierre", C(4), 13.5, "보르도 생쥘리앙", "Domaines Henri Martin", 120000, BDX],
    ["샤또 브라네르 뒤크뤼", "Château Branaire-Ducru", C(4), 13.5, "보르도 생쥘리앙", "Famille Maroteaux", 110000, BDX],
    ["샤또 푸제", "Château Pouget", C(4), 13.5, "보르도 마고", "Famille Guillemet", 90000, BDX],
    ["샤또 라 투르 카르네", "Château La Tour Carnet", C(4), 13.5, "보르도 오메독", "Bernard Magrez", 80000, BDX],
    ["샤또 라퐁 로셰", "Château Lafon-Rochet", C(4), 13.5, "보르도 생테스테프", "Famille Tesseron", 90000, BDX],
    ["샤또 프리외레 리신", "Château Prieuré-Lichine", C(4), 13.5, "보르도 마고", "Groupe Ballande", 90000, BDX],
    ["샤또 마르퀴스 드 테름", "Château Marquis de Terme", C(4), 13.5, "보르도 마고", "Famille Sénéclauze", 90000, BDX],
    ["샤또 오 바타이", "Château Haut-Batailley", C(5), 13.5, "보르도 포이약", "Famille Cazes", 110000, BDX],
    ["샤또 그랑 퓌 뒤카스", "Château Grand-Puy Ducasse", C(5), 13.5, "보르도 포이약", "Château Grand-Puy Ducasse", 90000, BDX],
    ["샤또 린치 무사", "Château Lynch-Moussas", C(5), 13.5, "보르도 포이약", "Famille Castéja", 70000, BDX],
    ["샤또 도작", "Château Dauzac", C(5), 13.5, "보르도 마고", "Famille Roullier", 90000, BDX],
    ["샤또 뒤 테르트르", "Château du Tertre", C(5), 13.5, "보르도 마고", "Château du Tertre", 80000, BDX],
    ["샤또 오 바주 리베랄", "Château Haut-Bages Libéral", C(5), 13.5, "보르도 포이약", "Claire Villars-Lurton", 90000, BDX],
    ["샤또 페데스클로", "Château Pédesclaux", C(5), 13.5, "보르도 포이약", "Famille Lorenzetti", 90000, BDX],
    ["샤또 벨그라브", "Château Belgrave", C(5), 13.5, "보르도 오메독", "Vignobles Dourthe", 70000, BDX],
    ["샤또 드 카망삭", "Château de Camensac", C(5), 13.5, "보르도 오메독", "Famille Merlaut", 70000, BDX],
    ["샤또 코스 라보리", "Château Cos Labory", C(5), 13.5, "보르도 생테스테프", "Famille Audoy", 80000, BDX],
    ["샤또 크루아제 바주", "Château Croizet-Bages", C(5), 13.5, "보르도 포이약", "Famille Quié", 80000, BDX],
    ["샤또 라 미숑 오브리옹", "Château La Mission Haut-Brion", "레드 · 그라브 크뤼 클라세", 14, "보르도 페삭 레오냥", "Domaine Clarence Dillon", 700000, BDX],
    ["샤또 오 바이", "Château Haut-Bailly", "레드 · 그라브 크뤼 클라세", 14, "보르도 페삭 레오냥", "Famille Wilmers", 220000, BDX],
    ["도멘 드 슈발리에 루즈", "Domaine de Chevalier Rouge", "레드 · 그라브 크뤼 클라세", 13.5, "보르도 페삭 레오냥", "Famille Bernard", 150000, BDX],
    ["샤또 말라르틱 라그라비에르", "Château Malartic-Lagravière Rouge", "레드 · 그라브 크뤼 클라세", 14, "보르도 페삭 레오냥", "Famille Bonnie", 110000, BDX],
    ["샤또 카르보니외 루즈", "Château Carbonnieux Rouge", "레드 · 그라브 크뤼 클라세", 13.5, "보르도 페삭 레오냥", "Famille Perrin", 70000, BDX],
    ["샤또 라투르 마르티약", "Château Latour-Martillac Rouge", "레드 · 그라브 크뤼 클라세", 13.5, "보르도 페삭 레오냥", "Famille Kressmann", 70000, BDX],
  ]);
  W("sweet", "프랑스", [
    ["샤또 클리망", "Château Climens", "스위트 · 바르삭 1등급", 13.5, "보르도 바르삭", "Famille Lurton", 150000, SW],
    ["샤또 쿠테", "Château Coutet", "스위트 · 바르삭 1등급", 14, "보르도 바르삭", "Famille Baly", 100000, SW],
    ["샤또 쉬뒤로", "Château Suduiraut", "스위트 · 소테른 1등급", 14, "보르도 소테른", "AXA Millésimes", 110000, SW],
    ["샤또 리외섹", "Château Rieussec", "스위트 · 소테른 1등급", 14, "보르도 소테른", "Domaines Barons de Rothschild (Lafite)", 110000, SW],
    ["샤또 기로", "Château Guiraud", "스위트 · 소테른 1등급", 14, "보르도 소테른", "Château Guiraud", 90000, SW],
    ["샤또 라 투르 블랑슈", "Château La Tour Blanche", "스위트 · 소테른 1등급", 13.5, "보르도 소테른", "Château La Tour Blanche", 80000, SW],
    ["샤또 라포리 페라게", "Château Lafaurie-Peyraguey", "스위트 · 소테른 1등급", 13.5, "보르도 소테른", "Lalique Group", 100000, SW],
    ["샤또 도아지 데엔", "Château Doisy-Daëne", "스위트 · 바르삭 2등급", 13.5, "보르도 바르삭", "Famille Dubourdieu", 80000, SW],
  ]);
  W("redIcon", "프랑스", [
    ["샤또 카농", "Château Canon", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Chanel (Wertheimer)", 250000, RB],
    ["샤또 벨에르 모낭주", "Château Belair-Monange", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Ets Jean-Pierre Moueix", 300000, RB],
    ["샤또 트로플롱 몽도", "Château Troplong Mondot", "레드 · 생테밀리옹 1등급", 14.5, "보르도 생테밀리옹", "SCOR", 180000, RB],
    ["샤또 발랑드로", "Château Valandraud", "레드 · 생테밀리옹 1등급", 14.5, "보르도 생테밀리옹", "Jean-Luc Thunevin", 350000, RB],
    ["클로 푸르테", "Clos Fourtet", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Famille Cuvelier", 200000, RB],
    ["샤또 보세주르 베코", "Château Beau-Séjour Bécot", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Famille Bécot", 150000, RB],
    ["샤또 라르시 뒤카스", "Château Larcis Ducasse", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Famille Gratiot", 150000, RB],
    ["샤또 파비 마캥", "Château Pavie Macquin", "레드 · 생테밀리옹 1등급", 14.5, "보르도 생테밀리옹", "Famille Corre-Macquin", 150000, RB],
    ["샤또 라 가플리에르", "Château La Gaffelière", "레드 · 생테밀리옹 1등급", 14, "보르도 생테밀리옹", "Famille de Malet Roquefort", 130000, RB],
    ["샤또 그랑 마인", "Château Grand Mayne", "레드 · 생테밀리옹 그랑 크뤼 클라세", 14.5, "보르도 생테밀리옹", "Famille Nony", 90000, RB],
    ["샤또 트로타누아", "Château Trotanoy", "레드 · 포므롤", 14, "보르도 포므롤", "Ets Jean-Pierre Moueix", 400000, RB],
    ["샤또 라 콩세이양트", "Château La Conseillante", "레드 · 포므롤", 14, "보르도 포므롤", "Famille Nicolas", 350000, RB],
    ["비유 샤또 세르탕", "Vieux Château Certan", "레드 · 포므롤", 14, "보르도 포므롤", "Famille Thienpont", 450000, RB],
    ["샤또 클리네", "Château Clinet", "레드 · 포므롤", 14.5, "보르도 포므롤", "Famille Laborde", 200000, RB],
    ["샤또 가쟁", "Château Gazin", "레드 · 포므롤", 14, "보르도 포므롤", "Famille de Bailliencourt", 150000, RB],
    ["샤또 라플뢰르", "Château Lafleur", "레드 · 포므롤", 14, "보르도 포므롤", "Famille Guinaudeau", 1200000, RB],
    ["샤또 네냉", "Château Nenin", "레드 · 포므롤", 14, "보르도 포므롤", "Domaines Delon", 110000, RB],
    ["샤또 쁘띠 빌라주", "Château Petit-Village", "레드 · 포므롤", 14, "보르도 포므롤", "AXA Millésimes", 140000, RB],
    ["샤또 라 플뢰르 페트뤼스", "Château La Fleur-Pétrus", "레드 · 포므롤", 14, "보르도 포므롤", "Ets Jean-Pierre Moueix", 300000, RB],
    ["샤또 오사나", "Château Hosanna", "레드 · 포므롤", 14, "보르도 포므롤", "Ets Jean-Pierre Moueix", 300000, RB],
    ["알테르 에고 드 팔머", "Alter Ego de Palmer", "레드 · 세컨드 와인", 13.5, "보르도 마고", "Château Palmer", 180000, BDX],
    ["클로 뒤 마르퀴스", "Clos du Marquis", "레드 · 생쥘리앙", 13.5, "보르도 생쥘리앙", "Domaines Delon", 120000, BDX],
    ["라 크루아 드 보카이유", "La Croix de Beaucaillou", "레드 · 세컨드 와인", 13.5, "보르도 생쥘리앙", "Famille Borie", 90000, BDX],
    ["레 피에프 드 라그랑주", "Les Fiefs de Lagrange", "레드 · 세컨드 와인", 13.5, "보르도 생쥘리앙", "Suntory", 50000, BDX],
    ["코네타블 드 딸보", "Connétable Talbot", "레드 · 세컨드 와인", 13.5, "보르도 생쥘리앙", "Château Talbot", 50000, BDX],
    ["에코 드 린치 바쥬", "Echo de Lynch-Bages", "레드 · 세컨드 와인", 13.5, "보르도 포이약", "Famille Cazes", 80000, BDX],
    ["레제르브 드 라 콩테스", "Réserve de la Comtesse de Lalande", "레드 · 세컨드 와인", 13.5, "보르도 포이약", "Roederer", 110000, BDX],
    ["레 파고드 드 코스", "Les Pagodes de Cos", "레드 · 세컨드 와인", 13.5, "보르도 생테스테프", "Michel Reybier", 110000, BDX],
    ["라 담 드 몽로즈", "La Dame de Montrose", "레드 · 세컨드 와인", 13.5, "보르도 생테스테프", "Bouygues", 100000, BDX],
    ["레 투렐 드 롱그빌", "Les Tourelles de Longueville", "레드 · 세컨드 와인", 13.5, "보르도 포이약", "AXA Millésimes", 90000, BDX],
    ["쁘띠 슈발", "Le Petit Cheval", "레드 · 세컨드 와인", 14, "보르도 생테밀리옹", "Château Cheval Blanc", 330000, RB],
    ["카리용 당젤뤼스", "Carillon d'Angélus", "레드 · 세컨드 와인", 14.5, "보르도 생테밀리옹", "Famille de Boüard", 200000, RB],
    ["르 쁘띠 오 라피트", "Le Petit Haut Lafitte", "레드 · 세컨드 와인", 13.5, "보르도 페삭 레오냥", "Cathiard", 60000, BDX],
  ]);
  W("whiteCrisp", "프랑스", [
    ["도멘 드 슈발리에 블랑", "Domaine de Chevalier Blanc", "화이트 · 그라브 크뤼 클라세", 13.5, "보르도 페삭 레오냥", "Famille Bernard", 250000, "Sauvignon Blanc/Sémillon"],
    ["샤또 카르보니외 블랑", "Château Carbonnieux Blanc", "화이트 · 그라브 크뤼 클라세", 13, "보르도 페삭 레오냥", "Famille Perrin", 60000, "Sauvignon Blanc/Sémillon"],
    ["파비용 블랑 뒤 샤또 마고", "Pavillon Blanc du Château Margaux", "화이트 · 보르도", 14, "보르도", "Château Margaux", 350000, "Sauvignon Blanc"],
    ["샤또 오브리옹 블랑", "Château Haut-Brion Blanc", "화이트 · 페삭 레오냥", 14, "보르도 페삭 레오냥", "Domaine Clarence Dillon", 1500000, "Sémillon/Sauvignon Blanc"],
  ]);

  /* ── 부르고뉴 ── */
  const PN = "Pinot Noir", CH = "Chardonnay";
  W("pinot", "프랑스", [
    ["도멘 드 라 로마네 콩티 라 타슈", "Domaine de la Romanée-Conti La Tâche", "레드 · 그랑 크뤼", 13.5, "부르고뉴 본 로마네", "Domaine de la Romanée-Conti", 9000000, PN],
    ["도멘 드 라 로마네 콩티 리쉬부르", "Domaine de la Romanée-Conti Richebourg", "레드 · 그랑 크뤼", 13.5, "부르고뉴 본 로마네", "Domaine de la Romanée-Conti", 7000000, PN],
    ["도멘 드 라 로마네 콩티 로마네 생 비방", "Domaine de la Romanée-Conti Romanée-St-Vivant", "레드 · 그랑 크뤼", 13.5, "부르고뉴 본 로마네", "Domaine de la Romanée-Conti", 6000000, PN],
    ["도멘 드 라 로마네 콩티 그랑 에셰조", "Domaine de la Romanée-Conti Grands-Échezeaux", "레드 · 그랑 크뤼", 13.5, "부르고뉴 플라제 에셰조", "Domaine de la Romanée-Conti", 6500000, PN],
    ["콩트 조르주 드 보귀에 뮈지니", "Comte Georges de Vogüé Musigny Vieilles Vignes", "레드 · 그랑 크뤼", 13.5, "부르고뉴 샹볼 뮈지니", "Comte Georges de Vogüé", 2000000, PN],
    ["콩트 조르주 드 보귀에 샹볼 뮈지니", "Comte Georges de Vogüé Chambolle-Musigny", "레드 · 빌라주", 13, "부르고뉴 샹볼 뮈지니", "Comte Georges de Vogüé", 450000, PN],
    ["메오 카뮈제 본 로마네", "Méo-Camuzet Vosne-Romanée", "레드 · 빌라주", 13.5, "부르고뉴 본 로마네", "Domaine Méo-Camuzet", 300000, PN],
    ["도멘 아르망 루소 샹베르탱", "Domaine Armand Rousseau Chambertin", "레드 · 그랑 크뤼", 13.5, "부르고뉴 쥐브레 샹베르탱", "Domaine Armand Rousseau", 3500000, PN],
    ["도멘 뒤작 모레 생 드니", "Domaine Dujac Morey-Saint-Denis", "레드 · 빌라주", 13, "부르고뉴 모레 생 드니", "Domaine Dujac", 200000, PN],
    ["조르주 루미에 샹볼 뮈지니", "Georges Roumier Chambolle-Musigny", "레드 · 빌라주", 13, "부르고뉴 샹볼 뮈지니", "Domaine Georges Roumier", 600000, PN],
    ["몽제아르 뮈뉴레 본 로마네", "Mongeard-Mugneret Vosne-Romanée", "레드 · 빌라주", 13, "부르고뉴 본 로마네", "Domaine Mongeard-Mugneret", 120000, PN],
    ["위들로 노엘라 샹볼 뮈지니", "Hudelot-Noëllat Chambolle-Musigny", "레드 · 빌라주", 13, "부르고뉴 샹볼 뮈지니", "Domaine Hudelot-Noëllat", 150000, PN],
    ["페블리 쥐브레 샹베르탱", "Faiveley Gevrey-Chambertin", "레드 · 빌라주", 13, "부르고뉴 쥐브레 샹베르탱", "Domaine Faiveley", 120000, PN],
    ["페블리 부르고뉴 피노 누아", "Faiveley Bourgogne Pinot Noir", "레드 · 부르고뉴", 12.5, "부르고뉴", "Domaine Faiveley", 40000, PN],
    ["조셉 드루앵 샹볼 뮈지니", "Joseph Drouhin Chambolle-Musigny", "레드 · 빌라주", 13, "부르고뉴 샹볼 뮈지니", "Maison Joseph Drouhin", 120000, PN],
    ["조셉 드루앵 클로 드 부조", "Joseph Drouhin Clos de Vougeot", "레드 · 그랑 크뤼", 13.5, "부르고뉴 부조", "Maison Joseph Drouhin", 250000, PN],
    ["조셉 드루앵 본 클로 데 무슈 루즈", "Joseph Drouhin Beaune 1er Cru Clos des Mouches Rouge", "레드 · 1er Cru", 13, "부르고뉴 본", "Maison Joseph Drouhin", 120000, PN],
    ["루이 자도 본 클로 데 쥐르쉴", "Louis Jadot Beaune 1er Cru Clos des Ursules", "레드 · 1er Cru", 13.5, "부르고뉴 본", "Maison Louis Jadot", 100000, PN],
    ["루이 자도 클로 드 부조", "Louis Jadot Clos de Vougeot", "레드 · 그랑 크뤼", 13.5, "부르고뉴 부조", "Maison Louis Jadot", 230000, PN],
    ["부샤 본 그레브 비뉴 드 랑팡 제쥐", "Bouchard Père & Fils Beaune Grèves Vigne de l'Enfant Jésus", "레드 · 1er Cru", 13.5, "부르고뉴 본", "Bouchard Père & Fils", 130000, PN],
    ["루이 라뚜르 알록스 코르통", "Louis Latour Aloxe-Corton", "레드 · 빌라주", 13.5, "부르고뉴 알록스 코르통", "Maison Louis Latour", 70000, PN],
    ["루이 라뚜르 코르통 그랑시", "Louis Latour Château Corton Grancey", "레드 · 그랑 크뤼", 13.5, "부르고뉴 코르통", "Maison Louis Latour", 150000, PN],
    ["알베르 비쇼 본 로마네", "Albert Bichot Vosne-Romanée", "레드 · 빌라주", 13, "부르고뉴 본 로마네", "Albert Bichot", 110000, PN],
    ["마르셀 라피에르 모르공", "Marcel Lapierre Morgon", "레드 · 보졸레 크뤼", 13, "보졸레 모르공", "Domaine Marcel Lapierre", 50000, "Gamay"],
    ["장 푸아야르 모르공 코트 뒤 피", "Jean Foillard Morgon Côte du Py", "레드 · 보졸레 크뤼", 13, "보졸레 모르공", "Jean Foillard", 60000, "Gamay"],
    ["샤또 티뱅 코트 드 브루이", "Château Thivin Côte de Brouilly", "레드 · 보졸레 크뤼", 13, "보졸레 코트 드 브루이", "Château Thivin", 40000, "Gamay"],
  ]);
  W("whiteCrisp", "프랑스", [
    ["조셉 드루앵 본 클로 데 무슈 블랑", "Joseph Drouhin Beaune 1er Cru Clos des Mouches Blanc", "화이트 · 1er Cru", 13, "부르고뉴 본", "Maison Joseph Drouhin", 150000, CH],
    ["루이 자도 뫼르소", "Louis Jadot Meursault", "화이트 · 빌라주", 13, "부르고뉴 뫼르소", "Maison Louis Jadot", 110000, CH],
    ["루이 자도 샤샤뉴 몽라셰", "Louis Jadot Chassagne-Montrachet", "화이트 · 빌라주", 13, "부르고뉴 샤샤뉴 몽라셰", "Maison Louis Jadot", 120000, CH],
    ["루이 자도 코르통 샤를마뉴", "Louis Jadot Corton-Charlemagne", "화이트 · 그랑 크뤼", 13.5, "부르고뉴 코르통", "Maison Louis Jadot", 250000, CH],
    ["루이 라뚜르 코르통 샤를마뉴", "Louis Latour Corton-Charlemagne", "화이트 · 그랑 크뤼", 13.5, "부르고뉴 코르통", "Maison Louis Latour", 250000, CH],
    ["루이 라뚜르 푸이 퓌세", "Louis Latour Pouilly-Fuissé", "화이트 · 마꼬네", 13, "부르고뉴 마꼬네", "Maison Louis Latour", 50000, CH],
    ["루이 라뚜르 샤샤뉴 몽라셰", "Louis Latour Chassagne-Montrachet", "화이트 · 빌라주", 13, "부르고뉴 샤샤뉴 몽라셰", "Maison Louis Latour", 120000, CH],
    ["부샤 뫼르소", "Bouchard Père & Fils Meursault", "화이트 · 빌라주", 13, "부르고뉴 뫼르소", "Bouchard Père & Fils", 100000, CH],
    ["도멘 르플레브 부르고뉴 블랑", "Domaine Leflaive Bourgogne Blanc", "화이트 · 부르고뉴", 12.5, "부르고뉴", "Domaine Leflaive", 120000, CH],
    ["도멘 르플레브 바타르 몽라셰", "Domaine Leflaive Bâtard-Montrachet", "화이트 · 그랑 크뤼", 13.5, "부르고뉴 퓔리니 몽라셰", "Domaine Leflaive", 1300000, CH],
    ["올리비에 르플레브 부르고뉴 레 세티", "Olivier Leflaive Bourgogne Blanc Les Sétilles", "화이트 · 부르고뉴", 12.5, "부르고뉴", "Olivier Leflaive", 40000, CH],
    ["코슈 뒤리 뫼르소", "Coche-Dury Meursault", "화이트 · 빌라주", 13, "부르고뉴 뫼르소", "Domaine Coche-Dury", 1500000, CH],
    ["도멘 룰로 뫼르소", "Domaine Roulot Meursault", "화이트 · 빌라주", 13, "부르고뉴 뫼르소", "Domaine Roulot", 400000, CH],
    ["윌리엄 페브르 샤블리 그랑 크뤼 레 클로", "William Fèvre Chablis Grand Cru Les Clos", "화이트 · 샤블리 그랑 크뤼", 13, "부르고뉴 샤블리", "Domaine William Fèvre", 150000, CH],
    ["윌리엄 페브르 샤블리 그랑 크뤼 부그로", "William Fèvre Chablis Grand Cru Bougros", "화이트 · 샤블리 그랑 크뤼", 13, "부르고뉴 샤블리", "Domaine William Fèvre", 130000, CH],
    ["알베르 비쇼 샤블리", "Albert Bichot Chablis", "화이트 · 샤블리", 12.5, "부르고뉴 샤블리", "Albert Bichot", 35000, CH],
    ["장 마르크 브로카르 샤블리", "Jean-Marc Brocard Chablis Sainte Claire", "화이트 · 샤블리", 12.5, "부르고뉴 샤블리", "Jean-Marc Brocard", 35000, CH],
    ["도멘 라로슈 샤블리", "Domaine Laroche Chablis Saint Martin", "화이트 · 샤블리", 12.5, "부르고뉴 샤블리", "Domaine Laroche", 40000, CH],
    ["시모네 페브르 샤블리", "Simonnet-Febvre Chablis", "화이트 · 샤블리", 12.5, "부르고뉴 샤블리", "Simonnet-Febvre", 35000, CH],
    ["페블리 메르퀴레 블랑", "Faiveley Mercurey Blanc", "화이트 · 코트 샬로네즈", 13, "부르고뉴 메르퀴레", "Domaine Faiveley", 50000, CH],
    ["조셉 드루앵 푸이 퓌세", "Joseph Drouhin Pouilly-Fuissé", "화이트 · 마꼬네", 13, "부르고뉴 마꼬네", "Maison Joseph Drouhin", 50000, CH],
  ]);

  /* ── 론 · 루아르 · 알자스 · 프로방스 · 랑그독 ── */
  W("redMed", "프랑스", [
    ["샤푸티에 크로즈 에르미타주 라 쁘띠 뤼슈", "M. Chapoutier Crozes-Hermitage La Petite Ruche", "레드 · 북부 론", 13.5, "론 크로즈 에르미타주", "M. Chapoutier", 35000, "Syrah"],
    ["샤푸티에 에르미타주 모니에 드 라 시즈랑", "M. Chapoutier Hermitage Monier de la Sizeranne", "레드 · 북부 론", 14, "론 에르미타주", "M. Chapoutier", 120000, "Syrah"],
    ["샤푸티에 샤또네프 뒤 파프 라 베르나르딘", "M. Chapoutier Châteauneuf-du-Pape La Bernardine", "레드 · 남부 론", 14.5, "론 샤또네프 뒤 파프", "M. Chapoutier", 70000, "Grenache/Syrah"],
    ["폴 자불레 에네 에르미타주 라 샤펠", "Paul Jaboulet Aîné Hermitage La Chapelle", "레드 · 북부 론", 14, "론 에르미타주", "Paul Jaboulet Aîné", 350000, "Syrah"],
    ["폴 자불레 에네 크로즈 에르미타주 탈라베르", "Paul Jaboulet Aîné Crozes-Hermitage Domaine de Thalabert", "레드 · 북부 론", 13.5, "론 크로즈 에르미타주", "Paul Jaboulet Aîné", 60000, "Syrah"],
    ["이 기갈 코트 로티 브륀 에 블롱드", "E. Guigal Côte-Rôtie Brune et Blonde", "레드 · 북부 론", 13.5, "론 코트 로티", "E. Guigal", 110000, "Syrah/Viognier"],
    ["이 기갈 코트 로티 라 물린", "E. Guigal Côte-Rôtie La Mouline", "레드 · 북부 론", 13.5, "론 코트 로티", "E. Guigal", 600000, "Syrah/Viognier"],
    ["이 기갈 코트 로티 라 랑돈", "E. Guigal Côte-Rôtie La Landonne", "레드 · 북부 론", 13.5, "론 코트 로티", "E. Guigal", 600000, "Syrah"],
    ["이 기갈 코트 로티 라 튀르크", "E. Guigal Côte-Rôtie La Turque", "레드 · 북부 론", 13.5, "론 코트 로티", "E. Guigal", 600000, "Syrah/Viognier"],
    ["이 기갈 에르미타주 루즈", "E. Guigal Hermitage Rouge", "레드 · 북부 론", 14, "론 에르미타주", "E. Guigal", 120000, "Syrah"],
    ["이 기갈 지공다스", "E. Guigal Gigondas", "레드 · 남부 론", 14.5, "론 지공다스", "E. Guigal", 50000, "Grenache/Syrah/Mourvèdre"],
    ["샤또 라야스 샤또네프 뒤 파프", "Château Rayas Châteauneuf-du-Pape", "레드 · 남부 론", 14.5, "론 샤또네프 뒤 파프", "Château Rayas", 1500000, "Grenache"],
    ["비유 텔레그라프 라 크라우", "Domaine du Vieux Télégraphe La Crau", "레드 · 남부 론", 14.5, "론 샤또네프 뒤 파프", "Famille Brunier", 110000, "Grenache/Syrah/Mourvèdre"],
    ["도멘 뒤 페고 퀴베 레제르베", "Domaine du Pégau Cuvée Réservée", "레드 · 남부 론", 15, "론 샤또네프 뒤 파프", "Domaine du Pégau", 110000, "Grenache/Syrah/Mourvèdre"],
    ["클로 데 파프 샤또네프 뒤 파프", "Clos des Papes Châteauneuf-du-Pape", "레드 · 남부 론", 15, "론 샤또네프 뒤 파프", "Famille Avril", 130000, "Grenache/Mourvèdre/Syrah"],
    ["들라스 크로즈 에르미타주 레 바유", "Delas Frères Crozes-Hermitage Les Launes", "레드 · 북부 론", 13.5, "론 크로즈 에르미타주", "Delas Frères", 35000, "Syrah"],
    ["페랭 지공다스", "Perrin Gigondas La Gille", "레드 · 남부 론", 14.5, "론 지공다스", "Famille Perrin", 50000, "Grenache/Syrah"],
    ["라 비에유 페름 루즈", "La Vieille Ferme Rouge", "레드 · 방투", 13.5, "론 방투", "Famille Perrin", 15000, "Grenache/Syrah/Carignan/Cinsault"],
    ["비달 플뢰리 꼬뜨 뒤 론", "Vidal-Fleury Côtes du Rhône Rouge", "레드 · 꼬뜨 뒤 론", 14, "론", "Vidal-Fleury", 22000, "Grenache/Syrah"],
    ["샤또 드 피바르농 방돌", "Château de Pibarnon Bandol Rouge", "레드 · 방돌", 14, "프로방스 방돌", "Famille de Saint-Victor", 70000, "Mourvèdre/Grenache"],
    ["도멘 탕피에 방돌", "Domaine Tempier Bandol Rouge", "레드 · 방돌", 14, "프로방스 방돌", "Domaine Tempier", 80000, "Mourvèdre/Grenache/Cinsault"],
    ["마스 드 도마스 가사크 루즈", "Mas de Daumas Gassac Rouge", "레드 · 랑그독", 13.5, "랑그독 에로", "Famille Guibert", 70000, "Cabernet Sauvignon"],
    ["제라르 베르트랑 시갈뤼스 루즈", "Gérard Bertrand Cigalus Rouge", "레드 · 랑그독", 14.5, "랑그독 오드", "Gérard Bertrand", 70000, "Cabernet Sauvignon/Merlot/Syrah"],
    ["제라르 베르트랑 클로 뒤 탕플", "Gérard Bertrand Clos du Temple", "로제 · 랑그독", 13.5, "랑그독 카브리에르", "Gérard Bertrand", 250000, "Cinsault/Grenache/Syrah/Viognier"],
  ]);
  W("whiteCrisp", "프랑스", [
    ["이 기갈 콩드리외", "E. Guigal Condrieu La Doriane", "화이트 · 콩드리외", 14, "론 콩드리외", "E. Guigal", 150000, "Viognier"],
    ["라 비에유 페름 블랑", "La Vieille Ferme Blanc", "화이트 · 뤼베롱", 13, "론 뤼베롱", "Famille Perrin", 15000, "Grenache Blanc/Bourboulenc/Ugni Blanc/Vermentino"],
    ["라 비에유 페름 로제", "La Vieille Ferme Rosé", "로제 · 방투", 13, "론 방투", "Famille Perrin", 15000, "Cinsault/Grenache/Syrah"],
    ["도멘 바슈롱 상세르", "Domaine Vacheron Sancerre Blanc", "화이트 · 루아르", 13, "루아르 상세르", "Domaine Vacheron", 60000, "Sauvignon Blanc"],
    ["디디에 다그노 실렉스", "Didier Dagueneau Silex", "화이트 · 루아르", 13, "루아르 푸이 퓌메", "Didier Dagueneau", 300000, "Sauvignon Blanc"],
    ["알퐁스 멜로 상세르 라 무시에르", "Alphonse Mellot Sancerre La Moussière", "화이트 · 루아르", 13, "루아르 상세르", "Alphonse Mellot", 60000, "Sauvignon Blanc"],
    ["도멘 위에 부브레 르 몽", "Domaine Huet Vouvray Le Mont Sec", "화이트 · 루아르", 13, "루아르 부브레", "Domaine Huet", 90000, "Chenin Blanc"],
    ["트림바크 클로 생트 윈", "Trimbach Riesling Clos Ste Hune", "화이트 · 알자스", 13, "알자스", "Maison Trimbach", 400000, "Riesling"],
    ["트림바크 피노 그리 레제르브", "Trimbach Pinot Gris Réserve", "화이트 · 알자스", 13.5, "알자스", "Maison Trimbach", 50000, "Pinot Gris"],
    ["트림바크 게뷔르츠트라미너", "Trimbach Gewurztraminer", "화이트 · 알자스", 13.5, "알자스", "Maison Trimbach", 45000, "Gewürztraminer"],
    ["진트 움브레히트 리슬링", "Zind-Humbrecht Riesling", "화이트 · 알자스", 13, "알자스", "Domaine Zind-Humbrecht", 70000, "Riesling"],
    ["휘겔 리슬링 클래식", "Hugel Riesling Classic", "화이트 · 알자스", 12.5, "알자스", "Hugel", 40000, "Riesling"],
    ["휘겔 피노 그리 클래식", "Hugel Pinot Gris Classic", "화이트 · 알자스", 13, "알자스", "Hugel", 40000, "Pinot Gris"],
    ["도멘 바인바흐 리슬링 퀴베 테오", "Domaine Weinbach Riesling Cuvée Théo", "화이트 · 알자스", 13, "알자스", "Domaine Weinbach", 90000, "Riesling"],
    ["위스퍼링 엔젤", "Château d'Esclans Whispering Angel", "로제 · 프로방스", 13, "프로방스 코트 드 프로방스", "Château d'Esclans", 40000, "Grenache/Cinsault/Rolle"],
    ["록 엔젤", "Château d'Esclans Rock Angel", "로제 · 프로방스", 13.5, "프로방스 코트 드 프로방스", "Château d'Esclans", 60000, "Grenache/Rolle"],
    ["미라발 로제", "Miraval Côtes de Provence Rosé", "로제 · 프로방스", 13, "프로방스 코트 드 프로방스", "Château Miraval", 45000, "Cinsault/Grenache/Syrah/Rolle"],
    ["미뉘티 M 로제", "Minuty M de Minuty Rosé", "로제 · 프로방스", 12.5, "프로방스 코트 드 프로방스", "Château Minuty", 35000, "Grenache/Cinsault/Syrah"],
    ["도멘 오트 샤또 드 셀", "Domaines Ott Château de Selle Rosé", "로제 · 프로방스", 13, "프로방스 코트 드 프로방스", "Domaines Ott", 80000, "Grenache/Cinsault/Syrah"],
    ["제라르 베르트랑 그리 블랑", "Gérard Bertrand Gris Blanc", "로제 · 랑그독", 12.5, "랑그독", "Gérard Bertrand", 22000, "Grenache Gris/Grenache Noir"],
  ]);

  /* ── 샴페인 · 스파클링 ── */
  W("bubbly", "프랑스", [
    ["모엣 샹동 그랑 빈티지", "Moët & Chandon Grand Vintage", "스파클링 · 빈티지 샴페인", 12.5, "샹파뉴", "Moët & Chandon", 120000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["모엣 샹동 아이스 임페리얼", "Moët & Chandon Ice Impérial", "스파클링 · 드미 섹", 12, "샹파뉴", "Moët & Chandon", 85000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["돔 페리뇽 로제", "Dom Pérignon Rosé", "스파클링 · 프레스티지 로제", 12.5, "샹파뉴", "Moët & Chandon (Dom Pérignon)", 650000, "Pinot Noir/Chardonnay"],
    ["크룩 빈티지", "Krug Vintage", "스파클링 · 빈티지 프레스티지", 12, "샹파뉴", "Krug", 600000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["크룩 로제", "Krug Rosé", "스파클링 · 프레스티지 로제", 12, "샹파뉴", "Krug", 550000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["볼랭저 라 그랑 아네", "Bollinger La Grande Année", "스파클링 · 빈티지 샴페인", 12, "샹파뉴 아이", "Bollinger", 250000, "Pinot Noir/Chardonnay"],
    ["볼랭저 로제", "Bollinger Rosé", "스파클링 · 로제 샴페인", 12, "샹파뉴 아이", "Bollinger", 130000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["떼땅져 프렐뤼드 그랑 크뤼", "Taittinger Prélude Grands Crus", "스파클링 · 샴페인", 12.5, "샹파뉴", "Taittinger", 110000, "Chardonnay/Pinot Noir"],
    ["떼땅져 프레스티지 로제", "Taittinger Prestige Rosé", "스파클링 · 로제 샴페인", 12, "샹파뉴", "Taittinger", 110000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["폴 로저 퀴베 서 윈스턴 처칠", "Pol Roger Cuvée Sir Winston Churchill", "스파클링 · 프레스티지 퀴베", 12.5, "샹파뉴 에페르네", "Pol Roger", 450000, "Pinot Noir/Chardonnay"],
    ["루이 로드레 브뤼 나튀르", "Louis Roederer Brut Nature", "스파클링 · 브뤼 나튀르", 12, "샹파뉴", "Louis Roederer", 150000, "Pinot Noir/Chardonnay"],
    ["뤼나르 로제", "Ruinart Rosé", "스파클링 · 로제 샴페인", 12.5, "샹파뉴", "Ruinart", 160000, "Chardonnay/Pinot Noir"],
    ["뵈브 클리코 리치", "Veuve Clicquot Rich", "스파클링 · 믹솔로지용 샴페인", 12, "샹파뉴", "Veuve Clicquot", 95000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["로랑 페리에 그랑 시에클", "Laurent-Perrier Grand Siècle", "스파클링 · 프레스티지 퀴베", 12, "샹파뉴", "Laurent-Perrier", 350000, "Chardonnay/Pinot Noir"],
    ["고세 그랑 레제르브", "Gosset Grande Réserve Brut", "스파클링 · 샴페인", 12, "샹파뉴 아이", "Gosset", 110000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["도츠 브뤼 클래식", "Deutz Brut Classic", "스파클링 · 샴페인", 12, "샹파뉴 아이", "Deutz", 80000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["앙리오 브뤼 수베랭", "Henriot Brut Souverain", "스파클링 · 샴페인", 12, "샹파뉴", "Henriot", 85000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["자크송 퀴베 700", "Jacquesson Cuvée 700 Series", "스파클링 · 샴페인", 12.5, "샹파뉴", "Jacquesson", 120000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["필리포나 로얄 레제르브", "Philipponnat Royale Réserve Brut", "스파클링 · 샴페인", 12, "샹파뉴 마뢰이 쉬르 아이", "Philipponnat", 90000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["랑송 블랙 라벨", "Lanson Le Black Label Brut", "스파클링 · 샴페인", 12.5, "샹파뉴 랭스", "Lanson", 65000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["드라피에 카르트 도르", "Drappier Carte d'Or Brut", "스파클링 · 샴페인", 12, "샹파뉴 오브", "Drappier", 70000, "Pinot Noir/Chardonnay/Pinot Meunier"],
    ["에글리 우리에 브뤼 트라디시옹", "Egly-Ouriet Brut Tradition Grand Cru", "스파클링 · 그랑 크뤼 샴페인", 12.5, "샹파뉴 앙보네", "Egly-Ouriet", 200000, "Pinot Noir/Chardonnay"],
    ["자크 셀로스 이니시알", "Jacques Selosse Initial", "스파클링 · 블랑 드 블랑", 12.5, "샹파뉴 아비즈", "Jacques Selosse", 900000, "Chardonnay"],
    ["피에르 지모네 퀴스 1er 크뤼", "Pierre Gimonnet Cuis 1er Cru Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12.5, "샹파뉴 퀴스", "Pierre Gimonnet & Fils", 80000, "Chardonnay"],
    ["들라모트 블랑 드 블랑", "Delamotte Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12, "샹파뉴 르 메닐", "Delamotte", 110000, "Chardonnay"],
    ["아얄라 브뤼 마죄르", "Ayala Brut Majeur", "스파클링 · 샴페인", 12, "샹파뉴 아이", "Ayala", 70000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["포므리 브뤼 로얄", "Pommery Brut Royal", "스파클링 · 샴페인", 12.5, "샹파뉴 랭스", "Pommery", 65000, "Chardonnay/Pinot Noir/Pinot Meunier"],
    ["까나르 뒤셴 오텐티크", "Canard-Duchêne Authentic Brut", "스파클링 · 샴페인", 12, "샹파뉴", "Canard-Duchêne", 55000, "Pinot Noir/Pinot Meunier/Chardonnay"],
    ["니콜라 푀이야트 팔메 도르", "Nicolas Feuillatte Palmes d'Or", "스파클링 · 프레스티지 퀴베", 12, "샹파뉴", "Nicolas Feuillatte", 220000, "Chardonnay/Pinot Noir"],
    ["멈 RSRV 블랑 드 블랑", "Mumm RSRV Blanc de Blancs", "스파클링 · 블랑 드 블랑", 12.5, "샹파뉴 크라망", "G.H. Mumm", 130000, "Chardonnay"],
    ["조닌 프로세코", "Zonin Prosecco Brut", "스파클링 · 프로세코", 11, "이탈리아 베네토", "Zonin", 15000, "Glera"],
    ["보테가 골드 프로세코", "Bottega Gold Prosecco Brut", "스파클링 · 프로세코", 11, "이탈리아 베네토", "Bottega", 45000, "Glera"],
    ["카 델 보스코 퀴베 프레스티지", "Ca' del Bosco Cuvée Prestige Franciacorta", "스파클링 · 프란차코르타", 12.5, "이탈리아 롬바르디아", "Ca' del Bosco", 60000, "Chardonnay/Pinot Nero/Pinot Bianco"],
    ["그라모나 임페리얼", "Gramona Imperial Gran Reserva", "스파클링 · 코르피나트", 12, "스페인 페네데스", "Gramona", 50000, "Xarel·lo/Macabeo/Chardonnay"],
    ["레카레도 테레스 데 펜데르", "Recaredo Terrers Brut Nature", "스파클링 · 코르피나트", 12, "스페인 페네데스", "Recaredo", 55000, "Xarel·lo/Macabeo/Parellada"],
    ["라벤토스 이 블랑 데 니트", "Raventós i Blanc De Nit Rosé", "스파클링 · 로제", 12, "스페인 콘카 델 리우 아노이아", "Raventós i Blanc", 45000, "Xarel·lo/Macabeo/Parellada/Monastrell"],
    ["샹동 로제", "Chandon Rosé", "스파클링 · 로제", 12, "미국 캘리포니아", "Chandon", 38000, "Pinot Noir/Chardonnay"],
    ["로드레 이스테이트 브뤼", "Roederer Estate Brut", "스파클링 · 스파클링 와인", 12, "미국 앤더슨 밸리", "Roederer Estate", 45000, "Chardonnay/Pinot Noir"],
    ["리운티 람브루스코", "Riunite Lambrusco", "스파클링 · 스위트 레드 람브루스코", 8, "이탈리아 에밀리아", "Riunite", 10000, "Lambrusco"],
    ["클레토 키아를리 람브루스코 디 소르바라", "Cleto Chiarli Lambrusco di Sorbara Vecchia Modena", "스파클링 · 드라이 람브루스코", 11, "이탈리아 에밀리아", "Cleto Chiarli", 30000, "Lambrusco di Sorbara"],
    ["메디치 에르메테 콘체르토 람브루스코", "Medici Ermete Concerto Lambrusco Reggiano", "스파클링 · 드라이 람브루스코", 11.5, "이탈리아 에밀리아", "Medici Ermete", 30000, "Lambrusco Salamino"],
  ]);
  // 샴페인 블록 중 프랑스가 아닌 항목의 국가 보정
  window.LIQUORS.forEach((x) => { if (x.bulk && x.region && /^(이탈리아|스페인|미국) /.test(x.region)) { const [c, ...rest] = x.region.split(" "); x.country = c; x.region = rest.join(" "); } });

  /* ── 이탈리아 ── */
  W("italian", "이탈리아", [
    ["안티노리 피안 델레 비녜 브루넬로", "Antinori Pian delle Vigne Brunello di Montalcino", "레드 · 브루넬로", 14, "토스카나 몬탈치노", "Marchesi Antinori", 90000, "Sangiovese"],
    ["안티노리 바디아 아 파시냐노", "Antinori Badia a Passignano Chianti Classico Gran Selezione", "레드 · 키안티 클라시코 그란 셀레치오네", 14, "토스카나 키안티", "Marchesi Antinori", 80000, "Sangiovese"],
    ["프레스코발디 카스텔조콘도 브루넬로", "Frescobaldi CastelGiocondo Brunello di Montalcino", "레드 · 브루넬로", 14.5, "토스카나 몬탈치노", "Frescobaldi", 90000, "Sangiovese"],
    ["프레스코발디 모르모레토", "Frescobaldi Mormoreto", "레드 · 토스카나 블렌드", 14.5, "토스카나", "Frescobaldi", 100000, "Cabernet Sauvignon/Cabernet Franc/Merlot"],
    ["루체", "Luce della Vite Luce", "레드 · 토스카나 블렌드", 14.5, "토스카나 몬탈치노", "Frescobaldi (Luce)", 130000, "Sangiovese/Merlot"],
    ["루첸테", "Luce della Vite Lucente", "레드 · 토스카나 블렌드", 14, "토스카나", "Frescobaldi (Luce)", 45000, "Merlot/Sangiovese"],
    ["카스텔로 디 볼파이아 키안티 클라시코", "Castello di Volpaia Chianti Classico", "레드 · 키안티 클라시코", 13.5, "토스카나 키안티", "Castello di Volpaia", 40000, "Sangiovese"],
    ["폰토디 플라차넬로", "Fontodi Flaccianello della Pieve", "레드 · 토스카나 IGT", 14.5, "토스카나 키안티", "Fontodi", 150000, "Sangiovese"],
    ["폰토디 키안티 클라시코", "Fontodi Chianti Classico", "레드 · 키안티 클라시코", 14, "토스카나 키안티", "Fontodi", 50000, "Sangiovese"],
    ["이솔레 에 올레나 체파렐로", "Isole e Olena Cepparello", "레드 · 토스카나 IGT", 14, "토스카나", "Isole e Olena", 120000, "Sangiovese"],
    ["펠시나 키안티 클라시코", "Fèlsina Berardenga Chianti Classico", "레드 · 키안티 클라시코", 13.5, "토스카나 키안티", "Fèlsina", 40000, "Sangiovese"],
    ["산 펠리체 일 그리지오 리제르바", "San Felice Il Grigio Chianti Classico Riserva", "레드 · 키안티 클라시코 리제르바", 13.5, "토스카나 키안티", "San Felice", 40000, "Sangiovese"],
    ["퀘르치아벨라 키안티 클라시코", "Querciabella Chianti Classico", "레드 · 키안티 클라시코", 13.5, "토스카나 키안티", "Querciabella", 55000, "Sangiovese"],
    ["투아 리타 레디가피", "Tua Rita Redigaffi", "레드 · 토스카나 IGT", 15, "토스카나 수베레토", "Tua Rita", 300000, "Merlot"],
    ["그라타마코 볼게리 로쏘", "Grattamacco Bolgheri Rosso", "레드 · 볼게리", 14, "토스카나 볼게리", "Grattamacco", 45000, "Cabernet Sauvignon/Merlot/Sangiovese"],
    ["마세토", "Masseto", "레드 · 토스카나 IGT", 14.5, "토스카나 볼게리", "Tenuta dell'Ornellaia (Masseto)", 1500000, "Merlot"],
    ["콜 도르차 브루넬로", "Col d'Orcia Brunello di Montalcino", "레드 · 브루넬로", 14, "토스카나 몬탈치노", "Col d'Orcia", 70000, "Sangiovese"],
    ["일 포조네 브루넬로", "Il Poggione Brunello di Montalcino", "레드 · 브루넬로", 14.5, "토스카나 몬탈치노", "Tenuta Il Poggione", 75000, "Sangiovese"],
    ["알테지노 브루넬로", "Altesino Brunello di Montalcino", "레드 · 브루넬로", 14, "토스카나 몬탈치노", "Altesino", 70000, "Sangiovese"],
    ["치아치 피콜로미니 브루넬로", "Ciacci Piccolomini d'Aragona Brunello di Montalcino", "레드 · 브루넬로", 14.5, "토스카나 몬탈치노", "Ciacci Piccolomini d'Aragona", 80000, "Sangiovese"],
    ["폴리치아노 비노 노빌레", "Poliziano Vino Nobile di Montepulciano", "레드 · 비노 노빌레", 14, "토스카나 몬테풀치아노", "Poliziano", 40000, "Prugnolo Gentile/Merlot"],
    ["아비뇨네지 비노 노빌레", "Avignonesi Vino Nobile di Montepulciano", "레드 · 비노 노빌레", 14, "토스카나 몬테풀치아노", "Avignonesi", 45000, "Sangiovese"],
    ["루피노 모두스", "Ruffino Modus", "레드 · 토스카나 IGT", 14, "토스카나", "Ruffino", 40000, "Sangiovese/Cabernet Sauvignon/Merlot"],
    ["움베르토 체사리 리아노", "Umberto Cesari Liano", "레드 · 에밀리아 IGT", 14, "에밀리아 로마냐", "Umberto Cesari", 45000, "Sangiovese/Cabernet Sauvignon"],
  ]);
  W("redIcon", "이탈리아", [
    ["가야 바롤로 스페르스", "Gaja Sperss Langhe Nebbiolo", "레드 · 랑게 네비올로", 14.5, "피에몬테 세라룽가", "Gaja", 450000, "Nebbiolo"],
    ["가야 시토 모레스코", "Gaja Sito Moresco Langhe Rosso", "레드 · 랑게 로쏘", 14, "피에몬테", "Gaja", 90000, "Nebbiolo/Merlot/Cabernet Sauvignon"],
    ["브루노 자코사 바르바레스코", "Bruno Giacosa Barbaresco", "레드 · 바르바레스코", 14, "피에몬테 바르바레스코", "Bruno Giacosa", 180000, "Nebbiolo"],
    ["자코모 콘테르노 바롤로 카시나 프란치아", "Giacomo Conterno Barolo Cascina Francia", "레드 · 바롤로", 14.5, "피에몬테 바롤로", "Giacomo Conterno", 450000, "Nebbiolo"],
    ["비에티 바롤로 카스틸리오네", "Vietti Barolo Castiglione", "레드 · 바롤로", 14.5, "피에몬테 바롤로", "Vietti", 90000, "Nebbiolo"],
    ["비에티 페르바코", "Vietti Perbacco Langhe Nebbiolo", "레드 · 랑게 네비올로", 14, "피에몬테", "Vietti", 45000, "Nebbiolo"],
    ["체레토 바롤로", "Ceretto Barolo", "레드 · 바롤로", 14, "피에몬테 바롤로", "Ceretto", 90000, "Nebbiolo"],
    ["파올로 스카비노 바롤로", "Paolo Scavino Barolo", "레드 · 바롤로", 14.5, "피에몬테 바롤로", "Paolo Scavino", 90000, "Nebbiolo"],
    ["엘리오 알타레 바롤로", "Elio Altare Barolo", "레드 · 바롤로", 14.5, "피에몬테 바롤로", "Elio Altare", 120000, "Nebbiolo"],
    ["다밀라노 레친퀘비녜 바롤로", "Damilano Lecinquevigne Barolo", "레드 · 바롤로", 14, "피에몬테 바롤로", "Damilano", 70000, "Nebbiolo"],
    ["마솔리노 바롤로", "Massolino Barolo", "레드 · 바롤로", 14.5, "피에몬테 바롤로", "Massolino", 90000, "Nebbiolo"],
    ["프로두토리 델 바르바레스코", "Produttori del Barbaresco Barbaresco", "레드 · 바르바레스코", 14, "피에몬테 바르바레스코", "Produttori del Barbaresco", 70000, "Nebbiolo"],
    ["달 포르노 로마노 아마로네", "Dal Forno Romano Amarone della Valpolicella", "레드 · 아마로네", 16.5, "베네토 발폴리첼라", "Dal Forno Romano", 900000, "Corvina/Rondinella"],
    ["퀸타렐리 아마로네", "Giuseppe Quintarelli Amarone della Valpolicella Classico", "레드 · 아마로네", 16.5, "베네토 발폴리첼라", "Giuseppe Quintarelli", 900000, "Corvina/Rondinella/Molinara"],
    ["알레그리니 아마로네", "Allegrini Amarone della Valpolicella Classico", "레드 · 아마로네", 15.5, "베네토 발폴리첼라", "Allegrini", 90000, "Corvina/Rondinella"],
    ["베르타니 아마로네", "Bertani Amarone della Valpolicella Classico", "레드 · 아마로네", 15, "베네토 발폴리첼라", "Bertani", 120000, "Corvina/Rondinella"],
    ["스페리 아마로네 산트 우르비노", "Speri Amarone Vigneto Monte Sant'Urbano", "레드 · 아마로네", 15.5, "베네토 발폴리첼라", "Speri", 80000, "Corvina/Rondinella"],
    ["마스트로베라르디노 타우라지 라디치", "Mastroberardino Taurasi Radici", "레드 · 타우라지", 13.5, "캄파니아", "Mastroberardino", 60000, "Aglianico"],
    ["타스카 달메리타 로쏘 델 콘테", "Tasca d'Almerita Rosso del Conte", "레드 · 시칠리아", 14, "시칠리아", "Tasca d'Almerita", 90000, "Nero d'Avola/Perricone"],
    ["돈나푸가타 밀레 에 우나 노테", "Donnafugata Mille e una Notte", "레드 · 시칠리아", 14, "시칠리아", "Donnafugata", 90000, "Nero d'Avola"],
    ["아르지올라스 투리가", "Argiolas Turriga", "레드 · 사르데냐", 14.5, "사르데냐", "Argiolas", 110000, "Cannonau/Carignano"],
  ]);
  W("redMed", "이탈리아", [
    ["알레그리니 라 그롤라", "Allegrini La Grola", "레드 · 베로나 IGT", 14, "베네토", "Allegrini", 40000, "Corvina/Syrah"],
    ["테데스키 아마로네", "Tedeschi Amarone della Valpolicella", "레드 · 아마로네", 16, "베네토 발폴리첼라", "Tedeschi", 70000, "Corvina/Rondinella"],
    ["쿠수마노 네로 다볼라", "Cusumano Nero d'Avola", "레드 · 시칠리아", 13.5, "시칠리아", "Cusumano", 20000, "Nero d'Avola"],
    ["페우디 디 산 그레고리오 루비칼레", "Feudi di San Gregorio Rubrato Aglianico", "레드 · 캄파니아", 13.5, "캄파니아", "Feudi di San Gregorio", 30000, "Aglianico"],
  ]);
  W("whiteCrisp", "이탈리아", [
    ["안티노리 체르바로 델라 살라", "Antinori Cervaro della Sala", "화이트 · 움브리아", 13, "움브리아", "Marchesi Antinori", 80000, "Chardonnay/Grechetto"],
    ["페우디 디 산 그레고리오 피아노 디 아벨리노", "Feudi di San Gregorio Fiano di Avellino", "화이트 · 캄파니아", 13, "캄파니아", "Feudi di San Gregorio", 35000, "Fiano"],
    ["페우디 디 산 그레고리오 그레코 디 투포", "Feudi di San Gregorio Greco di Tufo", "화이트 · 캄파니아", 13, "캄파니아", "Feudi di San Gregorio", 35000, "Greco"],
    ["플라네타 샤르도네", "Planeta Chardonnay", "화이트 · 시칠리아", 14, "시칠리아", "Planeta", 60000, "Chardonnay"],
    ["예르만 빈티지 투니나", "Jermann Vintage Tunina", "화이트 · 프리울리", 13.5, "프리울리", "Jermann", 80000, "Sauvignon Blanc/Chardonnay/Ribolla Gialla"],
    ["리비오 펠루가 테레 알테", "Livio Felluga Terre Alte", "화이트 · 프리울리", 13.5, "프리울리 콜리 오리엔탈리", "Livio Felluga", 85000, "Friulano/Pinot Bianco/Sauvignon Blanc"],
    ["엘레나 발흐 게뷔르츠트라미너", "Elena Walch Gewürztraminer", "화이트 · 알토 아디제", 14, "알토 아디제", "Elena Walch", 40000, "Gewürztraminer"],
    ["트라민 누스바우머", "Tramin Nussbaumer Gewürztraminer", "화이트 · 알토 아디제", 14.5, "알토 아디제", "Cantina Tramin", 60000, "Gewürztraminer"],
    ["돈나푸가타 벤 리예", "Donnafugata Ben Ryé Passito di Pantelleria", "스위트 · 파시토", 14.5, "시칠리아 판텔레리아", "Donnafugata", 70000, "Zibibbo"],
  ]);

  /* ── 스페인 · 포르투갈 ── */
  W("spanish", "스페인", [
    ["파고 데 카라오베하스 크리안자", "Pago de Carraovejas Crianza", "레드 · 리베라 델 두에로", 14.5, "리베라 델 두에로", "Pago de Carraovejas", 60000, "Tempranillo/Cabernet Sauvignon/Merlot"],
    ["알토", "Aalto", "레드 · 리베라 델 두에로", 14.5, "리베라 델 두에로", "Bodegas Aalto", 90000, "Tempranillo"],
    ["프로토스 크리안자", "Protos Crianza", "레드 · 리베라 델 두에로", 14, "리베라 델 두에로", "Bodegas Protos", 35000, "Tempranillo"],
    ["비냐 페드로사 크리안자", "Pérez Pascuas Viña Pedrosa Crianza", "레드 · 리베라 델 두에로", 14, "리베라 델 두에로", "Pérez Pascuas", 50000, "Tempranillo"],
    ["아시엔다 모나스테리오", "Hacienda Monasterio", "레드 · 리베라 델 두에로", 14.5, "리베라 델 두에로", "Hacienda Monasterio", 80000, "Tempranillo/Cabernet Sauvignon"],
    ["아바디아 레투에르타 셀렉시온 에스페시알", "Abadía Retuerta Selección Especial", "레드 · 카스티야 이 레온", 14.5, "사르돈 데 두에로", "Abadía Retuerta", 50000, "Tempranillo/Cabernet Sauvignon/Syrah"],
    ["마르케스 데 무리에타 레세르바", "Marqués de Murrieta Reserva", "레드 · 리오하 레세르바", 14, "리오하", "Marqués de Murrieta", 45000, "Tempranillo/Garnacha/Mazuelo/Graciano"],
    ["카스티요 이가이 그란 레세르바", "Castillo Ygay Gran Reserva Especial", "레드 · 리오하 그란 레세르바", 14, "리오하", "Marqués de Murrieta", 180000, "Tempranillo/Mazuelo"],
    ["로페스 데 에레디아 비냐 토돈디아 레세르바", "López de Heredia Viña Tondonia Reserva", "레드 · 리오하 레세르바", 13, "리오하", "R. López de Heredia", 70000, "Tempranillo/Garnacha/Graciano/Mazuelo"],
    ["로다 레세르바", "Roda Reserva", "레드 · 리오하 레세르바", 14, "리오하", "Bodegas Roda", 70000, "Tempranillo/Graciano"],
    ["아르타디 비냐스 데 가인", "Artadi Viñas de Gain", "레드 · 리오하", 14, "리오하 알라베사", "Artadi", 50000, "Tempranillo"],
    ["클로스 모가도르", "Clos Mogador", "레드 · 프리오랏", 14.5, "프리오랏", "René Barbier", 120000, "Garnacha/Cariñena/Syrah/Cabernet Sauvignon"],
    ["클로스 에라스무스", "Clos i Terrasses Clos Erasmus", "레드 · 프리오랏", 15, "프리오랏", "Clos i Terrasses", 300000, "Garnacha/Syrah"],
    ["데센디엔테스 데 J. 팔라시오스 페탈로스", "Descendientes de J. Palacios Pétalos", "레드 · 비에르소", 14, "비에르소", "Descendientes de J. Palacios", 40000, "Mencía"],
    ["토레스 마스 라 플라나", "Torres Mas La Plana", "레드 · 페네데스", 14.5, "페네데스", "Familia Torres", 80000, "Cabernet Sauvignon"],
    ["토레스 살모스", "Torres Salmos", "레드 · 프리오랏", 14.5, "프리오랏", "Familia Torres", 50000, "Cariñena/Garnacha/Syrah"],
    ["라몬 빌바오 크리안자", "Ramón Bilbao Crianza", "레드 · 리오하 크리안자", 14, "리오하", "Ramón Bilbao", 22000, "Tempranillo"],
    ["베로니아 레세르바", "Beronia Reserva", "레드 · 리오하 레세르바", 14, "리오하", "Bodegas Beronia", 30000, "Tempranillo/Graciano/Mazuelo"],
    ["몬테시요 레세르바", "Montecillo Reserva", "레드 · 리오하 레세르바", 13.5, "리오하", "Bodegas Montecillo", 25000, "Tempranillo"],
    ["엘 니도 클리오", "Bodegas El Nido Clio", "레드 · 후미야", 15.5, "후미야", "Bodegas El Nido", 70000, "Monastrell/Cabernet Sauvignon"],
    ["누만시아", "Numanthia", "레드 · 토로", 15, "토로", "Bodega Numanthia", 70000, "Tinta de Toro"],
    ["비냐 사스트레 크리안자", "Viña Sastre Crianza", "레드 · 리베라 델 두에로", 14.5, "리베라 델 두에로", "Bodegas Hermanos Sastre", 50000, "Tempranillo"],
    ["마우로", "Bodegas Mauro", "레드 · 카스티야 이 레온", 14.5, "투델라 데 두에로", "Bodegas Mauro", 70000, "Tempranillo/Syrah"],
  ]);
  W("whiteCrisp", "스페인", [
    ["파소 데 세뇨란스 알바리뇨", "Pazo de Señorans Albariño", "화이트 · 리아스 바이샤스", 12.5, "리아스 바이샤스", "Pazo de Señorans", 40000, "Albariño"],
    ["마르케스 데 리스칼 루에다 베르데호", "Marqués de Riscal Rueda Verdejo", "화이트 · 루에다", 13, "루에다", "Herederos del Marqués de Riscal", 18000, "Verdejo"],
    ["토레스 비냐 솔 로제", "Torres Viña Sol Rosé", "로제 · 카탈루냐", 12, "카탈루냐", "Familia Torres", 15000, "Garnacha/Cariñena"],
  ]);
  W("redFull", "포르투갈", [
    ["킨타 두 크라스투 레세르바", "Quinta do Crasto Reserva Old Vines", "레드 · 도우루", 14.5, "도우루", "Quinta do Crasto", 50000, "Touriga Nacional/Tinta Roriz"],
    ["킨타 두 발 메앙", "Quinta do Vale Meão", "레드 · 도우루", 14.5, "도우루", "F. Olazabal & Filhos", 150000, "Touriga Nacional/Touriga Franca"],
    ["바르카 벨랴", "Barca Velha", "레드 · 도우루", 14, "도우루", "Casa Ferreirinha", 900000, "Touriga Franca/Touriga Nacional/Tinta Roriz"],
    ["에스포랑 레세르바", "Esporão Reserva Tinto", "레드 · 알렌테주", 14.5, "알렌테주", "Herdade do Esporão", 35000, "Aragonez/Trincadeira/Cabernet Sauvignon"],
  ]);
  W("sweet", "포르투갈", [
    ["폰세카 빈 27", "Fonseca Bin 27 Reserve Port", "주정강화 · 루비 포트", 20, "도우루", "Fonseca", 35000, "Touriga Nacional/Touriga Franca"],
    ["다우스 파인 토니", "Dow's Fine Tawny Port", "주정강화 · 토니 포트", 19, "도우루", "Dow's (Symington)", 30000, "Touriga Nacional/Touriga Franca"],
    ["워스 오티마 10년 토니 포트", "Warre's Otima 10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, "도우루", "Warre's (Symington)", 45000, "Touriga Nacional/Touriga Franca"],
    ["니포트 10년 토니", "Niepoort 10 Year Old Tawny Port", "주정강화 · 토니 포트", 20, "도우루", "Niepoort", 60000, "Touriga Nacional/Tinta Roriz"],
    ["그라함 20년 토니", "Graham's 20 Year Old Tawny Port", "주정강화 · 토니 포트", 20, "도우루", "Graham's (Symington)", 100000, "Touriga Nacional/Touriga Franca"],
    ["테일러 20년 토니", "Taylor's 20 Year Old Tawny Port", "주정강화 · 토니 포트", 20, "도우루", "Taylor's", 100000, "Touriga Nacional/Touriga Franca"],
    ["테일러 LBV", "Taylor's Late Bottled Vintage Port", "주정강화 · LBV 포트", 20, "도우루", "Taylor's", 40000, "Touriga Nacional/Touriga Franca"],
    ["블랜디 5년 말름지", "Blandy's 5 Year Old Malmsey Madeira", "주정강화 · 마데이라", 19, "마데이라", "Blandy's", 50000, "Malvasia"],
  ]);

  /* ── 미국 ── */
  const CS = "Cabernet Sauvignon";
  W("redIcon", "미국", [
    ["릿지 몬테 벨로", "Ridge Monte Bello", "레드 · 산타 크루즈 마운틴", 13.5, "산타 크루즈 마운틴", "Ridge Vineyards", 350000, "Cabernet Sauvignon/Merlot"],
    ["셰이퍼 힐사이드 셀렉트", "Shafer Hillside Select Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, "나파 밸리 스택스 립", "Shafer Vineyards", 600000, CS],
    ["셰이퍼 원 포인트 파이브", "Shafer One Point Five Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, "나파 밸리 스택스 립", "Shafer Vineyards", 150000, CS],
    ["실버 오크 나파 밸리", "Silver Oak Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "나파 밸리", "Silver Oak Cellars", 180000, CS],
    ["케이머스 스페셜 셀렉션", "Caymus Special Selection Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, "나파 밸리", "Caymus Vineyards", 250000, CS],
    ["도미너스", "Dominus Estate", "레드 · 나파 블렌드", 14.5, "나파 밸리 욘트빌", "Christian Moueix", 400000, "Cabernet Sauvignon/Cabernet Franc/Petit Verdot"],
    ["나파눅", "Napanook (Dominus)", "레드 · 나파 블렌드", 14.5, "나파 밸리 욘트빌", "Christian Moueix", 120000, "Cabernet Sauvignon/Merlot"],
    ["퀸테사", "Quintessa", "레드 · 나파 블렌드", 14.5, "나파 밸리 러더포드", "Quintessa", 300000, "Cabernet Sauvignon/Merlot/Carmenère"],
    ["파 니엔테 까베르네 소비뇽", "Far Niente Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 오크빌", "Far Niente", 200000, CS],
    ["로버트 몬다비 리저브 까베르네", "Robert Mondavi Reserve To Kalon Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 오크빌", "Robert Mondavi", 250000, CS],
    ["보리유 조르주 드 라뚜르", "Beaulieu Vineyard Georges de Latour Private Reserve", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 러더포드", "Beaulieu Vineyard", 200000, CS],
    ["하이츠 마사스 빈야드", "Heitz Cellar Martha's Vineyard Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "나파 밸리 오크빌", "Heitz Cellar", 350000, CS],
    ["스팟츠우드", "Spottswoode Estate Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 세인트 헬레나", "Spottswoode", 350000, CS],
    ["스택스 립 캐스크 23", "Stag's Leap Wine Cellars Cask 23", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 스택스 립", "Stag's Leap Wine Cellars", 450000, CS],
    ["스택스 립 S.L.V.", "Stag's Leap Wine Cellars S.L.V. Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 스택스 립", "Stag's Leap Wine Cellars", 250000, CS],
    ["퀼세다 크릭", "Quilceda Creek Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15, "워싱턴 컬럼비아 밸리", "Quilceda Creek", 350000, CS],
    ["코스타 브라운 소노마 코스트", "Kosta Browne Sonoma Coast Pinot Noir", "레드 · 피노 누아", 14, "소노마 코스트", "Kosta Browne", 150000, "Pinot Noir"],
  ]);
  W("redFull", "미국", [
    ["릿지 가이저빌", "Ridge Geyserville", "레드 · 진판델 블렌드", 14.5, "소노마 알렉산더 밸리", "Ridge Vineyards", 70000, "Zinfandel/Carignan/Petite Sirah"],
    ["니켈 앤 니켈 까베르네", "Nickel & Nickel State Ranch Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 욘트빌", "Nickel & Nickel", 150000, CS],
    ["케이크브레드 까베르네 소비뇽", "Cakebread Cellars Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리", "Cakebread Cellars", 130000, CS],
    ["보리유 러더포드", "Beaulieu Vineyard Rutherford Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리 러더포드", "Beaulieu Vineyard", 70000, CS],
    ["조셉 펠프스 나파 까베르네", "Joseph Phelps Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리", "Joseph Phelps", 130000, CS],
    ["프로그스 립 까베르네", "Frog's Leap Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "나파 밸리 러더포드", "Frog's Leap", 90000, CS],
    ["오린 스위프트 앱스트랙트", "Orin Swift Abstract", "레드 · 블렌드", 15.5, "캘리포니아", "Orin Swift", 60000, "Grenache/Petite Sirah/Syrah"],
    ["오린 스위프트 8 이어스 인 더 데저트", "Orin Swift 8 Years in the Desert", "레드 · 진판델 블렌드", 15.5, "캘리포니아", "Orin Swift", 70000, "Zinfandel/Petite Sirah/Syrah"],
    ["오린 스위프트 파피용", "Orin Swift Papillon", "레드 · 보르도 블렌드", 15.5, "나파 밸리", "Orin Swift", 100000, "Cabernet Sauvignon/Merlot/Petit Verdot"],
    ["오린 스위프트 머큐리 헤드", "Orin Swift Mercury Head Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 15.5, "나파 밸리", "Orin Swift", 200000, CS],
    ["에듀케이티드 게스 까베르네", "Educated Guess Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "나파 밸리", "Roots Run Deep", 50000, CS],
    ["다오 까베르네 소비뇽", "DAOU Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "파소 로블스", "DAOU Vineyards", 45000, CS],
    ["저스틴 아이소셀레스", "Justin Isosceles", "레드 · 보르도 블렌드", 15, "파소 로블스", "Justin Vineyards", 110000, "Cabernet Sauvignon/Cabernet Franc/Merlot"],
    ["저스틴 까베르네 소비뇽", "Justin Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "파소 로블스", "Justin Vineyards", 45000, CS],
    ["제이 로어 세븐 오크스", "J. Lohr Seven Oaks Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.9, "파소 로블스", "J. Lohr", 30000, CS],
    ["루이 M. 마르티니 소노마 까베르네", "Louis M. Martini Sonoma County Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "소노마 카운티", "Louis M. Martini", 30000, CS],
    ["로드니 스트롱 소노마 까베르네", "Rodney Strong Sonoma County Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "소노마 카운티", "Rodney Strong", 30000, CS],
    ["스털링 나파 밸리 까베르네", "Sterling Vineyards Napa Valley Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "나파 밸리", "Sterling Vineyards", 45000, CS],
    ["보리유 BV 캘리포니아 까베르네", "BV Coastal Estates Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "캘리포니아", "Beaulieu Vineyard", 18000, CS],
    ["컬럼비아 크레스트 그랜드 에스테이트 까베르네", "Columbia Crest Grand Estates Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "워싱턴 컬럼비아 밸리", "Columbia Crest", 20000, CS],
    ["컬럼비아 크레스트 그랜드 에스테이트 메를로", "Columbia Crest Grand Estates Merlot", "레드 · 메를로", 13.5, "워싱턴 컬럼비아 밸리", "Columbia Crest", 20000, "Merlot"],
  ]);
  W("pinot", "미국", [
    ["플라워스 소노마 코스트 피노 누아", "Flowers Sonoma Coast Pinot Noir", "레드 · 피노 누아", 13.5, "소노마 코스트", "Flowers Vineyards", 80000, "Pinot Noir"],
    ["윌리엄스 셀리엄 소노마 코스트", "Williams Selyem Sonoma Coast Pinot Noir", "레드 · 피노 누아", 14, "소노마 코스트", "Williams Selyem", 130000, "Pinot Noir"],
    ["씨 스모크 사우스우잉", "Sea Smoke Southing Pinot Noir", "레드 · 피노 누아", 14.5, "산타 리타 힐스", "Sea Smoke", 150000, "Pinot Noir"],
    ["오 봉 클리마 산타 바바라 피노 누아", "Au Bon Climat Santa Barbara County Pinot Noir", "레드 · 피노 누아", 13.5, "산타 바바라", "Au Bon Climat", 45000, "Pinot Noir"],
    ["도멘 세렌 에벤스타드 리저브", "Domaine Serene Evenstad Reserve Pinot Noir", "레드 · 피노 누아", 14, "오리건 윌래밋 밸리", "Domaine Serene", 120000, "Pinot Noir"],
    ["도멘 드루앵 오리건 피노 누아", "Domaine Drouhin Oregon Dundee Hills Pinot Noir", "레드 · 피노 누아", 14, "오리건 던디 힐스", "Domaine Drouhin Oregon", 80000, "Pinot Noir"],
    ["에라스 오리건 피노 누아", "Erath Oregon Pinot Noir", "레드 · 피노 누아", 13.5, "오리건", "Erath Winery", 30000, "Pinot Noir"],
    ["클라우드라인 피노 누아", "Cloudline Willamette Valley Pinot Noir", "레드 · 피노 누아", 13.5, "오리건 윌래밋 밸리", "Cloudline Cellars", 40000, "Pinot Noir"],
    ["페너 애쉬 윌래밋 밸리 피노 누아", "Penner-Ash Willamette Valley Pinot Noir", "레드 · 피노 누아", 14, "오리건 윌래밋 밸리", "Penner-Ash Wine Cellars", 80000, "Pinot Noir"],
  ]);
  W("whiteCrisp", "미국", [
    ["파 니엔테 샤르도네", "Far Niente Estate Chardonnay", "화이트 · 샤르도네", 14.5, "나파 밸리", "Far Niente", 110000, "Chardonnay"],
    ["키슬러 레 누아제티에", "Kistler Les Noisetiers Chardonnay", "화이트 · 샤르도네", 14, "소노마 코스트", "Kistler Vineyards", 120000, "Chardonnay"],
    ["레이미 러시안 리버 샤르도네", "Ramey Russian River Valley Chardonnay", "화이트 · 샤르도네", 14.5, "러시안 리버 밸리", "Ramey Wine Cellars", 70000, "Chardonnay"],
    ["로버트 몬다비 퓌메 블랑", "Robert Mondavi Napa Valley Fumé Blanc", "화이트 · 소비뇽 블랑", 14, "나파 밸리", "Robert Mondavi", 35000, "Sauvignon Blanc"],
    ["본테라 샤르도네", "Bonterra Chardonnay", "화이트 · 샤르도네 (유기농)", 13.5, "캘리포니아 멘도시노", "Bonterra Organic Estates", 22000, "Chardonnay"],
    ["컬럼비아 크레스트 그랜드 에스테이트 샤르도네", "Columbia Crest Grand Estates Chardonnay", "화이트 · 샤르도네", 13.5, "워싱턴 컬럼비아 밸리", "Columbia Crest", 20000, "Chardonnay"],
  ]);

  /* ── 칠레 · 아르헨티나 (개별 + 라인) ── */
  W("redIcon", "칠레", [
    ["클로 아팔타", "Clos Apalta", "레드 · 콜차구아 블렌드", 15, "콜차구아 아팔타", "Lapostolle", 200000, "Carmenère/Cabernet Sauvignon/Merlot"],
    ["비녜도 채드윅", "Viñedo Chadwick", "레드 · 까베르네 소비뇽", 14, "마이포 푸엔테 알토", "Viña Errázuriz (Chadwick)", 450000, CS],
    ["코얌", "Emiliana Coyam", "레드 · 블렌드 (유기농)", 14.5, "콜차구아", "Emiliana Organic Vineyards", 40000, "Syrah/Carmenère/Merlot/Cabernet Sauvignon"],
    ["에라주리즈 카이", "Errázuriz Kai Carmenère", "레드 · 까르메네르", 14.5, "아콩카구아", "Viña Errázuriz", 130000, "Carmenère"],
    ["에라주리즈 라 쿰브레", "Errázuriz La Cumbre Syrah", "레드 · 시라", 14.5, "아콩카구아", "Viña Errázuriz", 110000, "Syrah"],
    ["산타 리타 카사 레알", "Santa Rita Casa Real Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "마이포 알토", "Viña Santa Rita", 130000, CS],
    ["콘차이토로 그라바스 델 마이포", "Concha y Toro Gravas del Maipo Syrah", "레드 · 시라", 14.5, "마이포", "Concha y Toro", 100000, "Syrah"],
    ["몬테스 타이타", "Montes Taita", "레드 · 까베르네 소비뇽", 14.5, "콜차구아 마르치구에", "Viña Montes", 350000, CS],
  ]);
  WSX("칠레", [
    ["라포스톨 그랑 셀렉시옹", "Lapostolle Grand Selection", "Lapostolle", "라펠 밸리", 14, 22000, "CS ME CA CH SB"],
    ["산타 리타 메달라 레알", "Santa Rita Medalla Real", "Viña Santa Rita", "마이포", 14, 30000, "CS CA CH SB"],
    ["까르멘 그란 레세르바", "Carmen Gran Reserva", "Viña Carmen", "마이포", 14, 25000, "CS CA CH"],
    ["비냐 레이다 싱글 빈야드", "Viña Leyda Single Vineyard", "Viña Leyda", "레이다 밸리", 13.5, 32000, "PN SB CH"],
    ["벤티스케로 그레이", "Ventisquero Grey Glacier", "Viña Ventisquero", "센트럴 밸리", 14, 35000, "CA CS PN CH SB"],
    ["비우 마넨트 레세르바", "Viu Manent Reserva", "Viu Manent", "콜차구아", 13.5, 18000, "MA CS CA CH"],
    ["몬그라스 레세르바", "MontGras Reserva", "Viña MontGras", "콜차구아", 13.5, 15000, "CS CA ME"],
    ["베라몬테 레세르바", "Veramonte Reserva", "Veramonte", "카사블랑카", 13.5, 18000, "SB CH PN CS"],
  ]);
  W("redFull", "아르헨티나", [
    ["카테나 자파타 아드리아나 빈야드", "Catena Zapata Adrianna Vineyard River Stones Malbec", "레드 · 말벡", 13.5, "멘도사 구알타야리", "Bodega Catena Zapata", 350000, "Malbec"],
    ["카테나 자파타 말벡 아르헨티노", "Catena Zapata Malbec Argentino", "레드 · 말벡", 13.5, "멘도사", "Bodega Catena Zapata", 180000, "Malbec"],
    ["엘 에네미고 말벡", "El Enemigo Malbec", "레드 · 말벡", 14, "멘도사", "Aleanna", 45000, "Malbec/Cabernet Franc"],
    ["아차발 페레르 말벡", "Achaval Ferrer Malbec", "레드 · 말벡", 14.5, "멘도사", "Achaval Ferrer", 40000, "Malbec"],
    ["수카르디 발레 데 우코 Q", "Zuccardi Q Malbec", "레드 · 말벡", 14, "멘도사 우코 밸리", "Familia Zuccardi", 45000, "Malbec"],
    ["수카르디 콘크레토", "Zuccardi Concreto Malbec", "레드 · 말벡", 13.5, "멘도사 우코 밸리", "Familia Zuccardi", 90000, "Malbec"],
    ["루이지 보스카 말벡", "Luigi Bosca Malbec", "레드 · 말벡", 14, "멘도사", "Luigi Bosca", 30000, "Malbec"],
    ["루티니 말벡", "Rutini Malbec", "레드 · 말벡", 14, "멘도사 우코 밸리", "Rutini Wines", 45000, "Malbec"],
    ["살렌테인 레세르바 말벡", "Salentein Reserve Malbec", "레드 · 말벡", 14, "멘도사 우코 밸리", "Bodegas Salentein", 30000, "Malbec"],
    ["클로 데 로스 시에테", "Clos de los Siete", "레드 · 블렌드", 14.5, "멘도사 우코 밸리", "Clos de los Siete", 35000, "Malbec/Merlot/Syrah/Cabernet Sauvignon"],
    ["보데가 콜로메 말벡", "Bodega Colomé Estate Malbec", "레드 · 말벡", 14.5, "살타 칼차키 밸리", "Bodega Colomé", 40000, "Malbec"],
    ["수사나 발보 시그니처 말벡", "Susana Balbo Signature Malbec", "레드 · 말벡", 14, "멘도사", "Susana Balbo Wines", 40000, "Malbec"],
    ["알토스 라스 오르미가스 말벡", "Altos Las Hormigas Malbec Clásico", "레드 · 말벡", 13.5, "멘도사", "Altos Las Hormigas", 22000, "Malbec"],
  ]);
  WSX("아르헨티나", [
    ["트리벤토 레세르브", "Trivento Reserve", "Trivento", "멘도사", 13.5, 13000, "MA CS CH"],
    ["카이켄", "Kaiken", "Kaiken (Viña Montes)", "멘도사", 14, 20000, "MA CS"],
  ]);

  /* ── 호주 · 뉴질랜드 ── */
  W("redIcon", "호주", [
    ["펜폴즈 야타나", "Penfolds Yattarna Chardonnay", "화이트 · 샤르도네", 13, "남호주·태즈메이니아", "Penfolds", 250000, "Chardonnay"],
    ["펜폴즈 RWT", "Penfolds RWT Bin 798 Shiraz", "레드 · 쉬라즈", 14.5, "바로사 밸리", "Penfolds", 300000, "Shiraz"],
    ["펜폴즈 마길 이스테이트", "Penfolds Magill Estate Shiraz", "레드 · 쉬라즈", 14.5, "애들레이드", "Penfolds", 200000, "Shiraz"],
    ["펜폴즈 빈 707", "Penfolds Bin 707 Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14.5, "사우스 오스트레일리아", "Penfolds", 700000, CS],
    ["헨쉬키 마운트 에델스톤", "Henschke Mount Edelstone Shiraz", "레드 · 쉬라즈", 14.5, "에덴 밸리", "Henschke", 250000, "Shiraz"],
    ["토브렉 런리그", "Torbreck RunRig", "레드 · 쉬라즈 비오니에", 15, "바로사 밸리", "Torbreck", 300000, "Shiraz/Viognier"],
    ["더 데드 암", "d'Arenberg The Dead Arm Shiraz", "레드 · 쉬라즈", 14.5, "맥라렌 베일", "d'Arenberg", 80000, "Shiraz"],
    ["르윈 아트 시리즈 샤르도네", "Leeuwin Estate Art Series Chardonnay", "화이트 · 샤르도네", 14, "마거릿 리버", "Leeuwin Estate", 150000, "Chardonnay"],
    ["컬런 다이애나 매들린", "Cullen Diana Madeline", "레드 · 보르도 블렌드", 13.5, "마거릿 리버", "Cullen Wines", 150000, "Cabernet Sauvignon/Merlot"],
    ["록포드 바스켓 프레스", "Rockford Basket Press Shiraz", "레드 · 쉬라즈", 14.5, "바로사 밸리", "Rockford", 120000, "Shiraz"],
    ["클로나킬라 쉬라즈 비오니에", "Clonakilla Shiraz Viognier", "레드 · 쉬라즈 비오니에", 13.5, "캔버라 디스트릭트", "Clonakilla", 130000, "Shiraz/Viognier"],
    ["윈스 블랙 라벨", "Wynns Coonawarra Estate Black Label Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 13.5, "쿠나와라", "Wynns", 60000, CS],
    ["피터 레만 스톤웰", "Peter Lehmann Stonewell Shiraz", "레드 · 쉬라즈", 14.5, "바로사 밸리", "Peter Lehmann", 100000, "Shiraz"],
    ["얄룸바 시그니처", "Yalumba The Signature Cabernet Shiraz", "레드 · 블렌드", 14, "바로사", "Yalumba", 90000, "Cabernet Sauvignon/Shiraz"],
  ]);
  W("redFull", "호주", [
    ["펜폴즈 빈 2", "Penfolds Bin 2 Shiraz Mataro", "레드 · 쉬라즈 마타로", 14.5, "사우스 오스트레일리아", "Penfolds", 35000, "Shiraz/Mataro"],
    ["펜폴즈 빈 138", "Penfolds Bin 138 Grenache Shiraz Mataro", "레드 · GSM", 14.5, "바로사 밸리", "Penfolds", 55000, "Grenache/Shiraz/Mataro"],
    ["펜폴즈 빈 150", "Penfolds Bin 150 Marananga Shiraz", "레드 · 쉬라즈", 14.5, "바로사 밸리", "Penfolds", 90000, "Shiraz"],
    ["토브렉 더 스트루이", "Torbreck The Struie Shiraz", "레드 · 쉬라즈", 15, "바로사", "Torbreck", 80000, "Shiraz"],
    ["다렌버그 풋볼트", "d'Arenberg The Footbolt Shiraz", "레드 · 쉬라즈", 14.5, "맥라렌 베일", "d'Arenberg", 30000, "Shiraz"],
    ["바세 펠릭스 필로우 까베르네", "Vasse Felix Filius Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "마거릿 리버", "Vasse Felix", 35000, CS],
    ["모스 우드 까베르네", "Moss Wood Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "마거릿 리버", "Moss Wood", 150000, CS],
    ["얄룸바 Y 시리즈 쉬라즈", "Yalumba Y Series Shiraz", "레드 · 쉬라즈", 14, "사우스 오스트레일리아", "Yalumba", 18000, "Shiraz"],
    ["그랜트 버지 필셀 쉬라즈", "Grant Burge Filsell Old Vine Shiraz", "레드 · 쉬라즈", 14.5, "바로사 밸리", "Grant Burge", 40000, "Shiraz"],
    ["세인트 할렛 올드 블록", "St Hallett Old Block Shiraz", "레드 · 쉬라즈", 14.5, "바로사", "St Hallett", 90000, "Shiraz"],
    ["케이프 멘텔 까베르네", "Cape Mentelle Cabernet Sauvignon", "레드 · 까베르네 소비뇽", 14, "마거릿 리버", "Cape Mentelle", 70000, CS],
    ["브로큰우드 그레이브야드", "Brokenwood Graveyard Vineyard Shiraz", "레드 · 쉬라즈", 13.5, "헌터 밸리", "Brokenwood", 180000, "Shiraz"],
  ]);
  W("whiteCrisp", "호주", [
    ["펜폴즈 빈 311 샤르도네", "Penfolds Bin 311 Chardonnay", "화이트 · 샤르도네", 13, "남호주·태즈메이니아", "Penfolds", 55000, "Chardonnay"],
    ["펜폴즈 빈 51 리슬링", "Penfolds Bin 51 Eden Valley Riesling", "화이트 · 리슬링", 11.5, "에덴 밸리", "Penfolds", 40000, "Riesling"],
    ["티렐스 바트 1 세미용", "Tyrrell's Vat 1 Hunter Semillon", "화이트 · 세미용", 10.5, "헌터 밸리", "Tyrrell's", 80000, "Semillon"],
    ["쇼 앤 스미스 소비뇽 블랑", "Shaw + Smith Sauvignon Blanc", "화이트 · 소비뇽 블랑", 12.5, "애들레이드 힐스", "Shaw + Smith", 40000, "Sauvignon Blanc"],
    ["데블스 레어 샤르도네", "Devil's Lair Chardonnay", "화이트 · 샤르도네", 13, "마거릿 리버", "Devil's Lair", 50000, "Chardonnay"],
    ["자이언트 스텝스 야라 밸리 샤르도네", "Giant Steps Yarra Valley Chardonnay", "화이트 · 샤르도네", 13, "야라 밸리", "Giant Steps", 50000, "Chardonnay"],
    ["예링 스테이션 샤르도네", "Yering Station Chardonnay", "화이트 · 샤르도네", 13, "야라 밸리", "Yering Station", 30000, "Chardonnay"],
  ]);
  W("sweet", "호주", [["드 보르톨리 노블 원", "De Bortoli Noble One Botrytis Semillon", "스위트 · 귀부 세미용", 10, "리버리나", "De Bortoli", 45000, "Semillon"]]);
  W("whiteCrisp", "뉴질랜드", [
    ["독 포인트 소비뇽 블랑", "Dog Point Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Dog Point Vineyard", 35000, "Sauvignon Blanc"],
    ["그레이와케 소비뇽 블랑", "Greywacke Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13.5, "말보로", "Greywacke", 40000, "Sauvignon Blanc"],
    ["머드 하우스 소비뇽 블랑", "Mud House Sauvignon Blanc", "화이트 · 소비뇽 블랑", 12.5, "말보로", "Mud House", 20000, "Sauvignon Blanc"],
    ["브랑코트 이스테이트 소비뇽 블랑", "Brancott Estate Marlborough Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Brancott Estate", 20000, "Sauvignon Blanc"],
    ["화이트헤이븐 소비뇽 블랑", "Whitehaven Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Whitehaven", 25000, "Sauvignon Blanc"],
    ["노틸러스 소비뇽 블랑", "Nautilus Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Nautilus Estate", 35000, "Sauvignon Blanc"],
    ["스파이 밸리 소비뇽 블랑", "Spy Valley Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Spy Valley", 28000, "Sauvignon Blanc"],
    ["위더 힐스 소비뇽 블랑", "Wither Hills Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Wither Hills", 22000, "Sauvignon Blanc"],
    ["바비치 소비뇽 블랑", "Babich Marlborough Sauvignon Blanc", "화이트 · 소비뇽 블랑", 12.5, "말보로", "Babich Wines", 20000, "Sauvignon Blanc"],
    ["세레신 소비뇽 블랑", "Seresin Sauvignon Blanc", "화이트 · 소비뇽 블랑", 13, "말보로", "Seresin Estate", 40000, "Sauvignon Blanc"],
  ]);
  W("pinot", "뉴질랜드", [
    ["크래기 레인지 테 무나 피노 누아", "Craggy Range Te Muna Pinot Noir", "레드 · 피노 누아", 13.5, "마틴버러", "Craggy Range", 60000, "Pinot Noir"],
    ["아타 랑이 피노 누아", "Ata Rangi Pinot Noir", "레드 · 피노 누아", 13.5, "마틴버러", "Ata Rangi", 110000, "Pinot Noir"],
    ["펠튼 로드 블록 5", "Felton Road Block 5 Pinot Noir", "레드 · 피노 누아", 14, "센트럴 오타고", "Felton Road", 140000, "Pinot Noir"],
    ["그레이와케 피노 누아", "Greywacke Pinot Noir", "레드 · 피노 누아", 14, "말보로", "Greywacke", 60000, "Pinot Noir"],
  ]);
  W("redFull", "뉴질랜드", [["테 마타 콜레인", "Te Mata Coleraine", "레드 · 보르도 블렌드", 13.5, "호크스 베이", "Te Mata Estate", 120000, "Cabernet Sauvignon/Merlot/Cabernet Franc"]]);

  /* ── 독일 · 오스트리아 · 기타 ── */
  W("whiteCrisp", "독일", [
    ["에곤 뮐러 샤르츠호프베르거 카비넷", "Egon Müller Scharzhofberger Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, "모젤 자르", "Egon Müller", 250000, "Riesling"],
    ["에곤 뮐러 샤르츠호프베르거 슈페트레제", "Egon Müller Scharzhofberger Riesling Spätlese", "화이트 · 리슬링 슈페트레제", 8, "모젤 자르", "Egon Müller", 450000, "Riesling"],
    ["J.J. 프륌 벨레너 조넨우어 카비넷", "J.J. Prüm Wehlener Sonnenuhr Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, "모젤", "Joh. Jos. Prüm", 80000, "Riesling"],
    ["J.J. 프륌 벨레너 조넨우어 슈페트레제", "J.J. Prüm Wehlener Sonnenuhr Riesling Spätlese", "화이트 · 리슬링 슈페트레제", 8, "모젤", "Joh. Jos. Prüm", 110000, "Riesling"],
    ["닥터 루젠 에르데너 트렙헨 카비넷", "Dr. Loosen Erdener Treppchen Riesling Kabinett", "화이트 · 리슬링 카비넷", 8.5, "모젤", "Weingut Dr. Loosen", 45000, "Riesling"],
    ["로베르트 바일 키드리히 그레펜베르크", "Robert Weil Kiedrich Gräfenberg Riesling", "화이트 · 리슬링", 12.5, "라인가우", "Weingut Robert Weil", 200000, "Riesling"],
    ["로베르트 바일 리슬링 트로켄", "Robert Weil Riesling Trocken", "화이트 · 리슬링", 12, "라인가우", "Weingut Robert Weil", 45000, "Riesling"],
    ["슐로스 폴라즈 리슬링 카비넷", "Schloss Vollrads Riesling Kabinett", "화이트 · 리슬링 카비넷", 10, "라인가우", "Schloss Vollrads", 40000, "Riesling"],
    ["프리츠 하그 리슬링", "Fritz Haag Brauneberger Juffer Riesling Kabinett", "화이트 · 리슬링 카비넷", 8, "모젤", "Weingut Fritz Haag", 55000, "Riesling"],
    ["되른호프 리슬링 트로켄", "Dönnhoff Riesling Trocken", "화이트 · 리슬링", 12, "나에", "Weingut Dönnhoff", 45000, "Riesling"],
    ["켈러 리슬링 폰 데어 펠스", "Keller Riesling von der Fels", "화이트 · 리슬링", 12.5, "라인헤센", "Weingut Keller", 90000, "Riesling"],
    ["마르쿠스 몰리토르 리슬링", "Markus Molitor Haus Klosterberg Riesling", "화이트 · 리슬링", 11.5, "모젤", "Markus Molitor", 40000, "Riesling"],
    ["셀바흐 오스터 리슬링 카비넷", "Selbach-Oster Zeltinger Sonnenuhr Riesling Kabinett", "화이트 · 리슬링 카비넷", 8.5, "모젤", "Selbach-Oster", 45000, "Riesling"],
    ["군더로흐 레드 슬레이트 리슬링", "Gunderloch Red Slate Riesling Trocken", "화이트 · 리슬링", 12, "라인헤센", "Weingut Gunderloch", 35000, "Riesling"],
  ]);
  W("whiteCrisp", "오스트리아", [
    ["F.X. 피클러 그뤼너 펠트리너 스마라그드", "F.X. Pichler Grüner Veltliner Smaragd", "화이트 · 그뤼너 펠트리너", 13.5, "바하우", "F.X. Pichler", 110000, "Grüner Veltliner"],
    ["크놀 그뤼너 펠트리너 페더슈필", "Knoll Grüner Veltliner Federspiel", "화이트 · 그뤼너 펠트리너", 12.5, "바하우", "Weingut Knoll", 60000, "Grüner Veltliner"],
    ["브륀들마이어 그뤼너 펠트리너", "Bründlmayer Kamptaler Terrassen Grüner Veltliner", "화이트 · 그뤼너 펠트리너", 12.5, "캄프탈", "Weingut Bründlmayer", 45000, "Grüner Veltliner"],
    ["도메네 바하우 그뤼너 펠트리너", "Domäne Wachau Grüner Veltliner Federspiel Terrassen", "화이트 · 그뤼너 펠트리너", 12.5, "바하우", "Domäne Wachau", 30000, "Grüner Veltliner"],
  ]);
  W("sweet", "헝가리", [
    ["오레무스 토카이 아수 5 푸토뇨스", "Oremus Tokaji Aszú 5 Puttonyos", "스위트 · 토카이 귀부", 11, "토카이", "Tokaj Oremus (Vega Sicilia)", 100000, "Furmint/Hárslevelű"],
    ["디즈노코 토카이 아수 5 푸토뇨스", "Disznókő Tokaji Aszú 5 Puttonyos", "스위트 · 토카이 귀부", 12, "토카이", "Disznókő", 80000, "Furmint"],
  ]);
  W("redFull", "남아프리카공화국", [
    ["미얼러스트 루비콘", "Meerlust Rubicon", "레드 · 보르도 블렌드", 14.5, "스텔렌보스", "Meerlust Estate", 70000, "Cabernet Sauvignon/Merlot/Cabernet Franc"],
    ["카논콥 폴 소어", "Kanonkop Paul Sauer", "레드 · 보르도 블렌드", 14.5, "스텔렌보스", "Kanonkop", 100000, "Cabernet Sauvignon/Cabernet Franc/Merlot"],
    ["북켄후츠클루프 시라", "Boekenhoutskloof Syrah", "레드 · 시라", 14, "프란슈후크", "Boekenhoutskloof", 80000, "Syrah"],
    ["새디 패밀리 콜루멜라", "Sadie Family Columella", "레드 · 스와틀랜드 블렌드", 13.5, "스와틀랜드", "Sadie Family Wines", 200000, "Syrah/Mourvèdre/Grenache"],
  ]);
  W("sweet", "남아프리카공화국", [["클라인 콘스탄시아 뱅 드 콘스탄스", "Klein Constantia Vin de Constance", "스위트 · 내추럴 스위트", 14, "콘스탄시아", "Klein Constantia", 120000, "Muscat de Frontignan"]]);
  W("redFull", "레바논", [["샤또 뮈자르", "Château Musar Rouge", "레드 · 베카 밸리", 14, "베카 밸리", "Château Musar", 80000, "Cabernet Sauvignon/Cinsault/Carignan"]]);
  W("whiteCrisp", "그리스", [["산토 와인즈 아시르티코", "Santo Wines Assyrtiko", "화이트 · 산토리니", 13.5, "산토리니", "Santo Wines", 40000, "Assyrtiko"]]);
  W("whiteCrisp", "일본", [["그레이스 고슈", "Grace Koshu|グレイス甲州", "화이트 · 고슈", 11.5, "야마나시", "中央葡萄酒 (Grace Wine)", 45000, "Koshu"]]);

  /* 라인 확장 도우미 (칠레·아르헨티나) — 1번 파일의 품종 코드 재사용 */
  function WSX(country, list) {
    const G = { CS: ["까베르네 소비뇽", "Cabernet Sauvignon", "레드"], ME: ["메를로", "Merlot", "레드"], PN: ["피노 누아", "Pinot Noir", "레드"], MA: ["말벡", "Malbec", "레드"],
      CA: ["까르메네르", "Carmenère", "레드"], CH: ["샤르도네", "Chardonnay", "화이트"], SB: ["소비뇽 블랑", "Sauvignon Blanc", "화이트"] };
    list.forEach(([ko, en, producer, region, abv, krw, codes]) => codes.split(" ").forEach((c) => {
      const [gk, ge, color] = G[c];
      rows("wine", c === "PN" ? "pinot" : color === "레드" ? "redFull" : "whiteCrisp", [[`${ko} ${gk}`, `${en} ${ge}`, `${color} · ${gk}`, abv, country, region, producer, krw, ge]]);
    }));
  }
})();
