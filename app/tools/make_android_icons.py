"""안드로이드 런처 아이콘 생성기.

    python tools/make_android_icons.py

웹앱과 같은 캔들 디자인을 안드로이드 밀도별로 뽑는다. 적응형 아이콘(API 26+)은
바깥 여백이 잘려나가므로 foreground 는 콘텐츠를 가운데로 크게 몰아 넣는다.

Pillow 는 아이콘을 만들 때만 필요하고 앱 실행에는 쓰이지 않는다.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_icons import BG, draw_icon  # noqa: E402

RES = Path(__file__).resolve().parents[2] / "android" / "app" / "src" / "main" / "res"

# 구형 런처용 정사각 아이콘 (dp 48 기준)
LEGACY = {"mdpi": 48, "hdpi": 72, "xhdpi": 96, "xxhdpi": 144, "xxxhdpi": 192}

# 적응형 아이콘 foreground (dp 108 기준). 바깥 25%가량이 마스크로 잘린다.
FOREGROUND = {"mdpi": 108, "hdpi": 162, "xhdpi": 216, "xxhdpi": 324, "xxxhdpi": 432}


def main() -> None:
    for density, size in LEGACY.items():
        out = RES / f"mipmap-{density}"
        out.mkdir(parents=True, exist_ok=True)
        img = draw_icon(size, margin_ratio=0.17, rounded=True)
        flat = Image.new("RGB", img.size, BG)
        flat.paste(img, mask=img.split()[3])
        flat.save(out / "ic_launcher.png")
        print(f"  mipmap-{density}/ic_launcher.png            {size}x{size}")

    for density, size in FOREGROUND.items():
        out = RES / f"mipmap-{density}"
        out.mkdir(parents=True, exist_ok=True)
        # 마스크에 잘려도 캔들이 살아남도록 여백을 크게 준다. 배경은 투명 —
        # 적응형 아이콘의 배경은 colors.xml 의 ic_launcher_background 가 깐다.
        draw_icon(size, margin_ratio=0.30, rounded=False).save(
            out / "ic_launcher_foreground.png")
        print(f"  mipmap-{density}/ic_launcher_foreground.png {size}x{size}")

    print(f"\n-> {RES}")


if __name__ == "__main__":
    main()
