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

  /* 한국에서 많이 팔리는 와인 — 브랜드·라인 단위 Vivino 평균 근사치 (영문명 앞부분 일치, 가장 긴 일치 우선) */
  const LINE = {
    "Casillero del Diablo": 3.5, "Concha y Toro Reservado": 3.3, "Frontera": 3.3, "Sunrise": 3.3, "Marqués de Casa Concha": 4.0, "Concha y Toro Terrunyo": 4.0,
    "Montes Classic Series": 3.6, "Montes Alpha": 3.9, "Montes Limited Selection": 3.7, "Montes Outer Limits": 3.9, "Santa Rita 120": 3.4, "Santa Rita Reserva": 3.5,
    "Santa Rita Medalla Real": 3.8, "Santa Carolina Reservado": 3.3, "Santa Carolina Reserva de Familia": 3.7, "Cono Sur Bicicleta": 3.5, "Cono Sur Organic": 3.5,
    "Cono Sur 20 Barrels": 4.0, "1865 Single Vineyard": 3.8, "35 South": 3.3, "Errázuriz Max": 3.8, "Errázuriz Estate Series": 3.6, "Tarapacá Gran Reserva": 3.7,
    "Caliterra Reserva": 3.4, "Undurraga": 3.5, "Carmen Reserva": 3.5, "Carmen Gran Reserva": 3.7, "Luis Felipe Edwards Reserva": 3.5, "Morandé Pionero": 3.4,
    "Viña Maipo Mi Pueblo": 3.3, "Lapostolle Grand Selection": 3.7, "Viña Leyda": 3.8, "Ventisquero Grey": 3.9, "Viu Manent Reserva": 3.6, "MontGras": 3.5,
    "Veramonte Reserva": 3.6, "Miguel Torres Santa Digna": 3.5, "Escudo Rojo": 3.7,
    "Catena": 3.9, "Alamos": 3.6, "Trapiche Oak Cask": 3.6, "Trapiche Vineyards": 3.4, "Trapiche Medalla": 3.9, "Trapiche Broquel": 3.8, "Norton": 3.6,
    "El Esteco": 3.8, "Trivento Reserve": 3.5, "Kaiken": 3.8, "Santa Julia": 3.6, "Luigi Bosca": 3.8, "Zuccardi": 3.9, "Terrazas de los Andes": 3.8,
    "Doña Paula": 3.7, "Finca Las Moras": 3.4, "Navarro Correas": 3.6, "Pascual Toso": 3.6,
    "Woodbridge": 3.4, "Robert Mondavi Private Selection": 3.6, "Robert Mondavi Napa Valley": 4.0, "Beringer Founders' Estate": 3.6, "Beringer Main & Vine": 3.4,
    "Kendall-Jackson Vintner's Reserve": 3.8, "Barefoot": 3.5, "Gallo Family Vineyards": 3.3, "Sutter Home": 3.3, "Josh Cellars": 3.8, "Meiomi": 3.9,
    "La Crema": 3.9, "Clos du Bois": 3.6, "Duckhorn": 4.2, "Decoy": 3.9, "Bogle": 3.7, "14 Hands": 3.6, "Chateau Ste. Michelle": 3.7, "Columbia Crest": 3.7,
    "Dark Horse": 3.6, "Cupcake Vineyards": 3.5, "Hahn Family Wines": 3.7, "Estancia": 3.5, "Edna Valley Vineyard": 3.6, "Kenwood": 3.6, "Blackstone": 3.5,
    "Liberty School": 3.8, "Chateau Souverain": 3.6, "Rodney Strong": 3.8, "Simi": 3.8, "Franciscan": 3.7, "Sterling Vintner's Collection": 3.5, "BV Coastal Estates": 3.4,
    "Joel Gott": 3.8, "Murphy-Goode": 3.6, "Sebastiani": 3.6, "Ravenswood": 3.6, "Hess Select": 3.6, "J. Lohr": 3.8, "Apothic": 3.6, "19 Crimes": 3.6,
    "Ménage à Trois": 3.6, "Conundrum": 3.8, "DAOU": 4.0, "Justin": 4.0, "Orin Swift": 4.2, "Educated Guess": 3.9, "Caymus": 4.3, "Silver Oak": 4.3,
    "[yellow tail]": 3.4, "Jacob's Creek Classic": 3.4, "Jacob's Creek Reserve": 3.6, "Jacob's Creek Double Barrel": 3.9, "Penfolds Koonunga Hill": 3.6, "Penfolds Max's": 3.8,
    "Penfolds Rawson's Retreat": 3.4, "Penfolds Bin 2": 3.9, "Penfolds Bin 8": 3.9, "Penfolds Bin 138": 4.0, "Penfolds Bin 150": 4.2, "Penfolds Bin 23": 3.9, "Penfolds Bin 600": 4.0,
    "Wolf Blass Yellow Label": 3.5, "Wolf Blass Red Label": 3.3, "Wolf Blass Gold Label": 3.8, "Lindeman's": 3.4, "Hardys Stamp": 3.2, "The Little Penguin": 3.3,
    "McGuigan Black Label": 3.4, "Rosemount Diamond Label": 3.4, "Taylors Estate": 3.6, "Peter Lehmann Portrait": 3.7, "d'Arenberg The Stump Jump": 3.6,
    "Two Hands": 4.1, "Mollydooker": 4.2, "Brown Brothers": 3.7,
    "Kim Crawford": 3.8, "Oyster Bay": 3.8, "Villa Maria": 3.8, "Cloudy Bay": 4.1, "Saint Clair": 3.8, "Matua": 3.6, "Stoneleigh": 3.6, "Giesen": 3.6, "Brancott Estate": 3.6,
    "Whitehaven": 3.8, "Mud House": 3.7, "Dog Point": 4.0, "Greywacke": 4.0,
    "Gérard Bertrand Réserve Spéciale": 3.6, "Gérard Bertrand Côte des Roses": 3.8, "Paul Mas Estate": 3.6, "Arrogant Frog": 3.5, "J.P. Chenet": 3.3, "Domaine de la Baume": 3.5,
    "Calvet Varietals": 3.3, "Georges Duboeuf": 3.5, "Mouton Cadet": 3.5, "La Vieille Ferme": 3.5, "Whispering Angel": 4.0, "Château d'Esclans Whispering Angel": 4.0,
    "Miraval": 4.0, "Minuty": 3.9, "Louis Jadot": 3.9, "Joseph Drouhin": 3.9, "Bouchard Père & Fils": 3.8, "Louis Latour": 3.8, "Albert Bichot": 3.8, "Maison Champy": 3.8,
    "Jean-Claude Boisset": 3.7, "Labouré-Roi": 3.6, "M. Chapoutier": 3.8, "E. Guigal": 3.9, "Paul Jaboulet Aîné": 3.8, "Famille Perrin": 3.8, "Delas Frères": 3.8,
    "Moët & Chandon": 4.1, "Veuve Clicquot": 4.2, "Taittinger": 4.2, "Bollinger": 4.3, "Laurent-Perrier": 4.2, "Piper-Heidsieck": 4.0, "Charles Heidsieck": 4.3,
    "Nicolas Feuillatte": 4.0, "G.H. Mumm": 4.0, "Mumm": 4.0, "Ruinart": 4.3, "Louis Roederer": 4.3, "Pol Roger": 4.3, "Perrier-Jouët": 4.2, "Billecart-Salmon": 4.3,
    "Pommery": 4.0, "Lanson": 4.0, "Deutz": 4.1, "Henriot": 4.1, "Gosset": 4.2, "Drappier": 4.0,
    "Villa Antinori": 3.8, "Antinori Peppoli": 3.8, "Antinori Santa Cristina": 3.6, "Tormaresca": 3.7, "Castello Banfi": 3.9, "Banfi": 3.8, "Ruffino": 3.7, "Frescobaldi": 3.8,
    "Zonin": 3.4, "Cavit": 3.4, "Mezzacorona": 3.5, "Santa Margherita": 3.8, "Farnese Fantini": 3.7, "Farnese Edizione": 4.2, "Casale Vecchio": 3.7, "San Marzano": 3.9,
    "Masi": 3.9, "Zenato": 4.0, "Tommasi": 4.0, "Cesari": 3.9, "Pasqua": 3.8, "Allegrini": 4.0, "Bolla": 3.4, "Donnafugata": 3.9, "Planeta": 3.8, "Cusumano": 3.7,
    "Mionetto": 3.8, "La Marca": 3.8, "Canti": 3.6, "Gancia": 3.7, "Martini": 3.6, "Ferrari": 4.0, "Riunite": 3.6, "Fontanafredda": 3.8, "Marchesi di Barolo": 3.9,
    "Michele Chiarlo": 3.9, "Pio Cesare": 4.1, "Prunotto": 3.9,
    "Campo Viejo": 3.5, "Marqués de Riscal": 3.8, "Marqués de Cáceres": 3.7, "Torres": 3.7, "Familia Torres": 3.7, "Ramón Bilbao": 3.8, "Bodegas LAN": 3.7, "Faustino": 3.7,
    "CVNE": 3.9, "Beronia": 3.7, "Montecillo": 3.6, "Muga": 4.0, "Bodegas Muga": 4.0, "Protos": 3.9, "Freixenet": 3.6, "Codorníu": 3.5, "Segura Viudas": 3.6,
    "Mar de Frades": 3.9, "Martín Códax": 3.8, "Borsao": 3.9, "Juan Gil": 4.0, "Casal Garcia": 3.5, "Mateus": 3.4, "Esporão": 3.7,
    "Dr. Loosen": 3.8, "Blue Nun": 3.2, "Schmitt Söhne": 3.4, "Leitz": 3.8, "Villa Wolf": 3.6, "Selbach": 3.8,
    "Spier Signature": 3.5, "KWV": 3.4, "Nederburg": 3.4, "Boschendal": 3.6, "Beyerskloof": 3.6, "Goats do Roam": 3.5,
  };
  const keys = Object.keys(LINE).sort((a, b) => b.length - a.length);
  for (const it of window.LIQUORS) {
    if (it.cat !== "wine" || !it.en || (it.ratings || []).some((r) => r.src === "Vivino")) continue;
    const k = keys.find((p) => it.en.startsWith(p));
    if (k) (it.ratings = it.ratings || []).unshift({ src: "Vivino", score: LINE[k].toFixed(1), note: "브랜드·라인 평균 근사치" });
  }
})();
