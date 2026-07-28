# 리포지토리 안내

한국 국채선물 차익거래용 엑셀 워크북과 그 생성·검증 스크립트를 담고 있다.
작업 디렉터리는 `ktb_arb/`. 상세 문서는 `ktb_arb/README.md`.

## 환경

```bash
cd ktb_arb
pip install -r requirements.txt      # openpyxl, python-dateutil, formulas
```

Python 3.11 기준.

## 핵심 규칙

**엑셀 파일을 직접 수정하지 말 것.** `국채선물_차익거래.xlsx`는 생성물이다.
모든 변경은 `ktb_arb/build_ktb_arb.py`에서 하고 재생성한다.

```bash
python build_ktb_arb.py     # 워크북 재생성
python audit_wiring.py      # 참조 배선 감사 (수초)
python compare_sol.py       # 수식 값 평가 + 독립 모델 대조 (수분)
```

워크북을 수정했으면 **두 검증을 모두 통과**시킨 뒤 커밋한다.
`compare_sol.py`가 `=== 판정: PASS ===`를 찍어야 한다.

## 검증 경로에 대한 주의

`openpyxl`은 수식을 문자열로만 쓰고 캐시값을 남기지 않는다. 따라서
갓 생성한 파일을 `data_only=True`로 읽으면 전부 `None`이다.

- `compare_sol.py` — `formulas` 라이브러리가 수식을 직접 계산한다. **LibreOffice 불필요.**
  개발 컨테이너의 LibreOffice가 고장나 있어(6셀 파일도 "source file could not be loaded")
  이 경로가 주 검증 수단이다.
- `verify.py` — 캐시값이 채워진 파일에서만 동작한다. 엑셀로 열어 저장했거나
  LibreOffice recalc를 거친 뒤에만 쓸 것.

`formulas`는 `=`로 시작하는 **문자열**을 수식으로 파싱해 에러를 낸다.
설명·예시 텍스트가 `=`로 시작하면 `build_ktb_arb.py`의 `as_text()`로
`data_type='s'`를 강제해야 한다. Excel에서도 같은 이유로 `#NAME?`가 난다.

## 워크북 레이아웃 상수

`build_ktb_arb.py` 상단:

- `NPER = 62` — 반기 이표 행 수 (30년물 커버)
- `SCH0, SCH1 = 15, 76` — `현금흐름` 시트 스케줄 행 범위
- `BLOCK_STARTS = [1, 43, 85]` — 종목별 블록 시작 열 (블록폭 40)
- `CFV = {"C": "B", "D": "AR", "E": "CH"}` — `바스켓` 열 → `현금흐름` 스칼라 값 열

바스켓 종목을 3개에서 늘리려면 이 넷과 `바스켓` 시트의 `"CDE"` 루프를 함께 고쳐야 한다.

## 도메인 규약

- 채권 단가는 **한국 관행식**(단수기간 단리 + 이후 반기복리)으로 계산하며 결과는 **더티**다.
  엑셀 `PRICE()`는 단수기간도 복리 할인하므로 쓰지 않는다.
- 손익계산은 전 구간 더티 기준으로 일관한다. 경과이자·클린가는 참고 표시용일 뿐
  계산 경로에 넣지 않는다.
- 시나리오/만기 현물평가는 테일러 근사가 아니라 **shift별 정밀 재할인**을 쓴다.
  근사로 되돌리지 말 것 — ±100bp에서 오차가 락인 차익과 맞먹었다.

## 현재 상태

검증 통과(수식 7,847개 / 오류 0 / 순환참조 0 / 시나리오 최대오차 0.0848원).
단, `실시간` 시트의 가격·수익률과 `바스켓` 4~8행 종목정보는 **형식 확인용 더미**이며
실거래 값이 아니다. 남은 작업은 `ktb_arb/README.md` 7절 참조.
