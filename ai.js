// 술사전 AI 모듈 — Claude API (공식 TypeScript/JS SDK, 브라우저 직접 호출)
// API 키는 사용자의 기기(localStorage)에만 저장되며 api.anthropic.com 으로만 전송된다.

const SDK_URL = "./vendor/anthropic-sdk.mjs"; // @anthropic-ai/sdk 1.5.0 번들(esbuild)
let _sdk = null;

export const MODELS = {
  "claude-opus-5-5": "Claude Opus 5.5 (권장·고정밀)",
  "claude-sonnet-5-5": "Claude Sonnet 5.5 (빠름·저렴)",
  "claude-haiku-5-5": "Claude Haiku 5.5 (최저가)",
};

export function getSettings() {
  let s = {};
  try { s = JSON.parse(localStorage.getItem("sulsajeon.settings") || "{}"); } catch {}
  return { apiKey: "", model: "claude-opus-5-5", autoPrice: true, currency: "KRW", ...s };
}
export function saveSettings(s) {
  try { localStorage.setItem("sulsajeon.settings", JSON.stringify(s)); } catch {}
}
export function aiEnabled() { return !!getSettings().apiKey; }

async function client() {
  const { apiKey } = getSettings();
  if (!apiKey) throw new Error("설정 탭에서 Claude API 키를 먼저 입력해 주세요.");
  if (!_sdk) _sdk = (await import(SDK_URL)).default;
  return new _sdk({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 2 });
}

function requestBase(model) {
  const base = { model, max_tokens: 16000 };
  // 거절(refusal) 시 서버측 자동 폴백 — Haiku 는 미지원
  if (model !== "claude-haiku-5-5") {
    base.betas = ["server-side-fallback-2026-07-01"];
    base.fallbacks = "default";
  }
  return base;
}

function webSearchTool(model, maxUses) {
  const type = model === "claude-haiku-5-5" ? "web_search_20250305" : "web_search_20260209";
  return { type, name: "web_search", max_uses: maxUses };
}

/** 스트리밍 + pause_turn 재개 루프. 최종 텍스트와 출처 URL 목록 반환 */
async function run({ system, content, search = 0, effort = "medium", onStatus }) {
  const c = await client();
  const { model } = getSettings();
  const messages = [{ role: "user", content }];
  const params = { ...requestBase(model), system, messages };
  params.output_config = { effort };
  if (search) params.tools = [webSearchTool(model, search)];

  const sources = new Map();
  let finalMsg;
  for (let i = 0; i < 6; i++) {
    const stream = c.beta.messages.stream(params);
    stream.on("contentBlock", (b) => {
      if (b.type === "server_tool_use" && b.input?.query) onStatus?.(`웹 검색 중: “${b.input.query}”`);
    });
    finalMsg = await stream.finalMessage();
    for (const b of finalMsg.content) {
      if (b.type === "web_search_tool_result" && Array.isArray(b.content)) {
        for (const r of b.content) if (r.url) sources.set(r.url, r.title || r.url);
      }
      if (b.type === "text" && Array.isArray(b.citations)) {
        for (const ct of b.citations) if (ct.url) sources.set(ct.url, ct.title || ct.url);
      }
    }
    if (finalMsg.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: finalMsg.content });
      continue;
    }
    break;
  }
  if (finalMsg.stop_reason === "refusal") throw new Error("요청이 처리되지 않았습니다(거절). 다른 표현으로 다시 시도해 주세요.");
  const text = finalMsg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { text, sources: [...sources].map(([url, title]) => ({ url, title })).slice(0, 8) };
}

