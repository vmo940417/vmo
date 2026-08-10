/* index.html 이 실제로 뜰 때 최상위에서 죽지 않는지 확인하는 하니스.
 *
 * node --check 는 문법만 본다. "esc 를 정의하기 전에 쓰는" 것 같은 실행 순서
 * 버그(TDZ 위반)는 문법적으로 멀쩡해서 안 걸린다. 실제로 이 버그가 배포됐고,
 * 페이지가 열리자마자 스크립트가 통째로 죽어 검색 버튼조차 반응하지 않았다.
 *
 * 여기서는 최소한의 DOM/브라우저 스텁을 깔고 인라인 <script> 를 그대로
 * 실행해서, 최상위 코드(함수 정의를 지나 실제로 호출되는 부분: renderChips()
 * 즉시 호출 등)가 예외 없이 끝나는지를 본다.
 *
 * loadRealScripts: true 이면 안드로이드 페이지의 <script src=...> 들(app.js,
 * attribution.js, naver.js 등 실제 파일)까지 선언 순서대로 같이 읽어 들여
 * 인라인 스크립트와 한 번의 eval 로 묶어 돌린다 — App 을 통째로 스텁해버리면
 * 인라인 스크립트와 app.js/attribution.js 사이의 실제 연결(전역 이름, 반환
 * 형태)이 어긋나도 테스트가 못 잡는다. probe 를 넘기면 같은 렉시컬 스코프
 * (같은 eval 호출)에서 인라인 스크립트가 선언한 지역 함수/상수(WL,
 * renderChips 등)까지 그대로 건드려볼 수 있다 — probe 결과는
 * globalThis.__PROBE__ 에 담아 돌려준다.
 */
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const here = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.resolve(here, '../../..', input.html);
const htmlDir = path.dirname(htmlPath);
const html = fs.readFileSync(htmlPath, 'utf8');

const blocks = html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g) || [];
let src = '';
for (const b of blocks) {
  const m = b.match(/<script\s+[^>]*src="([^"]+)"/);
  if (m) {
    if (input.loadRealScripts) {
      src += fs.readFileSync(path.join(htmlDir, m[1]), 'utf8') + '\n';
    }
    continue;
  }
  src += b.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, '') + '\n';
}
if (input.probe) src += '\n' + input.probe;

// -- 최소 DOM 스텁 -----------------------------------------------------
const elements = {};
function makeEl(id) {
  if (!elements[id]) {
    elements[id] = {
      id, innerHTML: '', textContent: '', value: '', style: {}, dataset: {},
      classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
      addEventListener() {}, appendChild() {}, closest() { return null; },
      blur() {},
    };
  }
  return elements[id];
}
globalThis.document = {
  getElementById: (id) => makeEl(id),
  querySelector: (sel) => makeEl(sel.replace(/^#/, '')),
  createElement: () => makeEl('dyn' + Math.random()),
  addEventListener() {},
};
// 실제 폰의 localStorage 처럼 값이 실제로 남아야 한다 — 그래야 관심종목
// 저장/조회 왕복(add 한 뒤 목록에 그게 뜨는지)까지 검증할 수 있다.
const _ls = {};
globalThis.localStorage = {
  getItem: (k) => (Object.prototype.hasOwnProperty.call(_ls, k) ? _ls[k] : null),
  setItem: (k, v) => { _ls[k] = String(v); },
};
globalThis.location = { search: '', pathname: '/' };
globalThis.history = { replaceState() {} };
// Node 21+ 는 전역 navigator 를 getter-only 로 이미 갖고 있어 그냥 대입하면 죽는다.
Object.defineProperty(globalThis, 'navigator', { value: {}, configurable: true });
globalThis.window = { addEventListener() {} };
globalThis.fetch = () => Promise.reject(new Error('샌드박스라 네트워크 없음'));
globalThis.AbortController = AbortController;
globalThis.confirm = () => true;

// 안드로이드 페이지는 app.js 가 만드는 전역 App 을 쓴다. loadRealScripts 를
// 안 쓰는 기존 방식(빠른 최상위 예외 검사)에서는 Native 브리지 없이 실행되는
// 경로를 스텁으로 재현한다.
if (input.stubApp && !input.loadRealScripts) {
  globalThis.App = {
    Settings: { get() { return ''; }, set() {} },
    Watchlist: { all() { return []; }, has() { return false; }, add() {}, remove() {} },
    Usage: { summary() {
      return { today: { calls: 0, krw: 0 }, total: { calls: 0, usd: 0, krw: 0 },
               activeDays: 0, projectedMonthlyKrw: 0 };
    } },
    diagnose: () => Promise.reject(new Error('샌드박스라 네트워크 없음')),
  };
}

try {
  // eslint-disable-next-line no-eval
  (0, eval)(src);
  process.stdout.write(JSON.stringify({ ok: true, elements, probe: globalThis.__PROBE__ }));
} catch (e) {
  process.stdout.write(JSON.stringify({ ok: false, error: `${e.name}: ${e.message}` }));
}
