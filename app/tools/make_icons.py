"""PWA 아이콘 생성기.

    python tools/make_icons.py

캔들 세 개로 '급락 후 반등'을 그린다. 이 앱이 답하는 질문 자체가 그 모양이라
작은 사이즈에서도 무슨 앱인지 읽힌다. 텍스트를 쓰지 않아서 한글 폰트가 없는
환경에서도 동일하게 렌더링된다.

Pillow 는 아이콘을 만들 때만 필요하고 앱 실행에는 쓰이지 않으므로
requirements.txt 에 넣지 않는다.  pip install Pillow
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / "server" / "static" / "icons"

BG = (14, 17, 22)          # --bg
UP = (240, 97, 109)        # --up   (국내 관행: 상승 빨강)
DOWN = (74, 158, 255)      # --down (하락 파랑)
ACCENT = (214, 164, 76)    # --accent

# (색, 심지 시작, 심지 끝, 몸통 시작, 몸통 끝)  — 세로 위치는 0=위 1=아래
CANDLES = [
    (UP,     0.20, 0.62, 0.29, 0.54),
    (DOWN,   0.14, 0.93, 0.30, 0.86),   # 큰 음봉: 이 앱이 답하는 순간
    (ACCENT, 0.42, 0.82, 0.50, 0.74),
]


def draw_icon(size: int, margin_ratio: float, rounded: bool) -> Image.Image:
    # 안티에일리어싱을 위해 4배로 그리고 줄인다.
    scale = 4
    s = size * scale
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    if rounded:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.22), fill=BG)
    else:
        d.rectangle([0, 0, s - 1, s - 1], fill=BG)

    m = s * margin_ratio
    cw, ch = s - 2 * m, s - 2 * m           # 콘텐츠 영역
    slot = cw / len(CANDLES)
    body_w = slot * 0.46
    wick_w = max(scale, slot * 0.11)

    for i, (color, wick_a, wick_b, body_a, body_b) in enumerate(CANDLES):
        cx = m + slot * (i + 0.5)
        d.rounded_rectangle(
            [cx - wick_w / 2, m + ch * wick_a, cx + wick_w / 2, m + ch * wick_b],
            radius=wick_w / 2, fill=color,
        )
        d.rounded_rectangle(
            [cx - body_w / 2, m + ch * body_a, cx + body_w / 2, m + ch * body_b],
            radius=body_w * 0.22, fill=color,
        )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    specs = [
        ("icon-192.png", 192, 0.17, True, True),
        ("icon-512.png", 512, 0.17, True, True),
        # maskable 은 바깥 20%가 잘릴 수 있어 여백을 크게 준다.
        ("icon-maskable-512.png", 512, 0.28, False, False),
        # iOS 는 알파를 싫어하고 모서리를 알아서 깎는다.
        ("apple-touch-icon.png", 180, 0.17, False, False),
    ]

    for name, size, margin, rounded, keep_alpha in specs:
        img = draw_icon(size, margin, rounded)
        if not keep_alpha:
            flat = Image.new("RGB", img.size, BG)
            flat.paste(img, mask=img.split()[3])
            img = flat
        img.save(OUT / name)
        print(f"  {name:<26} {size}x{size}")

    # 파비콘
    draw_icon(64, 0.14, True).save(OUT / "favicon.png")
    print(f"  {'favicon.png':<26} 64x64")
    print(f"\n-> {OUT}")


if __name__ == "__main__":
    main()
