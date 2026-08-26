"""
내레이션 아래 깔릴 배경음악을 만든다.

방식: `assets/bgm/` 폴더에 있는 실제 음원 파일(mp3 등) 중 하나를 골라, 영상 길이에 맞게
자르거나 반복(loop)하고, ffmpeg의 loudnorm 필터로 라우드니스를 일정 목표치로 정규화한
뒤 내레이션과 함께 믹싱한다.

- `assets/bgm/`가 비어 있거나 기능이 아예 꺼져 있으면(BGM_ENABLED=0) False를 반환하고,
  호출하는 쪽(build_video.py)은 배경음악 없이 내레이션만으로 진행한다 (실패해도 파이프라인
  전체가 죽지 않는 기존 폴백 철학과 동일).
- 이전에는 외부 음원 없이 ffmpeg 사인파(코드 3화음)로 직접 합성했지만, 실제 업로드
  테스트에서 "리듬/멜로디 없는 웅~하는 저음 드론처럼 들린다"는 피드백을 받아 폐기함.
  진짜 멜로디/리듬이 있는 음악처럼 들리려면 실제 녹음된 음원이 필요하기 때문에, 사용자가
  유튜브 오디오 보관함(저작권 걱정 없는 무료 음원) 등에서 받은 실제 음원 파일을
  `assets/bgm/`에 넣어두는 방식으로 전환했다.
- 어떤 트랙을 쓰든 상대적 크기가 들쭉날쭉하지 않도록, 원본 파일의 raw 볼륨을 그대로 쓰는
  대신 loudnorm으로 목표 라우드니스(BGM_TARGET_LUFS, 기본 -25 LUFS)에 맞춰 정규화한다.
  이렇게 하면 새 트랙을 추가할 때마다 볼륨을 다시 맞춰볼 필요 없이 일관된 크기로 깔린다.
"""
import glob
import os
import subprocess
import sys

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "bgm")

# 배경음악으로 쓸 수 있는 오디오 확장자.
_AUDIO_EXTS = ("*.mp3", "*.m4a", "*.wav", "*.ogg")


def _list_tracks():
    tracks = []
    for pattern in _AUDIO_EXTS:
        tracks.extend(glob.glob(os.path.join(ASSETS_DIR, pattern)))
    return sorted(tracks)


def _pick_track(seed: int, tracks):
    return tracks[seed % len(tracks)]


def generate_bgm(duration: float, seed: int, out_path: str) -> bool:
    """성공하면 out_path에 배경음악 mp3를 만들고 True를, 실패/비활성화/음원 없음이면 False를 반환한다."""
    if os.environ.get("BGM_ENABLED", "1") != "1":
        return False
    if duration < 3:
        return False  # 너무 짧으면 페이드인/아웃만으로 꽉 차서 의미가 없음

    tracks = _list_tracks()
    if not tracks:
        # assets/bgm/에 음원을 아직 넣지 않은 상태 - 조용히 건너뛴다 (에러 아님).
        return False

    track = _pick_track(seed, tracks)
    fade = min(2.0, duration / 4)
    target_lufs = os.environ.get("BGM_TARGET_LUFS", "-25")
    # loudnorm으로 절대 라우드니스를 맞춘 뒤에도, 취향에 맞게 추가로 조정하고 싶을 때를
    # 위해 곱연산 볼륨 조절 여지를 남겨둔다 (기본 1.0 = loudnorm 결과 그대로 사용).
    extra_volume = os.environ.get("BGM_VOLUME", "1.0")

    af = (
        f"loudnorm=I={target_lufs}:TP=-2:LRA=11,"
        f"volume={extra_volume},"
        f"afade=t=in:d={fade:.2f},"
        f"afade=t=out:st={max(0.0, duration - fade):.2f}:d={fade:.2f}"
    )
    cmd = [
        "ffmpeg",
        "-y",
        "-stream_loop",
        "-1",  # 트랙이 영상보다 짧으면 반복 재생해서 길이를 채운다
        "-i",
        track,
        "-t",
        f"{duration:.3f}",
        "-af",
        af,
        "-ar",
        "44100",
        "-ac",
        "2",
        out_path,
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"[bgm] 생성 실패, 배경음악 없이 진행합니다 (track={track}): {exc}", file=sys.stderr)
        return False


if __name__ == "__main__":
    # 로컬에서 단독 실행해 결과를 미리 확인할 때 사용:
    #   PYTHONPATH=. python3 scripts/bgm.py
    print(f"assets/bgm/ 에서 찾은 트랙: {_list_tracks()}")
