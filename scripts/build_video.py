"""
output/{script.json, audio.mp3, captions.srt, duration.txt} 를 받아
최종 쇼츠 영상(output/video.mp4)을 만든다.

구성:
  1) 배경 이미지 준비: REPLICATE_API_TOKEN이 있으면 애니메 풍경 이미지를 AI로 생성하고
     (ai_background.py), 없거나 실패하면 카테고리 색상의 그라디언트로 대체한다 (background.py)
  2) 제목 텍스트를 상단에 오버레이한 배경(background_title.png) 생성 (PIL)
  3) 단어 단위 자막(SRT)을 읽기 좋은 줄 단위로 재구성해 .ass 자막으로 저장 (srt_utils.py)
  4) assets/bgm/의 실제 음원으로 배경음악 준비 (bgm.py), 음원이 없거나 비활성화 시 내레이션만 사용
  5) ffmpeg로 배경(천천히 줌인) + 내레이션(+배경음악) + 자막을 하나의 mp4로 합성
"""
import json
import os
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageFont

import config
import fonts
from ai_background import generate_ai_background
from background import make_background
from bgm import generate_bgm
from srt_utils import group_cues, parse_srt, write_ass


def _draw_title(bg: Image.Image, title: str) -> Image.Image:
    img = bg.convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")
    font = ImageFont.truetype(fonts.bold_font_path(), 78)

    max_chars_per_line = 11
    lines = textwrap.wrap(title, width=max_chars_per_line) or [title]

    line_heights = []
    line_widths = []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])

    padding_x, padding_y, line_gap = 56, 40, 18
    block_w = max(line_widths) + padding_x * 2
    block_h = sum(line_heights) + line_gap * (len(lines) - 1) + padding_y * 2
    block_x = (config.VIDEO_WIDTH - block_w) // 2
    block_y = int(config.VIDEO_HEIGHT * 0.10)

    draw.rounded_rectangle(
        [block_x, block_y, block_x + block_w, block_y + block_h],
        radius=32,
        fill=(0, 0, 0, 120),
    )

    y = block_y + padding_y
    for line, lw, lh in zip(lines, line_widths, line_heights):
        x = (config.VIDEO_WIDTH - lw) // 2
        draw.text((x, y), line, font=font, fill=(255, 255, 255, 255))
        y += lh + line_gap

    return img


def _build_caption_ass(raw_srt_path: str, out_path: str):
    with open(raw_srt_path, "r", encoding="utf-8") as f:
        word_cues = parse_srt(f.read())
    grouped = group_cues(word_cues, max_chars=14)
    write_ass(
        grouped,
        out_path,
        play_res_x=config.VIDEO_WIDTH,
        play_res_y=config.VIDEO_HEIGHT,
        font_name="NanumGothic",
        font_size=64,
        margin_v=260,
        margin_lr=60,
    )


def _run_ffmpeg(cwd: str, duration: float, has_bgm: bool):
    total_frames = max(1, round(duration * config.VIDEO_FPS))
    # 최종 배율(1.12배)에 도달하는 시점이 영상 길이와 무관하게 항상 6~7초 근처로 고정되어
    # 있으면, 영상이 길어질수록 뒷부분이 줌 없이 정지된 것처럼 밋밋해 보인다.
    # 따라서 프레임당 증가폭을 총 프레임 수에 비례하게 계산해, 줌인이 클립 전체 길이에
    # 걸쳐 고르게 진행되도록 한다.
    zoom_target = 1.12
    zoom_increment = (zoom_target - 1.0) / total_frames
    zoom_expr = f"min(zoom+{zoom_increment:.8f},{zoom_target})"
    video_filter = (
        f"[0:v]zoompan=z='{zoom_expr}':d={total_frames}:s={config.VIDEO_WIDTH}x{config.VIDEO_HEIGHT}"
        f":fps={config.VIDEO_FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)',"
        f"subtitles=captions.ass:fontsdir=/usr/share/fonts[vout]"
    )

    inputs = ["-loop", "1", "-i", "background_title.png", "-i", "audio.mp3"]
    if has_bgm:
        # 배경음악은 내레이션과 별도 트랙으로 섞는다. normalize=0으로 amix해서 내레이션
        # 볼륨이 절반으로 깎이지 않게 하고(배경음악은 이미 bgm.py에서 loudnorm으로 목표
        # 라우드니스에 맞춰 렌더링됨), 대신 두 트랙을 그대로 더한다.
        inputs += ["-i", "bgm.mp3"]
        filter_complex = (
            f"{video_filter};"
            f"[1:a][2:a]amix=inputs=2:duration=first:normalize=0[aout]"
        )
        audio_map = "[aout]"
    else:
        filter_complex = video_filter
        audio_map = "1:a"

    cmd = [
        "ffmpeg",
        "-y",
        *inputs,
        "-filter_complex",
        filter_complex,
        "-map",
        "[vout]",
        "-map",
        audio_map,
        "-c:v",
        "libx264",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "160k",
        "-t",
        f"{duration:.3f}",
        "-movflags",
        "+faststart",
        "video.mp4",
    ]
    subprocess.run(cmd, cwd=cwd, check=True)


def main():
    out_dir = os.path.abspath(config.OUTPUT_DIR)

    with open(os.path.join(out_dir, "script.json"), "r", encoding="utf-8") as f:
        script_data = json.load(f)
    with open(os.path.join(out_dir, "duration.txt")) as f:
        duration = float(f.read().strip())

    seed = abs(hash(script_data["title"])) % (2**31)
    bg = generate_ai_background(seed)
    if bg is None:
        bg = make_background(script_data["category"], seed)
    else:
        print("[build_video] AI 배경(Replicate) 사용")
    bg_with_title = _draw_title(bg, script_data["title"])
    bg_with_title.save(os.path.join(out_dir, "background_title.png"))

    _build_caption_ass(
        os.path.join(out_dir, "captions.srt"),
        os.path.join(out_dir, "captions.ass"),
    )

    has_bgm = generate_bgm(duration, seed, os.path.join(out_dir, "bgm.mp3"))
    if has_bgm:
        print("[build_video] 배경음악 추가")

    _run_ffmpeg(out_dir, duration, has_bgm)

    print(f"[build_video] video -> {os.path.join(out_dir, 'video.mp4')}")


if __name__ == "__main__":
    main()
