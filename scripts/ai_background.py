"""
Replicate API로 애니메 스타일의 배경(풍경) 이미지를 생성한다.

- 캐릭터/인물은 절대 넣지 않는다 (특정 저작권 캐릭터를 닮은 이미지가 나오는 걸 피하고,
  순수하게 "아침 분위기의 애니메풍 풍경"만 다루기 위해 프롬프트와 negative_prompt로 제어).
- REPLICATE_API_TOKEN 환경변수가 없거나, API 호출이 실패하거나, 어떤 이유로든 문제가 생기면
  None을 반환한다. 호출하는 쪽(build_video.py)은 이 경우 기존 절차적 그라디언트 배경으로
  자동 폴백하므로, 이 기능이 꺼져있거나 실패해도 파이프라인 전체가 죽지 않는다.
"""
import io
import os
import random
import sys

import config

# SDXL 계열 모델의 일반적인 세로 버킷 해상도. 최종적으로는 build_video.py 쪽에서
# VIDEO_WIDTH x VIDEO_HEIGHT(1080x1920)에 맞춰 cover-fit으로 리사이즈/크롭한다.
GEN_WIDTH = 832
GEN_HEIGHT = 1216

NEGATIVE_PROMPT = (
    "text, watermark, signature, logo, caption, subtitle, frame, border, "
    "person, human, character, face, hands, body, animal, "
    "blurry, lowres, bad anatomy, deformed, worst quality, low quality, jpeg artifacts"
)

# 특정 작품/캐릭터를 연상시키지 않도록 "장면/분위기"만 다루는 소재 목록.
# 오늘 날짜 기준으로 하나씩 순환 사용해 매일 다른 그림이 나오게 한다.
SCENES = [
    "sunrise over misty mountains with layered clouds",
    "cozy window sill with a coffee cup, morning sunlight streaming in",
    "cherry blossom path with petals falling in soft morning glow",
    "quiet train station platform at dawn, warm golden light",
    "countryside road in morning mist, tall grass swaying",
    "city rooftops at sunrise under a soft pastel sky",
    "calm lake reflecting sunrise colors",
    "forest path with sunlight rays through the trees",
    "flower field at sunrise with a gentle breeze",
    "ocean horizon at dawn with soft waves",
    "meadow with morning dew and distant rolling hills",
    "desk by a window with sunrise light and a small plant",
]

STYLE_SUFFIX = (
    "japanese anime background art style, cel-shaded, vibrant sunrise colors, "
    "cinematic lighting, highly detailed, masterpiece, no characters, empty scenery"
)

MODEL = os.environ.get("AI_BACKGROUND_MODEL", "cjwbw/animagine-xl-3.1")


def _pick_scene(seed: int) -> str:
    return SCENES[seed % len(SCENES)]


def generate_ai_background(seed: int):
    """성공하면 PIL Image를, 실패/비활성화 상태면 None을 반환한다."""
    if os.environ.get("AI_BACKGROUND_ENABLED", "1") != "1":
        return None
    api_token = os.environ.get("REPLICATE_API_TOKEN")
    if not api_token:
        return None

    try:
        import replicate
        import requests
        from PIL import Image
    except ImportError as exc:
        print(f"[ai_background] 필요한 패키지가 없어 건너뜁니다: {exc}", file=sys.stderr)
        return None

    scene = _pick_scene(seed)
    prompt = f"{scene}, {STYLE_SUFFIX}"

    try:
        client = replicate.Client(api_token=api_token)
        output = client.run(
            MODEL,
            input={
                "prompt": prompt,
                "negative_prompt": NEGATIVE_PROMPT,
                "width": GEN_WIDTH,
                "height": GEN_HEIGHT,
                "guidance_scale": 7,
                "num_inference_steps": 28,
                "seed": seed,
            },
        )

        # Replicate 모델은 버전에 따라 URL 리스트, 단일 URL, 혹은 FileOutput 객체 등
        # 다양한 형태로 결과를 반환한다. 실제로 받은 형태에 맞춰 바이트를 확보한다.
        image_bytes = _extract_image_bytes(output, requests)
        if image_bytes is None:
            raise ValueError(f"예상치 못한 응답 형식: {type(output)}")

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        return _cover_resize(img, config.VIDEO_WIDTH, config.VIDEO_HEIGHT)

    except Exception as exc:  # AI 배경 생성 실패는 치명적이지 않음 - 폴백으로 진행
        print(f"[ai_background] 생성 실패, 절차적 배경으로 대체합니다: {exc}", file=sys.stderr)
        return None


def _extract_image_bytes(output, requests_mod):
    if isinstance(output, (list, tuple)) and output:
        output = output[0]

    if hasattr(output, "read"):  # FileOutput 등 파일류 객체
        return output.read()
    if isinstance(output, (bytes, bytearray)):
        return bytes(output)
    if isinstance(output, str) and output.startswith("http"):
        resp = requests_mod.get(output, timeout=60)
        resp.raise_for_status()
        return resp.content
    return None


def _cover_resize(img, target_w: int, target_h: int):
    """원본 비율을 유지한 채 목표 크기를 꽉 채우도록 리사이즈 후 중앙을 크롭한다."""
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w, new_h = round(src_w * scale), round(src_h * scale)
    from PIL import Image

    img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - target_w) // 2
    top = (new_h - target_h) // 2
    return img.crop((left, top, left + target_w, top + target_h))


if __name__ == "__main__":
    # 로컬에서 단독 실행해 결과를 미리 확인할 때 사용:
    #   REPLICATE_API_TOKEN=xxx PYTHONPATH=. python3 scripts/ai_background.py
    result = generate_ai_background(seed=random.randint(0, 10_000))
    if result is None:
        print("생성 실패 또는 비활성화 상태입니다 (REPLICATE_API_TOKEN 확인).")
    else:
        out_path = "ai_background_preview.png"
        result.save(out_path)
        print(f"저장됨: {out_path}")
