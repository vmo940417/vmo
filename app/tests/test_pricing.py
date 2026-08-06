"""요금 계산 + 사용량 누적 테스트.

비용은 조용히 틀리면 제일 나쁜 종류의 버그다 — 화면에 그럴듯한 숫자가 찍히니
아무도 의심하지 않는다. 그래서 단가와 산식을 직접 못박아 둔다.
"""

from __future__ import annotations

import json
import sys
from datetime import date, datetime, timedelta
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from server import usage  # noqa: E402
from server.pricing import PRICES, cost_of, format_cost, usd_krw  # noqa: E402

BEFORE_INTRO_END = date(2026, 8, 6)
AFTER_INTRO_END = date(2026, 9, 1)


def tokens(inp: int = 2000, out: int = 600, **extra) -> dict:
    return {"input_tokens": inp, "output_tokens": out, **extra}


class TestSonnetIntroPricing:
    def test_intro_rates_applied_before_deadline(self):
        """도입가 $2/$10: 2000 in + 600 out."""
        c = cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END)
        expected = (2000 * 2.00 + 600 * 10.00) / 1_000_000
        assert c["usd"] == pytest.approx(expected)
        assert c["intro_pricing"] is True
        assert c["intro_until"] == "2026-08-31"

    def test_reverts_to_list_price_after_deadline(self):
        """만료일이 지나면 코드를 안 고쳐도 정가로 넘어가야 한다."""
        c = cost_of(tokens(), "claude-sonnet-5", on=AFTER_INTRO_END)
        expected = (2000 * 3.00 + 600 * 15.00) / 1_000_000
        assert c["usd"] == pytest.approx(expected)
        assert c["intro_pricing"] is False

    def test_intro_is_cheaper(self):
        before = cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END)["usd"]
        after = cost_of(tokens(), "claude-sonnet-5", on=AFTER_INTRO_END)["usd"]
        assert before < after

    def test_last_intro_day_still_discounted(self):
        c = cost_of(tokens(), "claude-sonnet-5", on=date(2026, 8, 31))
        assert c["intro_pricing"] is True


class TestOtherModels:
    def test_opus_5(self):
        c = cost_of(tokens(), "claude-opus-5", on=BEFORE_INTRO_END)
        assert c["usd"] == pytest.approx((2000 * 5.00 + 600 * 25.00) / 1_000_000)
        assert c["intro_pricing"] is False

    def test_opus_costs_more_than_sonnet(self):
        s = cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END)["usd"]
        o = cost_of(tokens(), "claude-opus-5", on=BEFORE_INTRO_END)["usd"]
        assert o > s

    def test_dated_suffix_resolves(self):
        """응답 모델명에 날짜 접미사가 붙어도 요금을 찾아야 한다."""
        c = cost_of(tokens(), "claude-sonnet-5-20260101", on=BEFORE_INTRO_END)
        assert c["priced_as"] == "claude-sonnet-5"
        assert c["usd"] is not None

    def test_longest_prefix_wins(self):
        """'claude-opus-4-8' 이 'claude-opus-4' 류 접두사에 잘못 잡히면 안 된다."""
        c = cost_of(tokens(), "claude-opus-4-8", on=BEFORE_INTRO_END)
        assert c["priced_as"] == "claude-opus-4-8"

    def test_unknown_model_reports_none_not_zero(self):
        """모르는 모델을 0원으로 찍으면 공짜인 줄 안다."""
        c = cost_of(tokens(), "some-future-model")
        assert c["usd"] is None
        assert c["krw"] is None
        assert c["total_tokens"] == 2600
        assert "요금 정보 없음" in c["note"]


class TestTokenAccounting:
    def test_totals_include_cache_tokens(self):
        c = cost_of(tokens(cache_read_input_tokens=500,
                           cache_creation_input_tokens=100), "claude-sonnet-5")
        assert c["total_tokens"] == 2000 + 600 + 500 + 100

    def test_cache_reads_are_cheaper_than_fresh_input(self):
        fresh = cost_of(tokens(inp=3000, out=0), "claude-sonnet-5", on=BEFORE_INTRO_END)
        cached = cost_of(tokens(inp=2000, out=0, cache_read_input_tokens=1000),
                         "claude-sonnet-5", on=BEFORE_INTRO_END)
        assert cached["usd"] < fresh["usd"]

    def test_zero_usage_is_zero_cost(self):
        c = cost_of({}, "claude-sonnet-5")
        assert c["usd"] == 0 and c["total_tokens"] == 0

    def test_krw_follows_configured_rate(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_USD_KRW", "1500")
        c = cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END)
        assert c["krw"] == pytest.approx(c["usd"] * 1500, abs=0.5)

    def test_bad_rate_falls_back(self, monkeypatch):
        monkeypatch.setenv("STOCKWHY_USD_KRW", "not-a-number")
        assert usd_krw() == 1400.0

    def test_realistic_query_is_about_a_cent(self):
        """사용자에게 안내한 '1회 약 1센트'가 실제 산식과 맞는지."""
        c = cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END)
        assert 0.005 < c["usd"] < 0.02


