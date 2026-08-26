"""
내레이션 아래 아주 은은하게 깔릴 배경음악을, 외부 음원 파일 없이 ffmpeg 오디오 필터만으로
절차적으로 생성한다.

- 외부 음원을 전혀 쓰지 않으므로 저작권/라이선스 문제가 원천적으로 없다 (배경 이미지의
  절차적 그라디언트 폴백과 같은 발상).
- '진짜 곡'이라기보다는 부드러운 패드 톤(코드 3음 + 완만한 트레몰로 + 로우패스)에 가까우며,
  내레이션을 방해하지 않도록 아주 낮은 볼륨으로 렌더링한다.
- 실패(ffmpeg 미설치/오류 등)해도 파이프라인 전체가 죽지 않도록 예외를 잡아 False를
  반환하고, 호출하는 쪽(build_video.py)은 이 경우 배경음악 없이 내레이션만으로 진행한다.
"""
import os
import subprocess
import sys

# 매일 다른 분위기를 주기 위한 코드 목록 (저음역대 3화음, Hz 단위).
# "아침을 여는 활력 명언" 채널 특성상 전반적으로 밝고 경쾌한 인상을 주는 게 목표라,
# 어둡거나 쓸쓸하게 들릴 수 있는 단조는 배제하고 전부 장3화음만 사용한다.
CHORDS = [
    (130.81, 164.81, 196.00),  # C major (C3-E3-G3)
    (146.83, 185.00, 220.00),  # D major (D3-F#3-A3)
    (164.81, 207.65, 246.94),  # E major (E3-G#3-B3)
    (87.31, 110.00, 130.81),   # F major (F2-A2-C3)
    (98.00, 123.47, 146.83),   # G major (G2-B2-D3)
    (110.00, 138.59, 164.81),  # A major (A2-C#3-E3)
]


def _pick_chord(seed: int):
    return CHORDS[seed % len(CHORDS)]


def generate_bgm(duration: float, seed: int, out_path: str) -> bool:
    """성공하면 out_path에 배경음악 mp3를 만들고 True를, 실패/비활성화 상태면 False를 반환한다."""
    if os.environ.get("BGM_ENABLED", "1") != "1":
        return False
    if duration < 3:
        return False  # 너무 짧으면 페이드인/아웃만으로 꽉 차서 의미가 없음

    freqs = _pick_chord(seed)
    fade = min(2.0, duration / 4)
    bgm_volume = os.environ.get("BGM_VOLUME", "0.15")

    filter_complex = (
        f"[0:a][1:a][2:a]amix=inputs=3:duration=longest:normalize=0,"
        f"tremolo=f=0.15:d=0.25,"
        f"lowpass=f=1400,"
        f"volume={bgm_volume},"
        f"afade=t=in:d={fade:.2f},"
        f"afade=t=out:st={max(0.0, duration - fade):.2f}:d={fade:.2f}"
        "[aout]"
    )
    cmd = ["ffmpeg", "-y"]
    for f in freqs:
        cmd += ["-f", "lavfi", "-i", f"sine=frequency={f}:duration={duration:.3f}:sample_rate=44100"]
    cmd += [
        "-filter_complex", filter_complex,
        "-map", "[aout]",
        "-t", f"{duration:.3f}",
        out_path,
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError) as exc:
        print(f"[bgm] 생성 실패, 배경음악 없이 진행합니다: {exc}", file=sys.stderr)
        return False
