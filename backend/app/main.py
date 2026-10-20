import io
import os
import secrets
from fastapi import Request
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pypdf import PdfReader


from app.agent import process_complaint_input 

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ComplaintRequest(BaseModel):
    raw_text: str
    existing_state: Optional[Dict[str, Any]] = None


@app.post("/api/analyze-complaint")
async def analyze_complaint(req: ComplaintRequest):
    try:
        result = process_complaint_input(req.raw_text, req.existing_state)
        
        # -------------------------------------------------------------------
        # FIX: If this request is an UPDATE to an active form (existing_state exists),
        # force duplicate flags to False so it doesn't trigger the warning banner.
        # -------------------------------------------------------------------
        if req.existing_state and isinstance(result, dict):
            if "is_duplicate" in result:
                result["is_duplicate"] = False
            if "possible_duplicate" in result:
                result["possible_duplicate"] = False
            # If your dict nests fields inside an 'extracted_data' or 'analysis' key:
            if "analysis" in result and isinstance(result["analysis"], dict):
                result["analysis"]["is_duplicate"] = False
                result["analysis"]["possible_duplicate"] = False
        # -------------------------------------------------------------------

        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/upload-document")
async def upload_document(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        extracted_text = ""

        if file.filename.lower().endswith(".pdf"):
            pdf_stream = io.BytesIO(contents)
            pdf_reader = PdfReader(pdf_stream)
            for page in pdf_reader.pages:
                page_text = page.extract_text()
                if page_text:
                    extracted_text += page_text + "\n"
        else:
            extracted_text = contents.decode("utf-8", errors="ignore")

        if not extracted_text.strip():
            raise HTTPException(
                status_code=400, 
                detail="Could not extract text from the uploaded file. Ensure it contains selectable text."
            )

        result = process_complaint_input(extracted_text, {})
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

        return {"status": "success", "data": result}

    except Exception as e:
        print(f"Error processing upload: {e}")
        raise HTTPException(status_code=500, detail=str(e))
