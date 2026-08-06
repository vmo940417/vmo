"""FastAPI 서버.

    uvicorn server.main:app --port 8000                 # 이 PC에서만
    uvicorn server.main:app --host 0.0.0.0 --port 8000  # 같은 와이파이의 폰에서도

또는 `python -m server.cli serve` 를 쓰면 접속 주소까지 안내해 준다.
"""

from __future__ import annotations

from pathlib import Path

import hmac
from typing import Optional

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse
from fastapi.staticfiles import StaticFiles

from .config import access_token, has_api_key, load_env, model_name, setup_tls
from .pipeline import NotFound, diagnose, render_text

load_env()
setup_tls()   # 회사망 TLS 검사 장비 대응. httpx 클라이언트를 만들기 전에 해야 한다.

STATIC = Path(__file__).parent / "static"

app = FastAPI(
    title="장중 시세 원인 분석",
    description="종목을 입력하면 오늘 왜 그렇게 움직였는지 즉답합니다.",
    version="0.2.0",
)

app.mount("/static", StaticFiles(directory=STATIC), name="static")


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/sw.js", include_in_schema=False)
async def service_worker() -> FileResponse:
    """서비스 워커는 스코프가 자기 경로 이하라서 반드시 루트에서 서빙해야 한다."""
    return FileResponse(
        STATIC / "sw.js",
        media_type="application/javascript",
        headers={"Cache-Control": "no-cache", "Service-Worker-Allowed": "/"},
    )


@app.get("/manifest.webmanifest", include_in_schema=False)
async def manifest() -> FileResponse:
    return FileResponse(STATIC / "manifest.webmanifest",
                        media_type="application/manifest+json")


async def require_token(
    x_token: Optional[str] = Header(default=None, alias="X-Token"),
    t: Optional[str] = Query(default=None, description="STOCKWHY_TOKEN 설정 시 필요"),
) -> None:
    """STOCKWHY_TOKEN 이 설정된 경우에만 검사한다(미설정이면 통과)."""
    expected = access_token()
    if expected is None:
        return
    supplied = x_token or t or ""
    # 타이밍 공격 방지를 위해 상수 시간 비교.
    if not hmac.compare_digest(supplied, expected):
        raise HTTPException(status_code=401, detail="토큰이 필요합니다.")


@app.get("/api/health")
async def health() -> dict:
    """토큰 없이도 응답한다. 프론트가 잠금 여부를 알아야 하기 때문."""
    return {
        "ok": True,
        "llm_enabled": has_api_key(),
        "model": model_name(),
        "auth_required": access_token() is not None,
    }


@app.get("/api/why", dependencies=[Depends(require_token)])
async def why(
    q: str = Query(..., min_length=1, description="종목명 또는 6자리 종목코드"),
    llm: bool = Query(True, description="LLM 서술 사용 여부"),
) -> dict:
    try:
        return await diagnose(q, use_llm=llm)
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"{type(e).__name__}: {e}") from e


@app.get("/api/why.txt", response_class=PlainTextResponse,
         dependencies=[Depends(require_token)])
async def why_text(q: str = Query(..., min_length=1), llm: bool = Query(True)) -> str:
    """터미널에서 curl 로 바로 읽기 좋은 형태."""
    try:
        return render_text(await diagnose(q, use_llm=llm))
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