function parseJSON(text) {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fence ? fence[1] : text;
  const start = body.search(/[\[{]/);
  if (start < 0) throw new Error("AI 응답을 해석하지 못했습니다.");
  const open = body[start], close = open === "{" ? "}" : "]";
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < body.length; i++) {
    const ch = body[i];
    if (inStr) { if (esc) esc = false; else if (ch === "\\") esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close && --depth === 0) return JSON.parse(body.slice(start, i + 1));
  }
  throw new Error("AI 응답 JSON이 불완전합니다.");
}

const today = () => new Date().toISOString().slice(0, 10);

const AUTHORITIES = {
  wine: "Vivino(사용자 평균), Robert Parker Wine Advocate, Wine Spectator, James Suckling",
  sake: "SAKE COMPETITION(일본), 全国新酒鑑評会, IWC SAKE 부문, Kura Master, さけのわ(Sakenowa) 랭킹",
  whisky: "World Whiskies Awards, International Spirits Challenge(ISC), IWSC, San Francisco World Spirits Competition, Jim Murray's Whisky Bible",
  cognac: "IWSC, ISC, San Francisco World Spirits Competition, BNIC 숙성 등급(VS/VSOP/XO)",
  baijiu: "中国名酒(전국평주회) 지정, San Francisco World Spirits Competition, Concours Mondial de Bruxelles Spirits Selection, IWSC",
};

const SYS = `당신은 마스터 소믈리에 겸 주류 리서처입니다. 한국어로 답합니다.
사용자는 금융 전문가로, 가격은 특정일 지정이 없으면 '조회 시점의 가장 최신 가격'을 기준으로 합니다.
- 웹 검색으로 확인한 사실만 쓰고, 확인되지 않은 점수·가격은 null 로 두세요. 추측 금지.
- 가격은 반드시 출처(판매처/시세 사이트)와 확인 날짜를 붙이세요.
- 최종 답변은 지정된 JSON 하나만 \`\`\`json 코드블록으로 출력하세요.`;

/** 최신 시세 + 최신 평가 조회 */
export async function liveLookup(item, onStatus) {
  const name = `${item.en}${item.ja ? ` / ${item.ja}` : ""}${item.zh ? ` / ${item.zh}` : ""}`;
  const { currency } = getSettings();
  const prompt = `오늘 날짜: ${today()}
대상 술: ${name} (분류: ${item.cat}, 생산자: ${item.producer || "?"})

다음을 웹에서 최신 기준으로 조사하세요.
1) 해외 소매 최신 시세: Wine-Searcher 평균가 등 시세 사이트, 미국·일본·유럽 주요 판매처, 그리고 한국 판매가가 있으면 함께. USD 와 ${currency} 환산(오늘 환율 기준) 모두.
2) 공신력 있는 최신 평가/수상: ${AUTHORITIES[item.cat]} 중 확인 가능한 것. 와인은 최신 출시 빈티지 기준 점수.
JSON 스키마:
{"asOf":"YYYY-MM-DD","priceUSD":{"avg":number|null,"low":number|null,"high":number|null},"priceLocal":{"currency":"${currency}","avg":number|null},"fx":"사용 환율 설명","priceNote":"용량·빈티지 등 기준","offers":[{"seller":"","country":"","price":"표시가 그대로","url":""}],"ratings":[{"src":"기관명","score":"점수/메달","detail":"빈티지·연도·부문","url":""}],"summary":"2~3문장 요약"}`;
  const { text, sources } = await run({ system: SYS, content: prompt, search: 6, onStatus });
  return { ...parseJSON(text), sources, fetchedAt: Date.now() };
}

/** DB에 없는 술 — 전체 정보 생성(웹검색 기반) */
export async function fullLookup(query, onStatus) {
  const { currency } = getSettings();
  const prompt = `오늘 날짜: ${today()}
사용자 검색어: "${query}" (한국어·영어·일본어·중국어일 수 있음)
이 술을 특정하고 웹 검색으로 확인해 아래 JSON 으로 정리하세요. cat 은 wine|sake|whisky|cognac|baijiu|other 중 하나.
평가는 분류별 공신력 기관을 사용: 와인=${AUTHORITIES.wine}; 사케=${AUTHORITIES.sake}; 위스키=${AUTHORITIES.whisky}; 꼬냑=${AUTHORITIES.cognac}; 중국술=${AUTHORITIES.baijiu}.
{"cat":"","ko":"한국어명","en":"영문명","ja":"일본어명|null","zh":"중국어명|null","producer":"","country":"","region":"","style":"","abv":"",
"desc":"3~4문장 설명","tasting":{"nose":"","palate":"","finish":""},
"ingredients":[{"name":"품종/원료","pct":number|null,"note":""}],"ingredientNote":"",
"price":{"usd":[low,high],"local":{"currency":"${currency}","avg":number|null},"note":"기준·출처","asOf":"YYYY-MM-DD"},
"ratings":[{"src":"","score":"","note":"","url":""}],
"pairing":{"good":[""],"avoid":[""],"temp":"","glass":"","decant":"","caution":""}}`;
  const { text, sources } = await run({ system: SYS, content: prompt, search: 6, onStatus });
  const data = parseJSON(text);
  return { ...data, id: "ai-" + encodeURIComponent((data.en || query).toLowerCase()), ai: true, sources, fetchedAt: Date.now() };
}

/** 라벨 사진 인식 */
export async function identifyImage(base64, mediaType, onStatus) {
  onStatus?.("라벨 분석 중…");
  const content = [
    { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } },
    { type: "text", text: `이 사진 속 술(병·라벨·메뉴판)을 식별하세요. 한자·가나·영문 라벨을 모두 읽으세요.
JSON 하나만 출력: {"found":true|false,"cat":"wine|sake|whisky|cognac|baijiu|other","ko":"","en":"","ja":null,"zh":null,"producer":"","vintage":null,"labelText":"읽은 라벨 원문","confidence":0~1,"candidates":["다른 후보명(영문)"]}` },
  ];
  const { text } = await run({ system: "당신은 주류 라벨 판독 전문가입니다. 보이는 것만 근거로 판단하고 모르면 found:false.", content, effort: "low" });
  return parseJSON(text);
}

