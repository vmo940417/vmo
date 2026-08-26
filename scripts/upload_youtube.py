"""
output/{script.json, video.mp4, thumbnail.jpg} 를 유튜브에 업로드한다.

인증: OAuth 2.0 refresh token 방식 (한 번만 get_refresh_token.py 로 발급받아
GitHub Secrets 에 저장해두면, 이후 매일 실행 시 브라우저 로그인 없이 자동 갱신된다).

공개 시각: 워크플로우가 목표 공개 시각(config.PUBLISH_TIME_LOCAL, 기본 06:00 KST)보다
먼저 실행되면 privacyStatus=private + publishAt 예약 게시로 올려서, GitHub Actions의
cron 지연과 무관하게 유튜브가 정확한 시각에 공개하도록 한다. 이미 그 시각이 지났다면
바로 공개(public)로 업로드한다.
"""
import datetime
import json
import os
import sys
import zoneinfo

import config
from state_store import load_history, record_upload

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
TOKEN_URI = "https://oauth2.googleapis.com/token"


def _build_youtube_client():
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build

    client_id = os.environ["YOUTUBE_CLIENT_ID"]
    client_secret = os.environ["YOUTUBE_CLIENT_SECRET"]
    refresh_token = os.environ["YOUTUBE_REFRESH_TOKEN"]

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )
    return build("youtube", "v3", credentials=creds)


def _compute_publish_at() -> str | None:
    """목표 공개 시각(KST 06:00 등)이 아직 미래면 RFC3339 UTC 문자열을 반환하고,
    이미 지났으면 None(=즉시 공개)을 반환한다."""
    tz = zoneinfo.ZoneInfo(config.TIMEZONE)
    now = datetime.datetime.now(tz)
    hh, mm = map(int, config.PUBLISH_TIME_LOCAL.split(":"))
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)

    if target <= now:
        return None
    return target.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


TITLE_SUFFIX = " | 아침 활력 명언"


def _build_body(script_data: dict, publish_at: str | None) -> dict:
    # 대본에서 뽑은 제목은 "실패는 과정"처럼 짧고 시적인 문구라 그 자체로는 검색 키워드가
    # 약하다. 채널 브랜딩도 겸해서 "아침 활력 명언" 고정 접미사를 붙여, 검색에 잘 걸리는
    # 키워드를 제목에도 노출시킨다.
    max_len = 90  # 유튜브 제목 100자 제한에 여유를 둔다
    base_title = script_data["title"]
    max_base_len = max_len - len(TITLE_SUFFIX)
    if len(base_title) > max_base_len:
        base_title = base_title[:max_base_len]
    title = f"{base_title}{TITLE_SUFFIX}"

    description = (
        f"{script_data['script']}\n\n"
        f"매일 아침 하나씩, {config.CHANNEL_TOPIC}!\n"
        f"이 영상은 대본 생성(AI)과 음성 합성(TTS)을 활용해 자동으로 제작되었습니다.\n\n"
        f"#Shorts #{script_data['category'].replace(' ', '').replace('·', '')} "
        + " ".join(f"#{t}" for t in config.DEFAULT_TAGS)
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
            "tags": config.DEFAULT_TAGS + [script_data["category"]],
            "categoryId": config.YOUTUBE_CATEGORY_ID,
        },
        "status": status,
    }


def _upload_video(youtube, video_path: str, body: dict) -> str:
    from googleapiclient.http import MediaFileUpload

    media = MediaFileUpload(video_path, mimetype="video/mp4", chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"[upload_youtube] 업로드 진행률: {int(status.progress() * 100)}%")
    return response["id"]


def _set_thumbnail(youtube, video_id: str, thumbnail_path: str):
    from googleapiclient.http import MediaFileUpload

    if not os.path.exists(thumbnail_path):
        return
    try:
        media = MediaFileUpload(thumbnail_path, mimetype="image/jpeg")
        youtube.thumbnails().set(videoId=video_id, media_body=media).execute()
        print("[upload_youtube] 썸네일 설정 완료")
    except Exception as exc:
        # 전화번호 인증이 안 된 채널은 커스텀 썸네일 설정이 거부될 수 있다.
        # 영상 업로드 자체는 이미 성공했으므로 여기서 실패해도 치명적이지 않다.
        print(f"[upload_youtube] 썸네일 설정 실패(무시하고 계속): {exc}", file=sys.stderr)


def main():
    out_dir = config.OUTPUT_DIR
    with open(os.path.join(out_dir, "script.json"), "r", encoding="utf-8") as f:
        script_data = json.load(f)

    video_path = os.path.join(out_dir, "video.mp4")
    thumbnail_path = os.path.join(out_dir, "thumbnail.jpg")

    publish_at = _compute_publish_at()
    body = _build_body(script_data, publish_at)

    youtube = _build_youtube_client()
    video_id = _upload_video(youtube, video_path, body)
    _set_thumbnail(youtube, video_id, thumbnail_path)

    print(f"[upload_youtube] 업로드 완료: https://youtube.com/shorts/{video_id}")
    print(f"[upload_youtube] publishAt={publish_at or '(즉시 공개)'}")

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
