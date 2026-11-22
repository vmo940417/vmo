# 술사전 (Sulsajeon)

와인 · 사케 · 위스키 · 꼬냑 · 중국술을 **검색(한/영/일/중) 또는 라벨 촬영**으로 찾아
설명 · 최신 해외 시세 · 품종/원료 · 공신력 있는 평가 · 페어링 유의사항을 탭으로 보여주는 모바일 웹앱(PWA).

## 화면 구성
- 하단 탭: **검색 / 분류 / 촬영 / 랭킹 / 설정**
- 상세 탭: **개요 / 가격 / 품종(원료) / 평가 / 페어링**

## 평가 기준
| 분류 | 기관 |
|---|---|
| 와인 | Vivino, Robert Parker(Wine Advocate), Wine Spectator, James Suckling |
| 사케 | SAKE COMPETITION, 全国新酒鑑評会, IWC SAKE, Kura Master, さけのわ 랭킹 |
| 위스키 | World Whiskies Awards, ISC, IWSC, San Francisco WSC |
| 꼬냑 | IWSC, ISC, San Francisco WSC, BNIC 숙성 등급 |
| 중국술 | 中国名酒(전국평주회), San Francisco WSC, Concours Mondial de Bruxelles, IWSC |

## AI 기능 (선택)
설정 탭에 Claude API 키를 넣으면:
- 라벨 사진 판독(Claude 비전)
- **조회 시점 최신 시세**(USD + 현지통화 환산, 판매처·출처 포함) / 최신 평가·수상 — Claude 웹 검색
- 분류별 최신 랭킹(SAKE COMPETITION·さけのわ, WS Top 100, WWA 등)
- 수록되지 않은 술도 웹에서 찾아 같은 탭 형식으로 정리

키는 기기 브라우저 저장소에만 저장되고 api.anthropic.com 으로만 전송됩니다. 키가 없으면 내장 DB 검색과 기기 내 OCR로 동작합니다.

## 실행
정적 파일이라 아무 웹서버로나 띄우면 됩니다.
```bash
cd liquor-app && python3 -m http.server 8000
```
휴대폰에서 열고 "홈 화면에 추가"하면 앱처럼 설치됩니다. (카메라·서비스워커는 HTTPS 또는 localhost 필요 → GitHub Pages/Netlify/Vercel 등에 올려 사용)

## 데이터
- `data.js` — 기본 수록 45종. 가격은 수집 시점 참고 범위, 평가는 최근 빈티지/출품 기준 통상 범위 또는 확인된 수상 이력.
- `vendor/anthropic-sdk.mjs` — `@anthropic-ai/sdk@1.5.0` esbuild 번들.
