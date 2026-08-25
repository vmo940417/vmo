"""
[최초 1회, 로컬 PC에서 실행] YouTube 업로드용 OAuth refresh token을 발급받는다.

사전 준비:
  1) https://console.cloud.google.com 에서 프로젝트 생성
  2) "YouTube Data API v3" 사용 설정
  3) OAuth 동의 화면 구성 (테스트 모드로도 충분, 본인 계정을 테스트 사용자로 추가)
  4) OAuth 클라이언트 ID 생성 -> 애플리케이션 유형: "데스크톱 앱"
  5) 클라이언트 ID / 클라이언트 보안 비밀 을 발급받는다

실행:
  YOUTUBE_CLIENT_ID=... YOUTUBE_CLIENT_SECRET=... python3 scripts/get_refresh_token.py

브라우저가 열리면 영상을 업로드할 유튜브 채널의 구글 계정으로 로그인 후 동의하면,
터미널에 refresh_token이 출력된다. 이 값을 GitHub Secrets 의 YOUTUBE_REFRESH_TOKEN 으로
등록하면 된다 (client id/secret도 각각 YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET 로 등록).
"""
import os
import sys

from google_auth_oauthlib.flow import InstalledAppFlow

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def main():
    client_id = os.environ.get("YOUTUBE_CLIENT_ID")
    client_secret = os.environ.get("YOUTUBE_CLIENT_SECRET")
    if not client_id or not client_secret:
        print(
            "환경변수 YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET 를 먼저 설정해주세요.",
            file=sys.stderr,
        )
        sys.exit(1)

    client_config = {
        "installed": {
            "client_id": client_id,
            "client_secret": client_secret,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": ["http://localhost"],
        }
    }

    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
    creds = flow.run_local_server(port=0)

    print("\n=== 아래 refresh_token 을 GitHub Secrets: YOUTUBE_REFRESH_TOKEN 에 등록하세요 ===")
    print(creds.refresh_token)


if __name__ == "__main__":
    main()
