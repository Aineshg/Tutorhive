# AI Master Standard Starter

Production-style starter for an AI backend using FastAPI and OpenAI Responses API.

## Features
- FastAPI app with health check and chat endpoint
- Environment-based configuration
- Structured request/response models
- Basic pytest test suite
- Docker support

## Quick Start
1. Create and activate a virtual environment.
2. Install dependencies:
   `pip install -r requirements.txt`
3. Copy env template:
   `copy .env.example .env` (Windows)
4. Set `OPENAI_API_KEY` in `.env`.
5. Run server:
   `uvicorn app.main:app --reload`

## Endpoints
- `GET /health`
- `POST /api/v1/chat`

## Example Chat Request
```json
{
  "message": "Give me a 3-step plan to learn linear algebra.",
  "model": "gpt-4.1-mini",
  "system_prompt": "You are a concise AI tutor."
}
```

## Run Tests
`pytest -q`

## Notes
- This project uses OpenAI Responses API through the official `openai` SDK.
- Keep `.env` secret and never commit API keys.