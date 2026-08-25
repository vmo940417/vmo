"""
오늘의 쇼츠 대본을 생성한다.

1순위: ANTHROPIC_API_KEY가 설정되어 있으면 Claude API로 오늘 카테고리에 맞는
       새로운 지식/상식/명언 콘텐츠를 생성한다 (최근 사용한 제목은 프롬프트에서 제외 요청).
2순위: API 키가 없거나 호출이 실패하면 scripts/topics_pool.json 에서
       최근에 쓰지 않은 항목을 하나 골라 사용한다(오프라인/무료 폴백).

출력: {"category": str, "title": str, "script": str} 형태의 dict.
"""
import datetime
import json
import os
import random
import sys
import zoneinfo

import config
from state_store import load_history

SYSTEM_PROMPT = """당신은 한국어 유튜브 쇼츠 채널의 대본 작가입니다.
채널 주제는 "지식・상식・명언"이며, 매일 새로운 짧은 영상을 하나씩 올립니다.
시청자가 3초 안에 눈길을 멈추고, 40~55초 안에 "오 신기하다"하고 느낄 만한
흥미로운 사실 하나 또는 명언 하나를 다룬 대본을 씁니다.

규칙:
- 반드시 순수한 JSON 객체 하나만 출력한다. 다른 설명, 코드블록 표시(```) 없이.
- JSON 키는 title, script 두 개만 사용한다.
- title: 15자 내외의 후킹되는 제목 (예: "번개보다 천둥이 늦게 들리는 이유")
- script: 실제로 소리 내어 읽을 내레이션 전체 텍스트. 아래 구조를 따른다.
  1) 첫 문장: 궁금증을 유발하는 후킹 질문이나 놀라운 사실 제시
  2) 중간: 왜 그런지에 대한 쉬운 설명 (사실에 기반, 과장/허위 금지)
  3) 마지막 문장: 여운을 주는 한 마디 또는 자연스러운 마무리
- script 전체 길이는 공백 포함 130~200자 사이로 작성한다 (너무 길면 60초를 넘긴다).
- 각 문장은 짧고 구어체로, 존댓말(해요체 또는 합쇼체)을 사용한다.
- 이미 사용된 주제와 겹치지 않는 새로운 소재를 사용한다.
- 사실관계가 불확실한 내용은 다루지 않는다.
"""


def pick_category(today: datetime.date) -> str:
    idx = today.timetuple().tm_yday % len(config.CATEGORIES)
    return config.CATEGORIES[idx]


def _extract_json(text: str) -> dict:
    text = text.strip()
    # 코드블록으로 감싸져 오는 경우 대비
    if text.startswith("```"):
        text = text.strip("`")
        text = text.split("\n", 1)[1] if "\n" in text else text
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError("응답에서 JSON 객체를 찾지 못했습니다: " + text[:200])
    return json.loads(text[start : end + 1])


def generate_via_llm(category: str, avoid_titles: list) -> dict | None:
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        return None
    try:
        import anthropic
    except ImportError:
        print("anthropic 패키지가 설치되어 있지 않습니다. 폴백을 사용합니다.", file=sys.stderr)
        return None

    client = anthropic.Anthropic(api_key=api_key)
    avoid_text = (
        "다음 제목/소재는 최근에 이미 다뤘으니 피해주세요: " + ", ".join(avoid_titles)
        if avoid_titles
        else "이전에 다룬 소재는 없습니다."
    )
    user_prompt = f"오늘의 카테고리: {category}\n{avoid_text}\n이 카테고리에 맞는 오늘의 대본을 만들어주세요."

    try:
        resp = client.messages.create(
            model=config.ANTHROPIC_MODEL,
            max_tokens=600,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
        text = "".join(block.text for block in resp.content if block.type == "text")
        data = _extract_json(text)
        if not data.get("title") or not data.get("script"):
            raise ValueError("title/script 누락")
        return {"category": category, "title": data["title"].strip(), "script": data["script"].strip()}
    except Exception as exc:  # LLM 실패는 치명적이지 않음 - 폴백으로 진행
        print(f"[generate_script] LLM 생성 실패, 폴백 풀 사용: {exc}", file=sys.stderr)
        return None


def generate_via_pool(category: str, avoid_titles: list) -> dict:
    with open(config.TOPICS_POOL_FILE, "r", encoding="utf-8") as f:
        pool = json.load(f)

    candidates = [p for p in pool if p["title"] not in avoid_titles]
    same_category = [p for p in candidates if p["category"] == category]
    chosen_pool = same_category or candidates or pool
    chosen = random.choice(chosen_pool)
    return {"category": chosen["category"], "title": chosen["title"], "script": chosen["script"]}


def main():
    tz = zoneinfo.ZoneInfo(config.TIMEZONE)
    today = datetime.datetime.now(tz).date()
    category = pick_category(today)

    history = load_history()
    avoid_titles = history.get("used_titles", [])

    result = generate_via_llm(category, avoid_titles)
    if result is None:
        result = generate_via_pool(category, avoid_titles)

    os.makedirs(config.OUTPUT_DIR, exist_ok=True)
    out_path = os.path.join(config.OUTPUT_DIR, "script.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"[generate_script] category={result['category']} title={result['title']}")
    print(f"[generate_script] saved -> {out_path}")


if __name__ == "__main__":
    main()
