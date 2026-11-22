// 라벨 글자 → 수록된 술 찾기 검사.  실행: node liquor-app/tests/label-ocr.test.js
// OCR 결과를 흉내 낸 글자(오타·잡음 포함)로 1위 후보를 확인한다. 수록되지 않은 술은 '없음'이어야 한다.
const path = require("path");
global.window = {}; global.localStorage = { getItem: () => null, setItem() {} };
const dir = path.join(__dirname, "..");
for (const f of ["icons.js", "data.js", "data-extra.js", "data-bulk-1.js", "data-bulk-2.js", "data-bulk-3.js", "data-bulk-4.js",
  "data-bulk-5.js", "data-bulk-6.js", "data-bulk-7.js", "label-ocr.js"]) require(path.join(dir, f));

const CASES = [
  ["CLOUDY BAY\nSAUVIGNON BLANC\nMarlborough New Zealand 2023", "Cloudy Bay Sauvignon Blanc"],
  ["0PUS ONE\nNAPA VALLEY RED WINE\n2019\nOAKVlLLE", "Opus One"],
  ["KISTLER\nLes Noisetiers\nSonoma Coast Chardonnay 2021", "Kistler Les Noisetiers Chardonnay"],
  ["獺祭 純米大吟醸 磨き二割三分 山口県", "Dassai 23 Junmai Daiginjo"],
  ["Riser 纯米大吟酸 磨き二割三分", "Dassai 23 Junmai Daiginjo"],
  ["화요 25 증류식 소주 HWAYO", "Hwayo 25"],
  ["贵州茅台酒 飞天 53%vol", "Kweichow Moutai Feitian 53%"],
  ["KWEICHOW MOUTAI 53% vol", "Kweichow Moutai Feitian 53%"],
  ["THE MACALLAN\nHIGHLAND SINGLE MALT SCOTCH WHISKY\nSHERRY OAK CASK\n12 YEARS OLD", "The Macallan 12 Sherry Oak"],
  ["CHATEAU MARGAUX\nPREMIER GRAND CRU CLASSE\nMARGAUX 2015", "Château Margaux"],
  ["JOHNNIE WALKER\nBLACK LABEL\nAGED 12 YEARS\nBLENDED SCOTCH WHISKY", "Johnnie Walker Black Label 12"],
  ["MOËT & CHANDON\nCHAMPAGNE\nIMPERIAL BRUT", "Moët & Chandon Impérial Brut"],
  ["참이슬 fresh 16.5%", "Chamisul Fresh"],
  ["2022\nAubert\nEastside\nRussian River Valley Chardonnay", null],
  ["Chardonnay California 2021", null],
];
let fail = 0;
for (const [text, want] of CASES) {
  const got = window.LabelOCR.match(text);
  const top = got[0]?.it.en ?? null;
  const ok = want ? top === want : got.length === 0;
  if (!ok) fail++;
  console.log(ok ? "ok  " : "FAIL", JSON.stringify(text.split("\n")[0]), "→", top ?? "없음");
}
console.log(fail ? `${fail}건 실패` : `${CASES.length}건 모두 통과`);
process.exit(fail ? 1 : 0);
