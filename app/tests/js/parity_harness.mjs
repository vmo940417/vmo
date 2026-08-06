/* 파이썬 <-> JS 동등성 확인용 하니스.
 *
 * stdin 으로 픽스처 JSON 을 받아 attribution.js 의 analyze/scoreNews 를 돌리고
 * 결과를 stdout 에 JSON 으로 뱉는다. test_js_parity.py 가 같은 픽스처를 파이썬
 * 구현에 넣고 두 결과를 비교한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../../../android/app/src/main/assets');

// attribution.js 는 모듈이 아니라 globalThis 에 붙는 IIFE 라 읽어서 실행한다.
new Function(fs.readFileSync(path.join(ASSETS, 'attribution.js'), 'utf8'))();

const input = JSON.parse(fs.readFileSync(0, 'utf8'));

const out = { cases: [] };
for (const c of input.cases) {
  const attribution = globalThis.Attribution.analyze(c.quote, c.context);
  const entry = { name: c.name, attribution };

  if (c.news) {
    const news = c.news.map((n) => ({
      ...n,
      published_at: n.published_at ? new Date(n.published_at) : null,
    }));
    const now = input.now ? new Date(input.now) : undefined;
    entry.news = globalThis.Attribution.scoreNews(news, c.quote, attribution, now);
  }
  out.cases.push(entry);
}

process.stdout.write(JSON.stringify(out));