/** 분류별 최신 랭킹 */
const RANK_PROMPTS = {
  sake: "가장 최근 회차의 일본 'SAKE COMPETITION' 결과(純米大吟醸·純米吟醸·純米 부문 1위 등)와 さけのわ(Sakenowa) 최신 인기 랭킹 상위 10을 조사",
  wine: "가장 최근 발표된 Wine Spectator Top 100 상위 10위, 필요시 James Suckling Top 100 을 조사",
  whisky: "가장 최근 World Whiskies Awards 'World's Best' 부문 수상작과 ISC/IWSC 최신 최고상(Trophy) 수상작을 조사",
  cognac: "가장 최근 IWSC·San Francisco World Spirits Competition·ISC 의 꼬냑 부문 최고상(Trophy/Best in Show/Double Gold) 수상작을 조사",
  baijiu: "가장 최근 San Francisco World Spirits Competition·Concours Mondial de Bruxelles 의 바이주 부문 최고상과, 中国名酒(역대 전국평주회 명주) 목록 및 최신 매출 상위 브랜드를 조사",
};
export async function ranking(cat, onStatus) {
  const prompt = `오늘 날짜: ${today()}
${RANK_PROMPTS[cat]}하세요. 최대 10개.
JSON: {"title":"랭킹 이름과 회차/연도","asOf":"YYYY-MM-DD","items":[{"rank":1,"name":"원어명","ko":"한국어명","producer":"","detail":"부문·점수·메달","url":""}],"note":"출처 설명"}`;
  const { text, sources } = await run({ system: SYS, content: prompt, search: 6, onStatus });
  return { ...parseJSON(text), sources, fetchedAt: Date.now() };
}

/** 키 검증용 간단 호출 */
export async function ping() {
  const { text } = await run({ system: "Reply with OK.", content: "ping", effort: "low" });
  return text;
}
