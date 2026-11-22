/* 술사전 — 유명 와인 점수(참고용 근사치)
 * 최근 빈티지 기준 '통상 범위'(Robert Parker·Wine Spectator, 100점)와 Vivino 사용자 평균(5점) 근사.
 * 정확한 빈티지별 점수는 출처 링크 또는 '실시간 점수 불러오기'(Google 검색 키 필요)로 확인.
 * 형식: 영문명 → [RP, WS, Vivino]
 */
(() => {
  const S = {
    "Château Lynch-Bages": ["93–97", "92–96", "4.4"], "Château Pontet-Canet": ["94–99", "93–97", "4.4"], "Château Pichon Baron": ["94–98", "93–97", "4.5"],
    "Château Pichon Longueville Comtesse de Lalande": ["94–99", "93–97", "4.5"], "Château Cos d'Estournel": ["94–99", "93–97", "4.5"], "Château Montrose": ["94–100", "93–98", "4.5"],
    "Château Palmer": ["95–99", "94–98", "4.5"], "Château Léoville Las Cases": ["95–100", "94–98", "4.5"], "Château Ducru-Beaucaillou": ["94–99", "93–97", "4.5"],
    "Château Léoville Barton": ["92–97", "92–96", "4.3"], "Château Gruaud Larose": ["91–95", "91–95", "4.2"], "Château Lagrange (Saint-Julien)": ["90–94", "90–93", "4.1"],
    "Château Beychevelle": ["91–95", "91–94", "4.2"], "Château Calon-Ségur": ["93–98", "92–96", "4.4"], "Château Giscours": ["90–94", "90–93", "4.1"],
    "Château Cantemerle": ["89–92", "88–91", "3.9"], "Château Grand-Puy-Lacoste": ["92–96", "91–95", "4.3"], "Château Batailley": ["89–92", "88–91", "4.0"],
    "Château d'Armailhac": ["89–93", "89–92", "4.1"], "Château Clerc Milon": ["91–95", "90–94", "4.2"], "Château Duhart-Milon": ["91–95", "90–94", "4.2"],
    "Carruades de Lafite": ["92–95", "91–94", "4.4"], "Le Petit Mouton de Mouton Rothschild": ["93–96", "92–95", "4.4"], "Les Forts de Latour": ["93–97", "92–95", "4.4"],
    "Pavillon Rouge du Château Margaux": ["93–96", "92–95", "4.4"], "Le Clarence de Haut-Brion": ["92–95", "91–94", "4.3"], "Château Smith Haut Lafitte Rouge": ["94–98", "92–96", "4.4"],
    "Château Pape Clément Rouge": ["93–97", "92–95", "4.3"], "Château Angélus": ["95–99", "94–98", "4.6"], "Château Ausone": ["96–100", "95–99", "4.6"],
    "Château Figeac": ["95–100", "94–98", "4.5"], "Château Pavie": ["95–100", "93–97", "4.5"], "Château L'Évangile": ["94–98", "93–97", "4.5"], "Le Pin": ["95–100", "94–98", "4.7"],
    "Overture by Opus One": ["91–94", null, "4.3"], "Screaming Eagle Cabernet Sauvignon": ["97–100", null, "4.7"], "Harlan Estate": ["97–100", "95–99", "4.7"],
    "Joseph Phelps Insignia": ["94–99", "94–98", "4.6"], "Stag's Leap Wine Cellars Artemis Cabernet Sauvignon": ["90–93", "90–93", "4.1"], "Chateau Montelena Chardonnay": ["91–94", "91–94", "4.1"],
    "Penfolds Bin 407 Cabernet Sauvignon": ["92–95", null, "4.3"], "Penfolds Bin 28 Kalimna Shiraz": ["90–94", null, "4.1"], "Penfolds Bin 128 Coonawarra Shiraz": ["90–93", null, "4.0"],
    "Penfolds St Henri Shiraz": ["94–97", null, "4.4"], "Henschke Hill of Grace": ["96–99", null, "4.6"], "Guado al Tasso (Antinori)": ["94–97", "92–96", "4.4"],
    "Solaia (Antinori)": ["96–100", "95–98", "4.6"], "Masseto": ["97–100", "96–99", "4.7"], "Vega Sicilia Valbuena 5°": ["94–97", null, "4.4"], "Dominio de Pingus": ["97–100", null, "4.6"], "Alión": ["93–96", null, "4.3"],
    "Château Rauzan-Ségla": ["93–97", "92–96", "4.3"], "Château Rauzan-Gassies": ["89–92", "88–91", "4.0"], "Château Léoville Poyferré": ["93–98", "92–96", "4.3"],
    "Château Durfort-Vivens": ["91–95", "91–94", "4.1"], "Château Lascombes": ["91–95", "91–94", "4.2"], "Château Brane-Cantenac": ["92–95", "91–94", "4.2"],
    "Château Kirwan": ["90–94", "90–93", "4.1"], "Château d'Issan": ["91–95", "91–94", "4.2"], "Château Langoa Barton": ["91–94", "90–93", "4.1"],
    "Château Malescot St. Exupéry": ["91–95", "91–94", "4.2"], "Château La Lagune": ["91–94", "90–93", "4.1"], "Château Saint-Pierre": ["92–95", "91–94", "4.2"],
    "Château Branaire-Ducru": ["91–94", "90–93", "4.1"], "Château Lafon-Rochet": ["90–94", "90–93", "4.0"], "Château Prieuré-Lichine": ["89–93", "89–92", "4.0"],
    "Château Haut-Batailley": ["91–95", "90–94", "4.1"], "Château Lynch-Moussas": ["89–92", "88–91", "3.9"], "Château Dauzac": ["89–93", "89–92", "4.0"],
    "Château du Tertre": ["90–93", "89–92", "4.0"], "Château Haut-Bages Libéral": ["89–93", "89–92", "4.0"], "Château Pédesclaux": ["89–93", null, "4.0"],
    "Château La Mission Haut-Brion": ["96–100", "95–99", "4.6"], "Château Haut-Bailly": ["94–98", "93–97", "4.4"], "Domaine de Chevalier Rouge": ["92–96", "91–95", "4.2"],
    "Domaine de Chevalier Blanc": ["94–98", "93–96", "4.4"], "Château Haut-Brion Blanc": ["95–100", "94–98", "4.6"], "Pavillon Blanc du Château Margaux": ["93–96", "92–95", "4.4"],
    "Château Climens": ["95–99", "94–98", "4.5"], "Château Coutet": ["93–97", "92–96", "4.4"], "Château Suduiraut": ["94–98", "93–97", "4.4"], "Château Rieussec": ["93–97", "92–96", "4.4"],
    "Château Canon": ["95–99", "94–98", "4.5"], "Château Belair-Monange": ["95–99", "94–97", "4.5"], "Château Troplong Mondot": ["94–98", "93–96", "4.4"],
    "Château Valandraud": ["94–98", "93–96", "4.4"], "Clos Fourtet": ["94–98", "93–96", "4.4"], "Château Trotanoy": ["95–99", "94–98", "4.5"],
    "Château La Conseillante": ["95–99", "94–98", "4.5"], "Vieux Château Certan": ["96–100", "95–98", "4.6"], "Château Clinet": ["94–98", "93–96", "4.4"],
    "Château Gazin": ["92–96", "92–95", "4.3"], "Château Lafleur": ["97–100", "96–99", "4.6"], "Le Petit Cheval": ["93–96", null, "4.5"], "Carillon d'Angélus": ["92–95", null, "4.4"],
    "Alter Ego de Palmer": ["92–95", "91–94", "4.4"], "Domaine de la Romanée-Conti La Tâche": ["97–100", "96–99", "4.8"], "Domaine de la Romanée-Conti Richebourg": ["96–99", null, "4.7"],
    "Domaine de la Romanée-Conti Romanée-St-Vivant": ["95–98", null, "4.7"], "Domaine de la Romanée-Conti Grands-Échezeaux": ["95–98", null, "4.7"],
    "Domaine de la Romanée-Conti Échezeaux": ["94–97", null, "4.6"], "Comte Georges de Vogüé Musigny Vieilles Vignes": ["97–100", null, "4.7"],
    "Domaine Armand Rousseau Chambertin": ["97–100", null, "4.7"], "Domaine Leflaive Bâtard-Montrachet": ["96–99", null, "4.6"], "Coche-Dury Meursault": ["93–96", null, "4.6"],
    "E. Guigal Côte-Rôtie La Mouline": ["97–100", "95–99", "4.6"], "E. Guigal Côte-Rôtie La Landonne": ["97–100", "95–99", "4.6"], "E. Guigal Côte-Rôtie La Turque": ["97–100", "95–99", "4.6"],
    "Paul Jaboulet Aîné Hermitage La Chapelle": ["95–100", "94–98", "4.5"], "Château Rayas Châteauneuf-du-Pape": ["96–100", null, "4.6"],
    "Dom Pérignon Rosé": ["95–98", "94–97", "4.6"], "Krug Vintage": ["96–99", "95–98", "4.6"], "Louis Roederer Cristal": ["96–99", "95–98", "4.6"],
    "Salon Le Mesnil Blanc de Blancs": ["97–100", "96–99", "4.7"], "Laurent-Perrier Grand Siècle": ["95–98", "94–97", "4.5"], "Pol Roger Cuvée Sir Winston Churchill": ["96–99", "95–98", "4.6"],
    "Taittinger Comtes de Champagne Blanc de Blancs": ["95–98", "94–97", "4.6"], "Veuve Clicquot La Grande Dame": ["94–97", "93–96", "4.5"], "Dom Ruinart Blanc de Blancs": ["95–98", "94–97", "4.6"],
    "Ridge Monte Bello": ["95–99", "94–98", "4.5"], "Shafer Hillside Select Cabernet Sauvignon": ["96–100", "95–98", "4.6"], "Dominus Estate": ["95–99", "94–98", "4.5"],
    "Quintessa": ["94–98", "93–96", "4.4"], "Heitz Cellar Martha's Vineyard Cabernet Sauvignon": ["94–98", null, "4.4"], "Spottswoode Estate Cabernet Sauvignon": ["95–99", "94–97", "4.5"],
    "Stag's Leap Wine Cellars Cask 23": ["95–99", "94–97", "4.5"], "Quilceda Creek Cabernet Sauvignon": ["96–100", "95–98", "4.5"], "Clos Apalta": ["95–98", null, "4.5"],
    "Viñedo Chadwick": ["96–100", null, "4.6"], "Seña": ["94–98", null, "4.4"], "Don Maximiano Founder's Reserve": ["94–97", null, "4.4"],
    "Catena Zapata Adrianna Vineyard River Stones Malbec": ["96–100", null, "4.6"], "Nicolás Catena Zapata": ["94–97", null, "4.5"], "Penfolds RWT Bin 798 Shiraz": ["94–97", null, "4.4"],
    "Penfolds Yattarna Chardonnay": ["94–97", null, "4.4"], "Penfolds Bin 707 Cabernet Sauvignon": ["96–99", null, "4.6"], "Henschke Mount Edelstone Shiraz": ["94–97", null, "4.4"],
    "Torbreck RunRig": ["96–99", null, "4.5"], "Egon Müller Scharzhofberger Riesling Spätlese": ["96–99", null, "4.6"], "Barca Velha": ["95–98", null, "4.6"],
    "Dal Forno Romano Amarone della Valpolicella": ["96–99", null, "4.6"], "Giuseppe Quintarelli Amarone della Valpolicella Classico": ["96–99", null, "4.6"],
    "Fontodi Flaccianello della Pieve": ["95–98", "94–97", "4.5"], "Tua Rita Redigaffi": ["95–99", null, "4.6"], "Giacomo Conterno Barolo Cascina Francia": ["96–99", null, "4.6"],
    "Gaja Sperss Langhe Nebbiolo": ["95–98", null, "4.5"], "Bruno Giacosa Barbaresco": ["94–97", null, "4.4"], "Clos i Terrasses Clos Erasmus": ["96–99", null, "4.5"],
    "Castillo Ygay Gran Reserva Especial": ["95–99", null, "4.6"], "Klein Constantia Vin de Constance": ["95–98", null, "4.5"], "Château Musar Rouge": ["91–94", null, "4.1"],
  };
  const NOTE = "최근 빈티지 통상 범위 (참고용 근사치)";
  for (const it of window.LIQUORS) {
    const s = S[it.en]; if (!s || (it.ratings && it.ratings.length)) continue;
    const [rp, ws, v] = s;
    it.ratings = [
      v && { src: "Vivino", score: v, note: "사용자 평균 근사치" },
      rp && { src: "Robert Parker (Wine Advocate)", score: rp, note: NOTE },
      ws && { src: "Wine Spectator", score: ws, note: NOTE },
    ].filter(Boolean);
  }
})();
