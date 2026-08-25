"""
매일 실행 사이에 유지되어야 하는 최소한의 상태(state/history.json)를 관리한다.
- 최근에 사용한 주제 제목들을 기억해서 LLM 프롬프트에 "이건 피해줘"로 전달하거나,
  폴백 풀에서 중복 선택을 피하는 데 사용한다.
- 이 파일은 워크플로우가 실행 후 커밋해서 저장소에 유지한다(별도 DB 불필요).
"""
import json
import os

import config

HISTORY_KEEP = 60  # 최근 N개 제목만 기억 (그 이전 것은 다시 나와도 허용)


def load_history():
    if not os.path.exists(config.STATE_FILE):
        return {"used_titles": [], "uploads": []}
    with open(config.STATE_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {"used_titles": [], "uploads": []}


def save_history(history):
    os.makedirs(config.STATE_DIR, exist_ok=True)
    history["used_titles"] = history.get("used_titles", [])[-HISTORY_KEEP:]
    history["uploads"] = history.get("uploads", [])[-HISTORY_KEEP:]
    with open(config.STATE_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)


def record_upload(history, *, title, category, video_id, publish_at):
    history.setdefault("used_titles", []).append(title)
    history.setdefault("uploads", []).append(
        {
            "title": title,
            "category": category,
            "video_id": video_id,
            "publish_at": publish_at,
        }
    )
    save_history(history)
