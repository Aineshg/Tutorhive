from pathlib import Path
from tempfile import NamedTemporaryFile

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .detector import DeepfakeVideoDetector

BASE_DIR = Path(__file__).resolve().parents[2]
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Deepfake Detection and Misinterpretation of AI",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")

detector = DeepfakeVideoDetector()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.post("/api/analyze-video")
async def analyze_video(video: UploadFile = File(...)) -> dict:
    if not video.filename:
        raise HTTPException(status_code=400, detail="No file name provided.")

    if not video.content_type or not video.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="Please upload a valid video file.")

    suffix = Path(video.filename).suffix or ".mp4"
    with NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        data = await video.read()
        if not data:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")
        tmp.write(data)
        temp_path = Path(tmp.name)

    try:
        result = detector.analyze_video(temp_path)
        return {
            "project_title": "Deepfake Detection and Misinterpretation of AI",
            "file_name": video.filename,
            **result,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=500, detail=f"Analysis failed: {exc}") from exc
    finally:
        temp_path.unlink(missing_ok=True)
