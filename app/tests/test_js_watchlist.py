"""App.Watchlist (관심종목) 테스트 — 안드로이드 app.js.

매번 종목명을 입력하지 않아도 되게 하는 게 목적이라, 핵심은 저장이 실제로
이어지는가다. Native.setPref/getPref 를 평범한 객체로 대신해서(SharedPreferences
흉내), 앱을 다시 켠 것처럼 프로세스를 새로 띄워도 목록이 살아있는지 본다.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

HARNESS = Path(__file__).parent / "js" / "watchlist_harness.mjs"

pytestmark = pytest.mark.skipif(shutil.which("node") is None, reason="node 없음")


def run(ops: list[dict], prefs: dict | None = None) -> dict:
    payload = {"ops": ops, "prefs": prefs or {}}
    proc = subprocess.run(
        ["node", str(HARNESS)],
        input=json.dumps(payload, ensure_ascii=False),
        capture_output=True, text=True, timeout=30,
    )
    assert proc.returncode == 0, f"하니스 실패:\n{proc.stderr}"
    return json.loads(proc.stdout)


class TestAddRemove:
    def test_add_then_has(self):
        r = run([
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "has", "code": "005930"},
        ])
        assert r["ops"][0]["result"] is True

    def test_not_added_is_absent(self):
        r = run([{"op": "has", "code": "005930"}])
        assert r["ops"][0]["result"] is False

    def test_remove(self):
        r = run([
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "remove", "code": "005930"},
            {"op": "has", "code": "005930"},
        ])
        assert r["ops"][0]["result"] is False

    def test_add_is_idempotent_by_code(self):
        """같은 종목을 다시 찜해도 목록에 중복이 생기면 안 된다."""
        r = run([
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "all"},
        ])
        assert len(r["ops"][0]["result"]) == 1

    def test_most_recently_added_is_first(self):
        """가장 최근에 찜한 종목이 칩 맨 앞에 와야 자주 보는 종목이 앞에 있다."""
        r = run([
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "add", "code": "000660", "name": "SK하이닉스"},
            {"op": "all"},
        ])
        codes = [it["code"] for it in r["ops"][0]["result"]]
        assert codes == ["000660", "005930"]

    def test_no_code_is_a_noop(self):
        """코드 없이 찜하면 조용히 무시한다 — 빈 칩이 생기면 안 된다."""
        r = run([{"op": "add", "code": "", "name": "이상한값"}, {"op": "all"}])
        assert r["ops"][0]["result"] == []


class TestPersistence:
    def test_survives_a_restart(self):
        """앱을 다시 켠 것처럼 새 프로세스에서도 목록이 남아야 한다."""
        first = run([{"op": "add", "code": "005930", "name": "삼성전자"}])
        second = run([{"op": "all"}], prefs=first["prefs"])
        assert second["ops"][0]["result"] == [{"code": "005930", "name": "삼성전자"}]

    def test_removal_persists_too(self):
        first = run([
            {"op": "add", "code": "005930", "name": "삼성전자"},
            {"op": "add", "code": "000660", "name": "SK하이닉스"},
        ])
        second = run([{"op": "remove", "code": "005930"}], prefs=first["prefs"])
        third = run([{"op": "all"}], prefs=second["prefs"])
        codes = [it["code"] for it in third["ops"][0]["result"]]
        assert codes == ["000660"]


class TestCap:
    def test_caps_at_thirty(self):
        """저장소를 무한정 먹지 않게 최근 30개만 남긴다."""
        ops = [{"op": "add", "code": f"{i:06d}", "name": f"종목{i}"} for i in range(40)]
        r = run([*ops, {"op": "all"}])
        assert len(r["ops"][0]["result"]) == 30
        # 최근 것들이 남아야 한다(가장 나중에 추가한 000039 이 맨 앞).
        assert r["ops"][0]["result"][0]["code"] == "000039"
