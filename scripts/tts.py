"""
output/script.json 의 script 텍스트를 음성으로 합성한다 (무료: Microsoft edge-tts).
결과물:
  - output/audio.mp3        : 내레이션 오디오
  - output/captions.srt     : 단어 단위 타이밍 자막 (build_video.py 가 자막을 줄 단위로 재구성)
  - output/duration.txt     : 오디오 길이(초, float)
"""
import asyncio
import json
import os
import subprocess

import edge_tts

import config


async def synthesize(text: str, audio_path: str, srt_path: str):
    communicate = edge_tts.Communicate(
        text,
        config.TTS_VOICE,
        rate=config.TTS_RATE,
        pitch=config.TTS_PITCH,
        # 기본값(SentenceBoundary)으로는 자막을 문장 단위로만 주기 때문에, 단어 단위
        # 타이밍이 필요한 build_video.py의 자막 재구성 로직을 위해 명시적으로 지정한다.
        boundary="WordBoundary",
    )
    submaker = edge_tts.SubMaker()

    with open(audio_path, "wb") as audio_file:
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_file.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                submaker.feed(chunk)

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(submaker.get_srt())


def probe_duration(audio_path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            audio_path,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def main():
    with open(os.path.join(config.OUTPUT_DIR, "script.json"), "r", encoding="utf-8") as f:
        data = json.load(f)

    audio_path = os.path.join(config.OUTPUT_DIR, "audio.mp3")
    srt_path = os.path.join(config.OUTPUT_DIR, "captions.srt")

    asyncio.run(synthesize(data["script"], audio_path, srt_path))

    duration = probe_duration(audio_path)
    with open(os.path.join(config.OUTPUT_DIR, "duration.txt"), "w") as f:
        f.write(str(duration))

    print(f"[tts] audio={audio_path} duration={duration:.2f}s srt={srt_path}")

    if duration > config.MAX_DURATION_SEC:
        print(
            f"[tts] 경고: 오디오 길이({duration:.1f}s)가 상한({config.MAX_DURATION_SEC}s)을 "
            "초과했습니다. 대본을 더 짧게 조정하는 것을 권장합니다."
        )


if __name__ == "__main__":
    main()
