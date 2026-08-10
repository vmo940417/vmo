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


def run(html: str, stub_app: bool = False) -> dict:
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps({"html": html, "stubApp": stub_app}),
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