class TestFormat:
    def test_none_means_no_llm(self):
        assert "LLM 미사용" in format_cost(None)

    def test_includes_tokens_and_won(self):
        s = format_cost(cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END))
        assert "2,000 in" in s and "600 out" in s and "원)" in s

    def test_flags_intro_pricing(self):
        s = format_cost(cost_of(tokens(), "claude-sonnet-5", on=BEFORE_INTRO_END))
        assert "도입가" in s

    def test_unknown_model_says_so(self):
        assert "요금 정보 없음" in format_cost(cost_of(tokens(), "mystery"))


@pytest.fixture
def log(tmp_path, monkeypatch):
    path = tmp_path / "usage.jsonl"
    monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(path))
    return path


class TestUsageLog:
    def test_records_a_call(self, log):
        usage.record("삼성전자", "005930", cost_of(tokens(), "claude-sonnet-5"))
        entry = json.loads(log.read_text(encoding="utf-8").strip())
        assert entry["code"] == "005930"
        assert entry["input_tokens"] == 2000

    def test_skips_when_no_llm(self, log):
        usage.record("삼성전자", "005930", None)
        assert not log.exists()

    def test_skips_unpriced_models(self, log):
        """비용을 모르는 호출을 0원으로 누적하면 합계가 거짓말이 된다."""
        usage.record("삼성전자", "005930", cost_of(tokens(), "mystery-model"))
        assert not log.exists()

    def test_long_query_truncated(self, log):
        usage.record("가" * 200, "005930", cost_of(tokens(), "claude-sonnet-5"))
        entry = json.loads(log.read_text(encoding="utf-8").strip())
        assert len(entry["query"]) <= 40

    def test_write_failure_is_swallowed(self, monkeypatch, tmp_path):
        """가계부 때문에 시세 분석이 죽으면 안 된다."""
        monkeypatch.setenv("STOCKWHY_USAGE_LOG", str(tmp_path / "nope" / "x.jsonl"))
        monkeypatch.setattr(Path, "mkdir", lambda *a, **k: (_ for _ in ()).throw(OSError()))
        usage.record("삼성전자", "005930", cost_of(tokens(), "claude-sonnet-5"))  # no raise


class TestUsageSummary:
    def test_empty_log(self, log):
        s = usage.summarize()
        assert all(b["calls"] == 0 for b in s["buckets"])
        assert "아직 기록이 없습니다" in usage.render(s)

    def test_buckets_split_by_date(self, log):
        today = date(2026, 8, 6)
        rows = [
            {"ts": f"{today}T10:00:00", "usd": 0.01, "krw": 14, "input_tokens": 2000, "output_tokens": 600},
            {"ts": f"{today - timedelta(days=5)}T10:00:00", "usd": 0.01, "krw": 14, "input_tokens": 2000, "output_tokens": 600},
            {"ts": f"{today - timedelta(days=60)}T10:00:00", "usd": 0.01, "krw": 14, "input_tokens": 2000, "output_tokens": 600},
        ]
        log.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")

        day, month, total = usage.summarize(today=today)["buckets"]
        assert day["calls"] == 1
        assert month["calls"] == 2      # 60일 전 건은 빠진다
        assert total["calls"] == 3

    def test_totals_sum(self, log):
        for _ in range(4):
            usage.record("삼성전자", "005930", cost_of(tokens(), "claude-sonnet-5",
                                                   on=BEFORE_INTRO_END))
        total = usage.summarize()["buckets"][2]
        assert total["calls"] == 4
        # 1회 = (2000×$2 + 600×$10)/1M = 정확히 $0.01
        assert total["usd"] == pytest.approx(0.04)
        assert total["avg_usd"] == pytest.approx(0.01)

    def test_monthly_projection(self, log):
        """하루에 2회씩 쓴 하루치 기록 -> 월 22거래일 환산."""
        today = date(2026, 8, 6)
        rows = [{"ts": f"{today}T10:0{i}:00", "usd": 0.01, "krw": 14,
                 "input_tokens": 2000, "output_tokens": 600} for i in range(2)]
        log.write_text("\n".join(json.dumps(r) for r in rows), encoding="utf-8")

        s = usage.summarize(today=today)
        assert s["active_days"] == 1
        assert s["projected_monthly_usd"] == pytest.approx(0.02 * 22, rel=0.01)

    def test_corrupt_lines_skipped(self, log):
        log.write_text('{"ts": "2026-08-06T10:00:00", "usd": 0.01, "krw": 14}\n'
                       'this is not json\n'
                       '{"ts": "2026-08-06T11:00:00", "usd": 0.01, "krw": 14}\n',
                       encoding="utf-8")
        assert usage.summarize(today=date(2026, 8, 6))["buckets"][2]["calls"] == 2

    def test_render_has_projection(self, log):
        usage.record("삼성전자", "005930", cost_of(tokens(), "claude-sonnet-5"))
        text = usage.render(usage.summarize())
        assert "월 예상" in text and "전체" in text


class TestPriceTableSanity:
    @pytest.mark.parametrize("model", list(PRICES))
    def test_output_costs_more_than_input(self, model):
        p = PRICES[model]
        assert p.output > p.input

    @pytest.mark.parametrize("model", list(PRICES))
    def test_intro_is_complete_or_absent(self, model):
        """도입가는 셋(단가2 + 만료일)이 다 있거나 아예 없거나여야 한다."""
        p = PRICES[model]
        parts = [p.intro_input, p.intro_output, p.intro_until]
        assert all(x is None for x in parts) or all(x is not None for x in parts)
