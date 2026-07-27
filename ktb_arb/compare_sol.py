# -*- coding: utf-8 -*-
"""
formulas 라이브러리 평가결과(sol.pkl)를 파이썬 독립 모델과 대조한다.
LibreOffice가 동작하지 않는 환경에서의 수식 검증 경로.
"""
import datetime as dt
from dateutil.relativedelta import relativedelta
from openpyxl import load_workbook

XL = "/home/user/vmo/ktb_arb/국채선물_차익거래.xlsx"


def evaluate():
    """formulas 라이브러리로 워크북을 평가해 {셀키: 값} 을 돌려준다."""
    import warnings
    warnings.filterwarnings("ignore")
    import formulas
    xl = formulas.ExcelModel().loads(XL).finish()
    sol = xl.calculate()
    out = {}
    for k, v in sol.items():
        try:
            val = v.value[0, 0]
        except Exception:
            try:
                val = v.value
            except Exception:
                val = v
        try:
            hash(val)
        except Exception:
            val = str(val)
        out[k] = val
    return out



def ed(d, m):
    return d + relativedelta(months=m)


def kr_price(y, settle, issue, maturity, cpn, freq=2):
    cfs, k = [], 0
    while True:
        d = ed(maturity, -6 * k)
        if d <= issue:
            break
        cfs.append((d, cpn * 100 / freq + (100 if d == maturity else 0)))
        k += 1
    cfs = sorted([x for x in cfs if x[0] > settle])
    nxt = cfs[0][0]
    prv = ed(nxt, -6)
    dd, T = (nxt - settle).days, (nxt - prv).days
    return sum(a / (1 + y / 2) ** i for i, (_, a) in enumerate(cfs)) / (1 + y / 2 * dd / T)


def std_price(y, n, cpn=0.05):
    v = 1 / (1 + y / 2)
    N = 2 * n
    return (cpn * 100 / y) * (1 - v ** N) + 100 * v ** N


def fwd(y_spot, S0, H, issue, mat, cpn, r, rr):
    P0 = kr_price(y_spot, S0, issue, mat, cpn)
    fv, k = 0.0, 0
    while True:
        d = ed(mat, -6 * k)
        if d <= issue:
            break
        if S0 < d <= H:
            fv += (cpn * 100 / 2) * (1 + rr * (H - d).days / 365)
        k += 1
    tgt = P0 + P0 * r * (H - S0).days / 365 - fv
    lo, hi = -0.5, 1.0
    for _ in range(300):
        mid = (lo + hi) / 2
        if kr_price(mid, H, issue, mat, cpn) > tgt:
            lo = mid
        else:
            hi = mid
    yf = (lo + hi) / 2
    bpv = (kr_price(yf - 1e-4, H, issue, mat, cpn) - kr_price(yf + 1e-4, H, issue, mat, cpn)) / 2
    return P0, tgt, yf, bpv


def norm(k):
    return k.upper().replace("'", "")


