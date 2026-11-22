/* 술사전 추가 데이터 — 한국에서 많이 마시는 술 100종
 * 가격: 해외 소매 참고 범위(USD) · 평가: 근사치/통상 범위 또는 '확인'(최신 점수는 앱의 AI 조회·출처 링크)
 */
(() => {
  /* ── 페어링 프리셋 ── */
  const P = {
    redFull: { good: ["소고기 스테이크·갈비", "양갈비", "숙성 하드치즈", "버섯 요리"], avoid: ["날생선·굴", "매운 양념", "단 디저트"], temp: "16~18℃", glass: "보르도 글라스", decant: "30분~1시간", caution: "탄닌이 단단한 어린 빈티지는 디캔팅 권장." },
    redIcon: { good: ["드라이 에이징 스테이크", "양갈비", "트러플 요리", "숙성 콩테"], avoid: ["날생선", "매운·단 양념"], temp: "16~18℃", glass: "보르도 글라스", decant: "어린 빈티지 2시간 이상", caution: "고가 와인은 가품이 많으니 정식 수입·인증 확인. 올드 빈티지는 침전물 분리용 짧은 디캔팅." },
    redMed: { good: ["삼겹살·목살 구이", "피자·파스타", "불고기", "햄·살라미"], avoid: ["회·초밥", "매운 찌개"], temp: "15~17℃", glass: "레드 와인 글라스", decant: "불필요~30분", caution: "가볍게 칠링(15℃ 전후)하면 과실감이 산다." },
    pinot: { good: ["오리 가슴살", "연어 구이", "버섯 리조토", "닭고기 요리"], avoid: ["강한 양념 고기", "매운 음식"], temp: "14~16℃", glass: "부르고뉴(벌룬) 글라스", decant: "불필요", caution: "높은 온도에서 알코올감이 튀니 약간 시원하게." },
    italian: { good: ["토마토 라구 파스타", "피자", "숙성 파르미지아노", "구운 소고기"], avoid: ["굴·날생선", "단 디저트"], temp: "16~18℃", glass: "레드 와인 글라스", decant: "30분~1시간", caution: "산도가 높아 토마토 소스와 잘 맞는다." },
    spanish: { good: ["하몽·초리소", "양고기 구이", "타파스", "만체고 치즈"], avoid: ["섬세한 회", "매운 음식"], temp: "16~18℃", glass: "레드 와인 글라스", decant: "30분", caution: "오크 숙성 리오하는 바닐라 향이 있어 훈연 요리와 좋다." },
    whiteCrisp: { good: ["굴·조개", "회·세비체", "샐러드", "튀김"], avoid: ["진한 레드 소스 육류"], temp: "7~10℃", glass: "화이트 글라스", decant: "불필요", caution: "신선할 때(출시 1~3년) 마시는 것이 좋다." },
    sweet: { good: ["과일·과일 타르트", "치즈 케이크", "매콤한 한식(떡볶이)", "블루치즈"], avoid: ["스테이크", "와인보다 단 디저트"], temp: "6~8℃", glass: "화이트/플루트 글라스", decant: "불필요", caution: "저알코올·단맛이라 술술 넘어가니 과음 주의." },
    bubbly: { good: ["캐비어·굴", "튀김·프라이드치킨", "스시", "카나페"], avoid: ["초콜릿 디저트", "진한 토마토 소스"], temp: "8~10℃", glass: "튤립/화이트 글라스", decant: "불필요", caution: "너무 차가우면(5℃ 이하) 향이 닫힌다. 병은 45°로 기울여 조용히 오픈." },
    sakeGinjo: { good: ["흰살생선 사시미", "가리비·관자", "카르파초", "과일"], avoid: ["진한 양념 구이", "토마토·데미글라스 소스"], temp: "8~12℃", glass: "와인 글라스 또는 얇은 잔", decant: "불필요", caution: "데우면 긴죠향이 날아가므로 차게. 개봉 후 냉장 1~2주 내." },
    sakeJunmai: { good: ["생선구이", "오뎅·나베", "야키토리", "두부 요리"], avoid: ["단 디저트", "토마토 소스"], temp: "상온 또는 누루칸(40~45℃)", glass: "오쵸코", decant: "불필요", caution: "데워도 맛이 살아나는 타입 — 겨울엔 칸(데운 술) 추천." },
    sakeNama: { good: ["가라아게", "교자", "카르파초", "생햄"], avoid: ["섬세한 다이긴죠용 요리"], temp: "5~8℃", glass: "와인 글라스", decant: "불필요", caution: "비살균 생주 — 냉장 보관 필수, 개봉 후 빠르게." },
    scotchLight: { good: ["훈제연어", "흰살생선 구이", "브리 치즈", "과일"], avoid: ["매운 양념"], temp: "상온 / 하이볼", glass: "글렌캐런", decant: "물 몇 방울", caution: "입문용·하이볼 베이스로 적합." },
    scotchSherry: { good: ["다크초콜릿", "말린 과일·견과", "육포", "숙성 치즈"], avoid: ["회·초밥", "매운 요리"], temp: "상온", glass: "글렌캐런", decant: "물 몇 방울", caution: "셰리 캐스크 특유의 단맛 — 식후주로 좋다." },
    scotchPeat: { good: ["생굴", "훈제 연어·고등어", "블루치즈", "바비큐"], avoid: ["섬세한 회·과일 디저트"], temp: "상온", glass: "글렌캐런", decant: "물 몇 방울", caution: "피트 향이 강해 같은 자리의 섬세한 술을 덮으니 마지막 순서로." },
    blend: { good: ["육포·견과", "치즈", "다크초콜릿", "하이볼과 튀김"], avoid: ["짜고 매운 안주"], temp: "상온 / 온더락 / 하이볼", glass: "록 글라스", decant: "불필요", caution: "선물 수요가 많아 면세가·시중가 차이가 큼." },
    japanese: { good: ["장어구이", "야키토리", "다크초콜릿", "튀김(하이볼)"], avoid: ["매운 음식"], temp: "상온 / 미즈와리 / 하이볼", glass: "글렌캐런·하이볼잔", decant: "물 소량", caution: "일본 위스키는 품귀로 리셀가가 형성되는 경우가 많음." },
    bourbon: { good: ["바비큐 립", "베이컨·버거", "피칸파이", "훈제 고기"], avoid: ["섬세한 해산물"], temp: "상온 / 온더락", glass: "록 글라스", decant: "불필요", caution: "올드패션드·위스키 사워 등 칵테일 베이스로도 좋다." },
    irish: { good: ["피시앤칩스", "스튜", "체다 치즈", "아이리시 커피"], avoid: ["매운 음식"], temp: "상온 / 하이볼", glass: "록 글라스", decant: "불필요", caution: "부드러워 입문용으로 좋다." },
    cognac: { good: ["다크초콜릿", "시가", "푸아그라", "견과류"], avoid: ["짠 해산물", "매운 요리"], temp: "상온(18~20℃)", glass: "튤립 글라스", decant: "잔에서 5~10분", caution: "손으로 과하게 데우면 알코올 향만 올라온다." },
    baijiu: { good: ["북경오리·동파육", "탕수육", "양꼬치", "땅콩·냉채"], avoid: ["회·초밥", "탄산·맥주 혼합", "공복 음용"], temp: "상온", glass: "소형 백주잔", decant: "불필요", caution: "고도주 — 물과 함께 소량씩." },
  };
  const V = (x) => ({ src: "Vivino", score: String(x), note: "사용자 평균 근사치" });
  const C = (src, note = "최신 점수·수상은 AI 조회/출처 링크로 확인") => ({ src, score: "확인", note });
  const RR = (score, note = "최근 빈티지 통상 범위") => ({ src: "Robert Parker (Wine Advocate)", score, note });
  const WS = (score, note = "최근 빈티지 통상 범위") => ({ src: "Wine Spectator", score, note });
  const SF = (note = "수상 이력 — 연도별 확인") => ({ src: "San Francisco WSC", score: "수상", note });
  const IW = (note = "수상 이력 — 연도별 확인") => ({ src: "IWSC", score: "수상", note });
  const NOWA = (score = "인기", note = "さけのわ 인기 브랜드 — 실시간 순위는 랭킹 탭") => ({ src: "さけのわ (Sakenowa)", score, note });
  const MJ = (note) => ({ src: "中国名酒(全国评酒会)", score: "명주", note });

  const g = (...a) => a.map(([name, pct, note]) => ({ name, pct, note }));
  const T = (nose, palate, finish) => ({ nose, palate, finish });
  const add = (o) => {
    const { p, pc, ...rest } = o;
    window.LIQUORS.push({ ...rest, pairing: { ...P[p], ...(pc ? { caution: pc } : {}) } });
  };

  /* ═════════════ 와인 36 ═════════════ */
  add({ id: "montes-alpha-cs", cat: "wine", ko: "몬테스 알파 카베르네 소비뇽", en: "Montes Alpha Cabernet Sauvignon", ja: "モンテス・アルファ カベルネ・ソーヴィニヨン", aliases: ["montes alpha", "몬테스알파"],
    producer: "Viña Montes", country: "칠레", region: "콜차구아 밸리", style: "레드 · 카베르네 소비뇽", abv: "14.5%",
    desc: "한국 수입 와인 판매 최상위권의 스테디셀러. 칠레 프리미엄 와인 붐을 이끈 몬테스의 대표작으로 진한 과실과 오크 풍미가 균형 잡혀 있다.",
    tasting: T("블랙커런트, 블랙체리, 바닐라, 민트", "풀바디, 부드러운 탄닌", "모카·향신료"), ingredients: g(["Cabernet Sauvignon", 90], ["Merlot", 10]),
    price: { usd: [20, 26] }, ratings: [V(3.8), WS("87–90"), C("James Suckling")], p: "redFull", pc: "한국식 고기구이와 궁합이 좋은 가성비 레드." });
  add({ id: "montes-alpha-m", cat: "wine", ko: "몬테스 알파 엠", en: "Montes Alpha M", ja: "モンテス・アルファ エム", aliases: ["montes m", "알파엠"],
    producer: "Viña Montes", country: "칠레", region: "콜차구아 · 아팔타", style: "레드 · 보르도 블렌드", abv: "14.5%",
    desc: "몬테스의 아이콘 와인. 아팔타 언덕 포도로 만든 보르도 스타일 블렌드로, 칠레 최고급 와인 중 하나로 꼽힌다.",
    tasting: T("카시스, 삼나무, 담배, 다크초콜릿", "농밀한 풀바디, 정제된 탄닌", "길고 우아함"), ingredients: g(["Cabernet Sauvignon", 80], ["Cabernet Franc", 10], ["Merlot", 5], ["Petit Verdot", 5]),
    price: { usd: [90, 120] }, ratings: [V(4.3), C("James Suckling"), C("Robert Parker (Wine Advocate)")], p: "redIcon" });
  add({ id: "purple-angel", cat: "wine", ko: "몬테스 퍼플 엔젤", en: "Montes Purple Angel", ja: "モンテス パープル・エンジェル", aliases: ["purple angel", "퍼플엔젤"],
    producer: "Viña Montes", country: "칠레", region: "콜차구아", style: "레드 · 카르메네르", abv: "15%",
    desc: "칠레의 상징 품종 카르메네르로 만든 몬테스의 프리미엄 레드. 진한 색과 스파이시한 풍미가 특징.",
    tasting: T("블랙베리, 후추, 파프리카, 초콜릿", "농밀하고 부드러움", "스파이시한 여운"), ingredients: g(["Carmenère", 92], ["Petit Verdot", 8]),
    price: { usd: [55, 75] }, ratings: [V(4.3), C("James Suckling")], p: "redFull" });
  add({ id: "1865-cs", cat: "wine", ko: "1865 싱글 빈야드 카베르네 소비뇽", en: "1865 Single Vineyard Cabernet Sauvignon (San Pedro)", aliases: ["1865", "일팔육오", "산페드로"],
    producer: "Viña San Pedro", country: "칠레", region: "마이포 밸리", style: "레드 · 카베르네 소비뇽", abv: "14.5%",
    desc: "'18홀을 65타에 치라'는 골프 마케팅으로 한국에서 크게 유명해진 칠레 와인. 단일 포도밭 카베르네의 진한 과실미.",
    tasting: T("블랙체리, 자두, 바닐라", "풀바디, 매끄러운 탄닌", "토스트·초콜릿"), ingredients: g(["Cabernet Sauvignon", 100]),
    price: { usd: [18, 25] }, ratings: [V(3.8), C("James Suckling")], p: "redFull" });
  add({ id: "casillero-cs", cat: "wine", ko: "까시예로 델 디아블로 카베르네 소비뇽", en: "Casillero del Diablo Cabernet Sauvignon", ja: "カッシェロ・デル・ディアブロ", aliases: ["casillero del diablo", "카시예로", "악마의 와인"],
    producer: "Concha y Toro", country: "칠레", region: "센트럴 밸리", style: "레드 · 카베르네 소비뇽", abv: "13.5%",
    desc: "'악마의 저장고' 전설로 유명한 콘차이토로의 데일리 와인. 편의점·마트에서 쉽게 구할 수 있는 대중적 칠레 레드.",
    tasting: T("체리, 블랙커런트, 바닐라", "미디엄 바디, 부드러움", "짧고 깔끔"), ingredients: g(["Cabernet Sauvignon", 100]),
    price: { usd: [10, 13] }, ratings: [V(3.5)], p: "redMed" });
  add({ id: "don-melchor", cat: "wine", ko: "돈 멜초", en: "Don Melchor", ja: "ドン・メルチョー", aliases: ["don melchor", "돈멜쵸"],
    producer: "Concha y Toro (Viña Don Melchor)", country: "칠레", region: "마이포 밸리 · 푸엔테 알토", style: "레드 · 카베르네 소비뇽", abv: "14.5%",
    desc: "칠레 최초의 아이콘급 카베르네 소비뇽. 안데스 산자락 푸엔테 알토의 단일 포도밭에서 생산하며 세계 평론가 고득점 단골.",
    tasting: T("카시스, 흑연, 삼나무, 제비꽃", "정교한 탄닌, 우아한 풀바디", "매우 길다"), ingredients: g(["Cabernet Sauvignon", 92], ["Cabernet Franc", 6], ["Merlot", 1], ["Petit Verdot", 1]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [110, 150] }, ratings: [V(4.4), RR("94–98"), C("James Suckling")], p: "redIcon" });
  add({ id: "almaviva", cat: "wine", ko: "알마비바", en: "Almaviva", ja: "アルマヴィーヴァ", aliases: ["almaviva"],
    producer: "Viña Almaviva (Baron Philippe de Rothschild × Concha y Toro)", country: "칠레", region: "마이포 밸리 · 푸엔테 알토", style: "레드 · 보르도 블렌드", abv: "14.5%",
    desc: "무통 로칠드 가문과 콘차이토로의 합작 와인. 칠레의 '오퍼스 원'으로 불리며 카르메네르를 블렌딩하는 것이 특징.",
    tasting: T("블랙커런트, 흑연, 허브, 카카오", "실키한 풀바디", "길고 우아함"), ingredients: g(["Cabernet Sauvignon", 70], ["Carmenère", 22], ["Cabernet Franc", 6], ["Petit Verdot", 2]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [130, 180] }, ratings: [V(4.5), RR("93–97"), C("James Suckling")], p: "redIcon" });
  add({ id: "escudo-rojo", cat: "wine", ko: "에스쿠도 로호 그란 레세르바", en: "Escudo Rojo Gran Reserva", aliases: ["escudo rojo", "에스쿠도로호"],
    producer: "Baron Philippe de Rothschild Chile", country: "칠레", region: "마이포 밸리", style: "레드 · 블렌드", abv: "14%",
    desc: "무통 로칠드 가문이 칠레에서 만드는 블렌드 와인. 합리적 가격에 보르도식 구조감을 보여준다.",
    tasting: T("블랙베리, 후추, 바닐라", "미디엄+ 바디", "스파이시한 여운"), ingredients: g(["Cabernet Sauvignon", 50], ["Carmenère", 30], ["Syrah", 15], ["Cabernet Franc", 5]),
    ingredientNote: "비율은 빈티지별 상이(추정치).", price: { usd: [18, 25] }, ratings: [V(3.7)], p: "redFull" });
  add({ id: "mouton", cat: "wine", ko: "샤또 무통 로칠드", en: "Château Mouton Rothschild", ja: "シャトー・ムートン・ロートシルト", aliases: ["mouton", "무똥", "무통"],
    producer: "Château Mouton Rothschild", country: "프랑스", region: "보르도 · 포이약", style: "레드 · 1855 그랑 크뤼 1등급", abv: "13~14%",
    desc: "1973년 2등급에서 1등급으로 승격된 유일한 샤또. 매년 유명 화가가 그리는 아트 레이블로도 유명하다.",
    tasting: T("카시스, 커피, 삼나무, 시가박스", "풍성하고 화려한 풀바디", "매우 길다"), ingredients: g(["Cabernet Sauvignon", 85], ["Merlot", 13], ["Cabernet Franc", 2]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [600, 900] }, ratings: [RR("95–100"), WS("94–99"), V(4.6)], p: "redIcon" });
  add({ id: "latour", cat: "wine", ko: "샤또 라뚜르", en: "Château Latour", ja: "シャトー・ラトゥール", aliases: ["latour", "라투르"],
    producer: "Château Latour", country: "프랑스", region: "보르도 · 포이약", style: "레드 · 1855 그랑 크뤼 1등급", abv: "13~14%",
    desc: "가장 남성적이고 장기 숙성형인 1등급. 2012 빈티지부터 앙프리뫼르 판매를 중단하고 숙성 후 출시하는 것으로 유명.",
    tasting: T("카시스, 흑연, 호두, 시가", "강건한 구조, 촘촘한 탄닌", "매우 길다"), ingredients: g(["Cabernet Sauvignon", 90], ["Merlot", 9], ["Petit Verdot", 1]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [600, 1000] }, ratings: [RR("95–100"), WS("94–99"), V(4.6)], p: "redIcon" });
  add({ id: "haut-brion", cat: "wine", ko: "샤또 오브리옹", en: "Château Haut-Brion", ja: "シャトー・オー・ブリオン", aliases: ["haut brion", "오브리온"],
    producer: "Domaine Clarence Dillon", country: "프랑스", region: "보르도 · 페삭 레오냥(그라브)", style: "레드 · 1855 그랑 크뤼 1등급", abv: "13.5~14.5%",
    desc: "1855 등급에서 메독 외 지역으로 유일하게 1등급에 오른 샤또. 흙·담배·스모키한 그라브 특유의 개성.",
    tasting: T("블랙베리, 담배, 그을린 흙, 트러플", "부드럽고 관능적인 질감", "긴 미네랄 여운"), ingredients: g(["Merlot", 45], ["Cabernet Sauvignon", 43], ["Cabernet Franc", 12]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [500, 800] }, ratings: [RR("95–100"), WS("94–99"), V(4.6)], p: "redIcon" });
  add({ id: "petrus", cat: "wine", ko: "페트뤼스", en: "Pétrus", ja: "ペトリュス", aliases: ["petrus", "페트루스"],
    producer: "Pétrus (Moueix 가문)", country: "프랑스", region: "보르도 · 포므롤", style: "레드 · 메를로", abv: "14~14.5%",
    desc: "점토 토양의 포므롤에서 메를로로 만드는 보르도 최고가 와인. 공식 등급은 없지만 1등급 이상의 위상.",
    tasting: T("블랙체리, 트러플, 모카, 제비꽃", "벨벳 같은 질감, 풍성함", "매우 길다"), ingredients: g(["Merlot", 100]),
    price: { usd: [4000, 6500] }, ratings: [RR("96–100"), WS("95–99"), V(4.7)], p: "redIcon" });
  add({ id: "cheval-blanc", cat: "wine", ko: "샤또 슈발 블랑", en: "Château Cheval Blanc", ja: "シャトー・シュヴァル・ブラン", aliases: ["cheval blanc", "슈발블랑"],
    producer: "Château Cheval Blanc (LVMH)", country: "프랑스", region: "보르도 · 생테밀리옹", style: "레드 · 카베르네 프랑 중심", abv: "14%",
    desc: "카베르네 프랑 비중이 높은 생테밀리옹 최정상 샤또. 2022년 생테밀리옹 등급 분류 참여를 거부하고 등급 밖으로 나왔다.",
    tasting: T("라즈베리, 제비꽃, 민트, 향신료", "실키하고 정교함", "길고 향기로움"), ingredients: g(["Cabernet Franc", 55], ["Merlot", 45]),
    ingredientNote: "빈티지별로 Cabernet Sauvignon 소량 포함.", price: { usd: [600, 900] }, ratings: [RR("95–100"), WS("94–99"), V(4.6)], p: "redIcon" });
  add({ id: "talbot", cat: "wine", ko: "샤또 딸보", en: "Château Talbot", ja: "シャトー・タルボ", aliases: ["talbot", "탈보"],
    producer: "Château Talbot", country: "프랑스", region: "보르도 · 생쥘리앙", style: "레드 · 1855 그랑 크뤼 4등급", abv: "13~13.5%",
    desc: "한국에서 특히 사랑받는 그랑 크뤼. 합리적 가격에 클래식 보르도의 구조감을 보여준다.",
    tasting: T("카시스, 삼나무, 가죽", "미디엄+ 바디, 단정한 탄닌", "중간 길이"), ingredients: g(["Cabernet Sauvignon", 66], ["Merlot", 26], ["Petit Verdot", 5], ["Cabernet Franc", 3]),
    price: { usd: [50, 80] }, ratings: [V(4.0), C("Robert Parker (Wine Advocate)")], p: "redFull" });
  add({ id: "mont-perat", cat: "wine", ko: "샤또 몽페라", en: "Château Mont-Pérat", ja: "シャトー・モンペラ", aliases: ["mont perat", "몽페라"],
    producer: "Vignobles Despagne", country: "프랑스", region: "보르도 · 카디약 코트 드 보르도", style: "레드 · 메를로 중심", abv: "13.5~14%",
    desc: "만화 '신의 물방울'에 등장하며 한국·일본에서 유명해진 보르도 레드. 부드럽고 과실미가 풍부해 입문자에게 인기.",
    tasting: T("자두, 블랙체리, 바닐라", "부드러운 미디엄+ 바디", "모카 여운"), ingredients: g(["Merlot", 70], ["Cabernet Sauvignon", 20], ["Cabernet Franc", 10]),
    ingredientNote: "비율 추정치.", price: { usd: [20, 30] }, ratings: [V(3.7)], p: "redMed" });
  add({ id: "jadot-bourgogne", cat: "wine", ko: "루이 자도 부르고뉴 피노 누아", en: "Louis Jadot Bourgogne Pinot Noir", ja: "ルイ・ジャド ブルゴーニュ ピノ・ノワール", aliases: ["louis jadot", "루이자도"],
    producer: "Maison Louis Jadot", country: "프랑스", region: "부르고뉴", style: "레드 · 피노 누아", abv: "12.5~13%",
    desc: "부르고뉴 대형 네고시앙 루이 자도의 기본급 피노 누아. 부르고뉴 입문용으로 무난한 선택.",
    tasting: T("체리, 라즈베리, 흙내음", "라이트~미디엄, 상쾌한 산미", "가볍고 깔끔"), ingredients: g(["Pinot Noir", 100]),
    price: { usd: [18, 25] }, ratings: [V(3.7)], p: "pinot" });
  add({ id: "kim-crawford-sb", cat: "wine", ko: "킴 크로포드 소비뇽 블랑", en: "Kim Crawford Sauvignon Blanc", ja: "キム・クロフォード ソーヴィニヨン・ブラン", aliases: ["kim crawford", "킴크로포드"],
    producer: "Kim Crawford", country: "뉴질랜드", region: "말보로", style: "화이트 · 소비뇽 블랑", abv: "12.5~13%",
    desc: "열대과일 향이 폭발적인 말보로 소비뇽 블랑. 마트·레스토랑에서 흔히 보는 대중적 화이트.",
    tasting: T("패션프루트, 자몽, 풀", "상쾌한 산미", "시트러스"), ingredients: g(["Sauvignon Blanc", 100]),
    price: { usd: [15, 19] }, ratings: [V(3.8), WS("87–90")], p: "whiteCrisp" });
  add({ id: "villa-m-bianco", cat: "wine", ko: "빌라 엠 비앙코", en: "Villa M Bianco", ja: "ヴィラ・エム ビアンコ", aliases: ["villa m", "빌라엠"],
    producer: "Gianni Gagliardo", country: "이탈리아", region: "피에몬테", style: "스위트 · 약발포(프리잔테) 모스카토", abv: "5.5%",
    desc: "한국에서 '달달한 와인'의 대명사가 된 모스카토. 낮은 도수와 은은한 기포, 꽃·복숭아 향으로 입문자에게 인기.",
    tasting: T("복숭아, 오렌지 꽃, 머스캣", "달콤하고 가벼움, 은은한 기포", "산뜻함"), ingredients: g(["Moscato Bianco", 100]),
    price: { usd: [15, 20] }, ratings: [V(3.9)], p: "sweet" });
  add({ id: "veuve-clicquot", cat: "wine", ko: "뵈브 클리코 옐로 라벨", en: "Veuve Clicquot Brut Yellow Label", ja: "ヴーヴ・クリコ イエローラベル", aliases: ["veuve clicquot", "뵈브클리코", "뵈브"],
    producer: "Veuve Clicquot Ponsardin (LVMH)", country: "프랑스", region: "샹파뉴", style: "스파클링 · 논빈티지 브뤼", abv: "12%",
    desc: "노란 레이블로 유명한 샴페인. 피노 누아 비중이 높아 과실미와 바디감이 풍부한 하우스 스타일.",
    tasting: T("사과, 배, 브리오슈, 바닐라", "풍성한 과실, 크리미한 기포", "토스트 여운"), ingredients: g(["Pinot Noir", 52], ["Chardonnay", 30], ["Pinot Meunier", 18]),
    price: { usd: [55, 70] }, ratings: [V(4.1), WS("89–92")], p: "bubbly" });
  add({ id: "krug-gc", cat: "wine", ko: "크룩 그랑 퀴베", en: "Krug Grande Cuvée", ja: "クリュッグ グランド・キュヴェ", aliases: ["krug", "크룩", "크루그"],
    producer: "Krug (LVMH)", country: "프랑스", region: "샹파뉴", style: "스파클링 · 프레스티지 퀴베", abv: "12%",
    desc: "10개 이상 빈티지, 100종이 넘는 원액을 블렌딩해 매년 '에디션'으로 출시하는 최고급 논빈티지 샴페인.",
    tasting: T("구운 견과, 브리오슈, 꿀, 시트러스", "풍부하고 복합적", "매우 긴 여운"), ingredients: g(["Pinot Noir", 45], ["Chardonnay", 35], ["Pinot Meunier", 20]),
    ingredientNote: "에디션별 비율 상이.", price: { usd: [200, 280] }, ratings: [V(4.5), RR("94–97"), C("James Suckling")], p: "bubbly" });
  add({ id: "belle-epoque", cat: "wine", ko: "페리에 주에 벨 에포크", en: "Perrier-Jouët Belle Epoque", ja: "ペリエ・ジュエ ベル・エポック", aliases: ["belle epoque", "벨에포크", "perrier jouet"],
    producer: "Perrier-Jouët (Pernod Ricard)", country: "프랑스", region: "샹파뉴", style: "스파클링 · 빈티지 프레스티지", abv: "12.5%",
    desc: "아르누보 아네모네 꽃 그림 병으로 유명한 빈티지 샴페인. 샤르도네 중심의 섬세하고 꽃향 가득한 스타일.",
    tasting: T("흰 꽃, 복숭아, 브리오슈", "섬세하고 우아한 기포", "길고 꽃향기"), ingredients: g(["Chardonnay", 50], ["Pinot Noir", 45], ["Pinot Meunier", 5]),
    price: { usd: [150, 200] }, ratings: [V(4.4), C("James Suckling")], p: "bubbly" });
  add({ id: "mondavi-napa-cs", cat: "wine", ko: "로버트 몬다비 나파 밸리 카베르네 소비뇽", en: "Robert Mondavi Napa Valley Cabernet Sauvignon", ja: "ロバート・モンダヴィ ナパ・ヴァレー カベルネ", aliases: ["robert mondavi", "몬다비"],
    producer: "Robert Mondavi Winery", country: "미국", region: "캘리포니아 나파 밸리", style: "레드 · 카베르네 소비뇽", abv: "14.5%",
    desc: "나파 밸리를 세계에 알린 로버트 몬다비의 대표 카베르네. 잘 익은 과실과 부드러운 탄닌의 정석적 나파 스타일.",
    tasting: T("블랙체리, 카시스, 바닐라, 코코아", "풀바디, 부드러움", "모카 여운"), ingredients: g(["Cabernet Sauvignon", 90], ["Merlot", 5], ["Cabernet Franc", 3], ["Petit Verdot", 2]),
    ingredientNote: "비율 추정치.", price: { usd: [30, 40] }, ratings: [V(3.9)], p: "redFull" });
  add({ id: "caymus-cs", cat: "wine", ko: "케이머스 카베르네 소비뇽", en: "Caymus Napa Valley Cabernet Sauvignon", ja: "ケイマス カベルネ・ソーヴィニヨン", aliases: ["caymus", "케이머스"],
    producer: "Caymus Vineyards (Wagner Family)", country: "미국", region: "캘리포니아 나파 밸리", style: "레드 · 카베르네 소비뇽", abv: "14.5~15%",
    desc: "진하고 부드러운 '벨벳' 스타일로 미국 레스토랑에서 가장 많이 팔리는 고급 카베르네 중 하나.",
    tasting: T("블랙베리 잼, 코코아, 바닐라", "농밀하고 매끈함", "달콤한 여운"), ingredients: g(["Cabernet Sauvignon", 100]),
    price: { usd: [90, 110] }, ratings: [V(4.3), C("Wine Spectator")], p: "redFull" });
  add({ id: "silver-oak-av", cat: "wine", ko: "실버 오크 알렉산더 밸리 카베르네 소비뇽", en: "Silver Oak Alexander Valley Cabernet Sauvignon", aliases: ["silver oak", "실버오크"],
    producer: "Silver Oak Cellars", country: "미국", region: "캘리포니아 소노마 · 알렉산더 밸리", style: "레드 · 카베르네 소비뇽", abv: "13.9~14.2%",
    desc: "미국산 오크통만 고집하는 카베르네 전문 와이너리. 딜·바닐라 향이 특징적이며 출시 시 이미 마시기 좋게 숙성되어 나온다.",
    tasting: T("블랙체리, 딜, 바닐라, 코코넛", "부드러운 풀바디", "달콤한 오크"), ingredients: g(["Cabernet Sauvignon", 100]),
    price: { usd: [80, 100] }, ratings: [V(4.2)], p: "redFull" });
  add({ id: "19-crimes", cat: "wine", ko: "19 크라임스 레드 블렌드", en: "19 Crimes Red Blend", aliases: ["19 crimes", "나인틴크라임스"],
    producer: "Treasury Wine Estates", country: "호주", region: "사우스 이스턴 오스트레일리아", style: "레드 · 블렌드", abv: "13.5%",
    desc: "호주로 유배된 죄수들의 사연을 레이블에 담고, 앱으로 비추면 레이블이 말하는 AR 마케팅으로 유명한 데일리 와인.",
    tasting: T("잼 같은 붉은 과실, 바닐라", "부드럽고 달콤한 미디엄 바디", "짧음"), ingredients: g(["Shiraz", 60], ["Grenache / 기타", 40]),
    ingredientNote: "블렌딩 비율 비공개(추정).", price: { usd: [10, 13] }, ratings: [V(3.6)], p: "redMed" });
  add({ id: "yellow-tail-shiraz", cat: "wine", ko: "옐로우 테일 쉬라즈", en: "[yellow tail] Shiraz", ja: "イエローテイル シラーズ", aliases: ["yellow tail", "옐로우테일", "옐로테일"],
    producer: "Casella Family Brands", country: "호주", region: "사우스 이스턴 오스트레일리아", style: "레드 · 쉬라즈", abv: "13.5%",
    desc: "캥거루 레이블로 유명한 세계적 대중 와인. 과일잼 같은 부드러운 맛으로 가볍게 즐기기 좋다.",
    tasting: T("자두, 블랙베리, 향신료", "부드럽고 과즙 풍부", "짧음"), ingredients: g(["Shiraz", 100]),
    price: { usd: [7, 10] }, ratings: [V(3.4)], p: "redMed" });
  add({ id: "penfolds-bin389", cat: "wine", ko: "펜폴즈 빈 389", en: "Penfolds Bin 389 Cabernet Shiraz", ja: "ペンフォールズ ビン389", aliases: ["bin 389", "빈389", "baby grange"],
    producer: "Penfolds", country: "호주", region: "사우스 오스트레일리아", style: "레드 · 카베르네-쉬라즈 블렌드", abv: "14.5%",
    desc: "그랜지를 숙성했던 오크통을 사용해 '베이비 그랜지'로 불린다. 호주 특유의 카베르네·쉬라즈 블렌드.",
    tasting: T("블랙커런트, 자두, 모카, 민트", "풀바디, 탄탄한 구조", "긴 오크·향신료"), ingredients: g(["Cabernet Sauvignon", 55], ["Shiraz", 45]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [60, 80] }, ratings: [V(4.2), C("James Suckling")], p: "redFull" });
  add({ id: "santa-cristina", cat: "wine", ko: "안티노리 산타 크리스티나 로쏘", en: "Antinori Santa Cristina Toscana Rosso", aliases: ["santa cristina", "산타크리스티나"],
    producer: "Marchesi Antinori", country: "이탈리아", region: "토스카나", style: "레드 · 산지오베제 블렌드", abv: "13%",
    desc: "안티노리의 데일리 토스카나 레드. 산지오베제의 체리 풍미와 산뜻한 산미로 이탈리아 음식과 무난하게 어울린다.",
    tasting: T("체리, 제비꽃, 허브", "미디엄 바디, 산뜻한 산미", "깔끔함"), ingredients: g(["Sangiovese", 70], ["Merlot / 기타", 30]),
    ingredientNote: "비율 추정치.", price: { usd: [12, 16] }, ratings: [V(3.6)], p: "italian" });
  add({ id: "banfi-brunello", cat: "wine", ko: "반피 브루넬로 디 몬탈치노", en: "Castello Banfi Brunello di Montalcino", ja: "バンフィ ブルネッロ・ディ・モンタルチーノ", aliases: ["banfi", "브루넬로", "brunello"],
    producer: "Castello Banfi", country: "이탈리아", region: "토스카나 · 몬탈치노 (DOCG)", style: "레드 · 산지오베제(브루넬로)", abv: "14%",
    desc: "브루넬로 디 몬탈치노를 세계 시장에 알린 대표 생산자. 법정 장기 숙성을 거쳐 출시되는 이탈리아 최고급 산지오베제.",
    tasting: T("체리, 가죽, 담배, 허브", "탄탄한 산미와 탄닌", "긴 여운"), ingredients: g(["Sangiovese (Brunello)", 100]),
    price: { usd: [60, 80] }, ratings: [V(4.1), C("Wine Spectator")], p: "italian" });
  add({ id: "ornellaia", cat: "wine", ko: "오르넬라이아", en: "Ornellaia", ja: "オルネッライア", aliases: ["ornellaia"],
    producer: "Tenuta dell'Ornellaia (Frescobaldi)", country: "이탈리아", region: "토스카나 · 볼게리", style: "레드 · 슈퍼 투스칸", abv: "14.5%",
    desc: "사시까이아와 함께 볼게리를 대표하는 슈퍼 투스칸. 매년 예술가와 협업한 한정 레이블을 선보인다.",
    tasting: T("블랙커런트, 지중해 허브, 감초, 초콜릿", "풍성하고 정교한 풀바디", "매우 길다"), ingredients: g(["Cabernet Sauvignon", 55], ["Merlot", 30], ["Cabernet Franc", 10], ["Petit Verdot", 5]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [200, 280] }, ratings: [V(4.5), RR("94–98"), C("James Suckling")], p: "redIcon" });
  add({ id: "masi-amarone", cat: "wine", ko: "마시 코스타세라 아마로네", en: "Masi Costasera Amarone della Valpolicella Classico", ja: "マァジ コスタセラ アマローネ", aliases: ["amarone", "아마로네", "masi"],
    producer: "Masi Agricola", country: "이탈리아", region: "베네토 · 발폴리첼라", style: "레드 · 아마로네(건조 포도)", abv: "15%",
    desc: "수확한 포도를 몇 달간 말려(아파시멘토) 당도와 풍미를 응축시킨 뒤 드라이하게 발효한 묵직한 레드.",
    tasting: T("건포도, 체리 리큐어, 초콜릿, 향신료", "농밀한 풀바디", "길고 따뜻함"), ingredients: g(["Corvina", 70], ["Rondinella", 25], ["Molinara", 5]),
    price: { usd: [45, 60] }, ratings: [V(4.1), C("Wine Spectator")], p: "redFull", pc: "15% 고도수 — 숙성 치즈·브레이즈드 요리와. 매운 음식은 피할 것." });
  add({ id: "sangre-de-toro", cat: "wine", ko: "토레스 상그레 데 토로", en: "Torres Sangre de Toro", ja: "トーレス サングレ・デ・トロ", aliases: ["sangre de toro", "상그레데토로", "황소피"],
    producer: "Familia Torres", country: "스페인", region: "카탈루냐", style: "레드 · 가르나차 블렌드", abv: "13.5%",
    desc: "병목에 달린 작은 플라스틱 황소 장식으로 유명한 스페인 데일리 레드. 따뜻한 과실미와 향신료 풍미.",
    tasting: T("딸기, 자두, 후추", "부드러운 미디엄 바디", "스파이시"), ingredients: g(["Garnacha", 60], ["Cariñena", 40]),
    ingredientNote: "비율 추정치.", price: { usd: [10, 13] }, ratings: [V(3.5)], p: "spanish" });
  add({ id: "vega-sicilia-unico", cat: "wine", ko: "베가 시실리아 우니코", en: "Vega Sicilia Único", ja: "ベガ・シシリア ウニコ", aliases: ["vega sicilia", "우니코", "unico"],
    producer: "Bodegas Vega Sicilia", country: "스페인", region: "리베라 델 두에로", style: "레드 · 템프라니요", abv: "14%",
    desc: "스페인 최고의 와인으로 꼽히는 전설적 레드. 10년 안팎의 긴 숙성 후 출시된다.",
    tasting: T("블랙체리, 시가, 가죽, 발사믹", "실키하고 복합적", "끝없이 길다"), ingredients: g(["Tempranillo (Tinto Fino)", 94], ["Cabernet Sauvignon", 6]),
    ingredientNote: "빈티지별 비율 상이.", price: { usd: [450, 600] }, ratings: [RR("95–99"), V(4.6)], p: "redIcon" });
  add({ id: "riscal-reserva", cat: "wine", ko: "마르케스 데 리스칼 레세르바", en: "Marqués de Riscal Reserva", ja: "マルケス・デ・リスカル レセルバ", aliases: ["marques de riscal", "리스칼"],
    producer: "Herederos del Marqués de Riscal", country: "스페인", region: "리오하", style: "레드 · 템프라니요 (레세르바)", abv: "14%",
    desc: "리오하의 가장 오래된 와이너리 중 하나. 오크 숙성 레세르바의 바닐라·가죽 풍미가 매력.",
    tasting: T("체리, 바닐라, 가죽, 딜", "미디엄+ 바디, 부드러운 탄닌", "향신료 여운"), ingredients: g(["Tempranillo", 90], ["Graciano / Mazuelo", 10]),
    price: { usd: [20, 26] }, ratings: [V(3.8)], p: "spanish" });
  add({ id: "fevre-chablis", cat: "wine", ko: "윌리엄 페브르 샤블리", en: "William Fèvre Chablis", ja: "ウィリアム・フェーブル シャブリ", aliases: ["chablis", "샤블리", "william fevre"],
    producer: "Domaine William Fèvre", country: "프랑스", region: "부르고뉴 · 샤블리", style: "화이트 · 샤르도네(무오크)", abv: "12.5%",
    desc: "석회질 토양에서 자란 샤르도네로 만드는 샤블리의 정석. 오크 풍미 없이 날카로운 산미와 미네랄이 특징.",
    tasting: T("레몬, 청사과, 굴껍질 미네랄", "상쾌하고 단정함", "짭조름한 미네랄"), ingredients: g(["Chardonnay", 100]),
    price: { usd: [25, 35] }, ratings: [V(3.9)], p: "whiteCrisp", pc: "생굴과의 페어링이 클래식." });
  add({ id: "guigal-cdr", cat: "wine", ko: "이 기갈 꼬뜨 뒤 론 루즈", en: "E. Guigal Côtes du Rhône Rouge", ja: "ギガル コート・デュ・ローヌ", aliases: ["guigal", "기갈", "꼬뜨뒤론"],
    producer: "E. Guigal", country: "프랑스", region: "론 밸리", style: "레드 · GSM 블렌드", abv: "14%",
    desc: "론 최고 명가 기갈의 데일리 레드. 시라 비중이 높아 같은 가격대에서 구조감과 향신료 풍미가 돋보인다.",
    tasting: T("블랙베리, 후추, 라벤더", "미디엄+ 바디", "스파이시"), ingredients: g(["Syrah", 50], ["Grenache", 45], ["Mourvèdre", 5]),
    price: { usd: [15, 20] }, ratings: [V(3.7), C("Wine Spectator")], p: "redMed" });

  /* ═════════════ 사케 14 ═════════════ */
  add({ id: "dassai-45", cat: "sake", ko: "닷사이 45", en: "Dassai 45 Junmai Daiginjo", ja: "獺祭 純米大吟醸45", aliases: ["獺祭45", "닷사이45", "dassai 45"],
    producer: "아사히주조 (旭酒造)", country: "일본", region: "야마구치현", style: "준마이 다이긴죠", abv: "16%",
    desc: "닷사이 라인업의 입문용이자 가장 많이 팔리는 제품. 화사한 과일향과 깨끗한 단맛.",
    tasting: T("멜론, 배, 바나나", "부드럽고 깨끗한 단맛", "산뜻한 마무리"), ingredients: g(["야마다니시키 山田錦", 100, "정미보합 45%"]),
    price: { usd: [30, 45], note: "720ml" }, ratings: [NOWA()], p: "sakeGinjo" });
  add({ id: "kubota-senju", cat: "sake", ko: "쿠보타 센쥬", en: "Kubota Senju Ginjo", ja: "久保田 千寿", aliases: ["千寿", "센쥬", "kubota senju"],
    producer: "아사히주조 (朝日酒造, 니가타)", country: "일본", region: "니가타현", style: "긴죠", abv: "15%",
    desc: "식사와 함께 마시는 것을 목표로 한 쿠보타의 스테디셀러. 깔끔하고 드라이한 니가타 스타일.",
    tasting: T("은은한 쌀향, 배", "드라이하고 깔끔", "짧고 산뜻"), ingredients: g(["고햐쿠만고쿠 五百万石 외", 100, "정미보합 약 55%"]),
    price: { usd: [25, 35], note: "720ml" }, ratings: [NOWA("스테디셀러", "대중 인지도 상위")], p: "sakeJunmai" });
  add({ id: "jozen-mizunogotoshi", cat: "sake", ko: "조젠 미즈노고토시", en: "Jozen Mizunogotoshi Junmai Ginjo", ja: "上善如水 純米吟醸", aliases: ["上善如水", "じょうぜんみずのごとし", "조젠", "물처럼"],
    producer: "시라타키주조 (白瀧酒造)", country: "일본", region: "니가타현 유자와", style: "준마이 긴죠", abv: "14%",
    desc: "'최고의 선은 물과 같다'는 노자의 말에서 이름을 딴, 물처럼 가볍고 맑은 사케. 사케 입문용으로 한국에서도 인기.",
    tasting: T("청사과, 멜론", "가볍고 산뜻", "깨끗함"), ingredients: g(["니가타산 주조호적미 등", 100, "정미보합 약 60%"]),
    price: { usd: [25, 35], note: "720ml" }, ratings: [NOWA("스테디셀러", "대중 인지도 상위")], p: "sakeGinjo" });
  add({ id: "tengumai-yamahai", cat: "sake", ko: "텐구마이 야마하이 준마이", en: "Tengumai Yamahai Junmai", ja: "天狗舞 山廃仕込純米酒", aliases: ["天狗舞", "てんぐまい", "텐구마이"],
    producer: "샤다주조 (車多酒造)", country: "일본", region: "이시카와현 하쿠산", style: "야마하이 준마이", abv: "16%",
    desc: "전통 야마하이 방식으로 빚은 묵직하고 감칠맛 강한 사케. 숙성감 있는 황금빛과 산미가 특징.",
    tasting: T("버섯, 요거트, 견과", "진한 감칠맛과 산미", "길고 고소함"), ingredients: g(["고햐쿠만고쿠 五百万石 외", 100, "정미보합 60%"]),
    price: { usd: [30, 45], note: "720ml" }, ratings: [C("SAKE COMPETITION")], p: "sakeJunmai" });
  add({ id: "urakasumi-zen", cat: "sake", ko: "우라카스미 젠", en: "Urakasumi Zen Junmai Ginjo", ja: "浦霞 禅 純米吟醸", aliases: ["浦霞", "うらかすみ", "우라카스미"],
    producer: "사우라 (佐浦)", country: "일본", region: "미야기현 시오가마", style: "준마이 긴죠", abv: "15.5%",
    desc: "해외 수출 1세대를 대표하는 미야기의 준마이 긴죠. 해산물이 풍부한 시오가마 항구의 식중주.",
    tasting: T("은은한 사과, 쌀향", "부드럽고 균형 잡힘", "깔끔함"), ingredients: g(["주조호적미", 100, "정미보합 50~55%"]),
    price: { usd: [30, 40], note: "720ml" }, ratings: [C("IWC SAKE")], p: "sakeGinjo" });
  add({ id: "mimurosugi", cat: "sake", ko: "미무로스기", en: "Mimurosugi", ja: "みむろ杉", aliases: ["みむろ杉", "미무로스기", "三諸杉"],
    producer: "이마니시주조 (今西酒造)", country: "일본", region: "나라현 사쿠라이", style: "준마이 긴죠 등", abv: "15~16%",
    desc: "일본 사케 발상지 중 하나로 꼽히는 미와(三輪) 지역 양조장의 신세대 브랜드. 투명한 과즙감으로 최근 인기 급상승.",
    tasting: T("청사과, 백도, 라무네", "주시하고 깨끗함", "산뜻한 산미"), ingredients: g(["야마다니시키·오마치·로바후 등 (라벨별)", 100]),
    price: { usd: [25, 45], note: "720ml" }, ratings: [NOWA("상위권")], p: "sakeGinjo" });
  add({ id: "hanaabi", cat: "sake", ko: "하나아비", en: "Hanaabi", ja: "花陽浴", aliases: ["花陽浴", "はなあび", "하나아비"],
    producer: "난요주조 (南陽醸造)", country: "일본", region: "사이타마현 하뉴", style: "준마이 긴죠/다이긴죠 · 무여과 생원주", abv: "16%",
    desc: "파인애플·멜론 같은 압도적 과일향으로 열성 팬이 많은 품귀 브랜드. 대부분 무여과 생원주로 출하.",
    tasting: T("파인애플, 멜론, 리치", "진한 단맛과 산미", "화사한 여운"), ingredients: g(["야마다니시키·오마치·미야마니시키 등 (라벨별)", 100]),
    price: { usd: [40, 80], note: "720ml · 품귀" }, ratings: [NOWA("최상위권")], p: "sakeNama" });
  add({ id: "masumi", cat: "sake", ko: "마스미", en: "Masumi", ja: "真澄", aliases: ["真澄", "ますみ", "마스미"],
    producer: "미야사카양조 (宮坂醸造)", country: "일본", region: "나가노현 스와", style: "준마이 긴죠 등", abv: "15%",
    desc: "현대 사케 효모의 기준이 된 '협회 7호 효모'가 발견된 양조장. 차분하고 균형 잡힌 식중주 스타일.",
    tasting: T("사과, 쌀, 허브", "부드럽고 단정함", "깔끔함"), ingredients: g(["나가노산 주조호적미 (미야마니시키 등)", 100]), ingredientNote: "협회 7호 효모 발상지.",
    price: { usd: [25, 40], note: "720ml" }, ratings: [C("SAKE COMPETITION")], p: "sakeJunmai" });
  add({ id: "suigei", cat: "sake", ko: "스이게이 토쿠베츠 준마이", en: "Suigei Tokubetsu Junmai", ja: "酔鯨 特別純米酒", aliases: ["酔鯨", "すいげい", "스이게이", "취경"],
    producer: "스이게이주조 (酔鯨酒造)", country: "일본", region: "고치현", style: "토쿠베츠 준마이 · 카라쿠치", abv: "15%",
    desc: "'취한 고래'라는 이름의 고치현 대표 사케. 술 센 고치 사람들의 입맛에 맞춘 드라이하고 날렵한 맛.",
    tasting: T("은은한 쌀향, 시트러스", "드라이하고 날카로움", "깔끔하고 짧음"), ingredients: g(["주조호적미", 100, "정미보합 55%"]),
    price: { usd: [25, 35], note: "720ml" }, ratings: [C("SAKE COMPETITION")], p: "sakeJunmai", pc: "가다랑어 타타키 등 해산물과 클래식 매칭." });
  add({ id: "koshino-kanbai", cat: "sake", ko: "코시노칸바이", en: "Koshino Kanbai", ja: "越乃寒梅", aliases: ["越乃寒梅", "こしのかんばい", "코시노칸바이"],
    producer: "이시모토주조 (石本酒造)", country: "일본", region: "니가타현", style: "보통주~긴죠 (라벨별)", abv: "15~16%",
    desc: "1970년대 '환상의 사케' 붐과 니가타 탄레이 카라쿠치 열풍의 주인공. 맑고 드라이한 맛의 교과서.",
    tasting: T("은은한 쌀향", "맑고 드라이", "짧고 깨끗함"), ingredients: g(["고햐쿠만고쿠 五百万石 외", 100]),
    price: { usd: [25, 40], note: "720ml" }, ratings: [NOWA("스테디셀러", "대중 인지도 상위")], p: "sakeJunmai" });
  add({ id: "kikusui-funaguchi", cat: "sake", ko: "키쿠스이 후나구치", en: "Kikusui Funaguchi Nama Genshu", ja: "菊水 ふなぐち 一番しぼり", aliases: ["ふなぐち", "후나구치", "키쿠스이", "菊水"],
    producer: "키쿠스이주조 (菊水酒造)", country: "일본", region: "니가타현", style: "혼죠조 · 생원주 (캔)", abv: "19%",
    desc: "1972년 출시된 최초의 캔 생원주. 갓 짜낸 원주를 살균하지 않고 담아 진하고 달콤하며 도수가 높다.",
    tasting: T("잘 익은 과일, 쌀", "진하고 달콤함", "알코올감 있는 여운"), ingredients: g(["쌀·쌀누룩·양조알코올", 100]),
    price: { usd: [5, 8], note: "200ml 캔" }, ratings: [NOWA("스테디셀러", "대중 인지도 상위")], p: "sakeNama", pc: "19% 원주 — 얼음을 넣어 온더락으로도 좋다. 직사광선·고온 피해 냉장 보관." });
  add({ id: "daishichi", cat: "sake", ko: "다이시치 키모토 준마이", en: "Daishichi Kimoto Junmai", ja: "大七 純米生酛", aliases: ["大七", "だいしち", "다이시치"],
    producer: "다이시치주조 (大七酒造)", country: "일본", region: "후쿠시마현 니혼마츠", style: "키모토 준마이", abv: "15%",
    desc: "전통 키모토 방식만 고집하는 키모토의 명가. 깊은 감칠맛과 숙성감으로 데워 마셔도 훌륭하다.",
    tasting: T("쌀, 견과, 은은한 유산", "깊은 감칠맛, 부드러운 산미", "길고 따뜻함"), ingredients: g(["주조호적미", 100, "정미보합 69% (편평정미)"]),
    price: { usd: [30, 40], note: "720ml" }, ratings: [C("IWC SAKE")], p: "sakeJunmai" });
  add({ id: "isojiman", cat: "sake", ko: "이소지만", en: "Isojiman", ja: "磯自慢", aliases: ["磯自慢", "いそじまん", "이소지만"],
    producer: "이소지만주조 (磯自慢酒造)", country: "일본", region: "시즈오카현 야이즈", style: "혼죠조~다이긴죠 (라벨별)", abv: "15~16%",
    desc: "시즈오카 긴죠의 대표 주자. 바나나·멜론 같은 우아한 향과 맑은 맛으로 고급 스시집에서 사랑받는다.",
    tasting: T("멜론, 바나나, 흰 꽃", "맑고 섬세한 단맛", "깨끗한 여운"), ingredients: g(["야마다니시키 山田錦 외", 100]),
    price: { usd: [40, 80], note: "720ml" }, ratings: [C("SAKE COMPETITION")], p: "sakeGinjo" });
  add({ id: "kenbishi", cat: "sake", ko: "켄비시", en: "Kenbishi", ja: "剣菱", aliases: ["剣菱", "けんびし", "켄비시", "검릉"],
    producer: "켄비시주조 (剣菱酒造)", country: "일본", region: "효고현 나다", style: "보통주 · 숙성 블렌드", abv: "17%",
    desc: "500년 넘는 역사를 내세우는 나다(灘)의 오래된 브랜드. 숙성 원주를 블렌딩한 진하고 감칠맛 있는 전통 스타일.",
    tasting: T("캐러멜, 쌀, 은은한 숙성향", "묵직한 감칠맛", "길고 쌉쌀함"), ingredients: g(["야마다니시키·아이야마 등", 100]),
    price: { usd: [20, 30], note: "720ml" }, ratings: [C("SAKE COMPETITION")], p: "sakeJunmai", pc: "데울수록 맛이 풍성해지는 칸자케(데운 술) 명주." });

  /* ═════════════ 위스키 33 ═════════════ */
  const SMS = "싱글 몰트 스카치";
  const malt = g(["맥아 보리 (Malted Barley)", 100]);
  add({ id: "glenlivet-12", cat: "whisky", ko: "글렌리벳 12년", en: "The Glenlivet 12 Year Old", ja: "ザ・グレンリベット 12年", aliases: ["glenlivet", "글렌리벳", "글렌리벳12"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "40%",
    desc: "1824년 스페이사이드 최초의 합법 증류소 중 하나. 꽃·과일 향의 부드러운 스타일로 세계 판매 최상위 싱글 몰트.",
    tasting: T("파인애플, 배, 꽃", "부드러운 꿀·바닐라", "가볍고 깔끔"), ingredients: malt, ingredientNote: "캐스크: 아메리칸·유러피언 오크.",
    price: { usd: [40, 50] }, ratings: [SF(), IW()], p: "scotchLight" });
  add({ id: "glenmorangie-10", cat: "whisky", ko: "글렌모렌지 오리지널 10년", en: "Glenmorangie The Original 10", ja: "グレンモーレンジィ オリジナル", aliases: ["glenmorangie", "글렌모렌지"],
    producer: "Glenmorangie (LVMH)", country: "스코틀랜드", region: "하이랜드", style: SMS, abv: "40%",
    desc: "스코틀랜드에서 가장 키가 큰 단식 증류기로 만든 섬세하고 부드러운 몰트. 버번 캐스크 숙성의 정석.",
    tasting: T("오렌지, 복숭아, 바닐라", "크리미하고 부드러움", "깔끔한 시트러스"), ingredients: malt, ingredientNote: "엑스-버번 아메리칸 오크 캐스크.",
    price: { usd: [40, 50] }, ratings: [SF(), IW()], p: "scotchLight" });
  add({ id: "macallan-12-dc", cat: "whisky", ko: "맥캘란 12년 더블 캐스크", en: "The Macallan 12 Double Cask", ja: "ザ・マッカラン 12年 ダブルカスク", aliases: ["macallan double cask", "맥캘란 더블캐스크"],
    producer: "The Macallan (Edrington)", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "40%",
    desc: "셰리 시즈닝 아메리칸·유러피언 오크를 함께 써 셰리 오크보다 가볍고 달콤한 맥캘란.",
    tasting: T("꿀, 건포도, 바닐라, 생강", "부드러운 단맛", "따뜻한 오크"), ingredients: malt, ingredientNote: "셰리 시즈닝 아메리칸 + 유러피언 오크.",
    price: { usd: [70, 90] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "macallan-18-sherry", cat: "whisky", ko: "맥캘란 18년 셰리 오크", en: "The Macallan 18 Sherry Oak", ja: "ザ・マッカラン 18年 シェリーオーク", aliases: ["macallan 18", "맥캘란18"],
    producer: "The Macallan (Edrington)", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "43%",
    desc: "셰리 오크 숙성 맥캘란의 상징적 숙성 표기 제품. 수집·선물 수요가 높아 가격이 매년 오르는 편.",
    tasting: T("말린 과일, 오렌지, 시나몬, 나무", "풍부하고 진함", "길고 스파이시"), ingredients: malt, ingredientNote: "100% 셰리 시즈닝 오크.",
    price: { usd: [350, 500] }, ratings: [IW(), SF()], p: "scotchSherry" });
  add({ id: "balvenie-12-dw", cat: "whisky", ko: "발베니 12년 더블우드", en: "The Balvenie 12 DoubleWood", ja: "ザ・バルヴェニー 12年 ダブルウッド", aliases: ["balvenie", "발베니", "발베니12"],
    producer: "William Grant & Sons", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "40%",
    desc: "버번 캐스크 숙성 후 셰리 캐스크로 옮겨 피니시하는 '캐스크 피니시'의 원조 격. 꿀처럼 부드러운 맛으로 한국에서 특히 인기.",
    tasting: T("꿀, 바닐라, 셰리 과일", "부드럽고 달콤함", "따뜻한 시나몬"), ingredients: malt, ingredientNote: "엑스-버번 → 올로로소 셰리 캐스크 피니시.",
    price: { usd: [65, 80] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "balvenie-14-cc", cat: "whisky", ko: "발베니 14년 캐리비안 캐스크", en: "The Balvenie 14 Caribbean Cask", ja: "ザ・バルヴェニー 14年 カリビアンカスク", aliases: ["balvenie 14", "발베니14", "캐리비안캐스크"],
    producer: "William Grant & Sons", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "43%",
    desc: "캐리비안 럼을 담았던 캐스크에서 피니시해 열대과일·토피 풍미를 더한 발베니.",
    tasting: T("토피, 바나나, 망고, 바닐라", "달콤하고 부드러움", "따뜻한 오크"), ingredients: malt, ingredientNote: "럼 캐스크 피니시.",
    price: { usd: [90, 110] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "glenfiddich-15", cat: "whisky", ko: "글렌피딕 15년", en: "Glenfiddich 15 Year Old", ja: "グレンフィディック 15年", aliases: ["glenfiddich 15", "글렌피딕15"],
    producer: "William Grant & Sons", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "40%",
    desc: "솔레라 통(Solera Vat)에서 원액을 섞어 숙성하는 독특한 방식. 꿀·과일의 풍성함.",
    tasting: T("꿀, 건포도, 시나몬", "풍성하고 부드러움", "달콤한 오크"), ingredients: malt, ingredientNote: "셰리·버번·신품 오크 → 솔레라 배트.",
    price: { usd: [70, 85] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "glenfiddich-18", cat: "whisky", ko: "글렌피딕 18년", en: "Glenfiddich 18 Year Old", ja: "グレンフィディック 18年", aliases: ["glenfiddich 18", "글렌피딕18"],
    producer: "William Grant & Sons", country: "스코틀랜드", region: "스페이사이드", style: SMS, abv: "40%",
    desc: "올로로소 셰리와 버번 캐스크 원액을 매링한 숙성 글렌피딕. 구운 사과와 오크의 깊이.",
    tasting: T("구운 사과, 시나몬, 오크", "부드럽고 깊음", "길고 따뜻함"), ingredients: malt,
    price: { usd: [110, 140] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "talisker-10", cat: "whisky", ko: "탈리스커 10년", en: "Talisker 10 Year Old", ja: "タリスカー 10年", aliases: ["talisker", "탈리스커"],
    producer: "Diageo", country: "스코틀랜드", region: "아일랜즈 · 스카이섬", style: SMS + " · 피티드", abv: "45.8%",
    desc: "스카이섬 바닷가 증류소의 몰트. 후추 같은 스파이스와 바다 내음, 은은한 피트 스모크가 특징.",
    tasting: T("바다 소금, 스모크, 후추", "강렬한 스파이스와 단맛", "길고 짭조름"), ingredients: malt,
    price: { usd: [60, 75] }, ratings: [SF(), IW()], p: "scotchPeat" });
  add({ id: "ardbeg-10", cat: "whisky", ko: "아드벡 10년", en: "Ardbeg Ten Years Old", ja: "アードベッグ 10年", aliases: ["ardbeg", "아드벡"],
    producer: "Ardbeg (LVMH)", country: "스코틀랜드", region: "아일라", style: SMS + " · 헤비 피티드", abv: "46%",
    desc: "냉각여과하지 않은 강렬한 피트 위스키. 스모크 뒤에 숨은 레몬·바닐라의 단맛이 매력.",
    tasting: T("강한 피트 스모크, 레몬, 타르", "스모키하면서 달콤함", "매우 긴 훈연"), ingredients: g(["피티드 맥아 보리", 100]),
    price: { usd: [55, 65] }, ratings: [SF(), IW()], p: "scotchPeat" });
  add({ id: "bowmore-12", cat: "whisky", ko: "보모어 12년", en: "Bowmore 12 Year Old", ja: "ボウモア 12年", aliases: ["bowmore", "보모어"],
    producer: "Suntory Global Spirits", country: "스코틀랜드", region: "아일라", style: SMS + " · 피티드", abv: "40%",
    desc: "아일라에서 가장 오래된 증류소 중 하나. 피트 스모크와 꿀·시트러스가 균형 잡힌 중간 강도의 아일라 몰트.",
    tasting: T("레몬, 꿀, 은은한 스모크", "부드러운 스모크와 단맛", "중간 길이"), ingredients: g(["피티드 맥아 보리", 100]),
    price: { usd: [55, 65] }, ratings: [SF(), IW()], p: "scotchPeat" });
  add({ id: "highland-park-12", cat: "whisky", ko: "하이랜드 파크 12년", en: "Highland Park 12 Year Old Viking Honour", ja: "ハイランドパーク 12年", aliases: ["highland park", "하이랜드파크"],
    producer: "Edrington", country: "스코틀랜드", region: "아일랜즈 · 오크니", style: SMS, abv: "40%",
    desc: "오크니 섬의 헤더 피트로 만들어 꿀과 은은한 스모크가 어우러지는 '올라운더' 몰트.",
    tasting: T("헤더 꿀, 오렌지, 은은한 스모크", "균형 잡힌 단맛", "드라이한 스모크"), ingredients: g(["맥아 보리 (일부 헤더 피트)", 100]),
    price: { usd: [50, 60] }, ratings: [SF(), IW()], p: "scotchLight" });
  add({ id: "glendronach-12", cat: "whisky", ko: "글렌드로낙 12년", en: "The GlenDronach 12 Original", ja: "グレンドロナック 12年", aliases: ["glendronach", "글렌드로낙"],
    producer: "Brown-Forman", country: "스코틀랜드", region: "하이랜드", style: SMS, abv: "43%",
    desc: "페드로 히메네스·올로로소 셰리 캐스크에서 숙성한 셰리 폭탄 스타일. 진한 건과일 풍미.",
    tasting: T("건포도, 무화과, 초콜릿", "진하고 달콤함", "따뜻한 스파이스"), ingredients: malt, ingredientNote: "PX + 올로로소 셰리 캐스크.",
    price: { usd: [65, 80] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "aberlour-abunadh", cat: "whisky", ko: "아벨라워 아부나흐", en: "Aberlour A'bunadh", ja: "アベラワー アブーナ", aliases: ["aberlour", "아벨라워", "abunadh"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "스페이사이드", style: SMS + " · 캐스크 스트렝스", abv: "59~61% (배치별)",
    desc: "올로로소 셰리 캐스크 원액을 물 타지 않고 병입한 배치 한정 제품. 셰리 팬들의 필수 코스.",
    tasting: T("체리, 오렌지, 다크초콜릿", "매우 진하고 강렬함", "길고 스파이시"), ingredients: malt, ingredientNote: "올로로소 셰리 버트 숙성, 배치마다 도수 상이.",
    price: { usd: [90, 110] }, ratings: [SF(), IW()], p: "scotchSherry", pc: "60% 안팎 고도수 — 물을 넣어 도수를 낮춰 마실 것." });
  add({ id: "dalmore-12", cat: "whisky", ko: "달모어 12년", en: "The Dalmore 12 Year Old", ja: "ダルモア 12年", aliases: ["dalmore", "달모어"],
    producer: "Whyte & Mackay", country: "스코틀랜드", region: "하이랜드", style: SMS, abv: "40%",
    desc: "수사슴 엠블럼으로 유명한 하이랜드 몰트. 오렌지·초콜릿 풍미의 진한 스타일.",
    tasting: T("오렌지 마멀레이드, 초콜릿", "부드럽고 진함", "커피·향신료"), ingredients: malt, ingredientNote: "버번 → 올로로소 셰리 피니시.",
    price: { usd: [60, 75] }, ratings: [SF(), IW()], p: "scotchSherry" });
  add({ id: "springbank-10", cat: "whisky", ko: "스프링뱅크 10년", en: "Springbank 10 Year Old", ja: "スプリングバンク 10年", aliases: ["springbank", "스프링뱅크"],
    producer: "J&A Mitchell", country: "스코틀랜드", region: "캠벨타운", style: SMS + " · 라이트 피티드", abv: "46%",
    desc: "몰팅부터 병입까지 증류소에서 모두 하는 드문 곳. 오일리하고 짭조름한 개성으로 마니아층이 두터워 품귀.",
    tasting: T("바다 내음, 배, 은은한 스모크", "오일리하고 복합적", "짭조름하고 길다"), ingredients: g(["맥아 보리 (자가 플로어 몰팅)", 100]),
    price: { usd: [80, 130], note: "품귀로 변동 큼" }, ratings: [SF(), IW()], p: "scotchPeat" });
  add({ id: "ballantines-17", cat: "whisky", ko: "발렌타인 17년", en: "Ballantine's 17 Year Old", ja: "バランタイン 17年", aliases: ["ballantines 17", "발렌타인17"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "블렌디드", style: "블렌디드 스카치", abv: "40%",
    desc: "한국 명절 선물 위스키의 대명사. 스카파·글렌버기·밀튼더프 등 원액의 부드럽고 균형 잡힌 블렌드.",
    tasting: T("꿀, 바닐라, 은은한 스모크", "부드럽고 크리미함", "길고 우아함"), ingredients: g(["몰트 위스키", 50], ["그레인 위스키", 50]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [90, 120] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "ballantines-30", cat: "whisky", ko: "발렌타인 30년", en: "Ballantine's 30 Year Old", ja: "バランタイン 30年", aliases: ["ballantines 30", "발렌타인30"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "블렌디드", style: "블렌디드 스카치", abv: "40%",
    desc: "30년 이상 숙성 원액만 블렌딩한 발렌타인의 최상위 상시 라인. 귀한 선물용으로 상징적인 위스키.",
    tasting: T("열대과일, 꿀, 오크", "실키하고 깊음", "매우 길다"), ingredients: g(["몰트 위스키", 50], ["그레인 위스키", 50]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [500, 750] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "jw-black", cat: "whisky", ko: "조니워커 블랙 라벨 12년", en: "Johnnie Walker Black Label 12", ja: "ジョニーウォーカー ブラックラベル", aliases: ["johnnie walker black", "조니워커블랙", "조니블랙"],
    producer: "Diageo", country: "스코틀랜드", region: "블렌디드", style: "블렌디드 스카치", abv: "40%",
    desc: "세계에서 가장 많이 팔리는 12년 블렌디드 중 하나. 스모키함과 달콤함의 균형이 기준점이 되는 위스키.",
    tasting: T("바닐라, 건포도, 스모크", "풍부하고 부드러움", "은은한 스모크"), ingredients: g(["몰트 위스키", 40], ["그레인 위스키", 60]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [35, 45] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "chivas-12", cat: "whisky", ko: "시바스 리갈 12년", en: "Chivas Regal 12", ja: "シーバスリーガル 12年", aliases: ["chivas", "시바스", "시바스리갈"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "블렌디드 (스트라스아일라 중심)", style: "블렌디드 스카치", abv: "40%",
    desc: "스트라스아일라 몰트를 핵심으로 한 부드럽고 달콤한 블렌디드. 한국 유흥 시장의 상징적 위스키.",
    tasting: T("꿀, 사과, 바닐라", "부드럽고 크리미함", "헤이즐넛"), ingredients: g(["몰트 위스키", 40], ["그레인 위스키", 60]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [30, 40] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "royal-salute-21", cat: "whisky", ko: "로얄 살루트 21년", en: "Royal Salute 21 Year Old Signature Blend", ja: "ロイヤルサルート 21年", aliases: ["royal salute", "로얄살루트"],
    producer: "Chivas Brothers (Pernod Ricard)", country: "스코틀랜드", region: "블렌디드", style: "블렌디드 스카치", abv: "40%",
    desc: "1953년 엘리자베스 2세 대관식을 기념해 탄생. 21발 예포에서 이름을 딴 21년 이상 블렌드로, 도자기 병이 상징.",
    tasting: T("배, 꿀, 헤이즐넛", "벨벳 같은 질감", "길고 은은한 스모크"), ingredients: g(["몰트 위스키", 50], ["그레인 위스키", 50]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [170, 220] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "monkey-shoulder", cat: "whisky", ko: "몽키 숄더", en: "Monkey Shoulder", ja: "モンキーショルダー", aliases: ["monkey shoulder", "몽키숄더"],
    producer: "William Grant & Sons", country: "스코틀랜드", region: "스페이사이드", style: "블렌디드 몰트 스카치", abv: "40%",
    desc: "그레인 없이 스페이사이드 몰트들만 블렌딩한 위스키. 몰트 작업자의 직업병에서 이름을 따왔고 하이볼·칵테일용으로 인기.",
    tasting: T("바닐라, 오렌지, 꿀", "부드럽고 달콤함", "가벼운 스파이스"), ingredients: g(["몰트 위스키 (블렌디드 몰트)", 100]),
    price: { usd: [35, 42] }, ratings: [SF(), IW()], p: "blend" });
  add({ id: "hibiki-harmony", cat: "whisky", ko: "히비키 재패니즈 하모니", en: "Hibiki Japanese Harmony", ja: "響 JAPANESE HARMONY", aliases: ["hibiki harmony", "히비키하모니"],
    producer: "Suntory (산토리)", country: "일본", region: "야마자키·하쿠슈·치타 원액", style: "재패니즈 블렌디드", abv: "43%",
    desc: "24면 커팅 병으로 유명한 히비키의 숙성연수 미표기 제품. 꽃·꿀 향의 섬세한 블렌드.",
    tasting: T("장미, 리치, 꿀", "부드럽고 섬세함", "미즈나라 백단향"), ingredients: g(["몰트 위스키", 50], ["그레인 위스키", 50]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [90, 130] }, ratings: [C("World Whiskies Awards"), SF()], p: "japanese" });
  add({ id: "kakubin", cat: "whisky", ko: "산토리 가쿠빈", en: "Suntory Kakubin", ja: "サントリー 角瓶", aliases: ["角瓶", "かくびん", "가쿠빈", "카쿠빈", "kaku"],
    producer: "Suntory (산토리)", country: "일본", region: "블렌디드", style: "재패니즈 블렌디드", abv: "40%",
    desc: "1937년 출시된 일본 하이볼 문화의 주역. 거북 등껍질 무늬 병이 상징이며 이자카야 '가쿠 하이볼'로 유명.",
    tasting: T("바닐라, 꿀, 곡물", "가볍고 드라이", "짧고 깔끔"), ingredients: g(["몰트 위스키", 40], ["그레인 위스키", 60]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [20, 35] }, ratings: [C("ISC")], p: "japanese", pc: "위스키 1 : 탄산수 4, 레몬 껍질 — 가쿠 하이볼 기본 레시피." });
  add({ id: "hakushu-12", cat: "whisky", ko: "하쿠슈 12년", en: "The Hakushu 12 Year Old", ja: "白州 12年", aliases: ["白州", "はくしゅう", "하쿠슈"],
    producer: "Suntory (산토리)", country: "일본", region: "야마나시현 · 하쿠슈 증류소", style: "재패니즈 싱글 몰트", abv: "43%",
    desc: "남알프스 숲속 증류소에서 만드는 '숲의 위스키'. 풋사과·민트와 은은한 스모크의 청량한 스타일.",
    tasting: T("풋사과, 민트, 오이, 은은한 스모크", "산뜻하고 상쾌함", "드라이한 스모크"), ingredients: g(["맥아 보리 (일부 피티드)", 100]),
    price: { usd: [150, 220] }, ratings: [C("ISC"), IW()], p: "japanese" });
  add({ id: "yoichi-sm", cat: "whisky", ko: "니카 요이치 싱글 몰트", en: "Nikka Yoichi Single Malt", ja: "シングルモルト余市", aliases: ["余市", "よいち", "요이치"],
    producer: "Nikka (Asahi)", country: "일본", region: "홋카이도 요이치", style: "재패니즈 싱글 몰트 · 피티드", abv: "45%",
    desc: "창업자 다케쓰루 마사타카가 세운 니카의 첫 증류소. 지금도 석탄 직화 증류를 고수해 묵직하고 스모키하다.",
    tasting: T("피트 스모크, 바다 소금, 구운 사과", "묵직하고 오일리", "길고 스모키"), ingredients: g(["맥아 보리 (일부 피티드)", 100]),
    price: { usd: [80, 110] }, ratings: [C("World Whiskies Awards"), IW()], p: "japanese" });
  add({ id: "jack-daniels", cat: "whisky", ko: "잭 다니엘 올드 넘버 7", en: "Jack Daniel's Old No. 7", ja: "ジャックダニエル ブラック", aliases: ["jack daniels", "잭다니엘", "잭콕"],
    producer: "Brown-Forman", country: "미국", region: "테네시 린치버그", style: "테네시 위스키", abv: "40%",
    desc: "세계에서 가장 많이 팔리는 미국 위스키. 사탕단풍나무 숯으로 원액을 한 방울씩 걸러내는 '링컨 카운티 공정'이 특징.",
    tasting: T("바나나, 캐러멜, 숯", "달콤하고 부드러움", "약간의 스모크"), ingredients: g(["옥수수", 80], ["맥아 보리", 12], ["라이", 8]),
    price: { usd: [25, 30] }, ratings: [SF(), IW()], p: "bourbon", pc: "잭콕(콜라 하이볼)이 가장 대중적인 음용법." });
  add({ id: "jim-beam", cat: "whisky", ko: "짐 빔 화이트", en: "Jim Beam Kentucky Straight Bourbon", ja: "ジムビーム", aliases: ["jim beam", "짐빔"],
    producer: "Suntory Global Spirits", country: "미국", region: "켄터키 클러몬트", style: "켄터키 스트레이트 버번", abv: "40%",
    desc: "세계 판매 1위권의 버번. 가볍고 달콤해 하이볼 베이스로 가장 많이 쓰인다.",
    tasting: T("바닐라, 옥수수, 오크", "가볍고 달콤", "짧음"), ingredients: g(["옥수수", 77], ["라이", 13], ["맥아 보리", 10]), ingredientNote: "매시빌 추정치(비공개).",
    price: { usd: [18, 22] }, ratings: [SF()], p: "bourbon" });
  add({ id: "makers-mark", cat: "whisky", ko: "메이커스 마크", en: "Maker's Mark", ja: "メーカーズマーク", aliases: ["makers mark", "메이커스마크"],
    producer: "Suntory Global Spirits", country: "미국", region: "켄터키 로레토", style: "휘티드 버번", abv: "45%",
    desc: "빨간 밀랍 봉인을 손으로 입히는 것으로 유명. 라이 대신 겨울밀을 써 부드럽고 달콤한 '휘티드 버번'의 대표.",
    tasting: T("캐러멜, 바닐라, 빵", "부드럽고 둥근 단맛", "따뜻한 오크"), ingredients: g(["옥수수", 70], ["겨울밀 (Red Winter Wheat)", 16], ["맥아 보리", 14]),
    price: { usd: [30, 35] }, ratings: [SF(), IW()], p: "bourbon" });
  add({ id: "wild-turkey-101", cat: "whisky", ko: "와일드 터키 101", en: "Wild Turkey 101", ja: "ワイルドターキー 8年 / 101", aliases: ["wild turkey", "와일드터키"],
    producer: "Campari Group", country: "미국", region: "켄터키 로렌스버그", style: "켄터키 스트레이트 버번", abv: "50.5%",
    desc: "101프루프(50.5%) 고도수와 높은 라이 비율로 힘 있고 스파이시한 버번. 가성비 칵테일 베이스로 바텐더들이 애용.",
    tasting: T("캐러멜, 오렌지, 후추", "강하고 스파이시", "길고 따뜻함"), ingredients: g(["옥수수", 75], ["라이", 13], ["맥아 보리", 12]),
    price: { usd: [25, 30] }, ratings: [SF(), IW()], p: "bourbon" });
  add({ id: "woodford-reserve", cat: "whisky", ko: "우드포드 리저브", en: "Woodford Reserve Distiller's Select", ja: "ウッドフォードリザーブ", aliases: ["woodford", "우드포드"],
    producer: "Brown-Forman", country: "미국", region: "켄터키 베르사유", style: "켄터키 스트레이트 버번", abv: "45.2%",
    desc: "구리 단식 증류기와 연속식 원액을 섞어 만드는 프리미엄 버번. 켄터키 더비 공식 버번.",
    tasting: T("말린 과일, 토피, 코코아", "풍부하고 균형 잡힘", "스파이시한 오크"), ingredients: g(["옥수수", 72], ["라이", 18], ["맥아 보리", 10]),
    price: { usd: [35, 45] }, ratings: [SF(), IW()], p: "bourbon" });
  add({ id: "blantons", cat: "whisky", ko: "블랜튼스 싱글 배럴", en: "Blanton's Original Single Barrel", ja: "ブラントン", aliases: ["blantons", "블랜튼"],
    producer: "Buffalo Trace Distillery (Sazerac)", country: "미국", region: "켄터키 프랭크퍼트", style: "싱글 배럴 버번", abv: "46.5%",
    desc: "1984년 세계 최초로 출시된 싱글 배럴 버번. 경주마 마개 8종을 모으는 재미로도 유명하며 품귀가 잦다.",
    tasting: T("오렌지, 캐러멜, 바닐라, 육두구", "부드럽고 풍부", "길고 따뜻함"), ingredients: g(["옥수수", 75], ["라이", 13], ["맥아 보리", 12]), ingredientNote: "Buffalo Trace 매시빌 #2(하이 라이) — 비율 비공개(추정).",
    price: { usd: [65, 120], note: "정가 대비 시중가 변동 큼" }, ratings: [SF(), IW()], p: "bourbon" });
  add({ id: "jameson", cat: "whisky", ko: "제임슨", en: "Jameson Irish Whiskey", ja: "ジェムソン", aliases: ["jameson", "제임슨"],
    producer: "Irish Distillers (Pernod Ricard)", country: "아일랜드", region: "코크 · 미들턴", style: "블렌디드 아이리시", abv: "40%",
    desc: "세계에서 가장 많이 팔리는 아이리시 위스키. 3회 증류로 매우 부드럽다.",
    tasting: T("바닐라, 꽃, 풋사과", "가볍고 부드러움", "은은한 스파이스"), ingredients: g(["싱글 팟 스틸 (몰트+비발아 보리)", 50], ["그레인 위스키", 50]), ingredientNote: "비율 비공개(추정).",
    price: { usd: [25, 32] }, ratings: [SF(), IW()], p: "irish" });

  /* ═════════════ 꼬냑 8 ═════════════ */
  const ub = g(["위니 블랑 (Ugni Blanc)", 100]);
  add({ id: "hennessy-vs", cat: "cognac", ko: "헤네시 VS", en: "Hennessy Very Special", ja: "ヘネシー V.S", aliases: ["hennessy vs", "헤네시vs"],
    producer: "Jas Hennessy & Co. (LVMH)", country: "프랑스", region: "꼬냑", style: "꼬냑 VS", abv: "40%",
    desc: "세계에서 가장 많이 팔리는 꼬냑. 칵테일·하이볼 베이스로 널리 쓰이는 생기 있는 스타일.", tasting: T("구운 아몬드, 바닐라, 시트러스", "가볍고 생기 있음", "짧은 오크"), ingredients: ub, ingredientNote: "VS = 최소 2년 숙성 원액.",
    price: { usd: [35, 45] }, ratings: [SF(), { src: "BNIC 등급", score: "VS", note: "최소 2년 숙성 원액" }], p: "cognac", pc: "진저에일·토닉 하이볼로 가볍게 즐기기 좋다." });
  add({ id: "hennessy-paradis", cat: "cognac", ko: "헤네시 파라디", en: "Hennessy Paradis", ja: "ヘネシー パラディ", aliases: ["paradis", "파라디"],
    producer: "Jas Hennessy & Co. (LVMH)", country: "프랑스", region: "꼬냑", style: "꼬냑 최고급", abv: "40%",
    desc: "헤네시 저장고의 희귀 고숙성 원액으로 블렌딩한 최고급 라인. XO보다 섬세하고 우아한 스타일.", tasting: T("재스민, 말린 과일, 꿀", "실키하고 섬세함", "매우 길다"), ingredients: ub,
    price: { usd: [1000, 1400] }, ratings: [SF()], p: "cognac" });
  add({ id: "remy-vsop", cat: "cognac", ko: "레미 마르땡 VSOP", en: "Rémy Martin V.S.O.P", ja: "レミーマルタン V.S.O.P", aliases: ["remy vsop", "레미vsop"],
    producer: "Rémy Martin (Rémy Cointreau)", country: "프랑스", region: "꼬냑 · 핀 샹파뉴", style: "꼬냑 VSOP (Fine Champagne)", abv: "40%",
    desc: "그랑드·쁘띠 샹파뉴 원액만 쓰는 핀 샹파뉴 VSOP의 대표. 바닐라·살구의 부드러운 맛.", tasting: T("바닐라, 살구, 감초", "부드럽고 균형 잡힘", "중간 길이"),
    ingredients: g(["위니 블랑 — Grande Champagne", 55], ["위니 블랑 — Petite Champagne", 45]), ingredientNote: "Fine Champagne = Grande Champagne 50% 이상.",
    price: { usd: [45, 55] }, ratings: [SF(), IW()], p: "cognac" });
  add({ id: "remy-1738", cat: "cognac", ko: "레미 마르땡 1738 어코드 로얄", en: "Rémy Martin 1738 Accord Royal", ja: "レミーマルタン 1738 アコードロイヤル", aliases: ["1738", "어코드로얄"],
    producer: "Rémy Martin (Rémy Cointreau)", country: "프랑스", region: "꼬냑 · 핀 샹파뉴", style: "꼬냑 (VSOP~XO 사이)", abv: "40%",
    desc: "1738년 루이 15세가 레미 마르땡에 포도밭 확장을 허락한 것을 기념한 제품. 토스트한 오크 풍미가 진하다.", tasting: T("토피, 구운 빵, 자두", "부드럽고 진함", "따뜻한 오크"), ingredients: ub,
    price: { usd: [60, 75] }, ratings: [SF()], p: "cognac" });
  add({ id: "martell-vsop", cat: "cognac", ko: "마르텔 VSOP", en: "Martell V.S.O.P", ja: "マーテル V.S.O.P", aliases: ["martell vsop", "마텔vsop"],
    producer: "Martell (Pernod Ricard)", country: "프랑스", region: "꼬냑", style: "꼬냑 VSOP", abv: "40%",
    desc: "1715년 설립된 가장 오래된 꼬냑 하우스 중 하나. 레드와인 캐스크 피니시 등으로 과실미를 강조한다.", tasting: T("자두, 살구, 바닐라", "부드럽고 과실 풍부", "중간 길이"), ingredients: ub,
    price: { usd: [45, 55] }, ratings: [SF(), IW()], p: "cognac" });
  add({ id: "martell-xo", cat: "cognac", ko: "마르텔 XO", en: "Martell X.O", ja: "マーテル X.O", aliases: ["martell xo", "마텔xo"],
    producer: "Martell (Pernod Ricard)", country: "프랑스", region: "꼬냑 · 그랑드 샹파뉴 + 보르드리", style: "꼬냑 XO", abv: "40%",
    desc: "아치형 병이 특징인 마르텔 XO. 그랑드 샹파뉴의 구조감과 보르드리의 꽃·견과 향이 어우러진다.", tasting: T("무화과, 샌달우드, 향신료", "풍부하고 매끈함", "길고 스파이시"),
    ingredients: g(["위니 블랑 — Grande Champagne", 60], ["위니 블랑 — Borderies", 40]), ingredientNote: "비율 추정치.",
    price: { usd: [180, 230] }, ratings: [SF(), IW()], p: "cognac" });
  add({ id: "courvoisier-xo", cat: "cognac", ko: "쿠르브와지에 XO", en: "Courvoisier X.O", ja: "クルボアジェ X.O", aliases: ["courvoisier", "꾸르부아지에", "쿠르부아지에"],
    producer: "Courvoisier (Campari Group)", country: "프랑스", region: "꼬냑 · 자르낙", style: "꼬냑 XO", abv: "40%",
    desc: "'나폴레옹의 꼬냑'으로 홍보되는 하우스. 크렘 브륄레·꽃 향의 부드러운 XO.", tasting: T("크렘 브륄레, 오렌지, 꽃", "크리미하고 부드러움", "긴 바닐라"),
    ingredients: g(["위니 블랑 — Grande Champagne", 50], ["Petite Champagne / Borderies", 50]), ingredientNote: "비율 추정치.",
    price: { usd: [150, 200] }, ratings: [SF(), IW()], p: "cognac" });
  add({ id: "camus-xo", cat: "cognac", ko: "까뮤 XO", en: "Camus XO", ja: "カミュ XO", aliases: ["camus", "까뮈", "카뮤"],
    producer: "Camus (가족 경영)", country: "프랑스", region: "꼬냑 · 보르드리 중심", style: "꼬냑 XO", abv: "40%",
    desc: "5대째 가족이 운영하는 꼬냑 하우스. 보르드리 원액 비중이 높아 제비꽃 같은 꽃향이 두드러진다. 면세점 인기 제품.", tasting: T("제비꽃, 말린 과일, 견과", "부드럽고 향기로움", "길고 우아함"), ingredients: ub,
    price: { usd: [150, 200] }, ratings: [SF(), IW()], p: "cognac" });

  /* ═════════════ 중국술 9 ═════════════ */
  add({ id: "kongfujia", cat: "baijiu", ko: "공부가주", en: "Kong Fu Jia Jiu", ja: "孔府家酒", zh: "孔府家酒", aliases: ["孔府家酒", "공부가주", "콩푸지아"],
    producer: "산둥 공부가 주업 (孔府家酒业)", country: "중국", region: "산둥성 취푸 (공자의 고향)", style: "농향형(浓香型) 백주", abv: "39%",
    desc: "공자 가문의 술이라는 이름의 산둥 백주. 비교적 낮은 도수와 부드러운 맛으로 한국 중식당의 스테디셀러.",
    tasting: T("곡물, 파인애플", "부드럽고 달콤함", "깔끔함"), ingredients: g(["수수 (高粱)", 100, "주원료"]),
    price: { usd: [20, 35], note: "500ml" }, ratings: [C("San Francisco WSC")], p: "baijiu" });
  add({ id: "shuijingfang", cat: "baijiu", ko: "수정방", en: "Shui Jing Fang", ja: "水井坊", zh: "水井坊 井台 52%vol", aliases: ["水井坊", "수정방", "수이징팡"],
    producer: "쓰촨 수정방 (Diageo 계열)", country: "중국", region: "쓰촨성 청두", style: "농향형(浓香型) 백주", abv: "52%",
    desc: "원·명대 양조장 유적 '수정가 주방(水井街酒坊)'에서 이름을 딴 고급 백주. 디아지오가 인수해 해외 유통이 활발하다.",
    tasting: T("배, 파인애플, 곡물", "매끄럽고 풍부함", "길고 달콤함"), ingredients: g(["수수 (高粱)", 70], ["쌀·찹쌀·밀·옥수수", 30]), ingredientNote: "원료 배합 추정치.",
    price: { usd: [90, 150], note: "500ml" }, ratings: [C("San Francisco WSC"), IW()], p: "baijiu" });
  add({ id: "jiannanchun", cat: "baijiu", ko: "검남춘", en: "Jiannanchun", ja: "剣南春", zh: "剑南春 52%vol", aliases: ["剑南春", "검남춘", "젠난춘"],
    producer: "쓰촨 검남춘 그룹 (剑南春)", country: "중국", region: "쓰촨성 몐주", style: "농향형(浓香型) 백주", abv: "52%",
    desc: "당나라 궁중 술 '검남소춘'의 전통을 잇는다고 알려진 쓰촨 명주. 1979년 전국평주회 명주 선정.",
    tasting: T("과일, 곡물, 꽃", "풍부하고 부드러움", "깔끔하고 긴 단맛"), ingredients: g(["수수 (高粱)", 40], ["쌀·찹쌀·밀·옥수수", 60]), ingredientNote: "오곡 배합(추정).",
    price: { usd: [60, 90], note: "500ml" }, ratings: [MJ("1979 전국평주회 명주")], p: "baijiu" });
  add({ id: "zhuyeqing", cat: "baijiu", ko: "죽엽청주", en: "Zhuyeqing (Bamboo Leaf Green)", ja: "竹葉青酒", zh: "竹叶青酒", aliases: ["竹叶青", "죽엽청", "주예칭"],
    producer: "산시 행화촌 분주 (汾酒 계열)", country: "중국", region: "산시성 펀양 싱화춘", style: "노주(露酒) · 약미주", abv: "38~45%",
    desc: "분주(汾酒)에 대나무 잎과 10여 가지 약재를 우려 만든 연둣빛 술. 은은한 단맛과 약초향.",
    tasting: T("대나무 잎, 약초, 꿀", "부드럽고 달콤함", "허브 여운"), ingredients: g(["분주 원주 (수수)", 90], ["대나무 잎·약재·설탕", 10]),
    price: { usd: [20, 30], note: "500ml" }, ratings: [C("San Francisco WSC")], p: "baijiu" });
  add({ id: "yantai-guniang", cat: "baijiu", ko: "연태고량주", en: "Yantai Guniang", ja: "烟台古酿", zh: "烟台古酿", aliases: ["烟台古酿", "연태고량", "연태", "옌타이"],
    producer: "옌타이 구냥 주업 (烟台古酿)", country: "중국", region: "산둥성 옌타이", style: "고량주 (저도수)", abv: "34%",
    desc: "한국 중식당·마라탕집에서 가장 흔히 보는 고량주. 34도의 비교적 낮은 도수와 달콤한 과일향으로 젊은 층에 인기.",
    tasting: T("파인애플, 곡물", "달콤하고 부드러움", "짧고 깔끔"), ingredients: g(["수수 (高粱)", 100, "주원료"]),
    price: { usd: [10, 20], note: "500ml" }, ratings: [C("San Francisco WSC")], p: "baijiu", pc: "달고 잘 넘어가 과음하기 쉬움 — 물과 함께." });
  add({ id: "erguotou", cat: "baijiu", ko: "홍성 이과두주", en: "Red Star Erguotou", ja: "紅星二鍋頭", zh: "红星二锅头 56%vol", aliases: ["二锅头", "이과두주", "얼궈터우", "홍성"],
    producer: "베이징 홍성 (北京红星)", country: "중국", region: "베이징", style: "청향형(清香型) 백주", abv: "56%",
    desc: "베이징 서민의 술. 두 번째 솥에서 받은 가장 좋은 원액이라는 이름의 뜻처럼 맑고 강렬하다. 작은 병이 상징.",
    tasting: T("맑은 수수향", "강렬하고 드라이", "뜨겁고 짧음"), ingredients: g(["수수 (高粱)", 100, "주원료"]),
    price: { usd: [5, 12], note: "100~500ml" }, ratings: [C("San Francisco WSC")], p: "baijiu", pc: "56% 고도주 — 소량씩. 양꼬치·훠궈와 클래식 조합." });
  add({ id: "xifeng", cat: "baijiu", ko: "서봉주", en: "Xifeng Jiu", ja: "西鳳酒", zh: "西凤酒", aliases: ["西凤酒", "서봉주", "시펑"],
    producer: "산시 서봉주 (陕西西凤酒)", country: "중국", region: "산시(陝西)성 펑샹", style: "봉향형(凤香型) 백주", abv: "45~55%",
    desc: "1952년 최초 4대 명주 중 하나. 청향과 농향의 중간인 독자적 '봉향형'으로, 버드나무 바구니 용기 숙성이 특징.",
    tasting: T("과일, 꽃, 곡물", "산뜻하면서 풍부함", "깔끔한 여운"), ingredients: g(["수수 (高粱)", 100, "주원료"]),
    price: { usd: [30, 80], note: "500ml · 라인별 상이" }, ratings: [MJ("1952 최초 4대 명주")], p: "baijiu" });
  add({ id: "langjiu", cat: "baijiu", ko: "랑주 홍화랑", en: "Langjiu Honghualang", ja: "郎酒 紅花郎", zh: "郎酒 红花郎 53%vol", aliases: ["郎酒", "红花郎", "랑주", "홍화랑"],
    producer: "랑주 그룹 (郎酒)", country: "중국", region: "쓰촨성 구린 얼랑진", style: "장향형(酱香型) 백주", abv: "53%",
    desc: "마오타이와 강 하나를 사이에 둔 지역의 장향형 백주. 천연 동굴 숙성으로 유명하며 중국명주로 선정되었다.",
    tasting: T("장향, 볶은 곡물, 건과일", "묵직하고 감칠맛", "길고 그윽함"), ingredients: g(["찰수수 (糯高粱)", 100, "주원료"]),
    price: { usd: [80, 150], note: "500ml" }, ratings: [MJ("전국평주회 명주 선정")], p: "baijiu" });
  add({ id: "gujing", cat: "baijiu", ko: "고정공주", en: "Gujing Gongjiu", ja: "古井貢酒", zh: "古井贡酒", aliases: ["古井贡酒", "고정공주", "구징"],
    producer: "안후이 고정 그룹 (古井集团)", country: "중국", region: "안후이성 보저우", style: "농향형(浓香型) 백주", abv: "40~52%",
    desc: "조조의 고향 보저우에서 만드는 명주. 1963년 제2회 전국평주회 명주 선정. '연분(年份)' 라인이 유명.",
    tasting: T("과일, 꽃, 곡물", "부드럽고 달콤함", "깔끔함"), ingredients: g(["수수 (高粱)", 100, "주원료"]),
    price: { usd: [30, 100], note: "500ml · 라인별 상이" }, ratings: [MJ("1963 전국평주회 명주")], p: "baijiu" });
})();
