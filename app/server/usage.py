"""LLM 사용량 누적 기록.

1회 비용은 작아서 감이 안 온다. 정작 궁금한 건 "이번 달 얼마 나왔나"라서
질의마다 한 줄씩 JSONL 로 append 해두고 나중에 합산한다.

DB 를 쓰지 않는 이유: 이 앱은 혼자 쓰는 도구고, JSONL 은 파일 하나라 백업도
삭제도 쉽고 엑셀로도 열린다. 기록 실패가 분석을 막으면 안 되므로 어떤 예외도
조용히 삼킨다 — 가계부 때문에 시세 분석이 죽는 건 말이 안 된다.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Optional

from .config import APP_DIR

LOG_PATH = APP_DIR / ".usage.jsonl"
MAX_QUERY_LEN = 40


def _log_path() -> Path:
    override = os.getenv("STOCKWHY_USAGE_LOG", "").strip()
    return Path(override) if override else LOG_PATH


def record(query: str, code: Optional[str], cost: Optional[dict]) -> None:
    """질의 1건을 기록한다. LLM 을 쓰지 않았으면(cost 없음) 남기지 않는다."""
    if not cost or cost.get("usd") is None:
        return
    try:
        entry = {
            "ts": datetime.now().isoformat(timespec="seconds"),
            "query": query[:MAX_QUERY_LEN],
            "code": code,
            "model": cost.get("priced_as") or cost.get("model"),
            "input_tokens": cost.get("input_tokens", 0),
            "output_tokens": cost.get("output_tokens", 0),
            "usd": cost.get("usd", 0.0),
            "krw": cost.get("krw", 0.0),
        }
        path = _log_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except Exception:  # noqa: BLE001 - 기록 실패가 분석을 막으면 안 된다
        pass


@dataclass
class Bucket:
    label: str
    calls: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    usd: float = 0.0
    krw: float = 0.0

    def add(self, e: dict) -> None:
        self.calls += 1
        self.input_tokens += int(e.get("input_tokens") or 0)
        self.output_tokens += int(e.get("output_tokens") or 0)
        self.usd += float(e.get("usd") or 0.0)
        self.krw += float(e.get("krw") or 0.0)

    def as_dict(self) -> dict:
        return {
            "label": self.label, "calls": self.calls,
            "input_tokens": self.input_tokens, "output_tokens": self.output_tokens,
            "usd": round(self.usd, 4), "krw": round(self.krw),
            "avg_usd": round(self.usd / self.calls, 5) if self.calls else 0.0,
        }


def read_entries() -> list[dict]:
    path = _log_path()
    if not path.exists():
        return []
    out: list[dict] = []
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue  # 손상된 줄은 건너뛴다
    except OSError:
        return []
    return out


def summarize(today: Optional[date] = None) -> dict:
    """오늘 / 최근 30일 / 전체 합계."""
    today = today or date.today()
    entries = read_entries()

    day = Bucket("오늘")
    month = Bucket("최근 30일")
    total = Bucket("전체")
    cutoff = today - timedelta(days=29)

    for e in entries:
        total.add(e)
        try:
            when = datetime.fromisoformat(str(e.get("ts", ""))).date()
        except ValueError:
            continue
        if when >= cutoff:
            month.add(e)
        if when == today:
            day.add(e)

    by_model: dict[str, int] = {}
    for e in entries:
        name = str(e.get("model") or "unknown")
        by_model[name] = by_model.get(name, 0) + 1

    # 하루 평균으로 월 예상치를 낸다. 거래일은 월 22일로 본다.
    active_days = len({str(e.get("ts", ""))[:10] for e in entries if e.get("ts")})
    projected = (total.usd / active_days * 22) if active_days else 0.0

    return {
        "log_path": str(_log_path()),
        "buckets": [day.as_dict(), month.as_dict(), total.as_dict()],
        "by_model": by_model,
        "active_days": active_days,
        "projected_monthly_usd": round(projected, 2),
        "projected_monthly_krw": round(projected * _krw_rate()),
    }


def _krw_rate() -> float:
    from .pricing import usd_krw
    return usd_krw()


def render(summary: dict) -> str:
    lines = ["LLM 사용량", "=" * 52]
    for b in summary["buckets"]:
        if b["calls"] == 0:
            lines.append(f"  {b['label']:<10} 기록 없음")
            continue
        lines.append(
            f"  {b['label']:<10} {b['calls']:>4}회 · "
            f"{b['input_tokens']:,} in / {b['output_tokens']:,} out · "
            f"${b['usd']:.4f} (약 {b['krw']:,}원) · 평균 ${b['avg_usd']:.4f}/회"
        )

    if summary["by_model"]:
        lines.append("")
        lines.append("  모델별: " + ", ".join(f"{k} {v}회" for k, v in summary["by_model"].items()))

    if summary["active_days"]:
        lines.append("")
        lines.append(
            f"  이 사용 패턴이면 월 예상 ${summary['projected_monthly_usd']:.2f} "
            f"(약 {summary['projected_monthly_krw']:,}원) — {summary['active_days']}일 사용 기준, 월 22거래일 환산"
        )
    else:
        lines.append("")
        lines.append("  아직 기록이 없습니다. LLM 을 켜고 몇 번 돌려보세요.")

    lines.append("")
    lines.append(f"  기록: {summary['log_path']}")
    return "\n".join(lines)
