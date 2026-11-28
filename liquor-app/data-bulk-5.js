/* 술사전 대량 DB (5) — 와인 보충 + 사케 브랜드 × 대표 라인업
 * 사케: 실재 브랜드·양조장·현(県) 기준. 등급별 항목(준마이 긴죠 등)은 '대표 라인업' 기준이라
 * 실제 상품명·도수·가격은 양조장마다 다를 수 있음 → lineup: true 로 표시.
 */
(() => {
  const { add, rows, P } = window.BULK;

  /* ── 와인 보충: 대중 데일리 라인 ── */
  const G = { CS: ["까베르네 소비뇽", "Cabernet Sauvignon", "레드"], ME: ["메를로", "Merlot", "레드"], PN: ["피노 누아", "Pinot Noir", "레드"], CA: ["까르메네르", "Carmenère", "레드"],
    SY: ["쉬라즈", "Shiraz", "레드"], ZI: ["화이트 진판델", "White Zinfandel", "로제"], CH: ["샤르도네", "Chardonnay", "화이트"], SB: ["소비뇽 블랑", "Sauvignon Blanc", "화이트"],
    MO: ["모스카토", "Moscato", "스위트"], PG: ["피노 그리지오", "Pinot Grigio", "화이트"] };
  const WL = (ko, en, producer, country, region, abv, krw, codes) => codes.split(" ").forEach((c) => {
    const [gk, ge, color] = G[c];
    rows("wine", c === "PN" ? "pinot" : color === "레드" ? "redFull" : color === "스위트" ? "sweet" : "whiteCrisp",
      [[`${ko} ${gk}`, `${en} ${ge}`, `${color} · ${gk}`, abv, country, region, producer, krw, c === "ZI" ? "Zinfandel" : ge]]);
  });
  WL("콘차이토로 레세르바도", "Concha y Toro Reservado", "Concha y Toro", "칠레", "센트럴 밸리", 13, 9000, "CS ME CA CH SB");
  WL("산타 카롤리나 레세르바도", "Santa Carolina Reservado", "Viña Santa Carolina", "칠레", "센트럴 밸리", 13, 10000, "CS ME CA CH SB");
  WL("갈로 패밀리 빈야드", "Gallo Family Vineyards", "E. & J. Gallo", "미국", "캘리포니아", 12.5, 10000, "CS ME CH MO PG");
  WL("서터 홈", "Sutter Home", "Trinchero Family Estates", "미국", "캘리포니아", 12, 10000, "CS ME CH MO PG ZI");
  WL("제이콥스 크릭 리저브", "Jacob's Creek Reserve", "Pernod Ricard Winemakers", "호주", "사우스 오스트레일리아", 13.5, 18000, "SY CS CH");
  WL("로버트 몬다비 나파 밸리", "Robert Mondavi Napa Valley", "Robert Mondavi", "미국", "나파 밸리", 14, 45000, "PN CH");

  /* ── 사케: 일본어 읽기(로마자) → 한글 표기 ── */
  const CH = ["ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ", "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ", "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ"];
  const ci = (c) => CH.indexOf(c);
  // 자음: [어두, 어중], 글라이드(ㅑ계열) 여부
  const CONS = { k: ["ㄱ", "ㅋ"], g: ["ㄱ", "ㄱ"], s: ["ㅅ", "ㅅ"], sh: ["ㅅ", "ㅅ", 1], z: ["ㅈ", "ㅈ"], j: ["ㅈ", "ㅈ"], t: ["ㄷ", "ㅌ"], ts: ["ㅆ", "ㅆ"], ch: ["ㅈ", "ㅊ"],
    d: ["ㄷ", "ㄷ"], n: ["ㄴ", "ㄴ"], h: ["ㅎ", "ㅎ"], f: ["ㅎ", "ㅎ"], b: ["ㅂ", "ㅂ"], p: ["ㅍ", "ㅍ"], m: ["ㅁ", "ㅁ"], r: ["ㄹ", "ㄹ"], w: ["ㅇ", "ㅇ"], y: ["ㅇ", "ㅇ", 1], "": ["ㅇ", "ㅇ"] };
  const V = { a: 0, i: 20, u: 13, e: 5, o: 8 }, VY = { a: 2, u: 17, o: 12, e: 7, i: 20 };
  function jp2ko(rom) {
    return rom.toLowerCase().split(/[\s-]+/).map((w) => {
      const out = []; let i = 0;
      const jong = (j) => { if (out.length) { const c = out[out.length - 1].charCodeAt(0) - 0xac00; if (c % 28 === 0) out[out.length - 1] = String.fromCharCode(0xac00 + c + j); } };
      while (i < w.length) {
        const ch = w[i];
        if (!/[a-z]/.test(ch)) { out.push(ch); i++; continue; }
        if (ch === "n" && (i + 1 >= w.length || !/[aiueoy]/.test(w[i + 1]))) { jong(4); i++; continue; }            // ん → ㄴ받침
        if (/[kstpgbdcfhjmrz]/.test(ch) && (w[i + 1] === ch || (ch === "t" && w[i + 1] === "c"))) { jong(19); i++; continue; } // 촉음 → ㅅ받침
        const m = w.slice(i).match(/^(sh|ch|ts|ky|gy|ny|hy|by|py|my|ry|j|k|g|s|z|t|d|n|h|f|b|p|m|y|r|w)?([aiueo])/);
        if (!m) { i++; continue; }
        const c0 = m[1] || "", vow = m[2];
        const base = c0.length === 2 && c0[1] === "y" ? c0[0] : c0;
        const glide = (c0.length === 2 && c0[1] === "y") || (CONS[base]?.[2] && vow !== "i" && vow !== "e");
        const [ini, med] = CONS[base] || CONS[""];
        let jung = glide ? VY[vow] : V[vow];
        if (vow === "u" && /^(s|ts|z)$/.test(base)) jung = 18;                                                  // す·つ·ず → 스·쓰·즈
        if (base === "w" && vow === "a") jung = 9;
        if (base === "y") jung = VY[vow];
        const cho = ci(out.length ? med : ini);
        out.push(String.fromCharCode(0xac00 + (cho * 21 + jung) * 28));
        i += m[0].length;
        if ((vow === "o" && /[ou]/.test(w[i])) || (vow === "u" && w[i] === "u")) i++;                          // 장음 생략
      }
      return out.join("");
    }).join(" ");
  }
  window.BULK.jp2ko = jp2ko;

  const GRADE = {
    JD: ["준마이 다이긴죠", "Junmai Daiginjo", "純米大吟醸", 16, 55000, "sakeGinjo", "정미보합 50% 이하"],
    JG: ["준마이 긴죠", "Junmai Ginjo", "純米吟醸", 15.5, 38000, "sakeGinjo", "정미보합 60% 이하"],
    JM: ["준마이", "Junmai", "純米", 15, 28000, "sakeJunmai", ""],
  };
  const PREF = (pref, list) => list.forEach((row) => {
    const [rom, kanji, brewery, codes] = row.split("|");
    const ko = jp2ko(rom);
    (codes || "JG JM").split(" ").forEach((g) => {
      const [gk, ge, gj, abv, krw, preset, note] = GRADE[g];
      add({ cat: "sake", ko: `${ko} ${gk}`, en: `${rom} ${ge}`, ja: `${kanji} ${gj}`, style: gk, abv: `${abv}%`, country: "일본", region: pref,
        producer: brewery, price: { krw }, ingredients: [{ name: "주조호적미·쌀누룩", note }], lineup: true, p: preset, aliases: [rom, kanji, ko] });
    });
  });
  const T = "|JD JG JM";

  PREF("홋카이도", ["Kunimare|国稀|国稀酒造", "Otokoyama|男山|男山" + T, "Kitanonishiki|北の錦|小林酒造", "Niseko|二世古|二世古酒造", "Chitosetsuru|千歳鶴|日本清酒", "Kamikawa Taisetsu|上川大雪|上川大雪酒造" + T, "Kinteki|金滴|金滴酒造"]);
  PREF("아오모리", ["Mutsu Hassen|陸奥八仙|八戸酒造" + T, "Houhai|豊盃|三浦酒造" + T, "Joppari|じょっぱり|六花酒造", "Momokawa|桃川|桃川", "Hatomasamune|鳩正宗|鳩正宗", "Denshu|田酒|西田酒造店" + T]);
  PREF("이와테", ["Nanbu Bijin|南部美人|南部美人" + T, "Asabiraki|あさ開|あさ開", "Suisen|酔仙|酔仙酒造", "Hamachidori|浜千鳥|浜千鳥", "Washinoo|鷲の尾|わしの尾", "Akabu|赤武|赤武酒造" + T, "Tsukinowa|月の輪|月の輪酒造店"]);
  PREF("미야기", ["Urakasumi|浦霞|佐浦" + T, "Ichinokura|一ノ蔵|一ノ蔵" + T, "Hakurakusei|伯楽星|新澤醸造店" + T, "Hitakami|日高見|平孝酒造" + T, "Suminoe|墨廼江|墨廼江酒造", "Kenkonichi|乾坤一|大沼酒造店",
    "Wataya|綿屋|金の井酒造", "Katsuyama|勝山|仙台伊澤家勝山酒造" + T, "Miyakanbai|宮寒梅|寒梅酒造", "Abekan|阿部勘|阿部勘酒造", "Zao|蔵王|蔵王酒造", "Yamawa|山和|山和酒造店", "Sawanoizumi|澤乃泉|石越醸造"]);
  PREF("아키타", ["Aramasa|新政|新政酒造" + T, "Yuki no Bosha|雪の茅舎|齋彌酒造店" + T, "Takashimizu|高清水|秋田酒類製造", "Ranman|爛漫|秋田銘醸", "Mansaku no Hana|まんさくの花|日の丸醸造", "Amanoto|天の戸|浅舞酒造",
    "Kariho|刈穂|刈穂酒造", "Dewatsuru|出羽鶴|出羽鶴酒造", "Ippaku Suisei|一白水成|福禄寿酒造" + T, "Yuki no Bijin|ゆきの美人|秋田醸造", "Shirataki|白瀑|山本合名", "Harukasumi|春霞|栗林酒造店",
    "Taiheizan|太平山|小玉醸造", "Fukukomachi|福小町|木村酒造", "Ryozeki|両関|両関酒造", "Hiraizumi|飛良泉|飛良泉本舗", "Tenju|天寿|天寿酒造", "Hokushika|北鹿|北鹿"]);
  PREF("야마가타", ["Juyondai|十四代|高木酒造" + T, "Dewazakura|出羽桜|出羽桜酒造" + T, "Jokigen|上喜元|酒田酒造", "Tatenokawa|楯野川|楯の川酒造" + T, "Tohokuizumi|東北泉|高橋酒造店", "Hatsumago|初孫|東北銘醸",
    "Eiko Fuji|栄光冨士|冨士酒造" + T, "Kudoki Jozu|くどき上手|亀の井酒造" + T, "Ohyama|大山|加藤嘉八郎酒造", "Yonetsuru|米鶴|米鶴酒造", "Koikawa|鯉川|鯉川酒造", "Gasanryu|雅山流|新藤酒造店",
    "Shuho|秀鳳|秀鳳酒造場", "Yamagata Masamune|山形正宗|水戸部酒造", "Toko|東光|小嶋総本店", "Uzen Shiraume|羽前白梅|羽根田酒造", "Sugiisami|杉勇|杉勇蕨岡酒造場"]);
  PREF("후쿠시마", ["Hiroki|飛露喜|廣木酒造本店" + T, "Sharaku|寫樂|宮泉銘醸" + T, "Daishichi|大七|大七酒造" + T, "Kokken|国権|国権酒造", "Aizu Musume|会津娘|高橋庄作酒造店", "Tenmei|天明|曙酒造",
    "Naraman|奈良萬|夢心酒造", "Suehiro|末廣|末廣酒造", "Eisen|栄川|栄川酒造", "Nagurayama|名倉山|名倉山酒造", "Hirotogawa|廣戸川|松崎酒造" + T, "Okunomatsu|奥の松|奥の松酒造",
    "Daitengu|大天狗|大天狗酒造", "Gakki Masamune|楽器正宗|大木代吉本店", "Iwaki Kotobuki|磐城壽|鈴木酒造店", "Aizu Chujo|会津中将|鶴乃江酒造", "Roman|ロ万|花泉酒造", "Ibuki|一歩己|豊国酒造", "Izumikawa|泉川|廣木酒造本店"]);
  PREF("이바라키", ["Raifuku|来福|来福酒造", "Satonohomare|郷乃誉|須藤本家", "Ippin|一品|吉久保酒造", "Tsukinoi|月の井|月の井酒造店", "Watarebune|渡舟|府中誉", "Kiritsukuba|霧筑波|浦里酒造店"]);
  PREF("도치기", ["Senkin|仙禽|せんきん" + T, "Hououbiden|鳳凰美田|小林酒造" + T, "Shikisakura|四季桜|宇都宮酒造", "Sawahime|澤姫|井上清吉商店" + T, "Matsunokotobuki|松の寿|松井酒造店" + T, "Sugata|姿|飯沼銘醸",
    "Daina|大那|菊の里酒造", "Azumarikishi|東力士|島崎酒造", "Tentaka|天鷹|天鷹酒造", "Kaika|開華|第一酒造" + T, "Wakakoma|若駒|若駒酒造"]);
  PREF("군마", ["Mizubasho|水芭蕉|永井酒造" + T, "Akagisan|赤城山|近藤酒造", "Machida Shuzo|町田酒造|町田酒造", "Gunma Izumi|群馬泉|島岡酒造", "Yuito|結人|柳澤酒造"]);
  PREF("사이타마", ["Hanaabi|花陽浴|南陽醸造" + T, "Shinkame|神亀|神亀酒造", "Tenranzan|天覧山|五十嵐酒造", "Kagamiyama|鏡山|小江戸鏡山酒造", "Biwa no Sazanami|琵琶のさざ浪|麻原酒造", "Rikishi|力士|釜屋", "Seiun|晴雲|晴雲酒造"]);
  PREF("지바", ["Fudo|不動|鍋店", "Kangiku|寒菊|寒菊銘醸", "Kinoene|甲子|飯沼本家", "Koshigoi|腰古井|吉野酒造", "Gonin Musume|五人娘|寺田本家", "Iwanoi|岩の井|岩瀬酒造", "Tokaisakari|東魁盛|小泉酒造"]);
  PREF("도쿄", ["Sawanoi|澤乃井|小澤酒造" + T, "Kasen|嘉泉|田村酒造場", "Yamori|屋守|豊島屋酒造", "Tamajiman|多満自慢|石川酒造", "Chiyotsuru|千代鶴|中村酒造"]);
  PREF("가나가와", ["Izumibashi|いづみ橋|泉橋酒造", "Tanzawasan|丹沢山|川西屋酒造店", "Sagaminada|相模灘|久保田酒造", "Tensei|天青|熊澤酒造", "Ryu|隆|川西屋酒造店"]);
  PREF("니가타", ["Kubota|久保田|朝日酒造" + T, "Hakkaisan|八海山|八海醸造" + T, "Koshi no Kanbai|越乃寒梅|石本酒造" + T, "Jozen Mizunogotoshi|上善如水|白瀧酒造" + T, "Kikusui|菊水|菊水酒造" + T,
    "Shimeharitsuru|〆張鶴|宮尾酒造" + T, "Setchubai|雪中梅|丸山酒造場", "Kirinzan|麒麟山|麒麟山酒造" + T, "Kakurei|鶴齢|青木酒造" + T, "Midorikawa|緑川|緑川酒造", "Sotenbo|想天坊|河忠酒造",
    "Yoshinogawa|吉乃川|吉乃川", "Kagetora|景虎|諸橋酒造", "Manotsuru|真野鶴|尾畑酒造", "Hokusetsu|北雪|北雪酒造" + T, "Kamonishiki|加茂錦|加茂錦酒造", "Tsurunotomo|鶴の友|樋木酒造",
    "Chiyonohikari|千代の光|千代の光酒造", "Echigo Tsurukame|越後鶴亀|越後鶴亀", "Nechi Otokoyama|根知男山|渡辺酒造店", "Kiyoizumi|清泉|久須美酒造", "Taiyozakari|大洋盛|大洋酒造",
    "Echigozakura|越後桜|越後桜酒造", "Tenryohai|天領盃|天領盃酒造", "Kintsuru|金鶴|加藤酒造店", "Yukitsubaki|雪椿|雪椿酒造", "Omon|王紋|市島酒造", "Koshi no Homare|越の誉|原酒造",
    "Koshino Hakugan|越乃白雁|中川酒造", "Kenshin|謙信|池田屋酒造"]);
  PREF("도야마", ["Masuizumi|満寿泉|桝田酒造店" + T, "Kachikoma|勝駒|清都酒造場", "Haneya|羽根屋|富美菊酒造" + T, "Tateyama|立山|立山酒造" + T, "Sanshoraku|三笑楽|三笑楽酒造", "Ginban|銀盤|銀盤酒造",
    "Maboroshi no Taki|幻の瀧|皇国晴酒造", "Wakatsuru|若鶴|若鶴酒造"]);
  PREF("이시카와", ["Tengumai|天狗舞|車多酒造" + T, "Kikuhime|菊姫|菊姫" + T, "Tedorigawa|手取川|吉田酒造店" + T, "Joukigen|常きげん|鹿野酒造", "Sogen|宗玄|宗玄酒造", "Chikuha|竹葉|数馬酒造",
    "Kuroobi|黒帯|福光屋", "Kagatobi|加賀鳶|福光屋", "Yuho|遊穂|御祖酒造", "Noguchi Naohiko|農口尚彦研究所|農口尚彦研究所" + T, "Shishi no Sato|獅子の里|松浦酒造", "Manzairaku|萬歳楽|小堀酒造店"]);
  PREF("후쿠이", ["Kokuryu|黒龍|黒龍酒造" + T, "Born|梵|加藤吉平商店" + T, "Kuzuryu|九頭龍|黒龍酒造" + T, "Hayaseura|早瀬浦|三宅彦右衛門酒造", "Hanagaki|花垣|南部酒造場", "Hakuryu|白龍|吉田酒造",
    "Ippongi|一本義|一本義久保本店", "Jozan|常山|常山酒造", "Maibijin|舞美人|美川酒造場"]);
  PREF("야마나시", ["Shichiken|七賢|山梨銘醸" + T, "Shunnoten|春鶯囀|萬屋醸造店", "Sasaichi|笹一|笹一酒造", "Tanizakura|谷桜|谷桜酒造"]);
  PREF("나가노", ["Masumi|真澄|宮坂醸造" + T, "Yoakemae|夜明け前|小野酒造店", "Kirei|亀齢|岡崎酒造", "Daishinshu|大信州|大信州酒造" + T, "Sakunohana|佐久乃花|佐久乃花酒造", "Meikyo Shisui|明鏡止水|大澤酒造",
    "Mizuo|水尾|田中屋酒造店", "Hoka|豊賀|高沢酒造", "Kawanakajima Genbu|川中島幻舞|酒千蔵野", "Kurosawa|黒澤|黒澤酒造", "Engi|縁喜|玉村本店", "Hokko Masamune|北光正宗|角口酒造店",
    "Shinanotsuru|信濃鶴|長生社", "Kizan|帰山|千曲錦酒造", "Sawanohana|澤の花|伴野酒造", "Jukyu|十九|尾澤酒造場", "Sekizen|積善|西飯田酒造店", "Imanishiki|今錦|米澤酒造", "Mikotsuru|御湖鶴|菱友醸造"]);
  PREF("기후", ["Michisakari|三千盛|三千盛", "Kozaemon|小左衛門|中島醸造", "Tenryo|天領|天領酒造", "Bojimaya|房島屋|所酒造", "Daruma Masamune|達磨正宗|白木恒助商店", "Reisen|醴泉|玉泉堂酒造",
    "Kusudama|久寿玉|平瀬酒造店", "Chiyogiku|千代菊|千代菊", "Shirakawago|白川郷|三輪酒造"]);
  PREF("시즈오카", ["Isojiman|磯自慢|磯自慢酒造" + T, "Kikuyoi|喜久醉|青島酒造" + T, "Kaiun|開運|土井酒造場" + T, "Garyubai|臥龍梅|三和酒造", "Shosetsu|正雪|神沢川酒造場" + T, "Hatsukame|初亀|初亀醸造" + T,
    "Shidaizumi|志太泉|志太泉酒造", "Hakuin Masamune|白隠正宗|高嶋酒造", "Eikun|英君|英君酒造", "Hananomai|花の舞|花の舞酒造", "Suginishiki|杉錦|杉井酒造", "Kunika|國香|國香酒造", "Takasago|高砂|富士高砂酒造", "Fujinishiki|富士錦|富士錦酒造"]);
  PREF("아이치", ["Kuheiji|醸し人九平次|萬乗醸造" + T, "Gikyo|義侠|山忠本家酒造" + T, "Horaisen|蓬莱泉|関谷醸造" + T, "Choshin|長珍|長珍酒造", "Kamisugi|神杉|神杉酒造", "Nito|二兎|丸石醸造",
    "Kikuishi|菊石|浦野", "Kunizakari|國盛|中埜酒造", "Kintora|金虎|金虎酒造", "Hakuro|白老|澤田酒造"]);
  PREF("미에", ["Jikon|而今|木屋正酒造" + T, "Zaku|作|清水清三郎商店" + T, "Tabika|田光|早川酒造", "Hanzo|半蔵|大田酒造", "Hokosugi|鉾杉|河武醸造", "Miyanoyuki|宮の雪|宮崎本店",
    "Sakeya Hachibei|酒屋八兵衛|元坂酒造", "Takijiman|瀧自慢|瀧自慢酒造" + T, "Wakaebisu|若戎|若戎酒造"]);
  PREF("시가", ["Shichi Hon Yari|七本鎗|冨田酒造" + T, "Matsu no Tsukasa|松の司|松瀬酒造" + T, "Kirakucho|喜楽長|喜多酒造" + T, "Furosen|不老泉|上原酒造", "Daijiro|大治郎|畑酒造", "Kazuhiro|一博|中澤酒造",
    "Hagi no Tsuyu|萩乃露|福井弥平商店", "Dokan|道灌|太田酒造", "Naminooto|浪乃音|浪乃音酒造", "Emishiki|笑四季|笑四季酒造", "Kitajima|北島|北島酒造"]);
  PREF("교토", ["Gekkeikan|月桂冠|月桂冠" + T, "Kizakura|黄桜|黄桜", "Shochikubai|松竹梅|宝酒造", "Sawaya Matsumoto|澤屋まつもと|松本酒造" + T, "Tamanohikari|玉乃光|玉乃光酒造" + T, "Shinsei|神聖|山本本家",
    "Shotoku|招德|招德酒造", "Tomio|富翁|北川本家", "Kyohime|京姫|京姫酒造", "Sooku|蒼空|藤岡酒造", "Tamagawa|玉川|木下酒造", "Shutendoji|酒呑童子|ハクレイ酒造", "Iyasakatsuru|弥栄鶴|竹野酒造"]);
  PREF("오사카", ["Akishika|秋鹿|秋鹿酒造" + T, "Goshun|呉春|呉春", "Amanosake|天野酒|西條", "Kuninocho|國乃長|寿酒造", "Katanozakura|片野桜|山野酒造"]);
  PREF("효고", ["Hakutsuru|白鶴|白鶴酒造" + T, "Kiku-Masamune|菊正宗|菊正宗酒造" + T, "Ozeki|大関|大関" + T, "Hakutaka|白鷹|白鷹", "Sawanotsuru|沢の鶴|沢の鶴" + T, "Kenbishi|剣菱|剣菱酒造",
    "Nihonsakari|日本盛|日本盛" + T, "Hakushika|白鹿|辰馬本家酒造" + T, "Chikusen|竹泉|田治米", "Tatsuriki|龍力|本田商店" + T, "Okuharima|奥播磨|下村酒造店", "Fukunishiki|富久錦|富久錦",
    "Banshu Ikkon|播州一献|山陽盃酒造", "Kasumitsuru|香住鶴|香住鶴", "Kotsuzumi|小鼓|西山酒造場", "Fukuju|福寿|神戸酒心館" + T, "Sakuramasamune|櫻正宗|櫻正宗", "Rairaku|来楽|茨木酒造", "Kamimusubi|神結|神結酒造"]);
  PREF("나라", ["Kaze no Mori|風の森|油長酒造" + T, "Mimurosugi|みむろ杉|今西酒造" + T, "Harushika|春鹿|今西清兵衛商店" + T, "Umenoyado|梅乃宿|梅乃宿酒造" + T, "Hanatomoe|花巴|美吉野醸造", "Shinomine|篠峯|千代酒造",
    "Hyakurakumon|百楽門|葛城酒造", "Yatagarasu|八咫烏|北岡本店", "Choryo|長龍|長龍酒造", "Toyosawa|豊澤|豊澤酒造"]);
  PREF("와카야마", ["Kid|紀土|平和酒造" + T, "Kuroushi|黒牛|名手酒造店", "Saika|雑賀|九重雑賀", "Kurumazaka|車坂|吉村秀雄商店", "Rashomon|羅生門|田端酒造", "Minakata|南方|世界一統"]);
  PREF("돗토리", ["Takaisami|鷹勇|大谷酒造", "Hiokizakura|日置桜|山根酒造場", "Chiyomusubi|千代むすび|千代むすび酒造", "Bentenmusume|辨天娘|太田酒造場", "Suwaizumi|諏訪泉|諏訪酒造"]);
  PREF("시마네", ["Ouroku|王祿|王祿酒造", "Toyonoaki|豊の秋|米田酒造", "Rihaku|李白|李白酒造" + T, "Tokyokujitsu|十旭日|旭日酒造", "Kaishun|開春|若林酒造", "Shichikanba|七冠馬|簸上清酒", "Tenon|天穏|板倉酒造"]);
  PREF("오카야마", ["Sake Hitosuji|酒一筋|利守酒造", "Gozenshu|御前酒|辻本店", "Kamikokoro|嘉美心|嘉美心酒造", "Chikurin|竹林|丸本酒造", "Kihei|喜平|平喜酒造", "Taiten Shiragiku|大典白菊|白菊酒造"]);
  PREF("히로시마", ["Kamotsuru|賀茂鶴|賀茂鶴酒造" + T, "Taketsuru|竹鶴|竹鶴酒造", "Ugo no Tsuki|雨後の月|相原酒造" + T, "Kamoizumi|賀茂泉|賀茂泉酒造" + T, "Hakubotan|白牡丹|白牡丹酒造", "Fukucho|富久長|今田酒造本店" + T,
    "Hoken|宝剣|宝剣酒造", "Seikyo|誠鏡|中尾醸造", "Saijotsuru|西條鶴|西條鶴醸造", "Tenpoichi|天寶一|天寶一", "Ryusei|龍勢|藤井酒造", "Hanahato|華鳩|榎酒造", "Suishin|酔心|酔心山根本店", "Senpuku|千福|三宅本店"]);
  PREF("야마구치", ["Dassai|獺祭|旭酒造", "Toyo Bijin|東洋美人|澄川酒造場" + T, "Taka|貴|永山本家酒造場" + T, "Gangi|雁木|八百新酒造" + T, "Gokyo|五橋|酒井酒造" + T, "Chomonkyo|長門峡|岡崎酒造場",
    "Tenbi|天美|長州酒造", "Harada|原田|はつもみぢ", "Santoka|山頭火|金光酒造"]);
  PREF("도쿠시마", ["Narutotai|鳴門鯛|本家松浦酒造場", "Hosui|芳水|芳水酒造", "Miyoshikiku|三芳菊|三芳菊酒造"]);
  PREF("가가와", ["Yorokobi Gaijin|悦凱陣|丸尾本店", "Kinryo|金陵|西野金陵", "Ayakiku|綾菊|綾菊酒造"]);
  PREF("에히메", ["Ishizuchi|石鎚|石鎚酒造" + T, "Umenishiki|梅錦|梅錦山川", "Yukisuzume|雪雀|雪雀酒造", "Kagiya|賀儀屋|成龍酒造", "Himeichie|媛一会|武田酒造", "Yamatan Masamune|山丹正宗|八木酒造部"]);
  PREF("고치", ["Suigei|酔鯨|酔鯨酒造" + T, "Tsukasabotan|司牡丹|司牡丹酒造" + T, "Minami|南|南酒造場" + T, "Bijofu|美丈夫|濵川商店" + T, "Kameizumi|亀泉|亀泉酒造", "Kure|久礼|西岡酒造店",
    "Tosatsuru|土佐鶴|土佐鶴酒造", "Bunkajin|文佳人|アリサワ", "Keigetsu|桂月|土佐酒造", "Akitora|安芸虎|有光酒造場", "Toyonoume|豊能梅|高木酒造"]);
  PREF("후쿠오카", ["Niwa no Uguisu|庭のうぐいす|山口酒造場" + T, "Shigemasu|繁桝|高橋商店", "Tanaka Rokujugo|田中六五|白糸酒造", "Wakanami|若波|若波酒造", "Kitaya|喜多屋|喜多屋",
    "Morinokura|杜の蔵|杜の蔵", "Mii no Kotobuki|三井の寿|井上合名会社", "Kanhokuto|寒北斗|寒北斗酒造", "Hiyokutsuru|比翼鶴|比翼鶴酒造"]);
  PREF("사가", ["Nabeshima|鍋島|富久千代酒造", "Azumaichi|東一|五町田酒造" + T, "Tenzan|天山|天山酒造", "Shichida|七田|天山酒造" + T, "Nokomi|能古見|馬場酒造場", "Manrei|万齢|小松酒造",
    "Mitsutake|光武|光武酒造場", "Azumatsuru|東鶴|東鶴酒造", "Madonoume|窓乃梅|窓乃梅酒造"]);
  PREF("나가사키", ["Rokujuyoshu|六十餘洲|今里酒造", "Kinenokawa|杵の川|杵の川"]);
  PREF("구마모토", ["Bishonen|美少年|美少年酒造", "Koro|香露|熊本県酒造研究所" + T, "Zuiyo|瑞鷹|瑞鷹", "Reizan|れいざん|山村酒造", "Hananoka|花の香|花の香酒造" + T, "Kamaman|亀萬|亀萬酒造"]);
  PREF("오이타", ["Nishinoseki|西の関|萱島酒造", "Takaiya|鷹来屋|浜嶋酒造", "Chiebijin|ちえびじん|中野酒造" + T, "Yatsushika|八鹿|八鹿酒造"]);
})();
