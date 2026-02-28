from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.schemas import ChatRequest, ChatResponse
from app.services.openai_client import build_client

app = FastAPI(title="AI Master Standard API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/v1/chat", response_model=ChatResponse)
def chat(payload: ChatRequest) -> ChatResponse:
    settings = get_settings()
    if not settings.openai_api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY is not configured")

    client = build_client()
    model = payload.model or settings.default_model

    input_parts = []
    if payload.system_prompt:
        input_parts.append({"role": "system", "content": payload.system_prompt})
    input_parts.append({"role": "user", "content": payload.message})

    try:
        response = client.responses.create(model=model, input=input_parts)
        output_text = response.output_text or ""
    except Exception as exc:  # Keep starter simple while returning useful error surface.
        raise HTTPException(status_code=502, detail=f"Upstream model request failed: {exc}") from exc

    return ChatResponse(output_text=output_text, model=model)


@app.exception_handler(HTTPException)
def http_exception_handler(_, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})