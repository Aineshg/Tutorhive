from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    model: str | None = None
    system_prompt: str | None = None


class ChatResponse(BaseModel):
    output_text: str
    model: str