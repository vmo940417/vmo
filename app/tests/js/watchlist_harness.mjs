/* App.Watchlist 확인용 하니스.
 *
 * app.js 는 Native 브리지(getPref/setPref)로 저장한다 — 실기기의 SharedPreferences
 * 흉내를 낸다. 여기서는 그 저장을 평범한 객체로 대신해서, 프로세스가 여러 번
 * 떠도 저장이 이어지는지(관심종목이 앱을 지우기 전까지 남는지)를 확인한다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.resolve(here, '../../../android/app/src/main/assets');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const prefs = Object.assign({}, input.prefs || {});

globalThis.Native = {
  getPref: (k) => prefs[k] || '',
  setPref: (k, v) => { prefs[k] = v; },
  httpGet() { throw new Error('watchlist 테스트에서는 네트워크를 안 쓴다'); },
  httpPost() { throw new Error('watchlist 테스트에서는 네트워크를 안 쓴다'); },
};

new Function(fs.readFileSync(path.join(ASSETS, 'app.js'), 'utf8'))();

const out = [];
for (const op of input.ops || []) {
  const WL = globalThis.App.Watchlist;
  if (op.op === 'add') WL.add(op.code, op.name);
  else if (op.op === 'remove') WL.remove(op.code);
  else if (op.op === 'has') out.push({ op: 'has', code: op.code, result: WL.has(op.code) });
  else if (op.op === 'all') out.push({ op: 'all', result: WL.all() });
}

process.stdout.write(JSON.stringify({ ops: out, prefs }));
