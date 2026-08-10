"""안드로이드 앱 전체 경로 테스트.

Native 브리지만 가짜로 끼우고 나머지(tables/attribution/naver/llm-prompt/app)는
실제 파일을 그대로 로드해서 App.diagnose() 를 끝까지 돌린다. 이 개발 환경에서는
APK 를 실행할 수 없으므로, 실기기에서 처음 돌려보고 깨지는 상황을 여기서 최대한
줄이는 것이 목적이다.

tables.js 가 파이썬 원본과 어긋나 있지 않은지도 함께 확인한다.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from tests.test_js_naver import (  # noqa: E402
    AC_STOCK, BASIC, INDEX, INTEGRATION, KRX_POST, KRX_TRADES, NEWS, SISE, TREND,
)

HARNESS = Path(__file__).parent / "js" / "e2e_harness.mjs"
ASSETS = Path(__file__).resolve().parents[2] / "android" / "app" / "src" / "main" / "assets"

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node 없음")

# 피어(SK하이닉스 등)도 같은 /basic 픽스처를 쓴다 — 코드별 분기는 여기 관심사가 아니다.
ROUTES = {
    "/index/KOSPI/basic": INDEX,
    "/integration": INTEGRATION,
    "/basic": BASIC,
    "ac.stock": AC_STOCK,
    "/news/stock/": NEWS,
    "siseJson": SISE,
    "/trend": TREND,
}

# 수급 신선도는 '오늘'과 비교해 판정하므로 픽스처 날짜를 굳혀두면 실행일에 따라
# 결과가 바뀐다. 수급은 오늘, 공매도는 직전 거래일로 잡아 두 경로를 함께 본다.
_TODAY = datetime.now()
_YESTERDAY = _TODAY - timedelta(days=1)
_ymd = lambda d: d.strftime("%Y%m%d")

DATED_ROUTES = {
    **ROUTES,
    "/trend": [{**TREND[0], "bizdate": _ymd(_TODAY)},
               {**TREND[1], "bizdate": _ymd(_YESTERDAY)}],
}

# 공매도는 KRX 에서 POST 로 받는다. 직전 거래일 기준이라는 걸 드러내려고
# 최신 행을 어제로 잡는다.
_slash = lambda d: d.strftime("%Y/%m/%d")
DATED_KRX = {
    **KRX_POST,
    "MDCSTAT30101": {"OutBlock_1": [
        {**KRX_TRADES["OutBlock_1"][1], "TRD_DD": _slash(_YESTERDAY)},
        KRX_TRADES["OutBlock_1"][0],
    ]},
}

LLM_OK = {
    "model": "claude-sonnet-5",
    "usage": {"input_tokens": 2143, "output_tokens": 587},
    "content": [{
        "type": "tool_use", "name": "report_cause",
        "input": {
            "answer": "코스피 급락에 연동된 시장 전체 하락입니다.",
            "reasons": [{"point": "시장 주도", "detail": "KOSPI -4.58%"}],
            "catalyst": "확인된 개별 재료 없음",
            "confidence": "medium",
            "watch": "외국인 순매도 지속 여부",
        },
    }],
}


def run(**kw) -> dict:
    payload = {"routes": ROUTES, "krxRoutes": KRX_POST, **kw}
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True, text=True, timeout=60,
    )
    assert proc.returncode == 0, f"하니스 실패:\n{proc.stderr}"
    return json.loads(proc.stdout)


@pytest.fixture(scope="module")
def base():
    return run(useLlm=False)


class TestPipelineRuns:
    def test_succeeds(self, base):
        assert base["ok"], base.get("error")

    def test_quote(self, base):
        q = base["result"]["quote"]
        assert q["name"] == "삼성전자" and q["price"] == 228500

    def test_attribution_present(self, base):
        a = base["result"]["attribution"]
        assert a["driver"] in {"MARKET", "SECTOR", "IDIOSYNCRATIC"}
        assert a["headline"]

    def test_components_sum_to_change_rate(self, base):
        """항등식은 앱에서도 성립해야 한다."""
        c = base["result"]["attribution"]["components"]
        total = c["market"]["value"] + c["sector"]["value"] + c["idiosyncratic"]["value"]
        assert total == pytest.approx(base["result"]["quote"]["change_rate"], abs=0.02)

    def test_peers_collected(self, base):
        """반도체 테마라 동종 종목이 붙고 업종 등락률이 계산돼야 한다."""
        ctx = base["result"]["context"]
        assert len(ctx["peers"]) > 0
        assert ctx["sector_rate"] is not None

    def test_news_shown_newest_first(self, base):
        """관련도 점수는 LLM 근거를 고를 때만 쓰고, 화면에는 최신순으로 보여야 한다."""
        news = base["result"]["news"]
        assert news and [n["time"] for n in news] == sorted(
            [n["time"] for n in news], reverse=True)
        assert all("_dt" not in n for n in news), "내부용 _dt 필드가 응답에 새면 안 된다"

    def test_index_used(self, base):
        assert base["result"]["context"]["index_rate"] == -4.58

    def test_supply_collected(self, base):
        s = base["result"]["context"]["supply"]
        assert s["today"]["foreign"] == -1_200_000
        assert s["short"]["ratio"] == 12.4

    def test_supply_reaches_the_signals(self):
        """수집만 하고 분석에 안 들어가면 붙인 의미가 없다."""
        r = run(useLlm=False)
        keys = {s["key"] for s in r["result"]["attribution"]["signals"]}
        assert "supply" in keys and "short" in keys

    def test_todays_supply_and_yesterdays_short_are_distinguished(self):
        """수급은 오늘, 공매도는 어제 것이다. 앱이 둘을 뭉뚱그리면 안 된다."""
        r = run(routes=DATED_ROUTES, krxRoutes=DATED_KRX, useLlm=False)
        by_key = {s["key"]: s["text"] for s in r["result"]["attribution"]["signals"]}
        assert "오늘 수급" in by_key["supply"]
        assert "장 마감 후에 공시" in by_key["short"], "당일 공매도는 장중에 존재하지 않는다"


class TestProgressYields:
    """동기 브리지라 단계마다 이벤트 루프에 양보하지 않으면 화면이 얼어붙는다."""

    def test_reports_each_stage(self, base):
        joined = " ".join(base["progress"])
        for stage in ("종목 확인", "시세 조회", "지수 조회", "동종 종목",
                      "수급·공매도", "뉴스 수집"):
            assert stage in joined, f"'{stage}' 진행 표시가 없다"

    def test_progress_is_ordered(self, base):
        assert base["progress"][0].startswith("종목 확인")


class TestLlm:
    def test_skipped_without_key(self, base):
        assert base["result"]["explanation"] is None
        assert base["result"]["cost"] is None
        assert not base["calls"]["post"], "키가 없는데 API 를 호출했다"

    def test_runs_with_key(self):
        r = run(prefs={"api_key": "sk-ant-test"}, llm=LLM_OK)
        exp = r["result"]["explanation"]
        assert exp["answer"].startswith("코스피")
        assert exp["_model"] == "claude-sonnet-5"

    def test_sends_correct_headers(self):
        r = run(prefs={"api_key": "sk-ant-test"}, llm=LLM_OK)
        post = r["calls"]["post"][0]
        assert post["url"] == "https://api.anthropic.com/v1/messages"
        assert post["headers"]["x-api-key"] == "sk-ant-test"
        assert post["headers"]["anthropic-version"] == "2023-06-01"

    def test_forces_the_tool(self):
        r = run(prefs={"api_key": "sk-ant-test"}, llm=LLM_OK)
        body = r["calls"]["post"][0]["body"]
        assert body["tool_choice"] == {"type": "tool", "name": "report_cause"}
        assert body["tools"][0]["name"] == "report_cause"

    def test_evidence_carries_supply(self):
        """수급을 프롬프트에 안 실으면 LLM 이 '누가 팔았는지'를 못 쓴다."""
        r = run(prefs={"api_key": "sk-ant-test"}, llm=LLM_OK)
        prompt = r["calls"]["post"][0]["body"]["messages"][0]["content"]
        assert "[수급]" in prompt and "외국인" in prompt
        assert "[공매도]" in prompt
        assert "당일 공매도를 장중에 공개하지 않는다" in prompt

    def test_evidence_carries_decomposition(self):
        """LLM 이 분해 결과를 사실로 받아야 그걸 뒤집지 않는다."""
        r = run(prefs={"api_key": "sk-ant-test"}, llm=LLM_OK)
        prompt = r["calls"]["post"][0]["body"]["messages"][0]["content"]
        assert "[등락률 분해" in prompt
        assert "주도 요인:" in prompt
        assert "타이밍:" in prompt

    def test_model_override(self):
        r = run(prefs={"api_key": "k", "model": "claude-opus-5"}, llm=LLM_OK)
        assert r["calls"]["post"][0]["body"]["model"] == "claude-opus-5"

    def test_cost_from_real_usage(self):
        r = run(prefs={"api_key": "k"}, llm=LLM_OK)
        cost = r["result"]["cost"]
        assert cost["input_tokens"] == 2143
        assert cost["usd"] > 0 and cost["krw"] > 0

    def test_usage_recorded(self):
        r = run(prefs={"api_key": "k"}, llm=LLM_OK)
        log = json.loads(r["prefs"]["usage_log"])
        assert len(log) == 1 and log[0]["input_tokens"] == 2143

    def test_api_error_surfaces_message(self):
        r = run(prefs={"api_key": "bad"},
                llm={"httpError": True, "status": 401,
                     "body": {"error": {"message": "invalid x-api-key"}}})
        assert "invalid x-api-key" in r["result"]["explanation"]["error"]
        assert r["result"]["cost"] is None, "실패한 호출을 0원으로 누적하면 안 된다"

    def test_analysis_survives_llm_failure(self):
        """LLM 이 죽어도 분해와 뉴스는 그대로 나와야 한다."""
        r = run(prefs={"api_key": "bad"}, llm={"httpError": True, "status": 500})
        assert r["result"]["attribution"]["headline"]
        assert r["result"]["news"]


class TestFailures:
    def test_unknown_symbol(self):
        r = run(routes={"ac.stock": {}}, useLlm=False)
        assert not r["ok"] and "찾지 못했습니다" in r["error"]

    def test_quote_unavailable(self):
        routes = {**ROUTES, "/basic": None, "/integration": None}
        r = run(routes=routes, useLlm=False)
        assert not r["ok"] and "시세를 가져오지 못했습니다" in r["error"]

    def test_index_down_still_analyzes(self):
        """지수를 못 받아도 분석은 나오되 확신도가 낮아져야 한다."""
        routes = {**ROUTES, "/index/KOSPI/basic": None}
        r = run(routes=routes, useLlm=False)
        assert r["ok"]
        assert r["result"]["attribution"]["confidence"] < 0.7

    def test_failures_reported(self):
        routes = {**ROUTES, "siseJson": None}
        r = run(routes=routes, useLlm=False)
        assert any(f["endpoint"] == "siseJson" for f in r["result"]["diagnostics"]["failed"])


class TestGeneratedTablesInSync:
    """tables.js 는 파이썬에서 생성된다. 원본을 고치고 재생성을 잊으면 갈라진다."""

    def test_up_to_date(self):
        sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "tools"))
        from gen_tables import render  # noqa: PLC0415

        current = (ASSETS / "tables.js").read_text(encoding="utf-8")
        assert current == render(), (
            "tables.js 가 파이썬 원본과 다릅니다. "
            "cd app && python tools/gen_tables.py 를 실행하세요."
        )

    def test_prompt_matches_python(self):
        from server.analysis.llm import SYSTEM  # noqa: PLC0415

        src = (ASSETS / "tables.js").read_text(encoding="utf-8")
        assert json.dumps(SYSTEM, ensure_ascii=False) in src
