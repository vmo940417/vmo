"""안드로이드 앱의 tables.js 를 파이썬 원본에서 생성한다.

    cd app && python tools/gen_tables.py

업종/테마 맵(peers.py)과 요금표(pricing.py)는 앱과 서버가 같은 값을 써야 하는데,
손으로 옮기면 반드시 어느 시점에 갈라진다. 그래서 파이썬을 단일 원본으로 두고
여기서 뽑아낸다. 표를 고칠 일이 생기면 파이썬 쪽을 고치고 이걸 다시 돌린다.

test_js_tables.py 가 생성된 파일이 원본과 일치하는지(= 다시 생성해야 하는 상태가
아닌지) 확인한다.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server.analysis.llm import RESPONSE_TOOL, SYSTEM  # noqa: E402
from server.peers import CODE_OVERRIDES, PEERS, SECTOR_ALIASES  # noqa: E402
from server.pricing import (  # noqa: E402
    CACHE_READ_MULTIPLIER,
    CACHE_WRITE_MULTIPLIER,
    DEFAULT_USD_KRW,
    PRICES,
)

OUT = (Path(__file__).resolve().parents[2] / "android" / "app" / "src" / "main"
       / "assets" / "tables.js")

HEADER = """/* 업종/테마 맵과 요금표 — peers.py / pricing.py 에서 생성된 파일.
 *
 * 손으로 옮기면 반드시 갈라지므로 tools/gen_tables.py 가 파이썬 원본에서 뽑아낸다.
 * 표를 고칠 일이 있으면 파이썬 쪽을 고치고 이 파일을 다시 생성할 것.
 */
"""


def render() -> str:
    j = lambda o: json.dumps(o, ensure_ascii=False, indent=2)  # noqa: E731
    prices = {
        name: {
            "input": p.input,
            "output": p.output,
            "intro_input": p.intro_input,
            "intro_output": p.intro_output,
            "intro_until": p.intro_until.isoformat() if p.intro_until else None,
        }
        for name, p in PRICES.items()
    }

    return HEADER + f"""(function (global) {{
  'use strict';

  const PEERS = {j(PEERS)};

  const SECTOR_ALIASES = {j(SECTOR_ALIASES)};

  const CODE_OVERRIDES = {j(CODE_OVERRIDES)};

  const PRICES = {j(prices)};

  const CACHE_WRITE_MULTIPLIER = {CACHE_WRITE_MULTIPLIER};
  const CACHE_READ_MULTIPLIER = {CACHE_READ_MULTIPLIER};
  const DEFAULT_USD_KRW = {DEFAULT_USD_KRW};

  // 프롬프트도 같이 뽑는다. 앱과 서버가 다른 지시를 받으면 답이 갈라진다.
  const SYSTEM = {j(SYSTEM)};

  const RESPONSE_TOOL = {j(RESPONSE_TOOL)};

  global.Tables = {{
    PEERS, SECTOR_ALIASES, CODE_OVERRIDES, PRICES,
    CACHE_WRITE_MULTIPLIER, CACHE_READ_MULTIPLIER, DEFAULT_USD_KRW,
    SYSTEM, RESPONSE_TOOL,
  }};
}})(typeof globalThis !== 'undefined' ? globalThis : this);
"""


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(), encoding="utf-8")
    print(f"  테마 {len(PEERS)}개 · 별칭 {len(SECTOR_ALIASES)}개 · "
          f"코드 지정 {len(CODE_OVERRIDES)}개 · 요금 {len(PRICES)}개")
    print(f"-> {OUT}")


if __name__ == "__main__":
    main()
