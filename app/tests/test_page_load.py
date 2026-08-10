"""index.html 이 실제로 뜰 때 최상위에서 죽지 않는지 확인한다.

배경: renderChips() 를 esc() 정의보다 앞줄에서 즉시 호출하는 실행 순서 버그가
그대로 배포됐다. node --check 는 문법만 보므로 이런 TDZ(temporal dead zone)
위반은 못 잡는다 — 문법적으로는 완전히 멀쩡하기 때문이다. 페이지가 열리자마자
스크립트 전체가 죽어서 검색 버튼조차 반응하지 않았는데, 그때까지는 이걸
잡아낼 테스트가 없었다.

여기서는 최소 DOM/브라우저 스텁을 깔고 인라인 <script> 를 그대로 실행해서,
최상위 코드가 예외 없이 끝나는지를 본다. node --check 다음 단계의 방어선이다.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

HARNESS = Path(__file__).parent / "js" / "page_load_harness.mjs"

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node 없음")


def run(html: str, stub_app: bool = False, load_real_scripts: bool = False,
        probe: str = "") -> dict:
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps({"html": html, "stubApp": stub_app,
                          "loadRealScripts": load_real_scripts, "probe": probe}),
        capture_output=True, text=True, timeout=30,
    )
    assert proc.returncode == 0, f"하니스 실패:\n{proc.stderr}"
    return json.loads(proc.stdout)


class TestPcPageLoads:
    def test_no_top_level_exception(self):
        r = run("app/server/static/index.html")
        assert r["ok"], r.get("error")


class TestAndroidPageLoads:
    def test_no_top_level_exception(self):
        r = run("android/app/src/main/assets/index.html", stub_app=True)
        assert r["ok"], r.get("error")


class TestAndroidWatchlistRoundTripOnRealPage:
    """App 을 스텁으로 갈아끼우면 인라인 스크립트와 app.js/attribution.js 사이가
    실제로 어긋나 있어도 못 잡는다 — 실제 파일을 전부 로드해서 화면 흐름
    그대로(첫 로딩 -> 관심종목 추가 -> 칩 갱신)를 검증한다."""

    ANDROID = "android/app/src/main/assets/index.html"

    def test_default_samples_shown_when_watchlist_empty(self):
        r = run(self.ANDROID, load_real_scripts=True)
        assert r["ok"], r.get("error")
        chips = r["elements"]["chips"]["innerHTML"]
        assert "삼성전자" in chips  # DEFAULT_SAMPLES 중 하나
        assert "관심종목에 추가" in chips  # 안내 문구

    def test_star_then_chip_shows_starred_item(self):
        """☆ 를 눌러 관심종목에 담으면(WL.add) 상단 칩이 그 종목으로 바뀌어야 한다."""
        probe = """
        WL.add('005930', '삼성전자');
        renderChips();
        globalThis.__PROBE__ = { chips: document.getElementById('chips').innerHTML };
        """
        r = run(self.ANDROID, load_real_scripts=True, probe=probe)
        assert r["ok"], r.get("error")
        chips = r["probe"]["chips"]
        assert "삼성전자" in chips
        assert "관심종목에서 제거" in chips  # 기본 샘플이 아니라 실제 항목 칩이어야 한다
        assert "관심종목에 추가" not in chips  # 기본 샘플 안내 문구는 빠져야 한다

    def test_remove_falls_back_to_default_samples(self):
        probe = """
        WL.add('005930', '삼성전자');
        WL.remove('005930');
        renderChips();
        globalThis.__PROBE__ = { chips: document.getElementById('chips').innerHTML };
        """
        r = run(self.ANDROID, load_real_scripts=True, probe=probe)
        assert r["ok"], r.get("error")
        assert "관심종목에 추가" in r["probe"]["chips"]
