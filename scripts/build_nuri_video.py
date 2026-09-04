"""
output/{script.json, audio.mp3, duration.txt} 를 받아 '누리의 아침 인사' 영상(output/video.mp4)과
썸네일(output/thumbnail.jpg)을 만든다.

메인 명언 채널 파이프라인(build_video.py)과 의도적으로 다르게 설계했다 - 실제 채널
분석에서 나온 개선안을 반영한 것:
  - 브랜드 인트로/페이드인/음악 도입부 없이, 첫 프레임부터 바로 인사말이 보인다.
  - 단어 단위 자막 애니메이션 대신, 짧은 문장 전체를 말풍선 하나로 고정 노출한다
    (인사말이 20초짜리 명언보다 훨씬 짧아 굳이 줄바꿈 타이밍을 맞출 필요가 없음).
  - 배경음악 없이 내레이션만 사용해 도입부가 없다는 인상을 더 확실히 준다.

배경은 assets/nuri/에 넣어둔 누리 사진/영상 중 하나를 KST 날짜 기준으로 순환 선택한다
(song.py와 동일한 방식 - 무작위가 아니라 날짜 순번). 사진이면 천천히 줌인(Ken Burns),
영상 클립이면 목표 길이에 맞춰 자르거나 반복한다.
"""
import glob
import json
import os
import subprocess
import textwrap

from PIL import Image, ImageDraw, ImageFont

import config
import fonts

ASSETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "nuri")
_IMAGE_EXTS = ("*.jpg", "*.jpeg", "*.png")
_VIDEO_EXTS = ("*.mp4", "*.mov", "*.m4v")


def _list_assets():
    paths = []
    for pattern in _IMAGE_EXTS + _VIDEO_EXTS:
        paths.extend(glob.glob(os.path.join(ASSETS_DIR, pattern)))
    return sorted(paths)


def _pick_asset(today_ordinal: int):
    assets = _list_assets()
    if not assets:
        raise FileNotFoundError(
            f"{ASSETS_DIR}에 누리 사진/영상이 없습니다. 최소 1개는 넣어둬야 합니다."
        )
    path = assets[today_ordinal % len(assets)]
    kind = "video" if path.lower().endswith(_strip_glob(_VIDEO_EXTS)) else "image"
    return path, kind


def _strip_glob(patterns):
    return tuple(p.replace("*", "") for p in patterns)


