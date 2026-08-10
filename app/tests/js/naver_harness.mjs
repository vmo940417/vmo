/* naver.js 파서 검증용 하니스.
 *
 * Native 브리지를 가짜로 끼워 넣어 픽스처 응답을 돌려주게 하고, 파싱 결과를
 * stdout 으로 뱉는다. 픽스처에는 실기기에서 실제로 확인한 응답 형태
 * (/integration 의 totalInfos 배열)가 들어 있다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../../../android/app/src/main/assets');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));

// 가짜 브리지: URL 을 보고 픽스처를 돌려준다. GET 호출은 세션 워밍업(krx.js
// ensureSession)이 실제로 일어났는지 확인할 수 있게 기록해 둔다.
const getCalls = [];
globalThis.Native = {
  httpGet(url) {
    getCalls.push(url);
    for (const [pattern, resp] of Object.entries(input.routes)) {
      if (url.includes(pattern)) {
        if (resp === null) return JSON.stringify({ ok: false, status: 500, error: 'fixture: down' });
        if (resp && resp.__raw) return JSON.stringify(resp);
        return JSON.stringify({ ok: true, status: 200, body: typeof resp === 'string' ? resp : JSON.stringify(resp) });
      }
    }
    return JSON.stringify({ ok: false, status: 404, error: 'fixture: no route' });
  },
  // KRX 는 한 주소로 POST 하고 bld 만 바꾸므로 본문을 보고 갈라야 한다.
  httpPost(url, headers, body) {
    for (const [pattern, resp] of Object.entries(input.postRoutes || {})) {
      if (body.includes(pattern)) {
        if (resp === null) return JSON.stringify({ ok: false, status: 500, error: 'fixture: down' });
        // __raw: 있는 그대로(상태 코드/본문 텍스트까지) 돌려준다 — 실패 응답의
        // 본문 텍스트(예: "LOGOUT")를 흉내 낼 때 쓴다.
        if (resp && resp.__raw) return JSON.stringify(resp);
        return JSON.stringify({ ok: true, status: 200,
          body: typeof resp === 'string' ? resp : JSON.stringify(resp) });
      }
    }
    return JSON.stringify({ ok: false, status: 404, error: 'fixture: no post route' });
  },
};

for (const f of ['krx.js', 'naver.js']) {
  new Function(fs.readFileSync(path.join(ASSETS, f), 'utf8'))();
}

const client = new globalThis.Naver.Client();
const out = {};

if (input.want.includes('resolve')) out.resolve = client.resolve(input.query || '삼성전자');
if (input.want.includes('quote')) out.quote = client.quote(input.code || '005930');
if (input.want.includes('index')) out.index = client.index('KOSPI');
if (input.want.includes('avgVolume')) out.avgVolume = client.avgVolume(input.code || '005930');
if (input.want.includes('supply')) out.supply = client.supplyDemand(input.code || '005930');
if (input.want.includes('news')) {
  out.news = client.news(input.code || '005930').map((n) => ({
    ...n, published_at: n.published_at ? n.published_at.toISOString() : null,
  }));
}
out.report = client.report;
out.getCalls = getCalls;

process.stdout.write(JSON.stringify(out));
