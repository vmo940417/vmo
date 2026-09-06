"""
output/{script.json, video.mp4, thumbnail.jpg} 를 유튜브에 업로드한다.

인증: OAuth 2.0 refresh token 방식 (한 번만 get_refresh_token.py 로 발급받아
GitHub Secrets 에 저장해두면, 이후 매일 실행 시 브라우저 로그인 없이 자동 갱신된다).

공개 시각: 항상 "다음" 목표 공개 시각(config.PUBLISH_TIME_LOCAL, 기본 03:00 KST)에
맞춰 privacyStatus=private + publishAt 예약 게시로 올린다. 오늘 그 시각이 이미
지났다면 내일 같은 시각으로 예약한다 - 즉 GitHub Actions의 schedule(cron) 트리거가
몇 시에 실행되든(정시든, 몇 시간 지연이든) 절대 "즉시 공개"로 새지 않고 항상 정확히
목표 시각에만 공개된다.

(예전에는 목표 시각이 지났으면 즉시 공개로 처리했는데, 실제 운영에서 GitHub Actions의
schedule 지연이 예상보다 훨씬 커서(최대 9시간 가까이 관측됨) 이 즉시 공개 경로가
계속 발동해 매일 03:00 정시 공개가 지켜지지 않는 문제가 있었다. PUBLISH_NOW=1
환경변수를 주면 이 예약을 건너뛰고 즉시 공개하는데, 이건 수동 테스트로 결과를 바로
확인하고 싶을 때만 쓴다.)

(추가 수정: "목표 시각이 지났으면 다음 시각으로" 로직만으로는 부족하다는 게 실제
운영에서 드러났다 - cron이 늦게 돌아 오늘자 실행이 "내일 03:00"으로 롤된 상태에서,
그 다음날 실행이 운 좋게 제시간에 돌면 똑같이 "오늘(=방금 롤된 그 날짜) 03:00"을
계산해버려서 두 영상이 정확히 같은 시각에 동시 공개되는 사고가 실제로 발생했다.
그래서 state/history.json에 기록해둔 마지막 예약 시각을 확인해, 이번 예약이 그것보다
반드시 뒤가 되도록(같거나 이전이면 하루씩 더 미루는 식으로) 강제한다 - 이러면 cron이
아무리 불규칙하게 돌아도 발행 시각은 항상 엄격히 증가하기만 해서 겹칠 수가 없다.)
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


def _last_scheduled_publish_at():
    """state/history.json에 기록된 업로드들 중 가장 최근에 예약된 publish_at을
    UTC datetime으로 반환한다 (즉시 공개로 올라가 publish_at이 없는 항목은 건너뜀).
    기록이 없으면 None."""
    history = load_history()
    for entry in reversed(history.get("uploads", [])):
        publish_at = entry.get("publish_at")
        if publish_at:
            return datetime.datetime.strptime(publish_at, "%Y-%m-%dT%H:%M:%SZ").replace(
                tzinfo=datetime.timezone.utc
            )
    return None


def _compute_publish_at() -> str | None:
    """다음 목표 공개 시각(KST, config.PUBLISH_TIME_LOCAL)을 RFC3339 UTC 문자열로
    반환한다. 오늘 그 시각이 이미 지났으면 내일 같은 시각으로 넘긴다 - 그래서 이
    함수는 (PUBLISH_NOW=1로 강제하지 않는 한) 항상 "미래의 예약 시각"만 반환하고,
    즉시 공개(None)로 새는 경우가 없다. GitHub Actions cron이 몇 시에 실행되든
    상관없이 항상 정확히 03:00에만 공개되도록 하기 위한 설계.

    여기에 더해, 직전에 이미 예약해둔 마지막 시각(state/history.json 기록)보다
    반드시 뒤가 되도록 강제한다 - cron이 늦게 돌아 오늘자가 "내일 03:00"으로 롤된
    상태에서 그 다음날 실행이 제시간에 돌아 우연히 같은 날짜를 계산해버리는 충돌을
    막기 위함이다 (실제로 이 충돌 때문에 서로 다른 두 영상이 같은 시각에 동시
    공개된 적이 있음). 겹치면 겹치지 않을 때까지 하루씩 더 미룬다.

    PUBLISH_NOW=1이면 이 예약 로직을 건너뛰고 무조건 None(즉시 공개)을 반환한다
    (변경 사항을 바로 확인하고 싶은 수동 테스트용)."""
    if os.environ.get("PUBLISH_NOW") == "1":
        return None

    tz = zoneinfo.ZoneInfo(config.TIMEZONE)
    now = datetime.datetime.now(tz)
    hh, mm = map(int, config.PUBLISH_TIME_LOCAL.split(":"))
    target = now.replace(hour=hh, minute=mm, second=0, microsecond=0)

    if target <= now:
        target += datetime.timedelta(days=1)

    last_publish_at = _last_scheduled_publish_at()
    if last_publish_at is not None:
        while target.astimezone(datetime.timezone.utc) <= last_publish_at:
            target += datetime.timedelta(days=1)

    return target.astimezone(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


TITLE_SUFFIX = " | 아침 활력 명언"
TITLE_HASHTAG = "#아침명언"

# 설명란의 첫 3개 해시태그는 유튜브가 제목 위에 클릭 가능한 칩으로 자동 노출한다
# (2026 유튜브 쇼츠 SEO 조사 반영). 검색 유입이 가장 클 것으로 예상되는 키워드를
# 맨 앞에 오도록 순서를 고정한다.
PRIORITY_HASHTAGS = ["Shorts", "아침명언", "동기부여"]

# 해시태그는 3~5개가 적정이고 너무 많이 나열하면 오히려 효과가 떨어진다는 조사 결과를
# 반영해, 설명란에 "보이는" 해시태그는 이 개수로 제한한다. 나머지 태그들은 검색
# 매칭용 tags 필드(화면에 노출되지 않음)에는 그대로 다 넣는다.
DESCRIPTION_HASHTAG_LIMIT = 6

# 설명란 맨 앞에 넣는 키워드 문장. 예전에는 대본 원문으로 바로 시작해서 "아침 명언"
# 같은 실제 검색어가 설명 앞부분에 전혀 없었는데, 이제 첫 줄에 핵심 키워드를 자연스러운
# 문장으로 넣어 알고리즘이 주제를 더 쉽게 파악하도록 한다.
DESCRIPTION_INTRO = "매일 아침 활력을 주는 짧은 명언 🌅 오늘의 명언으로 하루를 시작해보세요."


def _build_body(script_data: dict, publish_at: str | None) -> dict:
    # 대본에서 뽑은 제목은 "실패는 과정"처럼 짧고 시적인 문구라 그 자체로는 검색 키워드가
    # 약하다. 채널 브랜딩용 접미사 + 검색 키워드 해시태그를 붙여, 검색에 잘 걸리는
    # 키워드를 제목에도 노출시킨다 (해시태그가 제목에 있으면 분류/노출 우선순위가 올라감).
    tail = f"{TITLE_SUFFIX} {TITLE_HASHTAG}"
    max_len = 90  # 유튜브 제목 100자 제한에 여유를 둔다
    base_title = script_data["title"]
    max_base_len = max_len - len(tail)
    if len(base_title) > max_base_len:
        base_title = base_title[:max_base_len]
    title = f"{base_title}{tail}"

    category_tag = script_data["category"].replace(" ", "").replace("·", "")
    tags = config.DEFAULT_TAGS + [category_tag]
    # 우선순위 태그를 맨 앞으로, 중복은 제거하고 나머지를 뒤에 붙인다.
    ordered_tags = PRIORITY_HASHTAGS + [t for t in tags if t not in PRIORITY_HASHTAGS]
    visible_hashtags = ordered_tags[:DESCRIPTION_HASHTAG_LIMIT]

    description = (
        f"{DESCRIPTION_INTRO}\n\n"
        f"{script_data['script']}\n\n"
        f"매일 아침 하나씩, {config.CHANNEL_TOPIC}!\n"
        f"이 영상은 대본 생성(AI)과 음성 합성(TTS)을 활용해 자동으로 제작되었습니다.\n\n"
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
