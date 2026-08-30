"""
나레이션(+배경음악) 구간이 끝난 뒤에 이어붙일 '자작곡' 구간을 준비한다.

bgm.py는 여러 트랙 중 하나를 매일 자동으로 순환 선택하지만, 이 모듈은 다르다 - 사용자가
그때그때 원하는 곡을 직접 골라 assets/song/ 폴더에 넣어두는 방식이라, 폴더 안의 곡을
그대로(자동 순환 없이) 사용한다. 곡을 바꾸고 싶으면 이 폴더의 파일을 교체하면 된다.

- assets/song/가 비어 있거나 기능이 꺼져 있으면(SONG_ENABLED=0) (None, 0.0)을 반환하고,
  호출하는 쪽(build_video.py)은 자작곡 구간 없이(기존처럼 나레이션 길이만큼만) 진행한다
  (assets/bgm 없을 때와 동일한 폴백 철학).
- 원본 파일의 라우드니스가 제각각이어도 일정하게 들리도록 loudnorm으로 정규화한다.
  나레이션 구간보다 "메인으로 듣는 음악"에 가까우므로 bgm.py의 배경음악 목표치보다
  살짝 크게(SONG_TARGET_LUFS, 기본 -16 LUFS) 잡는다.
"""
import glob
import os
import subprocess
import sys

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "song")

# 자작곡으로 쓸 수 있는 오디오 확장자.
_AUDIO_EXTS = ("*.mp3", "*.m4a", "*.wav", "*.ogg")


def _list_tracks():
    tracks = []
    for pattern in _AUDIO_EXTS:
        tracks.extend(glob.glob(os.path.join(ASSETS_DIR, pattern)))
    return tracks


def _pick_track(tracks):
    # 폴더에는 보통 곡을 하나만 넣어두는 걸 권장하지만, 혹시 여러 개가 있으면 가장 최근에
    # 교체(수정)된 파일을 "지금 지정된 곡"으로 간주해 사용한다.
    return max(tracks, key=os.path.getmtime)


def _probe_duration(path: str) -> float:
    result = subprocess.run(
        [
            "ffprobe",
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            path,
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    return float(result.stdout.strip())


def prepare_song(out_path: str):
    """assets/song/에 지정된 곡을 찾아 라우드니스를 정규화해 out_path에 저장하고
    (out_path, duration_sec)을 반환한다. 곡이 없거나 비활성화 상태면 (None, 0.0)."""
    if os.environ.get("SONG_ENABLED", "1") != "1":
        return None, 0.0

    tracks = _list_tracks()
    if not tracks:
        # assets/song/에 아직 곡을 넣지 않은 상태 - 조용히 건너뛴다 (에러 아님).
        return None, 0.0

    track = _pick_track(tracks)
    target_lufs = os.environ.get("SONG_TARGET_LUFS", "-16")
    cmd = [
        "ffmpeg",
        "-y",
        "-i", track,
        "-af", f"loudnorm=I={target_lufs}:TP=-1.5:LRA=11,afade=t=in:d=0.5",
        "-ar", "44100",
        "-ac", "2",
        out_path,
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        duration = _probe_duration(out_path)
        return out_path, duration
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"[song] 자작곡 처리 실패, 곡 없이 진행합니다 (track={track}): {exc}", file=sys.stderr)
        return None, 0.0


if __name__ == "__main__":
    # 로컬에서 단독 실행해 결과를 미리 확인할 때 사용:
    #   PYTHONPATH=. python3 scripts/song.py
    tracks = _list_tracks()
    print(f"assets/song/ 에서 찾은 곡: {tracks}")
    if tracks:
        picked = _pick_track(tracks)
        print(f"지정된 곡: {picked} ({_probe_duration(picked):.1f}초)")
