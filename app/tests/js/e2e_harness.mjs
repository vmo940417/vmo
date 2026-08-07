/* 앱 전체 경로 확인용 하니스.
 *
 * Native 브리지만 가짜로 끼우고 tables/attribution/naver/llm-prompt/app 을 전부
 * 실제로 로드해 App.diagnose() 를 돌린다. 실기기에서 처음 돌려보고 깨지는 걸
 * 막으려는 것이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../../../android/app/src/main/assets');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const prefs = Object.assign({}, input.prefs || {});
const calls = { get: [], post: [] };

globalThis.Native = {
  httpGet(url) {
    calls.get.push(url);
    for (const [pattern, resp] of Object.entries(input.routes)) {
      if (url.includes(pattern)) {
        if (resp === null) return JSON.stringify({ ok: false, status: 500, error: 'fixture: down' });
        return JSON.stringify({ ok: true, status: 200,
          body: typeof resp === 'string' ? resp : JSON.stringify(resp) });
      }
    }
    return JSON.stringify({ ok: false, status: 404, error: 'fixture: no route' });
  },
  httpPost(url, headers, body) {
    // KRX 는 폼 인코딩 POST 다. LLM 호출(JSON)과 섞이지 않게 주소로 먼저 가른다.
    if (url.includes('data.krx.co.kr')) {
      for (const [pattern, resp] of Object.entries(input.krxRoutes || {})) {
        if (body.includes(pattern)) {
          if (resp === null) return JSON.stringify({ ok: false, status: 500, error: 'fixture: down' });
          return JSON.stringify({ ok: true, status: 200,
            body: typeof resp === 'string' ? resp : JSON.stringify(resp) });
        }
      }
      return JSON.stringify({ ok: false, status: 404, error: 'fixture: no krx route' });
    }
    calls.post.push({ url, headers: JSON.parse(headers), body: JSON.parse(body) });
    const r = input.llm;
    if (!r) return JSON.stringify({ ok: false, status: 500, error: 'fixture: no llm' });
    if (r.httpError) return JSON.stringify({ ok: false, status: r.status || 400, body: JSON.stringify(r.body || {}) });
    return JSON.stringify({ ok: true, status: 200, body: JSON.stringify(r) });
  },
  getPref: (k) => prefs[k] || '',
  setPref: (k, v) => { prefs[k] = v; },
};

for (const f of ['tables.js', 'attribution.js', 'krx.js', 'naver.js', 'llm-prompt.js', 'app.js']) {
  new Function(fs.readFileSync(path.join(ASSETS, f), 'utf8'))();
}

const progress = [];
try {
  const result = await globalThis.App.diagnose(input.query || '삼성전자', {
    onProgress: (m) => progress.push(m),
    useLlm: input.useLlm !== false,
  });
  process.stdout.write(JSON.stringify({
    ok: true, result: { ...result, as_of: result.as_of.toISOString() },
    progress, calls, prefs,
  }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: e.message, progress, calls }));
}
