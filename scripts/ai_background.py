"""
Replicate API로 애니메 스타일의 배경(풍경) 이미지를 생성한다.

- 캐릭터/인물은 절대 넣지 않는다 (특정 저작권 캐릭터를 닮은 이미지가 나오는 걸 피하고,
  순수하게 "아침 분위기의 애니메풍 풍경"만 다루기 위해 프롬프트 문구로 명시적으로 배제한다.
  기본 모델(FLUX)은 negative_prompt를 지원하지 않으므로, "no people/characters" 지시를
  긍정 프롬프트 문장 안에 직접 녹여서 전달한다).
- REPLICATE_API_TOKEN 환경변수가 없거나, API 호출이 실패하거나, 어떤 이유로든 문제가 생기면
  None을 반환한다. 호출하는 쪽(build_video.py)은 이 경우 기존 절차적 그라디언트 배경으로
  자동 폴백하므로, 이 기능이 꺼져있거나 실패해도 파이프라인 전체가 죽지 않는다.

기본 모델은 Black Forest Labs의 FLUX Schnell(`black-forest-labs/flux-schnell`)이다.
Replicate가 공식으로 관리하는 모델이라 커뮤니티 모델보다 버전/가용성이 안정적이다.
다른 모델(예: 애니메 특화 커뮤니티 모델)을 쓰고 싶으면 AI_BACKGROUND_MODEL 환경변수로
바꿀 수 있는데, 그 경우 입력 파라미터 스키마가 다를 수 있으니 해당 모델의 Replicate
페이지에서 스키마를 먼저 확인하고 아래 input 구성을 맞춰 조정해야 한다.
"""
import io
import os
import random
import sys

import config

# 특정 작품/캐릭터를 연상시키지 않도록 "장면/분위기"만 다루는 소재 목록.
# seed 기준으로 하나씩 순환 사용해 매일 다른 그림이 나오게 한다.
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
    "cinematic lighting, highly detailed, masterpiece, empty scenery, "
    "no people, no characters, no text, no watermark"
)

MODEL = os.environ.get("AI_BACKGROUND_MODEL", "black-forest-labs/flux-schnell")


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
        import httpx
        import replicate
        import requests
        from PIL import Image
    except ImportError as exc:
        print(f"[ai_background] 필요한 패키지가 없어 건너뜁니다: {exc}", file=sys.stderr)
        return None

    scene = _pick_scene(seed)
    prompt = f"{scene}, {STYLE_SUFFIX}"

    try:
        # 모델이 한동안 호출되지 않아 "콜드 스타트"가 걸리면 첫 생성에 1분 이상 걸릴 수 있다.
        # 기본 타임아웃은 이보다 짧아서 실제로 생성 중인데 타임아웃으로 끊기는 경우가
        # 있었으므로(운영 중 실측), 넉넉하게 잡는다.
        client = replicate.Client(api_token=api_token, timeout=httpx.Timeout(280.0, connect=30.0))
        output = client.run(
            MODEL,
            input={
                "prompt": prompt,
                "aspect_ratio": "9:16",  # 최종 영상(1080x1920)과 동일한 세로 비율
                "output_format": "png",
                "num_outputs": 1,
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
        resp = requests_mod.get(output, timeout=120)
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
