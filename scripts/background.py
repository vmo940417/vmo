"""카테고리 색상을 이용해 세로형(1080x1920) 그라디언트 배경 이미지를 만든다.
외부 스톡 영상/이미지 라이선스 문제를 피하기 위해 전부 코드로 생성한다.
"""
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

import config


def _hex_to_rgb(h: str):
    h = h.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


def make_background(category: str, seed: int, w: int = None, h: int = None) -> Image.Image:
    top_hex, bottom_hex = config.CATEGORY_COLORS.get(category, ("#141e30", "#243b55"))
    top = np.array(_hex_to_rgb(top_hex), dtype=np.float64)
    bottom = np.array(_hex_to_rgb(bottom_hex), dtype=np.float64)

    w = w or config.VIDEO_WIDTH
    h = h or config.VIDEO_HEIGHT
    rng = np.random.default_rng(seed)

    # 세로 그라디언트를 float 정밀도로 계산한다.
    t = (np.linspace(0.0, 1.0, h) ** 0.85)[:, None]  # (h, 1)
    grad = top[None, :] * (1 - t) + bottom[None, :] * t  # (h, 3)

    # 어두운 그라디언트는 8bit로 그대로 양자화하면 색 밴딩(계단 무늬)이 눈에 띄기 쉬우므로,
    # 아주 약한 랜덤 노이즈를 섞어 디더링한 뒤 반올림한다.
    dither = rng.normal(0.0, 1.2, size=(h, 3))
    grad = np.clip(grad + dither, 0, 255)

    arr = np.repeat(grad[:, None, :], w, axis=1).astype(np.uint8)  # (h, w, 3)
    img = Image.fromarray(arr, mode="RGB")

    # 은은한 원형 광원 몇 개를 얹어서 밋밋하지 않게
    overlay = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    py_rng = random.Random(seed)
    for _ in range(5):
        r = py_rng.randint(int(w * 0.25), int(w * 0.55))
        cx = py_rng.randint(0, w)
        cy = py_rng.randint(0, h)
        alpha = py_rng.randint(18, 36)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(255, 255, 255, alpha))
    overlay = overlay.filter(ImageFilter.GaussianBlur(120))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    # 가독성을 위해 상/하단에 살짝 어두운 비네트.
    # 다항식(전 구간에서 매끄럽고 꺾이는 지점이 없음)을 사용해, clamp된 smoothstep이
    # 만드는 곡률 불연속 지점에서 눈에 띄는 마하밴드(가짜 이음선처럼 보이는 착시)를 피한다.
    y = np.linspace(0.0, 1.0, h)
    top_alpha = 0.30 * (1 - y) ** 4
    bottom_alpha = 0.42 * y**4
    vign = top_alpha + bottom_alpha  # (h,)
    vign_arr = np.repeat((vign * 255)[:, None], w, axis=1).astype(np.uint8)
    vignette = Image.fromarray(vign_arr, mode="L")

    black = Image.new("RGB", (w, h), (0, 0, 0))
    img = Image.composite(black, img, vignette)

    return img
