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

## 검색
- 한국어 초성(ㅂㅂㄴ → 발베니), 일부 글자(발베), 조합 중 글자(발ㅂ, 발벤), 영어·일본어·중국어
- 입력하는 동안 수록 술 목록 + 구글 자동완성 추천어(JSONP, 실패 시 숨김) + 항상 '구글에서 검색' 항목
- 추천어를 누르면(또는 Enter) 같은 탭 형식의 결과 페이지: 위키백과·위키데이터에서 설명·생산자·국가·도수·원료를 가져오고, 분류(소주·맥주 포함)를 추정해 페어링·평가기관·시세 링크를 채움
- 검색창 카메라 버튼(또는 하단 촬영 탭): 사진을 찍어 구글 렌즈로 업로드, 막히면 렌즈 페이지 열기/공유로 대체

외부 AI 연동은 없습니다. 최신 시세·평가는 각 탭의 출처 링크(Wine-Searcher, Vivino, 공식 품평회 사이트 등)로 확인합니다.

## 실행
정적 파일이라 아무 웹서버로나 띄우면 됩니다.
```bash
cd liquor-app && python3 -m http.server 8000
```
휴대폰에서 열고 "홈 화면에 추가"하면 앱처럼 설치됩니다. (카메라·서비스워커는 HTTPS 또는 localhost 필요 → GitHub Pages/Netlify/Vercel 등에 올려 사용)

## 데이터
- `data.js` — 기본 수록 145종 (data.js 45 + data-extra.js 100). 가격은 수집 시점 참고 범위, 평가는 최근 빈티지/출품 기준 통상 범위 또는 확인된 수상 이력.