def _cover_resize(img: Image.Image, target_w: int, target_h: int, vertical_anchor: float = 0.5) -> Image.Image:
    """비율을 유지한 채 목표 크기를 꽉 채우도록 리사이즈 후 크롭한다. vertical_anchor로
    세로 크롭 위치를 조절한다 (0.0=위쪽 유지, 0.5=중앙, 1.0=아래쪽 유지). 세로로 긴
    반려동물 사진을 가로로 넓은 썸네일(16:9)에 맞출 때, 중앙 크롭이면 얼굴이 위쪽으로
    잘려나가기 쉬워서 기본값보다 위쪽을 더 남기고 싶을 때 사용한다."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w, new_h = round(src_w * scale), round(src_h * scale)
    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = round((new_h - target_h) * vertical_anchor)
    return img.crop((left, top, left + target_w, top + target_h))


def _draw_bubble(bg: Image.Image, text: str, top_ratio: float = 0.08) -> Image.Image:
    """말풍선 스타일로 인사말 전체를 즉시(페이드인 없이) 보이게 그린다."""
    img = bg.convert("RGB")
    draw = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    font = ImageFont.truetype(fonts.bold_font_path(), 66)

    max_chars_per_line = 12
    lines = textwrap.wrap(text, width=max_chars_per_line) or [text]

    line_heights, line_widths = [], []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])

    padding_x, padding_y, line_gap = 48, 36, 16
    block_w = max(line_widths) + padding_x * 2
    block_h = sum(line_heights) + line_gap * (len(lines) - 1) + padding_y * 2
    block_x = (w - block_w) // 2
    block_y = int(h * top_ratio)

    draw.rounded_rectangle(
        [block_x, block_y, block_x + block_w, block_y + block_h],
        radius=36,
        fill=(255, 255, 255, 235),
    )
    # 말풍선 꼬리
    tail_cx = w // 2
    tail_top = block_y + block_h
    draw.polygon(
        [(tail_cx - 22, tail_top), (tail_cx + 22, tail_top), (tail_cx, tail_top + 28)],
        fill=(255, 255, 255, 235),
    )

    y = block_y + padding_y
    for line, lw, lh in zip(lines, line_widths, line_heights):
        x = (w - lw) // 2
        draw.text((x, y), line, font=font, fill=(30, 30, 30, 255))
        y += lh + line_gap

    return img


def _build_video_from_image(image_path: str, text: str, duration: float, out_dir: str):
    bg = _cover_resize(Image.open(image_path).convert("RGB"), config.VIDEO_WIDTH, config.VIDEO_HEIGHT)
    frame = _draw_bubble(bg, text)
    frame_path = os.path.join(out_dir, "nuri_frame.png")
    frame.save(frame_path)

    total_frames = max(1, round(duration * config.VIDEO_FPS))
    zoom_target = 1.10
    zoom_increment = (zoom_target - 1.0) / total_frames
    zoom_expr = f"min(zoom+{zoom_increment:.8f},{zoom_target})"
    video_filter = (
        f"[0:v]zoompan=z='{zoom_expr}':d={total_frames}:s={config.VIDEO_WIDTH}x{config.VIDEO_HEIGHT}"
        f":fps={config.VIDEO_FPS}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'[vout]"
    )
    cmd = [
        "ffmpeg", "-y",
        "-loop", "1", "-i", frame_path,
        "-i", os.path.join(out_dir, "audio.mp3"),
        "-filter_complex", video_filter,
        "-map", "[vout]", "-map", "1:a",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-t", f"{duration:.3f}",
        "-movflags", "+faststart",
        os.path.join(out_dir, "video.mp4"),
    ]
    subprocess.run(cmd, check=True)
    return image_path  # 썸네일은 여기서 원본 이미지를 다시 받아 별도로 구성한다


def _build_video_from_clip(video_path: str, text: str, duration: float, out_dir: str):
    # 말풍선을 투명 PNG로 따로 렌더링해서 원본 영상 위에 얹는다 (배경 자체가 움직이는
    # 영상이라 build_nuri_video처럼 프레임에 미리 구워넣을 수 없음).
    bubble = Image.new("RGBA", (config.VIDEO_WIDTH, config.VIDEO_HEIGHT), (0, 0, 0, 0))
    bubble = _draw_bubble_transparent(bubble, text)
    bubble_path = os.path.join(out_dir, "nuri_bubble.png")
    bubble.save(bubble_path)

    cmd = [
        "ffmpeg", "-y",
        "-stream_loop", "-1", "-i", video_path,
        "-i", bubble_path,
        "-i", os.path.join(out_dir, "audio.mp3"),
        "-filter_complex",
        f"[0:v]scale={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}:force_original_aspect_ratio=increase,"
        f"crop={config.VIDEO_WIDTH}:{config.VIDEO_HEIGHT}[bg];[bg][1:v]overlay=0:0[vout]",
        "-map", "[vout]", "-map", "2:a",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "160k",
        "-t", f"{duration:.3f}",
        "-movflags", "+faststart",
        os.path.join(out_dir, "video.mp4"),
    ]
    subprocess.run(cmd, check=True)

    # 썸네일은 원본 영상의 첫 프레임을 뽑아, main()에서 _build_thumbnail()로 별도 구성한다.
    first_frame_path = os.path.join(out_dir, "nuri_first_frame.png")
    subprocess.run(
        ["ffmpeg", "-y", "-i", video_path, "-frames:v", "1", first_frame_path],
        check=True, capture_output=True,
    )
    return first_frame_path


def _draw_bubble_transparent(canvas: Image.Image, text: str, top_ratio: float = 0.08) -> Image.Image:
    draw = ImageDraw.Draw(canvas, "RGBA")
    w, h = canvas.size
    font = ImageFont.truetype(fonts.bold_font_path(), 66)

    max_chars_per_line = 12
    lines = textwrap.wrap(text, width=max_chars_per_line) or [text]
    line_heights, line_widths = [], []
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        line_widths.append(bbox[2] - bbox[0])
        line_heights.append(bbox[3] - bbox[1])

    padding_x, padding_y, line_gap = 48, 36, 16
    block_w = max(line_widths) + padding_x * 2
    block_h = sum(line_heights) + line_gap * (len(lines) - 1) + padding_y * 2
    block_x = (w - block_w) // 2
    block_y = int(h * top_ratio)

    draw.rounded_rectangle(
        [block_x, block_y, block_x + block_w, block_y + block_h],
        radius=36,
        fill=(255, 255, 255, 235),
    )
    tail_cx = w // 2
    tail_top = block_y + block_h
    draw.polygon(
        [(tail_cx - 22, tail_top), (tail_cx + 22, tail_top), (tail_cx, tail_top + 28)],
        fill=(255, 255, 255, 235),
    )

    y = block_y + padding_y
    for line, lw, lh in zip(lines, line_widths, line_heights):
        x = (w - lw) // 2
        draw.text((x, y), line, font=font, fill=(30, 30, 30, 255))
        y += lh + line_gap

    return canvas


def _build_thumbnail(raw_image_path: str, text: str, out_dir: str):
    # 비디오 프레임(세로, 1080x1920)을 그대로 크롭하면 말풍선이 위쪽에 있어서 잘려나가
    # 버린다. 그래서 원본 이미지를 다시 받아 1280x720(16:9)에 맞춰 별도로 구성하고,
    # 말풍선도 그 안에서 잘리지 않게 새로 그린다.
    thumb_w, thumb_h = 1280, 720
    bg = _cover_resize(Image.open(raw_image_path).convert("RGB"), thumb_w, thumb_h, vertical_anchor=0.15)
    frame = _draw_bubble(bg, text, top_ratio=0.05)
    frame.save(os.path.join(out_dir, "thumbnail.jpg"), quality=92)


def main():
    out_dir = os.path.abspath(config.OUTPUT_DIR)

    with open(os.path.join(out_dir, "script.json"), "r", encoding="utf-8") as f:
        script_data = json.load(f)
    with open(os.path.join(out_dir, "duration.txt")) as f:
        duration = float(f.read().strip())

    import datetime
    import zoneinfo

    tz = zoneinfo.ZoneInfo(config.TIMEZONE)
    today_ordinal = datetime.datetime.now(tz).toordinal()
    asset_path, kind = _pick_asset(today_ordinal)
    print(f"[build_nuri_video] 오늘 배경: {os.path.basename(asset_path)} ({kind})")

    text = script_data["script"]
    if kind == "image":
        raw_thumb_source = _build_video_from_image(asset_path, text, duration, out_dir)
    else:
        raw_thumb_source = _build_video_from_clip(asset_path, text, duration, out_dir)

    _build_thumbnail(raw_thumb_source, text, out_dir)

    print(f"[build_nuri_video] video -> {os.path.join(out_dir, 'video.mp4')} (총 {duration:.1f}초)")


if __name__ == "__main__":
    main()
