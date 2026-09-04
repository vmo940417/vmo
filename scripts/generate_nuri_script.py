"""
'누리의 아침 인사' 시리즈의 오늘 인사말을 정한다.

scripts/nuri_phrases.json에 미리 준비해둔 문구 풀에서, song.py와 같은 방식으로
KST 날짜(순번)를 인덱스로 삼아 순환 선택한다 - 무작위가 아니라 날짜 기준이라 같은 날
여러 번 실행돼도 항상 같은 문구가 나오고, 날짜가 바뀌면 다음 문구로 정확히 넘어간다.
문구를 추가/수정하고 싶으면 scripts/nuri_phrases.json을 편집하면 된다.

출력은 기존 파이프라인(build_video.py류)이 기대하는 것과 같은 output/script.json
형태({"title", "script", "category"})라서, tts.py 등 하위 단계를 그대로 재사용할 수 있다.
"""
import datetime
import json
import os
import zoneinfo

import config

PHRASES_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "nuri_phrases.json")
CATEGORY = "누리의 아침 인사"


def _load_phrases():
    with open(PHRASES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def pick_today_phrase():
    phrases = _load_phrases()
    tz = zoneinfo.ZoneInfo(config.TIMEZONE)
    today_ordinal = datetime.datetime.now(tz).toordinal()
    return phrases[today_ordinal % len(phrases)]


def main():
    phrase = pick_today_phrase()
    script_data = {
        "title": phrase["title"],
        "script": phrase["script"],
        "category": CATEGORY,
    }

    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(config.OUTPUT_DIR, "script.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(script_data, f, ensure_ascii=False, indent=2)

    print(f"[generate_nuri_script] 오늘의 인사말: {phrase['title']!r} -> {out_path}")


if __name__ == "__main__":
    main()