def main():
    sol = evaluate()
    idx = {norm(k): v for k, v in sol.items()}
    book = XL.split("/")[-1].upper()

    def G(sheet, coord):
        for key in (f"'[{book}]{sheet.upper()}'!{coord}", f"[{book}]{sheet.upper()}!{coord}"):
            if norm(key) in idx:
                return idx[norm(key)]
        for k, v in idx.items():
            if k.endswith(f"]{sheet.upper()}!{coord}"):
                return v
        return None

    wf = load_workbook(XL)
    # 오류값 스캔
    errs = []
    for k, v in sol.items():
        sv = str(v)
        if any(e in sv for e in ("#REF!", "#VALUE!", "#NAME?", "#DIV/0!", "#N/A", "#NUM!", "#NULL!")):
            errs.append((k, sv))
    print(f"■ 오류값(#REF!/#VALUE!/#NAME? 등) 셀: {len(errs)}개")
    for k, v in errs[:30]:
        print("   ", k, "=", v)
    print()

    # 입력값 추출
    S0 = G("설정", "B27")
    H = G("설정", "B21")

    def to_date(x):
        if isinstance(x, (int, float)):
            return dt.date(1899, 12, 30) + dt.timedelta(days=float(x))
        if isinstance(x, dt.datetime):
            return x.date()
        return x

    S0, H = to_date(S0), to_date(H)
    r = float(G("설정", "B32"))
    rr = float(G("설정", "B34"))
    n_std = int(float(G("설정", "B5")))
    mult = float(G("설정", "B9"))
    print(f"S0={S0}  H={H}  보유일수={(H-S0).days}  r={r:.6f}  표준물={n_std}년  1pt={mult:,.0f}원\n")

    bs = wf["바스켓"]
    ok = True
    fw, ws_ = [], []
    for col in "CDE":
        issue = to_date(bs[f"{col}6"].value)
        mat = to_date(bs[f"{col}7"].value)
        cpn = bs[f"{col}8"].value / 100
        y = float(G("바스켓", f"{col}17"))
        w = float(G("바스켓", f"{col}10"))
        pP0, ptg, pyf, pbpv = fwd(y, S0, H, issue, mat, cpn, r, rr)
        rows = [("현물단가 P0", pP0, float(G("바스켓", f"{col}25")), 1e-6),
                ("선도목표단가", ptg, float(G("바스켓", f"{col}36")), 1e-6),
                ("선도수익률", pyf * 100, float(G("바스켓", f"{col}37")), 1e-7),
                ("선도BPV", pbpv, float(G("바스켓", f"{col}39")), 1e-8)]
        for nm, a, b, tol in rows:
            d = abs(a - b)
            flag = "OK" if d < tol else "★FAIL★"
            if d >= tol:
                ok = False
            print(f"[{col}] {nm:14s} py={a:>14.9f}  xl={b:>14.9f}  diff={d:.2e}  {flag}")
        print(f"[{col}] 뉴턴 수렴잔차(엑셀) = {float(G('바스켓', f'{col}38')):.3e}")
        fw.append(pyf)
        ws_.append(w)
        print()

    ybar = sum(a * b for a, b in zip(fw, ws_)) / sum(ws_)
    pth = std_price(ybar, n_std)
    xth = float(G("이론가", "B14"))
    print(f"가중평균 선도수익률  py={ybar*100:.8f}%   xl={float(G('이론가','B7')):.8f}%")
    print(f"이론 선물가격        py={pth:.8f}      xl={xth:.8f}   diff={abs(pth-xth):.2e}")
    if abs(pth - xth) > 1e-6:
        ok = False
    fmkt = float(G("실시간", "C5"))
    print(f"시장 선물가격 {fmkt}  베이시스 py={(fmkt-pth)*mult:,.0f}원  xl={float(G('이론가','B37')):,.0f}원")
    print(f"선물 내재수익률 xl={float(G('이론가','B31')):.6f}%  (잔차 {float(G('이론가','B32')):.2e})")
    print(f"표준물 BPV      xl={float(G('이론가','B18')):.8f} pt = {float(G('이론가','B19')):,.1f}원\n")

    print("헤지액면 (선물 1계약당):")
    tot = 0
    for col in "CDE":
        v = float(G("바스켓", f"{col}46"))
        tot += v
        print(f"   [{col}] {v:>16,.0f}원")
    print(f"   합계  {tot:>16,.0f}원\n")

    print("만기손익 [C-1] 현재 시장가 신규진입:")
    for c, lab in [("B32", "선물 leg"), ("B33", "현물 leg"), ("B34", "거래비용"),
                   ("B35", "순 만기손익"), ("B36", "바스켓 1단위당")]:
        print(f"   손익!{c} {lab:12s} = {float(G('손익', c)):>14,.2f}원")

    print("\n시나리오 헤지 유효성 (순 만기손익):")
    for row in [4, 9, 14, 19, 24]:
        print(f"   shift {float(G('시나리오', f'A{row}')):+6.0f}bp → {float(G('시나리오', f'G{row}')):>14,.0f}원")
    print(f"   변동폭(잔여리스크) = {float(G('시나리오','B29')):,.0f}원")
    print(f"   shift0 기준손익    = {float(G('시나리오','B31')):,.0f}원")

    print("\n=== 판정:", "PASS" if (ok and not errs) else "★확인 필요★", "===")


main()
