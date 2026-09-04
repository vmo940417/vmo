"""
[일회성 실험 스크립트] 누리 사진 한 장 + 짧은 인사 음성으로 Replicate의 SadTalker(사진+음성
-> 말하는 얼굴 영상) 모델을 실제로 돌려보고 결과 URL을 로그에 출력한다.

정식 파이프라인에 아직 편입된 게 아니라, "반려동물 얼굴에 이 방식이 실제로 쓸만한 품질이
나오는지" 딱 한 번 확인해보기 위한 임시 테스트 스크립트다. 결과를 보고 괜찮으면
scripts/build_nuri_video.py 등으로 정식 편입하고, 어색하면 폐기하고 말풍선/자막 방식으로
간다.

실행(로컬에서는 REPLICATE_API_TOKEN이 없으므로 GitHub Actions에서 실행):
  REPLICATE_API_TOKEN=xxx PYTHONPATH=. python3 scripts/_lipsync_test.py
"""
import base64
import io
import os
import subprocess
import sys
import time

import requests
from PIL import Image

API_BASE = "https://api.replicate.com/v1"
MODEL = "cjwbw/sadtalker"
GREETING_TEXT = "오늘 하루도 힘내!"

POLL_TIMEOUT_SEC = 240
POLL_INTERVAL_SEC = 3


def _prepare_image(src_path: str, out_path: str, max_dim: int = 1024):
    img = Image.open(src_path).convert("RGB")
    w, h = img.size
    scale = min(1.0, max_dim / max(w, h))
    if scale < 1.0:
        img = img.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)
    img.save(out_path, "JPEG", quality=92)


def _synthesize_audio(text: str, out_wav_path: str):
    import asyncio
    import edge_tts

    import config

    mp3_path = out_wav_path + ".mp3"

    async def _run():
        communicate = edge_tts.Communicate(text, config.TTS_VOICE, rate=config.TTS_RATE, pitch=config.TTS_PITCH)
        with open(mp3_path, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])

    asyncio.run(_run())

    # SadTalker류 모델은 wav를 더 안정적으로 받는 경우가 많아 변환해둔다.
    subprocess.run(["ffmpeg", "-y", "-i", mp3_path, out_wav_path], check=True, capture_output=True)


def _to_data_uri(path: str, mime: str) -> str:
    with open(path, "rb") as f:
        b64 = base64.b64encode(f.read()).decode("ascii")
    return f"data:{mime};base64,{b64}"


def main():
    api_token = os.environ.get("REPLICATE_API_TOKEN")
    if not api_token:
        print("[lipsync_test] REPLICATE_API_TOKEN이 없습니다.", file=sys.stderr)
        sys.exit(1)

    src_image = sys.argv[1] if len(sys.argv) > 1 else "assets/nuri/01.jpg"
    work_dir = "output"
    os.makedirs(work_dir, exist_ok=True)
    prepared_image = os.path.join(work_dir, "lipsync_test_image.jpg")
    audio_wav = os.path.join(work_dir, "lipsync_test_audio.wav")

    print(f"[lipsync_test] 원본 이미지: {src_image}")
    _prepare_image(src_image, prepared_image)
    print(f"[lipsync_test] 인사 문구 TTS 생성: {GREETING_TEXT!r}")
    _synthesize_audio(GREETING_TEXT, audio_wav)

    image_data_uri = _to_data_uri(prepared_image, "image/jpeg")
    audio_data_uri = _to_data_uri(audio_wav, "audio/wav")

    headers = {
        "Authorization": f"Bearer {api_token}",
        "Content-Type": "application/json",
    }

    # cjwbw/sadtalker는 커뮤니티 모델이라 "owner/name" 단축 엔드포인트(공식 모델 전용)로는
    # 못 부른다 (실제로 404 확인함). 모델 정보를 먼저 조회해 최신 버전 해시를 얻은 뒤,
    # 범용 /v1/predictions 엔드포인트에 그 버전을 명시해서 호출해야 한다.
    print(f"[lipsync_test] {MODEL} 최신 버전 조회 중...")
    model_resp = requests.get(f"{API_BASE}/models/{MODEL}", headers=headers, timeout=30)
    model_resp.raise_for_status()
    version_id = model_resp.json()["latest_version"]["id"]
    print(f"[lipsync_test] 버전: {version_id}")

    print(f"[lipsync_test] Replicate({MODEL}) 예측 생성 요청 중...")
    create_resp = requests.post(
        f"{API_BASE}/predictions",
        headers=headers,
        json={
            "version": version_id,
            "input": {
                "source_image": image_data_uri,
                "driven_audio": audio_data_uri,
            }
        },
        timeout=60,
    )

    if not create_resp.ok:
        print(f"[lipsync_test] 예측 생성 실패: HTTP {create_resp.status_code}", file=sys.stderr)
        print(f"[lipsync_test] 응답 본문: {create_resp.text}", file=sys.stderr)
        create_resp.raise_for_status()

    prediction = create_resp.json()
    prediction_id = prediction["id"]
    print(f"[lipsync_test] prediction id={prediction_id}, status={prediction['status']}")

    deadline = time.monotonic() + POLL_TIMEOUT_SEC
    while prediction["status"] not in ("succeeded", "failed", "canceled"):
        if time.monotonic() > deadline:
            print(f"[lipsync_test] {POLL_TIMEOUT_SEC}초 내에 끝나지 않음 (status={prediction['status']})", file=sys.stderr)
            sys.exit(1)
        time.sleep(POLL_INTERVAL_SEC)
        poll_resp = requests.get(f"{API_BASE}/predictions/{prediction_id}", headers=headers, timeout=30)
        poll_resp.raise_for_status()
        prediction = poll_resp.json()
        print(f"[lipsync_test] status={prediction['status']}")

    if prediction["status"] != "succeeded":
        print(f"[lipsync_test] 실패: status={prediction['status']}, error={prediction.get('error')}", file=sys.stderr)
        sys.exit(1)

    print(f"[lipsync_test] 성공! output = {prediction['output']}")


if __name__ == "__main__":
    main()
