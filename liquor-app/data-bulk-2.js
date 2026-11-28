/* 술사전 대량 DB (2) — 위스키 · 꼬냑/브랜디 · 중국술 · 기타 증류주/리큐어 · 일본 소주
 * 도수는 대표값, 참고가(₩)는 국내 시판 근사치.
 */
(() => {
  const { rows } = window.BULK;
  const SMS = "싱글 몰트 스카치", MALT = "맥아 보리";
  // 브랜드 × 표현 : [브랜드 한글, 브랜드 영문, 생산자, 지역, 스타일, 프리셋, [[표현 한글, 표현 영문, 도수, 참고가]]]
  const WB = (bk, be, producer, region, style, preset, exprs, country = "스코틀랜드", ing = MALT) =>
    rows("whisky", preset, exprs.map(([xk, xe, abv, krw]) => [`${bk} ${xk}`, `${be} ${xe}`, style, abv, country, region, producer, krw, ing]));

  WB("글렌피딕", "Glenfiddich", "William Grant & Sons", "스페이사이드", SMS, "scotchLight", [
    ["21년 그랑 레제르바", "21 Year Old Gran Reserva", 40, 330000], ["23년 그랑 크뤼", "23 Year Old Grand Cru", 40, 450000],
    ["14년 버번 배럴 리저브", "14 Year Old Bourbon Barrel Reserve", 43, 90000], ["프로젝트 XX", "Project XX", 47, 95000],
    ["파이어 앤 케인", "Fire & Cane", 43, 85000], ["IPA 익스페리먼트", "IPA Experiment", 43, 85000], ["30년", "30 Year Old", 43, 1600000]]);
  WB("글렌리벳", "The Glenlivet", "Chivas Brothers", "스페이사이드", SMS, "scotchLight", [
    ["파운더스 리저브", "Founder's Reserve", 40, 55000], ["15년 프렌치 오크 리저브", "15 Year Old French Oak Reserve", 40, 110000],
    ["18년", "18 Year Old", 43, 210000], ["21년 아카이브", "21 Year Old Archive", 43, 450000], ["나두라 오로로소", "Nàdurra Oloroso", 60.7, 130000],
    ["캐리비안 리저브", "Caribbean Reserve", 40, 60000], ["14년 코냑 캐스크", "14 Year Old Cognac Cask Selection", 40, 90000]]);
  WB("맥캘란", "The Macallan", "Edrington", "스페이사이드", SMS, "scotchSherry", [
    ["15년 더블 캐스크", "15 Years Old Double Cask", 43, 220000], ["18년 더블 캐스크", "18 Years Old Double Cask", 43, 420000],
    ["12년 트리플 캐스크", "12 Years Old Triple Cask", 40, 150000], ["15년 트리플 캐스크", "15 Years Old Triple Cask", 43, 250000],
    ["18년 트리플 캐스크", "18 Years Old Triple Cask", 43, 450000], ["25년 셰리 오크", "25 Years Old Sherry Oak", 43, 2800000],
    ["레어 캐스크", "Rare Cask", 43, 480000], ["클래식 컷", "Classic Cut", 52, 220000]]);
  WB("발베니", "The Balvenie", "William Grant & Sons", "스페이사이드", SMS, "scotchSherry", [
    ["16년 프렌치 오크", "16 Year Old French Oak", 47.6, 230000], ["17년 더블우드", "17 Year Old DoubleWood", 43, 320000],
    ["21년 포트우드", "21 Year Old PortWood", 40, 580000], ["12년 아메리칸 오크", "12 Year Old American Oak", 43, 120000],
    ["25년", "25 Year Old", 48, 1500000]]);
  WB("글렌모렌지", "Glenmorangie", "Moët Hennessy", "하이랜드", SMS, "scotchLight", [
    ["라산타 12년", "The Lasanta 12", 43, 95000], ["퀸타 루반 14년", "The Quinta Ruban 14", 46, 105000],
    ["넥타 도르 12년", "The Nectar d'Òr 12", 46, 115000], ["18년", "18 Year Old", 43, 260000], ["시그넷", "Signet", 46, 350000],
    ["X 바이 글렌모렌지", "X by Glenmorangie", 40, 45000]]);
  WB("달모어", "The Dalmore", "Whyte & Mackay", "하이랜드", SMS, "scotchSherry", [
    ["15년", "15 Year Old", 40, 190000], ["18년", "18 Year Old", 43, 380000], ["시가 몰트 리저브", "Cigar Malt Reserve", 44, 260000],
    ["킹 알렉산더 3세", "King Alexander III", 40, 420000], ["포트우드 리저브", "Port Wood Reserve", 46.5, 130000]]);
  WB("글렌드로낙", "The GlenDronach", "Brown-Forman", "하이랜드", SMS, "scotchSherry", [
    ["15년 리바이벌", "15 Year Old Revival", 46, 150000], ["18년 알라디스", "18 Year Old Allardice", 46, 320000], ["21년 팔러먼트", "21 Year Old Parliament", 48, 580000]]);
  WB("아벨라워", "Aberlour", "Chivas Brothers", "스페이사이드", SMS, "scotchSherry", [
    ["12년 더블 캐스크", "12 Year Old Double Cask Matured", 40, 75000], ["16년", "16 Year Old", 40, 150000], ["18년", "18 Year Old", 43, 260000]]);
  WB("하이랜드 파크", "Highland Park", "Edrington", "오크니", SMS, "scotchLight", [
    ["18년 바이킹 프라이드", "18 Year Old Viking Pride", 43, 320000], ["15년 바이킹 하트", "15 Year Old Viking Heart", 44, 150000], ["다크 오리진", "Dark Origins", 46.8, 110000]]);
  WB("탈리스커", "Talisker", "Diageo", "스카이섬", SMS + " · 피티드", "scotchPeat", [
    ["스톰", "Storm", 45.8, 75000], ["스카이", "Skye", 45.8, 65000], ["18년", "18 Year Old", 45.8, 300000], ["디스틸러스 에디션", "Distillers Edition", 45.8, 130000], ["포트 리기", "Port Ruighe", 45.8, 90000]]);
  WB("라가불린", "Lagavulin", "Diageo", "아일라", SMS + " · 피티드", "scotchPeat", [
    ["8년", "8 Year Old", 48, 110000], ["디스틸러스 에디션", "Distillers Edition", 43, 190000], ["12년 캐스크 스트렝스", "12 Year Old Cask Strength", 56.5, 200000]]);
  WB("라프로익", "Laphroaig", "Suntory Global Spirits", "아일라", SMS + " · 피티드", "scotchPeat", [
    ["쿼터 캐스크", "Quarter Cask", 48, 85000], ["로어", "Lore", 48, 170000], ["10년 캐스크 스트렝스", "10 Year Old Cask Strength", 58, 130000],
    ["셀렉트", "Select", 40, 55000], ["PX 캐스크", "PX Cask", 48, 110000]]);
  WB("아드벡", "Ardbeg", "Moët Hennessy", "아일라", SMS + " · 피티드", "scotchPeat", [
    ["우가달", "Uigeadail", 54.2, 140000], ["코리브레칸", "Corryvreckan", 57.1, 150000], ["안 오", "An Oa", 46.6, 85000], ["위 비스티 5년", "Wee Beastie 5 Year Old", 47.4, 65000]]);
  WB("보모어", "Bowmore", "Suntory Global Spirits", "아일라", SMS + " · 피티드", "scotchPeat", [
    ["15년", "15 Year Old", 43, 130000], ["18년", "18 Year Old", 43, 220000], ["넘버 원", "No. 1", 40, 60000]]);
  WB("브룩라디", "Bruichladdich", "Rémy Cointreau", "아일라", SMS, "scotchLight", [["더 클래식 라디", "The Classic Laddie", 50, 95000]]);
  WB("포트 샬롯", "Port Charlotte", "Rémy Cointreau", "아일라", SMS + " · 헤비 피티드", "scotchPeat", [["10년", "10", 50, 105000]]);
  WB("쿨일라", "Caol Ila", "Diageo", "아일라", SMS + " · 피티드", "scotchPeat", [["12년", "12 Year Old", 43, 95000], ["모크", "Moch", 43, 75000]]);
  WB("부나하벤", "Bunnahabhain", "Distell", "아일라", SMS, "scotchSherry", [["12년", "12 Year Old", 46.3, 95000], ["토흐 모라", "Toiteach A Dhà", 46.3, 85000]]);
  WB("킬호만", "Kilchoman", "Kilchoman Distillery", "아일라", SMS + " · 피티드", "scotchPeat", [["마키어 베이", "Machir Bay", 46, 95000], ["사닉 베이", "Sanaig", 46, 105000]]);
  WB("오반", "Oban", "Diageo", "웨스트 하이랜드", SMS, "scotchLight", [["14년", "14 Year Old", 43, 140000], ["리틀 베이", "Little Bay", 43, 95000]]);
  WB("크라간모어", "Cragganmore", "Diageo", "스페이사이드", SMS, "scotchLight", [["12년", "12 Year Old", 40, 90000]]);
  WB("달위니", "Dalwhinnie", "Diageo", "하이랜드", SMS, "scotchLight", [["15년", "15 Year Old", 43, 100000]]);
  WB("글렌킨치", "Glenkinchie", "Diageo", "로우랜드", SMS, "scotchLight", [["12년", "12 Year Old", 43, 85000]]);
  WB("클라이넬리시", "Clynelish", "Diageo", "하이랜드", SMS, "scotchLight", [["14년", "14 Year Old", 46, 115000]]);
  WB("모틀락", "Mortlach", "Diageo", "스페이사이드", SMS, "scotchSherry", [["12년 위 위치", "12 Year Old The Wee Witchie", 43.4, 120000], ["16년", "16 Year Old Distiller's Dram", 43.4, 220000]]);
  WB("싱글톤", "The Singleton", "Diageo", "스페이사이드/하이랜드", SMS, "scotchLight", [
    ["오브 더프타운 12년", "of Dufftown 12 Year Old", 40, 55000], ["오브 더프타운 15년", "of Dufftown 15 Year Old", 40, 85000],
    ["오브 글렌 오드 12년", "of Glen Ord 12 Year Old", 40, 65000], ["오브 글렌둘란 12년", "of Glendullan 12 Year Old", 40, 60000]]);
  WB("카듀", "Cardhu", "Diageo", "스페이사이드", SMS, "scotchLight", [["12년", "12 Year Old", 40, 75000]]);
  WB("로얄 로크나가", "Royal Lochnagar", "Diageo", "하이랜드", SMS, "scotchLight", [["12년", "12 Year Old", 40, 85000]]);
  WB("벤리악", "BenRiach", "Brown-Forman", "스페이사이드", SMS, "scotchLight", [["더 오리지널 텐", "The Original Ten", 43, 75000], ["더 스모키 텐", "The Smoky Ten", 46, 85000]]);
  WB("글렌 그란트", "Glen Grant", "Campari Group", "스페이사이드", SMS, "scotchLight", [["아보랄리스", "Arboralis", 40, 45000], ["10년", "10 Year Old", 40, 55000], ["12년", "12 Year Old", 43, 65000], ["18년", "18 Year Old Rare Edition", 43, 220000]]);
  WB("토마틴", "Tomatin", "Takara Shuzo", "하이랜드", SMS, "scotchLight", [["레거시", "Legacy", 43, 50000], ["12년", "12 Year Old", 43, 65000], ["18년", "18 Year Old", 46, 200000]]);
  WB("올드 풀트니", "Old Pulteney", "Inver House", "하이랜드", SMS, "scotchLight", [["12년", "12 Year Old", 40, 75000]]);
  WB("딘스턴", "Deanston", "Distell", "하이랜드", SMS, "scotchLight", [["12년", "12 Year Old", 46.3, 85000]]);
  WB("오큰토션", "Auchentoshan", "Suntory Global Spirits", "로우랜드", SMS, "scotchLight", [["아메리칸 오크", "American Oak", 40, 55000], ["12년", "12 Year Old", 40, 75000], ["쓰리 우드", "Three Wood", 43, 105000]]);
  WB("아란", "Arran", "Isle of Arran Distillers", "아일랜즈", SMS, "scotchLight", [["10년", "10 Year Old", 46, 85000], ["쿼터 캐스크", "Quarter Cask The Bothy", 56.2, 120000]]);
  WB("글렌고인", "Glengoyne", "Ian Macleod", "하이랜드", SMS, "scotchSherry", [["12년", "12 Year Old", 43, 85000], ["18년", "18 Year Old", 43, 230000]]);
  WB("글렌파클라스", "Glenfarclas", "J. & G. Grant", "스페이사이드", SMS, "scotchSherry", [["12년", "12 Year Old", 43, 85000], ["15년", "15 Year Old", 46, 130000], ["105", "105 Cask Strength", 60, 130000], ["25년", "25 Year Old", 43, 400000]]);
  WB("에드라두어", "Edradour", "Signatory", "하이랜드", SMS, "scotchSherry", [["10년", "10 Year Old", 40, 85000]]);
  WB("크라이겔라키", "Craigellachie", "Bacardi", "스페이사이드", SMS, "scotchLight", [["13년", "13 Year Old", 46, 90000]]);
  WB("벤로막", "Benromach", "Gordon & MacPhail", "스페이사이드", SMS, "scotchPeat", [["10년", "10 Year Old", 43, 85000]]);
  WB("탐두", "Tamdhu", "Ian Macleod", "스페이사이드", SMS, "scotchSherry", [["12년", "12 Year Old", 43, 95000]]);
  WB("스프링뱅크", "Springbank", "J&A Mitchell", "캠벨타운", SMS, "scotchPeat", [["15년", "15 Year Old", 46, 280000], ["12년 캐스크 스트렝스", "12 Year Old Cask Strength", 56, 250000]]);
  WB("롱로우", "Longrow", "J&A Mitchell", "캠벨타운", SMS + " · 헤비 피티드", "scotchPeat", [["피티드", "Peated", 46, 120000]]);
  WB("글렌 스코샤", "Glen Scotia", "Loch Lomond Group", "캠벨타운", SMS, "scotchLight", [["더블 캐스크", "Double Cask", 46, 75000]]);
  WB("스페이번", "Speyburn", "Inver House", "스페이사이드", SMS, "scotchLight", [["10년", "10 Year Old", 40, 45000]]);
  WB("로크 로몬드", "Loch Lomond", "Loch Lomond Group", "하이랜드", SMS, "scotchLight", [["12년", "12 Year Old", 46, 65000]]);
  WB("주라", "Jura", "Whyte & Mackay", "아일랜즈", SMS, "scotchLight", [["10년", "10 Year Old", 40, 60000], ["12년", "12 Year Old", 40, 75000]]);
  WB("토버모리", "Tobermory", "Distell", "아일랜즈", SMS, "scotchLight", [["12년", "12 Year Old", 46.3, 95000]]);
  WB("레칙", "Ledaig", "Distell", "아일랜즈", SMS + " · 피티드", "scotchPeat", [["10년", "10 Year Old", 46.3, 95000]]);
  WB("글렌알라키", "GlenAllachie", "The GlenAllachie Distillers", "스페이사이드", SMS, "scotchSherry", [["12년", "12 Year Old", 46, 95000], ["15년", "15 Year Old", 46, 150000]]);

  const BLD = "블렌디드 스카치", BL = "몰트 위스키/그레인 위스키";
  WB("발렌타인", "Ballantine's", "Chivas Brothers", "블렌디드", BLD, "blend", [
    ["파이니스트", "Finest", 40, 25000], ["12년", "12 Year Old", 40, 45000], ["21년", "21 Year Old", 40, 220000], ["23년", "23 Year Old", 40, 320000]], "스코틀랜드", BL);
  WB("조니워커", "Johnnie Walker", "Diageo", "블렌디드", BLD, "blend", [
    ["레드 라벨", "Red Label", 40, 25000], ["더블 블랙", "Double Black", 40, 65000], ["그린 라벨 15년", "Green Label 15 Year Old", 43, 95000],
    ["골드 라벨 리저브", "Gold Label Reserve", 40, 95000], ["18년", "Aged 18 Years", 40, 160000], ["블랙 라벨 루비 리저브", "Black Ruby", 40, 60000]], "스코틀랜드", BL);
  WB("시바스 리갈", "Chivas Regal", "Chivas Brothers", "블렌디드", BLD, "blend", [
    ["18년", "18 Year Old", 40, 120000], ["25년", "25 Year Old", 40, 480000], ["미즈나라", "Mizunara", 40, 75000], ["13년 엑스트라", "Extra 13", 40, 60000]], "스코틀랜드", BL);
  WB("로얄 살루트", "Royal Salute", "Chivas Brothers", "블렌디드", BLD, "blend", [
    ["21년 몰트", "21 Year Old The Malts Blend", 40, 250000], ["21년 로스트 블렌드", "21 Year Old Lost Blend", 40, 280000]], "스코틀랜드", BL);
  rows("whisky", "blend", [
    ["듀어스 화이트 라벨", "Dewar's White Label", BLD, 40, "스코틀랜드", "블렌디드", "Bacardi", 25000, BL],
    ["듀어스 12년", "Dewar's 12 Year Old", BLD, 40, "스코틀랜드", "블렌디드", "Bacardi", 40000, BL],
    ["듀어스 15년", "Dewar's 15 Year Old", BLD, 40, "스코틀랜드", "블렌디드", "Bacardi", 60000, BL],
    ["페이머스 그라우스", "The Famous Grouse", BLD, 40, "스코틀랜드", "블렌디드", "Edrington", 25000, BL],
    ["제이앤비 레어", "J&B Rare", BLD, 40, "스코틀랜드", "블렌디드", "Diageo", 25000, BL],
    ["커티 삭", "Cutty Sark Original", BLD, 40, "스코틀랜드", "블렌디드", "La Martiniquaise", 25000, BL],
    ["그란츠 트리플 우드", "Grant's Triple Wood", BLD, 40, "스코틀랜드", "블렌디드", "William Grant & Sons", 25000, BL],
    ["티처스 하이랜드 크림", "Teacher's Highland Cream", BLD, 40, "스코틀랜드", "블렌디드", "Suntory Global Spirits", 25000, BL],
    ["벨즈 오리지널", "Bell's Original", BLD, 40, "스코틀랜드", "블렌디드", "Diageo", 22000, BL],
    ["화이트 호스", "White Horse", BLD, 40, "스코틀랜드", "블렌디드", "Diageo", 22000, BL],
    ["올드 파 12년", "Old Parr 12 Year Old", BLD, 40, "스코틀랜드", "블렌디드", "Diageo", 55000, BL],
    ["뷰캐넌스 12년", "Buchanan's 12 Year Old Deluxe", BLD, 40, "스코틀랜드", "블렌디드", "Diageo", 50000, BL],
    ["패스포트", "Passport Scotch", BLD, 40, "스코틀랜드", "블렌디드", "Pernod Ricard", 20000, BL],
    ["윈저 12년", "Windsor 12", "블렌디드 스카치 (한국 전용)", 40, "스코틀랜드", "블렌디드", "드링크인터내셔널", 35000, BL],
    ["윈저 17년", "Windsor 17", "블렌디드 스카치 (한국 전용)", 40, "스코틀랜드", "블렌디드", "드링크인터내셔널", 85000, BL],
    ["임페리얼 12년", "Imperial 12", "블렌디드 스카치 (한국 전용)", 40, "스코틀랜드", "블렌디드", "드링크인터내셔널", 35000, BL],
    ["골든블루 사피루스", "Golden Blue Sapphire", "위스키 (저도수 블렌드)", 40, "대한민국", "—", "골든블루", 30000, BL],
    ["골든블루 더 다이아몬드", "Golden Blue The Diamond", "위스키 (저도수 블렌드)", 40, "대한민국", "—", "골든블루", 50000, BL],
    ["컴파스 박스 피트 몬스터", "Compass Box The Peat Monster", "블렌디드 몰트 · 피티드", 46, "스코틀랜드", "블렌디드 몰트", "Compass Box", 95000, MALT, "scotchPeat"],
    ["컴파스 박스 오차드 하우스", "Compass Box Orchard House", "블렌디드 몰트", 46, "스코틀랜드", "블렌디드 몰트", "Compass Box", 85000, MALT],
    ["빅 피트", "Big Peat", "블렌디드 몰트 · 아일라", 46, "스코틀랜드", "아일라", "Douglas Laing", 85000, MALT, "scotchPeat"],
    ["스카치 블루 17년", "Scotch Blue 17", "블렌디드 스카치 (한국 전용)", 40, "스코틀랜드", "블렌디드", "롯데칠성음료", 60000, BL],
  ]);
  // 일본
  rows("whisky", "japanese", [
    ["야마자키 디스틸러스 리저브", "The Yamazaki Distiller's Reserve|山崎", "재패니즈 싱글 몰트", 43, "일본", "오사카 야마자키", "Suntory", 130000, MALT],
    ["야마자키 18년", "The Yamazaki 18 Year Old|山崎 18年", "재패니즈 싱글 몰트", 43, "일본", "오사카 야마자키", "Suntory", 1100000, MALT],
    ["하쿠슈 디스틸러스 리저브", "The Hakushu Distiller's Reserve|白州", "재패니즈 싱글 몰트", 43, "일본", "야마나시 하쿠슈", "Suntory", 130000, MALT],
    ["하쿠슈 18년", "The Hakushu 18 Year Old|白州 18年", "재패니즈 싱글 몰트", 43, "일본", "야마나시 하쿠슈", "Suntory", 1100000, MALT],
    ["히비키 17년", "Hibiki 17 Year Old|響 17年", "재패니즈 블렌디드", 43, "일본", "블렌디드", "Suntory", 900000, BL],
    ["히비키 블렌더스 초이스", "Hibiki Blender's Choice|響 BLENDER'S CHOICE", "재패니즈 블렌디드", 43, "일본", "블렌디드", "Suntory", 200000, BL],
    ["치타", "The Chita|知多", "재패니즈 싱글 그레인", 43, "일본", "아이치 치타", "Suntory", 75000, "옥수수/맥아 보리"],
    ["토키", "Suntory Toki|季", "재패니즈 블렌디드", 43, "일본", "블렌디드", "Suntory", 45000, BL],
    ["산토리 올드", "Suntory Old Whisky|サントリーオールド", "재패니즈 블렌디드", 43, "일본", "블렌디드", "Suntory", 40000, BL],
    ["니카 프롬 더 배럴", "Nikka From the Barrel|フロム・ザ・バレル", "재패니즈 블렌디드", 51.4, "일본", "블렌디드", "Nikka (Asahi)", 85000, BL],
    ["니카 타케츠루 퓨어 몰트", "Nikka Taketsuru Pure Malt|竹鶴 ピュアモルト", "재패니즈 블렌디드 몰트", 43, "일본", "요이치·미야기쿄", "Nikka (Asahi)", 140000, MALT],
    ["니카 미야기쿄 싱글 몰트", "Nikka Miyagikyo Single Malt|シングルモルト宮城峡", "재패니즈 싱글 몰트", 45, "일본", "미야기 센다이", "Nikka (Asahi)", 120000, MALT],
    ["니카 코페이 그레인", "Nikka Coffey Grain|カフェグレーン", "재패니즈 그레인", 45, "일본", "미야기 센다이", "Nikka (Asahi)", 95000, "옥수수"],
    ["니카 코페이 몰트", "Nikka Coffey Malt|カフェモルト", "재패니즈 몰트", 45, "일본", "미야기 센다이", "Nikka (Asahi)", 110000, MALT],
    ["니카 데이즈", "Nikka Days", "재패니즈 블렌디드", 40, "일본", "블렌디드", "Nikka (Asahi)", 55000, BL],
    ["블랙 니카 클리어", "Black Nikka Clear|ブラックニッカ クリア", "재패니즈 블렌디드", 37, "일본", "블렌디드", "Nikka (Asahi)", 20000, BL],
    ["슈퍼 니카", "Super Nikka|スーパーニッカ", "재패니즈 블렌디드", 43, "일본", "블렌디드", "Nikka (Asahi)", 45000, BL],
    ["이치로즈 몰트 앤 그레인", "Ichiro's Malt & Grain World Blended|イチローズモルト", "월드 블렌디드", 46.5, "일본", "사이타마 치치부", "Venture Whisky", 95000, BL],
    ["아카시 화이트 오크", "Akashi Blended White Oak|あかし", "재패니즈 블렌디드", 40, "일본", "효고 아카시", "Eigashima Shuzo", 55000, BL],
    ["마스 이와이 트래디션", "Mars Iwai Tradition|岩井トラディション", "재패니즈 블렌디드", 40, "일본", "나가노", "Hombo Shuzo", 50000, BL],
    ["카노스케 싱글 몰트", "Kanosuke Single Malt|嘉之助", "재패니즈 싱글 몰트", 48, "일본", "가고시마", "Komasa Jyozo", 130000, MALT],
  ]);
  // 미국·캐나다
  const BB = "켄터키 스트레이트 버번", CORN = "옥수수/라이/맥아 보리";
  rows("whisky", "bourbon", [
    ["잭 다니엘 젠틀맨 잭", "Gentleman Jack", "테네시 위스키", 40, "미국", "테네시 린치버그", "Brown-Forman", 50000, "옥수수/맥아 보리/라이"],
    ["잭 다니엘 싱글 배럴", "Jack Daniel's Single Barrel Select", "테네시 위스키", 47, "미국", "테네시 린치버그", "Brown-Forman", 75000, "옥수수/맥아 보리/라이"],
    ["잭 다니엘 허니", "Jack Daniel's Tennessee Honey", "위스키 리큐어", 35, "미국", "테네시 린치버그", "Brown-Forman", 35000, "테네시 위스키/꿀 리큐어"],
    ["짐 빔 블랙", "Jim Beam Black Extra-Aged", BB, 43, "미국", "켄터키", "Suntory Global Spirits", 35000, CORN],
    ["짐 빔 데빌스 컷", "Jim Beam Devil's Cut", BB, 45, "미국", "켄터키", "Suntory Global Spirits", 35000, CORN],
    ["메이커스 마크 46", "Maker's Mark 46", "휘티드 버번", 47, "미국", "켄터키 로레토", "Suntory Global Spirits", 65000, "옥수수/겨울밀/맥아 보리"],
    ["와일드 터키 레어 브리드", "Wild Turkey Rare Breed", BB, 58.4, "미국", "켄터키 로렌스버그", "Campari Group", 80000, CORN],
    ["와일드 터키 8년", "Wild Turkey 8 Year Old", BB, 50.5, "미국", "켄터키 로렌스버그", "Campari Group", 45000, CORN],
    ["러셀스 리저브 10년", "Russell's Reserve 10 Year Old", BB, 45, "미국", "켄터키 로렌스버그", "Campari Group", 70000, CORN],
    ["이글 레어 10년", "Eagle Rare 10 Year Old", BB, 45, "미국", "켄터키 프랭크퍼트", "Buffalo Trace (Sazerac)", 75000, CORN],
    ["웰러 스페셜 리저브", "W.L. Weller Special Reserve", "휘티드 버번", 45, "미국", "켄터키 프랭크퍼트", "Buffalo Trace (Sazerac)", 80000, "옥수수/밀/맥아 보리"],
    ["불렛 버번", "Bulleit Bourbon", BB, 45, "미국", "켄터키", "Diageo", 45000, CORN],
    ["불렛 라이", "Bulleit Rye", "스트레이트 라이 위스키", 45, "미국", "인디애나", "Diageo", 50000, "라이/맥아 보리"],
    ["포 로지스 버번", "Four Roses Bourbon", BB, 40, "미국", "켄터키 로렌스버그", "Kirin", 35000, CORN],
    ["포 로지스 스몰 배치", "Four Roses Small Batch", BB, 45, "미국", "켄터키 로렌스버그", "Kirin", 60000, CORN],
    ["포 로지스 싱글 배럴", "Four Roses Single Barrel", BB, 50, "미국", "켄터키 로렌스버그", "Kirin", 75000, CORN],
    ["놉 크릭 9년", "Knob Creek 9 Year Old", BB, 50, "미국", "켄터키", "Suntory Global Spirits", 60000, CORN],
    ["베이질 헤이든", "Basil Hayden", BB, 40, "미국", "켄터키", "Suntory Global Spirits", 65000, CORN],
    ["에반 윌리엄스 블랙", "Evan Williams Black Label", BB, 43, "미국", "켄터키 바즈타운", "Heaven Hill", 25000, CORN],
    ["엘라이저 크레이그 스몰 배치", "Elijah Craig Small Batch", BB, 47, "미국", "켄터키 바즈타운", "Heaven Hill", 50000, CORN],
    ["올드 포레스터 86", "Old Forester 86 Proof", BB, 43, "미국", "켄터키 루이빌", "Brown-Forman", 35000, CORN],
    ["미터스 US*1 버번", "Michter's US*1 Small Batch Bourbon", BB, 45.7, "미국", "켄터키 루이빌", "Michter's", 75000, CORN],
    ["엔젤스 엔비", "Angel's Envy Port Finish", BB, 43.3, "미국", "켄터키 루이빌", "Bacardi", 85000, CORN],
    ["아이 더블유 하퍼", "I.W. Harper Bourbon", BB, 40, "미국", "켄터키", "Diageo", 35000, CORN],
    ["얼리 타임즈", "Early Times", "켄터키 위스키", 40, "미국", "켄터키", "Sazerac", 25000, CORN],
    ["에반 윌리엄스 싱글 배럴", "Evan Williams Single Barrel", BB, 43.3, "미국", "켄터키 바즈타운", "Heaven Hill", 55000, CORN],
    ["캐나디안 클럽", "Canadian Club 1858", "캐나디안 위스키", 40, "캐나다", "온타리오", "Suntory Global Spirits", 25000, "옥수수/라이/보리"],
    ["크라운 로얄", "Crown Royal Deluxe", "캐나디안 위스키", 40, "캐나다", "매니토바", "Diageo", 40000, "옥수수/라이/보리"],
  ]);
  rows("whisky", "irish", [
    ["제임슨 블랙 배럴", "Jameson Black Barrel", "블렌디드 아이리시", 40, "아일랜드", "코크 미들턴", "Irish Distillers", 45000, "보리/맥아 보리/옥수수"],
    ["제임슨 캐스크메이츠 스타우트", "Jameson Caskmates Stout Edition", "블렌디드 아이리시", 40, "아일랜드", "코크 미들턴", "Irish Distillers", 40000, "보리/맥아 보리/옥수수"],
    ["부시밀스 오리지널", "Bushmills Original", "블렌디드 아이리시", 40, "아일랜드", "북아일랜드 부시밀스", "Proximo", 30000, "맥아 보리/그레인"],
    ["부시밀스 블랙 부시", "Bushmills Black Bush", "블렌디드 아이리시", 40, "아일랜드", "북아일랜드 부시밀스", "Proximo", 40000, "맥아 보리/그레인"],
    ["부시밀스 10년 싱글 몰트", "Bushmills 10 Year Old Single Malt", "아이리시 싱글 몰트", 40, "아일랜드", "북아일랜드 부시밀스", "Proximo", 55000, MALT],
    ["툴라모어 듀", "Tullamore D.E.W. Original", "블렌디드 아이리시", 40, "아일랜드", "오펄리 툴라모어", "William Grant & Sons", 30000, "보리/맥아 보리/옥수수"],
    ["레드브레스트 12년", "Redbreast 12 Year Old", "싱글 팟 스틸 아이리시", 40, "아일랜드", "코크 미들턴", "Irish Distillers", 85000, "보리/맥아 보리"],
    ["틸링 스몰 배치", "Teeling Small Batch", "블렌디드 아이리시", 46, "아일랜드", "더블린", "Teeling Whiskey", 50000, "맥아 보리/그레인"],
    ["라이터스 티어스", "Writers' Tears Copper Pot", "아이리시 팟 스틸 블렌드", 40, "아일랜드", "칼로", "Walsh Whiskey", 55000, "보리/맥아 보리"],
    ["파워스 골드 라벨", "Powers Gold Label", "블렌디드 아이리시", 43.2, "아일랜드", "코크 미들턴", "Irish Distillers", 35000, "보리/맥아 보리/옥수수"],
  ]);
  rows("whisky", "scotchSherry", [
    ["카발란 클래식", "Kavalan Classic Single Malt", "싱글 몰트", 40, "대만", "이란현", "King Car", 75000, MALT],
    ["카발란 콘서트마스터", "Kavalan Concertmaster Port Cask Finish", "싱글 몰트", 40, "대만", "이란현", "King Car", 90000, MALT],
    ["카발란 디스틸러리 셀렉트", "Kavalan Distillery Select No.1", "싱글 몰트", 40, "대만", "이란현", "King Car", 55000, MALT],
    ["암룻 퓨전", "Amrut Fusion", "인디언 싱글 몰트", 50, "인도", "방갈로르", "Amrut Distilleries", 95000, MALT],
    ["폴 존 브릴리언스", "Paul John Brilliance", "인디언 싱글 몰트", 46, "인도", "고아", "John Distilleries", 85000, MALT],
    ["스타워드 노바", "Starward Nova", "호주 싱글 몰트", 41, "호주", "멜버른", "Starward", 85000, MALT],
    ["기원 유니콘", "Ki One Unicorn", "대한민국 싱글 몰트", 46, "대한민국", "경기 남양주", "쓰리소사이어티스", 120000, MALT],
    ["김창수 위스키", "Kim Chang Soo Whisky", "대한민국 싱글 몰트", 50, "대한민국", "경기 김포", "김창수위스키증류소", 300000, MALT],
  ]);

  /* ── 꼬냑 · 브랜디 ── */
  const UB = "Ugni Blanc";
  rows("cognac", "cognac", [
    ["마르텔 VS 싱글 디스틸러리", "Martell VS Single Distillery", "꼬냑 VS", 40, "프랑스", "꼬냑", "Martell", 45000, UB],
    ["마르텔 블루 스위프트", "Martell Blue Swift", "꼬냑 VSOP (버번 캐스크 피니시)", 40, "프랑스", "꼬냑", "Martell", 65000, UB],
    ["마르텔 노블리지", "Martell Noblige", "꼬냑", 40, "프랑스", "꼬냑", "Martell", 75000, UB],
    ["마르텔 로르 드 장 마르텔", "Martell L'Or de Jean Martell", "꼬냑 최고급", 40, "프랑스", "꼬냑", "Martell", 4500000, UB],
    ["쿠르브와지에 VS", "Courvoisier VS", "꼬냑 VS", 40, "프랑스", "꼬냑 자르낙", "Courvoisier", 40000, UB],
    ["쿠르브와지에 VSOP", "Courvoisier VSOP", "꼬냑 VSOP", 40, "프랑스", "꼬냑 자르낙", "Courvoisier", 65000, UB],
    ["까뮤 VSOP", "Camus VSOP", "꼬냑 VSOP", 40, "프랑스", "꼬냑", "Camus", 60000, UB],
    ["까뮤 엑스트라", "Camus Extra", "꼬냑 엑스트라", 40, "프랑스", "꼬냑", "Camus", 450000, UB],
    ["까뮤 보르드리 XO", "Camus Borderies XO", "꼬냑 XO", 40, "프랑스", "꼬냑 보르드리", "Camus", 200000, UB],
    ["하인 레어 VSOP", "Hine Rare VSOP", "꼬냑 VSOP (Fine Champagne)", 40, "프랑스", "꼬냑", "Thomas Hine & Co", 75000, UB],
    ["피에르 페랑 앙브르", "Pierre Ferrand Ambre", "꼬냑 (Grande Champagne)", 40, "프랑스", "꼬냑 그랑드 샹파뉴", "Maison Ferrand", 70000, UB],
    ["오타르 VSOP", "Otard VSOP", "꼬냑 VSOP", 40, "프랑스", "꼬냑", "Bacardi", 55000, UB],
    ["오타르 XO", "Otard XO", "꼬냑 XO", 40, "프랑스", "꼬냑", "Bacardi", 170000, UB],
    ["델라맹 페일 앤 드라이 XO", "Delamain Pale & Dry XO", "꼬냑 XO (Grande Champagne)", 40, "프랑스", "꼬냑 그랑드 샹파뉴", "Delamain", 180000, UB],
    ["프라팽 VSOP", "Frapin VSOP Grande Champagne", "꼬냑 VSOP", 40, "프랑스", "꼬냑 그랑드 샹파뉴", "Frapin", 90000, UB],
    ["레미 마르땡 클럽", "Rémy Martin Club", "꼬냑", 40, "프랑스", "꼬냑 핀 샹파뉴", "Rémy Martin", 65000, UB],
    ["레미 마르땡 테르세", "Rémy Martin Tercet", "꼬냑", 42.2, "프랑스", "꼬냑 핀 샹파뉴", "Rémy Martin", 180000, UB],
    ["헤네시 리샤르", "Hennessy Richard", "꼬냑 최고급", 40, "프랑스", "꼬냑", "Hennessy", 6500000, UB],
    ["헤네시 XXO", "Hennessy X.X.O", "꼬냑 XXO", 40, "프랑스", "꼬냑", "Hennessy", 700000, UB],
  ]);
  rows("cognac", "cognac", [
    ["메탁사 5스타", "Metaxa 5 Stars", "그리스 브랜디 · 아마라", 38, "그리스", "—", "Rémy Cointreau", 30000, "Savatiano/Muscat 와인"],
    ["메탁사 7스타", "Metaxa 7 Stars", "그리스 브랜디 · 아마라", 40, "그리스", "—", "Rémy Cointreau", 40000, "Savatiano/Muscat 와인"],
    ["메탁사 12스타", "Metaxa 12 Stars", "그리스 브랜디 · 아마라", 40, "그리스", "—", "Rémy Cointreau", 70000, "Savatiano/Muscat 와인"],
    ["토레스 10 그란 레세르바", "Torres 10 Gran Reserva Brandy", "스페인 브랜디", 38, "스페인", "페네데스", "Familia Torres", 40000, "Parellada/Ugni Blanc"],
    ["카를로스 1세", "Carlos I Brandy de Jerez Solera Gran Reserva", "브랜디 데 헤레스", 40, "스페인", "헤레스", "Bodegas Osborne", 60000, "Airén/Palomino"],
    ["생 레미 XO", "St-Rémy XO", "프렌치 브랜디", 40, "프랑스", "—", "Rémy Cointreau", 30000, "Ugni Blanc/Colombard"],
    ["크리스티앙 드루앵 칼바도스 VSOP", "Christian Drouin Calvados Pays d'Auge VSOP", "칼바도스 (사과 브랜디)", 40, "프랑스", "노르망디 페이 도주", "Christian Drouin", 85000, "사과/배"],
    ["불라르 칼바도스", "Boulard Calvados Pays d'Auge Grand Solage", "칼바도스 (사과 브랜디)", 40, "프랑스", "노르망디", "Boulard", 55000, "사과"],
    ["샤토 드 로바드 VSOP", "Château de Laubade VSOP", "아르마냑", 40, "프랑스", "바 아르마냑", "Château de Laubade", 75000, "Ugni Blanc/Baco/Colombard"],
    ["자노 VSOP", "Janneau VSOP Armagnac", "아르마냑", 40, "프랑스", "아르마냑", "Janneau", 55000, "Ugni Blanc/Baco"],
    ["노니노 그라파", "Nonino Grappa Il Moscato", "그라파", 41, "이탈리아", "프리울리", "Nonino", 85000, "모스카토 포도 찌꺼기"],
    ["피스코 카펠", "Capel Pisco Reservado", "피스코", 35, "칠레", "엘키 밸리", "Capel", 25000, "Muscat"],
  ]);

  /* ── 중국술 ── */
  rows("baijiu", "baijiu", [
    ["마오타이 왕자주", "Moutai Prince|茅台王子酒", "장향형 백주", 53, "중국", "구이저우 마오타이진", "贵州茅台", 60000, "수수/밀(누룩)"],
    ["마오타이 영빈주", "Moutai Yingbin|茅台迎宾酒", "장향형 백주", 53, "중국", "구이저우 마오타이진", "贵州茅台", 40000, "수수/밀(누룩)"],
    ["마오타이 1935", "Moutai 1935|茅台1935", "장향형 백주", 53, "중국", "구이저우 마오타이진", "贵州茅台", 250000, "수수/밀(누룩)"],
    ["우량춘", "Wuliangchun|五粮春", "농향형 백주", 45, "중국", "쓰촨 이빈", "五粮液集团", 70000, "수수/쌀/찹쌀/밀/옥수수"],
    ["노주노교 특곡", "Luzhou Laojiao Tequ|泸州老窖特曲", "농향형 백주", 52, "중국", "쓰촨 루저우", "泸州老窖", 60000, "수수/밀(누룩)"],
    ["분주 파분", "Fenjiu Bofen|玻汾", "청향형 백주", 53, "중국", "산시 싱화춘", "山西杏花村汾酒", 20000, "수수/보리·완두(누룩)"],
    ["분주 청화 20", "Fenjiu Qinghua 20|青花汾酒20", "청향형 백주", 53, "중국", "산시 싱화춘", "山西杏花村汾酒", 90000, "수수/보리·완두(누룩)"],
    ["습주 교장 1988", "Xijiu Jiaocang 1988|习酒窖藏1988", "장향형 백주", 53, "중국", "구이저우 시수이", "贵州习酒", 150000, "수수/밀(누룩)"],
    ["동주", "Dongjiu|董酒", "동향형 백주", 54, "중국", "구이저우 쭌이", "贵州董酒", 120000, "수수/약재 누룩"],
    ["주귀주", "Jiugui Jiu|酒鬼酒", "복욱향형 백주", 52, "중국", "후난 샹시", "酒鬼酒股份", 120000, "수수/쌀/찹쌀/밀/옥수수"],
    ["사득", "Shede|舍得", "농향형 백주", 52, "중국", "쓰촨 쓰훙", "舍得酒业", 110000, "수수/쌀/찹쌀/밀/옥수수"],
    ["양하 천지람", "Yanghe Sky Blue|洋河天之蓝", "면유형 백주", 52, "중국", "장쑤 쑤첸", "江苏洋河", 70000, "수수/밀·보리·완두"],
    ["양하 해지람", "Yanghe Ocean Blue|洋河海之蓝", "면유형 백주", 52, "중국", "장쑤 쑤첸", "江苏洋河", 45000, "수수/밀·보리·완두"],
    ["우란산 이과두주", "Niulanshan Erguotou|牛栏山二锅头", "청향형 백주", 56, "중국", "베이징", "北京顺鑫牛栏山", 10000, "수수"],
    ["형수 노백간", "Hengshui Laobaigan|衡水老白干", "노백간향형 백주", 67, "중국", "허베이 헝수이", "衡水老白干", 40000, "수수"],
    ["백운변", "Baiyunbian|白云边", "겸향형 백주", 42, "중국", "후베이 쑹쯔", "白云边酒业", 35000, "수수"],
    ["금문고량주 38도", "Kinmen Kaoliang 38%|金門高粱酒 38度", "청향형 고량주", 38, "대만", "진먼", "金門酒廠", 25000, "수수/밀(누룩)"],
    ["홍성 이과두주 블루보틀", "Hongxing Erguotou Blue Bottle|红星蓝瓶二锅头", "청향형 백주", 43, "중국", "베이징", "北京红星", 10000, "수수"],
    ["징주 (경주)", "Jing Jiu|劲酒", "보건주", 35, "중국", "후베이", "劲牌", 15000, "백주/약재"],
    ["소흥주 고월용산 5년", "Guyue Longshan Shaoxing Huangjiu 5 Years|古越龙山 绍兴黄酒", "황주 (소흥주)", 14, "중국", "저장 사오싱", "古越龙山", 20000, "찹쌀/밀(누룩)", "yakju"],
    ["탑패 소흥주", "Pagoda Shaoxing Huadiao|塔牌 绍兴花雕酒", "황주 (소흥주)", 15, "중국", "저장 사오싱", "塔牌", 18000, "찹쌀/밀(누룩)", "yakju"],
  ]);

  /* ── 기타 증류주 · 리큐어 ── */
  const O = (preset, list) => rows("other", preset, list);
  O("spirit", [
    ["앱솔루트 보드카", "Absolut Vodka", "보드카", 40, "스웨덴", "오후스", "Pernod Ricard", 25000, "겨울밀"],
    ["앱솔루트 시트론", "Absolut Citron", "플레이버드 보드카", 40, "스웨덴", "오후스", "Pernod Ricard", 27000, "겨울밀/레몬향"],
    ["그레이 구스", "Grey Goose", "보드카", 40, "프랑스", "코냐크 지역", "Bacardi", 55000, "프랑스산 밀"],
    ["벨베데레", "Belvedere", "보드카", 40, "폴란드", "지라르두프", "Moët Hennessy", 55000, "호밀"],
    ["스미노프 레드", "Smirnoff No. 21", "보드카", 37.5, "영국", "—", "Diageo", 18000, "곡물"],
    ["케텔 원", "Ketel One", "보드카", 40, "네덜란드", "스키담", "Diageo", 40000, "밀"],
    ["스톨리치나야", "Stolichnaya", "보드카", 40, "라트비아", "리가", "Stoli Group", 25000, "밀/호밀"],
    ["러시안 스탠다드", "Russian Standard Original", "보드카", 40, "러시아", "상트페테르부르크", "Roust", 25000, "겨울밀"],
    ["핀란디아", "Finlandia", "보드카", 40, "핀란드", "코스켄코르바", "Coca-Cola HBC", 25000, "보리"],
    ["시락", "Cîroc", "보드카", 40, "프랑스", "—", "Diageo", 50000, "포도"],
    ["티토스", "Tito's Handmade Vodka", "보드카", 40, "미국", "텍사스 오스틴", "Fifth Generation", 35000, "옥수수"],
    ["벨루가 노블", "Beluga Noble", "보드카", 40, "러시아", "시베리아", "Beluga Group", 60000, "몰트 보리"],
    ["스카이 보드카", "Skyy Vodka", "보드카", 40, "미국", "—", "Campari Group", 20000, "곡물"],
    ["주브로브카 바이슨 그래스", "Żubrówka Bison Grass", "플레이버드 보드카", 37.5, "폴란드", "비아위스토크", "Maspex", 25000, "호밀/바이슨 그래스"],
    ["탱커레이 런던 드라이 진", "Tanqueray London Dry Gin", "런던 드라이 진", 43.1, "영국", "스코틀랜드 캐머런브리지", "Diageo", 30000, "주니퍼/고수/안젤리카/감초"],
    ["탱커레이 넘버 텐", "Tanqueray No. Ten", "진", 47.3, "영국", "스코틀랜드", "Diageo", 50000, "주니퍼/자몽/라임/카모마일"],
    ["봄베이 사파이어", "Bombay Sapphire", "런던 드라이 진", 47, "영국", "햄프셔 라버스토크", "Bacardi", 30000, "주니퍼 등 보태니컬 10종"],
    ["헨드릭스", "Hendrick's Gin", "진", 41.4, "영국", "스코틀랜드 거번", "William Grant & Sons", 50000, "주니퍼/오이/장미"],
    ["비피터", "Beefeater London Dry", "런던 드라이 진", 40, "영국", "런던", "Pernod Ricard", 25000, "주니퍼/세비야 오렌지/레몬"],
    ["고든스", "Gordon's London Dry Gin", "런던 드라이 진", 37.5, "영국", "—", "Diageo", 18000, "주니퍼/고수/안젤리카"],
    ["몽키 47", "Monkey 47 Schwarzwald Dry Gin", "진", 47, "독일", "슈바르츠발트", "Pernod Ricard", 85000, "주니퍼 등 보태니컬 47종"],
    ["로쿠 진", "Roku Gin|ROKU", "재패니즈 진", 43, "일본", "오사카", "Suntory", 40000, "주니퍼/벚꽃/유자/센차"],
    ["더 보타니스트", "The Botanist Islay Dry Gin", "진", 46, "영국", "스코틀랜드 아일라", "Rémy Cointreau", 55000, "주니퍼 등 아일라 보태니컬 22종"],
    ["십스미스 런던 드라이", "Sipsmith London Dry Gin", "런던 드라이 진", 41.6, "영국", "런던", "Suntory Global Spirits", 50000, "주니퍼 등 보태니컬"],
    ["말피 진 콘 리모네", "Malfy Gin Con Limone", "진", 41, "이탈리아", "토리노", "Pernod Ricard", 40000, "주니퍼/아말피 레몬"],
    ["진 마레", "Gin Mare", "진", 42.7, "스페인", "빌라노바", "Pernod Ricard", 55000, "주니퍼/올리브/로즈메리/바질"],
    ["니카 코페이 진", "Nikka Coffey Gin", "재패니즈 진", 47, "일본", "미야기", "Nikka (Asahi)", 60000, "주니퍼/유자/산초"],
    ["키노비 교토 드라이 진", "Ki No Bi Kyoto Dry Gin|季の美", "재패니즈 진", 45.7, "일본", "교토", "The Kyoto Distillery", 75000, "주니퍼/유자/교쿠로/산초"],
    ["바카디 카르타 블랑카", "Bacardí Carta Blanca", "화이트 럼", 40, "푸에르토리코", "—", "Bacardi", 20000, "사탕수수 당밀"],
    ["바카디 카르타 네그라", "Bacardí Carta Negra", "다크 럼", 40, "푸에르토리코", "—", "Bacardi", 25000, "사탕수수 당밀"],
    ["캡틴 모건 스파이스드", "Captain Morgan Original Spiced Gold", "스파이스드 럼", 35, "자메이카", "—", "Diageo", 22000, "사탕수수 당밀/향신료"],
    ["하바나 클럽 3년", "Havana Club Añejo 3 Años", "화이트 럼", 40, "쿠바", "—", "Pernod Ricard", 25000, "사탕수수 당밀"],
    ["하바나 클럽 7년", "Havana Club Añejo 7 Años", "다크 럼", 40, "쿠바", "—", "Pernod Ricard", 40000, "사탕수수 당밀"],
    ["디플로마티코 레세르바 엑스클루시바", "Diplomático Reserva Exclusiva", "다크 럼", 40, "베네수엘라", "—", "Destilerías Unidas", 60000, "사탕수수 꿀"],
    ["론 자카파 23", "Ron Zacapa Centenario 23", "다크 럼", 40, "과테말라", "케찰테낭고", "Diageo", 85000, "사탕수수 꿀"],
    ["크라켄 블랙 스파이스드", "The Kraken Black Spiced Rum", "스파이스드 럼", 40, "트리니다드 토바고", "—", "Proximo", 35000, "사탕수수 당밀/향신료"],
    ["플랜테이션 3 스타즈", "Plantation 3 Stars", "화이트 럼", 41.2, "카리브해", "바베이도스·자메이카·트리니다드", "Maison Ferrand", 35000, "사탕수수 당밀"],
    ["호세 쿠에르보 에스페셜 골드", "Jose Cuervo Especial Gold", "데킬라 (믹스토)", 38, "멕시코", "할리스코", "Becle", 25000, "블루 아가베"],
    ["1800 실버", "1800 Silver", "데킬라 블랑코", 40, "멕시코", "할리스코", "Becle", 40000, "블루 아가베 100%"],
    ["1800 레포사도", "1800 Reposado", "데킬라 레포사도", 40, "멕시코", "할리스코", "Becle", 45000, "블루 아가베 100%"],
    ["패트론 실버", "Patrón Silver", "데킬라 블랑코", 40, "멕시코", "할리스코 하이랜드", "Bacardi", 65000, "블루 아가베 100%"],
    ["패트론 레포사도", "Patrón Reposado", "데킬라 레포사도", 40, "멕시코", "할리스코 하이랜드", "Bacardi", 75000, "블루 아가베 100%"],
    ["돈 훌리오 블랑코", "Don Julio Blanco", "데킬라 블랑코", 40, "멕시코", "할리스코 하이랜드", "Diageo", 70000, "블루 아가베 100%"],
    ["돈 훌리오 1942", "Don Julio 1942", "데킬라 아녜호", 40, "멕시코", "할리스코 하이랜드", "Diageo", 300000, "블루 아가베 100%"],
    ["카사미고스 블랑코", "Casamigos Blanco", "데킬라 블랑코", 40, "멕시코", "할리스코 하이랜드", "Diageo", 75000, "블루 아가베 100%"],
    ["올메카 알토스 플라타", "Olmeca Altos Plata", "데킬라 블랑코", 38, "멕시코", "할리스코 하이랜드", "Pernod Ricard", 40000, "블루 아가베 100%"],
    ["델 마게이 비다", "Del Maguey Vida", "메스칼", 42, "멕시코", "오악사카", "Del Maguey (Pernod Ricard)", 70000, "에스파딘 아가베"],
    ["압생트 페르노", "Pernod Absinthe", "압생트", 68, "프랑스", "—", "Pernod Ricard", 70000, "웜우드/아니스/펜넬"],
  ]);
  O("liqueur", [
    ["예거마이스터", "Jägermeister", "허브 리큐어", 35, "독일", "볼펜뷔텔", "Mast-Jägermeister", 28000, "허브·향신료 56종"],
    ["베일리스 오리지널", "Baileys Original Irish Cream", "크림 리큐어", 17, "아일랜드", "더블린", "Diageo", 25000, "아이리시 위스키/크림/코코아"],
    ["깔루아", "Kahlúa", "커피 리큐어", 16, "멕시코", "베라크루스", "Pernod Ricard", 22000, "아라비카 커피/럼/설탕"],
    ["쿠앵트로", "Cointreau", "오렌지 리큐어 (트리플 섹)", 40, "프랑스", "앙제", "Rémy Cointreau", 35000, "비터·스위트 오렌지 껍질"],
    ["그랑 마르니에", "Grand Marnier Cordon Rouge", "오렌지 리큐어", 40, "프랑스", "—", "Campari Group", 40000, "꼬냑/비터 오렌지"],
    ["캄파리", "Campari", "비터 리큐어", 25, "이탈리아", "밀라노", "Campari Group", 28000, "허브·과일 (비공개)"],
    ["아페롤", "Aperol", "아페리티보", 11, "이탈리아", "파도바", "Campari Group", 25000, "비터 오렌지/루바브/겐티안"],
    ["디사론노", "Disaronno Originale", "아마레토", 28, "이탈리아", "사론노", "Illva Saronno", 30000, "살구씨 오일/허브"],
    ["말리부", "Malibu Original", "코코넛 럼 리큐어", 21, "바베이도스", "—", "Pernod Ricard", 20000, "카리브 럼/코코넛"],
    ["미도리", "Midori Melon Liqueur|ミドリ", "멜론 리큐어", 20, "일본", "—", "Suntory", 25000, "머스크멜론"],
    ["리코르 43", "Licor 43", "바닐라 리큐어", 31, "스페인", "카르타헤나", "Diego Zamora", 35000, "감귤/바닐라 등 43종"],
    ["프란젤리코", "Frangelico", "헤이즐넛 리큐어", 20, "이탈리아", "피에몬테", "Campari Group", 30000, "헤이즐넛/코코아/바닐라"],
    ["드람뷔", "Drambuie", "위스키 리큐어", 40, "영국", "스코틀랜드", "William Grant & Sons", 40000, "스카치 위스키/헤더 꿀/허브"],
    ["샤르트뢰즈 그린", "Chartreuse Verte", "허브 리큐어", 55, "프랑스", "보아롱", "Chartreuse Diffusion", 85000, "허브 130종"],
    ["베네딕틴 D.O.M", "Bénédictine D.O.M", "허브 리큐어", 40, "프랑스", "페캉", "Bacardi", 45000, "허브·향신료 27종"],
    ["빌라 마사 리몬첼로", "Villa Massa Limoncello", "레몬 리큐어", 30, "이탈리아", "소렌토", "Villa Massa", 30000, "소렌토 레몬"],
    ["서던 컴포트", "Southern Comfort Original", "위스키 리큐어", 35, "미국", "—", "Sazerac", 25000, "위스키/과일·향신료"],
    ["파이어볼", "Fireball Cinnamon", "시나몬 위스키 리큐어", 33, "캐나다", "—", "Sazerac", 22000, "캐나디안 위스키/시나몬"],
    ["피치 트리", "Peachtree", "복숭아 리큐어", 20, "네덜란드", "—", "Diageo", 18000, "복숭아"],
    ["볼스 블루 큐라소", "Bols Blue Curaçao", "오렌지 리큐어", 21, "네덜란드", "암스테르담", "Lucas Bols", 18000, "라라하 오렌지 껍질"],
    ["마티니 로쏘", "Martini Rosso", "스위트 베르무트", 15, "이탈리아", "토리노", "Bacardi", 15000, "화이트 와인/허브"],
    ["마티니 엑스트라 드라이", "Martini Extra Dry", "드라이 베르무트", 15, "이탈리아", "토리노", "Bacardi", 15000, "화이트 와인/허브"],
    ["친자노 로쏘", "Cinzano Rosso", "스위트 베르무트", 15, "이탈리아", "토리노", "Campari Group", 13000, "화이트 와인/허브"],
    ["초야 우메슈", "Choya Umeshu|チョーヤ梅酒", "매실주", 15, "일본", "오사카", "Choya", 15000, "매실/설탕/증류주"],
    ["초야 더 우메슈 블랙", "Choya The Umeshu Black|チョーヤ The 梅酒 BLACK", "매실주", 17, "일본", "오사카", "Choya", 30000, "매실/브랜디"],
    ["갈리아노", "Galliano L'Autentico", "허브 리큐어", 42.3, "이탈리아", "—", "Lucas Bols", 40000, "바닐라/아니스/허브"],
    ["삼부카 몰리나리", "Molinari Sambuca Extra", "아니스 리큐어", 40, "이탈리아", "로마", "Molinari", 35000, "스타 아니스"],
  ]);
  // 일본 소주(쇼추)
  O("shochu", [
    ["쿠로 키리시마", "Kuro Kirishima|黒霧島", "고구마 소주 (이모 쇼추)", 25, "일본", "미야자키", "霧島酒造", 25000, "고구마/흑국"],
    ["시로 키리시마", "Shiro Kirishima|白霧島", "고구마 소주 (이모 쇼추)", 25, "일본", "미야자키", "霧島酒造", 25000, "고구마/백국"],
    ["니카이도", "Nikaido Mugi|二階堂", "보리 소주 (무기 쇼추)", 25, "일본", "오이타", "二階堂酒造", 25000, "보리/보리 누룩"],
    ["이이치코", "Iichiko Silhouette|いいちこ", "보리 소주 (무기 쇼추)", 25, "일본", "오이타", "三和酒類", 20000, "보리/보리 누룩"],
    ["햐쿠넨노 코도쿠", "Hyakunen no Kodoku|百年の孤独", "숙성 보리 소주", 40, "일본", "미야자키", "黒木本店", 200000, "보리/보리 누룩"],
    ["모리 이조", "Mori Izo|森伊蔵", "고구마 소주 (프리미엄)", 25, "일본", "가고시마", "森伊蔵酒造", 450000, "고구마/쌀 누룩"],
    ["마오", "Maou|魔王", "고구마 소주 (프리미엄)", 25, "일본", "가고시마", "白玉醸造", 250000, "고구마/쌀 누룩"],
    ["무라오", "Murao|村尾", "고구마 소주 (프리미엄)", 25, "일본", "가고시마", "村尾酒造", 250000, "고구마/쌀 누룩"],
    ["토미노 호잔", "Tomino Hozan|富乃宝山", "고구마 소주", 25, "일본", "가고시마", "西酒造", 40000, "고구마/쌀 누룩"],
    ["세키토바", "Sekitoba|赤兎馬", "고구마 소주", 25, "일본", "가고시마", "濵田酒造", 45000, "고구마/쌀 누룩"],
    ["킷초무", "Kitchomu|吉四六", "보리 소주", 25, "일본", "오이타", "二階堂酒造", 45000, "보리/보리 누룩"],
    ["탄타카탄", "Tantakatan|鍛高譚", "차조기 소주", 20, "일본", "홋카이도", "合同酒精", 20000, "차조기/주정"],
    ["나카나카", "Nakanaka|中々", "보리 소주", 25, "일본", "미야자키", "黒木本店", 70000, "보리/보리 누룩"],
    ["사토 쿠로", "Sato Kuro|佐藤 黒", "고구마 소주", 25, "일본", "가고시마", "佐藤酒造", 90000, "고구마/흑국"],
    ["쿠로 이사니시키", "Kuro Isanishiki|黒伊佐錦", "고구마 소주", 25, "일본", "가고시마", "大口酒造", 25000, "고구마/흑국"],
  ]);
})();
