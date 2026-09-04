"""
'누리의 아침 인사' 시리즈를 유튜브에 업로드한다.

OAuth 인증, 공개 시각 예약 로직(_compute_publish_at), 실제 업로드/썸네일 설정 함수는
upload_youtube.py의 것을 그대로 재사용한다 (둘 다 채널 특정 로직이 전혀 없는 범용
함수라서 그대로 가져다 써도 안전함). 이 파일에서 새로 정의하는 건 '누리의 아침 인사'
시리즈 전용 제목/설명/태그(_build_body_nuri)뿐이다.

PUBLISH_TIME_LOCAL 환경변수로 이 시리즈만의 공개 목표 시각(예: 05:00)을 지정한다 -
_compute_publish_at()이 이미 환경변수 기반이라 코드 수정 없이 그대로 재사용 가능.
"""
import json
import os

import config
from state_store import load_history, record_upload
from upload_youtube import (
    _build_youtube_client,
    _compute_publish_at,
    _set_thumbnail,
    _upload_video,
)

TITLE_SUFFIX = " | 누리의 아침 인사"

# 설명란 첫 3개 해시태그가 제목 위에 칩으로 노출된다 (메인 채널과 동일한 이유로 우선순위 고정).
PRIORITY_HASHTAGS = ["Shorts", "누리", "강아지"]
DESCRIPTION_HASHTAG_LIMIT = 6
DEFAULT_TAGS = ["누리", "강아지", "반려견", "힐링", "아침인사", "동기부여", "귀여운강아지", "펫스타그램"]

DESCRIPTION_INTRO = "매일 아침, 누리가 오늘 하루도 힘내라고 인사하러 왔어요 🐶🌅"


def _build_body_nuri(script_data: dict, publish_at: str | None) -> dict:
    tail = TITLE_SUFFIX
    max_len = 90
    base_title = script_data["title"]
    max_base_len = max_len - len(tail)
    if len(base_title) > max_base_len:
        base_title = base_title[:max_base_len]
    title = f"{base_title}{tail}"

    tags = DEFAULT_TAGS
    ordered_tags = PRIORITY_HASHTAGS + [t for t in tags if t not in PRIORITY_HASHTAGS]
    visible_hashtags = ordered_tags[:DESCRIPTION_HASHTAG_LIMIT]

    description = (
        f"{DESCRIPTION_INTRO}\n\n"
        f"{script_data['script']}\n\n"
        "누리는 매일 아침 새로운 인사말로 찾아와요. 오늘도 좋은 하루 보내세요!\n"
        "이 영상은 대본 생성 및 음성 합성(TTS)을 활용해 자동으로 제작되었습니다.\n\n"
        + " ".join(f"#{t}" for t in visible_hashtags)
    )

    status = {
        "privacyStatus": "private" if publish_at else "public",
        "selfDeclaredMadeForKids": config.MADE_FOR_KIDS,
    }
    if publish_at:
        status["publishAt"] = publish_at

    return {
        "snippet": {
            "title": title,
            "description": description,
            "tags": ["shorts"] + tags,
            "categoryId": config.YOUTUBE_CATEGORY_ID,
        },
        "status": status,
    }


def main():
    out_dir = config.OUTPUT_DIR
    with open(os.path.join(out_dir, "script.json"), "r", encoding="utf-8") as f:
        script_data = json.load(f)

    video_path = os.path.join(out_dir, "video.mp4")
    thumbnail_path = os.path.join(out_dir, "thumbnail.jpg")

    publish_at = _compute_publish_at()
    body = _build_body_nuri(script_data, publish_at)

    youtube = _build_youtube_client()
    video_id = _upload_video(youtube, video_path, body)
    _set_thumbnail(youtube, video_id, thumbnail_path)

    print(f"[upload_nuri] 업로드 완료: https://youtube.com/shorts/{video_id}")
    print(f"[upload_nuri] publishAt={publish_at or '(즉시 공개)'}")

    history = load_history()
    record_upload(
        history,
        title=script_data["title"],
        category=script_data["category"],
        video_id=video_id,
        publish_at=publish_at,
    )


if __name__ == "__main__":
    main()
