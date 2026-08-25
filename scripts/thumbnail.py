"""output/script.json 을 바탕으로 YouTube 업로드용 썸네일(1280x720)을 만든다.

주의: 커스텀 썸네일 업로드(videos.thumbnails.set)는 유튜브 채널이 전화번호 인증을
완료한 경우에만 허용된다. 인증되지 않은 채널이면 업로드 자체는 성공하되 썸네일
설정 API 호출만 실패할 수 있으므로, upload_youtube.py 에서는 이 단계를 best-effort로
처리한다 (실패해도 영상 업로드 자체를 막지 않는다).
"""
import json
import os
import textwrap

from PIL import Image, ImageDraw, ImageFont

import config
import fonts
from background import make_background

THUMB_W, THUMB_H = 1280, 720


def build_thumbnail(category: str, title: str, seed: int) -> Image.Image:
    bg = make_background(category, seed, w=THUMB_W, h=THUMB_H).convert("RGB")
    draw = ImageDraw.Draw(bg, "RGBA")

    # 카테고리 태그
    tag_font = ImageFont.truetype(fonts.regular_font_path(), 32)
    tag_text = category
    bbox = draw.textbbox((0, 0), tag_text, font=tag_font)
    tag_w, tag_h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    tag_pad_x, tag_pad_y = 24, 14
    tag_x, tag_y = 60, 56
    draw.rounded_rectangle(
        [tag_x, tag_y, tag_x + tag_w + tag_pad_x * 2, tag_y + tag_h + tag_pad_y * 2],
        radius=14,
        fill=(255, 255, 255, 230),
    )
    draw.text((tag_x + tag_pad_x, tag_y + tag_pad_y - 2), tag_text, font=tag_font, fill=(20, 20, 20, 255))

    # 제목 (큰 볼드체, 그림자로 가독성 확보)
    title_font = ImageFont.truetype(fonts.bold_font_path(), 92)
    lines = textwrap.wrap(title, width=10) or [title]
    lines = lines[:3]

    line_heights = []
    for line in lines:
        b = draw.textbbox((0, 0), line, font=title_font)
        line_heights.append(b[3] - b[1])
    line_gap = 16
    block_h = sum(line_heights) + line_gap * (len(lines) - 1)
    y = (THUMB_H - block_h) // 2 + 30

    for line, lh in zip(lines, line_heights):
        b = draw.textbbox((0, 0), line, font=title_font)
        lw = b[2] - b[0]
        x = 60
        shadow_offset = 6
        draw.text((x + shadow_offset, y + shadow_offset), line, font=title_font, fill=(0, 0, 0, 160))
        draw.text((x, y), line, font=title_font, fill=(255, 255, 255, 255))
        y += lh + line_gap

    return bg


def main():
    with open(os.path.join(config.OUTPUT_DIR, "script.json"), "r", encoding="utf-8") as f:
        data = json.load(f)

    seed = abs(hash(data["title"])) % (2**31)
    img = build_thumbnail(data["category"], data["title"], seed)
    out_path = os.path.join(config.OUTPUT_DIR, "thumbnail.jpg")
    img.save(out_path, quality=92)
    print(f"[thumbnail] saved -> {out_path}")


if __name__ == "__main__":
    main()
