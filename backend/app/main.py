import io
import os
import secrets
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, HTTPException, Request, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from pypdf import PdfReader
from starlette.concurrency import run_in_threadpool

from app.agent import process_complaint_input

app = FastAPI(title="Pharma QMS API")


@app.middleware("http")
async def authenticate_api(request: Request, call_next):
    if request.url.path.startswith("/api/"):
        expected = os.getenv("QMS_API_KEY", "")
        supplied = request.headers.get("Authorization", "")

        if not expected:
            return JSONResponse(
                status_code=503,
                content={"detail": "API authentication is not configured"},
            )

        if not secrets.compare_digest(
            supplied.encode("utf-8"),
            ("Bearer " + expected).encode("utf-8"),
        ):
            return JSONResponse(
                status_code=401,
                content={"detail": "Unauthorized"},
            )

    return await call_next(request)


@app.get("/health")
async def health():
    return {"status": "ok"}


class ComplaintRequest(BaseModel):
    raw_text: str = Field(min_length=1, max_length=50000)
    existing_state: Optional[Dict[str, Any]] = None


async def analyze_text(raw_text, existing_state=None):
    result = await run_in_threadpool(
        process_complaint_input, raw_text, existing_state
    )

    if not isinstance(result, dict):
        raise HTTPException(status_code=502, detail="Invalid analysis response")

    if result.get("chat_response") == (
        "I encountered an error processing that request."
    ):
        raise HTTPException(status_code=502, detail="Analysis service failed")

    # This prototype does not check historical database records.
    result["possible_duplicate"] = None
    result["duplicate_check_status"] = "not_performed"

    return {"status": "success", "data": result}


@app.post("/api/analyze-complaint", operation_id="analyzeComplaint")
async def analyze_complaint(req: ComplaintRequest):
    return await analyze_text(req.raw_text, req.existing_state)


@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read(5 * 1024 * 1024 + 1)
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Maximum file size is 5 MB")

    try:
        filename = (file.filename or "").lower()
        if filename.endswith(".pdf"):
            reader = PdfReader(io.BytesIO(contents))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        elif filename.endswith(".txt"):
            text = contents.decode("utf-8")
        else:
            raise HTTPException(status_code=400, detail="Use a PDF or TXT file")
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Unable to read document")

    if not text.strip():
        raise HTTPException(status_code=400, detail="No selectable text found")
    if len(text) > 50000:
        raise HTTPException(status_code=413, detail="Maximum text length is 50000 characters")

    return await analyze_text(text)
