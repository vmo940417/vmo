"""FastAPI 서버.

    uvicorn server.main:app --reload --port 8000
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, PlainTextResponse

from .pipeline import NotFound, diagnose, render_text

STATIC = Path(__file__).parent / "static"

app = FastAPI(
    title="장중 시세 원인 분석",
    description="종목을 입력하면 오늘 왜 그렇게 움직였는지 즉답합니다.",
    version="0.1.0",
)


@app.get("/", include_in_schema=False)
async def index() -> FileResponse:
    return FileResponse(STATIC / "index.html")


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "llm_enabled": bool(os.getenv("ANTHROPIC_API_KEY")),
        "model": os.getenv("STOCKWHY_MODEL", "claude-sonnet-5"),
    }


@app.get("/api/why")
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


@app.get("/api/why.txt", response_class=PlainTextResponse)
async def why_text(q: str = Query(..., min_length=1), llm: bool = Query(True)) -> str:
    """터미널에서 curl 로 바로 읽기 좋은 형태."""
    try:
        return render_text(await diagnose(q, use_llm=llm))
    except NotFound as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
